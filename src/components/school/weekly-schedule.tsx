import { Fragment, useEffect, useMemo, useState } from "react";

import { useAppStore } from "@/lib/app-store";
import {
  buildDailySlots,
  buildWeeklySchedule,
  currentWeekdayLabel,
  getWeekIndex,
} from "@/lib/schedule-engine";
import type { Assignment } from "@/lib/types";

/**
 * Sequential, theme-aware ramp for ordinal data (grade level): darker reads
 * as "further along", so the color itself carries meaning without forcing a
 * legend lookup. Values live in styles.css (`--serie-1..5`) with separate
 * light/dark tuning — these class names are written out literally so the
 * Tailwind scanner picks them up (it can't see dynamically built strings).
 */
const SERIE_BG = ["bg-serie-1", "bg-serie-2", "bg-serie-3", "bg-serie-4", "bg-serie-5"];
const SERIE_TEXT = ["text-slate-900", "text-slate-900", "text-white", "text-white", "text-white"];
const SERIE_RING = [
  "ring-[color:var(--serie-1)]/50",
  "ring-[color:var(--serie-2)]/50",
  "ring-[color:var(--serie-3)]/50",
  "ring-[color:var(--serie-4)]/50",
  "ring-[color:var(--serie-5)]/50",
];

function toMinutes(hhmm: string): number {
  const parts = hhmm.split(":");
  return Number(parts[0] ?? 0) * 60 + Number(parts[1] ?? 0);
}

function serieClasses(index: number) {
  const i = index % SERIE_BG.length;
  return { bg: SERIE_BG[i]!, text: SERIE_TEXT[i]!, ring: SERIE_RING[i]! };
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
  const { turmas, config } = useAppStore();

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

  const { linhas, colunas, series, pausas, lookup } = useMemo(() => {
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
    };
  }, [turmas, config, weekIndex]);

  if (turmas.length === 0 || linhas.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-24 shrink-0 border-b border-border/60 bg-card p-3" />
              {colunas.map((dia) => {
                const hoje = dia === todayLabel;
                return (
                  <th
                    key={dia}
                    scope="col"
                    className="min-w-[152px] border-b border-border/60 p-3 text-center"
                  >
                    <span
                      className={`inline-flex items-center gap-1.5 text-sm font-semibold ${hoje ? "text-primary" : "text-foreground"}`}
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
                    <td className="sticky left-0 z-10 w-24 shrink-0 border-b border-border/40 bg-card p-3 text-right align-top text-xs font-medium whitespace-nowrap text-muted-foreground">
                      {slot.inicio}
                      <br />
                      {slot.fim}
                    </td>
                    {colunas.map((dia) => {
                      const assignment = lookup.get(`${dia}|${slot.inicio}`);
                      const hoje = dia === todayLabel;
                      return (
                        <td
                          key={dia}
                          className={`border-b border-border/40 p-1.5 align-top ${hoje ? "bg-primary/[0.03]" : ""}`}
                        >
                          {assignment ? (
                            <SchedulePill assignment={assignment} serieIndex={series.indexOf(assignment.turma.serie)} />
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
    </div>
  );
}

function SchedulePill({
  assignment,
  serieIndex,
}: {
  assignment: Assignment;
  serieIndex: number;
}) {
  const { bg, text, ring } = serieClasses(Math.max(0, serieIndex));
  return (
    <div
      className={`h-14 rounded-xl px-3 py-1.5 shadow-sm ring-1 transition-transform duration-150 ease-out [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:shadow-md ${bg} ${text} ${ring}`}
    >
      <p className="truncate text-[13px] leading-tight font-semibold">
        {assignment.turma.serie} &quot;{assignment.turma.letra}&quot;
      </p>
      <p className="mt-0.5 truncate text-[11px] leading-tight opacity-80">
        Prof(a). {assignment.turma.professorRegente}
      </p>
    </div>
  );
}
