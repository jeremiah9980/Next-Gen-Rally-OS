# Org-Site Kit

A reusable system for spinning up youth select-sports org websites. Three documents:

| File | What it is | Read first if you are... |
|---|---|---|
| `ORG_SITE_BREAKDOWN.md` | Architectural breakdown of the org-site model. The four-tier governance pattern, the design system, the consent architecture. | Building or evaluating the system. |
| `INTAKE_PROMPT.md` | AI system prompt that runs a guided intake conversation with an org stakeholder. Produces a JSON spec at the end. | Running an intake for a new team. |
| `INTAKE_SCHEMA.json` | JSON Schema (draft-07) for the intake output. The contract between intake and build. | Wiring the intake into automation or building a site programmatically from the spec. |

## Workflow

```
Stakeholder              AI (Rally)                     Builder
    │                        │                             │
    │  paste INTAKE_PROMPT   │                             │
    │ ──────────────────────►│                             │
    │                        │                             │
    │  ◄── Phase 1: identity                              │
    │  ──► answers ──────────►                             │
    │  ◄── Phase 2: brand                                 │
    │  ──► answers ──────────►                             │
    │       ... 9 phases ...                              │
    │  ◄── intake.json (validated against INTAKE_SCHEMA)  │
    │                        │                             │
    │  save intake.json       │                             │
    │ ────────────────────────┼────────────────────────────►
    │                                                       │
    │                              produces /team-folder/   │
    │  ◄────────────────────────────────────────────────────│
    │  ready-to-deploy site                                 │
    │                                                       │
```

## Versioning

`INTAKE_SCHEMA.json` is at `schema_version: "1.0"`. Bump when you extend the intake so builders know which fields to expect.

## Built on

The org-site model is proven across **Bananas 2K15** (blue/gold, 12U softball, Georgetown TX) and **Texas Venom** (purple/lime, 10U softball, Leander TX). Both sites are live and parent-facing.
