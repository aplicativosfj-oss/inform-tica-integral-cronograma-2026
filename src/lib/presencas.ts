import type { MovimentoCascata } from "@/lib/schedule-engine";
import {
  enfileirar,
  gravarCache,
  lerCache,
  registrarExecutor,
  sincronizarTudo,
  totalPendente,
} from "@/lib/offline-queue";
import { senhaDoProfessorDaTurma } from "@/lib/profissional-session";
import { supabase } from "@/lib/supabase-client";
import type { Presenca } from "@/lib/types";

interface PayloadIniciais {
  turmaId: string;
  data: string;
  grupos: { indice: number; alunos: { id: string; nome: string }[] }[];
}

interface PayloadFalta {
  turmaId: string;
  data: string;
  aluno: { id: string; nome: string };
  grupoIndice: number;
  substituto: { id: string; nome: string } | null;
  motivo: "ausente" | "nao_quis_participar" | "limitacao";
}

function chaveDia(turmaId: string, data: string): string {
  return `presencas:${turmaId}:${data}`;
}

/** Quantas gravações de frequência ainda aguardam a internet voltar. */
export function presencasPendentes(): number {
  return totalPendente();
}

registrarExecutor("presencas:iniciais", async (payload) => {
  const p = payload as PayloadIniciais;
  await enviarPresencasIniciais(p.turmaId, p.data, p.grupos);
});

registrarExecutor("presencas:falta", async (payload) => {
  const p = payload as PayloadFalta;
  await enviarFalta(p.turmaId, p.data, p.aluno, p.grupoIndice, p.substituto, p.motivo);
});

/** Reenvia ao banco tudo o que foi registrado sem internet. */
export async function sincronizarPresencasPendentes() {
  return sincronizarTudo();
}

interface PresencaRow {
  id: string;
  data: string;
  turma_id: string;
  aluno_id: string;
  aluno_nome: string;
  grupo_indice: number;
  status: "presente" | "faltou" | "substituido";
  substituto_de_aluno_id: string | null;
  motivo: string | null;
  criado_em: string;
}

function rowToPresenca(row: PresencaRow): Presenca {
  return {
    id: row.id,
    data: row.data,
    turmaId: row.turma_id,
    alunoId: row.aluno_id,
    alunoNome: row.aluno_nome,
    grupoIndice: row.grupo_indice,
    status: row.status,
    substitutoDeAlunoId: row.substituto_de_aluno_id ?? undefined,
    motivo: row.motivo ?? undefined,
    criadoEm: row.criado_em,
  };
}

/**
 * Última data (YYYY-MM-DD) em que cada aluno participou de fato (presente ou
 * substituindo alguém) nesta turma. Alunos ausentes do mapa nunca
 * participaram — prioridade máxima na próxima seleção.
 */
export async function fetchUltimaParticipacao(turmaId: string): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();
  try {
    const { data, error } = await supabase
      .from("presencas")
      .select("aluno_id, data")
      .eq("turma_id", turmaId)
      .in("status", ["presente", "substituido"])
      .order("data", { ascending: false });
    if (error) throw error;
    for (const row of data ?? []) {
      if (!mapa.has(row.aluno_id)) mapa.set(row.aluno_id, row.data);
    }
    gravarCache(`ultima:${turmaId}`, [...mapa.entries()]);
    return mapa;
  } catch (err) {
    const cache = lerCache<[string, string][]>(`ultima:${turmaId}`);
    if (cache) return new Map(cache);
    throw err;
  }
}

export async function fetchPresencasDoDia(turmaId: string, data: string): Promise<Presenca[]> {
  try {
    const { data: rows, error } = await supabase
      .from("presencas")
      .select("*")
      .eq("turma_id", turmaId)
      .eq("data", data);
    if (error) throw error;
    const presencas = (rows ?? []).map(rowToPresenca);
    gravarCache(chaveDia(turmaId, data), presencas);
    return presencas;
  } catch (err) {
    // Sem internet: devolve a última chamada conhecida para a aula continuar.
    const cache = lerCache<Presenca[]>(chaveDia(turmaId, data));
    if (cache) return cache;
    throw err;
  }
}

/** Grava a chamada inicial do dia (status "presente") para os grupos selecionados. Idempotente. */
export async function registrarPresencasIniciais(
  turmaId: string,
  data: string,
  grupos: { indice: number; alunos: { id: string; nome: string }[] }[],
): Promise<void> {
  try {
    await enviarPresencasIniciais(turmaId, data, grupos);
  } catch {
    enfileirar("presencas:iniciais", { turmaId, data, grupos } satisfies PayloadIniciais);
    const locais: Presenca[] = grupos.flatMap((grupo) =>
      grupo.alunos.map((aluno) => ({
        id: `local-${turmaId}-${aluno.id}-${data}`,
        data,
        turmaId,
        alunoId: aluno.id,
        alunoNome: aluno.nome,
        grupoIndice: grupo.indice,
        status: "presente" as const,
        criadoEm: new Date().toISOString(),
      })),
    );
    gravarCache(chaveDia(turmaId, data), locais);
  }
}

