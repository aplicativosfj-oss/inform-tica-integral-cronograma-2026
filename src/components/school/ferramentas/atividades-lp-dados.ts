import type { Questao } from "@/components/school/ferramentas/quiz";

export type Serie = 1 | 2 | 3 | 4 | 5;

export interface AtividadeLP {
  id: string;
  serie: Serie;
  titulo: string;
  emoji: string;
  /** Pasta do acervo do grupo de LP (Google Drive) que inspirou a atividade. */
  origem: string;
  objetivo: string;
  /** Texto de apoio — autoral, reescrito para a idade (não copiado do material original). */
  texto?: { titulo: string; paragrafos: string[] };
  questoes: Questao[];
  /** Versão para crianças com deficiência / NEE: menos opções, apoio visual, frases curtas. */
  adaptada: {
    textoCurto?: string[];
    questoes: Questao[];
    dicasMediador: string[];
  };
  /** Passo a passo para a professora fazer a atividade em sala (fora da tela). */
  emSala: string[];
}

const q = (
  id: string,
  enunciado: string,
  opcoes: string[],
  respostaCorreta: number,
  explicacao?: string,
): Questao => ({ id, enunciado, opcoes, respostaCorreta, ...(explicacao ? { explicacao } : {}) });

export const SERIES: { serie: Serie; nome: string; foco: string }[] = [
  { serie: 1, nome: "1º ano", foco: "Letras, sílabas, rimas e escuta de histórias" },
  { serie: 2, nome: "2º ano", foco: "Leitura de frases, adivinhas, bilhetes e contos curtos" },
  { serie: 3, nome: "3º ano", foco: "Fábulas, contos clássicos, verbos e sinais de pontuação" },
  { serie: 4, nome: "4º ano", foco: "Provérbios, notícia, HQ, comparação e mistério" },
  { serie: 5, nome: "5º ano", foco: "Cordel, entrevista, fato x opinião e conectores" },
];

