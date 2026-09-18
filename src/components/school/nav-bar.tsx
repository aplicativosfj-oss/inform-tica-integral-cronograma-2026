import { Link } from "@tanstack/react-router";
import { LayoutDashboard, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HeaderRadioPlayer } from "@/components/school/header-radio-player";
import { ThemeToggle } from "@/components/school/theme-toggle";
import { useAuth } from "@/lib/auth-store";
import logoIcon from "@/assets/logo-icon.png";

export function NavBar() {
  const { isAuthenticated, isReady, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-gradient-to-r from-slate-950/90 via-blue-950/90 to-slate-950/90 text-white shadow-lg shadow-black/10 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src={logoIcon}
            alt="Agenda de Informática .Online"
            className="size-10 shrink-0 rounded-lg bg-white object-contain p-1 shadow-sm ring-1 ring-white/20"
          />
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-white">Agenda de Informática</span>
            <span className="hidden text-[11px] text-white/60 sm:block">
              Escola Dr. Eiraldo Carneiro
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden text-white/80 hover:bg-white/10 hover:text-white sm:inline-flex"
          >
            <Link to="/">Início</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Link to="/agenda">Agenda</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden text-white/80 hover:bg-white/10 hover:text-white sm:inline-flex"
          >
            <Link to="/coordenacao">Coordenação</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden text-white/80 hover:bg-white/10 hover:text-white sm:inline-flex"
          >
            <Link to="/sobre">Sobre</Link>
          </Button>
          <HeaderRadioPlayer />
          <ThemeToggle />
          {isReady && isAuthenticated ? (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-white/80 hover:bg-white/10 hover:text-white"
              >
                <Link to="/dashboard">
                  <LayoutDashboard />
                  Painel
                </Link>
              </Button>
              <Button
                size="sm"
                onClick={logout}
                className="border border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <LogOut />
                Sair
              </Button>
            </>
          ) : (
            <Button
              asChild
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link to="/login">Entrar</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
