import {
  base,
  COR_DEDO,
  dedoDe,
  FILEIRAS,
  NOME_DEDO,
} from "@/components/school/jogos/digitacao-dados";
import { cn } from "@/lib/utils";

/**
 * Ilustrações do jogo de digitação: teclado colorido por dedo, as duas mãos,
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
        "flex flex-col gap-1 rounded-xl border border-white/10 bg-slate-900/70 p-2 sm:gap-1.5 sm:p-3",
        className,
      )}
      aria-hidden
    >
      {FILEIRAS.map((f, i) => (
        <div
          key={i}
          className="flex justify-center gap-1 sm:gap-1.5"
          style={{ paddingLeft: `${i * 2}%`, paddingRight: `${(3 - i) * 2}%` }}
        >
          {f.map((k) => {
            const ehAlvo = alvoBase === k || (alvo === "ç" && k === "ç");
            const cor = COR_DEDO[dedoDe(k)]!;
            const noFoco = foco ? foco.includes(k) : false;
            return (
              <span
                key={k}
                className={cn(
                  "relative flex h-7 w-[8.6%] items-center justify-center rounded-md border text-[11px] font-bold uppercase transition-all sm:h-9 sm:text-sm",
                  ehAlvo
                    ? "z-10 scale-110 border-white text-white shadow-lg"
                    : erro === k
                      ? "border-red-400 bg-red-500/60 text-white"
                      : "border-white/15 text-slate-300",
                  !ehAlvo && erro !== k && !cores && !noFoco && "bg-slate-800/80",
                )}
                style={
                  ehAlvo
                    ? { background: cor, boxShadow: `0 0 16px ${cor}` }
                    : erro === k
                      ? undefined
                      : cores
                        ? { background: `${cor}55`, borderColor: `${cor}99`, color: "#fff" }
                        : noFoco
                          ? { background: `${cor}33`, borderColor: cor, color: "#fff" }
                          : undefined
                }
              >
                {k}
                {RELEVO.has(k) && (
                  <span className="absolute bottom-0.5 h-0.5 w-2.5 rounded-full bg-white/70 sm:bottom-1" />
                )}
              </span>
            );
          })}
        </div>
      ))}
      <div className="flex justify-center">
        <span
          className={cn(
            "flex h-7 w-3/5 items-center justify-center rounded-md border text-[10px] font-bold uppercase tracking-widest transition-all sm:h-9",
            alvo === " "
              ? "border-white bg-slate-500 text-white shadow-lg shadow-slate-400/60"
              : erro === " "
                ? "border-red-400 bg-red-500/60"
                : "border-white/15 bg-slate-800/80 text-slate-400",
          )}
        >
          espaço
        </span>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------- mãos

const PELE = "#f2c39f";
const PELE_SOMBRA = "#dba57f";

/** Centro x e altura de cada dedo (0-3 mão esquerda, 6-9 mão direita). */
const DEDOS: { id: number; x: number; alt: number }[] = [
  { id: 0, x: 44, alt: 50 },
  { id: 1, x: 86, alt: 66 },
  { id: 2, x: 128, alt: 74 },
  { id: 3, x: 170, alt: 66 },
  { id: 6, x: 230, alt: 66 },
  { id: 7, x: 272, alt: 74 },
  { id: 8, x: 314, alt: 66 },
  { id: 9, x: 356, alt: 50 },
];

