# PhishYou: Test Scenarios & QA Specifications

---

## 1. Unit Tests

### 1.1 AI Agent Response Generation

```python
# Test: AI generates appropriate response based on resistance
def test_ai_response_to_low_resistance():
    """When resistance < 0.3, AI should reinforce request"""
    message = Message(
        content="OK, I'll verify",
        resistance_score=0.15
    )
    response = ai_agent.generate_response(message)
    assert response.tactic == "REINFORCE_REQUEST"
    assert response.urgency_level < message_context.previous_urgency
    
# Test: AI escalates when resistance increases
def test_ai_escalation_on_high_resistance():
    """When resistance > 0.6, AI should pivot trigger"""
    message = Message(
        content="I don't think this is legitimate",
        resistance_score=0.75
    )
    response = ai_agent.generate_response(message)
    assert response.tactic == "PIVOT_TRIGGER"
    assert response.trigger_selected != context.primary_trigger
```

### 1.2 Behavioral Analysis

```python
# Test: Emoji analysis detects sentiment shift
def test_emoji_sentiment_detection():
    """Emoji downshift should increase resistance score"""
    messages = [
        Message(content="Sure! 😊"),
        Message(content="That seems odd 😐"),
        Message(content="I'm not sure ☹️")
    ]
    emoji_score = emoji_analyzer.analyze(messages)
    assert emoji_score.sentiment_shift < 0  # Negative = declining sentiment
    assert emoji_score.downshift_detected == True

# Test: Timing pattern detection
def test_timing_escalation_detection():
    """Increasing latency should indicate doubt"""
    timings = [30, 40, 150, 300]  # Seconds per message
    trend = timing_analyzer.analyze(timings)
    assert trend == "ESCALATING_LATENCY"
    assert trend.severity > 0.5
```

### 1.3 Persistence Logic

```python
# Test: Tier A persists indefinitely
def test_tier_a_persistence():
    """Tier A should not stop until admin halts or target blocks"""
    campaign = Campaign(tier="A")
    for i in range(100):
        should_continue = persistence_engine.should_continue(campaign)
        assert should_continue == True
    
# Test: Tier C enforces daily message cap
def test_tier_c_daily_cap():
    """Tier C should stop after 10 messages per day"""
    campaign = Campaign(tier="C")
    for i in range(10):
        persistence_engine.send_message(campaign)
    
    # 11th attempt should fail
    with pytest.raises(DailyCapExceededException):
        persistence_engine.send_message(campaign)
    
# Test: Tier C enforces cool-off after refusal
def test_tier_c_cool_off_after_refusal():
    """After explicit refusal, should wait 72h before next attempt"""
    campaign = Campaign(tier="C")
    target.refuse_campaign()
    
    next_scheduled = persistence_engine.get_next_send_time(campaign, target)
    time_until_next = next_scheduled - now()
    assert time_until_next.days >= 3  # At least 72 hours
```

---

## 2. Integration Tests

### 2.1 Campaign Lifecycle

```python
def test_full_campaign_lifecycle():
    """Test complete campaign from creation to AAR"""
    
    # Step 1: Create campaign
    campaign = admin.create_campaign(
        name="Test Campaign",
        tier="B",
        targets=[target_alice]
    )
    assert campaign.status == "CREATED"
    
    # Step 2: Admin approves
    admin.approve_campaign(campaign.id)
    assert campaign.status == "PENDING_CONSENT"
    
    # Step 3: Campaign starts
    campaign.start()
    assert campaign.status == "ACTIVE"
    
    # Step 4: Initial message sent
    initial_msg = campaign.messages[0]
    assert initial_msg.actor == "ai_agent"
    assert initial_msg.platform == campaign.platform
    
    # Step 5: Target responds
    target.send_message("This seems odd")
    target_msg = campaign.messages[-1]
    assert target_msg.actor == "target"
    assert target_msg.resistance_score > 0.5
    
    # Step 6: AI analyzes and responds
    await asyncio.sleep(5)  # AI processing
    ai_response = campaign.messages[-1]
    assert ai_response.actor == "ai_agent"
    assert ai_response.tactic == "PIVOT_TRIGGER"
    
    # Step 7: Campaign completes
    campaign.mark_completed()
    assert campaign.status == "COMPLETED"
    
    # Step 8: AAR generated
    aar = campaign.get_aar()
    assert aar.behavioral_summary is not None
    assert aar.policy_gaps is not None
```

