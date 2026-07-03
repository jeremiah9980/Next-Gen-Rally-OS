# Predefined Coaching Content — Elite Softball 4-Year Mastermind

Rally-OS ships with a predefined practice / player / team development package:
a four-year curriculum taking a team from **10U foundation to 13U/14U elite
transition**.

## What's included

| Content | Count | Where it lands |
| --- | --- | --- |
| Drill bank (Baserunning, Fielding, Batting, Catching, Pitching, Bunting, Slapping, Team Defense) | 120 drills | Global `DrillLibrary` (`mm-library`), visible to every org |
| Two-hour practice plan templates (Y1-P01 … Y4-P12) | 48 plans | Global `PracticeTemplate` rows (`teamSeasonId = null`) |
| 4-year development roadmap (48-month curriculum, outcome standards, safety principles) | 1 doc | `docs/development-roadmap.md` |

Each drill carries: recommended stage (10U / 11U / 12U / 13U/14U), duration,
setup, objective, coaching cues, scoring standard, and a walk-through →
controlled → competitive → live progression. Each practice template carries the
full 120-minute block schedule (warm-up → throwing → install → four stations →
baserunning pressure → live competition → close), station standards, and coach
details.

## Seeding

```bash
pnpm db:seed:content     # idempotent — safe to re-run
```

The interactive installer (`pnpm run setup`) offers this step after the demo
seed. Content rows use fixed `mm-*` ids, so re-running updates in place and
never duplicates.

## How it feeds the product

- **AI practice planning**: the plan builder includes the global drill bank
  (name, category, duration) in its context, so generated practices draw on
  the curated drills alongside any team-specific drills.
- **Practice templates**: the 48 plans are stored in the same
  `PracticeTemplate` shape the AI builder saves (`blocks: {time, block,
  detail}[]`), so they render anywhere templates are listed.
- **Source tag**: all package content has `source: "package"`, distinguishing
  it from `"ai"`-generated and `"coach"`-authored rows.

## Content pipeline

Source material lives outside the repo (editable DOCX / printable PDF / visual
cards). The structured JSON in `packages/core-data/content/` was extracted
from the DOCX sources; to update content, regenerate those JSON files and
re-run the content seed.
