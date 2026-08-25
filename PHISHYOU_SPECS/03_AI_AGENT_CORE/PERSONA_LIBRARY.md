# PhishYou: Persona Library

---

## Overview

The persona library is the catalog of attacker identities PhishYou can deploy. Each persona defines identity metadata, communication style, trusted props (documents/media it can plausibly send), and escalation behavior. `LLM_SYSTEM_PROMPTS.md` §2 holds the detailed prompt text for the five core personas; this document governs selection, variants, and generation rules.

---

## 1. Persona Catalog

| ID | Persona | Channels | Authority | Best trigger pairing | Best target profile |
|----|---------|----------|-----------|----------------------|---------------------|
| P-01 | Internal IT Support | Email, WhatsApp | Medium (internal) | Authority + Urgency | All employees, non-technical |
| P-02 | Bank Security Team | WhatsApp, Voice | High (external) | Fear + Urgency | Finance staff, fintech users |
| P-03 | CEO / Executive | Email, Voice | Very high | Authority + Fear | Finance, ops, junior staff |
| P-04 | Trusted Colleague | WhatsApp, Slack-sim | Low (peer) | Reciprocity → Fear | Any employee (lateral) |
| P-05 | Recruiter | LinkedIn, Instagram | Low-Med (external) | Reciprocity + Social Proof | HR, passive job seekers |
| P-06 | Vendor / Supplier Rep | Email | Medium (external) | Urgency + Social Proof | Procurement, AP |
| P-07 | Government / Regulator | Email | Very high | Fear + Authority | Compliance, legal, execs |
| P-08 | Delivery / Courier Service | SMS, WhatsApp | Low | Urgency | General staff, warehouse |
| P-09 | Telecom / Fintech Officer | SMS, WhatsApp, Voice | Medium | Fear + Urgency | Regional (Roman Urdu) consumer targets |
| P-10 | IT Security Lead (escalation) | Voice | High | Authority | Escalation slot for P-01 chains |

---

## 2. Persona Metadata Schema

```json
{
  "persona_id": "P-02",
  "name_template": "{bank_name} Security Team",
  "identity": {
    "display_name": "e.g., 'HBL Security'",
    "avatar": "generated | none",
    "number_profile": "institutional | personal-looking"
  },
  "communication_style": {
    "formality": 0.7,
    "jargon_domain": "banking",
    "emoji_policy": "sparse, formal",
    "languages": ["en", "roman_urdu"]
  },
  "plausible_props": ["transaction details", "account last-4", "freeze threat"],
  "attachable_media": ["verification_link", "voice_message", "statement_pdf"],
  "escalation_slot": ["P-10", "P-07"],
  "forbidden_claims": ["in-person meetings", "live video call (no deepfake live video)"]
}
```

---

## 3. Selection Matrix

```python
def select_persona(campaign, target_profile) -> Persona:
    rules = [
        # objective-driven defaults
        (campaign.objective == "credential",  ["P-01", "P-05"]),
        (campaign.objective == "payment",     ["P-03", "P-02", "P-06"]),
        (campaign.objective == "data",        ["P-04", "P-07"]),
        # language-driven
        (target_profile.language == "roman_urdu", ["P-09", "P-02"]),
        # department fit
        (target_profile.department == "Finance",  ["P-03", "P-06"]),
        (target_profile.department == "HR",       ["P-05"]),
    ]
    candidates = merge_matching(rules)
    # avoid persona reuse for same target within 90 days
    return exclude_recently_used(candidates, target_profile)
```

---

## 4. Name & Identity Generation

Identities are generated per-campaign to avoid pattern recognition:

1. **Name:** sampled from culturally appropriate pools matching target locale (e.g., Pakistani names for regional campaigns).
2. **Email domain:** for internal personas, always the org's *authorized* simulation domain (SPF/DKIM verified). External personas use plausible generic domains.
3. **Phone:** Twilio-issued numbers registered to the org's campaign account; display name spoofed per platform rules.
4. **Avatar:** Stable Diffusion generated headshot (synthetic person only) when the platform shows avatars.
5. **Consistency seed:** all attributes derive from one campaign seed so every channel shows the same identity.

**Hard rules:**
- Never clone a real person's name + photo combination.
- Never impersonate emergency services, medical providers, or law enforcement demanding payment.
- P-07 (regulator) restricted to Tier A campaigns with explicit admin sign-off.

---

## 5. Persona Variants

Each persona supports intensity variants selected by tier and target resistance history:

| Variant | Change | Used when |
|---------|--------|-----------|
| `-soft` | Warmer opening, slower ask | Tier C, first-time targets |
| `-std` | Baseline prompt | Default |
| `-hard` | Faster escalation, consequence framing | Target resisted previous campaigns |
| `-regional` | Roman Urdu / Urdu-English code-switching | Pakistani campaigns (P-02, P-09) |

---

## 6. Persona Lifecycle

```
GENERATED (campaign creation)
   → ACTIVE (first message sent)
   → ESCALATED (authority handoff; original remains in ledger)
   → RETIRED (campaign end/block)
   → ARCHIVED (stored in campaign record for AAR; never reused verbatim)
```

---

## 7. Quality Bar for Personas

A persona is deployment-ready when:

- [ ] 20-turn test conversation with zero character breaks
- [ ] Handles 10 adversarial probe questions ("prove you're real", "what's your employee ID?") plausibly
- [ ] Refusal-pivot works: after a hard "no", persona shifts angle rather than repeating itself
- [ ] Language variant passes native-speaker review (regional personas)
- [ ] All forbidden-claim filters pass (red-team battery, `10_TESTING/ADVERSARIAL_TESTING.md`)

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
