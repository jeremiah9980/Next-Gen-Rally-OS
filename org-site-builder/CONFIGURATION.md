# CONFIGURATION.md — Every field explained

You edit two files. This document explains every field in both.

- `src/config/org.config.json` — all text content and which images to show.
- `src/config/theme.tokens.json` — all colors, fonts, and scales.

After editing, always run `node scripts/validate-config.js`.

> **Image paths:** write them starting with `/images/...`, `/qr/...`, or
> `/documents/...`. The site maps those to the `public/` folder automatically. You can
> also use a full `https://...` URL. Every image has a matching `*Alt` field — fill it
> in for accessibility.
>
> **Hiding a section:** most sections have an `"enabled": true|false` flag. Set it to
> `false` to drop the section (and its nav link) entirely.

---

## org.config.json

### `organization`
| Field | Type | Description |
| --- | --- | --- |
| `name` | string | Full org name. Used in the title bar and throughout. |
| `nickname` | string | Short name. Also used as the `localStorage` key prefix for the theme toggle. |
| `ageGroup` | string | e.g. `10U`, `12U`, `Select`, `Elite`. |
| `season` | string | e.g. `2025 Season`. |
| `tagline` | string | One short line shown in branding spots. |
| `location` | string | City, State. |
| `circuits` | string[] | Circuits you play, e.g. `["USSSA","NSA","NCS"]`. |

### `branding`
| Field | Type | Description |
| --- | --- | --- |
| `logo` | path | Header logo. |
| `logoAlt` | string | Alt text for the logo. |
| `favicon` | path | Browser tab icon (the logo works fine). |
| `heroImage` | path | Large hero/banner image. Leave blank to use the themed gradient only. |
| `heroImageAlt` | string | Alt text for the hero image. |
| `preset` | string | Records which preset you started from. Changing it here does **not** recolor the site — edit `theme.tokens.json` or run `generate-theme.js`. |

### `nav`
| Field | Type | Description |
| --- | --- | --- |
| `ctaLabel` | string | Text of the nav's call‑to‑action button. |
| `ctaHref` | string | Where it points (usually `#tryouts`). |
| `links[]` | `{label, href}` | Nav items. Links to in‑page sections (`#about`) or external URLs. Remove a link to hide it from the nav. |

### `hero`
| Field | Type | Description |
| --- | --- | --- |
| `kicker` | string | Small line above the title (e.g. location • age group • season). |
| `title` | string | Big headline — usually the org name. |
| `subtitle` | string | One supporting line. |
| `primaryCta` | `{label, href}` | Dominant button. |
| `secondaryCta` | `{label, href}` | Secondary button. |

### `recruitingStrip`
| Field | Type | Description |
| --- | --- | --- |
| `enabled` | bool | Show the slim band under the hero. |
| `items` | string[] | Short callouts (e.g. `"Now Recruiting Players"`). |

### `about`
| Field | Type | Description |
| --- | --- | --- |
| `enabled` | bool | Show the About section. |
| `heading` | string | Section heading. |
| `subtitle` | string | Supporting line under the heading. |
| `body` | string[] | One or more paragraphs. |
| `pillars[]` | `{icon, title, text}` | 3 short value props. `icon` is an emoji or short glyph. |

### `coaches[]`
Array of coach cards. Empty array hides the section.
| Field | Type | Description |
| --- | --- | --- |
| `name` | string | Coach name. |
| `role` | string | e.g. `Head Coach`, `Hitting Coach`. |
| `photo` | path | Headshot. If missing, the card shows the coach's initials. |
| `photoAlt` | string | Alt text. |
| `bio` | string | Short bio. |

### `roster`
| Field | Type | Description |
| --- | --- | --- |
| `enabled` | bool | Show the roster. |
| `format` | string | `gamechanger` renders first name + last initial + jersey. |
| `note` | string | Explanatory note shown near the roster (e.g. the media‑release policy). |
| `players[]` | object | See below. |

**`roster.players[]`**
| Field | Type | Description |
| --- | --- | --- |
| `firstName` | string | First name. |
| `lastInitial` | string | Last initial only (privacy‑friendly). |
| `number` | string | Jersey number. |
| `positions` | string[] | e.g. `["SS","2B"]`. |
| `photo` | path | Player photo; falls back to jersey number if missing. |
| `photoAlt` | string | Alt text. |
| `live` | bool | When `false`, the profile link is hidden. Set `true` only after a signed media release is on file. |
| `profileUrl` | string | The player's profile page/URL; only linked when `live` is `true`. |

### `tryouts`
| Field | Type | Description |
| --- | --- | --- |
| `enabled` | bool | Show the tryouts section. |
| `heading` | string | Section heading. |
| `dates` | string[] | One or more dates. |
| `time` | string | e.g. `6:00 PM - 8:00 PM`. |
| `location` | string | Field/address. |
| `details` | string | What to bring, check‑in notes, etc. |
| `signupUrl` | string | Registration form link (the QR code encodes this). |
| `signupLabel` | string | Button text. |
| `qrCode` | path | Optional QR image. If blank, one is generated from `signupUrl`. |

