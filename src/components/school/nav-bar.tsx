import { Link } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, MonitorSmartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-store";

export function NavBar() {
  const { isAuthenticated, isReady, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MonitorSmartphone className="size-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-foreground">Agenda de Informática</span>
            <span className="hidden text-[11px] text-muted-foreground sm:block">
              Escola Dr. Eiraldo Carneiro
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/">Início</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/agenda">Agenda</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/coordenacao">Coordenação</Link>
          </Button>
          {isReady && isAuthenticated ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard">
                  <LayoutDashboard />
                  Painel
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut />
                Sair
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/login">Entrar</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
