# PhishYou: Next Campaign Recommendations

---

## Overview

After every campaign, the recommendation engine proposes the next campaign — what to test, against whom, with which chain/persona/tier — so the simulation program compounds instead of repeating. Recommendations are advisory; admin approval always required.

---

## 1. Recommendation Sources

| Source | Produces recommendations like |
|--------|------------------------------|
| **Open policy gaps** | Retest the exact scenario that exposed GAP-2026-014 to verify remediation |
| **Compromised cohorts** | Re-target Finance with a different vector (they resisted email; try voice) |
| **Uncovered surfaces** | Departments never tested; channels never used; language cohorts skipped |
| **Pattern staleness** | Last campaign >90 days ago → refresh; same chain used twice → rotate |
| **Training-cycle events** | Post-training verification campaign 4–6 weeks after awareness program |
| **Threat intelligence** | Industry patterns rising in cross-tenant data (opt-in benchmark) |

---

## 2. Recommendation Object

```json
{
  "rec_id": "REC-2026-118",
  "priority": 1,
  "type": "gap_retest",
  "title": "Verify remediation: executive callback verification gap",
  "rationale": "GAP-2026-014 marked remediated on 2026-08-10; retest pending",
  "proposal": {
    "chain": "CHAIN-2",
    "persona": "P-03",
    "channels": ["EMAIL", "WHATSAPP", "VOICE"],
    "tier": "B",
    "targets": {"department": "Finance", "filter": "previously_compromised"},
    "duration_days": 3,
    "language": "en"
  },
  "expected_signal": "verification_completed rate should exceed 80% if remediation held",
  "created_from": ["GAP-2026-014", "campaign c-812"]
}
```

---

## 3. Prioritization

```python
priority_score = (
    0.35 * gap_severity_weight        # critical gaps first
  + 0.25 * recency_weight             # stale surfaces rise
  + 0.20 * coverage_weight            # never-tested cohorts
  + 0.10 * intel_weight               # industry trend alignment
  + 0.10 * training_followup_weight
)
```

Dashboard shows top 3 with one-click "create campaign from recommendation" (prefilled, still requires consent checks).

---

## 4. Rotation & Anti-Habituation Rules

- Same chain + persona combination not recommended for the same cohort within 90 days.
- Quarterly plan suggestion mixes: 1 gap-retest, 1 new-surface, 1 stress-test (tier upgrade candidate).
- Targets are flagged if tested >2× in a rolling quarter (fatigue protection).

---

## 5. Tier Progression Advice

```
IF   last 2 campaigns Tier C with resilience > 0.7 and zero harm events
     → suggest Tier B pilot on security-savvy department
IF   Tier B stable 2 campaigns and org prerequisites met
     → suggest Tier A for Finance/privileged-access cohorts
IF   any harm event in last campaign
     → suggest tier hold or downgrade of intensity, plus debrief review
```

---

## 6. Governance

- Recommendations never bypass consent, exemption lists, or prerequisite checks.
- Admin may snooze/dismiss with reason; dismissal history tunes future weighting.
- All recommendations logged (auditability of *why* a campaign was launched).

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
