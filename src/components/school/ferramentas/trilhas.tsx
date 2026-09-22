import { useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpenText,
  Calculator,
  ClipboardCheck,
  Leaf,
  ListChecks,
  Printer,
  RefreshCw,
  School,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { Quiz, type Questao } from "@/components/school/ferramentas/quiz";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CATALOGO,
  DESCRITORES,
  NIVEIS,
  NOME_DISC,
  acertoDaEntrada,
  nivelRecomendado,
  usePrioridades,
  type Disciplina,
  type Entrada,
  type Nivel,
  type Serie,
} from "@/lib/recomposicao/catalogo";
import { useAppStore } from "@/lib/app-store";
import { gerarRodada } from "@/lib/recomposicao/geradores";
import { imprimirFolha } from "@/lib/recomposicao/imprimir";
import { cn } from "@/lib/utils";

/** Como a tela funciona, em três passos — é a primeira coisa que alguém de
 *  fora precisa saber para não achar que a lista está em ordem aleatória. */
const PASSOS = [
  {
    n: "1",
    icon: ListChecks,
    titulo: "Escolha o ano e a matéria",
    txt: "A lista abaixo muda junto.",
  },
  {
    n: "2",
    icon: Target,
    titulo: "Olhe a tarja colorida",
    txt: "Ela diz o quanto a turma errou naquela habilidade.",
  },
  {
    n: "3",
    icon: Sparkles,
    titulo: "Abra no nível indicado",
    txt: "O nível sugerido já vem do resultado da avaliação.",
  },
] as const;

const SERIES: Serie[] = [1, 2, 3, 4, 5];
const DISC: { id: Disciplina | "todas"; nome: string }[] = [
  { id: "todas", nome: "Todas" },
  { id: "MAT", nome: "Matemática" },
  { id: "LP", nome: "Português" },
  { id: "CN", nome: "Ciências" },
];

/**
 * Identidade visual por disciplina. Antes o card abria com o emoji da
 * atividade solto em `text-3xl` — lia como texto grande, não como ícone, e
 * não dizia de que matéria era. Agora o emoji entra como selo no canto de
 * um chip colorido com o ícone da disciplina, que é o que a pessoa procura
 * ao varrer a lista.
 */
const DISC_VISUAL: Record<Disciplina, { icon: LucideIcon; chip: string; barra: string }> = {
  MAT: {
    icon: Calculator,
    chip: "border-blue-400/35 bg-blue-500/15 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/15 dark:text-blue-300",
    barra: "bg-blue-500 dark:bg-blue-400",
  },
  LP: {
    icon: BookOpenText,
    chip: "border-rose-400/35 bg-rose-500/15 text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/15 dark:text-rose-300",
    barra: "bg-rose-500 dark:bg-rose-400",
  },
  CN: {
    icon: Leaf,
    chip: "border-emerald-400/35 bg-emerald-500/15 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-300",
    barra: "bg-emerald-500 dark:bg-emerald-400",
  },
};

/**
 * Cor, frase e explicação da tarja, a partir do acerto da série na
 * avaliação. A explicação existe porque "Consolidar" e "Precisa de reforço"
 * não querem dizer nada para quem chega de fora — mãe, aluno, mediador.
 */
const PRIORIDADES = [
  {
    ate: 50,
    txt: "Prioridade alta",
    explica: "menos da metade da turma acertou — é por aqui que vale começar",
    cls: "bg-rose-500/15 text-rose-700 ring-1 ring-inset ring-rose-500/25 dark:text-rose-300",
    ponto: "bg-rose-500",
  },
  {
    ate: 70,
    txt: "Precisa de reforço",
    explica: "a maioria acertou, mas ainda escapa gente pelo caminho",
    cls: "bg-amber-500/15 text-amber-800 ring-1 ring-inset ring-amber-500/25 dark:text-amber-300",
    ponto: "bg-amber-500",
  },
  {
    ate: Infinity,
    txt: "Consolidar",
    explica: "a turma foi bem — treinar aqui é para não esquecer",
    cls: "bg-emerald-500/15 text-emerald-700 ring-1 ring-inset ring-emerald-500/25 dark:text-emerald-300",
    ponto: "bg-emerald-500",
  },
] as const;

