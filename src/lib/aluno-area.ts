import { gravarCache, lerCache } from "@/lib/offline-queue";
import { supabase } from "@/lib/supabase-client";
import type { Atividade, AtividadeStatus, Presenca } from "@/lib/types";

/** Gera um PIN de 4 dígitos (0000–9999), com zero à esquerda quando preciso. */
function gerarPin(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

interface AlunoPinRow {
  aluno_id: string;
  turma_id: string;
  pin: string;
}

/**
 * Busca o PIN do aluno; cria um novo (aleatório) na primeira vez que alguém
 * tenta acessar essa conta. Assim não é preciso gerar os PINs de todos os
 * alunos de uma vez — cada um ganha o dele no primeiro acesso.
 */
export async function obterOuCriarPin(alunoId: string, turmaId: string): Promise<string> {
  const { data, error } = await supabase
    .from("aluno_pins")
    .select("pin")
    .eq("aluno_id", alunoId)
    .maybeSingle();
  if (error) throw error;
  if (data) return (data as AlunoPinRow).pin;

  const pin = gerarPin();
  const { error: insertError } = await supabase
    .from("aluno_pins")
    .upsert({ aluno_id: alunoId, turma_id: turmaId, pin }, { onConflict: "aluno_id" });
  if (insertError) throw insertError;
  return pin;
}

export async function verificarPin(alunoId: string, pinDigitado: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("aluno_pins")
    .select("pin")
    .eq("aluno_id", alunoId)
    .maybeSingle();
  if (error) throw error;
  return (data as AlunoPinRow | null)?.pin === pinDigitado;
}

interface AcessoRow {
  id: string;
  aluno_id: string;
  turma_id: string;
  acessado_em: string;
}

/** Último acesso já registrado (antes deste), para mostrar "última vez que entrou". */
export async function fetchUltimoAcesso(alunoId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("aluno_acessos")
    .select("acessado_em")
    .eq("aluno_id", alunoId)
    .order("acessado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as { acessado_em: string } | null)?.acessado_em ?? null;
}

/** Registra o acesso de agora (chamar depois de conferir o PIN). */
export async function registrarAcesso(alunoId: string, turmaId: string): Promise<void> {
  const { error } = await supabase
    .from("aluno_acessos")
    .insert({ aluno_id: alunoId, turma_id: turmaId });
  if (error) throw error;
}

export async function fetchHistoricoAcessos(alunoId: string, limite = 10): Promise<AcessoRow[]> {
  const { data, error } = await supabase
    .from("aluno_acessos")
    .select("*")
    .eq("aluno_id", alunoId)
    .order("acessado_em", { ascending: false })
    .limit(limite);
  if (error) throw error;
  return (data ?? []) as AcessoRow[];
}

interface AtividadeRow {
  id: string;
  turma_id: string;
  titulo: string;
  descricao: string | null;
  url: string | null;
  data: string;
  criado_em: string;
}

function rowToAtividade(row: AtividadeRow): Atividade {
  return {
    id: row.id,
    turmaId: row.turma_id,
    titulo: row.titulo,
    descricao: row.descricao ?? undefined,
    url: row.url ?? undefined,
    data: row.data,
    criadoEm: row.criado_em,
  };
}

export async function fetchAtividadesDaTurma(turmaId: string): Promise<Atividade[]> {
  const chave = `atividades:${turmaId}`;
  try {
    const { data, error } = await supabase
      .from("atividades")
      .select("*")
      .eq("turma_id", turmaId)
      .order("data", { ascending: false });
    if (error) throw error;
    const atividades = (data ?? []).map(rowToAtividade);
    gravarCache(chave, atividades);
    return atividades;
  } catch (err) {
    const cache = lerCache<Atividade[]>(chave);
    if (cache) return cache;
    throw err;
  }
}

export async function criarAtividade(input: {
  turmaId: string;
  titulo: string;
  descricao?: string | undefined;
  url?: string | undefined;
  data: string;
}): Promise<void> {
  const { error } = await supabase.from("atividades").insert({
    turma_id: input.turmaId,
    titulo: input.titulo,
    descricao: input.descricao || null,
    url: input.url || null,
    data: input.data,
  });
  if (error) throw error;
}

export async function removerAtividade(atividadeId: string): Promise<void> {
  const { error } = await supabase.from("atividades").delete().eq("id", atividadeId);
  if (error) throw error;
}

interface AtividadeStatusRow {
  atividade_id: string;
  aluno_id: string;
  status: "pendente" | "concluida";
  concluido_em: string | null;
}

function rowToStatus(row: AtividadeStatusRow): AtividadeStatus {
  return {
    atividadeId: row.atividade_id,
    alunoId: row.aluno_id,
    status: row.status,
    concluidoEm: row.concluido_em ?? undefined,
  };
}

/** Status de todas as atividades de um aluno específico, indexado por atividadeId. */
export async function fetchStatusDoAluno(alunoId: string): Promise<Map<string, AtividadeStatus>> {
  const { data, error } = await supabase
    .from("atividades_status")
    .select("*")
    .eq("aluno_id", alunoId);
  if (error) throw error;
  const mapa = new Map<string, AtividadeStatus>();
  for (const row of (data ?? []) as AtividadeStatusRow[]) {
    mapa.set(row.atividade_id, rowToStatus(row));
  }
  return mapa;
}

/** Status de uma atividade para todos os alunos que já mexeram nela — usado no painel do professor. */
export async function fetchStatusDaAtividade(atividadeId: string): Promise<AtividadeStatus[]> {
  const { data, error } = await supabase
    .from("atividades_status")
    .select("*")
    .eq("atividade_id", atividadeId);
  if (error) throw error;
  return ((data ?? []) as AtividadeStatusRow[]).map(rowToStatus);
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

/** Histórico de presença/falta de um aluno específico, mais recente primeiro. */
export async function fetchPresencasDoAluno(alunoId: string, limite = 30): Promise<Presenca[]> {
  const { data, error } = await supabase
    .from("presencas")
    .select("*")
    .eq("aluno_id", alunoId)
    .order("data", { ascending: false })
    .limit(limite);
  if (error) throw error;
  return ((data ?? []) as PresencaRow[]).map((row) => ({
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
  }));
}

export async function marcarAtividade(
  atividadeId: string,
  alunoId: string,
  status: "pendente" | "concluida",
): Promise<void> {
  const { error } = await supabase.from("atividades_status").upsert(
    {
      atividade_id: atividadeId,
      aluno_id: alunoId,
      status,
      concluido_em: status === "concluida" ? new Date().toISOString() : null,
    },
    { onConflict: "atividade_id,aluno_id" },
  );
  if (error) throw error;
}
