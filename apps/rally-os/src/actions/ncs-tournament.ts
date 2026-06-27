'use server'

import { prisma } from '@rally/core-data'
import { parseNcsTournamentText } from '@rally/ncs-parser'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export type ParsedTournamentRow = {
  name: string
  location?: string
  startDate?: string
  endDate?: string
  registrationUrl?: string
  rawLine: string
}

export type ParseTournamentResult =
  | { success: true; rows: ParsedTournamentRow[] }
  | { success: false; error: string }

export async function parseNcsTournamentPreview(
  formData: FormData,
): Promise<ParseTournamentResult> {
  const pastedText = formData.get('pastedText') as string
  if (!pastedText?.trim()) {
    return { success: false, error: 'No tournament text provided' }
  }

  try {
    const rows = parseNcsTournamentText(pastedText)
    if (rows.length === 0) {
      return { success: false, error: 'No tournaments found in pasted text' }
    }

    return { success: true, rows }
  } catch {
    return { success: false, error: 'Failed to parse tournament text' }
  }
}

const attachSchema = z.object({
  teamSeasonId: z.string().min(1),
  sourceUrl: z.string().optional(),
  tournaments: z.array(
    z.object({
      name: z.string(),
      location: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      registrationUrl: z.string().optional(),
    }),
  ),
})

export type AttachTournamentResult =
  | { success: true; attached: number; skipped: number }
  | { success: false; error: string }

function parseOptionalDate(value?: string) {
  if (!value) return null

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export async function attachNcsTournaments(
  data: z.infer<typeof attachSchema>,
): Promise<AttachTournamentResult> {
  const parsed = attachSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' }
  }

  const { teamSeasonId, sourceUrl, tournaments } = parsed.data
  let attached = 0
  let skipped = 0

  for (const tournamentRow of tournaments) {
    try {
      const tournament = await prisma.ncsTournament.upsert({
        where: { ncsId: `name:${tournamentRow.name}` },
        create: {
          ncsId: `name:${tournamentRow.name}`,
          name: tournamentRow.name,
          location: tournamentRow.location || null,
          startDate: parseOptionalDate(tournamentRow.startDate),
          endDate: parseOptionalDate(tournamentRow.endDate),
          registrationUrl: tournamentRow.registrationUrl || null,
          sourceUrl: sourceUrl || null,
        },
        update: {
          location: tournamentRow.location || null,
          startDate: parseOptionalDate(tournamentRow.startDate),
          endDate: parseOptionalDate(tournamentRow.endDate),
          registrationUrl: tournamentRow.registrationUrl || null,
          sourceUrl: sourceUrl || null,
        },
      })

      await prisma.ncsTournamentEntry.upsert({
        where: {
          teamSeasonId_tournamentId: {
            teamSeasonId,
            tournamentId: tournament.id,
          },
        },
        create: {
          teamSeasonId,
          tournamentId: tournament.id,
          isRegistered: false,
          attachedAt: new Date(),
        },
        update: {},
      })

      attached++
    } catch {
      skipped++
    }
  }

  revalidatePath('/ncs-tournament-tracker')
  return { success: true, attached, skipped }
}
