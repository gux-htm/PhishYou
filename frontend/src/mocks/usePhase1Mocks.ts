import { useEffect, useState } from 'react';
import { USE_MOCK } from './config';
import { advanceMockCampaign, buildFunnel, createMockCampaign, getMockCampaign, listMockCampaigns, type MockCampaign, type NewMockCampaignInput } from './campaigns';
import type { AnalyticsEvent } from './analyticsEvents';

export function useCampaign(id: string) {
  const [campaign, setCampaign] = useState<MockCampaign | null>(() => (USE_MOCK ? getMockCampaign(id) : null));

  useEffect(() => {
    if (!USE_MOCK) return;
    setCampaign(getMockCampaign(id));
  }, [id]);

  return { campaign, isLoading: !campaign };
}

export function useLiveCampaign(id: string, intervalMs = 3000) {
  const { campaign: initial } = useCampaign(id);
  const [campaign, setCampaign] = useState<MockCampaign | null>(initial);

  useEffect(() => {
    setCampaign(initial);
  }, [initial]);

  useEffect(() => {
    if (!USE_MOCK) return;
    const timer = window.setInterval(() => {
      const next = advanceMockCampaign(id);
      if (next) setCampaign({ ...next, interactions: [...next.interactions], events: [...next.events] });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [id, intervalMs]);

  return { campaign, isLoading: !campaign };
}

export function usePhase1Campaigns() {
  const [campaigns, setCampaigns] = useState<MockCampaign[]>(() => (USE_MOCK ? listMockCampaigns() : []));

  const refresh = () => setCampaigns(USE_MOCK ? listMockCampaigns() : []);
  return { campaigns, refresh };
}

export function usePhase1Analytics(id: string) {
  const { campaign, isLoading } = useLiveCampaign(id, 4000);
  const events: AnalyticsEvent[] = campaign?.events ?? [];
  return {
    campaign,
    events,
    funnel: campaign ? buildFunnel(campaign) : [],
    isLoading,
  };
}

export function createPhase1Campaign(input: NewMockCampaignInput) {
  return createMockCampaign(input);
}
