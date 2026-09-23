import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Unlock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { SiteFooter } from "@/components/school/site-footer";
import { CreditoFerramenta } from "@/components/school/ferramentas/credito";
import { metaCompartilhar } from "@/lib/compartilhar";
import { ferramentaPublica } from "@/lib/ferramentas-publicas";

export const Route = createFileRoute("/ferramentas/$ferramenta")({
  component: FerramentaPublicaPage,
  head: ({ params }) => {
    const info = ferramentaPublica(params.ferramenta);
    if (!info) return { meta: [{ title: "Ferramenta aberta · Infoteca" }] };
    return {
      meta: metaCompartilhar({
        titulo: `${info.titulo} · Infoteca`,
        descricao: info.descricao,
        imagem: `/og/ferramenta-${info.slug}.jpg`,
        alt: `${info.titulo}: ferramenta educativa da Infoteca`,
      }),
    };
  },
});

function FerramentaPublicaPage() {
  const { ferramenta } = Route.useParams();
  // Só abre o que está na lista pública. Uma ferramenta da Área do Aluno
  // acessada por aqui cairia sem sessão e quebraria ao tentar salvar.
  const info = ferramentaPublica(ferramenta);

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <Link
            to="/ferramentas"
            className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Todas as ferramentas abertas
          </Link>

          {info ? (
            <>
              <div className="mb-5 flex items-center gap-3">
                <span className={`flex size-11 items-center justify-center rounded-xl ${info.cor}`}>
                  <info.icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold text-foreground">
                    {info.titulo}
                    <Badge variant="secondary" className="gap-1 font-normal">
                      <Unlock className="size-3" /> acesso livre
                    </Badge>
                  </h1>
                  <p className="text-sm text-muted-foreground">{info.descricao}</p>
                </div>
              </div>
              <info.Componente />
              <CreditoFerramenta />
            </>
          ) : (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Esta ferramenta não faz parte das abertas ao público. As demais ficam na Área do
                Aluno, porque guardam o trabalho de cada criança.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/ferramentas">Ver as ferramentas abertas</Link>
              </Button>
            </div>
          )}
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
