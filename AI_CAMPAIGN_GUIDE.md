# AI-Driven Campaign Creation & Contextual Email System

## Overview

PhishYou now includes a fully integrated AI-driven campaign creation system that allows the AI to:
- Understand campaign context through conversation
- Create campaigns automatically based on user input
- Generate personalized emails for each target
- Send emails to targets with contextual personalization
- Track campaign execution in real-time

## Features

### 1. AI Campaign Studio (Conversational Campaign Creation)
**Location:** `/campaigns/studio`

The AI Campaign Studio provides a conversational interface where you can:
- Describe your campaign objectives in natural language
- Upload context files (policies, briefs, personas)
- Let the AI guide you through campaign planning
- Automatically create campaigns from conversation

**How to use:**
1. Navigate to the AI Campaign Studio
2. Enter a campaign name
3. Provide custom instructions describing your campaign goals
4. (Optional) Upload context files for additional information
5. Click "Open agent" to start the conversation
6. Describe your campaign to the AI:
   - Target audience (departments, roles, names)
   - Campaign objectives
   - Organization context
   - Timing and urgency
7. The AI will extract information and create the campaign automatically
8. Once created, you'll see a "View & Launch Campaign" button

### 2. Enhanced AI Chat with Campaign Creation
**Location:** `/agent-tools/enhanced-chat`

Chat directly with the AI assistant to:
- Create campaigns through natural conversation
- Get help with campaign strategy
- Generate email templates
- Analyze campaign effectiveness

**Example prompts:**
- "Create a phishing awareness campaign for the engineering department"
- "I need to test password security training with 50 employees"
- "Generate emails for a CEO fraud simulation targeting finance team"

### 3. Real Email Preview & Sending
**Component:** `RealEmailPreview`

Features:
- AI-generated personalized email previews
- Edit subject and body before sending
- View AI's personalization reasoning
- Send test emails to individual targets
- Regenerate emails with different variations

### 4. Campaign Execution Service

The backend now includes automated campaign execution with:
- AI-powered email personalization per target
- Automatic email scheduling and sending
- Pause/resume capabilities
- Real-time status tracking
- Database persistence for all interactions

## API Endpoints

### Campaign Management

#### Create Campaign
```
POST /api/v1/campaigns/create
```
**Body:**
```json
{
  "name": "Campaign Name",
  "type": "Phishing Awareness",
  "tier": "B",
  "objective": "Test employee awareness",
  "organizationContext": "Tech company, 500 employees",
  "scenarioContext": "Password reset phishing",
  "timingContext": "Business hours",
  "senderConfig": {
    "fromName": "IT Department",
    "fromEmail": "it@company.com",
    "replyTo": "noreply@company.com"
  },
  "campaignConfig": {
    "urgencyLevel": "medium",
    "platforms": ["email"],
    "targetCount": 0,
    "batchSettings": {
      "batchSize": 10,
      "delayBetweenBatches": 5000,
      "delayBetweenEmails": 2000
    }
  },
  "targets": [
    {
      "id": "1",
      "name": "John Doe",
      "email": "john@company.com",
      "department": "Engineering",
      "role": "Software Engineer"
    }
  ]
}
```

#### Launch Campaign
```
POST /api/v1/campaigns/{id}/launch
```
Generates personalized emails for all targets and sends them automatically.

#### Get Campaign Status
```
GET /api/v1/campaigns/{id}/execution-status
```
Returns real-time execution status including emails sent, failed, etc.

#### Pause/Resume Campaign
```
POST /api/v1/campaigns/{id}/execution/pause
POST /api/v1/campaigns/{id}/execution/resume
```

#### Schedule Campaign
```
POST /api/v1/campaigns/{id}/schedule
```
**Body:**
```json
{
  "scheduledTime": "2024-12-25T09:00:00Z"
}
```

### Email Generation & Preview

#### Preview Campaign Emails
```
POST /api/v1/campaigns/preview
```
**Body:**
```json
{
  "targets": [/* array of targets */],
  "campaignContext": {
    "id": "camp-123",
    "name": "Q4 Awareness",
    "organizationContext": "Tech company",
    "campaignObjective": "Test awareness",
    "scenarioContext": "Password reset",
    "urgencyLevel": "medium",
    "sender": {
      "fromName": "IT Support",
      "fromEmail": "support@company.com"
    }
  },
  "sampleSize": 3
}
```

**Response:**
```json
{
  "success": true,
  "totalTargets": 10,
  "sampleSize": 3,
  "sampleEmails": [
    {
      "target": { /* target info */ },
      "subject": "Urgent: Password Reset Required",
      "body": "Hi John,\n\nOur security team...",
      "personalization": {
        "strategy": "Role-based targeting",
        "keyPoints": [
          "Emphasized technical aspects for engineer",
          "Used department-specific terminology"
        ]
      }
    }
  ],
  "canSend": true,
  "estimatedDuration": 25
}
```

#### Validate Campaign Configuration
```
POST /api/v1/campaigns/validate
```
Checks if AI, SMTP, and database are properly configured.

### AI Chat Integration

