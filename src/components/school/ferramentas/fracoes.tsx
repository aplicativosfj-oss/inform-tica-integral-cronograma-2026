import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Quiz, type Questao } from "@/components/school/ferramentas/quiz";

/** Retângulo dividido em `total` partes iguais, com `pintadas` delas coloridas — a forma mais fácil de "ver" uma fração. */
function BarraFracao({ total, pintadas }: { total: number; pintadas: number }) {
  const largura = 240;
  const altura = 60;
  const largParte = largura / total;
  return (
    <svg width={largura} height={altura} viewBox={`0 0 ${largura} ${altura}`}>
      {Array.from({ length: total }, (_, i) => (
        <rect
          key={i}
          x={i * largParte}
          y={0}
          width={largParte}
          height={altura}
          fill={i < pintadas ? "var(--color-primary)" : "var(--color-muted)"}
          stroke="var(--color-border)"
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}

function aleatorio(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function embaralhar<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j]!, copia[i]!];
  }
  return copia;
}

function questaoVisual(id: string): Questao {
  const total = aleatorio(3, 8);
  const pintadas = aleatorio(1, total - 1);
  const certa = `${pintadas}/${total}`;
  const erradas = new Set<string>();
  while (erradas.size < 3) {
    const t = aleatorio(3, 8);
    const p = aleatorio(1, t - 1);
    const opcao = `${p}/${t}`;
    if (opcao !== certa) erradas.add(opcao);
  }
  const opcoes = embaralhar([certa, ...erradas]);
  return {
    id,
    enunciado: "Que fração da barra está pintada?",
    ilustracao: <BarraFracao total={total} pintadas={pintadas} />,
    opcoes,
    respostaCorreta: opcoes.indexOf(certa),
    explicacao: `${pintadas} de ${total} partes iguais estão pintadas: ${certa}.`,
  };
}

function questaoComparacao(id: string): Questao {
  const denom = aleatorio(2, 10);
  const a = aleatorio(1, denom - 1);
  let b = aleatorio(1, denom - 1);
  while (a === b) b = aleatorio(1, denom - 1);
  const maior = a > b ? `${a}/${denom}` : `${b}/${denom}`;
  const opcoes = embaralhar([`${a}/${denom}`, `${b}/${denom}`]);
  return {
    id,
    enunciado: `Qual fração é maior: ${a}/${denom} ou ${b}/${denom}?`,
    opcoes,
    respostaCorreta: opcoes.indexOf(maior),
    explicacao:
      "Com o mesmo denominador, é maior a fração que tem o numerador (número de cima) maior.",
  };
}

function questaoEquivalente(id: string): Questao {
  const base = aleatorio(2, 5);
  const fator = aleatorio(2, 3);
  const certa = `${base * fator}/${(base + 1) * fator}`;
  const original = `${base}/${base + 1}`;
  const erradas = new Set<string>();
  while (erradas.size < 3) {
    const f = aleatorio(1, base * fator + 3);
    const g = f + aleatorio(1, 4);
    const opcao = `${f}/${g}`;
    if (opcao !== certa) erradas.add(opcao);
  }
  const opcoes = embaralhar([certa, ...erradas]);
  return {
    id,
    enunciado: `Qual fração é equivalente a ${original}?`,
    opcoes,
    respostaCorreta: opcoes.indexOf(certa),
    explicacao: `Multiplicando o numerador e o denominador de ${original} por ${fator}, chegamos em ${certa}.`,
  };
}

function gerarQuestoes(): Questao[] {
  const geradores = [
    questaoVisual,
    questaoVisual,
    questaoVisual,
    questaoComparacao,
    questaoComparacao,
    questaoEquivalente,
    questaoEquivalente,
    questaoVisual,
  ];
  return geradores.map((gerar, i) => gerar(`fracao-${i}-${Date.now()}`));
}

export function Fracoes() {
  const [chave, setChave] = useState(0);
  const [questoes, setQuestoes] = useState(gerarQuestoes);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setQuestoes(gerarQuestoes());
            setChave((c) => c + 1);
          }}
        >
          Gerar novas perguntas
        </Button>
      </div>
      <Quiz key={chave} questoes={questoes} />
    </div>
  );
}
