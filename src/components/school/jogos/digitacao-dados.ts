/**
 * Textos e teclado do jogo de digitação.
 *
 * Cada nível tem a sua própria escada: o iniciante treina a fileira central
 * (onde os dedos descansam), o intermediário passa para palavras e o avançado
 * para frases com pontuação.
 */

export interface NivelDigitacao {
  id: 1 | 2 | 3;
  nome: string;
  /** Palavras por minuto do adversário. */
  robo: number;
  textos: string[];
  cenarios: string[];
}

export const NIVEIS_DIGITACAO: NivelDigitacao[] = [
  {
    id: 1,
    nome: "Iniciante",
    robo: 12,
    cenarios: ["digitacao-cenario-1", "digitacao-cenario-3"],
    textos: [
      "asa da casa",
      "a lala fala",
      "dada da sala",
      "sal e cal",
      "a faca falha",
      "jogo da vala",
      "o dado sai",
      "a jaca cai",
      "ela ja sai",
      "sapo salta",
      "gato ladrao",
      "todo dia fala",
    ],
  },
  {
    id: 2,
    nome: "Intermediário",
    robo: 22,
    cenarios: ["digitacao-cenario-2", "digitacao-cenario-4"],
    textos: [
      "A escola e o nosso lugar de aprender.",
      "O sol brilha forte na floresta.",
      "Ler um livro e viajar sem sair de casa.",
      "Cada erro ensina um jeito novo de acertar.",
      "Os amigos brincam no patio depois da aula.",
      "A chuva chegou e o rio encheu de novo.",
      "Quem estuda muito colhe bons frutos.",
      "O computador ajuda a pesquisar e criar.",
    ],
  },
  {
    id: 3,
    nome: "Avançado",
    robo: 34,
    cenarios: ["digitacao-cenario-5", "digitacao-cenario-6"],
    textos: [
      "A educação transforma sonhos em grandes conquistas.",
      "Grandes resultados vêm de pequenos esforços diários.",
      "Você é capaz de ir mais longe do que imagina!",
      "Quem persiste, mesmo devagar, sempre chega ao destino.",
      "Aprender é descobrir que o mundo cabe dentro de um livro.",
      "Com atenção e treino, os dedos ganham velocidade e precisão.",
      "A floresta guarda segredos que só a curiosidade descobre.",
      "Digitar bem é uma habilidade que acompanha a vida inteira.",
    ],
  },
];

/** Fileiras de um teclado ABNT2 simplificado. */
export const FILEIRAS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ç"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", ";"],
];

/** Dedo responsável por cada tecla: 0 mindinho esquerdo … 9 mindinho direito. */
const DEDO: Record<string, number> = {};
[
  ["qaz", 0],
  ["wsx", 1],
  ["edc", 2],
  ["rfvtgb", 3],
  ["yhnujm", 6],
  ["ik,", 7],
  ["ol.", 8],
  ["pç;", 9],
].forEach(([teclas, dedo]) => {
  for (const t of teclas as string) DEDO[t] = dedo as number;
});

export const COR_DEDO = [
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#22c55e",
  "#38bdf8",
  "#38bdf8",
  "#8b5cf6",
  "#d946ef",
  "#ec4899",
];

export function dedoDe(tecla: string): number {
  return DEDO[tecla] ?? 4;
}

/** Tira acento e caixa: o aluno não precisa acertar "ç" ou "ã" com tecla morta. */
export function base(c: string): string {
  return c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
