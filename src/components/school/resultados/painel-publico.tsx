import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  BookOpenText,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  ListChecks,
  MessageCircle,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";

import alunos1 from "@/assets/alunos-1.jpg";
import alunos3 from "@/assets/alunos-3.jpg";
import fotoTurma from "@/assets/laboratorio-informatica-turma.jpg";
import { PainelMapaClasse } from "@/components/school/mapa-classe/painel";
import { PainelRendimento } from "@/components/school/rendimento/painel";
import { HeroResultados } from "@/components/school/resultados/hero";
import { LinhaDoAno, TurmasNoAnoGrade } from "@/components/school/resultados/linha-do-tempo";
import { useProvasII } from "@/lib/diagnostica/use-provas";
import { RENDIMENTO_3_BIMESTRE } from "@/lib/rendimento/dados-3bim";
import { gerarDestaques, type Destaque } from "@/lib/resultados/destaques";
import { diagnosticaDaEscola, leituraDaEscola, turmasNoAno } from "@/lib/resultados/linha-do-tempo";
import { REFERENCIA, textoAplicacao } from "@/lib/resultados/referencia";
import { cn } from "@/lib/utils";

type Aba = "mapa" | "notas";

/** Para onde cada leitura do resumo leva quando é tocada. */
const DESTINO: Record<string, Aba | "turmas"> = {
  "leitura-escola": "turmas",
  "leitura-turmas": "turmas",
  "leitura-recente": "turmas",
  diagnostica: "turmas",
  "leitura-prioridade": "mapa",
  "escrita-prioridade": "mapa",
  notas: "notas",
  contraste: "notas",
};

const TOM: Record<
  Destaque["tom"],
  { cartao: string; selo: string; Icone: LucideIcon; rotulo: string }
> = {
  positivo: {
    cartao: "from-emerald-500/20",
    selo: "bg-emerald-400/15 text-emerald-300",
    Icone: TrendingUp,
    rotulo: "Boa notícia",
  },
  atencao: {
    cartao: "from-amber-500/20",
    selo: "bg-amber-400/15 text-amber-300",
    Icone: AlertTriangle,
    rotulo: "Ponto de atenção",
  },
  neutro: {
    cartao: "from-sky-500/20",
    selo: "bg-sky-400/15 text-sky-300",
    Icone: MessageCircle,
    rotulo: "Para conversar",
  },
};

const porcento = (v: number | null | undefined) => (v == null ? "—" : `${Math.round(v * 100)}%`);

/**
 * Página pública dos resultados do bimestre. Abre com os números principais,
 * mostra o ano inteiro (leitura do 1º ao 3º bimestre e as duas avaliações
 * diagnósticas), cada turma nesse percurso, as leituras automáticas e, por
 * fim, os detalhes do bimestre atual. Sempre em tema escuro.
 */
