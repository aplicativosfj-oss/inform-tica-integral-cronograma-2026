import { describe, expect, test } from "bun:test";

import { aplicarListaOficial2026 } from "@/lib/lista-oficial-2026";
import { LISTA_OFICIAL_2026 } from "@/lib/lista-oficial-2026-dados";
import { SEED_CONFIG, SEED_TURMAS } from "@/lib/seed-data";
import type { Turma } from "@/lib/types";

const cfg = { ...SEED_CONFIG, revisaoListaOficial2026: undefined };
const ativos = (t: Turma) => t.alunos.filter((a) => !a.situacao || a.situacao === "ativo");

describe("lista oficial 2026", () => {
  test("não traz EJA e cobre as 10 turmas", () => {
    expect(new Set(LISTA_OFICIAL_2026.map((e) => e.turmaId)).size).toBe(10);
  });

  test("o cadastro inicial bate com a lista: ativos, transferidos e novos", () => {
    const porId = Object.fromEntries(SEED_TURMAS.map((t) => [t.id, t]));
    expect(ativos(porId["t-1a"]!).map((a) => a.nome)).toContain("Davi Lucas Silva Costa");
    expect(ativos(porId["t-2b"]!).map((a) => a.nome)).toContain("Ulisses dos Santos da Silva");
    for (const [turma, nome] of [
      ["t-2b", "Arthur da Silva Sousa"],
      ["t-3b", "João Pedro Nogueira Silva"],
      ["t-3b", "Cauã Deyverson Damazio da Silva"],
      ["t-5b", "Fernando Vitor Neri da Silva"],
    ] as const) {
      const a = porId[turma]!.alunos.find((x) => x.nome === nome);
      expect(a?.situacao).toBe("transferido");
    }
    const ruan = porId["t-5a"]!.alunos.find((a) => a.nome.startsWith("Ruan Júlio"));
    expect(ruan?.situacao).toBe("desistente");
  });

  test("nunca sobrescreve dado já digitado e roda uma única vez", () => {
    const antes = SEED_TURMAS.map((t) =>
      t.id === "t-5b"
        ? {
            ...t,
            alunos: t.alunos.map((a, i) =>
              i === 0 ? { ...a, inep: "999", nascimento: "2000-01-01" } : a,
            ),
          }
        : t,
    );
    const r = aplicarListaOficial2026(antes, cfg);
    const a = r.turmas.find((t) => t.id === "t-5b")!.alunos[0]!;
    expect(a.inep).toBe("999");
    expect(a.nascimento).toBe("2000-01-01");
    const totalAntes = antes.reduce((n, t) => n + t.alunos.length, 0);
    const totalDepois = r.turmas.reduce((n, t) => n + t.alunos.length, 0);
    expect(totalDepois).toBe(totalAntes);
    expect(aplicarListaOficial2026(r.turmas, r.config).alterado).toBe(false);
  });

  test("em um cadastro antigo, acrescenta quem falta sem duplicar", () => {
    const antigos = SEED_TURMAS.map((t) => ({
      ...t,
      alunos: t.alunos
        .filter((a) => !a.id.startsWith("lista-2026-"))
        .map(({ inep: _i, nascimento: _n, anotacoes: _a, ...a }) => a),
    }));
    const r = aplicarListaOficial2026(antigos, cfg);
    const t5a = r.turmas.find((t) => t.id === "t-5a")!;
    expect(ativos(t5a)).toHaveLength(27);
    expect(t5a.alunos.find((a) => a.nome === "Aléxia Fontinele Ponce")?.inep).toBe("183129705170");
    const nomes = r.turmas.flatMap((t) => t.alunos.map((a) => `${t.id}:${a.nome}`));
    expect(new Set(nomes).size).toBe(nomes.length);
  });
});
