import { BookOpen, Bot, Lightbulb, RotateCcw, Users, Volume2, VolumeX } from "lucide-react";
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

interface Selecao {
  /** "onca" ou o id do cachorro. */
  peca: "onca" | number;
}

function atrasar(ms: number) {
  return new Promise<void>((r) => window.setTimeout(r, ms));
}

// ------------------------------------------------------------------ componente

export function JogoDaOnca({ adversario, nivel }: { adversario: Adversario; nivel: number }) {
  const [modo, setModo] = useState<Adversario>(adversario);
  const contraPc = modo === "computador";
  const [nomes, setNomes] = useState({ a: "Jogador 1", b: "Jogador 2" });
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
  /** p1 = quem começa com o lado `lado`; p2 = o outro (o computador, se for o caso). */
  const [placar, setPlacar] = useState({ p1: 0, p2: 0, empates: 0 });
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

  const nomeP1 = contraPc ? "Você" : nomes.a.trim() || "Jogador 1";
  const nomeP2 = contraPc ? "Computador" : nomes.b.trim() || "Jogador 2";
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
        p1: p.p1 + (r === lado ? 1 : 0),
        p2: p.p2 + (r !== "empate" && r !== lado ? 1 : 0),
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
        adversario: modo,
        nivel,
        segundos: Math.round((Date.now() - inicio.current) / 1000),
      });
      setEstrelas(n);
      return true;
    },
    [modo, contraPc, lado, nivel, tocar],
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

  // ---- muda entre computador e colega (recomeça do menu, com o placar zerado)
  function trocarModo(novo: Adversario) {
    if (novo === modo) return;
    setModo(novo);
    setFase("inicio");
    setFim(null);
    setEstrelas(null);
    setSel(null);
    setSequencia(false);
    setDica(null);
    setPensando(false);
    setPlacar({ p1: 0, p2: 0, empates: 0 });
    ocupado.current = false;
    if (som) tom(360, 0.1, "triangle", 0.1, 520);
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
    return estado.vez === "onca" ? "mova a Onça" : "mova um Cachorro";
  })();

  const capturados = estado.capturados;
  const aperto = estado.vez === "caes" && mob.passos + mob.pulos <= 1 && !fim;

  // ---------------------------------------------------------------- render

  const ativoP1 = !fim && estado.vez === lado;
  const nomeDaVez = estado.vez === lado ? nomeP1 : nomeP2;
  const btnPrimario =
    "cursor-pointer rounded-xl bg-[#d9b26a] px-5 text-sm font-black text-[#2a2320] shadow hover:bg-[#e6c383]";
  const btnSecundario =
    "cursor-pointer rounded-xl border border-[#d9b26a]/40 bg-[#3f3530] px-3 text-xs font-semibold text-[#efe4d2] hover:bg-[#4a3e37] disabled:cursor-default disabled:opacity-40";

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col gap-2.5 rounded-3xl bg-[#2a2320] p-2.5 shadow-xl ring-1 ring-[#d9b26a]/25">
      {/* cabeçalho */}
      <div className="overflow-hidden rounded-2xl border border-[#d9b26a]/20 bg-[#342b26]">
        <FaixaPenas className="block h-[26px] w-full" />
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <div>
            <h3 className="font-serif text-xl font-black italic leading-tight text-[#efe4d2]">
              Jogo da Onça
            </h3>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#d9a06a]">
              Adugo · jogo tradicional indígena
            </p>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setAjuda(true)}
              aria-label="Como jogar"
              className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-[#d9b26a]/40 bg-[#3f3530] text-[#efe4d2] hover:bg-[#4a3e37]"
            >
              <BookOpen className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setSom((s) => !s)}
              aria-label={som ? "Desligar o som" : "Ligar o som"}
              className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-[#d9b26a]/40 bg-[#3f3530] text-[#efe4d2] hover:bg-[#4a3e37]"
            >
              {som ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </button>
          </div>
        </div>
        {/* modo de jogo */}
        <div className="flex gap-1 border-t border-[#d9b26a]/15 bg-[#2a2320]/60 p-1.5">
          {(
            [
              ["computador", "Contra o computador", Bot],
              ["colega", "Contra um colega", Users],
            ] as const
          ).map(([id, rotulo, Icone]) => (
            <button
              key={id}
              type="button"
              onClick={() => trocarModo(id)}
              aria-pressed={modo === id}
              className={cn(
                "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold transition-colors",
                modo === id
                  ? "bg-[#d9b26a] text-[#2a2320]"
                  : "text-[#b8a58f] hover:bg-[#3f3530] hover:text-[#efe4d2]",
              )}
            >
              <Icone className="size-3.5" />
              {rotulo}
            </button>
          ))}
        </div>
      </div>

      {fase === "inicio" ? (
        <TelaInicial
          contraPc={contraPc}
          nomes={nomes}
          aoNomes={setNomes}
          nivel={nivel}
          aoEscolher={(l) => comecar(l)}
          aoAjuda={() => setAjuda(true)}
        />
      ) : (
        <>
          {/* placar */}
          <div className="rounded-2xl border border-[#d9b26a]/20 bg-[#342b26] p-2.5">
            <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
              {(
                [
                  { nome: nomeP1, lado: lado, vitorias: placar.p1, ativo: ativoP1 },
                  {
                    nome: nomeP2,
                    lado: (lado === "onca" ? "caes" : "onca") as Lado,
                    vitorias: placar.p2,
                    ativo: !fim && !ativoP1,
                  },
                ] as const
              ).flatMap((j, i) => {
                const cartao = (
                  <div
                    key={`j${i}`}
                    className={cn(
                      "flex min-w-0 flex-col items-center gap-0.5 rounded-xl border-2 px-2 py-1.5 text-center transition-colors",
                      j.ativo
                        ? "border-[#d9b26a] bg-[#4a3e37] shadow-[0_0_0_3px_rgba(217,178,106,0.15)]"
                        : "border-transparent bg-[#3f3530]",
                    )}
                  >
                    {j.lado === "onca" ? <OncaMini tam={34} /> : <CaoMini tam={32} />}
                    <span className="max-w-full truncate text-xs font-black text-[#efe4d2]">
                      {j.nome}
                    </span>
                    <span className="text-[10px] font-semibold text-[#b8a58f]">
                      {j.lado === "onca" ? "Onça" : "Cachorros"}
                    </span>
                    <span className="mt-0.5 text-2xl font-black leading-none text-[#d9b26a] tabular-nums">
                      {j.vitorias}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#b8a58f]">
                      {j.vitorias === 1 ? "vitória" : "vitórias"}
                    </span>
                  </div>
                );
                return i === 0
                  ? [
                      cartao,
                      <div
                        key="vs"
                        className="flex flex-col items-center justify-center gap-1 text-[#b8a58f]"
                      >
                        <span className="text-[10px] font-black">VS</span>
                        <span className="rounded-full bg-[#3f3530] px-2 py-0.5 text-[10px] font-bold">
                          {placar.empates} emp.
                        </span>
                      </div>,
                    ]
                  : [cartao];
              })}
            </div>

            {/* capturas da onça */}
            <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-[#2a2320] px-2.5 py-1.5">
              <div className="flex items-center gap-1.5">
                <OncaMini tam={22} />
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
                          ? "border-[#c46a62] bg-[#55302c]"
                          : "border-dashed border-[#8a7a68] opacity-70",
                      )}
                    >
                      {i < capturados && <CaoMini tam={18} />}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[#b8a58f]">
                <b className="text-[#e0a29a]">{CAES_TOTAL - capturados}</b> cães na roda ·{" "}
                <b className="text-[#d9b26a]">{capturados}</b>/{CAPTURAS_PARA_VENCER} capturas
              </span>
            </div>
          </div>

          {/* tabuleiro */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#52746a] to-[#3e5c53] p-2 shadow-md ring-1 ring-[#d9b26a]/30">
            <svg
              viewBox={`0 0 ${LARGURA} ${ALTURA}`}
              className="mx-auto block w-full max-w-[420px] select-none touch-manipulation"
              role="group"
              aria-label="Tabuleiro do Jogo da Onça"
            >
              <Madeira dica={dica} />

              {/* rastro da última jogada */}
              {ultimo && (
                <g opacity={0.6}>
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
                      <circle
                        cx={px(p.x)}
                        cy={py(p.y)}
                        r={alvo.captura !== null ? 19 : 15}
                        fill={
                          alvo.captura !== null ? "rgba(196,106,98,0.35)" : "rgba(217,178,106,0.45)"
                        }
                        stroke={alvo.captura !== null ? "#c46a62" : "#b98a3a"}
                        strokeWidth={2.4}
                      >
                        <animate
                          attributeName="r"
                          values={alvo.captura !== null ? "17;21;17" : "13;17;13"}
                          dur="1.1s"
                          repeatCount="indefinite"
                        />
                      </circle>
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
                <span className="rounded-full bg-[#2a2320]/95 px-4 py-1.5 text-center text-xs font-bold text-[#d9b26a] shadow-lg">
                  {aviso}
                </span>
              </div>
            )}

            {fim && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
                <div className="w-full max-w-[310px] rounded-2xl border-2 border-[#d9b26a]/60 bg-[#342b26] p-4 text-center shadow-2xl">
                  <div className="mb-1 flex justify-center">
                    {fim.vencedor === "empate" ? (
                      <span className="text-4xl">🤝</span>
                    ) : fim.vencedor === "caes" ? (
                      <CaoMini tam={54} />
                    ) : (
                      <OncaMini tam={58} />
                    )}
                  </div>
                  <p className="font-serif text-xl font-black italic text-[#efe4d2]">
                    {fim.vencedor === "empate"
                      ? "Empate!"
                      : contraPc
                        ? fim.vencedor === lado
                          ? "Você venceu!"
                          : "Não foi dessa vez"
                        : `${fim.vencedor === lado ? nomeP1 : nomeP2} venceu!`}
                  </p>
                  <p className="mt-1 text-xs text-[#b8a58f]">{status}</p>
                  <p className="mt-2 text-sm font-bold text-[#efe4d2]">
                    {nomeP1} <span className="text-[#d9b26a]">{placar.p1}</span> ×{" "}
                    <span className="text-[#d9b26a]">{placar.p2}</span> {nomeP2}
                  </p>
                  {estrelas !== null && estrelas > 0 && (
                    <p className="mt-1 text-sm font-bold text-[#d9b26a]">
                      {"⭐".repeat(estrelas)} +{estrelas} {estrelas === 1 ? "estrela" : "estrelas"}
                    </p>
                  )}
                  <div className="mt-3 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => comecar(lado === "onca" ? "caes" : "onca")}
                      className={cn(btnPrimario, "h-11")}
                    >
                      {contraPc
                        ? "Jogar de novo, trocando de lado"
                        : "Próxima partida (trocam de lado)"}
                    </button>
                    <button
                      type="button"
                      onClick={() => comecar()}
                      className={cn(btnSecundario, "h-10 text-sm")}
                    >
                      Jogar de novo, mesmos lados
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* status e ações */}
          <div
            className={cn(
              "rounded-xl px-3 py-2 text-center text-sm font-bold",
              aperto ? "bg-[#5a4a2a] text-[#f0d9a0]" : "bg-[#342b26] text-[#efe4d2]",
            )}
            aria-live="polite"
          >
            {aperto && !contraPc ? "A Onça está quase cercada! " : ""}
            {!fim && !contraPc ? `${nomeDaVez}: ` : ""}
            {status}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {sequencia && humanoNaVez && (
              <button
                type="button"
                onClick={acabarSequencia}
                className={cn(btnPrimario, "h-10 px-4")}
              >
                Parar aqui
              </button>
            )}
            <button
              type="button"
              onClick={pedirDica}
              disabled={!humanoNaVez}
              className={cn(btnSecundario, "flex h-10 items-center gap-1.5")}
            >
              <Lightbulb className="size-4" /> Dica
            </button>
            <button
              type="button"
              onClick={() => comecar()}
              className={cn(btnSecundario, "flex h-10 items-center gap-1.5")}
            >
              <RotateCcw className="size-4" /> Recomeçar
            </button>
            <button
              type="button"
              onClick={() => setFase("inicio")}
              className={cn(btnSecundario, "flex h-10 items-center gap-1.5")}
            >
              Menu
            </button>
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

const NIVEIS = ["Fácil", "Médio", "Difícil"];

function TelaInicial({
  contraPc,
  nomes,
  aoNomes,
  nivel,
  aoEscolher,
  aoAjuda,
}: {
  contraPc: boolean;
  nomes: { a: string; b: string };
  aoNomes: (n: { a: string; b: string }) => void;
  nivel: number;
  aoEscolher: (l: Lado) => void;
  aoAjuda: () => void;
}) {
  const campo =
    "h-10 w-full rounded-lg border border-[#d9b26a]/40 bg-[#2a2320] px-3 text-sm font-semibold text-[#efe4d2] placeholder:text-[#8a7a68] focus:border-[#d9b26a] focus:outline-none";
  return (
    <div className="flex flex-col gap-2.5">
      <div className="rounded-2xl border border-[#d9b26a]/20 bg-[#342b26] p-3.5 text-sm leading-relaxed text-[#e2d5c0]">
        <p>
          Uma <b className="text-[#d9b26a]">onça</b> contra{" "}
          <b className="text-[#d9b26a]">14 cachorros</b>. A onça vence ao{" "}
          <b className="text-[#d9b26a]">capturar 5 cachorros</b> pulando por cima deles. Os
          cachorros vencem <b className="text-[#d9b26a]">cercando a onça</b> — o triângulo lá
          embaixo é a armadilha!
        </p>
        <button
          type="button"
          onClick={aoAjuda}
          className="mt-2 cursor-pointer text-xs font-bold text-[#d9a06a] underline underline-offset-2"
        >
          Ver as regras completas
        </button>
      </div>

      {contraPc ? (
        <>
          <p className="px-1 text-xs font-semibold text-[#b8a58f]">
            Nível: <b className="text-[#d9b26a]">{NIVEIS[nivel - 1]}</b> — escolha seu lado:
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => aoEscolher("onca")}
              className="flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border-2 border-[#d9b26a] bg-gradient-to-b from-[#5a4a2e] to-[#40351f] p-3 text-[#efe4d2] shadow-sm transition-transform hover:scale-[1.02]"
            >
              <OncaMini tam={64} />
              <span className="text-sm font-black text-[#d9b26a]">Ser a Onça</span>
              <span className="text-[11px] leading-tight opacity-85">
                Pule e capture 5 cachorros
              </span>
            </button>
            <button
              type="button"
              onClick={() => aoEscolher("caes")}
              className="flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border-2 border-[#c46a62] bg-gradient-to-b from-[#55302c] to-[#3a2220] p-3 text-[#efe4d2] shadow-sm transition-transform hover:scale-[1.02]"
            >
              <CaoMini tam={60} />
              <span className="text-sm font-black text-[#e0a29a]">Ser os Cachorros</span>
              <span className="text-[11px] leading-tight opacity-85">
                Cerque a onça sem perder peças
              </span>
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-2 rounded-2xl border border-[#d9b26a]/20 bg-[#342b26] p-3">
          <p className="text-xs font-semibold text-[#b8a58f]">
            Dois jogadores no mesmo aparelho. Digite os nomes para aparecer no placar:
          </p>
          <label className="flex items-center gap-2">
            <OncaMini tam={30} />
            <input
              value={nomes.a}
              maxLength={14}
              onChange={(e) => aoNomes({ ...nomes, a: e.target.value })}
              placeholder="Jogador 1"
              className={campo}
              aria-label="Nome do jogador 1"
            />
          </label>
          <label className="flex items-center gap-2">
            <CaoMini tam={28} />
            <input
              value={nomes.b}
              maxLength={14}
              onChange={(e) => aoNomes({ ...nomes, b: e.target.value })}
              placeholder="Jogador 2"
              className={campo}
              aria-label="Nome do jogador 2"
            />
          </label>
          <p className="text-[11px] text-[#b8a58f]">
            O primeiro joga com a <b className="text-[#d9b26a]">Onça</b> (e começa); o segundo, com
            os <b className="text-[#e0a29a]">Cachorros</b>. A cada partida, os lados se invertem.
          </p>
          <button
            type="button"
            onClick={() => aoEscolher("onca")}
            className="mt-1 h-12 cursor-pointer rounded-xl bg-[#d9b26a] px-5 text-sm font-black text-[#2a2320] shadow hover:bg-[#e6c383]"
          >
            Começar a partida
          </button>
        </div>
      )}
    </div>
  );
}

function Regras({ aoFechar }: { aoFechar: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-3"
      role="dialog"
      aria-modal
      aria-label="Como jogar o Jogo da Onça"
      onClick={aoFechar}
    >
      <div
        className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#d9b26a]/30 bg-[#342b26] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <FaixaPenas className="block h-[28px] w-full" />
        <div className="p-4 text-sm leading-relaxed text-[#e2d5c0]">
          <h3 className="font-serif text-2xl font-black italic text-[#efe4d2]">Jogo da Onça</h3>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#d9a06a]">
            Jogo abstrato, da família dos jogos de captura
          </p>
          <p>
            Também chamado de <b className="text-[#d9b26a]">Adugo</b>, é um jogo tradicional dos
            povos indígenas do Brasil, ligado ao povo Bororo. Participam <b>dois jogadores</b>: um
            fica com a <b>onça</b> e o outro com os <b>14 cachorros</b>.
          </p>
          <h4 className="mt-3 font-bold text-[#d9b26a]">Objetivo</h4>
          <p>
            A onça vence capturando <b>cinco cachorros</b>. Os cachorros vencem{" "}
            <b>imobilizando a onça</b>.
          </p>
          <h4 className="mt-3 font-bold text-[#d9b26a]">Como se joga</h4>
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
            className="mt-4 h-11 w-full cursor-pointer rounded-xl bg-[#d9b26a] text-sm font-black text-[#2a2320] hover:bg-[#e6c383]"
          >
            Entendi, vamos jogar!
          </button>
        </div>
      </div>
    </div>
  );
}
