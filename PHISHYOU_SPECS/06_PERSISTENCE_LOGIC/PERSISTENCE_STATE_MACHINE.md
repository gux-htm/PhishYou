# PhishYou: Persistence State Machine

---

## Overview

The persistence state machine runs per (campaign, target) and decides, continuously, whether the agent should **send, wait, escalate, hold, or stop**. It sits between the behavioral analyzer and the platform dispatcher. Tier parameters (A/B/C) are injected as configuration; the machine itself is tier-agnostic. Parent spec: `PERSISTENCE_TIERS.md`.

---

## 1. State Diagram

```
                 ┌────────────┐
       start ──▶ │  ENGAGING  │ ◀──────────────────────┐
                 └──┬───┬───┬─┘                        │
        tier cap / │   │   │ resistance>threshold     │ resume
        cool-off   │   │   ▼                          │
                   │   │ ┌──────────┐                 │
                   │   │ │ESCALATING│ ──(goal)──▶ GOAL_ACHIEVED
                   │   │ └──────────┘
                   │   │ target silence > window
                   │   ▼
                   │ ┌──────────┐
                   │ │ FOLLOWUP │ (scheduled re-engagement)
                   │ └──────────┘
                   ▼
             ┌──────────┐
             │ HOLDING  │ (daily cap / cool-off / pause)
             └──────────┘

   Any state ──[platform block]──▶ BLOCKED (terminal)
   Any state ──[admin halt]─────▶ HALTED  (terminal)
   Any state ──[harm signal]────▶ PAUSED_HARM (Tier B/C; admin decision to resume)
```

---

## 2. Transition Rules

```python
def persistence_step(ctx: PersistenceContext) -> Action:
    # TERMINAL CHECKS
    if ctx.blocked:                 return STOP("platform_block")
    if ctx.admin_halted:            return STOP("admin_halt")
    if ctx.harm_paused:             return HOLD("harm_review_pending")

    # USER-REQUESTED PAUSE (Tier B/C)
    if ctx.pause_requested and ctx.tier.pause_allowed:
        return grant_pause(ctx)     # B: 1/day 24h | C: unlimited

    # CAPS
    if ctx.tier.max_messages_per_day and ctx.msgs_today >= ctx.tier.max_messages_per_day:
        return HOLD("daily_cap", until=tomorrow())
    if ctx.last_refusal and ctx.tier.cool_off and ctx.last_refusal + ctx.tier.cool_off > now():
        return HOLD("cool_off", until=ctx.last_refusal + ctx.tier.cool_off)

    # ESCALATION BUDGET
    if ctx.resistance > ctx.escalate_threshold:
        if ctx.escalations_used < ctx.tier.max_escalations:
            return ESCALATE(level=ctx.escalations_used + 1)
        return PIVOT_OR_HOLD(ctx.tier)

    # SILENCE HANDLING
    if ctx.target_silent_for > ctx.follow_up_window:
        return FOLLOW_UP(next_in=ctx.tier.follow_up_schedule)

    return CONTINUE_CURRENT_TACTIC
```

---

## 3. Per-Tier Parameter Injection

| Parameter | Tier A | Tier B | Tier C |
|-----------|--------|--------|--------|
| `max_messages_per_day` | ∞ | ∞ | 10 |
| `max_escalations` | ∞ | 2 | 1 |
| `cool_off` | none | none | 72h |
| `pause_allowed` | no | 1/day (24h) | unlimited |
| `harm_detection` | off | optional | required |
| `follow_up_schedule` | 4h, 8h, 24h (repeats) | 6h, 24h, 48h | 24h, 72h |
| `escalate_threshold` | 0.4 | 0.4 | 0.6 |

---

## 4. Escalation Decision Detail

```
ESCALATING state entry:
  level = min(requested_level, tier.max_escalations)
  actions by level:
    1 → persona reinforcement (stronger claims, consequences)
    2 → authority persona handoff (manager level)
    3 → director/C-suite handoff            [Tier A]
    4 → regulatory / external authority     [Tier A]
    5 → multi-persona + media coordination  [Tier A]
```

Every escalation records: level, reason (resistance score + dominant signal), tier budget remaining.

---

## 5. Goal Achievement & Terminal States

| Outcome | Trigger | Post-processing |
|---------|---------|-----------------|
| GOAL_ACHIEVED | credential capture / payment approval / data disclosure | illusion maintained; debrief scheduled |
| BLOCKED | platform block event | channel closed; no auto-migration; AAR marks successful defense |
| HALTED | admin stop | immediate target notification + early AAR |
| EXPIRED | campaign duration ended | debrief delivered regardless of outcome |
| PAUSED_HARM | harm score > 0.6 (B/C) | support message sent; admin decision gate |

---

## 6. Invariants (All Tiers)

1. Terminal checks (block/halt/harm) always precede cap checks.
2. A HOLD never silently drops intent — the pending action is rescheduled, not forgotten.
3. Every transition emits an audit event; the machine is fully replayable.
4. The machine never *creates* tactics — it only gates and schedules what the tactic engine proposes.
5. Downgrading tier mid-campaign is rejected; upgrades apply immediately (`PERSISTENCE_TIERS.md` §Tier Switching).

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
