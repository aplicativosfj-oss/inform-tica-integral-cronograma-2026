import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Star, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Jogar } from "@/components/school/ferramentas/trilhas";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { SiteFooter } from "@/components/school/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { lerAlunoSessao } from "@/lib/aluno-session";
import { useAppStore } from "@/lib/app-store";
import { NIVEIS, NOME_DISC, usePrioridades, type Nivel, type Serie } from "@/lib/recomposicao/catalogo";
import {
  PROXIMO_NIVEL,
  estrelasDe,
  lerProgresso,
  montarTrilha,
  registrarResultado,
  useAvaliacaoPublica,
  type PassoTrilha,
  type Progresso,
} from "@/lib/recomposicao/trilha-aluno";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/aluno/$turmaId/$alunoId/trilha")({
  component: MinhaTrilha,
  head: () => ({
    meta: [
      { title: "Minha trilha · Agenda de Informática" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function Estrelas({ n, tamanho = "size-4" }: { n: number; tamanho?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n} de 3 estrelas`}>
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          className={cn(tamanho, i <= n ? "fill-amber-400 text-amber-500" : "text-muted-foreground/40")}
        />
      ))}
    </span>
  );
}

function MinhaTrilha() {
  const { turmaId, alunoId } = Route.useParams();
  const navigate = useNavigate();
  const { turmas } = useAppStore();
  const sessao = lerAlunoSessao();
  const pin = sessao?.pin;

  useEffect(() => {
    if (!sessao || sessao.alunoId !== alunoId || sessao.turmaId !== turmaId) {
      navigate({ to: "/aluno/$turmaId", params: { turmaId } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alunoId, turmaId]);

  const turma = turmas.find((t) => t.id === turmaId);
  const aluno = turma?.alunos.find((a) => a.id === alunoId);
  const serie = turma ? (Number.parseInt(turma.serie, 10) as Serie) : null;

  const avaliacao = useAvaliacaoPublica();
  const prioridades = usePrioridades();
  const [progresso, setProgresso] = useState<Progresso[] | null>(null);
  const [aberto, setAberto] = useState<{ passo: PassoTrilha; nivel: Nivel } | null>(null);

  useEffect(() => {
    if (!pin) return;
    lerProgresso(alunoId, pin)
      .then(setProgresso)
      .catch(() => setProgresso([]));
  }, [alunoId, pin]);

  const trilha = useMemo(() => {
    if (!avaliacao || !turma || !aluno || !serie) return null;
    return montarTrilha(avaliacao, serie, turma.letra, aluno.nome, prioridades);
  }, [avaliacao, turma, aluno, serie, prioridades]);

  const estrelas = (atividadeId: string, nivel: Nivel) =>
    progresso?.find((p) => p.atividadeId === atividadeId && p.nivel === nivel)?.estrelas ?? 0;

  /** Nível a jogar agora: sobe quando o anterior já tem 3 estrelas. */
  const nivelAtual = (p: PassoTrilha): Nivel => {
    let n: Nivel = p.nivel;
    while (estrelas(p.entrada.id, n) === 3 && PROXIMO_NIVEL[n] && p.entrada.niveis.includes(PROXIMO_NIVEL[n]!))
      n = PROXIMO_NIVEL[n]!;
    return n;
  };

  const passos = trilha?.passos ?? [];
  const concluidos = passos.filter((p) => estrelas(p.entrada.id, p.nivel) >= 2).length;
  const totalEstrelas = (progresso ?? []).reduce((s, p) => s + p.estrelas, 0);

  async function aoTerminar(passo: PassoTrilha, nivel: Nivel, acertos: number, total: number) {
    if (!pin) return;
    const ganhas = estrelasDe(acertos, total);
    try {
      await registrarResultado(alunoId, pin, passo.entrada.id, nivel, acertos, total);
      setProgresso(await lerProgresso(alunoId, pin));
      toast.success(
        ganhas === 3
          ? "3 estrelas! Você pode subir de nível. 🎉"
          : ganhas === 2
            ? "2 estrelas! Muito bem, continue treinando."
            : "1 estrela. Tente de novo: cada rodada tem questões novas.",
      );
    } catch {
      toast.error("Não foi possível salvar suas estrelas. Verifique a internet e tente de novo.");
    }
  }

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />
        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          {aberto ? (
            <Jogar
              e={aberto.passo.entrada}
              nivelInicial={aberto.nivel}
              voltar={() => setAberto(null)}
              rotuloVoltar="Voltar para minha trilha"
              onResultado={(nivel, a, t) => aoTerminar(aberto.passo, nivel, a, t)}
            />
          ) : (
            <>
              <Link
                to="/aluno/$turmaId/$alunoId"
                params={{ turmaId, alunoId }}
                className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-4" /> Voltar para minha área
              </Link>

              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">Minha trilha</h1>
                  <p className="text-sm text-muted-foreground">
                    {trilha?.personalizada
                      ? "Atividades escolhidas para você, a partir das questões da Avaliação Diagnóstica que você pode melhorar."
                      : "Atividades com o que a sua série mais precisa treinar."}
                  </p>
                </div>
                <Card className="border-amber-500/30 bg-amber-500/10">
                  <CardContent className="flex items-center gap-3 px-4 py-3">
                    <Trophy className="size-7 text-amber-600" />
                    <div>
                      <p className="text-2xl font-bold leading-none text-foreground">{totalEstrelas}</p>
                      <p className="text-xs text-muted-foreground">estrelas ganhas</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {!trilha || progresso === null ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="mb-6 flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-foreground">
                        {concluidos} de {passos.length} atividades concluídas
                      </span>
                      <span className="text-muted-foreground">2 estrelas ou mais conta como concluída</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 transition-all"
                        style={{ width: `${passos.length ? (100 * concluidos) / passos.length : 0}%` }}
                      />
                    </div>
                  </div>

                  <ol className="flex flex-col gap-3">
                    {passos.map((p, i) => {
                      const n = nivelAtual(p);
                      const info = NIVEIS.find((x) => x.id === n)!;
                      const est = estrelas(p.entrada.id, n);
                      const feito = estrelas(p.entrada.id, p.nivel) >= 2;
                      return (
                        <li key={p.entrada.id}>
                          <Card className={cn(feito && "border-emerald-500/40 bg-emerald-500/5")}>
                            <CardContent className="flex flex-wrap items-center gap-4 p-4">
                              <span
                                className={cn(
                                  "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                                  feito ? "bg-emerald-500 text-white" : "bg-muted text-foreground",
                                )}
                              >
                                {feito ? "✓" : i + 1}
                              </span>
                              <span className="text-3xl leading-none" aria-hidden>
                                {p.entrada.emoji}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-foreground">{p.entrada.titulo}</p>
                                <p className="text-xs text-muted-foreground">
                                  {NOME_DISC[p.entrada.disc]} · {info.emoji} {info.nome}
                                </p>
                                {p.motivos.length ? (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Para treinar: {p.motivos.slice(0, 2).join("; ")}
                                  </p>
                                ) : null}
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Estrelas n={est} />
                                <Button size="sm" onClick={() => setAberto({ passo: p, nivel: n })}>
                                  {est === 0 ? "Começar" : est === 3 ? "Jogar de novo" : "Tentar de novo"}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </li>
                      );
                    })}
                  </ol>
                  <p className="mt-6 text-center text-xs text-muted-foreground">
                    Com 3 estrelas, a atividade sobe de nível: 🌱 Retomada → 🌿 Prática → 🌳 Desafio.
                  </p>
                </>
              )}
            </>
          )}
        </section>
        <SiteFooter />
      </div>
    </div>
  );
}
