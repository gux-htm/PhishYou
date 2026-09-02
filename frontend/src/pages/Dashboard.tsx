import { ArrowUpRight, FolderPlus, PlugZap, Settings2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AgentComposer } from '../design/AgentComposer';

const campaigns = [
  ['Q3 Finance resilience', 'Planning', 'Context pack indexed'],
  ['Executive awareness exercise', 'Review', 'Plan awaiting approval'],
  ['New-hire readiness', 'Complete', 'Report available'],
];

export default function Dashboard() {
  return (
    <div className="py-page py-dashboard">
      {/* Command hero with live AI chat */}
      <section className="py-command-hero">
        <div className="py-command-copy">
          <p className="py-eyebrow">GOOD MORNING, OPERATOR</p>
          <h1 className="py-title">
            Where should the agent <span>focus?</span>
          </h1>
          <p className="py-lede">
            Start a campaign, continue an investigation, or ask PhishYou to help you understand
            your security program.
          </p>
        </div>
        <div className="py-command-meta">
          <span>
            <Sparkles size={14} /> CAMPAIGN-AWARE
          </span>
          <span>08:42 UTC</span>
        </div>
        <AgentComposer />
      </section>

      {/* Campaigns */}
      <section className="py-dashboard-section">
        <div className="py-section-heading">
          <div>
            <p className="py-eyebrow">WORKSPACES</p>
            <h2>Your campaigns</h2>
          </div>
          <Link to="/campaigns/new" className="py-primary py-small">
            <FolderPlus size={16} /> New campaign
          </Link>
        </div>
        <div className="py-campaign-list">
          {campaigns.map(([name, status, detail], i) => (
            <Link to={`/campaigns/${i + 1}`} className="py-campaign-row" key={name}>
              <span className="py-campaign-number">0{i + 1}</span>
              <div>
                <h3>{name}</h3>
                <p>{detail}</p>
              </div>
              <span className={`py-state ${status.toLowerCase()}`}>{status}</span>
              <ArrowUpRight size={17} />
            </Link>
          ))}
        </div>
      </section>

      {/* System */}
      <section className="py-dashboard-section">
        <div className="py-section-heading">
          <div>
            <p className="py-eyebrow">SYSTEM</p>
            <h2>Prepare the agent</h2>
          </div>
        </div>
        <div className="py-grid py-capability-grid">
          <Link to="/settings/integrations" className="py-card">
            <PlugZap size={22} />
            <h3>Connections</h3>
            <p>Manage approved channels and platform adapters the workspace can use.</p>
            <span>Configure →</span>
          </Link>
          <Link to="/settings" className="py-card">
            <Settings2 size={22} />
            <h3>Controls &amp; preferences</h3>
            <p>Adjust organization settings, appearance, notifications and governance.</p>
            <span>Open settings →</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
