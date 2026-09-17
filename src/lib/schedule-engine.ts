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

/** Key used to look up a manual override or suspension for a fixed weekly slot. */
export function slotKey(dia: string, slotInicio: string): string {
  return `${dia}|${slotInicio}`;
}

/** Key used to look up a one-off suspension of a specific date's session. */
export function suspensaoKey(dateISO: string, dia: string, slotInicio: string): string {
  return `${dateISO}|${slotKey(dia, slotInicio)}`;
}

/**
 * Assigns one turma to each day+slot, cycling through the registered turmas
 * in round-robin order so every turma gets computer-lab time spread across
 * the week (no repeats on the same day when possible). The administrator can
 * override individual slots from the Programação page (`config.slotOverrides`);
 * those take precedence over the automatic rotation.
 */
export function buildWeeklySchedule(turmas: Turma[], config: ScheduleConfig): Assignment[] {
  if (turmas.length === 0) return [];
  const slots = buildDailySlots(config);
  const turmasById = new Map(turmas.map((t) => [t.id, t]));

  interface Pending {
    dia: string;
    diaIndex: number;
    slot: Slot;
    turma: Turma;
  }
  const pending: Pending[] = [];

  let cursor = 0;
  config.diasSemana.forEach((dia, diaIndex) => {
    slots.forEach((slot) => {
      const overrideId = config.slotOverrides?.[slotKey(dia, slot.inicio)];
      const turma =
        (overrideId ? turmasById.get(overrideId) : undefined) ?? turmas[cursor % turmas.length];
      cursor += 1;
      if (!turma) return;
      pending.push({ dia, diaIndex, slot, turma });
    });
  });

  // Session counts are derived from the final (post-override) assignments so
  // the group rotation in buildSubBlocos stays consistent for every turma.
  const occurrenceCount = new Map<string, number>();
  return pending
    .map((p) => {
      const ocorrenciaIndex = occurrenceCount.get(p.turma.id) ?? 0;
      occurrenceCount.set(p.turma.id, ocorrenciaIndex + 1);
      return { ...p, ocorrenciaIndex, sessoesPorSemana: 0 };
    })
    .map((assignment, _index, all) => ({
      ...assignment,
      sessoesPorSemana: all.filter((a) => a.turma.id === assignment.turma.id).length,
    }));
}

export interface GrupoRevezamento {
  indice: number;
  alunos: Aluno[];
  nome?: string | undefined;
  conteudo?: string | undefined;
}

/**
 * Returns the rotating groups of a turma.
 *
 * When the administrator registered groups manually, those are used and each
 * student is placed in the group chosen in the admin panel. Otherwise the
 * students are split automatically by the number of computers available.
 */
export function buildGrupos(turma: Turma, config: ScheduleConfig): GrupoRevezamento[] {
  const cadastrados = turma.grupos ?? [];

  if (cadastrados.length > 0) {
    const grupos: GrupoRevezamento[] = cadastrados.map((grupo, indice) => ({
      indice,
      nome: grupo.nome,
      conteudo: grupo.conteudo,
      alunos: turma.alunos.filter((aluno) => aluno.grupoId === grupo.id),
    }));
    const semGrupo = turma.alunos.filter(
      (aluno) => !aluno.grupoId || !cadastrados.some((g) => g.id === aluno.grupoId),
    );
    if (semGrupo.length > 0) {
      grupos.push({ indice: grupos.length, nome: "Sem grupo definido", alunos: semGrupo });
    }
    return grupos;
  }

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

/**
 * Monotonically increasing week number, stable across every day of the same
 * school week (Monday-Sunday), used as the seed for cross-week rotation.
 */
export function getWeekIndex(date: Date): number {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diffToMonday);
  return Math.floor(d.getTime() / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Splits one hour-long slot into rotating sub-blocks (e.g. two 30min turns).
 *
 * The starting group is offset both by how many sub-blocks this turma has
 * already used earlier in the same week (`ocorrenciaIndex`) and by the
 * current week number, advanced by exactly the number of sub-blocks the
 * turma consumes per week (`sessoesPorSemana * totalSubBlocos`). That keeps
 * the rotation continuous week over week — the group that starts a new week
 * is exactly the one that would come next, so every group (and therefore
 * every student) gets an equal share of turns over time instead of the same
 * groups always going first.
 */
export function buildSubBlocos(
  assignment: Assignment,
  config: ScheduleConfig,
  weekIndex = 0,
): SubBloco[] {
  const grupos = buildGrupos(assignment.turma, config);
  const inicio = toMinutes(assignment.slot.inicio);
  const fim = toMinutes(assignment.slot.fim);
  const passo = Math.max(1, config.duracaoGrupoMinutos);
  const totalSubBlocos = Math.max(1, Math.round((fim - inicio) / passo));
  const subBlocos: SubBloco[] = [];

  const consumoPorSemana = assignment.sessoesPorSemana * totalSubBlocos;
  const startGrupo =
    (weekIndex * consumoPorSemana + assignment.ocorrenciaIndex * totalSubBlocos) % grupos.length;
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
  /** True when the administrator stopped this specific session for today. */
  suspensa: boolean;
}

/** Formats a Date as the `YYYY-MM-DD` key used to identify "today" for suspensions. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

  const suspensa = Boolean(
    config.suspensoes?.[suspensaoKey(toDateKey(now), dia, assignment.slot.inicio)],
  );

  const subBlocos = buildSubBlocos(assignment, config, getWeekIndex(now));
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

  return { assignment, subBloco, segundosRestantes, proximoSubBloco, suspensa };
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
