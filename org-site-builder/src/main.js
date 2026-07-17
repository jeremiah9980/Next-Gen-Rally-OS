/* ============================================================
   main.js — site bootstrap
   Loads org.config.json (content) + theme.tokens.json (look),
   injects theme variables for light + dark, renders every section
   component, then wires the theme toggle, mobile nav, QR, and
   scroll-spy. Editing the two JSON files is all a coach needs to do.
   ============================================================ */

import { render as header } from './components/header.js';
import { render as hero } from './components/hero.js';
import { render as about } from './components/about.js';
import { render as coaches } from './components/coaches.js';
import { render as roster } from './components/roster.js';
import { render as schedule } from './components/schedule.js';
import { render as tryouts, mount as mountTryouts } from './components/tryouts.js';
import { render as sponsors } from './components/sponsors.js';
import { render as gallery } from './components/gallery.js';
import { render as contact } from './components/contact.js';
import { render as footer } from './components/footer.js';
import { initThemeToggle } from './utils/theme-toggle.js';

/* Resolve everything relative to index.html so the site works on a
   GitHub Pages project URL (/repo/), a user URL, or a custom domain. */
const BASE = new URL('.', document.baseURI);

function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* Map a config image path to a real URL. Absolute URLs pass through;
   leading-slash paths like "/images/logos/logo.png" resolve under
   /public, which is where the upload folders live. */
function asset(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const clean = String(path).replace(/^\/+/, '');
  const underPublic = clean.startsWith('public/') ? clean : 'public/' + clean;
  return new URL(underPublic, BASE).href;
}

const ctx = { esc, asset };

async function loadJson(relPath) {
  const res = await fetch(new URL(relPath, BASE).href, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Could not load ${relPath} (HTTP ${res.status})`);
  return res.json();
}

function cssVars(tokens, scope) {
  const t = tokens[scope] || {};
  const lines = Object.entries(t).map(([k, v]) => `  --${kebab(k)}: ${v};`);
  // Scales + fonts are shared across themes
  if (scope === 'light') {
    const s = tokens.scales || {};
    const f = tokens.fonts || {};
    if (f.display) lines.push(`  --font-display: ${f.display};`);
    if (f.body) lines.push(`  --font-body: ${f.body};`);
    Object.entries(s.radius || {}).forEach(([k, v]) => lines.push(`  --radius-${k}: ${v};`));
    Object.entries(s.shadow || {}).forEach(([k, v]) => lines.push(`  --shadow-${k}: ${v};`));
    Object.entries(s.type || {}).forEach(([k, v]) => lines.push(`  --${k}: ${v};`));
  }
  return lines.join('\n');
}

function kebab(s) { return s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()); }

function injectTheme(tokens) {
  // Fonts
  if (tokens.fonts && tokens.fonts.googleFontsHref) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = tokens.fonts.googleFontsHref;
    document.head.appendChild(link);
  }
  const style = document.createElement('style');
  style.id = 'theme-vars';
  style.textContent =
    `:root, [data-theme="light"] {\n${cssVars(tokens, 'light')}\n}\n` +
    `[data-theme="dark"] {\n${cssVars(tokens, 'dark')}\n}`;
  document.head.appendChild(style);
}

function setMeta(config) {
  const org = config.organization || {};
  document.title = `${org.name || 'Softball'}${org.tagline ? ' — ' + org.tagline : ''}`;
  const fav = (config.branding || {}).favicon;
  if (fav) {
    const link = document.querySelector('link[rel="icon"]') || document.createElement('link');
    link.rel = 'icon';
    link.href = asset(fav);
    document.head.appendChild(link);
  }
}

function wireNavAndSpy() {
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    navLinks.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => { navLinks.classList.remove('open'); navToggle.setAttribute('aria-expanded', 'false'); }));
  }
  // Scroll-spy: highlight the nav link for the section in view
  const links = Array.from(document.querySelectorAll('.nav-links a'));
  const map = new Map(links.map((a) => [a.getAttribute('href'), a]));
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        links.forEach((l) => l.classList.remove('active'));
        const active = map.get('#' + e.target.id);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('section[id]').forEach((s) => obs.observe(s));
}

async function boot() {
  const app = document.getElementById('app');
  try {
    const [config, tokens] = await Promise.all([
      loadJson('src/config/org.config.json'),
      loadJson('src/config/theme.tokens.json'),
    ]);

    injectTheme(tokens);
    setMeta(config);

    const strip = (config.recruitingStrip && config.recruitingStrip.enabled !== false && (config.recruitingStrip.items || []).length)
      ? `<div class="recruiting-strip"><p>${config.recruitingStrip.items.map(esc).join(' &nbsp;&bull;&nbsp; ')}</p></div>`
      : '';

    app.innerHTML = [
      header(config, ctx),
      hero(config, ctx),
      strip,
      '<main id="main">',
      about(config, ctx),
      coaches(config, ctx),
      roster(config, ctx),
      schedule(config, ctx),
      tryouts(config, ctx),
      sponsors(config, ctx),
      gallery(config, ctx),
      contact(config, ctx),
      '</main>',
      footer(config, ctx),
    ].join('\n');

    const nick = (config.organization && (config.organization.nickname || config.organization.name)) || 'org';
    initThemeToggle({ storageKey: nick.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-theme' });
    mountTryouts(config, ctx);
    wireNavAndSpy();
  } catch (err) {
    console.error(err);
    app.innerHTML = `
      <div class="app-status">
        <h2>Site is loading its content…</h2>
        <p>If you are seeing this, the browser could not read the config files. This usually means you opened
        <code>index.html</code> directly. Run a tiny local server instead:</p>
        <p><code>npx serve .</code> &nbsp;then open the printed URL.</p>
        <p style="margin-top:12px;font-size:13px">(${esc(err.message)})</p>
      </div>`;
  }
}

document.addEventListener('DOMContentLoaded', boot);
