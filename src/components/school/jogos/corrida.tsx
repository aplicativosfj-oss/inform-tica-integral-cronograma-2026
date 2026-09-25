import {
  ArrowLeft,
  ArrowRight,
  Flag,
  Hand,
  Music,
  Play,
  RotateCcw,
  Smartphone,
  Star,
  Timer,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  CARROS,
  Corrida as MotorCorrida,
  TEMAS,
  type Entrada,
  type Hud,
  type IdPista,
} from "@/components/school/jogos/corrida-motor";
import { SomCorrida } from "@/components/school/jogos/corrida-som";
import type { PilotoMoto } from "@/components/school/jogos/corrida-motor";
import { registrarPartida, type Adversario } from "@/lib/estrelas";
import { IMAGENS_CORRIDA, precarregar } from "@/lib/precarregar";
import { cn } from "@/lib/utils";

/**
 * Jogo de corrida: seis carros na pista, três voltas, cinco cenários.
 *
 * O desenho e a física ficam em `corrida-motor.ts`, o som em `corrida-som.ts`;
 * aqui fica a interface — escolha de carro e pista, contagem regressiva,
 * painel e os controles. No celular a criança acelera sozinha (o carro anda
 * sem segurar nada) e só cuida de virar: arrastando o volante da tela, o dedo
 * pela pista ou inclinando o aparelho. No computador valem as setas/WASD.
 */

const PISTAS: { id: IdPista; nome: string }[] = [
  { id: "cidade", nome: "Cidade" },
  { id: "montanha", nome: "Montanha" },
  { id: "praia", nome: "Praia" },
  { id: "deserto", nome: "Deserto" },
  { id: "neve", nome: "Neve" },
];

type Fase = "menu" | "contagem" | "correndo" | "fim";

interface Fim {
  posicao: number;
  segundos: number;
  estrelas: number | null;
  voltasFeitas: number;
  metros: number;
}

function tempoFmt(s: number): string {
  const m = Math.floor(s / 60);
  const resto = s - m * 60;
  return `${m}:${resto.toFixed(1).padStart(4, "0")}`;
}

function Velocimetro({ kmh }: { kmh: number }) {
  const p = Math.min(kmh / 220, 1);
  const r = 34;
  const arco = 2 * Math.PI * r * 0.75;
  return (
    <div
      className="relative size-16 sm:size-24"
      role="img"
      aria-label={`Velocidade: ${kmh} quilômetros por hora`}
    >
      <svg viewBox="0 0 100 100" className="size-full -rotate-[225deg]">
        <circle cx={50} cy={50} r={46} fill="rgba(2,6,23,0.75)" stroke="#334155" strokeWidth={2} />
        <circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          stroke="#1e293b"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${arco} 999`}
        />
        <circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          stroke={p > 0.85 ? "#f43f5e" : p > 0.5 ? "#f59e0b" : "#22d3ee"}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${arco * p} 999`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none text-white">
        <b className="text-base tabular-nums sm:text-2xl">{kmh}</b>
        <span className="text-[8px] uppercase tracking-wider text-slate-400 sm:text-[9px]">
          km/h
        </span>
      </div>
    </div>
  );
}

/**
 * Volante de arrastar: a criança gira o volante com o dedo, como num jogo de
 * fliperama. Girou meio quarto de volta, virou tudo; soltou, ele volta ao meio.
 */
function VolanteToque({
  entrada,
  className,
}: {
  entrada: React.RefObject<Entrada>;
  className?: string;
}) {
  const [giro, setGiro] = useState(0);
  const centro = useRef<{ x: number; y: number; ang0: number } | null>(null);

  const angulo = (e: React.PointerEvent, c: { x: number; y: number }) =>
    (Math.atan2(e.clientY - c.y, e.clientX - c.x) * 180) / Math.PI;

  const aplicar = (graus: number) => {
    const g = Math.max(-80, Math.min(80, graus));
    setGiro(g);
    entrada.current.volante = g / 55 > 1 ? 1 : g / 55 < -1 ? -1 : g / 55;
  };

  return (
    <div
      role="slider"
      aria-label="Volante: arraste para virar"
      aria-valuemin={-1}
      aria-valuemax={1}
      aria-valuenow={0}
      tabIndex={-1}
      onPointerDown={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const c = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        e.currentTarget.setPointerCapture(e.pointerId);
        centro.current = { ...c, ang0: angulo(e, c) };
      }}
      onPointerMove={(e) => {
        const c = centro.current;
        if (!c) return;
        let d = angulo(e, c) - c.ang0;
        if (d > 180) d -= 360;
        if (d < -180) d += 360;
        aplicar(d);
      }}
      onPointerUp={() => {
        centro.current = null;
        aplicar(0);
      }}
      onPointerCancel={() => {
        centro.current = null;
        aplicar(0);
      }}
      onContextMenu={(e) => e.preventDefault()}
      className={cn("touch-none select-none", className)}
    >
      <svg
        viewBox="0 0 100 100"
        className="size-full drop-shadow-xl transition-transform"
        style={{
          transform: `rotate(${giro}deg)`,
          transitionDuration: centro.current ? "0ms" : "160ms",
        }}
      >
        <circle cx={50} cy={50} r={46} fill="rgba(2,6,23,0.55)" stroke="#e2e8f0" strokeWidth={7} />
        <circle cx={50} cy={50} r={46} fill="none" stroke="#475569" strokeWidth={2} />
        <path
          d="M6 50 H36 M64 50 H94 M50 64 V94"
          stroke="#cbd5e1"
          strokeWidth={7}
          strokeLinecap="round"
        />
        <circle cx={50} cy={50} r={14} fill="#dc2626" stroke="#fecaca" strokeWidth={3} />
        <rect x={46} y={3} width={8} height={13} rx={3} fill="#facc15" />
      </svg>
    </div>
  );
}

