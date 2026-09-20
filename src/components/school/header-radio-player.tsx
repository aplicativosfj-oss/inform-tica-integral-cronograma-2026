import { AlertTriangle, Loader2, Music2, Pause, Play, Radio } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useJovemPanRadio } from "@/lib/jovem-pan-radio-store";
import { cn } from "@/lib/utils";

/**
 * Barrinhas de espectro: um VU-meter de verdade tocando, e uma respiração
 * bem mais lenta e discreta quando parado — em vez de ficarem três
 * pontinhos estáticos, dão um sinal sutil de que o player está vivo e
 * pronto pra tocar.
 */
function Espectro({ ativo }: { ativo: boolean }) {
  const atrasos = [0, 0.12, 0.24, 0.08, 0.18];
  return (
    <div className="flex h-4 items-end gap-[2.5px]" aria-hidden>
      {atrasos.map((atraso, i) => (
        <span
          key={i}
          className={cn(
            "w-[2.5px] rounded-full bg-gradient-to-t from-blue-500 dark:from-cyan-400 to-emerald-500 dark:to-fuchsia-400",
            ativo ? "animate-radio-eq" : "animate-radio-idle",
          )}
          style={
            {
              height: "16px",
              "--eq-duration": ativo ? `${0.55 + atraso}s` : `${2.1 + atraso}s`,
              "--eq-delay": `${atraso}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/**
 * Player da Jovem Pan News no header: visual "console futurista" (borda
 * degradê neon, anel pulsante e espectro animado quando ao vivo). O áudio de
 * fato mora em `JovemPanRadioProvider` (montado uma vez na raiz do app), daí
 * o botão continuar tocando ao navegar entre páginas — só para quando o
 * ouvinte aperta o botão, em qualquer página.
 *
 * Ao apontar o mouse (desktop), uma dica mostra o que está tocando agora, em
 * vez do tooltip cru do navegador. Quando a faixa muda enquanto está no ar,
 * um aviso discreto aparece por alguns segundos e some sozinho — tanto no
 * layout completo (web) quanto no compacto (mobile), já que não depende de
 * hover para aparecer.
 */
export function HeaderRadioPlayer() {
  const { status, streamTitle, alternarReproducao } = useJovemPanRadio();
  const tocando = status === "tocando";

  const [troca, setTroca] = useState<{ titulo: string; saindo: boolean } | null>(null);
  const tituloAnteriorRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      streamTitle &&
      tituloAnteriorRef.current !== null &&
      streamTitle !== tituloAnteriorRef.current
    ) {
      setTroca({ titulo: streamTitle, saindo: false });
      const saida = setTimeout(
        () => setTroca((atual) => (atual ? { ...atual, saindo: true } : atual)),
        6000,
      );
      const remocao = setTimeout(() => setTroca(null), 6500);
      tituloAnteriorRef.current = streamTitle;
      return () => {
        clearTimeout(saida);
        clearTimeout(remocao);
      };
    }
    tituloAnteriorRef.current = streamTitle;
    return undefined;
  }, [streamTitle]);

  // Some com o aviso na hora se o ouvinte parar a rádio no meio do caminho.
  useEffect(() => {
    if (!tocando) setTroca(null);
  }, [tocando]);

  const statusLabel =
    status === "erro"
      ? "Sinal indisponível no momento"
      : tocando
        ? "Jovem Pan News · ao vivo"
        : "Ouvir Jovem Pan News ao vivo";

  return (
    <div className="relative">
      <TooltipProvider delayDuration={250}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={alternarReproducao}
              aria-label={tocando ? "Parar Jovem Pan News" : "Ouvir Jovem Pan News ao vivo"}
              className={cn(
                "group cursor-pointer relative flex items-center gap-1.5 overflow-hidden rounded-full border px-2.5 py-1.5 text-xs font-medium transition-all sm:gap-2 sm:px-3",
                "border-blue-400/30 dark:border-transparent bg-gradient-to-r from-blue-500/10 dark:from-cyan-500/15 via-emerald-500/10 dark:via-blue-500/10 to-emerald-500/10 dark:to-fuchsia-500/15",
                "before:absolute before:inset-0 before:-z-10 before:rounded-full before:bg-gradient-to-r before:from-blue-400 dark:before:from-cyan-400 before:via-emerald-500 dark:before:via-blue-500 before:to-emerald-500 dark:before:to-fuchsia-500 before:opacity-20 dark:before:opacity-30 before:blur-[6px]",
                tocando
                  ? "shadow-[0_0_12px_-1px] shadow-blue-400/40 dark:shadow-cyan-400/60"
                  : "hover:before:opacity-40 dark:hover:before:opacity-50",
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-neutral-900 text-blue-600 dark:text-cyan-300 ring-1 ring-blue-300/60 dark:ring-cyan-400/40 sm:size-7",
                  tocando && "ring-2 ring-blue-400/80 dark:ring-cyan-300/80",
                  status === "parado" && "animate-radio-idle-glow",
                )}
              >
                {status === "carregando" ? (
                  <Loader2 className="size-[18px] animate-spin sm:size-4" />
                ) : status === "erro" ? (
                  <AlertTriangle className="size-[18px] text-amber-400 sm:size-4" />
                ) : tocando ? (
                  <Pause className="size-[18px] sm:size-4" />
                ) : (
                  <Play className="size-[18px] translate-x-0.5 sm:size-4" />
                )}
              </span>

              <span className="hidden flex-col items-start leading-none sm:flex">
                <span className="flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-cyan-400">
                  <Radio className="size-2.5" /> JP News
                </span>
                <span className="text-xs text-blue-700/70 dark:text-foreground/75">
                  {status === "erro" ? "sinal indisponível" : tocando ? "ao vivo" : "ouvir agora"}
                </span>
              </span>

              <Espectro ativo={tocando} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px] text-center">
            <p>{statusLabel}</p>
            {tocando && streamTitle ? (
              <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] font-normal opacity-90">
                <Music2 className="size-3 shrink-0" />
                <span className="truncate">{streamTitle}</span>
              </p>
            ) : null}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {troca ? (
        <div
          role="status"
          className={cn(
            "pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-max max-w-[220px] -translate-x-1/2 rounded-lg border border-blue-400/30 bg-white/95 px-3 py-1.5 text-center shadow-lg backdrop-blur-md dark:border-cyan-400/30 dark:bg-popover/95",
            troca.saindo
              ? "animate-out fade-out-0 slide-out-to-top-1 duration-500"
              : "animate-in fade-in-0 slide-in-from-top-1 duration-300",
          )}
        >
          <span className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-cyan-400">
            <Music2 className="size-3" /> Tocando agora
          </span>
          <span className="block truncate text-[11px] font-medium text-slate-700 dark:text-white/90">
            {troca.titulo}
          </span>
        </div>
      ) : null}
    </div>
  );
}
