#!/usr/bin/env node
/**
 * Builds the static documentation site: converts README + docs/*.md into
 * styled HTML pages under docs/html/, alongside the standalone HTML documents
 * (pitch deck, user guide, product suite diagram) pulled in from
 * docs/html-src/, plus a landing-page index hub.
 *
 *   pnpm docs:build
 *
 * The visual design mirrors https://next-gen-team.site/ — same tokens, fonts,
 * background atmosphere, glass nav, glow cards, and dark/light theme toggle.
 *
 * Output is committed so the site works from a git checkout (open
 * docs/html/index.html) or any static host (e.g. the Cloudflare Worker
 * configured in wrangler.jsonc).
 */

import { marked } from 'marked'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'docs', 'html')
mkdirSync(OUT, { recursive: true })

/** Pages generated from markdown: [source, slug, nav title, group, blurb]. */
const MD_PAGES = [
  ['README.md', 'overview', 'Overview & Quickstart', 'Engineering', 'Monorepo overview, quickstart commands, and workspace layout.'],
  ['docs/ARCHITECTURE.md', 'architecture', 'Architecture & Handoff', 'Engineering', 'System architecture, data flow, and engineering handoff notes.'],
  ['docs/ncs-integration.md', 'ncs-integration', 'NCS Integration', 'Engineering', 'Live NCS team search, roster import, and tournament tracking.'],
  ['docs/gamechanger-integration.md', 'gamechanger-integration', 'GameChanger Integration', 'Engineering', 'GameChanger linkage, stat snapshots, and approval-gated schedule push.'],
  ['docs/cms.md', 'cms', 'CMS & Integration Center', 'Engineering', 'JSON-file CMS, admin dashboard, and the NCS/GameChanger integrations Worker.'],
  ['infra/db/README.md', 'database', 'Database Workflows', 'Engineering', 'Prisma schema, migrations, seeding, and database workflows.'],
  ['infra/vercel/README.md', 'deployment', 'Vercel Deployment', 'Engineering', 'Vercel deployment targets and environment configuration.'],
  ['docs/coaching-content-package.md', 'coaching-content', 'Coaching Content Package', 'Coaching', 'The bundled Elite Softball 4-Year Mastermind content package.'],
  ['docs/development-roadmap.md', 'development-roadmap', '4-Year Development Roadmap', 'Coaching', 'Season-by-season player development roadmap for coaches.'],
]

/**
 * Standalone HTML documents pulled in as-is from docs/html-src/ (already
 * self-contained pages): [file, nav title, group, blurb].
 */
const HTML_PAGES = [
  ['pitch-deck.html', 'Pitch Deck', 'Product', 'The NextGen Team Sites pitch deck — product, pricing, and vision.'],
  ['user-guide.html', 'User Guide & Manual', 'Product', 'Complete user guide and manual for every portal page.'],
  ['suite-diagram.html', 'Product Suite Diagram', 'Product', 'Visual map of the product suite and how the pieces connect.'],
]

const GROUPS = ['Product', 'Engineering', 'Coaching']
const GROUP_BLURBS = {
  Product: 'What the suite is, how it looks, and how to use it.',
  Engineering: 'How the platform is built, integrated, and deployed.',
  Coaching: 'Player development content baked into the platform.',
}

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">`