function BotaoToque({
  rotulo,
  entrada,
  chave,
  className,
  children,
}: {
  rotulo: string;
  entrada: React.RefObject<Entrada>;
  chave: "esquerda" | "direita" | "acelerar" | "frear" | "empurrar";
  className?: string;
  children: React.ReactNode;
}) {
  const [aceso, setAceso] = useState(false);
  const set = (v: boolean) => {
    entrada.current[chave] = v;
    setAceso(v);
  };
  return (
    <button
      type="button"
      aria-label={rotulo}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        set(true);
      }}
      onPointerUp={() => set(false)}
      onPointerCancel={() => set(false)}
      onLostPointerCapture={() => set(false)}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "flex cursor-pointer touch-none select-none items-center justify-center rounded-2xl border-2 font-black uppercase text-white shadow-lg backdrop-blur transition-transform",
        aceso ? "scale-95 border-white/90 bg-white/35" : "border-white/30 bg-black/40",
        className,
      )}
    >
      {children}
    </button>
  );
}

const semHud: Hud = {
  posicao: 6,
  total: 6,
  volta: 1,
  kmh: 0,
  tempoRestante: null,
  voltasTotal: 0,
  voltasFeitas: 0,
  tempoDecorrido: 0,
  ranking: [],
};

/** Configuração fixa da corrida quando ela é usada por outro jogo (missão de moto do Operação: Plantão). */
export interface CorridaAutomatica {
  pista: IdPista;
  modo: "voltas" | "tempo";
  voltas: number;
  tempo: number;
  nivel: 1 | 2 | 3;
  veiculo: "carro" | "moto";
  piloto?: PilotoMoto;
  spriteJogador?: string;
  cenarioImagem?: string;
  corVeiculo: string;
  titulo: string;
  subtitulo: string;
  aoFim: (r: { posicao: number; segundos: number; total: number }) => void;
  aoSair: () => void;
  permiteEmpurrar?: boolean;
  nomeJogador?: string;
  rivais?: { nome: string; cor: string; piloto?: PilotoMoto }[];
  obstaculos?: "normal" | "leves" | "nenhum";
  modeloVeiculo?: string;
  nomePista?: string;
}

