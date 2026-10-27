import { createFileRoute, Link } from "@tanstack/react-router";
import {
  GraduationCap,
  MonitorSmartphone,
  LayoutDashboard,
  Settings2,
  UserX,
  Users2,
} from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/school/dashboard-shell";
import { PainelLaboratorioAgora } from "@/components/school/laboratorio/painel-agora";
import { SiteImage } from "@/components/school/site-image";
import { useAppStore } from "@/lib/app-store";
import { useAuth } from "@/lib/auth-store";
import { useSessoesLab } from "@/lib/laboratorio";
import dashboardHeroImg from "@/assets/laboratorio-informatica-turma.jpg";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
  head: () => ({
    meta: [
      { title: "Painel de gestão · Agenda de Informática" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function DashboardHome() {
  const { turmas } = useAppStore();
  const lab = useSessoesLab();
  const { email } = useAuth();
  const totalAlunos = turmas.reduce((sum, t) => sum + t.alunos.length, 0);
  const turmasSemAlunos = turmas.filter((t) => t.alunos.length === 0).length;

  return (
    <DashboardShell>
      <div className="mb-6 overflow-hidden rounded-2xl border border-border/60 shadow-sm">
        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_-10%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_55%)] bg-card"
          />
          <div>
            <Badge variant="secondary" className="mb-2 gap-1.5">
              <LayoutDashboard className="size-3.5" /> Painel de gestão
            </Badge>
            <h1 className="text-2xl font-semibold text-foreground">Visão geral</h1>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Bem-vindo(a), {email}. Gerencie turmas e alunos e marque quem vai ao laboratório de
              informática.
            </p>
          </div>
          <SiteImage
            src={dashboardHeroImg}
            alt="Laboratório de informática da escola, usado na gestão do painel"
            width={480}
            height={280}
            className="aspect-[16/9] w-full shrink-0 rounded-xl sm:w-64"
            loading="eager"
            decoding="async"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Users2 className="size-4" />} label="Turmas" value={turmas.length} />
        <StatCard
          icon={<GraduationCap className="size-4" />}
          label="Alunos cadastrados"
          value={totalAlunos}
        />
        <StatCard
          icon={<UserX className="size-4" />}
          label="Turmas sem alunos"
          value={turmasSemAlunos}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <PainelLaboratorioAgora dados={lab} logado />

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
            <Button asChild className="justify-start">
              <Link to="/dashboard/laboratorio">
                <MonitorSmartphone /> Marcar alunos no laboratório
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/dashboard/configuracoes">
                <Settings2 /> Ajustar horários e nº de computadores
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/">
                <LayoutDashboard /> Ver a página inicial
              </Link>
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              O controle por laboratório substituiu a programação automática. Os dados antigos
              continuam guardados.
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
