import { describe, expect, it } from 'vitest'
import { parseNcsRosterText } from '../parse-roster'

describe('parseNcsRosterText', () => {
  it('parses tab-delimited roster with header', () => {
    const text = `ID	Name	Jersey	Position
123	John Smith	7	SS
456	Jane Doe	12	P`
    const rows = parseNcsRosterText(text)

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      ncsId: '123',
      rawName: 'John Smith',
      jersey: '7',
      position: 'SS',
    })
    expect(rows[1]).toMatchObject({ ncsId: '456', rawName: 'Jane Doe', jersey: '12' })
  })

  it('parses comma-delimited roster with header', () => {
    const text = `Name,Jersey
John Smith,7
Jane Doe,12`
    const rows = parseNcsRosterText(text)

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ rawName: 'John Smith', jersey: '7' })
    expect(rows[0]?.ncsId).toBeUndefined()
  })

  it('falls back to positional parsing without header (jersey first)', () => {
    const text = `7  John Smith
12  Jane Doe`
    const rows = parseNcsRosterText(text)

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ jersey: '7', rawName: 'John Smith' })
  })

  it('falls back to positional parsing without header (name only)', () => {
    const text = `John Smith
Jane Doe`
    const rows = parseNcsRosterText(text)

    expect(rows).toHaveLength(2)
    expect(rows[0]?.rawName).toBe('John Smith')
  })

  it('returns empty array for empty input', () => {
    expect(parseNcsRosterText('')).toHaveLength(0)
    expect(parseNcsRosterText('   ')).toHaveLength(0)
  })

  it('normalizes names to lowercase stripped form', () => {
    const text = `Name
John O'Brien Jr.`
    const rows = parseNcsRosterText(text)

    expect(rows[0]?.normalizedName).toBe('john obrien jr')
  })
})
