'use client'

import { useMemo, useState, useTransition } from 'react'
import { Button, Card } from '@rally/ui'
import {
  approveScheduleDrafts,
  createScheduleDraftsFromNcs,
  importGameChangerStats,
  pushApprovedScheduleDrafts,
  rejectScheduleDrafts,
  saveGameChangerPlayerLink,
  saveGameChangerTeamLink,
  updateScheduleDraft,
} from '../actions/gamechanger'

type DashboardProps = {
  teamSeasonId: string
  teamSeasonName: string
  gcTeamId: string | null
  rosterEntries: Array<{
    id: string
    jerseyNumber: string | null
    player: {
      id: string
      fullName: string | null
      firstName: string | null
      lastName: string | null
      jerseyNumber: string | null
      gcPlayerId: string | null
    }
  }>
  scheduleDrafts: Array<{
    id: string
    status:
      | 'ncs_detected'
      | 'draft_created'
      | 'pending_coach_approval'
      | 'approved'
      | 'pushed_to_gamechanger'
      | 'rejected'
    opponent: string
    gameDate: Date
    gameTime: string | null
    field: string | null
    location: string | null
    game_type: string | null
  }>
  pushRequests: Array<{
    id: string
    scheduleGameId: string
    status: string
    gcGameId: string | null
    createdAt: Date
  }>
  snapshots: Array<{
    id: string
    playerId: string | null
    gcPlayerId: string | null
    gcGameId: string | null
    result: string
    score: string
    avg: { toString(): string } | null
    ab: number | null
    rbi: number | null
    hr: number | null
    capturedAt: Date
    player: {
      id: string
      fullName: string | null
      firstName: string | null
      lastName: string | null
    } | null
  }>
}

const defaultStatuses = [
  'ncs_detected',
  'draft_created',
  'pending_coach_approval',
  'approved',
  'pushed_to_gamechanger',
  'rejected',
] as const

