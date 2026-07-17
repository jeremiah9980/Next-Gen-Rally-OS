import { describe, it, expect } from 'vitest'
import { parseTeamSearchResults, parseSeasons, parseRoster } from '../scrape.js'

// ─── parseTeamSearchResults ────────────────────────────────────────────────────

describe('parseTeamSearchResults', () => {
  const html = `
    <table>
      <tr><th>Team</th><th>Division</th><th>Location</th><th>Record</th></tr>
      <tr>
        <td><a href="/fastpitch/Teams/Details/73839/some-team-slug">Lightning Bolts</a></td>
        <td>12U C</td>
        <td>Leander, TX</td>
        <td>36-26-1</td>
      </tr>
      <tr>
        <td><a href="/fastpitch/Teams/Details/55012/another-team">Riverside Reds</a></td>
        <td>14U A</td>
        <td>Austin, TX</td>
        <td>20-5-0</td>
      </tr>
    </table>
  `

  it('extracts team id, name, division, location and record', () => {
    const results = parseTeamSearchResults(html)
    expect(results).toHaveLength(2)
    expect(results[0]).toMatchObject({
      id: '73839',
      name: 'Lightning Bolts',
      division: '12U C',
      location: 'Leander, TX',
      record: '36-26-1',
    })
  })

  it('builds an absolute url from the relative link', () => {
    const results = parseTeamSearchResults(html)
    expect(results[0].url).toBe('https://www.playncs.com/fastpitch/Teams/Details/73839/some-team-slug')
  })

  it('deduplicates rows with the same team id', () => {
    const dupHtml = html.replace('55012', '73839')
    const results = parseTeamSearchResults(dupHtml)
    expect(results).toHaveLength(1)
  })

  it('returns an empty array when no rows match', () => {
    expect(parseTeamSearchResults('<table><tr><td>No results</td></tr></table>')).toEqual([])
  })
})

// ─── parseSeasons ───────────────────────────────────────────────────────────────

describe('parseSeasons', () => {
  it('extracts season options from the SeasonId select', () => {
    const html = `
      <select id="SeasonId">
        <option value="2026">2026 Spring</option>
        <option value="2025">2025 Fall</option>
      </select>
    `
    const seasons = parseSeasons(html)
    expect(seasons).toEqual([
      { id: '2026', label: '2026 Spring' },
      { id: '2025', label: '2025 Fall' },
    ])
  })

  it('returns an empty array when no select is present', () => {
    expect(parseSeasons('<div>no select here</div>')).toEqual([])
  })
})

// ─── parseRoster ────────────────────────────────────────────────────────────────

describe('parseRoster', () => {
  const html = `
    <h1>Lightning Bolts</h1>
    <h2>12U Division</h2>
    <h3>Leander, TX</h3>
    <table>
      <tr><th>Number</th><th>Player</th></tr>
      <tr><td>12</td><td><a href="/players/1">Alice Smith</a></td></tr>
      <tr><td>7</td><td><a href="/players/2">Bob Jones</a> Guest Player: Yes</td></tr>
    </table>
  `

  it('extracts team name, location and division from headings', () => {
    const result = parseRoster(html)
    expect(result.teamName).toBe('Lightning Bolts')
    expect(result.location).toBe('Leander, TX')
    expect(result.division).toBe('12U Division')
  })

  it('parses players with jersey and name', () => {
    const result = parseRoster(html)
    expect(result.players).toHaveLength(2)
    expect(result.players[0].jerseyNumber).toBe('12')
    expect(result.players[0].fullName).toBe('Alice Smith')
  })

  it('strips the trailing Guest Player annotation from names', () => {
    const result = parseRoster(html)
    expect(result.players[1].fullName).toBe('Bob Jones')
  })

  it('returns an empty player list when no roster table is found', () => {
    const result = parseRoster('<h1>Some Team</h1><table><tr><td>Other</td></tr></table>')
    expect(result.players).toEqual([])
  })
})
