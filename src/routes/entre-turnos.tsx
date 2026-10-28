import { createFileRoute } from "@tanstack/react-router";

import { NavBar } from "@/components/school/nav-bar";
import { EntreTurnos } from "@/components/school/pausa/entre-turnos";
import { SiteFooter } from "@/components/school/site-footer";
import { metaCompartilhar } from "@/lib/compartilhar";

export const Route = createFileRoute("/entre-turnos")({
  component: EntreTurnosPage,
  head: () => ({
    meta: metaCompartilhar({
      titulo: "Entre Turnos · intervalo das 11h às 13h · Escola Dr. Eiraldo",
      descricao:
        "Onde cada turma descansa, assiste a um filme ou brinca no intervalo do almoço, e quais monitores cuidam dela em cada dia da semana.",
      imagem: "/og/secao-entre-turnos.jpg",
      alt: "Entre Turnos, das 11h às 13h: sala de aula, sala de filme e sala de jogos",
    }),
  }),
});

function EntreTurnosPage() {
  return (
    <div className="min-h-dvh bg-background">
      <NavBar />
      <EntreTurnos />
      <SiteFooter />
    </div>
  );
}
