# PhishYou: Threat Pattern Mining

---

## Overview

Threat pattern mining aggregates campaign history into reusable intelligence: *which attack patterns work, against whom, under which conditions*. It powers chain selection ranking, industry benchmarking (privacy-preserving), and the recommendation engine. Storage: `threat_intelligence` table.

---

## 1. Pattern Dimensions

Every resolved engagement contributes a feature vector:

```python
PatternRecord = {
    # attack features
    "chain_id": "CHAIN-2",
    "persona_id": "P-03",
    "triggers": ["AUTHORITY", "URGENCY"],
    "trigger_intensity_max": 4,
    "channels": ["EMAIL", "WHATSAPP", "VOICE"],
    "media_used": ["voice_note", "invoice_pdf"],
    "escalation_depth": 3,
    "language": "en",
    # target features (generalized)
    "department": "Finance",
    "role_seniority": "mid",
    "tech_savviness_band": "normal",
    "fatigue_window_hit": True,
    # outcome
    "outcome": "COMPROMISED",
    "time_to_resolution_min": 154,
    "winning_or_losing_factor": "voice_note_after_deadline_tightening",
}
```

PII never enters the pattern store — only generalized attributes.

---

## 2. Mining Outputs

### 2.1 Effective Pattern Ranking
```python
def rank_patterns(department, objective):
    patterns = threat_intel.filter(department=department, objective=objective)
    return sorted(patterns, key=lambda p: p.compromise_rate, reverse=True)
```
Used by `ATTACK_CHAIN_PATTERNS.md` §2 chain selection.

### 2.2 Defensive Pattern Discovery
Equally valuable: patterns that *consistently fail* reveal org strengths:
- "Finance blocks 90% of WhatsApp-first attacks" → don't waste campaigns there
- "Verification rate doubles when opening message cites a policy" → awareness is policy-anchored

### 2.3 Cohort Insights
| Cohort | Example finding |
|--------|-----------------|
| Department | Ops falls for urgency; Legal falls for authority |
| Seniority | Managers resist peer personas better than junior staff |
| Language | Roman Urdu campaigns show 22% faster compromise than English equivalents in same org |
| Time | Compromises cluster 15:00–17:00 |

---

## 3. Cross-Tenant Intelligence (Opt-In, Privacy-Preserving)

| Rule | Implementation |
|------|----------------|
| Opt-in only | Org enables benchmarking contribution explicitly |
| Aggregation | k-anonymity (k ≥ 10) before any cross-tenant view |
| Generalization | Departments and roles generalized; no names, no messages |
| Output | Industry median curves, not individual records |
| Withdrawal | Org can withdraw; aggregates recompute within 24h |

---

## 4. Pattern Lifecycle

```
OBSERVED (first occurrence)
  → CONFIRMED (reproduced in ≥2 campaigns)
  → PUBLISHED (available to selection/recommendation engines)
  → STALE (no confirmation in 12 months; deprioritized)
```

---

## 5. Threat-Intel Deliverables

- **Quarterly pattern report** per org: top effective attacks, emerging weaknesses
- **Industry snapshot** (opt-in): where this org sits vs sector medians
- **Red-team brief**: for internal security teams — "these are the patterns most likely to be used by real adversaries against you"

---

## 6. Governance

- Pattern store subject to 5-year retention, then aggregated further
- No cross-tenant data flows to LLM prompts (tenant isolation)
- Mining jobs run on anonymized replicas, not production PII tables

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
