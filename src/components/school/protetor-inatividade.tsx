import { useEffect, useState, useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { FaixaTurmas, VitrineNomes } from "@/components/school/vitrine-nomes";
import "@/styles/descanso-tela.css";
import { estadoDaSessao, useSessoesLab } from "@/lib/laboratorio";
import { useAuth } from "@/lib/auth-store";
import { supabase } from "@/lib/supabase-client";
import {
  ArrowRight, BookOpen, Check, Code2, Cpu, Maximize2, Monitor, ShieldCheck, X,
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

/**
 * Relógio com estado próprio: só ele atualiza a cada segundo, sem redesenhar
 * a câmera, a vitrine e a faixa de nomes (isso fazia os nomes engasgarem).
 */
function RelogioDescanso() {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setAgora(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const horario = formatarHora(agora);
  return (
    <div aria-label={`Horário atual: ${horario.hora} e ${horario.segundos} segundos`}>
      <div className="mt-[1.5vh] flex items-start gap-[1.4vw]">
        <time className="descanso-hora">{horario.hora}</time>
        <span className="descanso-segundos">{horario.segundos}</span>
      </div>
      <p className="descanso-data">{formatarData(agora)}</p>
    </div>
  );
}

/** Tela de descanso visual para computadores após 60 segundos sem interação. */
export function ProtetorInatividade({ pathname }: { pathname: string }) {
  const [ativo, setAtivo] = useState(false);
  const [confirmarSaida, setConfirmarSaida] = useState(false);
  const [telaCheia, setTelaCheia] = useState(false);
  const [protetorForcado, setProtetorForcado] = useState(false);
  const [descansoDesativado, setDescansoDesativado] = useState(false);
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
        const config = data?.config as { protetorForcado?: boolean; descansoTelaDesativado?: boolean } | null;
        setProtetorForcado(Boolean(config?.protetorForcado));
        setDescansoDesativado(Boolean(config?.descansoTelaDesativado));
      }
    };
    void carregar();
    const polling = window.setInterval(() => void carregar(), 10_000);
    const canal = supabase
      .channel("protetor-tela-global")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_state", filter: "id=eq.default" }, (payload) => {
        const row = (payload.new ?? {}) as { config?: { protetorForcado?: boolean; descansoTelaDesativado?: boolean } };
        setProtetorForcado(Boolean(row.config?.protetorForcado));
        setDescansoDesativado(Boolean(row.config?.descansoTelaDesativado));
      })
      .subscribe();
    return () => {
      cancelado = true;
      window.clearInterval(polling);
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
    if (!aulaEmAndamento || protetorForcado) return;
    window.clearTimeout(temporizadorRef.current);
    temporizadorRef.current = undefined;
    setAtivo(false);
    setConfirmarSaida(false);
  }, [aulaEmAndamento, protetorForcado]);

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
    if (descansoDesativado) {
      window.clearTimeout(temporizadorRef.current);
      setAtivo(false);
      setConfirmarSaida(false);
      return;
    }
    if (!authPronto || isAuthenticated) {
      setAtivo(false);
      setConfirmarSaida(false);
      return;
    }
    if ((!desktop.matches && !protetorForcado) || (bloqueada && !protetorForcado) || (aulaEmAndamento && !protetorForcado)) {
      setAtivo(false);
      setConfirmarSaida(false);
      return;
    }

    if (protetorForcado) {
      window.clearTimeout(temporizadorRef.current);
      setConfirmarSaida(false);
      setAtivo(true);
      return () => window.clearTimeout(temporizadorRef.current);
    }

    const reiniciar = () => {
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
  }, [pathname, aulaEmAndamento, protetorForcado, descansoDesativado, authPronto, isAuthenticated]);

  useEffect(() => {
    const atualizar = () => setTelaCheia(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", atualizar);
    atualizar();
    return () => document.removeEventListener("fullscreenchange", atualizar);
  }, []);


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
    if (protetorForcado) {
      evento.preventDefault();
      evento.stopPropagation();
      return;
    }
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
    window.clearTimeout(temporizadorRef.current);
    temporizadorRef.current = window.setTimeout(() => setAtivo(true), TEMPO_INATIVIDADE);
  };

  if (!ativo || (isAuthenticated && authPronto)) return null;

  return (
    <div
      id="screensaver-informatica"
      role="dialog"
      aria-modal="true"
      aria-label="Tela de descanso da plataforma Informática Dr. Eiraldo"
      onPointerDown={pedirConfirmacao}
      onKeyDown={pedirConfirmacao}
      tabIndex={-1}
      className="descanso fixed inset-0 z-[9999] h-screen max-h-screen w-screen max-w-[100vw] overflow-hidden overscroll-none bg-[#040914] text-white outline-none"
    >
      {/* Fundo: fitas de luz em alta resolução, brilho que respira devagar e grão fino. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <img
          src="/images/descanso-fundo-2560w.webp"
          srcSet="/images/descanso-fundo-1600w.webp 1600w, /images/descanso-fundo-2560w.webp 2560w"
          sizes="100vw"
          alt=""
          className="descanso-fundo h-full w-full object-cover object-right"
        />
        <div className="descanso-aurora descanso-aurora-um" />
        <div className="descanso-aurora descanso-aurora-dois" />
        <div className="descanso-pontos" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(2,5,12,.55)_100%)]" />
      </div>

      <div className="descanso-grade relative z-10 h-full w-full">
        {/* Topo: marca e situação do laboratório. */}
        <header className="descanso-topo">
          <div className="flex items-center gap-3.5">
            <span className="flex size-11 items-center justify-center rounded-[14px] border border-white/15 bg-gradient-to-br from-indigo-400/90 to-blue-700/90 shadow-[0_10px_30px_rgba(37,99,235,.35)]">
              <Monitor className="size-5 text-white" />
            </span>
            <span className="text-left leading-tight">
              <span className="block font-heading text-lg font-bold tracking-tight">informática<span className="text-amber-300">.</span></span>
              <span className="block text-[10px] font-semibold uppercase tracking-[.26em] text-white/45">Escola Municipal Dr. Eiraldo Carneiro de França</span>
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="descanso-chip">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-50" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-300" />
              </span>
              Laboratório · Sistema ativo
            </span>
            <button
              type="button"
              onPointerDown={(evento) => evento.stopPropagation()}
              onKeyDown={(evento) => evento.stopPropagation()}
              onClick={ativarTelaCheia}
              className="descanso-chip transition hover:border-white/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
            >
              <Maximize2 className="size-3.5" /> {telaCheia ? "Tela cheia" : "Ativar tela cheia"}
            </button>
          </div>
        </header>

        {/* Coluna principal: relógio editorial e mensagem do laboratório. */}
        <section className="descanso-principal">
          <p className="descanso-eyebrow">
            <span className="h-px w-10 bg-gradient-to-r from-cyan-300 to-transparent" /> Laboratório de Informática Educativa
          </p>
          <RelogioDescanso />

          <div className="descanso-mensagem">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-cyan-200/80" />
            <div>
              <p className="font-heading text-[clamp(1rem,1.25vw,1.4rem)] font-semibold leading-snug text-white/90">
                Nosso laboratório é um espaço de respeito, aprendizagem e cuidado.
              </p>
              <p className="mt-1.5 text-[clamp(.78rem,.85vw,.95rem)] leading-relaxed text-white/50">
                Cuide dos equipamentos, respeite os colegas e siga as orientações dos educadores.
              </p>
            </div>
          </div>

          <ul className="descanso-pilares">
            {[
              { Icon: BookOpen, label: "Aprendizagem" },
              { Icon: Cpu, label: "Tecnologia" },
              { Icon: Code2, label: "Criatividade" },
            ].map(({ Icon, label }) => (
              <li key={label}>
                <Icon className="size-3.5 text-cyan-200/70" /> {label}
              </li>
            ))}
          </ul>
        </section>

        {/* Coluna lateral: câmera de monitoramento presa no teto e vitrine de alunos. */}
        <aside className="descanso-lateral">
          <div className="descanso-camera">
            <div className="descanso-camera-figura">
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
            <div className="descanso-camera-hud">
              <span className="descanso-rec" /> REC · CAM 01 · Monitorando o laboratório
            </div>
          </div>
          <VitrineNomes />
        </aside>

        {/* Rodapé: todas as turmas em faixa contínua e créditos. */}
        <footer className="descanso-rodape">
          <FaixaTurmas />
          <div className="mt-[1.6vh] flex items-center justify-between gap-4 text-[10px] font-semibold uppercase tracking-[.22em] text-white/35">
            <span>Tecnologia · Conhecimento · Criatividade</span>
            <span>
              Desenvolvimento e professor de informática <span className="text-amber-200/80">Franc D’nis</span>
            </span>
            <span>{protetorForcado ? "Descanso ativado pelo professor" : "Toque para voltar à plataforma"}</span>
          </div>
        </footer>
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
        #screensaver-informatica { position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important; max-height: 100vh !important; overflow: hidden !important; overscroll-behavior: none; scrollbar-width: none; }
        #screensaver-informatica::-webkit-scrollbar,
        #screensaver-informatica *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        #screensaver-informatica * { scrollbar-width: none; }
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
        @media (prefers-reduced-motion: reduce) {
          #screensaver-informatica [class*="animate-"], #screensaver-informatica * { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
