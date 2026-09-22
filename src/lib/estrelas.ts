import { lerAlunoSessao } from "@/lib/aluno-session";
import { salvarPlacar } from "@/lib/placares";
import { registrarPasso } from "@/lib/trilha-aluno";

/**
 * Estrelas: a moeda única da Sala de Jogos.
 *
 * Cada jogo tem sua própria maneira de ganhar — dar xeque-mate na velha,
 * limpar a mesa no dominó, achar todos os pares —, mas todos pagam na mesma
 * moeda. Assim a criança compara o que fez na semana sem precisar entender
 * seis sistemas de ponto, e o ranking da escola soma tudo num número só.
 *
 * Quanto vale:
 *
 * - vitória contra o computador vale mais quanto mais difícil o nível;
 * - vitória contra o colega vale igual para os dois times, porque não dá para
 *   saber quem realmente jogou melhor numa partida só;
 * - empate também dá estrela: na velha contra o computador difícil, empatar
 *   é o melhor resultado possível.
 *
 * Quem está logado tem as estrelas gravadas na trilha e no ranking da escola.
 * Quem não está joga igual — só não entra no ranking.
 */

export type Resultado = "vitoria" | "empate" | "derrota";
export type Adversario = "computador" | "colega";

export interface Partida {
  jogo: string;
  titulo: string;
  resultado: Resultado;
  adversario: Adversario;
  /** 1 = fácil, 2 = médio, 3 = difícil. Sem nível, use 2. */
  nivel?: number;
  /** Quanto durou, em segundos — vai para a trilha do aluno. */
  segundos?: number;
}

export function estrelasDe(p: Partida): number {
  if (p.resultado === "derrota") return 0;
  const nivel = p.nivel ?? 2;
  if (p.adversario === "colega") {
    // Partida entre colegas não tem dificuldade medida: vale um valor fixo,
    // para ninguém "fazer fazenda de estrelas" combinando vitórias.
    return p.resultado === "vitoria" ? 2 : 1;
  }
  if (p.resultado === "empate") return nivel >= 3 ? 2 : 1;
  return nivel >= 3 ? 5 : nivel === 2 ? 3 : 2;
}

const CHAVE_LOCAL = "infoteca:estrelas";

interface Carteira {
  total: number;
  porJogo: Record<string, { estrelas: number; vitorias: number; partidas: number }>;
}

function vazia(): Carteira {
  return { total: 0, porJogo: {} };
}

export function lerCarteira(): Carteira {
  try {
    const bruto = window.localStorage.getItem(CHAVE_LOCAL);
    return bruto ? (JSON.parse(bruto) as Carteira) : vazia();
  } catch {
    return vazia();
  }
}

function gravarCarteira(c: Carteira) {
  try {
    window.localStorage.setItem(CHAVE_LOCAL, JSON.stringify(c));
  } catch {
    // Sem storage: as estrelas valem só para esta visita.
  }
}

/**
 * Fecha uma partida: soma as estrelas, guarda no navegador e — se a criança
 * estiver logada — manda para a trilha dela e para o ranking da escola.
 *
 * Nunca lança: perder a conexão no fim de um jogo não pode estragar a
 * comemoração.
 */
export async function registrarPartida(p: Partida): Promise<number> {
  const ganhas = estrelasDe(p);

  const carteira = lerCarteira();
  const atual = carteira.porJogo[p.jogo] ?? { estrelas: 0, vitorias: 0, partidas: 0 };
  atual.estrelas += ganhas;
  atual.partidas += 1;
  if (p.resultado === "vitoria") atual.vitorias += 1;
  carteira.porJogo[p.jogo] = atual;
  carteira.total += ganhas;
  gravarCarteira(carteira);

  const sessao = lerAlunoSessao();
  if (!sessao) return ganhas;

  try {
    await registrarPasso(sessao.alunoId, sessao.turmaId, sessao.pin, {
      ferramenta: p.jogo,
      titulo: p.titulo,
      tipo: "pontuou",
      pontos: ganhas,
      acertos: p.resultado === "vitoria" ? 1 : 0,
      total: 1,
      ...(p.segundos !== undefined ? { segundos: p.segundos } : {}),
    });
    // No ranking da escola entra só o que rendeu estrela. Gravar derrota
    // também encheria a tabela de linha zerada e não mudaria posição
    // nenhuma — e a tentativa já fica registrada na trilha do aluno.
    if (ganhas === 0) return ganhas;
    await salvarPlacar({
      jogo: `sala-de-jogos`,
      aluno: sessao.nome.split(" ")[0] ?? sessao.nome,
      turma: "",
      pontos: ganhas,
      acertos: p.resultado === "vitoria" ? 1 : 0,
      total: 1,
      nivel: p.titulo,
      segundos: p.segundos ?? 0,
    });
  } catch {
    // Já está tudo guardado no navegador; o resto é bônus.
  }
  return ganhas;
}

export interface LinhaRanking {
  aluno: string;
  estrelas: number;
  partidas: number;
}

/** Soma as estrelas de cada criança — é o ranking que a Sala de Jogos mostra. */
export function somarPorAluno(placares: { aluno: string; pontos: number }[]): LinhaRanking[] {
  const mapa = new Map<string, LinhaRanking>();
  for (const p of placares) {
    const atual = mapa.get(p.aluno) ?? { aluno: p.aluno, estrelas: 0, partidas: 0 };
    atual.estrelas += p.pontos;
    atual.partidas += 1;
    mapa.set(p.aluno, atual);
  }
  return [...mapa.values()].sort((a, b) => b.estrelas - a.estrelas);
}
