/**
 * Regras e inteligência do Jogo da Onça (Adugo).
 *
 * Tabuleiro de 31 pontos: uma grade de 5 × 5 com diagonais nos pontos "pares" e
 * um triângulo (a armadilha) preso ao ponto central da última linha. A onça
 * joga contra 14 cachorros. Todos andam para um ponto vizinho vazio, em
 * qualquer direção; só a onça captura, pulando um cachorro em linha reta
 * para o ponto vazio logo depois (e pode continuar pulando em sequência).
 * A onça vence ao capturar 5 cachorros; os cachorros vencem quando a onça
 * não consegue mais se mexer.
 */

export interface Ponto {
  x: number;
  y: number;
}

/** Pontos 0–24: a grade (índice = y × 5 + x). 25–30: o triângulo. */
export const PONTOS: Ponto[] = [];
for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) PONTOS.push({ x, y });
PONTOS.push(
  { x: 1, y: 5 }, // 25
  { x: 2, y: 5 }, // 26
  { x: 3, y: 5 }, // 27
  { x: 0, y: 6 }, // 28
  { x: 2, y: 6 }, // 29
  { x: 4, y: 6 }, // 30
);
export const N_PONTOS = PONTOS.length;
/** O vértice do triângulo é o ponto central da última linha da grade. */
export const VERTICE = 22;
export const CENTRO = 12;
export const CAES_TOTAL = 14;
export const CAPTURAS_PARA_VENCER = 5;

const chave = (a: number, b: number) => (a < b ? a * 64 + b : b * 64 + a);
const arestas = new Set<number>();
const liga = (a: number, b: number) => arestas.add(chave(a, b));

for (let y = 0; y < 5; y++)
  for (let x = 0; x < 5; x++) {
    const i = y * 5 + x;
    if (x < 4) liga(i, i + 1);
    if (y < 4) liga(i, i + 5);
    // diagonais só saem dos pontos em que x + y é par
    if ((x + y) % 2 === 0) {
      if (x < 4 && y < 4) liga(i, i + 6);
      if (x > 0 && y < 4) liga(i, i + 4);
    }
  }
for (const [a, b] of [
  [22, 25],
  [22, 26],
  [22, 27],
  [25, 26],
  [26, 27],
  [25, 28],
  [26, 29],
  [27, 30],
  [28, 29],
  [29, 30],
] as [number, number][])
  liga(a, b);

export const temAresta = (a: number, b: number) => arestas.has(chave(a, b));

export const ARESTAS: [number, number][] = [];
for (let a = 0; a < N_PONTOS; a++)
  for (let b = a + 1; b < N_PONTOS; b++) if (temAresta(a, b)) ARESTAS.push([a, b]);

export const VIZINHOS: number[][] = Array.from({ length: N_PONTOS }, (_, a) =>
  Array.from({ length: N_PONTOS }, (_, b) => b).filter((b) => b !== a && temAresta(a, b)),
);

const porCoordenada = new Map<string, number>();
PONTOS.forEach((p, i) => porCoordenada.set(`${p.x},${p.y}`, i));

/** Pulos possíveis a partir de cada ponto: por cima de `sobre`, caindo em `para`. */
export const PULOS: { sobre: number; para: number }[][] = Array.from(
  { length: N_PONTOS },
  (_, de) => {
    const lista: { sobre: number; para: number }[] = [];
    for (const q of VIZINHOS[de]!) {
      const p = PONTOS[de]!;
      const c = PONTOS[q]!;
      const r = porCoordenada.get(`${c.x + (c.x - p.x)},${c.y + (c.y - p.y)}`);
      if (r !== undefined && temAresta(q, r)) lista.push({ sobre: q, para: r });
    }
    return lista;
  },
);

// -------------------------------------------------------------------- estado

export type Vez = "onca" | "caes";

export interface Estado {
  /** Posição de cada cachorro (−1 = capturado). O índice é a identidade da peça. */
  caes: number[];
  onca: number;
  capturados: number;
  vez: Vez;
  /** Meias-jogadas feitas (para o limite de empate). */
  jogadas: number;
}

