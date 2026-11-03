import { LISTA_OFICIAL_2026 } from "@/lib/lista-oficial-2026-dados";
import type { Aluno, ScheduleConfig, SituacaoMatricula, Turma } from "@/lib/types";

export interface EntradaListaOficial {
  turmaId: string;
  nome: string;
  especial?: boolean;
  situacao?: Exclude<SituacaoMatricula, "ativo">;
  /** YYYY-MM-DD */
  situacaoEm?: string;
}

function normalizar(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function idNovo(e: EntradaListaOficial): string {
  return `lista-2026-${e.turmaId}-${normalizar(e.nome).replace(/\s+/g, "-")}`;
}

function textoSituacao(e: EntradaListaOficial): string | undefined {
  if (!e.situacao) return undefined;
  const quando = e.situacaoEm ? ` em ${e.situacaoEm.split("-").reverse().join("/")}` : "";
  return e.situacao === "transferido"
    ? `Transferido(a)${quando}, conforme a lista oficial.`
    : "Deixou de frequentar (ou nunca compareceu), conforme a lista oficial.";
}

function completar(aluno: Aluno, e: EntradaListaOficial): Aluno {
  const novo: Aluno = { ...aluno };
  if (e.especial && !novo.necessidadeEspecial) novo.necessidadeEspecial = true;
  if (e.situacao && (!novo.situacao || novo.situacao === "ativo")) {
    novo.situacao = e.situacao;
    novo.situacaoEm = e.situacaoEm;
    novo.situacaoObs = textoSituacao(e);
  } else if (e.situacao && novo.situacao === e.situacao && !novo.situacaoEm) {
    novo.situacaoEm = e.situacaoEm;
  }
  return novo;
}

/**
 * Confere o cadastro com a lista oficial uma única vez: marca
 * transferidos/desistentes e inclui quem está na lista mas não no sistema
 * (quem já saiu entra apagado). Nunca apaga nem troca o que já foi digitado.
 * INEP, nascimento e observações de saúde não passam por aqui: vão direto ao
 * banco, porque o repositório é público.
 */
export function aplicarListaOficial2026(
  turmas: Turma[],
  config: ScheduleConfig,
  lista: EntradaListaOficial[] = LISTA_OFICIAL_2026,
): { turmas: Turma[]; config: ScheduleConfig; alterado: boolean } {
  if (config.revisaoListaOficial2026v2) return { turmas, config, alterado: false };

  const atualizadas = turmas.map((turma) => {
    const daTurma = lista.filter((e) => e.turmaId === turma.id);
    if (daTurma.length === 0) return turma;
    const porNome = new Map(daTurma.map((e) => [normalizar(e.nome), e]));
    const usados = new Set<string>();
    const alunos = turma.alunos.map((aluno) => {
      const e = porNome.get(normalizar(aluno.nome));
      if (!e) return aluno;
      usados.add(normalizar(e.nome));
      return completar(aluno, e);
    });
    const ids = new Set(alunos.map((a) => a.id));
    for (const e of daTurma) {
      if (usados.has(normalizar(e.nome))) continue;
      let id = idNovo(e);
      while (ids.has(id)) id += "-2";
      ids.add(id);
      alunos.push(completar({ id, nome: e.nome }, e));
    }
    return { ...turma, alunos };
  });

  return {
    turmas: atualizadas,
    config: { ...config, revisaoListaOficial2026v2: true },
    alterado: true,
  };
}
