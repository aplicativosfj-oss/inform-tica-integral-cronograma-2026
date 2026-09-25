import { Calculator, Rocket, Sparkles, Volume2 } from "lucide-react";
import { useMemo, useState } from "react";

import type { Adversario } from "@/lib/estrelas";
import { falar } from "@/lib/voz";
import { cn } from "@/lib/utils";

function som(frequencia = 440, duracao = 0.12) {
  try {
    const Ctx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const ganho = ctx.createGain();
    osc.frequency.value = frequencia;
    ganho.gain.setValueAtTime(0.11, ctx.currentTime);
    ganho.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duracao);
    osc.connect(ganho).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duracao);
  } catch {
    /* o jogo continua silencioso quando o navegador bloqueia áudio */
  }
}

const fundo = "url(/images/jogos/central-arcade-profissional.png)";

export function PinballEducativo({ nivel }: { adversario: Adversario; nivel: number }) {
  const [pontos, setPontos] = useState(0);
  const [bolas, setBolas] = useState(3);
  const [tema, setTema] = useState<"cosmos" | "oceano" | "floresta">("cosmos");
  const multiplicador = nivel;
  function lancar() {
    if (!bolas) {
      setBolas(3);
      setPontos(0);
      return;
    }
    const ganho = (25 + Math.floor(Math.random() * 76)) * multiplicador;
    setPontos((p) => p + ganho);
    setBolas((b) => b - 1);
    som(520 + ganho, 0.22);
  }
  return (
    <div
      className="relative min-h-[34rem] overflow-hidden rounded-3xl border-4 border-fuchsia-400 bg-slate-950 p-4 text-white shadow-2xl"
      style={{
        backgroundImage: `linear-gradient(180deg,rgba(2,6,23,.25),rgba(2,6,23,.92)),${fundo}`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[.25em] text-cyan-300">
            Arcade luminoso
          </p>
          <h3 className="text-2xl font-black">Pinball das Descobertas</h3>
        </div>
        <div className="rounded-2xl border border-white/20 bg-black/40 px-4 py-2 text-right">
          <b className="text-2xl text-amber-300">{pontos}</b>
          <p className="text-[10px] uppercase">pontos · {bolas} bolas</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        {(["cosmos", "oceano", "floresta"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTema(t)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-bold capitalize",
              tema === t ? "border-cyan-300 bg-cyan-300/20" : "border-white/20 bg-black/30",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="relative mx-auto mt-4 h-[24rem] max-w-md overflow-hidden rounded-[2.5rem] border-4 border-cyan-300/70 bg-gradient-to-b from-indigo-950/70 to-fuchsia-950/90 shadow-[inset_0_0_45px_#22d3ee,0_0_30px_#d946ef]">
        {["★", "7", "A", "+", "★", "B"].map((x, i) => (
          <button
            key={i}
            onClick={() => {
              setPontos((p) => p + 10 * multiplicador);
              som(660 + i * 40);
            }}
            className="absolute grid size-14 place-items-center rounded-full border-4 border-amber-200 bg-gradient-to-br from-fuchsia-500 to-indigo-800 text-xl font-black shadow-[0_0_20px_#f0abfc] transition hover:scale-110"
            style={{ left: `${12 + (i % 3) * 35}%`, top: `${14 + Math.floor(i / 3) * 34}%` }}
          >
            {x}
          </button>
        ))}
        <div className="absolute bottom-4 left-1/2 size-12 -translate-x-1/2 animate-bounce rounded-full bg-gradient-to-br from-white to-cyan-300 shadow-[0_0_24px_white]" />
        <div className="absolute bottom-4 left-8 h-4 w-28 -rotate-12 rounded-full bg-fuchsia-400 shadow-[0_0_12px_#e879f9]" />
        <div className="absolute bottom-4 right-8 h-4 w-28 rotate-12 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />
      </div>
      <button
        onClick={lancar}
        className="mx-auto mt-4 flex min-h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-8 font-black text-slate-950 shadow-lg active:scale-95"
      >
        <Sparkles className="size-5" />
        {bolas ? "Lançar bola" : "Nova rodada"}
      </button>
    </div>
  );
}

type Missao = "aventura" | "alfabetizacao" | "matematica";
export function NaveEducativa({ nivel }: { adversario: Adversario; nivel: number }) {
  const [missao, setMissao] = useState<Missao>("aventura");
  const [pontos, setPontos] = useState(0);
  const [energia, setEnergia] = useState(100);
  const questoes = useMemo(
    () =>
      missao === "alfabetizacao"
        ? ["Qual letra inicia LUA?", "Encontre a sílaba de NAVE", "Forme a palavra ESTRELA"]
        : missao === "matematica"
          ? [`${nivel * 4} + ${nivel * 3} = ?`, `Qual planeta está em 3º?`, `${nivel * 5} × 2 = ?`]
          : ["Desvie dos meteoros!", "Colete a estrela azul!", "Proteja o planeta!"],
    [missao, nivel],
  );
  const [indice, setIndice] = useState(0);
  function acao(valor: number) {
    setPontos((p) => p + valor);
    setEnergia((e) => Math.max(20, e - 4));
    som(400 + valor);
    setIndice((i) => (i + 1) % questoes.length);
  }
  return (
    <div
      className="relative min-h-[36rem] overflow-hidden rounded-3xl bg-slate-950 p-4 text-white"
      style={{
        backgroundImage: `linear-gradient(180deg,rgba(2,6,23,.38),rgba(2,6,23,.9)),${fundo}`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[.25em] text-violet-300">
            Academia Galáctica
          </p>
          <h3 className="text-2xl font-black">Esquadrão Estelar</h3>
        </div>
        <div className="rounded-xl bg-black/40 px-4 py-2">
          <b className="text-amber-300">{pontos} XP</b>
          <p className="text-xs">energia {energia}%</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {(
          [
            ["aventura", "🚀 Aventura"],
            ["alfabetizacao", "🔤 Palavras"],
            ["matematica", "🧮 Matemática"],
          ] as const
        ).map(([id, nome]) => (
          <button
            key={id}
            onClick={() => {
              setMissao(id);
              setIndice(0);
              falar(nome);
            }}
            className={cn(
              "rounded-2xl border p-2 text-xs font-black",
              missao === id ? "border-cyan-300 bg-cyan-400/20" : "border-white/20 bg-black/30",
            )}
          >
            {nome}
          </button>
        ))}
      </div>
      <div className="relative mt-4 h-80 overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-b from-indigo-950/20 to-black/60">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)",
            backgroundSize: "37px 37px",
          }}
        />
        {[12, 42, 72].map((x, i) => (
          <button
            key={x}
            onClick={() => acao((i + 1) * 10)}
            className="absolute grid size-16 animate-pulse place-items-center rounded-full border-2 border-cyan-200 bg-violet-500/50 text-2xl shadow-[0_0_25px_#67e8f9] hover:scale-110"
            style={{ left: `${x}%`, top: `${18 + i * 20}%` }}
          >
            {missao === "matematica"
              ? ["+", "×", "="][i]
              : missao === "alfabetizacao"
                ? ["A", "BA", "Z"][i]
                : ["★", "🪐", "💎"][i]}
          </button>
        ))}
        <Rocket className="absolute bottom-6 left-1/2 size-20 -translate-x-1/2 -rotate-12 text-cyan-200 drop-shadow-[0_0_12px_#22d3ee]" />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-violet-300/30 bg-black/45 p-3">
        <div>
          <p className="text-[10px] font-black uppercase text-violet-300">Missão do professor</p>
          <p className="font-bold">{questoes[indice]}</p>
        </div>
        <button
          onClick={() => falar(questoes[indice]!)}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-violet-500"
        >
          <Volume2 />
        </button>
      </div>
    </div>
  );
}

type Baralho = "alfabeto" | "matematica" | "classico";
export function CartasEducativas({ nivel }: { adversario: Adversario; nivel: number }) {
  const [modo, setModo] = useState<Baralho>("alfabeto");
  const [viradas, setViradas] = useState<number[]>([]);
  const [pontos, setPontos] = useState(0);
  const cartas =
    modo === "alfabeto"
      ? ["A", "AVIÃO", "B", "BOLA", "C", "CASA", "D", "DADO"]
      : modo === "matematica"
        ? ["2+2", "4", "3×2", "6", "10-3", "7", "8÷2", "4"]
        : ["A♠", "K♥", "Q♦", "J♣", "10♠", "9♥", "8♦", "7♣"];
  function virar(i: number) {
    if (viradas.includes(i)) return;
    const n = [...viradas, i].slice(-2);
    setViradas(n);
    som(460 + i * 20);
    if (n.length === 2) {
      const a = cartas[n[0]!]!,
        b = cartas[n[1]!]!;
      if (modo !== "classico" && Math.floor(n[0]! / 2) === Math.floor(n[1]! / 2)) {
        setPontos((p) => p + 10 * nivel);
        falar(`${a}, ${b}`);
      }
    }
  }
  return (
    <div
      className="min-h-[34rem] rounded-3xl border-4 border-emerald-700 bg-emerald-950 p-4 text-white shadow-2xl"
      style={{
        backgroundImage: `linear-gradient(135deg,rgba(2,44,34,.86),rgba(15,23,42,.9)),${fundo}`,
        backgroundSize: "cover",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">
            Mesa interativa
          </p>
          <h3 className="text-2xl font-black">Clube das Cartas</h3>
        </div>
        <b className="rounded-xl bg-black/35 px-4 py-2 text-amber-300">{pontos} pontos</b>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {(
          [
            ["alfabeto", "🔤 Alfabetização"],
            ["matematica", "🧮 Matemática"],
            ["classico", "♠️ Baralho"],
          ] as const
        ).map(([id, n]) => (
          <button
            key={id}
            onClick={() => {
              setModo(id);
              setViradas([]);
            }}
            className={cn(
              "rounded-xl border p-2 text-xs font-black",
              modo === id ? "border-amber-300 bg-amber-300/20" : "border-white/20 bg-black/30",
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mx-auto mt-6 grid max-w-xl grid-cols-4 gap-3">
        {cartas.map((c, i) => (
          <button
            key={`${modo}-${i}`}
            onClick={() => virar(i)}
            className={cn(
              "aspect-[.7] rounded-xl border-4 text-lg font-black shadow-xl transition duration-300",
              viradas.includes(i)
                ? "rotate-0 border-amber-200 bg-white text-slate-900"
                : "rotate-1 border-indigo-300 bg-gradient-to-br from-indigo-700 to-violet-950 text-transparent hover:-translate-y-1",
            )}
          >
            {viradas.includes(i) ? c : "✦"}
          </button>
        ))}
      </div>
      <p className="mt-5 text-center text-sm text-emerald-100">
        {modo === "classico"
          ? "Baralho convencional para jogos em dupla e reconhecimento de naipes."
          : "Vire duas cartas e encontre o par que ensina."}
      </p>
    </div>
  );
}
