import { createFileRoute } from "@tanstack/react-router";

import { NavBar } from "@/components/school/nav-bar";
import { PainelPublico } from "@/components/school/resultados/painel-publico";
import { metaCompartilhar } from "@/lib/compartilhar";

export const Route = createFileRoute("/resultados")({
  component: ResultadosPublicos,
  head: () => ({
    meta: metaCompartilhar({
      titulo: "📊 Resultados do 3º bimestre · Escola Dr. Eiraldo",
      descricao:
        "📖 Leitura e escrita, ✏️ notas e 🎯 o que cada turma precisa. Por turma, sem identificar alunos.",
      imagem: "/og/secao-resultados.jpg",
      alt: "Resultados do 3º bimestre de 2026",
    }),
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
