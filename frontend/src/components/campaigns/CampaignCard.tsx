/**
 * PhishYou — Campaign card
 * Spec: FRONTEND_SPEC_ENHANCED.md — PAGE 3: Campaign List (card layout)
 *
 * Summary card for the campaign grid: name, status + tier badges, platform
 * icons, target progress bar, compromised/defended split, avg resistance gauge
 * (signature element, sm size) and per-status CTAs (View Details / Live
 * Monitor / View AAR).
 */
import { Link } from 'react-router-dom';
import { BarChart3, ChevronRight, Mail, MessageCircle, Phone, Radio, Smartphone, Users } from 'lucide-react';
import type { CampaignSummary, Platform } from '../../types';
import { ResistanceScoreGauge } from '../common/ResistanceScoreGauge';
import {
  STATUS_BADGE_CLASS,
  TIER_BADGE_CLASS,
  TIER_LABEL,
  formatDate,
  platformLabel,
  statusLabel,
} from '../../utils/formatters';

export interface CampaignCardProps {
  campaign: CampaignSummary;
  /** Stagger animation index (py-fade-up delay classes). */
  index?: number;
}

const PLATFORM_ICON: Record<Platform, typeof Mail> = {
  email: Mail,
  whatsapp: MessageCircle,
  sms: Smartphone,
  voice: Phone,
  linkedin: MessageCircle,
  instagram: MessageCircle,
};

const PLATFORM_ICON_CLASS = 'h-3.5 w-3.5 text-[#7A8595]';

export function PlatformIcons({ platforms, className = PLATFORM_ICON_CLASS }: { platforms: CampaignSummary['platforms']; className?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {platforms.map((platform) => {
        const Icon = PLATFORM_ICON[platform];
        return <Icon key={platform} className={className} aria-label={platformLabel(platform)} role="img" />;
      })}
    </div>
  );
}

export function CampaignCard({ campaign, index = 0 }: CampaignCardProps) {
  const resolved = campaign.targetsResolved;
  const total = Math.max(1, campaign.targetsTotal);
  const progress = Math.round((resolved / total) * 100);
  const isActive = campaign.status === 'ACTIVE';

  return (
    <article
      className={`py-sheen py-fade-up py-fade-up-delay-${Math.min(index + 1, 4)} flex flex-col rounded-2xl border border-[#2D3748] bg-[#15191F] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[#3D4860] hover:shadow-[0_16px_34px_rgba(0,0,0,0.22)]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGE_CLASS[campaign.status]}`}
            >
              {statusLabel(campaign.status)}
            </span>
            <span
              className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TIER_BADGE_CLASS[campaign.tier]}`}
              title={`Tier ${campaign.tier} — ${TIER_LABEL[campaign.tier]}`}
            >
              Tier {campaign.tier}
            </span>
            {isActive && <span className="py-pulse-live h-2 w-2 rounded-full bg-[#2FD9C7]" aria-label="Live" />}
          </div>
          <h3 className="mt-2 truncate text-base font-bold text-[#F5F7FB]" title={campaign.name}>
            {campaign.name}
          </h3>
          <p className="mt-1 font-mono text-[10px] text-[#5A6470]">{campaign.id}</p>
        </div>
        <ResistanceScoreGauge value={campaign.avgResistanceScore} size="sm" label={campaign.name} />
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-[#7A8595]">
        <PlatformIcons platforms={campaign.platforms} />
        <span title={campaign.platforms.map(platformLabel).join(', ')}>{campaign.platforms.length} channel{campaign.platforms.length === 1 ? '' : 's'}</span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-[#A8B4C4]">
            <Users className="h-3.5 w-3.5 text-[#7A8595]" aria-hidden="true" />
            {resolved}/{campaign.targetsTotal} resolved
          </span>
          <span className="text-[#7A8595]">{progress}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#232D39]" aria-hidden="true">
          <div
            className="h-full rounded-full bg-[#2FD9C7] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-[#5A6470]">
          <span>
            <span className="text-[#FF4757]">{campaign.compromised} compromised</span>
            {' · '}
            <span className="text-[#06D369]">{campaign.defended} defended</span>
            {campaign.targetsActive > 0 && <> · {campaign.targetsActive} active</>}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#2D3748] pt-3">
        <span className="text-[10px] text-[#5A6470]">Started {formatDate(campaign.startedAt ?? campaign.createdAt)}</span>
        <div className="flex items-center gap-2">
          {campaign.status === 'COMPLETED' && (
            <Link
              to={`/campaigns/${campaign.id}/aar`}
              className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-[#3D4860] px-3 py-2 text-xs font-semibold text-[#A8B4C4] transition-colors hover:border-[#2FD9C7]/45 hover:bg-[#2FD9C7]/[0.05] hover:text-[#2FD9C7]"
            >
              <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
              AAR
            </Link>
          )}
          {isActive && (
            <Link
              to={`/campaigns/${campaign.id}/live`}
              className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-[#2FD9C7]/30 bg-[#2FD9C7]/[0.06] px-3 py-2 text-xs font-semibold text-[#8FEFE3] transition-colors hover:bg-[#2FD9C7]/[0.12]"
            >
              <Radio className="h-3.5 w-3.5" aria-hidden="true" />
              Live
            </Link>
          )}
          <Link
            to={`/campaigns/${campaign.id}`}
            className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-[#3D4860] px-3 py-2 text-xs font-semibold text-[#A8B4C4] transition-colors hover:border-[#2FD9C7]/45 hover:bg-[#2FD9C7]/[0.05] hover:text-[#2FD9C7]"
          >
            Details
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default CampaignCard;
