# PhishYou: System Architecture & Technical Design

---

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PHISHYOU PLATFORM                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │               ADMIN DASHBOARD (Streamlit MVP)                │   │
│  │  - Campaign creation & management                            │   │
│  │  - Real-time campaign monitoring                             │   │
│  │  - Analytics & AAR viewing                                   │   │
│  │  - Threat intelligence export                                │   │
│  └──────────────────────┬──────────────────────────────────────┘   │
│                         │                                            │
│  ┌──────────────────────▼──────────────────────────────────────┐   │
│  │           CAMPAIGN ORCHESTRATION ENGINE (FastAPI)            │   │
│  │  - Campaign state machine                                    │   │
│  │  - Multi-platform message routing                            │   │
│  │  - Persistence logic (Tier A/B/C)                            │   │
│  │  - Context & OSINT management                                │   │
│  └──────────────────────┬──────────────────────────────────────┘   │
│                         │                                            │
│  ┌──────────────────────▼──────────────────────────────────────┐   │
│  │        AI ADVERSARIAL AGENT (LangChain Orchestrator)         │   │
│  │  ┌─────────────────────────────────────────────────────┐    │   │
│  │  │ LLM Backbone (Alibaba Qwen via Model Studio API)   │    │   │
│  │  │ - System prompts for each attack persona           │    │   │
│  │  │ - Real-time adaptation logic                       │    │   │
│  │  │ - Psychological trigger selection                  │    │   │
│  │  │ - Multi-turn conversation management               │    │   │
│  │  └─────────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────────┐    │   │
│  │  │ Behavioral Analysis Modules                         │    │   │
│  │  │ - Emoji microanalysis                               │    │   │
│  │  │ - Timing pattern detection                          │    │   │
│  │  │ - Sentiment analysis (user hesitation detection)    │    │   │
│  │  │ - Resistance signal identification                  │    │   │
│  │  └─────────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────────┐    │   │
│  │  │ Media Generation Pipeline                           │    │   │
│  │  │ - Voice synthesis (Alibaba Qwen TTS)               │    │   │
│  │  │ - Image generation (Stable Diffusion)              │    │   │
│  │  │ - Document creation (fake receipts, invoices)      │    │   │
│  │  └─────────────────────────────────────────────────────┘    │   │
│  └──────────────────┬───────────────────────────────────────────┘   │
│                     │                                                │
│  ┌──────────────────▼───────────────────────────────────────────┐   │
│  │        MULTI-PLATFORM DELIVERY & SPOOFING LAYER              │   │
│  │  ┌────────────┐ ┌──────────────┐ ┌──────────┐ ┌────────────┐ │   │
│  │  │   Email    │ │  WhatsApp    │ │Instagram │ │ LinkedIn   │ │   │
│  │  │  Spoofing  │ │  Number      │ │  Account │ │ Spoofing   │ │   │
│  │  │  (SMTP)    │ │  Spoofing    │ │Takeover  │ │            │ │   │
│  │  │            │ │  (Twilio API)│ │(Graph API)│ │(Webhooks)  │ │   │
│  │  └────────────┘ └──────────────┘ └──────────┘ └────────────┘ │   │
│  │  ┌────────────┐                                                │   │
│  │  │    SMS     │                                                │   │
│  │  │  (Twilio)  │                                                │   │
│  │  └────────────┘                                                │   │
│  └──────────────────┬───────────────────────────────────────────┘   │
│                     │                                                │
│  ┌──────────────────▼───────────────────────────────────────────┐   │
│  │           BEHAVIORAL ANALYTICS & LEARNING ENGINE              │   │
│  │  - Conversation analysis                                      │   │
│  │  - Trigger effectiveness scoring                              │   │
│  │  - Policy gap detection                                       │   │
│  │  - Threat pattern mining                                      │   │
│  │  - Psychological profile building                             │   │
│  └──────────────────┬───────────────────────────────────────────┘   │
│                     │                                                │
│  ┌──────────────────▼───────────────────────────────────────────┐   │
│  │              DATA PERSISTENCE LAYER (PostgreSQL)              │   │
│  │  - Campaign state & metadata                                  │   │
│  │  - Conversation history (immutable audit logs)                │   │
│  │  - Behavioral analytics results                               │   │
│  │  - Learning loop data                                         │   │
│  │  - Threat patterns & recommendations                          │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │              EXTERNAL API INTEGRATIONS                         │   │
│  │  - Alibaba Qwen LLM API (conversation orchestration)          │   │
│  │  - Alibaba Qwen TTS API (voice synthesis)                     │   │
│  │  - Stable Diffusion API (image generation)                    │   │
│  │  - Twilio API (SMS/WhatsApp delivery)                         │   │
│  │  - Email SMTP providers (spoofed delivery)                    │   │
│  │  - Social media APIs (Instagram Graph, LinkedIn)              │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Components Breakdown

