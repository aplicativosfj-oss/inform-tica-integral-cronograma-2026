import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  Code2,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
  MonitorSmartphone,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NavBar } from "@/components/school/nav-bar";
import { SiteFooter } from "@/components/school/site-footer";
import { useAppStore } from "@/lib/app-store";
import heroImg from "@/assets/hero-lab-photo.jpg";

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
    <div className="min-h-screen bg-background">
      <NavBar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImg})` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-background via-background/95 to-primary/10"
        />
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 lg:py-20">
          <Badge variant="secondary" className="mb-4 gap-1.5">
            <Sparkles className="size-3.5" /> Sobre a plataforma
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Agenda de Informática
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
            Uma plataforma criada para organizar, com transparência e justiça, as aulas de
            informática da {config.nomeEscola}.
          </p>
        </div>
      </section>

      {/* Para que serve */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-foreground">Para que serve</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
            O laboratório de informática tem um número limitado de computadores e várias turmas
            para atender durante a semana. A Agenda de Informática resolve esse desafio de forma
            automática e justa.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MonitorSmartphone className="size-5" />
              </span>
              <CardTitle className="text-base">Cronograma automático</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Distribui todas as turmas nos horários disponíveis da semana, respeitando o
                intervalo do almoço, o recreio e o número de computadores do laboratório.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <RefreshCcw className="size-5" />
              </span>
              <CardTitle className="text-base">Revezamento justo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Divide cada turma em grupos e faz o rodízio entre eles semana a semana, priorizando
                quem está há mais tempo sem participar — sem repetir e sem deixar ninguém de fora.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </span>
              <CardTitle className="text-base">Transparência pública</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Qualquer pessoa — pais, professores(as) regentes e a coordenação — pode consultar a
                agenda e ver exatamente qual turma tem aula, em qual data e horário.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <GraduationCap className="size-5" />
              </span>
              <CardTitle className="text-base">Frequência e reprogramação</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Registra presenças e faltas de cada aula e permite reprogramar automaticamente uma
                sessão perdida, sem bagunçar o rodízio das semanas seguintes.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* GCompris */}
      <section className="border-t border-border/60 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <Badge variant="secondary" className="mb-3 gap-1.5">
                <BookOpen className="size-3.5" /> Ferramenta pedagógica
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
                <a href="https://www.gcompris.net/index-pt_BR.html" target="_blank" rel="noreferrer">
                  Conhecer o GCompris <ExternalLink className="size-3.5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Professor */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="mb-6 text-center">
          <Badge variant="secondary" className="mb-3 gap-1.5">
            <UserRound className="size-3.5" /> Quem leciona
          </Badge>
          <h2 className="text-2xl font-semibold text-foreground">
            Professor {config.professorInformatica}
          </h2>
        </div>
        <Card>
          <CardContent className="py-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              O professor <strong className="text-foreground">Franc D&apos;nis</strong> faz parte
              do quadro efetivo da {config.nomeEscola} desde <strong className="text-foreground">2018</strong>,
              atuando nas aulas de informática. É formado em{" "}
              <strong className="text-foreground">Pedagogia</strong> e pós-graduado pela faculdade{" "}
              <strong className="text-foreground">ProMinas</strong> em{" "}
              <strong className="text-foreground">
                Informática e suas Tecnologias na Educação
              </strong>
              . Essa formação une o olhar pedagógico ao uso prático da tecnologia em sala de aula —
              e foi o que motivou a criação desta própria plataforma, pensada para tornar a rotina
              do laboratório de informática mais organizada, justa e transparente para toda a
              comunidade escolar.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Contato */}
      <section className="border-t border-border/60 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6">
          <Badge variant="secondary" className="mb-3 gap-1.5">
            <Mail className="size-3.5" /> Contato
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
          <p className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Code2 className="size-4 text-primary" />
            Desenvolvido por <span className="font-medium text-foreground">Franc D&apos;nis</span>
          </p>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5" /> Feijó, Acre · {new Date().getFullYear()}
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