export function Corrida({
  adversario,
  nivel,
  automatico,
}: {
  adversario: Adversario;
  nivel: number;
  automatico?: CorridaAutomatica;
}) {
  const [fase, setFase] = useState<Fase>("menu");
  const [nivelEsc, setNivelEsc] = useState(automatico?.nivel ?? Math.min(Math.max(nivel, 1), 3));
  const [modo, setModo] = useState<"voltas" | "tempo">(automatico?.modo ?? "voltas");
  const [voltasEsc, setVoltasEsc] = useState(automatico?.voltas ?? 3);
  const [tempoEsc, setTempoEsc] = useState(automatico?.tempo ?? 90);
  const [carro, setCarro] = useState(0);
  const [pista, setPista] = useState<IdPista>(automatico?.pista ?? "praia");
  const [rodada, setRodada] = useState(0);
  const [contagem, setContagem] = useState<number | null>(null);
  const [hud, setHud] = useState<Hud>(semHud);
  const [fim, setFim] = useState<Fim | null>(null);
  const [toque, setToque] = useState(false);
  const [retrato, setRetrato] = useState(false);
  const [auto, setAuto] = useState(true);
  const [inclinar, setInclinar] = useState(false);
  const [musica, setMusica] = useState(true);
  const [somOk, setSomOk] = useState(true);
  const [efeitos, setEfeitos] = useState(true);
  const canvas = useRef<HTMLCanvasElement>(null);
  const som = useRef<SomCorrida | null>(null);
  const entrada = useRef<Entrada>({
    esquerda: false,
    direita: false,
    acelerar: false,
    frear: false,
    volante: 0,
    empurrar: false,
  });
  const autoRef = useRef(true);
  autoRef.current = auto;
  const corridaAutomatica = Boolean(automatico);

  useEffect(() => precarregar(IMAGENS_CORRIDA), []);

  const cor = automatico?.corVeiculo ?? CARROS[carro]!.cor;

  // Aparelho de toque: controles na tela, aceleração automática ligada.
  useEffect(() => {
    const t =
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(max-width: 640px)").matches;
    setToque(t);
    setAuto(corridaAutomatica ? true : t);
    const mq = window.matchMedia("(orientation: portrait)");
    const atualizar = () => setRetrato(mq.matches);
    atualizar();
    mq.addEventListener("change", atualizar);
    return () => mq.removeEventListener("change", atualizar);
  }, [corridaAutomatica]);

  const correr = useCallback(() => {
    // O áudio só nasce dentro de um toque/clique: este é o clique em "Largar".
    som.current?.parar();
    som.current = SomCorrida.criar();
    if (som.current) {
      setMusica(som.current.musicaLigada);
      setEfeitos(som.current.efeitosLigados);
    }
    setHud({
      ...semHud,
      tempoRestante: modo === "tempo" ? tempoEsc : null,
      voltasTotal: modo === "voltas" ? voltasEsc : 0,
    });
    setFim(null);
    setContagem(3);
    setFase("contagem");
    setRodada((r) => r + 1);
  }, [modo, tempoEsc, voltasEsc]);

  // Cria o motor quando a corrida começa e o destrói ao voltar ao menu.
  const ativo = fase !== "menu";
  useEffect(() => {
    if (!ativo || !canvas.current) return;
    entrada.current.esquerda = false;
    entrada.current.direita = false;
    entrada.current.acelerar = false;
    entrada.current.frear = false;
    entrada.current.volante = 0;
    entrada.current.empurrar = false;

    const motor = new MotorCorrida({
      canvas: canvas.current,
      pista,
      corJogador: cor,
      ...(automatico
        ? {
            veiculo: automatico.veiculo,
            ...(automatico.piloto ? { piloto: automatico.piloto } : {}),
            ...(automatico.spriteJogador ? { spriteJogador: automatico.spriteJogador } : {}),
            ...(automatico.cenarioImagem ? { cenarioImagem: automatico.cenarioImagem } : {}),
            permiteEmpurrar: automatico.permiteEmpurrar,
            nomeJogador: automatico.nomeJogador,
            rivais: automatico.rivais,
            obstaculos: automatico.obstaculos,
          }
        : {}),
      nivel: nivelEsc,
      modo,
      voltas: voltasEsc,
      tempoLimite: tempoEsc,
      som: som.current,
      aoMudarHud: setHud,
      aoTerminar: (posicao, segundos, extra) => {
        if (automatico) {
          automatico.aoFim({ posicao, segundos, total: 6 });
          return;
        }
        setFim({ posicao, segundos, estrelas: null, ...extra });
        setFase("fim");
        void registrarPartida({
          jogo: "corrida",
          titulo:
            modo === "tempo"
              ? `Corrida contra o tempo (${tempoEsc}s)`
              : `Corrida de ${voltasEsc} voltas`,
          resultado: posicao === 1 ? "vitoria" : posicao <= 3 ? "empate" : "derrota",
          adversario,
          nivel: nivelEsc,
          segundos: Math.round(segundos),
        }).then((estrelas) => setFim((f) => (f ? { ...f, estrelas } : f)));
      },
    });
    motor.entrada = entrada.current;
    motor.iniciar();
    som.current?.iniciarMusica();

    // Contagem 3-2-1 e largada.
    const tempos: number[] = [];
    som.current?.bipe(false);
    [1, 2, 3].forEach((n) => {
      tempos.push(
        window.setTimeout(() => {
          setContagem(3 - n);
          som.current?.bipe(n === 3);
        }, n * 900),
      );
    });
    tempos.push(
      window.setTimeout(() => {
        motor.largar();
        setFase((f) => (f === "contagem" ? "correndo" : f));
      }, 3 * 900),
    );
    tempos.push(window.setTimeout(() => setContagem(null), 3 * 900 + 700));

    // Acelerador automático: mantém o pedal apertado; o freio tem prioridade no motor.
    const acel = window.setInterval(() => {
      if (autoRef.current) entrada.current.acelerar = true;
    }, 60);

    return () => {
      tempos.forEach((t) => window.clearTimeout(t));
      window.clearInterval(acel);
      motor.parar();
    };
    // Só recria quando começa outra corrida ou quando se entra/sai do menu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rodada, ativo]);

  // Celulares costumam deixar o áudio suspenso até um toque: vigia o estado e mostra um botão.
  useEffect(() => {
    if (fase === "menu") return;
    const t = window.setInterval(() => {
      const st = som.current?.estado();
      setSomOk(!st || st === "running");
    }, 500);
    return () => window.clearInterval(t);
  }, [fase]);

  // Ao sair da tela (ou voltar ao menu), o som para.
  useEffect(() => {
    if (fase === "menu") {
      som.current?.parar();
      som.current = null;
    }
  }, [fase]);
  useEffect(
    () => () => {
      som.current?.parar();
      som.current = null;
    },
    [],
  );

  // Sem o acelerador automático, soltar o pedal desliga a aceleração.
  useEffect(() => {
    if (!auto) entrada.current.acelerar = false;
  }, [auto]);

  // Teclado
  useEffect(() => {
    if (fase === "menu") return;
    const mapa: Record<string, keyof Omit<Entrada, "volante">> = {
      ArrowLeft: "esquerda",
      ArrowRight: "direita",
      ArrowUp: "acelerar",
      ArrowDown: "frear",
      ...(!corridaAutomatica
        ? {
            a: "esquerda" as const,
            A: "esquerda" as const,
            d: "direita" as const,
            D: "direita" as const,
            w: "acelerar" as const,
            W: "acelerar" as const,
            s: "frear" as const,
            S: "frear" as const,
            " ": "acelerar" as const,
            e: "empurrar" as const,
            E: "empurrar" as const,
          }
        : {}),
    };
    const troca = (e: KeyboardEvent, v: boolean) => {
      const k = mapa[e.key];
      if (!k) return;
      e.preventDefault();
      entrada.current[k] = v;
    };
    const desce = (e: KeyboardEvent) => troca(e, true);
    const sobe = (e: KeyboardEvent) => troca(e, false);
    window.addEventListener("keydown", desce);
    window.addEventListener("keyup", sobe);
    return () => {
      window.removeEventListener("keydown", desce);
      window.removeEventListener("keyup", sobe);
    };
  }, [fase, corridaAutomatica]);

  // Inclinar o celular para virar.
  useEffect(() => {
    if (!inclinar || fase === "menu") return;
    const ent = entrada.current;
    const aoInclinar = (e: DeviceOrientationEvent) => {
      const ang = window.screen.orientation?.angle ?? 0;
      const g = e.gamma ?? 0;
      const b = e.beta ?? 0;
      const tilt = ang === 90 ? b : ang === 270 || ang === -90 ? -b : g;
      const v = Math.abs(tilt) < 3 ? 0 : tilt / 22;
      ent.volante = Math.max(-1, Math.min(1, v));
    };
    window.addEventListener("deviceorientation", aoInclinar);
    return () => {
      window.removeEventListener("deviceorientation", aoInclinar);
      ent.volante = 0;
    };
  }, [inclinar, fase]);

  const alternarInclinar = async () => {
    if (inclinar) {
      setInclinar(false);
      return;
    }
    const Ev = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    try {
      if (typeof Ev?.requestPermission === "function") {
        if ((await Ev.requestPermission()) !== "granted") return;
      }
      setInclinar(true);
    } catch {
      // Aparelho sem sensor ou permissão negada: continua com o volante.
    }
  };

  // Arrastar o dedo pela pista também vira o carro.
  const arrasto = useRef<{ x0: number; id: number } | null>(null);
  const pistaPointer = {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse") return;
      arrasto.current = { x0: e.clientX, id: e.pointerId };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: React.PointerEvent) => {
      const a = arrasto.current;
      if (!a || a.id !== e.pointerId) return;
      entrada.current.volante = Math.max(-1, Math.min(1, (e.clientX - a.x0) / 70));
    },
    onPointerUp: () => {
      arrasto.current = null;
      if (!inclinar) entrada.current.volante = 0;
    },
    onPointerCancel: () => {
      arrasto.current = null;
      if (!inclinar) entrada.current.volante = 0;
    },
  };

  if (fase === "menu" && automatico) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url(/images/plantao/missao-moto.webp)" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950/80 to-slate-950" />
        <div className="relative flex flex-col items-center gap-3 p-6 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.18em]">
            <span className="rounded-full border border-red-300/50 bg-red-950/70 px-3 py-1 text-red-200">
              {automatico.modeloVeiculo ?? "Moto de competição"}
            </span>
            <span className="rounded-full border border-sky-300/50 bg-sky-950/70 px-3 py-1 text-sky-200">
              {automatico.nomePista ?? TEMAS[pista].nome}
            </span>
            <span className="rounded-full border border-amber-300/50 bg-amber-950/70 px-3 py-1 text-amber-200">
              6 CB650R · {voltasEsc} {voltasEsc === 1 ? "volta" : "voltas"}
            </span>
          </div>
          <h3 className="text-3xl font-black uppercase italic tracking-tight text-amber-300 sm:text-4xl">
            {automatico.titulo}
          </h3>
          <p className="max-w-md text-sm text-slate-200">{automatico.subtitulo}</p>
          <p className="max-w-md text-xs text-slate-400">
            {toque
              ? "A moto acelera sozinha: use os botões direcionais ou arraste o dedo sobre a pista."
              : "Use as setas do teclado para pilotar. Toda a grade usa CB650R em cores diferentes; faça a melhor linha nas curvas."}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={automatico.aoSair}
              className="h-12 cursor-pointer rounded-xl border border-white/20 px-5 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={correr}
              className="flex h-12 cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-b from-amber-300 to-orange-500 px-8 text-base font-black uppercase text-amber-950 shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              <Play className="size-5 fill-current" /> Largar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (fase === "menu") {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{ backgroundImage: "url(/images/jogos/corrida-capa.jpg)" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/80 to-slate-950" />
        <div className="relative flex flex-col gap-4 p-4">
          <div className="text-center">
            <h3 className="text-3xl font-black uppercase italic leading-none tracking-tight sm:text-4xl">
              <span className="block text-sm font-bold not-italic text-red-300">Jogo de</span>
              <span className="bg-gradient-to-b from-white to-red-400 bg-clip-text text-transparent">
                Corrida
              </span>
            </h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
              Acelere · Supere · Vença
            </p>
          </div>

          <section>
            <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-300">
              1. Escolha seu carro
            </h4>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {CARROS.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCarro(i)}
                  aria-pressed={carro === i}
                  className={cn(
                    "flex cursor-pointer flex-col items-center rounded-xl border-2 bg-slate-900/80 px-1 pb-1 pt-2 text-[11px] font-semibold transition-colors",
                    carro === i
                      ? "border-amber-400 text-white"
                      : "border-white/10 text-slate-400 hover:border-white/40",
                  )}
                >
                  <img
                    src={`/images/jogos/carro-${i + 1}.jpg`}
                    alt=""
                    className={cn(
                      "h-14 w-full rounded-lg object-cover transition-transform",
                      carro === i && "scale-105",
                    )}
                  />
                  {c.nome}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-300">
              2. Escolha a pista
            </h4>
            <div className="grid grid-cols-5 gap-1.5">
              {PISTAS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPista(p.id)}
                  aria-pressed={pista === p.id}
                  className={cn(
                    "group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-lg border-2 transition-all",
                    pista === p.id
                      ? "border-amber-400 shadow-lg shadow-amber-500/30"
                      : "border-white/10 opacity-70 hover:opacity-100",
                  )}
                >
                  <img
                    src={`/images/jogos/corrida-pista-${p.id}.jpg`}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-black/65 py-0.5 text-center text-[10px] font-bold text-white sm:text-xs">
                    {p.nome}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <div>
              <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-300">
                3. Modo de corrida
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    ["voltas", "🏁 Voltas", "Termine primeiro"],
                    ["tempo", "⏱️ Tempo", "Vá o mais longe"],
                  ] as const
                ).map(([id, nome, desc]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setModo(id)}
                    aria-pressed={modo === id}
                    className={cn(
                      "flex cursor-pointer flex-col items-start rounded-xl border-2 px-3 py-2 text-left transition-colors",
                      modo === id
                        ? "border-amber-400 bg-amber-400/10 text-white"
                        : "border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/40",
                    )}
                  >
                    <b className="text-sm">{nome}</b>
                    <span className="text-[10px] text-slate-400">{desc}</span>
                  </button>
                ))}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {(modo === "voltas" ? [1, 3, 5] : [60, 90, 120]).map((v) => {
                  const ativoV = modo === "voltas" ? voltasEsc === v : tempoEsc === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => (modo === "voltas" ? setVoltasEsc(v) : setTempoEsc(v))}
                      aria-pressed={ativoV}
                      className={cn(
                        "h-8 cursor-pointer rounded-full border px-3 text-xs font-bold transition-colors",
                        ativoV
                          ? "border-amber-300 bg-amber-400 text-amber-950"
                          : "border-white/20 bg-white/5 text-slate-200 hover:bg-white/10",
                      )}
                    >
                      {modo === "voltas" ? `${v} ${v === 1 ? "volta" : "voltas"}` : `${v} s`}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-300">
                4. Dificuldade
              </h4>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    [1, "Fácil", "🟢"],
                    [2, "Médio", "🟡"],
                    [3, "Difícil", "🔴"],
                  ] as const
                ).map(([n, nome, ic]) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNivelEsc(n)}
                    aria-pressed={nivelEsc === n}
                    className={cn(
                      "flex cursor-pointer flex-col items-center rounded-xl border-2 px-2 py-2 text-xs font-bold transition-colors",
                      nivelEsc === n
                        ? "border-amber-400 bg-amber-400/10 text-white"
                        : "border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/40",
                    )}
                  >
                    <span aria-hidden>{ic}</span>
                    {nome}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] leading-snug text-slate-400">
                {nivelEsc === 1
                  ? "Rivais mais lentos e poucos obstáculos: cones, caixas e buracos."
                  : nivelEsc === 2
                    ? "Mais obstáculos: pilhas de pneus, poças de óleo e barreiras."
                    : "Rivais rápidos e pista cheia de obstáculos, até em dupla."}
              </p>
            </div>
          </section>

          <div className="flex flex-col items-center gap-2">
            <p className="text-center text-[11px] text-slate-400">
              {toque
                ? "Contra 5 pilotos. O carro acelera sozinho: gire o volante da tela, arraste o dedo pela pista ou incline o celular. Passe nas faixas azuis para ganhar turbo e desvie dos obstáculos!"
                : "Contra 5 pilotos. Setas ou WASD para dirigir. Passe nas faixas azuis para ganhar turbo e desvie de cones, caixas, buracos, pneus, poças e barreiras. Ligue o volume!"}
            </p>
            <button
              type="button"
              onClick={correr}
              className="flex h-12 cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-b from-red-500 to-red-700 px-7 text-base font-black uppercase tracking-wide text-white shadow-lg shadow-red-900/50 transition-transform hover:scale-105 active:scale-95"
            >
              <Play className="size-5 fill-current" /> Largar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const volanteEl = automatico ? (
    <div className="flex items-center gap-2 rounded-2xl border border-sky-300/30 bg-slate-950/70 p-2 shadow-xl backdrop-blur">
      <BotaoToque
        rotulo="Virar à esquerda"
        entrada={entrada}
        chave="esquerda"
        className="size-16 border-sky-200/60 bg-sky-900/70 sm:size-20"
      >
        <ArrowLeft className="size-8" />
      </BotaoToque>
      <BotaoToque
        rotulo="Virar à direita"
        entrada={entrada}
        chave="direita"
        className="size-16 border-sky-200/60 bg-sky-900/70 sm:size-20"
      >
        <ArrowRight className="size-8" />
      </BotaoToque>
    </div>
  ) : (
    <VolanteToque entrada={entrada} className={retrato ? "size-32" : "size-24 sm:size-28"} />
  );

  const pedaisEl = (
    <div className="flex flex-col items-end gap-1.5">
      <div className={cn("flex gap-1.5", !retrato && "flex-col items-end")}>
        {!automatico && (
          <button
            type="button"
            onClick={() => void alternarInclinar()}
            aria-pressed={inclinar}
            aria-label="Inclinar o celular para virar"
            className={cn(
              "flex h-9 cursor-pointer items-center gap-1 rounded-lg border px-2 text-[10px] font-bold uppercase backdrop-blur",
              inclinar
                ? "border-sky-300 bg-sky-500/60 text-white"
                : "border-white/30 bg-black/40 text-slate-200",
            )}
          >
            <Smartphone className="size-3.5" /> inclinar
          </button>
        )}
        {automatico ? (
          <span className="flex h-9 items-center gap-1 rounded-lg border border-emerald-300/60 bg-emerald-500/50 px-2 text-[10px] font-bold uppercase text-white backdrop-blur">
            <Zap className="size-3.5" /> aceleração auto
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setAuto((a) => !a)}
            aria-pressed={auto}
            aria-label="Acelerador automático"
            className={cn(
              "flex h-9 cursor-pointer items-center gap-1 rounded-lg border px-2 text-[10px] font-bold uppercase backdrop-blur",
              auto
                ? "border-emerald-300 bg-emerald-500/60 text-white"
                : "border-white/30 bg-black/40 text-slate-200",
            )}
          >
            <Zap className="size-3.5" /> auto
          </button>
        )}
      </div>
      <div className={cn("flex items-end gap-2", !retrato && "flex-col-reverse items-end")}>
        {automatico?.permiteEmpurrar && (
          <BotaoToque
            rotulo="Dar ombrada no rival"
            entrada={entrada}
            chave="empurrar"
            className="h-16 w-20 border-amber-300/70 bg-amber-600/60 text-[10px]"
          >
            <span className="flex flex-col items-center gap-1">
              <Hand className="size-5" /> Ombrada
            </span>
          </BotaoToque>
        )}
        <BotaoToque
          rotulo="Frear"
          entrada={entrada}
          chave="frear"
          className="h-14 w-16 border-red-300/60 bg-red-700/50 text-[11px] sm:h-16 sm:w-20"
        >
          Frear
        </BotaoToque>
        {!automatico && !auto && (
          <BotaoToque
            rotulo="Acelerar"
            entrada={entrada}
            chave="acelerar"
            className="h-20 w-20 border-emerald-300/60 sm:h-24 sm:w-24 bg-emerald-600/60 text-xs"
          >
            Acelerar
          </BotaoToque>
        )}
      </div>
    </div>
  );

  const lateral = toque && !retrato;

  return (
    <div className="flex flex-col gap-2" onPointerDown={() => som.current?.retomar()}>
      <div className={cn("flex gap-2", lateral ? "items-center" : "flex-col")}>
        {lateral && (
          <div className="flex w-28 shrink-0 items-center justify-center overflow-hidden">
            {volanteEl}
          </div>
        )}
        <div className="relative mx-auto aspect-video w-full max-w-[calc((100dvh-4.5rem)*1.7778)] select-none overflow-hidden rounded-2xl border border-white/10 bg-black">
          <canvas
            ref={canvas}
            className="block size-full touch-none"
            aria-label={`Pista de ${TEMAS[pista].nome}. Posição ${hud.posicao} de ${hud.total}, volta ${hud.volta}.`}
            {...pistaPointer}
          />

          {/* Painel */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2 text-white">
            <div className="rounded-lg border border-white/20 bg-slate-950/70 px-2 py-0.5 backdrop-blur sm:px-2.5 sm:py-1">
              <span className="block text-[8px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[9px]">
                Posição
              </span>
              <b className="text-base leading-none tabular-nums sm:text-2xl">
                {hud.posicao}
                <span className="text-xs text-slate-400 sm:text-sm">/{hud.total}</span>
              </b>
            </div>
            <div className="pointer-events-auto flex gap-1">
              <button
                type="button"
                aria-label={musica ? "Desligar a música" : "Ligar a música"}
                aria-pressed={musica}
                onClick={() => setMusica(som.current?.alternarMusica() ?? false)}
                className={cn(
                  "flex size-9 cursor-pointer items-center justify-center rounded-lg border border-white/20 bg-slate-950/70 backdrop-blur",
                  musica ? "text-emerald-300" : "text-slate-500",
                )}
              >
                <Music className="size-4" />
              </button>
              <button
                type="button"
                aria-label={efeitos ? "Desligar os efeitos sonoros" : "Ligar os efeitos sonoros"}
                aria-pressed={efeitos}
                onClick={() => setEfeitos(som.current?.alternarEfeitos() ?? false)}
                className={cn(
                  "flex size-9 cursor-pointer items-center justify-center rounded-lg border border-white/20 bg-slate-950/70 backdrop-blur",
                  efeitos ? "text-emerald-300" : "text-slate-500",
                )}
              >
                {efeitos ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              </button>
            </div>
            <div className="rounded-lg border border-white/20 bg-slate-950/70 px-2 py-0.5 text-right backdrop-blur sm:px-2.5 sm:py-1">
              <span className="block text-[8px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[9px]">
                {modo === "tempo" ? "Tempo" : "Volta"}
              </span>
              <b className="text-base leading-none tabular-nums sm:text-2xl">
                {modo === "tempo" ? (
                  <>
                    {Math.floor((hud.tempoRestante ?? 0) / 60)}:
                    {String((hud.tempoRestante ?? 0) % 60).padStart(2, "0")}
                    <span className="ml-1 text-xs text-slate-400 sm:text-sm">
                      · {hud.voltasFeitas} {hud.voltasFeitas === 1 ? "volta" : "voltas"}
                    </span>
                  </>
                ) : (
                  <>
                    {hud.volta}
                    <span className="text-xs text-slate-400 sm:text-sm">/{voltasEsc}</span>
                  </>
                )}
              </b>
            </div>
          </div>
          {automatico && hud.ranking.length > 0 && (
            <div className="pointer-events-none absolute left-2 top-14 w-36 overflow-hidden rounded-lg border border-white/20 bg-slate-950/80 text-white shadow-xl backdrop-blur sm:top-16 sm:w-44">
              <div className="flex items-center justify-between border-b border-white/10 bg-sky-500/15 px-2 py-1">
                <span className="text-[8px] font-black uppercase tracking-[0.16em] text-sky-200 sm:text-[9px]">
                  Ranking ao vivo
                </span>
                <span className="text-[8px] tabular-nums text-slate-300 sm:text-[9px]">
                  {tempoFmt(hud.tempoDecorrido)}
                </span>
              </div>
              <ol className="grid gap-px p-1">
                {hud.ranking.map((item) => (
                  <li
                    key={item.nome}
                    className={cn(
                      "flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[8px] font-bold sm:text-[10px]",
                      item.jogador ? "bg-amber-400 text-amber-950" : "bg-white/5 text-slate-100",
                    )}
                  >
                    <span className="w-4 shrink-0 tabular-nums">{item.posicao}º</span>
                    <span className="truncate">{item.nome}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <div className={cn("pointer-events-none absolute bottom-2", "right-2")}>
            <Velocimetro kmh={hud.kmh} />
          </div>

          {!somOk && fase !== "fim" && (
            <button
              type="button"
              onClick={() => som.current?.retomar()}
              className="absolute left-1/2 top-12 z-10 flex h-9 -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-full border border-amber-300 bg-amber-500/90 px-3 text-xs font-bold text-amber-950 shadow-lg"
            >
              <VolumeX className="size-4" /> Toque para ligar o som
            </button>
          )}

          {/* Contagem regressiva */}
          {contagem !== null && fase !== "fim" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span
                key={contagem}
                className={cn(
                  "animate-in zoom-in-50 fade-in text-7xl font-black italic drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] duration-300 sm:text-8xl",
                  contagem === 0 ? "text-emerald-400" : "text-white",
                )}
              >
                {contagem === 0 ? "VAI!" : contagem}
              </span>
            </div>
          )}

          {/* Resultado */}
          {fase === "fim" && fim && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm">
              <div className="flex w-full max-w-sm flex-col items-center gap-2 rounded-2xl border border-white/15 bg-slate-900 p-4 text-center text-white shadow-2xl">
                <img
                  src={`/images/jogos/trofeu-${fim.posicao === 1 ? "ouro" : fim.posicao === 2 ? "prata" : "bronze"}.webp`}
                  alt=""
                  className={cn(
                    "size-16 object-contain drop-shadow-lg",
                    fim.posicao > 3 && "opacity-40 grayscale",
                  )}
                />
                <h4 className="text-xl font-black">
                  {fim.posicao === 1 ? "Campeão!" : `Você chegou em ${fim.posicao}º lugar`}
                </h4>
                <p className="flex items-center gap-1.5 text-sm text-slate-300">
                  <Timer className="size-4" aria-hidden /> {tempoFmt(fim.segundos)}
                  <Flag className="ml-2 size-4" aria-hidden />{" "}
                  {modo === "tempo"
                    ? `${fim.voltasFeitas} ${fim.voltasFeitas === 1 ? "volta" : "voltas"} · ${fim.metros} m`
                    : `${voltasEsc} ${voltasEsc === 1 ? "volta" : "voltas"}`}
                </p>
                {fim.estrelas !== null && fim.estrelas > 0 && (
                  <p className="flex items-center gap-1 text-sm font-bold text-amber-300">
                    <Star className="size-4 fill-current" /> +{fim.estrelas}{" "}
                    {fim.estrelas === 1 ? "estrela" : "estrelas"}
                  </p>
                )}
                {fim.posicao > 3 && (
                  <p className="text-xs text-slate-400">
                    Desvie dos cones e não saia da pista: quem chega ao pódio ganha estrelas.
                  </p>
                )}
                <div className="mt-1 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={correr}
                    className="flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-b from-red-500 to-red-700 px-4 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                  >
                    <RotateCcw className="size-4" /> Correr de novo
                  </button>
                  <button
                    type="button"
                    onClick={() => setFase("menu")}
                    className="h-10 cursor-pointer rounded-xl border border-white/20 px-4 text-sm font-semibold text-slate-200 hover:bg-white/10"
                  >
                    Trocar carro/pista
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        {lateral && (
          <div className="flex w-28 shrink-0 items-center justify-center overflow-hidden">
            {pedaisEl}
          </div>
        )}
      </div>
      {toque && retrato && (fase === "correndo" || fase === "contagem") && (
        <div className="flex items-end justify-between gap-3 px-2 py-3">
          {volanteEl}
          {pedaisEl}
        </div>
      )}
      {!toque && (
        <p className="hidden text-center text-[11px] text-muted-foreground sm:block">
          {automatico ? (
            <>
              <ArrowLeft className="inline size-3" /> <ArrowRight className="inline size-3" />
              setas do teclado para pilotar · aceleração automática
            </>
          ) : (
            <>
              <ArrowLeft className="inline size-3" /> <ArrowRight className="inline size-3" /> ou A
              D para virar · ↑ ou W para acelerar · ↓ ou S para frear
            </>
          )}
        </p>
      )}
    </div>
  );
}
