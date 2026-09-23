import { DESCRITORES_CATALOGO } from "@/lib/descritores/catalogo";
import { DOMINIO_PADRAO, type Dominio } from "@/lib/descritores/dominios";
import { evolucaoPorTurma } from "@/lib/diagnostica/analise";
import type { ProvaII } from "@/lib/diagnostica/tipos";
import { chaveHab } from "@/lib/recomposicao/catalogo";

/**
 * Mapa de classe de uma turma: o que a II Avaliação sabe sobre cada criança
 * e sobre cada eixo de conteúdo, pronto para virar desenho.
 *
 * O limite vem dos dados e vale dizer em voz alta: a I Avaliação chega
 * fechada por turma (média, faixas, alfabéticos) e não traz aluno nenhum.
 * Então a comparação entre as duas aplicações só existe no nível da turma —
 * nenhum "fulano avançou X pontos" é possível, e a tela não finge que é.
 */

/** Faixa de desempenho usada em toda a tela — mesma régua para aluno e turma. */
export type Faixa = "apoio" | "atencao" | "bom" | "otimo";

export const FAIXAS: {
  id: Faixa;
  nome: string;
  de: number;
  ate: number;
  explica: string;
}[] = [
  {
    id: "apoio",
    nome: "Precisa de apoio",
    de: 0,
    ate: 0.5,
    explica: "acertou menos da metade",
  },
  {
    id: "atencao",
    nome: "Em construção",
    de: 0.5,
    ate: 0.7,
    explica: "acertou de 50% a 69%",
  },
  {
    id: "bom",
    nome: "Bom",
    de: 0.7,
    ate: 0.85,
    explica: "acertou de 70% a 84%",
  },
  {
    id: "otimo",
    nome: "Ótimo",
    de: 0.85,
    ate: Infinity,
    explica: "acertou 85% ou mais",
  },
];

export function faixaDe(acerto: number | null): (typeof FAIXAS)[number] | null {
  if (acerto == null) return null;
  return FAIXAS.find((f) => acerto < f.ate) ?? FAIXAS[3]!;
}

/** Índice descritor → domínio, montado uma vez a partir do catálogo. */
const DOMINIO_POR_ID = new Map(DESCRITORES_CATALOGO.map((d) => [d.id, d.dominio]));

/**
 * Mesma chave usada pelo guia de habilidades: código oficial quando a
 * questão tem um (Matemática), texto normalizado quando não tem.
 */
function idDaQuestao(texto: string): string {
  const codigo = /^(\d[A-Z]\d\.\d+)/.exec(texto)?.[1];
  return codigo ?? chaveHab(texto);
}

export interface AlunoNoMapa {
  nome: string;
  /** Acerto de 0 a 1 em cada disciplina; `null` quando faltou àquela prova. */
  lp: number | null;
  mat: number | null;
  /** Nível de escrita registrado na prova de Português, quando houver. */
  escrita?: string;
}

export interface EixoDoMapa {
  dominio: Dominio;
  acerto: number;
  acertos: number;
  total: number;
  /** Quantas questões da prova caíram neste eixo. */
  questoes: number;
}

export interface EvolucaoDisc {
  disc: "LP" | "MAT";
  i: number | null;
  ii: number | null;
  delta: number | null;
}

/** Distribuição de níveis de escrita (psicogênese, 1º e 2º ano). */
export interface DegrauEscrita {
  nivel: string;
  nome: string;
  n: number;
  alfabetico: boolean;
}

const NOME_ESCRITA: Record<string, string> = {
  A: "Alfabética, com ortografia regular",
  B: "Alfabética",
  C1: "Silábico-alfabética",
  C2: "Silábica com valor sonoro",
  C3: "Silábica sem valor sonoro",
  D: "Pré-silábica",
  E: "Não escreveu",
};
const ORDEM_ESCRITA = ["A", "B", "C1", "C2", "C3", "D", "E"];

export interface MapaTurma {
  ano: number;
  turma: string;
  alunos: AlunoNoMapa[];
  eixosLP: EixoDoMapa[];
  eixosMAT: EixoDoMapa[];
  evolucao: EvolucaoDisc[];
  /** Só existe no 1º e no 2º ano, onde a coluna de escrita é psicogênese. */
  escrita: DegrauEscrita[] | null;
  /** Acerto da turma inteira por disciplina (0 a 1). */
  turmaLP: number | null;
  turmaMAT: number | null;
}

type Contagem = { c: number; n: number };

function faltou(respostas: string): boolean {
  return respostas.includes("-") || respostas.trim() === "";
}

