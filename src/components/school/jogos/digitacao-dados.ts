import { PALAVRAS, type Palavra } from "@/components/school/ferramentas/alfabeto-dados";

/**
 * Currículo do jogo de digitação: teclado, dedos, lições do tutor e fases.
 *
 * As fases seguem a série da criança. No 1º ano o caminho começa nas vogais,
 * no alfabeto e nos números; no 2º entram sílabas e palavras com figura; do 3º
 * em diante, palavras longas, frases, pontuação e textos. O que uma série
 * anterior já ensinou continua disponível para revisão.
 */

export type Serie = 1 | 2 | 3 | 4 | 5;

// ------------------------------------------------------------------ teclado

/** Fileiras de um teclado ABNT2 simplificado (com a linha dos números). */
export const FILEIRAS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ç"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", ";"],
];

/** Dedo de cada tecla: 0 mindinho esquerdo … 3 indicador esquerdo, 4 e 5 polegares, 6 … 9 direita. */
const DEDO: Record<string, number> = {};
[
  ["1qaz", 0],
  ["2wsx", 1],
  ["3edc", 2],
  ["45rfvtgb", 3],
  ["67yhnujm", 6],
  ["8ik,", 7],
  ["9ol.", 8],
  ["0pç;", 9],
].forEach(([teclas, dedo]) => {
  for (const t of teclas as string) DEDO[t] = dedo as number;
});

export const NOME_DEDO = [
  "mindinho esquerdo",
  "anelar esquerdo",
  "médio esquerdo",
  "indicador esquerdo",
  "polegar esquerdo",
  "polegar direito",
  "indicador direito",
  "médio direito",
  "anelar direito",
  "mindinho direito",
];

export const COR_DEDO = [
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#94a3b8",
  "#94a3b8",
  "#38bdf8",
  "#8b5cf6",
  "#d946ef",
  "#ec4899",
];

export function dedoDe(tecla: string): number {
  if (tecla === " ") return 5;
  return DEDO[tecla] ?? 4;
}

/** Tira acento e caixa: a criança não precisa acertar "ç" ou "ã" com tecla morta. */
export function base(c: string): string {
  return c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Tecla física que a próxima letra pede (o "ç" tem tecla própria). */
export function teclaDe(c: string | undefined): string | null {
  if (!c) return null;
  if (c === " ") return " ";
  if (c.toLowerCase() === "ç") return "ç";
  return base(c);
}

// ------------------------------------------------------------------ prompts

/** Uma coisa a digitar: pode ser uma letra, uma sílaba, uma palavra ou uma frase. */
export interface Prompt {
  alvo: string;
  /** Chave de uma figura do Parque das Letras. */
  figura?: string;
  legenda?: string;
}

const emb = <T>(l: T[]): T[] => {
  const c = [...l];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j]!, c[i]!];
  }
  return c;
};

const letras = (s: string): Prompt[] => [...s].map((alvo) => ({ alvo }));
const lista = (l: string[]): Prompt[] => l.map((alvo) => ({ alvo }));

function palavrasFigura(
  quantas: number,
  filtro: (p: Palavra) => boolean,
  silabas = false,
): Prompt[] {
  return emb(PALAVRAS.filter(filtro))
    .slice(0, quantas)
    .map((p) => ({
      alvo: p.texto,
      figura: p.figura,
      ...(silabas ? { legenda: p.silabas.join(" · ") } : {}),
    }));
}

export interface ContextoFase {
  /** Primeiro nome da criança, quando está logada. */
  nome?: string | undefined;
}

export interface Fase {
  id: string;
  serie: Serie;
  bloco: string;
  titulo: string;
  emoji: string;
  descricao: string;
  /** "alvo" mostra o item grande e sozinho; "texto" mostra uma linha corrida. */
  modo: "alvo" | "texto";
  gerar: (ctx: ContextoFase) => Prompt[];
}

