/**
 * Sequential, theme-aware ramp for ordinal data (grade level): darker reads
 * as "further along", so the color itself carries meaning without forcing a
 * legend lookup. Values live in styles.css (`--serie-1..5`) with separate
 * light/dark tuning — these class names are written out literally so the
 * Tailwind scanner picks them up (it can't see dynamically built strings).
 *
 * Shared across every place that shows a turma by série (grade weekly view,
 * turma avatars on the homepage, etc.) so the same série always reads as the
 * same color everywhere on the site.
 */
const SERIE_BG = ["bg-serie-1", "bg-serie-2", "bg-serie-3", "bg-serie-4", "bg-serie-5"];
const SERIE_TEXT = ["text-slate-900", "text-slate-900", "text-white", "text-white", "text-white"];
const SERIE_RING = [
  "ring-[color:var(--serie-1)]/50",
  "ring-[color:var(--serie-2)]/50",
  "ring-[color:var(--serie-3)]/50",
  "ring-[color:var(--serie-4)]/50",
  "ring-[color:var(--serie-5)]/50",
];

export function serieClasses(index: number) {
  const i = ((index % SERIE_BG.length) + SERIE_BG.length) % SERIE_BG.length;
  return { bg: SERIE_BG[i]!, text: SERIE_TEXT[i]!, ring: SERIE_RING[i]! };
}

/**
 * Índice de cor a partir do número da série (ex.: "1º Ano" -> 0), para telas
 * que não têm à mão a lista de séries únicas na ordem de cadastro (a grade
 * semanal usa essa ordem; aqui o número escrito já basta).
 */
export function serieIndexPorNumero(serie: string): number {
  const numero = Number(serie.match(/\d+/)?.[0]);
  return Number.isFinite(numero) ? numero - 1 : 0;
}
