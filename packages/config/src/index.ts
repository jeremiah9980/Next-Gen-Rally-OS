import { z } from 'zod'

export const siteConfigSchema = z.object({
  organization: z.object({
    name: z.string(),
    slug: z.string(),
  }),
  team: z.object({
    name: z.string(),
    season: z.string(),
    age_group: z.string(),
  }),
  modules: z.object({
    home: z.boolean(),
    team_info: z.boolean(),
    standards: z.boolean(),
    coach: z.boolean(),
    roster: z.boolean(),
    player_profiles: z.boolean(),
    schedule: z.boolean(),
    tournaments: z.boolean(),
    practice_plans: z.boolean(),
    player_development: z.boolean(),
    gamechanger_stats: z.boolean(),
    social_media_hub: z.boolean(),
    fundraising: z.boolean(),
  }),
  integrations: z.object({
    ncs: z.boolean(),
    gamechanger: z.boolean(),
  }),
  publish: z.object({
    target: z.string(),
    domain: z.string(),
  }),
})

export type SiteConfig = z.infer<typeof siteConfigSchema>

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

export type ParseSiteConfigResult =
  | { ok: true; config: SiteConfig }
  | { ok: false; error: string }

/** Parse + validate a SiteConfig from a YAML string. */
export function parseSiteConfigYaml(text: string): ParseSiteConfigResult {
  let raw: unknown
  try {
    raw = parseYaml(text)
  } catch (error) {
    return { ok: false, error: `Invalid YAML: ${error instanceof Error ? error.message : 'parse error'}` }
  }
  const result = siteConfigSchema.safeParse(raw)
  if (!result.success) {
    return { ok: false, error: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ') }
  }
  return { ok: true, config: result.data }
}

/** Serialize a SiteConfig back to YAML. */
export function toSiteConfigYaml(config: SiteConfig): string {
  return stringifyYaml(config)
}

/** A reasonable starter config with all public-safe modules enabled. */
export function defaultSiteConfig(input: {
  organization: { name: string; slug: string }
  team: { name: string; season: string; age_group: string }
  domain?: string
}): SiteConfig {
  return {
    organization: input.organization,
    team: input.team,
    modules: {
      home: true,
      team_info: true,
      standards: true,
      coach: true,
      roster: true,
      player_profiles: true,
      schedule: true,
      tournaments: true,
      practice_plans: true,
      player_development: true,
      gamechanger_stats: true,
      social_media_hub: true,
      fundraising: true,
    },
    integrations: { ncs: true, gamechanger: true },
    publish: { target: 'vercel', domain: input.domain ?? `${input.organization.slug}.example.com` },
  }
}
