import { Hourglass, Pause } from "lucide-react";
import { useId, useState } from "react";

import { cn } from "@/lib/utils";

const RAIO = 84;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

/** A partir de quanto tempo restante a aula entra nos "minutos finais". */
export const MINUTOS_FINAIS_MS = 5 * 60_000;

function formatar(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const dois = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${dois(m)}:${dois(s)}` : `${dois(m)}:${dois(s)}`;
}

/**
 * Relógio da aula: um anel de progresso que vai se esvaziando de forma
 * contínua, um cometa que dá a volta a cada minuto (o ponteiro dos segundos)
 * e um halo que "respira" enquanto a aula está ao vivo. Cada dígito desliza
 * quando muda. A cor vai de verde para âmbar e vermelho, e no último minuto o
 * halo pulsa mais rápido. Um toque alterna entre "restam" e "passaram".
 * Pausada, tudo congela em âmbar.
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
  const id = useId().replace(/:/g, "");
  const [modo, setModo] = useState<"restam" | "passaram">("restam");
  const total = Math.max(1, fimMs - inicioMs);
  const restante = Math.max(0, fimMs - agoraMs);
  const passado = Math.min(total, Math.max(0, agoraMs - inicioMs));
  const fracaoRestante = restante / total;
  const ultimoMinuto = restante > 0 && restante <= 60_000;
  const minutosFinais = !pausada && restante > 0 && restante <= MINUTOS_FINAIS_MS;
  const [corA, corB] = pausada
    ? ["var(--color-sun)", "#f59e0b"]
    : ultimoMinuto || fracaoRestante < 0.2
      ? ["#f87171", "#dc2626"]
      : fracaoRestante < 0.5
        ? ["var(--color-sun)", "#f59e0b"]
        : ["var(--color-mint)", "#22c55e"];
  // O cometa anda em passos de 1 s com transição linear, então parece contínuo.
  // O ângulo só cresce (sem voltar a zero a cada minuto), para não girar de ré.
  const angulo = -Math.floor(restante / 1000) * 6;
  const mostrado = formatar(modo === "restam" ? restante : passado);

  return (
    <button
      type="button"
      onClick={() => setModo((m) => (m === "restam" ? "passaram" : "restam"))}
      aria-label={`${mostrado} ${modo === "restam" ? "restantes" : "decorridos"}. Toque para alternar.`}
      title="Toque para alternar entre o que falta e o que passou"
      className="group relative shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      style={{ width: tamanho, height: tamanho, color: corA }}
    >
      {/* Halo que respira ao vivo (e pulsa rápido no último minuto). */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-[6%] rounded-full blur-2xl",
          !pausada && (minutosFinais ? "relogio-alerta" : "relogio-respira"),
        )}
        style={{ background: corA, opacity: pausada ? 0.18 : undefined }}
      />
      {/* Minutos finais: ondas que saem do relógio e um anel tracejado girando. */}
      {minutosFinais ? (
        <>
          <span
            aria-hidden
            className="relogio-onda absolute inset-0 rounded-full border-2"
            style={{ borderColor: corA }}
          />
          <span
            aria-hidden
            className="relogio-onda absolute inset-0 rounded-full border-2 [animation-delay:0.9s]"
            style={{ borderColor: corA }}
          />
          <svg viewBox="0 0 200 200" className="relogio-gira absolute -inset-[5%]" aria-hidden>
            <circle
              cx="100"
              cy="100"
              r="97"
              fill="none"
              stroke={corA}
              strokeWidth="1.5"
              strokeDasharray="3 9"
              strokeLinecap="round"
              opacity="0.8"
            />
          </svg>
        </>
      ) : null}
      <svg viewBox="0 0 200 200" className="relative size-full" aria-hidden>
        <defs>
          <linearGradient id={`${id}-arco`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={corA} />
            <stop offset="100%" stopColor={corB} />
          </linearGradient>
          <radialGradient id={`${id}-fundo`} cx="50%" cy="35%" r="70%">
            <stop offset="0%" stopColor="rgb(255 255 255 / 0.16)" />
            <stop offset="100%" stopColor="rgb(10 10 30 / 0.55)" />
          </radialGradient>
        </defs>

        <circle cx="100" cy="100" r="98" fill={`url(#${id}-fundo)`} />
        <circle cx="100" cy="100" r="98" fill="none" stroke="rgb(255 255 255 / 0.12)" />

        {/* Marcas dos minutos, discretas, por dentro do anel. */}
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i * 6 * Math.PI) / 180;
          const grande = i % 5 === 0;
          const r1 = grande ? 64 : 67;
          return (
            <line
              key={i}
              x1={100 + Math.sin(a) * r1}
              y1={100 - Math.cos(a) * r1}
              x2={100 + Math.sin(a) * 71}
              y2={100 - Math.cos(a) * 71}
              strokeWidth={grande ? 2 : 1}
              strokeLinecap="round"
              stroke={grande ? "rgb(255 255 255 / 0.45)" : "rgb(255 255 255 / 0.18)"}
            />
          );
        })}

        {/* Trilho e anel de progresso (o que ainda resta). */}
        <circle
          cx="100"
          cy="100"
          r={RAIO}
          fill="none"
          stroke="rgb(255 255 255 / 0.1)"
          strokeWidth="9"
        />
        <circle
          cx="100"
          cy="100"
          r={RAIO}
          fill="none"
          stroke={`url(#${id}-arco)`}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={CIRCUNFERENCIA}
          strokeDashoffset={CIRCUNFERENCIA * (1 - fracaoRestante)}
          transform="rotate(-90 100 100)"
          style={{
            transition: pausada ? "none" : "stroke-dashoffset 1s linear, stroke 0.6s",
            filter: "drop-shadow(0 0 6px currentColor)",
          }}
        />

        {/* Cometa dos segundos: cabeça brilhante e rastro que some. */}
        <g
          style={{
            transform: `rotate(${angulo}deg)`,
            transformOrigin: "100px 100px",
            transition: pausada ? "none" : "transform 1s linear",
          }}
        >
          <circle
            cx="100"
            cy="100"
            r={RAIO}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`28 ${CIRCUNFERENCIA}`}
            transform="rotate(-90 100 100)"
            opacity="0.45"
          />
          <circle cx="100" cy={100 - RAIO} r="6.5" fill="white" />
          <circle cx="100" cy={100 - RAIO} r="3.5" fill="currentColor" />
        </g>
      </svg>

      <span className="absolute inset-0 flex flex-col items-center justify-center">
        {pausada ? (
          <span className="mb-1 flex items-center gap-1 rounded-full bg-sun px-2 py-px text-[9px] font-extrabold uppercase tracking-wider text-sun-foreground">
            <Pause className="size-2.5" aria-hidden /> pausada
          </span>
        ) : null}
        <span
          className={cn(
            "flex font-heading font-extrabold tabular-nums leading-none text-white",
            pausada && "animate-pulse",
            minutosFinais && "text-red-200",
          )}
          style={{ fontSize: tamanho * (mostrado.length > 5 ? 0.15 : 0.21) }}
        >
          {[...mostrado].map((c, i) => (
            <span
              // A chave muda junto com o dígito: ele remonta e entra deslizando.
              key={`${i}-${c}`}
              className={cn("inline-block", /\d/.test(c) && !pausada && "relogio-digito")}
            >
              {c}
            </span>
          ))}
        </span>
        <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
          {modo === "restam" ? "restam" : "passaram"}
        </span>
      </span>
    </button>
  );
}

