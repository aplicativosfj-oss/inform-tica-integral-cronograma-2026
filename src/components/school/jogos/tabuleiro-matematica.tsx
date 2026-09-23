import {
  Brain,
  Divide,
  Lightbulb,
  Minus,
  Plus,
  RotateCcw,
  Star,
  Trophy,
  Undo2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";

import {
  CASAS,
  cartaDaCasa,
  PROB_ACERTO_ROBO,
  ULTIMA,
  type Carta,
  type TipoCarta,
  type TipoCasa,
} from "@/components/school/jogos/tabuleiro-dados";
import { registrarPartida, type Adversario } from "@/lib/estrelas";
import { cn } from "@/lib/utils";

/**
 * Matemática em Ação: jogo de tabuleiro com dado, cartas e contas.
 *
 * A regra é a do tabuleiro de mesa: joga o dado, anda, e a casa onde parou
 * sorteia uma carta. Casas coloridas trazem uma conta (soma, subtração,
 * multiplicação ou divisão); as "?" trazem desafio, curiosidade ou "pense
 * rápido" (10 segundos); há casas de estrela (avança) e de "volte". Quem
 * chega primeiro à última casa vence.
 *
 * Contra o computador, os outros peões respondem sozinhos, acertando mais
 * quanto maior o nível. Entre colegas, cada um joga na sua vez.
 */

interface Jogador {
  nome: string;
  cor: string;
  humano: boolean;
  pos: number;
  acertos: number;
}

type Etapa = "rolar" | "rolando" | "andando" | "carta" | "feedback" | "fim";

interface Estado {
  jogadores: Jogador[];
  vez: number;
  etapa: Etapa;
  dado: number | null;
  destino: number;
  /** O que fazer quando o peão parar: resolver a casa ou passar a vez. */
  ao: "casa" | "vez";
  carta: Carta | null;
  escolha: number | null;
  vencedor: number | null;
}

const CORES_PEAO = ["#ef4444", "#3b82f6", "#22c55e", "#eab308"];

// ------------------------------------------------------------- geometria

const ASPECTO = 0.78;
const CENTRO = { x: 50, y: 52 };
const RAIO = { x: 43, y: 34 };
const LACUNA = 0.16;

interface PosCasa {
  x: number;
  y: number;
  giro: number;
}

/** Cada casa fica sobre uma elipse; o giro alinha o retângulo com o caminho. */
const POSICOES: PosCasa[] = CASAS.map((_, i) => {
  const a0 = (135 * Math.PI) / 180;
  const a = a0 - 2 * Math.PI * (1 - LACUNA) * (i / (CASAS.length - 1));
  const x = CENTRO.x + RAIO.x * Math.cos(a);
  const y = CENTRO.y + RAIO.y * Math.sin(a);
  // Tangente em unidades físicas (a altura vale ASPECTO da largura).
  const giro = (Math.atan2(-RAIO.y * ASPECTO * Math.cos(a), RAIO.x * Math.sin(a)) * 180) / Math.PI;
  return { x, y, giro };
});

// ---------------------------------------------------------------- visual

interface EstiloCarta {
  titulo: string;
  Icone: ComponentType<{ className?: string }>;
  fundo: string;
  cabeca: string;
}

const ESTILO_CARTA: Record<TipoCarta, EstiloCarta> = {
  soma: {
    titulo: "Adição",
    Icone: Plus,
    fundo: "from-blue-600 to-blue-800",
    cabeca: "text-blue-100",
  },
  sub: {
    titulo: "Subtração",
    Icone: Minus,
    fundo: "from-green-600 to-green-800",
    cabeca: "text-green-100",
  },
  mult: {
    titulo: "Multiplicação",
    Icone: X,
    fundo: "from-orange-500 to-orange-700",
    cabeca: "text-orange-100",
  },
  div: {
    titulo: "Divisão",
    Icone: Divide,
    fundo: "from-purple-600 to-purple-800",
    cabeca: "text-purple-100",
  },
  desafio: {
    titulo: "Desafio",
    Icone: Trophy,
    fundo: "from-red-600 to-red-800",
    cabeca: "text-red-100",
  },
  curiosidade: {
    titulo: "Curiosidade",
    Icone: Lightbulb,
    fundo: "from-yellow-400 to-amber-600",
    cabeca: "text-amber-950",
  },
  rapido: {
    titulo: "Pense rápido",
    Icone: Brain,
    fundo: "from-teal-500 to-cyan-700",
    cabeca: "text-cyan-50",
  },
  volte: {
    titulo: "Volte",
    Icone: Undo2,
    fundo: "from-purple-500 to-fuchsia-800",
    cabeca: "text-purple-100",
  },
  estrela: {
    titulo: "Estrela",
    Icone: Star,
    fundo: "from-amber-400 to-yellow-600",
    cabeca: "text-amber-950",
  },
};

const COR_CASA: Record<TipoCasa, string> = {
  inicio: "#16a34a",
  fim: "#dc2626",
  soma: "#2563eb",
  sub: "#16a34a",
  mult: "#f97316",
  div: "#7c3aed",
  misto: "#c026d3",
  volte: "#b91c1c",
  estrela: "#eab308",
};

const MARCA_CASA: Partial<Record<TipoCasa, string>> = {
  soma: "+",
  sub: "−",
  mult: "×",
  div: "÷",
  misto: "?",
  volte: "↶",
  estrela: "★",
};

function Peao({ cor, className }: { cor: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 36" className={className} aria-hidden>
      <ellipse cx={12} cy={33} rx={9} ry={3} fill="rgba(0,0,0,0.35)" />
      <path
        d="M4 32 Q5 20 10 15 L14 15 Q19 20 20 32 Z"
        fill={cor}
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={1}
      />
      <circle cx={12} cy={9} r={6.5} fill={cor} stroke="rgba(0,0,0,0.35)" strokeWidth={1} />
      <circle cx={10} cy={7} r={2} fill="rgba(255,255,255,0.55)" />
    </svg>
  );
}

const PONTOS_DADO: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [2, 0],
    [0, 2],
    [2, 2],
  ],
  5: [
    [0, 0],
    [2, 0],
    [1, 1],
    [0, 2],
    [2, 2],
  ],
  6: [
    [0, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [2, 2],
  ],
};