const FRASES_CURTAS = [
  "O gato dorme.",
  "A bola é azul.",
  "Eu gosto de ler.",
  "O sol é quente.",
  "A vovó faz bolo.",
  "Nós vamos à escola.",
  "O peixe nada no rio.",
  "A menina pula corda.",
];

const FRASES = [
  "A escola é o nosso lugar de aprender.",
  "O sol brilha forte na floresta.",
  "Ler um livro é viajar sem sair de casa.",
  "Cada erro ensina um jeito novo de acertar.",
  "Os amigos brincam no pátio depois da aula.",
  "A chuva chegou e o rio encheu de novo.",
  "Quem estuda muito colhe bons frutos.",
  "O computador ajuda a pesquisar e criar.",
];

const TRAVA_LINGUAS = [
  "O rato roeu a roupa do rei de Roma.",
  "Três pratos de trigo para três tigres tristes.",
  "O peito do pé de Pedro é preto.",
  "A aranha arranha a rã, a rã arranha a aranha.",
  "Um tigre, dois tigres, três tigres.",
];

const TEXTOS = [
  "A educação transforma sonhos em grandes conquistas.",
  "Grandes resultados vêm de pequenos esforços diários.",
  "Quem persiste, mesmo devagar, sempre chega ao destino.",
  "Aprender é descobrir que o mundo cabe dentro de um livro.",
  "Com atenção e treino, os dedos ganham velocidade e precisão.",
  "A floresta guarda segredos que só a curiosidade descobre.",
  "Digitar bem é uma habilidade que acompanha a vida inteira.",
];

const EXCLAMACOES = [
  "Você gosta de estudar?",
  "Que dia lindo hoje!",
  "Quantos anos você tem?",
  "Parabéns, você conseguiu!",
];

