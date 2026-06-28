'use client'

import { useState, useTransition } from 'react'
import { Badge, Button, Card } from '@rally/ui'
import {
  previewConfigAction,
  provisionConfigAction,
  type PreviewResult,
  type ProvisionActionResult,
} from '../app/actions'

const DEFAULT_YAML = `organization:
  name: Demo Organization
  slug: demo-org
team:
  name: Demo Team
  season: 2026 Spring
  age_group: 12U
modules:
  home: true
  team_info: true
  standards: true
  coach: true
  roster: true
  player_profiles: true
  schedule: true
  tournaments: true
  practice_plans: true
  player_development: true
  gamechanger_stats: true
  social_media_hub: true
  fundraising: true
integrations:
  ncs: true
  gamechanger: true
publish:
  target: vercel
  domain: demo-org.example.com
`

const STEPS = ['Edit config', 'Preview', 'Provision', 'Publish']

export function Wizard() {
  const [yaml, setYaml] = useState(DEFAULT_YAML)
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [provision, setProvision] = useState<ProvisionActionResult | null>(null)
  const [pending, startTransition] = useTransition()

  function handlePreview() {
    startTransition(async () => {
      setProvision(null)
      setPreview(await previewConfigAction(yaml))
    })
  }

  function handleProvision() {
    startTransition(async () => {
      setProvision(await provisionConfigAction(yaml))
    })
  }

  const step = provision?.ok ? 3 : preview?.ok ? 2 : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <Badge key={label}>
            {i <= step ? '●' : '○'} {label}
          </Badge>
        ))}
      </div>

      <Card className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-lime">
          1 — SiteConfig (YAML)
        </p>
        <textarea
          value={yaml}
          onChange={(e) => setYaml(e.target.value)}
          spellCheck={false}
          rows={20}
          className="w-full rounded-2xl border border-border bg-background p-4 font-mono text-xs text-text-primary outline-none focus:border-accent-lime/60"
        />
        <div className="flex gap-3">
          <Button type="button" onClick={handlePreview} disabled={pending}>
            {pending ? 'Working…' : 'Validate & preview'}
          </Button>
          {preview?.ok ? (
            <Button type="button" variant="secondary" onClick={handleProvision} disabled={pending}>
              Provision TeamSeason
            </Button>
          ) : null}
        </div>
      </Card>

      {preview && !preview.ok ? (
        <Card className="border-red-500/40">
          <p className="text-sm text-red-300">{preview.error}</p>
        </Card>
      ) : null}

      {preview?.ok ? (
        <Card className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-lime">
            2 — Preview
          </p>
          <p className="text-text-primary">
            {preview.organization} • {preview.team}
          </p>
          <div className="flex flex-wrap gap-2">
            {preview.modules.map((m) => (
              <Badge key={m}>{m}</Badge>
            ))}
          </div>
          <p className="text-sm text-text-muted">
            Publishes to {preview.target} @ {preview.domain}
          </p>
        </Card>
      ) : null}

      {provision && !provision.ok ? (
        <Card className="border-red-500/40">
          <p className="text-sm text-red-300">{provision.error}</p>
        </Card>
      ) : null}

      {provision?.ok ? (
        <Card className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-lime">
            3 — Provisioned
          </p>
          <p className="text-text-primary">TeamSeason {provision.teamSeasonId} is ready.</p>
          <p className="text-sm text-text-muted">
            Published projection sections: {provision.sections.join(', ') || '(none yet — operate Rally-OS to populate)'}
          </p>
          <div className="rounded-2xl border border-accent-purple/40 bg-accent-purple/5 p-4 text-sm text-text-muted">
            4 — Publish: connect NCS + GameChanger, operate Rally-OS, then run the infra deploy task to
            build apps/public-site from the published projection. Re-publish on approved NCS changes.
          </div>
        </Card>
      ) : null}
    </div>
  )
}
