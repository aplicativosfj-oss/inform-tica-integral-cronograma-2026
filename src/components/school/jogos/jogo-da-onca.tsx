import { BookOpen, Lightbulb, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ALTURA,
  CaoMini,
  FaixaPenas,
  LARGURA,
  Madeira,
  OncaMini,
  PecaCao,
  PecaOnca,
  px,
  py,
} from "@/components/school/jogos/onca-arte";
import {
  aplicar,
  CAPTURAS_PARA_VENCER,
  CAES_TOTAL,
  estadoInicial,
  melhorLance,
  mobilidadeOnca,
  PONTOS,
  pulosDe,
  resultado,
  tabuleiro,
  VIZINHOS,
  type Estado,
  type Lance,
  type Vez,
} from "@/components/school/jogos/onca-motor";
import { registrarPartida, type Adversario } from "@/lib/estrelas";
import { cn } from "@/lib/utils";

/**
 * Jogo da Onça (Adugo): jogo de tabuleiro tradicional dos povos indígenas do
 * Brasil. Uma onça enfrenta 14 cachorros. A onça vence ao capturar 5; os
 * cachorros vencem cercando a onça, de preferência empurrando-a para o
 * triângulo. O computador joga dos dois lados, em três níveis.
 */

// -------------------------------------------------------------------- sons

let audio: AudioContext | null = null;

