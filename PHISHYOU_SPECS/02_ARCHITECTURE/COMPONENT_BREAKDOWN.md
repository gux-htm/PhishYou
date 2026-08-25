# PhishYou: Component Breakdown & Architecture Details

---

## 1. Core Components Overview

```
PhishYou Architecture consists of 6 major components:

1. Campaign Orchestration Engine
2. AI Agent (LangChain + Qwen)
3. Behavioral Analysis Engine
4. Media Generation Pipeline
5. Platform Delivery Layer
6. Analytics & Reporting Engine
```

---

## 2. Campaign Orchestration Engine

### Purpose
Manages campaign lifecycle, state transitions, and message routing

### Responsibilities
- Create/start/stop campaigns
- Route messages to appropriate platforms
- Detect blocking and campaign end conditions
- Manage tier-specific persistence logic

### Dependencies
- PostgreSQL (campaign state)
- LangChain (conversation context)
- Twilio (delivery)

### Code Structure
```python
class CampaignOrchestrator:
    async def create_campaign(self, config: CampaignConfig)
    async def start_campaign(self, campaign_id: str)
    async def send_message(self, campaign_id: str, target_id: str)
    async def detect_blocking(self, campaign_id: str, platform: str)
    async def halt_campaign(self, campaign_id: str, reason: str)
    async def mark_defended(self, campaign_id: str, target_id: str)
    async def mark_compromised(self, campaign_id: str, target_id: str)
```

### Configuration
- Campaign tier (A/B/C)
- Target list
- Attack personas
- Platform selection
- Duration

---

## 3. AI Agent (LangChain + Qwen)

### Purpose
Generates realistic, adaptive conversational messages

### Architecture
```
Input (Conversation History) → LLM (Qwen) → Output (Next Message)
                                    ↓
                            Resistance Analysis
                                    ↓
                            Tactic Selection
                                    ↓
                            Prompt Engineering
                                    ↓
                            Response Generation
```

### Responsibilities
- Analyze conversation history
- Detect resistance signals
- Select appropriate tactics
- Generate contextual messages
- Preserve psychological profiles

### Key Methods
```python
class PhishYouAgent:
    async def analyze_resistance(self, message: str) → float
    async def select_tactic(self, resistance: float) → str
    async def generate_response(self, context: dict) → str
    async def build_prompt(self, tactic: str, context: dict) → str
    async def update_psychological_profile(self, target_id: str)
```

### Memory Management
- Conversation history (immutable)
- Psychological profile (mutable, updated after each turn)
- Campaign context (static, campaign-level)
- OSINT data (optional, provided by admin)

---

## 4. Behavioral Analysis Engine

### Purpose
Analyzes employee responses in real-time to detect resistance

### Components

#### 4.1 Emoji Analysis Module
- Detects emoji sentiment shifts
- Tracks emoji disappearance
- Calculates emoji-based resistance score

#### 4.2 Timing Analysis Module
- Measures response latency
- Detects escalating delays
- Identifies cognitive load signals

#### 4.3 Sentiment Analysis Module
- NLP sentiment scoring
- Emotional tone detection
- Formality shift tracking

#### 4.4 Explicit Signals Detection
- Question counting
- Skepticism keywords
- Verification requests
- Refusal patterns

### Output
```python
class BehavioralAnalysis:
    resistance_score: float  # 0-1
    resistance_level: str    # LOW/MEDIUM/HIGH/VERY_HIGH
    signals: List[Signal]    # Individual signals detected
    recommendation: str      # Next tactic recommendation
```

---

## 5. Media Generation Pipeline

### Purpose
Generate realistic voice messages and documents

### Components

#### 5.1 Voice Synthesis Module
- Qwen TTS API integration
- Voice profile selection
- Emotional tone control
- Natural prosody generation
- Audio post-processing

#### 5.2 Document Generation Module
- Fake receipt generation
- Invoice template rendering
- Document styling
- Realism optimization

### Workflow
```
Script Input → Persona Selection → Voice Synthesis → 
Post-Processing → Quality Check → Upload → URL Return
```

### Quality Assurance
```python
class MediaQualityAssurance:
    async def check_authenticity(self, audio: bytes) → float
    async def check_robotic_detection(self, audio: bytes) → float
    async def validate_duration(self, audio: bytes) → bool
    async def verify_no_artifacts(self, audio: bytes) → bool
```

