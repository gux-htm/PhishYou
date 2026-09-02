import { ArrowUp, Bot, Loader2, Paperclip, RefreshCw, Sparkles, User, X, AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { fetchAIConfig, getErrorMessage, sendChatMessage, type ChatMessage } from '../services/ai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AgentComposer({
  placeholder = 'Ask PhishYou anything about your security program…',
  compact = false,
}: {
  placeholder?: string;
  compact?: boolean;
}) {
  const [value, setValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check AI config once on mount
  useEffect(() => {
    fetchAIConfig()
      .then((c) => setConfigured(c.status === 'configured'))
      .catch(() => setConfigured(false));
  }, []);

  // Scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const hasThread = messages.length > 0 || loading;

  async function handleSend() {
    const text = value.trim();
    if (!text || loading) return;

    setValue('');

    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    // Build the full message array for the API (include system prompt)
    const apiMessages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are PhishYou, an expert AI assistant for a security-awareness phishing simulation platform. Help the operator understand their security program, plan campaigns, and interpret results.',
      },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: text },
    ];

    try {
      const reply = await sendChatMessage(apiMessages);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply.content }]);
    } catch (err) {
      setError(getErrorMessage(err));
      // Remove the optimistic user message so they can retry
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function clearThread() {
    setMessages([]);
    setError(null);
  }

  const notConfigured = configured === false;

  return (
    <div className={'py-agent-composer ' + (compact ? 'is-compact' : '')}>
      {/* Thread — only visible once conversation starts */}
      {hasThread && (
        <div className="py-agent-thread">
          <div className="py-agent-thread-header">
            <span><Sparkles size={12} /> AI THREAD</span>
            <button
              type="button"
              className="py-agent-thread-clear"
              onClick={clearThread}
              aria-label="Clear conversation"
            >
              <X size={14} /> Clear
            </button>
          </div>

          <div className="py-agent-thread-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`py-agent-msg py-agent-msg--${msg.role}`}
              >
                <span className="py-agent-msg-avatar">
                  {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
                </span>
                <p className="py-agent-msg-text">{msg.content}</p>
              </div>
            ))}

            {loading && (
              <div className="py-agent-msg py-agent-msg--assistant">
                <span className="py-agent-msg-avatar"><Bot size={13} /></span>
                <p className="py-agent-msg-text py-agent-msg--thinking">
                  <Loader2 size={13} className="animate-spin" /> Thinking…
                </p>
              </div>
            )}

            {error && (
              <div className="py-agent-msg-error">
                <AlertTriangle size={14} />
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="py-agent-thread-clear"
                >
                  <RefreshCw size={12} /> Dismiss
                </button>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>
      )}

      {/* Input row */}
      <div className="py-agent-prompt">
        <Sparkles size={18} />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={compact ? 1 : 3}
          placeholder={notConfigured ? 'Configure AI in Settings → Integrations first…' : placeholder}
          disabled={notConfigured || loading}
        />
        <button className="py-icon-button" aria-label="Attach context" disabled>
          <Paperclip size={18} />
        </button>
        <button
          className="py-send"
          aria-label="Send prompt"
          onClick={handleSend}
          disabled={notConfigured || loading || !value.trim()}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={18} />}
        </button>
      </div>

      <div className="py-agent-hints">
        <span>Campaign-aware</span>
        <span>Context indexed</span>
        <span>Authorized simulation only</span>
        {notConfigured && (
          <span style={{ color: 'var(--accent)' }}>⚠ AI not configured</span>
        )}
      </div>
    </div>
  );
}