export const FASES: Fase[] = [
  // ---------------------------------------------------- letras e números
  {
    id: "vogais",
    serie: 1,
    bloco: "Letras e números",
    titulo: "As vogais",
    emoji: "🅰️",
    descricao: "A, E, I, O, U: as cinco vogais, uma a uma.",
    modo: "alvo",
    gerar: () => letras(emb([..."aeiou", ..."aeiou", ..."aeiou"].slice(0)).join("")),
  },
  {
    id: "alfabeto-1",
    serie: 1,
    bloco: "Letras e números",
    titulo: "Alfabeto de A a M",
    emoji: "🔤",
    descricao: "As treze primeiras letras, em ordem e fora de ordem.",
    modo: "alvo",
    gerar: () => letras("abcdefghijklm" + emb([..."abcdefghijklm"]).join("")),
  },
  {
    id: "alfabeto-2",
    serie: 1,
    bloco: "Letras e números",
    titulo: "Alfabeto de N a Z",
    emoji: "🔠",
    descricao: "As treze últimas letras, em ordem e fora de ordem.",
    modo: "alvo",
    gerar: () => letras("nopqrstuvwxyz" + emb([..."nopqrstuvwxyz"]).join("")),
  },
  {
    id: "consoantes",
    serie: 1,
    bloco: "Letras e números",
    titulo: "As consoantes",
    emoji: "🅱️",
    descricao: "Todas as letras que não são vogais, sem ordem.",
    modo: "alvo",
    gerar: () => letras(emb([..."bcdfghjklmnpqrstvwxyz"]).join("")),
  },
  {
    id: "numeros",
    serie: 1,
    bloco: "Letras e números",
    titulo: "Os números",
    emoji: "🔢",
    descricao: "De 0 a 9 na fileira de cima do teclado.",
    modo: "alvo",
    gerar: () => letras("0123456789" + emb([..."0123456789"]).join("")),
  },
  {
    id: "meu-nome",
    serie: 1,
    bloco: "Letras e números",
    titulo: "Meu nome",
    emoji: "🧒",
    descricao: "Digite o seu nome, letra por letra.",
    modo: "alvo",
    gerar: ({ nome }) => {
      const n = (nome ?? "escola").trim().toLowerCase() || "escola";
      return lista([n, n, n]);
    },
  },
  {
    id: "numeros-2",
    serie: 2,
    bloco: "Letras e números",
    titulo: "Números grandes",
    emoji: "💯",
    descricao: "Números com dois e três algarismos.",
    modo: "alvo",
    gerar: () =>
      lista(["12", "34", "56", "78", "90", "123", "405", "789", "246", "1357", "2024", "1000"]),
  },
  // ---------------------------------------------------------- sílabas
  {
    id: "silabas-1",
    serie: 1,
    bloco: "Sílabas",
    titulo: "Sílabas com B, C e D",
    emoji: "🧩",
    descricao: "BA BE BI BO BU, CA CO CU, DA DE DI DO DU.",
    modo: "alvo",
    gerar: () => lista(emb("ba be bi bo bu ca co cu da de di do du".split(" ")).slice(0, 12)),
  },
  {
    id: "silabas-2",
    serie: 1,
    bloco: "Sílabas",
    titulo: "Sílabas com F, L e M",
    emoji: "🧩",
    descricao: "FA FE FI FO FU, LA LE LI LO LU, MA ME MI MO MU.",
    modo: "alvo",
    gerar: () => lista(emb("fa fe fi fo fu la le li lo lu ma me mi mo mu".split(" ")).slice(0, 12)),
  },
  {
    id: "silabas-3",
    serie: 2,
    bloco: "Sílabas",
    titulo: "Sílabas com N, P e R",
    emoji: "🧩",
    descricao: "NA NE NI NO NU, PA PE PI PO PU, RA RE RI RO RU.",
    modo: "alvo",
    gerar: () => lista(emb("na ne ni no nu pa pe pi po pu ra re ri ro ru".split(" ")).slice(0, 12)),
  },
  {
    id: "silabas-4",
    serie: 2,
    bloco: "Sílabas",
    titulo: "Sílabas com S, T e V",
    emoji: "🧩",
    descricao: "SA SE SI SO SU, TA TE TI TO TU, VA VE VI VO VU.",
    modo: "alvo",
    gerar: () => lista(emb("sa se si so su ta te ti to tu va ve vi vo vu".split(" ")).slice(0, 12)),
  },
  {
    id: "silabas-5",
    serie: 3,
    bloco: "Sílabas",
    titulo: "Sílabas complexas",
    emoji: "🧱",
    descricao: "BRA, PLA, TRA, CHA, LHA, NHA e outras.",
    modo: "alvo",
    gerar: () =>
      lista(
        emb(
          "bra bre bri bro bru pla ple pli plo plu tra tre tri tro tru cha che chi cho chu lha lhe nha nho".split(
            " ",
          ),
        ).slice(0, 12),
      ),
  },
  // ---------------------------------------------------------- palavras
  {
    id: "palavras-1",
    serie: 1,
    bloco: "Palavras",
    titulo: "Palavras com figura",
    emoji: "🖼️",
    descricao: "Olhe a figura e digite o nome dela.",
    modo: "alvo",
    gerar: () => palavrasFigura(8, (p) => p.texto.length <= 5),
  },
  {
    id: "palavras-2",
    serie: 2,
    bloco: "Palavras",
    titulo: "Animais",
    emoji: "🐶",
    descricao: "Digite o nome de cada bicho, separando as sílabas.",
    modo: "alvo",
    gerar: () => palavrasFigura(8, (p) => p.categoria === "animal", true),
  },
  {
    id: "palavras-3",
    serie: 2,
    bloco: "Palavras",
    titulo: "Frutas e comidas",
    emoji: "🍎",
    descricao: "Digite o nome de cada fruta.",
    modo: "alvo",
    gerar: () => palavrasFigura(8, (p) => p.categoria === "fruta", true),
  },
  {
    id: "palavras-4",
    serie: 3,
    bloco: "Palavras",
    titulo: "Palavras compridas",
    emoji: "📏",
    descricao: "Palavras de seis letras ou mais, com figura.",
    modo: "alvo",
    gerar: () => palavrasFigura(8, (p) => p.texto.length >= 6, true),
  },
  // ------------------------------------------------------------ frases
  {
    id: "frases-1",
    serie: 2,
    bloco: "Frases e textos",
    titulo: "Frases curtas",
    emoji: "💬",
    descricao: "Frases pequenas, com ponto no fim.",
    modo: "texto",
    gerar: () => lista(emb(FRASES_CURTAS).slice(0, 5)),
  },
  {
    id: "frases-2",
    serie: 3,
    bloco: "Frases e textos",
    titulo: "Frases do dia a dia",
    emoji: "📝",
    descricao: "Frases maiores, para ganhar ritmo.",
    modo: "texto",
    gerar: () => lista(emb(FRASES).slice(0, 4)),
  },
  {
    id: "trava",
    serie: 4,
    bloco: "Frases e textos",
    titulo: "Trava-línguas",
    emoji: "🌀",
    descricao: "Repetição de letras que enrolam os dedos.",
    modo: "texto",
    gerar: () => lista(emb(TRAVA_LINGUAS).slice(0, 4)),
  },
  {
    id: "pontuacao",
    serie: 5,
    bloco: "Frases e textos",
    titulo: "Perguntas e exclamações",
    emoji: "❓",
    descricao: "Sinais ? e ! (segure Shift para digitar).",
    modo: "texto",
    gerar: () => lista(emb(EXCLAMACOES).slice(0, 4)),
  },
  {
    id: "textos",
    serie: 4,
    bloco: "Frases e textos",
    titulo: "Textos curtos",
    emoji: "📖",
    descricao: "Frases com ideias completas, sem pressa e sem erro.",
    modo: "texto",
    gerar: () => lista(emb(TEXTOS).slice(0, 4)),
  },
  {
    id: "maratona",
    serie: 5,
    bloco: "Frases e textos",
    titulo: "Maratona final",
    emoji: "🏅",
    descricao: "Cinco textos seguidos. É a prova de fogo!",
    modo: "texto",
    gerar: () => lista(emb([...TEXTOS, ...FRASES]).slice(0, 5)),
  },
];

