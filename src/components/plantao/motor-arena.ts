/**
 * Motor das missões de arena do "Operação: Plantão" (cachorro, marmitas,
 * breves e tarefas): mapa visto de cima em 3/4, câmera que segue o agente,
 * colisões, inteligência do cachorro, carrinhos e funcionários em ronda,
 * objetivos por missão e clima (dia, pôr do sol e noite).
 *
 * O motor não conhece React: recebe teclas/joystick por `entrada` e avisa a
 * interface por callbacks (painel de objetivos, tempo, fôlego, resultado).
 */

import {
  capacidadeDe,
  tempoExtraDe,
  velocidadeDe,
  type Clima,
  type MissaoId,
  type Nivel,
  SPRITES_NPC,
  type Personagem,
} from "@/components/plantao/dados";
import {
  bloco,
  CACHORROS,
  criarChao,
  desenharAgente,
  desenharArvore,
  desenharFigura,
  desenharBreve,
  desenharCachorro,
  desenharCafe,
  desenharCarrinho,
  desenharCone,
  desenharGarrafa,
  desenharMarmita,
  desenharNpc,
  desenharPisoMolhado,
  desenharPlaca,
  desenharPoste,
  desenharViatura,
  sombra,
  type CorCachorro,
  type Imagens,
  type TipoChao,
} from "@/components/plantao/desenho";
import type { SomPlantao } from "@/components/plantao/som-plantao";

export const VIEW_W = 960;
export const VIEW_H = 540;
/** Aproximação da câmera: os personagens aparecem maiores e o mapa parece mais rico. */
const ZOOM = 1.5;
const VW = VIEW_W / ZOOM;
const VH = VIEW_H / ZOOM;

// ---------------------------------------------------------------- tipos

export interface EntradaArena {
  dx: number;
  dy: number;
  correr: boolean;
  /** Pulso de "interagir": o motor consome (volta a false) ao tratar. */
  interagir: boolean;
}

export interface Objetivo {
  texto: string;
  feito: boolean;
  contador?: string;
}

export interface HudArena {
  titulo: string;
  objetivos: Objetivo[];
  tempo: number;
  pontos: number;
  folego: number;
  carga: number;
  capacidade: number;
  /** Texto do botão de interagir quando há algo por perto. */
  prompt: string | null;
  aviso: string | null;
  /** Ícone do que está sendo carregado ("marmita" | "breve" | null). */
  item: "marmita" | "breve" | null;
}

export interface ResultadoArena {
  vitoria: boolean;
  motivo: string;
  pontos: number;
  estrelas: number;
  tempoGasto: number;
  detalhes: string[];
}

