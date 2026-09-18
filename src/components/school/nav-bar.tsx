import { Link } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { HeaderRadioPlayer } from "@/components/school/header-radio-player";
import { ThemeToggle } from "@/components/school/theme-toggle";
import { useAuth } from "@/lib/auth-store";
import logoIcon from "@/assets/logo-icon.png";

const LINKS = [
  { to: "/", label: "Início" },
  { to: "/agenda", label: "Agenda" },
  { to: "/coordenacao", label: "Coordenação" },
  { to: "/sobre", label: "Sobre" },
] as const;

export function NavBar() {
  const { isAuthenticated, isReady, logout } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-gradient-to-r from-slate-950/90 via-blue-950/90 to-slate-950/90 text-white shadow-lg shadow-black/10 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <img
            src={logoIcon}
            alt="Agenda de Informática .Online"
            className="size-9 shrink-0 rounded-lg bg-white object-contain p-1 shadow-sm ring-1 ring-white/20"
          />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold text-white">Agenda de Informática</span>
            <span className="hidden text-[11px] text-white/60 sm:block">
              Escola Dr. Eiraldo Carneiro
            </span>
          </span>
        </Link>

        <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
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
            className="hidden text-white/80 hover:bg-white/10 hover:text-white sm:inline-flex"
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
                className="hidden text-white/80 hover:bg-white/10 hover:text-white sm:inline-flex"
              >
                <Link to="/dashboard">
                  <LayoutDashboard />
                  Painel
                </Link>
              </Button>
              <Button
                size="sm"
                onClick={logout}
                className="hidden border border-white/20 bg-white/10 text-white hover:bg-white/20 sm:inline-flex"
              >
                <LogOut />
                Sair
              </Button>
            </>
          ) : (
            <Button
              asChild
              size="sm"
              className="hidden bg-primary text-primary-foreground hover:bg-primary/90 sm:inline-flex"
            >
              <Link to="/login">Entrar</Link>
            </Button>
          )}

          <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Abrir menu"
                className="text-white/80 hover:bg-white/10 hover:text-white sm:hidden"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-4 flex flex-col gap-1">
                {LINKS.map((link) => (
                  <SheetClose key={link.to} asChild>
                    <Link
                      to={link.to}
                      className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                <div className="my-2 border-t border-border/60" />
                {isReady && isAuthenticated ? (
                  <>
                    <SheetClose asChild>
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                      >
                        <LayoutDashboard className="size-4" /> Painel
                      </Link>
                    </SheetClose>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuAberto(false);
                        logout();
                      }}
                      className="flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-muted"
                    >
                      <LogOut className="size-4" /> Sair
                    </button>
                  </>
                ) : (
                  <SheetClose asChild>
                    <Link
                      to="/login"
                      className="rounded-md px-3 py-2.5 text-sm font-medium text-primary hover:bg-muted"
                    >
                      Entrar
                    </Link>
                  </SheetClose>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </header>
  );
}
