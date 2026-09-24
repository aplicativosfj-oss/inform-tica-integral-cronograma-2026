/**
 * Dados do jogo "Operação: Plantão": personagens, missões e cenários.
 *
 * Os personagens são os agentes da equipe; cada um tem quatro atributos que
 * mudam de verdade o jogo (velocidade, força, agilidade e foco). As missões
 * combinam um cenário, um objetivo e uma dificuldade escolhida pelo jogador.
 */

export type PersonagemId = "valentao" | "franc" | "santos";
export type MissaoId = "cachorro" | "marmitas" | "breves" | "tarefas" | "moto" | "maratona";
export type Clima = "dia" | "por-do-sol" | "noite";
export type Nivel = 1 | 2 | 3;

export interface Atributos {
  velocidade: number;
  forca: number;
  agilidade: number;
  foco: number;
}

export interface Personagem {
  id: PersonagemId;
  nome: string;
  funcao: string;
  frase: string;
  /** Arquivos em /images/plantao/. */
  rosto: string;
  arte: string;
  /** Cores do uniforme, usadas para desenhar o corpo do personagem em jogo. */
  camisa: string;
  calca: string;
  bota: string;
  pele: string;
  cabelo: string;
  capacete: string;
  mochila: boolean;
  oculos: boolean;
  /** Personagem de blocos (mãos e pernas amarelas). */
  lego: boolean;
  atributos: Atributos;
  tracos: { nome: string; descricao: string }[];
}

export const PERSONAGENS: Personagem[] = [
  {
    id: "valentao",
    nome: "J. Valentão",
    funcao: "Agente Socioeducativo",
    frase: "Disciplina presente em ação.",
    rosto: "rosto-valentao.webp",
    arte: "arte-valentao.webp",
    camisa: "#1e2a6b",
    calca: "#c2a878",
    bota: "#141414",
    pele: "#e0ac86",
    cabelo: "#1a1410",
    capacete: "#1e2a6b",
    mochila: false,
    oculos: false,
    lego: false,
    atributos: { velocidade: 74, forca: 88, agilidade: 72, foco: 90 },
    tracos: [
      { nome: "Liderança", descricao: "Inspira a equipe e aumenta o foco em missões." },
      { nome: "Disciplina", descricao: "Reduz penalidades e aumenta a eficiência." },
      { nome: "Resistência", descricao: "Mantém a performance mesmo sob pressão." },
    ],
  },
  {
    id: "franc",
    nome: "Franc D'nis",
    funcao: "Agente Penitenciário",
    frase: "Mesma essência, novos destinos.",
    rosto: "rosto-franc.webp",
    arte: "arte-franc.webp",
    camisa: "#1b2559",
    calca: "#27406e",
    bota: "#111111",
    pele: "#c99372",
    cabelo: "#15100c",
    capacete: "#b91c1c",
    mochila: true,
    oculos: true,
    lego: false,
    atributos: { velocidade: 78, forca: 88, agilidade: 80, foco: 85 },
    tracos: [
      { nome: "Liderança", descricao: "Inspira a equipe e aumenta o foco em missões." },
      { nome: "Disciplina", descricao: "Reduz penalidades e aumenta a eficiência." },
      { nome: "Resiliência", descricao: "Mantém a performance mesmo sob pressão." },
    ],
  },
  {
    id: "santos",
    nome: "Seu Santos",
    funcao: "Agente Socioeducativo",
    frase: "Plano, disciplina e sempre com você.",
    rosto: "rosto-santos.webp",
    arte: "arte-santos.webp",
    camisa: "#161616",
    calca: "#b8974a",
    bota: "#2a2a2a",
    pele: "#f2c21a",
    cabelo: "#111111",
    capacete: "#eab308",
    mochila: false,
    oculos: false,
    lego: true,
    atributos: { velocidade: 82, forca: 70, agilidade: 86, foco: 78 },
    tracos: [
      { nome: "Planejamento", descricao: "Enxerga o melhor caminho antes de todo mundo." },
      { nome: "Ágil", descricao: "Muda de direção rápido e desvia de obstáculos." },
      { nome: "Sempre presente", descricao: "Ganha um fôlego extra nas corridas." },
    ],
  },
];

export const DIEGO = {
  nome: "Diego Rato",
  funcao: "Malfeitor",
  frase: "Sempre tentando escapar.",
  rosto: "rosto-diego.webp",
};

export interface Missao {
  id: MissaoId;
  titulo: string;
  local: string;
  resumo: string;
  tipo: "arena" | "moto" | "maratona";
  /** Miniatura do cenário (arquivo em /images/plantao/). */
  cenario: string;
  /** Tempo limite por nível, em segundos. */
  tempo: [number, number, number];
  /** Meta por nível: cachorros, marmitas, breves… */
  meta: [number, number, number];
  dica: string;
}

