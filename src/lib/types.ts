export interface Aluno {
  id: string;
  nome: string;
  foto?: string | undefined;
  /** Grupo de revezamento ao qual o aluno pertence (opcional). */
  grupoId?: string | undefined;
}

/** Grupo de revezamento cadastrado manualmente pelo administrador. */
export interface Grupo {
  id: string;
  nome: string;
  /** Conteúdo previsto para este grupo, exibido no cronômetro ao vivo. */
  conteudo?: string | undefined;
}

export interface Turma {
  id: string;
  serie: string;
  letra: string;
  professorRegente: string;
  imagem?: string | undefined;
  alunos: Aluno[];
  grupos?: Grupo[] | undefined;
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
