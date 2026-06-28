import { Badge, Card } from '@rally/ui'
import { prisma } from '@rally/core-data'
import { GenerateSuggestionsButton } from '../../../components/generate-suggestions-button'
import { getActiveTeamSeason } from '../../../lib/portal-data'

export const dynamic = 'force-dynamic'

export default async function PlayerDevelopmentPage() {
  const teamSeason = await getActiveTeamSeason()

  const focuses = teamSeason
    ? await prisma.developmentFocus
        .findMany({
          where: { teamSeasonId: teamSeason.id },
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { player: { select: { fullName: true, firstName: true, lastName: true } } },
        })
        .catch(() => [])
    : []

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent-lime">
          Player Development
        </p>
        <h2 className="text-3xl font-semibold text-text-primary">AI development suggestions</h2>
        <p className="text-text-muted">
          Summarize recurring errors and improvement areas from recent stats and coach notes. These
          are <span className="font-semibold text-text-primary">advisory only</span> — review before acting.
        </p>
      </div>

      <Card className="space-y-4">
        <GenerateSuggestionsButton />
      </Card>

      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent-lime">
          Development focus
        </p>
        {focuses.length === 0 ? (
          <Card>
            <p className="text-text-muted">No development focus items yet.</p>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {focuses.map((focus) => {
              const name =
                focus.player?.fullName?.trim() ||
                [focus.player?.firstName, focus.player?.lastName].filter(Boolean).join(' ') ||
                'Team'
              return (
                <Card key={focus.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-text-primary">{focus.title}</p>
                    {focus.source === 'ai' ? <Badge>ai</Badge> : null}
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{name}</p>
                  {focus.detail ? <p className="text-sm text-text-muted">{focus.detail}</p> : null}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