export function PainelPublico() {
  const { provas } = useProvasII();
  const [aba, setAba] = useState<Aba>("mapa");
  const detalhesRef = useRef<HTMLElement>(null);
  const turmasRef = useRef<HTMLElement>(null);

  const leitura = useMemo(() => leituraDaEscola(), []);
  const turmas = useMemo(() => turmasNoAno(provas), [provas]);
  const diag = useMemo(() => diagnosticaDaEscola(provas), [provas]);
  const destaques = useMemo(() => gerarDestaques(provas), [provas]);

  const notas = useMemo(() => {
    const ds = RENDIMENTO_3_BIMESTRE.turmas.flatMap((t) => t.disciplinas);
    const total = ds.reduce((s, d) => s + d.total, 0);
    const padrao = ds.reduce((s, d) => s + d.padrao, 0);
    const cem = RENDIMENTO_3_BIMESTRE.turmas.filter((t) =>
      t.disciplinas.every((d) => d.padrao === d.total),
    ).length;
    return { parte: total ? padrao / total : 0, cem, turmas: RENDIMENTO_3_BIMESTRE.turmas.length };
  }, []);

  const [b1, , b3] = leitura;
  const dLeem = Math.round(((b3?.leem ?? 0) - (b1?.leem ?? 0)) * 100);
  const dPrior = Math.round(((b3?.prioridade ?? 0) - (b1?.prioridade ?? 0)) * 100);
  const dDiag = diag.ii != null ? Math.round((diag.ii - diag.i) * 100) : null;

  function irPara(destino: Aba | "turmas") {
    if (destino === "turmas") {
      turmasRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setAba(destino);
    detalhesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="dark bg-ink text-white">
      <HeroResultados
        selo={
          <>
            <CalendarDays className="size-3.5" aria-hidden /> Resultados · {REFERENCIA.bimestre}
          </>
        }
        titulo={
          <>
            Como as nossas crianças <span className="text-sun">estão aprendendo</span>
          </>
        }
        texto={
          <>
            O 3º bimestre comparado com o 1º e o 2º, e as duas avaliações diagnósticas do ano.{" "}
            {REFERENCIA.escola} · {REFERENCIA.municipio}. Os números são por turma: ninguém é
            identificado.
          </>
        }
        foto={fotoTurma}
        mosaico={[alunos1, alunos3]}
        barras={leitura.map((f) => ({ rotulo: `${f.bim}º bim.`, valor: f.leem }))}
        indicadores={[
          {
            Icone: BookOpenText,
            rotulo: "Leem bem",
            valor: porcento(b3?.leem),
            detalhe: `${dLeem >= 0 ? "+" : ""}${dLeem} pts desde o 1º bim. (${porcento(b1?.leem)})`,
            tom: dLeem >= 0 ? "sobe" : "desce",
          },
          {
            Icone: Target,
            rotulo: "Prioridade na leitura",
            valor: porcento(b3?.prioridade),
            detalhe: `${dPrior > 0 ? "+" : ""}${dPrior} pts desde o 1º bim. (${porcento(b1?.prioridade)})`,
            tom: dPrior <= 0 ? "sobe" : "desce",
          },
          {
            Icone: ListChecks,
            rotulo: "2ª diagnóstica",
            valor: porcento(diag.ii),
            detalhe:
              dDiag == null
                ? `1ª avaliação: ${porcento(diag.i)}`
                : `${dDiag >= 0 ? "+" : ""}${dDiag} pts sobre a 1ª (${porcento(diag.i)})`,
            tom: dDiag == null ? "neutro" : dDiag >= 0 ? "sobe" : "desce",
          },
          {
            Icone: GraduationCap,
            rotulo: "Notas de 7,0 a 10,0",
            valor: porcento(notas.parte),
            detalhe: `${notas.cem} de ${notas.turmas} turmas com todos acima de 7,0`,
            tom: "neutro",
          },
        ]}
        acoes={
          <>
            <button
              type="button"
              onClick={() => irPara("turmas")}
              className="inline-flex items-center gap-2 rounded-full bg-sun px-5 py-2.5 text-sm font-bold text-sun-foreground shadow-lg transition hover:brightness-110"
            >
              Ver turma por turma <ArrowDown className="size-4" aria-hidden />
            </button>
            <Link
              to="/avaliacao"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/20"
            >
              Avaliações diagnósticas <ArrowRight className="size-4" aria-hidden />
            </Link>
          </>
        }
      />

      <div className="mx-auto max-w-6xl space-y-14 px-4 py-12 sm:px-6">
        <Secao
          selo="O ano até aqui"
          titulo="O 3º bimestre ao lado dos anteriores"
          texto="A leitura medida no mapa de classe de cada bimestre e as duas avaliações diagnósticas, na mesma tela."
        >
          <LinhaDoAno leitura={leitura} diagnostica={diag} />
        </Secao>

        <Secao
          ref={turmasRef}
          selo="Turma por turma"
          titulo="Cada turma do 1º ao 3º bimestre"
          texto="As três barras são a leitura em cada bimestre; o selo no alto mostra quanto a parte que lê bem mudou desde o 1º. Embaixo, o acerto na 1ª e na 2ª avaliação diagnóstica."
        >
          <TurmasNoAnoGrade turmas={turmas} />
        </Secao>

        <Secao
          selo="Leituras dos números"
          titulo="O que os números contam"
          texto="Frases calculadas a partir dos mesmos dados das tabelas. Toque num cartão para ver de onde vem."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {destaques.map((d, i) => {
              const tom = TOM[d.tom];
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => irPara(DESTINO[d.id] ?? "mapa")}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className={cn(
                    "lab-aluno group flex flex-col gap-3 rounded-2xl border border-white/10 bg-gradient-to-br to-white/[0.03] p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-white/30",
                    tom.cartao,
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                      tom.selo,
                    )}
                  >
                    <tom.Icone className="size-3.5" aria-hidden /> {tom.rotulo}
                  </span>
                  <span className="text-lg font-bold leading-snug">{d.titulo}</span>
                  <span className="text-sm leading-relaxed text-white/70">{d.texto}</span>
                  <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-semibold text-sun opacity-70 transition group-hover:opacity-100">
                    Ver os dados
                    <ArrowRight
                      className="size-3.5 transition group-hover:translate-x-1"
                      aria-hidden
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </Secao>

        <Secao
          ref={detalhesRef}
          selo={REFERENCIA.bimestre}
          titulo="Detalhes do bimestre"
          texto="Níveis de leitura e escrita de cada turma e as notas, disciplina por disciplina."
        >
          <div
            role="tablist"
            aria-label="Detalhes do bimestre"
            className="mb-5 inline-flex rounded-full border border-white/15 bg-white/[0.06] p-1"
          >
            {(
              [
                ["mapa", "Leitura e escrita", BookOpenText],
                ["notas", "Notas do bimestre", ClipboardCheck],
              ] as const
            ).map(([id, nome, Icone]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={aba === id}
                onClick={() => setAba(id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                  aba === id
                    ? "bg-sun text-sun-foreground shadow"
                    : "text-white/70 hover:text-white",
                )}
              >
                <Icone className="size-4" aria-hidden /> {nome}
              </button>
            ))}
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-3 sm:p-5">
            {aba === "mapa" ? (
              <PainelMapaClasse mostrarProfessor={false} semCabecalho />
            ) : (
              <PainelRendimento mostrarProfessor={false} semCabecalho />
            )}
          </div>
        </Secao>

        <footer className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm sm:grid-cols-3">
          {REFERENCIA.instrumentos.map((i) => (
            <div key={i.id}>
              <p className="font-semibold">{i.nome}</p>
              <p className="text-xs text-white/60">
                {i.periodo} · aplicação: {textoAplicacao(i)}
              </p>
              <p className="mt-1 text-[11px] text-white/45">Fonte: {i.fonte}</p>
            </div>
          ))}
          <p className="text-xs text-white/50 sm:col-span-3">
            Publicado em {REFERENCIA.publicadoEm}. Os bimestres anteriores vêm do próprio mapa de
            classe; a 2ª avaliação diagnóstica, da tabulação por aluno publicada em Avaliações.
          </p>
        </footer>
      </div>
    </div>
  );
}

function Secao({
  ref,
  selo,
  titulo,
  texto,
  children,
}: {
  ref?: React.Ref<HTMLElement>;
  selo: ReactNode;
  titulo: string;
  texto: string;
  children: ReactNode;
}) {
  return (
    <section ref={ref} className="scroll-mt-20">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-sun">{selo}</p>
      <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl">{titulo}</h2>
      <p className="mb-6 mt-2 max-w-3xl text-sm text-white/65">{texto}</p>
      {children}
    </section>
  );
}
