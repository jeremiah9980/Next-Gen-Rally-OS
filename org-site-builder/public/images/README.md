# Image Upload Guide

Drop your images into the folders here, then point to them from
`src/config/org.config.json`. Paths in the config start with `/images/...`
(the leading slash is resolved against this `public/` folder automatically).

## Where each image goes

| Folder              | Use                          | Config field                        |
|---------------------|------------------------------|-------------------------------------|
| `logos/`            | Org logo + favicon           | `branding.logo`, `branding.favicon` |
| `hero/`             | Big hero background photo     | `branding.heroImage`               |
| `coaches/`          | One photo per coach           | `coaches[].photo`                   |
| `players/`          | One photo per player          | `roster.players[].photo`            |
| `gallery/`          | Season photos                 | `gallery.items[].image`             |
| `sponsors/`         | Sponsor logos                 | `sponsors.items[].logo`             |
| `backgrounds/`      | Optional section backgrounds  | (reference from custom CSS)         |

(`/qr/` and `/documents/` live one level up in `public/`.)

## Recommended sizes

| Image          | Size (px)        | Format        | Notes                                   |
|----------------|------------------|---------------|-----------------------------------------|
| Logo           | 512 x 512        | PNG (transparent) | Square; shows in nav + hero          |
| Favicon        | 512 x 512        | PNG           | Can reuse the logo                      |
| Hero           | 1920 x 1080      | JPG/WebP      | Sits behind the title at ~28% opacity   |
| Coach photo    | 800 x 800        | JPG/WebP      | Square; head-and-shoulders crop         |
| Player photo   | 900 x 1200 (3:4) | JPG/WebP      | Vertical; matches the roster card       |
| Gallery photo  | 1200 x 900 (4:3) | JPG/WebP      | Landscape                               |
| Sponsor logo   | 600 x 240        | PNG (transparent) | Logos sit on cards, max height 70px |

## Naming conventions

- Lowercase, hyphenated, no spaces: `head-coach.jpg`, `addison-s.jpg`, `acme-title.png`.
- Players: `firstname-lastinitial.jpg` (e.g. `kassidy-c.jpg`) to match the roster.
- Keep names stable — if you rename a file, update the path in the config.

## How to replace key images

- **Logo:** save your square logo as `logos/logo.png` (or update `branding.logo`).
- **Hero:** save your action shot as `hero/hero.jpg` (or update `branding.heroImage`).
- **Coach:** add `coaches/coach-name.jpg`, set it on the matching `coaches[].photo`.
- **Player:** add `players/first-l.jpg`, set it on the matching `roster.players[].photo`.
- **Sponsor:** add `sponsors/name.png`, set it on the matching `sponsors.items[].logo`.

Missing an image? The site degrades gracefully — coaches show initials,
players show their jersey number, sponsors/gallery items hide themselves —
so you can launch first and add photos over time.

## Optimize before uploading

- Resize to roughly the dimensions above (don't upload 6000px phone photos).
- Compress with TinyPNG (https://tinypng.com) or Squoosh (https://squoosh.app).
- Prefer WebP for photos and PNG (transparent) for logos.
- Aim for under ~300 KB per photo so the site loads fast on phones.

## Accessibility

Every image config field has a matching `*Alt` field (e.g. `heroImageAlt`,
`logoAlt`, player `photoAlt`). Fill these in with a short description — it
is read by screen readers and shown if an image fails to load. Avoid putting
important words *inside* an image; keep text as real HTML so it scales and
stays readable.
