import { prisma } from '@rally/core-data'
import type { SiteConfig } from '@rally/config'

export type ProvisionResult = {
  organizationId: string
  teamId: string
  teamSeasonId: string
}

/**
 * Provision (or update) the Organization → Team → TeamSeason for a SiteConfig,
 * seeding the basic Team Info from the config. Idempotent via slug-derived ids.
 * Standards and the rich Team Info fields are left for the coach to fill in
 * Rally-OS — this only establishes the records.
 */
export async function provisionFromConfig(config: SiteConfig): Promise<ProvisionResult> {
  const slug = config.organization.slug
  const teamId = `team-${slug}`
  const seasonId = `season-${slug}`

  const organization = await prisma.organization.upsert({
    where: { slug },
    update: { name: config.organization.name },
    create: { id: `org-${slug}`, name: config.organization.name, slug },
  })

  await prisma.team.upsert({
    where: { id: teamId },
    update: { name: config.team.name, organizationId: organization.id },
    create: { id: teamId, name: config.team.name, organizationId: organization.id },
  })

  await prisma.teamSeason.upsert({
    where: { id: seasonId },
    update: {
      teamId,
      isActive: true,
      team_name: config.team.name,
      season: config.team.season,
      age_group: config.team.age_group,
      organization: config.organization.name,
    },
    create: {
      id: seasonId,
      teamId,
      isActive: true,
      team_name: config.team.name,
      season: config.team.season,
      age_group: config.team.age_group,
      organization: config.organization.name,
    },
  })

  return { organizationId: organization.id, teamId, teamSeasonId: seasonId }
}
