import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  GraduationCap,
  HeartHandshake,
  KeyRound,
  Presentation,
  Users2,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { HeroProfissional } from "@/components/school/hero-profissional";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { SenhaProfissionalDialog } from "@/components/school/senha-profissional-dialog";
import { SiteFooter } from "@/components/school/site-footer";
import { useAppStore } from "@/lib/app-store";
import { conferirSenhaProfessor, idProfessor } from "@/lib/profissional-acesso";
import { iniciarProfissionalSessao } from "@/lib/profissional-session";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";
import type { Turma } from "@/lib/types";

export const Route = createFileRoute("/professor/")({
  component: ProfessorPicker,
  head: () => ({
    meta: [
      { title: "Espaço do Professor · Agenda de Informática" },
      {
        name: "description",
        content:
          "Espaço do Professor: cada professor regente acompanha sua turma, os grupos, a frequência e usa as mesmas ferramentas dos alunos.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function ProfessorPicker() {
  const { turmas, config } = useAppStore();
  const navigate = useNavigate();
  const [turmaEscolhida, setTurmaEscolhida] = useState<Turma | null>(null);

  const totalAlunos = turmas.reduce((soma, turma) => soma + turma.alunos.length, 0);
  const totalApoio = turmas.reduce((soma, turma) => soma + (turma.apoioEspecial?.length ?? 0), 0);

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <HeroProfissional
            etiqueta="Espaço do Professor"
            EtiquetaIcon={Presentation}
            titulo="A sua turma, do seu jeito"
            subtitulo="Cada professor(a) regente entra com a própria senha e encontra aqui os alunos, os grupos do rodízio, a frequência do mês, as atividades e as mesmas ferramentas que a turma usa no laboratório."
            indicadores={[
              { rotulo: "Turmas", valor: turmas.length, icon: Users2 },
              { rotulo: "Alunos", valor: totalAlunos, icon: GraduationCap },
              { rotulo: "Apoio especializado", valor: totalApoio, icon: HeartHandshake },
              { rotulo: "Entrada", valor: "Senha de 4 dígitos", icon: KeyRound },
            ]}
          />

          <h2 className="mb-1 mt-8 text-lg font-semibold text-foreground">
            Escolha sua turma para começar
          </h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Clique no seu nome e digite a senha que a coordenação entregou.
          </p>

          {turmas.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma turma cadastrada ainda.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {turmas.map((turma) => {
                const cor = serieClasses(serieIndexPorNumero(turma.serie));
                const especiais = turma.alunos.filter((a) => a.necessidadeEspecial).length;
                return (
                  <button
                    key={turma.id}
                    type="button"
                    onClick={() => setTurmaEscolhida(turma)}
                    className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <span
                      className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-base font-bold ${cor.bg} ${cor.text}`}
                    >
                      {turma.letra}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                        Prof(a). {turma.professorRegente}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {turma.serie} &quot;{turma.letra}&quot;
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users2 className="size-3.5" /> {turma.alunos.length} alunos
                        </span>
                        {especiais > 0 ? (
                          <span className="flex items-center gap-1 text-primary">
                            <HeartHandshake className="size-3.5" /> {especiais} com apoio
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-8 flex flex-col items-center gap-2 text-center">
            <p className="text-xs text-muted-foreground">
              Professor de informática: {config.professorInformatica}
            </p>
            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <a href="/mediador">
                <HeartHandshake className="size-4" /> Sou mediador(a) ou cuidador(a)
              </a>
            </Button>
          </div>
        </section>

        <SiteFooter />
      </div>

      {turmaEscolhida ? (
        <SenhaProfissionalDialog
          aberto
          aoFechar={() => setTurmaEscolhida(null)}
          nome={`Prof(a). ${turmaEscolhida.professorRegente}`}
          contexto={`Professor(a) regente · ${turmaEscolhida.serie} "${turmaEscolhida.letra}"`}
          verificar={(senha) => conferirSenhaProfessor(turmaEscolhida, senha)}
          aoEntrar={() => {
            iniciarProfissionalSessao({
              tipo: "professor",
              id: idProfessor(turmaEscolhida),
              nome: turmaEscolhida.professorRegente,
              turmaId: turmaEscolhida.id,
            });
            navigate({ to: "/professor/$turmaId", params: { turmaId: turmaEscolhida.id } });
          }}
        />
      ) : null}
    </div>
  );
}
