'use server'

import { prisma } from '@rally/core-data'
import { matchPlayer, normalizePlayerName, parseNcsRosterText } from '@rally/ncs-parser'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const parseSchema = z.object({
  teamSeasonId: z.string().min(1),
  pastedText: z.string().min(1),
  ncsTeamUrl: z.string().url().optional().or(z.literal('')),
})

export type ParsedPreviewRow = {
  rawName: string
  firstName?: string
  lastName?: string
  jersey?: string
  position?: string
  ncsId?: string
  normalizedName: string
}

export type ParseRosterResult =
  | { success: true; rows: ParsedPreviewRow[] }
  | { success: false; error: string }

export async function parseNcsRosterPreview(formData: FormData): Promise<ParseRosterResult> {
  const parsed = parseSchema.safeParse({
    teamSeasonId: formData.get('teamSeasonId'),
    pastedText: formData.get('pastedText'),
    ncsTeamUrl: formData.get('ncsTeamUrl') ?? '',
  })

  if (!parsed.success) {
    return { success: false, error: 'Invalid input' }
  }

  try {
    const rows = parseNcsRosterText(parsed.data.pastedText)
    if (rows.length === 0) {
      return { success: false, error: 'No roster rows found in pasted text' }
    }

    return {
      success: true,
      rows: rows.map((row) => ({
        rawName: row.rawName,
        firstName: row.firstName,
        lastName: row.lastName,
        jersey: row.jersey,
        position: row.position,
        ncsId: row.ncsId,
        normalizedName: row.normalizedName,
      })),
    }
  } catch {
    return { success: false, error: 'Failed to parse roster text' }
  }
}

const importSchema = z.object({
  teamSeasonId: z.string().min(1),
  ncsTeamUrl: z.string().optional(),
  rows: z.array(
    z.object({
      rawName: z.string(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      jersey: z.string().optional(),
      position: z.string().optional(),
      ncsId: z.string().optional(),
      normalizedName: z.string(),
    }),
  ),
})

export type ImportRosterResult =
  | { success: true; imported: number; skipped: number }
  | { success: false; error: string }

export async function importNcsRosterRows(
  data: z.infer<typeof importSchema>,
): Promise<ImportRosterResult> {
  const parsed = importSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: 'Invalid import data' }
  }

  const { teamSeasonId, ncsTeamUrl, rows } = parsed.data

  const [existingSources, rosterEntries] = await Promise.all([
    prisma.ncsPlayerSource.findMany({
      where: { teamSeasonId },
      include: { player: true },
    }),
    prisma.rosterEntry.findMany({
      where: { teamSeasonId },
      include: {
        player: {
          include: {
            ncsPlayerSources: {
              where: { teamSeasonId },
              select: { ncsId: true },
            },
          },
        },
      },
    }),
  ])

  const localPlayers = rosterEntries.map((entry) => ({
    id: entry.player.id,
    ncsId: entry.player.ncsPlayerSources[0]?.ncsId ?? null,
    normalizedName: normalizePlayerName(
      entry.player.fullName ?? [entry.player.firstName, entry.player.lastName].filter(Boolean).join(' '),
    ),
    jerseyNumber: entry.jerseyNumber ?? entry.player.jerseyNumber,
  }))

  let imported = 0
  let skipped = 0

  for (const row of rows) {
    try {
      const existingSource = row.ncsId
        ? existingSources.find((source) => source.ncsId === row.ncsId)
        : existingSources.find((source) => normalizePlayerName(source.rawName) === row.normalizedName)

      if (existingSource) {
        skipped++
        continue
      }

      const matched = matchPlayer(row, localPlayers)
      const playerId = matched.matched
        ? matched.player.id
        : (
            await prisma.player.create({
              data: {
                firstName: row.firstName || null,
                lastName: row.lastName || null,
                fullName: row.rawName,
                jerseyNumber: row.jersey || null,
              },
            })
          ).id

      const rosterEntryExists = rosterEntries.some((entry) => entry.playerId === playerId)
      if (!rosterEntryExists) {
        await prisma.rosterEntry.create({
          data: {
            teamSeasonId,
            playerId,
            jerseyNumber: row.jersey || null,
            isActive: true,
          },
        })
      }

      const createdSource = await prisma.ncsPlayerSource.create({
        data: {
          playerId,
          teamSeasonId,
          ncsId: row.ncsId || null,
          ncsExternalId: row.ncsId || null,
          ncsTeamUrl: ncsTeamUrl || null,
          rawName: row.rawName,
          rawJersey: row.jersey || null,
          rawPosition: row.position || null,
          sourceSnapshot: row as object,
          lastSeenAt: new Date(),
        },
      })

      existingSources.push({
        ...createdSource,
        player:
          rosterEntries.find((entry) => entry.playerId === playerId)?.player ??
          (await prisma.player.findUniqueOrThrow({ where: { id: playerId } })),
      })

      if (!localPlayers.some((player) => player.id === playerId)) {
        localPlayers.push({
          id: playerId,
          ncsId: row.ncsId ?? null,
          normalizedName: row.normalizedName,
          jerseyNumber: row.jersey ?? null,
        })
      }

      imported++
    } catch {
      skipped++
    }
  }

  revalidatePath('/')
  revalidatePath('/ncs-roster-dashboard')
  revalidatePath('/roster')

  return { success: true, imported, skipped }
}
