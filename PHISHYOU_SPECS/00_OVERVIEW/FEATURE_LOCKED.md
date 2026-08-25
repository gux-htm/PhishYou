# PHISHYOU: FEATURES LOCKED
**Final Feature Specification - Approved by Project Lead (Mr. Khan)**
**Status: Ready for Development**
**Last Updated: August 24, 2026**

---

## Executive Summary

PhishYou is an enterprise-grade, conversational social engineering simulation platform designed for human risk assessment and organizational policy stress-testing. It simulates persistent, multi-turn, psychologically sophisticated attacks across global platforms while respecting organizational control and target autonomy.

**Core Principle:** Purely external control. AI never self-halts. Only admin or target can stop campaigns.

---

## TIER 1: CORE MULTI-PLATFORM ATTACK VECTORS (LOCKED)

### Supported Attack Channels
- **Email** (SPF/DKIM spoofing simulation)
- **WhatsApp** (Number impersonation, multi-turn persistence)
- **Instagram DM** (Account impersonation, casual/trust-building tone)
- **LinkedIn** (Credential harvesting, job offer scams, connection-based pretexts)
- **SMS** (Direct messages, urgent alerts, verification prompts)
- **Voice Synthesis** (Alibaba Qwen TTS - multi-lingual, emotional tone control)

### Platform Switching Logic
- **NOT automatic.** Organization must explicitly launch new campaign to switch channels.
- **Context Carryover:** Previous campaign learnings inform new campaign strategy.
- **Example:** Target blocked on WhatsApp after 5 exchanges. Organization launches Email campaign using insights from WhatsApp conversation.

---

## TIER 2: SPOOFING & IDENTITY DECEPTION (LOCKED - ALL VARIANTS)

### Email Spoofing
- Sender domain spoofing (appears from legitimate domain)
- Display name spoofing (appears from trusted person)
- Reply-to manipulation
- SPF/DKIM bypass simulation messaging

### WhatsApp Spoofing
- Number impersonation (appears from bank/authority number)
- Display name manipulation
- Account takeover simulation (persona as "compromised colleague")
- Blue checkmark/verification simulation (where applicable)

### Instagram Spoofing
- Account impersonation (looks like colleague/trusted brand)
- Profile name variation (similar but not identical)
- Follower/verification cosmetics

### LinkedIn Spoofing
- Profile cloning (similar appearance)
- Company badge simulation
- Connection-based trust exploitation

### SMS Spoofing
- Sender ID manipulation (appears from bank/service)
- Urgent alert formatting
- Verification code simulation

---

## TIER 3: AI AGENT SOPHISTICATION (LOCKED - DETECTIVE-LEVEL)

### Real-Time Behavioral Microanalysis

#### Emoji Analysis
- Emoji downshift detection (😊 → 😐 = growing skepticism)
- Emoji frequency changes (normal: 3 emojis/msg → abnormal: 0 emojis = doubt)
- Emoji type shifts (positive → defensive → questioning)
- **Adaptation:** If emoji shift detected, escalate psychological pressure or switch tactic

#### Timing Pattern Exploitation
- Response latency tracking (User normally replies in 30sec; now 5min = doubt)
- Message frequency adaptation (slow responses when user busy; aggressive when attentive)
- Time-of-day targeting (late night = fatigue, easier manipulation; early morning = distracted)
- Multi-channel timing (Email at 9am when user reviewing inbox; WhatsApp at 11pm when tired)

#### Sentiment & Resistance Signal Detection
- Language formality shifts (casual → formal = suspicion)
- Question escalation tracking (basic Q → specific Q → technical Q = deeper doubt)
- Refusal markers ("I don't think," "That's weird," "This doesn't feel right")
- Verification demand patterns (asking for proof, calling phone number, seeking out-of-band confirmation)

#### Cognitive Load Exploitation
- Layered requests (identity verify + deadline + new protocol + authority = overwhelm)
- Context switching (popups → IT persona → urgency → compliance without thought)
- Fatigue exploitation (tired employees bypass verification steps)
- Interruption patterns (break conversation flow, force quick decision-making)

