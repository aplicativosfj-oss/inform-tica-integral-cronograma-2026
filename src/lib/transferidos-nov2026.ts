import type { ScheduleConfig, Turma } from "@/lib/types";

/**
 * Alunos que o professor informou como transferidos. Eles continuam no
 * cadastro (ficha, histórico, presenças), mas saem do rodízio e das contas e
 * aparecem apagados na lista da turma.
 */
export const TRANSFERIDOS_NOV2026: { turmaId: string; nome: string; obs: string }[] = [
  {
    turmaId: "t-2a",
    nome: "Antonia Eliza Nogueira Silva",
    obs: "Transferida (informado pelo professor em 03/11/2026).",
  },
];

function normalizarNome(nome: string): string {
  return nome.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().replace(/\s+/g, " ").toLowerCase();
}

/** Aplica a lista acima uma única vez; uma reativação feita depois no painel é respeitada. */
export function marcarTransferidosNov2026(
  turmas: Turma[],
  config: ScheduleConfig,
): { turmas: Turma[]; config: ScheduleConfig; alterado: boolean } {
  if (config.revisaoTransferidosNov2026) return { turmas, config, alterado: false };

  let alterado = false;
  const atualizadas = turmas.map((turma) => {
    const daTurma = TRANSFERIDOS_NOV2026.filter((t) => t.turmaId === turma.id);
    if (daTurma.length === 0) return turma;
    return {
      ...turma,
      alunos: turma.alunos.map((aluno) => {
        const marca = daTurma.find((t) => normalizarNome(t.nome) === normalizarNome(aluno.nome));
        if (!marca || aluno.situacao === "transferido") return aluno;
        alterado = true;
        return {
          ...aluno,
          situacao: "transferido" as const,
          situacaoObs: aluno.situacaoObs ?? marca.obs,
        };
      }),
    };
  });

  return {
    turmas: alterado ? atualizadas : turmas,
    config: { ...config, revisaoTransferidosNov2026: true },
    alterado: true,
  };
}
