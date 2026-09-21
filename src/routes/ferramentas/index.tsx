import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Unlock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { SiteFooter } from "@/components/school/site-footer";
import { listarFerramentasPublicas } from "@/lib/ferramentas-publicas";

export const Route = createFileRoute("/ferramentas/")({
  component: FerramentasPublicas,
  head: () => ({
    meta: [
      { title: "Ferramentas abertas · Infoteca" },
      {
        name: "description",
        content:
          "Ferramentas educativas da Infoteca abertas a qualquer pessoa: use direto no navegador, sem login e sem instalar nada.",
      },
      { property: "og:title", content: "Ferramentas abertas · Infoteca" },
      {
        property: "og:description",
        content: "Ferramentas educativas para usar direto no navegador, sem login.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
});

function FerramentasPublicas() {
  const ferramentas = listarFerramentasPublicas();

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <Link
            to="/infoteca"
            className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Voltar para a Infoteca
          </Link>

          <Badge className="mb-2 w-fit gap-1.5">
            <Unlock className="size-3.5" /> Acesso livre
          </Badge>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Ferramentas abertas</h1>
          <p className="mb-6 mt-1 max-w-2xl text-sm text-muted-foreground">
            Estas ferramentas são as mesmas que os alunos usam no laboratório, liberadas para
            qualquer pessoa — aluno em casa, pai, mãe ou professor de outra escola. Funcionam no
            navegador, sem login, sem instalar nada e sem guardar nada seu.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ferramentas.map((ferramenta) => (
              <Link
                key={ferramenta.slug}
                to="/ferramentas/$ferramenta"
                params={{ ferramenta: ferramenta.slug }}
                className="group flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
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

          <p className="mt-6 text-xs text-muted-foreground">
            As demais ferramentas da escola (editor de texto, planilha, jogos de alfabetização e
            matemática) ficam na Área do Aluno, porque guardam o trabalho de cada criança na pasta
            dela.
          </p>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
