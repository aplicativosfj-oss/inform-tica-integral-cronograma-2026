import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { Questao } from "@/components/school/ferramentas/quiz";
import { CATALOGO, DESCRITORES, NOME_DISC, type Entrada, type Nivel, type Serie } from "@/lib/recomposicao/catalogo";
import { gerarRodada } from "@/lib/recomposicao/geradores";
import { supabase } from "@/lib/supabase-client";

/**
 * Simulados: provas montadas pela equipe a partir do catálogo de atividades,
 * aplicadas a uma turma inteira com tempo marcado. As questões ficam
 * congeladas no banco na hora da criação (todos recebem a mesma prova) e o
 * gabarito nunca vai para o aluno: a correção é feita pelo banco.
 */

export type Area = "leitura" | "escrita" | "MAT" | "CN";

export const AREAS: { id: Area; nome: string; descricao: string }[] = [
  { id: "leitura", nome: "Leitura", descricao: "Interpretação de textos, inferência, gêneros, narrativa" },
  { id: "escrita", nome: "Escrita e língua", descricao: "Alfabetização, pontuação, conectivos, rimas e palavras" },
  { id: "MAT", nome: "Matemática", descricao: "Números, operações, geometria, medidas e gráficos" },
  { id: "CN", nome: "Ciências", descricao: "Vida, saúde, matéria, energia, Terra e ambiente" },
];

/** Atividades de Português que trabalham escrita e funcionamento da língua (o resto é leitura). */
const LP_ESCRITA = new Set(["lp-conectivos", "lp-pontuacao", "lp-rimas-sons", "lp-letras-frases", "lp-referencia"]);

export function areaDe(e: Entrada): Area {
  if (e.disc === "MAT" || e.disc === "CN") return e.disc;
  const base = e.fonte.tipo === "banco" ? e.fonte.atividade.id : "";
  return LP_ESCRITA.has(base) ? "escrita" : "leitura";
}

/** O que a atividade avalia, em linguagem simples (vai para o relatório do professor). */
export function habilidadeDe(e: Entrada): string {
  if (e.descritores.length) return e.descritores.map((d) => DESCRITORES[d] ?? d).join(" · ");
  return e.titulo;
}

export function entradasPara(serie: Serie, areas: Area[]): Entrada[] {
  return CATALOGO.filter((e) => e.serie === serie && areas.includes(areaDe(e)));
}

export interface QuestaoSimulado {
  enunciado: string;
  opcoes: string[];
  /** Índice da opção certa — removido pelo banco antes de chegar ao aluno. */
  correta?: number;
  texto?: { titulo?: string; paragrafos: string[] };
  ilustracaoHtml?: string;
  entradaId: string;
  area: Area;
  habilidade: string;
  conteudo: string;
}

export interface ConfigSimulado {
  areas: Area[];
  conteudos: string[];
  entradas: string[];
  nivel: Nivel | "misto";
  quantidade: number;
}

const embaralhar = <T,>(lista: T[]): T[] => {
  const c = [...lista];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j]!, c[i]!];
  }
  return c;
};

function paraSimulado(e: Entrada, q: Questao, texto?: QuestaoSimulado["texto"]): QuestaoSimulado {
  const ordem = embaralhar(q.opcoes.map((_, i) => i));
  const out: QuestaoSimulado = {
    enunciado: q.enunciado,
    opcoes: ordem.map((i) => q.opcoes[i]!),
    correta: ordem.indexOf(q.respostaCorreta),
    entradaId: e.id,
    area: areaDe(e),
    habilidade: habilidadeDe(e),
    conteudo: e.conteudo,
  };
  if (texto?.paragrafos.length) out.texto = texto;
  if (q.ilustracao) out.ilustracaoHtml = renderToStaticMarkup(createElement(Fragment, null, q.ilustracao));
  return out;
}

const NIVEIS_MISTO: Nivel[] = ["retomada", "pratica", "desafio"];

