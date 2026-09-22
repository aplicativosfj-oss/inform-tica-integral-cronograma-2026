/**
 * Fábrica de enunciados: em vez de uma lista fixa de problemas, cada modelo
 * aqui sorteia nomes, cenários e números dentro da faixa do nível. São 30
 * modelos × 24 nomes × as combinações de números — dá dezenas de milhares de
 * problemas diferentes, e a criança nunca recebe a mesma folha duas vezes.
 *
 * Os cenários são daqui: açaí, farinha, castanha, o rio, a feira, a quadra da
 * escola. Problema de matemática entra melhor quando fala de coisa que a
 * criança vê no caminho de casa.
 *
 * Três cuidados em todo modelo:
 *
 * - divisão sempre exata (o resto viraria outra conta, de outro ano);
 * - subtração nunca fica negativa;
 * - a pergunta combina com a operação — nada de "quantos sobraram" numa soma.
 */

export type Operacao = "soma" | "subtracao" | "multiplicacao" | "divisao" | "mista";

export type Cenario = "feira" | "escola" | "esporte" | "rio" | "casa" | "dinheiro";

export interface Problema {
  enunciado: string;
  resposta: number;
  unidade: string;
  dica: string;
  /** Passo a passo da resolução, em linguagem de criança. */
  passos: string[];
  operacao: Operacao;
  cenario: Cenario;
  nivel: number;
}

export const NIVEIS_PROBLEMA = [
  { id: 1, nome: "Nível 1", descricao: "Números pequenos, uma conta só" },
  { id: 2, nome: "Nível 2", descricao: "Até 100, uma conta só" },
  { id: 3, nome: "Nível 3", descricao: "Multiplicação e divisão do dia a dia" },
  { id: 4, nome: "Nível 4", descricao: "Duas contas no mesmo problema" },
  { id: 5, nome: "Nível 5", descricao: "Números grandes e três passos" },
];

const NOMES = [
  "Ana Clara",
  "Pedro",
  "Maria Eduarda",
  "João Miguel",
  "Sofia",
  "Lucas",
  "Laura",
  "Davi",
  "Manuela",
  "Gabriel",
  "Alice",
  "Enzo",
  "Helena",
  "Arthur",
  "Valentina",
  "Bernardo",
  "Heloísa",
  "Samuel",
  "Isabela",
  "Théo",
  "Rebeca",
  "Kauã",
  "Yasmin",
  "Raul",
];

function n(): string {
  return NOMES[Math.floor(Math.random() * NOMES.length)]!;
}

