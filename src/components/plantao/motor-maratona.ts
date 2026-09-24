/**
 * Motor da Maratona do Plantão: corrida lateral com três faixas.
 *
 * O agente corre sozinho; o jogador troca de faixa (para cima ou para baixo),
 * pula os obstáculos baixos (cones, barreiras, poças) e desvia dos altos
 * (caixas, cachorros atravessando). Garrafas de água devolvem o fôlego. Quem
 * chega à linha de chegada com fôlego ganha; sem fôlego, a corrida acaba.
 */

import {
  velocidadeDe,
  type CenarioMaratona,
  type Clima,
  type Nivel,
  type Personagem,
} from "@/components/plantao/dados";
import {
  CACHORROS,
  desenharAgente,
  desenharCachorro,
  desenharCone,
  desenharGarrafa,
  sombra,
  type Imagens,
} from "@/components/plantao/desenho";
import type { SomPlantao } from "@/components/plantao/som-plantao";
import type { ResultadoArena } from "@/components/plantao/motor-arena";

export const MW = 960;
export const MH = 540;

export interface EntradaMaratona {
  /** -1 sobe de faixa, 1 desce; consumido pelo motor. */
  faixa: number;
  pular: boolean;
}

export interface HudMaratona {
  metros: number;
  meta: number;
  folego: number;
  pontos: number;
  velocidade: number;
  aviso: string | null;
}

export interface OpcoesMaratona {
  canvas: HTMLCanvasElement;
  personagem: Personagem;
  nivel: Nivel;
  clima: Clima;
  cenario: CenarioMaratona;
  meta: number;
  som: SomPlantao | null;
  imagens: Imagens;
  aoHud: (h: HudMaratona) => void;
  aoFim: (r: ResultadoArena) => void;
}

type TipoObst = "cone" | "barreira" | "poca" | "caixa" | "cachorro";

interface Obstaculo {
  tipo: TipoObst;
  x: number;
  faixa: number;
  atingido: boolean;
  vx: number;
  fase: number;
}

interface Coleta {
  tipo: "agua" | "estrela";
  x: number;
  faixa: number;
  pega: boolean;
}

const FAIXAS_Y = [372, 432, 492];
const ESCALA_FAIXA = [0.9, 1, 1.1];
const PX_METRO = 40;
const X_JOGADOR = 210;

export class Maratona {
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private ultimo = 0;
  private parado = true;
  private terminou = false;
  private t = 0;
  entrada: EntradaMaratona = { faixa: 0, pular: false };

  private distancia = 0; // em px
  private vel = 300;
  private faixa = 1;
  private yTela = FAIXAS_Y[1]!;
  private z = 0;
  private vz = 0;
  private folego = 1;
  private pontos = 0;
  private fase = 0;
  private dano = 0;
  private tropeco = 0;
  private aviso: string | null = null;
  private avisoAte = 0;
  private obstaculos: Obstaculo[] = [];
  private coletas: Coleta[] = [];
  private proximoSpawn = 900;
  private acumHud = 0;
  private cansado = 0;
  private sonsAgua = 0;
  private readonly total: number;
  private readonly base: number;

  constructor(private op: OpcoesMaratona) {
    op.canvas.width = MW;
    op.canvas.height = MH;
    this.ctx = op.canvas.getContext("2d")!;
    this.total = op.meta * PX_METRO;
    this.base = 250 + (velocidadeDe(op.personagem) - 275) * 0.55 + op.nivel * 30;
    this.vel = this.base;
  }

  iniciar() {
    this.parado = false;
    this.ultimo = performance.now();
    this.op.som?.iniciarMusica(this.op.clima);
    const quadro = (agora: number) => {
      if (this.parado) return;
      const dt = Math.min((agora - this.ultimo) / 1000, 1 / 20);
      this.ultimo = agora;
      if (!this.terminou) this.atualizar(dt);
      this.desenhar();
      this.raf = requestAnimationFrame(quadro);
    };
    this.raf = requestAnimationFrame(quadro);
  }

