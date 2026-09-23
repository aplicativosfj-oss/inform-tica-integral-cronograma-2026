/**
 * Casas, cartas e perguntas do tabuleiro "Matemática em Ação".
 *
 * As contas são sempre geradas na hora (nada de banco fixo de perguntas), com
 * números que crescem com o nível: no fácil ficam dentro do que a criança faz
 * de cabeça, no difícil pedem cálculo de verdade. As quatro alternativas são
 * montadas com erros "plausíveis" — a resposta ±1, ±10, troca de operação —,
 * que é o que uma criança realmente erra, e não números aleatórios que dão
 * para descartar só de olhar.
 */

export type Operacao = "soma" | "sub" | "mult" | "div";
export type TipoCarta = Operacao | "desafio" | "curiosidade" | "rapido" | "volte" | "estrela";
export type TipoCasa = "inicio" | "fim" | "misto" | "volte" | "estrela" | Operacao;

export interface Carta {
  tipo: TipoCarta;
  enunciado: string;
  opcoes: string[];
  correta: number;
  /** Casas a andar ao acertar / errar. */
  acerto: number;
  erro: number;
  /** Segundos para responder (só o "Pense rápido"). */
  tempo?: number;
  /** Carta sem pergunta: já vale o movimento indicado. */
  automatico?: number;
  dica: string;
}

export const TOTAL_CASAS = 30;
export const ULTIMA = TOTAL_CASAS - 1;

/** Desenho do tabuleiro: mistura de operações, casas "?", estrelas e casas "volte". */
export const CASAS: TipoCasa[] = [
  "inicio",
  "soma",
  "sub",
  "mult",
  "div",
  "misto",
  "soma",
  "sub",
  "estrela",
  "mult",
  "div",
  "soma",
  "misto",
  "sub",
  "volte",
  "mult",
  "div",
  "soma",
  "misto",
  "sub",
  "estrela",
  "mult",
  "div",
  "volte",
  "soma",
  "misto",
  "sub",
  "mult",
  "div",
  "fim",
];

export const PROB_ACERTO_ROBO = [0.55, 0.75, 0.9];

const rand = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

function embaralhar<T>(l: T[]): T[] {
  const c = [...l];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j]!, c[i]!];
  }
  return c;
}

/** Monta as quatro alternativas com a resposta certa numa posição sorteada. */
function alternativas(
  resposta: number,
  extras: number[] = [],
): { opcoes: string[]; correta: number } {
  const usados = new Set<number>([resposta]);
  const candidatos = [
    ...extras,
    resposta + 1,
    resposta - 1,
    resposta + 2,
    resposta - 2,
    resposta + 10,
    resposta - 10,
    resposta + rand(3, 9),
  ];
  const erradas: number[] = [];
  for (const c of candidatos) {
    if (c < 0 || usados.has(c)) continue;
    usados.add(c);
    erradas.push(c);
    if (erradas.length === 3) break;
  }
  let extra = resposta + 11;
  while (erradas.length < 3) {
    if (!usados.has(extra)) {
      usados.add(extra);
      erradas.push(extra);
    }
    extra += 1;
  }
  const todas = embaralhar([resposta, ...erradas]);
  return { opcoes: todas.map(String), correta: todas.indexOf(resposta) };
}

interface Conta {
  a: number;
  b: number;
  resposta: number;
}

function conta(op: Operacao, nivel: number): Conta {
  const n = Math.min(Math.max(nivel, 1), 3);
  if (op === "soma") {
    const [min, max] = n === 1 ? [2, 20] : n === 2 ? [10, 99] : [100, 999];
    const a = rand(min, max);
    const b = rand(min, max);
    return { a, b, resposta: a + b };
  }
  if (op === "sub") {
    const [min, max] = n === 1 ? [3, 20] : n === 2 ? [15, 99] : [100, 999];
    const a = rand(min, max);
    const b = rand(1, a - 1);
    return { a, b, resposta: a - b };
  }
  if (op === "mult") {
    const [fa, fb] =
      n === 1
        ? [
            [2, 5],
            [1, 10],
          ]
        : n === 2
          ? [
              [2, 9],
              [2, 10],
            ]
          : [
              [6, 12],
              [6, 15],
            ];
    const a = rand(fa![0]!, fa![1]!);
    const b = rand(fb![0]!, fb![1]!);
    return { a, b, resposta: a * b };
  }
  const [fd, fq] =
    n === 1
      ? [
          [2, 5],
          [1, 10],
        ]
      : n === 2
        ? [
            [2, 9],
            [2, 10],
          ]
        : [
            [3, 12],
            [4, 15],
          ];
  const d = rand(fd![0]!, fd![1]!);
  const q = rand(fq![0]!, fq![1]!);
  return { a: d * q, b: d, resposta: q };
}

const SIMBOLO: Record<Operacao, string> = { soma: "+", sub: "−", mult: "×", div: "÷" };

export function cartaOperacao(op: Operacao, nivel: number): Carta {
  const { a, b, resposta } = conta(op, nivel);
  // Erro clássico de cada conta: usar a operação vizinha.
  const troca = op === "soma" ? a - b : op === "sub" ? a + b : op === "mult" ? a + b : a - b;
  const { opcoes, correta } = alternativas(resposta, troca > 0 ? [troca] : []);
  return {
    tipo: op,
    enunciado: `${a} ${SIMBOLO[op]} ${b} = ?`,
    opcoes,
    correta,
    acerto: 1,
    erro: 0,
    dica: "Resolva a operação. Acertou, avance 1 casa.",
  };
}

