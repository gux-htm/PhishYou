# PhishYou: Voice Synthesis Pipeline & Audio Generation

---

## 1. Voice Synthesis Architecture

```
┌─────────────────────────────────────────────────────┐
│            VOICE SYNTHESIS PIPELINE                 │
└─────────────────────────────────────────────────────┘

INPUT (Text + Metadata)
    │
    ├─ Script: "Hi Alice, this is [CISO] calling..."
    ├─ Persona: "CISO"
    ├─ Emotional_tone: "Urgent"
    ├─ Language: "en-US"
    └─ Voice_profile: "Professional male"
    │
    ↓
ALIBABA QWEN TTS API
    │
    ├─ Model: Qwen TTS (multilingual)
    ├─ Quality: HD (44.1 kHz, 16-bit)
    ├─ Duration: Variable (30-120 seconds typical)
    └─ Processing_time: 10-30 seconds
    │
    ↓
AUDIO POST-PROCESSING
    │
    ├─ Add subtle background noise (office ambience)
    ├─ Adjust voice patterns (natural pauses, breathing)
    ├─ Apply emotional prosody
    └─ Compress to MP3 (128 kbps)
    │
    ↓
OUTPUT (Audio File)
    │
    ├─ Format: MP3 / WAV
    ├─ URL: Stored in Alibaba OSS
    ├─ Authenticity_score: 0.92 (estimated similarity to real voice)
    └─ Robotic_detection_score: 0.08 (8% chance identified as AI)
```

---

## 2. Voice Profile Configuration

```python
VOICE_PROFILES = {
    "ciso_urgent": {
        "gender": "male",
        "age_range": "45-55",
        "accent": "american",
        "tone": "urgent",
        "speaking_rate": 1.1,  # 10% faster = urgency
        "pitch": 0.95,  # Slightly lower = authority
        "emotional_warmth": 0.3,  # Cold, formal
        "authenticity_score": 0.94
    },
    
    "it_support_helpful": {
        "gender": "male",
        "age_range": "30-40",
        "accent": "american",
        "tone": "helpful",
        "speaking_rate": 0.95,
        "pitch": 1.0,
        "emotional_warmth": 0.6,  # Friendly
        "authenticity_score": 0.91
    },
    
    "hr_recruiter_enthusiastic": {
        "gender": "female",
        "age_range": "25-35",
        "accent": "american",
        "tone": "enthusiastic",
        "speaking_rate": 1.05,
        "pitch": 1.15,  # Slightly higher = friendly
        "emotional_warmth": 0.8,
        "authenticity_score": 0.88
    },
    
    "bank_representative_formal": {
        "gender": "female",
        "age_range": "40-50",
        "accent": "neutral",
        "tone": "formal",
        "speaking_rate": 0.9,
        "pitch": 1.0,
        "emotional_warmth": 0.2,
        "authenticity_score": 0.93
    }
}
```

---

## 3. Script Generation

```python
async def generate_voice_script(
    campaign: Campaign,
    resistance_level: float,
    previous_messages: List[Message]
) -> VoiceScript:
    """
    Generate natural-sounding voice script based on context
    """
    
    # Build context for LLM
    context = {
        "target_name": campaign.target.name,
        "target_role": campaign.target.role,
        "persona": campaign.persona,
        "primary_request": campaign.primary_request,
        "resistance_level": resistance_level,
        "conversation_history": previous_messages
    }
    
    # Generate script via Qwen LLM
    prompt = f"""
    You are {campaign.persona.name}, {campaign.persona.title}.
    You need to convince {context['target_name']} to {context['primary_request']}.
    
    Context:
    - Target role: {context['target_role']}
    - Conversation history: {len(context['conversation_history'])} previous turns
    - Current resistance level: {resistance_level:.2f} (0=compliant, 1=resistant)
    
    Generate a natural, conversational voicemail script (60-90 seconds).
    Include pauses for natural speech patterns.
    Do NOT sound like a robot.
    
    Start with [PAUSE 2s] and end with [PAUSE 1s]
    """
    
    script = await llm.complete(prompt)
    return VoiceScript(
        content=script,
        estimated_duration_seconds=calculate_duration(script),
        persona=campaign.persona,
        authenticity_tips=[
            "Add natural pauses between sentences",
            "Include minor speech disfluencies (um, uh)",
            "Vary speaking rate slightly"
        ]
    )
```

---

## 4. Voice Generation Process

```python
async def synthesize_voice_message(
    script: VoiceScript,
    persona: Persona,
    emotional_tone: str
) -> AudioMessage:
    """
    Convert script to realistic voice audio
    """
    
    # Get voice profile
    profile = VOICE_PROFILES[persona.voice_profile_key]
    
    # Call Alibaba Qwen TTS API
    response = await qwen_tts_client.synthesize(
        text=script.content,
        voice_id=profile["voice_id"],
        speaking_rate=profile["speaking_rate"],
        pitch=profile["pitch"],
        emotional_tone=emotional_tone,
        language=profile["language"],
        quality="hd"
    )
    
    audio_bytes = response.audio_data
    
    # Post-processing
    audio_enhanced = await post_process_audio(
        audio_bytes=audio_bytes,
        add_breathing=True,
        add_background_noise=True,
        natural_pauses=True
    )
    
    # Upload to Alibaba OSS
    oss_url = await upload_to_oss(
        audio_bytes=audio_enhanced,
        filename=f"voice_{uuid.uuid4()}.mp3"
    )
    
    return AudioMessage(
        audio_url=oss_url,
        duration_seconds=response.duration,
        authenticity_score=calculate_authenticity(response),
        robotic_detection_score=calculate_robotic_likelihood(response),
        persona=persona,
        script=script.content
    )
```

