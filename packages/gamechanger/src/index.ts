// Approval-gated schedule push state machine (ncs_detected → … → pushed_to_gamechanger).
export * from './schedule-workflow'
// gcGameId reconciliation on push.
export * from './schedule-push'
// Read-only box-score snapshot builder.
export * from './gamechanger-stats'

// GameChanger player matching lives in the parser package; re-export it here so
// the full GameChanger surface (map → import → push) is available from one place.
// Matching priority is always gcPlayerId → normalized name → jersey.
export { matchGameChangerPlayer } from '@rally/ncs-parser'
export type {
  GameChangerPlayerRow,
  LocalGameChangerPlayer,
  GameChangerMatchResult,
} from '@rally/ncs-parser'
