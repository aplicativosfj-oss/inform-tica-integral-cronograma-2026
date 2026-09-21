import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Ban,
  BookOpenCheck,
  CalendarCheck2,
  CheckCircle2,
  Circle,
  ExternalLink,
  HeartHandshake,
  Star,
  UserRound,
  UserX,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AvaliarDialog, SeloAvaliacao } from "@/components/school/avaliar-dialog";
import { HeroProfissional } from "@/components/school/hero-profissional";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { SiteFooter } from "@/components/school/site-footer";
import { useAppStore } from "@/lib/app-store";
import {
  fetchAtividadesDaTurma,
  fetchPresencasDoAluno,
  fetchStatusDaAtividade,
} from "@/lib/aluno-area";
import {
  fetchAvaliacoesDoAluno,
  fetchEntregasDoAluno,
  type Avaliacao,
  type Entrega,
} from "@/lib/avaliacoes";
import { idadeEmAnos } from "@/lib/profissional-acesso";
import { lerProfissionalSessao, temSessaoDeProfessor } from "@/lib/profissional-session";
import type { Atividade, Presenca } from "@/lib/types";

export const Route = createFileRoute("/professor/$turmaId/aluno/$alunoId")({
  component: AcompanharAluno,
  head: () => ({
    meta: [
      { title: "Acompanhar aluno · Espaço do Professor" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function formatarData(data: string) {
  return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR");
}

function AcompanharAluno() {
  const { turmaId, alunoId } = Route.useParams();
  const { turmas, updateAluno } = useAppStore();
  const navigate = useNavigate();
  const turma = turmas.find((t) => t.id === turmaId);
  const aluno = turma?.alunos.find((a) => a.id === alunoId);

  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [concluidas, setConcluidas] = useState<Set<string>>(new Set());
  const [presencas, setPresencas] = useState<Presenca[]>([]);
  const [carregando, setCarregando] = useState(true);
  // O andamento por aluno mora numa tabela que o banco só abre para quem tem
  // login de verdade (painel administrativo). Aqui a senha é só da área do
  // professor, então esse pedaço pode voltar vazio — e a tela avisa em vez
  // de fingir que o aluno não fez nada.
  const [semAcessoAoAndamento, setSemAcessoAoAndamento] = useState(false);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [avaliando, setAvaliando] = useState<{
    titulo: string;
    tipo: "atividade" | "entrega";
    referenciaId: string;
  } | null>(null);
  const [textoAberto, setTextoAberto] = useState<Entrega | null>(null);

  const nomeDoProfessor = lerProfissionalSessao()?.nome ?? "Professor(a)";

  /** Avaliação já registrada para um trabalho, se houver. */
  function avaliacaoDe(tipo: "atividade" | "entrega", referenciaId: string) {
    return avaliacoes.find((a) => a.tipo === tipo && a.referenciaId === referenciaId);
  }

  async function recarregarAvaliacoes() {
    try {
      setAvaliacoes(await fetchAvaliacoesDoAluno(alunoId));
    } catch {
      // Sem as avaliações a tela ainda serve: mostra os trabalhos sem selo.
    }
  }

  /** Liga/desliga o impedimento do aluno no rodízio, com o motivo. */
  async function alternarImpedimento() {
    if (!aluno) return;
    if (aluno.impedido) {
      updateAluno(turmaId, alunoId, { impedido: false, motivoImpedimento: undefined });
      toast.success(`${aluno.nome.split(" ")[0]} voltou a participar do rodízio.`);
      return;
    }
    const motivo = window.prompt(
      "Por que este aluno está impedido de participar? (o motivo fica registrado)",
      "",
    );
    if (motivo === null) return;
    updateAluno(turmaId, alunoId, {
      impedido: true,
      motivoImpedimento: motivo.trim() || undefined,
    });
    toast.success("Aluno marcado como impedido. A chamada passa a pular a vez dele.");
  }

  useEffect(() => {
    if (!temSessaoDeProfessor(turmaId)) navigate({ to: "/professor" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaId]);

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      setCarregando(true);
      try {
        const [tarefas, historico, avaliadas, entregues] = await Promise.all([
          fetchAtividadesDaTurma(turmaId),
          fetchPresencasDoAluno(alunoId),
          fetchAvaliacoesDoAluno(alunoId).catch(() => [] as Avaliacao[]),
          fetchEntregasDoAluno(alunoId).catch(() => [] as Entrega[]),
        ]);
        if (cancelado) return;
        setAtividades(tarefas);
        setPresencas(historico);
        setAvaliacoes(avaliadas);
        setEntregas(entregues);

        const resultados = await Promise.allSettled(
          tarefas.map((tarefa) => fetchStatusDaAtividade(tarefa.id)),
        );
        if (cancelado) return;
        const feitas = new Set<string>();
        let algumaFalhou = false;
        for (const resultado of resultados) {
          if (resultado.status === "rejected") {
            algumaFalhou = true;
            continue;
          }
          for (const status of resultado.value) {
            if (status.alunoId === alunoId && status.status === "concluida") {
              feitas.add(status.atividadeId);
            }
          }
        }
        setConcluidas(feitas);
        setSemAcessoAoAndamento(algumaFalhou && feitas.size === 0);
      } catch {
        if (!cancelado) {
          setAtividades([]);
          setPresencas([]);
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, [turmaId, alunoId]);

  if (!turma || !aluno) {
    return (
      <div className="relative min-h-screen bg-background">
        <PageBackground />
        <div className="relative z-10">
          <NavBar />
          <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
            <p className="text-sm text-muted-foreground">Aluno não encontrado nesta turma.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/professor/$turmaId" params={{ turmaId }}>
                Voltar para a turma
              </Link>
            </Button>
          </div>
          <SiteFooter />
        </div>
      </div>
    );
  }

  const faltas = presencas.filter((p) => p.status === "faltou").length;
  const comparecimentos = presencas.length - faltas;
  const idade = idadeEmAnos(aluno.nascimento);

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <Link
            to="/professor/$turmaId"
            params={{ turmaId }}
            className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Voltar para minha turma
          </Link>

          <HeroProfissional
            etiqueta="Acompanhamento individual"
            EtiquetaIcon={UserRound}
            titulo={aluno.nome}
            subtitulo={`${turma.serie} "${turma.letra}"${idade !== null ? ` · ${idade} anos` : ""} · o que este aluno já fez das atividades e como está a frequência dele.`}
            indicadores={[
              {
                rotulo: "Atividades feitas",
                valor: carregando ? "..." : `${concluidas.size}/${atividades.length}`,
                icon: CheckCircle2,
              },
              {
                rotulo: "Presenças",
                valor: carregando ? "..." : comparecimentos,
                icon: CalendarCheck2,
              },
              { rotulo: "Faltas", valor: carregando ? "..." : faltas, icon: UserX },
            ]}
          />

          {aluno.necessidadeEspecial || aluno.impedido ? (
            <Card className="mt-4 border-primary/30 bg-primary/5">
              <CardContent className="flex flex-col gap-1.5 py-4 text-sm">
                {aluno.necessidadeEspecial ? (
                  <p className="flex items-start gap-1.5 text-foreground">
                    <HeartHandshake className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>
                      Atendimento especializado
                      {aluno.especialidade ? ` · ${aluno.especialidade}` : ""}
                      {aluno.observacoesNecessidade ? ` — ${aluno.observacoesNecessidade}` : ""}
                    </span>
                  </p>
                ) : null}
                {aluno.impedido ? (
                  <p className="flex items-start gap-1.5 text-amber-700 dark:text-amber-400">
                    <Ban className="mt-0.5 size-4 shrink-0" />
                    <span>
                      Impedido de participar do rodízio
                      {aluno.motivoImpedimento ? ` — ${aluno.motivoImpedimento}` : ""}
                    </span>
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              variant={aluno.impedido ? "outline" : "ghost"}
              size="sm"
              className={`gap-1.5 ${aluno.impedido ? "" : "text-muted-foreground"}`}
              onClick={alternarImpedimento}
            >
              <Ban className="size-4" />
              {aluno.impedido ? "Liberar para o rodízio" : "Marcar como impedido"}
            </Button>
            <span className="text-xs text-muted-foreground">
              Enquanto impedido, a chamada pula a vez dele e chama o próximo da fila.
            </span>
          </div>

          <h2 className="mb-3 mt-8 text-lg font-semibold text-foreground">Atividades</h2>
          {semAcessoAoAndamento ? (
            <p className="mb-3 text-xs text-muted-foreground">
              O andamento marcado pelo aluno só aparece para quem está logado no painel
              administrativo. Abaixo ficam as atividades da turma.
            </p>
          ) : null}
          {carregando ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : atividades.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma atividade cadastrada para esta turma ainda.
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {atividades.map((atividade) => {
                const feita = concluidas.has(atividade.id);
                return (
                  <Card key={atividade.id}>
                    <CardContent className="flex items-start gap-3 p-4">
                      {feita ? (
                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                      ) : (
                        <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">{atividade.titulo}</p>
                        {atividade.descricao ? (
                          <p className="text-xs text-muted-foreground">{atividade.descricao}</p>
                        ) : null}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatarData(atividade.data)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <Badge variant={feita ? "default" : "secondary"} className="font-normal">
                          {feita ? "Concluída" : "Pendente"}
                        </Badge>
                        <SeloAvaliacao avaliacao={avaliacaoDe("atividade", atividade.id)} />
                        <div className="flex gap-1">
                          {atividade.url ? (
                            <Button asChild size="sm" variant="ghost" className="h-7 gap-1 px-2">
                              <a href={atividade.url} target="_blank" rel="noopener noreferrer">
                                Abrir <ExternalLink className="size-3" />
                              </a>
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 px-2"
                            onClick={() =>
                              setAvaliando({
                                titulo: atividade.titulo,
                                tipo: "atividade",
                                referenciaId: atividade.id,
                              })
                            }
                          >
                            <Star className="size-3" /> Avaliar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <h2 className="mb-1 mt-8 text-lg font-semibold text-foreground">Textos entregues</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            O que o aluno escreveu no editor e escolheu entregar para você ler.
          </p>
          {entregas.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                Nenhum texto entregue ainda. No editor, o aluno usa o botão &quot;Entregar ao
                professor&quot;.
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {entregas.map((entrega) => (
                <Card key={entrega.id}>
                  <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        <BookOpenCheck className="size-4 shrink-0 text-primary" /> {entrega.titulo}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Entregue em {new Date(entrega.criadoEm).toLocaleString("pt-BR")}
                      </p>
                      <div className="mt-1.5">
                        <SeloAvaliacao avaliacao={avaliacaoDe("entrega", entrega.id)} />
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setTextoAberto(textoAberto?.id === entrega.id ? null : entrega)
                        }
                      >
                        {textoAberto?.id === entrega.id ? "Fechar" : "Ler"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() =>
                          setAvaliando({
                            titulo: entrega.titulo,
                            tipo: "entrega",
                            referenciaId: entrega.id,
                          })
                        }
                      >
                        <Star className="size-3.5" /> Avaliar
                      </Button>
                    </div>

                    {textoAberto?.id === entrega.id ? (
                      <div
                        className="w-full rounded-lg border border-border bg-white p-4 text-sm text-[#1f2937] [&_img]:max-w-full"
                        // O texto vem do editor do próprio aluno, que grava HTML
                        // formatado (negrito, cor, imagens). Mostrar como texto
                        // puro exibiria as tags em vez do trabalho dele.
                        dangerouslySetInnerHTML={{ __html: entrega.conteudoHtml }}
                      />
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <h2 className="mb-3 mt-8 text-lg font-semibold text-foreground">Frequência recente</h2>
          {carregando ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : presencas.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                Nenhum registro de frequência para este aluno ainda.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col divide-y divide-border/60 py-2">
                {presencas.slice(0, 15).map((registro) => (
                  <div key={registro.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="text-sm text-foreground">{formatarData(registro.data)}</span>
                    <Badge
                      variant={registro.status === "faltou" ? "destructive" : "secondary"}
                      className="font-normal"
                    >
                      {registro.status === "faltou"
                        ? `Faltou${registro.motivo === "nao_quis_participar" ? " (não quis participar)" : ""}`
                        : registro.status === "substituido"
                          ? "Substituiu um colega"
                          : "Presente"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </section>

        <SiteFooter />
      </div>

      {avaliando ? (
        <AvaliarDialog
          aberto
          aoFechar={() => setAvaliando(null)}
          titulo={avaliando.titulo}
          turmaId={turmaId}
          alunoId={alunoId}
          tipo={avaliando.tipo}
          referenciaId={avaliando.referenciaId}
          avaliadoPor={nomeDoProfessor}
          atual={avaliacaoDe(avaliando.tipo, avaliando.referenciaId)}
          aoSalvar={recarregarAvaliacoes}
        />
      ) : null}
    </div>
  );
}
