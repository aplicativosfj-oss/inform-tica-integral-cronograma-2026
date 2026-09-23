import { Flame, Loader2, Play, RotateCcw, Trophy } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { BancadaCalculo } from "@/components/school/ferramentas/bancada-calculo";
import { Seletor } from "@/components/school/ferramentas/controles";
import { Button } from "@/components/ui/button";
import { lerAlunoSessao } from "@/lib/aluno-session";
import { fetchRanking, salvarPlacar, type Placar } from "@/lib/placares";
import { SEED_TURMAS } from "@/lib/seed-data";
import { cn } from "@/lib/utils";

/**
 * Desafio das 4 operações: uma partida de 12 perguntas contra o relógio, com
 * seis níveis que vão da soma com dezena até a conta mista com parênteses.
 *
 * As perguntas não são uma lista pronta — são sorteadas dentro das faixas de
 * cada nível, o que dá dezenas de milhares de contas diferentes. Duas regras
 * valem sempre: subtração nunca dá número negativo e divisão é sempre exata,
 * porque o objetivo é treinar o cálculo e não a conta com resto.
 *
 * A pontuação premia acertar rápido e emendar acertos (o combo), e o placar
 * final vai para o ranking da escola (ver `src/lib/placares.ts`).
 */

const JOGO = "4-operacoes";
const PERGUNTAS = 12;

type Op = "+" | "−" | "×" | "÷";

interface Nivel {
  id: string;
  nome: string;
  descricao: string;
  ops: Op[];
  /** Segundos para responder cada pergunta. */
  tempo: number;
  /** Faixa dos números, por operação. */
  faixa: { min: number; max: number };
}

export const NIVEIS: Nivel[] = [
  {
    id: "1",
    nome: "Nível 1 · Começando",
    descricao: "Somar e subtrair até 20",
    ops: ["+", "−"],
    tempo: 15,
    faixa: { min: 1, max: 20 },
  },
  {
    id: "2",
    nome: "Nível 2 · Pegando o jeito",
    descricao: "Somar e subtrair até 100",
    ops: ["+", "−"],
    tempo: 13,
    faixa: { min: 5, max: 100 },
  },
  {
    id: "3",
    nome: "Nível 3 · Tabuada",
    descricao: "Multiplicar e dividir até a tabuada do 10",
    ops: ["×", "÷"],
    tempo: 12,
    faixa: { min: 2, max: 10 },
  },
  {
    id: "4",
    nome: "Nível 4 · As quatro juntas",
    descricao: "As quatro operações misturadas",
    ops: ["+", "−", "×", "÷"],
    tempo: 11,
    faixa: { min: 2, max: 12 },
  },
  {
    id: "5",
    nome: "Nível 5 · Números grandes",
    descricao: "Contas até 500 e tabuada até 12",
    ops: ["+", "−", "×", "÷"],
    tempo: 10,
    faixa: { min: 10, max: 500 },
  },
  {
    id: "6",
    nome: "Nível 6 · Relâmpago",
    descricao: "Tudo junto, com pouco tempo",
    ops: ["+", "−", "×", "÷"],
    tempo: 7,
    faixa: { min: 10, max: 500 },
  },
];

interface Pergunta {
  a: number;
  b: number;
  op: Op;
  resposta: number;
  opcoes: number[];
}

function sorteio(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function embaralhar<T>(lista: T[]): T[] {
  const c = [...lista];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j]!, c[i]!];
  }
  return c;
}

/**
 * Os três erros que aparecem junto da resposta certa são "erros de verdade":
 * o número vizinho, o resultado da operação trocada, a ordem invertida. Erro
 * sorteado ao acaso seria fácil demais de descartar no olho.
 */
