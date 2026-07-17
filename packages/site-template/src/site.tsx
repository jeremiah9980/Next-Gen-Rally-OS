import type { SiteConfig } from '@rally/config'
import type { PublishedProjection } from './projection'
import {
  CoachModule,
  FundraisingModule,
  GameChangerStatsModule,
  HomeModule,
  PlayerDevelopmentModule,
  PlayerProfilesModule,
  PracticePlansModule,
  RosterModule,
  ScheduleModule,
  SocialMediaHubModule,
  StandardsModule,
  TeamInfoModule,
  TournamentsModule,
} from './modules'

type ModuleKey = keyof SiteConfig['modules']
type ModuleComponent = (props: { projection: PublishedProjection }) => React.ReactNode

/** Render order + the component for each toggleable module. */
const MODULES: { key: ModuleKey; Component: ModuleComponent }[] = [
  { key: 'home', Component: HomeModule },
  { key: 'team_info', Component: TeamInfoModule },
  { key: 'standards', Component: StandardsModule },
  { key: 'coach', Component: CoachModule },
  { key: 'roster', Component: RosterModule },
  { key: 'player_profiles', Component: PlayerProfilesModule },
  { key: 'schedule', Component: ScheduleModule },
  { key: 'tournaments', Component: TournamentsModule },
  { key: 'practice_plans', Component: PracticePlansModule },
  { key: 'player_development', Component: PlayerDevelopmentModule },
  { key: 'gamechanger_stats', Component: GameChangerStatsModule },
  { key: 'social_media_hub', Component: SocialMediaHubModule },
  { key: 'fundraising', Component: FundraisingModule },
]

export type SiteRendererProps = {
  config: SiteConfig
  projection: PublishedProjection
}

/**
 * Compose the enabled site-template modules into a single page. A module renders
 * only when its config toggle is on AND the published projection carries data
 * for it. `integrations_status` is never a module — it is internal-only.
 */
export function SiteRenderer({ config, projection }: SiteRendererProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-12 md:px-8">
      {MODULES.map(({ key, Component }) =>
        config.modules[key] ? <Component key={key} projection={projection} /> : null,
      )}
    </div>
  )
}

/** Which modules will actually render given the config + projection. */
export function enabledModules(config: SiteConfig): ModuleKey[] {
  return MODULES.filter(({ key }) => config.modules[key]).map(({ key }) => key)
}
