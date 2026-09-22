import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Laboratório de porcentagem: um número só — a porcentagem — mostrado ao
 * mesmo tempo em quatro desenhos e em três escritas (fração, decimal e %).
 * A criança mexe num lugar e vê tudo mudar junto, que é o jeito de entender
 * que 1/4, 0,25 e 25% são a mesma coisa dita de três maneiras.
 *
 * Depois vêm as contas: três caminhos diferentes para achar "25% de 80", e
 * três situações do dia a dia (desconto, prova e meta da turma) com o passo
 * a passo escrito.
 */

const MAX_GRADE = 100;

function mdc(a: number, b: number): number {
  return b === 0 ? a : mdc(b, a % b);
}

function fracaoDe(p: number): [number, number] {
  const g = mdc(Math.round(p), 100) || 1;
  return [Math.round(p) / g, 100 / g];
}

function brl(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function num(v: number): string {
  return (Math.round(v * 100) / 100).toLocaleString("pt-BR");
}

/* ---------------------------------------------------------------- */
/* Desenhos                                                          */
/* ---------------------------------------------------------------- */

/** Os 100 quadradinhos: é a definição de "por cento" virando imagem. */
function Grade100({ p, aoClicar }: { p: number; aoClicar?: (v: number) => void }) {
  const lado = 21;
  const pintados = Math.round(p);
  return (
    <svg
      viewBox="0 0 214 214"
      className="w-full max-w-[150px]"
      role="img"
      aria-label={`${pintados} quadradinhos pintados de 100`}
    >
      {Array.from({ length: MAX_GRADE }, (_, i) => {
        const l = Math.floor(i / 10);
        const c = i % 10;
        return (
          <rect
            key={i}
            x={2 + c * lado}
            y={2 + l * lado}
            width={lado - 2}
            height={lado - 2}
            rx={3}
            fill={i < pintados ? "var(--color-primary)" : "var(--color-muted)"}
            stroke="var(--color-border)"
            onClick={aoClicar ? () => aoClicar(i + 1) : undefined}
            className={aoClicar ? "cursor-pointer" : undefined}
          />
        );
      })}
    </svg>
  );
}

/** Régua de 0 a 100 com a marca onde a porcentagem caiu. */
function Regua({ p }: { p: number }) {
  const L = 300;
  const x = (L - 24) * (p / 100) + 12;
  return (
    <svg
      viewBox="0 0 300 58"
      className="mx-auto w-full max-w-[320px]"
      role="img"
      aria-label={`Régua marcando ${Math.round(p)} por cento`}
    >
      <rect x={12} y={20} width={L - 24} height={20} rx={10} fill="var(--color-muted)" />
      <rect
        x={12}
        y={20}
        width={Math.max(0, x - 12)}
        height={20}
        rx={10}
        fill="var(--color-primary)"
      />
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line
            x1={12 + (L - 24) * (v / 100)}
            x2={12 + (L - 24) * (v / 100)}
            y1={43}
            y2={48}
            stroke="var(--color-border)"
            strokeWidth={2}
          />
          <text
            x={12 + (L - 24) * (v / 100)}
            y={56}
            textAnchor="middle"
            className="fill-muted-foreground text-[11px]"
          >
            {v}%
          </text>
        </g>
      ))}
      <circle
        cx={x}
        cy={30}
        r={11}
        fill="var(--color-background)"
        stroke="var(--color-primary)"
        strokeWidth={3}
      />
      <text x={x} y={14} textAnchor="middle" className="fill-foreground text-[11px] font-bold">
        {Math.round(p)}%
      </text>
    </svg>
  );
}

/** Disco: a mesma porcentagem como pedaço de um círculo. */
function Disco({ p }: { p: number }) {
  const R = 62;
  const c = 72;
  const ang = (p / 100) * 360;
  const rad = ((ang - 90) * Math.PI) / 180;
  const x = c + R * Math.cos(rad);
  const y = c + R * Math.sin(rad);
  const grande = ang > 180 ? 1 : 0;
  return (
    <svg
      viewBox="0 0 144 144"
      className="w-full max-w-[120px]"
      role="img"
      aria-label={`Disco com ${Math.round(p)} por cento`}
    >
      <circle cx={c} cy={c} r={R} fill="var(--color-muted)" />
      {p > 0 && p < 100 && (
        <path
          d={`M ${c} ${c} L ${c} ${c - R} A ${R} ${R} 0 ${grande} 1 ${x} ${y} Z`}
          fill="var(--color-primary)"
        />
      )}
      {p >= 100 && <circle cx={c} cy={c} r={R} fill="var(--color-primary)" />}
      <circle cx={c} cy={c} r={R * 0.55} fill="var(--color-card)" />
      <text x={c} y={c + 7} textAnchor="middle" className="fill-foreground text-[20px] font-bold">
        {Math.round(p)}%
      </text>
    </svg>
  );
}

