/**
 * PhishYou — Shared formatting helpers
 * Spec: FRONTEND_SPEC_ENHANCED.md — Design System (status colors, tiers, typography)
 *
 * Pure functions only — safe to import from any layer (components, pages, services).
 */
import type { CampaignStatus, DefenseStatus, Tier } from '../types';

/* ------------------------------------------------------------------ */
/* Dates & times                                                       */
/* ------------------------------------------------------------------ */

/** "3 min ago" / "2h ago" / "5d ago" — used across activity feeds. */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** "14:32" — clock faces on message threads. */
export function clockTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
}

/** "Aug 28, 2026" — table dates. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(iso));
}

/** "Aug 28, 2026, 14:32" — audit log & generated-at stamps. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

/** "18m 24s" / "2h 05m" / "3d 4h" — durations from milliseconds. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

/** Elapsed duration between two ISO stamps. */
export function elapsedBetween(fromIso: string | null, toIso?: string | null): string {
  if (!fromIso) return '—';
  const end = toIso ? new Date(toIso).getTime() : Date.now();
  return formatDuration(Math.max(0, end - new Date(fromIso).getTime()));
}

/* ------------------------------------------------------------------ */
/* Numbers & percentages                                               */
/* ------------------------------------------------------------------ */

export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

/** 0.68 → "68%" */
export function formatPercent(value: number, fractionDigits = 0): string {
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

/** Compact counts: 1,204 → "1.2K" */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

/** 3 → "+3", -12 → "-12" */
export function formatDelta(value: number): string {
  return `${value > 0 ? '+' : ''}${value}`;
}

/* ------------------------------------------------------------------ */
/* Resistance score (signature element)                                */
/* ------------------------------------------------------------------ */

/** Three-stage color progression: green (low) → amber (medium) → red (high). */
export function resistanceColor(score: number): string {
  if (score < 0.33) return '#06D369';
  if (score <= 0.67) return '#F59E0B';
  return '#FF4757';
}

export function resistanceLabel(score: number): string {
  if (score < 0.33) return 'Low';
  if (score <= 0.67) return 'Medium';
  return 'High';
}

/* ------------------------------------------------------------------ */
/* Badges (status / tier)                                              */
/* ------------------------------------------------------------------ */

export const STATUS_BADGE_CLASS: Record<CampaignStatus | DefenseStatus, string> = {
  CREATED: 'bg-[#8B95A8]/10 text-[#8B95A8]',
  PENDING: 'bg-[#8B95A8]/10 text-[#7A8595]',
  ACTIVE: 'bg-[#2FD9C7]/10 text-[#2FD9C7]',
  IN_PROGRESS: 'bg-[#2FD9C7]/10 text-[#2FD9C7]',
  PAUSED: 'bg-[#F59E0B]/10 text-[#F59E0B]',
  COMPLETED: 'bg-[#06D369]/10 text-[#06D369]',
  HALTED: 'bg-[#FF4757]/10 text-[#FF4757]',
  COMPROMISED: 'bg-[#FF4757]/15 text-[#FF4757] font-semibold',
  DEFENDED: 'bg-[#06D369]/10 text-[#06D369]',
  BLOCKED: 'bg-[#8B95A8]/10 text-[#8B95A8]',
};

export const TIER_BADGE_CLASS: Record<Tier, string> = {
  A: 'bg-[#FF4757]/10 text-[#FF7B86] border-[#FF4757]/20',
  B: 'bg-[#F59E0B]/10 text-[#F6BF5C] border-[#F59E0B]/20',
  C: 'bg-[#06D369]/10 text-[#58E6A0] border-[#06D369]/20',
};

export const TIER_TEXT_COLOR: Record<Tier, string> = {
  A: '#FF4757',
  B: '#F59E0B',
  C: '#06D369',
};

export const TIER_LABEL: Record<Tier, string> = {
  A: 'Aggressive',
  B: 'Balanced',
  C: 'Cautious',
};

/* ------------------------------------------------------------------ */
/* Identity helpers                                                    */
/* ------------------------------------------------------------------ */

/** "Alice Johnson" → "AJ" */
export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** "alice.johnson@company.com" → "a***e@company.com" — PII-safe display. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(4, local.length - 2))}${local[local.length - 1]}@${domain}`;
}

/** "+92 300 1234567" → "+92 300 ***4567" */
export function maskPhone(phone: string): string {
  const trimmed = phone.replace(/\s+/g, '');
  if (trimmed.length < 5) return '••••';
  return `${trimmed.slice(0, trimmed.length - 4).replace(/.(?=.{4})/g, '•')}${trimmed.slice(-4)}`;
}

/** "9f2c1ab4..." → "9f2c1ab4" — audit hash display. */
export function shortHash(hash: string): string {
  return hash.slice(0, 8);
}

/* ------------------------------------------------------------------ */
/* Labels & misc                                                       */
/* ------------------------------------------------------------------ */

export function platformLabel(platform: string): string {
  const labels: Record<string, string> = {
    email: 'Email',
    whatsapp: 'WhatsApp',
    sms: 'SMS',
    voice: 'Voice Call',
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
  };
  return labels[platform] ?? platform;
}

export function statusLabel(status: string): string {
  return status.replace(/_/g, ' ');
}

export function minutesAgoIso(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

/** Debounce a callback by `wait` ms — search inputs. */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, wait: number): (...args: A) => void {
  let timer: number | undefined;
  return (...args: A) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), wait);
  };
}
