# Vercel deployment

Two kinds of Vercel projects:

| Project | App | Notes |
| --- | --- | --- |
| `rally-os` | `apps/rally-os` | The coach operations app (one shared project). |
| `public-site-<team-slug>` | `apps/public-site` | One project **per team** — set `PUBLIC_SITE_ORG_SLUG` and the custom domain from `publish.domain`. |

## Project settings (monorepo)

For each project, point Vercel at the app directory and use the pnpm/turbo build:

| Setting | rally-os | public-site |
| --- | --- | --- |
| Root Directory | `apps/rally-os` | `apps/public-site` |
| Framework Preset | Next.js | Next.js |
| Install Command | `pnpm install` | `pnpm install` |
| Build Command | `pnpm db:generate && pnpm --filter @rally/rally-os build` | `pnpm db:generate && pnpm --filter @rally/public-site build` |

The committed `*.vercel.json` files in this directory capture the install/build
commands. Copy one into the app's project root (as `vercel.json`) or paste the
values into the Vercel dashboard.

## Required environment variables (per project)

- **rally-os**: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `EMAIL_SERVER`,
  `EMAIL_FROM`, `ANTHROPIC_API_KEY`.
- **public-site-<team>**: `DATABASE_URL`, `PUBLIC_SITE_ORG_SLUG`.

## Per-team publish flow

1. Coach completes the org-builder wizard (or `rally-os build <config.yaml>`).
2. Create a `public-site-<slug>` Vercel project, set `PUBLIC_SITE_ORG_SLUG=<slug>`
   and the domain from `publish.domain`.
3. `make deploy-public-site` (or the Vercel Git integration) builds the site from
   the published projection.
4. Re-publish (re-deploy) whenever approved NCS changes land.
