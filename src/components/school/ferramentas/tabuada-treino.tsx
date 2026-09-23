import { Lightbulb, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Dicas                                                               */
/* ------------------------------------------------------------------ */

const TRUQUES: Record<number, string[]> = {
  1: ["Qualquer número vezes 1 fica igual: 1 grupo de 7 é 7."],
  2: ["É o dobro: 2 × 6 é 6 + 6.", "O resultado é sempre par: termina em 0, 2, 4, 6 ou 8."],
  3: [
    "É o dobro mais um grupo: 3 × 4 = (2 × 4) + 4 = 12.",
    "Some os números do resultado: 3, 6, 9, 12 (1+2=3), 15 (1+5=6)… sempre dá 3, 6 ou 9.",
  ],
  4: ["É o dobro do dobro: 4 × 6 → dobro de 6 é 12, dobro de 12 é 24."],
  5: [
    "O resultado termina sempre em 0 ou 5.",
    "Metade do número vezes 10: 5 × 8 → metade de 8 é 4, então 40.",
  ],
  6: [
    "É a tabuada do 5 mais um grupo: 6 × 7 = (5 × 7) + 7 = 35 + 7 = 42.",
    "O resultado é sempre par.",
  ],
  7: [
    "Quebre em partes: 7 × 6 = (5 × 6) + (2 × 6) = 30 + 12 = 42.",
    "Se já sabe a tabuada do 7 até 5 vezes, o resto já veio das outras (6 × 7 = 7 × 6).",
  ],
  8: [
    "É o dobro da tabuada do 4: 8 × 6 → 4 × 6 = 24, dobro é 48.",
    "Os resultados do 8 descem no fim: 8, 16, 24, 32, 40… (as unidades: 8, 6, 4, 2, 0).",
  ],
  9: [
    "Truque dos dedos: abaixe o dedo da conta; os dedos à esquerda são as dezenas e à direita as unidades.",
    "A soma dos números do resultado dá sempre 9: 9 × 4 = 36 (3 + 6 = 9).",
    "É 10 vezes menos um grupo: 9 × 7 = 70 − 7 = 63.",
  ],
  10: ["Acrescente um zero: 10 × 7 = 70."],
};

/** Uma dica sob medida para a conta a × b (a é a tabuada). */
export function dicaDaConta(a: number, b: number): string {
  const p = a * b;
  if (a === 1 || b === 1) return `Qualquer número vezes 1 fica igual: ${a} × ${b} = ${p}.`;
  if (a === 10 || b === 10) return `Vezes 10 é só acrescentar um zero: ${Math.min(a, b)} → ${p}.`;
  if (a === 2 || b === 2) {
    const n = a === 2 ? b : a;
    return `Vezes 2 é o dobro: ${n} + ${n} = ${p}.`;
  }
  if (a === 5 || b === 5) {
    const n = a === 5 ? b : a;
    return `Vezes 5 termina em 0 ou 5. Metade de ${n} é ${n / 2}, então ${n} × 5 = ${p}.`;
  }
  if (a === 9 || b === 9) {
    const n = a === 9 ? b : a;
    return `Vezes 9 é vezes 10 menos um grupo: ${n} × 10 = ${n * 10}, menos ${n} = ${p}.`;
  }
  if (a === 4 || b === 4) {
    const n = a === 4 ? b : a;
    return `Vezes 4 é o dobro do dobro: dobro de ${n} é ${n * 2}, dobro de ${n * 2} é ${p}.`;
  }
  const maior = Math.max(a, b);
  const menor = Math.min(a, b);
  return `Divida em partes: ${menor} × ${maior} = (${menor} × ${maior - 1}) + ${menor} = ${menor * (maior - 1)} + ${menor} = ${p}.`;
}

const CORES = [
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#64748b",
];

/* ------------------------------------------------------------------ */
/* 1. Tabuada ilustrada                                                */
/* ------------------------------------------------------------------ */

function GradeDeBolinhas({
  linhas,
  colunas,
  cor,
}: {
  linhas: number;
  colunas: number;
  cor: string;
}) {
  const passo = 22;
  const largura = colunas * passo + 8;
  const altura = linhas * passo + 8;
  return (
    <svg
      viewBox={`0 0 ${largura} ${altura}`}
      className="max-h-56 w-full max-w-[22rem]"
      role="img"
      aria-label={`${linhas} fileiras de ${colunas} bolinhas`}
    >
      {Array.from({ length: linhas }, (_, l) =>
        Array.from({ length: colunas }, (_, c) => (
          <circle
            key={`${l}-${c}`}
            cx={4 + c * passo + passo / 2}
            cy={4 + l * passo + passo / 2}
            r={8}
            fill={cor}
            opacity={l % 2 === 0 ? 1 : 0.65}
          />
        )),
      )}
    </svg>
  );
}

export function TabuadaIlustrada() {
  const [n, setN] = useState(7);
  const [k, setK] = useState(6);
  const cor = CORES[(n - 1) % CORES.length]!;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-semibold text-foreground">Escolha a tabuada</p>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={v === n}
              onClick={() => setN(v)}
              style={
                v === n
                  ? { backgroundColor: CORES[(v - 1) % CORES.length] }
                  : { borderColor: CORES[(v - 1) % CORES.length] }
              }
              className={cn(
                "size-11 cursor-pointer rounded-xl border-2 text-lg font-bold transition-transform hover:scale-105",
                v === n ? "border-transparent text-white" : "text-foreground",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
        <ul className="grid grid-cols-2 gap-1.5 md:grid-cols-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
            <li key={v}>
              <button
                type="button"
                aria-pressed={v === k}
                onClick={() => setK(v)}
                style={v === k ? { backgroundColor: cor } : { borderColor: cor }}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between rounded-lg border-2 px-3 py-1.5 text-left text-base font-semibold",
                  v === k ? "border-transparent text-white" : "text-foreground",
                )}
              >
                <span>
                  {n} × {v}
                </span>
                <span>= {n * v}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-3">
          <p className="text-2xl font-bold text-foreground">
            {n} × {k} = <span style={{ color: cor }}>{n * k}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {k} {k === 1 ? "fileira" : "fileiras"} com {n} {n === 1 ? "bolinha" : "bolinhas"} em
            cada uma.
          </p>
          <GradeDeBolinhas linhas={k} colunas={n} cor={cor} />
          <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-foreground">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
            {dicaDaConta(n, k)}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border-2 p-4" style={{ borderColor: cor }}>
        <p className="mb-2 text-sm font-semibold text-foreground">Truques da tabuada do {n}</p>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-foreground">
          {(TRUQUES[n] ?? []).map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Complete a conta                                                 */
/* ------------------------------------------------------------------ */

type Modo = "resultado" | "fator" | "divisao" | "misto";

interface Questao {
  texto: string;
  resposta: number;
  a: number;
  b: number;
}

const TOTAL = 10;

function sorteio(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gerarQuestoes(tabuada: number | "todas", modo: Modo): Questao[] {
  return Array.from({ length: TOTAL }, () => {
    const a = tabuada === "todas" ? sorteio(2, 10) : tabuada;
    const b = sorteio(1, 10);
    const escolhido: Exclude<Modo, "misto"> =
      modo === "misto" ? (["resultado", "fator", "divisao"] as const)[sorteio(0, 2)]! : modo;
    if (escolhido === "resultado") return { texto: `${a} × ${b} = ?`, resposta: a * b, a, b };
    if (escolhido === "fator") return { texto: `${a} × ? = ${a * b}`, resposta: b, a, b };
    return { texto: `${a * b} ÷ ${a} = ?`, resposta: b, a, b };
  });
}

const MODOS: { id: Modo; nome: string }[] = [
  { id: "resultado", nome: "Qual é o resultado?" },
  { id: "fator", nome: "Qual número falta?" },
  { id: "divisao", nome: "Divisão (a volta)" },
  { id: "misto", nome: "Tudo misturado" },
];

export function CompletarTabuada() {
  const [tabuada, setTabuada] = useState<number | "todas">("todas");
  const [modo, setModo] = useState<Modo>("resultado");
  const [questoes, setQuestoes] = useState(() => gerarQuestoes("todas", "resultado"));
  const [i, setI] = useState(0);
  const [valor, setValor] = useState("");
  const [tentativas, setTentativas] = useState(0);
  const [status, setStatus] = useState<"perguntando" | "acertou" | "revelou">("perguntando");
  const [acertosDeUmaVez, setAcertosDeUmaVez] = useState(0);
  const [erradas, setErradas] = useState<Questao[]>([]);
  const [fim, setFim] = useState(false);
  const campo = useRef<HTMLInputElement>(null);

  const q = questoes[i]!;

  useEffect(() => {
    campo.current?.focus();
  }, [i, status]);

  function reiniciar(t: number | "todas", m: Modo, lista?: Questao[]) {
    setTabuada(t);
    setModo(m);
    setQuestoes(lista ?? gerarQuestoes(t, m));
    setI(0);
    setValor("");
    setTentativas(0);
    setStatus("perguntando");
    setAcertosDeUmaVez(0);
    setErradas([]);
    setFim(false);
  }

  function conferir() {
    if (valor === "" || status !== "perguntando") return;
    if (Number(valor) === q.resposta) {
      setStatus("acertou");
      if (tentativas === 0) setAcertosDeUmaVez((v) => v + 1);
      return;
    }
    const t = tentativas + 1;
    setTentativas(t);
    setValor("");
    if (t >= 2) {
      setStatus("revelou");
      setErradas((e) => [...e, q]);
    }
  }

  function seguir() {
    if (i + 1 >= questoes.length) {
      setFim(true);
      return;
    }
    setI(i + 1);
    setValor("");
    setTentativas(0);
    setStatus("perguntando");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-sm text-muted-foreground">
          Tabuada
          <select
            value={String(tabuada)}
            onChange={(e) =>
              reiniciar(e.target.value === "todas" ? "todas" : Number(e.target.value), modo)
            }
            className="h-11 rounded-lg border-2 border-border bg-background px-3 text-base text-foreground"
          >
            <option value="todas">Todas</option>
            {Array.from({ length: 9 }, (_, x) => x + 2).map((v) => (
              <option key={v} value={v}>
                Do {v}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted-foreground">
          Tipo de exercício
          <select
            value={modo}
            onChange={(e) => reiniciar(tabuada, e.target.value as Modo)}
            className="h-11 rounded-lg border-2 border-border bg-background px-3 text-base text-foreground"
          >
            {MODOS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      {fim ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/10 p-6 text-center">
          <p className="text-3xl font-bold text-foreground">
            {acertosDeUmaVez} de {questoes.length} de primeira
          </p>
          <p className="text-base text-muted-foreground">
            {acertosDeUmaVez >= 9
              ? "Fantástico! Você sabe a tabuada de cabeça."
              : acertosDeUmaVez >= 6
                ? "Muito bem! Mais uma rodada e você domina."
                : "Continue treinando: use as dicas e a Tabuada ilustrada."}
          </p>
          {erradas.length > 0 && (
            <div className="text-sm text-foreground">
              <p className="font-semibold">Para rever:</p>
              <p>{erradas.map((e) => `${e.a} × ${e.b} = ${e.a * e.b}`).join("   ·   ")}</p>
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            <Button className="cursor-pointer" onClick={() => reiniciar(tabuada, modo)}>
              <RotateCcw className="size-4" /> Nova rodada
            </Button>
            {erradas.length > 0 && (
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => reiniciar(tabuada, modo, [...erradas])}
              >
                Treinar só as que errei
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-indigo-500/40 bg-background/80 p-5">
          <p className="text-sm text-muted-foreground">
            Pergunta {i + 1} de {questoes.length}
          </p>
          <p className="text-center text-5xl font-bold tracking-tight text-foreground">{q.texto}</p>
          <div className="flex justify-center gap-2">
            <input
              ref={campo}
              type="number"
              inputMode="numeric"
              value={valor}
              disabled={status !== "perguntando"}
              onChange={(e) => setValor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (status === "perguntando") conferir();
                  else seguir();
                }
              }}
              aria-label="Sua resposta"
              className="h-14 w-32 rounded-xl border-2 border-indigo-500/60 bg-background text-center text-3xl font-bold text-foreground"
            />
            {status === "perguntando" ? (
              <Button className="h-14 cursor-pointer px-6 text-lg" onClick={conferir}>
                Conferir
              </Button>
            ) : (
              <Button className="h-14 cursor-pointer px-6 text-lg" onClick={seguir}>
                Próxima
              </Button>
            )}
          </div>

          {status === "acertou" && (
            <p className="text-center text-lg font-semibold text-emerald-600 dark:text-emerald-400">
              {tentativas === 0 ? "Isso mesmo!" : "Acertou! Da próxima é de primeira."}
            </p>
          )}
          {status === "perguntando" && tentativas > 0 && (
            <p className="text-center text-base font-medium text-destructive">
              Quase! Tente de novo com esta dica:
            </p>
          )}
          {status === "revelou" && (
            <p className="text-center text-lg font-semibold text-destructive">
              A resposta é {q.resposta}. Guarde: {q.a} × {q.b} = {q.a * q.b}.
            </p>
          )}
          {(tentativas > 0 || status === "revelou") && (
            <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-foreground">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
              {dicaDaConta(q.a, q.b)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Memória da tabuada                                               */
/* ------------------------------------------------------------------ */

interface Carta {
  id: number;
  par: number;
  rotulo: string;
  tipo: "conta" | "resultado";
}

function montarCartas(tabuada: number | "todas"): Carta[] {
  const usados = new Set<number>();
  const contas: { a: number; b: number }[] = [];
  while (contas.length < 6) {
    const a = tabuada === "todas" ? sorteio(2, 10) : tabuada;
    const b = sorteio(2, 10);
    const p = a * b;
    if (usados.has(p)) continue;
    usados.add(p);
    contas.push({ a, b });
  }
  const cartas: Carta[] = contas.flatMap(({ a, b }, idx) => [
    { id: idx * 2, par: idx, rotulo: `${a} × ${b}`, tipo: "conta" as const },
    { id: idx * 2 + 1, par: idx, rotulo: String(a * b), tipo: "resultado" as const },
  ]);
  for (let x = cartas.length - 1; x > 0; x--) {
    const y = Math.floor(Math.random() * (x + 1));
    [cartas[x], cartas[y]] = [cartas[y]!, cartas[x]!];
  }
  return cartas;
}

export function MemoriaTabuada() {
  const [tabuada, setTabuada] = useState<number | "todas">("todas");
  const [cartas, setCartas] = useState(() => montarCartas("todas"));
  const [viradas, setViradas] = useState<number[]>([]);
  const [achadas, setAchadas] = useState<number[]>([]);
  const [jogadas, setJogadas] = useState(0);

  const terminou = achadas.length === cartas.length / 2;

  useEffect(() => {
    if (viradas.length !== 2) return;
    const [x, y] = viradas as [number, number];
    const cx = cartas.find((c) => c.id === x)!;
    const cy = cartas.find((c) => c.id === y)!;
    setJogadas((j) => j + 1);
    const t = window.setTimeout(
      () => {
        if (cx.par === cy.par) setAchadas((a) => [...a, cx.par]);
        setViradas([]);
      },
      cx.par === cy.par ? 500 : 1000,
    );
    return () => window.clearTimeout(t);
  }, [viradas, cartas]);

  function reiniciar(t: number | "todas") {
    setTabuada(t);
    setCartas(montarCartas(t));
    setViradas([]);
    setAchadas([]);
    setJogadas(0);
  }

  function virar(c: Carta) {
    if (viradas.length >= 2 || viradas.includes(c.id) || achadas.includes(c.par)) return;
    setViradas((v) => [...v, c.id]);
  }

  const viradasCartas = useMemo(
    () => viradas.map((id) => cartas.find((c) => c.id === id)!),
    [viradas, cartas],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm text-muted-foreground">
          Tabuada
          <select
            value={String(tabuada)}
            onChange={(e) =>
              reiniciar(e.target.value === "todas" ? "todas" : Number(e.target.value))
            }
            className="h-11 rounded-lg border-2 border-border bg-background px-3 text-base text-foreground"
          >
            <option value="todas">Todas</option>
            {Array.from({ length: 9 }, (_, x) => x + 2).map((v) => (
              <option key={v} value={v}>
                Do {v}
              </option>
            ))}
          </select>
        </label>
        <p className="text-base text-foreground">
          Jogadas: <b>{jogadas}</b> · Pares: <b>{achadas.length}</b>/{cartas.length / 2}
        </p>
        <Button variant="outline" className="cursor-pointer" onClick={() => reiniciar(tabuada)}>
          <RotateCcw className="size-4" /> Embaralhar
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Vire duas cartas: uma tem a conta e a outra, o resultado. Encontre todos os pares.
      </p>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {cartas.map((c) => {
          const aberta = viradas.includes(c.id) || achadas.includes(c.par);
          const cor = CORES[c.par % CORES.length]!;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => virar(c)}
              aria-label={aberta ? c.rotulo : "Carta virada para baixo"}
              style={aberta ? { backgroundColor: cor } : undefined}
              className={cn(
                "flex h-20 cursor-pointer items-center justify-center rounded-xl border-2 text-2xl font-bold transition-transform hover:scale-105",
                aberta
                  ? "border-transparent text-white"
                  : "border-indigo-500/50 bg-indigo-500/10 text-indigo-500",
              )}
            >
              {aberta ? c.rotulo : "?"}
            </button>
          );
        })}
      </div>

      {viradasCartas.length === 2 && viradasCartas[0]!.par !== viradasCartas[1]!.par && (
        <p className="text-base font-medium text-destructive">
          Não é par desta vez. Memorize onde cada uma está!
        </p>
      )}
      {terminou && (
        <p className="rounded-xl bg-emerald-500/10 p-4 text-center text-lg font-semibold text-emerald-700 dark:text-emerald-300">
          Você achou todos os pares em {jogadas} jogadas! Quanto menos jogadas, melhor a memória.
        </p>
      )}
    </div>
  );
}
