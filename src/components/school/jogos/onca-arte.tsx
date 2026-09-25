/**
 * Arte do Jogo da Onça: peças, faixa de penas e tabuleiro entalhado em madeira.
 * Tudo em SVG, para ficar nítido em qualquer tela e não pesar na página.
 */

import { ARESTAS, PONTOS } from "@/components/school/jogos/onca-motor";

export type TemaOnca = "madeira" | "rio" | "pedra" | "noite";
export type SkinOnca = "pintada" | "negra" | "dourada" | "guardia";
export type SkinCao = "pug" | "caramelo" | "azul" | "raposa";

/** Espaço entre pontos e margem do desenho, em unidades do SVG. */
export const ESCALA = 64;
export const MARGEM = 58;
export const LARGURA = 4 * ESCALA + MARGEM * 2;
export const ALTURA = 6 * ESCALA + MARGEM * 2;

export const px = (x: number) => MARGEM + x * ESCALA;
export const py = (y: number) => MARGEM + y * ESCALA;

/** Círculo com borda recortada em ondas, como nas peças do jogo de papel. */
function ondas(r: number, n = 12, amp = 0.09): string {
  const pts: string[] = [];
  const passos = n * 8;
  for (let i = 0; i <= passos; i++) {
    const a = (i / passos) * Math.PI * 2;
    const rr = r * (1 + amp * Math.cos(a * n));
    pts.push(`${(Math.cos(a) * rr).toFixed(2)},${(Math.sin(a) * rr).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}

const ONDAS_CAO = ondas(25);
const ONDAS_ONCA = ondas(28, 14, 0.08);

/** O cachorro (pug) da peça — desenhado em (0,0), raio ~25. */
export function PecaCao({
  id,
  brilho,
  skin = "pug",
}: {
  id: number;
  brilho?: boolean;
  skin?: SkinCao;
}) {
  const g = `cao-${id}`;
  const paleta = {
    pug: ["#c9675e", "#a6443f", "#fbdcc0", "#efb98f"],
    caramelo: ["#f59e0b", "#b45309", "#ffedd5", "#fdba74"],
    azul: ["#38bdf8", "#0369a1", "#e0f2fe", "#7dd3fc"],
    raposa: ["#fb7185", "#be123c", "#fff1f2", "#fda4af"],
  }[skin];
  return (
    <g>
      <defs>
        <radialGradient id={`${g}-f`} cx="40%" cy="30%" r="80%">
          <stop offset="0" stopColor={paleta[0]} />
          <stop offset="1" stopColor={paleta[1]} />
        </radialGradient>
        <radialGradient id={`${g}-r`} cx="50%" cy="40%" r="70%">
          <stop offset="0" stopColor={paleta[2]} />
          <stop offset="1" stopColor={paleta[3]} />
        </radialGradient>
      </defs>
      <path d={ONDAS_CAO} fill="rgba(0,0,0,0.28)" transform="translate(1.5 3)" />
      <path d={ONDAS_CAO} fill={`url(#${g}-f)`} stroke="#7d3630" strokeWidth={1.2} />
      {/* orelhas */}
      <path d="M-17 -12 C-24 -14 -24 -2 -15 0 C-12 -4 -13 -9 -17 -12Z" fill="#6b4a38" />
      <path d="M17 -12 C24 -14 24 -2 15 0 C12 -4 13 -9 17 -12Z" fill="#6b4a38" />
      {/* rosto */}
      <ellipse cx="0" cy="-1" rx="16" ry="14.5" fill={`url(#${g}-r)`} />
      {/* focinho */}
      <ellipse cx="0" cy="6" rx="9.5" ry="7.4" fill="#7a4a30" />
      <ellipse cx="0" cy="2.4" rx="3.4" ry="2.4" fill="#2b1810" />
      <path
        d="M0 4.6 V7.4 M-3 8.6 Q0 10.6 3 8.6"
        stroke="#2b1810"
        strokeWidth={1.1}
        fill="none"
        strokeLinecap="round"
      />
      {/* rugas */}
      <path
        d="M-5 -9 Q0 -11.5 5 -9"
        stroke="#d99a70"
        strokeWidth={1.1}
        fill="none"
        strokeLinecap="round"
      />
      {/* olhos */}
      <circle cx="-7" cy="-3.4" r="3.6" fill="#fff" />
      <circle cx="7" cy="-3.4" r="3.6" fill="#fff" />
      <circle cx="-6.6" cy="-3.2" r="2.2" fill="#2b1810" />
      <circle cx="6.6" cy="-3.2" r="2.2" fill="#2b1810" />
      <circle cx="-6" cy="-4" r="0.8" fill="#fff" />
      <circle cx="7.2" cy="-4" r="0.8" fill="#fff" />
      {/* coleira */}
      <path
        d="M-12 12 Q0 17 12 12"
        stroke="#e3c37a"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      {brilho && <path d={ONDAS_CAO} fill="none" stroke="#fde68a" strokeWidth={2.4} />}
    </g>
  );
}

/** A onça-pintada da peça — desenhada em (0,0), raio ~28. */
export function PecaOnca({ brilho, skin = "pintada" }: { brilho?: boolean; skin?: SkinOnca }) {
  const paleta = {
    pintada: ["#ecd08a", "#cfa24a", "#e8b25e", "#cf8a3a", "#1b1410"],
    negra: ["#475569", "#0f172a", "#334155", "#020617", "#f8fafc"],
    dourada: ["#fef08a", "#eab308", "#fde047", "#ca8a04", "#713f12"],
    guardia: ["#99f6e4", "#0f766e", "#5eead4", "#115e59", "#042f2e"],
  }[skin];
  const pintas: [number, number, number][] = [
    [-11, -13, 2.2],
    [-5, -16, 1.8],
    [4, -16, 1.8],
    [11, -13, 2.2],
    [-16, -3, 2],
    [16, -3, 2],
    [-13, 6, 1.8],
    [13, 6, 1.8],
  ];
  return (
    <g>
      <defs>
        <radialGradient id="onca-f" cx="40%" cy="30%" r="80%">
          <stop offset="0" stopColor={paleta[0]} />
          <stop offset="1" stopColor={paleta[1]} />
        </radialGradient>
        <radialGradient id="onca-r" cx="50%" cy="35%" r="75%">
          <stop offset="0" stopColor={paleta[2]} />
          <stop offset="1" stopColor={paleta[3]} />
        </radialGradient>
      </defs>
      <path d={ONDAS_ONCA} fill="rgba(0,0,0,0.3)" transform="translate(1.5 3)" />
      <path d={ONDAS_ONCA} fill="url(#onca-f)" stroke="#8f6a2a" strokeWidth={1.2} />
      {/* orelhas */}
      <path
        d="M-19 -13 L-22 -25 L-9 -19Z"
        fill="#cf8a3a"
        stroke="#2f4a5a"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <path
        d="M19 -13 L22 -25 L9 -19Z"
        fill="#cf8a3a"
        stroke="#2f4a5a"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <path d="M-17 -15 L-19 -21 L-12 -18Z" fill="#5fa39f" />
      <path d="M17 -15 L19 -21 L12 -18Z" fill="#5fa39f" />
      {/* cabeça */}
      <path
        d="M-19 -8 C-21 4 -14 15 0 19 C14 15 21 4 19 -8 C14 -18 -14 -18 -19 -8Z"
        fill="url(#onca-r)"
        stroke="#2f4a5a"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      {pintas.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={paleta[4]} />
      ))}
      {/* faixa clara do focinho */}
      <path d="M-9 4 Q0 -2 9 4 Q7 15 0 17 Q-7 15 -9 4Z" fill="#fff0c9" />
      {/* riscos de lágrima */}
      <path d="M-9 -2 L-8 5 M9 -2 L8 5" stroke="#1b1410" strokeWidth={1.6} strokeLinecap="round" />
      {/* olhos */}
      <path
        d="M-12 -4 Q-8 -8 -4 -4 Q-8 -1 -12 -4Z"
        fill="#dff7e4"
        stroke="#1b1410"
        strokeWidth={1.2}
      />
      <path d="M12 -4 Q8 -8 4 -4 Q8 -1 12 -4Z" fill="#dff7e4" stroke="#1b1410" strokeWidth={1.2} />
      <circle cx="-8" cy="-4.2" r="1.9" fill="#2a7a45" />
      <circle cx="8" cy="-4.2" r="1.9" fill="#2a7a45" />
      <circle cx="-8" cy="-4.2" r="0.9" fill="#111" />
      <circle cx="8" cy="-4.2" r="0.9" fill="#111" />
      {/* nariz e boca */}
      <path
        d="M-3.6 6 H3.6 L0 10Z"
        fill="#d9587a"
        stroke="#1b1410"
        strokeWidth={0.9}
        strokeLinejoin="round"
      />
      <path
        d="M0 10 V13 M-5 14 Q0 17 5 14"
        stroke="#1b1410"
        strokeWidth={1.2}
        fill="none"
        strokeLinecap="round"
      />
      {brilho && <path d={ONDAS_ONCA} fill="none" stroke="#fef3c7" strokeWidth={2.6} />}
    </g>
  );
}

