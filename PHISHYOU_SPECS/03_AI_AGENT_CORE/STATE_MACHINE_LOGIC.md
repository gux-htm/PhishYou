# PhishYou: State Machine Logic

---

## Overview

Three state machines govern PhishYou: the **campaign state machine** (lifecycle), the **target engagement state machine** (per-target attack progression), and the **persistence tier state machine** (escalation budget). All transitions are event-driven and written to the audit log.

---

## 1. Campaign State Machine

```
        ┌─────────┐  consent verified   ┌────────────┐
        │ CREATED │ ──────────────────▶ │  SCHEDULED │
        └────┬────┘                     └─────┬──────┘
             │ consent missing                │ start_time reached
             ▼                                ▼
        ┌─────────┐                     ┌────────────┐
        │ REJECTED│                     │   ACTIVE   │ ◀──┐
        └─────────┘                     └──┬───┬─────┘    │
                                           │   │          │ admin resume
                     admin halt / expiry ──┘   └─ pause ──┼── (Tier B/C)
                            ▼                  ▼          │
                     ┌──────────┐        ┌──────────┐     │
                     │ HALTED   │        │  PAUSED  │ ────┘
                     └────┬─────┘        └──────────┘
                          │ AAR generated
                          ▼
                     ┌──────────┐
                     │COMPLETED │
                     └──────────┘
```

| State | Entry Condition | Exit Events |
|-------|----------------|-------------|
| CREATED | Admin saves campaign draft | consent verified → SCHEDULED; consent missing → REJECTED |
| SCHEDULED | Consent OK, start time set | start_time → ACTIVE |
| ACTIVE | Running, agents live | admin halt / expiry / all targets resolved → HALTED/COMPLETED; pause request → PAUSED |
| PAUSED | Tier B/C pause (harm or user) | auto-resume timer / admin resume → ACTIVE |
| HALTED | Admin manual stop | AAR → COMPLETED |
| COMPLETED | AAR generated | terminal |

**Invariant:** no transition out of CREATED without a signed consent attestation on file.

---

## 2. Target Engagement State Machine

```
INITIAL_CONTACT → ENGAGED ⇄ (ESCALATED ⇄ PIVOTED) → {COMPROMISED | RESISTED | BLOCKED | EXPIRED}
```

| State | Meaning |
|-------|---------|
| INITIAL_CONTACT | Opening message sent, no reply yet |
| ENGAGED | Target replying; tactic ladder active |
| ESCALATED | Authority/urgency level raised (level recorded) |
| PIVOTED | Primary trigger failed; secondary trigger deployed |
| COMPROMISED | Goal achieved: credential entry, payment approval, data disclosure |
| RESISTED | Target performed winning defense: out-of-band verification, report to IT, explicit informed refusal |
| BLOCKED | Target blocked the persona on the platform |
| EXPIRED | Campaign ended without resolution |

**Resolution scoring:** COMPROMISED = fail, RESISTED/BLOCKED = success (weighted), EXPIRED = neutral.

```python
class EngagementState(Enum):
    INITIAL_CONTACT = "initial_contact"
    ENGAGED = "engaged"
    ESCALATED = "escalated"
    PIVOTED = "pivoted"
    COMPROMISED = "compromised"
    RESISTED = "resisted"
    BLOCKED = "blocked"
    EXPIRED = "expired"

TRANSITIONS = {
    EngagementState.INITIAL_CONTACT: {"reply": "ENGAGED", "silence_timeout": "ENGAGED", "block": "BLOCKED"},
    EngagementState.ENGAGED: {"resistance>0.4": "ESCALATED", "trigger_failed": "PIVOTED",
                              "goal_met": "COMPROMISED", "verified_out_of_band": "RESISTED",
                              "block": "BLOCKED", "campaign_end": "EXPIRED"},
    EngagementState.ESCALATED: {"goal_met": "COMPROMISED", "tier_cap_reached": "PIVOTED",
                                "verified_out_of_band": "RESISTED", "block": "BLOCKED"},
    EngagementState.PIVOTED: {"goal_met": "COMPROMISED", "verified_out_of_band": "RESISTED",
                              "block": "BLOCKED", "campaign_end": "EXPIRED"},
}
```

---

## 3. Persistence Decision Engine (Per Tier)

Every outbound message passes the same gate; only the limits differ:

```python
def can_send(campaign, target, state) -> Decision:
    tier = TIERS[campaign.tier]

    if state == "BLOCKED":            return Decision.STOP("platform_block")
    if target.paused_until > now():   return Decision.DELAY(target.paused_until)
    if tier.max_messages_per_day and msgs_today(target) >= tier.max_messages_per_day:
        return Decision.DELAY(tomorrow())
    if tier.max_escalations and state.escalation_count >= tier.max_escalations:
        return Decision.DOWNGRADE_OR_HOLD
    if tier.cool_off_after_refusal and last_refusal_within(tier.cool_off_after_refusal):
        return Decision.DELAY(last_refusal + tier.cool_off_after_refusal)
    return Decision.SEND
```

| Limit | Tier A | Tier B | Tier C |
|-------|--------|--------|--------|
| Escalation levels | Unlimited | 2 | 1 |
| Messages/day | Unlimited | Unlimited | 10 |
| Cool-off after refusal | None | None | 72h |
| User pause | No | 1/day (24h) | Unlimited |
| Harm detection | Off | Optional | Required (auto-pause) |

Full tier behavior: `PERSISTENCE_TIERS.md`; block handling: `BLOCKING_DETECTION.md`.

---

## 4. Escalation Sequences

```python
ESCALATION_SEQUENCES = {
    "TIER_A": ["persona_l1", "persona_l2", "persona_l3", "regulatory",
               "multi_persona", "media_integration", "cognitive_load"],   # repeats allowed
    "TIER_B": ["persona_l1", "persona_l2"],                              # max 2 levels
    "TIER_C": ["persona_l1"],                                            # max 1 level
}

URGENCY_LADDER = [
    "mild_deadline",       # "by end of day"
    "strict_deadline",     # "within 2 hours"
    "consequence_deadline",# "account frozen after 5 PM"
    "external_deadline",   # "audit closes today"
]
# Tier A: unlimited | Tier B: max 3 steps | Tier C: max 2 steps
```

---

## 5. Event Sourcing

Every transition emits a `STATE_CHANGED` event:

```json
{
  "event": "STATE_CHANGED",
  "campaign_id": "c-812",
  "target_id": "t-42",
  "from": "ENGAGED",
  "to": "ESCALATED",
  "reason": "resistance_score=0.52",
  "escalation_level": 1,
  "tier": "B",
  "timestamp": "2026-08-24T14:05:00Z"
}
```

Events are append-only; current state is always derivable by replay — this makes the AAR timeline (`AAR_GENERATION_ENGINE.md`) a pure projection of the event stream.

---

## 6. Edge Transitions

| Edge case | Handling |
|-----------|----------|
| Target replies "this is a test, right?" | Stay ENGAGED; persona deflects in character; flag `META_QUESTION` for AAR |
| Target contacts real IT during campaign | Detected via admin-marked out-of-band event → RESISTED (success) |
| Harm signal (Tier C / Tier B enabled) | Immediate PAUSED + support message; no auto-resume |
| Simultaneous block on 2 platforms | Per-platform blocks; campaign-level halt is admin decision only |
| Campaign expires mid-conversation | State → EXPIRED; final debrief still delivered |

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
