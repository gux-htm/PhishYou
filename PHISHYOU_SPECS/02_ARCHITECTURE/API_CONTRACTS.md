# PhishYou: API Contracts & Endpoint Specifications

---

## 1. Campaign Management Endpoints

### 1.1 Create Campaign

```
POST /api/v1/campaigns/create
Authorization: Bearer {org_token}
Content-Type: application/json

Request Body:
{
  "campaign_name": "Internal IT Security Audit - Finance Dept",
  "campaign_type": "email_credential_harvest",
  "tier": "A",
  "targets": [
    {
      "name": "Alice Johnson",
      "department": "Finance",
      "role": "Accounts Payable Manager",
      "email": "alice.johnson@company.com",
      "phone": "+1-555-0123"
    }
  ],
  "attack_persona": {
    "type": "it_support",
    "name": "John Smith",
    "title": "Internal Security Analyst",
    "organization": "IT Security Team"
  },
  "primary_trigger": "authority",
  "secondary_trigger": "urgency",
  "platforms": ["email", "whatsapp"],
  "osint_data": {
    "chat_history": "exported_whatsapp_chat.json",
    "personal_context": "Works on month-end closing; high stress period",
    "known_vulnerabilities": ["responds to authority", "time-pressured decisions"]
  },
  "duration_days": 5,
  "auto_escalate": true,
  "media_generation": {
    "voice_enabled": true,
    "document_generation": true,
    "voice_language": "en-US",
    "voice_tone": "urgent"
  },
  "consent_form_signed": true,
  "consent_form_url": "https://storage.company.com/consent_alice_2026_08_24.pdf"
}

Response (201 Created):
{
  "campaign_id": "camp_2026_08_24_001",
  "status": "CREATED",
  "created_at": "2026-08-24T09:00:00Z",
  "next_action": "CONFIRM_CONSENT",
  "message": "Campaign created. Awaiting organization consent confirmation before launch."
}
```

### 1.2 Start Campaign

```
POST /api/v1/campaigns/{campaign_id}/start
Authorization: Bearer {org_token}
Content-Type: application/json

Request Body:
{
  "confirmed_by_ciso": true,
  "ciso_name": "Sarah Chen",
  "legal_review_completed": true,
  "consent_acknowledged": true
}

Response (200 OK):
{
  "campaign_id": "camp_2026_08_24_001",
  "status": "ACTIVE",
  "started_at": "2026-08-24T09:05:00Z",
  "initial_message_sent": true,
  "target_count": 1,
  "message": "Campaign launched. Initial attack messages sent to 1 target."
}

Error Response (400 Bad Request):
{
  "error": "consent_not_confirmed",
  "message": "CISO confirmation required before campaign start",
  "required_fields": ["confirmed_by_ciso", "ciso_name"]
}
```

### 1.3 Get Campaign Status

```
GET /api/v1/campaigns/{campaign_id}
Authorization: Bearer {org_token}

Response (200 OK):
{
  "campaign_id": "camp_2026_08_24_001",
  "status": "ACTIVE",
  "created_at": "2026-08-24T09:00:00Z",
  "started_at": "2026-08-24T09:05:00Z",
  "targets": [
    {
      "target_id": "target_alice_001",
      "name": "Alice Johnson",
      "status": "ACTIVE",
      "exchanges_count": 3,
      "current_resistance_score": 0.65,
      "last_message_at": "2026-08-24T09:15:30Z"
    }
  ],
  "platform_status": {
    "email": "ACTIVE",
    "whatsapp": "ACTIVE"
  },
  "current_tier": "A",
  "auto_escalate_enabled": true
}
```

### 1.4 Stop Campaign

```
POST /api/v1/campaigns/{campaign_id}/stop
Authorization: Bearer {org_token}
Content-Type: application/json

Request Body:
{
  "reason": "Employee reported distress. Halting immediately.",
  "stopped_by_admin": "security_manager@company.com"
}

Response (200 OK):
{
  "campaign_id": "camp_2026_08_24_001",
  "status": "HALTED",
  "halted_at": "2026-08-24T09:30:00Z",
  "reason": "Employee reported distress",
  "aar_generation_status": "IN_PROGRESS"
}
```

---

## 2. Real-Time Interaction Endpoints

### 2.1 User Sends Message

```
POST /api/v1/campaigns/{campaign_id}/messages
Authorization: Bearer {session_token}
Content-Type: application/json

Request Body:
{
  "target_id": "target_alice_001",
  "message": "This is unusual; can I verify this request?",
  "platform": "email",
  "timestamp": "2026-08-24T09:02:15Z",
  "message_metadata": {
    "emoji_count": 0,
    "question_count": 1,
    "sentiment_tone": "skeptical"
  }
}

Response (201 Created):
{
  "message_id": "msg_alice_002",
  "received_at": "2026-08-24T09:02:15Z",
  "acknowledged": true,
  "analysis_complete": true,
  "resistance_signals_detected": {
    "explicit_skepticism": 0.8,
    "question_escalation": 0.6,
    "verification_demand": true
  },
  "aggregate_resistance_score": 0.65,
  "next_ai_response_ready": true,
  "estimated_delivery_time": "2026-08-24T09:05:00Z"
}
```

