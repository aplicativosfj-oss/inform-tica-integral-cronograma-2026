import { useState } from "react";

import { Quiz, type Questao } from "@/components/school/ferramentas/quiz";

const QUESTOES: Questao[] = [
  {
    id: "data-1",
    enunciado: "Em que dia comemoramos a Independência do Brasil?",
    opcoes: ["7 de setembro", "15 de novembro", "21 de abril", "12 de outubro"],
    respostaCorreta: 0,
  },
  {
    id: "data-2",
    enunciado: "O Dia das Crianças é comemorado em:",
    opcoes: ["1º de junho", "12 de outubro", "25 de dezembro", "1º de maio"],
    respostaCorreta: 1,
  },
  {
    id: "data-3",
    enunciado: "A Proclamação da República do Brasil é lembrada em:",
    opcoes: ["7 de setembro", "21 de abril", "15 de novembro", "1º de janeiro"],
    respostaCorreta: 2,
  },
  {
    id: "data-4",
    enunciado: "Tiradentes, mártir da Inconfidência Mineira, é homenageado em:",
    opcoes: ["21 de abril", "19 de abril", "1º de maio", "7 de setembro"],
    respostaCorreta: 0,
  },
  {
    id: "data-5",
    enunciado: "O Dia do Professor é comemorado em:",
    opcoes: ["15 de outubro", "5 de outubro", "12 de outubro", "1º de outubro"],
    respostaCorreta: 0,
  },
  {
    id: "data-6",
    enunciado: "O Dia do Trabalhador é comemorado em:",
    opcoes: ["1º de maio", "1º de junho", "1º de julho", "1º de agosto"],
    respostaCorreta: 0,
  },
  {
    id: "data-7",
    enunciado: "As festas juninas, com quadrilha e comidas típicas, são mais celebradas em:",
    opcoes: ["Janeiro", "Junho", "Setembro", "Dezembro"],
    respostaCorreta: 1,
    explicacao: "Junho é o mês de São João, São Pedro e Santo Antônio — as festas juninas.",
  },
  {
    id: "data-8",
    enunciado: "O aniversário de fundação do município de Feijó é comemorado em:",
    opcoes: ["21 de dezembro", "7 de setembro", "15 de agosto", "1º de janeiro"],
    respostaCorreta: 0,
    explicacao: "Feijó foi fundado em 21 de dezembro de 1938.",
  },
  {
    id: "data-9",
    enunciado: "O Natal, quando cristãos celebram o nascimento de Jesus, é em:",
    opcoes: ["24 de junho", "31 de outubro", "25 de dezembro", "6 de janeiro"],
    respostaCorreta: 2,
  },
  {
    id: "data-10",
    enunciado: "O Dia Mundial do Meio Ambiente é comemorado em:",
    opcoes: ["5 de junho", "22 de abril", "1º de setembro", "10 de dezembro"],
    respostaCorreta: 0,
  },
];

export function DatasComemorativas() {
  const [questoes] = useState(() => QUESTOES);
  return <Quiz questoes={questoes} />;
}
