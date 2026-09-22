import { Equal, Minus, Plus } from "lucide-react";
import { useState } from "react";

import {
  Figura,
  REPRESENTACOES,
  type Representacao,
} from "@/components/school/ferramentas/figuras-fracao";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Três ferramentas de frações feitas para mexer, não para responder pergunta:
 * a criança escolhe os números, vê a pizza (ou o chocolate, ou a jarra) mudar
 * na hora e clica nas partes para pintar. O número vem da figura, e não o
 * contrário.
 *
 * - `FracaoNaMesa`: monta uma fração e vê quanto ela vale;
 * - `CompararFracoes`: duas frações lado a lado, com o sinal < > = ;
 * - `FracoesEquivalentes`: a mesma quantidade escrita de vários jeitos.
 */

const MAX_PARTES = 12;

function mdc(a: number, b: number): number {
  return b === 0 ? a : mdc(b, a % b);
}

function simplificar(n: number, d: number): [number, number] {
  const g = mdc(n, d) || 1;
  return [n / g, d / g];
}

function porcento(n: number, d: number): string {
  return `${Math.round((n / d) * 1000) / 10}`.replace(".", ",");
}

function decimal(n: number, d: number): string {
  return (Math.round((n / d) * 100) / 100).toLocaleString("pt-BR");
}

/** Fração escrita do jeito da escola: numerador em cima, traço, denominador embaixo. */
function FracaoEscrita({ n, d, grande = false }: { n: number; d: number; grande?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex flex-col items-center leading-none",
        grande ? "text-2xl" : "text-base",
      )}
    >
      <span className="font-bold text-foreground">{n}</span>
      <span className="my-0.5 h-px w-full min-w-[1.2em] bg-foreground" />
      <span className="font-bold text-foreground">{d}</span>
    </span>
  );
}

/** Par de botões − / + com o número no meio, do tamanho do dedo de criança. */
function Contador({
  rotulo,
  valor,
  min,
  max,
  aoMudar,
}: {
  rotulo: string;
  valor: number;
  min: number;
  max: number;
  aoMudar: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-24 text-xs text-muted-foreground">{rotulo}</span>
      <Button
        variant="outline"
        size="icon"
        className="size-7 cursor-pointer"
        aria-label={`Diminuir ${rotulo}`}
        disabled={valor <= min}
        onClick={() => aoMudar(valor - 1)}
      >
        <Minus className="size-3.5" />
      </Button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={rotulo}
        value={valor}
        min={min}
        max={max}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) aoMudar(Math.min(Math.max(Math.round(v), min), max));
        }}
        className="h-7 w-12 rounded-md border border-border bg-background text-center text-sm font-semibold text-foreground"
      />
      <Button
        variant="outline"
        size="icon"
        className="size-7 cursor-pointer"
        aria-label={`Aumentar ${rotulo}`}
        disabled={valor >= max}
        onClick={() => aoMudar(valor + 1)}
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}

