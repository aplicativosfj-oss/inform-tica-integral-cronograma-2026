import { createFileRoute } from "@tanstack/react-router";

import { DashboardShell } from "@/components/school/dashboard-shell";
import { PainelEvolucao } from "@/components/school/diagnostica/painel";

export const Route = createFileRoute("/dashboard/evolucao")({
  component: EvolucaoPage,
  head: () => ({
    meta: [
      { title: "Evolução diagnóstica · Painel de gestão" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function EvolucaoPage() {
  return (
    <DashboardShell>
      <PainelEvolucao />
    </DashboardShell>
  );
}
