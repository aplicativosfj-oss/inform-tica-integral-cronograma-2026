/**
 * Dados pessoais dos alunos que só os administradores (login do painel) podem
 * ver: INEP, data de nascimento, endereço e anotações do professor.
 *
 * O cadastro das turmas (`app_state.turmas`) é lido pelo site público, então
 * esses campos ficam fora dele, na tabela `alunos_privado`, que o banco só
 * entrega a quem está logado (ver supabase/alunos-privado.sql). No cadastro
 * público fica apenas o dia e o mês do aniversário (`aniversario`, "MM-DD"),
 * para o selo de aniversariante continuar aparecendo para todos.
 */

import type { AnotacaoAluno, Turma } from "@/lib/types";

export const TABELA_PRIVADA = "alunos_privado";

export const CAMPOS_PRIVADOS = ["inep", "nascimento", "endereco", "anotacoes"] as const;

export interface LinhaPrivada {
  turma_id: string;
  aluno_id: string;
  inep: string | null;
  nascimento: string | null;
  endereco: string | null;
  anotacoes: AnotacaoAluno[];
}

export const chavePrivada = (turmaId: string, alunoId: string) => `${turmaId}::${alunoId}`;

/** "YYYY-MM-DD" → "MM-DD" (ou undefined se a data não for válida). */
export function aniversarioDe(nascimento: string | undefined): string | undefined {
  const m = nascimento?.match(/^\d{4}-(\d{2})-(\d{2})$/);
  return m ? `${m[1]}-${m[2]}` : undefined;
}

/** Linha privada de um aluno, a partir do que está no cadastro em memória. */
function linhaDe(turmaId: string, aluno: Turma["alunos"][number]): LinhaPrivada {
  return {
    turma_id: turmaId,
    aluno_id: aluno.id,
    inep: aluno.inep?.trim() || null,
    nascimento: aluno.nascimento || null,
    endereco: aluno.endereco?.trim() || null,
    anotacoes: aluno.anotacoes ?? [],
  };
}

const vazia = (l: LinhaPrivada) =>
  !l.inep && !l.nascimento && !l.endereco && l.anotacoes.length === 0;

export const assinatura = (l: LinhaPrivada) =>
  JSON.stringify([l.inep, l.nascimento, l.endereco, l.anotacoes]);

/**
 * Tira os campos privados do cadastro que vai para `app_state`.
 * `comNascimento` diz se o cadastro em memória tem as datas de nascimento
 * de verdade (administrador com os dados privados carregados): só então o
 * `aniversario` público é recalculado; senão o que já existe é mantido.
 */
export function cadastroPublico(turmas: Turma[], comNascimento: boolean): Turma[] {
  return turmas.map((t) => ({
    ...t,
    alunos: t.alunos.map((a) => {
      const { inep: _i, nascimento, endereco: _e, anotacoes: _n, ...resto } = a;
      const aniversario = comNascimento ? aniversarioDe(nascimento) : a.aniversario;
      const publico = { ...resto };
      delete publico.aniversario;
      return aniversario ? { ...publico, aniversario } : publico;
    }),
  }));
}

/**
 * Linhas privadas que mudaram desde a última gravação (`salvas`, por chave →
 * assinatura). Aluno sem nenhum dado privado só gera linha se antes tinha.
 */
export function linhasAlteradas(turmas: Turma[], salvas: Map<string, string>): LinhaPrivada[] {
  const alteradas: LinhaPrivada[] = [];
  for (const t of turmas) {
    for (const a of t.alunos) {
      const linha = linhaDe(t.id, a);
      const antes = salvas.get(chavePrivada(t.id, a.id));
      if (antes === undefined ? !vazia(linha) : antes !== assinatura(linha)) alteradas.push(linha);
    }
  }
  return alteradas;
}

/** Põe os dados privados (vindos do banco) de volta no cadastro em memória. */
export function juntarDadosPrivados(turmas: Turma[], linhas: LinhaPrivada[]): Turma[] {
  if (linhas.length === 0) return turmas;
  const mapa = new Map(linhas.map((l) => [chavePrivada(l.turma_id, l.aluno_id), l]));
  return turmas.map((t) => ({
    ...t,
    alunos: t.alunos.map((a) => {
      const l = mapa.get(chavePrivada(t.id, a.id));
      if (!l) return a;
      // Só preenche: um valor vazio na tabela não apaga o que o cadastro antigo
      // ainda tenha (ele some do cadastro público na próxima gravação).
      const novo = { ...a };
      if (l.inep) novo.inep = l.inep;
      if (l.nascimento) novo.nascimento = l.nascimento;
      if (l.endereco) novo.endereco = l.endereco;
      if (l.anotacoes?.length) novo.anotacoes = l.anotacoes;
      return novo;
    }),
  }));
}
