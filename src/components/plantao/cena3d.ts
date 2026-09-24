/**
 * Cena 3D das missões de arena do "Operação: Plantão".
 *
 * A lógica do jogo continua toda em `motor-arena.ts` (posições em pixels de um
 * mapa plano). Este arquivo só lê o estado de cada quadro e o mostra em 3D:
 * o mapa vira um cenário com paredes, prédios, árvores, viaturas e luz do sol
 * (ou da lua), os personagens andam com esqueleto animado de verdade, e a
 * câmera acompanha por trás, com inclinação de corrida, tremor e cambalhota.
 */

import {
  AdditiveBlending,
  AmbientLight,
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Fog,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  RepeatWrapping,
  RingGeometry,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  Sprite,
  SpriteMaterial,
  ACESFilmicToneMapping,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
  type Material,
} from "three";

import type { Clima, Personagem } from "@/components/plantao/dados";
import { SPRITES_NPC } from "@/components/plantao/dados";
import { criarChao, type CorCachorro, type Imagens } from "@/components/plantao/desenho";
import { FiguraFoto } from "@/components/plantao/figura-foto";
import type { Mundo } from "@/components/plantao/motor-arena";
import {
  Agente3D,
  carregarModeloBase,
  type AparenciaAgente,
  type FiguraAnimada,
} from "@/components/plantao/personagem3d";

const TOM_FOTO: Record<Clima, number> = { dia: 0xffffff, "por-do-sol": 0xffd6b0, noite: 0x8c9bd0 };

/** Pixels do mapa por metro do cenário 3D. */
export const M = 55;

export const metros = (px: number) => px / M;
export const ciclo = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function angDif(a: number, b: number): number {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// ------------------------------------------------------------------- estado

export interface EstadoCena {
  t: number;
  dt: number;
  jogador: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    correndo: boolean;
    atordoado: boolean;
    carga: number;
    item: "marmita" | "breve" | null;
    buff: boolean;
  };
  cachorros: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    fase: number;
    susto: number;
    visivel: boolean;
    cor: CorCachorro;
  }[];
  patrulhas: {
    tipo: "npc" | "carrinho" | "carro";
    x: number;
    y: number;
    dir: number;
    parado: boolean;
    vel: number;
    cor: { camisa: string; calca: string; pele: string; cabelo: string; chapeu?: string };
  }[];
  interativos: {
    id: string;
    tipo: string;
    x: number;
    y: number;
    ativo: boolean;
    util: boolean;
    bloqueado: boolean;
  }[];
}

interface OpcoesCena {
  canvas: HTMLCanvasElement;
  mundo: Mundo;
  clima: Clima;
  missao: string;
  personagem: Personagem;
  leve: boolean;
  foto?: boolean;
  imagens?: Imagens;
}

// ------------------------------------------------------------------- clima

export interface Tempo {
  topo: number;
  horizonte: number;
  sol: number;
  solInt: number;
  solDir: [number, number, number];
  hemiCeu: number;
  hemiChao: number;
  hemiInt: number;
  nevoa: number;
  nevoaPerto: number;
  nevoaLonge: number;
  exposicao: number;
  noite: boolean;
  janelas: number;
  predio: number;
}

export const TEMPOS: Record<Clima, Tempo> = {
  dia: {
    topo: 0x2f7fd8,
    horizonte: 0xcfe6f7,
    sol: 0xfff1d6,
    solInt: 3.1,
    solDir: [-0.55, 0.85, 0.5],
    hemiCeu: 0xdcecff,
    hemiChao: 0x7a8060,
    hemiInt: 1.15,
    nevoa: 0xcfe6f7,
    nevoaPerto: 55,
    nevoaLonge: 260,
    exposicao: 1,
    noite: false,
    janelas: 0.04,
    predio: 0xb8c4d2,
  },
  "por-do-sol": {
    topo: 0x27336f,
    horizonte: 0xff9a55,
    sol: 0xffa55a,
    solInt: 2.7,
    solDir: [-0.95, 0.32, 0.45],
    hemiCeu: 0xffbf8c,
    hemiChao: 0x4b3b52,
    hemiInt: 0.85,
    nevoa: 0xe98d5a,
    nevoaPerto: 40,
    nevoaLonge: 210,
    exposicao: 1.05,
    noite: false,
    janelas: 0.5,
    predio: 0x6b5a78,
  },
  noite: {
    topo: 0x03081c,
    horizonte: 0x1a2a55,
    sol: 0x8fa8ff,
    solInt: 0.7,
    solDir: [-0.4, 0.8, 0.5],
    hemiCeu: 0x3a4c86,
    hemiChao: 0x0b1024,
    hemiInt: 0.65,
    nevoa: 0x0a1230,
    nevoaPerto: 25,
    nevoaLonge: 150,
    exposicao: 1.1,
    noite: true,
    janelas: 1.4,
    predio: 0x2b3554,
  },
};

// ----------------------------------------------------------------- utilidades

