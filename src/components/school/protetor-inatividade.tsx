import { useEffect, useState, useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { ConstelacaoNomes } from "@/components/school/laboratorio/constelacao-nomes";
import { estadoDaSessao, useSessoesLab } from "@/lib/laboratorio";
import { useAuth } from "@/lib/auth-store";
import { supabase } from "@/lib/supabase-client";
import {
  ArrowRight, BookOpen, Check, Clock3, Code2, Cpu, GraduationCap,
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
  const [protetorForcado, setProtetorForcado] = useState(false);
  const { isAuthenticated, isReady: authPronto } = useAuth();
  const [agoraMs, setAgoraMs] = useState(() => Date.now());
  const { sessoes } = useSessoesLab();
  const aulaEmAndamento = sessoes.some((sessao) => estadoDaSessao(sessao, agoraMs) === "ao-vivo");
  const temporizadorRef = useRef<number | undefined>(undefined);
  // Estado global vem do app_state: todos os navegadores recebem a alteração
  // por Realtime e também fazem leitura inicial ao abrir a plataforma.
  useEffect(() => {
    let cancelado = false;
    const carregar = async () => {
      const { data, error } = await supabase
        .from("app_state")
        .select("config")
        .eq("id", "default")
        .maybeSingle();
      if (!cancelado && !error) {
        setProtetorForcado(Boolean((data?.config as { protetorForcado?: boolean } | null)?.protetorForcado));
      }
    };
    void carregar();
    const canal = supabase
      .channel("protetor-tela-global")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_state", filter: "id=eq.default" }, (payload) => {
        const row = (payload.new ?? {}) as { config?: { protetorForcado?: boolean } };
        setProtetorForcado(Boolean(row.config?.protetorForcado));
      })
      .subscribe();
    return () => {
      cancelado = true;
      void supabase.removeChannel(canal);
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setAgoraMs(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  // Uma aula ao vivo tem prioridade sobre o descanso de tela, mesmo sem
  // interação: o protetor não deve cobrir o painel durante a atividade.
  useEffect(() => {
    if (!aulaEmAndamento) return;
    window.clearTimeout(temporizadorRef.current);
    temporizadorRef.current = undefined;
    setAtivo(false);
    setConfirmarSaida(false);
  }, [aulaEmAndamento]);

  // Bloqueio global da página enquanto o screensaver estiver aberto.
  useEffect(() => {
    if (!ativo) return;
    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;
    const prev = {
      htmlOverflow: html.style.overflow,
      htmlHeight: html.style.height,
      bodyOverflow: body.style.overflow,
      bodyHeight: body.style.height,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
      bodyTouch: body.style.touchAction,
    };
    html.style.setProperty("overflow", "hidden", "important");
    html.style.setProperty("height", "100%", "important");
    body.style.setProperty("overflow", "hidden", "important");
    body.style.setProperty("height", "100%", "important");
    body.style.setProperty("position", "fixed", "important");
    body.style.setProperty("top", `-${scrollY}px`, "important");
    body.style.setProperty("left", "0", "important");
    body.style.setProperty("right", "0", "important");
    body.style.setProperty("width", "100%", "important");
    body.style.setProperty("touch-action", "none", "important");
    return () => {
      html.style.overflow = prev.htmlOverflow;
      html.style.height = prev.htmlHeight;
      body.style.overflow = prev.bodyOverflow;
      body.style.height = prev.bodyHeight;
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.left = prev.bodyLeft;
      body.style.right = prev.bodyRight;
      body.style.width = prev.bodyWidth;
      body.style.touchAction = prev.bodyTouch;
      window.scrollTo(0, scrollY);
    };
  }, [ativo]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const desktop = window.matchMedia("(min-width: 900px) and (hover: hover) and (pointer: fine)");
    const bloqueada = ROTAS_EXCLUIDAS.some((rota) => pathname === rota || pathname.startsWith(rota + "/"));
    if (!authPronto || isAuthenticated) {\n      setAtivo(false);\n      setConfirmarSaida(false);\n      return;\n    }\n    if (!desktop.matches || bloqueada || (aulaEmAndamento && !protetorForcado)) {
      setAtivo(false);
      setConfirmarSaida(false);
      return;
    }

    if (protetorForcado) {\n      window.clearTimeout(temporizadorRef.current);\n      setConfirmarSaida(false);\n      setAtivo(true);\n      return () => window.clearTimeout(temporizadorRef.current);\n    }\n\n    const reiniciar = () => {
      // Se o protetor está montado, nenhuma movimentação do mouse/teclado
      // pode fechá-lo. A única saída é a confirmação explícita no diálogo.
      if (document.getElementById("screensaver-informatica")) return;
      setAtivo(false);
      setConfirmarSaida(false);
      window.clearTimeout(temporizadorRef.current);
      if (document.visibilityState === "visible") {
        temporizadorRef.current = window.setTimeout(() => {
          setConfirmarSaida(false);
          setAtivo(true);
        }, TEMPO_INATIVIDADE);
      }
    };
    const visibilidade = () => {
      if (document.visibilityState === "visible") reiniciar();
      else window.clearTimeout(temporizadorRef.current);
    };
    const eventos: Array<keyof WindowEventMap> = [
      "pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll",
    ];
    eventos.forEach((evento) => window.addEventListener(evento, reiniciar, { passive: true }));
    document.addEventListener("visibilitychange", visibilidade);
    reiniciar();
    return () => {
      window.clearTimeout(temporizadorRef.current);
      eventos.forEach((evento) => window.removeEventListener(evento, reiniciar));
      document.removeEventListener("visibilitychange", visibilidade);
    };
  }, [pathname, aulaEmAndamento, protetorForcado, authPronto, isAuthenticated]);

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
    if (protetorForcado) {\n      evento.preventDefault();\n      evento.stopPropagation();\n      return;\n    }\n    if (confirmarSaida) return;
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
    window.clearTimeout(temporizadorRef.current);
    temporizadorRef.current = window.setTimeout(() => setAtivo(true), TEMPO_INATIVIDADE);
  };

  if (!ativo || (isAuthenticated && authPronto)) return null;
  const horario = formatarHora(agora);

  return (
    <div
      id="screensaver-informatica"
      role="dialog"
      aria-modal="true"
      aria-label="Tela de descanso da plataforma Informática Dr. Eiraldo"
      onPointerDown={pedirConfirmacao}
      onKeyDown={pedirConfirmacao}
      tabIndex={-1}
      className="fixed inset-0 z-[9999] flex h-screen max-h-screen min-h-0 w-screen max-w-[100vw] items-center justify-center overflow-hidden overscroll-none bg-[#071329] px-[clamp(10px,2vw,28px)] py-[clamp(8px,1.5vh,16px)] text-white outline-none"
    >
      {/* Moldura neon discreta nos quatro cantos da janela. */}
      <div aria-hidden className="screensaver-neon-frame pointer-events-none absolute inset-0 z-[5] overflow-hidden">
        <span className="screensaver-neon-corner screensaver-neon-tl" />
        <span className="screensaver-neon-corner screensaver-neon-tr" />
        <span className="screensaver-neon-corner screensaver-neon-bl" />
        <span className="screensaver-neon-corner screensaver-neon-br" />
        <span className="screensaver-neon-edge screensaver-neon-top" />
        <span className="screensaver-neon-edge screensaver-neon-bottom" />
      </div>

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

      <main className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-none flex-col items-center justify-between overflow-hidden py-1 text-center">
        <header className="screensaver-avoid mb-1 flex shrink-0 flex-wrap items-center justify-center gap-2">
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

        <div className="flex shrink-0 items-center gap-2 text-[9px] font-bold uppercase tracking-[.24em] text-cyan-100/75 sm:text-[10px]">
          <Sparkles className="size-4" /> Tecnologia, conhecimento e criatividade
        </div>

        {/* Relógio redesenhado: painel editorial, leitura imediata e segundos discretos. */}
        <section
          aria-label={`Horário atual: ${horario.hora} e ${horario.segundos} segundos`}
          className="screensaver-avoid relative flex w-full max-w-[min(76vw,560px)] shrink-0 flex-col items-center justify-center"
        >
          <div className="relative w-full overflow-hidden rounded-[2rem] border border-white/[0.14] bg-slate-950/35 px-6 py-5 shadow-[0_24px_90px_rgba(0,0,0,.28)] backdrop-blur-2xl sm:px-10 sm:py-6">
            <div aria-hidden className="pointer-events-none absolute inset-x-[12%] top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />
            <div className="flex items-center justify-center gap-2 text-[9px] font-extrabold uppercase tracking-[.34em] text-cyan-100/65 sm:text-[10px]">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-40" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.8)]" />
              </span>
              Horário local
            </div>
            <div className="mt-2 flex items-center justify-center gap-3 sm:gap-5">
              <time className="font-heading text-[clamp(3.8rem,8vw,6.8rem)] font-semibold leading-[.95] tracking-[-.085em] tabular-nums text-white [font-variant-numeric:tabular-nums] drop-shadow-[0_8px_32px_rgba(34,211,238,.16)]">
                {horario.hora}
              </time>
              <div className="mb-1 flex min-w-[3.2rem] flex-col items-center justify-center border-l border-white/15 pl-3 sm:min-w-[4rem] sm:pl-5">
                <span className="font-heading text-2xl font-semibold leading-none tabular-nums text-cyan-100 sm:text-3xl">{horario.segundos}</span>
                <span className="mt-1.5 text-[8px] font-bold uppercase tracking-[.25em] text-white/40">seg</span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 border-t border-white/[0.09] pt-3 text-[11px] font-medium capitalize tracking-[.04em] text-blue-100/70 sm:text-xs">
              <Clock3 className="size-3.5 text-cyan-200/70" />
              {formatarData(agora)}
            </div>
          </div>
        </section>

        <div className="screensaver-avoid flex shrink-0 items-center justify-center gap-2 text-[9px] font-semibold tracking-[.08em] text-white/45 sm:text-[10px]">
          <span className="size-1 rounded-full bg-cyan-200/70" />
          Descanso automático após 60 segundos de inatividade
        </div>

        <button
          type="button"
          onPointerDown={(evento) => evento.stopPropagation()}
          onKeyDown={(evento) => evento.stopPropagation()}
          onClick={ativarTelaCheia}
          className="screensaver-avoid mb-1 inline-flex min-h-8 shrink-0 items-center justify-center gap-2 rounded-full border border-cyan-100/35 bg-cyan-300/10 px-4 py-1.5 text-[9px] font-extrabold uppercase tracking-[.15em] text-cyan-50 shadow-lg backdrop-blur transition hover:bg-cyan-300/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
        >
          <Maximize2 className="size-4" /> {telaCheia ? "Modo tela cheia ativado" : "Ativar modo tela cheia"}
        </button>

        <section aria-label="Monitoramento do laboratório" className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-[1.25rem] border border-cyan-100/20 bg-[#061329]/80 p-2 text-left shadow-[0_28px_90px_rgba(0,0,0,.42)] backdrop-blur-2xl sm:p-3">
          <div className="relative isolate min-h-[clamp(180px,28vh,280px)] flex-1 overflow-hidden rounded-xl border border-cyan-100/20 bg-[radial-gradient(ellipse_at_72%_42%,rgba(26,105,173,.35),transparent_48%),linear-gradient(120deg,#06101f_0%,#0a1d38_52%,#071226_100%)]">
            <div aria-hidden className="absolute inset-0 opacity-[.16]" style={{ backgroundImage: "linear-gradient(rgba(130,220,255,.28) 1px,transparent 1px),linear-gradient(90deg,rgba(130,220,255,.28) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_50%,transparent_0%,rgba(2,8,23,.12)_48%,rgba(2,8,23,.75)_100%)]" />
            <div aria-hidden className="absolute -right-16 top-1/2 size-[330px] -translate-y-1/2 rounded-full border border-cyan-300/10 shadow-[0_0_70px_rgba(34,211,238,.08)] sm:size-[470px]" />
            <div aria-hidden className="absolute -right-4 top-1/2 size-[250px] -translate-y-1/2 rounded-full border border-cyan-300/15 sm:size-[360px]" />
            <div aria-hidden className="absolute right-[13%] top-[18%] h-[65%] w-px rotate-[38deg] bg-gradient-to-b from-transparent via-cyan-200/40 to-transparent blur-[1px]" />

            <div className="absolute left-4 top-4 z-10 flex items-center gap-2.5 sm:left-7 sm:top-7">
              <span className="relative flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-70" />
                <span className="relative inline-flex size-3 rounded-full bg-red-500 shadow-[0_0_15px_4px_rgba(239,68,68,.55)]" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-[.22em] text-white/90 sm:text-xs">Monitorando …</span>
            </div>
            <div className="screensaver-avoid absolute left-4 top-[4.2rem] z-10 max-w-[42%] sm:left-7 sm:top-[5.2rem]">
              <p className="text-[9px] font-bold uppercase tracking-[.2em] text-cyan-200/65">Informática educativa</p>
              <h2 className="mt-2 font-heading text-xl font-black leading-tight text-white drop-shadow-lg sm:text-3xl">Laboratório<br/>de informática</h2>
              <p className="mt-2 text-[10px] font-medium leading-relaxed text-blue-100/65 sm:text-xs">Escola Municipal Dr. Eiraldo Carneiro de França</p>
              <div className="mt-5 flex items-center gap-2">
                <span className="h-1 w-14 overflow-hidden rounded-full bg-white/10 sm:w-20">
                  <span className="block h-full w-1/2 rounded-full bg-cyan-300 shadow-[0_0_12px_2px_rgba(34,211,238,.7)] motion-safe:animate-[cameraProgress_3.8s_ease-in-out_infinite_alternate]" />
                </span>
                <span className="font-mono text-[8px] tracking-[.14em] text-cyan-100/55">CAM 01</span>
              </div>
            </div>



            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/80 to-transparent shadow-[0_0_20px_3px_rgba(34,211,238,.45)] motion-safe:animate-[cctvScan_5s_linear_infinite]" />
            <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-end justify-between gap-2 sm:bottom-6 sm:left-7 sm:right-7">
              <span className="rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-[8px] font-bold uppercase tracking-[.15em] text-white/65 backdrop-blur-md">Escola Municipal · Dr. Eiraldo Carneiro de França</span>
              <span className="rounded-lg border border-cyan-200/20 bg-cyan-300/10 px-3 py-2 font-mono text-[8px] font-bold tracking-[.14em] text-cyan-100/80 backdrop-blur-md">SISTEMA ATIVO</span>
            </div>
            <div aria-hidden className="pointer-events-none absolute inset-3 border border-white/[.07]">
              <span className="absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-cyan-100/70"/>
              <span className="absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-cyan-100/70"/>
              <span className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-cyan-100/70"/>
              <span className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-cyan-100/70"/>
            </div>
          </div>

          <div className="mt-2 grid shrink-0 grid-cols-[auto_1fr] items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl border border-cyan-100/20 bg-cyan-300/10 text-cyan-100">
              <ShieldCheck className="size-7" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.18em] text-cyan-200">
                <ShieldCheck className="size-4" /> Cuidado e responsabilidade
              </div>
              <h2 className="mt-0.5 font-heading text-xs font-extrabold leading-snug text-white sm:text-sm">
                Nosso laboratório é um espaço de respeito, aprendizagem e cuidado.
              </h2>
              <p className="mt-0.5 text-[9px] leading-snug text-blue-100/75 sm:text-[10px]">
                Cuide dos equipamentos, respeite os colegas e siga as orientações dos educadores.
                A tecnologia é uma ferramenta para aprender, criar e compartilhar.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-1 grid w-full shrink-0 grid-cols-3 gap-2">
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

        <ConstelacaoNomes
          sessoes={[]}
          logado={false}
          grande
          evitar=".screensaver-avoid"
          className="z-30 inset-x-0 top-[16%] bottom-[14%] h-auto w-full"
        />

        <footer className="screensaver-avoid mt-1 flex shrink-0 flex-col items-center gap-0.5 text-center">
          <div className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[.17em] text-white/60">
            <Wifi className="size-3.5 text-cyan-200/75" /> Escola Municipal Dr. Eiraldo Carneiro de França
          </div>
          <p className="text-[8px] font-semibold uppercase tracking-[.2em] text-white/35">Informática Educativa · Um espaço para aprender e descobrir</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-white/10 bg-white/[.045] px-3 py-1.5 text-[9px] text-white/55">
            <span className="font-semibold uppercase tracking-[.12em]">Desenvolvimento e professor de informática</span>
            <span className="text-amber-200/90">Franc D’nis</span>
          </div>
        </footer>
      </main>

      {/* Câmera de segurança vista de frente: a lente encara quem está diante da tela e faz pequenas varreduras. */}
      <div className="screensaver-avoid pointer-events-none absolute right-[3%] top-[36%] z-20 flex h-[min(31vh,270px)] w-[min(24vw,260px)] items-start justify-center">
        <div role="img" aria-label="Câmera de segurança monitorando o laboratório" className="relative aspect-[400/440] h-full max-w-full drop-shadow-[0_24px_30px_rgba(0,0,0,.55)]">
          <svg viewBox="0 0 400 440" aria-hidden className="absolute inset-0 h-full w-full overflow-visible">
            <defs>
              <linearGradient id="cctvShell" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffffff"/><stop offset=".4" stopColor="#eef2f6"/><stop offset=".78" stopColor="#c2ccd6"/><stop offset="1" stopColor="#8e9aa7"/>
              </linearGradient>
              <linearGradient id="cctvSideGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#a6b1bc"/><stop offset="1" stopColor="#5d6875"/>
              </linearGradient>
              <linearGradient id="cctvMount" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#aab5c0"/><stop offset=".5" stopColor="#f3f6f9"/><stop offset="1" stopColor="#8995a2"/>
              </linearGradient>
              <radialGradient id="cctvFace" cx=".4" cy=".32" r=".8">
                <stop offset="0" stopColor="#2c3949"/><stop offset=".5" stopColor="#0c131d"/><stop offset="1" stopColor="#02050a"/>
              </radialGradient>
              <radialGradient id="cctvBarrel" cx=".4" cy=".35" r=".75">
                <stop offset="0" stopColor="#5b6878"/><stop offset=".55" stopColor="#1b2430"/><stop offset="1" stopColor="#06090e"/>
              </radialGradient>
              <radialGradient id="cctvGlass" cx=".38" cy=".32" r=".8">
                <stop offset="0" stopColor="#7fd3ff"/><stop offset=".25" stopColor="#1f5f93"/><stop offset=".6" stopColor="#0a2240"/><stop offset="1" stopColor="#020812"/>
              </radialGradient>
              <filter id="cctvGlow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>

            {/* Suporte fixo no teto e pescoço da articulação (não se movem) */}
            <rect x="140" y="4" width="120" height="24" rx="10" fill="url(#cctvMount)" stroke="#6f7c89" strokeWidth="3"/>
            <circle cx="160" cy="16" r="4" fill="#5b6876"/><circle cx="240" cy="16" r="4" fill="#5b6876"/>
            <rect x="184" y="26" width="32" height="58" rx="10" fill="url(#cctvMount)" stroke="#6f7c89" strokeWidth="3"/>
            <circle cx="200" cy="84" r="20" fill="url(#cctvMount)" stroke="#6f7c89" strokeWidth="3"/>

            {/*
              Giro PTZ simulado por paralaxe: cada camada desloca uma distância diferente
              (lateral da carcaça aparece, frente e lente avançam mais), então o cabeçote
              parece virar sem esticar. Movimento linear com paradas secas.
            */}
            <g className="motion-safe:animate-[cctvSide_22s_linear_infinite]">
              <rect x="70" y="112" width="260" height="300" rx="96" fill="url(#cctvSideGrad)" stroke="#5f6b78" strokeWidth="3"/>
              <path d="M46 150 Q46 104 96 100 L304 100 Q354 104 354 150 L354 162 L46 162 Z" fill="#8995a2" stroke="#5f6b78" strokeWidth="3"/>
            </g>
            <g className="motion-safe:animate-[cctvShellMove_22s_linear_infinite]">
              <path d="M46 150 Q46 104 96 100 L304 100 Q354 104 354 150 L354 162 L46 162 Z" fill="url(#cctvShell)" stroke="#7b8895" strokeWidth="3"/>
              <rect x="70" y="112" width="260" height="300" rx="96" fill="url(#cctvShell)" stroke="#7b8895" strokeWidth="3"/>
              <path d="M96 128 Q200 112 304 128" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" opacity=".85"/>
              <g className="motion-safe:animate-[cctvRec_1.3s_steps(1,end)_infinite]">
                <circle cx="178" cy="393" r="5.5" fill="#ef4444" filter="url(#cctvGlow)"/>
                <circle cx="176.5" cy="391.5" r="2" fill="#fecaca"/>
              </g>
              <text x="190" y="398" fontFamily="ui-monospace, monospace" fontSize="14" fontWeight="800" letterSpacing="2" fill="#dc2626">REC</text>
            </g>
            <g className="motion-safe:animate-[cctvFaceMove_22s_linear_infinite]">
              <circle cx="200" cy="262" r="112" fill="url(#cctvFace)" stroke="#05080d" strokeWidth="6"/>
              <circle cx="200" cy="262" r="104" fill="none" stroke="#3b4859" strokeWidth="2" opacity=".8"/>
              {Array.from({ length: 12 }, (_, i) => {
                const a = (i / 12) * Math.PI * 2;
                return <g key={i}><circle cx={200 + 88 * Math.cos(a)} cy={262 + 88 * Math.sin(a)} r="6" fill="#1a0d10" stroke="#3a2026" strokeWidth="1.5"/><circle cx={200 + 88 * Math.cos(a)} cy={262 + 88 * Math.sin(a)} r="2.6" fill="#b91c1c" opacity=".7"/></g>;
              })}
            </g>
            <g className="motion-safe:animate-[cctvLensMove_22s_linear_infinite]">
              <circle cx="200" cy="262" r="66" fill="url(#cctvBarrel)" stroke="#5c6a7a" strokeWidth="3"/>
              <circle cx="200" cy="262" r="54" fill="#05080d" stroke="#2b3644" strokeWidth="3"/>
            </g>
            <g className="motion-safe:animate-[cctvGlassMove_22s_linear_infinite]">
              {/* Zoom óptico: a lente aproxima quando a câmera para em cada ponto */}
              <g className="motion-safe:animate-[cctvZoom_22s_linear_infinite]" style={{ transformOrigin: "center", transformBox: "fill-box" }}>
                <circle cx="200" cy="262" r="42" fill="url(#cctvGlass)" stroke="#2f6d9c" strokeWidth="2"/>
                <circle cx="200" cy="262" r="30" fill="none" stroke="#7dd3fc" strokeOpacity=".25" strokeWidth="1.5"/>
                <circle cx="200" cy="262" r="16" fill="#02060c"/>
                <circle cx="200" cy="262" r="5" fill="#38bdf8" opacity=".55" filter="url(#cctvGlow)"/>
              </g>
              <ellipse cx="180" cy="240" rx="14" ry="8" fill="#ffffff" opacity=".55" transform="rotate(-35 180 240)"/>
              <circle cx="222" cy="284" r="3.5" fill="#ffffff" opacity=".35"/>
            </g>
          </svg>
        </div>
      </div>

      {confirmarSaida && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden bg-[#020817]/75 p-4 backdrop-blur-md"
          role="presentation"
          onPointerDown={(evento) => evento.stopPropagation()}
          onKeyDown={(evento) => evento.stopPropagation()}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirmar-saida-titulo"
            aria-describedby="confirmar-saida-descricao"
            className="w-full max-w-md rounded-[1.7rem] border border-white/15 bg-[#101f3d] p-5 text-center shadow-[0_30px_100px_rgba(0,0,0,.55)]"
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
                <Check className="size-4" /> Sim, voltar à plataforma <ArrowRight className="size-4" />
              </button>
            </div>
          </section>
        </div>
      )}
      <style>{`

        html:has(#screensaver-informatica), body:has(#screensaver-informatica) { overflow: hidden !important; height: 100% !important; }
        body:has(#screensaver-informatica) { position: fixed !important; inset: 0 !important; width: 100% !important; }
        #screensaver-informatica { position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important; max-height: 100vh !important; overflow: hidden !important; overscroll-behavior: none; scrollbar-width: none; overscroll-behavior: none; scrollbar-width: none; }
        #screensaver-informatica::-webkit-scrollbar,
        #screensaver-informatica *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        #screensaver-informatica * { scrollbar-width: none; }
        .screensaver-neon-corner { position:absolute; width:clamp(42px,5vw,76px); height:clamp(42px,5vh,76px); opacity:.72; filter:drop-shadow(0 0 7px rgba(103,232,249,.45)); }
        .screensaver-neon-corner::before,.screensaver-neon-corner::after { content:"";position:absolute;border-radius:99px;background:linear-gradient(90deg,rgba(103,232,249,.08),rgba(125,211,252,.9));box-shadow:0 0 7px rgba(103,232,249,.55),0 0 18px rgba(59,130,246,.24); }
        .screensaver-neon-corner::before { width:100%;height:2px; }
        .screensaver-neon-corner::after { width:2px;height:100%; }
        .screensaver-neon-tl { top:clamp(10px,1.6vh,22px);left:clamp(10px,1.2vw,22px); }
        .screensaver-neon-tr { top:clamp(10px,1.6vh,22px);right:clamp(10px,1.2vw,22px);transform:rotate(90deg); }
        .screensaver-neon-bl { bottom:clamp(10px,1.6vh,22px);left:clamp(10px,1.2vw,22px);transform:rotate(-90deg); }
        .screensaver-neon-br { bottom:clamp(10px,1.6vh,22px);right:clamp(10px,1.2vw,22px);transform:rotate(180deg); }
        .screensaver-neon-edge { position:absolute;left:12%;right:12%;height:1px;opacity:.22;background:linear-gradient(90deg,transparent,rgba(103,232,249,.65),transparent);box-shadow:0 0 8px rgba(103,232,249,.25); }
        .screensaver-neon-top { top:0; } .screensaver-neon-bottom { bottom:0; }
        @keyframes screensaverNeonPulse { 0%,100% { opacity:.48;filter:drop-shadow(0 0 4px rgba(103,232,249,.25)); } 50% { opacity:.9;filter:drop-shadow(0 0 10px rgba(103,232,249,.65)); } }
        .screensaver-neon-corner { animation:screensaverNeonPulse 5.5s ease-in-out infinite; }
        .screensaver-neon-tr { animation-delay:1.2s; } .screensaver-neon-bl { animation-delay:2.4s; } .screensaver-neon-br { animation-delay:3.6s; }
        @media (prefers-reduced-motion: reduce) { .screensaver-neon-corner { animation:none; } }
\n                @keyframes cameraSweep { 0%, 15% { transform: translateX(-180%); } 75%, 100% { transform: translateX(330%); } }
        @keyframes cameraLine { 0%, 100% { transform: translateY(0); opacity: .25; } 50% { transform: translateY(170px); opacity: .9; } }
        @keyframes cctvRoomPan { 0% { transform: scale(1.04) translate3d(-.5%,0,0); } 100% { transform: scale(1.14) translate3d(.7%,-.6%,0); } }
        @keyframes cctvScan { 0% { transform: translateY(0); opacity: .18; } 50% { opacity: .8; } 100% { transform: translateY(350px); opacity: .18; } }
        @keyframes cctvSide {
          0% { transform: translate(0px,0px); }
          8% { transform: translate(0px,0px); }
          22% { transform: translate(14px,0px); }
          38% { transform: translate(14px,0px); }
          60% { transform: translate(-14px,2px); }
          76% { transform: translate(-14px,2px); }
          90% { transform: translate(0px,0px); }
          100% { transform: translate(0px,0px); }
        }
        @keyframes cctvShellMove {
          0% { transform: translate(0px,0px); }
          8% { transform: translate(0px,0px); }
          22% { transform: translate(-7px,0px); }
          38% { transform: translate(-7px,0px); }
          60% { transform: translate(7px,3px); }
          76% { transform: translate(7px,3px); }
          90% { transform: translate(0px,0px); }
          100% { transform: translate(0px,0px); }
        }
        @keyframes cctvFaceMove {
          0% { transform: translate(0px,0px); }
          8% { transform: translate(0px,0px); }
          22% { transform: translate(-16px,0px); }
          38% { transform: translate(-16px,0px); }
          60% { transform: translate(16px,6px); }
          76% { transform: translate(16px,6px); }
          90% { transform: translate(0px,0px); }
          100% { transform: translate(0px,0px); }
        }
        @keyframes cctvLensMove {
          0% { transform: translate(0px,0px); }
          8% { transform: translate(0px,0px); }
          22% { transform: translate(-24px,0px); }
          38% { transform: translate(-24px,0px); }
          60% { transform: translate(24px,8px); }
          76% { transform: translate(24px,8px); }
          90% { transform: translate(0px,0px); }
          100% { transform: translate(0px,0px); }
        }
        @keyframes cctvGlassMove {
          0% { transform: translate(0px,0px); }
          8% { transform: translate(0px,0px); }
          22% { transform: translate(-31px,0px); }
          38% { transform: translate(-31px,0px); }
          60% { transform: translate(31px,10px); }
          76% { transform: translate(31px,10px); }
          90% { transform: translate(0px,0px); }
          100% { transform: translate(0px,0px); }
        }
        @keyframes cctvZoom {
          0%, 2% { transform: scale(1); } 4%, 7% { transform: scale(1.14); } 8% { transform: scale(1); }
          22%, 25% { transform: scale(1); } 28%, 36% { transform: scale(1.16); } 38% { transform: scale(1); }
          60%, 63% { transform: scale(1); } 66%, 74% { transform: scale(1.16); } 76% { transform: scale(1); }
          90%, 93% { transform: scale(1); } 96%, 100% { transform: scale(1.1); }
        }
        @keyframes cctvRec { 0% { opacity: 1; } 55% { opacity: .12; } }
        @keyframes cameraFloat { 0%, 100% { transform: translate3d(0,0,0) rotate(-.7deg); } 50% { transform: translate3d(0,-9px,0) rotate(.7deg); } }
        @keyframes cameraPivot { 0% { transform: rotate(-1.2deg) translateX(-2px); } 50% { transform: rotate(.8deg) translateX(3px); } 100% { transform: rotate(-.4deg) translateX(0); } }
        @keyframes lensPulse { 0%, 100% { opacity: .18; transform: scale(.97); } 50% { opacity: .7; transform: scale(1.035); } }
        @keyframes cameraProgress { 0% { transform: translateX(-55%); } 100% { transform: translateX(110%); } }
        #screensaver-informatica .constelacao-lab { z-index: 30; }\n        #screensaver-informatica .constelacao-texto { font-size: clamp(1.2rem, 2.2vw, 2.4rem); }\n        #screensaver-informatica .constelacao-legenda { font-size: clamp(.55rem, .8vw, .72rem); }\n        @media (max-height: 760px) { #screensaver-informatica main { gap: 2px; } #screensaver-informatica main > section[aria-label="Monitoramento do laboratório"] { min-height: 0; } #screensaver-informatica main > section[aria-label="Monitoramento do laboratório"] > div:first-child { min-height: 0; } #screensaver-informatica main > div.mt-1.grid.w-full.shrink-0.grid-cols-3 { display: none; } #screensaver-informatica main > section[aria-label="Alunos do laboratório"] { display: none; } #screensaver-informatica main > footer { display: none; } }\n        @media (prefers-reduced-motion: reduce) {
          [class*="animate-"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
