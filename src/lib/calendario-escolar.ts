/**
 * Feriados nacionais fixos relevantes à agenda de informática.
 * As datas são comparadas no calendário local da escola (Feijó/AC),
 * sem conversões que possam deslocar o dia pela diferença de fuso.
 */
export interface FeriadoEscolar {
  nome: string;
  tipo: "nacional";
  descricao: string;
}

/** Finados é feriado nacional em 02 de novembro de qualquer ano. */
export function feriadoNacionalEm(dataISO: string): FeriadoEscolar | null {
  if (/^\d{4}-11-02$/.test(dataISO)) {
    return {
      nome: "Dia de Finados",
      tipo: "nacional",
      descricao: "Feriado nacional · Sem aulas regulares de informática",
    };
  }
  return null;
}

export function haAulaRegularEm(dataISO: string): boolean {
  return feriadoNacionalEm(dataISO) === null;
}
