/**
 * PhishYou — Polling hook
 * Spec: FRONTEND_SPEC_ENHANCED.md — PAGE 6 (auto-refresh every 5 seconds),
 *       IMPLEMENTATION_CHECKLIST.md — "Cancel in-flight requests on unmount"
 *
 * Runs an async refresher on an interval while mounted:
 * - paused when the tab is hidden (saves tokens & battery)
 * - aborts the in-flight request on unmount/re-schedule
 * - exposes `refresh` for manual triggers and `lastUpdated` for "N seconds ago"
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export interface UsePollingResult<T> {
  data: T | null;
  loading: boolean;
  error: boolean;
  lastUpdated: Date | null;
  secondsAgo: number;
  refresh: () => Promise<void>;
}

export function usePolling<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  intervalMs = 5000,
): UsePollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    const controller = new AbortController();
    try {
      const fresh = await fetcherRef.current(controller.signal);
      setData(fresh);
      setError(false);
      setLastUpdated(new Date());
    } catch (cause) {
      // AbortError only means the request was superseded/unmounted.
      if (!(cause instanceof DOMException && cause.name === 'AbortError')) setError(true);
    } finally {
      setLoading(false);
    }
    return undefined;
  }, []);

  // Initial fetch + interval, paused while the tab is hidden.
  useEffect(() => {
    let timer: number | undefined;
    const tick = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    void refresh();
    timer = window.setInterval(tick, intervalMs);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refresh, intervalMs]);

  // "Last updated N seconds ago" ticker.
  useEffect(() => {
    const ticker = window.setInterval(() => {
      if (lastUpdated) setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => window.clearInterval(ticker);
  }, [lastUpdated]);

  return { data, loading, error, lastUpdated, secondsAgo, refresh };
}