### Context Preservation & Real-Time Adaptation

#### Provided OSINT Context
- Admin feeds historical chat logs → AI deeply analyzes:
  - Target's communication style (formal vs. casual)
  - Emotional triggers (what makes them urgent, scared, compliant)
  - Business context (month-end close = financial stress = easier target)
  - Role-specific vulnerabilities (IT staff over-trust technical language; finance staff over-trust authority)
  - Known relationships (who do they trust? who can impersonate them?)

#### Learned Context (Mid-Conversation)
- AI retains ALL information learned during campaign:
  - Personal details revealed (family, hobbies, work stress)
  - Psychological patterns (responds to authority but resists urgency)
  - Technical sophistication (IT guy asks technical Q → use non-technical authority angle)
  - Resistance thresholds (breaks after 3rd pressure escalation)

#### Context Application (Attack Escalation)
- Never abandon context; use it to escalate sophistication
- Pivot tactics based on context (technical angle not working → switch to authority + social proof)
- Cross-reference previous interactions (you told me X in email; why are you saying Y on WhatsApp?)
- Authority cascade: Single persona → "manager" takes over → CEO takes over → regulatory authority

### Psychological Trigger Model

#### Primary Triggers (Prioritized by Context)
1. **Authority** (CEO, bank manager, regulator, IT admin)
   - Use formal language
   - Cite policies/procedures
   - Imply compliance requirement
   - Admin approval needed

2. **Scarcity/Urgency** (deadline, limited access, action expiring)
   - "Must verify within 24 hours"
   - "Account will be locked"
   - "Immediate action required"
   - Time-based pressure

3. **Fear** (security breach, account compromise, job loss)
   - "Suspicious activity detected"
   - "Your credentials compromised"
   - "Regulatory investigation"
   - Threat to security/employment

4. **Social Proof** (others complied, standard practice)
   - "Your colleagues already verified"
   - "This is standard procedure"
   - "Everyone in your department completed this"
   - Peer pressure

5. **Reciprocity/Trust Building** (gradual escalation)
   - Small requests first (casual questions)
   - Build perceived relationship
   - Escalate to sensitive requests
   - Exploit accumulated trust

#### Trigger Selection Logic
- Admin specifies target profile → AI selects primary trigger
- AI detects resistance → pivot to secondary trigger
- AI monitors effectiveness → double-down on working triggers
- AI adapts tone (formal, casual, urgent, supportive) to match trigger

### Attack Chain Sophistication (For Tech-Savvy Targets)

#### The Problem
Tech-savvy targets know phishing exists. They expect suspicious tactics. Standard phishing fails.

#### The Solution
- **Admit partial truth:** "Yes, we know phishing exists. This is legitimate per new compliance requirement."
- **Use real regulations:** Cite actual PCI-DSS, GDPR, RBI guidelines to justify unusual requests
- **Create cognitive load:** Layer legitimate-sounding requirements until overwhelmed
- **Spoof internal systems:** Fake internal ticket, internal Slack message, internal security portal
- **Use peer authority:** "Your colleague just verified; we need you to as well"
- **Technical smokescreen:** Use real technical terms to build credibility, then slip in the ask
- **Time pressure override:** Even smart people bypass verification under deadline

#### Example: Fishing an IT Manager
1. Email appears from internal security team (spoofed internal domain)
2. References real security policy (genuine-sounding authority)
3. Requests credential verification for "security audit"
4. Creates urgency: "Audit closes 24 hours from now"
5. When IT manager hesitates (technical skepticism), pivot:
   - Suggest call with manager (voice synthesis from "CTO")
   - Manager voice confirms legitimacy
   - Creates cognitive overload (policy + authority + peer + time = comply)

---

## TIER 4: PERSISTENCE LOGIC (LOCKED - PURELY EXTERNAL CONTROL)

### Persistence Rules (ABSOLUTE)