function prioridade(p: number | null) {
  if (p == null) return null;
  return PRIORIDADES.find((f) => p < f.ate) ?? PRIORIDADES[2];
}

function embaralhar(questoes: Questao[]): Questao[] {
  return questoes.map((q) => {
    const ordem = q.opcoes.map((_, i) => i).sort(() => Math.random() - 0.5);
    return {
      ...q,
      opcoes: ordem.map((i) => q.opcoes[i]!),
      respostaCorreta: ordem.indexOf(q.respostaCorreta),
    };
  });
}

function questoesDe(e: Entrada, nivel: Nivel): Questao[] {
  if (e.fonte.tipo === "gerador") return gerarRodada(e.fonte.gerador, e.serie, nivel);
  if (e.fonte.tipo === "banco") return embaralhar(e.fonte.atividade.niveis[nivel].questoes);
  const a = e.fonte.atividade;
  return embaralhar(nivel === "retomada" ? a.adaptada.questoes : a.questoes);
}

/** Série da turma quando a ferramenta é aberta no painel do aluno ou do professor. */
function useSerieDaTurma(): Serie | null {
  const params = useParams({ strict: false }) as { turmaId?: string };
  const { turmas } = useAppStore();
  const turma = params.turmaId ? turmas.find((t) => t.id === params.turmaId) : undefined;
  const n = turma ? Number.parseInt(turma.serie, 10) : NaN;
  return n >= 1 && n <= 5 ? (n as Serie) : null;
}

/**
 * Atividades por habilidade: o catálogo da recomposição das aprendizagens.
 * Cada atividade é ligada à série e ao descritor da Avaliação Diagnóstica,
 * tem três níveis e mostra o que foi prioridade na escola.
 */
