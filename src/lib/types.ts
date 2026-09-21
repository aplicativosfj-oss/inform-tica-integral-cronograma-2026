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
  /**
   * Impedido de participar do rodízio por decisão do(a) professor(a) — ex.:
   * não cumpriu as tarefas em sala. Enquanto marcado, a chamada e a seleção
   * do dia pulam esse aluno automaticamente e chamam o próximo da vez. Só é
   * definido/removido por quem está logado (painel administrativo).
   */
  impedido?: boolean | undefined;
  /** Motivo do impedimento, registrado por quem marcou. */
  motivoImpedimento?: string | undefined;
  /** Data de nascimento (YYYY-MM-DD) — usada para mostrar a idade no espaço do apoio. */
  nascimento?: string | undefined;
  /** Especialidade/laudo do atendimento especializado (ex.: TEA, deficiência auditiva). */
  especialidade?: string | undefined;
}

/** Profissional de apoio (mediador/cuidador) designado oficialmente para a turma. */
export interface ApoioEspecial {
  nome: string;
  funcao: "Mediador(a)" | "Cuidador(a)";
  /**
   * Alunos que este profissional acompanha. Quando vazio, o sistema reparte
   * os alunos com atendimento especializado entre os profissionais da turma
   * (ver `alunosDoApoio` em profissional-acesso.ts).
   */
  alunosIds?: string[] | undefined;
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
  /** Por que a turma não pôde ter a aula original (ex.: passeio, avaliação). */
  motivo?: string | undefined;
  /**
   * Quando a nova data ocupou a sessão extra de outra turma, essa sessão fica
   * suspensa junto — e volta a valer se a reprogramação for desfeita.
   */
  slotDeslocado?: { data: string; dia: string; inicio: string; turmaId: string } | undefined;
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
  /**
   * Data (YYYY-MM-DD) a partir da qual a frequência registrada conta como
   * real. Qualquer presença/falta salva antes dela é tratada como teste
   * interno (feito durante a configuração do sistema) e fica oculta dos
   * relatórios, para não ser confundida com uso de verdade da escola.
   */
  dataInicioOperacao?: string | undefined;
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
  /** Motivo de uma aula suspensa sem reprogramação. Mesma chave de `suspensoes`. */
  motivosSuspensao?: Record<string, string> | undefined;
  /**
   * Observação registrada pelo professor sobre o que aconteceu numa aula
   * (ex.: "grupo 2 saiu mais cedo para ensaio"). Mesma chave de `suspensoes`;
   * aparece no Diário das aulas, aberto ao público.
   */
  observacoesAula?: Record<string, string> | undefined;
  /**
   * Coordenação do Atendimento Educacional Especializado (AEE). Quem ocupa
   * o cargo recebe uma senha mestra que abre a área de qualquer mediador ou
   * cuidador da escola.
   */
  coordenacaoAEE?: { nome: string } | undefined;
}

export interface Slot {
  inicio: string;
  fim: string;
}

/** Um grupo (já sobrando de outra turma) que ocupa só uma fração de um horário misto. */
export interface GrupoMisto {
  turma: Turma;
  /** Índice do grupo (dentro de `buildGrupos(turma, config)`) que usa essa fração. */
  grupoIndice: number;
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
  /**
   * Horário "misto": em vez de uma turma inteira, várias turmas mandam só o
   * grupo que sobrou da sua sessão principal da semana (7 computadores não
   * dão pra todo mundo de uma vez). Quando presente, `turma` acima é só a
   * primeira do grupo (compatibilidade com código que ainda não sabe ler
   * `misto`) — a fonte de verdade é este array.
   */
  misto?: GrupoMisto[] | undefined;
}

/**
 * Atividade remota atribuída pelo professor a uma turma inteira (tabela
 * `atividades` no Supabase) — o aluno acessa pela Área do Aluno e marca como
 * concluída; o professor acompanha o andamento pelo dashboard.
 */
export interface Atividade {
  id: string;
  turmaId: string;
  titulo: string;
  descricao?: string | undefined;
  /** Link da ferramenta/jogo (ex.: um item da Infoteca), opcional. */
  url?: string | undefined;
  /** Data no formato YYYY-MM-DD a que a atividade se refere. */
  data: string;
  criadoEm: string;
}

/** Andamento de uma atividade para um aluno específico (tabela `atividades_status`). */
export interface AtividadeStatus {
  atividadeId: string;
  alunoId: string;
  status: "pendente" | "concluida";
  concluidoEm?: string | undefined;
}

/** Um acesso do aluno à própria área (tabela `aluno_acessos`), usado para "último acesso" e timeline. */
export interface AlunoAcesso {
  id: string;
  alunoId: string;
  turmaId: string;
  acessadoEm: string;
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
