import { prisma } from '@rally/core-data'
import type { Prisma } from '@prisma/client'
import { toPublicTeamSeasonPayload } from '@rally/ncs'
import { unstable_noStore as noStore } from 'next/cache'
import { getCurrentOrganizationId } from './session'

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

const SEASON_FIELDS = {
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
} satisfies Prisma.TeamSeasonSelect

const ORDER = [{ updatedAt: 'desc' as const }, { createdAt: 'desc' as const }]

/**
 * The active TeamSeason for the signed-in coach's organization. Tenancy is
 * enforced through the Team → Organization relation, so a coach can never read
 * another organization's seasons. Returns null when there is no session,
 * no organization, or no matching season.
 */
export async function getActiveTeamSeason() {
  noStore()

  const organizationId = await getCurrentOrganizationId()
  if (!organizationId) return null

  try {
    return await prisma.teamSeason.findFirst({
      where: { isActive: true, team: { organizationId } },
      orderBy: ORDER,
      select: SEASON_FIELDS,
    })
  } catch {
    return null
  }
}

export async function getActiveTeamSeasonSummary() {
  noStore()

  const organizationId = await getCurrentOrganizationId()
  if (!organizationId) return null

  try {
    return await prisma.teamSeason.findFirst({
      where: { isActive: true, team: { organizationId } },
      orderBy: ORDER,
      select: { id: true, team_name: true, season: true },
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

/**
 * Operational counts for the active TeamSeason — pending NCS change reviews,
 * attached tournaments, NCS-linked players. Drives the dashboard ops strip.
 */
export async function getOpsSnapshot() {
  noStore()

  const teamSeason = await getActiveTeamSeasonSummary()
  if (!teamSeason) {
    return { pendingReviews: 0, tournaments: 0, ncsLinkedPlayers: 0 }
  }

  try {
    const [pendingReviews, tournaments, ncsLinkedPlayers] = await Promise.all([
      prisma.ncsChangeReview.count({
        where: {
          teamSeasonId: teamSeason.id,
          status: { in: ['change_detected', 'pending_review'] },
        },
      }),
      prisma.ncsTournamentEntry.count({ where: { teamSeasonId: teamSeason.id } }),
      prisma.ncsPlayerSource.count({ where: { teamSeasonId: teamSeason.id } }),
    ])
    return { pendingReviews, tournaments, ncsLinkedPlayers }
  } catch {
    return { pendingReviews: 0, tournaments: 0, ncsLinkedPlayers: 0 }
  }
}

/**
 * Full roster for the active TeamSeason with NCS source linkage, for the
 * Roster page table.
 */
export async function getRosterPageData() {
  noStore()

  const teamSeason = await getActiveTeamSeasonSummary()
  if (!teamSeason) return { teamSeason: null, entries: [] as RosterPageEntry[] }

  try {
    const rosterEntries = await prisma.rosterEntry.findMany({
      where: { teamSeasonId: teamSeason.id, isActive: true },
      orderBy: [{ jerseyNumber: 'asc' }, { createdAt: 'asc' }],
      include: { player: true, ncsPlayerSource: true },
    })

    const entries: RosterPageEntry[] = rosterEntries.map((entry) => {
      const fullName = entry.player.fullName?.trim()
      const name =
        fullName && fullName.length > 0
          ? fullName
          : [entry.player.firstName, entry.player.lastName].filter(Boolean).join(' ') ||
            'Unnamed Player'
      return {
        id: entry.id,
        name,
        jerseyNumber: entry.jerseyNumber,
        position: entry.ncsPlayerSource?.rawPosition ?? null,
        ncsLinked: entry.ncsPlayerSource != null,
        lastPolledAt: entry.ncsPlayerSource?.lastPolledAt?.toISOString() ?? null,
        addedAt: entry.createdAt.toISOString(),
      }
    })

    return { teamSeason, entries }
  } catch {
    return { teamSeason, entries: [] as RosterPageEntry[] }
  }
}

export type RosterPageEntry = {
  id: string
  name: string
  jerseyNumber: string | null
  position: string | null
  ncsLinked: boolean
  lastPolledAt: string | null
  addedAt: string
}

/**
 * All teams and their seasons for the signed-in coach's organization, for the
 * Teams page.
 */
export async function getTeamsPageData() {
  noStore()

  const organizationId = await getCurrentOrganizationId()
  if (!organizationId) return []

  try {
    return await prisma.team.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        seasons: {
          orderBy: [{ updatedAt: 'desc' }],
          select: {
            id: true,
            season: true,
            age_group: true,
            isActive: true,
            _count: { select: { rosterEntries: { where: { isActive: true } } } },
          },
        },
      },
    })
  } catch {
    return []
  }
}

/**
 * Public, UNAUTHENTICATED projection of an active TeamSeason. The public site
 * reads through this path, so it never gates on a coach session — but it also
 * never exposes coach-private fields (coach_notes / coach_practice_version are
 * stripped before projection).
 */
export async function getPublicTeamSeasonPayload(organizationId?: string) {
  noStore()

  let teamSeason: Awaited<ReturnType<typeof findPublicSeason>> = null
  try {
    teamSeason = await findPublicSeason(organizationId)
  } catch {
    return null
  }
  if (!teamSeason) return null

  return toPublicTeamSeasonPayload({
    ...teamSeason,
    coach_notes: null,
    coach_practice_version: null,
  })
}

function findPublicSeason(organizationId?: string) {
  return prisma.teamSeason.findFirst({
    where: {
      isActive: true,
      ...(organizationId ? { team: { organizationId } } : {}),
    },
    orderBy: ORDER,
    select: SEASON_FIELDS,
  })
}
