export interface Aluno {
  id: string;
  nome: string;
  foto?: string | undefined;
}

export interface Turma {
  id: string;
  serie: string;
  letra: string;
  professorRegente: string;
  imagem?: string | undefined;
  alunos: Aluno[];
}

export interface ScheduleConfig {
  nomeEscola: string;
  inep: string;
  endereco: string;
  professorInformatica: string;
  diasSemana: string[];
  horaInicio: string;
  horaFim: string;
  intervaloInicio: string;
  intervaloFim: string;
  duracaoSlotMinutos: number;
  duracaoGrupoMinutos: number;
  numeroComputadores: number;
  /** Conteúdo programático exibido no cronômetro, por dia da semana. */
  conteudoPorDia?: Record<string, string> | undefined;
}

export interface Slot {
  inicio: string;
  fim: string;
}

export interface Assignment {
  dia: string;
  diaIndex: number;
  slot: Slot;
  turma: Turma;
  ocorrenciaIndex: number;
  sessoesPorSemana: number;
}
