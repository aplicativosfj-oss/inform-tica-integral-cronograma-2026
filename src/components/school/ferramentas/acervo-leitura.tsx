import { ArrowLeft, BookOpen, Printer } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface TextoAcervo {
  id: string;
  titulo: string;
  categoria: string;
  nivel: "1º ao 2º ano" | "3º ano" | "4º ao 5º ano";
  paragrafos: string[];
}

/** Textos autorais, escritos para este acervo — nenhum copiado de outra fonte. */
const TEXTOS: TextoAcervo[] = [
  {
    id: "t1",
    titulo: "O gato e o novelo",
    categoria: "Conto",
    nivel: "1º ao 2º ano",
    paragrafos: [
      "Bidu era um gato cinza que adorava brincar. Um dia, ele encontrou um novelo de lã na cesta de costura da vovó.",
      "Bidu empurrou o novelo com a patinha. A lã rolou pela sala inteira, passando embaixo da mesa e do sofá.",
      "No final, Bidu ficou todo enrolado na lã, parecendo um pacote de presente. A vovó riu muito e ajudou o gatinho a se soltar.",
    ],
  },
  {
    id: "t2",
    titulo: "Como as plantas bebem água",
    categoria: "Texto informativo",
    nivel: "1º ao 2º ano",
    paragrafos: [
      "As plantas têm raízes que ficam escondidas debaixo da terra. É por elas que a planta bebe água.",
      "A água sobe pelo caule, que é como um canudinho, até chegar nas folhas.",
      "Com a água e a luz do sol, a planta produz seu próprio alimento. Por isso é tão importante regar as plantinhas todos os dias.",
    ],
  },
  {
    id: "t3",
    titulo: "A formiga e a folha",
    categoria: "Fábula",
    nivel: "1º ao 2º ano",
    paragrafos: [
      "Uma formiguinha encontrou uma folha enorme, muito maior do que ela. Mesmo assim, decidiu carregá-la até o formigueiro.",
      "No caminho, outras formigas vieram ajudar. Juntas, ergueram a folha e caminharam em fila organizada.",
      "Sozinha, a formiga jamais conseguiria. Mas em equipe, o trabalho ficou fácil e ainda foi divertido.",
    ],
  },
  {
    id: "t4",
    titulo: "O dia de pescaria no Envira",
    categoria: "Nossa região",
    nivel: "3º ano",
    paragrafos: [
      "No sábado de manhã, Ana e seu irmão Caio foram com o avô até a beira do rio Envira, perto de Feijó. O avô levou uma rede de pescar e um balde.",
      "Caio queria pescar um peixe grande, mas só conseguiu pegar dois peixinhos pequenos. Ana preferiu procurar conchas na areia e encontrou sete.",
      "Na volta para casa, o avô contou que, quando era criança, também pescava no mesmo rio — e que muitas famílias ribeirinhas vivem da pesca até hoje.",
    ],
  },
  {
    id: "t5",
    titulo: "A abelha e o mel",
    categoria: "Texto informativo",
    nivel: "3º ano",
    paragrafos: [
      "As abelhas visitam as flores para coletar néctar, um líquido doce. Dentro da colmeia, elas transformam o néctar em mel, que serve de alimento para todas as abelhas durante o inverno.",
      "Além de produzir mel, as abelhas são muito importantes porque, ao voar de flor em flor, levam o pólen que ajuda as plantas a produzir frutos e sementes.",
      "Sem as abelhas, muitas frutas que comemos — como maçã, morango e melancia — teriam muito mais dificuldade para existir.",
    ],
  },
  {
    id: "t6",
    titulo: "Chuva de verão",
    categoria: "Poema",
    nivel: "1º ao 2º ano",
    paragrafos: [
      "Chuva que cai,",
      "molha o chão.",
      "Vento que passa,",
      "balança o coração.",
      "",
      "Poça na rua,",
      "barquinho de papel.",
      "Criança que brinca",
      "debaixo do céu.",
    ],
  },
  {
    id: "t7",
    titulo: "A lenda do Caipora",
    categoria: "Nossa região",
    nivel: "4º ao 5º ano",
    paragrafos: [
      "Contam os mais antigos que, nas matas da Amazônia, vive um ser chamado Caipora — conhecido também como o 'pai da mata'.",
      "Diz a lenda que ele protege os animais da floresta. Quando um caçador tira mais do que precisa, o Caipora aparece para assustá-lo e confundir seu caminho.",
      "Os moradores mais próximos da floresta, incluindo comunidades ribeirinhas do Acre, contam que é preciso respeito ao entrar na mata — e que oferecer fumo de corda é um jeito de pedir licença ao Caipora.",
      "Mais do que uma história para assustar crianças, a lenda ensina algo importante: a floresta não é infinita, e cuidar dela é dever de todos.",
    ],
  },
  {
    id: "t8",
    titulo: "Uma carta para o futuro",
    categoria: "Carta",
    nivel: "4º ao 5º ano",
    paragrafos: [
      "Querido eu do futuro,",
      "Hoje eu completei mais um ano na escola e aprendi a dividir números grandes. No começo parecia impossível, mas com prática ficou mais fácil.",
      "Espero que, quando você ler esta carta, já tenha aprendido coisas ainda maiores — e que nunca tenha deixado de ser curioso(a).",
      "Um abraço do seu eu mais novo.",
    ],
  },
  {
    id: "t9",
    titulo: "Por que o céu escurece à noite?",
    categoria: "Texto informativo",
    nivel: "4º ao 5º ano",
    paragrafos: [
      "A Terra gira em torno de si mesma, como um pião, completando uma volta a cada 24 horas. Esse giro se chama rotação.",
      "Quando o lado onde estamos fica de frente para o Sol, é dia. Quando esse mesmo lado gira para longe do Sol, a luz não chega mais até nós, e temos a noite.",
      "Por isso, enquanto é noite em Feijó, do outro lado do planeta pode estar amanhecendo.",
    ],
  },
  {
    id: "t10",
    titulo: "O tesouro da amizade",
    categoria: "Conto",
    nivel: "3º ano",
    paragrafos: [
      "Léo e Mari eram amigos desde pequenos. Um dia, encontraram um mapa velho no fundo do baú da avó de Mari.",
      "Seguiram as pistas por todo o quintal, cavando aqui, procurando ali, até chegarem embaixo da mangueira grande.",
      "Não havia ouro nem joias — só uma caixinha com fotos antigas da avó quando era criança. Mesmo assim, os dois acharam que tinham encontrado um tesouro de verdade.",
    ],
  },
];

