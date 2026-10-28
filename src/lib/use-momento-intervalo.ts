import { useEffect, useState } from "react";

import { momentoDoIntervalo, type MomentoIntervalo } from "@/lib/entre-turnos";
import { agoraNaEscola } from "@/lib/schedule-engine";

/**
 * Fase do intervalo das 11h às 13h no relógio de Rio Branco, atualizada a
 * cada 30 s. É `null` até montar no navegador: no servidor o "agora" pode
 * ser outro, e a página não pode nascer com um dia e trocar para outro.
 */
export function useMomentoIntervalo(): MomentoIntervalo | null {
  const [m, setM] = useState<MomentoIntervalo | null>(null);
  useEffect(() => {
    const atualizar = () => setM(momentoDoIntervalo(agoraNaEscola()));
    atualizar();
    const id = window.setInterval(atualizar, 30_000);
    return () => window.clearInterval(id);
  }, []);
  return m;
}