### `schedule`
| Field | Type | Description |
| --- | --- | --- |
| `enabled` | bool | Show the schedule. |
| `heading` / `subtitle` | string | Section text. |
| `events[]` | `{date, name, location, type}` | One row per event. `type` is a small label (Tryout, Tournament, Practice…). |

### `sponsors`
| Field | Type | Description |
| --- | --- | --- |
| `enabled` | bool | Show sponsors. |
| `heading` / `subtitle` | string | Section text. |
| `ctaLabel` / `ctaHref` | string | "Become a Sponsor" button. |
| `items[]` | `{name, logo, url, tier}` | Sponsor logo (falls back to the name), link, and optional tier label. |

### `gallery`
| Field | Type | Description |
| --- | --- | --- |
| `enabled` | bool | Show the gallery. |
| `heading` / `subtitle` | string | Section text. |
| `items[]` | `{image, alt, caption}` | Photos. Keep alt text meaningful; caption optional. |

### `contact`
| Field | Type | Description |
| --- | --- | --- |
| `enabled` | bool | Show contact. |
| `heading` / `subtitle` | string | Section text. |
| `coachName` | string | Primary contact. |
| `phone` | string | Phone (rendered as a `tel:` link). |
| `email` | string | Email (rendered as a `mailto:` link). |
| `social[]` | `{platform, url}` | Social links (Instagram, Facebook, X, TikTok, YouTube…). |

### `footer`
| Field | Type | Description |
| --- | --- | --- |
| `tagline` | string | Footer line, often location • age group • circuits • year. |
| `credit` | string | Optional credit line. Leave blank to omit. |

---

## theme.tokens.json

```jsonc
{
  "preset": "blue-yellow-energy",   // which preset this came from (label only)
  "fonts": { ... },                  // display + body fonts and the Google Fonts URL
  "scales": { "radius": {…}, "shadow": {…}, "type": {…} },
  "light": { …color tokens… },       // colors used in light mode
  "dark":  { …color tokens… }        // colors used in dark mode
}
```

### `fonts`
| Field | Description |
| --- | --- |
| `display` | Headline font stack (e.g. `'Barlow Condensed', sans-serif`). |
| `body` | Body font stack. |
| `googleFontsHref` | The `<link>` URL that loads those fonts. Update it if you change fonts. |

### `scales`
- `radius.{sm,md,lg,pill}` — corner rounding.
- `shadow.{sm,md,lg}` — elevation.
- `type.{kicker,small,body,h3,h2,h1}` — font sizes. `h1`/`h2` use `clamp()` to scale
  fluidly with the viewport.

### Color tokens (set in **both** `light` and `dark`)
| Token | Used for |
| --- | --- |
| `primary` | Main brand color — primary buttons, key accents. |
| `primaryStrong` | Hover/pressed/darker variant of primary. |
| `secondary` | Second brand color — highlights, jersey numbers, accents. |
| `secondaryStrong` | Darker variant of secondary. |
| `accent` | Tertiary accent (often white). |
| `text` | Body text color. |
| `textMuted` | Secondary/subtle text. |
| `pageBg` | Page background. |
| `sectionSoft` | Subtle tinted background for alternating sections. |
| `card` | Card/surface background. |
| `border` | Hairline borders and dividers. |
| `navBg` | Navbar background (usually semi‑transparent). |
| `footerBg` | Footer background. |
| `footerText` | Footer text. |
| `heroBg` | Hero background — a solid color or a `linear-gradient(...)`. |
| `heroText` | Hero text color. |
| `heroAccent` | Accent inside the hero (kicker, underline). |
| `glow` | Soft glow/halo behind hero/feature elements. |
| `onPrimary` | Text/icon color on top of `primary` (pick for contrast). |
| `onSecondary` | Text/icon color on top of `secondary` (pick for contrast). |

**Contrast targets the validator checks (WCAG AA, 4.5:1), in both modes:**
`text` on `pageBg`, `text` on `card`, `onPrimary` on `primary`, `onSecondary` on
`secondary`. If any fall short you'll get a ⚠ — adjust the token or re‑run a preset.

### Regenerating instead of hand‑editing
```bash
node scripts/generate-theme.js --preset college-showcase
node scripts/generate-theme.js --preset clean-modern --primary "#0C2340" --secondary "#C8102E"
```
This rewrites `theme.tokens.json` (light + dark) with contrast‑aware surfaces derived
from your identity colors.

---

## Validation reference

`node scripts/validate-config.js` reports:
- **✖ errors** — missing required fields or malformed config. Fix before deploying.
- **⚠ warnings** — leftover placeholders (`Example`, `example.com`, `000-0000`), images
  not found on disk under `public/`, or contrast below 4.5:1.

A clean run (no errors) means the site will render; clearing the warnings means it's
truly ready to launch.
