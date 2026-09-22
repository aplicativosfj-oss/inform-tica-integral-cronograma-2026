/**
 * Museu dos gêneros textuais: cada gênero com um exemplo de verdade, escrito
 * inteiro, e do jeito que ele aparece no mundo — o recado no papel da
 * geladeira, a conversa na tela do celular, o rótulo na embalagem, a bula
 * dobrada, a notícia na página do jornal.
 *
 * Ler "texto instrucional" numa lista não ensina nada. Ver a receita com os
 * ingredientes de um lado e o modo de fazer numerado do outro ensina na
 * hora — e, principalmente, faz a criança reconhecer o gênero quando topar
 * com ele fora da escola.
 *
 * Os exemplos são curtos de propósito: cabem numa tela e podem ser lidos em
 * voz alta em menos de um minuto.
 */

export type Formato =
  | "papel"
  | "celular"
  | "rotulo"
  | "bula"
  | "jornal"
  | "blog"
  | "cartaz"
  | "email"
  | "tirinha"
  | "receita"
  | "placa";

export type Agrupamento = "dia a dia" | "narrar" | "poético" | "informar" | "instruir" | "opinar";

export interface Exemplo {
  formato: Formato;
  titulo?: string;
  /** Linha de apoio: autor, data, remetente — o que o formato exigir. */
  assinatura?: string;
  linhas?: string[];
  mensagens?: { de: "eu" | "outro"; txt: string; hora: string }[];
  campos?: { rotulo: string; valor: string }[];
  secoes?: { titulo: string; linhas: string[] }[];
  quadros?: { cena: string; fala: string }[];
}

export interface GeneroTexto {
  id: string;
  nome: string;
  emoji: string;
  /** Artigo certo para o nome do gênero: uma carta, um bilhete, as regras. */
  artigo: "um" | "uma" | "as";
  grupo: Agrupamento;
  /** Para que esse texto existe. */
  paraQue: string;
  ondeAparece: string;
  /** As marcas que denunciam o gênero — o que a criança procura. */
  comoReconhecer: string[];
  exemplo: Exemplo;
}

