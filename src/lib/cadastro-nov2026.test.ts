import { describe, expect, test } from "bun:test";

import { revisarCadastroNov2026 } from "@/lib/cadastro-nov2026";
import { SEED_CONFIG, SEED_TURMAS } from "@/lib/seed-data";
import type { Turma } from "@/lib/types";

const nomes = ["Benjamin Oliveira Lima", "Joaquim Oliveira Lima"];
const turmasAntigas = (): Turma[] =>
  SEED_TURMAS.map((t) => {
    if (t.id === "t-4a") return { ...t, professorRegente: "Professora antiga" };
    if (t.id === "t-5a") return { ...t, alunos: t.alunos.filter((a) => !nomes.includes(a.nome)) };
    return t;
  });

describe("revisão do cadastro escolar de novembro/2026", () => {
  test("corrige o 4º A e insere uma única vez os dois alunos pós-censo do 5º A", () => {
    const antes = turmasAntigas();
    const antigo5A = antes.find((t) => t.id === "t-5a")!;
    const revisao = revisarCadastroNov2026(antes, { ...SEED_CONFIG, revisaoCadastroNov2026: undefined });
    expect(revisao.alterado).toBe(true);
    expect(revisao.turmas.find((t) => t.id === "t-4a")?.professorRegente).toBe("Edivania Macedo");
    const novo5A = revisao.turmas.find((t) => t.id === "t-5a")!;
    expect(novo5A.alunos).toHaveLength(antigo5A.alunos.length + 2);
    for (const nome of nomes) expect(novo5A.alunos.filter((a) => a.nome === nome)).toHaveLength(1);
    const novamente = revisarCadastroNov2026(revisao.turmas, revisao.config);
    expect(novamente.alterado).toBe(false);
    expect(novamente.turmas).toBe(revisao.turmas);
  });

  test("preserva informações anteriores e não modifica frequências ou outras turmas", () => {
    const turmas = turmasAntigas();
    const a5 = turmas.find((t) => t.id === "t-5a")!;
    a5.alunos[0] = { ...a5.alunos[0]!, nascimento: "2015-01-01" };
    const revisao = revisarCadastroNov2026(turmas, { ...SEED_CONFIG, revisaoCadastroNov2026: undefined });
    expect(revisao.turmas.find((t) => t.id === "t-5a")?.alunos[0]?.nascimento).toBe("2015-01-01");
    expect(revisao.turmas.find((t) => t.id === "t-3a")).toBe(turmas.find((t) => t.id === "t-3a"));
  });

  test("não desfaz alterações administrativas depois que a migração foi registrada", () => {
    const turmas = turmasAntigas();
    const revisao = revisarCadastroNov2026(turmas, { ...SEED_CONFIG, revisaoCadastroNov2026: true });
    expect(revisao.alterado).toBe(false);
    expect(revisao.turmas).toBe(turmas);
  });

  test("não modifica cadastros incompletos sem as duas turmas envolvidas", () => {
    const turmas = turmasAntigas().filter((t) => t.id !== "t-5a");
    const revisao = revisarCadastroNov2026(turmas, { ...SEED_CONFIG, revisaoCadastroNov2026: undefined });
    expect(revisao.alterado).toBe(false);
    expect(revisao.turmas).toBe(turmas);
  });
});
