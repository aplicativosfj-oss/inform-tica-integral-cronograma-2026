import { desempenhoI, desempenhoII, evolucaoPorTurma } from "@/lib/diagnostica/analise";
import type { ProvaII } from "@/lib/diagnostica/tipos";
import { MAPA_CLASSE_3_BIM } from "@/lib/mapa-classe/dados-3bim";
import type { EvolucaoLeitura, NivelLeitura } from "@/lib/mapa-classe/tipos";

/**
 * O ano letivo numa linha só: a leitura medida no mapa de classe de cada
 * bimestre (1º, 2º e 3º) e as duas avaliações diagnósticas. Serve para a
 * página de Resultados comparar o bimestre atual com os anteriores.
 */

export const NIVEIS_LEITURA: NivelLeitura[] = ["A", "B", "C", "D", "E"];

export interface FotoLeitura {
  bim: number;
  total: number;
  niveis: Record<NivelLeitura, number>;
  /** Parte que lê com fluência ou pausadamente (A + B), de 0 a 1. */
  leem: number;
  /** Parte que só lê sílabas ou ainda não lê (D + E), de 0 a 1. */
  prioridade: number;
}

const frac = (parte: number, total: number) => (total ? parte / total : 0);

function foto(e: Omit<EvolucaoLeitura, "avaliados">): FotoLeitura {
  const niveis = { A: e.A, B: e.B, C: e.C, D: e.D, E: e.E };
  const total = e.A + e.B + e.C + e.D + e.E;
  return {
    bim: e.bim,
    total,
    niveis,
    leem: frac(e.A + e.B, total),
    prioridade: frac(e.D + e.E, total),
  };
}

export const BIMESTRES = [1, 2, 3] as const;

/** Leitura da escola inteira em cada bimestre. */
export function leituraDaEscola(): FotoLeitura[] {
  const evol = Object.values(MAPA_CLASSE_3_BIM.evolucaoLeitura);
  return BIMESTRES.map((bim) => {
    const soma = { bim, A: 0, B: 0, C: 0, D: 0, E: 0 };
    for (const lista of evol) {
      const e = lista.find((x) => x.bim === bim);
      if (!e) continue;
      for (const n of NIVEIS_LEITURA) soma[n] += e[n];
    }
    return foto(soma);
  });
}

export interface TurmaNoAno {
  chave: string;
  ano: number;
  turma: string;
  leitura: FotoLeitura[];
  /** Variação de A+B, em pontos, do 1º para o 3º e do 2º para o 3º bimestre. */
  desde1: number;
  desde2: number;
  /** Acerto na I e na II Diagnóstica, por disciplina (0 a 1). */
  diagnostica: { disc: "LP" | "MAT"; i: number | null; ii: number | null }[];
}

/** Cada turma ao longo do ano. A diagnóstica II entra quando já carregou. */
export function turmasNoAno(provas: ProvaII[] | null): TurmaNoAno[] {
  const evolucaoDiag = provas ? evolucaoPorTurma(provas) : null;
  const soI = desempenhoI();
  return Object.entries(MAPA_CLASSE_3_BIM.evolucaoLeitura)
    .map(([chave, lista]) => {
      const ano = Number(chave[0]);
      const turma = chave.slice(1);
      const leitura = BIMESTRES.map(
        (bim) => lista.find((e) => e.bim === bim) ?? { bim, A: 0, B: 0, C: 0, D: 0, E: 0 },
      ).map(foto);
      const [b1, b2, b3] = leitura;
      const diagnostica = (["LP", "MAT"] as const).map((disc) => {
        const ev = evolucaoDiag?.find((e) => e.ano === ano && e.turma === turma && e.disc === disc);
        const i = soI.find((d) => d.ano === ano && d.turma === turma && d.disc === disc);
        return { disc, i: ev?.i ?? i?.acerto ?? null, ii: ev?.ii ?? null };
      });
      return {
        chave,
        ano,
        turma,
        leitura,
        desde1: Math.round(((b3?.leem ?? 0) - (b1?.leem ?? 0)) * 100),
        desde2: Math.round(((b3?.leem ?? 0) - (b2?.leem ?? 0)) * 100),
        diagnostica,
      };
    })
    .sort((a, b) => a.ano - b.ano || a.turma.localeCompare(b.turma));
}

/** Acerto médio da escola na I e na II (só LP e MAT, que existem nas duas). */
export function diagnosticaDaEscola(provas: ProvaII[] | null): { i: number; ii: number | null } {
  const media = (v: number[]) => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0);
  const i = media(desempenhoI().map((d) => d.acerto));
  const ii = provas
    ? media(
        desempenhoII(provas)
          .filter((d) => d.disc !== "CN")
          .map((d) => d.acerto),
      )
    : null;
  return { i, ii };
}
