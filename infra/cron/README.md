# NCS polling cron

`services/ncs-worker` polls NCS rosters + tournament registrations and emits
`NcsChangeReview` items. It never mutates roster data automatically.

The cadence is driven by `NCS_POLL_CRON` (default `0 */6 * * *` — every 6 hours).

## Option A — Vercel Cron

Add `vercel.json` (this directory's `vercel-cron.json`) to a deployment that
exposes the worker as a route, or run the worker on a schedule via a serverless
function. Vercel Cron uses 5-field cron expressions.

## Option B — system crontab / container scheduler

See `ncs-worker.crontab` for a crontab line. In a container platform
(Railway, Fly, Kubernetes CronJob), schedule:

```
pnpm --filter @rally/ncs-worker start
```

with `NCS_POLL_CRON` and `DATABASE_URL` set in the environment.
