# PhishYou: Audit Logging Specification

---

## Overview

PhishYou operates in a legally sensitive space: an AI impersonating trusted parties to employees. The audit log is the platform's accountability backbone — immutable, hash-chained, complete. Every campaign decision must be reconstructable years later for legal review, employee disputes, or regulatory examination.

---

## 1. Audit Event Catalog

| Event | Trigger | Key fields |
|-------|---------|-----------|
| `CONSENT_SIGNED` / `CONSENT_WITHDRAWN` | Consent lifecycle | org/target id, form version, timestamp, signature hash |
| `CAMPAIGN_CREATED` / `STARTED` / `HALTED` / `COMPLETED` | Campaign state machine | config snapshot, actor, reason |
| `TIER_A_AUTHORIZED` | Tier A enablement | authorizing admin, MFA event, prerequisites snapshot |
| `MESSAGE_SENT` | Every outbound artifact | campaign, target, channel, content hash, media refs |
| `MESSAGE_RECEIVED` | Every inbound message | content hash, latency, delivery metadata |
| `RESISTANCE_SCORED` | Each analysis pass | score, component signals |
| `TACTIC_SELECTED` / `TRIGGER_DEPLOYED` | Agent decisions | tactic, trigger, intensity, reason |
| `PERSONA_ESCALATION` | Persona handoff | level, personas involved |
| `MEDIA_GENERATED` | Voice/document/image | profile/script hash, watermark id |
| `TARGET_BLOCKED_SENDER` | Block detection | channel, evidence source |
| `PAUSE_GRANTED` / `HARM_DETECTED` / `AUTO_PAUSE` | Safety events | severity, signals, tier |
| `ADMIN_ACTION` | Any admin mutation | actor, scope, before/after |
| `DATA_EXPORT` / `DATA_DELETED` | DSR & retention | requester, scope, legal basis |
| `DEBRIEF_DELIVERED` | Post-campaign debrief | delivery channel, timestamp |

---

## 2. Immutability Design

```python
class AuditLog:
    id: uuid
    sequence: int                 # strictly increasing per tenant
    event_type: str
    payload: dict                 # event-specific
    actor: str                    # admin id | system:<module> | target:<id>
    at: datetime
    prev_hash: str                # hash of previous entry (hash chain)
    entry_hash: str               # sha256(sequence || event_type || payload || prev_hash)
    signature: str                # platform signing key (ed25519)
```

- **Append-only table** — no UPDATE/DELETE grants at database role level.
- **Hash chain** — tampering with any entry breaks every subsequent hash; integrity check tool runs nightly and on demand.
- **Nightly anchor** — chain head hash written to an external store (object storage with WORM policy) so even DB-level tampering is detectable.

---

## 3. Retention Matrix

| Record class | Retention | Legal basis |
|--------------|-----------|-------------|
| Audit events | 7 years | Accountability / dispute resolution |
| Consent forms | Duration + 30 days after withdrawal | GDPR Art. 7 evidence |
| Message content | 90 days default (org-configurable 30–365) | Purpose limitation |
| Behavioral aggregates | 2 years | Legitimate interest (training analytics) |
| AAR reports | 5 years | Org deliverable |

Retention expiry is itself an audited event (`DATA_DELETED`) with the deleted scope described but not the content.

---

## 4. Access Control

| Role | Audit log access |
|------|------------------|
| Org admin | Read own-tenant events (excluding raw content past retention) |
| Compliance officer | Read + integrity verification tool |
| PhishYou support | Metadata only, per-ticket scoped, itself logged |
| Legal (dispute) | Export via signed DSR workflow |

Every read/export of audit data is logged (`AUDIT_ACCESS`) — the audit log audits itself.

---

## 5. Integrity Verification

```bash
phishyou-audit verify --tenant acme --from 2026-01-01
# walks the hash chain, validates signatures, reports first broken entry if any
# exit 0 = intact | exit 1 = chain break at sequence N
```

Verification result is included in every compliance export (`COMPLIANCE_CHECKLIST.md`).

---

## 6. Performance & Scale

- Target: 500 events/sec sustained per tenant burst; write path async with WAL durability guarantee.
- Partitioned monthly; cold tier to object storage after 12 months.
- No PII in event *indexes*; content referenced by hash pointers only.

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
