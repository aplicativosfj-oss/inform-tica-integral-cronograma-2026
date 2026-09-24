import {
  base,
  COR_DEDO,
  dedoDe,
  FILEIRAS,
  NOME_DEDO,
} from "@/components/school/jogos/digitacao-dados";
import { cn } from "@/lib/utils";

/**
 * Elementos visuais do jogo de digitação: teclado interativo, as duas mãos,
 * o tutor (Teco, o robô) e o desenho da postura correta.
 *
 * Tudo é SVG desenhado no código — nada de imagem externa — para as cores dos
 * dedos serem exatamente as mesmas do teclado e para nada pesar na página.
 */

// ------------------------------------------------------------------ teclado

interface TecladoProps {
  /** Tecla que deve ser apertada agora. */
  alvo?: string | null;
  /** Tecla que acabou de ser errada. */
  erro?: string | null;
  /** Pinta todas as teclas com a cor do dedo (mapa dos dedos). */
  cores?: boolean;
  /** Teclas do foco da lição, levemente destacadas. */
  foco?: string;
  className?: string;
}

const RELEVO = new Set(["f", "j"]);

export function Teclado({ alvo, erro, cores, foco, className }: TecladoProps) {
  const alvoBase = alvo ? base(alvo) : null;
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-2xl border border-sky-300/15 bg-slate-950/80 p-2.5 shadow-2xl shadow-slate-950/70 ring-1 ring-white/5 backdrop-blur-md sm:gap-2 sm:p-3",
        className,
      )}
      aria-hidden
    >
      {FILEIRAS.map((f, i) => (
        <div
          key={i}
          className="flex justify-center gap-1.5 sm:gap-2"
          style={{ paddingLeft: `${i * 1.7}%`, paddingRight: `${(3 - i) * 1.7}%` }}
        >
          {f.map((k) => {
            const ehAlvo = alvoBase === k || (alvo === "ç" && k === "ç");
            const cor = COR_DEDO[dedoDe(k)]!;
            const noFoco = foco ? foco.includes(k) : false;
            return (
              <span
                key={k}
                className={cn(
                  "relative flex h-9 w-[8.6%] items-center justify-center overflow-hidden rounded-lg border text-xs font-black uppercase tracking-wide sm:h-11 sm:text-sm",
                  ehAlvo
                    ? "z-10 -translate-y-1 scale-105 border-white text-white shadow-xl"
                    : erro === k
                      ? "border-red-300 bg-red-500/70 text-white"
                      : "border-white/10 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_3px_0_rgba(0,0,0,.55)]",
                  !ehAlvo && erro !== k && !cores && !noFoco &&
                    "bg-gradient-to-b from-slate-700/90 to-slate-900",
                )}
                style={
                  ehAlvo
                    ? { background: cor, boxShadow: `0 0 16px ${cor}` }
                    : erro === k
                      ? undefined
                      : cores
                        ? {
                            background: `linear-gradient(180deg, ${cor}30 0%, rgba(15,23,42,.96) 72%)`,
                            borderColor: `${cor}88`,
                            color: "#fff",
                          }
                        : noFoco
                          ? { background: `${cor}33`, borderColor: cor, color: "#fff" }
                          : undefined
                }
              >
                {k}
                {cores && !ehAlvo && erro !== k && (
                  <span
                    className="absolute inset-x-1 bottom-0 h-1 rounded-t-full"
                    style={{ background: cor, boxShadow: `0 0 8px ${cor}` }}
                  />
                )}
                {RELEVO.has(k) && (
                  <span className="absolute bottom-1.5 h-0.5 w-3 rounded-full bg-white/80 sm:bottom-2" />
                )}
              </span>
            );
          })}
        </div>
      ))}
      <div className="flex justify-center">
        <span
          className={cn(
            "flex h-9 w-3/5 items-center justify-center rounded-lg border text-[10px] font-bold uppercase tracking-[.25em] shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_3px_0_rgba(0,0,0,.55)] sm:h-11 sm:text-xs",
            alvo === " "
              ? "border-white bg-slate-500 text-white shadow-lg shadow-slate-400/60"
              : erro === " "
                ? "border-red-400 bg-red-500/60"
                : "border-white/10 bg-gradient-to-b from-slate-700/90 to-slate-900 text-slate-300",
          )}
        >
          espaço
        </span>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------- mãos

