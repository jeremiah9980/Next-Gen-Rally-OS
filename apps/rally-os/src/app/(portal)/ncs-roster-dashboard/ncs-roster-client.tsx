'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, Button, Card } from '@rally/ui'
import { importNcsRosterRows, parseNcsRosterPreview } from '../../../actions/ncs-roster'
import type { ParsedPreviewRow } from '../../../actions/ncs-roster'

const inputClassName =
  'w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-lime'

type Props = {
  teamSeasonId: string
}

export function NcsRosterClient({ teamSeasonId }: Props) {
  const router = useRouter()
  const [ncsTeamUrl, setNcsTeamUrl] = useState('')
  const [pastedText, setPastedText] = useState('')
  const [previewRows, setPreviewRows] = useState<ParsedPreviewRow[]>([])
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [parseError, setParseError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  async function handleParse() {
    setParseError(null)
    setPreviewRows([])
    setImportResult(null)
    setIsParsing(true)

    const formData = new FormData()
    formData.append('teamSeasonId', teamSeasonId)
    formData.append('pastedText', pastedText)
    formData.append('ncsTeamUrl', ncsTeamUrl)

    const result = await parseNcsRosterPreview(formData)
    setIsParsing(false)

    if (!result.success) {
      setParseError(result.error)
      return
    }

    setPreviewRows(result.rows)
    setSelectedRows(new Set(result.rows.map((_, index) => index)))
  }

  async function handleImport() {
    if (selectedRows.size === 0) return

    setIsImporting(true)
    setImportResult(null)
    setParseError(null)

    const rowsToImport = previewRows.filter((_, index) => selectedRows.has(index))
    const result = await importNcsRosterRows({
      teamSeasonId,
      ncsTeamUrl: ncsTeamUrl || undefined,
      rows: rowsToImport,
    })

    setIsImporting(false)

    if (!result.success) {
      setParseError(result.error)
      return
    }

    setImportResult({ imported: result.imported, skipped: result.skipped })
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
          <h2 className="text-xl font-semibold text-text-primary">Paste NCS roster</h2>
          <p className="mt-1 text-sm text-text-muted">
            Paste roster text from NCS using tab, comma, or spaced columns. Include a header row
            whenever NCS provides one.
          </p>
        </div>

        <label className="block space-y-2 text-sm text-text-muted">
          <span>NCS Team URL (optional)</span>
          <input
            className={inputClassName}
            placeholder="https://ncs.org/teams/..."
            value={ncsTeamUrl}
            onChange={(event) => setNcsTeamUrl(event.target.value)}
          />
        </label>

        <label className="block space-y-2 text-sm text-text-muted">
          <span>Pasted roster text</span>
          <textarea
            className={`${inputClassName} min-h-40 font-mono text-xs`}
            placeholder={`ID\tName\tJersey\tPosition\n123\tJohn Smith\t7\tSS`}
            value={pastedText}
            onChange={(event) => setPastedText(event.target.value)}
          />
        </label>

        {parseError ? (
          <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {parseError}
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
              <h2 className="text-xl font-semibold text-text-primary">Review and select</h2>
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
                  <th className="pb-3 pr-4">NCS ID</th>
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Jersey</th>
                  <th className="pb-3">Position</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, index) => (
                  <tr
                    key={`${row.ncsId ?? row.normalizedName}-${index}`}
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
                    <td className="py-3 pr-4 font-mono text-xs text-text-muted">
                      {row.ncsId ?? '—'}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-text-primary">{row.rawName}</td>
                    <td className="py-3 pr-4 text-text-muted">{row.jersey ?? '—'}</td>
                    <td className="py-3 text-text-muted">{row.position ?? '—'}</td>
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
            <Button onClick={handleImport} disabled={selectedRows.size === 0 || isImporting}>
              {isImporting
                ? 'Importing…'
                : `Import ${selectedRows.size} Player${selectedRows.size !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </Card>
      ) : null}

      {importResult ? (
        <Card className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent-lime">
            Import complete
          </p>
          <p className="text-text-primary">
            <span className="font-semibold">{importResult.imported}</span> players imported,{' '}
            <span className="font-semibold">{importResult.skipped}</span> skipped.
          </p>
        </Card>
      ) : null}
    </div>
  )
}
