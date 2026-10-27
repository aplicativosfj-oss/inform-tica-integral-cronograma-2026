import { CalendarDays } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { REFERENCIA, textoAplicacao, type Instrumento } from "@/lib/resultados/referencia";

/**
 * Quadro fixo no topo: diz de que período são os números e quando foram
 * aplicados, para ninguém confundir com outro bimestre.
 */
export function QuadroReferencia({ ids }: { ids?: Instrumento["id"][] }) {
  const lista = REFERENCIA.instrumentos.filter((i) => !ids || ids.includes(i.id));
  return (
    <Card className="border-primary/30">
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <CalendarDays className="size-4 text-primary" aria-hidden />
          <p className="text-sm font-semibold">Referência: {REFERENCIA.bimestre}</p>
          <p className="text-xs text-muted-foreground">
            {REFERENCIA.escola} · {REFERENCIA.municipio} · publicado em {REFERENCIA.publicadoEm}
          </p>
        </div>
        <ul className="grid gap-2 text-sm sm:grid-cols-3">
          {lista.map((i) => (
            <li key={i.id} className="rounded-lg border bg-muted/30 p-3">
              <p className="font-medium">{i.nome}</p>
              <p className="text-xs text-muted-foreground">Período: {i.periodo}</p>
              <p className="text-xs text-muted-foreground">
                Aplicação:{" "}
                <span className={i.aplicadoEm ? "text-foreground" : "italic"}>
                  {textoAplicacao(i)}
                </span>
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">Fonte: {i.fonte}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
