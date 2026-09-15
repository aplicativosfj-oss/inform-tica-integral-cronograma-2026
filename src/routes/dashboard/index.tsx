import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, Monitor, Settings2, Users2 } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/school/dashboard-shell";
import { LiveSessionPanel } from "@/components/school/live-session-panel";
import { useAppStore } from "@/lib/app-store";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { turmas, config } = useAppStore();
  const { email } = useAuth();
  const totalAlunos = turmas.reduce((sum, t) => sum + t.alunos.length, 0);
  const turmasSemAlunos = turmas.filter((t) => t.alunos.length === 0).length;

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">Visão geral</h1>
        <p className="text-sm text-muted-foreground">
          Bem-vindo(a), {email}. Gerencie turmas, alunos e horários da sala de informática.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Users2 className="size-4" />} label="Turmas" value={turmas.length} />
        <StatCard
          icon={<Monitor className="size-4" />}
          label="Alunos cadastrados"
          value={totalAlunos}
        />
        <StatCard
          icon={<CalendarClock className="size-4" />}
          label="Turmas sem alunos"
          value={turmasSemAlunos}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <LiveSessionPanel />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Atalhos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild variant="outline" className="justify-start">
              <Link to="/dashboard/turmas">
                <Users2 /> Cadastrar turmas e alunos
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/dashboard/configuracoes">
                <Settings2 /> Ajustar horários e nº de computadores
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/agenda">
                <CalendarClock /> Ver agenda pública
              </Link>
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Regra atual: grupos de {config.numeroComputadores} alunos, revezando a cada{" "}
              {config.duracaoGrupoMinutos} min dentro de janelas de {config.duracaoSlotMinutos} min
              por turma.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
