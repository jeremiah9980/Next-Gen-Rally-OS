# BRANDING.md — Build your org's identity

This template's design system was distilled from two real select‑softball sites. This
doc explains what was learned, the patterns worth keeping, and how to make your own
identity **without copying any existing org**.

---

## What we learned from the reference sites

### Site A — multi‑file, skin‑driven structure
A shared base stylesheet defined the layout and components once, and each team got a
small "skin" file that only overrode a few color variables on a body class. Navigation
was injected by a small script so it stayed identical across pages (don't‑repeat‑
yourself). Takeaways worth keeping:

- **One base, many skins.** Structure is shared; identity is a thin color layer on top.
- **Condensed display type + clean body type.** Tall, tight uppercase headlines read as
  "athletic" without shouting.
- **A recruiting strip** — a slim band under the hero with rotating callouts
  ("Now Recruiting", "2025 Season") — signals an active, serious program.
- **GameChanger‑style roster cards** — jersey number badge, photo with a graceful
  fallback, first name + last initial, position, and a stat row — feel native to
  softball families.
- **Privacy gating on player profiles** — individual profile links stay off until a
  signed media release is on file. This is a feature, not a limitation.

### Site B — single‑file, full token system
A newer single‑page build carried a complete light/dark **design‑token** system on the
`<html data-theme>` attribute, with an accessible toggle that persisted to
`localStorage` and defaulted to the visitor's system preference. Takeaways worth keeping:

- **Tokens, not hard‑coded colors.** Every color is a named variable (`--color-primary`,
  `--page-bg`, `--card`, …) with a light value and a dark value.
- **Aggressive sports type pairing** (a poster‑style display face + a neutral body face)
  for a bolder, more "elite" tone.
- **A real dark mode**, not an inverted afterthought — dark surfaces are tuned
  separately so contrast stays correct.

### What this template deliberately did **not** copy
No team names, logos, photos, colors, copy, or coach/player data from either site. Only
the **structure, component patterns, and theming approach** were reused. Your site
starts from neutral "Example Softball" placeholders.

---

## The design system you're inheriting

- **Color tokens** for light and dark: `primary`, `primaryStrong`, `secondary`,
  `secondaryStrong`, `accent`, `text`, `textMuted`, `pageBg`, `sectionSoft`, `card`,
  `border`, `navBg`, `footerBg`, `footerText`, `heroBg`, `heroText`, `heroAccent`,
  `glow`, `onPrimary`, `onSecondary`.
- **Type scale** from a small kicker up to a fluid `clamp()` hero headline.
- **Radius scale** (sm/md/lg/pill) and **shadow scale** (sm/md/lg).
- **Components:** navbar, hero, recruiting strip, about/pillars, coaches, roster,
  tryouts (+QR), schedule, sponsors, gallery, contact, footer.
- **Image treatment rules:** rounded cards, soft shadow, `object-fit: cover`, and an
  automatic initials/letter fallback when a photo is missing — so a half‑finished
  roster never looks broken.

Full token and component reference is in **CONFIGURATION.md**.

---

## Recommended layout system

A select‑softball homepage that converts parents tends to flow like this — the order
this template ships in:

1. **Hero** — org name, age group + season kicker, one‑line value proposition, and a
   single dominant call to action (Join / Tryouts).
2. **Recruiting strip** — proof the program is active right now.
3. **About / pillars** — three short pillars (coaching, structure, competition).
4. **Coaches** — faces and short bios build trust faster than paragraphs.
5. **Roster** — GameChanger‑style, profiles gated by media release.
6. **Tryouts** — dates, what to bring, signup button + QR.
7. **Schedule** — upcoming tournaments signal seriousness.
8. **Sponsors** — community partners + a "become a sponsor" path.
9. **Gallery** — a few strong photos, not fifty.
10. **Contact** — coach, phone, email, socials.

Keep one primary CTA above the fold. Repeat it in the nav and again at tryouts/contact.

---

## Branding rules of thumb

- **Two identity colors + one neutral.** A primary, a secondary, and white/near‑black.
  Resist a third loud color.
- **Carry color through the hero, buttons, links, and footer** — not random accents.
- **Light text on dark, dark text on light.** Always meet 4.5:1 contrast for body text.
- **Display type for headlines only.** Keep body copy in a neutral, legible face.
- **Photos do the emotional work; type does the identity work.** Avoid baking text into
  images — it breaks on mobile and hurts accessibility.

---

## How to choose your palette

1. Start from your uniform/helmet colors — that's the identity parents already recognize.
2. Pick the **darker, more saturated** of your two colors as `primary` (buttons, footer).
3. Use the brighter one as `secondary` (accents, highlights, jersey numbers).
4. For **light mode**: near‑white `pageBg`, white `card`, near‑black `text`.
5. For **dark mode**: very dark `pageBg`, slightly lighter translucent `card`, near‑white
   `text`; brighten `primary`/`secondary` a notch so they don't muddy on black.
6. Set `onPrimary`/`onSecondary` to whichever of black/white reads best on those buttons.
7. Run `node scripts/validate-config.js` to confirm contrast in both modes.

**Fastest path:** pick the closest preset and tweak two colors.
```bash
node scripts/generate-theme.js --preset red-black-battle --primary "#8A1538"
```
Presets, their colors, and when to use each are listed in **CONFIGURATION.md** and via
`node scripts/generate-theme.js --list`.

---

## Make it yours, not theirs

- Use **your** name, mascot, and colors — never another org's logo or photos.
- Write your own tagline. The `--tone` option seeds one (elite, aggressive, family‑first,
  faith‑based, college‑prep, local‑community, showcase, fun/youth‑development); rewrite
  it in your voice.
- Commission or design an original logo. Don't recolor someone else's mark.
- Two programs using this template should still look clearly different — that's the
  whole point of separating structure from identity.
