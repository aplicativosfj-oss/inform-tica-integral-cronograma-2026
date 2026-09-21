import { useEffect, useState } from "react";

import { ATIVIDADES_LP, type AtividadeLP } from "@/components/school/ferramentas/atividades-lp-dados";
import { GERADORES, type Gerador, type Nivel, type Serie } from "@/lib/recomposicao/geradores";
import { supabase } from "@/lib/supabase-client";

export type { Nivel, Serie };
export type Disciplina = "MAT" | "LP";

export const NIVEIS: { id: Nivel; nome: string; emoji: string; para: string }[] = [
  { id: "retomada", nome: "Retomada", emoji: "🌱", para: "Para quem ainda está começando: passo a passo, com apoio visual." },
  { id: "pratica", nome: "Prática", emoji: "🌿", para: "Para fixar o que a série precisa saber." },
  { id: "desafio", nome: "Desafio", emoji: "🌳", para: "Para quem já sabe e quer ir além: dois passos e números maiores." },
];

/** Descritores da II Avaliação Diagnóstica, em linguagem simples. */
export const DESCRITORES: Record<string, string> = {
  "1N2.4": "Contar objetos, um a um ou em grupos",
  "1N1.4": "Comparar quantidades: tem mais, tem menos, tem igual",
  "1G2.1": "Dizer onde as coisas estão: direita, esquerda, frente, atrás",
  "1M1.6": "Dias da semana, meses e partes do dia",
  "1A1.4": "Descobrir o que falta numa sequência",
  "1N2.1": "Problemas de juntar e tirar",
  "2N2.4": "Contar",
  "2N1.4": "Comparar quantidades",
  "2N2.1": "Problemas de adição",
  "2G2.1": "Localização: direita, esquerda, frente, atrás",
  "2E1.2": "Ler tabelas simples",
  "2M1.7": "Moedas e cédulas do dinheiro brasileiro",
  "2G1.3": "Reconhecer círculo, quadrado, retângulo e triângulo",
  "2E1.3": "Ler gráficos de colunas",
  "3M1.4": "Escolher a medida e o instrumento certo",
  "3G1.2": "Relacionar sólidos geométricos a objetos",
  "3A1.3": "Completar sequências de números",
  "3N1.5": "Comparar e ordenar números até as centenas",
  "3N2.1": "Problemas de adição e subtração",
  "3N2.2": "Problemas de multiplicação",
  "3E1.2": "Ler tabelas simples e de dupla entrada",
  "3E1.3": "Ler gráficos de colunas",
  "3M1.7": "Usar dinheiro em situações do dia a dia",
  "3N1.8": "Compor e decompor números (unidades, dezenas, centenas)",
  "4N1.4": "Compor e decompor números até o milhar",
  "4N1.3": "Colocar números em ordem crescente e decrescente",
  "4N2.1": "Problemas de adição e subtração",
  "4A1.2": "Completar sequências de números",
  "4G2.1": "Localização e movimentação no espaço",
  "4G1.4": "Sólidos geométricos e objetos do dia a dia",
  "4N2.2": "Problemas de multiplicação",
  "4M1.6": "Unidades de tempo e dinheiro",
  "4E1.2": "Ler tabelas de dupla entrada",
  "4E1.3": "Ler gráficos de colunas",
  "4M1.2": "Medir comprimento, massa e capacidade",
  "5N1.1": "Ler, comparar e ordenar números grandes",
  "5N1.2": "Localizar números numa sequência",
  "5N1.4": "Compor e decompor números",
  "5N2.1": "Problemas de adição e subtração",
  "5N2.2": "Problemas de multiplicação e divisão",
  "5G2.1": "Posição e movimento na malha quadriculada",
  "5G1.3": "Semelhanças e diferenças entre sólidos",
  "5G1.5": "Planificação de sólidos (moldes)",
  "5M1.2": "Metro, centímetro e quilômetro",
  "5M2.2": "Problemas com medidas de comprimento",
  "5E1.2": "Ler tabelas de dupla entrada",
  "5E1.3": "Ler gráficos de colunas",
};

