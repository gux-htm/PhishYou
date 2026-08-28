/**
 * PhishYou — Audit Logs (`/audit`)
 * Spec: PHISHYOU_SPECS/08_ETHICAL_FRAMEWORKS/AUDIT_LOGGING_SPEC.md
 *       FRONTEND_SPEC_ENHANCED.md — Audit Log viewer
 *
 * Immutable, hash-chained audit trail viewer:
 * - Chain integrity check: every entry references the previous entry's hash
 * - Search + event-type / actor filters (client-side)
 * - Expandable rows revealing the raw signed payload (prev_hash, algorithm)
 * - CSV and JSON exports (real client-side downloads)
 *
 * Data: GET /api/v1/audit/logs with the demo fallback from services/analytics.
 */
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  FileDown,
  FileJson,
  Link2,
  Lock,
  Pause,
  Play,
  ScrollText,
  Search,
  ShieldCheck,
  ShieldX,
  StopCircle,
  UserCog,
} from 'lucide-react';
import type { AuditEvent, AuditEventType } from '../types';
import { getAuditLogs } from '../services/analytics';
import { downloadFile } from '../services/api';
import { PageLoader } from '../components/common/LoadingState';
import { useToast } from '../hooks/useToast';
import { formatDateTime, relativeTime, shortHash, statusLabel } from '../utils/formatters';

/* ------------------------------------------------------------------ */
/* Presentation maps                                                    */
/* ------------------------------------------------------------------ */

const TYPE_META: Record<AuditEventType, { icon: typeof ScrollText; color: string; bg: string }> = {
  CAMPAIGN_CREATED: { icon: ScrollText, color: '#A8B4C4', bg: 'bg-[#8B95A8]/10' },
  CAMPAIGN_STARTED: { icon: Play, color: '#2FD9C7', bg: 'bg-[#2FD9C7]/10' },
  CAMPAIGN_PAUSED: { icon: Pause, color: '#F59E0B', bg: 'bg-[#F59E0B]/10' },
  CAMPAIGN_RESUMED: { icon: Play, color: '#2FD9C7', bg: 'bg-[#2FD9C7]/10' },
  CAMPAIGN_HALTED: { icon: StopCircle, color: '#FF4757', bg: 'bg-[#FF4757]/10' },
  CAMPAIGN_COMPLETED: { icon: CheckCircle2, color: '#06D369', bg: 'bg-[#06D369]/10' },
  TARGET_COMPROMISED: { icon: ShieldX, color: '#FF4757', bg: 'bg-[#FF4757]/12' },
  TARGET_DEFENDED: { icon: ShieldCheck, color: '#06D369', bg: 'bg-[#06D369]/10' },
  TARGET_BLOCKED: { icon: Lock, color: '#8B95A8', bg: 'bg-[#8B95A8]/10' },
  HARM_DETECTED: { icon: AlertTriangle, color: '#F59E0B', bg: 'bg-[#F59E0B]/10' },
  CONSENT_RECORDED: { icon: FileDown, color: '#5B9EFF', bg: 'bg-[#5B9EFF]/10' },
  DEBRIEF_DELIVERED: { icon: BookOpen, color: '#A78BFA', bg: 'bg-[#A78BFA]/10' },
  ADMIN_ACTION: { icon: UserCog, color: '#5B9EFF', bg: 'bg-[#5B9EFF]/10' },
  DATA_EXPORTED: { icon: FileDown, color: '#A78BFA', bg: 'bg-[#A78BFA]/10' },
  INTEGRITY_VERIFIED: { icon: ShieldCheck, color: '#06D369', bg: 'bg-[#06D369]/10' },
};

const EVENT_TYPES = Object.keys(TYPE_META) as AuditEventType[];

