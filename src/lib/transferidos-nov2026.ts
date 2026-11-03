import type { ScheduleConfig, Turma } from "@/lib/types";

/**
 * Alunos que o professor informou como transferidos. Eles continuam no
 * cadastro (ficha, histórico, presenças), mas saem do rodízio e das contas e
 * aparecem apagados na lista da turma.
 */
type Transferido = {
  turmaId: string;
  nome: string;
  obs: string;
  em: string;
  /** Padrão: transferido. */
  situacao?: "transferido" | "desistente";
};

/**
 * Cada lote é aplicado uma única vez, guardado por uma marca própria na
 * configuração. Um aluno novo entra num lote novo (com marca nova) para não
 * desfazer uma reativação já feita no painel nos lotes anteriores.
 */
const LOTES: {
  marca:
    "revisaoTransferidosNov2026" | "revisaoTransferidosNov2026b" | "revisaoTransferidosNov2026c";
  alunos: Transferido[];
}[] = [
  {
    marca: "revisaoTransferidosNov2026",
    alunos: [
      {
        turmaId: "t-2a",
        nome: "Antonia Eliza Nogueira Silva",
        obs: "Transferida (informado pelo professor em 03/11/2026).",
        em: "2026-11-03",
      },
    ],
  },
  {
    marca: "revisaoTransferidosNov2026b",
    alunos: [
      {
        turmaId: "t-2b",
        nome: "João Pedro Sabóia Roque",
        obs: "Transferido (informado pelo professor em 03/11/2026).",
        em: "2026-11-03",
      },
    ],
  },
  {
    marca: "revisaoTransferidosNov2026c",
    alunos: [
      {
        turmaId: "t-2b",
        nome: "Yhasmin Nascimento de Souza",
        obs: "Desistente (informado pelo professor em 03/11/2026).",
        em: "2026-11-03",
        situacao: "desistente",
      },
    ],
  },
];

export const TRANSFERIDOS_NOV2026: Transferido[] = LOTES.flatMap((l) => l.alunos);

function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/** Aplica cada lote acima uma única vez; uma reativação feita depois no painel é respeitada. */
export function marcarTransferidosNov2026(
  turmas: Turma[],
  config: ScheduleConfig,
): { turmas: Turma[]; config: ScheduleConfig; alterado: boolean } {
  const pendentes = LOTES.filter((l) => !config[l.marca]);
  if (pendentes.length === 0) return { turmas, config, alterado: false };
  const lista = pendentes.flatMap((l) => l.alunos);

  const atualizadas = turmas.map((turma) => {
    const daTurma = lista.filter((t) => t.turmaId === turma.id);
    if (daTurma.length === 0) return turma;
    return {
      ...turma,
      alunos: turma.alunos.map((aluno) => {
        const marca = daTurma.find((t) => normalizarNome(t.nome) === normalizarNome(aluno.nome));
        if (!marca || (aluno.situacao && aluno.situacao !== "ativo")) return aluno;
        return {
          ...aluno,
          situacao: marca.situacao ?? ("transferido" as const),
          situacaoEm: aluno.situacaoEm ?? marca.em,
          situacaoObs: aluno.situacaoObs ?? marca.obs,
        };
      }),
    };
  });

  const novaConfig = { ...config };
  for (const l of pendentes) novaConfig[l.marca] = true;
  return { turmas: atualizadas, config: novaConfig, alterado: true };
}
