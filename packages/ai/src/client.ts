import Anthropic from '@anthropic-ai/sdk'

/** The Claude model used for all Rally-OS AI features. */
export const AI_MODEL = 'claude-sonnet-4-6'

let cached: Anthropic | null = null

/**
 * Lazily construct the Anthropic client from ANTHROPIC_API_KEY. Throwing here
 * (rather than at module load) keeps the package importable in environments
 * without a key (build, tests) — the error only surfaces when a feature runs.
 */
export function getAnthropicClient(): Anthropic {
  if (cached) return cached
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set — required for Rally-OS AI features.')
  }
  cached = new Anthropic({ apiKey })
  return cached
}

/** Concatenate the text blocks of a Claude message into a single string. */
export function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
}

/**
 * Claude is instructed to return JSON only, but defensively strip Markdown
 * fences before parsing in case it wraps the object in a ```json block.
 */
export function parseJsonResponse(text: string): unknown {
  const trimmed = text.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
  const body = fenced?.[1] ?? trimmed
  return JSON.parse(body)
}
