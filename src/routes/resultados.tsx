import { createFileRoute } from "@tanstack/react-router";

import { NavBar } from "@/components/school/nav-bar";
import { PainelPublico } from "@/components/school/resultados/painel-publico";

export const Route = createFileRoute("/resultados")({
  component: ResultadosPublicos,
  head: () => ({
    meta: [
      { title: "Resultados do 3º bimestre · Escola Dr. Eiraldo" },
      {
        name: "description",
        content:
          "Resultados do 3º bimestre de 2026 da Escola Dr. Eiraldo Carneiro de França: mapa de leitura e escrita por turma e notas do bimestre, com a data de cada aplicação.",
      },
    ],
  }),
});

function ResultadosPublicos() {
  return (
    <div className="min-h-dvh bg-background">
      <NavBar />
      <PainelPublico />
    </div>
  );
}
