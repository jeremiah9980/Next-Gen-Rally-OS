# infra/

Infrastructure contracts for Next-Gen-Rally-OS.

| Path | Purpose |
| --- | --- |
| `.env.example` | The canonical environment contract. Copy to `.env` and fill in secrets. |
| `db/README.md` | Database workflows — generate, push, migrate, seed. |
| `vercel/` | Vercel project settings for `rally-os` and per-team `public-site` (+ `*.vercel.json`). |
| `cron/` | NCS polling schedule for `services/ncs-worker` (`NCS_POLL_CRON`). |
| `SMOKE_TEST.md` | Acceptance checklist mapped to the demo criteria. |

Operational entry points live in the root [`Makefile`](../Makefile): `make
install / generate / migrate / push / seed / build / deploy-rally-os /
deploy-public-site`.

See the root [README](../README.md) for the architecture and data-flow rules.