/**
 * Quem não tem login do painel, mas é o professor regente da turma com a
 * sessão aberta (senha conferida), grava pelas funções do banco que conferem
 * a senha no servidor. O administrador logado continua gravando direto.
 */
async function senhaParaRpc(turmaId: string): Promise<string | null> {
  const senha = senhaDoProfessorDaTurma(turmaId);
  if (!senha) return null;
  const { data } = await supabase.auth.getSession();
  return data.session ? null : senha;
}

async function enviarPresencasIniciais(
  turmaId: string,
  data: string,
  grupos: { indice: number; alunos: { id: string; nome: string }[] }[],
): Promise<void> {
  const senha = await senhaParaRpc(turmaId);
  if (senha) {
    const linhas = grupos.flatMap((grupo) =>
      grupo.alunos.map((aluno) => ({
        aluno_id: aluno.id,
        aluno_nome: aluno.nome,
        grupo_indice: grupo.indice,
      })),
    );
    if (linhas.length === 0) return;
    const { error } = await supabase.rpc("professor_registrar_chamada", {
      p_turma_id: turmaId,
      p_senha: senha,
      p_data: data,
      p_linhas: linhas,
    });
    if (error) throw error;
    return;
  }
  const rows = grupos.flatMap((grupo) =>
    grupo.alunos.map((aluno) => ({
      data,
      turma_id: turmaId,
      aluno_id: aluno.id,
      aluno_nome: aluno.nome,
      grupo_indice: grupo.indice,
      status: "presente" as const,
    })),
  );
  if (rows.length === 0) return;
  const { error } = await supabase
    .from("presencas")
    .upsert(rows, { onConflict: "data,turma_id,aluno_id", ignoreDuplicates: true });
  if (error) throw error;
}

/** Marca um aluno como ausente no dia e, se houver substituto, registra a substituição. */
export async function marcarFalta(
  turmaId: string,
  data: string,
  aluno: { id: string; nome: string },
  grupoIndice: number,
  substituto: { id: string; nome: string } | null,
  motivo: "ausente" | "nao_quis_participar" | "limitacao",
): Promise<void> {
  try {
    await enviarFalta(turmaId, data, aluno, grupoIndice, substituto, motivo);
  } catch {
    enfileirar("presencas:falta", {
      turmaId,
      data,
      aluno,
      grupoIndice,
      substituto,
      motivo,
    } satisfies PayloadFalta);
    const cache = lerCache<Presenca[]>(chaveDia(turmaId, data)) ?? [];
    const atualizado: Presenca[] = cache.map((p) =>
      p.alunoId === aluno.id ? { ...p, status: "faltou" as const, motivo } : p,
    );
    if (substituto) {
      atualizado.push({
        id: `local-${turmaId}-${substituto.id}-${data}`,
        data,
        turmaId,
        alunoId: substituto.id,
        alunoNome: substituto.nome,
        grupoIndice,
        status: "substituido",
        substitutoDeAlunoId: aluno.id,
        criadoEm: new Date().toISOString(),
      });
    }
    gravarCache(chaveDia(turmaId, data), atualizado);
  }
}

async function enviarFalta(
  turmaId: string,
  data: string,
  aluno: { id: string; nome: string },
  grupoIndice: number,
  substituto: { id: string; nome: string } | null,
  motivo: "ausente" | "nao_quis_participar" | "limitacao",
): Promise<void> {
  const senha = await senhaParaRpc(turmaId);
  if (senha) {
    const { error } = await supabase.rpc("professor_marcar_falta", {
      p_turma_id: turmaId,
      p_senha: senha,
      p_data: data,
      p_aluno_id: aluno.id,
      p_motivo: motivo,
      p_grupo_indice: grupoIndice,
      p_substituto_id: substituto?.id ?? null,
      p_substituto_nome: substituto?.nome ?? null,
    });
    if (error) throw error;
    return;
  }
  const { error: updateError } = await supabase
    .from("presencas")
    .update({ status: "faltou", motivo })
    .eq("turma_id", turmaId)
    .eq("data", data)
    .eq("aluno_id", aluno.id);
  if (updateError) throw updateError;

  if (substituto) {
    const { error: insertError } = await supabase.from("presencas").upsert(
      {
        data,
        turma_id: turmaId,
        aluno_id: substituto.id,
        aluno_nome: substituto.nome,
        grupo_indice: grupoIndice,
        status: "substituido" as const,
        substituto_de_aluno_id: aluno.id,
      },
      { onConflict: "data,turma_id,aluno_id" },
    );
    if (insertError) throw insertError;
  }
}

