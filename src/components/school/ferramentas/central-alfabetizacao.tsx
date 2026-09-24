import { BookOpen, Check, ChevronRight, RotateCcw, Sparkles, Star, Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Figura } from "@/components/school/ferramentas/figuras-alfabeto";
import { falar, prepararVoz } from "@/lib/voz";
import { cn } from "@/lib/utils";

type Desafio = {
  pergunta: string;
  opcoes: string[];
  resposta: string;
  explicacao: string;
  fala?: string;
  figura?: string;
};

type DesafioCompacto = [string, string[], string, string, string?, string?];

const DADOS: Record<number, DesafioCompacto[]> = {
  1: [
    ["Qual é uma vogal?", ["B", "A", "T"], "A", "A é uma das cinco vogais."],
    ["Qual é uma consoante?", ["E", "U", "M"], "M", "M é consoante."],
    ["Qual letra começa AVIÃO?", ["A", "V", "O"], "A", "AVIÃO começa com A.", "avião", "aviao"],
    ["Qual letra começa BOLA?", ["D", "B", "P"], "B", "BOLA começa com B.", "bola", "bola"],
    ["Qual é a minúscula de G?", ["q", "g", "j"], "g", "G e g são a mesma letra."],
    ["Qual é a maiúscula de p?", ["B", "P", "R"], "P", "P e p formam um par."],
    ["Complete: C__SA", ["A", "E", "I"], "A", "C + A + S + A forma CASA.", "casa", "casa"],
    ["Complete: B__LA", ["A", "O", "U"], "O", "B + O + L + A forma BOLA.", "bola", "bola"],
    [
      "Qual é a primeira sílaba de PATO?",
      ["PA", "TO", "PO"],
      "PA",
      "PATO começa com PA.",
      "pato",
      "pato",
    ],
    [
      "Qual palavra começa com F?",
      ["flor", "gato", "lua"],
      "flor",
      "FLOR começa com F.",
      "flor",
      "flor",
    ],
    ["Quantas letras há em SOL?", ["2", "3", "4"], "3", "S-O-L: três letras.", "sol", "sol"],
    [
      "Qual palavra rima com GATO?",
      ["pato", "bola", "mesa"],
      "pato",
      "GATO e PATO terminam com o som ATO.",
    ],
    ["Que letra vem depois de D?", ["C", "E", "F"], "E", "No alfabeto: C, D, E."],
  ],
  2: [
    [
      "Junte as sílabas: CA + SA",
      ["casa", "saca", "casaco"],
      "casa",
      "CA + SA = CASA.",
      "casa",
      "casa",
    ],
    ["Junte: BO + NE + CA", ["boneca", "caneca", "boca"], "boneca", "BO + NE + CA = BONECA."],
    [
      "Quantas sílabas tem JANELA?",
      ["2", "3", "4"],
      "3",
      "JA-NE-LA tem três sílabas.",
      "janela",
      "janela",
    ],
    [
      "Separe corretamente SAPATO.",
      ["SA-PA-TO", "SAP-AT-O", "SA-PAT-O"],
      "SA-PA-TO",
      "Falamos SA-PA-TO.",
    ],
    [
      "Qual palavra rima com CORAÇÃO?",
      ["balão", "casa", "flor"],
      "balão",
      "CORAÇÃO e BALÃO terminam com ÃO.",
    ],
    ["Complete: __COLA", ["ES", "AS", "OS"], "ES", "ES + COLA = ESCOLA.", "escola", "escola"],
    ["Qual palavra tem NH?", ["galinha", "girafa", "gato"], "galinha", "GALINHA tem o dígrafo NH."],
    [
      "Qual palavra tem CH?",
      ["mochila", "menina", "macaco"],
      "mochila",
      "MOCHILA tem CH.",
      "mochila",
      "mochila",
    ],
    [
      "Qual palavra começa com o mesmo som de CASA?",
      ["cavalo", "sapo", "gelo"],
      "cavalo",
      "CASA e CAVALO começam com CA.",
    ],
    [
      "Escolha a palavra completa: QUEI__",
      ["JO", "XO", "GO"],
      "JO",
      "QUEI + JO = QUEIJO.",
      "queijo",
      "queijo",
    ],
    [
      "Onde há duas palavras?",
      ["O GATO", "OGATO", "OGA TO"],
      "O GATO",
      "Usamos espaço entre O e GATO.",
    ],
    ["Qual é o plural de BOLA?", ["bolas", "bolaes", "bolais"], "bolas", "Uma bola; duas bolas."],
    [
      "Complete a frase: A menina ___ o livro.",
      ["leu", "azul", "grande"],
      "leu",
      "LEU indica a ação da menina.",
    ],
  ],
  3: [
    [
      "Complete: CA__ORRO",
      ["CH", "X", "S"],
      "CH",
      "CACHORRO é escrito com CH.",
      "cachorro",
      "cachorro",
    ],
    ["Complete: PA__EIO", ["SS", "Ç", "S"], "SS", "PASSEIO é escrito com SS."],
    ["Complete: CA__PO", ["M", "N", "Ã"], "M", "Antes de P usamos M: CAMPO."],
    ["Complete: PO__TE", ["N", "M", "NH"], "N", "Antes de T usamos N: PONTE."],
    [
      "Qual palavra tem dígrafo LH?",
      ["milho", "mesa", "mala"],
      "milho",
      "Em MILHO, L e H representam um som.",
    ],
    [
      "Qual palavra tem encontro consonantal?",
      ["prato", "pato", "rato"],
      "prato",
      "PR aparece junto em PRATO.",
    ],
    [
      "Complete: CA__O (automóvel)",
      ["RR", "R", "SS"],
      "RR",
      "CARRO leva RR entre vogais.",
      "carro",
      "carro",
    ],
    ["Complete: BA__IGA", ["RR", "R", "S"], "RR", "BARRIGA é escrita com RR."],
    [
      "Qual palavra está no diminutivo?",
      ["casinha", "casarão", "casa"],
      "casinha",
      "O sufixo -INHA indica diminutivo.",
    ],
    [
      "Qual palavra está no aumentativo?",
      ["bolinha", "bola", "bolão"],
      "bolão",
      "O sufixo -ÃO pode indicar aumentativo.",
    ],
    [
      "Qual frase está pontuada?",
      ["Que dia lindo!", "Que dia lindo", "que dia lindo"],
      "Que dia lindo!",
      "A exclamação combina com entusiasmo.",
    ],
    [
      "Qual é sinônimo de FELIZ?",
      ["contente", "triste", "cansado"],
      "contente",
      "FELIZ e CONTENTE têm sentido parecido.",
    ],
    [
      "Complete: A turma fez uma ___.",
      ["viagem", "viajem", "viajen"],
      "viagem",
      "O substantivo VIAGEM é escrito com G.",
    ],
  ],
  4: [
    ["Complete: A__ÚCAR", ["Ç", "SS", "S"], "Ç", "AÇÚCAR é escrito com Ç."],
    ["Complete: NA__ER", ["SC", "SS", "Ç"], "SC", "NASCER é escrito com SC."],
    ["Complete: EN__ADA", ["X", "CH", "S"], "X", "ENXADA é escrita com X."],
    ["Complete: __UVA", ["CH", "X", "J"], "CH", "CHUVA é escrita com CH."],
    ["Complete: LARAN__A", ["J", "G", "X"], "J", "LARANJA é escrita com J.", "laranja", "laranja"],
    ["Complete: __ITARRA", ["GU", "G", "QU"], "GU", "GUITARRA usa GU para manter o som forte."],
    [
      "Qual opção está correta?",
      ["certeza", "certesa", "serteza"],
      "certeza",
      "CERTEZA termina em -EZA.",
    ],
    [
      "Qual opção está correta?",
      ["beleza", "belesa", "beleça"],
      "beleza",
      "BELEZA é escrita com Z.",
    ],
    [
      "Em CASA, o S entre vogais tem som de...",
      ["Z", "SS", "CH"],
      "Z",
      "Em CASA, o S representa o som /z/.",
    ],
    ["Em SAPO, o S inicial tem som de...", ["S", "Z", "X"], "S", "No início de SAPO ouvimos /s/."],
    [
      "Qual frase concorda corretamente?",
      ["As crianças brincam.", "As criança brinca.", "As crianças brinca."],
      "As crianças brincam.",
      "Artigo, nome e verbo concordam no plural.",
    ],
    [
      "Qual palavra é oxítona?",
      ["café", "mesa", "lâmpada"],
      "café",
      "Em CAFÉ, a última sílaba é a mais forte.",
    ],
    [
      "Qual conectivo indica causa?",
      ["porque", "porém", "depois"],
      "porque",
      "PORQUE pode apresentar uma explicação ou causa.",
    ],
  ],
  5: [
    ["Complete: EXCE__ÃO", ["Ç", "SS", "S"], "Ç", "EXCEÇÃO é escrita com Ç."],
    ["Complete: PRIVILÉ__IO", ["G", "J", "GI"], "G", "PRIVILÉGIO é escrito com G."],
    ["Qual forma está correta?", ["mexer", "mecher", "mexêr"], "mexer", "MEXER é escrito com X."],
    [
      "Qual forma está correta?",
      ["pesquisa", "pesquiza", "pequisa"],
      "pesquisa",
      "PESQUISA é escrita com S e QU.",
    ],
    [
      "Complete: Ele trouxe o material ___ estudar.",
      ["para", "pára", "pará"],
      "para",
      "PARA, sem acento, é preposição.",
    ],
    [
      "Qual frase usa MAS corretamente?",
      ["Queria ir, mas choveu.", "Queria ir, mais choveu.", "Queria mas comida."],
      "Queria ir, mas choveu.",
      "MAS indica oposição.",
    ],
    [
      "Qual frase usa MAIS corretamente?",
      ["Quero mais água.", "Quero mas água.", "Mais estava frio."],
      "Quero mais água.",
      "MAIS indica quantidade.",
    ],
    [
      "Qual palavra é proparoxítona?",
      ["médico", "café", "janela"],
      "médico",
      "MÉ-di-co tem a antepenúltima sílaba forte.",
    ],
    [
      "Qual sinal introduz uma explicação?",
      [":", "?", "!"],
      ":",
      "Os dois-pontos podem anunciar uma explicação.",
    ],
    [
      "Qual frase tem sentido figurado?",
      ["Ela tem um coração de ouro.", "O anel é de ouro.", "O ouro é metal."],
      "Ela tem um coração de ouro.",
      "CORAÇÃO DE OURO quer dizer que ela é generosa.",
    ],
    [
      "Qual é o antônimo de GENEROSO?",
      ["egoísta", "bondoso", "gentil"],
      "egoísta",
      "EGOÍSTA expressa sentido contrário.",
    ],
    [
      "Qual palavra retoma MARIA?",
      ["ela", "aqui", "ontem"],
      "ela",
      "O pronome ELA pode retomar MARIA.",
    ],
    [
      "Revise: 'As menina estudou.'",
      ["As meninas estudaram.", "A meninas estudou.", "As menina estudaram."],
      "As meninas estudaram.",
      "Todos os termos concordam no plural.",
    ],
  ],
};

