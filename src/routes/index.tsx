import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  CalendarClock,
  GraduationCap,
  LayoutDashboard,
  MonitorSmartphone,
  ShieldCheck,
  Timer,
  Users2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveSessionPanel } from "@/components/school/live-session-panel";
import { NavBar } from "@/components/school/nav-bar";
import { useAppStore } from "@/lib/app-store";
import alunoComputador from "@/assets/aluno-computador.jpg";
import laboratorioHero from "@/assets/laboratorio-hero.jpg";
import professorLaboratorio from "@/assets/professor-laboratorio.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agenda Educativa | Aulas de Informática" },
      {
        name: "description",
        content:
          "Acompanhe a agenda das aulas de informática, horários das turmas e revezamento dos alunos no laboratório escolar.",
      },
      { property: "og:title", content: "Agenda Educativa | Aulas de Informática" },
      {
        property: "og:description",
        content: "Agenda semanal e organização das aulas no laboratório de informática.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { turmas, config } = useAppStore();
  const totalAlunos = turmas.reduce((sum, t) => sum + t.alunos.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <section className="relative min-h-[34rem] overflow-hidden border-b border-border/60 lg:min-h-[42rem]">
        <img
          src={laboratorioHero}
          alt="Professora orientando alunos no laboratório de informática"
          width={1920}
          height={1088}
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover object-[67%_center]"
        />
        <div aria-hidden className="absolute inset-0 bg-foreground/65" />
        <div className="relative mx-auto flex min-h-[34rem] max-w-6xl items-center px-4 py-14 sm:px-6 lg:min-h-[42rem] lg:py-20">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-5 gap-1.5 border-border/40 bg-background/90">
              <MonitorSmartphone className="size-3.5" /> Laboratório de Informática
            </Badge>
            <h1 className="max-w-2xl text-4xl font-bold text-primary-foreground sm:text-5xl lg:text-6xl">
              Tecnologia que organiza e transforma a aprendizagem
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-primary-foreground/85 sm:text-lg">
              Cronograma automático por turma, revezamento entre alunos nos{" "}
              {config.numeroComputadores} computadores e cronômetro ao vivo — para que professores,
              alunos e famílias saibam exatamente quando cada turma vai ao laboratório com o
              professor {config.professorInformatica}.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link to="/agenda">
                  <CalendarClock /> Ver agenda da semana
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-background/10 text-primary-foreground hover:bg-background/20 hover:text-primary-foreground">
                <Link to="/dashboard">
                  <LayoutDashboard /> Painel de gestão
                </Link>
              </Button>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-primary-foreground/25 pt-6">
              <div>
                <dt className="text-xs text-primary-foreground/70">Turmas</dt>
                <dd className="text-2xl font-semibold text-primary-foreground">{turmas.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-primary-foreground/70">Alunos cadastrados</dt>
                <dd className="text-2xl font-semibold text-primary-foreground">{totalAlunos}</dd>
              </div>
              <div>
                <dt className="text-xs text-primary-foreground/70">Computadores</dt>
                <dd className="text-2xl font-semibold text-primary-foreground">
                  {config.numeroComputadores}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <LiveSessionPanel />
        </div>
      </section>

      <EducationGallery
        alunoImage={alunoComputador}
        professorImage={professorLaboratorio}
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl font-semibold text-foreground">Como a agenda organiza tudo</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            O sistema aplica a mesma lógica de revezamento usada em sala: grupos de{" "}
            {config.numeroComputadores} alunos por vez, trocando automaticamente a cada{" "}
            {config.duracaoGrupoMinutos} minutos, dentro de janelas de {config.duracaoSlotMinutos}{" "}
            minutos por turma, de {config.horaInicio} às {config.horaFim}.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<CalendarClock className="size-5" />}
            title="Cronograma automático"
            description="Segunda a sexta, cada turma recebe horários fixos gerados automaticamente pelo sistema."
          />
          <FeatureCard
            icon={<Users2 className="size-5" />}
            title="Revezamento por grupos"
            description="Com poucos computadores, os alunos se revezam em grupos dentro do mesmo horário."
          />
          <FeatureCard
            icon={<Timer className="size-5" />}
            title="Cronômetro ao vivo"
            description="Um contador regressivo mostra em tempo real quanto falta para trocar de grupo."
          />
          <FeatureCard
            icon={<ShieldCheck className="size-5" />}
            title="Painel de gestão"
            description="Cadastre turmas, professores, fotos e alunos com acesso restrito por login."
          />
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
          <GraduationCap className="mx-auto size-8 text-primary" />
          <h2 className="mt-3 text-xl font-semibold text-foreground">{config.nomeEscola}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            INEP {config.inep} · {config.endereco}
          </p>
        </div>
      </section>
    </div>
  );
}

interface EducationGalleryProps {
  alunoImage: string;
  professorImage: string;
}

function EducationGallery({ alunoImage, professorImage }: EducationGalleryProps) {
  return (
    <section className="border-b border-border/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="max-w-lg">
          <Badge variant="secondary" className="mb-4">Aprendizagem digital</Badge>
          <h2 className="text-3xl font-semibold text-foreground">Cada aluno participa. Cada minuto conta.</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            A agenda aproxima a comunidade escolar da rotina do laboratório e ajuda a garantir um
            uso organizado, inclusivo e produtivo dos computadores.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <img
            src={alunoImage}
            alt="Aluna realizando atividade educativa no computador"
            width={1200}
            height={912}
            loading="lazy"
            className="aspect-[4/5] size-full rounded-md object-cover"
          />
          <img
            src={professorImage}
            alt="Professora acompanhando alunos em atividade digital"
            width={1200}
            height={912}
            loading="lazy"
            className="mt-8 aspect-[4/5] size-full rounded-md object-cover"
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
