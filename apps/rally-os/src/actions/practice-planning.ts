'use server'

import { prisma } from '@rally/core-data'
import {
  buildPracticePlan,
  generatePlayerTrendSuggestions,
  type CoachPracticeVersion,
  type PlayerPracticeVersion,
} from '@rally/ai'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getActiveTeamSeason } from '../lib/portal-data'

export type GeneratePlanResult =
  | { ok: true; coach: CoachPracticeVersion; player: PlayerPracticeVersion; planId: string }
  | { ok: false; error: string }

const formSchema = z.object({
  practiceDate: z.string().trim().min(1, 'Practice date is required.'),
  duration: z.string().trim().min(1, 'Duration is required.'),
  location: z.string().trim().min(1, 'Location is required.'),
  teamFocus: z.string().trim().min(1, 'Team focus is required.'),
})

/**
 * Generate an AI practice plan for the active TeamSeason, persist the structured
 * plan plus its COACH and PLAYER versions, and save the extracted drills and
 * template into the reusable library.
 */
export async function generatePracticePlan(formData: FormData): Promise<GeneratePlanResult> {
  const parsed = formSchema.safeParse({
    practiceDate: formData.get('practiceDate'),
    duration: formData.get('duration'),
    location: formData.get('location'),
    teamFocus: formData.get('teamFocus'),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input.' }
  }

  const teamSeason = await getActiveTeamSeason()
  if (!teamSeason) {
    return { ok: false, error: 'No active TeamSeason. Set one up in Team Info first.' }
  }

  try {
    // ── Gather context from the system of record ──────────────────────────────
    const [rosterEntries, snapshots, notes, drills] = await Promise.all([
      prisma.rosterEntry.findMany({
        where: { teamSeasonId: teamSeason.id, isActive: true },
        include: { player: true },
      }),
      prisma.gameChangerStatSnapshot.findMany({
        where: { teamSeasonId: teamSeason.id },
        orderBy: { capturedAt: 'desc' },
        take: 20,
        include: { player: true },
      }),
      prisma.coachNote.findMany({
        where: { teamSeasonId: teamSeason.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      // Team drills plus the global predefined library (teamSeasonId null),
      // e.g. the seeded Elite Softball 4-Year Mastermind drill bank.
      prisma.drill.findMany({
        where: {
          drillLibrary: { OR: [{ teamSeasonId: teamSeason.id }, { teamSeasonId: null }] },
        },
        take: 170,
      }),
    ])

    const playerName = (p: { fullName: string | null; firstName: string | null; lastName: string | null }) =>
      p.fullName?.trim() || [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Unnamed Player'

    const availableCoaches = [teamSeason.head_coach, teamSeason.assistant_coaches]
      .filter((c): c is string => Boolean(c && c.trim()))
      .flatMap((c) => c.split(',').map((s) => s.trim()))
      .filter(Boolean)

    const result = await buildPracticePlan({
      teamId: teamSeason.id,
      teamSeasonId: teamSeason.id,
      practiceDate: parsed.data.practiceDate,
      duration: parsed.data.duration,
      location: parsed.data.location,
      teamFocus: parsed.data.teamFocus,
      recentGameStats: snapshots.map(
        (s) =>
          `${s.player ? playerName(s.player) : 'Team'}: AVG ${s.avg ?? '—'}, AB ${s.ab ?? 0}, RBI ${s.rbi ?? 0}, HR ${s.hr ?? 0} (${s.result})`,
      ),
      recentPlayerNotes: notes.map((n) => n.body),
      availableCoaches,
      availablePlayers: rosterEntries.map((e) => playerName(e.player)),
      drillLibrary: drills.map((d) =>
        d.category ? `${d.name} (${d.category}${d.durationMinutes ? `, ${d.durationMinutes} min` : ''})` : d.name,
      ),
    })

    // ── Persist the plan + both versions ──────────────────────────────────────
    const plan = await prisma.practicePlan.create({
      data: {
        teamSeasonId: teamSeason.id,
        practiceDate: new Date(parsed.data.practiceDate),
        location: parsed.data.location,
        teamFocus: parsed.data.teamFocus,
        status: 'draft',
        aiModel: 'claude-sonnet-4-6',
        versions: {
          create: [
            { type: 'COACH', content: result.coach },
            { type: 'PLAYER', content: result.player },
          ],
        },
      },
    })

    // ── Save reusable drills + template into the library ──────────────────────
    const library = await prisma.drillLibrary.upsert({
      where: { id: `lib-${teamSeason.id}` },
      update: {},
      create: { id: `lib-${teamSeason.id}`, teamSeasonId: teamSeason.id, name: 'Team Drill Library' },
    })

    if (result.drills.length > 0) {
      await prisma.drill.createMany({
        data: result.drills.map((d) => ({
          drillLibraryId: library.id,
          name: d.name,
          category: d.category,
          durationMinutes: d.durationMinutes,
          description: d.description,
          instructions: d.instructions,
          equipment: d.equipment,
          focusTags: d.focusTags,
          source: 'ai',
        })),
      })
    }

    await prisma.practiceTemplate.create({
      data: {
        teamSeasonId: teamSeason.id,
        name: result.template.name,
        description: result.template.description,
        blocks: result.template.blocks,
        source: 'ai',
      },
    })

    revalidatePath('/practice-planning')
    return { ok: true, coach: result.coach, player: result.player, planId: plan.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate practice plan.'
    return { ok: false, error: message }
  }
}

export type GenerateSuggestionsResult =
  | { ok: true; created: number }
  | { ok: false; error: string }

/**
 * Generate advisory player-trend suggestions and persist them as advisory
 * DevelopmentFocus rows + ai-tagged CoachNotes. Advisory only — never edits
 * any other field.
 */
export async function generatePlayerSuggestions(): Promise<GenerateSuggestionsResult> {
  const teamSeason = await getActiveTeamSeason()
  if (!teamSeason) {
    return { ok: false, error: 'No active TeamSeason. Set one up in Team Info first.' }
  }

  try {
    const rosterEntries = await prisma.rosterEntry.findMany({
      where: { teamSeasonId: teamSeason.id, isActive: true },
      include: {
        player: {
          include: {
            gameChangerStatSnapshots: {
              where: { teamSeasonId: teamSeason.id },
              orderBy: { capturedAt: 'desc' },
              take: 5,
            },
            coachNotes: { where: { teamSeasonId: teamSeason.id }, orderBy: { createdAt: 'desc' }, take: 5 },
          },
        },
      },
    })

    const { suggestions } = await generatePlayerTrendSuggestions({
      teamSeasonId: teamSeason.id,
      players: rosterEntries.map((e) => ({
        playerId: e.player.id,
        name: e.player.fullName?.trim() || [e.player.firstName, e.player.lastName].filter(Boolean).join(' ') || 'Unnamed Player',
        recentStats: e.player.gameChangerStatSnapshots.map(
          (s) => `AVG ${s.avg ?? '—'}, AB ${s.ab ?? 0}, RBI ${s.rbi ?? 0}, HR ${s.hr ?? 0}`,
        ),
        coachNotes: e.player.coachNotes.map((n) => n.body),
      })),
    })

    let created = 0
    for (const s of suggestions) {
      for (const focus of s.development_focus) {
        await prisma.developmentFocus.create({
          data: {
            teamSeasonId: teamSeason.id,
            playerId: s.playerId,
            title: focus,
            detail: [...s.recurring_errors, ...s.improvement_areas].join('; ') || null,
            source: 'ai',
            isAdvisory: true,
          },
        })
        created += 1
      }
      if (s.advisory_note.trim()) {
        await prisma.coachNote.create({
          data: {
            teamSeasonId: teamSeason.id,
            playerId: s.playerId,
            body: s.advisory_note,
            isPrivate: true,
            tags: ['ai', 'development'],
          },
        })
      }
    }

    revalidatePath('/player-development')
    return { ok: true, created }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate suggestions.'
    return { ok: false, error: message }
  }
}
