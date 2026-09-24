import {
  ArrowDown,
  ArrowUp,
  Briefcase,
  ChevronsUp,
  Clock,
  Hand,
  Pause,
  Play,
  Star,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { BotaoToque, Joystick, useAparelho } from "@/components/plantao/controles";
import {
  NOMES_NIVEL,
  PASTA_IMG,
  type CenarioMaratona,
  type Clima,
  type Missao,
  type Nivel,
  type Personagem,
} from "@/components/plantao/dados";
import { desenharAvatar, type Imagens } from "@/components/plantao/desenho";
import {
  Arena,
  type EntradaArena,
  type HudArena,
  type ResultadoArena,
} from "@/components/plantao/motor-arena";
import {
  Maratona,
  type EntradaMaratona,
  type HudMaratona,
} from "@/components/plantao/motor-maratona";
import type { SomPlantao } from "@/components/plantao/som-plantao";
import { cn } from "@/lib/utils";

/**
 * Telas de jogo do "Operação: Plantão": briefing, painel (HUD), controles e
 * pausa das missões de arena e da maratona. A missão de moto usa a tela de
 * corrida que já existe (ver `plantao.tsx`).
 */

const HUD_VAZIO: HudArena = {
  titulo: "",
  objetivos: [],
  tempo: 0,
  pontos: 0,
  folego: 1,
  carga: 0,
  capacidade: 0,
  prompt: null,
  aviso: null,
  item: null,
};

const HERO: Record<string, string> = {
  cachorro: "missao-cachorro.webp",
  moto: "missao-moto.webp",
};

function mmss(s: number): string {
  const t = Math.max(0, Math.ceil(s));
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

/** Palco 16:9 que cabe na tela e mais os cantos de controle. */
function Palco({
  esquerda,
  direita,
  abaixo,
  children,
}: {
  esquerda?: React.ReactNode;
  direita?: React.ReactNode;
  abaixo?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { toque, retrato } = useAparelho();
  const lateral = toque && !retrato;
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-black">
      <div className={cn("flex w-full items-center justify-center gap-2", lateral ? "px-2" : "")}>
        {lateral && (
          <div className="flex w-32 shrink-0 items-center justify-center">{esquerda}</div>
        )}
        <div className="relative aspect-video w-full max-w-[calc((100dvh-1rem)*1.7778)] overflow-hidden bg-slate-950 shadow-2xl sm:rounded-xl">
          {children}
        </div>
        {lateral && <div className="flex w-32 shrink-0 items-center justify-center">{direita}</div>}
      </div>
      {toque && retrato && (
        <div className="flex w-full items-center justify-between px-6 pb-4">
          {esquerda}
          {abaixo ?? direita}
        </div>
      )}
    </div>
  );
}

function Briefing({
  missao,
  personagem,
  nivel,
  clima,
  aoComecar,
  aoSair,
  imagens,
}: {
  missao: Missao;
  personagem: Personagem;
  nivel: Nivel;
  clima: Clima;
  aoComecar: () => void;
  aoSair: () => void;
  imagens?: Imagens;
}) {
  const hero = HERO[missao.id] ?? missao.cenario;
  void imagens;
  const { toque } = useAparelho();
  return (
    <div className="absolute inset-0 z-30 flex items-end bg-slate-950">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-60"
        style={{ backgroundImage: `url(${PASTA_IMG}${hero})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
      <div className="relative flex w-full flex-col gap-2 p-4 sm:p-6">
        <span className="w-fit rounded-full bg-amber-400 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-amber-950">
          Missão · {NOMES_NIVEL[nivel - 1]} ·{" "}
          {clima === "dia" ? "Dia" : clima === "noite" ? "Noite" : "Pôr do sol"}
        </span>
        <h2 className="text-2xl font-black uppercase italic leading-none text-white sm:text-4xl">
          {missao.titulo}
        </h2>
        <p className="max-w-xl text-sm text-slate-200 sm:text-base">{missao.resumo}</p>
        <p className="max-w-xl text-xs text-amber-200 sm:text-sm">💡 {missao.dica}</p>
        <p className="text-[11px] text-slate-400">
          {toque
            ? "Joystick para andar · CORRER para acelerar · INTERAGIR perto dos objetos brilhantes."
            : "WASD ou setas para andar · SHIFT para correr · E ou ESPAÇO para interagir."}{" "}
          Agente: {personagem.nome}.
        </p>
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={aoSair}
            className="h-11 cursor-pointer rounded-xl border border-white/25 px-5 text-sm font-semibold text-slate-200 hover:bg-white/10"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={aoComecar}
            className="flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-b from-amber-300 to-orange-500 px-8 text-base font-black uppercase text-amber-950 shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <Play className="size-5 fill-current" /> Começar
          </button>
        </div>
      </div>
    </div>
  );
}

function BarraFolego({ v }: { v: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900/80 ring-1 ring-white/20">
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-100",
          v < 0.25 ? "bg-red-500" : "bg-gradient-to-r from-sky-400 to-cyan-300",
        )}
        style={{ width: `${v * 100}%` }}
      />
    </div>
  );
}

function Pausa({ aoContinuar, aoSair }: { aoContinuar: () => void; aoSair: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/15 bg-slate-900 p-6 text-white shadow-2xl">
        <h3 className="text-2xl font-black uppercase italic">Jogo pausado</h3>
        <button
          type="button"
          onClick={aoContinuar}
          className="flex h-12 w-56 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-amber-300 to-orange-500 font-black uppercase text-amber-950"
        >
          <Play className="size-5 fill-current" /> Continuar
        </button>
        <button
          type="button"
          onClick={aoSair}
          className="h-11 w-56 cursor-pointer rounded-xl border border-white/25 text-sm font-semibold hover:bg-white/10"
        >
          Sair da missão
        </button>
      </div>
    </div>
  );
}

// ============================================================================ ARENA

interface PropsArena {
  missao: Missao;
  personagem: Personagem;
  nivel: Nivel;
  clima: Clima;
  som: SomPlantao | null;
  imagens: Imagens;
  aoFim: (r: ResultadoArena) => void;
  aoSair: () => void;
}

export function TelaArena({
  missao,
  personagem,
  nivel,
  clima,
  som,
  imagens,
  aoFim,
  aoSair,
}: PropsArena) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const minimapa = useRef<HTMLCanvasElement>(null);
  const avatar = useRef<HTMLCanvasElement>(null);
  const motor = useRef<Arena | null>(null);
  const entrada = useRef<EntradaArena>({ dx: 0, dy: 0, correr: false, interagir: false });
  const stick = useRef({ dx: 0, dy: 0 });
  const [fase, setFase] = useState<"briefing" | "jogando" | "pausa">("briefing");
  const [hud, setHud] = useState<HudArena>(HUD_VAZIO);
  const [somOn, setSomOn] = useState(true);
  const { toque } = useAparelho();
  const meta = missao.meta[nivel - 1]!;
  const tempoTotal = missao.tempo[nivel - 1]!;
  const teclas = useRef({ w: false, a: false, s: false, d: false });

  // Motor
  useEffect(() => {
    if (fase !== "jogando" || !canvas.current || motor.current) return;
    if (missao.id === "moto" || missao.id === "maratona") return;
    const a = new Arena({
      canvas: canvas.current,
      minimapa: minimapa.current,
      missao: missao.id,
      personagem,
      nivel,
      clima,
      som,
      imagens,
      titulo: missao.titulo,
      tempoTotal,
      meta,
      aoHud: setHud,
      aoFim,
    });
    a.entrada = entrada.current;
    motor.current = a;
    // Gancho só para depuração no ambiente de desenvolvimento.
    if (import.meta.env.DEV) (window as unknown as { __arena?: Arena }).__arena = a;
    a.iniciar();
  }, [fase, missao, personagem, nivel, clima, som, imagens, tempoTotal, meta, aoFim]);
  useEffect(
    () => () => {
      motor.current?.parar();
      motor.current = null;
    },
    [],
  );
  useEffect(() => {
    motor.current?.pausar(fase === "pausa");
  }, [fase]);

  // Teclado + joystick numa só entrada
  useEffect(() => {
    if (fase !== "jogando") return;
    const t = teclas.current;
    const atualizar = () => {
      const kx = (t.d ? 1 : 0) - (t.a ? 1 : 0);
      const ky = (t.s ? 1 : 0) - (t.w ? 1 : 0);
      entrada.current.dx = kx !== 0 ? kx : stick.current.dx;
      entrada.current.dy = ky !== 0 ? ky : stick.current.dy;
    };
    const mapa: Record<string, keyof typeof t> = {
      w: "w",
      ArrowUp: "w",
      a: "a",
      ArrowLeft: "a",
      s: "s",
      ArrowDown: "s",
      d: "d",
      ArrowRight: "d",
    };
    const desce = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (mapa[k]) {
        t[mapa[k]!] = true;
        e.preventDefault();
      } else if (e.key === "Shift") entrada.current.correr = true;
      else if (k === "e" || e.key === " " || e.key === "Enter") {
        entrada.current.interagir = true;
        e.preventDefault();
      } else if (e.key === "Escape" || k === "p") setFase("pausa");
      atualizar();
    };
    const sobe = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (mapa[k]) t[mapa[k]!] = false;
      else if (e.key === "Shift") entrada.current.correr = false;
      atualizar();
    };
    window.addEventListener("keydown", desce);
    window.addEventListener("keyup", sobe);
    const laço = window.setInterval(atualizar, 33);
    return () => {
      window.removeEventListener("keydown", desce);
      window.removeEventListener("keyup", sobe);
      window.clearInterval(laço);
    };
  }, [fase]);

  // Avatar do painel
  useEffect(() => {
    const c = avatar.current?.getContext("2d");
    if (!c) return;
    const desenhar = () => {
      c.clearRect(0, 0, 64, 64);
      desenharAvatar(c, 32, 32, 28, imagens[personagem.rosto], personagem.camisa);
    };
    desenhar();
    const t = window.setTimeout(desenhar, 400);
    return () => window.clearTimeout(t);
  }, [imagens, personagem, fase]);

  const controles = useMemo(
    () => ({
      esquerda: <Joystick saida={stick} className="size-28 sm:size-32" />,
      direita: (
        <div className="flex items-end gap-2">
          <BotaoToque
            rotulo="Correr"
            aoApertar={() => (entrada.current.correr = true)}
            aoSoltar={() => (entrada.current.correr = false)}
            className="size-16"
          >
            <Zap className="size-5" />
            Correr
          </BotaoToque>
          <BotaoToque
            rotulo="Interagir"
            aoApertar={() => (entrada.current.interagir = true)}
            className="size-20 border-amber-300/70 bg-amber-500/40"
            pulsando={Boolean(hud?.prompt)}
          >
            <Hand className="size-6" />
            Interagir
          </BotaoToque>
        </div>
      ),
    }),
    [hud?.prompt],
  );

  const pontosFmt = hud ? hud.pontos.toLocaleString("pt-BR") : "0";

  return (
    <Palco esquerda={controles.esquerda} direita={controles.direita}>
      <canvas ref={canvas} className="block size-full" aria-label={`Missão: ${missao.titulo}`} />

      {hud && fase !== "briefing" && (
        <>
          {/* Painel superior esquerdo */}
          <div className="pointer-events-none absolute left-2 top-2 flex w-[42%] max-w-[300px] flex-col gap-1.5 sm:w-[34%] [@media(max-height:520px)]:w-[30%]">
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-slate-950/70 p-1.5 backdrop-blur">
              <canvas ref={avatar} width={64} height={64} className="size-9 shrink-0 sm:size-11" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-black uppercase leading-tight text-white sm:text-xs">
                  {personagem.nome}
                </p>
                <BarraFolego v={hud.folego} />
              </div>
            </div>
            <div className="rounded-xl border border-white/15 bg-slate-950/70 p-2 backdrop-blur [@media(max-height:520px)]:hidden">
              <p className="mb-1 text-[9px] font-black uppercase tracking-wider text-amber-300 sm:text-[10px]">
                Missão atual
              </p>
              <ul className="flex flex-col gap-0.5">
                {hud.objetivos.map((o) => (
                  <li
                    key={o.texto}
                    className={cn(
                      "flex items-start gap-1.5 text-[10px] leading-tight sm:text-xs",
                      o.feito ? "text-emerald-300" : "text-slate-100",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-3 shrink-0 items-center justify-center rounded-full border text-[8px]",
                        o.feito
                          ? "border-emerald-400 bg-emerald-500 text-white"
                          : "border-slate-400",
                      )}
                    >
                      {o.feito ? "✓" : ""}
                    </span>
                    <span className="min-w-0 flex-1">{o.texto}</span>
                    {o.contador && <b className="tabular-nums text-amber-300">{o.contador}</b>}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tempo e pontos */}
          <div className="pointer-events-none absolute left-1/2 top-2 flex -translate-x-1/2 flex-col items-center gap-1">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-xl border px-3 py-1 text-lg font-black tabular-nums backdrop-blur sm:text-2xl [@media(max-height:520px)]:text-base",
                hud.tempo <= 10
                  ? "animate-pulse border-red-400 bg-red-950/70 text-red-300"
                  : "border-amber-300/50 bg-slate-950/70 text-amber-300",
              )}
            >
              <Clock className="size-4 sm:size-5" /> {mmss(hud.tempo)}
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-slate-950/70 px-2.5 py-0.5 text-[11px] font-bold text-white backdrop-blur sm:text-sm">
              <Star className="size-3.5 fill-amber-400 text-amber-300" /> {pontosFmt}
              {hud.item && (
                <span className="flex items-center gap-1 text-sky-300">
                  <Briefcase className="size-3.5" /> {hud.carga}/{hud.capacidade}
                </span>
              )}
            </div>
          </div>

          {/* Minimapa e botões */}
          <div className="absolute right-2 top-2 flex flex-col items-end gap-1.5">
            <canvas
              ref={minimapa}
              width={170}
              height={104}
              className="pointer-events-none h-16 w-[104px] rounded-lg border border-white/25 sm:h-[104px] sm:w-[170px] [@media(max-height:520px)]:h-12 [@media(max-height:520px)]:w-[78px]"
            />
            <div className="flex gap-1.5">
              <button
                type="button"
                aria-label={somOn ? "Desligar o som" : "Ligar o som"}
                onClick={() => {
                  const novo = !somOn;
                  som?.definir(novo, novo);
                  setSomOn(novo);
                }}
                className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-white/25 bg-slate-950/70 text-white backdrop-blur"
              >
                {somOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              </button>
              <button
                type="button"
                aria-label="Pausar"
                onClick={() => setFase("pausa")}
                className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-white/25 bg-slate-950/70 text-white backdrop-blur"
              >
                <Pause className="size-4" />
              </button>
            </div>
          </div>

          {/* Aviso e dica de interação */}
          {hud.aviso && (
            <div className="pointer-events-none absolute inset-x-0 top-[28%] flex justify-center">
              <span className="animate-in zoom-in-95 fade-in rounded-full border border-amber-300/60 bg-slate-950/85 px-4 py-1.5 text-sm font-black text-amber-300 shadow-xl sm:text-lg">
                {hud.aviso}
              </span>
            </div>
          )}
          {hud.prompt && (
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
              <span className="flex items-center gap-2 rounded-xl border border-white/30 bg-slate-950/85 px-3 py-1.5 text-xs font-black uppercase text-white shadow-xl sm:text-sm">
                {!toque && (
                  <kbd className="rounded bg-amber-400 px-1.5 py-0.5 text-amber-950">E</kbd>
                )}
                {hud.prompt}
              </span>
            </div>
          )}
        </>
      )}

      {fase === "briefing" && (
        <Briefing
          missao={missao}
          personagem={personagem}
          nivel={nivel}
          clima={clima}
          aoComecar={() => setFase("jogando")}
          aoSair={aoSair}
        />
      )}
      {fase === "pausa" && <Pausa aoContinuar={() => setFase("jogando")} aoSair={aoSair} />}
    </Palco>
  );
}

// ========================================================================= MARATONA

interface PropsMaratona {
  missao: Missao;
  personagem: Personagem;
  nivel: Nivel;
  clima: Clima;
  cenario: CenarioMaratona;
  som: SomPlantao | null;
  imagens: Imagens;
  aoFim: (r: ResultadoArena) => void;
  aoSair: () => void;
}

export function TelaMaratona({
  missao,
  personagem,
  nivel,
  clima,
  cenario,
  som,
  imagens,
  aoFim,
  aoSair,
}: PropsMaratona) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const motor = useRef<Maratona | null>(null);
  const entrada = useRef<EntradaMaratona>({ faixa: 0, pular: false });
  const [fase, setFase] = useState<"briefing" | "jogando">("briefing");
  const [hud, setHud] = useState<HudMaratona | null>(null);
  const meta = missao.meta[nivel - 1]!;

  useEffect(() => {
    if (fase !== "jogando" || !canvas.current || motor.current) return;
    const m = new Maratona({
      canvas: canvas.current,
      personagem,
      nivel,
      clima,
      cenario,
      meta,
      som,
      imagens,
      aoHud: setHud,
      aoFim,
    });
    m.entrada = entrada.current;
    motor.current = m;
    m.iniciar();
  }, [fase, personagem, nivel, clima, cenario, meta, som, imagens, aoFim]);
  useEffect(
    () => () => {
      motor.current?.parar();
      motor.current = null;
    },
    [],
  );
  useEffect(() => {
    const desce = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === "w" || k === "ArrowUp") entrada.current.faixa = -1;
      else if (k === "s" || k === "ArrowDown") entrada.current.faixa = 1;
      else if (e.key === " " || k === "d" || k === "ArrowRight") entrada.current.pular = true;
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", desce);
    return () => window.removeEventListener("keydown", desce);
  }, []);

  const esquerda = (
    <div className="flex flex-col gap-2">
      <BotaoToque
        rotulo="Subir de faixa"
        aoApertar={() => (entrada.current.faixa = -1)}
        className="size-16"
      >
        <ArrowUp className="size-6" />
      </BotaoToque>
      <BotaoToque
        rotulo="Descer de faixa"
        aoApertar={() => (entrada.current.faixa = 1)}
        className="size-16"
      >
        <ArrowDown className="size-6" />
      </BotaoToque>
    </div>
  );
  const direita = (
    <BotaoToque
      rotulo="Pular"
      aoApertar={() => (entrada.current.pular = true)}
      className="size-24 border-amber-300/70 bg-amber-500/40"
    >
      <ChevronsUp className="size-8" />
      Pular
    </BotaoToque>
  );

  return (
    <Palco esquerda={esquerda} direita={direita}>
      <canvas ref={canvas} className="block size-full" aria-label="Maratona do Plantão" />
      {hud && fase === "jogando" && (
        <>
          <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-2">
            <div className="w-[40%] max-w-xs rounded-xl border border-white/15 bg-slate-950/70 p-2 backdrop-blur">
              <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-amber-300">
                Fôlego
              </p>
              <BarraFolego v={hud.folego} />
            </div>
            <div className="rounded-xl border border-amber-300/50 bg-slate-950/70 px-3 py-1 text-center backdrop-blur">
              <p className="text-lg font-black tabular-nums text-amber-300 sm:text-2xl">
                {hud.metros} <span className="text-xs text-slate-300">/ {hud.meta} m</span>
              </p>
            </div>
            <div className="rounded-xl border border-white/15 bg-slate-950/70 px-3 py-1 text-right backdrop-blur">
              <p className="flex items-center gap-1 text-sm font-bold text-white">
                <Star className="size-4 fill-amber-400 text-amber-300" />{" "}
                {hud.pontos.toLocaleString("pt-BR")}
              </p>
              <p className="text-[10px] text-slate-300">{hud.velocidade} km/h</p>
            </div>
          </div>
          {/* barra de progresso da prova */}
          <div className="pointer-events-none absolute inset-x-6 bottom-2 h-2 overflow-hidden rounded-full bg-slate-900/80 ring-1 ring-white/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-300"
              style={{ width: `${(hud.metros / hud.meta) * 100}%` }}
            />
          </div>
          {hud.aviso && (
            <div className="pointer-events-none absolute inset-x-0 top-[24%] flex justify-center">
              <span className="rounded-full border border-amber-300/60 bg-slate-950/85 px-4 py-1.5 text-sm font-black text-amber-300 shadow-xl sm:text-lg">
                {hud.aviso}
              </span>
            </div>
          )}
        </>
      )}
      {fase === "briefing" && (
        <Briefing
          missao={missao}
          personagem={personagem}
          nivel={nivel}
          clima={clima}
          aoComecar={() => setFase("jogando")}
          aoSair={aoSair}
        />
      )}
    </Palco>
  );
}
