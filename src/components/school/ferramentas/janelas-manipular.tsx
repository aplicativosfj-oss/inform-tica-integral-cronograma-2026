import {
  Blocks,
  Boxes,
  Equal,
  Gamepad2,
  Lightbulb,
  Percent,
  PieChart,
  PuzzleIcon,
  BookMarked,
  Baby,
  Dices,
  PenTool,
  Ruler,
  Scale,
  Shapes,
  Weight,
} from "lucide-react";

import {
  CompararFracoes,
  FracaoNaMesa,
  FracoesEquivalentes,
} from "@/components/school/ferramentas/fracoes-manipular";
import {
  JanelaFerramenta,
  voltarDaFerramenta,
} from "@/components/school/ferramentas/janela-ferramenta";
import { ConversorMedidas } from "@/components/school/ferramentas/conversor-medidas";
import { GenerosTextuais } from "@/components/school/ferramentas/generos-textuais";
import { JogoNumeros } from "@/components/school/ferramentas/jogo-numeros";
import { JogoOperacoes } from "@/components/school/ferramentas/jogo-operacoes";
import { MedidasMundo } from "@/components/school/ferramentas/medidas-mundo";
import { CREDITO } from "@/components/school/ferramentas/credito";
import { MesaFormas } from "@/components/school/ferramentas/mesa-formas";
import { ParqueLetras } from "@/components/school/ferramentas/parque-letras";
import { SalaDeJogos } from "@/components/school/jogos/sala-de-jogos";
import { DiaADia } from "@/components/school/ferramentas/dia-a-dia";
import { Porcentagem } from "@/components/school/ferramentas/porcentagem";
import { ProblemasInteligentes } from "@/components/school/ferramentas/problemas-inteligentes";
import { ProducaoTextual } from "@/components/school/ferramentas/producao-textual";
import { ValorPosicional } from "@/components/school/ferramentas/valor-posicional";

/**
 * As ferramentas de manipular abrem como a calculadora: uma janelinha que a
 * criança arrasta pela tela. Ficam todas juntas aqui para a página da
 * ferramenta só precisar montar o componente.
 */

/** Um pouco mais larga que a calculadora: as figuras precisam de espaço. */
const LARGURA = "w-[min(27rem,calc(100vw-24px))]";

export function MesaFormasJanela() {
  return (
    <JanelaFerramenta
      titulo="Mesa de formas"
      subtitulo={CREDITO}
      largura={LARGURA}
      abertaInicial
      aoFechar={voltarDaFerramenta}
      rotuloBotao="Formas"
      iconeBotao={Shapes}
      cor="bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300"
    >
      <MesaFormas />
    </JanelaFerramenta>
  );
}

export function FracaoNaMesaJanela() {
  return (
    <JanelaFerramenta
      titulo="Montar frações"
      subtitulo={CREDITO}
      largura={LARGURA}
      abertaInicial
      aoFechar={voltarDaFerramenta}
      rotuloBotao="Frações"
      iconeBotao={PieChart}
      cor="bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-300"
    >
      <FracaoNaMesa />
    </JanelaFerramenta>
  );
}

export function CompararFracoesJanela() {
  return (
    <JanelaFerramenta
      titulo="Comparar frações"
      subtitulo={CREDITO}
      largura={LARGURA}
      abertaInicial
      aoFechar={voltarDaFerramenta}
      rotuloBotao="Comparar frações"
      iconeBotao={Scale}
      cor="bg-teal-500/10 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300"
    >
      <CompararFracoes />
    </JanelaFerramenta>
  );
}

export function FracoesEquivalentesJanela() {
  return (
    <JanelaFerramenta
      titulo="Frações equivalentes"
      subtitulo={CREDITO}
      largura={LARGURA}
      abertaInicial
      aoFechar={voltarDaFerramenta}
      rotuloBotao="Frações equivalentes"
      iconeBotao={Equal}
      cor="bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
    >
      <FracoesEquivalentes />
    </JanelaFerramenta>
  );
}

/** Estas três precisam de mais espaço: têm ilustração e texto lado a lado. */
const LARGA = "w-[min(34rem,calc(100vw-24px))]";

export function PorcentagemJanela() {
  return (
    <JanelaFerramenta
      titulo="Laboratório de porcentagem"
      subtitulo={CREDITO}
      largura={LARGA}
      abertaInicial
      aoFechar={voltarDaFerramenta}
      rotuloBotao="Porcentagem"
      iconeBotao={Percent}
      cor="bg-cyan-500/10 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300"
    >
      <Porcentagem />
    </JanelaFerramenta>
  );
}

