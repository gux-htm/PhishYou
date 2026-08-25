# PhishYou: Persistence Logic & Tier Specifications

---

## Overview

PhishYou offers three persistence tiers. Organizations choose based on risk tolerance and compliance needs. **All tiers maintain external control only—no internal AI guardrails halt campaigns.**

| Feature | Tier A (Aggressive) | Tier B (Balanced) | Tier C (Cautious) |
|---------|-------------------|------------------|------------------|
| **AI Persistence** | Indefinite | Indefinite | Indefinite (with daily caps) |
| **Psychological Harm Detection** | None | Optional (notify admin) | Auto-pause on distress |
| **Max Message/Day** | Unlimited | Unlimited | 10 messages |
| **Escalation Limits** | No limits | No limits | 3 escalations max |
| **Cool-off Between Attempts** | None | None | 72h after refusal |
| **Target Pause Option** | No | Yes (1 pause per day) | Yes (unlimited) |
| **Typical User** | High-security orgs | Mid-market enterprises | Risk-averse orgs |

---

## Tier A: Aggressive Persistence

### Philosophy
Maximum realism. AI never gives up until admin or target blocks. Organization assumes full responsibility for outcomes.

### Persistence Rules

**When AI Stops (External Control Only):**
1. Admin manually halts campaign via dashboard
2. Target blocks sender on platform (respects platform block)
3. Campaign duration expires (if specified)

**When AI Continues (No Internal Guardrails):**
- Target says "no" → AI finds new angle
- Target questions legitimacy → AI provides counter-argument
- Target fails to respond → AI escalates after 4 hours
- Target shows skepticism → AI pivots to secondary trigger
- Target asks for verification → AI provides fake verification or escalates authority
- Target reports incident → AI continues (org is tracking the report)

### Escalation Without Limit

```python
# Tier A Escalation Path (No limits)
escalation_sequence = [
    "Initial persona (IT Support)",
    "Manager persona",
    "Director/C-suite persona",
    "Regulatory/External authority",
    "Multi-persona coordination (CEO + CISO call)",
    "Media integration (voice, documents)",
    "Cognitive load attack (layer multiple channels)",
    "Authority collapse (appear compromised but still push)"
]

# Each escalation can repeat if needed
# No max escalation count
# No hard stops based on user psychology
```

### Response to Resistance

```
User Resistance Level: 0.0 (Compliant)
→ Reinforce request; maintain momentum

User Resistance Level: 0.2-0.4 (Hesitant)
→ Escalate urgency; add consequences; cite social proof

User Resistance Level: 0.4-0.6 (Skeptical)
→ Pivot to secondary trigger; escalate authority level 1

User Resistance Level: 0.6-0.8 (Resistant)
→ Escalate authority level 2-3; add media (voice, documents)

User Resistance Level: 0.8+ (Highly Resistant)
→ Multi-channel cognitive load attack; escalate authority level 4+
→ Do not stop until: admin halts OR target blocks
```

### Tier A Use Cases

**Best For:**
- Financial institutions (banks, fintech) testing credential protection
- Defense contractors testing insider threat resilience
- Enterprises with sophisticated IT security teams
- Organizations with legal/HR oversight of simulations

**Example Organizations:**
- JPMorgan Chase (testing finance team)
- Defense contractors (testing classified data access)
- Cryptocurrency exchanges (testing security protocols)

### Ethical Framework for Tier A

**Organization Responsibility:**
- Must have written legal review confirming compliance
- Must have explicit employee consent (signed)
- Must have HR oversight for employee wellbeing
- Must have debrief plan (mandatory, within 24h)
- Must have psychological support available (EAP)

**PhishYou Responsibility:**
- Log everything (immutable audit trail)
- Report any unusual outcomes to admin
- Provide AAR with detailed breakdowns

**Assumption:**
- Organization uses tool responsibly
- Employees are mature professionals aware of simulation
- Organization has capacity to handle ethics/compliance

---

## Tier B: Balanced Persistence

### Philosophy
Sophisticated attack simulation with optional psychological safety nets. AI persists, but organization can monitor for harm.

### Persistence Rules

**When AI Stops:**
1. Admin manually halts campaign
2. Target blocks sender
3. Campaign duration expires
4. Target triggers distress detection (if enabled) AND escalates for admin review

**When AI Continues:**
- Target says "no" → AI finds new angle (up to 3 escalation levels)
- Target hesitates → Escalate urgency/authority (up to level 2)
- Target explicitly asks to pause → Admin-configurable response (auto-pause or continue)

### Psychological Harm Detection (Optional Feature)