function opcoesPara(certa: number, op: Op, a: number, b: number): number[] {
  const candidatos = new Set<number>();
  const tenta = (v: number) => {
    if (Number.isInteger(v) && v >= 0 && v !== certa) candidatos.add(v);
  };
  if (op === "+") {
    tenta(a + b + 1);
    tenta(a + b - 1);
    tenta(a - b);
    tenta(a + b + 10);
  } else if (op === "−") {
    tenta(a - b + 1);
    tenta(a - b - 1);
    tenta(a + b);
    tenta(b - a);
  } else if (op === "×") {
    tenta(a * b + a);
    tenta(a * b - a);
    tenta(a * b + b);
    tenta(a + b);
  } else {
    tenta(certa + 1);
    tenta(certa - 1);
    tenta(a - b);
    tenta(certa * 2);
  }
  // Rede de segurança: se as regras acima não deram três, completa perto.
  let d = 2;
  while (candidatos.size < 3 && d < 40) {
    tenta(certa + d);
    tenta(certa - d);
    d++;
  }
  return embaralhar([certa, ...[...candidatos].slice(0, 3)]);
}

export function gerarPergunta(nivel: Nivel): Pergunta {
  const op = nivel.ops[sorteio(0, nivel.ops.length - 1)]!;
  const { min, max } = nivel.faixa;
  let a: number;
  let b: number;
  let resposta: number;

  if (op === "+") {
    a = sorteio(min, max);
    b = sorteio(min, max);
    resposta = a + b;
  } else if (op === "−") {
    // O maior vai na frente: subtração aqui nunca dá negativo.
    const x = sorteio(min, max);
    const y = sorteio(min, max);
    a = Math.max(x, y);
    b = Math.min(x, y);
    resposta = a - b;
  } else if (op === "×") {
    // Nas faixas grandes, um dos fatores continua pequeno: senão viraria
    // conta de papel, não de cabeça.
    a = max > 100 ? sorteio(2, 20) : sorteio(Math.min(min, 12), Math.min(max, 12));
    b = sorteio(2, max > 100 ? 12 : Math.min(max, 12));
    resposta = a * b;
  } else {
    // Monta a divisão a partir da multiplicação: assim ela é sempre exata.
    b = sorteio(2, max > 100 ? 12 : Math.min(max, 12));
    resposta = sorteio(2, max > 100 ? 20 : Math.min(max, 12));
    a = b * resposta;
  }

  return { a, b, op, resposta, opcoes: opcoesPara(resposta, op, a, b) };
}

/** Relógio em anel: o arco vai sumindo e muda de cor quando aperta. */
function Relogio({ restante, total }: { restante: number; total: number }) {
  const R = 30;
  const circ = 2 * Math.PI * R;
  const fracao = Math.max(0, Math.min(1, restante / total));
  const cor = fracao > 0.5 ? "var(--color-primary)" : fracao > 0.25 ? "#e69500" : "#dc2626";
  return (
    <svg
      viewBox="0 0 76 76"
      className="size-[76px] shrink-0"
      role="img"
      aria-label={`${Math.ceil(restante)} segundos`}
    >
      <circle cx={38} cy={38} r={R} fill="none" stroke="var(--color-muted)" strokeWidth={7} />
      <circle
        cx={38}
        cy={38}
        r={R}
        fill="none"
        stroke={cor}
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - fracao)}
        transform="rotate(-90 38 38)"
        style={{ transition: "stroke-dashoffset .1s linear, stroke .3s" }}
      />
      <text x={38} y={45} textAnchor="middle" className="fill-foreground text-[22px] font-bold">
        {Math.ceil(restante)}
      </text>
    </svg>
  );
}

/** Medalha do fim de partida: ouro, prata ou bronze conforme os acertos. */
function Medalha({ acertos, total }: { acertos: number; total: number }) {
  const p = acertos / total;
  const cor = p >= 0.9 ? "#eab308" : p >= 0.7 ? "#94a3b8" : "#b45309";
  const nome = p >= 0.9 ? "Ouro" : p >= 0.7 ? "Prata" : "Bronze";
  return (
    <svg
      viewBox="0 0 120 130"
      className="size-[110px]"
      role="img"
      aria-label={`Medalha de ${nome}`}
    >
      <path d="M38 6 L54 6 L70 48 L48 56 Z" fill="var(--color-primary)" opacity={0.65} />
      <path d="M82 6 L66 6 L50 48 L72 56 Z" fill="var(--color-primary)" opacity={0.4} />
      <circle cx={60} cy={86} r={36} fill={cor} />
      <circle cx={60} cy={86} r={28} fill="none" stroke="#ffffff" strokeWidth={2} opacity={0.5} />
      <text x={60} y={95} textAnchor="middle" className="text-[26px] font-bold" fill="#ffffff">
        {acertos}
      </text>
      <text
        x={60}
        y={128}
        textAnchor="middle"
        className="fill-muted-foreground text-[12px] font-semibold"
      >
        {nome}
      </text>
    </svg>
  );
}

