import type { Espaco } from "@/lib/entre-turnos";
import { cn } from "@/lib/utils";

/**
 * Desenhos dos três espaços do intervalo, em SVG para ficarem nítidos em
 * qualquer tela e na impressão. As cores são fixas (não seguem o tema): cada
 * espaço tem a sua, a mesma das etiquetas no quadro da semana.
 */

function SalaDeAula() {
  return (
    <>
      {/* parede e chão */}
      <rect width="320" height="200" fill="#c7d2fe" />
      <rect y="138" width="320" height="62" fill="#a5b4fc" />
      <rect y="136" width="320" height="4" fill="#818cf8" />
      {/* janela com cortina e sol */}
      <rect
        x="22"
        y="26"
        width="78"
        height="70"
        rx="4"
        fill="#e0f2fe"
        stroke="#fff"
        strokeWidth="4"
      />
      <circle cx="74" cy="50" r="12" fill="#fde68a" />
      <path d="M22 26h40c-6 22-10 46-12 70H22z" fill="#f9a8d4" opacity=".9" />
      <path d="M100 26H82c4 22 6 46 6 70h12z" fill="#f9a8d4" opacity=".9" />
      {/* quadro */}
      <rect
        x="128"
        y="24"
        width="120"
        height="70"
        rx="4"
        fill="#1e3a5f"
        stroke="#a16207"
        strokeWidth="4"
      />
      <text x="150" y="58" fill="#fff" fontSize="20" fontWeight="700" fontFamily="inherit">
        z
      </text>
      <text x="166" y="50" fill="#fff" fontSize="26" fontWeight="700" fontFamily="inherit">
        z
      </text>
      <text x="186" y="40" fill="#fff" fontSize="32" fontWeight="700" fontFamily="inherit">
        Z
      </text>
      <path d="M140 82h60" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" />
      {/* relógio no meio-dia */}
      <circle cx="282" cy="46" r="17" fill="#fff" stroke="#4338ca" strokeWidth="3" />
      <path d="M282 46V34M282 46l7 4" stroke="#4338ca" strokeWidth="3" strokeLinecap="round" />
      {/* colchonetes com crianças descansando */}
      {[
        { x: 26, cor: "#fb7185", manta: "#fda4af" },
        { x: 124, cor: "#34d399", manta: "#6ee7b7" },
        { x: 222, cor: "#fbbf24", manta: "#fde68a" },
      ].map((c) => (
        <g key={c.x}>
          <rect x={c.x} y="150" width="80" height="22" rx="8" fill={c.cor} />
          <ellipse cx={c.x + 16} cy="152" rx="13" ry="8" fill="#fff" />
          <circle cx={c.x + 18} cy="146" r="9" fill="#92400e" />
          <path d={`M${c.x + 28} 156c10-14 40-14 48 0z`} fill={c.manta} />
          <rect x={c.x + 28} y="152" width="48" height="10" rx="5" fill={c.manta} />
        </g>
      ))}
    </>
  );
}

function SalaDeFilme() {
  return (
    <>
      <rect width="320" height="200" fill="#1e1b4b" />
      {/* cortinas */}
      <path d="M0 0h46c-8 50-8 110 0 200H0z" fill="#be123c" />
      <path d="M320 0h-46c8 50 8 110 0 200h46z" fill="#be123c" />
      <path d="M14 0c-4 60-4 130 0 200M30 0c-4 60-4 130 0 200" stroke="#9f1239" strokeWidth="3" />
      <path d="M306 0c4 60 4 130 0 200M290 0c4 60 4 130 0 200" stroke="#9f1239" strokeWidth="3" />
      {/* tela e facho do projetor */}
      <path d="M160 6 70 28v72l90 22z" fill="#fef3c7" opacity=".08" />
      <rect x="70" y="22" width="180" height="88" rx="6" fill="#fef9c3" />
      <rect x="78" y="30" width="164" height="72" rx="3" fill="#38bdf8" />
      <circle cx="210" cy="50" r="10" fill="#fde047" />
      <path d="M78 102l40-34 26 20 30-28 68 42z" fill="#22c55e" />
      <circle cx="160" cy="66" r="15" fill="#fff" opacity=".9" />
      <path d="M155 58v16l13-8z" fill="#1e1b4b" />
      {/* poltronas com a turma de costas */}
      {[60, 104, 148, 192, 236].map((x, i) => (
        <g key={x}>
          <circle
            cx={x + 12}
            cy="140"
            r="10"
            fill={["#7c2d12", "#422006", "#a16207", "#57534e", "#78350f"][i]}
          />
          <rect x={x} y="146" width="26" height="36" rx="6" fill="#e11d48" />
          <rect x={x - 3} y="168" width="32" height="14" rx="4" fill="#9f1239" />
        </g>
      ))}
      {/* pipoca */}
      <path d="M268 158h28l-4 36h-20z" fill="#fff" />
      <path d="M273 158l2 36M282 158v36M291 158l-2 36" stroke="#ef4444" strokeWidth="4" />
      {[270, 278, 286, 294, 274, 290].map((x, i) => (
        <circle key={i} cx={x} cy={i < 4 ? 154 : 148} r="5" fill="#fef3c7" />
      ))}
    </>
  );
}

