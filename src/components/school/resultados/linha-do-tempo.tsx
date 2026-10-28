import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import { LEITURA } from "@/lib/mapa-classe/niveis";
import type { FotoLeitura, TurmaNoAno } from "@/lib/resultados/linha-do-tempo";
import { serieClasses } from "@/lib/serie-colors";
import { cn } from "@/lib/utils";

const porcento = (v: number | null | undefined) => (v == null ? "—" : `${Math.round(v * 100)}%`);

/** Barra empilhada dos cinco níveis de leitura, de "não lê" a "fluência". */
export function BarraLeitura({ foto, alta = false }: { foto: FotoLeitura; alta?: boolean }) {
  return (
    <div
      className={cn("flex w-full overflow-hidden rounded-full bg-white/10", alta ? "h-4" : "h-2.5")}
      role="img"
      aria-label={LEITURA.map((n) => `${n.nome}: ${foto.niveis[n.id]}`).join(", ")}
    >
      {LEITURA.map((n) => {
        const v = foto.total ? foto.niveis[n.id] / foto.total : 0;
        return v > 0 ? (
          <span
            key={n.id}
            title={`${n.nome}: ${foto.niveis[n.id]} (${porcento(v)})`}
            className={cn("h-full transition-[width] duration-700", n.cor)}
            style={{ width: `${v * 100}%` }}
          />
        ) : null;
      })}
    </div>
  );
}

export function LegendaLeitura() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-white/70">
      {LEITURA.map((n) => (
        <li key={n.id} className="flex items-center gap-1.5">
          <span className={cn("size-2.5 rounded-full", n.cor)} aria-hidden />
          {n.nome}
        </li>
      ))}
    </ul>
  );
}

export function Variacao({ pontos, sufixo = "pts" }: { pontos: number | null; sufixo?: string }) {
  if (pontos == null) return <span className="text-xs text-white/50">—</span>;
  const Icone = pontos > 0 ? TrendingUp : pontos < 0 ? TrendingDown : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
        pontos > 0
          ? "bg-emerald-400/15 text-emerald-300"
          : pontos < 0
            ? "bg-rose-400/15 text-rose-300"
            : "bg-white/10 text-white/70",
      )}
    >
      <Icone className="size-3.5" aria-hidden />
      {pontos > 0 ? "+" : ""}
      {pontos} {sufixo}
    </span>
  );
}

/**
 * A escola ao longo do ano: leitura nos três bimestres, lado a lado, e as
 * duas avaliações diagnósticas na mesma régua de acerto.
 */
export function LinhaDoAno({
  leitura,
  diagnostica,
}: {
  leitura: FotoLeitura[];
  diagnostica: { i: number; ii: number | null };
}) {
  const atual = leitura.at(-1);
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-md sm:p-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sun">
              Leitura · mapa de classe
            </p>
            <h3 className="mt-1 text-lg font-bold">Bimestre a bimestre</h3>
          </div>
          {atual ? (
            <Variacao pontos={Math.round((atual.leem - (leitura[0]?.leem ?? 0)) * 100)} />
          ) : null}
        </header>

        <ol className="mt-5 space-y-4">
          {leitura.map((f, i) => (
            <li
              key={f.bim}
              className="grid grid-cols-[4.5rem_minmax(0,1fr)_3.5rem] items-center gap-3"
            >
              <span className="text-sm font-semibold text-white/80">{f.bim}º bim.</span>
              <BarraLeitura foto={f} alta />
              <span className="text-right">
                <b className="block text-base tabular-nums">{porcento(f.leem)}</b>
                {i > 0 ? (
                  <span className="block text-[10px] text-white/50">
                    {Math.round((f.leem - leitura[i - 1]!.leem) * 100) >= 0 ? "+" : ""}
                    {Math.round((f.leem - leitura[i - 1]!.leem) * 100)} pts
                  </span>
                ) : (
                  <span className="block text-[10px] text-white/50">leem bem</span>
                )}
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-5 border-t border-white/10 pt-4">
          <LegendaLeitura />
          <p className="mt-2 text-xs text-white/50">
            O número à direita é a parte das crianças que lê com fluência ou pausadamente.
          </p>
        </div>
      </article>

      <article className="flex flex-col rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500/15 via-white/[0.04] to-violet-500/15 p-5 backdrop-blur-md sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-300">
          Avaliações diagnósticas
        </p>
        <h3 className="mt-1 text-lg font-bold">1ª e 2ª aplicação</h3>
        <div className="mt-5 flex flex-1 items-end justify-center gap-6">
          {[
            { rotulo: "1ª", valor: diagnostica.i, cor: "from-white/30 to-white/60" },
            { rotulo: "2ª", valor: diagnostica.ii, cor: "from-sky-500 to-sky-300" },
          ].map((c, i) => (
            <div key={c.rotulo} className="flex w-20 flex-col items-center gap-2">
              <b className="text-xl tabular-nums">{porcento(c.valor)}</b>
              <div className="flex h-32 w-full items-end overflow-hidden rounded-xl bg-white/10">
                {c.valor != null ? (
                  <span
                    className={cn("hero-barra w-full rounded-xl bg-gradient-to-t", c.cor)}
                    style={{ height: `${c.valor * 100}%`, animationDelay: `${i * 150}ms` }}
                  />
                ) : (
                  <span className="m-auto text-[10px] text-white/50">carregando…</span>
                )}
              </div>
              <span className="text-xs font-semibold text-white/70">{c.rotulo} avaliação</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-white/55">
          Acerto médio em Português e Matemática: de cada 100 questões, quantas foram acertadas.
        </p>
      </article>
    </div>
  );
}

/** Um cartão por turma com os três bimestres e as duas diagnósticas. */
export function TurmasNoAnoGrade({ turmas }: { turmas: TurmaNoAno[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {turmas.map((t, idx) => {
        const cor = serieClasses(t.ano - 1);
        return (
          <article
            key={t.chave}
            style={{ animationDelay: `${idx * 50}ms` }}
            className="lab-aluno flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/25"
          >
            <header className="flex items-center justify-between gap-2">
              <span
                className={cn("rounded-lg px-2 py-0.5 text-sm font-extrabold", cor.bg, cor.text)}
              >
                {t.ano}º {t.turma}
              </span>
              <Variacao pontos={t.desde1} />
            </header>
            <ol className="space-y-1.5">
              {t.leitura.map((f) => (
                <li
                  key={f.bim}
                  className="grid grid-cols-[1.6rem_minmax(0,1fr)_2.4rem] items-center gap-2"
                >
                  <span className="text-[11px] font-semibold text-white/60">{f.bim}º</span>
                  <BarraLeitura foto={f} />
                  <span className="text-right text-xs font-bold tabular-nums">
                    {porcento(f.leem)}
                  </span>
                </li>
              ))}
            </ol>
            <footer className="mt-auto flex flex-wrap gap-1.5 border-t border-white/10 pt-2.5">
              {t.diagnostica.map((d) => (
                <span
                  key={d.disc}
                  className="inline-flex items-center gap-1 rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[11px] text-white/75"
                  title={`${d.disc === "LP" ? "Português" : "Matemática"}: acerto na 1ª e na 2ª avaliação diagnóstica`}
                >
                  <b className="text-white/90">{d.disc === "LP" ? "Port." : "Mat."}</b>
                  {porcento(d.i)} → {porcento(d.ii)}
                </span>
              ))}
            </footer>
          </article>
        );
      })}
    </div>
  );
}
