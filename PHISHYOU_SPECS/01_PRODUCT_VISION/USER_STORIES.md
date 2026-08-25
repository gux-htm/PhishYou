# PhishYou: User Stories

---

## Overview

User stories follow the standard format with traceable acceptance criteria (see `ACCEPTANCE_CRITERIA.md`). Stories are grouped by persona and prioritized MoSCoW (Must / Should / Could).

---

## Persona 1: CISO / Security Manager (Primary Buyer)

### US-01: Launch a multi-channel campaign (Must)
**As a** CISO,  
**I want to** launch a persistent social engineering simulation against my finance team over WhatsApp and Email,  
**so that** I can measure whether they follow payment-verification policy under realistic pressure.

**Acceptance:**
- Campaign creation takes ≤5 minutes: select targets, persona, platforms, triggers, duration
- AI generates platform-appropriate opening messages without manual writing
- Campaign starts only after consent attestation is confirmed on file
- Maps to: AC-1.1, AC-1.4, AC-8.1

### US-02: Watch the attack unfold in real time (Must)
**As a** Security Manager,  
**I want to** see live conversation feeds with resistance scores and current tactic,  
**so that** I can intervene if a simulation goes off the rails and learn what's working.

**Acceptance:**
- Dashboard updates within 5 seconds of each message
- Live feed shows target message, AI response, resistance score, tactic label
- Admin halt button stops all messaging within 10 seconds
- Maps to: AC-7.1, AC-3.4

### US-03: Get an actionable After Action Report (Must)
**As a** CISO,  
**I want** an AAR after each campaign showing who fell for what, why, and which policies failed,  
**so that** I can present board-level evidence of human risk and justify training budget.

**Acceptance:**
- AAR auto-generates within 5 minutes of campaign end
- Contains behavioral timeline, trigger effectiveness, policy gaps, coaching recommendations
- Exportable as PDF for board presentation
- Maps to: AC-7.2, AC-7.3

### US-04: Choose persistence intensity (Must)
**As a** CISO,  
**I want to** select Tier A/B/C persistence per campaign,  
**so that** I can match simulation intensity to our risk tolerance and legal posture.

**Acceptance:**
- Tier selection is mandatory at campaign creation; defaults to C
- Tier limits enforced exactly per `PERSISTENCE_TIERS.md`
- Tier upgrades allowed mid-campaign; downgrades rejected
- Maps to: AC-5.1–5.5

### US-05: Benchmark across departments and time (Should)
**As a** CISO,  
**I want to** compare resilience scores across departments and against previous campaigns,  
**so that** I can prove improvement quarter over quarter.

**Acceptance:**
- Analytics shows individual, department, company, and industry comparison
- Historical trend view across campaigns
- Maps to: AC-7.3, AC-7.4

---

## Persona 2: Security Awareness / L&D Lead

### US-06: Deliver targeted coaching (Must)
**As a** training lead,  
**I want** per-employee coaching recommendations based on which triggers broke their defenses,  
**so that** training is personalized instead of generic.

**Acceptance:**
- AAR coaching section names the exact trigger/tactic that succeeded
- Recommends specific training modules (verification protocol, urgency awareness)
- Maps to: AC-7.3, AC-7.5

### US-07: Schedule recurring campaigns (Should)
**As a** training lead,  
**I want to** schedule quarterly campaigns with rotating personas and channels,  
**so that** employees can't memorize previous attack patterns.

**Acceptance:**
- Campaign templates save and re-run with new persona seeds
- Recommendation engine suggests next vector based on previous weaknesses
- Maps to: AC-7.5

---

## Persona 3: Employee (Simulation Target)

### US-08: Know my rights before being targeted (Must)
**As an** employee,  
**I want to** have signed the consent form and know simulations may occur,  
**so that** I'm never ambushed by a program I didn't agree to.

**Acceptance:**
- No targeting without signed organizational + employee consent on file
- Exemption categories honored (medical, occupational, legal, temporary)
- Maps to: AC-8.1, AC-8.2

### US-09: Pause or exit at any time (Must)
**As an** employee,  
**I want to** pause the simulation (Tier B/C) or block the sender and be respected,  
**so that** I retain agency during the exercise.

**Acceptance:**
- "Pause" keyword honored per tier rules; block ends engagement on that platform permanently
- Distress signals trigger support contact info (Tier B with detection enabled, Tier C always)
- Maps to: AC-5.2–5.4, AC-8.6

### US-10: Get a proper debrief (Must)
**As an** employee,  
**I want** a clear debrief within 24 hours explaining what happened and what I did well,  
**so that** the experience becomes learning, not anxiety.

**Acceptance:**
- Debrief delivered ≤24h after campaign end
- Highlights defensive successes, not just failures
- Includes EAP/HR contact information
- Maps to: AC-8.4

---

## Persona 4: Board / C-Suite Executive

### US-11: Quantify human risk (Should)
**As a** board member,  
**I want** a human-risk score with trend data,  
**so that** I can oversee cyber risk the same way I oversee financial risk.

**Acceptance:**
- Org-level risk score computed from campaign results
- YoY improvement measurable in percentage terms
- Maps to: AC-7.3, AC-7.4

---

## Story Map Summary

| Priority | Count | Coverage |
|----------|-------|----------|
| Must | 8 | MVP scope (hackathon demo) |
| Should | 3 | Post-MVP quarter 1 |
| Could | 0 | Backlog |

MVP demo path: **US-01 → US-02 → US-03 → US-10** (launch → observe → report → debrief).

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
