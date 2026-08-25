# PhishYou: Threat Model & Security Considerations

---

## 1. Attack Surface

### External Threats (What PhishYou Protects Against)

**Employee-Facing Threats:**
- Spear phishing (personalized attacks with OSINT)
- Voice impersonation (CEO/authority figures)
- Multi-channel coordination (Email + WhatsApp + Phone)
- Psychological manipulation (authority, urgency, fear)
- Credential harvesting (via fake portals)
- Deepfake audio/video (AI-synthesized personas)

**Organizational Threats:**
- Policy bypass (employees ignoring procedures under pressure)
- Insider threat (compromised employee access)
- Data exfiltration (social engineering for secrets)
- Supply chain attacks (vendor impersonation)

### Internal Threats (What PhishYou Must Prevent)

**Misuse Vectors:**
- Rogue admin running campaigns without consent
- Using results to punish employees (vs. training)
- Targeting vulnerable individuals
- Exposing PII to unauthorized parties
- Data breach of campaign data

---

## 2. Security Requirements

### 2.1 Authentication & Authorization

**Admin Authentication:**
- OAuth2 with Okta/Azure AD (enterprise SSO)
- Multi-factor authentication (MFA) mandatory
- Role-based access control (RBAC):
  - CISO (full access)
  - Security Manager (campaign management)
  - HR Director (exemption review only)
  - Legal Counsel (audit logs only)

**Campaign Access:**
- Session tokens (short-lived, 1 hour expiry)
- Per-campaign authorization
- Audit log of every token issuance/use

### 2.2 Data Encryption

**In Transit:**
- TLS 1.3 for all API communication
- Certificate pinning for sensitive endpoints
- Perfect forward secrecy (PFS)

**At Rest:**
- AES-256 encryption for PII (names, emails, phone numbers)
- AES-256 encryption for campaign data
- Separate encryption keys per organization
- Key rotation every 90 days

**Key Management:**
- Keys stored in AWS KMS / Alibaba Key Management Service
- Access logs for every key usage
- Separation of duties (no single admin controls all keys)

### 2.3 Audit Logging

**What Gets Logged:**
- Every campaign creation (by whom, when, why)
- Every message sent (content, recipient, timestamp)
- Every admin action (login, configuration change, data access)
- Every data access (who accessed, what, when, why)
- Every exception and error

**Audit Trail Properties:**
- Immutable (append-only logs, cryptographic signatures)
- Tamper-evident (hash chain, signatures)
- Retention: 1 year minimum (7 years for compliance holds)
- Accessible only to authorized admins
- Exportable in SIEM format

### 2.4 Data Minimization

**Collect Only What's Necessary:**
- Employee name (required for targeting)
- Email address (required for delivery)
- Phone number (required for WhatsApp/SMS)
- Department/role (required for context)
- Do NOT collect SSN, passwords, financial data

**Aggregate in Reports:**
- AAR shows department-level metrics (not individual names)
- Threat intelligence is anonymized
- Benchmarking removes PII

### 2.5 Access Control

**PII Access Restrictions:**
- Only CISO and Security Manager can see full campaign details
- HR sees only exemption review data
- Legal sees only audit logs (no message content)
- No external party access (except via signed Data Processing Agreement)

---

## 3. Insider Threat Prevention

### 3.1 Rogue Admin Detection

**Signals Monitored:**
- Admin accessing campaigns they didn't create
- Admin downloading raw campaign data (not AAR)
- Admin accessing campaigns outside business hours
- Admin using VPN/proxy to access system
- Multiple failed authentication attempts
- Simultaneous logins from different geolocations

**Response:**
- Alert CISO immediately
- Require additional MFA verification
- Log for compliance review
- Potential account suspension

### 3.2 Misuse Prevention

**Prohibited Actions (Enforced):**
- ❌ Terminating employee based on campaign results
  - Implementation: Campaign results marked "training only"
  - HR receives separate notice: "Do not use for disciplinary actions"
  
- ❌ Targeting employees without consent
  - Implementation: Consent form required before campaign launch
  - System rejects campaigns without signed consent
  
- ❌ Sharing campaign data externally
  - Implementation: Export functionality requires audit log + approval
  - Data marked with DLP tags (prevents copy-paste)

---

## 4. Data Protection Compliance

### 4.1 GDPR Compliance

**Article 6 (Lawful Basis):**
- Legitimate interest: Organization's security interests
- Employment contract: Authorized training activities

**Article 7 (Consent):**
- Explicit, informed consent from employee
- Must be separate from employment agreement
- Can be withdrawn anytime

**Articles 15-17 (Data Subject Rights):**
- Right to access: Employee can request all data PhishYou has about them
- Right to rectification: Correct inaccurate data
- Right to erasure: Request deletion (except legal holds)
- Turnaround: 30 days max

