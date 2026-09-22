import type { ReactNode } from "react";

/**
 * O banco de figuras da alfabetização: 48 desenhos simples, coloridos e
 * grandes, cada um ligado a uma palavra.
 *
 * São desenhos de traço grosso e cor cheia de propósito. Criança em
 * alfabetização — e principalmente criança com deficiência visual parcial ou
 * dificuldade de atenção — reconhece uma silhueta forte muito antes de
 * reconhecer um desenho detalhado. Nada de sombra, gradiente ou textura:
 * forma clara, cor viva, fundo limpo.
 *
 * Todos moram na caixa 0 0 100 100, então qualquer um pode ser mostrado do
 * tamanho que o jogo precisar sem cortar nem distorcer.
 */

export const DESENHOS: Record<string, ReactNode> = {
  /* ------------------------------- frutas ------------------------------ */
  abacaxi: (
    <>
      <path
        d="M50 22 L38 6 M50 22 L62 6 M50 22 L50 2"
        stroke="#15803d"
        strokeWidth={7}
        strokeLinecap="round"
      />
      <ellipse cx={50} cy={60} rx={26} ry={34} fill="#f0b429" />
      <path
        d="M30 42 L70 62 M30 56 L70 76 M30 70 L70 90 M70 42 L30 62 M70 56 L30 76 M70 70 L30 90"
        stroke="#b7791f"
        strokeWidth={2.5}
        opacity={0.8}
      />
    </>
  ),
  banana: (
    <>
      <path
        d="M22 30 q6 48 50 52 q10 -4 8 -12 q-38 -6 -44 -44 z"
        fill="#f7d13d"
        stroke="#c9a227"
        strokeWidth={2.5}
      />
      <path d="M20 26 h10 v8 h-10 z" fill="#6b7280" />
    </>
  ),
  laranja: (
    <>
      <circle cx={50} cy={55} r={32} fill="#f97316" />
      <circle cx={50} cy={55} r={32} fill="none" stroke="#c2410c" strokeWidth={2.5} />
      <path d="M50 26 q-8 -10 -18 -10 q6 10 18 12" fill="#16a34a" />
      <circle cx={40} cy={45} r={3} fill="#fb923c" />
    </>
  ),
  maca: (
    <>
      <path d="M50 30 q-26 -6 -26 24 q0 30 26 40 q26 -10 26 -40 q0 -30 -26 -24 z" fill="#dc2626" />
      <path d="M50 30 v-12" stroke="#78350f" strokeWidth={5} strokeLinecap="round" />
      <path d="M50 22 q12 -10 20 -4 q-8 10 -20 6" fill="#16a34a" />
    </>
  ),
  uva: (
    <>
      {[
        [50, 34],
        [38, 48],
        [62, 48],
        [30, 62],
        [50, 60],
        [70, 62],
        [40, 76],
        [60, 76],
        [50, 88],
      ].map(([x, y]) => (
        <circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r={11}
          fill="#7e22ce"
          stroke="#581c87"
          strokeWidth={1.5}
        />
      ))}
      <path
        d="M50 24 q10 -12 22 -10"
        stroke="#15803d"
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),
  melancia: (
    <>
      <path d="M8 74 A46 46 0 0 1 92 74 z" fill="#dc2626" />
      <path d="M8 74 A46 46 0 0 1 92 74" fill="none" stroke="#15803d" strokeWidth={9} />
      {[28, 44, 60, 72].map((x, i) => (
        <circle key={x} cx={x} cy={60 - (i % 2) * 8} r={3} fill="#1c1917" />
      ))}
    </>
  ),
  jaca: (
    <>
      <ellipse cx={50} cy={58} rx={28} ry={34} fill="#a3a635" />
      {[0, 1, 2, 3].map((l) =>
        [0, 1, 2, 3].map((c) => (
          <circle key={`${l}-${c}`} cx={32 + c * 12} cy={34 + l * 16} r={4} fill="#6b7017" />
        )),
      )}
      <path d="M50 24 v-12" stroke="#78350f" strokeWidth={5} strokeLinecap="round" />
    </>
  ),
  kiwi: (
    <>
      <circle cx={50} cy={52} r={32} fill="#7c5a2a" />
      <circle cx={50} cy={52} r={26} fill="#84cc16" />
      <circle cx={50} cy={52} r={9} fill="#f7fee7" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return (
          <ellipse
            key={i}
            cx={50 + 17 * Math.cos(a)}
            cy={52 + 17 * Math.sin(a)}
            rx={2}
            ry={3.5}
            fill="#1c1917"
          />
        );
      })}
    </>
  ),

  /* ------------------------------ animais ------------------------------ */
  abelha: (
    <>
      <ellipse cx={50} cy={58} rx={24} ry={18} fill="#facc15" />
      <path d="M40 42 v32 M52 41 v34" stroke="#1c1917" strokeWidth={7} />
      <ellipse
        cx={34}
        cy={40}
        rx={14}
        ry={9}
        fill="#e0f2fe"
        opacity={0.85}
        transform="rotate(-25 34 40)"
      />
      <ellipse
        cx={62}
        cy={38}
        rx={14}
        ry={9}
        fill="#e0f2fe"
        opacity={0.85}
        transform="rotate(20 62 38)"
      />
      <circle cx={74} cy={54} r={9} fill="#1c1917" />
      <circle cx={77} cy={51} r={2.5} fill="#fff" />
    </>
  ),
  borboleta: (
    <>
      <ellipse cx={30} cy={40} rx={19} ry={16} fill="#ec4899" />
      <ellipse cx={70} cy={40} rx={19} ry={16} fill="#ec4899" />
      <ellipse cx={33} cy={68} rx={15} ry={13} fill="#f472b6" />
      <ellipse cx={67} cy={68} rx={15} ry={13} fill="#f472b6" />
      <rect x={46} y={30} width={8} height={52} rx={4} fill="#4c1d95" />
      <path
        d="M48 30 q-8 -14 -16 -16 M52 30 q8 -14 16 -16"
        stroke="#4c1d95"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),
  cachorro: (
    <>
      <ellipse cx={50} cy={58} rx={28} ry={26} fill="#b45309" />
      <ellipse cx={24} cy={42} rx={10} ry={18} fill="#78350f" transform="rotate(-18 24 42)" />
      <ellipse cx={76} cy={42} rx={10} ry={18} fill="#78350f" transform="rotate(18 76 42)" />
      <circle cx={40} cy={54} r={4.5} fill="#1c1917" />
      <circle cx={60} cy={54} r={4.5} fill="#1c1917" />
      <ellipse cx={50} cy={68} rx={8} ry={6} fill="#1c1917" />
      <path
        d="M50 74 v8 M42 82 q8 6 16 0"
        stroke="#1c1917"
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),
  gato: (
    <>
      <path d="M26 40 L22 16 L42 30 z" fill="#6b7280" />
      <path d="M74 40 L78 16 L58 30 z" fill="#6b7280" />
      <ellipse cx={50} cy={58} rx={28} ry={25} fill="#9ca3af" />
      <ellipse cx={40} cy={52} rx={5} ry={7} fill="#16a34a" />
      <ellipse cx={60} cy={52} rx={5} ry={7} fill="#16a34a" />
      <path d="M50 62 l-5 5 h10 z" fill="#f472b6" />
      <path d="M18 60 h16 M18 68 h16 M66 60 h16 M66 68 h16" stroke="#1c1917" strokeWidth={2} />
    </>
  ),
  elefante: (
    <>
      <ellipse cx={54} cy={56} rx={30} ry={26} fill="#94a3b8" />
      <ellipse cx={24} cy={52} rx={16} ry={20} fill="#cbd5e1" />
      <path
        d="M52 76 q-6 18 8 18 q10 0 8 -10"
        stroke="#94a3b8"
        strokeWidth={11}
        fill="none"
        strokeLinecap="round"
      />
      <circle cx={46} cy={50} r={4} fill="#1c1917" />
      <rect x={38} y={80} width={10} height={14} rx={4} fill="#94a3b8" />
      <rect x={62} y={80} width={10} height={14} rx={4} fill="#94a3b8" />
    </>
  ),
  galinha: (
    <>
      <ellipse cx={52} cy={62} rx={26} ry={22} fill="#fef3c7" stroke="#d97706" strokeWidth={2} />
      <circle cx={70} cy={40} r={14} fill="#fef3c7" stroke="#d97706" strokeWidth={2} />
      <path d="M62 28 q4 -10 10 -4 q6 -8 10 2" fill="#dc2626" />
      <path d="M82 42 l10 4 l-10 4 z" fill="#f59e0b" />
      <circle cx={74} cy={38} r={2.5} fill="#1c1917" />
      <path d="M44 84 v8 M60 84 v8" stroke="#f59e0b" strokeWidth={4} strokeLinecap="round" />
    </>
  ),
  jacare: (
    <>
      <ellipse cx={50} cy={60} rx={36} ry={14} fill="#15803d" />
      <path d="M14 58 q-10 2 -10 6 q10 4 10 2" fill="#15803d" />
      <path d="M86 52 q12 -4 12 4 q0 8 -12 6" fill="#166534" />
      <path d="M24 48 l6 -8 l6 8 M40 46 l6 -8 l6 8 M56 46 l6 -8 l6 8" fill="#166534" />
      <circle cx={80} cy={50} r={3} fill="#1c1917" />
      <path d="M70 62 h24" stroke="#fff" strokeWidth={2} />
    </>
  ),
  leao: (
    <>
      <circle cx={50} cy={54} r={34} fill="#d97706" />
      <circle cx={50} cy={54} r={24} fill="#fbbf24" />
      <circle cx={41} cy={49} r={4} fill="#1c1917" />
      <circle cx={59} cy={49} r={4} fill="#1c1917" />
      <path d="M50 58 l-5 5 h10 z" fill="#7c2d12" />
      <path
        d="M50 63 v6 M40 70 q10 8 20 0"
        stroke="#7c2d12"
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
      />
      <path d="M28 60 h12 M28 66 h12 M60 60 h12 M60 66 h12" stroke="#7c2d12" strokeWidth={1.8} />
    </>
  ),
  macaco: (
    <>
      <circle cx={50} cy={56} r={30} fill="#92400e" />
      <circle cx={20} cy={46} r={11} fill="#92400e" />
      <circle cx={80} cy={46} r={11} fill="#92400e" />
      <ellipse cx={50} cy={62} rx={20} ry={17} fill="#fcd9a4" />
      <circle cx={42} cy={48} r={4} fill="#1c1917" />
      <circle cx={58} cy={48} r={4} fill="#1c1917" />
      <ellipse cx={50} cy={60} rx={5} ry={3.5} fill="#7c2d12" />
      <path
        d="M42 70 q8 7 16 0"
        stroke="#7c2d12"
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),
  onca: (
    <>
      <circle cx={50} cy={56} r={31} fill="#f59e0b" />
      <circle cx={28} cy={30} r={9} fill="#f59e0b" />
      <circle cx={72} cy={30} r={9} fill="#f59e0b" />
      {[
        [32, 44],
        [68, 44],
        [30, 66],
        [70, 66],
        [50, 78],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={5} fill="#1c1917" opacity={0.75} />
      ))}
      <circle cx={41} cy={50} r={4} fill="#1c1917" />
      <circle cx={59} cy={50} r={4} fill="#1c1917" />
      <path d="M50 60 l-5 5 h10 z" fill="#7c2d12" />
    </>
  ),
  pato: (
    <>
      <ellipse cx={46} cy={66} rx={28} ry={20} fill="#fde047" />
      <circle cx={70} cy={42} r={15} fill="#fde047" />
      <path d="M83 42 q12 0 12 5 q0 5 -12 4 z" fill="#f97316" />
      <circle cx={73} cy={38} r={3} fill="#1c1917" />
      <path d="M30 78 q-8 10 4 12" stroke="#f97316" strokeWidth={4} fill="none" />
    </>
  ),
  peixe: (
    <>
      <ellipse cx={46} cy={54} rx={32} ry={20} fill="#0ea5e9" />
      <path d="M78 54 l18 -14 v28 z" fill="#0284c7" />
      <circle cx={28} cy={48} r={4.5} fill="#fff" />
      <circle cx={27} cy={48} r={2.5} fill="#1c1917" />
      <path d="M50 38 q8 6 0 12" stroke="#0284c7" strokeWidth={3} fill="none" />
      <path d="M46 68 q8 8 16 4" stroke="#0284c7" strokeWidth={3} fill="none" />
    </>
  ),
  rato: (
    <>
      <ellipse cx={52} cy={62} rx={26} ry={19} fill="#9ca3af" />
      <circle cx={28} cy={40} r={12} fill="#d1d5db" />
      <circle cx={74} cy={40} r={12} fill="#d1d5db" />
      <circle cx={50} cy={48} r={17} fill="#9ca3af" />
      <circle cx={44} cy={45} r={3} fill="#1c1917" />
      <circle cx={56} cy={45} r={3} fill="#1c1917" />
      <circle cx={50} cy={54} r={3.5} fill="#f472b6" />
      <path
        d="M78 68 q16 4 14 18"
        stroke="#9ca3af"
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),
  sapo: (
    <>
      <ellipse cx={50} cy={62} rx={32} ry={24} fill="#16a34a" />
      <circle cx={34} cy={36} r={12} fill="#22c55e" />
      <circle cx={66} cy={36} r={12} fill="#22c55e" />
      <circle cx={34} cy={36} r={5} fill="#1c1917" />
      <circle cx={66} cy={36} r={5} fill="#1c1917" />
      <path
        d="M36 66 q14 12 28 0"
        stroke="#14532d"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M22 80 q-8 8 2 10 M78 80 q8 8 -2 10"
        stroke="#16a34a"
        strokeWidth={7}
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),
  tatu: (
    <>
      <path d="M18 66 q4 -30 34 -30 q30 0 30 30 z" fill="#a8a29e" />
      <path d="M32 40 v26 M46 36 v30 M60 36 v30 M72 42 v24" stroke="#78716c" strokeWidth={3} />
      <circle cx={88} cy={58} r={10} fill="#a8a29e" />
      <circle cx={91} cy={55} r={2.5} fill="#1c1917" />
      <path d="M14 66 q-8 6 -2 12" stroke="#a8a29e" strokeWidth={5} fill="none" />
      <rect x={18} y={66} width={66} height={6} rx={3} fill="#78716c" />
    </>
  ),
  urso: (
    <>
      <circle cx={28} cy={30} r={12} fill="#78350f" />
      <circle cx={72} cy={30} r={12} fill="#78350f" />
      <circle cx={50} cy={56} r={31} fill="#92400e" />
      <ellipse cx={50} cy={66} rx={16} ry={12} fill="#d6ad7a" />
      <circle cx={40} cy={48} r={4} fill="#1c1917" />
      <circle cx={60} cy={48} r={4} fill="#1c1917" />
      <ellipse cx={50} cy={62} rx={6} ry={4} fill="#1c1917" />
    </>
  ),
  vaca: (
    <>
      <ellipse cx={50} cy={58} rx={30} ry={26} fill="#f5f5f4" stroke="#57534e" strokeWidth={2} />
      <path d="M28 40 q-12 -8 -14 4 q10 6 16 2" fill="#f5f5f4" stroke="#57534e" strokeWidth={2} />
      <path d="M72 40 q12 -8 14 4 q-10 6 -16 2" fill="#f5f5f4" stroke="#57534e" strokeWidth={2} />
      <ellipse cx={36} cy={46} rx={9} ry={7} fill="#1c1917" />
      <ellipse cx={66} cy={64} rx={11} ry={8} fill="#1c1917" />
      <ellipse cx={50} cy={72} rx={15} ry={11} fill="#f9a8d4" />
      <circle cx={45} cy={70} r={2.5} fill="#be185d" />
      <circle cx={55} cy={70} r={2.5} fill="#be185d" />
      <circle cx={42} cy={50} r={3} fill="#1c1917" />
    </>
  ),
  zebra: (
    <>
      <ellipse cx={50} cy={58} rx={29} ry={26} fill="#f5f5f4" />
      <path
        d="M32 36 q6 22 0 44 M46 32 q6 26 0 50 M60 32 q6 26 0 50 M72 40 q5 18 0 36"
        stroke="#1c1917"
        strokeWidth={6}
        fill="none"
      />
      <circle cx={40} cy={48} r={4} fill="#1c1917" />
      <path d="M28 30 l4 -12 l8 10 M72 30 l-4 -12 l-8 10" fill="#1c1917" />
    </>
  ),
  hipopotamo: (
    <>
      <ellipse cx={52} cy={62} rx={32} ry={22} fill="#a78bfa" />
      <ellipse cx={30} cy={70} rx={18} ry={14} fill="#c4b5fd" />
      <circle cx={22} cy={66} r={3} fill="#4c1d95" />
      <circle cx={36} cy={66} r={3} fill="#4c1d95" />
      <circle cx={44} cy={48} r={4} fill="#1c1917" />
      <circle cx={64} cy={46} r={4} fill="#1c1917" />
      <circle cx={44} cy={44} r={7} fill="#c4b5fd" />
      <circle cx={64} cy={42} r={7} fill="#c4b5fd" />
    </>
  ),

  /* ------------------------------ objetos ------------------------------ */
  bola: (
    <>
      <circle cx={50} cy={52} r={34} fill="#f8fafc" stroke="#1c1917" strokeWidth={2.5} />
      <path d="M50 30 l16 12 -6 20 h-20 l-6 -20 z" fill="#1c1917" />
      <path
        d="M50 18 v12 M22 42 l14 8 M78 42 l-14 8 M36 82 l4 -18 M64 82 l-4 -18"
        stroke="#1c1917"
        strokeWidth={2.5}
      />
    </>
  ),
  casa: (
    <>
      <path d="M50 14 L92 50 H8 z" fill="#dc2626" />
      <rect x={20} y={50} width={60} height={38} fill="#fcd34d" />
      <rect x={42} y={62} width={17} height={26} rx={2} fill="#78350f" />
      <circle cx={55} cy={76} r={2} fill="#fde68a" />
      <rect
        x={24}
        y={58}
        width={13}
        height={13}
        rx={2}
        fill="#38bdf8"
        stroke="#1e3a8a"
        strokeWidth={2}
      />
      <rect
        x={64}
        y={58}
        width={13}
        height={13}
        rx={2}
        fill="#38bdf8"
        stroke="#1e3a8a"
        strokeWidth={2}
      />
    </>
  ),
  dado: (
    <>
      <rect
        x={20}
        y={20}
        width={60}
        height={60}
        rx={10}
        fill="#f8fafc"
        stroke="#1c1917"
        strokeWidth={3}
      />
      {[
        [36, 36],
        [64, 36],
        [50, 50],
        [36, 64],
        [64, 64],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={6} fill="#dc2626" />
      ))}
    </>
  ),
  faca: (
    <>
      <path
        d="M14 34 q30 -8 44 8 l-6 8 q-20 -12 -38 -8 z"
        fill="#cbd5e1"
        stroke="#64748b"
        strokeWidth={2}
      />
      <rect
        x={56}
        y={44}
        width={34}
        height={11}
        rx={5}
        transform="rotate(12 56 44)"
        fill="#78350f"
      />
    </>
  ),
  flor: (
    <>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse
          key={a}
          cx={50}
          cy={30}
          rx={11}
          ry={17}
          fill="#f472b6"
          transform={`rotate(${a} 50 48)`}
        />
      ))}
      <circle cx={50} cy={48} r={10} fill="#facc15" />
      <path d="M50 58 v34" stroke="#15803d" strokeWidth={5} strokeLinecap="round" />
      <path d="M50 72 q14 -8 18 2 q-12 6 -18 -2" fill="#16a34a" />
    </>
  ),
  janela: (
    <>
      <rect
        x={18}
        y={18}
        width={64}
        height={64}
        rx={4}
        fill="#93c5fd"
        stroke="#78350f"
        strokeWidth={6}
      />
      <path d="M50 18 v64 M18 50 h64" stroke="#78350f" strokeWidth={6} />
      <path d="M26 40 l10 -10 M60 74 l14 -14" stroke="#fff" strokeWidth={4} opacity={0.6} />
    </>
  ),
  lapis: (
    <>
      <rect x={30} y={18} width={22} height={54} transform="rotate(20 41 45)" fill="#f59e0b" />
      <path d="M58 76 l10 18 l-19 -6 z" fill="#fcd9a4" />
      <path d="M62 86 l6 8 l-9 -3 z" fill="#1c1917" />
      <rect x={22} y={10} width={22} height={9} transform="rotate(20 33 14)" fill="#f472b6" />
    </>
  ),
  livro: (
    <>
      <path d="M12 26 q20 -8 38 0 v52 q-18 -8 -38 0 z" fill="#2563eb" />
      <path d="M88 26 q-20 -8 -38 0 v52 q18 -8 38 0 z" fill="#3b82f6" />
      <path d="M50 26 v52" stroke="#1e3a8a" strokeWidth={3} />
      <path d="M22 40 h20 M22 50 h20 M58 40 h20 M58 50 h20" stroke="#dbeafe" strokeWidth={2.5} />
    </>
  ),
  mesa: (
    <>
      <rect x={10} y={36} width={80} height={10} rx={3} fill="#b45309" />
      <rect x={18} y={46} width={9} height={42} fill="#92400e" />
      <rect x={73} y={46} width={9} height={42} fill="#92400e" />
      <rect
        x={40}
        y={20}
        width={20}
        height={16}
        rx={2}
        fill="#f8fafc"
        stroke="#94a3b8"
        strokeWidth={2}
      />
    </>
  ),
  mochila: (
    <>
      <rect x={24} y={30} width={52} height={58} rx={12} fill="#7c3aed" />
      <path d="M36 32 q14 -18 28 0" fill="none" stroke="#5b21b6" strokeWidth={6} />
      <rect x={34} y={56} width={32} height={22} rx={5} fill="#a78bfa" />
      <rect x={44} y={62} width={12} height={5} rx={2} fill="#4c1d95" />
    </>
  ),
  oculos: (
    <>
      <circle cx={30} cy={52} r={18} fill="#e0f2fe" stroke="#1c1917" strokeWidth={4} />
      <circle cx={70} cy={52} r={18} fill="#e0f2fe" stroke="#1c1917" strokeWidth={4} />
      <path d="M48 52 h4" stroke="#1c1917" strokeWidth={4} />
      <path d="M12 46 l-8 -6 M88 46 l8 -6" stroke="#1c1917" strokeWidth={4} strokeLinecap="round" />
    </>
  ),
  ovo: (
    <>
      <ellipse cx={50} cy={56} rx={26} ry={34} fill="#fffbeb" stroke="#d6d3d1" strokeWidth={2.5} />
      <ellipse cx={42} cy={44} rx={7} ry={10} fill="#fef3c7" />
    </>
  ),
  panela: (
    <>
      <rect x={20} y={40} width={60} height={38} rx={6} fill="#64748b" />
      <rect x={14} y={34} width={72} height={10} rx={5} fill="#94a3b8" />
      <rect x={4} y={36} width={14} height={7} rx={3} fill="#1c1917" />
      <rect x={82} y={36} width={14} height={7} rx={3} fill="#1c1917" />
      <circle cx={50} cy={28} r={5} fill="#1c1917" />
    </>
  ),
  queijo: (
    <>
      <path d="M12 68 L50 30 h38 v38 z" fill="#facc15" stroke="#ca8a04" strokeWidth={2.5} />
      <path d="M12 68 h76 v10 H12 z" fill="#eab308" />
      <circle cx={62} cy={48} r={6} fill="#fef9c3" />
      <circle cx={78} cy={58} r={4} fill="#fef9c3" />
      <circle cx={46} cy={56} r={3.5} fill="#fef9c3" />
    </>
  ),
  relogio: (
    <>
      <circle cx={50} cy={52} r={34} fill="#f8fafc" stroke="#1c1917" strokeWidth={5} />
      <path d="M50 52 v-18 M50 52 l14 8" stroke="#1c1917" strokeWidth={4} strokeLinecap="round" />
      <circle cx={50} cy={52} r={4} fill="#dc2626" />
      {[0, 90, 180, 270].map((a) => (
        <rect
          key={a}
          x={49}
          y={20}
          width={2.5}
          height={7}
          fill="#1c1917"
          transform={`rotate(${a} 50 52)`}
        />
      ))}
    </>
  ),
  xicara: (
    <>
      <path
        d="M22 38 h46 v26 a23 23 0 0 1 -46 0 z"
        fill="#f8fafc"
        stroke="#64748b"
        strokeWidth={2.5}
      />
      <path d="M68 44 q16 0 16 10 q0 10 -16 10" fill="none" stroke="#64748b" strokeWidth={5} />
      <ellipse cx={45} cy={38} rx={23} ry={6} fill="#78350f" />
      <path
        d="M36 26 q4 -8 0 -12 M52 26 q4 -8 0 -12"
        stroke="#cbd5e1"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      <rect x={14} y={76} width={62} height={6} rx={3} fill="#cbd5e1" />
    </>
  ),

  /* ------------------------- roupas e calçados ------------------------- */
  camisa: (
    <>
      <path
        d="M32 22 L50 32 L68 22 L88 34 L78 52 L72 46 v40 H28 V46 l-6 6 L12 34 z"
        fill="#0ea5e9"
      />
      <path d="M40 22 L50 38 L60 22" fill="none" stroke="#0369a1" strokeWidth={3} />
      <circle cx={50} cy={52} r={2.5} fill="#0369a1" />
      <circle cx={50} cy={66} r={2.5} fill="#0369a1" />
    </>
  ),
  sapato: (
    <>
      <path d="M12 68 q0 -26 20 -26 q10 0 14 10 q16 6 34 10 q10 3 10 10 v6 H12 z" fill="#dc2626" />
      <rect x={10} y={72} width={82} height={8} rx={4} fill="#1c1917" />
      <path d="M34 50 l16 8 M32 58 l16 8" stroke="#fff" strokeWidth={2.5} />
    </>
  ),
  vestido: (
    <>
      <path d="M38 20 h24 l8 12 l-8 6 l6 46 H32 l6 -46 l-8 -6 z" fill="#ec4899" />
      <path d="M38 20 q12 12 24 0" fill="none" stroke="#9d174d" strokeWidth={3} />
      <path d="M32 58 h36" stroke="#9d174d" strokeWidth={3} />
    </>
  ),
  tenis: (
    <>
      <path
        d="M10 70 q2 -22 18 -22 q8 0 12 8 l30 12 q14 4 18 8 v6 H10 z"
        fill="#f8fafc"
        stroke="#64748b"
        strokeWidth={2}
      />
      <rect x={8} y={76} width={84} height={8} rx={4} fill="#0ea5e9" />
      <path d="M32 54 l14 8 M30 62 l14 8" stroke="#94a3b8" strokeWidth={3} />
    </>
  ),

  /* -------------------------- meios de transporte ---------------------- */
  aviao: (
    <>
      <path
        d="M46 20 q8 0 8 16 v14 l34 16 v10 l-34 -8 v14 l10 8 v6 l-18 -4 l-18 4 v-6 l10 -8 v-14 l-34 8 v-10 l34 -16 v-14 q0 -16 8 -16 z"
        fill="#0ea5e9"
      />
    </>
  ),
  bicicleta: (
    <>
      <circle cx={26} cy={64} r={20} fill="none" stroke="#1c1917" strokeWidth={5} />
      <circle cx={74} cy={64} r={20} fill="none" stroke="#1c1917" strokeWidth={5} />
      <path
        d="M26 64 L46 36 h16 L74 64 M46 36 L58 64 M42 34 h12"
        fill="none"
        stroke="#dc2626"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <circle cx={50} cy={64} r={5} fill="#1c1917" />
    </>
  ),
  carro: (
    <>
      <path d="M12 62 q2 -16 14 -16 l8 -14 h32 l10 14 q12 0 12 16 v10 H12 z" fill="#dc2626" />
      <path d="M38 36 h22 l7 10 H34 z" fill="#bfdbfe" />
      <circle cx={30} cy={74} r={10} fill="#1c1917" />
      <circle cx={70} cy={74} r={10} fill="#1c1917" />
      <circle cx={30} cy={74} r={4} fill="#9ca3af" />
      <circle cx={70} cy={74} r={4} fill="#9ca3af" />
    </>
  ),
  navio: (
    <>
      <path d="M10 62 h80 l-12 22 H22 z" fill="#dc2626" />
      <rect x={34} y={38} width={30} height={24} fill="#f8fafc" />
      <rect x={40} y={44} width={8} height={8} fill="#38bdf8" />
      <rect x={52} y={44} width={8} height={8} fill="#38bdf8" />
      <rect x={66} y={26} width={8} height={36} fill="#1e40af" />
      <path d="M6 88 q12 -8 24 0 t24 0 t24 0 t16 0" stroke="#0ea5e9" strokeWidth={4} fill="none" />
    </>
  ),
  trem: (
    <>
      <rect x={10} y={38} width={44} height={36} rx={5} fill="#2563eb" />
      <rect x={58} y={46} width={32} height={28} rx={4} fill="#1d4ed8" />
      <rect x={18} y={46} width={14} height={14} fill="#bfdbfe" />
      <rect x={36} y={46} width={12} height={14} fill="#bfdbfe" />
      <rect x={64} y={52} width={10} height={10} fill="#bfdbfe" />
      <circle cx={24} cy={80} r={7} fill="#1c1917" />
      <circle cx={46} cy={80} r={7} fill="#1c1917" />
      <circle cx={74} cy={80} r={7} fill="#1c1917" />
      <rect x={14} y={26} width={10} height={12} rx={2} fill="#64748b" />
    </>
  ),

  /* ----------------------------- natureza ------------------------------ */
  sol: (
    <>
      <circle cx={50} cy={50} r={22} fill="#facc15" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect
          key={i}
          x={48}
          y={8}
          width={4}
          height={14}
          rx={2}
          fill="#f59e0b"
          transform={`rotate(${i * 45} 50 50)`}
        />
      ))}
      <circle cx={42} cy={46} r={3} fill="#b45309" />
      <circle cx={58} cy={46} r={3} fill="#b45309" />
      <path
        d="M42 56 q8 8 16 0"
        stroke="#b45309"
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),
  lua: (
    <>
      <path d="M62 14 a38 38 0 1 0 22 62 A32 32 0 0 1 62 14 z" fill="#fde68a" />
      <circle cx={44} cy={40} r={5} fill="#fcd34d" />
      <circle cx={36} cy={60} r={7} fill="#fcd34d" />
      <circle cx={56} cy={66} r={4} fill="#fcd34d" />
    </>
  ),
  nuvem: (
    <>
      <circle cx={34} cy={56} r={18} fill="#e2e8f0" />
      <circle cx={56} cy={48} r={22} fill="#f1f5f9" />
      <circle cx={72} cy={60} r={15} fill="#e2e8f0" />
      <rect x={30} y={58} width={48} height={16} rx={8} fill="#f1f5f9" />
    </>
  ),
  arvore: (
    <>
      <rect x={44} y={54} width={12} height={38} rx={3} fill="#78350f" />
      <circle cx={50} cy={40} r={24} fill="#16a34a" />
      <circle cx={32} cy={50} r={15} fill="#22c55e" />
      <circle cx={68} cy={50} r={15} fill="#22c55e" />
    </>
  ),
  estrela: (
    <>
      <path
        d="M50 10 L61 40 L93 40 L67 58 L77 88 L50 70 L23 88 L33 58 L7 40 L39 40 z"
        fill="#facc15"
        stroke="#ca8a04"
        strokeWidth={2}
      />
    </>
  ),
  igreja: (
    <>
      <rect x={28} y={44} width={44} height={44} fill="#f5f5f4" stroke="#78716c" strokeWidth={2} />
      <path d="M28 44 L50 24 L72 44 z" fill="#dc2626" />
      <path d="M50 24 v-12 M44 18 h12" stroke="#78350f" strokeWidth={4} />
      <path d="M44 66 h12 v22 H44 z" fill="#78350f" />
      <circle cx={50} cy={52} r={6} fill="#38bdf8" />
    </>
  ),
  escola: (
    <>
      <rect x={14} y={44} width={72} height={44} fill="#fcd34d" />
      <path d="M10 44 L50 18 L90 44 z" fill="#1d4ed8" />
      <rect x={42} y={62} width={16} height={26} fill="#78350f" />
      <rect x={22} y={54} width={12} height={12} fill="#38bdf8" />
      <rect x={66} y={54} width={12} height={12} fill="#38bdf8" />
      <path d="M50 18 v-10 l14 5 l-14 5" fill="#dc2626" />
    </>
  ),
};

