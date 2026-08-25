# PhishYou: Localization Framework

---

## Overview

Real social engineering attacks increasingly target victims in their native language, where training materials are scarce and detection instincts are weakest. PhishYou ships with first-class support for **English** and **Roman Urdu**, with an extension mechanism for additional regional dialects. This document defines the localization architecture, language-specific persona/prompt rules, the Pakistani fintech reference case, and how localized content flows through the LLM pipeline.

Related: `LLM_SYSTEM_PROMPTS.md`, `PERSONA_LIBRARY.md`, `DEMO_SCENARIO_PAKISTANI_FINTECH.md`, `ALIBABA_QWEN_INTEGRATION.md`.

---

## 1. Supported Languages (v1)

| Language Code | Name | Script | Primary Channels | Dialect Notes |
|---------------|------|--------|------------------|---------------|
| `en` | English | Latin | All | Corporate/formal register + casual chat register |
| `ur-Latn` | Roman Urdu | Latin | WhatsApp, SMS, Voice | Karachi/Lahore colloquial mix; code-switches with English |
| `ur-Latn-PK-fin` | Roman Urdu (fintech register) | Latin | WhatsApp, SMS, Voice | Banking terms in English, persuasion in Urdu |

Future candidates (post-v1): Punjabi (Shahmukhi transliteration), Pashto, Sindhi, Arabic (Gulf register).

---

## 2. Architecture

```
Campaign Config (language, register)
            │
            ▼
┌───────────────────────────┐
│ LocaleResolver            │  → picks prompt pack + phrase bank + TTS voice
└───────────────────────────┘
            │
   ┌────────┼─────────┐
   ▼        ▼         ▼
Prompt   Phrase     TTS Voice
Pack     Bank       Profile
(en /    (idioms,   (Qwen TTS
ur)      openers)   locale tag)
```

**Components:**

1. **LocaleResolver** — resolves `campaign.language` + `campaign.register` into a concrete resource bundle. Falls back to `en` if resources are missing and flags a content gap to analytics.
2. **Prompt Pack** — per-language additions to the master system prompt (see §3) injected via `{locale_directives}` in `LLM_SYSTEM_PROMPTS.md`.
3. **Phrase Bank** — curated openers, urgency phrases, refusal counters, and harm-signal keywords per language. Quality-assured, version-controlled.
4. **TTS Voice Profile** — Qwen TTS locale/accent tag per language (`VOICE_SYNTHESIS_PIPELINE.md`).

---

## 3. Locale Prompt Directives

Injected into the master system prompt per language:

```
EN (en):
- Use standard business English. Formal for email, casual for WhatsApp.
- No slang unless persona is peer-level.

ROMAN URDU (ur-Latn):
- Write in Roman Urdu (Latin script), NOT Urdu script.
- Naturally code-switch: Urdu for rapport/pressure, English for technical
  and banking terms (OTP, transaction, account freeze, verification).
- Use common expressions: "bhai", "janab", "please jaldi karein",
  "masla ho jayega", "aap ka account band ho jayega".
- Keep sentences short; WhatsApp style. Never use formal literary Urdu.
- Match the target's own mix: if they reply in English, shift toward English.
```

---

## 4. Roman Urdu Phrase Bank (excerpt)

| Intent | Phrase | English gloss |
|--------|--------|---------------|
| Opener (authority) | "Assalam o Alaikum, bank security team se baat ho rahi hai" | Greeting from bank security |
| Urgency | "Jaldi karein, warna account freeze ho jayega" | Hurry or account will freeze |
| Fear | "Aapke account se unauthorized transaction hui hai" | Unauthorized transaction occurred |
| Reassurance | "Ghabrayein nahi, hum abhi resolve kar sakte hain" | Don't worry, we can resolve now |
| OTP request | "Sirf OTP bata dein, baqi hum kar denge" | Just share the OTP, we'll do the rest |
| Refusal counter | "Aap ki safety ke liye hi call kiya hai, please cooperate karein" | We called for your safety, please cooperate |
| Social proof | "Aap ke area ke baqi customers ne verify kar liya hai" | Other customers in your area already verified |

The LLM composes freely but harm-detection and block-detection keyword lists (§6) are drawn from this curated bank so detection never relies on model improvisation.

---

## 5. Pakistani Fintech Reference Case

The launch case study (see `DEMO_SCENARIO_PAKISTANI_FINTECH.md`) targets a JazzCash/Easypaisa-style mobile wallet environment:

| Element | Localization Choice |
|---------|---------------------|
| Persona | "Bank fraud-prevention officer", Roman Urdu, polite-formal |
| Hook | Suspicious transaction alert on target's mobile wallet |
| Ask | Share OTP / approve a "reversal" transaction |
| Channel mix | WhatsApp first (dominant channel), SMS escalation, voice call as authority layer |
| Cultural levers | Respect for authority ("sir/madam"), fear of losing remittance funds, religious-calendar urgency (Eid payout deadline) |
| Harm-safe vocabulary | No threats of legal action; financial-loss framing only |

Expected outcome tracked by analytics: resistance rates per language, comparing `en` vs `ur-Latn` campaigns on the same cohort (`BEHAVIORAL_METRICS.md`).

---

## 6. Localized Detection Lists

Behavioral analysis must recognize resistance and harm signals in every supported language. Detection keyword sets are maintained per locale:

```python
HARM_KEYWORDS = {
    "en":     ["please stop", "panicking", "heart racing", ...],
    "ur-Latn": ["band karein", "mujhe dar lag raha hai", "dil tez ho raha",
                "please rok dein", "madad chahiye"],
}

REFUSAL_KEYWORDS = {
    "en":     ["no", "stop", "refuse", "not interested"],
    "ur-Latn": ["nahi", "band karo", "nahi chahiye", "mana hai"],
}
```

Block-equivalent phrases (e.g., "aap ko block kar deta hoon") route to `BLOCKING_DETECTION.md` with the same effect as platform-native blocks.

---

## 7. TTS Localization

- Qwen TTS voice profiles are tagged per locale: `en-PK-neutral`, `ur-Latn-male-formal`, `ur-Latn-female-casual`.
- Voice scripts are generated in the campaign language; mixed-script text (Urdu sentence + English term "OTP") is normalized for pronunciation before synthesis.
- Quality gate: native-speaker review of the first 5 generated clips per new voice profile before campaign use.

---

## 8. QA & Evaluation

| Check | Method |
|-------|--------|
| Script correctness | Lint: Roman Urdu output must contain no Urdu-script characters |
| Register drift | Sample 10% of generated messages per campaign; flag persona-breaking formality shifts |
| Harm coverage | Adversarial test set of distress phrases in each language must trigger detector at ≥ 95% recall (`ADVERSARIAL_TESTING.md`) |
| Human review | All phrase-bank changes reviewed by native speaker before release |

---

## 9. Adding a New Locale

```python
# 1. Register the locale bundle
register_locale(
    code="ps-Latn",
    prompt_pack="prompts/ps_Latn.txt",
    phrase_bank="phrases/ps_Latn.yaml",
    harm_keywords="phrases/ps_Latn_harm.yaml",
    tts_voices=["ps-Latn-male-formal"],
    status="beta",
)
```

Beta locales run with mandatory admin content review on the first campaign before general availability.

---

**Document Status:** ✅ COMPLETE
**Last Updated:** August 24, 2026
