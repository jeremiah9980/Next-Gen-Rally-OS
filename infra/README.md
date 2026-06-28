# infra/

Infrastructure contracts for Next-Gen-Rally-OS.

| File           | Purpose                                                                 |
| -------------- | ----------------------------------------------------------------------- |
| `.env.example` | The canonical environment contract. Copy to `.env` and fill in secrets. |

## Planned (owned by the infra finalization step)

- **DB** — Prisma migrations + seed for `packages/core-data`.
- **Cron** — schedule for `services/ncs-worker` (driven by `NCS_POLL_CRON`).
- **Per-team deploy** — Vercel project notes for `apps/rally-os` and each
  published `apps/public-site` instance (driven by `VERCEL_TOKEN`).

See the root [README](../README.md) for the architecture and data-flow rules.
