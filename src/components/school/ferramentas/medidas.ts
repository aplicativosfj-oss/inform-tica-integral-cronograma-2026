/**
 * As três famílias de medidas do Fundamental I — comprimento, capacidade e
 * massa — com a mesma escadinha de dez em dez. É de propósito que estejam no
 * mesmo arquivo e com a mesma forma: o que a criança aprende numa (descer um
 * degrau é multiplicar por 10) vale igualzinho nas outras duas.
 */

export type Familia = "comprimento" | "capacidade" | "massa";

export interface Unidade {
  /** Símbolo como se escreve: km, mL, kg… */
  simbolo: string;
  nome: string;
  /** Quantas unidades-base valem 1 desta. O metro, o litro e o grama valem 1. */
  fator: number;
}

export interface FamiliaInfo {
  id: Familia;
  nome: string;
  pergunta: string;
  base: string;
  unidades: Unidade[];
}

export const FAMILIAS: FamiliaInfo[] = [
  {
    id: "comprimento",
    nome: "Comprimento",
    pergunta: "Mede o tamanho das coisas: altura, largura, distância.",
    base: "m",
    unidades: [
      { simbolo: "km", nome: "quilômetro", fator: 1000 },
      { simbolo: "hm", nome: "hectômetro", fator: 100 },
      { simbolo: "dam", nome: "decâmetro", fator: 10 },
      { simbolo: "m", nome: "metro", fator: 1 },
      { simbolo: "dm", nome: "decímetro", fator: 0.1 },
      { simbolo: "cm", nome: "centímetro", fator: 0.01 },
      { simbolo: "mm", nome: "milímetro", fator: 0.001 },
    ],
  },
  {
    id: "capacidade",
    nome: "Capacidade",
    pergunta: "Mede o quanto cabe dentro: água, suco, leite.",
    base: "L",
    unidades: [
      { simbolo: "kL", nome: "quilolitro", fator: 1000 },
      { simbolo: "hL", nome: "hectolitro", fator: 100 },
      { simbolo: "daL", nome: "decalitro", fator: 10 },
      { simbolo: "L", nome: "litro", fator: 1 },
      { simbolo: "dL", nome: "decilitro", fator: 0.1 },
      { simbolo: "cL", nome: "centilitro", fator: 0.01 },
      { simbolo: "mL", nome: "mililitro", fator: 0.001 },
    ],
  },
  {
    id: "massa",
    nome: "Massa",
    pergunta: "Mede o quanto pesa: farinha, arroz, a própria criança.",
    base: "g",
    unidades: [
      { simbolo: "kg", nome: "quilograma", fator: 1000 },
      { simbolo: "hg", nome: "hectograma", fator: 100 },
      { simbolo: "dag", nome: "decagrama", fator: 10 },
      { simbolo: "g", nome: "grama", fator: 1 },
      { simbolo: "dg", nome: "decigrama", fator: 0.1 },
      { simbolo: "cg", nome: "centigrama", fator: 0.01 },
      { simbolo: "mg", nome: "miligrama", fator: 0.001 },
    ],
  },
];

export function familia(id: Familia): FamiliaInfo {
  return FAMILIAS.find((f) => f.id === id)!;
}

export function converter(valor: number, de: Unidade, para: Unidade): number {
  // Arredonda no fim para não carregar o lixo de vírgula flutuante
  // (0,1 × 3 = 0,30000000000000004 assustaria qualquer criança).
  const bruto = (valor * de.fator) / para.fator;
  return Math.round(bruto * 1e9) / 1e9;
}

/** Quantos degraus da escada separam duas unidades (negativo = subir). */
export function degraus(de: Unidade, para: Unidade): number {
  return Math.round(Math.log10(de.fator / para.fator));
}

/** Número legível: sem notação científica e sem zeros pendurados. */
export function formatar(v: number): string {
  if (!Number.isFinite(v)) return "—";
  if (v !== 0 && Math.abs(v) < 0.000001) return v.toExponential(2).replace(".", ",");
  return v.toLocaleString("pt-BR", { maximumFractionDigits: 9 });
}

/* ------------------------------------------------------------------ */
/* Referências do mundo real                                           */
/* ------------------------------------------------------------------ */

