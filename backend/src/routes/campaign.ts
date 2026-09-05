import { Router } from 'express';
import { 
  campaignEmailService, 
  type CampaignTarget, 
  type CampaignContext 
} from '../services/campaignEmail.js';
import { 
  campaignPersistenceService,
  type StoredCampaign 
} from '../services/campaignPersistence.js';
import { emailService } from '../services/email.js';
import { isAIConfigured, mergeAIConfig } from '../config.js';
import { db } from '../store.js';

export const campaignRouter = Router();

// Generate personalized email for a single target
campaignRouter.post('/generate-email', async (req, res) => {
  try {
    const config = mergeAIConfig(db.data?.ai ?? {});
    if (!isAIConfigured(config)) {
      return res.status(400).json({ error: 'AI is not configured' });
    }

    if (!emailService.isConfigured()) {
      return res.status(400).json({ error: 'SMTP is not configured' });
    }

    const { target, campaignContext } = req.body as {
      target: CampaignTarget;
      campaignContext: CampaignContext;
    };

    if (!target || !campaignContext) {
      return res.status(400).json({ error: 'target and campaignContext are required' });
    }

    const personalizedEmail = await campaignEmailService.generatePersonalizedEmail(
      target, 
      campaignContext
    );

    res.json({
      success: true,
      personalizedEmail,
    });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate personalized email'
    });
  }
});

// Generate personalized emails for multiple targets
campaignRouter.post('/generate-bulk-emails', async (req, res) => {
  try {
    const config = mergeAIConfig(db.data?.ai ?? {});
    if (!isAIConfigured(config)) {
      return res.status(400).json({ error: 'AI is not configured' });
    }

    const { targets, campaignContext } = req.body as {
      targets: CampaignTarget[];
      campaignContext: CampaignContext;
    };

    if (!targets || !Array.isArray(targets) || targets.length === 0) {
      return res.status(400).json({ error: 'targets array is required and must not be empty' });
    }

    if (!campaignContext) {
      return res.status(400).json({ error: 'campaignContext is required' });
    }

    const personalizedEmails = await campaignEmailService.generateBulkPersonalizedEmails(
      targets, 
      campaignContext
    );

    res.json({
      success: true,
      totalTargets: targets.length,
      generatedEmails: personalizedEmails.length,
      personalizedEmails,
    });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate bulk personalized emails'
    });
  }
});

// Send a single campaign email
campaignRouter.post('/send-email', async (req, res) => {
  try {
    if (!emailService.isConfigured()) {
      return res.status(400).json({ error: 'SMTP is not configured' });
    }

    const { personalizedEmail, campaignContext } = req.body as {
      personalizedEmail: any;
      campaignContext: CampaignContext;
    };

    if (!personalizedEmail || !campaignContext) {
      return res.status(400).json({ error: 'personalizedEmail and campaignContext are required' });
    }

    const result = await campaignEmailService.sendCampaignEmail(
      personalizedEmail,
      campaignContext
    );

    res.json({
      success: result.success,
      result,
    });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to send campaign email'
    });
  }
});

// Send campaign emails to multiple targets
campaignRouter.post('/send-campaign', async (req, res) => {
  try {
    if (!emailService.isConfigured()) {
      return res.status(400).json({ error: 'SMTP is not configured' });
    }

    const { personalizedEmails, campaignContext, options } = req.body as {
      personalizedEmails: any[];
      campaignContext: CampaignContext;
      options?: {
        batchSize?: number;
        delayBetweenBatches?: number;
        delayBetweenEmails?: number;
      };
    };

    if (!personalizedEmails || !Array.isArray(personalizedEmails) || personalizedEmails.length === 0) {
      return res.status(400).json({ error: 'personalizedEmails array is required and must not be empty' });
    }

    if (!campaignContext) {
      return res.status(400).json({ error: 'campaignContext is required' });
    }

    const results = await campaignEmailService.sendCampaignEmails(
      personalizedEmails,
      campaignContext,
      options
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    res.json({
      success: failed === 0,
      totalEmails: results.length,
      successful,
      failed,
      successRate: results.length > 0 ? successful / results.length : 0,
      results,
    });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to send campaign emails'
    });
  }
});

