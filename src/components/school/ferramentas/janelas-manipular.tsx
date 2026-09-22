import {
  Blocks,
  Boxes,
  Equal,
  Gamepad2,
  Percent,
  PieChart,
  PuzzleIcon,
  BookMarked,
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
    >
      <Porcentagem />
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
    >
      <GenerosTextuais />
    </JanelaFerramenta>
  );
}