#### Send Chat Message
```
POST /api/v1/ai/chat
```
**Body:**
```json
{
  "message": "Create a campaign for engineering department",
  "history": []
}
```

#### Generate Campaign from AI Conversation
```
POST /api/v1/ai/generate-campaign
```
**Body:**
```json
{
  "conversationHistory": ["user: I need...", "assistant: ..."],
  "extractedContext": {
    "campaignName": "Engineering Awareness",
    "targetDepartment": "Engineering",
    "campaignType": "Phishing"
  }
}
```

## Configuration

### 1. Configure AI Provider
Navigate to Settings and configure your AI provider:
- **Gemini:** Requires API key from Google AI Studio
- **Qwen:** Requires Alibaba Cloud API credentials

### 2. Configure SMTP
Set up email sending in Settings:
- SMTP Host (e.g., smtp.gmail.com)
- SMTP Port (e.g., 587)
- Username & Password
- From Name & Email

### 3. Configure Database (Optional)
For campaign persistence, configure PostgreSQL or SQLite:
- PostgreSQL: Full-featured, recommended for production
- SQLite: Lightweight, good for testing

## Workflow Example

### Creating a Campaign with AI

1. **Start Conversation:**
   ```
   User: "I need to create a phishing awareness campaign for our sales team of 20 people"
   ```

2. **AI Gathers Context:**
   ```
   AI: "I'll help you create that campaign. Can you tell me:
        - What specific behavior are you testing?
        - What's the urgency level?
        - Do you have a specific scenario in mind?"
   ```

3. **User Provides Details:**
   ```
   User: "Test if they click on suspicious links. Medium urgency. 
          Use a fake invoice scenario."
   ```

4. **AI Creates Campaign:**
   The AI automatically creates a campaign with:
   - Campaign type: "Link Click Awareness"
   - Scenario: "Fake Invoice"
   - Tier: B (based on sophistication)
   - Pre-configured sender settings

5. **Generate & Send:**
   - AI generates personalized emails for each target
   - Emails are tailored based on role and department
   - Campaign can be launched immediately or scheduled

### Using the Campaign Studio

1. Open AI Campaign Studio
2. Name: "Q1 Security Training"
3. Instructions: "Test awareness of CEO fraud emails targeting finance team"
4. Upload context file (optional): employee_list.csv
5. Click "Open agent"
6. Chat with AI to refine campaign details
7. AI creates campaign automatically
8. Review and launch

## Database Schema

The system creates these tables automatically:

### campaigns
- Campaign metadata
- Status tracking
- Configuration settings

### targets
- Individual target information
- Department, role, contact info
- Status per campaign

### email_interactions
- Sent emails and content
- Tracking data (sent, opened, clicked)
- Personalization factors used

### campaign_events
- Audit log of all campaign actions
- Timeline of events
- User actions

## Best Practices

### 1. Campaign Planning
- Start with clear objectives
- Define your target audience precisely
- Provide organization context to improve personalization

### 2. Email Personalization
- Let AI generate initial drafts
- Review and edit before sending
- Use the regenerate feature for variations
- Test with small groups first

### 3. Execution
- Preview emails before launching
- Start with test sends to yourself
- Use scheduling for off-hours delivery
- Monitor execution status in real-time

### 4. Ethical Considerations
- Always obtain proper authorization
- Inform participants this is training
- Provide immediate feedback upon interaction
- Never use real credentials or sensitive data

## Troubleshooting

### Emails Not Generating
- Check AI configuration in Settings
- Verify API key is valid
- Check console for error messages

### Emails Not Sending
- Verify SMTP configuration
- Test SMTP connection in Settings
- Check email credentials
- Review spam filters

### Campaign Creation Fails
- Ensure all required fields are provided
- Check database configuration
- Verify proper authorization

### Database Errors
- Run database initialization: `POST /api/v1/campaigns/initialize-db`
- Check database credentials
- Verify database permissions

## Security Considerations

### API Security
- All campaign APIs require authentication
- Rate limiting on email sending
- Input validation on all endpoints

### Email Safety
- All emails tagged as simulation
- Headers identify as training
- No real credential collection
- Clear opt-out mechanisms

### Data Privacy
- Campaign data isolated per organization
- PII handled according to regulations
- Audit logging for compliance
- Secure credential storage

## Next Steps

1. **Configure Services:**
   - Set up AI provider (Gemini or Qwen)
   - Configure SMTP for email sending
   - Initialize database schema

2. **Test the System:**
   - Create a test campaign with yourself as target
   - Generate preview emails
   - Send test email to verify SMTP
   - Check database persistence

3. **Create Real Campaign:**
   - Use AI Campaign Studio for guided creation
   - Provide rich context for better personalization
   - Preview emails for multiple targets
   - Launch with proper authorization

4. **Monitor & Analyze:**
   - Track campaign execution status
   - Review email delivery rates
   - Analyze target interactions
   - Generate reports for stakeholders

## Support

For issues or questions:
- Check the troubleshooting section above
- Review API documentation
- Check browser console for errors
- Verify all configurations in Settings

---

**Version:** 2.0  
**Last Updated:** December 2024  
**Status:** Production Ready
