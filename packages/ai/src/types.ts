import { z } from 'zod'

// ── Practice Plan Builder ────────────────────────────────────────────────────

export const practicePlanInputSchema = z.object({
  teamId: z.string(),
  teamSeasonId: z.string(),
  practiceDate: z.string(),
  duration: z.string(),
  location: z.string(),
  teamFocus: z.string(),
  recentGameStats: z.array(z.string()).default([]),
  recentPlayerNotes: z.array(z.string()).default([]),
  availableCoaches: z.array(z.string()).default([]),
  availablePlayers: z.array(z.string()).default([]),
  drillLibrary: z.array(z.string()).default([]),
})
export type PracticePlanInput = z.infer<typeof practicePlanInputSchema>

const scheduleBlockSchema = z.object({
  time: z.string(),
  block: z.string(),
  detail: z.string(),
})

const reusableDrillSchema = z.object({
  name: z.string(),
  category: z.string().default('general'),
  durationMinutes: z.number().int().nonnegative().default(0),
  description: z.string().default(''),
  instructions: z.string().default(''),
  equipment: z.string().default(''),
  focusTags: z.array(z.string()).default([]),
})
export type ReusableDrill = z.infer<typeof reusableDrillSchema>

/** Full coach version — includes private notes. Never published to athletes. */
export const coachPracticeVersionSchema = z.object({
  full_schedule: z.array(scheduleBlockSchema).default([]),
  coach_assignments: z.array(z.string()).default([]),
  drill_instructions: z.array(z.object({ drill: z.string(), instructions: z.string() })).default([]),
  player_groups: z.array(z.object({ group: z.string(), players: z.array(z.string()) })).default([]),
  private_player_notes: z.array(z.object({ player: z.string(), note: z.string() })).default([]),
  development_focus: z.array(z.string()).default([]),
  ai_suggestions: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
  contingency_plan: z.string().default(''),
})
export type CoachPracticeVersion = z.infer<typeof coachPracticeVersionSchema>

/** Player version — MUST exclude all private coach notes. */
export const playerPracticeVersionSchema = z.object({
  practice_time: z.string().default(''),
  practice_location: z.string().default(''),
  practice_blocks: z.array(z.object({ time: z.string(), activity: z.string() })).default([]),
  drills: z.array(z.object({ name: z.string(), description: z.string() })).default([]),
  expectations: z.array(z.string()).default([]),
  equipment_to_bring: z.array(z.string()).default([]),
  team_focus: z.string().default(''),
})
export type PlayerPracticeVersion = z.infer<typeof playerPracticeVersionSchema>

export const practiceTemplateSchema = z.object({
  name: z.string(),
  description: z.string().default(''),
  blocks: z.array(scheduleBlockSchema).default([]),
})
export type PracticeTemplateOutput = z.infer<typeof practiceTemplateSchema>

export const practicePlanResultSchema = z.object({
  coach: coachPracticeVersionSchema,
  player: playerPracticeVersionSchema,
  drills: z.array(reusableDrillSchema).default([]),
  template: practiceTemplateSchema,
})
export type PracticePlanResult = z.infer<typeof practicePlanResultSchema>

// ── Player-trend suggestions ─────────────────────────────────────────────────

export const playerTrendInputSchema = z.object({
  teamSeasonId: z.string(),
  players: z
    .array(
      z.object({
        playerId: z.string(),
        name: z.string(),
        recentStats: z.array(z.string()).default([]),
        coachNotes: z.array(z.string()).default([]),
      }),
    )
    .default([]),
})
export type PlayerTrendInput = z.infer<typeof playerTrendInputSchema>

const developmentSuggestionSchema = z.object({
  playerId: z.string(),
  playerName: z.string(),
  recurring_errors: z.array(z.string()).default([]),
  improvement_areas: z.array(z.string()).default([]),
  development_focus: z.array(z.string()).default([]),
  /** Advisory coach note text (will be ai-tagged on save). */
  advisory_note: z.string().default(''),
})
export type DevelopmentSuggestion = z.infer<typeof developmentSuggestionSchema>

export const playerTrendResultSchema = z.object({
  suggestions: z.array(developmentSuggestionSchema).default([]),
})
export type PlayerTrendResult = z.infer<typeof playerTrendResultSchema>
