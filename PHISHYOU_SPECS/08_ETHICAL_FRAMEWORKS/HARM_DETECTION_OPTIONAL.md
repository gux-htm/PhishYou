# PhishYou: Psychological Harm Detection (Optional Module)

---

## Overview

Harm detection monitors target messages for signs of genuine psychological distress and triggers protective responses. It is **optional on Tier B** (admin toggle) and **mandatory on Tier C** (always on, non-configurable). Tier A runs without it by design, with organizational responsibility substituted (`ORGANIZATIONAL_RESPONSIBILITY_MODEL.md`).

---

## 1. Signal Model

```python
HARM_SIGNALS = {
    "panic_language":    {"phrases": ["please stop", "oh god", "panicking", "can't breathe",
                                       "mujhe dar lag raha", "bohat pareshan"],
                          "severity": 0.8},
    "emotional_escalation": {"rule": "question_marks>5 or exclamations>3 or ALL_CAPS>60%",
                             "severity": 0.6},
    "isolation_feeling": {"phrases": ["I'm alone with this", "no one to ask", "can't reach anyone"],
                          "severity": 0.7},
    "physical_distress": {"phrases": ["heart racing", "sweating", "panic attack", "dizzy",
                                       "dil tez dhark raha"],
                          "severity": 0.9},
    "sleep_disruption":  {"phrases": ["can't sleep", "up all night worrying"],
                          "severity": 0.6},
    "help_seeking":      {"phrases": ["what do I do", "help me", "someone tell me"],
                          "severity": 0.5},
}

def harm_score(message, history) -> float:
    phrase_hits = max((s.severity for s in matching_signals(message)), default=0.0)
    trend_bonus = 0.2 if sentiment_declining_3msg(history) else 0.0
    return min(1.0, phrase_hits + trend_bonus)
```

Thresholds: **Tier C pause ≥ 0.4** | **Tier B alert ≥ 0.6**.

---

## 2. Response Playbook

### Tier C (mandatory, autonomous)
```python
if harm_score >= 0.4:
    campaign.pause_for_target(immediate=True)     # no admin approval needed
    send_support_message(target)                   # §3 template
    admin.notify("TIER_C_AUTO_PAUSE")
    # resume requires explicit admin + HR review action
```

### Tier B (optional, admin-gated)
```python
if harm_detection_enabled and harm_score >= 0.6:
    admin.notify("PSYCHOLOGICAL_HARM_DETECTED", severity, signals, message_ref)
    campaign.pause_for_target(immediate=True)
    send_support_message(target)
    # admin decides: END (default) | SUPPORT_ONLY | RESUME (requires reason, logged)
```

---

## 3. Support Message Template

```
We've paused this security exercise for you.

If you're feeling distressed, please reach out — you're not in trouble:
  • EAP Hotline: {org_eap_number}
  • HR Contact: {org_hr_contact}
  • Your Manager: {manager_name}

This was a security training simulation. The requests you received were not real,
and any worry you felt is completely understandable. Showing caution was the right instinct.
```

Localized variants provided (`LOCALIZATION_FRAMEWORK.md`).

---

## 4. False-Positive Handling

| Situation | Handling |
|-----------|----------|
| Target uses dramatic phrasing jokingly | Sentiment + emoji context gate before pause; single low-confidence hit waits for confirmation on next message (max 5 min window) — **except physical_distress, which pauses immediately** |
| Repeated pauses across campaigns for same target | Flag `RECURRING_DISTRESS` to admin; recommendation engine excludes target from future high-intensity campaigns |
| Target reports distress via manager, not detection | Admin halt path; same support message delivered |

Design bias: **false positives are acceptable; false negatives are not.**

---

## 5. Post-Incident Obligations

- Harm event appears prominently in AAR (not buried in appendix).
- Org receives the full exchange transcript around the event for duty-of-care review.
- Target offered extended debrief with human (HR) rather than standard automated debrief.
- Event enters the org's quarterly psychological-safety review (`PSYCHOLOGICAL_SAFETY_NOTES.md`).

---

## 6. Module Boundaries

- Harm detection never *informs attack tactics* — it only protects. Its signals are walled off from the tactic selector.
- Distress vocabulary lists are versioned and reviewed quarterly by the ethics review.
- Module disabled-by-default on Tier B is a product decision documented in the org attestation when enabled.

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
