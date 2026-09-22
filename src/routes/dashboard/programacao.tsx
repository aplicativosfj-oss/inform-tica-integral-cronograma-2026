import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardShell } from "@/components/school/dashboard-shell";
import { useAppStore } from "@/lib/app-store";
import { useConfirmar } from "@/lib/confirm-store";
import { buildWeeklySchedule, currentWeekdayLabel, getWeekIndex, agoraNaEscola } from "@/lib/schedule-engine";
import type { Assignment } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/programacao")({
  component: ProgramacaoPage,
  head: () => ({
    meta: [
      { title: "Programação · Agenda de Informática" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function ProgramacaoPage() {
  const { turmas, config, setSlotOverride } = useAppStore();
  const confirmar = useConfirmar();
  const weekIndex = useMemo(() => getWeekIndex(agoraNaEscola()), []);
  const assignments = useMemo(
    () => buildWeeklySchedule(turmas, config, weekIndex),
    [turmas, config, weekIndex],
  );
  const todayLabel = useMemo(() => currentWeekdayLabel(agoraNaEscola()), []);
  const [diaSelecionado, setDiaSelecionado] = useState(
    config.diasSemana.includes(todayLabel) ? todayLabel : (config.diasSemana[0] ?? ""),
  );
  const [editando, setEditando] = useState<Assignment | null>(null);

  const assignmentsDoDia = assignments
    .filter((a) => a.dia === diaSelecionado)
    .sort((a, b) => a.slot.inicio.localeCompare(b.slot.inicio));

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Programação</h1>
          <p className="text-sm text-muted-foreground">
            Clique em qualquer horário para trocar manualmente a turma programada. O rodízio
            automático continua valendo para os horários não alterados.
          </p>
        </div>
      </div>

      {turmas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Cadastre ao menos uma turma para montar a programação.
        </p>
      ) : (
        <>
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
                <CalendarClock className="size-4" /> {diaSelecionado}
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
                      <TableHead className="text-right">Alunos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignmentsDoDia.map((assignment) => {
                      if (assignment.misto) {
                        return (
                          <TableRow key={`${assignment.dia}-${assignment.slot.inicio}`}>
                            <TableCell className="font-mono text-sm align-top">
                              {assignment.slot.inicio} – {assignment.slot.fim}
                            </TableCell>
                            <TableCell colSpan={3}>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  horário misto
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  grupo que sobrou de cada turma, 30 min cada:
                                </span>
                                {assignment.misto.map((m, i) => (
                                  <span
                                    key={m.turma.id}
                                    className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
                                  >
                                    {m.turma.serie} "{m.turma.letra}"
                                    {i === 0 ? ` (${assignment.slot.inicio})` : ""}
                                  </span>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      const overridden = Boolean(
                        config.slotOverrides?.[`${assignment.dia}|${assignment.slot.inicio}`],
                      );
                      return (
                        <TableRow
                          key={`${assignment.dia}-${assignment.slot.inicio}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => setEditando(assignment)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") setEditando(assignment);
                          }}
                          className="cursor-pointer transition-colors hover:bg-muted/60"
                        >
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
                              {overridden ? (
                                <Badge variant="outline" className="text-xs">
                                  editado
                                </Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {assignment.turma.professorRegente}
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {assignment.turma.alunos.length} alunos
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <SlotEditDialog
        assignment={editando}
        onOpenChange={(open) => {
          if (!open) setEditando(null);
        }}
        onSelect={async (turmaId) => {
          if (!editando) return;
          const nomeTurma = turmas.find((t) => t.id === turmaId);
          const ok = await confirmar({
            titulo: turmaId ? "Trocar a turma deste horário?" : "Restaurar o rodízio automático?",
            descricao: turmaId
              ? `${editando.dia} ${editando.slot.inicio}–${editando.slot.fim} passa a ser de ${nomeTurma?.serie} "${nomeTurma?.letra}" toda semana.`
              : `${editando.dia} ${editando.slot.inicio}–${editando.slot.fim} volta a seguir o rodízio automático.`,
          });
          if (!ok) return;
          setSlotOverride(editando.dia, editando.slot.inicio, turmaId);
          toast.success(
            turmaId ? "Horário atualizado." : "Horário restaurado ao rodízio automático.",
          );
          setEditando(null);
        }}
      />
    </DashboardShell>
  );
}

function SlotEditDialog({
  assignment,
  onOpenChange,
  onSelect,
}: {
  assignment: Assignment | null;
  onOpenChange: (open: boolean) => void;
  onSelect: (turmaId: string | null) => void;
}) {
  const { turmas, config } = useAppStore();

  return (
    <Dialog open={assignment !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {assignment
              ? `${assignment.dia} · ${assignment.slot.inicio} – ${assignment.slot.fim}`
              : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          {turmas.map((turma) => (
            <button
              key={turma.id}
              type="button"
              onClick={() => onSelect(turma.id)}
              className={cn(
                "cursor-pointer flex items-center gap-3 rounded-md border border-border/60 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                assignment?.turma.id === turma.id && "border-primary bg-primary/5",
              )}
            >
              {turma.imagem ? (
                <img src={turma.imagem} alt="" className="size-8 rounded-md object-cover" />
              ) : (
                <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-secondary-foreground">
                  {turma.letra}
                </span>
              )}
              <span>
                <span className="font-medium text-foreground">
                  {turma.serie} "{turma.letra}"
                </span>
                <span className="block text-xs text-muted-foreground">
                  Prof(a). {turma.professorRegente}
                </span>
              </span>
            </button>
          ))}
        </div>
        <DialogFooter>
          {assignment && config.slotOverrides?.[`${assignment.dia}|${assignment.slot.inicio}`] ? (
            <Button variant="outline" onClick={() => onSelect(null)}>
              <RotateCcw className="size-3.5" /> Restaurar rodízio automático
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
