/**
 * PhishYou — Campaign Detail (`/campaigns/:id`)
 * Spec: FRONTEND_SPEC_ENHANCED.md — PAGE 4: Campaign Detail
 * Checklist: IMPLEMENTATION_CHECKLIST.md — Page 4: Campaign Detail
 *
 * Single-campaign command view:
 * - Header with status / tier badges, platform icons and controls:
 *   live monitor (active), pause / resume, halt (destructive, reason recorded)
 * - Milestone timeline (Created → Consent → Active → Completed/Halted)
 * - KPI strip (targets, compromised, defended, avg resistance gauge)
 * - Targets table with per-target resistance gauges and defense mechanisms
 * - Platform delivery health, AI configuration summary, and the live audit
 *   feed (LiveEventStream) with a link to the full audit log
 *
 * Data: GET /api/v1/campaigns/:id with the demo fallback from services/campaigns.
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Check,
  ChevronRight,
  Loader2,
  Pause,
  Play,
  Radio,
  StopCircle,
} from 'lucide-react';
import type { CampaignDetailData, CampaignStatus, PlatformStatusCard } from '../types';
import { getCampaignDetail, haltCampaign, setCampaignPaused } from '../services/campaigns';
import { ResistanceScoreGauge } from '../components/common/ResistanceScoreGauge';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { PageLoader } from '../components/common/LoadingState';
import { LiveEventStream } from '../components/campaigns/LiveEventStream';
import { PlatformIcons } from '../components/campaigns/CampaignCard';
import { useToast } from '../hooks/useToast';
import {
  STATUS_BADGE_CLASS,
  TIER_BADGE_CLASS,
  TIER_LABEL,
  formatDate,
  formatPercent,
  platformLabel,
  relativeTime,
  statusLabel,
} from '../utils/formatters';

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
  'w-full rounded-lg border border-[#2D3748] bg-[#1D232D] px-3 py-2.5 text-sm text-white ' +
  'transition-all duration-200 ease-out focus:border-[#2FD9C7] focus:outline-none focus:ring-2 focus:ring-[#2FD9C7]/30';

const PLATFORM_STATUS_CLASS: Record<PlatformStatusCard['status'], string> = {
  Active: 'bg-[#2FD9C7]/10 text-[#2FD9C7]',
  Blocked: 'bg-[#FF4757]/10 text-[#FF4757]',
  'Not Deployed': 'bg-[#8B95A8]/10 text-[#8B95A8]',
  Failed: 'bg-[#FF4757]/15 text-[#FF4757]',
};

const HARM_DETECTION_LABEL: Record<CampaignDetailData['config']['harmDetection'], string> = {
  tier_c_mandatory: 'Mandatory (Tier C) — auto-pause enabled',
  tier_b_enabled: 'Enabled (Tier B)',
  tier_b_disabled: 'Disabled (Tier B)',
  tier_a_disabled: 'Disabled (Tier A) — organization responsibility',
};

const HALT_REASONS = [
  'Target distress signal',
  'Policy violation detected',
  'Manual review requested',
  'Incident response drill',
  'Other',
];

export default function CampaignDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const toast = useToast();
  const [data, setData] = useState<CampaignDetailData | null>(null);
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState<'pause' | 'resume' | 'halt' | null>(null);
  const [haltOpen, setHaltOpen] = useState(false);
  const [haltReason, setHaltReason] = useState(HALT_REASONS[2]);

  useEffect(() => {
    let cancelled = false;
    getCampaignDetail(id).then(({ data: payload, demo: isDemo }) => {
      if (cancelled) return;
      setData(payload);
      setDemo(isDemo);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!data) return <PageLoader label="Loading campaign" />;

  const { campaign, milestones, targets, platforms, config, auditPreview } = data;
  const isActive = campaign.status === 'ACTIVE';
  const isPaused = campaign.status === 'PAUSED';
  const canControl = isActive || isPaused;
  const resolved = Math.max(1, campaign.targetsResolved);
  const compromiseRate = Math.round((campaign.compromised / resolved) * 100);
  const defendedRate = Math.round((campaign.defended / resolved) * 100);

  const setStatus = (status: CampaignStatus) =>
    setData((current) => (current ? { ...current, campaign: { ...current.campaign, status } } : current));

  const togglePause = async () => {
    setBusy(isPaused ? 'resume' : 'pause');
    const { demo: usedDemo } = await setCampaignPaused(id, !isPaused);
    setStatus(isPaused ? 'ACTIVE' : 'PAUSED');
    toast.success(
      isPaused ? 'Campaign resumed' : 'Campaign paused',
      usedDemo ? 'Demo mode — change applied locally.' : 'The orchestrator applied the change immediately.',
    );
    setBusy(null);
  };

  const confirmHalt = async () => {
    setBusy('halt');
    const { demo: usedDemo } = await haltCampaign(id, haltReason);
    setStatus('HALTED');
    toast.warning(
      'Campaign halted',
      usedDemo ? 'Demo mode — halt recorded locally.' : `Reason: ${haltReason}. Debrief due within 24 hours.`,
    );
    setHaltOpen(false);
    setBusy(null);
  };

  const configRows: [string, string][] = [
    ['Persona', `${config.personaName} (${config.personaId})`],
    ['Primary trigger', config.primaryTrigger],
    ['Secondary trigger', config.secondaryTrigger ?? '—'],
    ['Trigger intensity', `${config.triggerIntensity} / 5`],
    ['Attack chain', config.attackChainName],
    ['Duration', `${config.durationDays} days`],
    ['Contact window', `${config.contactWindow.from}–${config.contactWindow.to} (${config.contactWindow.timezone})`],
    ['Language', config.language],
    ['Harm detection', HARM_DETECTION_LABEL[config.harmDetection]],
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <header className="py-fade-up">
        <Link
          to="/campaigns"
          className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-[#7A8595] transition-colors hover:text-[#2FD9C7]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All campaigns
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGE_CLASS[campaign.status]}`}>
                {statusLabel(campaign.status)}
              </span>
              <span
                className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TIER_BADGE_CLASS[campaign.tier]}`}
                title={`Tier ${campaign.tier} — ${TIER_LABEL[campaign.tier]}`}
              >
                Tier {campaign.tier} · {TIER_LABEL[campaign.tier]}
              </span>
              {isActive && <span className="py-pulse-live h-2 w-2 rounded-full bg-[#2FD9C7]" aria-label="Live" />}
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">{campaign.name}</h1>
            <p className="mt-1 font-mono text-xs text-[#5A6470]">{campaign.id}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#7A8595]">
              <PlatformIcons platforms={campaign.platforms} />
              <span>Started {formatDate(campaign.startedAt ?? campaign.createdAt)}</span>
              {campaign.endsAt && <span>· Ends {formatDate(campaign.endsAt)}</span>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isActive && (
              <Link
                to={`/campaigns/${campaign.id}/live`}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-[#2FD9C7] px-4 py-2.5 text-sm font-bold text-[#0F1219] shadow-[0_10px_28px_rgba(47,217,199,0.10)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#4FE5D3] active:translate-y-0"
              >
                <Radio className="h-4 w-4" aria-hidden="true" />
                Live monitor
              </Link>
            )}
            {campaign.status === 'COMPLETED' && (
              <Link to={`/campaigns/${campaign.id}/aar`} className={secondaryButton}>
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
                View AAR
              </Link>
            )}
            {canControl && (
              <button type="button" onClick={togglePause} disabled={busy !== null} className={secondaryButton}>
                {busy === 'pause' || busy === 'resume' ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : isPaused ? (
                  <Play className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Pause className="h-4 w-4" aria-hidden="true" />
                )}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
            )}
            {canControl && (
              <button
                type="button"
                onClick={() => setHaltOpen(true)}
                disabled={busy !== null}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-[#FF4757]/40 bg-[#FF4757]/[0.06] px-4 py-2.5 text-sm font-semibold text-[#FF7B86] transition-all duration-200 hover:bg-[#FF4757]/[0.12] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <StopCircle className="h-4 w-4" aria-hidden="true" />
                Halt
              </button>
            )}
          </div>
        </div>
      </header>

      {demo && (
        <div className="rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/[0.06] px-4 py-3 text-xs text-[#F6BF5C]">
          Showing demo campaign data because the campaigns API is unavailable.
        </div>
      )}

      {/* KPI strip */}
      <section aria-label="Campaign metrics" className="grid grid-cols-2 gap-4 lg:grid-cols-4 py-fade-up py-fade-up-delay-1">
        <div className="py-sheen rounded-2xl border border-[#2D3748] bg-[#15191F] p-5">
          <div className="text-3xl font-black tracking-[-0.03em] text-white">{campaign.targetsTotal}</div>
          <div className="mt-1 text-sm text-[#A8B4C4]">Targets engaged</div>
          <div className="mt-3 text-xs text-[#7A8595]">
            {campaign.targetsActive > 0 ? (
              <span className="text-[#2FD9C7]">{campaign.targetsActive} in conversation now</span>
            ) : (
              'All targets resolved'
            )}
          </div>
        </div>
        <div className="py-sheen rounded-2xl border border-[#2D3748] bg-[#15191F] p-5">
          <div className="text-3xl font-black tracking-[-0.03em] text-[#FF4757]">{campaign.compromised}</div>
          <div className="mt-1 text-sm text-[#A8B4C4]">Compromised</div>
          <div className="mt-3 text-xs text-[#7A8595]">{compromiseRate}% of resolved targets</div>
        </div>
        <div className="py-sheen rounded-2xl border border-[#2D3748] bg-[#15191F] p-5">
          <div className="text-3xl font-black tracking-[-0.03em] text-[#06D369]">{campaign.defended}</div>
          <div className="mt-1 text-sm text-[#A8B4C4]">Defended</div>
          <div className="mt-3 text-xs text-[#7A8595]">{defendedRate}% of resolved targets</div>
        </div>
        <div className="py-sheen flex items-center gap-4 rounded-2xl border border-[#2D3748] bg-[#15191F] p-5">
          <ResistanceScoreGauge value={campaign.avgResistanceScore} size="md" label="campaign average" />
          <div>
            <div className="text-sm font-bold text-[#F5F7FB]">Avg resistance</div>
            <div className="mt-0.5 text-xs text-[#7A8595]">Lower is safer across all targets</div>
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section aria-label="Campaign milestones" className={`${panel} py-fade-up py-fade-up-delay-2`}>
        <h2 className="text-lg font-bold text-[#F5F7FB]">Progress</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {milestones.map((milestone) => {
            const reached = milestone.reachedAt !== null;
            return (
              <li key={milestone.label} className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                    reached ? 'border-[#06D369]/40 bg-[#06D369]/10 text-[#06D369]' : 'border-[#2D3748] bg-[#1D232D] text-[#5A6470]'
                  }`}
                  aria-hidden="true"
                >
                  {reached ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                </span>
                <div className="min-w-0">
                  <p className={`flex items-center gap-1.5 text-sm font-semibold ${reached ? 'text-[#F5F7FB]' : 'text-[#5A6470]'}`}>
                    {milestone.label}
                    {milestone.current && <span className="py-pulse-live h-1.5 w-1.5 rounded-full bg-[#2FD9C7]" aria-label="Current stage" />}
                  </p>
                  <p className="text-xs text-[#5A6470]">{milestone.reachedAt ? relativeTime(milestone.reachedAt) : 'Pending'}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Main grid: targets + side rail */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Targets table */}
        <section aria-label="Campaign targets" className={`${panel} lg:col-span-2`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#F5F7FB]">Targets</h2>
              <p className="mt-1 text-xs text-[#7A8595]">{targets.length} authorized targets — signed consent on file</p>
            </div>
            <Link to="/targets" className="text-xs font-semibold text-[#2FD9C7] transition-colors hover:text-[#4FE5D3]">
              Target directory →
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-[#2D3748]">
                  <th className={th}>Target</th>
                  <th className={th}>Status</th>
                  <th className={th}>Resistance</th>
                  <th className={th}>Exchanges</th>
                  <th className={th}>Last activity</th>
                  <th className={th}>
                    <span className="sr-only">Open target</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D3748]">
                {targets.map((target) => (
                  <tr key={target.id} className="transition-colors hover:bg-[#1D232D]/60">
                    <td className={td}>
                      <p className="font-semibold text-[#F5F7FB]">{target.name}</p>
                      <p className="mt-0.5 text-xs text-[#5A6470]">
                        {target.role} · {target.department}
                      </p>
                    </td>
                    <td className={td}>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGE_CLASS[target.status]}`}>
                        {statusLabel(target.status)}
                      </span>
                      {target.defenseMechanism && (
                        <p className="mt-1 text-[10px] font-medium text-[#06D369]">{target.defenseMechanism}</p>
                      )}
                    </td>
                    <td className={td}>
                      <ResistanceScoreGauge value={target.resistanceScore} size="sm" label={target.name} />
                    </td>
                    <td className={td}>{target.exchangesCount}</td>
                    <td className={td}>
                      <time dateTime={target.lastActivityAt ?? undefined}>{relativeTime(target.lastActivityAt)}</time>
                    </td>
                    <td className={`${td} text-right`}>
                      <Link
                        to={`/targets/${target.id}`}
                        aria-label={`Open ${target.name}`}
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#3D4860] p-2 text-[#7A8595] transition-colors hover:border-[#2FD9C7]/45 hover:text-[#2FD9C7]"
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Side rail */}
        <div className="space-y-6">
          <section aria-label="Platform status" className={panel}>
            <h2 className="text-lg font-bold text-[#F5F7FB]">Platform status</h2>
            <p className="mt-1 text-xs text-[#7A8595]">Channel deployment and delivery health</p>
            <ul className="mt-4 space-y-3">
              {platforms.map((platform) => (
                <li
                  key={platform.platform}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#2D3748] bg-[#1D232D] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#F5F7FB]">{platformLabel(platform.platform)}</p>
                    <p className="mt-0.5 text-xs text-[#7A8595]">
                      {platform.messagesSent} messages · {formatPercent(platform.deliveryRate)} delivered
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${PLATFORM_STATUS_CLASS[platform.status]}`}>
                    {platform.status}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="AI configuration" className={panel}>
            <h2 className="text-lg font-bold text-[#F5F7FB]">AI configuration</h2>
            <dl className="mt-4 space-y-3">
              {configRows.map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4">
                  <dt className="shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-[#5A6470]">{label}</dt>
                  <dd className="text-right text-xs text-[#A8B4C4]">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <div>
            <LiveEventStream events={auditPreview} live={isActive} maxVisible={6} />
            <Link
              to="/audit"
              className="mt-3 inline-flex min-h-10 items-center text-xs font-semibold text-[#2FD9C7] transition-colors hover:text-[#4FE5D3]"
            >
              View full audit log →
            </Link>
          </div>
        </div>
      </div>

      {/* Halt confirmation */}
      <ConfirmationDialog
        open={haltOpen}
        title="Halt this campaign?"
        description={
          <div className="space-y-4">
            <p>
              Halting stops all outbound messages immediately and starts the 24-hour debrief countdown for every engaged
              target. This action is recorded in the immutable audit log.
            </p>
            <div>
              <label htmlFor="halt-reason" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#7A8595]">
                Reason
              </label>
              <select
                id="halt-reason"
                value={haltReason}
                onChange={(event) => setHaltReason(event.target.value)}
                className={selectCls}
              >
                {HALT_REASONS.map((reason) => (
                  <option key={reason}>{reason}</option>
                ))}
              </select>
            </div>
          </div>
        }
        confirmLabel="Halt campaign"
        destructive
        busy={busy === 'halt'}
        onConfirm={confirmHalt}
        onCancel={() => {
          if (busy !== 'halt') setHaltOpen(false);
        }}
      />
    </div>
  );
}
