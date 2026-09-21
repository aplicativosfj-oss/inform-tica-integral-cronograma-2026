import type { Questao } from "@/components/school/ferramentas/quiz";
import type { AtividadeBanco } from "@/lib/recomposicao/banco-tipos";

/** Questão com a resposta certa na 1ª opção (a tela embaralha antes de mostrar). */
const q = (id: string, enunciado: string, opcoes: string[], explicacao: string): Questao => ({
  id,
  enunciado,
  opcoes,
  respostaCorreta: 0,
  explicacao,
});

/**
 * Português: atividades para as habilidades com menos acertos na
 * II Avaliação Diagnóstica 2026. Todos os textos são autorais, escritos
 * para a faixa etária.
 */
export const BANCO_LP: AtividadeBanco[] = [
  {
    id: "lp-conectivos",
    disc: "LP",
    series: [4, 5],
    titulo: "Palavras que ligam ideias: porque, mas, então",
    emoji: "🔗",
    conteudo: "Coesão e conectivos",
    habilidades: ["Relacoes logico-discursivas (conjuncoes, adverbios)"],
    niveis: {
      retomada: {
        texto: {
          titulo: "Dica",
          paragrafos: [
            "🔗 PORQUE explica o motivo. Ex.: Levei guarda-chuva porque ia chover.",
            "↔️ MAS mostra uma ideia contrária. Ex.: Estudei, mas esqueci a resposta.",
            "➡️ ENTÃO mostra o resultado. Ex.: Choveu muito, então o jogo acabou.",
          ],
        },
        questoes: [
          q("r1", "Complete: Fiquei com fome ___ não almocei.", ["porque", "mas", "então"], "Não almoçar é o MOTIVO da fome: usamos porque."),
          q("r2", "Complete: O dia estava lindo, ___ Pedro não quis sair.", ["mas", "porque", "então"], "Uma ideia contrária à outra: usamos mas."),
          q("r3", "Complete: O ônibus atrasou, ___ cheguei tarde.", ["então", "mas", "porque"], "Chegar tarde é o RESULTADO do atraso: usamos então."),
        ],
      },
      pratica: {
        texto: {
          titulo: "A horta da escola",
          paragrafos: [
            "A turma plantou alface na horta da escola. Todos regavam as mudas, mas uma semana choveu forte e algumas folhas estragaram.",
            "Como a turma não desistiu, replantou tudo. Por isso, no fim do mês, a merenda teve salada fresquinha.",
          ],
        },
        questoes: [
          q("p1", "Na frase “Todos regavam as mudas, MAS uma semana choveu forte”, a palavra MAS indica:", ["uma ideia contrária ao que se esperava", "o motivo de algo", "o tempo em que aconteceu", "um lugar"], "Mas liga duas ideias que se opõem: cuidavam bem, porém algo deu errado."),
          q("p2", "“POR ISSO, no fim do mês, a merenda teve salada.” A expressão POR ISSO indica:", ["uma consequência", "uma dúvida", "uma comparação", "um lugar"], "Por isso apresenta o resultado do que veio antes."),
          q("p3", "“COMO a turma não desistiu, replantou tudo.” Aqui, COMO tem o sentido de:", ["porque", "igual a", "quando", "mas"], "Neste caso, como = porque: explica o motivo."),
          q("p4", "Qual palavra poderia substituir MAS sem mudar o sentido?", ["porém", "porque", "então", "quando"], "Porém, contudo e entretanto têm o mesmo sentido de mas."),
        ],
      },
      desafio: {
        texto: {
          titulo: "O campeonato",
          paragrafos: [
            "Embora o time da escola fosse o menor do campeonato, chegou à final. Os jogadores treinavam todos os dias; além disso, estudavam as jogadas dos adversários.",
            "No dia da final, porém, o goleiro torceu o pé. Mesmo assim, o reserva entrou e defendeu um pênalti. Portanto, a taça ficou com a escola.",
          ],
        },
        questoes: [
          q("d1", "“EMBORA o time fosse o menor, chegou à final.” EMBORA indica:", ["uma ideia contrária, que não impediu o resultado", "o motivo da vitória", "o lugar do jogo", "o tempo do jogo"], "Embora = apesar de: ser pequeno não impediu de chegar à final."),
          q("d2", "“ALÉM DISSO, estudavam as jogadas.” A expressão acrescenta:", ["mais uma informação", "uma oposição", "uma conclusão", "uma dúvida"], "Além disso soma uma ideia à anterior."),
          q("d3", "A palavra PORTANTO, no fim do texto, introduz:", ["a conclusão", "uma causa", "uma comparação", "uma pergunta"], "Portanto apresenta a conclusão: a escola ganhou."),
          q("d4", "Qual expressão tem o MESMO sentido de “mesmo assim”?", ["ainda assim", "por causa disso", "além disso", "por exemplo"], "Mesmo assim = ainda assim: apesar do problema, algo aconteceu."),
        ],
      },
    },
    emSala: [
      "Faça cartões com PORQUE, MAS, ENTÃO, POR ISSO e EMBORA; a turma completa frases do cotidiano escolhendo o cartão.",
      "Peça que reescrevam um parágrafo trocando o conectivo por outro de mesmo sentido.",
      "Leia frases com o conectivo errado (“Choveu, porque o jogo acabou”) e deixe a turma achar o erro.",
    ],
  },
  {
    id: "lp-pontuacao",
    disc: "LP",
    series: [3, 4, 5],
    titulo: "A pontuação muda o sentido",
    emoji: "❗",
    conteudo: "Pontuação e efeitos de sentido",
    habilidades: [
      "Efeitos de sentido da pontuacao e outras notacoes",
      "Uso do ponto final, interrogacao e exclamacao (efeitos de sentido)",
    ],
    niveis: {
      retomada: {
        texto: {
          titulo: "Os sinais",
          paragrafos: [
            "⏺️ Ponto final (.) termina uma frase que informa.",
            "❓ Ponto de interrogação (?) faz uma pergunta.",
            "❗ Ponto de exclamação (!) mostra emoção: alegria, susto, raiva.",
          ],
        },
        questoes: [
          q("r1", "Qual frase é uma PERGUNTA?", ["Você vem amanhã?", "Você vem amanhã.", "Que legal!"], "A pergunta termina com ponto de interrogação (?)."),
          q("r2", "Qual frase mostra SUSTO ou ALEGRIA?", ["Ganhamos o jogo!", "O jogo acabou.", "Quem ganhou o jogo?"], "O ponto de exclamação mostra emoção."),
          q("r3", "“Hoje é sexta-feira.” Essa frase:", ["dá uma informação", "faz uma pergunta", "mostra um grito"], "O ponto final encerra uma frase que informa."),
        ],
      },
      pratica: {
        texto: {
          titulo: "O bilhete",
          paragrafos: [
            "Mãe, a professora avisou: amanhã tem passeio!",
            "Posso ir? Precisa levar lanche, garrafinha e boné.",
            "Estou tão animado!!!",
          ],
        },
        questoes: [
          q("p1", "No bilhete, os DOIS-PONTOS em “a professora avisou:” servem para:", ["anunciar o que a professora disse", "fazer uma pergunta", "terminar o bilhete", "mostrar raiva"], "Os dois-pontos anunciam uma fala, uma explicação ou uma lista."),
          q("p2", "As vírgulas em “lanche, garrafinha e boné” servem para:", ["separar os itens de uma lista", "mostrar dúvida", "indicar uma pergunta", "encerrar a frase"], "A vírgula separa elementos de uma enumeração."),
          q("p3", "Por que a criança usou três pontos de exclamação (!!!)?", ["para mostrar que está muito animada", "para fazer uma pergunta", "porque errou", "para separar palavras"], "Repetir a exclamação reforça a emoção."),
          q("p4", "“Posso ir?” O ponto de interrogação mostra que a criança:", ["está pedindo permissão", "está dando uma ordem", "está brava", "terminou o bilhete"], "É uma pergunta: ela pede autorização à mãe."),
        ],
      },
      desafio: {
        texto: {
          titulo: "Duas frases, dois sentidos",
          paragrafos: [
            "Frase 1: — Vamos comer, crianças!",
            "Frase 2: — Vamos comer crianças!",
            "Frase 3: O quê?! Você pintou o cachorro de azul...",
          ],
        },
        questoes: [
          q("d1", "Na Frase 1, a vírgula mostra que:", ["as crianças estão sendo chamadas para comer", "as crianças serão comidas", "é uma pergunta", "não há diferença"], "A vírgula separa o chamado (crianças). Sem ela, o sentido muda totalmente!"),
          q("d2", "Qual é a diferença entre a Frase 1 e a Frase 2?", ["a falta da vírgula muda o sentido da frase", "a Frase 2 é uma pergunta", "não existe diferença", "a Frase 1 está errada"], "Sem a vírgula, “crianças” vira o que vai ser comido."),
          q("d3", "Em “O quê?!”, os sinais juntos mostram:", ["surpresa e espanto", "calma", "uma ordem", "uma lista"], "Interrogação + exclamação = pergunta cheia de espanto."),
          q("d4", "As reticências (...) no fim da Frase 3 sugerem que:", ["a pessoa ficou sem palavras, pensando", "a frase é uma pergunta", "a frase terminou normalmente", "há uma lista"], "Reticências indicam pausa, hesitação ou algo que ficou no ar."),
        ],
      },
    },
    emSala: [
      "Leia a mesma frase em voz alta com ponto final, interrogação e exclamação; a turma adivinha qual sinal foi usado.",
      "Proponha a “caça ao sentido”: frases famosas com e sem vírgula (“Não, espere!” × “Não espere!”).",
      "Reescrita coletiva de uma tirinha, pontuando as falas dos balões.",
    ],
  },
  {
    id: "lp-causa-consequencia",
    disc: "LP",
    series: [5],
    titulo: "Por que aconteceu? (causa e consequência)",
    emoji: "🎯",
    conteudo: "Compreensão de texto",
    habilidades: ["Relacao de causa e consequencia entre partes do texto"],
    niveis: {
      retomada: {
        texto: {
          titulo: "Lembre",
          paragrafos: ["CAUSA é o motivo: por que aconteceu.", "CONSEQUÊNCIA é o resultado: o que aconteceu depois."],
        },
        questoes: [
          q("r1", "“A planta morreu porque ninguém regou.” Qual é a CAUSA?", ["ninguém regou", "a planta morreu", "a planta era bonita"], "O motivo (causa) foi a falta de água."),
          q("r2", "“Choveu muito e a rua alagou.” Qual é a CONSEQUÊNCIA da chuva?", ["a rua alagou", "choveu muito", "o sol apareceu"], "A rua alagar é o resultado da chuva."),
          q("r3", "“Lia estudou bastante, por isso tirou nota boa.” Por que Lia tirou nota boa?", ["porque estudou bastante", "porque tinha sorte", "porque a prova era fácil"], "Estudar foi a causa da nota boa."),
        ],
      },
      pratica: {
        texto: {
          titulo: "O rio que secou",
          paragrafos: [
            "Durante meses não choveu na região. O rio foi baixando até que os barcos não conseguiram mais navegar.",
            "Sem os barcos, os alimentos demoraram a chegar à cidade, e os preços no mercado subiram.",
          ],
        },
        questoes: [
          q("p1", "Por que os barcos não conseguiram navegar?", ["porque o rio baixou muito", "porque os preços subiram", "porque a cidade cresceu", "porque os barcos quebraram"], "A seca baixou o rio: essa é a causa."),
          q("p2", "Qual foi a consequência de os alimentos demorarem a chegar?", ["os preços subiram", "voltou a chover", "o rio encheu", "os barcos voltaram"], "Com menos comida chegando, o preço aumentou."),
          q("p3", "O que começou toda a sequência de problemas?", ["a falta de chuva", "o preço alto", "o mercado fechado", "os barcos"], "Tudo começou com meses sem chuva."),
          q("p4", "Complete a relação: sem chuva → rio baixo → ___ → preços altos.", ["barcos parados", "rio cheio", "festa na cidade", "mais peixes"], "Cada fato é consequência do anterior."),
        ],
      },
      desafio: {
        texto: {
          titulo: "A campanha do óleo",
          paragrafos: [
            "Na cozinha da escola, o óleo usado era jogado na pia. Com o tempo, o cano entupiu e a água suja voltou pelo ralo.",
            "A turma do 5º ano pesquisou o problema e descobriu que um litro de óleo pode poluir milhares de litros de água. Então, criou uma campanha: o óleo passou a ser guardado em garrafas e levado para fazer sabão.",
            "Desde então, o cano não entupiu mais, e a escola ainda ganhou sabão para a limpeza.",
          ],
        },
        questoes: [
          q("d1", "Qual foi a CAUSA do entupimento do cano?", ["o óleo jogado na pia", "a campanha da turma", "o sabão", "a água limpa"], "O óleo na pia entupiu o cano."),
          q("d2", "O que levou a turma a criar a campanha?", ["a descoberta de que o óleo polui muita água", "a falta de sabão", "o pedido de um vizinho", "a chuva forte"], "A pesquisa mostrou o tamanho do problema: por isso a campanha."),
          q("d3", "Quais foram as CONSEQUÊNCIAS da campanha?", ["o cano parou de entupir e a escola ganhou sabão", "o cano entupiu mais", "a cozinha fechou", "a água ficou mais suja"], "A campanha trouxe dois resultados bons."),
          q("d4", "A palavra ENTÃO, no segundo parágrafo, liga:", ["a descoberta ao que a turma decidiu fazer", "duas ideias contrárias", "dois lugares", "uma pergunta à resposta"], "Então introduz a consequência da descoberta."),
        ],
      },
    },
    emSala: [
      "Monte com a turma uma “corrente de causas” com tiras de papel: cada tira é um fato ligado ao anterior.",
      "Use notícias locais (enchente, seca do rio) e pergunte: por que aconteceu? e o que aconteceu depois?",
      "Peça que o aluno sublinhe a causa de uma cor e a consequência de outra.",
    ],
  },
  {
    id: "lp-texto-imagem",
    disc: "LP",
    series: [3, 4, 5],
    titulo: "Texto com imagem: tirinhas, cartazes e propagandas",
    emoji: "🖼️",
    conteudo: "Leitura multimodal",
    habilidades: [
      "Interpretar texto com material grafico (propagandas, quadrinhos, fotos)",
      "Construir sentido de HQs e tirinhas (baloes, onomatopeias)",
    ],
    niveis: {
      retomada: {
        texto: {
          titulo: "Na tirinha",
          paragrafos: [
            "💬 Balão redondo: a personagem está FALANDO.",
            "💭 Balão de nuvem: a personagem está PENSANDO.",
            "💥 POW! CRASH! TRIM! são onomatopeias: palavras que imitam sons.",
          ],
        },
        questoes: [
          q("r1", "O balão em forma de nuvem 💭 mostra que a personagem está:", ["pensando", "gritando", "dormindo"], "Balão de nuvem = pensamento."),
          q("r2", "“TRIM! TRIM!” imita o som de:", ["um telefone ou despertador tocando", "um cachorro latindo", "a chuva caindo"], "É uma onomatopeia de toque de telefone ou despertador."),
          q("r3", "Um balão com bordas em zigue-zague ⚡ geralmente mostra:", ["um grito", "um cochicho", "um pensamento"], "Bordas tremidas ou pontudas indicam grito ou som forte."),
        ],
      },
      pratica: {
        texto: {
          titulo: "Tirinha (descrita)",
          paragrafos: [
            "Quadro 1: Nina olha para o céu escuro. Balão de pensamento: “Será que vai chover?”",
            "Quadro 2: Ela sai sem guarda-chuva, assobiando.",
            "Quadro 3: CABRUM! Nina aparece encharcada, com a cara emburrada.",
          ],
        },
        questoes: [
          q("p1", "No quadro 1, Nina está:", ["pensando se vai chover", "falando com a mãe", "gritando", "dormindo"], "O balão é de pensamento."),
          q("p2", "“CABRUM!” representa o som de:", ["um trovão", "uma porta", "um carro", "uma risada"], "É a onomatopeia do trovão."),
          q("p3", "Por que Nina aparece emburrada no último quadro?", ["porque se molhou por não levar guarda-chuva", "porque ganhou um presente", "porque estava com sono", "porque o sol saiu"], "A imagem (encharcada) e a sequência explicam a reação."),
          q("p4", "O humor da tirinha vem de:", ["Nina desconfiar da chuva e mesmo assim sair sem guarda-chuva", "Nina gostar de chuva", "o céu estar azul", "Nina estar em casa"], "O leitor percebe antes dela o que vai acontecer."),
        ],
      },
      desafio: {
        texto: {
          titulo: "Cartaz da campanha",
          paragrafos: [
            "Imagem: um mosquito gigante com um X vermelho por cima.",
            "Texto grande: “10 MINUTOS CONTRA O MOSQUITO”.",
            "Texto pequeno: “Uma vez por semana, olhe vasos, pneus e garrafas. Água parada é casa de mosquito. Secretaria de Saúde.”",
          ],
        },
        questoes: [
          q("d1", "Qual é o objetivo principal do cartaz?", ["convencer as pessoas a eliminar água parada", "vender um produto", "contar uma história", "ensinar a desenhar mosquitos"], "É uma campanha: quer mudar o comportamento das pessoas."),
          q("d2", "O X vermelho sobre o mosquito significa:", ["que devemos combater o mosquito", "que o mosquito é bonito", "um erro de impressão", "que o mosquito é pequeno"], "Na linguagem visual, o X indica proibição ou combate."),
          q("d3", "Por que “10 MINUTOS” aparece em letras grandes?", ["para mostrar que a ação é rápida e fácil", "porque é o nome do mosquito", "para indicar o horário", "porque é o menos importante"], "O destaque chama atenção para a ideia principal."),
          q("d4", "Quem é o responsável pela campanha?", ["a Secretaria de Saúde", "uma loja de pneus", "o mosquito", "uma escola"], "A assinatura no rodapé informa o autor."),
        ],
      },
    },
    emSala: [
      "Leve tirinhas de jornal e cubra as falas: a turma cria os balões a partir das imagens.",
      "Faça um mural de onomatopeias com sons da escola (sinal, bola, chuva no telhado).",
      "Analise cartazes reais de campanhas de saúde: imagem, frase de destaque e quem assina.",
    ],
  },
  {
    id: "lp-finalidade",
    disc: "LP",
    series: [2, 3, 4, 5],
    titulo: "Para que serve este texto?",
    emoji: "📮",
    conteudo: "Gêneros textuais",
    habilidades: [
      "Identificar a finalidade de textos de diferentes generos",
      "Reconhecer a finalidade de um texto",
      "Identificar generos (listas, agendas, calendarios, avisos, convites, receitas, legendas)",
      "Ler textos injuntivos instrucionais (receitas, instrucoes)",
    ],
    niveis: {
      retomada: {
        questoes: [
          q("r1", "Uma RECEITA de bolo serve para:", ["ensinar a fazer o bolo", "contar uma história", "dar uma notícia"], "Receita ensina, passo a passo."),
          q("r2", "Um CONVITE de aniversário serve para:", ["chamar as pessoas para a festa", "ensinar uma brincadeira", "vender balões"], "O convite chama e informa data, hora e local."),
          q("r3", "Uma LISTA DE COMPRAS serve para:", ["lembrar o que comprar", "contar uma piada", "ensinar a cozinhar"], "A lista ajuda a lembrar os itens."),
        ],
      },
      pratica: {
        texto: {
          titulo: "Três textos curtos",
          paragrafos: [
            "Texto A: “Atenção, pais! Reunião na sexta-feira, às 17h, na sala do 4º ano.”",
            "Texto B: “Era uma vez um jabuti que queria voar...”",
            "Texto C: “Misture a farinha e os ovos. Leve ao forno por 30 minutos.”",
          ],
        },
        questoes: [
          q("p1", "O Texto A serve para:", ["avisar sobre uma reunião", "ensinar uma receita", "contar uma história", "vender um produto"], "É um aviso: informa data, hora e local."),
          q("p2", "O Texto B é o começo de:", ["uma história (conto ou fábula)", "uma receita", "um aviso", "uma notícia"], "“Era uma vez” é típico de histórias."),
          q("p3", "O Texto C tem a finalidade de:", ["ensinar como fazer algo", "divertir com uma piada", "convidar para uma festa", "dar uma opinião"], "Verbos como misture e leve dão instruções."),
          q("p4", "Qual texto usa verbos que dão ORDENS (misture, leve)?", ["Texto C", "Texto A", "Texto B", "nenhum"], "Textos de instrução usam verbos no imperativo."),
        ],
      },
      desafio: {
        texto: {
          titulo: "Três textos sobre o mesmo tema",
          paragrafos: [
            "Texto 1: “Açaí fresquinho! Leve 2 litros e ganhe tapioca. Só hoje!”",
            "Texto 2: “A produção de açaí no Acre cresceu 20% este ano, segundo a Secretaria de Agricultura.”",
            "Texto 3: “Na minha opinião, o açaí é a fruta mais saborosa da Amazônia.”",
          ],
        },
        questoes: [
          q("d1", "Qual texto tem a finalidade de VENDER?", ["Texto 1", "Texto 2", "Texto 3", "todos"], "Anúncios usam promoção e urgência (“Só hoje!”)."),
          q("d2", "O Texto 2 é uma notícia porque:", ["informa um fato com dados e fonte", "dá uma opinião pessoal", "tenta vender açaí", "conta uma história inventada"], "Notícia informa fatos e cita de onde veio a informação."),
          q("d3", "O Texto 3 expressa:", ["uma opinião", "um fato comprovado", "uma instrução", "um aviso"], "“Na minha opinião” mostra um ponto de vista pessoal."),
          q("d4", "Por que o Texto 1 usa “Só hoje!”?", ["para convencer o cliente a comprar logo", "para informar a data de colheita", "para dar uma instrução", "para contar uma história"], "A urgência é uma estratégia de convencimento."),
        ],
      },
    },
    emSala: [
      "Monte uma “banca de textos” com bula, receita, convite, notícia e anúncio: a turma classifica pela finalidade.",
      "Pergunte sempre: quem escreveu, para quem e para quê?",
      "Transforme o mesmo assunto em dois gêneros (um aviso e uma história).",
    ],
  },
  {
    id: "lp-inferencia",
    disc: "LP",
    series: [2, 3, 4, 5],
    titulo: "Ler nas entrelinhas (o que o texto não diz)",
    emoji: "🕵️",
    conteudo: "Inferência",
    habilidades: [
      "Inferir informacao implicita em um texto",
      "Inferir o assunto de um texto",
      "Inferir o sentido de palavras ou expressoes",
      "Inferir o sentido de uma palavra ou expressao",
    ],
    niveis: {
      retomada: {
        questoes: [
          q("r1", "João chegou pingando água e com o guarda-chuva virado. O que aconteceu lá fora?", ["estava chovendo e ventando", "estava fazendo sol", "estava nevando"], "Pistas: pingando água e guarda-chuva virado."),
          q("r2", "Bia bocejou, esfregou os olhos e deitou no sofá. Como Bia estava?", ["com sono", "com fome", "com raiva"], "Bocejar e esfregar os olhos são sinais de sono."),
          q("r3", "O cachorro abanava o rabo e pulava na porta quando o dono chegou. O cachorro estava:", ["feliz", "triste", "doente"], "Abanar o rabo e pular mostram alegria."),
        ],
      },
      pratica: {
        texto: {
          titulo: "A mesa da cozinha",
          paragrafos: [
            "Quando Caio entrou em casa, sentiu cheiro de bolo. Na mesa havia pratos, copos, balões coloridos e um bolo com oito velinhas.",
            "A mãe fez “psiu!” e apagou a luz. Todos se esconderam atrás do sofá.",
          ],
        },
        questoes: [
          q("p1", "O que estava sendo preparado?", ["uma festa-surpresa de aniversário", "o almoço de domingo", "uma mudança de casa", "uma aula"], "Bolo com velas, balões e todos escondidos: é uma surpresa."),
          q("p2", "Quantos anos o aniversariante provavelmente vai fazer?", ["8 anos", "10 anos", "5 anos", "não dá para saber"], "O bolo tem oito velinhas."),
          q("p3", "Por que a mãe fez “psiu!”?", ["para ninguém fazer barulho e estragar a surpresa", "porque estava com dor", "para chamar o gato", "porque queria dormir"], "O silêncio faz parte da surpresa."),
          q("p4", "Qual é o assunto do texto?", ["a preparação de uma festa-surpresa", "uma receita de bolo", "um dia de chuva", "a limpeza da casa"], "Juntando as pistas, o tema é a festa-surpresa."),
        ],
      },
      desafio: {
        texto: {
          titulo: "O bilhete na geladeira",
          paragrafos: [
            "“Filho, deixei o almoço no forno. Não esqueça de dar comida ao Totó e de fechar o portão, porque ontem ele fugiu de novo. Volto às 18h. Beijos.”",
          ],
        },
        questoes: [
          q("d1", "Quem é Totó, provavelmente?", ["o cachorro da família", "o irmão do menino", "o vizinho", "o professor"], "Ele recebe comida e foge pelo portão: é um animal de estimação."),
          q("d2", "Por que a mãe pede para fechar o portão?", ["para o Totó não fugir outra vez", "porque vai chover", "para o almoço não esfriar", "porque o portão está quebrado"], "“Ontem ele fugiu de novo” explica o pedido."),
          q("d3", "O que a expressão “de novo” revela?", ["que o Totó já tinha fugido outras vezes", "que é a primeira fuga", "que o Totó voltou", "que o portão é novo"], "“De novo” indica repetição."),
          q("d4", "Onde a mãe estava quando o filho leu o bilhete?", ["fora de casa, provavelmente trabalhando", "na cozinha", "dormindo no quarto", "no quintal com o Totó"], "Ela deixou bilhete e disse que volta às 18h."),
        ],
      },
    },
    emSala: [
      "Jogo do detetive: leia pistas curtas e a turma descobre o que aconteceu, explicando qual pista usou.",
      "Sempre pergunte “como você sabe?”: a resposta precisa apontar uma pista do texto.",
      "Use imagens sem legenda e peça hipóteses sobre o que está acontecendo.",
    ],
  },
  {
    id: "lp-referencia",
    disc: "LP",
    series: [3, 4, 5],
    titulo: "Quem é “ele”? (palavras que substituem)",
    emoji: "🔄",
    conteudo: "Coesão e referência",
    habilidades: [
      "Relacoes entre partes do texto (substituicoes lexicais/pronominais)",
      "Relacoes entre partes do texto (repeticoes/substituicoes)",
    ],
    niveis: {
      retomada: {
        questoes: [
          q("r1", "“Ana ganhou uma boneca. ELA adorou o presente.” Quem é ELA?", ["Ana", "a boneca", "o presente"], "Ela substitui Ana, para não repetir o nome."),
          q("r2", "“O gato subiu na árvore. O BICHANO não queria descer.” O bichano é:", ["o gato", "a árvore", "o dono"], "Bichano é outra forma de chamar o gato."),
          q("r3", "“Pedro e Lia foram à praça. ELES brincaram muito.” ELES são:", ["Pedro e Lia", "a praça", "os brinquedos"], "Eles retoma as duas pessoas citadas."),
        ],
      },
      pratica: {
        texto: {
          titulo: "A onça-pintada",
          paragrafos: [
            "A onça-pintada é o maior felino das Américas. Esse animal vive em florestas e perto de rios.",
            "Ela é ótima nadadora e caça peixes, jacarés e capivaras. Infelizmente, a espécie está ameaçada, porque suas matas estão sendo destruídas.",
          ],
        },
        questoes: [
          q("p1", "“ESSE ANIMAL vive em florestas.” Esse animal é:", ["a onça-pintada", "o jacaré", "a capivara", "o peixe"], "A expressão retoma a onça-pintada."),
          q("p2", "Em “ELA é ótima nadadora”, ELA se refere a:", ["a onça-pintada", "a floresta", "a espécie de peixe", "a capivara"], "Ela substitui o nome do animal."),
          q("p3", "“SUAS matas estão sendo destruídas.” As matas são de quem?", ["da onça-pintada", "dos jacarés", "das pessoas", "dos rios"], "Suas = da onça, a espécie citada antes."),
          q("p4", "Por que o autor usa “esse animal” e “ela” em vez de repetir “onça-pintada”?", ["para não repetir a mesma palavra", "para confundir o leitor", "porque são animais diferentes", "por engano"], "Substituir evita repetições e liga as partes do texto."),
        ],
      },
      desafio: {
        texto: {
          titulo: "O presente",
          paragrafos: [
            "Marcos e o avô foram ao mercado comprar um presente para a avó. O idoso escolheu flores; o neto preferiu um bolo.",
            "No fim, levaram os dois. Quando ela abriu a porta, sorriu: “Vocês me conhecem bem!”",
          ],
        },
        questoes: [
          q("d1", "“O IDOSO escolheu flores.” O idoso é:", ["o avô", "Marcos", "o vendedor", "a avó"], "Idoso retoma o avô."),
          q("d2", "“O NETO preferiu um bolo.” O neto é:", ["Marcos", "o avô", "a avó", "o vendedor"], "Marcos é o neto do avô."),
          q("d3", "“Levaram OS DOIS.” Os dois são:", ["as flores e o bolo", "Marcos e o avô", "o avô e a avó", "o mercado e a casa"], "Os dois retoma os presentes escolhidos."),
          q("d4", "Em “Quando ELA abriu a porta”, ELA é:", ["a avó", "a mãe", "a vendedora", "a flor"], "A avó é quem recebe o presente."),
        ],
      },
    },
    emSala: [
      "Leia um texto em que o nome se repete o tempo todo e reescreva com a turma usando ele, ela, esse animal.",
      "Peça que liguem com setas cada pronome à palavra que ele substitui.",
      "Brincadeira “quem é quem?”: frases com vários personagens e perguntas sobre os pronomes.",
    ],
  },
  {
    id: "lp-narrativa",
    disc: "LP",
    series: [3, 4, 5],
    titulo: "Entendendo a história: personagens, conflito e final",
    emoji: "📖",
    conteudo: "Narrativa",
    habilidades: [
      "Ler e compreender narrativas",
      "Conflito gerador do enredo e elementos da narrativa",
      "Conflito gerador e elementos da narrativa",
    ],
    niveis: {
      retomada: {
        texto: {
          titulo: "O passarinho",
          paragrafos: [
            "Um passarinho caiu do ninho. Tomás viu e ficou preocupado.",
            "Ele subiu na escada com cuidado e colocou o filhote de volta. A mãe passarinho cantou feliz.",
          ],
        },
        questoes: [
          q("r1", "Quem ajudou o passarinho?", ["Tomás", "a mãe passarinho", "um gato"], "Tomás subiu na escada e devolveu o filhote."),
          q("r2", "Qual foi o PROBLEMA da história?", ["o passarinho caiu do ninho", "Tomás caiu da escada", "a mãe passarinho sumiu"], "O problema (conflito) é o filhote fora do ninho."),
          q("r3", "Como a história termina?", ["a mãe passarinho canta feliz", "o passarinho vai embora", "Tomás chora"], "O final resolve o problema."),
        ],
      },
      pratica: {
        texto: {
          titulo: "A bola perdida",
          paragrafos: [
            "Na hora do recreio, a bola nova da turma caiu no quintal da dona Zefa, que tinha fama de brava.",
            "Ninguém queria buscá-la. Até que Yara, a mais tímida, tomou coragem e bateu no portão.",
            "Dona Zefa abriu, sorriu e devolveu a bola junto com um pacote de biscoitos. Desde aquele dia, a turma passou a visitá-la.",
          ],
        },
        questoes: [
          q("p1", "Qual é o conflito (problema) da história?", ["a bola caiu no quintal de uma vizinha que parecia brava", "a bola furou", "Yara ficou doente", "o recreio acabou"], "O problema é recuperar a bola sem coragem de pedir."),
          q("p2", "Onde a história acontece?", ["na escola e na casa vizinha", "numa praia", "numa floresta", "num hospital"], "O espaço: recreio da escola e quintal ao lado."),
          q("p3", "Qual é o momento de maior tensão?", ["quando Yara bate no portão", "quando a bola é nova", "quando comem biscoitos", "quando o recreio começa"], "É o clímax: o que dona Zefa vai fazer?"),
          q("p4", "O que a história mostra sobre dona Zefa?", ["que a fama de brava não era verdade", "que ela era mesmo muito brava", "que ela não gostava de crianças", "que ela era a professora"], "O desfecho quebra a expectativa."),
        ],
      },
      desafio: {
        texto: {
          titulo: "O mapa do avô",
          paragrafos: [
            "Depois que o avô morreu, Lucas encontrou no sótão um mapa desenhado à mão, com um X perto do igarapé.",
            "Ele e a prima Sofia seguiram as pistas durante toda a manhã. Quando finalmente cavaram no lugar marcado, acharam só uma lata enferrujada.",
            "Dentro havia fotos antigas da família e um bilhete: “O maior tesouro são as pessoas que a gente ama.” Os dois voltaram para casa em silêncio, abraçados.",
          ],
        },
        questoes: [
          q("d1", "O que dá início à aventura (situação inicial que gera o conflito)?", ["Lucas encontra o mapa do avô", "Sofia perde a bicicleta", "o igarapé transborda", "a lata enferruja"], "O mapa desperta a busca."),
          q("d2", "Por que o final surpreende o leitor?", ["o “tesouro” não era ouro, mas lembranças da família", "eles não acham nada", "o mapa era falso", "o avô aparece"], "A expectativa era riqueza; o tesouro era afetivo."),
          q("d3", "“Voltaram em silêncio, abraçados” mostra que eles estavam:", ["emocionados", "com raiva um do outro", "cansados de brincar", "com medo do escuro"], "O silêncio e o abraço revelam emoção."),
          q("d4", "Qual é a mensagem principal da história?", ["as pessoas que amamos valem mais que riquezas", "é perigoso cavar buracos", "mapas sempre mentem", "não se deve entrar no sótão"], "A frase do bilhete resume a mensagem."),
        ],
      },
    },
    emSala: [
      "Use a “mão da história”: cada dedo é um elemento (quem, onde, quando, problema, solução).",
      "Leia até o conflito e pare: a turma escreve ou desenha o final antes de ouvir o original.",
      "Compare finais: o esperado × o que o autor escolheu.",
    ],
  },
  {
    id: "lp-ideia-central",
    disc: "LP",
    series: [3, 4, 5],
    titulo: "Qual é a ideia principal?",
    emoji: "💡",
    conteudo: "Compreensão de texto",
    habilidades: [
      "Identificar a ideia central de um texto",
      "Localizar informacao explicita em um texto",
      "Localizar informacoes explicitas em um texto",
    ],
    niveis: {
      retomada: {
        questoes: [
          q("r1", "“O cão late, o gato mia e a vaca muge.” O texto fala sobre:", ["sons dos animais", "comida dos animais", "cores dos animais"], "Todas as frases falam de sons."),
          q("r2", "“Escove os dentes, tome banho e lave as mãos.” O assunto é:", ["higiene", "esporte", "viagem"], "São cuidados de higiene."),
          q("r3", "“A maçã, a banana e a manga são gostosas e fazem bem.” A ideia principal é:", ["frutas são gostosas e saudáveis", "a maçã é vermelha", "a manga é amarela"], "A ideia que junta tudo é: frutas fazem bem."),
        ],
      },
      pratica: {
        texto: {
          titulo: "As abelhas",
          paragrafos: [
            "As abelhas são muito importantes para a natureza. Ao voar de flor em flor, elas levam o pólen e ajudam as plantas a produzir frutos.",
            "Sem elas, alimentos como maçã, café e castanha ficariam raros. Por isso, é preciso proteger as abelhas e evitar venenos nas plantações.",
          ],
        },
        questoes: [
          q("p1", "Qual é a ideia principal do texto?", ["as abelhas são importantes e precisam ser protegidas", "as abelhas picam as pessoas", "o café é gostoso", "as flores são coloridas"], "Todo o texto defende a importância das abelhas."),
          q("p2", "Segundo o texto, o que as abelhas levam de flor em flor?", ["o pólen", "a água", "o veneno", "as sementes de café"], "Informação explícita: elas levam o pólen."),
          q("p3", "Qual alimento o texto cita que ficaria raro sem abelhas?", ["castanha", "arroz", "feijão", "peixe"], "O texto cita maçã, café e castanha."),
          q("p4", "Qual seria um bom título para o texto?", ["Abelhas: pequenas e essenciais", "Como fazer mel", "O perigo das abelhas", "Flores do jardim"], "O título deve resumir a ideia principal."),
        ],
      },
      desafio: {
        texto: {
          titulo: "Menos telas, mais movimento",
          paragrafos: [
            "Pesquisas mostram que muitas crianças passam mais de quatro horas por dia diante de celulares e televisores.",
            "Especialistas alertam que esse tempo pode atrapalhar o sono, a visão e a concentração nos estudos. Eles recomendam brincar ao ar livre, praticar esportes e ler livros.",
            "Pequenas mudanças, como desligar o celular uma hora antes de dormir, já fazem diferença.",
          ],
        },
        questoes: [
          q("d1", "Qual é a ideia central?", ["o excesso de telas prejudica as crianças, e é possível mudar esse hábito", "os celulares são caros", "as crianças devem assistir mais TV", "esportes são perigosos"], "O texto aponta o problema e sugere soluções."),
          q("d2", "Quais problemas o excesso de tela pode causar?", ["no sono, na visão e na concentração", "na altura e no peso", "na fala e na audição", "nenhum problema"], "Informação explícita no 2º parágrafo."),
          q("d3", "Qual parágrafo traz uma sugestão simples para mudar o hábito?", ["o terceiro", "o primeiro", "o segundo", "nenhum"], "Desligar o celular antes de dormir está no último parágrafo."),
          q("d4", "Qual frase NÃO resume bem o texto?", ["crianças devem usar telas o dia todo", "o tempo de tela precisa ser equilibrado", "brincar e ler são boas alternativas", "o excesso de telas faz mal"], "A frase contraria o que o texto defende."),
        ],
      },
    },
    emSala: [
      "Depois de ler, peça que a turma resuma o texto em uma frase de até 10 palavras.",
      "Escolha entre três títulos qual resume melhor o texto, e justifique.",
      "Sublinhe as informações explícitas de uma cor e a ideia central de outra.",
    ],
  },
  {
    id: "lp-rimas-sons",
    disc: "LP",
    series: [1, 2],
    titulo: "Rimas e sons das palavras",
    emoji: "🎵",
    conteudo: "Consciência fonológica",
    habilidades: [
      "Identificar rimas",
      "Comparar palavras (sons de silabas iniciais, mediais e finais)",
      "Ler palavras",
    ],
    niveis: {
      retomada: {
        questoes: [
          q("r1", "Qual palavra RIMA com GATO? 🐱", ["PATO 🦆", "BOLA ⚽", "CASA 🏠"], "GATO e PATO terminam com o mesmo som: -ATO."),
          q("r2", "Qual palavra começa com o mesmo som de BOLA? ⚽", ["BOLO 🎂", "MALA 🧳", "FACA 🔪"], "BOLA e BOLO começam com BO."),
          q("r3", "Qual palavra RIMA com MÃO? ✋", ["PÃO 🍞", "PÉ 🦶", "SOL ☀️"], "MÃO e PÃO terminam com -ÃO."),
        ],
      },
      pratica: {
        questoes: [
          q("p1", "Qual palavra rima com JANELA?", ["PANELA", "JARRA", "CADEIRA", "MESA"], "JANELA e PANELA terminam em -ELA."),
          q("p2", "Qual palavra começa com a mesma sílaba de MACACO?", ["MALA", "SAPO", "COPO", "PATO"], "MA-CACO e MA-LA."),
          q("p3", "Qual palavra termina com a mesma sílaba de CAVALO?", ["GALO", "CAVA", "LOBO", "BOLA"], "CAVA-LO e GA-LO terminam com LO."),
          q("p4", "Em qual par as palavras RIMAM?", ["CORAÇÃO e LIMÃO", "CASA e BOLA", "SAPO e SOL", "LUA e LEITE"], "Coração e limão terminam em -ÃO."),
        ],
      },
      desafio: {
        texto: {
          titulo: "Versinho",
          paragrafos: ["A formiga tão pequena", "carregava uma folha inteira.", "Trabalhava sem ter pena,", "subindo a bananeira."],
        },
        questoes: [
          q("d1", "Quais palavras rimam no versinho?", ["PEQUENA e PENA", "FORMIGA e FOLHA", "MANHÃ e NOITE", "TÃO e UMA"], "PEQUENA e PENA terminam em -ENA."),
          q("d2", "Qual palavra do versinho rima com INTEIRA?", ["BANANEIRA", "FORMIGA", "PEQUENA", "TRABALHAVA"], "INTEIRA e BANANEIRA terminam em -EIRA."),
          q("d3", "Quantas sílabas tem a palavra FORMIGA?", ["3 (FOR-MI-GA)", "2", "4", "5"], "FOR-MI-GA: três sílabas."),
          q("d4", "Qual palavra tem a mesma sílaba do MEIO de FORMIGA?", ["CAMISA (CA-MI-SA)", "FOGO", "GALINHA", "MOLA"], "A sílaba do meio é MI: ca-MI-sa."),
        ],
      },
    },
    emSala: [
      "Roda de rimas com o nome dos alunos (“Ana banana”, “João feijão”).",
      "Bingo de sílabas iniciais com figuras.",
      "Palmas para contar as sílabas de palavras do cotidiano.",
    ],
  },
  {
    id: "lp-letras-frases",
    disc: "LP",
    series: [1, 2],
    titulo: "Letras, palavras e frases",
    emoji: "🔤",
    conteudo: "Alfabetização",
    habilidades: [
      "Distinguir letras do alfabeto de outros sinais graficos",
      "Reconhecer a segmentacao de palavras na escrita",
      "Ler frases",
      "Localizar informacao explicita em um texto",
    ],
    niveis: {
      retomada: {
        questoes: [
          q("r1", "Qual destes é uma LETRA?", ["B", "7", "★"], "B é uma letra do alfabeto; 7 é número e ★ é um desenho."),
          q("r2", "Qual destes é um NÚMERO?", ["5", "M", "A"], "5 é um número; M e A são letras."),
          q("r3", "Quantas palavras há em: O GATO DORME", ["3", "1", "5"], "O / GATO / DORME: três palavras, separadas por espaços."),
        ],
      },
      pratica: {
        questoes: [
          q("p1", "Qual frase está escrita com os espaços certos?", ["A BOLA É AZUL.", "ABOLA ÉAZUL.", "A BO LA É A ZUL.", "ABOLAÉAZUL."], "Cada palavra fica separada por um espaço."),
          q("p2", "Leia: “O sapo pulou no lago.” Onde o sapo pulou?", ["no lago", "na árvore", "na cama", "no carro"], "A frase diz: no lago."),
          q("p3", "Leia: “Bia comeu uma maçã vermelha.” De que cor era a maçã?", ["vermelha", "verde", "amarela", "azul"], "A cor está escrita na frase."),
          q("p4", "Qual grupo tem SÓ letras?", ["L E O", "L 3 O", "★ E O", "1 2 3"], "3, ★ e 1 2 3 não são letras."),
        ],
      },
      desafio: {
        texto: {
          titulo: "Bilhete",
          paragrafos: ["Oi, Lia! Amanhã é o piquenique na praça, às 9 horas. Leve uma fruta e um suco. Beijos, Davi."],
        },
        questoes: [
          q("d1", "Quem escreveu o bilhete?", ["Davi", "Lia", "a professora", "a mãe"], "Quem escreve assina no final."),
          q("d2", "Onde será o piquenique?", ["na praça", "na escola", "na praia", "na casa de Lia"], "Está escrito: na praça."),
          q("d3", "O que Lia deve levar?", ["uma fruta e um suco", "um bolo", "uma bola", "nada"], "O bilhete pede fruta e suco."),
          q("d4", "Quantas palavras há em “Leve uma fruta”?", ["3", "2", "4", "12"], "Leve / uma / fruta."),
        ],
      },
    },
    emSala: [
      "Separe cartões com letras, números e símbolos; a turma classifica em três caixas.",
      "Escreva frases sem espaços no quadro e peça que as crianças marquem onde cada palavra termina.",
      "Leitura de bilhetes e listas da rotina da turma.",
    ],
  },
  {
    id: "lp-locutor",
    disc: "LP",
    series: [4],
    titulo: "Quem fala com quem? (locutor e interlocutor)",
    emoji: "🗣️",
    conteudo: "Variação e interlocução",
    habilidades: ["Marcas linguisticas do locutor e do interlocutor"],
    niveis: {
      retomada: {
        questoes: [
          q("r1", "Num bilhete que termina com “Beijos, vovó”, quem escreveu?", ["a vovó", "o neto", "o carteiro"], "Quem assina é quem escreveu (o locutor)."),
          q("r2", "“Querida professora, obrigado pelas aulas!” Para quem é a mensagem?", ["para a professora", "para a mãe", "para um amigo"], "O interlocutor é a professora."),
          q("r3", "“E aí, parceiro, bora jogar bola?” Esse jeito de falar é:", ["informal, entre amigos", "formal, de um documento", "de uma notícia"], "Gírias como “bora” mostram conversa entre amigos."),
        ],
      },
      pratica: {
        texto: {
          titulo: "Duas mensagens",
          paragrafos: [
            "Mensagem 1: “Senhor diretor, solicitamos a reforma do bebedouro do 2º andar. Atenciosamente, alunos do 4º A.”",
            "Mensagem 2: “Mano, o bebedouro tá quebrado de novo, que saco!”",
          ],
        },
        questoes: [
          q("p1", "Quem escreveu a Mensagem 1?", ["alunos do 4º A", "o diretor", "a merendeira", "um irmão"], "A assinatura mostra quem escreve."),
          q("p2", "Para quem foi escrita a Mensagem 1?", ["para o diretor", "para um amigo", "para a família", "para o bebedouro"], "“Senhor diretor” indica o interlocutor."),
          q("p3", "Qual mensagem usa linguagem formal?", ["a Mensagem 1", "a Mensagem 2", "as duas", "nenhuma"], "Palavras como “solicitamos” e “atenciosamente” são formais."),
          q("p4", "“Mano” e “tá” mostram que a Mensagem 2 é:", ["uma conversa informal entre conhecidos", "um documento oficial", "uma notícia", "uma receita"], "São marcas de linguagem informal."),
        ],
      },
      desafio: {
        questoes: [
          q("d1", "Qual forma é a mais adequada para escrever ao prefeito?", ["Excelentíssimo senhor prefeito,", "Fala aí, prefeito!", "E aí, mano prefeito,", "Oi, sumido!"], "Para autoridades, usamos linguagem formal."),
          q("d2", "“Uai, sô, cê num vai?” Essas marcas mostram:", ["o jeito de falar de uma região", "um erro de digitação", "uma língua estrangeira", "um texto científico"], "Variação regional do português."),
          q("d3", "Num anúncio, “Você merece este tênis!”, o “você” se refere a:", ["o leitor, o possível comprador", "o vendedor", "o tênis", "o dono da loja"], "O anúncio conversa diretamente com o leitor."),
          q("d4", "Por que um mesmo aluno fala de um jeito com os amigos e de outro na entrevista da escola?", ["porque adequamos a linguagem à situação e ao interlocutor", "porque esqueceu as palavras", "porque é proibido gírias", "não existe diferença"], "Adequação linguística."),
        ],
      },
    },
    emSala: [
      "Reescreva uma mensagem informal de WhatsApp como carta formal ao diretor.",
      "Encene diálogos entre personagens diferentes (avó, amigo, diretor) e perceba as mudanças no jeito de falar.",
      "Pesquise expressões regionais do Acre com as famílias.",
    ],
  },
];
