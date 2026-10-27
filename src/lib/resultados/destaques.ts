import { DADOS_I } from "@/lib/diagnostica/dados-i";
import { MAPA_CLASSE_3_BIM } from "@/lib/mapa-classe/dados-3bim";
import { escritaDoAno } from "@/lib/mapa-classe/niveis";
import type { EvolucaoLeitura } from "@/lib/mapa-classe/tipos";
import { RENDIMENTO_3_BIMESTRE } from "@/lib/rendimento/dados-3bim";
import { percentuais } from "@/lib/rendimento/tipos";

export interface Destaque {
  id: string;
  titulo: string;
  texto: string;
  tom: "positivo" | "atencao" | "neutro";
}

const pct = (parte: number, total: number) => (total ? Math.round((parte / total) * 100) : 0);
const total = (e: EvolucaoLeitura) => e.A + e.B + e.C + e.D + e.E;
const leitoresAB = (e: EvolucaoLeitura) => pct(e.A + e.B, total(e));
const nome = (chave: string) => `${chave[0]}º ${chave.slice(1)}`;

/**
 * Leituras automáticas dos números, escritas para quem não vai ler tabela.
 * Tudo é calculado a partir dos mesmos dados das telas, então não envelhece
 * sozinho e não afirma nada que os números não mostrem.
 */
