import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Baby,
  CakeSlice,
  CalendarDays,
  ExternalLink,
  HandHeart,
  HeartHandshake,
  LogOut,
  School,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HeroProfissional } from "@/components/school/hero-profissional";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { SiteFooter } from "@/components/school/site-footer";
import { useAppStore } from "@/lib/app-store";
import { fetchAtividadesDaTurma } from "@/lib/aluno-area";
import { useConfirmar } from "@/lib/confirm-store";
import { FERRAMENTAS_ADAPTADAS, alunosDoApoio, idadeEmAnos } from "@/lib/profissional-acesso";
import { encerrarProfissionalSessao, temSessaoDeApoio } from "@/lib/profissional-session";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";
import type { Atividade } from "@/lib/types";

export const Route = createFileRoute("/mediador/$turmaId/$apoioIndex/")({
  component: MediadorPainel,
  head: () => ({
    meta: [
      { title: "Minha área · Espaço do Mediador e do Cuidador" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function MediadorPainel() {
  const { turmaId, apoioIndex } = Route.useParams();
  const indice = Number(apoioIndex);
  const { turmas } = useAppStore();
  const navigate = useNavigate();
  const confirmar = useConfirmar();

  const turma = turmas.find((t) => t.id === turmaId);
  const apoio = turma?.apoioEspecial?.[indice];

  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!temSessaoDeApoio(turmaId, indice)) navigate({ to: "/mediador" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaId, indice]);

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      setCarregando(true);
      try {
        const tarefas = await fetchAtividadesDaTurma(turmaId);
        if (!cancelado) setAtividades(tarefas);
      } catch {
        if (!cancelado) setAtividades([]);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, [turmaId]);

  async function sair() {
    const ok = await confirmar({
      titulo: "Sair da sua área?",
      descricao: "Você vai precisar da sua senha de novo para entrar.",
    });
    if (!ok) return;
    encerrarProfissionalSessao();
    navigate({ to: "/mediador" });
  }

  if (!turma || !apoio) {
    return (
      <div className="relative min-h-screen bg-background">
        <PageBackground />
        <div className="relative z-10">
          <NavBar />
          <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
            <p className="text-sm text-muted-foreground">Profissional não encontrado.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/mediador">Voltar</Link>
            </Button>
          </div>
          <SiteFooter />
        </div>
      </div>
    );
  }

  const cor = serieClasses(serieIndexPorNumero(turma.serie));
  const criancas = alunosDoApoio(turma, indice);

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <Link
            to="/mediador"
            className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Trocar de profissional
          </Link>

          <HeroProfissional
            etiqueta={apoio.funcao}
            EtiquetaIcon={HandHeart}
            titulo={apoio.nome}
            subtitulo={`Atendimento especializado na turma ${turma.serie} "${turma.letra}", com Prof(a). ${turma.professorRegente}. Aqui ficam os dados das crianças que você acompanha e as atividades adaptadas ao ritmo delas.`}
            indicadores={[
              { rotulo: "Crianças", valor: criancas.length, icon: Baby },
              { rotulo: "Turma", valor: `${turma.serie} ${turma.letra}`, icon: School },
              {
                rotulo: "Atividades da turma",
                valor: carregando ? "..." : atividades.length,
                icon: CalendarDays,
              },
              {
                rotulo: "Ferramentas adaptadas",
                valor: FERRAMENTAS_ADAPTADAS.length,
                icon: Sparkles,
              },
            ]}
            acoes={
              <Button variant="outline" size="sm" className="gap-1.5" onClick={sair}>
                <LogOut className="size-4" /> Sair
              </Button>
            }
          />

          <Link
            to="/mediador/$turmaId/$apoioIndex/ferramentas"
            params={{ turmaId, apoioIndex }}
            className="group mt-4 flex cursor-pointer items-center gap-4 rounded-2xl border border-primary/30 bg-card p-4 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground sm:text-base">
                Ferramentas adaptadas
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                As atividades que funcionam por imagem, som e repetição — para usar junto com a
                criança, no ritmo dela.
              </p>
            </div>
            <span className="hidden shrink-0 text-sm font-medium text-primary group-hover:underline sm:block">
              Abrir →
            </span>
          </Link>

          <h2 className="mb-1 mt-8 text-lg font-semibold text-foreground">
            Crianças que você acompanha
          </h2>
          <p className="mb-3 text-sm text-muted-foreground">
            O sistema identifica, no cadastro da escola, os alunos desta turma com atendimento
            especializado e divide entre os profissionais de apoio da turma.
          </p>

          {criancas.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma criança com atendimento especializado registrada nesta turma.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {criancas.map((crianca) => {
                const idade = idadeEmAnos(crianca.nascimento);
                return (
                  <Card key={crianca.id}>
                    <CardContent className="flex flex-col gap-2 p-4">
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${cor.bg} ${cor.text}`}
                        >
                          {crianca.nome.charAt(0)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{crianca.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {turma.serie} &quot;{turma.letra}&quot;
                          </p>
                        </div>
                      </div>

                      <dl className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-1.5">
                          <CakeSlice className="size-3.5 shrink-0 text-muted-foreground" />
                          <dt className="text-muted-foreground">Idade:</dt>
                          <dd className="text-foreground">
                            {idade !== null ? `${idade} anos` : "não informada no cadastro"}
                          </dd>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <HeartHandshake className="mt-0.5 size-3.5 shrink-0 text-primary" />
                          <dt className="text-muted-foreground">Especialidade:</dt>
                          <dd className="text-foreground">
                            {crianca.especialidade ?? "não informada no cadastro"}
                          </dd>
                        </div>
                      </dl>

                      {crianca.observacoesNecessidade ? (
                        <p className="rounded-lg bg-primary/5 p-2 text-xs text-foreground">
                          {crianca.observacoesNecessidade}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Sem orientações de adaptação registradas. A coordenação pode incluí-las no
                          cadastro do aluno.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

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

          <Badge variant="secondary" className="mt-6 font-normal">
            Prof(a). regente: {turma.professorRegente}
          </Badge>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
