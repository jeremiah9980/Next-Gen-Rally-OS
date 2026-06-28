export const SCHEDULE_GAME_STATUSES = [
  'ncs_detected',
  'draft_created',
  'pending_coach_approval',
  'approved',
  'pushed_to_gamechanger',
  'rejected',
] as const

export type ScheduleGameStatus = (typeof SCHEDULE_GAME_STATUSES)[number]

const VALID_TRANSITIONS: Record<ScheduleGameStatus, ScheduleGameStatus[]> = {
  ncs_detected: ['draft_created'],
  draft_created: ['pending_coach_approval'],
  pending_coach_approval: ['approved', 'rejected'],
  approved: ['pushed_to_gamechanger'],
  pushed_to_gamechanger: [],
  rejected: [],
}

export function canTransitionScheduleGame(
  from: ScheduleGameStatus,
  to: ScheduleGameStatus,
): boolean {
  return VALID_TRANSITIONS[from].includes(to)
}

export function transitionScheduleGame(
  from: ScheduleGameStatus,
  to: ScheduleGameStatus,
): ScheduleGameStatus {
  if (!canTransitionScheduleGame(from, to)) {
    throw new Error(`Invalid schedule transition: ${from} -> ${to}`)
  }
  return to
}

export function isPushAllowed(status: ScheduleGameStatus): boolean {
  return status === 'approved'
}

export function ensurePushAllowed(status: ScheduleGameStatus): void {
  if (!isPushAllowed(status)) {
    throw new Error('Schedule game must be approved before push to GameChanger.')
  }
}
