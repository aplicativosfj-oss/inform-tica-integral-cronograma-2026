import {
  BookMarked,
  BookOpenText,
  Blocks,
  Boxes,
  Calculator,
  FileText,
  Ghost,
  Globe2,
  GraduationCap,
  Hash,
  Equal,
  Gamepad2,
  Landmark,
  type LucideIcon,
  PartyPopper,
  Percent,
  PenLine,
  PenTool,
  PieChart,
  PuzzleIcon,
  Scale,
  Ruler,
  ScrollText,
  Shapes,
  SpellCheck2,
  Table2,
  Target,
  Weight,
  TreePine,
} from "lucide-react";
import type { ComponentType } from "react";

import { AcervoLeitura } from "@/components/school/ferramentas/acervo-leitura";
import { Alfabetizacao } from "@/components/school/ferramentas/alfabetizacao";
import { AtividadesLP } from "@/components/school/ferramentas/atividades-lp";
import { CalculadoraJanela } from "@/components/school/ferramentas/calculadora-flutuante";
import { DatasComemorativas } from "@/components/school/ferramentas/datas-comemorativas";
import {
  CompararFracoesJanela,
  ConversorMedidasJanela,
  FracaoNaMesaJanela,
  FracoesEquivalentesJanela,
  JogoNumerosJanela,
  JogoOperacoesJanela,
  MedidasMundoJanela,
  MesaFormasJanela,
  PorcentagemJanela,
  GenerosTextuaisJanela,
  ProblemasInteligentesJanela,
  ProducaoTextualJanela,
  ValorPosicionalJanela,
} from "@/components/school/ferramentas/janelas-manipular";
import { EditorTexto } from "@/components/school/ferramentas/editor-texto";
import { Folclore } from "@/components/school/ferramentas/folclore";
import { Fracoes } from "@/components/school/ferramentas/fracoes";
import { Geografia } from "@/components/school/ferramentas/geografia";
import { Geometria } from "@/components/school/ferramentas/geometria";
import { HistoriaAcreFeijo } from "@/components/school/ferramentas/historia-acre-feijo";
import { HistoriaBrasil } from "@/components/school/ferramentas/historia-brasil";
import { Leitura } from "@/components/school/ferramentas/leitura";
import { Planilha } from "@/components/school/ferramentas/planilha";
import { ProblemasMatematica } from "@/components/school/ferramentas/problemas-matematica";
import { TabuadaJogo } from "@/components/school/ferramentas/tabuada";
import { Trilhas } from "@/components/school/ferramentas/trilhas";

export interface FerramentaInfo {
  slug: string;
  titulo: string;
  descricao: string;
  categoria:
    "Recomposição" | "Ferramentas" | "Matemática" | "Alfabetização e Leitura" | "Nossa região";
  icon: LucideIcon;
  cor: string;
  Componente: ComponentType;
}

