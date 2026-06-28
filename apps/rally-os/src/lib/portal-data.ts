import { prisma } from '@rally/core-data'
import { toPublicTeamSeasonPayload } from '@rally/ncs'
import { unstable_noStore as noStore } from 'next/cache'

export type TeamSeasonFormData = {
  id: string
  team_name: string
  season: string
  age_group: string
  organization: string | null
  head_coach: string | null
  assistant_coaches: string | null
  practice_location: string | null
  primary_game_location: string | null
  team_standards: string | null
  development_goals: string | null
  communication_expectations: string | null
}

export async function getActiveTeamSeason() {
  noStore()

  try {
    return await prisma.teamSeason.findFirst({
      where: { isActive: true },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        team_name: true,
        season: true,
        age_group: true,
        organization: true,
        head_coach: true,
        assistant_coaches: true,
        practice_location: true,
        primary_game_location: true,
        team_standards: true,
        development_goals: true,
        communication_expectations: true,
      },
    })
  } catch {
    return null
  }
}

export async function getActiveTeamSeasonSummary() {
  noStore()

  try {
    return await prisma.teamSeason.findFirst({
      where: { isActive: true },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        team_name: true,
        season: true,
      },
    })
  } catch {
    return null
  }
}

export async function getDashboardData() {
  noStore()

  const teamSeason = await getActiveTeamSeason()

  if (!teamSeason) {
    return {
      teamSeason: null,
      athleteCount: 0,
      roster: [] as Array<{
        id: string
        name: string
        jerseyNumber: string | null
        stats: {
          avg: string
          ab: string
          rbi: string
          hr: string
        }
      }>,
    }
  }

  try {
    const rosterEntries = await prisma.rosterEntry.findMany({
      where: {
        teamSeasonId: teamSeason.id,
        isActive: true,
      },
      orderBy: [{ jerseyNumber: 'asc' }, { createdAt: 'asc' }],
      include: {
        player: {
          include: {
            gameChangerStatSnapshots: {
              where: {
                teamSeasonId: teamSeason.id,
              },
              orderBy: {
                capturedAt: 'desc',
              },
              take: 1,
            },
          },
        },
      },
    })

    return {
      teamSeason,
      athleteCount: rosterEntries.length,
      roster: rosterEntries.map((entry) => {
        const snapshot = entry.player.gameChangerStatSnapshots[0]
        const fullName = entry.player.fullName?.trim()
        const playerName =
          fullName && fullName.length > 0
            ? fullName
            : [entry.player.firstName, entry.player.lastName].filter(Boolean).join(' ')

        return {
          id: entry.id,
          name: playerName || 'Unnamed Player',
          jerseyNumber: entry.jerseyNumber,
          stats: {
            avg: snapshot?.avg ? snapshot.avg.toFixed(3) : '0.000',
            ab: `${snapshot?.ab ?? 0}`,
            rbi: `${snapshot?.rbi ?? 0}`,
            hr: `${snapshot?.hr ?? 0}`,
          },
        }
      }),
    }
  } catch {
    return {
      teamSeason,
      athleteCount: 0,
      roster: [],
    }
  }
}

export async function getPublicTeamSeasonPayload() {
  const teamSeason = await getActiveTeamSeason()
  if (!teamSeason) return null

  return toPublicTeamSeasonPayload({
    ...teamSeason,
    coach_notes: null,
    coach_practice_version: null,
  })
}
