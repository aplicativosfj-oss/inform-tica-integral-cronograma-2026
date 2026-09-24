/**
 * Desenho dos personagens, do cachorro e dos objetos do "Operação: Plantão".
 *
 * Os agentes são figuras realistas recortadas das imagens da equipe (estilo
 * "action figure"): a figura inteira balança, inclina e pula no ritmo da
 * corrida, sem precisar de dezenas de quadros de animação. Enquanto a imagem
 * não carrega, um boneco desenhado em código ocupa o lugar.
 */

import type { Personagem } from "@/components/plantao/dados";

export type Imagens = Record<string, HTMLImageElement | undefined>;

// ------------------------------------------------------------------ utilidades

export function sombra(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry = rx * 0.32,
) {
  const g = ctx.createRadialGradient(x, y, 1, x, y, rx);
  g.addColorStop(0, "rgba(0,0,0,0.42)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  ctx.translate(-x, -y);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function capsula(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  larg: number,
  cor: string,
) {
  ctx.strokeStyle = cor;
  ctx.lineWidth = larg;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// ------------------------------------------------------------------ agentes

export interface PoseAgente {
  /** Direção horizontal (1 = direita, -1 = esquerda). */
  dir: number;
  /** Fase do ciclo de corrida, em radianos. */
  fase: number;
  correndo: boolean;
  parado: boolean;
  /** Quantas marmitas leva nos braços. */
  carga: number;
  /** Sacudida de dano (0 a 1). */
  dano?: number;
  /** Escala do boneco. */
  escala?: number;
  /** Levanta o braço (pegando algo). */
  bracoAlto?: number;
}

export const ALTURA_AGENTE = 100;

function pronta(i: HTMLImageElement | undefined): i is HTMLImageElement {
  return !!i && i.complete && i.naturalWidth > 0;
}

function marmitasNasMaos(ctx: CanvasRenderingContext2D, alto: number, qtd: number) {
  for (let i = 0; i < Math.min(qtd, 5); i++) {
    ctx.fillStyle = i % 2 ? "#f1f5f9" : "#e2e8f0";
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(4, -alto * 0.4 - i * 6, 20, 7, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(9, -alto * 0.4 + 1 - i * 6, 10, 1.6);
  }
}

/**
 * Desenha uma figura realista (recorte) com animação de corrida: quique,
 * inclinação para a frente, balanço e sombra. (x, y) é o ponto dos pés.
 * Quando o recorte não tem pernas (`pernas` > 0), elas são desenhadas em código.
 */
export function desenharFigura(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  img: HTMLImageElement,
  altura: number,
  pernas: number,
  corCalca: string,
  corBota: string,
  pose: PoseAgente,
) {
  const e = pose.escala ?? 1;
  const andando = !pose.parado;
  const ritmo = pose.correndo ? 1.25 : 1;
  const passo = Math.sin(pose.fase);
  const quique = andando ? Math.abs(passo) * 4.2 * ritmo : 0;
  const inclina = andando ? passo * 0.05 + (pose.correndo ? 0.1 : 0.035) : 0;
  const respira = andando
    ? 1 + Math.sin(pose.fase * 2) * 0.014
    : 1 + Math.sin(pose.fase * 0.4) * 0.012;
  const alto = pose.bracoAlto ?? 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(e * pose.dir, e);
  if (pose.dano) ctx.translate((Math.random() - 0.5) * 6 * pose.dano, 0);
  sombra(ctx, 0, 0, 24 - quique * 0.6, 8 - quique * 0.2);

  const hFig = altura * (1 - pernas);
  const hPernas = altura * pernas;
  const wFig = (img.naturalWidth / img.naturalHeight) * hFig;

  ctx.translate(0, -quique);
  if (pernas > 0) {
    const sw = andando ? passo * 6 : 0;
    for (const lado of [-1, 1]) {
      const px = lado * wFig * 0.17;
      const dx = lado * sw * (pose.correndo ? 0.9 : 0.6);
      ctx.fillStyle = corCalca;
      ctx.beginPath();
      ctx.roundRect(px - 6 + dx * 0.5, -hPernas, 12, hPernas - 3, 3);
      ctx.fill();
      ctx.fillStyle = corBota;
      ctx.beginPath();
      ctx.roundRect(px - 7 + dx, -5, 15, 6, 2);
      ctx.fill();
    }
  }
  // tronco e cabeça: giram em torno dos quadris
  ctx.translate(0, -hPernas);
  ctx.rotate(inclina);
  ctx.scale(1, respira + alto * 0.03);
  if (pose.dano) ctx.globalAlpha = 0.65 + Math.sin(pose.fase * 30) * 0.3;
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 5;
  ctx.drawImage(img, -wFig / 2, -hFig, wFig, hFig);
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
  if (pose.carga > 0) marmitasNasMaos(ctx, hFig, pose.carga);
  ctx.restore();
}

/** (x, y) é o ponto dos pés. */
export function desenharAgente(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  p: Personagem,
  rosto: HTMLImageElement | undefined,
  pose: PoseAgente,
  sprite?: HTMLImageElement,
) {
  if (pronta(sprite)) {
    desenharFigura(ctx, x, y, sprite, ALTURA_AGENTE, p.pernas, p.calca, p.bota, pose);
    return;
  }
  const e = pose.escala ?? 1;
  const bal = pose.parado ? Math.sin(pose.fase * 0.4) * 0.6 : Math.sin(pose.fase * 2) * 1.6;
  const pernaSwing = pose.parado ? 0 : Math.sin(pose.fase) * (pose.correndo ? 11 : 7);
  const bracoSwing = pose.parado ? 0 : -Math.sin(pose.fase) * (pose.correndo ? 10 : 6);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(e * pose.dir, e);
  if (pose.dano) ctx.translate((Math.random() - 0.5) * 5 * pose.dano, 0);

  sombra(ctx, 0, 0, 20);

  // pernas
  const cPerna = p.calca;
  capsula(ctx, -5, -12, -5 + pernaSwing * 0.5, -1, 9, cPerna);
  capsula(ctx, 5, -12, 5 - pernaSwing * 0.5, -1, 9, cPerna);
  // botas
  ctx.fillStyle = p.bota;
  ctx.beginPath();
  ctx.ellipse(-5 + pernaSwing * 0.5 + 2, -1, 7, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(5 - pernaSwing * 0.5 + 2, -1, 7, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // mochila (atrás do tronco)
  if (p.mochila) {
    ctx.fillStyle = "#1c1c20";
    ctx.beginPath();
    ctx.roundRect(-16, -38 + bal, 12, 22, 4);
    ctx.fill();
    ctx.fillStyle = "#2b2b31";
    ctx.fillRect(-14, -34 + bal, 8, 4);
  }

  // tronco
  const gT = ctx.createLinearGradient(-10, -36, 10, -12);
  gT.addColorStop(0, p.camisa);
  gT.addColorStop(1, "#000000");
  ctx.fillStyle = p.camisa;
  ctx.beginPath();
  ctx.roundRect(-11, -38 + bal, 22, 27, 7);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.roundRect(1, -38 + bal, 10, 27, 7);
  ctx.fill();
  void gT;
  // cinto
  ctx.fillStyle = "#101010";
  ctx.fillRect(-11, -16 + bal, 22, 4);
  ctx.fillStyle = "#d4af37";
  ctx.fillRect(-2, -16 + bal, 4, 4);
  // distintivo
  ctx.fillStyle = "#e6c24a";
  ctx.beginPath();
  ctx.moveTo(3, -32 + bal);
  ctx.lineTo(8, -32 + bal);
  ctx.lineTo(8, -26 + bal);
  ctx.lineTo(5.5, -23 + bal);
  ctx.lineTo(3, -26 + bal);
  ctx.closePath();
  ctx.fill();

  // braços (com marmitas quando carrega)
  const corBraco = p.lego ? p.pele : p.pele;
  const corManga = p.camisa;
  const alto = pose.bracoAlto ?? 0;
  if (pose.carga > 0) {
    capsula(ctx, -9, -32 + bal, 8, -22 + bal, 6, corManga);
    capsula(ctx, 9, -32 + bal, 8, -22 + bal, 6, corManga);
    ctx.fillStyle = corBraco;
    ctx.beginPath();
    ctx.arc(9, -22 + bal, 3.4, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < Math.min(pose.carga, 5); i++) {
      ctx.fillStyle = i % 2 ? "#f1f5f9" : "#e2e8f0";
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(4, -30 + bal - i * 5, 17, 6, 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(8, -29 + bal - i * 5, 9, 1.5);
    }
  } else {
    capsula(ctx, -9, -33 + bal, -11 + bracoSwing * 0.4, -20 + bal, 6, corManga);
    capsula(
      ctx,
      9,
      -33 + bal,
      11 - bracoSwing * 0.4 + alto * 6,
      -20 + bal - alto * 16,
      6,
      corManga,
    );
    ctx.fillStyle = corBraco;
    ctx.beginPath();
    ctx.arc(-11 + bracoSwing * 0.4, -19 + bal, 3.4, 0, Math.PI * 2);
    ctx.arc(11 - bracoSwing * 0.4 + alto * 6, -19 + bal - alto * 16, 3.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // cabeça: foto do rosto num círculo com borda
  const cy = -55 + bal;
  const r = 19;
  ctx.fillStyle = p.pele;
  ctx.beginPath();
  ctx.arc(0, cy, r + 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, cy, r, 0, Math.PI * 2);
  ctx.clip();
  if (rosto && rosto.complete && rosto.naturalWidth > 0) {
    // o rosto olha sempre para o lado em que o boneco anda
    ctx.scale(1, 1);
    ctx.drawImage(rosto, -r, cy - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = p.pele;
    ctx.fillRect(-r, cy - r, r * 2, r * 2);
  }
  ctx.restore();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, cy, r + 1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = p.camisa;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, cy, r + 2.6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/** Cabeça avatar (círculo com a foto) para HUD e minimapa. */
export function desenharAvatar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rosto: HTMLImageElement | undefined,
  cor: string,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  if (rosto && rosto.complete && rosto.naturalWidth > 0)
    ctx.drawImage(rosto, x - r, y - r, r * 2, r * 2);
  else {
    ctx.fillStyle = cor;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.restore();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

/** Funcionário genérico (cozinha, administração, portaria). */
export function desenharNpc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cor: { camisa: string; calca: string; pele: string; cabelo: string; chapeu?: string },
  dir: number,
  fase: number,
  parado = false,
) {
  const bal = parado ? 0 : Math.sin(fase * 2) * 1.4;
  const sw = parado ? 0 : Math.sin(fase) * 6;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  sombra(ctx, 0, 0, 17);
  capsula(ctx, -4, -11, -4 + sw * 0.5, -1, 8, cor.calca);
  capsula(ctx, 4, -11, 4 - sw * 0.5, -1, 8, cor.calca);
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.ellipse(-4 + sw * 0.5 + 2, -1, 6, 3.5, 0, 0, Math.PI * 2);
  ctx.ellipse(4 - sw * 0.5 + 2, -1, 6, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = cor.camisa;
  ctx.beginPath();
  ctx.roundRect(-10, -33 + bal, 20, 24, 6);
  ctx.fill();
  capsula(ctx, -8, -29 + bal, -10 + sw * 0.3, -17 + bal, 5.5, cor.camisa);
  capsula(ctx, 8, -29 + bal, 10 - sw * 0.3, -17 + bal, 5.5, cor.camisa);
  ctx.fillStyle = cor.pele;
  ctx.beginPath();
  ctx.arc(0, -44 + bal, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = cor.cabelo;
  ctx.beginPath();
  ctx.arc(0, -47 + bal, 12, Math.PI, 0);
  ctx.fill();
  if (cor.chapeu) {
    ctx.fillStyle = cor.chapeu;
    ctx.beginPath();
    ctx.arc(0, -49 + bal, 12.5, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-13, -50 + bal, 26, 3);
  }
  ctx.fillStyle = "#1c1917";
  ctx.beginPath();
  ctx.arc(4, -44 + bal, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------------ cachorro

export interface CorCachorro {
  pelo: string;
  sombra: string;
  orelha: string;
}

export const CACHORROS: CorCachorro[] = [
  { pelo: "#c98a4d", sombra: "#8e5b2a", orelha: "#6d4320" },
  { pelo: "#26211f", sombra: "#0f0c0b", orelha: "#0a0807" },
  { pelo: "#b9955b", sombra: "#6d5230", orelha: "#2b2114" },
];

export function desenharCachorro(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cor: CorCachorro,
  dir: number,
  fase: number,
  correndo: boolean,
  susto: number,
) {
  const sw = Math.sin(fase * (correndo ? 1.4 : 1)) * (correndo ? 9 : 4);
  const sal = correndo ? Math.abs(Math.sin(fase * 1.4)) * 4 : 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  sombra(ctx, 0, 0, 22);
  // patas
  const pata = (px: number, off: number) =>
    capsula(ctx, px, -9 - sal, px + off, -1, 4.6, cor.sombra);
  pata(-13, sw);
  pata(-7, -sw);
  pata(8, -sw);
  pata(14, sw);
  // rabo abanando
  ctx.strokeStyle = cor.pelo;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-19, -17 - sal);
  ctx.quadraticCurveTo(-27, -27 - sal + Math.sin(fase * 3) * 5, -25, -33 - sal);
  ctx.stroke();
  // corpo
  const g = ctx.createLinearGradient(0, -28, 0, -8);
  g.addColorStop(0, cor.pelo);
  g.addColorStop(1, cor.sombra);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(-2, -17 - sal, 21, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  // cabeça
  ctx.fillStyle = cor.pelo;
  ctx.beginPath();
  ctx.ellipse(19, -24 - sal, 10, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = cor.sombra;
  ctx.beginPath();
  ctx.ellipse(27, -21 - sal, 6.5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0b0b0b";
  ctx.beginPath();
  ctx.arc(31, -22 - sal, 2.3, 0, Math.PI * 2);
  ctx.fill();
  // orelha
  ctx.fillStyle = cor.orelha;
  ctx.beginPath();
  ctx.ellipse(15, -30 - sal, 4, 8, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // olho
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(22, -26 - sal, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(22.6, -26 - sal, 1.4, 0, Math.PI * 2);
  ctx.fill();
  // coleira
  ctx.strokeStyle = "#dc2626";
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(11, -21 - sal, 8, 1.8, 3.9);
  ctx.stroke();
  ctx.restore();
  if (susto > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, susto);
    ctx.fillStyle = "#fde047";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("!", x, y - 50);
    ctx.restore();
  }
}

// ------------------------------------------------------------------ objetos

/** Bloco com altura: face de cima clara, frente escura e lateral. */
export function bloco(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  alt: number,
  topo: string,
  frente: string,
  lado?: string,
) {
  // sombra projetada
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(x + 6, y + h - 2, w, alt * 0.5 + 6);
  // frente
  const g = ctx.createLinearGradient(0, y + h - alt, 0, y + h + 2);
  g.addColorStop(0, frente);
  g.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = frente;
  ctx.fillRect(x, y + h - alt, w, alt);
  ctx.fillStyle = g;
  ctx.fillRect(x, y + h - alt, w, alt);
  // topo
  ctx.fillStyle = topo;
  ctx.fillRect(x, y - alt, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.fillRect(x, y - alt, w, 3);
  if (lado) {
    ctx.fillStyle = lado;
    ctx.fillRect(x + w - 4, y - alt, 4, h + alt);
  }
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y - alt + 0.5, w - 1, h + alt - 1);
}

export function desenharCone(ctx: CanvasRenderingContext2D, x: number, y: number, esc = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(esc, esc);
  sombra(ctx, 0, 0, 12);
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(-10, -3, 20, 4);
  const g = ctx.createLinearGradient(-8, 0, 8, 0);
  g.addColorStop(0, "#fb923c");
  g.addColorStop(1, "#c2410c");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-8, -3);
  ctx.lineTo(-2, -26);
  ctx.lineTo(2, -26);
  ctx.lineTo(8, -3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f8fafc";
  ctx.beginPath();
  ctx.moveTo(-5.5, -12);
  ctx.lineTo(5.5, -12);
  ctx.lineTo(4, -17);
  ctx.lineTo(-4, -17);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function desenharMarmita(ctx: CanvasRenderingContext2D, x: number, y: number, brilho = 0) {
  ctx.save();
  ctx.translate(x, y);
  if (brilho) {
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 8 + brilho * 8;
  }
  ctx.fillStyle = "#f8fafc";
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-10, -12, 20, 12, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(-6, -8, 12, 2);
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(-11, -14, 22, 3);
  ctx.restore();
}

export function desenharBreve(ctx: CanvasRenderingContext2D, x: number, y: number, brilho = 0) {
  ctx.save();
  ctx.translate(x, y);
  if (brilho) {
    ctx.shadowColor = "#fde047";
    ctx.shadowBlur = 8 + brilho * 8;
  }
  ctx.fillStyle = "#fefce8";
  ctx.strokeStyle = "#a16207";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(-8, -18, 16, 20, 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#a16207";
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-5, -14 + i * 4);
    ctx.lineTo(5, -14 + i * 4);
    ctx.stroke();
  }
  ctx.fillStyle = "#dc2626";
  ctx.fillRect(-8, -18, 16, 3);
  ctx.restore();
}

export function desenharCafe(ctx: CanvasRenderingContext2D, x: number, y: number, brilho = 0) {
  ctx.save();
  ctx.translate(x, y);
  if (brilho) {
    ctx.shadowColor = "#f59e0b";
    ctx.shadowBlur = 8 + brilho * 8;
  }
  ctx.fillStyle = "#f8fafc";
  ctx.beginPath();
  ctx.roundRect(-7, -14, 14, 14, [2, 2, 5, 5]);
  ctx.fill();
  ctx.fillStyle = "#78350f";
  ctx.fillRect(-6, -13, 12, 3);
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(8, -8, 3.5, -1.2, 1.2);
  ctx.stroke();
  ctx.restore();
}

export function desenharGarrafa(ctx: CanvasRenderingContext2D, x: number, y: number, brilho = 0) {
  ctx.save();
  ctx.translate(x, y);
  if (brilho) {
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 8 + brilho * 8;
  }
  ctx.fillStyle = "rgba(125,211,252,0.85)";
  ctx.beginPath();
  ctx.roundRect(-5, -22, 10, 22, 4);
  ctx.fill();
  ctx.fillStyle = "#0ea5e9";
  ctx.fillRect(-3, -26, 6, 5);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillRect(-3, -19, 2, 14);
  ctx.restore();
}

export function desenharPlaca(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  texto: string,
  cor = "#facc15",
) {
  ctx.save();
  ctx.translate(x, y);
  sombra(ctx, 0, 0, 16);
  ctx.fillStyle = "#374151";
  ctx.fillRect(-1.5, -26, 3, 26);
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.roundRect(-14, -46, 28, 22, 4);
  ctx.fill();
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = "#111827";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(texto, 0, -30);
  ctx.restore();
}

export function desenharArvore(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  esc = 1,
  tom = 0,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(esc, esc);
  sombra(ctx, 0, 0, 34);
  ctx.fillStyle = "#5b3a1e";
  ctx.fillRect(-5, -34, 10, 34);
  const cores = ["#2f9a4f", "#3fae4a", "#278a46"];
  for (let i = 0; i < 3; i++) {
    const g = ctx.createRadialGradient(-8 + i * 8, -66 - i * 4, 4, 0, -56, 34);
    g.addColorStop(0, "#5cd06a");
    g.addColorStop(1, cores[(i + tom) % 3]!);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(-16 + i * 16, -52 - (i === 1 ? 14 : 0), 24, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function desenharPoste(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  sombra(ctx, 0, 0, 10);
  ctx.fillStyle = "#374151";
  ctx.fillRect(-2, -74, 4, 74);
  ctx.fillStyle = "#e5e7eb";
  ctx.fillRect(-10, -78, 20, 6);
  ctx.restore();
}

export function desenharViatura(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tempo: number,
) {
  ctx.save();
  ctx.translate(x, y);
  sombra(ctx, 0, 0, 62, 16);
  const corpo = ctx.createLinearGradient(0, -44, 0, 0);
  corpo.addColorStop(0, "#1f2937");
  corpo.addColorStop(1, "#0b0f14");
  ctx.fillStyle = corpo;
  ctx.beginPath();
  ctx.roundRect(-62, -38, 124, 36, 9);
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.roundRect(-34, -58, 68, 24, [10, 10, 2, 2]);
  ctx.fill();
  ctx.fillStyle = "rgba(125,211,252,0.55)";
  ctx.fillRect(-28, -54, 24, 16);
  ctx.fillRect(2, -54, 26, 16);
  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 9px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SOCIOEDUCATIVO", 0, -20);
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(-38, -3, 9, 0, Math.PI * 2);
  ctx.arc(38, -3, 9, 0, Math.PI * 2);
  ctx.fill();
  const pisca = Math.floor(tempo * 5) % 2 === 0;
  ctx.fillStyle = pisca ? "#ef4444" : "#3b82f6";
  ctx.fillRect(-16, -62, 14, 5);
  ctx.fillStyle = pisca ? "#3b82f6" : "#ef4444";
  ctx.fillRect(2, -62, 14, 5);
  ctx.restore();
}

export function desenharCarrinho(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  sombra(ctx, 0, 0, 30, 9);
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.roundRect(-26, -32, 42, 26, 4);
  ctx.fill();
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(-26, -32, 42, 5);
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(16, -30);
  ctx.lineTo(28, -40);
  ctx.stroke();
  ctx.fillStyle = "#0ea5e9";
  ctx.fillRect(-18, -40, 8, 10);
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(-16, -4, 5, 0, Math.PI * 2);
  ctx.arc(10, -4, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function desenharPisoMolhado(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(56,189,248,0.22)";
  ctx.beginPath();
  ctx.ellipse(0, 0, 46, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.lineTo(11, 0);
  ctx.lineTo(-11, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("!", 0, -6);
  ctx.restore();
}

// ------------------------------------------------------------------ padrões de chão

export type TipoChao = "concreto" | "azulejo" | "carpete" | "asfalto" | "grama";

/** Cria a textura do chão: um bloco pequeno que se repete, com "ruído" fixo. */
export function criarChao(tipo: TipoChao): HTMLCanvasElement {
  const c = document.createElement("canvas");
  const s = 96;
  c.width = s;
  c.height = s;
  const g = c.getContext("2d")!;
  const base: Record<TipoChao, [string, string]> = {
    concreto: ["#7d8794", "#737d8a"],
    azulejo: ["#e8e4da", "#d7d2c4"],
    carpete: ["#4b5a78", "#43506c"],
    asfalto: ["#3b4049", "#353a43"],
    grama: ["#4d8f4a", "#468843"],
  };
  const [a, b] = base[tipo];
  g.fillStyle = a;
  g.fillRect(0, 0, s, s);
  if (tipo === "azulejo") {
    g.fillStyle = b;
    g.fillRect(0, 0, s / 2, s / 2);
    g.fillRect(s / 2, s / 2, s / 2, s / 2);
    g.strokeStyle = "rgba(0,0,0,0.12)";
    g.lineWidth = 2;
    g.strokeRect(1, 1, s - 2, s - 2);
  } else if (tipo === "concreto") {
    g.strokeStyle = "rgba(0,0,0,0.16)";
    g.lineWidth = 2;
    g.strokeRect(1, 1, s - 2, s - 2);
    g.fillStyle = b;
    g.fillRect(s / 2, 0, s / 2, s);
  } else if (tipo === "asfalto") {
    g.fillStyle = b;
    g.fillRect(0, 0, s, s / 2);
  } else if (tipo === "carpete") {
    g.strokeStyle = "rgba(255,255,255,0.05)";
    g.lineWidth = 1;
    for (let i = 0; i < s; i += 6) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i, s);
      g.stroke();
    }
  } else {
    g.fillStyle = b;
    for (let i = 0; i < 26; i++) g.fillRect((i * 37) % s, (i * 53) % s, 3, 3);
  }
  // granulação fixa
  let seed = 7 + tipo.length;
  for (let i = 0; i < 260; i++) {
    seed = (seed * 16807) % 2147483647;
    const px = seed % s;
    seed = (seed * 16807) % 2147483647;
    const py = seed % s;
    g.fillStyle = seed % 2 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)";
    g.fillRect(px, py, 2, 2);
  }
  return c;
}
