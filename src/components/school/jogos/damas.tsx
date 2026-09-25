import { useCallback, useEffect, useRef, useState } from "react";

import { registrarPartida, type Adversario } from "@/lib/estrelas";
import { cn } from "@/lib/utils";

/**
 * Damas, com as regras que se joga aqui:
 *
 * - tabuleiro 8×8, peças nas casas escuras;
 * - a peça comum anda uma casa na diagonal, para a frente;
 * - a captura pode ser para a frente ou para trás, e é obrigatória — se há
 *   captura no tabuleiro, só as jogadas de captura valem;
 * - capturas em sequência continuam na mesma vez;
 * - a peça que chega na última fila vira dama e passa a andar quantas casas
 *   quiser na diagonal.
 *
 * A captura obrigatória é o que deixa o jogo de verdade — sem ela, vira outro
 * jogo. O computador escolhe a jogada olhando um lance à frente, com peso
 * maior para dama e para a quantidade capturada: joga bem o suficiente para
 * dar trabalho e mal o suficiente para a criança ganhar às vezes.
 */

type Cor = "b" | "p"; // branco (criança) e preto (computador)
interface Peca {
  cor: Cor;
  dama: boolean;
}
type Casa = Peca | null;
type Tab = Casa[];

interface Jogada {
  de: number;
  para: number;
  capturadas: number[];
}

const L = 8;
const idx = (l: number, c: number) => l * L + c;
const linha = (i: number) => Math.floor(i / L);
const coluna = (i: number) => i % L;
const escura = (i: number) => (linha(i) + coluna(i)) % 2 === 1;

function tabuleiroInicial(): Tab {
  const t: Tab = Array(64).fill(null);
  for (let i = 0; i < 64; i++) {
    if (!escura(i)) continue;
    if (linha(i) < 3) t[i] = { cor: "p", dama: false };
    if (linha(i) > 4) t[i] = { cor: "b", dama: false };
  }
  return t;
}

const DIAGONAIS = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
] as const;

/** Capturas a partir de uma casa, encadeando quantas forem possíveis. */
function capturasDe(t: Tab, i: number, jaComidas: number[] = []): Jogada[] {
  const p = t[i];
  if (!p) return [];
  const saidas: Jogada[] = [];

  for (const [dl, dc] of DIAGONAIS) {
    if (p.dama) {
      // A dama corre a diagonal até achar uma peça adversária com casa vazia
      // logo atrás; daí pode parar em qualquer casa livre depois dela.
      let l = linha(i) + dl;
      let c = coluna(i) + dc;
      let alvo = -1;
      while (l >= 0 && l < L && c >= 0 && c < L) {
        const j = idx(l, c);
        const q = t[j];
        if (q) {
          if (q.cor === p.cor || jaComidas.includes(j)) break;
          alvo = j;
          l += dl;
          c += dc;
          break;
        }
        l += dl;
        c += dc;
      }
      if (alvo >= 0) {
        while (l >= 0 && l < L && c >= 0 && c < L) {
          const destino = idx(l, c);
          if (t[destino]) break;
          saidas.push({ de: i, para: destino, capturadas: [...jaComidas, alvo] });
          l += dl;
          c += dc;
        }
      }
    } else {
      const lm = linha(i) + dl;
      const cm = coluna(i) + dc;
      const ld = linha(i) + dl * 2;
      const cd = coluna(i) + dc * 2;
      if (ld < 0 || ld >= L || cd < 0 || cd >= L) continue;
      const meio = idx(lm, cm);
      const destino = idx(ld, cd);
      const q = t[meio];
      if (!q || q.cor === p.cor || jaComidas.includes(meio)) continue;
      if (t[destino]) continue;
      saidas.push({ de: i, para: destino, capturadas: [...jaComidas, meio] });
    }
  }

  // Cada captura pode continuar: refaz o tabuleiro sem a peça comida e tenta
  // de novo a partir da casa de destino.
  const encadeadas: Jogada[] = [];
  for (const s of saidas) {
    const copia = [...t];
    copia[s.para] = copia[s.de] ?? null;
    copia[s.de] = null;
    for (const c of s.capturadas) copia[c] = null;
    const seguintes = capturasDe(copia, s.para, s.capturadas);
    if (seguintes.length) encadeadas.push(...seguintes.map((x) => ({ ...x, de: i })));
    else encadeadas.push(s);
  }
  return encadeadas;
}

