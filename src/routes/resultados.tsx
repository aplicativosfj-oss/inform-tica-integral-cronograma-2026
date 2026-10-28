import { createFileRoute } from "@tanstack/react-router";

import { NavBar } from "@/components/school/nav-bar";
import { PainelPublico } from "@/components/school/resultados/painel-publico";
import { metaCompartilhar } from "@/lib/compartilhar";

export const Route = createFileRoute("/resultados")({
  component: ResultadosPublicos,
  head: () => ({
    meta: metaCompartilhar({
      titulo: "Resultados do 3º bimestre · Escola Dr. Eiraldo",
      descricao:
        "Como as turmas da Escola Dr. Eiraldo estão lendo, escrevendo e aprendendo no 3º bimestre de 2026, comparado com o 1º e o 2º bimestre e com as duas avaliações diagnósticas.",
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
