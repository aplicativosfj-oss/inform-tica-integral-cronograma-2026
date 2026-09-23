import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Compass,
  ClipboardList,
  GraduationCap,
  HandHeart,
  Home,
  Info,
  LayoutDashboard,
  LogIn,
  ListChecks,
  LogOut,
  Menu,
  Presentation,
  Puzzle,
  Users2,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FaixaAulaAgora } from "@/components/school/faixa-aula-agora";
import { HeaderRadioPlayer } from "@/components/school/header-radio-player";
import { ShareButton } from "@/components/school/share-button";
import { ThemeToggle } from "@/components/school/theme-toggle";
import { useAuth } from "@/lib/auth-store";
import { useAppStore } from "@/lib/app-store";
import { encerrarAlunoSessao, lerAlunoSessao } from "@/lib/aluno-session";
import { useConfirmar } from "@/lib/confirm-store";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";
import logoIcon from "@/assets/logo-icon.png";

function NavLink({ to, label }: { to: string; label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to === "/" && location.pathname === "");

  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className={`relative hidden whitespace-nowrap px-1.5 text-[15px] transition-all duration-300 xl:inline-flex ${
        isActive
          ? "text-slate-900 bg-blue-400/40 font-semibold dark:text-white dark:bg-cyan-400/30"
          : "text-slate-700 hover:text-white hover:bg-blue-600 hover:shadow-md hover:scale-105 dark:text-white/80 dark:hover:text-slate-900 dark:hover:bg-cyan-300 dark:hover:shadow-lg dark:hover:scale-105"
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

/**
 * "Avaliações" no topo abre as três abas da área em vez de só levar ao
 * Resumo — sem isso o guia de habilidades fica invisível para quem não
 * entra na página primeiro.
 */
/** Título da página mostrado na barra mínima (fora da home). */
function tituloDaPagina(pathname: string): string {
  const mapa: Record<string, string> = {
    "/agenda": "Agenda da semana",
    "/coordenacao": "Coordenação",
    "/infoteca": "Infoteca",
    "/avaliacao": "Avaliações diagnósticas",
    "/descritores": "Guia de habilidades",
    "/sobre": "Sobre o projeto",
    "/login": "Entrar no painel",
    "/tv": "Modo TV",
  };
  if (mapa[pathname]) return mapa[pathname];
  if (pathname.startsWith("/aluno")) return "Área do Aluno";
  if (pathname.startsWith("/professor")) return "Espaço do Professor";
  if (pathname.startsWith("/mediador")) return "Espaço do Mediador";
  if (pathname.startsWith("/ferramentas")) return "Ferramentas";
  if (pathname.startsWith("/dashboard")) return "Painel de gestão";
  return "Agenda de Informática";
}

const LINKS = [
  { to: "/", label: "Início" },
  { to: "/agenda", label: "Agenda" },
  { to: "/coordenacao", label: "Coordenação" },
  { to: "/infoteca", label: "Infoteca" },
  { to: "/avaliacao", label: "Avaliações" },
  { to: "/aluno", label: "Área do Aluno" },
  { to: "/professor", label: "Professor" },
  { to: "/mediador", label: "Mediadores" },
  { to: "/sobre", label: "Sobre" },
] as const;

const LINK_ICONS: Record<string, LucideIcon> = {
  "/": Home,
  "/agenda": CalendarDays,
  "/coordenacao": ClipboardList,
  "/infoteca": Puzzle,
  "/avaliacao": BarChart3,
  "/aluno": GraduationCap,
  "/professor": Presentation,
  "/mediador": HandHeart,
  "/sobre": Info,
};

export function NavBar() {
  const { isAuthenticated, isReady, logout } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const confirmar = useConfirmar();
  const { turmas } = useAppStore();

  // sessionStorage não é reativo por si só — relemos a cada navegação de rota
  // para o cabeçalho trocar de modo assim que o aluno entra ou sai.
  const [sessaoAluno, setSessaoAluno] = useState(() => lerAlunoSessao());
  useEffect(() => {
    setSessaoAluno(lerAlunoSessao());
  }, [location.pathname]);

  // Decidir o modo do cabeçalho pela URL (e não só pela sessão) evita um
  // "flash" do menu completo da home ao recarregar a página dentro da área
  // do aluno: a rota já dá certeza absoluta, no primeiríssimo render, de que
  // estamos numa página isolada — sem precisar esperar o efeito acima ler o
  // sessionStorage do navegador.
  const correspondenciaAluno = location.pathname.match(/^\/aluno\/([^/]+)\/([^/]+)/);
  const emPaginaIsoladaDoAluno = Boolean(correspondenciaAluno);

  if (emPaginaIsoladaDoAluno) {
    const turmaIdUrl = correspondenciaAluno?.[1] ?? sessaoAluno?.turmaId;
    const alunoIdUrl = correspondenciaAluno?.[2] ?? sessaoAluno?.alunoId;
    const turma = turmas.find((t) => t.id === (sessaoAluno?.turmaId ?? turmaIdUrl));
    const corTurma = turma ? serieClasses(serieIndexPorNumero(turma.serie)) : null;

    async function sairDaAreaDoAluno() {
      const ok = await confirmar({
        titulo: "Sair da sua área?",
        descricao: "Você vai precisar do seu PIN de novo para entrar da próxima vez.",
      });
      if (!ok) return;
      encerrarAlunoSessao();
      setSessaoAluno(null);
      navigate({ to: "/" });
    }

    return (
      <header className="relative sticky top-0 z-40 border-b border-blue-300/45 bg-gradient-to-b from-blue-50/95 via-sky-50/92 to-blue-200/85 text-slate-900 shadow-lg shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:from-slate-900/85 dark:via-slate-900/80 dark:to-slate-950/85 dark:text-white dark:shadow-black/40">
        {/* Filete da marca rente à base: é o que separa a barra do
          conteúdo sem precisar escurecer o cabeçalho inteiro. */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 dark:from-blue-500 dark:via-cyan-400 dark:to-blue-500"
        />
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:h-14 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <img
              src={logoIcon}
              alt="Agenda de Informática .Online"
              className="size-9 shrink-0 rounded-lg bg-slate-100 object-contain p-1 shadow-sm ring-1 ring-slate-200 dark:bg-white dark:ring-white/20"
            />
            <div className="flex min-w-0 items-center gap-2">
              {corTurma && (
                <span
                  className={`hidden size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:flex ${corTurma.bg} ${corTurma.text}`}
                >
                  {turma?.letra}
                </span>
              )}
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-[13px] font-semibold text-slate-900 dark:text-white sm:text-sm">
                  {sessaoAluno
                    ? sessaoAluno.nome.split(" ").slice(0, 2).join(" ")
                    : "Área do Aluno"}
                </span>
                <span className="truncate text-xs text-slate-600 dark:text-white/70">
                  {turma ? `${turma.serie} "${turma.letra}"` : "Escola Dr. Eiraldo Carneiro"}
                </span>
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            {turmaIdUrl && alunoIdUrl && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden text-slate-700 hover:bg-slate-100/50 hover:text-slate-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white sm:inline-flex"
              >
                <Link
                  to="/aluno/$turmaId/$alunoId"
                  params={{ turmaId: turmaIdUrl, alunoId: alunoIdUrl }}
                >
                  <GraduationCap /> Minha área
                </Link>
              </Button>
            )}
            <Button
              size="sm"
              onClick={sairDaAreaDoAluno}
              disabled={!sessaoAluno}
              className="border border-slate-300/50 bg-slate-100/60 text-slate-900 hover:bg-slate-200/60 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
              <LogOut />
              Sair
            </Button>
          </div>
        </div>
      </header>
    );
  }

  // Fora da home, o cabeçalho completo (9 links, rádio, compartilhar, tema,
  // entrar) só toma espaço de quem já está com uma ferramenta ou uma área
  // aberta na tela — ali o que importa é o conteúdo, não o menu. Uma barra
  // mínima com voltar/avançar/início cobre o que se precisa de navegação
  // sem competir com a atividade.
  if (location.pathname !== "/") {
    return (
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-1.5 border-b border-blue-300/45 bg-gradient-to-b from-blue-50/95 via-sky-50/92 to-blue-200/85 px-2 text-slate-900 shadow-sm backdrop-blur-xl dark:border-white/10 dark:from-slate-900/85 dark:via-slate-900/80 dark:to-slate-950/85 dark:text-white sm:px-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Voltar"
          onClick={() => window.history.back()}
          className="size-10 text-slate-700 hover:bg-slate-900/10 hover:text-slate-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white [&_svg]:size-5"
        >
          <ArrowLeft />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Avançar"
          onClick={() => window.history.forward()}
          className="size-10 text-slate-700 hover:bg-slate-900/10 hover:text-slate-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white [&_svg]:size-5"
        >
          <ArrowRight />
        </Button>
        <span className="mx-1 h-6 w-px bg-slate-900/15 dark:bg-white/15" />
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-10 gap-2 px-3 text-base text-slate-700 hover:bg-slate-900/10 hover:text-slate-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <Link to="/">
            <img
              src={logoIcon}
              alt=""
              aria-hidden
              className="size-6 shrink-0 rounded bg-slate-100 object-contain p-0.5 dark:bg-white"
            />
            <span className="hidden font-medium sm:inline">Início</span>
          </Link>
        </Button>

        {/* O miolo da barra mínima não pode ficar vazio: mostra em que página
            a pessoa está (e a escola), sem repetir o menu da home. */}
        <div className="mx-1 flex min-w-0 flex-1 flex-col justify-center sm:mx-3">
          <span className="truncate text-sm font-semibold leading-tight text-slate-900 dark:text-white">
            {tituloDaPagina(location.pathname)}
          </span>
          <span className="hidden truncate text-[10px] font-semibold uppercase leading-tight tracking-[0.12em] text-slate-600 dark:text-white/60 sm:block">
            Escola Dr. Eiraldo Carneiro de França
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <ShareButton />
          <ThemeToggle />
        </div>
      </header>
    );
  }

  return (
    <header className="relative sticky top-0 z-40 border-b border-blue-300/45 bg-gradient-to-b from-blue-50/95 via-sky-50/92 to-blue-200/85 text-slate-900 shadow-lg shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:from-slate-900/85 dark:via-slate-900/80 dark:to-slate-950/85 dark:text-white dark:shadow-black/40">
      {/* Filete da marca rente à base: é o que separa a barra do
          conteúdo sem precisar escurecer o cabeçalho inteiro. */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 dark:from-blue-500 dark:via-cyan-400 dark:to-blue-500"
      />
      <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-3 px-3 sm:gap-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <img
            src={logoIcon}
            alt="Agenda de Informática .Online"
            className="size-9 shrink-0 rounded-lg bg-slate-100 object-contain p-1 shadow-sm ring-1 ring-slate-200 dark:bg-white dark:ring-white/20"
          />
          {/* Marca em duas linhas: nome do produto + escola em versalete.
              Textos curtos e sem quebra, para caberem inteiros em qualquer tela. */}
          <span className="flex min-w-0 flex-col justify-center gap-0.5 border-l border-slate-300/70 pl-2.5 dark:border-white/15">
            <span className="whitespace-nowrap text-[13px] font-bold leading-none tracking-tight text-slate-900 dark:text-white sm:text-[15px]">
              Agenda{" "}
              <span className="font-medium text-blue-600 dark:text-blue-400">de Informática</span>
            </span>
            <span className="whitespace-nowrap text-[9.5px] font-semibold uppercase leading-none tracking-[0.12em] text-slate-600 dark:text-white/70 sm:text-[10.5px]">
              <span className="sm:hidden">E.M. Dr. Eiraldo</span>
              <span className="hidden sm:inline">Escola Dr. Eiraldo Carneiro</span>
            </span>
          </span>
        </Link>

        <nav className="flex min-w-0 items-center gap-1 sm:gap-1.5 xl:gap-0">
          <NavLink to="/" label="Início" />
          <NavLink to="/agenda" label="Agenda" />
          <NavLink to="/coordenacao" label="Coordenação" />
          <NavLink to="/infoteca" label="Infoteca" />
          <NavLink to="/avaliacao" label="Avaliações" />
          <NavLink to="/aluno" label="Área do Aluno" />
          <NavLink to="/professor" label="Professor" />
          <NavLink to="/mediador" label="Mediadores" />
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
              className="hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg sm:inline-flex"
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
                className="size-10 text-slate-700 hover:bg-slate-100/50 hover:text-slate-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white xl:hidden [&_svg]:size-[22px]"
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
                      <div key={link.to} className="flex flex-col gap-1">
                        <SheetClose asChild>
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
                      </div>
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
      <FaixaAulaAgora />
    </header>
  );
}