/**
 * Marca a falta e aplica a substituição em cascata (ver `planejarCascata`).
 * Sem internet, cai no fluxo simples de `marcarFalta` com quem entra no lugar.
 */
export async function marcarFaltaEmCascata(
  turmaId: string,
  data: string,
  aluno: { id: string; nome: string },
  grupoIndice: number,
  movimentos: MovimentoCascata[],
  motivo: "ausente" | "nao_quis_participar" | "limitacao",
): Promise<void> {
  const senha = await senhaParaRpc(turmaId);
  if (senha) {
    const { error } = await supabase.rpc("professor_marcar_falta_cascata", {
      p_turma_id: turmaId,
      p_senha: senha,
      p_data: data,
      p_aluno_id: aluno.id,
      p_motivo: motivo,
      p_movimentos: movimentos.map((m) => ({
        aluno_id: m.alunoId,
        aluno_nome: m.alunoNome,
        grupo_indice: m.grupoIndice,
        grupo_original: m.grupoOriginal,
      })),
    });
    if (error) throw error;
    return;
  }
  try {
    const { error: updateError } = await supabase
      .from("presencas")
      .update({ status: "faltou", motivo })
      .eq("turma_id", turmaId)
      .eq("data", data)
      .eq("aluno_id", aluno.id);
    if (updateError) throw updateError;
    if (movimentos.length === 0) return;
    const { error } = await supabase.from("presencas").upsert(
      movimentos.map((m) => ({
        data,
        turma_id: turmaId,
        aluno_id: m.alunoId,
        aluno_nome: m.alunoNome,
        grupo_indice: m.grupoIndice,
        status: "substituido" as const,
        substituto_de_aluno_id: aluno.id,
        grupo_indice_original: m.grupoOriginal,
      })),
      { onConflict: "data,turma_id,aluno_id" },
    );
    if (error) throw error;
  } catch {
    const primeiro = movimentos[0];
    await marcarFalta(
      turmaId,
      data,
      aluno,
      grupoIndice,
      primeiro ? { id: primeiro.alunoId, nome: primeiro.alunoNome } : null,
      motivo,
    );
  }
}

/** Histórico de frequência num intervalo de datas (inclusive), opcionalmente filtrado por turma. */
export async function fetchPresencasRange(
  inicio: string,
  fim: string,
  turmaId?: string,
): Promise<Presenca[]> {
  const chave = `range:${inicio}:${fim}:${turmaId ?? "todas"}`;
  try {
    let query = supabase
      .from("presencas")
      .select("*")
      .gte("data", inicio)
      .lte("data", fim)
      .order("data", { ascending: false });
    if (turmaId) query = query.eq("turma_id", turmaId);
    const { data, error } = await query;
    if (error) throw error;
    const registros = (data ?? []).map(rowToPresenca);
    gravarCache(chave, registros);
    return registros;
  } catch (err) {
    const cache = lerCache<Presenca[]>(chave);
    if (cache) return cache;
    throw err;
  }
}

/**
 * Desfaz uma falta registrada por engano: o aluno volta a "presente" e o
 * substituto que entrou no lugar dele sai da chamada do dia.
 */
export async function desfazerFalta(turmaId: string, data: string, alunoId: string): Promise<void> {
  const senha = await senhaParaRpc(turmaId);
  if (senha) {
    const { error } = await supabase.rpc("professor_desfazer_falta", {
      p_turma_id: turmaId,
      p_senha: senha,
      p_data: data,
      p_aluno_id: alunoId,
    });
    if (error) throw error;
    return;
  }
  const { error: e1 } = await supabase
    .from("presencas")
    .update({ status: "presente", motivo: null })
    .eq("turma_id", turmaId)
    .eq("data", data)
    .eq("aluno_id", alunoId)
    .eq("status", "faltou");
  if (e1) throw e1;
  // Quem só tinha subido de grupo na cascata volta ao grupo de origem.
  const { data: movidos, error: e3 } = await supabase
    .from("presencas")
    .select("aluno_id, grupo_indice_original")
    .eq("turma_id", turmaId)
    .eq("data", data)
    .eq("substituto_de_aluno_id", alunoId)
    .not("grupo_indice_original", "is", null);
  if (e3) throw e3;
  for (const m of movidos ?? []) {
    const { error } = await supabase
      .from("presencas")
      .update({
        status: "presente",
        grupo_indice: m.grupo_indice_original,
        substituto_de_aluno_id: null,
        grupo_indice_original: null,
      })
      .eq("turma_id", turmaId)
      .eq("data", data)
      .eq("aluno_id", m.aluno_id);
    if (error) throw error;
  }
  const { error: e2 } = await supabase
    .from("presencas")
    .delete()
    .eq("turma_id", turmaId)
    .eq("data", data)
    .eq("substituto_de_aluno_id", alunoId);
  if (e2) throw e2;
}
