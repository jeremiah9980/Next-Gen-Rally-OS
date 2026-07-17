#!/usr/bin/env node
/* ============================================================
   create-new-org.js
   Stamps a fresh org.config.json (and a matching theme via the
   preset) so a brand-new organization can go from clone to live
   without hand-editing JSON.

   Two modes:
   1) Flags (non-interactive):
      node scripts/create-new-org.js \
        --name "CTX Elite Softball" --nickname "CTX Elite" \
        --ageGroup 12U --location "Georgetown, TX" \
        --preset dark-sports --coach "Coach Smith" \
        --email coach@ctxelite.com --phone "512-555-0100" \
        --signup "https://forms.gle/xyz" --tone showcase

   2) Interactive: run with no flags and answer the prompts.

   It writes src/config/org.config.json and then calls generate-theme.js
   for the chosen preset. Existing images are never touched.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const CONFIG = path.join(ROOT, 'src', 'config', 'org.config.json');

const TONES = {
  elite: 'Built different. Developed together.',
  aggressive: 'Built for the fight.',
  'family-first': 'One family. One standard.',
  'faith-based': 'Play hard. Stay grounded. Lift each other up.',
  'college-prep': 'Developing the next level, today.',
  'local-community': 'Our town. Our team. Our future.',
  showcase: 'Seen. Developed. Recruited.',
  'fun-youth-development': 'Learn the game. Love the game.',
};

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) out[a.slice(2)] = argv[++i];
  }
  return out;
}

function buildConfig(a) {
  const name = a.name || 'Example Softball';
  const nickname = a.nickname || name;
  const ageGroup = a.ageGroup || '12U';
  const location = a.location || 'Georgetown, Texas';
  const season = a.season || `${new Date().getFullYear()} Season`;
  const tagline = a.tagline || TONES[a.tone] || TONES.elite;
  const kicker = `${location} \u2022 ${ageGroup} Select Softball \u2022 ${season}`;

  return {
    organization: { name, nickname, ageGroup, season, tagline, location, circuits: ['USSSA', 'NSA', 'NCS'] },
    branding: {
      logo: '/images/logos/logo.png', logoAlt: `${name} logo`, favicon: '/images/logos/logo.png',
      heroImage: '/images/hero/hero.jpg', heroImageAlt: `${name} players on the field`,
      preset: a.preset || 'blue-yellow-energy',
    },
    nav: {
      ctaLabel: 'Join the Team', ctaHref: '#tryouts',
      links: [
        { label: 'About', href: '#about' }, { label: 'Coaches', href: '#coaches' },
        { label: 'Roster', href: '#roster' }, { label: 'Schedule', href: '#schedule' },
        { label: 'Tryouts', href: '#tryouts' }, { label: 'Sponsors', href: '#sponsors' },
        { label: 'Gallery', href: '#gallery' }, { label: 'Contact', href: '#contact' },
      ],
    },
    hero: {
      kicker, title: name, subtitle: 'Select Softball Organization',
      tagline,
      primaryCta: { label: 'Join the Team', href: '#tryouts' },
      secondaryCta: { label: 'Learn More', href: '#about' },
    },
    recruitingStrip: { enabled: true, items: [season, 'Now Recruiting Players', 'Coaches', 'Sponsors'] },
    about: {
      enabled: true, heading: 'Built Different',
      subtitle: 'A development-first select softball organization with a serious identity and clear structure.',
      body: [
        'Most select programs run through one person carrying everything. That model burns coaches out.',
        `${name} is built differently — operations are owned so coaches can own the field, and every player gets a real development plan.`,
      ],
      pillars: [
        { icon: '\ud83e\udd4e', title: 'Elite Coaching', text: 'Development-first, family-first coaching that lets athletes grow.' },
        { icon: '\ud83c\udfdb\ufe0f', title: 'Real Structure', text: 'Clear roles and accountability so the org runs on plan.' },
        { icon: '\ud83c\udfc6', title: 'Compete Big', text: 'USSSA, NSA, and NCS circuits built to develop every player.' },
      ],
    },
    coaches: a.coach
      ? [{ name: a.coach, role: 'Head Coach', photo: '/images/coaches/head-coach.jpg', photoAlt: a.coach, bio: 'Add a short coaching bio here.' }]
      : [{ name: 'Coach Name', role: 'Head Coach', photo: '/images/coaches/head-coach.jpg', photoAlt: 'Head Coach', bio: 'Add a short coaching bio here.' }],
    roster: {
      enabled: true, format: 'gamechanger',
      note: 'Roster shown in GameChanger format. Individual profile pages activate per player once a signed parent media release is on file.',
      players: [{ firstName: 'First', lastInitial: 'L', number: '00', positions: ['Position'], photo: '/images/players/first-l.jpg', photoAlt: '', live: false, profileUrl: '' }],
    },
    tryouts: {
      enabled: true, heading: 'Tryouts & Recruiting',
      dates: (a.dates ? a.dates.split(',').map((s) => s.trim()) : ['TBA']),
      time: a.time || '6:00 PM - 8:00 PM', location: a.practiceLocation || location,
      details: 'Bring your glove, bat, helmet, cleats, and water. Arrive 15 minutes early to check in.',
      signupUrl: a.signup || 'https://example.com/signup', signupLabel: 'Register for Tryouts',
      qrCode: a.qr || '/qr/signup.png',
    },
    schedule: {
      enabled: true, heading: 'Schedule', subtitle: 'Upcoming practices, tournaments, and events.',
      events: [{ date: 'TBA', name: 'Season schedule coming soon', location, type: 'Info' }],
    },
    sponsors: {
      enabled: true, heading: 'Our Sponsors', subtitle: 'Community partners who help us compete and develop.',
      ctaLabel: 'Become a Sponsor', ctaHref: '#contact', items: [],
    },
    gallery: { enabled: true, heading: 'Gallery', subtitle: 'Moments from the season.', items: [] },
    contact: {
      enabled: true, heading: 'Contact & Tryouts',
      subtitle: 'Roster openings, coaching roles, and sponsorship inquiries.',
      coachName: a.coach || 'Coach Name', phone: a.phone || '512-000-0000', email: a.email || 'coach@example.com',
      social: [{ platform: 'Instagram', url: 'https://instagram.com/' }, { platform: 'Facebook', url: 'https://facebook.com/' }],
    },
    footer: { tagline: `${location} \u2022 ${ageGroup} Select Softball \u2022 ${season}`, credit: '' },
  };
}

function writeConfig(cfg) {
  fs.writeFileSync(CONFIG, JSON.stringify(cfg, null, 2) + '\n');
  console.log(`Wrote ${path.relative(ROOT, CONFIG)}`);
}

function runThemeGen(preset) {
  try {
    execFileSync('node', [path.join(ROOT, 'scripts', 'generate-theme.js'), '--preset', preset], { stdio: 'inherit' });
  } catch (e) { console.warn('Theme generation skipped:', e.message); }
}

function finish(cfg) {
  writeConfig(cfg);
  runThemeGen(cfg.branding.preset);
  console.log('\nNext steps:');
  console.log('  1. Upload images into public/images/ (see public/images/README.md)');
  console.log('  2. node scripts/validate-config.js');
  console.log('  3. npx serve .   (preview locally)');
  console.log('  4. Follow LAUNCH.md to deploy on GitHub Pages\n');
}

function interactive() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const a = {};
  const q = [
    ['name', 'Organization name'], ['nickname', 'Short nickname'], ['ageGroup', 'Age group (e.g. 12U)'],
    ['location', 'City, State'], ['preset', 'Theme preset (run generate-theme.js --list)'],
    ['coach', 'Head coach name'], ['email', 'Contact email'], ['phone', 'Contact phone'],
    ['signup', 'Signup form URL'], ['tone', 'Tone (elite/aggressive/family-first/faith-based/college-prep/local-community/showcase/fun-youth-development)'],
  ];
  let i = 0;
  const next = () => {
    if (i >= q.length) { rl.close(); finish(buildConfig(a)); return; }
    const [key, label] = q[i++];
    rl.question(`${label}: `, (ans) => { if (ans.trim()) a[key] = ans.trim(); next(); });
  };
  next();
}

const args = parseArgs(process.argv.slice(2));
if (Object.keys(args).length === 0) interactive();
else finish(buildConfig(args));
