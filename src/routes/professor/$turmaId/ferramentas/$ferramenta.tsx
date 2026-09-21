import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { SiteFooter } from "@/components/school/site-footer";
import { encontrarFerramenta } from "@/components/school/ferramentas/registro";

export const Route = createFileRoute("/professor/$turmaId/ferramentas/$ferramenta")({
  component: FerramentaProfessorPage,
  head: () => ({
    meta: [
      { title: "Ferramenta · Espaço do Professor" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function FerramentaProfessorPage() {
  const { turmaId, ferramenta } = Route.useParams();
  const info = encontrarFerramenta(ferramenta);

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <Link
            to="/professor/$turmaId/ferramentas"
            params={{ turmaId }}
            className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Todas as ferramentas
          </Link>

          {info ? (
            <>
              <div className="mb-5 flex items-center gap-3">
                <span className={`flex size-11 items-center justify-center rounded-xl ${info.cor}`}>
                  <info.icon className="size-5" />
                </span>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">{info.titulo}</h1>
                  <p className="text-sm text-muted-foreground">{info.descricao}</p>
                </div>
              </div>
              <info.Componente />
            </>
          ) : (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">Ferramenta não encontrada.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/professor/$turmaId/ferramentas" params={{ turmaId }}>
                  Voltar
                </Link>
              </Button>
            </div>
          )}
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
