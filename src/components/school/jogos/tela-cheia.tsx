import { ArrowLeft, Minimize2 } from "lucide-react";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { ANO_CRIACAO, AUTOR } from "@/components/school/ferramentas/credito";

/**
 * Caixa de jogo que pode ocupar a tela toda sem perder a partida.
 *
 * Os filhos são desenhados por um portal num elemento "hospedeiro" que é
 * movido de lugar — dentro da janela da Sala de Jogos ou direto no <body> em
 * tela cheia. Como o React continua vendo o mesmo elemento de destino, o jogo
 * não é remontado: o carro não volta à largada e o tabuleiro não reinicia só
 * porque a criança virou o celular ou apertou "tela cheia".
 *
 * Em tela cheia tentamos também a API nativa (some a barra do navegador) e,
 * para a corrida, travar a orientação na horizontal. O que o aparelho não
 * suportar é ignorado: o painel em CSS já ocupa a janela inteira.
 */

interface Props {
  cheia: boolean;
  aoSair: () => void;
  /** Fecha o jogo e volta à sala de jogos. */
  aoFechar?: () => void;
  titulo: string;
  /** Tenta deixar o aparelho na horizontal (corrida, tabuleiro). */
  horizontal?: boolean;
  children: ReactNode;
}

export function CaixaJogo({ cheia, aoSair, aoFechar, titulo, horizontal, children }: Props) {
  const lugar = useRef<HTMLDivElement>(null);
  const hospedeiro = useMemo(
    () => (typeof document === "undefined" ? null : document.createElement("div")),
    [],
  );

  // Move o hospedeiro entre a janela e o <body>.
  useEffect(() => {
    if (!hospedeiro) return;
    if (cheia) {
      hospedeiro.className =
        "fixed inset-0 z-[9999] flex flex-col overflow-auto overscroll-contain bg-slate-950 text-white";
      document.body.appendChild(hospedeiro);
    } else if (lugar.current) {
      hospedeiro.className = "";
      lugar.current.appendChild(hospedeiro);
    }
  }, [cheia, hospedeiro]);

  // API nativa de tela cheia e bloqueio de orientação.
  useEffect(() => {
    if (!cheia) return;
    const el = document.documentElement;
    void el.requestFullscreen?.().catch(() => undefined);
    if (horizontal) {
      const o = window.screen.orientation as ScreenOrientation & {
        lock?: (t: string) => Promise<void>;
      };
      void o?.lock?.("landscape").catch(() => undefined);
    }
    const aoMudar = () => {
      // Esc ou gesto de voltar saiu do modo nativo: sai do painel também.
      if (!document.fullscreenElement) aoSair();
    };
    document.addEventListener("fullscreenchange", aoMudar);
    const aoTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoSair();
    };
    window.addEventListener("keydown", aoTecla);
    return () => {
      document.removeEventListener("fullscreenchange", aoMudar);
      window.removeEventListener("keydown", aoTecla);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
      try {
        window.screen.orientation?.unlock?.();
      } catch {
        // Sem suporte: nada a destravar.
      }
    };
    // aoSair muda a cada render do pai; o efeito só deve reagir à entrada/saída.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cheia]);

  // Sem o efeito de cima limpar o hospedeiro ao desmontar, ele ficaria órfão no <body>.
  useEffect(
    () => () => {
      hospedeiro?.remove();
    },
    [hospedeiro],
  );

  return (
    <>
      <div ref={lugar} />
      {hospedeiro &&
        createPortal(
          <div className={cheia ? "flex min-h-full flex-1 flex-col" : ""}>
            {cheia && (
              <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-white/10 bg-slate-950/95 px-3 py-1.5 backdrop-blur">
                <span className="min-w-0 truncate text-xs font-bold text-slate-200">
                  {titulo}
                  <span className="ml-2 hidden font-normal text-slate-400 md:inline">
                    · criado pelo {AUTOR}
                  </span>
                </span>
                <div className="flex shrink-0 gap-1.5">
                  {aoFechar && (
                    <button
                      type="button"
                      onClick={aoFechar}
                      className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-white/20 px-3 text-xs font-semibold text-slate-100 hover:bg-white/10"
                    >
                      <ArrowLeft className="size-4" /> Fechar jogo
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={aoSair}
                    className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-white/20 px-3 text-xs font-semibold text-slate-100 hover:bg-white/10"
                  >
                    <Minimize2 className="size-4" /> Modo normal
                  </button>
                </div>
              </div>
            )}
            <div className={cheia ? "flex-1 p-2 sm:p-4" : ""}>{children}</div>
            <p
              className={
                cheia
                  ? "border-t border-white/10 px-3 py-2 text-center text-[10px] text-slate-400"
                  : "mt-2 text-center text-[10px] text-muted-foreground"
              }
            >
              Jogo criado pelo {AUTOR} · {ANO_CRIACAO} · Escola Municipal em Tempo Integral Dr.
              Eiraldo Carneiro de França
            </p>
          </div>,
          hospedeiro,
        )}
    </>
  );
}
