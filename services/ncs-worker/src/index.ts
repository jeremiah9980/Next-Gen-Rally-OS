import cron from 'node-cron'
import { prisma } from '@rally/core-data'
import { parseNcsRosterText } from '@rally/ncs-parser'
import { diffRoster } from './diff-roster.js'

const POLL_CRON = process.env.NCS_POLL_CRON ?? '0 * * * *'

async function pollNcsRosters() {
  console.log(`[ncs-worker] Running NCS poll at ${new Date().toISOString()}`)

  const teamSeasons = await prisma.teamSeason.findMany({
    where: { isActive: true },
    include: {
      ncsPlayerSources: true,
    },
  })

  for (const teamSeason of teamSeasons) {
    if (teamSeason.ncsPlayerSources.length === 0) continue

    const urlGroups = new Map<string, typeof teamSeason.ncsPlayerSources>()
    for (const source of teamSeason.ncsPlayerSources) {
      const url = source.ncsTeamUrl ?? '__no_url__'
      const group = urlGroups.get(url) ?? []
      group.push(source)
      urlGroups.set(url, group)
    }

    for (const [, sources] of urlGroups) {
      console.log(
        `[ncs-worker] Would fetch NCS data for TeamSeason ${teamSeason.id} (${sources.length} known players)`,
      )
    }
  }

  console.log('[ncs-worker] Poll complete')
}

/**
 * Accepts pasted NCS roster text for a given TeamSeason and creates
 * NcsChangeReview items for detected changes. This is the core diff function
 * that the scheduled job (and manual trigger) calls.
 *
 * NEVER mutates roster data automatically.
 */
export async function runNcsDiff(teamSeasonId: string, pastedText: string) {
  const incoming = parseNcsRosterText(pastedText)
  if (incoming.length === 0) {
    console.log('[ncs-worker] No rows parsed from input')
    return { reviewed: 0 }
  }

  const stored = await prisma.ncsPlayerSource.findMany({
    where: { teamSeasonId },
  })

  const changes = diffRoster(incoming, stored, teamSeasonId)

  if (changes.length === 0) {
    console.log(`[ncs-worker] No changes detected for TeamSeason ${teamSeasonId}`)
    return { reviewed: 0 }
  }

  let created = 0
  for (const change of changes) {
    try {
      const existing = await prisma.ncsChangeReview.findFirst({
        where: {
          teamSeasonId: change.teamSeasonId,
          playerId: change.playerId,
          ncsId: change.ncsId,
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          status: {
            in: ['change_detected', 'pending_review'],
          },
        },
      })

      if (existing) continue

      await prisma.ncsChangeReview.create({
        data: {
          teamSeasonId: change.teamSeasonId,
          playerId: change.playerId,
          ncsId: change.ncsId,
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          status: 'change_detected',
        },
      })
      created++
    } catch {
      // Skip individual row errors so pollers keep running.
    }
  }

  console.log(`[ncs-worker] Created ${created} NcsChangeReview items for TeamSeason ${teamSeasonId}`)
  return { reviewed: created }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!cron.validate(POLL_CRON)) {
    console.error(`[ncs-worker] Invalid NCS_POLL_CRON: "${POLL_CRON}"`)
    process.exit(1)
  }

  console.log(`[ncs-worker] Scheduling polls with cron: ${POLL_CRON}`)
  cron.schedule(POLL_CRON, pollNcsRosters)
  console.log('[ncs-worker] Worker started')
}
