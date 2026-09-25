import { Brain, Volume2, VolumeX } from "lucide-react";
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
type TemaDomino = "madeira" | "oceano" | "galaxia" | "frutas";
type EstiloPedra = "marfim" | "colorido" | "madeira" | "numeros";

const TEMAS_DOMINO: Record<TemaDomino, { nome: string; mesa: string; destaque: string }> = {
  madeira: { nome: "Ateliê brasileiro", mesa: "#8b5e3c", destaque: "#f59e0b" },
  oceano: { nome: "Fundo do mar", mesa: "#075985", destaque: "#67e8f9" },
  galaxia: { nome: "Laboratório orbital", mesa: "#312e81", destaque: "#a78bfa" },
  frutas: { nome: "Feira de cores", mesa: "#166534", destaque: "#fb7185" },
};

let audioDomino: AudioContext | null = null;
function tocarDomino(tipo: "pedra" | "compra" | "erro" | "vitoria") {
  try {
    audioDomino ??= new AudioContext();
    const ctx = audioDomino;
    if (ctx.state === "suspended") void ctx.resume();
    const freq = tipo === "pedra" ? 260 : tipo === "compra" ? 420 : tipo === "erro" ? 130 : 660;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = tipo === "erro" ? "square" : "triangle";
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    if (tipo === "vitoria") o.frequency.exponentialRampToValueAtTime(990, ctx.currentTime + 0.3);
    g.gain.setValueAtTime(0.1, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.3);
  } catch {
    // O jogo segue sem som quando o navegador não oferece áudio.
  }
}

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

function Face({ n, y, cor, numeros }: { n: number; y: number; cor: string; numeros?: boolean }) {
  return (
    <g transform={`translate(0 ${y})`}>
      {numeros ? (
        <text x="50" y="35" textAnchor="middle" fontSize="34" fontWeight="900" fill={cor}>
          {n}
        </text>
      ) : (
        (PONTOS[n] ?? []).map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy * 0.5} r={7} fill={cor} />
        ))
      )}
    </g>
  );
}

