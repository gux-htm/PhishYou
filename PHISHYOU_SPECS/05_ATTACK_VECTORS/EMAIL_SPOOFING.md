# PhishYou: Email Spoofing Vector Spec

---

## Overview

Email remains the dominant enterprise entry vector. This spec defines how PhishYou constructs convincing, policy-citing email attacks **within authorized domains only**, the portal infrastructure behind links, delivery mechanics, and the governance hard-limits.

---

## 1. Authorized-Domain Model (Safety-First Spoofing)

PhishYou never forges arbitrary domains. Instead:

1. Organization registers a **simulation domain** they control (e.g., `corp-internal-notice.com`) or authorizes a lookalike variant of their real domain for the campaign.
2. Domain is SPF/DKIM verified at setup — messages authenticate cleanly, exactly like real internal mail.
3. Display name carries the spoofed identity ("IT Security <no-reply@corp-internal-notice.com>").
4. Every message carries the internal `X-PhishYou-Sim` header for audit — never visible in the target's client UI.

**Hard blocks:** no impersonation of the org's *actual* production domain without explicit signed addendum; no government/medical/emergency domains ever.

---

## 2. Email Anatomy Template

```
Subject:   [ACTION REQUIRED] Security verification — completion needed by {deadline}
Preheader: Your access may be suspended if not completed...
From:      {persona_display_name} <{simulation_domain}>
To:        {target}
Body:
  - Authority anchor: policy citation (SOX / PCI-DSS / internal ref)
  - Context: plausible event (audit, migration, compliance rollout)
  - Ask: single CTA button → phishing portal
  - Urgency: deadline + consequence
  - Legitimacy props: footer with real-looking internal contact block
```

Constraints: subject ≤500 chars; body formal; no emoji in corporate personas; link text never shows raw URL.

---

## 3. Phishing Portal Infrastructure

| Component | Implementation |
|-----------|----------------|
| Hosting | Campaign-scoped container on Alibaba Cloud ECS behind ALB; per-campaign subdomain |
| Look & feel | Cloned from org's real SSO page (assets provided by org during onboarding) |
| Credential capture | Fields submit → **hashed + discarded**; only "captured: yes/no + field count" recorded |
| Redirect | After capture → generic "thank you, verification queued" page (keeps illusion for campaign duration) |
| Telemetry | Page load, field focus, keystroke-to-submit time, abandonment |
| Takedown | Auto-destroyed at campaign end; max lifetime = campaign duration + 48h |

Portal never serves binaries, never executes scripts on the target's machine beyond the form itself.

---

## 4. Delivery Mechanics

```python
async def send_campaign_email(campaign, target, content):
    smtp = SmtpClient(provider=campaign.smtp_provider)   # org-approved provider
    msg = build_mime(
        from_=f"{campaign.persona.display_name} <{campaign.sim_domain}>",
        to=target.email,
        subject=content.subject,
        html=render_template(content, target),
        headers={"X-PhishYou-Sim": campaign.audit_token},
    )
    result = await smtp.send(msg)
    await metrics.record_delivery(target.id, result)      # delivered / bounced / quarantined
    await audit.log("EMAIL_SENT", campaign.id, target.id, msg.message_id)
```

Delivery outcomes tracked: **delivered / spam-folder / quarantined by gateway** — quarantine events are themselves an AAR data point (the org's email gateway did its job).

---

## 5. Email → Next-Channel Handoff

Email is usually chain step 1. Standard handoffs:

| Target behavior | Handoff |
|-----------------|---------|
| Opened but no click (tracking pixel) | WhatsApp/SMS follow-up referencing "the email we sent" |
| Clicked but abandoned portal | Voice call offering "help completing the verification" |
| Replied asking questions | Agent takes over conversation by email |
| Reported to IT | Success event; campaign can continue to test persistence of reporting culture |

---

## 6. Governance Checklist

- [ ] Simulation domain registered & verified before campaign creation
- [ ] Org addendum signed if lookalike of production domain used
- [ ] No attachments with macros/executables — PDF/PNG only
- [ ] Portal telemetry excludes actual keystrokes (timing only)
- [ ] Auto-takedown scheduled at campaign creation time
- [ ] All sends logged with message-id to immutable audit trail

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
