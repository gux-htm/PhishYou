# AI Campaign System - Workflow Diagrams

## 1. Complete Campaign Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER INTERACTION                             │
│                                                                   │
│  Step 1: Start Conversation                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ User: "Create campaign for engineering department"      │   │
│  │       "Test password awareness, 20 people"              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ↓                                       │
│  Step 2: AI Gathers Context                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ AI: "Tell me about the targets and scenario"            │   │
│  │ User provides: names, emails, roles, departments        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                   CAMPAIGN CREATION                              │
│                                                                   │
│  ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐  │
│  │ Extract      │ →  │ Create Campaign │ →  │ Store in DB  │  │
│  │ Context      │    │ with AI         │    │              │  │
│  └──────────────┘    └─────────────────┘    └──────────────┘  │
│                                                                   │
│  Campaign Created: ID = camp-12345                               │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                EMAIL GENERATION (Per Target)                     │
│                                                                   │
│  For each target (parallel processing):                          │
│                                                                   │
│  ┌─────────────┐   ┌──────────────────┐   ┌────────────────┐  │
│  │ Target Info │ → │ AI Personalizes  │ → │ Generate Email │  │
│  │ - Name      │   │ Based on:        │   │ - Subject      │  │
│  │ - Role      │   │ - Role context   │   │ - Body         │  │
│  │ - Dept      │   │ - Dept context   │   │ - HTML/Text    │  │
│  └─────────────┘   │ - Org context    │   └────────────────┘  │
│                     │ - Scenario       │                         │
│                     └──────────────────┘                         │
│                                                                   │
│  Example Output:                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ To: john@company.com (Senior Engineer)                   │  │
│  │ Subject: Critical: SSL Certificate Expiring              │  │
│  │ Body: "Hi John, Our production SSL cert expires..."      │  │
│  │ Personalization: Technical terminology, urgent timing    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                     PREVIEW & REVIEW                             │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Preview Screen Shows:                                  │    │
│  │  - All generated emails                                 │    │
│  │  - Personalization reasoning                            │    │
│  │  - Edit capabilities                                    │    │
│  │  - Test send option                                     │    │
│  │                                                          │    │
│  │  [Edit Subject] [Edit Body] [Regenerate] [Send Test]   │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                   CAMPAIGN EXECUTION                             │
│                                                                   │
│  Batch 1 (targets 1-10)                                          │
│  ├─ Send email to target 1 ━━━━━━━> ✓ Sent                     │
│  ├─ Wait 2 seconds                                               │
│  ├─ Send email to target 2 ━━━━━━━> ✓ Sent                     │
│  ├─ Wait 2 seconds                                               │
│  └─ ... continue ...                                             │
│                                                                   │
│  Wait 5 seconds (batch delay)                                    │
│                                                                   │
│  Batch 2 (targets 11-20)                                         │
│  ├─ Send email to target 11 ━━━━━━> ✓ Sent                     │
│  └─ ... continue ...                                             │
│                                                                   │
│  Real-time Status:                                               │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Campaign: Engineering Awareness                        │    │
│  │  Status: Running                                        │    │
│  │  Progress: 15/20 sent (75%)                            │    │
│  │  Success: 15 | Failed: 0                               │    │
│  │  [Pause] [Stop]                                         │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                    TRACKING & ANALYTICS                          │
│                                                                   │
│  Database Records:                                               │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Email Interactions:                                     │    │
│  │ - Sent: 2024-12-20 09:00:00                           │    │
│  │ - Delivered: 2024-12-20 09:00:15                      │    │
│  │ - Opened: 2024-12-20 09:15:30                         │    │
│  │ - Clicked: 2024-12-20 09:16:45                        │    │
│  │ - Submitted: 2024-12-20 09:17:00                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Campaign Analytics:                                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Total Sent: 20                                          │    │
│  │ Delivery Rate: 100%                                     │    │
│  │ Open Rate: 85%                                          │    │
│  │ Click Rate: 45%                                         │    │
│  │ Submission Rate: 20%                                    │    │
│  │ Success Rate: 80% (awareness achieved)                 │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## 2. AI Personalization Process

