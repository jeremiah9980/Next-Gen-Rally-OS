export type TeamSeasonPublicPayload = {
  id: string
  team_name: string
  season: string
  age_group: string
  organization: string | null
  head_coach: string | null
  assistant_coaches: string | null
  practice_location: string | null
  primary_game_location: string | null
  team_standards: string | null
  development_goals: string | null
  communication_expectations: string | null
}

export function toPublicTeamSeasonPayload(input: {
  id: string
  team_name: string
  season: string
  age_group: string
  organization: string | null
  head_coach: string | null
  assistant_coaches: string | null
  practice_location: string | null
  primary_game_location: string | null
  team_standards: string | null
  development_goals: string | null
  communication_expectations: string | null
  coach_notes?: string | null
  coach_practice_version?: string | null
}): TeamSeasonPublicPayload {
  const {
    id,
    team_name,
    season,
    age_group,
    organization,
    head_coach,
    assistant_coaches,
    practice_location,
    primary_game_location,
    team_standards,
    development_goals,
    communication_expectations,
  } = input

  return {
    id,
    team_name,
    season,
    age_group,
    organization,
    head_coach,
    assistant_coaches,
    practice_location,
    primary_game_location,
    team_standards,
    development_goals,
    communication_expectations,
  }
}