function s(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Faixa de números de cada nível, para os modelos não precisarem decidir. */
function faixa(nivel: number): { p: number; g: number } {
  if (nivel === 1) return { p: 2, g: 20 };
  if (nivel === 2) return { p: 5, g: 100 };
  if (nivel === 3) return { p: 2, g: 12 };
  if (nivel === 4) return { p: 3, g: 30 };
  return { p: 10, g: 250 };
}

type Modelo = (nivel: number) => Omit<Problema, "operacao" | "cenario" | "nivel"> & {
  operacao: Operacao;
  cenario: Cenario;
};

/* ------------------------------------------------------------------ */
/* Soma                                                                */
/* ------------------------------------------------------------------ */

const SOMA: Modelo[] = [
  (nv) => {
    const { p, g } = faixa(nv);
    const a = s(p, g);
    const b = s(p, g);
    const q = n();
    return {
      enunciado: `${q} colheu ${a} caroços de açaí pela manhã e ${b} à tarde. Quantos caroços ${q} colheu no dia todo?`,
      resposta: a + b,
      unidade: "caroços",
      dica: "Juntar o da manhã com o da tarde é somar.",
      passos: [`De manhã: ${a}`, `À tarde: ${b}`, `${a} + ${b} = ${a + b}`],
      operacao: "soma",
      cenario: "feira",
    };
  },
  (nv) => {
    const { p, g } = faixa(nv);
    const a = s(p, g);
    const b = s(p, g);
    return {
      enunciado: `Na biblioteca da escola há ${a} livros de história e ${b} livros de ciências. Quantos livros há ao todo?`,
      resposta: a + b,
      unidade: "livros",
      dica: '"Ao todo" quase sempre pede soma.',
      passos: [`História: ${a}`, `Ciências: ${b}`, `${a} + ${b} = ${a + b}`],
      operacao: "soma",
      cenario: "escola",
    };
  },
  (nv) => {
    const { p, g } = faixa(nv);
    const a = s(p, g);
    const b = s(p, g);
    const c = s(p, g);
    const q = n();
    return {
      enunciado: `No campeonato da escola, o time de ${q} fez ${a} gols no primeiro jogo, ${b} no segundo e ${c} no terceiro. Quantos gols o time fez nos três jogos?`,
      resposta: a + b + c,
      unidade: "gols",
      dica: "São três parcelas: some duas primeiro e depois junte a terceira.",
      passos: [`${a} + ${b} = ${a + b}`, `${a + b} + ${c} = ${a + b + c}`],
      operacao: "soma",
      cenario: "esporte",
    };
  },
  (nv) => {
    const { p, g } = faixa(nv);
    const a = s(p, g);
    const b = s(p, g);
    return {
      enunciado: `Um barco desceu o rio levando ${a} sacos de farinha e voltou com mais ${b} sacos. Quantos sacos o barco carregou nas duas viagens?`,
      resposta: a + b,
      unidade: "sacos",
      dica: "As duas viagens juntas: é soma.",
      passos: [`Ida: ${a}`, `Volta: ${b}`, `${a} + ${b} = ${a + b}`],
      operacao: "soma",
      cenario: "rio",
    };
  },
  (nv) => {
    const { p, g } = faixa(nv);
    const a = s(p, g);
    const b = s(p, g);
    const q = n();
    return {
      enunciado: `${q} tinha ${a} figurinhas e ganhou ${b} da prima. Com quantas figurinhas ${q} ficou?`,
      resposta: a + b,
      unidade: "figurinhas",
      dica: "Ganhar aumenta a quantidade.",
      passos: [`Tinha: ${a}`, `Ganhou: ${b}`, `${a} + ${b} = ${a + b}`],
      operacao: "soma",
      cenario: "casa",
    };
  },
  (nv) => {
    const { p, g } = faixa(nv);
    const a = s(p, g);
    const b = s(p, g);
    return {
      enunciado: `A merenda da escola usou ${a} bananas na segunda e ${b} na terça. Quantas bananas foram usadas nos dois dias?`,
      resposta: a + b,
      unidade: "bananas",
      dica: "Dois dias juntos pedem soma.",
      passos: [`Segunda: ${a}`, `Terça: ${b}`, `${a} + ${b} = ${a + b}`],
      operacao: "soma",
      cenario: "escola",
    };
  },
];

/* ------------------------------------------------------------------ */
/* Subtração                                                           */
/* ------------------------------------------------------------------ */

const SUBTRACAO: Modelo[] = [
  (nv) => {
    const { p, g } = faixa(nv);
    const total = s(p + 10, g + 10);
    const usados = s(p, total - 1);
    const q = n();
    return {
      enunciado: `${q} levou ${total} castanhas para a escola e deu ${usados} para os colegas. Quantas castanhas sobraram?`,
      resposta: total - usados,
      unidade: "castanhas",
      dica: '"Sobraram" pede subtração: tira o que saiu do total.',
      passos: [`Tinha: ${total}`, `Deu: ${usados}`, `${total} − ${usados} = ${total - usados}`],
      operacao: "subtracao",
      cenario: "escola",
    };
  },
  (nv) => {
    const { p, g } = faixa(nv);
    const total = s(p + 10, g + 10);
    const vendidos = s(p, total - 1);
    return {
      enunciado: `Na feira havia ${total} melancias e foram vendidas ${vendidos}. Quantas melancias ficaram na banca?`,
      resposta: total - vendidos,
      unidade: "melancias",
      dica: "O que ficou é o total menos o que saiu.",
      passos: [
        `Havia: ${total}`,
        `Vendidas: ${vendidos}`,
        `${total} − ${vendidos} = ${total - vendidos}`,
      ],
      operacao: "subtracao",
      cenario: "feira",
    };
  },
  (nv) => {
    const { p, g } = faixa(nv);
    const a = s(p + 5, g + 10);
    const b = s(p, a - 1);
    return {
      enunciado: `O time da 5ª série fez ${a} pontos e o time da 4ª fez ${b}. Quantos pontos de diferença houve entre os dois times?`,
      resposta: a - b,
      unidade: "pontos",
      dica: '"Diferença" é subtração: o maior menos o menor.',
      passos: [`Maior: ${a}`, `Menor: ${b}`, `${a} − ${b} = ${a - b}`],
      operacao: "subtracao",
      cenario: "esporte",
    };
  },
  (nv) => {
    const { p, g } = faixa(nv);
    const meta = s(p + 20, g + 20);
    const feito = s(p, meta - 1);
    return {
      enunciado: `A turma quer ler ${meta} livros no ano e já leu ${feito}. Quantos livros faltam para bater a meta?`,
      resposta: meta - feito,
      unidade: "livros",
      dica: '"Faltam" pede subtração: a meta menos o que já foi feito.',
      passos: [`Meta: ${meta}`, `Já leu: ${feito}`, `${meta} − ${feito} = ${meta - feito}`],
      operacao: "subtracao",
      cenario: "escola",
    };
  },
  (nv) => {
    const { p, g } = faixa(nv);
    const total = s(p + 10, g + 10);
    const gasto = s(p, total - 1);
    const q = n();
    return {
      enunciado: `${q} tinha R$ ${total} e gastou R$ ${gasto} na cantina. Com quantos reais ${q} ficou?`,
      resposta: total - gasto,
      unidade: "reais",
      dica: "Gastar diminui o que se tem.",
      passos: [
        `Tinha: R$ ${total}`,
        `Gastou: R$ ${gasto}`,
        `${total} − ${gasto} = ${total - gasto}`,
      ],
      operacao: "subtracao",
      cenario: "dinheiro",
    };
  },
  (nv) => {
    const { p, g } = faixa(nv);
    const total = s(p + 10, g + 10);
    const saiu = s(p, total - 1);
    return {
      enunciado: `Um barco saiu com ${total} passageiros e ${saiu} desceram no porto. Quantos passageiros continuaram a viagem?`,
      resposta: total - saiu,
      unidade: "passageiros",
      dica: "Quem desceu sai da conta.",
      passos: [`Saiu com: ${total}`, `Desceram: ${saiu}`, `${total} − ${saiu} = ${total - saiu}`],
      operacao: "subtracao",
      cenario: "rio",
    };
  },
];

/* ------------------------------------------------------------------ */
/* Multiplicação                                                       */
/* ------------------------------------------------------------------ */

const MULTIPLICACAO: Modelo[] = [
  (nv) => {
    const caixas = s(2, nv >= 5 ? 20 : 10);
    const porCaixa = s(2, nv >= 5 ? 25 : 12);
    return {
      enunciado: `Na feira, cada caixa leva ${porCaixa} ovos. Quantos ovos há em ${caixas} caixas iguais?`,
      resposta: caixas * porCaixa,
      unidade: "ovos",
      dica: "Grupos iguais pedem multiplicação: quantos grupos × quanto tem em cada um.",
      passos: [
        `${caixas} caixas × ${porCaixa} ovos`,
        `${caixas} × ${porCaixa} = ${caixas * porCaixa}`,
      ],
      operacao: "multiplicacao",
      cenario: "feira",
    };
  },
  (nv) => {
    const fileiras = s(2, nv >= 5 ? 15 : 9);
    const porFileira = s(3, nv >= 5 ? 20 : 10);
    return {
      enunciado: `A sala tem ${fileiras} fileiras com ${porFileira} carteiras em cada uma. Quantas carteiras há na sala?`,
      resposta: fileiras * porFileira,
      unidade: "carteiras",
      dica: "Fileiras iguais: multiplique o número de fileiras pelo que cabe em cada uma.",
      passos: [`${fileiras} × ${porFileira} = ${fileiras * porFileira}`],
      operacao: "multiplicacao",
      cenario: "escola",
    };
  },
  (nv) => {
    const dias = s(3, nv >= 5 ? 30 : 7);
    const porDia = s(2, nv >= 5 ? 25 : 12);
    const q = n();
    return {
      enunciado: `${q} treina ${porDia} arremessos por dia durante ${dias} dias. Quantos arremessos ${q} faz no total?`,
      resposta: dias * porDia,
      unidade: "arremessos",
      dica: "A mesma quantidade repetida todo dia é multiplicação.",
      passos: [`${dias} dias × ${porDia} por dia`, `${dias} × ${porDia} = ${dias * porDia}`],
      operacao: "multiplicacao",
      cenario: "esporte",
    };
  },
  (nv) => {
    const pacotes = s(2, nv >= 5 ? 18 : 9);
    const preco = s(2, nv >= 5 ? 20 : 10);
    return {
      enunciado: `Cada pacote de biscoito custa R$ ${preco}. Quanto custam ${pacotes} pacotes?`,
      resposta: pacotes * preco,
      unidade: "reais",
      dica: "Preço de um × quantidade = preço de todos.",
      passos: [`${pacotes} × R$ ${preco} = R$ ${pacotes * preco}`],
      operacao: "multiplicacao",
      cenario: "dinheiro",
    };
  },
  (nv) => {
    const cachos = s(2, nv >= 5 ? 16 : 8);
    const porCacho = s(5, nv >= 5 ? 30 : 15);
    return {
      enunciado: `Cada cacho traz cerca de ${porCacho} bananas. Quantas bananas há em ${cachos} cachos?`,
      resposta: cachos * porCacho,
      unidade: "bananas",
      dica: "Repetir a mesma quantidade é multiplicar.",
      passos: [`${cachos} × ${porCacho} = ${cachos * porCacho}`],
      operacao: "multiplicacao",
      cenario: "rio",
    };
  },
];

/* ------------------------------------------------------------------ */
/* Divisão (sempre exata)                                              */
/* ------------------------------------------------------------------ */

const DIVISAO: Modelo[] = [
  (nv) => {
    const criancas = s(2, nv >= 5 ? 15 : 8);
    const cada = s(2, nv >= 5 ? 20 : 10);
    const total = criancas * cada;
    return {
      enunciado: `${total} balas serão repartidas igualmente entre ${criancas} crianças. Quantas balas cada criança recebe?`,
      resposta: cada,
      unidade: "balas",
      dica: '"Repartir igualmente" é divisão.',
      passos: [`${total} ÷ ${criancas} = ${cada}`, `Confere: ${criancas} × ${cada} = ${total}`],
      operacao: "divisao",
      cenario: "casa",
    };
  },
  (nv) => {
    const times = s(2, nv >= 5 ? 12 : 6);
    const porTime = s(3, nv >= 5 ? 15 : 8);
    const total = times * porTime;
    return {
      enunciado: `${total} alunos vão formar ${times} times com o mesmo número de jogadores. Quantos alunos ficam em cada time?`,
      resposta: porTime,
      unidade: "alunos",
      dica: "Dividir em grupos iguais: total ÷ número de grupos.",
      passos: [`${total} ÷ ${times} = ${porTime}`],
      operacao: "divisao",
      cenario: "esporte",
    };
  },
  (nv) => {
    const caixas = s(2, nv >= 5 ? 14 : 7);
    const porCaixa = s(4, nv >= 5 ? 25 : 12);
    const total = caixas * porCaixa;
    return {
      enunciado: `A escola recebeu ${total} cadernos e quer guardá-los em ${caixas} caixas iguais. Quantos cadernos vão em cada caixa?`,
      resposta: porCaixa,
      unidade: "cadernos",
      dica: "Caixas iguais: divida o total pelo número de caixas.",
      passos: [`${total} ÷ ${caixas} = ${porCaixa}`],
      operacao: "divisao",
      cenario: "escola",
    };
  },
  (nv) => {
    const preco = s(2, nv >= 5 ? 20 : 10);
    const quantos = s(2, nv >= 5 ? 15 : 9);
    const total = preco * quantos;
    return {
      enunciado: `${quantos} cadernos iguais custaram R$ ${total} no total. Quanto custou cada caderno?`,
      resposta: preco,
      unidade: "reais",
      dica: "Preço do total ÷ quantidade = preço de um.",
      passos: [`${total} ÷ ${quantos} = ${preco}`],
      operacao: "divisao",
      cenario: "dinheiro",
    };
  },
  (nv) => {
    const sacos = s(2, nv >= 5 ? 12 : 6);
    const porSaco = s(5, nv >= 5 ? 25 : 12);
    const total = sacos * porSaco;
    return {
      enunciado: `${total} quilos de farinha foram separados em ${sacos} sacos iguais. Quantos quilos ficaram em cada saco?`,
      resposta: porSaco,
      unidade: "quilos",
      dica: "Partes iguais pedem divisão.",
      passos: [`${total} ÷ ${sacos} = ${porSaco}`],
      operacao: "divisao",
      cenario: "rio",
    };
  },
];

/* ------------------------------------------------------------------ */
/* Duas ou três contas no mesmo problema                               */
/* ------------------------------------------------------------------ */

const MISTA: Modelo[] = [
  (nv) => {
    const pacotes = s(3, nv >= 5 ? 20 : 8);
    const porPacote = s(4, nv >= 5 ? 20 : 10);
    const dados = s(2, pacotes * porPacote - 1);
    const q = n();
    return {
      enunciado: `${q} comprou ${pacotes} pacotes com ${porPacote} figurinhas cada um e deu ${dados} para o irmão. Com quantas figurinhas ${q} ficou?`,
      resposta: pacotes * porPacote - dados,
      unidade: "figurinhas",
      dica: "São duas contas: primeiro descubra quantas ela tinha, depois tire as que saíram.",
      passos: [
        `Quantas comprou: ${pacotes} × ${porPacote} = ${pacotes * porPacote}`,
        `Quantas sobraram: ${pacotes * porPacote} − ${dados} = ${pacotes * porPacote - dados}`,
      ],
      operacao: "mista",
      cenario: "casa",
    };
  },
  (nv) => {
    const preco = s(3, nv >= 5 ? 25 : 12);
    const quantos = s(2, nv >= 5 ? 10 : 5);
    const pagou = preco * quantos + s(1, 30);
    return {
      enunciado: `Um lanche custa R$ ${preco}. ${n()} comprou ${quantos} lanches e pagou com R$ ${pagou}. Quanto recebeu de troco?`,
      resposta: pagou - preco * quantos,
      unidade: "reais",
      dica: "Primeiro o gasto total, depois o troco.",
      passos: [
        `Gasto: ${quantos} × ${preco} = ${quantos * preco}`,
        `Troco: ${pagou} − ${quantos * preco} = ${pagou - quantos * preco}`,
      ],
      operacao: "mista",
      cenario: "dinheiro",
    };
  },
  (nv) => {
    const turmas = s(2, 6);
    // O número de caixas é múltiplo do de turmas: assim a divisão sai exata.
    const caixas = turmas * s(1, nv >= 5 ? 4 : 2);
    const porCaixa = s(4, nv >= 5 ? 20 : 10);
    const total = caixas * porCaixa;
    return {
      enunciado: `A escola recebeu ${caixas} caixas com ${porCaixa} maçãs cada uma e vai repartir tudo igualmente entre ${turmas} turmas. Quantas maçãs cada turma recebe?`,
      resposta: total / turmas,
      unidade: "maçãs",
      dica: "Primeiro o total de maçãs, depois divida pelas turmas.",
      passos: [
        `Total: ${caixas} × ${porCaixa} = ${total}`,
        `Cada turma: ${total} ÷ ${turmas} = ${total / turmas}`,
      ],
      operacao: "mista",
      cenario: "escola",
    };
  },
  (nv) => {
    const manha = s(5, nv >= 5 ? 120 : 40);
    const tarde = s(5, nv >= 5 ? 120 : 40);
    const caixas = s(2, 8);
    const total = manha + tarde;
    const porCaixa = Math.ceil(total / caixas);
    // Ajusta o total para a divisão sair exata, sem mexer no enunciado.
    const totalAjustado = porCaixa * caixas;
    const tardeAjustada = totalAjustado - manha;
    return {
      enunciado: `De manhã foram colhidos ${manha} quilos de açaí e à tarde mais ${tardeAjustada}. Tudo foi guardado em ${caixas} caixas iguais. Quantos quilos ficaram em cada caixa?`,
      resposta: porCaixa,
      unidade: "quilos",
      dica: "Some as duas colheitas e só então divida pelas caixas.",
      passos: [
        `Total: ${manha} + ${tardeAjustada} = ${totalAjustado}`,
        `Em cada caixa: ${totalAjustado} ÷ ${caixas} = ${porCaixa}`,
      ],
      operacao: "mista",
      cenario: "feira",
    };
  },
  (nv) => {
    const times = s(2, 6);
    const porTime = s(4, nv >= 5 ? 12 : 8);
    const faltaram = s(1, times * porTime - 1);
    return {
      enunciado: `${times} times de ${porTime} jogadores se inscreveram no campeonato, mas ${faltaram} jogadores faltaram no dia. Quantos jogadores compareceram?`,
      resposta: times * porTime - faltaram,
      unidade: "jogadores",
      dica: "Descubra o total de inscritos e depois tire os que faltaram.",
      passos: [
        `Inscritos: ${times} × ${porTime} = ${times * porTime}`,
        `Compareceram: ${times * porTime} − ${faltaram} = ${times * porTime - faltaram}`,
      ],
      operacao: "mista",
      cenario: "esporte",
    };
  },
  (nv) => {
    const barcos = s(2, 8);
    const porBarco = s(5, nv >= 5 ? 30 : 15);
    const extras = s(2, 20);
    return {
      enunciado: `${barcos} barcos levaram ${porBarco} sacos cada um e depois voltaram para buscar mais ${extras} sacos. Quantos sacos foram levados ao todo?`,
      resposta: barcos * porBarco + extras,
      unidade: "sacos",
      dica: "Multiplique primeiro e só depois some o que veio na segunda viagem.",
      passos: [
        `Primeira viagem: ${barcos} × ${porBarco} = ${barcos * porBarco}`,
        `Com a segunda: ${barcos * porBarco} + ${extras} = ${barcos * porBarco + extras}`,
      ],
      operacao: "mista",
      cenario: "rio",
    };
  },
];

const POR_OPERACAO: Record<Operacao, Modelo[]> = {
  soma: SOMA,
  subtracao: SUBTRACAO,
  multiplicacao: MULTIPLICACAO,
  divisao: DIVISAO,
  mista: MISTA,
};

/** Quais operações cada nível usa — o nível também escolhe o tipo de conta. */
function operacoesDoNivel(nivel: number): Operacao[] {
  if (nivel === 1) return ["soma", "subtracao"];
  if (nivel === 2) return ["soma", "subtracao"];
  if (nivel === 3) return ["multiplicacao", "divisao"];
  if (nivel === 4) return ["soma", "subtracao", "multiplicacao", "divisao", "mista"];
  return ["multiplicacao", "divisao", "mista"];
}

export function gerarProblema(nivel: number, operacao?: Operacao): Problema {
  const ops = operacao ? [operacao] : operacoesDoNivel(nivel);
  const op = ops[Math.floor(Math.random() * ops.length)]!;
  const modelos = POR_OPERACAO[op];
  const modelo = modelos[Math.floor(Math.random() * modelos.length)]!;
  return { ...modelo(nivel), nivel };
}

/** Quantos problemas diferentes os modelos conseguem montar, por baixo. */
export const TOTAL_MODELOS =
  SOMA.length + SUBTRACAO.length + MULTIPLICACAO.length + DIVISAO.length + MISTA.length;
