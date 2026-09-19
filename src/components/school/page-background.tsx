import agendaPatternBg from "@/assets/agenda-pattern-bg.svg";
import backgroundImg from "@/assets/page-bg.jpg";

/**
 * Fundo decorativo padrão de toda página pública: um padrão próprio (grade
 * de agenda + trilhas de circuito, no estilo da logomarca) no modo claro, e
 * uma foto real da escola bem discreta no modo escuro — fixo atrás do
 * conteúdo, com uma camada translúcida por cima pra nunca competir com o
 * texto ou os cards. Mesmo tratamento visual já usado na home, só que
 * reaproveitável nas demais páginas.
 */
export function PageBackground() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center opacity-100 dark:hidden"
        style={{ backgroundImage: `url(${agendaPatternBg})` }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 hidden bg-cover bg-center opacity-[0.12] dark:block"
        style={{ backgroundImage: `url(${backgroundImg})` }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-background/20 dark:bg-background/70"
      />
    </>
  );
}
