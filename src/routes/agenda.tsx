import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck2 } from "lucide-react";

import { PainelLaboratorioAgora } from "@/components/school/laboratorio/painel-agora";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { SiteFooter } from "@/components/school/site-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-store";
import { imagemCompartilhar } from "@/lib/compartilhar";
import {
  agruparSessoes,
  fimDaSemana,
  hojeNaEscola,
  horaNaEscola,
  inicioDaSemana,
  nomeExibido,
  useSessoesLab,
} from "@/lib/laboratorio";

export const Route = createFileRoute("/agenda")({
  component: AgendaPage,
  head: () => ({
    meta: [
      ...imagemCompartilhar("/og/secao-agenda.jpg", "Laboratório de informática"),
      { title: "O laboratório ao vivo · Informática Dr. Eiraldo" },
      {
        name: "description",
        content:
          "Veja quem está no laboratório de informática agora e quem já foi nos outros dias da semana.",
      },
    ],
  }),
});

const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

function rotuloDoDia(chave: string) {
  const [y, m, d] = chave.split("-").map(Number);
  const dia = DIAS[new Date(y!, m! - 1, d!).getDay()]!;
  return `${dia}, ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

function AgendaPage() {
  const { isAuthenticated } = useAuth();
  const dados = useSessoesLab();
  const hoje = hojeNaEscola();
  const s0 = inicioDaSemana(hoje);
  const s1 = fimDaSemana(hoje);

  const daSemana = dados.sessoes.filter((s) => s.data >= s0 && s.data <= s1);
  const dias = [...new Set(daSemana.map((s) => s.data))].sort().reverse();

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />
        <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">O laboratório, ao vivo</h1>
            <p className="mt-1 text-muted-foreground">
              Todo dia o professor escolhe quem vai ao laboratório. Aqui você vê quem está lá agora,
              até que horas e quem já passou por lá nesta semana.
            </p>
          </div>

          <PainelLaboratorioAgora dados={dados} logado={isAuthenticated} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarCheck2 className="size-5 text-primary" aria-hidden /> Nesta semana
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dias.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ninguém foi ao laboratório nesta semana, por enquanto.
                </p>
              ) : (
                dias.map((dia) => (
                  <section key={dia} className="space-y-1.5">
                    <h2 className="text-sm font-semibold capitalize">{rotuloDoDia(dia)}</h2>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {agruparSessoes(daSemana.filter((s) => s.data === dia)).map((g) => (
                        <li key={g.grupoId}>
                          <strong className="text-foreground">{g.turmaRotulo}</strong> ·{" "}
                          {horaNaEscola(g.inicio)}–{horaNaEscola(g.fim)} ·{" "}
                          {g.alunos.map((a) => nomeExibido(a.nome, isAuthenticated)).join(", ")}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))
              )}
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
