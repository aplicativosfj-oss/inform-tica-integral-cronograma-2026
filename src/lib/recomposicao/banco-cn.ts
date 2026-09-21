import type { Questao } from "@/components/school/ferramentas/quiz";
import type { AtividadeBanco } from "@/lib/recomposicao/banco-tipos";

const q = (id: string, enunciado: string, opcoes: string[], explicacao: string): Questao => ({
  id,
  enunciado,
  opcoes,
  respostaCorreta: 0,
  explicacao,
});

/**
 * Ciências: atividades para as habilidades com menos acertos na
 * II Avaliação Diagnóstica 2026 (sobretudo 4º e 5º anos).
 */
export const BANCO_CN: AtividadeBanco[] = [
  {
    id: "cn-microbios-transmissao",
    disc: "CN",
    series: [4],
    titulo: "Micróbios: como passam de uma pessoa para outra",
    emoji: "🦠",
    conteudo: "Saúde e microrganismos",
    habilidades: ["Formas de transmissao de microrganismos"],
    niveis: {
      retomada: {
        texto: {
          titulo: "Você sabia?",
          paragrafos: [
            "🦠 Micróbios são seres tão pequenos que só vemos no microscópio.",
            "Alguns causam doenças e passam de uma pessoa para outra pelo espirro, pelas mãos sujas, pela água suja e por picadas de mosquitos.",
          ],
        },
        questoes: [
          q("r1", "Qual hábito ajuda a não pegar micróbios?", ["lavar as mãos com água e sabão", "roer as unhas", "beber água do rio sem ferver"], "Lavar as mãos remove muitos micróbios."),
          q("r2", "Ao espirrar, o certo é cobrir o nariz e a boca com:", ["o braço ou um lenço", "a mão aberta, e depois pegar no colega", "nada"], "O braço segura as gotinhas e não espalha pelas mãos."),
          q("r3", "A água que pode ter micróbios deve ser:", ["fervida ou filtrada antes de beber", "bebida direto da torneira do quintal", "misturada com açúcar"], "Ferver e filtrar deixam a água segura."),
        ],
      },
      pratica: {
        texto: {
          titulo: "Três jeitos de pegar doença",
          paragrafos: [
            "Pelo AR: a gripe passa pelas gotículas do espirro e da tosse.",
            "Pela ÁGUA e ALIMENTOS contaminados: vermes e diarreias.",
            "Por PICADAS de mosquito: dengue e malária, comuns no Acre.",
          ],
        },
        questoes: [
          q("p1", "A dengue é transmitida principalmente:", ["pela picada do mosquito", "pelo aperto de mão", "pelo ar", "por comer fruta"], "O mosquito Aedes aegypti transmite a dengue."),
          q("p2", "A gripe passa de uma pessoa para outra:", ["pelas gotículas de tosse e espirro", "pela picada de mosquito", "pelo sol forte", "pelo sono"], "Gotículas no ar levam o vírus da gripe."),
          q("p3", "Comer verdura mal lavada pode causar:", ["verminoses e diarreia", "dengue", "gripe", "catapora"], "Alimentos contaminados levam vermes e bactérias."),
          q("p4", "Qual atitude evita a malária e a dengue?", ["usar mosquiteiro e eliminar água parada", "tomar banho frio", "comer doces", "dormir tarde"], "Mosquiteiro e sem água parada = menos mosquito."),
        ],
      },
      desafio: {
        texto: {
          titulo: "O surto na escola",
          paragrafos: [
            "Em uma semana, oito alunos da mesma turma faltaram com diarreia. A equipe de saúde descobriu que o filtro do bebedouro estava sem troca havia meses.",
            "O filtro foi trocado, a caixa-d'água foi limpa e a turma aprendeu a lavar as mãos antes do lanche. Na semana seguinte, ninguém mais adoeceu.",
          ],
        },
        questoes: [
          q("d1", "Qual foi a provável forma de transmissão?", ["água contaminada do bebedouro", "picada de mosquito", "espirro de um colega", "o sol forte"], "O filtro velho deixou passar micróbios na água."),
          q("d2", "Por que limpar a caixa-d'água também foi importante?", ["porque a água suja pode ter micróbios que causam doenças", "para a água ficar gelada", "para economizar água", "para o filtro durar menos"], "Caixa-d'água suja contamina toda a água."),
          q("d3", "Lavar as mãos antes do lanche evita:", ["levar micróbios das mãos para a boca", "a dengue", "a picada de mosquito", "cáries apenas"], "As mãos carregam micróbios para os alimentos."),
          q("d4", "O que prova que as medidas funcionaram?", ["ninguém mais adoeceu na semana seguinte", "os alunos ficaram com sono", "o bebedouro quebrou", "choveu"], "O resultado confirma a causa identificada."),
        ],
      },
    },
    emSala: [
      "Experimento do glitter: passe glitter nas mãos de um aluno e veja como ele se espalha pela sala ao cumprimentar os colegas.",
      "Faça com a turma um mapa dos criadouros de mosquito na escola e um mutirão de limpeza.",
      "Cartaz: “3 caminhos dos micróbios: ar, água e alimentos, picadas”.",
    ],
  },
  {
    id: "cn-microbios-uteis",
    disc: "CN",
    series: [4],
    titulo: "Micróbios do bem: pão, iogurte e decomposição",
    emoji: "🍞",
    conteudo: "Microrganismos",
    habilidades: [
      "Microrganismos na producao de alimentos, combustiveis e medicamentos",
      "Fungos e bacterias na decomposicao",
    ],
    niveis: {
      retomada: {
        questoes: [
          q("r1", "O fermento que faz o pão crescer é formado por:", ["fungos bem pequenos (leveduras)", "areia", "sal"], "As leveduras soltam gás e o pão cresce."),
          q("r2", "O iogurte é feito com a ajuda de:", ["bactérias boas", "mosquitos", "pedras"], "Bactérias transformam o leite em iogurte."),
          q("r3", "A fruta esquecida na fruteira apodrece por causa de:", ["fungos e bactérias", "vento", "luz da lua"], "Eles decompõem a fruta."),
        ],
      },
      pratica: {
        texto: {
          titulo: "Os decompositores",
          paragrafos: [
            "Fungos e bactérias transformam restos de plantas e animais em adubo. Sem eles, folhas e restos de comida se acumulariam por toda parte.",
            "Alguns micróbios também ajudam a fazer remédios, como os antibióticos, e combustíveis, como o álcool da cana.",
          ],
        },
        questoes: [
          q("p1", "Qual é o papel dos decompositores na natureza?", ["transformar restos em adubo para o solo", "causar sempre doenças", "produzir luz", "fazer chover"], "Eles devolvem nutrientes ao solo."),
          q("p2", "Qual remédio é produzido com a ajuda de micróbios?", ["antibiótico", "curativo", "algodão", "gelo"], "Muitos antibióticos vêm de fungos."),
          q("p3", "O álcool usado como combustível pode ser feito da cana com a ajuda de:", ["leveduras (fungos)", "mosquitos", "minhocas", "peixes"], "Leveduras fermentam o açúcar da cana."),
          q("p4", "Na composteira da escola, restos de comida viram:", ["adubo", "plástico", "vidro", "metal"], "É a decomposição em ação."),
        ],
      },
      desafio: {
        texto: {
          titulo: "Experimento dos pães",
          paragrafos: [
            "A turma deixou três pedaços de pão por 5 dias: um seco na geladeira, um seco no armário e um úmido no armário.",
            "Resultado: o pão úmido do armário ficou cheio de bolor; o do armário seco teve um pouco; o da geladeira quase nada.",
          ],
        },
        questoes: [
          q("d1", "Em qual condição os fungos cresceram mais?", ["calor e umidade", "frio e seco", "frio e úmido", "nenhuma"], "O pão úmido no armário teve mais bolor."),
          q("d2", "Por que o pão da geladeira quase não mofou?", ["o frio dificulta o crescimento dos fungos", "a geladeira tem luz", "o pão estava salgado", "fungos gostam de frio"], "Temperatura baixa deixa os micróbios lentos."),
          q("d3", "Qual conclusão a turma pode tirar?", ["guardar alimentos secos e frios ajuda a conservá-los", "fungos não existem", "pão nunca estraga", "umidade conserva alimentos"], "Frio e pouca umidade conservam."),
          q("d4", "O bolor do pão é um tipo de:", ["fungo", "planta", "inseto", "bactéria do iogurte"], "Bolor ou mofo são fungos."),
        ],
      },
    },
    emSala: [
      "Faça o experimento dos pães com a turma e registre por fotos ou desenhos.",
      "Monte uma composteira em garrafa PET com restos da merenda.",
      "Prepare pão ou iogurte caseiro e explique o papel dos micróbios.",
    ],
  },
  {
    id: "cn-misturas",
    disc: "CN",
    series: [4, 5],
    titulo: "Misturas do dia a dia e como separá-las",
    emoji: "🧪",
    conteudo: "Matéria e energia",
    habilidades: [
      "Misturas na vida diaria (propriedades fisicas, separacao de fases)",
      "Propriedades fisicas dos materiais (elasticidade, dureza, condutibilidade)",
    ],
    niveis: {
      retomada: {
        questoes: [
          q("r1", "Açúcar mexido na água:", ["some na água (dissolve)", "fica boiando", "vira pedra"], "O açúcar se dissolve e não enxergamos mais."),
          q("r2", "Óleo colocado na água:", ["fica por cima, sem misturar", "some na água", "vira água"], "Óleo e água não se misturam."),
          q("r3", "Para tirar a areia da água, usamos:", ["um pano ou filtro (filtração)", "mais areia", "um ímã"], "O filtro segura a areia e deixa a água passar."),
        ],
      },
      pratica: {
        questoes: [
          q("p1", "Como separar o arroz das pedrinhas antes de cozinhar?", ["catando à mão (catação)", "fervendo", "com ímã", "com filtro de café"], "A catação separa pedaços grandes."),
          q("p2", "Para separar pregos de serragem, o melhor é usar:", ["um ímã", "água quente", "uma peneira de cozinha", "um filtro"], "O ímã atrai o ferro."),
          q("p3", "Como obter o sal da água do mar?", ["deixando a água evaporar", "passando no filtro", "com ímã", "congelando"], "A água evapora e o sal fica."),
          q("p4", "Água com óleo forma uma mistura com:", ["duas fases (partes visíveis)", "uma fase só", "nenhuma fase", "três gases"], "Dá para ver as duas partes separadas."),
        ],
      },
      desafio: {
        texto: {
          titulo: "A água do igarapé",
          paragrafos: [
            "Depois da chuva, a água do igarapé fica barrenta. Na comunidade, as famílias deixam a água descansar num balde, passam por um pano limpo e depois fervem.",
          ],
        },
        questoes: [
          q("d1", "Deixar a água descansar no balde faz a terra:", ["descer para o fundo (decantação)", "evaporar", "virar sal", "flutuar"], "A terra, mais pesada, se deposita no fundo."),
          q("d2", "Passar a água pelo pano serve para:", ["reter as partículas que ainda sobraram (filtração)", "esquentar a água", "dar sabor", "matar micróbios"], "O pano funciona como filtro."),
          q("d3", "Por que ferver a água no final?", ["para eliminar micróbios que a filtração não tira", "para separar o barro", "para gelar", "para colorir"], "Filtrar tira sujeira; ferver elimina micróbios."),
          q("d4", "Metais conduzem bem o calor. Por isso, a panela de ferver água:", ["esquenta rápido", "nunca esquenta", "derrete", "fica mole"], "Condutibilidade térmica dos metais."),
        ],
      },
    },
    emSala: [
      "Estações de misturas: água + sal, água + óleo, água + areia; os alunos testam e anotam o que acontece.",
      "Monte um filtro caseiro com garrafa PET, algodão, areia e pedrinhas.",
      "Desafio: separar feijão, arroz e clipes com as técnicas aprendidas.",
    ],
  },
  {
    id: "cn-cadeia-alimentar",
    disc: "CN",
    series: [4],
    titulo: "Quem come quem? Cadeia alimentar",
    emoji: "🐍",
    conteudo: "Vida e evolução",
    habilidades: [
      "Cadeias alimentares (produtores, consumidores, decompositores)",
      "Habito alimentar dos animais (herbivoro, carnivoro, onivoro)",
      "Ciclo da materia e fluxo de energia no ecossistema",
    ],
    niveis: {
      retomada: {
        questoes: [
          q("r1", "A capivara come capim. Ela é:", ["herbívora", "carnívora", "decompositora"], "Herbívoros comem plantas."),
          q("r2", "A onça come outros animais. Ela é:", ["carnívora", "herbívora", "produtora"], "Carnívoros comem carne."),
          q("r3", "Nós comemos arroz, feijão, frutas e carne. Somos:", ["onívoros", "herbívoros", "carnívoros"], "Onívoros comem de tudo."),
        ],
      },
      pratica: {
        texto: { titulo: "Uma cadeia da floresta", paragrafos: ["🌿 capim → 🐛 lagarta → 🐦 passarinho → 🐍 cobra"] },
        questoes: [
          q("p1", "Quem é o PRODUTOR nessa cadeia?", ["o capim", "a lagarta", "o passarinho", "a cobra"], "Plantas produzem o próprio alimento com a luz do sol."),
          q("p2", "O passarinho é consumidor de qual ordem?", ["2ª ordem (come quem comeu a planta)", "1ª ordem", "3ª ordem", "produtor"], "Ele come a lagarta, que comeu o capim."),
          q("p3", "Se as lagartas sumirem, o que acontece com os passarinhos?", ["ficam com menos alimento", "ficam com mais alimento", "nada muda", "viram cobras"], "Todos na cadeia dependem uns dos outros."),
          q("p4", "Quando a cobra morre, quem transforma seu corpo em adubo?", ["fungos e bactérias (decompositores)", "o capim", "a lagarta", "o passarinho"], "Decompositores fecham o ciclo."),
        ],
      },
      desafio: {
        texto: {
          titulo: "O lago",
          paragrafos: [
            "No lago, as algas servem de alimento para pequenos peixes, que são comidos pelo tucunaré. As garças comem tucunarés e peixes pequenos.",
            "Uma fábrica jogou veneno no lago e as algas morreram.",
          ],
        },
        questoes: [
          q("d1", "Qual cadeia está correta?", ["algas → peixes pequenos → tucunaré → garça", "garça → tucunaré → algas", "tucunaré → algas → garça", "peixes pequenos → algas → garça"], "A seta aponta para quem come."),
          q("d2", "Com a morte das algas, o que acontece primeiro?", ["os peixes pequenos ficam sem alimento", "as garças engordam", "o tucunaré se multiplica", "nada acontece"], "Os consumidores de 1ª ordem sentem primeiro."),
          q("d3", "Por que a garça também será afetada?", ["porque o alimento dela depende das algas, pela cadeia", "porque ela come algas", "porque a garça é produtora", "não será afetada"], "A energia passa de um ser para outro ao longo da cadeia."),
          q("d4", "De onde vem a energia que chega até a garça?", ["da luz do sol, captada pelas algas", "da água do lago", "do veneno", "do solo apenas"], "O fluxo de energia começa no sol."),
        ],
      },
    },
    emSala: [
      "Teia com barbante: cada aluno é um ser vivo e segura o fio de quem ele come; puxe um fio e veja o que acontece.",
      "Monte cadeias com animais da Amazônia (açaí, arara, gavião).",
      "Classifique figuras de animais em herbívoros, carnívoros e onívoros.",
    ],
  },
  {
    id: "cn-plantas-luz",
    disc: "CN",
    series: [2, 4],
    titulo: "As plantas: partes, luz e oxigênio",
    emoji: "🌱",
    conteudo: "Vida e evolução",
    habilidades: ["Luz solar, fotossintese e producao de oxigenio", "Partes da planta e suas funcoes"],
    niveis: {
      retomada: {
        questoes: [
          q("r1", "Qual parte da planta fica embaixo da terra e puxa a água?", ["a raiz", "a flor", "a folha"], "A raiz absorve água e prende a planta."),
          q("r2", "Qual parte da planta sustenta e leva a água até as folhas?", ["o caule", "o fruto", "a semente"], "O caule sustenta e transporta."),
          q("r3", "Dentro do fruto encontramos:", ["as sementes", "as raízes", "o caule"], "As sementes dão origem a novas plantas."),
        ],
      },
      pratica: {
        questoes: [
          q("p1", "As plantas precisam de quê para fazer seu alimento?", ["luz do sol, água e gás carbônico", "só terra", "só chocolate", "escuridão"], "Isso se chama fotossíntese."),
          q("p2", "Na fotossíntese, a planta libera um gás importante para nós:", ["oxigênio", "fumaça", "vapor de gasolina", "gás de cozinha"], "O oxigênio é usado na nossa respiração."),
          q("p3", "Qual parte da planta faz a maior parte da fotossíntese?", ["a folha", "a raiz", "a semente", "a flor"], "As folhas são verdes e captam a luz."),
          q("p4", "Uma planta deixada no escuro por muitos dias:", ["fica fraca e amarelada", "cresce mais verde", "dá mais frutos", "não muda"], "Sem luz, não faz fotossíntese."),
        ],
      },
      desafio: {
        texto: {
          titulo: "Experimento dos feijões",
          paragrafos: [
            "A turma plantou feijão em dois copos. O copo A ficou na janela; o copo B, dentro do armário. Os dois foram regados igualmente.",
            "Depois de 10 dias, o feijão A estava verde e firme; o B, alto, fino e amarelado.",
          ],
        },
        questoes: [
          q("d1", "O que era diferente entre os dois copos?", ["a luz", "a água", "o tipo de semente", "a terra"], "Só a luz mudou: é a variável do experimento."),
          q("d2", "Por que o feijão B ficou amarelado?", ["sem luz, não fez fotossíntese direito", "recebeu água demais", "a terra era outra", "estava frio"], "A luz é essencial para produzir alimento."),
          q("d3", "Por que o feijão B cresceu alto e fino?", ["esticou-se procurando luz", "estava muito forte", "recebeu adubo", "por causa do vento"], "As plantas crescem em direção à luz."),
          q("d4", "Por que as florestas são importantes para o ar que respiramos?", ["as plantas liberam oxigênio na fotossíntese", "elas produzem fumaça", "elas esfriam o sol", "elas guardam chuva no caule"], "Plantas renovam o oxigênio do ar."),
        ],
      },
    },
    emSala: [
      "Plante feijão no algodão, em dois copos (luz e escuro), e registre o crescimento em tabela.",
      "Leve uma planta inteira e identifique as partes com etiquetas.",
      "Saída ao pátio para observar folhas de diferentes plantas.",
    ],
  },
  {
    id: "cn-nutrientes",
    disc: "CN",
    series: [5],
    titulo: "Nutrientes: o que cada alimento faz no corpo",
    emoji: "🥗",
    conteudo: "Corpo humano e saúde",
    habilidades: [
      "Funcao e procedencia dos grupos de nutrientes",
      "Disturbios alimentares (obesidade, subnutricao)",
      "Alimentacao saudavel e prevencao de doencas cronicas",
      "Interacao entre sistemas digestorio e respiratorio",
    ],
    niveis: {
      retomada: {
        texto: {
          titulo: "Os grupos",
          paragrafos: [
            "⚡ CARBOIDRATOS dão energia: arroz, pão, macaxeira, farinha.",
            "💪 PROTEÍNAS constroem o corpo: feijão, ovo, peixe, carne.",
            "🛡️ VITAMINAS e SAIS MINERAIS protegem: frutas, verduras, legumes.",
            "🧈 GORDURAS dão energia em reserva: óleo, manteiga (com moderação).",
          ],
        },
        questoes: [
          q("r1", "Qual alimento é rico em proteína?", ["ovo", "açúcar", "refrigerante"], "Proteínas ajudam a construir músculos."),
          q("r2", "A macaxeira dá principalmente:", ["energia (carboidrato)", "vitamina C", "cálcio"], "Macaxeira, arroz e pão são fontes de energia."),
          q("r3", "Frutas e verduras são ricas em:", ["vitaminas e sais minerais", "gordura", "sal"], "Elas protegem o corpo de doenças."),
        ],
      },
      pratica: {
        questoes: [
          q("p1", "O leite e o queijo são fontes de cálcio, que ajuda a fortalecer:", ["ossos e dentes", "cabelos", "unhas apenas", "a visão"], "Cálcio é um sal mineral dos ossos."),
          q("p2", "Um prato equilibrado deve ter:", ["cereal, feijão ou carne, e verduras", "só batata frita", "só doces", "só refrigerante"], "Variar os grupos garante todos os nutrientes."),
          q("p3", "Comer muitos salgadinhos e doces todos os dias pode levar a:", ["obesidade e cáries", "ossos mais fortes", "mais vitaminas", "melhor visão"], "Excesso de açúcar e gordura prejudica a saúde."),
          q("p4", "Subnutrição acontece quando a pessoa:", ["não recebe os nutrientes de que precisa", "come frutas demais", "bebe muita água", "dorme muito"], "Falta de nutrientes enfraquece o corpo."),
        ],
      },
      desafio: {
        texto: {
          titulo: "O lanche de Davi",
          paragrafos: [
            "Todo dia, Davi leva para a escola biscoito recheado e refrigerante. Ele anda cansado, sem energia no recreio, e o dentista encontrou cáries.",
            "A nutricionista sugeriu trocar por banana, pão com ovo e água ou suco natural.",
          ],
        },
        questoes: [
          q("d1", "Por que o lanche de Davi não era saudável?", ["tinha muito açúcar e gordura e poucos nutrientes", "tinha muitas vitaminas", "era pequeno demais", "tinha muita água"], "Biscoito recheado e refrigerante têm “calorias vazias”."),
          q("d2", "Qual nutriente o ovo do novo lanche oferece?", ["proteína", "açúcar", "gordura trans", "sal apenas"], "O ovo é rico em proteína."),
          q("d3", "A banana contribui com:", ["energia e vitaminas", "somente proteína", "cálcio apenas", "nenhum nutriente"], "Fruta dá energia e vitaminas."),
          q("d4", "O alimento digerido chega às células pelo sangue, onde o oxigênio da respiração ajuda a:", ["liberar energia para o corpo", "fazer o alimento crescer", "produzir comida", "esfriar o corpo"], "Digestão + respiração = energia para as células."),
        ],
      },
    },
    emSala: [
      "Monte o “prato colorido” com recortes de encartes de supermercado.",
      "Leia rótulos de alimentos: quanto açúcar e sal tem cada um?",
      "Diário alimentar de 3 dias, com conversa sobre as escolhas (sem julgar a família).",
    ],
  },
  {
    id: "cn-agua",
    disc: "CN",
    series: [3, 4, 5],
    titulo: "O caminho da água: ciclo e estados físicos",
    emoji: "💧",
    conteudo: "Terra e universo",
    habilidades: [
      "Mudancas de estado fisico da agua e ciclo hidrologico",
      "Ciclo da agua (evaporacao, condensacao, precipitacao, infiltracao)",
      "Estados fisicos da agua e sua importancia",
      "Importancia da agua para plantas e animais",
    ],
    niveis: {
      retomada: {
        texto: {
          titulo: "A água muda de forma",
          paragrafos: ["🧊 Sólida: gelo.", "💧 Líquida: água do rio e da torneira.", "☁️ Gasosa: vapor que sobe da panela."],
        },
        questoes: [
          q("r1", "O gelo que derrete vira:", ["água líquida", "vapor", "pedra"], "Com calor, o sólido vira líquido (fusão)."),
          q("r2", "A roupa molhada no varal seca porque a água:", ["evapora com o calor", "vira gelo", "entra no chão"], "A água vira vapor e vai para o ar."),
          q("r3", "A chuva vem:", ["das nuvens", "das árvores", "do chão"], "As nuvens são gotinhas de água que caem como chuva."),
        ],
      },
      pratica: {
        texto: {
          titulo: "O ciclo",
          paragrafos: [
            "1. O sol aquece rios e mares, e a água EVAPORA.",
            "2. No alto, o vapor esfria e forma as nuvens: CONDENSAÇÃO.",
            "3. As gotas pesam e caem: PRECIPITAÇÃO (chuva).",
            "4. Parte da água entra no solo: INFILTRAÇÃO; parte volta aos rios.",
          ],
        },
        questoes: [
          q("p1", "Como se chama a passagem da água líquida para vapor?", ["evaporação", "condensação", "precipitação", "infiltração"], "Evaporar = líquido virando vapor."),
          q("p2", "As nuvens se formam por:", ["condensação do vapor", "evaporação do gelo", "infiltração", "solidificação"], "O vapor esfria e vira gotinhas."),
          q("p3", "A água da chuva que entra no solo e abastece os poços é a:", ["infiltração", "evaporação", "condensação", "fusão"], "Infiltrar = penetrar no solo."),
          q("p4", "O copo com água gelada fica “suado” por fora porque:", ["o vapor do ar condensa ao encostar no copo frio", "o copo tem furos", "a água atravessa o vidro", "o gelo evapora"], "Condensação no dia a dia."),
        ],
      },
      desafio: {
        texto: {
          titulo: "Um ano de seca",
          paragrafos: [
            "Em anos de seca forte, o Rio Acre fica tão baixo que dá para atravessar a pé. Com pouca chuva, menos água infiltra no solo, os igarapés secam e as plantações sofrem.",
            "Já no inverno amazônico, chuvas intensas fazem o rio transbordar.",
          ],
        },
        questoes: [
          q("d1", "Na seca, qual etapa do ciclo da água diminui muito na região?", ["a precipitação (chuva)", "a evaporação do gelo", "a solidificação", "a fusão"], "Menos chuva: todo o ciclo local é afetado."),
          q("d2", "Por que as plantações sofrem na seca?", ["as raízes encontram pouca água no solo", "as folhas recebem luz demais", "o solo fica frio", "os frutos ficam pesados"], "Menos infiltração, menos água para as raízes."),
          q("d3", "A cheia do rio acontece porque:", ["chove mais do que o solo e o rio conseguem escoar", "a água evapora demais", "o rio congela", "as nuvens somem"], "Excesso de precipitação."),
          q("d4", "Desmatar as margens do rio pode piorar secas e cheias porque:", ["sem plantas, a água infiltra menos e o solo desliza para o rio", "as árvores bebem toda a água", "as folhas fazem chover pedra", "não faz diferença"], "A vegetação protege o solo e ajuda a infiltração."),
        ],
      },
    },
    emSala: [
      "Ciclo da água no saco plástico: água com anil colada na janela; observe as gotinhas.",
      "Copo gelado “suando” e panela com tampa: evaporação e condensação ao vivo.",
      "Converse sobre as cheias e secas do Rio Acre vividas pelas famílias.",
    ],
  },
  {
    id: "cn-energia",
    disc: "CN",
    series: [5],
    titulo: "Energia elétrica: de onde vem e como economizar",
    emoji: "💡",
    conteudo: "Matéria e energia",
    habilidades: [
      "Usos da energia eletrica e formas de obtencao/transformacao",
      "Obtencao e transformacao de energia; consumo consciente",
    ],
    niveis: {
      retomada: {
        questoes: [
          q("r1", "Qual aparelho usa energia elétrica?", ["geladeira", "bicicleta", "vassoura"], "A geladeira precisa estar ligada na tomada."),
          q("r2", "Ao sair do quarto, devemos:", ["apagar a luz", "deixar a TV ligada", "abrir a geladeira"], "Apagar a luz economiza energia."),
          q("r3", "A energia que vem do sol se chama:", ["energia solar", "energia do vento", "energia da água"], "Placas solares transformam a luz em eletricidade."),
        ],
      },
      pratica: {
        questoes: [
          q("p1", "Uma usina hidrelétrica produz energia usando:", ["a força da água dos rios", "o vento", "a luz do sol", "o carvão da cozinha"], "A água gira as turbinas."),
          q("p2", "Energia do vento é chamada de:", ["eólica", "solar", "hidrelétrica", "nuclear"], "Cataventos gigantes geram energia eólica."),
          q("p3", "No ventilador, a energia elétrica se transforma em:", ["movimento", "luz apenas", "som apenas", "frio no motor"], "O motor faz as hélices girarem."),
          q("p4", "Qual atitude economiza energia?", ["tomar banhos mais curtos", "deixar o carregador na tomada sempre", "abrir a geladeira toda hora", "dormir com a TV ligada"], "O chuveiro elétrico gasta muita energia."),
        ],
      },
      desafio: {
        texto: {
          titulo: "A conta de luz",
          paragrafos: [
            "A família de Yara pagou uma conta alta. Eles viram que o chuveiro ficava ligado 20 minutos por banho, a geladeira ficava com a porta aberta enquanto decidiam o lanche e a TV ficava ligada sem ninguém assistindo.",
          ],
        },
        questoes: [
          q("d1", "Qual hábito provavelmente mais pesava na conta?", ["banhos longos no chuveiro elétrico", "usar o celular", "ligar o rádio", "acender uma lâmpada LED"], "O chuveiro elétrico é um dos maiores gastos da casa."),
          q("d2", "Por que abrir a geladeira toda hora gasta energia?", ["entra ar quente e o motor trabalha mais para esfriar", "a luz da geladeira gasta muito", "a comida esquenta e cozinha", "não gasta nada"], "O motor precisa compensar o calor."),
          q("d3", "Energia solar e eólica são chamadas de renováveis porque:", ["o sol e o vento não se esgotam", "são caras", "poluem muito", "vêm do petróleo"], "Fontes renováveis se renovam na natureza."),
          q("d4", "Um bom plano para a família seria:", ["banhos de 5 minutos, desligar a TV e decidir antes de abrir a geladeira", "comprar outra TV", "deixar tudo ligado para não estragar", "tomar banho duas vezes"], "Consumo consciente em ações simples."),
        ],
      },
    },
    emSala: [
      "Leve uma conta de luz e mostre como ler o consumo em kWh.",
      "“Detetive da energia”: a turma procura desperdícios na escola e propõe soluções.",
      "Construa um cata-vento e converse sobre energia eólica.",
    ],
  },
  {
    id: "cn-animais",
    disc: "CN",
    series: [2, 3],
    titulo: "Os grupos de animais e seus ciclos de vida",
    emoji: "🐸",
    conteudo: "Vida e evolução",
    habilidades: [
      "Grupos de animais (alimentacao, ambiente, reproducao)",
      "Etapas de vida de grupos de animais (peixes, anfibios, aves, repteis, mamiferos)",
      "Comparar e organizar animais por caracteristicas externas",
      "Caracterizar seres vivos (aspectos externos e ciclos de vida)",
    ],
    niveis: {
      retomada: {
        questoes: [
          q("r1", "Qual animal tem penas?", ["arara 🦜", "gato 🐱", "peixe 🐟"], "Aves têm penas e bico."),
          q("r2", "Qual animal tem escamas e vive na água?", ["peixe 🐟", "cachorro 🐶", "galinha 🐔"], "Peixes têm escamas e nadadeiras."),
          q("r3", "Qual animal mama quando é filhote?", ["vaca 🐄", "sapo 🐸", "cobra 🐍"], "Mamíferos mamam no leite da mãe."),
        ],
      },
      pratica: {
        questoes: [
          q("p1", "O sapo começa a vida como:", ["girino, na água", "filhote que mama", "ovo com casca dura em ninho", "lagarta"], "Anfíbios nascem na água e depois vivem na terra."),
          q("p2", "Tartaruga, jacaré e cobra são:", ["répteis", "aves", "anfíbios", "mamíferos"], "Répteis têm pele seca, com escamas ou placas."),
          q("p3", "Qual grupo de animais nasce de ovos com casca dura, chocados pelos pais?", ["aves", "mamíferos", "peixes", "anfíbios"], "As aves chocam os ovos no ninho."),
          q("p4", "O boto-cor-de-rosa vive na água, mas é:", ["mamífero", "peixe", "anfíbio", "réptil"], "Ele respira pelo pulmão e mama quando filhote."),
        ],
      },
      desafio: {
        questoes: [
          q("d1", "Qual sequência mostra o ciclo de vida da borboleta?", ["ovo → lagarta → casulo → borboleta", "lagarta → ovo → borboleta → casulo", "casulo → ovo → borboleta", "borboleta → lagarta → ovo"], "É a metamorfose completa."),
          q("d2", "O que o morcego e o gato têm em comum?", ["são mamíferos: têm pelos e mamam quando filhotes", "os dois voam", "os dois põem ovos", "os dois têm penas"], "O morcego é o único mamífero que voa."),
          q("d3", "Por que a pele do sapo precisa ficar úmida?", ["porque ele também respira pela pele", "para ficar bonito", "para não ser visto", "porque ele não tem pulmão nenhum"], "Anfíbios fazem trocas de gases pela pele."),
          q("d4", "Qual animal NÃO é do mesmo grupo que os outros?", ["pirarucu", "papagaio", "gavião", "tucano"], "Pirarucu é peixe; os outros são aves."),
        ],
      },
    },
    emSala: [
      "Classificação com figuras de animais da Amazônia em cartazes por grupo.",
      "Crie um terrário ou acompanhe girinos (com cuidado e devolução ao ambiente).",
      "Linha do tempo do ciclo de vida da borboleta com massinha.",
    ],
  },
  {
    id: "cn-solo",
    disc: "CN",
    series: [3],
    titulo: "O solo e a plantação",
    emoji: "🪱",
    conteudo: "Terra e universo",
    habilidades: ["Importancia do solo para a agricultura"],
    niveis: {
      retomada: {
        questoes: [
          q("r1", "As plantas precisam do solo para:", ["fixar as raízes e retirar água e nutrientes", "tomar sol", "ficar geladas"], "O solo sustenta e alimenta a planta."),
          q("r2", "A minhoca ajuda o solo porque:", ["cava túneis que deixam entrar ar e água", "come as plantas", "deixa o solo seco"], "Minhocas afofam e adubam o solo."),
          q("r3", "Folhas e restos de fruta que apodrecem viram:", ["adubo", "pedra", "plástico"], "Matéria orgânica deixa o solo fértil."),
        ],
      },
      pratica: {
        questoes: [
          q("p1", "Qual solo é melhor para plantar?", ["solo escuro, rico em restos de plantas (húmus)", "solo só de areia", "cimento", "solo com lixo plástico"], "O húmus é cheio de nutrientes."),
          q("p2", "O solo arenoso:", ["deixa a água passar rápido e seca logo", "segura muita água", "é sempre o melhor para plantar", "vira barro"], "Areia tem grãos grandes e soltos."),
          q("p3", "Queimar a mata para plantar:", ["empobrece o solo e prejudica os seres vivos", "deixa o solo mais rico para sempre", "não muda nada", "faz chover"], "O fogo destrói nutrientes e organismos do solo."),
          q("p4", "Plantar árvores nas encostas ajuda a evitar:", ["erosão (o solo escorrendo com a chuva)", "o crescimento das plantas", "a chuva", "o vento"], "As raízes seguram o solo."),
        ],
      },
      desafio: {
        texto: {
          titulo: "Três vasos",
          paragrafos: [
            "A turma plantou milho em três vasos: A com areia, B com argila e C com terra preta de mata.",
            "Regando igualmente, o vaso A secava logo; o B virava barro encharcado; o C manteve a umidade e o milho cresceu melhor.",
          ],
        },
        questoes: [
          q("d1", "Por que o milho cresceu melhor no vaso C?", ["a terra preta tem nutrientes e guarda a água na medida certa", "recebeu mais água", "tinha mais areia", "estava no escuro"], "Solo rico em húmus é equilibrado."),
          q("d2", "Qual problema o vaso de argila apresentou?", ["encharcou, e as raízes ficam sem ar", "secou rápido", "tinha muitas minhocas", "nenhum"], "A argila retém água demais."),
          q("d3", "O que o experimento tinha de igual nos três vasos?", ["a semente e a quantidade de água", "o tipo de solo", "o resultado", "nada"], "Só o solo mudou, para comparar."),
          q("d4", "Para melhorar o solo arenoso, o agricultor pode:", ["misturar adubo orgânico", "colocar mais areia", "queimar o terreno", "cobrir com plástico"], "Adubo orgânico ajuda a reter água e nutrientes."),
        ],
      },
    },
    emSala: [
      "Colete amostras de solo (areia, argila, terra preta) e compare textura, cor e absorção de água.",
      "Monte um minhocário em pote transparente.",
      "Converse com um agricultor da comunidade sobre como ele cuida da terra.",
    ],
  },
  {
    id: "cn-lixo",
    disc: "CN",
    series: [2, 3, 5],
    titulo: "Lixo: separar, reduzir e reciclar",
    emoji: "♻️",
    conteudo: "Sustentabilidade",
    habilidades: [
      "Reciclagem e descarte correto do lixo",
      "Classificar residuos organicos e inorganicos",
      "Transformacao e descarte consciente de materiais (reciclagem, compostagem)",
      "Consumo consciente, descarte de residuos e recursos hidricos",
      "Consumo consciente e uso sustentavel de recursos naturais",
    ],
    niveis: {
      retomada: {
        questoes: [
          q("r1", "Casca de banana é lixo:", ["orgânico (pode virar adubo)", "reciclável de plástico", "de vidro"], "Restos de alimentos são orgânicos."),
          q("r2", "A garrafa PET vai para a lixeira de:", ["plástico", "papel", "orgânico"], "PET é plástico e pode ser reciclado."),
          q("r3", "Jogar lixo no rio:", ["polui a água e mata os peixes", "limpa o rio", "não faz mal"], "O lixo contamina a água."),
        ],
      },
      pratica: {
        texto: {
          titulo: "As cores da coleta seletiva",
          paragrafos: ["🔵 Azul: papel", "🔴 Vermelho: plástico", "🟢 Verde: vidro", "🟡 Amarelo: metal", "🟤 Marrom: orgânico"],
        },
        questoes: [
          q("p1", "Uma lata de refrigerante vai na lixeira:", ["amarela (metal)", "azul", "verde", "marrom"], "Latas são de alumínio, um metal."),
          q("p2", "O jornal velho vai na lixeira:", ["azul (papel)", "vermelha", "verde", "amarela"], "Azul é para papel."),
          q("p3", "O que significa REDUZIR?", ["gastar e comprar menos, gerando menos lixo", "jogar tudo fora", "queimar o lixo", "enterrar o plástico"], "Reduzir é o primeiro dos 3 Rs."),
          q("p4", "Transformar restos de comida em adubo chama-se:", ["compostagem", "reciclagem de vidro", "queimada", "evaporação"], "A composteira transforma orgânicos em adubo."),
        ],
      },
      desafio: {
        texto: {
          titulo: "Um dia de lixo na escola",
          paragrafos: [
            "A turma pesou o lixo de um dia: 6 kg de restos de merenda, 3 kg de papel, 2 kg de plástico e 1 kg de outros materiais.",
          ],
        },
        questoes: [
          q("d1", "Qual tipo de lixo a escola mais produziu?", ["orgânico (restos de merenda)", "papel", "plástico", "outros"], "6 kg é o maior valor."),
          q("d2", "Qual ação reduziria mais o lixo que vai para o aterro?", ["fazer compostagem dos restos de merenda", "usar mais copos descartáveis", "imprimir mais folhas", "queimar o papel"], "Metade do lixo é orgânico e pode virar adubo."),
          q("d3", "Quantos quilos poderiam ir para a reciclagem de papel e plástico?", ["5 kg", "6 kg", "12 kg", "2 kg"], "3 kg de papel + 2 kg de plástico = 5 kg."),
          q("d4", "Usar garrafinha própria em vez de copo descartável é um exemplo de:", ["reduzir e reutilizar", "reciclar vidro", "compostagem", "desperdício"], "Menos descartáveis, menos lixo."),
        ],
      },
    },
    emSala: [
      "Gincana de separação do lixo com as cores da coleta seletiva.",
      "Pesagem do lixo da turma por uma semana, com gráfico dos resultados.",
      "Oficina de reaproveitamento: brinquedos com sucata.",
    ],
  },
  {
    id: "cn-saude-habitos",
    disc: "CN",
    series: [1, 2, 3, 4],
    titulo: "Hábitos saudáveis: higiene, sono, comida e movimento",
    emoji: "🧼",
    conteudo: "Corpo humano e saúde",
    habilidades: [
      "Habitos saudaveis (higiene, alimentacao, sono, exercicio)",
      "Habitos de saude pessoal e coletiva (higiene) e sua importancia",
      "Higiene e alimentacao para promocao da saude",
      "Equilibrio do corpo: saude fisica e emocional",
    ],
    niveis: {
      retomada: {
        questoes: [
          q("r1", "Antes de comer, devemos:", ["lavar as mãos 🧼", "brincar na terra", "dar comida ao gato"], "Mãos limpas evitam doenças."),
          q("r2", "Depois das refeições, é hora de:", ["escovar os dentes 🪥", "dormir de boca aberta", "comer bala"], "Escovar evita cáries."),
          q("r3", "Para crescer com saúde, as crianças precisam:", ["dormir bem à noite 😴", "ficar acordadas até tarde", "comer só doces"], "O sono ajuda o corpo e a mente."),
        ],
      },
      pratica: {
        questoes: [
          q("p1", "Quantas horas de sono uma criança deve dormir por noite, mais ou menos?", ["de 9 a 11 horas", "3 horas", "15 horas", "1 hora"], "Crianças precisam de muitas horas de sono."),
          q("p2", "Brincar, correr e pular ajuda:", ["o coração, os músculos e o humor", "somente a cansar", "a pegar gripe", "nada"], "Atividade física faz bem ao corpo e à mente."),
          q("p3", "Qual é um hábito de higiene COLETIVA?", ["jogar o lixo na lixeira", "tomar banho", "cortar as unhas", "escovar os dentes"], "Cuidar dos espaços que todos usam."),
          q("p4", "Quando estamos tristes ou com raiva, uma atitude saudável é:", ["conversar com alguém de confiança", "guardar tudo e não falar", "brigar com os colegas", "parar de comer"], "Saúde emocional também é saúde."),
        ],
      },
      desafio: {
        texto: {
          titulo: "A rotina de Kauã",
          paragrafos: [
            "Kauã dorme à meia-noite jogando no celular, acorda às 6h, não toma café da manhã e passa o recreio sentado. À tarde, sente dor de cabeça e não consegue prestar atenção.",
          ],
        },
        questoes: [
          q("d1", "Quantas horas Kauã está dormindo?", ["6 horas, menos do que precisa", "10 horas", "12 horas", "8 horas, o ideal"], "Da meia-noite às 6h são 6 horas."),
          q("d2", "O que pode explicar a dor de cabeça e a falta de atenção?", ["pouco sono e ficar sem café da manhã", "brincar demais", "beber água", "comer frutas"], "Sono e alimentação afetam a concentração."),
          q("d3", "Qual mudança ajudaria mais Kauã?", ["desligar o celular mais cedo, tomar café e se movimentar no recreio", "jogar até mais tarde", "pular o almoço também", "dormir na aula"], "Mudar vários hábitos juntos."),
          q("d4", "Esse caso mostra que saúde depende de:", ["vários hábitos juntos: sono, alimentação e movimento", "só de remédios", "só de sorte", "só do tempo lá fora"], "O corpo funciona em equilíbrio."),
        ],
      },
    },
    emSala: [
      "Quadro de rotina saudável que a criança preenche durante a semana, com adesivos.",
      "Teatro de fantoches sobre higiene das mãos e dos dentes.",
      "Roda de conversa sobre sentimentos, com o “termômetro das emoções”.",
    ],
  },
  {
    id: "cn-ambientes",
    disc: "CN",
    series: [1, 2],
    titulo: "Ambientes e seres vivos: o que tem vida?",
    emoji: "🌳",
    conteudo: "Vida e ambiente",
    habilidades: [
      "Comparar ambientes naturais (floresta, rio, praia)",
      "Componentes vivos e nao vivos do meio ambiente",
      "Meio ambiente: componentes vivos e nao vivos",
      "Cuidados dos seres humanos com o meio ambiente e preservacao",
    ],
    niveis: {
      retomada: {
        questoes: [
          q("r1", "Qual destes TEM VIDA?", ["árvore 🌳", "pedra 🪨", "cadeira 🪑"], "A árvore nasce, cresce, se alimenta e morre."),
          q("r2", "Qual destes NÃO tem vida?", ["água 💧", "peixe 🐟", "flor 🌸"], "A água é importante para a vida, mas não é um ser vivo."),
          q("r3", "O peixe vive:", ["no rio 🏞️", "na árvore", "na areia seca"], "O ambiente do peixe é a água."),
        ],
      },
      pratica: {
        questoes: [
          q("p1", "Os seres vivos:", ["nascem, crescem, se alimentam e morrem", "nunca mudam", "não precisam de água", "são feitos de plástico"], "São características dos seres vivos."),
          q("p2", "Na floresta amazônica há:", ["muitas árvores, sombra e umidade", "só areia e sol", "gelo o ano todo", "nenhum animal"], "A floresta é úmida e sombreada."),
          q("p3", "O sol, o ar e as rochas são:", ["elementos não vivos importantes para a vida", "seres vivos", "animais", "plantas"], "Não têm vida, mas os seres vivos dependem deles."),
          q("p4", "Como cuidar do rio perto de casa?", ["não jogar lixo e proteger as árvores da margem", "jogar entulho", "lavar carro com sabão na água", "cortar as árvores"], "Preservar é cuidar de todos os seres vivos."),
        ],
      },
      desafio: {
        questoes: [
          q("d1", "Por que o jacaré vive bem no rio e não no deserto?", ["o rio tem água, comida e abrigo de que ele precisa", "ele não gosta de areia", "no deserto faz frio", "por acaso"], "Cada ser vive no ambiente que atende às suas necessidades."),
          q("d2", "O que acontece com os animais se a floresta for derrubada?", ["perdem abrigo e alimento", "ficam mais felizes", "nada muda", "viram plantas"], "O desmatamento destrói o lar de muitos seres."),
          q("d3", "Na praia de areia, as plantas geralmente são:", ["baixas, resistentes ao sol e ao sal", "árvores gigantes da floresta", "musgos de caverna", "inexistentes sempre"], "Cada ambiente tem plantas adaptadas."),
          q("d4", "Qual atitude ajuda a preservar o ambiente da escola?", ["plantar mudas e cuidar do jardim", "arrancar plantas", "pisar nos canteiros", "jogar papel no chão"], "Pequenas ações preservam o ambiente."),
        ],
      },
    },
    emSala: [
      "Passeio pelo pátio para listar o que tem vida e o que não tem.",
      "Maquetes de ambientes (floresta, rio, praia) com materiais recicláveis.",
      "Adote uma planta da escola por turma.",
    ],
  },
  {
    id: "cn-materiais",
    disc: "CN",
    series: [1, 2],
    titulo: "Do que as coisas são feitas?",
    emoji: "🧸",
    conteudo: "Materiais e objetos",
    habilidades: [
      "Vocabulario descritivo; diferenca entre materiais e objetos",
      "Semelhancas/diferencas entre objetos e materiais (naturais x fabricados)",
      "Materiais dos objetos do cotidiano (presente e passado)",
      "Objetos domesticos que oferecem risco e prevencao de acidentes",
    ],
    niveis: {
      retomada: {
        questoes: [
          q("r1", "A mesa da sala é feita de:", ["madeira 🪵", "algodão", "gelo"], "Muitas mesas são de madeira."),
          q("r2", "O copo que quebra fácil é de:", ["vidro", "pano", "borracha"], "Vidro é duro, mas quebra."),
          q("r3", "Qual objeto é MACIO?", ["travesseiro", "pedra", "prego"], "O travesseiro é fofo e macio."),
        ],
      },
      pratica: {
        questoes: [
          q("p1", "Qual destes vem direto da NATUREZA?", ["pedra", "garrafa PET", "lápis de cor", "sacola plástica"], "A pedra não foi fabricada pelas pessoas."),
          q("p2", "Antigamente, muitas panelas eram de barro. Hoje, a maioria é de:", ["metal (alumínio ou aço)", "papel", "vidro de janela", "plástico mole"], "Os materiais dos objetos mudaram com o tempo."),
          q("p3", "Qual objeto da casa pode causar acidente se a criança mexer?", ["faca e tomada", "travesseiro", "livro", "bola de meia"], "Objetos cortantes e eletricidade oferecem risco."),
          q("p4", "Produtos de limpeza devem ficar:", ["no alto, longe do alcance das crianças", "junto dos brinquedos", "na geladeira", "em garrafas de refrigerante"], "Evita envenenamentos."),
        ],
      },
      desafio: {
        questoes: [
          q("d1", "Por que a cadeira é feita de madeira ou metal, e não de papel?", ["porque precisa ser resistente para aguentar peso", "porque papel é caro", "porque madeira é macia", "porque metal é leve como papel"], "Escolhemos o material pela função do objeto."),
          q("d2", "O que o copo de vidro e a garrafa de plástico têm em comum?", ["guardam líquidos", "quebram fácil", "são feitos de madeira", "vêm prontos da natureza"], "Objetos diferentes podem ter a mesma função."),
          q("d3", "Por que não se deve guardar remédio em garrafa de suco?", ["alguém pode beber achando que é suco", "o remédio fica gelado", "a garrafa quebra", "não tem problema"], "Prevenção de acidentes domésticos."),
          q("d4", "A panela tem cabo de plástico ou madeira porque esses materiais:", ["não deixam o calor passar para a mão", "são bonitos", "esquentam rápido", "são pesados"], "Isolantes térmicos protegem de queimaduras."),
        ],
      },
    },
    emSala: [
      "Caixa surpresa: a criança tira objetos e descreve (liso, áspero, duro, macio, leve, pesado).",
      "Separe objetos naturais (folha, pedra, semente) e fabricados (lápis, copo, brinquedo).",
      "Caça aos riscos: desenho de uma casa para marcar onde estão os perigos.",
    ],
  },
  {
    id: "cn-luz-dia-noite",
    disc: "CN",
    series: [1, 3],
    titulo: "Luz, sombra, dia e noite",
    emoji: "🌗",
    conteudo: "Terra e universo",
    habilidades: [
      "Sucessao de dias e noites e ritmo das atividades",
      "Passagem da luz: objetos transparentes, translucidos e opacos",
    ],
    niveis: {
      retomada: {
        questoes: [
          q("r1", "Quando o sol aparece no céu é:", ["dia ☀️", "noite 🌙", "madrugada"], "Com o sol no céu, é dia."),
          q("r2", "Qual atividade fazemos normalmente à noite?", ["dormir 😴", "ir para a escola", "almoçar"], "A noite é o momento de descansar."),
          q("r3", "A coruja fica acordada:", ["à noite", "só ao meio-dia", "nunca"], "Alguns animais são noturnos."),
        ],
      },
      pratica: {
        texto: {
          titulo: "A luz atravessa?",
          paragrafos: [
            "TRANSPARENTE: a luz passa e vemos tudo do outro lado (vidro da janela).",
            "TRANSLÚCIDO: a luz passa, mas vemos embaçado (papel vegetal, vidro do banheiro).",
            "OPACO: a luz não passa e forma sombra (madeira, papelão).",
          ],
        },
        questoes: [
          q("p1", "O vidro limpo da janela é:", ["transparente", "opaco", "translúcido", "escuro"], "Vemos claramente através dele."),
          q("p2", "Uma porta de madeira é:", ["opaca", "transparente", "translúcida", "líquida"], "A luz não atravessa a madeira."),
          q("p3", "O papel vegetal deixa passar a luz, mas vemos tudo embaçado. Ele é:", ["translúcido", "opaco", "transparente", "espelho"], "Deixa passar parte da luz."),
          q("p4", "A sombra se forma quando:", ["um objeto opaco bloqueia a luz", "a luz atravessa o vidro", "está escuro total", "a água evapora"], "Sem passagem de luz, surge a sombra."),
        ],
      },
      desafio: {
        questoes: [
          q("d1", "Por que existe o dia e a noite?", ["porque a Terra gira em torno de si mesma", "porque o sol se apaga", "porque a lua cobre o sol todo dia", "porque as nuvens escondem o sol"], "O movimento de rotação dura cerca de 24 horas."),
          q("d2", "Para ter privacidade no banheiro sem deixar escuro, o melhor vidro é:", ["translúcido (fosco)", "transparente", "opaco de madeira", "espelho"], "Deixa a luz entrar, mas não mostra o que tem dentro."),
          q("d3", "Ao meio-dia, com o sol bem no alto, a sombra das pessoas fica:", ["bem curta", "muito comprida", "invisível sempre", "colorida"], "Com o sol alto, a sombra diminui."),
          q("d4", "Por que muitas plantas fecham as flores à noite e alguns animais saem para caçar?", ["os seres vivos têm ritmos ligados ao dia e à noite", "por acaso", "porque chove à noite", "porque faz calor à noite"], "O ciclo dia-noite regula a vida."),
        ],
      },
    },
    emSala: [
      "Teatro de sombras com lanterna e figuras de papelão.",
      "Teste de materiais com lanterna: classifique em transparente, translúcido e opaco.",
      "Registre a sombra de um cabo de vassoura no pátio em três horários do dia.",
    ],
  },
];
