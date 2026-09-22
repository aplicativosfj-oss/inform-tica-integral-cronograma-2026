import { Calculator, GripHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Calculadora } from "@/components/school/ferramentas/calculadora";

/**
 * Calculadora em janela flutuante: fica fechada quando a página abre (só um
 * botão discreto no canto) e, depois de aberta, pode ser arrastada para
 * qualquer lugar da tela — inclusive por cima do conteúdo, para conferir uma
 * conta sem perder de vista o que está lendo.
 *
 * A posição fica guardada no navegador; o estado aberto/fechado não, de
 * propósito: o site nunca deve abrir com a calculadora já na frente.
 */

const CHAVE_POSICAO = "infoteca:calculadora-posicao";
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

export function CalculadoraFlutuante({
  abertaInicial = false,
  aoFechar,
}: {
  /** Abre já na frente, centralizada (usado na página própria da ferramenta). */
  abertaInicial?: boolean;
  /** Quando informado, fechar chama isto em vez de voltar ao botão do canto. */
  aoFechar?: () => void;
} = {}) {
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

  // Ao abrir, retoma a última posição (se ainda couber) ou encosta no canto
  // inferior direito, que é onde o botão estava.
  useEffect(() => {
    if (!aberta) return;
    const { largura, altura } = tamanho();
    let inicial: Posicao | null = null;
    try {
      const salvo = window.localStorage.getItem(CHAVE_POSICAO);
      if (salvo) {
        const p = JSON.parse(salvo) as Partial<Posicao>;
        if (typeof p.x === "number" && typeof p.y === "number") inicial = { x: p.x, y: p.y };
      }
    } catch {
      // Sem storage ou valor corrompido: cai no padrão do canto.
    }
    setPos(
      limitar(
        inicial ??
          (abertaInicial
            ? { x: (window.innerWidth - largura) / 2, y: (window.innerHeight - altura) / 2 }
            : {
                x: window.innerWidth - largura - MARGEM * 2,
                y: window.innerHeight - altura - MARGEM * 2,
              }),
        largura,
        altura,
      ),
    );
  }, [aberta, tamanho, abertaInicial]);

  // Se a janela do navegador encolher, traz a calculadora de volta para dentro.
  useEffect(() => {
    if (!aberta) return;
    const aoRedimensionar = () => {
      const { largura, altura } = tamanho();
      setPos((p) => (p ? limitar(p, largura, altura) : p));
    };
    window.addEventListener("resize", aoRedimensionar);
    return () => window.removeEventListener("resize", aoRedimensionar);
  }, [aberta, tamanho]);

  // Esc fecha, como em qualquer janela.
  useEffect(() => {
    if (!aberta) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  });

  function fechar() {
    if (aoFechar) return aoFechar();
    setAberta(false);
    // Devolve o foco a quem abriu, para quem navega pelo teclado não se perder.
    window.setTimeout(() => abrirRef.current?.focus(), 0);
  }

  function iniciarArrasto(e: React.PointerEvent<HTMLDivElement>) {
    // Só o botão principal do mouse arrasta; toque e caneta entram aqui também.
    if (e.button !== 0 || !pos) return;
    // Teclas e o botão fechar continuam clicáveis: sem isto a captura do
    // ponteiro "engolia" o clique e o X não fechava.
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    pegada.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    setArrastando(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function arrastar(e: React.PointerEvent<HTMLDivElement>) {
    if (!arrastando) return;
    const { largura, altura } = tamanho();
    setPos(limitar({ x: e.clientX - pegada.current.x, y: e.clientY - pegada.current.y }, largura, altura));
  }

  function soltar(e: React.PointerEvent<HTMLDivElement>) {
    if (!arrastando) return;
    setArrastando(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    try {
      if (pos) window.localStorage.setItem(CHAVE_POSICAO, JSON.stringify(pos));
    } catch {
      // Sem storage: a posição vale só para esta visita.
    }
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
    const { largura, altura } = tamanho();
    const novo = limitar({ x: pos.x + passo.x, y: pos.y + passo.y }, largura, altura);
    setPos(novo);
    try {
      window.localStorage.setItem(CHAVE_POSICAO, JSON.stringify(novo));
    } catch {
      // idem
    }
  }

  if (!aberta) {
    return (
      <button
        ref={abrirRef}
        type="button"
        onClick={() => setAberta(true)}
        className="fixed bottom-4 right-4 z-40 flex cursor-pointer items-center gap-1.5 rounded-full border border-border/60 bg-card/90 px-3 py-2 text-xs font-medium text-muted-foreground shadow-lg backdrop-blur transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <Calculator className="size-4" />
        Calculadora
      </button>
    );
  }

  return (
    <div
      ref={painelRef}
      role="dialog"
      aria-label="Calculadora"
      style={{
        left: pos?.x ?? 0,
        top: pos?.y ?? 0,
        // Enquanto a posição não foi calculada, não pisca no canto errado.
        visibility: pos ? "visible" : "hidden",
        // Garantia: por mais baixa que seja a tela, a janela nunca passa dela
        // (as teclas já encolhem sozinhas, então isto quase nunca entra em ação).
        maxHeight: `calc(100dvh - ${MARGEM * 2}px)`,
      }}
      onPointerDown={iniciarArrasto}
      onPointerMove={arrastar}
      onPointerUp={soltar}
      onPointerCancel={soltar}
      className={`fixed z-50 w-[15rem] touch-none overflow-hidden rounded-2xl border border-border bg-card shadow-2xl select-none ${
        arrastando ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      <div
        onKeyDown={moverPorTeclado}
        role="button"
        tabIndex={0}
        aria-label="Arraste para mover a calculadora; use as setas do teclado para ajustar"
        className="flex items-center gap-1.5 rounded-t-2xl border-b border-border/60 px-2.5 py-1.5"
      >
        <GripHorizontal className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-xs font-medium text-muted-foreground">Calculadora</span>
        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar calculadora"
          className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="p-2.5">
        <Calculadora compacta moldura={false} />
      </div>
    </div>
  );
}

/**
 * Versão usada na página da ferramenta: a calculadora já abre como uma única
 * janela (sem rolagem), pode ser arrastada pela tela e o X volta à página
 * anterior.
 */
export function CalculadoraJanela() {
  return (
    <CalculadoraFlutuante
      abertaInicial
      aoFechar={() => {
        if (window.history.length > 1) window.history.back();
        else window.location.assign("/ferramentas");
      }}
    />
  );
}
