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
    faixa: "from-blue-500/20 via-blue-500/[0.07] to-transparent",
    borda: "border-blue-400/40 dark:border-blue-400/30",
    barra: "bg-blue-500 dark:bg-blue-400",
    chip: "border-blue-400/35 bg-blue-500/15 text-blue-600 dark:border-blue-400/30 dark:bg-blue-400/15 dark:text-blue-300",
  },
  violet: {
    faixa: "from-violet-500/20 via-violet-500/[0.07] to-transparent",
    borda: "border-violet-400/40 dark:border-violet-400/30",
    barra: "bg-violet-500 dark:bg-violet-400",
    chip: "border-violet-400/35 bg-violet-500/15 text-violet-600 dark:border-violet-400/30 dark:bg-violet-400/15 dark:text-violet-300",
  },
  emerald: {
    faixa: "from-emerald-500/20 via-emerald-500/[0.07] to-transparent",
    borda: "border-emerald-400/40 dark:border-emerald-400/30",
    barra: "bg-emerald-500 dark:bg-emerald-400",
    chip: "border-emerald-400/35 bg-emerald-500/15 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-300",
  },
  amber: {
    faixa: "from-amber-500/20 via-amber-500/[0.07] to-transparent",
    borda: "border-amber-400/40 dark:border-amber-400/30",
    barra: "bg-amber-500 dark:bg-amber-400",
    chip: "border-amber-400/35 bg-amber-500/15 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-300",
  },
  rose: {
    faixa: "from-rose-500/20 via-rose-500/[0.07] to-transparent",
    borda: "border-rose-400/40 dark:border-rose-400/30",
    barra: "bg-rose-500 dark:bg-rose-400",
    chip: "border-rose-400/35 bg-rose-500/15 text-rose-600 dark:border-rose-400/30 dark:bg-rose-400/15 dark:text-rose-300",
  },
  cyan: {
    faixa: "from-cyan-500/20 via-cyan-500/[0.07] to-transparent",
    borda: "border-cyan-400/40 dark:border-cyan-400/30",
    barra: "bg-cyan-500 dark:bg-cyan-400",
    chip: "border-cyan-400/35 bg-cyan-500/15 text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-400/15 dark:text-cyan-300",
  },
  pink: {
    faixa: "from-pink-500/20 via-pink-500/[0.07] to-transparent",
    borda: "border-pink-400/40 dark:border-pink-400/30",
    barra: "bg-pink-500 dark:bg-pink-400",
    chip: "border-pink-400/35 bg-pink-500/15 text-pink-600 dark:border-pink-400/30 dark:bg-pink-400/15 dark:text-pink-300",
  },
  indigo: {
    faixa: "from-indigo-500/20 via-indigo-500/[0.07] to-transparent",
    borda: "border-indigo-400/40 dark:border-indigo-400/30",
    barra: "bg-indigo-500 dark:bg-indigo-400",
    chip: "border-indigo-400/35 bg-indigo-500/15 text-indigo-600 dark:border-indigo-400/30 dark:bg-indigo-400/15 dark:text-indigo-300",
  },
  teal: {
    faixa: "from-teal-500/20 via-teal-500/[0.07] to-transparent",
    borda: "border-teal-400/40 dark:border-teal-400/30",
    barra: "bg-teal-500 dark:bg-teal-400",
    chip: "border-teal-400/35 bg-teal-500/15 text-teal-700 dark:border-teal-400/30 dark:bg-teal-400/15 dark:text-teal-300",
  },
  orange: {
    faixa: "from-orange-500/20 via-orange-500/[0.07] to-transparent",
    borda: "border-orange-400/40 dark:border-orange-400/30",
    barra: "bg-orange-500 dark:bg-orange-400",
    chip: "border-orange-400/35 bg-orange-500/15 text-orange-600 dark:border-orange-400/30 dark:bg-orange-400/15 dark:text-orange-300",
  },
  lime: {
    faixa: "from-lime-500/20 via-lime-500/[0.07] to-transparent",
    borda: "border-lime-400/40 dark:border-lime-400/30",
    barra: "bg-lime-500 dark:bg-lime-400",
    chip: "border-lime-400/35 bg-lime-500/15 text-lime-700 dark:border-lime-400/30 dark:bg-lime-400/15 dark:text-lime-300",
  },
  sky: {
    faixa: "from-sky-500/20 via-sky-500/[0.07] to-transparent",
    borda: "border-sky-400/40 dark:border-sky-400/30",
    barra: "bg-sky-500 dark:bg-sky-400",
    chip: "border-sky-400/35 bg-sky-500/15 text-sky-700 dark:border-sky-400/30 dark:bg-sky-400/15 dark:text-sky-300",
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
 *
 * A primeira versão era discreta demais: um degradê a 12% sobre o fundo
 * claro quase não aparecia, e numa página com vários grupos seguidos nada
 * marcava onde uma categoria terminava e a outra começava. Agora o banner
 * tem barra lateral sólida na cor da categoria, faixa mais forte e título
 * maior — dá para varrer a página e achar a seção sem ler.
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
      className={`relative flex scroll-mt-32 items-center gap-3.5 overflow-hidden rounded-2xl border bg-gradient-to-r p-4 pl-5 shadow-sm ${c.faixa} ${c.borda} ${className ?? ""}`}
    >
      {/* Barra sólida na lateral: é o que faz a categoria aparecer de
        relance, já que o degradê sozinho some no fundo claro. */}
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1.5 ${c.barra}`} />
      <span
        className={`flex size-12 shrink-0 items-center justify-center rounded-xl border shadow-sm ${c.chip}`}
      >
        <Icon className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-bold leading-tight tracking-tight text-foreground sm:text-xl">
          {titulo}
        </h3>
        {descricao ? (
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{descricao}</p>
        ) : null}
      </div>
      {extra ? <div className="shrink-0">{extra}</div> : null}
    </div>
  );
}