export function gerarDestaques(): Destaque[] {
  const out: Destaque[] = [];
  const evol = MAPA_CLASSE_3_BIM.evolucaoLeitura;
  const chaves = Object.keys(evol);

  // 1. Leitura: escola inteira e variação por turma, 1º → 3º bimestre.
  const somar = (bim: number) =>
    chaves
      .map((k) => evol[k]!.find((e) => e.bim === bim)!)
      .reduce(
        (a, e) => ({
          A: a.A + e.A,
          B: a.B + e.B,
          C: a.C + e.C,
          D: a.D + e.D,
          E: a.E + e.E,
          avaliados: 0,
          bim,
        }),
        { A: 0, B: 0, C: 0, D: 0, E: 0, avaliados: 0, bim },
      );
  const e1 = somar(1);
  const e3 = somar(3);
  const variacoes = chaves
    .map((k) => {
      const l = evol[k]!;
      return {
        k,
        de: leitoresAB(l.find((e) => e.bim === 1)!),
        para: leitoresAB(l.find((e) => e.bim === 3)!),
      };
    })
    .map((v) => ({ ...v, diff: v.para - v.de }));
  const melhor = [...variacoes].sort((a, b) => b.diff - a.diff)[0]!;
  const pior = [...variacoes].sort((a, b) => a.diff - b.diff)[0]!;
  out.push({
    id: "leitura-escola",
    titulo: "A leitura avançou na escola",
    texto: `Alunos que leem com fluência ou pausadamente: ${leitoresAB(e1)}% no 1º bimestre e ${leitoresAB(e3)}% no 3º. Os alunos que só leem sílabas ou não leem caíram de ${pct(e1.D + e1.E, total(e1))}% para ${pct(e3.D + e3.E, total(e3))}%.`,
    tom: leitoresAB(e3) >= leitoresAB(e1) ? "positivo" : "atencao",
  });
  out.push({
    id: "leitura-turmas",
    titulo: "Maior avanço e maior atenção na leitura",
    texto:
      `Maior avanço: ${nome(melhor.k)}, de ${melhor.de}% para ${melhor.para}% (${melhor.diff > 0 ? "+" : ""}${melhor.diff} pontos). ` +
      (pior.diff < 0
        ? `Recuo: ${nome(pior.k)}, de ${pior.de}% para ${pior.para}% (${pior.diff} pontos), com número de alunos avaliados diferente entre os bimestres.`
        : `Nenhuma turma recuou entre o 1º e o 3º bimestre.`),
    tom: pior.diff < 0 ? "atencao" : "positivo",
  });

  // 2. Onde há mais alunos que só leem sílabas ou não leem.
  const de = MAPA_CLASSE_3_BIM.turmas
    .map((t) => ({ t, n: t.leitura.D + t.leitura.E }))
    .sort((a, b) => b.n - a.n)[0]!;
  out.push({
    id: "leitura-prioridade",
    titulo: "Onde agir primeiro na leitura",
    texto: `${de.t.ano}º ${de.t.turma} tem ${de.n} aluno${de.n === 1 ? "" : "s"} que só leem sílabas ou não leem, o maior número entre as turmas (${pct(de.n, de.t.avaliadosLeitura)}% dos avaliados).`,
    tom: "atencao",
  });

  // 3. Escrita: turma com maior parte em nível de prioridade.
  const esc = MAPA_CLASSE_3_BIM.turmas
    .map((t) => {
      const n = escritaDoAno(t.ano)
        .filter((x) => x.zona === "prioridade")
        .reduce((s, x) => s + (t.escrita[x.id] ?? 0), 0);
      return { t, n, p: pct(n, t.avaliadosEscrita) };
    })
    .sort((a, b) => b.p - a.p)[0]!;
  out.push({
    id: "escrita-prioridade",
    titulo: "Onde agir primeiro na escrita",
    texto: `${esc.t.ano}º ${esc.t.turma} tem ${esc.n} aluno${esc.n === 1 ? "" : "s"} em nível de prioridade na escrita (${esc.p}% dos avaliados), a maior proporção entre as turmas.`,
    tom: "atencao",
  });

  // 4. Notas do bimestre.
  const turmasNotas = RENDIMENTO_3_BIMESTRE.turmas;
  const cem = turmasNotas.filter((t) => t.disciplinas.every((d) => d.padrao === d.total));
  const abaixo = turmasNotas.flatMap((t) =>
    t.disciplinas
      .filter((d) => d.padrao < d.total)
      .map((d) => ({ t, d, p: percentuais(d), n: d.total - d.padrao })),
  );
  const maisAbaixo = [...abaixo].sort((a, b) => b.n / b.d.total - a.n / a.d.total)[0];
  out.push({
    id: "notas",
    titulo: "Notas do 3º bimestre",
    texto:
      `${cem.length} das ${turmasNotas.length} turmas têm todos os alunos com nota de 7,0 a 10,0 em todas as disciplinas.` +
      (maisAbaixo
        ? ` Onde há alunos abaixo de 7,0 (${[...new Set(abaixo.map((a) => `${a.t.ano}º ${a.t.turma}`))].join(" e ")}), o ponto mais alto de atenção é ${maisAbaixo.d.nome} no ${maisAbaixo.t.ano}º ${maisAbaixo.t.turma}: ${maisAbaixo.n} de ${maisAbaixo.d.total} alunos (${pct(maisAbaixo.n, maisAbaixo.d.total)}%).`
        : ""),
    tom: abaixo.length ? "atencao" : "positivo",
  });

  // 5. Contraste entre nota do bimestre e diagnóstica (momentos diferentes).
  const contraste = turmasNotas
    .map((t) => {
      const d = t.disciplinas.find((x) => x.id === "LP");
      const dg = DADOS_I.turmas.find(
        (x) => x.ano === t.ano && x.turma === t.turma && x.disc === "LP",
      );
      return d && dg?.azuis != null && percentuais(d).padrao >= 0.95 && dg.azuis < 0.5
        ? `${t.ano}º ${t.turma} (${Math.round(dg.azuis * 100)}%)`
        : null;
    })
    .filter(Boolean);
  if (contraste.length) {
    out.push({
      id: "contraste",
      titulo: "Notas altas e diagnóstica mais baixa",
      texto: `Em Língua Portuguesa, quase todos os alunos de ${contraste.join(", ")} tiraram 7,0 ou mais no bimestre, enquanto menos da metade passou de 50% na I Avaliação Diagnóstica (entre parênteses). São provas de momentos e objetivos diferentes, então o contraste é um ponto para conversar, não uma conclusão.`,
      tom: "neutro",
    });
  }

  return out;
}
