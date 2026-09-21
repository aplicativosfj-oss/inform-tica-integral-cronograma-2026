/**
 * Guia rápido de especialidades do atendimento educacional especializado,
 * para apoiar o mediador/cuidador na escrita do relatório. É material de
 * orientação pedagógica — não serve para diagnosticar nem substitui o laudo
 * ou a avaliação dos profissionais de saúde que acompanham a criança.
 */
export interface Especialidade {
  id: string;
  nome: string;
  sigla?: string;
  resumo: string;
  caracteristicas: string[];
  estrategias: string[];
  /** Estratégias específicas para o laboratório de informática. */
  noLaboratorio: string[];
  /** Frases-modelo para iniciar trechos do relatório. */
  sugestoes: { desafios: string[]; potencialidades: string[]; recomendacoes: string[] };
}

export const ESPECIALIDADES: Especialidade[] = [
  {
    id: "tea",
    nome: "Transtorno do Espectro Autista",
    sigla: "TEA",
    resumo:
      "Condição do neurodesenvolvimento que afeta a comunicação social e o comportamento, com grande variação entre as pessoas (níveis de suporte 1, 2 e 3).",
    caracteristicas: [
      "Diferenças na comunicação verbal e não verbal e na interação social",
      "Preferência por rotina e previsibilidade; mudanças podem gerar desconforto",
      "Interesses específicos e intensos, que podem ser pontes para o aprendizado",
      "Sensibilidade sensorial (sons, luzes, texturas) acima ou abaixo da média",
    ],
    estrategias: [
      "Antecipar a rotina com apoio visual (quadro de etapas, imagens)",
      "Dar instruções curtas, uma de cada vez, e confirmar a compreensão",
      "Usar os interesses da criança como tema das atividades",
      "Oferecer pausas e um espaço de regulação quando houver sobrecarga",
    ],
    noLaboratorio: [
      "Avisar antes da troca de grupo e do fim da aula (o cronômetro ajuda)",
      "Reduzir o volume dos jogos ou usar fone quando houver incômodo sensorial",
      "Preferir jogos com regras claras, previsíveis e retorno imediato",
    ],
    sugestoes: {
      desafios: [
        "Demonstra desconforto em mudanças inesperadas da rotina, como a troca de grupo no laboratório.",
        "Apresenta dificuldade em manter a atenção em atividades longas sem mediação.",
      ],
      potencialidades: [
        "Mostra grande interesse e memória para temas do seu agrado, o que favorece o engajamento.",
        "Segue bem sequências de passos quando apresentadas com apoio visual.",
      ],
      recomendacoes: [
        "Manter a antecipação visual da rotina e avisar a troca de atividade com alguns minutos de antecedência.",
      ],
    },
  },
  {
    id: "tdah",
    nome: "Transtorno do Déficit de Atenção com Hiperatividade",
    sigla: "TDAH",
    resumo:
      "Condição do neurodesenvolvimento marcada por desatenção, hiperatividade e/ou impulsividade, que interfere na organização e na execução das tarefas.",
    caracteristicas: [
      "Dificuldade em sustentar a atenção e concluir tarefas",
      "Agitação motora e necessidade de movimento",
      "Impulsividade: responder antes do fim da pergunta, dificuldade em esperar a vez",
      "Criatividade e energia que rendem bem em atividades dinâmicas",
    ],
    estrategias: [
      "Dividir a tarefa em etapas curtas, com metas visíveis",
      "Reforçar positivamente cada etapa concluída",
      "Posicionar a criança longe de distrações e perto do mediador",
      "Permitir pausas ativas planejadas",
    ],
    noLaboratorio: [
      "Atividades curtas e com retorno imediato (jogos com fases)",
      "Combinar antes o objetivo da aula e revisar ao final",
      "Evitar muitas abas/janelas abertas ao mesmo tempo",
    ],
    sugestoes: {
      desafios: [
        "Tende a iniciar várias atividades sem concluí-las quando não há mediação próxima.",
      ],
      potencialidades: [
        "Responde muito bem a desafios curtos e dinâmicos, com entusiasmo e rapidez.",
      ],
      recomendacoes: [
        "Seguir com metas curtas por atividade e reforço positivo a cada etapa concluída.",
      ],
    },
  },
  {
    id: "di",
    nome: "Deficiência Intelectual",
    sigla: "DI",
    resumo:
      "Limitações no funcionamento intelectual e no comportamento adaptativo, que pedem mais tempo, concretude e repetição para a aprendizagem.",
    caracteristicas: [
      "Ritmo de aprendizagem próprio, que se beneficia de repetição",
      "Melhor compreensão com materiais concretos e exemplos práticos",
      "Dificuldade com conceitos abstratos e instruções longas",
    ],
    estrategias: [
      "Linguagem simples e demonstração prática antes da tentativa",
      "Repetir e retomar o conteúdo em diferentes formatos",
      "Valorizar o progresso em relação à própria criança, não à turma",
    ],
    noLaboratorio: [
      "Jogos de associação imagem–palavra e de sequência simples",
      "Mediação mão sobre mão no uso inicial do mouse, retirando o apoio aos poucos",
    ],
    sugestoes: {
      desafios: [
        "Necessita de mediação constante para compreender o objetivo de atividades novas.",
      ],
      potencialidades: ["Demonstra persistência e alegria ao repetir atividades que já domina."],
      recomendacoes: ["Retomar as atividades da aula anterior antes de apresentar conteúdo novo."],
    },
  },
  {
    id: "down",
    nome: "Síndrome de Down",
    sigla: "T21",
    resumo:
      "Condição genética (trissomia do cromossomo 21) associada a deficiência intelectual em graus variados e a particularidades motoras e de linguagem.",
    caracteristicas: [
      "Aprendizagem favorecida pela via visual",
      "Tônus muscular reduzido, que pode afetar a coordenação fina (mouse, teclado)",
      "Boa sociabilidade e aprendizagem por imitação",
    ],
    estrategias: [
      "Apoio visual e modelagem (mostrar fazendo)",
      "Atividades de coordenação motora fina graduais",
      "Tempo extra para resposta, sem antecipar pela criança",
    ],
    noLaboratorio: [
      "Mouse de tamanho adequado e ajuste de velocidade do ponteiro",
      "Jogos de arrastar e clicar com alvos grandes",
    ],
    sugestoes: {
      desafios: ["Apresenta dificuldade de precisão no uso do mouse em alvos pequenos."],
      potencialidades: [
        "Aprende rapidamente por imitação e interage com afeto com colegas e adultos.",
      ],
      recomendacoes: [
        "Priorizar atividades com alvos grandes e aumentar a precisão exigida aos poucos.",
      ],
    },
  },
  {
    id: "da",
    nome: "Deficiência Auditiva / Surdez",
    sigla: "DA",
    resumo:
      "Perda auditiva parcial ou total. Muitas crianças surdas têm a Libras como primeira língua e o português escrito como segunda.",
    caracteristicas: [
      "Comunicação predominantemente visual (Libras, leitura labial, gestos)",
      "Dificuldade com instruções apenas orais e com sons de jogos",
    ],
    estrategias: [
      "Falar de frente, com boa iluminação, e usar Libras/apoio visual",
      "Registrar instruções por escrito ou em imagens",
      "Garantir a presença do intérprete quando houver",
    ],
    noLaboratorio: [
      "Ativar legendas e preferir jogos que não dependam de pistas sonoras",
      "Usar sinais visuais combinados para início e troca de grupo",
    ],
    sugestoes: {
      desafios: ["Perde informações de jogos que usam pistas apenas sonoras."],
      potencialidades: ["Tem ótima percepção visual e atenção aos detalhes da tela."],
      recomendacoes: [
        "Selecionar atividades com legenda ou retorno visual e combinar sinais visuais de rotina.",
      ],
    },
  },
  {
    id: "dv",
    nome: "Deficiência Visual / Baixa Visão",
    sigla: "DV",
    resumo:
      "Cegueira ou baixa visão. O acesso ao computador depende de ampliação, contraste e/ou leitores de tela.",
    caracteristicas: [
      "Necessidade de ampliação, alto contraste ou recursos sonoros",
      "Orientação espacial na tela e no teclado pode exigir treino",
    ],
    estrategias: [
      "Ampliar fonte e cursor, usar alto contraste",
      "Descrever verbalmente o que aparece na tela",
      "Ensinar atalhos de teclado e a posição das teclas-guia (F e J)",
    ],
    noLaboratorio: [
      "Ativar a lupa do sistema e o leitor de tela quando necessário",
      "Posicionar a criança longe de reflexos de luz na tela",
    ],
    sugestoes: {
      desafios: ["Precisa de ampliação da tela para localizar botões e ícones."],
      potencialidades: ["Memoriza com facilidade a posição das teclas e os atalhos."],
      recomendacoes: ["Manter a configuração de ampliação salva no computador que a criança usa."],
    },
  },
  {
    id: "df",
    nome: "Deficiência Física / Motora",
    sigla: "DF",
    resumo:
      "Limitações de mobilidade ou coordenação (ex.: paralisia cerebral) que pedem adaptações de acesso, postura e tempo.",
    caracteristicas: [
      "Dificuldade de coordenação motora fina ou grossa",
      "Pode precisar de recursos de tecnologia assistiva (acionadores, teclado adaptado)",
    ],
    estrategias: [
      "Adequar mobiliário e postura antes da atividade",
      "Oferecer tempo estendido e recursos de acessibilidade do sistema",
    ],
    noLaboratorio: [
      "Ativar teclas de aderência e ajustar a velocidade do mouse",
      "Usar jogos que aceitem teclado ou toque, além do mouse",
    ],
    sugestoes: {
      desafios: ["Precisa de mais tempo e apoio para realizar cliques precisos."],
      potencialidades: [
        "Demonstra compreensão clara das atividades e grande vontade de participar.",
      ],
      recomendacoes: ["Avaliar com a coordenação o uso de recursos de tecnologia assistiva."],
    },
  },
  {
    id: "dislexia",
    nome: "Transtornos de Aprendizagem (Dislexia, Discalculia)",
    resumo:
      "Dificuldades específicas na leitura, escrita ou matemática, sem relação com a inteligência da criança.",
    caracteristicas: [
      "Leitura lenta ou com trocas de letras; dificuldade com enunciados longos",
      "Dificuldade com números, operações ou sequências (discalculia)",
    ],
    estrategias: [
      "Ler os enunciados junto com a criança",
      "Fontes maiores e sem serifa, com espaçamento amplo",
      "Valorizar respostas orais e por imagem",
    ],
    noLaboratorio: [
      "Jogos de consciência fonológica e de quantidades com apoio visual",
      "Recursos de leitura em voz alta do navegador",
    ],
    sugestoes: {
      desafios: ["Apresenta dificuldade na leitura autônoma das instruções dos jogos."],
      potencialidades: ["Compreende bem as regras quando explicadas oralmente."],
      recomendacoes: ["Oferecer a leitura mediada das instruções e jogos com apoio sonoro."],
    },
  },
  {
    id: "ah",
    nome: "Altas Habilidades / Superdotação",
    sigla: "AH/SD",
    resumo:
      "Potencial elevado em uma ou mais áreas, com criatividade e envolvimento com a tarefa acima do esperado para a idade.",
    caracteristicas: [
      "Aprende rápido e pode se desinteressar com atividades repetitivas",
      "Curiosidade intensa e perguntas aprofundadas",
    ],
    estrategias: [
      "Oferecer desafios de maior complexidade e projetos",
      "Permitir que ajude colegas, com cuidado para não sobrecarregar",
    ],
    noLaboratorio: ["Atividades de lógica, programação em blocos e criação"],
    sugestoes: {
      desafios: ["Perde o interesse quando a atividade é repetitiva ou abaixo do seu nível."],
      potencialidades: ["Resolve rapidamente desafios de lógica e propõe soluções criativas."],
      recomendacoes: ["Oferecer níveis mais avançados e pequenos projetos de criação."],
    },
  },
  {
    id: "outra",
    nome: "Outra condição / em avaliação",
    resumo:
      "Use quando a especialidade não estiver na lista ou a criança ainda estiver em processo de avaliação. Descreva o que foi observado, sem rótulos.",
    caracteristicas: ["Registre comportamentos observados, não suposições diagnósticas"],
    estrategias: ["Observar, registrar e compartilhar com a coordenação e a família"],
    noLaboratorio: ["Anotar quais atividades geram mais engajamento e quais geram desconforto"],
    sugestoes: {
      desafios: [],
      potencialidades: [],
      recomendacoes: ["Encaminhar as observações à coordenação para acompanhamento."],
    },
  },
];

/** Tenta casar o texto livre do cadastro ("TEA nível 1", "autismo"...) com o guia. */
export function especialidadeDoCadastro(texto: string | undefined): Especialidade | undefined {
  if (!texto) return undefined;
  const t = texto.toLowerCase();
  const regras: [RegExp, string][] = [
    [/\btea\b|autis/, "tea"],
    [/tdah|hiperativ|déficit de atenção|deficit de atencao/, "tdah"],
    [/down|t21|trissomia/, "down"],
    [/intelectual|\bdi\b/, "di"],
    [/auditiv|surd|libras/, "da"],
    [/visual|cegu|baixa vis/, "dv"],
    [/f[ií]sic|motor|paralisia/, "df"],
    [/dislex|discalc|aprendizagem/, "dislexia"],
    [/altas habil|superdot/, "ah"],
  ];
  const id = regras.find(([re]) => re.test(t))?.[1];
  return ESPECIALIDADES.find((e) => e.id === id);
}
