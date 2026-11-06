import { useEffect, useMemo, useState, useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { useAppStore } from "@/lib/app-store";
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
  const temporizadorRef = useRef<number | undefined>(undefined);
  const { turmas } = useAppStore();
  const alunosAtivos = useMemo(
    () => turmas.flatMap((turma) =>
      turma.alunos
        .filter((aluno) => !aluno.situacao || aluno.situacao === "ativo")
        .map((aluno) => {
          const partes = aluno.nome.trim().split(/\s+/).filter(Boolean);
          const nomeExibicao = partes.length > 1
            ? `${partes[0]} ${partes[1].charAt(0).toLocaleUpperCase("pt-BR")}.`
            : (partes[0] ?? "Aluno");
          return { id: aluno.id, nome: nomeExibicao, turma: `${turma.serie}º ${turma.letra}` };
        }),
    ),
    [turmas],
  );
  const [alunosEmDestaque, setAlunosEmDestaque] = useState<typeof alunosAtivos>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const desktop = window.matchMedia("(min-width: 900px) and (hover: hover) and (pointer: fine)");
    const bloqueada = ROTAS_EXCLUIDAS.some((rota) => pathname === rota || pathname.startsWith(rota + "/"));
    if (!desktop.matches || bloqueada) {
      setAtivo(false);
      setConfirmarSaida(false);
      return;
    }

    const reiniciar = (evento?: Event) => {
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
  }, [pathname]);

  useEffect(() => {
    const atualizar = () => setTelaCheia(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", atualizar);
    atualizar();
    return () => document.removeEventListener("fullscreenchange", atualizar);
  }, []);

  useEffect(() => {
    if (!alunosAtivos.length) {
      setAlunosEmDestaque([]);
      return;
    }
    // Embaralhamento local: não altera a ordem nem os dados do cadastro.
    const embaralhados = [...alunosAtivos];
    for (let i = embaralhados.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [embaralhados[i], embaralhados[j]] = [embaralhados[j], embaralhados[i]];
    }
    setAlunosEmDestaque(embaralhados);
  }, [alunosAtivos]);

  useEffect(() => {
    if (!ativo || alunosEmDestaque.length <= 3) return;
    const id = window.setInterval(() => {
      setAlunosEmDestaque((atuais) => {
        if (atuais.length <= 3) return atuais;
        return [...atuais.slice(1), atuais[0]];
      });
    }, 6500);
    return () => window.clearInterval(id);
  }, [ativo, alunosEmDestaque.length]);

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
    window.clearTimeout(temporizadorRef.current);
    temporizadorRef.current = window.setTimeout(() => setAtivo(true), TEMPO_INATIVIDADE);
  };

  if (!ativo) return null;
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
      className="fixed inset-0 z-[9999] flex h-[100dvh] min-h-0 items-center justify-center overflow-hidden bg-[#071329] px-[clamp(10px,2vw,28px)] py-[clamp(8px,1.5vh,16px)] text-white outline-none"
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

      <main className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col items-center justify-between overflow-hidden py-1 text-center">
        <header className="mb-1 flex shrink-0 flex-wrap items-center justify-center gap-2">
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

        {/* Relógio único: horas e minutos em destaque, segundos discretos ao lado. */}
        <section aria-label={`Horário atual: ${horario.hora} e ${horario.segundos} segundos`} className="flex shrink-0 items-end justify-center gap-2">
          <time className="font-heading text-[clamp(3.2rem,8.5vw,6.5rem)] font-black leading-[.92] tracking-[-.075em] tabular-nums text-white drop-shadow-[0_8px_36px_rgba(75,125,255,.34)]">
            {horario.hora}
          </time>
          <span className="mb-1 rounded-xl border border-cyan-100/20 bg-cyan-200/10 px-3 py-2 text-left backdrop-blur-md">
            <span className="block font-mono text-2xl font-bold tabular-nums text-cyan-100 sm:text-3xl">{horario.segundos}</span>
            <span className="block text-[8px] font-extrabold tracking-[.18em] text-cyan-100/55">SEG</span>
          </span>
        </section>
        <p className="mb-1 shrink-0 text-xs font-medium capitalize text-blue-100/75 sm:text-sm">{formatarData(agora)}</p>

        <div className="mb-1 flex shrink-0 flex-wrap items-center justify-center gap-2 rounded-full border border-white/15 bg-slate-950/30 px-4 py-1.5 text-[10px] font-semibold text-white/85 shadow-xl backdrop-blur-xl sm:text-xs">
          <Clock3 className="size-4 text-cyan-200" />
          Tela de descanso ativada após 60 segundos sem interação
        </div>

        <button
          type="button"
          onPointerDown={(evento) => evento.stopPropagation()}
          onKeyDown={(evento) => evento.stopPropagation()}
          onClick={ativarTelaCheia}
          className="mb-1 inline-flex min-h-8 shrink-0 items-center justify-center gap-2 rounded-full border border-cyan-100/35 bg-cyan-300/10 px-4 py-1.5 text-[9px] font-extrabold uppercase tracking-[.15em] text-cyan-50 shadow-lg backdrop-blur transition hover:bg-cyan-300/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
        >
          <Maximize2 className="size-4" /> {telaCheia ? "Modo tela cheia ativado" : "Ativar modo tela cheia"}
        </button>

        <section aria-label="Monitoramento do laboratório" className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-[1.25rem] border border-cyan-100/20 bg-[#061329]/80 p-2 text-left shadow-[0_28px_90px_rgba(0,0,0,.42)] backdrop-blur-2xl sm:p-3">
          <div className="relative isolate min-h-0 flex-1 overflow-hidden rounded-xl border border-cyan-100/20 bg-[radial-gradient(ellipse_at_72%_42%,rgba(26,105,173,.35),transparent_48%),linear-gradient(120deg,#06101f_0%,#0a1d38_52%,#071226_100%)]">
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
            <div className="absolute left-4 top-[4.2rem] z-10 max-w-[42%] sm:left-7 sm:top-[5.2rem]">
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

            <div className="pointer-events-none absolute -right-2 top-[13%] z-[2] w-[65%] max-w-[590px] sm:right-4 sm:top-[8%] sm:w-[62%]">
              <svg viewBox="0 0 760 520" role="img" aria-label="Câmera de segurança tridimensional" className="h-auto w-full overflow-visible drop-shadow-[0_28px_28px_rgba(0,0,0,.55)] motion-safe:animate-[cameraFloat_6s_ease-in-out_infinite]">
                <defs>
                  <linearGradient id="camBody" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#ffffff"/><stop offset=".28" stopColor="#e8edf1"/><stop offset=".58" stopColor="#aeb9c4"/><stop offset=".82" stopColor="#f8fafc"/><stop offset="1" stopColor="#778594"/>
                  </linearGradient>
                  <linearGradient id="camTop" x1="0" y1="0" x2=".8" y2="1">
                    <stop offset="0" stopColor="#ffffff"/><stop offset=".55" stopColor="#e6ebef"/><stop offset="1" stopColor="#9aa7b3"/>
                  </linearGradient>
                  <linearGradient id="camDark" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#3b4652"/><stop offset=".4" stopColor="#080e18"/><stop offset=".75" stopColor="#202b38"/><stop offset="1" stopColor="#050a12"/>
                  </linearGradient>
                  <radialGradient id="camGlass" cx=".38" cy=".32" r=".72">
                    <stop offset="0" stopColor="#52728b"/><stop offset=".24" stopColor="#182b40"/><stop offset=".55" stopColor="#050b15"/><stop offset=".78" stopColor="#26394b"/><stop offset="1" stopColor="#03070d"/>
                  </radialGradient>
                  <radialGradient id="camLens" cx=".35" cy=".3" r=".7">
                    <stop offset="0" stopColor="#7895a8"/><stop offset=".18" stopColor="#253f55"/><stop offset=".48" stopColor="#07111e"/><stop offset=".72" stopColor="#1c3548"/><stop offset="1" stopColor="#02060b"/>
                  </radialGradient>
                  <filter id="camGlow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                </defs>
                <g className="origin-center motion-safe:animate-[cameraPivot_11s_ease-in-out_infinite_alternate]">
                  {/* Parede, base e braço articulado */}
                  <ellipse cx="566" cy="430" rx="145" ry="27" fill="#020814" opacity=".42"/>
                  <path d="M526 314 L596 350 Q627 365 648 389 L671 416 L624 450 L580 406 L501 372Z" fill="url(#camBody)" stroke="#7e8c99" strokeWidth="5"/>
                  <path d="M551 331 L615 369 L644 398" fill="none" stroke="#fff" strokeWidth="8" opacity=".65"/>
                  <path d="M620 415 L669 438" stroke="#6c7a88" strokeWidth="12" strokeLinecap="round"/>
                  <path d="M669 438 C692 454 716 449 727 427 L739 402 C748 381 738 356 716 346 L681 331 C659 322 635 334 629 356 L617 391 C610 411 629 430 649 432Z" fill="url(#camBody)" stroke="#8795a2" strokeWidth="5"/>
                  <ellipse cx="682" cy="389" rx="49" ry="63" fill="#dce3e9" stroke="#7f8c98" strokeWidth="6"/>
                  <ellipse cx="682" cy="389" rx="35" ry="48" fill="url(#camBody)" stroke="#fff" strokeWidth="4"/>
                  {[[682,348],[716,389],[682,430],[648,389]].map(([x,y]) => <g key={x+":"+y}><circle cx={x} cy={y} r="5.5" fill="#596674"/><circle cx={x-1} cy={y-1} r="2" fill="#dce5ec"/></g>)}
                  {/* Corpo cilíndrico */}
                  <path d="M171 124 Q190 75 261 62 L526 35 Q592 30 617 87 L664 199 Q678 237 646 271 L566 334 Q534 359 483 348 L194 286 Q145 276 139 224Z" fill="url(#camBody)" stroke="#7f8d9a" strokeWidth="5"/>
                  <path d="M193 117 Q219 81 272 77 L530 52 Q576 48 597 92 L632 177 L249 238 Q200 241 175 207Z" fill="url(#camTop)" stroke="#fff" strokeWidth="3"/>
                  <path d="M250 239 L634 179" fill="none" stroke="#65727f" strokeWidth="5" opacity=".75"/>
                  <path d="M258 248 L624 193" fill="none" stroke="#fff" strokeWidth="2" opacity=".75"/>
                  <path d="M526 293 Q568 278 626 236 L657 267 Q620 311 564 335Z" fill="#aab5bf" opacity=".7"/>
                  <path d="M182 133 Q145 152 125 191 L101 235 Q92 255 114 267 L173 286 L232 254 L255 148Z" fill="#202a36" stroke="#65727f" strokeWidth="6"/>
                  {/* Cabeçote preto e lente */}
                  <ellipse cx="249" cy="225" rx="135" ry="151" fill="url(#camDark)" stroke="#080d15" strokeWidth="13"/>
                  <ellipse cx="249" cy="225" rx="116" ry="132" fill="#111b27" stroke="#667381" strokeWidth="7"/>
                  <ellipse cx="249" cy="225" rx="99" ry="113" fill="#080e17" stroke="#263849" strokeWidth="8"/>
                  <ellipse cx="249" cy="225" rx="82" ry="94" fill="url(#camGlass)" stroke="#7d8b98" strokeWidth="4"/>
                  <ellipse cx="249" cy="225" rx="60" ry="69" fill="url(#camLens)" stroke="#34495c" strokeWidth="5"/>
                  <ellipse cx="249" cy="225" rx="35" ry="41" fill="#07111d" stroke="#6b8396" strokeWidth="4"/>
                  <ellipse cx="239" cy="209" rx="12" ry="16" fill="#a7d5f2" opacity=".2"/>
                  <circle cx="254" cy="221" r="8" fill="#b7e8ff" opacity=".16"/>
                  {/* Anel de LEDs infravermelhos */}
                  {Array.from({length:18},(_,i)=>{const a=(i/18)*Math.PI*2;const x=249+91*Math.cos(a);const y=225+104*Math.sin(a);return <g key={i}><circle cx={x} cy={y} r="8" fill="#a9d5ed" opacity=".22" filter="url(#camGlow)"/><circle cx={x} cy={y} r="5.5" fill="#d8f0ff"/><circle cx={x-1.5} cy={y-1.5} r="2" fill="#fff"/></g>})}
                  {/* Parafusos e reflexos */}
                  {[[169,119],[323,103],[368,321],[126,280],[357,270]].map(([x,y])=><g key={x+":"+y}><circle cx={x} cy={y} r="7" fill="#0a111a" stroke="#6d7b89" strokeWidth="3"/><path d={`M${x-3} ${y}h6`} stroke="#dce5eb" strokeWidth="1.5"/></g>)}
                  <path d="M286 82 Q410 51 525 58" fill="none" stroke="#fff" strokeWidth="5" opacity=".52" strokeLinecap="round"/>
                  <path d="M155 160 Q174 104 220 91" fill="none" stroke="#fff" strokeWidth="3" opacity=".22"/>
                </g>
                <circle cx="249" cy="225" r="112" fill="none" stroke="#56cfff" strokeWidth="2" opacity=".45" filter="url(#camGlow)" className="motion-safe:animate-[lensPulse_3.2s_ease-in-out_infinite]"/>
              </svg>
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

        <section aria-label="Alunos do laboratório" className="mt-1 w-full max-w-4xl shrink-0">
          <div className="mb-2 flex items-center justify-center gap-2 text-[9px] font-extrabold uppercase tracking-[.2em] text-blue-100/55">
            <GraduationCap className="size-3.5 text-cyan-200/80" />
            Nossa comunidade de aprendizagem
          </div>
          {alunosEmDestaque.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {alunosEmDestaque.slice(0, 3).map((aluno, indice) => (
                <div
                  key={aluno.id}
                  className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-left shadow-lg backdrop-blur-md transition-all duration-700"
                  style={{ animationDelay: `${indice * 140}ms` }}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-cyan-100/20 bg-cyan-200/10 text-[10px] font-black text-cyan-100">
                    {aluno.nome.split(" ").map((parte) => parte[0]).join("").replace(".", "").slice(0, 2)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold text-white/90">{aluno.nome}</span>
                    <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[.12em] text-cyan-100/55">Turma {aluno.turma}</span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[10px] text-white/45">Alunos cadastrados aparecerão aqui.</p>
          )}
          <p className="mt-1.5 text-center text-[8px] font-medium text-white/35">Exibição rotativa · primeiro nome e inicial do sobrenome</p>
        </section>

        <footer className="mt-1 flex shrink-0 flex-col items-center gap-0.5 text-center">
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
        @keyframes cameraSweep { 0%, 15% { transform: translateX(-180%); } 75%, 100% { transform: translateX(330%); } }
        @keyframes cameraLine { 0%, 100% { transform: translateY(0); opacity: .25; } 50% { transform: translateY(170px); opacity: .9; } }
        @keyframes cctvRoomPan { 0% { transform: scale(1.04) translate3d(-.5%,0,0); } 100% { transform: scale(1.14) translate3d(.7%,-.6%,0); } }
        @keyframes cctvScan { 0% { transform: translateY(0); opacity: .18; } 50% { opacity: .8; } 100% { transform: translateY(350px); opacity: .18; } }
        @keyframes cameraFloat { 0%, 100% { transform: translate3d(0,0,0) rotate(-.7deg); } 50% { transform: translate3d(0,-9px,0) rotate(.7deg); } }
        @keyframes cameraPivot { 0% { transform: rotate(-1.2deg) translateX(-2px); } 50% { transform: rotate(.8deg) translateX(3px); } 100% { transform: rotate(-.4deg) translateX(0); } }
        @keyframes lensPulse { 0%, 100% { opacity: .18; transform: scale(.97); } 50% { opacity: .7; transform: scale(1.035); } }
        @keyframes cameraProgress { 0% { transform: translateX(-55%); } 100% { transform: translateX(110%); } }
        @media (max-height: 760px) { #screensaver-informatica main { gap: 2px; } #screensaver-informatica main > section[aria-label="Monitoramento do laboratório"] { min-height: 0; } #screensaver-informatica main > section[aria-label="Monitoramento do laboratório"] > div:first-child { min-height: 0; } #screensaver-informatica main > div.mt-1.grid.w-full.shrink-0.grid-cols-3 { display: none; } #screensaver-informatica main > section[aria-label="Alunos do laboratório"] { display: none; } #screensaver-informatica main > footer { display: none; } }\n        @media (prefers-reduced-motion: reduce) {
          [class*="animate-"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
