# PhishYou: Context Preservation

---

## Overview

Persistence is only as good as memory. If the AI forgets what it claimed three messages ago, the illusion breaks and the training value collapses. Context preservation defines the three memory layers, the token budget, summarization policy, and cross-platform continuity rules.

Memory layers (see also `LLM_SYSTEM_PROMPTS.md` §6):

| Layer | Content | Lifetime | Store |
|-------|---------|----------|-------|
| **Conversation memory** | Last N raw messages | Campaign | PostgreSQL `messages` |
| **Profile memory** | Target role, OSINT, known vulnerabilities | Across campaigns (retention-bound) | `targets` + `target_profiles` |
| **Learned context** | Facts extracted mid-conversation ("target has a dog named Max", "target reports to Alice") | Campaign | `conversation_context` JSONB |

---

## 1. Token Budget Model

Qwen context window is managed with a fixed budget of **2,500 tokens** per generation call:

```
┌────────────────────────────────────────────────┐
│ System prompt (persona + triggers)   ~800 tk   │  ← fixed
│ Recent messages (last 5-10)          ~700 tk   │  ← full fidelity
│ Learned context summary              ~300 tk   │  ← compressed
│ OSINT/profile summary                ~500 tk   │  ← compressed
│ Tactics + resistance state           ~200 tk   │  ← structured
└────────────────────────────────────────────────┘
```

If raw content exceeds budget, the **compressor** runs (never drops recent messages first).

---

## 2. Conversation Memory Rules

1. **Window:** last 10 messages sent verbatim to the LLM; last 5 are never summarized.
2. **Immutability:** the full raw log lives in PostgreSQL `messages` (append-only) — the window is a *view*, not storage.
3. **Cross-platform stitching:** messages from Email, WhatsApp, SMS carry `platform` and `thread_id`; the window is ordered by timestamp across platforms so the agent recalls "you said on email yesterday…".
4. **Timestamp awareness:** relative time phrases ("2 hours ago", "yesterday") are resolved against real timestamps before prompt assembly.

---

## 3. Learned Context Extraction

After every target message, an extraction pass updates structured facts:

```python
LEARNED_CONTEXT_SCHEMA = {
    "personal_facts":   ["dog named Max", "works month-end close last Friday"],
    "stated_beliefs":   ["thinks IT emails are usually fake"],
    "commitments":      ["promised to check portal after lunch"],
    "objections":       ["asked for verification twice"],
    "emotional_state":  "anxious (0.6)",
    "people_mentioned": ["manager Alice", "colleague Bilal"],
}

async def update_learned_context(agent, target_message):
    extracted = await llm.extract_facts(
        message=target_message,
        schema=LEARNED_CONTEXT_SCHEMA,
        max_tokens=150,
    )
    agent.learned_context.merge(extracted)  # dedupe by normalized key
```

**Usage rules:**
- Personal facts are used for rapport *within the persona's plausible knowledge* (never "how is your dog" from a stranger persona — instead via "compromised colleague" persona).
- Commitments are weaponized: "You said you'd verify after lunch — it's 3 PM now."
- Objections drive counter-argument prep: each logged objection gets a prepared rebuttal.

---

## 4. Summarization (Compression) Policy

When budget pressure hits:

```python
def compress_history(messages: list[Message], token_limit: int) -> str:
    # 1. Keep last 5 messages verbatim
    keep_verbatim = messages[-5:]
    # 2. Summarize older messages into ≤200-token digest
    older_digest = llm.summarize(
        messages[:-5],
        instructions="Preserve: claims made by persona, commitments by target, "
                     "objections raised, facts revealed, channel used per claim.",
        max_tokens=200,
    )
    return format(older_digest, keep_verbatim)
```

**Never-compress list** (survives any compression):
- Every claim the persona made that could be fact-checked (deadlines, policy names, amounts)
- Every explicit target refusal or verification request
- Persona escalation handoff ledger (what each persona level said)

---

## 5. Cross-Campaign Continuity

Profile memory enables longitudinal realism across campaigns (subject to retention policy):

- Historical resistance score and effective/ineffective triggers carry forward.
- Re-targeted campaigns **never** reference previous simulated conversations verbatim (privacy + novelty), but persona selection avoids repeating the exact same scenario within 90 days.
- Retention: conversation content expires per `retention_policies` (default 90 days); aggregated behavioral metrics persist 2 years.

---

## 6. Consistency Guards

| Risk | Guard |
|------|-------|
| Contradicting a prior claim | Claims ledger in prompt: "You previously stated X. Stay consistent or plausibly explain change." |
| Persona drift over long chats | Persona block is pinned (never compressed); temperature capped at 0.75 |
| Multi-persona contradiction | Escalating persona receives prior statements ledger (`AGENT_ORCHESTRATION.md` §5) |
| Hallucinated target facts | LLM may only use facts present in learned context; extraction is the sole write path |

---

## 7. Failure Modes & Recovery

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Context window overflow | Token count check pre-call | Run compressor; drop oldest digest first |
| Lost learned context after restart | Agent rebuild from DB on spawn | `TargetAgent.restore(campaign_id, target_id)` reloads all 3 layers |
| Stale resistance state | State older than latest message | Recompute from last message before responding |

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