// Generate and send complete campaign (all-in-one endpoint)
campaignRouter.post('/execute', async (req, res) => {
  try {
    const config = mergeAIConfig(db.data?.ai ?? {});
    if (!isAIConfigured(config)) {
      return res.status(400).json({ error: 'AI is not configured' });
    }

    if (!emailService.isConfigured()) {
      return res.status(400).json({ error: 'SMTP is not configured' });
    }

    const { targets, campaignContext, options } = req.body as {
      targets: CampaignTarget[];
      campaignContext: CampaignContext;
      options?: {
        generateAll?: boolean;
        batchSize?: number;
        delayBetweenBatches?: number;
        delayBetweenEmails?: number;
      };
    };

    if (!targets || !Array.isArray(targets) || targets.length === 0) {
      return res.status(400).json({ error: 'targets array is required and must not be empty' });
    }

    if (!campaignContext) {
      return res.status(400).json({ error: 'campaignContext is required' });
    }

    // Validate targets
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      if (!target.id || !target.name || !target.email || !target.role) {
        return res.status(400).json({
          error: `Target ${i + 1}: Missing required fields (id, name, email, role)`
        });
      }
    }

    const result = await campaignEmailService.generateAndSendCampaign(
      targets,
      campaignContext,
      options
    );

    res.json({
      success: result.summary.failed === 0,
      campaignId: campaignContext.id,
      ...result,
    });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to execute campaign'
    });
  }
});

// Get campaign status/preview without sending
campaignRouter.post('/preview', async (req, res) => {
  try {
    const config = mergeAIConfig(db.data?.ai ?? {});
    if (!isAIConfigured(config)) {
      return res.status(400).json({ error: 'AI is not configured' });
    }

    const { targets, campaignContext, sampleSize = 3 } = req.body as {
      targets: CampaignTarget[];
      campaignContext: CampaignContext;
      sampleSize?: number;
    };

    if (!targets || !Array.isArray(targets) || targets.length === 0) {
      return res.status(400).json({ error: 'targets array is required and must not be empty' });
    }

    if (!campaignContext) {
      return res.status(400).json({ error: 'campaignContext is required' });
    }

    // Generate emails for a sample of targets for preview
    const sampleTargets = targets.slice(0, Math.min(sampleSize, targets.length));
    const sampleEmails = await campaignEmailService.generateBulkPersonalizedEmails(
      sampleTargets,
      campaignContext
    );

    res.json({
      success: true,
      campaignContext,
      totalTargets: targets.length,
      sampleSize: sampleEmails.length,
      sampleEmails,
      canSend: emailService.isConfigured(),
      estimatedDuration: Math.ceil(targets.length * 2.5), // Rough estimate in seconds
    });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate campaign preview'
    });
  }
});

// Validate campaign configuration
campaignRouter.post('/validate', (req, res) => {
  const { targets, campaignContext } = req.body as {
    targets: CampaignTarget[];
    campaignContext: CampaignContext;
  };

  const errors: string[] = [];

  // Check AI configuration
  const aiConfig = mergeAIConfig(db.data?.ai ?? {});
  if (!isAIConfigured(aiConfig)) {
    errors.push('AI is not configured - configure LLM provider in Settings');
  }

  // Check SMTP configuration
  if (!emailService.isConfigured()) {
    errors.push('SMTP is not configured - configure email settings in Settings');
  }

  // Check Database configuration
  if (!campaignPersistenceService.isConfigured()) {
    errors.push('Database is not configured - configure database settings in Settings');
  }

  // Validate targets
  if (!targets || !Array.isArray(targets) || targets.length === 0) {
    errors.push('At least one target is required');
  } else {
    targets.forEach((target, index) => {
      if (!target.id) errors.push(`Target ${index + 1}: Missing ID`);
      if (!target.name) errors.push(`Target ${index + 1}: Missing name`);
      if (!target.email) errors.push(`Target ${index + 1}: Missing email`);
      if (!target.role) errors.push(`Target ${index + 1}: Missing role`);
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (target.email && !emailRegex.test(target.email)) {
        errors.push(`Target ${index + 1}: Invalid email format`);
      }
    });
  }

  // Validate campaign context
  if (!campaignContext) {
    errors.push('Campaign context is required');
  } else {
    if (!campaignContext.id) errors.push('Campaign ID is required');
    if (!campaignContext.name) errors.push('Campaign name is required');
    if (!campaignContext.organizationContext) errors.push('Organization context is required');
    if (!campaignContext.campaignObjective) errors.push('Campaign objective is required');
    if (!campaignContext.sender?.fromName) errors.push('Sender from name is required');
    if (!campaignContext.sender?.fromEmail) errors.push('Sender from email is required');
  }

  res.json({
    valid: errors.length === 0,
    errors,
    aiConfigured: isAIConfigured(aiConfig),
    smtpConfigured: emailService.isConfigured(),
    dbConfigured: campaignPersistenceService.isConfigured(),
  });
});

