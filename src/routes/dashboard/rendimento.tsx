import { createFileRoute } from "@tanstack/react-router";

import { QuadroReferencia } from "@/components/school/resultados/quadro-referencia";
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
      <div className="space-y-6">
        <QuadroReferencia ids={["rendimento", "diagnostica"]} />
        <PainelRendimento />
      </div>
    </DashboardShell>
  );
}
