#!/usr/bin/env node
/**
 * Builds the static documentation site: converts README + docs/*.md into
 * styled HTML pages under docs/html/, alongside the standalone HTML documents
 * (pitch deck, user guide, product suite diagram) and an index hub.
 *
 *   pnpm docs:build
 *
 * Output is committed so the site works from a git checkout (open
 * docs/html/index.html) or any static host (e.g. GitHub Pages pointed at
 * /docs/html).
 */

import { marked } from 'marked'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'docs', 'html')
mkdirSync(OUT, { recursive: true })

/** Pages generated from markdown: [source, slug, nav title, group]. */
const MD_PAGES = [
  ['README.md', 'overview', 'Overview & Quickstart', 'Engineering'],
  ['docs/ARCHITECTURE.md', 'architecture', 'Architecture & Handoff', 'Engineering'],
  ['docs/ncs-integration.md', 'ncs-integration', 'NCS Integration', 'Engineering'],
  ['docs/gamechanger-integration.md', 'gamechanger-integration', 'GameChanger Integration', 'Engineering'],
  ['infra/db/README.md', 'database', 'Database Workflows', 'Engineering'],
  ['infra/vercel/README.md', 'deployment', 'Vercel Deployment', 'Engineering'],
  ['docs/coaching-content-package.md', 'coaching-content', 'Coaching Content Package', 'Coaching'],
  ['docs/development-roadmap.md', 'development-roadmap', '4-Year Development Roadmap', 'Coaching'],
]

/** Standalone HTML documents copied in as-is (already self-contained pages). */
const HTML_PAGES = [
  ['pitch-deck.html', 'Pitch Deck', 'Product'],
  ['user-guide.html', 'User Guide & Manual', 'Product'],
  ['suite-diagram.html', 'Product Suite Diagram', 'Product'],
]

const GROUPS = ['Product', 'Engineering', 'Coaching']

const css = `
  :root {
    --bg: #FAFBF7; --surface: #FFFFFF; --card: #F2F5EE; --border: #DDE5D6;
    --text: #1A241C; --muted: #5C6E5F; --lime: #5C8A12; --lime-soft: #EAF3DA;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0A0F0B; --surface: #101812; --card: #16211A; --border: #24322A;
      --text: #E8F0E9; --muted: #8FA893; --lime: #A8E63D; --lime-soft: #1B2A14;
    }
  }
  :root[data-theme="dark"] {
    --bg: #0A0F0B; --surface: #101812; --card: #16211A; --border: #24322A;
    --text: #E8F0E9; --muted: #8FA893; --lime: #A8E63D; --lime-soft: #1B2A14;
  }
  :root[data-theme="light"] {
    --bg: #FAFBF7; --surface: #FFFFFF; --card: #F2F5EE; --border: #DDE5D6;
    --text: #1A241C; --muted: #5C6E5F; --lime: #5C8A12; --lime-soft: #EAF3DA;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.65;
  }
  .layout { display: flex; min-height: 100vh; }
  nav.side {
    width: 250px; flex-shrink: 0; border-right: 1px solid var(--border);
    background: var(--surface); padding: 1.5rem 1rem; position: sticky;
    top: 0; height: 100vh; overflow-y: auto;
  }
  nav.side .brand {
    font-weight: 800; letter-spacing: -0.02em; text-decoration: none;
    color: var(--text); display: block; margin-bottom: 1.5rem; font-size: 1rem;
  }
  nav.side .brand span { color: var(--lime); }
  nav.side .grp {
    font-size: 0.6rem; font-weight: 700; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--muted); margin: 1.2rem 0 0.4rem;
  }
  nav.side a.pg {
    display: block; padding: 0.4rem 0.65rem; border-radius: 8px;
    text-decoration: none; color: var(--muted); font-size: 0.85rem;
  }
  nav.side a.pg:hover { color: var(--text); background: var(--card); }
  nav.side a.pg.active { color: var(--lime); background: var(--lime-soft); font-weight: 600; }
  main { flex: 1; min-width: 0; padding: 3rem clamp(1.25rem, 5vw, 4rem); }
  main .doc { max-width: 800px; }
  h1, h2, h3, h4 { letter-spacing: -0.02em; line-height: 1.25; }
  h1 { font-size: 2rem; margin-top: 0; }
  h2 { margin-top: 2.2em; border-bottom: 1px solid var(--border); padding-bottom: 0.3em; }
  a { color: var(--lime); }
  code {
    font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 0.85em;
    background: var(--card); border: 1px solid var(--border);
    border-radius: 6px; padding: 0.1em 0.35em;
  }
  pre {
    background: var(--card); border: 1px solid var(--border); border-radius: 12px;
    padding: 1rem 1.2rem; overflow-x: auto; line-height: 1.55;
  }
  pre code { background: none; border: none; padding: 0; font-size: 0.8rem; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; display: block; overflow-x: auto; }
  th, td { border: 1px solid var(--border); padding: 0.5rem 0.75rem; font-size: 0.88rem; text-align: left; }
  th { background: var(--card); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
  blockquote { border-left: 3px solid var(--lime); margin: 1rem 0; padding: 0.2rem 1rem; color: var(--muted); }
  img { max-width: 100%; }
  @media (max-width: 760px) {
    .layout { flex-direction: column; }
    nav.side { width: 100%; height: auto; position: static; border-right: none; border-bottom: 1px solid var(--border); }
  }
`

