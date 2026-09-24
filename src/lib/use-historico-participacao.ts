import { useEffect, useSyncExternalStore } from "react";

import { supabase } from "@/lib/supabase-client";
import {
  assinarHistoricoParticipacao,
  definirHistoricoParticipacao,
  versaoHistoricoParticipacao,
} from "@/lib/schedule-engine";

const PAGINA = 1000;
const RELER_A_CADA_MS = 3 * 60 * 1000;

/** Última data de participação (presente ou substituindo) de cada aluno, por turma. */
async function carregar(): Promise<void> {
  const mapa = new Map<string, Map<string, string>>();
  for (let inicio = 0; ; inicio += PAGINA) {
    const { data, error } = await supabase
      .from("presencas")
      .select("turma_id, aluno_id, data")
      .in("status", ["presente", "substituido"])
      .order("data", { ascending: false })
      .order("id")
      .range(inicio, inicio + PAGINA - 1);
    if (error) throw error;
    for (const linha of data ?? []) {
      const porAluno = mapa.get(linha.turma_id) ?? new Map<string, string>();
      if (!porAluno.has(linha.aluno_id)) porAluno.set(linha.aluno_id, linha.data);
      mapa.set(linha.turma_id, porAluno);
    }
    if (!data || data.length < PAGINA) break;
  }
  definirHistoricoParticipacao(mapa);
}

/**
 * Mantém atualizado o histórico de participação usado pelo horário misto.
 * Sem rede ou sem permissão de leitura, nada quebra: vale o rodízio por índice.
 */
export function useCarregarHistoricoParticipacao(): void {
  useEffect(() => {
    let vivo = true;
    const atualizar = () => {
      if (!vivo) return;
      carregar().catch(() => undefined);
    };
    atualizar();
    const id = window.setInterval(atualizar, RELER_A_CADA_MS);
    const aoVoltar = () => {
      if (document.visibilityState === "visible") atualizar();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      vivo = false;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, []);
}

/** Faz o componente renderizar de novo quando o histórico é carregado ou muda. */
export function useHistoricoParticipacao(): number {
  return useSyncExternalStore(
    assinarHistoricoParticipacao,
    versaoHistoricoParticipacao,
    () => 0,
  );
}
