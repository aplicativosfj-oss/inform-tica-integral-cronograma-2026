import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BedDouble,
  Clapperboard,
  Clock,
  Dices,
  Moon,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { IlustracaoEspaco } from "@/components/school/pausa/ilustracoes";
import {
  DIAS,
  ESPACOS,
  SALA_REPOUSO,
  HORARIO,
  diaUtilDeHoje,
  turmasNoDia,
  type DiaUtil,
  type Espaco,
} from "@/lib/entre-turnos";
import { cn } from "@/lib/utils";

const ESTILO: Record<Espaco, { Icone: LucideIcon; ponto: string; chip: string }> = {
  aula: { Icone: BedDouble, ponto: "bg-indigo-400", chip: "bg-indigo-500/25 text-indigo-100" },
  filme: { Icone: Clapperboard, ponto: "bg-rose-400", chip: "bg-rose-500/25 text-rose-100" },
  jogos: { Icone: Dices, ponto: "bg-emerald-400", chip: "bg-emerald-500/25 text-emerald-100" },
};

/**
 * Faixa da página inicial que leva ao "Entre Turnos": mostra, em uma olhada,
 * para onde vão as turmas no intervalo de hoje (ou de segunda, no fim de
 * semana). Fica entre a abertura e o laboratório ao vivo, sem tomar a tela.
 */
export function BannerEntreTurnos() {
  const [dia, setDia] = useState<DiaUtil | null>(null);
  const [ehHoje, setEhHoje] = useState(true);
  useEffect(() => {
    const hoje = diaUtilDeHoje();
    setEhHoje(hoje !== null);
    setDia(hoje ?? 1);
  }, []);

  const doDia = dia ? turmasNoDia(dia) : null;
  const nomeDia = DIAS.find((d) => d.dia === dia)?.nome.toLowerCase();

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6">
      <Link
        to="/entre-turnos"
        className="group relative isolate block overflow-hidden rounded-[2rem] bg-ink p-5 text-white shadow-xl ring-1 ring-white/10 transition-transform duration-300 hover:-translate-y-0.5 sm:p-7 dark:bg-card"
      >
        <div
          aria-hidden
          className="fundo-pixel absolute inset-0 -z-10 opacity-25 [mask-image:linear-gradient(to_right,black,transparent_70%)]"
        />
        <div
          aria-hidden
          className="absolute -left-20 -top-24 -z-10 size-72 rounded-full bg-sun/20 blur-3xl"
        />

        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-sun">
              <Clock className="size-3.5" aria-hidden /> Entre Turnos · {HORARIO.inicio} às{" "}
              {HORARIO.fim}
            </p>
            <h2 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">
              {ehHoje ? "Hoje, depois do almoço," : `Na ${nomeDia ?? "segunda-feira"},`}{" "}
              <span className="text-sun">cada turma tem o seu lugar</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              Descanso na sala, cinema ou sala de jogos: veja onde está cada turma no intervalo e
              quem cuida dela.
            </p>

            <ul className="mt-4 grid gap-2 sm:grid-cols-3">
              {(["aula", "filme", "jogos"] as Espaco[]).map((e) => {
                const { Icone, ponto, chip } = ESTILO[e];
                const lista = doDia?.[e] ?? [];
                return (
                  <li key={e} className="rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
                    <p className="flex items-center gap-2 text-xs font-bold">
                      <span className={cn("size-2 rounded-full", ponto)} aria-hidden />
                      <Icone className="size-3.5 text-white/70" aria-hidden />
                      {ESPACOS[e].nome}
                    </p>
                    <p className="mt-2 flex min-h-6 flex-wrap gap-1">
                      {doDia ? (
                        lista.map((t) => (
                          <span
                            key={t.turma}
                            className={cn("rounded-md px-1.5 py-0.5 text-xs font-bold", chip)}
                          >
                            {t.turma}
                          </span>
                        ))
                      ) : (
                        <span className="h-5 w-24 animate-pulse rounded bg-white/10" />
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 flex items-center gap-2 text-xs text-white/70">
              <Moon className="size-3.5 shrink-0 text-sky-300" aria-hidden />
              <span>
                <strong className="text-white">{SALA_REPOUSO.nome}</strong> aberta todo dia para
                quem quer dormir:{" "}
                {SALA_REPOUSO.grupos
                  .map((g) => `${g.publico.toLowerCase()} na ${g.local.toLowerCase()}`)
                  .join(", ")}
                .
              </span>
            </p>

            <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-sun px-5 py-2.5 text-sm font-bold text-sun-foreground">
              Ver o cronograma da semana
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </span>
          </div>

          <div aria-hidden className="relative hidden h-52 lg:block">
            <IlustracaoEspaco
              espaco="aula"
              className="absolute left-0 top-0 w-40 rotate-[-6deg] rounded-xl border-4 border-white/90 shadow-2xl"
            />
            <IlustracaoEspaco
              espaco="filme"
              className="absolute right-0 top-4 w-40 rotate-[5deg] rounded-xl border-4 border-white/90 shadow-2xl"
            />
            <IlustracaoEspaco
              espaco="jogos"
              className="absolute bottom-0 left-16 w-44 rotate-[-2deg] rounded-xl border-4 border-white/90 shadow-2xl transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>
      </Link>
    </section>
  );
}
