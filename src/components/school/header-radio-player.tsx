import { AlertTriangle, Loader2, Pause, Play, Radio } from "lucide-react";

import { useJovemPanRadio } from "@/lib/jovem-pan-radio-store";
import { cn } from "@/lib/utils";

/** Barrinhas de espectro animadas, só de verdade enquanto está tocando. */
function Espectro({ ativo }: { ativo: boolean }) {
  const atrasos = [0, 0.12, 0.24, 0.08, 0.18];
  return (
    <div className="flex h-4 items-end gap-[2.5px]" aria-hidden>
      {atrasos.map((atraso, i) => (
        <span
          key={i}
          className={cn(
            "w-[2.5px] rounded-full bg-gradient-to-t from-blue-500 dark:from-cyan-400 to-emerald-500 dark:to-fuchsia-400",
            ativo ? "animate-radio-eq" : "h-[3px] opacity-40",
          )}
          style={
            ativo
              ? ({
                  height: "16px",
                  "--eq-duration": `${0.55 + atraso}s`,
                  "--eq-delay": `${atraso}s`,
                } as React.CSSProperties)
              : undefined
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
 */
export function HeaderRadioPlayer() {
  const { status, alternarReproducao } = useJovemPanRadio();
  const tocando = status === "tocando";

  return (
    <button
      type="button"
      onClick={alternarReproducao}
      aria-label={tocando ? "Parar Jovem Pan News" : "Ouvir Jovem Pan News ao vivo"}
      title={
        status === "erro"
          ? "Sinal indisponível no momento"
          : tocando
            ? "Jovem Pan News · ao vivo — clique para parar"
            : "Ouvir Jovem Pan News ao vivo"
      }
      className={cn(
        "group cursor-pointer relative flex items-center gap-2 overflow-hidden rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
        "border-blue-400/30 dark:border-transparent bg-gradient-to-r from-blue-500/10 dark:from-cyan-500/15 via-emerald-500/10 dark:via-blue-500/10 to-emerald-500/10 dark:to-fuchsia-500/15",
        "before:absolute before:inset-0 before:-z-10 before:rounded-full before:bg-gradient-to-r before:from-blue-400 dark:before:from-cyan-400 before:via-emerald-500 dark:before:via-blue-500 before:to-emerald-500 dark:before:to-fuchsia-500 before:opacity-20 dark:before:opacity-30 before:blur-[6px]",
        tocando ? "shadow-[0_0_12px_-1px] shadow-blue-400/40 dark:shadow-cyan-400/60" : "hover:before:opacity-40 dark:hover:before:opacity-50",
      )}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-neutral-900 text-blue-600 dark:text-cyan-300 ring-1 ring-blue-300/60 dark:ring-cyan-400/40",
          tocando && "ring-2 ring-blue-400/80 dark:ring-cyan-300/80",
        )}
      >
        {status === "carregando" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : status === "erro" ? (
          <AlertTriangle className="size-4 text-amber-400" />
        ) : tocando ? (
          <Pause className="size-4" />
        ) : (
          <Play className="size-4 translate-x-0.5" />
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
  );
}