function tom(
  freq: number,
  dur: number,
  tipo: OscillatorType = "sine",
  vol = 0.14,
  ate?: number,
  atraso = 0,
) {
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") void audio.resume();
    const t0 = audio.currentTime + atraso;
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(freq, t0);
    if (ate) o.frequency.exponentialRampToValueAtTime(ate, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(audio.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  } catch {
    // sem áudio: o jogo segue mudo
  }
}

const SONS = {
  pegar: () => tom(520, 0.07, "triangle", 0.1, 700),
  passo: () => {
    tom(240, 0.09, "triangle", 0.14, 170);
    tom(120, 0.06, "sine", 0.1, 90, 0.02);
  },
  pulo: () => tom(200, 0.28, "sawtooth", 0.12, 620),
  captura: () => {
    tom(150, 0.32, "square", 0.13, 60);
    tom(90, 0.4, "sawtooth", 0.1, 40, 0.04);
  },
  erro: () => tom(120, 0.16, "square", 0.07),
  vitoria: () =>
    [523, 659, 784, 1046].forEach((f, i) => tom(f, 0.24, "triangle", 0.13, undefined, i * 0.13)),
  derrota: () =>
    [392, 330, 262].forEach((f, i) => tom(f, 0.3, "triangle", 0.12, undefined, i * 0.18)),
};

// ------------------------------------------------------------------- tipos

type Lado = "onca" | "caes";
type Fim = { vencedor: "onca" | "caes" | "empate" };

const NOMES: Record<Vez, string> = { onca: "a Onça", caes: "os Cachorros" };

interface Selecao {
  /** "onca" ou o id do cachorro. */
  peca: "onca" | number;
}

function atrasar(ms: number) {
  return new Promise<void>((r) => window.setTimeout(r, ms));
}

// ------------------------------------------------------------------ componente

export function JogoDaOnca({ adversario, nivel }: { adversario: Adversario; nivel: number }) {
  const contraPc = adversario === "computador";
  const [fase, setFase] = useState<"inicio" | "jogando">("inicio");
  const [lado, setLado] = useState<Lado>("onca");
  const [estado, setEstado] = useState<Estado>(() => estadoInicial());
  const [sel, setSel] = useState<Selecao | null>(null);
  /** A onça está no meio de uma sequência de pulos e pode continuar ou parar. */
  const [sequencia, setSequencia] = useState(false);
  const [mortos, setMortos] = useState<{ id: number; pos: number }[]>([]);
  const [ultimo, setUltimo] = useState<{ de: number; para: number } | null>(null);
  const [dica, setDica] = useState<{ a: number; b: number; peca: "onca" | number } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [fim, setFim] = useState<Fim | null>(null);
  const [estrelas, setEstrelas] = useState<number | null>(null);
  const [placar, setPlacar] = useState({ onca: 0, caes: 0, empates: 0 });
  const [som, setSom] = useState(true);
  const [ajuda, setAjuda] = useState(false);
  const [pensando, setPensando] = useState(false);
  const inicio = useRef(Date.now());
  const ocupado = useRef(false);
  const estadoRef = useRef(estado);
  estadoRef.current = estado;

  const tocar = useCallback(
    (nome: keyof typeof SONS) => {
      if (som) SONS[nome]();
    },
    [som],
  );

  const vezDoJogador = contraPc ? estado.vez === lado : true;
  const humanoNaVez = fase === "jogando" && !fim && vezDoJogador && !pensando;

  /** O cachorro capturado fica um instante na tela, encolhendo, e some. */
  const registrarMorte = useCallback((id: number, pos: number) => {
    setMortos((m) => [...m, { id, pos }]);
    window.setTimeout(() => setMortos((m) => m.filter((x) => x.id !== id)), 900);
  }, []);

  const mostrar = useCallback((t: string, ms = 2200) => {
    setAviso(t);
    window.setTimeout(() => setAviso((a) => (a === t ? null : a)), ms);
  }, []);

  // ---- fim de partida
  const terminar = useCallback(
    async (e: Estado) => {
      const r = resultado(e);
      if (!r) return false;
      setFim({ vencedor: r });
      setSel(null);
      setSequencia(false);
      setDica(null);
      setPlacar((p) => ({
        onca: p.onca + (r === "onca" ? 1 : 0),
        caes: p.caes + (r === "caes" ? 1 : 0),
        empates: p.empates + (r === "empate" ? 1 : 0),
      }));
      const ganhouHumano = contraPc ? r === lado : true;
      if (r === "empate") tocar("erro");
      else if (ganhouHumano) tocar("vitoria");
      else tocar("derrota");
      const n = await registrarPartida({
        jogo: "onca",
        titulo: "Jogo da Onça",
        resultado: r === "empate" ? "empate" : ganhouHumano ? "vitoria" : "derrota",
        adversario,
        nivel,
        segundos: Math.round((Date.now() - inicio.current) / 1000),
      });
      setEstrelas(n);
      return true;
    },
    [adversario, contraPc, lado, nivel, tocar],
  );

  // ---- aplica um lance inteiro com animação (usado pelo computador e pela dica)
  const executar = useCallback(
    async (l: Lance) => {
      ocupado.current = true;
      let e = estadoRef.current;
      if (l.tipo === "cao") {
        const de = e.caes[l.id]!;
        tocar("passo");
        setUltimo({ de, para: l.para });
        e = aplicar(e, l);
        setEstado(e);
        await atrasar(420);
      } else {
        let de = e.onca;
        const comidos = [...l.comidos];
        for (let i = 0; i < l.caminho.length; i++) {
          const para = l.caminho[i]!;
          const id = comidos[i];
          const caes = [...e.caes];
          if (id !== undefined) caes[id] = -1;
          e = {
            ...e,
            caes,
            onca: para,
            capturados: e.capturados + (id !== undefined ? 1 : 0),
          };
          setUltimo({ de, para });
          if (id !== undefined) {
            tocar("pulo");
            registrarMorte(
              id,
              e.caes[id] === -1 ? (estadoRef.current.caes[id] ?? -1) : e.caes[id]!,
            );
            window.setTimeout(() => tocar("captura"), 260);
          } else tocar("passo");
          setEstado(e);
          de = para;
          await atrasar(id !== undefined ? 560 : 420);
        }
        e = { ...e, vez: "caes", jogadas: e.jogadas + 1 };
        setEstado(e);
      }
      ocupado.current = false;
      await terminar(e);
    },
    [terminar, tocar, registrarMorte],
  );

  // ---- vez do computador
  useEffect(() => {
    if (fase !== "jogando" || fim || !contraPc || estado.vez === lado || ocupado.current) return;
    setPensando(true);
    const t = window.setTimeout(() => {
      const a = melhorLance(estadoRef.current, nivel);
      if (!a) {
        setPensando(false);
        void terminar({ ...estadoRef.current });
        return;
      }
      setPensando(false);
      void executar(a.lance);
    }, 650);
    return () => window.clearTimeout(t);
  }, [estado, fase, fim, contraPc, lado, nivel, executar, terminar]);

  // ---- possíveis destinos da peça escolhida
  const alvos = useMemo(() => {
    const m = new Map<number, { captura: number | null }>();
    if (!sel || !humanoNaVez) return m;
    const t = tabuleiro(estado);
    if (sel.peca === "onca") {
      if (estado.vez !== "onca") return m;
      if (!sequencia)
        for (const v of VIZINHOS[estado.onca]!) if (t[v] === -1) m.set(v, { captura: null });
      for (const p of pulosDe(estado, estado.onca, [])) m.set(p.para, { captura: p.id });
    } else if (estado.vez === "caes") {
      const de = estado.caes[sel.peca]!;
      if (de >= 0) for (const v of VIZINHOS[de]!) if (t[v] === -1) m.set(v, { captura: null });
    }
    return m;
  }, [sel, estado, sequencia, humanoNaVez]);

  const acabarSequencia = useCallback(() => {
    const e = { ...estadoRef.current, vez: "caes" as Vez, jogadas: estadoRef.current.jogadas + 1 };
    setEstado(e);
    setSequencia(false);
    setSel(null);
    void terminar(e);
  }, [terminar]);

  const clicarPeca = (peca: "onca" | number) => {
    if (!humanoNaVez) return;
    const meu = peca === "onca" ? estado.vez === "onca" : estado.vez === "caes";
    if (!meu) return;
    if (sequencia && peca !== "onca") return;
    // se o cachorro não tem para onde ir, avisa
    if (peca !== "onca") {
      const t = tabuleiro(estado);
      const de = estado.caes[peca]!;
      if (!VIZINHOS[de]!.some((v) => t[v] === -1)) {
        tocar("erro");
        mostrar("Esse cachorro está sem saída.");
        return;
      }
    }
    tocar("pegar");
    setDica(null);
    setSel({ peca });
  };

  const clicarPonto = (p: number) => {
    if (!humanoNaVez || !sel) return;
    const alvo = alvos.get(p);
    if (!alvo) {
      if (sel) {
        // clicar num ponto qualquer tira a seleção
        if (!sequencia) setSel(null);
      }
      return;
    }
    setDica(null);
    if (sel.peca === "onca") {
      const de = estado.onca;
      const caes = [...estado.caes];
      let e: Estado;
      if (alvo.captura !== null) {
        caes[alvo.captura] = -1;
        e = { ...estado, caes, onca: p, capturados: estado.capturados + 1 };
        registrarMorte(alvo.captura, estado.caes[alvo.captura] ?? -1);
        tocar("pulo");
        window.setTimeout(() => tocar("captura"), 260);
        setUltimo({ de, para: p });
        // ainda há pulo depois deste? a onça pode continuar ou parar
        if (e.capturados >= CAPTURAS_PARA_VENCER) {
          e = { ...e, vez: "caes", jogadas: e.jogadas + 1 };
          setEstado(e);
          setSequencia(false);
          void terminar(e);
          return;
        }
        if (pulosDe(e, p, []).length) {
          setEstado(e);
          setSequencia(true);
          setSel({ peca: "onca" });
          mostrar("Pule de novo ou toque em “Parar aqui”.", 2600);
          return;
        }
      } else {
        e = { ...estado, onca: p };
        tocar("passo");
        setUltimo({ de, para: p });
      }
      e = { ...e, vez: "caes", jogadas: e.jogadas + 1 };
      setEstado(e);
      setSequencia(false);
      setSel(null);
      void terminar(e);
      return;
    }
    // cachorro
    const l: Lance = { tipo: "cao", id: sel.peca, para: p };
    const de = estado.caes[sel.peca]!;
    tocar("passo");
    setUltimo({ de, para: p });
    const e = aplicar(estado, l);
    setEstado(e);
    setSel(null);
    void terminar(e);
  };

  // ---- dica
  function pedirDica() {
    if (!humanoNaVez) return;
    const a = melhorLance(estado, 3);
    if (!a) return;
    if (a.lance.tipo === "cao") {
      setDica({ a: estado.caes[a.lance.id]!, b: a.lance.para, peca: a.lance.id });
      setSel({ peca: a.lance.id });
    } else {
      setDica({ a: estado.onca, b: a.lance.caminho[0]!, peca: "onca" });
      setSel({ peca: "onca" });
    }
    mostrar("A linha verde mostra uma boa jogada.", 2600);
  }

  // ---- nova partida
  function comecar(escolhido?: Lado) {
    const novoLado = escolhido ?? lado;
    setLado(novoLado);
    setEstado(estadoInicial());
    estadoRef.current = estadoInicial();
    setSel(null);
    setSequencia(false);
    setMortos([]);
    setUltimo(null);
    setDica(null);
    setFim(null);
    setEstrelas(null);
    setPensando(false);
    ocupado.current = false;
    inicio.current = Date.now();
    setFase("jogando");
    if (som) tom(440, 0.1, "triangle", 0.1, 660);
  }

  // ---- mensagens de estado
  const mob = useMemo(() => mobilidadeOnca({ ...estado, vez: "onca" }), [estado]);
  const status = (() => {
    if (fim) {
      if (fim.vencedor === "empate") return "Empate! A partida ficou longa demais.";
      if (!contraPc)
        return fim.vencedor === "onca"
          ? "A Onça venceu: capturou 5 cachorros!"
          : "Os Cachorros venceram: cercaram a Onça!";
      return fim.vencedor === lado ? "Você venceu! 🎉" : "O computador venceu desta vez.";
    }
    if (pensando || (contraPc && estado.vez !== lado)) return "O computador está pensando…";
    if (sequencia) return "Continue pulando ou pare aqui.";
    if (contraPc)
      return estado.vez === "onca" ? "Sua vez: mova a Onça" : "Sua vez: mova um Cachorro";
    return `Vez d${estado.vez === "onca" ? "a Onça" : "os Cachorros"}`;
  })();

  const capturados = estado.capturados;
  const aperto = estado.vez === "caes" && mob.passos + mob.pulos <= 1 && !fim;

  // ---------------------------------------------------------------- render

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col gap-2.5">
      {/* cabeçalho */}
      <div className="overflow-hidden rounded-2xl border border-[#d9b58f] bg-[#fbf3e4] shadow-sm dark:border-[#5a3a2a] dark:bg-[#2a1d18]">
        <FaixaPenas className="block h-[26px] w-full" />
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <div>
            <h3 className="font-serif text-xl font-black italic leading-tight text-[#3b2417] dark:text-[#f6e2c4]">
              Jogo da Onça
            </h3>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a5482f]">
              Adugo · jogo tradicional indígena
            </p>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setAjuda(true)}
              aria-label="Como jogar"
              className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-[#d9b58f] bg-white/70 text-[#7a3a24] hover:bg-white dark:bg-black/20 dark:text-[#f6e2c4]"
            >
              <BookOpen className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setSom((s) => !s)}
              aria-label={som ? "Desligar o som" : "Ligar o som"}
              className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-[#d9b58f] bg-white/70 text-[#7a3a24] hover:bg-white dark:bg-black/20 dark:text-[#f6e2c4]"
            >
              {som ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      {fase === "inicio" ? (
        <TelaInicial
          contraPc={contraPc}
          aoEscolher={(l) => comecar(l)}
          aoAjuda={() => setAjuda(true)}
        />
      ) : (
        <>
          {/* placar de capturas */}
          <div className="flex items-center justify-between gap-2 rounded-xl border border-[#d9b58f] bg-[#fbf3e4] px-3 py-2 dark:border-[#5a3a2a] dark:bg-[#2a1d18]">
            <div className="flex items-center gap-1.5">
              <OncaMini />
              <div
                className="flex gap-1"
                aria-label={`${capturados} de ${CAPTURAS_PARA_VENCER} capturas`}
              >
                {Array.from({ length: CAPTURAS_PARA_VENCER }, (_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full border-2 transition-all",
                      i < capturados
                        ? "scale-100 border-[#c81f2c] bg-[#ffe1de]"
                        : "border-dashed border-[#c9a983] opacity-60",
                    )}
                  >
                    {i < capturados && <CaoMini tam={18} />}
                  </span>
                ))}
              </div>
            </div>
            <span className="text-[11px] font-semibold text-[#7a5a44] dark:text-[#d9b58f]">
              <b className="text-[#c81f2c]">{CAES_TOTAL - capturados}</b> cães na roda
            </span>
          </div>

          {/* tabuleiro */}
          <div className="relative overflow-hidden rounded-2xl bg-[#c94a56] p-2 shadow-md ring-1 ring-[#8f2a35]/40">
            <svg
              viewBox={`0 0 ${LARGURA} ${ALTURA}`}
              className="mx-auto block w-full max-w-[420px] select-none touch-manipulation"
              role="group"
              aria-label="Tabuleiro do Jogo da Onça"
            >
              <Madeira dica={dica} />

              {/* rastro da última jogada */}
              {ultimo && (
                <g opacity={0.55}>
                  <circle
                    cx={px(PONTOS[ultimo.de]!.x)}
                    cy={py(PONTOS[ultimo.de]!.y)}
                    r={17}
                    fill="none"
                    stroke="#7a3a24"
                    strokeWidth={2.4}
                    strokeDasharray="4 5"
                  />
                </g>
              )}

              {/* pontos clicáveis / destinos */}
              {PONTOS.map((p, i) => {
                const alvo = alvos.get(i);
                return (
                  <g
                    key={i}
                    onClick={() => clicarPonto(i)}
                    className={alvo ? "cursor-pointer" : ""}
                  >
                    <circle cx={px(p.x)} cy={py(p.y)} r={26} fill="transparent" />
                    {alvo && (
                      <>
                        <circle
                          cx={px(p.x)}
                          cy={py(p.y)}
                          r={alvo.captura !== null ? 19 : 15}
                          fill={
                            alvo.captura !== null ? "rgba(220,38,38,0.28)" : "rgba(34,197,94,0.3)"
                          }
                          stroke={alvo.captura !== null ? "#dc2626" : "#16a34a"}
                          strokeWidth={2.4}
                        >
                          <animate
                            attributeName="r"
                            values={alvo.captura !== null ? "17;21;17" : "13;17;13"}
                            dur="1.1s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      </>
                    )}
                  </g>
                );
              })}

              {/* cachorros capturados (saem de cena) */}
              {mortos.map(({ id, pos }) =>
                pos >= 0 ? (
                  <g
                    key={`m-${id}`}
                    transform={`translate(${px(PONTOS[pos]!.x)} ${py(PONTOS[pos]!.y)})`}
                  >
                    <g>
                      <animateTransform
                        attributeName="transform"
                        type="scale"
                        values="1;1.25;0.2"
                        dur="0.7s"
                        fill="freeze"
                      />
                      <animate attributeName="opacity" values="1;1;0" dur="0.7s" fill="freeze" />
                      <PecaCao id={id} />
                    </g>
                  </g>
                ) : null,
              )}

              {/* cachorros */}
              {estado.caes.map((pos, id) => {
                if (pos < 0) return null;
                const p = PONTOS[pos]!;
                const selecionado = sel?.peca === id;
                const podeMover = humanoNaVez && estado.vez === "caes" && !sequencia;
                return (
                  <g
                    key={id}
                    style={{
                      transform: `translate(${px(p.x)}px, ${py(p.y)}px)`,
                      transition: "transform 380ms cubic-bezier(.3,.8,.3,1)",
                    }}
                    onClick={() => clicarPeca(id)}
                    className={podeMover ? "cursor-pointer" : ""}
                  >
                    <g
                      style={{
                        transform: selecionado ? "translateY(-5px) scale(1.12)" : "none",
                        transition: "transform 160ms",
                      }}
                    >
                      <PecaCao id={id} brilho={selecionado} />
                    </g>
                  </g>
                );
              })}

              {/* onça */}
              <g
                style={{
                  transform: `translate(${px(PONTOS[estado.onca]!.x)}px, ${py(PONTOS[estado.onca]!.y)}px)`,
                  transition: "transform 380ms cubic-bezier(.3,.8,.3,1)",
                }}
                onClick={() => clicarPeca("onca")}
                className={humanoNaVez && estado.vez === "onca" ? "cursor-pointer" : ""}
              >
                <g
                  style={{
                    transform: sel?.peca === "onca" ? "translateY(-5px) scale(1.1)" : "none",
                    transition: "transform 160ms",
                  }}
                >
                  <PecaOnca brilho={sel?.peca === "onca"} />
                </g>
              </g>
            </svg>

            {aviso && (
              <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center px-3">
                <span className="rounded-full bg-[#3b2417]/95 px-4 py-1.5 text-center text-xs font-bold text-[#fde68a] shadow-lg">
                  {aviso}
                </span>
              </div>
            )}

            {fim && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
                <div className="w-full max-w-[300px] rounded-2xl border-2 border-[#e6c294] bg-[#fbf3e4] p-4 text-center shadow-2xl dark:bg-[#2a1d18]">
                  <div className="mb-1 flex justify-center">
                    {fim.vencedor === "caes" ? <CaoMini tam={54} /> : <OncaMini tam={58} />}
                  </div>
                  <p className="font-serif text-xl font-black italic text-[#3b2417] dark:text-[#f6e2c4]">
                    {fim.vencedor === "empate"
                      ? "Empate!"
                      : contraPc
                        ? fim.vencedor === lado
                          ? "Você venceu!"
                          : "Não foi dessa vez"
                        : `${NOMES[fim.vencedor]} venceu!`}
                  </p>
                  <p className="mt-1 text-xs text-[#7a5a44] dark:text-[#d9b58f]">{status}</p>
                  {estrelas !== null && estrelas > 0 && (
                    <p className="mt-2 text-sm font-bold text-amber-600 dark:text-amber-400">
                      {"⭐".repeat(estrelas)} +{estrelas} {estrelas === 1 ? "estrela" : "estrelas"}
                    </p>
                  )}
                  <div className="mt-3 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => comecar()}
                      className="h-11 cursor-pointer rounded-xl bg-[#c94a56] px-5 text-sm font-bold text-white hover:bg-[#b23f4a]"
                    >
                      Jogar de novo
                    </button>
                    {contraPc && (
                      <button
                        type="button"
                        onClick={() => comecar(lado === "onca" ? "caes" : "onca")}
                        className="h-10 cursor-pointer rounded-xl border border-[#d9b58f] bg-white/70 px-5 text-sm font-semibold text-[#7a3a24] hover:bg-white dark:bg-black/20 dark:text-[#f6e2c4]"
                      >
                        Trocar de lado ({lado === "onca" ? "ser os Cachorros" : "ser a Onça"})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* status e ações */}
          <div
            className={cn(
              "rounded-xl px-3 py-2 text-center text-sm font-bold",
              aperto
                ? "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200"
                : "bg-[#fbf3e4] text-[#3b2417] dark:bg-[#2a1d18] dark:text-[#f6e2c4]",
            )}
            aria-live="polite"
          >
            {aperto && !contraPc ? "A Onça está quase cercada! " : ""}
            {status}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {sequencia && humanoNaVez && (
              <button
                type="button"
                onClick={acabarSequencia}
                className="h-10 cursor-pointer rounded-xl bg-[#3b2417] px-4 text-sm font-bold text-[#fde68a]"
              >
                Parar aqui
              </button>
            )}
            <button
              type="button"
              onClick={pedirDica}
              disabled={!humanoNaVez}
              className="flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-[#d9b58f] bg-white/70 px-3 text-xs font-semibold text-[#7a3a24] hover:bg-white disabled:opacity-40 dark:bg-black/20 dark:text-[#f6e2c4]"
            >
              <Lightbulb className="size-4" /> Dica
            </button>
            <button
              type="button"
              onClick={() => comecar()}
              className="flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-[#d9b58f] bg-white/70 px-3 text-xs font-semibold text-[#7a3a24] hover:bg-white dark:bg-black/20 dark:text-[#f6e2c4]"
            >
              <RotateCcw className="size-4" /> Recomeçar
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
            <span>
              🐆 Onça <b className="text-foreground">{placar.onca}</b>
            </span>
            <span>empates {placar.empates}</span>
            <span>
              🐶 Cachorros <b className="text-foreground">{placar.caes}</b>
            </span>
          </div>
        </>
      )}

      <div className="overflow-hidden rounded-xl">
        <FaixaPenas invertida className="block h-[22px] w-full opacity-90" />
      </div>

      {ajuda && <Regras aoFechar={() => setAjuda(false)} />}
    </div>
  );
}

