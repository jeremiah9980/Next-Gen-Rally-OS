#!/usr/bin/env node
/* ============================================================
   intake-to-build.js  —  THE BRIDGE  (Rally-ORG)

   Fuses the Org-Site Kit intake (governance + consent model) with
   the softball-org-site-template-generator engine (config-driven
   theming + light/dark + AA-contrast derivation).

   IN:   examples/<team>.intake.json   (validated against the
         Org-Site Kit schema_version "1.0")
   OUT:  src/config/theme.tokens.json   (the new team's IDENTITY)
         src/config/org.config.json     (governance-grade CONTENT)

   Usage:
     node scripts/intake-to-build.js examples/lonestar-reign.intake.json
     node scripts/intake-to-build.js <intake.json> --preset black-gold-premium

   No build step. After running, serve with `npx serve .`.
   ============================================================ */
const fs = require('fs');
const path = require('path');

/* ---------- 1. THEME DERIVATION (shared with generate-theme.js) ---------- */
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
const hexToRgb = (hex) => { const h = hex.replace('#',''); const n = h.length===3 ? h.split('').map(c=>c+c).join('') : h; return [parseInt(n.slice(0,2),16),parseInt(n.slice(2,4),16),parseInt(n.slice(4,6),16)]; };
const mix = (hex,withHex,amt) => { const a=hexToRgb(hex),b=hexToRgb(withHex); return '#'+a.map((c,i)=>Math.round(c+(b[i]-c)*amt)).map(c=>c.toString(16).padStart(2,'0')).join(''); };
const rgba = (hex,a) => { const [r,g,b]=hexToRgb(hex); return `rgba(${r}, ${g}, ${b}, ${a})`; };
const luminance = (hex) => { const [r,g,b]=hexToRgb(hex).map(c=>{c/=255; return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);}); return 0.2126*r+0.7152*g+0.0722*b; };
const readable = (bg) => { const L=luminance(bg); return ((L+0.05)/0.05) >= ((1.05)/(L+0.05)) ? '#06090F' : '#FFFFFF'; };

/* Map the intake's VOICE + background_mood -> a preset base (font + bias).
   Brand colors then override the preset's identity colors exactly. */
function pickPreset(intake) {
  const voice = (intake.identity.voice || 'elite').toLowerCase();
  const mood  = (intake.brand.background_mood || 'split').toLowerCase();
  const byVoice = {
    elite:     'black-gold-premium',  // classic font, premium/dark
    'pro-style':'college-showcase',   // classic font, showcase
    grit:      'red-black-battle',    // aggressive font, battle
    aggressive:'aggressive-elite',
    scrappy:   'aggressive-elite',
    underdog:  'red-black-battle',
    family:    'bright-family',       // rounded font, warm
    fun:       'youth-development',
    custom:    'clean-modern',
  };
  let base = byVoice[voice] || 'clean-modern';
  // honor a hard "light" mood by nudging off dark-biased bases
  if (mood === 'light' && PRESETS[base].dark) base = 'college-showcase';
  return base;
}

function buildTokens(intake, presetOverride) {
  const name = presetOverride || pickPreset(intake);
  const p = PRESETS[name];
  const primary = intake.brand.primary_color && intake.brand.primary_color.startsWith('#') ? intake.brand.primary_color : p.primary;
  const secondary = intake.brand.accent_color && intake.brand.accent_color.startsWith('#') ? intake.brand.accent_color : p.secondary;
  const accent = '#FFFFFF';
  const font = FONTS[p.font];

  const light = {
    primary, primaryStrong: mix(primary,'#000000',0.15),
    secondary, secondaryStrong: mix(secondary,'#000000',0.12),
    accent, text:'#161A22', textMuted: rgba('#161A22',0.66),
    pageBg: mix(primary,'#FFFFFF',0.96), sectionSoft: rgba(primary,0.06),
    card:'#FFFFFF', border: rgba('#161A22',0.12),
    navBg:'rgba(255,255,255,0.92)', footerBg: primary, footerText:'rgba(255,255,255,0.72)',
    heroBg:`linear-gradient(135deg, ${primary} 0%, ${mix(primary,'#000000',0.18)} 100%)`,
    heroText:'#FFFFFF', heroAccent: secondary, glow: rgba(primary,0.18),
    onPrimary: readable(primary), onSecondary: readable(secondary),
  };
  const darkPrimary = mix(primary,'#FFFFFF',0.18);
  const dark = {
    primary: darkPrimary, primaryStrong: primary,
    secondary, secondaryStrong: mix(secondary,'#000000',0.10),
    accent, text:'#F4F6FB', textMuted:'rgba(244,246,251,0.70)',
    pageBg:'#0A0E17', sectionSoft: rgba(primary,0.08),
    card:'rgba(20,28,46,0.85)', border: rgba(primary,0.24),
    navBg:'rgba(8,12,20,0.90)', footerBg:'#06090F', footerText:'rgba(255,255,255,0.62)',
    heroBg:`linear-gradient(135deg, #0A0E17 0%, ${mix(primary,'#000000',0.55)} 50%, #0A0E17 100%)`,
    heroText:'#FFFFFF', heroAccent: secondary, glow: rgba(primary,0.40),
    onPrimary: readable(darkPrimary), onSecondary: readable(secondary),
  };
  return {
    $comment: `Generated by intake-to-build.js from ${intake.identity.team_name} intake (voice="${intake.identity.voice}", base preset="${name}"). Brand colors overridden from intake.brand.`,
    preset: name, fonts: { display: font.display, body: font.body, googleFontsHref: font.href },
    scales: SCALES, light, dark,
  };
}

