/**
 * "Sessão" do aluno na Área do Aluno — não é autenticação de verdade (não há
 * senha de conta, só um PIN de 4 dígitos por aluno). Guardamos em
 * sessionStorage (não localStorage) de propósito: em computador
 * compartilhado do laboratório ou da casa de um coleguinha, a sessão some ao
 * fechar a aba, em vez de continuar "logado" pro próximo que sentar ali.
 */

const CHAVE = "informatica:aluno-sessao";

export interface AlunoSessao {
  alunoId: string;
  turmaId: string;
  nome: string;
  verificadoEm: string;
}

export function lerAlunoSessao(): AlunoSessao | null {
  if (typeof window === "undefined") return null;
  try {
    const bruto = window.sessionStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as AlunoSessao) : null;
  } catch {
    return null;
  }
}

export function iniciarAlunoSessao(sessao: Omit<AlunoSessao, "verificadoEm">): void {
  if (typeof window === "undefined") return;
  const completa: AlunoSessao = { ...sessao, verificadoEm: new Date().toISOString() };
  window.sessionStorage.setItem(CHAVE, JSON.stringify(completa));
}

export function encerrarAlunoSessao(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(CHAVE);
}
