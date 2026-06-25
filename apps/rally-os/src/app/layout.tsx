import type { Metadata } from 'next'
import { Avatar, Nav } from '@rally/ui'
import { getActiveTeamSeasonSummary } from '../lib/portal-data'
import { navItems } from '../lib/nav-items'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rally OS Team Portal',
  description: 'Team Portal dashboard shell for Rally OS',
}

export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const activeSeason = await getActiveTeamSeasonSummary()
  const seasonLabel = activeSeason
    ? `${activeSeason.team_name} • ${activeSeason.season}`
    : 'No active TeamSeason'

  return (
    <html lang="en">
      <body className="bg-background text-text-primary">
        <div className="flex min-h-screen bg-background">
          <Nav items={navItems} />
          <div className="flex min-h-screen flex-1 flex-col">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-4 backdrop-blur md:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-lime">
                  Active TeamSeason
                </p>
                <h1 className="text-lg font-semibold text-text-primary md:text-2xl">
                  {seasonLabel}
                </h1>
              </div>
              <div className="flex items-center gap-3 rounded-full border border-border bg-background px-3 py-2">
                <Avatar name="Coach" />
                <div className="hidden text-right md:block">
                  <p className="text-sm font-medium text-text-primary">Coach Menu</p>
                  <p className="text-xs text-text-muted">Placeholder</p>
                </div>
              </div>
            </header>
            <main className="flex-1 bg-background px-4 py-6 md:px-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  )
}
