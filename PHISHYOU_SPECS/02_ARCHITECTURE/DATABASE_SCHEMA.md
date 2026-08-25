# PhishYou: Database Schema (PostgreSQL)

---

## 1. Organizations Table

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    
    -- Tier & Compliance
    tier VARCHAR(10) CHECK (tier IN ('A', 'B', 'C')),
    compliance_level VARCHAR(50),  -- 'GDPR', 'CCPA', 'HIPAA', 'SOC2'
    
    -- Contact Info
    ciso_email VARCHAR(255) NOT NULL,
    ciso_name VARCHAR(255) NOT NULL,
    legal_contact_email VARCHAR(255),
    
    -- Flags
    legal_review_completed BOOLEAN DEFAULT FALSE,
    legal_review_date TIMESTAMP,
    transparency_statement_published BOOLEAN DEFAULT FALSE,
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_organizations_domain ON organizations(domain);
```

---

## 2. Campaigns Table

```sql
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    
    -- Metadata
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50),  -- 'email_credential', 'whatsapp_payment', etc
    tier VARCHAR(10),  -- Inherited from org if not specified
    
    -- Admin Details
    created_by UUID NOT NULL,  -- Admin user ID
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Consent
    consent_form_signed BOOLEAN DEFAULT FALSE,
    consent_form_url VARCHAR(512),
    ciso_approved BOOLEAN DEFAULT FALSE,
    ciso_approval_time TIMESTAMP,
    
    -- Status
    status VARCHAR(20) CHECK (status IN ('CREATED', 'PENDING_CONSENT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'HALTED')),
    
    -- Attack Configuration
    primary_trigger VARCHAR(50),
    secondary_trigger VARCHAR(50),
    platforms TEXT[],  -- ARRAY of ['email', 'whatsapp', 'instagram', etc]
    duration_days INT,
    auto_escalate BOOLEAN DEFAULT TRUE,
    
    -- Media Settings
    voice_enabled BOOLEAN DEFAULT TRUE,
    voice_language VARCHAR(10),
    document_generation BOOLEAN DEFAULT TRUE,
    
    -- Audit
    halted_reason VARCHAR(255),
    halted_by UUID,
    halted_at TIMESTAMP
);

CREATE INDEX idx_campaigns_organization ON campaigns(organization_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at);
```

---

## 3. Targets Table

```sql
CREATE TABLE campaign_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id),
    
    -- Employee Info
    target_name VARCHAR(255) NOT NULL,
    target_email VARCHAR(255) NOT NULL,
    target_phone VARCHAR(20),
    department VARCHAR(100),
    role VARCHAR(100),
    employment_duration_years FLOAT,
    
    -- Status
    status VARCHAR(20) CHECK (status IN ('PENDING', 'ACTIVE', 'DEFENDED', 'COMPROMISED', 'PAUSED', 'HALTED')),
    
    -- Consent
    consent_signed BOOLEAN DEFAULT FALSE,
    consent_signed_at TIMESTAMP,
    
    -- Defense Status
    final_outcome VARCHAR(20),  -- 'COMPROMISED', 'DEFENDED', 'PAUSED'
    defense_mechanism VARCHAR(100),  -- 'out_of_band_verification', 'blocked_sender', etc
    
    -- Metrics (calculated post-campaign)
    resistance_score_final FLOAT,
    time_to_skepticism_seconds INT,
    time_to_defense_seconds INT,
    total_exchanges INT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    campaign_started_at TIMESTAMP,
    campaign_ended_at TIMESTAMP
);

