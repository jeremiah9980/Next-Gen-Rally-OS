'use server'

import { createHash } from 'node:crypto'
import { prisma } from '@rally/core-data'
import { matchGameChangerPlayer } from '@rally/ncs-parser'
import {
  buildGameChangerSnapshot,
  ensurePushAllowed,
  resolvePersistedGcGameId,
  transitionScheduleGame,
  type ScheduleGameStatus,
} from '@rally/ncs'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const teamLinkSchema = z.object({
  teamSeasonId: z.string().min(1),
  gcTeamId: z.string().trim().min(1, 'GameChanger Team ID is required'),
})

export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string }

export async function saveGameChangerTeamLink(formData: FormData): Promise<ActionResult<{ gcTeamId: string }>> {
  const parsed = teamLinkSchema.safeParse({
    teamSeasonId: formData.get('teamSeasonId'),
    gcTeamId: formData.get('gcTeamId'),
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid GameChanger team input.' }
  }

  const { teamSeasonId, gcTeamId } = parsed.data

  await prisma.teamSeason.update({
    where: { id: teamSeasonId },
    data: {
      gcTeamId,
      gcTeamIdMappedAt: new Date(),
    },
  })

  revalidatePath('/gamechanger')
  return { ok: true, data: { gcTeamId }, message: 'GameChanger team linked.' }
}

const playerLinkSchema = z.object({
  playerId: z.string().min(1),
  gcPlayerId: z.string().trim().min(1, 'GameChanger Player ID is required'),
})

export async function saveGameChangerPlayerLink(
  formData: FormData,
): Promise<ActionResult<{ playerId: string; gcPlayerId: string }>> {
  const parsed = playerLinkSchema.safeParse({
    playerId: formData.get('playerId'),
    gcPlayerId: formData.get('gcPlayerId'),
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid GameChanger player mapping input.' }
  }

  const { playerId, gcPlayerId } = parsed.data

  await prisma.player.update({
    where: { id: playerId },
    data: {
      gcPlayerId,
      gcPlayerIdMappedAt: new Date(),
    },
  })

  revalidatePath('/gamechanger')
  return { ok: true, data: { playerId, gcPlayerId }, message: 'Player mapping saved.' }
}

const statsImportSchema = z.object({
  teamSeasonId: z.string().min(1),
  result: z.string().trim().min(1, 'Real game result is required.'),
  score: z.string().trim().min(1, 'Real game score is required.'),
  hasIdColumn: z.enum(['true', 'false']).default('false'),
  rows: z.string().min(1, 'Stats rows JSON is required.'),
})

type GameChangerStatsRow = {
  gcPlayerId?: string | null
  name?: string | null
  jersey?: string | null
  avg?: number | null
  ab?: number | null
  rbi?: number | null
  hr?: number | null
  gcGameId?: string | null
}

export async function importGameChangerStats(
  formData: FormData,
): Promise<ActionResult<{ imported: number; skipped: number }>> {
  const parsed = statsImportSchema.safeParse({
    teamSeasonId: formData.get('teamSeasonId'),
    result: formData.get('result'),
    score: formData.get('score'),
    hasIdColumn: (formData.get('hasIdColumn') as 'true' | 'false') ?? 'false',
    rows: formData.get('rows'),
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid stat import input.' }
  }

  let rows: GameChangerStatsRow[] = []
  try {
    rows = JSON.parse(parsed.data.rows) as GameChangerStatsRow[]
  } catch {
    return { ok: false, error: 'Stats rows must be valid JSON.' }
  }

  if (rows.length === 0) {
    return { ok: false, error: 'At least one stat row is required.' }
  }

  const roster = await prisma.rosterEntry.findMany({
    where: {
      teamSeasonId: parsed.data.teamSeasonId,
      isActive: true,
    },
    include: { player: true },
  })

  const localPlayers = roster.map((entry) => ({
    id: entry.player.id,
    gcPlayerId: entry.player.gcPlayerId,
    fullName:
      entry.player.fullName ??
      [entry.player.firstName, entry.player.lastName].filter(Boolean).join(' ') ??
      null,
    jerseyNumber: entry.jerseyNumber ?? entry.player.jerseyNumber,
  }))

  let imported = 0
  let skipped = 0

  for (const row of rows) {
    const match = matchGameChangerPlayer(
      {
        gcPlayerId: row.gcPlayerId,
        name: row.name,
        jersey: row.jersey,
        hasIdColumn: parsed.data.hasIdColumn === 'true',
      },
      localPlayers,
    )

    if (!match.matched) {
      skipped++
      continue
    }

    if (row.gcPlayerId) {
      await prisma.player.update({
        where: { id: match.player.id },
        data: {
          gcPlayerId: row.gcPlayerId,
          gcPlayerIdMappedAt: new Date(),
        },
      })
    }

    await prisma.gameChangerStatSnapshot.create({
      data: buildGameChangerSnapshot({
        teamSeasonId: parsed.data.teamSeasonId,
        playerId: match.player.id,
        gcPlayerId: row.gcPlayerId ?? match.player.gcPlayerId ?? null,
        gcGameId: row.gcGameId ?? null,
        avg: row.avg ?? null,
        ab: row.ab ?? null,
        rbi: row.rbi ?? null,
        hr: row.hr ?? null,
        result: parsed.data.result,
        score: parsed.data.score,
        sourcePayload: row as object,
      }),
    })

    imported++
  }

  revalidatePath('/gamechanger')
  return { ok: true, data: { imported, skipped }, message: 'GameChanger stat snapshots imported.' }
}

const createDraftsSchema = z.object({
  teamSeasonId: z.string().min(1),
})

function ensureValidDate(date: Date | null | undefined): Date {
  if (date && !Number.isNaN(date.getTime())) return date
  return new Date()
}

async function transitionScheduleStatus(scheduleGameId: string, next: ScheduleGameStatus) {
  const current = await prisma.scheduleGame.findUnique({
    where: { id: scheduleGameId },
    select: { status: true },
  })

  if (!current) {
    throw new Error('Schedule game not found.')
  }

  const updatedStatus = transitionScheduleGame(current.status, next)
  await prisma.scheduleGame.update({
    where: { id: scheduleGameId },
    data: { status: updatedStatus },
  })
}

export async function createScheduleDraftsFromNcs(
  formData: FormData,
): Promise<ActionResult<{ created: number; skipped: number }>> {
  const parsed = createDraftsSchema.safeParse({
    teamSeasonId: formData.get('teamSeasonId'),
  })

  if (!parsed.success) {
    return { ok: false, error: 'Invalid team season for draft generation.' }
  }

  const entries = await prisma.ncsTournamentEntry.findMany({
    where: { teamSeasonId: parsed.data.teamSeasonId },
    include: { tournament: true },
  })

  let created = 0
  let skipped = 0

  for (const entry of entries) {
    const startDate = ensureValidDate(entry.tournament.startDate)
    const sourceFingerprint = createHash('sha1')
      .update(`${parsed.data.teamSeasonId}:${entry.tournamentId}:${startDate.toISOString()}:${entry.tournament.name}`)
      .digest('hex')

    const existing = await prisma.scheduleGame.findUnique({
      where: { sourceFingerprint },
      select: { id: true },
    })

    if (existing) {
      skipped++
      continue
    }

    const draft = await prisma.scheduleGame.create({
      data: {
        teamSeasonId: parsed.data.teamSeasonId,
        ncsTournamentEntryId: entry.id,
        sourceFingerprint,
        status: 'ncs_detected',
        opponent: entry.tournament.name,
        gameDate: startDate,
        location: entry.tournament.location ?? null,
        game_type: 'tournament',
        sourcePayload: {
          source: 'ncs_tournament_entry',
          ncsTournamentEntryId: entry.id,
          ncsTournamentId: entry.tournament.id,
        },
      },
    })

    await transitionScheduleStatus(draft.id, 'draft_created')
    await transitionScheduleStatus(draft.id, 'pending_coach_approval')
    created++
  }

  revalidatePath('/gamechanger')
  return { ok: true, data: { created, skipped }, message: 'NCS-detected schedule drafts generated.' }
}

const editDraftSchema = z.object({
  draftId: z.string().min(1),
  opponent: z.string().trim().min(1),
  gameDate: z.string().min(1),
  gameTime: z.string().optional(),
  field: z.string().optional(),
  location: z.string().optional(),
  game_type: z.string().optional(),
})

export async function updateScheduleDraft(formData: FormData): Promise<ActionResult<{ draftId: string }>> {
  const parsed = editDraftSchema.safeParse({
    draftId: formData.get('draftId'),
    opponent: formData.get('opponent'),
    gameDate: formData.get('gameDate'),
    gameTime: formData.get('gameTime') ?? '',
    field: formData.get('field') ?? '',
    location: formData.get('location') ?? '',
    game_type: formData.get('game_type') ?? '',
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid draft update input.' }
  }

  const draft = await prisma.scheduleGame.findUnique({
    where: { id: parsed.data.draftId },
    select: { status: true },
  })

  if (!draft) {
    return { ok: false, error: 'Draft not found.' }
  }

  if (!['draft_created', 'pending_coach_approval'].includes(draft.status)) {
    return { ok: false, error: 'Only pending drafts can be edited before approval.' }
  }

  const parsedDate = new Date(parsed.data.gameDate)
  if (Number.isNaN(parsedDate.getTime())) {
    return { ok: false, error: 'Game date is invalid.' }
  }

  await prisma.scheduleGame.update({
    where: { id: parsed.data.draftId },
    data: {
      opponent: parsed.data.opponent,
      gameDate: parsedDate,
      gameTime: parsed.data.gameTime || null,
      field: parsed.data.field || null,
      location: parsed.data.location || null,
      game_type: parsed.data.game_type || null,
    },
  })

  revalidatePath('/gamechanger')
  return { ok: true, data: { draftId: parsed.data.draftId }, message: 'Draft updated.' }
}

const reviewDraftsSchema = z.object({
  teamSeasonId: z.string().min(1),
  mode: z.enum(['selected', 'all']),
  draftIds: z.string().optional(),
})

async function resolveDraftSelection(input: z.infer<typeof reviewDraftsSchema>, status: ScheduleGameStatus) {
  if (input.mode === 'all') {
    const drafts = await prisma.scheduleGame.findMany({
      where: {
        teamSeasonId: input.teamSeasonId,
        status,
      },
      select: { id: true },
    })
    return drafts.map((draft) => draft.id)
  }

  if (!input.draftIds) return []
  try {
    return JSON.parse(input.draftIds) as string[]
  } catch {
    return []
  }
}

export async function approveScheduleDrafts(
  formData: FormData,
): Promise<ActionResult<{ approved: number; skipped: number }>> {
  const parsed = reviewDraftsSchema.safeParse({
    teamSeasonId: formData.get('teamSeasonId'),
    mode: formData.get('mode'),
    draftIds: formData.get('draftIds') ?? undefined,
  })

  if (!parsed.success) {
    return { ok: false, error: 'Invalid approval request.' }
  }

  const candidateIds = Array.from(
    new Set([
      ...(await resolveDraftSelection(parsed.data, 'pending_coach_approval')),
      ...(await resolveDraftSelection(parsed.data, 'draft_created')),
    ]),
  )

  let approved = 0
  let skipped = 0

  for (const draftId of candidateIds) {
    const draft = await prisma.scheduleGame.findUnique({ where: { id: draftId }, select: { status: true } })
    if (!draft) {
      skipped++
      continue
    }

    try {
      if (draft.status === 'draft_created') {
        await transitionScheduleStatus(draftId, 'pending_coach_approval')
      }
      await transitionScheduleStatus(draftId, 'approved')
      approved++
    } catch {
      skipped++
    }
  }

  revalidatePath('/gamechanger')
  return { ok: true, data: { approved, skipped }, message: 'Draft approval complete.' }
}

export async function rejectScheduleDrafts(
  formData: FormData,
): Promise<ActionResult<{ rejected: number; skipped: number }>> {
  const parsed = reviewDraftsSchema.safeParse({
    teamSeasonId: formData.get('teamSeasonId'),
    mode: formData.get('mode'),
    draftIds: formData.get('draftIds') ?? undefined,
  })

  if (!parsed.success) {
    return { ok: false, error: 'Invalid rejection request.' }
  }

  const candidateIds = Array.from(
    new Set([
      ...(await resolveDraftSelection(parsed.data, 'pending_coach_approval')),
      ...(await resolveDraftSelection(parsed.data, 'draft_created')),
    ]),
  )

  let rejected = 0
  let skipped = 0

  for (const draftId of candidateIds) {
    const draft = await prisma.scheduleGame.findUnique({ where: { id: draftId }, select: { status: true } })
    if (!draft) {
      skipped++
      continue
    }

    try {
      if (draft.status === 'draft_created') {
        await transitionScheduleStatus(draftId, 'pending_coach_approval')
      }
      await transitionScheduleStatus(draftId, 'rejected')
      rejected++
    } catch {
      skipped++
    }
  }

  revalidatePath('/gamechanger')
  return { ok: true, data: { rejected, skipped }, message: 'Draft rejection complete.' }
}

const pushSchema = z.object({
  teamSeasonId: z.string().min(1),
  mode: z.enum(['selected', 'all']),
  draftIds: z.string().optional(),
})

function buildIdempotencyKey(teamSeasonId: string, scheduleGameId: string) {
  return `gc-push:${teamSeasonId}:${scheduleGameId}`
}

function fakeGameChangerPush(teamGcTeamId: string, scheduleGameId: string, idempotencyKey: string): string {
  return `${teamGcTeamId}-${createHash('sha1').update(`${scheduleGameId}:${idempotencyKey}`).digest('hex').slice(0, 12)}`
}

export async function pushApprovedScheduleDrafts(
  formData: FormData,
): Promise<
  ActionResult<{
    pushed: number
    reused: number
    blocked: number
    results: Array<{ draftId: string; gcGameId: string }>
  }>
> {
  const parsed = pushSchema.safeParse({
    teamSeasonId: formData.get('teamSeasonId'),
    mode: formData.get('mode'),
    draftIds: formData.get('draftIds') ?? undefined,
  })

  if (!parsed.success) {
    return { ok: false, error: 'Invalid push request.' }
  }

  const teamSeason = await prisma.teamSeason.findUnique({
    where: { id: parsed.data.teamSeasonId },
    select: { gcTeamId: true },
  })

  if (!teamSeason?.gcTeamId) {
    return { ok: false, error: 'Link the active TeamSeason to a GameChanger team before pushing.' }
  }

  const draftIds = await resolveDraftSelection(parsed.data, 'approved')

  let pushed = 0
  let reused = 0
  let blocked = 0
  const results: Array<{ draftId: string; gcGameId: string }> = []

  for (const draftId of draftIds) {
    const draft = await prisma.scheduleGame.findUnique({
      where: { id: draftId },
      select: {
        id: true,
        status: true,
        opponent: true,
        gameDate: true,
        gameTime: true,
        field: true,
        location: true,
        game_type: true,
      },
    })

    if (!draft) {
      blocked++
      continue
    }

    try {
      ensurePushAllowed(draft.status)
    } catch {
      blocked++
      continue
    }

    const idempotencyKey = buildIdempotencyKey(parsed.data.teamSeasonId, draft.id)

    const existingPush = await prisma.schedulePushRequest.findUnique({
      where: { scheduleGameId: draft.id },
      select: { gcGameId: true, status: true },
    })
    const generatedGcGameId = fakeGameChangerPush(teamSeason.gcTeamId, draft.id, idempotencyKey)
    const { gcGameId, reused: wasReused } = resolvePersistedGcGameId(
      existingPush?.gcGameId ?? null,
      generatedGcGameId,
    )

    await prisma.schedulePushRequest.upsert({
      where: { scheduleGameId: draft.id },
      create: {
        teamSeasonId: parsed.data.teamSeasonId,
        scheduleGameId: draft.id,
        status: 'success',
        gcGameId,
        idempotencyKey,
        requestPayload: {
          opponent: draft.opponent,
          gameDate: draft.gameDate,
          gameTime: draft.gameTime,
          field: draft.field,
          location: draft.location,
          game_type: draft.game_type,
        },
        responsePayload: { gcGameId },
      },
      update: {
        status: 'success',
        gcGameId,
        idempotencyKey,
        responsePayload: { gcGameId },
      },
    })

    await transitionScheduleStatus(draft.id, 'pushed_to_gamechanger')

    results.push({ draftId: draft.id, gcGameId })
    if (wasReused) reused++
    else pushed++
  }

  revalidatePath('/gamechanger')
  return {
    ok: true,
    data: { pushed, reused, blocked, results },
    message: 'Approved schedules pushed to GameChanger.',
  }
}

export async function getGameChangerPageData(teamSeasonId: string) {
  const [teamSeason, rosterEntries, scheduleDrafts, pushRequests, snapshots] = await Promise.all([
    prisma.teamSeason.findUnique({
      where: { id: teamSeasonId },
      select: {
        id: true,
        team_name: true,
        season: true,
        gcTeamId: true,
      },
    }),
    prisma.rosterEntry.findMany({
      where: { teamSeasonId, isActive: true },
      orderBy: [{ jerseyNumber: 'asc' }, { createdAt: 'asc' }],
      include: {
        player: {
          select: {
            id: true,
            fullName: true,
            firstName: true,
            lastName: true,
            jerseyNumber: true,
            gcPlayerId: true,
          },
        },
      },
    }),
    prisma.scheduleGame.findMany({
      where: { teamSeasonId },
      orderBy: [{ createdAt: 'desc' }],
    }),
    prisma.schedulePushRequest.findMany({
      where: { teamSeasonId },
      orderBy: [{ createdAt: 'desc' }],
      take: 50,
    }),
    prisma.gameChangerStatSnapshot.findMany({
      where: { teamSeasonId },
      orderBy: [{ capturedAt: 'desc' }],
      take: 50,
      include: {
        player: {
          select: {
            id: true,
            fullName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
  ])

  return {
    teamSeason,
    rosterEntries,
    scheduleDrafts,
    pushRequests,
    snapshots,
  }
}
