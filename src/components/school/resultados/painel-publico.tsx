import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenText,
  CalendarDays,
  ClipboardCheck,
  LineChart,
  ListChecks,
  PenLine,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import alunos2 from "@/assets/alunos-2.jpg";
import alunos3 from "@/assets/alunos-3.jpg";
import cadernoImg from "@/assets/caderno-mesa.webp";
import fundoImg from "@/assets/feature-kids-learning.jpg";
import { PainelMapaClasse } from "@/components/school/mapa-classe/painel";
import { PainelRendimento } from "@/components/school/rendimento/painel";
import { gerarDestaques, type Destaque } from "@/lib/resultados/destaques";
import { REFERENCIA, instrumento, textoAplicacao } from "@/lib/resultados/referencia";
import { cn } from "@/lib/utils";

type Aba = "resumo" | "mapa" | "notas";

const ABAS: {
  id: Aba;
  nome: string;
  legenda: string;
  Icone: LucideIcon;
  img: string;
  instrumento?: "mapa" | "rendimento";
}[] = [
  {
    id: "resumo",
    nome: "Resumo",
    legenda: "o que os números contam",
    Icone: LineChart,
    img: fundoImg,
  },
  {
    id: "mapa",
    nome: "Leitura e escrita",
    legenda: "níveis por turma",
    Icone: BookOpenText,
    img: alunos2,
    instrumento: "mapa",
  },
  {
    id: "notas",
    nome: "Notas do bimestre",
    legenda: "disciplina por disciplina",
    Icone: ClipboardCheck,
    img: cadernoImg,
    instrumento: "rendimento",
  },
];

/** Para onde cada leitura do Resumo leva quando é tocada. */
const DESTINO: Record<string, Aba> = {
  "leitura-escola": "mapa",
  "leitura-turmas": "mapa",
  "leitura-prioridade": "mapa",
  "escrita-prioridade": "mapa",
  notas: "notas",
  contraste: "notas",
};

const TOM: Record<
  Destaque["tom"],
  { faixa: string; icone: string; Icone: LucideIcon; rotulo: string }
> = {
  positivo: {
    faixa: "from-emerald-400 to-emerald-600",
    icone: "bg-emerald-400/20 text-emerald-300",
    Icone: TrendingUp,
    rotulo: "Boa notícia",
  },
  atencao: {
    faixa: "from-amber-300 to-orange-500",
    icone: "bg-amber-400/20 text-amber-300",
    Icone: AlertTriangle,
    rotulo: "Ponto de atenção",
  },
  neutro: {
    faixa: "from-sky-300 to-indigo-500",
    icone: "bg-sky-400/20 text-sky-300",
    Icone: PenLine,
    rotulo: "Para conversar",
  },
};

/**
 * Página pública dos resultados do bimestre, numa janela só: título, quatro
 * portas (resumo, leitura e escrita, notas e a área de Avaliações) e, embaixo,
 * o conteúdo da porta escolhida, que rola por dentro. Sempre em tema escuro,
 * sobre uma imagem de fundo da escola.
 */
