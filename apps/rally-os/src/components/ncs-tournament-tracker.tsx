'use client'

import { useState, useTransition } from 'react'
import { Button, Card } from '@rally/ui'
import { previewNcsTournaments, attachNcsTournaments, resolveNcsChangeReview } from '../actions/ncs'
import type { PreviewTournamentsResult } from '../actions/ncs'
import type { ParsedTournamentRow } from '@rally/ncs'

type TournamentEntryRow = {
  id: string
  isRegistered: boolean
  tournament: {
    id: string
    name: string
    startDate: Date | null
    endDate: Date | null
    location: string | null
    ageGroups: string | null
    ncsExternalId: string | null
  }
}

type ChangeReviewRow = {
  id: string
  changeType: string | null
  status: string
  payload: unknown
  createdAt: Date
}

type Props = {
  teamSeasonId: string
  teamSeasonName: string
  entries: TournamentEntryRow[]
  changeReviews: ChangeReviewRow[]
}

type Step = 'form' | 'preview' | 'done'

export function NcsTournamentTracker({ teamSeasonId, teamSeasonName, entries, changeReviews }: Props) {
  const [step, setStep] = useState<Step>('form')
  const [previewResult, setPreviewResult] = useState<PreviewTournamentsResult | null>(null)
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [attachResult, setAttachResult] = useState<{ attached: number; skipped: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // ── Step 1: Preview ────────────────────────────────────────────────────────

  function handlePreview(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await previewNcsTournaments(formData)
      setPreviewResult(result)
      if (result.ok) {
        setSelectedIndices(new Set(result.rows.map((_, i) => i)))
        setStep('preview')
      } else {
        setError(result.error)
      }
    })
  }

  // ── Step 2: Attach ─────────────────────────────────────────────────────────

  function handleAttach(rows: ParsedTournamentRow[]) {
    setError(null)
    const formData = new FormData()
    formData.set('teamSeasonId', teamSeasonId)
    formData.set('rows', JSON.stringify(rows))
    formData.set('selectedIndices', JSON.stringify([...selectedIndices]))
    startTransition(async () => {
      const result = await attachNcsTournaments(formData)
      if (result.ok) {
        setAttachResult({ attached: result.attached, skipped: result.skipped })
        setStep('done')
      } else {
        setError(result.error)
      }
    })
  }

  // ── Review actions ─────────────────────────────────────────────────────────

  function handleReview(reviewId: string, action: 'pending_review' | 'accepted' | 'ignored') {
    const formData = new FormData()
    formData.set('reviewId', reviewId)
    formData.set('action', action)
    startTransition(async () => {
      await resolveNcsChangeReview(formData)
    })
  }

  const rows = previewResult?.ok ? previewResult.rows : []

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent-lime">
          NCS Tournament Tracker
        </p>
        <h2 className="text-2xl font-semibold text-text-primary">{teamSeasonName}</h2>
        <p className="text-sm text-text-muted">
          Paste upcoming NCS tournament data to browse, attach to your schedule, and monitor
          registration changes.
        </p>
      </Card>

      {/* Step 1 — Paste form */}
      {step === 'form' && (
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">1. Paste NCS Tournament List</h3>
          <form action={handlePreview} className="space-y-4">
            <label className="block space-y-1 text-sm text-text-muted">
              <span>
                Paste tournament text (tab-delimited or multi-space; include header row if
                available)
              </span>
              <textarea
                name="pasteText"
                required
                rows={8}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-lime"
                placeholder={
                  'Tournament Name\tDate\tLocation\tAge Groups\nSpring Invitational\t2026-03-15\tSan Jose, CA\t10U, 12U'
                }
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Parsing…' : 'Preview Tournaments'}
            </Button>
          </form>
        </Card>
      )}

      {/* Step 2 — Preview & select */}
      {step === 'preview' && previewResult?.ok && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">
              2. Select Tournaments to Attach
            </h3>
            <button
              onClick={() => { setStep('form'); setPreviewResult(null) }}
              className="text-sm text-text-muted hover:text-text-primary"
            >
              ← Back
            </button>
          </div>

          {previewResult.warnings.length > 0 && (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-300">
              {previewResult.warnings.map((w, i) => (
                <p key={i}>{w}</p>
              ))}
            </div>
          )}

          <p className="text-sm text-text-muted">
            Parse mode:{' '}
            <span className="font-mono text-accent-lime">{previewResult.parseMode}</span>
            {' · '}
            {rows.length} row{rows.length !== 1 ? 's' : ''} found
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setSelectedIndices(new Set(rows.map((_, i) => i)))}
              className="text-sm text-accent-lime hover:underline"
            >
              Select all
            </button>
            <button
              onClick={() => setSelectedIndices(new Set())}
              className="text-sm text-text-muted hover:underline"
            >
              Clear
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-muted">
                  <th className="pb-2 pr-4 font-medium">Attach?</th>
                  <th className="pb-2 pr-4 font-medium">Tournament</th>
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Location</th>
                  <th className="pb-2 pr-4 font-medium">Age Groups</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 pr-4">
                      <input
                        type="checkbox"
                        checked={selectedIndices.has(i)}
                        onChange={(e) => {
                          const next = new Set(selectedIndices)
                          if (e.target.checked) next.add(i)
                          else next.delete(i)
                          setSelectedIndices(next)
                        }}
                        className="h-4 w-4 accent-accent-lime"
                      />
                    </td>
                    <td className="py-2 pr-4 text-text-primary">{row.name}</td>
                    <td className="py-2 pr-4 text-text-muted">{row.startDate ?? '—'}</td>
                    <td className="py-2 pr-4 text-text-muted">{row.location ?? '—'}</td>
                    <td className="py-2 pr-4 text-text-muted">{row.ageGroups ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button
            disabled={isPending || selectedIndices.size === 0}
            onClick={() => handleAttach(rows)}
          >
            {isPending
              ? 'Attaching…'
              : `Attach ${selectedIndices.size} Tournament${selectedIndices.size !== 1 ? 's' : ''}`}
          </Button>
        </Card>
      )}

      {/* Step 3 — Done */}
      {step === 'done' && attachResult && (
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Tournaments Attached</h3>
          <p className="text-text-muted">
            <span className="text-accent-lime font-semibold">{attachResult.attached}</span>{' '}
            tournament{attachResult.attached !== 1 ? 's' : ''} added to your schedule
            {attachResult.skipped > 0 && <>, {attachResult.skipped} skipped</>}.
          </p>
          <Button
            variant="secondary"
            onClick={() => { setStep('form'); setAttachResult(null); setPreviewResult(null) }}
          >
            Add More
          </Button>
        </Card>
      )}

      {/* Change review queue */}
      {changeReviews.length > 0 && (
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">
            Tournament Change Reviews
            <span className="ml-2 rounded-full bg-accent-lime/20 px-2 py-0.5 text-xs text-accent-lime">
              {changeReviews.length}
            </span>
          </h3>
          <div className="space-y-3">
            {changeReviews.map((review) => {
              const payload = review.payload as {
                changeType: string
                matchKey?: string
                after?: ParsedTournamentRow
              }
              return (
                <div key={review.id} className="rounded-xl border border-border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-accent-lime">{review.changeType}</span>
                    <span className="text-xs text-text-muted">{review.status}</span>
                  </div>
                  {payload.after && (
                    <p className="text-sm text-text-primary">{payload.after.name}</p>
                  )}
                  <div className="flex gap-2">
                    {review.status === 'change_detected' && (
                      <Button
                        variant="secondary"
                        className="text-xs px-3 py-1"
                        onClick={() => handleReview(review.id, 'pending_review')}
                        disabled={isPending}
                      >
                        Mark for Review
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      className="text-xs px-3 py-1"
                      onClick={() => handleReview(review.id, 'ignored')}
                      disabled={isPending}
                    >
                      Ignore
                    </Button>
                    {review.status === 'pending_review' && (
                      <Button
                        className="text-xs px-3 py-1"
                        onClick={() => handleReview(review.id, 'accepted')}
                        disabled={isPending}
                      >
                        Accept
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Current schedule */}
      {entries.length > 0 && (
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">
            Attached Tournaments ({entries.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-muted">
                  <th className="pb-2 pr-4 font-medium">Tournament</th>
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Location</th>
                  <th className="pb-2 pr-4 font-medium">Age Groups</th>
                  <th className="pb-2 pr-4 font-medium">Registered?</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/50">
                    <td className="py-2 pr-4 text-text-primary">{entry.tournament.name}</td>
                    <td className="py-2 pr-4 text-text-muted">
                      {entry.tournament.startDate
                        ? new Date(entry.tournament.startDate).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="py-2 pr-4 text-text-muted">{entry.tournament.location ?? '—'}</td>
                    <td className="py-2 pr-4 text-text-muted">
                      {entry.tournament.ageGroups ?? '—'}
                    </td>
                    <td className="py-2 pr-4">
                      {entry.isRegistered ? (
                        <span className="text-accent-lime">Yes</span>
                      ) : (
                        <span className="text-text-muted">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
