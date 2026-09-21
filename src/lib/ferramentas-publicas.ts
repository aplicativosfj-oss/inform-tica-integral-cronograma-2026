import { FERRAMENTAS, type FerramentaInfo } from "@/components/school/ferramentas/registro";

/**
 * Ferramentas abertas a qualquer visitante, sem PIN e sem cadastro — a parte
 * de domínio público da Infoteca.
 *
 * O critério para entrar aqui é não depender de conta: a ferramenta precisa
 * funcionar inteira no navegador de quem abriu, sem salvar nada em nome de
 * um aluno. É por isso que o editor de texto fica de fora por enquanto: ele
 * grava os documentos na pasta do aluno, o que só faz sentido com sessão.
 *
 * A lista começa com a calculadora e cresce conforme a escola quiser abrir
 * mais — basta acrescentar o slug.
 */
export const FERRAMENTAS_PUBLICAS = ["calculadora"] as const;

export function listarFerramentasPublicas(): FerramentaInfo[] {
  return FERRAMENTAS.filter((f) => (FERRAMENTAS_PUBLICAS as readonly string[]).includes(f.slug));
}

export function ferramentaPublica(slug: string): FerramentaInfo | undefined {
  return listarFerramentasPublicas().find((f) => f.slug === slug);
}
