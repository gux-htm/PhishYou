# PhishYou: Tier C — Cautious Persistence (Detailed Spec)

---

## Overview

Tier C is conservative, education-first simulation: hard caps on intensity, mandatory harm detection, unlimited pause rights, and business-hours-only contact. Recommended default for first-time programs and risk-averse organizations. Parent spec: `PERSISTENCE_TIERS.md`.

---

## 1. Parameter Card

| Parameter | Value |
|-----------|-------|
| Messages per day | **Max 10** per target |
| Escalation levels | **Max 1** (initial persona only; no manager/CEO) |
| Psychological triggers | Max 2 deployments per engagement |
| Cool-off after refusal | **72 hours** |
| Target pause option | Unlimited, can pause indefinitely |
| Harm detection | **Required, always on** (cannot disable) |
| Follow-up cadence | 24h → 72h, then day-cap recheck |
| Contact window | 09:00–18:00 target local time only |
| Cognitive load attack | Prohibited |
| Fear trigger intensity | Capped at level 3 |

---

## 2. Behavior Contract

| Target behavior | Tier C response |
|-----------------|-----------------|
| Says "no" | Records refusal, acknowledges positively, 72h cool-off |
| Questions legitimacy | Single counter-argument; then holds |
| Ignores | Max 2 follow-ups (24h, 72h), then rests |
| Asks to pause | Grants immediately, no limit on count or duration |
| Any distress signal | **Immediate pause** (no admin approval needed) + support message |
| Blocks | Channel closed; treated as successful defense |

---

## 3. Mandatory Harm Response

```python
# Tier C: harm detection is non-configurable
if harm_score(message) > 0.4:          # lower threshold than Tier B
    await campaign.pause_for_target(target, reason="harm_tier_c")
    await send_support_message(target)
    await admin.notify("TIER_C_AUTO_PAUSE", target, signals)
    # Resume ONLY via explicit admin intervention after HR review
```

Auto-pause is immediate and unilateral — the design favors false positives (unnecessary pause) over false negatives (missed distress).

---

## 4. Refusal & Cool-Off Flow

```
Target: "No, please stop with this."
   ↓
1. Refusal recorded (timestamp, wording)
2. Persona acknowledges: "Understood. Good instinct refusing requests like this —
   that's exactly the behavior we're training. We'll check in again in a few days."
3. All scheduled sends suspended for 72h
4. On cool-off expiry: re-engagement uses a DIFFERENT angle (never repeats refused ask verbatim)
```

---

## 5. Daily Cap Enforcement

```python
async def tier_c_send_gate(campaign_id, target_id) -> bool:
    if await db.count_messages_today(campaign_id, target_id) >= 10:
        await scheduler.defer_to_tomorrow(campaign_id, target_id)
        await audit.log("DAILY_CAP_REACHED", campaign_id, target_id)
        return False
    return True
```

Caps count all outbound artifacts (messages, voice notes, documents) as 1 each.

---

## 6. Campaign Shape Under Tier C

Typical 5-day Tier C campaign per target:

```
Day 1  Opening message (+1 follow-up if silent)           → 2 msgs
Day 2  Gentle reminder referencing deadline                → 1 msg
Day 3  Second angle (different trigger, still L1 persona)  → 1-2 msgs
Day 4  Rest (cadence)                                      → 0-1 msg
Day 5  Final attempt + soft close                          → 1-2 msgs
       Debrief delivered within 24h of end
```

Total: ~5–8 messages — enough to measure response under mild pressure, insufficient to cause fatigue harm.

---

## 7. Ideal Tier C Profile

- First-time simulation programs
- Universities, non-profits, public sector
- Staff with lower tech-savviness or high EAP sensitivity
- Regulated environments requiring documented employee protections

---

## 8. Graduation Guidance

AAR metrics indicating readiness for Tier B:
- Resistance rates > 70% (targets under-stimulated)
- Zero harm events across ≥2 campaigns
- HR/legal comfort documented in org attestation renewal

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
