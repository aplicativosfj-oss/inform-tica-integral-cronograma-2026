/**
 * Motor do jogo de corrida: pista em pseudo-3D desenhada num <canvas>.
 *
 * A técnica é a clássica dos jogos de arcade (OutRun): a pista é uma lista de
 * "segmentos" de 200 unidades cada um, e a cada quadro projetamos os cerca de
 * cem segmentos à frente da câmera de trás para a frente. Curva é só um
 * deslocamento lateral acumulado; morro é a altura de cada segmento. Não há
 * geometria 3D de verdade — por isso roda liso até em computador de escola.
 *
 * O motor não conhece React: recebe teclas/toques por `entrada` e avisa a
 * interface (posição, volta, velocidade, fim) por callbacks.
 */

import {
  desenharAcabamento,
  desenharCeu,
  desenharFundo,
  desenharNevoa,
  desenharObjeto,
  misturar,
  type TipoObjeto,
  type VisualCenario,
} from "@/components/school/jogos/corrida-cenario";
import type { SomCorrida } from "@/components/school/jogos/corrida-som";

export type IdPista = "cidade" | "montanha" | "praia" | "deserto" | "neve";

export interface CarroInfo {
  id: string;
  nome: string;
  cor: string;
}

export const CARROS: CarroInfo[] = [
  { id: "vermelho", nome: "Carro 1", cor: "#e11d2e" },
  { id: "azul", nome: "Carro 2", cor: "#2563eb" },
  { id: "amarelo", nome: "Carro 3", cor: "#facc15" },
  { id: "preto", nome: "Carro 4", cor: "#1f2937" },
  { id: "branco", nome: "Carro 5", cor: "#e5e7eb" },
  { id: "verde", nome: "Carro 6", cor: "#22c55e" },
];

type TipoSprite = TipoObjeto;

interface Tema extends VisualCenario {
  nome: string;
  chao: [string, string];
  zebra: [string, string];
  asfalto: [string, string];
  faixa: string;
  lateral: TipoSprite[];
  curvas: number;
  morros: number;
  /** Guard-rail metálico dos dois lados da pista. */
  guarda: boolean;
  /** Foto panorâmica de fundo; `horizonte` é a fração da altura onde o chão começa. */
  foto?: { arquivo: string; horizonte: number };
}

export const TEMAS: Record<IdPista, Tema> = {
  cidade: {
    nome: "Cidade",
    ceuTopo: "#0f0a2e",
    ceuMeio: "#4a2a80",
    ceuBase: "#f2895a",
    nevoa: "#c4677e",
    sol: { x: 0.72, y: 150, cor: "#ffd08a", tamanho: 13 },
    longe: { tipo: "predios", cor: "#3b2a6b" },
    perto: { tipo: "predios", cor: "#1d1544" },
    nuvens: 3,
    nuvemCor: "#d8a7c8",
    estrelas: true,
    estilo: "noite",
    chao: ["#2f2f3d", "#292935"],
    zebra: ["#e5e7eb", "#ef4444"],
    asfalto: ["#3d4450", "#373e49"],
    faixa: "#fde047",
    lateral: ["predio", "predio", "poste", "poste", "placa", "pneus"],
    curvas: 2,
    morros: 1,
    guarda: true,
  },
  montanha: {
    nome: "Montanha",
    ceuTopo: "#5aa7e0",
    ceuMeio: "#a9d1f0",
    ceuBase: "#dbe8f2",
    nevoa: "#c9dcea",
    longe: { tipo: "montanhas", cor: "#7c93ad" },
    perto: { tipo: "montanhas", cor: "#3f6b4a" },
    nuvens: 4,
    nuvemCor: "#ffffff",
    estrelas: false,
    estilo: "dia",
    chao: ["#5f8560", "#577b58"],
    zebra: ["#f8fafc", "#dc2626"],
    asfalto: ["#565e69", "#4f5761"],
    faixa: "#f8fafc",
    lateral: ["pinheiro", "pinheiro", "pinheiro", "arbusto", "rocha", "placa"],
    curvas: 4,
    morros: 2,
    guarda: true,
    foto: { arquivo: "cenario-montanha.jpg", horizonte: 0.86 },
  },
  praia: {
    nome: "Praia",
    ceuTopo: "#3f9be0",
    ceuMeio: "#8ec8ee",
    ceuBase: "#dcecf3",
    nevoa: "#e3eef2",
    sol: { x: 0.25, y: 120, cor: "#fff7c2", tamanho: 12 },
    longe: { tipo: "mar", cor: "#22b8cf" },
    perto: { tipo: "montanhas", cor: "#5aa876" },
    nuvens: 5,
    nuvemCor: "#ffffff",
    estrelas: false,
    estilo: "dia",
    chao: ["#e2cc9f", "#d9c193"],
    zebra: ["#ffffff", "#f97316"],
    asfalto: ["#5c636d", "#555c66"],
    faixa: "#facc15",
    lateral: ["palmeira", "palmeira", "palmeira", "arbusto", "pneus"],
    curvas: 3,
    morros: 1,
    guarda: false,
    foto: { arquivo: "cenario-praia.jpg", horizonte: 0.5 },
  },
  deserto: {
    nome: "Deserto",
    ceuTopo: "#e8964b",
    ceuMeio: "#f2b866",
    ceuBase: "#f7d08a",
    nevoa: "#f0c07a",
    sol: { x: 0.5, y: 140, cor: "#fff1c1", tamanho: 14 },
    longe: { tipo: "mesas", cor: "#b5532a" },
    perto: { tipo: "dunas", cor: "#c98a4d" },
    nuvens: 2,
    nuvemCor: "#f3c48a",
    estrelas: false,
    estilo: "deserto",
    chao: ["#c98a4d", "#bf8145"],
    zebra: ["#f8fafc", "#b91c1c"],
    asfalto: ["#6a6058", "#625950"],
    faixa: "#fde68a",
    lateral: ["cacto", "cacto", "rocha", "rocha", "arbusto", "placa"],
    curvas: 3,
    morros: 2,
    guarda: false,
    foto: { arquivo: "cenario-deserto.jpg", horizonte: 0.66 },
  },
  neve: {
    nome: "Neve",
    ceuTopo: "#9fc3e0",
    ceuMeio: "#cfe1f0",
    ceuBase: "#eaf1f6",
    nevoa: "#e6eef4",
    longe: { tipo: "montanhas", cor: "#b9cde0", neve: true },
    perto: { tipo: "montanhas", cor: "#8aa5bd", neve: true },
    nuvens: 3,
    nuvemCor: "#ffffff",
    estrelas: false,
    estilo: "neve",
    chao: ["#f2f7fb", "#e4edf3"],
    zebra: ["#f8fafc", "#2563eb"],
    asfalto: ["#6b7480", "#646d79"],
    faixa: "#e0f2fe",
    lateral: ["pinheiro", "pinheiro", "pinheiro", "arbusto", "rocha", "placa"],
    curvas: 4,
    morros: 2,
    guarda: true,
    foto: { arquivo: "cenario-neve.jpg", horizonte: 0.8 },
  },
};

// ---------------------------------------------------------------- constantes

const LARGURA = 640;
const ALTURA = 360;
const SEG = 200;
const PISTA = 2000;
const CAMERA_ALTURA = 1000;
const CAMERA_PROF = 1 / Math.tan(((100 / 2) * Math.PI) / 180);
const VISAO = 110;
const VEL_MAX = SEG * 60;
const ACEL = VEL_MAX / 5;
const FREIO = -VEL_MAX;
const DESACEL = -VEL_MAX / 5;
const FORA = -VEL_MAX / 2;
const LIMITE_FORA = VEL_MAX / 4;
const CENTRIFUGA = 0.22;
const POS_JOGADOR = CAMERA_ALTURA * CAMERA_PROF;
const KMH_MAX = 220;
/** Meia-largura de acerto de cada obstáculo, em metades de pista. */
const ALCANCE: Partial<Record<TipoSprite, number>> = {
  cone: 0.22,
  caixa: 0.3,
  pneus: 0.28,
  barreira: 0.5,
  buraco: 0.3,
  poca: 0.45,
  turbo: 0.35,
};

