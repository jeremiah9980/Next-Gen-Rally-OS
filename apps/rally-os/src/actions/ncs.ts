'use server'

import { prisma } from '@rally/core-data'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { parseNcsRosterText, parseNcsTournamentText, validateNcsTeamUrl, searchTeams, fetchRoster } from '@rally/ncs'
import type { ParsedRosterRow, ParsedTournamentRow, NcsTeamResult, NcsSeason } from '@rally/ncs'
import { getActiveTeamSeason } from '../lib/portal-data'

// ─── Roster: live NCS team search ─────────────────────────────────────────────

const searchTeamsSchema = z.object({
  teamName: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  seasonId: z.string().optional(),
})

export type SearchNcsTeamsResult =
  | { ok: true; teams: NcsTeamResult[]; seasons: NcsSeason[] }
  | { ok: false; error: string }

/** Searches the live NCS portal for teams. Read-only — never touches local data. */
export async function searchNcsTeams(formData: FormData): Promise<SearchNcsTeamsResult> {
  const parsed = searchTeamsSchema.safeParse({
    teamName: formData.get('teamName') ?? undefined,
    city: formData.get('city') ?? undefined,
    state: formData.get('state') ?? undefined,
    seasonId: formData.get('seasonId') ?? undefined,
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  }

  const { teamName, city, state, seasonId } = parsed.data
  if (!teamName?.trim() && !city?.trim() && !state?.trim()) {
    return { ok: false, error: 'Enter a team name, city, or state to search.' }
  }

  try {
    const result = await searchTeams({ teamName, city, state, seasonId })
    return { ok: true, teams: result.teams, seasons: result.seasons }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to search NCS.'
    return { ok: false, error: message }
  }
}

// ─── Roster: pull a live NCS team's roster (feeds into the same preview step) ─

const fetchTeamRosterSchema = z.object({
  teamId: z.string().min(1),
})

export type FetchNcsTeamRosterResult =
  | {
      ok: true
      rows: ParsedRosterRow[]
      teamName: string
      location: string
      division: string
      ncsTeamUrl: string
    }
  | { ok: false; error: string }

/** Pulls a live NCS team's roster by team id. Read-only — import still requires the explicit Import step. */
export async function fetchNcsTeamRoster(formData: FormData): Promise<FetchNcsTeamRosterResult> {
  const parsed = fetchTeamRosterSchema.safeParse({ teamId: formData.get('teamId') })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  }

  try {
    const result = await fetchRoster(parsed.data.teamId)
    if (result.players.length === 0) {
      return { ok: false, error: 'No roster table found on that team\'s NCS page.' }
    }
    return {
      ok: true,
      rows: result.players,
      teamName: result.teamName,
      location: result.location,
      division: result.division,
      ncsTeamUrl: `https://www.playncs.com/fastpitch/Teams/Details/${parsed.data.teamId}`,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch NCS roster.'
    return { ok: false, error: message }
  }
}

// ─── Roster: parse preview ────────────────────────────────────────────────────

const previewRosterSchema = z.object({
  pasteText: z.string().min(1, 'Paste text is required'),
  ncsTeamUrl: z.string().optional(),
})

export type PreviewRosterResult =
  | { ok: true; rows: ParsedRosterRow[]; parseMode: 'header' | 'positional'; warnings: string[] }
  | { ok: false; error: string }

export async function previewNcsRoster(formData: FormData): Promise<PreviewRosterResult> {
  const parsed = previewRosterSchema.safeParse({
    pasteText: formData.get('pasteText'),
    ncsTeamUrl: formData.get('ncsTeamUrl') ?? undefined,
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  }

  const { pasteText, ncsTeamUrl } = parsed.data

  if (ncsTeamUrl && !validateNcsTeamUrl(ncsTeamUrl)) {
    return { ok: false, error: 'Invalid NCS team URL. Must be a valid ncssports.org / norcalscout.com / ncs.org URL.' }
  }

  const result = parseNcsRosterText(pasteText)
  if (result.rows.length === 0) {
    return { ok: false, error: 'No rows could be parsed from the pasted text.' }
  }

  return { ok: true, rows: result.rows, parseMode: result.parseMode, warnings: result.warnings }
}

// ─── Roster: import selected players ─────────────────────────────────────────

const importRosterSchema = z.object({
  teamSeasonId: z.string().min(1),
  ncsTeamUrl: z.string().optional(),
  rows: z.string().min(1), // JSON-encoded ParsedRosterRow[]
  selectedIndices: z.string().min(1), // JSON-encoded number[]
})

export type ImportRosterResult =
  | { ok: true; imported: number; skipped: number }
  | { ok: false; error: string }

export async function importNcsPlayers(formData: FormData): Promise<ImportRosterResult> {
  const parsed = importRosterSchema.safeParse({
    teamSeasonId: formData.get('teamSeasonId'),
    ncsTeamUrl: formData.get('ncsTeamUrl') ?? undefined,
    rows: formData.get('rows'),
    selectedIndices: formData.get('selectedIndices'),
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  }

  let rows: ParsedRosterRow[]
  let selectedIndices: number[]
  try {
    rows = JSON.parse(parsed.data.rows) as ParsedRosterRow[]
    selectedIndices = JSON.parse(parsed.data.selectedIndices) as number[]
  } catch {
    return { ok: false, error: 'Malformed row/index data.' }
  }

  const { teamSeasonId, ncsTeamUrl } = parsed.data

  let imported = 0
  let skipped = 0

  for (const idx of selectedIndices) {
    const row = rows[idx]
    if (!row) {
      skipped++
      continue
    }

    const firstName = row.firstName ?? null
    const lastName = row.lastName ?? null
    const fullName =
      (row.fullName ?? [firstName, lastName].filter(Boolean).join(' ')) ||
      null

    if (!fullName && !firstName && !lastName) {
      skipped++
      continue
    }

    try {
      // Check for existing player by ncsExternalId first, then name
      let player = null

      if (row.ncsExternalId) {
        player = await prisma.player.findFirst({
          where: {
            ncsPlayerSources: { some: { ncsExternalId: row.ncsExternalId } },
          },
        })
      }

      if (!player && fullName) {
        player = await prisma.player.findFirst({
          where: { fullName: { equals: fullName, mode: 'insensitive' } },
        })
      }

      if (!player && row.jerseyNumber) {
        // Match by jersey only as last resort — only if no external ID column was present
        if (!row.ncsExternalId) {
          const existing = await prisma.rosterEntry.findFirst({
            where: { teamSeasonId, jerseyNumber: row.jerseyNumber },
            include: { player: true },
          })
          if (existing) player = existing.player
        }
      }

      if (!player) {
        player = await prisma.player.create({
          data: {
            firstName,
            lastName,
            fullName,
            jerseyNumber: row.jerseyNumber ?? null,
          },
        })
      }

      // Check for existing roster entry
      const existingEntry = await prisma.rosterEntry.findFirst({
        where: { teamSeasonId, playerId: player.id },
      })

      let rosterEntryId: string
      if (existingEntry) {
        rosterEntryId = existingEntry.id
      } else {
        const entry = await prisma.rosterEntry.create({
          data: {
            teamSeasonId,
            playerId: player.id,
            jerseyNumber: row.jerseyNumber ?? null,
            isActive: true,
          },
        })
        rosterEntryId = entry.id
      }

      // Create or upsert NcsPlayerSource
      await prisma.ncsPlayerSource.upsert({
        where: { playerId: player.id },
        create: {
          playerId: player.id,
          rosterEntryId,
          teamSeasonId,
          ncsExternalId: row.ncsExternalId ?? null,
          ncsId: row.ncsExternalId ?? null,
          ncsTeamUrl: ncsTeamUrl ?? null,
          rawName: fullName,
          rawJersey: row.jerseyNumber ?? null,
          rawPosition: row.position ?? null,
          sourceSnapshot: row as object,
          lastSeenAt: new Date(),
        },
        update: {
          rosterEntryId,
          ncsExternalId: row.ncsExternalId ?? null,
          ncsId: row.ncsExternalId ?? null,
          ncsTeamUrl: ncsTeamUrl ?? null,
          rawName: fullName,
          rawJersey: row.jerseyNumber ?? null,
          rawPosition: row.position ?? null,
          sourceSnapshot: row as object,
          lastSeenAt: new Date(),
        },
      })

      imported++
    } catch {
      skipped++
    }
  }

  revalidatePath('/ncs-roster-dashboard')
  revalidatePath('/')

  return { ok: true, imported, skipped }
}

// ─── Tournament: parse preview ─────────────────────────────────────────────────

const previewTournamentsSchema = z.object({
  pasteText: z.string().min(1, 'Paste text is required'),
})

export type PreviewTournamentsResult =
  | { ok: true; rows: ParsedTournamentRow[]; parseMode: 'header' | 'positional'; warnings: string[] }
  | { ok: false; error: string }

export async function previewNcsTournaments(formData: FormData): Promise<PreviewTournamentsResult> {
  const parsed = previewTournamentsSchema.safeParse({
    pasteText: formData.get('pasteText'),
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  }

  const result = parseNcsTournamentText(parsed.data.pasteText)
  if (result.rows.length === 0) {
    return { ok: false, error: 'No rows could be parsed from the pasted text.' }
  }

  return { ok: true, rows: result.rows, parseMode: result.parseMode, warnings: result.warnings }
}

// ─── Tournament: attach to TeamSeason ─────────────────────────────────────────

const attachTournamentsSchema = z.object({
  teamSeasonId: z.string().min(1),
  rows: z.string().min(1),
  selectedIndices: z.string().min(1),
})

export type AttachTournamentsResult =
  | { ok: true; attached: number; skipped: number }
  | { ok: false; error: string }

export async function attachNcsTournaments(formData: FormData): Promise<AttachTournamentsResult> {
  const parsed = attachTournamentsSchema.safeParse({
    teamSeasonId: formData.get('teamSeasonId'),
    rows: formData.get('rows'),
    selectedIndices: formData.get('selectedIndices'),
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  }

  let rows: ParsedTournamentRow[]
  let selectedIndices: number[]
  try {
    rows = JSON.parse(parsed.data.rows) as ParsedTournamentRow[]
    selectedIndices = JSON.parse(parsed.data.selectedIndices) as number[]
  } catch {
    return { ok: false, error: 'Malformed row/index data.' }
  }

  const { teamSeasonId } = parsed.data
  let attached = 0
  let skipped = 0

  for (const idx of selectedIndices) {
    const row = rows[idx]
    if (!row || !row.name) {
      skipped++
      continue
    }

    try {
      // Find or create NcsTournament
      let tournament = row.ncsExternalId
        ? await prisma.ncsTournament.findUnique({ where: { ncsExternalId: row.ncsExternalId } })
        : null

      if (!tournament) {
        tournament = await prisma.ncsTournament.findFirst({
          where: { name: { equals: row.name, mode: 'insensitive' } },
        })
      }

      if (!tournament) {
        tournament = await prisma.ncsTournament.create({
          data: {
            ncsExternalId: row.ncsExternalId ?? null,
            name: row.name,
            startDate: row.startDate ? parseDateSafe(row.startDate) : null,
            endDate: row.endDate ? parseDateSafe(row.endDate) : null,
            location: row.location ?? null,
            ageGroups: row.ageGroups ?? null,
            sourceSnapshot: row as object,
          },
        })
      }

      // Create NcsTournamentEntry (upsert by unique constraint)
      await prisma.ncsTournamentEntry.upsert({
        where: { teamSeasonId_tournamentId: { teamSeasonId, tournamentId: tournament.id } },
        create: { teamSeasonId, tournamentId: tournament.id, isRegistered: false },
        update: {},
      })

      attached++
    } catch {
      skipped++
    }
  }

  revalidatePath('/ncs-tournament-tracker')
  return { ok: true, attached, skipped }
}

// ─── Change review: update status ─────────────────────────────────────────────

const reviewChangeSchema = z.object({
  reviewId: z.string().min(1),
  action: z.enum(['pending_review', 'accepted', 'ignored']),
})

export type ReviewChangeResult = { ok: true } | { ok: false; error: string }

export async function resolveNcsChangeReview(formData: FormData): Promise<ReviewChangeResult> {
  const parsed = reviewChangeSchema.safeParse({
    reviewId: formData.get('reviewId'),
    action: formData.get('action'),
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  }

  const { reviewId, action } = parsed.data

  try {
    await prisma.ncsChangeReview.update({
      where: { id: reviewId },
      data: {
        status: action,
        reviewedAt: action === 'accepted' || action === 'ignored' ? new Date() : null,
      },
    })
  } catch {
    return { ok: false, error: 'Could not update review status.' }
  }

  revalidatePath('/ncs-roster-dashboard')
  revalidatePath('/ncs-tournament-tracker')
  return { ok: true }
}

// ─── Change review: re-parse against stored snapshot (manual re-diff) ─────────

const reDiffSchema = z.object({
  teamSeasonId: z.string().min(1),
  pasteText: z.string().min(1, 'Paste text is required'),
})

export type ReDiffResult =
  | { ok: true; created: number }
  | { ok: false; error: string }

/**
 * Re-parse pasted roster text and diff it against all stored NcsPlayerSource
 * snapshots for the active TeamSeason.  Creates NcsChangeReview items for
 * any detected differences.  NEVER overwrites existing Player or RosterEntry
 * records.
 */
export async function rediffNcsRoster(formData: FormData): Promise<ReDiffResult> {
  const parsed = reDiffSchema.safeParse({
    teamSeasonId: formData.get('teamSeasonId'),
    pasteText: formData.get('pasteText'),
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  }

  const { teamSeasonId, pasteText } = parsed.data

  const parseResult = parseNcsRosterText(pasteText)
  if (parseResult.rows.length === 0) {
    return { ok: false, error: 'No rows could be parsed.' }
  }

  // Fetch stored snapshots
  const sources = await prisma.ncsPlayerSource.findMany({
    where: { teamSeasonId },
    select: { sourceSnapshot: true },
  })

  const storedRows = sources.map((s) => s.sourceSnapshot as unknown as ParsedRosterRow)
  const { diffRoster } = await import('@rally/ncs')
  const diff = diffRoster(storedRows, parseResult.rows)

  if (diff.changes.length === 0) {
    return { ok: true, created: 0 }
  }

  await prisma.ncsChangeReview.createMany({
    data: diff.changes.map((change) => ({
      teamSeasonId,
      changeType: change.changeType,
      status: 'change_detected' as const,
      payload: change as object,
    })),
  })

  revalidatePath('/ncs-roster-dashboard')
  return { ok: true, created: diff.changes.length }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDateSafe(value: string): Date | null {
  try {
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

// ─── Data query helpers (used by page components) ────────────────────────────

export async function getNcsDashboardData(teamSeasonId: string) {
  const [sources, changeReviews] = await Promise.all([
    prisma.ncsPlayerSource.findMany({
      where: { teamSeasonId },
      orderBy: { createdAt: 'desc' },
      include: {
        player: { select: { id: true, fullName: true, firstName: true, lastName: true, jerseyNumber: true } },
        rosterEntry: { select: { id: true, jerseyNumber: true, isActive: true } },
      },
    }),
    prisma.ncsChangeReview.findMany({
      where: { teamSeasonId, status: { in: ['change_detected', 'pending_review'] } },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return { sources, changeReviews }
}

export async function getNcsTournamentData(teamSeasonId: string) {
  const entries = await prisma.ncsTournamentEntry.findMany({
    where: { teamSeasonId },
    orderBy: { createdAt: 'desc' },
    include: {
      tournament: true,
    },
  })

  const changeReviews = await prisma.ncsChangeReview.findMany({
    where: {
      teamSeasonId,
      changeType: { in: ['tournament_register', 'tournament_unregister'] },
      status: { in: ['change_detected', 'pending_review'] },
    },
    orderBy: { createdAt: 'desc' },
  })

  return { entries, changeReviews }
}