### 2.1 Campaign Orchestration Engine (FastAPI Backend)

**Purpose:** Central coordination hub for all campaigns; manages state, routing, and persistence logic

**Key Endpoints:**
```python
# Campaign Management
POST   /campaigns/create          # Create new campaign
POST   /campaigns/{id}/start      # Launch campaign
POST   /campaigns/{id}/stop       # Admin stops campaign
GET    /campaigns/{id}            # Get campaign status
GET    /campaigns/{id}/history    # Get full conversation history

# Real-Time Interaction
POST   /campaigns/{id}/respond    # Target sends message; route to AI
GET    /campaigns/{id}/next-message # AI generates next message

# Analytics
GET    /campaigns/{id}/aar        # Get After-Action Report
GET    /campaigns/{id}/analytics  # Detailed behavioral breakdown
POST   /campaigns/{id}/export     # Export anonymized threat intelligence
```

**State Machine:**
```
CREATED → PENDING_CONSENT → ACTIVE → PAUSED → COMPLETED/HALTED
           ↓                ↓        ↓
         (org confirms)  (ongoing)  (admin or target blocks)
```

---

### 2.2 AI Adversarial Agent (LangChain + Alibaba Qwen)

**Purpose:** Core intelligence; generates contextually-aware, psychologically sophisticated responses

**Architecture:**
```python
class AdversarialAgent:
    def __init__(self, context_store, lm_model="qwen-turbo"):
        self.context = context_store  # OSINT, chat history, learned context
        self.lm = QwenLLM(model)
        self.behavioral_analyzer = BehavioralAnalyzer()
        self.trigger_selector = PsychologicalTriggerSelector()
    
    async def generate_response(self, user_message, conversation_history, target_profile):
        # 1. Analyze user's message for resistance signals
        resistance_signals = self.behavioral_analyzer.detect_signals(user_message)
        
        # 2. Select psychological trigger based on effectiveness
        selected_trigger = self.trigger_selector.select(target_profile, resistance_signals)
        
        # 3. Construct system prompt with all context
        system_prompt = self._build_system_prompt(
            persona=campaign.persona,
            context=self.context.get_all(),
            target_profile=target_profile,
            resistance_level=resistance_signals.severity,
            selected_trigger=selected_trigger
        )
        
        # 4. Call Alibaba Qwen LLM
        response = await self.lm.generate(
            system_prompt=system_prompt,
            conversation_history=conversation_history,
            max_tokens=200,
            temperature=0.7
        )
        
        # 5. Post-process: Check if media needed (voice, image)
        if self._media_needed(campaign.type, response):
            response = await self._generate_media(campaign.type, response)
        
        return response
```

**Key Modules:**

#### Behavioral Analyzer
- **Input:** Target's latest message, emoji usage, response time
- **Output:** Resistance signals (skepticism level, doubt markers, verification demands)
- **Logic:**
  - Emoji downshift? → Skepticism +40%
  - Response latency increased? → Doubt +30%
  - Questions escalated? → Suspicion +50%

#### Psychological Trigger Selector
- **Input:** Target profile, resistance level, attack history
- **Output:** Primary trigger (Authority, Urgency, Fear, Social Proof, Reciprocity)
- **Logic:** Select trigger with highest historical effectiveness against this target; if resisting current trigger, pivot to secondary

#### Context Preservation Module
- **Responsibility:** Maintain complete memory of:
  - Provided OSINT (chat history, personal details)
  - Learned context (what target revealed in this campaign)
  - Previous campaigns (persona effectiveness, tactical learnings)
- **Access:** Every LLM call includes full context in system prompt (token budget permitting)

---

### 2.3 Behavioral Analysis Modules

#### 3.1 Emoji Microanalysis Engine

**Input:** Each message from target