/** Largura de um carro, em metades de pista. */
const ANCHO_CARRO = 0.34;

interface Ponto {
  mundo: { y: number; z: number };
  camera: { x: number; y: number; z: number };
  tela: { x: number; y: number; w: number; scale: number };
}

interface Sprite {
  tipo: TipoSprite;
  offset: number;
  /** Semente estável (0 a 1): cada objeto tem tamanho e detalhes próprios. */
  sem: number;
  batido?: boolean;
}

interface Segmento {
  index: number;
  p1: Ponto;
  p2: Ponto;
  curva: number;
  cores: { chao: string; asfalto: string; zebra: string; faixa: string | null };
  sprites: Sprite[];
  carros: Rival[];
  clip: number;
  looped: boolean;
}

interface Rival {
  z: number;
  offset: number;
  vel: number;
  velAlvo: number;
  cor: string;
  volta: number;
  terminou: boolean;
  queda: number;
  ladoQueda: number;
}

export interface Entrada {
  esquerda: boolean;
  direita: boolean;
  acelerar: boolean;
  frear: boolean;
  /** Direção analógica de -1 (esquerda) a 1 (direita): volante de toque e inclinação. */
  volante: number;
  /** Pulso de interação da moto (tecla E ou botão de ombrada). */
  empurrar: boolean;
}

export interface FimExtra {
  voltasFeitas: number;
  metros: number;
}

export interface Hud {
  posicao: number;
  total: number;
  volta: number;
  kmh: number;
  /** Segundos que faltam no modo tempo (null no modo voltas). */
  tempoRestante: number | null;
  /** Total de voltas do modo voltas (0 no modo tempo). */
  voltasTotal: number;
  /** Voltas completas até agora. */
  voltasFeitas: number;
}

export interface PilotoMoto {
  camisa: string;
  calca: string;
  capacete: string;
  mochila: boolean;
}

export interface OpcoesCorrida {
  canvas: HTMLCanvasElement;
  /** "moto" troca os carros por motos com piloto (missão do Operação: Plantão). */
  veiculo?: "carro" | "moto";
  piloto?: PilotoMoto;
  /** Libera a ombrada contra rivais próximos na missão de perseguição. */
  permiteEmpurrar?: boolean;
  pista: IdPista;
  corJogador: string;
  /** 1 fácil, 2 médio, 3 difícil */
  nivel: number;
  aoMudarHud: (h: Hud) => void;
  aoTerminar: (posicao: number, segundos: number, extra: FimExtra) => void;
  /** "voltas": termina ao completar N voltas; "tempo": termina quando o relógio zera. */
  modo: "voltas" | "tempo";
  voltas: number;
  tempoLimite: number;
  som?: SomCorrida | null;
}

// ------------------------------------------------------------------ utilidades