export const MISSOES: Missao[] = [
  {
    id: "cachorro",
    titulo: "Cachorro na Unidade",
    local: "Portão da Unidade Socioeducativa",
    resumo:
      "Um cachorro quer entrar na unidade! Corra atrás dele e pegue antes que passe pelo portão.",
    tipo: "arena",
    cenario: "cenario-unidade.webp",
    tempo: [80, 90, 100],
    meta: [1, 2, 3],
    dica: "Encurrale o cachorro nos cantos: ele foge de você, mas não sabe dobrar esquinas.",
  },
  {
    id: "marmitas",
    titulo: "Marmitas contra o Relógio",
    local: "Cozinha e blocos de alojamento",
    resumo: "Pegue as marmitas na cozinha e entregue nos blocos antes que o tempo acabe.",
    tipo: "arena",
    cenario: "cenario-cozinha.webp",
    tempo: [150, 140, 130],
    meta: [6, 8, 10],
    dica: "Carregue o máximo que aguentar por viagem, mas desvie do carrinho de limpeza!",
  },
  {
    id: "breves",
    titulo: "Breves na Administração",
    local: "Setor administrativo",
    resumo: "Recolha os breves nas mesas e leve todos à Coordenação. Cuidado com o corre-corre.",
    tipo: "arena",
    cenario: "cenario-externa.webp",
    tempo: [130, 120, 110],
    meta: [5, 6, 7],
    dica: "O cafezinho dá velocidade extra por alguns segundos.",
  },
  {
    id: "tarefas",
    titulo: "Tarefas do Plantão",
    local: "Portaria e área externa",
    resumo:
      "Rádio, cadeado, garrafa, chave e controle de segurança: cumpra tudo antes do fim do turno.",
    tipo: "arena",
    cenario: "cenario-prisional.webp",
    tempo: [220, 200, 180],
    meta: [5, 5, 5],
    dica: "Só dá para registrar a ocorrência depois de cumprir as outras tarefas.",
  },
  {
    id: "moto",
    titulo: "Corrida de Moto",
    local: "Orla, cidade e estradas",
    resumo: "Alcance o suspeito na moto! Desvie de obstáculos e pegue o turbo para ganhar terreno.",
    tipo: "moto",
    cenario: "cenario-cidade.webp",
    tempo: [90, 90, 90],
    meta: [1, 3, 5],
    dica: "As faixas azuis dão turbo. Poças de óleo fazem a moto derrapar.",
  },
  {
    id: "maratona",
    titulo: "Maratona do Plantão",
    local: "Beira do rio, cidade e eventos",
    resumo: "Corra a maratona! Troque de faixa, pule os cones e pegue água para manter o fôlego.",
    tipo: "maratona",
    cenario: "cenario-maratona.webp",
    tempo: [0, 0, 0],
    meta: [1200, 2200, 3600],
    dica: "Garrafas de água devolvem o fôlego. Sem fôlego, você desacelera.",
  },
];

export const NOMES_NIVEL = ["Fácil", "Normal", "Difícil"] as const;

export const CLIMAS: { id: Clima; nome: string; emoji: string }[] = [
  { id: "dia", nome: "Dia", emoji: "☀️" },
  { id: "por-do-sol", nome: "Pôr do sol", emoji: "🌇" },
  { id: "noite", nome: "Noite", emoji: "🌙" },
];

/** Cenários da maratona. */
export const CENARIOS_MARATONA = [
  { id: "rio", nome: "Beira do rio", arquivo: "cenario-rio.webp" },
  { id: "cidade", nome: "Cidade", arquivo: "cenario-cidade.webp" },
  { id: "rural", nome: "Zona rural", arquivo: "cenario-rural.webp" },
  { id: "evento", nome: "Evento", arquivo: "cenario-maratona.webp" },
] as const;
export type CenarioMaratona = (typeof CENARIOS_MARATONA)[number]["id"];

/** Pistas da corrida de moto (usam o motor de corrida já existente). */
export const PISTAS_MOTO = [
  { id: "praia", nome: "Orla", arquivo: "cenario-rio.webp" },
  { id: "cidade", nome: "Cidade", arquivo: "cenario-cidade.webp" },
  { id: "deserto", nome: "Zona rural", arquivo: "cenario-rural.webp" },
  { id: "montanha", nome: "Serra", arquivo: "cenario-externa.webp" },
] as const;
export type PistaMoto = (typeof PISTAS_MOTO)[number]["id"];

export const PASTA_IMG = "/images/plantao/";

/** Velocidade base do personagem em pixels por segundo. */
export function velocidadeDe(p: Personagem): number {
  return 175 + p.atributos.velocidade * 1.35;
}

/** Quantas marmitas o personagem carrega de uma vez. */
export function capacidadeDe(p: Personagem): number {
  return 3 + (p.atributos.forca >= 85 ? 1 : 0);
}

/** Segundos extras de tempo: o foco dá um respiro em toda missão. */
export function tempoExtraDe(p: Personagem): number {
  return Math.max(0, Math.round((p.atributos.foco - 70) * 0.5));
}

// ---------------------------------------------------------------- progresso

export interface Progresso {
  personagem: PersonagemId;
  missoes: Partial<Record<MissaoId, { estrelas: number; pontos: number }>>;
  somLigado: boolean;
  musicaLigada: boolean;
  botoesToque: boolean;
}

const CHAVE = "operacao-plantao:progresso";

export function lerProgresso(): Progresso {
  const padrao: Progresso = {
    personagem: "valentao",
    missoes: {},
    somLigado: true,
    musicaLigada: true,
    botoesToque: true,
  };
  if (typeof window === "undefined") return padrao;
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    return bruto ? { ...padrao, ...(JSON.parse(bruto) as Partial<Progresso>) } : padrao;
  } catch {
    return padrao;
  }
}

export function gravarProgresso(p: Progresso): void {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(p));
  } catch {
    // Sem storage: vale só nesta visita.
  }
}