type Fase = "escolha" | "jogando" | "fim";

type FiltroOp = "todas" | Op;

const FILTROS: { id: FiltroOp; nome: string; cor: string }[] = [
  { id: "todas", nome: "Como o nível pede", cor: "#6366f1" },
  { id: "+", nome: "➕ Só soma", cor: "#10b981" },
  { id: "−", nome: "➖ Só subtração", cor: "#f97316" },
  { id: "×", nome: "✖️ Só multiplicação", cor: "#a855f7" },
  { id: "÷", nome: "➗ Só divisão", cor: "#0ea5e9" },
];

const NOME_OP: Record<Op, string> = {
  "+": "soma",
  "−": "subtração",
  "×": "multiplicação",
  "÷": "divisão",
};

export function JogoOperacoes() {
  const [fase, setFase] = useState<Fase>("escolha");
  const [filtro, setFiltro] = useState<FiltroOp>("todas");
  const [nivel, setNivel] = useState<Nivel>(NIVEIS[0]!);
  const [pergunta, setPergunta] = useState<Pergunta | null>(null);
  const [indice, setIndice] = useState(0);
  const [pontos, setPontos] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [combo, setCombo] = useState(0);
  const [melhorCombo, setMelhorCombo] = useState(0);
  const [restante, setRestante] = useState(0);
  const [escolhida, setEscolhida] = useState<number | null>(null);
  const [segundosTotais, setSegundosTotais] = useState(0);

  const sessao = useMemo(() => lerAlunoSessao(), []);
  const [nome, setNome] = useState(sessao?.nome.split(" ")[0] ?? "");
  const [turma, setTurma] = useState(() => {
    const t = SEED_TURMAS.find((x) => x.id === sessao?.turmaId);
    return t ? `${t.serie.replace(" Ano", "")} ${t.letra}` : "";
  });
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [ranking, setRanking] = useState<Placar[] | null>(null);
  const [rankingLocal, setRankingLocal] = useState(false);

  const inicioRef = useRef(0);

  const proxima = useCallback((n: Nivel) => {
    setPergunta(gerarPergunta(n));
    setEscolhida(null);
    setRestante(n.tempo);
  }, []);

  function comecar(base: Nivel) {
    // Escolher uma operação treina só ela, na faixa de números do nível.
    const n: Nivel =
      filtro === "todas"
        ? base
        : {
            ...base,
            ops: [filtro],
            nome: `${base.nome} · só ${NOME_OP[filtro]}`,
          };
    setNivel(n);
    setFase("jogando");
    setIndice(0);
    setPontos(0);
    setAcertos(0);
    setCombo(0);
    setMelhorCombo(0);
    setSalvo(false);
    setRanking(null);
    inicioRef.current = Date.now();
    proxima(n);
  }

  const avancar = useCallback(() => {
    setIndice((i) => {
      const prox = i + 1;
      if (prox >= PERGUNTAS) {
        setSegundosTotais(Math.round((Date.now() - inicioRef.current) / 1000));
        setFase("fim");
        return i;
      }
      proxima(nivel);
      return prox;
    });
  }, [nivel, proxima]);

  // Relógio da pergunta. Deixar o tempo acabar conta como erro e zera o combo.
  useEffect(() => {
    if (fase !== "jogando" || escolhida !== null) return;
    const t = window.setInterval(() => {
      setRestante((r) => {
        if (r <= 0.1) {
          window.clearInterval(t);
          setCombo(0);
          setEscolhida(-1);
          window.setTimeout(avancar, 1100);
          return 0;
        }
        return r - 0.1;
      });
    }, 100);
    return () => window.clearInterval(t);
  }, [fase, escolhida, avancar]);

  function responder(v: number) {
    if (escolhida !== null || !pergunta) return;
    setEscolhida(v);
    if (v === pergunta.resposta) {
      // Ponto = base do nível + o que sobrou do relógio + bônus do combo.
      const base = 10 * Number(nivel.id);
      const bonusTempo = Math.round(restante * 2);
      const bonusCombo = combo * 5;
      setPontos((p) => p + base + bonusTempo + bonusCombo);
      setAcertos((a) => a + 1);
      setCombo((c) => {
        const novo = c + 1;
        setMelhorCombo((m) => Math.max(m, novo));
        return novo;
      });
    } else {
      setCombo(0);
    }
    window.setTimeout(avancar, 900);
  }

  async function enviarPlacar() {
    if (!nome.trim()) return;
    setSalvando(true);
    await salvarPlacar({
      jogo: JOGO,
      aluno: nome.trim().slice(0, 40),
      turma,
      pontos,
      acertos,
      total: PERGUNTAS,
      nivel: nivel.nome,
      segundos: segundosTotais,
    });
    setSalvo(true);
    await verRanking();
    setSalvando(false);
  }

  async function verRanking(apenasTurma = false) {
    const r = await fetchRanking(JOGO, apenasTurma && turma ? turma : undefined);
    setRanking(r.placares);
    setRankingLocal(r.somenteLocal);
  }

  /* ----------------------------- telas ----------------------------- */

  if (fase === "escolha") {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Escolha o nível</h3>
          <p className="text-xs text-muted-foreground">
            São {PERGUNTAS} perguntas por partida. Acertar rápido e emendar acertos vale mais
            pontos.
          </p>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold text-foreground">
            Qual operação você quer treinar?
          </p>
          <div className="flex flex-wrap gap-1.5">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filtro === f.id}
                onClick={() => setFiltro(f.id)}
                style={filtro === f.id ? { backgroundColor: f.cor } : { borderColor: f.cor }}
                className={cn(
                  "cursor-pointer rounded-full border-2 px-3 py-1 text-xs font-semibold transition-transform hover:scale-105",
                  filtro === f.id ? "border-transparent text-white" : "text-foreground",
                )}
              >
                {f.nome}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {NIVEIS.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => comecar(n)}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background p-3 text-left transition-colors hover:border-primary/60 hover:bg-primary/5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                {n.id}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">{n.nome}</span>
                <span className="block text-xs text-muted-foreground">
                  {filtro === "todas"
                    ? n.descricao
                    : `Só ${NOME_OP[filtro]}, com os números deste nível`}
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{n.tempo}s</span>
              <Play className="size-4 shrink-0 text-primary" />
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer self-center"
          onClick={() => {
            setFase("fim");
            setIndice(PERGUNTAS);
            void verRanking();
          }}
        >
          <Trophy className="size-4" /> Ver o ranking da escola
        </Button>
      </div>
    );
  }

  if (fase === "jogando" && pergunta) {
    const errou = escolhida !== null && escolhida !== pergunta.resposta;
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Relogio restante={restante} total={nivel.tempo} />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">
              Pergunta {indice + 1} de {PERGUNTAS} · {nivel.nome}
            </p>
            <p className="text-xl font-bold text-foreground">{pontos} pontos</p>
            {combo >= 2 && (
              <p className="flex items-center gap-1 text-xs font-semibold text-orange-500">
                <Flame className="size-3.5" /> {combo} seguidas! +{combo * 5} por acerto
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-muted/50 py-3 text-center">
          <p className="text-4xl font-bold tracking-tight text-foreground">
            {pergunta.a} {pergunta.op} {pergunta.b}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {pergunta.opcoes.map((o) => {
            const certa = o === pergunta.resposta;
            const marcada = escolhida === o;
            return (
              <button
                key={o}
                type="button"
                onClick={() => responder(o)}
                disabled={escolhida !== null}
                className={cn(
                  "h-14 cursor-pointer rounded-xl border-2 text-xl font-bold transition-colors",
                  escolhida === null
                    ? "border-border bg-background text-foreground hover:border-primary hover:bg-primary/5"
                    : certa
                      ? "border-emerald-600 bg-emerald-600/15 text-emerald-700 dark:text-emerald-300"
                      : marcada
                        ? "border-destructive bg-destructive/10 text-destructive"
                        : "border-border bg-background text-muted-foreground opacity-60",
                )}
              >
                {o}
              </button>
            );
          })}
        </div>

        {/* Apoio para quem ainda não faz de cabeça — com os números da conta. */}
        <BancadaCalculo
          numeros={[pergunta.a, pergunta.b]}
          operacao={
            pergunta.op === "×" ? "multiplicacao" : pergunta.op === "÷" ? "divisao" : "soma"
          }
        />

        <p className="h-4 text-center text-xs font-medium">
          {escolhida === null ? (
            <span className="text-muted-foreground">Toque na resposta certa.</span>
          ) : escolhida === -1 ? (
            <span className="text-destructive">O tempo acabou! Era {pergunta.resposta}.</span>
          ) : errou ? (
            <span className="text-destructive">Era {pergunta.resposta}.</span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400">Isso!</span>
          )}
        </p>
      </div>
    );
  }

  /* fim de partida / ranking */
  const jogou = indice < PERGUNTAS || acertos > 0;
  return (
    <div className="flex flex-col gap-4">
      {jogou && (
        <>
          <div className="flex items-center gap-3">
            <Medalha acertos={acertos} total={PERGUNTAS} />
            <div>
              <p className="text-3xl font-bold text-primary">{pontos}</p>
              <p className="text-xs text-muted-foreground">pontos</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {acertos} de {PERGUNTAS} certas · {segundosTotais}s · melhor sequência:{" "}
                {melhorCombo}
              </p>
            </div>
          </div>

          {!salvo ? (
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3">
              <p className="text-xs font-semibold text-foreground">Entrar no ranking da escola</p>
              <div className="flex flex-wrap gap-2">
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu primeiro nome"
                  aria-label="Seu primeiro nome"
                  maxLength={40}
                  className="h-9 min-w-[140px] flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                />
                <Seletor
                  valor={turma}
                  aoMudar={setTurma}
                  rotulo="Sua turma"
                  largura="w-[7rem]"
                  opcoes={SEED_TURMAS.map((t) => {
                    const r = `${t.serie.replace(" Ano", "")} ${t.letra}`;
                    return { valor: r, rotulo: r };
                  })}
                />
              </div>
              <Button
                size="sm"
                className="cursor-pointer"
                disabled={!nome.trim() || salvando}
                onClick={() => void enviarPlacar()}
              >
                {salvando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trophy className="size-4" />
                )}
                Salvar meu placar
              </Button>
            </div>
          ) : (
            <p className="rounded-xl bg-primary/10 p-2.5 text-center text-xs font-medium text-primary">
              Placar salvo! Veja onde você ficou.
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-2">
            <Button size="sm" className="cursor-pointer" onClick={() => comecar(nivel)}>
              <RotateCcw className="size-4" /> Jogar de novo
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => setFase("escolha")}
            >
              Trocar de nível
            </Button>
          </div>
        </>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Ranking</h3>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 cursor-pointer px-2 text-xs"
              onClick={() => void verRanking(false)}
            >
              Escola toda
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 cursor-pointer px-2 text-xs"
              disabled={!turma}
              onClick={() => void verRanking(true)}
            >
              Só a {turma || "minha turma"}
            </Button>
          </div>
        </div>

        {ranking === null ? (
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => void verRanking()}
          >
            <Trophy className="size-4" /> Carregar ranking
          </Button>
        ) : ranking.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
            Ninguém no ranking ainda. Jogue uma partida e seja o primeiro.
          </p>
        ) : (
          <ol className="flex flex-col gap-1">
            {ranking.map((r, i) => (
              <li
                key={`${r.aluno}-${r.criadoEm}`}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs",
                  i === 0 ? "border-amber-500/50 bg-amber-500/10" : "border-border bg-background",
                )}
              >
                <span className="w-5 shrink-0 text-center font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                  {r.aluno}
                  {r.turma && <span className="ml-1 text-muted-foreground">{r.turma}</span>}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {r.acertos}/{r.total}
                </span>
                <span className="w-12 shrink-0 text-right font-bold text-primary">{r.pontos}</span>
              </li>
            ))}
          </ol>
        )}

        {rankingLocal && ranking !== null && (
          <p className="text-[11px] text-muted-foreground">
            Mostrando só as partidas deste computador: o ranking da escola ainda não foi ligado no
            banco de dados.
          </p>
        )}
      </div>
    </div>
  );
}
