import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * O guia de descritores passou a morar dentro da área de Avaliações, como a
 * terceira aba. Esta rota fica de pé só para não quebrar link já divulgado:
 * manda para a aba certa e sai do caminho.
 */
export const Route = createFileRoute("/descritores")({
  beforeLoad: () => {
    throw redirect({ to: "/avaliacao", search: { aba: "descritores" }, replace: true });
  },
});