export const BLOCOS = ["Letras e números", "Sílabas", "Palavras", "Frases e textos"];

/** Fases de uma série: todas as que ela já pode fazer, das mais simples às mais avançadas. */
export function fasesDaSerie(serie: Serie): Fase[] {
  return FASES.filter((f) => f.serie <= serie);
}

// ------------------------------------------------------------ tutor: lições

export interface Licao {
  id: string;
  titulo: string;
  teclas: string;
  explicacao: string;
  prompts: string[];
}

export const LICOES: Licao[] = [
  {
    id: "l1",
    titulo: "Os indicadores: F e J",
    teclas: "fj",
    explicacao:
      "Sinta o pontinho em relevo nas teclas F e J: eles ficam sob os dedos indicadores. É a sua base.",
    prompts: ["f", "j", "f", "j", "ff", "jj", "fj", "jf", "fjf", "jfj"],
  },
  {
    id: "l2",
    titulo: "Os médios: D e K",
    teclas: "dk",
    explicacao: "Os dedos médios ficam sobre D e K. Depois de digitar, volte para a base F e J.",
    prompts: ["d", "k", "dd", "kk", "dk", "kd", "fd", "jk", "dfk", "kjd"],
  },
  {
    id: "l3",
    titulo: "Os anelares: S e L",
    teclas: "sl",
    explicacao: "Os anelares (o dedo do anel) ficam sobre S e L.",
    prompts: ["s", "l", "ss", "ll", "sl", "ls", "sdf", "jkl", "lks", "fds"],
  },
  {
    id: "l4",
    titulo: "Os mindinhos: A e Ç",
    teclas: "aç",
    explicacao: "Os mindinhos ficam sobre A e Ç. Agora você conhece toda a fileira do meio!",
    prompts: ["a", "ç", "aa", "çç", "as", "lç", "asdf", "jklç", "fada", "sala"],
  },
  {
    id: "l5",
    titulo: "Fileira do meio completa",
    teclas: "asdfjklç",
    explicacao: "Misture as oito teclas da base. Sem olhar para o teclado!",
    prompts: ["asdf jklç", "sala", "falas", "dado", "lado", "jalaça", "casa", "fila"],
  },
  {
    id: "l6",
    titulo: "Estica os indicadores: G e H",
    teclas: "gh",
    explicacao: "O indicador estica de lado para alcançar G e H, e logo volta para F e J.",
    prompts: ["g", "h", "gg", "hh", "gh", "hg", "gato", "ha", "galho", "haja"],
  },
  {
    id: "l7",
    titulo: "Fileira de cima",
    teclas: "qwertyuiop",
    explicacao: "Cada dedo sobe uma linha, na mesma coluna em que estava, e desce de volta.",
    prompts: ["qw", "er", "ty", "ui", "op", "pé", "rio", "tio", "quero", "poeira"],
  },
  {
    id: "l8",
    titulo: "Fileira de baixo",
    teclas: "zxcvbnm",
    explicacao: "Agora os dedos descem uma linha. Continue voltando à base depois de cada tecla.",
    prompts: ["zx", "cv", "bn", "m", "vaca", "bola", "zebra", "banana", "vovó", "cavalo"],
  },
  {
    id: "l9",
    titulo: "O espaço e as palavras",
    teclas: " ",
    explicacao:
      "O espaço é sempre com o polegar. Use o mesmo polegar, o que ficar mais confortável.",
    prompts: ["a casa", "o gato", "eu sou", "lá vai", "boa tarde", "bom dia amigo"],
  },
  {
    id: "l10",
    titulo: "Números",
    teclas: "1234567890",
    explicacao: "Os números estão na fileira de cima. Cada dedo alcança o seu, em coluna.",
    prompts: ["12", "34", "56", "78", "90", "123", "456", "789", "2025", "1000"],
  },
];

