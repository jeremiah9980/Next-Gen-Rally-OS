/**
 * The PUBLISHED PROJECTION — the public-safe shape every site-template module
 * reads from. It is produced by the org-builder from the operational record and
 * is the ONLY thing the public site ever sees.
 *
 * Two governance rules are baked into this type:
 *  - There is no field for coach-private notes or the coach practice version.
 *  - `practice_plans` carries only the PLAYER version of a plan.
 *  - `integrations_status` is intentionally absent — it is internal-only and
 *    must never be published.
 */

export type PublicStaffMember = { name: string; role: string }
export type PublicRosterPlayer = { name: string; jerseyNumber?: string; position?: string }
export type PublicPlayerProfile = { name: string; bio?: string; highlights?: string[] }
export type PublicGame = {
  opponent: string
  date: string
  time?: string
  location?: string
  result?: string
}
export type PublicTournament = {
  name: string
  location?: string
  startDate?: string
  endDate?: string
}
/** Mirror of the AI PLAYER practice version — public-safe by construction. */
export type PublicPracticePlan = {
  practice_time?: string
  practice_location?: string
  practice_blocks?: { time: string; activity: string }[]
  drills?: { name: string; description: string }[]
  expectations?: string[]
  equipment_to_bring?: string[]
  team_focus?: string
}
export type PublicDevelopmentFocus = { title: string; detail?: string }
export type PublicStatRow = { name: string; avg: string; ab: string; rbi: string; hr: string }

export type PublishedProjection = {
  organization: { name: string; slug: string }
  team: { name: string; season: string; age_group: string }

  home?: { tagline?: string; intro?: string }
  team_info?: {
    head_coach?: string
    practice_location?: string
    primary_game_location?: string
  }
  standards?: {
    team_standards?: string
    development_goals?: string
    communication_expectations?: string
  }
  // Public coach view: staff + philosophy only — never private notes.
  coach?: { staff: PublicStaffMember[]; philosophy?: string }
  roster?: { players: PublicRosterPlayer[] }
  player_profiles?: { profiles: PublicPlayerProfile[] }
  // Approved games only.
  schedule?: { games: PublicGame[] }
  tournaments?: { events: PublicTournament[] }
  // PLAYER version of practice plans only.
  practice_plans?: { plans: PublicPracticePlan[] }
  player_development?: { focuses: PublicDevelopmentFocus[] }
  // Read-only imported stats + clip links.
  gamechanger_stats?: { rows: PublicStatRow[]; clips?: { label: string; url: string }[] }
  social_media_hub?: { links: { label: string; url: string }[] }
  fundraising?: { campaigns: { title: string; goal?: string; url?: string }[] }
}
