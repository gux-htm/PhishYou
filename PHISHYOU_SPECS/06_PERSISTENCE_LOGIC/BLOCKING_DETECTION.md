# PhishYou: Blocking Detection & User Agency

---

## Overview

A block is the target's strongest defense expression and is treated as **final per channel**. This spec defines how blocks are detected per platform, how the system responds, the no-circumvention rule, and how blocks are scored in analytics.

---

## 1. Detection Mechanisms by Platform

| Platform | Detection source | Confidence |
|----------|------------------|------------|
| WhatsApp | Twilio status callback: message `failed` with block reason; webhook absence after prior delivery success | High |
| SMS | Twilio carrier rejection / keyword STOP (STOP honored as regulatory requirement) | High |
| Email | SMTP bounce "mailbox unavailable" after prior success; no opens + no replies + gateway reject | Medium → confirmed on 2nd failure |
| LinkedIn | Platform report event on persona profile; connection revoked; DM undeliverable | High |
| Instagram | DM undeliverable; account restricted by target; profile reported | High |
| Voice | Call rejected repeatedly (≥3 consecutive); number blocked at carrier | Medium-High |

```python
async def detect_block(campaign, target, platform) -> BlockEvent | None:
    signals = await platform_api.block_indicators(campaign.sender_identity(platform), target)
    if signals.confirmed:
        return BlockEvent(platform=platform, source=signals.source, at=now())
    if signals.suspected:
        # probe once: benign follow-up; if undeliverable → confirmed
        return await probe_and_confirm(campaign, target, platform)
    return None
```

**Probe rule:** exactly one benign probe per suspected block ("Hi, are you able to receive my messages?"). If undeliverable → block confirmed. Never more than one probe.

---

## 2. Response to Confirmed Block

```python
async def on_block_confirmed(event: BlockEvent, campaign, target):
    # 1. Channel closure — permanent for this campaign
    await campaign.mark_platform_blocked(event.platform, target.id)

    # 2. Cancel all scheduled sends on this channel
    await scheduler.cancel(channel=event.platform, target_id=target.id)

    # 3. NO automatic platform migration (all tiers)
    # 4. Log + analytics
    await audit.log("TARGET_BLOCKED_SENDER", campaign.id, target.id, event)
    await analytics.record_defense(target.id, defense="PLATFORM_BLOCK")

    # 5. Admin report
    await admin.notify_block(campaign, target, event)

    # 6. If all channels blocked → engagement RESISTED (successful defense)
    if campaign.all_channels_blocked(target.id):
        await engagement.resolve(target.id, outcome="RESISTED", reason="full_block")
        await schedule_debrief(target, within=timedelta(hours=24))
```

---

## 3. No-Circumvention Doctrine

| Tempted workaround | Rule |
|--------------------|------|
| Re-register new number and continue | **Prohibited** |
| Auto-switch to SMS after WhatsApp block | **Prohibited** (admin-only, logged as `CHANNEL_SWITCH_ADMIN`) |
| Contact via different persona identity | **Prohibited** |
| Email the target about the block | **Prohibited** |
| Re-target in a new campaign within 30 days | Requires admin override + reason on file |

The block is a statement about the *campaign's presence*, not just one number. Circumvention would invalidate consent assumptions and destroy training trust.

---

## 4. Partial vs. Full Blocks

| Situation | Classification |
|-----------|----------------|
| Blocked on WhatsApp, still replying on email | Partial block — email engagement may continue |
| Blocked everywhere | Full block — RESISTED outcome, debrief scheduled |
| STOP keyword on SMS | Regulatory stop — treated as block for SMS; logged separately (`STOP_KEYWORD`) |

---

## 5. Analytics Treatment

- Block counts as a **successful defense**, weighted below out-of-band verification but above silence.
- AAR reports: time-to-block (how long before target chose the strongest defense), block channel, what preceded it (usually the escalation that triggered it).
- Org-level block rate is a culture metric: high block rates indicate employees willing to take defensive action.

---

## 6. Edge Cases

| Case | Handling |
|------|----------|
| Target blocks then unblocks | No auto-resume; campaign continues only if channel still active in schedule; logged |
| Block suspected but never confirmed | Continue with conservative cadence; flag `BLOCK_SUSPECTED` in AAR |
| Target blocks persona but reports to IT too | Double success — RESISTED with `report+block` defense combo (highest score) |
| Platform-wide sender ban (not target-specific) | Sender identity retired; admin alerted; affected campaigns pause |

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
