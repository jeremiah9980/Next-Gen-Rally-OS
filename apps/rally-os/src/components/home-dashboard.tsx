import { Avatar, Badge, Card, StatTile } from '@rally/ui'
import { getDashboardData } from '../lib/portal-data'

export async function HomeDashboard() {
  const { teamSeason, athleteCount, roster } = await getDashboardData()

  return (
    <div className="space-y-8">
      <Card className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent-lime">
              Coach Dashboard
            </p>
            <h2 className="text-3xl font-semibold text-text-primary">
              {teamSeason?.team_name ?? 'No active TeamSeason'}
            </h2>
            <div className="flex flex-wrap gap-3 text-sm text-text-muted">
              <span>Season: {teamSeason?.season ?? '—'}</span>
              <span>Age Group: {teamSeason?.age_group ?? '—'}</span>
              <span>Head Coach: {teamSeason?.head_coach ?? '—'}</span>
            </div>
          </div>
          <Badge>{athleteCount} Athletes</Badge>
        </div>
      </Card>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent-lime">
            Active Roster
          </p>
          <h3 className="text-2xl font-semibold text-text-primary">Roster Grid</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roster.length > 0 ? (
            roster.map((player) => (
              <Card key={player.id} className="space-y-5">
                <div className="flex items-center gap-4">
                  <Avatar name={player.name} />
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-text-primary">{player.name}</p>
                    <p className="text-sm text-text-muted">Jersey #{player.jerseyNumber ?? '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <StatTile label="AVG" value={player.stats.avg} />
                  <StatTile label="AB" value={player.stats.ab} />
                  <StatTile label="RBI" value={player.stats.rbi} />
                  <StatTile label="HR" value={player.stats.hr} />
                </div>
              </Card>
            ))
          ) : (
            <Card className="md:col-span-2 xl:col-span-3">
              <p className="text-text-muted">
                No active roster entries are available for the current TeamSeason.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
