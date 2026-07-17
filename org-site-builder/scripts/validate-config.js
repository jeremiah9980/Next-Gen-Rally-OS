#!/usr/bin/env node
/* ============================================================
   validate-config.js
   Sanity-checks src/config/org.config.json and theme.tokens.json
   before you deploy. Reports:
     - missing required fields
     - placeholder values you forgot to change
     - image paths that point nowhere on disk
     - text/background contrast below WCAG AA (4.5:1)

   Usage: node scripts/validate-config.js
   Exit code is non-zero if any ERROR (not warning) is found.
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const errors = [];
const warnings = [];

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { errors.push(`Cannot read/parse ${path.relative(ROOT, p)}: ${e.message}`); return null; }
}

function hexToRgb(hex) {
  const m = String(hex).trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function lum(rgb) {
  const a = rgb.map((c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function contrast(a, b) {
  const ra = hexToRgb(a), rb = hexToRgb(b);
  if (!ra || !rb) return null; // gradients/rgba skipped
  const la = lum(ra), lb = lum(rb);
  const hi = Math.max(la, lb), lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

function checkContrast(scope, tokens) {
  const t = tokens[scope];
  if (!t) return;
  const pairs = [
    ['text', 'pageBg', 'body text on page'],
    ['text', 'card', 'text on cards'],
    ['onPrimary', 'primary', 'button label on primary'],
    ['onSecondary', 'secondary', 'button label on secondary'],
  ];
  pairs.forEach(([fg, bg, label]) => {
    const ratio = contrast(t[fg], t[bg]);
    if (ratio === null) return;
    if (ratio < 4.5) warnings.push(`[${scope}] low contrast (${ratio.toFixed(2)}:1) for ${label} — aim for 4.5:1+`);
  });
}

function walkImages(obj, hits) {
  if (!obj || typeof obj !== 'object') return;
  for (const v of Object.values(obj)) {
    if (typeof v === 'string' && /\.(png|jpe?g|webp|svg|gif)$/i.test(v) && !/^https?:\/\//i.test(v)) hits.push(v);
    else if (typeof v === 'object') walkImages(v, hits);
  }
}

function main() {
  const config = readJson(path.join(ROOT, 'src', 'config', 'org.config.json'));
  const tokens = readJson(path.join(ROOT, 'src', 'config', 'theme.tokens.json'));

  if (config) {
    const org = config.organization || {};
    ['name', 'nickname', 'ageGroup'].forEach((k) => { if (!org[k]) errors.push(`organization.${k} is required`); });
    if ((org.name || '').toLowerCase().includes('example')) warnings.push('organization.name still says "Example" — update it');
    const c = config.contact || {};
    if ((c.email || '').includes('example.com')) warnings.push('contact.email still uses example.com');
    if ((c.phone || '').includes('000-0000')) warnings.push('contact.phone is still a placeholder');
    const t = config.tryouts || {};
    if (t.enabled !== false && (t.signupUrl || '').includes('example.com')) warnings.push('tryouts.signupUrl is still a placeholder');

    const imgs = [];
    walkImages(config, imgs);
    imgs.forEach((rel) => {
      const onDisk = path.join(ROOT, 'public', rel.replace(/^\/+/, ''));
      if (!fs.existsSync(onDisk)) warnings.push(`image not found on disk: public${rel.startsWith('/') ? '' : '/'}${rel}  (upload it or fix the path)`);
    });
  }

  if (tokens) {
    ['light', 'dark'].forEach((scope) => {
      if (!tokens[scope]) { errors.push(`theme.tokens.json is missing the "${scope}" block`); return; }
      checkContrast(scope, tokens);
    });
  }

  console.log('\n=== Config validation ===');
  if (!errors.length && !warnings.length) console.log('All good. No errors or warnings.');
  if (errors.length) { console.log('\nERRORS:'); errors.forEach((e) => console.log('  \u2717 ' + e)); }
  if (warnings.length) { console.log('\nWARNINGS:'); warnings.forEach((w) => console.log('  \u26a0 ' + w)); }
  console.log('');
  process.exit(errors.length ? 1 : 0);
}

main();
