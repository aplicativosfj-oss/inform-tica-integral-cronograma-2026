import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
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

  // O painel ocupa a tela inteira abaixo do menu e rola por dentro:
  // assim há uma rolagem só e as janelas de detalhe ficam centralizadas.
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <NavBar />
      {erro ? (
        <p className="p-6 text-muted-foreground">{erro}</p>
      ) : dados ? (
        <ObservatorioFrame dados={dados} className="min-h-0 w-full flex-1 border-0 bg-background" />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
