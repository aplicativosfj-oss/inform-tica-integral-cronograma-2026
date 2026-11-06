import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { transicaoPadrao } from "./lib/transicao-telas";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Carrega a rota ao passar o mouse (ou ao encostar, no celular). Quando o
    // clique chega, o código já está em memória e a troca é imediata.
    defaultPreload: "intent",
    // Com 0 o preload era descartado na hora e o clique baixava tudo de novo.
    defaultPreloadStaleTime: 30_000,
    // Só mostra estado de carregando se a troca passar de 150ms — abaixo disso
    // o respingo de "carregando" atrapalha mais do que a espera.
    defaultPendingMs: 150,
    defaultPendingMinMs: 300,
    // No celular, as telas deslizam como num aplicativo (ver transicao-telas.ts).
    defaultViewTransition: transicaoPadrao(),
  });

  return router;
};
