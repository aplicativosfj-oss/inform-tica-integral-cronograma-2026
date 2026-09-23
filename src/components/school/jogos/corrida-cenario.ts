/**
 * Cenário do jogo de corrida: céu, montanhas, cidade, mar, dunas e os objetos
 * à beira da pista, desenhados em canvas com gradientes, sombras e névoa de
 * distância para dar profundidade real.
 *
 * Três ideias fazem a maior parte do trabalho realista:
 *
 * - perspectiva atmosférica: quanto mais longe, mais o objeto se mistura com a
 *   cor do horizonte (a "névoa"), como numa foto de verdade;
 * - luz: cada volume tem um lado claro e um lado na sombra, e tudo joga uma
 *   sombra suave no chão;
 * - variedade: cada árvore, prédio ou pedra usa uma semente própria, então a
 *   paisagem não repete o mesmo desenho a cada metro.
 */

export interface VisualCenario {
  ceuTopo: string;
  ceuMeio: string;
  ceuBase: string;
  nevoa: string;
  sol?: { x: number; y: number; cor: string; tamanho: number };
  longe: { tipo: TipoFundo; cor: string; neve?: boolean };
  perto: { tipo: TipoFundo; cor: string; neve?: boolean };
  nuvens: number;
  nuvemCor: string;
  estrelas: boolean;
  estilo: "dia" | "noite" | "neve" | "deserto";
}

export type TipoFundo = "predios" | "montanhas" | "mesas" | "mar" | "dunas";

export type TipoObjeto =
  | "cone"
  | "pneus"
  | "palmeira"
  | "pinheiro"
  | "cacto"
  | "predio"
  | "placa"
  | "poste"
  | "rocha"
  | "arbusto";

// ------------------------------------------------------------------- cores

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const cacheMistura = new Map<string, string>();

/** Mistura duas cores #rrggbb (t = 0 devolve a primeira, t = 1 a segunda). */
export function misturar(a: string, b: string, t: number): string {
  const q = Math.round(Math.min(Math.max(t, 0), 1) * 24);
  const chave = `${a}|${b}|${q}`;
  const guardada = cacheMistura.get(chave);
  if (guardada) return guardada;
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  const k = q / 24;
  const f = (x: number, y: number) => Math.round(x + (y - x) * k);
  const res = `rgb(${f(r1, r2)},${f(g1, g2)},${f(b1, b2)})`;
  cacheMistura.set(chave, res);
  return res;
}

