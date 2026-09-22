import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CreditoFerramenta } from "@/components/school/ferramentas/credito";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { SiteFooter } from "@/components/school/site-footer";
import { encontrarFerramenta } from "@/components/school/ferramentas/registro";
import { lerProfissionalSessao, temSessaoDeApoio } from "@/lib/profissional-session";

export const Route = createFileRoute("/mediador/$turmaId/$apoioIndex/ferramentas/$ferramenta")({
  component: FerramentaAdaptadaPage,
  head: () => ({
    meta: [
      { title: "Ferramenta adaptada · Espaço do Mediador e do Cuidador" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function FerramentaAdaptadaPage() {
  const { turmaId, apoioIndex, ferramenta } = Route.useParams();
  const navigate = useNavigate();
  const indice = Number(apoioIndex);
  const info = encontrarFerramenta(ferramenta);

  // As ferramentas só abrem com um aluno em atendimento: é a sessão dele que
  // recebe o que for produzido aqui.
  useEffect(() => {
    if (!temSessaoDeApoio(turmaId, indice)) {
      navigate({ to: "/mediador" });
      return;
    }
    if (!lerProfissionalSessao()?.alunoAtendidoId) {
      toast.info("Escolha primeiro a criança que você vai atender.");
      navigate({ to: "/mediador/$turmaId/$apoioIndex", params: { turmaId, apoioIndex } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaId, indice]);

  const alunoAtendido = lerProfissionalSessao()?.alunoAtendidoNome;

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <Link
            to="/mediador/$turmaId/$apoioIndex/ferramentas"
            params={{ turmaId, apoioIndex }}
            className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Todas as ferramentas adaptadas
          </Link>

          {alunoAtendido ? (
            <p className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-foreground">
              Trabalhando com <strong>{alunoAtendido}</strong> — o que for salvo aqui vai para a
              área dele(a).
            </p>
          ) : null}

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
              <CreditoFerramenta />
            </>
          ) : (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">Ferramenta não encontrada.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link
                  to="/mediador/$turmaId/$apoioIndex/ferramentas"
                  params={{ turmaId, apoioIndex }}
                >
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
