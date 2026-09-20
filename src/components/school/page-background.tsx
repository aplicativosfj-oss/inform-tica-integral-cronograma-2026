import agendaPatternBg from "@/assets/agenda-pattern-bg.svg";

/**
 * Fundo decorativo padrão de toda página pública: um padrão próprio (grade
 * de agenda + trilhas de circuito, no estilo da logomarca) fixo atrás do
 * conteúdo, com uma camada translúcida por cima pra nunca competir com o
 * texto ou os cards. Mesmo tratamento visual já usado na home, só que
 * reaproveitável nas demais páginas.
 *
 * No escuro reaproveitamos o mesmo SVG (em vez de trocar por uma foto): o
 * traço é azul-marinho sólido sobre transparente, então `invert` +
 * `hue-rotate-180` vira um traço azul-claro sobre fundo escuro — mantém a
 * marca em vez de um asset genérico, e não some feito a foto de antes.
 */
export function PageBackground() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center opacity-100 dark:opacity-70 dark:invert dark:hue-rotate-180 dark:saturate-150"
        style={{ backgroundImage: `url("${agendaPatternBg}")` }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-background/20 dark:bg-background/40"
      />
    </>
  );
}