export interface OpcoesArena {
  canvas: HTMLCanvasElement;
  minimapa: HTMLCanvasElement | null;
  missao: Extract<MissaoId, "cachorro" | "marmitas" | "breves" | "tarefas">;
  personagem: Personagem;
  nivel: Nivel;
  clima: Clima;
  som: SomPlantao | null;
  imagens: Imagens;
  titulo: string;
  tempoTotal: number;
  meta: number;
  aoHud: (h: HudArena) => void;
  aoFim: (r: ResultadoArena) => void;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Parede extends Rect {
  alt: number;
  topo: string;
  frente: string;
  /** Desenho extra sobre a frente (janelas, letras). */
  extra?: (ctx: CanvasRenderingContext2D, p: Parede, t: number) => void;
  invisivel?: boolean;
}

interface Interativo {
  id: string;
  tipo: "balcao" | "porta" | "breve" | "cafe" | "tarefa" | "coord";
  x: number;
  y: number;
  r: number;
  texto: string;
  ativo: boolean;
  requer?: string[];
  letra?: string;
}

interface Decor {
  y: number;
  x: number;
  desenhar: (ctx: CanvasRenderingContext2D, t: number) => void;
}

interface Zona {
  tipo: "molhado" | "portao";
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Mundo {
  w: number;
  h: number;
  chao: TipoChao;
  faixaChao?: { rect: Rect; tipo: TipoChao };
  paredes: Parede[];
  colisores: { x: number; y: number; r: number }[];
  interativos: Interativo[];
  decor: Decor[];
  zonas: Zona[];
  spawn: { x: number; y: number };
  luzes: { x: number; y: number; r: number }[];
  /** Calçadas e faixas pintadas no chão. */
  chaoExtra: ((ctx: CanvasRenderingContext2D) => void) | null;
}

interface Cachorro {
  x: number;
  y: number;
  vx: number;
  vy: number;
  cor: CorCachorro;
  capturado: boolean;
  entrou: boolean;
  dir: number;
  fase: number;
  susto: number;
  perto: number;
  ativoEm: number;
  desvio: number;
}

interface Patrulha {
  x: number;
  y: number;
  rota: { x: number; y: number }[];
  idx: number;
  vel: number;
  tipo: "npc" | "carrinho" | "carro";
  dir: number;
  fase: number;
  cor: { camisa: string; calca: string; pele: string; cabelo: string; chapeu?: string };
  raio: number;
  /** Tempo de bloqueio depois de bater no jogador. */
  espera: number;
}

interface Particula {
  x: number;
  y: number;
  vx: number;
  vy: number;
  vida: number;
  max: number;
  cor: string;
  r: number;
}

const ciclo = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function paredeBloco(
  x: number,
  y: number,
  w: number,
  h: number,
  alt: number,
  topo: string,
  frente: string,
  extra?: Parede["extra"],
): Parede {
  return { x, y, w, h, alt, topo, frente, ...(extra ? { extra } : {}) };
}

// =========================================================== construção dos mundos

function janelas(cor = "#7dd3fc") {
  return (ctx: CanvasRenderingContext2D, p: Parede) => {
    const n = Math.floor(p.w / 70);
    for (let i = 0; i < n; i++) {
      const x = p.x + 20 + i * ((p.w - 40) / Math.max(1, n));
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(x, p.y + p.h - p.alt + 16, 34, 30);
      ctx.fillStyle = cor;
      ctx.globalAlpha = 0.65;
      ctx.fillRect(x + 2, p.y + p.h - p.alt + 18, 30, 26);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(x + 2, p.y + p.h - p.alt + 18, 12, 26);
    }
  };
}

function mundoCachorro(): Mundo {
  const m: Mundo = {
    w: 2200,
    h: 1300,
    chao: "concreto",
    faixaChao: { rect: { x: 0, y: 1010, w: 2200, h: 290 }, tipo: "asfalto" },
    paredes: [],
    colisores: [],
    interativos: [],
    decor: [],
    zonas: [{ tipo: "portao", x: 950, y: 215, w: 300, h: 70 }],
    spawn: { x: 1100, y: 460 },
    luzes: [],
    chaoExtra: (ctx) => {
      // faixa de pedestres e linha central da rua
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      for (let x = 0; x < 2200; x += 90) ctx.fillRect(x, 1150, 50, 6);
      for (let i = 0; i < 9; i++) ctx.fillRect(980 + i * 34, 1040, 20, 90);
      // marcação do portão
      ctx.fillStyle = "rgba(250,204,21,0.85)";
      for (let x = 950; x < 1250; x += 30) ctx.fillRect(x, 300, 18, 8);
      ctx.strokeStyle = "rgba(250,204,21,0.5)";
      ctx.lineWidth = 3;
      ctx.strokeRect(950, 215, 300, 70);
    },
  };
  // fachada da unidade
  m.paredes.push(
    paredeBloco(250, 30, 700, 220, 130, "#a89f92", "#8b8377", janelas()),
    paredeBloco(1250, 30, 700, 220, 130, "#a89f92", "#8b8377", janelas()),
    paredeBloco(930, 40, 22, 210, 100, "#6b7280", "#4b5563"),
    paredeBloco(1248, 40, 22, 210, 100, "#6b7280", "#4b5563"),
    // grades laterais
    paredeBloco(230, 250, 18, 760, 46, "#4b5563", "#374151"),
    paredeBloco(1952, 250, 18, 760, 46, "#4b5563", "#374151"),
    // canteiros
    paredeBloco(420, 520, 130, 54, 26, "#4d8f4a", "#7a5230"),
    paredeBloco(1640, 500, 130, 54, 26, "#4d8f4a", "#7a5230"),
    paredeBloco(700, 780, 110, 50, 26, "#4d8f4a", "#7a5230"),
    paredeBloco(1400, 800, 110, 50, 26, "#4d8f4a", "#7a5230"),
    paredeBloco(1000, 620, 200, 40, 30, "#9ca3af", "#6b7280"),
    // muretas de concreto
    paredeBloco(560, 380, 34, 130, 40, "#a3a3a3", "#737373"),
    paredeBloco(1600, 700, 34, 140, 40, "#a3a3a3", "#737373"),
  );
  // viaturas estacionadas
  m.paredes.push(
    { x: 300, y: 300, w: 124, h: 30, alt: 26, topo: "#1f2937", frente: "#0f172a", invisivel: true },
    {
      x: 1740,
      y: 340,
      w: 124,
      h: 30,
      alt: 26,
      topo: "#1f2937",
      frente: "#0f172a",
      invisivel: true,
    },
  );
  m.decor.push(
    { x: 362, y: 336, desenhar: (c, t) => desenharViatura(c, 362, 336, t) },
    { x: 1802, y: 376, desenhar: (c, t) => desenharViatura(c, 1802, 376, t) },
  );
  // cones espalhados
  const cones: [number, number][] = [
    [820, 420],
    [1380, 430],
    [760, 640],
    [1440, 620],
    [900, 900],
    [1300, 930],
    [500, 760],
    [1700, 880],
    [1120, 780],
    [620, 940],
    [1560, 420],
    [360, 640],
  ];
  for (const [x, y] of cones) {
    m.colisores.push({ x, y: y - 4, r: 10 });
    m.decor.push({ x, y, desenhar: (c) => desenharCone(c, x, y) });
  }
  // postes, árvores e placas
  for (const [x, y] of [
    [700, 290],
    [1500, 290],
    [700, 900],
    [1500, 900],
    [1100, 1000],
  ] as [number, number][]) {
    m.decor.push({ x, y, desenhar: (c) => desenharPoste(c, x, y) });
    m.luzes.push({ x, y: y - 70, r: 190 });
    m.colisores.push({ x, y: y - 4, r: 8 });
  }
  for (const [x, y] of [
    [300, 900],
    [1900, 940],
    [200, 500],
  ] as [number, number][]) {
    m.decor.push({ x, y, desenhar: (c) => desenharArvore(c, x, y, 1.1) });
    m.colisores.push({ x, y: y - 6, r: 14 });
  }
  m.decor.push({ x: 1100, y: 320, desenhar: (c) => desenharPlaca(c, 1100, 320, "!", "#ef4444") });
  return m;
}

function mundoMarmitas(): Mundo {
  const m: Mundo = {
    w: 2400,
    h: 1100,
    chao: "concreto",
    faixaChao: { rect: { x: 0, y: 0, w: 640, h: 1100 }, tipo: "azulejo" },
    paredes: [],
    colisores: [],
    interativos: [],
    decor: [],
    zonas: [],
    spawn: { x: 780, y: 550 },
    luzes: [],
    chaoExtra: (ctx) => {
      ctx.fillStyle = "rgba(250,204,21,0.5)";
      for (let y = 40; y < 1080; y += 60) ctx.fillRect(1380, y, 6, 30);
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(640, 0, 8, 1100);
    },
  };
  m.paredes.push(
    // bordas
    {
      x: 0,
      y: -40,
      w: 2400,
      h: 60,
      alt: 110,
      topo: "#8b8377",
      frente: "#6f685e",
      extra: janelas("#fde68a"),
    },
    { x: 0, y: 1080, w: 2400, h: 40, alt: 40, topo: "#8b8377", frente: "#6f685e" },
    { x: -40, y: 0, w: 60, h: 1100, alt: 40, topo: "#8b8377", frente: "#6f685e", invisivel: true },
    { x: 2380, y: 0, w: 60, h: 1100, alt: 40, topo: "#8b8377", frente: "#6f685e", invisivel: true },
    // divisória da cozinha com porta no meio
    paredeBloco(640, 20, 24, 470, 110, "#c9c2b6", "#a39c90"),
    paredeBloco(640, 640, 24, 440, 110, "#c9c2b6", "#a39c90"),
    // bancadas da cozinha
    paredeBloco(60, 120, 470, 52, 38, "#e5e7eb", "#94a3b8"),
    paredeBloco(60, 900, 470, 52, 38, "#e5e7eb", "#94a3b8"),
    paredeBloco(200, 470, 190, 90, 34, "#d1d5db", "#6b7280"),
    // fogões
    paredeBloco(80, 20, 140, 40, 60, "#374151", "#1f2937"),
    paredeBloco(300, 20, 140, 40, 60, "#374151", "#1f2937"),
  );
  m.interativos.push(
    { id: "balcao1", tipo: "balcao", x: 290, y: 215, r: 70, texto: "PEGAR MARMITA", ativo: true },
    { id: "balcao2", tipo: "balcao", x: 290, y: 860, r: 70, texto: "PEGAR MARMITA", ativo: true },
  );
  // blocos (portas) na direita
  const letras = ["A", "B", "C", "D"];
  letras.forEach((l, i) => {
    const y = 130 + i * 270;
    m.paredes.push(
      paredeBloco(2260, y - 60, 120, 130, 90, "#6b7280", "#4b5563", (ctx, p) => {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(p.x + 30, p.y + p.h - 64, 60, 60);
        ctx.fillStyle = "#facc15";
        ctx.font = "bold 30px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(l, p.x + 60, p.y + p.h - 20);
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(p.x + 30, p.y + p.h - 72, 60, 6);
      }),
    );
    m.interativos.push({
      id: `porta${l}`,
      tipo: "porta",
      x: 2200,
      y: y + 4,
      r: 74,
      texto: `ENTREGAR NO BLOCO ${l}`,
      ativo: true,
      letra: l,
    });
  });
  // colunas e mesas de apoio no corredor
  for (const [x, y] of [
    [1000, 200],
    [1000, 900],
    [1700, 520],
  ] as [number, number][]) {
    m.paredes.push(paredeBloco(x, y, 60, 60, 60, "#a8a29e", "#78716c"));
  }
  // placas de piso molhado (zona lenta)
  for (const [x, y] of [
    [900, 420],
    [1300, 760],
    [1650, 300],
    [1500, 900],
  ] as [number, number][]) {
    m.zonas.push({ tipo: "molhado", x: x - 46, y: y - 18, w: 92, h: 36 });
    m.decor.push({ x, y, desenhar: (c) => desenharPisoMolhado(c, x, y) });
  }
  for (const x of [400, 900, 1500, 2000])
    m.luzes.push({ x, y: 300, r: 260 }, { x, y: 800, r: 260 });
  return m;
}

function mundoBreves(): Mundo {
  const m: Mundo = {
    w: 2200,
    h: 1200,
    chao: "carpete",
    faixaChao: { rect: { x: 0, y: 470, w: 2200, h: 260 }, tipo: "azulejo" },
    paredes: [],
    colisores: [],
    interativos: [],
    decor: [],
    zonas: [],
    spawn: { x: 1100, y: 600 },
    luzes: [],
    chaoExtra: null,
  };
  m.paredes.push(
    {
      x: 0,
      y: -40,
      w: 2200,
      h: 60,
      alt: 110,
      topo: "#cbd5e1",
      frente: "#94a3b8",
      extra: janelas("#bae6fd"),
    },
    { x: 0, y: 1180, w: 2200, h: 40, alt: 40, topo: "#cbd5e1", frente: "#94a3b8" },
    { x: -40, y: 0, w: 60, h: 1200, alt: 40, topo: "#cbd5e1", frente: "#94a3b8", invisivel: true },
    { x: 2180, y: 0, w: 60, h: 1200, alt: 40, topo: "#cbd5e1", frente: "#94a3b8", invisivel: true },
  );
  // paredes horizontais com portas (vãos de 130) — em cima e embaixo do corredor
  const vaos = [366, 1100, 1834];
  const segmento = (y: number, alt: number) => {
    let x0 = 0;
    for (const v of vaos) {
      const ini = v - 65;
      if (ini > x0) m.paredes.push(paredeBloco(x0, y, ini - x0, 20, alt, "#e2e8f0", "#94a3b8"));
      x0 = v + 65;
    }
    m.paredes.push(paredeBloco(x0, y, 2200 - x0, 20, alt, "#e2e8f0", "#94a3b8"));
  };
  segmento(450, 90);
  segmento(730, 90);
  // divisórias verticais entre salas
  for (const x of [733, 1466]) {
    m.paredes.push(
      paredeBloco(x, 20, 20, 430, 90, "#e2e8f0", "#94a3b8"),
      paredeBloco(x, 750, 20, 430, 90, "#e2e8f0", "#94a3b8"),
    );
  }
  // mesas com computador
  const mesas: [number, number][] = [
    [140, 260],
    [520, 200],
    [880, 300],
    [1240, 220],
    [1600, 300],
    [1980, 240],
    [200, 900],
    [560, 980],
    [900, 880],
    [1280, 980],
    [1640, 900],
    [2000, 980],
  ];
  mesas.forEach(([x, y], i) => {
    m.paredes.push(
      paredeBloco(x - 55, y - 25, 110, 50, 30, "#c8a97e", "#8a6d43", (ctx, p) => {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(p.x + 36, p.y + p.h - p.alt - 20, 38, 22);
        ctx.fillStyle = i % 2 ? "#38bdf8" : "#a7f3d0";
        ctx.fillRect(p.x + 39, p.y + p.h - p.alt - 17, 32, 16);
      }),
    );
  });
  // possíveis posições dos breves (junto às mesas) — 8 candidatos
  const candidatos: [number, number][] = [
    [140, 320],
    [520, 260],
    [880, 360],
    [1240, 280],
    [1600, 360],
    [2000, 310],
    [200, 960],
    [1640, 960],
  ];
  candidatos.forEach(([x, y], i) => {
    m.interativos.push({
      id: `breve${i}`,
      tipo: "breve",
      x,
      y,
      r: 46,
      texto: "PEGAR BREVE",
      ativo: false,
    });
  });
  // Coordenação (mesa grande, canto superior direito)
  m.paredes.push(
    paredeBloco(1800, 90, 300, 70, 34, "#d4b483", "#8a6d43", (ctx, p) => {
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("COORDENAÇÃO", p.x + p.w / 2, p.y + p.h - p.alt + 22);
    }),
  );
  m.interativos.push({
    id: "coord",
    tipo: "coord",
    x: 1950,
    y: 230,
    r: 80,
    texto: "ENTREGAR BREVES",
    ativo: true,
  });
  // cafezinho
  for (const [x, y, id] of [
    [300, 600, "cafe1"],
    [1700, 610, "cafe2"],
  ] as [number, number, string][]) {
    m.interativos.push({ id, tipo: "cafe", x, y, r: 40, texto: "TOMAR CAFEZINHO", ativo: true });
  }
  for (const x of [300, 900, 1500, 2000])
    m.luzes.push({ x, y: 250, r: 250 }, { x, y: 600, r: 250 }, { x, y: 950, r: 250 });
  return m;
}

function mundoTarefas(): Mundo {
  const m: Mundo = {
    w: 2400,
    h: 1300,
    chao: "concreto",
    faixaChao: { rect: { x: 0, y: 940, w: 2400, h: 260 }, tipo: "asfalto" },
    paredes: [],
    colisores: [],
    interativos: [],
    decor: [],
    zonas: [],
    spawn: { x: 1200, y: 560 },
    luzes: [],
    chaoExtra: (ctx) => {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      for (let x = 0; x < 2400; x += 100) ctx.fillRect(x, 1066, 56, 6);
      ctx.fillStyle = "rgba(250,204,21,0.8)";
      for (let x = 1000; x < 1500; x += 30) ctx.fillRect(x, 640, 18, 8);
    },
  };
  m.paredes.push(
    // guarita e portaria
    paredeBloco(180, 40, 260, 220, 140, "#9a9186", "#7b7368", janelas()),
    paredeBloco(900, 40, 420, 220, 140, "#a89f92", "#8b8377", janelas("#fde68a")),
    paredeBloco(1560, 40, 640, 60, 110, "#8b8377", "#6f685e"),
    { x: -40, y: 0, w: 60, h: 1300, alt: 40, topo: "#4b5563", frente: "#374151", invisivel: true },
    { x: 2380, y: 0, w: 60, h: 1300, alt: 40, topo: "#4b5563", frente: "#374151", invisivel: true },
    { x: 0, y: 1280, w: 2400, h: 40, alt: 30, topo: "#4b5563", frente: "#374151", invisivel: true },
    { x: 0, y: -30, w: 2400, h: 30, alt: 30, topo: "#4b5563", frente: "#374151", invisivel: true },
    // portão: dois batentes
    paredeBloco(1600, 120, 40, 200, 90, "#6b7280", "#4b5563"),
    paredeBloco(1960, 120, 40, 200, 90, "#6b7280", "#4b5563"),
    // armário de chaves, mesa de registro, bebedouro
    paredeBloco(540, 700, 120, 46, 70, "#94a3b8", "#64748b"),
    paredeBloco(1800, 1000, 0, 0, 0, "#000", "#000"),
    paredeBloco(2080, 480, 60, 40, 60, "#e5e7eb", "#94a3b8"),
    paredeBloco(1800, 700, 150, 56, 32, "#c8a97e", "#8a6d43"),
    // muretas e canteiros de obstáculo
    paredeBloco(700, 400, 34, 200, 40, "#a3a3a3", "#737373"),
    paredeBloco(1400, 420, 34, 200, 40, "#a3a3a3", "#737373"),
    paredeBloco(1000, 800, 260, 40, 28, "#4d8f4a", "#7a5230"),
  );
  m.interativos.push(
    { id: "radio", tipo: "tarefa", x: 310, y: 320, r: 64, texto: "PEGAR O RÁDIO", ativo: true },
    {
      id: "cadeado",
      tipo: "tarefa",
      x: 1800,
      y: 340,
      r: 70,
      texto: "CONFERIR O CADEADO",
      ativo: true,
    },
    { id: "agua", tipo: "tarefa", x: 2110, y: 570, r: 64, texto: "ENCHER A GARRAFA", ativo: true },
    { id: "chave", tipo: "tarefa", x: 600, y: 770, r: 64, texto: "PEGAR A CHAVE", ativo: true },
    {
      id: "portaria",
      tipo: "tarefa",
      x: 1110,
      y: 320,
      r: 74,
      texto: "ENTREGAR A CHAVE",
      ativo: true,
      requer: ["chave"],
    },
    {
      id: "controle",
      tipo: "tarefa",
      x: 1250,
      y: 720,
      r: 60,
      texto: "CONTROLE DE SEGURANÇA",
      ativo: true,
    },
    {
      id: "registro",
      tipo: "tarefa",
      x: 1875,
      y: 790,
      r: 70,
      texto: "REGISTRAR OCORRÊNCIA",
      ativo: true,
      requer: ["radio", "cadeado", "agua", "portaria", "controle"],
    },
  );
  // detector de metais (arco)
  m.decor.push({
    x: 1250,
    y: 700,
    desenhar: (c, t) => {
      c.save();
      c.translate(1250, 700);
      sombra(c, 0, 0, 40);
      c.fillStyle = "#334155";
      c.fillRect(-36, -70, 12, 70);
      c.fillRect(24, -70, 12, 70);
      c.fillRect(-36, -76, 72, 10);
      c.fillStyle = Math.floor(t * 3) % 2 ? "#22c55e" : "#166534";
      c.fillRect(-8, -74, 16, 6);
      c.restore();
    },
  });
  for (const [x, y] of [
    [300, 900],
    [1500, 900],
    [2200, 900],
  ] as [number, number][]) {
    m.decor.push({ x, y, desenhar: (c) => desenharArvore(c, x, y, 1.05) });
    m.colisores.push({ x, y: y - 6, r: 14 });
  }
  for (const [x, y] of [
    [700, 300],
    [1500, 300],
    [900, 850],
    [2000, 850],
  ] as [number, number][]) {
    m.decor.push({ x, y, desenhar: (c) => desenharPoste(c, x, y) });
    m.luzes.push({ x, y: y - 70, r: 200 });
    m.colisores.push({ x, y: y - 4, r: 8 });
  }
  return m;
}

// ================================================================ motor

export class Arena {
  private ctx: CanvasRenderingContext2D;
  private mundo: Mundo;
  private chao: CanvasPattern | null = null;
  private chaoFaixa: CanvasPattern | null = null;
  private noite: HTMLCanvasElement;
  private raf = 0;
  private ultimo = 0;
  private parado = true;
  private pausado = false;
  private t = 0;
  entrada: EntradaArena = { dx: 0, dy: 0, correr: false, interagir: false };

