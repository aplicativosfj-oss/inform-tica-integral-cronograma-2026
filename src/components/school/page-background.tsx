import fundoClaro from "@/assets/fundo-claro.svg";
import fundoSite from "@/assets/fundo-site.jpg.asset.json";

/**
 * Fundo padrão de toda página pública.
 *
 * No modo claro a foto de fundo, mesmo coberta por uma camada quase opaca,
 * deixava manchas cinzentas e borrões coloridos atrás do texto. Então o claro
 * tem uma imagem própria (`fundo-claro.svg`): base creme, manchas suaves nas
 * cores da marca e ícones de traço fino, claros o bastante para não competir
 * com cards e texto.
 *
 * No escuro a foto continua, porque ali ela funciona: o degradê por cima
 * a segura e o ambiente ganha textura.
 */
export function PageBackground() {
  return (
    <>
      {/* Base sólida: garante que nada de baixo vaze. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-background" />

      {/* Claro: ilustração própria em tons suaves (creme, lilás, amarelo e verde-água)
          com ícones de informática e escola em traço fino, quase transparentes. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat dark:hidden"
        style={{ backgroundImage: `url("${fundoClaro}")` }}
      />

      {/* Escuro: a foto da marca, suavizada. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 hidden bg-cover bg-center bg-no-repeat dark:block"
        style={{ backgroundImage: `url("${fundoSite.url}")` }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 hidden backdrop-blur-[2px] dark:block dark:bg-background/85"
      />
    </>
  );
}
