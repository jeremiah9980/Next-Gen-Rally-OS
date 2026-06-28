import { NcsRosterDashboard } from '../../../components/ncs-roster-dashboard'
import { getNcsDashboardData } from '../../../actions/ncs'
import { getActiveTeamSeason } from '../../../lib/portal-data'
import { Card } from '@rally/ui'

export const dynamic = 'force-dynamic'

export default async function NcsRosterDashboardPage() {
  const teamSeason = await getActiveTeamSeason()

  if (!teamSeason) {
    return (
      <Card className="p-8">
        <h1 className="text-2xl font-bold text-text-primary">NCS Roster Dashboard</h1>
        <p className="mt-2 text-text-muted">
          No active TeamSeason found. Set one up in Team Info first.
        </p>
      </Card>
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
  )
}