export type Fonte = { tipo: "gerador"; gerador: Gerador } | { tipo: "lp"; atividade: AtividadeLP };

export interface Entrada {
  id: string;
  disc: Disciplina;
  serie: Serie;
  titulo: string;
  emoji: string;
  conteudo: string;
  descritores: string[];
  niveis: Nivel[];
  fonte: Fonte;
}

export const CATALOGO: Entrada[] = [
  ...GERADORES.flatMap((g) =>
    (Object.entries(g.descritores) as [string, string[]][]).map(([s, cods]) => ({
      id: `${g.id}-${s}`,
      disc: "MAT" as const,
      serie: Number(s) as Serie,
      titulo: g.titulo,
      emoji: g.emoji,
      conteudo: g.conteudo,
      descritores: cods,
      niveis: ["retomada", "pratica", "desafio"] as Nivel[],
      fonte: { tipo: "gerador" as const, gerador: g },
    })),
  ),
  ...ATIVIDADES_LP.map((a) => ({
    id: `lp-${a.id}`,
    disc: "LP" as const,
    serie: a.serie,
    titulo: a.titulo,
    emoji: a.emoji,
    conteudo: "Leitura e interpretação",
    descritores: [],
    // A versão adaptada vira a retomada; as questões completas, a prática.
    niveis: ["retomada", "pratica"] as Nivel[],
    fonte: { tipo: "lp" as const, atividade: a },
  })),
];

// ─── prioridade a partir da avaliação ────────────────────────────────────────

interface TurmaAval {
  ano: number;
  disc: string;
  hab: Record<string, string>;
  alunos: { r: string }[];
}

/** Percentual de acerto por série e descritor (e a média da série em LP). */
export type MapaPrioridade = Map<string, number>;

function calcular(dados: TurmaAval[]): MapaPrioridade {
  const soma = new Map<string, { c: number; n: number }>();
  const add = (k: string, certo: boolean) => {
    const v = soma.get(k) ?? { c: 0, n: 0 };
    v.n += 1;
    if (certo) v.c += 1;
    soma.set(k, v);
  };
  for (const t of dados) {
    const qs = Object.keys(t.hab)
      .map(Number)
      .sort((a, b) => a - b);
    for (const al of t.alunos) {
      if (al.r.includes("-")) continue;
      qs.forEach((q, i) => {
        const certo = al.r[i] === "C";
        const cod = /^(\d[A-Z]\d\.\d+)/.exec(t.hab[String(q)] ?? "")?.[1];
        if (cod) add(`${t.ano}|${cod}`, certo);
        add(`${t.ano}|${t.disc}`, certo);
      });
    }
  }
  const mapa: MapaPrioridade = new Map();
  soma.forEach((v, k) => mapa.set(k, (100 * v.c) / v.n));
  return mapa;
}

/** Lê a versão pública da avaliação para dizer o que é prioridade em cada série. */
export function usePrioridades(): MapaPrioridade | null {
  const [mapa, setMapa] = useState<MapaPrioridade | null>(null);
  useEffect(() => {
    let vivo = true;
    supabase
      .from("avaliacao_diagnostica")
      .select("dados")
      .eq("id", "2026-II-publico")
      .maybeSingle()
      .then(({ data }) => {
        if (vivo && data) setMapa(calcular(data.dados as TurmaAval[]));
      });
    return () => {
      vivo = false;
    };
  }, []);
  return mapa;
}

/** Acerto da série na avaliação para esta entrada (o pior dos seus descritores). */
export function acertoDaEntrada(e: Entrada, mapa: MapaPrioridade | null): number | null {
  if (!mapa) return null;
  if (e.descritores.length) {
    const v = e.descritores.map((d) => mapa.get(`${e.serie}|${d}`)).filter((x): x is number => x != null);
    return v.length ? Math.min(...v) : null;
  }
  return mapa.get(`${e.serie}|${e.disc}`) ?? null;
}

export const nivelRecomendado = (p: number | null): Nivel =>
  p == null ? "pratica" : p < 50 ? "retomada" : p < 70 ? "pratica" : "desafio";
