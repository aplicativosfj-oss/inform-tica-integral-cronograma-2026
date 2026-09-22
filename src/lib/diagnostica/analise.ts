import { DADOS_I } from "@/lib/diagnostica/dados-i";
import type { ProvaII, TurmaI } from "@/lib/diagnostica/tipos";

/**
 * Motor de análise das duas avaliações diagnósticas.
 *
 * Tudo aqui é função pura sobre os dados já carregados: a página só desenha.
 * A régua comum entre as duas aplicações é o **percentual de acerto** — a
 * "média global" da I é uma nota de 0 a 100 calculada pela SEME com pesos
 * próprios, então comparar uma com a outra daria uma evolução falsa. Por
 * isso a comparação usa sempre a média simples de acerto nas questões, que
 * existe igual nas duas.
 */

export interface DesempenhoTurma {
  ano: number;
  turma: string;
  disc: "LP" | "MAT" | "CN";
  /** Média de acerto (0 a 1) nas questões da prova. */
  acerto: number;
  participantes: number;
  habilidades: { q: number; texto: string; acerto: number }[];
}

const chaveTurma = (ano: number, turma: string, disc: string) => `${ano}${turma}-${disc}`;

/**
 * Questões de uma prova da II, na ordem em que aparecem na resposta.
 *
 * As chaves de `hab` não são sempre 1,2,3…: em Português elas começam no 2,
 * porque a Q1 é a produção de texto, corrigida fora da grade de acertos. A
 * enésima letra de `r` é a enésima chave desta lista — casar pelo número da
 * questão desalinharia habilidade e resposta em todas as provas de LP.
 */
function questoesDaProva(prova: ProvaII): { q: number; texto: string }[] {
  return Object.keys(prova.hab)
    .map(Number)
    .sort((a, b) => a - b)
    .map((q) => ({ q, texto: prova.hab[String(q)] ?? `Questão ${q}` }));
}

/**
 * Um traço no lugar da resposta quer dizer que a criança não fez aquela
 * prova (faltou no dia). Tratar isso como erro faria faltoso virar aluno com
 * zero de acerto — e mandaria para a intervenção quem nunca foi avaliado.
 */
const respondeu = (letra: string | undefined) => letra != null && letra !== "-";
const fezAProva = (r: string) => [...r].some(respondeu);

/** Desempenho por turma na I Avaliação, só as turmas do integral. */
export function desempenhoI(): DesempenhoTurma[] {
  return DADOS_I.turmas
    .filter((t): t is TurmaI => t.turno === "INTEGRAL" && t.questoes.length > 0)
    .map((t) => ({
      ano: t.ano,
      turma: t.turma,
      disc: t.disc,
      participantes: t.participantes,
      acerto: media(t.questoes.map((q) => q.acerto)),
      habilidades: t.questoes.map((q) => ({ q: q.q, texto: q.hab, acerto: q.acerto })),
    }));
}

/** Desempenho por turma na II Avaliação, calculado a partir das respostas. */
export function desempenhoII(provas: ProvaII[]): DesempenhoTurma[] {
  return provas.map((p) => {
    const presentes = p.alunos.filter((a) => fezAProva(a.r));
    const habilidades = questoesDaProva(p).map(({ q, texto }, i) => {
      const responderam = presentes.filter((a) => respondeu(a.r[i]));
      const acertos = responderam.filter((a) => a.r[i] === "C").length;
      return { q, texto, acerto: responderam.length > 0 ? acertos / responderam.length : 0 };
    });
    return {
      ano: p.ano,
      turma: p.turma,
      disc: p.disc,
      participantes: presentes.length,
      acerto: media(habilidades.map((h) => h.acerto)),
      habilidades,
    };
  });
}

export interface Evolucao {
  ano: number;
  turma: string;
  disc: "LP" | "MAT";
  /** Acerto na I e na II (0 a 1); `null` quando a turma não fez aquela prova. */
  i: number | null;
  ii: number | null;
  /** Diferença em pontos percentuais (II menos I). */
  delta: number | null;
}

