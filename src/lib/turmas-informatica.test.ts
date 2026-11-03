import { describe, expect, test } from "bun:test";

import { SEED_CONFIG } from "@/lib/seed-data";
import { buildWeeklySchedule } from "@/lib/schedule-engine";
import { turmaParticipaInformatica } from "@/lib/turmas-informatica";
import type { Turma } from "@/lib/types";

const regular: Turma = {
  id: "t-1a",
  serie: "1º Ano",
  letra: "A",
  professorRegente: "Docente",
  alunos: [{ id: "aluno-teste", nome: "Aluno Teste" }],
};

describe("participação no laboratório de informática", () => {
  test("mantém as turmas regulares do ensino fundamental", () => {
    expect(turmaParticipaInformatica(regular)).toBe(true);
    expect(turmaParticipaInformatica({ ...regular, id: "t-5b", serie: "5º Ano", letra: "B" })).toBe(true);
  });

  test("exclui EJA por sigla, identificação da turma ou nome completo", () => {
    expect(turmaParticipaInformatica({ ...regular, serie: "EJA" })).toBe(false);
    expect(turmaParticipaInformatica({ ...regular, serie: "1º Ano EJA" })).toBe(false);
    expect(turmaParticipaInformatica({ ...regular, id: "t-eja-1" })).toBe(false);
    expect(turmaParticipaInformatica({ ...regular, serie: "E.J.A." })).toBe(false);
    expect(turmaParticipaInformatica({ ...regular, serie: "Educação de Jovens e Adultos" })).toBe(false);
  });

  test("a EJA nunca é escolhida no rodízio, mesmo sendo enviada ao motor", () => {
    const eja: Turma = { ...regular, id: "t-eja", serie: "EJA", alunos: [{ id: "eja-1", nome: "Aluno EJA" }] };
    const grade = buildWeeklySchedule([regular, eja], SEED_CONFIG);
    expect(grade.length).toBeGreaterThan(0);
    expect(grade.every((a) => a.turma.id !== "t-eja")).toBe(true);
  });
});
