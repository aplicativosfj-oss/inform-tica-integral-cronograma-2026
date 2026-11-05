import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase-client";

/**
 * Lembretes do laboratório.
 *
 * Nem toda anotação precisa voltar a aparecer: um elogio ou uma observação
 * pedagógica ficam no histórico e pronto. Mas três delas o professor precisa
 * ter diante dos olhos **na hora de escolher quem vai** — senão a escolha
 * repete o problema da semana passada:
 *
 * - `saiu_antes`  — pediu para sair antes do fim e deixou o colega de fora;
 * - `comportamento` — fato ocorrido durante a aula;
 * - `impedimento` — já foi impedido de participar alguma vez.
 *
 * Estes três viram uma marca amarela no cartão do aluno. Os lembretes são
 * lidos só por quem está conectado (a tabela recusa o visitante), então a
 * marca existe apenas no painel administrativo.
 */
export const TIPOS_MARCA = ["saiu_antes", "comportamento", "impedimento"] as const;

export const ROTULO_MARCA: Record<string, string> = {
  saiu_antes: "saiu antes do fim",
  comportamento: "comportamento",
  impedimento: "impedimento",
  observacao: "observação",
  elogio: "elogio",
};

/** Por quantos dias um lembrete continua aparecendo na tela de escolher. */
export const JANELA_MARCAS_DIAS = 60;

export interface MarcaAluno {
  /** Quantas vezes, dentro da janela. */
  n: number;
  /** Dia do registro mais recente (YYYY-MM-DD). */
  ultima: string;
  /** Tipo do registro mais recente. */
  tipo: string;
  /** Texto do registro mais recente, para a dica do cartão. */
  descricao: string;
}

interface Linha {
  aluno_id: string;
  turma_id: string;
  tipo: string;
  descricao: string;
  criado_em: string;
}

/**
 * Lembretes das turmas pedidas, do aluno para a marca. Devolve um mapa vazio
 * (sem erro na tela) quando a tabela não existe ou quem está vendo não tem
 * permissão: a marca é um extra, não pode quebrar a tela de marcar alunos.
 */
export async function carregarMarcas(turmaIds: string[]): Promise<Map<string, MarcaAluno>> {
  const mapa = new Map<string, MarcaAluno>();
  if (turmaIds.length === 0) return mapa;
  const desde = new Date(Date.now() - JANELA_MARCAS_DIAS * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("anotacoes_aluno_laboratorio")
    .select("aluno_id,turma_id,tipo,descricao,criado_em")
    .in("turma_id", turmaIds)
    .in("tipo", [...TIPOS_MARCA])
    .gte("criado_em", desde)
    .order("criado_em", { ascending: false })
    .limit(1000);
  if (error || !data) return mapa;
  for (const l of data as Linha[]) {
    const chave = `${l.turma_id}:${l.aluno_id}`;
    const atual = mapa.get(chave);
    // A consulta vem do mais novo para o mais antigo: o primeiro de cada
    // aluno já é o registro mais recente.
    if (atual) atual.n += 1;
    else
      mapa.set(chave, {
        n: 1,
        ultima: l.criado_em.slice(0, 10),
        tipo: l.tipo,
        descricao: l.descricao,
      });
  }
  return mapa;
}

/**
 * Lembretes das turmas visíveis, recarregados quando a lista de turmas muda
 * ou quando `versao` muda (depois de registrar uma marca nova).
 */
export function useMarcas(turmaIds: string[], versao = 0) {
  const chave = useMemo(() => [...new Set(turmaIds)].sort().join(","), [turmaIds]);
  const [marcas, setMarcas] = useState<Map<string, MarcaAluno>>(new Map());

  useEffect(() => {
    let vivo = true;
    const ids = chave ? chave.split(",") : [];
    if (ids.length === 0) {
      setMarcas(new Map());
      return;
    }
    void carregarMarcas(ids).then((m) => {
      if (vivo) setMarcas(m);
    });
    return () => {
      vivo = false;
    };
  }, [chave, versao]);

  return marcas;
}

/** Marca de um aluno dentro do mapa devolvido por `useMarcas`. */
export const marcaDe = (marcas: Map<string, MarcaAluno>, turmaId: string, alunoId: string) =>
  marcas.get(`${turmaId}:${alunoId}`);

/** "2026-11-05" -> "05/11" */
export const diaCurto = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
