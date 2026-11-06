import { useEffect, useState } from "react";
import { Clock3, Monitor, Sparkles } from "lucide-react";

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
        <div className="mb-8 flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 shadow-2xl backdrop-blur-xl">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-indigo-600 shadow-lg shadow-violet-950/50">
            <Monitor className="size-5 text-white" />
          </span>
          <span className="text-left">
            <span className="block text-sm font-extrabold tracking-tight sm:text-base">informática<span className="text-amber-300">.</span></span>
            <span className="block text-[10px] font-semibold tracking-[0.22em] text-indigo-100/70">E.M. DR. EIRALDO</span>
          </span>
        </div>

        <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-cyan-200/80 sm:text-sm">
          <Sparkles className="size-4" /> Um espaço para aprender e descobrir
        </div>

        <div className="font-heading text-[clamp(5rem,17vw,12rem)] font-black leading-none tracking-[-0.075em] tabular-nums text-white drop-shadow-[0_12px_45px_rgba(99,102,241,0.25)]">
          {formatarHora(agora)}
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
        <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/35">
          Escola Municipal Dr. Eiraldo Carneiro de França
        </p>
      </div>
    </div>
  );
}
