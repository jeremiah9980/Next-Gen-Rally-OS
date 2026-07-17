# CMS & Integration Center

A lightweight, no-backend content system incorporated from the organization's
`primetime-org` site hub, rebranded for NextGen Rally-OS. It lets board
members and coaches edit org/team content and pull live NCS + GameChanger data
without touching code.

## Pieces

| Path | Purpose |
| --- | --- |
| `cms/content/nextgen-site.json` | Single source of truth for editable content: org info, board, teams (incl. rosters, coach info, GameChanger/NCS links), fundraising/sponsors, docs, policies, bylaws, finances, SEO. |
| `cms/schema/nextgen-site.schema.json` | JSON Schema describing the shape of that file. |
| `cms/admin/index.html` | Form-based dashboard for editing the content file. |
| `cms/admin/integrations.html` | **Integration Center** — live NCS team search, roster import, event sync, and GameChanger stat matching. |
| `cms/content/nextgen-integrations.json` | Integration Center config: API base URL, active team, NCS search defaults, sync policy, per-team NCS/GameChanger mappings. |
| `services/integrations-worker/` | Cloudflare Worker backing the Integration Center's live mode. |
| `scripts/validate-cms-content.mjs` | Content validator — required fields, duplicate team ids, leftover `[ENTER ...]` placeholders. Run with `pnpm cms:validate`. |

## Editing workflow

1. Serve the repo root over HTTP (pages `fetch()` the JSON, so opening from
   disk won't load content):

   ```bash
   npx serve .
   ```

2. Open `http://localhost:3000/cms/admin/`.
3. Edit any tab (Org Info, Board, Teams, Roster, Fundraising, Docs, Policies,
   Bylaws, Finances, SEO).
4. Click **Validate** to catch mistakes before publishing.
5. Click **Export for GitHub** — downloads an updated `nextgen-site.json`.
6. Replace `cms/content/nextgen-site.json` with the downloaded file, commit,
   and push. `pnpm cms:validate` checks the file in CI-friendly fashion.

## Integration Center

`cms/admin/integrations.html` is the live half of the CMS. It talks to the
integrations Worker to:

- Search NCS (playncs.com) teams by name/division/state and link a team.
- Import an NCS roster (with real NCS player ids) into the content file.
- Sync registered tournament events for linked teams.
- Cross-reference players against the `gc_stats` database for GameChanger
  season stats (exact NCS-id joins first, then normalized name + jersey
  matching).

It ships in **demo mode** (`demoMode: true` in
`cms/content/nextgen-integrations.json`) so the UI works offline with sample
data. Set `demoMode: false` to go live against the Worker.

## Integrations Worker

playncs.com has no JSON API and no CORS headers, so the browser can't read it
directly. `services/integrations-worker/` fetches the public NCS pages
server-side, parses the HTML, and returns JSON with CORS enabled.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health?adapter=health\|ncs\|gamechanger` | Connection tests for Diagnostics |
| `GET /api/ncs/meta` | Season / age / class option ids from the NCS search form |
| `GET /api/ncs/teams?q=&division=&state=…` | Team search |
| `GET /api/ncs/teams/:id/roster` | Roster with real NCS player ids (`:id` accepts a pasted team URL) |
| `GET /api/ncs/teams/:id/events` | Upcoming events for one team |
| `POST /api/ncs/events/sync` | Merged registered events for several teams |
| `POST /api/gamechanger/sync` | Cross-reference + stats from the `gc_stats` D1 database |
| `POST /api/gcstats/match` | Match website players to `gc_stats` records |

Deploy your own instance and point `apiBaseUrl` at it:

```bash
cd services/integrations-worker
npx wrangler deploy
```

Until then, `apiBaseUrl` defaults to the organization's already-deployed
Worker. If NCS changes its page markup, the regex parsers in
`services/integrations-worker/src/index.js` are the only thing that needs
updating.

## Relationship to the Rally-OS apps

The Rally-OS portal (`apps/rally-os`) has its own first-class NCS pipeline
(`packages/ncs`) and GameChanger workflow backed by Prisma. The CMS is the
zero-infrastructure counterpart for static org/team sites (see
`packages/site-template`): one JSON file, a static admin, and an optional
Worker — no database or auth required.
