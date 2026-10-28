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

/**
 * Cada atalho tem a sua cor: o ícone fica sempre colorido e, na página
 * atual, ganha uma pílula preenchida com a mesma cor.
 */
const ITENS: { to: string; label: string; Icone: LucideIcon; icone: string; pilula: string }[] = [
  {
    to: "/",
    label: "Início",
    Icone: Home,
    icone: "text-violet-500 dark:text-violet-300",
    pilula: "from-violet-500 to-indigo-500 shadow-violet-500/40",
  },
  {
    to: "/agenda",
    label: "Laboratório",
    Icone: MonitorSmartphone,
    icone: "text-emerald-600 dark:text-emerald-300",
    pilula: "from-emerald-500 to-teal-500 shadow-emerald-500/40",
  },
  {
    to: "/resultados",
    label: "Resultados",
    Icone: BarChart3,
    icone: "text-amber-600 dark:text-amber-300",
    pilula: "from-amber-400 to-orange-500 shadow-amber-500/40",
  },
  {
    to: "/infoteca",
    label: "Infoteca",
    Icone: Puzzle,
    icone: "text-sky-600 dark:text-sky-300",
    pilula: "from-sky-500 to-blue-500 shadow-sky-500/40",
  },
  {
    to: "/aluno",
    label: "Aluno",
    Icone: GraduationCap,
    icone: "text-pink-600 dark:text-pink-300",
    pilula: "from-pink-500 to-rose-500 shadow-pink-500/40",
  },
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
      {/* Reserva o espaço da barra no fim da página, para nada ficar escondido atrás dela.
          No app instalado do iPhone, a faixa do gesto de início já dá espaço: só usamos
          parte dela, para a barra não ficar alta demais. */}
      <div
        aria-hidden
        className="h-[calc(3.625rem_+_max(0.375rem,calc(env(safe-area-inset-bottom)_-_1rem)))] xl:hidden"
      />
      <nav
        aria-label="Navegação principal"
        // Ocupa a largura toda e é quase opaca: o conteúdo não aparece por baixo,
        // fica só o acabamento de vidro fosco.
        className="fixed inset-x-0 bottom-0 z-40 bg-background/95 pb-[max(0.375rem,calc(env(safe-area-inset-bottom)_-_1rem))] shadow-[0_-8px_30px_-12px_rgb(0_0_0/0.35)] backdrop-blur-2xl backdrop-saturate-150 dark:bg-slate-950/95 xl:hidden"
      >
        {/* fio colorido no alto, com as cores dos atalhos */}
        <div
          aria-hidden
          className="h-0.5 bg-gradient-to-r from-violet-500 via-emerald-400 via-40% to-pink-500 opacity-80"
        />
        <ul className="mx-auto flex h-14 max-w-lg items-stretch px-1">
          {ITENS.map(({ to, label, Icone, icone, pilula }) => {
            const ativo = to === "/" ? caminho === "/" : caminho.startsWith(to);
            return (
              <li key={to} className="flex flex-1">
                <Link
                  to={to}
                  aria-current={ativo ? "page" : undefined}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10.5px] font-semibold leading-none transition-colors active:scale-95",
                    ativo ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-12 items-center justify-center rounded-full transition-all duration-300",
                      ativo ? cn("bg-gradient-to-br text-white shadow-lg", pilula) : icone,
                    )}
                  >
                    <Icone className="size-[22px]" strokeWidth={ativo ? 2.3 : 2} aria-hidden />
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