const NOMES = ["Ana", "Bruno", "Clara", "Davi", "Elisa", "Felipe", "Gabi", "Heitor"];
const COISAS = [
  ["figurinhas", "figurinha"],
  ["lápis", "lápis"],
  ["livros", "livro"],
  ["bolinhas de gude", "bolinha de gude"],
  ["adesivos", "adesivo"],
];

export function cartaDesafio(nivel: number): Carta {
  const [nome, outro] = embaralhar(NOMES) as [string, string];
  const [coisas] = COISAS[rand(0, COISAS.length - 1)]! as [string, string];
  const tipo = (["soma", "sub", "mult", "div"] as const)[rand(0, 3)]!;
  const { a, b, resposta } = conta(tipo, nivel);
  let enunciado: string;
  if (tipo === "soma")
    enunciado = `${nome} tinha ${a} ${coisas} e ganhou mais ${b} de ${outro}. Com quantas ${coisas} ${nome} ficou?`;
  else if (tipo === "sub")
    enunciado = `${nome} tinha ${a} ${coisas} e deu ${b} para ${outro}. Com quantas ${coisas} ${nome} ficou?`;
  else if (tipo === "mult")
    enunciado = `${nome} guardou ${a} ${coisas} em cada caixa. Quantas ${coisas} há em ${b} caixas?`;
  else
    enunciado = `${nome} dividiu ${a} ${coisas} igualmente entre ${b} amigos. Quantas cada um recebeu?`;
  const { opcoes, correta } = alternativas(resposta);
  return {
    tipo: "desafio",
    enunciado,
    opcoes,
    correta,
    acerto: 2,
    erro: 0,
    dica: "Resolva o problema e avance 2 casas.",
  };
}

const CURIOSIDADES: [string, string, string[]][] = [
  ["Quantos lados tem um hexágono?", "6", ["4", "5", "8"]],
  ["Quantos minutos tem uma hora?", "60", ["30", "100", "90"]],
  ["O número zero é par ou ímpar?", "Par", ["Ímpar", "Nenhum dos dois", "Os dois"]],
  ["Quantos graus tem um ângulo reto?", "90", ["45", "180", "60"]],
  ["Qual é o dobro de 25?", "50", ["45", "55", "30"]],
  ["Qual é a metade de 100?", "50", ["25", "40", "10"]],
  ["Quantos vértices (pontas) tem um cubo?", "8", ["6", "12", "4"]],
  ["Que número o símbolo romano X representa?", "10", ["5", "50", "100"]],
  ["Quantos centímetros tem um metro?", "100", ["10", "1000", "50"]],
  ["Qual é o próximo número: 2, 4, 6, 8, …?", "10", ["9", "12", "11"]],
  ["Quantos segundos tem um minuto?", "60", ["100", "30", "120"]],
  ["Quantas faces tem um dado comum?", "6", ["4", "8", "12"]],
  ["Um triângulo tem quantos lados?", "3", ["4", "2", "5"]],
  ["Quanto é 10 vezes 10?", "100", ["20", "110", "1000"]],
  ["Quantos dias tem uma semana?", "7", ["5", "6", "8"]],
];

export function cartaCuriosidade(): Carta {
  const [pergunta, certa, erradas] = CURIOSIDADES[rand(0, CURIOSIDADES.length - 1)]!;
  const todas = embaralhar([certa, ...erradas]);
  return {
    tipo: "curiosidade",
    enunciado: pergunta,
    opcoes: todas,
    correta: todas.indexOf(certa),
    acerto: 1,
    erro: 0,
    dica: "Responda corretamente e avance 1 casa.",
  };
}

export function cartaRapida(nivel: number): Carta {
  const op = (["soma", "sub", "mult", "div"] as const)[rand(0, 3)]!;
  const base = cartaOperacao(op, Math.max(1, nivel - 1));
  return {
    ...base,
    tipo: "rapido",
    acerto: 3,
    erro: 0,
    tempo: 10,
    dica: "Responda em até 10 segundos. Se acertar, avance 3 casas.",
  };
}

export const CARTA_VOLTE: Carta = {
  tipo: "volte",
  enunciado: "Que pena! Volte 2 casas.",
  opcoes: [],
  correta: -1,
  acerto: -2,
  erro: -2,
  automatico: -2,
  dica: "Volte 2 casas.",
};

export const CARTA_ESTRELA: Carta = {
  tipo: "estrela",
  enunciado: "Casa da estrela! Avance 2 casas.",
  opcoes: [],
  correta: -1,
  acerto: 2,
  erro: 2,
  automatico: 2,
  dica: "Casa da estrela: avance 2 casas.",
};

/** Carta sorteada quando o peão cai numa casa "?". */
export function cartaMista(nivel: number): Carta {
  const sorteio = Math.random();
  if (sorteio < 0.34) return cartaDesafio(nivel);
  if (sorteio < 0.67) return cartaCuriosidade();
  return cartaRapida(nivel);
}

export function cartaDaCasa(casa: TipoCasa, nivel: number): Carta | null {
  switch (casa) {
    case "soma":
    case "sub":
    case "mult":
    case "div":
      return cartaOperacao(casa, nivel);
    case "misto":
      return cartaMista(nivel);
    case "volte":
      return CARTA_VOLTE;
    case "estrela":
      return CARTA_ESTRELA;
    default:
      return null;
  }
}
