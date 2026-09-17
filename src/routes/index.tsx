import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  CalendarClock,
  Gamepad2,
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
import heroImg from "@/assets/hero-lab-photo.jpg";
import scheduleImg from "@/assets/feature-classroom-tech.jpg";
import networkImg from "@/assets/feature-tools.jpg";
import workspaceImg from "@/assets/feature-kids-learning.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      {
        title: "Agenda de Informática · Dr. Eiraldo Carneiro de França",
      },
      {
        name: "description",
        content:
          "Agenda profissional das aulas de informática: cronograma automático, revezamento por grupos e cronômetro ao vivo.",
      },
      { property: "og:title", content: "Agenda de Informática · Dr. Eiraldo Carneiro de França" },
      {
        property: "og:description",
        content:
          "Agenda profissional das aulas de informática: cronograma automático, revezamento por grupos e cronômetro ao vivo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Index() {
  const { turmas, config } = useAppStore();
  const totalAlunos = turmas.reduce((sum, t) => sum + t.alunos.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <section className="relative overflow-hidden border-b border-border/60">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_-10%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_55%),radial-gradient(circle_at_100%_10%,color-mix(in_oklch,var(--primary)_10%,transparent),transparent_50%)]"
        />
        {/* Yellow accent stripe, echoing the school's brand colors from the printed materials. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 -z-10 size-56 rotate-45 bg-amber-400/25"
        />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <Badge variant="secondary" className="mb-4 gap-1.5">
              <MonitorSmartphone className="size-3.5" /> Agenda online
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Informática na <span className="text-primary">Escola</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Agende seus horários de forma rápida, simples e prática! Cronograma automático por
              turma, revezamento entre alunos nos {config.numeroComputadores} computadores e
              cronômetro ao vivo, com o professor {config.professorInformatica}.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/agenda">
                  <CalendarClock /> Acessar Agenda Online
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/dashboard">
                  <LayoutDashboard /> Painel de gestão
                </Link>
              </Button>
            </div>

            <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-border/60 pt-6">
              <div>
                <dt className="text-xs text-muted-foreground">Turmas</dt>
                <dd className="text-2xl font-semibold text-foreground">{turmas.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Alunos cadastrados</dt>
                <dd className="text-2xl font-semibold text-foreground">{totalAlunos}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Computadores</dt>
                <dd className="text-2xl font-semibold text-foreground">
                  {config.numeroComputadores}
                </dd>
              </div>
            </dl>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-primary/5 blur-2xl" aria-hidden />
            <img
              src={heroImg}
              alt="Alunos usando os computadores do laboratório de informática da escola"
              width={1600}
              height={900}
              className="relative rounded-2xl border border-border/60 bg-card shadow-2xl"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <LiveSessionPanel />
      </section>

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

        <div className="grid gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={<Gamepad2 className="size-5" />}
            iconClassName="bg-blue-500/10 text-blue-600"
            title="Aprendizado Digital"
            description="Tecnologia que estimula o raciocínio e a criatividade."
          />
          <FeatureCard
            icon={<Users2 className="size-5" />}
            iconClassName="bg-emerald-500/10 text-emerald-600"
            title="Mais Oportunidades"
            description="A informática amplia horizontes e prepara para o futuro."
          />
          <FeatureCard
            icon={<CalendarClock className="size-5" />}
            iconClassName="bg-violet-500/10 text-violet-600"
            title="Agende seu Horário"
            description="Escolha o melhor dia e horário para utilizar o laboratório."
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
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

      <section className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-2xl font-semibold text-foreground">
              Tecnologia a serviço da rotina escolar
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Uma experiência visual clara e moderna para organizar horários, acompanhar o tempo e
              conectar alunos ao laboratório de informática.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <VisualCard
              image={scheduleImg}
              title="Organização semanal"
              description="Visualize de imediato quais turmas usam o laboratório em cada dia e horário."
            />
            <VisualCard
              image={networkImg}
              title="Conexão e colaboração"
              description="Cada aluno tem seu momento no computador, de forma justa e previsível."
            />
            <VisualCard
              image={workspaceImg}
              title="Ambiente preparado"
              description="A agenda ajuda o professor a chegar com tudo planejado para a aula de informática."
            />
          </div>
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

function FeatureCard({
  icon,
  iconClassName,
  title,
  description,
}: {
  icon: ReactNode;
  iconClassName?: string;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <span
          className={`mb-2 flex size-10 items-center justify-center rounded-lg ${iconClassName ?? "bg-primary/10 text-primary"}`}
        >
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

function VisualCard({
  image,
  title,
  description,
}: {
  image: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="aspect-[16/10] overflow-hidden">
        <img
          src={image}
          alt={title}
          width={1344}
          height={768}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="p-5">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