// ----------------------------------------------------------------- partes

function TelaInicial({
  contraPc,
  aoEscolher,
  aoAjuda,
}: {
  contraPc: boolean;
  aoEscolher: (l: Lado) => void;
  aoAjuda: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-[#d9b58f] bg-[#fbf3e4] p-4 text-sm leading-relaxed text-[#4a3325] dark:border-[#5a3a2a] dark:bg-[#2a1d18] dark:text-[#e9d4bb]">
        <p>
          Uma <b>onça</b> contra <b>14 cachorros</b>. A onça vence ao <b>capturar 5 cachorros</b>{" "}
          pulando por cima deles. Os cachorros vencem <b>cercando a onça</b> — o triângulo lá
          embaixo é a armadilha!
        </p>
        <button
          type="button"
          onClick={aoAjuda}
          className="mt-2 cursor-pointer text-xs font-bold text-[#a5482f] underline underline-offset-2"
        >
          Ver as regras completas
        </button>
      </div>

      {contraPc ? (
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => aoEscolher("onca")}
            className="flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border-2 border-[#e9a91c] bg-gradient-to-b from-[#fff6d6] to-[#ffe9a8] p-3 text-[#4a2a10] shadow-sm transition-transform hover:scale-[1.02]"
          >
            <OncaMini tam={64} />
            <span className="text-sm font-black">Ser a Onça</span>
            <span className="text-[11px] leading-tight opacity-80">Pule e capture 5 cachorros</span>
          </button>
          <button
            type="button"
            onClick={() => aoEscolher("caes")}
            className="flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border-2 border-[#c81f2c] bg-gradient-to-b from-[#ffe9e6] to-[#ffd2cc] p-3 text-[#5a1218] shadow-sm transition-transform hover:scale-[1.02]"
          >
            <CaoMini tam={60} />
            <span className="text-sm font-black">Ser os Cachorros</span>
            <span className="text-[11px] leading-tight opacity-80">
              Cerque a onça sem perder peças
            </span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => aoEscolher("onca")}
          className="h-12 cursor-pointer rounded-xl bg-[#c94a56] px-5 text-sm font-black text-white hover:bg-[#b23f4a]"
        >
          Começar: um joga com a Onça, o outro com os Cachorros
        </button>
      )}
    </div>
  );
}