function movimentosSimples(t: Tab, i: number): Jogada[] {
  const p = t[i];
  if (!p) return [];
  const saidas: Jogada[] = [];
  const frente = p.cor === "b" ? -1 : 1;
  for (const [dl, dc] of DIAGONAIS) {
    if (!p.dama && dl !== frente) continue;
    if (p.dama) {
      let l = linha(i) + dl;
      let c = coluna(i) + dc;
      while (l >= 0 && l < L && c >= 0 && c < L && !t[idx(l, c)]) {
        saidas.push({ de: i, para: idx(l, c), capturadas: [] });
        l += dl;
        c += dc;
      }
    } else {
      const l = linha(i) + dl;
      const c = coluna(i) + dc;
      if (l < 0 || l >= L || c < 0 || c >= L) continue;
      if (!t[idx(l, c)]) saidas.push({ de: i, para: idx(l, c), capturadas: [] });
    }
  }
  return saidas;
}

/** Todas as jogadas válidas — com captura obrigatória aplicada. */
function jogadasDe(t: Tab, cor: Cor): Jogada[] {
  const capturas: Jogada[] = [];
  const simples: Jogada[] = [];
  for (let i = 0; i < 64; i++) {
    if (t[i]?.cor !== cor) continue;
    capturas.push(...capturasDe(t, i));
    simples.push(...movimentosSimples(t, i));
  }
  if (!capturas.length) return simples;
  // Entre as capturas, a regra da escola manda comer o máximo possível.
  const max = Math.max(...capturas.map((c) => c.capturadas.length));
  return capturas.filter((c) => c.capturadas.length === max);
}

function aplicar(t: Tab, j: Jogada): Tab {
  const novo = [...t];
  const p = novo[j.de]!;
  novo[j.de] = null;
  for (const c of j.capturadas) novo[c] = null;
  const virouDama =
    !p.dama && ((p.cor === "b" && linha(j.para) === 0) || (p.cor === "p" && linha(j.para) === 7));
  novo[j.para] = { cor: p.cor, dama: p.dama || virouDama };
  return novo;
}

function conta(t: Tab, cor: Cor): number {
  return t.reduce((s, c) => s + (c?.cor === cor ? (c.dama ? 3 : 1) : 0), 0);
}

/** Escolha do computador: captura o máximo, evita entregar peça de graça. */
function jogadaDoComputador(t: Tab, nivel: number): Jogada | null {
  const opcoes = jogadasDe(t, "p");
  if (!opcoes.length) return null;
  if (nivel === 1) return opcoes[Math.floor(Math.random() * opcoes.length)]!;

  let melhor = opcoes[0]!;
  let nota = -Infinity;
  for (const j of opcoes) {
    const depois = aplicar(t, j);
    let n = j.capturadas.length * 10 + conta(depois, "p") - conta(depois, "b");
    if (nivel >= 3) {
      // Olha a resposta do adversário: se ele come muito, a jogada é ruim.
      const resposta = jogadasDe(depois, "b");
      const perda = resposta.length ? Math.max(...resposta.map((r) => r.capturadas.length)) : 0;
      n -= perda * 8;
    }
    if (n > nota) {
      nota = n;
      melhor = j;
    }
  }
  return melhor;
}

/** A peça desenhada: disco com bisel e, na dama, a coroa. */
function Disco({ peca }: { peca: Peca }) {
  const claro = peca.cor === "b";
  return (
    <svg viewBox="0 0 100 100" className="size-full p-[6px]" aria-hidden>
      <circle cx={50} cy={54} r={40} fill={claro ? "#b6b0a4" : "#0f0f10"} opacity={0.55} />
      <circle cx={50} cy={50} r={40} fill={claro ? "#f5f0e6" : "#2b2b2e"} />
      <circle
        cx={50}
        cy={50}
        r={31}
        fill="none"
        stroke={claro ? "#cfc7b6" : "#4a4a4f"}
        strokeWidth={4}
      />
      <ellipse cx={42} cy={36} rx={13} ry={8} fill="#ffffff" opacity={claro ? 0.7 : 0.12} />
      {peca.dama && (
        <path
          d="M32 56 l6 -16 l12 10 l12 -10 l6 16 z"
          fill={claro ? "#d4a017" : "#f2c14e"}
          stroke={claro ? "#a97b12" : "#8a6a12"}
          strokeWidth={2}
        />
      )}
    </svg>
  );
}

