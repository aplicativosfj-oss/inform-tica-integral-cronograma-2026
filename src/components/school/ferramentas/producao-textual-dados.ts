/**
 * Conteúdo do assistente de produção textual: os gêneros que a escola pede
 * do 1º ao 5º ano, o que cada um tem dentro, e o banco de palavras de apoio
 * com o significado explicado em linguagem de criança.
 *
 * Duas decisões que valem para o arquivo inteiro:
 *
 * - cada gênero tem uma série mínima. Bilhete e recado o 1º ano já escreve;
 *   dissertação só aparece no 5º. A ferramenta some com o que ainda não é
 *   hora, em vez de oferecer e deixar a criança travar;
 * - cada palavra de apoio tem nível (1 a 3) e explicação. A criança de 2º ano
 *   recebe "depois" e "então"; a de 5º recebe também "no entanto" e
 *   "portanto", sempre com o que a palavra quer dizer e um exemplo de uso.
 */

export type Serie = 1 | 2 | 3 | 4 | 5;

export const SERIES: { id: Serie; nome: string }[] = [
  { id: 1, nome: "1º ano" },
  { id: 2, nome: "2º ano" },
  { id: 3, nome: "3º ano" },
  { id: 4, nome: "4º ano" },
  { id: 5, nome: "5º ano" },
];

/* ------------------------------------------------------------------ */
/* Banco de palavras de apoio                                          */
/* ------------------------------------------------------------------ */

export type Categoria =
  | "comecar"
  | "tempo"
  | "causa"
  | "oposicao"
  | "adicao"
  | "terminar"
  | "falar"
  | "pessoas"
  | "lugares"
  | "opiniao"
  | "saudacao"
  | "despedida";

export interface PalavraApoio {
  palavra: string;
  /** O que a palavra quer dizer, do jeito que se explica para criança. */
  significado: string;
  exemplo: string;
  /** 1 = todo mundo entende; 2 = do 3º ano em diante; 3 = 4º e 5º ano. */
  nivel: 1 | 2 | 3;
}

export const CATEGORIAS: { id: Categoria; nome: string; paraQue: string }[] = [
  { id: "comecar", nome: "Para começar", paraQue: "abrir o texto sem ficar travado" },
  { id: "tempo", nome: "Para continuar", paraQue: "mostrar o que veio depois" },
  { id: "causa", nome: "Para explicar", paraQue: "dizer o motivo das coisas" },
  { id: "oposicao", nome: "Para mudar de ideia", paraQue: "mostrar o contrário do que veio antes" },
  { id: "adicao", nome: "Para acrescentar", paraQue: "juntar mais uma informação" },
  { id: "terminar", nome: "Para terminar", paraQue: "fechar o texto" },
  { id: "falar", nome: "Em vez de 'falou'", paraQue: "mostrar como a pessoa falou" },
  { id: "pessoas", nome: "Descrever pessoas", paraQue: "dizer como o personagem é" },
  { id: "lugares", nome: "Descrever lugares", paraQue: "fazer o leitor enxergar o lugar" },
  { id: "opiniao", nome: "Dar opinião", paraQue: "dizer o que você acha" },
  { id: "saudacao", nome: "Começar a carta", paraQue: "falar com quem vai ler" },
  { id: "despedida", nome: "Se despedir", paraQue: "terminar um bilhete ou carta" },
];

