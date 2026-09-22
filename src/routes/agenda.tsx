import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MonitorSmartphone,
  Users2,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LiveSessionPanel } from "@/components/school/live-session-panel";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { PreviaAlunosDialog } from "@/components/school/previa-alunos-dialog";
import { SiteImage } from "@/components/school/site-image";
import { SiteFooter } from "@/components/school/site-footer";
import { useAppStore } from "@/lib/app-store";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";
import {
  buildGrupos,
  buildWeeklySchedule,
  currentWeekdayLabel,
  getWeekIndex,
  proximaDataDoDia,
  proximasDatasDoDia,
  reprogramacoesParaData,
  suspensaoKey,
  toDateKey,
  agoraNaEscola,
} from "@/lib/schedule-engine";
import type { Assignment } from "@/lib/types";
import agendaHeroImg from "@/assets/laboratorio-informatica-turma.jpg";

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
  const semanaAtualIndex = useMemo(() => getWeekIndex(agoraNaEscola()), []);
  const [weekIndex, setWeekIndex] = useState(semanaAtualIndex);
  const assignments = useMemo(
    () => buildWeeklySchedule(turmas, config, weekIndex),
    [turmas, config, weekIndex],
  );
  const todayLabel = useMemo(() => currentWeekdayLabel(agoraNaEscola()), []);
  const isCurrentWeek = weekIndex === semanaAtualIndex;
  const semanasAnterioresBloqueadas = weekIndex <= semanaAtualIndex;
  const [diaSelecionado, setDiaSelecionado] = useState(
    config.diasSemana.includes(todayLabel) ? todayLabel : (config.diasSemana[0] ?? ""),
  );
  const [assignmentSelecionado, setAssignmentSelecionado] = useState<Assignment | null>(null);

  const dataDoDia = useMemo(
    () => proximaDataDoDia(diaSelecionado, agoraNaEscola()),
    [diaSelecionado],
  );
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
    proximaDataDoDia(dia, agoraNaEscola()).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_-10%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_55%),radial-gradient(circle_at_100%_15%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_50%)]"
          />
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-10">
            <div className="flex flex-col gap-4">
              <Badge className="w-fit gap-1.5 rounded-full border-blue-400/30 bg-blue-500/10 px-3 py-1.5 text-sm text-blue-700 shadow-sm backdrop-blur-md dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-200">
                <CalendarDays className="size-4" /> Agenda semanal
              </Badge>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Cronograma de aulas de informática
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Toque numa turma para ver os alunos previstos. Revezamento automático de{" "}
                {config.horaInicio} às {config.horaFim}, com o professor{" "}
                {config.professorInformatica}.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2.5 rounded-xl border border-amber-400/25 bg-card p-3 shadow-sm dark:border-amber-400/15 dark:bg-card/60 dark:backdrop-blur-xl">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
                    <Clock3 className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">Horário</p>
                    <p className="text-sm font-semibold text-foreground">
                      {config.horaInicio} – {config.horaFim}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-400/25 bg-card p-3 shadow-sm dark:border-emerald-400/15 dark:bg-card/60 dark:backdrop-blur-xl">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    <MonitorSmartphone className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">Computadores</p>
                    <p className="text-sm font-semibold text-foreground">
                      {config.numeroComputadores}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <SiteImage
              src={agendaHeroImg}
              alt="Laboratório de informática da escola com turmas em cronograma semanal"
              width={1200}
              height={750}
              className="aspect-[16/10] max-h-56 w-full rounded-2xl border border-border bg-card shadow-md dark:border-white/10 dark:bg-card/60 dark:shadow-xl dark:backdrop-blur-lg sm:max-h-64"
              loading="eager"
              decoding="async"
            />
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          {/* Week navigation */}
          <div className="mb-6 flex items-center justify-between rounded-lg border border-border/60 bg-card/50 p-3 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setWeekIndex((w) => Math.max(semanaAtualIndex, w - 1))}
              disabled={semanasAnterioresBloqueadas}
              className="cursor-pointer rounded-lg p-2 text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Semana anterior"
              title={
                semanasAnterioresBloqueadas
                  ? "Sem aulas registradas antes da semana atual"
                  : "Semana anterior"
              }
            >
              <ChevronLeft className="size-5" />
            </button>
            <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <CalendarDays className="size-4 text-primary" />
              {isCurrentWeek
                ? "Semana atual"
                : `Daqui a ${weekIndex - semanaAtualIndex} semana${weekIndex - semanaAtualIndex === 1 ? "" : "s"}`}
            </span>
            <button
              type="button"
              onClick={() => setWeekIndex((w) => w + 1)}
              className="cursor-pointer rounded-lg p-2 text-primary hover:bg-primary/10 transition-colors"
              aria-label="Próxima semana"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          <div className="mb-4">
            <LiveSessionPanel />
          </div>

          <Tabs value={diaSelecionado} onValueChange={setDiaSelecionado}>
            <TabsList className="mb-3 flex h-auto flex-wrap justify-start gap-1.5 bg-transparent p-0">
              {config.diasSemana.map((dia) => (
                <TabsTrigger
                  key={dia}
                  value={dia}
                  className={`group flex-col gap-0 rounded-xl border px-4 py-1.5 leading-tight text-foreground data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground ${
                    dia === todayLabel
                      ? // Só destaca "hoje" enquanto o dia NÃO está selecionado: quando
                        // está, vale o fundo sólido do estado ativo. Sem isso, o azul
                        // translúcido vencia o fundo primário e sobrava texto escuro
                        // sobre fundo escuro.
                        "border-blue-400/50 data-[state=inactive]:bg-blue-500/10 dark:data-[state=inactive]:bg-blue-500/15"
                      : "border-border/60"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {dia}
                    {dia === todayLabel ? (
                      <span className="size-1.5 rounded-full bg-blue-500 group-data-[state=active]:bg-primary-foreground" />
                    ) : null}
                  </span>
                  <span className="font-mono text-xs opacity-80">{dataCurta(dia)}</span>
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
                    className="group cursor-pointer flex flex-col rounded-xl border border-border/60 bg-card p-4 text-left shadow-sm transition-[transform,border-color,box-shadow] duration-200 ease-out [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:border-primary/40 [@media(hover:hover)]:hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      {assignment.turma.imagem ? (
                        <img
                          src={assignment.turma.imagem}
                          alt=""
                          className="size-11 shrink-0 rounded-full object-cover ring-1 ring-inset ring-black/5 dark:ring-white/10"
                        />
                      ) : (
                        <span
                          className={`flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-1 ring-inset ring-black/5 dark:ring-white/10 ${serieClasses(serieIndexPorNumero(assignment.turma.serie)).bg} ${serieClasses(serieIndexPorNumero(assignment.turma.serie)).text}`}
                        >
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

                    <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                      <span className="flex items-center gap-1.5 font-mono text-base font-bold text-foreground">
                        <Clock3 className="size-4 text-primary" />
                        {assignment.slot.inicio} – {assignment.slot.fim}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
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
      </div>

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
