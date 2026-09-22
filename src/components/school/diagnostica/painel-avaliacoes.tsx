import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpenCheck,
  ClipboardList,
  Compass,
  Info,
  Minus,
  Scale,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import {
  alfabetizacao,
  desempenhoI,
  desempenhoII,
  evolucaoPorTurma,
  maisFortes,
  maisFrageis,
  ortografiaComparada,
  type DesempenhoTurma,
} from "@/lib/diagnostica/analise";
import { RaioXAlunoDialog, RaioXTurmaDialog } from "@/components/school/diagnostica/raio-x";
import { AnelPercentual, BarrasHabilidades } from "@/components/school/diagnostica/graficos";
import type { PerfilAluno } from "@/lib/diagnostica/analise";
import type { ProvaII } from "@/lib/diagnostica/tipos";
import { serieClasses } from "@/lib/serie-colors";
import { cn } from "@/lib/utils";

/**
 * Área única das avaliações diagnósticas, escrita para quem não trabalha com
 * dados: pai, mãe, professor regente, conselho escolar.
 *
 * Decisões que guiam o desenho:
 *
 * 1. **Uma régua só.** Tudo é "de cada 100 questões, quantas a turma
 *    acertou". A nota de 0 a 100 da SEME e os percentuais de faixa ficam
 *    para o painel de gestão; aqui atrapalhariam.
 * 2. **Antes e agora, lado a lado.** Cada turma aparece com um anel de
 *    percentual (a mesma régua de cor de `corDoAcerto` em toda a página) e
 *    uma frase dizendo o que aconteceu, em vez de um gráfico que exige
 *    legenda para ser lido.
 * 3. **Todo card de turma abre o raio-X.** Turma por turma, alfabetização e
 *    escrita — qualquer card com o nome de uma turma é clicável e, de
 *    dentro do raio-X, dá para abrir a ficha de um aluno específico.
 */

const DISCIPLINAS = [
  { id: "LP", nome: "Português" },
  { id: "MAT", nome: "Matemática" },
  { id: "CN", nome: "Ciências" },
] as const;

type DiscId = (typeof DISCIPLINAS)[number]["id"];

const porcento = (v: number | null | undefined) => (v == null ? "—" : `${Math.round(v * 100)}%`);
const nomeTurma = (ano: number, turma: string) => `${ano}º ano ${turma}`;

