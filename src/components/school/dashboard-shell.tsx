import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarClock,
  CalendarPlus,
  CalendarSearch,
  ClipboardCheck,
  GraduationCap,
  KeyRound,
  Layers,
  LayoutDashboard,
  Settings2,
  UserX,
  Users2,
} from "lucide-react";
import type { ReactNode } from "react";

import { NavBar } from "@/components/school/nav-bar";
import { Protected } from "@/components/school/protected";
import { cn } from "@/lib/utils";
import dashboardBgImg from "@/assets/image8.png";

const NAV_GROUPS = [
  {
    label: null,
    items: [{ to: "/dashboard", label: "Visão geral", icon: LayoutDashboard }],
  },
  {
    label: "Cadastro",
    items: [
      { to: "/dashboard/turmas", label: "Turmas e alunos", icon: Users2 },
      { to: "/dashboard/grupos", label: "Turmas e grupos", icon: Layers },
      { to: "/dashboard/alunos", label: "Buscar aluno", icon: GraduationCap },
    ],
  },
  {
    label: "Rotina",
    items: [
      { to: "/dashboard/aulas", label: "Aulas", icon: CalendarPlus },
      { to: "/dashboard/programacao", label: "Programação", icon: CalendarClock },
      { to: "/dashboard/frequencia", label: "Frequência", icon: CalendarSearch },
      { to: "/dashboard/faltas", label: "Faltas do mês", icon: UserX },
      { to: "/dashboard/atividades", label: "Área do Aluno", icon: ClipboardCheck },
    ],
  },
  {
    label: "Sistema",
    items: [
      { to: "/dashboard/acessos", label: "Senhas de acesso", icon: KeyRound },
      { to: "/dashboard/configuracoes", label: "Configurações", icon: Settings2 },
    ],
  },
] as const;

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative min-h-screen bg-background">
      {/* Mesma ambientação de tecnologia do login: dá identidade visual ao
          painel inteiro, discreta o bastante pra nunca competir com os
          dados e formulários por cima. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center opacity-[0.04] dark:opacity-[0.22]"
        style={{ backgroundImage: `url(${dashboardBgImg})` }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-background/85 via-background/95 to-background dark:from-background/35 dark:via-background/65 dark:to-background"
      />
      <div className="relative z-10">
        <NavBar />
        <Protected>
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row">
            <aside className="lg:w-56 lg:shrink-0">
              <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-4 lg:overflow-visible">
                {NAV_GROUPS.map((group, groupIndex) => (
                  <div key={group.label ?? groupIndex} className="flex gap-1 lg:flex-col lg:gap-1">
                    {group.label ? (
                      <p className="hidden px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70 lg:block">
                        {group.label}
                      </p>
                    ) : null}
                    {group.items.map((item) => {
                      const active =
                        item.to === "/dashboard"
                          ? pathname === item.to
                          : pathname.startsWith(item.to);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={cn(
                            "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          <Icon className="size-4" /> {item.label}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </aside>
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </Protected>
      </div>
    </div>
  );
}
