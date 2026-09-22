import { pct } from "@/lib/diagnostica/analise";
import { cn } from "@/lib/utils";

/**
 * Gráficos da avaliação diagnóstica, em SVG puro.
 *
 * São poucos e simples de propósito: o site não carrega biblioteca de
 * gráficos, e o que a coordenação precisa ler aqui cabe em barras e numa
 * linha ligando "antes" e "depois". Todos usam as cores do tema (variáveis
 * CSS), então funcionam igual no claro e no escuro, e trazem `<title>` em
 * cada marca para quem navega com leitor de tela.
 */

/** Escala de cor por faixa de acerto — mesma régua em todos os gráficos. */
export function corDoAcerto(v: number): string {
  if (v < 0.3) return "#e11d48";
  if (v < 0.5) return "#f97316";
  if (v < 0.7) return "#eab308";
  return "#10b981";
}

/** Barras horizontais de acerto por habilidade, pintadas pela faixa. */
export function BarrasHabilidades({
  itens,
  className,
}: {
  itens: { rotulo: string; valor: number; detalhe?: string }[];
  className?: string;
}) {
  return (
    <ul className={cn("space-y-2.5", className)}>
      {itens.map((item) => (
        <li key={item.rotulo + item.detalhe} className="grid gap-1">
          <div className="flex items-start justify-between gap-3 text-sm">
            <span className="leading-snug">{item.rotulo}</span>
            <span
              className="shrink-0 font-bold tabular-nums"
              style={{ color: corDoAcerto(item.valor) }}
            >
              {pct(item.valor)}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(2, item.valor * 100)}%`,
                background: corDoAcerto(item.valor),
              }}
            />
          </div>
          {item.detalhe && <p className="text-xs text-muted-foreground">{item.detalhe}</p>}
        </li>
      ))}
    </ul>
  );
}

/** Barras empilhadas das faixas de desempenho de uma turma. */
export function FaixasEmpilhadas({
  faixas,
}: {
  faixas: { rotulo: string; valor: number | null; cor: string }[];
}) {
  const usadas = faixas.filter((f) => f.valor != null && f.valor > 0);
  if (usadas.length === 0) return <p className="text-sm text-muted-foreground">Sem dados.</p>;
  return (
    <div className="space-y-2">
      <div className="flex h-6 overflow-hidden rounded-md">
        {usadas.map((f) => (
          <div
            key={f.rotulo}
            className="flex items-center justify-center text-[10px] font-bold text-white"
            style={{ width: `${f.valor! * 100}%`, background: f.cor }}
            title={`${f.rotulo}: ${pct(f.valor)}`}
          >
            {f.valor! >= 0.12 ? pct(f.valor) : ""}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {usadas.map((f) => (
          <span key={f.rotulo} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: f.cor }} />
            {f.rotulo} {pct(f.valor)}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Régua da escola contra Feijó e o Acre. Mostra onde a escola está em
 * relação a quem fez a mesma prova — sem isso, um 45% não diz nada.
 */
export function ReguaRede({
  escola,
  feijo,
  acre,
}: {
  escola: number | null;
  feijo: number | null;
  acre: number | null;
}) {
  const marcas = [
    { rotulo: "Escola", valor: escola, cor: "#0ea5e9" },
    { rotulo: "Feijó", valor: feijo, cor: "#a855f7" },
    { rotulo: "Acre", valor: acre, cor: "#64748b" },
  ].filter((m) => m.valor != null);
  return (
    <svg
      viewBox="0 0 320 64"
      className="w-full"
      role="img"
      aria-label="Escola comparada a Feijó e ao Acre"
    >
      <line
        x1={10}
        y1={40}
        x2={310}
        y2={40}
        stroke="currentColor"
        strokeOpacity={0.2}
        strokeWidth={2}
      />
      {[0, 50, 100].map((t) => (
        <text
          key={t}
          x={10 + (t / 100) * 300}
          y={58}
          fontSize={9}
          textAnchor="middle"
          fill="currentColor"
          opacity={0.5}
        >
          {t}
        </text>
      ))}
      {marcas.map((m, idx) => (
        <g key={m.rotulo} transform={`translate(${10 + (m.valor! / 100) * 300} 0)`}>
          <circle cy={40} r={6} fill={m.cor}>
            <title>{`${m.rotulo}: ${m.valor!.toFixed(1)}`}</title>
          </circle>
          <text
            y={idx % 2 === 0 ? 20 : 12}
            fontSize={10}
            textAnchor="middle"
            fill={m.cor}
            fontWeight={700}
          >
            {m.rotulo} {m.valor!.toFixed(0)}
          </text>
        </g>
      ))}
    </svg>
  );
}
