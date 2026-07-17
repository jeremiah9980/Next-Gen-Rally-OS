# Rally-ORG — Builder Kit

**Rally-ORG turns a 25-minute conversation into a branded, governance-grade website for a
youth select-sports organization — no build step, ready for GitHub Pages.**

This kit is the **fusion** of two proven systems:

1. **The Org-Site Kit** — the governance-grade content model: a four-tier org structure
   (Executive · Board · Coaching · Operations), two firewalls (Coaching Firewall +
   Family-First Coverage), a privacy-first consent architecture for minor players, and a
   nine-phase AI intake ("Rally") that produces a validated `intake.json`.
2. **The softball-org-site-template-generator** — the config-driven engine: a preset
   library, contrast-aware token derivation, light/dark with no flash, AA-verified color,
   semantic/accessible components, and a no-build GitHub Pages deploy.

The two were welded together by one new piece: **`scripts/intake-to-build.js`** (the
bridge). It reads a governance `intake.json` and writes the engine's two config files —
establishing the new team's **brand identity + UI** automatically and rendering the full
governance site from it.

```
  intake.json                  intake-to-build.js               the engine
 (Org-Site Kit) ───────────────────►  bridge  ──────────────────►  org.config.json   ──► branded
  governance +                  voice+mood -> preset               theme.tokens.json      governance
  brand + consent               brand colors -> tokens                                    org site
                                governance -> sections
```

## Quick start

```bash
# 1. Run the unified intake (paste RALLY_INTAKE_PROMPT.md into Claude) -> save intake.json
# 2. Bridge it into the engine's configs:
node scripts/intake-to-build.js examples/lonestar-reign.intake.json
# 3. Validate (required fields, image paths, AA contrast):
node scripts/validate-config.js
# 4. Preview (must be served -- uses fetch + ES modules):
npx serve .
# 5. Deploy: see LAUNCH.md (GitHub Pages, deploy from main / root).
```

## Builder Portal (no-code)

Prefer clicking to typing? Open **`portal/index.html`** in a browser (or run `npx serve .`
and visit `/portal/`). It runs the **exact same theme + content math as the bridge**,
entirely in the browser — nothing is uploaded anywhere:

- make every selection on a form (identity, brand, governance, coaching, finances, roster, platform, contact),
- **upload a logo** by drag-and-drop — it's exported named `<slug>-logo.png` so it drops straight into `public/images/logos/`,
- toggle **both** the portal's own UI *and* the generated-site preview between light and dark, with live WCAG AA contrast checks for each theme,
- export `intake.json`, `theme.tokens.json`, `org.config.json`, and the logo — then drop the two configs into `src/config/` and serve.

Only the preview's web fonts need a connection; the logic and export work offline.

## What's in here

| Path | What it is | From |
|---|---|---|
| `RALLY_INTAKE_PROMPT.md` | **The unified intake prompt.** Runs the 9-phase governance conversation *and* establishes the visual identity/UI. | merge |
| `portal/index.html` | **The Builder Portal** — a no-code, in-browser version of the intake: make selections, upload a logo, preview light/dark with live AA checks, export the same configs. | this build |
| `schema/rally-intake.schema.json` | The intake contract (`schema_version 1.0`). | Org-Site Kit |
| `scripts/intake-to-build.js` | **The bridge.** `intake.json` -> `org.config.json` + `theme.tokens.json`. | merge (new) |
| `scripts/generate-theme.js` | Preset -> theme tokens (used standalone or by the bridge). | engine |
| `scripts/validate-config.js` | Required fields, image paths on disk, AA contrast. | engine |
| `src/` | The config-driven engine (components, styles, runtime). | engine |
| `examples/lonestar-reign.intake.json` | A complete worked intake for a brand-new org. | this build |
| `examples/site/index.html` | The **rendered result** for that org (open in a browser). | this build |
| `org-kit/` | The original Org-Site Kit docs (architecture, intake, schema). | uploaded |
| `BRANDING.md` · `CONFIGURATION.md` · `LAUNCH.md` · `ENGINE_README.md` | Engine docs. | engine |

## The worked example: Lonestar Reign

`examples/lonestar-reign.intake.json` describes a brand-new 14U org in Round Rock, TX --
crimson + platinum, "Earn the crown.", elite voice. Running the bridge on it:

- **Established the identity automatically:** voice `elite` -> base preset
  `black-gold-premium` (classic Oswald type, dark bias); brand colors `#9B1B30` /
  `#C9CDD6` overrode the preset's gold so the org's real palette wins. Every other surface
  was derived; **all four AA contrast pairs pass in both light and dark.**
- **Built the governance content:** four tiers, the board vote table, both firewalls,
  finances + coach waivers, a 12-player **consent-gated** roster (GameChanger format,
  photos/profiles off by default), and a "Powered by Rally-IQ" platform section.

Open `examples/site/index.html` to see the result. It is intentionally distinct from the
reference orgs (Bananas = blue/gold; Venom = purple/lime) -- structure was reused, identity
was not.

## How Rally-ORG relates to Rally-IQ

- **Rally-ORG** is the **public governance website** -- how an org runs, in public.
- **Rally-IQ** is the **operating system** the org runs on (Coach · Teams · Profiles ·
  Fundraise · Scout · Org).

The org site's Platform section links the two: a Rally-ORG site says *"powered by
Rally-IQ,"* and Rally-IQ's `Org` module can publish/refresh a Rally-ORG site. One
identity, two surfaces -- the public document and the operating system behind it.