/**
 * Evolução de cada turma entre as duas aplicações. Ciências fica de fora:
 * só existe na II, então não há de onde tirar a evolução.
 */
export function evolucaoPorTurma(provasII: ProvaII[]): Evolucao[] {
  const i = new Map(desempenhoI().map((d) => [chaveTurma(d.ano, d.turma, d.disc), d]));
  const ii = new Map(desempenhoII(provasII).map((d) => [chaveTurma(d.ano, d.turma, d.disc), d]));
  const chaves = new Set([...i.keys(), ...ii.keys()]);
  const saida: Evolucao[] = [];
  for (const chave of chaves) {
    const a = i.get(chave);
    const b = ii.get(chave);
    const base = a ?? b;
    if (!base || base.disc === "CN") continue;
    const antes = a?.acerto ?? null;
    const depois = b?.acerto ?? null;
    saida.push({
      ano: base.ano,
      turma: base.turma,
      disc: base.disc,
      i: antes,
      ii: depois,
      delta: antes != null && depois != null ? depois - antes : null,
    });
  }
  return saida.sort(
    (x, y) => x.ano - y.ano || x.turma.localeCompare(y.turma) || x.disc.localeCompare(y.disc),
  );
}

export interface HabilidadeFragil {
  ano: number;
  turma: string;
  disc: string;
  texto: string;
  acerto: number;
  /** Quantos alunos erraram essa questão (só existe com dados da II). */
  erraram?: number;
}

/** Habilidades mais frágeis de uma lista de desempenhos, da pior para a melhor. */
export function maisFrageis(desempenhos: DesempenhoTurma[], limite = 10): HabilidadeFragil[] {
  return desempenhos
    .flatMap((d) =>
      d.habilidades.map((h) => ({
        ano: d.ano,
        turma: d.turma,
        disc: d.disc,
        texto: h.texto,
        acerto: h.acerto,
        erraram: Math.round((1 - h.acerto) * d.participantes),
      })),
    )
    .sort((a, b) => a.acerto - b.acerto)
    .slice(0, limite);
}

/** Habilidades mais consolidadas, da melhor para a pior. */
export function maisFortes(desempenhos: DesempenhoTurma[], limite = 10): HabilidadeFragil[] {
  return maisFrageis(desempenhos, Number.MAX_SAFE_INTEGER).reverse().slice(0, limite);
}

export interface PerfilAluno {
  nome: string;
  ano: number;
  turma: string;
  /** Acerto por disciplina (0 a 1). */
  porDisciplina: { disc: string; acerto: number; acertos: number; total: number }[];
  /** Acerto geral, somando todas as provas do aluno. */
  acerto: number;
  /** O que o aluno errou, prova a prova. */
  lacunas: { disc: string; q: number; texto: string }[];
  /** O que o aluno acertou — serve para montar dupla com quem já domina. */
  dominios: { disc: string; q: number; texto: string }[];
  /** Nível de escrita registrado na prova de Português, quando houver. */
  escrita?: string | undefined;
}

/**
 * Monta o perfil de cada aluno a partir das respostas da II Avaliação —
 * o único lugar onde existe resposta individual. Um aluno que aparece em
 * mais de uma prova (Português, Matemática, Ciências) vira um perfil só.
 */
