import { FormEvent, useMemo, useRef, useState } from 'react';
import { ArrowRight, Bot, CheckCircle2, FileText, MessageSquare, Paperclip, ShieldCheck, Sparkles, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type ChatMessage = { role: 'agent' | 'user'; text: string };

type ContextFile = { name: string; size: string };

const starterPrompts = [
  'Build a consent-first awareness simulation',
  'Help me choose the safest delivery channel',
  'Turn our existing exercise plan into a campaign',
];

const questions = [
  'What behavior are you trying to measure or strengthen?',
  'Who is in scope, and how is consent recorded?',
  'What channels are approved for this exercise?',
  'What should the agent do when a participant shows distress?',
];

export function AICampaignStudio() {
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [files, setFiles] = useState<ContextFile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'agent', text: 'I can help turn your authorized exercise context into a campaign plan. I will keep the plan inside the approved scope and use simulated secrets only.' },
  ]);
  const [prompt, setPrompt] = useState('');
  const [step, setStep] = useState<'setup' | 'conversation'>('setup');

  const readiness = useMemo(() => [name.trim().length > 1, instructions.trim().length > 10 || files.length > 0], [name, instructions, files]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const additions = Array.from(list).map((file) => ({ name: file.name, size: file.size > 1_000_000 ? `${(file.size / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1000))} KB` }));
    setFiles((current) => [...current, ...additions].slice(0, 8));
  }

  function beginConversation() {
    if (!readiness[0]) return;
    setStep('conversation');
    setMessages((current) => [...current, { role: 'agent', text: questions[0] }]);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = prompt.trim();
    if (!value) return;
    setMessages((current) => [...current, { role: 'user', text: value }, { role: 'agent', text: 'Understood. I am adding that to the campaign context. I will ask only for information needed to define an authorized, measurable simulation.' }]);
    setPrompt('');
  }

  return (
    <div
      className="relative min-h-[calc(100vh-4rem)] overflow-hidden"
      style={{ background: 'var(--bg)', color: 'var(--ink)' }}
    >
      <div className="pointer-events-none absolute inset-0 py-grid-signal opacity-45" />
      <div
        className="pointer-events-none absolute left-[8%] top-[-16rem] h-[34rem] w-[34rem] rounded-full blur-[120px]"
        style={{ background: 'color-mix(in srgb, var(--accent) 6%, transparent)' }}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
        <header
          className="mb-7 flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between"
          style={{ borderColor: 'var(--line)' }}
        >
          <div>
            <div
              className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.22em]"
              style={{ color: 'var(--accent)' }}
            >
              <span className="py-status-dot h-2 w-2 rounded-full" style={{ background: 'var(--accent)' }} /> Agent workspace / new campaign
            </div>
            <h1 className="mt-3 text-4xl font-black tracking-[-.06em] sm:text-5xl">Start with context.<br />Let the agent build the path.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: 'var(--soft)' }}>A campaign is a dedicated AI workspace: context, guardrails, planning and live observation stay together instead of being scattered across the dashboard.</p>
          </div>
          <div
            className="px-4 py-3 text-xs"
            style={{
              border: '1px solid color-mix(in srgb, var(--teal) 20%, transparent)',
              background: 'color-mix(in srgb, var(--teal) 5%, transparent)',
              color: 'var(--soft)',
            }}
          >
            <span className="font-mono uppercase tracking-[.16em]" style={{ color: 'var(--teal)' }}>Scope lock</span><br />Authorized simulation · simulated secrets only
          </div>
        </header>

        {step === 'setup' ? <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
          <section
            className="py-command-card relative overflow-hidden p-6 sm:p-8"
            style={{ borderColor: 'var(--line)' }}
          >
            <div
              className="absolute right-0 top-0 h-20 w-20 border-l border-b"
              style={{ borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }}
            />
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center"
                style={{
                  border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                  background: 'var(--accent-soft)',
                  color: 'var(--accent)',
                }}
              >
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold">Campaign briefing</h2>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>Like a project workspace, but built around one authorized exercise.</p>
              </div>
            </div>
            <div className="mt-8 space-y-6">
              <label className="block">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[.18em]" style={{ color: 'var(--muted)' }}>Campaign name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Q3 verification awareness exercise"
                  className="mt-2 w-full px-4 py-3 text-sm outline-none transition"
                  style={{
                    border: '1px solid var(--line)',
                    background: 'var(--surface-2)',
                    color: 'var(--ink)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.boxShadow = '0 0 0 2px color-mix(in srgb, var(--accent) 10%, transparent)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--line)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[.18em]" style={{ color: 'var(--muted)' }}>Custom instructions</span>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={4}
                  placeholder="Describe the goal, approved boundaries, audience, success criteria, and anything the agent must avoid…"
                  className="mt-2 w-full resize-none px-4 py-3 text-sm leading-6 outline-none transition"
                  style={{
                    border: '1px solid var(--line)',
                    background: 'var(--surface-2)',
                    color: 'var(--ink)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.boxShadow = '0 0 0 2px color-mix(in srgb, var(--accent) 10%, transparent)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--line)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <span className="mt-2 block text-xs" style={{ color: 'var(--muted)' }}>The agent should receive policy and scope—not passwords, real OTPs, or other live authentication secrets.</span>
              </label>
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[.18em]" style={{ color: 'var(--muted)' }}>Campaign context</span>
                  <button
                    onClick={() => fileInput.current?.click()}
                    className="text-xs font-semibold transition"
                    style={{ color: 'var(--teal)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--teal)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--teal)'; }}
                  >
                    Add context
                  </button>
                </div>
                <input ref={fileInput} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
                <button
                  onClick={() => fileInput.current?.click()}
                  className="mt-2 flex w-full items-center gap-4 border border-dashed p-5 text-left transition"
                  style={{
                    borderColor: 'var(--line-strong)',
                    background: 'color-mix(in srgb, var(--surface-2) 50%, transparent)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent) 40%, transparent)';
                    e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 3%, transparent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--line-strong)';
                    e.currentTarget.style.background = 'color-mix(in srgb, var(--surface-2) 50%, transparent)';
                  }}
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center"
                    style={{
                      border: '1px solid var(--line)',
                      color: 'var(--soft)',
                    }}
                  >
                    <Upload className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">Upload an authorized context pack</span>
                    <span className="mt-1 block text-xs" style={{ color: 'var(--muted)' }}>Policies, exercise briefs, synthetic personas, approved plans or redacted research.</span>
                  </span>
                </button>
                {files.length > 0 && <div className="mt-3 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-3 px-3 py-2.5"
                      style={{
                        border: '1px solid var(--line)',
                        background: 'var(--surface-2)',
                      }}
                    >
                      <FileText className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                      <span className="min-w-0 flex-1 truncate text-xs" style={{ color: 'var(--soft)' }}>{file.name}</span>
                      <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{file.size}</span>
                      <button
                        onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                        style={{ color: 'var(--muted)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)'; }}
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>}
              </div>
            </div>
            <div
              className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5"
              style={{ borderColor: 'var(--line)' }}
            >
              <div className="text-xs" style={{ color: 'var(--muted)' }}>{readiness.filter(Boolean).length}/2 briefing signals ready</div>
              <button
                onClick={beginConversation}
                disabled={!readiness[0]}
                className="inline-flex min-h-11 items-center gap-2 px-5 text-xs font-black uppercase tracking-[.14em] transition disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
                  background: 'var(--accent)',
                  color: '#fff',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
              >
                Open agent <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
          <aside className="space-y-5">
            <div
              className="py-command-card p-5"
              style={{ borderColor: 'var(--line)' }}
            >
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.18em]" style={{ color: 'var(--muted)' }}>
                <Bot className="h-4 w-4" style={{ color: 'var(--teal)' }} /> What the agent does
              </div>
              <ol className="mt-5 space-y-4">
                {['Reads the approved context and constraints', 'Asks for missing planning information', 'Builds a reviewable campaign plan', 'Keeps the plan and live signals in one workspace'].map((item, index) => (
                  <li key={item} className="flex gap-3 text-sm" style={{ color: 'var(--soft)' }}>
                    <span className="font-mono" style={{ color: 'var(--accent)' }}>0{index + 1}</span>{item}
                  </li>
                ))}
              </ol>
            </div>
            <div
              className="p-5"
              style={{
                border: '1px solid color-mix(in srgb, var(--teal) 15%, transparent)',
                background: 'color-mix(in srgb, var(--teal) 3.5%, transparent)',
              }}
            >
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--teal)' }} />
                <div>
                  <h3 className="text-sm font-bold">Guardrails stay visible</h3>
                  <p className="mt-1 text-xs leading-5" style={{ color: 'var(--muted)' }}>Consent, scope, channel approval and stop conditions belong to the campaign context—not a hidden settings screen.</p>
                </div>
              </div>
            </div>
          </aside>
        </div> : (
          <section
            className="mx-auto max-w-4xl py-command-card overflow-hidden"
            style={{ borderColor: 'var(--line)' }}
          >
            <div
              className="flex items-center justify-between border-b px-5 py-4 sm:px-6"
              style={{ borderColor: 'var(--line)' }}
            >
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[.2em]" style={{ color: 'var(--accent)' }}>Campaign intelligence session</div>
                <h2 className="mt-1 text-lg font-bold">{name}</h2>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--teal)' }}><CheckCircle2 className="h-4 w-4" /> Context attached</div>
            </div>
            <div className="min-h-[420px] space-y-5 p-5 sm:p-6">
              {messages.map((message, index) => (
                <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                  <div
                    className="max-w-[80%] border px-4 py-3 text-sm leading-6"
                    style={{
                      borderColor: message.role === 'user'
                        ? 'color-mix(in srgb, var(--teal) 20%, transparent)'
                        : 'color-mix(in srgb, var(--accent) 20%, transparent)',
                      background: message.role === 'user'
                        ? 'color-mix(in srgb, var(--teal) 6%, transparent)'
                        : 'color-mix(in srgb, var(--accent) 5%, transparent)',
                      color: 'var(--soft)',
                    }}
                  >
                    {message.role === 'agent' && (
                      <div className="mb-1 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.16em]" style={{ color: 'var(--accent)' }}>
                        <Bot className="h-3.5 w-3.5" /> PhishYou agent
                      </div>
                    )}
                    {message.text}
                  </div>
                </div>
              ))}
            </div>
            <form
              onSubmit={submit}
              className="border-t p-3"
              style={{ borderColor: 'var(--line)' }}
            >
              <div
                className="flex items-center gap-3 px-3 py-2"
                style={{
                  border: '1px solid var(--line)',
                  background: 'var(--surface-2)',
                }}
              >
                <MessageSquare className="h-4 w-4" style={{ color: 'var(--muted)' }} />
                <input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Answer the agent or add campaign context…"
                  className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
                  style={{ color: 'var(--ink)' }}
                />
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  style={{ color: 'var(--muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)'; }}
                  aria-label="Attach context"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <button
                  className="px-4 py-2 text-xs font-bold"
                  style={{
                    border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
                    background: 'var(--accent)',
                    color: '#fff',
                  }}
                >
                  Send
                </button>
              </div>
            </form>
            <div
              className="flex flex-wrap gap-2 border-t px-4 py-3 sm:px-6"
              style={{ borderColor: 'var(--line)' }}
            >
              {starterPrompts.map((item) => (
                <button
                  key={item}
                  onClick={() => setPrompt(item)}
                  className="px-3 py-2 text-xs transition"
                  style={{
                    border: '1px solid var(--line)',
                    background: 'var(--surface-2)',
                    color: 'var(--soft)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent) 30%, transparent)';
                    e.currentTarget.style.color = 'var(--ink)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--line)';
                    e.currentTarget.style.color = 'var(--soft)';
                  }}
                >
                  {item}
                </button>
              ))}
              <button
                onClick={() => navigate('/campaigns/demo-workspace')}
                className="ml-auto inline-flex items-center gap-2 text-xs font-semibold"
                style={{ color: 'var(--teal)' }}
              >
                Open campaign workspace <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
