'use server'

import { parseSiteConfigYaml, type SiteConfig } from '@rally/config'
import { enabledModules } from '@rally/site-template'
import { buildPublishedProjection } from '@rally/projection'
import { provisionFromConfig } from '../lib/provision'

export type PreviewResult =
  | { ok: true; organization: string; team: string; modules: string[]; target: string; domain: string; config: SiteConfig }
  | { ok: false; error: string }

export async function previewConfigAction(yaml: string): Promise<PreviewResult> {
  const parsed = parseSiteConfigYaml(yaml)
  if (!parsed.ok) return { ok: false, error: parsed.error }
  return {
    ok: true,
    organization: parsed.config.organization.name,
    team: parsed.config.team.name,
    modules: enabledModules(parsed.config),
    target: parsed.config.publish.target,
    domain: parsed.config.publish.domain,
    config: parsed.config,
  }
}

export type ProvisionActionResult =
  | { ok: true; teamSeasonId: string; sections: string[] }
  | { ok: false; error: string }

export async function provisionConfigAction(yaml: string): Promise<ProvisionActionResult> {
  const parsed = parseSiteConfigYaml(yaml)
  if (!parsed.ok) return { ok: false, error: parsed.error }
  try {
    const { organizationId, teamSeasonId } = await provisionFromConfig(parsed.config)
    const projection = await buildPublishedProjection(organizationId, parsed.config)
    const sections = projection
      ? Object.keys(projection).filter((k) => k !== 'organization' && k !== 'team')
      : []
    return { ok: true, teamSeasonId, sections }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Provision failed.' }
  }
}
