import { ArrowUpRight, FolderPlus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { listConversations, type ConversationSummary } from '../services/campaignChat';

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState<ConversationSummary[]>([]);

  useEffect(() => {
    void listConversations().then((result) => setCampaigns(result.conversations)).catch(() => setCampaigns([]));
  }, []);

  return (
    <div className="py-page py-dashboard">
      <section className="py-command-hero">
        <div className="py-command-copy"><p className="py-eyebrow">CAMPAIGNS</p><h1 className="py-title">Your <span>agent conversations.</span></h1><p className="py-lede">Each campaign is a persistent workspace. Open one to continue the conversation, import context, or instruct the agent to execute.</p></div>
        <div className="py-command-meta"><span><Sparkles size={14}/> {campaigns.length} CAMPAIGNS</span><span>{campaigns.filter((campaign) => campaign.status === 'ACTIVE').length} ACTIVE</span></div>
      </section>
      <section className="py-dashboard-section">
        <div className="py-section-heading"><div><p className="py-eyebrow">ALL CAMPAIGNS</p><h2>Conversation history</h2></div><Link to="/campaigns/new" className="py-primary py-small"><FolderPlus size={16}/> New campaign</Link></div>
        <div className="py-campaign-list">
          {campaigns.map((campaign, index) => <Link to={`/campaigns/${campaign.id}`} className="py-campaign-row" key={campaign.id}><span className="py-campaign-number">{String(index + 1).padStart(2, '0')}</span><div><h3>{campaign.name}</h3><p>{campaign.status} · {new Date(campaign.updatedAt).toLocaleString()}</p></div><span className={`py-state ${campaign.status.toLowerCase()}`}>{campaign.status}</span><ArrowUpRight size={17}/></Link>)}
          {campaigns.length === 0 && <div className="py-campaign-row"><div><h3>No campaign conversations yet</h3><p>Use the Command composer to start one.</p></div></div>}
        </div>
      </section>
    </div>
  );
}
