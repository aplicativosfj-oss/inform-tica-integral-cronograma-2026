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

export const Route = createFileRoute("/")({
  component: Index,
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
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <Badge variant="secondary" className="mb-4 gap-1.5">
              <MonitorSmartphone className="size-3.5" /> Laboratório de Informática
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              A agenda profissional das aulas de informática
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Cronograma automático por turma, revezamento entre alunos nos{" "}
              {config.numeroComputadores} computadores e cronômetro ao vivo — para que professores,
              alunos e famílias saibam exatamente quando cada turma vai ao laboratório com o
              professor {config.professorInformatica}.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/agenda">
                  <CalendarClock /> Ver agenda da semana
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

          <LiveSessionPanel />
        </div>
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
