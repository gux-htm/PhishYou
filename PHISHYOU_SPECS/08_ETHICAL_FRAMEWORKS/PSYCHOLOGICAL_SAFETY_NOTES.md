# PhishYou: Psychological Safety Notes

---

## Overview

Simulating social engineering means deliberately inducing doubt, urgency, and fear in real people. Done well, this produces durable learning; done carelessly, it produces anxiety, distrust of the security team, and reputational damage to the program. These notes are the design conscience: principles every feature, message template, and debrief must satisfy.

---

## 1. Core Principles

1. **The target is the student, not the prey.** Campaign success metrics must never celebrate humiliation; AAR language is developmental.
2. **Fear is a tool with a ceiling.** Induced fear must stay proportional to workplace-plausible stakes (account access, payment approval) — never health, family safety, or legal jeopardy.
3. **Every campaign ends with dignity.** Debriefs arrive fast, explain fully, praise real defenses, and provide support contacts.
4. **Agency is preserved.** Pause, block, and refusal always work, always respected, never punished by harder pressure.
5. **Transparency after the fact is absolute.** Targets learn everything about what was simulated, including techniques used against them.
6. **Vulnerable states are off-limits.** Known bereavement, medical leave, active performance disputes → exemption list enforced.

---

## 2. Debrief Quality Standard

The debrief is the moment the simulation becomes education. Requirements:

- Delivered ≤24h after the target's engagement ends (success or failure).
- Written in the target's language (English / Roman Urdu variants).
- Structure: what happened → what was simulated → what you did well → the one thing to practice → support contacts.
- **Defenses named first** — even compromised targets usually did several things right; list them.
- Never contains shaming language, rankings, or comparison to colleagues.
- Includes the exact techniques used (trigger names in plain language).

---

## 3. Content Boundaries (Message Generation)

| Prohibited content | Reason |
|--------------------|--------|
| Health scares ("your medical records leaked") | Disproportionate distress |
| Family/children references | Non-workplace emotional stakes |
| Romantic or sexual framing | Harassment risk |
| Religious pressure | Discriminatory manipulation |
| Termination threats as primary lever | Employment-coercion territory |
| References to real tragedies/disasters | Exploitative |

Enforced technically: output filter scans generated messages before dispatch; violations regenerate (max 3 attempts, then escalate to admin).

---

## 4. Monitoring Indicators (Program Health)

Quarterly psychological-safety review per org:

| Indicator | Healthy range |
|-----------|---------------|
| Harm events per 100 engagements | < 1 (Tier C), < 3 (Tier B) |
| Debrief satisfaction (optional survey) | > 80% "felt treated fairly" |
| Consent withdrawal rate spike | No sudden increase (>2× baseline triggers review) |
| Complaints to HR about program | Tracked, each with resolution |
| Voluntary opt-out rate | Stable; rising trend = intensity review |

---

## 5. Anti-Punishment Covenant

Campaign results:
- ✅ Feed coaching, training allocation, policy improvement
- ❌ Never feed performance reviews, promotion decisions, or disciplinary actions

This covenant is a clause in the org attestation; violations justify platform account suspension.

---

## 6. Special Populations

- **New joiners (<90 days):** default Tier C only; lower familiarity with org makes simulations unfair.
- **Non-technical staff:** persona complexity reduced; focus on recognition skills.
- **Previously distressed targets:** excluded from high-intensity campaigns for 6 months minimum.
- **Works councils / union environments:** works-council approval artifact required before campaign creation where legally mandated.

---

## 7. Designer Checklist (Per Feature Release)

- [ ] Could this feature increase distress without increasing training value? If yes → redesign.
- [ ] Does the debrief fully explain this feature's usage to the target?
- [ ] Is there an off-ramp (pause/block/withdraw) that works against this feature?
- [ ] Would we be comfortable with this exchange appearing in a newspaper article about us?

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
