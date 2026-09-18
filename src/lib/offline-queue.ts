/**
 * Fila de operações feitas sem internet.
 *
 * O laboratório não pode parar quando a rede cai: toda gravação de
 * frequência que falhar é guardada no próprio navegador e reenviada assim
 * que a conexão voltar (evento `online` ou nova tentativa manual).
 */

const FILA_KEY = "informatica:fila-offline";

export interface OperacaoPendente {
  id: string;
  tipo: string;
  payload: unknown;
  criadoEm: string;
}

function temStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function lerFila(): OperacaoPendente[] {
  if (!temStorage()) return [];
  try {
    const bruto = window.localStorage.getItem(FILA_KEY);
    const dados: unknown = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(dados) ? (dados as OperacaoPendente[]) : [];
  } catch {
    return [];
  }
}

function gravarFila(fila: OperacaoPendente[]): void {
  if (!temStorage()) return;
  try {
    window.localStorage.setItem(FILA_KEY, JSON.stringify(fila));
  } catch {
    // Armazenamento cheio ou bloqueado: nada a fazer além de seguir em frente.
  }
}

export function enfileirar(tipo: string, payload: unknown): void {
  const fila = lerFila();
  fila.push({
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    tipo,
    payload,
    criadoEm: new Date().toISOString(),
  });
  gravarFila(fila);
}

export function totalPendente(): number {
  return lerFila().length;
}

/**
 * Reenvia tudo o que está na fila. Operações que falharem de novo
 * permanecem guardadas para a próxima tentativa.
 */
export async function processarFila(
  executor: (operacao: OperacaoPendente) => Promise<void>,
): Promise<{ enviadas: number; restantes: number }> {
  const fila = lerFila();
  if (fila.length === 0) return { enviadas: 0, restantes: 0 };

  const restantes: OperacaoPendente[] = [];
  let enviadas = 0;
  for (const operacao of fila) {
    try {
      await executor(operacao);
      enviadas += 1;
    } catch {
      restantes.push(operacao);
    }
  }
  gravarFila(restantes);
  return { enviadas, restantes: restantes.length };
}

/** Cache simples de leitura, para a tela continuar mostrando dados sem rede. */
export function lerCache<T>(chave: string): T | null {
  if (!temStorage()) return null;
  try {
    const bruto = window.localStorage.getItem(`informatica:cache:${chave}`);
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch {
    return null;
  }
}

export function gravarCache(chave: string, valor: unknown): void {
  if (!temStorage()) return;
  try {
    window.localStorage.setItem(`informatica:cache:${chave}`, JSON.stringify(valor));
  } catch {
    // ignorado
  }
}