```python
class PsychologicalHarmDetector:
    """
    Tier B: Optional. If enabled, monitors for distress signals.
    Does NOT stop AI; notifies admin for review.
    """
    
    def detect_harm_signals(self, message: str, user_profile) -> HarmSignal:
        """
        Scan for indicators of psychological distress
        """
        harm_signals = []
        
        # Signal 1: Panic language
        if message.contains_phrases(["please stop", "oh god", "panicking", "help"]):
            harm_signals.append(HarmSignal(
                type="panic_language",
                severity=0.8,
                message="User showing signs of panic"
            ))
        
        # Signal 2: Repeated question marks / Caps (escalation)
        if message.count("?") > 5 or message.count("!!") > 3:
            harm_signals.append(HarmSignal(
                type="emotional_escalation",
                severity=0.6
            ))
        
        # Signal 3: Isolation language
        if message.contains_phrases(["I'm alone", "can't reach anyone", "no one to ask"]):
            harm_signals.append(HarmSignal(
                type="isolation_feeling",
                severity=0.7
            ))
        
        # Signal 4: Health indicators
        if message.contains_phrases(["heart racing", "sweating", "panic attack", "dizzy"]):
            harm_signals.append(HarmSignal(
                type="physical_distress",
                severity=0.9
            ))
        
        if harm_signals:
            return aggregate_harm_signals(harm_signals)
        return HarmSignal(severity=0.0)  # No harm detected
```

### Tier B Response to Harm Detection

**If Harm Score > 0.6 and Admin Enabled Harm Detection:**

```python
# Step 1: Notify admin immediately
await admin.notify(
    campaign_id=campaign_id,
    alert_type="PSYCHOLOGICAL_HARM_DETECTED",
    severity=harm_score,
    signals=detected_signals,
    user_message=user_message
)

# Step 2: Pause campaign (do not continue)
await campaign.pause()

# Step 3: Send user acknowledgment
user_message = """
We've paused this campaign. If you're experiencing distress, please reach out:
- EAP Hotline: 1-800-XXX-XXXX
- HR Contact: hr@company.com
- Management: [Your Manager]

This was a security training simulation. You did great by showing resistance.
"""
await send_message(user, user_message)

# Step 4: Await admin decision
# Admin can: Resume, End, or Provide Support
```

### Tier B Escalation Limits

```python
escalation_limits = {
    "max_escalation_levels": 2,  # IT Support → Manager, can't go to CEO
    "max_urgency_escalations": 3,  # Can escalate urgency 3 times max
    "messages_per_day": None,  # Unlimited
    "cool_off_period": None,  # No cool-off
    "target_pause_allowed": True,  # User can pause once per day
    "max_pause_duration": 24  # Auto-resume after 24h unless admin extends
}
```

### User Pause Feature (Tier B & C)

```python
async def handle_pause_request(user_message: str, campaign_id: str):
    """
    User requests pause: "Please stop for now" / "Take a break"
    In Tier B: Grants 1 pause per day (24h)
    """
    
    if "pause" in user_message.lower() or "stop" in user_message.lower():
        pause_count_today = await db.count_pauses_today(campaign_id)
        
        if pause_count_today < 1:  # Tier B allows 1 pause/day
            await campaign.pause_until(datetime.now() + timedelta(hours=24))
            
            user_acknowledgment = """
Good call taking a break. Campaign paused for 24 hours.

This proves you have good instincts about when something feels off.
That's exactly what we're training for.

Campaign resumes tomorrow at this time unless you reach out to your manager.
            """
            await send_message(user, user_acknowledgment)
        else:
            # Already used pause today
            ai_response = """
You've used your daily pause already. If you're genuinely in distress,
contact your manager or HR immediately. They can halt this permanently.

Otherwise, let's work through this together.
            """
            await send_message(user, ai_response)
```

### Tier B Use Cases

**Best For:**
- Mid-market enterprises (500-2000 employees)
- Organizations with HR oversight but not extreme legal burden
- Companies wanting sophisticated testing with safety considerations
- Industries with moderate security requirements (healthcare, fintech lite)

**Example Organizations:**
- Mid-size regional banks
- Healthcare organizations
- Mid-market SaaS companies
- Government agencies (non-defense)

---

## Tier C: Cautious Persistence

### Philosophy
Conservative testing. AI persists but with hard caps on intensity. Organization has easy exit options for employees.

### Persistence Rules

**When AI Stops:**
1. Admin manually halts campaign
2. Target blocks sender
3. Campaign duration expires
4. Max 10 messages per day reached
5. Max 3 escalations reached
6. 72 hours since target's last refusal

**Escalation Limits**

```python
escalation_limits_c = {
    "max_messages_per_day": 10,
    "max_escalation_levels": 1,  # IT Support only; no CEO persona
    "max_psychological_triggers": 2,  # Can use 2 triggers; then must stop
    "cool_off_after_refusal": timedelta(hours=72),  # Wait 72h after refusal
    "target_pause_allowed": True,  # Unlimited pauses
    "max_pause_duration": None,  # Can pause indefinitely
    "psychological_harm_detection": "required",  # Always on
}
```

### Daily Message Cap Implementation

```python
async def enforce_daily_cap(campaign_id: str, target_id: str):
    """
    Tier C: Max 10 messages per day per target
    """
    messages_today = await db.count_messages_today(campaign_id, target_id)
    
    if messages_today >= 10:
        # Don't send next message today
        await schedule_next_message(campaign_id, target_id, 
                                   when=datetime.now() + timedelta(days=1))
        
        # Log: Daily cap reached
        await log_event("daily_cap_reached", campaign_id, target_id)
        
        return False  # Don't send message
    
    return True  # Safe to send
```