/** Peça pequena (para os contadores), sem sombra. */
export function CaoMini({ tam = 22 }: { tam?: number }) {
  return (
    <svg viewBox="-28 -28 56 56" width={tam} height={tam} aria-hidden>
      <PecaCao id={900 + tam} />
    </svg>
  );
}

export function OncaMini({ tam = 26 }: { tam?: number }) {
  return (
    <svg viewBox="-31 -31 62 62" width={tam} height={tam} aria-hidden>
      <PecaOnca />
    </svg>
  );
}

/** Faixa de penas coloridas (a mesma dos cartazes do jogo). */
export function FaixaPenas({
  invertida = false,
  className,
}: {
  invertida?: boolean;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 40"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="34"
      aria-hidden
    >
      <defs>
        <g id="pena-a">
          <path d="M0 0 H26 V26 L13 40 L0 26Z" fill="#d98a6c" />
          <path d="M13 0 V40" stroke="#5a3a2e" strokeWidth={1.4} />
          <path
            d="M13 12 L0 4 M13 12 L26 4 M13 24 L2 17 M13 24 L24 17"
            stroke="#5a3a2e"
            strokeWidth={1.2}
            fill="none"
          />
          <path d="M0 28 L13 40 L26 28" stroke="#7fb0ac" strokeWidth={3} fill="none" />
        </g>
        <g id="pena-b">
          <path d="M0 0 H26 V26 L13 40 L0 26Z" fill="#e3c37a" />
          <path d="M13 0 V40" stroke="#5a3a2e" strokeWidth={1.4} />
          <path
            d="M13 12 L0 4 M13 12 L26 4 M13 24 L2 17 M13 24 L24 17"
            stroke="#5a3a2e"
            strokeWidth={1.2}
            fill="none"
          />
          <path d="M0 28 L13 40 L26 28" stroke="#7fb0ac" strokeWidth={3} fill="none" />
        </g>
      </defs>
      <g transform={invertida ? "translate(0 40) scale(1 -1)" : undefined}>
        {Array.from({ length: 8 }, (_, i) => (
          <g key={i}>
            <use href="#pena-a" x={i * 60} y={0} />
            <use href="#pena-b" x={i * 60 + 30} y={0} />
          </g>
        ))}
      </g>
    </svg>
  );
}