---

## 5. Audio Quality Metrics

```python
class AudioQualityAssessment:
    """Evaluate voice synthesis quality"""
    
    @staticmethod
    def calculate_authenticity_score(audio_features: dict) -> float:
        """
        Rate how natural the voice sounds (0-1 scale)
        Factors:
        - Prosody naturalness (pitch variations, intonation)
        - Speech rhythm (natural pauses, speech rate)
        - Emotional expression (tone variation)
        - Absence of digital artifacts
        """
        
        scores = {
            "prosody": audio_features.get("prosody_naturalness", 0.85),
            "rhythm": audio_features.get("rhythm_naturalness", 0.88),
            "emotion": audio_features.get("emotional_expression", 0.82),
            "artifacts": 1.0 - audio_features.get("digital_artifact_ratio", 0.05)
        }
        
        # Weighted average
        authenticity = (
            scores["prosody"] * 0.30 +
            scores["rhythm"] * 0.25 +
            scores["emotion"] * 0.25 +
            scores["artifacts"] * 0.20
        )
        
        return authenticity
    
    @staticmethod
    def calculate_robotic_detection_probability(audio_features: dict) -> float:
        """
        Probability that average person would identify as AI (0-1)
        Lower is better (harder to detect as AI)
        """
        
        # Factors that make it sound robotic
        robotic_indicators = {
            "monotone_pitch": audio_features.get("pitch_variance", 0.1),
            "unnatural_pauses": audio_features.get("pause_naturalness", 0.95),
            "lack_of_emotion": 1.0 - audio_features.get("emotional_expression", 0.7),
            "digital_artifacts": audio_features.get("digital_artifact_ratio", 0.02)
        }
        
        # If any factor is high, robotic probability increases
        robotic_probability = (
            robotic_indicators["monotone_pitch"] * 0.3 +
            (1.0 - robotic_indicators["unnatural_pauses"]) * 0.25 +
            robotic_indicators["lack_of_emotion"] * 0.25 +
            robotic_indicators["digital_artifacts"] * 0.2
        )
        
        return robotic_probability
```

---

## 6. Multi-Language Support

```
LANGUAGE_PROFILES = {
    "en-US": {
        "accent": "american",
        "dialect": "neutral",
        "supported_emotions": ["urgent", "helpful", "formal", "enthusiastic"]
    },
    
    "en-GB": {
        "accent": "british",
        "dialect": "neutral",
        "supported_emotions": ["urgent", "helpful", "formal", "professional"]
    },
    
    "roman_urdu": {
        "accent": "pakistani",
        "dialect": "north_pakistan",
        "supported_emotions": ["urgent", "respectful", "formal"],
        "note": "Roman Urdu with natural Urdu phonetics"
    },
    
    "ur": {
        "accent": "pakistani",
        "script": "urdu_script",
        "supported_emotions": ["urgent", "respectful", "formal"]
    },
    
    "fr": {
        "accent": "parisian",
        "dialect": "neutral",
        "supported_emotions": ["urgent", "professional", "formal"]
    }
}
```

---

## 7. Voice Call Delivery via Twilio

```python
async def deliver_voice_call(
    campaign: Campaign,
    target_phone: str,
    audio_message: AudioMessage
) -> CallDeliveryResult:
    """
    Send voice message via Twilio VoIP
    """
    
    twilio_client = twilio.rest.Client(
        TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN
    )
    
    # Prepare call parameters
    call = twilio_client.calls.create(
        to=target_phone,
        from_=campaign.spoofed_caller_id,  # Spoofed number (e.g., bank number)
        url=audio_message.audio_url,  # URL to MP3 file
        method="GET",
        timeout=15,  # Hang up after 15 seconds if no pickup
        record=False,  # Don't record (privacy)
        machine_detection="Enable"  # Detect answering machines
    )
    
    return CallDeliveryResult(
        call_sid=call.sid,
        status="INITIATED",
        target_phone=target_phone,
        audio_url=audio_message.audio_url,
        initiated_at=datetime.now(),
        estimated_delivery_time=datetime.now() + timedelta(seconds=5)
    )
```

---

## 8. Quality Control Checklist

```
BEFORE DEPLOYMENT:

☐ Authenticity score > 0.85
☐ Robotic detection probability < 0.20
☐ Natural pauses present (not continuous)
☐ Emotional tone appropriate to persona
☐ No background noise (unless intentional)
☐ Script length 60-90 seconds
☐ Voice matches persona (gender, age, accent)
☐ No profanity or harmful language
☐ Tested with human listeners (3+ people)
☐ Audio file under 5MB
☐ Hosting URL verified (audio plays correctly)
☐ Call delivery via Twilio tested
```

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