/**
 * Monta o mapa de uma turma a partir das provas da II Avaliação, cruzando
 * cada questão com o domínio de habilidade a que ela pertence (o mesmo
 * agrupamento que o guia de habilidades usa, para as duas telas contarem a
 * mesma história).
 */
export function mapaDaTurma(provas: ProvaII[], ano: number, turma: string): MapaTurma {
  const daTurma = provas.filter((p) => p.ano === ano && p.turma === turma);

  const porAluno = new Map<string, { lp: Contagem; mat: Contagem; escrita?: string }>();
  const eixos = new Map<string, { dominio: Dominio; c: number; n: number; qs: Set<string> }>();

  for (const prova of daTurma) {
    const questoes = Object.keys(prova.hab)
      .map(Number)
      .sort((a, b) => a - b);

    for (const aluno of prova.alunos) {
      const registro = porAluno.get(aluno.nome) ?? { lp: { c: 0, n: 0 }, mat: { c: 0, n: 0 } };
      porAluno.set(aluno.nome, registro);
      if (prova.disc === "LP" && aluno.esc) registro.escrita = aluno.esc;
      if (faltou(aluno.r)) continue;

      questoes.forEach((q, i) => {
        const resposta = aluno.r[i];
        if (!resposta) return;
        const certo = resposta === "C";

        if (prova.disc === "LP") {
          registro.lp.n += 1;
          if (certo) registro.lp.c += 1;
        } else if (prova.disc === "MAT") {
          registro.mat.n += 1;
          if (certo) registro.mat.c += 1;
        }

        // Ciências não entra nos dois mapas pedidos, mas também não estraga
        // a contagem por eixo: cada domínio já sabe de que disciplina é.
        const texto = prova.hab[String(q)] ?? "";
        const dominio = DOMINIO_POR_ID.get(idDaQuestao(texto)) ?? DOMINIO_PADRAO;
        const atual = eixos.get(dominio.id) ?? { dominio, c: 0, n: 0, qs: new Set<string>() };
        atual.n += 1;
        if (certo) atual.c += 1;
        atual.qs.add(`${prova.disc}-${q}`);
        eixos.set(dominio.id, atual);
      });
    }
  }

  const alunos: AlunoNoMapa[] = [...porAluno.entries()]
    .map(([nome, v]) => ({
      nome,
      lp: v.lp.n > 0 ? v.lp.c / v.lp.n : null,
      mat: v.mat.n > 0 ? v.mat.c / v.mat.n : null,
      ...(v.escrita ? { escrita: v.escrita } : {}),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const paraEixos = (disc: "LP" | "MAT"): EixoDoMapa[] =>
    [...eixos.values()]
      .filter((e) => e.dominio.disc === disc && e.n > 0)
      .map((e) => ({
        dominio: e.dominio,
        acerto: e.c / e.n,
        acertos: e.c,
        total: e.n,
        questoes: e.qs.size,
      }))
      .sort((a, b) => a.acerto - b.acerto);

  const evolucao: EvolucaoDisc[] = evolucaoPorTurma(provas)
    .filter((e) => e.ano === ano && e.turma === turma)
    .map((e) => ({ disc: e.disc, i: e.i, ii: e.ii, delta: e.delta }));

  // Psicogênese só faz sentido até o 2º ano: da 3ª série em diante a mesma
  // coluna passa a ser faixa de erro ortográfico (ver analise.ts).
  let escrita: DegrauEscrita[] | null = null;
  if (ano <= 2) {
    const contagem = new Map<string, number>();
    for (const a of alunos)
      if (a.escrita) contagem.set(a.escrita, (contagem.get(a.escrita) ?? 0) + 1);
    if (contagem.size > 0) {
      escrita = ORDEM_ESCRITA.filter((n) => contagem.has(n)).map((nivel) => ({
        nivel,
        nome: NOME_ESCRITA[nivel] ?? nivel,
        n: contagem.get(nivel) ?? 0,
        alfabetico: nivel === "A" || nivel === "B",
      }));
    }
  }

  const media = (valores: (number | null)[]): number | null => {
    const v = valores.filter((x): x is number => x != null);
    return v.length > 0 ? v.reduce((s, x) => s + x, 0) / v.length : null;
  };

  return {
    ano,
    turma,
    alunos,
    eixosLP: paraEixos("LP"),
    eixosMAT: paraEixos("MAT"),
    evolucao,
    escrita,
    turmaLP: media(alunos.map((a) => a.lp)),
    turmaMAT: media(alunos.map((a) => a.mat)),
  };
}
