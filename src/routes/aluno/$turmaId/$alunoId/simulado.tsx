import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, ClipboardList, Loader2, Trophy } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Cronometro, formatarTempo, useSegundosDesde } from "@/components/school/cronometro";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { SiteFooter } from "@/components/school/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { lerAlunoSessao } from "@/lib/aluno-session";
import { useAppStore } from "@/lib/app-store";
import {
  comecarSimulado,
  finalizarSimulado,
  meusResultados,
  responderSimulado,
  rotuloArea,
  selo,
  simuladoDoAluno,
  type SimuladoDoAluno,
} from "@/lib/simulados";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/aluno/$turmaId/$alunoId/simulado")({
  component: SimuladoAluno,
  head: () => ({
    meta: [
      { title: "Simulado · Agenda de Informática" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Resultado = { acertos: number; total: number; respondidas: number; tempo_seg: number };

function SimuladoAluno() {
  const { turmaId, alunoId } = Route.useParams();
  const navigate = useNavigate();
  const { turmas } = useAppStore();
  const sessao = lerAlunoSessao();
  const aluno = turmas.find((t) => t.id === turmaId)?.alunos.find((a) => a.id === alunoId);
  const cred = useMemo(
    () => (sessao?.pin ? { alunoId, pin: sessao.pin, turmaId } : null),
    [alunoId, turmaId, sessao?.pin],
  );

  const [dados, setDados] = useState<SimuladoDoAluno | null | undefined>(undefined);
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [escolha, setEscolha] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [historico, setHistorico] = useState<{ titulo: string; acertos: number; total: number }[]>(
    [],
  );
  const desvio = useRef(0); // diferença entre o relógio do servidor e o do aparelho

  useEffect(() => {
    if (!sessao || sessao.alunoId !== alunoId || sessao.turmaId !== turmaId) {
      navigate({ to: "/aluno/$turmaId", params: { turmaId } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alunoId, turmaId]);

  const carregar = useCallback(async () => {
    if (!cred) return;
    try {
      const s = await simuladoDoAluno(cred);
      if (s) desvio.current = Date.parse(s.agora) - Date.now();
      setDados(s);
      setRespostas(s?.minha?.respostas ?? {});
      if (s?.minha?.status === "finalizado" && s.minha.acertos != null) {
        setResultado({
          acertos: s.minha.acertos,
          total: s.minha.total,
          respondidas: Object.keys(s.minha.respostas).length,
          tempo_seg: s.minha.finalizado_em
            ? (Date.parse(s.minha.finalizado_em) - Date.parse(s.minha.iniciado_em)) / 1000
            : 0,
        });
      }
      setHistorico(await meusResultados(cred));
    } catch {
      setDados(null);
      toast.error("Não foi possível carregar o simulado. Verifique a internet.");
    }
  }, [cred]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const fazendo = !!dados?.minha && dados.minha.status === "fazendo" && !resultado;
  const inicioProva = dados ? Date.parse(dados.iniciado_em) - desvio.current : null;
  const limite = dados ? dados.duracao_min * 60 : 0;
  const passado = useSegundosDesde(inicioProva, !!resultado);
  const esgotou = !!dados && passado >= limite;
  const inicioAluno = dados?.minha ? Date.parse(dados.minha.iniciado_em) - desvio.current : null;
  const tempoAluno = useSegundosDesde(inicioAluno, !!resultado || !fazendo);

  const indice = dados
    ? dados.questoes.findIndex((_, i) => respostas[String(i)] === undefined)
    : -1;
  const questao = dados && indice >= 0 ? dados.questoes[indice] : undefined;

  const finalizando = useRef(false);
  const finalizar = useCallback(async () => {
    if (!cred || !dados || finalizando.current) return;
    finalizando.current = true;
    try {
      const r = await finalizarSimulado(cred, dados.id);
      if (r) setResultado(r);
      setHistorico(await meusResultados(cred));
    } catch {
      finalizando.current = false;
      toast.error("Sem conexão para enviar o simulado. Tentando de novo…");
    }
  }, [cred, dados]);

  // Terminou as questões ou o tempo acabou: encerra a prova do aluno.
  useEffect(() => {
    if (fazendo && dados && (indice === -1 || esgotou)) void finalizar();
  }, [fazendo, dados, indice, esgotou, finalizar]);

  async function comecar() {
    if (!cred || !dados) return;
    setEnviando(true);
    try {
      const ok = await comecarSimulado(cred, dados.id, aluno?.nome ?? "Aluno");
      if (!ok) toast.error("O simulado já foi encerrado ou o tempo acabou.");
      await carregar();
    } finally {
      setEnviando(false);
    }
  }

  async function confirmar() {
    if (!cred || !dados || escolha === null || indice < 0) return;
    setEnviando(true);
    try {
      const ok = await responderSimulado(cred, dados.id, indice, escolha);
      if (!ok) {
        toast.error("Resposta não registrada: o tempo acabou ou o simulado foi encerrado.");
        await finalizar();
        return;
      }
      setRespostas((r) => ({ ...r, [String(indice)]: escolha }));
      setEscolha(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast.error("Sem conexão. Tente confirmar de novo.");
    } finally {
      setEnviando(false);
    }
  }

  const respondidas = Object.keys(respostas).length;
  const total = dados?.questoes.length ?? 0;

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />
        <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          {!fazendo ? (
            <Link
              to="/aluno/$turmaId/$alunoId"
              params={{ turmaId, alunoId }}
              className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" /> Voltar para minha área
            </Link>
          ) : null}

          {dados === undefined ? (
            <div className="flex justify-center py-20">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : resultado ? (
            <ResultadoAluno
              r={resultado}
              historico={historico}
              turmaId={turmaId}
              alunoId={alunoId}
            />
          ) : !dados ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <ClipboardList className="size-10 text-muted-foreground" />
                <p className="text-lg font-semibold text-foreground">
                  Nenhum simulado aberto agora
                </p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Quando o professor iniciar um simulado para a sua turma, ele aparece aqui.
                </p>
                {historico.length ? <Historico lista={historico} /> : null}
              </CardContent>
            </Card>
          ) : !dados.minha ? (
            <Card>
              <CardContent className="flex flex-col gap-5 p-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                    Simulado
                  </p>
                  <h1 className="text-2xl font-bold text-foreground">{dados.titulo}</h1>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Info rotulo="Questões" valor={String(total)} />
                  <Info rotulo="Tempo da prova" valor={`${dados.duracao_min} min`} />
                  <Info rotulo="Tempo restante" valor={formatarTempo(limite - passado)} />
                </div>
                <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
                  <li>Leia cada questão com calma e escolha uma resposta.</li>
                  <li>Depois de confirmar, não dá para voltar nem trocar a resposta.</li>
                  <li>Quando o tempo acabar, a prova fecha sozinha.</li>
                  <li>
                    O resultado é só seu. Ele ajuda o professor a saber o que treinar com a turma.
                  </li>
                </ul>
                <Button
                  size="lg"
                  onClick={comecar}
                  disabled={enviando || esgotou}
                  className="w-fit"
                >
                  {esgotou ? "O tempo do simulado acabou" : "Começar o simulado"}
                </Button>
              </CardContent>
            </Card>
          ) : questao ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3 shadow-sm">
                <Cronometro segundos={passado} limite={limite} tamanho={76} rotulo="restante" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{dados.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    Questão {indice + 1} de {total} · {respondidas} respondida(s) · seu tempo{" "}
                    {formatarTempo(tempoAluno)}
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(100 * respondidas) / total}%` }}
                    />
                  </div>
                </div>
              </div>

              {questao.texto?.paragrafos.length ? (
                <Card>
                  <CardContent className="flex flex-col gap-2 p-5">
                    {questao.texto.titulo ? (
                      <p className="font-semibold text-foreground">{questao.texto.titulo}</p>
                    ) : null}
                    {questao.texto.paragrafos.map((p, i) => (
                      <p key={i} className="text-base leading-relaxed text-foreground">
                        {p}
                      </p>
                    ))}
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardContent className="flex flex-col gap-4 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {rotuloArea(questao.area)} · Questão {indice + 1}
                  </p>
                  {questao.ilustracaoHtml ? (
                    // HTML gerado pelo próprio site no momento da criação do simulado (figuras, tabelas, malhas).
                    <div
                      className="flex justify-center"
                      dangerouslySetInnerHTML={{ __html: questao.ilustracaoHtml }}
                    />
                  ) : null}
                  <p className="text-lg font-medium text-foreground">{questao.enunciado}</p>
                  <div className="flex flex-col gap-2" role="radiogroup" aria-label="Opções">
                    {questao.opcoes.map((o, i) => (
                      <button
                        key={i}
                        type="button"
                        role="radio"
                        aria-checked={escolha === i}
                        onClick={() => setEscolha(i)}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 text-left text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          escolha === i
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border text-foreground hover:bg-muted",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold",
                            escolha === i
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/50 text-foreground",
                          )}
                        >
                          {"ABCDE"[i]}
                        </span>
                        {o}
                      </button>
                    ))}
                  </div>
                  <Button
                    size="lg"
                    disabled={escolha === null || enviando}
                    onClick={confirmar}
                    className="w-fit gap-2"
                  >
                    {enviando ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-4" />
                    )}
                    Confirmar resposta
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex justify-center py-20">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </section>
        <SiteFooter />
      </div>
    </div>
  );
}

function Info({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{rotulo}</p>
      <p className="text-xl font-bold tabular-nums text-foreground">{valor}</p>
    </div>
  );
}

function Historico({ lista }: { lista: { titulo: string; acertos: number; total: number }[] }) {
  return (
    <div className="mt-4 w-full max-w-md text-left">
      <p className="mb-2 text-sm font-semibold text-foreground">Meus simulados</p>
      <ul className="flex flex-col gap-1.5 text-sm">
        {lista.slice(0, 6).map((h, i) => (
          <li
            key={i}
            className="flex justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2 text-foreground"
          >
            <span className="truncate">{h.titulo}</span>
            <b className="tabular-nums">
              {h.acertos}/{h.total}
            </b>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultadoAluno({
  r,
  historico,
  turmaId,
  alunoId,
}: {
  r: Resultado;
  historico: { titulo: string; acertos: number; total: number }[];
  turmaId: string;
  alunoId: string;
}) {
  const p = r.total ? (100 * r.acertos) / r.total : 0;
  const s = selo(p);
  const anteriores = historico.slice(1).map((h) => (h.total ? (100 * h.acertos) / h.total : 0));
  const melhorAntes = anteriores.length ? Math.max(...anteriores) : null;
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-amber-500/15 text-amber-700 ring-1 ring-inset ring-amber-500/25 dark:text-amber-300">
          <Trophy className="size-8" />
        </span>
        <p className="text-2xl font-bold text-foreground">Simulado concluído!</p>
        <span className={cn("rounded-full px-4 py-1 text-sm font-bold", s.cls)}>{s.nome}</span>
        <p className="text-4xl font-bold tabular-nums text-foreground">
          {r.acertos}{" "}
          <span className="text-xl font-medium text-muted-foreground">de {r.total}</span>
        </p>
        <p className="max-w-md text-sm text-foreground">{s.frase}</p>
        <p className="text-xs text-muted-foreground">
          Tempo: {formatarTempo(r.tempo_seg)}
          {r.respondidas < r.total
            ? ` · ${r.total - r.respondidas} questão(ões) ficaram sem resposta`
            : ""}
        </p>
        {melhorAntes != null ? (
          <p className="text-sm font-medium text-foreground">
            {p > melhorAntes
              ? "🎉 Esta é a sua melhor marca até agora!"
              : `Sua melhor marca anterior foi ${Math.round(melhorAntes)}% de acertos. Continue treinando!`}
          </p>
        ) : null}
        <Button asChild className="mt-2">
          <Link to="/aluno/$turmaId/$alunoId/trilha" params={{ turmaId, alunoId }}>
            Ir para minha trilha
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
