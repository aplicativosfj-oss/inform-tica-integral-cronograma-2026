/**
 * Entre Turnos: onde cada turma fica no intervalo das 11h às 13h, depois do
 * almoço, e quem acompanha cada uma.
 *
 * Fonte: "Cronograma de Atendimento às turmas, durante o período de 2h
 * correspondente ao repouso, no intervalo após o almoço" (Escola em Tempo
 * Integral Dr. Eiraldo Carneiro de França) e a escala da Sala de Jogos
 * (segunda 1º ano, terça 2º, quarta 3º, quinta 4º, sexta 5º).
 */

/** 1 = segunda … 5 = sexta, como `Date.getDay()`. */
export type DiaUtil = 1 | 2 | 3 | 4 | 5;

export type Espaco = "aula" | "filme" | "jogos";

export const HORARIO = { inicio: "11h", fim: "13h" } as const;

export const ESCOLA = "Escola em Tempo Integral Dr. Eiraldo Carneiro de França";

export const DIAS: { dia: DiaUtil; nome: string; curto: string }[] = [
  { dia: 1, nome: "Segunda-feira", curto: "Seg" },
  { dia: 2, nome: "Terça-feira", curto: "Ter" },
  { dia: 3, nome: "Quarta-feira", curto: "Qua" },
  { dia: 4, nome: "Quinta-feira", curto: "Qui" },
  { dia: 5, nome: "Sexta-feira", curto: "Sex" },
];

export const ESPACOS: Record<
  Espaco,
  {
    nome: string;
    chamada: string;
    texto: string;
    dias: string;
    /** Quem cuida do espaço, quando não são os monitores da própria turma. */
    responsavel?: string;
  }
> = {
  aula: {
    nome: "Sala de aula",
    chamada: "Repouso na própria sala",
    texto:
      "Depois do almoço, a turma descansa na sua sala, num ambiente calmo, para recuperar a energia antes das aulas da tarde. Os monitores da turma acompanham as crianças o tempo todo.",
    dias: "3 dias por semana",
  },
  filme: {
    nome: "Sala de filme",
    chamada: "Cinema da turma",
    texto:
      "Uma vez por semana, a turma vai à sala de filme e assiste a um filme ou desenho, junto com os seus monitores. É um momento de descanso que também ensina a ouvir, observar e conversar sobre histórias.",
    dias: "1 dia por semana",
  },
  jogos: {
    nome: "Sala de jogos",
    chamada: "Brincar e aprender juntos",
    texto:
      "Cada ano escolar tem o seu dia na sala de jogos. Os jogos trabalham regras, raciocínio, paciência, a vez do colega e o convívio em grupo.",
    dias: "1 dia por semana",
    responsavel: "Professor Benedito",
  },
};

export interface TurmaPausa {
  turma: string;
  /** Ano escolar: 1 a 5. */
  ano: number;
  /** Dias na sala de aula (repouso). */
  aula: DiaUtil[];
  filme: DiaUtil;
  monitores: string[];
}

export const TURMAS_PAUSA: TurmaPausa[] = [
  { turma: "1º A", ano: 1, aula: [2, 4, 5], filme: 3, monitores: ["Francisca Conceição", "Iara"] },
  { turma: "1º B", ano: 1, aula: [2, 4, 5], filme: 3, monitores: ["Alexandra"] },
  { turma: "2º A", ano: 2, aula: [1, 3, 5], filme: 4, monitores: ["Regina", "Daniel"] },
  { turma: "2º B", ano: 2, aula: [1, 3, 5], filme: 4, monitores: ["Ângela"] },
  { turma: "3º A", ano: 3, aula: [1, 2, 4], filme: 5, monitores: ["Michel", "Kellen"] },
  { turma: "3º B", ano: 3, aula: [1, 2, 4], filme: 5, monitores: ["Maria Sousa"] },
  { turma: "4º A", ano: 4, aula: [1, 3, 5], filme: 2, monitores: ["Roberlanjo", "Kallebe"] },
  { turma: "4º B", ano: 4, aula: [1, 3, 5], filme: 2, monitores: ["José Pinto"] },
  { turma: "5º A", ano: 5, aula: [2, 3, 4], filme: 1, monitores: ["Ivanildes"] },
  { turma: "5º B", ano: 5, aula: [2, 3, 4], filme: 1, monitores: ["Raimundo"] },
];

/**
 * Sala de repouso: não entra na escala. Fica aberta todos os dias, no mesmo
 * horário, para quem realmente quer dormir ou descansar.
 */
export const SALA_REPOUSO = {
  nome: "Sala de repouso",
  chamada: "Para quem quer dormir",
  texto:
    "Não faz parte da escala: fica aberta todos os dias, de segunda a sexta, para o aluno que realmente quer dormir ou descansar. É uma alternativa, não uma obrigação.",
  grupos: [
    { publico: "Meninas", local: "Sala de informática", responsavel: "Émily" },
    { publico: "Meninos", local: "Biblioteca", responsavel: "Mônica" },
  ],
} as const;

/** Dia da sala de jogos de cada ano escolar. */
export const JOGOS_POR_ANO: Record<number, DiaUtil> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 };

/**
 * Espaços da turma naquele dia. Normalmente é um só; se as duas escalas
 * mandarem a turma para dois lugares no mesmo dia, devolve os dois, para a
 * página mostrar o choque em vez de escolher um.
 */
export function espacosDoDia(t: TurmaPausa, dia: DiaUtil): Espaco[] {
  const out: Espaco[] = [];
  if (t.aula.includes(dia)) out.push("aula");
  if (t.filme === dia) out.push("filme");
  if (JOGOS_POR_ANO[t.ano] === dia) out.push("jogos");
  return out;
}

/** Turmas em cada espaço num dia. */
export function turmasNoDia(dia: DiaUtil): Record<Espaco, TurmaPausa[]> {
  const out: Record<Espaco, TurmaPausa[]> = { aula: [], filme: [], jogos: [] };
  for (const t of TURMAS_PAUSA) for (const e of espacosDoDia(t, dia)) out[e].push(t);
  return out;
}

export const TOTAL_MONITORES = new Set(TURMAS_PAUSA.flatMap((t) => t.monitores)).size;

/** Dia útil de hoje, ou `null` no fim de semana. */
export function diaUtilDeHoje(agora = new Date()): DiaUtil | null {
  const d = agora.getDay();
  return d >= 1 && d <= 5 ? (d as DiaUtil) : null;
}

export const juntarNomes = (nomes: string[]) =>
  nomes.length <= 1 ? (nomes[0] ?? "") : `${nomes.slice(0, -1).join(", ")} e ${nomes.at(-1)}`;
