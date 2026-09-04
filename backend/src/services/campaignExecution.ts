import { databaseService } from './database.js';
import { emailService } from './email.js';
import { AIProvider } from '../providers/types.js';
import { createProvider } from '../providers/factory.js';
import { mergeAIConfig } from '../config.js';
import { db } from '../store.js';

export interface CampaignExecutionStatus {
  campaignId: string;
  status: 'scheduled' | 'running' | 'paused' | 'completed' | 'failed';
  totalTargets: number;
  emailsSent: number;
  emailsFailed: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export class CampaignExecutionService {
  private db = databaseService;
  private emailSvc = emailService;
  private runningCampaigns: Map<string, NodeJS.Timeout> = new Map();
  private aiProvider: AIProvider | null = null;

  private async initAIProvider(): Promise<AIProvider> {
    if (!this.aiProvider) {
      const config = mergeAIConfig(db.data?.ai ?? {});
      this.aiProvider = createProvider(config);
    }
    return this.aiProvider;
  }

  /**
   * Start campaign execution
   */
  async startCampaign(campaignId: string): Promise<CampaignExecutionStatus> {
    try {
      const campaign = await this.db.getCampaign(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Update campaign status to running
      await this.db.updateCampaign(campaignId, {
        status: 'active',
        startedAt: new Date().toISOString()
      });

      // Get all targets for this campaign
      const targets = await this.db.getTargetsByCampaign(campaignId);

      console.log(`Starting campaign ${campaignId} with ${targets.length} targets`);

      // Execute campaign asynchronously
      this.executeCampaign(campaignId, targets).catch(error => {
        console.error(`Campaign ${campaignId} execution error:`, error);
        this.db.updateCampaign(campaignId, {
          status: 'failed',
          completedAt: new Date().toISOString()
        });
      });

      return {
        campaignId,
        status: 'running',
        totalTargets: targets.length,
        emailsSent: 0,
        emailsFailed: 0,
        startedAt: new Date()
      };
    } catch (error) {
      console.error('Error starting campaign:', error);
      throw error;
    }
  }

  /**
   * Execute campaign by sending emails to all targets
   */
  private async executeCampaign(campaignId: string, targets: any[]): Promise<void> {
    const campaign = await this.db.getCampaign(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    let emailsSent = 0;
    let emailsFailed = 0;

    const ai = await this.initAIProvider();

    for (const target of targets) {
      try {
        // Check if campaign is still active
        const currentCampaign = await this.db.getCampaign(campaignId);
        if (currentCampaign?.status !== 'active') {
          console.log(`Campaign ${campaignId} is no longer active, stopping execution`);
          break;
        }

        // Generate personalized email content using AI
        const emailContent = await this.generatePersonalizedEmail(
          ai,
          campaign,
          target
        );

        // Send the email
        const success = await this.sendCampaignEmail(
          target,
          emailContent,
          campaign
        );

        if (success) {
          emailsSent++;
          await this.db.updateTarget(target.id, {
            status: 'sent',
            sentAt: new Date().toISOString()
          });
        } else {
          emailsFailed++;
          await this.db.updateTarget(target.id, {
            status: 'failed'
          });
        }

        // Add delay between emails to avoid spam detection
        await this.delay(2000); // 2 second delay

      } catch (error) {
        console.error(`Error sending email to ${target.email}:`, error);
        emailsFailed++;
        await this.db.updateTarget(target.id, {
          status: 'failed'
        });
      }
    }

    // Mark campaign as completed
    await this.db.updateCampaign(campaignId, {
      status: 'completed',
      completedAt: new Date().toISOString()
    });

    console.log(`Campaign ${campaignId} completed: ${emailsSent} sent, ${emailsFailed} failed`);
  }

  /**
   * Generate personalized email content using AI
   */
  private async generatePersonalizedEmail(
    ai: AIProvider,
    campaign: any,
    target: any
  ): Promise<{ subject: string; body: string }> {
    // If email content already exists for this target, use it
    if (target.emailSubject && target.emailBody) {
      return {
        subject: target.emailSubject,
        body: target.emailBody
      };
    }

    // Generate personalized content using AI
    const prompt = `
Generate a personalized phishing simulation email for the following context:

Campaign: ${campaign.name}
Campaign Type: ${campaign.type || 'generic'}
Campaign Description: ${campaign.description || ''}

Target Information:
- Name: ${target.firstName} ${target.lastName}
- Email: ${target.email}
- Department: ${target.department || 'Unknown'}
- Position: ${target.position || 'Unknown'}

Requirements:
1. Create a realistic subject line that would catch attention
2. Write a professional email body that is personalized for this specific target
3. Include appropriate context based on their department and position
4. Make it relevant to their likely work responsibilities
5. The email should be for training purposes to test phishing awareness

Return the response in the following JSON format:
{
  "subject": "email subject here",
  "body": "email body here"
}
`;

    try {
      const chatResponse = await ai.chat([{ role: 'user', content: prompt }]);
      const response = chatResponse.content;

      // Try to parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          subject: parsed.subject || `Important: ${campaign.name}`,
          body: parsed.body || response
        };
      }

      // Fallback: use the full response as body
      return {
        subject: `Important: ${campaign.name}`,
        body: response
      };
    } catch (error) {
      console.error('Error generating email with AI:', error);
      
      // Fallback template
      return {
        subject: `Important Notice - ${campaign.name}`,
        body: `Dear ${target.firstName} ${target.lastName},\n\nThis is a simulated phishing email as part of our security awareness training program.\n\n${campaign.description}\n\nPlease be vigilant and report suspicious emails.\n\nBest regards,\nSecurity Team`
      };
    }
  }

  /**
   * Send campaign email to a target
   */
  private async sendCampaignEmail(
    target: any,
    emailContent: { subject: string; body: string },
    campaign: any
  ): Promise<boolean> {
    try {
      const result = await this.emailSvc.sendEmail({
        to: target.email,
        subject: emailContent.subject,
        text: emailContent.body,
        html: this.convertToHtml(emailContent.body)
      });

      return result.success;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Convert plain text to basic HTML
   */
  private convertToHtml(text: string): string {
    return text
      .split('\n')
      .map(line => `<p>${line}</p>`)
      .join('');
  }

  /**
   * Pause campaign execution
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    await this.db.updateCampaign(campaignId, {
      status: 'paused'
    });
  }

  /**
   * Resume campaign execution
   */
  async resumeCampaign(campaignId: string): Promise<void> {
    const campaign = await this.db.getCampaign(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get remaining targets (not sent)
    const allTargets = await this.db.getTargetsByCampaign(campaignId);
    const remainingTargets = allTargets.filter((t: any) => t.status !== 'sent');

    if (remainingTargets.length === 0) {
      await this.db.updateCampaign(campaignId, {
        status: 'completed'
      });
      return;
    }

    await this.db.updateCampaign(campaignId, {
      status: 'active'
    });

    // Resume execution
    this.executeCampaign(campaignId, remainingTargets).catch(error => {
      console.error(`Campaign ${campaignId} execution error:`, error);
    });
  }

  /**
   * Stop campaign execution
   */
  async stopCampaign(campaignId: string): Promise<void> {
    await this.db.updateCampaign(campaignId, {
      status: 'completed',
      completedAt: new Date().toISOString()
    });
  }

  /**
   * Get campaign execution status
   */
  async getCampaignStatus(campaignId: string): Promise<CampaignExecutionStatus> {
    const campaign = await this.db.getCampaign(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const targets = await this.db.getTargetsByCampaign(campaignId);
    const emailsSent = targets.filter((t: any) => t.status === 'sent').length;
    const emailsFailed = targets.filter((t: any) => t.status === 'failed').length;

    return {
      campaignId,
      status: campaign.status === 'active' ? 'running' : 
              campaign.status === 'paused' ? 'paused' :
              campaign.status === 'completed' ? 'completed' :
              campaign.status === 'draft' ? 'scheduled' : 'failed',
      totalTargets: targets.length,
      emailsSent,
      emailsFailed,
      startedAt: campaign.startedAt ? new Date(campaign.startedAt) : undefined,
      completedAt: campaign.completedAt ? new Date(campaign.completedAt) : undefined
    };
  }

  /**
   * Schedule campaign for future execution
   */
  async scheduleCampaign(campaignId: string, scheduledTime: Date): Promise<void> {
    const delay = scheduledTime.getTime() - Date.now();
    
    if (delay <= 0) {
      // If time is in the past or now, start immediately
      await this.startCampaign(campaignId);
      return;
    }

    // Schedule for future execution
    const timeout = setTimeout(() => {
      this.startCampaign(campaignId).catch(error => {
        console.error(`Scheduled campaign ${campaignId} failed to start:`, error);
      });
      this.runningCampaigns.delete(campaignId);
    }, delay);

    this.runningCampaigns.set(campaignId, timeout);

    await this.db.updateCampaign(campaignId, {
      scheduledAt: scheduledTime.toISOString()
    });
  }

  /**
   * Cancel scheduled campaign
   */
  async cancelScheduledCampaign(campaignId: string): Promise<void> {
    const timeout = this.runningCampaigns.get(campaignId);
    if (timeout) {
      clearTimeout(timeout);
      this.runningCampaigns.delete(campaignId);
    }

    await this.db.updateCampaign(campaignId, {
      scheduledAt: null
    });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    // Clear all scheduled timeouts
    for (const timeout of this.runningCampaigns.values()) {
      clearTimeout(timeout);
    }
    this.runningCampaigns.clear();
  }
}
