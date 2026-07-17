# The Org-Site Model — Architectural Breakdown

> A reusable architecture for youth select-sports organizational websites.
> Built and proven across **Bananas 2K15** and **Texas Venom**. Generalizable
> to any youth sports org (softball, baseball, soccer, basketball, volleyball, lacrosse).

---

## 1. What this site is — and what it isn't

A team org-site in this model **is not a marketing site**. It's a **public governance document** aimed at parents, prospective families, sponsors, and recruiting coaches. The job it does:

> *"This is how we run. Here is who is in charge of what. Here is where the money goes. Here is how your daughter is protected. Here is how you reach us."*

If a parent has a question about how the team operates, the answer is on a page. The site does the work of a parent handbook + an org chart + a sponsor deck + a contact form — all in one durable, branded surface.

### Three operating principles that the architecture enforces

1. **Coaches coach.** Coaching authority is firewalled from administrative burden. Coaches own the field. Directors own everything else.
2. **Family first.** Coaches and staff are parents. Their kids' lives don't compete with the team. The org is structured so a coach can attend her own child's game without the team skipping a beat.
3. **Parents trust by reading.** Every governance question a parent might ask should have a page. Trust is built through transparency, not assurance.

These three principles drive every page in the site.

---

## 2. The four-tier organizational model

Every page on the site maps to a tier in this model. Articulating the tier-set is the first move any new org makes.

| Tier | Body | What it owns | What it does NOT own |
|---|---|---|---|
| **1 — Executive** | Co-Directors | All organizational functions. Strategy, brand, finances, schedules, communications, sponsorships. | Lineups, playing time, on-field decisions. |
| **2 — Board of Directors** | Voting members (typically 3) | Policy, governance, conflict resolution, formal votes. Bylaws ratification. | Day-to-day org operations. |
| **3 — Coaching Staff** | Head Coach + Assistants | Lineups, development, strategy, rotations. Final on-field authority. | Dues, paperwork, parent logistics, scheduling negotiation. |
| **4 — Operations Staff** | Team Mom, Scorekeeper, Travel, Fundraising | Game-day ops, GameChanger, travel logistics, fundraising execution. | Voting, organizational direction. |

Two firewalls separate the tiers:

- **The Coaching Firewall.** Parents may not pressure coaches about playing time, lineup, or family absences. All non-coaching concerns route to Co-Directors. Coaches don't see disputes that aren't softball; directors don't decide who plays shortstop. Both sides are protected.
- **The Family-First Coverage Policy.** When a coach has a conflict with her own child's events, staff coverage keeps the field running. Schedules are surfaced monthly. Absences are expected, planned for, and never criticized — by board-level commitment.

These two firewalls show up on the **Coaching** and **Policies** pages, and they're referenced in the **Bylaws**.

---

## 3. Page architecture — what each page is for

Eleven core pages plus two engagement pages. Every page exists to answer one specific question a parent or sponsor might have:

| Page | Question it answers | Tier(s) served |
|---|---|---|
| **Home** (`index.html`) | "What is this team and how does it work at a glance?" | Identity + summary of tiers 1–4 |
| **About** | "What's the program's origin, values, and full org structure?" | Tiers 1–4 narrative + diagram |
| **Board** | "Who votes? Who represents whom? How are decisions made?" | Tier 2 detail |
| **Coaching** | "Who coaches? What's the model? How is my coach protected from politics?" | Tier 3 detail + firewall policy |
| **Bylaws** | "What are the formal rules?" | Governance instrument |
| **Finances** | "Where does the money go? Who signs? What does it cost?" | Tier 1 detail + signatories |
| **Policies** | "What are the family-first, conduct, and conflict policies?" | Cross-tier policy detail |
| **Documents** | "Where can I download the actual forms and packets?" | Document repository |
| **Support Us** (`fundraising.html`) | "How do sponsors and supporters help, and what do they get?" | Engagement layer |
| **Platform** (`rallyiq.html`) | "What tech runs the org? Where does the program scale?" | Platform layer (optional) |
| **Roster** | "Who's on the team this season?" | Engagement layer, consent-gated |
| **Player Profile** template | "Per-player snapshot, on parent release only." | Engagement layer, consent-gated |
| **Contact** | "How do I reach the right person?" | Engagement entry point |

A team can ship with as few as 6 of these (Home, About, Coaching, Policies, Roster, Contact) and add the others as the org matures. The four-tier model is the spine; the page list is how it shows up on the web.

---

## 4. The design system

The visual system is **two layers**: a neutral shared system, and a per-team skin. This is the magic that lets one codebase produce Bananas (blue/gold) and Venom (purple/lime) without duplicating components.

### Shared: `assets/css/style.css`
The neutral system. Defines components: `.hero`, `.gold-strip`, `.section`, `.card`, `.card-grid`, `.badge`, `.callout`, `.vote-table`, `.doc-item`, `.footer-brand`, and the nav. Uses CSS custom properties for color: `--blue`, `--yellow`, `--ink`, `--g1..g5`, `--off-white`, `--white`.

### Per-team skin: `assets/css/team-<name>.css`
The team brand. **Remaps the shared variables at body scope**:

```css
body.venom-page{
  --blue:#6D28D9;   /* primary recolors */
  --yellow:#C6FF00; /* accent recolors */
  --blue-l:#F1EAFE; /* light backgrounds */
  --yellow-l:#F5FFD9;
  ...
}
```

Because every shared component references `var(--blue)` and `var(--yellow)` (including inline styles), this single remap recolors the entire site — heroes, footers, cards, tables, callouts, buttons, badges. **No component-level edits required to skin a new team.** Just write a 20-line skin file.

