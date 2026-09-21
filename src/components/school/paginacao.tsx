import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Barra "Anterior · Página X de Y · Próxima". Some quando só há uma página. */
export function Paginacao({
  atual,
  totalPaginas,
  onChange,
  rotulo = "Página",
}: {
  atual: number;
  totalPaginas: number;
  onChange: (pagina: number) => void;
  rotulo?: string;
}) {
  if (totalPaginas <= 1) return null;
  return (
    <nav
      aria-label="Paginação"
      className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-3"
    >
      <Button size="sm" variant="outline" disabled={atual <= 1} onClick={() => onChange(atual - 1)}>
        <ChevronLeft className="size-4" /> Anterior
      </Button>
      <span className="text-sm text-muted-foreground">
        {rotulo} <strong className="text-foreground">{atual}</strong> de {totalPaginas}
      </span>
      <Button
        size="sm"
        variant="outline"
        disabled={atual >= totalPaginas}
        onClick={() => onChange(atual + 1)}
      >
        Próxima <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}
