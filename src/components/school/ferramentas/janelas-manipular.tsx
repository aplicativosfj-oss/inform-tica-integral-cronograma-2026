import { Equal, PieChart, Scale, Shapes } from "lucide-react";

import {
  CompararFracoes,
  FracaoNaMesa,
  FracoesEquivalentes,
} from "@/components/school/ferramentas/fracoes-manipular";
import {
  JanelaFerramenta,
  voltarDaFerramenta,
} from "@/components/school/ferramentas/janela-ferramenta";
import { MesaFormas } from "@/components/school/ferramentas/mesa-formas";

/**
 * As ferramentas de manipular abrem como a calculadora: uma janelinha que a
 * criança arrasta pela tela. Ficam todas juntas aqui para a página da
 * ferramenta só precisar montar o componente.
 */

const CREDITO = "Ferramenta criada pelo professor Franc D'nis";
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
