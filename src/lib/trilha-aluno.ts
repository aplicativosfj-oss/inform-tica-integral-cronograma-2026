import { supabase } from "@/lib/supabase-client";

/**
 * Trilha do aluno: o registro do que a criança fez na Área do Aluno.
 *
 * Cada vez que ela abre uma ferramenta, termina uma partida ou acerta uma
 * rodada, fica um passo gravado. Juntos, esses passos respondem o que nem a
 * nota da prova responde: em que a criança mexe sozinha, o que ela repete, o
 * que ela abre e abandona, e se está melhorando de uma semana para a outra.
 *
 * Três cuidados, porque aqui há dado de criança:
 *
 * - a gravação passa pela função `registrar_passo_aluno` do banco, que exige
 *   o PIN — o mesmo caminho já usado pelo histórico de acessos. Sem PIN
 *   certo, o Postgres recusa;
 * - só se guarda o que a escola precisa: a ferramenta, o tipo de passo, a
 *   pontuação e a duração. Nada de texto escrito pela criança;
 * - enquanto a tabela não existir no banco, nada quebra e nada se perde por
 *   engano: o passo fica no navegador e a trilha mostra o que tem, avisando.
 *   O SQL está em `supabase/trilha-aluno.sql`.
 */

export type TipoPasso = "abriu" | "concluiu" | "pontuou" | "entregou";

export interface Passo {
  ferramenta: string;
  /** Nome amigável, para o relatório não precisar do registro de ferramentas. */
  titulo: string;
  tipo: TipoPasso;
  pontos: number | null;
  acertos: number | null;
  total: number | null;
  segundos: number | null;
  criadoEm: string;
}

interface PassoRow {
  ferramenta: string;
  titulo: string | null;
  tipo: string;
  pontos: number | null;
  acertos: number | null;
  total: number | null;
  segundos: number | null;
  criado_em: string;
}

const CHAVE_LOCAL = "infoteca:trilha-local";

function lerLocais(alunoId: string): Passo[] {
  try {
    const bruto = window.localStorage.getItem(`${CHAVE_LOCAL}:${alunoId}`);
    return bruto ? (JSON.parse(bruto) as Passo[]) : [];
  } catch {
    return [];
  }
}

function gravarLocal(alunoId: string, p: Passo) {
  try {
    // 300 passos por aluno é mais que um semestre de uso e não pesa nada.
    const todos = [p, ...lerLocais(alunoId)].slice(0, 300);
    window.localStorage.setItem(`${CHAVE_LOCAL}:${alunoId}`, JSON.stringify(todos));
  } catch {
    // Sem storage: o passo vale só para esta sessão.
  }
}

export interface DadosPasso {
  ferramenta: string;
  titulo: string;
  tipo: TipoPasso;
  pontos?: number;
  acertos?: number;
  total?: number;
  segundos?: number;
}

/**
 * Último passo de cada tipo, para não gravar o mesmo duas vezes. O modo de
 * desenvolvimento do React roda os efeitos em dobro, e um duplo-clique da
 * criança faria o mesmo: sem isto, a trilha contaria uso que não houve.
 */
const recentes = new Map<string, number>();
const JANELA_MS = 5000;

function repetido(alunoId: string, dados: DadosPasso): boolean {
  const chave = `${alunoId}|${dados.ferramenta}|${dados.tipo}`;
  const agora = Date.now();
  const anterior = recentes.get(chave);
  if (anterior && agora - anterior < JANELA_MS) return true;
  recentes.set(chave, agora);
  return false;
}

/**
 * Grava um passo. Nunca lança: se o registro falhar, a criança não pode nem
 * perceber — ela está no meio de um jogo.
 */
export async function registrarPasso(
  alunoId: string,
  turmaId: string,
  pin: string,
  dados: DadosPasso,
): Promise<void> {
  if (repetido(alunoId, dados)) return;
  const passo: Passo = {
    ferramenta: dados.ferramenta,
    titulo: dados.titulo,
    tipo: dados.tipo,
    pontos: dados.pontos ?? null,
    acertos: dados.acertos ?? null,
    total: dados.total ?? null,
    segundos: dados.segundos ?? null,
    criadoEm: new Date().toISOString(),
  };
  gravarLocal(alunoId, passo);
  try {
    await supabase.rpc("registrar_passo_aluno", {
      p_aluno_id: alunoId,
      p_turma_id: turmaId,
      p_pin: pin,
      p_ferramenta: dados.ferramenta,
      p_titulo: dados.titulo,
      p_tipo: dados.tipo,
      p_pontos: dados.pontos ?? null,
      p_acertos: dados.acertos ?? null,
      p_total: dados.total ?? null,
      p_segundos: dados.segundos ?? null,
    });
  } catch {
    // Sem rede ou sem a tabela: o passo local já foi guardado acima.
  }
}

export interface Trilha {
  passos: Passo[];
  /** true quando veio só do navegador — a tabela ainda não existe no banco. */
  somenteLocal: boolean;
}

export async function fetchTrilha(alunoId: string, pin: string, limite = 200): Promise<Trilha> {
  const locais = lerLocais(alunoId).slice(0, limite);
  try {
    const { data, error } = await supabase.rpc("trilha_aluno", {
      p_aluno_id: alunoId,
      p_pin: pin,
      p_limite: limite,
    });
    if (error || !data) return { passos: locais, somenteLocal: true };
    const passos = (data as PassoRow[]).map((r) => ({
      ferramenta: r.ferramenta,
      titulo: r.titulo ?? r.ferramenta,
      tipo: r.tipo as TipoPasso,
      pontos: r.pontos,
      acertos: r.acertos,
      total: r.total,
      segundos: r.segundos,
      criadoEm: r.criado_em,
    }));
    return { passos, somenteLocal: false };
  } catch {
    return { passos: locais, somenteLocal: true };
  }
}

/* ------------------------------------------------------------------ */
/* Leitura da trilha                                                   */
/* ------------------------------------------------------------------ */

export interface ResumoFerramenta {
  ferramenta: string;
  titulo: string;
  vezes: number;
  acertos: number;
  total: number;
  ultimoUso: string;
}

/** Junta os passos por ferramenta — é assim que o professor quer ver. */
export function resumirPorFerramenta(passos: Passo[]): ResumoFerramenta[] {
  const mapa = new Map<string, ResumoFerramenta>();
  for (const p of passos) {
    const atual = mapa.get(p.ferramenta) ?? {
      ferramenta: p.ferramenta,
      titulo: p.titulo,
      vezes: 0,
      acertos: 0,
      total: 0,
      ultimoUso: p.criadoEm,
    };
    atual.vezes += 1;
    atual.acertos += p.acertos ?? 0;
    atual.total += p.total ?? 0;
    if (p.criadoEm > atual.ultimoUso) atual.ultimoUso = p.criadoEm;
    mapa.set(p.ferramenta, atual);
  }
  return [...mapa.values()].sort((a, b) => b.vezes - a.vezes);
}

/** Quantos dias diferentes a criança usou alguma ferramenta. */
export function diasAtivos(passos: Passo[]): number {
  return new Set(passos.map((p) => p.criadoEm.slice(0, 10))).size;
}

/** Percentual de acerto geral, ignorando os passos que não pontuam. */
export function aproveitamento(passos: Passo[]): number | null {
  const comNota = passos.filter((p) => p.total && p.total > 0);
  if (!comNota.length) return null;
  const acertos = comNota.reduce((s, p) => s + (p.acertos ?? 0), 0);
  const total = comNota.reduce((s, p) => s + (p.total ?? 0), 0);
  return total ? Math.round((acertos / total) * 100) : null;
}
