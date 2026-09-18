import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, ChevronRight, Clock3, Users2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LiveSessionPanel } from "@/components/school/live-session-panel";
import { NavBar } from "@/components/school/nav-bar";
import { PreviaAlunosDialog } from "@/components/school/previa-alunos-dialog";
import { SiteFooter } from "@/components/school/site-footer";
import { useAppStore } from "@/lib/app-store";
import {
  buildGrupos,
  buildWeeklySchedule,
  currentWeekdayLabel,
  proximaDataDoDia,
  proximasDatasDoDia,
  reprogramacoesParaData,
  suspensaoKey,
  toDateKey,
} from "@/lib/schedule-engine";
import type { Assignment } from "@/lib/types";
import agendaHeroImg from "@/assets/image6.jpeg";

export const Route = createFileRoute("/agenda")({
  component: AgendaPage,
  head: () => ({
    meta: [
      { title: "Agenda semanal · Agenda de Informática" },
      {
        name: "description",
        content:
          "Veja o horário completo das aulas de informática por turma, dia da semana e professor(a) — atualizado automaticamente.",
      },
      { property: "og:title", content: "Agenda semanal · Agenda de Informática" },
      {
        property: "og:description",
        content: "Horário completo das aulas de informática por turma, dia e professor(a).",
      },
    ],
  }),
});

function AgendaPage() {
  const { turmas, config } = useAppStore();
  const assignments = useMemo(() => buildWeeklySchedule(turmas, config), [turmas, config]);
  const todayLabel = useMemo(() => currentWeekdayLabel(new Date()), []);
  const [diaSelecionado, setDiaSelecionado] = useState(
    config.diasSemana.includes(todayLabel) ? todayLabel : (config.diasSemana[0] ?? ""),
  );
  const [assignmentSelecionado, setAssignmentSelecionado] = useState<Assignment | null>(null);

  const dataDoDia = useMemo(() => proximaDataDoDia(diaSelecionado, new Date()), [diaSelecionado]);
  const dataDoDiaKey = toDateKey(dataDoDia);
  const reprogramadasDoDia = useMemo(
    () => reprogramacoesParaData(turmas, config, dataDoDia),
    [turmas, config, dataDoDia],
  );
  const assignmentsDoDia = [
    ...assignments.filter(
      (a) =>
        a.dia === diaSelecionado &&
        !config.suspensoes?.[suspensaoKey(dataDoDiaKey, a.dia, a.slot.inicio)],
    ),
    ...reprogramadasDoDia,
  ].sort((a, b) => a.slot.inicio.localeCompare(b.slot.inicio));
  const dataDoDiaFormatada = dataDoDia.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });
  const dataCurta = (dia: string) =>
    proximaDataDoDia(dia, new Date()).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url(${agendaHeroImg})` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-background via-background/95 to-primary/10"
        />
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-1.5">
            <Badge variant="secondary" className="w-fit gap-1.5">
              <CalendarDays className="size-3.5" /> Agenda semanal
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Cronograma de aulas de informática
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Toque numa turma para ver os alunos previstos. Revezamento automático de{" "}
              {config.horaInicio} às {config.horaFim}, com o professor {config.professorInformatica}.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-4">
          <LiveSessionPanel />
        </div>

        <Tabs value={diaSelecionado} onValueChange={setDiaSelecionado}>
          <TabsList className="mb-3 flex h-auto flex-wrap justify-start gap-1.5 bg-transparent p-0">
            {config.diasSemana.map((dia) => (
              <TabsTrigger
                key={dia}
                value={dia}
                className="flex-col gap-0 rounded-xl border border-border/60 px-4 py-1.5 leading-tight data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span>
                  {dia}
                  {dia === todayLabel ? " · hoje" : ""}
                </span>
                <span className="font-mono text-[10px] opacity-70">{dataCurta(dia)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <p className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarDays className="size-4" />
          {diaSelecionado}, {dataDoDiaFormatada}
        </p>

        {assignmentsDoDia.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma turma programada para {diaSelecionado}.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {assignmentsDoDia.map((assignment) => {
              const grupos = buildGrupos(assignment.turma, config);
              return (
                <button
                  key={`${assignment.dia}-${assignment.slot.inicio}`}
                  type="button"
                  onClick={() => setAssignmentSelecionado(assignment)}
                  className="group flex flex-col rounded-xl border border-border/60 bg-card p-4 text-left shadow-sm transition-[transform,border-color,box-shadow] duration-200 ease-out [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:border-primary/40 [@media(hover:hover)]:hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    {assignment.turma.imagem ? (
                      <img
                        src={assignment.turma.imagem}
                        alt=""
                        className="size-11 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                        {assignment.turma.letra}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {assignment.turma.serie} &quot;{assignment.turma.letra}&quot;
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        Prof(a). {assignment.turma.professorRegente}
                      </p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                    <span className="flex items-center gap-1.5 font-mono font-medium text-foreground">
                      <Clock3 className="size-3.5 text-primary" />
                      {assignment.slot.inicio} – {assignment.slot.fim}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users2 className="size-3.5" />
                      {assignment.turma.alunos.length} · {grupos.length}{" "}
                      {grupos.length === 1 ? "grupo" : "grupos"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <SiteFooter />

      <PreviaAlunosDialog
        assignment={assignmentSelecionado}
        data={dataDoDia}
        onOpenChange={(open) => {
          if (!open) setAssignmentSelecionado(null);
        }}
      />
    </div>
  );
}
