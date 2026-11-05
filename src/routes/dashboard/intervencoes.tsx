import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ClipboardCheck } from "lucide-react";

import { DashboardShell } from "@/components/school/dashboard-shell";
import { AvaliacaoContinuaLeituraEscrita } from "@/components/school/diagnostica/avaliacao-continua";

export const Route = createFileRoute("/dashboard/intervencoes")({
  component: IntervencoesPage,
  head: () => ({
    meta: [
      { title: "Intervenções pedagógicas · Painel de gestão" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function IntervencoesPage() {
  return (
    <DashboardShell>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Gestão pedagógica</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            <ClipboardCheck className="size-6 text-primary" /> Acompanhamento individual das intervenções
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Registre avaliações, gere planos de apoio, documente atividades realizadas e compare cada nova evidência com a linha de base do aluno.
          </p>
        </div>
        <Link to="/dashboard/mapa-classe" className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold transition hover:bg-muted">
          <ArrowLeft className="size-4" /> Voltar ao mapa de classe
        </Link>
      </div>
      <AvaliacaoContinuaLeituraEscrita />
    </DashboardShell>
  );
}