/** Clareia (q > 0) ou escurece (q < 0) uma cor. */
export function tonalidade(hex: string, q: number): string {
  const [r, g, b] = rgb(hex);
  const f = (v: number) => Math.round(q >= 0 ? v + (255 - v) * q : v * (1 + q));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

function ruido(i: number): number {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Ruído de valor suave (interpolado), de 0 a 1. */
function suave(x: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const s = f * f * (3 - 2 * f);
  return ruido(i) * (1 - s) + ruido(i + 1) * s;
}

function relevo(x: number, seed: number): number {
  return (
    suave(x / 130 + seed) * 0.58 +
    suave(x / 47 + seed * 3.1) * 0.29 +
    suave(x / 17 + seed * 7.7) * 0.13
  );
}

// -------------------------------------------------------------------- céu

const LARGURA = 640;
const HORIZONTE = 180;

export function desenharCeu(
  ctx: CanvasRenderingContext2D,
  v: VisualCenario,
  deslocamento: number,
  tempo: number,
) {
  const ceu = ctx.createLinearGradient(0, 0, 0, HORIZONTE);
  ceu.addColorStop(0, v.ceuTopo);
  ceu.addColorStop(0.55, v.ceuMeio);
  ceu.addColorStop(1, v.ceuBase);
  ctx.fillStyle = ceu;
  ctx.fillRect(0, 0, LARGURA, HORIZONTE + 2);

  if (v.estrelas) {
    for (let i = 0; i < 70; i++) {
      const x =
        (ruido(i * 3.1) * LARGURA * 1.3 - deslocamento * 0.02 + LARGURA * 1.3) % (LARGURA * 1.3);
      const y = ruido(i * 7.7) * HORIZONTE * 0.62;
      const pisca = 0.35 + 0.65 * Math.abs(Math.sin(tempo * (0.8 + ruido(i) * 1.6) + i));
      ctx.fillStyle = `rgba(255,255,255,${pisca * 0.85})`;
      ctx.fillRect(x, y, ruido(i * 1.9) > 0.85 ? 2 : 1, ruido(i * 1.9) > 0.85 ? 2 : 1);
    }
  }

  if (v.sol) {
    const sx = v.sol.x * LARGURA - deslocamento * 0.03;
    const sy = v.sol.y;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const halo = ctx.createRadialGradient(sx, sy, 2, sx, sy, v.sol.tamanho * 7);
    halo.addColorStop(0, `${v.sol.cor}`);
    halo.addColorStop(0.18, "rgba(255,230,170,0.35)");
    halo.addColorStop(1, "rgba(255,200,120,0)");
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = halo;
    ctx.fillRect(
      sx - v.sol.tamanho * 7,
      sy - v.sol.tamanho * 7,
      v.sol.tamanho * 14,
      v.sol.tamanho * 14,
    );
    ctx.restore();
    const disco = ctx.createRadialGradient(sx, sy, 0, sx, sy, v.sol.tamanho);
    disco.addColorStop(0, "#ffffff");
    disco.addColorStop(1, v.sol.cor);
    ctx.fillStyle = disco;
    ctx.beginPath();
    ctx.arc(sx, sy, v.sol.tamanho, 0, Math.PI * 2);
    ctx.fill();
  }

  // nuvens macias, em várias bolhas com gradiente
  const larguraMundo = LARGURA + 360;
  for (let i = 0; i < v.nuvens; i++) {
    const base = ruido(i * 5.3) * larguraMundo;
    const x =
      ((((base - deslocamento * 0.12 - tempo * (3 + (i % 3) * 2)) % larguraMundo) + larguraMundo) %
        larguraMundo) -
      180;
    const y = 22 + ruido(i * 2.7) * 70;
    const escala = 0.7 + ruido(i * 9.1) * 0.9;
    for (let k = 0; k < 7; k++) {
      const cx = x + (k - 3) * 15 * escala;
      const cy = y + Math.sin(k * 1.7 + i) * 5 * escala;
      const r = (16 + ruido(i * 13 + k) * 12) * escala;
      const g = ctx.createRadialGradient(cx, cy - r * 0.2, r * 0.1, cx, cy, r);
      g.addColorStop(0, v.nuvemCor);
      g.addColorStop(0.65, `${v.nuvemCor}cc`);
      g.addColorStop(1, `${v.nuvemCor}00`);
      ctx.fillStyle = g;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
  }
}

// ---------------------------------------------------------------- fundo

function cordilheira(
  ctx: CanvasRenderingContext2D,
  v: VisualCenario,
  camada: VisualCenario["longe"],
  off: number,
  alt: number,
  seed: number,
  neblina: number,
) {
  const passo = 8;
  const pts: number[] = [];
  for (let x = -passo; x <= LARGURA + passo; x += passo) {
    pts.push(HORIZONTE - alt * relevo(x + off, seed) * 1.35 + alt * 0.12);
  }
  const grad = ctx.createLinearGradient(0, HORIZONTE - alt * 1.2, 0, HORIZONTE);
  grad.addColorStop(0, camada.cor);
  grad.addColorStop(
    1,
    misturar(camada.cor.startsWith("#") ? camada.cor : "#7c93ad", v.nevoa, neblina),
  );
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-passo, HORIZONTE + 2);
  pts.forEach((y, i) => ctx.lineTo(-passo + i * passo, y));
  ctx.lineTo(LARGURA + passo, HORIZONTE + 2);
  ctx.closePath();
  ctx.fill();

  // luz vinda da esquerda: encostas voltadas para o sol clareiam, as outras escurecem
  for (let i = 1; i < pts.length; i++) {
    const inclina = pts[i]! - pts[i - 1]!;
    const x = -passo + (i - 1) * passo;
    ctx.fillStyle = inclina > 0 ? "rgba(0,0,0,0.20)" : "rgba(255,255,255,0.13)";
    ctx.beginPath();
    ctx.moveTo(x, pts[i - 1]!);
    ctx.lineTo(x + passo, pts[i]!);
    ctx.lineTo(x + passo, Math.min(HORIZONTE, pts[i]! + alt * 0.55));
    ctx.lineTo(x, Math.min(HORIZONTE, pts[i - 1]! + alt * 0.55));
    ctx.closePath();
    ctx.fill();
  }

  if (camada.neve) {
    const limite = HORIZONTE - alt * 0.72;
    ctx.fillStyle = "rgba(255,255,255,0.93)";
    for (let i = 1; i < pts.length; i++) {
      if (pts[i]! > limite && pts[i - 1]! > limite) continue;
      const x = -passo + (i - 1) * passo;
      const y0 = pts[i - 1]!;
      const y1 = pts[i]!;
      const fundo = (limite - Math.min(y0, y1)) * 0.55;
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.lineTo(x + passo, y1);
      ctx.lineTo(x + passo, y1 + Math.max(2, fundo + ruido(i) * 4));
      ctx.lineTo(x, y0 + Math.max(2, fundo + ruido(i + 40) * 4));
      ctx.closePath();
      ctx.fill();
    }
  }
}

function predios(
  ctx: CanvasRenderingContext2D,
  v: VisualCenario,
  camada: VisualCenario["longe"],
  off: number,
  altMax: number,
  seed: number,
  neblina: number,
  tempo: number,
) {
  const largMedia = 26;
  const i0 = Math.floor(off / largMedia) - 2;
  const cor = misturar(camada.cor, v.nevoa, neblina);
  for (let i = i0; i < i0 + Math.ceil(LARGURA / largMedia) + 5; i++) {
    const n = i + seed * 100;
    const w = largMedia * (0.7 + ruido(n * 1.7) * 0.8);
    const h = altMax * (0.3 + ruido(n * 3.3) * 0.7);
    const x = i * largMedia - off + ruido(n * 5.1) * 6;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, tonalidade(camada.cor, 0.14));
    g.addColorStop(1, cor);
    ctx.fillStyle = g;
    ctx.fillRect(x, HORIZONTE - h, w, h + 2);
    // antena nas mais altas
    if (h > altMax * 0.8) {
      ctx.fillStyle = cor;
      ctx.fillRect(x + w * 0.5, HORIZONTE - h - 10, 1.5, 10);
      ctx.fillStyle = Math.sin(tempo * 3 + n) > 0 ? "#ff4d4d" : "#7f1d1d";
      ctx.fillRect(x + w * 0.5 - 0.5, HORIZONTE - h - 11, 2.5, 2.5);
    }
    // janelas acesas
    const lin = Math.floor(h / 5);
    const col = Math.max(1, Math.floor(w / 5));
    for (let r = 0; r < lin; r++) {
      for (let c = 0; c < col; c++) {
        if (ruido(n * 11 + r * 7 + c * 3) > 0.62) {
          ctx.fillStyle = ruido(n + r) > 0.7 ? "rgba(147,197,253,0.75)" : "rgba(253,224,130,0.8)";
          ctx.fillRect(x + 2 + c * 5, HORIZONTE - h + 3 + r * 5, 2.5, 2.5);
        }
      }
    }
  }
}

function mar(ctx: CanvasRenderingContext2D, v: VisualCenario, tempo: number) {
  const g = ctx.createLinearGradient(0, HORIZONTE - 22, 0, HORIZONTE + 2);
  g.addColorStop(0, "#5fd0e8");
  g.addColorStop(0.5, "#1fa5c9");
  g.addColorStop(1, "#0e6f9a");
  ctx.fillStyle = g;
  ctx.fillRect(0, HORIZONTE - 22, LARGURA, 24);
  // reflexo do sol e brilhos que piscam
  const sx = (v.sol?.x ?? 0.3) * LARGURA;
  for (let i = 0; i < 46; i++) {
    const y = HORIZONTE - 21 + ruido(i * 3.7) * 20;
    const x = sx + (ruido(i * 9.3) - 0.5) * (30 + (y - (HORIZONTE - 22)) * 5);
    const a = 0.3 + 0.7 * Math.abs(Math.sin(tempo * 2 + i));
    ctx.fillStyle = `rgba(255,255,255,${a * 0.75})`;
    ctx.fillRect(x, y, 3 + ruido(i) * 5, 1);
  }
  // linha do horizonte, luminosa
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(0, HORIZONTE - 22, LARGURA, 1);
}

function mesas(
  ctx: CanvasRenderingContext2D,
  v: VisualCenario,
  camada: VisualCenario["longe"],
  off: number,
  alt: number,
  seed: number,
  neblina: number,
) {
  const passo = 150;
  const i0 = Math.floor(off / passo) - 1;
  const cor = misturar(camada.cor, v.nevoa, neblina);
  for (let i = i0; i < i0 + Math.ceil(LARGURA / passo) + 3; i++) {
    const n = i + seed * 50;
    const x = i * passo - off + ruido(n * 2.1) * 40;
    const w = passo * (0.5 + ruido(n * 4.7) * 0.5);
    const h = alt * (0.45 + ruido(n * 6.1) * 0.55);
    const topo = HORIZONTE - h;
    const talude = w * 0.3;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, tonalidade(camada.cor, 0.2));
    g.addColorStop(0.6, camada.cor);
    g.addColorStop(1, tonalidade(camada.cor, -0.3));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - talude, HORIZONTE + 2);
    ctx.lineTo(x + w * 0.04, topo + h * 0.28);
    ctx.lineTo(x + w * 0.08, topo);
    ctx.lineTo(x + w * 0.92, topo);
    ctx.lineTo(x + w * 0.96, topo + h * 0.28);
    ctx.lineTo(x + w + talude, HORIZONTE + 2);
    ctx.closePath();
    ctx.fill();
    // camadas de rocha
    ctx.strokeStyle = "rgba(0,0,0,0.16)";
    ctx.lineWidth = 1;
    for (let k = 1; k < 6; k++) {
      const y = topo + (h * k) / 6 + ruido(n + k) * 3;
      ctx.beginPath();
      ctx.moveTo(x + w * (0.05 - 0.3 * (k / 6)) + 2, y);
      ctx.lineTo(x + w * (0.95 + 0.3 * (k / 6)) - 2, y);
      ctx.stroke();
    }
    // bruma na base
    const b = ctx.createLinearGradient(0, HORIZONTE - h * 0.5, 0, HORIZONTE);
    b.addColorStop(0, `${v.nevoa}00`);
    b.addColorStop(
      1,
      `${v.nevoa}${Math.round(neblina * 255)
        .toString(16)
        .padStart(2, "0")}`,
    );
    ctx.fillStyle = b;
    ctx.fillRect(x - talude, HORIZONTE - h * 0.5, w + talude * 2, h * 0.5 + 2);
    void cor;
  }
}