/** A pedra em pé (mão) ou deitada (mesa). */
function PedraSVG({
  p,
  estilo,
  deitada = false,
}: {
  p: Pedra;
  estilo: EstiloPedra;
  deitada?: boolean;
}) {
  const fundo = estilo === "madeira" ? "#b7793e" : estilo === "colorido" ? "#fff7ed" : "#fffdf4";
  const borda = estilo === "madeira" ? "#5b341d" : estilo === "colorido" ? "#fb7185" : "#a8a29e";
  const corA =
    estilo === "colorido"
      ? ["#0ea5e9", "#f43f5e", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#14b8a6"][p.a]!
      : estilo === "madeira"
        ? "#fff7d6"
        : "#1c1917";
  const corB =
    estilo === "colorido"
      ? ["#0ea5e9", "#f43f5e", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#14b8a6"][p.b]!
      : estilo === "madeira"
        ? "#fff7d6"
        : "#1c1917";
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
          fill={fundo}
          stroke={borda}
          strokeWidth={3}
        />
        <line x1={10} y1={50} x2={90} y2={50} stroke={borda} strokeWidth={3} />
        <Face n={p.a} y={0} cor={corA} numeros={estilo === "numeros"} />
        <Face n={p.b} y={50} cor={corB} numeros={estilo === "numeros"} />
      </g>
    </svg>
  );
  return corpo;
}

export function Domino({ adversario, nivel }: { adversario: Adversario; nivel: number }) {
  const [tema, setTema] = useState<TemaDomino>("madeira");
  const [estiloPedra, setEstiloPedra] = useState<EstiloPedra>("marfim");
  const [cenario, setCenario] = useState<"atelie" | "orbita">("atelie");
  const [som, setSom] = useState(true);
  const [modoEducativo, setModoEducativo] = useState(true);
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
  const arraste = useRef<{ id: string; x: number; y: number; moveu: boolean } | null>(null);
  const ignorarClique = useRef(false);
  const [puxando, setPuxando] = useState<{ id: string; dx: number; dy: number } | null>(null);
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
    if (som) tocarDomino("pedra");
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

  function jogarNaPonta(lado: Lado, idPedra?: string) {
    const escolhida = idPedra ?? sel;
    if (fim || vez !== 1 || !escolhida) return;
    const p = maoJogador.find((x) => x.id === escolhida);
    if (!p) return;
    const ponta = lado === "esquerda" ? pontas[0] : pontas[1];
    if (mesa.length && !encaixa(p, ponta)) {
      if (som) tocarDomino("erro");
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
    if (som) tocarDomino("compra");
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
    <div
      className="flex min-h-[40rem] flex-col items-center gap-3 overflow-hidden rounded-3xl border border-white/20 p-4 text-white shadow-2xl"
      style={{
        backgroundImage: `linear-gradient(180deg,rgba(15,23,42,.18),rgba(15,23,42,.9)),url(/images/jogos/personalizacao/domino-${cenario}.webp)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-4xl rounded-2xl border border-white/20 bg-slate-950/75 p-3 backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-orange-300">
              Laboratório de combinações
            </p>
            <h3 className="text-xl font-black">Dominó profissional</h3>
          </div>
          <button
            type="button"
            onClick={() => setSom((v) => !v)}
            aria-label={som ? "Desligar sons" : "Ligar sons"}
            className="flex size-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20"
          >
            {som ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="text-[11px] font-bold text-slate-300">
            Cenário
            <select
              value={cenario}
              onChange={(e) => setCenario(e.target.value as typeof cenario)}
              className="mt-1 h-10 w-full rounded-xl border border-white/15 bg-slate-900 px-2 text-sm"
            >
              <option value="atelie">Ateliê brasileiro</option>
              <option value="orbita">Estação orbital</option>
            </select>
          </label>
          <label className="text-[11px] font-bold text-slate-300">
            Mesa
            <select
              value={tema}
              onChange={(e) => setTema(e.target.value as TemaDomino)}
              className="mt-1 h-10 w-full rounded-xl border border-white/15 bg-slate-900 px-2 text-sm"
            >
              {Object.entries(TEMAS_DOMINO).map(([id, t]) => (
                <option key={id} value={id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-bold text-slate-300">
            Pedras
            <select
              value={estiloPedra}
              onChange={(e) => setEstiloPedra(e.target.value as EstiloPedra)}
              className="mt-1 h-10 w-full rounded-xl border border-white/15 bg-slate-900 px-2 text-sm"
            >
              <option value="marfim">Marfim clássico</option>
              <option value="colorido">Pontos coloridos</option>
              <option value="madeira">Madeira</option>
              <option value="numeros">Números grandes</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={() => setModoEducativo((v) => !v)}
          className={cn(
            "mt-2 flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-bold",
            modoEducativo ? "bg-emerald-400 text-emerald-950" : "bg-white/10 text-white",
          )}
        >
          <Brain className="size-4" /> Modo educativo {modoEducativo ? "ligado" : "desligado"}
        </button>
      </div>
      <p className="text-sm font-semibold text-foreground">
        {fim ? fim : minhaVez ? "Sua vez" : "O computador está jogando…"}
      </p>

      {/* Mesa */}
      <div
        data-mesa
        className="flex min-h-32 w-full max-w-4xl items-center gap-1.5 overflow-x-auto rounded-2xl border-4 p-3 shadow-2xl transition-colors [&::-webkit-scrollbar]:h-1.5"
        style={{
          backgroundColor: `${TEMAS_DOMINO[tema].mesa}e6`,
          borderColor: TEMAS_DOMINO[tema].destaque,
        }}
      >
        <button
          type="button"
          data-ponta="esquerda"
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
            Mesa vazia — arraste uma pedra até aqui (ou toque nela e num lado).
          </span>
        ) : (
          mesa.map((p, i) => <PedraSVG key={`${p.id}-${i}`} p={p} estilo={estiloPedra} deitada />)
        )}
        <button
          type="button"
          data-ponta="direita"
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
              onClick={() => {
                if (ignorarClique.current) {
                  ignorarClique.current = false;
                  return;
                }
                setSel(sel === p.id ? null : p.id);
              }}
              onPointerDown={(e) => {
                if (!minhaVez) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                arraste.current = { id: p.id, x: e.clientX, y: e.clientY, moveu: false };
              }}
              onPointerMove={(e) => {
                const a = arraste.current;
                if (!a || a.id !== p.id) return;
                const dx = e.clientX - a.x;
                const dy = e.clientY - a.y;
                if (!a.moveu && Math.hypot(dx, dy) > 6) {
                  a.moveu = true;
                  setSel(p.id);
                }
                if (a.moveu) setPuxando({ id: p.id, dx, dy });
              }}
              onPointerUp={(e) => {
                const a = arraste.current;
                arraste.current = null;
                setPuxando(null);
                if (!a || !(a.moveu || Math.hypot(e.clientX - a.x, e.clientY - a.y) > 6)) return;
                ignorarClique.current = true;
                // Soltar sobre uma ponta (ou sobre a mesa vazia) joga a pedra ali.
                const alvo = document
                  .elementFromPoint(e.clientX, e.clientY)
                  ?.closest("[data-ponta]");
                const lado = alvo?.getAttribute("data-ponta");
                if (lado === "esquerda" || lado === "direita") jogarNaPonta(lado, a.id);
                else if (
                  !mesa.length &&
                  document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-mesa]")
                )
                  jogarNaPonta("direita", a.id);
              }}
              onPointerCancel={() => {
                arraste.current = null;
                setPuxando(null);
              }}
              style={
                puxando?.id === p.id
                  ? {
                      transform: `translate(${puxando.dx}px, ${puxando.dy}px) scale(1.1)`,
                      zIndex: 30,
                      pointerEvents: "none",
                      position: "relative",
                    }
                  : undefined
              }
              disabled={!minhaVez}
              className={cn(
                "touch-none rounded-lg border-2",
                puxando?.id !== p.id && "transition-all",
                sel === p.id
                  ? "-translate-y-1 border-primary shadow-lg"
                  : serve && minhaVez
                    ? "cursor-pointer border-emerald-500/60 hover:-translate-y-0.5"
                    : "border-transparent opacity-60",
              )}
            >
              <PedraSVG p={p} estilo={estiloPedra} />
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
      {modoEducativo && (
        <div className="flex max-w-2xl items-start gap-2 rounded-xl border border-emerald-300/30 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 backdrop-blur">
          <Brain className="mt-0.5 size-4 shrink-0 text-emerald-300" />
          <span>
            <b>Desafio matemático:</b> você tem {maoJogador.reduce((s, p) => s + peso(p), 0)} pontos
            na mão. Procure uma pedra com{" "}
            {pontas[0] >= 0 ? `${pontas[0]} ou ${pontas[1]}` : "a maior carroça"} e tente reduzir
            sua soma.
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
          onClick={distribuir}
          className="h-11 cursor-pointer rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground"
        >
          Jogar de novo
        </button>
      )}
    </div>
  );
}