function SalaDeJogos() {
  return (
    <>
      <rect width="320" height="200" fill="#bbf7d0" />
      <rect y="150" width="320" height="50" fill="#86efac" />
      {/* bandeirinhas */}
      <path d="M0 14q160 30 320 0" stroke="#166534" strokeWidth="2" fill="none" />
      {["#f43f5e", "#f59e0b", "#3b82f6", "#a855f7", "#10b981", "#f43f5e", "#f59e0b", "#3b82f6"].map(
        (c, i) => {
          const x = 20 + i * 40;
          const y = 14 + Math.sin((x / 320) * Math.PI) * 15;
          return <path key={i} d={`M${x - 9} ${y}h18l-9 16z`} fill={c} />;
        },
      )}
      {/* peça de quebra-cabeça na parede */}
      <path
        d="M30 50h22a8 8 0 1 1 14 0h22v22a8 8 0 1 0 0 14v22H30z"
        fill="#fbbf24"
        stroke="#b45309"
        strokeWidth="3"
      />
      {/* mesa com tabuleiro de damas */}
      <rect x="110" y="112" width="140" height="10" rx="3" fill="#92400e" />
      <rect x="122" y="122" width="8" height="40" fill="#78350f" />
      <rect x="230" y="122" width="8" height="40" fill="#78350f" />
      <g transform="translate(130 52)">
        <rect width="100" height="60" fill="#fef3c7" stroke="#78350f" strokeWidth="3" />
        {Array.from({ length: 24 }, (_, k) => {
          const col = k % 8;
          const lin = Math.floor(k / 8);
          return (col + lin) % 2 === 0 ? (
            <rect key={k} x={col * 12.5} y={lin * 20} width="12.5" height="20" fill="#78350f" />
          ) : null;
        })}
        <circle cx="18.75" cy="10" r="5" fill="#ef4444" stroke="#fff" strokeWidth="1.5" />
        <circle cx="68.75" cy="10" r="5" fill="#ef4444" stroke="#fff" strokeWidth="1.5" />
        <circle cx="43.75" cy="50" r="5" fill="#111827" stroke="#fff" strokeWidth="1.5" />
        <circle cx="93.75" cy="50" r="5" fill="#111827" stroke="#fff" strokeWidth="1.5" />
      </g>
      {/* dados */}
      <g transform="rotate(-12 60 160)">
        <rect
          x="42"
          y="142"
          width="34"
          height="34"
          rx="7"
          fill="#fff"
          stroke="#1f2937"
          strokeWidth="2.5"
        />
        <circle cx="51" cy="151" r="3" fill="#1f2937" />
        <circle cx="59" cy="159" r="3" fill="#1f2937" />
        <circle cx="67" cy="167" r="3" fill="#1f2937" />
      </g>
      <g transform="rotate(14 96 166)">
        <rect x="82" y="152" width="28" height="28" rx="6" fill="#ef4444" />
        <circle cx="90" cy="160" r="2.6" fill="#fff" />
        <circle cx="102" cy="160" r="2.6" fill="#fff" />
        <circle cx="90" cy="172" r="2.6" fill="#fff" />
        <circle cx="102" cy="172" r="2.6" fill="#fff" />
      </g>
      {/* dominós */}
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`rotate(${-8 + i * 10} ${270 + i * 14} 160)`}>
          <rect x={258 + i * 14} y="138" width="16" height="32" rx="3" fill="#111827" />
          <path d={`M${259 + i * 14} 154h14`} stroke="#fff" strokeWidth="1.5" />
          <circle cx={266 + i * 14} cy="146" r="2" fill="#fff" />
          <circle cx={266 + i * 14} cy="162" r="2" fill="#fff" />
        </g>
      ))}
      {/* cartas de memória */}
      <rect
        x="262"
        y="52"
        width="26"
        height="36"
        rx="4"
        fill="#3b82f6"
        transform="rotate(-10 275 70)"
      />
      <rect
        x="276"
        y="56"
        width="26"
        height="36"
        rx="4"
        fill="#fff"
        stroke="#3b82f6"
        strokeWidth="2"
        transform="rotate(8 289 74)"
      />
      <circle cx="289" cy="74" r="6" fill="#f43f5e" />
    </>
  );
}

