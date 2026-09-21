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
  /**
   * Só para o apoio: aluno que ele está atendendo agora. Enquanto não há um
   * escolhido, as ferramentas ficam fechadas — é o que garante que tudo o
   * que for feito no atendimento caia na área daquela criança, e não num
   * espaço solto do profissional.
   */
  alunoAtendidoId?: string;
  alunoAtendidoNome?: string;
  /** Entrou pela senha mestra da coordenação do AEE, não pela própria senha. */
  viaCoordenacaoAEE?: string;
  entrouEm: string;
}

const CHAVE_AEE = "informatica:coordenacao-aee";

/** Coordenação do AEE autenticada nesta aba: abre qualquer área de apoio sem pedir senha de novo. */
export function lerSessaoAEE(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(CHAVE_AEE);
  } catch {
    return null;
  }
}

export function iniciarSessaoAEE(nome: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(CHAVE_AEE, nome);
}

export function encerrarSessaoAEE(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(CHAVE_AEE);
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

/** Marca (ou troca) o aluno que o profissional de apoio está atendendo. */
export function definirAlunoAtendido(alunoId: string, nome: string): void {
  const sessao = lerProfissionalSessao();
  if (!sessao || typeof window === "undefined") return;
  window.sessionStorage.setItem(
    CHAVE,
    JSON.stringify({ ...sessao, alunoAtendidoId: alunoId, alunoAtendidoNome: nome }),
  );
}

/** Encerra o atendimento atual, sem deslogar o profissional. */
export function limparAlunoAtendido(): void {
  const sessao = lerProfissionalSessao();
  if (!sessao || typeof window === "undefined") return;
  const { alunoAtendidoId: _id, alunoAtendidoNome: _nome, ...resto } = sessao;
  window.sessionStorage.setItem(CHAVE, JSON.stringify(resto));
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