export function Maos({
  ativos,
  className,
}: {
  /** Dedos acesos (ids de 0 a 9). */
  ativos: number[];
  className?: string;
}) {
  const aceso = (id: number) => ativos.includes(id);
  return (
    <svg
      viewBox="0 0 400 150"
      className={cn("w-full", className)}
      role="img"
      aria-label={
        ativos.length
          ? `Mãos sobre o teclado. Use o dedo: ${ativos.map((d) => NOME_DEDO[d]).join(", ")}.`
          : "Mãos sobre o teclado"
      }
    >
      {/* palmas */}
      <rect x={26} y={86} width={168} height={58} rx={26} fill={PELE_SOMBRA} />
      <rect x={206} y={86} width={168} height={58} rx={26} fill={PELE_SOMBRA} />
      {/* dedos */}
      {DEDOS.map((d) => {
        const cor = COR_DEDO[d.id]!;
        const on = aceso(d.id);
        return (
          <g key={d.id}>
            <rect
              x={d.x - 16}
              y={92 - d.alt}
              width={32}
              height={d.alt + 18}
              rx={16}
              fill={on ? cor : PELE}
              stroke={on ? "#fff" : PELE_SOMBRA}
              strokeWidth={on ? 3 : 1.5}
              style={on ? { filter: `drop-shadow(0 0 8px ${cor})` } : undefined}
            />
            {/* unha na cor do dedo */}
            <ellipse
              cx={d.x}
              cy={92 - d.alt + 12}
              rx={8}
              ry={9}
              fill={on ? "#fff" : cor}
              opacity={on ? 0.85 : 0.9}
            />
          </g>
        );
      })}
      {/* polegares */}
      {[
        { id: 4, x: 214, r: 30 },
        { id: 5, x: 186, r: -30 },
      ].map((t) => {
        const on = aceso(t.id);
        return (
          <g key={t.id} transform={`rotate(${t.r} ${t.x} 128)`}>
            <rect
              x={t.x - 15}
              y={100}
              width={30}
              height={50}
              rx={15}
              fill={on ? "#38bdf8" : PELE}
              stroke={on ? "#fff" : PELE_SOMBRA}
              strokeWidth={on ? 3 : 1.5}
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
}: {
  texto: string;
  humor?: "feliz" | "animado" | "triste" | undefined;
}) {
  return (
    <div className="flex items-end gap-2">
      <Teco humor={humor} className="size-14 shrink-0 sm:size-16" />
      <div className="relative min-h-10 flex-1 rounded-2xl rounded-bl-sm border border-sky-300/40 bg-sky-500/15 px-3 py-2 text-xs font-medium leading-snug text-sky-50 sm:text-sm">
        {texto}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------- postura

export function Postura({ className }: { className?: string }) {
  const marca = (n: number, x: number, y: number) => (
    <g key={n}>
      <circle cx={x} cy={y} r={9} fill="#f59e0b" stroke="#fff" strokeWidth={1.5} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={800} fill="#1c1917">
        {n}
      </text>
    </g>
  );
  return (
    <svg
      viewBox="0 0 320 200"
      className={className}
      role="img"
      aria-label="Desenho de uma criança sentada de lado diante de um computador, com as costas retas e os pés no chão"
    >
      <rect width={320} height={200} rx={16} fill="#0f172a" />
      <rect x={0} y={184} width={320} height={16} fill="#1e293b" />
      {/* mesa */}
      <rect x={150} y={112} width={160} height={8} rx={3} fill="#a16207" />
      <rect x={298} y={120} width={7} height={64} fill="#854d0e" />
      {/* monitor */}
      <rect x={244} y={54} width={62} height={44} rx={4} fill="#334155" />
      <rect x={248} y={58} width={54} height={36} rx={2} fill="#38bdf8" opacity={0.85} />
      <rect x={270} y={98} width={10} height={14} fill="#475569" />
      {/* teclado */}
      <rect x={176} y={106} width={58} height={6} rx={2} fill="#64748b" />
      {/* cadeira */}
      <rect x={54} y={82} width={7} height={54} rx={3} fill="#7c3aed" />
      <rect x={54} y={132} width={62} height={8} rx={3} fill="#7c3aed" />
      <rect x={82} y={140} width={5} height={44} fill="#6d28d9" />
      <rect x={68} y={180} width={34} height={5} rx={2} fill="#6d28d9" />
      {/* criança */}
      <line
        x1={92}
        y1={128}
        x2={142}
        y2={132}
        stroke="#1d4ed8"
        strokeWidth={17}
        strokeLinecap="round"
      />
      <line
        x1={142}
        y1={132}
        x2={142}
        y2={176}
        stroke="#1e3a8a"
        strokeWidth={14}
        strokeLinecap="round"
      />
      <rect x={134} y={174} width={28} height={10} rx={5} fill="#f8fafc" />
      <line
        x1={92}
        y1={126}
        x2={92}
        y2={82}
        stroke="#f43f5e"
        strokeWidth={22}
        strokeLinecap="round"
      />
      <circle cx={94} cy={58} r={17} fill={PELE} />
      <path d="M78 54 Q82 38 98 40 Q110 42 108 54 Q98 48 78 54Z" fill="#3f2a1d" />
      <circle cx={102} cy={58} r={2} fill="#1c1917" />
      <line x1={92} y1={92} x2={132} y2={104} stroke={PELE} strokeWidth={9} strokeLinecap="round" />
      <line
        x1={132}
        y1={104}
        x2={178}
        y2={106}
        stroke={PELE}
        strokeWidth={8}
        strokeLinecap="round"
      />
      {/* linha do olhar */}
      <line
        x1={110}
        y1={58}
        x2={246}
        y2={72}
        stroke="#fde047"
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />
      {marca(1, 118, 46)}
      {marca(2, 66, 96)}
      {marca(3, 160, 92)}
      {marca(4, 176, 168)}
      {marca(5, 128, 88)}
    </svg>
  );
}