function EscolhaFigura({
  valor,
  aoMudar,
}: {
  valor: Representacao;
  aoMudar: (r: Representacao) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {REPRESENTACOES.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => aoMudar(r.id)}
          className={cn(
            "flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
            valor === r.id
              ? "border-primary bg-primary/10 font-medium text-primary"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          <span aria-hidden>{r.emoji}</span>
          {r.nome}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Montar uma fração                                                */
/* ------------------------------------------------------------------ */

export function FracaoNaMesa() {
  const [denominador, setDenominador] = useState(4);
  const [numerador, setNumerador] = useState(3);
  const [figura, setFigura] = useState<Representacao>("pizza");

  // O numerador nunca passa do denominador: aqui a criança está montando
  // partes de UM inteiro, e uma pizza com 5 de 4 pedaços só confundiria.
  function mudarDenominador(d: number) {
    setDenominador(d);
    if (numerador > d) setNumerador(d);
  }

  const [sn, sd] = simplificar(numerador, denominador);
  const simplificada = sd !== denominador && numerador > 0;
  const inteiro = numerador === denominador;

  return (
    <div className="flex flex-col gap-3">
      <EscolhaFigura valor={figura} aoMudar={setFigura} />

      <div className="flex min-h-[190px] items-center justify-center rounded-xl bg-muted/40 p-3">
        <Figura
          tipo={figura}
          total={denominador}
          pintadas={numerador}
          aoClicar={setNumerador}
          tamanho={figura === "chocolate" ? 280 : figura === "litros" ? 140 : 180}
        />
      </div>
      <p className="text-center text-[11px] text-muted-foreground">
        Clique nas partes da figura para pintar ou despintar.
      </p>

      <div className="flex flex-col gap-2">
        <Contador
          rotulo="Partes pintadas"
          valor={numerador}
          min={0}
          max={denominador}
          aoMudar={setNumerador}
        />
        <Contador
          rotulo="Partes ao todo"
          valor={denominador}
          min={1}
          max={MAX_PARTES}
          aoMudar={mudarDenominador}
        />
      </div>

      <div className="flex items-center justify-center gap-3 rounded-xl border border-border bg-background p-3">
        <FracaoEscrita n={numerador} d={denominador} grande />
        <div className="text-xs text-muted-foreground">
          <p>
            <b className="text-foreground">{porcento(numerador, denominador)}%</b> do inteiro
          </p>
          <p>
            em número: <b className="text-foreground">{decimal(numerador, denominador)}</b>
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {inteiro
          ? "Pintou tudo: isso é 1 inteiro."
          : numerador === 0
            ? "Nada pintado ainda: escolha quantas partes quer pintar."
            : simplificada
              ? `${numerador} de ${denominador} é o mesmo que ${sn}/${sd}.`
              : `${numerador} ${numerador === 1 ? "parte" : "partes"} de ${denominador} ${denominador === 1 ? "parte igual" : "partes iguais"}.`}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Comparar duas frações                                            */
/* ------------------------------------------------------------------ */

function LadoDaComparacao({
  titulo,
  n,
  d,
  figura,
  cor,
  aoMudarN,
  aoMudarD,
}: {
  titulo: string;
  n: number;
  d: number;
  figura: Representacao;
  cor: string;
  aoMudarN: (v: number) => void;
  aoMudarD: (v: number) => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-border bg-muted/30 p-2">
      <span className="text-[11px] font-medium text-muted-foreground">{titulo}</span>
      <Figura
        tipo={figura}
        total={d}
        pintadas={n}
        cor={cor}
        aoClicar={aoMudarN}
        tamanho={figura === "chocolate" ? 130 : figura === "litros" ? 90 : 116}
      />
      <FracaoEscrita n={n} d={d} />
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-6 cursor-pointer"
          aria-label={`Menos partes ao todo em ${titulo}`}
          disabled={d <= 1}
          onClick={() => {
            aoMudarD(d - 1);
            if (n > d - 1) aoMudarN(d - 1);
          }}
        >
          <Minus className="size-3" />
        </Button>
        <span className="text-[11px] text-muted-foreground">partes: {d}</span>
        <Button
          variant="outline"
          size="icon"
          className="size-6 cursor-pointer"
          aria-label={`Mais partes ao todo em ${titulo}`}
          disabled={d >= MAX_PARTES}
          onClick={() => aoMudarD(d + 1)}
        >
          <Plus className="size-3" />
        </Button>
      </div>
    </div>
  );
}

export function CompararFracoes() {
  const [n1, setN1] = useState(1);
  const [d1, setD1] = useState(2);
  const [n2, setN2] = useState(2);
  const [d2, setD2] = useState(5);
  const [figura, setFigura] = useState<Representacao>("chocolate");

  const v1 = n1 / d1;
  const v2 = n2 / d2;
  const sinal = v1 > v2 ? ">" : v1 < v2 ? "<" : "=";
  const comum = d1 * d2;

  return (
    <div className="flex flex-col gap-3">
      <EscolhaFigura valor={figura} aoMudar={setFigura} />

      <div className="flex items-stretch gap-2">
        <LadoDaComparacao
          titulo="Primeira"
          n={n1}
          d={d1}
          figura={figura}
          cor="#2f7d5c"
          aoMudarN={setN1}
          aoMudarD={setD1}
        />
        <div className="flex items-center">
          <span className="rounded-lg bg-primary/10 px-2 py-3 text-2xl font-bold text-primary">
            {sinal}
          </span>
        </div>
        <LadoDaComparacao
          titulo="Segunda"
          n={n2}
          d={d2}
          figura={figura}
          cor="#b1651f"
          aoMudarN={setN2}
          aoMudarD={setD2}
        />
      </div>

      <div className="rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground">
        {sinal === "=" ? (
          <p>
            As duas cobrem a mesma quantidade do inteiro:{" "}
            <b className="text-foreground">são frações equivalentes</b>.
          </p>
        ) : (
          <p>
            <b className="text-foreground">{sinal === ">" ? `${n1}/${d1}` : `${n2}/${d2}`}</b> é
            maior: cobre mais pedaço do inteiro ({porcento(Math.max(v1, v2) * comum, comum)}% contra{" "}
            {porcento(Math.min(v1, v2) * comum, comum)}%).
          </p>
        )}
        <p className="mt-1.5">
          {d1 === d2
            ? "Com o mesmo número de partes embaixo, ganha quem tem o número de cima maior."
            : "Quando as partes têm tamanhos diferentes, não dá para olhar só o número de cima: compare o tanto que cada figura cobre."}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[
          [1, 2, 2, 4],
          [1, 3, 1, 4],
          [3, 4, 2, 3],
          [2, 6, 1, 3],
        ].map(([a, b, c, e]) => (
          <Button
            key={`${a}-${b}-${c}-${e}`}
            variant="outline"
            size="sm"
            className="h-7 cursor-pointer px-2 text-xs"
            onClick={() => {
              setN1(a!);
              setD1(b!);
              setN2(c!);
              setD2(e!);
            }}
          >
            {a}/{b} e {c}/{e}
          </Button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Frações equivalentes                                             */
/* ------------------------------------------------------------------ */

export function FracoesEquivalentes() {
  const [n, setN] = useState(1);
  const [d, setD] = useState(2);
  const [figura, setFigura] = useState<Representacao>("pizza");

  // Só multiplicações que ainda cabem na figura sem virar picadinho.
  const fatores = [2, 3, 4].filter((f) => d * f <= MAX_PARTES * 2);

  function mudarD(novo: number) {
    setD(novo);
    if (n > novo) setN(novo);
  }

  return (
    <div className="flex flex-col gap-3">
      <EscolhaFigura valor={figura} aoMudar={setFigura} />

      <div className="flex flex-col gap-2">
        <Contador rotulo="Partes pintadas" valor={n} min={0} max={d} aoMudar={setN} />
        <Contador rotulo="Partes ao todo" valor={d} min={1} max={6} aoMudar={mudarD} />
      </div>

      <div className="flex flex-col gap-2">
        {[1, ...fatores].map((f) => (
          <div
            key={f}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-1.5",
              f === 1 ? "border-primary/50 bg-primary/5" : "border-border bg-muted/30",
            )}
          >
            <div className="flex w-[92px] shrink-0 justify-center">
              <Figura
                tipo={figura}
                total={d * f}
                pintadas={n * f}
                tamanho={figura === "chocolate" ? 92 : figura === "litros" ? 46 : 62}
              />
            </div>
            <FracaoEscrita n={n * f} d={d * f} />
            <p className="text-[11px] text-muted-foreground">
              {f === 1 ? (
                "a fração que você montou"
              ) : (
                <>
                  ×{f} em cima e embaixo:
                  <br />
                  mesma quantidade, mais pedaços
                </>
              )}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background p-3 text-center text-xs text-muted-foreground">
        <Equal className="size-4 shrink-0 text-primary" />
        <p>
          Todas as figuras acima têm a mesma parte pintada:{" "}
          <b className="text-foreground">{n === 0 ? "nada" : `${porcento(n, d)}% do inteiro`}</b>.
          Multiplicar o número de cima e o de baixo pelo mesmo número não muda o tanto.
        </p>
      </div>
    </div>
  );
}
