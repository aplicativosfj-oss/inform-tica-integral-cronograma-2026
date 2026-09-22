import type { ReactNode } from "react";

import type { Objeto } from "@/components/school/ferramentas/medidas";

/**
 * Os objetos que servem de régua mental: a criança não sabe o que é "2 mm",
 * mas sabe o que é a espessura de uma moeda. Cada desenho é o objeto de
 * verdade, simplificado até o essencial, na caixa 0 0 120 100.
 */

const DESENHOS: Record<Objeto, ReactNode> = {
  moeda: (
    <>
      <ellipse cx={60} cy={52} rx={30} ry={30} fill="#d4a017" />
      <ellipse cx={60} cy={52} rx={23} ry={23} fill="none" stroke="#a97b12" strokeWidth={2.5} />
      <text x={60} y={60} textAnchor="middle" fill="#7a5a0d" className="text-[18px] font-bold">
        1
      </text>
      <path d="M96 40 v24" stroke="var(--color-foreground)" strokeWidth={2} opacity={0.5} />
      <path
        d="M92 40 h8 M92 64 h8"
        stroke="var(--color-foreground)"
        strokeWidth={2}
        opacity={0.5}
      />
    </>
  ),
  borracha: (
    <>
      <rect x={26} y={38} width={68} height={28} rx={4} fill="#f472b6" />
      <rect x={26} y={38} width={68} height={10} rx={4} fill="#fbcfe8" />
      <rect x={60} y={38} width={34} height={28} rx={4} fill="#60a5fa" opacity={0.85} />
    </>
  ),
  caderno: (
    <>
      <rect x={34} y={14} width={54} height={74} rx={4} fill="#1d4ed8" />
      <rect x={40} y={14} width={48} height={74} rx={3} fill="#f8fafc" />
      <path d="M48 30 h32 M48 42 h32 M48 54 h32 M48 66 h20" stroke="#94a3b8" strokeWidth={2.5} />
      <circle cx={36} cy={26} r={3} fill="#64748b" />
      <circle cx={36} cy={50} r={3} fill="#64748b" />
      <circle cx={36} cy={74} r={3} fill="#64748b" />
    </>
  ),
  porta: (
    <>
      <rect x={34} y={8} width={52} height={86} rx={3} fill="#a16207" />
      <rect x={40} y={14} width={40} height={74} rx={2} fill="#ca8a04" />
      <circle cx={74} cy={54} r={3.5} fill="#fde68a" />
      <path
        d="M24 8 v86 M20 8 h8 M20 94 h8"
        stroke="var(--color-foreground)"
        strokeWidth={2}
        opacity={0.5}
      />
    </>
  ),
  quadra: (
    <>
      <rect x={10} y={26} width={100} height={56} rx={3} fill="#16a34a" opacity={0.3} />
      <rect
        x={10}
        y={26}
        width={100}
        height={56}
        rx={3}
        fill="none"
        stroke="#16a34a"
        strokeWidth={2.5}
      />
      <line x1={60} y1={26} x2={60} y2={82} stroke="#16a34a" strokeWidth={2.5} />
      <circle cx={60} cy={54} r={10} fill="none" stroke="#16a34a" strokeWidth={2.5} />
      <rect x={10} y={44} width={10} height={20} fill="none" stroke="#16a34a" strokeWidth={2.5} />
      <rect x={100} y={44} width={10} height={20} fill="none" stroke="#16a34a" strokeWidth={2.5} />
    </>
  ),
  quarteirao: (
    <>
      <rect x={8} y={62} width={104} height={22} fill="#64748b" opacity={0.45} />
      <path d="M14 73 h14 M38 73 h14 M62 73 h14 M86 73 h14" stroke="#f8fafc" strokeWidth={3} />
      <rect x={14} y={30} width={22} height={32} fill="#ea580c" opacity={0.8} />
      <rect x={44} y={20} width={24} height={42} fill="#0ea5e9" opacity={0.8} />
      <rect x={78} y={36} width={24} height={26} fill="#a855f7" opacity={0.8} />
      <circle cx={26} cy={92} r={5} fill="#334155" />
      <circle cx={92} cy={92} r={5} fill="#334155" />
    </>
  ),
  gota: (
    <>
      <path d="M60 22 C44 46 38 56 38 64 a22 22 0 0 0 44 0 c0-8 -6-18 -22-42 z" fill="#0ea5e9" />
      <ellipse cx={51} cy={62} rx={6} ry={9} fill="#e0f2fe" opacity={0.6} />
    </>
  ),
  colher: (
    <>
      <ellipse cx={40} cy={40} rx={22} ry={16} fill="#cbd5e1" transform="rotate(-20 40 40)" />
      <ellipse cx={40} cy={40} rx={15} ry={10} fill="#94a3b8" transform="rotate(-20 40 40)" />
      <path d="M56 50 L100 84" stroke="#cbd5e1" strokeWidth={9} strokeLinecap="round" />
    </>
  ),
  copo: (
    <>
      <path d="M38 20 L84 20 L78 88 L44 88 Z" fill="#e0f2fe" opacity={0.4} />
      <path d="M40 40 L82 40 L78 88 L44 88 Z" fill="#f97316" />
      <path
        d="M38 20 L84 20 L78 88 L44 88 Z"
        fill="none"
        stroke="var(--color-foreground)"
        strokeWidth={2.5}
        opacity={0.55}
      />
      <rect x={44} y={26} width={5} height={24} rx={2.5} fill="#ffffff" opacity={0.5} />
    </>
  ),
  garrafa: (
    <>
      <rect x={52} y={8} width={16} height={14} rx={2} fill="#1d4ed8" />
      <path
        d="M50 22 h20 c0 8 10 10 10 22 v40 a6 6 0 0 1 -6 6 h-28 a6 6 0 0 1 -6 -6 v-40 c0-12 10-14 10-22 z"
        fill="#38bdf8"
        opacity={0.55}
      />
      <path d="M42 54 h36 v30 a6 6 0 0 1 -6 6 h-24 a6 6 0 0 1 -6 -6 z" fill="#0284c7" />
      <rect x={42} y={58} width={36} height={14} fill="#f8fafc" opacity={0.85} />
    </>
  ),
  balde: (
    <>
      <path d="M30 34 h60 l-8 54 h-44 z" fill="#0ea5e9" />
      <path d="M32 48 h56 l-6 40 h-44 z" fill="#38bdf8" />
      <rect x={26} y={26} width={68} height={10} rx={4} fill="#0369a1" />
      <path
        d="M36 26 q24 -22 48 0"
        fill="none"
        stroke="#475569"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
    </>
  ),
  caixadagua: (
    <>
      <ellipse cx={60} cy={30} rx={38} ry={11} fill="#3b82f6" />
      <path d="M22 30 v46 a38 11 0 0 0 76 0 v-46" fill="#60a5fa" />
      <ellipse cx={60} cy={76} rx={38} ry={11} fill="#1d4ed8" opacity={0.5} />
      <path d="M52 84 v10 M68 84 v10" stroke="#475569" strokeWidth={4} />
      <rect x={40} y={94} width={40} height={4} rx={2} fill="#475569" />
    </>
  ),
  clipe: (
    <>
      <path
        d="M44 82 V34 a16 16 0 0 1 32 0 v44 a10 10 0 0 1 -20 0 V40"
        fill="none"
        stroke="#94a3b8"
        strokeWidth={7}
        strokeLinecap="round"
      />
    </>
  ),
  pacotearroz: (
    <>
      <path d="M30 26 h60 v66 h-60 z" fill="#f5f5f4" />
      <path d="M30 26 l10 -10 h60 l-10 10 z" fill="#e7e5e4" />
      <rect x={36} y={42} width={48} height={22} rx={3} fill="#16a34a" />
      <text x={60} y={58} textAnchor="middle" fill="#ffffff" className="text-[13px] font-bold">
        5 kg
      </text>
      <path d="M38 74 h44 M38 82 h32" stroke="#a8a29e" strokeWidth={3} />
    </>
  ),
  melancia: (
    <>
      <circle cx={60} cy={54} r={36} fill="#15803d" />
      <path
        d="M32 32 q10 22 0 44 M48 24 q10 30 0 60 M72 24 q-10 30 0 60 M88 32 q-10 22 0 44"
        stroke="#166534"
        strokeWidth={4}
        fill="none"
      />
      <path d="M24 54 a36 36 0 0 0 72 0 z" fill="#dc2626" opacity={0.15} />
    </>
  ),
  crianca: (
    <>
      <circle cx={60} cy={26} r={13} fill="#f5c16c" />
      <path d="M60 39 q-18 4 -18 26 v18 h36 v-18 q0-22 -18-26 z" fill="#0ea5e9" />
      <path
        d="M44 66 l-10 16 M76 66 l10 16"
        stroke="#f5c16c"
        strokeWidth={6}
        strokeLinecap="round"
      />
      <path d="M52 83 v12 M68 83 v12" stroke="#1e293b" strokeWidth={6} strokeLinecap="round" />
    </>
  ),
};

export function FiguraObjeto({ objeto, tamanho = 96 }: { objeto: Objeto; tamanho?: number }) {
  return (
    <svg
      viewBox="0 0 120 100"
      width={tamanho}
      height={(tamanho * 100) / 120}
      role="img"
      aria-label={objeto}
    >
      {DESENHOS[objeto]}
    </svg>
  );
}
