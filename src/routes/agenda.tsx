import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Clock3, User2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LiveSessionPanel } from "@/components/school/live-session-panel";
import { NavBar } from "@/components/school/nav-bar";
import { useAppStore } from "@/lib/app-store";
import { buildGrupos, buildWeeklySchedule, currentWeekdayLabel } from "@/lib/schedule-engine";

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

  const assignmentsDoDia = assignments
    .filter((a) => a.dia === diaSelecionado)
    .sort((a, b) => a.slot.inicio.localeCompare(b.slot.inicio));

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-2">
          <Badge variant="secondary" className="w-fit gap-1.5">
            <CalendarDays className="size-3.5" /> Agenda semanal
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Cronograma de aulas de informática
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Todas as turmas revezam automaticamente ao longo da semana, de {config.horaInicio} às{" "}
            {config.horaFim}, com o professor {config.professorInformatica}.
          </p>
        </div>

        <div className="mb-8">
          <LiveSessionPanel />
        </div>

        <Tabs value={diaSelecionado} onValueChange={setDiaSelecionado}>
          <TabsList className="mb-4 flex h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
            {config.diasSemana.map((dia) => (
              <TabsTrigger
                key={dia}
                value={dia}
                className="rounded-full border border-border/60 px-4 py-1.5 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {dia}
                {dia === todayLabel ? " · hoje" : ""}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock3 className="size-4" /> {diaSelecionado}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Horário</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Professor(a) regente</TableHead>
                    <TableHead className="text-right">Alunos / grupos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignmentsDoDia.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        Nenhuma turma cadastrada ainda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    assignmentsDoDia.map((assignment) => {
                      const grupos = buildGrupos(assignment.turma, config);
                      return (
                        <TableRow key={`${assignment.dia}-${assignment.slot.inicio}`}>
                          <TableCell className="font-mono text-sm">
                            {assignment.slot.inicio} – {assignment.slot.fim}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {assignment.turma.imagem ? (
                                <img
                                  src={assignment.turma.imagem}
                                  alt=""
                                  className="size-8 rounded-md object-cover"
                                />
                              ) : (
                                <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-secondary-foreground">
                                  {assignment.turma.letra}
                                </span>
                              )}
                              <span className="font-medium text-foreground">
                                {assignment.turma.serie} "{assignment.turma.letra}"
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <User2 className="size-3.5" /> {assignment.turma.professorRegente}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {assignment.turma.alunos.length} alunos · {grupos.length}{" "}
                            {grupos.length === 1 ? "grupo" : "grupos"}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
