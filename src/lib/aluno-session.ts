/**
 * "Sessão" do aluno na Área do Aluno — não é autenticação de verdade (não há
 * senha de conta, só um PIN de 4 dígitos por aluno).
 *
 * A sessão fica no localStorage para sobreviver a uma aba fechada sem querer
 * (o aluno volta e continua conectado), mas vale só enquanto houver uso: 5
 * minutos sem nenhuma interação e ela expira sozinha. É isso que protege o
 * computador compartilhado do laboratório — quem esquece de sair é
 * desconectado, e quem fecha a aba sem querer não precisa refazer o login.
 */

const CHAVE = "informatica:aluno-sessao";
const CHAVE_LEMBRETE = "informatica:aluno-lembrete";

/** Tempo sem usar o sistema até a desconexão automática. */
export const INATIVIDADE_MS = 5 * 60 * 1000;

export interface AlunoSessao {
  alunoId: string;
  turmaId: string;
  nome: string;
  /**
   * PIN já conferido nesta sessão — guardado para provar identidade de novo
   * a cada leitura sensível (histórico, presenças, status de atividades),
   * já que o banco não confia mais só no `aluno_id` sozinho (ver
   * aluno-area.ts): sem o PIN certo, o Postgres recusa devolver os dados.
   */
  pin: string;
  verificadoEm: string;
  /** Última interação (ms desde 1970); base da expiração por inatividade. */
  ultimaAtividade?: number;
}

function ler(): AlunoSessao | null {
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as AlunoSessao) : null;
  } catch {
    return null;
  }
}

export function lerAlunoSessao(): AlunoSessao | null {
  if (typeof window === "undefined") return null;
  const sessao = ler();
  if (!sessao) return null;
  const ultima = sessao.ultimaAtividade ?? Date.parse(sessao.verificadoEm);
  if (!Number.isFinite(ultima) || Date.now() - ultima > INATIVIDADE_MS) {
    encerrarAlunoSessao();
    return null;
  }
  return sessao;
}

export function iniciarAlunoSessao(sessao: Omit<AlunoSessao, "verificadoEm">): void {
  if (typeof window === "undefined") return;
  const completa: AlunoSessao = {
    ...sessao,
    verificadoEm: new Date().toISOString(),
    ultimaAtividade: Date.now(),
  };
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(completa));
    window.sessionStorage.setItem(CHAVE_LEMBRETE, "1");
  } catch {
    // Sem storage: o aluno segue sem persistência entre abas.
  }
}

/** Marca "acabou de usar": renova os 5 minutos. Chamado pelas interações. */
export function registrarAtividadeAluno(): void {
  if (typeof window === "undefined") return;
  const sessao = ler();
  if (!sessao) return;
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify({ ...sessao, ultimaAtividade: Date.now() }));
  } catch {
    // ignora
  }
}

export function encerrarAlunoSessao(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CHAVE);
    window.sessionStorage.removeItem(CHAVE_LEMBRETE);
  } catch {
    // ignora
  }
}

/** True na primeira chamada em cada aba quando a sessão veio de uma aba anterior. */
export function precisaLembrarSessaoRestaurada(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.sessionStorage.getItem(CHAVE_LEMBRETE)) return false;
    window.sessionStorage.setItem(CHAVE_LEMBRETE, "1");
    return true;
  } catch {
    return false;
  }
}
