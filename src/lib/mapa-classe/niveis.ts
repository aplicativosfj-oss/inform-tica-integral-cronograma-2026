import type { NivelEscrita, NivelLeitura } from "@/lib/mapa-classe/tipos";

export type Zona = "prioridade" | "avanco" | "consolidado";

export interface NivelInfo<T extends string> {
  id: T;
  nome: string;
  zona: Zona;
  /** Classe de cor (fundo) da barra. */
  cor: string;
  significa: string;
  acao: string;
}

/** Do nível mais baixo (E) ao mais alto (A), na ordem em que as barras são desenhadas. */
export const LEITURA: NivelInfo<NivelLeitura>[] = [
  {
    id: "E",
    nome: "Não lê",
    zona: "prioridade",
    cor: "bg-red-500",
    significa: "Ainda não relaciona letras e sons para ler palavras.",
    acao: "Consciência fonológica (rimas, sílabas, sons iniciais), relação letra-som com o alfabeto móvel e atendimento diário em pequeno grupo.",
  },
  {
    id: "D",
    nome: "Lê sílabas ou palavras simples",
    zona: "prioridade",
    cor: "bg-orange-500",
    significa: "Lê sílabas e palavras de estrutura simples, mas ainda não lê frases com autonomia.",
    acao: "Leitura de palavras e frases curtas, listas, legendas e parlendas conhecidas; ampliar as famílias silábicas aos poucos.",
  },
  {
    id: "C",
    nome: "Lê com dificuldade",
    zona: "avanco",
    cor: "bg-amber-400",
    significa: "Lê textos curtos, mas silabando, voltando e errando palavras mais complexas.",
    acao: "Releitura de textos curtos já conhecidos, trava-línguas e leitura em dupla; trabalhar sílabas complexas (lh, nh, br, tr).",
  },
  {
    id: "B",
    nome: "Lê pausadamente",
    zona: "avanco",
    cor: "bg-lime-500",
    significa: "Decodifica bem, mas com pausas e pouco ritmo.",
    acao: "Leitura em voz alta todos os dias, leitura compartilhada e gravação da própria leitura para ouvir e melhorar.",
  },
  {
    id: "A",
    nome: "Lê com fluência",
    zona: "consolidado",
    cor: "bg-emerald-500",
    significa: "Lê com ritmo, entonação e compreensão.",
    acao: "Textos mais longos e variados, inferência, leitura de estudo e de lazer; convidar para ler em voz alta para a turma.",
  },
];

/** 1º e 2º anos: hipóteses de escrita (psicogênese). */
export const ESCRITA_INICIAL: NivelInfo<NivelEscrita>[] = [
  {
    id: "E",
    nome: "Escrita não alfabética",
    zona: "prioridade",
    cor: "bg-red-600",
    significa: "Rabiscos, desenhos ou letras soltas, sem ligação com o som da fala.",
    acao: "Escrever o próprio nome e palavras do dia a dia com apoio, explorar letras e sons; atendimento individual.",
  },
  {
    id: "D",
    nome: "Pré-silábico",
    zona: "prioridade",
    cor: "bg-red-400",
    significa: "Usa letras, mas ainda sem relacionar com os sons das sílabas.",
    acao: "Nome próprio, lista de nomes da turma e palavras estáveis; refletir sobre quantas letras e quantas partes tem a palavra.",
  },
  {
    id: "C3",
    nome: "Silábico sem valor sonoro",
    zona: "prioridade",
    cor: "bg-orange-500",
    significa: "Uma letra para cada sílaba, mas sem ligação com o som.",
    acao: "Escrita de palavras com letras móveis, comparando som e letra; agrupamento com colegas em hipótese próxima.",
  },
  {
    id: "C2",
    nome: "Silábico com valor sonoro",
    zona: "avanco",
    cor: "bg-amber-400",
    significa: "Uma letra por sílaba, e a letra corresponde ao som.",
    acao: "Desafiar com palavras de duas letras por sílaba e comparar com a escrita convencional.",
  },
  {
    id: "C1",
    nome: "Silábico-alfabético",
    zona: "avanco",
    cor: "bg-yellow-300",
    significa: "Mistura sílabas escritas com uma letra e outras completas.",
    acao: "Escrita de listas e legendas, revisando a palavra com a turma; completar letras que faltam.",
  },
  {
    id: "B",
    nome: "Alfabética com erros ortográficos",
    zona: "consolidado",
    cor: "bg-lime-500",
    significa: "Escreve todos os sons, com trocas ortográficas.",
    acao: "Reescrita e revisão de textos curtos; regularidades ortográficas (r/rr, s/ss, m antes de p e b).",
  },
  {
    id: "A",
    nome: "Alfabética sem erros ortográficos",
    zona: "consolidado",
    cor: "bg-emerald-500",
    significa: "Escreve alfabeticamente, com poucos ou nenhum erro de ortografia.",
    acao: "Produção de textos maiores, com planejamento e revisão.",
  },
];

/** 3º ao 5º ano: escrita por quantidade de erros ortográficos. */
export const ESCRITA_FINAL: NivelInfo<NivelEscrita>[] = [
  {
    id: "E",
    nome: "Escrita não alfabética",
    zona: "prioridade",
    cor: "bg-red-600",
    significa: "Ainda não escreve alfabeticamente.",
    acao: "Intervenção individual na relação letra-som e escrita de palavras e frases curtas, com acompanhamento diário.",
  },
  {
    id: "D",
    nome: "Alfabética, acima de 9 erros",
    zona: "avanco",
    cor: "bg-orange-500",
    significa: "Escreve alfabeticamente, mas com muitos erros ortográficos.",
    acao: "Revisão guiada de textos, ditado de palavras com regularidades e lista de palavras de uso frequente.",
  },
  {
    id: "C",
    nome: "Alfabética, 5 a 8 erros",
    zona: "avanco",
    cor: "bg-amber-400",
    significa: "Escreve bem, mas ainda erra em regularidades e em palavras comuns.",
    acao: "Oficinas curtas de ortografia e revisão de textos em duplas com lista de conferência.",
  },
  {
    id: "B",
    nome: "Alfabética, 1 a 4 erros",
    zona: "consolidado",
    cor: "bg-lime-500",
    significa: "Escreve com poucos erros.",
    acao: "Revisão final do próprio texto e consulta ao dicionário.",
  },
  {
    id: "A",
    nome: "Alfabética sem erros ortográficos",
    zona: "consolidado",
    cor: "bg-emerald-500",
    significa: "Escreve sem erros de ortografia.",
    acao: "Produção de gêneros variados, com foco em coesão e coerência.",
  },
];

export const escritaDoAno = (ano: number) => (ano <= 2 ? ESCRITA_INICIAL : ESCRITA_FINAL);

export const ZONAS: Record<Zona, { nome: string; texto: string }> = {
  prioridade: { nome: "Prioridade", texto: "precisa de intervenção diária" },
  avanco: { nome: "Em avanço", texto: "está progredindo e precisa de apoio" },
  consolidado: { nome: "Consolidado", texto: "já domina o nível esperado" },
};