/**
 * Aviso dos minutos finais da aula: aparece quando faltam 5 minutos ou menos,
 * com a ampulheta girando, a contagem em minutos e uma barra que esvazia até
 * o fim, para a turma salvar o trabalho e desligar com calma.
 */
export function AvisoMinutosFinais({
  restanteMs,
  className,
}: {
  restanteMs: number;
  className?: string;
}) {
  if (restanteMs <= 0 || restanteMs > MINUTOS_FINAIS_MS) return null;
  const minutos = Math.ceil(restanteMs / 60_000);
  const ultimo = restanteMs <= 60_000;
  return (
    <div
      role="status"
      className={cn(
        "aviso-final relative isolate flex w-full items-center gap-3 overflow-hidden rounded-2xl border px-3.5 py-2.5 text-left text-white shadow-lg",
        ultimo ? "border-red-400/70 bg-red-600/30" : "border-amber-300/60 bg-amber-500/20",
        className,
      )}
    >
      <span
        aria-hidden
        className="aviso-final-brilho absolute inset-y-0 -left-1/3 -z-10 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          ultimo ? "bg-red-500" : "bg-amber-400 text-amber-950",
        )}
      >
        <Hourglass className="ampulheta-gira size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold leading-tight">
          {ultimo ? "Último minuto!" : `Últimos ${minutos} minutos`}
        </span>
        <span className="block text-xs text-white/80">
          Hora de salvar o trabalho e desligar com calma.
        </span>
      </span>
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 origin-left bg-white/25">
        <span
          className={cn("block h-full", ultimo ? "bg-red-300" : "bg-amber-300")}
          style={{
            width: `${(restanteMs / MINUTOS_FINAIS_MS) * 100}%`,
            transition: "width 1s linear",
          }}
        />
      </span>
    </div>
  );
}
