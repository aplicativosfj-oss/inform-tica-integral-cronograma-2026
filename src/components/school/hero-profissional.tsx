import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

interface Indicador {
  rotulo: string;
  valor: ReactNode;
  icon: LucideIcon;
}

interface HeroProfissionalProps {
  etiqueta: string;
  EtiquetaIcon: LucideIcon;
  titulo: string;
  subtitulo: string;
  /** Até quatro números de contexto (alunos, grupos, faltas...). */
  indicadores?: Indicador[];
  /** Ações à direita (botões de sair, abrir ferramentas). */
  acoes?: ReactNode;
}

/**
 * Abertura das áreas profissionais (professor e apoio especializado).
 *
 * De propósito é uma faixa sóbria — cor institucional suave, tipografia
 * calma e os números do dia — e não um banner de campanha: quem abre isso
 * está no meio do expediente e precisa enxergar a informação, não a
 * decoração.
 */
export function HeroProfissional({
  etiqueta,
  EtiquetaIcon,
  titulo,
  subtitulo,
  indicadores,
  acoes,
}: HeroProfissionalProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Badge className="mb-2 w-fit gap-1.5">
              <EtiquetaIcon className="size-3.5" /> {etiqueta}
            </Badge>
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {titulo}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitulo}</p>
          </div>
          {acoes ? <div className="flex shrink-0 flex-wrap gap-2">{acoes}</div> : null}
        </div>

        {indicadores && indicadores.length > 0 ? (
          <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {indicadores.map((indicador) => (
              <div
                key={indicador.rotulo}
                className="rounded-xl border border-border/60 bg-card/80 px-3 py-2.5 backdrop-blur-sm"
              >
                <dt className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <indicador.icon className="size-3.5 text-primary" /> {indicador.rotulo}
                </dt>
                <dd className="mt-0.5 text-lg font-semibold leading-none text-foreground">
                  {indicador.valor}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  );
}
