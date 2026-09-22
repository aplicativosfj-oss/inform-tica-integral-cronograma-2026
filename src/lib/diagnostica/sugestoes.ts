import { CATALOGO, chaveHab, type Entrada } from "@/lib/recomposicao/catalogo";

/**
 * Liga uma habilidade da avaliação às atividades de recomposição que já
 * existem no site, para que o raio-X termine em "o que fazer" e não em mais
 * um número.
 *
 * O encaixe é tentado em três camadas, da mais confiável para a mais frouxa:
 *
 * 1. **Código do descritor** (ex.: `3M2.1`). Só a Matemática tem código na
 *    prova, e o catálogo guarda exatamente esses códigos — quando bate, é
 *    certeza.
 * 2. **Texto igual** ao de uma habilidade cadastrada na atividade, ignorando
 *    acento e caixa. É o caminho de Português e Ciências.
 * 3. **Palavras em comum.** Último recurso, exigindo pelo menos duas palavras
 *    de conteúdo iguais, porque as duas aplicações escrevem a mesma
 *    habilidade com palavras diferentes ("ler gráficos de colunas simples" e
 *    "ler dados expressos em gráficos de colunas").
 *
 * Sem encaixe, devolve lista vazia: é melhor não sugerir nada do que mandar
 * a criança para uma atividade que não trata da dificuldade dela.
 */

/** Palavras que não ajudam a distinguir uma habilidade de outra. */
const VAZIAS = new Set([
  "para",
  "pelo",
  "pela",
  "como",
  "mais",
  "dois",
  "uma",
  "um",
  "de",
  "da",
  "do",
  "das",
  "dos",
  "em",
  "no",
  "na",
  "nos",
  "nas",
  "ou",
  "e",
  "a",
  "o",
  "as",
  "os",
  "que",
  "com",
  "por",
  "sua",
  "seu",
  "entre",
  "sobre",
  "texto",
  "textos",
  "problema",
  "problemas",
  "utilizando",
  "diferentes",
  "sendo",
  "ate",
]);

/**
 * Reduz a palavra a um radical simples. Sem isso "adições" e "adição" não se
 * encontram, e as duas provas escrevem a mesma habilidade ora no plural, ora
 * no singular ("resolver problemas de adição" x "calcular adições").
 */
function radical(p: string): string {
  return p
    .replace(/oes$/, "ao")
    .replace(/aes$/, "ao")
    .replace(/ns$/, "m")
    .replace(/eis$/, "el")
    .replace(/s$/, "");
}

function palavras(texto: string): Set<string> {
  return new Set(
    chaveHab(texto)
      .replace(/[^a-z0-9 ]/g, " ")
      .split(" ")
      .filter((p) => p.length > 3 && !VAZIAS.has(p))
      .map(radical),
  );
}

function emComum(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const p of a) if (b.has(p)) n += 1;
  return n;
}

export interface Sugestao {
  entrada: Entrada;
  /** Como a atividade foi encontrada — serve para o texto de apoio na tela. */
  encaixe: "codigo" | "texto" | "palavras";
}

/**
 * Atividades do catálogo que trabalham uma habilidade, na série e disciplina
 * dela. `limite` segura a lista num tamanho que o professor consegue olhar.
 */
export function atividadesParaHabilidade(
  serie: number,
  disc: string,
  habilidade: string,
  limite = 3,
  /**
   * Só ligue o casamento por código quando a habilidade vier da **II**
   * Avaliação. Os códigos não são estáveis entre as duas aplicações: na I,
   * `3M1.7` é "calcular o resultado de adições"; na II, o mesmo `3M1.7` é
   * "usar dinheiro no dia a dia", e o catálogo segue a II. Casar por código
   * numa habilidade da I mandaria a turma para a atividade errada.
   */
  usarCodigo = true,
): Sugestao[] {
  const daSerie = CATALOGO.filter((e) => e.serie === serie && e.disc === disc);
  if (daSerie.length === 0) return [];

  const codigo = usarCodigo ? /(\d[A-Z]\d\.\d+)/.exec(habilidade)?.[1] : undefined;
  if (codigo) {
    const porCodigo = daSerie.filter((e) => e.descritores.includes(codigo));
    if (porCodigo.length > 0) {
      return porCodigo.slice(0, limite).map((entrada) => ({ entrada, encaixe: "codigo" as const }));
    }
  }

  const alvoLimpo = chaveHab(habilidade.replace(/^\d[A-Z]\d\.\d+\s*[-–]?\s*/, ""));
  const porTexto = daSerie.filter((e) => e.habilidades.some((h) => chaveHab(h) === alvoLimpo));
  if (porTexto.length > 0) {
    return porTexto.slice(0, limite).map((entrada) => ({ entrada, encaixe: "texto" as const }));
  }

  const alvo = palavras(habilidade);
  if (alvo.size === 0) return [];
  return daSerie
    .map((entrada) => {
      const base = [...entrada.habilidades, entrada.titulo, entrada.conteudo];
      const nota = Math.max(...base.map((t) => emComum(alvo, palavras(t))));
      return { entrada, nota };
    })
    .filter((x) => x.nota >= 2)
    .sort((a, b) => b.nota - a.nota)
    .slice(0, limite)
    .map((x) => ({ entrada: x.entrada, encaixe: "palavras" as const }));
}

/** Link da ferramenta de atividades já filtrada na série e disciplina certas. */
export function linkAtividades(serie: number, disc: string): string {
  return `/ferramentas/atividades-por-habilidade?serie=${serie}&disc=${disc}`;
}
