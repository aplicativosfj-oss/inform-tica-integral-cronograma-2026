import { createFileRoute } from "@tanstack/react-router";

import { OperacaoPlantao } from "@/components/plantao/plantao";
import { metaCompartilhar } from "@/lib/compartilhar";

/**
 * Operação: Plantão — jogo da equipe, em tela cheia.
 *
 * Página própria, em tela cheia, com menu, controles e sons próprios. Aparece
 * como um cartão no fim da Sala de Jogos.
 */
export const Route = createFileRoute("/operacao-plantao")({
  component: OperacaoPlantao,
  head: () => ({
    meta: metaCompartilhar({
      titulo: "Operação: Plantão · Sala de Jogos da Infoteca",
      descricao:
        "Operação: Plantão — missões reais, desafios todo dia. Jogo de ação para navegador e celular.",
      imagem: "/og/jogo-operacao-plantao.jpg",
      alt: "Operação: Plantão, jogo de ação da Sala de Jogos da Infoteca",
    }),
  }),
});
