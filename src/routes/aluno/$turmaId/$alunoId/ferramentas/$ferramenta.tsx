import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { SiteFooter } from "@/components/school/site-footer";
import { encontrarFerramenta } from "@/components/school/ferramentas/registro";
import { lerAlunoSessao } from "@/lib/aluno-session";

export const Route = createFileRoute("/aluno/$turmaId/$alunoId/ferramentas/$ferramenta")({
  component: FerramentaPage,
  head: () => ({
    meta: [
      { title: "Ferramentas e exercícios · Agenda de Informática" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function FerramentaPage() {
  const { turmaId, alunoId, ferramenta } = Route.useParams();
  const navigate = useNavigate();
  const info = encontrarFerramenta(ferramenta);

  useEffect(() => {
    const sessao = lerAlunoSessao();
    if (!sessao || sessao.alunoId !== alunoId || sessao.turmaId !== turmaId) {
      navigate({ to: "/aluno/$turmaId", params: { turmaId } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alunoId, turmaId]);

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <Link
            to="/aluno/$turmaId/$alunoId/ferramentas"
            params={{ turmaId, alunoId }}
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
                <Link to="/aluno/$turmaId/$alunoId/ferramentas" params={{ turmaId, alunoId }}>
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