export const LIMITE_JOGADAS = 240;

export function estadoInicial(): Estado {
  // Duas fileiras cheias no topo e a terceira sem o centro, onde fica a onça.
  const caes: number[] = [];
  for (let i = 0; i < 15; i++) if (i !== CENTRO) caes.push(i);
  return { caes, onca: CENTRO, capturados: 0, vez: "onca", jogadas: 0 };
}

/** −1 vazio, 0…13 cachorro, 99 onça. */
export function tabuleiro(e: Estado): Int16Array {
  const t = new Int16Array(N_PONTOS).fill(-1);
  e.caes.forEach((p, id) => {
    if (p >= 0) t[p] = id;
  });
  t[e.onca] = 99;
  return t;
}

export type Lance =
  | { tipo: "onca"; caminho: number[]; comidos: number[] }
  | { tipo: "cao"; id: number; para: number };

/** Todos os lances da onça: passos simples e sequências de pulos (cada trecho pode parar). */
export function lancesOnca(e: Estado): Extract<Lance, { tipo: "onca" }>[] {
  const t = tabuleiro(e);
  const lances: Extract<Lance, { tipo: "onca" }>[] = [];
  for (const v of VIZINHOS[e.onca]!)
    if (t[v] === -1) lances.push({ tipo: "onca", caminho: [v], comidos: [] });

  const cair = (de: number, caminho: number[], comidos: number[]) => {
    for (const { sobre, para } of PULOS[de]!) {
      const id = t[sobre]!;
      if (id < 0 || id === 99 || comidos.includes(id)) continue;
      // o ponto de saída da onça já está vazio; os comidos também
      const livre = t[para] === -1 || para === e.onca || comidos.some((c) => e.caes[c] === para);
      if (!livre || caminho.includes(para)) continue;
      const cam = [...caminho, para];
      const com = [...comidos, id];
      lances.push({ tipo: "onca", caminho: cam, comidos: com });
      cair(para, cam, com);
    }
  };
  cair(e.onca, [], []);
  return lances;
}

/** Pulos possíveis a partir de um ponto, com alguns cachorros já retirados (sequência em andamento). */
export function pulosDe(
  e: Estado,
  de: number,
  comidos: number[],
): { sobre: number; para: number; id: number }[] {
  const t = tabuleiro(e);
  const res: { sobre: number; para: number; id: number }[] = [];
  for (const { sobre, para } of PULOS[de]!) {
    const id = t[sobre]!;
    if (id < 0 || id === 99 || comidos.includes(id)) continue;
    const livre = t[para] === -1 || para === e.onca || comidos.some((c) => e.caes[c] === para);
    if (livre) res.push({ sobre, para, id });
  }
  return res;
}

export function lancesCaes(e: Estado): Extract<Lance, { tipo: "cao" }>[] {
  const t = tabuleiro(e);
  const lances: Extract<Lance, { tipo: "cao" }>[] = [];
  e.caes.forEach((p, id) => {
    if (p < 0) return;
    for (const v of VIZINHOS[p]!) if (t[v] === -1) lances.push({ tipo: "cao", id, para: v });
  });
  return lances;
}

export function lancesDe(e: Estado): Lance[] {
  return e.vez === "onca" ? lancesOnca(e) : lancesCaes(e);
}

export function aplicar(e: Estado, l: Lance): Estado {
  if (l.tipo === "cao") {
    const caes = [...e.caes];
    caes[l.id] = l.para;
    return { ...e, caes, vez: "onca", jogadas: e.jogadas + 1 };
  }
  const caes = [...e.caes];
  for (const id of l.comidos) caes[id] = -1;
  return {
    caes,
    onca: l.caminho[l.caminho.length - 1]!,
    capturados: e.capturados + l.comidos.length,
    vez: "caes",
    jogadas: e.jogadas + 1,
  };
}

export type Resultado = "onca" | "caes" | "empate" | null;