/** Centro x, comprimento e largura de cada dedo (0-3 mão esquerda, 6-9 mão direita). */
const DEDOS: { id: number; x: number; alt: number; larg: number }[] = [
  { id: 0, x: 46, alt: 56, larg: 27 },
  { id: 1, x: 88, alt: 74, larg: 29 },
  { id: 2, x: 130, alt: 82, larg: 30 },
  { id: 3, x: 172, alt: 72, larg: 30 },
  { id: 6, x: 228, alt: 72, larg: 30 },
  { id: 7, x: 270, alt: 82, larg: 30 },
  { id: 8, x: 312, alt: 74, larg: 29 },
  { id: 9, x: 354, alt: 56, larg: 27 },
];

const TOPO_PALMA = 96;

function Dedo({
  x,
  alt,
  larg,
  id,
  on,
}: {
  x: number;
  alt: number;
  larg: number;
  id: number;
  on: boolean;
}) {
  const cor = COR_DEDO[id]!;
  const topo = TOPO_PALMA - alt;
  const meia = larg / 2;
  return (
    <g style={on ? { filter: `drop-shadow(0 0 7px ${cor})` } : undefined}>
      <rect
        x={x - meia}
        y={topo}
        width={larg}
        height={alt + 22}
        rx={meia}
        fill={on ? cor : "url(#maos-pele)"}
        stroke={on ? "#ffffff" : "#b8825c"}
        strokeWidth={on ? 2.5 : 1}
      />
      {/* brilho de luz na lateral esquerda */}
      <rect
        x={x - meia + 3}
        y={topo + 10}
        width={4}
        height={alt - 8}
        rx={2}
        fill="#ffffff"
        opacity={on ? 0.45 : 0.28}
      />
      {/* dobras das articulações */}
      {[0.42, 0.7].map((f) => (
        <path
          key={f}
          d={`M${x - meia + 4} ${topo + alt * f} Q${x} ${topo + alt * f + 3} ${x + meia - 4} ${topo + alt * f}`}
          stroke={on ? "#ffffff" : "#a56f4b"}
          strokeWidth={1.2}
          fill="none"
          opacity={0.55}
        />
      ))}
      {/* unha */}
      <rect
        x={x - meia + 5}
        y={topo + 4}
        width={larg - 10}
        height={16}
        rx={7}
        fill={on ? "#ffffff" : "#fbe3dc"}
        opacity={on ? 0.9 : 1}
      />
      <rect
        x={x - meia + 5}
        y={topo + 15}
        width={larg - 10}
        height={5}
        rx={2.5}
        fill={cor}
        opacity={on ? 0.5 : 0.85}
      />
    </g>
  );
}

export function Maos({ ativos, className }: { ativos: number[]; className?: string }) {
  const aceso = (id: number) => ativos.includes(id);
  return (
    <svg
      viewBox="0 0 400 176"
      className={cn("w-full", className)}
      role="img"
      aria-label={
        ativos.length
          ? `Mãos sobre o teclado. Use o dedo: ${ativos.map((d) => NOME_DEDO[d]).join(", ")}.`
          : "Mãos sobre o teclado"
      }
    >
      <defs>
        <linearGradient id="maos-pele" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f8d6b8" />
          <stop offset="0.55" stopColor="#efbd98" />
          <stop offset="1" stopColor="#d99a72" />
        </linearGradient>
        <linearGradient id="maos-palma" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#efbd98" />
          <stop offset="1" stopColor="#d08d66" />
        </linearGradient>
        <linearGradient id="maos-manga" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
      {/* antebraços e mangas */}
      {[74, 254].map((x0) => (
        <g key={x0}>
          <rect x={x0} y={140} width={72} height={36} fill="url(#maos-palma)" />
          <rect x={x0 - 6} y={158} width={84} height={18} rx={6} fill="url(#maos-manga)" />
        </g>
      ))}
      {/* palmas */}
      <rect
        x={24}
        y={TOPO_PALMA - 6}
        width={172}
        height={66}
        rx={30}
        fill="url(#maos-palma)"
        stroke="#b8825c"
        strokeWidth={1}
      />
      <rect
        x={204}
        y={TOPO_PALMA - 6}
        width={172}
        height={66}
        rx={30}
        fill="url(#maos-palma)"
        stroke="#b8825c"
        strokeWidth={1}
      />
      {DEDOS.map((d) => (
        <Dedo key={d.id} {...d} on={aceso(d.id)} />
      ))}
      {/* polegares */}
      {[
        { id: 4, x: 214, r: 32 },
        { id: 5, x: 186, r: -32 },
      ].map((t) => {
        const on = aceso(t.id);
        return (
          <g
            key={t.id}
            transform={`rotate(${t.r} ${t.x} 132)`}
            style={on ? { filter: "drop-shadow(0 0 7px #38bdf8)" } : undefined}
          >
            <rect
              x={t.x - 16}
              y={108}
              width={32}
              height={58}
              rx={16}
              fill={on ? "#38bdf8" : "url(#maos-pele)"}
              stroke={on ? "#fff" : "#b8825c"}
              strokeWidth={on ? 2.5 : 1}
            />
            <rect
              x={t.x - 12}
              y={112}
              width={24}
              height={13}
              rx={6}
              fill={on ? "#fff" : "#fbe3dc"}
            />
          </g>
        );
      })}
    </svg>
  );
}

