/**
 * Referência dos resultados publicados: de qual período são e quando cada
 * instrumento foi aplicado. É o ÚNICO lugar para preencher as datas — as
 * telas leem daqui.
 *
 * `aplicadoEm` aceita texto livre ("14/10/2026", "de 05 a 09/10/2026").
 * Enquanto estiver `null`, a tela mostra "data de aplicação a confirmar",
 * em vez de deixar o leitor achar que o dado é de outro período.
 */
export interface Instrumento {
  id: "rendimento" | "mapa" | "diagnostica";
  nome: string;
  /** A que período do ano o instrumento se refere. */
  periodo: string;
  aplicadoEm: string | null;
  fonte: string;
}

export const REFERENCIA = {
  escola: "Escola Dr. Eiraldo Carneiro de França",
  municipio: "Feijó (AC)",
  bimestre: "3º bimestre de 2026",
  /** Data em que estes resultados foram publicados no site. */
  publicadoEm: "27/10/2026",
  instrumentos: [
    {
      id: "mapa",
      nome: "Mapa de classe de leitura e escrita",
      periodo: "3º bimestre de 2026",
      aplicadoEm: null,
      fonte: "Mapa de classe do 3º bimestre, preenchido pelos professores de cada turma",
    },
    {
      id: "rendimento",
      nome: "Rendimento das notas",
      periodo: "3º bimestre de 2026",
      aplicadoEm: null,
      fonte: "Planilha de rendimento bimestral da coordenação",
    },
    {
      id: "diagnostica",
      nome: "I Avaliação Diagnóstica",
      periodo: "início do ano letivo de 2026",
      aplicadoEm: null,
      fonte: "Tabulação da rede municipal (Secretaria de Educação)",
    },
  ] satisfies Instrumento[],
};

export function instrumento(id: Instrumento["id"]): Instrumento {
  return REFERENCIA.instrumentos.find((i) => i.id === id)!;
}

export const textoAplicacao = (i: Instrumento) => i.aplicadoEm ?? "data de aplicação a confirmar";
