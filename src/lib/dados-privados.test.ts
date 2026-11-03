import { describe, expect, test } from "bun:test";

import {
  aniversarioDe,
  assinatura,
  cadastroPublico,
  chavePrivada,
  juntarDadosPrivados,
  linhasAlteradas,
} from "@/lib/dados-privados";
import type { Turma } from "@/lib/types";

const turma = (alunos: Turma["alunos"]): Turma[] => [
  { id: "t-1a", serie: "1º Ano", letra: "A", alunos } as unknown as Turma,
];

describe("dados privados dos alunos", () => {
  const completo = turma([
    {
      id: "a1",
      nome: "Ana",
      inep: "123",
      nascimento: "2018-11-03",
      endereco: "Rua X",
      anotacoes: [{ id: "n1", texto: "obs", em: "2026-11-03T12:00:00.000Z" }],
      necessidadeEspecial: true,
    },
    { id: "a2", nome: "Bia" },
  ] as Turma["alunos"]);

  test("o cadastro público fica sem INEP, nascimento, endereço e anotações", () => {
    const publico = cadastroPublico(completo, true);
    const ana = publico[0]!.alunos[0]!;
    expect(ana).toEqual({ id: "a1", nome: "Ana", necessidadeEspecial: true, aniversario: "11-03" });
    expect(JSON.stringify(publico)).not.toMatch(/123|2018|Rua X|obs/);
  });

  test("sem os dados privados carregados, o aniversário público é mantido", () => {
    const semDados = turma([{ id: "a1", nome: "Ana", aniversario: "05-07" }] as Turma["alunos"]);
    expect(cadastroPublico(semDados, false)[0]!.alunos[0]!.aniversario).toBe("05-07");
    expect(cadastroPublico(semDados, true)[0]!.alunos[0]!.aniversario).toBeUndefined();
  });

  test("só envia o que mudou", () => {
    const todas = linhasAlteradas(completo, new Map());
    expect(todas.map((l) => l.aluno_id)).toEqual(["a1"]);
    const salvas = new Map(todas.map((l) => [chavePrivada(l.turma_id, l.aluno_id), assinatura(l)]));
    expect(linhasAlteradas(completo, salvas)).toEqual([]);
    const mudou = turma([{ ...completo[0]!.alunos[0]!, inep: "999" }, completo[0]!.alunos[1]!]);
    expect(linhasAlteradas(mudou, salvas).map((l) => l.inep)).toEqual(["999"]);
  });

  test("apagar um dado privado também é enviado", () => {
    const salvas = new Map(
      linhasAlteradas(completo, new Map()).map((l) => [
        chavePrivada(l.turma_id, l.aluno_id),
        assinatura(l),
      ]),
    );
    const limpo = turma([{ id: "a1", nome: "Ana" }] as Turma["alunos"]);
    const [linha] = linhasAlteradas(limpo, salvas);
    expect(linha).toMatchObject({ aluno_id: "a1", inep: null, nascimento: null, anotacoes: [] });
  });

  test("os dados do banco voltam para o cadastro de quem tem login", () => {
    const publico = cadastroPublico(completo, true);
    const linhas = linhasAlteradas(completo, new Map());
    const junto = juntarDadosPrivados(publico, linhas);
    expect(junto[0]!.alunos[0]).toMatchObject({ inep: "123", nascimento: "2018-11-03" });
    expect(junto[0]!.alunos[1]).toEqual({ id: "a2", nome: "Bia" });
  });

  test("aniversarioDe", () => {
    expect(aniversarioDe("2016-02-29")).toBe("02-29");
    expect(aniversarioDe("29/02/2016")).toBeUndefined();
    expect(aniversarioDe(undefined)).toBeUndefined();
  });
});
