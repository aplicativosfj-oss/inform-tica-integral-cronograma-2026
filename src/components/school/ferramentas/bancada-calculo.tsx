import { Eraser, Hammer, Minus, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Caixa de ferramentas de cálculo — a bancada que fica ao lado do problema.
 *
 * Criança de 1º ao 5º ano não calcula só de cabeça: ela conta nos dedos,
 * risca bolinha no caderno, separa palitinho, anda na reta numérica. A folha
 * de exercício tira tudo isso dela e depois cobra o resultado. Aqui os
 * instrumentos ficam à mão, e quem escolhe é a criança.
 *
 * São quatro, e cada um serve a um jeito de pensar:
 *
 * - fichas: contar de um em um, agrupando de dez em dez;
 * - palitinhos: a mesma contagem, mas com o feixe de dez amarrado — é o que
 *   prepara a ideia de dezena;
 * - reta numérica: andar para frente e para trás, que é somar e subtrair sem
 *   armar conta;
 * - grupos iguais: a multiplicação e a divisão vistas como cestas.
 *
 * A bancada se adapta: ela lê os números do enunciado e a operação e já abre
 * no instrumento que ajuda mais, com os números postos. Num problema de "3
 * pacotes com 5 figurinhas", ela abre com 3 cestas de 5 dentro.
 */

type Instrumento = "fichas" | "palitos" | "reta" | "grupos";

const INSTRUMENTOS: {
  id: Instrumento;
  nome: string;
  emoji: string;
  paraQue: string;
  dica: string;
}[] = [
  {
    id: "fichas",
    nome: "Fichas",
    emoji: "🔵",
    paraQue: "contar de um em um e agrupar de dez em dez",
    dica: "Toque numa ficha para riscar — é assim que se tira na subtração.",
  },
  {
    id: "palitos",
    nome: "Palitinhos",
    emoji: "🥢",
    paraQue: "amarrar feixes de dez, como no caderno",
    dica: "Dez palitos soltos viram um feixe: é a dezena nascendo.",
  },
  {
    id: "reta",
    nome: "Reta numérica",
    emoji: "📏",
    paraQue: "andar para frente e para trás",
    dica: "Somar é andar para a direita; subtrair é voltar. Os arcos são os seus pulos.",
  },
  {
    id: "grupos",
    nome: "Grupos iguais",
    emoji: "🧺",
    paraQue: "ver a multiplicação e a divisão em cestas",
    dica: "Multiplicar é repetir grupos iguais; dividir é repartir em grupos iguais.",
  },
];

/* ------------------------------------------------------------------ */
/* Fichas                                                              */
/* ------------------------------------------------------------------ */

function Fichas({ inicial }: { inicial: number }) {
  const [total, setTotal] = useState(Math.min(inicial, 50));
  const [riscadas, setRiscadas] = useState<Set<number>>(new Set());

  const porLinha = 10;
  const linhas = Math.max(1, Math.ceil(total / porLinha));
  const R = 9;
  const passo = 22;
  const restam = total - riscadas.size;

  function mexer(d: number) {
    setTotal((t) => Math.min(100, Math.max(0, t + d)));
  }

  return (
    <div className="flex flex-col gap-1">
      <svg
        viewBox={`0 0 ${porLinha * passo + 8} ${Math.max(1, linhas) * passo + 8}`}
        className="max-h-[88px] w-full"
        role="img"
        aria-label={`${total} fichas, ${riscadas.size} riscadas`}
      >
        {Array.from({ length: total }, (_, i) => {
          const x = (i % porLinha) * passo + passo / 2 + 4;
          const y = Math.floor(i / porLinha) * passo + passo / 2 + 4;
          const fora = riscadas.has(i);
          return (
            <g
              key={i}
              className="cursor-pointer"
              onClick={() =>
                setRiscadas((r) => {
                  const n = new Set(r);
                  if (n.has(i)) n.delete(i);
                  else n.add(i);
                  return n;
                })
              }
            >
              <circle
                cx={x}
                cy={y}
                r={R}
                fill={fora ? "var(--color-muted)" : "#2563eb"}
                stroke={fora ? "var(--color-border)" : "#1e40af"}
                strokeWidth={1.5}
              />
              {fora && (
                <path
                  d={`M ${x - 5} ${y - 5} L ${x + 5} ${y + 5} M ${x + 5} ${y - 5} L ${x - 5} ${y + 5}`}
                  stroke="var(--color-muted-foreground)"
                  strokeWidth={2}
                />
              )}
            </g>
          );
        })}
      </svg>

      <p className="text-center text-xs text-muted-foreground">
        {total === 0 ? (
          "Ponha fichas com os botões abaixo."
        ) : (
          <>
            <b className="text-foreground">{restam}</b> na mesa
            {riscadas.size > 0 && ` (${total} − ${riscadas.size} riscadas)`}
            {total >= 10 && (
              <>
                {" · "}
                {Math.floor(total / 10)} {Math.floor(total / 10) === 1 ? "grupo" : "grupos"} de 10 e{" "}
                {total % 10} {total % 10 === 1 ? "solta" : "soltas"}
              </>
            )}
          </>
        )}
      </p>

      <div className="flex flex-wrap justify-center gap-1">
        {[1, 5, 10].map((n) => (
          <BotaoBancada key={`m${n}`} rotulo={`Pôr ${n} fichas`} onClick={() => mexer(n)}>
            <Plus className="size-3" />
            {n}
          </BotaoBancada>
        ))}
        {[1, 10].map((n) => (
          <BotaoBancada key={`l${n}`} rotulo={`Tirar ${n} fichas`} onClick={() => mexer(-n)}>
            <Minus className="size-3" />
            {n}
          </BotaoBancada>
        ))}
        <BotaoBancada
          onClick={() => {
            setTotal(0);
            setRiscadas(new Set());
          }}
        >
          <Eraser className="size-3" /> limpar
        </BotaoBancada>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Palitinhos                                                          */
/* ------------------------------------------------------------------ */

function Palitos({ inicial }: { inicial: number }) {
  const [feixes, setFeixes] = useState(Math.floor(Math.min(inicial, 90) / 10));
  const [soltos, setSoltos] = useState(Math.min(inicial, 90) % 10);

  const total = feixes * 10 + soltos;

  function palito(x: number, y: number, i: number) {
    return (
      <rect
        key={i}
        x={x}
        y={y}
        width={4}
        height={40}
        rx={2}
        fill="#c88b3a"
        stroke="#8a5a1d"
        strokeWidth={0.8}
      />
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <svg
        viewBox="0 0 320 60"
        className="max-h-[74px] w-full"
        role="img"
        aria-label={`${feixes} feixes e ${soltos} palitos soltos`}
      >
        {Array.from({ length: feixes }, (_, f) => (
          <g key={`f${f}`} transform={`translate(${f * 44 + 6} 8)`}>
            {Array.from({ length: 10 }, (_, i) => palito(i * 3.4, 0, i))}
            {/* a amarra: é o que transforma dez palitos numa dezena */}
            <rect x={-2} y={14} width={38} height={7} rx={3} fill="#dc2626" />
          </g>
        ))}
        {Array.from({ length: soltos }, (_, i) => palito(feixes * 44 + 12 + i * 8, 8, 100 + i))}
      </svg>

      <p className="text-center text-xs text-muted-foreground">
        {feixes} {feixes === 1 ? "feixe" : "feixes"} e {soltos} {soltos === 1 ? "solto" : "soltos"}{" "}
        = <b className="text-foreground">{total}</b>
      </p>

      <div className="flex flex-wrap justify-center gap-1">
        <BotaoBancada onClick={() => setSoltos((s) => Math.min(9, s + 1))}>
          <Plus className="size-3" /> palito
        </BotaoBancada>
        <BotaoBancada onClick={() => setSoltos((s) => Math.max(0, s - 1))}>
          <Minus className="size-3" /> palito
        </BotaoBancada>
        <BotaoBancada onClick={() => setFeixes((f) => Math.min(9, f + 1))}>
          <Plus className="size-3" /> feixe
        </BotaoBancada>
        <BotaoBancada onClick={() => setFeixes((f) => Math.max(0, f - 1))}>
          <Minus className="size-3" /> feixe
        </BotaoBancada>
        <BotaoBancada
          onClick={() => {
            setFeixes(0);
            setSoltos(0);
          }}
        >
          <Eraser className="size-3" /> limpar
        </BotaoBancada>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reta numérica                                                       */
/* ------------------------------------------------------------------ */

function Reta({ numeros }: { numeros: number[] }) {
  const maior = Math.max(10, ...numeros.filter((n) => n <= 200));
  const fim = maior <= 20 ? 20 : maior <= 50 ? 50 : 100;
  const [pos, setPos] = useState(0);
  const [saltos, setSaltos] = useState<{ de: number; para: number }[]>([]);

  const L = 320;
  const x = (v: number) => 14 + ((L - 28) * v) / fim;
  const marcas = fim <= 20 ? 1 : fim <= 50 ? 5 : 10;

  function pular(d: number) {
    setPos((p) => {
      const novo = Math.min(fim, Math.max(0, p + d));
      if (novo !== p) setSaltos((s) => [...s.slice(-7), { de: p, para: novo }]);
      return novo;
    });
  }

  // Os saltos sugeridos vêm do próprio problema: se o enunciado fala em 5,
  // o botão "+5" está ali pronto.
  const sugeridos = [...new Set(numeros.filter((n) => n > 0 && n <= fim))].slice(0, 3);

  return (
    <div className="flex flex-col gap-1">
      <svg
        viewBox="0 0 320 76"
        className="max-h-[70px] w-full"
        role="img"
        aria-label={`Reta numérica na posição ${pos}`}
      >
        {saltos.map((s, i) => {
          const meio = (x(s.de) + x(s.para)) / 2;
          return (
            <path
              key={i}
              d={`M ${x(s.de)} 46 Q ${meio} ${46 - Math.min(34, Math.abs(x(s.para) - x(s.de)) * 0.7)} ${x(s.para)} 46`}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth={1.6}
              opacity={0.35 + (i / saltos.length) * 0.5}
            />
          );
        })}
        <line
          x1={14}
          y1={46}
          x2={L - 14}
          y2={46}
          stroke="var(--color-foreground)"
          strokeWidth={2}
          opacity={0.6}
        />
        {Array.from({ length: fim / marcas + 1 }, (_, i) => {
          const v = i * marcas;
          return (
            <g key={v}>
              <line
                x1={x(v)}
                y1={42}
                x2={x(v)}
                y2={50}
                stroke="var(--color-foreground)"
                strokeWidth={1.5}
                opacity={0.5}
              />
              <text
                x={x(v)}
                y={64}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px]"
              >
                {v}
              </text>
            </g>
          );
        })}
        <circle
          cx={x(pos)}
          cy={46}
          r={7}
          fill="var(--color-primary)"
          stroke="var(--color-background)"
          strokeWidth={2}
        />
        <text
          x={x(pos)}
          y={22}
          textAnchor="middle"
          className="fill-foreground text-[13px] font-bold"
        >
          {pos}
        </text>
      </svg>

      <div className="flex flex-wrap justify-center gap-1">
        {[1, 10, ...sugeridos].map((n, i) => (
          <BotaoBancada
            key={`p${n}-${i}`}
            rotulo={`Pular ${n} para frente`}
            onClick={() => pular(n)}
          >
            +{n}
          </BotaoBancada>
        ))}
        {[1, 10].map((n) => (
          <BotaoBancada key={`v${n}`} rotulo={`Voltar ${n}`} onClick={() => pular(-n)}>
            −{n}
          </BotaoBancada>
        ))}
        <BotaoBancada
          onClick={() => {
            setPos(0);
            setSaltos([]);
          }}
        >
          <Eraser className="size-3" /> voltar ao 0
        </BotaoBancada>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Grupos iguais                                                       */
/* ------------------------------------------------------------------ */

/**
 * Na multiplicação os números do enunciado já são "quantos grupos" e "quanto
 * em cada um", e as cestas abrem prontas.
 *
 * Na divisão, não: abrir com as cestas cheias entregaria o resultado — e num
 * jogo valendo ponto isso seria colar. A bancada abre com o número certo de
 * cestas, mas quase vazias, e diz quanto ainda falta repartir. Quem
 * distribui é a criança, que é o que a divisão é de verdade.
 */
function inicioDosGrupos(
  numeros: number[],
  operacao?: string | undefined,
): { grupos: number; cada: number; repartir: number | null } {
  const [a = 3, b = 5] = numeros;
  if (operacao === "divisao" && b > 1 && b <= 10 && a > b && a % b === 0 && a / b <= 12) {
    return { grupos: b, cada: 1, repartir: a };
  }
  return { grupos: Math.min(a, 10) || 3, cada: Math.min(b, 12) || 5, repartir: null };
}

function Grupos({ numeros, operacao }: { numeros: number[]; operacao?: string | undefined }) {
  const inicio = inicioDosGrupos(numeros, operacao);
  const [grupos, setGrupos] = useState(inicio.grupos);
  const [cada, setCada] = useState(inicio.cada);

  const total = grupos * cada;
  const larguraCesta = Math.min(96, 300 / Math.max(1, grupos));
  // Mais colunas deixam a cesta baixa: é a altura que faz a janela crescer.
  const colunas = Math.min(5, Math.max(2, Math.ceil(Math.sqrt(cada * 1.6))));
  const linhas = Math.ceil(cada / colunas);

  return (
    <div className="flex flex-col gap-1">
      <svg
        viewBox={`0 0 320 ${Math.max(60, linhas * 15 + 26)}`}
        className="max-h-[66px] w-full"
        role="img"
        aria-label={`${grupos} grupos de ${cada}, total ${total}`}
      >
        {Array.from({ length: grupos }, (_, g) => {
          const x0 = 6 + g * (larguraCesta + 4);
          return (
            <g key={g}>
              <rect
                x={x0}
                y={4}
                width={larguraCesta}
                height={linhas * 15 + 12}
                rx={7}
                fill="color-mix(in srgb, var(--color-primary) 10%, transparent)"
                stroke="var(--color-primary)"
                strokeWidth={1.4}
                strokeDasharray="4 3"
              />
              {Array.from({ length: cada }, (_, i) => (
                <circle
                  key={i}
                  cx={x0 + 12 + (i % colunas) * Math.min(20, (larguraCesta - 20) / colunas + 6)}
                  cy={16 + Math.floor(i / colunas) * 15}
                  r={5.5}
                  fill="#f59e0b"
                  stroke="#b45309"
                  strokeWidth={1}
                />
              ))}
            </g>
          );
        })}
      </svg>

      <p className="text-center text-xs text-muted-foreground">
        <b className="text-foreground">{grupos}</b> grupos de{" "}
        <b className="text-foreground">{cada}</b> = <b className="text-primary">{total}</b> ao todo
        {inicio.repartir !== null && (
          <>
            {" · "}
            {total === inicio.repartir ? (
              <b className="text-emerald-600 dark:text-emerald-400">
                repartiu os {inicio.repartir}!
              </b>
            ) : (
              <>
                falta chegar a <b className="text-foreground">{inicio.repartir}</b>
              </>
            )}
          </>
        )}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-1">
        <span className="text-[10px] text-muted-foreground">grupos</span>
        <BotaoBancada rotulo="Menos grupos" onClick={() => setGrupos((g) => Math.max(1, g - 1))}>
          <Minus className="size-3" />
        </BotaoBancada>
        <BotaoBancada rotulo="Mais grupos" onClick={() => setGrupos((g) => Math.min(10, g + 1))}>
          <Plus className="size-3" />
        </BotaoBancada>
        <span className="ml-2 text-[10px] text-muted-foreground">em cada</span>
        <BotaoBancada
          rotulo="Menos em cada cesta"
          onClick={() => setCada((c) => Math.max(1, c - 1))}
        >
          <Minus className="size-3" />
        </BotaoBancada>
        <BotaoBancada
          rotulo="Mais em cada cesta"
          onClick={() => setCada((c) => Math.min(12, c + 1))}
        >
          <Plus className="size-3" />
        </BotaoBancada>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function BotaoBancada({
  children,
  onClick,
  rotulo,
}: {
  children: React.ReactNode;
  onClick: () => void;
  /** Para quem usa leitor de tela: os botões de ícone não dizem nada sozinhos. */
  rotulo?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      className="flex cursor-pointer items-center gap-0.5 rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-primary/60 hover:bg-primary/5"
    >
      {children}
    </button>
  );
}

/** Tira os números do enunciado, que é o que a bancada usa para se ajustar. */
export function numerosDoTexto(texto: string): number[] {
  return (texto.match(/\d+/g) ?? []).map(Number).filter((n) => n > 0 && n <= 1000);
}

/** Qual instrumento ajuda mais neste problema. */
function instrumentoPara(operacao: string | undefined, numeros: number[]): Instrumento {
  if (operacao === "multiplicacao" || operacao === "divisao" || operacao === "mista")
    return "grupos";
  const maior = Math.max(0, ...numeros);
  if (maior > 30) return "reta";
  return "fichas";
}

export function BancadaCalculo({
  numeros = [],
  operacao,
  aberturaPadrao = false,
}: {
  numeros?: number[];
  operacao?: string;
  aberturaPadrao?: boolean;
}) {
  const sugerido = useMemo(() => instrumentoPara(operacao, numeros), [operacao, numeros]);
  const [aberta, setAberta] = useState(aberturaPadrao);
  const [instrumento, setInstrumento] = useState<Instrumento>(sugerido);
  // Trocar de problema traz de volta a sugestão, mas sem fechar a bancada
  // de quem já estava usando.
  const [ultimoSugerido, setUltimoSugerido] = useState(sugerido);
  if (ultimoSugerido !== sugerido) {
    setUltimoSugerido(sugerido);
    setInstrumento(sugerido);
  }

  if (!aberta) {
    return (
      <button
        type="button"
        onClick={() => setAberta(true)}
        className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-border p-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
      >
        <Hammer className="size-3.5" /> Abrir a caixa de ferramentas
      </button>
    );
  }

  const atual = INSTRUMENTOS.find((i) => i.id === instrumento)!;
  // A chave força o instrumento a recomeçar quando o problema muda.
  const chave = `${instrumento}-${numeros.join("-")}`;

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-background p-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
          <Hammer className="size-3.5 text-primary" /> Caixa de ferramentas
        </span>
        <button
          type="button"
          onClick={() => setAberta(false)}
          aria-label="Fechar a caixa de ferramentas"
          className="flex size-5 cursor-pointer items-center justify-center rounded text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        {INSTRUMENTOS.map((i) => (
          <button
            key={i.id}
            type="button"
            onClick={() => setInstrumento(i.id)}
            className={cn(
              "flex cursor-pointer items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] transition-colors",
              instrumento === i.id
                ? "border-primary bg-primary/10 font-semibold text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <span aria-hidden>{i.emoji}</span>
            {i.nome}
            {i.id === sugerido && instrumento !== i.id && (
              <span className="text-[8px] text-primary">•</span>
            )}
          </button>
        ))}
      </div>
      <p className="text-[10px] leading-tight text-muted-foreground">
        Serve para {atual.paraQue}. {atual.dica}
      </p>

      {instrumento === "fichas" && <Fichas key={chave} inicial={numeros[0] ?? 0} />}
      {instrumento === "palitos" && <Palitos key={chave} inicial={numeros[0] ?? 0} />}
      {instrumento === "reta" && <Reta key={chave} numeros={numeros} />}
      {instrumento === "grupos" && <Grupos key={chave} numeros={numeros} operacao={operacao} />}
    </div>
  );
}
