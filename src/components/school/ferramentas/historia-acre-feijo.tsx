import { useState } from "react";

import { Quiz, type Questao } from "@/components/school/ferramentas/quiz";

/**
 * Conteúdo baseado em fontes pesquisadas (Wikipédia, IBGE Cidades, prefeitura
 * de Feijó, Portal Acre) — não inventado. Ver conversa de criação desta
 * ferramenta para as fontes usadas.
 */
const QUESTOES: Questao[] = [
  {
    id: "hf-1",
    enunciado: "Em homenagem a quem o município de Feijó recebeu esse nome?",
    opcoes: [
      "Ao padre Diogo Antônio Feijó",
      "A um rio da região",
      "A um pássaro típico do Acre",
      "A um seringueiro famoso",
    ],
    respostaCorreta: 0,
    explicacao: "O nome é uma homenagem ao padre Diogo Antônio Feijó (1784–1843), adotado em 1906.",
  },
  {
    id: "hf-2",
    enunciado: "Em que ano o município de Feijó foi oficialmente fundado?",
    opcoes: ["1906", "1938", "1903", "1822"],
    respostaCorreta: 1,
    explicacao: "Feijó foi fundado em 21 de dezembro de 1938, pelo decreto nº 968.",
  },
  {
    id: "hf-3",
    enunciado: "Antes de se chamar Feijó, a região era conhecida como:",
    opcoes: ["Seringal Porto Alegre", "Vila Nova", "Colônia do Envira", "Porto Feijó"],
    respostaCorreta: 0,
    explicacao:
      "O Seringal Porto Alegre, às margens do rio Envira, deu origem ao município de Feijó.",
  },
  {
    id: "hf-4",
    enunciado: "Qual rio banha a cidade de Feijó?",
    opcoes: ["Rio Amazonas", "Rio Envira", "Rio São Francisco", "Rio Tejo"],
    respostaCorreta: 1,
  },
  {
    id: "hf-5",
    enunciado:
      "Em que ano começou a chegada de imigrantes nordestinos à região de Feijó, à foz do rio Envira?",
    opcoes: ["1500", "1879", "1938", "1950"],
    respostaCorreta: 1,
  },
  {
    id: "hf-6",
    enunciado: "Antes da chegada dos nordestinos, quais povos já viviam nas terras de Feijó?",
    opcoes: [
      "Povos indígenas, como os Jaminauás",
      "Colonizadores espanhóis",
      "Ninguém vivia na região",
      "Imigrantes europeus",
    ],
    respostaCorreta: 0,
  },
  {
    id: "hf-7",
    enunciado: "O que foi a Revolução Acreana (1899–1903)?",
    opcoes: [
      "Uma disputa de futebol entre seringueiros",
      "O movimento que levou o território do Acre a se tornar parte do Brasil",
      "A fundação da cidade de Feijó",
      "Uma festa tradicional acreana",
    ],
    respostaCorreta: 1,
    explicacao:
      "Antes disso, pelo Tratado de Ayacucho (1867), a região do Acre era reconhecida como território boliviano.",
  },
  {
    id: "hf-8",
    enunciado:
      "Qual produto da floresta movimentou a economia do Acre durante o chamado 'ciclo da borracha'?",
    opcoes: ["Açaí", "Látex (borracha) da seringueira", "Madeira de lei", "Castanha"],
    respostaCorreta: 1,
  },
  {
    id: "hf-9",
    enunciado: "Qual acordo, em 1903, oficializou a incorporação do Acre ao Brasil?",
    opcoes: [
      "Tratado de Petrópolis",
      "Tratado de Tordesilhas",
      "Tratado de Ayacucho",
      "Acordo de Brasília",
    ],
    respostaCorreta: 0,
  },
  {
    id: "hf-10",
    enunciado: "Quem é um dos nomes mais lembrados na luta que tornou o Acre parte do Brasil?",
    opcoes: ["Plácido de Castro", "Tiradentes", "Dom Pedro I", "Zumbi dos Palmares"],
    respostaCorreta: 0,
  },
];

export function HistoriaAcreFeijo() {
  const [questoes] = useState(() => QUESTOES);
  return <Quiz questoes={questoes} />;
}