export function texturaTexto(
  texto: string,
  larg: number,
  alt: number,
  fundo: string | null,
  cor: string,
  tam = 0.6,
): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = larg;
  c.height = alt;
  const g = c.getContext("2d")!;
  if (fundo) {
    g.fillStyle = fundo;
    g.fillRect(0, 0, larg, alt);
  }
  g.fillStyle = cor;
  g.textAlign = "center";
  g.textBaseline = "middle";
  let px = Math.round(alt * tam);
  g.font = `900 ${px}px Arial, Helvetica, sans-serif`;
  while (g.measureText(texto).width > larg * 0.92 && px > 10) {
    px -= 2;
    g.font = `900 ${px}px Arial, Helvetica, sans-serif`;
  }
  g.fillText(texto, larg / 2, alt / 2 + px * 0.05);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function texturaEmoji(emoji: string): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "rgba(15,23,42,0.85)";
  g.beginPath();
  g.arc(64, 64, 58, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#facc15";
  g.lineWidth = 6;
  g.stroke();
  g.font = "64px sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(emoji, 64, 70);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function texturaPredios(): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 64, 128);
  let s = 11;
  for (let y = 4; y < 124; y += 8)
    for (let x = 4; x < 60; x += 8) {
      s = (s * 16807) % 2147483647;
      g.fillStyle = s % 5 < 2 ? "#ffe9a8" : "#2a3350";
      g.fillRect(x, y, 4, 5);
    }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export function textoLuz(): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

// ------------------------------------------------------------------ modelos

export function padrao(cor: string | number, rug = 0.85, metal = 0): MeshStandardMaterial {
  return new MeshStandardMaterial({ color: cor, roughness: rug, metalness: metal });
}

export function caixa(
  w: number,
  h: number,
  d: number,
  cor: string | number,
  x = 0,
  y = 0,
  z = 0,
  rug = 0.85,
): Mesh {
  const m = new Mesh(new BoxGeometry(w, h, d), padrao(cor, rug));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function criarCarro(
  cor: string,
  viatura: boolean,
  texto?: string,
): { g: Group; luzes: Mesh[] } {
  const g = new Group();
  const luzes: Mesh[] = [];
  g.add(caixa(1.85, 0.55, 4.4, cor, 0, 0.62, 0, 0.35));
  g.add(caixa(1.7, 0.5, 2.3, cor, 0, 1.1, -0.15, 0.35));
  const vidro = padrao(0x0b1220, 0.08, 0.7);
  const parabrisa = new Mesh(new BoxGeometry(1.62, 0.42, 2.34), vidro);
  parabrisa.position.set(0, 1.12, -0.15);
  g.add(parabrisa);
  const roda = new CylinderGeometry(0.36, 0.36, 0.28, 16);
  for (const sx of [-1, 1])
    for (const sz of [-1.35, 1.35]) {
      const r = new Mesh(roda, padrao(0x0c0c0c, 0.9));
      r.rotation.z = Math.PI / 2;
      r.position.set(sx * 0.93, 0.36, sz);
      r.castShadow = true;
      g.add(r);
    }
  for (const sx of [-1, 1]) {
    const farol = new Mesh(
      new BoxGeometry(0.4, 0.16, 0.06),
      new MeshStandardMaterial({ color: 0xfff6d6, emissive: 0xfff2b0, emissiveIntensity: 0.8 }),
    );
    farol.position.set(sx * 0.6, 0.7, 2.21);
    g.add(farol);
    const lanterna = new Mesh(
      new BoxGeometry(0.4, 0.14, 0.06),
      new MeshStandardMaterial({ color: 0x991b1b, emissive: 0xff2020, emissiveIntensity: 0.5 }),
    );
    lanterna.position.set(sx * 0.6, 0.72, -2.21);
    g.add(lanterna);
  }
  if (viatura) {
    g.add(caixa(1.86, 0.22, 4.41, "#f8fafc", 0, 0.62, 0, 0.35).clone());
    for (const [sx, cl] of [
      [-0.4, 0xff2a2a],
      [0.4, 0x2a6bff],
    ] as [number, number][]) {
      const l = new Mesh(
        new BoxGeometry(0.7, 0.14, 0.3),
        new MeshStandardMaterial({ color: cl, emissive: cl, emissiveIntensity: 1 }),
      );
      l.position.set(sx, 1.4, -0.2);
      g.add(l);
      luzes.push(l);
    }
    if (texto) {
      const placa = new Mesh(
        new PlaneGeometry(1.7, 0.36),
        new MeshStandardMaterial({
          map: texturaTexto(texto, 512, 108, null, "#f8fafc", 0.55),
          transparent: true,
          roughness: 0.6,
        }),
      );
      for (const sx of [-1, 1]) {
        const p = placa.clone();
        p.position.set(sx * 0.93, 0.7, 0);
        p.rotation.y = sx * (Math.PI / 2);
        g.add(p);
      }
    }
  }
  return { g, luzes };
}

function criarCarrinho(): Group {
  const g = new Group();
  g.add(caixa(0.7, 0.5, 1.0, "#facc15", 0, 0.62, 0, 0.5));
  g.add(caixa(0.55, 0.28, 0.6, "#2a72d6", 0, 1.0, 0.1, 0.5));
  g.add(caixa(0.6, 0.06, 0.08, "#94a3b8", 0, 1.15, -0.55, 0.4));
  for (const sx of [-0.28, 0.28]) g.add(caixa(0.05, 0.6, 0.05, "#94a3b8", sx, 0.85, -0.5, 0.4));
  const roda = new CylinderGeometry(0.12, 0.12, 0.08, 12);
  for (const sx of [-0.3, 0.3])
    for (const sz of [-0.35, 0.35]) {
      const r = new Mesh(roda, padrao(0x111111));
      r.rotation.z = Math.PI / 2;
      r.position.set(sx, 0.12, sz);
      g.add(r);
    }
  return g;
}

interface DogRig {
  g: Group;
  pernas: Group[];
  cauda: Mesh;
  cabeca: Mesh;
}

function criarCachorro(c: CorCachorro): DogRig {
  const g = new Group();
  const corpo = caixa(0.3, 0.28, 0.62, c.pelo, 0, 0.42, 0, 0.9);
  g.add(corpo);
  g.add(caixa(0.32, 0.3, 0.26, c.pelo, 0, 0.44, 0.18, 0.9));
  const cabeca = caixa(0.2, 0.2, 0.22, c.pelo, 0, 0.62, 0.42, 0.9);
  g.add(cabeca);
  cabeca.add(caixa(0.13, 0.1, 0.14, c.sombra, 0, -0.04, 0.16, 0.9));
  cabeca.add(caixa(0.05, 0.04, 0.04, "#0b0b0b", 0, -0.01, 0.24, 0.5));
  for (const sx of [-1, 1]) {
    const o = caixa(0.05, 0.13, 0.08, c.orelha, sx * 0.11, 0.1, -0.02, 0.9);
    o.rotation.z = sx * -0.35;
    cabeca.add(o);
    cabeca.add(caixa(0.03, 0.03, 0.03, "#0b0b0b", sx * 0.06, 0.03, 0.11, 0.4));
  }
  const cauda = caixa(0.05, 0.05, 0.3, c.sombra, 0, 0.56, -0.36, 0.9);
  cauda.rotation.x = 0.7;
  g.add(cauda);
  const pernas: Group[] = [];
  for (const [sx, sz] of [
    [-0.1, 0.22],
    [0.1, 0.22],
    [-0.1, -0.22],
    [0.1, -0.22],
  ] as [number, number][]) {
    const p = new Group();
    p.position.set(sx, 0.32, sz);
    p.add(caixa(0.08, 0.32, 0.08, c.sombra, 0, -0.16, 0, 0.9));
    g.add(p);
    pernas.push(p);
  }
  return { g, pernas, cauda, cabeca };
}

// ----------------------------------------------------------- aparência dos agentes

const ROTULO_COSTAS: Record<string, string> = {
  valentao: "SOCIOEDUCATIVO",
  franc: "AGENTE PENITENCIÁRIO",
  santos: "TIGER",
};

export function aparenciaDe(p: Personagem): AparenciaAgente {
  const base: AparenciaAgente = {
    camisa: p.camisa,
    calca: p.calca,
    bota: p.bota,
    pele: p.pele,
    cabelo: p.cabelo,
    mangaCurta: true,
    costas: ROTULO_COSTAS[p.id] ?? "AGENTE",
    distintivo: true,
  };
  if (p.id === "valentao") return { ...base, cinto: true, largura: 1.18 };
  if (p.id === "franc")
    return { ...base, cinto: true, mochila: true, oculos: true, colete: "#171a26", largura: 1.16 };
  return {
    ...base,
    lego: true,
    cacheado: true,
    corCostas: "#facc15",
    distintivo: false,
    escala: 0.94,
    largura: 1.08,
  };
}

function aparenciaNpc(c: {
  camisa: string;
  calca: string;
  pele: string;
  cabelo: string;
  chapeu?: string;
}): AparenciaAgente {
  return {
    camisa: c.camisa,
    calca: c.calca,
    bota: "#1a1a1a",
    pele: c.pele,
    cabelo: c.cabelo,
    mangaCurta: true,
    ...(c.chapeu ? { chapeu: c.chapeu } : {}),
    escala: 0.97,
  };
}

/** Céu, sol ou lua, estrelas e a linha de prédios ao longe, centrados em (0, 0). */
export function montarCeu(tp: Tempo): Group {
  const grupo = new Group();
  // domo do céu com degradê
  const geo = new SphereGeometry(500, 32, 18);
  const cores: number[] = [];
  const topo = new Color(tp.topo);
  const hor = new Color(tp.horizonte);
  const c = new Color();
  const pos = geo.attributes["position"]!;
  for (let i = 0; i < pos.count; i++) {
    const k = Math.pow(ciclo(pos.getY(i) / 500, 0, 1), 0.55);
    c.copy(hor).lerp(topo, k);
    cores.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new BufferAttribute(new Float32Array(cores), 3));
  const domo = new Mesh(
    geo,
    new MeshBasicMaterial({ vertexColors: true, side: BackSide, fog: false, depthWrite: false }),
  );
  grupo.add(domo);
  // sol ou lua
  const d = new Vector3(...tp.solDir).normalize().multiplyScalar(420);
  const astro = new Mesh(
    new SphereGeometry(tp.noite ? 14 : 20, 20, 12),
    new MeshBasicMaterial({ color: tp.noite ? 0xe8eeff : 0xfff3c4, fog: false }),
  );
  astro.position.copy(d);
  grupo.add(astro);
  if (tp.noite) {
    const n = 320;
    const p = new Float32Array(n * 3);
    let s = 5;
    for (let i = 0; i < n; i++) {
      s = (s * 16807) % 2147483647;
      const a = (s % 6283) / 1000;
      s = (s * 16807) % 2147483647;
      const e = 0.15 + ((s % 1000) / 1000) * 1.2;
      p[i * 3] = Math.cos(a) * Math.cos(e) * 480;
      p[i * 3 + 1] = Math.sin(e) * 480;
      p[i * 3 + 2] = Math.sin(a) * Math.cos(e) * 480;
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(p, 3));
    grupo.add(
      new Points(
        g,
        new PointsMaterial({ color: 0xffffff, size: 1.8, fog: false, sizeAttenuation: false }),
      ),
    );
  }
  // linha de prédios ao longe
  const tex = texturaPredios();
  let s = 21;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return (s % 10000) / 10000;
  };
  for (let i = 0; i < 70; i++) {
    const a = (i / 70) * Math.PI * 2 + rnd() * 0.06;
    const r = 95 + rnd() * 70;
    const w = 9 + rnd() * 12;
    const h = 14 + rnd() * 46;
    const b = new Mesh(
      new BoxGeometry(w, h, w),
      new MeshStandardMaterial({
        color: tp.predio,
        map: tex,
        emissive: 0xffffff,
        emissiveMap: tex,
        emissiveIntensity: tp.janelas,
        roughness: 0.9,
      }),
    );
    b.position.set(Math.cos(a) * r, h / 2 - 0.3, Math.sin(a) * r);
    grupo.add(b);
  }
  return grupo;
}

// --------------------------------------------------------------------- cena

interface ParedeVista {
  malhas: Material[];
  x0: number;
  x1: number;
  y1: number;
  z0: number;
  z1: number;
  alvo: number;
  atual: number;
}

interface Marcador {
  raiz: Group;
  anel: Mesh;
  feixe: Mesh;
  icone: Sprite | null;
  obj: Object3D | null;
  spin: boolean;
}

interface PartInfo {
  n: number;
}

const EMOJI_TAREFA: Record<string, string> = {
  radio: "📻",
  cadeado: "🔒",
  agua: "💧",
  chave: "🔑",
  portaria: "🛂",
  controle: "🛃",
  registro: "📝",
};

export class Cena3D {
  private renderer: WebGLRenderer;
  private cena = new Scene();
  private cam: PerspectiveCamera;
  private sol: DirectionalLight;
  private tempo: Tempo;
  private paredes: ParedeVista[] = [];
  private pontos: PointLight[] = [];
  private fontes: Vector3[] = [];
  private lampadas: Mesh[] = [];
  private luzesViatura: Mesh[] = [];
  private marcadores = new Map<string, Marcador>();
  private jogador: FiguraAnimada;
  private giro = new Group();
  private carga = new Group();
  private cachorros: DogRig[] = [];
  private cachorroDir: number[] = [];
  private patrulhaObj: {
    obj: Object3D;
    agente: FiguraAnimada | null;
    dir: number;
    ux: number;
    uy: number;
  }[] = [];
  private headingJ = 0;
  private velSuave = 0;
  private camYaw = 0;
  private camPos = new Vector3();
  private camAlvo = new Vector3();
  private pulo = 0;
  private puloDur = 0.85;
  private puloTipo: "salto" | "cambalhota" = "salto";
  private tremor = 0;
  private fov = 52;
  private poeira!: Points;
  private poeiraInfo: PartInfo = { n: 0 };
  private pv: { vx: number; vy: number; vz: number; vida: number; max: number }[] = [];
  private t = 0;
  private ro: ResizeObserver | null = null;
  private cx = 0;
  private cz = 0;

  private constructor(
    private op: OpcoesCena,
    jogadorAg: FiguraAnimada,
  ) {
    const { canvas, mundo, clima } = op;
    this.tempo = TEMPOS[clima];
    this.jogador = jogadorAg;
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: !op.leve,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, op.leve ? 1.4 : 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.tempo.exposicao;
    this.renderer.outputColorSpace = SRGBColorSpace;

    this.cam = new PerspectiveCamera(this.fov, 16 / 9, 0.1, 900);
    this.cena.fog = new Fog(this.tempo.nevoa, this.tempo.nevoaPerto, this.tempo.nevoaLonge);

    this.sol = new DirectionalLight(this.tempo.sol, this.tempo.solInt);
    this.sol.castShadow = true;
    const mapa = op.leve ? 1024 : 2048;
    this.sol.shadow.mapSize.set(mapa, mapa);
    const s = this.sol.shadow.camera;
    s.left = -18;
    s.right = 18;
    s.top = 18;
    s.bottom = -18;
    s.near = 1;
    s.far = 90;
    this.sol.shadow.bias = -0.0004;
    this.sol.shadow.normalBias = 0.04;
    this.cena.add(this.sol, this.sol.target);
    this.cena.add(new HemisphereLight(this.tempo.hemiCeu, this.tempo.hemiChao, this.tempo.hemiInt));
    this.cena.add(new AmbientLight(0xffffff, this.tempo.noite ? 0.12 : 0.25));

    const ceu = montarCeu(this.tempo);
    ceu.position.set(metros(mundo.w) / 2, 0, metros(mundo.h) / 2);
    this.cena.add(ceu);
    this.montarChao(mundo);
    this.montarParedes(mundo);
    this.montarDecor(mundo);
    this.montarLuzes(mundo);
    this.montarInterativos(mundo);
    this.montarParticulas();

    // jogador: raiz > giro (pivô no centro do corpo) > modelo
    this.jogador.modelo.position.y = -0.9;
    this.giro.position.y = 0.9;
    this.jogador.raiz.remove(this.jogador.modelo);
    this.giro.add(this.jogador.modelo);
    this.jogador.raiz.add(this.giro);
    this.carga.position.set(0, 1.0, 0.42);
    this.jogador.raiz.add(this.carga);
    this.cena.add(this.jogador.raiz);
    this.jogador.raiz.position.set(metros(mundo.spawn.x), 0, metros(mundo.spawn.y));
    this.headingJ = Math.PI;
    this.jogador.raiz.rotation.y = this.headingJ;
    this.camAlvo.set(metros(mundo.spawn.x), 1, metros(mundo.spawn.y));
    this.camPos.set(metros(mundo.spawn.x), 6, metros(mundo.spawn.y) + 8);

    this.redimensionar();
    this.ro = new ResizeObserver(() => this.redimensionar());
    this.ro.observe(canvas);
  }

  static async criar(op: OpcoesCena): Promise<Cena3D> {
    const gltf = await carregarModeloBase();
    const p = op.personagem;
    const ag: FiguraAnimada = op.foto
      ? new FiguraFoto(
          op.imagens?.[p.sprite],
          { pernas: p.pernas, cintura: p.cintura, calca: p.calca, bota: p.bota },
          TOM_FOTO[op.clima],
        )
      : new Agente3D(gltf, aparenciaDe(p));
    const cena = new Cena3D(op, ag);
    cena.gltf = gltf;
    return cena;
  }

  private gltf: Awaited<ReturnType<typeof carregarModeloBase>> | null = null;

  // ------------------------------------------------------------- montagem

  private montarChao(m: Mundo) {
    const largura = metros(m.w);
    const prof = metros(m.h);
    // terreno ao redor
    const externo = new Mesh(
      new PlaneGeometry(700, 700),
      padrao(
        this.op.missao === "cachorro" || this.op.missao === "tarefas" ? 0x4f6b46 : 0x3b3f47,
        1,
      ),
    );
    externo.rotation.x = -Math.PI / 2;
    externo.position.set(largura / 2, -0.04, prof / 2);
    externo.receiveShadow = true;
    this.cena.add(externo);

    const piso = (
      tipo: Parameters<typeof criarChao>[0],
      x: number,
      y: number,
      w: number,
      h: number,
      dy: number,
    ) => {
      const tile = criarChao(tipo);
      const tx = new CanvasTexture(tile);
      tx.wrapS = tx.wrapT = RepeatWrapping;
      tx.colorSpace = SRGBColorSpace;
      tx.anisotropy = 8;
      tx.repeat.set(w / tile.width, h / tile.height);
      const mat = new MeshStandardMaterial({
        map: tx,
        roughness: tipo === "azulejo" ? 0.35 : 0.85,
      });
      const p = new Mesh(new PlaneGeometry(metros(w), metros(h)), mat);
      p.rotation.x = -Math.PI / 2;
      p.position.set(metros(x + w / 2), dy, metros(y + h / 2));
      p.receiveShadow = true;
      this.cena.add(p);
    };
    piso(m.chao, 0, 0, m.w, m.h, 0);
    if (m.faixaChao) {
      const f = m.faixaChao;
      piso(f.tipo, f.rect.x, f.rect.y, f.rect.w, f.rect.h, 0.01);
    }
    // marcas pintadas no chão (faixas, linhas): o mesmo desenho do modo 2D
    if (m.chaoExtra) {
      const c = document.createElement("canvas");
      c.width = m.w;
      c.height = m.h;
      const g = c.getContext("2d")!;
      m.chaoExtra(g);
      const tx = new CanvasTexture(c);
      tx.colorSpace = SRGBColorSpace;
      tx.anisotropy = 8;
      const p = new Mesh(
        new PlaneGeometry(largura, prof),
        new MeshBasicMaterial({
          map: tx,
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2,
        }),
      );
      p.rotation.x = -Math.PI / 2;
      p.position.set(largura / 2, 0.02, prof / 2);
      this.cena.add(p);
    }
    for (const z of m.zonas) {
      if (z.tipo !== "molhado") continue;
      const p = new Mesh(
        new PlaneGeometry(metros(z.w) * 1.15, metros(z.h) * 1.4),
        new MeshStandardMaterial({
          color: 0x7dd3fc,
          transparent: true,
          opacity: 0.35,
          roughness: 0.05,
          metalness: 0.3,
        }),
      );
      p.rotation.x = -Math.PI / 2;
      p.position.set(metros(z.x + z.w / 2), 0.03, metros(z.y + z.h / 2));
      this.cena.add(p);
    }
  }

  private montarParedes(m: Mundo) {
    const interno = this.op.missao === "marmitas" || this.op.missao === "breves";
    const mat = (cor: string, transp: boolean) =>
      new MeshStandardMaterial({ color: cor, roughness: 0.88, transparent: transp });
    const vidro = new MeshStandardMaterial({
      color: 0x9fd8ff,
      roughness: 0.05,
      metalness: 0.5,
      emissive: 0xffe6a0,
      emissiveIntensity: this.tempo.noite ? 0.9 : 0.05,
    });

    for (const p of m.paredes) {
      if (p.invisivel || p.w <= 0 || p.h <= 0) continue;
      const w = metros(p.w);
      const d = metros(p.h);
      const h = Math.max(0.2, metros(p.alt));
      const alta = h > 1.15;
      const topo = alta ? mat(p.topo, true) : mat(p.topo, false);
      const lado = alta ? mat(p.frente, true) : mat(p.frente, false);
      const mats = [lado, lado, topo, topo, lado, lado];
      const malha = new Mesh(new BoxGeometry(w, h, d), mats);
      malha.position.set(metros(p.x + p.w / 2), h / 2, metros(p.y + p.h / 2));
      malha.castShadow = true;
      malha.receiveShadow = true;
      this.cena.add(malha);
      if (alta)
        this.paredes.push({
          malhas: mats,
          x0: metros(p.x),
          x1: metros(p.x + p.w),
          y1: h,
          z0: metros(p.y),
          z1: metros(p.y + p.h),
          alvo: 1,
          atual: 1,
        });
      const extra = p.extra as { janelas?: boolean } | undefined;
      if (extra?.janelas || (alta && p.w >= 200)) {
        const n = Math.max(1, Math.floor(p.w / 70));
        for (let i = 0; i < n; i++) {
          const j = new Mesh(new PlaneGeometry(0.72, 0.62), vidro);
          j.position.set(
            metros(p.x + 20 + i * ((p.w - 40) / n)) + 0.36,
            h * 0.58,
            metros(p.y + p.h) + 0.012,
          );
          this.cena.add(j);
        }
      }
    }

    // paredes laterais dos ambientes internos e faixa de rodapé
    if (interno) {
      const parede = mat("#8b8377", false);
      for (const x of [-0.25, metros(m.w) + 0.25]) {
        const l = new Mesh(new BoxGeometry(0.5, 3.2, metros(m.h) + 1), parede);
        l.position.set(x, 1.6, metros(m.h) / 2);
        l.receiveShadow = true;
        this.cena.add(l);
      }
    }

    if (this.op.missao === "cachorro") {
      const placa = new Mesh(
        new PlaneGeometry(8.6, 1.5),
        new MeshStandardMaterial({
          map: texturaTexto("UNIDADE SOCIOEDUCATIVA", 1024, 180, "#2a3040", "#f1f5f9", 0.5),
          roughness: 0.6,
        }),
      );
      placa.position.set(metros(1100), 3.4, metros(30 + 220) + 0.05);
      this.cena.add(placa);
      // torres de vigia nos cantos
      for (const x of [metros(240), metros(1960)]) {
        const t = new Group();
        t.add(caixa(1.4, 5.5, 1.4, "#8b8377", 0, 2.75, 0));
        t.add(caixa(2.4, 1.1, 2.4, "#6f685e", 0, 6, 0));
        t.add(caixa(2.6, 0.2, 2.6, "#3b3f47", 0, 6.7, 0));
        t.position.set(x, 0, metros(60));
        this.cena.add(t);
      }
    }
  }

  private montarDecor(m: Mundo) {
    for (const d of m.decor) {
      const tipo = d.tipo3d;
      const x = metros(d.x);
      const z = metros(d.y);
      if (tipo === "cone") {
        const g = new Group();
        g.add(caixa(0.36, 0.04, 0.36, "#1b1b1b", 0, 0.02, 0));
        const c = new Mesh(new ConeGeometry(0.15, 0.55, 16), padrao("#f97316", 0.6));
        c.position.y = 0.32;
        c.castShadow = true;
        g.add(c);
        const faixa = new Mesh(new CylinderGeometry(0.085, 0.11, 0.09, 16), padrao("#f8fafc", 0.5));
        faixa.position.y = 0.34;
        g.add(faixa);
        g.position.set(x, 0, z);
        this.cena.add(g);
      } else if (tipo === "poste") {
        const g = new Group();
        g.add(caixa(0.12, 4.2, 0.12, "#4b5563", 0, 2.1, 0, 0.5));
        g.add(caixa(0.9, 0.08, 0.08, "#4b5563", 0.4, 4.2, 0, 0.5));
        const lamp = new Mesh(
          new BoxGeometry(0.42, 0.1, 0.22),
          new MeshStandardMaterial({
            color: 0xfff1c2,
            emissive: 0xffe7a3,
            emissiveIntensity: this.tempo.noite || this.tempo.janelas > 0.3 ? 2.2 : 0.15,
          }),
        );
        lamp.position.set(0.85, 4.12, 0);
        g.add(lamp);
        g.position.set(x, 0, z);
        this.cena.add(g);
        this.lampadas.push(lamp);
        this.fontes.push(new Vector3(x + 0.85, 4, z));
      } else if (tipo === "arvore") {
        const g = new Group();
        g.add(caixa(0.3, 2.1, 0.3, "#5b3a22", 0, 1.05, 0, 0.9));
        const cor = ["#2f7a3a", "#3a8f43", "#2a6c33"];
        [
          [0, 3.0, 0, 1.15],
          [0.5, 2.5, 0.3, 0.8],
          [-0.45, 2.6, -0.3, 0.85],
        ].forEach(([px, py, pz, r], i) => {
          const f = new Mesh(new IcosahedronGeometry(r!, 1), padrao(cor[i % 3]!, 0.95));
          f.position.set(px!, py!, pz!);
          f.castShadow = true;
          g.add(f);
        });
        g.position.set(x, 0, z);
        this.cena.add(g);
      } else if (tipo === "placa") {
        const g = new Group();
        g.add(caixa(0.08, 2.2, 0.08, "#6b7280", 0, 1.1, 0));
        const tabua = new Mesh(
          new PlaneGeometry(0.9, 0.9),
          new MeshStandardMaterial({
            map: texturaTexto("!", 128, 128, "#dc2626", "#fff", 0.8),
            roughness: 0.6,
            side: DoubleSide,
          }),
        );
        tabua.position.set(0, 2.2, 0);
        g.add(tabua);
        g.position.set(x, 0, z);
        this.cena.add(g);
      } else if (tipo === "viatura") {
        const { g, luzes } = criarCarro("#101827", true, "SOCIOEDUCATIVO");
        g.position.set(x, 0, z - 0.4);
        g.rotation.y = Math.PI / 2;
        this.cena.add(g);
        this.luzesViatura.push(...luzes);
      } else if (tipo === "piso") {
        const g = new Group();
        for (const s of [-1, 1]) {
          const p = new Mesh(
            new PlaneGeometry(0.42, 0.7),
            new MeshStandardMaterial({
              map: texturaTexto("PISO MOLHADO", 128, 210, "#facc15", "#111", 0.13),
              roughness: 0.6,
              side: DoubleSide,
            }),
          );
          p.rotation.x = s * 0.32;
          p.position.set(0, 0.34, s * 0.12);
          p.castShadow = true;
          g.add(p);
        }
        g.position.set(x, 0, z);
        this.cena.add(g);
      } else if (tipo === "detector") {
        const g = new Group();
        g.add(caixa(0.2, 2.1, 0.5, "#334155", -0.7, 1.05, 0));
        g.add(caixa(0.2, 2.1, 0.5, "#334155", 0.7, 1.05, 0));
        g.add(caixa(1.6, 0.22, 0.5, "#334155", 0, 2.15, 0));
        const luz = new Mesh(
          new BoxGeometry(0.3, 0.08, 0.1),
          new MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 1.4 }),
        );
        luz.position.set(0, 2.16, 0.27);
        g.add(luz);
        g.position.set(x, 0, z);
        this.cena.add(g);
      }
    }
  }

  private montarLuzes(m: Mundo) {
    const interno = this.op.missao === "marmitas" || this.op.missao === "breves";
    if (interno) {
      for (const l of m.luzes) {
        this.fontes.push(new Vector3(metros(l.x), 3, metros(l.y)));
        const lamp = new Mesh(
          new BoxGeometry(1.4, 0.06, 0.3),
          new MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xfff4d0,
            emissiveIntensity: this.tempo.noite ? 2.4 : 1.2,
          }),
        );
        lamp.position.set(metros(l.x), 3.15, metros(l.y));
        this.cena.add(lamp);
      }
    }
    const n = this.tempo.noite || this.tempo.janelas > 0.3 || interno ? 6 : 0;
    for (let i = 0; i < n; i++) {
      const p = new PointLight(interno ? 0xfff0d0 : 0xffd9a0, 0, 16, 1.6);
      this.cena.add(p);
      this.pontos.push(p);
    }
  }

  private montarInterativos(m: Mundo) {
    const raio = (i: Mundo["interativos"][number]) => Math.max(0.6, metros(i.r) * 0.42);
    for (const i of m.interativos) {
      const raiz = new Group();
      raiz.position.set(metros(i.x), 0, metros(i.y));
      const anel = new Mesh(
        new RingGeometry(raio(i) * 0.82, raio(i), 40),
        new MeshBasicMaterial({
          color: 0xfacc15,
          transparent: true,
          opacity: 0.85,
          side: DoubleSide,
          depthWrite: false,
        }),
      );
      anel.rotation.x = -Math.PI / 2;
      anel.position.y = 0.05;
      raiz.add(anel);
      const feixe = new Mesh(
        new CylinderGeometry(raio(i) * 0.7, raio(i) * 0.7, 3.2, 24, 1, true),
        new MeshBasicMaterial({
          color: 0xfacc15,
          transparent: true,
          opacity: 0.13,
          side: DoubleSide,
          depthWrite: false,
          blending: AdditiveBlending,
        }),
      );
      feixe.position.y = 1.6;
      raiz.add(feixe);

      let icone: Sprite | null = null;
      let obj: Object3D | null = null;
      let spin = false;
      if (i.tipo === "tarefa" || i.tipo === "coord") {
        icone = new Sprite(
          new SpriteMaterial({
            map: texturaEmoji(i.tipo === "coord" ? "📋" : (EMOJI_TAREFA[i.id] ?? "✅")),
            depthTest: false,
            transparent: true,
          }),
        );
        icone.scale.set(0.9, 0.9, 1);
        icone.position.y = 2.5;
        raiz.add(icone);
      } else if (i.tipo === "breve") {
        const folha = new Group();
        folha.add(caixa(0.42, 0.02, 0.56, "#f8fafc", 0, 0, 0, 0.6));
        for (let k = 0; k < 4; k++)
          folha.add(caixa(0.3, 0.005, 0.025, "#64748b", 0, 0.012, -0.18 + k * 0.1));
        folha.add(caixa(0.12, 0.006, 0.12, "#dc2626", 0.12, 0.014, 0.18));
        folha.position.y = 1.15;
        raiz.add(folha);
        obj = folha;
        spin = true;
      } else if (i.tipo === "cafe") {
        const g = new Group();
        g.add(new Mesh(new CylinderGeometry(0.22, 0.22, 0.85, 18), padrao("#e5e7eb", 0.5)));
        g.children[0]!.position.y = 0.42;
        const copo = new Mesh(new CylinderGeometry(0.11, 0.08, 0.2, 14), padrao("#f8fafc", 0.4));
        copo.position.y = 1.0;
        g.add(copo);
        raiz.add(g);
        obj = g;
      } else if (i.tipo === "balcao") {
        const g = new Group();
        for (let k = 0; k < 4; k++) {
          const marm = new Group();
          marm.add(caixa(0.36, 0.12, 0.28, "#f1f5f9", 0, 0, 0, 0.4));
          marm.add(caixa(0.3, 0.04, 0.22, "#38bdf8", 0, 0.08, 0, 0.4));
          marm.position.set(-0.7 + k * 0.5, 0.78, -1.05);
          g.add(marm);
        }
        raiz.add(g);
        obj = g;
      } else if (i.tipo === "porta") {
        // porta do bloco: fica na face oeste do prédio, com a letra em cima
        const g = new Group();
        const porta = caixa(0.1, 2.0, 1.1, "#1e293b", 1.0, 1.0, 0.08, 0.5);
        g.add(porta);
        const letra = new Mesh(
          new PlaneGeometry(0.7, 0.5),
          new MeshStandardMaterial({
            map: texturaTexto(i.id.replace("porta", ""), 128, 96, "#0f172a", "#facc15", 0.8),
            roughness: 0.6,
          }),
        );
        letra.rotation.y = -Math.PI / 2;
        letra.position.set(0.94, 2.35, 0.08);
        g.add(letra);
        raiz.add(g);
        obj = g;
      }
      this.cena.add(raiz);
      this.marcadores.set(i.id, { raiz, anel, feixe, icone, obj, spin });
    }
  }

  private montarParticulas() {
    const n = 360;
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute("color", new BufferAttribute(new Float32Array(n * 3), 3));
    const mat = new PointsMaterial({
      size: 0.22,
      map: textoLuz(),
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.poeira = new Points(g, mat);
    this.poeira.frustumCulled = false;
    this.cena.add(this.poeira);
    for (let i = 0; i < n; i++) this.pv.push({ vx: 0, vy: 0, vz: 0, vida: 0, max: 1 });
    g.setDrawRange(0, n);
  }

  // -------------------------------------------------------------- interface

  /** Solta partículas (poeira, faíscas, confete). */
  emitir(px: number, py: number, cor: string, n: number, forca: number, altura = 0.4) {
    const pos = this.poeira.geometry.attributes["position"] as BufferAttribute;
    const cores = this.poeira.geometry.attributes["color"] as BufferAttribute;
    const c = new Color(cor.startsWith("rgba") ? "#ffffff" : cor);
    const total = this.pv.length;
    for (let k = 0; k < n; k++) {
      const i = this.poeiraInfo.n % total;
      this.poeiraInfo.n += 1;
      const a = Math.random() * Math.PI * 2;
      const v = (Math.random() * forca) / M;
      pos.setXYZ(i, metros(px), altura, metros(py));
      cores.setXYZ(i, c.r, c.g, c.b);
      this.pv[i] = {
        vx: Math.cos(a) * v,
        vy: 0.5 + Math.random() * 2.2,
        vz: Math.sin(a) * v,
        vida: 0.7 + Math.random() * 0.4,
        max: 1.1,
      };
    }
  }

  /** Pulo do jogador; em velocidade vira uma cambalhota de cinema. */
  saltar(correndo: boolean) {
    if (this.pulo > 0) return;
    this.puloTipo = correndo ? "cambalhota" : "salto";
    this.puloDur = correndo ? 0.95 : 0.8;
    this.pulo = this.puloDur;
  }

  tremer(v = 0.4) {
    this.tremor = Math.max(this.tremor, v);
  }

  gesto(nome: "agree" | "headShake" | "sad_pose", seg = 1.2) {
    this.jogador.gesto(nome, seg);
  }

  get emPulo(): number {
    return this.pulo;
  }

  private redimensionar() {
    const c = this.op.canvas;
    const w = c.clientWidth || 960;
    const h = c.clientHeight || 540;
    this.renderer.setSize(w, h, false);
    this.cam.aspect = w / h;
    this.cam.updateProjectionMatrix();
  }

  // ----------------------------------------------------------------- quadro

  desenhar(e: EstadoCena) {
    const dt = Math.min(0.05, e.dt || 0.016);
    this.t += dt;
    const M2 = this.op.mundo;
    const J = e.jogador;
    const jx = metros(J.x);
    const jz = metros(J.y);
    const vmx = metros(J.vx);
    const vmz = metros(J.vy);
    const vel = Math.hypot(vmx, vmz);
    this.velSuave += (vel - this.velSuave) * Math.min(1, dt * 12);

    // ---- jogador
    const r = this.jogador.raiz;
    r.position.x = jx;
    r.position.z = jz;
    if (vel > 0.35) {
      const alvo = Math.atan2(vmx, vmz);
      this.headingJ += angDif(this.headingJ, alvo) * Math.min(1, dt * 12);
    }
    r.rotation.y = this.headingJ;
    if (this.pulo > 0) {
      this.pulo = Math.max(0, this.pulo - dt);
      const k = 1 - this.pulo / this.puloDur;
      const alt = Math.sin(k * Math.PI) * (this.puloTipo === "cambalhota" ? 1.35 : 0.95);
      r.position.y = alt;
      this.giro.rotation.x =
        this.puloTipo === "cambalhota" ? -k * Math.PI * 2 : Math.sin(k * Math.PI) * -0.25;
      const agach = k < 0.12 || k > 0.9 ? 0.86 : 1;
      this.giro.scale.y += (agach - this.giro.scale.y) * Math.min(1, dt * 24);
      if (this.pulo === 0) {
        this.emitir(J.x, J.y, "#d6cdb8", 14, 130, 0.15);
        this.tremer(0.16);
        this.giro.rotation.x = 0;
      }
    } else {
      r.position.y = 0;
      const lean = J.correndo ? 0.16 : this.velSuave > 0.5 ? 0.05 : 0;
      this.giro.rotation.x += (lean - this.giro.rotation.x) * Math.min(1, dt * 8);
      this.giro.scale.y += (1 - this.giro.scale.y) * Math.min(1, dt * 12);
    }
    this.jogador.atualizar(dt, this.velSuave, J.correndo || this.pulo > 0);
    if (J.correndo && vel > 3 && Math.random() < dt * 22)
      this.emitir(J.x, J.y, "#d8d0bf", 1, 40, 0.1);

    // carga nas mãos
    if (this.op.foto) {
      this.jogador.carga = J.item === "marmita" ? J.carga : 0;
      if (this.velSuave > 0.3) this.jogador.lado = vmx >= 0 ? 1 : -1;
    }
    while (this.carga.children.length) this.carga.remove(this.carga.children[0]!);
    if (!this.op.foto && J.carga > 0 && J.item) {
      const n = Math.min(J.carga, 6);
      for (let k = 0; k < n; k++) {
        const c =
          J.item === "marmita"
            ? caixa(0.4, 0.11, 0.3, k % 2 ? "#f1f5f9" : "#e2e8f0", 0, k * 0.12, 0, 0.45)
            : caixa(0.3, 0.02, 0.4, "#f8fafc", 0, k * 0.03, 0, 0.6);
        this.carga.add(c);
      }
      this.carga.position.y = 0.95 + Math.sin(this.t * 9) * 0.02 * Math.min(1, this.velSuave);
    }

    // ---- cachorros
    while (this.cachorros.length < e.cachorros.length) {
      const idx = this.cachorros.length;
      const rig = criarCachorro(e.cachorros[idx]!.cor);
      rig.g.visible = false;
      this.cena.add(rig.g);
      this.cachorros.push(rig);
      this.cachorroDir.push(0);
    }
    e.cachorros.forEach((c, i) => {
      const rig = this.cachorros[i]!;
      rig.g.visible = c.visivel;
      if (!c.visivel) return;
      rig.g.position.set(metros(c.x), 0, metros(c.y));
      const v = Math.hypot(c.vx, c.vy);
      if (v > 15) {
        const alvo = Math.atan2(c.vx, c.vy);
        this.cachorroDir[i]! += angDif(this.cachorroDir[i]!, alvo) * Math.min(1, dt * 12);
      }
      rig.g.rotation.y = this.cachorroDir[i]!;
      const s = Math.sin(c.fase * 1.6) * (v > 15 ? 0.9 : 0);
      rig.pernas[0]!.rotation.x = s;
      rig.pernas[3]!.rotation.x = s;
      rig.pernas[1]!.rotation.x = -s;
      rig.pernas[2]!.rotation.x = -s;
      rig.g.position.y = Math.abs(Math.sin(c.fase * 1.6)) * (v > 15 ? 0.06 : 0);
      rig.cauda.rotation.z = Math.sin(this.t * 14) * (c.susto > 0.3 ? 0.9 : 0.35);
      rig.cabeca.rotation.x = c.susto > 0.3 ? -0.2 : 0;
    });

    // ---- patrulhas (funcionários, carrinhos e carros)
    while (this.patrulhaObj.length < e.patrulhas.length) {
      const p = e.patrulhas[this.patrulhaObj.length]!;
      let obj: Object3D;
      let agente: FiguraAnimada | null = null;
      if (p.tipo === "carrinho") obj = criarCarrinho();
      else if (p.tipo === "carro") obj = criarCarro(p.cor.camisa, false).g;
      else if (this.op.foto) {
        const idx = this.patrulhaObj.length % SPRITES_NPC.length;
        agente = new FiguraFoto(
          this.op.imagens?.[SPRITES_NPC[idx]!],
          { pernas: 0, cintura: idx === 2 ? 0 : 0.5, calca: p.cor.calca, bota: "#111" },
          TOM_FOTO[this.op.clima],
        );
        obj = agente.raiz;
      } else {
        agente = new Agente3D(this.gltf!, aparenciaNpc(p.cor));
        obj = agente.raiz;
      }
      obj.traverse((o) => ((o as Mesh).isMesh ? ((o as Mesh).castShadow = true) : null));
      this.cena.add(obj);
      this.patrulhaObj.push({ obj, agente, dir: 0, ux: metros(p.x), uy: metros(p.y) });
    }
    e.patrulhas.forEach((p, i) => {
      const o = this.patrulhaObj[i]!;
      const x = metros(p.x);
      const z = metros(p.y);
      const dx = x - o.ux;
      const dz = z - o.uy;
      o.ux = x;
      o.uy = z;
      const v = Math.hypot(dx, dz) / Math.max(0.001, dt);
      if (Math.hypot(dx, dz) > 0.002) {
        const alvo =
          p.tipo === "carro" ? (p.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : Math.atan2(dx, dz);
        o.dir += angDif(o.dir, alvo) * Math.min(1, dt * 10);
      }
      o.obj.position.set(x, 0, z);
      o.obj.rotation.y = o.dir;
      o.agente?.atualizar(dt, p.parado ? 0 : Math.min(v, 2.2), false);
      if (o.agente && this.op.foto && Math.abs(dx) > 0.002) o.agente.lado = dx >= 0 ? 1 : -1;
    });

    // ---- marcadores e objetos interativos
    for (const i of e.interativos) {
      const mk = this.marcadores.get(i.id);
      if (!mk) continue;
      const mostra = i.ativo && i.util;
      mk.anel.visible = mostra;
      mk.feixe.visible = mostra;
      if (mk.icone) mk.icone.visible = i.ativo;
      const cor = i.bloqueado ? 0x94a3b8 : 0xfacc15;
      (mk.anel.material as MeshBasicMaterial).color.setHex(cor);
      (mk.feixe.material as MeshBasicMaterial).color.setHex(cor);
      const pulso = 1 + Math.sin(this.t * 4 + i.x) * 0.07;
      mk.anel.scale.set(pulso, pulso, 1);
      if (mk.icone) mk.icone.position.y = 2.5 + Math.sin(this.t * 2.5 + i.x) * 0.12;
      if (
        mk.obj &&
        (i.tipo === "breve" || i.tipo === "cafe" || i.tipo === "balcao" || i.tipo === "porta")
      )
        mk.obj.visible = i.tipo === "breve" || i.tipo === "cafe" ? i.ativo : true;
      if (mk.spin && mk.obj) {
        mk.obj.rotation.y += dt * 1.8;
        mk.obj.position.y = 1.15 + Math.sin(this.t * 3 + i.x) * 0.1;
      }
    }

    // ---- luzes e sombras acompanham o jogador
    const s = new Vector3(...this.tempo.solDir).normalize();
    this.sol.position.set(jx + s.x * 40, s.y * 40, jz + s.z * 40);
    this.sol.target.position.set(jx, 0, jz);
    this.sol.target.updateMatrixWorld();
    if (this.pontos.length) {
      const ord = [...this.fontes].sort(
        (a, b) => a.distanceToSquared(r.position) - b.distanceToSquared(r.position),
      );
      this.pontos.forEach((p, k) => {
        const f = ord[k];
        if (!f) {
          p.intensity = 0;
          return;
        }
        p.position.copy(f);
        p.intensity = this.tempo.noite ? 55 : 30;
      });
    }
    const piscar = Math.floor(this.t * 4) % 2 === 0;
    this.luzesViatura.forEach((l, k) => {
      (l.material as MeshStandardMaterial).emissiveIntensity =
        (k % 2 === 0) === piscar ? 2.2 : 0.15;
    });

    // ---- partículas
    const pos = this.poeira.geometry.attributes["position"] as BufferAttribute;
    const cor = this.poeira.geometry.attributes["color"] as BufferAttribute;
    for (let i = 0; i < this.pv.length; i++) {
      const q = this.pv[i]!;
      if (q.vida <= 0) {
        pos.setY(i, -50);
        continue;
      }
      q.vida -= dt;
      q.vy -= 5.5 * dt;
      pos.setXYZ(
        i,
        pos.getX(i) + q.vx * dt,
        Math.max(0.02, pos.getY(i) + q.vy * dt),
        pos.getZ(i) + q.vz * dt,
      );
      const f = Math.max(0, q.vida / q.max);
      cor.setXYZ(i, cor.getX(i) * (0.985 + f * 0.01), cor.getY(i), cor.getZ(i));
    }
    pos.needsUpdate = true;
    cor.needsUpdate = true;

    // ---- câmera de cinema: por trás, com balanço lateral, zoom de corrida e tremor
    this.tremor = Math.max(0, this.tremor - dt * 1.8);
    const alvoYaw = ciclo(vmx * 0.045, -0.4, 0.4);
    this.camYaw += (alvoYaw - this.camYaw) * Math.min(1, dt * 1.6);
    const corre = J.correndo ? 1 : 0;
    const dist = 4.6 + corre * 0.9 + (this.pulo > 0 ? 0.6 : 0);
    const alt = 3.3 - corre * 0.3;
    const fx = ciclo(jx + vmx * 0.28, 4, metros(M2.w) - 4);
    const fz = ciclo(jz + vmz * 0.28, 4, metros(M2.h) - 2);
    this.cx += (fx - this.cx) * Math.min(1, dt * 5);
    this.cz += (fz - this.cz) * Math.min(1, dt * 5);
    if (this.cx === 0 && this.cz === 0) {
      this.cx = fx;
      this.cz = fz;
    }
    const alvo = new Vector3(this.cx, 1.15, this.cz - 1.8);
    const wanted = new Vector3(
      this.cx + Math.sin(this.camYaw) * dist,
      alt,
      this.cz + Math.cos(this.camYaw) * dist,
    );
    this.camPos.lerp(wanted, Math.min(1, dt * 6));
    this.camAlvo.lerp(alvo, Math.min(1, dt * 8));
    this.cam.position.copy(this.camPos);
    if (this.tremor > 0) {
      this.cam.position.x += (Math.random() - 0.5) * this.tremor * 0.35;
      this.cam.position.y += (Math.random() - 0.5) * this.tremor * 0.35;
    }
    this.cam.lookAt(this.camAlvo);
    const fovAlvo = 52 + corre * 5 + (this.pulo > 0 ? 3 : 0) + this.tremor * 4;
    this.fov += (fovAlvo - this.fov) * Math.min(1, dt * 4);
    this.cam.fov = this.fov;
    this.cam.updateProjectionMatrix();

    // ---- paredes entre a câmera e o jogador ficam transparentes
    const cxp = this.cam.position.x;
    const czp = this.cam.position.z;
    const cyp = this.cam.position.y;
    for (const p of this.paredes) {
      // segmento câmera → peito do jogador contra a caixa da parede
      let bloqueia = false;
      const steps = 16;
      for (let k = 1; k < steps; k++) {
        const u = k / steps;
        const px = cxp + (jx - cxp) * u;
        const py = cyp + (1.2 - cyp) * u;
        const pz = czp + (jz - czp) * u;
        if (
          px > p.x0 - 0.2 &&
          px < p.x1 + 0.2 &&
          pz > p.z0 - 0.2 &&
          pz < p.z1 + 0.2 &&
          py < p.y1 + 0.1
        ) {
          bloqueia = true;
          break;
        }
      }
      p.alvo = bloqueia ? 0.18 : 1;
      p.atual += (p.alvo - p.atual) * Math.min(1, dt * 8);
      for (const mt of p.malhas) (mt as MeshStandardMaterial).opacity = p.atual;
    }

    if (this.op.foto) {
      const c = this.cam.position;
      this.jogador.virarPara?.(c.x, c.z);
      for (const o of this.patrulhaObj) o.agente?.virarPara?.(c.x, c.z);
    }
    this.renderer.render(this.cena, this.cam);
  }

  destruir() {
    this.ro?.disconnect();
    this.cena.traverse((o) => {
      const m = o as Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as Material | Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
