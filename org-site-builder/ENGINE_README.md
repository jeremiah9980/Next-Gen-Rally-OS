# Softball Organization Website Template

A clean, config‑driven, GitHub Pages–ready website for a select / travel softball
organization. Built to look like a serious select program — not a generic school
site — while staying easy enough for a coach or team parent to maintain.

Edit **two JSON files**, drop in **your images**, and deploy. No build step required.

```
your-org-site/
├── index.html                 ← static shell (don't usually edit)
├── src/
│   ├── main.js                ← renders the page from config (don't usually edit)
│   ├── config/
│   │   ├── org.config.json     ← YOUR CONTENT lives here ✏️
│   │   └── theme.tokens.json   ← YOUR COLORS live here ✏️
│   ├── styles/                ← base / components / theme / responsive CSS
│   ├── components/            ← one renderer per section
│   └── utils/                 ← theme toggle + QR helper
├── public/
│   ├── images/                ← YOUR IMAGES go here 🖼️ (see public/images/README.md)
│   ├── qr/                    ← signup QR code
│   └── documents/            ← PDFs, waivers, packets
├── scripts/                  ← helper tools (new‑org, theme, validate)
├── examples/                 ← reference copies of the config files
├── LAUNCH.md                 ← step‑by‑step deploy guide ⭐ start here
├── BRANDING.md               ← how to build your identity
└── CONFIGURATION.md          ← every config field explained
```

## Quick start

```bash
# 1. Preview locally (any static server works; this needs no install)
npx serve .
#    → open the printed http://localhost:3000 URL

# 2. Make it yours — fastest path:
node scripts/create-new-org.js --name "CTX Elite Softball" --nickname "CTX Elite" \
  --ageGroup 12U --location "Georgetown, TX" --preset dark-sports \
  --coach "Coach Smith" --email coach@ctxelite.com --tone showcase

# 3. Check everything before you ship
node scripts/validate-config.js
```

Then edit `src/config/org.config.json` for the rest of your content, add your images
under `public/images/`, and follow **LAUNCH.md** to put it on GitHub Pages.

> **Why a local server?** The page loads its content with `fetch()` and JS modules,
> which browsers block on `file://`. `npx serve .` (or any static host, including
> GitHub Pages) serves over `http`, so it works there. You cannot just double‑click
> `index.html`.

## What you get

- **Light + dark mode** with a visible, accessible toggle that remembers the visitor's
  choice and respects their system preference. No flash on load, no layout shift.
- **Config‑driven content** — name, tagline, coaches, roster, tryouts, schedule,
  sponsors, gallery, and contact all come from one JSON file.
- **9 branding presets** (aggressive‑elite, dark‑sports, college‑showcase, and more) —
  switch your whole color identity with one command.
- **GameChanger‑style roster** with per‑player profile gating (a player's profile page
  only links once you mark them `live`, e.g. after a signed media release).
- **Tryout / recruiting section** with signup button and auto‑generated QR code.
- **Mobile‑first, accessible, semantic HTML** that works on phones, tablets, and desktop.

## Editing checklist

1. `src/config/org.config.json` → your text content (see **CONFIGURATION.md**).
2. `src/config/theme.tokens.json` → your colors (see **BRANDING.md**, or run
   `node scripts/generate-theme.js --preset <name>`).
3. `public/images/…` → your logo, hero, coaches, players, sponsors (see
   `public/images/README.md`).
4. `node scripts/validate-config.js` → fix any ✖ errors and review ⚠ warnings.
5. **LAUNCH.md** → deploy.

## Helper scripts

| Command | What it does |
| --- | --- |
| `node scripts/create-new-org.js` | Scaffold a fresh `org.config.json` (flags or interactive). |
| `node scripts/generate-theme.js --list` | List the 9 branding presets. |
| `node scripts/generate-theme.js --preset <name>` | Write `theme.tokens.json` from a preset. |
| `node scripts/validate-config.js` | Check required fields, image paths, and color contrast. |
| `node scripts/analyze-source-sites.js` | Print the design patterns this template is built on. |

No dependencies are required to run the site or the scripts — just Node.js for the
helpers and any static file server (like `npx serve`) to preview.
