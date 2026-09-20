import { useState } from "react";

import { Quiz, type Questao } from "@/components/school/ferramentas/quiz";

const QUESTOES: Questao[] = [
  {
    id: "geo-1",
    enunciado: "Em qual continente fica o Brasil?",
    opcoes: ["América do Sul", "África", "Europa", "Ásia"],
    respostaCorreta: 0,
  },
  {
    id: "geo-2",
    enunciado: "Qual é a capital do Brasil?",
    opcoes: ["Rio de Janeiro", "Brasília", "São Paulo", "Manaus"],
    respostaCorreta: 1,
  },
  {
    id: "geo-3",
    enunciado: "O Brasil é dividido em quantas regiões?",
    opcoes: ["3", "5", "7", "10"],
    respostaCorreta: 1,
    explicacao: "Norte, Nordeste, Centro-Oeste, Sudeste e Sul.",
  },
  {
    id: "geo-4",
    enunciado: "O estado do Acre fica em qual região do Brasil?",
    opcoes: ["Nordeste", "Sul", "Norte", "Sudeste"],
    respostaCorreta: 2,
  },
  {
    id: "geo-5",
    enunciado: "Qual é a capital do estado do Acre?",
    opcoes: ["Feijó", "Rio Branco", "Cruzeiro do Sul", "Tarauacá"],
    respostaCorreta: 1,
  },
  {
    id: "geo-6",
    enunciado: "O Acre faz fronteira com quais países?",
    opcoes: ["Argentina e Chile", "Peru e Bolívia", "Colômbia e Venezuela", "Paraguai e Uruguai"],
    respostaCorreta: 1,
  },
  {
    id: "geo-7",
    enunciado: "Qual bioma (tipo de natureza) predomina no Acre?",
    opcoes: ["Caatinga", "Floresta Amazônica", "Pampa", "Cerrado"],
    respostaCorreta: 1,
  },
  {
    id: "geo-8",
    enunciado:
      "O município de Feijó está localizado em qual vale (região próxima a um rio importante)?",
    opcoes: ["Vale do Juruá", "Vale do São Francisco", "Vale do Paraíba", "Vale do Amazonas"],
    respostaCorreta: 0,
    explicacao: "Feijó fica na zona fisiográfica do vale do Juruá, às margens do rio Envira.",
  },
  {
    id: "geo-9",
    enunciado: "Com qual estado brasileiro Feijó faz divisa ao norte?",
    opcoes: ["Amazonas", "Rondônia", "Mato Grosso", "Pará"],
    respostaCorreta: 0,
  },
  {
    id: "geo-10",
    enunciado:
      "Muitas famílias de Feijó vivem às margens do rio Envira — como são chamadas as pessoas que moram assim, perto dos rios?",
    opcoes: ["Ribeirinhos", "Sertanejos", "Caiçaras", "Pantaneiros"],
    respostaCorreta: 0,
  },
  {
    id: "geo-11",
    enunciado: "Qual é o maior país da América do Sul em área e população?",
    opcoes: ["Argentina", "Brasil", "Peru", "Chile"],
    respostaCorreta: 1,
  },
  {
    id: "geo-12",
    enunciado: "A Floresta Amazônica é considerada:",
    opcoes: [
      "A menor floresta tropical do mundo",
      "A maior floresta tropical do mundo",
      "Um deserto",
      "Uma savana",
    ],
    respostaCorreta: 1,
  },
];

export function Geografia() {
  const [questoes] = useState(() => QUESTOES);
  return <Quiz questoes={questoes} />;
}