// ------------------------------------------------------------------- tutor

export function Teco({
  humor = "feliz",
  className,
}: {
  humor?: "feliz" | "animado" | "triste" | undefined;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 80 84" className={className} aria-hidden>
      <line x1={40} y1={6} x2={40} y2={16} stroke="#94a3b8" strokeWidth={3} />
      <circle cx={40} cy={6} r={4.5} fill={humor === "triste" ? "#94a3b8" : "#fbbf24"} />
      <rect x={8} y={16} width={64} height={52} rx={16} fill="#3b82f6" />
      <rect x={8} y={16} width={64} height={52} rx={16} fill="url(#teco-brilho)" />
      <defs>
        <linearGradient id="teco-brilho" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.35} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={16} y={26} width={48} height={28} rx={11} fill="#0f172a" />
      {/* olhos */}
      {humor === "animado" ? (
        <>
          <path
            d="M27 42 Q31 33 35 42"
            stroke="#67e8f9"
            strokeWidth={3.5}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M45 42 Q49 33 53 42"
            stroke="#67e8f9"
            strokeWidth={3.5}
            fill="none"
            strokeLinecap="round"
          />
        </>
      ) : humor === "triste" ? (
        <>
          <circle cx={31} cy={39} r={4} fill="#67e8f9" />
          <circle cx={49} cy={39} r={4} fill="#67e8f9" />
          <path
            d="M25 33 L36 36 M55 33 L44 36"
            stroke="#67e8f9"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <circle cx={31} cy={38} r={4.5} fill="#67e8f9" />
          <circle cx={49} cy={38} r={4.5} fill="#67e8f9" />
        </>
      )}
      {/* boca */}
      {humor === "triste" ? (
        <path
          d="M33 60 Q40 55 47 60"
          stroke="#f8fafc"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M32 58 Q40 66 48 58"
          stroke="#f8fafc"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />
      )}
      <circle cx={13} cy={42} r={5} fill="#1d4ed8" />
      <circle cx={67} cy={42} r={5} fill="#1d4ed8" />
      <rect x={26} y={68} width={28} height={12} rx={6} fill="#2563eb" />
    </svg>
  );
}