**Analysis:**
```python
class EmojiAnalyzer:
    def analyze(self, current_message, conversation_history):
        # Extract emoji from current message
        current_emojis = extract_emojis(current_message)
        
        # Compare to previous messages
        emoji_trend = self._calculate_trend(
            current_emojis,
            [extract_emojis(m) for m in conversation_history[-5:]]
        )
        
        # Sentiment mapping
        if emoji_trend == "downshift":  # 😊 → 😐
            return ResistanceSignal(
                type="emoji_sentiment_downshift",
                severity=0.6,
                interpretation="User growing skeptical"
            )
        
        if emoji_trend == "disappearance":  # Has emojis → No emojis
            return ResistanceSignal(
                type="emoji_disappearance",
                severity=0.5,
                interpretation="Shift to formal/defensive tone"
            )
        
        return ResistanceSignal(severity=0.0)  # No resistance detected
```

#### 3.2 Timing Pattern Detection

**Input:** Message timestamp, user's typical response latency

**Analysis:**
```python
class TimingAnalyzer:
    def analyze(self, message_timestamp, user_profile):
        time_since_last = message_timestamp - self.last_message_time
        user_avg_latency = user_profile.average_response_time
        
        if time_since_last > user_avg_latency * 3:
            return ResistanceSignal(
                type="response_latency_spike",
                severity=0.7,
                interpretation="User hesitating; potential verification attempt"
            )
        
        if time_since_last < user_avg_latency * 0.3:
            return ResistanceSignal(
                type="urgent_response",
                severity=-0.3,  # Negative = they're engaged/compliant
                interpretation="User responding quickly; compliant behavior"
            )
```

#### 3.3 Sentiment Analysis Module

**Input:** Target's latest message

**Analysis:**
```python
class SentimentAnalyzer:
    def analyze(self, message):
        # Use pre-trained sentiment model
        sentiment = self.model.analyze(message)
        
        # Map sentiment changes to resistance signals
        if message.contains_phrases(["I don't think", "That's weird", "This doesn't feel right"]):
            return ResistanceSignal(
                type="explicit_skepticism",
                severity=0.8,
                interpretation="User explicitly expressing doubt"
            )
        
        if message.contains_questions >= 3:
            return ResistanceSignal(
                type="question_escalation",
                severity=0.6,
                interpretation="User asking probing questions; deepening skepticism"
            )
```

#### 3.4 Resistance Signal Aggregation

```python
def aggregate_resistance_signals(signals: List[ResistanceSignal]) -> float:
    """
    Combine all signals into single resistance score (0-1)
    0 = compliant, 1 = maximum resistance
    """
    scores = [s.severity for s in signals]
    return sum(scores) / len(scores) if scores else 0.0
```

---

### 2.4 Media Generation Pipeline

#### Voice Synthesis Module

**Input:** Campaign type, persona, message content, emotional tone

**Process:**
```python
class VoiceSynthesisModule:
    async def generate_voicemail(self, campaign_type, persona, message, tone="urgent"):
        """
        Generate realistic voicemail using Alibaba Qwen TTS
        """
        # Step 1: Generate voice script (if not provided)
        script = await self.llm.generate_voice_script(
            persona=persona,
            message=message,
            tone=tone
        )
        
        # Step 2: Call Alibaba Qwen TTS
        audio_bytes = await self.qwen_tts.synthesize(
            text=script,
            voice_id=persona.voice_profile,  # "CFO_Male_Pakistani"
            language="en-US",
            emotion="urgent",
            speaking_rate=0.95  # Slightly faster for urgency
        )
        
        # Step 3: Add background audio (office ambiance, if needed)
        if campaign_type == "internal_verification":
            audio_with_ambiance = self._add_office_background(audio_bytes)
            return audio_with_ambiance
        
        return audio_bytes
```

#### Image/Document Generation Module

**Input:** Campaign type, required documents

**Process:**
```python
class MediaGenerationModule:
    async def generate_media(self, campaign_type, campaign_context):
        """
        Intelligently generate media based on campaign type
        """
        media_needs = self._determine_media_needs(campaign_type)
        
        if "receipt" in media_needs:
            receipt = await self._generate_receipt(
                vendor_name=campaign_context.vendor,
                amount=campaign_context.amount,
                timestamp=campaign_context.timestamp
            )
        
        if "invoice" in media_needs:
            invoice = await self._generate_invoice(campaign_context)
        
        if "bank_screenshot" in media_needs:
            screenshot = await self._generate_bank_portal_screenshot(
                bank=campaign_context.target_bank,
                account_type=campaign_context.account_type
            )
        
        return MediaPackage(receipt, invoice, screenshot)
    
    async def _generate_receipt(self, vendor_name, amount, timestamp):
        """Generate realistic payment receipt"""
        # Use Stable Diffusion or template-based generation
        receipt_template = self._load_receipt_template(vendor_name)
        receipt = receipt_template.fill(
            vendor_name=vendor_name,
            amount=amount,
            timestamp=timestamp,
            reference_id=self._generate_reference_id()
        )
        return receipt
```