/* ---------- 2. CONTENT MAPPING (governance-grade) ---------- */
const FIREWALL_DEFAULT = "Parents may not pressure coaches about playing time, lineup, or family absences. Non-coaching concerns route to the Co-Directors. Coaches are protected from politics — and from disputes that aren't softball. Both directions of the firewall are enforced.";
const FAMILY_FIRST_DEFAULT = "Coaches and staff are parents too. Their kids' lives don't compete with the team. When a coach has a family conflict, staff coverage keeps the field running. Schedules are surfaced monthly; absences are expected, planned for, and never criticized.";
const COACH_WAIVER_DEFAULT = "Head coach's children: dues fully waived. Assistant coaches' children: dues fully waived. One child per coach.";

const VOICE_ABOUT = {
  elite:   "We don't recruit for this season — we develop for the next level. Operations are owned by directors so coaches own the field, and every athlete gets a real plan she's held to with care.",
  family:  "We're a family-first organization with a serious standard. Coaches are protected to coach, families always know how the team is run, and every player is developed — not just rostered.",
  grit:    "Hard-nosed, accountable, and developed on purpose. Directors carry the operations so coaches carry the field, and every rep has a reason behind it.",
  'pro-style': "Run like a small program, not a group text. Clear tiers, real development plans, and a governance model families can read top to bottom.",
};