function dunas(
  ctx: CanvasRenderingContext2D,
  v: VisualCenario,
  camada: VisualCenario["longe"],
  off: number,
  alt: number,
  seed: number,
) {
  const g = ctx.createLinearGradient(0, HORIZONTE - alt, 0, HORIZONTE);
  g.addColorStop(0, tonalidade(camada.cor, 0.1));
  g.addColorStop(1, misturar(camada.cor, v.nevoa, 0.6));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-4, HORIZONTE + 2);
  for (let x = -4; x <= LARGURA + 4; x += 6) {
    const y = HORIZONTE - alt * (0.4 + 0.6 * suave((x + off) / 90 + seed));
    ctx.lineTo(x, y);
  }
  ctx.lineTo(LARGURA + 4, HORIZONTE + 2);
  ctx.closePath();
  ctx.fill();
}

function camadaFundo(
  ctx: CanvasRenderingContext2D,
  v: VisualCenario,
  camada: VisualCenario["longe"],
  off: number,
  alt: number,
  seed: number,
  neblina: number,
  tempo: number,
) {
  switch (camada.tipo) {
    case "montanhas":
      return cordilheira(ctx, v, camada, off, alt, seed, neblina);
    case "predios":
      return predios(ctx, v, camada, off, alt, seed, neblina, tempo);
    case "mar":
      return mar(ctx, v, tempo);
    case "mesas":
      return mesas(ctx, v, camada, off, alt, seed, neblina);
    case "dunas":
      return dunas(ctx, v, camada, off, alt, seed);
  }
}

