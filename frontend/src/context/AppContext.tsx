/**
 * PhishYou — Application context
 * Spec: FRONTEND_SPEC_ENHANCED.md — AppShell (header live indicator, notification
 *       popover) + IMPLEMENTATION_CHECKLIST.md — Toast notifications
 *
 * Holds cross-cutting UI state: toast queue, notifications, live campaign count
 * and the organization label rendered in the shell chrome. The ToastViewport
 * mounts here so any page can raise toasts via useToast().
 */
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import type { AppNotification, ToastItem, ToastVariant } from '../types';
import { ToastViewport } from '../components/common/Toast';

interface AppContextValue {
  organization: string;
  setOrganization: (name: string) => void;
  liveCampaignCount: number;
  setLiveCampaignCount: (count: number) => void;
  notifications: AppNotification[];
  unreadCount: number;
  markAllNotificationsRead: () => void;
  toast: {
    push: (variant: ToastVariant, title: string, message?: string) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
    dismiss: (id: string) => void;
  };
}

const AppContext = createContext<AppContextValue | null>(null);

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', type: 'HARM_DETECTED', title: 'Harm signal detected', message: 'Sana Iqbal — distress score 0.70. Session auto-paused.', timestamp: new Date(Date.now() - 41 * 60_000).toISOString(), read: false },
  { id: 'n2', type: 'CAMPAIGN_COMPLETED', title: 'Campaign completed', message: 'JazzCash Urgent Verification — AAR is ready.', timestamp: new Date(Date.now() - 3 * 3_600_000).toISOString(), read: false },
  { id: 'n3', type: 'TARGET_BLOCKED', title: 'Target blocked sender', message: 'Hina Malik blocked and reported the simulated sender.', timestamp: new Date(Date.now() - 6 * 3_600_000).toISOString(), read: false },
  { id: 'n4', type: 'DEBRIEF_OVERDUE', title: 'Debrief overdue', message: 'Vendor Invoice Fraud Simulation — debrief due 24h after halt.', timestamp: new Date(Date.now() - 26 * 3_600_000).toISOString(), read: true },
  { id: 'n5', type: 'ADMIN_ACTION', title: 'Tier escalation approved', message: 'CISO approved Tier A escalation for Executive Whaling.', timestamp: new Date(Date.now() - 20 * 60_000).toISOString(), read: false },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState('BiSecT Security Labs');
  const [liveCampaignCount, setLiveCampaignCount] = useState(3);
  const [notifications, setNotifications] = useState<AppNotification[]>(DEFAULT_NOTIFICATIONS);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((variant: ToastVariant, title: string, message?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts((current) => [...current.slice(-4), { id, variant, title, message }]);
    // Success / warning / info auto-dismiss after 5s; errors persist until dismissed.
    if (variant !== 'error') {
      window.setTimeout(() => dismiss(id), 5000);
    }
  }, [dismiss]);

  const toast = useMemo(
    () => ({
      push,
      dismiss,
      success: (title: string, message?: string) => push('success', title, message),
      error: (title: string, message?: string) => push('error', title, message),
      warning: (title: string, message?: string) => push('warning', title, message),
      info: (title: string, message?: string) => push('info', title, message),
    }),
    [push, dismiss],
  );

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      organization,
      setOrganization,
      liveCampaignCount,
      setLiveCampaignCount,
      notifications,
      unreadCount,
      markAllNotificationsRead,
      toast,
    }),
    [organization, liveCampaignCount, notifications, unreadCount, markAllNotificationsRead, toast],
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within <AppProvider>');
  return context;
}
