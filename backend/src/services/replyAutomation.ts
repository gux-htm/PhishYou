import { databaseService } from './database.js';
import { handleInboundReply } from './campaignAgent.js';

/**
 * Bridges the existing IMAP reply persistence to the autonomous campaign agent.
 * The reply watcher remains responsible for mailbox polling/correlation; this
 * service only acts on replies that do not already have a matching agent reply.
 */
export async function processUnansweredReplies(): Promise<number> {
  let processed = 0;
  const campaigns = await databaseService.listCampaigns({ status: 'ACTIVE' });

  for (const campaign of campaigns) {
    const interactions = await databaseService.getInteractions(campaign.id);
    const replies = interactions.filter((interaction) => interaction.type === 'reply');

    for (const reply of replies) {
      const inboundMessageId = typeof reply.meta?.messageId === 'string' ? reply.meta.messageId : '';
      const alreadyAnswered = interactions.some((interaction) => {
        if (interaction.type !== 'agent_reply' || interaction.targetId !== reply.targetId) return false;
        return interaction.meta?.inReplyTo === inboundMessageId;
      });
      if (alreadyAnswered) continue;

      const body = typeof reply.meta?.body === 'string' ? reply.meta.body : '';
      if (!body || !inboundMessageId) continue;

      const result = await handleInboundReply(campaign.id, reply.targetId, {
        text: body,
        subject: typeof reply.meta?.subject === 'string' ? reply.meta.subject : undefined,
        messageId: inboundMessageId,
      });
      if (result) processed += 1;
    }
  }

  return processed;
}
