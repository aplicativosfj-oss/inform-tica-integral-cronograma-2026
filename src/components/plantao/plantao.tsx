import {
  ArrowLeft,
  Check,
  ChevronRight,
  Crosshair,
  Gamepad2,
  HelpCircle,
  Lock,
  Play,
  RotateCcw,
  Settings,
  Star,
  Trophy,
  Users,
  Volume2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  CENARIOS_MARATONA,
  CLIMAS,
  DIEGO,
  gravarProgresso,
  lerProgresso,
  MISSOES,
  NOMES_NIVEL,
  PASTA_IMG,
  PERSONAGENS,
  PISTAS_MOTO,
  SPRITES_NPC,
  type CenarioMaratona,
  type Clima,
  type Missao,
  type MissaoId,
  type Nivel,
  type PistaMoto,
  type Progresso,
} from "@/components/plantao/dados";
import { type Imagens } from "@/components/plantao/desenho";
import { type ResultadoArena } from "@/components/plantao/motor-arena";
import { SomPlantao } from "@/components/plantao/som-plantao";
import { TelaArena, TelaMaratona } from "@/components/plantao/tela-jogo";
import { Corrida } from "@/components/school/jogos/corrida";
import { cn } from "@/lib/utils";

/**
 * Operação: Plantão — o jogo da equipe.
 *
 * Fluxo: menu → (escolher agente) → missões → preparação (dificuldade, clima,
 * cenário) → jogo → resultado. O progresso (estrelas por missão, agente
 * escolhido e ajustes de som) fica no navegador.
 */

type Tela = "menu" | "selecao" | "missoes" | "config" | "como" | "jogo" | "resultado";

const ARQUIVOS = [
  ...PERSONAGENS.map((p) => p.rosto),
  ...PERSONAGENS.map((p) => p.sprite),
  DIEGO.rosto,
  DIEGO.sprite,
  ...SPRITES_NPC,
];

function useImagens(): Imagens {
  const [imgs] = useState<Imagens>(() => {
    const m: Imagens = {};
    if (typeof window === "undefined") return m;
    for (const a of ARQUIVOS) {
      const i = new Image();
      i.src = `${PASTA_IMG}${a}`;
      m[a] = i;
    }
    return m;
  });
  // Imagens grandes de tela: baixam em segundo plano para as telas abrirem instantâneas.
  useEffect(() => {
    for (const a of [
      "menu-fundo.webp",
      "selecao-fundo.webp",
      "missao-cachorro.webp",
      "missao-moto.webp",
      ...PERSONAGENS.map((p) => p.arte),
      ...MISSOES.map((m) => m.cenario),
    ]) {
      const i = new Image();
      i.src = `${PASTA_IMG}${a}`;
    }
  }, []);
  return imgs;
}

function Titulo({ pequeno }: { pequeno?: boolean }) {
  return (
    <h1
      className={cn(
        "font-black uppercase italic leading-[0.85] tracking-tight [text-shadow:0_3px_0_rgba(0,0,0,0.6)]",
        pequeno ? "text-2xl" : "text-4xl sm:text-6xl [@media(max-height:520px)]:!text-3xl",
      )}
    >
      <span className="block text-white [-webkit-text-stroke:1px_#0f172a]">Operação:</span>
      <span className="block bg-gradient-to-b from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent [-webkit-text-stroke:1px_#78350f]">
        Plantão
      </span>
    </h1>
  );
}

function Estrelas({ n, tamanho = "size-4" }: { n: number; tamanho?: string }) {
  return (
    <span className="flex gap-0.5" aria-label={`${n} de 3 estrelas`}>
      {[1, 2, 3].map((i) => (
        <img
          key={i}
          src="/images/jogos/estrela-ouro.webp"
          alt=""
          className={cn(tamanho, "object-contain", i > n && "opacity-25 grayscale")}
        />
      ))}
    </span>
  );
}

