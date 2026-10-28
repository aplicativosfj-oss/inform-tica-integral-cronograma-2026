import { createFileRoute } from "@tanstack/react-router";

import { PainelAgenda } from "@/components/school/agenda/painel-agenda";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { SiteFooter } from "@/components/school/site-footer";
import { useAuth } from "@/lib/auth-store";
import { imagemCompartilhar } from "@/lib/compartilhar";

export const Route = createFileRoute("/agenda")({
  component: AgendaPage,
  head: () => ({
    meta: [
      ...imagemCompartilhar("/og/secao-agenda.jpg", "Laboratório de informática"),
      { title: "O laboratório ao vivo · Informática Dr. Eiraldo" },
      {
        name: "description",
        content:
          "Veja quem está no laboratório de informática agora, quem já foi nos outros dias da semana e o placar das turmas.",
      },
    ],
  }),
});

function AgendaPage() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />
        <main>
          <PainelAgenda logado={isAuthenticated} />
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
