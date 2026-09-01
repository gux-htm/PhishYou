/**
 * PhishYou — AI Assistant (`/ai-assistant`).
 * The first real AI integration: configure the LLM provider (OpenRouter by
 * default, Alibaba Cloud Qwen as the alternative), run a REAL connection
 * test, and chat with the configured model through the PhishYou backend.
 *
 * Security model — the browser NEVER sees the provider API key:
 *   • the key is typed once, sent via PUT (write-only) and immediately
 *     cleared from the form; it lives in backend/.env or backend/ai_config.json
 *   • GET /api/v1/ai/status returns only a masked hint (sk-••••ab12)
 *   • all LLM traffic flows browser → PhishYou backend → provider, never
 *     browser → provider, so the key stays server-side at all times
 *
 * Backend endpoints (backend/main.py):
 *   GET  /api/v1/ai/status          masked configuration + connection state
 *   PUT  /api/v1/ai/config          save provider settings (key is write-only)
 *   POST /api/v1/ai/test-connection REAL provider round-trip
 *   POST /api/v1/ai/chat            real chat completion for {role, content}[]
 *
 * Responses are non-streaming; only the model's final answer is rendered —
 * reasoning_details and internal reasoning tokens are stripped server-side
 * (backend/providers.py) and never reach this UI.
 */
import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  KeyRound,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type ConnectionStatus = 'not_configured' | 'configured' | 'testing' | 'connected' | 'error';
type ProviderId = 'openrouter' | 'qwen';

interface AiStatus {
  status: ConnectionStatus;
  provider: string;
  providerLabel: string;
  model: string;
  apiKeySet: boolean;
  apiKeyHint: string | null;
  baseUrl: string;
  lastTestedAt: string | null;
  lastError: string | null;
}

interface ChatMsg {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  at: string;
}

interface TestOutcome {
  ok: boolean;
  latencyMs?: number;
  model?: string;
  error?: string;
  errorKind?: string;
}

/* ------------------------------------------------------------------ */
/* Constants + helpers                                                 */
/* ------------------------------------------------------------------ */

const PROVIDERS: Record<ProviderId, { label: string; model: string; baseUrl: string; keyHint: string }> = {
  openrouter: {
    label: 'OpenRouter',
    model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    baseUrl: 'https://openrouter.ai/api/v1',
    keyHint: 'sk-or-v1-…',
  },
  qwen: {
    label: 'Alibaba Cloud Qwen (DashScope)',
    model: 'qwen-plus',
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
    keyHint: 'sk-…',
  },
};

const ERROR_KIND_LABELS: Record<string, string> = {
  not_configured: 'Not configured',
  auth: 'Authentication failed',
  model: 'Invalid model',
  rate_limit: 'Rate limited',
  timeout: 'Timeout',
  network: 'Network error',
  provider: 'Provider error',
};

const STATUS_META: Record<ConnectionStatus, { label: string; color: string; box: string }> = {
  not_configured: { label: 'Not Configured', color: '#94A3B8', box: 'border-slate-400/30 bg-slate-400/10' },
  configured: { label: 'Configured', color: '#5B9EFF', box: 'border-[#5B9EFF]/30 bg-[#5B9EFF]/10' },
  testing: { label: 'Testing connection…', color: '#F59E0B', box: 'border-[#F59E0B]/30 bg-[#F59E0B]/10' },
  connected: { label: 'Connected', color: '#06D369', box: 'border-[#06D369]/30 bg-[#06D369]/10' },
  error: { label: 'Connection error', color: '#FF4757', box: 'border-[#FF4757]/30 bg-[#FF4757]/10' },
};

const BACKEND_DOWN =
  'Could not reach the PhishYou backend — start it from backend/ with `uvicorn main:app --port 8000`.';

const panel = 'bg-[#111827] border border-[#2D3748] rounded-xl p-5 sm:p-6';
const fieldLabel = 'block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5';
const input =
  'w-full bg-[#1D232D] border border-[#2D3748] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#2FD9C7] transition-colors disabled:opacity-50';
