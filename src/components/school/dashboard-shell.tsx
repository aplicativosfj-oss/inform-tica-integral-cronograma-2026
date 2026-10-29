import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  MonitorSmartphone,
  ShieldCheck,
  Users2,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { NavBar } from "@/components/school/nav-bar";
import { Protected } from "@/components/school/protected";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-store";
import { GRUPOS_VISIVEIS, estaAtivo } from "@/lib/painel-secoes";
import { cn } from "@/lib/utils";
import dashboardBgImg from "@/assets/image8.png";

/** Abas fixas do celular: as seções mais usadas no dia a dia. */
const ABAS: { to: string; label: string; Icone: LucideIcon }[] = [
  { to: "/dashboard", label: "Início", Icone: LayoutDashboard },
  { to: "/dashboard/laboratorio", label: "Laboratório", Icone: MonitorSmartphone },
  { to: "/dashboard/turmas", label: "Turmas", Icone: Users2 },
  { to: "/dashboard/frequencia", label: "Frequência", Icone: CalendarCheck },
];

function iniciais(email: string) {
  return email.slice(0, 2).toUpperCase();
}

/** Cartão da conta conectada, com o botão de sair à mão. */
function Conta({ email, onSair }: { email: string; onSair: () => void }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] p-2.5">
      <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-xs font-bold text-white">
        {iniciais(email)}
        <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card bg-emerald-400" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-400">
          <ShieldCheck className="size-3" aria-hidden /> Administração
        </p>
        <p className="truncate text-xs font-medium text-foreground" title={email}>
          {email}
        </p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        aria-label="Sair"
        title="Sair"
        onClick={onSair}
        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
      >
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}

/** Lista de seções do painel, agrupada; usada na lateral e no menu do celular. */
function NavPainel({ pathname, aoEscolher }: { pathname: string; aoEscolher?: () => void }) {
  return (
    <nav aria-label="Seções do painel" className="flex flex-col gap-4">
      {GRUPOS_VISIVEIS.map((grupo, gi) => (
        <div key={grupo.label ?? gi} className="flex flex-col gap-0.5">
          {grupo.label ? (
            <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
              {grupo.label}
            </p>
          ) : null}
          {grupo.items.map((item) => {
            const ativo = estaAtivo(pathname, item.to);
            const Icone = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={aoEscolher}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                  ativo
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-primary transition-opacity",
                    ativo ? "opacity-100" : "opacity-0",
                  )}
                />
                <Icone
                  className={cn(
                    "size-4 shrink-0",
                    ativo ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { email, logout } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const atual =
    GRUPOS_VISIVEIS.flatMap((g) => g.items).find((i) => estaAtivo(pathname, i.to)) ??
    GRUPOS_VISIVEIS[0]!.items[0]!;
  const IconeAtual = atual.icon;
  const grupoAtual = GRUPOS_VISIVEIS.find((g) => g.items.includes(atual))?.label ?? null;

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
          <div className="mx-auto max-w-[90rem] px-3 py-3 sm:px-6 sm:py-5 lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:gap-8 lg:py-8">
            {/* Lateral fixa no computador. */}
            <aside className="hidden lg:block">
              <div className="sticky top-20 flex max-h-[calc(100vh-6rem)] flex-col gap-4 overflow-y-auto rounded-2xl border border-border/70 bg-card/75 p-3 shadow-sm backdrop-blur-xl">
                {email ? <Conta email={email} onSair={logout} /> : null}
                <NavPainel pathname={pathname} />
              </div>
            </aside>

            {/* No celular, jeito de aplicativo: abas fixas embaixo, à mão do
                polegar, e o menu completo em "Mais". */}
            <nav
              aria-label="Atalhos do painel"
              className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/90 pb-[max(0.25rem,calc(env(safe-area-inset-bottom)_-_0.75rem))] shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.25)] backdrop-blur-xl lg:hidden"
            >
              <ul className="mx-auto grid h-16 max-w-lg grid-cols-5">
                {ABAS.map(({ to, label, Icone }) => {
                  const ativo = estaAtivo(pathname, to);
                  return (
                    <li key={to}>
                      <Link
                        to={to}
                        aria-current={ativo ? "page" : undefined}
                        className="flex h-full flex-col items-center justify-center gap-1 text-[11px] font-semibold"
                      >
                        <span
                          className={cn(
                            "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                            ativo
                              ? "bg-primary text-primary-foreground shadow"
                              : "text-muted-foreground",
                          )}
                        >
                          <Icone className="size-5" aria-hidden />
                        </span>
                        <span className={ativo ? "text-primary" : "text-muted-foreground"}>
                          {label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
                <li>
                  <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
                    <SheetTrigger asChild>
                      <button
                        type="button"
                        className="flex size-full flex-col items-center justify-center gap-1 text-[11px] font-semibold text-muted-foreground"
                      >
                        <span className="flex h-7 w-12 items-center justify-center rounded-full">
                          <Menu className="size-5" aria-hidden />
                        </span>
                        Mais
                      </button>
                    </SheetTrigger>
                    <SheetContent
                      side="left"
                      className="flex w-[18rem] flex-col gap-4 overflow-y-auto p-4 pt-[calc(1rem_+_env(safe-area-inset-top))]"
                    >
                      <SheetHeader className="space-y-0 text-left">
                        <SheetTitle className="text-sm">Painel de gestão</SheetTitle>
                      </SheetHeader>
                      {email ? <Conta email={email} onSair={logout} /> : null}
                      <NavPainel pathname={pathname} aoEscolher={() => setMenuAberto(false)} />
                    </SheetContent>
                  </Sheet>
                </li>
              </ul>
            </nav>

            <main className="painel-conteudo min-w-0">
              {/* Trilha de navegação: deixa claro em que parte do painel se está. */}
              <p className="mb-3 hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
                <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <IconeAtual className="size-3.5" aria-hidden />
                </span>
                <Link to="/dashboard" className="hover:text-foreground">
                  Painel
                </Link>
                {grupoAtual ? (
                  <>
                    <span aria-hidden>/</span>
                    <span>{grupoAtual}</span>
                  </>
                ) : null}
                {atual.to !== "/dashboard" ? (
                  <>
                    <span aria-hidden>/</span>
                    <span className="font-medium text-foreground">{atual.label}</span>
                  </>
                ) : null}
              </p>
              {children}
              {/* espaço para as abas fixas do celular */}
              <div aria-hidden className="h-20 lg:hidden" />
            </main>
          </div>
        </Protected>
      </div>
    </div>
  );
}
