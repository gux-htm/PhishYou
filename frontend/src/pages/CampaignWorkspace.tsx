import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Activity, Bot, BrainCircuit, CheckCircle2, ChevronRight, FileText, MessageCircle, Pause, Play, ShieldCheck, Sparkles, Waypoints } from 'lucide-react';

const trace = [
  { time: '09:42:11', title: 'Context indexed', text: 'Approved exercise brief and policy constraints loaded into the campaign workspace.', state: 'done' },
  { time: '09:42:14', title: 'Scope check', text: 'Channels and target cohort validated against the campaign guardrails.', state: 'done' },
  { time: '09:42:21', title: 'Plan generation', text: 'Agent is drafting branches and stop conditions for operator review.', state: 'active' },
  { time: '—', title: 'Simulation execution', text: 'Starts only after approval. Live events remain observable and auditable.', state: 'queued' },
];

const conversations = [
  { name: 'Participant A', channel: 'Approved chat simulator', status: 'Active', preview: 'The simulation adapter is waiting for the next approved branch…' },
  { name: 'Participant B', channel: 'Email simulator', status: 'Review', preview: 'Agent requested an operator decision before continuing.' },
  { name: 'Participant C', channel: 'Training sandbox', status: 'Complete', preview: 'Debrief queued after the exercise outcome was recorded.' },
];

