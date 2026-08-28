/**
 * PhishYou — Campaign List (`/campaigns`)
 * Spec: FRONTEND_SPEC_ENHANCED.md — PAGE 3: Campaign List
 * Checklist: IMPLEMENTATION_CHECKLIST.md — Page 3: Campaign List
 *
 * Card grid of all campaigns with:
 * - Status / tier / platform / date-range filters (client-side, search debounced)
 * - Summary tiles (total, active, completed, halted)
 * - Per-card CTAs handled by CampaignCard (Details / Live / AAR)
 *
 * Data: GET /api/v1/campaigns with the demo fallback from services/campaigns.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, SearchX } from 'lucide-react';
import type { CampaignFilters as FilterState, CampaignSummary } from '../types';
import { applyCampaignFilters, listCampaigns } from '../services/campaigns';
import { CampaignCard } from '../components/campaigns/CampaignCard';
import { CampaignFiltersBar } from '../components/campaigns/CampaignFilters';
import { CardSkeletonGrid } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';

const DEFAULT_FILTERS: FilterState = { search: '', status: 'ALL', tier: 'ALL', platform: 'ALL' };

export default function CampaignList() {
  const navigate = useNavigate();
  const [all, setAll] = useState<CampaignSummary[] | null>(null);
  const [demo, setDemo] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState(''); // debounced mirror of searchInput

  useEffect(() => {
    listCampaigns().then(({ campaigns, demo: isDemo }) => {
      setAll(campaigns);
      setDemo(isDemo);
    });
  }, []);

  // Debounce the search term so the filter bar stays responsive while typing.
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const filtered = useMemo(
    () =>
      applyCampaignFilters(all ?? [], { ...filters, search })
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [all, filters, search],
  );

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchInput('');
    setSearch('');
  };

  const handleFilterChange = (patch: Partial<FilterState>) => {
    if (patch.search !== undefined) {
      setSearchInput(patch.search ?? '');
      return;
    }
    setFilters((current) => ({ ...current, ...patch }));
  };

  const hasActiveFilters =
    Boolean(searchInput) ||
    filters.status !== 'ALL' ||
    filters.tier !== 'ALL' ||
    filters.platform !== 'ALL' ||
    Boolean(filters.from) ||
    Boolean(filters.to);

  if (!all) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="h-9 w-48 animate-pulse rounded-lg bg-[#1D232D]" />
        <CardSkeletonGrid cards={8} />
      </div>
    );
  }

  const activeCount = all.filter((c) => c.status === 'ACTIVE').length;
  const completedCount = all.filter((c) => c.status === 'COMPLETED').length;
  const haltedCount = all.filter((c) => c.status === 'HALTED').length;

  const stats: { label: string; value: number; tone?: string }[] = [
    { label: 'Total campaigns', value: all.length },
    { label: 'Active now', value: activeCount, tone: 'text-[#2FD9C7]' },
    { label: 'Completed', value: completedCount, tone: 'text-[#06D369]' },
    { label: 'Halted', value: haltedCount, tone: 'text-[#FF4757]' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 py-fade-up">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Campaigns</h1>
          <p className="mt-1 text-sm text-[#7A8595]">
            Every simulation this organization has run — filter, monitor live, or open an After-Action Report.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/campaigns/new')}
          className="min-h-11 rounded-xl bg-[#2FD9C7] px-4 py-2.5 text-sm font-bold text-[#0F1219] shadow-[0_10px_28px_rgba(47,217,199,0.10)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#4FE5D3] active:translate-y-0"
        >
          <span className="inline-flex items-center gap-1.5">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create campaign
          </span>
        </button>
      </header>

      {demo && (
        <div className="rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/[0.06] px-4 py-3 text-xs text-[#F6BF5C]">
          Showing demo campaigns because the campaigns API is unavailable.
        </div>
      )}

      {/* Summary tiles */}
      <section aria-label="Campaign totals" className="grid grid-cols-2 gap-4 lg:grid-cols-4 py-fade-up py-fade-up-delay-1">
        {stats.map((stat) => (
          <div key={stat.label} className="py-sheen rounded-2xl border border-[#2D3748] bg-[#15191F] p-4">
            <div className={`text-2xl font-black tracking-[-0.03em] ${stat.tone ?? 'text-white'}`}>{stat.value}</div>
            <div className="mt-0.5 text-xs text-[#7A8595]">{stat.label}</div>
          </div>
        ))}
      </section>

      <CampaignFiltersBar
        filters={{ ...filters, search: searchInput }}
        onChange={handleFilterChange}
        onClear={clearFilters}
        resultCount={filtered.length}
        totalCount={all.length}
      />

      {all.length === 0 ? (
        <EmptyState
          icon={<Plus className="h-12 w-12" aria-hidden="true" />}
          title="No campaigns yet"
          description="Launch your first authorized simulation to start measuring organizational resilience."
          action={{ label: 'Create campaign', onClick: () => navigate('/campaigns/new') }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-12 w-12" aria-hidden="true" />}
          title="No campaigns match your filters"
          description="Try a different search term, or clear the filters to see every campaign."
          action={hasActiveFilters ? { label: 'Clear filters', onClick: clearFilters } : undefined}
        />
      ) : (
        <section aria-label="Campaign grid" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((campaign, index) => (
            <CampaignCard key={campaign.id} campaign={campaign} index={index} />
          ))}
        </section>
      )}
    </div>
  );
}
