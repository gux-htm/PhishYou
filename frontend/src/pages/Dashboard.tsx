import { ArrowUpRight, FolderPlus, Settings2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AgentComposer } from '../design/AgentComposer';
import { listConversations, type ConversationSummary } from '../services/campaignChat';

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<ConversationSummary[]>([]);

  useEffect(() => {
    void listConversations().then((result) => setCampaigns(result.conversations.slice(0, 3))).catch(() => setCampaigns([]));
  }, []);

  return (
    <div className="py-page py-dashboard">
      <section className="py-command-hero">
        <div className="py-command-copy">
          <p className="py-eyebrow">GOOD MORNING, OPERATOR</p>
          <h1 className="py-title">Where should the agent <span>focus?</span></h1>
          <p className="py-lede">Start a campaign conversation, import the context the agent needs, and instruct it when you are ready to execute the authorized simulation.</p>
        </div>
        <div className="py-command-meta"><span><Sparkles size={14} /> CAMPAIGN AGENT</span><span>CONNECTED WORKSPACE</span></div>
        <AgentComposer />
      </section>

      <section className="py-dashboard-section">
        <div className="py-section-heading"><div><p className="py-eyebrow">WORKSPACES</p><h2>Your campaigns</h2></div><Link to="/campaigns/new" className="py-primary py-small"><FolderPlus size={16} /> New campaign</Link></div>
        <div className="py-campaign-list">
          {campaigns.map((campaign, index) => <Link to={`/campaigns/${campaign.id}`} className="py-campaign-row" key={campaign.id}><span className="py-campaign-number">0{index + 1}</span><div><h3>{campaign.name}</h3><p>Conversation history · updated {new Date(campaign.updatedAt).toLocaleString()}</p></div><span className={`py-state ${campaign.status.toLowerCase()}`}>{campaign.status}</span><ArrowUpRight size={17}/></Link>)}
          {campaigns.length === 0 && <Link to="/campaigns" className="py-campaign-row"><div><h3>No campaigns yet</h3><p>Start a campaign from the AI composer above.</p></div><ArrowUpRight size={17}/></Link>}
        </div>
      </section>

      <section className="py-dashboard-section">
        <div className="py-section-heading"><div><p className="py-eyebrow">SYSTEM</p><h2>Agent configuration</h2></div></div>
        <div className="py-grid py-capability-grid">
          <Link to="/tool-settings" className="py-card"><Settings2 size={22}/><h3>Tool Settings</h3><p>Configure the three connectors the campaign agent can use: Database, LLM, and Email.</p><span>Configure →</span></Link>
          <Link to="/campaigns" className="py-card"><FolderPlus size={22}/><h3>Campaigns</h3><p>Open the persistent campaign conversation history and switch between agent workspaces.</p><span>Open campaigns →</span></Link>
        </div>
      </section>
    </div>
  );
}
