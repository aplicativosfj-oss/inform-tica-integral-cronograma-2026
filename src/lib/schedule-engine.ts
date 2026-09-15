import type { Aluno, Assignment, ScheduleConfig, Slot, Turma } from "@/lib/types";

function toMinutes(hhmm: string): number {
  const parts = hhmm.split(":");
  const h = Number(parts[0] ?? 0);
  const m = Number(parts[1] ?? 0);
  return h * 60 + m;
}

function toHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Builds the daily time slots (e.g. 08:00-09:00, ... skipping lunch break). */
export function buildDailySlots(config: ScheduleConfig): Slot[] {
  const slots: Slot[] = [];
  const start = toMinutes(config.horaInicio);
  const end = toMinutes(config.horaFim);
  const breakStart = toMinutes(config.intervaloInicio);
  const breakEnd = toMinutes(config.intervaloFim);
  const step = config.duracaoSlotMinutos;

  for (let cursor = start; cursor + step <= end; cursor += step) {
    const slotEnd = cursor + step;
    const overlapsBreak = cursor < breakEnd && slotEnd > breakStart;
    if (overlapsBreak) continue;
    slots.push({ inicio: toHHMM(cursor), fim: toHHMM(slotEnd) });
  }
  return slots;
}

/**
 * Automatically assigns one turma to each day+slot, cycling through the
 * registered turmas in round-robin order so every turma gets computer-lab
 * time spread across the week (no repeats on the same day when possible).
 */
export function buildWeeklySchedule(turmas: Turma[], config: ScheduleConfig): Assignment[] {
  if (turmas.length === 0) return [];
  const slots = buildDailySlots(config);
  const assignments: Assignment[] = [];
  const occurrenceCount = new Map<string, number>();

  let cursor = 0;
  config.diasSemana.forEach((dia, diaIndex) => {
    slots.forEach((slot) => {
      const turma = turmas[cursor % turmas.length];
      cursor += 1;
      if (!turma) return;
      const ocorrenciaIndex = occurrenceCount.get(turma.id) ?? 0;
      occurrenceCount.set(turma.id, ocorrenciaIndex + 1);
      assignments.push({ dia, diaIndex, slot, turma, ocorrenciaIndex });
    });
  });

  return assignments;
}

export interface GrupoRevezamento {
  indice: number;
  alunos: Aluno[];
}

/** Splits a turma's students into rotating groups limited by computer count. */
export function buildGrupos(turma: Turma, config: ScheduleConfig): GrupoRevezamento[] {
  const tamanho = Math.max(1, config.numeroComputadores);
  const grupos: GrupoRevezamento[] = [];
  for (let i = 0; i < turma.alunos.length; i += tamanho) {
    grupos.push({ indice: grupos.length, alunos: turma.alunos.slice(i, i + tamanho) });
  }
  if (grupos.length === 0) grupos.push({ indice: 0, alunos: [] });
  return grupos;
}

export interface SubBloco {
  indice: number;
  inicio: string;
  fim: string;
  grupo: GrupoRevezamento;
}

/** Splits one hour-long slot into rotating sub-blocks (e.g. two 30min turns). */
export function buildSubBlocos(assignment: Assignment, config: ScheduleConfig): SubBloco[] {
  const grupos = buildGrupos(assignment.turma, config);
  const inicio = toMinutes(assignment.slot.inicio);
  const fim = toMinutes(assignment.slot.fim);
  const passo = Math.max(1, config.duracaoGrupoMinutos);
  const totalSubBlocos = Math.max(1, Math.round((fim - inicio) / passo));
  const subBlocos: SubBloco[] = [];

  const startGrupo = (assignment.ocorrenciaIndex * totalSubBlocos) % grupos.length;
  for (let i = 0; i < totalSubBlocos; i += 1) {
    const grupo = grupos[(startGrupo + i) % grupos.length];
    if (!grupo) continue;
    subBlocos.push({
      indice: i,
      inicio: toHHMM(inicio + i * passo),
      fim: toHHMM(Math.min(fim, inicio + (i + 1) * passo)),
      grupo,
    });
  }
  return subBlocos;
}

const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function currentWeekdayLabel(date: Date): string {
  return WEEKDAY_LABELS[date.getDay()] ?? "";
}

export interface SessaoAtual {
  assignment: Assignment;
  subBloco: SubBloco;
  segundosRestantes: number;
  proximoSubBloco?: SubBloco | undefined;
}

/** Finds the class session (if any) happening right now, and the live countdown. */
export function findSessaoAtual(
  assignments: Assignment[],
  config: ScheduleConfig,
  now: Date,
): SessaoAtual | null {
  const dia = currentWeekdayLabel(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowSeconds = nowMinutes * 60 + now.getSeconds();

  const assignment = assignments.find((a) => {
    if (a.dia !== dia) return false;
    const start = toMinutes(a.slot.inicio);
    const end = toMinutes(a.slot.fim);
    return nowMinutes >= start && nowMinutes < end;
  });
  if (!assignment) return null;

  const subBlocos = buildSubBlocos(assignment, config);
  const subBlocoIndex = subBlocos.findIndex((sb) => {
    const start = toMinutes(sb.inicio) * 60;
    const end = toMinutes(sb.fim) * 60;
    return nowSeconds >= start && nowSeconds < end;
  });
  const subBloco = subBlocos[subBlocoIndex] ?? subBlocos[0];
  if (!subBloco) return null;

  const fimSegundos = toMinutes(subBloco.fim) * 60;
  const segundosRestantes = Math.max(0, fimSegundos - nowSeconds);
  const proximoSubBloco = subBlocos[subBlocoIndex + 1];

  return { assignment, subBloco, segundosRestantes, proximoSubBloco };
}

export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function nextAssignmentsForDay(assignments: Assignment[], dia: string): Assignment[] {
  return assignments
    .filter((a) => a.dia === dia)
    .sort((a, b) => toMinutes(a.slot.inicio) - toMinutes(b.slot.inicio));
}
