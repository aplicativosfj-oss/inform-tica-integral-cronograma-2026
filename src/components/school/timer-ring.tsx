import { useId } from "react";

import { cn } from "@/lib/utils";

export interface TimerRingProps {
  /** Seconds already elapsed in the current turn. */
  decorridos: number;
  /** Total duration of the current turn, in seconds. */
  total: number;
  /** Label under the countdown (e.g. "restante"). */
  legenda?: string;
  className?: string;
  size?: number;
}

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Professional real-time SVG countdown ring.
 * Pure presentation: it renders whatever elapsed/total values it receives,
 * so the clock source (interval, server time) stays outside the component.
 */
export function TimerRing({
  decorridos,
  total,
  legenda = "restante",
  className,
  size = 220,
}: TimerRingProps) {
  const gradientId = useId();
  const safeTotal = Math.max(1, total);
  const elapsed = Math.min(Math.max(0, decorridos), safeTotal);
  const restante = safeTotal - elapsed;
  const progresso = elapsed / safeTotal;

  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * progresso;
  const alerta = restante <= 60;

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="timer"
        aria-live="off"
        aria-label={`Tempo restante do grupo: ${formatClock(restante)}`}
        className="-rotate-90"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent, var(--primary))" />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted"
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={alerta ? "var(--destructive)" : `url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "font-mono text-4xl font-bold tabular-nums",
            alerta ? "text-destructive" : "text-foreground",
          )}
        >
          {formatClock(restante)}
        </span>
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{legenda}</span>
        <span className="mt-1 text-xs text-muted-foreground">
          {formatClock(elapsed)} decorridos
        </span>
      </div>
    </div>
  );
}
