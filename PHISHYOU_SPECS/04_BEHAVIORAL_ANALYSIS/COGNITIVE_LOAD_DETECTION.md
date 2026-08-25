# PhishYou: Cognitive Load Detection

---

## Overview

Cognitive load is the target's available mental bandwidth for critical thinking. When load is high, verification steps get skipped. This module has two directions: **detecting** the target's current load (to choose the moment), and the governed deployment of the **cognitive load attack** (Tier A tactic in the resistance ladder).

---

## 1. Load Indicators (Detection)

| Indicator | Source | Signal |
|-----------|--------|--------|
| Message fragmentation | Text pattern | Many short rapid messages = processing hard |
| Question repetition | Content | Re-asking same thing = working-memory overload |
| Typos / self-corrections | Text quality | Degraded composition under load |
| Multi-tasking markers | Timing | Replying while other requests in flight |
| Latency compression | Timing | Instant replies to complex asks = heuristic mode (System 1) |
| Context loss | Content | Forgetting earlier claims in same conversation |
| Time-of-day | Schedule | Late day / month-end close (OSINT) = baseline load higher |

```python
def cognitive_load_score(history, osint) -> float:
    indicators = {
        "fragmentation":  fragmentation_ratio(history[-5:]),
        "repetition":     repeated_question_ratio(history),
        "composition":    typo_rate(history[-3:]),
        "latency_mode":   1.0 if instant_replies_to_complex(history) else 0.0,
        "context_loss":   forgotten_claims_count(history),
        "baseline":       osint.stress_context,   # month-end, incident response, etc.
    }
    return weighted_mean(indicators)   # 0 = fresh | 1 = overloaded
```

---

## 2. Using Load Defensively (For the Agent)

| Load score | Agent behavior |
|------------|----------------|
| < 0.3 | Target thinking clearly — simple requests, avoid complex asks |
| 0.3 – 0.6 | Normal operation |
| > 0.6 | **Opportunity window:** bundle the ask now; keep instructions short and directive |

High load also predicts compliance with *longer* messages — overloaded targets skim, so key instructions go first and last.

---

## 3. Cognitive Load Attack (COGNITIVE_LOAD_ATTACK)

The final tactic on the resistance ladder (resistance > 0.8, Tier A). Intent: manufacture overload deliberately.

**Mechanics:**
1. **Multi-channel simultaneity** — email directive + WhatsApp ping + voice call within 10 minutes (`ATTACK_CHAIN_PATTERNS.md` CHAIN-6).
2. **Layered request** — the ask contains 3+ steps with cross-references ("complete the form, reference the email, confirm with the code sent separately").
3. **Deadline stacking** — two deadlines that overlap ("audit closes 5 PM; portal access expires 4:30 PM").
4. **Jargon density** — policy numbers, acronyms, and procedures in one message.

**Governance:**
- Tier A only; requires campaign objective flag `cognitive_load_enabled`.
- Emits `COGNITIVE_LOAD_ATTACK` audit event with all component channels.
- Automatically withdrawn if harm detection (when enabled) reports distress.
- AAR must explain load-attack usage in plain language to the org.

---

## 4. Load Trajectory in AAR

The AAR plots load score over time and annotates:
- When load crossed 0.6
- Whether compromise occurred within 30 minutes of a high-load window
- Which channel combination produced the peak

This gives the org a precise answer to: *"Was our employee out-thought, or out-pressured?"*

---

## 5. Ethical Ceiling

- No load attack during known personal crisis (OSINT exclusion list: bereavement, medical leave).
- Tier B may use multi-channel sequencing but never simultaneous channel stacking.
- Tier C never deploys load attacks; detection is still recorded for analytics.
- Post-campaign debrief always discloses if a cognitive load attack was used against the target.

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
