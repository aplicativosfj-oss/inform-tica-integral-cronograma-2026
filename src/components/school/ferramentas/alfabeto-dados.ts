/**
 * O alfabeto e as palavras da alfabetização, com o que cada jogo precisa:
 * a figura, a separação em sílabas e a categoria.
 *
 * As palavras foram escolhidas por três critérios: ter desenho reconhecível,
 * ser palavra do dia a dia da criança daqui, e cobrir o alfabeto inteiro —
 * inclusive as letras difíceis de ilustrar, que ganham as poucas palavras
 * possíveis.
 */

export type Categoria =
  "fruta" | "animal" | "objeto" | "cor" | "roupa" | "transporte" | "natureza" | "lugar";

export interface Palavra {
  /** Como se escreve, com acento. */
  texto: string;
  /** A chave do desenho (sem acento, para casar com o banco de figuras). */
  figura: string;
  silabas: string[];
  categoria: Categoria;
}

export const CATEGORIAS: { id: Categoria; nome: string; emoji: string }[] = [
  { id: "fruta", nome: "Frutas", emoji: "🍎" },
  { id: "animal", nome: "Animais", emoji: "🐶" },
  { id: "objeto", nome: "Objetos", emoji: "🎒" },
  { id: "cor", nome: "Cores", emoji: "🎨" },
  { id: "roupa", nome: "Roupas", emoji: "👕" },
  { id: "transporte", nome: "Transportes", emoji: "🚗" },
  { id: "natureza", nome: "Natureza", emoji: "🌳" },
  { id: "lugar", nome: "Lugares", emoji: "🏫" },
];

