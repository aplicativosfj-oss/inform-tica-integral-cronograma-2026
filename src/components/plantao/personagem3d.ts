/**
 * Personagens 3D do "Operação: Plantão".
 *
 * Todos usam o mesmo esqueleto humano animado de verdade (parado, andando e
 * correndo, mais poses de gesto). Cada agente ganha as cores do uniforme
 * pintadas direto na malha e os acessórios dele presos aos ossos: cabelo,
 * óculos, mochila, cinto com coldre, distintivo e o texto nas costas — que é
 * o que a câmera mostra na maior parte do jogo.
 */

import {
  AnimationAction,
  AnimationClip,
  AnimationMixer,
  BoxGeometry,
  BufferAttribute,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  LoopOnce,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  type BufferGeometry,
  type SkinnedMesh,
} from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as clonarComOsso } from "three/examples/jsm/utils/SkeletonUtils.js";

export interface AparenciaAgente {
  camisa: string;
  calca: string;
  bota: string;
  pele: string;
  cabelo: string;
  /** Camisa de manga curta (o antebraço aparece). */
  mangaCurta: boolean;
  /** Cinto tático com coldre. */
  cinto?: boolean;
  mochila?: boolean;
  oculos?: boolean;
  colete?: string;
  /** Texto impresso nas costas. */
  costas?: string;
  corCostas?: string;
  /** Distintivo dourado no peito. */
  distintivo?: boolean;
  /** Boné ou chapéu (cor). */
  chapeu?: string;
  /** Capuz do moletom (cor). */
  capuz?: string;
  /** Cabelo em cachos (estilo do Seu Santos). */
  cacheado?: boolean;
  /** Personagem de blocos: peças mais quadradas e amarelas. */
  lego?: boolean;
  escala?: number;
  /** Corpulência (1 = padrão): alarga ombros e tronco. */
  largura?: number;
}

/** O que a cena precisa de um personagem, seja ele 3D com esqueleto ou figura de foto. */
export interface FiguraAnimada {
  raiz: Group;
  modelo: Group;
  lado?: number;
  carga?: number;
  atualizar(dt: number, v: number, correndo: boolean): void;
  gesto(nome: PoseGesto, segundos?: number): void;
  virarPara?(cx: number, cz: number): void;
}

export type PoseGesto = "agree" | "headShake" | "sad_pose" | "sneak_pose";

const URL_MODELO = "/models/Xbot.glb";
let carregando: Promise<GLTF> | null = null;

export function carregarModeloBase(): Promise<GLTF> {
  carregando ??= new GLTFLoader().loadAsync(URL_MODELO);
  return carregando;
}

// -------------------------------------------------------------- pintura da malha

function pintar(geo: BufferGeometry, a: AparenciaAgente, junta: boolean) {
  const pos = geo.attributes["position"]!;
  const cores = new Float32Array(pos.count * 3);
  const pele = new Color(a.pele);
  const camisa = new Color(a.camisa);
  const calca = new Color(a.calca);
  const bota = new Color(a.bota);
  const colete = a.colete ? new Color(a.colete) : null;
  const c = new Color();
  for (let i = 0; i < pos.count; i++) {
    const x = Math.abs(pos.getX(i));
    const y = pos.getY(i);
    if (y < 0.1) c.copy(bota);
    else if (y < 0.92) c.copy(calca);
    else if (y < 1.5) {
      // tronco e braços
      if (x < 0.24) c.copy(colete && y > 1.0 && x < 0.2 ? colete : camisa);
      else if (x < (a.mangaCurta ? 0.42 : 0.74)) c.copy(camisa);
      else c.copy(pele);
    } else if (y < 1.56 && x > 0.3) {
      c.copy(x < (a.mangaCurta ? 0.42 : 0.74) ? camisa : pele);
    } else c.copy(pele);
    if (junta) c.multiplyScalar(0.75);
    cores[i * 3] = c.r;
    cores[i * 3 + 1] = c.g;
    cores[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new BufferAttribute(cores, 3));
}

// ------------------------------------------------------------------ acessórios

function textoCostas(texto: string, cor: string): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 160;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, 512, 160);
  g.fillStyle = cor;
  g.textAlign = "center";
  g.textBaseline = "middle";
  let tam = 62;
  g.font = `900 ${tam}px Arial, Helvetica, sans-serif`;
  while (g.measureText(texto).width > 480 && tam > 20) {
    tam -= 3;
    g.font = `900 ${tam}px Arial, Helvetica, sans-serif`;
  }
  g.fillText(texto, 256, 82);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** Pendura um grupo na escala de metros num osso (que trabalha em centímetros). */
function preso(osso: Object3D): Group {
  const g = new Group();
  g.scale.setScalar(100);
  osso.add(g);
  return g;
}

function malha(geo: BufferGeometry, cor: string, rugosidade = 0.8): Mesh {
  const m = new Mesh(geo, new MeshStandardMaterial({ color: cor, roughness: rugosidade }));
  m.castShadow = true;
  return m;
}

