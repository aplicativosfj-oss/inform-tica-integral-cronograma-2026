import { useCallback, useEffect, useRef, useState } from "react";

import { registrarPartida, type Adversario } from "@/lib/estrelas";
import { cn } from "@/lib/utils";

/**
 * Jogo da velha com adversário de verdade.
 *
 * O computador joga por minimax — ele simula todas as continuações possíveis
 * e escolhe a melhor. No nível difícil isso o torna imbatível: o máximo que
 * se consegue é empatar, e é por isso que empatar no difícil também vale
 * estrela. Nos níveis mais fáceis ele erra de propósito, com uma chance de
 * jogar ao acaso — errar bem é o que faz a criança querer jogar de novo.
 */

type Marca = "X" | "O" | null;

const LINHAS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function vencedor(t: Marca[]): { marca: Marca; linha: number[] } | null {
  for (const l of LINHAS) {
    const [a, b, c] = l as [number, number, number];
    if (t[a] && t[a] === t[b] && t[a] === t[c]) return { marca: t[a]!, linha: l };
  }
  return null;
}

function cheio(t: Marca[]): boolean {
  return t.every((c) => c !== null);
}

/** Pontuação do minimax: quanto antes vencer, melhor; quanto depois perder, menos ruim. */
function minimax(t: Marca[], vez: Marca, prof: number): number {
  const v = vencedor(t);
  if (v) return v.marca === "O" ? 10 - prof : prof - 10;
  if (cheio(t)) return 0;

  const notas: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (t[i]) continue;
    t[i] = vez;
    notas.push(minimax(t, vez === "O" ? "X" : "O", prof + 1));
    t[i] = null;
  }
  return vez === "O" ? Math.max(...notas) : Math.min(...notas);
}

function melhorJogada(t: Marca[], nivel: number): number {
  const livres = t.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
  // A chance de jogar ao acaso é o que cria os níveis: no fácil ele erra
  // bastante, no médio às vezes, no difícil nunca.
  const acaso = nivel === 1 ? 0.6 : nivel === 2 ? 0.25 : 0;
  if (Math.random() < acaso) return livres[Math.floor(Math.random() * livres.length)]!;

  let melhor = livres[0]!;
  let nota = -Infinity;
  for (const i of livres) {
    t[i] = "O";
    const n = minimax(t, "X", 0);
    t[i] = null;
    if (n > nota) {
      nota = n;
      melhor = i;
    }
  }
  return melhor;
}

/** O X e o O desenhados — traço grosso, para enxergar de longe. */
function Simbolo({ marca, destaque }: { marca: Marca; destaque?: boolean }) {
  if (!marca) return null;
  const cor = marca === "X" ? "#2563eb" : "#dc2626";
  return (
    <svg viewBox="0 0 100 100" className="size-full p-2" aria-hidden>
      {marca === "X" ? (
        <path
          d="M22 22 L78 78 M78 22 L22 78"
          stroke={cor}
          strokeWidth={14}
          strokeLinecap="round"
          opacity={destaque ? 1 : 0.92}
        />
      ) : (
        <circle
          cx={50}
          cy={50}
          r={28}
          fill="none"
          stroke={cor}
          strokeWidth={14}
          opacity={destaque ? 1 : 0.92}
        />
      )}
    </svg>
  );
}

