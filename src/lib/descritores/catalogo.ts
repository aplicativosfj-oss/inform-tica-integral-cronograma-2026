import { useEffect, useState } from "react";

import { DOMINIOS, DOMINIO_PADRAO, type Dominio } from "@/lib/descritores/dominios";
import type { ProvaII } from "@/lib/diagnostica/tipos";
import {
  CATALOGO,
  DESCRITORES,
  chaveHab,
  type Disciplina,
  type Entrada,
  type Nivel,
  type Serie,
} from "@/lib/recomposicao/catalogo";
import { supabase } from "@/lib/supabase-client";

export interface AtividadeLigada {
  titulo: string;
  emoji: string;
  niveis: Nivel[];
  /** Dicas reais de "como fazer em sala", só quando a atividade vem do banco escrito à mão. */
  emSala?: string[];
}

export interface Descritor {
  /** Código do descritor (Matemática) ou o texto normalizado (Português/Ciências). */
  id: string;
  disc: Disciplina;
  codigo?: string;
  texto: string;
  series: Serie[];
  dominio: Dominio;
  niveis: Nivel[];
  atividades: AtividadeLigada[];
}

function atividadeDe(e: Entrada): AtividadeLigada {
  const emSala = e.fonte.tipo === "banco" ? e.fonte.atividade.emSala : undefined;
  return { titulo: e.titulo, emoji: e.emoji, niveis: e.niveis, ...(emSala ? { emSala } : {}) };
}

/** Uma atividade pode aparecer em várias séries (uma `Entrada` por série) — junta pelo título. */
function unirAtividades(lista: AtividadeLigada[]): AtividadeLigada[] {
  const porTitulo = new Map<string, AtividadeLigada>();
  for (const a of lista) {
    const atual = porTitulo.get(a.titulo);
    if (!atual) {
      porTitulo.set(a.titulo, { ...a });
      continue;
    }
    atual.niveis = [...new Set([...atual.niveis, ...a.niveis])];
    if (a.emSala && !atual.emSala) atual.emSala = a.emSala;
  }
  return [...porTitulo.values()];
}

const dominioDe = (nome: string | undefined): Dominio => (nome && DOMINIOS[nome]) || DOMINIO_PADRAO;

// ───────────── Matemática: a partir dos 47 códigos reais em DESCRITORES ─────────────
const descritoresMat: Descritor[] = Object.entries(DESCRITORES).map(([codigo, texto]) => {
  const serie = Number(codigo[0]) as Serie;
  const ligadas = CATALOGO.filter((e) => e.disc === "MAT" && e.descritores.includes(codigo));
  return {
    id: codigo,
    disc: "MAT" as const,
    codigo,
    texto,
    series: [serie],
    dominio: dominioDe(ligadas[0]?.conteudo),
    niveis: [...new Set(ligadas.flatMap((e) => e.niveis))],
    atividades: unirAtividades(ligadas.map(atividadeDe)),
  };
});

// ───────────── Português e Ciências: união dos textos reais de habilidade ─────────────
interface AcumuladorLpCn {
  disc: Disciplina;
  texto: string;
  series: Set<Serie>;
  entradas: Entrada[];
}
const lpCn = new Map<string, AcumuladorLpCn>();
for (const e of CATALOGO) {
  if (e.disc === "MAT") continue;
  for (const h of e.habilidades) {
    const chave = chaveHab(h);
    if (!chave) continue;
    const atual = lpCn.get(chave) ?? {
      disc: e.disc,
      texto: h,
      series: new Set<Serie>(),
      entradas: [],
    };
    atual.series.add(e.serie);
    atual.entradas.push(e);
    lpCn.set(chave, atual);
  }
}
const descritoresLpCn: Descritor[] = [...lpCn.entries()].map(([chave, v]) => ({
  id: chave,
  disc: v.disc,
  texto: v.texto,
  series: [...v.series].sort((a, b) => a - b),
  dominio: dominioDe(v.entradas[0]?.conteudo),
  niveis: [...new Set(v.entradas.flatMap((e) => e.niveis))],
  atividades: unirAtividades(v.entradas.map(atividadeDe)),
}));

