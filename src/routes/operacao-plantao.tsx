import { createFileRoute } from "@tanstack/react-router";

import { OperacaoPlantao } from "@/components/plantao/plantao";

/**
 * Operação: Plantão — jogo da equipe, em tela cheia.
 *
 * Fica numa página própria, fora dos menus do site e fora dos buscadores
 * (`noindex`): é um jogo para a equipe, não faz parte da Sala de Jogos dos
 * alunos. Quem tem o link joga.
 */
export const Route = createFileRoute("/operacao-plantao")({
  component: OperacaoPlantao,
  head: () => ({
    meta: [
      { title: "Operação: Plantão" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content:
          "Operação: Plantão — missões reais, desafios todo dia. Jogue no navegador e no celular.",
      },
    ],
  }),
});