export type Objeto =
  | "moeda"
  | "borracha"
  | "caderno"
  | "porta"
  | "quadra"
  | "quarteirao"
  | "gota"
  | "colher"
  | "copo"
  | "garrafa"
  | "balde"
  | "caixadagua"
  | "clipe"
  | "pacotearroz"
  | "melancia"
  | "crianca";

export interface Referencia {
  objeto: Objeto;
  nome: string;
  familia: Familia;
  /** Medida na unidade-base (m, L ou g). */
  valor: number;
  /** Como a escola costuma dizer essa medida. */
  comoSeFala: string;
  /** Unidade que a criança deve escolher no jogo. */
  unidadeCerta: string;
  /** As outras opções do jogo, todas erradas de propósito. */
  opcoesErradas: string[];
}

export const REFERENCIAS: Referencia[] = [
  {
    objeto: "moeda",
    nome: "A espessura de uma moeda",
    familia: "comprimento",
    valor: 0.002,
    comoSeFala: "2 mm",
    unidadeCerta: "mm",
    opcoesErradas: ["m", "km"],
  },
  {
    objeto: "borracha",
    nome: "Uma borracha de apagar",
    familia: "comprimento",
    valor: 0.04,
    comoSeFala: "4 cm",
    unidadeCerta: "cm",
    opcoesErradas: ["m", "km"],
  },
  {
    objeto: "caderno",
    nome: "A altura de um caderno",
    familia: "comprimento",
    valor: 0.3,
    comoSeFala: "30 cm",
    unidadeCerta: "cm",
    opcoesErradas: ["mm", "km"],
  },
  {
    objeto: "porta",
    nome: "Uma porta da escola",
    familia: "comprimento",
    valor: 2,
    comoSeFala: "2 m",
    unidadeCerta: "m",
    opcoesErradas: ["cm", "km"],
  },
  {
    objeto: "quadra",
    nome: "A quadra da escola",
    familia: "comprimento",
    valor: 28,
    comoSeFala: "28 m",
    unidadeCerta: "m",
    opcoesErradas: ["mm", "km"],
  },
  {
    objeto: "quarteirao",
    nome: "Da escola até a praça",
    familia: "comprimento",
    valor: 1500,
    comoSeFala: "1,5 km",
    unidadeCerta: "km",
    opcoesErradas: ["cm", "mm"],
  },
  {
    objeto: "gota",
    nome: "Uma gota de remédio",
    familia: "capacidade",
    valor: 0.00005,
    comoSeFala: "0,05 mL",
    unidadeCerta: "mL",
    opcoesErradas: ["L", "kL"],
  },
  {
    objeto: "colher",
    nome: "Uma colher de sopa",
    familia: "capacidade",
    valor: 0.015,
    comoSeFala: "15 mL",
    unidadeCerta: "mL",
    opcoesErradas: ["L", "kL"],
  },
  {
    objeto: "copo",
    nome: "Um copo de suco",
    familia: "capacidade",
    valor: 0.25,
    comoSeFala: "250 mL",
    unidadeCerta: "mL",
    opcoesErradas: ["kL", "hL"],
  },
  {
    objeto: "garrafa",
    nome: "Uma garrafa de refrigerante",
    familia: "capacidade",
    valor: 2,
    comoSeFala: "2 L",
    unidadeCerta: "L",
    opcoesErradas: ["mL", "kL"],
  },
  {
    objeto: "balde",
    nome: "Um balde cheio",
    familia: "capacidade",
    valor: 12,
    comoSeFala: "12 L",
    unidadeCerta: "L",
    opcoesErradas: ["mL", "kL"],
  },
  {
    objeto: "caixadagua",
    nome: "A caixa d'água da escola",
    familia: "capacidade",
    valor: 1000,
    comoSeFala: "1 kL, ou 1000 L",
    unidadeCerta: "kL",
    opcoesErradas: ["mL", "cL"],
  },
  {
    objeto: "clipe",
    nome: "Um clipe de papel",
    familia: "massa",
    valor: 1,
    comoSeFala: "1 g",
    unidadeCerta: "g",
    opcoesErradas: ["kg", "hg"],
  },
  {
    objeto: "pacotearroz",
    nome: "Um pacote de arroz",
    familia: "massa",
    valor: 5000,
    comoSeFala: "5 kg",
    unidadeCerta: "kg",
    opcoesErradas: ["g", "mg"],
  },
  {
    objeto: "melancia",
    nome: "Uma melancia",
    familia: "massa",
    valor: 8000,
    comoSeFala: "8 kg",
    unidadeCerta: "kg",
    opcoesErradas: ["g", "mg"],
  },
  {
    objeto: "crianca",
    nome: "Uma criança de 8 anos",
    familia: "massa",
    valor: 27000,
    comoSeFala: "27 kg",
    unidadeCerta: "kg",
    opcoesErradas: ["g", "mg"],
  },
];

