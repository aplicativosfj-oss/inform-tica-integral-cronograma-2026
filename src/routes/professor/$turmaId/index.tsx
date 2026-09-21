import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  ChevronRight,
  ExternalLink,
  HeartHandshake,
  LogOut,
  Presentation,
  Sparkles,
  UserX,
  Users2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HeroProfissional } from "@/components/school/hero-profissional";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { SiteFooter } from "@/components/school/site-footer";
import { FERRAMENTAS } from "@/components/school/ferramentas/registro";
import { useAppStore } from "@/lib/app-store";
import { fetchAtividadesDaTurma } from "@/lib/aluno-area";
import { useConfirmar } from "@/lib/confirm-store";
import { fetchPresencasRange } from "@/lib/presencas";
import { encerrarProfissionalSessao, temSessaoDeProfessor } from "@/lib/profissional-session";
import { buildGrupos } from "@/lib/schedule-engine";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";
import type { Atividade, Presenca } from "@/lib/types";

export const Route = createFileRoute("/professor/$turmaId/")({
  component: ProfessorPainel,
  head: () => ({
    meta: [
      { title: "Minha turma · Espaço do Professor" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function inicioDoMes(hoje: Date): string {
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;
}

function fimDoMes(hoje: Date): string {
  const ultimo = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  return `${ultimo.getFullYear()}-${String(ultimo.getMonth() + 1).padStart(2, "0")}-${String(
    ultimo.getDate(),
  ).padStart(2, "0")}`;
}

function ProfessorPainel() {
  const { turmaId } = Route.useParams();
  const { turmas, config } = useAppStore();
  const navigate = useNavigate();
  const confirmar = useConfirmar();
  const turma = turmas.find((t) => t.id === turmaId);

  const [presencas, setPresencas] = useState<Presenca[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Sem a senha conferida nesta aba, a página volta para a escolha da turma.
  useEffect(() => {
    if (!temSessaoDeProfessor(turmaId)) navigate({ to: "/professor" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaId]);

  useEffect(() => {
    let cancelado = false;
    const hoje = new Date();
    async function carregar() {
      setCarregando(true);
      try {
        const [registros, tarefas] = await Promise.all([
          fetchPresencasRange(inicioDoMes(hoje), fimDoMes(hoje), turmaId),
          fetchAtividadesDaTurma(turmaId),
        ]);
        if (cancelado) return;
        setPresencas(registros);
        setAtividades(tarefas);
      } catch {
        if (!cancelado) {
          setPresencas([]);
          setAtividades([]);
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, [turmaId]);

  const resumoPorAluno = useMemo(() => {
    const mapa = new Map<string, { presencas: number; faltas: number }>();
    for (const registro of presencas) {
      const atual = mapa.get(registro.alunoId) ?? { presencas: 0, faltas: 0 };
      if (registro.status === "faltou") atual.faltas += 1;
      else atual.presencas += 1;
      mapa.set(registro.alunoId, atual);
    }
    return mapa;
  }, [presencas]);

  async function sair() {
    const ok = await confirmar({
      titulo: "Sair do Espaço do Professor?",
      descricao: "Você vai precisar da sua senha de novo para entrar.",
    });
    if (!ok) return;
    encerrarProfissionalSessao();
    navigate({ to: "/professor" });
  }

  if (!turma) {
    return (
      <div className="relative min-h-screen bg-background">
        <PageBackground />
        <div className="relative z-10">
          <NavBar />
          <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
            <p className="text-sm text-muted-foreground">Turma não encontrada.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/professor">Voltar</Link>
            </Button>
          </div>
          <SiteFooter />
        </div>
      </div>
    );
  }

  const cor = serieClasses(serieIndexPorNumero(turma.serie));
  const grupos = buildGrupos(turma, config);
  const totalFaltasMes = presencas.filter((p) => p.status === "faltou").length;
  const especiais = turma.alunos.filter((a) => a.necessidadeEspecial);

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <Link
            to="/professor"
            className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Trocar de turma
          </Link>

          <HeroProfissional
            etiqueta="Espaço do Professor"
            EtiquetaIcon={Presentation}
            titulo={`${turma.serie} "${turma.letra}" · Prof(a). ${turma.professorRegente}`}
            subtitulo="Acompanhe a turma no dia a dia da informática: quem está em cada grupo do rodízio, como anda a frequência do mês e o que cada aluno já fez das atividades."
            indicadores={[
              { rotulo: "Alunos", valor: turma.alunos.length, icon: Users2 },
              { rotulo: "Grupos", valor: grupos.length, icon: Users2 },
              {
                rotulo: "Faltas no mês",
                valor: carregando ? "..." : totalFaltasMes,
                icon: UserX,
              },
              {
                rotulo: "Atividades",
                valor: carregando ? "..." : atividades.length,
                icon: CalendarDays,
              },
            ]}
            acoes={
              <Button variant="outline" size="sm" className="gap-1.5" onClick={sair}>
                <LogOut className="size-4" /> Sair
              </Button>
            }
          />

          <Link
            to="/professor/$turmaId/ferramentas"
            params={{ turmaId }}
            className="group mt-4 flex cursor-pointer items-center gap-4 rounded-2xl border border-primary/30 bg-card p-4 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground sm:text-base">
                Ferramentas de trabalho
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                As mesmas {FERRAMENTAS.length} ferramentas da Área do Aluno, para preparar e
                conduzir a aula.
              </p>
            </div>
            <span className="hidden shrink-0 text-sm font-medium text-primary group-hover:underline sm:block">
              Abrir →
            </span>
          </Link>

          {turma.apoioEspecial && turma.apoioEspecial.length > 0 ? (
            <Card className="mt-4 border-primary/30 bg-primary/5">
              <CardContent className="flex flex-col gap-2 py-4">
                <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <HeartHandshake className="size-4 text-primary" /> Apoio especializado da turma
                </p>
                <div className="flex flex-wrap gap-2">
                  {turma.apoioEspecial.map((apoio, index) => (
                    <Link
                      key={index}
                      to="/mediador/$turmaId/$apoioIndex"
                      params={{ turmaId, apoioIndex: String(index) }}
                      className="cursor-pointer"
                    >
                      <Badge variant="outline" className="font-normal hover:border-primary">
                        {apoio.funcao} {apoio.nome} <ExternalLink className="ml-1 size-3" />
                      </Badge>
                    </Link>
                  ))}
                </div>
                {especiais.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {especiais.length} aluno(s) desta turma recebem atendimento especializado.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <h2 className="mb-1 mt-8 text-lg font-semibold text-foreground">Grupos e alunos</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Clique em um aluno para ver o painel dele: atividades, presenças e últimos acessos.
          </p>
          <div className="flex flex-col gap-3">
            {grupos.map((grupo) => (
              <Card key={grupo.indice}>
                <CardContent className="py-4">
                  <Badge variant="secondary" className="mb-3">
                    {grupo.nome ?? `Grupo ${grupo.indice + 1}`}
                  </Badge>
                  {grupo.alunos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum aluno neste grupo.</p>
                  ) : (
                    <div className="flex flex-col divide-y divide-border/60">
                      {grupo.alunos.map((aluno) => {
                        const resumo = resumoPorAluno.get(aluno.id);
                        return (
                          <Link
                            key={aluno.id}
                            to="/professor/$turmaId/aluno/$alunoId"
                            params={{ turmaId, alunoId: aluno.id }}
                            className="group flex cursor-pointer items-center justify-between gap-3 py-2 transition-colors hover:text-primary"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                                {aluno.nome}
                              </p>
                              {aluno.necessidadeEspecial ? (
                                <span className="flex items-center gap-1 text-xs text-primary">
                                  <HeartHandshake className="size-3" /> Atendimento especializado
                                  {aluno.observacoesNecessidade
                                    ? ` — ${aluno.observacoesNecessidade}`
                                    : ""}
                                </span>
                              ) : null}
                              {aluno.impedido ? (
                                <span className="flex items-center gap-1 text-xs text-amber-600">
                                  <Ban className="size-3" /> Impedido de participar
                                  {aluno.motivoImpedimento ? ` — ${aluno.motivoImpedimento}` : ""}
                                </span>
                              ) : null}
                            </div>
                            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                              {carregando
                                ? "..."
                                : `${resumo?.presencas ?? 0} presenças · ${resumo?.faltas ?? 0} faltas`}
                              <ChevronRight className="size-4 group-hover:text-primary" />
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 className="mb-3 mt-8 text-lg font-semibold text-foreground">Atividades da turma</h2>
          {carregando ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : atividades.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma atividade cadastrada para esta turma ainda.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {atividades.map((atividade) => (
                <Card key={atividade.id}>
                  <CardContent className="flex flex-col gap-1.5 p-4">
                    <p className="text-sm font-semibold text-foreground">{atividade.titulo}</p>
                    {atividade.descricao ? (
                      <p className="text-xs text-muted-foreground">{atividade.descricao}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {new Date(`${atividade.data}T12:00:00`).toLocaleDateString("pt-BR")}
                    </p>
                    {atividade.url ? (
                      <Button asChild size="sm" variant="outline" className="mt-1 w-fit gap-1.5">
                        <a href={atividade.url} target="_blank" rel="noopener noreferrer">
                          Abrir <ExternalLink className="size-3.5" />
                        </a>
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Turma {turma.serie} &quot;{turma.letra}&quot; ·{" "}
            <span className={`rounded px-1.5 py-0.5 ${cor.bg} ${cor.text}`}>{turma.letra}</span>
          </p>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