/** Duas camadas de fundo em profundidade: a de trás é mais clara e enevoada. */
export function desenharFundo(
  ctx: CanvasRenderingContext2D,
  v: VisualCenario,
  deslocamento: number,
  tempo: number,
) {
  camadaFundo(ctx, v, v.longe, deslocamento * 0.22, 78, 1, 0.55, tempo);
  camadaFundo(ctx, v, v.perto, deslocamento * 0.5, 46, 4, 0.25, tempo);
}

/** Faixa de névoa/calor rente ao horizonte: mistura o chão distante com o céu. */
export function desenharNevoa(ctx: CanvasRenderingContext2D, v: VisualCenario) {
  const g = ctx.createLinearGradient(0, HORIZONTE - 14, 0, HORIZONTE + 46);
  g.addColorStop(0, `${v.nevoa}00`);
  g.addColorStop(0.25, `${v.nevoa}99`);
  g.addColorStop(1, `${v.nevoa}00`);
  ctx.fillStyle = g;
  ctx.fillRect(0, HORIZONTE - 14, LARGURA, 60);
}

/** Vinheta e leve gradação de cor: dá cara de filme ao quadro. */
export function desenharAcabamento(ctx: CanvasRenderingContext2D, v: VisualCenario, razao: number) {
  const g = ctx.createRadialGradient(LARGURA / 2, 190, 150, LARGURA / 2, 190, 430);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${0.42 + razao * 0.16})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, LARGURA, 360);
  if (v.estilo === "noite") {
    ctx.fillStyle = "rgba(60,20,120,0.10)";
    ctx.fillRect(0, 0, LARGURA, 360);
  } else if (v.estilo === "deserto") {
    ctx.fillStyle = "rgba(255,140,40,0.07)";
    ctx.fillRect(0, 0, LARGURA, 360);
  }
}

