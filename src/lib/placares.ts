import { supabase } from "@/lib/supabase-client";

/**
 * Placares dos jogos — o ranking que liga as turmas.
 *
 * Fica numa tabela própria (`placares`) e não em `entregas`: entrega é
 * trabalho do aluno, que o professor corrige; placar é brincadeira, e
 * misturar os dois encheria o histórico do aluno de partidas.
 *
 * Enquanto a tabela não existir no Supabase, nada quebra: o placar é gravado
 * só no navegador e o ranking mostra as partidas daquele computador, com um
 * aviso. O SQL para criar a tabela está em `supabase/placares.sql`.
 */

export interface Placar {
  jogo: string;
  aluno: string;
  turma: string;
  pontos: number;
  acertos: number;
  total: number;
  nivel: string;
  segundos: number;
  criadoEm: string;
}

interface PlacarRow {
  jogo: string;
  aluno: string;
  turma: string | null;
  pontos: number;
  acertos: number;
  total: number;
  nivel: string | null;
  segundos: number | null;
  criado_em: string;
}

const CHAVE_LOCAL = "infoteca:placares";

export interface ResultadoRanking {
  placares: Placar[];
  /** true quando veio só do navegador: a tabela do banco ainda não existe. */
  somenteLocal: boolean;
}

function lerLocais(): Placar[] {
  try {
    const bruto = window.localStorage.getItem(CHAVE_LOCAL);
    return bruto ? (JSON.parse(bruto) as Placar[]) : [];
  } catch {
    return [];
  }
}

function gravarLocal(p: Placar) {
  try {
    // Guarda no máximo 200: é placar de jogo, não histórico escolar.
    const todos = [p, ...lerLocais()].slice(0, 200);
    window.localStorage.setItem(CHAVE_LOCAL, JSON.stringify(todos));
  } catch {
    // Sem storage: o placar vale só para esta partida.
  }
}

function paraPlacar(r: PlacarRow): Placar {
  return {
    jogo: r.jogo,
    aluno: r.aluno,
    turma: r.turma ?? "",
    pontos: r.pontos,
    acertos: r.acertos,
    total: r.total,
    nivel: r.nivel ?? "",
    segundos: r.segundos ?? 0,
    criadoEm: r.criado_em,
  };
}

export async function salvarPlacar(p: Omit<Placar, "criadoEm">): Promise<void> {
  const completo: Placar = { ...p, criadoEm: new Date().toISOString() };
  gravarLocal(completo);
  try {
    await supabase.from("placares").insert({
      jogo: p.jogo,
      aluno: p.aluno,
      turma: p.turma,
      pontos: p.pontos,
      acertos: p.acertos,
      total: p.total,
      nivel: p.nivel,
      segundos: p.segundos,
    });
  } catch {
    // Sem rede ou sem tabela: o placar local já foi gravado acima.
  }
}

export async function fetchRanking(jogo: string, turma?: string): Promise<ResultadoRanking> {
  const local = lerLocais()
    .filter((p) => p.jogo === jogo && (!turma || p.turma === turma))
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, 20);
  try {
    let q = supabase
      .from("placares")
      .select("*")
      .eq("jogo", jogo)
      .order("pontos", { ascending: false })
      .limit(20);
    if (turma) q = q.eq("turma", turma);
    const { data, error } = await q;
    if (error) return { placares: local, somenteLocal: true };
    return { placares: ((data ?? []) as PlacarRow[]).map(paraPlacar), somenteLocal: false };
  } catch {
    return { placares: local, somenteLocal: true };
  }
}
