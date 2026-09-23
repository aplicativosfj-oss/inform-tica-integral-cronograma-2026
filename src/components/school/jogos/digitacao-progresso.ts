import { lerAlunoSessao } from "@/lib/aluno-session";
import { registrarPartida, type Adversario } from "@/lib/estrelas";
import { salvarPlacar } from "@/lib/placares";
import { registrarPasso } from "@/lib/trilha-aluno";

/**
 * Progresso da criança no jogo de digitação.
 *
 * Logada, o progresso fica no localStorage sob o id do aluno — volta no dia
 * seguinte — e cada fase concluída vai para a trilha, para as estrelas e para
 * o ranking de digitação da escola. Sem login, o progresso vale só para a aba
 * (sessionStorage): num computador compartilhado, o avanço de uma criança não
 * pode aparecer para a próxima.
 */

export interface ResultadoFase {
  estrelas: number;
  ppm: number;
  precisao: number;
  pontos: number;
  segundos: number;
  acertos: number;
  erros: number;
}

export interface Progresso {
  fases: Record<
    string,
    { estrelas: number; melhorPpm: number; melhorPrecisao: number; vezes: number }
  >;
  licoes: Record<string, boolean>;
  teoria: boolean;
  desafios: number;
  melhorDesafioPpm: number;
}

const VAZIO: Progresso = { fases: {}, licoes: {}, teoria: false, desafios: 0, melhorDesafioPpm: 0 };

function armazem(): { storage: Storage; chave: string } | null {
  if (typeof window === "undefined") return null;
  const sessao = lerAlunoSessao();
  try {
    return sessao
      ? { storage: window.localStorage, chave: `infoteca:digitacao:${sessao.alunoId}` }
      : { storage: window.sessionStorage, chave: "infoteca:digitacao:anonimo" };
  } catch {
    return null;
  }
}

export function lerProgresso(): Progresso {
  const a = armazem();
  if (!a) return { ...VAZIO, fases: {}, licoes: {} };
  try {
    const bruto = a.storage.getItem(a.chave);
    if (bruto) return { ...VAZIO, ...(JSON.parse(bruto) as Progresso) };
  } catch {
    // Dado corrompido: recomeça do zero, sem quebrar o jogo.
  }
  return { ...VAZIO, fases: {}, licoes: {} };
}

function gravar(p: Progresso) {
  const a = armazem();
  if (!a) return;
  try {
    a.storage.setItem(a.chave, JSON.stringify(p));
  } catch {
    // Sem storage: vale só nesta visita.
  }
}

export function marcarTeoria(): Progresso {
  const p = lerProgresso();
  p.teoria = true;
  gravar(p);
  return p;
}

export function marcarLicao(id: string): Progresso {
  const p = lerProgresso();
  p.licoes[id] = true;
  gravar(p);
  return p;
}

/** Estrelas por precisão: 95% ou mais são três; abaixo de 70% não passa. */
export function estrelasPorPrecisao(precisao: number): number {
  return precisao >= 95 ? 3 : precisao >= 85 ? 2 : precisao >= 70 ? 1 : 0;
}

/**
 * Fecha uma fase: guarda o melhor resultado e, se a criança está logada, manda
 * para a trilha e para o ranking. Estrelas de verdade (carteira e ranking da
 * Sala de Jogos) só saem quando a fase melhora — refazer a mesma fase não vira
 * "fazenda de estrelas", mas continua aparecendo na trilha.
 */
export async function concluirFase(
  id: string,
  titulo: string,
  r: ResultadoFase,
  nivel: number,
  adversario: Adversario,
): Promise<{ progresso: Progresso; estrelasGanhas: number; recorde: boolean }> {
  const p = lerProgresso();
  const anterior = p.fases[id];
  const melhorou = !anterior || r.estrelas > anterior.estrelas;
  p.fases[id] = {
    estrelas: Math.max(anterior?.estrelas ?? 0, r.estrelas),
    melhorPpm: Math.max(anterior?.melhorPpm ?? 0, r.ppm),
    melhorPrecisao: Math.max(anterior?.melhorPrecisao ?? 0, r.precisao),
    vezes: (anterior?.vezes ?? 0) + 1,
  };
  gravar(p);

  let estrelasGanhas = 0;
  const sessao = lerAlunoSessao();
  if (r.estrelas > 0 && melhorou) {
    estrelasGanhas = await registrarPartida({
      jogo: "digitacao",
      titulo: `Digitação · ${titulo}`,
      resultado: "vitoria",
      adversario,
      nivel: Math.min(nivel, 2),
      segundos: r.segundos,
    });
  } else if (sessao) {
    await registrarPasso(sessao.alunoId, sessao.turmaId, sessao.pin, {
      ferramenta: "digitacao",
      titulo: `Digitação · ${titulo}`,
      tipo: "concluiu",
      acertos: r.acertos,
      total: r.acertos + r.erros,
      segundos: r.segundos,
    });
  }
  if (sessao && r.estrelas > 0) {
    void salvarPlacar({
      jogo: "digitacao",
      aluno: sessao.nome.split(" ")[0] ?? sessao.nome,
      turma: "",
      pontos: r.pontos,
      acertos: r.acertos,
      total: r.acertos + r.erros,
      nivel: `${titulo} · ${r.ppm} ppm`,
      segundos: r.segundos,
    });
  }
  return { progresso: p, estrelasGanhas, recorde: melhorou && r.estrelas > 0 };
}

/** Desafio contra o robô: conta como partida e guarda o melhor ritmo. */
export async function concluirDesafio(
  r: ResultadoFase,
  venceu: boolean,
  nivel: number,
  adversario: Adversario,
): Promise<{ progresso: Progresso; estrelasGanhas: number }> {
  const p = lerProgresso();
  p.desafios += 1;
  p.melhorDesafioPpm = Math.max(p.melhorDesafioPpm, r.ppm);
  gravar(p);
  const estrelasGanhas = await registrarPartida({
    jogo: "digitacao",
    titulo: "Digitação · Desafio contra o robô",
    resultado: venceu ? "vitoria" : "derrota",
    adversario,
    nivel,
    segundos: r.segundos,
  });
  const sessao = lerAlunoSessao();
  if (sessao && r.estrelas > 0) {
    void salvarPlacar({
      jogo: "digitacao",
      aluno: sessao.nome.split(" ")[0] ?? sessao.nome,
      turma: "",
      pontos: r.pontos,
      acertos: r.acertos,
      total: r.acertos + r.erros,
      nivel: `Desafio · ${r.ppm} ppm`,
      segundos: r.segundos,
    });
  }
  return { progresso: p, estrelasGanhas };
}
