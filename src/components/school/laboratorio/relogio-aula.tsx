import { Hourglass, Pause } from "lucide-react";
import { useId, useState } from "react";

import { cn } from "@/lib/utils";

/** Geometria do mostrador, em unidades do viewBox 200×200. */
const RAIO = 78;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;
const MARCAS = 60;

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
 * Relógio da aula.
 *
 * O mostrador inteiro é um medidor: as 60 marcas da borda acendem no tempo
 * que ainda resta e apagam conforme a aula anda, então dá para ler quanto
 * falta de longe, sem enxergar os números — é o que vale na TV do corredor.
 * Por dentro, o anel de progresso se esvazia de forma contínua, um cometa dá
 * a volta a cada minuto (o ponteiro dos segundos) e um halo "respira"
 * enquanto a aula está ao vivo. Cada dígito desliza quando muda.
 *
 * A cor atravessa verde, âmbar e vermelho conforme o tempo aperta, e no
 * último minuto o halo pulsa mais rápido. Um toque alterna entre "restam" e
 * "passaram". Pausada, tudo congela em âmbar.
 */
export function RelogioAula({
  inicioMs,
  fimMs,
  agoraMs,
  pausada = false,
  tamanho = 176,
  ateHora,
  className,
}: {
  inicioMs: number;
  fimMs: number;
  /** Já descontando a pausa (ver `instanteEfetivo`). */
  agoraMs: number;
  pausada?: boolean;
  tamanho?: number;
  /** Hora do fim da aula, mostrada por dentro do mostrador (ex.: "13:39"). */
  ateHora?: string | undefined;
  className?: string;
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
  const longo = mostrado.length > 5;

  // Tipografia proporcional ao mostrador: o mesmo componente serve ao cartão
  // da home (138 px) e à TV em tela cheia (600 px e mais).
  const corpo = tamanho * (longo ? 0.168 : 0.232);
  const legenda = Math.max(9, tamanho * 0.044);
  const rodape = Math.max(9, tamanho * 0.047);

  return (
    <button
      type="button"
      onClick={() => setModo((m) => (m === "restam" ? "passaram" : "restam"))}
      aria-label={`${mostrado} ${modo === "restam" ? "restantes" : "decorridos"}. Toque para alternar.`}
      title="Toque para alternar entre o que falta e o que passou"
      className={cn(
        "group relative shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/60",
        className,
      )}
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
          <radialGradient id={`${id}-vidro`} cx="50%" cy="22%" r="86%">
            <stop offset="0%" stopColor="rgb(255 255 255 / 0.2)" />
            <stop offset="55%" stopColor="rgb(255 255 255 / 0.05)" />
            <stop offset="100%" stopColor="rgb(6 10 28 / 0.62)" />
          </radialGradient>
          <radialGradient id={`${id}-miolo`} cx="50%" cy="28%" r="78%">
            <stop offset="0%" stopColor="rgb(255 255 255 / 0.13)" />
            <stop offset="100%" stopColor="rgb(4 8 24 / 0.5)" />
          </radialGradient>
        </defs>

        {/* Vidro do mostrador, com reflexo em cima e sombra em baixo. */}
        <circle cx="100" cy="100" r="99" fill={`url(#${id}-vidro)`} />
        <circle cx="100" cy="100" r="99" fill="none" stroke="rgb(255 255 255 / 0.14)" />
        <circle cx="100" cy="100" r="92.5" fill="none" stroke="rgb(255 255 255 / 0.06)" />

        {/* Coroa de marcas: acesa no tempo que resta, apagada no que já passou.
            De longe, é ela que diz quanto falta. */}
        {Array.from({ length: MARCAS }, (_, i) => {
          const a = (i * (360 / MARCAS) * Math.PI) / 180;
          const grande = i % 5 === 0;
          const gasta = i / MARCAS >= fracaoRestante;
          const r1 = grande ? 84 : 87;
          return (
            <line
              key={i}
              x1={100 + Math.sin(a) * r1}
              y1={100 - Math.cos(a) * r1}
              x2={100 + Math.sin(a) * 94}
              y2={100 - Math.cos(a) * 94}
              strokeWidth={grande ? 2.6 : 1.3}
              strokeLinecap="round"
              stroke={gasta ? "rgb(255 255 255 / 0.13)" : corA}
              opacity={gasta ? 1 : grande ? 0.95 : 0.6}
              style={{ transition: "stroke 0.6s linear, opacity 0.6s linear" }}
            />
          );
        })}

        {/* Trilho e anel de progresso (o que ainda resta). */}
        <circle
          cx="100"
          cy="100"
          r={RAIO}
          fill="none"
          stroke="rgb(255 255 255 / 0.09)"
          strokeWidth="10"
        />
        <circle
          cx="100"
          cy="100"
          r={RAIO}
          fill="none"
          stroke={`url(#${id}-arco)`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUNFERENCIA}
          strokeDashoffset={CIRCUNFERENCIA * (1 - fracaoRestante)}
          transform="rotate(-90 100 100)"
          style={{
            transition: pausada ? "none" : "stroke-dashoffset 1s linear, stroke 0.6s",
            filter: "drop-shadow(0 0 7px currentColor)",
          }}
        />

        {/* Disco central: separa os números do anel e dá profundidade. */}
        <circle cx="100" cy="100" r="68" fill={`url(#${id}-miolo)`} />
        <circle cx="100" cy="100" r="68" fill="none" stroke="rgb(255 255 255 / 0.1)" />

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
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeDasharray={`30 ${CIRCUNFERENCIA}`}
            transform="rotate(-90 100 100)"
            opacity="0.45"
          />
          <circle cx="100" cy={100 - RAIO} r="8" fill="currentColor" opacity="0.35" />
          <circle cx="100" cy={100 - RAIO} r="5.6" fill="white" />
          <circle cx="100" cy={100 - RAIO} r="3" fill="currentColor" />
        </g>
      </svg>

      <span className="absolute inset-0 flex flex-col items-center justify-center">
        {pausada ? (
          <span
            className="mb-1 flex items-center gap-1 rounded-full bg-sun px-2 py-px font-extrabold uppercase tracking-wider text-sun-foreground"
            style={{ fontSize: legenda }}
          >
            <Pause style={{ width: legenda, height: legenda }} aria-hidden /> pausada
          </span>
        ) : null}
        <span
          className={cn(
            "flex font-heading font-extrabold tabular-nums leading-none text-white",
            pausada && "animate-pulse",
            minutosFinais && "text-red-100",
          )}
          style={{
            fontSize: corpo,
            textShadow: "0 2px 18px rgb(0 0 0 / 0.45)",
            letterSpacing: "-0.02em",
          }}
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
        <span
          className="mt-[0.35em] font-semibold uppercase tracking-[0.26em] text-white/55"
          style={{ fontSize: legenda }}
        >
          {modo === "restam" ? "restam" : "passaram"}
        </span>
        {ateHora ? (
          <span
            className="mt-[0.5em] rounded-full border border-white/15 bg-white/[0.07] px-[0.7em] py-[0.18em] font-bold tabular-nums text-white/70"
            style={{ fontSize: rodape }}
          >
            até {ateHora}
          </span>
        ) : null}
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