/** Copo: porcentagem como "o quanto encheu". */
function Copo({ p }: { p: number }) {
  const altura = 118;
  const y0 = 12;
  const cheio = (altura - 18) * (p / 100);
  return (
    <svg
      viewBox="0 0 84 144"
      className="w-full max-w-[66px]"
      role="img"
      aria-label={`Copo cheio até ${Math.round(p)} por cento`}
    >
      <clipPath id="copo-clip">
        <path d="M14 14 L70 14 L62 128 L22 128 Z" />
      </clipPath>
      <path d="M14 14 L70 14 L62 128 L22 128 Z" fill="var(--color-muted)" />
      <g clipPath="url(#copo-clip)">
        <rect
          x={10}
          y={y0 + (altura - 18) - cheio + 2}
          width={64}
          height={cheio + 20}
          fill="var(--color-primary)"
        />
      </g>
      <path
        d="M14 14 L70 14 L62 128 L22 128 Z"
        fill="none"
        stroke="var(--color-foreground)"
        strokeWidth={2.5}
        opacity={0.5}
      />
      {[25, 50, 75].map((v) => (
        <line
          key={v}
          x1={20}
          x2={34}
          y1={y0 + (altura - 18) * (1 - v / 100) + 2}
          y2={y0 + (altura - 18) * (1 - v / 100) + 2}
          stroke="var(--color-foreground)"
          strokeWidth={1.5}
          opacity={0.35}
        />
      ))}
    </svg>
  );
}

/* ---------------------------------------------------------------- */
/* Ferramenta                                                        */
/* ---------------------------------------------------------------- */

const ATALHOS = [10, 20, 25, 50, 75, 100];

const ABAS = [
  { id: "ver", nome: "Desenhos" },
  { id: "calcular", nome: "Números" },
  { id: "vida", nome: "Na vida" },
] as const;

type Aba = (typeof ABAS)[number]["id"];