  parar() {
    this.parado = true;
    cancelAnimationFrame(this.raf);
    this.op.som?.pararMusica();
  }

  private mostrar(texto: string, s = 1.6) {
    this.aviso = texto;
    this.avisoAte = this.t + s;
  }

  private gerar() {
    const nivel = this.op.nivel;
    const dist = this.distancia;
    while (this.proximoSpawn < dist + MW + 200 && this.proximoSpawn < this.total - 400) {
      const x = this.proximoSpawn;
      const faixa = Math.floor(Math.random() * 3);
      const sorteio = Math.random();
      const tipo: TipoObst =
        sorteio < 0.32
          ? "cone"
          : sorteio < 0.52
            ? "barreira"
            : sorteio < 0.66
              ? "poca"
              : sorteio < 0.86
                ? "caixa"
                : "cachorro";
      this.obstaculos.push({
        tipo,
        x,
        faixa,
        atingido: false,
        vx: tipo === "cachorro" ? 60 + nivel * 20 : 0,
        fase: Math.random() * 6,
      });
      // no difícil, às vezes vem um segundo obstáculo em outra faixa
      if (nivel >= 2 && Math.random() < 0.35 + nivel * 0.1) {
        const outra = (faixa + 1 + Math.floor(Math.random() * 2)) % 3;
        this.obstaculos.push({
          tipo: Math.random() < 0.5 ? "cone" : "caixa",
          x: x + 30,
          faixa: outra,
          atingido: false,
          vx: 0,
          fase: 0,
        });
      }
      // coletas entre obstáculos
      if (Math.random() < 0.45) {
        this.coletas.push({
          tipo: Math.random() < 0.34 ? "agua" : "estrela",
          x: x + 260,
          faixa: Math.floor(Math.random() * 3),
          pega: false,
        });
      }
      this.proximoSpawn += 420 + Math.random() * 380 - nivel * 60;
    }
  }

