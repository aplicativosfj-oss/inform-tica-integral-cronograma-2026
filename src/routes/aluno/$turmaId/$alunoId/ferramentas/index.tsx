import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { SiteFooter } from "@/components/school/site-footer";
import { FERRAMENTAS, type FerramentaInfo } from "@/components/school/ferramentas/registro";
import { lerAlunoSessao } from "@/lib/aluno-session";

export const Route = createFileRoute("/aluno/$turmaId/$alunoId/ferramentas/")({
  component: FerramentasHub,
  head: () => ({
    meta: [
      { title: "Ferramentas e exercícios · Agenda de Informática" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const CATEGORIAS = ["Ferramentas", "Matemática", "Português", "Nossa região"] as const;

function FerramentasHub() {
  const { turmaId, alunoId } = Route.useParams();
  const navigate = useNavigate();

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

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <Link
            to="/aluno/$turmaId/$alunoId"
            params={{ turmaId, alunoId }}
            className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Voltar para minha área
          </Link>

          <h1 className="mb-1 text-xl font-semibold text-foreground">Ferramentas e exercícios</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Pratique no seu ritmo. Escolha uma atividade abaixo para começar.
          </p>

          {CATEGORIAS.map((categoria) => {
            const itens = FERRAMENTAS.filter((f) => f.categoria === categoria);
            if (itens.length === 0) return null;
            return (
              <div key={categoria} className="mb-8">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {categoria}
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {itens.map((item) => (
                    <CardFerramenta
                      key={item.slug}
                      item={item}
                      turmaId={turmaId}
                      alunoId={alunoId}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}

function CardFerramenta({
  item,
  turmaId,
  alunoId,
}: {
  item: FerramentaInfo;
  turmaId: string;
  alunoId: string;
}) {
  return (
    <Link
      to="/aluno/$turmaId/$alunoId/ferramentas/$ferramenta"
      params={{ turmaId, alunoId, ferramenta: item.slug }}
      className="group flex cursor-pointer flex-col gap-2 rounded-xl border border-border/60 bg-card p-3.5 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <span className={`flex size-10 items-center justify-center rounded-lg ${item.cor}`}>
        <item.icon className="size-5" />
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground group-hover:text-primary">
          {item.titulo}
        </p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{item.descricao}</p>
      </div>
    </Link>
  );
}
