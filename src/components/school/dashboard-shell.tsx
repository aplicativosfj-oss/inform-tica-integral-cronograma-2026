import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarClock,
  CalendarSearch,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Settings2,
  Users2,
} from "lucide-react";
import type { ReactNode } from "react";

import { NavBar } from "@/components/school/nav-bar";
import { Protected } from "@/components/school/protected";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { to: "/dashboard/turmas", label: "Turmas e alunos", icon: Users2 },
  { to: "/dashboard/grupos", label: "Turmas e grupos", icon: Layers },
  { to: "/dashboard/alunos", label: "Alunos", icon: GraduationCap },
  { to: "/dashboard/programacao", label: "Programação", icon: CalendarClock },
  { to: "/dashboard/frequencia", label: "Frequência", icon: CalendarSearch },
  { to: "/dashboard/configuracoes", label: "Configurações", icon: Settings2 },
] as const;

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <Protected>
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row">
          <aside className="lg:w-56 lg:shrink-0">
            <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
              {NAV_ITEMS.map((item) => {
                const active =
                  item.to === "/dashboard" ? pathname === item.to : pathname.startsWith(item.to);
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
            </nav>
          </aside>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </Protected>
    </div>
  );
}
