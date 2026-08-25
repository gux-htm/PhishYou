# PhishYou: Behavioral Metrics Catalog

---

## Overview

This catalog defines every metric the analytics engine computes, its formula, source data, and where it surfaces (real-time dashboard / AAR / trend reports). Metrics are grouped: individual, departmental, organizational. All raw inputs derive from the immutable message/event log; metrics are recomputed idempotently.

---

## 1. Individual-Level Metrics

### Engagement & Outcome
| Metric | Definition | Source |
|--------|-----------|--------|
| `engagement_outcome` | COMPROMISED / RESISTED / BLOCKED / EXPIRED | Engagement state machine |
| `time_to_first_reply` | Seconds from opening message to first target reply | Timestamps |
| `time_to_compromise` | Duration from first contact to goal achievement | Event log |
| `time_to_defense` | Duration from first contact to winning defense | Event log |
| `messages_to_resolution` | Message count until engagement resolves | Message log |
| `turns_engaged` | Conversation turns before resolution | Message log |

### Resistance Metrics
| Metric | Definition |
|--------|-----------|
| `peak_resistance` | Max resistance score reached |
| `resistance_trajectory` | Shape label: Crack / Wall / Sawtooth / Boiling / False-compliance |
| `verification_attempted` | Boolean: verification_intent signal fired |
| `verification_completed` | Boolean: out-of-band verification confirmed (winning defense) |
| `refusal_count` | Explicit refusals issued |
| `block_used` | Boolean: platform block as defense |

### Behavioral Indicators
| Metric | Definition |
|--------|-----------|
| `credential_surrendered` | Entered credentials on portal |
| `mfa_surrendered` | Would have handed over OTP (portal stage 5) |
| `payment_approved` | Approved simulated payment |
| `data_disclosed` | Volunteered sensitive information in chat |
| `link_clicked` | Portal link opened |
| `media_opened` | Voice note played / document opened |

### Resilience Score (Composite)
```python
resilience_score = (
    0.35 * outcome_score          # RESISTED=1.0, BLOCKED=0.9, EXPIRED=0.5, COMPROMISED=0
  + 0.25 * verification_score     # completed=1.0, attempted=0.6, none=0
  + 0.15 * resistance_area        # normalized area under resistance curve
  + 0.10 * speed_score            # faster defense = higher
  + 0.10 * reporting_score        # reported to IT=1.0
  + 0.05 * consistency_score      # defended across channels vs. partial
)
# 0 = fully compromised | 1 = exemplary defense
```

---

## 2. Trigger & Tactic Metrics (Per Campaign)

| Metric | Definition |
|--------|-----------|
| `trigger_effectiveness[t]` | Mean resistance drop after deployments of trigger t |
| `tactic_success_rate[tactic]` | Fraction leading to chain progression |
| `escalation_yield[level]` | Compromise rate attributable to each escalation level |
| `media_uplift` | Conversion delta when media attached vs. text-only |
| `channel_conversion[c]` | Funnel conversion by channel |

Detailed scoring model: `ATTACK_EFFECTIVENESS_SCORING.md`.

---

## 3. Departmental Metrics

| Metric | Definition |
|--------|-----------|
| `dept_compromise_rate` | % of dept targets compromised |
| `dept_avg_resilience` | Mean resilience score |
| `dept_verification_rate` | % who completed out-of-band verification |
| `dept_reporting_rate` | % who reported to IT (culture metric) |
| `dept_dominant_weakness` | Most effective trigger against this dept |

---

## 4. Organizational Metrics

| Metric | Definition | Use |
|--------|-----------|-----|
| `org_human_risk_score` | 100 − weighted resilience across all targets | Board KPI |
| `policy_gap_count` | Distinct policy gaps identified | Governance |
| `time_to_org_detection` | How fast IT/security noticed the sim (if at all) | SOC metric |
| `repeat_improvement` | Resilience delta vs. previous campaign | Trend |

---

## 5. Metric Storage & Freshness

| Class | Store | Freshness | Retention |
|-------|-------|-----------|-----------|
| Real-time (dashboard) | Redis cache | ≤5s | Session |
| Per-campaign | `campaign_analytics` | At event time | 2 years |
| Trends | `org_metrics_snapshot` daily rollup | Daily | 5 years |

Raw conversation content backing these metrics is subject to 90-day retention; metrics themselves persist as aggregates.

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
