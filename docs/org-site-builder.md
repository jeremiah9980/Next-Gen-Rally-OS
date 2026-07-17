# Org Site Builder — Rally-ORG Kit & Builder Portal

The website builder kit incorporated from `rally-org-builder`, restyled to the
NextGen design language. It turns a guided intake — conversational or no-code —
into a branded, governance-grade static website for a youth select-sports
organization. No build step; the output deploys straight to GitHub Pages or any
static host.

Everything lives under `org-site-builder/`.

## The two proven systems it fuses

1. **The Org-Site Kit** (`org-site-builder/org-kit/`) — the governance-grade
   content model: a four-tier org structure (Executive · Board · Coaching ·
   Operations), the Coaching Firewall and Family-First Coverage rules, a
   privacy-first consent architecture for minor players, and a nine-phase AI
   intake ("Rally") producing a validated `intake.json`.
2. **The config-driven engine** (`org-site-builder/src/`) — preset library,
   contrast-aware token derivation, light/dark with no flash, WCAG-AA-verified
   color, semantic components, and a no-build GitHub Pages deploy.

They are welded together by the **bridge**
(`org-site-builder/scripts/intake-to-build.js`): it reads a governance
`intake.json` and writes the engine's two config files.

```
  intake.json                intake-to-build.js              the engine
 (Org-Site Kit) ─────────────────► bridge ─────────────────► org.config.json  ──► branded
  governance +               voice+mood → preset             theme.tokens.json     governance
  brand + consent            brand colors → tokens                                 org site
```

## Builder Portal (no-code)

`org-site-builder/portal/index.html` is the entire flow as a single in-browser
page — nothing is uploaded anywhere; you export the files:

- Every selection on a form: identity, brand, governance, coaching, finances,
  roster, platform, contact.
- **Logo upload** by drag-and-drop, exported as `<slug>-logo.png` so it drops
  straight into `public/images/logos/`.
- Live generated-site preview with **light/dark toggles for both the portal UI
  and the preview**, plus live WCAG AA contrast checks per theme.
- Exports `intake.json`, `theme.tokens.json`, `org.config.json`, and the logo.
  Drop the two configs into `org-site-builder/src/config/` and serve.

The portal chrome uses the NextGen design system (same tokens as
[next-gen-team.site](https://next-gen-team.site/) and this docs site); the
*preview* renders whatever brand the intake derives — that part is the product.

Serve the repo root and open `/org-site-builder/portal/`:

```bash
npx serve .
```

## Command-line flow

```bash
cd org-site-builder

# 1. Run the unified intake (paste RALLY_INTAKE_PROMPT.md into Claude) → intake.json
# 2. Bridge it into the engine's configs:
node scripts/intake-to-build.js examples/lonestar-reign.intake.json
# 3. Validate (required fields, image paths, AA contrast):
node scripts/validate-config.js
# 4. Preview (must be served — uses fetch + ES modules):
npx serve .
# 5. Deploy: see org-site-builder/LAUNCH.md
```

Workspace scripts (via pnpm): `pnpm --filter @rally/org-site-builder validate`,
`... theme`, `... new-org`, `... bridge <intake.json>`.

## What ships in the kit

| Path | What it is |
| --- | --- |
| `portal/index.html` | The no-code Builder Portal (self-contained). |
| `src/` | The engine: `main.js`, section components, styles, `src/config/` (the active site's two config files — shipped with the fictional Lonestar Reign example). |
| `schema/rally-intake.schema.json` | JSON Schema for the intake file. |
| `scripts/` | `intake-to-build.js` (bridge), `validate-config.js`, `generate-theme.js`, `create-new-org.js`, `analyze-source-sites.js`. |
| `org-kit/` | The governance content model + intake prompt + org-site breakdown. |
| `examples/` | Fictional example intake + configs (`lonestar-reign`, `example-org`). |
| `RALLY_INTAKE_PROMPT.md` | The unified 9-phase intake prompt for Claude. |
| `CONFIGURATION.md`, `ENGINE_README.md`, `LAUNCH.md`, `BRANDING.md` | Kit reference docs. |

## Relationship to the rest of the suite

- **`apps/org-builder`** is the database-backed wizard inside the Rally-OS
  portal: it provisions a real `TeamSeason` in Postgres and feeds
  `apps/public-site`. Use it when the org is (or will be) operated in Rally-OS.
- **`org-site-builder/`** is the zero-infrastructure path: a complete public
  org site from one conversation or one form, deployable anywhere, no database.
- **`cms/`** pairs naturally with the generated sites — the same JSON-file
  editing pattern keeps a launched static site maintainable by board members.
