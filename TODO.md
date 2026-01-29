# TODO.md

> Scope  
> This TODO list is derived strictly from **Problem.md**, **Solution.md**, and **PRD.md**.  
> It reflects an **emergency-response web app** with two core capabilities:
> - Real-time action guidance during emergencies
> - Family- & incident-aware preparedness that converts into action  
>
> Platform: **Responsive web app** usable on **phones and computers** (not mobile-only), while still supporting stress-mode usability.

---

## Core Setup
- [ ] Scaffold Next.js 14 app (App Router)
- [ ] TypeScript strict mode enabled
- [ ] Setup Tailwind CSS
- [ ] Responsive layout foundation (mobile + tablet + desktop)
- [ ] Define design tokens for:
  - [ ] Stress mode (high clarity, minimal noise)
  - [ ] Desktop mode (scan-friendly, efficient layout)
- [ ] Environment config (`.env.example`, runtime validation)

---

## Layout & Responsiveness
- [ ] Define responsive breakpoints + layout rules (mobile / tablet / desktop)
- [ ] Desktop-first affordances where appropriate (side-by-side panels, more visible context)
- [ ] Mobile-first stress affordances preserved (large tap targets, minimal choices)
- [ ] Keyboard + pointer input support (desktop usability)
- [ ] Accessibility baseline across form factors (contrast, focus states, ARIA labels)

---

## Navigation & App Structure
- [ ] Define top-level routes
  - [ ] `/` — Entry / Home
  - [ ] `/prepare` — Preparedness (Capability B)
  - [ ] `/emergency` — Emergency Session (Capability A)
  - [ ] `/docs` — Problem / Solution / PRD
- [ ] Persistent global shell that adapts by device
- [ ] Emergency-first routing rules (fast access, minimal clicks)
- [ ] Deep-link support to start an emergency session quickly

---

## Household & Context Modeling
- [ ] Define Household model
- [ ] Define Family Member model
  - [ ] Adult / Child / Infant classification
  - [ ] Required attributes only (no medical overreach)
- [ ] Household creation flow (low-friction, progressive)
- [ ] Edit / update household composition (desktop + mobile optimized)
- [ ] Data persistence strategy (anonymous-first, upgradeable)

---

## Capability B — Family- & Incident-Aware Preparedness

### Incident Modeling
- [ ] Define initial “Incident Set” (common, repeatable emergencies only)
- [ ] Document scope boundaries (explicit out-of-scope incidents)
- [ ] Map incident relevance by family composition

### Preparedness State
- [ ] Define Preparedness State schema
  - [ ] Medications
  - [ ] Kits / supplies
  - [ ] Notes / limitations
- [ ] Household → Preparedness State linkage
- [ ] Preparedness completeness evaluation logic

### Guidance & Gap Awareness
- [ ] Generate preparedness guidance based on:
  - [ ] Family composition
  - [ ] Likely incident set
- [ ] Identify missing or misaligned preparedness items
- [ ] Present preparation priorities (not exhaustive lists)
- [ ] Preparedness review flow (confirm, adjust, revisit)
- [ ] Desktop mode: support faster review (scan, edit, compare)
- [ ] Mobile mode: support low-friction updates (minimal input)

### Activation Readiness
- [ ] Ensure Preparedness State can be activated during emergencies
- [ ] Define handoff logic from Preparedness → Emergency Session
- [ ] Preparedness summary view (for caregiver alignment; desktop-friendly)

---

## Capability A — Real-Time Emergency Action Guidance

### Emergency Session Lifecycle
- [ ] Define Emergency Session model
- [ ] Session start flow (minimal friction)
- [ ] Session end + summary state
- [ ] Safe recovery path after session completion

### Action Guidance Logic
- [ ] Define action step structure (ordered, atomic, unambiguous)
- [ ] Prioritization rules (what comes first, always)
- [ ] Guardrails for uncertainty or escalation scenarios
- [ ] Clear “when to seek professional help” boundaries

### Cross-Device Interaction
- [ ] Mobile: one-handed interaction constraints supported
- [ ] Desktop: keyboard navigation supported (enter/space/arrow)
- [ ] Clear, readable layout on large screens (no tiny centered column only)
- [ ] Latency budget definition (seconds matter) + loading states

---

## Trust, Safety & Governance
- [ ] Content authority policy (who approves emergency guidance)
- [ ] Safety disclaimers placement (visible but not distracting)
- [ ] Guidance confidence language standards
- [ ] Audit logging for emergency sessions (non-sensitive)
- [ ] Clear statement of non-replacement of emergency services

---

## Data & Backend
- [ ] Database schema for:
  - [ ] Households
  - [ ] Family members
  - [ ] Preparedness state
  - [ ] Incident mappings
  - [ ] Emergency sessions
- [ ] Server actions / API routes
- [ ] Access control rules (household-scoped)
- [ ] Data retention & deletion policy

---

## UX & Accessibility
- [ ] Stress-mode UI checklist (applies on both mobile + desktop)
- [ ] Accessibility baseline (contrast, labels, focus order)
- [ ] Empty states for:
  - [ ] No household
  - [ ] No preparedness
  - [ ] First emergency use
- [ ] Localization readiness (KR / EN)

---

## Docs & Internal Alignment
- [ ] `/docs` route implementation
- [ ] Render Markdown files:
  - [ ] problem.md
  - [ ] solution.md
  - [ ] prd.md
  - [ ] todo.md
- [ ] Add “How this service works” narrative doc
- [ ] Add “Safety & trust model” doc

---

## Testing & Validation
- [ ] Unit tests for:
  - [ ] Incident relevance logic
  - [ ] Preparedness gap detection
- [ ] E2E tests for:
  - [ ] Household setup (mobile + desktop)
  - [ ] Preparedness flow (mobile + desktop)
  - [ ] Emergency session start → actions → end (mobile + desktop)
- [ ] Cross-browser QA (Chrome/Safari/Edge)
- [ ] Responsive QA checklist (common screen sizes)

---

## Deployment & Ops
- [ ] Ensure Vercel build passes
- [ ] Runtime error monitoring
- [ ] Performance monitoring (emergency session latency)
- [ ] Add README (local dev → deploy)
- [ ] Add STATUS.md for progress tracking

---

## Ongoing Product Discipline
- [ ] Weekly check: does this reduce panic + speed up action across devices?
- [ ] Monthly scope audit (prevent feature creep)
- [ ] Validate assumptions with user interviews