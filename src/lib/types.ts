export interface Aluno {
  id: string;
  nome: string;
  foto?: string | undefined;
  /** Grupo de revezamento ao qual o aluno pertence (opcional). */
  grupoId?: string | undefined;
  /** Marca o aluno como necessitando de atendimento especializado (mediador/cuidador). */
  necessidadeEspecial?: boolean | undefined;
  /** Orientações para adaptar as atividades de informática a esse aluno. */
  observacoesNecessidade?: string | undefined;
}

/** Profissional de apoio (mediador/cuidador) designado oficialmente para a turma. */
export interface ApoioEspecial {
  nome: string;
  funcao: "Mediador(a)" | "Cuidador(a)";
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
  /** Mediadores/cuidadores oficialmente designados para essa turma. */
  apoioEspecial?: ApoioEspecial[] | undefined;
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
  /**
   * Troca manual de turma para um horário fixo da grade semanal, feita pelo
   * administrador na página de Programação. Chave: `${dia}|${slot.inicio}`,
   * valor: id da turma que deve ocupar esse horário no lugar do rodízio
   * automático.
   */
  slotOverrides?: Record<string, string> | undefined;
  /**
   * Aulas paradas pelo administrador para uma data específica (não repete nas
   * semanas seguintes). Chave: `${data ISO}|${dia}|${slot.inicio}`.
   */
  suspensoes?: Record<string, true> | undefined;
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

/** Registro de frequência de um aluno em uma data específica (tabela `presencas` no Supabase). */
export interface Presenca {
  id: string;
  /** Data no formato YYYY-MM-DD. */
  data: string;
  turmaId: string;
  alunoId: string;
  alunoNome: string;
  grupoIndice: number;
  status: "presente" | "faltou" | "substituido";
  /** Preenchido quando `status` é "substituido": id do aluno que faltou e foi substituído. */
  substitutoDeAlunoId?: string | undefined;
  /** Preenchido quando `status` é "faltou": "ausente" ou "nao_quis_participar". */
  motivo?: string | undefined;
  criadoEm: string;
}
