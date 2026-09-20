import { useState } from "react";

import { Quiz, type Questao } from "@/components/school/ferramentas/quiz";

function trecho(texto: string) {
  return (
    <div className="rounded-lg bg-muted/60 p-3 text-left text-sm italic leading-relaxed text-foreground">
      {texto}
    </div>
  );
}

const QUESTOES: Questao[] = [
  {
    id: "genero-1",
    enunciado: "Que gênero textual é este trecho?",
    ilustracao: trecho(
      "Ingredientes: 2 xícaras de farinha, 1 xícara de açúcar, 3 ovos. Modo de preparo: misture tudo e leve ao forno por 40 minutos.",
    ),
    opcoes: ["Receita culinária", "Notícia", "Poema", "Carta"],
    respostaCorreta: 0,
  },
  {
    id: "genero-2",
    enunciado: "Que gênero textual é este trecho?",
    ilustracao: trecho(
      "Era uma vez uma raposa e um corvo. O corvo tinha um pedaço de queijo no bico. A raposa, cheia de fome, pensou em um plano para roubar o queijo com elogios.",
    ),
    opcoes: ["Notícia", "Fábula", "Bilhete", "Manual de instruções"],
    respostaCorreta: 1,
    explicacao:
      "Fábulas são histórias curtas, geralmente com animais, que terminam com uma lição de moral.",
  },
  {
    id: "genero-3",
    enunciado: "Que gênero textual é este trecho?",
    ilustracao: trecho(
      "Prefeitura anuncia reforma da escola municipal. As obras começam na próxima semana e devem durar dois meses, segundo a secretaria de educação.",
    ),
    opcoes: ["Poema", "Notícia", "Receita", "Conto de fadas"],
    respostaCorreta: 1,
  },
  {
    id: "genero-4",
    enunciado: "Que gênero textual é este trecho?",
    ilustracao: trecho("Chuva que cai, molha o chão. Vento que passa, balança o coração."),
    opcoes: ["Anúncio", "Bula de remédio", "Poema", "E-mail"],
    respostaCorreta: 2,
    explicacao:
      "Poemas costumam ter rimas e versos curtos, além de brincar com sons e sentimentos.",
  },
  {
    id: "genero-5",
    enunciado: "Que gênero textual é este trecho?",
    ilustracao: trecho("Oi, vó! Cheguei bem na casa da titia. Volto domingo. Beijos, Marina."),
    opcoes: ["Bilhete", "Notícia", "Receita", "Verbete de dicionário"],
    respostaCorreta: 0,
  },
  {
    id: "genero-6",
    enunciado: "Que gênero textual é este trecho?",
    ilustracao: trecho(
      "PROMOÇÃO! Leve 2 e pague 1 em todos os brinquedos. Só até domingo, não perca!",
    ),
    opcoes: ["Anúncio publicitário", "Fábula", "Carta formal", "Poema"],
    respostaCorreta: 0,
  },
  {
    id: "genero-7",
    enunciado: "Que gênero textual é este trecho?",
    ilustracao: trecho(
      "1. Encaixe a peça A na peça B. 2. Aperte os parafusos. 3. Verifique se a mesa está firme antes de usar.",
    ),
    opcoes: ["Manual de instruções", "Notícia", "Poema", "Bilhete"],
    respostaCorreta: 0,
  },
  {
    id: "genero-8",
    enunciado: "Que gênero textual é este trecho?",
    ilustracao: trecho(
      "Prezado senhor, venho por meio desta solicitar informações sobre o horário de funcionamento da biblioteca municipal.",
    ),
    opcoes: ["Carta formal", "Bilhete informal", "Fábula", "Anúncio"],
    respostaCorreta: 0,
    explicacao:
      "A linguagem formal ('Prezado senhor', 'venho por meio desta') é típica de cartas/e-mails formais.",
  },
];

export function GenerosTextuais() {
  const [questoes] = useState(() => QUESTOES);
  return <Quiz questoes={questoes} />;
}
