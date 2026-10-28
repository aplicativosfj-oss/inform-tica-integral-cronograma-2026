import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, CalendarDays, IdCard, MonitorSmartphone, Radio } from "lucide-react";

import { DashboardShell } from "@/components/school/dashboard-shell";
import { CalendarioLab } from "@/components/school/laboratorio/calendario-lab";
import { ControleLaboratorio } from "@/components/school/laboratorio/controle";
import { BuscaAlunos } from "@/components/school/laboratorio/ficha-aluno";
import { PainelLaboratorioAgora } from "@/components/school/laboratorio/painel-agora";
import { RelatorioUso } from "@/components/school/laboratorio/relatorio-uso";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { estadoDaSessao, useAgora, useSessoesLab } from "@/lib/laboratorio";

export const Route = createFileRoute("/dashboard/laboratorio")({
  component: LaboratorioPage,
  head: () => ({
    meta: [
      { title: "Laboratório · Painel de gestão" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function LaboratorioPage() {
  const dados = useSessoesLab();
  const agora = useAgora(15_000);
  const noLab = new Set(
    dados.sessoes.filter((s) => estadoDaSessao(s, agora) === "ao-vivo").map((s) => s.alunoId),
  ).size;

  return (
    <DashboardShell>
      <div className="flex flex-col gap-3">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold">Laboratório de informática</h1>
            <p className="text-xs text-muted-foreground">
              Marque quem vai, acompanhe quem está lá e veja quem precisa ir.
            </p>
          </div>
          <p
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${noLab > 0 ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"}`}
          >
            <span className="relative flex size-2">
              <span
                className={`absolute inline-flex size-full rounded-full ${noLab > 0 ? "animate-ping bg-emerald-400" : "bg-muted-foreground/40"}`}
              />
              <span
                className={`relative inline-flex size-2 rounded-full ${noLab > 0 ? "bg-emerald-500" : "bg-muted-foreground/60"}`}
              />
            </span>
            {noLab > 0
              ? `${noLab} aluno${noLab === 1 ? "" : "s"} no laboratório agora`
              : "Laboratório livre agora"}
          </p>
        </header>

        <Tabs defaultValue="marcar" className="space-y-3">
          <TabsList>
            <TabsTrigger value="marcar" className="gap-1.5">
              <MonitorSmartphone className="size-4" aria-hidden /> Marcar alunos
            </TabsTrigger>
            <TabsTrigger value="aovivo" className="gap-1.5">
              <Radio className="size-4" aria-hidden /> Ao vivo
            </TabsTrigger>
            <TabsTrigger value="uso" className="gap-1.5">
              <BarChart3 className="size-4" aria-hidden /> Semana e mês
            </TabsTrigger>
            <TabsTrigger value="calendario" className="gap-1.5">
              <CalendarDays className="size-4" aria-hidden /> Calendário e relatório
            </TabsTrigger>
            <TabsTrigger value="alunos" className="gap-1.5">
              <IdCard className="size-4" aria-hidden /> Fichas dos alunos
            </TabsTrigger>
          </TabsList>
          <TabsContent value="marcar">
            {/* Tudo numa janela só: a lista de alunos rola por dentro. */}
            <ControleLaboratorio
              dados={dados}
              className="lg:h-[calc(100svh-12.5rem)] lg:min-h-[28rem]"
            />
          </TabsContent>
          <TabsContent value="aovivo">
            <PainelLaboratorioAgora dados={dados} logado />
          </TabsContent>
          <TabsContent value="calendario">
            <CalendarioLab />
          </TabsContent>
          <TabsContent value="alunos">
            <BuscaAlunos />
          </TabsContent>
          <TabsContent value="uso">
            <RelatorioUso dados={dados} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
