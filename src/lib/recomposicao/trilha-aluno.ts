import { useEffect, useState } from "react";

import {
  CATALOGO,
  DESCRITORES,
  acertoDaEntrada,
  chaveHab,
  type Disciplina,
  type Entrada,
  type MapaPrioridade,
  type Nivel,
  type Serie,
} from "@/lib/recomposicao/catalogo";
import { supabase } from "@/lib/supabase-client";

/**
 * "Minha trilha": a lista de atividades escolhida a partir dos erros do
 * próprio aluno na II Avaliação Diagnóstica, e o progresso (estrelas) que
 * ele vai ganhando. O progresso só é lido e gravado por funções do banco
 * que conferem o PIN do aluno, no mesmo padrão do resto da Área do Aluno.
 */

interface TurmaAval {
  ano: number;
  turma: string;
  disc: Disciplina;
  hab: Record<string, string>;
  alunos: { nome: string; r: string }[];
}

export interface PassoTrilha {
  entrada: Entrada;
  nivel: Nivel;
  /** Habilidades da prova que o aluno errou e que esta atividade trabalha. */
  motivos: string[];
  /** Percentual do aluno na disciplina (para ordenar e escolher o nível). */
  acertoDisc: number;
}

export interface Trilha {
  /** O aluno foi encontrado na avaliação? Se não, a trilha usa as prioridades da série. */
  personalizada: boolean;
  passos: PassoTrilha[];
  /** Percentual do aluno por disciplina, quando encontrado. */
  resumo: Partial<Record<Disciplina, number>>;
}

const limparNome = (n: string) =>
  chaveHab(n.replace(/\(.*?\)/g, " "))
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Mesmo nome; ou mesmo primeiro nome + mesmo último sobrenome; ou mesmos dois
 * primeiros nomes — as grafias variam entre o cadastro e as planilhas.
 */