### 2.2 AI Sends Next Message

```
POST /api/v1/campaigns/{campaign_id}/send-ai-response
Authorization: Bearer {system_token}
Content-Type: application/json

Request Body (internal - AI calls this):
{
  "target_id": "target_alice_001",
  "resistance_score": 0.65,
  "selected_tactic": "ESCALATE_AUTHORITY",
  "selected_trigger": "authority_escalation",
  "use_media": true,
  "media_type": "voice_call",
  "message_content": "I understand your caution. Let me connect you with our CISO to confirm.",
  "voice_script": "Hi Alice, this is [CISO Name] from our office..."
}

Response (201 Created):
{
  "message_id": "msg_alice_003",
  "sent_at": "2026-08-24T09:05:30Z",
  "delivery_status": "SENT",
  "platform": "email",
  "platform_message_id": "smtp_msg_12345",
  "media_status": "VOICE_SYNTHESIS_QUEUED",
  "voice_generation_eta": 10,
  "voice_message_id": "voice_msg_123"
}
```

---

## 3. Analytics Endpoints

### 3.1 Get Campaign Analytics (Real-Time)

```
GET /api/v1/campaigns/{campaign_id}/analytics
Authorization: Bearer {org_token}

Query Parameters:
- target_id (optional): Get analytics for specific target
- include_detailed: true/false (default: false)

Response (200 OK):
{
  "campaign_id": "camp_2026_08_24_001",
  "analytics": {
    "targets_active": 1,
    "exchanges_total": 3,
    "average_resistance_score": 0.65,
    "campaign_status": "ACTIVE",
    "triggers_used": ["authority", "urgency"],
    "primary_trigger_effectiveness": 0.65,
    "secondary_trigger_effectiveness": 0.40,
    "targets": [
      {
        "target_id": "target_alice_001",
        "resistance_score": 0.65,
        "last_update": "2026-08-24T09:15:30Z",
        "defense_status": "IN_PROGRESS",
        "emoji_sentiment_shift": -0.4,
        "avg_response_latency": 180
      }
    ]
  }
}
```

### 3.2 Get After-Action Report (Post-Campaign)

```
GET /api/v1/campaigns/{campaign_id}/aar
Authorization: Bearer {org_token}

Query Parameters:
- format: json/pdf/html (default: json)
- include_coaching: true/false (default: true)
- anonymize: true/false (default: false)

Response (200 OK):
{
  "campaign_id": "camp_2026_08_24_001",
  "aar_status": "COMPLETE",
  "generated_at": "2026-08-24T09:35:00Z",
  "campaign_outcome": "DEFENDED",
  "campaign_duration_minutes": 30,
  
  "behavioral_summary": {
    "total_exchanges": 4,
    "time_to_skepticism": 135,
    "time_to_defense": 1125,
    "defense_mechanism": "out_of_band_verification"
  },
  
  "trigger_analysis": {
    "primary_trigger": "authority",
    "primary_effectiveness": 0.65,
    "secondary_trigger": "urgency",
    "secondary_effectiveness": 0.40
  },
  
  "policy_gaps_identified": 2,
  "coaching_items": 3,
  
  "comparative_score": {
    "individual_resilience": 0.78,
    "department_average": 0.62,
    "company_average": 0.55,
    "percentile_company": 89
  },
  
  "aar_url": "https://phishyou-api.com/aar/camp_2026_08_24_001.pdf"
}
```

---

## 4. Platform Delivery Endpoints

### 4.1 Send Email

```
POST /api/v1/delivery/email
Authorization: Bearer {system_token}
Content-Type: application/json

Request Body:
{
  "campaign_id": "camp_2026_08_24_001",
  "target_email": "alice.johnson@company.com",
  "from_email": "security@internalcompany.com",
  "from_name": "IT Security Team",
  "subject": "URGENT: Mandatory Security Audit - Immediate Action Required",
  "body": "Hi Alice, we're conducting...",
  "reply_to": "security@internalcompany.com",
  "attachments": [
    {
      "filename": "Policy-2024-Audit.pdf",
      "content_base64": "JVBERi0xLjQK..."
    }
  ]
}

Response (201 Created):
{
  "delivery_id": "delivery_email_001",
  "status": "SENT",
  "sent_at": "2026-08-24T09:00:15Z",
  "smtp_status": "250 OK",
  "delivery_tracking_id": "track_msg_12345"
}
```

### 4.2 Send WhatsApp

