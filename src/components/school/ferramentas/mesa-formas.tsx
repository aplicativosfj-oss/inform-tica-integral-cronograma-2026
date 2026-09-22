import { Eraser, Minus, Plus, RotateCw, Trash2 } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Mesa de formas geométricas: uma folha onde a criança joga figuras coloridas
 * e as arrasta com o dedo ou com o mouse, como se fossem peças de EVA em cima
 * da carteira. Dá para aumentar, girar, trocar de cor e empilhar — é para
 * montar casinha, foguete, bicho, o que vier.
 *
 * Cada forma é desenhada dentro de uma caixa de −50 a 50 com centro em (0,0):
 * assim girar e aumentar acontecem em volta do meio da peça, e não do canto.
 */

const MESA_L = 320;
const MESA_A = 250;

interface FormaInfo {
  id: string;
  nome: string;
  lados: number;
  /** Desenho da peça, já centrado em (0,0). */
  desenho: (cor: string) => ReactNode;
}

/** Pontos de um polígono regular de `n` lados, com a ponta para cima. */
function regular(n: number, r = 48): string {
  return Array.from({ length: n }, (_, i) => {
    const a = ((i * 360) / n - 90) * (Math.PI / 180);
    return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

function estrela(pontas = 5, re = 50, ri = 21): string {
  return Array.from({ length: pontas * 2 }, (_, i) => {
    const r = i % 2 === 0 ? re : ri;
    const a = ((i * 180) / pontas - 90) * (Math.PI / 180);
    return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

const poli = (pontos: string) => (cor: string) => <polygon points={pontos} fill={cor} />;

export const FORMAS: FormaInfo[] = [
  { id: "circulo", nome: "Círculo", lados: 0, desenho: (c) => <circle r={48} fill={c} /> },
  {
    id: "quadrado",
    nome: "Quadrado",
    lados: 4,
    desenho: (c) => <rect x={-42} y={-42} width={84} height={84} rx={4} fill={c} />,
  },
  {
    id: "retangulo",
    nome: "Retângulo",
    lados: 4,
    desenho: (c) => <rect x={-48} y={-28} width={96} height={56} rx={4} fill={c} />,
  },
  { id: "triangulo", nome: "Triângulo", lados: 3, desenho: poli("0,-48 44,40 -44,40") },
  {
    id: "triangulo-retangulo",
    nome: "Triângulo retângulo",
    lados: 3,
    desenho: poli("-40,40 -40,-40 40,40"),
  },
  { id: "losango", nome: "Losango", lados: 4, desenho: poli("0,-50 46,0 0,50 -46,0") },
  { id: "trapezio", nome: "Trapézio", lados: 4, desenho: poli("-28,-32 28,-32 46,32 -46,32") },
  {
    id: "paralelogramo",
    nome: "Paralelogramo",
    lados: 4,
    desenho: poli("-30,-28 48,-28 30,28 -48,28"),
  },
  { id: "pentagono", nome: "Pentágono", lados: 5, desenho: poli(regular(5)) },
  { id: "hexagono", nome: "Hexágono", lados: 6, desenho: poli(regular(6)) },
  { id: "heptagono", nome: "Heptágono", lados: 7, desenho: poli(regular(7)) },
  { id: "octogono", nome: "Octógono", lados: 8, desenho: poli(regular(8)) },
  { id: "estrela", nome: "Estrela", lados: 10, desenho: poli(estrela()) },
  {
    id: "seta",
    nome: "Seta",
    lados: 7,
    desenho: poli("-45,-15 10,-15 10,-38 48,0 10,38 10,15 -45,15"),
  },
  {
    id: "cruz",
    nome: "Cruz",
    lados: 12,
    desenho: poli(
      "-15,-45 15,-45 15,-15 45,-15 45,15 15,15 15,45 -15,45 -15,15 -45,15 -45,-15 -15,-15",
    ),
  },
  { id: "oval", nome: "Oval", lados: 0, desenho: (c) => <ellipse rx={48} ry={30} fill={c} /> },
  {
    id: "semicirculo",
    nome: "Semicírculo",
    lados: 1,
    desenho: (c) => <path d="M -46,20 A 46,46 0 0,1 46,20 Z" fill={c} />,
  },
  {
    id: "coracao",
    nome: "Coração",
    lados: 0,
    desenho: (c) => <path d="M0,42 C-48,8 -32,-44 0,-18 C32,-44 48,8 0,42 Z" fill={c} />,
  },
];

const CORES = [
  "#e5484d",
  "#f76808",
  "#ffb224",
  "#46a758",
  "#12a594",
  "#0091ff",
  "#3e63dd",
  "#8e4ec6",
  "#e93d82",
  "#6f6f6f",
];

interface Peca {
  id: number;
  forma: string;
  cor: string;
  x: number;
  y: number;
  escala: number;
  giro: number;
}

let proximoId = 1;

export function MesaFormas() {
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [cor, setCor] = useState(CORES[3]!);
  const mesaRef = useRef<SVGSVGElement>(null);
  // Distância entre o ponteiro e o centro da peça, travada no início do arrasto.
  const pegada = useRef({ x: 0, y: 0 });

  const peca = pecas.find((p) => p.id === selecionada) ?? null;
  const info = peca ? FORMAS.find((f) => f.id === peca.forma) : null;

  /** Converte a posição do ponteiro na tela para a régua interna da mesa. */
  function naMesa(e: { clientX: number; clientY: number }) {
    const r = mesaRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return {
      x: ((e.clientX - r.left) * MESA_L) / r.width,
      y: ((e.clientY - r.top) * MESA_A) / r.height,
    };
  }

  function acrescentar(formaId: string) {
    const nova: Peca = {
      id: proximoId++,
      forma: formaId,
      cor,
      // Espalha bem pela mesa: empilhadas no meio, a criança acharia que só
      // uma peça tinha aparecido.
      x: 55 + Math.random() * (MESA_L - 110),
      y: 50 + Math.random() * (MESA_A - 100),
      escala: 0.7,
      giro: 0,
    };
    setPecas((ps) => [...ps, nova]);
    setSelecionada(nova.id);
  }

  function mudarSelecionada(mudanca: Partial<Peca>) {
    if (selecionada === null) return;
    setPecas((ps) => ps.map((p) => (p.id === selecionada ? { ...p, ...mudanca } : p)));
  }

  function iniciarArrasto(e: React.PointerEvent<SVGGElement>, p: Peca) {
    if (e.button !== 0) return;
    e.stopPropagation();
    const m = naMesa(e);
    pegada.current = { x: m.x - p.x, y: m.y - p.y };
    setSelecionada(p.id);
    // A peça arrastada vai para o topo da pilha, como um papel na mesa.
    setPecas((ps) => [...ps.filter((o) => o.id !== p.id), p]);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function arrastar(e: React.PointerEvent<SVGGElement>, id: number) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const m = naMesa(e);
    setPecas((ps) =>
      ps.map((p) =>
        p.id === id
          ? {
              ...p,
              // A peça pode encostar na borda, mas nunca sai inteira da mesa.
              x: Math.min(Math.max(m.x - pegada.current.x, 6), MESA_L - 6),
              y: Math.min(Math.max(m.y - pegada.current.y, 6), MESA_A - 6),
            }
          : p,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Caixa de peças */}
      <div>
        <p className="mb-1.5 text-xs text-muted-foreground">
          Toque numa forma para colocar na mesa:
        </p>
        <div className="grid grid-cols-9 gap-1">
          {FORMAS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => acrescentar(f.id)}
              title={f.nome}
              aria-label={`Colocar ${f.nome} na mesa`}
              className="flex aspect-square cursor-pointer items-center justify-center rounded-md border border-border bg-muted/40 p-0.5 transition-colors hover:border-primary/60 hover:bg-primary/10"
            >
              <svg viewBox="-52 -52 104 104" className="size-full">
                {f.desenho(cor)}
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Cores */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Cor:</span>
        {CORES.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Cor ${c}`}
            onClick={() => {
              setCor(c);
              // Com uma peça escolhida, a cor vale para ela na hora.
              if (selecionada !== null) mudarSelecionada({ cor: c });
            }}
            style={{ background: c }}
            className={cn(
              "size-6 cursor-pointer rounded-full border-2 transition-transform hover:scale-110",
              cor === c ? "border-foreground" : "border-transparent",
            )}
          />
        ))}
      </div>

      {/* Mesa */}
      <svg
        ref={mesaRef}
        viewBox={`0 0 ${MESA_L} ${MESA_A}`}
        className="w-full touch-none rounded-xl border border-border bg-muted/30"
        onPointerDown={() => setSelecionada(null)}
        role="application"
        aria-label="Mesa de formas geométricas"
      >
        {pecas.length === 0 && (
          <text
            x={MESA_L / 2}
            y={MESA_A / 2}
            textAnchor="middle"
            className="fill-muted-foreground text-[11px]"
          >
            A mesa está vazia — escolha uma forma lá em cima.
          </text>
        )}
        {pecas.map((p) => {
          const forma = FORMAS.find((f) => f.id === p.forma);
          if (!forma) return null;
          return (
            <g
              key={p.id}
              transform={`translate(${p.x} ${p.y}) rotate(${p.giro}) scale(${p.escala})`}
              onPointerDown={(e) => iniciarArrasto(e, p)}
              onPointerMove={(e) => arrastar(e, p.id)}
              className="cursor-grab active:cursor-grabbing"
            >
              {forma.desenho(p.cor)}
              {p.id === selecionada && (
                <circle
                  r={54}
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth={2 / p.escala}
                  strokeDasharray="6 5"
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Controles da peça escolhida */}
      {peca && info ? (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-2.5">
          <p className="text-xs">
            <b className="text-foreground">{info.nome}</b>{" "}
            <span className="text-muted-foreground">
              {info.lados > 0
                ? `· ${info.lados} lados e ${info.lados} cantos`
                : "· sem lados retos, é redondo"}
            </span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 cursor-pointer"
              onClick={() => mudarSelecionada({ escala: Math.min(peca.escala + 0.15, 2) })}
            >
              <Plus className="size-3.5" /> Maior
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 cursor-pointer"
              onClick={() => mudarSelecionada({ escala: Math.max(peca.escala - 0.15, 0.25) })}
            >
              <Minus className="size-3.5" /> Menor
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 cursor-pointer"
              onClick={() => mudarSelecionada({ giro: (peca.giro + 30) % 360 })}
            >
              <RotateCw className="size-3.5" /> Girar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 cursor-pointer text-destructive"
              onClick={() => {
                setPecas((ps) => ps.filter((o) => o.id !== peca.id));
                setSelecionada(null);
              }}
            >
              <Trash2 className="size-3.5" /> Tirar
            </Button>
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-2.5 text-center text-xs text-muted-foreground">
          Arraste as peças pela mesa. Toque numa peça para aumentar, girar, trocar a cor ou tirar.
        </p>
      )}

      {pecas.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {pecas.length} {pecas.length === 1 ? "peça na mesa" : "peças na mesa"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 cursor-pointer text-xs text-muted-foreground"
            onClick={() => {
              setPecas([]);
              setSelecionada(null);
            }}
          >
            <Eraser className="size-3.5" /> Limpar a mesa
          </Button>
        </div>
      )}
    </div>
  );
}
