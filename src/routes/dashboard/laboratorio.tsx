import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  IdCard,
  MonitorSmartphone,
  Radio,
  Search,
  Users2,
} from "lucide-react";

import { DashboardShell } from "@/components/school/dashboard-shell";
import { AniversariantesHoje } from "@/components/school/laboratorio/aniversariantes";
import { CalendarioLab } from "@/components/school/laboratorio/calendario-lab";
import { ControleLaboratorio } from "@/components/school/laboratorio/controle";
import { BuscaAlunos } from "@/components/school/laboratorio/ficha-aluno";
import { PainelLaboratorioAgora } from "@/components/school/laboratorio/painel-agora";
import { FrequenciaLab } from "@/components/school/laboratorio/frequencia-lab";
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

const ABAS = [
  { valor: "marcar", icone: MonitorSmartphone, curto: "Marcar", rotulo: "Marcar alunos" },
  { valor: "uso", icone: ClipboardCheck, curto: "Frequência", rotulo: "Frequência" },
  { valor: "aovivo", icone: Radio, curto: "Ao vivo", rotulo: "Ao vivo" },
  { valor: "calendario", icone: CalendarDays, curto: "Agenda", rotulo: "Calendário e relatório" },
  { valor: "alunos", icone: IdCard, curto: "Fichas", rotulo: "Fichas dos alunos" },
] as const;

const CADASTROS = [
  { para: "/dashboard/turmas", icone: Users2, rotulo: "Turmas e alunos" },
  { para: "/dashboard/alunos", icone: Search, rotulo: "Buscar aluno" },
  { para: "/dashboard/aulas", icone: Clock3, rotulo: "Aulas e horários" },
] as const;

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

        <AniversariantesHoje />

        <Tabs defaultValue="marcar" className="space-y-3">
          {/* Área do professor: as tarefas do laboratório em botões grandes,
              fáceis de tocar no celular, e os cadastros logo abaixo. */}
          <nav
            aria-label="Área do professor"
            className="space-y-2.5 rounded-2xl border bg-card/60 p-2.5 sm:p-3"
          >
            <TabsList className="grid h-auto w-full grid-cols-5 gap-1 bg-transparent p-0 sm:flex sm:w-auto sm:justify-start sm:bg-muted sm:p-1">
              {ABAS.map(({ valor, icone: Icone, curto, rotulo }) => (
                <TabsTrigger
                  key={valor}
                  value={valor}
                  className="h-auto flex-col gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold data-[state=active]:bg-indigo-600 data-[state=active]:text-white sm:flex-row sm:gap-1.5 sm:rounded-md sm:px-3 sm:py-1 sm:text-sm sm:font-medium"
                >
                  <Icone className="size-5 sm:size-4" aria-hidden />
                  <span className="sm:hidden">{curto}</span>
                  <span className="hidden sm:inline">{rotulo}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="-mx-2.5 flex gap-2 overflow-x-auto px-2.5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
              <span className="flex shrink-0 items-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Cadastros
              </span>
              {CADASTROS.map(({ para, icone: Icone, rotulo }) => (
                <Link
                  key={para}
                  to={para}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-semibold transition hover:border-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  <Icone className="size-3.5" aria-hidden />
                  {rotulo}
                  <ChevronRight className="size-3.5 opacity-50" aria-hidden />
                </Link>
              ))}
            </div>
          </nav>
          <TabsContent value="marcar">
            <ControleLaboratorio dados={dados} />
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
            <FrequenciaLab dados={dados} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