const NIVEIS: TextoAcervo["nivel"][] = ["1º ao 2º ano", "3º ano", "4º ao 5º ano"];

export function AcervoLeitura() {
  const [selecionado, setSelecionado] = useState<TextoAcervo | null>(null);

  if (selecionado) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => setSelecionado(null)}
          >
            <ArrowLeft className="size-4" /> Voltar ao acervo
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="size-3.5" /> Imprimir
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <Badge variant="secondary" className="mb-3">
              {selecionado.categoria} · {selecionado.nivel}
            </Badge>
            <h2 className="mb-4 text-xl font-bold text-foreground">{selecionado.titulo}</h2>
            <div className="flex flex-col gap-3">
              {selecionado.paragrafos.map((p, i) =>
                p === "" ? (
                  <div key={i} className="h-1" />
                ) : (
                  <p key={i} className="text-base leading-relaxed text-foreground">
                    {p}
                  </p>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Textos para ler com calma — sem perguntas, sem pressa. Bom para praticar leitura em voz alta
        com a família ou em sala de aula.
      </p>
      {NIVEIS.map((nivel) => {
        const textos = TEXTOS.filter((t) => t.nivel === nivel);
        if (textos.length === 0) return null;
        return (
          <div key={nivel}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {nivel}
            </h3>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {textos.map((texto) => (
                <button
                  key={texto.id}
                  type="button"
                  onClick={() => setSelecionado(texto)}
                  className="group flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-card p-3.5 text-left shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-300">
                    <BookOpen className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                      {texto.titulo}
                    </p>
                    <p className="text-xs text-muted-foreground">{texto.categoria}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