// Design tokens + shared chrome, mirrored from next-gen-team.site.
const css = `
:root{
  --bg:#070B16; --bg-2:#0A0F1E; --card:#111827; --card-2:#151D30;
  --line:rgba(148,163,184,.13); --line-strong:rgba(148,163,184,.24);
  --text:#F1F5F9; --text-2:#94A3B8; --text-3:#64748B;
  --blue:#38BDF8; --blue-deep:#2563EB; --purple:#8B5CF6;
  --gold:#FBBF24; --gold-deep:#D97706; --green:#34D399; --red:#FB7185;
  --glass:rgba(17,24,39,.62); --glass-brd:rgba(148,163,184,.16);
  --shadow-lg:0 24px 70px -18px rgba(2,6,23,.85);
  --shadow-md:0 14px 40px -14px rgba(2,6,23,.7);
  --grad-hero:linear-gradient(120deg,#38BDF8 0%,#8B5CF6 48%,#FBBF24 100%);
  --grad-blue:linear-gradient(135deg,#38BDF8,#2563EB);
  --grad-gold:linear-gradient(135deg,#FBBF24,#D97706);
  --nav-h:72px; --r-lg:22px; --r-md:16px; --r-sm:12px;
  --ease:cubic-bezier(.22,.61,.2,1);
}
html[data-theme="light"]{
  --bg:#F6F8FC; --bg-2:#EDF1F8; --card:#FFFFFF; --card-2:#F3F6FC;
  --line:rgba(15,23,42,.09); --line-strong:rgba(15,23,42,.18);
  --text:#0B1220; --text-2:#44506B; --text-3:#68748F;
  --glass:rgba(255,255,255,.72); --glass-brd:rgba(15,23,42,.1);
  --shadow-lg:0 24px 70px -22px rgba(15,23,42,.28);
  --shadow-md:0 14px 40px -18px rgba(15,23,42,.2);
}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  font-family:'Instrument Sans',sans-serif;background:var(--bg);color:var(--text);
  line-height:1.65;overflow-x:hidden;-webkit-font-smoothing:antialiased;
  transition:background .5s var(--ease),color .5s var(--ease);
}
::selection{background:rgba(139,92,246,.4)}
img{max-width:100%}
a{color:inherit;text-decoration:none}
button{font-family:inherit;cursor:pointer}
h1,h2,h3,.display{font-family:'Bricolage Grotesque',sans-serif;letter-spacing:-.02em}
.mono{font-family:'JetBrains Mono',monospace}
.wrap{max-width:1180px;margin:0 auto;padding:0 24px}

/* ===== background atmosphere ===== */
.atmo{position:fixed;inset:0;z-index:-2;overflow:hidden;pointer-events:none}
.atmo .grid-lines{
  position:absolute;inset:-2px;
  background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);
  background-size:64px 64px;
  mask-image:radial-gradient(ellipse 90% 60% at 50% 0%,#000 0%,transparent 72%);
  -webkit-mask-image:radial-gradient(ellipse 90% 60% at 50% 0%,#000 0%,transparent 72%);
  opacity:.55;
}
.orb{position:absolute;border-radius:50%;filter:blur(90px);opacity:.32;animation:orbFloat 18s ease-in-out infinite alternate;will-change:transform}
.orb.b{width:640px;height:640px;background:radial-gradient(circle,#2563EB,transparent 65%);top:-220px;left:-140px}
.orb.p{width:560px;height:560px;background:radial-gradient(circle,#7C3AED,transparent 65%);top:-120px;right:-160px;animation-delay:-6s}
.orb.g{width:460px;height:460px;background:radial-gradient(circle,#B45309,transparent 65%);top:40vh;left:38%;opacity:.14;animation-delay:-12s}
html[data-theme="light"] .orb{opacity:.18}
html[data-theme="light"] .orb.g{opacity:.1}
@keyframes orbFloat{from{transform:translate(0,0) scale(1)}to{transform:translate(40px,50px) scale(1.08)}}
.noise{position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:.05;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}

/* ===== top nav ===== */
nav.top{position:fixed;top:0;left:0;right:0;height:var(--nav-h);z-index:50;
  background:var(--glass);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
  border-bottom:1px solid var(--glass-brd)}
.nav-in{max-width:1240px;margin:0 auto;height:100%;padding:0 24px;display:flex;align-items:center;gap:26px}
.logo{display:flex;align-items:center;gap:11px;font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:1.08rem;letter-spacing:-.01em}
.logo-mark{width:34px;height:34px;border-radius:10px;background:var(--grad-hero);display:grid;place-items:center;color:#fff;font-weight:800;font-size:.9rem;box-shadow:0 6px 18px -4px rgba(139,92,246,.6);position:relative;overflow:hidden;flex-shrink:0}
.logo-mark::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.5),transparent 55%)}
.logo small{display:block;font-family:'JetBrains Mono',monospace;font-size:.56rem;letter-spacing:.24em;color:var(--text-3);font-weight:500;text-transform:uppercase}
.nav-links{display:flex;gap:4px;margin-left:auto}
.nav-links a{padding:9px 14px;border-radius:10px;font-size:.9rem;color:var(--text-2);font-weight:500;transition:color .25s,background .25s}
.nav-links a:hover{color:var(--text);background:var(--glass)}
.theme-btn{width:40px;height:40px;border-radius:11px;border:1px solid var(--line-strong);background:var(--glass);color:var(--text-2);display:grid;place-items:center;transition:all .3s var(--ease);flex-shrink:0}
.theme-btn:hover{color:var(--text);transform:rotate(18deg) scale(1.06)}
.theme-btn svg{width:17px;height:17px}
html[data-theme="light"] .theme-btn .moon{display:none}
html:not([data-theme="light"]) .theme-btn .sun{display:none}

/* ===== shared ui ===== */
.eyebrow{display:inline-flex;align-items:center;gap:10px;font-family:'JetBrains Mono',monospace;font-size:.72rem;letter-spacing:.22em;text-transform:uppercase;color:var(--text-2);
  border:1px solid var(--line-strong);border-radius:999px;padding:8px 16px;background:var(--glass);backdrop-filter:blur(10px)}
.eyebrow .dot{width:7px;height:7px;border-radius:50%;background:var(--grad-hero);box-shadow:0 0 12px rgba(139,92,246,.9)}
.grad-text{background:var(--grad-hero);-webkit-background-clip:text;background-clip:text;color:transparent}
.sec-head{max-width:760px;margin:0 auto 48px;text-align:center}
.sec-head h2{font-size:clamp(1.7rem,3.6vw,2.5rem);font-weight:700;line-height:1.12;margin:20px 0 14px;border:none;padding:0}
.sec-head p{color:var(--text-2);font-size:1.05rem}
.btn{display:inline-flex;align-items:center;gap:9px;border-radius:14px;padding:15px 28px;font-weight:600;font-size:.98rem;border:1px solid transparent;transition:transform .3s var(--ease),box-shadow .3s var(--ease),background .3s,border-color .3s;position:relative;overflow:hidden}
.btn svg{width:17px;height:17px;transition:transform .3s var(--ease)}
.btn:hover svg{transform:translateX(4px)}
.btn-primary{background:var(--grad-blue);color:#fff;box-shadow:0 10px 30px -8px rgba(37,99,235,.55)}
.btn-primary:hover{transform:translateY(-3px);box-shadow:0 18px 42px -10px rgba(37,99,235,.7)}
.btn-gold{background:var(--grad-gold);color:#1a1103;box-shadow:0 10px 30px -8px rgba(217,119,6,.5)}
.btn-gold:hover{transform:translateY(-3px);box-shadow:0 18px 42px -10px rgba(217,119,6,.65)}
.btn-ghost{background:var(--glass);border-color:var(--glass-brd);color:var(--text);backdrop-filter:blur(10px)}
.btn-ghost:hover{transform:translateY(-3px);border-color:var(--line-strong);box-shadow:var(--shadow-md)}
.glow-card{position:relative;border-radius:var(--r-lg);background:var(--card);border:1px solid var(--line)}
.glow-card::before{
  content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1px;
  background:conic-gradient(from var(--ang,0deg),transparent 0%,rgba(56,189,248,.8) 12%,rgba(139,92,246,.8) 26%,transparent 42%,transparent 100%);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;mask-composite:exclude;
  opacity:0;transition:opacity .5s var(--ease);
  animation:spinAng 4.5s linear infinite;pointer-events:none;
}
.glow-card:hover::before{opacity:1}
@keyframes spinAng{to{--ang:360deg}}
@property --ang{syntax:'<angle>';initial-value:0deg;inherits:false}
.feat-icon{width:48px;height:48px;border-radius:13px;display:grid;place-items:center;font-size:1.3rem;position:relative}
.feat-icon::after{content:"";position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}
.fi-blue{background:linear-gradient(135deg,rgba(56,189,248,.24),rgba(37,99,235,.14))}
.fi-purple{background:linear-gradient(135deg,rgba(139,92,246,.26),rgba(109,40,217,.14))}
.fi-gold{background:linear-gradient(135deg,rgba(251,191,36,.24),rgba(217,119,6,.12))}

/* ===== landing (index) ===== */
.hero{padding:calc(var(--nav-h) + 72px) 0 48px;text-align:center}
.hero h1{font-size:clamp(2.4rem,5.6vw,3.8rem);font-weight:750;line-height:1.08;margin:26px auto 18px;max-width:820px}
.hero p.sub{color:var(--text-2);font-size:1.12rem;max-width:640px;margin:0 auto 32px}
.hero-btns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
section.docs-group{padding:56px 0 8px}
.doc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px}
.doc-card{padding:26px;display:flex;flex-direction:column;gap:14px;transition:transform .45s var(--ease),box-shadow .45s var(--ease);overflow:hidden}
.doc-card:hover{transform:translateY(-7px);box-shadow:var(--shadow-lg)}
.doc-card h3{font-size:1.16rem;font-weight:650}
.doc-card p{color:var(--text-2);font-size:.92rem;flex:1}
.doc-cta{display:inline-flex;align-items:center;gap:7px;font-size:.84rem;font-weight:600;color:var(--blue);transition:gap .3s var(--ease)}
.doc-card:hover .doc-cta{gap:12px}

/* ===== doc pages ===== */
.layout{display:flex;gap:0;max-width:1240px;margin:0 auto;padding-top:var(--nav-h)}
aside.side{width:264px;flex-shrink:0;padding:2rem 1.2rem 2rem 24px;position:sticky;top:var(--nav-h);height:calc(100vh - var(--nav-h));overflow-y:auto}
aside.side .grp{font-family:'JetBrains Mono',monospace;font-size:.62rem;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--text-3);margin:1.4rem 0 .5rem;padding-left:.65rem}
aside.side a.pg{display:block;padding:.45rem .65rem;border-radius:10px;color:var(--text-2);font-size:.88rem;font-weight:500;transition:color .25s,background .25s}
aside.side a.pg:hover{color:var(--text);background:var(--glass)}
aside.side a.pg.active{color:var(--blue);background:rgba(56,189,248,.1);font-weight:600}
main.doc-main{flex:1;min-width:0;padding:2.6rem clamp(1.25rem,4vw,3.5rem) 4rem;border-left:1px solid var(--line)}
.doc{max-width:800px}
.doc h1{font-size:2.1rem;margin-top:0;font-weight:750}
.doc h2{margin-top:2.2em;border-bottom:1px solid var(--line);padding-bottom:.35em;font-size:1.45rem}
.doc h3{margin-top:1.6em;font-size:1.12rem}
.doc h4{margin-top:1.4em}
.doc p,.doc li{color:var(--text-2)}
.doc li{margin:.25em 0}
.doc ul,.doc ol{padding-left:1.4em;margin:.8em 0}
.doc strong{color:var(--text)}
.doc a{color:var(--blue);border-bottom:1px solid rgba(56,189,248,.3);transition:border-color .25s}
.doc a:hover{border-color:var(--blue)}
.doc code{font-family:'JetBrains Mono',monospace;font-size:.84em;background:var(--card);border:1px solid var(--line);border-radius:6px;padding:.1em .35em;color:var(--text)}
.doc pre{background:var(--card);border:1px solid var(--line);border-radius:var(--r-md);padding:1rem 1.2rem;overflow-x:auto;line-height:1.55;margin:1rem 0;box-shadow:var(--shadow-md)}
.doc pre code{background:none;border:none;padding:0;font-size:.8rem;color:var(--text-2)}
.doc table{border-collapse:collapse;width:100%;margin:1rem 0;display:block;overflow-x:auto}
.doc th,.doc td{border:1px solid var(--line);padding:.5rem .75rem;font-size:.88rem;text-align:left;color:var(--text-2)}
.doc th{background:var(--card);font-family:'JetBrains Mono',monospace;font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3)}
.doc blockquote{border-left:3px solid var(--purple);margin:1rem 0;padding:.2rem 1rem;color:var(--text-3);background:color-mix(in srgb,var(--card) 55%,transparent);border-radius:0 var(--r-sm) var(--r-sm) 0}
.doc hr{border:none;border-top:1px solid var(--line);margin:2rem 0}

/* ===== footer ===== */
footer{border-top:1px solid var(--line);padding:44px 0 36px;background:color-mix(in srgb,var(--bg-2) 60%,transparent);margin-top:48px}
.foot-in{display:flex;flex-wrap:wrap;gap:32px;justify-content:space-between;align-items:flex-start}
.foot-brand p{color:var(--text-3);font-size:.86rem;max-width:300px;margin-top:14px}
.foot-cols{display:flex;gap:56px;flex-wrap:wrap}
.foot-col h6{font-family:'JetBrains Mono',monospace;font-size:.62rem;letter-spacing:.2em;text-transform:uppercase;color:var(--text-3);margin-bottom:12px}
.foot-col a{display:block;color:var(--text-2);font-size:.88rem;padding:4px 0;transition:color .25s}
.foot-col a:hover{color:var(--text)}
.foot-base{display:flex;flex-wrap:wrap;gap:14px;justify-content:space-between;margin-top:38px;padding-top:22px;border-top:1px solid var(--line);color:var(--text-3);font-size:.78rem;font-family:'JetBrains Mono',monospace}

@media (max-width:860px){
  .layout{flex-direction:column}
  aside.side{width:100%;position:static;height:auto;padding:1.2rem 24px 0;border-bottom:1px solid var(--line)}
  main.doc-main{border-left:none}
  .nav-links{display:none}
}
`

