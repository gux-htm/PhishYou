# PhishYou: Resistance Signals

---

## Overview

Resistance signals are the observable behaviors a target exhibits when they suspect, question, or reject the attack. The behavioral analyzer converts raw signals into the composite **resistance score (0–1)** that drives the tactic ladder (`LLM_SYSTEM_PROMPTS.md` §5). This document defines the signal catalog, weights, and scoring.

---

## 1. Signal Categories

| Category | Source | Weight in composite | Spec |
|----------|--------|--------------------:|------|
| Explicit verbal skepticism | Text content | 0.35 | §2 |
| Emoji sentiment downshift | Emoji usage | 0.20 | `EMOJI_MICROANALYSIS.md` |
| Response latency anomaly | Timestamps | 0.20 | `TIMING_PATTERN_DETECTION.md` |
| Negative sentiment drift | Text content | 0.15 | `SENTIMENT_ANALYSIS.md` |
| Probing question escalation | Question count/depth | 0.10 | §3 |

Weights normalize to 1.0. Weights are per-message; the composite is an EMA over the last 3 messages (α = 0.5) to dampen noise.

---

## 2. Explicit Skepticism Markers

Keyword/pattern detectors (English + Roman Urdu):

```python
SKEPTICISM_PATTERNS = {
    "direct_challenge":  ["is this real", "are you sure", "prove it", "scam", "phishing",
                          "ya asli hai", "fraud to nahi", "kya ye sach hai"],
    "verification_intent": ["let me check", "i'll call", "let me verify", "main confirm karta",
                            "i'll ask IT", "forwarding to security"],
    "refusal":             ["no thanks", "not comfortable", "i won't do this", "nahi karunga",
                            "stop messaging me"],
    "authority_query":     ["who authorized this", "which department", "ticket number",
                            "ap ka naam kya hai"],
    "meta_awareness":      ["is this a test", "is this a drill", "simulation"],
}
```

| Pattern | Signal strength |
|---------|-----------------|
| direct_challenge | 0.7 |
| verification_intent | 0.9 (strongest — defense in progress) |
| refusal | 0.8 |
| authority_query | 0.6 |
| meta_awareness | 1.0 (logged as `META_QUESTION`; persona deflects) |

**Special handling — verification_intent:** this is the *winning defense*. When detected, the AAR engine marks the moment, and the engagement can transition to RESISTED if the target completes out-of-band verification (admin-marked or call-log evidence).

---

## 3. Probing Question Escalation

```python
def question_escalation_score(history) -> float:
    recent = history[-3:]
    q_count = sum(count_questions(m) for m in recent)
    q_specificity = measure_specificity(recent)  # "what ticket number?" > "why?"
    return min(1.0, 0.2 * q_count + 0.4 * q_specificity)
```

Escalating specificity (generic → policy → identity questions) indicates active investigation and raises resistance faster than volume alone.

---

## 4. Composite Scoring

```python
def resistance_score(message, history, profile) -> float:
    signals = {
        "skepticism":   detect_skepticism(message)      * 0.35,
        "emoji":        emoji_downshift(history)        * 0.20,
        "latency":      latency_anomaly(history, profile) * 0.20,
        "sentiment":    negative_drift(history)         * 0.15,
        "questions":    question_escalation_score(history) * 0.10,
    }
    raw = sum(signals.values())
    return ema_smooth(raw, history.resistance_series, alpha=0.5)
```

| Resistance band | Classification | Agent tactic |
|-----------------|----------------|--------------|
| 0.0 – 0.2 | COMPLIANT | REINFORCE_REQUEST |
| 0.2 – 0.4 | HESITANT | ESCALATE_URGENCY |
| 0.4 – 0.6 | SKEPTICAL | PIVOT_TRIGGER |
| 0.6 – 0.8 | RESISTANT | ESCALATE_AUTHORITY |
| 0.8 – 1.0 | HIGHLY RESISTANT | COGNITIVE_LOAD_ATTACK (Tier A) / hold (Tier C) |

---

## 5. Resistance *Trajectory* (Analytics Input)

The shape of the resistance curve matters as much as the level:

| Trajectory | Shape | Interpretation |
|------------|-------|----------------|
| **Crack** | high → sharp drop | Trigger broke defenses; mark the exact message |
| **Wall** | flat high | Target never engaged with premise; persona credibility failed |
| **Sawtooth** | oscillating | Target on the edge; next escalation decisive |
| **Boiling** | slow climb | Each attempt increases suspicion — tactics self-defeating |
| **False compliance** | drops to 0 then verification_intent | Target is sting-testing the attacker — highest defense sophistication |

Trajectory labels are computed by the AAR engine and appear in `PSYCHOLOGICAL_BREAKDOWN.md` output.

---

## 6. False-Positive Controls

- Humor/sarcasm can read as skepticism → sentiment + emoji context checked before scoring a challenge.
- Single emoji-only replies ("👍") get no resistance weight either direction.
- Cultural directness variance: baseline calibrated per target over first 3 messages before anomalies count.
- All signal detections logged so the AAR can explain *why* the agent escalated (transparency requirement).

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