function navHtml(pages, activeSlug) {
  let html = '<a class="brand" href="index.html">Rally-<span>OS</span> Docs</a>'
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

function page({ title, nav, content }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — Rally-OS Docs</title>
<style>${css}</style>
</head>
<body>
<div class="layout">
<nav class="side">${nav}</nav>
<main><div class="doc">${content}</div></main>
</div>
</body>
</html>`
}

// Collect all page descriptors for the shared nav.
const all = [
  ...HTML_PAGES.map(([file, title, group]) => ({ slug: file.replace(/\.html$/, ''), title, group, file })),
  ...MD_PAGES.map(([src, slug, title, group]) => ({ slug, title, group, src })),
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
  writeFileSync(join(OUT, `${p.slug}.html`), page({ title: p.title, nav: navHtml(all, p.slug), content }))
  generated++
}

// Standalone HTML documents: copied verbatim if present beside this script's
// committed copies in docs/html-src/, else skipped with a warning.
for (const p of all.filter((p) => p.file)) {
  const src = join(ROOT, 'docs', 'html-src', p.file)
  if (!existsSync(src)) {
    console.warn(`skip ${p.file} — docs/html-src/${p.file} not found`)
    continue
  }
  writeFileSync(join(OUT, p.file), readFileSync(src))
  generated++
}

// Index hub.
const cards = GROUPS.map((group) => {
  const items = all.filter((p) => p.group === group)
  const links = items
    .map(
      (p) => `<a class="card" href="${p.slug}.html"><strong>${p.title}</strong><span>${group}</span></a>`,
    )
    .join('')
  return `<h2>${group}</h2><div class="cards">${links}</div>`
}).join('')

const indexContent = `
<h1>Next-Gen Rally-OS — Documentation</h1>
<p>Product, engineering, and coaching documentation for the Rally-OS suite.
Generated from the repository markdown with <code>pnpm docs:build</code>.</p>
<style>
  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.8rem; }
  .card {
    display: flex; flex-direction: column; gap: 0.2rem; text-decoration: none;
    border: 1px solid var(--border); border-radius: 12px; padding: 1rem 1.1rem;
    background: var(--surface); color: var(--text);
  }
  .card:hover { border-color: var(--lime); }
  .card span { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.14em; color: var(--muted); }
</style>
${cards}
`
writeFileSync(join(OUT, 'index.html'), page({ title: 'Documentation', nav: navHtml(all, 'index'), content: indexContent }))
generated++

console.log(`Built ${generated} pages into docs/html/`)
