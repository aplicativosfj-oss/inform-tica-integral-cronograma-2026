import { useEffect, useRef, useState } from "react";

import { PALAVRAS } from "@/components/school/ferramentas/alfabeto-dados";
import { Figura } from "@/components/school/ferramentas/figuras-alfabeto";
import { registrarPartida, type Adversario } from "@/lib/estrelas";
import { falar } from "@/lib/voz";
import { cn } from "@/lib/utils";

/**
 * Jogo da memória com as figuras do Parque das Letras — as mesmas 69 que a
 * criança já viu na alfabetização.
 *
 * Isso é de propósito: cada par virado é uma palavra lida em voz alta. O jogo
 * treina memória e, de graça, reforça o vocabulário. Entre colegas, cada um
 * joga na sua vez e continua jogando enquanto acerta, como manda a regra de
 * mesa.
 */

interface Carta {
  id: number;
  figura: string;
  texto: string;
  virada: boolean;
  achada: boolean;
}

const TAMANHOS = [
  { pares: 6, nome: "6 pares", colunas: 4 },
  { pares: 8, nome: "8 pares", colunas: 4 },
  { pares: 10, nome: "10 pares", colunas: 5 },
];

function embaralhar<T>(l: T[]): T[] {
  const c = [...l];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j]!, c[i]!];
  }
  return c;
}

function montar(pares: number): Carta[] {
  const escolhidas = embaralhar(PALAVRAS).slice(0, pares);
  const cartas = escolhidas.flatMap((p, i) => [
    { id: i * 2, figura: p.figura, texto: p.texto, virada: false, achada: false },
    { id: i * 2 + 1, figura: p.figura, texto: p.texto, virada: false, achada: false },
  ]);
  return embaralhar(cartas);
}

/** O verso da carta: desenho igual em todas, para não dar pista nenhuma. */
function Verso() {
  return (
    <svg viewBox="0 0 100 100" className="size-full" aria-hidden>
      <rect x={2} y={2} width={96} height={96} rx={10} fill="#1e3a8a" />
      <rect
        x={10}
        y={10}
        width={80}
        height={80}
        rx={6}
        fill="none"
        stroke="#60a5fa"
        strokeWidth={3}
      />
      {[26, 50, 74].map((y) =>
        [26, 50, 74].map((x) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={6} fill="#60a5fa" opacity={0.55} />
        )),
      )}
    </svg>
  );
}

export function Memoria({ adversario, nivel }: { adversario: Adversario; nivel: number }) {
  const config = TAMANHOS[Math.min(nivel, TAMANHOS.length) - 1] ?? TAMANHOS[1]!;
  const [cartas, setCartas] = useState<Carta[]>(() => montar(config.pares));
  const [abertas, setAbertas] = useState<number[]>([]);
  const [jogadas, setJogadas] = useState(0);
  const [jogador, setJogador] = useState<1 | 2>(1);
  const [pontos, setPontos] = useState({ 1: 0, 2: 0 });
  const [estrelas, setEstrelas] = useState<number | null>(null);
  const inicio = useRef(Date.now());
  const fim = cartas.every((c) => c.achada);

  function virar(id: number) {
    if (abertas.length === 2) return;
    const carta = cartas.find((c) => c.id === id);
    if (!carta || carta.virada || carta.achada) return;
    falar(carta.texto);
    setCartas((cs) => cs.map((c) => (c.id === id ? { ...c, virada: true } : c)));
    setAbertas((a) => [...a, id]);
  }

  // Confere o par depois de um tempinho, para dar chance de memorizar.
  useEffect(() => {
    if (abertas.length !== 2) return;
    const [a, b] = abertas as [number, number];
    const ca = cartas.find((c) => c.id === a)!;
    const cb = cartas.find((c) => c.id === b)!;
    const igual = ca.figura === cb.figura;
    const t = window.setTimeout(
      () => {
        setCartas((cs) =>
          cs.map((c) =>
            c.id === a || c.id === b
              ? igual
                ? { ...c, achada: true, virada: true }
                : { ...c, virada: false }
              : c,
          ),
        );
        setAbertas([]);
        setJogadas((j) => j + 1);
        if (igual) {
          setPontos((p) => ({ ...p, [jogador]: p[jogador] + 1 }));
          // Quem acerta continua jogando: é a regra de mesa e premia atenção.
        } else if (adversario === "colega") {
          setJogador((j) => (j === 1 ? 2 : 1));
        }
      },
      igual ? 500 : 900,
    );
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abertas]);

  useEffect(() => {
    if (!fim || estrelas !== null) return;
    const segundos = Math.round((Date.now() - inicio.current) / 1000);
    const resultado =
      adversario === "colega"
        ? pontos[1] === pontos[2]
          ? "empate"
          : "vitoria"
        : // Sozinho, o adversário é a própria memória: fechar o tabuleiro em
          // poucas jogadas conta como vitória.
          jogadas <= config.pares * 2.2
          ? "vitoria"
          : "empate";
    void registrarPartida({
      jogo: "memoria",
      titulo: "Jogo da memória",
      resultado,
      adversario,
      nivel,
      segundos,
    }).then(setEstrelas);
  }, [fim, estrelas, adversario, jogadas, config.pares, nivel, pontos]);

  function novaPartida() {
    setCartas(montar(config.pares));
    setAbertas([]);
    setJogadas(0);
    setJogador(1);
    setPontos({ 1: 0, 2: 0 });
    setEstrelas(null);
    inicio.current = Date.now();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-semibold text-foreground">
        {fim
          ? adversario === "colega"
            ? pontos[1] === pontos[2]
              ? `Empate! ${pontos[1]} pares para cada um.`
              : `Ganhou o jogador ${pontos[1] > pontos[2] ? 1 : 2}!`
            : `Você achou tudo em ${jogadas} jogadas!`
          : adversario === "colega"
            ? `Vez do jogador ${jogador}`
            : `Jogadas: ${jogadas}`}
      </p>

      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${config.colunas}, minmax(0, 1fr))` }}
      >
        {cartas.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => virar(c.id)}
            disabled={c.achada || c.virada || abertas.length === 2}
            aria-label={c.virada || c.achada ? c.texto : "Carta virada para baixo"}
            className={cn(
              "flex size-[62px] items-center justify-center rounded-xl border-2 p-0.5 transition-all",
              c.achada
                ? "border-emerald-500 bg-emerald-500/10"
                : c.virada
                  ? "border-primary bg-card"
                  : "cursor-pointer border-border bg-card hover:border-primary/60",
            )}
          >
            {c.virada || c.achada ? (
              <Figura nome={c.figura} tamanho={50} titulo={c.texto} />
            ) : (
              <Verso />
            )}
          </button>
        ))}
      </div>

      {adversario === "colega" && (
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className={cn(jogador === 1 && !fim && "font-bold text-primary")}>
            Jogador 1: {pontos[1]}
          </span>
          <span className={cn(jogador === 2 && !fim && "font-bold text-primary")}>
            Jogador 2: {pontos[2]}
          </span>
        </div>
      )}

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