const THEME_JS = `
(function(){
  var saved = null
  try { saved = localStorage.getItem('ngts-theme') } catch (e) {}
  if (saved === 'light') document.documentElement.setAttribute('data-theme','light')
  document.addEventListener('DOMContentLoaded', function(){
    var btn = document.getElementById('themeBtn')
    if (!btn) return
    btn.addEventListener('click', function(){
      var light = document.documentElement.getAttribute('data-theme') === 'light'
      if (light) document.documentElement.removeAttribute('data-theme')
      else document.documentElement.setAttribute('data-theme','light')
      try { localStorage.setItem('ngts-theme', light ? 'dark' : 'light') } catch (e) {}
    })
  })
})()
`

const THEME_BTN = `<button id="themeBtn" class="theme-btn" aria-label="Toggle theme">
<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4"/></svg>
<svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>
</button>`

const ATMO = `<div class="atmo"><div class="grid-lines"></div><div class="orb b"></div><div class="orb p"></div><div class="orb g"></div></div><div class="noise"></div>`

const ARROW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`

function topNav(links) {
  return `<nav class="top"><div class="nav-in">
<a class="logo" href="index.html"><span class="logo-mark">N</span><span>NextGen Rally-OS<small>Documentation</small></span></a>
<div class="nav-links">${links}</div>
${THEME_BTN}
</div></nav>`
}

function footer(pages) {
  const cols = GROUPS.map((group) => {
    const items = pages.filter((p) => p.group === group)
    const links = items.map((p) => `<a href="${p.slug}.html">${p.title}</a>`).join('')
    return `<div class="foot-col"><h6>${group}</h6>${links}</div>`
  }).join('')
  return `<footer><div class="wrap foot-in">
