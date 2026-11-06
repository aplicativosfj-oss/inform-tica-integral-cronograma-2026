import { useMemo } from "react";

import { rotuloTurma } from "@/components/school/laboratorio/ficha-aluno";
import { useAppStore } from "@/lib/app-store";
import {
  agruparSessoes,
  estadoDaSessao,
  hojeNaEscola,
  nomeExibido,
  useAgora,
  type SessaoLab,
} from "@/lib/laboratorio";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";
import { cn } from "@/lib/utils";

interface Nome {
  chave: string;
  nome: string;
  turma: string;
}

/**
 * Faixa de nomes da abertura da página inicial: uma esteira contínua, numa
 * faixa própria (nada fica atrás de cartões), com a turma de cada aluno.
 *
 * - Com aula acontecendo: só quem está no laboratório agora.
 * - Com aula marcada para depois: quem vai na próxima.
 * - Sem aula: uma seleção de alunos de todas as turmas.
 *
 * Para de andar com "reduzir movimento" e ao passar o mouse.
 */
export function FaixaNomesHome({ sessoes, logado }: { sessoes: SessaoLab[]; logado: boolean }) {
  const { turmas } = useAppStore();
  const agora = useAgora(15_000);
  const hoje = hojeNaEscola();

  const grupos = agruparSessoes(sessoes.filter((s) => s.data === hoje));
  const vivo = grupos.filter((g) => estadoDaSessao(g, agora) === "ao-vivo");
  const proxima = grupos.find((g) => estadoDaSessao(g, agora) === "agendada");
  const modo: "vivo" | "proxima" | "todos" = vivo.length ? "vivo" : proxima ? "proxima" : "todos";

  const chaveAula = (vivo.length ? vivo : proxima ? [proxima] : []).map((g) => g.grupoId).join();
  const todos = useMemo<Nome[]>(() => {
    const lista = turmas.flatMap((t) =>
      t.alunos.map((a) => ({
        chave: `${t.id}:${a.id}`,
        nome: a.nome,
        turma: rotuloTurma(t.serie, t.letra),
      })),
    );
    // Ordem fixa por sessão, mas misturando as turmas.
    return lista
      .map((n, i) => ({ n, k: (i * 7919) % 9973 }))
      .sort((a, b) => a.k - b.k)
      .slice(0, 40)
      .map((x) => x.n);
  }, [turmas]);

  const nomes: Nome[] = useMemo(() => {
    if (modo === "todos") return todos;
    const doGrupo = (vivo.length ? vivo : proxima ? [proxima] : []).flatMap((g) =>
      g.alunos
        .filter((a) => a.ausencia === null)
        .map((a) => ({ chave: `${a.turmaId}:${a.id}`, nome: a.nome, turma: a.turmaRotulo })),
    );
    return doGrupo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, chaveAula, todos]);

  if (nomes.length === 0) return null;

  // Poucos nomes (uma turma no laboratório): ficam parados, cada um uma vez,
  // sem repetir. Muitos nomes: a esteira anda devagar (uns 28 px/s), cada
  // aluno aparece uma vez por volta, e a segunda cópia só fecha a emenda.
  const parado = nomes.length <= 10;
  const duracao = Math.max(90, nomes.length * 5.5);

  const legenda =
    modo === "vivo"
      ? "No laboratório agora"
      : modo === "proxima"
        ? "Próxima aula"
        : "Nossos alunos";

  return (
    <div
      data-constelacao-evitar
      className="home-ticker mt-6 flex items-stretch overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-xl sm:mt-8"
    >
      <span className="flex shrink-0 items-center gap-2 border-r border-white/10 bg-white/[0.06] px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/80 sm:px-4 sm:text-[11px]">
        <span className="relative flex size-2">
          {modo === "vivo" ? (
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
          ) : null}
          <span
            className={cn(
              "relative size-2 rounded-full",
              modo === "vivo" ? "bg-emerald-400" : modo === "proxima" ? "bg-sun" : "bg-white/60",
            )}
          />
        </span>
        <span className="hidden sm:inline">{legenda}</span>
        <span className="sm:hidden">
          {modo === "vivo" ? "Agora" : modo === "proxima" ? "Próxima" : "Alunos"}
        </span>
      </span>
      <div
        className={cn(
          "relative min-w-0 flex-1 py-2",
          parado ? "home-ticker-parado overflow-x-auto" : "home-ticker-janela overflow-hidden",
        )}
      >
        <div
          className={cn("flex w-max", parado ? "px-2" : "home-ticker-trilho")}
          style={parado ? undefined : { animationDuration: `${duracao}s` }}
        >
          {(parado ? [0] : [0, 1]).map((copia) => (
            <ul key={copia} aria-hidden={copia === 1} className="flex shrink-0 gap-2 pr-2">
              {nomes.map((n, i) => {
                const cor = serieClasses(serieIndexPorNumero(n.turma));
                const exibido = nomeExibido(n.nome, logado);
                const partes = exibido.trim().split(/\s+/);
                const curto =
                  partes.length > 2 ? `${partes[0]} ${partes[partes.length - 1]}` : exibido;
                return (
                  <li
                    key={`${n.chave}-${i}`}
                    className="flex items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.06] py-1 pl-1 pr-3"
                  >
                    <span
                      className={cn(
                        "grid size-6 place-items-center rounded-full text-[10px] font-extrabold",
                        cor.bg,
                        cor.text,
                      )}
                    >
                      {curto.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-[13px] font-semibold text-white">{curto}</span>
                    <span className="text-[11px] font-semibold text-white/50">{n.turma}</span>
                  </li>
                );
              })}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