export function PainelAvaliacoes({
  provas,
  comAlunos = false,
  aoAbrirDetalhes,
}: {
  provas: ProvaII[];
  /** Mostra a lista de alunos dentro do raio-X da turma (e permite abrir a
   *  ficha de cada um) — liberado também na página pública. */
  comAlunos?: boolean;
  /** Leva para a aba "Detalhes da 2ª avaliação", opcionalmente já numa
   *  sub-aba específica (plano de ação, comparar). Só existe quando este
   *  painel roda dentro da página que tem as duas abas. */
  aoAbrirDetalhes?: (subAba?: string) => void;
}) {
  const [disc, setDisc] = useState<DiscId>("LP");
  const [turmaAberta, setTurmaAberta] = useState<{ ano: number; turma: string } | null>(null);
  const [alunoAberto, setAlunoAberto] = useState<PerfilAluno | null>(null);

  const dados = useMemo(() => {
    const i = desempenhoI();
    const ii = desempenhoII(provas);
    return {
      i,
      ii,
      evolucao: evolucaoPorTurma(provas),
      alfab: alfabetizacao(provas),
      ortografia: ortografiaComparada(provas),
      fortes: maisFortes(ii, 5),
      frageis: maisFrageis(ii, 5),
    };
  }, [provas]);

  const mediaI = media(dados.i.map((d) => d.acerto));
  const mediaII = media(dados.ii.filter((d) => d.disc !== "CN").map((d) => d.acerto));
  const comparaveis = dados.evolucao.filter((e) => e.delta != null);
  const subiram = comparaveis.filter((e) => (e.delta ?? 0) > 0).length;
  const deltaGeral = mediaII - mediaI;

  return (
    <div className="space-y-10">
      <Abertura mediaI={mediaI} mediaII={mediaII} subiram={subiram} total={comparaveis.length} />

      <Secao
        titulo="Como a escola foi nas duas avaliações"
        explicacao="Cada barra mostra, de cada 100 questões da prova, quantas os alunos acertaram."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <CartaoComparacao rotulo="1ª avaliação diagnóstica" valor={mediaI} tom="antes" />
          <CartaoComparacao rotulo="2ª avaliação diagnóstica" valor={mediaII} tom="agora" />
        </div>
        <FraseDoResultado delta={deltaGeral} />
      </Secao>

      <Secao
        titulo="Turma por turma"
        explicacao="O anel mostra o acerto na 2ª avaliação; a frase abaixo compara com a 1ª. Toque num card para abrir o raio-X."
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {DISCIPLINAS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDisc(d.id)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-semibold transition",
                disc === d.id
                  ? "border-transparent bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {d.nome}
            </button>
          ))}
        </div>
        <ListaDeTurmas
          disc={disc}
          desI={dados.i}
          desII={dados.ii}
          aoAbrir={(ano, turma) => setTurmaAberta({ ano, turma })}
        />
      </Secao>

      {dados.alfab.length > 0 && (
        <Secao
          titulo="Alfabetização no 1º e no 2º ano"
          explicacao="Parte da turma que já escreve de forma alfabética, ou seja, escrevendo as palavras com as letras certas, mesmo com erros de ortografia. Toque num card para ver o raio-X da turma."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {dados.alfab.map((a) => (
              <button
                key={`${a.ano}${a.turma}`}
                type="button"
                onClick={() => setTurmaAberta({ ano: a.ano, turma: a.turma })}
                className="text-left"
                aria-label={`Abrir o raio-X do ${nomeTurma(a.ano, a.turma)}`}
              >
                <Card className="h-full transition hover:border-primary hover:shadow-md">
                  <CardContent className="space-y-3 py-4">
                    <p className="font-semibold">{nomeTurma(a.ano, a.turma)}</p>
                    <BarraDupla i={a.i} ii={a.ii} />
                    <Veredito delta={a.delta} sufixo="de alunos alfabéticos" />
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </Secao>
      )}

      {dados.ortografia.length > 0 && (
        <Secao
          titulo="Escrita do 3º ao 5º ano"
          explicacao="Parte da turma que escreveu o texto da prova com no máximo quatro erros de ortografia. Toque num card para ver o raio-X da turma."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {dados.ortografia.map((o) => (
              <button
                key={`orto-${o.ano}${o.turma}`}
                type="button"
                onClick={() => setTurmaAberta({ ano: o.ano, turma: o.turma })}
                className="text-left"
                aria-label={`Abrir o raio-X do ${nomeTurma(o.ano, o.turma)}`}
              >
                <Card className="h-full transition hover:border-primary hover:shadow-md">
                  <CardContent className="space-y-3 py-4">
                    <p className="font-semibold">{nomeTurma(o.ano, o.turma)}</p>
                    <BarraDupla i={o.i} ii={o.ii} />
                    <Veredito delta={o.delta} sufixo="de alunos que escrevem com poucos erros" />
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </Secao>
      )}

      <Secao
        titulo="O que os alunos já aprenderam e o que falta"
        explicacao="Resultados da 2ª avaliação, somando todas as turmas."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <QuadroHabilidades
            titulo="Já está bem aprendido"
            cor="emerald"
            itens={dados.fortes.map((h) => ({
              rotulo: h.texto,
              valor: h.acerto,
              detalhe: nomeTurma(h.ano, h.turma),
            }))}
          />
          <QuadroHabilidades
            titulo="Precisa ser retomado"
            cor="rose"
            itens={dados.frageis.map((h) => ({
              rotulo: h.texto,
              valor: h.acerto,
              detalhe: nomeTurma(h.ano, h.turma),
            }))}
          />
        </div>
      </Secao>

      {aoAbrirDetalhes && (
        <Secao
          titulo="Ferramentas de apoio"
          explicacao="Recursos mais avançados, na aba Detalhes da 2ª avaliação, e o guia de habilidades da escola inteira."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <button type="button" onClick={() => aoAbrirDetalhes("plano")} className="text-left">
              <Card className="h-full border-violet-400/30 bg-violet-500/[0.06] transition hover:border-violet-400/60 hover:shadow-md dark:border-violet-400/20 dark:bg-violet-400/[0.06]">
                <CardContent className="flex items-start gap-3 py-5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300">
                    <ClipboardList className="size-5" />
                  </span>
                  <span>
                    <span className="block font-semibold">Montar plano de ação por turma</span>
                    <span className="block text-sm text-muted-foreground">
                      Agrupa os alunos pela mesma dificuldade e sugere quem pode ajudar quem.
                    </span>
                  </span>
                </CardContent>
              </Card>
            </button>
            <button type="button" onClick={() => aoAbrirDetalhes("comparar")} className="text-left">
              <Card className="h-full border-amber-400/30 bg-amber-500/[0.06] transition hover:border-amber-400/60 hover:shadow-md dark:border-amber-400/20 dark:bg-amber-400/[0.06]">
                <CardContent className="flex items-start gap-3 py-5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
                    <Scale className="size-5" />
                  </span>
                  <span>
                    <span className="block font-semibold">Comparar turmas ou alunos</span>
                    <span className="block text-sm text-muted-foreground">
                      Lado a lado, questão por questão — útil para reunião de pais e conselho.
                    </span>
                  </span>
                </CardContent>
              </Card>
            </button>
            <Link to="/avaliacao" search={{ aba: "descritores" as const }} className="text-left">
              <Card className="h-full border-indigo-400/30 bg-indigo-500/[0.06] transition hover:border-indigo-400/60 hover:shadow-md dark:border-indigo-400/20 dark:bg-indigo-400/[0.06]">
                <CardContent className="flex items-start gap-3 py-5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-300">
                    <Compass className="size-5" />
                  </span>
                  <span>
                    <span className="block font-semibold">Guia de habilidades</span>
                    <span className="block text-sm text-muted-foreground">
                      O que cada habilidade espera da criança, como avaliar e estratégias de apoio.
                    </span>
                  </span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </Secao>
      )}

      <Rodape />

      {turmaAberta && (
        <RaioXTurmaDialog
          aberto
          aoFechar={() => setTurmaAberta(null)}
          provas={provas}
          ano={turmaAberta.ano}
          turma={turmaAberta.turma}
          mostrarAlunos={comAlunos}
          aoAbrirAluno={(p) => {
            setTurmaAberta(null);
            setAlunoAberto(p);
          }}
        />
      )}
      <RaioXAlunoDialog
        perfil={alunoAberto}
        provas={provas}
        aoFechar={() => setAlunoAberto(null)}
      />
    </div>
  );
}

function Abertura({
  mediaI,
  mediaII,
  subiram,
  total,
}: {
  mediaI: number;
  mediaII: number;
  subiram: number;
  total: number;
}) {
  const delta = mediaII - mediaI;
  return (
    <header className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-6 sm:p-8">
      <div className="flex flex-col-reverse items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Avaliações diagnósticas 2026
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            Como está a aprendizagem na escola
          </h1>
          <p className="mt-3 max-w-3xl text-base text-muted-foreground">
            Duas vezes por ano, todos os alunos do 1º ao 5º ano fazem a mesma prova da Secretaria de
            Educação. Esta página compara a <b className="text-foreground">1ª avaliação</b> com a{" "}
            <b className="text-foreground">2ª</b> para mostrar, sem enrolação, o que melhorou e o
            que ainda precisa de atenção.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-lg">
            <span className="inline-flex items-center gap-2">
              <b className="text-2xl tabular-nums">{porcento(mediaI)}</b>
              <span className="text-muted-foreground">na 1ª</span>
            </span>
            <ArrowRight className="size-5 text-muted-foreground" />
            <span className="inline-flex items-center gap-2">
              <b className="text-2xl tabular-nums text-sky-600 dark:text-sky-400">
                {porcento(mediaII)}
              </b>
              <span className="text-muted-foreground">na 2ª</span>
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold backdrop-blur-md",
                delta >= 0
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  : "bg-rose-500/15 text-rose-700 dark:text-rose-400",
              )}
            >
              {delta >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
              {delta >= 0 ? "Subiu" : "Caiu"} {Math.abs(Math.round(delta * 100))} pontos
            </span>
            <span className="text-sm text-muted-foreground">
              {subiram} de {total} provas melhoraram
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <AnelPercentual valor={mediaII} tamanho={140} espessura={12} rotulo="2ª avaliação" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Escola · 2ª avaliação
          </p>
        </div>
      </div>
    </header>
  );
}

function Secao({
  titulo,
  explicacao,
  children,
}: {
  titulo: string;
  explicacao: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{titulo}</h2>
      <p className="mb-4 mt-1 max-w-3xl text-sm text-muted-foreground">{explicacao}</p>
      {children}
    </section>
  );
}

function CartaoComparacao({
  rotulo,
  valor,
  tom,
}: {
  rotulo: string;
  valor: number;
  tom: "antes" | "agora";
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <AnelPercentual valor={valor} tamanho={72} espessura={8} rotulo={rotulo} />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">{rotulo}</p>
          <p
            className={cn(
              "text-3xl font-bold tabular-nums",
              tom === "agora" && "text-sky-600 dark:text-sky-400",
            )}
          >
            {porcento(valor)}
          </p>
          <p className="text-xs text-muted-foreground">
            de cada 100 questões, {Math.round(valor * 100)} foram acertadas
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function FraseDoResultado({ delta }: { delta: number }) {
  const pontos = Math.abs(Math.round(delta * 100));
  return (
    <p className="mt-4 rounded-xl border border-border bg-muted/40 p-4 text-sm sm:text-base">
      {delta >= 0 ? (
        <>
          Entre a primeira e a segunda prova, os alunos passaram a acertar{" "}
          <b>{pontos} questões a mais em cada 100</b>. É um avanço real, medido com a mesma prova
          para toda a rede.
        </>
      ) : (
        <>
          Entre a primeira e a segunda prova, os alunos acertaram{" "}
          <b>{pontos} questões a menos em cada 100</b>. Vale comparar as duas provas antes de tirar
          conclusões: a segunda pode ter sido mais difícil.
        </>
      )}
    </p>
  );
}

function ListaDeTurmas({
  disc,
  desI,
  desII,
  aoAbrir,
}: {
  disc: DiscId;
  desI: DesempenhoTurma[];
  desII: DesempenhoTurma[];
  aoAbrir: (ano: number, turma: string) => void;
}) {
  const daDisc = desII
    .filter((d) => d.disc === disc)
    .sort((a, b) => a.ano - b.ano || a.turma.localeCompare(b.turma));

  if (daDisc.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem dados para esta disciplina.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {daDisc.map((d) => {
        const antes = desI.find((x) => x.ano === d.ano && x.turma === d.turma && x.disc === disc);
        const delta = antes ? d.acerto - antes.acerto : null;
        const cores = serieClasses(d.ano - 1);
        return (
          <button
            key={`${d.ano}${d.turma}`}
            type="button"
            onClick={() => aoAbrir(d.ano, d.turma)}
            className="text-left"
            aria-label={`Abrir o raio-X do ${nomeTurma(d.ano, d.turma)}`}
          >
            <Card className="h-full overflow-hidden transition hover:border-primary hover:shadow-md">
              <div className={cn("h-1.5 w-full", cores.bg)} aria-hidden />
              <CardContent className="flex items-center gap-3 py-4">
                <AnelPercentual valor={d.acerto} tamanho={60} espessura={7} />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-semibold">{nomeTurma(d.ano, d.turma)}</p>
                    <p className="shrink-0 text-xs text-muted-foreground">
                      {d.participantes} alunos
                    </p>
                  </div>
                  <Veredito delta={delta} sufixo="de acerto" />
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    <Search className="size-3.5" /> Ver raio-X
                  </span>
                </div>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}

/** Duas barras empilhadas: a 1ª avaliação em cinza, a 2ª em azul. */
function BarraDupla({ i, ii }: { i: number | null; ii: number | null }) {
  const linhas = [
    { rotulo: "1ª avaliação", valor: i, classe: "bg-muted-foreground/50" },
    { rotulo: "2ª avaliação", valor: ii, classe: "bg-sky-500" },
  ];
  return (
    <div className="space-y-2">
      {linhas.map((l) => (
        <div key={l.rotulo} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-xs text-muted-foreground">{l.rotulo}</span>
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-muted">
            {l.valor != null && (
              <div
                className={cn("h-full rounded-full", l.classe)}
                style={{ width: `${Math.max(2, l.valor * 100)}%` }}
              />
            )}
          </div>
          <span className="w-12 shrink-0 text-right text-sm font-bold tabular-nums">
            {l.valor == null ? "—" : porcento(l.valor)}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Frase curta dizendo o que aconteceu — é o que a maioria vai ler. */
function Veredito({ delta, sufixo }: { delta: number | null; sufixo: string }) {
  if (delta == null) {
    return (
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Minus className="size-4" /> Esta turma não tem resultado na 1ª avaliação para comparar.
      </p>
    );
  }
  const pontos = Math.abs(Math.round(delta * 100));
  if (pontos === 0) {
    return (
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Minus className="size-4" /> Ficou no mesmo patamar {sufixo}.
      </p>
    );
  }
  const subiu = delta > 0;
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-sm font-semibold",
        subiu ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400",
      )}
    >
      {subiu ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
      {subiu ? "Subiu" : "Caiu"} {pontos} pontos {sufixo}
    </p>
  );
}

function QuadroHabilidades({
  titulo,
  cor,
  itens,
}: {
  titulo: string;
  cor: "emerald" | "rose";
  itens: { rotulo: string; valor: number; detalhe: string }[];
}) {
  return (
    <Card>
      <CardContent className="space-y-4 py-5">
        <p
          className={cn(
            "flex items-center gap-2 font-bold",
            cor === "emerald"
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-rose-700 dark:text-rose-400",
          )}
        >
          <BookOpenCheck className="size-4" /> {titulo}
        </p>
        <BarrasHabilidades itens={itens} />
      </CardContent>
    </Card>
  );
}

function Rodape() {
  return (
    <section className="rounded-2xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
      <p className="mb-2 flex items-center gap-2 font-semibold text-foreground">
        <Info className="size-4" /> Como ler esta página
      </p>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          Os percentuais dizem quantas questões os alunos acertaram em cada 100 — não são nota de
          boletim.
        </li>
        <li>
          &ldquo;Pontos&rdquo; é a diferença entre as duas avaliações. Subir 10 pontos quer dizer
          acertar 10 questões a mais em cada 100.
        </li>
        <li>
          Turmas sem barra cinza não fizeram aquela prova na 1ª avaliação. No 1º ano, por exemplo, a
          leitura é feita pelo nível de escrita, e não por questões.
        </li>
        <li>
          Toque em qualquer card de turma para abrir o raio-X, e dentro dele em um aluno para ver a
          ficha individual — o que já domina e o que precisa retomar, habilidade por habilidade.
        </li>
        <li>
          Fonte: tabulação da I e da II Avaliação Diagnóstica 2026 da Secretaria Municipal de
          Educação.
        </li>
      </ul>
    </section>
  );
}

function media(valores: number[]): number {
  if (valores.length === 0) return 0;
  return valores.reduce((s, v) => s + v, 0) / valores.length;
}
