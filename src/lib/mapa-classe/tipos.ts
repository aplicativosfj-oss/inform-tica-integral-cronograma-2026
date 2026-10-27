/**
 * Mapa de Classe de escrita e leitura (modelo SEME), em quantidades por turma.
 * Nunca guarda nome de aluno.
 */
export type NivelLeitura = "A" | "B" | "C" | "D" | "E";
export type NivelEscrita = "A" | "B" | "C1" | "C2" | "C3" | "C" | "D" | "E";

export interface TurmaMapa {
  ano: number;
  turma: string;
  professor: string;
  /** Alunos na lista da turma (matriculados e frequentando). */
  listados: number;
  /** Alunos da lista sem nenhuma marcação de escrita nem de leitura. */
  semRegistro: number;
  escrita: Partial<Record<NivelEscrita, number>>;
  leitura: Record<NivelLeitura, number>;
  avaliadosEscrita: number;
  avaliadosLeitura: number;
  /** Total de avaliados que a aba "Mapa de Classe de Leitura" informa para o 3º bimestre. */
  avaliadosAbaLeitura: number;
  /** Totais que a planilha mostra na linha "Total" (podem divergir da contagem das marcações). */
  totaisPlanilhaEscrita: Partial<Record<NivelEscrita, number>>;
}

export interface EvolucaoLeitura {
  bim: number;
  avaliados: number;
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
}

export interface MapaClasseBimestre {
  bimestre: number;
  escola: string;
  turmas: TurmaMapa[];
  /** Chave "1A", "1B"… com os bimestres 1, 2 e 3 da aba de leitura. */
  evolucaoLeitura: Record<string, EvolucaoLeitura[]>;
}
