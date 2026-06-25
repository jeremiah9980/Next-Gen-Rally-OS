'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, Button, Card } from '@rally/ui'
import { attachNcsTournaments, parseNcsTournamentPreview } from '../../../actions/ncs-tournament'
import type { ParsedTournamentRow } from '../../../actions/ncs-tournament'

const inputClassName =
  'w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-lime'

type Props = {
  teamSeasonId: string
}

export function NcsTournamentClient({ teamSeasonId }: Props) {
  const router = useRouter()
  const [sourceUrl, setSourceUrl] = useState('')
  const [pastedText, setPastedText] = useState('')
  const [previewRows, setPreviewRows] = useState<ParsedTournamentRow[]>([])
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [attachResult, setAttachResult] = useState<{ attached: number; skipped: number } | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isAttaching, setIsAttaching] = useState(false)

  async function handleParse() {
    setError(null)
    setAttachResult(null)
    setPreviewRows([])
    setIsParsing(true)

    const formData = new FormData()
    formData.append('pastedText', pastedText)

    const result = await parseNcsTournamentPreview(formData)
    setIsParsing(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setPreviewRows(result.rows)
    setSelectedRows(new Set(result.rows.map((_, index) => index)))
  }

  async function handleAttach() {
    if (selectedRows.size === 0) return

    setIsAttaching(true)
    setAttachResult(null)
    setError(null)

    const result = await attachNcsTournaments({
      teamSeasonId,
      sourceUrl: sourceUrl || undefined,
      tournaments: previewRows
        .filter((_, index) => selectedRows.has(index))
        .map(({ rawLine, ...row }) => row),
    })

    setIsAttaching(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setAttachResult({ attached: result.attached, skipped: result.skipped })
    setPreviewRows([])
    setSelectedRows(new Set())
    setPastedText('')
    router.refresh()
  }

  function toggleRow(index: number) {
    setSelectedRows((previous) => {
      const next = new Set(previous)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function toggleAll() {
    if (selectedRows.size === previewRows.length) {
      setSelectedRows(new Set())
      return
    }

    setSelectedRows(new Set(previewRows.map((_, index) => index)))
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent-lime">
            Step 1
          </p>
          <h2 className="text-xl font-semibold text-text-primary">Paste NCS tournaments</h2>
          <p className="mt-1 text-sm text-text-muted">
            Paste NCS tournament rows to preview events and attach them to the active TeamSeason.
          </p>
        </div>

        <label className="block space-y-2 text-sm text-text-muted">
          <span>Source URL (optional)</span>
          <input
            className={inputClassName}
            placeholder="https://ncs.org/tournaments/..."
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
          />
        </label>

        <label className="block space-y-2 text-sm text-text-muted">
          <span>Pasted tournament text</span>
          <textarea
            className={`${inputClassName} min-h-40 font-mono text-xs`}
            placeholder={`Tournament\tLocation\tStart\tEnd\nSpring Classic\tWalnut Creek\t2025-03-01\t2025-03-02`}
            value={pastedText}
            onChange={(event) => setPastedText(event.target.value)}
          />
        </label>

        {error ? (
          <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button onClick={handleParse} disabled={!pastedText.trim() || isParsing}>
            {isParsing ? 'Parsing…' : 'Parse & Preview'}
          </Button>
        </div>
      </Card>

      {previewRows.length > 0 ? (
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent-lime">
                Step 2
              </p>
              <h2 className="text-xl font-semibold text-text-primary">Review and attach</h2>
            </div>
            <Badge>
              {selectedRows.size} / {previewRows.length} selected
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-muted">
                  <th className="pb-3 pr-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === previewRows.length}
                      onChange={toggleAll}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="pb-3 pr-4">Tournament</th>
                  <th className="pb-3 pr-4">Location</th>
                  <th className="pb-3 pr-4">Start</th>
                  <th className="pb-3 pr-4">End</th>
                  <th className="pb-3">Registration</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, index) => (
                  <tr
                    key={`${row.name}-${index}`}
                    className={`border-b border-border/50 transition hover:bg-surface/50 ${
                      selectedRows.has(index) ? '' : 'opacity-40'
                    }`}
                  >
                    <td className="py-3 pr-4">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(index)}
                        onChange={() => toggleRow(index)}
                        className="cursor-pointer"
                      />
                    </td>
                    <td className="py-3 pr-4 font-semibold text-text-primary">{row.name}</td>
                    <td className="py-3 pr-4 text-text-muted">{row.location ?? '—'}</td>
                    <td className="py-3 pr-4 text-text-muted">{row.startDate ?? '—'}</td>
                    <td className="py-3 pr-4 text-text-muted">{row.endDate ?? '—'}</td>
                    <td className="py-3 text-text-muted">
                      {row.registrationUrl ? (
                        <a
                          href={row.registrationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent-lime underline-offset-4 hover:underline"
                        >
                          Open
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setPreviewRows([])
                setSelectedRows(new Set())
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAttach} disabled={selectedRows.size === 0 || isAttaching}>
              {isAttaching
                ? 'Attaching…'
                : `Attach ${selectedRows.size} Tournament${selectedRows.size !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </Card>
      ) : null}

      {attachResult ? (
        <Card className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent-lime">
            Tracker updated
          </p>
          <p className="text-text-primary">
            <span className="font-semibold">{attachResult.attached}</span> tournaments attached,{' '}
            <span className="font-semibold">{attachResult.skipped}</span> skipped.
          </p>
        </Card>
      ) : null}
    </div>
  )
}
