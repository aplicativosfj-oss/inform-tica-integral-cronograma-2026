import { useState } from "react";

import { Quiz, type Questao } from "@/components/school/ferramentas/quiz";

function Texto({ titulo, children }: { titulo: string; children: string }) {
  return (
    <div className="rounded-lg bg-muted/60 p-4 text-left">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {titulo}
      </p>
      <p className="text-sm leading-relaxed text-foreground">{children}</p>
    </div>
  );
}

const TEXTO_1 = (
  <Texto titulo="Texto 1 — O passeio ao rio">
    No sábado de manhã, Ana e seu irmão Caio foram com o avô até a beira do rio. O avô levou uma
    rede de pescar e um balde. Caio queria pescar um peixe grande, mas só conseguiu pegar dois
    peixinhos pequenos. Ana preferiu procurar conchas na areia e encontrou sete. Na volta para casa,
    o avô contou uma história sobre quando ele era criança e pescava no mesmo rio.
  </Texto>
);

const TEXTO_2 = (
  <Texto titulo="Texto 2 — A abelha e o mel (informativo)">
    As abelhas visitam as flores para coletar néctar, um líquido doce. Dentro da colmeia, elas
    transformam o néctar em mel, que serve de alimento para todas as abelhas durante o inverno. Além
    de produzir mel, as abelhas são muito importantes porque, ao voar de flor em flor, levam o pólen
    que ajuda as plantas a produzir frutos e sementes.
  </Texto>
);

const TEXTO_3 = (
  <Texto titulo="Texto 3 — Bilhete">
    Mãe, fui à casa da Júlia estudar para a prova de matemática. Chego antes das 18h. Deixei o
    macarrão pronto na panela, é só esquentar. Um beijo, Rafael.
  </Texto>
);

function gerarQuestoes(): Questao[] {
  return [
    {
      id: "l1-1",
      enunciado: "Quantos peixinhos Caio conseguiu pescar?",
      ilustracao: TEXTO_1,
      opcoes: ["Um", "Dois", "Sete", "Nenhum"],
      respostaCorreta: 1,
      explicacao:
        "Localizando a informação no texto: 'só conseguiu pegar dois peixinhos pequenos'.",
    },
    {
      id: "l1-2",
      enunciado: "O que Ana fez enquanto Caio pescava?",
      ilustracao: TEXTO_1,
      opcoes: [
        "Dormiu no carro",
        "Procurou conchas na areia",
        "Também pescou",
        "Ficou com medo do rio",
      ],
      respostaCorreta: 1,
    },
    {
      id: "l1-3",
      enunciado: "Por que o avô contou uma história na volta?",
      ilustracao: TEXTO_1,
      opcoes: [
        "Porque estava chovendo",
        "Porque ele também pescava naquele rio quando era criança",
        "Porque Caio pediu uma história de terror",
        "O texto não conta o motivo",
      ],
      respostaCorreta: 1,
      explicacao:
        "Essa é uma inferência simples: o avô lembrou da própria infância no mesmo lugar.",
    },
    {
      id: "l2-1",
      enunciado: "Qual é o assunto principal do texto 2?",
      ilustracao: TEXTO_2,
      opcoes: [
        "Como as abelhas fazem o mel e ajudam as plantas",
        "Como plantar flores em casa",
        "Os perigos de ser picado por uma abelha",
        "As diferentes cores das flores",
      ],
      respostaCorreta: 0,
    },
    {
      id: "l2-2",
      enunciado: "No texto, a palavra 'néctar' significa:",
      ilustracao: TEXTO_2,
      opcoes: [
        "Um tipo de abelha",
        "Um líquido doce das flores",
        "O nome da colmeia",
        "Uma doença das plantas",
      ],
      respostaCorreta: 1,
      explicacao: "O próprio texto explica: 'néctar, um líquido doce'.",
    },
    {
      id: "l2-3",
      enunciado: "Como as abelhas ajudam as plantas, segundo o texto?",
      ilustracao: TEXTO_2,
      opcoes: [
        "Elas regam as plantas",
        "Elas levam o pólen de flor em flor",
        "Elas protegem as plantas de outros insetos",
        "O texto não fala sobre isso",
      ],
      respostaCorreta: 1,
    },
    {
      id: "l3-1",
      enunciado: "Quem escreveu o bilhete?",
      ilustracao: TEXTO_3,
      opcoes: ["A mãe", "Rafael", "Júlia", "O avô"],
      respostaCorreta: 1,
    },
    {
      id: "l3-2",
      enunciado: "Onde Rafael foi?",
      ilustracao: TEXTO_3,
      opcoes: ["Para a escola", "Para a casa da Júlia", "Para o rio", "Para o mercado"],
      respostaCorreta: 1,
    },
    {
      id: "l3-3",
      enunciado: "O que a mãe de Rafael precisa fazer com o macarrão?",
      ilustracao: TEXTO_3,
      opcoes: [
        "Cozinhar do zero",
        "Só esquentar, pois já está pronto",
        "Jogar fora",
        "O bilhete não fala sobre o macarrão",
      ],
      respostaCorreta: 1,
      explicacao: "Informação explícita: 'Deixei o macarrão pronto na panela, é só esquentar.'",
    },
  ];
}

export function Leitura() {
  const [questoes] = useState(gerarQuestoes);
  return <Quiz questoes={questoes} />;
}