---

## 6. Platform Delivery Layer

### Purpose
Deliver messages across multiple platforms

### Supported Platforms
1. **Email** (SMTP)
2. **WhatsApp** (Twilio API)
3. **SMS** (Twilio API)
4. **Voice Calls** (Twilio API)
5. **LinkedIn** (LinkedIn API)
6. **Instagram** (Instagram Graph API)

### Implementation
```python
class PlatformDeliveryRouter:
    async def send_email(self, target: str, message: EmailMessage)
    async def send_whatsapp(self, target: str, message: WhatsAppMessage)
    async def send_sms(self, target: str, message: SMSMessage)
    async def send_voice_call(self, target: str, voice_url: str)
    async def send_linkedin(self, target: str, message: LinkedInMessage)
    async def send_instagram(self, target: str, message: InstagramMessage)
```

### Error Handling
- Retry logic (3 attempts, exponential backoff)
- Fallback platforms
- Delivery tracking
- Bounce handling

---

## 7. Analytics & Reporting Engine

### Purpose
Generate insights and After-Action Reports

### Components

#### 7.1 Data Aggregation
- Collect all turn-by-turn data
- Calculate metrics
- Aggregate behavioral scores

#### 7.2 AAR Generation
- Build AAR structure
- Generate coaching recommendations
- Identify policy gaps
- Create comparative analysis

#### 7.3 Threat Intelligence
- Pattern mining
- Trigger effectiveness analysis
- Platform effectiveness ranking
- Next-campaign recommendations

### Database Queries
```python
class AnalyticsEngine:
    async def aggregate_campaign_data(self, campaign_id: str) → CampaignData
    async def calculate_metrics(self, campaign_data: CampaignData) → Metrics
    async def generate_aar(self, campaign_id: str) → AAR
    async def mine_threat_patterns(self, org_id: str) → ThreatIntel
    async def recommend_next_campaign(self, campaign_id: str) → Recommendation
```

---

## 8. API Layer (FastAPI)

### Purpose
Expose all functionality via REST API

### Structure
```
POST   /api/v1/campaigns/create
POST   /api/v1/campaigns/{id}/start
GET    /api/v1/campaigns/{id}
POST   /api/v1/campaigns/{id}/stop
POST   /api/v1/campaigns/{id}/messages
GET    /api/v1/campaigns/{id}/analytics
GET    /api/v1/campaigns/{id}/aar
POST   /api/v1/media/voice-generate
POST   /api/v1/media/document-generate
```

### Authentication
- OAuth2 (client credentials)
- JWT tokens
- Rate limiting
- Request signing

---

## 9. Data Layer (PostgreSQL)

### Purpose
Persistent storage of all campaign and audit data

### Key Tables
- organizations
- campaigns
- campaign_targets
- messages (immutable)
- campaign_analytics
- after_action_reports
- audit_logs (immutable, signed)
- consent_forms

### Indexing Strategy
```python
CREATE INDEX idx_campaigns_org_status 
    ON campaigns(organization_id, status);

CREATE INDEX idx_messages_campaign 
    ON messages(campaign_id);

CREATE INDEX idx_audit_logs_timestamp 
    ON audit_logs(action_timestamp);

CREATE FULL TEXT SEARCH INDEX 
    ON messages USING GIN(to_tsvector('english', message_content));
```

---

## 10. Caching Layer (Redis)

### Purpose
Performance optimization and session management

### Use Cases
- JWT token blacklisting
- Campaign state caching
- Conversation history caching (short-term)
- Rate limiting counters
- Session management

### TTL Strategy
```
JWT tokens: 1 hour
Campaign state: 5 minutes
Conversation cache: 1 hour
Rate limit counters: 1 minute
```

---

## 11. Logging & Monitoring

### Purpose
System observability and audit trail

### Components
- Application logs (JSON format)
- Audit logs (immutable, signed)
- Metrics (Prometheus)
- Traces (Jaeger)
- Alerts (PagerDuty)

### Log Levels
- DEBUG: Development troubleshooting
- INFO: Standard operations
- WARNING: Non-critical issues
- ERROR: Failures requiring attention
- CRITICAL: System failures

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