// Initialize database schema
campaignRouter.post('/initialize-db', async (_req, res) => {
  try {
    if (!campaignPersistenceService.isConfigured()) {
      return res.status(400).json({ error: 'Database is not configured' });
    }

    await campaignPersistenceService.initialize();
    
    res.json({
      success: true,
      message: 'Database schema initialized successfully'
    });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to initialize database schema'
    });
  }
});

// Create a new campaign
campaignRouter.post('/create', async (req, res) => {
  try {
    if (!campaignPersistenceService.isConfigured()) {
      return res.status(400).json({ error: 'Database is not configured' });
    }

    const {
      name,
      type,
      tier,
      objective,
      organizationContext,
      scenarioContext,
      timingContext,
      senderConfig,
      campaignConfig,
      targets,
      createdBy
    } = req.body as {
      name: string;
      type: string;
      tier: 'A' | 'B' | 'C';
      objective: string;
      organizationContext: string;
      scenarioContext: string;
      timingContext: string;
      senderConfig: StoredCampaign['senderConfig'];
      campaignConfig: StoredCampaign['campaignConfig'];
      targets?: CampaignTarget[];
      createdBy?: string;
    };

    // Create campaign
    const campaign = await campaignPersistenceService.createCampaign({
      name,
      type,
      tier,
      objective,
      organizationContext,
      scenarioContext,
      timingContext,
      senderConfig,
      campaignConfig,
      createdBy,
    });

    // Add targets if provided
    if (targets && targets.length > 0) {
      await campaignPersistenceService.addTargetsToCampaign(campaign.id, targets);
    }

    // Log creation event
    await campaignPersistenceService.logCampaignEvent(
      campaign.id,
      undefined,
      'CAMPAIGN_CREATED',
      { createdBy, targetCount: targets?.length || 0 }
    );

    res.json({
      success: true,
      campaign,
    });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create campaign'
    });
  }
});

// Get campaign details
campaignRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const campaign = await campaignPersistenceService.getCampaign(id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const targets = await campaignPersistenceService.getCampaignTargets(id);
    const analytics = await campaignPersistenceService.getCampaignAnalytics(id);

    res.json({
      campaign,
      targets,
      analytics,
    });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get campaign'
    });
  }
});

// List campaigns
campaignRouter.get('/', async (req, res) => {
  try {
    const { status, createdBy } = req.query as { status?: string; createdBy?: string };
    
    const campaigns = await campaignPersistenceService.getCampaigns({ status, createdBy });

    res.json({
      campaigns,
      total: campaigns.length,
    });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to list campaigns'
    });
  }
});

// Launch campaign (start execution)
campaignRouter.post('/:id/launch', async (req, res) => {
  try {
    const { id } = req.params;
    
    const campaign = await campaignPersistenceService.getCampaign(id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Campaign must be in DRAFT status to launch' });
    }

    // Get targets
    const targets = await campaignPersistenceService.getCampaignTargets(id);
    if (targets.length === 0) {
      return res.status(400).json({ error: 'Campaign must have targets to launch' });
    }

    // Update status to ACTIVE
    await campaignPersistenceService.updateCampaignStatus(id, 'ACTIVE');

    // Convert to campaign context
    const campaignContext: CampaignContext = {
      id: campaign.id,
      name: campaign.name,
      organizationContext: campaign.organizationContext,
      campaignObjective: campaign.objective,
      scenarioContext: campaign.scenarioContext,
      urgencyLevel: campaign.campaignConfig.urgencyLevel,
      sender: campaign.senderConfig,
    };

    // Convert targets
    const campaignTargets: CampaignTarget[] = targets.map(t => ({
      id: t.id,
      name: t.name,
      email: t.email,
      department: t.department,
      role: t.role,
      personalContext: t.personalContext,
    }));

    // Execute the campaign
    const result = await campaignEmailService.generateAndSendCampaign(
      campaignTargets,
      campaignContext,
      campaign.campaignConfig.batchSettings
    );

    // Record all email interactions in database
    for (let i = 0; i < result.personalizedEmails.length; i++) {
      const email = result.personalizedEmails[i];
      const emailResult = result.results[i];
      
      if (emailResult) {
        await campaignPersistenceService.recordEmailSent(
          id,
          email.target.id,
          email,
          emailResult
        );
      }
    }

    // Update campaign status based on results
    if (result.summary.failed === 0) {
      // All emails sent successfully, keep as ACTIVE
    } else if (result.summary.successful === 0) {
      // No emails sent, mark as failed
      await campaignPersistenceService.updateCampaignStatus(id, 'CANCELLED');
    }

    res.json({
      success: true,
      campaign: await campaignPersistenceService.getCampaign(id),
      execution: result,
    });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to launch campaign'
    });
  }
});

