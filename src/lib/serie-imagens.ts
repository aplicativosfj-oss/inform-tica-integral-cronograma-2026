import serie1 from "@/assets/alunos-1.jpg";
import serie2 from "@/assets/alunos-2.jpg";
import serie3 from "@/assets/alunos-3.jpg";
import serie4 from "@/assets/image10.jpeg";
import serie5 from "@/assets/image4.png";

/**
 * Uma foto por série, para o relógio da aula ao vivo mudar de cara conforme a
 * turma que está no laboratório. São fotos reais da escola — nada genérico e
 * nada gerado.
 *
 * A chave é o número da série, não o texto completo, porque o cadastro escreve
 * "1º Ano" mas nada impede que vire "1° ano" ou "1º ANO" numa edição futura.
 */
const POR_NUMERO: Record<number, string> = {
  1: serie1,
  2: serie2,
  3: serie3,
  4: serie4,
  5: serie5,
};

export function imagemDaSerie(serie: string): string {
  const numero = Number(serie.match(/\d+/)?.[0]);
  return POR_NUMERO[numero] ?? serie1;
}
