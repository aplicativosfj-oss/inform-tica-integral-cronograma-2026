/**
 * "Sessão" do profissional (professor regente ou mediador/cuidador), no
 * mesmo espírito da sessão do aluno: fica em `sessionStorage`, some ao
 * fechar a aba e serve para a área não pedir a senha a cada clique. Quem
 * manda de verdade é a senha conferida em `profissional-acesso.ts`.
 */

const CHAVE = "informatica:profissional-sessao";

export type TipoProfissional = "professor" | "apoio";

export interface ProfissionalSessao {
  tipo: TipoProfissional;
  /** Identificador estável (ver `idProfessor`/`idApoio`). */
  id: string;
  nome: string;
  turmaId: string;
  /** Só para o apoio: posição no `apoioEspecial` da turma. */
  apoioIndice?: number;
  /** Só para o apoio: "Mediador(a)" ou "Cuidador(a)". */
  funcao?: string;
  entrouEm: string;
}

export function lerProfissionalSessao(): ProfissionalSessao | null {
  if (typeof window === "undefined") return null;
  try {
    const bruto = window.sessionStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as ProfissionalSessao) : null;
  } catch {
    return null;
  }
}

export function iniciarProfissionalSessao(sessao: Omit<ProfissionalSessao, "entrouEm">): void {
  if (typeof window === "undefined") return;
  const completa: ProfissionalSessao = { ...sessao, entrouEm: new Date().toISOString() };
  window.sessionStorage.setItem(CHAVE, JSON.stringify(completa));
}

export function encerrarProfissionalSessao(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(CHAVE);
}

/** A sessão atual é do professor regente desta turma? */
export function temSessaoDeProfessor(turmaId: string): boolean {
  const sessao = lerProfissionalSessao();
  return sessao?.tipo === "professor" && sessao.turmaId === turmaId;
}

/** A sessão atual é deste mediador/cuidador desta turma? */
export function temSessaoDeApoio(turmaId: string, apoioIndice: number): boolean {
  const sessao = lerProfissionalSessao();
  return (
    sessao?.tipo === "apoio" && sessao.turmaId === turmaId && sessao.apoioIndice === apoioIndice
  );
}
