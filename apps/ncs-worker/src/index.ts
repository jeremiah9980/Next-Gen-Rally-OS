/**
 * NCS Worker entry point.
 *
 * Reads NCS_POLL_CRON from the environment to schedule recurring polls.
 * If NCS_POLL_CRON is not set, performs a single immediate poll and exits.
 *
 * Example .env:
 *   DATABASE_URL=postgresql://...
 *   NCS_POLL_CRON=0 * * * *   # every hour
 */
import cron from 'node-cron'
import { runNcsPoll } from './worker.js'

const NCS_POLL_CRON = process.env.NCS_POLL_CRON

if (!NCS_POLL_CRON) {
  console.log('[ncs-worker] NCS_POLL_CRON not set — running a single immediate poll.')
  runNcsPoll()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[ncs-worker] Fatal error:', err)
      process.exit(1)
    })
} else {
  if (!cron.validate(NCS_POLL_CRON)) {
    console.error(`[ncs-worker] Invalid cron expression: "${NCS_POLL_CRON}". Exiting.`)
    process.exit(1)
  }

  console.log(`[ncs-worker] Scheduling NCS polls with cron: "${NCS_POLL_CRON}"`)

  cron.schedule(NCS_POLL_CRON, () => {
    runNcsPoll().catch((err) => {
      console.error('[ncs-worker] Poll error:', err)
    })
  })

  // Keep the process alive
  console.log('[ncs-worker] Worker started. Waiting for next scheduled run…')
}
