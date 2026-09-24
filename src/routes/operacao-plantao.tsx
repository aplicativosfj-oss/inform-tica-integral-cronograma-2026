import { createFileRoute } from "@tanstack/react-router";

import { OperacaoPlantao } from "@/components/plantao/plantao";

/**
 * Operação: Plantão — jogo da equipe, em tela cheia.
 *
 * Página própria, em tela cheia, com menu, controles e sons próprios. Aparece
 * como um cartão no fim da Sala de Jogos.
 */
export const Route = createFileRoute("/operacao-plantao")({
  component: OperacaoPlantao,
  head: () => ({
    meta: [
      { title: "Operação: Plantão" },
      {
        name: "description",
        content:
          "Operação: Plantão — missões reais, desafios todo dia. Jogue no navegador e no celular.",
      },
    ],
  }),
});