  private atualizar(dt: number) {
    this.t += dt;
    const e = this.entrada;
    if (this.aviso && this.t > this.avisoAte) this.aviso = null;

    // faixa e pulo
    if (e.faixa !== 0) {
      this.faixa = Math.max(0, Math.min(2, this.faixa + e.faixa));
      e.faixa = 0;
      this.op.som?.clique();
    }
    if (e.pular) {
      e.pular = false;
      if (this.z <= 0.5) {
        this.vz = 540;
        this.op.som?.pular();
      }
    }
    this.yTela += (FAIXAS_Y[this.faixa]! - this.yTela) * Math.min(1, dt * 14);
    if (this.z > 0 || this.vz > 0) {
      this.vz -= 1550 * dt;
      this.z = Math.max(0, this.z + this.vz * dt);
      if (this.z === 0 && this.vz < 0) this.vz = 0;
    }

    // velocidade: sobe com o tempo, cai quando cansado ou tropeça
    this.tropeco = Math.max(0, this.tropeco - dt);
    this.dano = Math.max(0, this.dano - dt * 2);
    const alvo =
      this.base *
      (1 + Math.min(0.5, this.distancia / this.total)) *
      (this.folego < 0.2 ? 0.7 : 1) *
      (this.tropeco > 0 ? 0.55 : 1);
    this.vel += (alvo - this.vel) * Math.min(1, dt * 3);
    this.distancia += this.vel * dt;
    this.fase += dt * (this.vel / 32);
    this.pontos += (this.vel * dt) / PX_METRO;
    this.folego = Math.max(0, this.folego - dt * (0.012 + this.op.nivel * 0.006));
    if (
      this.z <= 0.5 &&
      this.vel > 100 &&
      Math.floor(this.fase * 2) !== Math.floor((this.fase - dt * 12) * 2)
    )
      this.op.som?.passoTeto(true);

    this.gerar();

    // obstáculos
    const jx = this.distancia + X_JOGADOR;
    for (const o of this.obstaculos) {
      if (o.tipo === "cachorro") {
        o.fase += dt * 8;
        o.x -= o.vx * dt;
      }
      if (o.atingido || o.faixa !== this.faixa) continue;
      const dx = Math.abs(o.x - jx);
      if (dx < 30) {
        const baixo = o.tipo === "cone" || o.tipo === "barreira" || o.tipo === "poca";
        if (baixo && this.z > 34) continue; // pulou por cima
        o.atingido = true;
        this.folego = Math.max(0, this.folego - (o.tipo === "poca" ? 0.1 : 0.22));
        this.tropeco = 0.9;
        this.dano = 1;
        this.op.som?.erro();
        if (o.tipo === "cachorro") this.op.som?.latido(1);
        this.mostrar(o.tipo === "poca" ? "Escorregou!" : "Trombou! -fôlego", 1.4);
      }
    }
    this.obstaculos = this.obstaculos.filter((o) => o.x > this.distancia - 200);

    // coletas
    for (const c of this.coletas) {
      if (c.pega || c.faixa !== this.faixa) continue;
      if (Math.abs(c.x - jx) < 34 && this.z < 60) {
        c.pega = true;
        if (c.tipo === "agua") {
          this.folego = Math.min(1, this.folego + 0.28);
          this.op.som?.agua();
          this.mostrar("Água! Fôlego renovado", 1.4);
          this.pontos += 40;
        } else {
          this.pontos += 60;
          this.op.som?.pegar();
        }
      }
    }
    this.coletas = this.coletas.filter((c) => c.x > this.distancia - 200 && !c.pega);

    // fim
    if (this.folego <= 0) {
      this.cansado += dt;
      if (this.cansado > 2.5) return this.terminar(false, "Sem fôlego! Faltou água pelo caminho.");
    } else this.cansado = 0;
    if (this.distancia >= this.total)
      return this.terminar(true, "Linha de chegada! Maratona concluída!");

    this.acumHud += dt;
    if (this.acumHud > 0.1) {
      this.acumHud = 0;
      this.op.aoHud(this.hud());
    }
  }

  private hud(): HudMaratona {
    return {
      metros: Math.min(this.op.meta, Math.floor(this.distancia / PX_METRO)),
      meta: this.op.meta,
      folego: this.folego,
      pontos: Math.round(this.pontos),
      velocidade: Math.round(this.vel / 5),
      aviso: this.aviso,
    };
  }

  private terminar(vitoria: boolean, motivo: string) {
    if (this.terminou) return;
    this.terminou = true;
    const estrelas = vitoria ? (this.folego >= 0.6 ? 3 : this.folego >= 0.3 ? 2 : 1) : 0;
    if (vitoria) this.op.som?.vitoria();
    else this.op.som?.derrota();
    const pontos = Math.round(this.pontos + (vitoria ? this.folego * 500 : 0));
    this.op.aoHud(this.hud());
    window.setTimeout(
      () =>
        this.op.aoFim({
          vitoria,
          motivo,
          pontos,
          estrelas,
          tempoGasto: this.t,
          detalhes: [
            `Distância: ${Math.floor(this.distancia / PX_METRO)} m de ${this.op.meta} m`,
            `Fôlego restante: ${Math.round(this.folego * 100)}%`,
          ],
        }),
      900,
    );
  }

  // -------------------------------------------------------------- desenho

  private paleta() {
    const clima = this.op.clima;
    return clima === "dia"
      ? { topo: "#4aa3e8", meio: "#a9d6f5", base: "#e6f3fb", sombra: 0 }
      : clima === "por-do-sol"
        ? { topo: "#3b3a8f", meio: "#e2716b", base: "#ffc27a", sombra: 0.12 }
        : { topo: "#060a2a", meio: "#1b2560", base: "#42408a", sombra: 0.4 };
  }