/* ------------------------------------------------------------------ */
/* Situações prontas                                                   */
/* ------------------------------------------------------------------ */

export interface Situacao {
  familia: Familia;
  /** O que a criança quer descobrir, em uma frase. */
  pergunta: string;
  valor: number;
  de: string;
  para: string;
  objeto: Objeto;
  /** Por que essa conversão aparece na vida real. */
  porque: string;
}

/**
 * As conversões que aparecem de verdade — na receita, na farmácia, na
 * estrada, no mercado. Servem de atalho e, principalmente, mostram para que
 * serve converter: ninguém converte por esporte.
 */
export const SITUACOES: Situacao[] = [
  {
    familia: "comprimento",
    pergunta: "Quantos centímetros tem a porta da sala?",
    valor: 2,
    de: "m",
    para: "cm",
    objeto: "porta",
    porque: "A fita métrica marca em centímetros, mas a gente fala em metros.",
  },
  {
    familia: "comprimento",
    pergunta: "Quantos metros tem da escola até a praça?",
    valor: 1.5,
    de: "km",
    para: "m",
    objeto: "quarteirao",
    porque: "A placa da estrada fala em quilômetro; o passo da gente conta metro.",
  },
  {
    familia: "comprimento",
    pergunta: "Quantos milímetros tem uma borracha de 4 cm?",
    valor: 4,
    de: "cm",
    para: "mm",
    objeto: "borracha",
    porque: "A régua tem os dois: os números grandes são cm e os risquinhos, mm.",
  },
  {
    familia: "capacidade",
    pergunta: "Quantos mililitros tem uma garrafa de 2 litros?",
    valor: 2,
    de: "L",
    para: "mL",
    objeto: "garrafa",
    porque: "O rótulo diz 2 L, mas a receita pede em mL.",
  },
  {
    familia: "capacidade",
    pergunta: "Quantos litros são 250 mL de suco?",
    valor: 250,
    de: "mL",
    para: "L",
    objeto: "copo",
    porque: "Para saber quantos copos saem de uma garrafa.",
  },
  {
    familia: "capacidade",
    pergunta: "Quantos litros cabem na caixa d'água de 1 kL?",
    valor: 1,
    de: "kL",
    para: "L",
    objeto: "caixadagua",
    porque: "A caixa vem marcada em litros, e a conta da água, em metros cúbicos.",
  },
  {
    familia: "massa",
    pergunta: "Quantos gramas tem um pacote de 5 kg de arroz?",
    valor: 5,
    de: "kg",
    para: "g",
    objeto: "pacotearroz",
    porque: "A balança do mercado mostra gramas.",
  },
  {
    familia: "massa",
    pergunta: "Quantos quilos tem uma melancia de 8000 g?",
    valor: 8000,
    de: "g",
    para: "kg",
    objeto: "melancia",
    porque: "Ninguém diz que a melancia tem oito mil gramas.",
  },
  {
    familia: "massa",
    pergunta: "Quantos miligramas tem um clipe de 1 g?",
    valor: 1,
    de: "g",
    para: "mg",
    objeto: "clipe",
    porque: "A bula do remédio fala em miligramas.",
  },
];

export function situacoesDe(f: Familia): Situacao[] {
  return SITUACOES.filter((s) => s.familia === f);
}

/**
 * O objeto do mundo real mais perto de um valor — o que dá tamanho ao número.
 * "300 cm" não diz nada; "mais ou menos como a quadra da escola" diz.
 */
export function referenciaMaisProxima(valorBase: number, f: Familia): Referencia | null {
  const candidatos = REFERENCIAS.filter((r) => r.familia === f);
  if (!candidatos.length || valorBase <= 0) return null;
  return candidatos.reduce((melhor, r) =>
    Math.abs(Math.log10(r.valor / valorBase)) < Math.abs(Math.log10(melhor.valor / valorBase))
      ? r
      : melhor,
  );
}
