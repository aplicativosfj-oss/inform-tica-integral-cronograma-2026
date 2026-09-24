/**
 * Cena 3D da Maratona do Plantão: corrida em terceira pessoa por uma pista
 * com três faixas. O motor (`motor-maratona.ts`) segue mandando em tudo — faixa,
 * pulo, obstáculos, fôlego — e esta cena só mostra o estado de cada quadro:
 * o agente corre com esqueleto animado, salta obstáculos (com cambalhota em
 * velocidade) e a câmera vem atrás, com zoom de velocidade e tremor nas batidas.
 */

import {
  ACESFilmicToneMapping,
  AmbientLight,
  BoxGeometry,
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
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  type Material,
} from "three";

import type { CenarioMaratona, Clima, Personagem } from "@/components/plantao/dados";
import {
  aparenciaDe,
  caixa,
  ciclo,
  criarCarro,
  montarCeu,
  padrao,
  TEMPOS,
  texturaTexto,
  type Tempo,
} from "@/components/plantao/cena3d";
import { criarChao } from "@/components/plantao/desenho";
import { Agente3D, carregarModeloBase } from "@/components/plantao/personagem3d";

/** Faixas (esquerda, centro, direita) em metros a partir do centro da pista. */
const X_FAIXA = [-2.2, 0, 2.2];
const PX_METRO = 40;
const X_JOGADOR = 210;
/** Altura do pulo do motor (px) para metros. */
const PULO_M = 1 / 82;

export interface EstadoMaratona {
  dt: number;
  /** Posição do jogador na pista, em px do motor. */
  posicao: number;
  /** Faixa suavizada (0 a 2). */
  faixa: number;
  /** Altura do pulo, em px do motor. */
  z: number;
  vel: number;
  dano: number;
  tropeco: number;
  cansado: boolean;
  total: number;
  obstaculos: {
    id: number;
    tipo: string;
    x: number;
    faixa: number;
    atingido: boolean;
    fase: number;
  }[];
  coletas: { id: number; tipo: string; x: number; faixa: number }[];
}

interface OpcoesMaratona3d {
  canvas: HTMLCanvasElement;
  clima: Clima;
  cenario: CenarioMaratona;
  personagem: Personagem;
  leve: boolean;
}

const metros = (px: number) => px / PX_METRO;
const CHUNK = 60;
const N_CHUNKS = 5;

function rng(semente: number) {
  let s = semente;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s % 100000) / 100000;
  };
}

// ---------------------------------------------------------------- cenário

function texturaJanelas(cor: string): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = cor;
  g.fillRect(0, 0, 128, 256);
  let s = 9;
  for (let y = 10; y < 250; y += 20)
    for (let x = 10; x < 120; x += 20) {
      s = (s * 16807) % 2147483647;
      g.fillStyle = s % 4 === 0 ? "#ffe6a3" : "#2c3550";
      g.fillRect(x, y, 11, 13);
    }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function palmeira(): Group {
  const g = new Group();
  const tronco = new Mesh(new CylinderGeometry(0.14, 0.2, 5.2, 8), padrao("#7a5a3a", 0.95));
  tronco.position.y = 2.6;
  g.add(tronco);
  for (let i = 0; i < 7; i++) {
    const eixo = new Group();
    eixo.position.y = 5.2;
    eixo.rotation.y = (i / 7) * Math.PI * 2;
    const folha = new Mesh(new BoxGeometry(0.4, 0.05, 2.6), padrao("#2f8f45", 0.8));
    folha.geometry.translate(0, 0, 1.3);
    folha.rotation.x = 0.5;
    eixo.add(folha);
    g.add(eixo);
  }
  return g;
}

