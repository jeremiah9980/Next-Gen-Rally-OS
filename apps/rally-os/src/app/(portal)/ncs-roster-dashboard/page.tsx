import { NcsRosterDashboard } from '../../../components/ncs-roster-dashboard'
import { getNcsDashboardData } from '../../../actions/ncs'
import { getActiveTeamSeason } from '../../../lib/portal-data'
import { Card } from '@rally/ui'
import { getActiveTeamSeason } from '../../../lib/portal-data'
import { NcsRosterClient } from './ncs-roster-client'

export const dynamic = 'force-dynamic'

export default async function NcsRosterDashboardPage() {
  const teamSeason = await getActiveTeamSeason()

  if (!teamSeason) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-8 shadow-neon">
        <h1 className="text-2xl font-bold text-text-primary">NCS Roster Dashboard</h1>
        <p className="mt-2 text-text-muted">No active TeamSeason found. Set one up in Team Info first.</p>
      </div>
    )
  }

  const { sources, changeReviews } = await getNcsDashboardData(teamSeason.id)

  return (
    <NcsRosterDashboard
      teamSeasonId={teamSeason.id}
      teamSeasonName={`${teamSeason.team_name} — ${teamSeason.season}`}
      sources={sources}
      changeReviews={changeReviews}
    />
      <Card className="p-8">
        <h1 className="text-2xl font-bold text-text-primary">NCS Roster Dashboard</h1>
        <p className="mt-2 text-text-muted">
          No active TeamSeason found. Please set up a TeamSeason first.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent-lime">
          NCS Integration
        </p>
        <h1 className="text-3xl font-semibold text-text-primary">NCS Roster Dashboard</h1>
        <p className="mt-1 text-text-muted">
          Paste NCS roster data to preview and selectively import players into{' '}
          <span className="font-semibold text-text-primary">{teamSeason.team_name}</span>.
        </p>
      </div>
      <NcsRosterClient teamSeasonId={teamSeason.id} />
    </div>
  )
}
