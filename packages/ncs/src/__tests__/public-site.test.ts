import { describe, expect, it } from 'vitest'
import { toPublicTeamSeasonPayload } from '../public-site'

describe('toPublicTeamSeasonPayload', () => {
  it('never includes coach-private fields in public payload', () => {
    const payload = toPublicTeamSeasonPayload({
      id: 'ts_1',
      team_name: 'Rally Elite',
      season: '2026',
      age_group: '14U',
      organization: 'Rally Org',
      head_coach: 'Coach A',
      assistant_coaches: 'Coach B',
      practice_location: 'Field 1',
      primary_game_location: 'Field 2',
      team_standards: 'Standards',
      development_goals: 'Goals',
      communication_expectations: 'Expectations',
      coach_notes: 'private-only',
      coach_practice_version: 'v3-private',
    }) as Record<string, unknown>

    expect(payload.coach_notes).toBeUndefined()
    expect(payload.coach_practice_version).toBeUndefined()
    expect(payload.team_name).toBe('Rally Elite')
  })
})