  private desenhar() {
    const c = this.ctx;
    const pal = this.paleta();
    const off = this.distancia;
    // céu
    const g = c.createLinearGradient(0, 0, 0, 300);
    g.addColorStop(0, pal.topo);
    g.addColorStop(0.6, pal.meio);
    g.addColorStop(1, pal.base);
    c.fillStyle = g;
    c.fillRect(0, 0, MW, 320);
    if (this.op.clima === "noite") {
      for (let i = 0; i < 60; i++) {
        c.fillStyle = `rgba(255,255,255,${0.4 + 0.6 * Math.abs(Math.sin(this.t * 1.5 + i))})`;
        c.fillRect((i * 173) % MW, (i * 61) % 200, 1.6, 1.6);
      }
      c.fillStyle = "#fef9c3";
      c.beginPath();
      c.arc(780, 90, 26, 0, Math.PI * 2);
      c.fill();
    } else {
      c.fillStyle = this.op.clima === "dia" ? "#fff3b0" : "#ffd27a";
      c.beginPath();
      c.arc(
        this.op.clima === "dia" ? 760 : 700,
        this.op.clima === "dia" ? 90 : 210,
        34,
        0,
        Math.PI * 2,
      );
      c.fill();
    }
    this.fundo(c, off);
    // pista
    this.pista(c, off);
    // objetos por profundidade (faixa 0 primeiro)
    const itens: { y: number; f: () => void }[] = [];
    for (const co of this.coletas) {
      const x = co.x - off;
      if (x < -40 || x > MW + 40) continue;
      const y = FAIXAS_Y[co.faixa]!;
      itens.push({
        y,
        f: () =>
          co.tipo === "agua"
            ? desenharGarrafa(c, x, y - 12 + Math.sin(this.t * 4) * 4, 0.7)
            : this.estrela(c, x, y - 34 + Math.sin(this.t * 4 + x) * 4),
      });
    }
    for (const o of this.obstaculos) {
      const x = o.x - off;
      if (x < -80 || x > MW + 80) continue;
      const y = FAIXAS_Y[o.faixa]!;
      const esc = ESCALA_FAIXA[o.faixa]!;
      itens.push({ y, f: () => this.obstaculo(c, o, x, y, esc) });
    }
    itens.push({
      y: this.yTela,
      f: () => {
        const esc = 0.9 + ((this.yTela - FAIXAS_Y[0]!) / (FAIXAS_Y[2]! - FAIXAS_Y[0]!)) * 0.25;
        sombra(c, X_JOGADOR, this.yTela, 22 * esc);
        desenharAgente(
          c,
          X_JOGADOR,
          this.yTela - this.z,
          this.op.personagem,
          this.op.imagens[this.op.personagem.rosto],
          {
            dir: 1,
            fase: this.fase * 2.6,
            correndo: true,
            parado: false,
            carga: 0,
            dano: this.dano,
            escala: esc,
          },
        );
      },
    });
    itens.sort((a, b) => a.y - b.y);
    for (const it of itens) it.f();
    // linha de chegada
    this.chegada(c, off);
    // clima
    if (pal.sombra > 0) {
      c.fillStyle = `rgba(4,8,40,${pal.sombra})`;
      c.fillRect(0, 0, MW, MH);
    }
    // vinheta e tropeço
    const v = c.createRadialGradient(MW / 2, MH / 2, MH * 0.4, MW / 2, MH / 2, MW * 0.7);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.4)");
    c.fillStyle = v;
    c.fillRect(0, 0, MW, MH);
    if (this.dano > 0) {
      c.fillStyle = `rgba(220,38,38,${this.dano * 0.22})`;
      c.fillRect(0, 0, MW, MH);
    }
  }

  private fundo(c: CanvasRenderingContext2D, off: number) {
    const cen = this.op.cenario;
    const camada = (fator: number, passo: number, f: (x: number, i: number) => void) => {
      const o = off * fator;
      const i0 = Math.floor(o / passo) - 1;
      for (let i = i0; i < i0 + Math.ceil(MW / passo) + 3; i++) f(i * passo - o, i);
    };
    const ruido = (n: number) => {
      const x = Math.sin(n * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };
    if (cen === "rio") {
      // skyline distante
      camada(0.06, 60, (x, i) => {
        const h = 60 + ruido(i) * 100;
        c.fillStyle = "rgba(90,110,150,0.55)";
        c.fillRect(x, 250 - h, 46, h);
      });
      // rio
      const rg = c.createLinearGradient(0, 250, 0, 330);
      rg.addColorStop(0, "#5fb4d8");
      rg.addColorStop(1, "#2b7fae");
      c.fillStyle = rg;
      c.fillRect(0, 250, MW, 80);
      for (let i = 0; i < 40; i++) {
        c.fillStyle = "rgba(255,255,255,0.35)";
        c.fillRect((((i * 97 - off * 0.12) % MW) + MW) % MW, 256 + ((i * 31) % 70), 24, 2);
      }
      // barcos
      camada(0.1, 460, (x, i) => {
        c.fillStyle = "#f8fafc";
        c.beginPath();
        c.moveTo(x, 292);
        c.lineTo(x + 70, 292);
        c.lineTo(x + 58, 306);
        c.lineTo(x + 10, 306);
        c.closePath();
        c.fill();
        c.fillStyle = "#dc2626";
        c.fillRect(x + 24, 276, 22, 16);
        void i;
      });
      // mureta e palmeiras da orla
      c.fillStyle = "#8b8b8b";
      c.fillRect(0, 322, MW, 20);
      camada(0.45, 190, (x, i) => this.palmeira(c, x, 334, 1 + ruido(i) * 0.3));
    } else if (cen === "cidade") {
      camada(0.08, 78, (x, i) => {
        const h = 90 + ruido(i) * 130;
        c.fillStyle = "rgba(70,90,140,0.6)";
        c.fillRect(x, 300 - h, 64, h);
      });
      camada(0.28, 130, (x, i) => {
        const h = 110 + ruido(i + 40) * 100;
        const cores = ["#e11d48", "#f59e0b", "#0ea5e9", "#a855f7", "#22c55e"];
        c.fillStyle = cores[i & 3 ? Math.abs(i) % 5 : 0]!;
        c.fillRect(x, 330 - h, 110, h);
        c.fillStyle = "rgba(0,0,0,0.25)";
        c.fillRect(x + 82, 330 - h, 28, h);
        for (let r = 0; r < Math.floor(h / 28); r++)
          for (let k = 0; k < 3; k++) {
            c.fillStyle = ruido(i * 7 + r * 3 + k) > 0.4 ? "#fde68a" : "rgba(15,23,42,0.6)";
            c.fillRect(x + 10 + k * 30, 330 - h + 12 + r * 28, 16, 16);
          }
      });
      camada(0.5, 240, (x) => {
        c.fillStyle = "#374151";
        c.fillRect(x, 250, 4, 90);
        c.fillStyle = "#fde68a";
        c.fillRect(x - 8, 246, 22, 6);
      });
    } else if (cen === "rural") {
      camada(0.05, 340, (x, i) => {
        c.fillStyle = "#6f9e6a";
        c.beginPath();
        c.ellipse(x + 170, 300, 240, 70 + ruido(i) * 40, 0, Math.PI, 0);
        c.fill();
      });
      camada(0.2, 230, (x, i) => {
        c.fillStyle = "#4f8f4a";
        c.beginPath();
        c.ellipse(x + 100, 320, 150, 46 + ruido(i + 9) * 34, 0, Math.PI, 0);
        c.fill();
      });
      camada(0.5, 160, (x, i) => {
        c.fillStyle = "#5b3a1e";
        c.fillRect(x + 8, 292, 8, 46);
        c.fillStyle = "#2f9a4f";
        c.beginPath();
        c.arc(x + 12, 280, 24 + ruido(i) * 8, 0, Math.PI * 2);
        c.fill();
      });
      camada(0.7, 120, (x) => {
        c.strokeStyle = "#7c5a34";
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(x, 338);
        c.lineTo(x, 316);
        c.moveTo(x - 60, 322);
        c.lineTo(x + 60, 322);
        c.stroke();
      });
    } else {
      // evento: arquibancada de público
      c.fillStyle = "rgba(20,30,60,0.55)";
      c.fillRect(0, 230, MW, 110);
      camada(0.32, 22, (x, i) => {
        const cores = ["#ef4444", "#3b82f6", "#f59e0b", "#22c55e", "#a855f7", "#f8fafc"];
        const altura = 30 + ruido(i) * 14;
        c.fillStyle = cores[Math.abs(i) % 6]!;
        c.fillRect(x, 330 - altura, 14, altura);
        c.fillStyle = "#e0ac86";
        c.beginPath();
        c.arc(x + 7, 326 - altura, 6, 0, Math.PI * 2);
        c.fill();
      });
      camada(0.5, 300, (x, i) => {
        // balões
        const cor = ["#ef4444", "#3b82f6", "#facc15"][Math.abs(i) % 3]!;
        c.fillStyle = cor;
        c.beginPath();
        c.ellipse(x, 200 + Math.sin(this.t + i) * 8, 16, 20, 0, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = "rgba(255,255,255,0.6)";
        c.beginPath();
        c.moveTo(x, 220 + Math.sin(this.t + i) * 8);
        c.lineTo(x, 300);
        c.stroke();
      });
      c.fillStyle = "#1e3a8a";
      c.fillRect(0, 336, MW, 12);
      camada(0.7, 140, (x) => {
        c.fillStyle = "#f8fafc";
        c.fillRect(x, 322, 90, 14);
        c.fillStyle = "#1e3a8a";
        c.font = "bold 11px sans-serif";
        c.textAlign = "center";
        c.fillText("OPERAÇÃO PLANTÃO", x + 45, 333);
      });
    }
  }

  private palmeira(c: CanvasRenderingContext2D, x: number, y: number, e: number) {
    c.save();
    c.translate(x, y);
    c.scale(e, e);
    c.strokeStyle = "#7a4e24";
    c.lineWidth = 7;
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(8, -50, 0, -100);
    c.stroke();
    c.fillStyle = "#22a04f";
    for (let k = 0; k < 7; k++) {
      c.save();
      c.translate(0, -100);
      c.rotate(-1.4 + k * 0.47);
      c.beginPath();
      c.ellipse(24, 0, 28, 6, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
    c.restore();
  }

  private pista(c: CanvasRenderingContext2D, off: number) {
    // calçada e pista
    const cal = c.createLinearGradient(0, 336, 0, 350);
    cal.addColorStop(0, "#a8a29e");
    cal.addColorStop(1, "#78716c");
    c.fillStyle = cal;
    c.fillRect(0, 336, MW, 20);
    const cor =
      this.op.cenario === "rural"
        ? ["#a0623a", "#8d5430"]
        : this.op.cenario === "evento"
          ? ["#b45a3c", "#a04d31"]
          : ["#4b5563", "#434a56"];
    const pg = c.createLinearGradient(0, 350, 0, MH);
    pg.addColorStop(0, cor[0]!);
    pg.addColorStop(1, cor[1]!);
    c.fillStyle = pg;
    c.fillRect(0, 350, MW, MH - 350);
    // linhas de faixa em movimento
    c.fillStyle = "rgba(255,255,255,0.5)";
    for (const y of [402, 462]) {
      const o = off % 120;
      for (let x = -o; x < MW; x += 120) c.fillRect(x, y, 60, 4);
    }
    // marcações de distância a cada 100 m
    const passo = 100 * PX_METRO;
    const primeiro = Math.floor(off / passo) * passo;
    for (let d = primeiro; d < off + MW + passo; d += passo) {
      const x = d - off + X_JOGADOR * 0;
      if (x < -60 || x > MW + 60) continue;
      c.fillStyle = "rgba(250,204,21,0.9)";
      c.fillRect(x, 352, 6, 188);
      c.fillStyle = "#facc15";
      c.font = "bold 14px sans-serif";
      c.textAlign = "left";
      c.fillText(`${Math.round(d / PX_METRO)} m`, x + 10, 372);
    }
  }

  private chegada(c: CanvasRenderingContext2D, off: number) {
    const x = this.total + X_JOGADOR - off;
    const partida = X_JOGADOR - off - 120;
    if (x > -100 && x < MW + 100) this.arco(c, x, "CHEGADA");
    if (partida > -200 && partida < MW) this.arco(c, partida, "LARGADA");
  }

  private arco(c: CanvasRenderingContext2D, x: number, texto: string) {
    c.save();
    c.translate(x, 0);
    c.fillStyle = "#1e3a8a";
    c.fillRect(-6, 170, 12, 320);
    c.fillRect(-6, 170, 12, 320);
    c.fillStyle = "#1d4ed8";
    c.fillRect(-160, 170, 320, 46);
    c.fillStyle = "#facc15";
    c.font = "bold 26px sans-serif";
    c.textAlign = "center";
    c.fillText(texto, 0, 203);
    // xadrez
    for (let i = 0; i < 20; i++)
      for (let j = 0; j < 2; j++) {
        c.fillStyle = (i + j) % 2 ? "#111" : "#fff";
        c.fillRect(-160 + i * 16, 216 + j * 12, 16, 12);
      }
    c.restore();
  }

  private estrela(c: CanvasRenderingContext2D, x: number, y: number) {
    c.save();
    c.translate(x, y);
    c.shadowColor = "#fde047";
    c.shadowBlur = 12;
    c.fillStyle = "#fbbf24";
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 6 : 14;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    c.closePath();
    c.fill();
    c.restore();
  }

  private obstaculo(c: CanvasRenderingContext2D, o: Obstaculo, x: number, y: number, esc: number) {
    c.save();
    c.translate(x, y);
    c.scale(esc, esc);
    if (o.atingido) c.globalAlpha = 0.45;
    switch (o.tipo) {
      case "cone":
        desenharCone(c, 0, 0, 1.4);
        break;
      case "barreira":
        sombra(c, 0, 0, 34);
        c.fillStyle = "#f8fafc";
        c.fillRect(-32, -24, 64, 22);
        c.fillStyle = "#dc2626";
        for (let i = -3; i < 3; i++) {
          c.beginPath();
          c.moveTo(-32 + (i + 3) * 12, -2);
          c.lineTo(-32 + (i + 3) * 12 + 6, -2);
          c.lineTo(-32 + (i + 3) * 12 + 18, -24);
          c.lineTo(-32 + (i + 3) * 12 + 12, -24);
          c.closePath();
          c.fill();
        }
        c.fillStyle = "#334155";
        c.fillRect(-28, -2, 6, 8);
        c.fillRect(22, -2, 6, 8);
        break;
      case "poca":
        c.fillStyle = "rgba(15,23,42,0.85)";
        c.beginPath();
        c.ellipse(0, -2, 46, 12, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "rgba(56,189,248,0.4)";
        c.beginPath();
        c.ellipse(-6, -4, 28, 6, 0, 0, Math.PI * 2);
        c.fill();
        break;
      case "caixa":
        sombra(c, 0, 0, 34);
        c.fillStyle = "#b07a3c";
        c.fillRect(-26, -56, 52, 54);
        c.strokeStyle = "#5a3413";
        c.lineWidth = 4;
        c.strokeRect(-26, -56, 52, 54);
        c.beginPath();
        c.moveTo(-26, -56);
        c.lineTo(26, -2);
        c.moveTo(26, -56);
        c.lineTo(-26, -2);
        c.stroke();
        break;
      case "cachorro":
        desenharCachorro(c, 0, 0, CACHORROS[Math.floor(o.fase) % 3]!, -1, o.fase, true, 0);
        break;
    }
    c.restore();
  }
}
