import { prisma } from '@rally/core-data'
import type { SiteConfig } from '@rally/config'
import type {
  PublicPracticePlan,
  PublishedProjection,
} from '@rally/site-template'

function playerName(p: { fullName: string | null; firstName: string | null; lastName: string | null }) {
  return p.fullName?.trim() || [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Unnamed Player'
}

function formatDate(d: Date | null | undefined) {
  if (!d) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Build the public-safe PublishedProjection for an organization's active
 * TeamSeason. Reads the operational record but only ever emits public-safe data:
 *  - schedule: APPROVED games only (approved / pushed_to_gamechanger).
 *  - practice_plans: the PLAYER version only.
 *  - coach: staff + philosophy; never coach_notes.
 * Each section is included only when its module toggle is on.
 */
export async function buildPublishedProjection(
  organizationId: string,
  config: SiteConfig,
): Promise<PublishedProjection | null> {
  const season = await prisma.teamSeason.findFirst({
    where: { isActive: true, team: { organizationId } },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
  })
  if (!season) return null

  const m = config.modules
  const projection: PublishedProjection = {
    organization: config.organization,
    team: { name: season.team_name, season: season.season, age_group: season.age_group },
  }

  if (m.home) {
    projection.home = { tagline: `${season.season} • ${season.age_group}`, intro: season.development_goals ?? undefined }
  }
  if (m.team_info) {
    projection.team_info = {
      head_coach: season.head_coach ?? undefined,
      practice_location: season.practice_location ?? undefined,
      primary_game_location: season.primary_game_location ?? undefined,
    }
  }
  if (m.standards) {
    projection.standards = {
      team_standards: season.team_standards ?? undefined,
      development_goals: season.development_goals ?? undefined,
      communication_expectations: season.communication_expectations ?? undefined,
    }
  }
  if (m.coach) {
    const staff = [
      season.head_coach ? { name: season.head_coach, role: 'Head Coach' } : null,
      ...(season.assistant_coaches ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name) => ({ name, role: 'Assistant Coach' })),
    ].filter((s): s is { name: string; role: string } => s !== null)
    projection.coach = { staff, philosophy: season.team_standards ?? undefined }
  }

  if (m.roster || m.player_profiles || m.gamechanger_stats) {
    const entries = await prisma.rosterEntry.findMany({
      where: { teamSeasonId: season.id, isActive: true },
      orderBy: [{ jerseyNumber: 'asc' }, { createdAt: 'asc' }],
      include: {
        player: {
          include: {
            gameChangerStatSnapshots: {
              where: { teamSeasonId: season.id },
              orderBy: { capturedAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    })
    if (m.roster) {
      projection.roster = {
        players: entries.map((e) => ({ name: playerName(e.player), jerseyNumber: e.jerseyNumber ?? undefined })),
      }
    }
    if (m.player_profiles) {
      projection.player_profiles = { profiles: entries.map((e) => ({ name: playerName(e.player) })) }
    }
    if (m.gamechanger_stats) {
      projection.gamechanger_stats = {
        rows: entries.map((e) => {
          const s = e.player.gameChangerStatSnapshots[0]
          return {
            name: playerName(e.player),
            avg: s?.avg ? s.avg.toFixed(3) : '0.000',
            ab: `${s?.ab ?? 0}`,
            rbi: `${s?.rbi ?? 0}`,
            hr: `${s?.hr ?? 0}`,
          }
        }),
      }
    }
  }

  if (m.schedule) {
    const games = await prisma.scheduleGame.findMany({
      where: { teamSeasonId: season.id, status: { in: ['approved', 'pushed_to_gamechanger'] } },
      orderBy: { gameDate: 'asc' },
    })
    projection.schedule = {
      games: games.map((g) => ({
        opponent: g.opponent,
        date: formatDate(g.gameDate),
        time: g.gameTime ?? undefined,
        location: g.location ?? undefined,
      })),
    }
  }

  if (m.tournaments) {
    const entries = await prisma.ncsTournamentEntry.findMany({
      where: { teamSeasonId: season.id },
      include: { tournament: true },
      orderBy: { createdAt: 'desc' },
    })
    projection.tournaments = {
      events: entries.map((e) => ({
        name: e.tournament.name,
        location: e.tournament.location ?? undefined,
        startDate: formatDate(e.tournament.startDate),
        endDate: formatDate(e.tournament.endDate),
      })),
    }
  }

  if (m.practice_plans) {
    const versions = await prisma.practicePlanVersion.findMany({
      where: { type: 'PLAYER', practicePlan: { teamSeasonId: season.id } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })
    projection.practice_plans = {
      plans: versions.map((v) => v.content as PublicPracticePlan),
    }
  }

  if (m.player_development) {
    const focuses = await prisma.developmentFocus.findMany({
      where: { teamSeasonId: season.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    projection.player_development = {
      focuses: focuses.map((f) => ({ title: f.title, detail: f.detail ?? undefined })),
    }
  }

  return projection
}