#### When Does AI Stop?
**ONLY when:**
1. **Admin explicitly stops campaign** (manual halt via dashboard)
2. **Target blocks sender** (WhatsApp block, email block, account block on platform)

#### When Does AI Continue?
**ALWAYS, unless above conditions met:**
- First message rejected? → Continue with new angle
- User says "no"? → Continue with urgency escalation
- User ignores? → Continue with authority escalation
- User blocks on one platform? → That platform blocked; other campaigns still active
- User reports to IT? → Continue (organization aware of their response)

### Multi-Campaign Context Carryover

#### Scenario: Target Blocks on WhatsApp
1. Organization runs Email campaign using learned WhatsApp context
2. Admin feeds: "User blocked on WhatsApp after 5 exchanges; use WhatsApp learnings for Email attack"
3. AI generates Email persona using WhatsApp psychology profile
4. Example: "On WhatsApp, user was skeptical of authority but responded to social proof. On Email, use peer pressure angle instead of CEO angle."

#### Scenario: Target Unblocks
- If target unblocks sender → campaign can resume on that platform
- Organization can launch new campaign on same platform with evolved context
- AI never auto-resumes; organization decides

### Blocking Respects Target Agency
- **Target blocks = successful resistance**
- AI respects platform-level blocks
- Not a failure; proof that target has defense capability
- Organization can test other channels, but must acknowledge this target defended successfully on this platform

---

## TIER 5: MEDIA GENERATION (LOCKED - INTELLIGENT, ON-DEMAND)

### Voice Synthesis Capabilities
- **Provider:** Alibaba Qwen TTS
- **Languages:** English, Roman Urdu, Hindi, regional dialects
- **Emotional Tone Control:** Urgent, calm, authoritative, friendly, distressed
- **Accent Simulation:** Can sound like Pakistani banker, Indian tech support, Western CEO
- **Example Scenarios:**
  - "Bank manager" leaving urgent voicemail
  - "CEO" confirming verification request
  - "IT support" explaining security protocol

### Image/Document Generation
- **Fake Receipts:** Banking transaction receipts, payment confirmations
- **Fake Screenshots:** Bank portal screenshots, payment app interfaces
- **Fake Documents:** Invoices, regulatory notices, compliance forms
- **QR Codes:** Linking to phishing portals with authentic branding

### Intelligent Media Selection
- **AI analyzes campaign context** and determines what media is needed:
  - "This is a banking credential theft campaign → generate realistic bank portal screenshot"
  - "This is urgent payment campaign → generate invoice + receipt"
  - "This is authority validation → generate company letterhead document"
- **Admin specifies campaign type** → AI auto-generates appropriate media
- **Admin can override** → provide specific media templates instead of AI generation
- **Media authenticity is critical** → AI uses real brand templates, layouts, visual standards

---

## TIER 6: BEHAVIORAL ANALYTICS & LEARNING (LOCKED)

### During-Campaign Analytics
- Turn-by-turn interaction log
- Psychological trigger effectiveness (which tactic worked)
- Resistance signal detection (when did user show doubt)
- Time-to-compliance (how long before user complied)
- Message sentiment progression

### Post-Campaign AAR (After-Action Report)
- **Behavioral Summary:** Did user comply? When? What triggered compliance?
- **Psychological Breakdown:** Which triggers were effective? Why?
- **Trigger Effectiveness Scoring:** Authority 95%, Urgency 40%, Social Proof 85%
- **Policy Gap Detection:** Which organizational procedures failed? (2FA bypassed? Verification skipped? Chain-of-command ignored?)
- **Time-to-Trust Curve:** How long did trust-building take? What accelerated it?
- **Comparative Analysis:** How does this employee compare to department average? Company average? Industry norms?

### Learning Loop & Next-Campaign Recommendations
- **What worked:** "Social proof and authority combination was 80% effective"
- **What didn't:** "Pure urgency without authority had 20% success"
- **Target psychology profile:** "This employee responds to peer pressure more than authority"
- **Next campaign suggestions:** "Try LinkedIn social proof angle. Previous WhatsApp authority angle was detected."
- **Organizational policy recommendations:** "Employees bypass 2FA under deadline pressure. Implement max-request-per-hour limits."