/** Todos os descritores catalogados — Matemática (com código oficial) + Português/Ciências (texto). */
export const DESCRITORES_CATALOGO: Descritor[] = [...descritoresMat, ...descritoresLpCn].sort(
  (a, b) => (a.series[0] ?? 0) - (b.series[0] ?? 0) || a.texto.localeCompare(b.texto, "pt-BR"),
);

/** Domínios com pelo menos um descritor catalogado, na ordem em que os descritores aparecem. */
export const DOMINIOS_USADOS: Dominio[] = [
  ...new Map(DESCRITORES_CATALOGO.map((d) => [d.dominio.id, d.dominio])).values(),
];

// ───────────── Desempenho real (opcional) — mesma avaliação pública já usada em Avaliações ─────────────

export interface DesempenhoReal {
  /** id do descritor → % de acerto da rede toda. */
  rede: Map<string, number>;
  /** "3º A" → id do descritor → % de acerto daquela turma. */
  porTurma: Map<string, Map<string, number>>;
  turmas: string[];
}

type Contagem = Map<string, { c: number; n: number }>;

function somar(mapa: Contagem, chave: string, certo: boolean) {
  const v = mapa.get(chave) ?? { c: 0, n: 0 };
  v.n += 1;
  if (certo) v.c += 1;
  mapa.set(chave, v);
}

function paraPercentual(mapa: Contagem): Map<string, number> {
  return new Map([...mapa].map(([k, v]) => [k, (100 * v.c) / v.n]));
}

function calcularDesempenho(dados: ProvaII[]): DesempenhoReal {
  const rede: Contagem = new Map();
  const porTurmaBruto = new Map<string, Contagem>();
  for (const t of dados) {
    const turmaChave = `${t.ano}º ${t.turma}`;
    const turmaMapa = porTurmaBruto.get(turmaChave) ?? new Map();
    porTurmaBruto.set(turmaChave, turmaMapa);
    const qs = Object.keys(t.hab)
      .map(Number)
      .sort((a, b) => a - b);
    for (const aluno of t.alunos) {
      if (aluno.r.includes("-")) continue;
      qs.forEach((q, i) => {
        const certo = aluno.r[i] === "C";
        const texto = t.hab[String(q)] ?? "";
        const codigo = /^(\d[A-Z]\d\.\d+)/.exec(texto)?.[1];
        const id = codigo ?? chaveHab(texto);
        somar(rede, id, certo);
        somar(turmaMapa, id, certo);
      });
    }
  }
  return {
    rede: paraPercentual(rede),
    porTurma: new Map([...porTurmaBruto].map(([k, v]) => [k, paraPercentual(v)])),
    turmas: [...porTurmaBruto.keys()].sort(),
  };
}

/**
 * Lê a mesma avaliação pública que a página de Avaliações usa
 * (`avaliacao_diagnostica`, id `2026-II-publico`) e calcula o acerto real
 * por descritor — geral e por turma. `null` enquanto carrega ou se a
 * avaliação ainda não foi publicada; a página funciona normalmente sem
 * isso (mostra só o catálogo, sem os números ao vivo).
 */
export function useDesempenhoReal(): DesempenhoReal | null {
  const [dados, setDados] = useState<DesempenhoReal | null>(null);
  useEffect(() => {
    let vivo = true;
    supabase
      .from("avaliacao_diagnostica")
      .select("dados")
      .eq("id", "2026-II-publico")
      .maybeSingle()
      .then(({ data }) => {
        if (vivo && data) setDados(calcularDesempenho(data.dados as ProvaII[]));
      });
    return () => {
      vivo = false;
    };
  }, []);
  return dados;
}
