import { ArrowLeft, ArrowRight, Flag, Play, RotateCcw, Star, Timer, Trophy } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  CARROS,
  Corrida as MotorCorrida,
  desenharCarro,
  TEMAS,
  VOLTAS,
  type Entrada,
  type Hud,
  type IdPista,
} from "@/components/school/jogos/corrida-motor";
import { registrarPartida, type Adversario } from "@/lib/estrelas";
import { cn } from "@/lib/utils";

/**
 * Jogo de corrida: seis carros na pista, três voltas, cinco cenários.
 *
 * O desenho e a física ficam em `corrida-motor.ts`; aqui fica só o que é de
 * interface — escolha de carro e pista, contagem regressiva, painel, botões
 * de toque e a tela de resultado. O painel é atualizado no máximo dez vezes
 * por segundo para o React não competir com o canvas pelo quadro.
 *
 * Quem chega em primeiro ganha a vitória; pódio (2º e 3º) conta como empate,
 * que também rende estrela.
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
}

function tempoFmt(s: number): string {
  const m = Math.floor(s / 60);
  const resto = s - m * 60;
  return `${m}:${resto.toFixed(1).padStart(4, "0")}`;
}

function CarroMiniatura({ cor, ativo }: { cor: string; ativo: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    desenharCarro(ctx, c.width / 2, c.height - 8, c.width * 0.8, cor);
  }, [cor]);
  return (
    <canvas
      ref={ref}
      width={120}
      height={64}
      className={cn("h-11 w-full transition-transform", ativo && "scale-110")}
      aria-hidden
    />
  );
}

function Velocimetro({ kmh }: { kmh: number }) {
  const p = Math.min(kmh / 220, 1);
  const r = 34;
  const arco = 2 * Math.PI * r * 0.75;
  return (
    <div
      className="relative size-20 sm:size-24"
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
        <b className="text-xl tabular-nums sm:text-2xl">{kmh}</b>
        <span className="text-[9px] uppercase tracking-wider text-slate-400">km/h</span>
      </div>
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
  entrada: React.MutableRefObject<Entrada>;
  chave: keyof Entrada;
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
        "flex cursor-pointer touch-none select-none items-center justify-center rounded-2xl border-2 font-bold text-white shadow-lg backdrop-blur transition-transform",
        aceso ? "scale-95 border-white/80 bg-white/35" : "border-white/30 bg-black/40",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Corrida({ adversario, nivel }: { adversario: Adversario; nivel: number }) {
  const [fase, setFase] = useState<Fase>("menu");
  const [carro, setCarro] = useState(0);
  const [pista, setPista] = useState<IdPista>("praia");
  const [rodada, setRodada] = useState(0);
  const [contagem, setContagem] = useState<number | null>(null);
  const [hud, setHud] = useState<Hud>({ posicao: 6, total: 6, volta: 1, kmh: 0 });
  const [fim, setFim] = useState<Fim | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const entrada = useRef<Entrada>({
    esquerda: false,
    direita: false,
    acelerar: false,
    frear: false,
  });

  const cor = CARROS[carro]!.cor;

  const correr = useCallback(() => {
    setHud({ posicao: 6, total: 6, volta: 1, kmh: 0 });
    setFim(null);
    setContagem(3);
    setFase("contagem");
    setRodada((r) => r + 1);
  }, []);

  // Cria o motor quando a corrida começa e o destrói ao voltar ao menu.
  const ativo = fase !== "menu";
  useEffect(() => {
    if (!ativo || !canvas.current) return;
    entrada.current.esquerda = false;
    entrada.current.direita = false;
    entrada.current.acelerar = false;
    entrada.current.frear = false;

    const motor = new MotorCorrida({
      canvas: canvas.current,
      pista,
      corJogador: cor,
      nivel,
      aoMudarHud: setHud,
      aoTerminar: (posicao, segundos) => {
        setFim({ posicao, segundos, estrelas: null });
        setFase("fim");
        void registrarPartida({
          jogo: "corrida",
          titulo: "Jogo de corrida",
          resultado: posicao === 1 ? "vitoria" : posicao <= 3 ? "empate" : "derrota",
          adversario,
          nivel,
          segundos: Math.round(segundos),
        }).then((estrelas) => setFim((f) => (f ? { ...f, estrelas } : f)));
      },
    });
    motor.entrada = entrada.current;
    motor.iniciar();

    // Contagem 3-2-1 e largada.
    const tempos: number[] = [];
    [1, 2, 3].forEach((n) => {
      tempos.push(window.setTimeout(() => setContagem(3 - n), n * 900));
    });
    tempos.push(
      window.setTimeout(() => {
        motor.largar();
        setFase((f) => (f === "contagem" ? "correndo" : f));
      }, 3 * 900),
    );
    tempos.push(window.setTimeout(() => setContagem(null), 3 * 900 + 700));

    return () => {
      tempos.forEach((t) => window.clearTimeout(t));
      motor.parar();
    };
    // Só recria quando começa outra corrida ou quando se entra/sai do menu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rodada, ativo]);

  // Teclado
  useEffect(() => {
    if (fase === "menu") return;
    const mapa: Record<string, keyof Entrada> = {
      ArrowLeft: "esquerda",
      a: "esquerda",
      A: "esquerda",
      ArrowRight: "direita",
      d: "direita",
      D: "direita",
      ArrowUp: "acelerar",
      w: "acelerar",
      W: "acelerar",
      ArrowDown: "frear",
      s: "frear",
      S: "frear",
      " ": "acelerar",
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
  }, [fase]);

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
                  <CarroMiniatura cor={c.cor} ativo={carro === i} />
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

          <div className="flex flex-col items-center gap-2">
            <p className="text-center text-[11px] text-slate-400">
              {VOLTAS} voltas contra 5 pilotos. Setas ou WASD para dirigir · cones na pista fazem
              você perder velocidade. No celular, use os botões da tela.
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

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-video select-none overflow-hidden rounded-2xl border border-white/10 bg-black">
        <canvas
          ref={canvas}
          className="block size-full"
          aria-label={`Pista de ${TEMAS[pista].nome}. Posição ${hud.posicao} de ${hud.total}, volta ${hud.volta} de ${VOLTAS}.`}
        />

        {/* Painel */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2 text-white">
          <div className="rounded-lg border border-white/20 bg-slate-950/70 px-2.5 py-1 backdrop-blur">
            <span className="block text-[9px] font-semibold uppercase tracking-wider text-slate-400">
              Posição
            </span>
            <b className="text-lg leading-none tabular-nums sm:text-2xl">
              {hud.posicao}
              <span className="text-xs text-slate-400 sm:text-sm">/{hud.total}</span>
            </b>
          </div>
          <div className="rounded-lg border border-white/20 bg-slate-950/70 px-2.5 py-1 text-right backdrop-blur">
            <span className="block text-[9px] font-semibold uppercase tracking-wider text-slate-400">
              Volta
            </span>
            <b className="text-lg leading-none tabular-nums sm:text-2xl">
              {hud.volta}
              <span className="text-xs text-slate-400 sm:text-sm">/{VOLTAS}</span>
            </b>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-2 right-2">
          <Velocimetro kmh={hud.kmh} />
        </div>

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

        {/* Botões de toque */}
        {(fase === "correndo" || fase === "contagem") && (
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2 sm:hidden">
            <div className="flex gap-2">
              <BotaoToque
                rotulo="Virar à esquerda"
                entrada={entrada}
                chave="esquerda"
                className="size-14"
              >
                <ArrowLeft className="size-7" />
              </BotaoToque>
              <BotaoToque
                rotulo="Virar à direita"
                entrada={entrada}
                chave="direita"
                className="size-14"
              >
                <ArrowRight className="size-7" />
              </BotaoToque>
            </div>
            <div className="flex flex-col gap-2">
              <BotaoToque
                rotulo="Acelerar"
                entrada={entrada}
                chave="acelerar"
                className="h-14 w-20 border-emerald-300/60 bg-emerald-600/60 text-xs uppercase"
              >
                Acelerar
              </BotaoToque>
              <BotaoToque
                rotulo="Frear"
                entrada={entrada}
                chave="frear"
                className="h-10 w-20 border-red-300/60 bg-red-700/50 text-xs uppercase"
              >
                Frear
              </BotaoToque>
            </div>
          </div>
        )}

        {/* Resultado */}
        {fase === "fim" && fim && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm">
            <div className="flex w-full max-w-sm flex-col items-center gap-2 rounded-2xl border border-white/15 bg-slate-900 p-4 text-center text-white shadow-2xl">
              <Trophy
                className={cn(
                  "size-12",
                  fim.posicao === 1
                    ? "text-amber-400"
                    : fim.posicao === 2
                      ? "text-slate-300"
                      : fim.posicao === 3
                        ? "text-orange-400"
                        : "text-slate-600",
                )}
                aria-hidden
              />
              <h4 className="text-xl font-black">
                {fim.posicao === 1 ? "Campeão!" : `Você chegou em ${fim.posicao}º lugar`}
              </h4>
              <p className="flex items-center gap-1.5 text-sm text-slate-300">
                <Timer className="size-4" aria-hidden /> {tempoFmt(fim.segundos)}
                <Flag className="ml-2 size-4" aria-hidden /> {VOLTAS} voltas
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
              <div className="mt-1 flex gap-2">
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
      <p className="hidden text-center text-[11px] text-muted-foreground sm:block">
        ← → ou A D para virar · ↑ ou W para acelerar · ↓ ou S para frear
      </p>
    </div>
  );
}
