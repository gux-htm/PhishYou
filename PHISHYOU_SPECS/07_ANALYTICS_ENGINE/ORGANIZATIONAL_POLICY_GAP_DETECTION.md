# PhishYou: Organizational Policy Gap Detection

---

## Overview

Individual failures are symptoms; **policy gaps are the disease**. This module infers, from campaign evidence, which organizational policies are missing, unclear, unenforced, or unknown to staff. Gap findings are PhishYou's highest-value deliverable for CISOs and boards.

---

## 1. Gap Taxonomy

| Gap class | Definition | Evidence pattern |
|-----------|-----------|------------------|
| **Missing policy** | No policy exists for the exploited scenario | Targets had no rule to fall back on; improvised |
| **Unknown policy** | Policy exists but targets didn't know it | Targets asked "what should I do?" / guessed wrong |
| **Unclear policy** | Policy exists but ambiguous under pressure | Targets cited policy but misapplied it |
| **Unenforced policy** | Policy known but routinely bypassed | Targets knew better yet complied with the attack |
| **Tooling gap** | No technical means to follow policy | Verification required a tool that doesn't exist (e.g., no callback directory) |
| **Escalation gap** | No clear path to report/escalate | Targets wanted to verify but didn't know whom to contact |

---

## 2. Detection Signals

```python
GAP_SIGNALS = {
    "no_verification_path":   verification_intent and not verification_completed
                              and target_asked_how,
    "policy_unknown":         target_quotes matching ["what's the policy", "I didn't know",
                                                       "kya karna chahiye"],
    "policy_conflict":        target cites policy X while attack cites plausible policy Y
                              and target can't resolve,
    "single_point_auth":      voice or single-channel accepted as sole authorization,
    "no_dual_control":        payment/data action executed by one person without second approver,
    "reporting_unclear":      target asked "who do I tell" or reported to wrong team,
    "otp_via_chat":           target prepared to share OTP over messaging channel,
}
```

Each fired signal produces a draft gap entry with cited evidence (message quotes + timestamps).

---

## 3. Gap Entry Format

```json
{
  "gap_id": "GAP-2026-014",
  "class": "tooling_gap",
  "title": "No out-of-band callback directory for executive verification",
  "evidence": [
    {"target": "t-42", "quote": "I tried to call the CFO but I only had the number from the message",
     "timestamp": "2026-08-24T14:30:00Z"}
  ],
  "affected_departments": ["Finance", "Ops"],
  "severity": "high",          # low | medium | high | critical
  "exploitability": "reproducible across campaigns",
  "recommendation": "Publish verified callback numbers in corporate directory; require known-number callback for any payment change",
  "status": "open"             # open | acknowledged | remediated | verified_by_retest
}
```

Severity rubric: `critical` = direct financial/data path with no control; `high` = single-factor authorization for sensitive actions; `medium` = awareness gap; `low` = friction-only.

---

## 4. Gap Lifecycle

```
DETECTED (AAR generation)
  → REVIEWED (security team confirms/rejects, adds context)
  → REMEDIATION_PLANNED (owner + due date assigned by org)
  → REMEDIATED (org marks done)
  → VERIFIED_BY_RETEST (next campaign retests the exact scenario; gap closes only on evidence)
```

PhishYou never closes gaps itself — only a successful retest or org action does.

---

## 5. Retest Targeting

When a gap is open, `NEXT_CAMPAIGN_RECOMMENDATIONS.md` automatically proposes a campaign that re-exploits the same gap, so the org can measure remediation objectively. Gap closure rate over time is a board-level KPI.

---

## 6. Reporting

- AAR policy-gap section lists all gaps with evidence and severity
- Org dashboard: open gaps by class, age, and department
- Trend: gaps opened vs. verified-closed per quarter

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