export function Damas({ adversario, nivel }: { adversario: Adversario; nivel: number }) {
  const [tema, setTema] = useState<"madeira" | "neon" | "oceano">("madeira");
  const [tab, setTab] = useState<Tab>(tabuleiroInicial);
  const [vez, setVez] = useState<Cor>("b");
  const [sel, setSel] = useState<number | null>(null);
  const [fim, setFim] = useState<Cor | "empate" | null>(null);
  const [estrelas, setEstrelas] = useState<number | null>(null);
  const inicio = useRef(Date.now());
  const arraste = useRef<{ de: number; x: number; y: number; moveu: boolean } | null>(null);
  const ignorarClique = useRef(false);
  const [puxando, setPuxando] = useState<{ de: number; dx: number; dy: number } | null>(null);

  const legais = jogadasDe(tab, vez);
  const destinos = sel === null ? [] : legais.filter((j) => j.de === sel);
  const origens = [...new Set(legais.map((j) => j.de))];

  const encerrar = useCallback(
    async (vencedor: Cor | "empate") => {
      setFim(vencedor);
      const segundos = Math.round((Date.now() - inicio.current) / 1000);
      const ganhou = adversario === "colega" ? vencedor !== "empate" : vencedor === "b";
      setEstrelas(
        await registrarPartida({
          jogo: "damas",
          titulo: "Damas",
          resultado: vencedor === "empate" ? "empate" : ganhou ? "vitoria" : "derrota",
          adversario,
          nivel,
          segundos,
        }),
      );
    },
    [adversario, nivel],
  );

  function executar(j: Jogada) {
    const novo = aplicar(tab, j);
    setTab(novo);
    setSel(null);
    const proxima: Cor = vez === "b" ? "p" : "b";
    if (!jogadasDe(novo, proxima).length) {
      void encerrar(conta(novo, "b") > conta(novo, "p") ? "b" : "p");
      return;
    }
    setVez(proxima);
  }

  /** Soltar a peça arrastada sobre uma casa de destino. */
  function soltar(de: number, x: number, y: number) {
    if (fim || (adversario === "computador" && vez === "p")) return;
    const alvo = document.elementFromPoint(x, y)?.closest("[data-casa]");
    const para = alvo ? Number(alvo.getAttribute("data-casa")) : -1;
    const jogada = legais.find((j) => j.de === de && j.para === para);
    if (jogada) executar(jogada);
    else setSel(null);
  }

  function tocar(i: number) {
    if (fim) return;
    if (adversario === "computador" && vez === "p") return;
    const jogada = destinos.find((j) => j.para === i);
    if (jogada) return executar(jogada);
    if (origens.includes(i)) setSel(i);
    else setSel(null);
  }

  useEffect(() => {
    if (adversario !== "computador" || vez !== "p" || fim) return;
    const t = window.setTimeout(() => {
      const j = jogadaDoComputador(tab, nivel);
      if (!j) return void encerrar("b");
      const novo = aplicar(tab, j);
      setTab(novo);
      if (!jogadasDe(novo, "b").length) {
        void encerrar(conta(novo, "b") > conta(novo, "p") ? "b" : "p");
        return;
      }
      setVez("b");
    }, 650);
    return () => window.clearTimeout(t);
  }, [vez, tab, fim, adversario, nivel, encerrar]);

  function novaPartida() {
    setTab(tabuleiroInicial());
    setVez("b");
    setSel(null);
    setFim(null);
    setEstrelas(null);
    inicio.current = Date.now();
  }

  const temCaptura = legais.some((j) => j.capturadas.length > 0);

  return (
    <div
      className="flex min-h-[34rem] flex-col items-center gap-2 rounded-3xl border border-white/20 bg-slate-950/90 p-4 text-white shadow-2xl"
      style={{
        backgroundImage:
          "linear-gradient(180deg,rgba(2,6,23,.5),rgba(2,6,23,.94)),url(/images/jogos/central-arcade-profissional.png)",
        backgroundSize: "cover",
      }}
    >
      <div className="flex flex-wrap justify-center gap-2" aria-label="Tema do tabuleiro">
        {(["madeira", "neon", "oceano"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTema(t)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-bold capitalize",
              tema === t
                ? "border-amber-300 bg-amber-300/20 text-amber-100"
                : "border-white/20 bg-black/30 text-slate-200",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <p className="text-sm font-semibold text-foreground">
        {fim
          ? fim === "empate"
            ? "Empate!"
            : adversario === "colega"
              ? `Ganharam as peças ${fim === "b" ? "claras" : "escuras"}!`
              : fim === "b"
                ? "Você ganhou!"
                : "O computador ganhou."
          : adversario === "computador"
            ? vez === "b"
              ? "Sua vez — peças claras"
              : "O computador está pensando…"
            : `Vez das peças ${vez === "b" ? "claras" : "escuras"}`}
      </p>
      {!fim && temCaptura && (
        <p className="rounded-lg bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
          Tem captura no tabuleiro — comer é obrigatório!
        </p>
      )}

      <div
        className={cn(
          "grid w-[min(92vw,calc(100dvh-12rem),32rem)] grid-cols-8 overflow-hidden rounded-xl border-4 shadow-2xl",
          tema === "madeira" && "border-amber-950",
          tema === "neon" && "border-fuchsia-400 shadow-[0_0_30px_#d946ef]",
          tema === "oceano" && "border-cyan-300 shadow-[0_0_25px_#22d3ee]",
        )}
      >
        {tab.map((c, i) => {
          const podeIr = destinos.some((j) => j.para === i);
          const ehOrigem = origens.includes(i);
          return (
            <button
              key={i}
              type="button"
              data-casa={i}
              onClick={() => {
                if (ignorarClique.current) {
                  ignorarClique.current = false;
                  return;
                }
                tocar(i);
              }}
              onPointerDown={(e) => {
                if (fim || !c || !origens.includes(i)) return;
                if (adversario === "computador" && vez === "p") return;
                e.currentTarget.setPointerCapture(e.pointerId);
                arraste.current = { de: i, x: e.clientX, y: e.clientY, moveu: false };
              }}
              onPointerMove={(e) => {
                const a = arraste.current;
                if (!a || a.de !== i) return;
                const dx = e.clientX - a.x;
                const dy = e.clientY - a.y;
                if (!a.moveu && Math.hypot(dx, dy) > 6) {
                  a.moveu = true;
                  setSel(i);
                }
                if (a.moveu) setPuxando({ de: i, dx, dy });
              }}
              onPointerUp={(e) => {
                const a = arraste.current;
                arraste.current = null;
                setPuxando(null);
                if (!a || !(a.moveu || Math.hypot(e.clientX - a.x, e.clientY - a.y) > 6)) return;
                ignorarClique.current = true;
                soltar(a.de, e.clientX, e.clientY);
              }}
              onPointerCancel={() => {
                arraste.current = null;
                setPuxando(null);
              }}
              aria-label={`Casa ${linha(i) + 1},${coluna(i) + 1}`}
              className={cn(
                "relative aspect-square w-full touch-none transition-colors",
                puxando?.de === i && "z-20",
                tema === "madeira" && (escura(i) ? "bg-[#8a5a34]" : "bg-[#e8d5b7]"),
                tema === "neon" && (escura(i) ? "bg-violet-950" : "bg-fuchsia-300"),
                tema === "oceano" && (escura(i) ? "bg-cyan-900" : "bg-sky-100"),
                sel === i && "ring-4 ring-inset ring-primary",
                podeIr && "cursor-pointer",
                ehOrigem && !fim && "cursor-pointer",
              )}
            >
              {c && (
                <span
                  className="block size-full"
                  style={
                    puxando?.de === i
                      ? {
                          transform: `translate(${puxando.dx}px, ${puxando.dy}px) scale(1.15)`,
                          filter: "drop-shadow(0 6px 6px rgba(0,0,0,.45))",
                          pointerEvents: "none",
                        }
                      : undefined
                  }
                >
                  <Disco peca={c} />
                </span>
              )}
              {podeIr && (
                <span className="absolute inset-0 m-auto size-4 rounded-full bg-emerald-400/90 shadow" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Claras: {tab.filter((c) => c?.cor === "b").length}</span>
        <span>Escuras: {tab.filter((c) => c?.cor === "p").length}</span>
      </div>

      {estrelas !== null && estrelas > 0 && (
        <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
          {"⭐".repeat(estrelas)} +{estrelas} {estrelas === 1 ? "estrela" : "estrelas"}
        </p>
      )}

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
