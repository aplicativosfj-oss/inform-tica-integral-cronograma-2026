/**
 * Acesso dos profissionais da escola (professor regente e mediador/cuidador)
 * às suas áreas.
 *
 * Ninguém aqui faz cadastro: os profissionais já estão no cadastro da escola
 * (`professorRegente` e `apoioEspecial` de cada turma), e o sistema deriva
 * para cada um uma senha fixa de 4 dígitos a partir do nome e da turma. A
 * mesma pessoa recebe sempre o mesmo número, em qualquer aparelho, sem
 * precisar de tabela nova no banco — e a coordenação vê a lista no painel
 * administrativo (Turmas → a turma) para entregar a senha a cada um.
 *
 * Isto é um cadeado de porta de sala, não um cofre: como o cálculo acontece
 * no navegador, quem souber ler o código do site consegue chegar ao número.
 * Serve para separar as áreas e evitar que aluno entre no espaço do
 * professor — não para proteger segredo. Dado sensível de verdade continua
 * atrás do login do painel (Supabase Auth) e das funções do banco que
 * conferem o PIN do aluno.
 */

import type { Aluno, ApoioEspecial, Turma } from "@/lib/types";

/** Tempera a conta para o número não sair de um hash "de prateleira" do nome. */
const TEMPERO = "informatica-integral-2026";

/** FNV-1a de 32 bits — pequeno, estável e igual em qualquer navegador. */
function hash32(texto: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < texto.length; i += 1) {
    hash ^= texto.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** Senha de 4 dígitos derivada de uma chave qualquer (com zero à esquerda). */
function senhaDe(chave: string): string {
  return String(hash32(`${TEMPERO}|${chave}`) % 10000).padStart(4, "0");
}

/** Identificador estável do professor regente de uma turma. */
export function idProfessor(turma: Turma): string {
  return `professor:${turma.id}`;
}

/** Identificador estável de um profissional de apoio dentro da turma. */
export function idApoio(turma: Turma, indice: number): string {
  return `apoio:${turma.id}:${indice}`;
}

/** Senha do professor regente da turma. */
export function senhaProfessor(turma: Turma): string {
  return senhaDe(`${idProfessor(turma)}|${turma.professorRegente}`);
}

/** Senha de um mediador/cuidador da turma. */
export function senhaApoio(turma: Turma, indice: number): string {
  const apoio = turma.apoioEspecial?.[indice];
  return senhaDe(`${idApoio(turma, indice)}|${apoio?.nome ?? ""}`);
}

/**
 * Senha mestra da coordenação do AEE: abre a área de qualquer mediador ou
 * cuidador. Mesma regra das outras senhas — derivada do nome, sempre igual.
 */
export function senhaCoordenacaoAEE(nomeCoordenadora: string): string {
  return senhaDe(`coordenacao-aee|${nomeCoordenadora}`);
}

export function conferirSenhaCoordenacaoAEE(
  nomeCoordenadora: string | undefined,
  digitada: string,
): boolean {
  return (
    Boolean(nomeCoordenadora) && digitada.trim() === senhaCoordenacaoAEE(nomeCoordenadora ?? "")
  );
}

export function conferirSenhaProfessor(turma: Turma, digitada: string): boolean {
  return digitada.trim() === senhaProfessor(turma);
}

export function conferirSenhaApoio(turma: Turma, indice: number, digitada: string): boolean {
  return digitada.trim() === senhaApoio(turma, indice);
}

/** Um profissional de apoio com a turma em que atua — usado na lista geral. */
export interface ApoioComTurma {
  turma: Turma;
  indice: number;
  apoio: ApoioEspecial;
}

/** Todos os mediadores/cuidadores da escola, em ordem de turma. */
export function listarApoios(turmas: Turma[]): ApoioComTurma[] {
  return turmas.flatMap((turma) =>
    (turma.apoioEspecial ?? []).map((apoio, indice) => ({ turma, indice, apoio })),
  );
}

/** Alunos da turma que têm atendimento especializado, em ordem alfabética. */
export function alunosComAtendimento(turma: Turma): Aluno[] {
  return turma.alunos
    .filter((aluno) => aluno.necessidadeEspecial)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/**
 * Quais crianças ficam com cada mediador/cuidador.
 *
 * O cadastro da escola não diz "fulano acompanha beltrano" — diz só quem são
 * os profissionais da turma e quais alunos têm atendimento especializado. Na
 * falta dessa ligação, o sistema reparte os alunos entre os profissionais da
 * turma em rodízio (1º aluno pro 1º profissional, 2º pro 2º, e assim por
 * diante), sempre na mesma ordem — então a divisão não muda de um dia para o
 * outro. Quando a coordenação preencher `alunosIds` no cadastro do
 * profissional, essa lista manda e o rodízio é ignorado.
 */
export function alunosDoApoio(turma: Turma, indice: number): Aluno[] {
  const apoio = turma.apoioEspecial?.[indice];
  const atendidos = alunosComAtendimento(turma);
  if (!apoio) return [];

  if (apoio.alunosIds && apoio.alunosIds.length > 0) {
    const escolhidos = new Set(apoio.alunosIds);
    return atendidos.filter((aluno) => escolhidos.has(aluno.id));
  }

  const total = turma.apoioEspecial?.length ?? 1;
  return atendidos.filter((_, posicao) => posicao % total === indice);
}

/** Idade em anos completos a partir da data de nascimento (YYYY-MM-DD). */
export function idadeEmAnos(nascimento: string | undefined): number | null {
  if (!nascimento) return null;
  const data = new Date(`${nascimento}T12:00:00`);
  if (Number.isNaN(data.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - data.getFullYear();
  const passouAniversario =
    hoje.getMonth() > data.getMonth() ||
    (hoje.getMonth() === data.getMonth() && hoje.getDate() >= data.getDate());
  if (!passouAniversario) idade -= 1;
  return idade >= 0 && idade < 130 ? idade : null;
}

/**
 * Ferramentas adaptadas ao atendimento especializado: as que funcionam por
 * imagem, som, repetição e ritmo próprio. Ficam de fora as de leitura densa
 * (história, gêneros textuais), que dependem de leitura fluente — o
 * profissional continua podendo abrir qualquer uma pelo Espaço do Professor
 * quando fizer sentido.
 */
export const FERRAMENTAS_ADAPTADAS = [
  "alfabetizacao",
  "leitura",
  "acervo-leitura",
  "tabuada",
  "calculadora",
  "editor-texto",
  "geometria",
  "fracoes",
  "folclore",
  "datas-comemorativas",
] as const;