CREATE INDEX idx_targets_campaign ON campaign_targets(campaign_id);
CREATE INDEX idx_targets_status ON campaign_targets(status);
```

---

## 4. Messages (Conversation History - Immutable Log)

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id),
    target_id UUID NOT NULL REFERENCES campaign_targets(id),
    
    -- Message Metadata
    exchange_number INT NOT NULL,
    actor VARCHAR(20) CHECK (actor IN ('ai_agent', 'target')),
    message_type VARCHAR(50),  -- 'initial_contact', 'user_response', 'escalation', etc
    platform VARCHAR(20),  -- 'email', 'whatsapp', 'instagram', 'voice'
    
    -- Content (immutable)
    message_content TEXT NOT NULL,
    message_hash VARCHAR(64),  -- SHA-256 for integrity verification
    
    -- AI Analysis (for AI messages)
    ai_reasoning TEXT,
    psychological_triggers_used TEXT[],
    tactic_used VARCHAR(100),
    media_attached BOOLEAN,
    media_type VARCHAR(50),
    
    -- User Analysis (for target messages)
    resistance_score FLOAT,
    emoji_count INT,
    emoji_sentiment_shift FLOAT,
    question_count INT,
    explicit_skepticism BOOLEAN,
    verification_demand BOOLEAN,
    response_latency_seconds INT,
    
    -- Timestamps (immutable)
    sent_at TIMESTAMP NOT NULL,
    received_at TIMESTAMP,
    analyzed_at TIMESTAMP,
    
    -- Compliance
    user_ip_address INET,
    delivery_platform_id VARCHAR(255),  -- SMTP ID, Twilio ID, etc
    
    CONSTRAINT immutable_message CHECK (deleted_at IS NULL)
);

CREATE INDEX idx_messages_campaign ON messages(campaign_id);
CREATE INDEX idx_messages_target ON messages(target_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at);
CREATE INDEX idx_messages_hash ON messages(message_hash);  -- For integrity verification
```

---

## 5. Behavioral Analytics (Pre-Calculated)

```sql
CREATE TABLE campaign_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id),
    target_id UUID NOT NULL REFERENCES campaign_targets(id),
    
    -- Emoji Analysis
    emoji_sentiment_progression JSONB,  -- [{msg_num: 1, score: 0.8}, {msg_num: 2, score: 0.0}]
    emoji_frequency_change INT,
    emoji_shift_type VARCHAR(50),  -- 'downshift', 'disappearance', 'none'
    
    -- Timing Analysis
    response_latencies INT[],  -- Array of latency_seconds per exchange
    avg_response_latency FLOAT,
    latency_trend VARCHAR(20),  -- 'increasing', 'decreasing', 'stable'
    
    -- Sentiment Analysis
    sentiment_scores FLOAT[],  -- Sentiment per message
    sentiment_shift FLOAT,  -- Overall shift (negative = more skeptical)
    
    -- Resistance Signals
    resistance_signals JSONB,  -- [{type: 'explicit_skepticism', severity: 0.8}]
    resistance_score_final FLOAT,
    
    -- Trigger Effectiveness
    primary_trigger_effectiveness FLOAT,
    secondary_trigger_effectiveness FLOAT,
    trigger_ranking JSONB,  -- [{rank: 1, trigger: 'authority', effectiveness: 0.65}]
    
    -- Time-to-Compromise
    time_to_first_skepticism INT,
    time_to_escalation_request INT,
    time_to_defense INT,
    
    -- Policy Gaps Detected
    policy_gaps JSONB,  -- [{gap_id: 'pgap_001', title: '...', severity: 'high'}]
    
    -- Generated AAR
    aar_json JSONB,
    aar_generated_at TIMESTAMP
);

CREATE INDEX idx_analytics_campaign ON campaign_analytics(campaign_id);
CREATE INDEX idx_analytics_target ON campaign_analytics(target_id);
```

---

## 6. AAR (After-Action Report)

```sql
CREATE TABLE after_action_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id),
    target_id UUID NOT NULL REFERENCES campaign_targets(id),
    
    -- AAR Content (immutable)
    campaign_outcome VARCHAR(20),  -- 'COMPROMISED', 'DEFENDED'
    behavioral_summary JSONB,
    trigger_analysis JSONB,
    policy_gaps JSONB,
    coaching_recommendations JSONB,
    comparative_score JSONB,
    
    -- Metadata
    generated_at TIMESTAMP DEFAULT NOW(),
    admin_viewed_at TIMESTAMP,
    
    -- Storage
    aar_pdf_url VARCHAR(512),  -- Stored in S3 / OSS
    aar_html_url VARCHAR(512)
);

CREATE INDEX idx_aar_campaign ON after_action_reports(campaign_id);
CREATE INDEX idx_aar_target ON after_action_reports(target_id);
```

---

## 7. Threat Intelligence & Learning

```sql
CREATE TABLE campaign_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Pattern Identification
    pattern_type VARCHAR(50),  -- 'trigger_effectiveness', 'platform_effectiveness', 'role_vulnerability'
    pattern_category VARCHAR(100),
    
    -- Pattern Data
    pattern_data JSONB,  -- Flexible structure for different patterns
    
    -- Applicability
    applicable_department VARCHAR(100),
    applicable_role VARCHAR(100),
    applicable_platform VARCHAR(50),
    
    -- Metrics
    sample_size INT,
    success_rate FLOAT,
    confidence_level FLOAT,
    
    -- Timestamps
    identified_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE INDEX idx_patterns_type ON campaign_patterns(pattern_type);
```

