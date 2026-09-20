import { useState } from "react";

import { Quiz, type Questao } from "@/components/school/ferramentas/quiz";

const QUESTOES: Questao[] = [
  {
    id: "folk-1",
    enunciado: "Que personagem do folclore brasileiro tem uma perna só e fuma cachimbo?",
    opcoes: ["Saci-Pererê", "Curupira", "Boitatá", "Iara"],
    respostaCorreta: 0,
  },
  {
    id: "folk-2",
    enunciado: "Qual lenda fala de um protetor da floresta com os pés virados para trás?",
    opcoes: ["Mula-sem-cabeça", "Curupira", "Cuca", "Boto"],
    respostaCorreta: 1,
    explicacao:
      "O Curupira confunde caçadores porque suas pegadas parecem apontar para o caminho contrário.",
  },
  {
    id: "folk-3",
    enunciado: "A Iara é conhecida como:",
    opcoes: [
      "Uma cobra gigante",
      "Uma sereia dos rios que encanta com o canto",
      "Um pássaro de fogo",
      "Um cavalo sem cabeça",
    ],
    respostaCorreta: 1,
  },
  {
    id: "folk-4",
    enunciado: "No folclore da região amazônica (incluindo o Acre), o Caipora é conhecido como:",
    opcoes: [
      "O 'pai da mata', protetor dos animais da floresta",
      "Um tipo de peixe",
      "Uma dança típica",
      "Uma fruta regional",
    ],
    respostaCorreta: 0,
    explicacao:
      "Diz a lenda que caçadores devem oferecer tabaco ao Caipora quando o encontram na floresta.",
  },
  {
    id: "folk-5",
    enunciado: "O Boto Cor-de-Rosa, lenda muito contada na Amazônia, é descrito como um ser que:",
    opcoes: [
      "Vive nas montanhas",
      "Se transforma em um rapaz sedutor em festas à beira do rio",
      "É um pássaro que canta à noite",
      "Mora dentro das árvores",
    ],
    respostaCorreta: 1,
  },
  {
    id: "folk-6",
    enunciado: "O Mapinguari, uma das lendas do folclore acreano, é descrito como:",
    opcoes: [
      "Um espírito gigante e peludo da floresta",
      "Um pequeno duende travesso",
      "Uma fada da lua",
      "Um barco fantasma",
    ],
    respostaCorreta: 0,
  },
  {
    id: "folk-7",
    enunciado: "A Matinta Perera é uma lenda sobre:",
    opcoes: [
      "Uma senhora que se transforma em ave para assombrar as pessoas",
      "Um herói que salva vilarejos",
      "Uma árvore encantada",
      "Um tipo de comida típica",
    ],
    respostaCorreta: 0,
  },
  {
    id: "folk-8",
    enunciado:
      "Muitas lendas contadas no Acre, como o Lobisomem e a Mula-sem-cabeça, chegaram à região trazidas por:",
    opcoes: [
      "Imigrantes nordestinos que vieram trabalhar nos seringais",
      "Exploradores europeus do século XV",
      "Astronautas",
      "Comerciantes chineses",
    ],
    respostaCorreta: 0,
  },
  {
    id: "folk-9",
    enunciado: "O Boitatá, outra lenda brasileira, é geralmente descrito como:",
    opcoes: [
      "Uma cobra de fogo que protege as matas",
      "Um passarinho azul",
      "Um sapo gigante",
      "Uma fada boa",
    ],
    respostaCorreta: 0,
  },
  {
    id: "folk-10",
    enunciado:
      "Qual é a função das lendas folclóricas, como o Curupira e o Caipora, nas comunidades da floresta?",
    opcoes: [
      "Assustar turistas",
      "Ensinar, de forma simbólica, o respeito pela natureza",
      "Vender produtos",
      "Substituir as aulas de ciências",
    ],
    respostaCorreta: 1,
  },
];

export function Folclore() {
  const [questoes] = useState(() => QUESTOES);
  return <Quiz questoes={questoes} />;
}
