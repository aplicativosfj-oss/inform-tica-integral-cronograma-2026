import { useState, type ReactNode } from "react";

import { Quiz, type Questao } from "@/components/school/ferramentas/quiz";

interface FormaInfo {
  nome: string;
  lados: number;
  svg: (cor: string) => ReactNode;
}

const FORMAS: FormaInfo[] = [
  {
    nome: "Triângulo",
    lados: 3,
    svg: (cor) => (
      <svg width={100} height={90} viewBox="0 0 100 90">
        <polygon points="50,5 95,85 5,85" fill={cor} stroke="var(--color-border)" strokeWidth={2} />
      </svg>
    ),
  },
  {
    nome: "Quadrado",
    lados: 4,
    svg: (cor) => (
      <svg width={100} height={90} viewBox="0 0 100 90">
        <rect
          x="10"
          y="5"
          width="80"
          height="80"
          fill={cor}
          stroke="var(--color-border)"
          strokeWidth={2}
        />
      </svg>
    ),
  },
  {
    nome: "Retângulo",
    lados: 4,
    svg: (cor) => (
      <svg width={100} height={90} viewBox="0 0 100 90">
        <rect
          x="5"
          y="20"
          width="90"
          height="50"
          fill={cor}
          stroke="var(--color-border)"
          strokeWidth={2}
        />
      </svg>
    ),
  },
  {
    nome: "Círculo",
    lados: 0,
    svg: (cor) => (
      <svg width={100} height={90} viewBox="0 0 100 90">
        <circle cx="50" cy="45" r="40" fill={cor} stroke="var(--color-border)" strokeWidth={2} />
      </svg>
    ),
  },
  {
    nome: "Pentágono",
    lados: 5,
    svg: (cor) => (
      <svg width={100} height={90} viewBox="0 0 100 90">
        <polygon
          points="50,5 95,38 78,85 22,85 5,38"
          fill={cor}
          stroke="var(--color-border)"
          strokeWidth={2}
        />
      </svg>
    ),
  },
  {
    nome: "Hexágono",
    lados: 6,
    svg: (cor) => (
      <svg width={100} height={90} viewBox="0 0 100 90">
        <polygon
          points="30,5 70,5 95,45 70,85 30,85 5,45"
          fill={cor}
          stroke="var(--color-border)"
          strokeWidth={2}
        />
      </svg>
    ),
  },
];

const CORES = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#06b6d4"];

function embaralhar<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j]!, copia[i]!];
  }
  return copia;
}

function questaoIdentificar(forma: FormaInfo, cor: string, id: string): Questao {
  const outrasFormas = embaralhar(FORMAS.filter((f) => f.nome !== forma.nome)).slice(0, 3);
  const opcoes = embaralhar([forma.nome, ...outrasFormas.map((f) => f.nome)]);
  return {
    id,
    enunciado: "Que figura geométrica é essa?",
    ilustracao: forma.svg(cor),
    opcoes,
    respostaCorreta: opcoes.indexOf(forma.nome),
    explicacao:
      forma.lados === 0
        ? "O círculo não tem lados retos — é uma curva fechada."
        : `O ${forma.nome.toLowerCase()} tem ${forma.lados} lados.`,
  };
}

function questaoLados(forma: FormaInfo, cor: string, id: string): Questao {
  const opcoesNumericas = embaralhar(
    Array.from(
      new Set([forma.lados, forma.lados + 1, Math.max(0, forma.lados - 1), forma.lados + 2]),
    ),
  ).slice(0, 4);
  const opcoes = opcoesNumericas.map((n) => (n === 0 ? "Nenhum (é redondo)" : String(n)));
  const certa = forma.lados === 0 ? "Nenhum (é redondo)" : String(forma.lados);
  return {
    id,
    enunciado: `Quantos lados tem esta figura?`,
    ilustracao: forma.svg(cor),
    opcoes,
    respostaCorreta: opcoes.indexOf(certa),
  };
}

const CONCEITOS: Questao[] = [
  {
    id: "conceito-1",
    enunciado: "Qual dessas figuras tem todos os lados do mesmo tamanho e 4 ângulos retos?",
    opcoes: ["Quadrado", "Retângulo", "Triângulo", "Círculo"],
    respostaCorreta: 0,
    explicacao:
      "O retângulo também tem 4 ângulos retos, mas nem sempre os 4 lados iguais — o quadrado sim.",
  },
  {
    id: "conceito-2",
    enunciado: "Uma figura com 3 lados e 3 ângulos se chama:",
    opcoes: ["Pentágono", "Triângulo", "Hexágono", "Quadrado"],
    respostaCorreta: 1,
  },
  {
    id: "conceito-3",
    enunciado: "Uma bola de futebol tem o formato mais parecido com:",
    opcoes: ["Quadrado", "Triângulo", "Esfera (círculo em 3D)", "Retângulo"],
    respostaCorreta: 2,
  },
];

function gerarQuestoes(): Questao[] {
  const geradas: Questao[] = [];
  const formasEmbaralhadas = embaralhar(FORMAS);
  formasEmbaralhadas.forEach((forma, i) => {
    const cor = CORES[i % CORES.length]!;
    geradas.push(questaoIdentificar(forma, cor, `identificar-${i}`));
  });
  const maisFormas = embaralhar(FORMAS).slice(0, 3);
  maisFormas.forEach((forma, i) => {
    const cor = CORES[(i + 2) % CORES.length]!;
    geradas.push(questaoLados(forma, cor, `lados-${i}`));
  });
  return embaralhar([...geradas, ...CONCEITOS]);
}

export function Geometria() {
  const [questoes] = useState(gerarQuestoes);
  return <Quiz questoes={questoes} />;
}