export function DiaADiaJanela() {
  return (
    <JanelaFerramenta
      titulo="Matemática no dia a dia"
      subtitulo={CREDITO}
      largura={LARGA}
      abertaInicial
      aoFechar={voltarDaFerramenta}
      rotuloBotao="Dia a dia"
      iconeBotao={Lightbulb}
      cor="bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
    >
      <DiaADia />
    </JanelaFerramenta>
  );
}

export function JogoOperacoesJanela() {
  return (
    <JanelaFerramenta
      titulo="Desafio das 4 operações"
      subtitulo={CREDITO}
      largura={LARGURA}
      abertaInicial
      aoFechar={voltarDaFerramenta}
      rotuloBotao="Desafio"
      iconeBotao={Gamepad2}
      cor="bg-fuchsia-500/10 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-300"
    >
      <JogoOperacoes />
    </JanelaFerramenta>
  );
}

export function ProblemasInteligentesJanela() {
  return (
    <JanelaFerramenta
      titulo="Fábrica de problemas"
      subtitulo={CREDITO}
      largura={LARGA}
      abertaInicial
      aoFechar={voltarDaFerramenta}
      rotuloBotao="Problemas"
      iconeBotao={PuzzleIcon}
      cor="bg-lime-500/10 text-lime-700 dark:bg-lime-500/20 dark:text-lime-300"
    >
      <ProblemasInteligentes />
    </JanelaFerramenta>
  );
}

export function ConversorMedidasJanela() {
  return (
    <JanelaFerramenta
      titulo="Conversor de medidas"
      subtitulo={CREDITO}
      largura={LARGA}
      abertaInicial
      aoFechar={voltarDaFerramenta}
      rotuloBotao="Medidas"
      iconeBotao={Ruler}
      cor="bg-sky-500/10 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300"
    >
      <ConversorMedidas />
    </JanelaFerramenta>
  );
}

export function MedidasMundoJanela() {
  return (
    <JanelaFerramenta
      titulo="Quanto mede cada coisa"
      subtitulo={CREDITO}
      largura={LARGA}
      abertaInicial
      aoFechar={voltarDaFerramenta}
      rotuloBotao="Quanto mede"
      iconeBotao={Weight}
      cor="bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
    >
      <MedidasMundo />
    </JanelaFerramenta>
  );
}

export function ValorPosicionalJanela() {
  return (
    <JanelaFerramenta
      titulo="Unidade, dezena, centena e milhar"
      subtitulo={CREDITO}
      largura={LARGA}
      abertaInicial
      aoFechar={voltarDaFerramenta}
      rotuloBotao="Valor posicional"
      iconeBotao={Boxes}
      cor="bg-violet-500/10 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
    >
      <ValorPosicional />
    </JanelaFerramenta>
  );
}

export function JogoNumerosJanela() {
  return (
    <JanelaFerramenta
      titulo="Jogo dos números"
      subtitulo={CREDITO}
      largura={LARGA}
      abertaInicial
      aoFechar={voltarDaFerramenta}
      rotuloBotao="Jogo dos números"
      iconeBotao={Blocks}
      cor="bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
    >
      <JogoNumeros />
    </JanelaFerramenta>
  );
}

export function ProducaoTextualJanela() {
  return (
    <JanelaFerramenta
      titulo="Assistente de produção textual"
      subtitulo={CREDITO}
      largura={LARGA}
      abertaInicial
      aoFechar={voltarDaFerramenta}
      rotuloBotao="Escrever"
      iconeBotao={PenTool}
      cor="bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
    >
      <ProducaoTextual />
    </JanelaFerramenta>
  );
}

export function GenerosTextuaisJanela() {
  return (
    <JanelaFerramenta
      titulo="Museu dos gêneros textuais"
      subtitulo={CREDITO}
      largura={LARGA}
      abertaInicial
      aoFechar={voltarDaFerramenta}
      rotuloBotao="Gêneros"
      iconeBotao={BookMarked}
      cor="bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
    >
      <GenerosTextuais />
    </JanelaFerramenta>
  );
}

export function ParqueLetrasJanela() {
  return (
    <JanelaFerramenta
      titulo="Parque das Letras"
      subtitulo={CREDITO}
      largura={LARGA}
      abertaInicial
      aoFechar={voltarDaFerramenta}
      rotuloBotao="Letras"
      iconeBotao={Baby}
      cor="bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-300"
    >
      <ParqueLetras />
    </JanelaFerramenta>
  );
}

export function SalaDeJogosJanela() {
  return (
    <JanelaFerramenta
      titulo="Sala de Jogos"
      subtitulo={CREDITO}
      largura={LARGA}
      abertaInicial
      aoFechar={voltarDaFerramenta}
      rotuloBotao="Jogos"
      iconeBotao={Dices}
      cor="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
    >
      <SalaDeJogos />
    </JanelaFerramenta>
  );
}
