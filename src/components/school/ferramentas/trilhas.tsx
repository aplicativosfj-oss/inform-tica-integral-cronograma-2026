import { useParams } from "@tanstack/react-router";
import { ArrowLeft, Info, RefreshCw, School } from "lucide-react";
import { useMemo, useState } from "react";

import { Quiz, type Questao } from "@/components/school/ferramentas/quiz";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CATALOGO,
  DESCRITORES,
  NIVEIS,
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
import { cn } from "@/lib/utils";

const SERIES: Serie[] = [1, 2, 3, 4, 5];
const DISC: { id: Disciplina | "todas"; nome: string }[] = [
  { id: "todas", nome: "Todas" },
  { id: "MAT", nome: "Matemática" },
  { id: "LP", nome: "Português" },
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
    return { ...q, opcoes: ordem.map((i) => q.opcoes[i]!), respostaCorreta: ordem.indexOf(q.respostaCorreta) };
  });
}

function questoesDe(e: Entrada, nivel: Nivel): Questao[] {
  if (e.fonte.tipo === "gerador") return gerarRodada(e.fonte.gerador, e.serie, nivel);
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
  const [serie, setSerie] = useState<Serie>(daTurma ?? 1);
  const [disc, setDisc] = useState<Disciplina | "todas">("todas");
  const [aberta, setAberta] = useState<{ e: Entrada; nivel: Nivel } | null>(null);
  const mapa = usePrioridades();

  const lista = useMemo(() => {
    const itens = CATALOGO.filter((e) => e.serie === serie && (disc === "todas" || e.disc === disc));
    return itens
      .map((e) => ({ e, p: acertoDaEntrada(e, mapa) }))
      .sort((a, b) => (a.p ?? 101) - (b.p ?? 101));
  }, [serie, disc, mapa]);

  if (aberta) return <Jogar e={aberta.e} nivelInicial={aberta.nivel} voltar={() => setAberta(null)} />;

  return (
    <div className="flex flex-col gap-5">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex gap-3 p-4 text-sm">
          <Info className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-foreground">
            Atividades pensadas a partir da <b>II Avaliação Diagnóstica 2026</b>. Escolha a série: as
            habilidades em que a escola teve mais dificuldade aparecem primeiro. Cada atividade tem
            níveis, e o nível <b>recomendado</b> vem marcado. Na Matemática, as questões mudam toda
            vez que você joga.
          </p>
        </CardContent>
      </Card>

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
                      {e.disc === "MAT" ? "Matemática" : "Português"} · {e.conteudo}
                    </p>
                  </div>
                  {pr ? (
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold", pr.cls)}>
                      {pr.txt}
                    </span>
                  ) : null}
                </div>
                {e.descritores.length ? (
                  <ul className="flex flex-col gap-1 text-xs">
                    {e.descritores.map((d) => (
                      <li key={d} className="text-muted-foreground">
                        <Badge variant="outline" className="mr-1.5 px-1.5 py-0 font-mono text-[10px]">
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
                    Na avaliação, o {e.serie}º ano acertou <b className="text-foreground">{Math.round(p)}%</b>
                    {e.descritores.length ? " nesta habilidade." : " em Português, em média."}
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
                      {n.id === rec ? <span className="text-[10px] opacity-80">· recomendado</span> : null}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Jogar({ e, nivelInicial, voltar }: { e: Entrada; nivelInicial: Nivel; voltar: () => void }) {
  const [nivel, setNivel] = useState<Nivel>(nivelInicial);
  const [rodada, setRodada] = useState(0);
  const questoes = useMemo(() => questoesDe(e, nivel), [e, nivel, rodada]);
  const lp = e.fonte.tipo === "lp" ? e.fonte.atividade : null;
  const texto = lp ? (nivel === "retomada" && lp.adaptada.textoCurto ? lp.adaptada.textoCurto : lp.texto?.paragrafos) : null;

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" onClick={voltar} className="w-fit gap-1.5">
        <ArrowLeft className="size-4" /> Todas as atividades
      </Button>
      <div className="flex items-start gap-3">
        <span className="text-4xl leading-none" aria-hidden>
          {e.emoji}
        </span>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{e.titulo}</h2>
          <p className="text-sm text-muted-foreground">
            {e.serie}º ano · {e.disc === "MAT" ? "Matemática" : "Português"}
            {e.descritores.length ? ` · ${e.descritores.map((d) => DESCRITORES[d] ?? d).join(" · ")}` : ""}
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
          <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => setRodada((r) => r + 1)}>
            <RefreshCw className="size-4" /> Novas questões
          </Button>
        ) : null}
      </div>

      {lp && texto?.length ? (
        <Card>
          <CardContent className="flex flex-col gap-2 p-5">
            {lp.texto?.titulo ? <p className="font-semibold text-foreground">{lp.texto.titulo}</p> : null}
            {texto.map((par, i) => (
              <p key={i} className="text-base leading-relaxed text-foreground">
                {par}
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Quiz key={`${nivel}-${rodada}`} questoes={questoes} />

      {lp ? (
        <details className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <summary className="flex cursor-pointer items-center gap-2 font-semibold text-foreground">
            <School className="size-4" /> Para o professor e o mediador
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            {(nivel === "retomada" ? lp.adaptada.dicasMediador : lp.emSala).map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
