/**
 * Personagem "de foto" dentro da cena 3D.
 *
 * Usa o recorte realista do agente (as imagens da equipe) desenhado num canvas
 * a cada quadro, com pernas e braços articulados, e o pendura num plano que
 * sempre encara a câmera. Assim o jogador vê o personagem igual à imagem, no
 * meio de um cenário 3D com luz e sombra.
 */

import {
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
} from "three";

import { ALTURA_AGENTE, desenharFigura } from "@/components/plantao/desenho";
import type { FiguraAnimada, PoseGesto } from "@/components/plantao/personagem3d";

export interface ConfigFigura {
  pernas: number;
  cintura: number;
  calca: string;
  bota: string;
}

const L = 256;
const A = 320;
/** Altura do desenho em px do canvas: a figura de 100 unidades vira 260 px. */
const ESC = 2.6;

export class FiguraFoto implements FiguraAnimada {
  readonly raiz = new Group();
  readonly modelo = new Group();
  lado = 1;
  carga = 0;
  private plano: Mesh;
  private tex: CanvasTexture;
  private ctx: CanvasRenderingContext2D;
  private mat: MeshBasicMaterial;
  private fase = Math.random() * 6;
  private dano = 0;
  private braco = 0;
  private t = 0;

  constructor(
    private img: HTMLImageElement | undefined,
    private cfg: ConfigFigura,
    tom: number,
  ) {
    const cv = document.createElement("canvas");
    cv.width = L;
    cv.height = A;
    this.ctx = cv.getContext("2d")!;
    this.tex = new CanvasTexture(cv);
    this.tex.colorSpace = SRGBColorSpace;
    this.tex.anisotropy = 4;
    this.mat = new MeshBasicMaterial({
      map: this.tex,
      transparent: true,
      alphaTest: 0.04,
      color: tom,
      depthWrite: true,
    });
    // 256 px ↔ 1,92 m: a figura fica com cerca de 1,95 m
    this.plano = new Mesh(new PlaneGeometry(1.92, 2.4), this.mat);
    this.plano.position.y = 1.05;
    this.modelo.add(this.plano);
    this.raiz.add(this.modelo);
  }

  gesto(nome: PoseGesto, segundos = 1.2) {
    if (nome === "agree") this.braco = Math.min(1.4, segundos);
    else this.dano = Math.min(1, segundos);
  }

  /** Faz o plano encarar a câmera (só gira em torno do eixo vertical). */
  virarPara(cx: number, cz: number) {
    const p = this.raiz.position;
    this.plano.rotation.y = Math.atan2(cx - p.x, cz - p.z) - this.raiz.rotation.y;
  }

  atualizar(dt: number, v: number, correndo: boolean) {
    this.t += dt;
    this.fase += dt * (v * 1.9 + 1.4);
    this.dano = Math.max(0, this.dano - dt * 1.4);
    this.braco = Math.max(0, this.braco - dt * 2.5);
    const c = this.ctx;
    c.clearRect(0, 0, L, A);
    if (this.img && this.img.complete && this.img.naturalWidth > 0) {
      desenharFigura(
        c,
        L / 2,
        A - 20,
        this.img,
        ALTURA_AGENTE,
        this.cfg.pernas,
        this.cfg.calca,
        this.cfg.bota,
        {
          dir: this.lado,
          fase: this.fase,
          correndo,
          parado: v < 0.4,
          carga: this.carga,
          dano: this.dano,
          escala: ESC,
          bracoAlto: this.braco,
          cintura: this.cfg.cintura,
        },
      );
    }
    this.tex.needsUpdate = true;
  }
}
