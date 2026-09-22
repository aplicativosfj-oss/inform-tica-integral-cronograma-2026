import { Calculator } from "lucide-react";

import { Calculadora } from "@/components/school/ferramentas/calculadora";
import {
  JanelaFerramenta,
  voltarDaFerramenta,
} from "@/components/school/ferramentas/janela-ferramenta";

/**
 * Calculadora em janela flutuante: fica fechada quando a página abre (só um
 * botão discreto no canto) e, depois de aberta, pode ser arrastada para
 * qualquer lugar da tela — inclusive por cima do conteúdo, para conferir uma
 * conta sem perder de vista o que está lendo.
 *
 * A posição fica guardada no navegador; o estado aberto/fechado não, de
 * propósito: o site nunca deve abrir com a calculadora já na frente.
 */

const CHAVE_POSICAO = "infoteca:calculadora-posicao";

export function CalculadoraFlutuante({
  abertaInicial = false,
  aoFechar,
}: {
  abertaInicial?: boolean;
  aoFechar?: () => void;
} = {}) {
  return (
    <JanelaFerramenta
      titulo="Calculadora"
      subtitulo="Calculadora criada pelo professor Franc D'nis"
      abertaInicial={abertaInicial}
      aoFechar={aoFechar}
      chavePosicao={CHAVE_POSICAO}
      rotuloBotao="Calculadora"
      iconeBotao={Calculator}
    >
      <Calculadora compacta={!abertaInicial} moldura={false} />
    </JanelaFerramenta>
  );
}

/**
 * Versão usada na página da ferramenta: a calculadora já abre como uma única
 * janela (sem rolagem), pode ser arrastada pela tela e o X volta à página
 * anterior.
 */
export function CalculadoraJanela() {
  return <CalculadoraFlutuante abertaInicial aoFechar={voltarDaFerramenta} />;
}
