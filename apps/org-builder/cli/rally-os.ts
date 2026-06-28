#!/usr/bin/env tsx
import { readFileSync } from 'node:fs'
import { parseSiteConfigYaml } from '@rally/config'
import { enabledModules } from '@rally/site-template'
import { buildPublishedProjection } from '@rally/projection'
import { provisionFromConfig } from '../src/lib/provision'

/**
 * rally-os build <config.yaml>
 *
 * 1) Validate the SiteConfig YAML.
 * 2) Provision the TeamSeason in core-data (seed Team Info).
 * 3) Report the enabled modules + a published-projection preview.
 * 4) Describe the publish target (actual Vercel deploy runs in CI/infra).
 */
async function main() {
  const [command, configPath] = process.argv.slice(2)

  if (command !== 'build' || !configPath) {
    console.error('Usage: rally-os build <config.yaml>')
    process.exit(1)
  }

  let text: string
  try {
    text = readFileSync(configPath, 'utf8')
  } catch {
    console.error(`Could not read config file: ${configPath}`)
    process.exit(1)
  }

  const parsed = parseSiteConfigYaml(text)
  if (!parsed.ok) {
    console.error(`Invalid SiteConfig: ${parsed.error}`)
    process.exit(1)
  }
  const config = parsed.config

  console.log(`✓ Config valid for ${config.organization.name} / ${config.team.name}`)
  console.log(`  Enabled modules: ${enabledModules(config).join(', ')}`)

  const { organizationId, teamSeasonId } = await provisionFromConfig(config)
  console.log(`✓ Provisioned TeamSeason ${teamSeasonId} (org ${organizationId})`)

  const projection = await buildPublishedProjection(organizationId, config)
  if (projection) {
    const sections = Object.keys(projection).filter((k) => k !== 'organization' && k !== 'team')
    console.log(`✓ Published projection ready — sections: ${sections.join(', ') || '(none yet)'}`)
  } else {
    console.log('• No active season data to project yet.')
  }

  console.log(`→ Publish target: ${config.publish.target} @ ${config.publish.domain}`)
  console.log('  (Run the infra deploy task to push apps/public-site to Vercel.)')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
