import { Badge, Card } from '@rally/ui'
import { prisma } from '@rally/core-data'
import { getActiveTeamSeason } from '../../../lib/portal-data'
import { ReviewActionForm } from './review-action-form'

export const dynamic = 'force-dynamic'

function getPlayerLabel(review: {
  player: { fullName: string | null; firstName: string | null; lastName: string | null } | null
  newValue: string | null
  oldValue: string | null
}) {
  const playerName = review.player?.fullName?.trim()
  if (playerName) return playerName

  const combined = [review.player?.firstName, review.player?.lastName].filter(Boolean).join(' ')
  if (combined) return combined

  return review.newValue ?? review.oldValue ?? 'Unmatched player'
}

export default async function NcsChangeReviewPage() {
  const teamSeason = await getActiveTeamSeason()

  if (!teamSeason) {
    return (
      <Card>
        <p className="text-text-muted">No active TeamSeason is available yet.</p>
      </Card>
    )
  }

  const reviews = await prisma.ncsChangeReview.findMany({
    where: {
      teamSeasonId: teamSeason.id,
      status: {
        in: ['change_detected', 'pending_review'],
      },
    },
    orderBy: [{ createdAt: 'desc' }, { updatedAt: 'desc' }],
    include: {
      player: {
        select: {
          fullName: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent-lime">
          NCS Integration
        </p>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold text-text-primary">NCS Change Review</h1>
          <Badge>{reviews.length} pending</Badge>
        </div>
        <p className="text-text-muted">
          Review detected NCS roster changes for{' '}
          <span className="font-semibold text-text-primary">{teamSeason.team_name}</span>. Changes
          are never applied automatically.
        </p>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <p className="text-text-muted">No pending NCS changes were found for the active season.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent-lime">
                    {review.field.replace(/_/g, ' ')}
                  </p>
                  <h2 className="text-xl font-semibold text-text-primary">
                    {getPlayerLabel(review)}
                  </h2>
                  <p className="text-sm text-text-muted">
                    {review.ncsId ? `NCS ID: ${review.ncsId}` : 'No NCS ID on source row'}
                  </p>
                </div>
                <Badge>{review.status}</Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
                    Previous value
                  </p>
                  <p className="mt-2 text-sm text-text-primary">{review.oldValue ?? '—'}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
                    Incoming value
                  </p>
                  <p className="mt-2 text-sm text-text-primary">{review.newValue ?? '—'}</p>
                </div>
              </div>

              <ReviewActionForm reviewId={review.id} />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
