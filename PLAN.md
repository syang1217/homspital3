# PLAN.md

> Purpose  
> This document translates **Problem.md**, **Solution.md**, **PRD.md**, and **TODO.md** into a **clear execution plan**.  
> It defines **what we will build first, why, and in what order**, while protecting focus on the core problem:
>
> **Helping people act correctly within seconds during emergencies, and ensuring preparation actually works.**

---

## 1. Product Strategy Snapshot

### Core Problem We Are Solving
People freeze, hesitate, or act incorrectly during emergencies because existing tools require searching, thinking, and judgment at the moment of highest panic.  
Preparation often fails because it is generic and disconnected from real-time action.

### Solution Shape
A **responsive web app** (desktop + mobile) with **two tightly integrated capabilities**:

1. **Capability A — Real-Time Action Guidance**  
   Help users take the correct action within seconds during an emergency.

2. **Capability B — Family- & Incident-Aware Preparedness**  
   Help users prepare appropriately for *their specific family* and *likely incidents*, so preparation converts into action.

---

## 2. Principles That Guide All Decisions

These principles override convenience, speed of development, and feature requests.

- **Seconds matter more than completeness**
- **Action beats information**
- **Preparation must activate, not sit idle**
- **One clear next step is better than many options**
- **Design for panic, then scale to calm**

If a decision violates these, we do not build it.

---

## 3. Phased Execution Plan

### Phase 0 — Alignment & Foundations (Internal Readiness)
**Goal:** Ensure the team is aligned before building anything substantial.

**Outcomes**
- Shared understanding of:
  - The single core problem
  - The two capabilities and their roles
- No feature creep before validation

**Deliverables**
- Finalized `Problem.md`, `Solution.md`, `PRD.md`
- This `PLAN.md`
- Initial `TODO.md` agreed upon

---

### Phase 1 — Capability B First: Preparedness That Actually Works
**Why first?**
- Preparation happens in calm moments
- Easier to validate with users
- Creates the context required for better emergency guidance later

**Primary Outcome**
Users prepare **the right things for the right people**, instead of generic kits.

**What Success Looks Like**
- A user with children prepares differently than a single adult
- Users understand *why* certain items matter
- Preparedness feels relevant and intentional

**Scope Focus**
- Household & family modeling
- Incident relevance mapping
- Preparedness guidance & gap awareness

**Explicitly Out of Scope**
- Emergency session flows
- Real-time panic interaction
- Advanced personalization

---

### Phase 2 — Capability A: Real-Time Emergency Action Guidance
**Why second?**
- Highest risk, highest responsibility
- Requires strong clarity on scope and trust
- Builds on preparedness context from Phase 1

**Primary Outcome**
During an emergency, users **act instead of freezing**.

**What Success Looks Like**
- Users take a correct first action within seconds
- Minimal interaction required
- Clear boundaries on when to seek professional help

**Scope Focus**
- Emergency session lifecycle
- Step-by-step action guidance
- Safety guardrails and escalation boundaries

**Explicitly Out of Scope**
- Education or training flows
- Post-event analytics for users
- Rare or specialized medical cases

---

### Phase 3 — Integration & Reliability
**Goal:** Make the system feel cohesive and trustworthy.

**Focus Areas**
- Seamless handoff from preparedness → emergency
- Consistent language, tone, and confidence
- Cross-device reliability (desktop + mobile)

**Outcomes**
- Users trust the system enough to rely on it
- Preparation clearly influences emergency guidance
- Fewer ambiguous or confusing moments

---

### Phase 4 — Validation & Iteration
**Goal:** Confirm real-world usefulness before expansion.

**Validation Questions**
- Does this reduce panic?
- Does it speed up correct action?
- Does preparation feel more worthwhile?

**Activities**
- User interviews
- Guided usability testing
- Edge-case reviews (family types, environments)

---

## 4. MVP Definition (Hard Line)

### MVP Includes
- Household + family composition
- Incident-aware preparedness guidance
- One clear emergency action flow for common scenarios
- Desktop + mobile responsive support
- Clear safety boundaries

### MVP Does NOT Include
- Deep medical education
- Rare emergency types
- Heavy customization
- Community or social features
- Gamification or tracking

---

## 5. Risks & Mitigation Plan

### Risk: Overloading users with “help”
**Mitigation:**  
Always present one next action, not multiple options.

### Risk: False sense of medical authority
**Mitigation:**  
Strong disclaimers, escalation guidance, conservative language.

### Risk: Feature creep
**Mitigation:**  
Monthly scope audit against Problem.md.

---

## 6. How We Measure Progress (Qualitative First)

Before metrics, we ask:
- “Did the user act faster?”
- “Did they feel less alone?”
- “Did preparation actually help?”

Quantitative metrics come later, after trust is earned.

---

## 7. Decision-Making Rules

When tradeoffs arise:
1. Favor **clarity over flexibility**
2. Favor **speed over completeness**
3. Favor **user calm over system cleverness**
4. Favor **trust over growth**

---

## 8. Next Immediate Steps

- Lock Phase 1 scope
- Start implementation strictly aligned with `TODO.md`
- Schedule first user validation checkpoints
- Revisit this plan only if the **problem changes**

---

> This plan exists to protect focus.  
> If we execute this well, the product earns the right to grow.
