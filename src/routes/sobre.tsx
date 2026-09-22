import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  ExternalLink,
  GraduationCap,
  Mail,
  MonitorSmartphone,
  Puzzle,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { AvisoDireitosImagem, SiteImage } from "@/components/school/site-image";
import { SiteFooter } from "@/components/school/site-footer";
import { useAppStore } from "@/lib/app-store";
import laboratorioTurmaImg from "@/assets/laboratorio-informatica-turma.jpg";
import bannerEscolaImg from "@/assets/image1.png";
import gcomprisColagemImg from "@/assets/image4.png";
import cartazAulasImg from "@/assets/image0.png";

export const Route = createFileRoute("/sobre")({
  component: SobrePage,
  head: () => ({
    meta: [
      { title: "Sobre a plataforma · Agenda de Informática" },
      {
        name: "description",
        content:
          "Conheça a Agenda de Informática: para que serve, como organiza as aulas de informática da Escola Municipal em Tempo Integral Dr. Eiraldo Carneiro de França, e quem está por trás do projeto.",
      },
      { property: "og:title", content: "Sobre a plataforma · Agenda de Informática" },
      {
        property: "og:description",
        content:
          "Para que serve a Agenda de Informática e como ela organiza as aulas de informática na escola.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
});

function SobrePage() {
  const { config } = useAppStore();

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_-10%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_55%),radial-gradient(circle_at_100%_15%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_50%)]"
          />
          <div className="mx-auto max-w-4xl px-4 py-10 text-center sm:px-6 lg:py-12">
            <Badge className="mb-3 gap-1.5 rounded-full border-blue-400/30 bg-blue-500/10 px-3 py-1.5 text-sm text-blue-700 shadow-sm backdrop-blur-md dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-200">
              <Sparkles className="size-4" /> Sobre a plataforma
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Agenda de Informática
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
              Uma plataforma criada para organizar, com transparência e justiça, as aulas de
              informática da {config.nomeEscola}.
            </p>
            <div className="mx-auto mt-6 max-w-3xl overflow-hidden rounded-2xl border border-border/60 shadow-xl">
              <SiteImage
                src={bannerEscolaImg}
                alt={`Turma da ${config.nomeEscola} no laboratório de informática, com a mensagem "Informática é porta para o futuro"`}
                width={1280}
                height={720}
                className="aspect-[16/9] max-h-64 w-full"
                loading="eager"
                decoding="async"
              />
            </div>
            <AvisoDireitosImagem className="mt-2" />
          </div>
        </section>

        {/* Para que serve */}
        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <div className="mb-5 text-center">
            <h2 className="text-2xl font-semibold text-foreground">Para que serve</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
              O laboratório de informática tem um número limitado de computadores e várias turmas
              para atender durante a semana. A Agenda de Informática resolve esse desafio de forma
              automática e justa.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400/40 hover:shadow-md">
              <CardHeader className="p-4 pb-1.5">
                <span className="mb-1.5 flex size-9 items-center justify-center rounded-full border border-blue-400/25 bg-blue-500/10 text-blue-600 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
                  <MonitorSmartphone className="size-4" />
                </span>
                <CardTitle className="text-base">Cronograma automático</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  Distribui todas as turmas nos horários disponíveis da semana, respeitando o
                  intervalo do almoço, o recreio e o número de computadores do laboratório.
                </p>
              </CardContent>
            </Card>
            <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-400/40 hover:shadow-md">
              <CardHeader className="p-4 pb-1.5">
                <span className="mb-1.5 flex size-9 items-center justify-center rounded-full border border-violet-400/25 bg-violet-500/10 text-violet-600 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300">
                  <RefreshCcw className="size-4" />
                </span>
                <CardTitle className="text-base">Revezamento justo</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  Divide cada turma em grupos e faz o rodízio entre eles semana a semana,
                  priorizando quem está há mais tempo sem participar — sem repetir e sem deixar
                  ninguém de fora.
                </p>
              </CardContent>
            </Card>
            <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400/40 hover:shadow-md">
              <CardHeader className="p-4 pb-1.5">
                <span className="mb-1.5 flex size-9 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                  <ShieldCheck className="size-4" />
                </span>
                <CardTitle className="text-base">Transparência pública</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  Qualquer pessoa — pais, professores(as) regentes e a coordenação — pode consultar
                  a agenda e ver exatamente qual turma tem aula, em qual data e horário.
                </p>
              </CardContent>
            </Card>
            <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400/40 hover:shadow-md">
              <CardHeader className="p-4 pb-1.5">
                <span className="mb-1.5 flex size-9 items-center justify-center rounded-full border border-amber-400/25 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
                  <GraduationCap className="size-4" />
                </span>
                <CardTitle className="text-base">Frequência e reprogramação</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  Registra presenças e faltas de cada aula e permite reprogramar automaticamente uma
                  sessão perdida, sem bagunçar o rodízio das semanas seguintes.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Foto real do laboratório */}
        <section className="mx-auto max-w-4xl px-4 pb-4 sm:px-6">
          <div className="overflow-hidden rounded-2xl border border-border/60 shadow-lg">
            <SiteImage
              src={laboratorioTurmaImg}
              alt="Alunos usando os computadores do laboratório de informática durante a aula"
              legenda={`O laboratório de informática da ${config.nomeEscola} em plena aula.`}
              width={1672}
              height={941}
              className="aspect-video w-full"
              loading="lazy"
              decoding="async"
            />
          </div>
          <AvisoDireitosImagem className="mt-2" />
        </section>

        {/* GCompris */}
        <section className="border-t border-border/60 bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
              <div>
                <Badge className="mb-3 gap-1.5 rounded-full border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-sm text-violet-700 shadow-sm backdrop-blur-md dark:border-violet-400/25 dark:bg-violet-400/10 dark:text-violet-200">
                  <BookOpen className="size-4" /> Ferramenta pedagógica
                </Badge>
                <h2 className="text-xl font-semibold text-foreground">
                  As aulas de informática usam o GCompris
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Nas aulas de informática da escola, os alunos utilizam o{" "}
                  <strong className="text-foreground">GCompris</strong>, um pacote educacional livre
                  e gratuito com dezenas de atividades — matemática, leitura, ciências, lógica, arte
                  e muito mais — voltado para crianças a partir dos 2 anos. É uma ferramenta
                  consolidada, usada em escolas de vários países, que ajuda a transformar o tempo no
                  laboratório em aprendizado de verdade, de um jeito lúdico e acessível.
                </p>
                <Button asChild variant="outline" className="mt-4 gap-1.5">
                  <a
                    href="https://www.gcompris.net/index-pt_BR.html"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Conhecer o GCompris <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              </div>
              <div>
                <div className="overflow-hidden rounded-2xl border border-border/60 shadow-lg">
                  <SiteImage
                    src={gcomprisColagemImg}
                    alt="Alunos usando atividades do GCompris no laboratório: teclado infantil, editor de texto e jogos educativos"
                    width={1280}
                    height={720}
                    className="aspect-[16/9] w-full"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <AvisoDireitosImagem className="mt-2" />
              </div>
            </div>
          </div>
        </section>

        {/* Infoteca */}
        <section className="border-t border-border/60 bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
            <div className="mb-4 text-center">
              <Badge className="mb-3 gap-1.5 rounded-full border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-700 shadow-sm backdrop-blur-md dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300">
                <Puzzle className="size-4" /> Novidade
              </Badge>
              <h2 className="text-2xl font-semibold text-foreground">Conheça a Infoteca</h2>
            </div>
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Além da agenda das aulas, o site tem um espaço próprio chamado{" "}
                  <strong className="text-foreground">Infoteca</strong>: uma seleção de jogos e
                  ferramentas educativas gratuitas, organizadas por área (alfabetização, matemática,
                  digitação, raciocínio lógico e mais), pensada para alunos, professores, pais e
                  também para alunos com necessidades especiais.
                </p>
                <Button asChild className="mt-4 gap-1.5">
                  <Link to="/infoteca">
                    <Puzzle className="size-4" /> Explorar a Infoteca
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Professor */}
        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <div className="mb-4 text-center">
            <Badge className="mb-3 gap-1.5 rounded-full border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-sm text-cyan-700 shadow-sm backdrop-blur-md dark:border-cyan-400/25 dark:bg-cyan-400/10 dark:text-cyan-200">
              <UserRound className="size-4" /> Quem leciona
            </Badge>
            <h2 className="text-2xl font-semibold text-foreground">
              Professor {config.professorInformatica}
            </h2>
          </div>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                O professor <strong className="text-foreground">Franc D&apos;nis</strong> faz parte
                do quadro efetivo da {config.nomeEscola} desde{" "}
                <strong className="text-foreground">2018</strong>, atuando nas aulas de informática.
                É formado em <strong className="text-foreground">Pedagogia</strong> e pós-graduado
                pela faculdade <strong className="text-foreground">ProMinas</strong> em{" "}
                <strong className="text-foreground">
                  Informática e suas Tecnologias na Educação
                </strong>
                . Essa formação une o olhar pedagógico ao uso prático da tecnologia em sala de aula
                — e foi o que motivou a criação desta própria plataforma, pensada para tornar a
                rotina do laboratório de informática mais organizada, justa e transparente para toda
                a comunidade escolar.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Cartaz oficial */}
        <section className="mx-auto max-w-4xl px-4 pb-8 sm:px-6">
          <div className="mx-auto max-w-sm">
            <div className="group overflow-hidden rounded-2xl border border-border/60 shadow-md transition-shadow hover:shadow-lg">
              <SiteImage
                src={cartazAulasImg}
                alt={`Cartaz oficial das aulas de informática da ${config.nomeEscola}, com o professor ${config.professorInformatica}`}
                legenda={`Cartaz oficial das aulas de informática da ${config.nomeEscola}, com o professor ${config.professorInformatica}.`}
                width={1280}
                height={720}
                className="aspect-[16/9] w-full transition-transform duration-300 group-hover:scale-[1.02]"
                loading="lazy"
                decoding="async"
              />
            </div>
            <AvisoDireitosImagem className="mt-2" />
          </div>
        </section>

        {/* Contato */}
        <section className="border-t border-border/60 bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 py-8 text-center sm:px-6">
            <Badge className="mb-3 gap-1.5 rounded-full border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-700 shadow-sm backdrop-blur-md dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-300">
              <Mail className="size-4" /> Contato
            </Badge>
            <h2 className="text-2xl font-semibold text-foreground">Fale conosco</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Dúvidas, sugestões ou relatos sobre a plataforma podem ser enviados diretamente por
              e-mail.
            </p>
            <Button asChild className="mt-5 gap-1.5">
              <a href="mailto:aplicativosfj@gmail.com">
                <Mail className="size-4" /> aplicativosfj@gmail.com
              </a>
            </Button>
          </div>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
