/**
 * Rendimento bimestral por turma e disciplina.
 *
 * Só quantidades de alunos por faixa de nota. Os percentuais são sempre
 * calculados a partir delas (ver `percentuais`), nunca copiados da planilha.
 */
export type DisciplinaId = "LP" | "MAT" | "HIS" | "GEO" | "CIE" | "ER" | "ART" | "EF";

export interface RendimentoDisciplina {
  id: DisciplinaId;
  nome: string;
  /** Alunos avaliados. */
  total: number;
  /** Média padrão de qualidade: 7,0 a 10,0. */
  padrao: number;
  /** Média classificatória: 5,0 a 6,9. */
  classificatoria: number;
  /** Média inferior: 0 a 4,9. */
  inferior: number;
}

export interface RendimentoTurma {
  ano: number;
  turma: string;
  professor: string | null;
  disciplinas: RendimentoDisciplina[];
}

export interface RendimentoBimestre {
  titulo: string;
  bimestre: number;
  escola: string;
  turmas: RendimentoTurma[];
}

export function percentuais(d: RendimentoDisciplina) {
  const base = d.total || 1;
  return {
    padrao: d.padrao / base,
    classificatoria: d.classificatoria / base,
    inferior: d.inferior / base,
  };
}
