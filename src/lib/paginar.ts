/** Fatia uma lista na página pedida (1-based), sempre dentro dos limites. */
export function paginar<T>(itens: T[], pagina: number, porPagina: number) {
  const totalPaginas = Math.max(1, Math.ceil(itens.length / porPagina));
  const atual = Math.min(Math.max(1, pagina), totalPaginas);
  const inicio = (atual - 1) * porPagina;
  return { itens: itens.slice(inicio, inicio + porPagina), atual, totalPaginas };
}
