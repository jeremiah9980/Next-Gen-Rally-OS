'use client'

import { useState, useTransition } from 'react'
import { Button, Card } from '@rally/ui'
import {
  previewNcsRoster,
  importNcsPlayers,
  rediffNcsRoster,
  resolveNcsChangeReview,
  searchNcsTeams,
  fetchNcsTeamRoster,
} from '../actions/ncs'
import type { PreviewRosterResult } from '../actions/ncs'
import type { ParsedRosterRow, NcsTeamResult } from '@rally/ncs'

type NcsPlayerSourceRow = {
  id: string
  ncsExternalId: string | null
  ncsTeamUrl: string | null
  player: { id: string; fullName: string | null; firstName: string | null; lastName: string | null; jerseyNumber: string | null }
  rosterEntry: { id: string; jerseyNumber: string | null; isActive: boolean } | null
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
  sources: NcsPlayerSourceRow[]
  changeReviews: ChangeReviewRow[]
}

type Step = 'form' | 'preview' | 'done'

export function NcsRosterDashboard({ teamSeasonId, teamSeasonName, sources, changeReviews }: Props) {
  const [step, setStep] = useState<Step>('form')
  const [previewResult, setPreviewResult] = useState<PreviewRosterResult | null>(null)
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ncsTeamUrl, setNcsTeamUrl] = useState('')
  const [rediffText, setRediffText] = useState('')
  const [rediffResult, setRediffResult] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // ── Step 1: Search NCS teams ────────────────────────────────────────────────

  const [sourceMode, setSourceMode] = useState<'paste' | 'search'>('search')
  const [searchResults, setSearchResults] = useState<NcsTeamResult[] | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [loadingTeamId, setLoadingTeamId] = useState<string | null>(null)
  const [pickedTeamLabel, setPickedTeamLabel] = useState<string | null>(null)

  function handleSearchTeams(formData: FormData) {
    setSearchError(null)
    startTransition(async () => {
      const result = await searchNcsTeams(formData)
      if (result.ok) {
        setSearchResults(result.teams)
        if (result.teams.length === 0) setSearchError('No NCS teams matched that search.')
      } else {
        setSearchResults(null)
        setSearchError(result.error)
      }
    })
  }

  function handlePickTeam(team: NcsTeamResult) {
    setSearchError(null)
    setLoadingTeamId(team.id)
    const formData = new FormData()
    formData.set('teamId', team.id)
    startTransition(async () => {
      const result = await fetchNcsTeamRoster(formData)
      setLoadingTeamId(null)
      if (result.ok) {
        setNcsTeamUrl(result.ncsTeamUrl)
        setPickedTeamLabel(
          [result.teamName, result.division, result.location].filter(Boolean).join(' · '),
        )
        setPreviewResult({ ok: true, rows: result.rows, parseMode: 'header', warnings: [] })
        setSelectedIndices(new Set(result.rows.map((_, i) => i)))
        setStep('preview')
      } else {
        setSearchError(result.error)
      }
    })
  }

  // ── Step 1: Preview ────────────────────────────────────────────────────────

  function handlePreview(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await previewNcsRoster(formData)
      setPreviewResult(result)
      if (result.ok) {
        setSelectedIndices(new Set(result.rows.map((_, i) => i)))
        setStep('preview')
      } else {
        setError(result.error)
      }
    })
  }

  // ── Step 2: Import ─────────────────────────────────────────────────────────

  function handleImport(rows: ParsedRosterRow[]) {
    setError(null)
    const formData = new FormData()
    formData.set('teamSeasonId', teamSeasonId)
    if (ncsTeamUrl.trim()) formData.set('ncsTeamUrl', ncsTeamUrl.trim())
    formData.set('rows', JSON.stringify(rows))
    formData.set('selectedIndices', JSON.stringify([...selectedIndices]))
    startTransition(async () => {
      const result = await importNcsPlayers(formData)
      if (result.ok) {
        setImportResult({ imported: result.imported, skipped: result.skipped })
        setStep('done')
      } else {
        setError(result.error)
      }
    })
  }

  // ── Re-diff ────────────────────────────────────────────────────────────────

  function handleRediff() {
    setRediffResult(null)
    const formData = new FormData()
    formData.set('teamSeasonId', teamSeasonId)
    formData.set('pasteText', rediffText)
    startTransition(async () => {
      const result = await rediffNcsRoster(formData)
      if (result.ok) {
        setRediffResult(
          result.created === 0
            ? 'No changes detected against stored snapshots.'
            : `${result.created} change review(s) created.`,
        )
      } else {
        setRediffResult(`Error: ${result.error}`)
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
          NCS Roster Dashboard
        </p>
        <h2 className="text-2xl font-semibold text-text-primary">{teamSeasonName}</h2>
        <p className="text-sm text-text-muted">
          Search for an NCS team roster, preview it, then selectively import players into your
          active TeamSeason.
        </p>
      </Card>

      {/* Step 1 — Search or paste */}
      {step === 'form' && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">1. Find a Roster</h3>
            <div className="flex gap-1 rounded-lg border border-border p-1">
              <button
                onClick={() => setSourceMode('search')}
                className={`rounded-md px-3 py-1 text-sm ${sourceMode === 'search' ? 'bg-accent-lime/20 text-accent-lime' : 'text-text-muted hover:text-text-primary'}`}
              >
                Search NCS Teams
              </button>
              <button
                onClick={() => setSourceMode('paste')}
                className={`rounded-md px-3 py-1 text-sm ${sourceMode === 'paste' ? 'bg-accent-lime/20 text-accent-lime' : 'text-text-muted hover:text-text-primary'}`}
              >
                Paste Text
              </button>
            </div>
          </div>

          {sourceMode === 'search' && (
            <div className="space-y-4">
              <p className="text-sm text-text-muted">
                Search the live NCS Fastpitch portal by team name, city, or state, then pick your
                team to pull its roster directly.
              </p>
              <form action={handleSearchTeams} className="flex flex-wrap gap-3">
                <input
                  name="teamName"
                  type="text"
                  placeholder="Team name"
                  className="flex-1 min-w-[160px] rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-lime"
                />
                <input
                  name="city"
                  type="text"
                  placeholder="City"
                  className="flex-1 min-w-[120px] rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-lime"
                />
                <input
                  name="state"
                  type="text"
                  placeholder="State (e.g. TX)"
                  maxLength={2}
                  className="w-32 rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-lime"
                />
                <Button type="submit" disabled={isPending}>
                  {isPending && !loadingTeamId ? 'Searching…' : 'Search'}
                </Button>
              </form>

              {searchError && <p className="text-sm text-red-400">{searchError}</p>}

              {searchResults && searchResults.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-text-muted">
                        <th className="pb-2 pr-4 font-medium">Team</th>
                        <th className="pb-2 pr-4 font-medium">Division</th>
                        <th className="pb-2 pr-4 font-medium">Location</th>
                        <th className="pb-2 pr-4 font-medium">Record</th>
                        <th className="pb-2 pr-4 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.map((team) => (
                        <tr key={team.id} className="border-b border-border/50">
                          <td className="py-2 pr-4 text-text-primary">{team.name}</td>
                          <td className="py-2 pr-4 text-text-muted">{team.division || '—'}</td>
                          <td className="py-2 pr-4 text-text-muted">{team.location || '—'}</td>
                          <td className="py-2 pr-4 text-text-muted">{team.record || '—'}</td>
                          <td className="py-2 pr-4 text-right">
                            <Button
                              variant="secondary"
                              className="text-xs px-3 py-1"
                              disabled={isPending}
                              onClick={() => handlePickTeam(team)}
                            >
                              {loadingTeamId === team.id ? 'Pulling roster…' : 'Pick This Team'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {sourceMode === 'paste' && (
          <form action={handlePreview} className="space-y-4">
            <label className="block space-y-1 text-sm text-text-muted">
              <span>NCS Team URL (optional – for source tracking)</span>
              <input
                name="ncsTeamUrl"
                type="url"
                value={ncsTeamUrl}
                onChange={(e) => setNcsTeamUrl(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-lime"
                placeholder="https://www.ncssports.org/teams/…"
              />
            </label>
            <label className="block space-y-1 text-sm text-text-muted">
              <span>
                Paste roster text (tab-delimited or multi-space; include header row if available)
              </span>
              <textarea
                name="pasteText"
                required
                rows={8}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-lime"
                placeholder={
                  'ID\tFirst Name\tLast Name\tJersey\tPosition\tBats\tThrows\tGrad Year\n101\tAlice\tSmith\t12\tP\tR\tR\t2026'
                }
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Parsing…' : 'Preview Roster'}
            </Button>
          </form>
          )}
        </Card>
      )}

      {/* Step 2 — Preview & select */}
      {step === 'preview' && previewResult?.ok && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">2. Select Players to Import</h3>
            <button
              onClick={() => { setStep('form'); setPreviewResult(null); setPickedTeamLabel(null) }}
              className="text-sm text-text-muted hover:text-text-primary"
            >
              ← Back
            </button>
          </div>

          {pickedTeamLabel && (
            <p className="text-sm text-text-muted">
              Pulled live from NCS: <span className="text-accent-lime">{pickedTeamLabel}</span>
            </p>
          )}

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

          {/* Select all / none */}
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

          {/* Preview table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-muted">
                  <th className="pb-2 pr-4 font-medium">Import?</th>
                  <th className="pb-2 pr-4 font-medium">#</th>
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Position</th>
                  <th className="pb-2 pr-4 font-medium">Bats</th>
                  <th className="pb-2 pr-4 font-medium">Throws</th>
                  <th className="pb-2 pr-4 font-medium">Grad Year</th>
                  <th className="pb-2 pr-4 font-medium">NCS ID</th>
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
                    <td className="py-2 pr-4 text-text-muted">{row.jerseyNumber ?? '—'}</td>
                    <td className="py-2 pr-4 text-text-primary">
                      {(row.fullName ??
                        [row.firstName, row.lastName].filter(Boolean).join(' ')) ||
                        '—'}
                    </td>
                    <td className="py-2 pr-4 text-text-muted">{row.position ?? '—'}</td>
                    <td className="py-2 pr-4 text-text-muted">{row.bats ?? '—'}</td>
                    <td className="py-2 pr-4 text-text-muted">{row.throws ?? '—'}</td>
                    <td className="py-2 pr-4 text-text-muted">{row.gradYear ?? '—'}</td>
                    <td className="py-2 pr-4 font-mono text-text-muted">{row.ncsExternalId ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button
            disabled={isPending || selectedIndices.size === 0}
            onClick={() => handleImport(rows)}
          >
            {isPending
              ? 'Importing…'
              : `Import ${selectedIndices.size} Player${selectedIndices.size !== 1 ? 's' : ''}`}
          </Button>
        </Card>
      )}

      {/* Step 3 — Done */}
      {step === 'done' && importResult && (
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Import Complete</h3>
          <p className="text-text-muted">
            <span className="text-accent-lime font-semibold">{importResult.imported}</span>{' '}
            player{importResult.imported !== 1 ? 's' : ''} imported
            {importResult.skipped > 0 && (
              <>, {importResult.skipped} skipped</>
            )}.
          </p>
          <Button variant="secondary" onClick={() => { setStep('form'); setImportResult(null); setPreviewResult(null); setPickedTeamLabel(null); setNcsTeamUrl('') }}>
            Import More
          </Button>
        </Card>
      )}

      {/* Re-diff section */}
      <Card className="space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">Re-Diff Against Stored Snapshots</h3>
        <p className="text-sm text-text-muted">
          Paste an updated NCS roster to detect changes against the last imported snapshot.
          No data will be overwritten — changes are queued for review.
        </p>
        <textarea
          value={rediffText}
          onChange={(e) => setRediffText(e.target.value)}
          rows={5}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-lime"
          placeholder="Paste updated roster here…"
        />
        {rediffResult && <p className="text-sm text-text-muted">{rediffResult}</p>}
        <Button variant="secondary" disabled={isPending || !rediffText.trim()} onClick={handleRediff}>
          {isPending ? 'Checking…' : 'Check for Changes'}
        </Button>
      </Card>

      {/* Change review queue */}
      {changeReviews.length > 0 && (
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">
            Change Review Queue
            <span className="ml-2 rounded-full bg-accent-lime/20 px-2 py-0.5 text-xs text-accent-lime">
              {changeReviews.length}
            </span>
          </h3>
          <div className="space-y-3">
            {changeReviews.map((review) => {
              const payload = review.payload as {
                changeType: string
                matchKey?: string
                before?: ParsedRosterRow
                after?: ParsedRosterRow
              }
              return (
                <div key={review.id} className="rounded-xl border border-border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-accent-lime">{review.changeType}</span>
                    <span className="text-xs text-text-muted">{review.status}</span>
                  </div>
                  <p className="text-sm text-text-primary">
                    Key: <span className="font-mono">{payload.matchKey ?? '—'}</span>
                  </p>
                  {payload.after && (
                    <p className="text-xs text-text-muted">
                      New:{' '}
                      {payload.after.fullName ??
                        [payload.after.firstName, payload.after.lastName].filter(Boolean).join(' ')}{' '}
                      #{payload.after.jerseyNumber ?? '—'}
                    </p>
                  )}
                  {payload.before && payload.after && (
                    <p className="text-xs text-text-muted">
                      Was:{' '}
                      {payload.before.fullName ??
                        [payload.before.firstName, payload.before.lastName]
                          .filter(Boolean)
                          .join(' ')}{' '}
                      #{payload.before.jerseyNumber ?? '—'}
                    </p>
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

      {/* Current NCS sources */}
      {sources.length > 0 && (
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">
            Tracked Players ({sources.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-muted">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">#</th>
                  <th className="pb-2 pr-4 font-medium">NCS ID</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((src) => {
                  const name =
                    (src.player.fullName ??
                    [src.player.firstName, src.player.lastName].filter(Boolean).join(' ')) ||
                    '—'
                  return (
                    <tr key={src.id} className="border-b border-border/50">
                      <td className="py-2 pr-4 text-text-primary">{name}</td>
                      <td className="py-2 pr-4 text-text-muted">
                        {src.rosterEntry?.jerseyNumber ?? src.player.jerseyNumber ?? '—'}
                      </td>
                      <td className="py-2 pr-4 font-mono text-text-muted">
                        {src.ncsExternalId ?? '—'}
                      </td>
                      <td className="py-2 pr-4 text-text-muted">
                        {src.rosterEntry?.isActive ? (
                          <span className="text-accent-lime">Active</span>
                        ) : (
                          <span className="text-text-muted">Inactive</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