```
┌─────────────────────────────────────────────────────────────────┐
│                  INPUT: Target Information                       │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  Target Data:                                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Name: John Doe                                          │    │
│  │ Email: john@company.com                                 │    │
│  │ Department: Engineering                                 │    │
│  │ Role: Senior Software Engineer                          │    │
│  │ Context: Works on backend services, uses AWS           │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                AI ANALYSIS & PERSONALIZATION                     │
│                                                                   │
│  Step 1: Role Analysis                                           │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ "Senior Engineer → Technical person"                    │    │
│  │ "Can understand technical terminology"                  │    │
│  │ "Likely has access to critical systems"                │    │
│  └────────────────────────────────────────────────────────┘    │
│                           ↓                                       │
│  Step 2: Department Context                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ "Engineering → Familiar with:"                          │    │
│  │ - Git, CI/CD, deployment processes                     │    │
│  │ - AWS services and alerts                              │    │
│  │ - SSL certificates, security tools                     │    │
│  └────────────────────────────────────────────────────────┘    │
│                           ↓                                       │
│  Step 3: Scenario Selection                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Best scenarios for this target:                         │    │
│  │ ✓ SSL certificate expiration (highly relevant)         │    │
│  │ ✓ AWS security alert                                    │    │
│  │ ✓ Git repository access issue                          │    │
│  │ ✗ Invoice payment (not relevant)                       │    │
│  └────────────────────────────────────────────────────────┘    │
│                           ↓                                       │
│  Step 4: Language Adaptation                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Use technical terms: "SSL cert", "production env"       │    │
│  │ Reference systems: "AWS Console", "backend services"   │    │
│  │ Create urgency: "Production impact", "immediate"       │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                OUTPUT: Personalized Email                        │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ To: john@company.com                                    │    │
│  │ Subject: URGENT: Production SSL Certificate Expiring   │    │
│  │                                                          │    │
│  │ Hi John,                                                │    │
│  │                                                          │    │
│  │ Our monitoring system detected that the SSL certificate│    │
│  │ for your backend services (prod-api.company.com) will  │    │
│  │ expire in 48 hours.                                     │    │
│  │                                                          │    │
│  │ To renew immediately and avoid production downtime:     │    │
│  │ 1. Access AWS Console: [secure link]                   │    │
│  │ 2. Navigate to Certificate Manager                     │    │
│  │ 3. Follow the renewal process                          │    │
│  │                                                          │    │
│  │ This requires immediate action to prevent service      │    │
│  │ interruption. If you have questions, contact DevOps.   │    │
│  │                                                          │    │
│  │ Best regards,                                           │    │
│  │ IT Security Team                                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Personalization Applied:                                        │
│  ✓ Technical terminology (SSL, AWS, Certificate Manager)        │
│  ✓ References actual systems (backend services, prod)           │
│  ✓ Appropriate urgency for senior role                          │
│  ✓ Actionable steps matching technical knowledge                │
│  ✓ Realistic scenario for engineering department                │
└─────────────────────────────────────────────────────────────────┘
```

## 3. System Data Flow

