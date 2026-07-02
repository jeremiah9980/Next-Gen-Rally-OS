'use client'

import { useState, useTransition } from 'react'
import { Badge, Button, Card } from '@rally/ui'
import { generateOrgKit, type OrgKit } from '@rally/org-kit'
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
  gamechanger_stats: false
  social_media_hub: true
  fundraising: true
integrations:
  ncs: true
  gamechanger: true
publish:
  target: vercel
  domain: demo-org.example.com
`

const STEPS = ['Edit config', 'Preview', 'Provision', 'Org Kit']

export function Wizard() {
  const [yaml, setYaml] = useState(DEFAULT_YAML)
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [provision, setProvision] = useState<ProvisionActionResult | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
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

  function handleCopy(text: string, key: string) {
    void navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1800)
  }

  const kit: OrgKit | null = preview?.ok ? generateOrgKit(preview.config) : null
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

      {/* ── Step 1: Edit config ─────────────────────────────────────────── */}
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

      {/* ── Step 2: Preview ─────────────────────────────────────────────── */}
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

      {/* ── Step 3: Provisioned ─────────────────────────────────────────── */}
      {provision?.ok ? (
        <Card className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-lime">
            3 — Provisioned
          </p>
          <p className="text-text-primary">TeamSeason {provision.teamSeasonId} is ready.</p>
          <p className="text-sm text-text-muted">
            Published projection sections:{' '}
            {provision.sections.join(', ') || '(none yet — operate Rally-OS to populate)'}
          </p>
        </Card>
      ) : null}

      {/* ── Step 4: Org Kit ─────────────────────────────────────────────── */}
      {provision?.ok && kit ? (
        <Card className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-lime">
            4 — Org Kit
          </p>
          <p className="text-sm text-text-muted">
            Starter branding assets generated from your config. Customise these in your design tool
            before publishing.
          </p>

          {/* Logo + palette */}
          <div className="flex flex-wrap items-start gap-6">
            <div
              className="flex-shrink-0"
              dangerouslySetInnerHTML={{ __html: kit.svgLogo }}
              aria-label={`${kit.initials} logo placeholder`}
            />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                Color Palette
              </p>
              <div className="flex flex-wrap gap-3">
                {(
                  [
                    ['Primary', kit.palette.primary],
                    ['Accent', kit.palette.accent],
                    ['Background', kit.palette.background],
                    ['Text', kit.palette.text],
                  ] as const
                ).map(([label, hex]) => (
                  <button
                    key={label}
                    type="button"
                    title={`Copy ${hex}`}
                    onClick={() => handleCopy(hex, `color-${label}`)}
                    className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs text-text-muted transition hover:border-accent-lime/40"
                  >
                    <span
                      className="inline-block h-4 w-4 rounded-full border border-white/10"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="font-medium text-text-primary">{label}</span>
                    <span className="font-mono">{hex}</span>
                    {copied === `color-${label}` ? (
                      <span className="text-accent-lime">✓</span>
                    ) : null}
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-muted">Click any swatch to copy its hex value.</p>
            </div>
          </div>

          {/* Social post templates */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
              Social Post Templates
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {kit.socialTemplates.map((t) => (
                <div
                  key={t.platform}
                  className="space-y-2 rounded-2xl border border-border bg-background p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-primary">{t.platform}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(t.text, `social-${t.platform}`)}
                      className="text-xs text-text-muted transition hover:text-accent-lime"
                    >
                      {copied === `social-${t.platform}` ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap text-xs text-text-muted">{t.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Vercel deploy checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                Deploy Checklist
              </p>
              <button
                type="button"
                onClick={() => handleCopy(kit.setupChecklist.join('\n'), 'checklist')}
                className="text-xs text-text-muted transition hover:text-accent-lime"
              >
                {copied === 'checklist' ? 'Copied ✓' : 'Copy all'}
              </button>
            </div>
            <ol className="space-y-1 rounded-2xl border border-border bg-background p-4">
              {kit.setupChecklist.map((item, i) => (
                <li key={i} className="font-mono text-xs text-text-muted">
                  {item}
                </li>
              ))}
            </ol>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
