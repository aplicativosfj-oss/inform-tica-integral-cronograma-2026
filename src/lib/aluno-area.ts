import { gravarCache, lerCache } from "@/lib/offline-queue";
import { supabase } from "@/lib/supabase-client";
import type { Atividade, AtividadeStatus, Presenca } from "@/lib/types";

/**
 * Todo acesso do ALUNO a dados sensíveis (histórico, presenças, status de
 * atividades) passa por funções do banco (RPC) que exigem o `aluno_id` E o
 * PIN certo, verificados dentro do Postgres — nunca um `select` direto nas
 * tabelas. Isso fecha a brecha de um aluno (ou qualquer visitante com a
 * chave pública do site) conseguir ler dados de outro aluno/turma direto
 * pela API, ainda que a tela nunca mostrasse isso. O professor, que tem
 * login de verdade (Supabase Auth), continua lendo essas tabelas
 * diretamente — a política de acesso do banco libera isso só para quem
 * está autenticado.
 */

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
 * tenta acessar essa conta. Só o professor (autenticado no dashboard) chama
 * isso — por isso ainda lê a tabela direto, sem RPC.
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

/** Confere o PIN sem nunca trazer o valor guardado para o navegador. */
export async function verificarPin(alunoId: string, pinDigitado: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("verificar_pin_aluno", {
    p_aluno_id: alunoId,
    p_pin: pinDigitado,
  });
  if (error) throw error;
  return data === true;
}

interface AcessoRow {
  id: string;
  aluno_id: string;
  turma_id: string;
  acessado_em: string;
}

/** Registra o acesso de agora — o próprio banco recusa se o PIN não bater. */
export async function registrarAcesso(
  alunoId: string,
  turmaId: string,
  pin: string,
): Promise<void> {
  const { data, error } = await supabase.rpc("registrar_acesso_aluno", {
    p_aluno_id: alunoId,
    p_turma_id: turmaId,
    p_pin: pin,
  });
  if (error) throw error;
  if (data !== true) throw new Error("PIN inválido.");
}

/** Histórico de acessos do próprio aluno — exige o PIN a cada leitura. */
export async function fetchHistoricoAcessos(
  alunoId: string,
  pin: string,
  limite = 10,
): Promise<AcessoRow[]> {
  const { data, error } = await supabase.rpc("historico_acessos_aluno", {
    p_aluno_id: alunoId,
    p_pin: pin,
    p_limite: limite,
  });
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

/** Atividades de uma turma — como o quadro de tarefas é público (igual à agenda), continua lida direto. */
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

/** Status de todas as atividades do próprio aluno, indexado por atividadeId — exige o PIN. */
export async function fetchStatusDoAluno(
  alunoId: string,
  pin: string,
): Promise<Map<string, AtividadeStatus>> {
  const { data, error } = await supabase.rpc("status_atividades_aluno", {
    p_aluno_id: alunoId,
    p_pin: pin,
  });
  if (error) throw error;
  const mapa = new Map<string, AtividadeStatus>();
  for (const row of (data ?? []) as AtividadeStatusRow[]) {
    mapa.set(row.atividade_id, rowToStatus(row));
  }
  return mapa;
}

/** Status de uma atividade para todos os alunos — só o professor autenticado enxerga isso. */
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

/**
 * Histórico de presença/falta de um aluno específico, mais recente primeiro.
 * A tabela `presencas` já é pública de propósito no resto do site (a
 * Frequência e a Coordenação mostram a mesma informação abertamente para
 * pais e coordenação) — mantém leitura direta, sem RPC.
 */
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

export interface ArquivoAlunoResumo {
  id: string;
  titulo: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ArquivoAluno extends ArquivoAlunoResumo {
  conteudoHtml: string;
}

interface ArquivoResumoRow {
  id: string;
  titulo: string;
  criado_em: string;
  atualizado_em: string;
}

interface ArquivoRow extends ArquivoResumoRow {
  conteudo_html: string;
}

/** Lista os arquivos salvos pelo próprio aluno numa ferramenta (ex.: editor de texto) — exige o PIN. */
export async function listarArquivosAluno(
  alunoId: string,
  pin: string,
  ferramenta = "editor-texto",
): Promise<ArquivoAlunoResumo[]> {
  const { data, error } = await supabase.rpc("listar_arquivos_aluno", {
    p_aluno_id: alunoId,
    p_pin: pin,
    p_ferramenta: ferramenta,
  });
  if (error) throw error;
  return ((data ?? []) as ArquivoResumoRow[]).map((row) => ({
    id: row.id,
    titulo: row.titulo,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  }));
}

/** Busca um arquivo específico (com conteúdo) do próprio aluno — exige o PIN. */
export async function obterArquivoAluno(
  alunoId: string,
  pin: string,
  arquivoId: string,
): Promise<ArquivoAluno | null> {
  const { data, error } = await supabase.rpc("obter_arquivo_aluno", {
    p_aluno_id: alunoId,
    p_pin: pin,
    p_arquivo_id: arquivoId,
  });
  if (error) throw error;
  const row = ((data ?? []) as ArquivoRow[])[0];
  if (!row) return null;
  return {
    id: row.id,
    titulo: row.titulo,
    conteudoHtml: row.conteudo_html,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}

/**
 * Salva (cria ou atualiza) um arquivo do próprio aluno — exige o PIN.
 * Passe `arquivoId` null para criar um arquivo novo; devolve o id salvo.
 */
export async function salvarArquivoAluno(
  alunoId: string,
  turmaId: string,
  pin: string,
  arquivoId: string | null,
  titulo: string,
  conteudoHtml: string,
  ferramenta = "editor-texto",
): Promise<string> {
  const { data, error } = await supabase.rpc("salvar_arquivo_aluno", {
    p_aluno_id: alunoId,
    p_turma_id: turmaId,
    p_pin: pin,
    p_arquivo_id: arquivoId,
    p_titulo: titulo,
    p_conteudo_html: conteudoHtml,
    p_ferramenta: ferramenta,
  });
  if (error) throw error;
  if (!data) throw new Error("PIN inválido.");
  return data as string;
}

/** Apaga um arquivo do próprio aluno — exige o PIN. */
export async function excluirArquivoAluno(
  alunoId: string,
  pin: string,
  arquivoId: string,
): Promise<void> {
  const { data, error } = await supabase.rpc("excluir_arquivo_aluno", {
    p_aluno_id: alunoId,
    p_pin: pin,
    p_arquivo_id: arquivoId,
  });
  if (error) throw error;
  if (data !== true) throw new Error("PIN inválido.");
}

/** Marca uma atividade como concluída/pendente para o próprio aluno — exige o PIN. */
export async function marcarAtividade(
  atividadeId: string,
  alunoId: string,
  pin: string,
  status: "pendente" | "concluida",
): Promise<void> {
  const { data, error } = await supabase.rpc("marcar_atividade_aluno", {
    p_atividade_id: atividadeId,
    p_aluno_id: alunoId,
    p_pin: pin,
    p_status: status,
  });
  if (error) throw error;
  if (data !== true) throw new Error("PIN inválido.");
}
