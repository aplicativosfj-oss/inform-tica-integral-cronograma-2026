import { Link, useLocation } from "@tanstack/react-router";
import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Home,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  type LucideIcon,
} from "lucide-react";
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
import { ShareButton } from "@/components/school/share-button";
import { ThemeToggle } from "@/components/school/theme-toggle";
import { useAuth } from "@/lib/auth-store";
import logoIcon from "@/assets/logo-icon.png";

function NavLink({ to, label }: { to: string; label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to === "/" && location.pathname === "");

  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className={`relative hidden transition-all duration-300 sm:inline-flex ${
        isActive
          ? "text-slate-900 bg-blue-400/40 font-semibold dark:text-white dark:bg-cyan-400/30"
          : "text-slate-700 hover:text-white hover:bg-blue-500 hover:shadow-md hover:scale-105 dark:text-white/80 dark:hover:text-slate-900 dark:hover:bg-cyan-300 dark:hover:shadow-lg dark:hover:scale-105"
      }`}
    >
      <Link to={to}>
        {label}
        {isActive && (
          <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/50 dark:from-blue-400 dark:to-cyan-400 dark:shadow-blue-400/50" />
        )}
      </Link>
    </Button>
  );
}

const LINKS = [
  { to: "/", label: "Início" },
  { to: "/agenda", label: "Agenda" },
  { to: "/coordenacao", label: "Coordenação" },
  { to: "/sobre", label: "Sobre" },
] as const;

const LINK_ICONS: Record<string, LucideIcon> = {
  "/": Home,
  "/agenda": CalendarDays,
  "/coordenacao": ClipboardList,
  "/sobre": Info,
};

export function NavBar() {
  const { isAuthenticated, isReady, logout } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/30 bg-slate-50/85 text-slate-900 shadow-md shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-background/75 dark:text-white dark:shadow-black/20">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-1.5 px-3 sm:h-14 sm:gap-2 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <img
            src={logoIcon}
            alt="Agenda de Informática .Online"
            className="size-9 shrink-0 rounded-lg bg-slate-100 object-contain p-1 shadow-sm ring-1 ring-slate-200 dark:bg-white dark:ring-white/20"
          />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              Agenda de Informática
            </span>
            {/* O nome da escola acompanha a marca em toda tela. No celular o
                espaço é disputado com o player e o menu, então entra a forma
                abreviada — cabe inteira, em vez de truncar no meio. */}
            <span className="truncate text-xs text-slate-600 dark:text-white/70">
              <span className="sm:hidden">E.M. Dr. Eiraldo Carneiro</span>
              <span className="hidden sm:inline">Escola Dr. Eiraldo Carneiro</span>
            </span>
          </span>
        </Link>

        <nav className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <NavLink to="/" label="Início" />
          <NavLink to="/agenda" label="Agenda" />
          <NavLink to="/coordenacao" label="Coordenação" />
          <NavLink to="/sobre" label="Sobre" />
          <HeaderRadioPlayer />
          <ShareButton />
          <ThemeToggle />
          {isReady && isAuthenticated ? (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="relative hidden text-slate-700 transition-all duration-300 hover:text-slate-900 hover:bg-slate-100/50 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10 sm:inline-flex"
              >
                <Link to="/dashboard">
                  <LayoutDashboard />
                  Painel
                </Link>
              </Button>
              <Button
                size="sm"
                onClick={logout}
                className="hidden border border-slate-300/50 bg-slate-100/60 text-slate-900 hover:bg-slate-200/60 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 sm:inline-flex"
              >
                <LogOut />
                Sair
              </Button>
            </>
          ) : (
            <Button
              asChild
              size="sm"
              className="hidden bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg sm:inline-flex"
            >
              <Link to="/login">Entrar</Link>
            </Button>
          )}

          <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Abrir menu"
                className="size-10 text-slate-700 hover:bg-slate-100/50 hover:text-slate-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white sm:hidden [&_svg]:size-[22px]"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-[19rem] flex-col gap-0 border-l border-border/60 bg-background/95 p-0 backdrop-blur-xl"
            >
              {/* Cabeçalho do menu: marca da escola, para o painel lateral ter
                  a mesma identidade do topo do site. */}
              <SheetHeader className="space-y-0 border-b border-border/60 bg-gradient-to-br from-primary/10 to-transparent px-5 py-4 text-left">
                <div className="flex items-center gap-3">
                  <img
                    src={logoIcon}
                    alt=""
                    aria-hidden
                    className="size-10 shrink-0 rounded-xl bg-card object-contain p-1 shadow-sm ring-1 ring-border"
                  />
                  <div className="min-w-0">
                    <SheetTitle className="truncate text-sm font-semibold">
                      Agenda de Informática
                    </SheetTitle>
                    <p className="truncate text-xs text-muted-foreground">
                      E.M. Dr. Eiraldo Carneiro
                    </p>
                  </div>
                </div>
              </SheetHeader>

              <nav className="flex-1 overflow-y-auto px-3 py-4">
                <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Navegação
                </p>
                <div className="flex flex-col gap-1">
                  {LINKS.map((link) => {
                    const isActive =
                      location.pathname === link.to ||
                      (link.to === "/" && location.pathname === "");
                    const Icone = LINK_ICONS[link.to] ?? Home;
                    return (
                      <SheetClose key={link.to} asChild>
                        <Link
                          to={link.to}
                          className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-primary/12 text-primary font-semibold ring-1 ring-primary/25"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          <span
                            className={`flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground group-hover:text-foreground"
                            }`}
                          >
                            <Icone className="size-4" />
                          </span>
                          <span className="flex-1">{link.label}</span>
                          <ChevronRight
                            className={`size-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/60"}`}
                          />
                        </Link>
                      </SheetClose>
                    );
                  })}
                </div>
              </nav>

              <div className="border-t border-border/60 p-3">
                {isReady && isAuthenticated ? (
                  <div className="flex flex-col gap-2">
                    <SheetClose asChild>
                      <Link
                        to="/dashboard"
                        className="flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
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
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="size-4" /> Sair
                    </button>
                  </div>
                ) : (
                  <SheetClose asChild>
                    <Link
                      to="/login"
                      className="flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
                    >
                      <LogIn className="size-4" /> Entrar
                    </Link>
                  </SheetClose>
                )}
                <p className="pt-3 text-center text-[11px] text-muted-foreground">
                  Prof. Franc D'nis · Informática
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </header>
  );
}