export const PALAVRAS: Palavra[] = [
  // frutas
  { texto: "abacaxi", figura: "abacaxi", silabas: ["a", "ba", "ca", "xi"], categoria: "fruta" },
  { texto: "banana", figura: "banana", silabas: ["ba", "na", "na"], categoria: "fruta" },
  { texto: "laranja", figura: "laranja", silabas: ["la", "ran", "ja"], categoria: "fruta" },
  { texto: "maçã", figura: "maca", silabas: ["ma", "çã"], categoria: "fruta" },
  { texto: "uva", figura: "uva", silabas: ["u", "va"], categoria: "fruta" },
  { texto: "melancia", figura: "melancia", silabas: ["me", "lan", "ci", "a"], categoria: "fruta" },
  { texto: "jaca", figura: "jaca", silabas: ["ja", "ca"], categoria: "fruta" },
  { texto: "kiwi", figura: "kiwi", silabas: ["ki", "wi"], categoria: "fruta" },
  // animais
  { texto: "abelha", figura: "abelha", silabas: ["a", "be", "lha"], categoria: "animal" },
  {
    texto: "borboleta",
    figura: "borboleta",
    silabas: ["bor", "bo", "le", "ta"],
    categoria: "animal",
  },
  { texto: "cachorro", figura: "cachorro", silabas: ["ca", "chor", "ro"], categoria: "animal" },
  { texto: "gato", figura: "gato", silabas: ["ga", "to"], categoria: "animal" },
  { texto: "elefante", figura: "elefante", silabas: ["e", "le", "fan", "te"], categoria: "animal" },
  { texto: "galinha", figura: "galinha", silabas: ["ga", "li", "nha"], categoria: "animal" },
  { texto: "jacaré", figura: "jacare", silabas: ["ja", "ca", "ré"], categoria: "animal" },
  { texto: "leão", figura: "leao", silabas: ["le", "ão"], categoria: "animal" },
  { texto: "macaco", figura: "macaco", silabas: ["ma", "ca", "co"], categoria: "animal" },
  { texto: "onça", figura: "onca", silabas: ["on", "ça"], categoria: "animal" },
  { texto: "pato", figura: "pato", silabas: ["pa", "to"], categoria: "animal" },
  { texto: "peixe", figura: "peixe", silabas: ["pei", "xe"], categoria: "animal" },
  { texto: "rato", figura: "rato", silabas: ["ra", "to"], categoria: "animal" },
  { texto: "sapo", figura: "sapo", silabas: ["sa", "po"], categoria: "animal" },
  { texto: "tatu", figura: "tatu", silabas: ["ta", "tu"], categoria: "animal" },
  { texto: "urso", figura: "urso", silabas: ["ur", "so"], categoria: "animal" },
  { texto: "vaca", figura: "vaca", silabas: ["va", "ca"], categoria: "animal" },
  { texto: "zebra", figura: "zebra", silabas: ["ze", "bra"], categoria: "animal" },
  {
    texto: "hipopótamo",
    figura: "hipopotamo",
    silabas: ["hi", "po", "pó", "ta", "mo"],
    categoria: "animal",
  },
  // objetos
  { texto: "bola", figura: "bola", silabas: ["bo", "la"], categoria: "objeto" },
  { texto: "dado", figura: "dado", silabas: ["da", "do"], categoria: "objeto" },
  { texto: "faca", figura: "faca", silabas: ["fa", "ca"], categoria: "objeto" },
  { texto: "janela", figura: "janela", silabas: ["ja", "ne", "la"], categoria: "objeto" },
  { texto: "lápis", figura: "lapis", silabas: ["lá", "pis"], categoria: "objeto" },
  { texto: "livro", figura: "livro", silabas: ["li", "vro"], categoria: "objeto" },
  { texto: "mesa", figura: "mesa", silabas: ["me", "sa"], categoria: "objeto" },
  { texto: "mochila", figura: "mochila", silabas: ["mo", "chi", "la"], categoria: "objeto" },
  { texto: "óculos", figura: "oculos", silabas: ["ó", "cu", "los"], categoria: "objeto" },
  { texto: "ovo", figura: "ovo", silabas: ["o", "vo"], categoria: "objeto" },
  { texto: "panela", figura: "panela", silabas: ["pa", "ne", "la"], categoria: "objeto" },
  { texto: "queijo", figura: "queijo", silabas: ["quei", "jo"], categoria: "objeto" },
  { texto: "relógio", figura: "relogio", silabas: ["re", "ló", "gi", "o"], categoria: "objeto" },
  { texto: "xícara", figura: "xicara", silabas: ["xí", "ca", "ra"], categoria: "objeto" },
  // cores
  { texto: "azul", figura: "azul", silabas: ["a", "zul"], categoria: "cor" },
  { texto: "amarelo", figura: "amarelo", silabas: ["a", "ma", "re", "lo"], categoria: "cor" },
  { texto: "vermelho", figura: "vermelho", silabas: ["ver", "me", "lho"], categoria: "cor" },
  { texto: "verde", figura: "verde", silabas: ["ver", "de"], categoria: "cor" },
  { texto: "roxo", figura: "roxo", silabas: ["ro", "xo"], categoria: "cor" },
  { texto: "rosa", figura: "rosa", silabas: ["ro", "sa"], categoria: "cor" },
  { texto: "preto", figura: "preto", silabas: ["pre", "to"], categoria: "cor" },
  { texto: "branco", figura: "branco", silabas: ["bran", "co"], categoria: "cor" },
  { texto: "marrom", figura: "marrom", silabas: ["mar", "rom"], categoria: "cor" },
  { texto: "cinza", figura: "cinza", silabas: ["cin", "za"], categoria: "cor" },
  // roupas
  { texto: "camisa", figura: "camisa", silabas: ["ca", "mi", "sa"], categoria: "roupa" },
  { texto: "sapato", figura: "sapato", silabas: ["sa", "pa", "to"], categoria: "roupa" },
  { texto: "vestido", figura: "vestido", silabas: ["ves", "ti", "do"], categoria: "roupa" },
  { texto: "tênis", figura: "tenis", silabas: ["tê", "nis"], categoria: "roupa" },
  // transportes
  { texto: "avião", figura: "aviao", silabas: ["a", "vi", "ão"], categoria: "transporte" },
  {
    texto: "bicicleta",
    figura: "bicicleta",
    silabas: ["bi", "ci", "cle", "ta"],
    categoria: "transporte",
  },
  { texto: "carro", figura: "carro", silabas: ["car", "ro"], categoria: "transporte" },
  { texto: "navio", figura: "navio", silabas: ["na", "vi", "o"], categoria: "transporte" },
  { texto: "trem", figura: "trem", silabas: ["trem"], categoria: "transporte" },
  // natureza
  { texto: "sol", figura: "sol", silabas: ["sol"], categoria: "natureza" },
  { texto: "lua", figura: "lua", silabas: ["lu", "a"], categoria: "natureza" },
  { texto: "nuvem", figura: "nuvem", silabas: ["nu", "vem"], categoria: "natureza" },
  { texto: "árvore", figura: "arvore", silabas: ["ár", "vo", "re"], categoria: "natureza" },
  { texto: "estrela", figura: "estrela", silabas: ["es", "tre", "la"], categoria: "natureza" },
  { texto: "flor", figura: "flor", silabas: ["flor"], categoria: "natureza" },
  // lugares
  { texto: "casa", figura: "casa", silabas: ["ca", "sa"], categoria: "lugar" },
  { texto: "escola", figura: "escola", silabas: ["es", "co", "la"], categoria: "lugar" },
  { texto: "igreja", figura: "igreja", silabas: ["i", "gre", "ja"], categoria: "lugar" },
];

/* ------------------------------------------------------------------ */
/* Alfabeto                                                            */
/* ------------------------------------------------------------------ */

export const VOGAIS = ["A", "E", "I", "O", "U"];

export const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function ehVogal(letra: string): boolean {
  return VOGAIS.includes(letra.toUpperCase());
}

/** Tira acento e cedilha para comparar a letra inicial da palavra. */
export function semAcento(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function palavrasComLetra(letra: string): Palavra[] {
  const l = letra.toLowerCase();
  return PALAVRAS.filter((p) => semAcento(p.texto)[0]!.toLowerCase() === l);
}

export function palavrasDaCategoria(c: Categoria): Palavra[] {
  return PALAVRAS.filter((p) => p.categoria === c);
}

/** As letras que têm pelo menos uma palavra com figura. */
export const LETRAS_COM_PALAVRA = ALFABETO.filter((l) => palavrasComLetra(l).length > 0);
