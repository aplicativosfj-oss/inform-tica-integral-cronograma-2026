/**
 * Chaves que ligam e desligam partes do sistema, sem apagar nenhum dado.
 *
 * PROGRAMACAO_ATIVA: o cronograma automático, o rodízio por grupos, as aulas
 * cadastradas, as reprogramações e o calendário da agenda. Foi desligado
 * quando o controle por laboratório (src/lib/laboratorio.ts) passou a ser o
 * jeito de organizar quem vai ao laboratório. Tudo o que a programação
 * gravou continua no banco; para voltar, basta trocar para `true`.
 */
export const PROGRAMACAO_ATIVA = false as boolean;

/**
 * Como os nomes dos alunos aparecem na home pública:
 * - "completo": nome inteiro para qualquer visitante (decisão da escola);
 * - "inicial": primeiro nome e inicial do sobrenome (ex.: "Ana C.");
 * - "oculto": o público vê só a quantidade, sem nomes.
 * Quem está logado no painel sempre vê o nome completo.
 */
export const NOMES_NA_HOME = "completo" as "completo" | "inicial" | "oculto";

/** Alerta de repetição: a partir de quantas idas já feitas o aluno chama atenção. */
export const LIMITE_IDAS_SEMANA = 1;
export const LIMITE_IDAS_MES = 1;

/** Quantos alunos cabem no laboratório ao mesmo tempo (hoje são poucos computadores). */
export const LIMITE_ALUNOS_LAB = 10;
