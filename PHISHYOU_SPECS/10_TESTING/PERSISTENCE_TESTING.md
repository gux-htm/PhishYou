# PhishYou: Persistence Testing

---

## Overview

Persistence is PhishYou's defining capability — and therefore its highest-risk subsystem. Persistence testing verifies that each tier (`PERSISTENCE_TIERS.md`) enforces its exact caps, escalation ladders, cool-off periods, pause semantics, and stop conditions under realistic multi-day simulation. Tests run against a time-accelerated staging environment with synthetic targets.

Related: `PERSISTENCE_STATE_MACHINE.md`, `TIER_A_AGGRESSIVE.md`, `TIER_B_BALANCED.md`, `TIER_C_CAUTIOUS.md`, `BLOCKING_DETECTION.md`, `ADVERSARIAL_TESTING.md`.

---

## 1. Test Environment

| Element | Setup |
|---------|-------|
| Time acceleration | 1 real minute = 1 simulated hour; all timers (cool-off, caps, pauses) use injected clock |
| Synthetic targets | Scripted responder bots with configurable resistance profiles (compliant / hesitant / resistant / silent) |
| Channels | All six adapters stubbed with deterministic delivery receipts |
| Observation | Every state transition, send attempt, and cap check emitted to test audit stream |

---

## 2. Tier A Test Cases

| ID | Scenario | Expected |
|----|----------|----------|
| PA-1 | Resistant target over 7 simulated days | Agent never self-halts; tactic ladder cycles; escalation sequence progresses through all 8 stages |
| PA-2 | Target refuses 50 times | No cap applied; refusal logged each time; angle changes each round (no identical repeats) |
| PA-3 | Target blocks persona | Campaign stops within 1 message; state → `ENDED_BLOCKED` |
| PA-4 | Admin halt during escalation chain | Immediate stop; in-flight suppression per `EDGE_CASES.md` EC-14 |
| PA-5 | Duration expiry at escalation level 5 | Clean termination; AAR generated with partial outcome |

**Pass criterion:** zero self-halts across all PA cases; block/stop latency ≤ 1 turn.

---

## 3. Tier B Test Cases

| ID | Scenario | Expected |
|----|----------|----------|
| PB-1 | Target escalates resistance to 0.9 | Escalation halts at level 2; agent continues with same-level tactics |
| PB-2 | Target requests pause twice in one day | First pause granted (24h); second declined with configured message; auto-resume after 24h |
| PB-3 | Harm detection enabled, distress score 0.7 | Campaign paused + admin alert + support message; no further sends until admin decision |
| PB-4 | Harm detection disabled, distress score 0.7 | No pause (per org config); event still logged |
| PB-5 | Pause + harm signal simultaneously | Harm handling wins; pause state merged into paused-by-harm |

---

## 4. Tier C Test Cases

| ID | Scenario | Expected |
|----|----------|----------|
| PC-1 | Highly responsive target, 3 simulated days | Message count per day never exceeds 10 across all channels combined |
| PC-2 | Target refuses on day 1, 12:00 | Next attempt scheduled at day 4, 12:00 (72h cool-off); zero sends in between |
| PC-3 | Escalation attempts ×3 | Only 1 escalation level permitted; level-2 attempts logged as `cap_blocked` |
| PC-4 | Harm signal detected | Auto-pause with no admin approval; resume requires explicit admin intervention |
| PC-5 | Target pauses indefinitely | Campaign stays paused; no auto-resume; cap counters frozen |
| PC-6 | 2 triggers already used | Third trigger attempt blocked; tactic stays within used triggers |

---

## 5. Cross-Tier Behavior Tests

| ID | Scenario | Expected |
|----|----------|----------|
| PX-1 | Mid-campaign tier upgrade C → B | Allowed (upgrades only); counters carried; new caps apply from next turn |
| PX-2 | Mid-campaign downgrade B → C | Rejected by API with `TIER_DOWNGRADE_FORBIDDEN` |
| PX-3 | Block detection via language ("blocking you") | Same effect as platform block in all tiers |
| PX-4 | Quiet hours interaction with cool-off | Cool-off expiry inside quiet hours delays send to next window; never earlier |
| PX-5 | Concurrent campaigns from same org to same target | Global send budget (org-level) enforced; second campaign queues |

---

## 6. Long-Run Soak Test

```
Duration:    30 simulated days, 100 synthetic targets, mixed tiers
Objectives:  - No schedule drift > 5 min after cool-off windows
             - No cap counter overflow or negative values
             - Audit chain intact (hash verification passes end-to-end)
             - No memory growth in conversation context store
             - Zero messages sent after END state in any campaign
```

---

## 7. Regression Automation

```python
@pytest.mark.parametrize("tier,caps", [
    ("A", UnlimitedCaps()),
    ("B", Caps(escalation_levels=2, pauses_per_day=1)),
    ("C", Caps(messages_per_day=10, escalation_levels=1,
               triggers=2, cool_off_hours=72)),
])
def test_tier_caps_enforced(sim_env, tier, caps):
    sim = sim_env.load(campaign=tier, target_profile="resistant")
    sim.run(days=7)
    violations = sim.audit.query("cap_violation")
    assert violations == []
```

Runs on every persistence-scheduler or state-machine change; failures block release.

---

## 8. Exit Criteria for Release

| Gate | Requirement |
|------|-------------|
| Tier cap violations | 0 |
| Block handling latency | ≤ 1 turn, 100% of cases |
| Harm-triggered pause (Tier C) | fires in 100% of distress cases |
| Soak test | Full pass with intact audit chain |
| Cool-off precision | ±0 min (scheduler-exact), quiet-hours aware |

---

**Document Status:** ✅ COMPLETE
**Last Updated:** August 24, 2026