// Pause/Resume campaign
campaignRouter.post('/:id/pause', async (req, res) => {
  try {
    const { id } = req.params;
    
    await campaignPersistenceService.updateCampaignStatus(id, 'PAUSED');
    
    res.json({
      success: true,
      message: 'Campaign paused'
    });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to pause campaign'
    });
  }
});

campaignRouter.post('/:id/resume', async (req, res) => {
  try {
    const { id } = req.params;
    
    await campaignPersistenceService.updateCampaignStatus(id, 'ACTIVE');
    
    res.json({
      success: true,
      message: 'Campaign resumed'
    });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to resume campaign'
    });
  }
});

// Complete campaign
campaignRouter.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    
    await campaignPersistenceService.updateCampaignStatus(id, 'COMPLETED');
    
    res.json({
      success: true,
      message: 'Campaign completed'
    });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to complete campaign'
    });
  }
});


// ==================== Campaign Execution Service Routes ====================

import { CampaignExecutionService } from '../services/campaignExecution.js';

const executionService = new CampaignExecutionService();

// Start campaign execution with AI-generated personalized emails
campaignRouter.post('/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;
    
    const status = await executionService.startCampaign(id);
    
    res.json({
      success: true,
      status,
    });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to start campaign execution'
    });
  }
});

// Get campaign execution status
campaignRouter.get('/:id/execution-status', async (req, res) => {
  try {
    const { id } = req.params;
    
    const status = await executionService.getCampaignStatus(id);
    
    res.json({
      success: true,
      status,
    });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get campaign execution status'
    });
  }
});

// Pause campaign execution
campaignRouter.post('/:id/execution/pause', async (req, res) => {
  try {
    const { id } = req.params;
    
    await executionService.pauseCampaign(id);
    
    res.json({
      success: true,
      message: 'Campaign execution paused'
    });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to pause campaign execution'
    });
  }
});

// Resume campaign execution
campaignRouter.post('/:id/execution/resume', async (req, res) => {
  try {
    const { id } = req.params;
    
    await executionService.resumeCampaign(id);
    
    res.json({
      success: true,
      message: 'Campaign execution resumed'
    });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to resume campaign execution'
    });
  }
});

// Stop campaign execution
campaignRouter.post('/:id/execution/stop', async (req, res) => {
  try {
    const { id } = req.params;
    
    await executionService.stopCampaign(id);
    
    res.json({
      success: true,
      message: 'Campaign execution stopped'
    });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to stop campaign execution'
    });
  }
});

// Schedule campaign for future execution
campaignRouter.post('/:id/schedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledTime } = req.body as { scheduledTime: string };
    
    if (!scheduledTime) {
      return res.status(400).json({ error: 'scheduledTime is required' });
    }

    const scheduledDate = new Date(scheduledTime);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ error: 'Invalid scheduledTime format' });
    }

    await executionService.scheduleCampaign(id, scheduledDate);
    
    res.json({
      success: true,
      message: `Campaign scheduled for ${scheduledDate.toISOString()}`
    });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to schedule campaign'
    });
  }
});

// Cancel scheduled campaign
campaignRouter.post('/:id/schedule/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    
    await executionService.cancelScheduledCampaign(id);
    
    res.json({
      success: true,
      message: 'Campaign schedule cancelled'
    });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to cancel campaign schedule'
    });
  }
});
