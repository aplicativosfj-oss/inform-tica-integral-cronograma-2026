import { useCallback, useEffect, useRef, useState } from "react";

import { registrarPartida, type Adversario } from "@/lib/estrelas";
import { cn } from "@/lib/utils";

/**
 * Dominó de 28 peças, do 0-0 ao 6-6.
 *
 * Regras da mesa: cada um começa com sete pedras, quem tem a maior carroça
 * abre, e joga-se encaixando num dos dois lados da mesa. Sem pedra que sirva,
 * compra do monte; monte vazio, passa a vez. Ganha quem bater primeiro ou,
 * se o jogo trancar, quem tiver menos pontos na mão.
 *
 * O computador joga o que qualquer criança esperta joga: solta primeiro a
 * pedra mais pesada que encaixa, para não ficar com carroça na mão no fim.
 */

interface Pedra {
  a: number;
  b: number;
  id: string;
}

type Lado = "esquerda" | "direita";

function baralho(): Pedra[] {
  const p: Pedra[] = [];
  for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) p.push({ a, b, id: `${a}-${b}` });
  return p;
}

function embaralhar<T>(l: T[]): T[] {
  const c = [...l];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j]!, c[i]!];
  }
  return c;
}

const peso = (p: Pedra) => p.a + p.b;

function encaixa(p: Pedra, ponta: number): boolean {
  return p.a === ponta || p.b === ponta;
}

/** Posição dos pontinhos em cada face, como no dominó de verdade. */
const PONTOS: Record<number, [number, number][]> = {
  0: [],
  1: [[50, 50]],
  2: [
    [30, 30],
    [70, 70],
  ],
  3: [
    [30, 30],
    [50, 50],
    [70, 70],
  ],
  4: [
    [30, 30],
    [70, 30],
    [30, 70],
    [70, 70],
  ],
  5: [
    [30, 30],
    [70, 30],
    [50, 50],
    [30, 70],
    [70, 70],
  ],
  6: [
    [30, 25],
    [70, 25],
    [30, 50],
    [70, 50],
    [30, 75],
    [70, 75],
  ],
};

function Face({ n, y }: { n: number; y: number }) {
  return (
    <g transform={`translate(0 ${y})`}>
      {(PONTOS[n] ?? []).map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy * 0.5} r={7} fill="#1c1917" />
      ))}
    </g>
  );
}

/** A pedra em pé (mão) ou deitada (mesa). */
function PedraSVG({ p, deitada = false }: { p: Pedra; deitada?: boolean }) {
  const corpo = (
    <svg
      viewBox="0 0 100 100"
      className={deitada ? "h-9 w-[72px]" : "h-[72px] w-9"}
      role="img"
      aria-label={`Pedra ${p.a} e ${p.b}`}
    >
      <g transform={deitada ? "rotate(-90 50 50)" : ""}>
        <rect
          x={4}
          y={4}
          width={92}
          height={92}
          rx={9}
          fill="#fdfcf7"
          stroke="#b6b0a4"
          strokeWidth={3}
        />
        <line x1={10} y1={50} x2={90} y2={50} stroke="#b6b0a4" strokeWidth={3} />
        <Face n={p.a} y={0} />
        <Face n={p.b} y={50} />
      </g>
    </svg>
  );
  return corpo;
}

