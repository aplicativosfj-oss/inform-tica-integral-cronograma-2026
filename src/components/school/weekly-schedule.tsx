import { CalendarClock, MoveHorizontal, RotateCcw, Users2 } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PreviaAlunosDialog } from "@/components/school/previa-alunos-dialog";
import { useAppStore } from "@/lib/app-store";
import { useAuth } from "@/lib/auth-store";
import { useConfirmar } from "@/lib/confirm-store";
import {
  buildDailySlots,
  buildSubBlocos,
  buildWeeklySchedule,
  currentWeekdayLabel,
  getWeekIndex,
  proximaDataDoDia,
} from "@/lib/schedule-engine";
import { serieClasses } from "@/lib/serie-colors";
import type { Assignment, ScheduleConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

function toMinutes(hhmm: string): number {
  const parts = hhmm.split(":");
  return Number(parts[0] ?? 0) * 60 + Number(parts[1] ?? 0);
}

/**
 * The whole week's lab schedule at a glance, built live from the store (not
 * a static image) so it never goes stale when turmas, hours or breaks
 * change in Configurações. A real HTML table — sticky time column, gentle
 * horizontal scroll with the next day peeking at the edge — instead of a
 * fixed-size SVG poster that ignored dark mode and needed a "swipe" hint to
 * be usable on a phone.
 */
export function WeeklySchedule() {
  const { turmas, config, setSlotOverride } = useAppStore();
  const { isAuthenticated } = useAuth();
  const confirmar = useConfirmar();
  const [editando, setEditando] = useState<Assignment | null>(null);
  const [previsto, setPrevisto] = useState<Assignment | null>(null);
  const [mistoSelecionado, setMistoSelecionado] = useState<Assignment | null>(null);

  // "Hoje" and the week's rotation offset depend on the client's clock,
  // which can differ from the server render — only applied after mount to
  // avoid a hydration mismatch (both start at their week-0/no-highlight
  // state, matching the server-rendered markup, then correct themselves).
  const [todayLabel, setTodayLabel] = useState("");
  const [weekIndex, setWeekIndex] = useState(0);
  useEffect(() => {
    const now = new Date();
    setTodayLabel(currentWeekdayLabel(now));
    setWeekIndex(getWeekIndex(now));
  }, []);

  const { linhas, colunas, series, pausas, lookup, temMisto } = useMemo(() => {
    const dailySlots = buildDailySlots(config);
    const assignments = buildWeeklySchedule(turmas, config, weekIndex);
    const byDayAndSlot = new Map<string, Assignment>();
    for (const a of assignments) byDayAndSlot.set(`${a.dia}|${a.slot.inicio}`, a);

    const seriesUnicas: string[] = [];
    for (const t of turmas) if (!seriesUnicas.includes(t.serie)) seriesUnicas.push(t.serie);

    // Real configured break windows (not the gap between adjacent slots), so
    // a few idle leftover minutes never get mislabeled as part of the break.
    const breaksReais = [
      { inicio: config.intervaloInicio, fim: config.intervaloFim, label: "Almoço" },
      ...(config.recreioInicio && config.recreioFim
        ? [{ inicio: config.recreioInicio, fim: config.recreioFim, label: "Recreio" }]
        : []),
    ];
    const gaps: { apos: number; label: string; horario: string }[] = [];
    for (const pausa of breaksReais) {
      const inicioMin = toMinutes(pausa.inicio);
      let apos = -1;
      dailySlots.forEach((slot, index) => {
        if (toMinutes(slot.fim) <= inicioMin) apos = index;
      });
      if (apos === -1 || apos === dailySlots.length - 1) continue;
      gaps.push({ apos, label: pausa.label, horario: `${pausa.inicio}–${pausa.fim}` });
    }
    gaps.sort((a, b) => a.apos - b.apos);

    return {
      linhas: dailySlots,
      colunas: config.diasSemana,
      series: seriesUnicas,
      pausas: gaps,
      lookup: byDayAndSlot,
      temMisto: assignments.some((a) => a.misto),
    };
  }, [turmas, config, weekIndex]);

  if (turmas.length === 0 || linhas.length === 0) return null;

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-white/20 dark:border-white/10 bg-white/70 dark:bg-card/70 shadow-lg backdrop-blur-xl">
        {/* No celular a grade rola na horizontal: um aviso curto evita que o
            usuário pense que só existem dois dias. */}
        <p className="flex items-center gap-1.5 border-b border-border/60 px-4 py-2 text-[11px] text-muted-foreground sm:hidden">
          <MoveHorizontal className="size-3.5 shrink-0" />
          Arraste para o lado para ver os outros dias
        </p>
        <div className="overflow-x-auto scroll-smooth [scrollbar-width:thin]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 w-[68px] shrink-0 border-r border-b border-border/60 bg-slate-100/90 p-2 backdrop-blur sm:w-24 sm:p-3 dark:bg-muted/60" />
                {colunas.map((dia) => {
                  const hoje = dia === todayLabel;
                  return (
                    <th
                      key={dia}
                      scope="col"
                      className={`min-w-[140px] border-b border-border/60 p-2.5 text-center sm:min-w-[152px] sm:p-3 ${hoje ? "bg-primary/5" : ""}`}
                    >
                      <span
                        className={`inline-flex items-center gap-1.5 text-[13px] font-semibold sm:text-sm ${hoje ? "text-primary" : "text-foreground"}`}
                      >
                        {dia}
                        {hoje ? (
                          <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                        ) : null}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {linhas.map((slot, rowIndex) => {
                const pausaApos = pausas.find((p) => p.apos === rowIndex);
                return (
                  <Fragment key={slot.inicio}>
                    <tr className="group/row">
                      <td className="sticky left-0 z-10 w-24 shrink-0 border-r border-b border-border/60 bg-slate-100/80 p-3 text-right align-top text-xs font-semibold whitespace-nowrap text-slate-600 dark:bg-muted/50 dark:text-slate-300">
                        {slot.inicio}
                        <br />
                        {slot.fim}
                      </td>
                      {colunas.map((dia) => {
                        const assignment = lookup.get(`${dia}|${slot.inicio}`);
                        const hoje = dia === todayLabel;
                        const overridden = Boolean(config.slotOverrides?.[`${dia}|${slot.inicio}`]);
                        return (
                          <td
                            key={dia}
                            className={`border-b border-border/40 p-1.5 align-top ${hoje ? "bg-primary/[0.03]" : ""}`}
                          >
                            {assignment?.misto ? (
                              <MixedPill
                                assignment={assignment}
                                config={config}
                                series={series}
                                weekIndex={weekIndex}
                                onClick={() => setMistoSelecionado(assignment)}
                              />
                            ) : assignment ? (
                              <SchedulePill
                                assignment={assignment}
                                serieIndex={series.indexOf(assignment.turma.serie)}
                                editado={overridden}
                                onClick={() =>
                                  isAuthenticated
                                    ? setEditando(assignment)
                                    : setPrevisto(assignment)
                                }
                              />
                            ) : (
                              <div className="h-14 rounded-xl border border-dashed border-border/30" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    {pausaApos ? (
                      <tr>
                        <td
                          colSpan={colunas.length + 1}
                          className="border-b border-border/40 bg-muted/40 px-3 py-1.5 text-center text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
                        >
                          {pausaApos.label} · {pausaApos.horario}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legenda: um selo por série, na mesma rampa ordinal das células. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 px-4 py-3">
          {series.map((serie, index) => {
            const { bg } = serieClasses(index);
            return (
              <span key={serie} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`size-2.5 rounded-full ${bg}`} aria-hidden />
                {serie}
              </span>
            );
          })}
        </div>
        {temMisto ? (
          <p className="border-t border-border/60 px-4 py-2 text-[11px] text-muted-foreground">
            Células listradas (várias faixas) = horário misto: o grupo que sobrou de cada turma
            grande usa 30 min, uma turma depois da outra, já que só há {config.numeroComputadores}{" "}
            computadores.
          </p>
        ) : null}
      </div>

      <ScheduleEditDialog
        assignment={editando}
        overridden={
          editando
            ? Boolean(config.slotOverrides?.[`${editando.dia}|${editando.slot.inicio}`])
            : false
        }
        onOpenChange={(open) => {
          if (!open) setEditando(null);
        }}
        onSelect={async (turmaId) => {
          if (!editando) return;
          const novaTurma = turmas.find((t) => t.id === turmaId);
          const ok = await confirmar({
            titulo: turmaId ? "Trocar a turma deste horário?" : "Restaurar o rodízio automático?",
            descricao: turmaId
              ? `${editando.dia} ${editando.slot.inicio}–${editando.slot.fim} passa a ser de ${novaTurma?.serie} "${novaTurma?.letra}" toda semana.`
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

      <PreviaAlunosDialog
        assignment={previsto}
        data={previsto ? proximaDataDoDia(previsto.dia, new Date()) : new Date()}
        onOpenChange={(open) => {
          if (!open) setPrevisto(null);
        }}
      />

      <MistoDetalhesDialog
        assignment={mistoSelecionado}
        config={config}
        series={series}
        weekIndex={weekIndex}
        onOpenChange={(open) => {
          if (!open) setMistoSelecionado(null);
        }}
      />
    </>
  );
}

function SchedulePill({
  assignment,
  serieIndex,
  editado,
  onClick,
}: {
  assignment: Assignment;
  serieIndex: number;
  editado?: boolean;
  onClick: () => void;
}) {
  const { bg, text, ring } = serieClasses(Math.max(0, serieIndex));
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ver detalhes: ${assignment.turma.serie} "${assignment.turma.letra}", ${assignment.dia} ${assignment.slot.inicio}–${assignment.slot.fim}`}
      className={`relative h-14 w-full cursor-pointer rounded-xl px-3 py-1.5 text-left shadow-sm ring-1 transition-all duration-300 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 [@media(hover:hover)]:hover:scale-105 [@media(hover:hover)]:hover:shadow-lg [@media(hover:hover)]:hover:ring-2 ${bg} ${text} ${ring}`}
    >
      <p className="truncate text-[13px] leading-tight font-semibold">
        {assignment.turma.serie} &quot;{assignment.turma.letra}&quot;
      </p>
      <p className="mt-0.5 truncate text-[11px] leading-tight opacity-80">
        Prof(a). {assignment.turma.professorRegente}
      </p>
      {editado ? (
        <span
          className="absolute top-1 right-1 size-1.5 rounded-full bg-white/90 ring-1 ring-black/10"
          aria-hidden
        />
      ) : null}
    </button>
  );
}

/**
 * Um horário "misto" reúne o grupo que sobrou da sessão principal de até
 * `roundsPorVisita` turmas diferentes (só 7 computadores não dão pra uma
 * turma de 20+ alunos inteira de uma vez) — 30 min cada, uma atrás da
 * outra, em vez de uma turma só ocupando o horário inteiro. Clicável, como
 * as células normais, mas abre um resumo em vez do diálogo de troca (editar
 * um horário misto não é suportado pelo diálogo simples de turma única).
 */
function MixedPill({
  assignment,
  config,
  series,
  weekIndex,
  onClick,
}: {
  assignment: Assignment;
  config: ScheduleConfig;
  series: string[];
  weekIndex: number;
  onClick: () => void;
}) {
  const subBlocos = buildSubBlocos(assignment, config, weekIndex);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ver detalhes do horário misto: ${assignment.dia} ${assignment.slot.inicio}–${assignment.slot.fim}`}
      className="flex h-14 w-full cursor-pointer flex-col gap-0.5 overflow-hidden rounded-xl text-left ring-1 ring-border/60 transition-all duration-300 ease-out [@media(hover:hover)]:hover:scale-105 [@media(hover:hover)]:hover:shadow-lg [@media(hover:hover)]:hover:ring-2"
    >
      {subBlocos.map((sub, i) => {
        const turma = sub.turma ?? assignment.turma;
        const { bg, text } = serieClasses(Math.max(0, series.indexOf(turma.serie)));
        return (
          <span
            key={i}
            className={`flex flex-1 items-center justify-between gap-1 px-2 ${bg} ${text}`}
          >
            <span className="truncate text-xs leading-none font-semibold">
              {turma.serie} &quot;{turma.letra}&quot;
            </span>
            <span className="shrink-0 text-xs leading-none opacity-80">{sub.inicio}</span>
          </span>
        );
      })}
    </button>
  );
}

function ScheduleEditDialog({
  assignment,
  overridden,
  onOpenChange,
  onSelect,
}: {
  assignment: Assignment | null;
  overridden: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (turmaId: string | null) => void;
}) {
  const { turmas } = useAppStore();

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
                "flex items-center gap-3 rounded-md border border-border/60 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
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
                  {turma.serie} &quot;{turma.letra}&quot;
                </span>
                <span className="block text-xs text-muted-foreground">
                  Prof(a). {turma.professorRegente}
                </span>
              </span>
            </button>
          ))}
        </div>
        <DialogFooter>
          {overridden ? (
            <Button variant="outline" onClick={() => onSelect(null)}>
              <RotateCcw className="size-3.5" /> Restaurar rodízio automático
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Explica, em linguagem simples, o que é um horário misto: quais turmas
 * dividem aquele período, o horário exato de cada uma e — o mais importante
 * pro público — exatamente quais alunos formam o grupo que ficou de fora da
 * sessão principal da turma. Esse grupo não é fixo pra sempre: como o
 * rodízio semanal muda qual grupo "sobra" a cada semana (ver
 * `buildWeeklySchedule`), ao longo de várias semanas todo aluno passa por
 * aqui, não sempre os mesmos.
 */
function MistoDetalhesDialog({
  assignment,
  config,
  series,
  weekIndex,
  onOpenChange,
}: {
  assignment: Assignment | null;
  config: ScheduleConfig;
  series: string[];
  weekIndex: number;
  onOpenChange: (open: boolean) => void;
}) {
  const subBlocos = assignment ? buildSubBlocos(assignment, config, weekIndex) : [];

  return (
    <Dialog open={assignment !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-4 overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users2 className="size-4 text-primary" />
            {assignment
              ? `Horário misto · ${assignment.dia} ${assignment.slot.inicio}–${assignment.slot.fim}`
              : ""}
          </DialogTitle>
        </DialogHeader>
        {assignment ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
            <p className="text-sm text-muted-foreground">
              A escola só tem {config.numeroComputadores} computadores, então uma turma de mais de{" "}
              {config.numeroComputadores} alunos não cabe inteira numa única visita. O grupo que
              sobra de cada turma grande usa este horário — e esse grupo roda: nas próximas semanas,
              outros alunos da turma é que ficam de fora e vêm pra cá, não sempre os mesmos.
            </p>
            <div className="flex flex-col gap-3">
              {subBlocos.map((sub, i) => {
                const turma = sub.turma ?? assignment.turma;
                const { bg, text } = serieClasses(Math.max(0, series.indexOf(turma.serie)));
                return (
                  <div key={i} className="overflow-hidden rounded-xl border border-border/60">
                    <div className={`flex items-center gap-3 px-3 py-2 ${bg} ${text}`}>
                      {turma.imagem ? (
                        <img
                          src={turma.imagem}
                          alt=""
                          className="size-8 shrink-0 rounded-lg object-cover ring-2 ring-white/40"
                        />
                      ) : (
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/20 text-xs font-bold">
                          {turma.letra}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {turma.serie} &quot;{turma.letra}&quot;
                        </p>
                        <p className="truncate text-[11px] opacity-80">
                          Prof(a). {turma.professorRegente}
                        </p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-2 py-1 font-mono text-xs font-bold">
                        <CalendarClock className="size-3.5" />
                        {sub.inicio}–{sub.fim}
                      </span>
                    </div>
                    {sub.grupo.alunos.length > 0 ? (
                      <div className="grid grid-cols-1 gap-1 p-2.5 sm:grid-cols-2">
                        {sub.grupo.alunos.map((aluno, indiceAluno) => (
                          <div
                            key={aluno.id}
                            className="flex min-w-0 items-center gap-2 rounded-lg bg-muted/40 px-2 py-1.5"
                          >
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-background text-xs font-semibold text-foreground ring-1 ring-border/60">
                              {indiceAluno + 1}
                            </span>
                            <span className="truncate text-xs text-foreground">{aluno.nome}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="px-3 py-2 text-xs text-muted-foreground">
                        Nenhum aluno neste grupo ainda.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
