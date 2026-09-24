/**
 * Pré-carregamento de imagens dos jogos.
 *
 * Sem isto, cada imagem só começa a baixar quando aparece na tela — e a
 * criança vê o fundo "surgir" depois da partida já ter começado. Aqui as
 * imagens são pedidas assim que a Sala de Jogos abre e ficam guardadas
 * (referência mantida e decodificação adiantada), então, na hora de usar, já
 * estão prontas: aparecem instantaneamente e sem travar o quadro.
 */

const guardadas = new Map<string, HTMLImageElement>();

export function precarregar(urls: string[]): void {
  if (typeof window === "undefined") return;
  for (const url of urls) {
    if (guardadas.has(url)) continue;
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    guardadas.set(url, img);
    // Decodifica já, fora da hora de desenhar (evita o "engasgo" no primeiro uso).
    void img.decode?.().catch(() => undefined);
  }
}

const PASTA = "/images/jogos/";

/** Tudo o que o jogo de digitação usa: capa, fundos, estrelas e troféus. */
export const IMAGENS_DIGITACAO = [
  "digitacao-capa-pro",
  ...[1, 2, 3, 4, 5, 6].map((n) => `digitacao-cenario-${n}-pro`),
  "digitacao-postura-pro",
  "digitacao-maos-guia-pro",
  "digitacao-maos-didaticas-pro",
  "estrela-ouro",
  "trofeu-ouro",
  "trofeu-prata",
  "trofeu-bronze",
].map((n) => `${PASTA}${n}.webp`);

/** Tudo o que a corrida usa fora do canvas: carros, pistas, capa e troféus. */
export const IMAGENS_CORRIDA = [
  ...[1, 2, 3, 4, 5, 6].map((n) => `${PASTA}carro-${n}.jpg`),
  ...["cidade", "montanha", "praia", "deserto", "neve"].map(
    (p) => `${PASTA}corrida-pista-${p}.jpg`,
  ),
  ...["montanha", "praia", "deserto", "neve"].map((p) => `${PASTA}cenario-${p}.jpg`),
  `${PASTA}corrida-capa.jpg`,
  `${PASTA}trofeu-ouro.webp`,
  `${PASTA}trofeu-prata.webp`,
  `${PASTA}trofeu-bronze.webp`,
];