<div class="foot-brand"><a class="logo" href="index.html"><span class="logo-mark">N</span><span>NextGen Rally-OS<small>Documentation</small></span></a>
<p>Product, engineering, and coaching documentation for the NextGen Rally-OS suite.</p></div>
<div class="foot-cols">${cols}</div>
</div><div class="wrap foot-base"><span>© ${new Date().getFullYear()} NextGen Team Sites</span><span>generated by pnpm docs:build</span></div></footer>`
}

function shell({ title, body }) {
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — NextGen Rally-OS Docs</title>
${FONTS}
<style>${css}</style>
<script>${THEME_JS}</script>
</head>
<body>
${ATMO}
${body}
</body>
</html>`
}

function sideNav(pages, activeSlug) {
  let html = ''
  for (const group of GROUPS) {
    const items = pages.filter((p) => p.group === group)
    if (items.length === 0) continue
    html += `<p class="grp">${group}</p>`
    for (const p of items) {
      const active = p.slug === activeSlug ? ' active' : ''
      html += `<a class="pg${active}" href="${p.slug}.html">${p.title}</a>`
    }
  }
  return html
}

function docPage({ title, pages, activeSlug, content }) {
  const body = `${topNav('<a href="index.html">All Docs</a>')}
<div class="layout">
<aside class="side">${sideNav(pages, activeSlug)}</aside>
<main class="doc-main"><div class="doc">${content}</div></main>
</div>
${footer(pages)}`
  return shell({ title, body })
}

