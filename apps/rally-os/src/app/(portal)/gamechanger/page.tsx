import { Card } from '@rally/ui'
import { GameChangerDashboard } from '../../../components/gamechanger-dashboard'
import { getGameChangerPageData } from '../../../actions/gamechanger'
import { getActiveTeamSeason } from '../../../lib/portal-data'

export const dynamic = 'force-dynamic'

export default async function GameChangerPage() {
  const activeTeamSeason = await getActiveTeamSeason()

  if (!activeTeamSeason) {
    return (
      <Card className="p-8">
        <h1 className="text-2xl font-bold text-text-primary">GameChanger</h1>
        <p className="mt-2 text-text-muted">No active TeamSeason found. Set one up in Team Info first.</p>
      </Card>
    )
  }

  const data = await getGameChangerPageData(activeTeamSeason.id)

  if (!data.teamSeason) {
    return (
      <Card className="p-8">
        <h1 className="text-2xl font-bold text-text-primary">GameChanger</h1>
        <p className="mt-2 text-text-muted">Unable to load TeamSeason GameChanger data.</p>
      </Card>
    )
  }

  return (
    <GameChangerDashboard
      teamSeasonId={data.teamSeason.id}
      teamSeasonName={`${data.teamSeason.team_name} — ${data.teamSeason.season}`}
      gcTeamId={data.teamSeason.gcTeamId}
      rosterEntries={data.rosterEntries}
      scheduleDrafts={data.scheduleDrafts}
      pushRequests={data.pushRequests}
      snapshots={data.snapshots}
    />
  )
}
