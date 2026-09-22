import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, GraduationCap, Users2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { SiteImage } from "@/components/school/site-image";
import { SiteFooter } from "@/components/school/site-footer";
import { useAppStore } from "@/lib/app-store";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";
import alunoHeroImg from "@/assets/alunos-hero.jpg";

export const Route = createFileRoute("/aluno/")({
  component: AlunoTurmaPicker,
  head: () => ({
    meta: [
      { title: "Área do Aluno · Agenda de Informática" },
      {
        name: "description",
        content:
          "Área do Aluno: escolha sua turma para acessar suas atividades de informática e acompanhar sua frequência.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AlunoTurmaPicker() {
  const { turmas, config } = useAppStore();

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
          <div className="relative overflow-hidden rounded-3xl border border-border/60 shadow-xl">
            <SiteImage
              src={alunoHeroImg}
              alt="Aluna sorridente usando um computador do laboratório de informática, com colega ao fundo"
              width={1600}
              height={500}
              className="h-[170px] w-full sm:h-[200px] lg:aspect-[21/6] lg:h-auto"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent"
            />
            <div className="absolute inset-0 flex items-center p-4 sm:p-6">
              <div className="flex max-w-md flex-col gap-1.5 rounded-xl border border-white/25 bg-white/10 p-3 shadow-2xl backdrop-blur-xl sm:gap-2 sm:p-4">
                <Badge className="w-fit gap-1.5 border-white/25 bg-white/15 text-white backdrop-blur">
                  <GraduationCap className="size-3.5" /> Área do Aluno
                </Badge>
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Escolha sua turma
                </h1>
                <p className="text-balance text-xs text-white/90">
                  Encontre a sua turma, depois clique no seu nome para acessar suas atividades.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          {turmas.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma turma cadastrada ainda.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {turmas.map((turma) => {
                const cor = serieClasses(serieIndexPorNumero(turma.serie));
                return (
                  <Link
                    key={turma.id}
                    to="/aluno/$turmaId"
                    params={{ turmaId: turma.id }}
                    className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <span
                      className={`flex size-11 items-center justify-center rounded-full text-base font-bold ring-1 ring-inset ring-black/5 dark:ring-white/10 ${cor.bg} ${cor.text}`}
                    >
                      {turma.letra}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                        {turma.serie} &quot;{turma.letra}&quot;
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Users2 className="size-3.5" /> {turma.alunos.length} alunos
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Entrar <ChevronRight className="size-3.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
