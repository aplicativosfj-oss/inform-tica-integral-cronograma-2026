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
      { title: "Área do Aluno · Informática Dr. Eiraldo" },
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
              className="h-[230px] w-full sm:h-[270px] lg:aspect-[21/6] lg:h-auto"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent"
            />
            <div className="absolute inset-0 flex items-center p-4 sm:p-6">
              <div className="flex max-w-lg flex-col gap-2 rounded-[1.5rem] border border-white/25 bg-ink/55 p-5 shadow-2xl backdrop-blur-2xl sm:gap-3 sm:p-7">
                <Badge className="w-fit gap-1.5 border-white/25 bg-white/15 text-white backdrop-blur">
                  <GraduationCap className="size-3.5" /> Área do Aluno
                </Badge>
                <h1 className="font-heading text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  Em qual turma você está?
                </h1>
                <p className="text-balance text-sm leading-relaxed text-white/85">
                  Ache a sua turma e depois clique no seu nome. As suas atividades estão esperando!
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          {turmas.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Ainda não há turmas por aqui.
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
                    className="group flex min-h-44 cursor-pointer flex-col gap-3 rounded-[1.5rem] border border-border/75 bg-card/90 p-5 shadow-md shadow-ink/5 transition-all duration-200 ease-out hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
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
                    <span className="flex items-center gap-1 text-xs font-bold text-primary opacity-75 transition-opacity group-hover:opacity-100">
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
