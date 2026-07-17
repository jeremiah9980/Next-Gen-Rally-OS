import { AI_MODEL, extractText, getAnthropicClient, parseJsonResponse } from './client'
import {
  practicePlanInputSchema,
  practicePlanResultSchema,
  type PracticePlanInput,
  type PracticePlanResult,
} from './types'

const SYSTEM = `You are an expert youth-softball practice planner for Rally-OS.
Produce a single, well-structured practice plan in TWO versions from the same plan:

- COACH version: full operational detail, including private per-player notes.
- PLAYER version: athlete-facing only. It MUST NOT contain any private coach
  notes, evaluations, or anything not appropriate to share with players/parents.

Also extract reusable drills and a reusable practice template.

Respond with ONLY a single JSON object (no prose, no markdown fences) matching:
{
  "coach": {
    "full_schedule": [{"time": str, "block": str, "detail": str}],
    "coach_assignments": [str],
    "drill_instructions": [{"drill": str, "instructions": str}],
    "player_groups": [{"group": str, "players": [str]}],
    "private_player_notes": [{"player": str, "note": str}],
    "development_focus": [str],
    "ai_suggestions": [str],
    "equipment": [str],
    "contingency_plan": str
  },
  "player": {
    "practice_time": str,
    "practice_location": str,
    "practice_blocks": [{"time": str, "activity": str}],
    "drills": [{"name": str, "description": str}],
    "expectations": [str],
    "equipment_to_bring": [str],
    "team_focus": str
  },
  "drills": [{"name": str, "category": str, "durationMinutes": int, "description": str, "instructions": str, "equipment": str, "focusTags": [str]}],
  "template": {"name": str, "description": str, "blocks": [{"time": str, "block": str, "detail": str}]}
}`

function buildUserPrompt(input: PracticePlanInput): string {
  return [
    `Practice date: ${input.practiceDate}`,
    `Duration: ${input.duration}`,
    `Location: ${input.location}`,
    `Team focus: ${input.teamFocus}`,
    `Available coaches: ${input.availableCoaches.join(', ') || 'unspecified'}`,
    `Available players: ${input.availablePlayers.join(', ') || 'unspecified'}`,
    '',
    'Recent game stats:',
    ...(input.recentGameStats.length ? input.recentGameStats.map((s) => `- ${s}`) : ['- none provided']),
    '',
    'Recent player notes (coach-private context — use for COACH version only):',
    ...(input.recentPlayerNotes.length
      ? input.recentPlayerNotes.map((n) => `- ${n}`)
      : ['- none provided']),
    '',
    'Available drill library (prefer reusing these where they fit):',
    ...(input.drillLibrary.length ? input.drillLibrary.map((d) => `- ${d}`) : ['- none provided']),
  ].join('\n')
}

/**
 * Build a structured practice plan with COACH and PLAYER versions via Claude.
 * The PLAYER version is sanitized of private notes both by instruction and by
 * the strict output schema (it has no field that could carry them).
 */
export async function buildPracticePlan(rawInput: PracticePlanInput): Promise<PracticePlanResult> {
  const input = practicePlanInputSchema.parse(rawInput)
  const client = getAnthropicClient()

  const message = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 16000,
    system: SYSTEM,
    messages: [{ role: 'user', content: buildUserPrompt(input) }],
  })

  const parsed = parseJsonResponse(extractText(message.content))
  return practicePlanResultSchema.parse(parsed)
}
