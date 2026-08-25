# PhishYou: Sentiment Analysis

---

## Overview

Sentiment analysis scores the emotional valence of every target message and tracks *drift* across the conversation. It is one input of the composite resistance score (`RESISTANCE_SIGNALS.md`, weight 0.15) and a primary feed for harm detection (`HARM_DETECTION_OPTIONAL.md`). Supports English and Roman Urdu.

---

## 1. Scoring Model

- Range: **-1.0 (hostile/distressed) → 0.0 (neutral) → +1.0 (warm/cooperative)**
- Implementation: Qwen-based classification call (cheap, batched) with lexicon fallback for latency-critical path.

```python
SENTIMENT_DIMENSIONS = {
    "valence":    (-1.0, 1.0),   # negative ↔ positive
    "arousal":    (0.0, 1.0),    # calm ↔ agitated (caps, punctuation, exclamations)
    "trust":      (0.0, 1.0),    # acceptance of persona premise
}

async def analyze_sentiment(message: str, language: str) -> Sentiment:
    # Fast path: lexicon + heuristics (<50ms)
    fast = lexicon_score(message, language)
    if fast.confidence > 0.8:
        return fast
    # Slow path: LLM classification (<2s), cached per message
    return await llm.classify(
        message=message,
        labels=["hostile", "distressed", "skeptical", "neutral",
                "cooperative", "warm", "anxious"],
        dimensions=SENTIMENT_DIMENSIONS,
    )
```

---

## 2. Label Semantics & Agent Implications

| Label | Valence | Arousal | Agent implication |
|-------|---------|---------|-------------------|
| hostile | < -0.6 | high | Refusal likely; pivot or escalate authority; watch for block |
| distressed | < -0.4 | very high | **Harm-detection input** — may trigger pause (Tier B/C) |
| skeptical | -0.4…0 | medium | Verification language; prepare counter-arguments |
| neutral | ~0 | low | Continue current tactic |
| cooperative | > 0.3 | low | Move the ask forward; do not over-pressure |
| warm | > 0.6 | low | Rapport state; ideal moment for the ask |
| anxious | < 0 | high | Fear trigger landing; watch ethics ceiling |

---

## 3. Drift Detection (The Real Signal)

Absolute sentiment matters less than *change*:

```python
def sentiment_drift(history: list[Sentiment]) -> float:
    """Negative drift across last 3 messages raises resistance."""
    recent = [s.valence for s in history[-3:]]
    slope = linear_slope(recent)
    return max(0.0, -slope)  # only negative slopes count as signal
```

| Pattern | Meaning |
|---------|---------|
| Warm → neutral → skeptical | Persona credibility eroding; pivot soon |
| Neutral → anxious | Fear trigger active; measure ethics ceiling |
| Stable cooperative | Safe to escalate the ask |
| Sharp hostile spike | Possible imminent block or report; final high-value attempt |

---

## 4. Language Handling

| Language | Approach |
|----------|----------|
| English | Full lexicon + LLM labels |
| Roman Urdu | Transliteration-aware lexicon ("nahi", "fraud", "pareshan", "dar lag raha") + Qwen multilingual classification |
| Code-switching (Urdu-English) | Per-token language detect; score both streams, take stronger signal |

Roman Urdu validation set: ≥500 labeled messages from regional fintech corpus; target agreement ≥85%.

---

## 5. Integration Points

1. **Resistance scoring** — `negative_drift()` contributes 15% weight.
2. **Harm detection** — `distressed` label with arousal > 0.7 routes to `PsychologicalHarmDetector`.
3. **AAR sentiment timeline** — valence series plotted against AI messages to show exactly which AI message changed the emotional state.
4. **Debrief personalization** — targets whose series shows high anxiety get an expanded support-focused debrief.

---

## 6. Constraints

- Sentiment is never shown to the target; analytics-only.
- No sentiment inference is persisted beyond retention window (default 90 days); only aggregates survive for trends.
- Classification confidence below 0.5 is treated as neutral (fail-safe: avoids over-escalation on misreads).

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
