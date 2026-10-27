import { createFileRoute } from "@tanstack/react-router";

import { DashboardShell } from "@/components/school/dashboard-shell";
import { PainelMapaClasse } from "@/components/school/mapa-classe/painel";

export const Route = createFileRoute("/dashboard/mapa-classe")({
  component: MapaClassePage,
  head: () => ({
    meta: [
      { title: "Mapa de classe · Painel de gestão" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function MapaClassePage() {
  return (
    <DashboardShell>
      <PainelMapaClasse />
    </DashboardShell>
  );
}