export default function CampaignWorkspace() {
  const { id = 'demo-workspace' } = useParams();
  const [tab, setTab] = useState<'overview' | 'agent' | 'conversations'>('overview');
  const [running, setRunning] = useState(true);

  const mainStyle: React.CSSProperties = {
    background: 'var(--bg)',
    color: 'var(--ink)',
  };

  const headerStyle: React.CSSProperties = {
    background: 'color-mix(in srgb, var(--surface) 90%, transparent)',
    border: '1px solid var(--line)',
  };

  return (
    <main
      className="relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-8"
      style={mainStyle}
    >
      <div className="pointer-events-none absolute inset-0 py-grid-signal opacity-45" />
      <div
        className="pointer-events-none absolute right-[-10rem] top-[-14rem] h-[36rem] w-[36rem] rounded-full blur-[130px]"
        style={{ background: 'color-mix(in srgb, var(--accent) 5.5%, transparent)' }}
      />
      <div className="relative mx-auto max-w-[1540px]">
        <header
          className="px-5 py-5 backdrop-blur-xl sm:px-6"
          style={headerStyle}
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div
                className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.2em]"
                style={{ color: 'var(--accent)' }}
              >
                <span
                  className={`h-2 w-2 rounded-full ${running ? 'py-status-dot' : ''}`}
                  style={{
                    background: running ? 'var(--accent)' : 'var(--muted)',
                  }}
                />
                Campaign intelligence / {id}
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-[-.05em] sm:text-4xl">
                Q3 verification awareness exercise
              </h1>
              <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
                One campaign. One context. One observable agent workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div
                className="px-4 py-2 text-xs"
                style={{
                  border: '1px solid color-mix(in srgb, var(--teal) 35%, transparent)',
                  background: 'color-mix(in srgb, var(--teal) 8%, transparent)',
                }}
              >
                <span
                  className="font-mono text-[9px] uppercase tracking-[.16em]"
                  style={{ color: 'var(--teal)' }}
                >
                  Safety
                </span>
                <div className="mt-1 font-semibold">Scope locked</div>
              </div>
              <button
                onClick={() => setRunning((value) => !value)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-[.12em]"
                style={{
                  border: '1px solid color-mix(in srgb, var(--accent) 60%, transparent)',
                  background: 'var(--accent)',
                  color: 'var(--bg)',
                }}
              >
                {running ? (
                  <>
                    <Pause className="h-4 w-4" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" /> Resume
                  </>
                )}
              </button>
            </div>
          </div>
          <nav
            className="mt-6 flex gap-1 overflow-x-auto pt-4"
            style={{ borderTop: '1px solid var(--line)' }}
          >
            {(
              [
                ['overview', 'Overview'],
                ['agent', 'Agent trace'],
                ['conversations', 'Conversations'],
              ] as const
            ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setTab(value)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-[.12em] transition"
                  style={
                    tab === value
                      ? {
                          border: '1px solid color-mix(in srgb, var(--accent) 50%, transparent)',
                          background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                          color: 'var(--accent)',
                        }
                      : { color: 'var(--muted)' }
                  }
                >
                  {label}
                </button>
              ),
            )}
          </nav>
        </header>

        {tab === 'overview' && (
          <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
            <section className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(
                  [
                    ['Campaign state', running ? 'ACTIVE' : 'PAUSED', Activity],
                    ['Participants', '12', ShieldCheck],
                    ['Agent branches', '08', BrainCircuit],
                    ['Signals reviewed', '47', Sparkles],
                  ] as const
                ).map(([label, value, Icon]) => {
                  const I = Icon as typeof Activity;
                  return (
                    <article
                      key={label as string}
                      className="py-command-card p-5"
                      style={{ border: '1px solid var(--line)' }}
                    >
                      <I className="h-5 w-5" style={{ color: 'var(--accent)' }} />
                      <div className="mt-5 text-3xl font-black tracking-[-.05em]">{value as string}</div>
                      <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                        {label as string}
                      </div>
                    </article>
                  );
                })}
              </div>
              <section className="py-command-card p-5 sm:p-6" style={{ border: '1px solid var(--line)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div
                      className="font-mono text-[9px] uppercase tracking-[.18em]"
                      style={{ color: 'var(--accent)' }}
                    >
                      Agent plan
                    </div>
                    <h2 className="mt-1 text-xl font-bold">Decision path, not a black box.</h2>
                  </div>
                  <Waypoints className="h-5 w-5" style={{ color: 'var(--teal)' }} />
                </div>
                <div className="mt-6 grid gap-3 md:grid-cols-4">
                  {['Context → scope', 'Question → plan', 'Review → approve', 'Observe → debrief'].map(
                    (item, index) => (
                      <div
                        key={item}
                        className="relative p-4"
                        style={{
                          border: '1px solid var(--line)',
                          background: 'var(--surface-2)',
                        }}
                      >
                        <span
                          className="font-mono text-[9px]"
                          style={{ color: 'var(--accent)' }}
                        >
                          0{index + 1}
                        </span>
                        <p className="mt-5 text-sm font-semibold">{item}</p>
                        {index < 3 && (
                          <ChevronRight
                            className="absolute -right-3 top-1/2 hidden h-5 w-5 md:block"
                            style={{ color: 'var(--accent)' }}
                          />
                        )}
                      </div>
                    ),
                  )}
                </div>
                <button
                  onClick={() => setTab('agent')}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
                  style={{ color: 'var(--teal)' }}
                >
                  Inspect agent trace <ArrowIcon />
                </button>
              </section>
              <section className="py-command-card p-5 sm:p-6" style={{ border: '1px solid var(--line)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div
                      className="font-mono text-[9px] uppercase tracking-[.18em]"
                      style={{ color: 'var(--muted)' }}
                    >
                      Campaign conversations
                    </div>
                    <h2 className="mt-1 text-xl font-bold">Live simulation surfaces</h2>
                  </div>
                  <MessageCircle className="h-5 w-5" style={{ color: 'var(--accent)' }} />
                </div>
                <div
                  className="mt-5 divide-y"
                  style={{
                    borderTop: '1px solid var(--line)',
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.name}
                      onClick={() => setTab('conversations')}
                      className="flex w-full items-center gap-4 px-1 py-4 text-left transition"
                      style={{ borderColor: 'var(--line)' }}
                    >
                      <span
                        className="flex h-9 w-9 items-center justify-center"
                        style={{ border: '1px solid var(--line)', color: 'var(--soft)' }}
                      >
                        <Bot className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{conversation.name}</span>
                        <span
                          className="block truncate text-xs"
                          style={{ color: 'var(--muted)' }}
                        >
                          {conversation.preview}
                        </span>
                      </span>
                      <span
                        className="px-2 py-1 font-mono text-[9px]"
                        style={{ border: '1px solid var(--line)', color: 'var(--soft)' }}
                      >
                        {conversation.status}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </section>
            <aside className="space-y-5">
              <section
                className="p-5"
                style={{
                  border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                  background: 'color-mix(in srgb, var(--accent) 6%, transparent)',
                }}
              >
                <div
                  className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.18em]"
                  style={{ color: 'var(--accent)' }}
                >
                  <ShieldCheck className="h-4 w-4" /> Campaign guardrails
                </div>
                <div className="mt-5 space-y-4 text-sm" style={{ color: 'var(--soft)' }}>
                  <div>
                    <span className="block" style={{ color: 'var(--ink)' }}>
                      Consent
                    </span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      Verified before any simulation starts
                    </span>
                  </div>
                  <div>
                    <span className="block" style={{ color: 'var(--ink)' }}>
                      Secrets
                    </span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      Simulation tokens only — no live OTPs or credentials
                    </span>
                  </div>
                  <div>
                    <span className="block" style={{ color: 'var(--ink)' }}>
                      Stop conditions
                    </span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      Agent pauses for distress or policy boundaries
                    </span>
                  </div>
                </div>
              </section>
              <section className="py-command-card p-5" style={{ border: '1px solid var(--line)' }}>
                <div
                  className="font-mono text-[9px] uppercase tracking-[.18em]"
                  style={{ color: 'var(--muted)' }}
                >
                  Context inventory
                </div>
                <div className="mt-4 space-y-3">
                  {['Exercise brief.pdf', 'Channel approval.md', 'Synthetic persona notes.txt'].map(
                    (file) => (
                      <div
                        key={file}
                        className="flex items-center gap-3 px-3 py-3"
                        style={{
                          border: '1px solid var(--line)',
                          background: 'var(--surface-2)',
                        }}
                      >
                        <FileText className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                        <span className="truncate text-xs" style={{ color: 'var(--soft)' }}>
                          {file}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </section>
            </aside>
          </div>
        )}

        {tab === 'agent' && (
          <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_380px]">
            <div className="py-command-card p-5 sm:p-7" style={{ border: '1px solid var(--line)' }}>
              <div className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 items-center justify-center"
                  style={{
                    border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)',
                    background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                    color: 'var(--accent)',
                  }}
                >
                  <BrainCircuit className="h-5 w-5" />
                </span>
                <div>
                  <div
                    className="font-mono text-[9px] uppercase tracking-[.18em]"
                    style={{ color: 'var(--accent)' }}
                  >
                    Reasoning surface
                  </div>
                  <h2 className="text-xl font-bold">Planning and action trace</h2>
                </div>
              </div>
              <div className="mt-8 space-y-0">
                {trace.map((item, index) => (
                  <div key={item.title} className="relative flex gap-5 pb-8 last:pb-0">
                    <div className="flex flex-col items-center">
                      <span
                        className={`mt-1 h-3 w-3 rounded-full ${
                          item.state === 'active' ? 'shadow-[0_0_18px_rgba(255,71,87,.85)]' : ''
                        }`}
                        style={
                          item.state === 'active'
                            ? { background: 'var(--accent)' }
                            : item.state === 'done'
                            ? { background: 'var(--teal)' }
                            : {
                                border: '1px solid var(--line-strong)',
                                background: 'transparent',
                              }
                        }
                      />
                      {index < trace.length - 1 && (
                        <span
                          className="mt-2 h-full w-px"
                          style={{ background: 'var(--line)' }}
                        />
                      )}
                    </div>
                    <div
                      className="flex-1 p-4"
                      style={{
                        border: '1px solid var(--line)',
                        background: 'var(--surface-2)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-bold">{item.title}</h3>
                        <span
                          className="font-mono text-[9px]"
                          style={{ color: 'var(--muted)' }}
                        >
                          {item.time}
                        </span>
                      </div>
                      <p
                        className="mt-2 text-sm leading-6"
                        style={{ color: 'var(--muted)' }}
                      >
                        {item.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <aside className="p-5" style={{ border: '1px solid var(--line)', background: 'var(--surface-2)' }}>
              <div
                className="font-mono text-[9px] uppercase tracking-[.18em]"
                style={{ color: 'var(--muted)' }}
              >
                Agent status
              </div>
              <div
                className="mt-5 p-4"
                style={{
                  border: '1px solid color-mix(in srgb, var(--teal) 30%, transparent)',
                  background: 'color-mix(in srgb, var(--teal) 8%, transparent)',
                }}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--teal)' }} />
                  Plan stays reviewable
                </div>
                <p
                  className="mt-2 text-xs leading-5"
                  style={{ color: 'var(--muted)' }}
                >
                  Operators can inspect the campaign path and safety constraints without exposing
                  hidden chain-of-thought.
                </p>
              </div>
            </aside>
          </section>
        )}

        {tab === 'conversations' && (
          <section className="mt-5 grid gap-5 xl:grid-cols-[300px_1fr_320px]">
            <aside
              className="p-3"
              style={{ border: '1px solid var(--line)', background: 'var(--surface-2)' }}
            >
              {conversations.map((conversation, index) => (
                <button
                  key={conversation.name}
                  className="mb-2 w-full p-4 text-left"
                  style={
                    index === 0
                      ? {
                          border: '1px solid color-mix(in srgb, var(--accent) 50%, transparent)',
                          background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
                        }
                      : { border: '1px solid var(--line)' }
                  }
                >
                  <div className="text-sm font-bold">{conversation.name}</div>
                  <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                    {conversation.channel}
                  </div>
                </button>
              ))}
            </aside>
            <section
              className="py-command-card p-5 sm:p-6"
              style={{ border: '1px solid var(--line)' }}
            >
              <div
                className="flex items-center justify-between pb-4"
                style={{ borderBottom: '1px solid var(--line)' }}
              >
                <div>
                  <div
                    className="font-mono text-[9px] uppercase tracking-[.18em]"
                    style={{ color: 'var(--accent)' }}
                  >
                    Simulation conversation
                  </div>
                  <h2 className="mt-1 text-lg font-bold">Participant A · approved sandbox</h2>
                </div>
                <span
                  className="px-2 py-1 text-[10px]"
                  style={{
                    border: '1px solid color-mix(in srgb, var(--teal) 35%, transparent)',
                    background: 'color-mix(in srgb, var(--teal) 10%, transparent)',
                    color: 'var(--teal)',
                  }}
                >
                  SIMULATED
                </span>
              </div>
              <div className="space-y-4 py-6">
                <div
                  className="max-w-[78%] p-4 text-sm"
                  style={{
                    border: '1px solid var(--line)',
                    background: 'var(--surface-2)',
                    color: 'var(--soft)',
                  }}
                >
                  A simulation message would render here through the approved channel adapter.
                </div>
                <div
                  className="ml-auto max-w-[78%] p-4 text-sm"
                  style={{
                    border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
                    background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
                    color: 'var(--soft)',
                  }}
                >
                  Participant response preview is redacted and evaluated against the campaign's
                  learning objective.
                </div>
                <div
                  className="max-w-[78%] p-4 text-sm"
                  style={{
                    border: '1px solid var(--line)',
                    background: 'var(--surface-2)',
                    color: 'var(--soft)',
                  }}
                >
                  The agent selected the next safe branch and requested operator approval.
                </div>
              </div>
              <div
                className="pt-4 text-xs"
                style={{ borderTop: '1px solid var(--line)', color: 'var(--muted)' }}
              >
                Live conversations are observable here; production delivery remains subject to
                channel approval and campaign guardrails.
              </div>
            </section>
            <aside
              className="p-5"
              style={{ border: '1px solid var(--line)', background: 'var(--surface-2)' }}
            >
              <div
                className="font-mono text-[9px] uppercase tracking-[.18em]"
                style={{ color: 'var(--muted)' }}
              >
                Current branch
              </div>
              <h3 className="mt-3 text-lg font-bold">Verification behavior</h3>
              <p
                className="mt-2 text-sm leading-6"
                style={{ color: 'var(--soft)' }}
              >
                Measure whether the participant follows the approved verification process under
                simulated pressure.
              </p>
              <div
                className="mt-5 space-y-3 pt-4 text-xs"
                style={{ borderTop: '1px solid var(--line)', color: 'var(--muted)' }}
              >
                <div>
                  Signal: <span style={{ color: 'var(--ink)' }}>Awaiting response</span>
                </div>
                <div>
                  Stop condition: <span style={{ color: 'var(--ink)' }}>Immediate pause on distress</span>
                </div>
                <div>
                  Outcome: <span style={{ color: 'var(--ink)' }}>Debrief and learning</span>
                </div>
              </div>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}

function ArrowIcon() {
  return <ChevronRight className="h-4 w-4" />;
}