function arvore(cor = "#2f7a3a", alt = 3.2): Group {
  const g = new Group();
  g.add(caixa(0.3, alt * 0.7, 0.3, "#5b3a22", 0, alt * 0.35, 0, 0.95));
  [
    [0, alt, 0, 1.3],
    [0.6, alt * 0.8, 0.3, 0.9],
    [-0.5, alt * 0.85, -0.3, 0.95],
  ].forEach(([x, y, z, r]) => {
    const f = new Mesh(new IcosahedronGeometry(r!, 1), padrao(cor, 0.95));
    f.position.set(x!, y!, z!);
    f.castShadow = true;
    g.add(f);
  });
  return g;
}

function poste(): Group {
  const g = new Group();
  g.add(caixa(0.12, 4.6, 0.12, "#4b5563", 0, 2.3, 0, 0.5));
  g.add(caixa(1.0, 0.08, 0.08, "#4b5563", 0.45, 4.6, 0));
  const l = new Mesh(
    new BoxGeometry(0.45, 0.1, 0.24),
    new MeshStandardMaterial({ color: 0xfff1c2, emissive: 0xffe7a3, emissiveIntensity: 1.6 }),
  );
  l.position.set(0.95, 4.52, 0);
  g.add(l);
  return g;
}

function predio(rnd: () => number, cor: string): Group {
  const g = new Group();
  const w = 6 + rnd() * 6;
  const h = 9 + rnd() * 26;
  const d = 7 + rnd() * 6;
  const tex = texturaJanelas(cor);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(Math.max(1, Math.round(w / 3)), Math.max(1, Math.round(h / 6)));
  const m = new Mesh(
    new BoxGeometry(w, h, d),
    new MeshStandardMaterial({
      map: tex,
      emissive: 0xffffff,
      emissiveMap: tex,
      emissiveIntensity: 0.18,
      roughness: 0.85,
    }),
  );
  m.position.y = h / 2;
  m.castShadow = true;
  g.add(m);
  return g;
}

function barco(): Group {
  const g = new Group();
  g.add(caixa(1.4, 0.5, 4.2, "#f8fafc", 0, 0.2, 0, 0.5));
  g.add(caixa(1.1, 0.7, 1.6, "#dc2626", 0, 0.75, -0.3, 0.5));
  g.add(caixa(1.2, 0.05, 1.8, "#94a3b8", 0, 1.14, -0.3, 0.5));
  return g;
}

function bandeira(cor: string): Group {
  const g = new Group();
  g.add(caixa(0.08, 4.2, 0.08, "#e5e7eb", 0, 2.1, 0, 0.4));
  const p = new Mesh(
    new PlaneGeometry(1.5, 0.9),
    new MeshStandardMaterial({ color: cor, side: DoubleSide }),
  );
  p.position.set(0.75, 3.8, 0);
  g.add(p);
  return g;
}

function arquibancada(rnd: () => number): Group {
  const g = new Group();
  for (let i = 0; i < 5; i++) {
    g.add(caixa(3.2, 0.6, 12, i % 2 ? "#64748b" : "#7b8798", i * 0.9, 0.3 + i * 0.6, 0, 0.9));
    for (let k = 0; k < 9; k++) {
      const cor = `#${new Color().setHSL(rnd(), 0.6, 0.5).getHexString()}`;
      const pessoa = new Group();
      pessoa.add(caixa(0.32, 0.55, 0.22, cor, 0, 0.32, 0, 0.9));
      pessoa.add(caixa(0.2, 0.2, 0.2, "#d9a07a", 0, 0.72, 0, 0.9));
      pessoa.position.set(i * 0.9, 0.6 + i * 0.6, -5.2 + k * 1.3 + rnd() * 0.2);
      g.add(pessoa);
    }
  }
  return g;
}

