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

/**
 * Aula cadastrada manualmente pelo administrador na tela "Aulas": define
 * turma, horário, grupo fixo (opcional) e conteúdo. Tem prioridade sobre o
 * rodízio automático e alimenta o cronômetro ao vivo.
 */
export interface AulaManual {
  id: string;
  /** Rótulo do dia da semana, ex.: "Segunda". */
  dia: string;
  inicio: string;
  fim: string;
  turmaId: string;
  /** Quando definido, só este grupo ocupa a aula inteira. */
  grupoId?: string | undefined;
  conteudo?: string | undefined;
}

/**
 * Reagendamento de uma sessão específica (não repete nas semanas seguintes):
 * a data/horário original é marcada como suspensa automaticamente e uma nova
 * data/horário passa a valer só para aquela ocorrência. Criado a partir da
 * tela "Faltas do mês" ao reprogramar uma aula.
 */
export interface Reprogramacao {
  id: string;
  turmaId: string;
  dataOriginal: string;
  diaOriginal: string;
  inicioOriginal: string;
  fimOriginal: string;
  dataNova: string;
  inicio: string;
  fim: string;
  conteudo?: string | undefined;
  criadoEm: string;
}

export interface ScheduleConfig {
  nomeEscola: string;
  inep: string;
  endereco: string;
  professorInformatica: string;
  diasSemana: string[];
  horaInicio: string;
  horaFim: string;
  /** Almoço/descanso (o intervalo mais longo do dia). */
  intervaloInicio: string;
  intervaloFim: string;
  /** Recreio da manhã — curto, opcional. Sem valor, o dia só tem o intervalo do almoço. */
  recreioInicio?: string | undefined;
  recreioFim?: string | undefined;
  duracaoSlotMinutos: number;
  duracaoGrupoMinutos: number;
  numeroComputadores: number;
  /** Conteúdo programático exibido no cronômetro, por dia da semana. */
  conteudoPorDia?: Record<string, string> | undefined;
  /** Aulas cadastradas manualmente (tela "Aulas"), com prioridade sobre o rodízio. */
  aulas?: AulaManual[] | undefined;
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
  /**
   * Troca pontual de turma válida só para UMA data específica — diferente de
   * `slotOverrides`, que repete toda semana. Usada para exceções (ex: "só
   * amanhã, esse horário é de outra turma"). Some sozinha depois do dia
   * passar. Chave: `${data ISO}|${dia}|${slot.inicio}`, valor: id da turma.
   */
  excecoesPorData?: Record<string, string> | undefined;
  /** Sessões reprogramadas a partir da tela "Faltas do mês". */
  reprogramacoes?: Reprogramacao[] | undefined;
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
  /** Conteúdo definido na aula cadastrada manualmente. */
  conteudo?: string | undefined;
  /** Grupo fixo definido na aula cadastrada manualmente. */
  grupoIdFixo?: string | undefined;
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
