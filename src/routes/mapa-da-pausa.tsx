import { createFileRoute, redirect } from "@tanstack/react-router";

/** Endereço antigo da página "Entre Turnos": quem tiver o link salvo cai na nova. */
export const Route = createFileRoute("/mapa-da-pausa")({
  beforeLoad: () => {
    throw redirect({ to: "/entre-turnos", replace: true });
  },
});
