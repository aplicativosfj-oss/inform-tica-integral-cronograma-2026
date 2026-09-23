import fundoSite from "@/assets/fundo-site.jpg.asset.json";

/**
 * Fundo padrão de toda página pública.
 *
 * No modo claro a foto de fundo, mesmo coberta por uma camada quase opaca,
 * deixava manchas cinzentas e borrões coloridos atrás do texto — parecia
 * sujeira, não acabamento. Então no claro a foto simplesmente não entra:
 * a página fica com uma base limpa, dois halos suaves na cor da marca nos
 * cantos superiores e uma grade fininha que some nas bordas. Isso dá
 * profundidade sem competir com cards e tipografia.
 *
 * No escuro a foto continua, porque ali ela funciona: o degradê por cima
 * a segura e o ambiente ganha textura.
 */
export function PageBackground() {
  return (
    <>
      {/* Base sólida: garante que nada de baixo vaze. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-background" />

      {/* Claro: halos da marca + grade discreta. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 dark:hidden bg-[radial-gradient(60rem_40rem_at_8%_-10%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_70%),radial-gradient(48rem_32rem_at_100%_0%,color-mix(in_oklch,var(--accent-foreground)_10%,transparent),transparent_70%),linear-gradient(to_bottom,color-mix(in_oklch,var(--card)_70%,transparent),transparent_38%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.55] dark:hidden [background-image:linear-gradient(to_right,color-mix(in_oklch,var(--border)_60%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklch,var(--border)_60%,transparent)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(75%_60%_at_50%_0%,#000,transparent_85%)]"
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