**Article 28 (Data Processing):**
- Data Processing Agreement with organization
- PhishYou acts as "processor" (org is "controller")
- Only processes data as instructed by org

### 4.2 CCPA Compliance (California)

**Notice & Choice:**
- Inform consumers of data collection
- Opt-out mechanism (request to delete)

**Data Rights:**
- Right to know: Access what data is collected
- Right to delete: Request deletion
- Right to opt-out: Stop data sales (N/A for PhishYou)

---

## 5. Incident Response Plan

### 5.1 Data Breach Response

**If PhishYou discovers a breach:**

1. **Containment (1 hour):**
   - Isolate affected systems
   - Prevent further data loss
   - Notify Alibaba Cloud security team

2. **Assessment (4 hours):**
   - Determine scope (how much data, which organizations)
   - Identify cause (vulnerability, misuse, etc.)
   - Estimate timeline

3. **Notification (24 hours):**
   - Notify affected organizations
   - Notify regulatory authorities (if required)
   - Notify affected employees (if PII exposed)
   - Public disclosure (if required by law)

4. **Remediation (7 days):**
   - Fix vulnerability
   - Strengthen defenses
   - Implement monitoring to prevent recurrence

### 5.2 Misuse Response

**If PhishYou detects organizational misuse:**

1. **Immediate (1 hour):**
   - Halt all campaigns for that organization
   - Alert CISO / compliance officer

2. **Investigation (24 hours):**
   - Review audit logs
   - Determine type/extent of misuse
   - Document findings

3. **Resolution (48 hours):**
   - Organization provides remediation plan
   - PhishYou may:
     - Issue warning (first offense)
     - Require retraining (repeated misuse)
     - Suspend account (severe misuse)
     - Terminate relationship (egregious violations)

---

## 6. Third-Party Risk

### 6.1 Dependencies

**Alibaba Qwen LLM:**
- Risk: API availability, output quality
- Mitigation: Retry logic, fallback personas, local caching

**Alibaba Qwen TTS:**
- Risk: Voice synthesis quality, language support
- Mitigation: Quality testing, local caching, fallback to text

**Twilio SMS/WhatsApp:**
- Risk: API availability, message delivery
- Mitigation: Message queuing, retry logic, fallback to email

**Stable Diffusion (Image Generation):**
- Risk: Output quality, license compliance
- Mitigation: Template-based generation, manual review before deployment

### 6.2 Vendor Assessment

**Before partnering:**
- ✅ Verify SOC 2 Type II compliance
- ✅ Review data processing agreements
- ✅ Confirm data residency options
- ✅ Test API reliability (uptime SLA)
- ✅ Review incident response procedures

---

## 7. Security Testing

### 7.1 Penetration Testing

**Annual Red Team Assessment:**
- Attempt unauthorized access to admin dashboard
- Attempt to modify campaign data
- Attempt to export PII
- Test API authentication/authorization
- Test audit log integrity

### 7.2 Vulnerability Scanning

**Continuous Scanning:**
- OWASP Top 10 vulnerabilities
- Dependency scanning (outdated libraries)
- Infrastructure scanning (misconfigured cloud storage)
- Application scanning (SQL injection, XSS, CSRF)

### 7.3 Security Review

**Code Review:**
- All code changes reviewed by 2+ engineers
- Security-focused review checklist
- Cryptography review by specialist

---

## 8. Compliance Certifications

**Target Certifications:**
- ✅ SOC 2 Type II (annual audit)
- ✅ ISO 27001 (within 18 months)
- ✅ GDPR Data Processing (ongoing)
- ✅ CCPA Compliance (annual review)
- ✅ HIPAA BAA (for healthcare customers)

---

## 9. Security Guidelines for Deployment

### 9.1 Network Security

**PhishYou Deployment:**
- Run on private VPC (not publicly accessible)
- Use security groups to restrict access (admin IP range only)
- Enable WAF (Web Application Firewall) on load balancer
- DDoS protection (Alibaba Cloud DDoS mitigation)

### 9.2 Secrets Management

**Handling API Keys, Passwords:**
- Use environment variables (not hardcoded)
- Rotate credentials every 90 days
- Use temporary credentials (STS) when possible
- Store in encrypted secrets vault (AWS Secrets Manager / Alibaba KMS)

### 9.3 Monitoring & Alerting

**Real-Time Monitoring:**
- API error rates (alert if > 1%)
- Unauthorized access attempts (alert immediately)
- Unusual admin activities (alert on anomalies)
- Message delivery failures (alert if > 5%)
- Encryption key usage (audit all)

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