function Regras({ aoFechar }: { aoFechar: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-3"
      role="dialog"
      aria-modal
      aria-label="Como jogar o Jogo da Onça"
      onClick={aoFechar}
    >
      <div
        className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl bg-[#fbf3e4] shadow-2xl dark:bg-[#2a1d18]"
        onClick={(e) => e.stopPropagation()}
      >
        <FaixaPenas className="block h-[28px] w-full" />
        <div className="p-4 text-sm leading-relaxed text-[#4a3325] dark:text-[#e9d4bb]">
          <h3 className="font-serif text-2xl font-black italic text-[#3b2417] dark:text-[#f6e2c4]">
            Jogo da Onça
          </h3>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#a5482f]">
            Jogo abstrato, da família dos jogos de captura
          </p>
          <p>
            Também chamado de <b>Adugo</b>, é um jogo tradicional dos povos indígenas do Brasil,
            ligado ao povo Bororo. Participam <b>dois jogadores</b>: um fica com a <b>onça</b> e o
            outro com os <b>14 cachorros</b>.
          </p>
          <h4 className="mt-3 font-bold text-[#a5482f]">Objetivo</h4>
          <p>
            A onça vence capturando <b>cinco cachorros</b>. Os cachorros vencem{" "}
            <b>imobilizando a onça</b>.
          </p>
          <h4 className="mt-3 font-bold text-[#a5482f]">Como se joga</h4>
          <ul className="ml-4 list-disc space-y-1">
            <li>A onça começa no centro, com os cachorros à frente dela; a onça joga primeiro.</li>
            <li>
              Cada turno, move-se <b>uma peça</b> para uma casa vizinha vazia, em qualquer direção,
              seguindo as linhas.
            </li>
            <li>
              A onça <b>come</b> um cachorro pulando por cima dele, em linha reta, até a casa vazia
              logo depois — como nas damas. Ela pode pular vários em sequência.
            </li>
            <li>
              Os cachorros <b>não podem comer</b> a onça: eles a cercam, por todos os lados.
            </li>
            <li>
              Dica aos cachorros: <b>encurralem a onça no triângulo</b>, a armadilha do tabuleiro.
            </li>
          </ul>
          <button
            type="button"
            onClick={aoFechar}
            className="mt-4 h-11 w-full cursor-pointer rounded-xl bg-[#c94a56] text-sm font-bold text-white hover:bg-[#b23f4a]"
          >
            Entendi, vamos jogar!
          </button>
        </div>
      </div>
    </div>
  );
}