function typeLabel(type: AuditEventType): string {
  return statusLabel(type)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/* ------------------------------------------------------------------ */
/* Shared class strings                                                 */
/* ------------------------------------------------------------------ */

const panel = 'rounded-2xl border border-[#2D3748] bg-[#15191F] p-5 sm:p-6';
const th = 'px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-[#5A6470]';
const td = 'px-4 py-3 text-sm text-[#A8B4C4] align-middle';
const secondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-[#3D4860] bg-[#2D3748] ' +
  'px-4 py-2.5 text-sm font-medium text-slate-100 transition-all duration-200 ease-out ' +
  'hover:bg-[#232D39] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';
const selectCls =
  'rounded-lg border border-[#2D3748] bg-[#1D232D] px-3 py-2 text-sm text-white ' +
  'transition-all duration-200 ease-out focus:border-[#2FD9C7] focus:outline-none focus:ring-2 focus:ring-[#2FD9C7]/30';

const PAGE_SIZE = 20;

/** RFC-4180-style CSV cell escaping. */
function csvCell(value: string | number | null | undefined): string {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export default function AuditLogs() {
  const toast = useToast();
  const [events, setEvents] = useState<AuditEvent[] | null>(null);
  const [demo, setDemo] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<AuditEventType | 'ALL'>('ALL');
  const [actorFilter, setActorFilter] = useState<string | 'ALL'>('ALL');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAuditLogs().then(({ data, demo: isDemo }) => {
      if (cancelled) return;
      setEvents(data);
      setDemo(isDemo);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounce search so typing stays responsive.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setVisible(PAGE_SIZE);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const actors = useMemo(() => {
    const unique = new Set<string>();
    events?.forEach((event) => unique.add(event.actor));
    return Array.from(unique).sort();
  }, [events]);

  const chainBreaks = useMemo(() => {
    if (!events) return 0;
    let breaks = 0;
    for (let i = 1; i < events.length; i += 1) {
      const previous = events[i].payload?.prev_hash;
      if (previous !== events[i - 1].hash) breaks += 1;
    }
    return breaks;
  }, [events]);

  const filtered = useMemo(() => {
    if (!events) return [];
    const query = search.trim().toLowerCase();
    return events.filter((event) => {
      if (typeFilter !== 'ALL' && event.eventType !== typeFilter) return false;
      if (actorFilter !== 'ALL' && event.actor !== actorFilter) return false;
      if (
        query &&
        !`${event.summary} ${event.actor} ${event.campaignName ?? ''} ${event.targetName ?? ''} ${event.hash} ${event.id}`
          .toLowerCase()
          .includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [events, search, typeFilter, actorFilter]);

  if (!events) return <PageLoader label="Loading audit trail" />;

  const chainIntact = chainBreaks === 0;
  const harmCount = events.filter((event) => event.eventType === 'HARM_DETECTED').length;
  const campaignCount = new Set(events.map((event) => event.campaignId).filter(Boolean)).size;
  const shown = filtered.slice(0, visible);
  const hasActiveFilters = Boolean(searchInput) || typeFilter !== 'ALL' || actorFilter !== 'ALL';

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setTypeFilter('ALL');
    setActorFilter('ALL');
    setVisible(PAGE_SIZE);
  };

  const exportJson = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      entry_count: filtered.length,
      chain_verified: chainIntact,
      entries: filtered,
    };
    downloadFile(`phishyou-audit-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), 'application/json');
    toast.success('Audit log exported', `${filtered.length} entries downloaded as JSON.`);
  };

  const exportCsv = () => {
    const header = ['timestamp', 'event_type', 'actor', 'campaign', 'target', 'summary', 'hash'];
    const rows = filtered.map((event) =>
      [event.timestamp, event.eventType, event.actor, event.campaignName, event.targetName, event.summary, event.hash]
        .map(csvCell)
        .join(','),
    );
    downloadFile(`phishyou-audit-${new Date().toISOString().slice(0, 10)}.csv`, [header.join(','), ...rows].join('\n'), 'text/csv');
    toast.success('Audit log exported', `${filtered.length} entries downloaded as CSV.`);
  };

  const stats: { label: string; value: string | number; tone?: string; note?: string }[] = [
    { label: 'Total entries', value: events.length },
    {
      label: 'Chain integrity',
      value: chainIntact ? 'Verified' : `${chainBreaks} breaks`,
      tone: chainIntact ? 'text-[#06D369]' : 'text-[#FF4757]',
      note: 'prev_hash linkage',
    },
    { label: 'Campaigns referenced', value: campaignCount },
    { label: 'Harm signals', value: harmCount, tone: harmCount > 0 ? 'text-[#F59E0B]' : undefined, note: 'auto-pause triggers' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4 py-fade-up">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Audit logs</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#7A8595]">
            Append-only, hash-chained record of every campaign action, target outcome, consent record and export.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
              chainIntact
                ? 'border-[#06D369]/30 bg-[#06D369]/[0.08] text-[#58E6A0]'
                : 'border-[#FF4757]/30 bg-[#FF4757]/[0.08] text-[#FF7B86]'
            }`}
            role="status"
          >
            {chainIntact ? <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> : <ShieldX className="h-3.5 w-3.5" aria-hidden="true" />}
            {chainIntact ? 'Hash chain verified' : 'Hash chain broken'}
          </span>
          <button type="button" onClick={exportCsv} className={secondaryButton}>
            <Download className="h-4 w-4" aria-hidden="true" />
            CSV
          </button>
          <button type="button" onClick={exportJson} className={secondaryButton}>
            <FileJson className="h-4 w-4" aria-hidden="true" />
            JSON
          </button>
        </div>
      </header>

      {demo && (
        <div className="rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/[0.06] px-4 py-3 text-xs text-[#F6BF5C]">
          Showing a demo audit trail because the audit API is unavailable.
        </div>
      )}

      {/* Stats */}
      <section aria-label="Audit totals" className="grid grid-cols-2 gap-4 lg:grid-cols-4 py-fade-up py-fade-up-delay-1">
        {stats.map((stat) => (
          <div key={stat.label} className="py-sheen rounded-2xl border border-[#2D3748] bg-[#15191F] p-4">
            <div className={`text-2xl font-black tracking-[-0.03em] ${stat.tone ?? 'text-white'}`}>{stat.value}</div>
            <div className="mt-0.5 text-xs text-[#7A8595]">
              {stat.label}
              {stat.note ? <span className="text-[#5A6470]"> · {stat.note}</span> : null}
            </div>
          </div>
        ))}
      </section>

      {/* Filters */}
      <section aria-label="Audit filters" className={panel}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 lg:max-w-xs">
            <label htmlFor="audit-search" className="sr-only">
              Search audit entries
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A6470]" aria-hidden="true" />
            <input
              id="audit-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search summary, actor, hash…"
              className="w-full rounded-lg border border-[#2D3748] bg-[#1D232D] py-2 pl-9 pr-3 text-sm text-white placeholder:text-[#5A6470] transition-all duration-200 ease-out focus:border-[#2FD9C7] focus:outline-none focus:ring-2 focus:ring-[#2FD9C7]/30"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="audit-type" className="sr-only">
              Filter by event type
            </label>
            <select
              id="audit-type"
              className={selectCls}
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value as AuditEventType | 'ALL');
                setVisible(PAGE_SIZE);
              }}
            >
              <option value="ALL">All event types</option>
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {typeLabel(type)}
                </option>
              ))}
            </select>

            <label htmlFor="audit-actor" className="sr-only">
              Filter by actor
            </label>
            <select
              id="audit-actor"
              className={selectCls}
              value={actorFilter}
              onChange={(event) => {
                setActorFilter(event.target.value);
                setVisible(PAGE_SIZE);
              }}
            >
              <option value="ALL">All actors</option>
              {actors.map((actor) => (
                <option key={actor} value={actor}>
                  {actor}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-[#2FD9C7] transition-colors hover:text-[#4FE5D3]"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-[#5A6470]" aria-live="polite">
          Showing {shown.length} of {filtered.length} entries
          {filtered.length !== events.length ? ` (of ${events.length} total)` : ''}
        </p>
      </section>

      {/* Table */}
      <section aria-label="Audit entries" className="overflow-hidden rounded-2xl border border-[#2D3748] bg-[#15191F]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-[#2D3748]">
                <th className={th}>Timestamp</th>
                <th className={th}>Event</th>
                <th className={th}>Actor</th>
                <th className={th}>Campaign</th>
                <th className={th}>Target</th>
                <th className={th}>Summary</th>
                <th className={th}>Hash</th>
                <th className={th}>
                  <span className="sr-only">Expand entry</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D3748]">
              {shown.length === 0 && (
                <tr>
                  <td className="px-4 py-16 text-center text-sm text-[#7A8595]" colSpan={8}>
                    No audit entries match your filters.
                  </td>
                </tr>
              )}
              {shown.map((event) => {
                const meta = TYPE_META[event.eventType];
                const TypeIcon = meta.icon;
                const expanded = expandedId === event.id;
                return (
                  <Fragment key={event.id}>
                    <tr className="transition-colors hover:bg-[#1D232D]/60">
                      <td className={td}>
                        <p className="whitespace-nowrap font-medium text-[#F5F7FB]">{formatDateTime(event.timestamp)}</p>
                        <p className="mt-0.5 text-[10px] text-[#5A6470]">{relativeTime(event.timestamp)}</p>
                      </td>
                      <td className={td}>
                        <span className="flex items-center gap-2">
                          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${meta.bg}`}>
                            <TypeIcon className="h-3.5 w-3.5" style={{ color: meta.color }} aria-hidden="true" />
                          </span>
                          <span className="whitespace-nowrap text-xs font-semibold text-[#F5F7FB]">{typeLabel(event.eventType)}</span>
                        </span>
                      </td>
                      <td className={`${td} whitespace-nowrap font-mono text-xs`}>{event.actor}</td>
                      <td className={td}>
                        {event.campaignId ? (
                          <Link
                            to={`/campaigns/${event.campaignId}`}
                            className="text-xs text-[#2FD9C7] transition-colors hover:text-[#4FE5D3]"
                          >
                            {event.campaignName ?? event.campaignId}
                          </Link>
                        ) : (
                          <span className="text-xs text-[#5A6470]">—</span>
                        )}
                      </td>
                      <td className={`${td} whitespace-nowrap text-xs`}>{event.targetName ?? <span className="text-[#5A6470]">—</span>}</td>
                      <td className={td}>{event.summary}</td>
                      <td className={td}>
                        <code
                          className="rounded bg-[#1D232D] px-1.5 py-0.5 font-mono text-[10px] text-[#A8B4C4]"
                          title={`${event.hash} · prev ${String(event.payload?.prev_hash ?? '—')}`}
                        >
                          {shortHash(event.hash)}
                        </code>
                      </td>
                      <td className={`${td} text-right`}>
                        <button
                          type="button"
                          onClick={() => setExpandedId(expanded ? null : event.id)}
                          aria-expanded={expanded}
                          aria-label={expanded ? `Collapse entry ${shortHash(event.hash)}` : `Expand entry ${shortHash(event.hash)}`}
                          className="inline-flex min-h-10 w-10 items-center justify-center rounded-lg border border-[#3D4860] text-[#7A8595] transition-colors hover:border-[#2FD9C7]/45 hover:text-[#2FD9C7]"
                        >
                          {expanded ? <ChevronDown className="h-4 w-4" aria-hidden="true" /> : <ChevronRight className="h-4 w-4" aria-hidden="true" />}
                        </button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="bg-[#131720]">
                        <td colSpan={8} className="px-4 py-4">
                          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5A6470]">
                            <Link2 className="h-3 w-3" aria-hidden="true" />
                            Signed payload — HMAC-SHA256, chained to the previous entry
                          </p>
                          <pre className="max-h-64 overflow-auto rounded-xl border border-[#2D3748] bg-[#0F1219] p-4 font-mono text-[11px] leading-5 text-[#A8B4C4]">
                            {JSON.stringify(event.payload, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length > shown.length && (
          <div className="border-t border-[#2D3748] px-4 py-4 text-center">
            <button
              type="button"
              onClick={() => setVisible((current) => current + PAGE_SIZE)}
              className={secondaryButton}
            >
              Load {Math.min(PAGE_SIZE, filtered.length - shown.length)} more
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </section>

      <p className="text-center text-[10px] leading-4 text-[#5A6470]">
        Entries are append-only and cryptographically chained. Exports contain the same hash signatures for independent
        verification (AUDIT_LOGGING_SPEC.md §3).
      </p>
    </div>
  );
}
