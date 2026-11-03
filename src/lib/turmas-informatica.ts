import type { Turma } from "@/lib/types";

/**
 * EJA não participa das aulas de informática desta escola.
 * Não remove registros escolares: apenas define quais turmas aparecem
 * nas chamadas, nos rodízios e nos indicadores do laboratório.
 */
export function turmaParticipaInformatica(turma: Pick<Turma, "id" | "serie" | "letra">): boolean {
  const identificacao = [turma.id, turma.serie, turma.letra]
    .join(" ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const siglaEJA = /(^|[^a-z])e\.?\s*j\.?\s*a\.?(?=$|[^a-z])/;
  const nomeCompleto = /\beducacao\s+(?:(?:de|para)\s+)?jovens\s+e\s+adultos\b/;

  return !siglaEJA.test(identificacao) && !nomeCompleto.test(identificacao);
}