export function PainelPublico() {
  const [aba, setAba] = useState<Aba>("resumo");
  const destaques = useMemo(() => gerarDestaques(), []);
  const diag = instrumento("diagnostica");

  return (
    <div className="dark relative isolate flex flex-col overflow-hidden text-white lg:h-[calc(100svh-4rem)]">
      <img
        src={fundoImg}
        alt=""
        aria-hidden
        className="absolute inset-0 -z-30 size-full scale-110 object-cover blur-[2px]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-gradient-to-b from-ink/85 via-ink/70 to-ink/95"
      />
      <div aria-hidden className="fundo-pixel absolute inset-0 -z-10 opacity-25" />

      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-[clamp(0.6rem,1.8svh,1.1rem)] px-4 py-[clamp(0.75rem,2.5svh,1.5rem)] sm:px-6">
        {/* título */}
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sun">
              Resultados · {REFERENCIA.bimestre}
            </p>
            <h1 className="mt-1 text-[clamp(1.6rem,4.6svh,2.6rem)] font-extrabold leading-tight tracking-tight">
              Como as nossas crianças estão aprendendo
            </h1>
            <p className="mt-1 max-w-2xl text-[clamp(0.8rem,1.9svh,0.95rem)] text-white/70">
              {REFERENCIA.escola} · {REFERENCIA.municipio}. Os números são por turma: ninguém é
              identificado.
            </p>
          </div>
          <p className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur">
            <CalendarDays className="size-3.5 text-sun" aria-hidden />
            publicado em {REFERENCIA.publicadoEm}
          </p>
        </header>

        {/* as quatro portas */}
        <nav
          aria-label="Seções dos resultados"
          className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {ABAS.map(({ id, nome, legenda, Icone, img, instrumento: ins }) => {
            const ativa = aba === id;
            const info = ins ? instrumento(ins) : null;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={ativa}
                onClick={() => setAba(id)}
                className={cn(
                  "group relative isolate flex min-h-[clamp(4.5rem,11svh,6.5rem)] flex-col justify-end overflow-hidden rounded-2xl border text-left transition duration-300",
                  ativa
                    ? "border-sun shadow-[0_0_0_1px_var(--color-sun),0_12px_40px_-12px_rgb(0_0_0/0.8)]"
                    : "border-white/15 hover:-translate-y-0.5 hover:border-white/40",
                )}
              >
                <img
                  src={img}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-0 -z-10 bg-gradient-to-t transition-opacity",
                    ativa
                      ? "from-ink/95 via-ink/70 to-primary/40"
                      : "from-ink/95 via-ink/75 to-ink/40",
                  )}
                />
                <span className="flex items-start gap-2.5 p-3">
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-xl transition",
                      ativa ? "bg-sun text-sun-foreground" : "bg-white/15 text-white",
                    )}
                  >
                    <Icone className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold leading-tight">{nome}</span>
                    <span className="block text-[11px] text-white/65">
                      {info ? `aplicada: ${textoAplicacao(info)}` : legenda}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}

          <Link
            to="/avaliacao"
            className="group relative isolate flex min-h-[clamp(4.5rem,11svh,6.5rem)] flex-col justify-end overflow-hidden rounded-2xl border border-dashed border-white/30 text-left transition duration-300 hover:-translate-y-0.5 hover:border-white/60"
          >
            <img
              src={alunos3}
              alt=""
              aria-hidden
              className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <span
              aria-hidden
              className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/95 via-ink/75 to-violet-900/40"
            />
            <span className="flex items-start gap-2.5 p-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <ListChecks className="size-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 text-sm font-bold leading-tight">
                  Avaliações diagnósticas
                  <ArrowRight
                    className="size-3.5 transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                </span>
                <span className="block text-[11px] text-white/65">I e II · {diag.periodo}</span>
              </span>
            </span>
          </Link>
        </nav>

        {/* conteúdo da porta escolhida */}
        <section
          aria-label={ABAS.find((a) => a.id === aba)?.nome}
          className="min-h-0 flex-1 overflow-y-auto rounded-2xl pr-1"
        >
          {aba === "resumo" ? (
            <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {destaques.map((d, i) => {
                const tom = TOM[d.tom];
                const destino = DESTINO[d.id] ?? "mapa";
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setAba(destino)}
                    style={{ animationDelay: `${i * 70}ms` }}
                    className="lab-aluno group relative flex flex-col gap-2 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 pl-5 text-left backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/10"
                  >
                    <span
                      aria-hidden
                      className={cn("absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b", tom.faixa)}
                    />
                    <span className="flex items-start gap-2.5 pr-5">
                      <span
                        title={tom.rotulo}
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-lg",
                          tom.icone,
                        )}
                      >
                        <tom.Icone className="size-4" aria-hidden />
                      </span>
                      <span className="font-heading text-[clamp(0.85rem,2svh,1rem)] font-bold leading-snug">
                        {d.titulo}
                      </span>
                    </span>
                    <span className="text-[clamp(11.5px,1.75svh,13px)] leading-snug text-white/75">
                      {d.texto}
                    </span>
                    <ArrowRight
                      className="absolute right-3 top-3.5 size-4 text-sun opacity-50 transition group-hover:translate-x-1 group-hover:opacity-100"
                      aria-hidden
                    />
                  </button>
                );
              })}
            </div>
          ) : aba === "mapa" ? (
            <PainelMapaClasse mostrarProfessor={false} semCabecalho />
          ) : (
            <PainelRendimento mostrarProfessor={false} semCabecalho />
          )}
        </section>
      </div>
    </div>
  );
}
