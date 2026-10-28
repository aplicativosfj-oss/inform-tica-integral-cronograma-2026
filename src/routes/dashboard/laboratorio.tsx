import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, IdCard, MonitorSmartphone } from "lucide-react";

import { DashboardShell } from "@/components/school/dashboard-shell";
import { ControleLaboratorio } from "@/components/school/laboratorio/controle";
import { BuscaAlunos } from "@/components/school/laboratorio/ficha-aluno";
import { PainelLaboratorioAgora } from "@/components/school/laboratorio/painel-agora";
import { RelatorioUso } from "@/components/school/laboratorio/relatorio-uso";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSessoesLab } from "@/lib/laboratorio";

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

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Laboratório de informática</h1>
          <p className="text-sm text-muted-foreground">
            Marque os alunos que vão ao laboratório, defina o tempo e acompanhe quem está lá agora.
            O sistema conta quantas vezes cada aluno foi na semana e no mês e avisa quando repetir.
          </p>
        </div>

        <PainelLaboratorioAgora dados={dados} logado />

        <Tabs defaultValue="marcar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="marcar" className="gap-1.5">
              <MonitorSmartphone className="size-4" aria-hidden /> Marcar alunos
            </TabsTrigger>
            <TabsTrigger value="uso" className="gap-1.5">
              <BarChart3 className="size-4" aria-hidden /> Semana e mês
            </TabsTrigger>
            <TabsTrigger value="alunos" className="gap-1.5">
              <IdCard className="size-4" aria-hidden /> Fichas dos alunos
            </TabsTrigger>
          </TabsList>
          <TabsContent value="marcar">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Marcar alunos</CardTitle>
              </CardHeader>
              <CardContent>
                <ControleLaboratorio dados={dados} />
              </CardContent>
            </Card>
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