// Mantém os dados compactos acima sem perder os nomes dos campos usados pela interface.
const desafiosPorAno: Record<number, Desafio[]> = Object.fromEntries(
  Object.entries(DADOS).map(([ano, itens]) => [
    ano,
    itens.map(([pergunta, opcoes, resposta, explicacao, fala, figura]) => ({
      pergunta,
      opcoes,
      resposta,
      explicacao,
      fala,
      figura,
    })),
  ]),
);

const CHAVE = "central-alfabetizacao:progresso:v1";
type Progresso = Record<string, boolean>;

export function CentralAlfabetizacao() {
  const [ano, setAno] = useState(1);
  const [indice, setIndice] = useState(0);
  const [escolha, setEscolha] = useState<string | null>(null);
  const [progresso, setProgresso] = useState<Progresso>({});

  useEffect(() => {
    prepararVoz();
    try {
      setProgresso(JSON.parse(localStorage.getItem(CHAVE) || "{}") as Progresso);
    } catch {
      /* aparelho sem armazenamento disponível */
    }
  }, []);

  const desafios = desafiosPorAno[ano]!;
  const desafio = desafios[indice]!;
  const chave = `${ano}-${indice}`;
  const concluidos = useMemo(
    () => Object.keys(progresso).filter((k) => k.startsWith(`${ano}-`)).length,
    [ano, progresso],
  );

  function responder(opcao: string) {
    if (escolha) return;
    setEscolha(opcao);
    if (opcao === desafio.resposta) {
      const novo = { ...progresso, [chave]: true };
      setProgresso(novo);
      try {
        localStorage.setItem(CHAVE, JSON.stringify(novo));
      } catch {
        /* progresso continua na sessão */
      }
      falar(`Muito bem! ${desafio.explicacao}`);
    } else falar(`Vamos aprender: ${desafio.explicacao}`);
  }

  function irPara(novoIndice: number) {
    setIndice((novoIndice + desafios.length) % desafios.length);
    setEscolha(null);
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-amber-50 shadow-xl dark:border-violet-900 dark:from-violet-950/40 dark:via-background dark:to-amber-950/20">
      <header className="bg-gradient-to-r from-violet-700 to-fuchsia-600 p-5 text-white sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-violet-100">
              <Sparkles className="size-4" /> aprender brincando
            </p>
            <h2 className="mt-1 text-2xl font-black sm:text-3xl">Central de Alfabetização</h2>
            <p className="mt-1 max-w-xl text-sm text-violet-100">
              65 missões do 1º ao 5º ano, com áudio, explicação e revisão sem punição.
            </p>
          </div>
          <div className="rounded-2xl bg-white/15 px-4 py-3 text-center backdrop-blur">
            <p className="text-2xl font-black">{Object.keys(progresso).length}/65</p>
            <p className="text-xs text-violet-100">missões concluídas</p>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-7">
        <div className="mb-5 grid grid-cols-5 gap-2" aria-label="Escolha o ano escolar">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setAno(n);
                setIndice(0);
                setEscolha(null);
              }}
              className={cn(
                "rounded-2xl border-2 px-2 py-3 text-sm font-black transition",
                ano === n
                  ? "border-violet-600 bg-violet-600 text-white shadow-lg"
                  : "border-border bg-background hover:border-violet-400",
              )}
            >
              <span className="block text-xl">{n}º</span>ano
            </button>
          ))}
        </div>

        <div className="mb-4 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-950">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-all"
              style={{ width: `${(concluidos / 13) * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold text-muted-foreground">{concluidos}/13</span>
        </div>

        <div className="rounded-3xl border-2 border-violet-100 bg-background/90 p-5 dark:border-violet-900 sm:p-7">
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-200">
              Missão {indice + 1} de 13
            </span>
            {progresso[chave] && (
              <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                <Star className="size-4 fill-current" /> concluída
              </span>
            )}
          </div>
          {desafio.figura && (
            <div className="mb-3 flex justify-center">
              <Figura nome={desafio.figura} tamanho={116} titulo={desafio.fala || desafio.figura} />
            </div>
          )}
          <div className="flex items-start justify-center gap-3">
            <h3 className="text-center text-xl font-black text-foreground sm:text-2xl">
              {desafio.pergunta}
            </h3>
            <button
              type="button"
              onClick={() => falar(desafio.fala || desafio.pergunta, true)}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200"
              aria-label="Ouvir a atividade"
            >
              <Volume2 className="size-5" />
            </button>
          </div>
          <div className="mx-auto mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
            {desafio.opcoes.map((opcao) => {
              const certa = opcao === desafio.resposta;
              return (
                <button
                  key={opcao}
                  type="button"
                  disabled={!!escolha}
                  onClick={() => responder(opcao)}
                  className={cn(
                    "min-h-16 rounded-2xl border-2 px-3 py-3 text-lg font-bold transition",
                    !escolha &&
                      "border-border bg-card hover:-translate-y-0.5 hover:border-violet-500 hover:shadow-md",
                    escolha &&
                      certa &&
                      "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950",
                    escolha === opcao &&
                      !certa &&
                      "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950",
                    escolha && !certa && escolha !== opcao && "opacity-45",
                  )}
                >
                  {opcao}
                </button>
              );
            })}
          </div>
          {escolha && (
            <div
              className={cn(
                "mx-auto mt-5 max-w-2xl rounded-2xl border p-4",
                escolha === desafio.resposta
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
                  : "border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
              )}
            >
              <p className="flex items-center gap-2 font-black">
                {escolha === desafio.resposta ? (
                  <Check className="size-5" />
                ) : (
                  <BookOpen className="size-5" />
                )}
                {escolha === desafio.resposta ? "Muito bem!" : "Vamos descobrir juntos"}
              </p>
              <p className="mt-1 text-sm">{desafio.explicacao}</p>
            </div>
          )}
          <div className="mt-6 flex justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setEscolha(null);
                falar(desafio.fala || desafio.pergunta, true);
              }}
              className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold"
            >
              <RotateCcw className="size-4" /> tentar/ouvir
            </button>
            <button
              type="button"
              onClick={() => irPara(indice + 1)}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-sm font-bold text-white"
            >
              próxima <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
