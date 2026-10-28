import { createFileRoute } from "@tanstack/react-router";

import { NavBar } from "@/components/school/nav-bar";
import { MapaDaPausa } from "@/components/school/pausa/mapa-da-pausa";
import { SiteFooter } from "@/components/school/site-footer";
import { metaCompartilhar } from "@/lib/compartilhar";

export const Route = createFileRoute("/mapa-da-pausa")({
  component: MapaDaPausaPage,
  head: () => ({
    meta: metaCompartilhar({
      titulo: "Mapa da Pausa · intervalo das 11h às 13h · Escola Dr. Eiraldo",
      descricao:
        "Onde cada turma descansa, assiste a um filme ou brinca no intervalo do almoço, e quais monitores cuidam dela em cada dia da semana.",
      imagem: "/og/secao-mapa-da-pausa.jpg",
      alt: "Mapa da Pausa: sala de aula, sala de filme e sala de jogos",
    }),
  }),
});

function MapaDaPausaPage() {
  return (
    <div className="min-h-dvh bg-ink">
      <NavBar />
      <MapaDaPausa />
      <SiteFooter />
    </div>
  );
}
