import { GripHorizontal, X, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Janela flutuante das ferramentas de manipular (calculadora, mesa de formas,
 * frações). Nasceu na calculadora e virou peça comum: todas se comportam do
 * mesmo jeito — arrastam pelo cabeçalho, fecham no X ou no Esc e nunca saem
 * da tela.
 *
 * Dois modos:
 *
 * - `abertaInicial`: a janela é a página (abre centralizada, escurece o fundo
 *   e o X volta para a lista de ferramentas);
 * - modo balão: fica um botão discreto no canto e a janela só aparece quando
 *   a criança clica, guardando onde foi deixada.
 */

/** Pares de cores (início/fim do degradê) por nome de cor Tailwind. */
const PALETAS: Record<string, [string, string]> = {
  rose: ["#f43f5e", "#be123c"],
  pink: ["#ec4899", "#be185d"],
  fuchsia: ["#d946ef", "#a21caf"],
  purple: ["#a855f7", "#7e22ce"],
  violet: ["#8b5cf6", "#6d28d9"],
  indigo: ["#6366f1", "#4338ca"],
  blue: ["#3b82f6", "#1d4ed8"],
  sky: ["#0ea5e9", "#0369a1"],
  cyan: ["#06b6d4", "#0e7490"],
  teal: ["#14b8a6", "#0f766e"],
  emerald: ["#10b981", "#047857"],
  green: ["#22c55e", "#15803d"],
  lime: ["#84cc16", "#4d7c0f"],
  amber: ["#f59e0b", "#b45309"],
  orange: ["#f97316", "#c2410c"],
  red: ["#ef4444", "#b91c1c"],
};

/** Cor da janela: a mesma do card que a abriu; sem `cor`, sorteia pelo título. */
function paletaDaJanela(cor: string | undefined, titulo: string): [string, string] {
  const nome = cor?.match(/(?:bg|text)-([a-z]+)-\d+/)?.[1];
  if (nome && PALETAS[nome]) return PALETAS[nome];
  const nomes = Object.keys(PALETAS);
  let h = 0;
  for (const c of titulo) h = (h * 31 + c.charCodeAt(0)) % 997;
  return PALETAS[nomes[h % nomes.length]!]!;
}

/** Folga mínima até a borda da tela, para a janela nunca sumir. */
const MARGEM = 12;

interface Posicao {
  x: number;
  y: number;
}

/** Mantém a janela inteira dentro da tela, mesmo se ela mudar de tamanho. */
function limitar(p: Posicao, largura: number, altura: number): Posicao {
  const maxX = Math.max(MARGEM, window.innerWidth - largura - MARGEM);
  const maxY = Math.max(MARGEM, window.innerHeight - altura - MARGEM);
  return {
    x: Math.min(Math.max(p.x, MARGEM), maxX),
    y: Math.min(Math.max(p.y, MARGEM), maxY),
  };
}

export interface JanelaFerramentaProps {
  titulo: string;
  /** Linha discreta abaixo do título; só aparece no modo página. */
  subtitulo?: string;
  /** Classe de largura da janela no modo página. */
  largura?: string;
  /** Largura no modo balão do canto. */
  larguraBalao?: string;
  /** Abre já na frente, centralizada (usado na página própria da ferramenta). */
  abertaInicial?: boolean;
  /** Quando informado, fechar chama isto em vez de voltar ao botão do canto. */
  aoFechar?: (() => void) | undefined;
  /** Chave do localStorage onde o modo balão guarda a posição. */
  chavePosicao?: string;
  /** Texto e ícone do botão do canto, no modo balão. */
  rotuloBotao?: string;
  iconeBotao?: LucideIcon;
  /**
   * Cor de identidade da ferramenta, nas mesmas classes Tailwind usadas no
   * card dela na lista de ferramentas (ex.: "bg-rose-500/10 text-rose-600
   * dark:bg-rose-500/20 dark:text-rose-300"). Tinge o cabeçalho da janela
   * para cada ferramenta ter uma cor própria e reconhecível — e a mesma cor
   * do card que abriu ela — em vez de todas saírem no mesmo cinza neutro.
   */
  cor?: string;
  children: ReactNode;
}

export function JanelaFerramenta({
  titulo,
  subtitulo,
  largura = "w-[min(22rem,calc(100vw-24px))]",
  larguraBalao = "w-[15rem]",
  abertaInicial = false,
  aoFechar,
  chavePosicao,
  rotuloBotao,
  iconeBotao: IconeBotao,
  cor,
  children,
}: JanelaFerramentaProps) {
  const [aberta, setAberta] = useState(abertaInicial);
  const [corA, corB] = paletaDaJanela(cor, titulo);
  // Na página própria a janela é grande e legível; a calculadora (largura
  // padrão) fica mais compacta que as ferramentas de figuras e textos.
  const larguraPagina =
    largura === "w-[min(22rem,calc(100vw-24px))]"
      ? "w-[min(32rem,calc(100vw-24px))]"
      : "w-[min(60rem,calc(100vw-24px))]";
  const [pos, setPos] = useState<Posicao | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const painelRef = useRef<HTMLDivElement>(null);
  const abrirRef = useRef<HTMLButtonElement>(null);
  // Distância entre o ponteiro e o canto da janela, travada no início do arrasto.
  const pegada = useRef<Posicao>({ x: 0, y: 0 });

  const tamanho = useCallback(() => {
    const el = painelRef.current;
    return { largura: el?.offsetWidth ?? 264, altura: el?.offsetHeight ?? 320 };
  }, []);

  /** A janela do modo página nunca grava posição: ela abre sempre centralizada. */
  const guardar = useCallback(
    (p: Posicao) => {
      if (abertaInicial || !chavePosicao) return;
      try {
        window.localStorage.setItem(chavePosicao, JSON.stringify(p));
      } catch {
        // Sem storage: a posição vale só para esta visita.
      }
    },
    [abertaInicial, chavePosicao],
  );

  // Ao abrir, retoma a última posição (se ainda couber) ou encosta no canto
  // inferior direito, que é onde o botão estava.
  useEffect(() => {
    if (!aberta) return;
    const { largura: l, altura: a } = tamanho();
    let inicial: Posicao | null = null;
    if (!abertaInicial && chavePosicao) {
      try {
        const salvo = window.localStorage.getItem(chavePosicao);
        if (salvo) {
          const p = JSON.parse(salvo) as Partial<Posicao>;
          if (typeof p.x === "number" && typeof p.y === "number") inicial = { x: p.x, y: p.y };
        }
      } catch {
        // Sem storage ou valor corrompido: cai no padrão do canto.
      }
    }
    setPos(
      limitar(
        inicial ??
          (abertaInicial
            ? { x: (window.innerWidth - l) / 2, y: (window.innerHeight - a) / 2 }
            : { x: window.innerWidth - l - MARGEM * 2, y: window.innerHeight - a - MARGEM * 2 }),
        l,
        a,
      ),
    );
  }, [aberta, tamanho, abertaInicial, chavePosicao]);

  // Se a janela do navegador encolher, traz a ferramenta de volta para dentro.
  useEffect(() => {
    if (!aberta) return;
    const aoRedimensionar = () => {
      const { largura: l, altura: a } = tamanho();
      setPos((p) => (p ? limitar(p, l, a) : p));
    };
    window.addEventListener("resize", aoRedimensionar);
    return () => window.removeEventListener("resize", aoRedimensionar);
  }, [aberta, tamanho]);

  const fechar = useCallback(() => {
    if (aoFechar) return aoFechar();
    setAberta(false);
    // Devolve o foco a quem abriu, para quem navega pelo teclado não se perder.
    window.setTimeout(() => abrirRef.current?.focus(), 0);
  }, [aoFechar]);

  // Esc fecha, como em qualquer janela.
  useEffect(() => {
    if (!aberta) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberta, fechar]);

  function iniciarArrasto(e: React.PointerEvent<HTMLDivElement>) {
    // Só o botão principal do mouse arrasta; toque e caneta entram aqui também.
    if (e.button !== 0 || !pos) return;
    // O X fica dentro do cabeçalho: sem esta saída, a captura do ponteiro
    // engole o clique e o botão de fechar não fecha nada.
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    pegada.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    setArrastando(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function arrastar(e: React.PointerEvent<HTMLDivElement>) {
    if (!arrastando) return;
    const { largura: l, altura: a } = tamanho();
    setPos(limitar({ x: e.clientX - pegada.current.x, y: e.clientY - pegada.current.y }, l, a));
  }

  function soltar(e: React.PointerEvent<HTMLDivElement>) {
    if (!arrastando) return;
    setArrastando(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (pos) guardar(pos);
  }

  /** Move a janela pelo teclado, para quem não usa mouse. */
  function moverPorTeclado(e: React.KeyboardEvent<HTMLDivElement>) {
    const passos: Record<string, Posicao> = {
      ArrowUp: { x: 0, y: -16 },
      ArrowDown: { x: 0, y: 16 },
      ArrowLeft: { x: -16, y: 0 },
      ArrowRight: { x: 16, y: 0 },
    };
    const passo = passos[e.key];
    if (!passo || !pos) return;
    e.preventDefault();
    const { largura: l, altura: a } = tamanho();
    const novo = limitar({ x: pos.x + passo.x, y: pos.y + passo.y }, l, a);
    setPos(novo);
    guardar(novo);
  }

  if (!aberta) {
    return (
      <button
        ref={abrirRef}
        type="button"
        onClick={() => setAberta(true)}
        className="fixed bottom-4 right-4 z-40 flex cursor-pointer items-center gap-1.5 rounded-full border border-border/60 bg-card/90 px-3 py-2 text-xs font-medium text-muted-foreground shadow-lg backdrop-blur transition-colors hover:border-primary/40 hover:text-foreground"
      >
        {IconeBotao ? <IconeBotao className="size-4" /> : null}
        {rotuloBotao ?? titulo}
      </button>
    );
  }

  return (
    <>
      {abertaInicial && (
        // Na página própria, a janela é a única coisa em foco: cobre o resto.
        <div aria-hidden className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm" />
      )}
      <div
        ref={painelRef}
        role="dialog"
        aria-label={titulo}
        style={{
          left: pos?.x ?? 0,
          top: pos?.y ?? 0,
          // Enquanto a posição não foi calculada, não pisca no canto errado.
          visibility: pos ? "visible" : "hidden",
          // Garantia: por mais baixa que seja a tela, a janela nunca passa dela.
          maxHeight: `calc(100dvh - ${MARGEM * 2}px)`,
          ...(abertaInicial
            ? ({
                "--jf-a": corA,
                "--jf-b": corB,
                borderColor: corA,
              } as React.CSSProperties)
            : {}),
        }}
        className={cn(
          "fixed z-50 flex flex-col overflow-hidden rounded-2xl border-2 bg-card shadow-2xl",
          abertaInicial ? `jf-grande ${larguraPagina}` : `border-border ${larguraBalao}`,
        )}
      >
        {/* Só o cabeçalho arrasta: dentro da janela a criança precisa clicar
          nas teclas, arrastar figuras e escrever sem mover a janela junto. */}
        <div
          onPointerDown={iniciarArrasto}
          onPointerMove={arrastar}
          onPointerUp={soltar}
          onPointerCancel={soltar}
          onKeyDown={moverPorTeclado}
          role="button"
          tabIndex={0}
          aria-label={`Arraste para mover: ${titulo}. Use as setas do teclado para ajustar`}
          style={
            abertaInicial
              ? { backgroundImage: `linear-gradient(90deg, ${corA}, ${corB})` }
              : undefined
          }
          className={cn(
            "flex shrink-0 touch-none select-none items-center gap-1.5 rounded-t-2xl border-b",
            abertaInicial
              ? "gap-3 border-black/10 px-5 py-3.5 text-white"
              : cn(
                  "px-3 py-2",
                  cor
                    ? `${cor} border-black/5 dark:border-white/10`
                    : "border-border/60 text-muted-foreground",
                ),
            arrastando ? "cursor-grabbing" : "cursor-grab",
          )}
        >
          <GripHorizontal
            className={cn("shrink-0 opacity-60", abertaInicial ? "size-6" : "size-4")}
          />
          <span className="min-w-0 flex-1 leading-tight">
            <span
              className={cn(
                "block truncate font-semibold",
                abertaInicial ? "text-xl font-bold tracking-tight" : "text-xs",
                !cor && !abertaInicial && "font-medium",
              )}
            >
              {titulo}
            </span>
            {abertaInicial && subtitulo ? (
              <span className="block text-sm opacity-85">{subtitulo}</span>
            ) : null}
          </span>
          <button
            type="button"
            onClick={fechar}
            aria-label={`Fechar ${titulo}`}
            className={cn(
              "flex shrink-0 cursor-pointer items-center justify-center rounded-md opacity-80 transition-colors hover:opacity-100",
              abertaInicial
                ? "size-10 rounded-full bg-white/20 hover:bg-white/35"
                : "size-6 hover:bg-black/10 dark:hover:bg-white/10",
            )}
          >
            <X className={abertaInicial ? "size-6" : "size-4"} />
          </button>
        </div>
        <div className={`min-h-0 flex-1 overflow-auto ${abertaInicial ? "jf-corpo p-6" : "p-2.5"}`}>
          {children}
        </div>
      </div>
    </>
  );
}

/** Fecha a janela de uma ferramenta voltando para a lista de ferramentas. */
export function voltarDaFerramenta() {
  if (window.history.length > 1) window.history.back();
  else window.location.assign("/ferramentas");
}
