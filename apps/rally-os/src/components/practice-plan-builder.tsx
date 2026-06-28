'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { Badge, Button, Card } from '@rally/ui'
import {
  generatePracticePlan,
  type GeneratePlanResult,
} from '../actions/practice-planning'

const inputClass =
  'w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition focus:border-accent-lime/60 focus:ring-2 focus:ring-accent-lime/20'

type Tab = 'coach' | 'player'

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-lime">{title}</p>
      <ul className="list-inside list-disc space-y-1 text-sm text-text-muted">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export function PracticePlanBuilder() {
  const [result, setResult] = useState<GeneratePlanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('coach')
  const [pending, startTransition] = useTransition()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const res = await generatePracticePlan(formData)
      if (res.ok) {
        setResult(res)
        setTab('coach')
      } else {
        setError(res.error)
        setResult(null)
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-text-muted">Practice date</span>
            <input name="practiceDate" type="date" required className={inputClass} />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-text-muted">Duration</span>
            <input name="duration" placeholder="90 minutes" required className={inputClass} />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-text-muted">Location</span>
            <input name="location" placeholder="Main field" required className={inputClass} />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-text-muted">Team focus</span>
            <input name="teamFocus" placeholder="Situational hitting + baserunning" required className={inputClass} />
          </label>
          <div className="md:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? 'Generating plan…' : 'Generate practice plan'}
            </Button>
          </div>
        </form>
        {error ? (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}
      </Card>

      {result?.ok ? (
        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab('coach')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === 'coach' ? 'bg-accent-lime text-background' : 'text-text-muted hover:text-text-primary'}`}
              >
                Coach version
              </button>
              <button
                type="button"
                onClick={() => setTab('player')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === 'player' ? 'bg-accent-lime text-background' : 'text-text-muted hover:text-text-primary'}`}
              >
                Player version
              </button>
            </div>
            <Badge>saved as draft</Badge>
          </div>

          {tab === 'coach' ? (
            <div className="space-y-5">
              {result.coach.full_schedule.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-lime">Full schedule</p>
                  {result.coach.full_schedule.map((b, i) => (
                    <div key={i} className="rounded-xl border border-border bg-background px-4 py-3">
                      <p className="text-sm font-semibold text-text-primary">
                        {b.time} — {b.block}
                      </p>
                      <p className="text-sm text-text-muted">{b.detail}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              <List title="Coach assignments" items={result.coach.coach_assignments} />
              <List title="Development focus" items={result.coach.development_focus} />
              <List title="AI suggestions" items={result.coach.ai_suggestions} />
              <List title="Equipment" items={result.coach.equipment} />
              {result.coach.private_player_notes.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-purple">
                    Private player notes (coach only)
                  </p>
                  <ul className="space-y-1 text-sm text-text-muted">
                    {result.coach.private_player_notes.map((n, i) => (
                      <li key={i}>
                        <span className="font-semibold text-text-primary">{n.player}:</span> {n.note}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {result.coach.contingency_plan ? (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-lime">Contingency plan</p>
                  <p className="text-sm text-text-muted">{result.coach.contingency_plan}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-sm text-text-muted">
                {result.player.practice_time} • {result.player.practice_location}
              </p>
              {result.player.practice_blocks.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-lime">Practice blocks</p>
                  {result.player.practice_blocks.map((b, i) => (
                    <div key={i} className="rounded-xl border border-border bg-background px-4 py-3">
                      <p className="text-sm font-semibold text-text-primary">{b.time}</p>
                      <p className="text-sm text-text-muted">{b.activity}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              <List title="Drills" items={result.player.drills.map((d) => `${d.name} — ${d.description}`)} />
              <List title="Expectations" items={result.player.expectations} />
              <List title="Equipment to bring" items={result.player.equipment_to_bring} />
              {result.player.team_focus ? (
                <p className="text-sm text-text-muted">
                  <span className="font-semibold text-text-primary">Team focus:</span> {result.player.team_focus}
                </p>
              ) : null}
            </div>
          )}
        </Card>
      ) : null}
    </div>
  )
}
