import { NcsTournamentTracker } from '../../../components/ncs-tournament-tracker'
import { getNcsTournamentData } from '../../../actions/ncs'
import { getActiveTeamSeason } from '../../../lib/portal-data'

export const dynamic = 'force-dynamic'

export default async function NcsTournamentTrackerPage() {
  const teamSeason = await getActiveTeamSeason()

  if (!teamSeason) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-8 shadow-neon">
        <h1 className="text-2xl font-bold text-text-primary">NCS Tournament Tracker</h1>
        <p className="mt-2 text-text-muted">No active TeamSeason found. Set one up in Team Info first.</p>
      </div>
    )
  }

  const { entries, changeReviews } = await getNcsTournamentData(teamSeason.id)

  return (
    <NcsTournamentTracker
      teamSeasonId={teamSeason.id}
      teamSeasonName={`${teamSeason.team_name} — ${teamSeason.season}`}
      entries={entries}
      changeReviews={changeReviews}
    />
  )
}