function SalaDeRepouso() {
  return (
    <>
      <rect width="320" height="200" fill="#1e293b" />
      <rect y="142" width="320" height="58" fill="#334155" />
      {/* janela com lua e estrelas */}
      <rect
        x="30"
        y="24"
        width="88"
        height="70"
        rx="6"
        fill="#312e81"
        stroke="#cbd5e1"
        strokeWidth="4"
      />
      <circle cx="88" cy="50" r="15" fill="#fde68a" />
      <circle cx="96" cy="44" r="13" fill="#312e81" />
      {[
        [46, 40],
        [58, 74],
        [104, 78],
        [70, 34],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.2" fill="#fef9c3" />
      ))}
      {/* luminária */}
      <path d="M262 30h28l8 22h-44z" fill="#fbbf24" />
      <path d="M254 52h44l30 90H224z" fill="#fde68a" opacity=".12" />
      <rect x="274" y="52" width="4" height="40" fill="#94a3b8" />
      {/* camas */}
      {[
        { x: 40, cor: "#a78bfa", manta: "#c4b5fd" },
        { x: 170, cor: "#38bdf8", manta: "#7dd3fc" },
      ].map((c) => (
        <g key={c.x}>
          <rect x={c.x} y="118" width="110" height="34" rx="8" fill={c.cor} />
          <rect x={c.x} y="104" width="12" height="56" rx="4" fill="#475569" />
          <rect x={c.x + 98} y="122" width="12" height="38" rx="4" fill="#475569" />
          <ellipse cx={c.x + 32} cy="118" rx="18" ry="9" fill="#fff" />
          <circle cx={c.x + 34} cy="110" r="10" fill="#92400e" />
          <path d={`M${c.x + 46} 124c14-20 50-20 62 0z`} fill={c.manta} />
          <rect x={c.x + 46} y="118" width="62" height="14" rx="6" fill={c.manta} />
        </g>
      ))}
      <text x="128" y="84" fill="#e2e8f0" fontSize="18" fontWeight="700" fontFamily="inherit">
        z
      </text>
      <text x="142" y="70" fill="#e2e8f0" fontSize="24" fontWeight="700" fontFamily="inherit">
        z
      </text>
      <text x="160" y="54" fill="#e2e8f0" fontSize="30" fontWeight="700" fontFamily="inherit">
        Z
      </text>
    </>
  );
}

type Desenhavel = Espaco | "repouso";

const DESENHO: Record<Desenhavel, () => React.JSX.Element> = {
  aula: SalaDeAula,
  filme: SalaDeFilme,
  jogos: SalaDeJogos,
  repouso: SalaDeRepouso,
};

const TITULO: Record<Desenhavel, string> = {
  aula: "Desenho de uma sala de aula com colchonetes, onde as crianças descansam",
  filme: "Desenho de uma sala de filme, com telão, poltronas e pipoca",
  jogos: "Desenho de uma sala de jogos, com tabuleiro de damas, dados e dominós",
  repouso: "Desenho de uma sala de repouso à meia-luz, com camas e uma janela com a lua",
};

export function IlustracaoEspaco({
  espaco,
  className,
}: {
  espaco: Desenhavel;
  className?: string;
}) {
  const Desenho = DESENHO[espaco];
  return (
    <svg
      viewBox="0 0 320 200"
      role="img"
      aria-label={TITULO[espaco]}
      preserveAspectRatio="xMidYMid slice"
      className={cn("block", className)}
    >
      <Desenho />
    </svg>
  );
}
