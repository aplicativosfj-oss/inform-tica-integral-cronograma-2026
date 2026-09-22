import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Paleta compartilhada de "identidade por categoria" — mesma fórmula de
 * vidro colorido usada no resto do site (badges, chips de ícone), aqui
 * organizada como banners para dar destaque visual a um grupo de conteúdo
 * (uma categoria da Infoteca, um domínio de habilidade nos Descritores).
 *
 * Poucas cores, reaproveitadas entre categorias diferentes — o objetivo é
 * dar identidade e permitir escaneamento rápido, não uma cor única por
 * item (isso soaria arbitrário com 30+ categorias).
 */
export const CORES_CATEGORIA = {
  blue: {
    faixa: "from-blue-500/12 via-blue-500/[0.04] to-transparent",
    borda: "border-blue-400/25 dark:border-blue-400/15",
    chip: "border-blue-400/25 bg-blue-500/10 text-blue-600 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300",
  },
  violet: {
    faixa: "from-violet-500/12 via-violet-500/[0.04] to-transparent",
    borda: "border-violet-400/25 dark:border-violet-400/15",
    chip: "border-violet-400/25 bg-violet-500/10 text-violet-600 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300",
  },
  emerald: {
    faixa: "from-emerald-500/12 via-emerald-500/[0.04] to-transparent",
    borda: "border-emerald-400/25 dark:border-emerald-400/15",
    chip: "border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300",
  },
  amber: {
    faixa: "from-amber-500/12 via-amber-500/[0.04] to-transparent",
    borda: "border-amber-400/25 dark:border-amber-400/15",
    chip: "border-amber-400/25 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300",
  },
  rose: {
    faixa: "from-rose-500/12 via-rose-500/[0.04] to-transparent",
    borda: "border-rose-400/25 dark:border-rose-400/15",
    chip: "border-rose-400/25 bg-rose-500/10 text-rose-600 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300",
  },
  cyan: {
    faixa: "from-cyan-500/12 via-cyan-500/[0.04] to-transparent",
    borda: "border-cyan-400/25 dark:border-cyan-400/15",
    chip: "border-cyan-400/25 bg-cyan-500/10 text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-300",
  },
  pink: {
    faixa: "from-pink-500/12 via-pink-500/[0.04] to-transparent",
    borda: "border-pink-400/25 dark:border-pink-400/15",
    chip: "border-pink-400/25 bg-pink-500/10 text-pink-600 dark:border-pink-400/20 dark:bg-pink-400/10 dark:text-pink-300",
  },
  indigo: {
    faixa: "from-indigo-500/12 via-indigo-500/[0.04] to-transparent",
    borda: "border-indigo-400/25 dark:border-indigo-400/15",
    chip: "border-indigo-400/25 bg-indigo-500/10 text-indigo-600 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300",
  },
  teal: {
    faixa: "from-teal-500/12 via-teal-500/[0.04] to-transparent",
    borda: "border-teal-400/25 dark:border-teal-400/15",
    chip: "border-teal-400/25 bg-teal-500/10 text-teal-700 dark:border-teal-400/20 dark:bg-teal-400/10 dark:text-teal-300",
  },
  orange: {
    faixa: "from-orange-500/12 via-orange-500/[0.04] to-transparent",
    borda: "border-orange-400/25 dark:border-orange-400/15",
    chip: "border-orange-400/25 bg-orange-500/10 text-orange-600 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-orange-300",
  },
  lime: {
    faixa: "from-lime-500/12 via-lime-500/[0.04] to-transparent",
    borda: "border-lime-400/25 dark:border-lime-400/15",
    chip: "border-lime-400/25 bg-lime-500/10 text-lime-700 dark:border-lime-400/20 dark:bg-lime-400/10 dark:text-lime-300",
  },
  sky: {
    faixa: "from-sky-500/12 via-sky-500/[0.04] to-transparent",
    borda: "border-sky-400/25 dark:border-sky-400/15",
    chip: "border-sky-400/25 bg-sky-500/10 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300",
  },
} as const;

export type CorCategoria = keyof typeof CORES_CATEGORIA;

interface CategoriaHeroProps {
  icon: LucideIcon;
  titulo: string;
  descricao?: string;
  cor: CorCategoria;
  /** Conteúdo extra à direita (contagem, selo). */
  extra?: ReactNode;
  id?: string;
  className?: string;
}

/**
 * Banner de identidade para um grupo de conteúdo — usado tanto na Infoteca
 * (categorias de ferramentas) quanto na área de Descritores (domínios de
 * habilidade), para as duas lerem como um sistema visual só em vez de cada
 * página inventar seu próprio jeito de separar seções.
 */
export function CategoriaHero({
  icon: Icon,
  titulo,
  descricao,
  cor,
  extra,
  id,
  className,
}: CategoriaHeroProps) {
  const c = CORES_CATEGORIA[cor];
  return (
    <div
      id={id}
      className={`flex scroll-mt-32 items-center gap-3 rounded-2xl border bg-gradient-to-r p-4 ${c.faixa} ${c.borda} ${className ?? ""}`}
    >
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-full border shadow-sm ${c.chip}`}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-bold leading-tight text-foreground sm:text-lg">{titulo}</h3>
        {descricao ? (
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{descricao}</p>
        ) : null}
      </div>
      {extra ? <div className="shrink-0">{extra}</div> : null}
    </div>
  );
}