export function Trilhas() {
  const daTurma = useSerieDaTurma();
  const doLink = useMemo(() => {
    if (typeof window === "undefined") return { serie: null, disc: null };
    const q = new URLSearchParams(window.location.search);
    const s = Number(q.get("serie"));
    const d = q.get("disc");
    return {
      serie: s >= 1 && s <= 5 ? (s as Serie) : null,
      disc: d === "MAT" || d === "LP" || d === "CN" ? (d as Disciplina) : null,
    };
  }, []);
  const [serie, setSerie] = useState<Serie>(daTurma ?? doLink.serie ?? 1);
  const [disc, setDisc] = useState<Disciplina | "todas">(doLink.disc ?? "todas");
  const [modo, setModo] = useState<"atividades" | "verificacao">("atividades");
  const [aberta, setAberta] = useState<{ e: Entrada; nivel: Nivel } | null>(null);
  const mapa = usePrioridades();

  const lista = useMemo(() => {
    const itens = CATALOGO.filter(
      (e) => e.serie === serie && (disc === "todas" || e.disc === disc),
    );
    return itens
      .map((e) => ({ e, p: acertoDaEntrada(e, mapa) }))
      .sort((a, b) => (a.p ?? 101) - (b.p ?? 101));
  }, [serie, disc, mapa]);

  if (aberta)
    return <Jogar e={aberta.e} nivelInicial={aberta.nivel} voltar={() => setAberta(null)} />;

  const visual = (d: Disciplina) => DISC_VISUAL[d];

  return (
    <div className="flex flex-col gap-6">
      {/* 1. O que é isto aqui. A versão anterior abria com um parágrafo
        corrido dentro de uma caixa azul: quem não conhecia a Avaliação
        Diagnóstica não entendia nem o que a tela oferecia nem por que as
        atividades estavam naquela ordem. */}
      <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-primary/[0.04] to-transparent p-5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-primary">
          <Target className="size-3.5" /> Recomposição da aprendizagem
        </span>
        <h2 className="mt-2.5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Treine o que a turma ainda não pegou
        </h2>
        <p className="mt-1.5 max-w-3xl text-sm text-muted-foreground sm:text-base">
          Duas vezes por ano todos os alunos fazem a mesma prova da Secretaria de Educação. Esta
          página pega o resultado dela e transforma em atividade: o que a escola errou mais aparece
          primeiro, e cada atividade tem três níveis de dificuldade.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {PASSOS.map((passo) => (
            <div
              key={passo.n}
              className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-card/70 p-3"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {passo.n}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <passo.icon className="size-3.5 shrink-0 text-muted-foreground" />
                  {passo.titulo}
                </p>
                <p className="text-xs text-muted-foreground">{passo.txt}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. As escolhas, com rótulo em cada linha. Antes eram três fileiras
        de botões sem nome nenhum — não dava para saber o que cada uma fazia
        sem clicar e ver o que mudava. */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <Escolha rotulo="Para qual ano?">
            {SERIES.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={s === serie ? "default" : "outline"}
                onClick={() => setSerie(s)}
                aria-pressed={s === serie}
              >
                {s}º ano
              </Button>
            ))}
          </Escolha>
          <Escolha rotulo="Qual matéria?">
            {DISC.map((d) => {
              const Icone = d.id === "todas" ? null : visual(d.id).icon;
              return (
                <Button
                  key={d.id}
                  size="sm"
                  variant={d.id === disc ? "default" : "outline"}
                  onClick={() => setDisc(d.id)}
                  aria-pressed={d.id === disc}
                  className="gap-1.5"
                >
                  {Icone ? <Icone className="size-3.5" /> : null}
                  {d.nome}
                </Button>
              );
            })}
          </Escolha>
          <Escolha rotulo="O que você quer fazer?">
            <Button
              size="sm"
              variant={modo === "atividades" ? "default" : "outline"}
              onClick={() => setModo("atividades")}
              aria-pressed={modo === "atividades"}
              className="gap-1.5"
            >
              <Sparkles className="size-4" /> Treinar com atividades
            </Button>
            <Button
              size="sm"
              variant={modo === "verificacao" ? "default" : "outline"}
              onClick={() => setModo("verificacao")}
              aria-pressed={modo === "verificacao"}
              className="gap-1.5"
            >
              <ClipboardCheck className="size-4" /> Fazer um mini-teste
            </Button>
            <span className="text-xs text-muted-foreground">
              {modo === "atividades"
                ? "Uma atividade por habilidade, para praticar sem pressa."
                : "Uma questão de cada habilidade do ano, para ver como está agora."}
            </span>
          </Escolha>
        </CardContent>
      </Card>

      {/* 3. Legenda. Antes os três níveis vinham numa linha corrida de texto
        cinza, e as tarjas coloridas dos cards não eram explicadas em lugar
        nenhum — quem chegava de fora não sabia o que era "Consolidar". */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Os três níveis de cada atividade
            </p>
            <ul className="flex flex-col gap-2.5">
              {NIVEIS.map((n) => (
                <li key={n.id} className="flex items-start gap-2.5 text-sm">
                  <span className="text-lg leading-none" aria-hidden>
                    {n.emoji}
                  </span>
                  <span>
                    <b className="text-foreground">{n.nome}</b>{" "}
                    <span className="text-muted-foreground">— {n.para}</span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              O que a tarja colorida quer dizer
            </p>
            <ul className="flex flex-col gap-2.5">
              {PRIORIDADES.map((f) => (
                <li key={f.txt} className="flex items-start gap-2.5 text-sm">
                  <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", f.ponto)} />
                  <span>
                    <b className="text-foreground">{f.txt}</b>{" "}
                    <span className="text-muted-foreground">— {f.explica}.</span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {modo === "verificacao" ? (
        <Verificacao
          key={`${serie}-${disc}`}
          serie={serie}
          disc={disc === "todas" ? "MAT" : disc}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            <b className="text-foreground">{lista.length}</b>{" "}
            {lista.length === 1 ? "atividade" : "atividades"} para o {serie}º ano
            {disc === "todas" ? "" : ` em ${NOME_DISC[disc]}`} — em ordem, da que a escola mais
            errou para a que foi melhor.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {lista.map(({ e, p }) => {
              const pr = prioridade(p);
              const rec = nivelRecomendado(p);
              const v = visual(e.disc);
              const Icone = v.icon;
              return (
                <Card key={e.id} className="flex flex-col">
                  <CardContent className="flex flex-1 flex-col gap-3.5 p-5">
                    <div className="flex items-start gap-3.5">
                      <span
                        className={cn(
                          "relative flex size-12 shrink-0 items-center justify-center rounded-xl border shadow-sm",
                          v.chip,
                        )}
                      >
                        <Icone className="size-6" />
                        <span
                          className="absolute -bottom-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full border border-border bg-card text-xs shadow-sm"
                          aria-hidden
                        >
                          {e.emoji}
                        </span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold leading-snug text-foreground">
                          {e.titulo}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {e.serie}º ano · {NOME_DISC[e.disc]} · {e.conteudo}
                        </p>
                      </div>
                      {pr ? (
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
                            pr.cls,
                          )}
                        >
                          {pr.txt}
                        </span>
                      ) : null}
                    </div>

                    {e.descritores.length ? (
                      <div className="flex flex-col gap-1.5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          O que treina
                        </p>
                        <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                          {e.descritores.map((d) => (
                            <li key={d} className="flex items-start gap-1.5">
                              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                              {DESCRITORES[d] ?? d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : e.fonte.tipo === "lp" ? (
                      <p className="text-sm text-muted-foreground">{e.fonte.atividade.objetivo}</p>
                    ) : null}

                    {p != null ? (
                      <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-xs text-muted-foreground">
                            Acerto do {e.serie}º ano na avaliação
                          </span>
                          <span className="text-sm font-bold text-foreground">
                            {Math.round(p)}%
                          </span>
                        </div>
                        {/* Barra em vez de só o número: dá para comparar duas
                          atividades de relance, sem ler. */}
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-border">
                          <div
                            className={cn("h-full rounded-full", v.barra)}
                            style={{ width: `${Math.max(2, Math.min(100, Math.round(p)))}%` }}
                          />
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-auto flex flex-col gap-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Abrir no nível
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {NIVEIS.filter((n) => e.niveis.includes(n.id)).map((n) => (
                          <Button
                            key={n.id}
                            size="sm"
                            variant={n.id === rec ? "default" : "outline"}
                            onClick={() => setAberta({ e, nivel: n.id })}
                            className="gap-1.5"
                          >
                            {n.emoji} {n.nome}
                            {n.id === rec ? (
                              // A pílula translúcida clareava o fundo do
                              // botão e derrubava o contraste do texto para
                              // 3.4:1 — aqui herda a cor do próprio botão.
                              <span className="text-[11px] font-bold">· indicado</span>
                            ) : null}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Uma linha de escolha da barra de filtros, com rótulo à esquerda. */
function Escolha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-muted-foreground sm:w-44">
        {rotulo}
      </span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/** Tela de uma atividade: níveis, texto de apoio, quiz e dicas para a sala. */
export function Jogar({
  e,
  nivelInicial,
  voltar,
  rotuloVoltar = "Todas as atividades",
  onResultado,
}: {
  e: Entrada;
  nivelInicial: Nivel;
  voltar: () => void;
  rotuloVoltar?: string;
  /** Chamado ao terminar uma rodada (usado pela “Minha trilha” para dar estrelas). */
  onResultado?: (nivel: Nivel, acertos: number, total: number) => void;
}) {
  const [nivel, setNivel] = useState<Nivel>(nivelInicial);
  const [rodada, setRodada] = useState(0);
  const questoes = useMemo(() => questoesDe(e, nivel), [e, nivel, rodada]);
  const lp = e.fonte.tipo === "lp" ? e.fonte.atividade : null;
  const banco = e.fonte.tipo === "banco" ? e.fonte.atividade : null;
  const textoBanco = banco?.niveis[nivel].texto;
  const tituloTexto = textoBanco?.titulo ?? lp?.texto?.titulo;
  const texto = banco
    ? textoBanco?.paragrafos
    : lp
      ? nivel === "retomada" && lp.adaptada.textoCurto
        ? lp.adaptada.textoCurto
        : lp.texto?.paragrafos
      : null;
  const dicas = banco
    ? banco.emSala
    : lp
      ? nivel === "retomada"
        ? lp.adaptada.dicasMediador
        : lp.emSala
      : null;

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" onClick={voltar} className="w-fit gap-1.5">
        <ArrowLeft className="size-4" /> {rotuloVoltar}
      </Button>
      <div className="flex items-start gap-3.5">
        {/* Mesmo chip da lista, para a tela da atividade não parecer outra
          ferramenta ao abrir. */}
        <span
          className={cn(
            "relative flex size-12 shrink-0 items-center justify-center rounded-xl border shadow-sm",
            DISC_VISUAL[e.disc].chip,
          )}
        >
          {(() => {
            const Icone = DISC_VISUAL[e.disc].icon;
            return <Icone className="size-6" />;
          })()}
          <span
            className="absolute -bottom-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full border border-border bg-card text-xs shadow-sm"
            aria-hidden
          >
            {e.emoji}
          </span>
        </span>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{e.titulo}</h2>
          <p className="text-sm text-muted-foreground">
            {e.serie}º ano · {NOME_DISC[e.disc]}
            {e.descritores.length
              ? ` · ${e.descritores.map((d) => DESCRITORES[d] ?? d).join(" · ")}`
              : ""}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {NIVEIS.filter((n) => e.niveis.includes(n.id)).map((n) => (
          <Button
            key={n.id}
            size="sm"
            variant={n.id === nivel ? "default" : "outline"}
            onClick={() => {
              setNivel(n.id);
              setRodada((r) => r + 1);
            }}
            aria-pressed={n.id === nivel}
          >
            {n.emoji} {n.nome}
          </Button>
        ))}
        {e.fonte.tipo === "gerador" ? (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5"
            onClick={() => setRodada((r) => r + 1)}
          >
            <RefreshCw className="size-4" /> Novas questões
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5"
          onClick={() => {
            const info = NIVEIS.find((x) => x.id === nivel)!;
            const ok = imprimirFolha(
              `${e.titulo} · ${e.serie}º ano`,
              [
                {
                  titulo: `${NOME_DISC[e.disc]} · ${info.emoji} ${info.nome}`,
                  subtitulo:
                    e.descritores.map((d) => DESCRITORES[d] ?? d).join(" · ") || e.conteudo,
                  texto: texto?.length
                    ? { ...(tituloTexto ? { titulo: tituloTexto } : {}), paragrafos: texto }
                    : undefined,
                  questoes,
                },
              ],
              "Atividade de recomposição das aprendizagens · II Avaliação Diagnóstica 2026",
            );
            if (!ok) window.alert("Libere as janelas pop-up do navegador para imprimir.");
          }}
        >
          <Printer className="size-4" /> Imprimir folha
        </Button>
      </div>

      {texto?.length ? (
        <Card>
          <CardContent className="flex flex-col gap-2 p-5">
            {tituloTexto ? <p className="font-semibold text-foreground">{tituloTexto}</p> : null}
            {texto.map((par, i) => (
              <p key={i} className="text-base leading-relaxed text-foreground">
                {par}
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Quiz
        key={`${nivel}-${rodada}`}
        questoes={questoes}
        {...(onResultado ? { onConcluir: (a: number, t: number) => onResultado(nivel, a, t) } : {})}
      />

      {dicas?.length ? (
        <details className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <summary className="flex cursor-pointer items-center gap-2 font-semibold text-foreground">
            <School className="size-4" /> Para o professor e o mediador
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            {dicas.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

/**
 * Mini-teste de verificação: uma questão por habilidade da série, no nível
 * Prática. Serve para ver, depois das atividades, se o aluno avançou. Pode
 * ser feito na tela (com o resultado por habilidade) ou impresso como prova.
 */
function Verificacao({ serie, disc }: { serie: Serie; disc: Disciplina }) {
  const [rodada, setRodada] = useState(0);
  const [fase, setFase] = useState<"inicio" | "fazendo" | "resultado">("inicio");
  const [resultado, setResultado] = useState<boolean[]>([]);
  const [treinar, setTreinar] = useState<{ e: Entrada; nivel: Nivel } | null>(null);

  const itens = useMemo(() => {
    const entradas = CATALOGO.filter(
      (e) => e.serie === serie && e.disc === disc && e.fonte.tipo !== "lp",
    );
    return entradas
      .map((e) => {
        const q =
          e.fonte.tipo === "gerador"
            ? gerarRodada(e.fonte.gerador, serie, "pratica", 1)[0]
            : e.fonte.tipo === "banco"
              ? embaralhar(e.fonte.atividade.niveis.pratica.questoes)[
                  Math.floor(Math.random() * e.fonte.atividade.niveis.pratica.questoes.length)
                ]
              : undefined;
        return q ? { e, q } : null;
      })
      .filter((x): x is { e: Entrada; q: Questao } => x !== null);
  }, [serie, disc, rodada]);

  if (treinar)
    return (
      <Jogar
        e={treinar.e}
        nivelInicial={treinar.nivel}
        voltar={() => setTreinar(null)}
        rotuloVoltar="Voltar ao resultado"
      />
    );

  if (fase === "inicio")
    return (
      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div>
            <p className="text-lg font-semibold text-foreground">
              Mini-teste · {serie}º ano · {NOME_DISC[disc]}
            </p>
            <p className="text-sm text-muted-foreground">
              {itens.length} questões, uma para cada habilidade avaliada na série. No fim, você vê o
              que já domina e o que ainda precisa treinar. Use depois das atividades para medir o
              avanço, ou imprima para aplicar em sala.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setFase("fazendo")}>Começar na tela</Button>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                const ok = imprimirFolha(
                  `Mini-teste de verificação · ${serie}º ano · ${NOME_DISC[disc]}`,
                  [{ titulo: "Questões", questoes: itens.map((x) => x.q) }],
                  `Cada questão corresponde a uma habilidade: ${itens.map((x, i) => `${i + 1}. ${x.e.titulo}`).join(" · ")}`,
                );
                if (!ok) window.alert("Libere as janelas pop-up do navegador para imprimir.");
              }}
            >
              <Printer className="size-4" /> Imprimir como prova
            </Button>
            <Button variant="ghost" className="gap-1.5" onClick={() => setRodada((r) => r + 1)}>
              <RefreshCw className="size-4" /> Sortear outras questões
            </Button>
          </div>
        </CardContent>
      </Card>
    );

  if (fase === "fazendo")
    return (
      <Quiz
        key={rodada}
        questoes={itens.map((x) => x.q)}
        onConcluir={(_a, _t, lista) => {
          setResultado(lista);
          setFase("resultado");
        }}
      />
    );

  const dominadas = resultado.filter(Boolean).length;
  return (
    <div className="flex flex-col gap-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <p className="text-lg font-semibold text-foreground">
            Você acertou de primeira {dominadas} de {itens.length} habilidades.
          </p>
          <p className="text-sm text-muted-foreground">
            As habilidades marcadas para treinar têm um botão que leva direto à atividade.
          </p>
        </CardContent>
      </Card>
      <ul className="flex flex-col gap-2">
        {itens.map((x, i) => {
          const ok = resultado[i] === true;
          return (
            <li key={x.e.id}>
              <Card className={ok ? "border-emerald-500/40" : "border-amber-500/40"}>
                <CardContent className="flex flex-wrap items-center gap-3 p-3">
                  <span className="text-2xl" aria-hidden>
                    {x.e.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{x.e.titulo}</p>
                    <p
                      className={
                        ok
                          ? "text-xs text-emerald-700 dark:text-emerald-400"
                          : "text-xs text-amber-700 dark:text-amber-400"
                      }
                    >
                      {ok ? "✓ Já domina" : "↻ Precisa treinar"}
                    </p>
                  </div>
                  {!ok ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTreinar({ e: x.e, nivel: "retomada" })}
                    >
                      Treinar agora
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
      <Button
        variant="outline"
        className="w-fit gap-1.5"
        onClick={() => {
          setRodada((r) => r + 1);
          setFase("inicio");
        }}
      >
        <RefreshCw className="size-4" /> Fazer outro mini-teste
      </Button>
    </div>
  );
}
