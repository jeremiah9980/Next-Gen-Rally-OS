import { Badge, Card } from '@rally/ui'
import { prisma } from '@rally/core-data'
import { getActiveTeamSeason } from '../../../lib/portal-data'
import { NcsTournamentClient } from './ncs-tournament-client'

export const dynamic = 'force-dynamic'

export default async function NcsTournamentTrackerPage() {
  const teamSeason = await getActiveTeamSeason()

  if (!teamSeason) {
    return (
      <Card className="p-8">
        <h1 className="text-2xl font-bold text-text-primary">NCS Tournament Tracker</h1>
        <p className="mt-2 text-text-muted">
          No active TeamSeason found. Please set up a TeamSeason first.
        </p>
      </Card>
    )
  }

  const trackedTournaments = await prisma.ncsTournamentEntry.findMany({
    where: { teamSeasonId: teamSeason.id },
    orderBy: [{ attachedAt: 'desc' }],
    include: {
      tournament: true,
    },
  })

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent-lime">
          NCS Integration
        </p>
        <h1 className="text-3xl font-semibold text-text-primary">NCS Tournament Tracker</h1>
        <p className="mt-1 text-text-muted">
          Track NCS tournament opportunities and registration links for{' '}
          <span className="font-semibold text-text-primary">{teamSeason.team_name}</span>.
        </p>
      </div>

      <NcsTournamentClient teamSeasonId={teamSeason.id} />

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent-lime">
              Attached tournaments
            </p>
            <h2 className="text-xl font-semibold text-text-primary">Current tracker list</h2>
          </div>
          <Badge>{trackedTournaments.length} tracked</Badge>
        </div>

        {trackedTournaments.length === 0 ? (
          <p className="text-sm text-text-muted">
            No tournaments have been attached to the active TeamSeason yet.
          </p>
        ) : (
          <div className="space-y-3">
            {trackedTournaments.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-border bg-background px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">
                      {entry.tournament.name}
                    </h3>
                    <p className="mt-1 text-sm text-text-muted">
                      {entry.tournament.location ?? 'Location TBD'}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.24em] text-text-muted">
                      {entry.tournament.startDate
                        ? entry.tournament.startDate.toLocaleDateString()
                        : 'Start TBD'}
                      {' • '}
                      {entry.tournament.endDate
                        ? entry.tournament.endDate.toLocaleDateString()
                        : 'End TBD'}
                    </p>
                  </div>
                  <Badge>{entry.isRegistered ? 'registered' : 'planning'}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