export function perfisDosAlunos(provas: ProvaII[]): PerfilAluno[] {
  const porAluno = new Map<string, PerfilAluno>();
  for (const p of provas) {
    const questoes = questoesDaProva(p);
    for (const aluno of p.alunos) {
      // Quem faltou nessa prova não entra: sem resposta não há lacuna a apontar.
      if (!fezAProva(aluno.r)) continue;
      const chave = `${p.ano}${p.turma}|${aluno.nome}`;
      const perfil: PerfilAluno =
        porAluno.get(chave) ??
        ({
          nome: aluno.nome,
          ano: p.ano,
          turma: p.turma,
          porDisciplina: [],
          acerto: 0,
          lacunas: [],
          dominios: [],
        } satisfies PerfilAluno);
      let acertos = 0;
      let total = 0;
      questoes.forEach(({ q, texto }, i) => {
        if (!respondeu(aluno.r[i])) return;
        total += 1;
        if (aluno.r[i] === "C") {
          acertos += 1;
          perfil.dominios.push({ disc: p.disc, q, texto });
        } else {
          perfil.lacunas.push({ disc: p.disc, q, texto });
        }
      });
      perfil.porDisciplina.push({
        disc: p.disc,
        acerto: total > 0 ? acertos / total : 0,
        acertos,
        total,
      });
      if (aluno.esc) perfil.escrita = aluno.esc;
      porAluno.set(chave, perfil);
    }
  }
  for (const perfil of porAluno.values()) {
    const acertos = perfil.porDisciplina.reduce((s, d) => s + d.acertos, 0);
    const total = perfil.porDisciplina.reduce((s, d) => s + d.total, 0);
    perfil.acerto = total > 0 ? acertos / total : 0;
  }
  return [...porAluno.values()].sort(
    (a, b) => a.ano - b.ano || a.turma.localeCompare(b.turma) || a.acerto - b.acerto,
  );
}

export interface GrupoIntervencao {
  ano: number;
  turma: string;
  disc: string;
  habilidade: string;
  /** Quem errou essa habilidade: o grupo que precisa da intervenção. */
  precisam: string[];
  /** Quem acertou: candidatos a tutor na atividade em dupla. */
  tutores: string[];
  /** Parte da turma que errou (0 a 1) — quanto maior, mais vale aula coletiva. */
  proporcao: number;
}

/**
 * Agrupa os alunos pela habilidade que erraram, turma a turma. É o insumo
 * direto do reagrupamento: cada grupo vira uma mesa de trabalho, com quem
 * precisa retomar e quem já domina (e pode ensinar).
 *
 * Só entram habilidades com pelo menos `minimo` alunos, para não gerar
 * dezenas de grupos de uma pessoa só.
 */
export function gruposDeIntervencao(provas: ProvaII[], minimo = 3): GrupoIntervencao[] {
  const grupos: GrupoIntervencao[] = [];
  for (const p of provas) {
    const presentes = p.alunos.filter((a) => fezAProva(a.r));
    questoesDaProva(p).forEach(({ texto }, i) => {
      const responderam = presentes.filter((a) => respondeu(a.r[i]));
      const precisam = responderam.filter((a) => a.r[i] !== "C").map((a) => a.nome);
      const tutores = responderam.filter((a) => a.r[i] === "C").map((a) => a.nome);
      if (precisam.length < minimo) return;
      grupos.push({
        ano: p.ano,
        turma: p.turma,
        disc: p.disc,
        habilidade: texto,
        precisam,
        tutores,
        proporcao: responderam.length > 0 ? precisam.length / responderam.length : 0,
      });
    });
  }
  return grupos.sort((a, b) => b.proporcao - a.proporcao);
}

/**
 * Sugestão de encaminhamento para uma habilidade, conforme o tamanho do
 * buraco: turma inteira travada pede aula nova; poucos alunos pedem apoio
 * pontual, que cabe no laboratório sem parar a turma.
 */
export function comoIntervir(proporcao: number): { rotulo: string; texto: string } {
  if (proporcao >= 0.7) {
    return {
      rotulo: "Retomar com a turma toda",
      texto:
        "A maior parte da turma não domina. Vale uma aula nova sobre a habilidade antes de qualquer atividade de fixação.",
    };
  }
  if (proporcao >= 0.4) {
    return {
      rotulo: "Reagrupar em duas mesas",
      texto:
        "Metade da turma trava aqui. Separe quem precisa retomar numa mesa com o professor e deixe quem domina numa atividade de aprofundamento.",
    };
  }
  return {
    rotulo: "Apoio em dupla",
    texto:
      "Poucos alunos travam. Monte duplas com quem já domina e trate no laboratório, sem parar a turma.",
  };
}