// ---------------------------------------------------------- desafio (robô)

/** Palavras por minuto do robô, por série e nível (1 fácil, 2 médio, 3 difícil). */
export function ritmoRobo(serie: Serie, nivel: number): number {
  const baseSerie = [7, 10, 15, 20, 26][serie - 1]!;
  const mult = nivel === 1 ? 0.75 : nivel === 3 ? 1.3 : 1;
  return Math.round(baseSerie * mult);
}

/** O que digitar no desafio: palavras e sílabas para os menores, frases para os maiores. */
export function desafioDaSerie(serie: Serie): { prompts: Prompt[]; modo: "alvo" | "texto" } {
  if (serie === 1)
    return {
      modo: "alvo",
      prompts: [
        ...palavrasFigura(6, (p) => p.texto.length <= 5),
        ...lista(emb("ba be bi bo bu la le li lo lu".split(" ")).slice(0, 4)),
      ],
    };
  if (serie === 2)
    return { modo: "alvo", prompts: palavrasFigura(8, (p) => p.texto.length <= 8, true) };
  if (serie === 3) return { modo: "texto", prompts: lista(emb(FRASES).slice(0, 4)) };
  if (serie === 4)
    return { modo: "texto", prompts: lista(emb([...FRASES, ...TEXTOS]).slice(0, 4)) };
  return { modo: "texto", prompts: lista(emb([...TEXTOS, ...TRAVA_LINGUAS]).slice(0, 5)) };
}

export const CENARIOS = [
  "digitacao-cenario-1-pro",
  "digitacao-cenario-2-pro",
  "digitacao-cenario-3-pro",
  "digitacao-cenario-4-pro",
  "digitacao-cenario-5-pro",
  "digitacao-cenario-6-pro",
];
