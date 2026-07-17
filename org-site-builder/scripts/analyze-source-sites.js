#!/usr/bin/env node
/* ============================================================
   analyze-source-sites.js
   A small, dependency-free helper that documents the design
   patterns this template was distilled from, and can OPTIONALLY
   re-inspect any reference site(s) you point it at to confirm the
   structural conventions still hold (sections, nav, hero, theme).

   This template ships pattern-complete, so you do NOT need to run
   this to launch a site. It exists for transparency and for anyone
   who wants to extend the template by studying more reference sites.

   Usage:
     node scripts/analyze-source-sites.js                # print the captured pattern report
     node scripts/analyze-source-sites.js ./path/to/site # inspect a local static site folder
   ============================================================ */
const fs = require('fs');
const path = require('path');

const REPORT = `
SOFTBALL ORG SITE — DISTILLED DESIGN PATTERNS
=============================================
Reference inputs: two GitHub Pages select-softball org sites (a
multi-page, CSS-variable "skin" build and a single-file data-theme
build with a light/dark toggle).

Shared conventions turned into this template:
  • Identity via CSS custom properties — re-skin the whole site by
    swapping color tokens, never by editing component markup.
  • A bold display typeface for headings + a clean body typeface.
  • Hero = kicker/badge + oversized uppercase title + subtitle +
    tagline + dual CTA (primary "join", secondary "learn more").
  • A recruiting strip directly under the hero (season, recruiting,
    coaches, sponsors).
  • Section rhythm: small label, big uppercase title, accent rule,
    subtitle, then a responsive card grid.
  • Card library: pillars, coach cards, GameChanger-style roster
    cards (jersey number + graceful photo fallback), doc/nav cards.
  • Roster privacy-by-default: player profile links stay inert until
    a player is flagged live (signed media release on file).
  • Sponsor + gallery + tryout/QR + contact sections.
  • Footer with brand wordmark, quick links, and credentials line.
  • Deploys as a static GitHub Pages site (no backend).

Light/dark system (from the single-file reference):
  • data-theme on <html>, full token vocabulary for both modes.
  • Toggle persists to localStorage, defaults to system preference,
    accessible (aria-pressed + dynamic label), no layout shift.

What was deliberately NOT copied:
  • No team names, logos, colors, rosters, or copy from either
    source. Those are reference structure only; all identity comes
    from org.config.json + theme.tokens.json.
`;

function inspectSite(dir) {
  const indexes = ['index.html'].map((f) => path.join(dir, f)).filter((p) => fs.existsSync(p));
  if (!indexes.length) { console.error(`No index.html found in ${dir}`); process.exit(1); }
  const html = fs.readFileSync(indexes[0], 'utf8');
  const find = (re) => (html.match(re) || []).length;
  console.log(`\nInspecting: ${indexes[0]}`);
  console.log('  data-theme present : ' + /data-theme/.test(html));
  console.log('  localStorage toggle: ' + /localStorage/.test(html));
  console.log('  CSS variables (:root --): ' + /--[a-z-]+\s*:/.test(html));
  console.log('  <section> blocks   : ' + find(/<section/gi));
  console.log('  nav present        : ' + /<nav/i.test(html));
  console.log('  hero class         : ' + /class=["'][^"']*hero/i.test(html));
  console.log('  Google Fonts       : ' + /fonts\.googleapis\.com/.test(html));
}

const target = process.argv[2];
if (target) inspectSite(target);
else console.log(REPORT);
