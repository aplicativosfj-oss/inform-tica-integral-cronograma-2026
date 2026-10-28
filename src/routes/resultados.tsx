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
          "Como as turmas da Escola Dr. Eiraldo estão lendo, escrevendo e aprendendo no 3º bimestre de 2026, com a data de cada avaliação.",
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
