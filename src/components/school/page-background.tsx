import fundoSite from "@/assets/fundo-site.jpg.asset.json";

/**
 * Fundo decorativo padrão de toda página pública: um padrão próprio (grade
 * de agenda + trilhas de circuito, no estilo da logomarca) fixo atrás do
 * conteúdo, com uma camada translúcida por cima pra nunca competir com o
 * texto ou os cards. Mesmo tratamento visual já usado na home, só que
 * reaproveitável nas demais páginas.
 *
 * No claro a camada por cima é quase opaca (93%): com fundo claro, o
 * padrão aparecendo forte virava uma textura acinzentada que sujava a
 * página e roubava contraste do texto. Fica só como marca d'água.
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
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${fundoSite.url}")` }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-background/[0.93] backdrop-blur-[2px] dark:bg-background/85"
      />
    </>
  );
}
