import { cn } from "@/lib/utils";

/**
 * Marca da escola: um "i" feito de pixels (de informática) com o ponto em
 * âmbar. O quadrado é tinta no claro e índigo claro no escuro, então a marca
 * se destaca do cabeçalho nos dois temas.
 */
export function MarcaLogo({ tamanho = 36, className }: { tamanho?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={tamanho}
      height={tamanho}
      role="img"
      aria-label="Informática · Escola Dr. Eiraldo"
      className={cn("shrink-0", className)}
    >
      <rect width="64" height="64" rx="17" className="fill-ink dark:fill-primary" />
      <g className="fill-white dark:fill-ink">
        <rect x="17" y="6" width="8" height="8" rx="2" className="!fill-sun" />
        <rect x="28" y="6" width="8" height="8" rx="2" className="!fill-sun" opacity="0" />
        <rect x="17" y="28" width="8" height="8" rx="2" />
        <rect x="28" y="28" width="8" height="8" rx="2" />
        <rect x="28" y="39" width="8" height="8" rx="2" />
        <rect x="17" y="50" width="8" height="8" rx="2" />
        <rect x="28" y="50" width="8" height="8" rx="2" />
        <rect x="39" y="50" width="8" height="8" rx="2" />
      </g>
    </svg>
  );
}

/** Marca + nome, na linha, para cabeçalho e rodapé. */
export function Marca({ className, curto = false }: { className?: string; curto?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <MarcaLogo tamanho={38} />
      <span className="flex min-w-0 flex-col justify-center gap-1">
        <span className="whitespace-nowrap font-heading text-[17px] font-extrabold leading-none tracking-tight text-foreground sm:text-[19px]">
          informática<span className="text-sun">.</span>
        </span>
        <span className="whitespace-nowrap text-[9.5px] font-semibold uppercase leading-none tracking-[0.16em] text-muted-foreground sm:text-[10.5px]">
          {curto ? "E.M. Dr. Eiraldo" : "Escola Dr. Eiraldo Carneiro"}
        </span>
      </span>
    </span>
  );
}
