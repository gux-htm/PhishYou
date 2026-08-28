/**
 * PhishYou — Campaign filter bar
 * Spec: FRONTEND_SPEC_ENHANCED.md — PAGE 3: Campaign List (filters)
 *
 * Search (debounced upstream by the page), status / tier / platform selects and
 * a created-at date range. Fully controlled: the page owns the filter state and
 * applies `applyCampaignFilters` client-side.
 */
import { CampaignFilters as FilterState, CampaignStatus, Platform, Tier } from '../../types';
import { platformLabel } from '../../utils/formatters';

export interface CampaignFiltersBarProps {
  filters: FilterState;
  /** Patch the filter state (partial update). */
  onChange: (patch: Partial<FilterState>) => void;
  /** Reset every filter to its default. */
  onClear: () => void;
  /** Number of campaigns matching the current filters. */
  resultCount: number;
  /** Total campaign count (for "x of y" display). */
  totalCount: number;
}

const select =
  'rounded-lg border border-[#2D3748] bg-[#1D232D] px-3 py-2 text-sm text-white ' +
  'transition-all duration-200 ease-out focus:border-[#2FD9C7] focus:outline-none ' +
  'focus:ring-2 focus:ring-[#2FD9C7]/30';

const STATUSES: (CampaignStatus | 'ALL')[] = ['ALL', 'ACTIVE', 'PAUSED', 'COMPLETED', 'HALTED', 'CREATED'];
const TIERS: (Tier | 'ALL')[] = ['ALL', 'A', 'B', 'C'];
const PLATFORMS: (Platform | 'ALL')[] = ['ALL', 'email', 'whatsapp', 'sms', 'voice', 'linkedin', 'instagram'];

function statusText(status: CampaignStatus | 'ALL'): string {
  if (status === 'ALL') return 'All statuses';
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function CampaignFiltersBar({ filters, onChange, onClear, resultCount, totalCount }: CampaignFiltersBarProps) {
  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.status !== 'ALL' ||
    filters.tier !== 'ALL' ||
    filters.platform !== 'ALL' ||
    Boolean(filters.from) ||
    Boolean(filters.to);

  return (
    <section
      aria-label="Campaign filters"
      className="rounded-2xl border border-[#2D3748] bg-[#15191F] p-4 sm:p-5"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative flex-1 lg:max-w-xs">
          <label htmlFor="campaign-search" className="sr-only">
            Search campaigns
          </label>
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A6470]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            id="campaign-search"
            type="search"
            value={filters.search ?? ''}
            onChange={(event) => onChange({ search: event.target.value })}
            placeholder="Search name or campaign ID…"
            className="w-full rounded-lg border border-[#2D3748] bg-[#1D232D] py-2 pl-9 pr-3 text-sm text-white placeholder:text-[#5A6470] transition-all duration-200 ease-out focus:border-[#2FD9C7] focus:outline-none focus:ring-2 focus:ring-[#2FD9C7]/30"
          />
        </div>

        {/* Selects */}
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="campaign-status" className="sr-only">
            Filter by status
          </label>
          <select
            id="campaign-status"
            className={select}
            value={filters.status ?? 'ALL'}
            onChange={(event) => onChange({ status: event.target.value as CampaignStatus | 'ALL' })}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {statusText(status)}
              </option>
            ))}
          </select>

          <label htmlFor="campaign-tier" className="sr-only">
            Filter by tier
          </label>
          <select
            id="campaign-tier"
            className={select}
            value={filters.tier ?? 'ALL'}
            onChange={(event) => onChange({ tier: event.target.value as Tier | 'ALL' })}
          >
            {TIERS.map((tier) => (
              <option key={tier} value={tier}>
                {tier === 'ALL' ? 'All tiers' : `Tier ${tier}`}
              </option>
            ))}
          </select>

          <label htmlFor="campaign-platform" className="sr-only">
            Filter by platform
          </label>
          <select
            id="campaign-platform"
            className={select}
            value={filters.platform ?? 'ALL'}
            onChange={(event) => onChange({ platform: event.target.value as Platform | 'ALL' })}
          >
            {PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {platform === 'ALL' ? 'All channels' : platformLabel(platform)}
              </option>
            ))}
          </select>

          {/* Created date range */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="campaign-from" className="sr-only">
              Created from
            </label>
            <input
              id="campaign-from"
              type="date"
              value={filters.from ?? ''}
              onChange={(event) => onChange({ from: event.target.value || undefined })}
              className={`${select} px-2.5`}
              aria-label="Created from"
            />
            <span className="text-xs text-[#5A6470]" aria-hidden="true">
              –
            </span>
            <label htmlFor="campaign-to" className="sr-only">
              Created to
            </label>
            <input
              id="campaign-to"
              type="date"
              value={filters.to ?? ''}
              onChange={(event) => onChange({ to: event.target.value || undefined })}
              className={`${select} px-2.5`}
              aria-label="Created to"
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs font-semibold text-[#2FD9C7] transition-colors hover:text-[#4FE5D3]"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <p className="mt-3 text-xs text-[#5A6470]" aria-live="polite">
        Showing {resultCount} of {totalCount} campaigns
      </p>
    </section>
  );
}

export default CampaignFiltersBar;
