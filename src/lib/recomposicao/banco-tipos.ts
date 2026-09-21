import type { Questao } from "@/components/school/ferramentas/quiz";
import type { Nivel, Serie } from "@/lib/recomposicao/geradores";

export interface NivelBanco {
  texto?: { titulo: string; paragrafos: string[] };
  questoes: Questao[];
}

/**
 * Atividade escrita à mão (Português e Ciências), ligada às habilidades da
 * II Avaliação Diagnóstica pelo texto da habilidade, como aparece na
 * planilha (comparado sem acentos e sem diferença de maiúsculas).
 */
export interface AtividadeBanco {
  id: string;
  disc: "LP" | "CN";
  series: Serie[];
  titulo: string;
  emoji: string;
  conteudo: string;
  habilidades: string[];
  niveis: Record<Nivel, NivelBanco>;
  /** Como fazer em sala, fora da tela. */
  emSala: string[];
}
