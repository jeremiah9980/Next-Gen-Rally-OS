import { Badge, Card } from '@rally/ui'
import { getTeamsPageData } from '../../../lib/portal-data'

export const dynamic = 'force-dynamic'

export default async function TeamsPage() {
  const teams = await getTeamsPageData()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent-lime">Teams</p>
        <h1 className="text-2xl font-semibold text-text-primary">Organization Teams</h1>
      </div>

      {teams.length === 0 ? (
        <Card className="space-y-2 p-8">
          <p className="text-text-primary">No teams found for your organization.</p>
          <p className="text-sm text-text-muted">
            Provision a team through the Org Builder wizard, or seed demo data with{' '}
            <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">
              pnpm db:seed
            </code>
            .
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {teams.map((team) => (
            <Card key={team.id} className="space-y-4">
              <h2 className="text-lg font-semibold text-text-primary">{team.name}</h2>
              {team.seasons.length === 0 ? (
                <p className="text-sm text-text-muted">No seasons yet.</p>
              ) : (
                <ul className="space-y-2">
                  {team.seasons.map((season) => (
                    <li
                      key={season.id}
                      className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {season.season} • {season.age_group}
                        </p>
                        <p className="text-xs text-text-muted">
                          {season._count.rosterEntries} active players
                        </p>
                      </div>
                      {season.isActive ? <Badge>Active</Badge> : null}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