export const GENEROS_TEXTO: GeneroTexto[] = [
  /* ---------------------------- dia a dia --------------------------- */
  {
    id: "bilhete",
    artigo: "um",
    nome: "Bilhete",
    emoji: "✉️",
    grupo: "dia a dia",
    paraQue: "Dar um recado rápido para alguém conhecido.",
    ondeAparece: "Na geladeira, na mochila, em cima da mesa.",
    comoReconhecer: [
      "Começa dizendo para quem é",
      "É curtinho, vai direto ao assunto",
      "Termina com despedida e o nome de quem escreveu",
    ],
    exemplo: {
      formato: "papel",
      linhas: [
        "Mãe,",
        "",
        "Fui na casa da Duda fazer o trabalho de ciências. Volto antes das seis. O feijão está no fogão.",
        "",
        "Beijos,",
        "Ana",
      ],
    },
  },
  {
    id: "recado",
    artigo: "um",
    nome: "Recado",
    emoji: "📝",
    grupo: "dia a dia",
    paraQue: "Passar adiante o que outra pessoa falou.",
    ondeAparece: "No bloquinho ao lado do telefone, no mural da sala.",
    comoReconhecer: [
      "Diz quem mandou o recado",
      "Repete a mensagem sem inventar nada",
      "Costuma ter a hora em que chegou",
    ],
    exemplo: {
      formato: "papel",
      linhas: [
        "Pai,",
        "",
        "Seu Raimundo ligou às 15h30.",
        "Disse que a peça da bicicleta chegou e o senhor pode buscar até sábado.",
        "",
        "João",
      ],
    },
  },
  {
    id: "carta",
    artigo: "uma",
    nome: "Carta",
    emoji: "💌",
    grupo: "dia a dia",
    paraQue: "Conversar por escrito com quem está longe.",
    ondeAparece: "No envelope, pelos Correios.",
    comoReconhecer: [
      "Tem local e data no alto",
      "Começa com uma saudação carinhosa",
      "É mais longa que o bilhete: conta novidades e faz perguntas",
      "Termina com despedida e assinatura",
    ],
    exemplo: {
      formato: "papel",
      linhas: [
        "Feijó, 12 de março de 2026.",
        "",
        "Querida vovó,",
        "",
        "Como a senhora está? Aqui em casa está todo mundo bem. Comecei o 4º ano e a professora nova se chama Edvânia.",
        "",
        "A mangueira do quintal deu muita manga esse ano. Guardei as maiores para quando a senhora vier.",
        "",
        "Escreva contando as novidades de lá.",
        "",
        "Saudades,",
        "Miguel",
      ],
    },
  },
  {
    id: "mensagem",
    artigo: "uma",
    nome: "Mensagem de aplicativo",
    emoji: "💬",
    grupo: "dia a dia",
    paraQue: "Falar com alguém na hora, por escrito.",
    ondeAparece: "No celular, no WhatsApp e parecidos.",
    comoReconhecer: [
      "Aparece em balões, um para cada pessoa",
      "Tem a hora de cada mensagem",
      "Usa frases curtas, emojis e abreviações",
    ],
    exemplo: {
      formato: "celular",
      titulo: "Turma do 5º B",
      mensagens: [
        { de: "outro", txt: "Gente, a prova de matemática é amanhã mesmo?", hora: "19:02" },
        { de: "eu", txt: "É sim! A prof avisou hoje 📘", hora: "19:03" },
        { de: "outro", txt: "Vixe, nem tinha anotado 😅", hora: "19:03" },
        { de: "eu", txt: "Cai da página 40 até a 48", hora: "19:04" },
        { de: "outro", txt: "Valeu! Vou estudar agora", hora: "19:05" },
      ],
    },
  },
  {
    id: "sms",
    artigo: "um",
    nome: "SMS",
    emoji: "📱",
    grupo: "dia a dia",
    paraQue: "Avisar algo curto, sem internet.",
    ondeAparece: "Nas mensagens do celular; quase sempre do banco ou da escola.",
    comoReconhecer: [
      "É bem curto, cabe em poucas linhas",
      "Não tem foto nem áudio",
      "Costuma vir de um número ou nome de empresa",
    ],
    exemplo: {
      formato: "celular",
      titulo: "ESCOLA-FEIJO",
      mensagens: [
        {
          de: "outro",
          txt: "ESCOLA DR. EIRALDO: reuniao de pais dia 20/03, as 19h, no patio. Compareca.",
          hora: "08:14",
        },
      ],
    },
  },
  {
    id: "email",
    artigo: "um",
    nome: "E-mail",
    emoji: "📧",
    grupo: "dia a dia",
    paraQue: "Escrever de forma mais séria pela internet.",
    ondeAparece: "No computador e no celular, na caixa de entrada.",
    comoReconhecer: [
      "Tem campos: de, para e assunto",
      "O texto é mais formal que a mensagem de aplicativo",
      "Pode levar arquivo anexado",
    ],
    exemplo: {
      formato: "email",
      campos: [
        { rotulo: "De", valor: "turma5b@escolaeiraldo.ac" },
        { rotulo: "Para", valor: "biblioteca@feijo.ac.gov.br" },
        { rotulo: "Assunto", valor: "Visita da turma do 5º ano" },
      ],
      linhas: [
        "Bom dia!",
        "",
        "Somos os alunos do 5º ano B da Escola Dr. Eiraldo Carneiro de França. Gostaríamos de visitar a biblioteca no dia 18 de abril, pela manhã, com 27 alunos e dois professores.",
        "",
        "Podemos confirmar esse dia?",
        "",
        "Atenciosamente,",
        "Turma do 5º ano B",
      ],
    },
  },
  {
    id: "lista",
    artigo: "uma",
    nome: "Lista",
    emoji: "🧾",
    grupo: "dia a dia",
    paraQue: "Não esquecer o que precisa ser feito ou comprado.",
    ondeAparece: "No bolso, na porta da geladeira, no celular.",
    comoReconhecer: [
      "Uma coisa por linha",
      "Sem frases completas — só o essencial",
      "Muitas vezes tem quadradinho para marcar",
    ],
    exemplo: {
      formato: "papel",
      titulo: "Feira de sábado",
      linhas: [
        "□ 2 kg de farinha",
        "□ 1 cacho de banana",
        "□ 500 g de café",
        "□ 6 ovos",
        "□ sabão em pó",
        "□ 1 melancia",
      ],
    },
  },
  {
    id: "convite",
    artigo: "um",
    nome: "Convite",
    emoji: "🎉",
    grupo: "dia a dia",
    paraQue: "Chamar alguém para uma festa ou um evento.",
    ondeAparece: "Entregue na mão, no mural ou pelo celular.",
    comoReconhecer: [
      "Diz o que vai acontecer",
      "Traz dia, hora e lugar",
      "Fala direto com quem lê: 'venha', 'você está convidado'",
    ],
    exemplo: {
      formato: "cartaz",
      titulo: "Festa Junina da Escola",
      linhas: [
        "Você está convidado!",
        "",
        "📅 Sábado, 22 de junho",
        "🕕 A partir das 18h",
        "📍 Pátio da Escola Dr. Eiraldo Carneiro de França",
        "",
        "Vai ter quadrilha, pescaria, canjica e bolo de macaxeira.",
        "",
        "Entrada: 1 kg de alimento não perecível",
      ],
    },
  },
  {
    id: "diario",
    artigo: "um",
    nome: "Diário",
    emoji: "📔",
    grupo: "dia a dia",
    paraQue: "Guardar o que aconteceu e o que a gente sentiu.",
    ondeAparece: "No caderno pessoal, guardado na gaveta.",
    comoReconhecer: [
      "Tem a data no começo",
      "É escrito em primeira pessoa: eu",
      "Fala de sentimentos, não só de fatos",
    ],
    exemplo: {
      formato: "papel",
      linhas: [
        "Terça-feira, 5 de maio",
        "",
        "Hoje foi o dia mais esquisito do ano. Fui escolhida para ler meu texto na frente da turma inteira e minhas pernas tremiam tanto que achei que ia cair.",
        "",
        "Mas eu li. E no fim todo mundo bateu palma.",
        "",
        "Acho que amanhã eu leio de novo.",
      ],
    },
  },

  /* ----------------------------- narrar ----------------------------- */
  {
    id: "conto",
    artigo: "um",
    nome: "Conto",
    emoji: "📖",
    grupo: "narrar",
    paraQue: "Contar uma história inventada, curta e com um final.",
    ondeAparece: "Em livros de histórias e coletâneas.",
    comoReconhecer: [
      "Tem personagem, lugar e tempo",
      "Aparece um problema no meio",
      "O problema se resolve no fim",
    ],
    exemplo: {
      formato: "papel",
      titulo: "A canoa teimosa",
      linhas: [
        "Davi tinha uma canoa pequena, pintada de azul, que ele mesmo amarrava no tronco todo fim de tarde.",
        "",
        "Certo dia, o nó desamarrou sozinho. A canoa desceu o rio devagarinho, como quem passeia. Davi correu pela margem gritando, mas ela não voltava.",
        "",
        "Foi o velho Chico quem alcançou a fujona, três curvas adiante, e a trouxe de volta remando contra a correnteza.",
        "",
        "— Canoa também quer ver o mundo — disse ele, rindo.",
        "",
        "Desde aquele dia, Davi dá dois nós.",
      ],
    },
  },
  {
    id: "lenda",
    artigo: "uma",
    nome: "Lenda",
    emoji: "🌳",
    grupo: "narrar",
    paraQue: "Explicar de onde veio alguma coisa da natureza, do jeito dos antigos.",
    ondeAparece: "Contada pelos mais velhos e em livros de folclore.",
    comoReconhecer: [
      "Começa com 'Conta-se que' ou 'Há muito tempo'",
      "Tem algo mágico ou misterioso",
      "No fim explica por que as coisas são assim até hoje",
    ],
    exemplo: {
      formato: "papel",
      titulo: "Por que o açaí é roxo",
      linhas: [
        "Conta-se que, há muito tempo, havia uma aldeia onde a comida acabou.",
        "",
        "Uma moça chamada Iaçá chorou dias e noites debaixo de uma palmeira, pedindo ajuda. Na última noite, ela viu a filha sorrindo entre as folhas e correu para abraçá-la — mas encontrou só o tronco.",
        "",
        "Na manhã seguinte, a palmeira estava carregada de frutinhas escuras, roxas como a noite em que ela chorou.",
        "",
        "Desde então o povo come o açaí, e o nome da moça, lido ao contrário, virou o nome do fruto.",
      ],
    },
  },
  {
    id: "fabula",
    artigo: "uma",
    nome: "Fábula",
    emoji: "🦊",
    grupo: "narrar",
    paraQue: "Ensinar uma lição usando bichos que falam.",
    ondeAparece: "Em livros de fábulas; as mais famosas são de Esopo e La Fontaine.",
    comoReconhecer: [
      "Os personagens são animais com jeito de gente",
      "É bem curtinha",
      "Termina com uma moral — a lição da história",
    ],
    exemplo: {
      formato: "papel",
      titulo: "O jabuti e a onça",
      linhas: [
        "A onça vivia rindo do jabuti por ele andar devagar.",
        "",
        "— Aposto que chego ao igarapé antes de você piscar — zombou ela.",
        "",
        "O jabuti aceitou a corrida. Enquanto a onça corria e parava para caçar, para beber e para se gabar, o jabuti seguia, passo por passo, sem parar uma vez sequer.",
        "",
        "Quando a onça chegou, o jabuti já tomava banho.",
        "",
        "Moral: devagar e sempre chega mais longe que depressa e aos pedaços.",
      ],
    },
  },
  {
    id: "noticia",
    artigo: "uma",
    nome: "Notícia",
    emoji: "📰",
    grupo: "informar",
    paraQue: "Contar um fato que aconteceu de verdade, bem recente.",
    ondeAparece: "No jornal, no rádio, nos sites de notícia.",
    comoReconhecer: [
      "Título grande (manchete) que resume tudo",
      "Responde: o quê, quem, quando, onde e por quê",
      "Conta só o que aconteceu, sem inventar",
    ],
    exemplo: {
      formato: "jornal",
      titulo: "Alunos de Feijó plantam 200 mudas na beira do rio",
      assinatura: "Gazeta do Envira · 14 de março de 2026",
      linhas: [
        "Estudantes do 4º e do 5º ano da Escola Municipal Dr. Eiraldo Carneiro de França plantaram 200 mudas de árvores nativas na margem do rio Envira na manhã de sexta-feira.",
        "",
        "A ação faz parte do projeto Rio Vivo, que começou em fevereiro. Segundo a coordenação da escola, as mudas foram doadas pela Secretaria de Meio Ambiente.",
        "",
        "“As crianças vão acompanhar o crescimento das árvores até o fim do ano”, explicou a professora responsável.",
      ],
    },
  },
  {
    id: "tirinha",
    artigo: "uma",
    nome: "Tirinha",
    emoji: "💭",
    grupo: "narrar",
    paraQue: "Contar uma historinha em poucos quadros, quase sempre com graça.",
    ondeAparece: "No jornal, em gibis e na internet.",
    comoReconhecer: [
      "Tem quadrinhos em sequência",
      "As falas ficam dentro de balões",
      "O último quadro traz a piada ou a surpresa",
    ],
    exemplo: {
      formato: "tirinha",
      quadros: [
        { cena: "Menino olhando o caderno", fala: "Professora, a tarefa era pra hoje?" },
        { cena: "Professora sorrindo", fala: "Era pra ontem." },
        { cena: "Menino aliviado", fala: "Ufa! Então ainda dá tempo de esquecer de novo." },
      ],
    },
  },

  /* ----------------------------- poético ---------------------------- */
  {
    id: "poema",
    artigo: "um",
    nome: "Poema",
    emoji: "🎋",
    grupo: "poético",
    paraQue: "Dizer o que se sente com palavras bonitas e ritmo.",
    ondeAparece: "Em livros de poesia, em murais, em cartões.",
    comoReconhecer: [
      "Escrito em versos (linhas curtas)",
      "Os versos formam estrofes, separadas por espaço",
      "Muitas vezes tem rima e sempre tem ritmo",
    ],
    exemplo: {
      formato: "papel",
      titulo: "Rio que passa",
      assinatura: "escrito pela turma do 3º ano",
      linhas: [
        "O rio que passa na frente de casa",
        "leva folha, leva flor,",
        "leva a canoa do seu Raimundo",
        "e a voz do pescador.",
        "",
        "Quando a chuva vem com força",
        "ele cresce, fica valente;",
        "quando o sol seca a barranca,",
        "ele dorme, mansamente.",
      ],
    },
  },
  {
    id: "parlenda",
    artigo: "uma",
    nome: "Parlenda",
    emoji: "🎵",
    grupo: "poético",
    paraQue: "Brincar com as palavras, batendo palmas ou pulando corda.",
    ondeAparece: "No recreio, na brincadeira de roda, passada de boca em boca.",
    comoReconhecer: [
      "Tem ritmo forte, dá para bater palma junto",
      "Quase sempre rima",
      "Não tem autor: todo mundo sabe de cor",
    ],
    exemplo: {
      formato: "papel",
      titulo: "Hoje é domingo",
      linhas: [
        "Hoje é domingo,",
        "pede cachimbo;",
        "o cachimbo é de ouro,",
        "bate no touro;",
        "o touro é valente,",
        "bate na gente;",
        "a gente é fraco,",
        "cai no buraco.",
      ],
    },
  },
  {
    id: "adivinha",
    artigo: "uma",
    nome: "Adivinha",
    emoji: "❓",
    grupo: "poético",
    paraQue: "Desafiar alguém a descobrir a resposta.",
    ondeAparece: "Na roda de conversa, no recreio, nos livros de folclore.",
    comoReconhecer: [
      "Começa com 'O que é, o que é?'",
      "Descreve a coisa sem dizer o nome",
      "A resposta vem depois, de cabeça para baixo ou escondida",
    ],
    exemplo: {
      formato: "papel",
      linhas: [
        "O que é, o que é?",
        "",
        "Tem coroa mas não é rei,",
        "tem espinho mas não é peixe,",
        "e é doce sem ser doce.",
        "",
        "Resposta: o abacaxi.",
      ],
    },
  },
  {
    id: "travalingua",
    artigo: "um",
    nome: "Trava-língua",
    emoji: "👅",
    grupo: "poético",
    paraQue: "Brincar tentando falar rápido sem errar.",
    ondeAparece: "Na brincadeira, no aquecimento da aula de leitura.",
    comoReconhecer: [
      "Repete os mesmos sons muitas vezes",
      "É difícil de falar depressa",
      "Serve para brincar, não para informar",
    ],
    exemplo: {
      formato: "papel",
      linhas: [
        "O rato roeu a roupa do rei de Roma.",
        "",
        "Três pratos de trigo para três tigres tristes.",
        "",
        "A aranha arranha a rã. A rã arranha a aranha.",
      ],
    },
  },
  {
    id: "cordel",
    artigo: "um",
    nome: "Cordel",
    emoji: "📜",
    grupo: "poético",
    paraQue: "Contar história em verso, do jeito do Nordeste.",
    ondeAparece: "Em folhetos pendurados em barbante, nas feiras.",
    comoReconhecer: [
      "Versos agrupados de seis em seis",
      "Rima marcada, feito para ser lido em voz alta",
      "A capa costuma ter xilogravura",
    ],
    exemplo: {
      formato: "papel",
      titulo: "O menino e a chuva",
      linhas: [
        "Vou contar uma história",
        "que meu avô me contou,",
        "de um menino do Acre",
        "que a chuva molhou,",
        "e que em vez de correr",
        "ficou lá e dançou.",
      ],
    },
  },
  {
    id: "piada",
    artigo: "uma",
    nome: "Piada",
    emoji: "😄",
    grupo: "poético",
    paraQue: "Fazer rir.",
    ondeAparece: "Na conversa, no recreio, em livros de piada.",
    comoReconhecer: [
      "É curtinha",
      "Prepara uma situação e termina com uma surpresa",
      "A graça está sempre na última frase",
    ],
    exemplo: {
      formato: "papel",
      linhas: [
        "A professora pergunta:",
        "",
        "— Joãozinho, se eu tenho dez laranjas numa mão e oito na outra, o que eu tenho?",
        "",
        "E o Joãozinho responde:",
        "",
        "— Mãos enormes, professora!",
      ],
    },
  },

  /* ---------------------------- instruir ---------------------------- */
  {
    id: "receita",
    artigo: "uma",
    nome: "Receita",
    emoji: "🍲",
    grupo: "instruir",
    paraQue: "Ensinar a fazer uma comida, passo a passo.",
    ondeAparece: "No caderno da vó, no livro de receitas, na internet.",
    comoReconhecer: [
      "Tem duas partes: ingredientes e modo de fazer",
      "Os passos vêm numerados ou em ordem",
      "Os verbos mandam fazer: misture, leve, deixe",
    ],
    exemplo: {
      formato: "receita",
      titulo: "Bolo de macaxeira da vovó",
      secoes: [
        {
          titulo: "Ingredientes",
          linhas: [
            "1 kg de macaxeira ralada",
            "3 ovos",
            "2 xícaras de açúcar",
            "1 vidro de leite de coco (200 mL)",
            "100 g de manteiga",
            "1 pitada de sal",
          ],
        },
        {
          titulo: "Modo de fazer",
          linhas: [
            "Descasque e rale a macaxeira.",
            "Bata os ovos com o açúcar até ficar cremoso.",
            "Junte a macaxeira, o leite de coco, a manteiga e o sal.",
            "Misture bem e despeje numa forma untada.",
            "Leve ao forno médio por 40 minutos.",
            "Espete um garfo: se sair limpo, está pronto.",
          ],
        },
      ],
    },
  },
  {
    id: "manual",
    artigo: "um",
    nome: "Manual de instruções",
    emoji: "🔧",
    grupo: "instruir",
    paraQue: "Ensinar a usar ou montar alguma coisa.",
    ondeAparece: "Dentro da caixa do aparelho que se compra.",
    comoReconhecer: [
      "Passos numerados",
      "Tem desenhos mostrando cada parte",
      "Avisa o que não se deve fazer",
    ],
    exemplo: {
      formato: "receita",
      titulo: "Ventilador de mesa · Como montar",
      secoes: [
        {
          titulo: "Na caixa você encontra",
          linhas: ["1 base", "1 motor com haste", "2 grades", "1 hélice", "1 porca de fixação"],
        },
        {
          titulo: "Montagem",
          linhas: [
            "Encaixe a haste na base e aperte o parafuso.",
            "Prenda a grade de trás no motor.",
            "Coloque a hélice e rosqueie a porca.",
            "Feche com a grade da frente até ouvir o clique.",
            "Só então ligue na tomada.",
          ],
        },
        {
          titulo: "Atenção",
          linhas: [
            "Não ligue o aparelho sem as duas grades.",
            "Não use perto da água.",
            "Desligue da tomada antes de limpar.",
          ],
        },
      ],
    },
  },
  {
    id: "regras",
    artigo: "as",
    nome: "Regras de jogo",
    emoji: "🎲",
    grupo: "instruir",
    paraQue: "Explicar como se joga, para ninguém discutir depois.",
    ondeAparece: "Dentro da caixa do jogo, no verso do tabuleiro.",
    comoReconhecer: [
      "Diz quantas pessoas jogam",
      "Explica como começa e como termina",
      "Lista o que vale e o que não vale",
    ],
    exemplo: {
      formato: "receita",
      titulo: "Queimada · regras da quadra",
      secoes: [
        {
          titulo: "Para jogar",
          linhas: ["Dois times do mesmo tamanho", "Uma bola", "A quadra dividida ao meio"],
        },
        {
          titulo: "Como se joga",
          linhas: [
            "Cada time fica de um lado da linha do meio.",
            "Quem for atingido pela bola vai para o cemitério, atrás do time adversário.",
            "Quem está no cemitério volta ao jogo se queimar alguém de lá.",
            "Se o jogador pegar a bola no ar, não está queimado.",
            "Ganha o time que queimar todos os adversários.",
          ],
        },
      ],
    },
  },
  {
    id: "bula",
    artigo: "uma",
    nome: "Bula de remédio",
    emoji: "💊",
    grupo: "instruir",
    paraQue: "Dizer como tomar um remédio com segurança.",
    ondeAparece: "Naquele papel fino dobrado dentro da caixinha.",
    comoReconhecer: [
      "Vem dividida em partes com títulos",
      "Fala em miligramas e mililitros",
      "Tem sempre um aviso de perigo",
    ],
    exemplo: {
      formato: "bula",
      titulo: "Xarope de guaco 100 mg/mL",
      secoes: [
        {
          titulo: "Para que serve",
          linhas: ["Ajuda a soltar o catarro e aliviar a tosse."],
        },
        {
          titulo: "Como usar",
          linhas: [
            "Crianças de 6 a 12 anos: 5 mL, três vezes ao dia.",
            "Agite o vidro antes de usar.",
            "Use o copo-medida que vem na caixa.",
          ],
        },
        {
          titulo: "Advertências",
          linhas: [
            "Não use por mais de 7 dias sem falar com o médico.",
            "Mantenha fora do alcance das crianças.",
            "Não use se o lacre estiver violado.",
          ],
        },
      ],
    },
  },
  {
    id: "rotulo",
    artigo: "um",
    nome: "Rótulo",
    emoji: "🏷️",
    grupo: "informar",
    paraQue: "Dizer o que tem dentro da embalagem.",
    ondeAparece: "Coladinho no pacote, na lata, na garrafa.",
    comoReconhecer: [
      "Traz o nome do produto e a marca",
      "Tem o peso ou o volume",
      "Tem lista de ingredientes e data de validade",
    ],
    exemplo: {
      formato: "rotulo",
      titulo: "Biscoito de Polvilho",
      assinatura: "Sabor da Floresta",
      campos: [
        { rotulo: "Peso líquido", valor: "150 g" },
        { rotulo: "Validade", valor: "12/2026" },
        { rotulo: "Lote", valor: "AC-4471" },
      ],
      secoes: [
        {
          titulo: "Ingredientes",
          linhas: ["Polvilho doce, óleo vegetal, ovos, sal e água. NÃO CONTÉM GLÚTEN."],
        },
        {
          titulo: "Informação nutricional (porção de 30 g)",
          linhas: [
            "Valor energético: 130 kcal",
            "Carboidratos: 22 g",
            "Proteínas: 1,2 g",
            "Sódio: 180 mg",
          ],
        },
      ],
    },
  },

  /* ---------------------------- informar ---------------------------- */
  {
    id: "verbete",
    artigo: "um",
    nome: "Verbete de dicionário",
    emoji: "📚",
    grupo: "informar",
    paraQue: "Explicar o que uma palavra significa.",
    ondeAparece: "No dicionário, em papel ou no celular.",
    comoReconhecer: [
      "Começa com a palavra em destaque",
      "Diz a classe: substantivo, verbo, adjetivo",
      "Pode ter mais de um significado, numerados",
    ],
    exemplo: {
      formato: "papel",
      titulo: "i·ga·ra·pé",
      linhas: [
        "substantivo masculino",
        "",
        "1. Braço estreito de rio, comum na Amazônia, por onde passa canoa.",
        "   “As crianças tomam banho no igarapé atrás da escola.”",
        "",
        "2. Caminho de água entre as ilhas.",
        "",
        "Origem: do tupi igara (canoa) + apé (caminho).",
      ],
    },
  },
  {
    id: "blog",
    artigo: "um",
    nome: "Post de blog",
    emoji: "💻",
    grupo: "informar",
    paraQue: "Contar ou ensinar alguma coisa na internet, com jeito de conversa.",
    ondeAparece: "Em sites e páginas pessoais.",
    comoReconhecer: [
      "Tem título, autor e data",
      "O texto fala direto com quem lê: 'você'",
      "Embaixo tem comentários e botão de curtir",
    ],
    exemplo: {
      formato: "blog",
      titulo: "Como a nossa turma montou uma horta em 3 semanas",
      assinatura: "por Turma do 4º A · 8 de abril de 2026 · 12 comentários",
      linhas: [
        "Você já pensou que dá para plantar cheiro-verde numa garrafa velha? A gente também não — até a professora aparecer com um caixote e um saco de terra.",
        "",
        "Na primeira semana, separamos as garrafas e furamos o fundo. Na segunda, plantamos coentro, cebolinha e alface. Na terceira, já tinha folha verde para colher.",
        "",
        "A parte mais difícil foi lembrar de regar todo dia. Resolvemos com uma escala no quadro: cada dupla cuida de um dia.",
        "",
        "No próximo post a gente conta como foi a primeira salada!",
      ],
    },
  },
  {
    id: "cartaz",
    artigo: "um",
    nome: "Cartaz",
    emoji: "📢",
    grupo: "informar",
    paraQue: "Avisar muita gente de uma vez, de longe.",
    ondeAparece: "No mural da escola, no poste, na parede do mercado.",
    comoReconhecer: [
      "Letras grandes, pouca palavra",
      "Tem cor e desenho para chamar atenção",
      "Diz o quê, quando e onde",
    ],
    exemplo: {
      formato: "cartaz",
      titulo: "Campanha do Agasalho",
      linhas: [
        "DOE UM COBERTOR",
        "",
        "De 1º a 30 de junho",
        "",
        "Entregue na secretaria da escola",
        "",
        "Sua doação esquenta a noite de alguém.",
      ],
    },
  },
  {
    id: "placa",
    artigo: "uma",
    nome: "Placa",
    emoji: "🚸",
    grupo: "informar",
    paraQue: "Avisar ou orientar quem está passando.",
    ondeAparece: "Na rua, na estrada, na porta das salas.",
    comoReconhecer: [
      "Pouquíssimas palavras, às vezes nenhuma",
      "Usa símbolo e cor com significado",
      "Precisa ser entendida em um segundo",
    ],
    exemplo: {
      formato: "placa",
      titulo: "ESCOLA",
      linhas: ["REDUZA A VELOCIDADE", "40 km/h"],
    },
  },
  {
    id: "anuncio",
    artigo: "um",
    nome: "Anúncio",
    emoji: "📣",
    grupo: "opinar",
    paraQue: "Convencer alguém a comprar ou a fazer alguma coisa.",
    ondeAparece: "Na TV, no rádio, na internet, no jornal.",
    comoReconhecer: [
      "Fala direto com você e manda: compre, venha, aproveite",
      "Só mostra o lado bom do produto",
      "Tem preço, promessa e prazo",
    ],
    exemplo: {
      formato: "cartaz",
      titulo: "Sorveteria Açaí do Ponto",
      linhas: [
        "AÇAÍ NA TIGELA",
        "",
        "Leve 2, pague 1!",
        "",
        "Só nesta sexta, das 14h às 18h.",
        "",
        "Rua do Comércio, 120 — ao lado da praça",
      ],
    },
  },
  {
    id: "opiniao",
    artigo: "um",
    nome: "Artigo de opinião",
    emoji: "💭",
    grupo: "opinar",
    paraQue: "Defender uma ideia com motivos.",
    ondeAparece: "No jornal, em revistas, em blogs.",
    comoReconhecer: [
      "Diz claramente o que o autor pensa",
      "Apresenta motivos e exemplos",
      "Termina propondo alguma coisa",
    ],
    exemplo: {
      formato: "jornal",
      titulo: "O recreio também é hora de aprender",
      assinatura: "Opinião · por Maria Eduarda, 5º ano",
      linhas: [
        "Na minha opinião, o recreio da nossa escola deveria durar dez minutos a mais.",
        "",
        "O primeiro motivo é que quase metade do tempo vai embora na fila do lanche. Sobra pouco para brincar de verdade.",
        "",
        "Além disso, é no recreio que a gente aprende a dividir, a esperar a vez e a fazer amizade — coisas que nenhuma prova ensina.",
        "",
        "Concluindo, dez minutos a mais custariam pouco e valeriam muito.",
      ],
    },
  },
  {
    id: "entrevista",
    artigo: "uma",
    nome: "Entrevista",
    emoji: "🎤",
    grupo: "informar",
    paraQue: "Mostrar o que uma pessoa respondeu sobre um assunto.",
    ondeAparece: "No jornal, na TV, no podcast.",
    comoReconhecer: [
      "Perguntas e respostas se alternam",
      "A pergunta vem em destaque ou em negrito",
      "Antes começa uma apresentação de quem está sendo entrevistado",
    ],
    exemplo: {
      formato: "jornal",
      titulo: "“O rio ensina quem sabe olhar”",
      assinatura: "Entrevista com seu Raimundo, pescador há 40 anos",
      linhas: [
        "Gazeta: O senhor pesca desde quando?",
        "Seu Raimundo: Desde os nove anos, com meu pai. Hoje tenho sessenta e dois.",
        "",
        "Gazeta: O rio mudou nesse tempo?",
        "Seu Raimundo: Mudou muito. A água baixa mais cedo e o peixe ficou arisco.",
        "",
        "Gazeta: O que o senhor diria para as crianças?",
        "Seu Raimundo: Que cuidem da margem. Rio sem árvore vira valeta.",
      ],
    },
  },
  {
    id: "biografia",
    artigo: "uma",
    nome: "Biografia",
    emoji: "👤",
    grupo: "informar",
    paraQue: "Contar a vida de uma pessoa de verdade.",
    ondeAparece: "Em livros, enciclopédias e sites.",
    comoReconhecer: [
      "Fala de uma pessoa real",
      "Segue a ordem do tempo: nasceu, cresceu, fez",
      "Traz datas e lugares",
    ],
    exemplo: {
      formato: "papel",
      titulo: "Chico Mendes (1944 — 1988)",
      linhas: [
        "Francisco Alves Mendes Filho nasceu em 15 de dezembro de 1944, em Xapuri, no Acre.",
        "",
        "Filho de seringueiros, aprendeu a ler já rapaz e passou a organizar os companheiros de seringal para defender a floresta em que viviam.",
        "",
        "Criou os empates, manifestações pacíficas em que homens, mulheres e crianças se punham na frente das motosserras.",
        "",
        "Foi morto em 22 de dezembro de 1988. Hoje é lembrado no mundo inteiro como defensor da Amazônia.",
      ],
    },
  },
];

export const GRUPOS: { id: Agrupamento; nome: string; descricao: string }[] = [
  {
    id: "dia a dia",
    nome: "Do dia a dia",
    descricao: "Textos para combinar coisas com as pessoas",
  },
  { id: "narrar", nome: "Para contar histórias", descricao: "Textos que narram alguma coisa" },
  { id: "poético", nome: "Para brincar e sentir", descricao: "Textos com ritmo, rima e graça" },
  { id: "informar", nome: "Para informar", descricao: "Textos que dizem como as coisas são" },
  { id: "instruir", nome: "Para ensinar a fazer", descricao: "Textos que mandam e orientam" },
  { id: "opinar", nome: "Para convencer", descricao: "Textos que defendem uma ideia" },
];

export function generosDoGrupo(g: Agrupamento): GeneroTexto[] {
  return GENEROS_TEXTO.filter((x) => x.grupo === g);
}
