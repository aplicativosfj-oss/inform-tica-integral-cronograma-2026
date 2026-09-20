import { useState } from "react";

import { Quiz, type Questao } from "@/components/school/ferramentas/quiz";

function letraGrande(letra: string) {
  return (
    <span className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-5xl font-bold text-primary">
      {letra}
    </span>
  );
}

const QUESTOES: Questao[] = [
  {
    id: "alfa-1",
    enunciado: "Qual dessas letras é uma vogal?",
    opcoes: ["B", "E", "T", "M"],
    respostaCorreta: 1,
    explicacao: "As vogais são: A, E, I, O, U. As demais letras são consoantes.",
  },
  {
    id: "alfa-2",
    enunciado: "Qual dessas letras é uma consoante?",
    opcoes: ["A", "I", "P", "U"],
    respostaCorreta: 2,
  },
  {
    id: "alfa-3",
    enunciado: "Quantas sílabas tem a palavra BO-LA?",
    opcoes: ["1", "2", "3", "4"],
    respostaCorreta: 1,
  },
  {
    id: "alfa-4",
    enunciado: "Quantas sílabas tem a palavra CA-CHOR-RO?",
    opcoes: ["2", "3", "4", "5"],
    respostaCorreta: 1,
  },
  {
    id: "alfa-5",
    enunciado: "Quantas sílabas tem a palavra BO-NE-CA?",
    opcoes: ["2", "3", "4", "1"],
    respostaCorreta: 1,
  },
  {
    id: "alfa-6",
    enunciado: "Qual sílaba completa a palavra CA _ RRO (o animal de estimação que late)?",
    opcoes: ["CHO", "BE", "LO", "TA"],
    respostaCorreta: 0,
    explicacao: "CA + CHO + RRO = CACHORRO.",
  },
  {
    id: "alfa-7",
    enunciado: "Qual sílaba completa a palavra _ _ SA (onde a gente mora)?",
    opcoes: ["CA", "ME", "PA", "RO"],
    respostaCorreta: 0,
    explicacao: "CA + SA = CASA.",
  },
  {
    id: "alfa-8",
    enunciado: "Qual é a letra minúscula correspondente a 'B'?",
    ilustracao: letraGrande("B"),
    opcoes: ["b", "d", "p", "q"],
    respostaCorreta: 0,
  },
  {
    id: "alfa-9",
    enunciado: "Qual é a letra maiúscula correspondente a 'm'?",
    ilustracao: letraGrande("m"),
    opcoes: ["N", "W", "M", "H"],
    respostaCorreta: 2,
  },
  {
    id: "alfa-10",
    enunciado: "Qual palavra rima com 'GATO'?",
    opcoes: ["Pato", "Cadeira", "Janela", "Livro"],
    respostaCorreta: 0,
    explicacao: "GATO e PATO terminam com o mesmo som: -ATO.",
  },
  {
    id: "alfa-11",
    enunciado: "Qual palavra rima com 'PÃO'?",
    opcoes: ["Mesa", "Coração", "Flor", "Sol"],
    respostaCorreta: 1,
  },
  {
    id: "alfa-12",
    enunciado: "Depois da letra 'F', vem qual letra no alfabeto?",
    opcoes: ["E", "G", "H", "D"],
    respostaCorreta: 1,
  },
  {
    id: "alfa-13",
    enunciado: "Qual dessas palavras começa com a mesma letra de 'ABELHA'?",
    opcoes: ["Bola", "Anel", "Casa", "Dado"],
    respostaCorreta: 1,
  },
  {
    id: "alfa-14",
    enunciado: "Quantas letras tem a palavra 'SOL'?",
    opcoes: ["2", "3", "4", "5"],
    respostaCorreta: 1,
  },
];

export function Alfabetizacao() {
  const [questoes] = useState(() => QUESTOES);
  return <Quiz questoes={questoes} />;
}
