import { useParams } from "@tanstack/react-router";
import { ArrowLeft, ClipboardCheck, Info, Printer, RefreshCw, School } from "lucide-react";
import { useMemo, useState } from "react";

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

const SERIES: Serie[] = [1, 2, 3, 4, 5];
const DISC: { id: Disciplina | "todas"; nome: string }[] = [
  { id: "todas", nome: "Todas" },
  { id: "MAT", nome: "Matemática" },
  { id: "LP", nome: "Português" },
  { id: "CN", nome: "Ciências" },
];

/** Cor e frase da prioridade, a partir do acerto da série na avaliação. */
function prioridade(p: number | null) {
  if (p == null) return null;
  if (p < 50)
    return { txt: "Prioridade alta", cls: "bg-rose-500/15 text-rose-700 dark:text-rose-300" };
  if (p < 70)
    return { txt: "Precisa de reforço", cls: "bg-amber-500/15 text-amber-800 dark:text-amber-300" };
  return { txt: "Consolidar", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" };
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

  return (
    <div className="flex flex-col gap-5">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex gap-3 p-4 text-sm">
          <Info className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-foreground">
            Atividades pensadas a partir da <b>II Avaliação Diagnóstica 2026</b>. Escolha a série:
            as habilidades em que a escola teve mais dificuldade aparecem primeiro. Cada atividade
            tem níveis, e o nível <b>recomendado</b> vem marcado. Na Matemática, as questões mudam
            toda vez que você joga.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Modo">
        <Button
          variant={modo === "atividades" ? "default" : "outline"}
          onClick={() => setModo("atividades")}
          aria-pressed={modo === "atividades"}
        >
          Atividades
        </Button>
        <Button
          variant={modo === "verificacao" ? "default" : "outline"}
          onClick={() => setModo("verificacao")}
          aria-pressed={modo === "verificacao"}
          className="gap-1.5"
        >
          <ClipboardCheck className="size-4" /> Mini-teste de verificação
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Série">
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
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Disciplina">
          {DISC.map((d) => (
            <Button
              key={d.id}
              size="sm"
              variant={d.id === disc ? "secondary" : "ghost"}
              onClick={() => setDisc(d.id)}
              aria-pressed={d.id === disc}
            >
              {d.nome}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {NIVEIS.map((n) => (
            <span key={n.id}>
              {n.emoji} <b className="text-foreground">{n.nome}</b>: {n.para}
            </span>
          ))}
        </div>
      </div>

      {modo === "verificacao" ? (
        <Verificacao
          key={`${serie}-${disc}`}
          serie={serie}
          disc={disc === "todas" ? "MAT" : disc}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {lista.map(({ e, p }) => {
            const pr = prioridade(p);
            const rec = nivelRecomendado(p);
            return (
              <Card key={e.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl leading-none" aria-hidden>
                      {e.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{e.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {NOME_DISC[e.disc]} · {e.conteudo}
                      </p>
                    </div>
                    {pr ? (
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
                          pr.cls,
                        )}
                      >
                        {pr.txt}
                      </span>
                    ) : null}
                  </div>
                  {e.descritores.length ? (
                    <ul className="flex flex-col gap-1 text-xs">
                      {e.descritores.map((d) => (
                        <li key={d} className="text-muted-foreground">
                          <Badge
                            variant="outline"
                            className="mr-1.5 px-1.5 py-0 font-mono text-[10px]"
                          >
                            {d}
                          </Badge>
                          {DESCRITORES[d] ?? ""}
                        </li>
                      ))}
                    </ul>
                  ) : e.fonte.tipo === "lp" ? (
                    <p className="text-xs text-muted-foreground">{e.fonte.atividade.objetivo}</p>
                  ) : null}
                  {p != null ? (
                    <p className="text-xs text-muted-foreground">
                      Na avaliação, o {e.serie}º ano acertou{" "}
                      <b className="text-foreground">{Math.round(p)}%</b>
                      {e.descritores.length || e.habilidades.length
                        ? " nesta habilidade."
                        : ` em ${NOME_DISC[e.disc]}, em média.`}
                    </p>
                  ) : null}
                  <div className="mt-auto flex flex-wrap gap-2">
                    {NIVEIS.filter((n) => e.niveis.includes(n.id)).map((n) => (
                      <Button
                        key={n.id}
                        size="sm"
                        variant={n.id === rec ? "default" : "outline"}
                        onClick={() => setAberta({ e, nivel: n.id })}
                        className="gap-1"
                      >
                        {n.emoji} {n.nome}
                        {n.id === rec ? (
                          <span className="text-[10px] opacity-80">· recomendado</span>
                        ) : null}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
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
      <div className="flex items-start gap-3">
        <span className="text-4xl leading-none" aria-hidden>
          {e.emoji}
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
