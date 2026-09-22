import { createFileRoute } from "@tanstack/react-router";

import { NavBar } from "@/components/school/nav-bar";
import { PainelEvolucao } from "@/components/school/diagnostica/painel";

export const Route = createFileRoute("/evolucao")({
  component: EvolucaoPublica,
  head: () => ({
    meta: [
      { title: "Evolução diagnóstica · Escola Dr. Eiraldo" },
      {
        name: "description",
        content:
          "I e II Avaliação Diagnóstica 2026 da Escola Dr. Eiraldo Carneiro de França: evolução de cada turma, pontos fortes e habilidades a retomar.",
      },
    ],
  }),
});

/** Versão aberta: resultados por turma, sem nome de aluno. */
function EvolucaoPublica() {
  return (
    <div className="min-h-dvh bg-background">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <PainelEvolucao publico />
      </main>
    </div>
  );
}