function Dado({ valor, rolando }: { valor: number | null; rolando: boolean }) {
  return (
    <svg
      viewBox="0 0 60 60"
      className={cn("size-14 drop-shadow-lg sm:size-16", rolando && "animate-spin")}
      role="img"
      aria-label={valor ? `Dado: ${valor}` : "Dado"}
    >
      <rect
        x={4}
        y={4}
        width={52}
        height={52}
        rx={11}
        fill="#fff"
        stroke="#cbd5e1"
        strokeWidth={2}
      />
      {valor &&
        PONTOS_DADO[valor]!.map(([cx, cy], i) => (
          <circle key={i} cx={16 + cx * 14} cy={16 + cy * 14} r={4.6} fill="#0f172a" />
        ))}
    </svg>
  );
}

// ----------------------------------------------------------------- jogo

function estadoInicial(jogadores: Jogador[]): Estado {
  return {
    jogadores,
    vez: 0,
    etapa: "rolar",
    dado: null,
    destino: 0,
    ao: "casa",
    carta: null,
    escolha: null,
    vencedor: null,
  };
}

export function TabuleiroMatematica({
  adversario,
  nivel,
}: {
  adversario: Adversario;
  nivel: number;
}) {
  const [numJogadores, setNumJogadores] = useState(2);
  const [est, setEst] = useState<Estado | null>(null);
  const [face, setFace] = useState(1);
  const [tempo, setTempo] = useState<number | null>(null);
  const registrado = useRef(false);
  const inicio = useRef(0);

  const comecar = () => {
    const js: Jogador[] = Array.from({ length: numJogadores }, (_, i) => ({
      nome: adversario === "colega" ? `Jogador ${i + 1}` : i === 0 ? "Você" : `Computador ${i}`,
      cor: CORES_PEAO[i]!,
      humano: adversario === "colega" || i === 0,
      pos: 0,
      acertos: 0,
    }));
    registrado.current = false;
    inicio.current = Date.now();
    setEst(estadoInicial(js));
  };

  const jogador = est ? est.jogadores[est.vez]! : null;

  const passarVez = useCallback(() => {
    setEst((e) =>
      e
        ? {
            ...e,
            vez: (e.vez + 1) % e.jogadores.length,
            etapa: "rolar",
            dado: null,
            carta: null,
            escolha: null,
          }
        : e,
    );
  }, []);

  const lancar = useCallback(() => {
    setEst((e) => (e && e.etapa === "rolar" ? { ...e, etapa: "rolando" } : e));
  }, []);

  const responder = useCallback((indice: number) => {
    setEst((e) => {
      if (!e || e.etapa !== "carta" || !e.carta) return e;
      const acertou = indice === e.carta.correta;
      const js = e.jogadores.map((j, i) =>
        i === e.vez && acertou ? { ...j, acertos: j.acertos + 1 } : j,
      );
      return { ...e, jogadores: js, etapa: "feedback", escolha: indice };
    });
  }, []);

  // Dado girando: mostra faces sorteadas e depois fixa o resultado.
  useEffect(() => {
    if (est?.etapa !== "rolando") return;
    const giro = window.setInterval(() => setFace(1 + Math.floor(Math.random() * 6)), 90);
    const fim = window.setTimeout(() => {
      const valor = 1 + Math.floor(Math.random() * 6);
      setFace(valor);
      setEst((e) => {
        if (!e || e.etapa !== "rolando") return e;
        const pos = e.jogadores[e.vez]!.pos;
        return {
          ...e,
          dado: valor,
          etapa: "andando",
          destino: Math.min(pos + valor, ULTIMA),
          ao: "casa",
        };
      });
    }, 750);
    return () => {
      window.clearInterval(giro);
      window.clearTimeout(fim);
    };
  }, [est?.etapa]);

  // Computador lança o dado sozinho.
  useEffect(() => {
    if (!est || est.etapa !== "rolar" || est.jogadores[est.vez]!.humano) return;
    const t = window.setTimeout(lancar, 900);
    return () => window.clearTimeout(t);
  }, [est, lancar]);

  // Peão andando, casa a casa.
  const posAtual = est ? est.jogadores[est.vez]!.pos : 0;
  useEffect(() => {
    if (!est || est.etapa !== "andando") return;
    if (posAtual !== est.destino) {
      const t = window.setTimeout(() => {
        setEst((e) => {
          if (!e || e.etapa !== "andando") return e;
          const j = e.jogadores[e.vez]!;
          const passo = j.pos < e.destino ? 1 : -1;
          const js = e.jogadores.map((x, i) => (i === e.vez ? { ...x, pos: x.pos + passo } : x));
          return { ...e, jogadores: js };
        });
      }, 230);
      return () => window.clearTimeout(t);
    }
    // Chegou.
    if (posAtual >= ULTIMA) {
      setEst((e) => (e ? { ...e, etapa: "fim", vencedor: e.vez, carta: null } : e));
      return;
    }
    if (est.ao === "vez") {
      const t = window.setTimeout(passarVez, 450);
      return () => window.clearTimeout(t);
    }
    const carta = cartaDaCasa(CASAS[posAtual]!, nivel);
    const t = window.setTimeout(() => {
      setEst((e) =>
        e
          ? carta
            ? {
                ...e,
                carta,
                escolha: null,
                etapa: carta.automatico !== undefined ? "feedback" : "carta",
              }
            : { ...e, etapa: "rolar" }
          : e,
      );
    }, 300);
    return () => window.clearTimeout(t);
  }, [est, posAtual, nivel, passarVez]);

  // Carta: computador responde; "pense rápido" tem relógio.
  useEffect(() => {
    if (!est || est.etapa !== "carta" || !est.carta) {
      setTempo(null);
      return;
    }
    const carta = est.carta;
    const j = est.jogadores[est.vez]!;
    if (!j.humano) {
      const acerta = Math.random() < PROB_ACERTO_ROBO[Math.min(Math.max(nivel, 1), 3) - 1]!;
      const errada = carta.opcoes.map((_, i) => i).filter((i) => i !== carta.correta);
      const indice = acerta ? carta.correta : errada[Math.floor(Math.random() * errada.length)]!;
      const t = window.setTimeout(() => responder(indice), carta.tempo ? 1500 : 2200);
      return () => window.clearTimeout(t);
    }
    if (!carta.tempo) {
      setTempo(null);
      return;
    }
    const limite = Date.now() + carta.tempo * 1000;
    setTempo(carta.tempo);
    const rel = window.setInterval(() => {
      const resto = (limite - Date.now()) / 1000;
      if (resto <= 0) {
        window.clearInterval(rel);
        setTempo(0);
        responder(-1);
      } else {
        setTempo(resto);
      }
    }, 100);
    return () => window.clearInterval(rel);
  }, [est?.etapa, est?.carta, est?.vez, nivel, responder]); // eslint-disable-line react-hooks/exhaustive-deps

  // Feedback e movimento de bônus.
  useEffect(() => {
    if (!est || est.etapa !== "feedback" || !est.carta) return;
    const carta = est.carta;
    const acertou = est.escolha === carta.correta;
    const delta =
      carta.automatico !== undefined ? carta.automatico : acertou ? carta.acerto : carta.erro;
    const t = window.setTimeout(
      () => {
        setEst((e) => {
          if (!e || e.etapa !== "feedback") return e;
          const pos = e.jogadores[e.vez]!.pos;
          const destino = Math.min(Math.max(pos + delta, 0), ULTIMA);
          if (destino === pos)
            return {
              ...e,
              etapa: "rolar",
              vez: (e.vez + 1) % e.jogadores.length,
              dado: null,
              carta: null,
              escolha: null,
            };
          return { ...e, etapa: "andando", destino, ao: "vez", carta: null, escolha: null };
        });
      },
      carta.automatico !== undefined ? 1700 : 1900,
    );
    return () => window.clearTimeout(t);
  }, [est?.etapa, est?.carta]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fim: registra estrelas uma vez.
  useEffect(() => {
    if (!est || est.etapa !== "fim" || registrado.current) return;
    registrado.current = true;
    const humanoVenceu = est.vencedor !== null && est.jogadores[est.vencedor]!.humano;
    void registrarPartida({
      jogo: "tabuleiro-matematica",
      titulo: "Matemática em Ação",
      resultado: adversario === "colega" || humanoVenceu ? "vitoria" : "derrota",
      adversario,
      nivel,
      segundos: Math.round((Date.now() - inicio.current) / 1000),
    });
  }, [est, adversario, nivel]);

  // -------------------------------------------------------------- telas

  if (!est) {
    return (
      <div className="relative overflow-hidden rounded-2xl border-4 border-amber-800 bg-gradient-to-b from-emerald-900 to-slate-900 p-5 text-center text-white">
        <h3 className="text-3xl font-black uppercase leading-none tracking-tight text-white [text-shadow:0_3px_0_#1e3a8a] sm:text-4xl">
          Matemática
          <span className="block text-4xl text-amber-300 [text-shadow:0_3px_0_#b45309] sm:text-5xl">
            em ação
          </span>
        </h3>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
          Pense · Calcule · Avance
        </p>
        <div className="mx-auto mt-4 grid max-w-xs grid-cols-4 gap-1.5 text-[10px] font-bold uppercase">
          {[
            ["soma", "Adição"],
            ["sub", "Subtração"],
            ["mult", "Multiplic."],
            ["div", "Divisão"],
          ].map(([t, n]) => (
            <span
              key={t}
              className="rounded-lg px-1 py-1.5"
              style={{ background: COR_CASA[t as TipoCasa] }}
            >
              {MARCA_CASA[t as TipoCasa]} {n}
            </span>
          ))}
        </div>
        <p className="mx-auto mt-3 max-w-sm text-xs text-emerald-100/80">
          Jogue o dado, ande e resolva a carta da casa onde parar. Casas “?” trazem desafio,
          curiosidade ou pense rápido. Quem chegar primeiro à casa final ganha!
        </p>
        <div className="mt-4 flex flex-col items-center gap-1.5">
          <span className="text-xs font-semibold text-emerald-200">
            {adversario === "colega" ? "Quantos jogadores?" : "Quantos peões na mesa?"}
          </span>
          <div className="flex gap-1.5">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNumJogadores(n)}
                aria-pressed={numJogadores === n}
                className={cn(
                  "flex size-11 cursor-pointer items-center justify-center rounded-xl border-2 text-lg font-black transition-colors",
                  numJogadores === n
                    ? "border-amber-300 bg-amber-400 text-amber-950"
                    : "border-white/20 bg-white/10 hover:bg-white/20",
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-emerald-200/80">
            {adversario === "colega"
              ? "Todos jogam no mesmo computador, cada um na sua vez."
              : `Você e ${numJogadores - 1} ${numJogadores === 2 ? "computador" : "computadores"}.`}
          </span>
        </div>
        <button
          type="button"
          onClick={comecar}
          className="mt-4 h-12 cursor-pointer rounded-xl bg-gradient-to-b from-amber-300 to-orange-500 px-8 text-base font-black uppercase tracking-wide text-amber-950 shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          Jogar
        </button>
      </div>
    );
  }

  const carta = est.carta;
  const estilo = carta ? ESTILO_CARTA[carta.tipo] : null;
  const acertou = carta ? est.escolha === carta.correta : false;
  const minhaVez = jogador!.humano && est.etapa === "rolar";

  return (
    <div className="flex flex-col gap-2">
      {/* Placar */}
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${est.jogadores.length}, minmax(0, 1fr))` }}
      >
        {est.jogadores.map((j, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border-2 px-2 py-1 text-xs transition-colors",
              est.vez === i && est.etapa !== "fim"
                ? "border-amber-400 bg-amber-400/15"
                : "border-border bg-card",
            )}
          >
            <Peao cor={j.cor} className="h-7 w-5 shrink-0" />
            <span className="min-w-0 leading-tight">
              <b className="block truncate text-foreground">{j.nome}</b>
              <span className="text-[10px] text-muted-foreground">
                casa {j.pos} · {j.acertos} {j.acertos === 1 ? "acerto" : "acertos"}
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* Tabuleiro */}
      <div className="relative overflow-hidden rounded-2xl border-[6px] border-amber-800 shadow-inner">
        {/* Em telas estreitas o tabuleiro rola de lado, para as casas continuarem legíveis. */}
        <div className="overflow-x-auto">
          <div
            className="relative w-full min-w-[32rem] bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-900"
            style={{ aspectRatio: `1 / ${ASPECTO}` }}
          >
            {/* Giz decorativo */}
            <div
              className="pointer-events-none absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 30%, rgba(255,255,255,.25) 0 1px, transparent 2px), radial-gradient(circle at 70% 70%, rgba(255,255,255,.2) 0 1px, transparent 2px)",
                backgroundSize: "34px 34px, 46px 46px",
              }}
              aria-hidden
            />

            {/* Casas */}
            {CASAS.map((tipo, i) => {
              const p = POSICOES[i]!;
              const especial = tipo === "inicio" || tipo === "fim";
              return (
                <div
                  key={i}
                  className={cn(
                    "absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center border-2 border-white/90 font-black text-white shadow-md",
                    especial
                      ? "size-[10.5%] rounded-full text-[8px] leading-none sm:text-[10px]"
                      : "h-[8.4%] w-[7.6%] rounded-md text-[9px] sm:text-xs",
                  )}
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    background: COR_CASA[tipo],
                    transform: especial ? undefined : `rotate(${p.giro}deg)`,
                  }}
                  aria-label={
                    tipo === "inicio" ? "Início" : tipo === "fim" ? "Chegada" : `Casa ${i}`
                  }
                >
                  {especial ? (
                    <span className="text-center uppercase">
                      {tipo === "inicio" ? "Início" : "Chegada"}
                    </span>
                  ) : (
                    <span
                      className="flex flex-col items-center leading-none"
                      style={{ transform: `rotate(${-p.giro}deg)` }}
                    >
                      <span>{i}</span>
                      {MARCA_CASA[tipo] && (
                        <span className="text-[10px] opacity-90 sm:text-sm">
                          {MARCA_CASA[tipo]}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Peões */}
            {est.jogadores.map((j, i) => {
              const p = POSICOES[j.pos]!;
              const desloc = [
                [-1.6, -2.4],
                [1.6, -2.4],
                [-1.6, 0.6],
                [1.6, 0.6],
              ][i]!;
              return (
                <div
                  key={i}
                  className="absolute z-10 w-[4.2%] -translate-x-1/2 -translate-y-[78%] transition-all duration-200 ease-out"
                  style={{ left: `${p.x + desloc[0]!}%`, top: `${p.y + desloc[1]!}%` }}
                >
                  <Peao
                    cor={j.cor}
                    className={cn(
                      "w-full drop-shadow-md",
                      est.vez === i && est.etapa !== "fim" && "animate-bounce",
                    )}
                  />
                </div>
              );
            })}

            {/* Centro: título, dado e botão */}
            <div className="absolute left-1/2 top-1/2 flex w-[52%] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 text-center">
              <h4 className="text-[13px] font-black uppercase leading-none text-white [text-shadow:0_2px_0_#1e3a8a] sm:text-xl">
                Matemática
                <span className="block text-amber-300 [text-shadow:0_2px_0_#b45309]">em ação</span>
              </h4>
              <Dado
                valor={est.etapa === "rolando" ? face : est.dado}
                rolando={est.etapa === "rolando"}
              />
              {minhaVez ? (
                <button
                  type="button"
                  onClick={lancar}
                  className="h-9 cursor-pointer rounded-xl bg-gradient-to-b from-amber-300 to-orange-500 px-4 text-xs font-black uppercase text-amber-950 shadow-lg transition-transform hover:scale-105 active:scale-95 sm:h-10 sm:text-sm"
                >
                  Lançar dado
                </button>
              ) : (
                <span className="rounded-full bg-black/35 px-2.5 py-1 text-[10px] font-semibold text-emerald-100 sm:text-xs">
                  {est.etapa === "fim"
                    ? "Fim de jogo"
                    : est.etapa === "andando"
                      ? `${jogador!.nome} anda…`
                      : `Vez de ${jogador!.nome}`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Carta */}
        {carta && estilo && (est.etapa === "carta" || est.etapa === "feedback") && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 p-2 backdrop-blur-[2px]">
            <div
              className={cn(
                "animate-in zoom-in-90 fade-in flex w-full max-w-xs flex-col gap-2 rounded-2xl border-4 border-white/70 bg-gradient-to-b p-3 text-white shadow-2xl duration-200",
                estilo.fundo,
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("text-sm font-black uppercase tracking-wide", estilo.cabeca)}>
                  {estilo.titulo}
                </span>
                <span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-semibold">
                  {jogador!.nome}
                </span>
              </div>
              <div className="flex justify-center">
                <span className="flex size-12 items-center justify-center rounded-full border-2 border-white/80 bg-white/15">
                  <estilo.Icone className="size-7" />
                </span>
              </div>
              <p className="rounded-xl bg-white/90 p-2.5 text-center text-sm font-bold leading-snug text-slate-900 sm:text-base">
                {carta.enunciado}
              </p>

              {carta.opcoes.length > 0 && (
                <>
                  {carta.tempo && est.etapa === "carta" && tempo !== null && (
                    <div className="h-2 overflow-hidden rounded-full bg-black/30">
                      <div
                        className={cn(
                          "h-full rounded-full transition-[width] duration-100",
                          tempo < 3 ? "bg-red-400" : "bg-white",
                        )}
                        style={{ width: `${(tempo / carta.tempo) * 100}%` }}
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-1.5">
                    {carta.opcoes.map((o, i) => {
                      const revelada = est.etapa === "feedback";
                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={est.etapa !== "carta" || !jogador!.humano}
                          onClick={() => responder(i)}
                          className={cn(
                            "min-h-10 cursor-pointer rounded-lg border-2 px-1.5 py-1.5 text-sm font-black transition-colors disabled:cursor-default",
                            revelada && i === carta.correta
                              ? "border-emerald-200 bg-emerald-500 text-white"
                              : revelada && i === est.escolha
                                ? "border-red-200 bg-red-500 text-white"
                                : "border-white/50 bg-white/85 text-slate-900 enabled:hover:bg-white",
                          )}
                        >
                          {o}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              <p className="text-center text-[11px] font-semibold text-white/90">
                {est.etapa === "feedback" && carta.automatico === undefined
                  ? acertou
                    ? `Acertou! Avance ${carta.acerto} ${carta.acerto === 1 ? "casa" : "casas"}.`
                    : est.escolha === -1
                      ? "O tempo acabou! Fica no mesmo lugar."
                      : "Não foi dessa vez. Fica no mesmo lugar."
                  : carta.dica}
              </p>
            </div>
          </div>
        )}

        {/* Vitória */}
        {est.etapa === "fim" && est.vencedor !== null && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm">
            <div className="flex w-full max-w-xs flex-col items-center gap-2 rounded-2xl border-4 border-amber-300 bg-gradient-to-b from-amber-400 to-orange-600 p-4 text-center text-amber-950 shadow-2xl">
              <Trophy className="size-14" aria-hidden />
              <h4 className="text-xl font-black">
                {est.jogadores[est.vencedor]!.humano
                  ? `${est.jogadores[est.vencedor]!.nome} venceu!`
                  : `${est.jogadores[est.vencedor]!.nome} chegou primeiro`}
              </h4>
              <p className="text-xs font-semibold">
                {est.jogadores[est.vencedor]!.acertos} acertos no caminho
              </p>
              <button
                type="button"
                onClick={comecar}
                className="mt-1 flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-amber-950 px-4 text-sm font-bold text-amber-100 shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <RotateCcw className="size-4" /> Jogar de novo
              </button>
              <button
                type="button"
                onClick={() => setEst(null)}
                className="cursor-pointer text-xs font-semibold underline underline-offset-2"
              >
                Mudar jogadores
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