export const FERRAMENTAS: FerramentaInfo[] = [
  {
    slug: "atividades-por-habilidade",
    titulo: "Atividades por habilidade",
    descricao:
      "Treine o que a Avaliação Diagnóstica mostrou que precisa melhorar, por série e nível.",
    categoria: "Recomposição",
    icon: Target,
    cor: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
    Componente: Trilhas,
  },
  {
    slug: "calculadora",
    titulo: "Calculadora",
    descricao: "Faça as quatro operações rapidinho.",
    categoria: "Ferramentas",
    icon: Calculator,
    cor: "bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
    Componente: CalculadoraJanela,
  },
  {
    slug: "mesa-formas",
    titulo: "Mesa de formas",
    descricao: "Monte desenhos arrastando figuras geométricas coloridas pela mesa.",
    categoria: "Ferramentas",
    icon: Shapes,
    cor: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
    Componente: MesaFormasJanela,
  },
  {
    slug: "montar-fracoes",
    titulo: "Montar frações",
    descricao: "Escolha os números e veja a fração virar pizza, chocolate ou litros.",
    categoria: "Matemática",
    icon: PieChart,
    cor: "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-300",
    Componente: FracaoNaMesaJanela,
  },
  {
    slug: "comparar-fracoes",
    titulo: "Comparar frações",
    descricao: "Duas frações lado a lado para descobrir qual é a maior.",
    categoria: "Matemática",
    icon: Scale,
    cor: "bg-teal-500/10 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
    Componente: CompararFracoesJanela,
  },
  {
    slug: "fracoes-equivalentes",
    titulo: "Frações equivalentes",
    descricao: "Veja a mesma quantidade escrita de vários jeitos diferentes.",
    categoria: "Matemática",
    icon: Equal,
    cor: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300",
    Componente: FracoesEquivalentesJanela,
  },
  {
    slug: "porcentagem",
    titulo: "Laboratório de porcentagem",
    descricao: "Veja a mesma porcentagem em quatro desenhos, em fração e em decimal.",
    categoria: "Matemática",
    icon: Percent,
    cor: "bg-cyan-500/10 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
    Componente: PorcentagemJanela,
  },
  {
    slug: "desafio-operacoes",
    titulo: "Desafio das 4 operações",
    descricao: "Jogo contra o relógio, com seis níveis e ranking da escola.",
    categoria: "Matemática",
    icon: Gamepad2,
    cor: "bg-fuchsia-500/10 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-300",
    Componente: JogoOperacoesJanela,
  },
  {
    slug: "fabrica-problemas",
    titulo: "Fábrica de problemas",
    descricao: "Problemas do dia a dia com dica e resolução passo a passo.",
    categoria: "Matemática",
    icon: PuzzleIcon,
    cor: "bg-lime-500/10 text-lime-700 dark:bg-lime-500/20 dark:text-lime-300",
    Componente: ProblemasInteligentesJanela,
  },
  {
    slug: "conversor-medidas",
    titulo: "Conversor de medidas",
    descricao: "Comprimento, capacidade e massa na escadinha das unidades.",
    categoria: "Matemática",
    icon: Ruler,
    cor: "bg-sky-500/10 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
    Componente: ConversorMedidasJanela,
  },
  {
    slug: "quanto-mede",
    titulo: "Quanto mede cada coisa",
    descricao: "Objetos do dia a dia para saber quando usar mm, m, L ou kg.",
    categoria: "Matemática",
    icon: Weight,
    cor: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    Componente: MedidasMundoJanela,
  },
  {
    slug: "valor-posicional",
    titulo: "Unidade, dezena, centena e milhar",
    descricao: "Monte números com material dourado e veja a troca do vai um.",
    categoria: "Matemática",
    icon: Boxes,
    cor: "bg-violet-500/10 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
    Componente: ValorPosicionalJanela,
  },
  {
    slug: "jogo-numeros",
    titulo: "Jogo dos números",
    descricao: "Monte o número com as peças ou descubra que número elas formam.",
    categoria: "Matemática",
    icon: Blocks,
    cor: "bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
    Componente: JogoNumerosJanela,
  },
  {
    slug: "producao-textual",
    titulo: "Assistente de produção textual",
    descricao: "Planeje, escreva e revise bilhete, conto, lenda, notícia ou opinião.",
    categoria: "Alfabetização e Leitura",
    icon: PenTool,
    cor: "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
    Componente: ProducaoTextualJanela,
  },
  {
    slug: "editor-texto",
    titulo: "Editor de texto",
    descricao: "Escreva, formate e baixe seus textos.",
    categoria: "Ferramentas",
    icon: FileText,
    cor: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300",
    Componente: EditorTexto,
  },
  {
    slug: "planilha",
    titulo: "Planilha",
    descricao: "Organize números e use fórmulas simples.",
    categoria: "Ferramentas",
    icon: Table2,
    cor: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    Componente: Planilha,
  },
  {
    slug: "tabuada",
    titulo: "Tabuada",
    descricao: "Treine a tabuada de multiplicação.",
    categoria: "Matemática",
    icon: Hash,
    cor: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    Componente: TabuadaJogo,
  },
  {
    slug: "problemas-matematica",
    titulo: "Problemas de matemática",
    descricao: "Some, subtraia, multiplique e divida com problemas do dia a dia.",
    categoria: "Matemática",
    icon: PenLine,
    cor: "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300",
    Componente: ProblemasMatematica,
  },
  {
    slug: "fracoes",
    titulo: "Frações",
    descricao: "Aprenda frações vendo e comparando partes.",
    categoria: "Matemática",
    icon: PieChart,
    cor: "bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-300",
    Componente: Fracoes,
  },
  {
    slug: "geometria",
    titulo: "Figuras geométricas",
    descricao: "Reconheça formas, lados e ângulos.",
    categoria: "Matemática",
    icon: Shapes,
    cor: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
    Componente: Geometria,
  },
  {
    slug: "alfabetizacao",
    titulo: "Alfabetização",
    descricao: "Vogais, sílabas, maiúsculas e minúsculas, rimas.",
    categoria: "Alfabetização e Leitura",
    icon: SpellCheck2,
    cor: "bg-lime-500/10 text-lime-700 dark:bg-lime-500/20 dark:text-lime-300",
    Componente: Alfabetizacao,
  },
  {
    slug: "atividades-portugues",
    titulo: "Atividades de Português (1º ao 5º)",
    descricao: "Atividades por série, com versão adaptada para inclusão.",
    categoria: "Alfabetização e Leitura",
    icon: GraduationCap,
    cor: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
    Componente: AtividadesLP,
  },
  {
    slug: "acervo-leitura",
    titulo: "Acervo de leitura",
    descricao: "Contos, poemas e textos para ler com calma, sem pressa.",
    categoria: "Alfabetização e Leitura",
    icon: BookOpenText,
    cor: "bg-teal-500/10 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
    Componente: AcervoLeitura,
  },
  {
    slug: "leitura",
    titulo: "Leitura e interpretação",
    descricao: "Leia textos e responda perguntas sobre eles.",
    categoria: "Alfabetização e Leitura",
    icon: ScrollText,
    cor: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-300",
    Componente: Leitura,
  },
  {
    slug: "generos-textuais",
    titulo: "Gêneros textuais",
    descricao: "Trinta textos de verdade — do bilhete à bula — para reconhecer e aprender.",
    categoria: "Alfabetização e Leitura",
    icon: BookMarked,
    cor: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300",
    Componente: GenerosTextuaisJanela,
  },
  {
    slug: "datas-comemorativas",
    titulo: "Datas comemorativas",
    descricao: "Quando é o quê no calendário brasileiro.",
    categoria: "Nossa região",
    icon: PartyPopper,
    cor: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
    Componente: DatasComemorativas,
  },
  {
    slug: "historia-brasil",
    titulo: "História do Brasil",
    descricao: "Fatos importantes da nossa história.",
    categoria: "Nossa região",
    icon: Landmark,
    cor: "bg-yellow-600/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
    Componente: HistoriaBrasil,
  },
  {
    slug: "historia-acre-feijo",
    titulo: "História do Acre e de Feijó",
    descricao: "Como nasceu nosso estado e nosso município.",
    categoria: "Nossa região",
    icon: TreePine,
    cor: "bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    Componente: HistoriaAcreFeijo,
  },
  {
    slug: "geografia",
    titulo: "Geografia",
    descricao: "Brasil, Acre e Feijó no mapa.",
    categoria: "Nossa região",
    icon: Globe2,
    cor: "bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300",
    Componente: Geografia,
  },
  {
    slug: "folclore",
    titulo: "Folclore",
    descricao: "Lendas do Brasil e da nossa região amazônica.",
    categoria: "Nossa região",
    icon: Ghost,
    cor: "bg-fuchsia-500/10 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-300",
    Componente: Folclore,
  },
];

export function encontrarFerramenta(slug: string): FerramentaInfo | undefined {
  return FERRAMENTAS.find((f) => f.slug === slug);
}