/** Monta a prova: distribui as questões entre as atividades escolhidas, sem repetir enunciado. */
export function montarQuestoes(serie: Serie, cfg: ConfigSimulado): QuestaoSimulado[] {
  let entradas = entradasPara(serie, cfg.areas);
  if (cfg.conteudos.length) entradas = entradas.filter((e) => cfg.conteudos.includes(e.conteudo));
  if (cfg.entradas.length) entradas = entradas.filter((e) => cfg.entradas.includes(e.id));
  if (!entradas.length) return [];
  const ordem = embaralhar(entradas);
  const usados = new Set<string>();
  const saida: QuestaoSimulado[] = [];
  const usadasPorBanco = new Map<string, number>();
  let tentativas = 0;
  while (saida.length < cfg.quantidade && tentativas < cfg.quantidade * 12) {
    const e = ordem[tentativas % ordem.length]!;
    tentativas += 1;
    const nivelBase: Nivel = cfg.nivel === "misto" ? NIVEIS_MISTO[saida.length % 3]! : cfg.nivel;
    const nivel = e.niveis.includes(nivelBase) ? nivelBase : (e.niveis[e.niveis.length - 1] ?? "pratica");
    let q: Questao | undefined;
    let texto: QuestaoSimulado["texto"];
    if (e.fonte.tipo === "gerador") {
      q = gerarRodada(e.fonte.gerador, serie, nivel, 1)[0];
    } else {
      const lista =
        e.fonte.tipo === "banco"
          ? e.fonte.atividade.niveis[nivel].questoes
          : nivel === "retomada"
            ? e.fonte.atividade.adaptada.questoes
            : e.fonte.atividade.questoes;
      const k = `${e.id}|${nivel}`;
      const i = usadasPorBanco.get(k) ?? 0;
      q = lista[i];
      usadasPorBanco.set(k, i + 1);
      const t =
        e.fonte.tipo === "banco"
          ? e.fonte.atividade.niveis[nivel].texto
          : nivel === "retomada" && e.fonte.atividade.adaptada.textoCurto
            ? { titulo: e.fonte.atividade.texto?.titulo ?? "", paragrafos: e.fonte.atividade.adaptada.textoCurto }
            : e.fonte.atividade.texto;
      if (t?.paragrafos.length) texto = t.titulo ? { titulo: t.titulo, paragrafos: t.paragrafos } : { paragrafos: t.paragrafos };
    }
    if (!q || usados.has(q.enunciado)) continue;
    usados.add(q.enunciado);
    saida.push(paraSimulado(e, q, texto));
  }
  // Questões do mesmo texto ficam juntas, na ordem em que o texto aparece.
  return saida.sort((a, b) => (a.texto?.titulo ?? "").localeCompare(b.texto?.titulo ?? "") || 0);
}

export const rotuloArea = (a: Area) => AREAS.find((x) => x.id === a)?.nome ?? a;
export const rotuloDisc = NOME_DISC;

// ─── banco de dados (equipe, com login) ──────────────────────────────────────

export interface Simulado {
  id: string;
  turma_id: string;
  serie: number;
  titulo: string;
  config: ConfigSimulado;
  questoes: QuestaoSimulado[];
  duracao_min: number;
  frase_confirmacao: string;
  status: "pronto" | "ativo" | "encerrado";
  criado_em: string;
  iniciado_em: string | null;
  encerrado_em: string | null;
}

export interface RespostaSimulado {
  simulado_id: string;
  aluno_id: string;
  aluno_nome: string;
  respostas: Record<string, number>;
  respondidas: number;
  acertos: number;
  total: number;
  status: "fazendo" | "finalizado";
  iniciado_em: string;
  atualizado_em: string;
  finalizado_em: string | null;
}

