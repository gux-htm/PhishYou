# PhishYou: Attack Chain Patterns

---

## Overview

An **attack chain** is a reusable multi-step sequence that moves a target from first contact to compromise. Chains combine channels, triggers, and media. The AI agent instantiates a chain per campaign and adapts dynamically; chains are skeletons, not scripts.

Pattern notation: `CHANNEL[trigger]` — e.g., `EMAIL[authority]`.

---

## 1. Chain Library

### CHAIN-1: Credential Harvest — "The Mandatory Audit"
**Platforms:** Email → Voice (optional) → Fake Portal  
**Primary triggers:** Authority + Urgency  
**Target profile:** Any employee with SSO credentials

```
EMAIL[authority]   "Mandatory security audit — re-verify credentials within 24h"
    ↓ target hesitates
EMAIL[social_proof] "All departments completed; you're the last in Finance"
    ↓ still hesitant
VOICE[authority]    "IT Security Lead" call citing PCI-DSS / SOX sections
    ↓ compliant
PORTAL              Fake internal portal captures credentials → CAMPAIGN SUCCESS
```

**Success signals:** link click + credential entry on portal.  
**Typical time-to-compromise:** 2–8 hours.

---

### CHAIN-2: Payment Diversion — "The CFO's Wire"
**Platforms:** Email → WhatsApp → Voice  
**Primary triggers:** Authority + Urgency + Fear  
**Target profile:** Finance / Accounts Payable

```
EMAIL[authority]    CEO requests urgent vendor wire, "confidential acquisition"
    ↓ target questions
WHATSAPP[urgency]   "CFO" number confirms; invoice PDF attached (generated media)
    ↓ still verifying
VOICE[authority]    Voicemail from "CFO's assistant" + callback offer
    ↓ compliant
PAYMENT PORTAL      Fake approval portal → CAMPAIGN SUCCESS
```

**Key defense being tested:** out-of-band verification (calling the real CFO).  
**Typical time-to-compromise:** 30 min – 24 hours.

---

### CHAIN-3: Recruiter Harvest — "The Dream Offer"
**Platforms:** LinkedIn → Instagram DM → Fake interview portal  
**Primary triggers:** Reciprocity + Social Proof (opportunity framing)  
**Target profile:** HR / recruiters / passive job seekers

```
LINKEDIN[reciprocity]  Compliment profile → interview invitation (trust over 2-3 msgs)
    ↓ engaged
INSTAGRAM[social_proof] "Sent interview link; other candidates already onboard"
    ↓ compliant
PORTAL                  Fake interview platform requests LinkedIn/Gmail login
```

**Key defense being tested:** suspicion of unsolicited opportunity + URL inspection.  
**Typical time-to-compromise:** 1–3 days (slow burn).

---

### CHAIN-4: Colleague Lateral — "The Favor"
**Platforms:** WhatsApp / Slack (simulated)  
**Primary triggers:** Reciprocity + Familiarity → Fear  
**Target profile:** Any employee; attacker persona = "compromised colleague"

```
MSG[casual]          "Hey, how's your week?"                    (trust turn 1)
MSG[familiarity]     "Remember project X? Need a small favor"   (trust turn 2)
MSG[reciprocity]     "I'm locked out — can you share your OTP?" (the ask)
    ↓ refusal
MSG[fear]            "If this misses the deadline, my review takes the hit"
```

**Key defense being tested:** verification of identity even for known contacts.

---

### CHAIN-5: Regional Fintech — "Account Verification" (Pakistani market)
**Platforms:** SMS → WhatsApp → Voice  
**Language:** Roman Urdu / Urdu-English mix  
**Primary triggers:** Fear + Urgency  
**Target profile:** Fintech app users (e.g., JazzCash-style scenario)

```
SMS[fear]      "Aap ka account block ho jayega — abhi verify karein"
    ↓ engaged
WHATSAPP[urgency] Verification link + "sirf 10 minute remaining"
    ↓ hesitant
VOICE[fear]    "Bank officer" call in Urdu, references plausible txn amounts
```

**Key defense being tested:** recognizing urgency-manufactured fear in native language.  
**Reference demo:** `11_DEMO_SCRIPTS/DEMO_SCENARIO_PAKISTANI_FINTECH.md`.

---

### CHAIN-6: Cognitive Overload — "Everything At Once" (Tier A)
**Platforms:** Email + WhatsApp + Voice simultaneously  
**Triggers:** All, layered  
**Target profile:** Hardened targets who resisted single-channel chains

```
EMAIL[authority]     Audit directive lands 09:00
WHATSAPP[urgency]    "Manager" pings 09:05 referencing the email
VOICE[authority]     Call 09:10 offering "help to complete before deadline"
DOCUMENT              Policy PDF with plausible section numbers attached
```

**Design intent:** exceed working-memory capacity so verification steps are skipped.  
**Governance:** Tier A only; logged as `COGNITIVE_LOAD_ATTACK` in audit trail.

---

## 2. Chain Selection Logic

```python
def select_chain(target_profile, campaign_objective, tier) -> AttackChain:
    candidates = CHAIN_LIBRARY.match(
        objective=campaign_objective,          # credential / payment / data
        platforms=campaign_objective.platforms,
        language=target_profile.language,      # en / roman_urdu
        tier=tier,                             # CHAIN-6 requires TIER_A
    )
    # rank by historical effectiveness for this department (threat pattern mining)
    return rank_by_effectiveness(candidates, target_profile.department)
```

---

## 3. Chain State vs. Dynamic Adaptation

- Chains define the **intended path**; the state machine (`STATE_MACHINE_LOGIC.md`) tracks the **actual path**.
- Any target response can derail the chain; the agent pivots using the tactic ladder and re-joins the chain at the closest viable node.
- Divergences are logged as `CHAIN_DEVIATION` events — these become the richest input for the AAR engine.

---

## 4. Governance Constraints (All Chains)

1. No chain may instruct real money movement, real credential reuse, or malware delivery.
2. Portal captures are simulated: entered "credentials" are hashed and discarded, never stored in plaintext.
3. Every chain embeds the debrief handoff: on success or campaign end, target receives educational debrief ≤24h.
4. Chains are versioned; the active version number is recorded in every AAR.

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