export const ATIVIDADES_LP: AtividadeLP[] = [
  // ───────────────────────── 1º ANO ─────────────────────────
  {
    id: "1-charadas-o-que-e",
    serie: 1,
    titulo: "O que é, o que é? (charadinhas)",
    emoji: "❓",
    origem: "GÊNERO ENIGMA — livro de charadinhas",
    objetivo: "Escutar e compreender adivinhas, relacionando pistas ao objeto.",
    questoes: [
      q(
        "c1",
        "O que é, o que é? Branco por fora, amarelo por dentro. 🥚",
        ["Ovo", "Banana", "Queijo"],
        0,
      ),
      q(
        "c2",
        "O que é, o que é? Tem dentes, mas não morde. 🪮",
        ["Pente", "Cachorro", "Jacaré"],
        0,
      ),
      q("c3", "O que é, o que é? Cai em pé e corre deitado. 🌧️", ["Chuva", "Bola", "Gato"], 0),
      q(
        "c4",
        "O que é, o que é? Tem asa, mas não é passarinho, e faz zum-zum. 🐝",
        ["Abelha", "Avião", "Peixe"],
        0,
      ),
    ],
    adaptada: {
      questoes: [
        q("c1a", "🥚 Branco por fora, amarelo por dentro. É o…", ["🥚 Ovo", "🍌 Banana"], 0),
        q("c3a", "🌧️ Cai do céu e molha o chão. É a…", ["🌧️ Chuva", "⚽ Bola"], 0),
      ],
      dicasMediador: [
        "Leia a charada em voz alta, devagar, e mostre o objeto real ou a figura.",
        "Aceite resposta apontando a figura — não é preciso falar ou escrever.",
      ],
    },
    emSala: [
      "Coloque objetos numa caixa (ovo de plástico, pente, bola) e leia a charada antes de tirar cada um.",
      "Cada criança desenha a resposta de uma charada e escreve a primeira letra.",
      "Desafio: a turma inventa uma charada coletiva, com a professora como escriba.",
    ],
  },
  {
    id: "1-princesa-ervilha-sons",
    serie: 1,
    titulo: "A princesa e a ervilha — escuta e sílabas",
    emoji: "👑",
    origem: "A Princesa e A Ervilha",
    objetivo: "Escutar conto clássico, identificar personagens e contar sílabas.",
    texto: {
      titulo: "A princesa e a ervilha (reconto)",
      paragrafos: [
        "Um príncipe queria casar com uma princesa de verdade.",
        "Numa noite de chuva, uma moça molhada bateu no castelo. Ela disse que era princesa.",
        "A rainha colocou uma ervilha embaixo de muitos colchões.",
        "De manhã, a moça disse: — Dormi mal! Tinha algo duro na cama!",
        "Só uma princesa de verdade sentiria a ervilha. E o príncipe casou com ela.",
      ],
    },
    questoes: [
      q("p1", "Quem bateu na porta do castelo?", ["Uma moça", "Um cachorro", "Um palhaço"], 0),
      q(
        "p2",
        "O que a rainha colocou embaixo dos colchões?",
        ["Uma ervilha", "Uma pedra", "Um sapo"],
        0,
      ),
      q("p3", "Quantas sílabas tem a palavra PRIN-CE-SA?", ["2", "3", "4"], 1),
      q("p4", "Qual palavra começa com a mesma letra de REI?", ["RATO", "BOLA", "MALA"], 0),
    ],
    adaptada: {
      textoCurto: ["A moça dormiu na cama. 🛏️", "Tinha uma ervilha. 🟢", "Ela era princesa! 👑"],
      questoes: [
        q("p1a", "Quem é a princesa?", ["👸 Moça de coroa", "🐶 Cachorro"], 0),
        q("p2a", "O que estava na cama?", ["🟢 Ervilha", "🍉 Melancia"], 0),
      ],
      dicasMediador: [
        "Use um grão de feijão/ervilha e almofadas para dramatizar a história.",
        "Bata palmas junto com a criança para contar as sílabas de PRIN-CE-SA.",
      ],
    },
    emSala: [
      "Monte a pilha de 'colchões' com folhas coloridas e escreva uma palavra da história em cada uma.",
      "Bata palmas para separar sílabas: REI, RAI-NHA, CAS-TE-LO, ER-VI-LHA.",
      "Pintar e recortar a coroa da princesa e escrever o nome da criança nela.",
    ],
  },
  {
    id: "1-rimas-bingo",
    serie: 1,
    titulo: "Bingo das rimas",
    emoji: "🎯",
    origem: "BINGOS / Bingo 9º ano (adaptado)",
    objetivo: "Perceber rimas e sons finais das palavras.",
    questoes: [
      q("r1", "Qual palavra rima com GATO?", ["PATO", "BOLA", "CASA"], 0),
      q("r2", "Qual palavra rima com MÃO?", ["PÃO", "PÉ", "LUA"], 0),
      q("r3", "Qual palavra rima com JANELA?", ["PANELA", "CADEIRA", "MESA"], 0),
      q("r4", "Qual palavra rima com CHINELO?", ["MARTELO", "SAPATO", "MEIA"], 0),
    ],
    adaptada: {
      questoes: [
        q("r1a", "🐱 GATO rima com…", ["🦆 PATO", "⚽ BOLA"], 0),
        q("r2a", "✋ MÃO rima com…", ["🍞 PÃO", "🌙 LUA"], 0),
      ],
      dicasMediador: [
        "Fale as duas palavras exagerando o final: ga-TO / pa-TO.",
        "Use cartões com figura — a criança junta os pares iguais no final.",
      ],
    },
    emSala: [
      "Cartela de bingo com 6 figuras; a professora fala uma palavra e a criança marca a figura que rima.",
      "Quem completar a cartela grita 'RIMEI!' e lê as rimas para a turma.",
    ],
  },
  {
    id: "1-stop-letra",
    serie: 1,
    titulo: "Stop das letras",
    emoji: "✋",
    origem: "ATIVIDADES STOP / BANCO DE PALAVRAS SOLETRANDO",
    objetivo: "Relacionar letra inicial a palavras (nomes, frutas, animais).",
    questoes: [
      q("s1", "Qual FRUTA começa com a letra B?", ["Banana", "Uva", "Maçã"], 0),
      q("s2", "Qual ANIMAL começa com a letra C?", ["Cavalo", "Pato", "Macaco"], 0),
      q("s3", "Qual NOME começa com a letra A?", ["Ana", "Bia", "Duda"], 0),
      q("s4", "Qual palavra começa com a letra M?", ["Macaco", "Sapo", "Tatu"], 0),
    ],
    adaptada: {
      questoes: [
        q("s1a", "🍌 BANANA começa com…", ["B", "U"], 0),
        q("s2a", "🐴 CAVALO começa com…", ["C", "P"], 0),
      ],
      dicasMediador: [
        "Use o alfabeto móvel: a criança pega a letra, em vez de escrever.",
        "Trabalhe primeiro as letras do próprio nome.",
      ],
    },
    emSala: [
      "Tabela Stop simplificada: NOME | ANIMAL | FRUTA. A professora sorteia a letra.",
      "Vale desenhar no lugar de escrever para quem ainda não escreve.",
    ],
  },

  // ───────────────────────── 2º ANO ─────────────────────────
  {
    id: "2-bilhete-caneta-azul",
    serie: 2,
    titulo: "Cadê a caneta azul? — bilhete",
    emoji: "🖊️",
    origem: "ATIVIDADE MÚSICA CANETA AZUL / O caso da caneta azul",
    objetivo: "Ler e produzir bilhete: destinatário, recado, despedida e assinatura.",
    texto: {
      titulo: "Bilhete",
      paragrafos: [
        "Querida professora Rosa,",
        "Perdi minha caneta azul no recreio. Ela tem uma tampa com estrelinha.",
        "Se alguém achar, pode deixar na minha mesa?",
        "Obrigado!",
        "Pedro — 2º ano",
      ],
    },
    questoes: [
      q(
        "b1",
        "Para quem Pedro escreveu o bilhete?",
        ["Para a professora Rosa", "Para a mãe", "Para o diretor"],
        0,
      ),
      q("b2", "O que Pedro perdeu?", ["Uma caneta azul", "Um caderno", "Uma borracha"], 0),
      q(
        "b3",
        "Como era a caneta?",
        ["Tinha tampa com estrelinha", "Era vermelha", "Era muito grande"],
        0,
      ),
      q("b4", "Quem assinou o bilhete?", ["Pedro", "Rosa", "O diretor"], 0),
      q(
        "b5",
        "Para que serve um bilhete?",
        ["Dar um recado curto", "Contar uma história longa", "Ensinar uma receita"],
        0,
      ),
    ],
    adaptada: {
      textoCurto: ["Pedro perdeu a caneta azul. 🖊️", "Ele escreveu para a professora. ✉️"],
      questoes: [
        q("b2a", "O que Pedro perdeu?", ["🖊️ Caneta", "📚 Livro"], 0),
        q("b1a", "Qual a cor da caneta?", ["🔵 Azul", "🔴 Vermelha"], 0),
      ],
      dicasMediador: [
        "Esconda uma caneta azul na sala e brinque de 'caçar' junto com a criança.",
        "Para escrever, ofereça o bilhete com lacunas: 'Querida ____, eu perdi ____.'",
      ],
    },
    emSala: [
      "Brincadeira do detetive: esconder uma caneta azul e dar pistas escritas ('está perto de algo verde').",
      "Cada criança escreve um bilhete para um colega pedindo ajuda para achar um objeto.",
      "Colar os bilhetes num mural 'Achados e Perdidos'.",
    ],
  },
  {
    id: "2-piada-adivinha",
    serie: 2,
    titulo: "Piadas e adivinhas para rir",
    emoji: "😂",
    origem: "GÊNERO PIADA / Atividades para descontrair",
    objetivo: "Compreender o humor pelo duplo sentido das palavras.",
    questoes: [
      q(
        "pi1",
        "Por que o livro de matemática ficou triste? Porque tinha muitos…",
        ["problemas", "desenhos", "amigos"],
        0,
        "A graça está na palavra 'problemas': é conta de matemática e também preocupação.",
      ),
      q(
        "pi2",
        "Qual é o animal que anda com as patas? O…",
        ["pato (anda com as patas!)", "peixe", "cavalo"],
        0,
        "'Patas' são os pés dos animais e também as fêmeas do pato!",
      ),
      q("pi3", "Quando o sapato ri?", ["Quando acha graça no pé", "Quando chove", "Nunca"], 0),
      q(
        "pi4",
        "Para que serve uma piada?",
        ["Para fazer rir", "Para ensinar receita", "Para dar notícia"],
        0,
      ),
    ],
    adaptada: {
      questoes: [
        q("pi4a", "Piada faz a gente…", ["😂 Rir", "😢 Chorar"], 0),
        q("pi2a", "O pato anda com as…", ["🦆 Patas", "🚗 Rodas"], 0),
      ],
      dicasMediador: [
        "Conte a piada com expressão e gestos; o importante é a participação, não 'entender' tudo.",
        "Deixe a criança escolher o emoji que mostra como ela se sentiu.",
      ],
    },
    emSala: [
      "Roda de piadas: cada criança conta uma piada que ouviu em casa (combinar antes: piadas sem ofensas).",
      "Montar um 'Livro de piadas da turma' com desenho e texto de cada criança.",
    ],
  },
  {
    id: "2-coisas-boas-lista",
    serie: 2,
    titulo: "As coisas boas da vida — gênero lista",
    emoji: "📝",
    origem: "ATIVIDADE AS COISAS BOAS DA VIDA / GÊNERO LISTA",
    objetivo: "Reconhecer e produzir lista, um item embaixo do outro.",
    texto: {
      titulo: "Coisas boas da vida",
      paragrafos: [
        "• Banho de rio no Envira",
        "• Açaí com farinha",
        "• Abraço da vovó",
        "• Brincar de bola na chuva",
        "• Ouvir história antes de dormir",
      ],
    },
    questoes: [
      q(
        "l1",
        "Como os itens de uma lista são escritos?",
        ["Um embaixo do outro", "Tudo junto numa frase só", "Em forma de poema"],
        0,
      ),
      q("l2", "Qual item está na lista?", ["Abraço da vovó", "Ir ao dentista", "Lavar louça"], 0),
      q(
        "l3",
        "Qual destas NÃO é uma lista?",
        ["Um conto de fadas", "Lista de compras", "Lista de convidados"],
        0,
      ),
    ],
    adaptada: {
      questoes: [
        q("l2a", "O que é uma coisa boa?", ["🤗 Abraço", "🤕 Machucado"], 0),
        q(
          "l1a",
          "O que você gosta?",
          ["🍧 Açaí", "🥦 Brócolis (vale as duas!)"],
          0,
          "Aqui não tem resposta errada: o importante é escolher!",
        ),
      ],
      dicasMediador: [
        "A lista pode ser feita com figuras recortadas de revista coladas uma embaixo da outra.",
        "Pergunte com apoio visual: 'Você gosta disso? 👍 ou 👎'.",
      ],
    },
    emSala: [
      "Cada criança faz a sua lista de 5 coisas boas e ilustra.",
      "Mural da turma: 'Nossa lista gigante de coisas boas'.",
    ],
  },
  {
    id: "2-domino-classes",
    serie: 2,
    titulo: "Dominó: nome e figura",
    emoji: "🁫",
    origem: "Dominó de Classes Gramaticais / DOMINÓ DAS FIGURAS",
    objetivo: "Ler palavras e associá-las às figuras (substantivos concretos).",
    questoes: [
      q("d1", "Qual palavra combina com 🐟?", ["PEIXE", "PEDRA", "PENTE"], 0),
      q("d2", "Qual palavra combina com 🌳?", ["ÁRVORE", "ANEL", "AVIÃO"], 0),
      q("d3", "Qual palavra combina com 🍍?", ["ABACAXI", "ABELHA", "AMORA"], 0),
      q("d4", "Qual palavra combina com 🦜?", ["PAPAGAIO", "PANELA", "PIPOCA"], 0),
    ],
    adaptada: {
      questoes: [q("d1a", "🐟 é…", ["PEIXE", "BOLA"], 0), q("d2a", "🌳 é…", ["ÁRVORE", "SAPO"], 0)],
      dicasMediador: [
        "Peças grandes (A5) e plastificadas facilitam o manuseio.",
        "Leia a palavra junto, apontando cada letra.",
      ],
    },
    emSala: [
      "Dominó impresso: cada peça tem uma figura de um lado e uma palavra do outro.",
      "Jogar em duplas; quem encaixar lê a palavra em voz alta.",
    ],
  },

  // ───────────────────────── 3º ANO ─────────────────────────
  {
    id: "3-cigarra-formiga",
    serie: 3,
    titulo: "A cigarra e a formiga — duas versões",
    emoji: "🐜",
    origem: "FÁBULAS WORD + PDF (A formiga boa / A formiga má)",
    objetivo: "Comparar duas versões de uma fábula e identificar a moral.",
    texto: {
      titulo: "A cigarra e a formiga (reconto)",
      paragrafos: [
        "Durante o verão, a cigarra cantava o dia inteiro, enquanto a formiga trabalhava guardando comida.",
        "Quando chegou o inverno frio, a cigarra ficou sem comida e sem abrigo. Ela bateu na porta da formiga.",
        "Em uma versão, a formiga disse: 'Você cantou? Agora dance!' e fechou a porta.",
        "Em outra versão, a formiga lembrou que o canto da cigarra alegrava o trabalho, e a convidou para entrar.",
      ],
    },
    questoes: [
      q("f1", "O que a formiga fazia no verão?", ["Guardava comida", "Cantava", "Dormia"], 0),
      q("f2", "O que a cigarra fazia no verão?", ["Cantava", "Trabalhava", "Viajava"], 0),
      q(
        "f3",
        "Na versão da 'formiga boa', o que ela fez?",
        ["Ajudou a cigarra", "Fechou a porta", "Brigou com a cigarra"],
        0,
      ),
      q(
        "f4",
        "Qual pode ser uma moral da versão da formiga boa?",
        ["A arte e a amizade também têm valor", "Nunca cante", "Não abra a porta"],
        0,
      ),
      q(
        "f5",
        "Fábula é uma história com…",
        ["Animais que falam e uma lição", "Receita de bolo", "Notícia do jornal"],
        0,
      ),
    ],
    adaptada: {
      textoCurto: [
        "A formiga trabalhou. 🐜",
        "A cigarra cantou. 🎵",
        "Veio o frio. ❄️",
        "A formiga ajudou a cigarra. 🤝",
      ],
      questoes: [
        q("f1a", "Quem trabalhou?", ["🐜 Formiga", "🦗 Cigarra"], 0),
        q("f2a", "Quem cantou?", ["🦗 Cigarra", "🐜 Formiga"], 0),
      ],
      dicasMediador: [
        "Use fantoches de dedo (formiga e cigarra) para contar a história.",
        "Sequência com 4 figuras: a criança ordena o começo, meio e fim.",
      ],
    },
    emSala: [
      "Ler as duas versões e fazer uma tabela: O que é igual? O que é diferente?",
      "Votação: qual final a turma prefere? Por quê? (oralidade)",
      "Escrever um terceiro final para a fábula.",
    ],
  },
  {
    id: "3-verbos-acao",
    serie: 3,
    titulo: "Verbos em ação",
    emoji: "🏃",
    origem: "DOMINÓ DOS VERBOS / atividade verbos - música pesadão",
    objetivo: "Reconhecer o verbo como palavra de ação e o tempo (passado/presente/futuro).",
    questoes: [
      q("v1", "Qual palavra é um VERBO (ação)?", ["Correr", "Bola", "Bonito"], 0),
      q("v2", "Na frase 'O menino pulou a poça', o verbo é…", ["pulou", "menino", "poça"], 0),
      q("v3", "'Ontem eu BRINQUEI.' O verbo está no…", ["Passado", "Presente", "Futuro"], 0),
      q("v4", "'Amanhã eu VOU NADAR no rio.' Está no…", ["Futuro", "Passado", "Presente"], 0),
      q(
        "v5",
        "Qual frase tem o verbo no presente?",
        ["Eu leio um livro agora.", "Eu li um livro ontem.", "Eu lerei amanhã."],
        0,
      ),
    ],
    adaptada: {
      questoes: [
        q("v1a", "Qual é uma AÇÃO?", ["🏃 Correr", "⚽ Bola"], 0),
        q("v2a", "O que o menino faz? 🏊", ["Nada", "Mesa"], 0),
      ],
      dicasMediador: [
        "Brinque de 'mímica': a criança faz a ação e o grupo adivinha o verbo.",
        "Use cartões com figura de ação.",
      ],
    },
    emSala: [
      "Mímica dos verbos: sortear um cartão e representar a ação.",
      "Dominó dos verbos: juntar verbo no presente com o passado (corro — corri).",
    ],
  },
  {
    id: "3-pontuacao-telefonema",
    serie: 3,
    titulo: "Dinâmica do telefonema — pontuação no diálogo",
    emoji: "📞",
    origem: "DINÂMICA DO TELEFONEMA",
    objetivo: "Usar travessão, ponto de interrogação e exclamação em diálogos.",
    texto: {
      titulo: "Telefonema",
      paragrafos: [
        "— Alô! Quem fala?",
        "— É a Lia. A Bia está?",
        "— Está sim. Vou chamar.",
        "— Obrigada!",
      ],
    },
    questoes: [
      q(
        "t1",
        "Para que serve o travessão (—) no diálogo?",
        ["Mostrar quem começa a falar", "Terminar a história", "Separar as sílabas"],
        0,
      ),
      q("t2", "Qual sinal usamos numa pergunta?", ["?", "!", "."], 0),
      q("t3", "'Obrigada!' termina com ponto de…", ["exclamação", "interrogação", "vírgula"], 0),
      q("t4", "Quem ligou no telefone?", ["Lia", "Bia", "A professora"], 0),
    ],
    adaptada: {
      questoes: [
        q("t2a", "Pergunta usa…", ["❓ ?", "❗ !"], 0),
        q("t4a", "Quem ligou?", ["Lia 📞", "Bia 🏠"], 0),
      ],
      dicasMediador: [
        "Use telefones de brinquedo e faça o diálogo de verdade.",
        "Mostre o sinal em cartão grande ao falar a frase com entonação.",
      ],
    },
    emSala: [
      "Em duplas, simular um telefonema e depois escrever o diálogo com travessão.",
      "Ler em voz alta mudando a entonação conforme o sinal.",
    ],
  },
  {
    id: "3-detetive-mochila",
    serie: 3,
    titulo: "Detetive mirim: o sumiço do lanche",
    emoji: "🔍",
    origem: "GÊNERO ENIGMA / CURSO DO LEITOR DETETIVE (adaptado, sem crimes)",
    objetivo: "Localizar pistas no texto e fazer inferências simples.",
    texto: {
      titulo: "O sumiço do lanche",
      paragrafos: [
        "Na hora do recreio, Júlia abriu a mochila e o bolo de milho tinha sumido!",
        "No chão havia migalhas amarelas e marquinhas de patas.",
        "Tiago disse que estava jogando bola. Marina estava na biblioteca.",
        "Pela janela, o gato da escola lambia o bigode, todo sujo de farelo amarelo.",
      ],
    },
    questoes: [
      q("de1", "O que sumiu da mochila?", ["O bolo de milho", "O caderno", "A garrafa"], 0),
      q(
        "de2",
        "Que pistas havia no chão?",
        ["Migalhas e marcas de patas", "Pegadas de sapato", "Um bilhete"],
        0,
      ),
      q(
        "de3",
        "Quem comeu o bolo?",
        ["O gato da escola", "Tiago", "Marina"],
        0,
        "As marcas de patas e o bigode sujo de farelo amarelo são as pistas!",
      ),
      q("de4", "Onde estava Marina?", ["Na biblioteca", "No pátio", "Na cantina"], 0),
    ],
    adaptada: {
      textoCurto: ["O bolo sumiu. 🍰", "Tinha patas no chão. 🐾", "O gato estava sujo de bolo. 🐱"],
      questoes: [
        q("de1a", "O que sumiu?", ["🍰 Bolo", "📕 Caderno"], 0),
        q("de3a", "Quem comeu?", ["🐱 Gato", "👦 Tiago"], 0),
      ],
      dicasMediador: [
        "Use lupa de brinquedo e figuras das pistas para a criança 'investigar'.",
        "Faça perguntas de sim/não: 'Foi o gato?'",
      ],
    },
    emSala: [
      "Distribuir 'cartões-pista' pela sala; os grupos leem e anotam no caderno de detetive.",
      "Cada grupo apresenta a solução explicando qual pista usou.",
    ],
  },

  // ───────────────────────── 4º ANO ─────────────────────────
  {
    id: "4-proverbios-emojis",
    serie: 4,
    titulo: "Desafio: provérbios com emojis",
    emoji: "🧩",
    origem: "DESAFIO - Provérbios com emojis (Passo a passo da aula)",
    objetivo: "Conhecer provérbios, seus ensinamentos e ler linguagem não verbal.",
    questoes: [
      q(
        "pr1",
        "🐦✋ > 🐦🐦🌳 — Qual provérbio é?",
        [
          "Mais vale um pássaro na mão que dois voando",
          "Quem não tem cão caça com gato",
          "Água mole em pedra dura",
        ],
        0,
      ),
      q(
        "pr2",
        "💧🪨 — 'Água mole em pedra dura…'",
        ["…tanto bate até que fura", "…nunca molha", "…vira gelo"],
        0,
        "Ensina que a persistência vence as dificuldades.",
      ),
      q(
        "pr3",
        "🐶❌ ➡️ 🐱 — Qual provérbio é?",
        [
          "Quem não tem cão caça com gato",
          "Cão que ladra não morde",
          "Gato escaldado tem medo de água fria",
        ],
        0,
      ),
      q(
        "pr4",
        "O que o provérbio 'De grão em grão a galinha enche o papo' ensina?",
        ["Aos poucos se conquista muito", "Galinha come demais", "Não se deve comer milho"],
        0,
      ),
      q(
        "pr5",
        "Provérbio é…",
        ["Uma frase curta e popular que ensina algo", "Uma notícia", "Um poema longo"],
        0,
      ),
    ],
    adaptada: {
      questoes: [
        q("pr2a", "💧🪨 Água bate na pedra muitas vezes e…", ["Fura 🕳️", "Voa 🕊️"], 0),
        q("pr4a", "🐔🌽 A galinha come grão por grão e fica…", ["Cheia 😋", "Com frio 🥶"], 0),
      ],
      dicasMediador: [
        "Mostre o emoji e a figura real ao mesmo tempo.",
        "Foque no sentido prático: 'Se tentar muitas vezes, consegue!'",
      ],
    },
    emSala: [
      "Mostrar provérbios em emojis no quadro; grupos têm 2 minutos para adivinhar.",
      "Cada grupo cria seu próprio provérbio em emojis para a turma decifrar.",
      "Perguntar em casa: 'Que provérbio seus avós costumam falar?'",
    ],
  },
  {
    id: "4-noticia-escola",
    serie: 4,
    titulo: "Gênero notícia: manchete e lide",
    emoji: "📰",
    origem: "GÊNERO NOTÍCIA ATIVIDADES / Atividade Bagunçado com MANCHETES",
    objetivo: "Reconhecer manchete e responder O quê? Quem? Quando? Onde?",
    texto: {
      titulo: "Alunos plantam 50 mudas de açaí em Feijó",
      paragrafos: [
        "Na última sexta-feira, os estudantes do 4º ano de uma escola de Feijó plantaram 50 mudas de açaizeiro no terreno ao lado do rio Envira.",
        "A ação fez parte do projeto 'Floresta na Escola'. Segundo a professora, a ideia é que as crianças aprendam a cuidar da natureza.",
        "As mudas serão regadas pelos próprios alunos toda semana.",
      ],
    },
    questoes: [
      q(
        "n1",
        "Qual é a manchete (título) da notícia?",
        ["Alunos plantam 50 mudas de açaí em Feijó", "Floresta na Escola", "Rio Envira"],
        0,
      ),
      q(
        "n2",
        "O QUE aconteceu?",
        ["Plantaram mudas de açaí", "Fizeram uma festa", "Pescaram no rio"],
        0,
      ),
      q("n3", "QUANDO aconteceu?", ["Na última sexta-feira", "No domingo", "Nas férias"], 0),
      q(
        "n4",
        "ONDE plantaram as mudas?",
        ["No terreno ao lado do rio Envira", "Dentro da sala", "Na praça"],
        0,
      ),
      q(
        "n5",
        "Qual manchete está 'bagunçada' (errada)?",
        ["Envira rio no mudas plantam", "Chuva forte alaga ruas", "Escola ganha biblioteca nova"],
        0,
      ),
    ],
    adaptada: {
      textoCurto: ["As crianças plantaram açaí. 🌱", "Foi perto do rio. 🏞️"],
      questoes: [
        q("n2a", "O que as crianças plantaram?", ["🌱 Açaí", "🌸 Rosa"], 0),
        q("n4a", "Foi perto do…", ["🏞️ Rio", "🏙️ Prédio"], 0),
      ],
      dicasMediador: [
        "Use fotos reais de mudas e do rio.",
        "Monte a manchete com palavras recortadas em ordem.",
      ],
    },
    emSala: [
      "Manchetes bagunçadas: entregar palavras recortadas para os grupos montarem a manchete.",
      "Produzir o 'Jornal da Turma' com notícias da escola.",
    ],
  },
  {
    id: "4-comparacao-esporte",
    serie: 4,
    titulo: "Figuras de linguagem no esporte: comparação e exagero",
    emoji: "⚽",
    origem: "ATIVIDADE Figuras de Linguagem no mundo esportivo / FIGURAS DE LINGUAGENS",
    objetivo: "Perceber comparação e exagero (hipérbole) em frases do cotidiano.",
    questoes: [
      q(
        "fl1",
        "'O goleiro voou como um gavião.' Que comparação há?",
        ["Goleiro com gavião", "Bola com gavião", "Campo com céu"],
        0,
      ),
      q(
        "fl2",
        "'Já te chamei um milhão de vezes!' Isso é…",
        ["Exagero", "Comparação", "Pergunta"],
        0,
      ),
      q("fl3", "Qual palavra ajuda a fazer comparação?", ["como", "e", "mas"], 0),
      q(
        "fl4",
        "'O atacante é rápido como um raio.' Quer dizer que ele é…",
        ["Muito rápido", "Muito lento", "Elétrico"],
        0,
      ),
    ],
    adaptada: {
      questoes: [
        q("fl4a", "Rápido como um raio ⚡ quer dizer…", ["Muito rápido 🏃", "Devagar 🐢"], 0),
        q("fl1a", "Voou como um… 🦅", ["Pássaro", "Peixe"], 0),
      ],
      dicasMediador: [
        "Faça a comparação com gestos (correr rápido, andar devagar).",
        "Use pares de figuras: raio ⚡ e corredor.",
      ],
    },
    emSala: [
      "Narrar um lance de futebol como locutor, usando comparações.",
      "Criar frases 'rápido como…', 'forte como…' sobre os colegas (só elogios!).",
    ],
  },
  {
    id: "4-hq-extraordinario",
    serie: 4,
    titulo: "Respeito às diferenças (inspirado em Extraordinário)",
    emoji: "💛",
    origem: "Atividade filme Extraordinário / ATIVIDADES SOBRE FILMES",
    objetivo: "Discutir respeito e empatia; ler balões de HQ.",
    texto: {
      titulo: "Tirinha: o aluno novo",
      paragrafos: [
        "Quadro 1 — Léo chega na escola nova. Balão de pensamento: 'Será que alguém vai querer brincar comigo?'",
        "Quadro 2 — Alguns colegas cochicham. Ana se aproxima: 'Oi! Quer jogar bola com a gente?'",
        "Quadro 3 — Léo sorri: 'Quero!' Os dois correm para a quadra.",
      ],
    },
    questoes: [
      q(
        "h1",
        "O balão de PENSAMENTO mostra…",
        ["O que o personagem pensa", "O que ele grita", "O barulho do lugar"],
        0,
      ),
      q("h2", "Como Léo se sentia no começo?", ["Inseguro", "Com raiva", "Com sono"], 0),
      q(
        "h3",
        "Qual atitude de Ana foi importante?",
        ["Convidar Léo para brincar", "Cochichar", "Ignorar Léo"],
        0,
      ),
      q(
        "h4",
        "Qual a mensagem da tirinha?",
        ["Acolher quem é diferente ou novo", "Futebol é o melhor esporte", "Não fale com ninguém"],
        0,
      ),
    ],
    adaptada: {
      questoes: [
        q("h3a", "Ana foi…", ["😊 Legal", "😠 Chata"], 0),
        q("h2a", "No fim, Léo ficou…", ["😃 Feliz", "😭 Triste"], 0),
      ],
      dicasMediador: [
        "Use cartões de emoções para a criança mostrar como Léo se sentiu.",
        "Valorize que cada pessoa é única — inclusive a própria criança.",
      ],
    },
    emSala: [
      "Assistir a trechos do filme (se houver recurso) e conversar sobre empatia.",
      "Cada aluno desenha uma HQ de 3 quadros mostrando uma atitude gentil.",
      "Mural 'Seja gentil': frases gentis criadas pela turma.",
    ],
  },

  // ───────────────────────── 5º ANO ─────────────────────────
  {
    id: "5-cordel",
    serie: 5,
    titulo: "Cordel: rima, métrica e cultura popular",
    emoji: "🪕",
    origem: "GÊNERO CORDEL / ENIGMAS + CORDEL",
    objetivo: "Reconhecer características do cordel: estrofes, rimas e temas populares.",
    texto: {
      titulo: "Cordel do Envira (autoral)",
      paragrafos: [
        "Lá no meio da floresta / tem um rio bem bonito, / Envira é o nome dele, / de água doce e infinito, / quem pesca na sua margem / volta pra casa contente e aflito.",
        "Aflito porque a mãe / já chamou pro jantar, / tem peixe, farinha e açaí, / ninguém pode demorar, / e a criançada de Feijó / corre logo pro lugar.",
      ],
    },
    questoes: [
      q("co1", "Qual palavra rima com 'bonito' no cordel?", ["infinito", "floresta", "margem"], 0),
      q(
        "co2",
        "De que lugar o cordel fala?",
        ["Do rio Envira, em Feijó", "Do mar do Rio de Janeiro", "De uma cidade grande"],
        0,
      ),
      q(
        "co3",
        "Os cordéis eram vendidos pendurados em…",
        ["cordões (barbantes)", "vitrines de shopping", "caixas de papelão"],
        0,
        "Por isso o nome 'literatura de cordel'!",
      ),
      q("co4", "Cada grupo de versos se chama…", ["estrofe", "parágrafo", "manchete"], 0),
      q(
        "co5",
        "Uma ilustração típica do cordel é a…",
        ["xilogravura", "fotografia", "pintura a óleo"],
        0,
      ),
    ],
    adaptada: {
      textoCurto: ["O rio é bonito. 🏞️", "Tem peixe e açaí. 🐟🍧"],
      questoes: [
        q("co1a", "BONITO rima com…", ["INFINITO", "CASA"], 0),
        q("co2a", "O cordel fala de um…", ["🏞️ Rio", "🚀 Foguete"], 0),
      ],
      dicasMediador: [
        "Leia o cordel cantando, com ritmo e palmas.",
        "A criança pode 'escrever' o cordel com carimbos ou desenhos.",
      ],
    },
    emSala: [
      "Varal de cordéis: cada aluno escreve uma estrofe sobre Feijó e pendura no barbante.",
      "Fazer 'xilogravura' com isopor de bandeja e tinta guache.",
    ],
  },
  {
    id: "5-fato-opiniao",
    serie: 5,
    titulo: "Fato ou opinião?",
    emoji: "⚖️",
    origem: "EXERCÍCIO FATO E OPINIÃO / Artigo de Opinião (materiais + atividades)",
    objetivo: "Distinguir fato (pode ser comprovado) de opinião (o que alguém pensa).",
    questoes: [
      q("fo1", "'O Acre fica na região Norte do Brasil.'", ["Fato", "Opinião"], 0),
      q("fo2", "'Açaí é a comida mais gostosa do mundo.'", ["Opinião", "Fato"], 0),
      q("fo3", "'A escola tem 12 salas de aula.'", ["Fato", "Opinião"], 0),
      q("fo4", "'O recreio deveria durar uma hora.'", ["Opinião", "Fato"], 0),
      q(
        "fo5",
        "Qual expressão costuma indicar opinião?",
        ["Eu acho que…", "Segundo o IBGE…", "No ano de 2020…"],
        0,
      ),
    ],
    adaptada: {
      questoes: [
        q("fo2a", "'Eu ACHO o açaí gostoso.' É o que eu…", ["💭 Penso", "📏 Medi"], 0),
        q("fo1a", "O céu fica em cima. É…", ["✅ Verdade para todos", "💭 Só o que eu acho"], 0),
      ],
      dicasMediador: [
        "Use 'eu gosto / eu não gosto' para trabalhar a opinião.",
        "Mostre um objeto e compare: 'é vermelho' (fato) x 'é bonito' (opinião).",
      ],
    },
    emSala: [
      "Jogo do semáforo: a professora lê uma frase; verde = fato, amarelo = opinião.",
      "Debate: 'Deveria ter aula de informática todo dia?' — cada um dá opinião com um motivo.",
    ],
  },
  {
    id: "5-conectores-aventura",
    serie: 5,
    titulo: "Aventura solo: em busca da caneta azul (conectores)",
    emoji: "🗺️",
    origem: "AVENTURA SOLO (rpg) EM BUSCA DA CANETA AZUL / CONECTORES ATIVIDADE",
    objetivo: "Usar conectores (mas, porque, então, depois) para ligar ideias.",
    questoes: [
      q(
        "cn1",
        "Você procurou no pátio, ___ não achou a caneta.",
        ["mas", "porque", "e depois"],
        0,
        "'Mas' indica oposição: procurou, porém não achou.",
      ),
      q(
        "cn2",
        "Você foi à biblioteca ___ alguém disse que viu a caneta lá.",
        ["porque", "mas", "então"],
        0,
        "'Porque' indica a causa.",
      ),
      q(
        "cn3",
        "Achou uma pista no chão, ___ seguiu as pegadas.",
        ["então", "mas", "porém"],
        0,
        "'Então' indica consequência.",
      ),
      q(
        "cn4",
        "Primeiro você abriu o armário, ___ olhou embaixo da mesa.",
        ["depois", "porque", "mas"],
        0,
      ),
      q(
        "cn5",
        "Final: a caneta estava no bolso do dono! O conector 'MAS' indica…",
        ["oposição", "adição", "tempo"],
        0,
      ),
    ],
    adaptada: {
      questoes: [
        q("cn4a", "Primeiro 🚪 abro a porta, ___ 🚶 entro.", ["depois", "ontem"], 0),
        q("cn1a", "Procurei 🔍, ___ não achei ❌.", ["mas", "e"], 0),
      ],
      dicasMediador: [
        "Faça a aventura andando pela sala, com setas no chão.",
        "Trabalhe primeiro 'primeiro / depois / no final' com fotos da rotina.",
      ],
    },
    emSala: [
      "Montar a aventura em estações pela sala; em cada uma, o conector certo mostra o próximo destino.",
      "Escrever o relato da aventura usando pelo menos 4 conectores diferentes.",
    ],
  },
  {
    id: "5-entrevista",
    serie: 5,
    titulo: "Gênero entrevista: conversando com quem sabe",
    emoji: "🎤",
    origem: "GÊNERO ENTREVISTA ATIVIDADES / FICHAS DE ENTREVISTAS",
    objetivo: "Planejar perguntas, reconhecer entrevistador e entrevistado.",
    texto: {
      titulo: "Entrevista com Dona Raimunda, artesã de Feijó",
      paragrafos: [
        "Repórter: Há quanto tempo a senhora faz artesanato?",
        "Dona Raimunda: Desde menina. Aprendi com minha avó a trançar palha.",
        "Repórter: Que materiais a senhora usa?",
        "Dona Raimunda: Palha de buriti, sementes e cipó da floresta.",
        "Repórter: Que conselho deixa para as crianças?",
        "Dona Raimunda: Aprendam com os mais velhos. Nossa cultura é um tesouro.",
      ],
    },
    questoes: [
      q("e1", "Quem é a entrevistada?", ["Dona Raimunda", "O repórter", "A avó"], 0),
      q("e2", "Com quem ela aprendeu a trançar?", ["Com a avó", "Na escola", "Na internet"], 0),
      q("e3", "Qual material ela usa?", ["Palha de buriti", "Plástico", "Metal"], 0),
      q(
        "e4",
        "Numa entrevista, quem faz as perguntas é o…",
        ["entrevistador (repórter)", "entrevistado", "leitor"],
        0,
      ),
      q(
        "e5",
        "Qual é uma boa pergunta para entrevistar um pescador?",
        [
          "Que peixe é mais fácil de pescar no Envira?",
          "Qual é a sua cor favorita de carro?",
          "Quanto é 2 + 2?",
        ],
        0,
      ),
    ],
    adaptada: {
      textoCurto: ["Dona Raimunda faz artesanato. 🧺", "Ela aprendeu com a avó. 👵"],
      questoes: [
        q("e3a", "Ela faz cestas com…", ["🌾 Palha", "🧱 Tijolo"], 0),
        q("e2a", "Quem ensinou ela?", ["👵 Avó", "🤖 Robô"], 0),
      ],
      dicasMediador: [
        "A criança pode entrevistar usando cartões de pergunta já prontos.",
        "Grave um áudio da entrevista no celular em vez de escrever.",
      ],
    },
    emSala: [
      "Ficha de entrevista: cada aluno prepara 5 perguntas para alguém da família ou da comunidade.",
      "Apresentar a entrevista em forma de 'programa de TV' com microfone de papel.",
    ],
  },
];