export function Domino({ adversario, nivel }: { adversario: Adversario; nivel: number }) {
  const [maoJogador, setMaoJogador] = useState<Pedra[]>([]);
  const [maoAdv, setMaoAdv] = useState<Pedra[]>([]);
  const [monte, setMonte] = useState<Pedra[]>([]);
  const [mesa, setMesa] = useState<Pedra[]>([]);
  const [pontas, setPontas] = useState<[number, number]>([-1, -1]);
  const [vez, setVez] = useState<1 | 2>(1);
  const [sel, setSel] = useState<string | null>(null);
  const [fim, setFim] = useState<string | null>(null);
  const [estrelas, setEstrelas] = useState<number | null>(null);
  const [aviso, setAviso] = useState("");
  const inicio = useRef(Date.now());

  const distribuir = useCallback(() => {
    const todas = embaralhar(baralho());
    const m1 = todas.slice(0, 7);
    const m2 = todas.slice(7, 14);
    setMaoJogador(m1);
    setMaoAdv(m2);
    setMonte(todas.slice(14));
    setMesa([]);
    setPontas([-1, -1]);
    setSel(null);
    setFim(null);
    setEstrelas(null);
    setAviso("");
    inicio.current = Date.now();
    // Abre quem tem a maior carroça; sem carroça, a pedra mais pesada.
    const maior = (m: Pedra[]) =>
      Math.max(...m.map((p) => (p.a === p.b ? 100 + peso(p) : peso(p))));
    setVez(maior(m1) >= maior(m2) ? 1 : 2);
  }, []);

  useEffect(distribuir, [distribuir]);

  const encerrar = useCallback(
    async (texto: string, ganhou: boolean | null) => {
      setFim(texto);
      const segundos = Math.round((Date.now() - inicio.current) / 1000);
      setEstrelas(
        await registrarPartida({
          jogo: "domino",
          titulo: "Dominó",
          resultado: ganhou === null ? "empate" : ganhou ? "vitoria" : "derrota",
          adversario,
          nivel,
          segundos,
        }),
      );
    },
    [adversario, nivel],
  );

  function podeJogar(m: Pedra[]): boolean {
    if (!mesa.length) return m.length > 0;
    return m.some((p) => encaixa(p, pontas[0]) || encaixa(p, pontas[1]));
  }

  function colocar(p: Pedra, lado: Lado, deQuem: 1 | 2) {
    if (!mesa.length) {
      setMesa([p]);
      setPontas([p.a, p.b]);
    } else if (lado === "esquerda") {
      const ponta = pontas[0];
      const virada = p.b === ponta ? p : { ...p, a: p.b, b: p.a };
      setMesa((m) => [virada, ...m]);
      setPontas(([, d]) => [virada.a, d]);
    } else {
      const ponta = pontas[1];
      const virada = p.a === ponta ? p : { ...p, a: p.b, b: p.a };
      setMesa((m) => [...m, virada]);
      setPontas(([e]) => [e, virada.b]);
    }
    if (deQuem === 1) setMaoJogador((m) => m.filter((x) => x.id !== p.id));
    else setMaoAdv((m) => m.filter((x) => x.id !== p.id));
  }

  function jogarNaPonta(lado: Lado) {
    if (fim || vez !== 1 || !sel) return;
    const p = maoJogador.find((x) => x.id === sel);
    if (!p) return;
    const ponta = lado === "esquerda" ? pontas[0] : pontas[1];
    if (mesa.length && !encaixa(p, ponta)) {
      setAviso("Essa pedra não encaixa desse lado.");
      return;
    }
    setAviso("");
    colocar(p, lado, 1);
    setSel(null);
    const resto = maoJogador.filter((x) => x.id !== p.id);
    if (!resto.length) return void encerrar("Você bateu! Ganhou a partida.", true);
    setVez(2);
  }

  function comprar() {
    if (!monte.length) {
      setAviso("O monte acabou — passe a vez.");
      return;
    }
    const [p, ...resto] = monte;
    setMonte(resto);
    setMaoJogador((m) => [...m, p!]);
  }

  function passar() {
    if (monte.length) {
      setAviso("Ainda dá para comprar do monte.");
      return;
    }
    setAviso("");
    setVez(2);
  }

  // A vez do computador.
  useEffect(() => {
    if (vez !== 2 || fim || adversario === "colega") return;
    const t = window.setTimeout(() => {
      let mao = [...maoAdv];
      let resto = [...monte];
      // Compra até achar pedra que sirva, como manda a regra.
      while (
        mesa.length &&
        !mao.some((p) => encaixa(p, pontas[0]) || encaixa(p, pontas[1])) &&
        resto.length
      ) {
        mao = [...mao, resto[0]!];
        resto = resto.slice(1);
      }
      setMonte(resto);
      setMaoAdv(mao);

      const jogaveis = mesa.length
        ? mao.filter((p) => encaixa(p, pontas[0]) || encaixa(p, pontas[1]))
        : mao;
      if (!jogaveis.length) {
        if (!podeJogar(maoJogador) && !resto.length) {
          const meus = maoJogador.reduce((s, p) => s + peso(p), 0);
          const dele = mao.reduce((s, p) => s + peso(p), 0);
          return void encerrar(
            meus === dele
              ? "Jogo trancado — empate nos pontos!"
              : meus < dele
                ? `Jogo trancado. Você tinha menos pontos (${meus} a ${dele}) e ganhou!`
                : `Jogo trancado. O computador tinha menos pontos (${dele} a ${meus}).`,
            meus === dele ? null : meus < dele,
          );
        }
        setVez(1);
        return;
      }
      // Solta a mais pesada que encaixa: é o que evita ficar com carroça.
      const escolhida =
        nivel === 1
          ? jogaveis[Math.floor(Math.random() * jogaveis.length)]!
          : jogaveis.reduce((m, p) => (peso(p) > peso(m) ? p : m), jogaveis[0]!);
      const lado: Lado = !mesa.length || encaixa(escolhida, pontas[1]) ? "direita" : "esquerda";
      colocar(escolhida, lado, 2);
      const sobra = mao.filter((x) => x.id !== escolhida.id);
      if (!sobra.length) return void encerrar("O computador bateu. Tente de novo!", false);
      setVez(1);
    }, 800);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vez, fim]);

  const minhaVez = vez === 1 && !fim;

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm font-semibold text-foreground">
        {fim ? fim : minhaVez ? "Sua vez" : "O computador está jogando…"}
      </p>

      {/* Mesa */}
      <div className="flex w-full items-center gap-1.5 overflow-x-auto rounded-xl bg-[#2f6f4e]/20 p-2 [&::-webkit-scrollbar]:h-1.5">
        <button
          type="button"
          onClick={() => jogarNaPonta("esquerda")}
          disabled={!minhaVez || !sel || !mesa.length}
          className={cn(
            "h-9 shrink-0 rounded-lg border-2 border-dashed px-2 text-[11px] font-bold transition-colors",
            minhaVez && sel && mesa.length
              ? "cursor-pointer border-emerald-500 text-emerald-600"
              : "border-border text-muted-foreground opacity-40",
          )}
        >
          ◀ {pontas[0] >= 0 ? pontas[0] : ""}
        </button>
        {mesa.length === 0 ? (
          <span className="px-3 text-xs text-muted-foreground">
            Mesa vazia — escolha uma pedra e toque num lado.
          </span>
        ) : (
          mesa.map((p, i) => <PedraSVG key={`${p.id}-${i}`} p={p} deitada />)
        )}
        <button
          type="button"
          onClick={() => jogarNaPonta("direita")}
          disabled={!minhaVez || !sel}
          className={cn(
            "h-9 shrink-0 rounded-lg border-2 border-dashed px-2 text-[11px] font-bold transition-colors",
            minhaVez && sel
              ? "cursor-pointer border-emerald-500 text-emerald-600"
              : "border-border text-muted-foreground opacity-40",
          )}
        >
          {pontas[1] >= 0 ? pontas[1] : ""} ▶
        </button>
      </div>

      {aviso && <p className="text-[11px] font-medium text-amber-600">{aviso}</p>}

      {/* Mão */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {maoJogador.map((p) => {
          const serve = !mesa.length || encaixa(p, pontas[0]) || encaixa(p, pontas[1]);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSel(sel === p.id ? null : p.id)}
              disabled={!minhaVez}
              className={cn(
                "rounded-lg border-2 transition-all",
                sel === p.id
                  ? "-translate-y-1 border-primary shadow-lg"
                  : serve && minhaVez
                    ? "cursor-pointer border-emerald-500/60 hover:-translate-y-0.5"
                    : "border-transparent opacity-60",
              )}
            >
              <PedraSVG p={p} />
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Monte: {monte.length}</span>
        <span>Computador: {maoAdv.length} pedras</span>
        <button
          type="button"
          onClick={comprar}
          disabled={!minhaVez || !monte.length}
          className="h-9 cursor-pointer rounded-lg border-2 border-border px-3 text-xs font-semibold text-foreground disabled:opacity-40"
        >
          Comprar
        </button>
        <button
          type="button"
          onClick={passar}
          disabled={!minhaVez || !!monte.length}
          className="h-9 cursor-pointer rounded-lg border-2 border-border px-3 text-xs font-semibold text-foreground disabled:opacity-40"
        >
          Passar
        </button>
      </div>

      {estrelas !== null && estrelas > 0 && (
        <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
          {"⭐".repeat(estrelas)} +{estrelas} {estrelas === 1 ? "estrela" : "estrelas"}
        </p>
      )}

      {fim && (
        <button
          type="button"
          onClick={distribuir}
          className="h-11 cursor-pointer rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground"
        >
          Jogar de novo
        </button>
      )}
    </div>
  );
}
