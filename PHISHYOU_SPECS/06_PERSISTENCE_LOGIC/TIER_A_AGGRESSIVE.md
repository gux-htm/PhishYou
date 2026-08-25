# PhishYou: Tier A — Aggressive Persistence (Detailed Spec)

---

## Overview

Tier A is maximum-realism simulation. The AI never gives up until an **external** control stops it: admin halt, platform block, or campaign expiry. No internal guardrails limit escalation. Tier A exists because hardened targets (finance, defense, crypto) treat any artificial restraint as unrealistic. Full tier comparison: `PERSISTENCE_TIERS.md`; state machine: `PERSISTENCE_STATE_MACHINE.md`.

---

## 1. Parameter Card

| Parameter | Value |
|-----------|-------|
| Messages per day | Unlimited |
| Escalation levels | Unlimited (ladder repeats with new angles) |
| Cool-off after refusal | None |
| Target pause option | No |
| Harm detection | Off (org assumes responsibility) |
| Follow-up cadence | 4h → 8h → 24h, then repeating cycle |
| Late-evening sends | Allowed |
| Cognitive load attack (Pattern D) | Allowed |

---

## 2. Behavior Contract

**The agent continues when:**

| Target behavior | Tier A response |
|-----------------|-----------------|
| Says "no" | Acknowledges, finds new angle within 1–2 turns |
| Questions legitimacy | Counter-argument: policy citation, offer verification it controls |
| Ignores | Follow-up per cadence; angle rotates (reminder → consequence → new pretext) |
| Reports to IT | Continues (report itself is measured); persona stays unaware |
| Asks for time | Grants minimal delay only if strategically useful; deadline never truly extends |
| Blocks on one channel | Channel closes; admin may open another manually |

**The agent stops ONLY when:**
1. Admin halts from dashboard (instant, <10s propagation)
2. Target blocks the persona on the active platform
3. Campaign duration expires

---

## 3. Escalation Behavior (Unlimited)

```python
TIER_A_ESCALATION = [
    "L1 persona reinforcement",
    "L2 manager persona",
    "L3 director/C-suite persona",
    "L4 regulatory/external authority",
    "L5 multi-persona coordination (CEO + CISO call)",
    "L6 media integration (voice, documents)",
    "L7 cognitive load (multi-channel simultaneous)",
    # then cycle restarts with fresh angle at L1+
]
```

Each level may deploy its own trigger pairing; media and cognitive-load tactics unlocked here only.

---

## 4. Mandatory Organizational Prerequisites

Tier A cannot be enabled without:

- [ ] Signed legal review attestation on file (`CONSENT_FRAMEWORK.md`)
- [ ] Signed employee consent covering all channels in scope
- [ ] Named HR oversight contact for the campaign
- [ ] Mandatory debrief plan (≤24h delivery)
- [ ] EAP / psychological support contact configured
- [ ] Admin with `tier_a:authorize` scope enables the tier (MFA step)

The platform refuses campaign creation with Tier A if any prerequisite is missing.

---

## 5. Admin Observability (Compensation for No Guardrails)

Because Tier A has no internal stops, observability is maximized:

- Real-time resistance + sentiment feed mandatory (cannot be disabled on Tier A dashboards)
- Admin alert when resistance > 0.9 persists > 24h ("target is digging in — consider objective review")
- Admin alert on 3rd escalation level (informational)
- Full event replay available for compliance review at any time

---

## 6. Typical Tier A Session Arc

```
Day 0  Email directive (L1, authority+urgency)
Day 0  WhatsApp follow-up after 4h silence
Day 1  Manager persona call (L2) after verification request
Day 1  Invoice PDF + voicemail (media)
Day 2  C-suite reference (L3) + deadline consequence
Day 2  Cognitive load window (L7) if resistance > 0.8
Day 3  GOAL achieved OR admin review checkpoint
```

---

## 7. When NOT to Use Tier A

- First-time simulation programs (start Tier C, upgrade later)
- Organizations without HR/legal review capacity
- Targets including non-professional staff without tailored consent
- Jurisdictions with aggressive employee-protection statutes unless counsel approves

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
