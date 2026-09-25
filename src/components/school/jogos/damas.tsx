import { RotateCw, Sparkles, Volume2, VolumeX } from "lucide-react";
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
type Tema = "classico" | "neon" | "oceano" | "floresta" | "doce";
type EstiloPeca = "disco" | "cristal" | "escudo" | "bichos";

const TEMAS: Record<Tema, { nome: string; clara: string; escura: string; moldura: string }> = {
  classico: { nome: "Madeira real", clara: "#f3dfbd", escura: "#8b5a35", moldura: "#3b2115" },
  neon: { nome: "Neon", clara: "#c4b5fd", escura: "#312e81", moldura: "#d946ef" },
  oceano: { nome: "Oceano", clara: "#cffafe", escura: "#0e7490", moldura: "#67e8f9" },
  floresta: { nome: "Floresta", clara: "#d9f99d", escura: "#3f6212", moldura: "#a3e635" },
  doce: { nome: "Doceria", clara: "#fce7f3", escura: "#be185d", moldura: "#f9a8d4" },
};

let audioDamas: AudioContext | null = null;
function somDamas(tipo: "mover" | "captura" | "dama") {
  try {
    audioDamas ??= new AudioContext();
    const ctx = audioDamas;
    if (ctx.state === "suspended") void ctx.resume();
    const notas = tipo === "captura" ? [220, 150] : tipo === "dama" ? [523, 659, 784] : [360];
    notas.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const t = ctx.currentTime + i * 0.08;
      o.type = tipo === "captura" ? "square" : "triangle";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.15);
    });
  } catch {
    // O jogo continua normalmente quando o navegador bloqueia áudio.
  }
}

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
function Disco({ peca, estilo }: { peca: Peca; estilo: EstiloPeca }) {
  const claro = peca.cor === "b";
  const cores = claro
    ? { a: "#fff7d6", b: "#f59e0b", borda: "#92400e" }
    : { a: "#312e81", b: "#a855f7", borda: "#e9d5ff" };
  return (
    <svg viewBox="0 0 100 100" className="size-full p-[6px]" aria-hidden>
      <defs>
        <radialGradient id={`peca-${peca.cor}-${estilo}`} cx="35%" cy="25%" r="75%">
          <stop offset="0" stopColor={cores.a} />
          <stop offset="1" stopColor={cores.b} />
        </radialGradient>
      </defs>
      {estilo === "escudo" ? (
        <path
          d="M50 6 88 22v28c0 24-16 38-38 46C28 88 12 74 12 50V22Z"
          fill={`url(#peca-${peca.cor}-${estilo})`}
          stroke={cores.borda}
          strokeWidth="5"
        />
      ) : estilo === "bichos" ? (
        <g>
          <circle
            cx="50"
            cy="52"
            r="39"
            fill={`url(#peca-${peca.cor}-${estilo})`}
            stroke={cores.borda}
            strokeWidth="5"
          />
          <path
            d="M23 28 28 10 41 24M77 28 72 10 59 24"
            fill={cores.b}
            stroke={cores.borda}
            strokeWidth="4"
          />
          <circle cx="38" cy="47" r="5" fill="#172033" />
          <circle cx="62" cy="47" r="5" fill="#172033" />
          <path
            d="M40 65q10 9 20 0"
            fill="none"
            stroke="#172033"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      ) : (
        <>
          <circle cx={50} cy={55} r={40} fill="#020617" opacity={0.4} />
          <circle
            cx={50}
            cy={50}
            r={40}
            fill={`url(#peca-${peca.cor}-${estilo})`}
            stroke={cores.borda}
            strokeWidth={estilo === "cristal" ? 5 : 3}
          />
          {estilo === "cristal" ? (
            <path d="M28 55 42 22h24l12 33-28 24Z" fill="#fff" opacity=".24" />
          ) : (
            <circle
              cx={50}
              cy={50}
              r={29}
              fill="none"
              stroke={cores.borda}
              strokeWidth={4}
              opacity=".7"
            />
          )}
        </>
      )}
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
  const [tema, setTema] = useState<Tema>("classico");
  const [estiloPeca, setEstiloPeca] = useState<EstiloPeca>("disco");
  const [cenario, setCenario] = useState<"arena" | "biblioteca">("arena");
  const [girado, setGirado] = useState(false);
  const [som, setSom] = useState(true);
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
    if (som) {
      const virou = !tab[j.de]?.dama && novo[j.para]?.dama;
      somDamas(virou ? "dama" : j.capturadas.length ? "captura" : "mover");
    }
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
      className="flex min-h-[42rem] flex-col items-center gap-3 overflow-hidden rounded-3xl border border-white/20 bg-slate-950/90 p-4 text-white shadow-2xl"
      style={{
        backgroundImage: `linear-gradient(180deg,rgba(2,6,23,.28),rgba(2,6,23,.94)),url(/images/jogos/personalizacao/damas-${cenario}.webp)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-3xl rounded-2xl border border-white/15 bg-slate-950/75 p-3 backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">
              Academia de estratégia
            </p>
            <h3 className="text-xl font-black">Damas — monte seu estilo</h3>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setGirado((v) => !v)}
              className="flex h-10 items-center gap-1 rounded-xl bg-white/10 px-3 text-xs font-bold hover:bg-white/20"
            >
              <RotateCw className="size-4" /> Girar
            </button>
            <button
              type="button"
              onClick={() => setSom((v) => !v)}
              aria-label={som ? "Desligar sons" : "Ligar sons"}
              className="flex size-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20"
            >
              {som ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </button>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="text-[11px] font-bold text-slate-300">
            Cenário
            <select
              value={cenario}
              onChange={(e) => setCenario(e.target.value as typeof cenario)}
              className="mt-1 h-10 w-full rounded-xl border border-white/15 bg-slate-900 px-2 text-sm text-white"
            >
              <option value="arena">Cidade do futuro</option>
              <option value="biblioteca">Biblioteca mágica</option>
            </select>
          </label>
          <label className="text-[11px] font-bold text-slate-300">
            Tabuleiro
            <select
              value={tema}
              onChange={(e) => setTema(e.target.value as Tema)}
              className="mt-1 h-10 w-full rounded-xl border border-white/15 bg-slate-900 px-2 text-sm text-white"
            >
              {Object.entries(TEMAS).map(([id, t]) => (
                <option key={id} value={id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-bold text-slate-300">
            Peças
            <select
              value={estiloPeca}
              onChange={(e) => setEstiloPeca(e.target.value as EstiloPeca)}
              className="mt-1 h-10 w-full rounded-xl border border-white/15 bg-slate-900 px-2 text-sm text-white"
            >
              <option value="disco">Discos clássicos</option>
              <option value="cristal">Cristais</option>
              <option value="escudo">Escudos</option>
              <option value="bichos">Animais</option>
            </select>
          </label>
        </div>
      </div>
      <div
        className="flex flex-wrap justify-center gap-2"
        aria-label="Atalhos de tema do tabuleiro"
      >
        {(Object.keys(TEMAS) as Tema[]).map((t) => (
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
            <span
              className="mr-1 inline-block size-3 rounded-full"
              style={{ background: TEMAS[t].escura }}
            />
            {TEMAS[t].nome}
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
          "grid w-[min(92vw,calc(100dvh-17rem),34rem)] grid-cols-8 overflow-hidden rounded-xl border-4 shadow-2xl transition-transform duration-500",
          tema === "neon" && "shadow-[0_0_30px_#d946ef]",
        )}
        style={{
          borderColor: TEMAS[tema].moldura,
          transform: girado ? "rotate(180deg)" : undefined,
        }}
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
                sel === i && "ring-4 ring-inset ring-primary",
                podeIr && "cursor-pointer",
                ehOrigem && !fim && "cursor-pointer",
              )}
              style={{ backgroundColor: escura(i) ? TEMAS[tema].escura : TEMAS[tema].clara }}
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
                  <span
                    className="block size-full transition-transform duration-500"
                    style={{ transform: girado ? "rotate(180deg)" : undefined }}
                  >
                    <Disco peca={c} estilo={estiloPeca} />
                  </span>
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
      <div className="flex max-w-xl items-start gap-2 rounded-xl border border-cyan-300/25 bg-slate-950/75 px-3 py-2 text-xs text-slate-200 backdrop-blur">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-cyan-300" />
        <span>
          <b>Estratégia:</b> controle o centro, proteja a última fileira e procure sequências de
          captura. Os pontos verdes mostram jogadas possíveis.
        </span>
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
