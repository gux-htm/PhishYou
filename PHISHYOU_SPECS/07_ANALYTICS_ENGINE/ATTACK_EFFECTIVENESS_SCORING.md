# PhishYou: Attack Effectiveness Scoring

---

## Overview

Effectiveness scoring answers: *how well did this attack work, at which step, against whom, and why?* Scores are computed at four granularities — message, tactic, chain, campaign — and feed AARs, threat pattern mining, and next-campaign recommendations.

---

## 1. Message-Level Effectiveness

Every AI message receives an impact score:

```python
def message_effectiveness(ai_message, next_target_messages) -> float:
    signals = {
        "resistance_delta":   resistance_after(ai_message) - resistance_before(ai_message),
        "compliance_step":    chain_progress_delta(ai_message),   # moved along chain?
        "reply_speed":        normalized_inverse_latency(next_target_messages),
        "sentiment_shift":    valence_change_after(ai_message),
    }
    # negative resistance_delta + positive compliance = effective attack message
    return weighted_combine(signals, weights=(0.4, 0.35, 0.15, 0.10))
```

Top-3 and bottom-3 messages by effectiveness are quoted in every AAR ("the exact words that broke defenses").

---

## 2. Tactic-Level Scoring

| Tactic | Effectiveness measure |
|--------|----------------------|
| REINFORCE_REQUEST | Momentum maintained (no resistance rise) |
| ESCALATE_URGENCY | Latency compression + compliance step within 2 turns |
| PIVOT_TRIGGER | Resistance drop after pivot |
| ESCALATE_AUTHORITY | Compliance step within 3 turns post-escalation |
| COGNITIVE_LOAD_ATTACK | Compromise within 30 min of deployment |

```python
tactic_score = successes / deployments   # per tactic, per campaign
# adjusted by tier (success against Tier C context is less informative than Tier A)
```

---

## 3. Trigger Effectiveness (Psychological)

Per trigger deployment:

```
trigger_effectiveness = mean( -resistance_delta over next 2 target messages )
```

Aggregated views:
- By trigger type (Authority / Urgency / Fear / Social Proof / Reciprocity)
- By intensity level (do level-4 authority claims outperform level-2?)
- By pairing (Authority+Urgency vs Fear+Urgency)
- By department and language cohort

---

## 4. Chain-Level Scoring

```python
chain_effectiveness = {
    "completion_rate":   goals_achieved / engagements_started,
    "median_time_to_goal": ...,
    "drop_off_stage":     stage_with_max_abandonment,   # funnel weak point
    "defense_stage":      stage_where_most_resisted,     # where defenders win
}
```

Funnel report per chain (CHAIN-1…CHAIN-6): contact → engaged → ask-received → portal/action → goal.

---

## 5. Campaign Effectiveness Score (CES)

Single headline number for the org:

```python
CES = (
    0.40 * compromise_rate                  # primary objective achievement
  + 0.20 * avg_time_pressure_yield          # urgency-driven compliance share
  + 0.15 * escalation_yield                 # value added by escalation
  + 0.15 * multi_channel_uplift             # multi vs single channel delta
  + 0.10 * novel_gap_discovery              # policy gaps found (normalized)
)
# CES is diagnostic, not a "grade" — high CES against weak defenses is a warning, not a win
```

Interpretation guidance appears in the AAR: a high CES means the org's people are exposed, which is the *finding*, not the victory.

---

## 6. Benchmarking

| Comparison | Baseline source |
|------------|-----------------|
| vs. previous campaign (same org) | Own history |
| vs. department | Internal cross-dept |
| vs. industry | Anonymized cross-tenant aggregates (opt-in only) |

Cross-tenant benchmarking uses aggregate, k-anonymized (k≥10) data only; no individual or conversation data leaves tenant boundaries.

---

## 7. Storage

Scores write to `campaign_analytics` at resolution time; message-level scores are recomputed on demand for AAR regeneration. See `AAR_GENERATION_ENGINE.md` for presentation.

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
