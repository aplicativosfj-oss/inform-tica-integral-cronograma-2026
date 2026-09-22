import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { NavBar } from "@/components/school/nav-bar";
import { PainelAvaliacoes } from "@/components/school/diagnostica/painel-avaliacoes";
import { ObservatorioFrame } from "@/components/school/observatorio-frame";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProvaII } from "@/lib/diagnostica/tipos";
import { supabase } from "@/lib/supabase-client";

export const Route = createFileRoute("/avaliacao")({
  component: AvaliacaoPublica,
  head: () => ({
    meta: [
      { title: "Avaliações Diagnósticas · Escola Dr. Eiraldo" },
      {
        name: "description",
        content:
          "I e II Avaliação Diagnóstica 2026 da Escola Dr. Eiraldo Carneiro de França: quanto cada turma avançou, o que já foi aprendido e o que precisa ser retomado.",
      },
    ],
  }),
});

/**
 * Área pública das avaliações diagnósticas, com as duas aplicações no mesmo
 * lugar. A aba "Resumo" é a leitura para qualquer pessoa — famílias,
 * professores regentes, conselho — e a aba "Detalhes" guarda o observatório
 * completo da II, para quem quiser destrinchar turma, questão e habilidade.
 */
function AvaliacaoPublica() {
  const [provas, setProvas] = useState<ProvaII[] | null>(null);
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
        else setProvas(data.dados as ProvaII[]);
      });
  }, []);

  return (
    <div className="min-h-dvh bg-background">
      <NavBar />
      {erro ? (
        <p className="p-6 text-muted-foreground">{erro}</p>
      ) : provas ? (
        <Tabs defaultValue="resumo" className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <TabsList className="mb-6">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="detalhes">Detalhes da 2ª avaliação</TabsTrigger>
          </TabsList>
          <TabsContent value="resumo">
            <PainelAvaliacoes provas={provas} />
          </TabsContent>
          <TabsContent value="detalhes">
            <ObservatorioFrame
              dados={provas}
              className="h-[calc(100dvh-12rem)] min-h-[520px] w-full rounded-xl border border-border bg-background"
            />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