// Collect all page descriptors for the shared nav.
const all = [
  ...HTML_PAGES.map(([file, title, group, blurb]) => ({ slug: file.replace(/\.html$/, ''), title, group, blurb, file })),
  ...MD_PAGES.map(([src, slug, title, group, blurb]) => ({ slug, title, group, blurb, src })),
]

// Rewrite repo-relative markdown links to their generated pages.
function rewriteLinks(html) {
  for (const p of all.filter((p) => p.src)) {
    const base = p.src.split('/').pop()
    html = html.replaceAll(`href="${p.src}"`, `href="${p.slug}.html"`)
    html = html.replaceAll(`href="${base}"`, `href="${p.slug}.html"`)
    html = html.replaceAll(`href="docs/${base}"`, `href="${p.slug}.html"`)
  }
  return html
}

let generated = 0
for (const p of all.filter((p) => p.src)) {
  const md = readFileSync(join(ROOT, p.src), 'utf8')
  const content = rewriteLinks(marked.parse(md))
  writeFileSync(join(OUT, `${p.slug}.html`), docPage({ title: p.title, pages: all, activeSlug: p.slug, content }))
  generated++
}

// Standalone HTML documents: pulled in verbatim from docs/html-src/, else
// skipped with a warning.
for (const p of all.filter((p) => p.file)) {
  const src = join(ROOT, 'docs', 'html-src', p.file)
  if (!existsSync(src)) {
    console.warn(`skip ${p.file} — docs/html-src/${p.file} not found`)
    continue
  }
  writeFileSync(join(OUT, p.file), readFileSync(src))
  generated++
}