---

## 8. Audit Logs (Immutable)

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Who Did It
    admin_id UUID NOT NULL,
    admin_email VARCHAR(255),
    
    -- What Happened
    action VARCHAR(100),  -- 'campaign_created', 'campaign_started', 'data_accessed'
    resource_type VARCHAR(50),  -- 'campaign', 'target', 'message'
    resource_id UUID,
    
    -- Details
    action_details JSONB,
    ip_address INET,
    user_agent VARCHAR(512),
    
    -- Outcome
    action_result VARCHAR(20),  -- 'success', 'failure'
    error_message VARCHAR(512),
    
    -- Timestamps (immutable)
    action_timestamp TIMESTAMP DEFAULT NOW(),
    
    -- Security
    signature VARCHAR(512),  -- HMAC-SHA256 of log entry
    
    CONSTRAINT immutable_audit CHECK (deleted_at IS NULL)
);

CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(action_timestamp);
CREATE INDEX idx_audit_logs_signature ON audit_logs(signature);  -- For verification
```

---

## 9. Threat Intelligence Export

```sql
CREATE TABLE threat_intelligence_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    
    -- Report Metadata
    report_name VARCHAR(255),
    report_type VARCHAR(50),  -- 'threat_patterns', 'attack_effectiveness', 'emerging_vectors'
    
    -- Anonymized Data
    report_content JSONB,  -- Anonymized patterns and findings
    
    -- Compliance
    anonymization_method VARCHAR(100),  -- 'role_aggregation', 'department_aggregation', 'pattern_only'
    shareable_externally BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    generated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_threat_intel_org ON threat_intelligence_reports(organization_id);
```

---

## 10. Consent Forms (Immutable)

```sql
CREATE TABLE consent_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id),
    target_id UUID REFERENCES campaign_targets(id),
    
    -- Consent Details
    employee_name VARCHAR(255),
    employee_email VARCHAR(255),
    signed_at TIMESTAMP NOT NULL,
    
    -- Form Content (immutable)
    form_version VARCHAR(20),
    form_content TEXT NOT NULL,  -- Full text of consent form
    form_hash VARCHAR(64),  -- SHA-256 hash
    
    -- Signature
    signature_url VARCHAR(512),  -- PDF with signature
    signed_by UUID,  -- HR witness
    
    -- Compliance
    gdpr_acknowledged BOOLEAN DEFAULT FALSE,
    psychological_impact_acknowledged BOOLEAN DEFAULT FALSE,
    right_to_opt_out_acknowledged BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_consent_campaign ON consent_forms(campaign_id);
CREATE INDEX idx_consent_target ON consent_forms(target_id);
```

---

## 11. Data Deletion & Retention

```sql
-- Soft Delete Pattern (for compliance)
ALTER TABLE organizations ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE campaigns ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE campaign_targets ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE messages ADD COLUMN deleted_at TIMESTAMP;

-- Create views for active records
CREATE VIEW active_organizations AS
    SELECT * FROM organizations WHERE deleted_at IS NULL;

CREATE VIEW active_campaigns AS
    SELECT * FROM campaigns WHERE deleted_at IS NULL;

-- Retention Policy Tracking
CREATE TABLE retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    
    data_type VARCHAR(50),  -- 'campaign_data', 'messages', 'audit_logs'
    retention_days INT,  -- How long to keep
    delete_after_days INT,  -- When to soft-delete
    
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 12. Indexes & Performance

```sql
-- Full-text search on messages
CREATE INDEX idx_messages_content_fts ON messages 
    USING gin(to_tsvector('english', message_content));

-- Performance queries
CREATE INDEX idx_campaigns_org_status ON campaigns(organization_id, status);
CREATE INDEX idx_targets_campaign_status ON campaign_targets(campaign_id, status);

-- Analytical queries
CREATE INDEX idx_analytics_timestamp ON campaign_analytics(campaign_id, aar_generated_at);
```

---

## 13. Sequences & Defaults

```sql
-- Campaign numbering (for easy reference)
CREATE SEQUENCE campaign_sequence START 1000;

-- Support for reference IDs like "camp_2026_08_24_001"
ALTER TABLE campaigns ADD COLUMN reference_id VARCHAR(50) DEFAULT 
    'camp_' || to_char(NOW(), 'YYYY_MM_DD') || '_' || nextval('campaign_sequence');
```

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