function mesmoAluno(a: string, b: string): boolean {
  const x = limparNome(a),
    y = limparNome(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const px = x.split(" "),
    py = y.split(" ");
  if (px[0] !== py[0]) return false;
  if (px.at(-1) === py.at(-1)) return true;
  return px.length >= 3 && py.length >= 3 && px[1] === py[1] && px[1]!.length > 3;
}

/**
 * Escolhe o aluno da planilha que corresponde ao nome do cadastro. Havendo
 * mais de um candidato (ex.: dois “João Miguel”), fica com o que tem mais
 * palavras em comum; se ainda empatar, não escolhe ninguém — é melhor cair
 * na trilha da série do que mostrar os erros de outra criança.
 */
function encontrarAluno<T extends { nome: string }>(alunos: T[], nome: string): T | undefined {
  const candidatos = alunos.filter((a) => mesmoAluno(a.nome, nome));
  if (candidatos.length <= 1) return candidatos[0];
  const alvo = new Set(limparNome(nome).split(" "));
  const pontos = candidatos.map((a) => ({
    a,
    p: limparNome(a.nome)
      .split(" ")
      .filter((w) => alvo.has(w)).length,
  }));
  const max = Math.max(...pontos.map((x) => x.p));
  const melhores = pontos.filter((x) => x.p === max);
  return melhores.length === 1 ? melhores[0]!.a : undefined;
}

const nivelDoAluno = (p: number): Nivel => (p < 50 ? "retomada" : p < 80 ? "pratica" : "desafio");

export function montarTrilha(
  dados: TurmaAval[],
  serie: Serie,
  letra: string,
  nomeAluno: string,
  prioridades: MapaPrioridade | null,
): Trilha {
  const turmas = dados.filter((t) => t.ano === serie && t.turma.toUpperCase() === letra.toUpperCase());
  const porEntrada = new Map<string, PassoTrilha>();
  const resumo: Partial<Record<Disciplina, number>> = {};

  for (const t of turmas) {
    const aluno = encontrarAluno(t.alunos, nomeAluno);
    if (!aluno || aluno.r.includes("-")) continue;
    const qs = Object.keys(t.hab)
      .map(Number)
      .sort((a, b) => a - b);
    const acerto = (100 * [...aluno.r].filter((c) => c === "C").length) / aluno.r.length;
    resumo[t.disc] = acerto;
    qs.forEach((q, i) => {
      if (aluno.r[i] !== "E") return;
      const hab = t.hab[String(q)] ?? "";
      const cod = /^(\d[A-Z]\d\.\d+)/.exec(hab)?.[1];
      const chave = chaveHab(hab);
      const entradas = CATALOGO.filter(
        (e) =>
          e.serie === serie &&
          e.disc === t.disc &&
          ((cod && e.descritores.includes(cod)) || e.habilidades.some((h) => chaveHab(h) === chave)),
      );
      for (const e of entradas) {
        const passo = porEntrada.get(e.id) ?? { entrada: e, nivel: nivelDoAluno(acerto), motivos: [], acertoDisc: acerto };
        // Motivo em linguagem simples (descritores de Matemática); em Português
        // e Ciências o próprio título da atividade já diz o que se treina.
        const texto = cod ? DESCRITORES[cod] : undefined;
        if (texto && !passo.motivos.includes(texto)) passo.motivos.push(texto);
        porEntrada.set(e.id, passo);
      }
    });
  }

  if (porEntrada.size) {
    const passos = [...porEntrada.values()].sort(
      (a, b) => a.acertoDisc - b.acertoDisc || b.motivos.length - a.motivos.length,
    );
    return { personalizada: true, passos, resumo };
  }

  // Aluno não encontrado (faltou, chegou depois da prova ou o nome não bateu):
  // usa o que a série mais errou.
  const passos = CATALOGO.filter((e) => e.serie === serie && e.fonte.tipo !== "lp")
    .map((e) => ({ e, p: acertoDaEntrada(e, prioridades) ?? 100 }))
    .sort((a, b) => a.p - b.p)
    .slice(0, 8)
    .map(({ e, p }) => ({
      entrada: e,
      nivel: (p < 50 ? "retomada" : "pratica") as Nivel,
      motivos: [],
      acertoDisc: p,
    }));
  return { personalizada: false, passos, resumo };
}

/** Lê a versão pública da avaliação (a mesma usada no painel público). */
export function useAvaliacaoPublica(): TurmaAval[] | null {
  const [dados, setDados] = useState<TurmaAval[] | null>(null);
  useEffect(() => {
    let vivo = true;
    supabase
      .from("avaliacao_diagnostica")
      .select("dados")
      .eq("id", "2026-II-publico")
      .maybeSingle()
      .then(({ data }) => {
        if (vivo) setDados(data ? (data.dados as TurmaAval[]) : []);
      });
    return () => {
      vivo = false;
    };
  }, []);
  return dados;
}

// ─── progresso (exige PIN) ───────────────────────────────────────────────────

export interface Progresso {
  atividadeId: string;
  nivel: Nivel;
  estrelas: number;
  acertos: number;
  total: number;
  tentativas: number;
}

export async function lerProgresso(alunoId: string, pin: string): Promise<Progresso[]> {
  const { data, error } = await supabase.rpc("progresso_recomposicao_aluno", {
    p_aluno_id: alunoId,
    p_pin: pin,
  });
  if (error) throw error;
  return ((data ?? []) as {
    atividade_id: string;
    nivel: Nivel;
    estrelas: number;
    acertos: number;
    total: number;
    tentativas: number;
  }[]).map((r) => ({
    atividadeId: r.atividade_id,
    nivel: r.nivel,
    estrelas: r.estrelas,
    acertos: r.acertos,
    total: r.total,
    tentativas: r.tentativas,
  }));
}

export async function registrarResultado(
  alunoId: string,
  pin: string,
  atividadeId: string,
  nivel: Nivel,
  acertos: number,
  total: number,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("registrar_recomposicao_aluno", {
    p_aluno_id: alunoId,
    p_pin: pin,
    p_atividade_id: atividadeId,
    p_nivel: nivel,
    p_acertos: acertos,
    p_total: total,
  });
  if (error) throw error;
  return data === true;
}

/** Estrelas de uma rodada, pela mesma regra do banco. */
export const estrelasDe = (acertos: number, total: number) =>
  acertos * 10 >= total * 8 ? 3 : acertos * 2 >= total ? 2 : 1;

export const PROXIMO_NIVEL: Record<Nivel, Nivel | null> = {
  retomada: "pratica",
  pratica: "desafio",
  desafio: null,
};
