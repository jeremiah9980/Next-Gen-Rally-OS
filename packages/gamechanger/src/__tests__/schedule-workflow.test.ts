import { describe, expect, it } from 'vitest'
import {
  canTransitionScheduleGame,
  ensurePushAllowed,
  transitionScheduleGame,
} from '../schedule-workflow'

describe('schedule workflow state machine', () => {
  it('supports required happy-path transitions', () => {
    expect(canTransitionScheduleGame('ncs_detected', 'draft_created')).toBe(true)
    expect(canTransitionScheduleGame('draft_created', 'pending_coach_approval')).toBe(true)
    expect(canTransitionScheduleGame('pending_coach_approval', 'approved')).toBe(true)
    expect(canTransitionScheduleGame('approved', 'pushed_to_gamechanger')).toBe(true)
  })

  it('supports rejection from pending approval', () => {
    expect(canTransitionScheduleGame('pending_coach_approval', 'rejected')).toBe(true)
  })

  it('rejects invalid transitions', () => {
    expect(canTransitionScheduleGame('ncs_detected', 'approved')).toBe(false)
    expect(() => transitionScheduleGame('approved', 'rejected')).toThrow(
      'Invalid schedule transition: approved -> rejected',
    )
  })

  it('gates push to approved status only', () => {
    expect(() => ensurePushAllowed('pending_coach_approval')).toThrow(
      'Schedule game must be approved before push to GameChanger.',
    )
    expect(() => ensurePushAllowed('approved')).not.toThrow()
  })
})