```
┌───────────────────────────────────────────────────────────────┐
│                        FRONTEND                                │
│                                                                 │
│  ┌──────────────┐        ┌──────────────────────────────┐    │
│  │ AI Campaign  │        │ Real Email Preview           │    │
│  │ Studio       │───────▶│ - Show generated emails      │    │
│  │ - Chat UI    │        │ - Edit capabilities          │    │
│  │ - Context    │        │ - Test sending               │    │
│  └──────────────┘        └──────────────────────────────┘    │
│         │                              │                       │
└─────────┼──────────────────────────────┼───────────────────────┘
          │                              │
          ↓                              ↓
┌───────────────────────────────────────────────────────────────┐
│                         API LAYER                              │
│                                                                 │
│  /campaigns/create     /campaigns/preview                      │
│  /campaigns/launch     /campaigns/execute                      │
│  /ai/chat              /ai/generate-campaign                   │
│         │                              │                       │
└─────────┼──────────────────────────────┼───────────────────────┘
          │                              │
          ↓                              ↓
┌───────────────────────────────────────────────────────────────┐
│                    BACKEND SERVICES                            │
│                                                                 │
│  ┌───────────────────┐  ┌─────────────────────────────────┐  │
│  │ Campaign          │  │ Contextual Email Generation     │  │
│  │ Execution Service │  │ - AI personalization per target │  │
│  │ - Orchestration   │  │ - Context analysis              │  │
│  │ - Status tracking │  │ - Language adaptation           │  │
│  │ - Queue mgmt      │  │ - Scenario selection            │  │
│  └───────────────────┘  └─────────────────────────────────┘  │
│           │                            │                       │
│           └────────────┬───────────────┘                       │
│                        ↓                                       │
│  ┌─────────────────────────────────────────────────────┐     │
│  │            Email Service                             │     │
│  │            - SMTP integration                        │     │
│  │            - Queue management                        │     │
│  │            - Delivery tracking                       │     │
│  └─────────────────────────────────────────────────────┘     │
│           │                            │                       │
└───────────┼────────────────────────────┼───────────────────────┘
            │                            │
            ↓                            ↓
┌────────────────────┐        ┌──────────────────────────┐
│   Database         │        │  External Services       │
│   - Campaigns      │        │  ┌─────────────────────┐ │
│   - Targets        │        │  │ Gemini/Qwen AI      │ │
│   - Interactions   │        │  └─────────────────────┘ │
│   - Events         │        │  ┌─────────────────────┐ │
└────────────────────┘        │  │ SMTP Server         │ │
                               │  └─────────────────────┘ │
                               └──────────────────────────┘
```

## 4. Campaign State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                    CAMPAIGN STATES                           │
└─────────────────────────────────────────────────────────────┘

    [CREATED]
        ↓
    User adds targets
        ↓
    [DRAFT] ──────────────────┐
        ↓                     │
    User clicks launch        │ User can edit
        ↓                     │
    Generate emails           │
        ↓                     │
    [ACTIVE] ◄────────────────┘
        ↓
        ├──→ [PAUSED] ──→ Resume ──→ [ACTIVE]
        │
        ├──→ All emails sent ──→ [COMPLETED]
        │
        └──→ User stops ──→ [CANCELLED]


State Transitions:

DRAFT → ACTIVE
  Trigger: User launches campaign
  Actions: Start email generation and sending
  
ACTIVE → PAUSED
  Trigger: User pauses or error occurs
  Actions: Stop sending, preserve queue state
  
PAUSED → ACTIVE
  Trigger: User resumes
  Actions: Continue from where stopped
  
ACTIVE → COMPLETED
  Trigger: All emails successfully sent
  Actions: Mark campaign complete, generate report
  
ACTIVE → CANCELLED
  Trigger: User manually stops
  Actions: Stop immediately, mark remaining as not sent
```

## 5. Email Sending Queue

```
Campaign Launch → Queue Population
                        ↓
    ┌────────────────────────────────────────────────┐
    │           Email Queue (FIFO)                    │
    │                                                  │
    │  [Email 1] → [Email 2] → [Email 3] → [Email 4] │
    └────────────────────────────────────────────────┘
                        ↓
                 Batch Processor
                        ↓
    ┌────────────────────────────────────────────────┐
    │  Batch 1 (Size: 10)                            │
    │  ├─ Email 1 → Send → Wait 2s                   │
    │  ├─ Email 2 → Send → Wait 2s                   │
    │  └─ ... continue ...                            │
    │                                                  │
    │  Wait 5s (batch delay)                         │
    │                                                  │
    │  Batch 2 (Size: 10)                            │
    │  ├─ Email 11 → Send → Wait 2s                  │
    │  └─ ... continue ...                            │
    └────────────────────────────────────────────────┘
                        ↓
                 SMTP Server
                        ↓
            ┌───────────────────────┐
            │  Email Delivery       │
            │  - Success tracking   │
            │  - Failure handling   │
            │  - Retry logic        │
            └───────────────────────┘
                        ↓
                 Database Update
                        ↓
        Record: sent_at, delivered_at, status
```

This visual workflow guide helps understand the complete system architecture and data flow!
