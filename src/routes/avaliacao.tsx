import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, ListChecks, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { NavBar } from "@/components/school/nav-bar";
import { PainelAvaliacoes } from "@/components/school/diagnostica/painel-avaliacoes";
import { ObservatorioFrame } from "@/components/school/observatorio-frame";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProvaII } from "@/lib/diagnostica/tipos";
import { supabase } from "@/lib/supabase-client";
import { cn } from "@/lib/utils";

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
type AbaAvaliacao = "resumo" | "detalhes";

function AvaliacaoPublica() {
  const [provas, setProvas] = useState<ProvaII[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aba, setAba] = useState<AbaAvaliacao>("resumo");

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

  /** Manda o Resumo abrir os Detalhes já numa sub-aba específica (o
   *  observatório lê essa chave sozinho ao montar). */
  function abrirDetalhes(subAba?: string) {
    if (subAba) {
      try {
        sessionStorage.setItem("obs.tab", subAba);
      } catch {
        /* sessionStorage pode falhar em aba anônima — segue sem deep-link */
      }
    }
    setAba("detalhes");
  }

  return (
    <div className="min-h-dvh bg-background">
      <NavBar />
      {erro ? (
        <p className="p-6 text-muted-foreground">{erro}</p>
      ) : provas ? (
        <Tabs
          value={aba}
          onValueChange={(v) => setAba(v as AbaAvaliacao)}
          className="mx-auto max-w-7xl px-4 py-6 sm:px-6"
        >
          <TabsList className="mb-6 h-auto gap-1.5 rounded-full border border-border/60 bg-muted/40 p-1.5 backdrop-blur-md">
            <TabsTrigger
              value="resumo"
              className={cn(
                "gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground",
                "data-[state=active]:border-blue-400/30 data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-700",
                "dark:data-[state=active]:border-blue-400/25 dark:data-[state=active]:bg-blue-400/10 dark:data-[state=active]:text-blue-200",
                "data-[state=active]:shadow-sm data-[state=active]:backdrop-blur-md",
              )}
            >
              <BarChart3 className="size-4" /> Resumo
            </TabsTrigger>
            <TabsTrigger
              value="detalhes"
              className={cn(
                "gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground",
                "data-[state=active]:border-violet-400/30 data-[state=active]:bg-violet-500/10 data-[state=active]:text-violet-700",
                "dark:data-[state=active]:border-violet-400/25 dark:data-[state=active]:bg-violet-400/10 dark:data-[state=active]:text-violet-200",
                "data-[state=active]:shadow-sm data-[state=active]:backdrop-blur-md",
              )}
            >
              <ListChecks className="size-4" /> Detalhes da 2ª avaliação
            </TabsTrigger>
          </TabsList>
          <TabsContent value="resumo">
            <PainelAvaliacoes provas={provas} comAlunos aoAbrirDetalhes={abrirDetalhes} />
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
