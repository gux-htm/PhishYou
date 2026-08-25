# PhishYou: Organizational Accountability

---

## Overview

PhishYou deliberately places no internal self-halt in the AI agent — persistence continues until an *external* control fires. That design decision makes organizational accountability the primary safety mechanism. This document defines what the deploying organization is contractually and operationally responsible for, how PhishYou evidences and enforces those responsibilities, and the escalation path when responsibilities are not met.

Related: `ORGANIZATIONAL_RESPONSIBILITY_MODEL.md`, `CONSENT_FRAMEWORK.md`, `AUDIT_LOGGING_SPEC.md`, `PERSISTENCE_TIERS.md`, `COMPLIANCE_CHECKLIST.md`.

---

## 1. Responsibility Division

| Domain | Organization | PhishYou |
|--------|--------------|----------|
| Legal basis for simulation | ✔ Legal review, local law compliance | Provides framework documentation |
| Employee consent | ✔ Obtaining, storing signed consent | ✔ Consent registry, verification gate before any send |
| Tier selection | ✔ Choosing A/B/C per risk tolerance | ✔ Enforcing tier caps technically |
| Oversight during campaigns | ✔ Named campaign owner on-call | ✔ Alerts (harm, block, anomaly) to admin |
| Debrief within 24h | ✔ Conducting debrief | ✔ Debrief trigger + template + tracking |
| Psychological support (EAP) | ✔ Providing access | ✔ Support-message templates at pause/harm events |
| Immutable evidence | — | ✔ Audit chain (ed25519-signed, hash-linked) |
| Reporting unusual outcomes | Reviewing alerts | ✔ Automatic detection and notification |

PhishYou enforces what it can technically enforce (consent gate, tier caps, harm pause in Tier C). Everything in the organization's column is a contractual condition of service.

---

## 2. Onboarding Preconditions (Enforced)

Campaigns cannot launch until the organization completes:

```python
ONBOARDING_GATES = {
    "legal_review_signed":      True,   # uploaded legal memo
    "consent_process_defined":  True,   # consent workflow registered
    "campaign_owner_named":     True,   # on-call admin per campaign
    "debrief_plan_submitted":   True,   # 24h debrief procedure
    "eap_contact_configured":   True,   # support line in message templates
    "tier_acknowledged":        True,   # signed tier risk acceptance (Tier A extra clause)
}
```

Tier A additionally requires the executive-sponsor signature clause acknowledging unlimited persistence and full organizational responsibility.

---

## 3. Runtime Accountability Controls

| Control | Mechanism |
|---------|-----------|
| Consent gate | No outbound send without verified consent record; attempt logged as `consent_violation_blocked` |
| Owner on-call check | Campaign launch fails if owner unreachable (pager test) |
| Harm alerts | Tier B/C distress events page the owner; unacknowledged for 30 min → auto-pause regardless of tier |
| Debrief tracker | Campaign end opens a 24h debrief ticket; overdue tickets escalate to org CISO and PhishYou compliance |
| Quarterly review | Org must certify continued consent validity; lapse suspends new campaigns |

---

## 4. Evidence Package for Auditors

For any campaign, the organization can export:

1. Signed consent record (timestamp, version of consent text).
2. Full audit chain with verification tool (hash + signature check).
3. Tier configuration snapshot at launch time.
4. All admin actions (halt, resume, tier upgrade) with identities.
5. Harm events and response timelines.
6. Debrief completion records.
7. AAR (`AAR_GENERATION_ENGINE.md`).

This package maps to ISO 27001 evidence requirements and SOC 2 audit requests (`COMPLIANCE_CHECKLIST.md`).

---

## 5. Non-Compliance Escalation

| Trigger | PhishYou Response |
|---------|-------------------|
| Debrief overdue > 48h | Warning to org CISO; new campaigns suspended |
| Harm alert unacknowledged repeatedly | Account flagged; mandatory governance review call |
| Consent audit finds gaps | All campaigns paused until remediation attested |
| Tier A misuse incident | Downgrade to Tier B pending investigation; legal notice per agreement |

---

## 6. Incident Attribution

When an adverse event occurs, the audit chain establishes the factual sequence: who configured what, which caps applied, when alerts fired, and who responded. Attribution follows:

- **System defect** (cap not enforced, alert failed) → PhishYou responsibility, RCA within 72h.
- **Process failure** (no debrief, consent gap, owner absent) → organization responsibility per §1, remediation plan required.
- **Shared** → joint RCA; both parties' timelines preserved in the evidence package.

---

## 7. Summary Principle

> The AI never decides to stop; humans decide. PhishYou's job is to make sure the humans always have the information, the controls, and the evidence to make that decision — and a permanent record that they did.

---

**Document Status:** ✅ COMPLETE
**Last Updated:** August 24, 2026