export async function listarSimulados(): Promise<Simulado[]> {
  const { data, error } = await supabase.from("simulados").select("*").order("criado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Simulado[];
}

export async function criarSimulado(s: Omit<Simulado, "id" | "status" | "criado_em" | "iniciado_em" | "encerrado_em">) {
  const { data, error } = await supabase.from("simulados").insert(s).select("*").single();
  if (error) throw error;
  return data as Simulado;
}

export async function iniciarSimulado(id: string) {
  const { error } = await supabase
    .from("simulados")
    .update({ status: "ativo", iniciado_em: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pronto");
  if (error) throw error;
}

export async function excluirSimulado(id: string) {
  const { error } = await supabase.from("simulados").delete().eq("id", id);
  if (error) throw error;
}

export async function encerrarSimulado(id: string, frase: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("encerrar_simulado", { p_id: id, p_frase: frase });
  if (error) throw error;
  return data === true;
}

export async function respostasDoSimulado(ids: string[]): Promise<RespostaSimulado[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase.from("simulado_respostas").select("*").in("simulado_id", ids);
  if (error) throw error;
  return (data ?? []) as RespostaSimulado[];
}

// ─── lado do aluno (PIN) ─────────────────────────────────────────────────────

export interface SimuladoDoAluno {
  id: string;
  titulo: string;
  duracao_min: number;
  iniciado_em: string;
  agora: string;
  questoes: QuestaoSimulado[];
  minha: {
    respostas: Record<string, number>;
    status: "fazendo" | "finalizado";
    acertos: number | null;
    total: number;
    iniciado_em: string;
    finalizado_em: string | null;
  } | null;
}

type Cred = { alunoId: string; pin: string; turmaId: string };
const base = (c: Cred) => ({ p_aluno_id: c.alunoId, p_pin: c.pin, p_turma_id: c.turmaId });

export async function simuladoDoAluno(c: Cred): Promise<SimuladoDoAluno | null> {
  const { data, error } = await supabase.rpc("simulado_do_aluno", base(c));
  if (error) throw error;
  return (data ?? null) as SimuladoDoAluno | null;
}
export async function comecarSimulado(c: Cred, simuladoId: string, nome: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("iniciar_simulado_aluno", { ...base(c), p_simulado_id: simuladoId, p_nome: nome });
  if (error) throw error;
  return data === true;
}
export async function responderSimulado(c: Cred, simuladoId: string, indice: number, resposta: number): Promise<boolean> {
  const { data, error } = await supabase.rpc("responder_simulado_aluno", {
    ...base(c),
    p_simulado_id: simuladoId,
    p_indice: indice,
    p_resposta: resposta,
  });
  if (error) throw error;
  return data === true;
}
export async function finalizarSimulado(
  c: Cred,
  simuladoId: string,
): Promise<{ acertos: number; total: number; respondidas: number; tempo_seg: number } | null> {
  const { data, error } = await supabase.rpc("finalizar_simulado_aluno", { ...base(c), p_simulado_id: simuladoId });
  if (error) throw error;
  return data as { acertos: number; total: number; respondidas: number; tempo_seg: number } | null;
}
export async function meusResultados(c: Cred): Promise<{ titulo: string; acertos: number; total: number; data: string }[]> {
  const { data, error } = await supabase.rpc("resultados_simulados_aluno", base(c));
  if (error) throw error;
  return (data ?? []) as { titulo: string; acertos: number; total: number; data: string }[];
}

// ─── selos de incentivo (sem comparação com colegas) ─────────────────────────

export function selo(p: number) {
  if (p >= 85) return { nome: "Excelente", frase: "Você mostrou que domina esses conteúdos!", cls: "bg-emerald-700 text-white" };
  if (p >= 70) return { nome: "Muito bem", frase: "Você acertou a maior parte. Continue assim!", cls: "bg-teal-700 text-white" };
  if (p >= 50) return { nome: "No caminho", frase: "Você já sabe bastante. Treine o que faltou na sua trilha.", cls: "bg-sky-700 text-white" };
  return { nome: "Em construção", frase: "Cada tentativa ensina. A sua trilha tem atividades para ajudar.", cls: "bg-violet-700 text-white" };
}