export function Porcentagem() {
  const [p, setP] = useState(25);
  const [total, setTotal] = useState(80);
  const [preco, setPreco] = useState(50);
  const [desconto, setDesconto] = useState(20);
  const [acertos, setAcertos] = useState(18);
  const [questoes, setQuestoes] = useState(20);

  // Uma aba por vez: as três partes juntas davam três telas de rolagem, e a
  // ferramenta é para caber inteira numa janela só.
  const [aba, setAba] = useState<Aba>("ver");
  // Um exemplo por vez, pelo mesmo motivo das abas: três cartões abertos
  // faziam a janela passar da tela em notebook.
  const [exemplo, setExemplo] = useState<"desconto" | "prova" | "meta">("desconto");

  const [fn, fd] = fracaoDe(p);
  const parte = (total * p) / 100;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 rounded-lg bg-muted/60 p-1">
        {ABAS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAba(a.id)}
            className={cn(
              "flex-1 cursor-pointer rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              aba === a.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {a.nome}
          </button>
        ))}
      </div>

      {aba === "ver" && (
        <>
          {/* 1. O mesmo número em quatro desenhos */}
          <section className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              Arraste, digite ou clique nos quadradinhos: os desenhos mudam juntos.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="range"
                min={0}
                max={100}
                value={p}
                onChange={(e) => setP(Number(e.target.value))}
                aria-label="Porcentagem"
                className="h-2 min-w-[180px] flex-1 cursor-pointer accent-primary"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={p}
                  onChange={(e) => setP(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  aria-label="Porcentagem em número"
                  className="h-9 w-16 rounded-lg border border-border bg-background text-center text-base font-bold text-foreground"
                />
                <span className="text-base font-bold text-foreground">%</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {ATALHOS.map((v) => (
                <Button
                  key={v}
                  variant={p === v ? "default" : "outline"}
                  size="sm"
                  className="h-7 cursor-pointer px-2.5 text-xs"
                  onClick={() => setP(v)}
                >
                  {v}%
                </Button>
              ))}
            </div>

            {/* A régua fica embaixo, sozinha: espremida numa coluna estreita ela
          perdia os números e deixava de ser régua. */}
            <div className="flex flex-col gap-2 rounded-xl bg-muted/40 p-2.5">
              <div className="grid grid-cols-3 items-end gap-2">
                <figure className="flex flex-col items-center gap-1">
                  <Grade100 p={p} aoClicar={setP} />
                  <figcaption className="text-center text-[11px] text-muted-foreground">
                    100 quadradinhos
                  </figcaption>
                </figure>
                <figure className="flex flex-col items-center gap-1">
                  <Disco p={p} />
                  <figcaption className="text-center text-[11px] text-muted-foreground">
                    pedaço do círculo
                  </figcaption>
                </figure>
                <figure className="flex flex-col items-center gap-1">
                  <Copo p={p} />
                  <figcaption className="text-center text-[11px] text-muted-foreground">
                    o quanto encheu
                  </figcaption>
                </figure>
              </div>
              <Regua p={p} />
            </div>
          </section>
        </>
      )}

      {aba === "calcular" && (
        <>
          {/* 2. As três escritas */}
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              Três jeitos de escrever a mesma coisa
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-border bg-background p-2 text-center">
                <p className="text-[11px] text-muted-foreground">Porcentagem</p>
                <p className="text-2xl font-bold text-primary">{Math.round(p)}%</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">de cada 100</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-2 text-center">
                <p className="text-[11px] text-muted-foreground">Fração</p>
                <p className="inline-flex flex-col items-center text-xl font-bold leading-none text-foreground">
                  <span>{fn}</span>
                  <span className="my-1 h-px w-8 bg-foreground" />
                  <span>{fd}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {Math.round(p)}/100 simplificada
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background p-2 text-center">
                <p className="text-[11px] text-muted-foreground">Número decimal</p>
                <p className="text-2xl font-bold text-foreground">{num(p / 100)}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">é só dividir por 100</p>
              </div>
            </div>
          </section>
          /* 3. Três caminhos para a mesma conta */
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              Quanto é {Math.round(p)}% de{" "}
              <input
                type="number"
                min={1}
                value={total}
                onChange={(e) => setTotal(Math.max(1, Number(e.target.value) || 1))}
                aria-label="Número inteiro"
                className="mx-1 h-7 w-20 rounded-md border border-border bg-background text-center font-bold text-foreground"
              />
              ?
            </h3>
            <p className="rounded-xl bg-primary/10 p-2 text-center text-lg font-bold text-primary">
              {num(parte)}
            </p>
            <p className="text-xs text-muted-foreground">Três caminhos para o mesmo número:</p>
            <ol className="flex flex-col gap-1 text-xs">
              <li className="rounded-xl border border-border bg-background p-2">
                <b className="text-foreground">1. Achar quanto vale 1%</b>
                <br />
                <span className="text-muted-foreground">
                  {total} ÷ 100 = {num(total / 100)} · depois {num(total / 100)} × {Math.round(p)} ={" "}
                  <b className="text-foreground">{num(parte)}</b>
                </span>
              </li>
              <li className="rounded-xl border border-border bg-background p-2">
                <b className="text-foreground">2. Usar o número decimal</b>
                <br />
                <span className="text-muted-foreground">
                  {Math.round(p)}% = {num(p / 100)} · então {num(p / 100)} × {total} ={" "}
                  <b className="text-foreground">{num(parte)}</b>
                </span>
              </li>
              <li className="rounded-xl border border-border bg-background p-2">
                <b className="text-foreground">3. Usar a fração</b>
                <br />
                <span className="text-muted-foreground">
                  {Math.round(p)}% = {fn}/{fd} · então {total} ÷ {fd} = {num(total / fd)} · e{" "}
                  {num(total / fd)} × {fn} = <b className="text-foreground">{num(parte)}</b>
                </span>
              </li>
            </ol>
          </section>
        </>
      )}

      {aba === "vida" && (
        /* 4. Onde a porcentagem aparece de verdade */
        <section className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["desconto", "🏷️ Desconto"],
                ["prova", "📝 Nota da prova"],
                ["meta", "🎯 Meta da turma"],
              ] as const
            ).map(([id, rotulo]) => (
              <button
                key={id}
                type="button"
                onClick={() => setExemplo(id)}
                className={cn(
                  "cursor-pointer rounded-full border px-2.5 py-1 text-xs transition-colors",
                  exemplo === id
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {rotulo}
              </button>
            ))}
          </div>

          {/* Desconto */}
          {exemplo === "desconto" && (
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3">
              <p className="text-xs font-semibold text-foreground">🏷️ Desconto na loja</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                Preço
                <input
                  type="number"
                  min={0}
                  value={preco}
                  onChange={(e) => setPreco(Math.max(0, Number(e.target.value) || 0))}
                  aria-label="Preço"
                  className="h-8 w-20 rounded-md border border-border bg-background text-center font-semibold text-foreground"
                />
                com
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={desconto}
                  onChange={(e) =>
                    setDesconto(Math.min(100, Math.max(0, Number(e.target.value) || 0)))
                  }
                  aria-label="Desconto"
                  className="h-8 w-16 rounded-md border border-border bg-background text-center font-semibold text-foreground"
                />
                % de desconto
              </div>
              <div className="flex items-center gap-3">
                <svg
                  viewBox="0 0 150 80"
                  className="w-[140px] shrink-0"
                  role="img"
                  aria-label="Etiqueta de preço"
                >
                  <path
                    d="M8 14 L112 14 L142 40 L112 66 L8 66 Z"
                    fill="var(--color-primary)"
                    opacity={0.12}
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                  />
                  <circle cx={22} cy={40} r={5} fill="var(--color-primary)" />
                  <text x={38} y={35} className="fill-muted-foreground text-[12px] line-through">
                    {brl(preco)}
                  </text>
                  <text x={38} y={56} className="fill-foreground text-[16px] font-bold">
                    {brl(preco - (preco * desconto) / 100)}
                  </text>
                </svg>
                <p className="text-xs text-muted-foreground">
                  O desconto é <b className="text-foreground">{brl((preco * desconto) / 100)}</b>.
                  <br />
                  Conta: {preco} ÷ 100 = {num(preco / 100)}, vezes {desconto} ={" "}
                  {num((preco * desconto) / 100)}.
                  <br />
                  Quem paga {100 - desconto}% do preço gasta{" "}
                  <b className="text-foreground">{brl(preco - (preco * desconto) / 100)}</b>.
                </p>
              </div>
            </div>
          )}

          {/* Prova */}
          {exemplo === "prova" && (
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3">
              <p className="text-xs font-semibold text-foreground">📝 Nota da prova</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                Acertou
                <input
                  type="number"
                  min={0}
                  max={questoes}
                  value={acertos}
                  onChange={(e) =>
                    setAcertos(Math.min(questoes, Math.max(0, Number(e.target.value) || 0)))
                  }
                  aria-label="Acertos"
                  className="h-8 w-16 rounded-md border border-border bg-background text-center font-semibold text-foreground"
                />
                de
                <input
                  type="number"
                  min={1}
                  value={questoes}
                  onChange={(e) => {
                    const q = Math.max(1, Number(e.target.value) || 1);
                    setQuestoes(q);
                    if (acertos > q) setAcertos(q);
                  }}
                  aria-label="Total de questões"
                  className="h-8 w-16 rounded-md border border-border bg-background text-center font-semibold text-foreground"
                />
                questões
              </div>
              <div className="flex items-center gap-3">
                <div className="flex w-[140px] shrink-0 justify-center">
                  <Disco p={(acertos / questoes) * 100} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Conta: {acertos} ÷ {questoes} = {num(acertos / questoes)}, vezes 100 ={" "}
                  <b className="text-foreground">{num((acertos / questoes) * 100)}%</b> de acertos.
                  <br />
                  {(acertos / questoes) * 100 >= 70
                    ? "Acima de 70%: é o resultado que a escola espera."
                    : "Abaixo de 70%: vale retomar o conteúdo com calma."}
                </p>
              </div>
            </div>
          )}

          {/* Meta da turma */}
          {exemplo === "meta" && (
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3">
              <p className="text-xs font-semibold text-foreground">🎯 Meta da turma</p>
              <p className="text-xs text-muted-foreground">
                A turma quer ler 40 livros no ano e já leu {Math.round((40 * p) / 100)}. Isso é{" "}
                <b className="text-foreground">{Math.round(p)}%</b> da meta — mexa na barra lá em
                cima para ver a turma avançar.
              </p>
              <Regua p={p} />
            </div>
          )}
        </section>
      )}

      {aba !== "vida" && (
        <p className="text-center text-[11px] text-muted-foreground">
          50% é metade, 25% é a metade da metade, 10% é andar uma casa com a vírgula.
        </p>
      )}
    </div>
  );
}
