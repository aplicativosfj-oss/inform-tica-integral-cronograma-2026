/**
 * Tipos das duas avaliações diagnósticas da SEME.
 *
 * As duas chegam em formatos diferentes, e essa diferença manda no que cada
 * uma consegue responder:
 *
 * - A **I** vem numa planilha única da rede, fechada por turma: percentuais
 *   de acerto, faixas de desempenho e níveis de escrita. Não traz aluno.
 * - A **II** vem numa planilha por turma, com a resposta de cada criança em
 *   cada questão ("C" para certo, qualquer outra letra para errado). É a
 *   única que permite olhar aluno a aluno.
 */

/** Uma turma+disciplina na I Avaliação (uma linha da planilha da rede). */
export interface TurmaI {
  ano: number;
  turma: string;
  turno: string;
  disc: "LP" | "MAT";
  participantes: number;
  faltosos: number;
  /** Média global de 0 a 100 calculada pela SEME. */
  media: number | null;
  /** Parte da turma com desempenho igual ou maior que 50% ("notas azuis"). */
  azuis: number | null;
  faixas: {
    insuficiente: number | null;
    regular: number | null;
    bom: number | null;
    otimo: number | null;
  };
  /** Psicogênese da escrita (1º e 2º anos): de A (alfabética) a E (não escreveu). */
  escrita: Record<"A" | "B" | "C1" | "C2" | "C3" | "D" | "E", number | null>;
  alfabeticos: number | null;
  /** Erros de ortografia (3º ao 5º ano): A sem erros … E escrita não alfabética. */
  ortografia: Record<"A" | "B" | "C" | "D" | "E", number | null>;
  redacao: Record<"pouco" | "mediano" | "adequado", number | null>;
  questoes: { q: number; acerto: number; hab: string }[];
}

export interface MediaRede {
  media: number | null;
  azuis: number | null;
  alfabeticos: number | null;
  /** Provas somadas nessa média. */
  n: number;
}

export interface DadosI {
  aplicacao: "I";
  titulo: string;
  escola: string;
  municipio: string;
  turmas: TurmaI[];
  /** Chave `${disc}-${ano}`: como foram Feijó e o Acre na mesma prova. */
  referencias: Record<string, { feijo: MediaRede; acre: MediaRede }>;
  /** Chave `${disc}-${ano}-${questao}`: texto da habilidade avaliada. */
  habilidades: Record<string, string>;
}

/** Uma turma+disciplina na II Avaliação, com as respostas de cada aluno. */
export interface ProvaII {
  ano: number;
  turma: string;
  disc: "LP" | "MAT" | "CN";
  /** Chave: número da questão. Valor: habilidade avaliada. */
  hab: Record<string, string>;
  /** `r`: uma letra por questão, "C" quando acertou. `esc`: nível de escrita. */
  alunos: { nome: string; r: string; esc?: string }[];
}

export const NOME_DISC: Record<string, string> = {
  LP: "Língua Portuguesa",
  MAT: "Matemática",
  CN: "Ciências",
};
