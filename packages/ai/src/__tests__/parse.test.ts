import { describe, expect, it } from 'vitest'
import { parseJsonResponse } from '../client'
import { practicePlanResultSchema, playerTrendResultSchema } from '../types'

describe('parseJsonResponse', () => {
  it('parses a bare JSON object', () => {
    expect(parseJsonResponse('{"a":1}')).toEqual({ a: 1 })
  })

  it('strips ```json fences', () => {
    expect(parseJsonResponse('```json\n{"a":1}\n```')).toEqual({ a: 1 })
  })

  it('strips plain ``` fences', () => {
    expect(parseJsonResponse('```\n{"a":2}\n```')).toEqual({ a: 2 })
  })
})

describe('schemas apply safe defaults', () => {
  it('practice plan fills missing arrays', () => {
    const parsed = practicePlanResultSchema.parse({
      coach: { contingency_plan: 'rain → cages' },
      player: { team_focus: 'bunting' },
      template: { name: 'Tuesday base' },
    })
    expect(parsed.coach.full_schedule).toEqual([])
    expect(parsed.drills).toEqual([])
    expect(parsed.player.team_focus).toBe('bunting')
  })

  it('player-trend defaults to empty suggestions', () => {
    expect(playerTrendResultSchema.parse({}).suggestions).toEqual([])
  })
})