export function JogoDaVelha({ adversario, nivel }: { adversario: Adversario; nivel: number }) {
  const [cenario, setCenario] = useState<"espaco" | "selva" | "oceano">("espaco");
  const [tab, setTab] = useState<Marca[]>(Array(9).fill(null));
  const [vez, setVez] = useState<Marca>("X");
  const [fim, setFim] = useState<{ marca: Marca; linha: number[] } | "empate" | null>(null);
  const [placar, setPlacar] = useState({ x: 0, o: 0, empates: 0 });
  const [estrelas, setEstrelas] = useState<number | null>(null);
  const inicio = useRef(Date.now());

  const encerrar = useCallback(
    async (res: { marca: Marca; linha: number[] } | "empate") => {
      setFim(res);
      const segundos = Math.round((Date.now() - inicio.current) / 1000);
      if (res === "empate") {
        setPlacar((p) => ({ ...p, empates: p.empates + 1 }));
        const e = await registrarPartida({
          jogo: "jogo-da-velha",
          titulo: "Jogo da velha",
          resultado: "empate",
          adversario,
          nivel,
          segundos,
        });
        setEstrelas(e);
        return;
      }
      setPlacar((p) => (res.marca === "X" ? { ...p, x: p.x + 1 } : { ...p, o: p.o + 1 }));
      // Contra o computador, quem joga é sempre o X.
      const ganhou = adversario === "colega" || res.marca === "X";
      const e = await registrarPartida({
        jogo: "jogo-da-velha",
        titulo: "Jogo da velha",
        resultado: ganhou ? "vitoria" : "derrota",
        adversario,
        nivel,
        segundos,
      });
      setEstrelas(e);
    },
    [adversario, nivel],
  );

  function jogar(i: number) {
    if (tab[i] || fim) return;
    if (adversario === "computador" && vez === "O") return;
    const novo = [...tab];
    novo[i] = vez;
    setTab(novo);
    const v = vencedor(novo);
    if (v) return void encerrar(v);
    if (cheio(novo)) return void encerrar("empate");
    setVez(vez === "X" ? "O" : "X");
  }

  // A vez do computador, com uma pausa para a criança ver o que aconteceu.
  useEffect(() => {
    if (adversario !== "computador" || vez !== "O" || fim) return;
    const t = window.setTimeout(() => {
      const i = melhorJogada([...tab], nivel);
      const novo = [...tab];
      novo[i] = "O";
      setTab(novo);
      const v = vencedor(novo);
      if (v) return void encerrar(v);
      if (cheio(novo)) return void encerrar("empate");
      setVez("X");
    }, 550);
    return () => window.clearTimeout(t);
  }, [vez, tab, fim, adversario, nivel, encerrar]);

  function novaPartida() {
    setTab(Array(9).fill(null));
    setVez("X");
    setFim(null);
    setEstrelas(null);
    inicio.current = Date.now();
  }

  const linhaVencedora = fim && fim !== "empate" ? fim.linha : [];

  return (
    <div
      className="flex min-h-[32rem] flex-col items-center gap-3 rounded-3xl border border-white/20 bg-slate-950/90 p-5 text-white shadow-2xl"
      style={{
        backgroundImage:
          "linear-gradient(180deg,rgba(2,6,23,.5),rgba(2,6,23,.94)),url(/images/jogos/central-arcade-profissional.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex gap-2">
        {(["espaco", "selva", "oceano"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setCenario(t)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-bold capitalize",
              cenario === t ? "border-cyan-300 bg-cyan-300/20" : "border-white/20 bg-black/30",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <p className="text-sm font-semibold text-foreground">
        {fim === "empate"
          ? "Deu velha! Ninguém ganhou."
          : fim
            ? adversario === "colega"
              ? `Ganhou o ${fim.marca}!`
              : fim.marca === "X"
                ? "Você ganhou!"
                : "O computador ganhou."
            : adversario === "computador"
              ? vez === "X"
                ? "Sua vez — você é o X"
                : "O computador está pensando…"
              : `Vez do ${vez}`}
      </p>

      <div
        className={cn(
          "grid grid-cols-3 gap-2 rounded-3xl border-4 p-2 shadow-2xl",
          cenario === "espaco" && "border-violet-400 bg-violet-950/70 shadow-[0_0_28px_#8b5cf6]",
          cenario === "selva" && "border-emerald-400 bg-emerald-950/70",
          cenario === "oceano" && "border-cyan-300 bg-cyan-950/70",
        )}
      >
        {tab.map((m, i) => (
          <button
            key={i}
            type="button"
            onClick={() => jogar(i)}
            disabled={!!m || !!fim}
            aria-label={`Casa ${i + 1}${m ? `, ${m}` : ", vazia"}`}
            className={cn(
              "size-[78px] rounded-2xl border-2 bg-white/90 transition-all hover:-translate-y-0.5 hover:shadow-lg",
              !m && !fim
                ? "cursor-pointer border-border hover:border-primary hover:bg-primary/5"
                : "border-border",
              linhaVencedora.includes(i) && "border-emerald-500 bg-emerald-500/15",
            )}
          >
            <Simbolo marca={m} destaque={linhaVencedora.includes(i)} />
          </button>
        ))}
      </div>

      {estrelas !== null && estrelas > 0 && (
        <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
          {"⭐".repeat(estrelas)} +{estrelas} {estrelas === 1 ? "estrela" : "estrelas"}
        </p>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          <b className="text-[#2563eb]">X</b> {placar.x}
        </span>
        <span>empates {placar.empates}</span>
        <span>
          <b className="text-[#dc2626]">O</b> {placar.o}
        </span>
      </div>

      {fim && (
        <button
          type="button"
          onClick={novaPartida}
          className="h-11 cursor-pointer rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground"
        >
          Jogar de novo
        </button>
      )}
    </div>
  );
}
