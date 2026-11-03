import { describe, expect, test } from "bun:test";

import { SEED_CONFIG, SEED_TURMAS } from "@/lib/seed-data";
import { marcarTransferidosNov2026 } from "@/lib/transferidos-nov2026";
import type { Turma } from "@/lib/types";

const NOME = "Antonia Eliza Nogueira Silva";
const semMarca = (): Turma[] =>
  SEED_TURMAS.map((t) => ({
    ...t,
    alunos: t.alunos.map(({ situacao: _s, situacaoObs: _o, ...a }) => a),
  }));

describe("alunos transferidos de novembro/2026", () => {
  test("marca a Antônia Eliza (2º A) como transferida, uma única vez", () => {
    const revisao = marcarTransferidosNov2026(semMarca(), {
      ...SEED_CONFIG,
      revisaoTransferidosNov2026: undefined,
    });
    expect(revisao.alterado).toBe(true);
    const aluna = revisao.turmas.find((t) => t.id === "t-2a")!.alunos.find((a) => a.nome === NOME);
    expect(aluna?.situacao).toBe("transferido");
    const outros = revisao.turmas.flatMap((t) => t.alunos).filter((a) => a.situacao);
    expect(outros).toHaveLength(1);
    expect(marcarTransferidosNov2026(revisao.turmas, revisao.config).alterado).toBe(false);
  });

  test("respeita uma reativação feita depois no painel", () => {
    const revisao = marcarTransferidosNov2026(semMarca(), { ...SEED_CONFIG });
    expect(revisao.alterado).toBe(false);
  });

  test("o cadastro inicial já traz a aluna como transferida", () => {
    const aluna = SEED_TURMAS.find((t) => t.id === "t-2a")!.alunos.find((a) => a.nome === NOME);
    expect(aluna?.situacao).toBe("transferido");
  });
});