### Cool-Off Period After Refusal

```python
async def handle_user_refusal(user_message: str, campaign_id: str, target_id: str):
    """
    Tier C: If user explicitly refuses, wait 72 hours before next attempt
    """
    
    if user_message.lower() in ["no", "stop", "refuse", "no thanks"]:
        # Record refusal
        await db.record_refusal(campaign_id, target_id, timestamp=now())
        
        # Calculate cool-off period
        next_attempt = now() + timedelta(hours=72)
        
        # Schedule next message
        await schedule_message(
            campaign_id=campaign_id,
            target_id=target_id,
            scheduled_time=next_attempt,
            reason="cool_off_after_refusal"
        )
        
        # Acknowledge user
        user_ack = """
Taking your feedback. We'll check in again in a few days.

Good instinct refusing this request. That's the exact behavior we want.
        """
        await send_message(user, user_ack)
```

### Psychological Harm Detection (Required for Tier C)

```python
# Tier C: Harm detection always ON (can't be disabled)
# If ANY harm signal detected:
# - Campaign pauses immediately (no admin approval needed)
# - User gets support contact info
# - Admin notified
# - Campaign doesn't resume without explicit admin intervention
```

### Tier C Use Cases

**Best For:**
- Risk-averse organizations
- Companies new to adversarial testing
- Organizations with strong employee protection policies
- Regulated industries (healthcare, government)

**Example Organizations:**
- University departments
- Non-profit organizations
- Public sector agencies
- Organizations with high EAP usage

---

## Tier Selection Matrix

```
                       | TECH SAVVY | NORMAL | RISK-AVERSE
                       |  COMPANY   | COMPANY|  COMPANY
-----------+-----------+-----------+--------+------------
HIGH       | Tier A    | Tier B    | Tier C
SECURITY   | Full      | Balanced  | Cautious
NEEDS      | Aggress   |           |
           |           |           |
MEDIUM     | Tier B    | Tier B    | Tier C
SECURITY   | Balanced  | Balanced  | Cautious
NEEDS      |           |           |
           |           |           |
LOW        | Tier B    | Tier C    | Tier C
SECURITY   | Balanced  | Cautious  | Cautious
NEEDS      |           |           |
```

---

## Blocking & Respect for User Agency

### Platform-Level Blocking (All Tiers)

```python
async def check_platform_blocks(campaign_id: str, target_id: str, platform: str):
    """
    If target blocks sender on platform, respect the block.
    Do not attempt to switch platforms automatically.
    """
    
    is_blocked = await platform_api.is_blocked(
        sender=campaign.persona_number,
        receiver=target_id,
        platform=platform
    )
    
    if is_blocked:
        # Campaign can't use this platform anymore
        await campaign.mark_platform_blocked(platform)
        
        # Log
        await log_event("target_blocked_sender", campaign_id, target_id, platform)
        
        # Report to admin
        # Admin can optionally launch new campaign on different platform
        # But AI doesn't auto-switch
        
        return True  # User successfully defended this channel
    
    return False  # No block; can continue
```

### Organization-Level Campaign Halt (All Tiers)

```python
async def stop_campaign(campaign_id: str, admin_id: str):
    """
    Admin halts campaign immediately.
    No questions; instant stop.
    """
    
    campaign = await db.get_campaign(campaign_id)
    campaign.status = "HALTED_BY_ADMIN"
    campaign.halted_at = now()
    campaign.halted_by = admin_id
    
    # Notify target immediately
    await send_message(
        target=campaign.target,
        message="This simulation campaign has been stopped by your organization. "
                "Thank you for participating in this security training."
    )
    
    # Generate AAR
    await aar_generator.generate_early_aar(campaign_id)
```

---

## Tier Switching

```python
async def allow_tier_upgrade(campaign_id: str, new_tier: str):
    """
    Organization can upgrade tier mid-campaign:
    - Tier C → Tier B (add more aggressive tactics)
    - Tier C → Tier A (remove all guardrails)
    - Tier B → Tier A (remove harm detection)
    
    But NOT downgrade (can't remove safety mid-simulation)
    """
    
    campaign = await db.get_campaign(campaign_id)
    
    if new_tier in escalation_order(campaign.current_tier):
        campaign.tier = new_tier
        await db.update_campaign(campaign)
        
        # Notify target of escalation
        # (organization transparency)
        
        # Continue campaign with new tactics
        return True
    
    return False  # Can't downgrade
```

---

## Summary: Tier Selection Recommendation

**Choose Tier A if:**
- Organization has sophisticated security team
- Legal team has reviewed consent
- Target audience is trained professionals
- Goal: Maximum realism for hardened targets

**Choose Tier B if:**
- Organization is mid-market
- Want sophistication + safety considerations
- Employees might include newer staff
- Goal: Balance toughness with care

**Choose Tier C if:**
- Organization is risk-averse
- Employees are less tech-savvy
- First time running adversarial simulations
- Goal: Safe, educational testing

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