/** Alunos que mais precisam de acompanhamento, do menor acerto para o maior. */
export function prioridadeDeAtendimento(perfis: PerfilAluno[], limite = 15): PerfilAluno[] {
  return [...perfis].sort((a, b) => a.acerto - b.acerto).slice(0, limite);
}

function media(valores: number[]): number {
  if (valores.length === 0) return 0;
  return valores.reduce((s, v) => s + v, 0) / valores.length;
}

export const pct = (v: number | null | undefined, casas = 0) =>
  v == null ? "—" : `${(v * 100).toFixed(casas)}%`;

export interface Alfabetizacao {
  ano: number;
  turma: string;
  /** Parte da turma com escrita alfabética na I e na II (0 a 1). */
  i: number | null;
  ii: number | null;
  delta: number | null;
}

/**
 * Alfabetização do 1º e do 2º ano — a única leitura que atravessa as duas
 * aplicações nessas turmas, já que em Português elas não têm questões de
 * acerto, e sim nível de escrita. Conta como alfabética a criança nos níveis
 * A (alfabética com ortografia regular) e B (alfabética).
 *
 * Vale só até o 2º ano de propósito: da 3ª série em diante a mesma coluna
 * `esc` deixa de ser psicogênese e passa a ser faixa de erro ortográfico
 * (A sem erros, B de 1 a 4 erros…). Misturar as duas escalas compararia
 * coisas diferentes e daria uma "queda" que não existe.
 */
export function alfabetizacao(provas: ProvaII[]): Alfabetizacao[] {
  const saida: Alfabetizacao[] = [];
  for (const t of DADOS_I.turmas) {
    if (t.turno !== "INTEGRAL" || t.disc !== "LP" || t.ano > 2 || t.alfabeticos == null) continue;
    const prova = provas.find((p) => p.ano === t.ano && p.turma === t.turma && p.disc === "LP");
    const comNivel = prova?.alunos.filter((a) => a.esc) ?? [];
    const ii =
      comNivel.length > 0
        ? comNivel.filter((a) => a.esc === "A" || a.esc === "B").length / comNivel.length
        : null;
    saida.push({
      ano: t.ano,
      turma: t.turma,
      i: t.alfabeticos,
      ii,
      delta: ii != null ? ii - t.alfabeticos : null,
    });
  }
  return saida.sort((a, b) => a.ano - b.ano || a.turma.localeCompare(b.turma));
}

export interface Ortografia {
  ano: number;
  turma: string;
  /** Parte da turma que escreve com no máximo 4 erros de ortografia. */
  i: number | null;
  ii: number | null;
  delta: number | null;
}

/**
 * Ortografia do 3º ao 5º ano: parte da turma que escreveu o texto com no
 * máximo quatro erros (faixas A e B da escala da SEME). É a leitura de
 * escrita que existe nas duas aplicações para essas turmas.
 */
export function ortografiaComparada(provas: ProvaII[]): Ortografia[] {
  const saida: Ortografia[] = [];
  for (const t of DADOS_I.turmas) {
    if (t.turno !== "INTEGRAL" || t.disc !== "LP" || t.ano < 3) continue;
    const a = t.ortografia.A;
    const b = t.ortografia.B;
    const i = a == null && b == null ? null : (a ?? 0) + (b ?? 0);
    const prova = provas.find((p) => p.ano === t.ano && p.turma === t.turma && p.disc === "LP");
    const comNivel = prova?.alunos.filter((x) => x.esc) ?? [];
    const ii =
      comNivel.length > 0
        ? comNivel.filter((x) => x.esc === "A" || x.esc === "B").length / comNivel.length
        : null;
    if (i == null && ii == null) continue;
    saida.push({
      ano: t.ano,
      turma: t.turma,
      i,
      ii,
      delta: i != null && ii != null ? ii - i : null,
    });
  }
  return saida.sort((x, y) => x.ano - y.ano || x.turma.localeCompare(y.turma));
}