function BotaoMenu({
  icone: Icone,
  texto,
  aoClicar,
  destaque,
}: {
  icone: React.ComponentType<{ className?: string }>;
  texto: string;
  aoClicar: () => void;
  destaque?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      className={cn(
        "group flex h-12 w-full cursor-pointer items-center gap-3 border-2 px-4 text-left text-base font-black uppercase italic tracking-wide transition-all [@media(max-height:520px)]:h-9 [@media(max-height:520px)]:text-sm [clip-path:polygon(0_0,calc(100%-14px)_0,100%_50%,calc(100%-14px)_100%,0_100%)] hover:translate-x-1 sm:h-14 sm:text-lg",
        destaque
          ? "border-amber-200 bg-gradient-to-r from-amber-300 to-amber-500 text-amber-950 shadow-[0_0_24px_rgba(251,191,36,0.45)]"
          : "border-sky-400/50 bg-gradient-to-r from-sky-950/90 to-slate-900/80 text-white hover:border-sky-300",
      )}
    >
      <Icone className="size-5 shrink-0 sm:size-6" />
      <span className="flex-1">{texto}</span>
      <ChevronRight className="size-5 opacity-70 transition-transform group-hover:translate-x-1" />
    </button>
  );
}

export function OperacaoPlantao() {
  const imagens = useImagens();
  const [prog, setProg] = useState<Progresso>(() => lerProgresso());
  const [tela, setTela] = useState<Tela>("menu");
  const [missaoSel, setMissaoSel] = useState<Missao | null>(null);
  const [nivel, setNivel] = useState<Nivel>(2);
  const [clima, setClima] = useState<Clima>("dia");
  const [cenMaratona, setCenMaratona] = useState<CenarioMaratona>("rio");
  const [pistaMoto, setPistaMoto] = useState<PistaMoto>("praia");
  const [resultado, setResultado] = useState<ResultadoArena | null>(null);
  const [rodada, setRodada] = useState(0);
  const som = useRef<SomPlantao | null>(null);
  const [nomeSel, setNomeSel] = useState(prog.personagem);

  const personagem = PERSONAGENS.find((p) => p.id === prog.personagem) ?? PERSONAGENS[0]!;
  const totalEstrelas = Object.values(prog.missoes).reduce((s, m) => s + (m?.estrelas ?? 0), 0);
  const nivelJogador = 1 + Math.floor(totalEstrelas / 2);

  const salvar = useCallback((p: Progresso) => {
    setProg(p);
    gravarProgresso(p);
  }, []);

  // Som do menu: só nasce depois de um toque; a primeira interação cria o contexto.
  const garantirSom = useCallback(() => {
    if (!som.current) {
      som.current = SomPlantao.criar();
      som.current?.definir(prog.musicaLigada, prog.somLigado);
    }
    som.current?.retomar();
    return som.current;
  }, [prog.musicaLigada, prog.somLigado]);
  useEffect(
    () => () => {
      som.current?.parar();
      som.current = null;
    },
    [],
  );

  const irPara = (t: Tela) => {
    garantirSom()?.clique();
    setTela(t);
  };

  const iniciar = (m: Missao) => {
    const s = garantirSom();
    s?.definir(prog.musicaLigada, prog.somLigado);
    setMissaoSel(m);
    setResultado(null);
    setRodada((r) => r + 1);
    setTela("jogo");
    // Tela cheia e paisagem: o clique é o gesto que o navegador exige.
    try {
      void document.documentElement.requestFullscreen?.().catch(() => undefined);
      const o = window.screen.orientation as ScreenOrientation & {
        lock?: (t: string) => Promise<void>;
      };
      void o?.lock?.("landscape").catch(() => undefined);
    } catch {
      // Sem tela cheia: o jogo segue na janela.
    }
  };

  const sairDoJogo = useCallback(() => {
    som.current?.pararMusica();
    try {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    } catch {
      // Já fora da tela cheia.
    }
    setTela("missoes");
  }, []);

  const concluir = useCallback(
    (r: ResultadoArena) => {
      if (!missaoSel) return;
      const atual = prog.missoes[missaoSel.id];
      if (
        !atual ||
        r.estrelas > atual.estrelas ||
        (r.estrelas === atual.estrelas && r.pontos > atual.pontos)
      ) {
        salvar({
          ...prog,
          missoes: {
            ...prog.missoes,
            [missaoSel.id]: {
              estrelas: Math.max(r.estrelas, atual?.estrelas ?? 0),
              pontos: Math.max(r.pontos, atual?.pontos ?? 0),
            },
          },
        });
      }
      setResultado(r);
      setTela("resultado");
      try {
        if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
      } catch {
        // ignora
      }
    },
    [missaoSel, prog, salvar],
  );

  const fimMoto = useCallback(
    (r: { posicao: number; segundos: number; total: number }) => {
      concluir({
        vitoria: r.posicao <= 3,
        motivo:
          r.posicao === 1
            ? "Você alcançou o suspeito!"
            : r.posicao <= 3
              ? "Bom trabalho na perseguição!"
              : "O suspeito escapou dessa vez.",
        pontos: Math.max(0, (7 - r.posicao) * 350),
        estrelas: r.posicao === 1 ? 3 : r.posicao === 2 ? 2 : r.posicao === 3 ? 1 : 0,
        tempoGasto: r.segundos,
        detalhes: [
          `Posição final: ${r.posicao}º de ${r.total}`,
          `Tempo: ${Math.round(r.segundos)} s`,
        ],
      });
    },
    [concluir],
  );

  // ---------------------------------------------------------------- telas

  const rodape = (
    <p className="pointer-events-none absolute inset-x-0 bottom-1 z-20 px-3 text-center text-[10px] text-slate-400">
      Operação: Plantão · criado pelo professor Franc D&apos;nis · 2026 · v1.0
    </p>
  );

  if (tela === "jogo" && missaoSel) {
    return (
      <div className="fixed inset-0 z-50 bg-black" key={rodada}>
        {missaoSel.tipo === "arena" && (
          <TelaArena
            missao={missaoSel}
            personagem={personagem}
            nivel={nivel}
            clima={clima}
            som={som.current}
            imagens={imagens}
            aoFim={concluir}
            aoSair={sairDoJogo}
          />
        )}
        {missaoSel.tipo === "maratona" && (
          <TelaMaratona
            missao={missaoSel}
            personagem={personagem}
            nivel={nivel}
            clima={clima}
            cenario={cenMaratona}
            som={som.current}
            imagens={imagens}
            aoFim={concluir}
            aoSair={sairDoJogo}
          />
        )}
        {missaoSel.tipo === "moto" && (
          <div className="flex h-full w-full items-center justify-center overflow-auto bg-black p-2">
            <div className="w-full max-w-5xl">
              <Corrida
                adversario="computador"
                nivel={nivel}
                automatico={{
                  pista: pistaMoto,
                  modo: "voltas",
                  voltas: missaoSel.meta[nivel - 1]!,
                  tempo: 90,
                  nivel,
                  veiculo: "moto",
                  piloto: {
                    camisa: personagem.camisa,
                    calca: personagem.calca,
                    capacete: personagem.capacete,
                    mochila: personagem.mochila,
                  },
                  corVeiculo: "#b91c1c",
                  titulo: missaoSel.titulo,
                  subtitulo: `${personagem.nome} na moto, atrás do suspeito ${DIEGO.nome}. Chegue à frente dele!`,
                  aoFim: fimMoto,
                  aoSair: sairDoJogo,
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-slate-950 text-white">
      {/* fundo */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${PASTA_IMG}${tela === "selecao" ? "selecao-fundo.webp" : "menu-fundo.webp"})`,
        }}
        aria-hidden
      />
      <div
        className={cn(
          "absolute inset-0",
          tela === "menu"
            ? "bg-[linear-gradient(to_right,rgba(2,6,23,0.97),rgba(2,6,23,0.85)_35%,rgba(2,6,23,0.05)_75%),linear-gradient(to_bottom,rgba(2,6,23,0.95),rgba(2,6,23,0)_38%)]"
            : "bg-slate-950/80 backdrop-blur-[3px]",
        )}
      />

      {tela === "menu" && (
        <div className="relative flex h-full flex-col justify-between gap-2 overflow-y-auto p-4 sm:p-8 [@media(max-height:520px)]:p-3">
          <div className="flex items-start justify-between gap-3">
            <Titulo />
            <button
              type="button"
              onClick={() => irPara("selecao")}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-sky-400/40 bg-slate-950/80 p-1.5 pr-3 backdrop-blur"
              aria-label="Trocar de agente"
            >
              <img
                src={`${PASTA_IMG}${personagem.rosto}`}
                alt=""
                className="size-10 rounded-full border-2 border-white object-cover"
              />
              <span className="text-left leading-tight">
                <b className="block text-xs uppercase">{personagem.nome}</b>
                <span className="text-[10px] text-sky-300">
                  Nível {nivelJogador} · {totalEstrelas} ★
                </span>
              </span>
            </button>
          </div>
          <div className="flex w-full max-w-[22rem] flex-col gap-2 [@media(max-height:520px)]:gap-1">
            <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-amber-200/90 [@media(max-height:520px)]:hidden">
              Missões reais. Desafios todo dia.
            </p>
            <BotaoMenu icone={Play} texto="Jogar" destaque aoClicar={() => irPara("missoes")} />
            <BotaoMenu
              icone={Users}
              texto="Selecionar personagem"
              aoClicar={() => irPara("selecao")}
            />
            <BotaoMenu icone={Crosshair} texto="Missões" aoClicar={() => irPara("missoes")} />
            <BotaoMenu icone={HelpCircle} texto="Como jogar" aoClicar={() => irPara("como")} />
            <BotaoMenu icone={Settings} texto="Configurações" aoClicar={() => irPara("config")} />
          </div>
          {rodape}
        </div>
      )}

      {tela === "selecao" && (
        <div className="relative flex h-full flex-col gap-3 overflow-y-auto p-4 sm:p-8">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => irPara("menu")}
              className="flex cursor-pointer items-center gap-1 text-sm font-semibold text-slate-300 hover:text-white"
            >
              <ArrowLeft className="size-4" /> Voltar
            </button>
            <Titulo pequeno />
          </div>
          <h2 className="text-2xl font-black uppercase italic sm:text-3xl">
            Selecionar personagem
          </h2>
          <p className="-mt-2 text-xs text-slate-300 sm:text-sm">
            Cada agente tem habilidades e estilos únicos para enfrentar os desafios da unidade.
          </p>
          <div className="grid flex-1 gap-4 lg:grid-cols-[280px_1fr_340px]">
            <div className="flex gap-2 overflow-x-auto lg:flex-col">
              {PERSONAGENS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    garantirSom()?.clique();
                    setNomeSel(p.id);
                  }}
                  aria-pressed={nomeSel === p.id}
                  className={cn(
                    "flex min-w-[210px] cursor-pointer items-center gap-3 rounded-xl border-2 p-2 text-left transition-all lg:min-w-0",
                    nomeSel === p.id
                      ? "border-amber-300 bg-amber-400/10 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                      : "border-white/15 bg-slate-900/70 hover:border-white/40",
                  )}
                >
                  <img
                    src={`${PASTA_IMG}${p.rosto}`}
                    alt=""
                    className="size-14 rounded-full border-2 border-white object-cover"
                  />
                  <span className="min-w-0 leading-tight">
                    <b className="block truncate text-sm uppercase italic">{p.nome}</b>
                    <span className="text-[11px] text-amber-300">{p.funcao}</span>
                    <span className="block truncate text-[10px] text-slate-400">
                      &ldquo;{p.frase}&rdquo;
                    </span>
                  </span>
                </button>
              ))}
              <div className="hidden min-w-[210px] items-center gap-3 rounded-xl border-2 border-dashed border-red-400/40 bg-red-950/30 p-2 lg:flex">
                <img
                  src={`${PASTA_IMG}${DIEGO.rosto}`}
                  alt=""
                  className="size-14 rounded-full border-2 border-red-300 object-cover grayscale-[40%]"
                />
                <span className="leading-tight">
                  <b className="block text-sm uppercase italic">{DIEGO.nome}</b>
                  <span className="text-[11px] text-red-300">{DIEGO.funcao}</span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Lock className="size-3" /> aparece nas missões
                  </span>
                </span>
              </div>
            </div>

            {(() => {
              const p = PERSONAGENS.find((x) => x.id === nomeSel)!;
              return (
                <>
                  <div className="relative hidden min-h-[320px] items-end justify-center lg:flex">
                    <img
                      src={`${PASTA_IMG}${p.arte}`}
                      alt={p.nome}
                      className="max-h-[68vh] rounded-2xl object-contain drop-shadow-2xl [mask-image:linear-gradient(to_bottom,black_85%,transparent)]"
                    />
                  </div>
                  <div className="flex flex-col gap-3 rounded-2xl border border-sky-400/40 bg-slate-950/85 p-4 backdrop-blur">
                    <div>
                      <h3 className="text-2xl font-black uppercase italic leading-none">
                        {p.nome}
                      </h3>
                      <p className="text-sm font-bold text-amber-300">{p.funcao}</p>
                      <p className="text-xs italic text-slate-300">&ldquo;{p.frase}&rdquo;</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {(
                        [
                          ["Velocidade", p.atributos.velocidade, "bg-sky-400"],
                          ["Força", p.atributos.forca, "bg-amber-400"],
                          ["Agilidade", p.atributos.agilidade, "bg-sky-400"],
                          ["Foco", p.atributos.foco, "bg-amber-400"],
                        ] as const
                      ).map(([n, v, cor]) => (
                        <div key={n} className="flex items-center gap-2 text-xs">
                          <span className="w-20 font-bold uppercase">{n}</span>
                          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className={cn("h-full rounded-full", cor)}
                              style={{ width: `${v}%` }}
                            />
                          </div>
                          <b className="w-7 text-right tabular-nums">{v}</b>
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-1.5">
                      {p.tracos.map((t) => (
                        <div
                          key={t.nome}
                          className="rounded-lg border border-white/10 bg-white/5 p-2"
                        >
                          <b className="text-xs uppercase text-sky-300">{t.nome}</b>
                          <p className="text-[11px] text-slate-300">{t.descricao}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Velocidade muda o ritmo, força a quantidade de marmitas, agilidade a resposta
                      ao volante e foco dá segundos extras em todas as missões.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        garantirSom()?.entregar();
                        salvar({ ...prog, personagem: p.id });
                        setTela("menu");
                      }}
                      className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-amber-300 to-orange-500 text-base font-black uppercase italic text-amber-950 shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
                    >
                      <Check className="size-5" /> Selecionar {p.nome.split(" ")[0]}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
          {rodape}
        </div>
      )}

      {tela === "missoes" && (
        <div className="relative flex h-full flex-col gap-3 overflow-y-auto p-4 pb-8 sm:p-8">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => irPara("menu")}
              className="flex cursor-pointer items-center gap-1 text-sm font-semibold text-slate-300 hover:text-white"
            >
              <ArrowLeft className="size-4" /> Voltar
            </button>
            <div className="flex items-center gap-2 rounded-full border border-amber-300/40 bg-slate-950/80 px-3 py-1 text-sm font-bold">
              <img
                src={`${PASTA_IMG}${personagem.rosto}`}
                alt=""
                className="size-6 rounded-full object-cover"
              />{" "}
              {personagem.nome} · {totalEstrelas} ★
            </div>
          </div>
          <h2 className="text-2xl font-black uppercase italic sm:text-3xl">Escolha a missão</h2>
          <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
            <div className="grid gap-2.5 sm:grid-cols-2">
              {MISSOES.map((m) => {
                const b = prog.missoes[m.id];
                const ativa = missaoSel?.id === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      garantirSom()?.clique();
                      setMissaoSel(m);
                    }}
                    aria-pressed={ativa}
                    className={cn(
                      "group flex cursor-pointer gap-3 overflow-hidden rounded-xl border-2 bg-slate-900/85 p-2 text-left transition-all hover:-translate-y-0.5",
                      ativa
                        ? "border-amber-300 shadow-[0_0_22px_rgba(251,191,36,0.35)]"
                        : "border-white/15 hover:border-white/40",
                    )}
                  >
                    <img
                      src={`${PASTA_IMG}${m.cenario}`}
                      alt=""
                      className="h-20 w-24 shrink-0 rounded-lg object-cover"
                    />
                    <span className="flex min-w-0 flex-1 flex-col justify-between">
                      <span>
                        <b className="block text-sm font-black uppercase italic leading-tight">
                          {m.titulo}
                        </b>
                        <span className="text-[11px] text-sky-300">{m.local}</span>
                      </span>
                      <Estrelas n={b?.estrelas ?? 0} />
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-sky-400/40 bg-slate-950/85 p-4 backdrop-blur">
              {missaoSel ? (
                <>
                  <img
                    src={`${PASTA_IMG}${missaoSel.cenario}`}
                    alt=""
                    className="h-32 w-full rounded-xl object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-black uppercase italic leading-tight">
                      {missaoSel.titulo}
                    </h3>
                    <p className="text-xs text-slate-300">{missaoSel.resumo}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Dificuldade
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {([1, 2, 3] as Nivel[]).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setNivel(n)}
                          aria-pressed={nivel === n}
                          className={cn(
                            "h-9 cursor-pointer rounded-lg border-2 text-xs font-black uppercase",
                            nivel === n
                              ? "border-amber-300 bg-amber-400 text-amber-950"
                              : "border-white/20 bg-white/5 hover:bg-white/10",
                          )}
                        >
                          {NOMES_NIVEL[n - 1]}
                        </button>
                      ))}
                    </div>
                  </div>
                  {missaoSel.tipo !== "moto" && (
                    <div>
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Clima do cenário
                      </p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {CLIMAS.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setClima(c.id)}
                            aria-pressed={clima === c.id}
                            className={cn(
                              "h-9 cursor-pointer rounded-lg border-2 text-xs font-bold",
                              clima === c.id
                                ? "border-amber-300 bg-amber-400/20"
                                : "border-white/20 bg-white/5 hover:bg-white/10",
                            )}
                          >
                            <span aria-hidden>{c.emoji}</span> {c.nome}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {missaoSel.tipo === "maratona" && (
                    <div>
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Cenário da prova
                      </p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {CENARIOS_MARATONA.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setCenMaratona(c.id)}
                            aria-pressed={cenMaratona === c.id}
                            className={cn(
                              "cursor-pointer overflow-hidden rounded-lg border-2",
                              cenMaratona === c.id
                                ? "border-amber-300"
                                : "border-white/20 opacity-70 hover:opacity-100",
                            )}
                          >
                            <img
                              src={`${PASTA_IMG}${c.arquivo}`}
                              alt=""
                              className="h-10 w-full object-cover"
                            />
                            <span className="block bg-slate-900 py-0.5 text-[9px] font-bold uppercase">
                              {c.nome}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {missaoSel.tipo === "moto" && (
                    <div>
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Pista
                      </p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {PISTAS_MOTO.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setPistaMoto(c.id)}
                            aria-pressed={pistaMoto === c.id}
                            className={cn(
                              "cursor-pointer overflow-hidden rounded-lg border-2",
                              pistaMoto === c.id
                                ? "border-amber-300"
                                : "border-white/20 opacity-70 hover:opacity-100",
                            )}
                          >
                            <img
                              src={`${PASTA_IMG}${c.arquivo}`}
                              alt=""
                              className="h-10 w-full object-cover"
                            />
                            <span className="block bg-slate-900 py-0.5 text-[9px] font-bold uppercase">
                              {c.nome}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => iniciar(missaoSel)}
                    className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-amber-300 to-orange-500 text-base font-black uppercase italic text-amber-950 shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
                  >
                    <Gamepad2 className="size-5" /> Iniciar missão
                  </button>
                </>
              ) : (
                <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center text-slate-400">
                  <Crosshair className="size-10 opacity-50" />
                  <p className="text-sm">
                    Escolha uma missão ao lado para ver os detalhes e começar.
                  </p>
                </div>
              )}
            </div>
          </div>
          {rodape}
        </div>
      )}

      {tela === "config" && (
        <div className="relative flex h-full flex-col gap-4 overflow-y-auto p-4 sm:p-8">
          <button
            type="button"
            onClick={() => irPara("menu")}
            className="flex w-fit cursor-pointer items-center gap-1 text-sm font-semibold text-slate-300 hover:text-white"
          >
            <ArrowLeft className="size-4" /> Voltar
          </button>
          <h2 className="text-2xl font-black uppercase italic sm:text-3xl">Configurações</h2>
          <div className="grid max-w-xl gap-2">
            {(
              [
                ["Efeitos sonoros", "somLigado"],
                ["Música", "musicaLigada"],
                ["Botões de toque na tela", "botoesToque"],
              ] as const
            ).map(([nome, chave]) => (
              <button
                key={chave}
                type="button"
                onClick={() => {
                  const novo = { ...prog, [chave]: !prog[chave] };
                  salvar(novo);
                  som.current?.definir(novo.musicaLigada, novo.somLigado);
                  garantirSom()?.clique();
                }}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-white/15 bg-slate-900/80 px-4 py-3 text-left"
              >
                <span className="flex items-center gap-2 text-sm font-bold">
                  <Volume2 className="size-4 text-sky-300" /> {nome}
                </span>
                <span
                  className={cn(
                    "rounded-full px-3 py-0.5 text-xs font-black",
                    prog[chave] ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-300",
                  )}
                >
                  {prog[chave] ? "LIGADO" : "DESLIGADO"}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Apagar todo o progresso (estrelas e pontos)?"))
                  salvar({ ...prog, missoes: {} });
              }}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-red-400/40 bg-red-950/30 px-4 py-3 text-sm font-bold text-red-200"
            >
              <RotateCcw className="size-4" /> Zerar progresso
            </button>
          </div>
          {rodape}
        </div>
      )}

      {tela === "como" && (
        <div className="relative flex h-full flex-col gap-4 overflow-y-auto p-4 sm:p-8">
          <button
            type="button"
            onClick={() => irPara("menu")}
            className="flex w-fit cursor-pointer items-center gap-1 text-sm font-semibold text-slate-300 hover:text-white"
          >
            <ArrowLeft className="size-4" /> Voltar
          </button>
          <h2 className="text-2xl font-black uppercase italic sm:text-3xl">Como jogar</h2>
          <div className="grid max-w-4xl gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-sky-400/40 bg-slate-950/85 p-4">
              <h3 className="mb-2 font-black uppercase italic text-sky-300">No computador</h3>
              <ul className="grid gap-1.5 text-sm">
                {[
                  ["WASD / Setas", "Mover o agente"],
                  ["SHIFT", "Correr (gasta fôlego)"],
                  ["E / Espaço", "Interagir com objetos brilhantes"],
                  ["ESC / P", "Pausar"],
                  ["Maratona: W S e Espaço", "Trocar de faixa e pular"],
                  ["Moto: setas / WASD", "Pilotar; ↑ acelera, ↓ freia"],
                ].map(([t, d]) => (
                  <li key={t} className="flex gap-2">
                    <kbd className="shrink-0 rounded bg-slate-800 px-1.5 py-0.5 text-[11px] font-bold">
                      {t}
                    </kbd>
                    <span className="text-slate-300">{d}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-amber-300/40 bg-slate-950/85 p-4">
              <h3 className="mb-2 font-black uppercase italic text-amber-300">No celular</h3>
              <ul className="grid gap-1.5 text-sm text-slate-300">
                <li>🕹️ Joystick na esquerda para andar.</li>
                <li>⚡ CORRER: segure para disparar (gasta fôlego).</li>
                <li>✋ INTERAGIR: pulsa quando há algo por perto.</li>
                <li>🏃 Maratona: setas para trocar de faixa e PULAR.</li>
                <li>🏍️ Moto: volante na tela, dedo na pista ou inclinar o celular.</li>
                <li>📱 Gire o celular para o modo paisagem.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/15 bg-slate-950/85 p-4 md:col-span-2">
              <h3 className="mb-2 font-black uppercase italic text-white">Missões</h3>
              <ul className="grid gap-1.5 text-sm text-slate-300 sm:grid-cols-2">
                {MISSOES.map((m) => (
                  <li key={m.id}>
                    <b className="text-amber-300">{m.titulo}:</b> {m.resumo}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-slate-400">
                Estrelas: terminar dá 1; sobrar 25% do tempo dá 2; sobrar 50% dá 3. Foco e força do
                agente mudam o jogo — teste todos!
              </p>
            </div>
          </div>
          {rodape}
        </div>
      )}

      {tela === "resultado" && resultado && missaoSel && (
        <div className="relative flex h-full items-center justify-center overflow-y-auto p-4">
          <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-3xl border-2 border-amber-300/50 bg-slate-950/90 p-6 text-center shadow-2xl backdrop-blur">
            <img
              src={`/images/jogos/${resultado.vitoria ? (resultado.estrelas >= 3 ? "trofeu-ouro" : resultado.estrelas === 2 ? "trofeu-prata" : "trofeu-bronze") : "trofeu-prata"}.webp`}
              alt=""
              className={cn(
                "size-24 object-contain drop-shadow-xl",
                !resultado.vitoria && "opacity-40 grayscale",
              )}
            />
            <h2 className="text-3xl font-black uppercase italic">
              {resultado.vitoria ? "Missão cumprida!" : "Missão falhou"}
            </h2>
            <p className="text-sm text-slate-300">{resultado.motivo}</p>
            <Estrelas n={resultado.estrelas} tamanho="size-10" />
            <p className="flex items-center gap-1 text-2xl font-black tabular-nums text-amber-300">
              <Trophy className="size-6" /> {resultado.pontos.toLocaleString("pt-BR")} pontos
            </p>
            <ul className="text-xs text-slate-400">
              {resultado.detalhes.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <div className="mt-1 grid w-full gap-2">
              <button
                type="button"
                onClick={() => iniciar(missaoSel)}
                className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-amber-300 to-orange-500 font-black uppercase italic text-amber-950"
              >
                <RotateCcw className="size-5" /> Jogar de novo
              </button>
              <button
                type="button"
                onClick={() => setTela("missoes")}
                className="h-11 cursor-pointer rounded-xl border border-white/25 text-sm font-semibold hover:bg-white/10"
              >
                Escolher outra missão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Mapa que evita erro de "variável não usada" para tipos importados só para documentação. */
export type { MissaoId };
void Star;
void useMemo;