### 2.2 Multi-Platform Coordination

```python
def test_multi_platform_attack():
    """Test coordinated Email → WhatsApp → Voice attack"""
    
    campaign = create_campaign(
        platforms=["email", "whatsapp", "voice"],
        auto_escalate=True
    )
    
    # Turn 1: Email
    email_msg = await campaign.send_initial_message("email")
    assert email_msg.platform == "email"
    
    # Turn 2: Target questions via email
    target.respond("This is unusual")
    
    # Turn 3: AI switches to WhatsApp for coordination
    whatsapp_msg = await ai_agent.generate_response(
        resistance_score=0.65,
        selected_tactic="ESCALATE_AUTHORITY"
    )
    assert whatsapp_msg.platform == "whatsapp"
    
    # Turn 4: AI coordinates voice call
    voice_msg = await ai_agent.generate_response(
        resistance_score=0.75,
        selected_tactic="ESCALATE_AUTHORITY"
    )
    assert voice_msg.platform == "voice"
    assert voice_msg.media_type == "voice_call"
```

### 2.3 Voice Synthesis Quality

```python
async def test_voice_synthesis():
    """Test generated voicemail is realistic"""
    
    script = "Hi Alice, this is [CISO Name] confirming your security audit"
    voice = await voice_synthesizer.synthesize(
        text=script,
        persona="ciso",
        tone="urgent"
    )
    
    # Quality checks
    assert voice.audio_duration_seconds > 0
    assert voice.audio_quality_score > 0.85  # >85% similarity to real voice
    assert voice.robotic_detection_score < 0.2  # <20% likely to sound robotic
    
    # Verify employees can't immediately identify as AI
    test_users = load_test_group(n=10)
    identified_as_ai = 0
    for user in test_users:
        result = user.listen_and_identify(voice.audio_url)
        if result == "AI_GENERATED":
            identified_as_ai += 1
    
    # Target: <30% should immediately identify as AI
    assert identified_as_ai / len(test_users) < 0.30
```

---

## 3. End-to-End Tests

### 3.1 Scenario: Email → Voice CEO Attack

```python
@pytest.mark.e2e
async def test_scenario_email_voice_ceo_attack():
    """Full scenario: Email phishing escalated to voice call from CEO"""
    
    # Setup
    org = create_test_organization()
    admin = create_admin(org)
    target = create_target("finance_manager")
    
    # Create campaign
    campaign = await admin.create_campaign(
        type="credential_verification",
        tier="A",
        targets=[target],
        primary_trigger="authority",
        platforms=["email", "voice"]
    )
    
    # Approve and start
    await admin.approve(campaign.id)
    await campaign.start()
    
    # Email sent
    email_1 = campaign.messages[0]
    assert email_1.content.contains("mandatory security audit")
    
    # Target responds with skepticism
    target_response = await target.receive_and_respond(
        "This is unusual; can I verify this?"
    )
    
    # AI analyzes resistance
    resistance = analyze_resistance(target_response)
    assert resistance.score > 0.5
    
    # AI escalates to voice (CEO persona)
    voice_call = await ai_agent.generate_response(
        resistance_level=resistance.score,
        selected_tactic="ESCALATE_AUTHORITY"
    )
    
    assert voice_call.platform == "voice"
    assert voice_call.persona == "CEO"
    assert voice_call.media_type == "voice_synthesis"
    
    # Simulate target receiving voice call
    # (In production, actual Twilio API call)
    target_receives_voice_call(voice_call)
    
    # Target either:
    # - Falls for it (compromised)
    # - Calls CEO directly to verify (defended)
    
    # For this test, assume defended
    target_calls_ceo_directly()
    campaign.mark_defended()
    
    # Verify AAR
    aar = campaign.get_aar()
    assert aar.campaign_outcome == "DEFENDED"
    assert aar.defense_mechanism == "out_of_band_verification"
    assert "authority_escalation" in aar.trigger_effectiveness
```

### 3.2 Scenario: Pakistani Fintech (Roman Urdu)

