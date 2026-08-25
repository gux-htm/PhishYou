# PhishYou: Voice Synthesis Pipeline

---

## Overview

The voice pipeline converts a persona's scripted intent into deliverable audio: voicemails, WhatsApp voice notes, and outbound call audio. Product spec: `VOICE_SYNTHESIS_SPEC.md`; ethics: `DEEPFAKE_AUDIO_GUIDELINES.md` (synthetic voices only, no cloning).

---

## 1. Pipeline Stages

```
1. SCRIPT GENERATION      LLM writes voice script from tactic + persona + context
        ↓
2. SCRIPT REVIEW GATE     Content policy filter + length/format checks
        ↓
3. SYNTHESIS              Qwen TTS with bound synthetic voice profile
        ↓
4. POST-PROCESSING        Humanization (pauses, breath), loudness normalize, watermark
        ↓
5. QUALITY GATE           MOS estimate + authenticity score; reject below threshold
        ↓
6. DELIVERY               WhatsApp media (Ogg/Opus) | Twilio call/voicemail (WAV→PCM)
        ↓
7. AUDIT                  Script hash, profile id, watermark id logged
```

---

## 2. Script Generation

```python
async def generate_voice_script(persona, tactic, context) -> VoiceScript:
    return await llm.generate(
        system=VOICE_SCRIPT_SYSTEM_PROMPT.format(
            persona=persona,
            tone=tactic.tone,                    # concerned / authoritative / urgent
            length_hint="8-20 seconds",
            spoken_style="natural speech, contractions, one hesitation",
        ),
        context=context.summary,
        max_tokens=120,
        temperature=0.6,
    )
```

Script rules: spoken register (no bullet points), single thought per clip, ends with a directive or reassurance consistent with persona.

---

## 3. Synthesis & Profiles

```python
audio = await qwen_tts.synthesize(
    text=script.text,
    voice=persona.voice_profile_id,      # synthetic profile, never cloned
    speed=0.98,                          # slightly measured pace reads authoritative
    language=persona.language,           # en | ur (Roman Urdu mapped to Urdu voice)
    output_format=DeliveryFormat.for(channel),
)
```

| Delivery channel | Format | Constraints |
|------------------|--------|-------------|
| WhatsApp voice note | Ogg/Opus, mono, ≤60s | Appears as normal voice note |
| Voicemail drop | WAV 8kHz PCM via Twilio | ≤30s, preceded by 1-ring cadence |
| Outbound call audio | Streaming PCM chunks | Scripted message only (no live conversation in MVP) |

---

## 4. Post-Processing & Humanization

- Insert 200–400ms pauses at clause boundaries; one natural hesitation per clip.
- Loudness normalize to −16 LUFS (voice-note standard).
- Embed inaudible provenance watermark + simulation tag in metadata.
- Optional light ambience (office room tone) for authority personas — prohibited for emergency-style framing.

---

## 5. Quality Gates

| Gate | Threshold | Action on fail |
|------|-----------|----------------|
| MOS estimate (automatic) | ≥ 3.8 / 5 | Regenerate with adjusted speed (max 3) |
| Authenticity score | ≥ 0.8 | Regenerate; persistent fail → fallback to text channel |
| Script policy filter | Pass | Block + audit |
| Profile similarity screen | No match to real-person samples | Profile quarantined |

---

## 6. Caching & Cost

- Scripts and audio cached per (campaign, persona, script_hash); identical scripts reuse audio.
- Voice generation budget: alert at 30 clips/day per campaign (anomaly check).
- Generation latency budget ≤30s per 10-second clip; synchronous generation happens off the reply hot-path (voice is proactive media, scheduled).

---

## 7. Delivery Reliability

- WhatsApp media upload via Twilio Media API with retry; failed upload → degrade to text paraphrase + audit event.
- Voicemail delivery confirmed via Twilio answer/reply callbacks; unanswered → one retry next business window.
- All deliveries logged with provider message IDs for AAR timeline reconstruction.

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
