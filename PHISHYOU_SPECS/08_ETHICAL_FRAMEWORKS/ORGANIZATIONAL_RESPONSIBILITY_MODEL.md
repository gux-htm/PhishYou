# PhishYou: Organizational Responsibility Model

---

## Overview

PhishYou is a tool; the deploying organization is the actor. This model assigns explicit responsibilities between **PhishYou (platform)**, the **Organization (operator)**, and **HR/Legal (oversight)** so accountability is never ambiguous when something goes wrong. It is formalized in the org attestation (`CONSENT_FRAMEWORK.md`).

---

## 1. Responsibility Assignment Matrix

| Responsibility | PhishYou | Organization | HR/Legal |
|----------------|:--------:|:------------:|:--------:|
| Platform safety features (pauses, blocks, harm detection) | **R** | configure | review |
| Legal compliance of simulation program in jurisdiction | advise | **R** | **A** |
| Employee consent collection & records | provide forms | **R** | **A** |
| Target selection fairness (no discriminatory targeting) | tooling guards | **R** | **A** |
| Tier selection & intensity decisions | defaults + warnings | **R** | approve Tier A |
| Debrief delivery | automate | verify completion | own content tone |
| Psychological support (EAP) availability | require contact config | **R** | **A** |
| Incident response to distress events | detection + pause | human follow-up | **A** |
| Use of results (no disciplinary misuse) | contractual prohibition | **R** | **A** |
| Data protection & retention configuration | enforce technically | configure | review |
| Audit trail integrity | **R** | verify | rely |

R = Responsible, A = Accountable.

---

## 2. What PhishYou Guarantees

1. Features behave as specified; guardrails cannot be silently disabled (Tier C harm detection).
2. Complete, immutable audit trail of every action.
3. No campaign runs without the consent prerequisites technically verified.
4. Known defects affecting safety are disclosed to all operators within 72h.
5. Platform never repurposes conversation data (no training on tenant data without explicit opt-in).

## 3. What the Organization Must Provide

1. **Legal review attestation** — signed confirmation the program complies with local labor and privacy law.
2. **Consent infrastructure** — signed employee consent on file before any targeting; withdrawal honored within 60s.
3. **Named oversight contacts** — HR owner and security owner per campaign, reachable during active campaigns.
4. **Support readiness** — EAP or equivalent support contact configured and staffed.
5. **Debrief commitment** — delivery within 24h verified; escalated human debrief on distress.
6. **No-misuse pledge** — attestation clause that results feed training, never discipline.

## 4. Tier-Specific Responsibility Shifts

| Area | Tier C | Tier B | Tier A |
|------|--------|--------|--------|
| Harm monitoring | Platform (mandatory) | Platform (optional) + org attention | **Organization fully** |
| Intensity decisions | Platform caps | Platform caps | **Organization fully** |
| Wellbeing follow-up | Standard debrief | Standard + support msg | HR proactive check-ins required |
| Legal attestation depth | Standard | Standard | **Enhanced (counsel-signed)** |

Tier A's philosophy: the platform provides transparency (logs, feeds, alerts); the org provides judgment.

---

## 5. Incident Accountability Flow

```
Distress/complaint occurs
  → PhishYou: freezes affected engagement, preserves evidence, notifies org (<5 min)
  → Organization: HR contacts employee within 4h business time; documents outcome
  → Joint review: root cause (content? intensity? targeting? consent gap?)
  → Corrective action: config change / retraining of admins / program pause
  → Record: incident entry in audit log with resolution
```

---

## 6. Contractual Backstops

- Org attestation is versioned; material program changes require re-attestation.
- PhishYou may suspend an org account for guardrail circumvention attempts.
- Liability allocation follows the attestation; platform liability capped at service fees except for gross negligence.

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
