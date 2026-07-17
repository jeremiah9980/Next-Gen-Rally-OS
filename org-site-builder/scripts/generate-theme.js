#!/usr/bin/env node
/* ============================================================
   generate-theme.js
   Writes src/config/theme.tokens.json from one of the built-in
   presets, optionally overriding primary/secondary/accent.

   Usage:
     node scripts/generate-theme.js --preset dark-sports
     node scripts/generate-theme.js --preset black-gold-premium --primary "#FFD700"
     node scripts/generate-theme.js --list

   Presets (see BRANDING.md for the full rationale):
     aggressive-elite, clean-modern, youth-development,
     college-showcase, dark-sports, bright-family,
     black-gold-premium, red-black-battle, blue-yellow-energy
   ============================================================ */
const fs = require('fs');
const path = require('path');

const FONTS = {
  aggressive: { display: "'Bebas Neue', sans-serif", body: "'Inter', sans-serif", href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800;900&display=swap" },
  clean:      { display: "'Barlow Condensed', sans-serif", body: "'Barlow', sans-serif", href: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Barlow:wght@400;500;600;700&display=swap" },
  rounded:    { display: "'Fredoka', sans-serif", body: "'Nunito Sans', sans-serif", href: "https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito+Sans:wght@400;600;700;800&display=swap" },
  classic:    { display: "'Oswald', sans-serif", body: "'Source Sans 3', sans-serif", href: "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Source+Sans+3:wght@400;600;700&display=swap" },
};

const SCALES = {
  radius: { sm: '6px', md: '10px', lg: '16px', pill: '999px' },
  shadow: { sm: '0 1px 2px rgba(0,0,0,0.06)', md: '0 8px 24px rgba(0,0,0,0.10)', lg: '0 20px 60px rgba(0,0,0,0.18)' },
  type: { kicker: '11px', small: '13px', body: '16px', h3: '18px', h2: 'clamp(26px, 4vw, 38px)', h1: 'clamp(44px, 8vw, 80px)' },
};

// Each preset defines its identity colors; light/dark surfaces are derived
// so the toggle always looks intentional.
const PRESETS = {
  'aggressive-elite':   { font: 'aggressive', primary: '#DC2626', secondary: '#F5C400', dark: true },
  'clean-modern':       { font: 'clean',      primary: '#4F46E5', secondary: '#0EA5E9', dark: false },
  'youth-development':  { font: 'rounded',    primary: '#0D9488', secondary: '#F59E0B', dark: false },
  'college-showcase':   { font: 'classic',    primary: '#0B2C5E', secondary: '#C9A227', dark: false },
  'dark-sports':        { font: 'aggressive', primary: '#00BFFF', secondary: '#00BFFF', dark: true },
  'bright-family':      { font: 'rounded',    primary: '#FF6B6B', secondary: '#FFD93D', dark: false },
  'black-gold-premium': { font: 'classic',    primary: '#D4AF37', secondary: '#D4AF37', dark: true },
  'red-black-battle':   { font: 'aggressive', primary: '#E11D2A', secondary: '#E11D2A', dark: true },
  'blue-yellow-energy': { font: 'clean',      primary: '#1A56B0', secondary: '#F5C400', dark: false },
};

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}
function mix(hex, withHex, amt) {
  const a = hexToRgb(hex), b = hexToRgb(withHex);
  const m = a.map((c, i) => Math.round(c + (b[i] - c) * amt));
  return '#' + m.map((c) => c.toString(16).padStart(2, '0')).join('');
}
function rgba(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r}, ${g}, ${b}, ${a})`; }
function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/* Pick black or white text for a background by whichever yields the
   higher WCAG contrast ratio — robust for midtones like bright cyan. */
function readable(bg) {
  const L = luminance(bg);
  const onWhite = (1.0 + 0.05) / (L + 0.05);
  const onBlack = (L + 0.05) / (0.05);
  return onBlack >= onWhite ? '#06090F' : '#FFFFFF';
}

function buildTokens(name, overrides) {
  const p = PRESETS[name];
  if (!p) { console.error(`Unknown preset "${name}". Run --list to see options.`); process.exit(1); }
  const primary = overrides.primary || p.primary;
  const secondary = overrides.secondary || p.secondary;
  const accent = overrides.accent || '#FFFFFF';
  const font = FONTS[p.font];

  const light = {
    primary, primaryStrong: mix(primary, '#000000', 0.15),
    secondary, secondaryStrong: mix(secondary, '#000000', 0.12),
    accent, text: '#161A22', textMuted: rgba('#161A22', 0.66),
    pageBg: mix(primary, '#FFFFFF', 0.96), sectionSoft: rgba(primary, 0.06),
    card: '#FFFFFF', border: rgba('#161A22', 0.12),
    navBg: 'rgba(255,255,255,0.92)', footerBg: primary, footerText: 'rgba(255,255,255,0.72)',
    heroBg: `linear-gradient(135deg, ${primary} 0%, ${mix(primary, '#000000', 0.18)} 100%)`,
    heroText: '#FFFFFF', heroAccent: secondary, glow: rgba(primary, 0.18),
    onPrimary: readable(primary), onSecondary: readable(secondary),
  };
  const darkPrimary = mix(primary, '#FFFFFF', 0.18);
  const dark = {
    primary: darkPrimary, primaryStrong: primary,
    secondary, secondaryStrong: mix(secondary, '#000000', 0.10),
    accent, text: '#F4F6FB', textMuted: 'rgba(244,246,251,0.70)',
    pageBg: '#0A0E17', sectionSoft: rgba(primary, 0.08),
    card: 'rgba(20,28,46,0.85)', border: rgba(primary, 0.24),
    navBg: 'rgba(8,12,20,0.90)', footerBg: '#06090F', footerText: 'rgba(255,255,255,0.62)',
    heroBg: `linear-gradient(135deg, #0A0E17 0%, ${mix(primary, '#000000', 0.55)} 50%, #0A0E17 100%)`,
    heroText: '#FFFFFF', heroAccent: secondary, glow: rgba(primary, 0.40),
    onPrimary: readable(darkPrimary), onSecondary: readable(secondary),
  };

  return {
    $comment: 'Generated by generate-theme.js. Edit any value by hand; re-run the script to start over from a preset.',
    preset: name,
    fonts: { display: font.display, body: font.body, googleFontsHref: font.href },
    scales: SCALES,
    light, dark,
  };
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--list') out.list = true;
    else if (a.startsWith('--')) out[a.slice(2)] = argv[++i];
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.list) {
    console.log('Available presets:\n  ' + Object.keys(PRESETS).join('\n  '));
    return;
  }
  const name = args.preset || 'blue-yellow-energy';
  const tokens = buildTokens(name, args);
  const out = path.join(__dirname, '..', 'src', 'config', 'theme.tokens.json');
  fs.writeFileSync(out, JSON.stringify(tokens, null, 2) + '\n');
  console.log(`Wrote ${out} using preset "${name}".`);
  console.log('Next: run "node scripts/validate-config.js" to check contrast.');
}

main();