function acessorios(raiz: Object3D, a: AparenciaAgente) {
  const osso = (nome: string) => raiz.getObjectByName(`mixamorig${nome}`);
  const cabeca = osso("Head");
  const espinha = osso("Spine2");
  const quadril = osso("Hips");

  if (cabeca) {
    const g = preso(cabeca);
    if (a.cacheado) {
      // cachos: um aglomerado de esferas pretas
      let s = 3;
      for (let i = 0; i < 26; i++) {
        s = (s * 16807) % 2147483647;
        const u = (s % 1000) / 1000;
        s = (s * 16807) % 2147483647;
        const v = (s % 1000) / 1000;
        const teta = u * Math.PI * 2;
        const fi = v * 1.25;
        const r = 0.115;
        const b = malha(new SphereGeometry(0.045, 8, 8), a.cabelo, 0.5);
        b.position.set(
          Math.sin(fi) * Math.cos(teta) * r,
          0.1 + Math.cos(fi) * r * 0.95,
          Math.sin(fi) * Math.sin(teta) * r - 0.01,
        );
        g.add(b);
      }
    } else if (!a.capuz) {
      const cabelo = malha(
        new SphereGeometry(0.122, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.6),
        a.cabelo,
        0.55,
      );
      cabelo.position.set(0, 0.104, -0.012);
      cabelo.scale.set(1, 1, 1.06);
      g.add(cabelo);
    }
    if (a.capuz) {
      const capuz = malha(
        new SphereGeometry(0.135, 20, 14, 0, Math.PI * 2, Math.PI * 0.18, Math.PI * 0.78),
        a.capuz,
        0.9,
      );
      capuz.position.set(0, 0.075, -0.045);
      g.add(capuz);
    }
    if (a.chapeu) {
      const topo = malha(
        new SphereGeometry(0.112, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
        a.chapeu,
        0.8,
      );
      topo.position.set(0, 0.112, -0.002);
      g.add(topo);
      const aba = malha(new CylinderGeometry(0.115, 0.115, 0.012, 20), a.chapeu, 0.8);
      aba.position.set(0, 0.112, 0.045);
      aba.scale.set(1, 1, 1.3);
      aba.rotation.x = -0.1;
      g.add(aba);
    }
    if (a.oculos) {
      const lente = new MeshStandardMaterial({ color: "#050505", roughness: 0.15, metalness: 0.6 });
      for (const lado of [-1, 1]) {
        const l = new Mesh(new BoxGeometry(0.056, 0.036, 0.012), lente);
        l.position.set(lado * 0.036, 0.094, 0.107);
        g.add(l);
      }
      const ponte = new Mesh(new BoxGeometry(0.02, 0.008, 0.01), lente);
      ponte.position.set(0, 0.098, 0.107);
      g.add(ponte);
    }
  }

  if (espinha) {
    const g = preso(espinha);
    if (a.colete) {
      const colete = malha(new BoxGeometry(0.32, 0.36, 0.2), a.colete, 0.9);
      colete.position.set(0, 0.06, -0.005);
      g.add(colete);
    }
    if (a.mochila) {
      const mochila = malha(new BoxGeometry(0.3, 0.4, 0.15), "#1c1c20", 0.9);
      mochila.position.set(0, 0.07, -0.17);
      g.add(mochila);
      const bolso = malha(new BoxGeometry(0.22, 0.14, 0.05), "#2b2b31", 0.9);
      bolso.position.set(0, -0.02, -0.26);
      g.add(bolso);
    }
    if (a.costas) {
      const plano = new Mesh(
        new PlaneGeometry(0.3, 0.094),
        new MeshStandardMaterial({
          map: textoCostas(a.costas, a.corCostas ?? "#f8fafc"),
          transparent: true,
          roughness: 0.9,
          side: DoubleSide,
        }),
      );
      plano.rotation.y = Math.PI;
      plano.position.set(0, 0.12, a.mochila ? -0.2 : a.colete ? -0.108 : -0.128);
      g.add(plano);
    }
    if (a.distintivo) {
      const d = new Mesh(
        new CylinderGeometry(0.03, 0.03, 0.006, 6),
        new MeshStandardMaterial({ color: "#e6c24a", metalness: 0.7, roughness: 0.3 }),
      );
      d.rotation.x = Math.PI / 2;
      d.position.set(0.085, 0.12, a.colete ? 0.108 : 0.105);
      g.add(d);
    }
  }

  if (quadril && a.cinto) {
    const g = preso(quadril);
    const cinto = malha(new CylinderGeometry(0.175, 0.175, 0.05, 20), "#0d0d0d", 0.6);
    cinto.position.set(0, 0.03, 0.005);
    cinto.scale.set(1, 1, 0.8);
    g.add(cinto);
    const fivela = new Mesh(
      new BoxGeometry(0.04, 0.035, 0.01),
      new MeshStandardMaterial({ color: "#d4af37", metalness: 0.8, roughness: 0.3 }),
    );
    fivela.position.set(0, 0.03, 0.148);
    g.add(fivela);
    const coldre = malha(new BoxGeometry(0.05, 0.18, 0.09), "#0a0a0a", 0.7);
    coldre.position.set(-0.19, -0.1, 0.01);
    g.add(coldre);
    const rad = malha(new BoxGeometry(0.05, 0.1, 0.035), "#111", 0.6);
    rad.position.set(0.19, 0.0, 0.0);
    g.add(rad);
  }
}

// ---------------------------------------------------------------------- agente

export interface EstadoMovimento {
  /** Velocidade horizontal em metros por segundo. */
  velocidade: number;
}

/**
 * Um personagem em cena. `raiz` é quem anda e gira; o `modelo` dentro dela
 * pode inclinar e dar cambalhotas sem mexer no ponto de apoio.
 */
export class Agente3D implements FiguraAnimada {
  readonly raiz = new Group();
  readonly modelo = new Group();
  private mixer: AnimationMixer;
  private parado: AnimationAction;
  private andar: AnimationAction;
  private correr: AnimationAction;
  private gestos = new Map<string, AnimationAction>();
  private gestoAtual: AnimationAction | null = null;
  private gestoAte = 0;
  private t = 0;

  constructor(gltf: GLTF, a: AparenciaAgente) {
    const cena = clonarComOsso(gltf.scene) as Group;
    cena.traverse((o) => {
      const sm = o as SkinnedMesh;
      if (!sm.isSkinnedMesh) return;
      sm.geometry = sm.geometry.clone();
      pintar(sm.geometry, a, sm.name.includes("Joints"));
      sm.material = new MeshStandardMaterial({
        vertexColors: true,
        roughness: a.lego ? 0.35 : 0.72,
        metalness: 0,
      });
      sm.castShadow = true;
      sm.receiveShadow = false;
      sm.frustumCulled = false;
    });
    acessorios(cena, a);
    this.modelo.add(cena);
    const esc = a.escala ?? 1;
    const larg = a.largura ?? 1;
    this.modelo.scale.set(esc * larg, esc, esc * (1 + (larg - 1) * 0.6));
    this.raiz.add(this.modelo);

    this.mixer = new AnimationMixer(cena);
    const clipe = (n: string): AnimationClip =>
      gltf.animations.find((c) => c.name === n) ?? gltf.animations[0]!;
    this.parado = this.mixer.clipAction(clipe("idle"));
    this.andar = this.mixer.clipAction(clipe("walk"));
    this.correr = this.mixer.clipAction(clipe("run"));
    for (const n of ["agree", "headShake", "sad_pose", "sneak_pose"]) {
      const ac = this.mixer.clipAction(clipe(n));
      ac.setLoop(LoopOnce, 1);
      ac.clampWhenFinished = true;
      this.gestos.set(n, ac);
    }
    for (const ac of [this.parado, this.andar, this.correr]) {
      ac.play();
      ac.setEffectiveWeight(0);
    }
    this.parado.setEffectiveWeight(1);
  }

  /** Toca um gesto por alguns segundos (cumprimento, negativa, tombo). */
  gesto(nome: PoseGesto, segundos = 1.4) {
    const ac = this.gestos.get(nome);
    if (!ac) return;
    this.gestoAtual?.fadeOut(0.15);
    ac.reset().setEffectiveWeight(1).fadeIn(0.15).play();
    this.gestoAtual = ac;
    this.gestoAte = this.t + segundos;
  }

  /** `v`: velocidade em m/s; `correndo`: ritmo de corrida. */
  atualizar(dt: number, v: number, correndo: boolean) {
    this.t += dt;
    const gesto = this.gestoAtual && this.t < this.gestoAte;
    if (this.gestoAtual && !gesto) {
      this.gestoAtual.fadeOut(0.2);
      this.gestoAtual = null;
    }
    // mistura suave entre parado, andando e correndo
    const andando = Math.min(1, v / 1.6);
    const corre = correndo ? Math.min(1, Math.max(0, (v - 2.4) / 2.2)) : 0;
    const alvoParado = (1 - andando) * (gesto ? 0 : 1);
    const alvoAndar = andando * (1 - corre) * (gesto ? 0 : 1);
    const alvoCorrer = andando * corre * (gesto ? 0 : 1);
    const k = Math.min(1, dt * 10);
    const mix = (ac: AnimationAction, alvo: number) =>
      ac.setEffectiveWeight(ac.getEffectiveWeight() + (alvo - ac.getEffectiveWeight()) * k);
    mix(this.parado, alvoParado);
    mix(this.andar, alvoAndar);
    mix(this.correr, alvoCorrer);
    this.andar.setEffectiveTimeScale(Math.max(0.5, v / 1.5));
    this.correr.setEffectiveTimeScale(Math.max(0.7, Math.min(1.7, v / 4.2)));
    this.mixer.update(dt);
  }
}
