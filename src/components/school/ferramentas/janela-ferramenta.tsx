import { GripHorizontal, X, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

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
  children,
}: JanelaFerramentaProps) {
  const [aberta, setAberta] = useState(abertaInicial);
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
        }}
        className={`fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl ${
          abertaInicial ? largura : larguraBalao
        }`}
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
          className={`flex shrink-0 touch-none select-none items-center gap-1.5 rounded-t-2xl border-b border-border/60 px-3 py-2 ${
            arrastando ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          <GripHorizontal className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-xs font-medium text-muted-foreground">
              {titulo}
            </span>
            {abertaInicial && subtitulo ? (
              <span className="block text-[11px] text-muted-foreground/70">{subtitulo}</span>
            ) : null}
          </span>
          <button
            type="button"
            onClick={fechar}
            aria-label={`Fechar ${titulo}`}
            className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className={`min-h-0 flex-1 overflow-auto ${abertaInicial ? "p-4" : "p-2.5"}`}>
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
