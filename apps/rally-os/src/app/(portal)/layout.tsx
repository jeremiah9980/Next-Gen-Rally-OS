import { PortalNav } from '../../components/portal-nav'
import { CoachMenu } from '../../components/coach-menu'
import { requireUser } from '../../lib/session'
import { getActiveTeamSeasonSummary } from '../../lib/portal-data'

export const dynamic = 'force-dynamic'

export default async function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Gate every portal route: unauthenticated visitors are redirected to /login.
  const user = await requireUser()

  const activeSeason = await getActiveTeamSeasonSummary()
  const seasonLabel = activeSeason
    ? `${activeSeason.team_name} • ${activeSeason.season}`
    : 'No active TeamSeason'

  const coachName = user.name ?? user.email ?? 'Coach'

  return (
    <div className="flex min-h-screen bg-background">
      <PortalNav />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-4 backdrop-blur md:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-lime">
              Active TeamSeason
            </p>
            <h1 className="text-lg font-semibold text-text-primary md:text-2xl">{seasonLabel}</h1>
          </div>
          <CoachMenu name={coachName} email={user.email ?? null} />
        </header>
        <main className="flex-1 bg-background px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  )
}
