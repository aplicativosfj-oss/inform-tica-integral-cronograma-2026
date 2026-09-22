import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

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
    <section className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-sm">
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary shadow-sm backdrop-blur-md dark:border-primary/25 dark:bg-primary/15">
              <EtiquetaIcon className="size-3.5" /> {etiqueta}
            </span>
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
                className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/80 px-3 py-2.5 backdrop-blur-sm"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <indicador.icon className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <dt className="text-[11px] text-muted-foreground">{indicador.rotulo}</dt>
                  <dd className="text-lg font-semibold leading-none text-foreground">
                    {indicador.valor}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  );
}