  // jogador
  private px: number;
  private py: number;
  private vx = 0;
  private vy = 0;
  private dir = 1;
  private fase = 0;
  private folego = 1;
  private carga = 0;
  private breves = 0;
  private buff = 0;
  private atordoado = 0;
  private molhado = false;
  private bracoAlto = 0;

  // missão
  private tempoRestante: number;
  private pontos = 0;
  private terminou = false;
  private aviso: string | null = null;
  private avisoAte = 0;
  private cachorros: Cachorro[] = [];
  private patrulhas: Patrulha[] = [];
  private tarefasFeitas = new Set<string>();
  private entregues = 0;
  private coletadas = 0;
  private breveAlvos = 0;
  private capturados = 0;
  private particulas: Particula[] = [];
  private cam = { x: 0, y: 0 };
  private acumHud = 0;
  private acumMapa = 0;
  private sirene = 0;
  private ultimoTique = 0;

  private readonly vBase: number;
  private readonly cap: number;
  private readonly total: number;

  constructor(private op: OpcoesArena) {
    op.canvas.width = VIEW_W;
    op.canvas.height = VIEW_H;
    this.ctx = op.canvas.getContext("2d")!;
    this.mundo =
      op.missao === "cachorro"
        ? mundoCachorro()
        : op.missao === "marmitas"
          ? mundoMarmitas()
          : op.missao === "breves"
            ? mundoBreves()
            : mundoTarefas();
    this.px = this.mundo.spawn.x;
    this.py = this.mundo.spawn.y;
    this.vBase = velocidadeDe(op.personagem);
    this.cap = capacidadeDe(op.personagem);
    this.total = op.tempoTotal + tempoExtraDe(op.personagem);
    this.tempoRestante = this.total;
    this.noite = document.createElement("canvas");
    this.noite.width = VIEW_W;
    this.noite.height = VIEW_H;
    this.preparar();
    this.cam.x = ciclo(this.px - VW / 2, 0, this.mundo.w - VW);
    this.cam.y = ciclo(this.py - VH / 2, 0, this.mundo.h - VH);
  }