### Type stack (shared across all teams)
- **Display:** `Anton` — heavy condensed for big wordmarks and stat values
- **Headlines:** `Oswald` italic — section heads with slash accents
- **Body:** `Barlow Semi Condensed` — clean athletic body type

The same type system works across radically different brand palettes because the components define hierarchy, the skin defines color.

### Nav
A single `assets/js/nav.js` injects the navbar on every page. Each team's nav links are relative (`about.html`, not `/team/about.html`), so the entire folder is portable — drop it into any GitHub Pages repo path and it works.

### Asset folder layout

```
team-folder/
├── assets/
│   ├── css/
│   │   ├── style.css           (shared, never team-specific)
│   │   └── team-<name>.css     (the skin)
│   ├── js/
│   │   └── nav.js              (relative-link nav)
│   ├── <name>-logo.jpg         (the team mark)
│   └── players/                (consent-gated; see §6)
├── docs/                       (downloadable bylaws/policies/forms)
├── index.html, about.html, board.html, coaching.html,
├── bylaws.html, finances.html, policies.html, docs.html,
├── fundraising.html, rallyiq.html, contact.html,
├── roster.html
└── player-profile.html         (template)
```

---

## 5. Privacy & consent architecture

This is the part of the system that distinguishes a thoughtful youth-sports site from a sloppy one. **The default for everything about minor players is private. Visibility activates per parent media-release.**

### Three consent gates

1. **Roster card photos.** Each roster card has a photo slot at `assets/players/<slug>.jpg`. If the file exists, the card shows the photo. If not, the card shows a styled jersey-number fallback. Removal is `rm assets/players/<slug>.jpg`.
2. **Profile pages.** A player profile only exists if `<slug>.html` exists in the folder. The roster CTA stays disabled (`Coming Soon`) until the slug is added to the `LIVE_PROFILES` JS array on the roster page. Removal is delete the file + remove from the array.
3. **Photo provenance.** All photos must be parent-cleared (provided or approved by the family). Photos are never pulled from third-party social.

### Slug convention

Every player has a stable slug: `<firstname>-<lastinitial>` (lowercase, hyphenated). The slug maps to:
- Roster card identity (`data-slug="aubrey-b"`)
- Photo path (`assets/players/aubrey-b.jpg`)
- Profile filename (`aubrey-b.html`)
- Profile photos (`aubrey-b-action-1.jpg`, etc.)

One identifier, four uses. Adding a player is mechanical.

### Public-facing name format

The roster page displays players as `Firstname L.` — matching GameChanger's own convention. Full last names appear **only on profile pages that the parent has consented to.** This is a deliberate default; orgs can override per family but should never invert the default.

### Family-controlled removal

At any time, a family can request removal. The team deletes `<slug>.html` and `assets/players/<slug>.jpg`, removes the slug from `LIVE_PROFILES`, and the roster card auto-reverts to the jersey-number fallback. No other edits required.

---

## 6. Platform integration layer (optional)

A team running this site model often pairs it with a software platform — in our reference builds, that's **RallyIQ** (formerly DugoutOS). The platform layer is documented on its own page (`rallyiq.html`) and exposes the modules a parent or sponsor would want to know about:

- **RallyIQ Coach** — practice planning, player notes, development summaries
- **RallyIQ Teams** — roster, schedule, tournament, parent communication
- **RallyIQ Profiles** — athlete pages, video, recruiting snapshots
- **RallyIQ Fundraise** — sponsors, boosters, donation campaigns
- **RallyIQ Scout** — roster intelligence, competitor monitoring, tryout pipeline
- **RallyIQ Org** — multi-team dashboard, financial reporting, sponsor portal

A team that doesn't run RallyIQ can drop this page or replace it with a generic "Tech Stack" page listing GameChanger, BAND, sanctioning bodies, etc. The architecture is platform-agnostic.

---

## 7. What makes this different from a typical youth sports site

| Typical youth team site | This model |
|---|---|
| Schedule + roster + photos | Schedule + roster + governance + finances + bylaws + policies |
| Coach as figurehead | Coach as protected role with explicit firewall |
| Dues asked for via email | Dues + waivers + signatories on a public page |
| Player photos everywhere by default | Player photos opt-in by default |
| Built once, abandoned | Per-team skin layer; scales to multi-team orgs |
| One contact form | Tier-routed contact (parents → directors, coaches → coaching staff) |

The cost of building this model is higher upfront (10+ pages of real org content). The payoff is a parent who reads the site and decides to commit her kid based on the substance — not the photos.

---

## 8. Build sequence (new org, zero to live)

1. **Intake** — run the `INTAKE_PROMPT.md` conversation with the org stakeholder. Output: `intake.json`.
2. **Skin** — generate `team-<name>.css` from the palette + logo in intake.
3. **Pages** — generate all 11 core pages from the intake content.
4. **Roster** — generate 12 (or N) placeholder cards in GameChanger format using the slug convention.
5. **Consent flow** — ship empty `assets/players/` with a README documenting the slot mechanic and removal flow.
6. **Deploy** — drop the folder into a GitHub Pages repo path. It's live.
7. **Onboard** — collect signed media releases per family as the season opens. Drop photos and profiles in per slug.

A team can go from intake to a deployed site in under an hour, with the consent gates correctly defaulted from the first commit.

---

*Built across Bananas 2K15 and Texas Venom. Reproducible for any youth sports org that wants to be governed in public.*
