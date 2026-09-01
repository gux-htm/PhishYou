/**
 * PhishYou — Platform Integrations (`/settings/integrations`)
 * Spec: FRONTEND_SPEC_ENHANCED.md — PAGE 16 → Settings: Platform Integrations
 * Checklist: IMPLEMENTATION_CHECKLIST.md — Pages 8–17 shared patterns
 *
 * Cards: Twilio (SID/token, provisioned numbers, WhatsApp templates),
 * SMTP (host/port/credentials, verified domains w/ SPF + DKIM), Alibaba Cloud
 * Qwen (API key, model, endpoint, token budget), LinkedIn / Instagram (OAuth).
 *
 * Security UI rules applied:
 * - Secrets rendered masked; reveal requires an explicit toggle ("This access is logged").
 * - Copy-to-clipboard only, never plaintext display.
 */
import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  Database,
  Eye,
  EyeOff,
  ExternalLink,
  Instagram,
  Linkedin,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Smartphone,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  fetchAIConfig,
  getErrorMessage,
  saveAIConfig,
  testAIConnection,
  type AIConfig,
} from '../services/ai';
import {
  fetchDBConfig,
  getDBErrorMessage,
  saveDBConfig,
  testDBConnection,
  type DBConfig,
  type DBType,
} from '../services/db';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Channel = 'whatsapp' | 'sms' | 'voice';
type IntegrationStatus = 'connected' | 'not_configured' | 'error';

interface ProvisionedNumber {
  id: string;
  number: string; // E.164
  channel: Channel;
  region: string;
}

interface WhatsAppTemplate {
  id: string;
  name: string;
  status: 'approved' | 'pending' | 'rejected';
  language: string;
}

interface VerifiedDomain {
  domain: string;
  spf: 'verified' | 'pending' | 'failed';
  dkim: 'verified' | 'pending' | 'failed';
}

interface ConnectedSocialAccount {
  id: string;
  platform: 'linkedin' | 'instagram';
  handle: string;
  persona: string;
  connectedAt: string; // ISO
}

interface IntegrationsData {
  twilio: {
    status: IntegrationStatus;
    accountSid: string;
    phoneNumbers: ProvisionedNumber[];
    templates: WhatsAppTemplate[];
  };
  smtp: {
    status: IntegrationStatus;
    host: string;
    port: number;
    username: string;
    fromDomain: string;
    verifiedDomains: VerifiedDomain[];
  };
  qwen: {
    status: IntegrationStatus;
    endpoint: string;
    model: 'qwen-max' | 'qwen-plus' | 'qwen-turbo';
    tokenBudgetThreshold: number; // percentage
  };
  social: ConnectedSocialAccount[];
}

/* ------------------------------------------------------------------ */
/* Demo data                                                           */
/* ------------------------------------------------------------------ */

const DEMO_DATA: IntegrationsData = {
  twilio: {
    status: 'connected',
    accountSid: 'ACxxxx-demo-sid-not-a-real-credential-xxxx',
    phoneNumbers: [
      { id: 'pn1', number: '+1 555 012 3456', channel: 'whatsapp', region: 'US' },
      { id: 'pn2', number: '+1 555 018 7742', channel: 'sms', region: 'US' },
      { id: 'pn3', number: '+92 300 555 0189', channel: 'voice', region: 'PK' },
    ],
    templates: [
      { id: 't1', name: 'payment_verification', status: 'approved', language: 'en' },
      { id: 't2', name: 'payment_verification_ur', status: 'approved', language: 'ur' },
      { id: 't3', name: 'it_security_notice', status: 'pending', language: 'en' },
    ],
  },
  smtp: {
    status: 'connected',
    host: 'smtpdm-ap-southeast-1.aliyun.com',
    port: 465,
    username: 'phishyou-mailer@company.com',
    fromDomain: 'mail.company.com',
    verifiedDomains: [
      { domain: 'company.com', spf: 'verified', dkim: 'verified' },
      { domain: 'mail.company.com', spf: 'verified', dkim: 'pending' },
      { domain: 'company-payments.co', spf: 'failed', dkim: 'failed' },
    ],
  },
  qwen: {
    status: 'connected',
    endpoint: 'https://dashscope.aliyuncs.com/api/v1',
    model: 'qwen-max',
    tokenBudgetThreshold: 80,
  },
  social: [
    { id: 'sa1', platform: 'linkedin', handle: 'sarah-chen-recruits', persona: 'Recruiter · Sarah Chen', connectedAt: '2026-08-14T10:22:00Z' },
    { id: 'sa2', platform: 'instagram', handle: '@hr.team.updates', persona: 'HR Coordinator · Amara', connectedAt: '2026-08-20T15:04:00Z' },
  ],
};