export function GameChangerDashboard({
  teamSeasonId,
  teamSeasonName,
  gcTeamId,
  rosterEntries,
  scheduleDrafts,
  pushRequests,
  snapshots,
}: DashboardProps) {
  const [isPending, startTransition] = useTransition()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedDraftIds, setSelectedDraftIds] = useState<Set<string>>(new Set())
  const [statsRowsJson, setStatsRowsJson] = useState(
    JSON.stringify([{ gcPlayerId: '', name: '', jersey: '', avg: 0.333, ab: 3, rbi: 2, hr: 1 }], null, 2),
  )
  const [statsResult, setStatsResult] = useState('')
  const [statsScore, setStatsScore] = useState('')
  const [statsHasIdColumn, setStatsHasIdColumn] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filteredDrafts = useMemo(
    () =>
      statusFilter === 'all'
        ? scheduleDrafts
        : scheduleDrafts.filter((draft) => draft.status === statusFilter),
    [scheduleDrafts, statusFilter],
  )

  const clearFeedback = () => {
    setMessage(null)
    setError(null)
  }

  const selectedIdsJson = JSON.stringify([...selectedDraftIds])

  return (
    <div className="space-y-6">
      <Card className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent-lime">GameChanger</p>
        <h2 className="text-2xl font-semibold text-text-primary">{teamSeasonName}</h2>
        <p className="text-sm text-text-muted">
          Rally-OS remains system of record. GameChanger data is imported as read-only snapshots. Schedule
          pushes are approval-gated and only approved drafts can be pushed.
        </p>
      </Card>

      <Card className="space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">TeamSeason GameChanger Link</h3>
        <form
          className="flex flex-col gap-3 md:flex-row"
          action={(formData) => {
            clearFeedback()
            startTransition(async () => {
              const result = await saveGameChangerTeamLink(formData)
              if (result.ok) setMessage(result.message ?? 'Saved.')
              else setError(result.error)
            })
          }}
        >
          <input type="hidden" name="teamSeasonId" value={teamSeasonId} />
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-primary"
            name="gcTeamId"
            placeholder="GC Team ID"
            defaultValue={gcTeamId ?? ''}
            required
          />
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : 'Save Team Link'}
          </Button>
        </form>
      </Card>

      <Card className="space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">Player ↔ GameChanger Mapping</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="pb-2 pr-4 font-medium">Player</th>
                <th className="pb-2 pr-4 font-medium">#</th>
                <th className="pb-2 pr-4 font-medium">gcPlayerId</th>
                <th className="pb-2 pr-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rosterEntries.map((entry) => {
                const playerName =
                  entry.player.fullName ??
                  [entry.player.firstName, entry.player.lastName].filter(Boolean).join(' ') ??
                  'Unnamed Player'

                return (
                  <tr key={entry.id} className="border-b border-border/50">
                    <td className="py-2 pr-4 text-text-primary">{playerName}</td>
                    <td className="py-2 pr-4 text-text-muted">
                      {entry.jerseyNumber ?? entry.player.jerseyNumber ?? '—'}
                    </td>
                    <td className="py-2 pr-4">
                      <form
                        className="flex items-center gap-2"
                        action={(formData) => {
                          clearFeedback()
                          startTransition(async () => {
                            const result = await saveGameChangerPlayerLink(formData)
                            if (result.ok) setMessage(result.message ?? 'Saved.')
                            else setError(result.error)
                          })
                        }}
                      >
                        <input type="hidden" name="playerId" value={entry.player.id} />
                        <input
                          className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                          name="gcPlayerId"
                          defaultValue={entry.player.gcPlayerId ?? ''}
                          placeholder="gc_123"
                          required
                        />
                        <Button type="submit" variant="secondary" disabled={isPending}>
                          Save
                        </Button>
                      </form>
                    </td>
                    <td className="py-2 pr-4 text-text-muted">Manual mapping</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">Import Read-Only GameChanger Stats</h3>
        <p className="text-sm text-text-muted">
          Result and score are required and never hardcoded. Rows are stored as immutable snapshots.
        </p>
        <form
          className="space-y-3"
          action={(formData) => {
            clearFeedback()
            startTransition(async () => {
              const result = await importGameChangerStats(formData)
              if (result.ok) {
                setMessage(
                  `${result.data.imported} stat snapshots imported${
                    result.data.skipped > 0 ? `, ${result.data.skipped} skipped` : ''
                  }`,
                )
              } else setError(result.error)
            })
          }}
        >
          <input type="hidden" name="teamSeasonId" value={teamSeasonId} />
          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1 text-sm text-text-muted">
              <span>Result (required)</span>
              <input
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                name="result"
                value={statsResult}
                onChange={(event) => setStatsResult(event.target.value)}
                placeholder="W"
                required
              />
            </label>
            <label className="space-y-1 text-sm text-text-muted">
              <span>Score (required)</span>
              <input
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                name="score"
                value={statsScore}
                onChange={(event) => setStatsScore(event.target.value)}
                placeholder="6-4"
                required
              />
            </label>
            <label className="flex items-center gap-2 pt-6 text-sm text-text-muted">
              <input
                type="checkbox"
                checked={statsHasIdColumn}
                onChange={(event) => setStatsHasIdColumn(event.target.checked)}
              />
              Incoming rows include ID column
            </label>
          </div>
          <input type="hidden" name="hasIdColumn" value={statsHasIdColumn ? 'true' : 'false'} />
          <textarea
            className="min-h-40 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono"
            name="rows"
            value={statsRowsJson}
            onChange={(event) => setStatsRowsJson(event.target.value)}
            required
          />
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Importing…' : 'Import Stats'}
          </Button>
        </form>
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-text-primary">Approval-Gated Schedule Push</h3>
          <form
            action={(formData) => {
              clearFeedback()
              startTransition(async () => {
                const result = await createScheduleDraftsFromNcs(formData)
                if (result.ok) {
                  setMessage(
                    `${result.data.created} draft(s) created${
                      result.data.skipped > 0 ? `, ${result.data.skipped} duplicates skipped` : ''
                    }.`,
                  )
                } else setError(result.error)
              })
            }}
          >
            <input type="hidden" name="teamSeasonId" value={teamSeasonId} />
            <Button type="submit" variant="secondary" disabled={isPending}>
              Generate Drafts from NCS
            </Button>
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-text-muted">Filter:</label>
          <select
            className="rounded-xl border border-border bg-background px-2 py-1 text-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">all</option>
            {defaultStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="text-sm text-accent-lime hover:underline"
            onClick={() => setSelectedDraftIds(new Set(filteredDrafts.map((draft) => draft.id)))}
          >
            Select all shown
          </button>
          <button
            type="button"
            className="text-sm text-text-muted hover:underline"
            onClick={() => setSelectedDraftIds(new Set())}
          >
            Clear
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Approve Selected', action: approveScheduleDrafts, mode: 'selected' },
            { label: 'Approve All Pending', action: approveScheduleDrafts, mode: 'all' },
            { label: 'Reject Selected', action: rejectScheduleDrafts, mode: 'selected' },
            { label: 'Push Approved Selected', action: pushApprovedScheduleDrafts, mode: 'selected' },
            { label: 'Push All Approved', action: pushApprovedScheduleDrafts, mode: 'all' },
          ].map((item) => (
            <form
              key={item.label}
              action={(formData) => {
                clearFeedback()
                startTransition(async () => {
                  const result = await item.action(formData)
                  if (result.ok) {
                    if ('results' in result.data) {
                      const pushedResults = result.data.results
                      setMessage(
                        `${result.data.pushed} pushed${
                          result.data.skipped > 0 ? `, ${result.data.skipped} skipped` : ''
                        }. ${pushedResults
                          .map((row) => `${row.draftId}: ${row.gcGameId}`)
                          .join(' | ')}`,
                      )
                    } else if ('approved' in result.data) {
                      setMessage(
                        `${result.data.approved} approved${
                          result.data.skipped > 0 ? `, ${result.data.skipped} skipped` : ''
                        }.`,
                      )
                    } else if ('rejected' in result.data) {
                      setMessage(
                        `${result.data.rejected} rejected${
                          result.data.skipped > 0 ? `, ${result.data.skipped} skipped` : ''
                        }.`,
                      )
                    }
                  } else setError(result.error)
                })
              }}
            >
              <input type="hidden" name="teamSeasonId" value={teamSeasonId} />
              <input type="hidden" name="mode" value={item.mode} />
              <input type="hidden" name="draftIds" value={selectedIdsJson} />
              <Button type="submit" variant="secondary" disabled={isPending}>
                {item.label}
              </Button>
            </form>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="pb-2 pr-4 font-medium">Select</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 pr-4 font-medium">Draft</th>
                <th className="pb-2 pr-4 font-medium">Edit</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrafts.map((draft) => (
                <tr key={draft.id} className="border-b border-border/50 align-top">
                  <td className="py-2 pr-4">
                    <input
                      type="checkbox"
                      checked={selectedDraftIds.has(draft.id)}
                      onChange={(event) => {
                        const next = new Set(selectedDraftIds)
                        if (event.target.checked) next.add(draft.id)
                        else next.delete(draft.id)
                        setSelectedDraftIds(next)
                      }}
                      className="h-4 w-4 accent-accent-lime"
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <span className="rounded bg-surface px-2 py-1 font-mono text-xs">{draft.status}</span>
                  </td>
                  <td className="py-2 pr-4 text-text-muted">
                    <p className="text-text-primary">{draft.opponent}</p>
                    <p>{new Date(draft.gameDate).toISOString().slice(0, 10)}</p>
                    <p>
                      {(draft.gameTime ?? '—')} · {(draft.field ?? '—')} · {(draft.location ?? '—')} ·{' '}
                      {(draft.game_type ?? '—')}
                    </p>
                  </td>
                  <td className="py-2 pr-4">
                    <form
                      className="grid gap-2 md:grid-cols-3"
                      action={(formData) => {
                        clearFeedback()
                        startTransition(async () => {
                          const result = await updateScheduleDraft(formData)
                          if (result.ok) setMessage(result.message ?? 'Draft updated.')
                          else setError(result.error)
                        })
                      }}
                    >
                      <input type="hidden" name="draftId" value={draft.id} />
                      <input
                        name="opponent"
                        className="rounded-lg border border-border bg-background px-2 py-1"
                        defaultValue={draft.opponent}
                        required
                      />
                      <input
                        type="date"
                        name="gameDate"
                        className="rounded-lg border border-border bg-background px-2 py-1"
                        defaultValue={new Date(draft.gameDate).toISOString().slice(0, 10)}
                        required
                      />
                      <input
                        name="gameTime"
                        className="rounded-lg border border-border bg-background px-2 py-1"
                        defaultValue={draft.gameTime ?? ''}
                        placeholder="time"
                      />
                      <input
                        name="field"
                        className="rounded-lg border border-border bg-background px-2 py-1"
                        defaultValue={draft.field ?? ''}
                        placeholder="field"
                      />
                      <input
                        name="location"
                        className="rounded-lg border border-border bg-background px-2 py-1"
                        defaultValue={draft.location ?? ''}
                        placeholder="location"
                      />
                      <div className="flex gap-2">
                        <input
                          name="game_type"
                          className="w-full rounded-lg border border-border bg-background px-2 py-1"
                          defaultValue={draft.game_type ?? ''}
                          placeholder="game_type"
                        />
                        <Button type="submit" variant="ghost" disabled={isPending}>
                          Save
                        </Button>
                      </div>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">Push Results (gcGameId)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="pb-2 pr-4 font-medium">Schedule Draft</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 pr-4 font-medium">gcGameId</th>
                <th className="pb-2 pr-4 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {pushRequests.map((push) => (
                <tr key={push.id} className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-text-muted">{push.scheduleGameId}</td>
                  <td className="py-2 pr-4 text-text-muted">{push.status}</td>
                  <td className="py-2 pr-4 font-mono text-xs text-accent-lime">{push.gcGameId ?? '—'}</td>
                  <td className="py-2 pr-4 text-text-muted">
                    {new Date(push.createdAt).toISOString().replace('T', ' ').slice(0, 16)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">Read-Only Stat Snapshots</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="pb-2 pr-4 font-medium">Player</th>
                <th className="pb-2 pr-4 font-medium">Result / Score</th>
                <th className="pb-2 pr-4 font-medium">AVG / AB / RBI / HR</th>
                <th className="pb-2 pr-4 font-medium">gc IDs</th>
                <th className="pb-2 pr-4 font-medium">Captured</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((snapshot) => {
                const playerName =
                  snapshot.player?.fullName ??
                  [snapshot.player?.firstName, snapshot.player?.lastName].filter(Boolean).join(' ') ??
                  'Unmatched'

                return (
                  <tr key={snapshot.id} className="border-b border-border/50">
                    <td className="py-2 pr-4 text-text-primary">{playerName}</td>
                    <td className="py-2 pr-4 text-text-muted">
                      {snapshot.result} / {snapshot.score}
                    </td>
                    <td className="py-2 pr-4 text-text-muted">
                      {(snapshot.avg?.toString() ?? '0.000')} / {snapshot.ab ?? 0} / {snapshot.rbi ?? 0} /{' '}
                      {snapshot.hr ?? 0}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs text-text-muted">
                      {snapshot.gcPlayerId ?? '—'} / {snapshot.gcGameId ?? '—'}
                    </td>
                    <td className="py-2 pr-4 text-text-muted">
                      {new Date(snapshot.capturedAt).toISOString().replace('T', ' ').slice(0, 16)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {message && <p className="text-sm text-accent-lime">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