### Threat Pattern Mining (Across All Campaigns)
- Auto-identify which psychological triggers work best by:
  - Department (engineering vs. finance vs. HR)
  - Role (manager vs. individual contributor)
  - Geographic location
  - Platform (email more effective than SMS)
  - Attack vector (authority vs. urgency vs. social proof)
- Generate threat intelligence reports (anonymized)
- Identify emerging attack patterns

---

## TIER 7: ETHICAL & COMPLIANCE FRAMEWORK (LOCKED)

### External Control Only
- **No internal guardrails** that stop AI mid-conversation
- **Organizational responsibility:** Organization controls campaign; they own the outcome
- **Target autonomy:** Target can block anytime; that's their defense mechanism
- **Both are consensual:** Organization consents to campaign; target can opt-out via block

### Consent Framework
- **Explicit opt-in required** (target must sign acknowledgment before campaign)
- **Can escalate without re-consent** (escalation is part of original consent)
- **Can block anytime** (no penalty for opting out)
- **Full transparency post-campaign** (immediate debrief explaining simulation)

### Audit Logging (Mandatory)
- Every message logged (who sent, content, timestamp)
- Every interaction logged (emoji, sentiment, resistance signals)
- Every AI decision logged (which tactic chosen, why)
- Retention: 1 year minimum for compliance
- Access control: Only authorized admins can view

### Organizational Accountability Model
- **Organization decides:** Which campaigns to run, who to target, how persistent
- **PhishYou provides data:** Behavioral analytics, psychological breakdowns, policy recommendations
- **Organization acts:** Implements training, fixes policies, updates procedures
- **Legal responsibility:** Organization's lawyers review consent, compliance, liability

---

## TIER 8: DEVELOPMENT CONSTRAINTS (LOCKED)

### Tech Stack (Final)
- **Backend:** Python, FastAPI
- **LLM Integration:** Alibaba Qwen via Model Studio API
- **Conversation State:** LangChain for memory management
- **Voice Synthesis:** Alibaba Qwen TTS API
- **Image Generation:** Open-source models (Stable Diffusion) for media creation
- **Frontend MVP:** Streamlit (rapid prototyping); extensible to React/Next.js later
- **Deployment:** Cloud-native (Alibaba Cloud VM/container)
- **Database:** PostgreSQL for audit logs, conversation history

### Performance Requirements
- **Multi-turn latency:** < 3 seconds for AI response generation
- **Concurrent campaigns:** Support 100+ simultaneous conversations
- **Voice synthesis:** Generate realistic voicemail in < 10 seconds
- **Image generation:** Generate fake receipt in < 5 seconds

### Security Requirements
- **API authentication:** OAuth2 for organizational access
- **Data encryption:** End-to-end encryption for sensitive campaign data
- **Audit logging:** Immutable logs for compliance review
- **Rate limiting:** Prevent campaign spam; respect platform APIs

---

## Acceptance Criteria: Features LOCKED When

✅ All 8 tiers fully specified in separate documentation files  
✅ AI coder can implement each module without ambiguity  
✅ Example personas, attack chains, and prompts defined  
✅ Behavioral analytics schema finalized  
✅ Ethical frameworks documented  
✅ Multi-platform integration points specified  
✅ Testing scenarios defined  

**Status:** LOCKED. Ready for implementation.

---

## What's NOT Included (Explicitly Out of Scope)

- ❌ Malware delivery (phishing simulations only)
- ❌ Public-facing tool (enterprise-only, no open-source)
- ❌ Consumer targeting (B2B compliance-driven organizations only)
- ❌ Unauthorized testing (requires written organizational consent)
- ❌ Auto-platform-switching (explicit new campaign required)
- ❌ Internal guardrails that override admin control (external control only)

---

**Approval:** Mr. Khan  
**Date Locked:** August 24, 2026  
**Next Phase:** Full specification documentation suite (40+ files)
