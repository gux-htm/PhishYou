import { ArrowUpRight, Bell, Bot, BrainCircuit, Mail, MessageCircle, MessageSquare, Phone, Sparkles, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

type ToolStatus = 'active' | 'configured' | 'pending';

type AgentTool = {
  id: string;
  name: string;
  description: string;
  status: ToolStatus;
  detail: string;
  Icon: typeof Mail;
};

const tools: AgentTool[] = [
  {
    id: 'ai-chat',
    name: 'AI Chat',
    description: 'Send live messages to the configured LLM provider and verify real responses. Conversation history stays in this session.',
    status: 'configured',
    detail: 'OpenAI-compatible / Qwen',
    Icon: MessageSquare,
  },
  {
    id: 'email-simulator',
    name: 'Email Simulator',
    description: 'Lures targets with adaptive email scenarios, rotating pretexts and sender personas tuned to the engagement surface.',
    status: 'active',
    detail: '4 personas · 12 active scenarios',
    Icon: Mail,
  },
  {
    id: 'sms-whatsapp',
    name: 'SMS / WhatsApp Adapter',
    description: 'Outbound message channel with carrier routing, deliverability tracking and conversation threading on mobile-first channels.',
    status: 'configured',
    detail: 'Ready · awaiting sender verification',
    Icon: MessageCircle,
  },
  {
    id: 'voice-synthesis',
    name: 'Voice Synthesis Engine',
    description: 'High-fidelity voice synthesis for vishing simulations, including consent gating, transcript capture and red-line review.',
    status: 'active',
    detail: 'ElevenLabs · 6 cloned personas',
    Icon: Phone,
  },
  {
    id: 'social-agent',
    name: 'Social Media Agent',
    description: 'Engages targets across LinkedIn and Instagram with measured outreach, persona-accurate tone and thread continuation.',
    status: 'configured',
    detail: 'LinkedIn + Instagram · rate-limited',
    Icon: Users,
  },
  {
    id: 'behavioral-analyzer',
    name: 'Behavioral Analyzer',
    description: 'Models target response patterns, resistance shifts and reporting latency to inform follow-up cadence and scoring.',
    status: 'active',
    detail: 'Streaming · 18ms decision loop',
    Icon: BrainCircuit,
  },
  {
    id: 'resistance-scorer',
    name: 'Resistance Scorer',
    description: 'Continuous score that blends click, report, and conversation signals into a single risk profile per target.',
    status: 'pending',
    detail: 'Not connected · needs data source',
    Icon: TrendingUp,
  },
];

const statusLabel: Record<ToolStatus, string> = {
  active: 'Active',
  configured: 'Configured',
  pending: 'Not connected',
};

const statusColor: Record<ToolStatus, string> = {
  active: 'var(--teal)',
  configured: 'var(--accent)',
  pending: 'var(--muted)',
};

export default function AgentTools() {
  return (
    <div className="py-page py-dashboard">
      <section className="py-command-hero">
        <div className="py-command-copy">
          <p className="py-eyebrow">AGENT TOOLKIT</p>
          <h1 className="py-title">
            Equip the agent for the <span>next simulation.</span>
          </h1>
          <p className="py-lede">
            Inspect, configure and audit every capability the PhishYou agent can use during a
            security engagement. Each tool is consent-gated, logged and scoped to your
            authorized workspace.
          </p>
        </div>
        <div className="py-command-meta">
          <span>
            <Sparkles size={14} /> 7 TOOLS REGISTERED
          </span>
          <span>Updated 4 minutes ago</span>
        </div>

        <div
          style={{
            marginTop: 28,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            className="py-primary py-small"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Bot size={16} /> Run capability check
          </button>
          <Link
            to="/settings/integrations"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid var(--line)',
              background: 'transparent',
              color: 'var(--soft)',
              padding: '12px 16px',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.04em',
            }}
          >
            <Bell size={15} /> Manage notifications
          </Link>
        </div>
      </section>

      <section className="py-dashboard-section">
        <div className="py-section-heading">
          <div>
            <p className="py-eyebrow">CAPABILITIES</p>
            <h2>Registered agent tools</h2>
          </div>
          <span
            style={{
              font: '500 9px DM Mono, monospace',
              letterSpacing: '0.16em',
              color: 'var(--muted)',
            }}
          >
            7 TOTAL · 4 ACTIVE
          </span>
        </div>

        <div
          className="py-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
        >
          {tools.map((tool) => {
            const Icon = tool.Icon;
            return (
              <article
                key={tool.id}
                className="py-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  minHeight: 240,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      display: 'grid',
                      placeItems: 'center',
                      border: '1px solid var(--line)',
                      background: 'var(--accent-soft)',
                      color: 'var(--accent)',
                      borderRadius: 12,
                    }}
                    aria-hidden="true"
                  >
                    <Icon size={20} />
                  </div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      font: '500 9px DM Mono, monospace',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: statusColor[tool.status],
                      border: `1px solid ${statusColor[tool.status]}`,
                      background: 'var(--bg-2)',
                      padding: '5px 8px',
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: statusColor[tool.status],
                      }}
                    />
                    {statusLabel[tool.status]}
                  </span>
                </div>

                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 16,
                      letterSpacing: '-0.02em',
                      color: 'var(--ink)',
                    }}
                  >
                    {tool.name}
                  </h3>
                  <p
                    style={{
                      margin: '8px 0 0',
                      color: 'var(--muted)',
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}
                  >
                    {tool.description}
                  </p>
                </div>

                <div
                  style={{
                    marginTop: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    paddingTop: 12,
                    borderTop: '1px solid var(--line)',
                  }}
                >
                  <span
                    style={{
                      font: '500 9px DM Mono, monospace',
                      letterSpacing: '0.12em',
                      color: 'var(--muted)',
                    }}
                  >
                    {tool.detail}
                  </span>
                  <Link
                    to={tool.id === 'ai-chat' ? '/tools/ai-chat' : '/settings/integrations'}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 800,
                      color: 'var(--ink)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {tool.id === 'ai-chat' ? 'Open chat' : 'Configure'} <ArrowUpRight size={14} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="py-dashboard-section">
        <div className="py-section-heading">
          <div>
            <p className="py-eyebrow">GUARDRAILS</p>
            <h2>How the agent uses these tools</h2>
          </div>
        </div>
        <div
          className="py-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
        >
          <article className="py-card">
            <Bot size={22} color="var(--accent)" />
            <h3>Consent-bound execution</h3>
            <p>
              Every tool call requires an active, time-boxed engagement and a signed
              authorization for the target surface.
            </p>
            <span>Policy enforced</span>
          </article>
          <article className="py-card">
            <Bell size={22} color="var(--accent)" />
            <h3>Auditable trail</h3>
            <p>
              Each invocation, prompt and response is captured for the audit log and the
              after-action report.
            </p>
            <span>Streaming to audit log</span>
          </article>
          <article className="py-card">
            <BrainCircuit size={22} color="var(--accent)" />
            <h3>Operator in the loop</h3>
            <p>
              High-impact actions pause for explicit operator approval before they reach a
              target.
            </p>
            <span>Approvals required</span>
          </article>
        </div>
      </section>
    </div>
  );
}
