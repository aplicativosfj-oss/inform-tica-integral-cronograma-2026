import { describe, expect, test } from "bun:test";
import { feriadoNacionalEm, haAulaRegularEm } from "@/lib/calendario-escolar";

describe("feriados na Agenda Educativa", () => {
  test("02/11/2026 é Dia de Finados, sem aula regular", () => {
    expect(feriadoNacionalEm("2026-11-02")?.nome).toBe("Dia de Finados");
    expect(haAulaRegularEm("2026-11-02")).toBe(false);
  });
  test("Finados é recorrente a cada ano", () => {
    expect(feriadoNacionalEm("2027-11-02")?.tipo).toBe("nacional");
  });
  test("dias letivos seguintes não são alterados", () => {
    expect(feriadoNacionalEm("2026-11-03")).toBeNull();
    expect(haAulaRegularEm("2026-11-03")).toBe(true);
  });
  test("não confunde datas diferentes nem incompletas", () => {
    expect(feriadoNacionalEm("2026-02-11")).toBeNull();
    expect(feriadoNacionalEm("11-02")).toBeNull();
  });
});
