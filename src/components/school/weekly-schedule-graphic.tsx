import { useMemo } from "react";

import { useAppStore } from "@/lib/app-store";
import { buildDailySlots, buildWeeklySchedule } from "@/lib/schedule-engine";
import type { Assignment } from "@/lib/types";

// Validated sequential (one-hue, light→dark) ramp — see project notes on the
// dataviz color procedure. Ordered light→dark so lower grades read lighter.
const SERIE_RAMP = ["#86b6ef", "#5598e7", "#2a78d6", "#1c5cab", "#104281"];
const TEXT_ON_LIGHT_STEPS = 2; // first N ramp steps are light enough for dark text

function toMinutes(hhmm: string): number {
  const parts = hhmm.split(":");
  return Number(parts[0] ?? 0) * 60 + Number(parts[1] ?? 0);
}

function serieColor(serieIndex: number): { fill: string; text: string } {
  const fill = SERIE_RAMP[serieIndex % SERIE_RAMP.length] ?? SERIE_RAMP[SERIE_RAMP.length - 1]!;
  const text = serieIndex < TEXT_ON_LIGHT_STEPS ? "#0b1b33" : "#ffffff";
  return { fill, text };
}

/**
 * A single, self-contained SVG "poster" of the whole week — built from the
 * live schedule (not a static picture), so it never goes stale when turmas,
 * hours or breaks change in Configurações. Meant for the homepage: readable
 * at a glance, exportable/printable as an image, no interaction required.
 */
export function WeeklyScheduleGraphic() {
  const { turmas, config } = useAppStore();

  const { linhas, colunas, series, pausas, lookup } = useMemo(() => {
    const dailySlots = buildDailySlots(config);
    const assignments = buildWeeklySchedule(turmas, config);
    const byDayAndSlot = new Map<string, Assignment>();
    for (const a of assignments) byDayAndSlot.set(`${a.dia}|${a.slot.inicio}`, a);

    const seriesUnicas: string[] = [];
    for (const t of turmas) if (!seriesUnicas.includes(t.serie)) seriesUnicas.push(t.serie);

    // Use the real configured break windows (not the gap between adjacent
    // slots) so a few idle leftover minutes never get mislabeled as part of
    // the break — e.g. lunch shows its actual 11:00 start even if the slot
    // before it already ended a bit earlier at 10:45.
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
  }, [turmas, config]);

  if (turmas.length === 0 || linhas.length === 0) return null;

  // Layout constants (SVG user units).
  const labelColW = 96;
  const colW = 168;
  const headerH = 44;
  const rowH = 64;
  const gapH = 30;
  const legendH = 44;
  const padding = 20;

  const width = padding * 2 + labelColW + colunas.length * colW;
  const bodyHeight = linhas.length * rowH + pausas.length * gapH;
  const height = padding * 2 + headerH + bodyHeight + legendH;

  function rowY(index: number): number {
    let y = headerH;
    for (let i = 0; i < index; i += 1) {
      y += rowH;
      if (pausas.some((p) => p.apos === i)) y += gapH;
    }
    return y;
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Agenda semanal da sala de informática, por dia e horário"
      className="h-auto w-full"
    >
      <rect x={0} y={0} width={width} height={height} rx={20} fill="#f7faff" />

      <g transform={`translate(${padding}, ${padding})`}>
        {/* Column headers: weekday names */}
        {colunas.map((dia, colIndex) => (
          <text
            key={dia}
            x={labelColW + colIndex * colW + colW / 2}
            y={headerH / 2 + 6}
            textAnchor="middle"
            fontSize={16}
            fontWeight={700}
            fill="#0b1b33"
          >
            {dia}
          </text>
        ))}

        {/* Row headers: time ranges */}
        {linhas.map((slot, rowIndex) => (
          <text
            key={slot.inicio}
            x={labelColW - 12}
            y={rowY(rowIndex) + rowH / 2 + 4}
            textAnchor="end"
            fontSize={13}
            fontWeight={600}
            fill="#41506b"
          >
            {slot.inicio}–{slot.fim}
          </text>
        ))}

        {/* Break bands spanning every column */}
        {pausas.map((pausa) => (
          <g key={pausa.apos} transform={`translate(0, ${rowY(pausa.apos) + rowH + gapH / 2})`}>
            <line
              x1={labelColW}
              x2={labelColW + colunas.length * colW}
              y1={0}
              y2={0}
              stroke="#c7d4ea"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <text
              x={labelColW + (colunas.length * colW) / 2}
              y={4}
              textAnchor="middle"
              fontSize={11}
              fontWeight={600}
              fill="#7186a8"
            >
              {pausa.label} · {pausa.horario}
            </text>
          </g>
        ))}

        {/* Grid cells */}
        {linhas.map((slot, rowIndex) =>
          colunas.map((dia, colIndex) => {
            const assignment = lookup.get(`${dia}|${slot.inicio}`);
            if (!assignment) return null;
            const serieIndex = Math.max(0, series.indexOf(assignment.turma.serie));
            const { fill, text } = serieColor(serieIndex);
            const cellPad = 5;
            const x = labelColW + colIndex * colW + cellPad;
            const y = rowY(rowIndex) + cellPad;
            const w = colW - cellPad * 2;
            const h = rowH - cellPad * 2;

            return (
              <g key={`${dia}-${slot.inicio}`}>
                <rect x={x} y={y} width={w} height={h} rx={10} fill={fill} />
                <text x={x + 12} y={y + h / 2 - 4} fontSize={15} fontWeight={700} fill={text}>
                  {assignment.turma.serie} &quot;{assignment.turma.letra}&quot;
                </text>
                <text x={x + 12} y={y + h / 2 + 16} fontSize={11} fill={text} opacity={0.85}>
                  Prof(a). {assignment.turma.professorRegente}
                </text>
              </g>
            );
          }),
        )}
      </g>

      {/* Legend: one swatch per série, using the same ordinal ramp */}
      <g transform={`translate(${padding}, ${padding + headerH + bodyHeight + 20})`}>
        {series.map((serie, index) => {
          const { fill } = serieColor(index);
          const x = index * 140;
          return (
            <g key={serie} transform={`translate(${x}, 0)`}>
              <rect x={0} y={-12} width={14} height={14} rx={4} fill={fill} />
              <text x={20} y={0} fontSize={12} fill="#41506b">
                {serie}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