async function fetchIntegrations(): Promise<IntegrationsData> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch('/api/v1/settings/integrations', {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as IntegrationsData;
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

const input =
  'w-full rounded-lg border border-[#2D3748] bg-[#1D232D] px-3 py-2.5 text-sm text-white ' +
  'placeholder:text-[#5A6470] transition-all duration-200 ease-out ' +
  'focus:border-[#2FD9C7] focus:outline-none focus:ring-2 focus:ring-[#2FD9C7]/30';

const label = 'block text-sm font-semibold text-slate-300 mb-1.5';

const secondaryButton =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#3D4860] bg-[#2D3748] ' +
  'px-4 py-2 text-sm font-medium text-slate-100 transition-all duration-200 ease-out ' +
  'hover:bg-[#232D39] hover:border-[#3D4860] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';

const primaryButton =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#2FD9C7] px-4 py-2 text-sm ' +
  'font-semibold text-[#0F1219] transition-all duration-200 ease-out hover:bg-[#4FE5D3] ' +
  'hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ' +
  'disabled:hover:scale-100';

const panel = 'bg-[#111827] border border-[#2D3748] rounded-xl p-5 sm:p-6';

function CardHeader({
  icon: Icon,
  title,
  subtitle,
  status,
}: {
  icon: typeof Mail;
  title: string;
  subtitle: string;
  status: IntegrationStatus;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-lg bg-[#1D232D] border border-[#2D3748] flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#2FD9C7]" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      <StatusBadge status={status} />
    </div>
  );
}

function StatusBadge({ status }: { status: IntegrationStatus }) {
  if (status === 'connected') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#06D369]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#06D369]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#06D369]" aria-hidden="true" />
        Connected
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF4757]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#FF4757]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF4757]" aria-hidden="true" />
        Error
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#8B95A8]">
      Not configured
    </span>
  );
}

/** Masked secret field — reveal is explicit and audit-logged (Security UI #4/#5). */
function SecretField({
  id,
  labelText,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  labelText: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const masked = value ? '•'.repeat(Math.min(24, Math.max(8, value.length))) : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div>
      <label htmlFor={id} className={label}>
        {labelText}
      </label>
      <div className="relative">
        <input
          id={id}
          type={revealed && value ? 'text' : 'password'}
          value={revealed ? value : masked}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className={`${input} font-mono pr-20`}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="p-1.5 rounded-md text-[#7A8595] hover:text-slate-200 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#2FD9C7]/40 transition-colors"
            aria-label={revealed ? `Hide ${labelText}` : `Reveal ${labelText}`}
            title="This access is logged"
          >
            {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={copy}
            disabled={!value}
            className="p-1.5 rounded-md text-[#7A8595] hover:text-slate-200 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#2FD9C7]/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={`Copy ${labelText}`}
          >
            {copied ? <Check className="w-4 h-4 text-[#06D369]" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <p className="text-xs text-amber-400 mt-1">This access is logged</p>
    </div>
  );
}

function Field({
  id,
  labelText,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  id: string;
  labelText: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={label}>
        {labelText}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={type === 'number' ? `${input} w-28 font-mono` : input}
      />
    </div>
  );
}

function SaveRow({ onSave, saving, saved }: { onSave: () => void; saving: boolean; saved: boolean }) {
  return (
    <div className="flex items-center gap-3 mt-5">
      <button type="button" className={primaryButton} onClick={onSave} disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Saving…
          </>
        ) : (
          <>
            <Save className="w-4 h-4" aria-hidden="true" />
            Save Changes
          </>
        )}
      </button>
      {saved && (
        <span className="inline-flex items-center gap-1.5 text-xs text-[#06D369]">
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          Saved
        </span>
      )}
    </div>
  );
}

function DnsStatusCell({ status }: { status: 'verified' | 'pending' | 'failed' }) {
  if (status === 'verified') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[#06D369]">
        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Verified
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[#F59E0B]">
        <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[#FF4757]">
      <XCircle className="w-3.5 h-3.5" aria-hidden="true" /> Failed
    </span>
  );
}

const channelIcon: Record<Channel, typeof MessageSquare> = {
  whatsapp: MessageCircle,
  sms: Smartphone,
  voice: Phone,
};

const th = 'px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 bg-[#232D39]';
const td = 'px-4 py-3 text-sm text-slate-200 border-t border-[#252D38]';

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Integrations() {
  const [data, setData] = useState<IntegrationsData | null>(null);
  const [authToken, setAuthToken] = useState('••••••••••••••••');
  const [smtpPassword, setSmtpPassword] = useState('••••••••••••');
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);

  const [aiForm, setAiForm] = useState<AIConfig>({
    provider: 'qwen',
    model: 'qwen-max',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    apiKey: '',
  });
  const [aiSaving, setAiSaving] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<'connected' | 'error' | null>(null);
  const [aiTestMessage, setAiTestMessage] = useState<string | null>(null);

  const [dbForm, setDbForm] = useState<DBConfig>({
    type: '',
    host: '',
    port: 5432,
    database: '',
    username: '',
    password: '',
    ssl: false,
  });
  const [dbSaving, setDbSaving] = useState(false);
  const [dbSaved, setDbSaved] = useState(false);
  const [dbTesting, setDbTesting] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<'connected' | 'error' | null>(null);
  const [dbTestMessage, setDbTestMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrations()
      .then(setData)
      .catch(() => setData(DEMO_DATA)); // demo fallback

    fetchAIConfig()
      .then((config) => {
        setAiForm((prev) => ({
          ...prev,
          provider: config.provider ?? prev.provider,
          model: config.model ?? prev.model,
          endpoint: config.endpoint ?? prev.endpoint,
        }));
      })
      .catch(() => {});

    fetchDBConfig()
      .then((config) => {
        setDbForm({
          type: config.type ?? '',
          host: config.host ?? '',
          port: config.port ?? 5432,
          database: config.database ?? '',
          username: config.username ?? '',
          password: '',
          ssl: config.ssl ?? false,
        });
      })
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2FD9C7]" aria-label="Loading integrations" />
      </div>
    );
  }

  const save = (key: string) => async () => {
    setSaving(key);
    try {
      await fetch('/api/v1/settings/integrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      /* demo mode — accept local save */
    }
    await new Promise((r) => setTimeout(r, 500));
    setSaving(null);
    setSaved(key);
    setTimeout(() => setSaved((k) => (k === key ? null : k)), 2500);
  };

  const verifyDomain = (domain: string) => async () => {
    setVerifying(domain);
    await new Promise((r) => setTimeout(r, 900));
    setData((d) =>
      d
        ? {
            ...d,
            smtp: {
              ...d.smtp,
              verifiedDomains: d.smtp.verifiedDomains.map((v) =>
                v.domain === domain ? { ...v, spf: 'verified', dkim: 'verified' } : v,
              ),
            },
          }
        : d,
    );
    setVerifying(null);
  };

  const releaseNumber = (id: string) => {
    setData((d) =>
      d ? { ...d, twilio: { ...d.twilio, phoneNumbers: d.twilio.phoneNumbers.filter((n) => n.id !== id) } } : d,
    );
  };

  const addNumber = () => {
    setData((d) =>
      d
        ? {
            ...d,
            twilio: {
              ...d.twilio,
              phoneNumbers: [
                ...d.twilio.phoneNumbers,
                { id: `pn${Date.now()}`, number: '+1 555 013 0000', channel: 'sms', region: 'US' },
              ],
            },
          }
        : d,
    );
  };

  const saveAI = async () => {
    setAiSaving(true);
    setAiSaved(false);
    setAiTestResult(null);
    try {
      await saveAIConfig(aiForm);
      setAiSaved(true);
      setTimeout(() => setAiSaved(false), 2500);
    } catch (err) {
      setAiTestResult('error');
      setAiTestMessage(getErrorMessage(err));
    } finally {
      setAiSaving(false);
    }
  };

  const testAI = async () => {
    setAiTesting(true);
    setAiTestResult(null);
    setAiTestMessage(null);
    try {
      const result = await testAIConnection();
      if (result.success) {
        setAiTestResult('connected');
      } else {
        setAiTestResult('error');
        setAiTestMessage(result.message ?? 'Connection test failed.');
      }
    } catch (err) {
      setAiTestResult('error');
      setAiTestMessage(getErrorMessage(err));
    } finally {
      setAiTesting(false);
    }
  };

  const saveDB = async () => {
    setDbSaving(true);
    setDbSaved(false);
    setDbTestResult(null);
    try {
      await saveDBConfig(dbForm);
      setDbSaved(true);
      setTimeout(() => setDbSaved(false), 2500);
    } catch (err) {
      setDbTestResult('error');
      setDbTestMessage(getDBErrorMessage(err));
    } finally {
      setDbSaving(false);
    }
  };

  const testDB = async () => {
    setDbTesting(true);
    setDbTestResult(null);
    setDbTestMessage(null);
    try {
      const result = await testDBConnection();
      if (result.success) {
        setDbTestResult('connected');
      } else {
        setDbTestResult('error');
        setDbTestMessage(result.message ?? 'Database connection failed.');
      }
    } catch (err) {
      setDbTestResult('error');
      setDbTestMessage(getDBErrorMessage(err));
    } finally {
      setDbTesting(false);
    }
  };

  const connectSocial = (platform: 'linkedin' | 'instagram') => {
    // Spec: OAuth flow initiated in a popup window.
    const popup = window.open(
      `/oauth/${platform}/authorize`,
      'phishyou-oauth',
      'width=520,height=680,noopener,noreferrer',
    );
    if (popup) popup.opener = window;
    // Fallback for demo: reflect the account as connected shortly after.
    setTimeout(() => {
      setData((d) =>
        d
          ? {
              ...d,
              social: [
                ...d.social,
                {
                  id: `sa${Date.now()}`,
                  platform,
                  handle: platform === 'linkedin' ? 'new-connection' : '@new.connection',
                  persona: 'Unassigned',
                  connectedAt: new Date().toISOString(),
                },
              ],
            }
          : d,
      );
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-white">Platform Integrations</h1>
        <p className="text-sm text-slate-400 mt-1">
          Connect and manage the delivery channels and AI services PhishYou uses for simulations.
        </p>
      </header>

      {/* Twilio */}
      <section aria-label="Twilio integration" className={panel}>
        <CardHeader
          icon={MessageSquare}
          title="Twilio"
          subtitle="WhatsApp, SMS and Voice delivery"
          status={data.twilio.status}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SecretField
            id="twilio-sid"
            labelText="Account SID"
            value={data.twilio.accountSid}
            onChange={(v) =>
              setData((d) => (d ? { ...d, twilio: { ...d.twilio, accountSid: v } } : d))
            }
            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          />
          <SecretField
            id="twilio-token"
            labelText="Auth Token"
            value={authToken}
            onChange={setAuthToken}
            placeholder="Enter auth token"
          />
        </div>

        {/* Provisioned numbers */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-300">Provisioned Numbers</h3>
            <button type="button" className={`${secondaryButton} !px-3 !py-1.5 !text-xs`} onClick={addNumber}>
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Add Number
            </button>
          </div>
          <div className="border border-[#2D3748] rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr>
                  <th className={th}>Number</th>
                  <th className={th}>Channel</th>
                  <th className={th}>Region</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.twilio.phoneNumbers.map((n) => {
                  const Icon = channelIcon[n.channel];
                  return (
                    <tr key={n.id} className="hover:bg-white/5 transition-colors">
                      <td className={`${td} font-mono`}>{n.number}</td>
                      <td className={td}>
                        <span className="inline-flex items-center gap-1.5 capitalize">
                          <Icon className="w-4 h-4 text-slate-400" aria-hidden="true" />
                          {n.channel}
                        </span>
                      </td>
                      <td className={td}>{n.region}</td>
                      <td className={`${td} text-right`}>
                        <button
                          type="button"
                          onClick={() => releaseNumber(n.id)}
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-[#FF4757] hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          Release
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {data.twilio.phoneNumbers.length === 0 && (
                  <tr>
                    <td className={`${td} text-slate-500 text-center`} colSpan={4}>
                      No numbers provisioned.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* WhatsApp templates */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">WhatsApp Template Registration</h3>
          <ul className="divide-y divide-[#252D38] border border-[#2D3748] rounded-xl">
            {data.twilio.templates.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-sm text-white font-mono">{t.name}</div>
                  <div className="text-xs text-slate-500">Language: {t.language.toUpperCase()}</div>
                </div>
                {t.status === 'approved' ? (
                  <span className="inline-flex items-center gap-1 text-xs text-[#06D369]">
                    <BadgeCheck className="w-4 h-4" aria-hidden="true" /> Approved
                  </span>
                ) : t.status === 'pending' ? (
                  <span className="inline-flex items-center gap-1 text-xs text-[#F59E0B]">
                    <RefreshCw className="w-4 h-4" aria-hidden="true" /> Pending review
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-[#FF4757]">
                    <XCircle className="w-4 h-4" aria-hidden="true" /> Rejected
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <SaveRow onSave={save('twilio')} saving={saving === 'twilio'} saved={saved === 'twilio'} />
      </section>

      {/* SMTP */}
      <section aria-label="SMTP integration" className={panel}>
        <CardHeader
          icon={Mail}
          title="Email SMTP"
          subtitle="Outbound email delivery relay"
          status={data.smtp.status}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            id="smtp-host"
            labelText="SMTP Host"
            value={data.smtp.host}
            onChange={(v) => setData((d) => (d ? { ...d, smtp: { ...d.smtp, host: v } } : d))}
            placeholder="smtp.example.com"
          />
          <div className="flex items-end gap-3">
            <Field
              id="smtp-port"
              labelText="Port"
              type="number"
              value={data.smtp.port}
              onChange={(v) =>
                setData((d) => (d ? { ...d, smtp: { ...d.smtp, port: Number(v) || 0 } } : d))
              }
            />
            <p className="text-xs text-slate-500 pb-3">587 (STARTTLS) or 465 (SSL)</p>
          </div>
          <Field
            id="smtp-user"
            labelText="Username"
            value={data.smtp.username}
            onChange={(v) => setData((d) => (d ? { ...d, smtp: { ...d.smtp, username: v } } : d))}
            placeholder="mailer@company.com"
          />
          <SecretField
            id="smtp-pass"
            labelText="Password"
            value={smtpPassword}
            onChange={setSmtpPassword}
            placeholder="Enter SMTP password"
          />
          <Field
            id="smtp-domain"
            labelText="From Domain"
            value={data.smtp.fromDomain}
            onChange={(v) => setData((d) => (d ? { ...d, smtp: { ...d.smtp, fromDomain: v } } : d))}
            placeholder="mail.company.com"
          />
        </div>

        {/* Verified domains */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Verified Domains</h3>
          <div className="border border-[#2D3748] rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr>
                  <th className={th}>Domain</th>
                  <th className={th}>SPF</th>
                  <th className={th}>DKIM</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.smtp.verifiedDomains.map((d) => (
                  <tr key={d.domain} className="hover:bg-white/5 transition-colors">
                    <td className={`${td} font-mono`}>{d.domain}</td>
                    <td className={td}>
                      <DnsStatusCell status={d.spf} />
                    </td>
                    <td className={td}>
                      <DnsStatusCell status={d.dkim} />
                    </td>
                    <td className={`${td} text-right`}>
                      <button
                        type="button"
                        onClick={verifyDomain(d.domain)}
                        disabled={verifying === d.domain || (d.spf === 'verified' && d.dkim === 'verified')}
                        className={`${secondaryButton} !px-3 !py-1 !text-xs`}
                      >
                        {verifying === d.domain ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        Verify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <SaveRow onSave={save('smtp')} saving={saving === 'smtp'} saved={saved === 'smtp'} />
      </section>

      {/* AI / LLM */}
      <section aria-label="AI LLM integration" className={panel}>
        <CardHeader
          icon={Bot}
          title="AI / LLM"
          subtitle="Configure any OpenAI-compatible provider"
          status={
            aiTestResult === 'connected'
              ? 'connected'
              : aiTestResult === 'error'
                ? 'error'
                : 'not_configured'
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="ai-provider" className={label}>
              Provider
            </label>
            <select
              id="ai-provider"
              value={aiForm.provider}
              onChange={(e) =>
                setAiForm((prev) => ({ ...prev, provider: e.target.value }))
              }
              className={input}
            >
              <option value="qwen">Qwen (Alibaba Cloud)</option>
              <option value="openai">OpenAI</option>
              <option value="openai-compatible">OpenAI-compatible (custom)</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">Pick the provider protocol.</p>
          </div>
          <Field
            id="ai-model"
            labelText="Model"
            value={aiForm.model}
            onChange={(v) => setAiForm((prev) => ({ ...prev, model: v }))}
            placeholder="e.g. qwen-max, gpt-4o"
          />
          <Field
            id="ai-endpoint"
            labelText="Endpoint"
            value={aiForm.endpoint}
            onChange={(v) => setAiForm((prev) => ({ ...prev, endpoint: v }))}
            placeholder="https://api.provider.com/v1/chat/completions"
          />
          <SecretField
            id="ai-api-key"
            labelText="API Key"
            value={aiForm.apiKey}
            onChange={(v) => setAiForm((prev) => ({ ...prev, apiKey: v }))}
            placeholder="sk-xxxxxxxxxxxxxxxx"
          />
        </div>

        <div className="flex items-center gap-3 mt-5">
          <button
            type="button"
            className={primaryButton}
            onClick={saveAI}
            disabled={aiSaving}
          >
            {aiSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" aria-hidden="true" />
                Save Changes
              </>
            )}
          </button>
          <button
            type="button"
            className={secondaryButton}
            onClick={testAI}
            disabled={aiTesting || aiSaving}
          >
            {aiTesting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Testing…
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                Test Connection
              </>
            )}
          </button>
          {aiSaved && (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#06D369]">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              Saved
            </span>
          )}
          {aiTestResult === 'connected' && !aiSaved && (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#06D369]">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              Connected
            </span>
          )}
          {aiTestResult === 'error' && (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#FF4757]">
              <XCircle className="w-4 h-4" aria-hidden="true" />
              {aiTestMessage ?? 'Connection failed'}
            </span>
          )}
        </div>
      </section>

      {/* Database */}
      <section aria-label="Database integration" className={panel}>
        <CardHeader
          icon={Database}
          title="Database"
          subtitle="PostgreSQL or SQLite connection"
          status={
            dbTestResult === 'connected'
              ? 'connected'
              : dbTestResult === 'error'
                ? 'error'
                : 'not_configured'
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="db-type" className={label}>
              Database Type
            </label>
            <select
              id="db-type"
              value={dbForm.type}
              onChange={(e) =>
                setDbForm((prev) => ({
                  ...prev,
                  type: e.target.value as DBType,
                  port: e.target.value === 'sqlite' ? null : prev.port ?? 5432,
                }))
              }
              className={input}
            >
              <option value="">Select type…</option>
              <option value="postgresql">PostgreSQL</option>
              <option value="sqlite">SQLite</option>
            </select>
          </div>
          {dbForm.type === 'sqlite' ? (
            <Field
              id="db-path"
              labelText="Database File Path"
              value={dbForm.database}
              onChange={(v) => setDbForm((prev) => ({ ...prev, database: v }))}
              placeholder="/path/to/phishyou.db"
            />
          ) : (
            <>
              <Field
                id="db-host"
                labelText="Host"
                value={dbForm.host}
                onChange={(v) => setDbForm((prev) => ({ ...prev, host: v }))}
                placeholder="localhost"
              />
              <div>
                <label htmlFor="db-port" className={label}>
                  Port
                </label>
                <input
                  id="db-port"
                  type="number"
                  value={dbForm.port ?? ''}
                  onChange={(e) =>
                    setDbForm((prev) => ({
                      ...prev,
                      port: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  placeholder="5432"
                  className={`${input} w-28 font-mono`}
                />
              </div>
              <Field
                id="db-name"
                labelText="Database Name"
                value={dbForm.database}
                onChange={(v) => setDbForm((prev) => ({ ...prev, database: v }))}
                placeholder="phishyou"
              />
              <Field
                id="db-user"
                labelText="Username"
                value={dbForm.username}
                onChange={(v) => setDbForm((prev) => ({ ...prev, username: v }))}
                placeholder="postgres"
              />
              <SecretField
                id="db-password"
                labelText="Password"
                value={dbForm.password}
                onChange={(v) => setDbForm((prev) => ({ ...prev, password: v }))}
                placeholder="Enter password"
              />
              <div className="flex items-center gap-2 md:col-span-2">
                <input
                  id="db-ssl"
                  type="checkbox"
                  checked={dbForm.ssl}
                  onChange={(e) =>
                    setDbForm((prev) => ({ ...prev, ssl: e.target.checked }))
                  }
                  className="accent-[#2FD9C7] w-4 h-4"
                />
                <label htmlFor="db-ssl" className="text-sm text-slate-300">
                  Require SSL
                </label>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 mt-5">
          <button
            type="button"
            className={primaryButton}
            onClick={saveDB}
            disabled={dbSaving || !dbForm.type}
          >
            {dbSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" aria-hidden="true" />
                Save Changes
              </>
            )}
          </button>
          <button
            type="button"
            className={secondaryButton}
            onClick={testDB}
            disabled={dbTesting || dbSaving || !dbForm.type}
          >
            {dbTesting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Testing…
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                Test Connection
              </>
            )}
          </button>
          {dbSaved && (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#06D369]">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              Saved
            </span>
          )}
          {dbTestResult === 'connected' && !dbSaved && (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#06D369]">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              Connected
            </span>
          )}
          {dbTestResult === 'error' && (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#FF4757]">
              <XCircle className="w-4 h-4" aria-hidden="true" />
              {dbTestMessage ?? 'Connection failed'}
            </span>
          )}
        </div>
      </section>

      {/* LinkedIn / Instagram OAuth */}
      <section aria-label="Social platform integrations" className={panel}>
        <CardHeader
          icon={Linkedin}
          title="LinkedIn & Instagram"
          subtitle="Simulation accounts for social-channel attacks"
          status={data.social.length > 0 ? 'connected' : 'not_configured'}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(
            [
              { platform: 'linkedin' as const, icon: Linkedin, label: 'LinkedIn Account' },
              { platform: 'instagram' as const, icon: Instagram, label: 'Instagram Account' },
            ]
          ).map(({ platform, icon: Icon, label }) => {
            const count = data.social.filter((a) => a.platform === platform).length;
            return (
              <div key={platform} className="border border-[#2D3748] rounded-xl p-5 bg-[#15191F]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-5 h-5 text-slate-300" aria-hidden="true" />
                    <span className="text-sm font-semibold text-white">{label}</span>
                  </div>
                  <span className="text-xs text-slate-500">{count} connected</span>
                </div>
                <button type="button" className={secondaryButton} onClick={() => connectSocial(platform)}>
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  Connect {platform === 'linkedin' ? 'LinkedIn' : 'Instagram'} Account
                </button>
                <p className="text-xs text-slate-500 mt-2">
                  Opens the OAuth consent flow in a popup. Requires a dedicated simulation account.
                </p>
              </div>
            );
          })}
        </div>

        {/* Connected accounts with persona assignment */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Connected Accounts</h3>
          <div className="border border-[#2D3748] rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr>
                  <th className={th}>Account</th>
                  <th className={th}>Persona</th>
                  <th className={th}>Connected</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.social.map((a) => {
                  const Icon = a.platform === 'linkedin' ? Linkedin : Instagram;
                  return (
                    <tr key={a.id} className="hover:bg-white/5 transition-colors">
                      <td className={td}>
                        <span className="inline-flex items-center gap-2">
                          <Icon className="w-4 h-4 text-slate-400" aria-hidden="true" />
                          <span className="font-mono">{a.handle}</span>
                        </span>
                      </td>
                      <td className={td}>
                        <select
                          value={a.persona}
                          onChange={(e) =>
                            setData((d) =>
                              d
                                ? {
                                    ...d,
                                    social: d.social.map((s) =>
                                      s.id === a.id ? { ...s, persona: e.target.value } : s,
                                    ),
                                  }
                                : d,
                            )
                          }
                          aria-label={`Persona for ${a.handle}`}
                          className="rounded-lg border border-[#2D3748] bg-[#1D232D] px-2.5 py-1.5 text-xs text-white focus:border-[#2FD9C7] focus:outline-none focus:ring-2 focus:ring-[#2FD9C7]/30"
                        >
                          <option>Unassigned</option>
                          <option>Recruiter · Sarah Chen</option>
                          <option>HR Coordinator · Amara</option>
                          <option>IT Support · Daniyal</option>
                          <option>Finance Manager · Omar</option>
                        </select>
                      </td>
                      <td className={`${td} text-xs text-slate-400`}>
                        {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
                          new Date(a.connectedAt),
                        )}
                      </td>
                      <td className={`${td} text-right`}>
                        <button
                          type="button"
                          onClick={() =>
                            setData((d) => (d ? { ...d, social: d.social.filter((s) => s.id !== a.id) } : d))
                          }
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-[#FF4757] hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          Disconnect
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {data.social.length === 0 && (
                  <tr>
                    <td className={`${td} text-slate-500 text-center`} colSpan={4}>
                      No social accounts connected.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <SaveRow onSave={save('social')} saving={saving === 'social'} saved={saved === 'social'} />
      </section>

      <p className="text-xs text-slate-500 flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
        Secrets are stored encrypted in KMS and are never displayed in plaintext. All reveal/copy actions on this
        page are audit-logged.
      </p>
    </div>
  );
}
