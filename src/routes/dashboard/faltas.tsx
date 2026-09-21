import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarClock,
  CalendarX2,
  History,
  MessageSquareText,
  RotateCcw,
  Trash2,
  UserX,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardShell } from "@/components/school/dashboard-shell";
import { SuspenderAulaDialog } from "@/components/school/suspender-aula-dialog";
import { useAppStore } from "@/lib/app-store";
import { useConfirmar } from "@/lib/confirm-store";
import { fetchPresencasRange } from "@/lib/presencas";
import {
  aplicarExcecoesDeData,
  buildWeeklySchedule,
  currentWeekdayLabel,
  getWeekIndex,
  nextAssignmentsForDay,
  proximaDataDoDia,
  suspensaoKey,
  toDateKey,
} from "@/lib/schedule-engine";
import type { Assignment, Presenca } from "@/lib/types";

export const Route = createFileRoute("/dashboard/faltas")({
  component: FaltasPage,
  head: () => ({
    meta: [
      { title: "Faltas do mês · Agenda de Informática" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function mesAtual(): string {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

function intervaloDoMes(mes: string): { inicio: string; fim: string } {
  const [ano, m] = mes.split("-").map(Number);
  const primeiro = new Date(ano ?? 2026, (m ?? 1) - 1, 1);
  const ultimo = new Date(ano ?? 2026, m ?? 1, 0);
  return { inicio: toDateKey(primeiro), fim: toDateKey(ultimo) };
}

function addDias(dataISO: string, dias: number): Date {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(ano ?? 2026, (mes ?? 1) - 1, dia ?? 1);
  data.setDate(data.getDate() + dias);
  return data;
}

interface GrupoFalta {
  chave: string;
  turmaId: string;
  data: string;
  dia: string;
  alunos: string[];
}

/**
 * Ausências do mês agrupadas por turma+data, com um botão para reprogramar
 * a sessão: sugere a próxima data do mesmo dia da semana no mesmo horário
 * (pré-preenchido), mas deixa a coordenação escolher outra data/horário —
 * por exemplo, um horário "livre" reservado para reposição — antes de
 * confirmar. Suspende a data original e registra a nova ocorrência — tudo em
 * uma única atualização de configuração, então o cronômetro ao vivo já
 * reflete a mudança sem precisar recarregar a página.
 */
function FaltasPage() {
  const { turmas, config, reprogramarAula, removeReprogramacao } = useAppStore();
  const confirmar = useConfirmar();
  const [mes, setMes] = useState(mesAtual);
  const [registros, setRegistros] = useState<Presenca[] | null>(null);
  const [reprogramando, setReprogramando] = useState<{
    grupo: GrupoFalta;
    inicioOriginal: string;
    fimOriginal: string;
    data: string;
    inicio: string;
    fim: string;
  } | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const weekIndex = useMemo(() => getWeekIndex(new Date()), []);
  const assignments = useMemo(
    () => buildWeeklySchedule(turmas, config, weekIndex),
    [turmas, config, weekIndex],
  );

  // Aulas de hoje e dos últimos dias letivos que ainda aconteceram
  // normalmente — é daqui que se registra "a turma não pôde participar".
  const aulasRecentes = useMemo(() => {
    const hoje = new Date();
    const lista: { data: Date; dataKey: string; assignment: Assignment }[] = [];
    for (let i = 0; i < 7; i += 1) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - i);
      const dia = currentWeekdayLabel(data);
      if (!config.diasSemana.includes(dia)) continue;
      const dataKey = toDateKey(data);
      const doDia = nextAssignmentsForDay(
        aplicarExcecoesDeData(
          buildWeeklySchedule(turmas, config, getWeekIndex(data)),
          config,
          turmas,
          dataKey,
        ),
        dia,
      ).filter(
        (a) => !a.misto && !config.suspensoes?.[suspensaoKey(dataKey, a.dia, a.slot.inicio)],
      );
      for (const assignment of doDia) lista.push({ data, dataKey, assignment });
    }
    return lista;
  }, [turmas, config]);

  useEffect(() => {
    let cancelado = false;
    const { inicio, fim } = intervaloDoMes(mes);
    setRegistros(null);
    setErro(null);
    const timeout = new Promise<Presenca[]>((_, reject) =>
      setTimeout(() => reject(new Error("Tempo esgotado ao buscar dados de frequência.")), 6000),
    );
    Promise.race([fetchPresencasRange(inicio, fim), timeout])
      .then((dados) => {
        if (!cancelado) setRegistros(dados);
      })
      .catch((err: Error) => {
        if (!cancelado) {
          setErro(err.message);
          setRegistros([]);
        }
      });
    return () => {
      cancelado = true;
    };
  }, [mes]);

  const nomeTurma = (id: string) => {
    const t = turmas.find((turma) => turma.id === id);
    return t ? `${t.serie} "${t.letra}"` : id;
  };

  const grupos = useMemo<GrupoFalta[]>(() => {
    const mapa = new Map<string, GrupoFalta>();
    for (const r of registros ?? []) {
      if (r.status !== "faltou") continue;
      const chave = `${r.turmaId}|${r.data}`;
      const atual = mapa.get(chave) ?? {
        chave,
        turmaId: r.turmaId,
        data: r.data,
        dia: currentWeekdayLabel(addDias(r.data, 0)),
        alunos: [],
      };
      atual.alunos.push(r.alunoNome);
      mapa.set(chave, atual);
    }
    return [...mapa.values()].sort((a, b) => b.data.localeCompare(a.data));
  }, [registros]);

  const reprogramacoes = [...(config.reprogramacoes ?? [])].sort((a, b) =>
    b.criadoEm.localeCompare(a.criadoEm),
  );

  function reprogramacaoExistente(turmaId: string, data: string) {
    return (config.reprogramacoes ?? []).find(
      (r) => r.turmaId === turmaId && r.dataOriginal === data,
    );
  }

  function abrirReprogramacao(grupo: GrupoFalta) {
    const assignment = assignments.find((a) => a.turma.id === grupo.turmaId && a.dia === grupo.dia);
    if (!assignment) {
      toast.error("Não foi possível encontrar o horário original dessa turma nesse dia.");
      return;
    }
    const proximaData = proximaDataDoDia(grupo.dia, addDias(grupo.data, 1));
    setReprogramando({
      grupo,
      inicioOriginal: assignment.slot.inicio,
      fimOriginal: assignment.slot.fim,
      data: toDateKey(proximaData),
      inicio: assignment.slot.inicio,
      fim: assignment.slot.fim,
    });
  }

  async function confirmarReprogramacao() {
    if (!reprogramando) return;
    const { grupo, inicioOriginal, fimOriginal, data, inicio, fim } = reprogramando;
    if (!data || !inicio || !fim) {
      toast.error("Preencha data, início e fim antes de confirmar.");
      return;
    }
    const dataFormatada = new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      weekday: "long",
    });
    const ok = await confirmar({
      titulo: "Reprogramar esta aula?",
      descricao: `A sessão de ${nomeTurma(grupo.turmaId)} do dia ${new Date(`${grupo.data}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} será movida para ${dataFormatada}, ${inicio}–${fim}.`,
    });
    if (!ok) return;
    reprogramarAula({
      turmaId: grupo.turmaId,
      dataOriginal: grupo.data,
      diaOriginal: grupo.dia,
      inicioOriginal,
      fimOriginal,
      dataNova: data,
      inicio,
      fim,
      conteudo: undefined,
    });
    toast.success(`Aula de ${nomeTurma(grupo.turmaId)} reprogramada para ${dataFormatada}.`);
    setReprogramando(null);
  }

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Faltas do mês</h1>
          <p className="text-sm text-muted-foreground">
            Ausências registradas por turma e data, com reprogramação automática de aula — sem
            recarregar o cronômetro.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mes">Mês</Label>
          <Input
            id="mes"
            type="month"
            className="w-44"
            value={mes}
            onChange={(e) => setMes(e.target.value || mesAtual())}
          />
        </div>
      </div>

      {erro ? (
        <p className="mb-6 text-sm text-destructive">
          Não foi possível carregar a frequência agora: {erro}
        </p>
      ) : null}

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarX2 className="size-4 text-amber-500" /> Turma não pôde participar?
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Aulas de hoje e dos últimos dias. Registre o motivo e o sistema reprograma a turma
            inteira para o próximo horário possível — a observação fica no histórico abaixo.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {aulasRecentes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma aula nos últimos dias.
            </p>
          ) : (
            aulasRecentes.map(({ data, dataKey, assignment }) => (
              <div
                key={`${dataKey}-${assignment.slot.inicio}`}
                className="flex flex-col gap-2 rounded-lg border border-border/60 bg-background/60 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm text-foreground">
                  <span className="font-semibold">
                    {assignment.turma.serie} &ldquo;{assignment.turma.letra}&rdquo;
                  </span>{" "}
                  <span className="text-muted-foreground">
                    ·{" "}
                    {data.toLocaleDateString("pt-BR", {
                      weekday: "long",
                      day: "2-digit",
                      month: "2-digit",
                    })}{" "}
                    · {assignment.slot.inicio}–{assignment.slot.fim}
                  </span>
                </p>
                <SuspenderAulaDialog assignment={assignment} data={data}>
                  <Button size="sm" variant="outline" className="shrink-0 gap-1.5">
                    <CalendarX2 className="size-3.5" /> Não pôde participar
                  </Button>
                </SuspenderAulaDialog>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserX className="size-4" /> Sessões com ausências ({grupos.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {registros === null ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
          ) : grupos.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma ausência registrada neste mês.
            </p>
          ) : (
            grupos.map((grupo) => {
              const jaReprogramada = reprogramacaoExistente(grupo.turmaId, grupo.data);
              return (
                <div
                  key={grupo.chave}
                  className="flex flex-col gap-2 rounded-lg border border-border/60 bg-background/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {nomeTurma(grupo.turmaId)}{" "}
                      <span className="font-normal text-muted-foreground">
                        · {grupo.dia},{" "}
                        {new Date(`${grupo.data}T00:00:00`).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {grupo.alunos.length} {grupo.alunos.length === 1 ? "falta" : "faltas"}:{" "}
                      {grupo.alunos.join(", ")}
                    </p>
                  </div>
                  {jaReprogramada ? (
                    <Badge variant="secondary" className="shrink-0 gap-1.5">
                      <CalendarClock className="size-3.5" /> Reprogramada para{" "}
                      {new Date(`${jaReprogramada.dataNova}T00:00:00`).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1.5"
                      onClick={() => abrirReprogramacao(grupo)}
                    >
                      <RotateCcw className="size-3.5" /> Reprogramar aula
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="size-4" /> Histórico de aulas reprogramadas ({reprogramacoes.length}
            )
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {reprogramacoes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma aula reprogramada.
            </p>
          ) : (
            reprogramacoes.map((r) => (
              <div
                key={r.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-background/60 p-3"
              >
                <div className="min-w-0 text-sm text-foreground">
                  <p>
                    <span className="font-semibold">{nomeTurma(r.turmaId)}</span> ·{" "}
                    <span className="text-muted-foreground line-through">
                      {new Date(`${r.dataOriginal}T00:00:00`).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                      })}{" "}
                      {r.inicioOriginal}
                    </span>{" "}
                    →{" "}
                    <span className="font-medium text-primary">
                      {new Date(`${r.dataNova}T00:00:00`).toLocaleDateString("pt-BR", {
                        weekday: "short",
                        day: "2-digit",
                        month: "2-digit",
                      })}{" "}
                      ({r.inicio} – {r.fim})
                    </span>
                  </p>
                  {r.motivo ? (
                    <p className="mt-1 flex items-start gap-1.5 text-muted-foreground">
                      <MessageSquareText className="mt-0.5 size-3.5 shrink-0" />
                      <span>Observação: {r.motivo}</span>
                    </p>
                  ) : null}
                  {r.slotDeslocado ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Usou a aula extra de {nomeTurma(r.slotDeslocado.turmaId)} nesse horário.
                    </p>
                  ) : null}
                  <p className="mt-0.5 text-xs text-muted-foreground/70">
                    Registrado em{" "}
                    {new Date(r.criadoEm).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Cancelar reprogramação"
                  onClick={async () => {
                    const ok = await confirmar({
                      titulo: "Cancelar esta reprogramação?",
                      descricao: `A aula de ${nomeTurma(r.turmaId)} volta a valer na data e horário originais.`,
                      textoConfirmar: "Cancelar reprogramação",
                      destrutivo: true,
                    });
                    if (!ok) return;
                    removeReprogramacao(r.id);
                    toast.success("Reprogramação cancelada. A aula original volta a valer.");
                  }}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog
        open={reprogramando !== null}
        onOpenChange={(open) => {
          if (!open) setReprogramando(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reprogramando ? `Reprogramar aula de ${nomeTurma(reprogramando.grupo.turmaId)}` : ""}
            </DialogTitle>
          </DialogHeader>
          {reprogramando ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Sugerimos a próxima {reprogramando.grupo.dia} no mesmo horário, mas você pode
                escolher outra data e horário — por exemplo, um horário "livre" reservado para
                reposição na grade semanal.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reprog-data">Data</Label>
                  <Input
                    id="reprog-data"
                    type="date"
                    value={reprogramando.data}
                    onChange={(e) => setReprogramando({ ...reprogramando, data: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reprog-inicio">Início</Label>
                  <Input
                    id="reprog-inicio"
                    type="time"
                    value={reprogramando.inicio}
                    onChange={(e) => setReprogramando({ ...reprogramando, inicio: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reprog-fim">Fim</Label>
                  <Input
                    id="reprog-fim"
                    type="time"
                    value={reprogramando.fim}
                    onChange={(e) => setReprogramando({ ...reprogramando, fim: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReprogramando(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmarReprogramacao}>
              <RotateCcw className="size-3.5" /> Confirmar reprogramação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
