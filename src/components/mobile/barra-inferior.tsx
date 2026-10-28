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
      <div aria-hidden className="h-[calc(3.75rem+env(safe-area-inset-bottom))] xl:hidden" />
      <nav
        aria-label="Navegação principal"
        // Ocupa a largura toda e é quase opaca: o conteúdo não aparece por baixo,
        // fica só o acabamento de vidro fosco. Ao rolar, ganha uma sombra leve.
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl backdrop-saturate-150 transition-shadow duration-300 dark:bg-slate-950/95 xl:hidden",
          rolou && "shadow-[0_-6px_24px_-12px_rgb(0_0_0/0.45)]",
        )}
      >
        <ul className="mx-auto flex h-[3.75rem] max-w-xl items-stretch px-1">
          {ITENS.map(({ to, label, Icone }) => {
            const ativo = to === "/" ? caminho === "/" : caminho.startsWith(to);
            return (
              <li key={to} className="flex flex-1">
                <Link
                  to={to}
                  aria-current={ativo ? "page" : undefined}
                  className={cn(
                    "relative flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium tracking-wide transition-colors active:scale-95",
                    ativo ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {/* Indicador discreto da página atual: um traço curto no alto. */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-1 h-0.5 rounded-full bg-primary transition-all duration-300",
                      ativo ? "w-5 opacity-100" : "w-0 opacity-0",
                    )}
                  />
                  <Icone className="size-[22px]" strokeWidth={ativo ? 2.4 : 1.8} aria-hidden />
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
