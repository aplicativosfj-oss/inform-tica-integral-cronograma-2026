import { describe, expect, test } from "bun:test";

import {
  buildWeeklySchedule,
  encontrarHorariosParaReprogramar,
  findSessaoAtual,
  proximoDiaLetivo,
} from "@/lib/schedule-engine";
import { SEED_CONFIG, SEED_TURMAS } from "@/lib/seed-data";

describe("Finados no motor da Agenda Educativa", () => {
  test("não mostra sessão ao vivo no dia 02/11", () => {
    const data = new Date(2026, 10, 2, 9, 0);
    const grade = buildWeeklySchedule(SEED_TURMAS, SEED_CONFIG);
    expect(findSessaoAtual(grade, SEED_CONFIG, data)).toBeNull();
  });
  test("o próximo dia letivo após domingo 01/11 é terça 03/11", () => {
    const proximo = proximoDiaLetivo(SEED_CONFIG, new Date(2026, 10, 1, 12, 0));
    expect(proximo).not.toBeNull();
    expect(proximo?.data.getFullYear()).toBe(2026);
    expect(proximo?.data.getMonth()).toBe(10);
    expect(proximo?.data.getDate()).toBe(3);
  });
  test("Finados não aparece como horário disponível para reposição", () => {
    const horarios = encontrarHorariosParaReprogramar(
      SEED_TURMAS, SEED_CONFIG, "t-1a", new Date(2026, 10, 2, 7, 0), 20, 3,
    );
    expect(horarios.some((h) => h.dataKey === "2026-11-02")).toBe(false);
  });
});
