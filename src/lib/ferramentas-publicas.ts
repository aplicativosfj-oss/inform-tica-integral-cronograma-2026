import { FERRAMENTAS, type FerramentaInfo } from "@/components/school/ferramentas/registro";

/**
 * Ferramentas abertas a qualquer visitante, sem PIN e sem cadastro — a parte
 * de domínio público da Infoteca.
 *
 * O critério para entrar aqui é não depender de conta para funcionar. O
 * editor de texto entrou mesmo guardando documentos na pasta do aluno:
 * escrever, formatar, usar o papel pautado e baixar o arquivo funcionam
 * sem sessão nenhuma, e a própria tela avisa que é preciso entrar na área
 * do aluno para salvar. Deixá-lo fora só escondia a ferramenta de quem
 * queria usá-la para escrever na hora.
 *
 * A lista começa com a calculadora e cresce conforme a escola quiser abrir
 * mais — basta acrescentar o slug.
 */
export const FERRAMENTAS_PUBLICAS = [
  "atividades-por-habilidade",
  "calculadora",
  "editor-texto",
  "mesa-formas",
  "montar-fracoes",
  "comparar-fracoes",
  "fracoes-equivalentes",
  "porcentagem",
  "matematica-dia-a-dia",
  "tabuada-ilustrada",
  "completar-tabuada",
  "memoria-tabuada",
  "desafio-operacoes",
  "fabrica-problemas",
  "conversor-medidas",
  "quanto-mede",
  "valor-posicional",
  "jogo-numeros",
  "producao-textual",
  "generos-textuais",
  "central-alfabetizacao",
  "parque-letras",
  "sala-de-jogos",
] as const;

export function listarFerramentasPublicas(): FerramentaInfo[] {
  return FERRAMENTAS.filter((f) => (FERRAMENTAS_PUBLICAS as readonly string[]).includes(f.slug));
}

export function ferramentaPublica(slug: string): FerramentaInfo | undefined {
  return listarFerramentasPublicas().find((f) => f.slug === slug);
}
