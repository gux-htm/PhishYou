# PhishYou: Tier B — Balanced Persistence (Detailed Spec)

---

## Overview

Tier B pairs sophisticated attack simulation with optional psychological safety nets. The AI persists indefinitely but the organization can enable harm monitoring, and targets get one pause per day. Tier B is the default recommendation for mid-market enterprises. Parent spec: `PERSISTENCE_TIERS.md`.

---

## 1. Parameter Card

| Parameter | Value |
|-----------|-------|
| Messages per day | Unlimited |
| Escalation levels | Max 2 (persona L1 → L2 manager; no C-suite) |
| Urgency escalations | Max 3 steps on the urgency ladder |
| Cool-off after refusal | None |
| Target pause option | Yes — 1 per day, auto-resume after 24h |
| Harm detection | Optional (admin toggle); when on: notifies admin + pauses |
| Follow-up cadence | 6h → 24h → 48h, then holds |
| Late-evening sends | Only with admin flag |
| Cognitive load attack | Not permitted (sequential multi-channel allowed) |

---

## 2. Behavior Contract

| Target behavior | Tier B response |
|-----------------|-----------------|
| Says "no" | New angle, max within 2 escalation levels |
| Questions legitimacy | Counter-argument + offer controlled verification |
| Ignores | Follow-up per cadence, then hold (no infinite nagging) |
| Asks to pause | Grants 24h pause (once/day) with encouraging acknowledgment |
| Shows distress (detection ON) | Pause + support message + admin review gate |
| Blocks | Channel closed permanently for this campaign |

---

## 3. Pause Mechanics

```python
TIER_B_PAUSE = {
    "allowed_per_day": 1,
    "duration": timedelta(hours=24),
    "auto_resume": True,
    "acknowledgment": "Good call taking a break... That's exactly the instinct we're training.",
}
```

- Pause request detected via keyword set ("pause", "stop for now", "take a break", Roman Urdu equivalents).
- Second same-day pause request: persona redirects to manager/HR for permanent halt.
- Pause timer suspends all scheduled follow-ups across all channels.

---

## 4. Harm Detection Integration (Optional)

When admin enables harm detection on a Tier B campaign:

```python
if harm_score(message) > 0.6:
    await admin.notify("PSYCHOLOGICAL_HARM_DETECTED", signals, severity)
    await campaign.pause_for_target(target)
    await send_support_message(target)   # EAP + HR contacts + "you did well" framing
    # Resume requires explicit admin decision: RESUME (rare) | END | SUPPORT_ONLY
```

Detection is advisory, not autonomous: the pause awaits admin confirmation to resume, never auto-resumes from a harm pause.

---

## 5. Escalation Ceiling Rationale

Max 2 levels keeps the simulation realistic for mid-market while avoiding:
- C-suite impersonation (higher distress risk, higher legal exposure)
- Regulatory impersonation (reserved for Tier A)

When the ceiling is reached and resistance remains > 0.6, Tier B pivots triggers instead of escalating authority — testing breadth rather than depth.

---

## 6. Ideal Tier B Profile

- 500–2000 employee organizations
- HR oversight exists; legal burden moderate
- Mixed technical maturity across departments
- Want credible pressure without worst-case scenarios

---

## 7. Upgrade Path

Organizations commonly run 2–3 Tier B campaigns, review AARs, then upgrade specific campaigns to Tier A for hardened departments. Tier upgrades mid-campaign are allowed; downgrades are not (`PERSISTENCE_TIERS.md`).

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