const primaryButton =
  'inline-flex items-center justify-center gap-2 bg-[#2FD9C7] hover:bg-[#4FE5D3] text-[#0F1219] text-sm font-semibold rounded-lg px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const secondaryButton =
  'inline-flex items-center justify-center gap-2 bg-transparent border border-[#2D3748] hover:border-[#2FD9C7]/60 hover:text-white text-slate-300 text-sm font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtTested(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function MessageBubble({ msg }: { msg: ChatMsg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <p className={`text-[10px] uppercase tracking-wider mb-1 ${isUser ? 'text-slate-500' : 'text-[#2FD9C7]/70'}`}>
        {isUser ? 'You' : 'Assistant'} · {fmtTime(msg.at)}
      </p>
      <div
        className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-[#2FD9C7]/10 border border-[#2FD9C7]/25 text-slate-100 rounded-2xl rounded-br-sm'
            : 'bg-[#1D232D] border border-[#2D3748] text-slate-100 rounded-2xl rounded-bl-sm'
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

function NotConfiguredState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6">
      <div className="w-12 h-12 rounded-xl bg-slate-400/10 border border-slate-400/20 flex items-center justify-center mb-4">
        <Bot className="w-6 h-6 text-slate-400" aria-hidden="true" />
      </div>
      <p className="text-base font-semibold text-white mb-1">Not Configured</p>
      <p className="text-sm text-slate-400 max-w-sm">
        Save an API key in the provider configuration panel — then run a connection test and start chatting.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AIAssistant() {
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // --- configuration form (API key is write-only — never echoed back) ---
  const [provider, setProvider] = useState<ProviderId>('openrouter');
  const [model, setModel] = useState(PROVIDERS.openrouter.model);
  const [baseUrl, setBaseUrl] = useState(PROVIDERS.openrouter.baseUrl);
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // --- connection test ---
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestOutcome | null>(null);

  // --- conversation (kept in React state only — nothing persisted) ---
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<{ error: string; errorKind?: string } | null>(null);
  const nextId = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const connStatus: ConnectionStatus = status?.status ?? 'not_configured';
  const canChat = connStatus !== 'not_configured' && !loadError;

  const refreshStatus = useCallback(async (syncForm: boolean) => {
    try {
      const res = await fetch('/api/v1/ai/status', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as AiStatus;
      setStatus(data);
      setLoadError(null);
      if (syncForm) {
        setProvider(data.provider === 'qwen' ? 'qwen' : 'openrouter');
        setModel(data.model || PROVIDERS.openrouter.model);
        setBaseUrl(data.baseUrl || PROVIDERS.openrouter.baseUrl);
        setApiKey('');
      }
    } catch {
      setLoadError(BACKEND_DOWN);
    }
  }, []);

  useEffect(() => {
    void refreshStatus(true).finally(() => setLoading(false));
  }, [refreshStatus]);

  // Keep the latest message in view while the conversation grows.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending, chatError]);

  const dirty =
    !!status &&
    (provider !== (status.provider === 'qwen' ? 'qwen' : 'openrouter') ||
      model.trim() !== status.model ||
      baseUrl.trim() !== status.baseUrl ||
      apiKey.trim() !== '');

  function switchProvider(next: ProviderId): void {
    if (next === provider) return;
    const prev = PROVIDERS[provider];
    const nextP = PROVIDERS[next];
    // Swap defaults only while the fields still hold the previous default.
    setModel((m) => (m.trim() === prev.model || m.trim() === '' ? nextP.model : m));
    setBaseUrl((u) => (u.trim() === prev.baseUrl || u.trim() === '' ? nextP.baseUrl : u));
    setProvider(next);
    setTestResult(null); // provider changed — previous evidence is stale
  }

  async function saveConfig(): Promise<void> {
    setSaving(true);
    setSaveError(null);
    try {
      const body: Record<string, string> = {
        provider,
        model: model.trim(),
        base_url: baseUrl.trim(),
      };
      if (apiKey.trim()) body.api_key = apiKey.trim();
      const res = await fetch('/api/v1/ai/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { success: boolean; status?: AiStatus; error?: string };
      if (!res.ok || !data.success) {
        setSaveError(data.error ?? `Save failed (HTTP ${res.status}).`);
        return;
      }
      if (data.status) setStatus(data.status);
      setApiKey(''); // the key never lingers in the form
      setTestResult(null);
    } catch {
      setSaveError(BACKEND_DOWN);
    } finally {
      setSaving(false);
    }
  }

  async function runTest(): Promise<void> {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/v1/ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as {
        success: boolean;
        status?: string;
        latencyMs?: number;
        model?: string;
        error?: string;
        errorKind?: string;
      };
      if (data.success) {
        setTestResult({ ok: true, latencyMs: data.latencyMs, model: data.model });
      } else {
        setTestResult({
          ok: false,
          error: data.error ?? 'Unknown error.',
          errorKind: data.errorKind,
        });
      }
    } catch {
      setTestResult({ ok: false, error: BACKEND_DOWN, errorKind: 'network' });
    } finally {
      setTesting(false);
      // record_result() changed the server-side state — resync the pill
      // without clobbering any unsaved form edits.
      void refreshStatus(false);
    }
  }

  async function send(text: string, isNew: boolean): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setChatError(null);

    const history: { role: 'user' | 'assistant'; content: string }[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    if (isNew) {
      setMessages((prev) => [
        ...prev,
        { id: nextId.current++, role: 'user', content: trimmed, at: new Date().toISOString() },
      ]);
    }
    history.push({ role: 'user', content: trimmed });

    setSending(true);
    setInput('');
    try {
      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-40) }),
      });
      const data = (await res.json()) as {
        success: boolean;
        message?: { role: 'assistant'; content: string };
        model?: string;
        error?: string;
        errorKind?: string;
      };
      if (!res.ok || !data.success || !data.message) {
        setChatError({
          error: data.error ?? `The backend returned HTTP ${res.status}.`,
          errorKind: data.errorKind,
        });
        return;
      }
      setMessages((prev) => [
        ...prev,
        { id: nextId.current++, role: 'assistant', content: data.message!.content, at: new Date().toISOString() },
      ]);
      void refreshStatus(false); // a real reply proves the connection is live
    } catch {
      setChatError({ error: BACKEND_DOWN, errorKind: 'network' });
    } finally {
      setSending(false);
    }
  }

  /** Re-send the last user message (it stays in the history — never duplicated). */
  function retry(): void {
    if (sending) return;
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) {
      setChatError(null);
      return;
    }
    setChatError(null);
    void send(lastUser.content, false);
  }

  function submit(e: FormEvent): void {
    e.preventDefault();
    void send(input, true);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(input, true);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#2FD9C7]" aria-hidden="true" />
          <p className="text-sm text-slate-400">Loading AI configuration…</p>
        </div>
      </div>
    );
  }

  const statusMeta = STATUS_META[testing ? 'testing' : connStatus];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2FD9C7]/10 border border-[#2FD9C7]/30 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-[#2FD9C7]" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">AI Assistant</h1>
            <p className="text-sm text-slate-400">
              Real LLM integration — requests flow through the PhishYou backend, never straight to the provider.
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusMeta.box}`}
          style={{ color: statusMeta.color }}
          role="status"
        >
          <span className="relative flex h-2 w-2">
            {testing ? (
              <>
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: statusMeta.color }}
                />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: statusMeta.color }} />
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: statusMeta.color }} />
            )}
          </span>
          {statusMeta.label}
        </span>
      </div>

      {/* Backend unreachable */}
      {loadError && (
        <div className="rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#F59E0B]">Backend unreachable</p>
            <p className="text-xs text-slate-400 mt-0.5">{loadError}</p>
          </div>
          <button
            type="button"
            className={`${secondaryButton} !px-3 !py-1 !text-xs`}
            onClick={() => {
              setLoading(true);
              void refreshStatus(true).finally(() => setLoading(false));
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] gap-6 items-start">
        {/* ------------------------- Configuration ------------------------- */}
        <section className={panel}>
          <h2 className="text-lg font-bold text-white">Provider Configuration</h2>
          <p className="text-sm text-slate-400 mt-1 mb-4">
            Stored server-side — the API key never returns to the browser.
          </p>

          <div className="space-y-4">
            <div>
              <label className={fieldLabel} htmlFor="ai-provider">
                Provider
              </label>
              <select
                id="ai-provider"
                className={input}
                value={provider}
                onChange={(e) => switchProvider(e.target.value as ProviderId)}
              >
                <option value="openrouter">OpenRouter</option>
                <option value="qwen">Alibaba Cloud Qwen (DashScope)</option>
              </select>
            </div>

            <div>
              <label className={fieldLabel} htmlFor="ai-model">
                Model
              </label>
              <input
                id="ai-model"
                type="text"
                className={input}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={PROVIDERS[provider].model}
                spellCheck={false}
              />
            </div>

            <div>
              <label className={fieldLabel} htmlFor="ai-api-key">
                API Key
              </label>
              <input
                id="ai-api-key"
                type="password"
                className={input}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  status?.apiKeySet
                    ? `Keep current key (${status.apiKeyHint})`
                    : PROVIDERS[provider].keyHint
                }
                autoComplete="off"
                spellCheck={false}
              />
              <p className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-500">
                <KeyRound className="w-3.5 h-3.5 shrink-0 mt-px text-[#2FD9C7]" aria-hidden="true" />
                <span>
                  Write-only: sent to the backend over PUT and stored in backend/.env or
                  backend/ai_config.json — never in localStorage, sessionStorage or responses.
                </span>
              </p>
            </div>

            <div>
              <label className={fieldLabel} htmlFor="ai-base-url">
                Base URL
              </label>
              <input
                id="ai-base-url"
                type="text"
                className={input}
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={PROVIDERS[provider].baseUrl}
                spellCheck={false}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <button
              type="button"
              className={`${primaryButton} flex-1`}
              onClick={() => void saveConfig()}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
              {saving ? 'Saving…' : 'Save Configuration'}
            </button>
            <button
              type="button"
              className={`${secondaryButton} flex-1`}
              onClick={() => void runTest()}
              disabled={testing || saving}
            >
              {testing ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
              )}
              {testing ? 'Testing…' : 'Test Connection'}
            </button>
          </div>

          {dirty && (
            <p className="mt-2 text-xs text-[#F59E0B]">
              Unsaved changes — save before testing to exercise the new values.
            </p>
          )}
          {saveError && (
            <p className="mt-2 text-xs text-[#FF4757] flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" aria-hidden="true" />
              {saveError}
            </p>
          )}

          {testResult && (
            <div
              className={`mt-4 rounded-lg border px-4 py-3 ${
                testResult.ok
                  ? 'border-[#06D369]/30 bg-[#06D369]/10'
                  : 'border-[#FF4757]/30 bg-[#FF4757]/10'
              }`}
              role="status"
            >
              <div className="flex items-start gap-3">
                {testResult.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-[#06D369] shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <XCircle className="w-4 h-4 text-[#FF4757] shrink-0 mt-0.5" aria-hidden="true" />
                )}
                <div className="min-w-0">
                  {testResult.ok ? (
                    <>
                      <p className="text-sm font-medium text-[#06D369]">Connected — real round-trip succeeded</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {testResult.model ?? status?.model} responded in {testResult.latencyMs ?? '—'} ms.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-[#FF4757]">
                        {testResult.errorKind
                          ? `${ERROR_KIND_LABELS[testResult.errorKind] ?? 'Error'} — `
                          : ''}
                        {testResult.error}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        The test made a real request to the provider; this is the provider's own response.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <p className="mt-4 flex items-start gap-1.5 text-xs text-slate-500 leading-relaxed">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-px text-[#06D369]" aria-hidden="true" />
            <span>
              Server-side defaults come from backend/.env (OPENROUTER_API_KEY, LLM_PROVIDER, LLM_MODEL);
              saving here overrides them in backend/ai_config.json. Only the model's final answer is
              displayed — internal reasoning tokens are stripped by the backend and never rendered.
            </span>
          </p>
        </section>

        {/* --------------------------- Conversation ------------------------- */}
        <section className={panel}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-lg font-bold text-white shrink-0">Conversation</h2>
              <span
                className="text-xs font-mono text-[#2FD9C7] bg-[#2FD9C7]/10 border border-[#2FD9C7]/25 rounded-md px-2 py-0.5 truncate max-w-[240px]"
                title={status?.model ?? model}
              >
                {status?.model ?? model}
              </span>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors shrink-0"
                onClick={() => {
                  setMessages([]);
                  setChatError(null);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                Clear
              </button>
            )}
          </div>

          <div
            ref={scrollRef}
            className="h-[380px] sm:h-[440px] overflow-y-auto rounded-xl border border-[#252D38] bg-[#15191F] p-4 flex flex-col gap-4"
            aria-live="polite"
            aria-label="Conversation"
          >
            {!canChat ? (
              <NotConfiguredState />
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="w-12 h-12 rounded-xl bg-[#2FD9C7]/10 border border-[#2FD9C7]/25 flex items-center justify-center mb-4">
                  <Send className="w-5 h-5 text-[#2FD9C7]" aria-hidden="true" />
                </div>
                <p className="text-sm text-slate-300 font-medium mb-1">Start the conversation</p>
                <p className="text-sm text-slate-400 max-w-md">
                  Messages are sent to{' '}
                  <span className="text-slate-200 font-medium">{status?.model ?? model}</span> through the
                  PhishYou backend, which forwards them to {status?.providerLabel ?? 'the provider'} and
                  returns the real response.
                </p>
              </div>
            ) : (
              messages.map((m) => <MessageBubble key={m.id} msg={m} />)
            )}

            {sending && (
              <div className="flex flex-col items-start">
                <p className="text-[10px] uppercase tracking-wider mb-1 text-[#2FD9C7]/70">Assistant</p>
                <div className="bg-[#1D232D] border border-[#2D3748] rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#2FD9C7]" aria-hidden="true" />
                  <span className="text-sm text-slate-400">Thinking…</span>
                </div>
              </div>
            )}
          </div>

          {chatError && (
            <div className="mt-3 rounded-lg border border-[#FF4757]/30 bg-[#FF4757]/10 px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-[#FF4757] shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#FF4757]">
                  {chatError.errorKind ? `${ERROR_KIND_LABELS[chatError.errorKind] ?? 'Error'} — ` : ''}
                  {chatError.error}
                </p>
                <div className="mt-2 flex items-center gap-4">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#FF4757] hover:text-[#ff6b7d] transition-colors disabled:opacity-50"
                    onClick={retry}
                    disabled={sending}
                  >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    Retry
                  </button>
                  <button
                    type="button"
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                    onClick={() => setChatError(null)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          <form className="mt-4 flex items-end gap-3" onSubmit={submit}>
            <textarea
              className={`${input} flex-1 resize-none`}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={
                canChat
                  ? 'Send a message — Enter to send, Shift+Enter for a new line'
                  : 'Configure the provider first…'
              }
              maxLength={8000}
              disabled={!canChat || sending}
              aria-label="Chat message"
            />
            <button
              type="submit"
              className={`${primaryButton} shrink-0 h-[42px]`}
              disabled={!canChat || sending || !input.trim()}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="w-4 h-4" aria-hidden="true" />
              )}
              Send
            </button>
          </form>
          {connStatus === 'error' && status?.lastError && (
            <p className="mt-3 text-xs text-[#FF4757]">
              Last provider error: {status.lastError}
              {status.lastTestedAt ? ` (tested ${fmtTested(status.lastTestedAt)})` : ''}
            </p>
          )}
          {connStatus === 'connected' && status?.lastTestedAt && (
            <p className="mt-3 text-xs text-slate-500">
              Last verified {fmtTested(status.lastTestedAt)} — the connection test makes a real request
              to the provider, it never trusts filled-in fields.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
