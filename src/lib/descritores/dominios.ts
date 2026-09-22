import {
  AudioLines,
  BarChart3,
  BookA,
  BookMarked,
  BookOpen,
  BookOpenCheck,
  Calculator,
  Dna,
  FileText,
  Globe2,
  HeartPulse,
  Hash,
  Images,
  Leaf,
  Lightbulb,
  Link,
  Link2,
  MessagesSquare,
  Microscope,
  Orbit,
  Package,
  PenLine,
  Quote,
  Recycle,
  Repeat,
  Ruler,
  Shapes,
  ShieldPlus,
  Sprout,
  TreePine,
  Type,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { CorCategoria } from "@/components/school/categoria-hero";
import type { Disciplina } from "@/lib/recomposicao/catalogo";

export interface Dominio {
  /** Igual ao campo `conteudo` já autorado nos geradores/bancos de atividade. */
  id: string;
  disc: Disciplina;
  icon: LucideIcon;
  cor: CorCategoria;
  /** O que se espera da criança que já domina este domínio. */
  expectativa: string;
  /** Como perceber, na prática da sala, se ela já aprendeu. */
  avaliar: string;
  /** Ideias de intervenção — ponto de partida, não protocolo fechado. */
  estrategias: string[];
}

/**
 * Conteúdo pedagógico por DOMÍNIO de habilidade (não por descritor
 * individual) — decisão tomada com o usuário depois de investigar o que já
 * existe no site: não há uma fonte curricular oficial com "como avaliar" e
 * "estratégias" específicas para cada um dos ~120 descritores, só o texto
 * oficial (Matemática, via BNCC/SEME) e dicas genéricas por tema (a tabela
 * `DICAS` do observatório). Este arquivo assume esse mesmo papel de forma
 * organizada e visível — orientação pedagógica geral por domínio, para o
 * professor adaptar à turma dele, não um documento oficial da SEME.
 *
 * As chaves são exatamente os valores de `conteudo` já usados em
 * `geradores.tsx`, `geradores-lpcn.ts`, `banco-lp.ts` e `banco-cn.ts` — a
 * ideia é entrar em sincronia com o que a base de atividades já usa, não
 * inventar uma taxonomia nova.
 */
export const DOMINIOS: Record<string, Dominio> = {
  // ───────────── Matemática (os 5 eixos da BNCC) ─────────────
  Números: {
    id: "Números",
    disc: "MAT",
    icon: Hash,
    cor: "blue",
    expectativa:
      "Contar, comparar e ordenar quantidades, e entender o valor de cada posição num número (unidade, dezena, centena...).",
    avaliar:
      "Peça para contar objetos em voz alta, comparar duas quantidades ('qual tem mais?') e escrever um número ditado. Erros de troca de ordem (23 por 32) indicam valor posicional ainda não consolidado.",
    estrategias: [
      "Material concreto (tampinhas, material dourado, ábaco) antes do papel.",
      "Reta numérica na parede, usada todo dia para localizar e comparar números.",
      "Jogos de ordenar cartas com números para o aluno colocar em fila.",
    ],
  },
  Operações: {
    id: "Operações",
    disc: "MAT",
    icon: Calculator,
    cor: "indigo",
    expectativa:
      "Resolver problemas de juntar, tirar, repetir grupos ou dividir igualmente, entendendo a situação antes de calcular.",
    avaliar:
      "Dê um problema com contexto (não só a conta pronta) e observe se o aluno consegue explicar o que vai fazer antes de calcular — quem só decora a conta costuma travar quando o problema muda de forma.",
    estrategias: [
      "Resolver em duplas, com desenho do problema antes da conta.",
      "O aluno cria o próprio problema para um colega resolver.",
      "Material concreto para representar juntar/tirar/repetir antes do registro numérico.",
    ],
  },
  Geometria: {
    id: "Geometria",
    disc: "MAT",
    icon: Shapes,
    cor: "violet",
    expectativa:
      "Reconhecer formas planas e sólidos geométricos no dia a dia, e se localizar no espaço (direita/esquerda, malha quadriculada).",
    avaliar:
      "Peça para apontar objetos da sala parecidos com um sólido (bola=esfera, caixa=cubo) e para dar um comando de percurso ('dois passos à direita').",
    estrategias: [
      "Manusear embalagens reais e desmontar caixas para ver a planificação.",
      "Brincadeiras de percurso no pátio com comandos de direção.",
      "Caça às formas geométricas pela escola.",
    ],
  },
  "Grandezas e medidas": {
    id: "Grandezas e medidas",
    disc: "MAT",
    icon: Ruler,
    cor: "amber",
    expectativa:
      "Medir, comparar e usar unidades de tempo, dinheiro, comprimento, massa e capacidade em situações reais.",
    avaliar:
      "Situações práticas: 'quanto troco eu recebo?', 'qual dos dois lápis é mais comprido?', ler as horas num relógio de ponteiro.",
    estrategias: [
      "Mercadinho em sala, com dinheiro de brincadeira, para comprar e calcular troco.",
      "Uso diário do calendário e do relógio na rotina da turma.",
      "Medir objetos reais com régua/fita métrica e comparar resultados.",
    ],
  },
  Álgebra: {
    id: "Álgebra",
    disc: "MAT",
    icon: Repeat,
    cor: "teal",
    expectativa: "Perceber e continuar uma sequência ou padrão, e explicar a regra por trás dele.",
    avaliar:
      "Mostre uma sequência incompleta (cores, formas ou números) e peça para completar e dizer, com as próprias palavras, qual é a regra.",
    estrategias: [
      "Sequências com objetos e cores antes de números abstratos.",
      "O aluno inventa uma sequência para o colega descobrir a regra.",
      "Registrar a regra encontrada em voz alta antes de escrever.",
    ],
  },
  Estatística: {
    id: "Estatística",
    disc: "MAT",
    icon: BarChart3,
    cor: "sky",
    expectativa: "Ler e interpretar informações organizadas em tabelas e gráficos simples.",
    avaliar:
      "Apresente uma tabela ou gráfico curto e faça perguntas de leitura direta ('qual foi o mais votado?') e de comparação ('quantos a mais?').",
    estrategias: [
      "Construir tabelas e gráficos com dados reais da turma (idade, fruta preferida).",
      "Perguntas de leitura do gráfico antes de pedir para construir um novo.",
      "Comparar dois gráficos parecidos e discutir as diferenças.",
    ],
  },

  // ───────────── Português ─────────────
  Alfabetização: {
    id: "Alfabetização",
    disc: "LP",
    icon: PenLine,
    cor: "rose",
    expectativa:
      "Reconhecer que a escrita representa sons da fala e começar a escrever de forma alfabética, mesmo com erros de ortografia.",
    avaliar:
      "Peça para escrever palavras ditadas e observe se cada letra corresponde a um som da palavra (mesmo que a ortografia não esteja perfeita).",
    estrategias: [
      "Leitura diária em voz alta com textos curtos.",
      "Jogos com fichas de letras e sílabas para montar palavras.",
      "Ditado estruturado em pequenos grupos, com correção coletiva.",
    ],
  },
  "Alfabeto e escrita": {
    id: "Alfabeto e escrita",
    disc: "LP",
    icon: BookA,
    cor: "rose",
    expectativa:
      "Reconhecer as letras do alfabeto (maiúsculas/minúsculas) e usá-las para escrever.",
    avaliar:
      "Peça para nomear letras soltas e para copiar/escrever o próprio nome e palavras curtas.",
    estrategias: [
      "Alfabeto exposto na sala, usado como referência o tempo todo.",
      "Jogos de formar palavras com letras móveis.",
      "Escrita do próprio nome como primeira palavra de referência.",
    ],
  },
  "Consciência fonológica": {
    id: "Consciência fonológica",
    disc: "LP",
    icon: AudioLines,
    cor: "rose",
    expectativa:
      "Perceber e manipular os sons das palavras: sílabas, rimas e sons iniciais/finais.",
    avaliar:
      "Peça para bater palmas contando as sílabas de uma palavra, ou para achar palavras que rimam.",
    estrategias: [
      "Jogos de rima e de trocar a primeira sílaba de uma palavra.",
      "Cantigas e parlendas que destacam sons repetidos.",
      "Separar palavras em sílabas com palmas ou blocos.",
    ],
  },
  "Gramática na frase": {
    id: "Gramática na frase",
    disc: "LP",
    icon: Type,
    cor: "pink",
    expectativa:
      "Reconhecer a estrutura básica da frase e usar concordância simples (número/gênero).",
    avaliar:
      "Peça para completar frases com a palavra que concorda corretamente e para identificar frases 'estranhas'.",
    estrategias: [
      "Reescrita coletiva de frases com erro proposital para a turma corrigir.",
      "Jogos de montar frases com cartões de palavras.",
      "Leitura em voz alta destacando a concordância pelo ouvido.",
    ],
  },
  "Vocabulário e sentido": {
    id: "Vocabulário e sentido",
    disc: "LP",
    icon: BookA,
    cor: "pink",
    expectativa: "Entender o significado de palavras novas pelo contexto do texto.",
    avaliar:
      "Pergunte o que uma palavra do texto quer dizer ali, e como o aluno descobriu (pelo contexto, por semelhança com outra palavra).",
    estrategias: [
      "Antes de explicar, perguntar 'o que você acha que essa palavra quer dizer aqui?'.",
      "Mural de palavras novas da semana, com desenho e frase.",
      "Trocar a palavra difícil por um sinônimo e ver se o sentido continua igual.",
    ],
  },
  "Coesão e conectivos": {
    id: "Coesão e conectivos",
    disc: "LP",
    icon: Link2,
    cor: "indigo",
    expectativa:
      "Usar conectivos (porque, mas, então, e) para ligar ideias com sentido de causa, oposição ou sequência.",
    avaliar:
      "Peça para unir duas frases soltas com o conectivo certo e explicar por que escolheu aquele.",
    estrategias: [
      "Montar e desmontar frases com conectivos diferentes, comparando o sentido.",
      "Texto coletivo em que a turma escolhe o conectivo linha a linha.",
      "Jogo de completar a frase com o conectivo que faz sentido.",
    ],
  },
  "Coesão e referência": {
    id: "Coesão e referência",
    disc: "LP",
    icon: Link,
    cor: "indigo",
    expectativa:
      "Entender a quem/o que uma palavra (ele, ela, isso, aquele) está se referindo no texto.",
    avaliar: "Aponte um pronome no texto e pergunte a quem ou ao que ele se refere.",
    estrategias: [
      "Trocar palavras repetidas por pronomes num texto coletivo e comparar.",
      "Sublinhar no texto a que cada pronome se refere, com setas.",
      "Reescrever um trecho substituindo repetições por referências.",
    ],
  },
  "Pontuação e efeitos de sentido": {
    id: "Pontuação e efeitos de sentido",
    disc: "LP",
    icon: Quote,
    cor: "violet",
    expectativa: "Perceber como a pontuação muda o sentido e a entonação de uma frase.",
    avaliar:
      "Leia a mesma frase com pontuações diferentes (. ! ?) e pergunte o que muda no sentido.",
    estrategias: [
      "Ler a mesma frase com pontuações diferentes e discutir a mudança de sentido.",
      "Reescrita coletiva de diálogos de uma tirinha, incluindo a pontuação.",
      "Caça à pontuação num texto, explicando o efeito de cada sinal.",
    ],
  },
  "Compreensão de texto": {
    id: "Compreensão de texto",
    disc: "LP",
    icon: BookOpenCheck,
    cor: "sky",
    expectativa: "Entender o assunto principal e informações explícitas de um texto lido.",
    avaliar:
      "Depois da leitura, peça para contar do que o texto trata e apontar no texto onde está uma informação específica.",
    estrategias: [
      "Leitura compartilhada com perguntas antes, durante e depois do texto.",
      "O aluno aponta no texto onde está a resposta, em vez de responder de memória.",
      "Rodas de conversa sobre o tema do texto antes de partir para as questões.",
    ],
  },
  "Leitura e interpretação": {
    id: "Leitura e interpretação",
    disc: "LP",
    icon: BookOpen,
    cor: "sky",
    expectativa: "Ler com autonomia e construir sentido a partir do que está escrito.",
    avaliar:
      "Observe a fluência da leitura em voz alta e faça perguntas de interpretação sobre o que foi lido.",
    estrategias: [
      "Leitura diária, com textos do interesse da turma.",
      "Perguntas de interpretação variadas: literais, inferenciais e de opinião.",
      "Reconto do texto com as próprias palavras.",
    ],
  },
  "Leitura multimodal": {
    id: "Leitura multimodal",
    disc: "LP",
    icon: Images,
    cor: "cyan",
    expectativa:
      "Relacionar texto e imagem (tirinhas, infográficos, memes) para construir o sentido completo.",
    avaliar:
      "Mostre uma tirinha ou infográfico e pergunte o que a imagem acrescenta ao texto escrito.",
    estrategias: [
      "Leitura de tirinhas e HQs com pausa para observar cada quadro.",
      "Comparar a mesma notícia em texto puro e em infográfico.",
      "Produção de cartazes que combinem texto curto e imagem.",
    ],
  },
  "Gêneros textuais": {
    id: "Gêneros textuais",
    disc: "LP",
    icon: FileText,
    cor: "emerald",
    expectativa:
      "Reconhecer a finalidade e as características de diferentes tipos de texto (bilhete, notícia, receita, conto).",
    avaliar:
      "Mostre um texto sem identificar o gênero e pergunte para que ele serve e como o aluno descobriu.",
    estrategias: [
      "Coleção de exemplos reais de cada gênero (embalagem, bilhete, notícia).",
      "Produção do próprio gênero depois de analisar modelos.",
      "Comparar dois gêneros diferentes sobre o mesmo assunto.",
    ],
  },
  Inferência: {
    id: "Inferência",
    disc: "LP",
    icon: Lightbulb,
    cor: "amber",
    expectativa:
      "Concluir uma informação que não está escrita diretamente, usando pistas do texto.",
    avaliar:
      "Pergunte algo que exige juntar duas informações do texto para responder, não copiar uma frase pronta.",
    estrategias: [
      "Perguntas do tipo 'o que você acha que aconteceu antes/depois?'.",
      "Destacar as pistas do texto que levam à conclusão.",
      "Histórias com final em aberto para a turma completar com lógica.",
    ],
  },
  Narrativa: {
    id: "Narrativa",
    disc: "LP",
    icon: BookMarked,
    cor: "violet",
    expectativa: "Identificar personagens, cenário, conflito e desfecho de uma história.",
    avaliar:
      "Depois de ler uma história, peça para recontar quem são os personagens e qual foi o problema/solução.",
    estrategias: [
      "Reconto oral estruturado (quem, onde, o que aconteceu, como terminou).",
      "Reorganizar cenas de uma história fora de ordem.",
      "Produção de uma história curta seguindo a mesma estrutura.",
    ],
  },
  "Variação e interlocução": {
    id: "Variação e interlocução",
    disc: "LP",
    icon: MessagesSquare,
    cor: "pink",
    expectativa:
      "Perceber que a linguagem muda conforme a situação e quem fala com quem (formal/informal).",
    avaliar:
      "Peça para reescrever a mesma mensagem para um amigo e para um adulto desconhecido, e compare.",
    estrategias: [
      "Comparar uma mensagem de WhatsApp com um bilhete formal.",
      "Dramatizações trocando o interlocutor (colega, professor, diretor).",
      "Identificar marcas de formalidade/informalidade em textos reais.",
    ],
  },

  // ───────────── Ciências ─────────────
  "Seres vivos": {
    id: "Seres vivos",
    disc: "CN",
    icon: Leaf,
    cor: "emerald",
    expectativa: "Reconhecer, comparar e classificar seres vivos por características observáveis.",
    avaliar:
      "Peça para agrupar imagens de animais/plantas por uma característica e explicar o critério usado.",
    estrategias: [
      "Observação direta de plantas e pequenos animais do entorno da escola.",
      "Classificar por características (tem pelo, voa, vive na água).",
      "Registro em desenho com legenda das características observadas.",
    ],
  },
  "Seres vivos e ambiente": {
    id: "Seres vivos e ambiente",
    disc: "CN",
    icon: TreePine,
    cor: "emerald",
    expectativa: "Entender como os seres vivos dependem do ambiente onde vivem para sobreviver.",
    avaliar:
      "Pergunte o que aconteceria com um animal se algo do ambiente dele mudasse (água, comida, abrigo).",
    estrategias: [
      "Saídas pelo entorno da escola observando plantas e animais no seu ambiente.",
      "Maquetes simples de um ambiente (horta, aquário, terrário).",
      "Discussão sobre cadeias alimentares simples.",
    ],
  },
  "Vida e evolução": {
    id: "Vida e evolução",
    disc: "CN",
    icon: Dna,
    cor: "lime",
    expectativa:
      "Reconhecer que os seres vivos nascem, crescem, se reproduzem e mudam ao longo do tempo.",
    avaliar:
      "Peça para ordenar imagens do ciclo de vida de uma planta ou animal (ex.: ovo → filhote → adulto).",
    estrategias: [
      "Acompanhar a germinação de uma semente em sala, com registro semanal.",
      "Sequenciar imagens do ciclo de vida de diferentes seres vivos.",
      "Comparar o próprio crescimento (fotos de bebê a hoje) como exemplo próximo.",
    ],
  },
  "Vida e ambiente": {
    id: "Vida e ambiente",
    disc: "CN",
    icon: Sprout,
    cor: "lime",
    expectativa: "Relacionar hábitos humanos com o impacto no ambiente e nos seres vivos ao redor.",
    avaliar:
      "Pergunte um exemplo de atitude que ajuda e uma que prejudica o ambiente da escola ou de casa.",
    estrategias: [
      "Horta ou canteiro na escola como laboratório vivo.",
      "Registro de hábitos sustentáveis observados em casa e na escola.",
      "Discussão de casos reais do bairro (lixo, água, áreas verdes).",
    ],
  },
  "Ambiente e sustentabilidade": {
    id: "Ambiente e sustentabilidade",
    disc: "CN",
    icon: Recycle,
    cor: "teal",
    expectativa: "Entender práticas de consumo consciente, reuso e reciclagem, e por que importam.",
    avaliar: "Peça para separar imagens de materiais em recicláveis/não recicláveis e justificar.",
    estrategias: [
      "Projetos de coleta seletiva e compostagem em sala.",
      "Reaproveitamento de materiais em atividades de arte.",
      "Leitura de rótulos e embalagens discutindo o destino do material.",
    ],
  },
  Sustentabilidade: {
    id: "Sustentabilidade",
    disc: "CN",
    icon: Globe2,
    cor: "teal",
    expectativa:
      "Compreender que recursos naturais são limitados e que hábitos coletivos fazem diferença.",
    avaliar:
      "Pergunte uma ação da turma que economiza um recurso (água, energia, papel) e por que ela ajuda.",
    estrategias: [
      "Campanhas simples da turma (economia de água, de papel).",
      "Gráficos de consumo feitos pela própria turma ao longo de uma semana.",
      "Discussão de reportagens ou vídeos curtos e acessíveis sobre o tema.",
    ],
  },
  "Matéria e energia": {
    id: "Matéria e energia",
    disc: "CN",
    icon: Zap,
    cor: "amber",
    expectativa:
      "Reconhecer estados físicos da matéria (sólido, líquido, gasoso) e transformações simples, como o ciclo da água.",
    avaliar:
      "Peça para explicar, com palavras próprias, o que acontece com a água quando ferve ou quando congela.",
    estrategias: [
      "Experimentos simples de observação (gelo derretendo, água fervendo com segurança).",
      "Registro em desenho e texto das transformações observadas.",
      "Relacionar o ciclo da água com o clima da própria região.",
    ],
  },
  "Materiais e objetos": {
    id: "Materiais e objetos",
    disc: "CN",
    icon: Package,
    cor: "orange",
    expectativa:
      "Reconhecer diferentes materiais (madeira, plástico, metal, vidro) e suas propriedades básicas.",
    avaliar:
      "Peça para agrupar objetos pelo material de que são feitos e dizer uma propriedade de cada grupo.",
    estrategias: [
      "Manusear objetos reais de materiais diferentes, comparando peso e textura.",
      "Testes simples (flutua/afunda, quebra/não quebra) com supervisão.",
      "Classificação de embalagens do dia a dia por tipo de material.",
    ],
  },
  "Terra e universo": {
    id: "Terra e universo",
    disc: "CN",
    icon: Orbit,
    cor: "indigo",
    expectativa:
      "Reconhecer fenômenos do dia e da noite, das estações, e noções básicas do sistema solar.",
    avaliar:
      "Pergunte por que existe dia e noite, ou o que muda de uma estação para outra na região.",
    estrategias: [
      "Observação do céu e do movimento da sombra ao longo do dia.",
      "Maquetes simples do movimento da Terra.",
      "Registro de mudanças do tempo/clima ao longo das semanas.",
    ],
  },
  "Corpo humano e saúde": {
    id: "Corpo humano e saúde",
    disc: "CN",
    icon: HeartPulse,
    cor: "rose",
    expectativa:
      "Reconhecer partes do corpo, seu funcionamento básico e hábitos que promovem a saúde.",
    avaliar:
      "Peça para nomear partes do corpo e explicar um hábito de higiene ou alimentação e por que ele ajuda.",
    estrategias: [
      "Projetos sobre alimentação e higiene envolvendo a família.",
      "Rotina de hábitos saudáveis registrada pela turma.",
      "Cartazes feitos pelos próprios alunos sobre cuidados com o corpo.",
    ],
  },
  "Saúde e microrganismos": {
    id: "Saúde e microrganismos",
    disc: "CN",
    icon: ShieldPlus,
    cor: "rose",
    expectativa:
      "Entender que microrganismos podem causar doenças e que hábitos de higiene ajudam a preveni-las.",
    avaliar: "Pergunte por que lavar as mãos antes de comer é importante.",
    estrategias: [
      "Demonstração prática de lavagem correta das mãos.",
      "Discussão de casos simples de prevenção (vacina, higiene, alimentação).",
      "Cartazes sobre cuidados de prevenção feitos pela turma.",
    ],
  },
  Microrganismos: {
    id: "Microrganismos",
    disc: "CN",
    icon: Microscope,
    cor: "rose",
    expectativa:
      "Reconhecer que existem seres vivos pequenos demais para ver a olho nu, e seu papel (bons e ruins).",
    avaliar:
      "Pergunte um exemplo de microrganismo útil (fermento) e um que pode causar doença, e a diferença entre eles.",
    estrategias: [
      "Observação de fermentação (pão, iogurte) como exemplo de microrganismo útil.",
      "Conversa sobre higiene ligada à prevenção de doenças.",
      "Imagens ampliadas (lupa, vídeos) para dar noção de escala.",
    ],
  },
};

/** Domínio de um descritor sem entrada no mapa (fallback defensivo). */
export const DOMINIO_PADRAO: Dominio = {
  id: "Geral",
  disc: "MAT",
  icon: Lightbulb,
  cor: "blue",
  expectativa: "Habilidade avaliada na diagnóstica desta série.",
  avaliar: "Observe o desempenho do aluno nesta habilidade nas atividades e na prova.",
  estrategias: [
    "Retomar com atividades práticas em pequenos grupos e revisar com exercícios curtos semanais.",
  ],
};
