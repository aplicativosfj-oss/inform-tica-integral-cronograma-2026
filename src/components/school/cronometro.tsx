import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/** mm:ss (ou h:mm:ss acima de uma hora). */
export function formatarTempo(seg: number): string {
  const s = Math.max(0, Math.floor(seg));
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    r = s % 60;
  const mm = String(m).padStart(h ? 2 : 1, "0"),
    ss = String(r).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Segundos passados desde `inicio`, atualizando a cada 250 ms. */
export function useSegundosDesde(inicio: number | null, parado = false): number {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    if (inicio == null || parado) return;
    const t = window.setInterval(() => setAgora(Date.now()), 250);
    return () => window.clearInterval(t);
  }, [inicio, parado]);
  return inicio == null ? 0 : Math.max(0, (agora - inicio) / 1000);
}

/**
 * Cronômetro em SVG.
 *
 * - Sem `limite`: conta o tempo que passou; o arco dá a volta a cada minuto
 *   e os minutos ficam no centro (atividades, sem pressão de tempo).
 * - Com `limite`: contagem regressiva; o anel esvazia e muda de cor quando
 *   falta pouco (simulados).
 *
 * As cores vêm de variáveis do tema, para funcionar no claro e no escuro
 * com contraste adequado.
 */
export function Cronometro({
  segundos,
  limite,
  tamanho = 72,
  rotulo,
  className,
}: {
  segundos: number;
  limite?: number;
  tamanho?: number;
  rotulo?: string;
  className?: string;
}) {
  const regressivo = limite != null;
  const restante = regressivo ? Math.max(0, limite - segundos) : 0;
  const fracao = regressivo ? (limite > 0 ? restante / limite : 0) : (segundos % 60) / 60;
  const estado = !regressivo ? "normal" : fracao <= 0.1 ? "critico" : fracao <= 0.25 ? "alerta" : "normal";

  const traco = 5;
  const r = 50 - traco / 2 - 6;
  const circ = 2 * Math.PI * r;
  const texto = formatarTempo(regressivo ? restante : segundos);
  const cor =
    estado === "critico"
      ? "text-rose-600 dark:text-rose-400"
      : estado === "alerta"
        ? "text-amber-600 dark:text-amber-400"
        : "text-primary";

  return (
    <div
      className={cn("inline-flex items-center gap-2", className)}
      role="timer"
      aria-label={`${rotulo ?? (regressivo ? "Tempo restante" : "Tempo")}: ${texto}`}
    >
      <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" aria-hidden className={cn("shrink-0", cor)}>
        {/* marcações de segundos */}
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i / 60) * 2 * Math.PI - Math.PI / 2;
          const grande = i % 5 === 0;
          const r1 = 49,
            r2 = grande ? 44.5 : 46.5;
          return (
            <line
              key={i}
              x1={50 + r1 * Math.cos(a)}
              y1={50 + r1 * Math.sin(a)}
              x2={50 + r2 * Math.cos(a)}
              y2={50 + r2 * Math.sin(a)}
              className="stroke-muted-foreground"
              strokeOpacity={grande ? 0.55 : 0.25}
              strokeWidth={grande ? 1.6 : 1}
              strokeLinecap="round"
            />
          );
        })}
        {/* trilho */}
        <circle cx="50" cy="50" r={r} fill="none" className="stroke-muted" strokeWidth={traco} />
        {/* arco */}
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={traco}
          strokeLinecap="round"
          strokeDasharray={`${circ * fracao} ${circ}`}
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dasharray 250ms linear" }}
        />
        {/* ponteiro na ponta do arco */}
        {fracao > 0.005 ? (
          <circle
            cx={50 + r * Math.cos(fracao * 2 * Math.PI - Math.PI / 2)}
            cy={50 + r * Math.sin(fracao * 2 * Math.PI - Math.PI / 2)}
            r={traco * 0.75}
            fill="currentColor"
            className="stroke-background"
            strokeWidth={1.5}
          />
        ) : null}
        <text
          x="50"
          y={rotulo ? 50 : 54}
          textAnchor="middle"
          className="fill-foreground"
          style={{ font: `700 ${texto.length > 5 ? 17 : 21}px ui-sans-serif, system-ui`, fontVariantNumeric: "tabular-nums" }}
        >
          {texto}
        </text>
        {rotulo ? (
          <text x="50" y="66" textAnchor="middle" className="fill-muted-foreground" style={{ font: "600 9.5px ui-sans-serif, system-ui" }}>
            {rotulo}
          </text>
        ) : null}
      </svg>
    </div>
  );
}