/** As cores nomeadas, que também são palavras para alfabetizar. */
export const CORES_FIGURA: Record<string, string> = {
  azul: "#2563eb",
  amarelo: "#facc15",
  vermelho: "#dc2626",
  verde: "#16a34a",
  laranja: "#f97316",
  roxo: "#7c3aed",
  rosa: "#ec4899",
  marrom: "#92400e",
  preto: "#1c1917",
  branco: "#f8fafc",
  cinza: "#9ca3af",
};

export function Figura({
  nome,
  tamanho = 96,
  titulo,
}: {
  nome: string;
  tamanho?: number;
  titulo?: string;
}) {
  const cor = CORES_FIGURA[nome];
  return (
    <svg
      viewBox="0 0 100 100"
      width={tamanho}
      height={tamanho}
      role="img"
      aria-label={titulo ?? nome}
    >
      {cor ? (
        // Palavra de cor: o desenho é a própria cor, num círculo bem grande.
        <circle
          cx={50}
          cy={50}
          r={38}
          fill={cor}
          stroke="var(--color-border)"
          strokeWidth={nome === "branco" ? 3 : 1.5}
        />
      ) : (
        (DESENHOS[nome] ?? <circle cx={50} cy={50} r={36} fill="var(--color-muted)" />)
      )}
    </svg>
  );
}

export function temFigura(nome: string): boolean {
  return nome in DESENHOS || nome in CORES_FIGURA;
}