export const PALAVRAS: Record<Categoria, PalavraApoio[]> = {
  comecar: [
    {
      palavra: "Era uma vez",
      significado: "O jeito clássico de começar história inventada.",
      exemplo: "Era uma vez uma menina que morava perto do rio.",
      nivel: 1,
    },
    {
      palavra: "Certo dia",
      significado: "Um dia qualquer, sem dizer qual.",
      exemplo: "Certo dia, o cachorro sumiu do quintal.",
      nivel: 1,
    },
    {
      palavra: "Naquela manhã",
      significado: "Situa a cena numa manhã que o leitor já vai imaginar.",
      exemplo: "Naquela manhã, a chuva não parava.",
      nivel: 2,
    },
    {
      palavra: "Há muito tempo",
      significado: "Faz tempo mesmo — bom para lenda.",
      exemplo: "Há muito tempo, quando a floresta era maior...",
      nivel: 2,
    },
    {
      palavra: "Conta-se que",
      significado: "As pessoas contam, mas ninguém sabe se é verdade. É a abertura da lenda.",
      exemplo: "Conta-se que um boto vira rapaz nas noites de festa.",
      nivel: 3,
    },
    {
      palavra: "Você sabia que",
      significado: "Chama a atenção do leitor para uma informação nova.",
      exemplo: "Você sabia que o açaí nasce numa palmeira bem alta?",
      nivel: 2,
    },
  ],
  tempo: [
    {
      palavra: "depois",
      significado: "O que veio em seguida.",
      exemplo: "Comeu, depois foi brincar.",
      nivel: 1,
    },
    {
      palavra: "então",
      significado: "Liga o que aconteceu com o que veio por causa disso.",
      exemplo: "Chegou tarde, então perdeu o ônibus.",
      nivel: 1,
    },
    {
      palavra: "de repente",
      significado: "Aconteceu de surpresa, sem ninguém esperar.",
      exemplo: "De repente, a luz apagou.",
      nivel: 1,
    },
    {
      palavra: "logo em seguida",
      significado: "Bem depressa depois da outra coisa.",
      exemplo: "Ouviu o barulho e, logo em seguida, correu.",
      nivel: 2,
    },
    {
      palavra: "enquanto isso",
      significado: "Duas coisas acontecendo ao mesmo tempo, em lugares diferentes.",
      exemplo: "Enquanto isso, a mãe procurava na cozinha.",
      nivel: 2,
    },
    {
      palavra: "mais tarde",
      significado: "Depois de um tempo maior.",
      exemplo: "Mais tarde, todos já tinham esquecido o susto.",
      nivel: 2,
    },
    {
      palavra: "finalmente",
      significado: "Depois de muita espera, aconteceu.",
      exemplo: "Finalmente a chuva parou.",
      nivel: 3,
    },
  ],
  causa: [
    {
      palavra: "porque",
      significado: "Diz o motivo.",
      exemplo: "Ficou em casa porque estava doente.",
      nivel: 1,
    },
    {
      palavra: "por isso",
      significado: "Aponta o resultado do que foi dito antes.",
      exemplo: "Estava chovendo, por isso a aula foi na sala.",
      nivel: 1,
    },
    {
      palavra: "já que",
      significado: "Como isso é verdade, então acontece aquilo.",
      exemplo: "Já que todos chegaram, podemos começar.",
      nivel: 2,
    },
    {
      palavra: "assim",
      significado: "Desse jeito; leva ao resultado.",
      exemplo: "Estudou bastante e, assim, tirou uma boa nota.",
      nivel: 2,
    },
    {
      palavra: "portanto",
      significado: "Por causa de tudo isso. Usa-se para concluir.",
      exemplo: "A água é vida; portanto, não devemos desperdiçá-la.",
      nivel: 3,
    },
  ],
  oposicao: [
    {
      palavra: "mas",
      significado: "O contrário do que se esperava.",
      exemplo: "Queria brincar, mas tinha que estudar.",
      nivel: 1,
    },
    {
      palavra: "porém",
      significado: "Mesma coisa que 'mas', só que mais formal.",
      exemplo: "O dia estava bonito; porém, ninguém saiu.",
      nivel: 2,
    },
    {
      palavra: "no entanto",
      significado: "Apresenta uma ideia que vai contra a anterior.",
      exemplo: "Treinou muito; no entanto, perdeu o jogo.",
      nivel: 3,
    },
    {
      palavra: "apesar de",
      significado: "Mesmo com esse problema, a coisa aconteceu.",
      exemplo: "Apesar do cansaço, terminou a tarefa.",
      nivel: 3,
    },
  ],
  adicao: [
    {
      palavra: "também",
      significado: "Mais uma coisa igual à que já foi dita.",
      exemplo: "Ela canta e também dança.",
      nivel: 1,
    },
    {
      palavra: "além disso",
      significado: "Acrescenta mais um motivo ou informação.",
      exemplo: "É bonito. Além disso, é barato.",
      nivel: 2,
    },
    {
      palavra: "outra coisa importante",
      significado: "Avisa que vem mais um ponto que vale a pena.",
      exemplo: "Outra coisa importante: leve garrafa de água.",
      nivel: 2,
    },
  ],
  terminar: [
    {
      palavra: "no fim",
      significado: "Na última parte da história.",
      exemplo: "No fim, todos voltaram para casa.",
      nivel: 1,
    },
    {
      palavra: "e foi assim que",
      significado: "Fecha a história explicando como tudo terminou.",
      exemplo: "E foi assim que o menino aprendeu a nadar.",
      nivel: 1,
    },
    {
      palavra: "desde então",
      significado: "A partir daquele dia, ficou sempre assim. Ótimo para lenda.",
      exemplo: "Desde então, ninguém mais pescou naquele lago.",
      nivel: 2,
    },
    {
      palavra: "por fim",
      significado: "Para encerrar o que estava sendo dito.",
      exemplo: "Por fim, a turma agradeceu a visita.",
      nivel: 3,
    },
    {
      palavra: "concluindo",
      significado: "Vou dizer o resumo do que penso. Fecha uma dissertação.",
      exemplo: "Concluindo, cuidar do rio é tarefa de todos.",
      nivel: 3,
    },
  ],
  falar: [
    {
      palavra: "disse",
      significado: "Falou, do jeito comum.",
      exemplo: "— Vamos — disse Ana.",
      nivel: 1,
    },
    {
      palavra: "perguntou",
      significado: "Falou fazendo uma pergunta.",
      exemplo: "— Que horas são? — perguntou o menino.",
      nivel: 1,
    },
    {
      palavra: "gritou",
      significado: "Falou bem alto, com força.",
      exemplo: "— Cuidado! — gritou o pai.",
      nivel: 1,
    },
    {
      palavra: "respondeu",
      significado: "Falou depois de alguém perguntar.",
      exemplo: "— Já vou — respondeu ela.",
      nivel: 1,
    },
    {
      palavra: "sussurrou",
      significado: "Falou bem baixinho, quase no ouvido.",
      exemplo: "— É segredo — sussurrou a avó.",
      nivel: 2,
    },
    {
      palavra: "explicou",
      significado: "Falou para a pessoa entender melhor.",
      exemplo: "— A canoa vira assim — explicou o pescador.",
      nivel: 2,
    },
    {
      palavra: "murmurou",
      significado: "Falou baixo e meio sem vontade.",
      exemplo: "— Não foi nada — murmurou o menino.",
      nivel: 3,
    },
  ],
  pessoas: [
    {
      palavra: "curioso",
      significado: "Quer saber de tudo.",
      exemplo: "Um menino curioso.",
      nivel: 1,
    },
    {
      palavra: "corajoso",
      significado: "Não tem medo de encarar.",
      exemplo: "Uma menina corajosa.",
      nivel: 1,
    },
    {
      palavra: "teimoso",
      significado: "Não muda de ideia de jeito nenhum.",
      exemplo: "Um avô teimoso.",
      nivel: 1,
    },
    {
      palavra: "carinhoso",
      significado: "Trata bem, com afeto.",
      exemplo: "Uma tia carinhosa.",
      nivel: 1,
    },
    {
      palavra: "esperto",
      significado: "Pensa rápido e acha saída.",
      exemplo: "Um macaco esperto.",
      nivel: 1,
    },
    {
      palavra: "desconfiado",
      significado: "Acha que tem coisa errada e fica atento.",
      exemplo: "O vizinho desconfiado espiava pela janela.",
      nivel: 2,
    },
    {
      palavra: "orgulhoso",
      significado: "Muito contente com o que fez — ou cheio de si.",
      exemplo: "Ficou orgulhoso do próprio desenho.",
      nivel: 2,
    },
    {
      palavra: "generoso",
      significado: "Gosta de dar e de repartir.",
      exemplo: "Um vizinho generoso dividiu a farinha.",
      nivel: 3,
    },
  ],
  lugares: [
    {
      palavra: "enorme",
      significado: "Muito, muito grande.",
      exemplo: "Um quintal enorme.",
      nivel: 1,
    },
    { palavra: "escuro", significado: "Sem luz.", exemplo: "O corredor escuro.", nivel: 1 },
    {
      palavra: "silencioso",
      significado: "Sem barulho nenhum.",
      exemplo: "A sala silenciosa.",
      nivel: 2,
    },
    {
      palavra: "aconchegante",
      significado: "Lugar gostoso, onde a gente se sente bem.",
      exemplo: "A cozinha aconchegante da vó.",
      nivel: 2,
    },
    {
      palavra: "sombrio",
      significado: "Escuro e meio assustador.",
      exemplo: "A trilha sombria no meio da mata.",
      nivel: 3,
    },
    {
      palavra: "movimentado",
      significado: "Cheio de gente indo e vindo.",
      exemplo: "A feira movimentada de sábado.",
      nivel: 2,
    },
  ],
  opiniao: [
    {
      palavra: "eu acho que",
      significado: "Vou dizer o que penso.",
      exemplo: "Eu acho que todos deviam ajudar.",
      nivel: 1,
    },
    {
      palavra: "na minha opinião",
      significado: "É o que eu penso — outra pessoa pode pensar diferente.",
      exemplo: "Na minha opinião, o recreio devia ser maior.",
      nivel: 2,
    },
    {
      palavra: "por exemplo",
      significado: "Vou mostrar um caso que prova o que eu disse.",
      exemplo: "Muita coisa se recicla. Por exemplo, o papel.",
      nivel: 2,
    },
    {
      palavra: "eu concordo",
      significado: "Penso igual a quem falou antes.",
      exemplo: "Eu concordo com a professora nesse ponto.",
      nivel: 2,
    },
    {
      palavra: "eu discordo",
      significado: "Penso diferente de quem falou antes.",
      exemplo: "Eu discordo, e vou explicar por quê.",
      nivel: 3,
    },
    {
      palavra: "é importante lembrar",
      significado: "Chama atenção para algo que não se pode esquecer.",
      exemplo: "É importante lembrar que o rio abastece a cidade.",
      nivel: 3,
    },
  ],
  saudacao: [
    {
      palavra: "Oi,",
      significado: "Jeito simples de começar, para quem é próximo.",
      exemplo: "Oi, mãe!",
      nivel: 1,
    },
    {
      palavra: "Olá,",
      significado: "Um pouco mais formal que 'oi'.",
      exemplo: "Olá, professora!",
      nivel: 1,
    },
    {
      palavra: "Querida",
      significado: "Para quem a gente gosta muito.",
      exemplo: "Querida vovó,",
      nivel: 1,
    },
    {
      palavra: "Prezados",
      significado: "Para falar com gente que a gente não conhece de perto. Usa-se em comunicado.",
      exemplo: "Prezados pais e responsáveis,",
      nivel: 3,
    },
  ],
  despedida: [
    {
      palavra: "Um abraço",
      significado: "Despedida carinhosa e simples.",
      exemplo: "Um abraço, Ana.",
      nivel: 1,
    },
    {
      palavra: "Com carinho",
      significado: "Mostra afeto por quem vai ler.",
      exemplo: "Com carinho, seu neto.",
      nivel: 1,
    },
    {
      palavra: "Beijos",
      significado: "Para família e amigos bem próximos.",
      exemplo: "Beijos, Maria.",
      nivel: 1,
    },
    {
      palavra: "Atenciosamente",
      significado: "Despedida séria, de documento. Não se usa com a mãe.",
      exemplo: "Atenciosamente, a direção da escola.",
      nivel: 3,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Gêneros                                                             */
/* ------------------------------------------------------------------ */

export interface Parte {
  nome: string;
  oQue: string;
}

export interface Genero {
  id: string;
  nome: string;
  emoji: string;
  /** A que serve e para quem se escreve. */
  paraQue: string;
  quemLe: string;
  serieMinima: Serie;
  partes: Parte[];
  /** Perguntas do planejamento: responder isto já é meio texto pronto. */
  perguntas: { rotulo: string; dica: string }[];
  categorias: Categoria[];
  checklist: string[];
  /** Um texto curto do gênero, para a criança ver como fica. */
  modelo: string;
  ideias: string[];
}

export const GENEROS: Genero[] = [
  {
    id: "bilhete",
    nome: "Bilhete",
    emoji: "✉️",
    paraQue: "Dar um recado curto para alguém que você conhece.",
    quemLe: "Mãe, pai, professora, um colega.",
    serieMinima: 1,
    partes: [
      { nome: "Para quem", oQue: "O nome de quem vai ler, lá em cima." },
      { nome: "O recado", oQue: "O que você quer avisar, em poucas frases." },
      { nome: "Despedida e nome", oQue: "Um abraço e o seu nome no fim." },
    ],
    perguntas: [
      { rotulo: "Para quem você vai escrever?", dica: "Ex.: para a minha mãe" },
      { rotulo: "O que você precisa avisar?", dica: "Ex.: que a aula vai terminar mais cedo" },
      { rotulo: "Tem algum detalhe importante?", dica: "Ex.: o horário, o lugar, o dia" },
    ],
    categorias: ["saudacao", "despedida", "causa"],
    checklist: [
      "Escrevi o nome de quem vai ler no começo?",
      "O recado está claro em poucas frases?",
      "Coloquei a despedida e o meu nome?",
      "Comecei as frases com letra maiúscula e terminei com ponto?",
    ],
    modelo:
      "Oi, mãe!\n\nA professora avisou que amanhã a aula termina às 11h, porque vai ter reunião. Pode me buscar mais cedo?\n\nUm abraço,\nAna",
    ideias: [
      "Avisar que vai à casa de um amigo",
      "Pedir para levar material na escola",
      "Agradecer um presente",
    ],
  },
  {
    id: "recado",
    nome: "Recado",
    emoji: "📝",
    paraQue: "Anotar o que uma pessoa falou para passar a outra.",
    quemLe: "Quem não estava na hora em que a mensagem chegou.",
    serieMinima: 1,
    partes: [
      { nome: "Quem mandou", oQue: "A pessoa que falou o recado." },
      { nome: "O que ela disse", oQue: "A mensagem, sem inventar nada." },
      { nome: "Quando", oQue: "O dia e a hora, se você souber." },
    ],
    perguntas: [
      { rotulo: "Quem mandou o recado?", dica: "Ex.: a tia Rita" },
      { rotulo: "O que ela falou?", dica: "Ex.: que vem almoçar no domingo" },
      { rotulo: "Para quem é o recado?", dica: "Ex.: para o meu pai" },
    ],
    categorias: ["saudacao", "tempo"],
    checklist: [
      "Disse quem mandou o recado?",
      "A mensagem está igual ao que a pessoa falou?",
      "Escrevi para quem é o recado?",
    ],
    modelo:
      "Pai,\n\nA tia Rita ligou às 3 horas. Ela disse que vem almoçar no domingo e pediu para você ligar de volta hoje à noite.\n\nJoão",
    ideias: ["Um telefonema que você atendeu", "Um aviso do vizinho", "Uma mensagem da professora"],
  },
  {
    id: "aviso",
    nome: "Aviso",
    emoji: "📢",
    paraQue: "Contar uma coisa importante para muita gente de uma vez.",
    quemLe: "Toda a turma, ou quem passar pelo mural.",
    serieMinima: 2,
    partes: [
      { nome: "Título", oQue: "Uma palavra ou frase curta que chama a atenção: AVISO." },
      { nome: "O que vai acontecer", oQue: "O fato principal, bem direto." },
      { nome: "Quando e onde", oQue: "Dia, hora e lugar. Sem isso o aviso não serve." },
      { nome: "Quem avisou", oQue: "Seu nome ou o da turma." },
    ],
    perguntas: [
      { rotulo: "O que você quer avisar?", dica: "Ex.: vai ter feira de ciências" },
      { rotulo: "Quando vai ser?", dica: "Ex.: sexta-feira, às 8h" },
      { rotulo: "Onde vai ser?", dica: "Ex.: no pátio da escola" },
      { rotulo: "Quem precisa saber?", dica: "Ex.: todos os alunos do 4º ano" },
    ],
    categorias: ["adicao", "tempo"],
    checklist: [
      "Tem um título que chama a atenção?",
      "Disse o que vai acontecer?",
      "Disse o dia, a hora e o lugar?",
      "Qualquer pessoa entenderia lendo rápido?",
    ],
    modelo:
      "AVISO\n\nNa sexta-feira, dia 12, vai ter feira de ciências no pátio da escola, às 8 horas.\n\nTodos os alunos devem levar o trabalho pronto.\n\nTurma do 4º ano B",
    ideias: ["Uma festa junina", "A troca de sala", "Um campeonato no recreio"],
  },
  {
    id: "comunicado",
    nome: "Comunicado",
    emoji: "🏫",
    paraQue: "Informar de maneira oficial, como a escola faz com as famílias.",
    quemLe: "Pais, responsáveis, a comunidade.",
    serieMinima: 4,
    partes: [
      { nome: "Quem está comunicando", oQue: "A escola, a direção, a turma." },
      { nome: "Saudação", oQue: "'Prezados pais e responsáveis,' — é formal." },
      { nome: "A informação", oQue: "O que muda, com data e motivo." },
      { nome: "O que a pessoa deve fazer", oQue: "Se precisa assinar, levar algo, comparecer." },
      { nome: "Despedida formal", oQue: "'Atenciosamente' e quem assina." },
    ],
    perguntas: [
      { rotulo: "O que precisa ser comunicado?", dica: "Ex.: mudança no horário das aulas" },
      { rotulo: "Por que isso vai acontecer?", dica: "Ex.: por causa da reunião de professores" },
      { rotulo: "A partir de quando?", dica: "Ex.: a partir do dia 10" },
      { rotulo: "O que as famílias precisam fazer?", dica: "Ex.: buscar os alunos às 11h" },
    ],
    categorias: ["saudacao", "causa", "adicao", "despedida"],
    checklist: [
      "Usei linguagem formal, sem gíria?",
      "Está claro quem está comunicando?",
      "Coloquei a data e o motivo?",
      "Disse o que as famílias devem fazer?",
      "Terminei com 'Atenciosamente' e a assinatura?",
    ],
    modelo:
      "COMUNICADO\n\nPrezados pais e responsáveis,\n\nInformamos que, a partir do dia 10 de maio, as aulas da tarde terminarão às 16h30, por causa da reunião pedagógica semanal.\n\nPedimos que os alunos sejam buscados no novo horário.\n\nAtenciosamente,\nDireção da Escola Dr. Eiraldo Carneiro de França",
    ideias: ["Mudança de horário", "Campanha de agasalho", "Reunião de pais"],
  },
  {
    id: "narrativa",
    nome: "História",
    emoji: "📖",
    paraQue: "Contar algo que aconteceu — de verdade ou inventado.",
    quemLe: "A turma, a professora, a família.",
    serieMinima: 1,
    partes: [
      { nome: "Começo", oQue: "Quem é o personagem, onde está e quando foi." },
      { nome: "Meio", oQue: "O problema: o que deu errado ou o que apareceu de novo." },
      { nome: "Fim", oQue: "Como o problema se resolveu." },
    ],
    perguntas: [
      { rotulo: "Quem é o personagem principal?", dica: "Ex.: um menino chamado Davi" },
      {
        rotulo: "Onde e quando a história acontece?",
        dica: "Ex.: na beira do rio, numa tarde de sol",
      },
      { rotulo: "Qual é o problema?", dica: "Ex.: a canoa dele soltou e foi embora" },
      { rotulo: "Como termina?", dica: "Ex.: o vizinho ajudou a buscar" },
    ],
    categorias: ["comecar", "tempo", "falar", "pessoas", "lugares", "terminar"],
    checklist: [
      "Dá para saber quem é o personagem e onde ele está?",
      "A história tem um problema no meio?",
      "O problema se resolve no fim?",
      "Usei palavras como 'depois' e 'de repente' para ligar as partes?",
      "Comecei as frases com letra maiúscula?",
    ],
    modelo:
      "Certo dia, Davi foi pescar na beira do rio com o avô.\n\nDe repente, o vento soltou a canoa e ela começou a descer a correnteza. Davi gritou, mas ninguém ouvia.\n\nO avô, que era um homem calmo, pegou outra canoa e alcançou a primeira depois de muito remar. No fim, os dois voltaram rindo do susto.",
    ideias: [
      "Um dia em que você se perdeu",
      "Um bicho que apareceu na sua casa",
      "A melhor festa que você já foi",
    ],
  },
  {
    id: "conto",
    nome: "Conto",
    emoji: "🌟",
    paraQue: "Uma história inventada, curta, com começo, meio e fim bem marcados.",
    quemLe: "Quem gosta de ser surpreendido no final.",
    serieMinima: 3,
    partes: [
      { nome: "Situação inicial", oQue: "Como tudo estava antes de o problema aparecer." },
      { nome: "Conflito", oQue: "O que quebra a paz e faz a história andar." },
      { nome: "Clímax", oQue: "O momento de maior tensão, quando tudo se decide." },
      { nome: "Desfecho", oQue: "Como ficou tudo depois." },
    ],
    perguntas: [
      { rotulo: "Quem é o personagem e como ele é?", dica: "Ex.: Lia, uma menina teimosa" },
      { rotulo: "Como era a vida dele antes?", dica: "Ex.: vivia tranquila na comunidade" },
      { rotulo: "O que aparece para atrapalhar?", dica: "Ex.: um som estranho vindo da mata" },
      { rotulo: "Qual é o momento mais tenso?", dica: "Ex.: quando ela entra na mata sozinha" },
      { rotulo: "Como termina?", dica: "Ex.: descobre que era um filhote preso" },
    ],
    categorias: ["comecar", "tempo", "falar", "pessoas", "lugares", "terminar"],
    checklist: [
      "Dá para imaginar o personagem e o lugar?",
      "O conflito aparece logo, sem demorar demais?",
      "O momento mais tenso está bem contado?",
      "O final resolve o que foi combinado no começo?",
      "Usei parágrafos para separar as partes?",
    ],
    modelo:
      "Era uma vez uma menina teimosa chamada Lia, que morava numa casa de madeira na beira da mata.\n\nTodas as noites, um som estranho vinha de dentro das árvores. Os adultos diziam para não olhar. Lia, é claro, olhou.\n\nNa noite mais escura do mês, ela entrou na mata com uma lanterna. O som ficou mais alto, mais alto — até que ela viu: era um filhote de macaco preso num cipó.\n\nDesde então, ninguém mais teve medo do barulho da mata.",
    ideias: ["Um objeto mágico", "Um amigo invisível", "Uma noite de tempestade"],
  },
  {
    id: "lenda",
    nome: "Lenda",
    emoji: "🌳",
    paraQue: "Explicar de onde veio alguma coisa da natureza, do jeito que os antigos contavam.",
    quemLe: "Quem quer conhecer as histórias do nosso povo.",
    serieMinima: 3,
    partes: [
      { nome: "Abertura", oQue: "'Conta-se que...', 'Há muito tempo...'" },
      {
        nome: "O tempo antigo",
        oQue: "Como as coisas eram antes de acontecer o que você vai contar.",
      },
      { nome: "O acontecimento", oQue: "O fato mágico ou misterioso." },
      { nome: "A explicação", oQue: "Por causa disso, ficou assim até hoje." },
    ],
    perguntas: [
      { rotulo: "O que a sua lenda vai explicar?", dica: "Ex.: por que o boto aparece nas festas" },
      { rotulo: "Quem são os personagens?", dica: "Ex.: um pescador e uma moça do rio" },
      { rotulo: "O que aconteceu de mágico?", dica: "Ex.: o peixe virou gente" },
      { rotulo: "Como ficou depois, até hoje?", dica: "Ex.: por isso ninguém pesca de noite" },
    ],
    categorias: ["comecar", "tempo", "lugares", "terminar"],
    checklist: [
      "Comecei com uma abertura de lenda?",
      "Tem alguma coisa mágica ou misteriosa?",
      "No fim, expliquei por que as coisas são assim hoje?",
      "A lenda fala de um lugar ou bicho da nossa região?",
    ],
    modelo:
      "Conta-se que, há muito tempo, o rio Envira era tão claro que dava para ver o fundo.\n\nNaquele tempo, um pescador ganancioso pescava dia e noite, sem deixar nada para os outros. Uma noite, uma moça de cabelos verdes saiu da água e pediu que ele parasse. Ele riu e jogou a rede de novo.\n\nA moça bateu a mão na água e o rio ficou escuro na mesma hora.\n\nDesde então, ninguém mais vê o fundo do rio — e todo pescador deixa um peixe para quem vem depois.",
    ideias: ["Por que o açaí é roxo", "De onde veio a vitória-régia", "Por que o urubu é preto"],
  },
  {
    id: "informativo",
    nome: "Texto informativo",
    emoji: "🔎",
    paraQue: "Ensinar alguma coisa verdadeira para quem lê.",
    quemLe: "Quem quer aprender sobre o assunto.",
    serieMinima: 3,
    partes: [
      { nome: "Título", oQue: "O assunto, em poucas palavras." },
      { nome: "Introdução", oQue: "Apresenta o assunto e desperta interesse." },
      { nome: "Informações", oQue: "Os fatos, um em cada parágrafo." },
      { nome: "Fechamento", oQue: "O que é mais importante lembrar." },
    ],
    perguntas: [
      { rotulo: "Sobre o que você vai escrever?", dica: "Ex.: a onça-pintada" },
      { rotulo: "O que você já sabe sobre isso?", dica: "Ex.: onde vive, o que come" },
      { rotulo: "Qual informação mais surpreende?", dica: "Ex.: que ela nada muito bem" },
      { rotulo: "Por que isso é importante?", dica: "Ex.: porque está ameaçada de extinção" },
    ],
    categorias: ["comecar", "adicao", "causa", "terminar"],
    checklist: [
      "Escrevi só coisas verdadeiras?",
      "Cada parágrafo fala de uma informação?",
      "Usei palavras do assunto (os termos certos)?",
      "Alguém que não sabe nada entenderia?",
    ],
    modelo:
      "A onça-pintada\n\nVocê sabia que a onça-pintada é o maior felino das Américas?\n\nEla vive nas florestas e perto dos rios, e se alimenta de capivaras, jacarés e peixes. Diferente de outros gatos, a onça gosta de água e nada muito bem.\n\nHoje ela está ameaçada de extinção, porque a floresta onde mora vem diminuindo.\n\nProteger a floresta é proteger também a onça.",
    ideias: ["Um animal da nossa região", "Como se faz a farinha", "O rio da nossa cidade"],
  },
  {
    id: "dissertacao",
    nome: "Texto de opinião",
    emoji: "💭",
    paraQue: "Defender o que você pensa, com argumentos que expliquem por quê.",
    quemLe: "Quem talvez pense diferente de você.",
    serieMinima: 5,
    partes: [
      { nome: "Introdução", oQue: "Apresenta o assunto e diz qual é a sua opinião." },
      { nome: "Argumento 1", oQue: "O primeiro motivo, explicado." },
      { nome: "Argumento 2", oQue: "O segundo motivo, com um exemplo." },
      { nome: "Conclusão", oQue: "Retoma a opinião e propõe algo." },
    ],
    perguntas: [
      { rotulo: "Qual é o assunto?", dica: "Ex.: o lixo na beira do rio" },
      { rotulo: "Qual é a sua opinião?", dica: "Ex.: acho que todos deveriam ajudar a limpar" },
      { rotulo: "Primeiro motivo?", dica: "Ex.: o lixo contamina a água que a cidade bebe" },
      {
        rotulo: "Segundo motivo (com exemplo)?",
        dica: "Ex.: peixes morrem — no ano passado apareceram vários",
      },
      { rotulo: "O que você propõe no fim?", dica: "Ex.: mutirão de limpeza uma vez por mês" },
    ],
    categorias: ["opiniao", "causa", "oposicao", "adicao", "terminar"],
    checklist: [
      "Minha opinião está clara já no começo?",
      "Dei pelo menos dois motivos diferentes?",
      "Usei um exemplo de verdade?",
      "A conclusão retoma a opinião e propõe algo?",
      "Evitei escrever como se fosse conversa de WhatsApp?",
    ],
    modelo:
      "Todos devem cuidar do rio\n\nNa minha opinião, cuidar da beira do rio é tarefa de toda a cidade, e não só da prefeitura.\n\nO primeiro motivo é a saúde: a água que sai da torneira vem do rio, e o lixo jogado ali contamina essa água.\n\nAlém disso, o lixo mata os peixes. No ano passado, por exemplo, apareceram peixes mortos perto da ponte depois de um fim de semana de festa.\n\nConcluindo, um mutirão de limpeza uma vez por mês resolveria boa parte do problema. Se cada família cuidar do seu pedaço, o rio volta a ser bonito.",
    ideias: [
      "Celular na escola: pode ou não?",
      "O recreio deveria ser maior?",
      "Vale a pena separar o lixo?",
    ],
  },
];

export function generosDaSerie(serie: Serie): Genero[] {
  return GENEROS.filter((g) => g.serieMinima <= serie);
}

/** Do 1º ao 2º ano só palavras simples; 3º e 4º chegam ao nível 2; o 5º vê tudo. */
export function nivelDaSerie(serie: Serie): 1 | 2 | 3 {
  if (serie <= 2) return 1;
  if (serie <= 4) return 2;
  return 3;
}

export function palavrasDe(categoria: Categoria, serie: Serie): PalavraApoio[] {
  const teto = nivelDaSerie(serie);
  return PALAVRAS[categoria].filter((p) => p.nivel <= teto);
}

/** Quantas frases a criança deveria escrever, por série — meta, não regra. */
export function metaDeFrases(serie: Serie): number {
  return [3, 4, 6, 8, 10][serie - 1]!;
}
