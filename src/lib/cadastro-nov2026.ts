import { SEED_TURMAS } from "@/lib/seed-data";
import type { ScheduleConfig, Turma } from "@/lib/types";

const PROFESSORA_4A = "Edivania Macedo";
const NOVOS_ALUNOS_5A = ["Joaquim Oliveira Lima", "Benjamin Oliveira Lima"] as const;

function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * Revisão pontual solicitada com base na lista oficial de novembro/2026.
 * Não apaga alunos antigos nem altera registros de presença. O marcador
 * impede que uma edição administrativa posterior seja sobrescrita.
 */
export function revisarCadastroNov2026(
  turmas: Turma[],
  config: ScheduleConfig,
): { turmas: Turma[]; config: ScheduleConfig; alterado: boolean } {
  if (config.revisaoCadastroNov2026) return { turmas, config, alterado: false };

  const possui4A = turmas.some((t) => t.id === "t-4a");
  const possui5A = turmas.some((t) => t.id === "t-5a");
  if (!possui4A || !possui5A) return { turmas, config, alterado: false };

  const base5A = SEED_TURMAS.find((t) => t.id === "t-5a");
  const dadosNovos = NOVOS_ALUNOS_5A.map((nome) =>
    base5A?.alunos.find((aluno) => normalizarNome(aluno.nome) === normalizarNome(nome)),
  );
  if (dadosNovos.some((aluno) => !aluno)) return { turmas, config, alterado: false };

  const atualizadas = turmas.map((turma) => {
    if (turma.id === "t-4a") {
      return { ...turma, professorRegente: PROFESSORA_4A };
    }
    if (turma.id !== "t-5a") return turma;

    const cadastrados = new Set(turma.alunos.map((a) => normalizarNome(a.nome)));
    const ids = new Set(turma.alunos.map((a) => a.id));
    const incluir = dadosNovos.filter(
      (aluno) => aluno && !cadastrados.has(normalizarNome(aluno.nome)),
    );
    return {
      ...turma,
      alunos: [
        ...turma.alunos,
        ...incluir.map((aluno) => {
          const novo = { ...aluno! };
          // Nunca reutilizar um ID já ocupado pelo cadastro existente.
          if (ids.has(novo.id)) novo.id = `cadastro-2026-5a-${normalizarNome(novo.nome).replace(/\s+/g, "-")}`;
          ids.add(novo.id);
          return novo;
        }),
      ],
    };
  });

  return {
    turmas: atualizadas,
    config: { ...config, revisaoCadastroNov2026: true },
    alterado: true,
  };
}
