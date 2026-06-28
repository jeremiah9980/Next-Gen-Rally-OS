import { describe, expect, it } from 'vitest'
import { resolvePersistedGcGameId } from '../schedule-push'

describe('resolvePersistedGcGameId', () => {
  it('preserves existing gcGameId for repeated push attempts', () => {
    const result = resolvePersistedGcGameId('gc-existing-1', 'gc-generated-2')
    expect(result).toEqual({ gcGameId: 'gc-existing-1', reused: true })
  })

  it('uses generated gcGameId for first-time push', () => {
    const result = resolvePersistedGcGameId(null, 'gc-generated-2')
    expect(result).toEqual({ gcGameId: 'gc-generated-2', reused: false })
  })
})