function mapConfig(intake, tokens) {
  const id = intake.identity, br = intake.brand, gov = intake.governance || {}, co = intake.coaching || {},
        ops = intake.operations || {}, ros = intake.roster || {}, plat = intake.platform || {}, ct = intake.contact || {};
  const slug = id.team_name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const firewall = co.firewall_policy === 'custom' ? (co.firewall_custom_text || FIREWALL_DEFAULT) : FIREWALL_DEFAULT;
  const familyFirst = co.family_first_policy === 'custom' ? (co.family_first_custom_text || FAMILY_FIRST_DEFAULT) : FAMILY_FIRST_DEFAULT;
  const waivers = ops.coach_waivers === 'custom' ? (ops.coach_waivers_custom || COACH_WAIVER_DEFAULT) : COACH_WAIVER_DEFAULT;

  return {
    "$comment": "Generated by intake-to-build.js (Rally-ORG). Governance-grade content from the Org-Site Kit intake, rendered by the softball engine. Edit freely; re-run the bridge to regenerate from intake.json.",
    organization: {
      name: id.team_name, nickname: id.team_name, ageGroup: id.age_division,
      season: `${new Date().getFullYear()} Season`, tagline: id.tagline || "",
      location: `${id.city}, ${id.state}`, circuits: id.sanctioning || [],
    },
    branding: {
      logo: br.logo_status === 'provided' ? `/images/logos/${slug}-logo.png` : "",
      logoFallbackWordmark: br.logo_status !== 'provided',
      logoAlt: `${id.team_name} logo`, favicon: "",
      heroImage: "", heroImageAlt: `${id.team_name} on the field`,
      preset: tokens.preset, logoDescription: br.logo_description || "",
    },
    nav: {
      ctaLabel: "Recruiting / Tryouts", ctaHref: "#contact",
      links: [
        { label: "About", href: "#about" },
        { label: "Governance", href: "#governance" },
        { label: "Coaching", href: "#coaching" },
        { label: "Finances", href: "#finances" },
        { label: "Roster", href: "#roster" },
        { label: "Platform", href: "#platform" },
        { label: "Support", href: "#support" },
        { label: "Contact", href: "#contact" },
      ],
    },
    hero: {
      kicker: `${id.city}, ${id.state} • ${id.age_division} ${id.sport} • ${(id.sanctioning||[]).join(' / ')}`,
      title: id.team_name, subtitle: "How we run — in public.",
      primaryCta: { label: "Read the governance", href: "#governance" },
      secondaryCta: { label: "Recruiting / Tryouts", href: "#contact" },
    },
    recruitingStrip: { enabled: true, items: [`${new Date().getFullYear()} Season`, "Coaches Protected", "Family First", "Players Developed"] },
    about: {
      enabled: true, heading: id.tagline || "How we run",
      subtitle: `A governance-grade ${id.age_division} ${id.sport} organization in ${id.city}, ${id.state}.`,
      body: [
        VOICE_ABOUT[id.voice] || VOICE_ABOUT.elite,
        "This site is a public governance document, not a marketing page. Every question a parent or sponsor might ask about how we operate has a page: who runs what, where the money goes, how your athlete is protected, and how to reach the right person."
      ],
      pillars: [
        { icon: "🛡️", title: "Coaches Coach", text: "Coaching authority is firewalled from administrative burden. Coaches own the field; directors own everything else." },
        { icon: "👪", title: "Family First", text: "Coaches are parents too. The org is built so a coach can attend her own kid's game without the team skipping a beat." },
        { icon: "📖", title: "Trust By Reading", text: "Every governance question has a page. Trust is built through transparency, not assurance." },
      ],
    },
    /* ----- GOVERNANCE: the four-tier model ----- */
    governance: {
      enabled: true, heading: "Governance", subtitle: "Four tiers. Two firewalls. Everything in public.",
      tiers: [
        { tier: "1 — Executive", body: "Co-Directors", owns: "Strategy, brand, finances, schedules, communications, sponsorships.", notOwns: "Lineups, playing time, on-field decisions.",
          people: (gov.executive?.directors || []).map(d => ({ name: d.name, detail: (d.domains||[]).join(' · ') })) },
        { tier: "2 — Board of Directors", body: `${gov.board?.seat_count ?? 0} voting members`, owns: "Policy, governance, conflict resolution, formal votes, bylaws.", notOwns: "Day-to-day org operations.",
          people: (gov.board?.seats || []).map(s => ({ name: s.name, detail: s.represents })) },
        { tier: "3 — Coaching Staff", body: "Head Coach + Assistants", owns: "Lineups, development, strategy, rotations. Final on-field authority.", notOwns: "Dues, paperwork, parent logistics, scheduling.",
          people: (co.head_coaches||[]).map(h=>({name:h.name, detail:"Head Coach"})).concat((co.assistants||[]).map(a=>({name:a.name, detail:a.focus}))) },
        { tier: "4 — Operations Staff", body: "Team ops", owns: "Game-day ops, GameChanger, travel, fundraising execution.", notOwns: "Voting, organizational direction.",
          people: (ops.ops_staff||[]).map(o=>({name:o.name, detail:o.role})) },
      ],
      board: {
        votingCadence: gov.board?.voting_cadence || "As-needed",
        quorum: gov.board?.quorum || "2 of 3 voting members present",
        decisionDomains: gov.board?.decision_domains || [],
      },
    },
    /* ----- COACHING + the two firewalls ----- */
    coaching: {
      enabled: true, heading: "Coaching",
      model: co.model || "single_head",
      philosophy: co.philosophy || "",
      staff: (co.head_coaches||[]).map(h => ({ name: h.name, role: "Head Coach", bio: h.bio || "", background: h.background || "", years: h.years ?? null }))
              .concat((co.assistants||[]).map(a => ({ name: a.name, role: `Assistant — ${a.focus}`, bio: "", background: "", years: null }))),
      firewall: { title: "The Coaching Firewall", text: firewall },
      familyFirst: { title: "The Family-First Coverage Policy", text: familyFirst },
    },
    /* ----- FINANCES ----- */
    finances: {
      enabled: true, heading: "Finances",
      annualDues: ops.annual_dues || "TBD",
      duesCovers: ops.dues_covers || [],
      coachWaivers: waivers,
      note: "Where the money goes, who signs, and what it costs — on a public page, by design.",
    },
    /* ----- ROSTER: consent-gated (privacy default) ----- */
    roster: {
      enabled: true, format: "gamechanger",
      note: `Roster shown in GameChanger format (first name + last initial + jersey). Photos and individual profile pages activate per player ONLY when a signed parent media release scoped to public web display is on file. Media release status: ${ros.media_release_status === 'have' ? 'on file' : 'being drafted before launch'}.`,
      consentDefault: "first_name_last_initial",
      mediaReleaseStatus: ros.media_release_status || "needs_drafting",
      players: (ros.players||[]).map(p => ({
        firstName: p.first, lastInitial: p.last_initial, number: String(p.number),
        slug: p.slug, positions: [], photo: `/images/players/${p.slug}.jpg`, photoAlt: "",
        live: false, profileUrl: "",
      })),
    },
    /* ----- PLATFORM: Rally-IQ ----- */
    platform: {
      enabled: true, pageType: plat.page_type || "tech_stack",
      heading: plat.page_type === 'rallyiq' ? "Powered by Rally-IQ" : "Tech Stack",
      statsApp: plat.stats_app || "", commApp: plat.comm_app || "",
      sanctioning: plat.sanctioning_platforms || [],
      rallyiqModules: (plat.rallyiq_modules || []).map(m => ({
        name: `Rally-IQ ${m}`,
        text: ({
          Coach: "Practice planning, player notes, development summaries.",
          Teams: "Roster, schedule, tournaments, parent communication.",
          Profiles: "Athlete pages, video, recruiting snapshots.",
          Fundraise: "Sponsors, boosters, donation campaigns.",
          Scout: "Roster intelligence, competitor monitoring, tryout pipeline.",
          Org: "Multi-team dashboard, financial reporting, sponsor portal.",
        })[m] || "",
      })),
    },
    /* ----- SUPPORT / sponsors ----- */
    support: {
      enabled: true, heading: "Support Us",
      subtitle: "How sponsors and supporters help — and what they get.",
      tiers: (ops.fundraising_tiers||[]).map(t => ({ tier: t.tier, amount: t.amount, benefits: t.benefits || [] })),
      partners: br.partners || [],
    },
    /* ----- DOCUMENTS ----- */
    documents: { enabled: true, heading: "Documents", items: (intake.documents||[]).map(d => ({ title: d.title, format: d.format, description: d.description })) },
    /* ----- CONTACT: tier-routed ----- */
    contact: {
      enabled: true, heading: "Contact",
      note: "Parents → Co-Directors. Coaching questions → coaching staff. Tryouts/recruiting → the recruiting handler (not the head coach).",
      primaryName: ct.primary_name || "", primaryEmail: ct.primary_email || "", primaryPhone: ct.primary_phone || "",
      publicEmail: ct.public_email || "", tryoutsHandler: ct.tryouts_handler || "",
      social: socialLinks(ct.social),
    },
    footer: { tagline: id.tagline || "", builtWith: "Built on Rally-ORG • Powered by Rally-IQ" },
  };
}

