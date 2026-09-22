import { createFileRoute, redirect } from "@tanstack/react-router";

// A evolução deixou de ter página própria: as duas avaliações agora vivem
// juntas em /avaliacao. O endereço antigo continua valendo para quem salvou
// o link ou compartilhou.
export const Route = createFileRoute("/evolucao")({
  beforeLoad: () => {
    throw redirect({ to: "/avaliacao" });
  },
});
