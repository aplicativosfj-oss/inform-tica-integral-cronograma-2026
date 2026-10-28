import { describe, expect, test } from "bun:test";

import { infoAniversario, textoIdade } from "@/lib/aniversario";

describe("infoAniversario", () => {
  test("idade em anos e meses e dias até o aniversário", () => {
    const i = infoAniversario("2017-03-15", "2026-10-27")!;
    expect(i.anos).toBe(9);
    expect(i.meses).toBe(7);
    expect(i.diaMes).toBe("15 de março");
    expect(i.completa).toBe(10);
    expect(i.emDias).toBe(139);
    expect(i.hoje).toBe(false);
    expect(textoIdade(i)).toBe("9 anos e 7 meses");
  });

  test("no dia do aniversário", () => {
    expect(infoAniversario("2017-03-15", "2026-03-15")).toMatchObject({
      hoje: true,
      emDias: 0,
      anos: 9,
      meses: 0,
      completa: 9,
    });
  });

  test("véspera e nascido em 29/02", () => {
    expect(infoAniversario("2017-03-15", "2026-03-14")!.emDias).toBe(1);
    expect(infoAniversario("2020-02-29", "2027-02-28")!.hoje).toBe(true);
  });

  test("sem data", () => {
    expect(infoAniversario(undefined, "2026-10-27")).toBeNull();
  });
});
