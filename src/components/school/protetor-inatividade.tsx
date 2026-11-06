import { useEffect, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import {
  ArrowRight, BookOpen, Camera, Check, Clock3, Code2, Cpu, GraduationCap,
  Maximize2, Monitor, ShieldCheck, Sparkles, Wifi, X,
} from "lucide-react";

const TEMPO_INATIVIDADE = 60_000;
const ROTAS_EXCLUIDAS = ["/login", "/tv", "/sala-de-jogos", "/jogos"];

function formatarHora(data: Date) {
  return {
    hora: data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    segundos: data.toLocaleTimeString("pt-BR", { second: "2-digit" }),
  };
}

function formatarData(data: Date) {
  return data.toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
}

/** Tela de descanso visual para computadores após 60 segundos sem interação. */
export function ProtetorInatividade({ pathname }: { pathname: string }) {
  const [ativo, setAtivo] = useState(false);
  const [confirmarSaida, setConfirmarSaida] = useState(false);
  const [agora, setAgora] = useState(() => new Date());
  const [telaCheia, setTelaCheia] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const desktop = window.matchMedia("(min-width: 900px) and (hover: hover) and (pointer: fine)");
    const bloqueada = ROTAS_EXCLUIDAS.some((rota) => pathname === rota || pathname.startsWith(rota + "/"));
    if (!desktop.matches || bloqueada) {
      setAtivo(false);
      setConfirmarSaida(false);
      return;
    }

    let temporizador: number | undefined;
    const reiniciar = () => {
      setAtivo(false);
      setConfirmarSaida(false);
      window.clearTimeout(temporizador);
      if (document.visibilityState === "visible") {
        temporizador = window.setTimeout(() => {
          setConfirmarSaida(false);
          setAtivo(true);
        }, TEMPO_INATIVIDADE);
      }
    };
    const visibilidade = () => {
      if (document.visibilityState === "visible") reiniciar();
      else window.clearTimeout(temporizador);
    };
    const eventos: Array<keyof WindowEventMap> = [
      "pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll",
    ];
    eventos.forEach((evento) => window.addEventListener(evento, reiniciar, { passive: true }));
    document.addEventListener("visibilitychange", visibilidade);
    reiniciar();
    return () => {
      window.clearTimeout(temporizador);
      eventos.forEach((evento) => window.removeEventListener(evento, reiniciar));
      document.removeEventListener("visibilitychange", visibilidade);
    };
  }, [pathname]);

  useEffect(() => {
    const atualizar = () => setTelaCheia(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", atualizar);
    atualizar();
    return () => document.removeEventListener("fullscreenchange", atualizar);
  }, []);

  useEffect(() => {
    if (!ativo) return;
    const id = window.setInterval(() => setAgora(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [ativo]);

  const ativarTelaCheia = async (evento: MouseEvent<HTMLButtonElement>) => {
    evento.preventDefault();
    evento.stopPropagation();
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    } catch {
      // A API exige gesto explícito do usuário e pode ser bloqueada pelo navegador.
    }
  };

  const pedirConfirmacao = (evento: PointerEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) => {
    if (confirmarSaida) return;
    evento.preventDefault();
    evento.stopPropagation();
    setConfirmarSaida(true);
  };

  const permanecer = (evento: MouseEvent<HTMLButtonElement>) => {
    evento.preventDefault();
    evento.stopPropagation();
    setConfirmarSaida(false);
  };

  const sair = (evento: MouseEvent<HTMLButtonElement>) => {
    evento.preventDefault();
    evento.stopPropagation();
    setConfirmarSaida(false);
    setAtivo(false);
  };

  if (!ativo) return null;
  const horario = formatarHora(agora);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tela de descanso da plataforma Informática Dr. Eiraldo"
      onPointerDown={pedirConfirmacao}
      onKeyDown={pedirConfirmacao}
      tabIndex={-1}
      className="fixed inset-0 z-[9999] flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#071329] px-5 py-6 text-white outline-none sm:px-8"
    >
      {/* Fotografia real do laboratório com camadas de contraste para leitura. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <img
          src="/images/hero-lab-photo-1280w.webp"
          alt=""
          className="h-full w-full object-cover object-center opacity-40"
        />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(4,12,30,.94)_0%,rgba(7,20,48,.84)_48%,rgba(8,34,69,.78)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(76,116,220,.28),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[.12]" style={{ backgroundImage: "linear-gradient(rgba(190,215,255,.22) 1px,transparent 1px),linear-gradient(90deg,rgba(190,215,255,.22) 1px,transparent 1px)", backgroundSize: "46px 46px" }} />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-400 via-amber-300 to-cyan-300" />
        <div className="absolute -left-40 bottom-[-16rem] size-[34rem] rounded-full bg-blue-500/20 blur-[110px]" />
        <div className="absolute -right-40 top-[-16rem] size-[34rem] rounded-full bg-cyan-400/15 blur-[110px]" />
      </div>

      <main className="relative z-10 mx-auto flex max-h-[94dvh] w-full max-w-6xl flex-col items-center overflow-y-auto py-2 text-center [scrollbar-width:none]">
        <header className="mb-5 flex flex-wrap items-center justify-center gap-3 sm:mb-7">
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-slate-950/35 px-4 py-2.5 shadow-xl backdrop-blur-xl">
            <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-blue-700 shadow-lg shadow-blue-950/40">
              <Monitor className="size-5 text-white" />
            </span>
            <span className="text-left">
              <span className="block text-base font-black tracking-tight">informática<span className="text-amber-300">.</span></span>
              <span className="block text-[9px] font-bold tracking-[.19em] text-blue-100/65">AMBIENTE DIGITAL ESCOLAR</span>
            </span>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-300/10 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[.17em] text-cyan-100">
            <GraduationCap className="size-4" /> Informática Educativa
          </span>
        </header>

        <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.28em] text-cyan-100/75 sm:text-xs">
          <Sparkles className="size-4" /> Tecnologia, conhecimento e criatividade
        </div>

        {/* Relógio único: horas e minutos em destaque, segundos discretos ao lado. */}
        <section aria-label={`Horário atual: ${horario.hora} e ${horario.segundos} segundos`} className="mb-2 flex items-end justify-center gap-3">
          <time className="font-heading text-[clamp(4.6rem,13vw,9rem)] font-black leading-[.92] tracking-[-.075em] tabular-nums text-white drop-shadow-[0_8px_36px_rgba(75,125,255,.34)]">
            {horario.hora}
          </time>
          <span className="mb-1 rounded-xl border border-cyan-100/20 bg-cyan-200/10 px-3 py-2 text-left backdrop-blur-md">
            <span className="block font-mono text-2xl font-bold tabular-nums text-cyan-100 sm:text-3xl">{horario.segundos}</span>
            <span className="block text-[8px] font-extrabold tracking-[.18em] text-cyan-100/55">SEG</span>
          </span>
        </section>
        <p className="mb-5 text-sm font-medium capitalize text-blue-100/75 sm:mb-7 sm:text-lg">{formatarData(agora)}</p>

        <div className="mb-5 flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/15 bg-slate-950/30 px-5 py-3 text-xs font-semibold text-white/85 shadow-xl backdrop-blur-xl sm:text-sm">
          <Clock3 className="size-4 text-cyan-200" />
          Tela de descanso ativada após 60 segundos sem interação
        </div>

        <button
          type="button"
          onPointerDown={(evento) => evento.stopPropagation()}
          onKeyDown={(evento) => evento.stopPropagation()}
          onClick={ativarTelaCheia}
          className="mb-6 inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-cyan-100/35 bg-cyan-300/10 px-5 py-2 text-[10px] font-extrabold uppercase tracking-[.15em] text-cyan-50 shadow-lg backdrop-blur transition hover:bg-cyan-300/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
        >
          <Maximize2 className="size-4" /> {telaCheia ? "Modo tela cheia ativado" : "Ativar modo tela cheia"}
        </button>

        <section className="grid w-full grid-cols-1 gap-4 rounded-[1.6rem] border border-white/15 bg-slate-950/45 p-4 text-left shadow-2xl shadow-black/30 backdrop-blur-2xl sm:grid-cols-[minmax(230px,.8fr)_1.5fr] sm:items-center sm:gap-6 sm:p-5">
          {/* Câmera cenográfica animada: não acessa webcam nem transmite imagens. */}
          <div className="relative flex min-h-[175px] items-center justify-center overflow-hidden rounded-2xl border border-cyan-100/20 bg-gradient-to-br from-[#122b55] via-[#0b1b39] to-[#071329]">
            <div aria-hidden className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(103,232,249,.24) 1px,transparent 1px),linear-gradient(90deg,rgba(103,232,249,.24) 1px,transparent 1px)", backgroundSize: "18px 18px" }} />
            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-emerald-200/25 bg-emerald-300/10 px-2.5 py-1 text-[8px] font-black tracking-[.14em] text-emerald-100">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-300" /> CÂMERA ILUSTRATIVA
            </div>
            <div aria-hidden className="relative flex h-20 w-32 items-center justify-center rounded-[1.4rem] border border-slate-300/35 bg-gradient-to-b from-slate-200/20 to-slate-500/10 shadow-[0_20px_45px_rgba(0,0,0,.35)]">
              <div className="absolute -top-3 left-1/2 h-3 w-12 -translate-x-1/2 rounded-t-lg border border-white/20 bg-slate-300/25" />
              <div className="absolute -right-5 top-1/2 h-2 w-6 -translate-y-1/2 rounded-r-md bg-slate-300/30" />
              <div className="relative flex size-14 items-center justify-center rounded-full border-[5px] border-slate-300/30 bg-slate-950 shadow-inner">
                <div className="relative size-9 overflow-hidden rounded-full border border-cyan-200/50 bg-gradient-to-br from-cyan-300/60 to-blue-700/80 shadow-[0_0_25px_rgba(34,211,238,.4)]">
                  <div className="absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-20deg] bg-white/45 motion-safe:animate-[cameraSweep_3.2s_ease-in-out_infinite]" />
                  <div className="absolute right-1 top-1 size-2 rounded-full bg-white/80" />
                </div>
              </div>
              <div className="absolute -bottom-4 left-1/2 h-4 w-10 -translate-x-1/2 rounded-b-lg bg-slate-300/25" />
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[8px] font-bold tracking-[.13em] text-cyan-100/60">
              <span>VISUAL DE AMBIENTE</span><span>24H · CONCEITO</span>
            </div>
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-cyan-200/80 shadow-[0_0_14px_3px_rgba(34,211,238,.35)] motion-safe:animate-[cameraLine_4s_ease-in-out_infinite]" />
          </div>

          <div className="min-w-0 py-1">
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.18em] text-cyan-200">
              <ShieldCheck className="size-4" /> Cuidado e responsabilidade
            </div>
            <h2 className="mt-2 font-heading text-lg font-extrabold leading-snug text-white sm:text-xl">
              Nosso laboratório é um espaço de respeito, aprendizagem e cuidado.
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-blue-100/75 sm:text-sm">
              Cuide dos equipamentos, respeite os colegas e siga as orientações dos educadores.
              A tecnologia é uma ferramenta para aprender, criar e compartilhar.
            </p>
            <p className="mt-2 text-[9px] leading-relaxed text-white/45">
              Ilustração cenográfica: nenhuma câmera real, webcam ou transmissão é ativada por esta tela.
            </p>
          </div>
        </section>

        <div className="mt-4 grid w-full grid-cols-3 gap-2">
          {[
            { Icon: BookOpen, label: "Aprendizagem", cor: "text-violet-200" },
            { Icon: Cpu, label: "Tecnologia", cor: "text-cyan-200" },
            { Icon: Code2, label: "Criatividade", cor: "text-amber-200" },
          ].map(({ Icon, label, cor }) => (
            <div key={label} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.055] px-2 py-3 backdrop-blur-md">
              <Icon className={`size-4 shrink-0 ${cor}`} />
              <span className="text-[9px] font-extrabold uppercase tracking-[.1em] text-white/70 sm:text-[10px]">{label}</span>
            </div>
          ))}
        </div>

        <footer className="mt-5 flex flex-col items-center gap-1 text-center">
          <div className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[.17em] text-white/60">
            <Wifi className="size-3.5 text-cyan-200/75" /> Escola Municipal Dr. Eiraldo Carneiro de França
          </div>
          <p className="text-[8px] font-semibold uppercase tracking-[.2em] text-white/35">Informática Educativa · Um espaço para aprender e descobrir</p>
        </footer>
      </main>

      {confirmarSaida && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-[#020817]/75 p-5 backdrop-blur-md"
          role="presentation"
          onPointerDown={(evento) => evento.stopPropagation()}
          onKeyDown={(evento) => evento.stopPropagation()}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirmar-saida-titulo"
            aria-describedby="confirmar-saida-descricao"
            className="w-full max-w-md rounded-[1.7rem] border border-white/15 bg-[#101f3d] p-6 text-center shadow-[0_30px_100px_rgba(0,0,0,.55)] sm:p-8"
          >
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-cyan-200/20 bg-cyan-300/10 text-cyan-100">
              <Monitor className="size-7" />
            </div>
            <h2 id="confirmar-saida-titulo" className="mt-4 font-heading text-xl font-extrabold text-white">Deseja sair da tela de descanso?</h2>
            <p id="confirmar-saida-descricao" className="mt-2 text-sm leading-relaxed text-blue-100/70">
              Confirme para voltar à plataforma. Se preferir, você pode continuar na tela de descanso.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
              <button type="button" onClick={permanecer} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[.06] px-4 py-3 text-xs font-bold text-white/85 transition hover:bg-white/10">
                <X className="size-4" /> Permanecer
              </button>
              <button type="button" onClick={sair} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-xs font-black text-[#071329] transition hover:bg-cyan-200">
                <Check className="size-4" /> Sim, continuar <ArrowRight className="size-4" />
              </button>
            </div>
          </section>
        </div>
      )}
      <style>{`
        @keyframes cameraSweep { 0%, 15% { transform: translateX(-180%); } 75%, 100% { transform: translateX(330%); } }
        @keyframes cameraLine { 0%, 100% { transform: translateY(0); opacity: .25; } 50% { transform: translateY(170px); opacity: .9; } }
        @media (prefers-reduced-motion: reduce) {
          [class*="animate-"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
