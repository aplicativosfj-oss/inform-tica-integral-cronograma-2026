import { Link, useLocation } from "@tanstack/react-router";
import {
  BarChart3,
  GraduationCap,
  Home,
  MonitorSmartphone,
  Puzzle,
  type LucideIcon,
} from "lucide-react";
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
 * Barra de navegação inferior do celular, no jeito de app: baixa e discreta,
 * sempre à mão do polegar, com acabamento de vidro fosco. Some do computador,
 * onde o menu do topo basta.
 */
export function BarraInferior() {
  const { pathname } = useLocation();

  const caminho = pathname.replace(/\/+$/, "") || "/";
  if (!PAGINAS.has(caminho)) return null;

  return (
    <>
      {/* Reserva o espaço da barra no fim da página, para nada ficar escondido atrás dela. */}
      <div aria-hidden className="h-[calc(3.25rem+env(safe-area-inset-bottom))] xl:hidden" />
      <nav
        aria-label="Navegação principal"
        // Ocupa a largura toda e é quase opaca: o conteúdo não aparece por baixo,
        // fica só o acabamento de vidro fosco.
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl backdrop-saturate-150 dark:bg-slate-950/95 xl:hidden"
      >
        <ul className="mx-auto flex h-[3.25rem] max-w-lg items-stretch px-1">
          {ITENS.map(({ to, label, Icone }) => {
            const ativo = to === "/" ? caminho === "/" : caminho.startsWith(to);
            return (
              <li key={to} className="flex flex-1">
                <Link
                  to={to}
                  aria-current={ativo ? "page" : undefined}
                  className={cn(
                    "relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium leading-none transition-colors active:scale-95",
                    ativo ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {/* Indicador discreto da página atual: um traço curto no alto. */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-0 h-0.5 rounded-full bg-primary transition-all duration-300",
                      ativo ? "w-5 opacity-100" : "w-0 opacity-0",
                    )}
                  />
                  <Icone className="size-5" strokeWidth={ativo ? 2.3 : 1.8} aria-hidden />
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
