import { memo, useEffect, useMemo, useRef, useState } from "react";

import { rotuloTurma } from "@/components/school/laboratorio/ficha-aluno";
import { useAppStore } from "@/lib/app-store";
import { nomeExibido } from "@/lib/laboratorio";

/** Cor de cada série (1º ao 5º ano). */
const COR_SERIE = ["#38bdf8", "#a78bfa", "#34d399", "#fbbf24", "#fb7185"];
/** Quanto tempo cada nome fica em destaque. */
const TEMPO_NOME = 6000;
/** Quantos nomes aparecem na fila "A seguir". */
const FILA_VISIVEL = 3;

interface Aluno {
  chave: string;
  nome: string;
  turma: string;
  cor: string;
}

function corDaTurma(rotulo: string) {
  const n = Number(rotulo.match(/\d+/)?.[0]);
  return COR_SERIE[(Number.isFinite(n) ? n - 1 : 0) % COR_SERIE.length]!;
}

function embaralhar<T>(lista: T[]): T[] {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Alunos ativos de todas as turmas, já com o nome no formato da vitrine (primeiro nome e inicial). */
function useAlunosDaVitrine() {
  const { turmas } = useAppStore();
  return useMemo(() => {
    const grupos = turmas
      .map((t) => {
        const rotulo = rotuloTurma(t.serie, t.letra);
        const alunos: Aluno[] = t.alunos
          .filter((a) => !a.situacao || a.situacao === "ativo")
          .map((a) => ({
            chave: `${t.id}|${a.id}`,
            nome: nomeExibido(a.nome, false),
            turma: rotulo,
            cor: corDaTurma(rotulo),
          }));
        return { rotulo, cor: corDaTurma(rotulo), alunos };
      })
      .filter((g) => g.alunos.length > 0)
      .sort((a, b) => a.rotulo.localeCompare(b.rotulo, "pt-BR", { numeric: true }));
    return { grupos, todos: grupos.flatMap((g) => g.alunos) };
  }, [turmas]);
}

/**
 * Destaque principal do descanso de tela: um aluno por vez num cartão fixo,
 * com revelação por máscara (sem flutuar pela tela), barra de tempo na cor
 * da série e a fila dos próximos nomes logo abaixo.
 */
export const VitrineNomes = memo(function VitrineNomes() {
  const { grupos, todos } = useAlunosDaVitrine();
  const assinatura = todos.map((a) => a.chave).join(",");
  const [fila, setFila] = useState<Aluno[]>([]);

  useEffect(() => {
    if (todos.length === 0) return;
    setFila(embaralhar(todos));
    const id = window.setInterval(() => {
      setFila((atual) => {
        const resto = atual.slice(1);
        return resto.length > FILA_VISIVEL ? resto : [...resto, ...embaralhar(todos)];
      });
    }, TEMPO_NOME);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assinatura]);

  const atual = fila[0];
  if (!atual) return null;
  const proximos = fila.slice(1, 1 + FILA_VISIVEL);

  return (
    <section aria-hidden className="vitrine-nomes" style={{ ["--cor" as string]: atual.cor }}>
      <header className="vitrine-cabecalho">
        <span className="vitrine-eyebrow">
          <span className="vitrine-ponto" /> Nossos alunos
        </span>
        <span className="vitrine-contagem">
          {todos.length} alunos · {grupos.length} turmas
        </span>
      </header>

      <div className="vitrine-destaque" key={atual.chave}>
        <span className="vitrine-turma">
          <span className="vitrine-turma-cor" />
          {atual.turma}
        </span>
        <p
          className="vitrine-nome"
          data-tamanho={atual.nome.length <= 16 ? "g" : atual.nome.length <= 24 ? "m" : "p"}
        >
          {atual.nome.split(" ").map((parte, i) => (
            <span key={i} className="vitrine-mascara">
              <span style={{ animationDelay: `${140 + i * 90}ms` }}>{parte}</span>
            </span>
          ))}
        </p>
        <span className="vitrine-tempo">
          <span style={{ animationDuration: `${TEMPO_NOME}ms` }} />
        </span>
      </div>

      <div className="vitrine-fila">
        <span className="vitrine-fila-titulo">A seguir</span>
        <ol>
          {proximos.map((a, i) => (
            <li key={a.chave} style={{ ["--cor" as string]: a.cor, animationDelay: `${i * 70}ms` }}>
              <span className="vitrine-fila-ponto" />
              <span className="vitrine-fila-nome">{a.nome}</span>
              <span className="vitrine-fila-turma">{a.turma}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
});

/** Faixa contínua com todas as turmas, em ordem, cada uma seguida dos seus alunos. */
/** Velocidade da faixa, em pixels por segundo (calma, dá para ler cada nome). */
const VELOCIDADE_FAIXA = 28;

export const FaixaTurmas = memo(function FaixaTurmas() {
  const { grupos, todos } = useAlunosDaVitrine();
  const bloco = useRef<HTMLDivElement>(null);
  const [duracao, setDuracao] = useState(todos.length * 8);
  // A duração sai da largura real da faixa, para a velocidade ficar sempre igual.
  useEffect(() => {
    const largura = bloco.current?.offsetWidth ?? 0;
    if (largura > 0) setDuracao(largura / VELOCIDADE_FAIXA);
  }, [todos.length]);
  if (todos.length === 0) return null;
  const conteudo = (
    <>
      {grupos.map((g) => (
        <span key={g.rotulo} className="faixa-grupo" style={{ ["--cor" as string]: g.cor }}>
          <span className="faixa-turma">{g.rotulo}</span>
          {g.alunos.map((a) => (
            <span key={a.chave} className="faixa-nome">
              {a.nome}
            </span>
          ))}
        </span>
      ))}
    </>
  );
  return (
    <div aria-hidden className="faixa-turmas">
      <div className="faixa-trilho" style={{ animationDuration: `${duracao}s` }}>
        <div ref={bloco} className="faixa-bloco">
          {conteudo}
        </div>
        <div className="faixa-bloco">{conteudo}</div>
      </div>
    </div>
  );
});