  // ------------------------------------------------------------- preparação

  private preparar() {
    const m = this.mundo;
    const nivel = this.op.nivel;
    this.chao = this.ctx.createPattern(criarChao(m.chao), "repeat");
    if (m.faixaChao) this.chaoFaixa = this.ctx.createPattern(criarChao(m.faixaChao.tipo), "repeat");

    if (this.op.missao === "cachorro") {
      const n = this.op.meta;
      for (let i = 0; i < n; i++) {
        this.cachorros.push({
          x: 500 + Math.random() * 1200,
          y: 1180,
          vx: 0,
          vy: 0,
          cor: CACHORROS[i % CACHORROS.length]!,
          capturado: false,
          entrou: false,
          dir: 1,
          fase: Math.random() * 6,
          susto: 0,
          perto: 0,
          ativoEm: i * (nivel === 1 ? 5 : 4),
          desvio: (Math.random() - 0.5) * 2,
        });
      }
    }
    if (this.op.missao === "marmitas") {
      const car = (x: number, y0: number, y1: number, vel: number) =>
        this.patrulhas.push({
          x,
          y: y0,
          rota: [
            { x, y: y0 },
            { x, y: y1 },
          ],
          idx: 1,
          vel: vel + nivel * 14,
          tipo: "carrinho",
          dir: 1,
          fase: 0,
          cor: { camisa: "#facc15", calca: "#111", pele: "#000", cabelo: "#000" },
          raio: 30,
          espera: 0,
        });
      car(1000, 80, 1020, 120);
      car(1400, 1020, 80, 130);
      if (nivel >= 2) car(1800, 100, 1000, 150);
      if (nivel >= 3) car(1200, 1000, 120, 170);
      // cozinheiros ao fundo (só enfeite)
      this.patrulhas.push({
        x: 180,
        y: 330,
        rota: [
          { x: 180, y: 330 },
          { x: 500, y: 330 },
        ],
        idx: 1,
        vel: 60,
        tipo: "npc",
        dir: 1,
        fase: 0,
        cor: {
          camisa: "#f8fafc",
          calca: "#374151",
          pele: "#e0ac86",
          cabelo: "#1a1410",
          chapeu: "#f8fafc",
        },
        raio: 0,
        espera: 0,
      });
    }
    if (this.op.missao === "breves") {
      // escolhe quais candidatos têm breve nesta partida
      const ids = this.mundo.interativos.filter((i) => i.tipo === "breve");
      const sorteio = [...ids].sort(() => Math.random() - 0.5).slice(0, this.op.meta);
      sorteio.forEach((i) => (i.ativo = true));
      this.breveAlvos = this.op.meta;
      const npc = (cor: Patrulha["cor"], rota: { x: number; y: number }[], vel: number) =>
        this.patrulhas.push({
          x: rota[0]!.x,
          y: rota[0]!.y,
          rota,
          idx: 1,
          vel,
          tipo: "npc",
          dir: 1,
          fase: 0,
          cor,
          raio: 22,
          espera: 0,
        });
      npc(
        { camisa: "#e2e8f0", calca: "#334155", pele: "#d9a07a", cabelo: "#2a1c12" },
        [
          { x: 150, y: 600 },
          { x: 1000, y: 610 },
        ],
        85 + nivel * 15,
      );
      npc(
        { camisa: "#fecaca", calca: "#1e293b", pele: "#c68863", cabelo: "#0f0b08" },
        [
          { x: 2050, y: 590 },
          { x: 1200, y: 640 },
        ],
        90 + nivel * 15,
      );
      if (nivel >= 2)
        npc(
          { camisa: "#bbf7d0", calca: "#44403c", pele: "#e0b592", cabelo: "#a16207" },
          [
            { x: 800, y: 560 },
            { x: 1500, y: 650 },
            { x: 800, y: 660 },
          ],
          100 + nivel * 15,
        );
    }
    if (this.op.missao === "tarefas") {
      const carro = (y: number, x0: number, x1: number, vel: number, cor: string) =>
        this.patrulhas.push({
          x: x0,
          y,
          rota: [
            { x: x0, y },
            { x: x1, y },
          ],
          idx: 1,
          vel: vel + nivel * 25,
          tipo: "carro",
          dir: x1 > x0 ? 1 : -1,
          fase: 0,
          cor: { camisa: cor, calca: "#111", pele: "#000", cabelo: "#000" },
          raio: 46,
          espera: 0,
        });
      carro(1010, -100, 2500, 210, "#dc2626");
      carro(1120, 2500, -100, 230, "#2563eb");
      if (nivel >= 2) carro(1010, 2500, -100, 180, "#eab308");
    }
  }

  // ---------------------------------------------------------------- controle

  iniciar() {
    this.parado = false;
    this.ultimo = performance.now();
    this.op.som?.iniciarMusica(this.op.clima);
    const quadro = (agora: number) => {
      if (this.parado) return;
      const dt = Math.min((agora - this.ultimo) / 1000, 1 / 20);
      this.ultimo = agora;
      if (!this.pausado && !this.terminou) this.atualizar(dt);
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

  pausar(v: boolean) {
    this.pausado = v;
  }

  private mostrar(texto: string, seg = 2.2) {
    this.aviso = texto;
    this.avisoAte = this.t + seg;
  }

  private particulasEm(x: number, y: number, cor: string, n = 10, forca = 90) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = Math.random() * forca;
      this.particulas.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 30,
        vida: 0.7,
        max: 0.7,
        cor,
        r: 2 + Math.random() * 3,
      });
    }
  }

  // --------------------------------------------------------------- física

