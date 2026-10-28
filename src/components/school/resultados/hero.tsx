import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface IndicadorHero {
  Icone: LucideIcon;
  rotulo: string;
  valor: string;
  /** Linha pequena de comparação, ex.: "era 32% no 1º bimestre". */
  detalhe?: string | undefined;
  tom?: "sobe" | "desce" | "neutro" | undefined;
}

/**
 * Abertura das páginas públicas de Resultados e Avaliações: foto da escola em
 * tela cheia, um mosaico de fotos e um quadro de barras animado à direita, e
 * os números principais em cartões de vidro logo abaixo do título.
 * Sempre escura, para o texto ler bem sobre qualquer foto.
 */
export function HeroResultados({
  selo,
  titulo,
  texto,
  foto,
  mosaico,
  barras,
  indicadores,
  acoes,
  acento = "sun",
}: {
  selo: ReactNode;
  titulo: ReactNode;
  texto: ReactNode;
  foto: string;
  /** Duas fotos menores que flutuam à direita (só no computador). */
  mosaico: [string, string];
  /** Alturas (0 a 1) do quadro de barras decorativo, da esquerda para a direita. */
  barras: { rotulo: string; valor: number; destaque?: boolean }[];
  indicadores: IndicadorHero[];
  acoes?: ReactNode;
  acento?: "sun" | "sky";
}) {
  const corAcento = acento === "sun" ? "text-sun" : "text-sky-300";
  return (
    <section className="dark relative isolate overflow-hidden text-white">
      <img
        src={foto}
        alt=""
        aria-hidden
        className="hero-zoom absolute inset-0 -z-30 size-full object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-gradient-to-r from-ink via-ink/90 to-ink/40 lg:via-ink/80 lg:to-ink/10"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-20 h-2/3 bg-gradient-to-t from-ink to-transparent"
      />
      <div aria-hidden className="fundo-pixel absolute inset-0 -z-10 opacity-20" />

      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-8 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center lg:pb-10">
        <div className="hero-subir">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] backdrop-blur",
              corAcento,
            )}
          >
            {selo}
          </div>
          <h1 className="mt-4 max-w-2xl text-balance text-[clamp(2rem,5vw,3.4rem)] font-extrabold leading-[1.05] tracking-tight">
            {titulo}
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-white/75 sm:text-base">
            {texto}
          </p>
          {acoes ? <div className="mt-6 flex flex-wrap gap-2.5">{acoes}</div> : null}
        </div>

        {/* mosaico: duas fotos inclinadas e o quadro de barras */}
        <div aria-hidden className="relative hidden h-80 lg:block">
          <img
            src={mosaico[0]}
            alt=""
            className="absolute left-0 top-0 h-36 w-48 rotate-[-6deg] rounded-2xl border-4 border-white/90 object-cover shadow-2xl"
          />
          <img
            src={mosaico[1]}
            alt=""
            className="absolute right-0 top-6 h-32 w-44 rotate-[5deg] rounded-2xl border-4 border-white/90 object-cover shadow-2xl"
          />
          <div className="absolute bottom-0 left-1/2 w-72 -translate-x-1/2 rounded-2xl border border-white/20 bg-ink/80 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex h-28 items-stretch gap-2.5">
              {barras.map((b, i) => (
                <div
                  key={b.rotulo}
                  className="flex flex-1 flex-col items-center justify-end gap-1.5"
                >
                  <span className="text-[10px] font-bold tabular-nums text-white/80">
                    {Math.round(b.valor * 100)}%
                  </span>
                  <span
                    className={cn(
                      "hero-barra w-full rounded-t-md",
                      (b.destaque ?? i === barras.length - 1)
                        ? "bg-gradient-to-t from-sun/70 to-sun"
                        : "bg-gradient-to-t from-sky-500/50 to-sky-300/80",
                    )}
                    style={{
                      height: `${Math.max(6, b.valor * 80)}%`,
                      animationDelay: `${300 + i * 120}ms`,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex gap-2.5 border-t border-white/15 pt-1.5">
              {barras.map((b) => (
                <span key={b.rotulo} className="flex-1 text-center text-[10px] text-white/60">
                  {b.rotulo}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {indicadores.map(({ Icone, rotulo, valor, detalhe, tom }, i) => (
            <li
              key={rotulo}
              style={{ animationDelay: `${150 + i * 90}ms` }}
              className="hero-subir flex flex-col gap-2 rounded-2xl border border-white/15 bg-white/[0.07] p-3.5 backdrop-blur-md sm:p-4"
            >
              <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-white/65">
                <Icone className={cn("size-4 shrink-0", corAcento)} aria-hidden />
                {rotulo}
              </span>
              <span className="text-2xl font-extrabold tabular-nums leading-none sm:text-3xl">
                {valor}
              </span>
              {detalhe ? (
                <span
                  className={cn(
                    "text-xs leading-snug",
                    tom === "sobe"
                      ? "text-emerald-300"
                      : tom === "desce"
                        ? "text-rose-300"
                        : "text-white/60",
                  )}
                >
                  {detalhe}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