// Landing-page index hub: hero + grouped doc card grid browsing everything.
const ICONS = {
  'pitch-deck': '🏆', 'user-guide': '📖', 'suite-diagram': '🗺️',
  overview: '⚡', architecture: '🏗️', 'ncs-integration': '🔍', cms: '📝',
  'gamechanger-integration': '🔄', database: '🗄️', deployment: '🚀',
  'coaching-content': '🥎', 'development-roadmap': '📈',
}
const FI = ['fi-blue', 'fi-purple', 'fi-gold']

const groupSections = GROUPS.map((group) => {
  const items = all.filter((p) => p.group === group)
  const cards = items
    .map(
      (p, i) => `<a class="glow-card doc-card" href="${p.slug}.html">
<div class="feat-icon ${FI[i % 3]}">${ICONS[p.slug] ?? '📄'}</div>
<h3>${p.title}</h3>
<p>${p.blurb}</p>
<span class="doc-cta">Read the doc ${ARROW}</span>
</a>`,
    )
    .join('')
  return `<section class="docs-group" id="${group.toLowerCase()}">
<div class="wrap">
<div class="sec-head"><span class="eyebrow"><span class="dot"></span>${group}</span>
<h2>${group} <span class="grad-text">docs</span></h2>
<p>${GROUP_BLURBS[group]}</p></div>
<div class="doc-grid">${cards}</div>
</div></section>`
}).join('')

const navLinks = GROUPS.map((g) => `<a href="#${g.toLowerCase()}">${g}</a>`).join('')

const indexBody = `${topNav(navLinks)}
<header class="hero">
<div class="wrap">
<span class="eyebrow"><span class="dot"></span>NextGen Rally-OS · Documentation</span>
<h1>Every doc for the suite.<br><span class="grad-text">One professional home.</span></h1>
<p class="sub">Product, engineering, and coaching documentation for the NextGen Rally-OS platform — generated straight from the repository with <code class="mono">pnpm docs:build</code>.</p>
<div class="hero-btns">
<a class="btn btn-primary" href="user-guide.html">User Guide ${ARROW}</a>
<a class="btn btn-gold" href="pitch-deck.html">Pitch Deck ${ARROW}</a>
<a class="btn btn-ghost" href="#engineering">Engineering Docs ${ARROW}</a>
</div>
</div>
</header>
${groupSections}
${footer(all)}`

writeFileSync(join(OUT, 'index.html'), shell({ title: 'Documentation', body: indexBody }))
generated++

console.log(`Built ${generated} pages into docs/html/`)
