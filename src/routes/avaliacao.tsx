import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Compass, ListChecks, Loader2, Users2 } from "lucide-react";
import { useEffect, useState } from "react";

import { NavBar } from "@/components/school/nav-bar";
import { GuiaDescritores } from "@/components/school/diagnostica/guia-descritores";
import { MapaDaTurma } from "@/components/school/diagnostica/mapa-turma";
import { PainelAvaliacoes } from "@/components/school/diagnostica/painel-avaliacoes";
import { ObservatorioFrame } from "@/components/school/observatorio-frame";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProvaII } from "@/lib/diagnostica/tipos";
import { supabase } from "@/lib/supabase-client";
import { cn } from "@/lib/utils";

const ABAS = ["resumo", "mapa", "detalhes", "descritores"] as const;
type AbaAvaliacao = (typeof ABAS)[number];

function abaValida(v: unknown): v is AbaAvaliacao {
  return typeof v === "string" && (ABAS as readonly string[]).includes(v);
}

export const Route = createFileRoute("/avaliacao")({
  validateSearch: (search: Record<string, unknown>): { aba?: AbaAvaliacao } =>
    abaValida(search["aba"]) ? { aba: search["aba"] } : {},
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
 * A aba "Guia de habilidades" fecha o conjunto: o que cada descritor cobrado
 * espera da criança, como avaliar e o que fazer com quem ainda não chegou lá.
 */
function AvaliacaoPublica() {
  const { aba: abaUrl } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [provas, setProvas] = useState<ProvaII[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const aba: AbaAvaliacao = abaUrl ?? "resumo";

  /** A aba fica na URL para poder ser linkada de fora (Infoteca, cards do
   *  Resumo) e sobreviver a um refresh. */
  function setAba(proxima: AbaAvaliacao) {
    void navigate({ search: proxima === "resumo" ? {} : { aba: proxima }, replace: true });
  }

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
            <TabsTrigger
              value="mapa"
              className={cn(
                "gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground",
                "data-[state=active]:border-emerald-400/30 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-800",
                "dark:data-[state=active]:border-emerald-400/25 dark:data-[state=active]:bg-emerald-400/10 dark:data-[state=active]:text-emerald-200",
                "data-[state=active]:shadow-sm data-[state=active]:backdrop-blur-md",
              )}
            >
              <Users2 className="size-4" /> Mapa da turma
            </TabsTrigger>
            <TabsTrigger
              value="descritores"
              className={cn(
                "gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground",
                "data-[state=active]:border-indigo-400/30 data-[state=active]:bg-indigo-500/10 data-[state=active]:text-indigo-700",
                "dark:data-[state=active]:border-indigo-400/25 dark:data-[state=active]:bg-indigo-400/10 dark:data-[state=active]:text-indigo-200",
                "data-[state=active]:shadow-sm data-[state=active]:backdrop-blur-md",
              )}
            >
              <Compass className="size-4" /> Guia de habilidades
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
          <TabsContent value="mapa">
            <MapaDaTurma provas={provas} />
          </TabsContent>
          <TabsContent value="descritores">
            <GuiaDescritores />
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
