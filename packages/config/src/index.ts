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
