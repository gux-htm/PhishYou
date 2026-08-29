import { FormEvent, useMemo, useRef, useState } from 'react';
import { ArrowRight, Bot, CheckCircle2, FileText, MessageSquare, Paperclip, Plus, ShieldCheck, Sparkles, Upload, X } from 'lucide-react';
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
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#090b10] text-[#f5f7fb]">
      <div className="pointer-events-none absolute inset-0 py-grid-signal opacity-45" />
      <div className="pointer-events-none absolute left-[8%] top-[-16rem] h-[34rem] w-[34rem] rounded-full bg-[#ff4757]/[.06] blur-[120px]" />
      <div className="relative mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
        <header className="mb-7 flex flex-col gap-5 border-b border-white/[.07] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.22em] text-[#ff6a76]"><span className="py-status-dot h-2 w-2 rounded-full bg-[#ff4757]" /> Agent workspace / new campaign</div>
            <h1 className="mt-3 text-4xl font-black tracking-[-.06em] sm:text-5xl">Start with context.<br />Let the agent build the path.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a8b4c4]">A campaign is a dedicated AI workspace: context, guardrails, planning and live observation stay together instead of being scattered across the dashboard.</p>
          </div>
          <div className="border border-[#2fd9c7]/20 bg-[#2fd9c7]/[.05] px-4 py-3 text-xs text-[#a8b4c4]"><span className="font-mono uppercase tracking-[.16em] text-[#2fd9c7]">Scope lock</span><br />Authorized simulation · simulated secrets only</div>
        </header>

        {step === 'setup' ? <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
          <section className="py-command-card relative overflow-hidden border border-white/[.08] p-6 sm:p-8">
            <div className="absolute right-0 top-0 h-20 w-20 border-l border-b border-[#ff4757]/30" />
            <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center border border-[#ff4757]/25 bg-[#ff4757]/[.08] text-[#ff6a76]"><Sparkles className="h-5 w-5" /></span><div><h2 className="text-lg font-bold">Campaign briefing</h2><p className="text-sm text-[#7a8595]">Like a project workspace, but built around one authorized exercise.</p></div></div>
            <div className="mt-8 space-y-6">
              <label className="block"><span className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#7a8595]">Campaign name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q3 verification awareness exercise" className="mt-2 w-full border border-white/[.1] bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-[#ff4757]/60 focus:ring-2 focus:ring-[#ff4757]/10" /></label>
              <label className="block"><span className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#7a8595]">Custom instructions</span><textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={4} placeholder="Describe the goal, approved boundaries, audience, success criteria, and anything the agent must avoid…" className="mt-2 w-full resize-none border border-white/[.1] bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-[#5a6470] focus:border-[#ff4757]/60 focus:ring-2 focus:ring-[#ff4757]/10" /><span className="mt-2 block text-xs text-[#5a6470]">The agent should receive policy and scope—not passwords, real OTPs, or other live authentication secrets.</span></label>
              <div><div className="flex items-center justify-between"><span className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#7a8595]">Campaign context</span><button onClick={() => fileInput.current?.click()} className="text-xs font-semibold text-[#2fd9c7] hover:text-[#4fe5d3]">Add context</button></div><input ref={fileInput} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
                <button onClick={() => fileInput.current?.click()} className="mt-2 flex w-full items-center gap-4 border border-dashed border-white/[.14] bg-white/[.02] p-5 text-left transition hover:border-[#ff4757]/40 hover:bg-[#ff4757]/[.025]"><span className="flex h-10 w-10 items-center justify-center border border-white/[.08] text-[#a8b4c4]"><Upload className="h-4 w-4" /></span><span><span className="block text-sm font-semibold">Upload an authorized context pack</span><span className="mt-1 block text-xs text-[#7a8595]">Policies, exercise briefs, synthetic personas, approved plans or redacted research.</span></span></button>
                {files.length > 0 && <div className="mt-3 space-y-2">{files.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center gap-3 border border-white/[.06] bg-black/20 px-3 py-2.5"><FileText className="h-4 w-4 text-[#ff6a76]" /><span className="min-w-0 flex-1 truncate text-xs text-[#d8dee8]">{file.name}</span><span className="text-[10px] text-[#5a6470]">{file.size}</span><button onClick={() => setFiles((current) => current.filter((_, i) => i !== index))} className="text-[#7a8595] hover:text-white" aria-label={`Remove ${file.name}`}><X className="h-4 w-4" /></button></div>)}</div>}
              </div>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/[.07] pt-5"><div className="text-xs text-[#7a8595]">{readiness.filter(Boolean).length}/2 briefing signals ready</div><button onClick={beginConversation} disabled={!readiness[0]} className="inline-flex min-h-11 items-center gap-2 border border-[#ff4757]/35 bg-[#ff4757] px-5 text-xs font-black uppercase tracking-[.14em] text-[#170508] transition hover:bg-[#ff6472] disabled:cursor-not-allowed disabled:opacity-40">Open agent <ArrowRight className="h-4 w-4" /></button></div>
          </section>
          <aside className="space-y-5">
            <div className="py-command-card border border-white/[.08] p-5"><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.18em] text-[#7a8595]"><Bot className="h-4 w-4 text-[#2fd9c7]" /> What the agent does</div><ol className="mt-5 space-y-4">{['Reads the approved context and constraints', 'Asks for missing planning information', 'Builds a reviewable campaign plan', 'Keeps the plan and live signals in one workspace'].map((item, index) => <li key={item} className="flex gap-3 text-sm text-[#a8b4c4]"><span className="font-mono text-[#ff6a76]">0{index + 1}</span>{item}</li>)}</ol></div>
            <div className="border border-[#2fd9c7]/15 bg-[#2fd9c7]/[.035] p-5"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#2fd9c7]" /><div><h3 className="text-sm font-bold">Guardrails stay visible</h3><p className="mt-1 text-xs leading-5 text-[#7a8595]">Consent, scope, channel approval and stop conditions belong to the campaign context—not a hidden settings screen.</p></div></div></div>
          </aside>
        </div> : <section className="mx-auto max-w-4xl py-command-card overflow-hidden border border-white/[.08]">
          <div className="flex items-center justify-between border-b border-white/[.07] px-5 py-4 sm:px-6"><div><div className="font-mono text-[9px] uppercase tracking-[.2em] text-[#ff6a76]">Campaign intelligence session</div><h2 className="mt-1 text-lg font-bold">{name}</h2></div><div className="flex items-center gap-2 text-xs text-[#2fd9c7]"><CheckCircle2 className="h-4 w-4" /> Context attached</div></div>
          <div className="min-h-[420px] space-y-5 p-5 sm:p-6">{messages.map((message, index) => <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}><div className={`${message.role === 'user' ? 'order-2 border-[#2fd9c7]/20 bg-[#2fd9c7]/[.06]' : 'border-[#ff4757]/20 bg-[#ff4757]/[.045]'} max-w-[80%] border px-4 py-3 text-sm leading-6 text-[#d8dee8]`}>{message.role === 'agent' && <div className="mb-1 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.16em] text-[#ff6a76]"><Bot className="h-3.5 w-3.5" /> PhishYou agent</div>}{message.text}</div></div>)}</div>
          <form onSubmit={submit} className="border-t border-white/[.07] p-3"><div className="flex items-center gap-3 border border-white/[.1] bg-black/20 px-3 py-2"><MessageSquare className="h-4 w-4 text-[#7a8595]" /><input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Answer the agent or add campaign context…" className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-[#5a6470]" /><button type="button" onClick={() => fileInput.current?.click()} className="text-[#7a8595] hover:text-white" aria-label="Attach context"><Paperclip className="h-4 w-4" /></button><button className="border border-[#ff4757]/35 bg-[#ff4757] px-4 py-2 text-xs font-bold text-[#170508]">Send</button></div></form>
          <div className="flex flex-wrap gap-2 border-t border-white/[.05] px-4 py-3 sm:px-6">{starterPrompts.map((item) => <button key={item} onClick={() => setPrompt(item)} className="border border-white/[.08] bg-white/[.025] px-3 py-2 text-xs text-[#a8b4c4] transition hover:border-[#ff4757]/30 hover:text-white">{item}</button>)}<button onClick={() => navigate('/campaigns/demo-workspace')} className="ml-auto inline-flex items-center gap-2 text-xs font-semibold text-[#2fd9c7]">Open campaign workspace <ArrowRight className="h-3.5 w-3.5" /></button></div>
        </section>}
      </div>
    </div>
  );
}
