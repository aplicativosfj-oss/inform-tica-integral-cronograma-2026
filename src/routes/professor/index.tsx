import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, HeartHandshake, Presentation, Users2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { SiteFooter } from "@/components/school/site-footer";
import { useAppStore } from "@/lib/app-store";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";

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

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <Badge className="mb-2 w-fit gap-1.5">
            <Presentation className="size-3.5" /> Espaço do Professor
          </Badge>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
            Escolha sua turma para começar
          </h1>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">
            Cada professor(a) regente já cadastrado(a) tem aqui a sua turma: alunos, grupos do
            rodízio, frequência e as mesmas ferramentas que os alunos usam.
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
                  <Link
                    key={turma.id}
                    to="/professor/$turmaId"
                    params={{ turmaId: turma.id }}
                    className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
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
                  </Link>
                );
              })}
            </div>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Professor de informática: {config.professorInformatica}
          </p>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