/** O tutor com a fala: usado nas lições e nas fases para dar dicas na hora certa. */
export function TutorFala({
  texto,
  humor,
  compacto,
}: {
  texto: string;
  humor?: "feliz" | "animado" | "triste" | undefined;
  compacto?: boolean;
}) {
  return (
    <div className="flex items-end gap-2">
      <Teco humor={humor} className={cn("shrink-0", compacto ? "size-9" : "size-14 sm:size-16")} />
      <div
        className={cn(
          "relative flex-1 rounded-2xl rounded-bl-sm border border-sky-300/40 bg-sky-500/15 font-medium leading-snug text-sky-50",
          compacto
            ? "min-h-8 px-2.5 py-1.5 text-[11px] sm:text-xs"
            : "min-h-10 px-3 py-2 text-xs sm:text-sm",
        )}
      >
        {texto}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------- postura

export function Postura({ className }: { className?: string }) {
  const marca = (n: number, x: number, y: number) => (
    <g key={n}>
      <circle cx={x} cy={y} r={10} fill="#f59e0b" stroke="#fff" strokeWidth={1.6} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={12} fontWeight={800} fill="#1c1917">
        {n}
      </text>
    </g>
  );
  return (
    <svg
      viewBox="0 0 320 200"
      className={className}
      role="img"
      aria-label="Desenho de uma criança sentada de lado diante de um computador, com as costas retas, os cotovelos dobrados e os pés no chão"
    >
      <defs>
        <linearGradient id="po-fundo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1e293b" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="po-tela" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="po-mesa" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d4a15c" />
          <stop offset="1" stopColor="#8a5a2b" />
        </linearGradient>
        <linearGradient id="po-camisa" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fb7185" />
          <stop offset="1" stopColor="#be123c" />
        </linearGradient>
        <linearGradient id="po-calca" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
        <radialGradient id="po-luz" cx="0.85" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#38bdf8" stopOpacity={0.35} />
          <stop offset="1" stopColor="#38bdf8" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={320} height={200} rx={16} fill="url(#po-fundo)" />
      <rect width={320} height={200} rx={16} fill="url(#po-luz)" />
      <rect x={0} y={184} width={320} height={16} fill="#111827" />
      <rect x={0} y={184} width={320} height={2} fill="#334155" />
      {/* mesa */}
      <rect x={146} y={112} width={168} height={9} rx={3} fill="url(#po-mesa)" />
      <rect x={300} y={121} width={8} height={63} fill="#7a4a1f" />
      {/* monitor */}
      <rect
        x={236}
        y={50}
        width={72}
        height={50}
        rx={5}
        fill="#1f2937"
        stroke="#475569"
        strokeWidth={1.5}
      />
      <rect x={241} y={55} width={62} height={40} rx={2} fill="url(#po-tela)" />
      <rect x={246} y={61} width={30} height={3} rx={1.5} fill="#fff" opacity={0.7} />
      <rect x={246} y={68} width={44} height={3} rx={1.5} fill="#fff" opacity={0.45} />
      <rect x={266} y={100} width={12} height={12} fill="#475569" />
      <rect x={254} y={110} width={36} height={3} rx={1.5} fill="#64748b" />
      {/* teclado */}
      <rect x={172} y={106} width={62} height={7} rx={2} fill="#94a3b8" />
      <rect x={174} y={107} width={58} height={2} rx={1} fill="#cbd5e1" opacity={0.7} />
      {/* cadeira */}
      <rect x={52} y={78} width={9} height={58} rx={4} fill="#7c3aed" />
      <rect x={52} y={132} width={66} height={10} rx={4} fill="#8b5cf6" />
      <rect x={82} y={142} width={6} height={38} fill="#5b21b6" />
      <path d="M60 182 H112" stroke="#4c1d95" strokeWidth={5} strokeLinecap="round" />
      <circle cx={62} cy={184} r={4} fill="#1f2937" />
      <circle cx={110} cy={184} r={4} fill="#1f2937" />
      {/* criança: pernas */}
      <line
        x1={92}
        y1={128}
        x2={142}
        y2={131}
        stroke="url(#po-calca)"
        strokeWidth={18}
        strokeLinecap="round"
      />
      <line
        x1={142}
        y1={131}
        x2={142}
        y2={173}
        stroke="#1e3a8a"
        strokeWidth={15}
        strokeLinecap="round"
      />
      <path d="M130 172 H160 Q164 172 164 178 V183 H130 Z" fill="#f8fafc" />
      <rect x={130} y={180} width={34} height={3} fill="#cbd5e1" />
      {/* tronco */}
      <line
        x1={92}
        y1={126}
        x2={92}
        y2={84}
        stroke="url(#po-camisa)"
        strokeWidth={24}
        strokeLinecap="round"
      />
      {/* pescoço e cabeça */}
      <rect x={88} y={64} width={10} height={14} rx={4} fill="#efbd98" />
      <circle cx={94} cy={56} r={18} fill="#f6cba6" />
      <path d="M76 54 Q78 34 96 36 Q112 38 111 54 Q102 46 90 48 Q82 48 76 54 Z" fill="#3f2a1d" />
      <ellipse cx={90} cy={58} rx={3} ry={4} fill="#e2a982" />
      <circle cx={103} cy={55} r={2} fill="#1c1917" />
      <path
        d="M99 64 Q104 67 108 63"
        stroke="#b45309"
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
      />
      {/* braços */}
      <line
        x1={92}
        y1={92}
        x2={132}
        y2={104}
        stroke="#e11d48"
        strokeWidth={10}
        strokeLinecap="round"
      />
      <line
        x1={132}
        y1={104}
        x2={174}
        y2={107}
        stroke="#f6cba6"
        strokeWidth={8}
        strokeLinecap="round"
      />
      <circle cx={176} cy={107} r={5} fill="#f6cba6" />
      {/* guias de ângulo e do olhar */}
      <path d="M118 94 A14 14 0 0 1 128 108" stroke="#fde047" strokeWidth={1.5} fill="none" />
      <line
        x1={112}
        y1={55}
        x2={238}
        y2={70}
        stroke="#fde047"
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />
      <line
        x1={92}
        y1={30}
        x2={92}
        y2={140}
        stroke="#22d3ee"
        strokeWidth={1}
        strokeDasharray="3 4"
        opacity={0.7}
      />
      {marca(1, 120, 42)}
      {marca(2, 64, 100)}
      {marca(3, 160, 94)}
      {marca(4, 176, 168)}
      {marca(5, 130, 90)}
    </svg>
  );
}
