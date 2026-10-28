import { Pause } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

const TICKS = 60;

function formatar(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const dois = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${dois(m)}:${dois(s)}` : `${dois(m)}:${dois(s)}`;
}

/**
 * Relógio da aula: mostrador de 60 marcas que vão apagando conforme o tempo
 * passa, um ponto que dá a volta a cada minuto (o ponteiro dos segundos),
 * minutos e segundos em destaque e a cor mudando de verde para âmbar e
 * vermelho. Um toque alterna entre "restam" e "passaram". Pausada, o relógio
 * congela e o mostrador pulsa em âmbar.
 */
export function RelogioAula({
  inicioMs,
  fimMs,
  agoraMs,
  pausada = false,
  tamanho = 176,
}: {
  inicioMs: number;
  fimMs: number;
  /** Já descontando a pausa (ver `instanteEfetivo`). */
  agoraMs: number;
  pausada?: boolean;
  tamanho?: number;
}) {
  const [modo, setModo] = useState<"restam" | "passaram">("restam");
  const total = Math.max(1, fimMs - inicioMs);
  const restante = Math.max(0, fimMs - agoraMs);
  const passado = Math.min(total, Math.max(0, agoraMs - inicioMs));
  const fracaoRestante = restante / total;
  const ultimoMinuto = restante > 0 && restante <= 60_000;
  const cor = pausada
    ? "var(--color-sun)"
    : ultimoMinuto || fracaoRestante < 0.2
      ? "#ef4444"
      : fracaoRestante < 0.5
        ? "var(--color-sun)"
        : "var(--color-mint)";
  const acesas = Math.ceil(fracaoRestante * TICKS);
  const angulo = ((restante / 1000) % 60) * 6;
  const mostrado = modo === "restam" ? restante : passado;

  return (
    <button
      type="button"
      onClick={() => setModo((m) => (m === "restam" ? "passaram" : "restam"))}
      aria-label={`${formatar(mostrado)} ${modo === "restam" ? "restantes" : "decorridos"}. Toque para alternar.`}
      title="Toque para alternar entre o que falta e o que passou"
      className="group relative shrink-0 rounded-full outline-none transition-transform duration-300 hover:scale-105 focus-visible:ring-2 focus-visible:ring-white/60"
      style={{ width: tamanho, height: tamanho }}
    >
      <svg viewBox="0 0 200 200" className="size-full" aria-hidden>
        <defs>
          <radialGradient id="relogio-fundo" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="rgb(255 255 255 / 0.14)" />
            <stop offset="100%" stopColor="rgb(255 255 255 / 0.03)" />
          </radialGradient>
        </defs>
        <circle
          cx="100"
          cy="100"
          r="96"
          fill="url(#relogio-fundo)"
          stroke="rgb(255 255 255 / 0.18)"
        />
        {Array.from({ length: TICKS }, (_, i) => {
          const a = (i * 6 * Math.PI) / 180;
          const grande = i % 5 === 0;
          const r1 = grande ? 80 : 84;
          const acesa = i < acesas;
          return (
            <line
              key={i}
              x1={100 + Math.sin(a) * r1}
              y1={100 - Math.cos(a) * r1}
              x2={100 + Math.sin(a) * 92}
              y2={100 - Math.cos(a) * 92}
              strokeWidth={grande ? 3 : 1.6}
              strokeLinecap="round"
              stroke={acesa ? cor : "rgb(255 255 255 / 0.18)"}
              style={{ transition: "stroke 0.6s" }}
            />
          );
        })}
        <circle
          cx="100"
          cy="100"
          r="70"
          fill="none"
          stroke="rgb(255 255 255 / 0.08)"
          strokeWidth="2"
        />
        <g
          style={{
            transform: `rotate(${angulo}deg)`,
            transformOrigin: "100px 100px",
            transition: pausada ? "none" : "transform 1s linear",
          }}
        >
          <circle
            cx="100"
            cy="30"
            r="5"
            fill={cor}
            className={cn(!pausada && "drop-shadow-[0_0_6px_currentColor]")}
          />
        </g>
      </svg>

      <span className="absolute inset-0 flex flex-col items-center justify-center">
        {pausada ? (
          <span className="mb-0.5 flex items-center gap-1 rounded-full bg-sun px-2 py-px text-[9px] font-extrabold uppercase tracking-wider text-sun-foreground">
            <Pause className="size-2.5" aria-hidden /> pausada
          </span>
        ) : null}
        <span
          className={cn(
            "font-heading font-extrabold tabular-nums leading-none text-white",
            pausada && "animate-pulse",
            ultimoMinuto && "text-red-400",
          )}
          style={{ fontSize: tamanho * (restante >= 3_600_000 ? 0.16 : 0.22) }}
        >
          {formatar(mostrado)}
        </span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
          {modo === "restam" ? "restam" : "passaram"}
        </span>
      </span>
    </button>
  );
}
