import { supabase } from "@/lib/supabase-client";

/**
 * Avaliação do trabalho do aluno pelo professor.
 *
 * O selo é a forma principal: uma escala curta, com nome em português, que
 * diz onde a criança está — e não um número solto que ela leva para casa sem
 * entender. A nota (0 a 10) fica opcional, para quando a escola precisar
 * dela no boletim, e o comentário é o que de fato ensina.
 *
 * A avaliação se pendura em duas coisas: uma atividade da turma
 * (`tipo: "atividade"`) ou um texto que o aluno entregou pelo editor
 * (`tipo: "entrega"`).
 */
export const SELOS = [
  {
    valor: "retomar",
    rotulo: "Precisa retomar",
    descricao: "Ainda não deu conta — vale refazer junto.",
    cor: "bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  },
  {
    valor: "caminho",
    rotulo: "No caminho",
    descricao: "Começou certo, falta terminar ou corrigir.",
    cor: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  },
  {
    valor: "bom",
    rotulo: "Bom trabalho",
    descricao: "Fez o que foi pedido.",
    cor: "bg-sky-500/10 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  },
  {
    valor: "muito-bom",
    rotulo: "Muito bom",
    descricao: "Caprichou, foi além do básico.",
    cor: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
  {
    valor: "destaque",
    rotulo: "Destaque",
    descricao: "Trabalho para mostrar para a turma.",
    cor: "bg-violet-500/10 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  },
] as const;

export type SeloValor = (typeof SELOS)[number]["valor"];

export function selo(valor: string | undefined) {
  return SELOS.find((s) => s.valor === valor);
}

export interface Avaliacao {
  id: string;
  turmaId: string;
  alunoId: string;
  tipo: "atividade" | "entrega";
  referenciaId: string;
  selo: SeloValor;
  nota?: number | undefined;
  comentario?: string | undefined;
  avaliadoPor: string;
  atualizadoEm: string;
}

interface AvaliacaoRow {
  id: string;
  turma_id: string;
  aluno_id: string;
  tipo: "atividade" | "entrega";
  referencia_id: string;
  selo: SeloValor;
  nota: number | null;
  comentario: string | null;
  avaliado_por: string;
  atualizado_em: string;
}

function paraAvaliacao(row: AvaliacaoRow): Avaliacao {
  return {
    id: row.id,
    turmaId: row.turma_id,
    alunoId: row.aluno_id,
    tipo: row.tipo,
    referenciaId: row.referencia_id,
    selo: row.selo,
    nota: row.nota ?? undefined,
    comentario: row.comentario ?? undefined,
    avaliadoPor: row.avaliado_por,
    atualizadoEm: row.atualizado_em,
  };
}

/** Todas as avaliações de um aluno — usado pelo professor e pelo próprio aluno. */
export async function fetchAvaliacoesDoAluno(alunoId: string): Promise<Avaliacao[]> {
  const { data, error } = await supabase
    .from("avaliacoes")
    .select("*")
    .eq("aluno_id", alunoId)
    .order("atualizado_em", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as AvaliacaoRow[]).map(paraAvaliacao);
}

/** Cria ou substitui a avaliação de um trabalho. */
export async function salvarAvaliacao(input: {
  turmaId: string;
  alunoId: string;
  tipo: "atividade" | "entrega";
  referenciaId: string;
  selo: SeloValor;
  nota?: number | undefined;
  comentario?: string | undefined;
  avaliadoPor: string;
}): Promise<void> {
  const { error } = await supabase.from("avaliacoes").upsert(
    {
      turma_id: input.turmaId,
      aluno_id: input.alunoId,
      tipo: input.tipo,
      referencia_id: input.referenciaId,
      selo: input.selo,
      nota: input.nota ?? null,
      comentario: input.comentario || null,
      avaliado_por: input.avaliadoPor,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "aluno_id,tipo,referencia_id" },
  );
  if (error) throw error;
}

/**
 * Texto que o aluno entregou para o professor ver.
 *
 * O editor salva os documentos numa área que só o próprio aluno abre (as
 * funções do banco exigem o PIN dele). Entregar é um ato deliberado: a
 * criança escolhe o texto e manda — e só a partir daí o professor lê e
 * avalia.
 */
export interface Entrega {
  id: string;
  turmaId: string;
  alunoId: string;
  alunoNome: string;
  titulo: string;
  conteudoHtml: string;
  ferramenta: string;
  criadoEm: string;
}

interface EntregaRow {
  id: string;
  turma_id: string;
  aluno_id: string;
  aluno_nome: string;
  titulo: string;
  conteudo_html: string;
  ferramenta: string;
  criado_em: string;
}

function paraEntrega(row: EntregaRow): Entrega {
  return {
    id: row.id,
    turmaId: row.turma_id,
    alunoId: row.aluno_id,
    alunoNome: row.aluno_nome,
    titulo: row.titulo,
    conteudoHtml: row.conteudo_html,
    ferramenta: row.ferramenta,
    criadoEm: row.criado_em,
  };
}

export async function entregarTexto(input: {
  turmaId: string;
  alunoId: string;
  alunoNome: string;
  titulo: string;
  conteudoHtml: string;
  ferramenta?: string;
}): Promise<void> {
  const { error } = await supabase.from("entregas").insert({
    turma_id: input.turmaId,
    aluno_id: input.alunoId,
    aluno_nome: input.alunoNome,
    titulo: input.titulo,
    conteudo_html: input.conteudoHtml,
    ferramenta: input.ferramenta ?? "editor-texto",
  });
  if (error) throw error;
}

export async function fetchEntregasDoAluno(alunoId: string): Promise<Entrega[]> {
  const { data, error } = await supabase
    .from("entregas")
    .select("*")
    .eq("aluno_id", alunoId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as EntregaRow[]).map(paraEntrega);
}

export async function fetchEntregasDaTurma(turmaId: string): Promise<Entrega[]> {
  const { data, error } = await supabase
    .from("entregas")
    .select("*")
    .eq("turma_id", turmaId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as EntregaRow[]).map(paraEntrega);
}