export function resultado(e: Estado): Resultado {
  if (e.capturados >= CAPTURAS_PARA_VENCER) return "onca";
  if (e.jogadas >= LIMITE_JOGADAS) return "empate";
  if (e.vez === "onca" && lancesOnca(e).length === 0) return "caes";
  if (e.vez === "caes" && lancesCaes(e).length === 0) return "onca";
  return null;
}

/** A onça está cercada e não tem como se mexer? (para avisar "cuidado!" antes do fim). */
export function mobilidadeOnca(e: Estado): { passos: number; pulos: number } {
  const ls = lancesOnca(e);
  return {
    passos: ls.filter((l) => l.comidos.length === 0).length,
    pulos: ls.filter((l) => l.comidos.length > 0).length,
  };
}

// ---------------------------------------------------------------- inteligência

/** Nota do ponto de vista da onça: quanto maior, melhor para ela. */
function avaliar(e: Estado): number {
  const m = mobilidadeOnca({ ...e, vez: "onca" });
  let nota = e.capturados * 220 + m.passos * 7 + m.pulos * 26;
  // cachorros vivos em pontos mais altos protegem melhor a linha; a onça no triângulo é mau sinal para ela
  if (e.onca >= 25 || e.onca === VERTICE) nota -= 40;
  // cachorros ameaçados (a onça pularia se fosse a vez dela)
  const t = tabuleiro(e);
  let ameacados = 0;
  for (const { sobre, para } of PULOS[e.onca]!) {
    const id = t[sobre]!;
    if (id >= 0 && id !== 99 && t[para] === -1) ameacados += 1;
  }
  nota += ameacados * 18;
  return nota;
}

function busca(e: Estado, prof: number, alfa: number, beta: number): number {
  const r = resultado(e);
  if (r === "onca") return 100000 + prof;
  if (r === "caes") return -100000 - prof;
  if (r === "empate") return 0;
  if (prof === 0) return avaliar(e);
  const lances = lancesDe(e);
  if (e.vez === "onca") {
    // pulos longos primeiro: podam mais
    lances.sort(
      (a, b) =>
        (b.tipo === "onca" ? b.comidos.length : 0) - (a.tipo === "onca" ? a.comidos.length : 0),
    );
    let melhor = -Infinity;
    for (const l of lances) {
      melhor = Math.max(melhor, busca(aplicar(e, l), prof - 1, alfa, beta));
      alfa = Math.max(alfa, melhor);
      if (alfa >= beta) break;
    }
    return melhor;
  }
  let melhor = Infinity;
  for (const l of lances) {
    melhor = Math.min(melhor, busca(aplicar(e, l), prof - 1, alfa, beta));
    beta = Math.min(beta, melhor);
    if (alfa >= beta) break;
  }
  return melhor;
}

export interface Analise {
  lance: Lance;
  nota: number;
}

/** Escolhe o melhor lance para quem está na vez (nível 1 = ao acaso, com erros; 3 = mais fundo). */
export function melhorLance(e: Estado, nivel: number): Analise | null {
  const lances = lancesDe(e);
  if (!lances.length) return null;
  const profundidade = nivel <= 1 ? 1 : nivel === 2 ? 3 : 4;
  const acaso = nivel <= 1 ? 0.45 : nivel === 2 ? 0.12 : 0;
  if (Math.random() < acaso) {
    const l = lances[Math.floor(Math.random() * lances.length)]!;
    return { lance: l, nota: 0 };
  }
  const daOnca = e.vez === "onca";
  let melhor: Lance = lances[0]!;
  let melhorNota = daOnca ? -Infinity : Infinity;
  const embaralhado = [...lances].sort(() => Math.random() - 0.5);
  for (const l of embaralhado) {
    const n = busca(aplicar(e, l), profundidade - 1, -Infinity, Infinity);
    if (daOnca ? n > melhorNota : n < melhorNota) {
      melhorNota = n;
      melhor = l;
    }
  }
  return { lance: melhor, nota: melhorNota };
}
