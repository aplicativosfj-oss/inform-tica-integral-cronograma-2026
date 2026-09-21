import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { SiteFooter } from "@/components/school/site-footer";
import { FERRAMENTAS } from "@/components/school/ferramentas/registro";
import { FERRAMENTAS_ADAPTADAS } from "@/lib/profissional-acesso";
import { temSessaoDeApoio } from "@/lib/profissional-session";

export const Route = createFileRoute("/mediador/$turmaId/$apoioIndex/ferramentas/")({
  component: FerramentasAdaptadas,
  head: () => ({
    meta: [
      { title: "Ferramentas adaptadas · Espaço do Mediador e do Cuidador" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function FerramentasAdaptadas() {
  const { turmaId, apoioIndex } = Route.useParams();
  const navigate = useNavigate();
  const indice = Number(apoioIndex);

  useEffect(() => {
    if (!temSessaoDeApoio(turmaId, indice)) navigate({ to: "/mediador" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaId, indice]);

  const adaptadas = FERRAMENTAS.filter((f) =>
    (FERRAMENTAS_ADAPTADAS as readonly string[]).includes(f.slug),
  );

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <Link
            to="/mediador/$turmaId/$apoioIndex"
            params={{ turmaId, apoioIndex }}
            className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Voltar para minha área
          </Link>

          <h1 className="mb-1 text-xl font-semibold text-foreground">Ferramentas adaptadas</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Selecionadas para o atendimento especializado: funcionam por imagem, som e repetição, e
            podem ser usadas junto com a criança, sem pressa e quantas vezes for preciso.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {adaptadas.map((ferramenta) => (
              <Link
                key={ferramenta.slug}
                to="/mediador/$turmaId/$apoioIndex/ferramentas/$ferramenta"
                params={{ turmaId, apoioIndex, ferramenta: ferramenta.slug }}
                className="group flex cursor-pointer items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${ferramenta.cor}`}
                >
                  <ferramenta.icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                    {ferramenta.titulo}
                  </p>
                  <p className="text-xs text-muted-foreground">{ferramenta.descricao}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