---

### 2.5 Multi-Platform Delivery Layer

#### Email Delivery with Spoofing

```python
class EmailDeliveryModule:
    async def send_spoofed_email(self, campaign: Campaign, target: Target, message: str):
        """
        Send email appearing from spoofed sender
        """
        email = EmailMessage(
            subject=message.subject,
            body=message.body,
            from_email=campaign.spoofed_sender,  # e.g., "security@bankname.com"
            to=[target.email]
        )
        
        # Add headers to make authentication appear legitimate
        email["Reply-To"] = campaign.reply_to
        email["Organization"] = campaign.organization
        
        # Send via SMTP
        await self.smtp.send(email)
        
        # Log delivery
        await self._log_delivery("email", target, message, timestamp=now())
```

#### WhatsApp Delivery with Number Spoofing

```python
class WhatsAppDeliveryModule:
    async def send_spoofed_whatsapp(self, campaign: Campaign, target: Target, message: str):
        """
        Send WhatsApp message appearing from spoofed number via Twilio
        """
        # Twilio Messaging API allows custom sender ID
        twilio_message = await self.twilio_client.messages.create(
            body=message,
            from_=campaign.spoofed_phone_number,  # e.g., "+92-bank-number"
            to=target.phone_number
        )
        
        # Log delivery
        await self._log_delivery("whatsapp", target, message, message_sid=twilio_message.sid)
```

#### Instagram & LinkedIn Delivery

```python
class SocialMediaDeliveryModule:
    async def send_instagram_dm(self, campaign: Campaign, target: Target, message: str):
        """
        Send Instagram DM from spoofed account
        """
        # Use Instagram Graph API with spoofed account credentials
        response = await self.instagram_api.send_message(
            account_id=campaign.instagram_account_id,
            recipient_id=target.instagram_user_id,
            message=message
        )
        
        await self._log_delivery("instagram", target, message, message_id=response.id)
```

---

### 2.6 Behavioral Analytics & Learning Engine

#### AAR (After-Action Report) Generator

```python
class AARGenerator:
    async def generate_aar(self, campaign_id: str) -> AfterActionReport:
        """
        Generate comprehensive post-campaign analysis
        """
        campaign = await self.db.get_campaign(campaign_id)
        conversation_history = await self.db.get_conversation_history(campaign_id)
        
        aar = AfterActionReport(
            campaign_id=campaign_id,
            campaign_type=campaign.type,
            target=campaign.target,
            
            # Behavioral Breakdown
            behavioral_summary=await self._analyze_behavior(conversation_history),
            
            # Psychological Trigger Effectiveness
            trigger_effectiveness=await self._score_trigger_effectiveness(conversation_history),
            
            # Policy Gap Detection
            policy_gaps=await self._identify_policy_gaps(campaign, conversation_history),
            
            # Organizational Benchmark
            comparative_score=await self._compare_to_benchmarks(campaign.target),
            
            # Recommendations
            coaching_recommendations=await self._generate_coaching(conversation_history),
            next_campaign_recommendations=await self._recommend_next_tactics(campaign)
        )
        
        return aar
```

#### Threat Pattern Mining

```python
class ThreatPatternMiner:
    async def mine_patterns(self, completed_campaigns: List[Campaign]) -> ThreatIntelReport:
        """
        Identify patterns across multiple campaigns
        """
        patterns = ThreatIntelReport()
        
        # Which psychological triggers work best by department?
        trigger_by_dept = self._analyze_trigger_effectiveness_by_department(completed_campaigns)
        patterns.trigger_effectiveness_by_department = trigger_by_dept
        
        # Which platforms are most effective?
        platform_effectiveness = self._analyze_platform_effectiveness(completed_campaigns)
        patterns.platform_effectiveness = platform_effectiveness
        
        # Which attack chains work best against tech-savvy targets?
        tech_savvy_patterns = self._analyze_tech_savvy_attack_chains(completed_campaigns)
        patterns.tech_savvy_defense_gaps = tech_savvy_patterns
        
        return patterns
```

---

## 3. Data Flow Diagrams

### 3.1 Campaign Execution Flow