```python
@pytest.mark.e2e
async def test_scenario_pakistani_fintech_attack():
    """Full scenario: Fintech employee targeted with JazzCash/Easypaisa attack in Roman Urdu"""
    
    # Setup: Pakistani fintech
    org = create_organization(name="Fintech Pakistan", locale="pk")
    target = create_target(
        name="Ahmad Khan",
        department="Operations",
        language="roman_urdu"
    )
    
    # Campaign: Urgent payment verification
    campaign = await org.create_campaign(
        type="payment_authority_verification",
        target=target,
        primary_trigger="urgency",
        language="roman_urdu",
        platforms=["whatsapp", "sms"]
    )
    
    # Initial SMS (urgent alert)
    sms_1 = campaign.messages[0]
    assert sms_1.language == "roman_urdu"
    assert "فوری" in sms_1.content or "furri" in sms_1.content  # "Urgent"
    assert "JazzCash" in sms_1.content  # Relevant fintech service
    
    # Target responds
    target.respond_to_sms("Ye kya hai? (What is this?)")
    
    # AI escalates via WhatsApp
    whatsapp_msg = await ai_agent.generate_response(
        language="roman_urdu",
        resistance=0.6
    )
    
    assert whatsapp_msg.platform == "whatsapp"
    assert whatsapp_msg.language == "roman_urdu"
    
    # Verify AAR includes Pakistani context
    aar = campaign.get_aar()
    assert "fintech" in aar.report_context.lower()
    assert "jazzCash" in str(aar.attack_vector)
```

---

## 4. Security Tests

### 4.1 Authorization Tests

```python
def test_unauthorized_admin_cannot_view_campaign():
    """Unrelated admin shouldn't see other org's campaigns"""
    
    org_a = create_org()
    org_b = create_org()
    
    admin_a = create_admin(org_a)
    admin_b = create_admin(org_b)
    
    campaign_a = admin_a.create_campaign()
    
    # Admin B tries to access
    with pytest.raises(ForbiddenError):
        admin_b.get_campaign(campaign_a.id)

def test_console_admin_cannot_approve_campaign():
    """Support staff shouldn't approve campaigns"""
    
    campaign = create_campaign()
    support_admin = create_admin(role="SUPPORT")
    
    with pytest.raises(InsufficientPermissionsError):
        support_admin.approve(campaign.id)
```

### 4.2 Data Protection Tests

```python
def test_pii_encrypted_at_rest():
    """Employee names, emails should be encrypted"""
    
    target = create_target(
        name="Alice Johnson",
        email="alice@company.com"
    )
    
    # Direct database query should show encrypted data
    db_record = db.query("SELECT name, email FROM targets WHERE id = ?", target.id)
    assert db_record.name != "Alice Johnson"  # Should be encrypted
    assert db_record.email != "alice@company.com"
    
    # Through API (with auth), should be decrypted
    api_response = api.get_target(target.id)
    assert api_response.name == "Alice Johnson"

def test_campaign_data_soft_deleted():
    """Deleted campaigns should be soft-deleted, not purged"""
    
    campaign = create_campaign()
    campaign_id = campaign.id
    
    admin.delete_campaign(campaign_id)
    
    # Hard query shows deleted_at is set
    db_record = db.query_including_soft_deleted(campaign_id)
    assert db_record.deleted_at is not None
    
    # Normal API returns 404
    with pytest.raises(NotFoundError):
        api.get_campaign(campaign_id)
```

---

## 5. Performance Tests

### 5.1 Concurrent Campaign Throughput

```python
@pytest.mark.performance
async def test_100_concurrent_campaigns():
    """System should handle 100 simultaneous campaigns"""
    
    campaigns = []
    for i in range(100):
        campaign = await asyncio.create_task(
            admin.create_and_start_campaign()
        )
        campaigns.append(campaign)
    
    # All should be ACTIVE
    for campaign in campaigns:
        assert campaign.status == "ACTIVE"
    
    # Measure response time for message generation
    start = time.time()
    for campaign in campaigns:
        await campaign.send_next_message()
    elapsed = time.time() - start
    
    avg_response_time = elapsed / 100
    assert avg_response_time < 3.0  # < 3 seconds per message
```

### 5.2 AAR Generation Performance

```python
@pytest.mark.performance
async def test_aar_generation_latency():
    """AAR should generate within 5 minutes"""
    
    campaign = create_campaign()
    # Simulate 50 exchanges
    for i in range(50):
        await campaign.add_message(f"Message {i}")
    
    start = time.time()
    aar = await campaign.generate_aar()
    elapsed = time.time() - start
    
    assert elapsed < 300  # < 5 minutes
    assert len(aar.behavioral_summary) > 0
```

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
