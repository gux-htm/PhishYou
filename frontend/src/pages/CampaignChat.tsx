import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, FileText, Paperclip, Play, Send, User, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { campaignChatError, getCampaignConversation, importCampaignContext, listConversations, sendCampaignChat, type CampaignConversation, type ConversationSummary } from '../services/campaignChat';

interface ChatMessage { role: 'user' | 'assistant' | 'system'; content: string; timestamp?: string; }

function parseTargets(text: string) {
  return text.split(/\r?\n/).map((row) => row.trim()).filter(Boolean).flatMap((row, index) => {
    const parts = row.split(',').map((part) => part.trim());
    const email = parts.find((part) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(part));
    if (!email) return [];
    const name = parts.find((part) => part !== email && !part.includes('@')) || email.split('@')[0];
    return [{ id: `import-${Date.now()}-${index}`, name, email, department: parts[2] || 'Unknown', role: parts[3] || 'Employee', personalContext: parts.slice(4).join(', ') || 'Imported from campaign context' }];
  });
}

export default function CampaignChat() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [data, setData] = useState<CampaignConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const [list, conversation] = await Promise.all([listConversations(), getCampaignConversation(id)]);
      setConversations(list.conversations);
      setData(conversation);
      setMessages(conversation.messages);
    } catch (err) { setError(campaignChatError(err)); }
  }

  useEffect(() => { void load(); const timer = window.setInterval(() => { if (!loading) void load(); }, 5000); return () => window.clearInterval(timer); }, [id, loading]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const isActive = data?.campaign.status === 'ACTIVE';
  const latestEvents = useMemo(() => (data?.events ?? []).slice(-8).reverse(), [data]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setLoading(true); setError(null); setInput('');
    try {
      const response = await sendCampaignChat(id, messages, text);
      await load();
      if (response.action === 'campaign_started') await load();
    } catch (err) { setError(campaignChatError(err)); }
    finally { setLoading(false); }
  }

  async function attachContext(file: File) {
    setImporting(true); setError(null);
    try {
      const text = await file.text();
      const targets = parseTargets(text);
      await importCampaignContext(id, text, targets);
      await load();
    } catch (err) { setError(campaignChatError(err)); }
    finally { setImporting(false); }
  }

  if (!data) return <div className="min-h-[70vh] grid place-items-center text-[#7A8595]">{error ?? 'Loading campaign…'}</div>;

  return (
    <div className="h-[calc(100vh-64px)] min-h-[620px] grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] bg-[var(--bg)]">
      <aside className="hidden lg:flex flex-col border-r border-[var(--line)] bg-[var(--surface)]">
        <div className="p-4 border-b border-[var(--line)]"><div className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--muted)]">Campaigns</div><div className="mt-1 text-sm font-semibold text-[var(--ink)]">Conversation history</div></div>
        <div className="flex-1 overflow-y-auto p-2">{conversations.map((conversation) => <button key={conversation.id} type="button" onClick={() => navigate(`/campaigns/${conversation.id}`)} className={`w-full rounded-lg px-3 py-3 text-left transition ${conversation.id === id ? 'bg-[var(--accent-soft)] text-[var(--ink)]' : 'text-[var(--soft)] hover:bg-[var(--bg-2)]'}`}><div className="truncate text-sm font-semibold">{conversation.name}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">{conversation.status}</div></button>)}</div>
        <Link to="/dashboard" className="m-3 inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--line)] text-xs font-bold text-[var(--soft)] hover:text-[var(--ink)]">Back to Command</Link>
      </aside>
      <main className="min-w-0 flex flex-col">
        <header className="border-b border-[var(--line)] bg-[var(--surface)] px-5 py-4"><div className="flex items-center justify-between gap-4"><div><div className="text-[10px] uppercase tracking-[.18em] text-[var(--accent)]">Campaign agent</div><h1 className="mt-1 truncate text-xl font-bold text-[var(--ink)]">{data.campaign.name}</h1></div><span className="inline-flex items-center gap-2 text-xs text-[var(--muted)]"><span className={`h-2 w-2 rounded-full ${isActive ? 'bg-[var(--teal)]' : 'bg-[var(--muted)]'}`}/>{data.campaign.status}</span></div></header>
        <section className="flex-1 overflow-y-auto px-5 py-6"><div className="mx-auto max-w-3xl space-y-5">{messages.filter((message) => message.role !== 'system').map((message, index) => <div key={`${message.timestamp ?? ''}-${index}`} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>{message.role === 'assistant' && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]"><Bot size={15}/></span>}<div className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-[var(--ink)] text-[var(--bg)]' : 'bg-[var(--surface)] text-[var(--soft)] border border-[var(--line)]'}`}>{message.content}</div>{message.role === 'user' && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--bg-2)] text-[var(--ink)]"><User size={15}/></span>}</div>)}{messages.filter((message) => message.role === 'system').map((message, index) => <div key={`system-${index}`} className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-3 text-xs text-[var(--muted)]"><FileText size={14} className="mr-2 inline"/>{message.content}</div>)}{loading && <div className="flex gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]"><Bot size={15}/></span><div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]"><Loader2 className="mr-2 inline h-4 w-4 animate-spin"/>Agent is working…</div></div>}<div ref={bottomRef}/></div></section>
        <footer className="border-t border-[var(--line)] bg-[var(--surface)] px-5 py-4"><div className="mx-auto max-w-3xl">{error && <div role="alert" className="mb-3 flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--accent-soft)] p-3 text-xs text-[var(--accent)]"><AlertTriangle size={14}/>{error}</div>}<div className="flex items-end gap-2 rounded-2xl border border-[var(--line)] bg-[var(--bg-2)] p-2"><label className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[var(--muted)] hover:text-[var(--ink)]" title="Import campaign context"><Paperclip size={18}/><input type="file" accept=".txt,.md,.csv,.json" className="sr-only" disabled={importing} onChange={(event) => { const file = event.target.files?.[0]; if (file) void attachContext(file); event.currentTarget.value = ''; }}/></label><textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }} placeholder="Talk to the campaign agent…" rows={2} className="min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-[var(--ink)] outline-none" disabled={loading}/><button onClick={() => void send()} disabled={loading || !input.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--ink)] text-[var(--bg)] disabled:opacity-40" aria-label="Send message"><Send size={17}/></button></div></div></footer>
      </main>
      <aside className="hidden xl:block border-l border-[var(--line)] bg-[var(--surface)] p-4 overflow-y-auto"><div className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--muted)]">Agent activity</div><div className="mt-4 space-y-3">{latestEvents.length ? latestEvents.map((event) => <article key={event.id} className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-3"><div className="text-[10px] font-mono text-[var(--muted)]">{event.createdAt}</div><div className="mt-1 text-xs font-semibold text-[var(--ink)]">{event.type.replaceAll('_', ' ')}</div><div className="mt-1 text-[11px] text-[var(--muted)]">{typeof event.meta?.preview === 'string' ? event.meta.preview : typeof event.meta?.subject === 'string' ? event.meta.subject : 'Recorded activity'}</div></article>) : <div className="text-xs text-[var(--muted)]">No campaign events yet.</div>}</div>{isActive && <div className="mt-6 rounded-lg border border-[var(--teal)]/20 bg-[var(--teal)]/[.05] p-3 text-xs text-[var(--soft)]"><Play size={13} className="mr-1 inline text-[var(--teal)]"/>Campaign is active. Incoming replies are monitored by the server mail watcher.</div>}<button type="button" onClick={() => void load()} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)]"><RefreshCw size={13}/>Refresh activity</button></aside>
    </div>
  );
}
