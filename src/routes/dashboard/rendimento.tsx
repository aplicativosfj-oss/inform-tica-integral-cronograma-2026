import { createFileRoute } from "@tanstack/react-router";

import { DashboardShell } from "@/components/school/dashboard-shell";
import { PainelRendimento } from "@/components/school/rendimento/painel";

export const Route = createFileRoute("/dashboard/rendimento")({
  component: RendimentoPage,
  head: () => ({
    meta: [
      { title: "Rendimento bimestral · Painel de gestão" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function RendimentoPage() {
  return (
    <DashboardShell>
      <PainelRendimento />
    </DashboardShell>
  );
}
