import { Link, useLocation } from "@tanstack/react-router";
import {
  BarChart3,
  GraduationCap,
  Home,
  MonitorSmartphone,
  Puzzle,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const ITENS: { to: string; label: string; Icone: LucideIcon }[] = [
  { to: "/", label: "Início", Icone: Home },
  { to: "/agenda", label: "Laboratório", Icone: MonitorSmartphone },
  { to: "/resultados", label: "Resultados", Icone: BarChart3 },
  { to: "/infoteca", label: "Infoteca", Icone: Puzzle },
  { to: "/aluno", label: "Aluno", Icone: GraduationCap },
];

/** Páginas públicas de navegação geral: só nelas a barra aparece. */
const PAGINAS = new Set([
  "/",
  "/agenda",
  "/resultados",
  "/avaliacao",
  "/infoteca",
  "/aluno",
  "/coordenacao",
  "/professor",
  "/mediador",
  "/sobre",
  "/evolucao",
  "/descritores",
]);

/**
 * Barra de navegação inferior do celular, no jeito de app: fica sempre à mão
 * do polegar e ganha o efeito de vidro (fundo translúcido e desfocado) assim
 * que a página começa a rolar. Some do computador, onde o menu do topo basta.
 */
export function BarraInferior() {
  const { pathname } = useLocation();
  const [rolou, setRolou] = useState(false);

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 8);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  const caminho = pathname.replace(/\/+$/, "") || "/";
  if (!PAGINAS.has(caminho)) return null;

  return (
    <>
      {/* Reserva o espaço da barra no fim da página, para nada ficar escondido atrás dela. */}
      <div aria-hidden className="h-[calc(4.5rem+env(safe-area-inset-bottom))] xl:hidden" />
      <nav
        aria-label="Navegação principal"
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 xl:hidden",
          rolou
            ? "border-white/20 bg-background/55 shadow-[0_-8px_30px_-12px_rgb(0_0_0/0.45)] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-slate-950/45"
            : "border-border/60 bg-background/90 backdrop-blur-md",
        )}
      >
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
        />
        <ul className="mx-auto flex h-[4.5rem] max-w-lg items-stretch justify-around px-1">
          {ITENS.map(({ to, label, Icone }) => {
            const ativo = to === "/" ? caminho === "/" : caminho.startsWith(to);
            return (
              <li key={to} className="flex flex-1">
                <Link
                  to={to}
                  aria-current={ativo ? "page" : undefined}
                  className={cn(
                    "group flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors",
                    ativo ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-14 items-center justify-center rounded-full transition-all duration-300",
                      ativo ? "bg-primary/15 ring-1 ring-primary/30" : "group-active:scale-90",
                    )}
                  >
                    <Icone className="size-5" aria-hidden />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
