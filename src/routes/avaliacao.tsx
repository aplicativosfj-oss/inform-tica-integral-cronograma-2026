import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { NavBar } from "@/components/school/nav-bar";
import { ObservatorioFrame } from "@/components/school/observatorio-frame";
import { supabase } from "@/lib/supabase-client";

export const Route = createFileRoute("/avaliacao")({
  component: AvaliacaoPublica,
  head: () => ({
    meta: [
      { title: "Avaliação Diagnóstica · Escola Dr. Eiraldo" },
      {
        name: "description",
        content:
          "Resultados da II Avaliação Diagnóstica 2026 dos anos iniciais: turmas, disciplinas e habilidades.",
      },
    ],
  }),
});

function AvaliacaoPublica() {
  const [dados, setDados] = useState<unknown>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("avaliacao_diagnostica")
      .select("dados")
      .eq("id", "2026-II-publico")
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setErro(error.message);
        else if (!data) setErro("Os resultados ainda não foram publicados.");
        else setDados(data.dados);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="mx-auto max-w-[1400px] px-4 py-6">
        <h1 className="mb-4 flex items-center gap-2 text-2xl font-bold tracking-tight">
          <BarChart3 className="size-6 text-primary" /> II Avaliação Diagnóstica 2026
        </h1>
        {erro ? (
          <p className="text-muted-foreground">{erro}</p>
        ) : dados ? (
          <ObservatorioFrame
            dados={dados}
            className="h-[calc(100vh-9rem)] min-h-[600px] w-full rounded-xl border border-border bg-background"
          />
        ) : (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </main>
    </div>
  );
}
