export function resolvePersistedGcGameId(
  existingGcGameId: string | null,
  generatedGcGameId: string,
): { gcGameId: string; reused: boolean } {
  if (existingGcGameId) {
    return { gcGameId: existingGcGameId, reused: true }
  }

  return { gcGameId: generatedGcGameId, reused: false }
}