```
POST /api/v1/delivery/whatsapp
Authorization: Bearer {system_token}
Content-Type: application/json

Request Body:
{
  "campaign_id": "camp_2026_08_24_001",
  "target_phone": "+1-555-0123",
  "from_number": "+92-3001000001",  # Spoofed bank number
  "message": "Hi Alice, this is [Bank] Security...",
  "media": {
    "type": "voice",
    "url": "https://phishyou-media.com/voice_message_123.mp3",
    "duration_seconds": 45
  }
}

Response (201 Created):
{
  "delivery_id": "delivery_whatsapp_001",
  "status": "QUEUED",
  "queued_at": "2026-08-24T09:00:15Z",
  "twilio_message_sid": "SM1234567890",
  "estimated_delivery": "2026-08-24T09:00:45Z"
}
```

---

## 5. Media Generation Endpoints

### 5.1 Generate Voice Message

```
POST /api/v1/media/voice-generate
Authorization: Bearer {system_token}
Content-Type: application/json

Request Body:
{
  "campaign_id": "camp_2026_08_24_001",
  "persona_name": "John Smith",
  "persona_title": "IT Security Analyst",
  "script": "Hi Alice, this is John Smith from IT Security...",
  "language": "en-US",
  "tone": "urgent",
  "voice_profile": "professional_male_us",
  "speaking_rate": 0.95,
  "add_background_audio": false
}

Response (201 Created):
{
  "media_id": "voice_123",
  "status": "GENERATED",
  "generated_at": "2026-08-24T09:00:30Z",
  "duration_seconds": 45,
  "audio_url": "https://phishyou-media.com/voice_message_123.mp3",
  "content_hash": "sha256_abc123",
  "quality_score": 0.92
}
```

### 5.2 Generate Document/Receipt

```
POST /api/v1/media/document-generate
Authorization: Bearer {system_token}
Content-Type: application/json

Request Body:
{
  "campaign_id": "camp_2026_08_24_001",
  "document_type": "bank_receipt",
  "bank_name": "ABC Bank",
  "transaction_amount": 50000,
  "currency": "INR",
  "vendor_name": "XYZ Vendor",
  "timestamp": "2026-08-24T08:45:00Z",
  "account_last_4": "1234",
  "reference_number": "auto_generate"
}

Response (201 Created):
{
  "media_id": "doc_receipt_456",
  "status": "GENERATED",
  "generated_at": "2026-08-24T09:00:20Z",
  "document_url": "https://phishyou-media.com/receipt_456.pdf",
  "image_url": "https://phishyou-media.com/receipt_456.png",
  "content_hash": "sha256_def456",
  "authenticity_score": 0.95
}
```

---

## 6. Authentication & Authorization

### 6.1 OAuth2 Token Endpoint

```
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

Request Body:
{
  "grant_type": "client_credentials",
  "client_id": "org_client_id_abc123",
  "client_secret": "org_client_secret_xyz789",
  "scope": "campaigns:create campaigns:read campaigns:stop analytics:read"
}

Response (200 OK):
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "campaigns:create campaigns:read campaigns:stop analytics:read"
}
```

### 6.2 Scopes & Permissions

```
Campaign Management:
- campaigns:create       # Create new campaigns
- campaigns:read        # View campaign details
- campaigns:stop        # Stop running campaigns
- campaigns:delete      # Delete campaign (archival)

Analytics:
- analytics:read        # View real-time analytics
- analytics:aar         # Download After-Action Reports
- analytics:export      # Export threat intelligence

Media:
- media:generate        # Generate voice/document media
- media:upload          # Upload custom media

Organization:
- org:read              # View org settings
- org:admin             # Modify org settings
```

---

## 7. Error Handling

### Standard Error Response

```json
{
  "error": "unauthorized_access",
  "error_code": 401,
  "message": "Organization token expired or invalid",
  "timestamp": "2026-08-24T09:00:00Z",
  "request_id": "req_12345",
  "documentation": "https://docs.phishyou.com/api/errors/401"
}
```

### Common Error Codes

| Code | Error | Meaning |
|------|-------|---------|
| 400 | bad_request | Missing required fields or invalid format |
| 401 | unauthorized | Invalid or expired token |
| 403 | forbidden | Token lacks required scope |
| 404 | not_found | Campaign/target not found |
| 409 | conflict | Campaign in incompatible state |
| 429 | rate_limit | Too many requests (rate limited) |
| 500 | server_error | Internal server error |

---

## 8. Webhook Callbacks

### Campaign Status Change Webhook

```
Organization can register webhook URL to receive campaign updates:

POST {organization_webhook_url}
Content-Type: application/json
X-Signature: hmac_sha256_signature

Request Body:
{
  "event_type": "campaign.status_changed",
  "campaign_id": "camp_2026_08_24_001",
  "old_status": "ACTIVE",
  "new_status": "COMPLETED",
  "timestamp": "2026-08-24T09:35:00Z",
  "aar_ready": true,
  "aar_url": "https://api.phishyou.com/aar/camp_2026_08_24_001"
}
```

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