function faixaPedestre(): Mesh {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const g = c.getContext("2d")!;
  g.fillStyle = "rgba(255,255,255,0.9)";
  for (let i = 0; i < 8; i++) g.fillRect(i * 32 + 4, 0, 18, 64);
  const t = new CanvasTexture(c);
  const m = new Mesh(
    new PlaneGeometry(8.6, 2.6),
    new MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.025;
  return m;
}

function montarChunk(cenario: CenarioMaratona, semente: number): Group {
  const rnd = rng(semente * 7919 + 13);
  const g = new Group();
  const pos = (o: Object3D, x: number, z: number, ry = 0) => {
    o.position.set(x, o.position.y, -z);
    o.rotation.y = ry;
    o.traverse((m) => ((m as Mesh).isMesh ? ((m as Mesh).castShadow = true) : null));
    g.add(o);
  };
  // postes dos dois lados
  for (let z = 6; z < CHUNK; z += 20) {
    pos(poste(), -5.2, z);
    const p = poste();
    pos(p, 5.2, z + 10, Math.PI);
  }

  if (cenario === "rio") {
    // muro do cais, água e barcos à esquerda; palmeiras e prédios à direita
    for (let z = 0; z < CHUNK; z += 4)
      pos(caixa(0.3, 0.9, 4, "#9aa3ad", 0, 0.45, 0, 0.9), -6.4, z + 2);
    for (let z = 3; z < CHUNK; z += 8 + rnd() * 6) pos(palmeira(), 5.9 + rnd() * 0.6, z);
    for (let z = 4; z < CHUNK; z += 18 + rnd() * 14) {
      const b = barco();
      pos(b, -16 - rnd() * 12, z, Math.PI / 2 + (rnd() - 0.5) * 0.4);
    }
    for (let z = 2; z < CHUNK; z += 20 + rnd() * 10) pos(predio(rnd, "#9aa3b5"), 17 + rnd() * 6, z);
  } else if (cenario === "cidade") {
    for (let z = 3; z < CHUNK; z += 12 + rnd() * 6) {
      pos(predio(rnd, "#8794aa"), -13 - rnd() * 3, z);
      pos(predio(rnd, "#9a94a8"), 13 + rnd() * 3, z + 5);
    }
    for (let z = 10; z < CHUNK; z += 30 + rnd() * 10) {
      const carro = criarCarro(
        ["#dc2626", "#2563eb", "#eab308", "#e5e7eb"][Math.floor(rnd() * 4)]!,
        false,
      ).g;
      pos(carro, rnd() < 0.5 ? -7.4 : 7.4, z, Math.PI / 2);
    }
    const fx = faixaPedestre();
    fx.position.z = -CHUNK / 2;
    g.add(fx);
  } else if (cenario === "rural") {
    for (let z = 2; z < CHUNK; z += 6 + rnd() * 6) {
      pos(arvore(["#2f7a3a", "#3f8f45", "#4d9a3e"][Math.floor(rnd() * 3)]!), -6.5 - rnd() * 14, z);
      if (rnd() < 0.6) pos(arvore("#2a6c33", 2.6 + rnd()), 6.5 + rnd() * 14, z + 3);
    }
    for (let z = 0; z < CHUNK; z += 3) {
      pos(caixa(0.14, 1.1, 0.14, "#7a5a3a", 0, 0.55, 0, 0.9), -5.6, z);
      pos(caixa(0.14, 1.1, 0.14, "#7a5a3a", 0, 0.55, 0, 0.9), 5.6, z);
      pos(caixa(0.05, 0.08, 3, "#8a6a48", 0, 0.9, 0, 0.9), -5.6, z + 1.5);
      pos(caixa(0.05, 0.08, 3, "#8a6a48", 0, 0.9, 0, 0.9), 5.6, z + 1.5);
    }
    for (let z = 8; z < CHUNK; z += 24 + rnd() * 14) {
      const feno = new Mesh(new CylinderGeometry(0.7, 0.7, 1.1, 14), padrao("#d8b455", 0.95));
      feno.rotation.z = Math.PI / 2;
      feno.position.y = 0.7;
      pos(feno, (rnd() < 0.5 ? -1 : 1) * (9 + rnd() * 5), z);
    }
    if (semente % 2 === 0) {
      const celeiro = new Group();
      celeiro.add(caixa(7, 4, 9, "#a8322c", 0, 2, 0, 0.9));
      const telhado = new Mesh(new ConeGeometry(6.4, 2.6, 4), padrao("#4b2a1f", 0.9));
      telhado.rotation.y = Math.PI / 4;
      telhado.position.y = 5.3;
      celeiro.add(telhado);
      pos(celeiro, 22, 30);
    }
  } else {
    // evento: arquibancadas lotadas, bandeiras e arcos
    for (let z = 0; z < CHUNK; z += 12) {
      pos(arquibancada(rnd), 7.2, z + 6, 0);
      pos(arquibancada(rnd), -7.2, z + 6, Math.PI);
    }
    for (let z = 4; z < CHUNK; z += 6) {
      pos(bandeira(["#dc2626", "#2563eb", "#facc15", "#22c55e"][Math.floor(rnd() * 4)]!), -5.8, z);
      pos(
        bandeira(["#dc2626", "#2563eb", "#facc15", "#22c55e"][Math.floor(rnd() * 4)]!),
        5.8,
        z + 3,
      );
    }
    if (semente % 2 === 1) {
      const arco = new Group();
      arco.add(caixa(0.4, 5, 0.4, "#e5e7eb", -4.4, 2.5, 0, 0.5));
      arco.add(caixa(0.4, 5, 0.4, "#e5e7eb", 4.4, 2.5, 0, 0.5));
      const faixa = new Mesh(
        new PlaneGeometry(9.2, 1.4),
        new MeshStandardMaterial({
          map: texturaTexto("OPERAÇÃO: PLANTÃO", 1024, 156, "#1e3a8a", "#fbbf24", 0.55),
          side: DoubleSide,
        }),
      );
      faixa.position.set(0, 5.2, 0);
      arco.add(faixa);
      pos(arco, 0, 32);
    }
  }
  return g;
}

// ------------------------------------------------------------------- cena

export class CenaMaratona3d {
  private renderer: WebGLRenderer;
  private cena = new Scene();
  private cam: PerspectiveCamera;
  private sol: DirectionalLight;
  private tempo: Tempo;
  private ceu: Group;
  private pista: Mesh;
  private pistaTex: CanvasTexture;
  private terreno: Mesh;
  private agua: Mesh | null = null;
  private chunks: Group[] = [];
  private jogador: Agente3D;
  private giro = new Group();
  private objs = new Map<string, Object3D>();
  private chegada: Group;
  private ro: ResizeObserver;
  private t = 0;
  private pulo = false;
  private puloT = 0;
  private puloDur = 0.7;
  private saltos = 0;
  private flip = false;
  private tremor = 0;
  private fov = 58;
  private faixaX = 0;
  private lean = 0;
  private cx = 0;

  private constructor(
    private op: OpcoesMaratona3d,
    ag: Agente3D,
    total: number,
  ) {
    this.jogador = ag;
    this.tempo = TEMPOS[op.clima];
    const tp = this.tempo;
    this.renderer = new WebGLRenderer({
      canvas: op.canvas,
      antialias: !op.leve,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, op.leve ? 1.4 : 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = tp.exposicao;
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.cam = new PerspectiveCamera(this.fov, 16 / 9, 0.1, 900);
    this.cena.fog = new Fog(tp.nevoa, tp.nevoaPerto * 0.7, tp.nevoaLonge * 0.6);

    this.sol = new DirectionalLight(tp.sol, tp.solInt);
    this.sol.castShadow = true;
    const m = op.leve ? 1024 : 2048;
    this.sol.shadow.mapSize.set(m, m);
    const sc = this.sol.shadow.camera;
    sc.left = -14;
    sc.right = 14;
    sc.top = 14;
    sc.bottom = -14;
    sc.near = 1;
    sc.far = 80;
    this.sol.shadow.bias = -0.0004;
    this.sol.shadow.normalBias = 0.04;
    this.cena.add(this.sol, this.sol.target);
    this.cena.add(new HemisphereLight(tp.hemiCeu, tp.hemiChao, tp.hemiInt));
    this.cena.add(new AmbientLight(0xffffff, tp.noite ? 0.12 : 0.25));

    this.ceu = montarCeu(tp);
    this.cena.add(this.ceu);

    // pista (rola com o jogador, a textura corre para dar a ilusão de avanço)
    const asf = criarChao("asfalto");
    const pc = document.createElement("canvas");
    pc.width = 256;
    pc.height = 256;
    const pg = pc.getContext("2d")!;
    for (let x = 0; x < 256; x += asf.width)
      for (let y = 0; y < 256; y += asf.height) pg.drawImage(asf, x, y);
    pg.fillStyle = "rgba(255,255,255,0.85)";
    // linhas tracejadas entre as faixas e bordas contínuas
    for (const lx of [85, 171])
      for (let y = 0; y < 256; y += 128) pg.fillRect(lx - 3, y + 8, 6, 60);
    pg.fillStyle = "rgba(250,204,21,0.9)";
    pg.fillRect(4, 0, 6, 256);
    pg.fillRect(246, 0, 6, 256);
    this.pistaTex = new CanvasTexture(pc);
    this.pistaTex.wrapS = this.pistaTex.wrapT = RepeatWrapping;
    this.pistaTex.colorSpace = SRGBColorSpace;
    this.pistaTex.anisotropy = 8;
    const compr = 260;
    this.pistaTex.repeat.set(1, compr / 8);
    this.pista = new Mesh(
      new PlaneGeometry(7.4, compr),
      new MeshStandardMaterial({ map: this.pistaTex, roughness: 0.9 }),
    );
    this.pista.rotation.x = -Math.PI / 2;
    this.pista.receiveShadow = true;
    this.cena.add(this.pista);

    // terreno dos lados
    const corTerreno: Record<CenarioMaratona, number> = {
      rio: 0x8d97a3,
      cidade: 0x7c828c,
      rural: 0x5d8f45,
      evento: 0x6c7580,
    };
    this.terreno = new Mesh(new PlaneGeometry(200, compr), padrao(corTerreno[op.cenario], 1));
    this.terreno.rotation.x = -Math.PI / 2;
    this.terreno.position.y = -0.03;
    this.terreno.receiveShadow = true;
    this.cena.add(this.terreno);
    if (op.cenario === "rio") {
      this.agua = new Mesh(
        new PlaneGeometry(100, compr),
        new MeshStandardMaterial({ color: 0x2b7fb8, roughness: 0.08, metalness: 0.35 }),
      );
      this.agua.rotation.x = -Math.PI / 2;
      this.cena.add(this.agua);
    }

    // blocos de cenário reaproveitados ao longo da pista
    for (let i = 0; i < N_CHUNKS; i++) {
      const c = montarChunk(op.cenario, i + 1);
      this.chunks.push(c);
      this.cena.add(c);
    }

    // jogador
    ag.modelo.position.y = -0.9;
    this.giro.position.y = 0.9;
    ag.raiz.remove(ag.modelo);
    this.giro.add(ag.modelo);
    ag.raiz.add(this.giro);
    ag.raiz.rotation.y = Math.PI;
    this.cena.add(ag.raiz);

    // linha de chegada
    this.chegada = new Group();
    const chao = document.createElement("canvas");
    chao.width = 256;
    chao.height = 64;
    const cg = chao.getContext("2d")!;
    for (let x = 0; x < 16; x++)
      for (let y = 0; y < 4; y++) {
        cg.fillStyle = (x + y) % 2 ? "#0b0b0b" : "#f8fafc";
        cg.fillRect(x * 16, y * 16, 16, 16);
      }
    const linha = new Mesh(
      new PlaneGeometry(7.2, 1.6),
      new MeshBasicMaterial({ map: new CanvasTexture(chao) }),
    );
    linha.rotation.x = -Math.PI / 2;
    linha.position.y = 0.03;
    this.chegada.add(linha);
    this.chegada.add(caixa(0.5, 6, 0.5, "#e5e7eb", -4.2, 3, 0, 0.5));
    this.chegada.add(caixa(0.5, 6, 0.5, "#e5e7eb", 4.2, 3, 0, 0.5));
    const banner = new Mesh(
      new PlaneGeometry(9, 1.6),
      new MeshStandardMaterial({
        map: texturaTexto("CHEGADA", 1024, 180, "#b91c1c", "#ffffff", 0.6),
        side: DoubleSide,
      }),
    );
    banner.position.y = 5.6;
    this.chegada.add(banner);
    this.chegada.position.z = -metros(total + X_JOGADOR);
    this.cena.add(this.chegada);

    this.redimensionar();
    this.ro = new ResizeObserver(() => this.redimensionar());
    this.ro.observe(op.canvas);
  }

  static async criar(op: OpcoesMaratona3d, total: number): Promise<CenaMaratona3d> {
    const gltf = await carregarModeloBase();
    const ag = new Agente3D(gltf, aparenciaDe(op.personagem));
    return new CenaMaratona3d(op, ag, total);
  }

  saltar() {
    if (this.pulo) return;
    this.pulo = true;
    this.puloT = 0;
    this.saltos += 1;
    // a cada dois saltos, uma cambalhota de cinema
    this.flip = this.saltos % 2 === 0;
  }

  tremer(v = 0.5) {
    this.tremor = Math.max(this.tremor, v);
  }

  gesto(nome: "agree" | "headShake" | "sad_pose", seg = 1) {
    this.jogador.gesto(nome, seg);
  }

  private redimensionar() {
    const c = this.op.canvas;
    const w = c.clientWidth || 960;
    const h = c.clientHeight || 540;
    this.renderer.setSize(w, h, false);
    this.cam.aspect = w / h;
    this.cam.updateProjectionMatrix();
  }

  private objeto(chave: string, criar: () => Object3D): Object3D {
    let o = this.objs.get(chave);
    if (!o) {
      o = criar();
      o.traverse((m) => ((m as Mesh).isMesh ? ((m as Mesh).castShadow = true) : null));
      this.cena.add(o);
      this.objs.set(chave, o);
    }
    return o;
  }

  desenhar(e: EstadoMaratona) {
    const dt = Math.min(0.05, e.dt || 0.016);
    this.t += dt;
    const zJ = -metros(e.posicao);

    // ---- chão que acompanha
    this.pista.position.set(0, 0, zJ - 60);
    this.pistaTex.offset.y = -(zJ - 60) / 8;
    this.terreno.position.set(0, -0.03, zJ - 60);
    this.agua?.position.set(-57, -0.02, zJ - 60);
    this.ceu.position.set(0, 0, zJ);
    // blocos de cenário: o que ficou para trás vai para a frente
    const base = Math.floor(-zJ / CHUNK);
    this.chunks.forEach((c, i) => {
      // cada bloco fica no primeiro slot livre (base - 1 ... base + N - 2) que combine com seu índice
      const slot = base - 1 + ((((i - (base - 1)) % N_CHUNKS) + N_CHUNKS) % N_CHUNKS);
      c.position.z = -slot * CHUNK;
    });

    // ---- jogador
    const alvoX = X_FAIXA[0]! + ((e.faixa - 0) / 2) * (X_FAIXA[2]! - X_FAIXA[0]!);
    const dx = alvoX - this.faixaX;
    this.faixaX += dx * Math.min(1, dt * 12);
    this.lean += (ciclo(dx * 0.35, -0.35, 0.35) - this.lean) * Math.min(1, dt * 10);
    const r = this.jogador.raiz;
    r.position.set(this.faixaX, e.z * PULO_M, zJ);
    r.rotation.y = Math.PI; // o modelo olha para +Z; a pista segue para -Z
    this.giro.rotation.z = this.lean;
    if (this.pulo) {
      this.puloT += dt;
      const k = Math.min(1, this.puloT / this.puloDur);
      this.giro.rotation.x = this.flip ? -k * Math.PI * 2 : -0.2 * Math.sin(k * Math.PI);
      if (this.puloT >= this.puloDur || (e.z <= 0.5 && this.puloT > 0.15)) {
        this.pulo = false;
        this.giro.rotation.x = 0;
      }
    } else {
      this.giro.rotation.x += (0.16 - this.giro.rotation.x) * Math.min(1, dt * 8);
    }
    if (e.dano > 0.5) this.giro.rotation.x += 0.02;
    const vMs = metros(e.vel);
    this.jogador.atualizar(dt, vMs, true);

    // ---- obstáculos
    const vistos = new Set<string>();
    for (const o of e.obstaculos) {
      const z = -metros(o.x);
      if (z < zJ - 90 || z > zJ + 12) continue;
      const chave = `o${o.id}`;
      vistos.add(chave);
      const obj = this.objeto(chave, () => this.criarObstaculo(o.tipo));
      obj.position.set(X_FAIXA[o.faixa]!, obj.position.y, z);
      if (o.tipo === "cachorro") {
        obj.position.y = Math.abs(Math.sin(o.fase)) * 0.06;
        obj.rotation.y = -Math.PI / 2;
        const pernas = obj.userData["pernas"] as Group[] | undefined;
        pernas?.forEach(
          (p, k) => (p.rotation.x = Math.sin(o.fase * 1.4 + (k % 2 ? Math.PI : 0)) * 0.9),
        );
      }
      obj.visible = !o.atingido || o.tipo === "cachorro";
      if (o.atingido && o.tipo !== "cachorro") obj.rotation.z = 0.9;
    }
    for (const o of e.coletas) {
      const z = -metros(o.x);
      if (z < zJ - 90 || z > zJ + 12) continue;
      const chave = `c${o.id}`;
      vistos.add(chave);
      const obj = this.objeto(chave, () => this.criarColeta(o.tipo));
      obj.position.set(X_FAIXA[o.faixa]!, 0.9 + Math.sin(this.t * 3 + o.id) * 0.12, z);
      obj.rotation.y += dt * 2.4;
    }
    for (const [k, v] of this.objs) {
      if (!vistos.has(k)) {
        this.cena.remove(v);
        v.traverse((m) => {
          const mesh = m as Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
        });
        this.objs.delete(k);
      }
    }

    // ---- luz e sombra
    const sd = new Vector3(...this.tempo.solDir).normalize();
    this.sol.position.set(this.faixaX + sd.x * 30, sd.y * 30, zJ + sd.z * 30);
    this.sol.target.position.set(this.faixaX, 0, zJ);
    this.sol.target.updateMatrixWorld();

    // ---- câmera de cinema
    this.tremor = Math.max(0, this.tremor - dt * 1.8);
    const cxAlvo = this.faixaX * 0.6;
    this.cx += (cxAlvo - this.cx) * Math.min(1, dt * 5);
    const alt = 2.7 + (this.pulo ? 0.5 : 0);
    const dist = 4.6 + Math.min(1.4, vMs * 0.06);
    this.cam.position.set(
      this.cx + (Math.random() - 0.5) * this.tremor * 0.3,
      alt + (Math.random() - 0.5) * this.tremor * 0.3,
      zJ + dist,
    );
    this.cam.lookAt(this.cx * 0.7, 1.2, zJ - 5);
    const fovAlvo = 56 + Math.min(14, vMs * 0.9) + this.tremor * 4 + (e.cansado ? -3 : 0);
    this.fov += (fovAlvo - this.fov) * Math.min(1, dt * 3);
    this.cam.fov = this.fov;
    this.cam.updateProjectionMatrix();

    this.renderer.render(this.cena, this.cam);
  }

  private criarObstaculo(tipo: string): Object3D {
    const g = new Group();
    if (tipo === "cone") {
      const c = new Mesh(new ConeGeometry(0.28, 0.85, 16), padrao("#f97316", 0.6));
      c.position.y = 0.45;
      g.add(c);
      const f = new Mesh(new CylinderGeometry(0.16, 0.21, 0.14, 16), padrao("#f8fafc", 0.5));
      f.position.y = 0.5;
      g.add(f);
      g.add(caixa(0.6, 0.06, 0.6, "#1b1b1b", 0, 0.03, 0));
    } else if (tipo === "barreira") {
      g.add(caixa(1.6, 0.26, 0.14, "#dc2626", 0, 0.75, 0, 0.6));
      g.add(caixa(1.6, 0.26, 0.145, "#f8fafc", 0, 0.5, 0, 0.6));
      g.add(caixa(0.1, 0.9, 0.12, "#6b7280", -0.7, 0.45, 0));
      g.add(caixa(0.1, 0.9, 0.12, "#6b7280", 0.7, 0.45, 0));
    } else if (tipo === "poca") {
      const p = new Mesh(
        new CylinderGeometry(0.85, 0.85, 0.03, 24),
        new MeshStandardMaterial({
          color: 0x0f1c33,
          roughness: 0.03,
          metalness: 0.5,
          transparent: true,
          opacity: 0.85,
        }),
      );
      p.position.y = 0.03;
      g.add(p);
    } else if (tipo === "caixa") {
      g.add(caixa(1.05, 1.05, 1.05, "#b98a4d", 0, 0.53, 0, 0.9));
      g.add(caixa(1.07, 0.12, 1.07, "#8a6534", 0, 0.53, 0, 0.9));
      g.add(caixa(0.12, 1.07, 1.07, "#8a6534", 0, 0.53, 0, 0.9));
    } else {
      // cachorro atravessando
      const corpo = caixa(0.32, 0.3, 0.7, "#c98a4d", 0, 0.42, 0, 0.9);
      g.add(corpo);
      g.add(caixa(0.22, 0.22, 0.24, "#c98a4d", 0, 0.62, 0.45, 0.9));
      g.add(caixa(0.14, 0.11, 0.14, "#8e5b2a", 0, 0.58, 0.6, 0.9));
      const cauda = caixa(0.06, 0.06, 0.32, "#8e5b2a", 0, 0.58, -0.42, 0.9);
      cauda.rotation.x = 0.7;
      g.add(cauda);
      const pernas: Group[] = [];
      for (const [sx, sz] of [
        [-0.11, 0.25],
        [0.11, 0.25],
        [-0.11, -0.25],
        [0.11, -0.25],
      ] as [number, number][]) {
        const p = new Group();
        p.position.set(sx, 0.3, sz);
        p.add(caixa(0.08, 0.32, 0.08, "#8e5b2a", 0, -0.16, 0, 0.9));
        g.add(p);
        pernas.push(p);
      }
      g.userData["pernas"] = pernas;
      g.scale.setScalar(1.2);
    }
    return g;
  }

  private criarColeta(tipo: string): Object3D {
    const g = new Group();
    if (tipo === "agua") {
      const g1 = new Mesh(
        new CylinderGeometry(0.15, 0.15, 0.5, 14),
        new MeshStandardMaterial({
          color: 0x8fd3ff,
          transparent: true,
          opacity: 0.85,
          roughness: 0.1,
        }),
      );
      g.add(g1);
      const tampa = new Mesh(new CylinderGeometry(0.08, 0.08, 0.1, 10), padrao("#2563eb", 0.4));
      tampa.position.y = 0.3;
      g.add(tampa);
    } else {
      const e = new Mesh(
        new IcosahedronGeometry(0.28, 0),
        new MeshStandardMaterial({
          color: 0xfacc15,
          emissive: 0xfacc15,
          emissiveIntensity: 0.7,
          metalness: 0.6,
          roughness: 0.3,
        }),
      );
      g.add(e);
    }
    return g;
  }

  destruir() {
    this.ro.disconnect();
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
