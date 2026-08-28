/**
 * PhishYou — Resistance Score Gauge (signature visual element)
 * Spec: FRONTEND_SPEC_ENHANCED.md — "Signature Design Element — Resistance Score Gauge"
 *
 * - SVG circular arc: base ring #3D4860, progress arc three-stage colored
 *   (green < 0.33, amber 0.33–0.67, red > 0.67)
 * - Pulse: static (low), gentle 2.4s (medium), urgent 1.8s + glow (high)
 * - Sizes: sm = 48 (cards/tables), md = 64 (dashboard tiles), lg = 80 (AAR hero)
 * - 1000ms stroke-dashoffset animation on value change; respects reduced-motion
 */
import { clamp, resistanceColor } from '../../utils/formatters';

export type GaugeSize = 'sm' | 'md' | 'lg';

const SIZE_PX: Record<GaugeSize, number> = { sm: 48, md: 64, lg: 80 };

export interface ResistanceScoreGaugeProps {
  /** Resistance score 0..1. */
  value: number;
  size?: GaugeSize;
  /** Hide the numeric readout inside the ring (compact table cells). */
  hideValue?: boolean;
  /** Append a text label for screen readers, e.g. the target name. */
  label?: string;
  /** Disable pulse animations (static contexts such as print views). */
  static?: boolean;
}

export function ResistanceScoreGauge({
  value,
  size = 'sm',
  hideValue = false,
  label,
  static: isStatic = false,
}: ResistanceScoreGaugeProps) {
  const clamped = clamp(value);
  const px = SIZE_PX[size];
  const stroke = size === 'lg' ? 5 : 4;
  const radius = (px - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = resistanceColor(clamped);
  const fontSize = size === 'lg' ? 'text-lg' : size === 'md' ? 'text-sm' : 'text-xs';

  const pulseClass =
    isStatic || clamped < 0.3
      ? ''
      : clamped > 0.7
        ? 'py-gauge-pulse-urgent'
        : 'py-gauge-pulse-gentle';

  const glow = !isStatic && clamped > 0.7 ? '0 0 20px rgba(255, 71, 87, 0.35)' : undefined;

  return (
    <div
      className={`relative shrink-0 ${pulseClass}`}
      style={{ width: px, height: px, boxShadow: glow, borderRadius: '50%' }}
      role="img"
      aria-label={`Resistance score ${Math.round(clamped * 100)} out of 100${label ? ` — ${label}` : ''}`}
    >
      <style>{`
        @keyframes pyGaugePulseGentle { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; } }
        @keyframes pyGaugePulseUrgent { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
        .py-gauge-pulse-gentle { animation: pyGaugePulseGentle 2.4s ease-in-out infinite; }
        .py-gauge-pulse-urgent { animation: pyGaugePulseUrgent 1.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .py-gauge-pulse-gentle, .py-gauge-pulse-urgent { animation: none; }
        }
      `}</style>
      <svg width={px} height={px} className="-rotate-90" aria-hidden="true">
        <circle cx={px / 2} cy={px / 2} r={radius} fill="none" stroke="#3D4860" strokeWidth={stroke} />
        <circle
          cx={px / 2}
          cy={px / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          style={{ transition: 'stroke-dashoffset 1000ms ease-in-out, stroke 300ms ease-out' }}
        />
      </svg>
      {!hideValue && (
        <span
          className={`absolute inset-0 flex items-center justify-center font-mono font-bold ${fontSize}`}
          style={{ color }}
        >
          {Math.round(clamped * 100)}
        </span>
      )}
    </div>
  );
}

export default ResistanceScoreGauge;