// ---------------------------------------------------------------- objetos

function sombraChao(ctx: CanvasRenderingContext2D, w: number, ex = 0.55) {
  ctx.save();
  ctx.translate(w * 0.12, 0);
  ctx.scale(1, 0.16);
  const g = ctx.createRadialGradient(0, 0, 1, 0, 0, w * ex);
  g.addColorStop(0, "rgba(0,0,0,0.42)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, w * ex, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Objeto à beira da pista. (x, y) é o pé do objeto, `w` a largura em pixels,
 * `sem` uma semente estável (0 a 1) e `neblina` quanto ele se mistura com o
 * horizonte (0 perto, 1 longe).
 */
export function desenharObjeto(
  ctx: CanvasRenderingContext2D,
  tipo: TipoObjeto,
  x: number,
  y: number,
  larg: number,
  sem: number,
  neblina: number,
  v: VisualCenario,
) {
  const w = Math.max(larg, 1);
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = 1 - neblina * 0.55;
  sombraChao(ctx, w, tipo === "predio" ? 0.7 : 0.55);

  switch (tipo) {
    case "cone": {
      const h = w * 1.15;
      const g = ctx.createLinearGradient(-w * 0.4, 0, w * 0.4, 0);
      g.addColorStop(0, "#fb923c");
      g.addColorStop(0.5, "#f97316");
      g.addColorStop(1, "#c2410c");
      ctx.fillStyle = "#111827";
      ctx.fillRect(-w * 0.5, -h * 0.07, w, h * 0.07);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-w * 0.38, -h * 0.07);
      ctx.lineTo(-w * 0.07, -h);
      ctx.lineTo(w * 0.07, -h);
      ctx.lineTo(w * 0.38, -h * 0.07);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.moveTo(-w * 0.27, -h * 0.4);
      ctx.lineTo(w * 0.27, -h * 0.4);
      ctx.lineTo(w * 0.2, -h * 0.58);
      ctx.lineTo(-w * 0.2, -h * 0.58);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "pneus": {
      for (let i = 0; i < 3; i++) {
        const g = ctx.createLinearGradient(-w * 0.4, 0, w * 0.4, 0);
        g.addColorStop(0, "#1f2937");
        g.addColorStop(0.5, "#374151");
        g.addColorStop(1, "#0b0f14");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.roundRect(-w * 0.42, -w * 0.3 * (i + 1), w * 0.84, w * 0.3, w * 0.13);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.14)";
        ctx.fillRect(-w * 0.34, -w * 0.3 * (i + 1) + w * 0.03, w * 0.68, w * 0.03);
      }
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(-w * 0.42, -w * 0.9, w * 0.84, w * 0.045);
      break;
    }
    case "palmeira": {
      const h = w * (2.5 + sem * 0.7);
      const curva = (sem - 0.5) * w * 0.6;
      // tronco anelado
      const passos = 9;
      for (let i = 0; i < passos; i++) {
        const t0 = i / passos;
        const t1 = (i + 1) / passos;
        const px = (t: number) => curva * t * t;
        const largura0 = w * (0.13 - 0.05 * t0);
        const largura1 = w * (0.13 - 0.05 * t1);
        const g = ctx.createLinearGradient(px(t0) - largura0, 0, px(t0) + largura0, 0);
        g.addColorStop(0, "#9a6b3a");
        g.addColorStop(0.5, "#7a4e24");
        g.addColorStop(1, "#4d2f14");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(px(t0) - largura0, -h * t0);
        ctx.lineTo(px(t1) - largura1, -h * t1);
        ctx.lineTo(px(t1) + largura1, -h * t1);
        ctx.lineTo(px(t0) + largura0, -h * t0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.fillRect(px(t1) - largura1, -h * t1, largura1 * 2, 1.4);
      }
      const cx = curva;
      const cy = -h;
      // folhas curvas, de trás para frente
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * Math.PI * 2 + sem * 2;
        const comp = w * (0.75 + ruido(k + sem * 10) * 0.35);
        const dx = Math.cos(a) * comp;
        const cai = Math.abs(Math.sin(a)) * 0.35 + 0.15;
        const fx = cx + dx;
        const fy = cy + comp * cai - w * 0.05;
        const perp = w * 0.08;
        const g = ctx.createLinearGradient(cx, cy, fx, fy);
        g.addColorStop(0, "#22c55e");
        g.addColorStop(1, k % 2 ? "#15803d" : "#166534");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(cx + dx * 0.5, cy - comp * 0.32, fx, fy);
        ctx.quadraticCurveTo(cx + dx * 0.55, cy - comp * 0.05 + perp, cx, cy);
        ctx.fill();
        ctx.strokeStyle = "rgba(190,242,100,0.5)";
        ctx.lineWidth = Math.max(0.6, w * 0.012);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(cx + dx * 0.5, cy - comp * 0.3, fx, fy);
        ctx.stroke();
      }
      ctx.fillStyle = "#5b3a1a";
      ctx.beginPath();
      ctx.arc(cx - w * 0.05, cy + w * 0.06, w * 0.05, 0, Math.PI * 2);
      ctx.arc(cx + w * 0.05, cy + w * 0.07, w * 0.05, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "pinheiro": {
      const h = w * (2.6 + sem * 0.8);
      const neve = v.estilo === "neve";
      const tronco = ctx.createLinearGradient(-w * 0.08, 0, w * 0.08, 0);
      tronco.addColorStop(0, "#7a4e2a");
      tronco.addColorStop(1, "#3b2412");
      ctx.fillStyle = tronco;
      ctx.fillRect(-w * 0.07, -h * 0.22, w * 0.14, h * 0.22);
      const niveis = 5;
      for (let i = 0; i < niveis; i++) {
        const t = i / niveis;
        const baseY = -h * (0.14 + t * 0.66);
        const topoY = baseY - h * 0.34;
        const meia = w * (0.55 - t * 0.38);
        const g = ctx.createLinearGradient(-meia, 0, meia, 0);
        g.addColorStop(0, neve ? "#3f7d5b" : "#2f9a4f");
        g.addColorStop(0.55, neve ? "#1f5f43" : "#166534");
        g.addColorStop(1, neve ? "#0f3d2c" : "#0b3d1f");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, topoY);
        // borda inferior irregular, como galhos
        const dentes = 5;
        for (let d = 0; d <= dentes; d++) {
          const fx = -meia + (2 * meia * d) / dentes;
          const fy = baseY + (d % 2 ? -h * 0.03 : h * 0.025);
          ctx.lineTo(fx, fy);
        }
        ctx.closePath();
        ctx.fill();
        if (neve) {
          ctx.fillStyle = "rgba(255,255,255,0.92)";
          ctx.beginPath();
          ctx.moveTo(0, topoY);
          ctx.lineTo(meia * 0.62, topoY + (baseY - topoY) * 0.55);
          ctx.quadraticCurveTo(
            meia * 0.2,
            topoY + (baseY - topoY) * 0.5,
            0,
            topoY + (baseY - topoY) * 0.62,
          );
          ctx.quadraticCurveTo(
            -meia * 0.25,
            topoY + (baseY - topoY) * 0.5,
            -meia * 0.62,
            topoY + (baseY - topoY) * 0.55,
          );
          ctx.closePath();
          ctx.fill();
        }
      }
      break;
    }
    case "cacto": {
      const h = w * (1.9 + sem * 0.9);
      const corpo = ctx.createLinearGradient(-w * 0.14, 0, w * 0.14, 0);
      corpo.addColorStop(0, "#5fb36a");
      corpo.addColorStop(0.45, "#2f8f4e");
      corpo.addColorStop(1, "#1a5c33");
      ctx.fillStyle = corpo;
      ctx.beginPath();
      ctx.roundRect(-w * 0.14, -h, w * 0.28, h, w * 0.14);
      ctx.fill();
      const braco = (lado: number, alt: number, sobe: number) => {
        ctx.beginPath();
        ctx.roundRect(
          lado * w * 0.44 - w * 0.09,
          -h * alt - h * sobe,
          w * 0.18,
          h * sobe + w * 0.18,
          w * 0.09,
        );
        ctx.roundRect(
          Math.min(lado * w * 0.44, 0) -
            w * 0.02 +
            (lado > 0 ? w * 0.12 : 0) -
            (lado < 0 ? w * 0.1 : 0),
          -h * alt - w * 0.02,
          w * 0.36,
          w * 0.18,
          w * 0.09,
        );
        ctx.fill();
      };
      ctx.fillStyle = corpo;
      braco(-1, 0.42, 0.3);
      braco(1, 0.56, 0.26);
      ctx.strokeStyle = "rgba(0,0,0,0.22)";
      ctx.lineWidth = Math.max(0.6, w * 0.012);
      for (const lx of [-0.06, 0.06]) {
        ctx.beginPath();
        ctx.moveTo(lx * w, -h * 0.95);
        ctx.lineTo(lx * w, -h * 0.04);
        ctx.stroke();
      }
      ctx.fillStyle = "#f472b6";
      ctx.beginPath();
      ctx.arc(0, -h - w * 0.02, w * 0.06, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "predio": {
      const h = w * (2.6 + sem * 2.2);
      const paleta = [
        ["#2b3a67", "#1a2444"],
        ["#3b3355", "#231d38"],
        ["#334155", "#1e293b"],
        ["#4b3b5c", "#2a2136"],
      ][Math.floor(sem * 4) % 4]!;
      const frente = ctx.createLinearGradient(0, -h, 0, 0);
      frente.addColorStop(0, paleta[0]!);
      frente.addColorStop(1, paleta[1]!);
      ctx.fillStyle = frente;
      ctx.fillRect(-w * 0.5, -h, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.09)";
      ctx.fillRect(-w * 0.5, -h, w * 0.14, h);
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(w * 0.36, -h, w * 0.14, h);
      const lin = Math.max(4, Math.floor(h / (w * 0.22)));
      const col = 4;
      for (let r = 0; r < lin; r++) {
        for (let c = 0; c < col; c++) {
          const acesa = ruido(sem * 97 + r * 13 + c * 5) > 0.42;
          ctx.fillStyle = acesa
            ? ruido(sem * 31 + r + c) > 0.75
              ? "#7dd3fc"
              : "#fde68a"
            : "rgba(15,23,42,0.75)";
          ctx.fillRect(-w * 0.4 + c * w * 0.2, -h + w * 0.1 + r * w * 0.22, w * 0.13, w * 0.13);
        }
      }
      // letreiro de neon
      if (sem > 0.5) {
        const neon = sem > 0.75 ? "#22d3ee" : "#f472b6";
        ctx.save();
        ctx.shadowColor = neon;
        ctx.shadowBlur = w * 0.25;
        ctx.fillStyle = neon;
        ctx.fillRect(-w * 0.34, -h * 0.55, w * 0.68, w * 0.07);
        ctx.restore();
      }
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(-w * 0.55, -h - w * 0.05, w * 1.1, w * 0.06);
      break;
    }
    case "poste": {
      const h = w * 4.4;
      ctx.fillStyle = "#374151";
      ctx.fillRect(-w * 0.03, -h, w * 0.06, h);
      ctx.beginPath();
      ctx.moveTo(w * 0.02, -h);
      ctx.quadraticCurveTo(w * 0.02, -h - w * 0.45, -w * 0.6, -h - w * 0.4);
      ctx.lineWidth = Math.max(1, w * 0.05);
      ctx.strokeStyle = "#374151";
      ctx.stroke();
      ctx.fillStyle = "#e5e7eb";
      ctx.fillRect(-w * 0.72, -h - w * 0.42, w * 0.26, w * 0.07);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const glow = ctx.createRadialGradient(
        -w * 0.6,
        -h - w * 0.36,
        0,
        -w * 0.6,
        -h - w * 0.36,
        w * 1.4,
      );
      glow.addColorStop(0, "rgba(255,220,140,0.85)");
      glow.addColorStop(1, "rgba(255,180,80,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(-w * 2, -h - w * 1.8, w * 2.8, w * 2.8);
      ctx.restore();
      break;
    }
    case "placa": {
      ctx.fillStyle = "#4b5563";
      ctx.fillRect(-w * 0.04, -w * 1.6, w * 0.08, w * 1.6);
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.moveTo(0, -w * 2.1);
      ctx.lineTo(w * 0.46, -w * 1.62);
      ctx.lineTo(0, -w * 1.14);
      ctx.lineTo(-w * 0.46, -w * 1.62);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = Math.max(1, w * 0.05);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-w * 0.16, -w * 1.72);
      ctx.lineTo(w * 0.12, -w * 1.62);
      ctx.lineTo(-w * 0.16, -w * 1.52);
      ctx.stroke();
      break;
    }
    case "rocha": {
      const deserto = v.estilo === "deserto";
      const clara = deserto ? "#c98a5a" : "#9ca3af";
      const media = deserto ? "#9a5a34" : "#6b7280";
      const escura = deserto ? "#5f3620" : "#374151";
      const h = w * (0.6 + sem * 0.5);
      ctx.fillStyle = media;
      ctx.beginPath();
      ctx.moveTo(-w * 0.5, 0);
      ctx.lineTo(-w * 0.42, -h * 0.6);
      ctx.lineTo(-w * 0.1, -h);
      ctx.lineTo(w * 0.25, -h * 0.85);
      ctx.lineTo(w * 0.5, -h * 0.2);
      ctx.lineTo(w * 0.46, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = clara;
      ctx.beginPath();
      ctx.moveTo(-w * 0.42, -h * 0.6);
      ctx.lineTo(-w * 0.1, -h);
      ctx.lineTo(w * 0.05, -h * 0.55);
      ctx.lineTo(-w * 0.3, -h * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = escura;
      ctx.beginPath();
      ctx.moveTo(w * 0.05, -h * 0.55);
      ctx.lineTo(w * 0.25, -h * 0.85);
      ctx.lineTo(w * 0.5, -h * 0.2);
      ctx.lineTo(w * 0.46, 0);
      ctx.lineTo(w * 0.1, 0);
      ctx.closePath();
      ctx.fill();
      if (v.estilo === "neve") {
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.beginPath();
        ctx.moveTo(-w * 0.34, -h * 0.72);
        ctx.lineTo(-w * 0.1, -h);
        ctx.lineTo(w * 0.22, -h * 0.84);
        ctx.lineTo(w * 0.05, -h * 0.68);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case "arbusto": {
      const neve = v.estilo === "neve";
      const seco = v.estilo === "deserto";
      const cores = neve
        ? ["#2f6b4f", "#1d4d38"]
        : seco
          ? ["#a3a05a", "#6b6a35"]
          : ["#3fae4a", "#1f6f33"];
      for (let k = 0; k < 5; k++) {
        const cx = (k - 2) * w * 0.17;
        const r = w * (0.24 + ruido(k + sem * 9) * 0.12);
        const g = ctx.createRadialGradient(cx - r * 0.3, -r * 1.1, r * 0.1, cx, -r * 0.8, r * 1.1);
        g.addColorStop(0, cores[0]!);
        g.addColorStop(1, cores[1]!);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, -r * 0.7, r, 0, Math.PI * 2);
        ctx.fill();
        if (neve) {
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.beginPath();
          ctx.ellipse(cx, -r * 1.55, r * 0.75, r * 0.28, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
  }
  ctx.restore();
}