/** A madeira do tabuleiro, com o triângulo (a armadilha) e as linhas entalhadas. */
export function Madeira({
  dica,
  tema = "madeira",
}: {
  dica?: { a: number; b: number } | null;
  tema?: TemaOnca;
}) {
  const cores = {
    madeira: ["#f6e2c4", "#efd3aa", "#e6c294", "#a97a45", "#5a341d"],
    rio: ["#cffafe", "#67e8f9", "#0891b2", "#155e75", "#164e63"],
    pedra: ["#e2e8f0", "#94a3b8", "#64748b", "#475569", "#1e293b"],
    noite: ["#312e81", "#1e1b4b", "#0f172a", "#8b5cf6", "#c4b5fd"],
  }[tema];
  return (
    <g>
      <defs>
        <linearGradient id="madeira" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={cores[0]} />
          <stop offset="0.5" stopColor={cores[1]} />
          <stop offset="1" stopColor={cores[2]} />
        </linearGradient>
        <pattern id="veios" width="90" height="14" patternUnits="userSpaceOnUse">
          <path
            d="M0 4 Q22 0 45 4 T90 4 M0 11 Q22 8 45 11 T90 11"
            stroke="#b98d57"
            strokeOpacity={0.16}
            strokeWidth={1}
            fill="none"
          />
        </pattern>
        <filter id="sombra-tab" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#3b1a10" floodOpacity="0.4" />
        </filter>
        <radialGradient id="furo" cx="50%" cy="40%" r="60%">
          <stop offset="0" stopColor="#7a4d2a" />
          <stop offset="1" stopColor="#a87446" />
        </radialGradient>
      </defs>
      <g filter="url(#sombra-tab)">
        <rect
          x={px(0) - 34}
          y={py(0) - 34}
          width={4 * ESCALA + 68}
          height={4 * ESCALA + 68}
          rx={16}
          fill="url(#madeira)"
          stroke={cores[3]}
          strokeWidth={2}
        />
        <path
          d={`M${px(2)} ${py(4) - 6} L${px(4) + 34} ${py(6) + 34} Q${px(4) + 34} ${py(6) + 40} ${px(4) + 26} ${py(6) + 40} H${px(0) - 26} Q${px(0) - 34} ${py(6) + 40} ${px(0) - 34} ${py(6) + 34}Z`}
          fill="url(#madeira)"
          stroke={cores[3]}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </g>
      <rect
        x={px(0) - 34}
        y={py(0) - 34}
        width={4 * ESCALA + 68}
        height={4 * ESCALA + 68}
        rx={16}
        fill="url(#veios)"
      />
      <path
        d={`M${px(2)} ${py(4) - 6} L${px(4) + 34} ${py(6) + 34} Q${px(4) + 34} ${py(6) + 40} ${px(4) + 26} ${py(6) + 40} H${px(0) - 26} Q${px(0) - 34} ${py(6) + 40} ${px(0) - 34} ${py(6) + 34}Z`}
        fill="url(#veios)"
      />
      {/* linhas: sulco escuro + brilho, como entalhado */}
      {ARESTAS.map(([a, b]) => {
        const A = PONTOS[a]!;
        const B = PONTOS[b]!;
        return (
          <g key={`${a}-${b}`}>
            <line
              x1={px(A.x)}
              y1={py(A.y) + 1.4}
              x2={px(B.x)}
              y2={py(B.y) + 1.4}
              stroke="#fff6e4"
              strokeOpacity={0.7}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <line
              x1={px(A.x)}
              y1={py(A.y)}
              x2={px(B.x)}
              y2={py(B.y)}
              stroke={cores[4]}
              strokeWidth={3}
              strokeLinecap="round"
            />
          </g>
        );
      })}
      {dica && (
        <line
          x1={px(PONTOS[dica.a]!.x)}
          y1={py(PONTOS[dica.a]!.y)}
          x2={px(PONTOS[dica.b]!.x)}
          y2={py(PONTOS[dica.b]!.y)}
          stroke="#22c55e"
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray="2 9"
          opacity={0.9}
        />
      )}
      {/* furos */}
      {PONTOS.map((p, i) => (
        <g key={i}>
          <circle cx={px(p.x)} cy={py(p.y) + 1.2} r={13} fill="#fff6e4" opacity={0.6} />
          <circle
            cx={px(p.x)}
            cy={py(p.y)}
            r={12.5}
            fill="url(#furo)"
            stroke="#4a2b16"
            strokeWidth={1.6}
          />
        </g>
      ))}
    </g>
  );
}