function semente(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ruido(i: number): number {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const limitar = (v: number, a: number, b: number) => Math.max(a, Math.min(v, b));
const interpolar = (a: number, b: number, p: number) => a + (b - a) * p;
const easeIn = (a: number, b: number, p: number) => a + (b - a) * Math.pow(p, 2);
const easeInOut = (a: number, b: number, p: number) =>
  a + (b - a) * (-Math.cos(p * Math.PI) / 2 + 0.5);

function sobrepoe(x1: number, x2: number): boolean {
  return Math.abs(x1 - x2) < ANCHO_CARRO;
}

/** Clareia (>0) ou escurece (<0) uma cor #rrggbb. */
function tom(hex: string, q: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) =>
    Math.round(limitar(q >= 0 ? v + (255 - v) * q : v * (1 + q), 0, 255))
      .toString(16)
      .padStart(2, "0");
  return `#${c((n >> 16) & 255)}${c((n >> 8) & 255)}${c(n & 255)}`;
}

function novoPonto(): Ponto {
  return {
    mundo: { y: 0, z: 0 },
    camera: { x: 0, y: 0, z: 0 },
    tela: { x: 0, y: 0, w: 0, scale: 0 },
  };
}

// ----------------------------------------------------------------- desenho

/** Moto vista de trás, com o piloto de capacete. `w` é a largura de referência do carro. */
export function desenharMoto(
  ctx: CanvasRenderingContext2D,
  cx: number,
  base: number,
  w: number,
  cor: string,
  opcoes: {
    inclinacao?: number;
    freando?: boolean;
    piloto?: PilotoMoto;
    faseRoda?: number;
    queda?: number;
  } = {},
) {
  const h = w * 0.5;
  const p = opcoes.piloto ?? {
    camisa: "#1e2a6b",
    calca: "#27406e",
    capacete: "#dc2626",
    mochila: false,
  };
  const traco = Math.max(1, w * 0.008);
  ctx.save();
  ctx.translate(cx, base);
  if (opcoes.queda) ctx.rotate(opcoes.queda);
  else if (opcoes.inclinacao) ctx.rotate(opcoes.inclinacao * 2.2);

  // sombra
  ctx.save();
  ctx.scale(1, 0.14);
  const sombra = ctx.createRadialGradient(0, 0, w * 0.03, 0, 0, w * 0.4);
  sombra.addColorStop(0, "rgba(0,0,0,0.65)");
  sombra.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = sombra;
  ctx.beginPath();
  ctx.arc(0, 0, w * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // pneu traseiro
  const tg = ctx.createLinearGradient(-w * 0.08, 0, w * 0.08, 0);
  tg.addColorStop(0, "#05070a");
  tg.addColorStop(0.5, "#2a313c");
  tg.addColorStop(1, "#05070a");
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.roundRect(-w * 0.075, -h * 0.66, w * 0.15, h * 0.66, w * 0.05);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = traco;
  const giroPneu = ((opcoes.faseRoda ?? 0) % 18) / 18;
  for (let i = 0; i < 7; i++) {
    const sulco = (i + giroPneu) / 7;
    ctx.beginPath();
    ctx.moveTo(-w * 0.07, -h * 0.66 + h * 0.66 * sulco);
    ctx.lineTo(w * 0.07, -h * 0.66 + h * 0.66 * Math.min(1, sulco + 0.1));
    ctx.stroke();
  }
  // escapamento cromado
  const eg = ctx.createLinearGradient(w * 0.1, 0, w * 0.16, 0);
  eg.addColorStop(0, "#f8fafc");
  eg.addColorStop(1, "#64748b");
  ctx.fillStyle = eg;
  ctx.beginPath();
  ctx.roundRect(w * 0.1, -h * 0.5, w * 0.055, h * 0.34, w * 0.02);
  ctx.fill();
  // paralama e lanterna
  const pg = ctx.createLinearGradient(0, -h * 0.85, 0, -h * 0.55);
  pg.addColorStop(0, cor);
  pg.addColorStop(1, "#000000");
  ctx.fillStyle = pg;
  ctx.beginPath();
  ctx.moveTo(-w * 0.14, -h * 0.6);
  ctx.lineTo(-w * 0.1, -h * 0.85);
  ctx.lineTo(w * 0.1, -h * 0.85);
  ctx.lineTo(w * 0.14, -h * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(-w * 0.06, -h * 0.72, w * 0.12, h * 0.07);
  if (opcoes.freando) {
    ctx.shadowColor = "#ff3030";
    ctx.shadowBlur = w * 0.08;
  }
  ctx.fillStyle = opcoes.freando ? "#ff4444" : "#b91c1c";
  ctx.beginPath();
  ctx.roundRect(-w * 0.09, -h * 0.82, w * 0.18, h * 0.05, w * 0.015);
  ctx.fill();
  ctx.shadowBlur = 0;

  // pernas do piloto ao lado do tanque
  ctx.fillStyle = p.calca;
  for (const lado of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(lado * w * 0.16, -h * 1.02, w * 0.075, h * 0.3, lado * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
  // tronco
  const cg = ctx.createLinearGradient(-w * 0.2, 0, w * 0.2, 0);
  cg.addColorStop(0, p.camisa);
  cg.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = p.camisa;
  ctx.beginPath();
  ctx.roundRect(-w * 0.16, -h * 1.5, w * 0.32, h * 0.7, w * 0.07);
  ctx.fill();
  ctx.fillStyle = cg;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(-w * 0.16, -h * 1.5, w * 0.32, h * 0.7);
  ctx.globalAlpha = 1;
  if (p.mochila) {
    ctx.fillStyle = "#1c1c20";
    ctx.beginPath();
    ctx.roundRect(-w * 0.14, -h * 1.5, w * 0.28, h * 0.52, w * 0.05);
    ctx.fill();
    ctx.fillStyle = "#2f2f36";
    ctx.fillRect(-w * 0.1, -h * 1.34, w * 0.2, h * 0.05);
  }
  // braços até o guidão
  ctx.strokeStyle = p.camisa;
  ctx.lineCap = "round";
  ctx.lineWidth = w * 0.075;
  for (const lado of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(lado * w * 0.2, -h * 1.5);
    ctx.lineTo(lado * w * 0.37, -h * 1.12);
    ctx.stroke();
  }
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = w * 0.03;
  ctx.beginPath();
  ctx.moveTo(-w * 0.4, -h * 1.1);
  ctx.lineTo(w * 0.4, -h * 1.1);
  ctx.stroke();
  ctx.fillStyle = "#0b0f14";
  for (const lado of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(lado * w * 0.39, -h * 1.1, w * 0.04, 0, Math.PI * 2);
    ctx.fill();
  }
  // capacete
  const hg = ctx.createRadialGradient(-w * 0.03, -h * 1.9, 2, 0, -h * 1.82, w * 0.14);
  hg.addColorStop(0, "#ffffff");
  hg.addColorStop(0.25, p.capacete);
  hg.addColorStop(1, "#000000");
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(0, -h * 1.66, w * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.beginPath();
  ctx.ellipse(-w * 0.04, -h * 1.9, w * 0.035, w * 0.05, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Carro esportivo visto de trás. `w` é a largura total; (cx, base) é o meio da base. */
export function desenharCarro(
  ctx: CanvasRenderingContext2D,
  cx: number,
  base: number,
  w: number,
  cor: string,
  opcoes: { inclinacao?: number; freando?: boolean } = {},
) {
  const h = w * 0.48;
  const claro = tom(cor, 0.5);
  const escuro = tom(cor, -0.5);
  const traco = Math.max(1, w * 0.008);
  ctx.save();
  ctx.translate(cx, base);
  if (opcoes.inclinacao) ctx.rotate(opcoes.inclinacao);

  // sombra no asfalto
  ctx.save();
  ctx.scale(1, 0.16);
  const sombra = ctx.createRadialGradient(0, 0, w * 0.05, 0, 0, w * 0.62);
  sombra.addColorStop(0, "rgba(0,0,0,0.7)");
  sombra.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = sombra;
  ctx.beginPath();
  ctx.arc(0, 0, w * 0.62, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // pneus traseiros largos, com sulcos
  for (const lado of [-1, 1]) {
    const x = lado * w * 0.4;
    const tw = w * 0.2;
    const th = h * 0.52;
    const g = ctx.createLinearGradient(x - tw / 2, 0, x + tw / 2, 0);
    g.addColorStop(0, "#04060a");
    g.addColorStop(0.5, "#252c37");
    g.addColorStop(1, "#04060a");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(x - tw / 2, -th, tw, th, w * 0.035);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.09)";
    ctx.lineWidth = traco;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(x - tw / 2 + 1, -th + (th / 5) * i);
      ctx.lineTo(x + tw / 2 - 1, -th + (th / 5) * i);
      ctx.stroke();
    }
  }

  // difusor de carbono com aletas
  ctx.fillStyle = "#0a0d12";
  ctx.beginPath();
  ctx.moveTo(-w * 0.36, -h * 0.2);
  ctx.lineTo(w * 0.36, -h * 0.2);
  ctx.lineTo(w * 0.3, -h * 0.02);
  ctx.lineTo(-w * 0.3, -h * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = traco;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * w * 0.09, -h * 0.19);
    ctx.lineTo(i * w * 0.075, -h * 0.03);
    ctx.stroke();
  }
  // escapamentos cromados
  for (const lado of [-1, 1]) {
    const ex = lado * w * 0.19;
    const g = ctx.createRadialGradient(ex - w * 0.01, -h * 0.11, 1, ex, -h * 0.1, w * 0.05);
    g.addColorStop(0, "#f8fafc");
    g.addColorStop(0.6, "#94a3b8");
    g.addColorStop(1, "#475569");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(ex, -h * 0.1, w * 0.048, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#020305";
    ctx.beginPath();
    ctx.arc(ex, -h * 0.1, w * 0.032, 0, Math.PI * 2);
    ctx.fill();
  }

  // carroceria: ombros largos e traseira que afina para a tampa
  const corpo = ctx.createLinearGradient(0, -h * 0.66, 0, -h * 0.16);
  corpo.addColorStop(0, claro);
  corpo.addColorStop(0.35, cor);
  corpo.addColorStop(1, escuro);
  ctx.fillStyle = corpo;
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = traco;
  ctx.beginPath();
  ctx.moveTo(-w * 0.4, -h * 0.17);
  ctx.bezierCurveTo(-w * 0.5, -h * 0.2, -w * 0.5, -h * 0.4, -w * 0.46, -h * 0.5);
  ctx.bezierCurveTo(-w * 0.44, -h * 0.6, -w * 0.4, -h * 0.64, -w * 0.32, -h * 0.66);
  ctx.lineTo(w * 0.32, -h * 0.66);
  ctx.bezierCurveTo(w * 0.4, -h * 0.64, w * 0.44, -h * 0.6, w * 0.46, -h * 0.5);
  ctx.bezierCurveTo(w * 0.5, -h * 0.4, w * 0.5, -h * 0.2, w * 0.4, -h * 0.17);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // brilho do ombro e vinco central
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = traco * 1.6;
  for (const lado of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(lado * w * 0.3, -h * 0.64);
    ctx.quadraticCurveTo(lado * w * 0.43, -h * 0.6, lado * w * 0.45, -h * 0.48);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = traco;
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.66);
  ctx.lineTo(0, -h * 0.36);
  ctx.stroke();

  // faixa escura das lanternas
  ctx.fillStyle = "#0b0e14";
  ctx.beginPath();
  ctx.roundRect(-w * 0.43, -h * 0.55, w * 0.86, h * 0.17, w * 0.03);
  ctx.fill();
  // lanternas de LED: aglomerado de cada lado + barra central
  const acesa = opcoes.freando === true;
  for (const lado of [-1, 1]) {
    const x0 = lado === -1 ? -w * 0.42 : w * 0.12;
    const g = ctx.createLinearGradient(x0, 0, x0 + w * 0.3, 0);
    g.addColorStop(0, acesa ? "#ff5a5a" : "#b91c1c");
    g.addColorStop(1, acesa ? "#ff2020" : "#7f1d1d");
    if (acesa) {
      ctx.shadowColor = "#ff3030";
      ctx.shadowBlur = w * 0.09;
    }
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(x0, -h * 0.54, w * 0.3, h * 0.15, w * 0.025);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = acesa ? "#fff1f1" : "#fca5a5";
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(x0 + w * 0.025 + i * w * 0.055, -h * 0.51, w * 0.03, h * 0.09);
    }
  }
  ctx.fillStyle = acesa ? "#ff3a3a" : "#991b1b";
  ctx.fillRect(-w * 0.12, -h * 0.485, w * 0.24, h * 0.035);

  // para-choque com a placa
  ctx.fillStyle = "#0b0e14";
  ctx.beginPath();
  ctx.roundRect(-w * 0.14, -h * 0.36, w * 0.28, h * 0.13, w * 0.02);
  ctx.fill();
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(-w * 0.11, -h * 0.34, w * 0.22, h * 0.09);
  ctx.fillStyle = "#1e3a8a";
  ctx.fillRect(-w * 0.11, -h * 0.34, w * 0.22, h * 0.02);

  // cabine: teto, colunas e vidro traseiro com reflexo
  const teto = ctx.createLinearGradient(0, -h * 1.02, 0, -h * 0.64);
  teto.addColorStop(0, claro);
  teto.addColorStop(1, cor);
  ctx.fillStyle = teto;
  ctx.strokeStyle = "rgba(0,0,0,0.45)";
  ctx.lineWidth = traco;
  ctx.beginPath();
  ctx.moveTo(-w * 0.35, -h * 0.64);
  ctx.bezierCurveTo(-w * 0.32, -h * 0.85, -w * 0.28, -h * 0.98, -w * 0.2, -h * 1.02);
  ctx.lineTo(w * 0.2, -h * 1.02);
  ctx.bezierCurveTo(w * 0.28, -h * 0.98, w * 0.32, -h * 0.85, w * 0.35, -h * 0.64);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const vidro = ctx.createLinearGradient(0, -h * 0.98, 0, -h * 0.68);
  vidro.addColorStop(0, "#cbd5e1");
  vidro.addColorStop(0.45, "#334155");
  vidro.addColorStop(1, "#020617");
  ctx.fillStyle = vidro;
  ctx.beginPath();
  ctx.moveTo(-w * 0.29, -h * 0.68);
  ctx.bezierCurveTo(-w * 0.27, -h * 0.83, -w * 0.24, -h * 0.93, -w * 0.18, -h * 0.97);
  ctx.lineTo(w * 0.18, -h * 0.97);
  ctx.bezierCurveTo(w * 0.24, -h * 0.93, w * 0.27, -h * 0.83, w * 0.29, -h * 0.68);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath();
  ctx.moveTo(-w * 0.2, -h * 0.94);
  ctx.lineTo(-w * 0.08, -h * 0.94);
  ctx.lineTo(-w * 0.17, -h * 0.7);
  ctx.lineTo(-w * 0.27, -h * 0.7);
  ctx.closePath();
  ctx.fill();

  // aerofólio: asa de carbono, suportes e placas laterais
  ctx.fillStyle = "#0a0d12";
  ctx.fillRect(-w * 0.27, -h * 0.68, w * 0.045, h * 0.1);
  ctx.fillRect(w * 0.225, -h * 0.68, w * 0.045, h * 0.1);
  const asa = ctx.createLinearGradient(0, -h * 0.8, 0, -h * 0.7);
  asa.addColorStop(0, "#2a313d");
  asa.addColorStop(1, "#05070a");
  ctx.fillStyle = asa;
  ctx.beginPath();
  ctx.roundRect(-w * 0.49, -h * 0.79, w * 0.98, h * 0.1, w * 0.02);
  ctx.fill();
  ctx.fillStyle = cor;
  ctx.fillRect(-w * 0.49, -h * 0.79, w * 0.98, h * 0.018);
  for (const lado of [-1, 1]) {
    ctx.fillStyle = escuro;
    ctx.beginPath();
    ctx.roundRect(lado * w * 0.49 - w * 0.018, -h * 0.86, w * 0.036, h * 0.2, w * 0.012);
    ctx.fill();
  }
  ctx.restore();
}

const LARGURA_SPRITE: Record<TipoSprite, number> = {
  barreira: 0.3,
  caixa: 0.13,
  poca: 0.3,
  buraco: 0.2,
  turbo: 0.26,
  cone: 0.11,
  pneus: 0.2,
  palmeira: 0.42,
  pinheiro: 0.52,
  cacto: 0.3,
  predio: 0.85,
  placa: 0.28,
  poste: 0.16,
  rocha: 0.34,
  arbusto: 0.38,
};

// ------------------------------------------------------------------- motor

export class Corrida {
  private ctx: CanvasRenderingContext2D;
  private tema: Tema;
  private foto: HTMLImageElement | null = null;
  private tempoCena = 0;
  private segs: Segmento[] = [];
  private comprimento = 0;
  private rivais: Rival[] = [];
  private posicao = 0;
  private x = 0;
  private vel = 0;
  private volta = 1;
  private distancia = 0;
  private tempo = 0;
  private ceuOff = 0;
  private aceso = false;
  private terminou = false;
  private piscar = 0;
  private freando = false;
  private ultimoHud = "";
  private acumulaHud = 0;
  private raf = 0;
  private ultimo = 0;
  private parado = true;
  entrada: Entrada = {
    esquerda: false,
    direita: false,
    acelerar: false,
    frear: false,
    volante: 0,
    empurrar: false,
  };
  private fumaca: { x: number; y: number; r: number; vx: number; vy: number; vida: number }[] = [];
  private derrapando = false;
  private escorregaAte = 0;
  private turboAte = 0;
  private solavanco = 0;
  private voltasTotal: number;
  private foraDaPista = false;
  private recargaEmpurrao = 0;

  constructor(private op: OpcoesCorrida) {
    op.canvas.width = LARGURA;
    op.canvas.height = ALTURA;
    this.ctx = op.canvas.getContext("2d")!;
    this.tema = TEMAS[op.pista];
    this.voltasTotal = op.modo === "voltas" ? op.voltas : 9999;
    if (this.tema.foto && typeof Image !== "undefined") {
      this.foto = new Image();
      this.foto.src = `/images/jogos/${this.tema.foto.arquivo}`;
    }
    this.montarPista();
    this.montarRivais();
    this.desenhar();
  }

  // ---------------------------------------------------------- construção

  private ultimoY(): number {
    return this.segs.length ? this.segs[this.segs.length - 1]!.p2.mundo.y : 0;
  }

  private addSegmento(curva: number, y: number) {
    const n = this.segs.length;
    const p1 = novoPonto();
    const p2 = novoPonto();
    p1.mundo = { y: this.ultimoY(), z: n * SEG };
    p2.mundo = { y, z: (n + 1) * SEG };
    const par = Math.floor(n / 3) % 2 === 0 ? 0 : 1;
    const largada = n < 4;
    this.segs.push({
      index: n,
      p1,
      p2,
      curva,
      cores: {
        chao: this.tema.chao[par]!,
        asfalto: largada ? (n % 2 === 0 ? "#f8fafc" : "#111827") : this.tema.asfalto[par]!,
        zebra: this.tema.zebra[par]!,
        faixa: par === 0 && !largada ? this.tema.faixa : null,
      },
      sprites: [],
      carros: [],
      clip: 0,
      looped: false,
    });
  }

  private addTrecho(entra: number, mantem: number, sai: number, curva: number, morro: number) {
    const y0 = this.ultimoY();
    const y1 = y0 + morro * SEG;
    const total = entra + mantem + sai;
    for (let n = 0; n < entra; n++)
      this.addSegmento(easeIn(0, curva, n / entra), easeInOut(y0, y1, n / total));
    for (let n = 0; n < mantem; n++)
      this.addSegmento(curva, easeInOut(y0, y1, (entra + n) / total));
    for (let n = 0; n < sai; n++)
      this.addSegmento(
        easeInOut(curva, 0, n / sai),
        easeInOut(y0, y1, (entra + mantem + n) / total),
      );
  }

  private montarPista() {
    const t = this.tema;
    const c = t.curvas;
    const m = t.morros;
    const reta = (n: number) => this.addTrecho(n, n * 2, n, 0, 0);
    // A largada sempre é reta e plana.
    reta(15);
    this.addTrecho(20, 30, 20, c * 0.9, 0);
    reta(12);
    this.addTrecho(25, 40, 25, -c, m * 20);
    this.addTrecho(20, 30, 20, c * 1.1, -m * 8);
    reta(14);
    this.addTrecho(30, 45, 30, -c * 1.2, m * 26);
    this.addTrecho(20, 25, 20, c * 0.8, -m * 20);
    this.addTrecho(25, 35, 25, -c * 0.7, 0);
    this.addTrecho(20, 35, 20, c * 1.3, m * 14);
    // Volta ao nível zero para a pista fechar sem degrau.
    const restante = -this.ultimoY() / SEG;
    this.addTrecho(30, 40, 30, 0, restante);
    reta(10);

    this.comprimento = this.segs.length * SEG;

    // Cenário e cones, sempre iguais para a mesma pista (semente fixa).
    const rnd = semente(t.nome.length * 977);
    for (let n = 8; n < this.segs.length; n += 3) {
      const lado = n % 6 === 0 ? -1 : 1;
      const tipo = t.lateral[Math.floor(rnd() * t.lateral.length)]!;
      const dist = tipo === "predio" ? 1.9 + rnd() * 1.2 : 1.35 + rnd() * 1.6;
      this.segs[n]!.sprites.push({ tipo, offset: lado * dist, sem: rnd() });
      if (rnd() < 0.35)
        this.segs[n]!.sprites.push({ tipo, offset: -lado * (1.4 + rnd() * 1.6), sem: rnd() });
    }
    // Obstáculos: quanto maior o nível, mais frequentes e mais variados.
    const nivel = Math.min(Math.max(this.op.nivel, 1), 3);
    const [de, ate] = nivel === 1 ? [60, 95] : nivel === 2 ? [40, 70] : [24, 46];
    const tipos: TipoSprite[] =
      nivel === 1
        ? ["cone", "caixa", "buraco"]
        : nivel === 2
          ? ["cone", "caixa", "buraco", "pneus", "poca", "barreira"]
          : ["cone", "caixa", "buraco", "pneus", "poca", "barreira", "barreira", "poca"];
    for (let n = 60; n < this.segs.length - 20; n += de + Math.floor(rnd() * (ate - de))) {
      const tipo = tipos[Math.floor(rnd() * tipos.length)]!;
      const off = (rnd() - 0.5) * 1.3;
      this.segs[n]!.sprites.push({ tipo, offset: off, sem: rnd() });
      // No difícil, às vezes vem um segundo obstáculo do outro lado da pista.
      if (nivel === 3 && rnd() < 0.3) {
        const outro: TipoSprite = rnd() < 0.5 ? "cone" : "pneus";
        this.segs[n]!.sprites.push({
          tipo: outro,
          offset: off > 0 ? off - 0.75 : off + 0.75,
          sem: rnd(),
        });
      }
    }
    // Faixas de turbo: uma vantagem espalhada pela pista.
    for (let n = 110; n < this.segs.length - 20; n += 120 + Math.floor(rnd() * 50)) {
      this.segs[n]!.sprites.push({ tipo: "turbo", offset: (rnd() - 0.5) * 1.1, sem: rnd() });
    }
  }

  private montarRivais() {
    const nivel = this.op.nivel;
    const cores = CARROS.map((c) => c.cor).filter((c) => c !== this.op.corJogador);
    // Quanto do máximo cada nível deixa o rival correr.
    const faixa = nivel === 1 ? [0.66, 0.8] : nivel === 2 ? [0.78, 0.9] : [0.88, 0.99];
    this.rivais = cores.slice(0, 5).map((cor, i) => ({
      // Grade de largada: dois carros por fileira, alguns metros à frente.
      z: POS_JOGADOR + 500 + i * SEG * 3,
      offset: i % 2 === 0 ? -0.55 : 0.55,
      vel: 0,
      velAlvo: VEL_MAX * (faixa[0]! + ((faixa[1]! - faixa[0]!) * (4 - i)) / 4),
      cor,
      volta: 1,
      terminou: false,
      queda: 0,
      ladoQueda: 1,
    }));
  }

  // ------------------------------------------------------------ controle

  iniciar() {
    this.parado = false;
    this.ultimo = performance.now();
    const quadro = (agora: number) => {
      if (this.parado) return;
      const dt = Math.min((agora - this.ultimo) / 1000, 1 / 20);
      this.ultimo = agora;
      this.atualizar(dt);
      this.desenhar();
      this.raf = requestAnimationFrame(quadro);
    };
    this.raf = requestAnimationFrame(quadro);
  }

  /** Libera o carro (fim da contagem regressiva). */
  largar() {
    this.aceso = true;
    this.tempo = 0;
  }

  parar() {
    this.parado = true;
    cancelAnimationFrame(this.raf);
  }

  // ---------------------------------------------------------- atualização

  private achar(z: number): Segmento {
    return this.segs[Math.floor(z / SEG) % this.segs.length]!;
  }

  private atualizar(dt: number) {
    const e = this.entrada;
    const seg = this.achar(this.posicao + POS_JOGADOR);
    const razao = this.vel / VEL_MAX;

    if (this.aceso) this.tempo += this.terminou ? 0 : dt;

    // Posição
    const antes = this.posicao;
    this.posicao += dt * this.vel;
    if (this.posicao >= this.comprimento) {
      this.posicao -= this.comprimento;
      if (!this.terminou && this.aceso) this.volta += 1;
    }
    if (this.posicao < antes) this.reabrirObstaculos();
    if (this.posicao < antes && this.volta > this.voltasTotal && !this.terminou)
      this.terminarJogador();
    if (
      this.op.modo === "tempo" &&
      this.aceso &&
      !this.terminou &&
      this.tempo >= this.op.tempoLimite
    )
      this.terminarPorTempo();
    this.distancia += dt * this.vel;
    this.ceuOff += seg.curva * razao * dt * 40;
    this.tempoCena += dt;

    // Volante
    const dx = dt * 2 * razao;
    const anda = this.aceso && !this.terminou;
    const escorrega = this.tempoCena < this.escorregaAte;
    const turbo = this.tempoCena < this.turboAte;
    const dirBruta = e.volante !== 0 ? e.volante : (e.direita ? 1 : 0) - (e.esquerda ? 1 : 0);
    // Na poça o volante quase não responde e o carro balança sozinho.
    const dir = escorrega ? dirBruta * 0.35 + Math.sin(this.tempoCena * 9) * 0.7 : dirBruta;
    if (anda) this.x += dx * limitar(dir, -1, 1);
    this.x -= dx * razao * seg.curva * CENTRIFUGA;

    // Pedais. Depois da chegada o carro perde velocidade sozinho.
    this.freando = false;
    if (anda && e.frear) {
      this.vel += FREIO * dt;
      this.freando = true;
    } else if (anda && (e.acelerar || turbo)) this.vel += ACEL * (turbo ? 2.6 : 1) * dt;
    else this.vel += (this.terminou ? FREIO / 2 : DESACEL) * dt;

    this.foraDaPista = this.x < -1 || this.x > 1;
    if (this.foraDaPista && this.vel > LIMITE_FORA) this.vel += FORA * dt;
    // Derrapagem: curva fechada em alta, ou freada forte em velocidade.
    this.derrapando =
      anda &&
      (escorrega ||
        (Math.abs(dir) > 0.4 && razao > 0.55 && Math.abs(seg.curva) > 2.2) ||
        (this.freando && razao > 0.45));

    // Obstáculos e faixas de turbo na pista: cada um faz uma coisa diferente.
    for (const s of seg.sprites) {
      if (s.batido) continue;
      const alcance = ALCANCE[s.tipo];
      if (alcance === undefined || Math.abs(this.x - s.offset) >= alcance) continue;
      s.batido = true;
      this.aplicarEfeito(s.tipo);
    }
    // Encostar em outro carro
    for (const r of seg.carros) {
      if (this.vel > r.vel && sobrepoe(this.x, r.offset)) {
        if (this.vel > r.vel * 1.15) this.op.som?.batida();
        this.vel = r.vel * 0.85;
        this.x += this.x > r.offset ? 0.04 : -0.04;
      }
    }

    this.x = limitar(this.x, -2.4, 2.4);
    this.vel = limitar(this.vel, 0, turbo ? VEL_MAX * 1.3 : VEL_MAX);
    this.solavanco = Math.max(0, this.solavanco - dt);
    this.piscar = Math.max(0, this.piscar - dt);
    this.recargaEmpurrao = Math.max(0, this.recargaEmpurrao - dt);

    // Ombrada da perseguição: só acerta uma moto realmente lado a lado.
    if (this.op.permiteEmpurrar && e.empurrar && this.recargaEmpurrao <= 0 && razao > 0.28) {
      const meuZ = this.posicao + POS_JOGADOR;
      const alvo = this.rivais
        .filter((r) => r.queda <= 0)
        .map((r) => {
          let dz = r.z - meuZ;
          if (dz > this.comprimento / 2) dz -= this.comprimento;
          if (dz < -this.comprimento / 2) dz += this.comprimento;
          return { r, dz, dx: Math.abs(r.offset - this.x) };
        })
        .filter(({ dz, dx }) => Math.abs(dz) < SEG * 2.4 && dx < 0.48)
        .sort((a, b) => Math.abs(a.dz) + a.dx * SEG - (Math.abs(b.dz) + b.dx * SEG))[0];
      if (alvo) {
        alvo.r.ladoQueda = alvo.r.offset >= this.x ? 1 : -1;
        alvo.r.queda = 1.15;
        alvo.r.vel *= 0.42;
        alvo.r.offset = limitar(alvo.r.offset + alvo.r.ladoQueda * 0.28, -1.15, 1.15);
        this.vel *= 0.94;
        this.solavanco = 0.22;
        this.op.som?.batida();
        this.recargaEmpurrao = 1.1;
      }
      e.empurrar = false;
    }

    this.atualizarRivais(dt);
    this.atualizarFumaca(dt);
    this.enviarHud(dt);
    this.op.som?.atualizar({
      razao: this.vel / VEL_MAX,
      acelerando: anda && e.acelerar,
      freando: this.freando,
      derrapando: this.derrapando,
      foraDaPista: this.foraDaPista,
      andando: this.aceso,
    });
  }

  private atualizarRivais(dt: number) {
    for (const s of this.segs) s.carros.length = 0;
    const largou = this.aceso;
    for (const r of this.rivais) {
      const seg = this.achar(r.z);
      r.queda = Math.max(0, r.queda - dt);
      if (largou) {
        // Freia um pouco nas curvas fechadas, como qualquer piloto.
        const alvo = r.velAlvo * (1 - (Math.min(Math.abs(seg.curva), 6) / 6) * 0.12);
        r.vel = r.vel < alvo ? Math.min(alvo, r.vel + ACEL * 0.8 * dt) : alvo;
      }
      // Desvia de quem está mais lento à frente.
      const desvio = this.desviar(r, seg);
      if (r.queda <= 0) r.offset = limitar(r.offset + desvio * dt * 2.2, -0.8, 0.8);
      const antes = r.z;
      r.z += r.vel * dt;
      if (r.z >= this.comprimento) {
        r.z -= this.comprimento;
        r.volta += 1;
      }
      if (r.z < antes && r.volta > this.voltasTotal) r.terminou = true;
      this.achar(r.z).carros.push(r);
    }
  }

  private desviar(r: Rival, seg: Segmento): number {
    const segJogador = this.achar(this.posicao + POS_JOGADOR).index;
    for (let i = 1; i < 18; i++) {
      const s = this.segs[(seg.index + i) % this.segs.length]!;
      for (const o of s.carros) {
        if (o !== r && r.vel > o.vel && sobrepoe(r.offset, o.offset)) {
          const dir =
            o.offset === r.offset ? (r.offset > 0 ? -1 : 1) : o.offset > r.offset ? -1 : 1;
          return dir / i;
        }
      }
      // O jogador também é obstáculo.
      if (s.index === segJogador && r.vel > this.vel && sobrepoe(r.offset, this.x)) {
        return (this.x > r.offset ? -1 : 1) / i;
      }
    }
    // Sem ninguém à frente, volta devagar para o meio da pista.
    if (r.offset < -0.5) return 0.3;
    if (r.offset > 0.5) return -0.3;
    return 0;
  }

  /** Fumaça branca saindo dos pneus traseiros quando o carro derrapa. */
  private atualizarFumaca(dt: number) {
    if (this.derrapando) {
      for (const lado of [-1, 1]) {
        this.fumaca.push({
          x: LARGURA / 2 + lado * LARGURA * 0.12 + (Math.random() - 0.5) * 8,
          y: ALTURA - 10,
          r: 5 + Math.random() * 4,
          vx: (Math.random() - 0.5) * 40 - lado * 12,
          vy: -(14 + Math.random() * 26),
          vida: 1,
        });
      }
    }
    for (const f of this.fumaca) {
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.r += 34 * dt;
      f.vida -= 1.5 * dt;
    }
    this.fumaca = this.fumaca.filter((f) => f.vida > 0).slice(-60);
  }

  private aplicarEfeito(tipo: TipoSprite) {
    const som = this.op.som;
    switch (tipo) {
      case "cone":
        this.vel *= 0.45;
        this.piscar = 0.5;
        som?.batida();
        break;
      case "caixa":
        this.vel *= 0.5;
        this.piscar = 0.5;
        som?.batida();
        break;
      case "pneus":
        this.vel *= 0.3;
        this.piscar = 0.7;
        som?.batida();
        break;
      case "barreira":
        this.vel *= 0.2;
        this.piscar = 0.9;
        this.x += this.x > 0 ? -0.15 : 0.15;
        som?.batida();
        break;
      case "buraco":
        this.vel *= 0.7;
        this.solavanco = 0.45;
        som?.batida();
        break;
      case "poca":
        this.vel *= 0.85;
        this.escorregaAte = this.tempoCena + 1.4;
        break;
      case "turbo":
        this.turboAte = this.tempoCena + 1.8;
        this.vel = Math.min(VEL_MAX * 1.3, this.vel + VEL_MAX * 0.2);
        som?.turbo();
        break;
    }
  }

  private terminarJogador() {
    this.terminou = true;
    const total = this.comprimento * this.voltasTotal;
    let posicao = 1;
    for (const r of this.rivais) {
      const prog = (r.volta - 1) * this.comprimento + r.z;
      if (r.terminou || prog >= total) posicao += 1;
    }
    const segundos = this.tempo;
    this.op.som?.fim(posicao <= 3);
    this.op.aoTerminar(posicao, segundos, {
      voltasFeitas: Math.min(this.volta - 1, this.voltasTotal),
      metros: Math.round(this.distancia / 20),
    });
  }

  /** Modo tempo: o relógio zerou; quem estiver mais à frente na corrida ganha. */
  private terminarPorTempo() {
    this.terminou = true;
    const posicao = this.classificacao();
    this.op.som?.fim(posicao <= 3);
    this.op.aoTerminar(posicao, this.op.tempoLimite, {
      voltasFeitas: this.volta - 1,
      metros: Math.round(this.distancia / 20),
    });
  }

  /** Cada volta novas as caixas, cones e poças voltam ao lugar. */
  private reabrirObstaculos() {
    for (const seg of this.segs) for (const s of seg.sprites) s.batido = false;
  }

  private classificacao(): number {
    const meu = (this.volta - 1) * this.comprimento + this.posicao + POS_JOGADOR;
    let pos = 1;
    for (const r of this.rivais) {
      const prog = (r.volta - 1) * this.comprimento + r.z;
      if (prog > meu) pos += 1;
    }
    return pos;
  }

  private enviarHud(dt: number) {
    this.acumulaHud += dt;
    if (this.acumulaHud < 0.1) return;
    this.acumulaHud = 0;
    const hud: Hud = {
      posicao: this.classificacao(),
      total: this.rivais.length + 1,
      volta: Math.min(this.volta, this.op.modo === "voltas" ? this.op.voltas : this.volta),
      kmh: Math.round((this.vel / VEL_MAX) * KMH_MAX),
      tempoRestante:
        this.op.modo === "tempo" ? Math.max(0, Math.ceil(this.op.tempoLimite - this.tempo)) : null,
      voltasTotal: this.op.modo === "voltas" ? this.op.voltas : 0,
      voltasFeitas: Math.max(0, this.volta - 1),
    };
    const chave = `${hud.posicao}|${hud.volta}|${hud.kmh}|${hud.tempoRestante}`;
    if (chave === this.ultimoHud) return;
    this.ultimoHud = chave;
    this.op.aoMudarHud(hud);
  }

  // -------------------------------------------------------------- desenho

  private projetar(p: Ponto, camX: number, camY: number, camZ: number) {
    p.camera.x = 0 - camX;
    p.camera.y = p.mundo.y - camY;
    p.camera.z = p.mundo.z - camZ;
    p.tela.scale = CAMERA_PROF / p.camera.z;
    p.tela.x = Math.round(LARGURA / 2 + p.tela.scale * p.camera.x * (LARGURA / 2));
    p.tela.y = Math.round(ALTURA / 2 - p.tela.scale * p.camera.y * (ALTURA / 2));
    p.tela.w = Math.round(p.tela.scale * PISTA * (LARGURA / 2));
  }

  private poligono(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number,
    cor: string,
  ) {
    const c = this.ctx;
    c.fillStyle = cor;
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.lineTo(x3, y3);
    c.lineTo(x4, y4);
    c.closePath();
    c.fill();
  }

  /** Faixas laterais brancas, marcas de pneu no asfalto e guard-rail. */
  private detalhesPista(seg: Segmento, n: number, nev: number) {
    const { p1, p2 } = seg;
    const borda = misturar("#f1f5f9", this.tema.nevoa, nev);
    for (const lado of [-1, 1]) {
      const a1 = p1.tela.x + lado * p1.tela.w * 0.93;
      const a2 = p2.tela.x + lado * p2.tela.w * 0.93;
      const l1 = p1.tela.w / 40;
      const l2 = p2.tela.w / 40;
      this.poligono(
        a1 - l1,
        p1.tela.y,
        a1 + l1,
        p1.tela.y,
        a2 + l2,
        p2.tela.y,
        a2 - l2,
        p2.tela.y,
        borda,
      );
    }
    if (n < 55) {
      for (const lado of [-1, 1]) {
        const a1 = p1.tela.x + lado * p1.tela.w * 0.32;
        const a2 = p2.tela.x + lado * p2.tela.w * 0.32;
        const l1 = p1.tela.w * 0.1;
        const l2 = p2.tela.w * 0.1;
        this.poligono(
          a1 - l1,
          p1.tela.y,
          a1 + l1,
          p1.tela.y,
          a2 + l2,
          p2.tela.y,
          a2 - l2,
          p2.tela.y,
          "rgba(0,0,0,0.11)",
        );
      }
    }
    if (this.tema.guarda) {
      const metal = misturar("#c5ccd6", this.tema.nevoa, nev);
      const sombra = misturar("#7b8594", this.tema.nevoa, nev);
      for (const lado of [-1, 1]) {
        const o = 1.3;
        const x1 = p1.tela.x + lado * p1.tela.w * o;
        const x2 = p2.tela.x + lado * p2.tela.w * o;
        const h1 = p1.tela.w * 0.085;
        const h2 = p2.tela.w * 0.085;
        this.poligono(
          x1,
          p1.tela.y - h1 * 0.5,
          x1,
          p1.tela.y - h1,
          x2,
          p2.tela.y - h2,
          x2,
          p2.tela.y - h2 * 0.5,
          metal,
        );
        this.poligono(
          x1,
          p1.tela.y,
          x1,
          p1.tela.y - h1 * 0.5,
          x2,
          p2.tela.y - h2 * 0.5,
          x2,
          p2.tela.y,
          sombra,
        );
        if (seg.index % 4 === 0) {
          const pw = p1.tela.w * 0.02;
          this.poligono(
            x1 - pw,
            p1.tela.y,
            x1 + pw,
            p1.tela.y,
            x1 + pw,
            p1.tela.y - h1 * 1.25,
            x1 - pw,
            p1.tela.y - h1 * 1.25,
            sombra,
          );
        }
      }
    }
  }

  /** Fundo: foto panorâmica (espelhada nas emendas) ou, sem ela, o céu desenhado em código. */
  private desenharFundoCena(c: CanvasRenderingContext2D) {
    const img = this.foto;
    const f = this.tema.foto;
    if (img && f && img.complete && img.naturalWidth > 0) {
      const larg = 1100;
      const alt = (larg * img.naturalHeight) / img.naturalWidth;
      const topo = ALTURA / 2 - f.horizonte * alt;
      const volta = larg * 2;
      const off = (((this.ceuOff * 0.6) % volta) + volta) % volta;
      const t0 = Math.floor(off / larg);
      c.save();
      c.beginPath();
      c.rect(0, 0, LARGURA, ALTURA / 2 + 2);
      c.clip();
      for (let k = 0; k < 3; k++) {
        const t = t0 + k;
        const x = t * larg - off;
        if (x > LARGURA || x + larg < 0) continue;
        if (t % 2 !== 0) {
          c.save();
          c.translate(x + larg, 0);
          c.scale(-1, 1);
          c.drawImage(img, 0, topo, larg, alt);
          c.restore();
        } else {
          c.drawImage(img, x, topo, larg, alt);
        }
      }
      c.restore();
      return;
    }
    desenharCeu(c, this.tema, this.ceuOff, this.tempoCena);
    desenharFundo(c, this.tema, this.ceuOff, this.tempoCena);
  }

  private desenhar() {
    const c = this.ctx;
    const base = this.achar(this.posicao);
    const basePct = (this.posicao % SEG) / SEG;
    const segJog = this.achar(this.posicao + POS_JOGADOR);
    const jogPct = ((this.posicao + POS_JOGADOR) % SEG) / SEG;
    const jogY = interpolar(segJog.p1.mundo.y, segJog.p2.mundo.y, jogPct);

    c.clearRect(0, 0, LARGURA, ALTURA);
    this.desenharFundoCena(c);
    // Chão até o horizonte; os segmentos pintam por cima.
    c.fillStyle = this.tema.chao[0]!;
    c.fillRect(0, ALTURA / 2, LARGURA, ALTURA / 2);

    let maxY = ALTURA;
    let x = 0;
    let dx = -(base.curva * basePct);

    for (let n = 0; n < VISAO; n++) {
      const seg = this.segs[(base.index + n) % this.segs.length]!;
      seg.looped = seg.index < base.index;
      seg.clip = maxY;
      const cz = this.posicao - (seg.looped ? this.comprimento : 0);
      this.projetar(seg.p1, this.x * PISTA - x, jogY + CAMERA_ALTURA, cz);
      this.projetar(seg.p2, this.x * PISTA - x - dx, jogY + CAMERA_ALTURA, cz);
      x += dx;
      dx += seg.curva;

      if (seg.p1.camera.z <= CAMERA_PROF || seg.p2.tela.y >= seg.p1.tela.y || seg.p2.tela.y >= maxY)
        continue;

      const { p1, p2 } = seg;
      // Perspectiva atmosférica: quanto mais longe, mais a cor se mistura com o horizonte.
      const nev = Math.min(0.92, Math.pow(n / VISAO, 1.5) * 1.05);
      const corChao = misturar(seg.cores.chao, this.tema.nevoa, nev);
      const corZebra = misturar(seg.cores.zebra, this.tema.nevoa, nev);
      const corAsfalto = misturar(seg.cores.asfalto, this.tema.nevoa, nev);
      // chão
      c.fillStyle = corChao;
      c.fillRect(0, p2.tela.y, LARGURA, p1.tela.y - p2.tela.y);
      // zebra
      const z1 = p1.tela.w / 6;
      const z2 = p2.tela.w / 6;
      this.poligono(
        p1.tela.x - p1.tela.w - z1,
        p1.tela.y,
        p1.tela.x - p1.tela.w,
        p1.tela.y,
        p2.tela.x - p2.tela.w,
        p2.tela.y,
        p2.tela.x - p2.tela.w - z2,
        p2.tela.y,
        corZebra,
      );
      this.poligono(
        p1.tela.x + p1.tela.w + z1,
        p1.tela.y,
        p1.tela.x + p1.tela.w,
        p1.tela.y,
        p2.tela.x + p2.tela.w,
        p2.tela.y,
        p2.tela.x + p2.tela.w + z2,
        p2.tela.y,
        corZebra,
      );
      // asfalto
      this.poligono(
        p1.tela.x - p1.tela.w,
        p1.tela.y,
        p1.tela.x + p1.tela.w,
        p1.tela.y,
        p2.tela.x + p2.tela.w,
        p2.tela.y,
        p2.tela.x - p2.tela.w,
        p2.tela.y,
        corAsfalto,
      );
      this.detalhesPista(seg, n, nev);
      // faixas
      if (seg.cores.faixa) {
        const l1 = p1.tela.w / 32;
        const l2 = p2.tela.w / 32;
        for (const f of [-1 / 3, 1 / 3]) {
          const a1 = p1.tela.x + p1.tela.w * f;
          const a2 = p2.tela.x + p2.tela.w * f;
          this.poligono(
            a1 - l1 / 2,
            p1.tela.y,
            a1 + l1 / 2,
            p1.tela.y,
            a2 + l2 / 2,
            p2.tela.y,
            a2 - l2 / 2,
            p2.tela.y,
            misturar(seg.cores.faixa, this.tema.nevoa, nev),
          );
        }
      }
      maxY = p1.tela.y;
    }

    desenharNevoa(c, this.tema);

    // Objetos, de trás para a frente.
    for (let n = VISAO - 1; n > 0; n--) {
      const seg = this.segs[(base.index + n) % this.segs.length]!;
      for (const s of seg.sprites) {
        if (s.batido || seg.p1.camera.z <= CAMERA_PROF) continue;
        const escala = seg.p1.tela.scale;
        const sx = seg.p1.tela.x + escala * s.offset * PISTA * (LARGURA / 2);
        const sy = seg.p1.tela.y;
        const larg = escala * PISTA * (LARGURA / 2) * LARGURA_SPRITE[s.tipo] * 2;
        if (sy < seg.clip - 1 || seg.clip >= ALTURA) {
          c.save();
          c.beginPath();
          c.rect(0, 0, LARGURA, seg.clip);
          c.clip();
          desenharObjeto(
            c,
            s.tipo,
            sx,
            sy,
            larg,
            s.sem,
            Math.min(1, Math.pow(n / VISAO, 1.35)),
            this.tema,
          );
          c.restore();
        }
      }
      for (const r of seg.carros) {
        if (seg.p1.camera.z <= CAMERA_PROF) continue;
        const pct = (r.z % SEG) / SEG;
        const escala = interpolar(seg.p1.tela.scale, seg.p2.tela.scale, pct);
        const sx =
          interpolar(seg.p1.tela.x, seg.p2.tela.x, pct) + escala * r.offset * PISTA * (LARGURA / 2);
        const sy = interpolar(seg.p1.tela.y, seg.p2.tela.y, pct);
        const larg = escala * PISTA * (LARGURA / 2) * ANCHO_CARRO;
        c.save();
        c.beginPath();
        c.rect(0, 0, LARGURA, seg.clip);
        c.clip();
        if (this.op.veiculo === "moto") {
          desenharMoto(c, sx, sy, larg * 1.15, r.cor, {
            faseRoda: r.z / 12,
            queda: r.queda > 0 ? r.ladoQueda * (1 - r.queda / 1.15) * 1.15 : 0,
            piloto: {
              camisa: r.cor,
              calca: "#1f2937",
              capacete: r.cor === CARROS[0]!.cor ? "#0b0f14" : "#f8fafc",
              mochila: false,
            },
          });
        } else desenharCarro(c, sx, sy, larg, r.cor, { freando: false });
        c.restore();
      }
    }

    // Fumaça dos pneus (atrás do carro)
    for (const f of this.fumaca) {
      const g = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      g.addColorStop(0, `rgba(235,235,235,${0.5 * f.vida})`);
      g.addColorStop(1, "rgba(235,235,235,0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      c.fill();
    }

    // Jogador
    const trepida =
      (this.vel > 0 ? Math.sin(this.distancia / 90) * (this.vel / VEL_MAX) * 1.5 : 0) +
      (this.solavanco > 0 ? (Math.random() - 0.5) * 14 * (this.solavanco / 0.45) : 0);
    const dirVisual =
      this.entrada.volante !== 0
        ? this.entrada.volante
        : (this.entrada.direita ? 1 : 0) - (this.entrada.esquerda ? 1 : 0);
    const inclina = dirVisual * 0.045 * (this.vel / VEL_MAX);
    if (this.piscar <= 0 || Math.floor(this.piscar * 20) % 2 === 0) {
      if (this.op.veiculo === "moto") {
        desenharMoto(c, LARGURA / 2, ALTURA - 12 + trepida, LARGURA * 0.3, this.op.corJogador, {
          inclinacao: inclina,
          freando: this.freando,
          faseRoda: this.distancia / 10,
          ...(this.op.piloto ? { piloto: this.op.piloto } : {}),
        });
      } else {
        desenharCarro(c, LARGURA / 2, ALTURA - 12 + trepida, LARGURA * 0.3, this.op.corJogador, {
          inclinacao: inclina,
          freando: this.freando,
        });
      }
    }

    desenharAcabamento(c, this.tema, this.vel / VEL_MAX);

    // Linhas de velocidade nas bordas quando está rápido.
    const razao = this.vel / VEL_MAX;
    if (razao > 0.7) {
      c.strokeStyle = `rgba(255,255,255,${(razao - 0.7) * 0.5})`;
      c.lineWidth = 1.5;
      for (let i = 0; i < 10; i++) {
        const lado = i % 2 ? 1 : -1;
        const px =
          LARGURA / 2 +
          lado * (LARGURA * 0.28 + ruido(i + Math.floor(this.distancia / 400)) * LARGURA * 0.2);
        const py = ALTURA * 0.55 + ruido(i * 5) * ALTURA * 0.35;
        c.beginPath();
        c.moveTo(px, py);
        c.lineTo(px + lado * 26, py + 10);
        c.stroke();
      }
    }
  }
}
