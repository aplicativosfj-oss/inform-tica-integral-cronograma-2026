import { useEffect, useState, type MouseEvent } from "react";
import { Clock3, Monitor, Sparkles, GraduationCap, Cpu, BookOpen, Code2, Wifi, Maximize2 } from "lucide-react";

const TEMPO_INATIVIDADE = 120_000;
const ROTAS_EXCLUIDAS = ["/login", "/tv", "/sala-de-jogos", "/jogos"];

function formatarHora(data: Date) {
  return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatarData(data: Date) {
  return data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Proteção visual de inatividade exclusiva para computadores.
 * Não apresenta dados pessoais nem interrompe páginas de aula, jogos ou login.
 */
export function ProtetorInatividade({ pathname }: { pathname: string }) {
  const [ativo, setAtivo] = useState(false);
  const [agora, setAgora] = useState(() => new Date());
  const [telaCheia, setTelaCheia] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const telaDesktop = window.matchMedia("(min-width: 900px) and (hover: hover) and (pointer: fine)");
    const rotaBloqueada = ROTAS_EXCLUIDAS.some(
      (rota) => pathname === rota || pathname.startsWith(rota + "/"),
    );
    if (!telaDesktop.matches || rotaBloqueada) {
      setAtivo(false);
      return;
    }

    let temporizador: number | undefined;
    const encerrar = () => {
      setAtivo(false);
      window.clearTimeout(temporizador);
      if (document.visibilityState === "visible") {
        temporizador = window.setTimeout(() => setAtivo(true), TEMPO_INATIVIDADE);
      }
    };

    const aoFicarVisivel = () => {
      if (document.visibilityState === "visible") encerrar();
      else window.clearTimeout(temporizador);
    };

    const eventos: Array<keyof WindowEventMap> = [
      "pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll",
    ];
    eventos.forEach((evento) => window.addEventListener(evento, encerrar, { passive: true }));
    document.addEventListener("visibilitychange", aoFicarVisivel);
    encerrar();

    return () => {
      window.clearTimeout(temporizador);
      eventos.forEach((evento) => window.removeEventListener(evento, encerrar));
      document.removeEventListener("visibilitychange", aoFicarVisivel);
    };
  }, [pathname]);

  useEffect(() => {
    const atualizarTelaCheia = () => setTelaCheia(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", atualizarTelaCheia);
    atualizarTelaCheia();
    return () => document.removeEventListener("fullscreenchange", atualizarTelaCheia);
  }, []);

  const ativarTelaCheia = async (evento: MouseEvent<HTMLButtonElement>) => {
    evento.preventDefault();
    evento.stopPropagation();
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Alguns navegadores bloqueiam fullscreen fora de uma interação explícita.
    }
  };

  useEffect(() => {
    if (!ativo) return;
    const id = window.setInterval(() => setAgora(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [ativo]);

  if (!ativo) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tela de descanso da plataforma Informática Dr. Eiraldo"
      onPointerDown={() => setAtivo(false)}
      onKeyDown={() => setAtivo(false)}
      tabIndex={-1}
      className="fixed inset-0 z-[9999] flex min-h-screen min-h-[100dvh] cursor-pointer items-center justify-center overflow-hidden bg-[#090d24] px-8 py-10 text-white outline-none"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-40 size-[34rem] rounded-full bg-violet-600/20 blur-[110px] motion-safe:animate-pulse" />
        <div className="absolute -bottom-48 -right-32 size-[38rem] rounded-full bg-cyan-500/15 blur-[120px] motion-safe:animate-pulse" />
        <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "radial-gradient(#a5b4fc 1px, transparent 1px)", backgroundSize: "34px 34px" }} />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-amber-300 to-cyan-400" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center text-center">
        <div className="mb-7 flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-3 shadow-2xl backdrop-blur-xl">
            <span className="relative flex size-12 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-400 via-indigo-500 to-blue-700 shadow-lg shadow-violet-950/50">
              <Monitor className="size-6 text-white" />
              <span className="absolute -bottom-1 -right-1 size-5 rounded-full border-2 border-[#111630] bg-amber-300" />
            </span>
            <span className="text-left">
              <span className="block text-base font-black tracking-tight sm:text-lg">informática<span className="text-amber-300">.</span></span>
              <span className="block text-[10px] font-bold tracking-[0.2em] text-indigo-100/70">AMBIENTE DIGITAL ESCOLAR</span>
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-300/[0.08] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-cyan-100">
            <GraduationCap className="size-4" /> Informática Educativa
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-cyan-200/80 sm:text-sm">
          <Sparkles className="size-4" /> Tecnologia, conhecimento e criatividade
        </div>

        <div className="relative w-full max-w-4xl">
          <div aria-hidden className="pointer-events-none absolute inset-x-[12%] top-1/2 h-24 -translate-y-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative font-heading text-[clamp(5rem,17vw,12rem)] font-black leading-none tracking-[-0.075em] tabular-nums text-white drop-shadow-[0_12px_45px_rgba(99,102,241,0.25)]">
            {formatarHora(agora)}
          </div>
        </div>
        <p className="mt-5 text-base font-medium capitalize text-indigo-100/75 sm:text-xl">
          {formatarData(agora)}
        </p>

        <div className="mt-12 flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-4 shadow-2xl backdrop-blur-xl sm:flex-row sm:gap-4 sm:px-8">
          <span className="flex size-10 items-center justify-center rounded-full bg-white/10 text-cyan-200">
            <Clock3 className="size-5" />
          </span>
          <span className="text-sm font-medium text-white/85 sm:text-base">
            Tela em espera · Mova o mouse ou pressione uma tecla para continuar
          </span>
        </div>
        <button
          type="button"
          onPointerDown={(evento) => evento.stopPropagation()}
          onKeyDown={(evento) => evento.stopPropagation()}
          onClick={ativarTelaCheia}
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-300/10 px-5 py-2.5 text-xs font-extrabold uppercase tracking-[0.14em] text-cyan-100 shadow-lg shadow-cyan-950/20 backdrop-blur transition hover:border-cyan-100/60 hover:bg-cyan-300/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090d24]"
          aria-label={telaCheia ? "Tela cheia ativada" : "Ativar tela cheia no navegador"}
        >
          <Maximize2 className="size-4" />
          {telaCheia ? "Modo tela cheia ativado" : "Ativar modo tela cheia"}
        </button>
        <div className="mt-10 grid w-full max-w-4xl grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3 py-3 text-left backdrop-blur-md">
            <BookOpen className="size-4 shrink-0 text-violet-200" />
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/65">Aprendizagem</span>
          </div>
          <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3 py-3 text-left backdrop-blur-md">
            <Cpu className="size-4 shrink-0 text-cyan-200" />
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/65">Tecnologia</span>
          </div>
          <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3 py-3 text-left backdrop-blur-md">
            <Code2 className="size-4 shrink-0 text-amber-200" />
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/65">Criatividade</span>
          </div>
        </div>
        <div className="mt-7 flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/55">
            <Wifi className="size-3.5 text-cyan-200/70" /> Escola Municipal Dr. Eiraldo Carneiro de França
          </div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/30">Informática Educativa · Um espaço para aprender e descobrir</p>
        </div>
      </div>
    </div>
  );
}
