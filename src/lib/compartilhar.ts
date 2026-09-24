/**
 * Metadados de compartilhamento (Open Graph e Twitter).
 *
 * Cada jogo, ferramenta e seção tem a sua própria imagem 1200x630 em
 * `public/og/`, gerada por `scripts/build-share-images.mjs`. Quando alguém
 * manda o link no WhatsApp, no Facebook ou no Telegram, o cartão mostra aquele
 * item — e não a arte genérica da página inicial.
 *
 * O `?v=` obriga as redes a baixar a imagem de novo quando a arte muda:
 * sem ele, o cartão antigo fica em cache por semanas. Suba o número sempre
 * que rodar o script e a arte mudar.
 */

export const VERSAO_ARTE = 2;

type Meta = Record<string, string>;

/** Só as tags de imagem — para as páginas que já definem título e descrição. */
export function imagemCompartilhar(caminho: string, alt: string): Meta[] {
  const url = `${caminho}?v=${VERSAO_ARTE}`;
  return [
    { property: "og:image", content: url },
    { property: "og:image:type", content: "image/jpeg" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: alt },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: url },
    { name: "twitter:image:alt", content: alt },
  ];
}

/** Título, descrição e imagem de uma vez — para as páginas de jogo e de ferramenta. */
export function metaCompartilhar(o: {
  titulo: string;
  descricao: string;
  imagem: string;
  alt?: string;
}): Meta[] {
  return [
    { title: o.titulo },
    { name: "description", content: o.descricao },
    { property: "og:title", content: o.titulo },
    { property: "og:description", content: o.descricao },
    { property: "og:type", content: "website" },
    { name: "twitter:title", content: o.titulo },
    { name: "twitter:description", content: o.descricao },
    ...imagemCompartilhar(o.imagem, o.alt ?? o.titulo),
  ];
}