  private resolver(x: number, y: number, r: number): { x: number; y: number; bateu: boolean } {
    let bateu = false;
    for (const p of this.mundo.paredes) {
      // a "base" de um bloco é a faixa de chão que ele ocupa: (x, y, w, h)
      const cx = ciclo(x, p.x, p.x + p.w);
      const cy = ciclo(y, p.y, p.y + p.h);
      const dx = x - cx;
      const dy = y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 < r * r) {
        bateu = true;
        if (d2 > 0.0001) {
          const d = Math.sqrt(d2);
          x = cx + (dx / d) * r;
          y = cy + (dy / d) * r;
        } else {
          // dentro do retângulo: empurra pelo lado mais próximo
          const esq = x - p.x;
          const dir = p.x + p.w - x;
          const cima = y - p.y;
          const baixo = p.y + p.h - y;
          const m = Math.min(esq, dir, cima, baixo);
          if (m === esq) x = p.x - r;
          else if (m === dir) x = p.x + p.w + r;
          else if (m === cima) y = p.y - r;
          else y = p.y + p.h + r;
        }
      }
    }
    for (const c of this.mundo.colisores) {
      const dx = x - c.x;
      const dy = y - c.y;
      const d = Math.hypot(dx, dy);
      const min = r + c.r;
      if (d < min && d > 0.0001) {
        bateu = true;
        x = c.x + (dx / d) * min;
        y = c.y + (dy / d) * min;
      }
    }
    x = ciclo(x, r, this.mundo.w - r);
    y = ciclo(y, r, this.mundo.h - r);
    return { x, y, bateu };
  }

  // -------------------------------------------------------------- atualização

  private atualizar(dt: number) {
    this.t += dt;
    const e = this.entrada;
    const m = this.mundo;
    const at = this.op.personagem.atributos;

    this.tempoRestante -= dt;
    this.buff = Math.max(0, this.buff - dt);
    this.atordoado = Math.max(0, this.atordoado - dt);
    this.bracoAlto = Math.max(0, this.bracoAlto - dt * 3);
    if (this.aviso && this.t > this.avisoAte) this.aviso = null;

    // zonas (piso molhado)
    this.molhado = m.zonas.some(
      (z) =>
        z.tipo === "molhado" &&
        this.px > z.x &&
        this.px < z.x + z.w &&
        this.py > z.y &&
        this.py < z.y + z.h,
    );

    // movimento
    let ix = e.dx;
    let iy = e.dy;
    const len = Math.hypot(ix, iy);
    if (len > 1) {
      ix /= len;
      iy /= len;
    }
    const mexendo = len > 0.12 && this.atordoado <= 0;
    const correndo = e.correr && this.folego > 0.04 && mexendo;
    let vel =
      this.vBase *
      (correndo ? 1.55 : 1) *
      (this.buff > 0 ? 1.3 : 1) *
      (1 - this.carga * 0.035) *
      (this.molhado ? 0.55 : 1);
    if (this.atordoado > 0) vel = 0;
    const alvoX = ix * vel;
    const alvoY = iy * vel;
    const acel = 9 + at.agilidade * 0.1;
    this.vx += (alvoX - this.vx) * Math.min(1, dt * acel);
    this.vy += (alvoY - this.vy) * Math.min(1, dt * acel);
    if (this.molhado && mexendo) {
      // escorrega: mantém um pouco da velocidade anterior
      this.vx += (alvoX - this.vx) * 0.02;
      this.vy += (alvoY - this.vy) * 0.02;
    }
    const r = this.resolver(this.px + this.vx * dt, this.py + this.vy * dt, 13);
    this.px = r.x;
    this.py = r.y;
    if (Math.abs(this.vx) > 8) this.dir = this.vx > 0 ? 1 : -1;
    const rapidez = Math.hypot(this.vx, this.vy);
    this.fase += dt * (rapidez / 22 + 1.2);
    if (correndo) this.folego = Math.max(0, this.folego - dt * 0.3);
    else this.folego = Math.min(1, this.folego + dt * (mexendo ? 0.16 : 0.3));
    if (rapidez > 40) this.op.som?.passoTeto(correndo);
    if (correndo && Math.random() < dt * 14)
      this.particulasEm(this.px, this.py, "rgba(255,255,255,0.5)", 1, 28);

    // câmera
    const alvoCx = ciclo(this.px + this.vx * 0.25 - VW / 2, 0, m.w - VW);
    const alvoCy = ciclo(this.py + this.vy * 0.25 - VH / 2, 0, m.h - VH);
    this.cam.x += (alvoCx - this.cam.x) * Math.min(1, dt * 6);
    this.cam.y += (alvoCy - this.cam.y) * Math.min(1, dt * 6);

    this.atualizarPatrulhas(dt);
    if (this.op.missao === "cachorro") this.atualizarCachorros(dt);

    // interação
    const perto = this.interativoPerto();
    if (e.interagir) {
      e.interagir = false;
      if (perto) this.interagir(perto);
    }

    // partículas
    for (const p of this.particulas) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 160 * dt;
      p.vida -= dt;
    }
    this.particulas = this.particulas.filter((p) => p.vida > 0);

    // tempo acabando
    if (this.tempoRestante <= 10 && this.tempoRestante > 0) {
      const inteiro = Math.ceil(this.tempoRestante);
      if (inteiro !== this.ultimoTique) {
        this.ultimoTique = inteiro;
        this.op.som?.tique();
      }
    }
    if (this.tempoRestante <= 0) {
      this.tempoRestante = 0;
      this.finalizar(false, "O tempo acabou!");
      return;
    }

    this.checarMissao();
    this.acumHud += dt;
    if (this.acumHud > 0.1) {
      this.acumHud = 0;
      this.op.aoHud(this.hud(perto));
    }
    this.acumMapa += dt;
    if (this.acumMapa > 0.12) {
      this.acumMapa = 0;
      this.desenharMinimapa();
    }
  }

  private atualizarPatrulhas(dt: number) {
    for (const p of this.patrulhas) {
      p.fase += dt * (p.tipo === "npc" ? 5 : 3);
      if (p.espera > 0) {
        p.espera -= dt;
        continue;
      }
      const alvo = p.rota[p.idx]!;
      const dx = alvo.x - p.x;
      const dy = alvo.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d < 6) {
        p.idx = (p.idx + 1) % p.rota.length;
        if (p.tipo === "carro" && p.rota.length === 2) {
          p.x = p.rota[p.idx === 0 ? 1 : 0]!.x;
          p.y = p.rota[p.idx === 0 ? 1 : 0]!.y;
        }
      } else {
        p.x += (dx / d) * p.vel * dt;
        p.y += (dy / d) * p.vel * dt;
        if (Math.abs(dx) > 4) p.dir = dx > 0 ? 1 : -1;
      }
      // colisão com o jogador
      if (p.raio > 0 && this.atordoado <= 0) {
        const cx = p.tipo === "carro" ? ciclo(this.px, p.x - 60, p.x + 60) : p.x;
        const cy = p.tipo === "carro" ? ciclo(this.py, p.y - 26, p.y) : p.y;
        if (Math.hypot(this.px - cx, this.py - cy) < p.raio + 10) this.baterEm(p);
      }
    }
  }

  private baterEm(p: Patrulha) {
    this.atordoado = 0.7;
    p.espera = 0.8;
    this.op.som?.erro();
    const ang = Math.atan2(this.py - p.y, this.px - p.x);
    this.vx = Math.cos(ang) * 260;
    this.vy = Math.sin(ang) * 260;
    this.particulasEm(this.px, this.py - 24, "#fbbf24", 12, 120);
    if (this.op.missao === "marmitas" && this.carga > 0) {
      this.carga -= 1;
      this.mostrar("Ops! Uma marmita caiu!", 1.8);
    } else if (this.op.missao === "tarefas" && p.tipo === "carro") {
      this.tempoRestante = Math.max(1, this.tempoRestante - 6);
      this.mostrar("Cuidado com os carros! -6 s", 1.8);
    } else if (this.op.missao === "breves") {
      this.tempoRestante = Math.max(1, this.tempoRestante - 3);
      this.mostrar("Esbarrou! -3 s", 1.6);
    }
  }

  private atualizarCachorros(dt: number) {
    const nivel = this.op.nivel;
    const velBase = 165 + nivel * 26;
    for (const c of this.cachorros) {
      if (c.capturado || c.entrou) continue;
      if (this.t < c.ativoEm) continue;
      if (c.ativoEm > 0 && this.t - c.ativoEm < dt * 2) {
        this.op.som?.latido(2);
        this.mostrar("Outro cachorro apareceu!", 2);
      }
      c.fase += dt * 6;
      c.susto = Math.max(0, c.susto - dt * 1.4);
      // alvo: o portão
      const gx = 1100;
      const gy = 235;
      let dx = gx - c.x;
      let dy = gy - c.y;
      const dl = Math.hypot(dx, dy) || 1;
      dx /= dl;
      dy /= dl;
      // foge do jogador
      const px = c.x - this.px;
      const py = c.y - this.py;
      const dp = Math.hypot(px, py);
      let fuga = 0;
      if (dp < 240) {
        fuga = 1 - dp / 240;
        if (dp < 200 && c.susto < 0.5) c.susto = 1;
        dx = dx * (1 - fuga * 0.8) + (px / (dp || 1)) * fuga * 1.6;
        dy = dy * (1 - fuga * 0.8) + (py / (dp || 1)) * fuga * 1.6;
      }
      // ziguezague
      c.desvio += (Math.random() - 0.5) * dt * 4;
      c.desvio = ciclo(c.desvio, -1, 1);
      const ang = Math.atan2(dy, dx) + c.desvio * 0.5 * (1 + fuga);
      const vel = velBase * (1 + fuga * 0.35);
      const alvoVx = Math.cos(ang) * vel;
      const alvoVy = Math.sin(ang) * vel;
      c.vx += (alvoVx - c.vx) * Math.min(1, dt * 6);
      c.vy += (alvoVy - c.vy) * Math.min(1, dt * 6);
      const r = this.resolver(c.x + c.vx * dt, c.y + c.vy * dt, 11);
      if (r.bateu) {
        // bateu num obstáculo: desvia para o lado
        c.desvio = Math.random() < 0.5 ? -1 : 1;
      }
      c.x = r.x;
      c.y = r.y;
      if (Math.abs(c.vx) > 10) c.dir = c.vx > 0 ? 1 : -1;
      // entrou no portão?
      const z = this.mundo.zonas[0]!;
      if (c.x > z.x && c.x < z.x + z.w && c.y > z.y && c.y < z.y + z.h) {
        c.entrou = true;
        this.op.som?.sirene();
        this.finalizar(false, "O cachorro entrou na unidade!");
        return;
      }
      // captura: perto do agente por um instante
      const dist = Math.hypot(c.x - this.px, c.y - this.py);
      if (dist < 34) c.perto += dt;
      else c.perto = Math.max(0, c.perto - dt * 2);
      if (c.perto > 0.22) {
        c.capturado = true;
        this.capturados += 1;
        this.pontos += 300 + this.op.nivel * 100;
        this.op.som?.capturar();
        this.particulasEm(c.x, c.y - 20, "#fde047", 26, 160);
        this.particulasEm(c.x, c.y - 20, "#ffffff", 14, 120);
        this.mostrar("Peguei! Cachorro capturado!", 2);
        this.bracoAlto = 1;
      }
    }
  }

  private interativoPerto(): Interativo | null {
    let melhor: Interativo | null = null;
    let md = Infinity;
    for (const i of this.mundo.interativos) {
      if (!i.ativo) continue;
      const d = Math.hypot(i.x - this.px, i.y - this.py);
      if (d < i.r && d < md) {
        melhor = i;
        md = d;
      }
    }
    return melhor;
  }

  private podeUsar(i: Interativo): boolean {
    if (i.requer && !i.requer.every((r) => this.tarefasFeitas.has(r))) return false;
    if (i.tipo === "porta" && this.carga === 0) return false;
    if (i.tipo === "coord" && this.breves === 0) return false;
    if (i.tipo === "balcao" && this.carga >= this.cap) return false;
    return true;
  }

  private interagir(i: Interativo) {
    const som = this.op.som;
    if (i.requer && !i.requer.every((r) => this.tarefasFeitas.has(r))) {
      som?.erro();
      this.mostrar(
        i.id === "registro"
          ? "Cumpra as outras tarefas primeiro!"
          : "Ainda falta algo antes disso.",
        2,
      );
      return;
    }
    switch (i.tipo) {
      case "balcao":
        if (this.carga >= this.cap) {
          som?.erro();
          this.mostrar(`Suas mãos estão cheias (${this.cap})!`, 1.6);
          return;
        }
        this.carga = this.cap;
        this.bracoAlto = 1;
        som?.pegar();
        this.mostrar(`Pegou ${this.cap} marmitas!`, 1.4);
        this.particulasEm(i.x, i.y - 30, "#7dd3fc", 8, 60);
        break;
      case "porta": {
        if (this.carga === 0) {
          som?.erro();
          this.mostrar("Você não está com marmitas!", 1.6);
          return;
        }
        const n = this.carga;
        this.carga = 0;
        this.entregues += n;
        this.pontos += n * 100 + (n >= this.cap ? 150 : 0);
        som?.entregar();
        this.particulasEm(i.x - 30, i.y - 30, "#4ade80", 18, 130);
        this.mostrar(
          n >= this.cap
            ? `Entrega completa! +${n * 100 + 150}`
            : `${n} marmita${n > 1 ? "s" : ""} entregue${n > 1 ? "s" : ""}!`,
          1.6,
        );
        break;
      }
      case "breve":
        i.ativo = false;
        this.breves += 1;
        this.coletadas += 1;
        this.pontos += 120;
        som?.pegar();
        this.bracoAlto = 1;
        this.particulasEm(i.x, i.y - 20, "#fde047", 10, 90);
        this.mostrar("Breve coletado!", 1.2);
        break;
      case "coord": {
        if (this.breves === 0) {
          som?.erro();
          this.mostrar("Você não está com nenhum breve!", 1.6);
          return;
        }
        this.pontos += this.breves * 150;
        this.entregues += this.breves;
        this.mostrar(
          `${this.breves} breve${this.breves > 1 ? "s" : ""} entregue${this.breves > 1 ? "s" : ""} à Coordenação!`,
          2,
        );
        this.breves = 0;
        som?.entregar();
        this.particulasEm(i.x, i.y - 40, "#4ade80", 22, 150);
        break;
      }
      case "cafe":
        i.ativo = false;
        this.buff = 6;
        som?.cafe();
        this.mostrar("Cafezinho! Velocidade extra por 6 s", 2);
        this.particulasEm(i.x, i.y - 20, "#f59e0b", 14, 100);
        break;
      case "tarefa":
        i.ativo = false;
        this.tarefasFeitas.add(i.id);
        this.pontos += 250;
        this.bracoAlto = 1;
        if (i.id === "agua") som?.agua();
        else som?.entregar();
        this.mostrar(
          {
            radio: "Rádio em mãos!",
            cadeado: "Cadeado conferido!",
            agua: "Garrafa cheia!",
            chave: "Chave na mão!",
            portaria: "Chave entregue na portaria!",
            controle: "Controle de segurança OK!",
            registro: "Ocorrência registrada!",
          }[i.id] ?? "Tarefa cumprida!",
          2,
        );
        this.particulasEm(i.x, i.y - 30, "#4ade80", 16, 120);
        break;
    }
  }

  private objetivos(): Objetivo[] {
    const meta = this.op.meta;
    switch (this.op.missao) {
      case "cachorro":
        return [
          {
            texto: `Impeça ${meta} cachorro${meta > 1 ? "s" : ""} de entrar na unidade`,
            feito: this.capturados >= meta,
            contador: `${this.capturados}/${meta}`,
          },
          { texto: "Não deixe nenhum passar pelo portão", feito: false },
        ];
      case "marmitas":
        return [
          {
            texto: `Entregue as marmitas`,
            feito: this.entregues >= meta,
            contador: `${Math.min(this.entregues, meta)}/${meta}`,
          },
          { texto: "Desvie do carrinho de limpeza", feito: false },
          { texto: "Cuidado com o piso molhado", feito: false },
        ];
      case "breves":
        return [
          {
            texto: "Colete os breves nas mesas",
            feito: this.coletadas >= meta,
            contador: `${this.coletadas}/${meta}`,
          },
          {
            texto: "Entregue todos na Coordenação",
            feito: this.entregues >= meta,
            contador: `${Math.min(this.entregues, meta)}/${meta}`,
          },
          { texto: "Pegue um cafezinho para acelerar", feito: this.buff > 0 },
        ];
      default: {
        const nome: [string, string][] = [
          ["radio", "Pegar o rádio na guarita"],
          ["cadeado", "Conferir o cadeado do portão"],
          ["agua", "Encher a garrafa no bebedouro"],
          ["chave", "Pegar a chave no armário"],
          ["portaria", "Entregar a chave na portaria"],
          ["controle", "Passar pelo controle de segurança"],
          ["registro", "Registrar a ocorrência"],
        ];
        return nome.map(([id, texto]) => ({ texto, feito: this.tarefasFeitas.has(id) }));
      }
    }
  }

  private checarMissao() {
    const meta = this.op.meta;
    if (this.op.missao === "cachorro" && this.capturados >= meta)
      this.finalizar(true, "Todos os cachorros foram pegos!");
    if (this.op.missao === "marmitas" && this.entregues >= meta)
      this.finalizar(true, "Entregas concluídas!");
    if (this.op.missao === "breves" && this.entregues >= meta)
      this.finalizar(true, "Todos os breves na Coordenação!");
    if (this.op.missao === "tarefas" && this.tarefasFeitas.has("registro"))
      this.finalizar(true, "Plantão em dia!");
  }

  private finalizar(vitoria: boolean, motivo: string) {
    if (this.terminou) return;
    this.terminou = true;
    const gasto = this.total - this.tempoRestante;
    const sobra = this.tempoRestante / this.total;
    let pontos = this.pontos;
    if (vitoria) pontos += Math.round(this.tempoRestante * 6);
    const estrelas = vitoria ? (sobra >= 0.5 ? 3 : sobra >= 0.25 ? 2 : 1) : 0;
    if (vitoria) this.op.som?.vitoria();
    else if (!motivo.includes("cachorro")) this.op.som?.derrota();
    else this.op.som?.derrota();
    this.op.aoHud(this.hud(null));
    const detalhes: string[] = [];
    if (this.op.missao === "cachorro")
      detalhes.push(`Cachorros pegos: ${this.capturados}/${this.op.meta}`);
    if (this.op.missao === "marmitas")
      detalhes.push(`Marmitas entregues: ${this.entregues}/${this.op.meta}`);
    if (this.op.missao === "breves")
      detalhes.push(`Breves entregues: ${this.entregues}/${this.op.meta}`);
    if (this.op.missao === "tarefas")
      detalhes.push(`Tarefas cumpridas: ${this.tarefasFeitas.size}/7`);
    detalhes.push(`Tempo usado: ${Math.round(gasto)} s`);
    window.setTimeout(
      () => this.op.aoFim({ vitoria, motivo, pontos, estrelas, tempoGasto: gasto, detalhes }),
      900,
    );
  }

  private hud(perto: Interativo | null): HudArena {
    const item = this.carga > 0 ? "marmita" : this.breves > 0 ? "breve" : null;
    return {
      titulo: this.op.titulo,
      objetivos: this.objetivos(),
      tempo: Math.max(0, this.tempoRestante),
      pontos: this.pontos,
      folego: this.folego,
      carga: this.op.missao === "breves" ? this.breves : this.carga,
      capacidade: this.op.missao === "breves" ? this.breveAlvos : this.cap,
      prompt:
        perto && (perto.tipo === "breve" || this.podeUsar(perto) || perto.requer)
          ? perto.texto
          : null,
      aviso: this.aviso,
      item,
    };
  }

  // ---------------------------------------------------------------- desenho

  private desenhar() {
    const c = this.ctx;
    const m = this.mundo;
    c.clearRect(0, 0, VIEW_W, VIEW_H);
    c.save();
    c.scale(ZOOM, ZOOM);
    c.translate(-Math.round(this.cam.x), -Math.round(this.cam.y));

    // chão
    if (this.chao) {
      c.fillStyle = this.chao;
      c.fillRect(this.cam.x - 2, this.cam.y - 2, VW + 4, VH + 4);
    }
    if (m.faixaChao && this.chaoFaixa) {
      c.fillStyle = this.chaoFaixa;
      c.fillRect(m.faixaChao.rect.x, m.faixaChao.rect.y, m.faixaChao.rect.w, m.faixaChao.rect.h);
    }
    m.chaoExtra?.(c);
    // zonas molhadas: brilho
    for (const z of m.zonas) {
      if (z.tipo === "molhado") {
        c.fillStyle = "rgba(125,211,252,0.18)";
        c.beginPath();
        c.ellipse(z.x + z.w / 2, z.y + z.h / 2, z.w / 2, z.h / 2, 0, 0, Math.PI * 2);
        c.fill();
      }
    }
    // marcadores de objetivos no chão (anéis pulsantes)
    for (const i of m.interativos) {
      if (!i.ativo) continue;
      const bloqueado = i.requer && !i.requer.every((r) => this.tarefasFeitas.has(r));
      const util =
        i.tipo === "breve" ||
        i.tipo === "cafe" ||
        i.tipo === "tarefa" ||
        (i.tipo === "balcao" && this.carga < this.cap) ||
        (i.tipo === "porta" && this.carga > 0) ||
        (i.tipo === "coord" && this.breves > 0);
      if (!util) continue;
      const pulso = 1 + Math.sin(this.t * 4) * 0.07;
      c.strokeStyle = bloqueado ? "rgba(148,163,184,0.5)" : "rgba(250,204,21,0.9)";
      c.lineWidth = 3;
      c.setLineDash([9, 7]);
      c.lineDashOffset = -this.t * 18;
      c.beginPath();
      c.ellipse(i.x, i.y, i.r * 0.75 * pulso, i.r * 0.42 * pulso, 0, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);
    }

    // objetos ordenados por profundidade (y do "pé")
    type Item = { y: number; f: () => void };
    const itens: Item[] = [];
    for (const p of m.paredes) {
      if (p.invisivel || p.w <= 0) continue;
      if (
        p.x + p.w < this.cam.x - 40 ||
        p.x > this.cam.x + VW + 40 ||
        p.y - p.alt > this.cam.y + VH ||
        p.y + p.h < this.cam.y - 40
      )
        continue;
      itens.push({
        y: p.y + p.h,
        f: () => {
          bloco(c, p.x, p.y, p.w, p.h, p.alt, p.topo, p.frente);
          p.extra?.(c, p, this.t);
        },
      });
    }
    for (const d of m.decor) itens.push({ y: d.y, f: () => d.desenhar(c, this.t) });
    for (const i of m.interativos) {
      if (!i.ativo) continue;
      const brilho = 0.5 + Math.sin(this.t * 5) * 0.5;
      if (i.tipo === "breve")
        itens.push({
          y: i.y,
          f: () => desenharBreve(c, i.x, i.y - 6 + Math.sin(this.t * 3 + i.x) * 3, brilho),
        });
      if (i.tipo === "cafe")
        itens.push({
          y: i.y,
          f: () => desenharCafe(c, i.x, i.y - 6 + Math.sin(this.t * 3) * 3, brilho),
        });
      if (i.tipo === "balcao")
        itens.push({
          y: i.y - 60,
          f: () => {
            for (let k = 0; k < 4; k++)
              desenharMarmita(c, i.x - 42 + k * 28, i.y - 66, brilho * 0.4);
          },
        });
      if (i.id === "agua")
        itens.push({ y: i.y, f: () => desenharGarrafa(c, i.x, i.y - 48, brilho) });
    }
    for (const p of this.patrulhas) {
      itens.push({
        y: p.y,
        f: () => {
          if (p.tipo === "carrinho") desenharCarrinho(c, p.x, p.y, p.dir);
          else if (p.tipo === "carro") this.desenharCarroRua(c, p);
          else this.desenharFuncionario(c, p);
        },
      });
    }
    for (const d of this.cachorros) {
      if (d.capturado || d.entrou || this.t < d.ativoEm) continue;
      itens.push({
        y: d.y,
        f: () =>
          desenharCachorro(c, d.x, d.y, d.cor, d.dir, d.fase, Math.hypot(d.vx, d.vy) > 40, d.susto),
      });
    }
    itens.push({
      y: this.py,
      f: () => {
        desenharAgente(
          c,
          this.px,
          this.py,
          this.op.personagem,
          this.op.imagens[this.op.personagem.rosto],
          {
            dir: this.dir,
            fase: this.fase,
            correndo: this.entrada.correr && this.folego > 0.04,
            parado: Math.hypot(this.vx, this.vy) < 25,
            carga: this.op.missao === "marmitas" ? this.carga : 0,
            dano: this.atordoado > 0 ? this.atordoado : 0,
            bracoAlto: this.bracoAlto,
          },
          this.op.imagens[this.op.personagem.sprite],
        );
        // breves nas mãos
        if (this.op.missao === "breves" && this.breves > 0) {
          for (let k = 0; k < Math.min(this.breves, 4); k++)
            desenharBreve(c, this.px + 14 * this.dir, this.py - 24 - k * 5);
        }
        if (this.buff > 0) {
          c.strokeStyle = "rgba(251,191,36,0.7)";
          c.lineWidth = 2;
          c.beginPath();
          c.ellipse(this.px, this.py, 22 + Math.sin(this.t * 10) * 2, 9, 0, 0, Math.PI * 2);
          c.stroke();
        }
      },
    });
    itens.sort((a, b) => a.y - b.y);
    for (const it of itens) it.f();

    // partículas
    for (const p of this.particulas) {
      c.globalAlpha = Math.max(0, p.vida / p.max);
      c.fillStyle = p.cor;
      c.beginPath();
      c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;

    // indicador de direção: setas para cachorros fora da tela
    if (this.op.missao === "cachorro") {
      for (const d of this.cachorros) {
        if (d.capturado || d.entrou || this.t < d.ativoEm) continue;
        this.desenharSeta(c, d.x, d.y, "#fb923c", "🐕");
      }
    }
    c.restore();

    this.desenharClima(c);
    this.desenharVinheta(c);
  }

  /** Funcionário andando: usa uma figura realista da equipe; sem imagem, o boneco em código. */
  private desenharFuncionario(c: CanvasRenderingContext2D, p: Patrulha) {
    const escolha = Math.abs(Math.round(p.cor.camisa.charCodeAt(1) + p.cor.calca.charCodeAt(2)));
    const img = this.op.imagens[SPRITES_NPC[escolha % SPRITES_NPC.length]!];
    if (img && img.complete && img.naturalWidth > 0) {
      const parado = p.espera > 0;
      desenharFigura(c, p.x, p.y, img, 80, 0, p.cor.calca, "#111", {
        dir: p.dir,
        fase: p.fase,
        correndo: false,
        parado,
        carga: 0,
        cintura: escolha % SPRITES_NPC.length === 2 ? 0 : 0.5,
      });
    } else {
      desenharNpc(c, p.x, p.y, p.cor, p.dir, p.fase);
    }
  }

  private desenharCarroRua(c: CanvasRenderingContext2D, p: Patrulha) {
    c.save();
    c.translate(p.x, p.y);
    c.scale(p.dir, 1);
    sombra(c, 0, 0, 62, 14);
    c.fillStyle = p.cor.camisa;
    c.beginPath();
    c.roundRect(-58, -40, 116, 34, 10);
    c.fill();
    c.fillStyle = "rgba(0,0,0,0.25)";
    c.fillRect(-58, -16, 116, 10);
    c.fillStyle = "#0f172a";
    c.beginPath();
    c.roundRect(-30, -62, 60, 26, [10, 10, 2, 2]);
    c.fill();
    c.fillStyle = "rgba(125,211,252,0.55)";
    c.fillRect(-24, -58, 22, 18);
    c.fillRect(2, -58, 22, 18);
    c.fillStyle = "#fde68a";
    c.fillRect(52, -30, 6, 8);
    c.fillStyle = "#111";
    c.beginPath();
    c.arc(-34, -6, 9, 0, Math.PI * 2);
    c.arc(34, -6, 9, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  private desenharSeta(
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    cor: string,
    _emoji: string,
  ) {
    const sx = x - this.cam.x;
    const sy = y - this.cam.y;
    if (sx > 40 && sx < VW - 40 && sy > 40 && sy < VH - 40) return;
    const cx = ciclo(sx, 34, VW - 34);
    const cy = ciclo(sy, 34, VH - 34);
    const ang = Math.atan2(sy - VH / 2, sx - VW / 2);
    c.save();
    c.translate(cx + this.cam.x, cy + this.cam.y);
    c.rotate(ang);
    c.fillStyle = cor;
    c.strokeStyle = "#fff";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(16, 0);
    c.lineTo(-10, -13);
    c.lineTo(-4, 0);
    c.lineTo(-10, 13);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
  }

  /** Luz do dia: nada no dia, tom quente no pôr do sol, escuridão com faróis na noite. */
  private desenharClima(c: CanvasRenderingContext2D) {
    const clima = this.op.clima;
    if (clima === "dia") return;
    if (clima === "por-do-sol") {
      const g = c.createLinearGradient(0, 0, VIEW_W, VIEW_H);
      g.addColorStop(0, "rgba(255,140,60,0.22)");
      g.addColorStop(1, "rgba(120,40,120,0.28)");
      c.fillStyle = g;
      c.fillRect(0, 0, VIEW_W, VIEW_H);
      return;
    }
    const n = this.noite.getContext("2d")!;
    n.globalCompositeOperation = "source-over";
    n.clearRect(0, 0, VIEW_W, VIEW_H);
    n.fillStyle = "rgba(4,8,32,0.72)";
    n.fillRect(0, 0, VIEW_W, VIEW_H);
    n.globalCompositeOperation = "destination-out";
    const luz = (x: number, y: number, r: number, forca: number) => {
      const g = n.createRadialGradient(x, y, r * 0.1, x, y, r);
      g.addColorStop(0, `rgba(0,0,0,${forca})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      n.fillStyle = g;
      n.fillRect(x - r, y - r, r * 2, r * 2);
    };
    luz((this.px - this.cam.x) * ZOOM, (this.py - this.cam.y - 30) * ZOOM, 230 * ZOOM, 0.95);
    for (const l of this.mundo.luzes) {
      const sx = (l.x - this.cam.x) * ZOOM;
      const sy = (l.y - this.cam.y) * ZOOM;
      if (
        sx < -l.r * ZOOM ||
        sx > VIEW_W + l.r * ZOOM ||
        sy < -l.r * ZOOM ||
        sy > VIEW_H + l.r * ZOOM
      )
        continue;
      luz(sx, sy, l.r * ZOOM, 0.9);
    }
    n.globalCompositeOperation = "source-over";
    c.drawImage(this.noite, 0, 0);
    // halo quente das luzes
    c.save();
    c.globalCompositeOperation = "lighter";
    for (const l of this.mundo.luzes) {
      const sx = (l.x - this.cam.x) * ZOOM;
      const sy = (l.y - this.cam.y) * ZOOM;
      if (sx < -80 || sx > VIEW_W + 80 || sy < -80 || sy > VIEW_H + 80) continue;
      const g = c.createRadialGradient(sx, sy, 0, sx, sy, 60);
      g.addColorStop(0, "rgba(255,220,150,0.35)");
      g.addColorStop(1, "rgba(255,200,120,0)");
      c.fillStyle = g;
      c.fillRect(sx - 60, sy - 60, 120, 120);
    }
    c.restore();
  }

  private desenharVinheta(c: CanvasRenderingContext2D) {
    const g = c.createRadialGradient(
      VIEW_W / 2,
      VIEW_H / 2,
      VIEW_H * 0.45,
      VIEW_W / 2,
      VIEW_H / 2,
      VIEW_W * 0.72,
    );
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.42)");
    c.fillStyle = g;
    c.fillRect(0, 0, VIEW_W, VIEW_H);
    if (this.tempoRestante < 10) {
      c.fillStyle = `rgba(220,38,38,${0.08 + Math.abs(Math.sin(this.t * 4)) * 0.1})`;
      c.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }

  private desenharMinimapa() {
    const mm = this.op.minimapa;
    if (!mm) return;
    const c = mm.getContext("2d");
    if (!c) return;
    const W = mm.width;
    const H = mm.height;
    const m = this.mundo;
    const s = Math.min(W / m.w, H / m.h);
    const ox = (W - m.w * s) / 2;
    const oy = (H - m.h * s) / 2;
    c.clearRect(0, 0, W, H);
    c.fillStyle = "rgba(15,23,42,0.85)";
    c.fillRect(0, 0, W, H);
    c.fillStyle = "rgba(148,163,184,0.55)";
    for (const p of m.paredes) {
      if (p.w <= 0 || p.invisivel) continue;
      c.fillRect(ox + p.x * s, oy + p.y * s, Math.max(1.5, p.w * s), Math.max(1.5, p.h * s));
    }
    for (const i of m.interativos) {
      if (!i.ativo) continue;
      c.fillStyle =
        i.tipo === "porta" || i.tipo === "coord"
          ? "#22c55e"
          : i.tipo === "cafe"
            ? "#f59e0b"
            : "#facc15";
      c.beginPath();
      c.arc(ox + i.x * s, oy + i.y * s, 3, 0, Math.PI * 2);
      c.fill();
    }
    for (const d of this.cachorros) {
      if (d.capturado || d.entrou || this.t < d.ativoEm) continue;
      c.fillStyle = "#f97316";
      c.beginPath();
      c.arc(ox + d.x * s, oy + d.y * s, 3.6, 0, Math.PI * 2);
      c.fill();
    }
    for (const z of m.zonas) {
      if (z.tipo !== "portao") continue;
      c.strokeStyle = "#ef4444";
      c.lineWidth = 1.5;
      c.strokeRect(ox + z.x * s, oy + z.y * s, z.w * s, z.h * s);
    }
    c.fillStyle = "#38bdf8";
    c.beginPath();
    c.arc(ox + this.px * s, oy + this.py * s, 4, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#fff";
    c.lineWidth = 1.5;
    c.stroke();
    c.strokeStyle = "rgba(255,255,255,0.4)";
    c.strokeRect(ox + this.cam.x * s, oy + this.cam.y * s, VW * s, VH * s);
  }
}
