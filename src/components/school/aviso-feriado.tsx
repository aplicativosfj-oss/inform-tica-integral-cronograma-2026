import { CalendarOff, Info } from "lucide-react";

import { feriadoNacionalEm } from "@/lib/calendario-escolar";
import { cn } from "@/lib/utils";

interface AvisoFeriadoProps {
  dataISO: string;
  variante?: "sobre-imagem" | "painel";
  className?: string;
}

/** Banner contextual. Não inventa presenças nem altera dados históricos. */
export function AvisoFeriado({
  dataISO,
  variante = "painel",
  className,
}: AvisoFeriadoProps) {
  const feriado = feriadoNacionalEm(dataISO);
  if (!feriado) return null;

  return (
    <section
      role="status"
      aria-label="Aviso de feriado escolar"
      className={cn(
        "relative w-full overflow-hidden rounded-3xl border p-5 shadow-lg sm:p-7",
        variante === "sobre-imagem"
          ? "border-amber-300/45 bg-ink/70 text-white shadow-black/20 backdrop-blur-xl"
          : "max-w-2xl border-amber-400/25 bg-card text-foreground",
        className,
      )}
    >
      <div className="relative flex flex-wrap items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-400/15 text-amber-400">
          <CalendarOff className="size-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("text-xs font-extrabold uppercase tracking-[0.16em]", variante === "sobre-imagem" ? "text-amber-300" : "text-amber-700 dark:text-amber-300")}>
            02 de novembro · Feriado nacional
          </p>
          <h2 className="mt-1 font-heading text-xl font-extrabold tracking-tight sm:text-2xl">
            Dia de Finados
          </h2>
          <p className={cn("mt-2 text-sm leading-relaxed", variante === "sobre-imagem" ? "text-white/80" : "text-muted-foreground")}>
            Não há aulas regulares de informática nesta data. A programação segue no próximo dia letivo.
          </p>
        </div>
      </div>
      <p className={cn("mt-4 flex items-start gap-2 border-t pt-3 text-xs", variante === "sobre-imagem" ? "border-white/15 text-white/65" : "border-border text-muted-foreground")}>
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Registros históricos existentes são preservados; nenhuma presença é alterada.
      </p>
    </section>
  );
}
