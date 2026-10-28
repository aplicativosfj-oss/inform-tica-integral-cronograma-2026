import { useEffect, useState } from "react";

import type { ProvaII } from "@/lib/diagnostica/tipos";
import { supabase } from "@/lib/supabase-client";

/**
 * Respostas públicas da II Avaliação Diagnóstica (sem dado sensível além do
 * que a página de Avaliações já mostra). Usado em Avaliações e em Resultados,
 * que compara a II com a I e com os bimestres.
 */
export function useProvasII() {
  const [provas, setProvas] = useState<ProvaII[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    supabase
      .from("avaliacao_diagnostica")
      .select("dados")
      .eq("id", "2026-II-publico")
      .maybeSingle()
      .then(({ data, error }) => {
        if (!vivo) return;
        if (error) setErro(error.message);
        else if (!data) setErro("Os resultados ainda não foram publicados.");
        else setProvas(data.dados as ProvaII[]);
      });
    return () => {
      vivo = false;
    };
  }, []);

  return { provas, erro };
}
