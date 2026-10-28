const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export interface InfoAniversario {
  anos: number;
  /** Meses completos além dos anos (0 a 11). */
  meses: number;
  /** "15 de março". */
  diaMes: string;
  /** Hoje é o aniversário. */
  hoje: boolean;
  /** Dias até o próximo aniversário (0 = hoje). */
  emDias: number;
  /** Idade que a criança completa no próximo aniversário (ou hoje). */
  completa: number;
}

const diasNoMes = (ano: number, mes: number) => new Date(ano, mes, 0).getDate();

/** Aniversário de quem nasceu em 29/02 cai em 28/02 nos anos que não são bissextos. */
function diaDoAniversario(ano: number, mes: number, dia: number) {
  return Math.min(dia, diasNoMes(ano, mes));
}

/**
 * Idade (anos e meses) e dados do aniversário a partir da data de nascimento
 * (YYYY-MM-DD), onde `hoje` é o dia de hoje (YYYY-MM-DD) no horário da escola.
 */
export function infoAniversario(
  nascimento: string | undefined,
  hoje: string,
): InfoAniversario | null {
  if (!nascimento) return null;
  const [ny, nm, nd] = nascimento.split("-").map(Number);
  if (!ny || !nm || !nd) return null;
  const [hy, hm, hd] = hoje.split("-").map(Number) as [number, number, number];

  // Último aniversário já ocorrido (hoje conta) e meses completos desde ele.
  const diaAniv = diaDoAniversario(hy, nm, nd);
  const ultimoAno = hm > nm || (hm === nm && hd >= diaAniv) ? hy : hy - 1;
  const ult = new Date(ultimoAno, nm - 1, diaDoAniversario(ultimoAno, nm, nd));
  const hojeD = new Date(hy, hm - 1, hd);
  let m = (hy - ult.getFullYear()) * 12 + (hojeD.getMonth() - ult.getMonth());
  if (hojeD.getDate() < ult.getDate()) m -= 1;
  const anos = ultimoAno - ny;
  const meses = Math.max(0, m);

  const hojeEhAniv = hm === nm && hd === diaDoAniversario(hy, nm, nd);
  const proxAno0 = hm > nm || (hm === nm && hd > diaDoAniversario(hy, nm, nd)) ? hy + 1 : hy;
  const prox = new Date(proxAno0, nm - 1, diaDoAniversario(proxAno0, nm, nd));
  const emDias = Math.round((prox.getTime() - hojeD.getTime()) / 86_400_000);
  return {
    anos,
    meses,
    diaMes: `${nd} de ${MESES[nm - 1]}`,
    hoje: hojeEhAniv,
    emDias,
    completa: proxAno0 - ny,
  };
}

export const textoIdade = (i: InfoAniversario) =>
  i.meses > 0
    ? `${i.anos} ${i.anos === 1 ? "ano" : "anos"} e ${i.meses} ${i.meses === 1 ? "mês" : "meses"}`
    : `${i.anos} ${i.anos === 1 ? "ano" : "anos"}`;