```
Admin creates campaign
         ↓
Campaign stored in DB (PENDING_CONSENT)
         ↓
Org confirms consent
         ↓
Campaign moves to ACTIVE
         ↓
System generates initial attack message
         ↓
Message delivered via platform (Email/WhatsApp/Instagram)
         ↓
Target receives and responds
         ↓
AI Agent analyzes response (emoji, timing, sentiment, resistance)
         ↓
AI selects psychological trigger & generates next message
         ↓
Process repeats until:
  - Admin stops campaign, OR
  - Target blocks sender, OR
  - Campaign duration expires
         ↓
AAR generated automatically
         ↓
Admin reviews analytics
         ↓
Organization implements coaching/policy changes
```

### 3.2 AI Response Generation Flow

```
Target sends message
         ↓
Parse message for: emoji, sentiment, questions, verification attempts
         ↓
Behavioral analyzer detects resistance signals
         ↓
Aggregate resistance score (0-1)
         ↓
IF resistance > threshold:
  - Pivot to secondary psychological trigger
  - Escalate authority (manager → CEO → regulator)
  - Increase urgency language
  - Consider media (voice, document)
         ↓
Psychological trigger selector chooses best next angle
         ↓
Build comprehensive system prompt including:
  - Campaign context
  - Target profile
  - Learned context from this conversation
  - OSINT from provided context
  - Selected psychological trigger
  - Resistance indicators
         ↓
Call Alibaba Qwen LLM with system prompt + conversation history
         ↓
LLM generates response text
         ↓
Determine if media needed (voice, image)?
  - If yes: call media generation module
  - If no: return text response
         ↓
Deliver response via platform
         ↓
Log interaction (immutable audit trail)
```

---

## 4. Technology Stack (Final)

| Layer | Technology | Justification |
|-------|-----------|----------------|
| **Backend Framework** | FastAPI | Async, type-safe, fast; ideal for concurrent campaigns |
| **AI Orchestration** | LangChain | Conversation memory, tool use, LLM abstraction |
| **LLM Provider** | Alibaba Qwen | Multi-lingual, conversational, accessible via API |
| **Voice Synthesis** | Alibaba Qwen TTS | Integrated with Qwen; multi-language, emotional control |
| **Image Generation** | Stable Diffusion | Open-source; can run locally or via API |
| **SMS/WhatsApp** | Twilio API | Reliable, supports spoofing, large coverage |
| **Email** | SMTP providers | Spoofing capability; standard protocol |
| **Social Media APIs** | Instagram Graph, LinkedIn API | Official integrations for DM delivery |
| **Database** | PostgreSQL | ACID compliance for audit logs; relational for campaign state |
| **Frontend (MVP)** | Streamlit | Rapid prototyping; interactive dashboard |
| **Deployment** | Alibaba Cloud (ECS/Container Service) | Cost-effective; close to Qwen infrastructure |
| **Monitoring** | Prometheus + Grafana | Campaign health, LLM latency, error tracking |

---

## 5. API Contracts (OpenAPI/Swagger)

See `/02_ARCHITECTURE/API_CONTRACTS.md` for detailed endpoint specifications, request/response schemas, and error handling.

---

## 6. Database Schema

See `/02_ARCHITECTURE/DATABASE_SCHEMA.md` for PostgreSQL table definitions, indices, and relationships.

---

## 7. Scaling Considerations

### Concurrent Campaign Capacity
- **Current Estimate:** 100+ simultaneous conversations at ~100ms response latency
- **Bottleneck:** Alibaba Qwen API rate limits; mitigation via request queuing
- **Horizontal Scaling:** Stateless design allows multiple instances; load balancer routes requests

### Database Scaling
- **Audit logs grow rapidly** (1 message = 50KB after analysis)
- **Strategy:** Partition conversations by date; archive old campaigns after 1 year
- **Backup:** Daily snapshots to Alibaba Object Storage Service (OSS)

### Media Generation Scaling
- **Voice synthesis latency:** ~5 seconds per message
- **Image generation latency:** ~10 seconds per image
- **Strategy:** Generate media async; cache common templates (e.g., recurring receipt layouts)

---

## 8. Security Considerations

### Authentication & Authorization
- **Admin access:** OAuth2 via Okta/Azure AD (post-MVP)
- **Campaign access:** Token-based; each campaign gets unique session token
- **API calls:** Signed requests with organization API key

### Data Protection
- **Encryption in transit:** TLS 1.3 for all API calls
- **Encryption at rest:** AES-256 for sensitive data (consent forms, AAR)
- **PII handling:** Campaign data can include names; must be encrypted at rest

### Audit Logging
- **Immutable audit trail:** All campaign interactions logged with timestamps
- **Admin actions:** Who created/stopped campaign logged
- **Compliance:** Meets GDPR, SOC 2, ISO 27001 audit requirements

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
