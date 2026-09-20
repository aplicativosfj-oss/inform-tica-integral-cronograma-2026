import { useState } from "react";

import { Quiz, type Questao } from "@/components/school/ferramentas/quiz";

const QUESTOES: Questao[] = [
  {
    id: "hb-1",
    enunciado: "Em que ano os portugueses, liderados por Pedro Álvares Cabral, chegaram ao Brasil?",
    opcoes: ["1500", "1822", "1889", "1600"],
    respostaCorreta: 0,
  },
  {
    id: "hb-2",
    enunciado: "Quem eram os primeiros habitantes do Brasil, antes da chegada dos europeus?",
    opcoes: ["Os portugueses", "Os povos indígenas", "Os espanhóis", "Ninguém vivia aqui"],
    respostaCorreta: 1,
  },
  {
    id: "hb-3",
    enunciado: "Quem proclamou a Independência do Brasil, em 1822?",
    opcoes: ["Dom Pedro I", "Tiradentes", "Dom Pedro II", "Getúlio Vargas"],
    respostaCorreta: 0,
  },
  {
    id: "hb-4",
    enunciado: "A Lei Áurea, assinada pela Princesa Isabel em 1888, fez o quê?",
    opcoes: [
      "Criou a primeira escola do Brasil",
      "Aboliu (acabou com) a escravidão no Brasil",
      "Proclamou a República",
      "Mudou a capital do Brasil",
    ],
    respostaCorreta: 1,
  },
  {
    id: "hb-5",
    enunciado: "Em que ano foi proclamada a República no Brasil?",
    opcoes: ["1500", "1822", "1889", "1930"],
    respostaCorreta: 2,
  },
  {
    id: "hb-6",
    enunciado: "Qual é a capital do Brasil atualmente?",
    opcoes: ["Rio de Janeiro", "São Paulo", "Salvador", "Brasília"],
    respostaCorreta: 3,
    explicacao: "Brasília se tornou a capital em 1960. Antes, a capital era o Rio de Janeiro.",
  },
  {
    id: "hb-7",
    enunciado: "Tiradentes é lembrado na história do Brasil por:",
    opcoes: [
      "Ter sido o primeiro presidente",
      "Ter participado da Inconfidência Mineira, um movimento contra o domínio português",
      "Ter descoberto o Brasil",
      "Ter fundado Brasília",
    ],
    respostaCorreta: 1,
  },
  {
    id: "hb-8",
    enunciado: "Antes de virar república, como o Brasil era governado?",
    opcoes: [
      "Por um imperador (Império)",
      "Por um presidente eleito",
      "Por um rei da Espanha",
      "Não tinha governo",
    ],
    respostaCorreta: 0,
  },
];

export function HistoriaBrasil() {
  const [questoes] = useState(() => QUESTOES);
  return <Quiz questoes={questoes} />;
}
