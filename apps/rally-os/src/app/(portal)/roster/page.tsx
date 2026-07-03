import Link from 'next/link'
import { Badge, Card } from '@rally/ui'
import { getRosterPageData } from '../../../lib/portal-data'

export const dynamic = 'force-dynamic'

export default async function RosterPage() {
  const { teamSeason, entries } = await getRosterPageData()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent-lime">
            Roster
          </p>
          <h1 className="text-2xl font-semibold text-text-primary">
            {teamSeason ? `${teamSeason.team_name} • ${teamSeason.season}` : 'No active TeamSeason'}
          </h1>
        </div>
        <Badge>{entries.length} Active Players</Badge>
      </div>

      {entries.length === 0 ? (
        <Card className="space-y-2 p-8">
          <p className="text-text-primary">No active roster entries yet.</p>
          <p className="text-sm text-text-muted">
            Import players from NCS on the{' '}
            <Link href="/ncs-roster-dashboard" className="text-accent-lime underline">
              NCS Roster Dashboard
            </Link>{' '}
            — search for your team or paste the roster table.
          </p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-text-muted">
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Player</th>
                <th className="px-4 py-3 font-semibold">Position</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Last NCS Poll</th>
                <th className="px-4 py-3 font-semibold">Added</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-mono text-text-primary">
                    {entry.jerseyNumber ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-text-primary">{entry.name}</td>
                  <td className="px-4 py-3 text-text-muted">{entry.position ?? '—'}</td>
                  <td className="px-4 py-3">
                    {entry.ncsLinked ? (
                      <Badge>NCS</Badge>
                    ) : (
                      <span className="text-text-muted">Manual</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {entry.lastPolledAt ? new Date(entry.lastPolledAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {new Date(entry.addedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
