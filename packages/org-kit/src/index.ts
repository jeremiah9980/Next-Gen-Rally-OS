import type { SiteConfig } from '@rally/config'

export interface OrgKitPalette {
  primary: string
  accent: string
  background: string
  text: string
}

export interface OrgKitSocialTemplate {
  platform: string
  text: string
}

export interface OrgKit {
  palette: OrgKitPalette
  svgLogo: string
  initials: string
  socialTemplates: OrgKitSocialTemplate[]
  setupChecklist: string[]
}

/** Deterministic hue 0–360 from an arbitrary string. */
function stringToHue(s: string): number {
  let h = 0
  for (const ch of s) h = ((h << 5) - h + ch.charCodeAt(0)) | 0
  return Math.abs(h) % 360
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100
  const ln = l / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = ln - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  const hex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`
}

function teamInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0]![0]! + words[1]![0]!).toUpperCase()
  return (words[0] ?? 'T').slice(0, 2).toUpperCase()
}

/** Escape XML/HTML special characters to prevent injection in SVG markup. */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Generate a starter branding kit from a SiteConfig. Pure, synchronous, no side effects. */
export function generateOrgKit(config: SiteConfig): OrgKit {
  const hue = stringToHue(config.organization.slug)
  const accentHue = (hue + 150) % 360

  const palette: OrgKitPalette = {
    primary: hslToHex(hue, 70, 45),
    accent: hslToHex(accentHue, 65, 55),
    background: hslToHex(hue, 20, 8),
    text: hslToHex(hue, 5, 95),
  }

  const initials = teamInitials(config.team.name)
  const fontSize = initials.length === 1 ? 42 : 34

  const svgLogo = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="120" height="120">`,
    `  <circle cx="50" cy="50" r="47" fill="${palette.primary}" stroke="${palette.accent}" stroke-width="4"/>`,
    `  <text x="50" y="50" text-anchor="middle" dominant-baseline="central"`,
    `    font-family="system-ui,sans-serif" font-size="${fontSize}" font-weight="800"`,
    `    letter-spacing="1" fill="${palette.text}">${escapeXml(initials)}</text>`,
    `</svg>`,
  ].join('\n')

  const { name: orgName } = config.organization
  const { name: teamName, age_group, season } = config.team
  const { domain } = config.publish
  const tag = age_group.replace(/\W/g, '')

  const socialTemplates: OrgKitSocialTemplate[] = [
    {
      platform: 'Announcement',
      text: `Introducing ${teamName} — ${age_group} for ${season}! 🏆\n\nWe're excited to compete this season. Follow our journey at ${domain}\n\n#YouthSoftball #${tag}`,
    },
    {
      platform: 'Season Kickoff',
      text: `The ${teamName} ${season} season is officially here! 🥎\n\nOur ${age_group} crew is locked in and ready to compete.\n\nFull schedule & roster → ${domain}`,
    },
    {
      platform: 'Recruiting',
      text: `${orgName} is building our ${age_group} roster for ${season}.\n\nInterested in trying out? Learn more at ${domain} and reach out to our coaching staff.`,
    },
    {
      platform: 'Game Day',
      text: `Game day for ${teamName}! 🏅 Come cheer on our ${age_group} team.\n\nFull schedule at ${domain} #${tag} #GameDay`,
    },
  ]

  const slug = config.organization.slug

  const setupChecklist = [
    'Go to vercel.com → Add New Project → import your Next-Gen-Rally-OS repo',
    'Set Root Directory:  apps/public-site',
    'Build command:  pnpm db:generate && pnpm --filter @rally/public-site build',
    'Add environment variables:',
    `  DATABASE_URL        — same connection string as your rally-os deployment`,
    `  PUBLIC_SITE_ORG_SLUG=${slug}`,
    `Set custom domain:  ${domain}`,
    'Deploy — your public team site is live!',
    'Re-deploy any time you approve NCS roster changes or update team info in Rally-OS.',
  ]

  return { palette, svgLogo, initials, socialTemplates, setupChecklist }
}