/* Intake stores social as {instagram:'@handle', ...}; the engine renders an
   array of {platform, url}. Handles may be @names, bare names, or full URLs. */
function socialLinks(social){
  const hosts = { instagram:'instagram.com', facebook:'facebook.com', twitter:'x.com', x:'x.com', tiktok:'tiktok.com', youtube:'youtube.com' };
  return Object.entries(social || {})
    .filter(([,v]) => v)
    .map(([platform, v]) => {
      const handle = String(v).trim();
      const url = /^https?:\/\//i.test(handle)
        ? handle
        : `https://${hosts[platform.toLowerCase()] || `${platform.toLowerCase()}.com`}/${handle.replace(/^@/, '')}`;
      return { platform: platform[0].toUpperCase() + platform.slice(1), url };
    });
}

/* ---------- 3. RUN ---------- */
function parseArgs(argv){ const out={_:[]}; for(let i=0;i<argv.length;i++){const a=argv[i]; if(a==='--preset') out.preset=argv[++i]; else if(a.startsWith('--')) out[a.slice(2)]=argv[++i]; else out._.push(a);} return out; }
function main(){
  const args = parseArgs(process.argv.slice(2));
  const intakePath = args._[0];
  if (!intakePath) { console.error('Usage: node scripts/intake-to-build.js <intake.json> [--preset <name>]'); process.exit(1); }
  const intake = JSON.parse(fs.readFileSync(intakePath,'utf8'));
  const tokens = buildTokens(intake, args.preset);
  const config = mapConfig(intake, tokens);
  const cfgDir = path.join(__dirname, '..', 'src', 'config');
  fs.writeFileSync(path.join(cfgDir,'theme.tokens.json'), JSON.stringify(tokens,null,2)+'\n');
  fs.writeFileSync(path.join(cfgDir,'org.config.json'), JSON.stringify(config,null,2)+'\n');
  console.log(`✔ Bridged "${intake.identity.team_name}"`);
  console.log(`  → theme.tokens.json  (base preset "${tokens.preset}", primary ${tokens.light.primary} / secondary ${tokens.light.secondary})`);
  console.log(`  → org.config.json    (governance: ${ (config.governance.tiers||[]).length } tiers, roster: ${config.roster.players.length} players, platform: ${config.platform.pageType})`);
  console.log('  Next: node scripts/validate-config.js  → then  npx serve .');
}
main();
