/**
 * Assinatura das ferramentas da Infoteca — quem fez e de quando é.
 *
 * Fica num arquivo só para a janela flutuante e a página da ferramenta
 * dizerem exatamente a mesma coisa, e para o dia em que mudar o ano (ou
 * entrar outro autor) ser uma linha só.
 */

export const AUTOR = "professor Franc D'nis";
export const ANO_CRIACAO = 2026;

/** Linha de crédito usada no cabeçalho das janelas. */
export const CREDITO = `Criada pelo ${AUTOR} · ${ANO_CRIACAO}`;

/** Rodapé discreto para as ferramentas que ocupam a página inteira. */
export function CreditoFerramenta() {
  return (
    <p className="mt-6 border-t border-border/60 pt-3 text-center text-xs text-muted-foreground">
      Ferramenta criada pelo {AUTOR} · {ANO_CRIACAO} · Escola Municipal em Tempo Integral Dr.
      Eiraldo Carneiro de França
    </p>
  );
}
