import { AI_MODEL, extractText, getAnthropicClient, parseJsonResponse } from './client'
import {
  playerTrendInputSchema,
  playerTrendResultSchema,
  type PlayerTrendInput,
  type PlayerTrendResult,
} from './types'

const SYSTEM = `You are a youth-softball player-development analyst for Rally-OS.
From each player's recent stats and coach notes, summarize recurring errors,
improvement areas, and a short development focus. Your output is ADVISORY ONLY —
it suggests notes and focuses for the coach to review; it never edits roster,
stats, or any other record.

Respond with ONLY a single JSON object (no prose, no markdown fences) matching:
{
  "suggestions": [
    {
      "playerId": str,
      "playerName": str,
      "recurring_errors": [str],
      "improvement_areas": [str],
      "development_focus": [str],
      "advisory_note": str
    }
  ]
}
Include one entry per player provided; preserve the given playerId exactly.`

function buildUserPrompt(input: PlayerTrendInput): string {
  return input.players
    .map((p) =>
      [
        `Player: ${p.name} (id: ${p.playerId})`,
        `Recent stats: ${p.recentStats.join('; ') || 'none'}`,
        `Coach notes: ${p.coachNotes.join('; ') || 'none'}`,
      ].join('\n'),
    )
    .join('\n\n')
}

/**
 * Summarize player trends into advisory DevelopmentFocus + ai-tagged note text.
 * Advisory only — callers persist these as advisory records and never auto-edit
 * other fields.
 */
export async function generatePlayerTrendSuggestions(
  rawInput: PlayerTrendInput,
): Promise<PlayerTrendResult> {
  const input = playerTrendInputSchema.parse(rawInput)
  if (input.players.length === 0) return { suggestions: [] }

  const client = getAnthropicClient()
  const message = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 8000,
    system: SYSTEM,
    messages: [{ role: 'user', content: buildUserPrompt(input) }],
  })

  const parsed = parseJsonResponse(extractText(message.content))
  return playerTrendResultSchema.parse(parsed)
}
