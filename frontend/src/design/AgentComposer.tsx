import { ArrowUp, Bot, Loader2, Paperclip, RefreshCw, Sparkles, User, X, AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAIConfig } from '../services/ai';
import { campaignChatError, createConversation } from '../services/campaignChat';

interface Message { role: 'user' | 'assistant'; content: string; }

export function AgentComposer({ placeholder = 'Tell PhishYou what you want to simulate…', compact = false }: { placeholder?: string; compact?: boolean }) {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [attachContext, setAttachContext] = useState<File | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { fetchAIConfig().then((config) => setConfigured(config.status === 'configured')).catch(() => setConfigured(false)); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  async function handleSend() {
    const text = value.trim();
    if (!text || loading || configured !== true) return;
    setLoading(true); setError(null); setValue('');
    try {
      let initial = text;
      if (attachContext) initial += `\n\n[Imported context: ${attachContext.name}]\n${await attachContext.text()}`;
      const result = await createConversation(initial);
      setMessages([{ role: 'user', content: initial }, result.message]);
      setAttachContext(null);
      navigate(`/campaigns/${result.campaign.id}`);
    } catch (err) {
      setError(campaignChatError(err));
    } finally {
      setLoading(false); textareaRef.current?.focus();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void handleSend(); }
  }

  const notConfigured = configured === false;
  return (
    <div className={`py-agent-composer ${compact ? 'is-compact' : ''}`}>
      {messages.length > 0 && <div className="py-agent-thread"><div className="py-agent-thread-header"><span><Sparkles size={12}/> CAMPAIGN THREAD</span><button type="button" className="py-agent-thread-clear" onClick={() => setMessages([])}><X size={14}/> Clear</button></div><div className="py-agent-thread-messages">{messages.map((msg, index) => <div key={index} className={`py-agent-msg py-agent-msg--${msg.role}`}><span className="py-agent-msg-avatar">{msg.role === 'user' ? <User size={13}/> : <Bot size={13}/>}</span><p className="py-agent-msg-text">{msg.content}</p></div>)}{loading && <div className="py-agent-msg py-agent-msg--assistant"><span className="py-agent-msg-avatar"><Bot size={13}/></span><p className="py-agent-msg-text py-agent-msg--thinking"><Loader2 size={13} className="animate-spin"/> Creating campaign…</p></div>}<div ref={bottomRef}/></div></div>}
      <div className="py-agent-prompt">
        <Sparkles size={18}/>
        <textarea ref={textareaRef} value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={handleKeyDown} rows={compact ? 1 : 3} placeholder={notConfigured ? 'Configure the LLM in Tool Settings first…' : placeholder} disabled={notConfigured || loading}/>
        <label className="py-icon-button" aria-label="Import campaign context"><Paperclip size={18}/><input type="file" accept=".txt,.md,.csv,.json,.pdf" className="sr-only" disabled={notConfigured || loading} onChange={(event) => setAttachContext(event.target.files?.[0] ?? null)}/></label>
        <button className="py-send" aria-label="Create campaign conversation" onClick={() => void handleSend()} disabled={notConfigured || loading || !value.trim()}>{loading ? <Loader2 size={16} className="animate-spin"/> : <ArrowUp size={18}/>}</button>
      </div>
      {attachContext && <div className="py-agent-hints"><span>Context attached: {attachContext.name}</span><button type="button" onClick={() => setAttachContext(null)}><RefreshCw size={12}/> Remove</button></div>}
      {error && <div className="py-agent-msg-error"><AlertTriangle size={14}/><span>{error}</span></div>}
      {!attachContext && !error && <div className="py-agent-hints"><span>Campaign agent</span><span>Context-aware</span><span>Authorized simulation only</span></div>}
    </div>
  );
}
