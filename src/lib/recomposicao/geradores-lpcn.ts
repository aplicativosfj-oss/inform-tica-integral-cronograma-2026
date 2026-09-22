import type { Questao } from "@/components/school/ferramentas/quiz";
import type { Gerador, Nivel, Serie } from "@/lib/recomposicao/geradores";

/**
 * Geradores de exercícios de Português e Ciências para a recomposição das
 * aprendizagens. Como os de Matemática, montam questões novas a cada
 * chamada — o aluno treina quantas vezes quiser sem decorar as respostas.
 *
 * Só existe gerador onde a variação faz sentido (rimas, sílabas, pontuação,
 * classificação de animais, estados da água, lixo reciclável...). Leitura e
 * interpretação continuam no banco escrito à mão (banco-lp.ts / banco-cn.ts),
 * porque dependem de um texto bem construído.
 */

// ─── utilitários ─────────────────────────────────────────────────────────────

const pick = <T,>(lista: readonly T[]): T => lista[Math.floor(Math.random() * lista.length)]!;

const embaralhar = <T,>(lista: readonly T[]): T[] => {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j]!, copia[i]!];
  }
  return copia;
};

/** `n` itens diferentes da lista, em ordem aleatória. */
const alguns = <T,>(lista: readonly T[], n: number): T[] => embaralhar(lista).slice(0, n);

let contador = 0;
/** Monta a questão com opções únicas e embaralhadas; a correta é sempre `certa`. */
function montar(enunciado: string, certa: string, distratores: readonly string[], explicacao: string): Questao {
  const outras: string[] = [];
  for (const d of distratores) {
    if (d !== certa && !outras.includes(d)) outras.push(d);
    if (outras.length === 3) break;
  }
  const opcoes = embaralhar([certa, ...outras]);
  contador += 1;
  return { id: `glc${contador}`, enunciado, opcoes, respostaCorreta: opcoes.indexOf(certa), explicacao };
}

const maiuscula = (p: string) => p.charAt(0).toUpperCase() + p.slice(1);

// ═════════════════════════════════════════════════════════════════════════════
// PORTUGUÊS
// ═════════════════════════════════════════════════════════════════════════════

// ─── 1. rimas ────────────────────────────────────────────────────────────────

/** Famílias de palavras que rimam entre si (mesmo som final). */
const RIMAS: readonly (readonly string[])[] = [
  ["gato", "pato", "rato", "sapato", "mato"],
  ["bola", "sacola", "escola", "cola", "viola"],
  ["mão", "pão", "chão", "irmão", "balão"],
  ["casa", "asa", "brasa", "rasa"],
  ["flor", "cor", "amor", "calor", "tambor"],
  ["janela", "panela", "amarela", "vela", "estrela"],
  ["dedo", "medo", "cedo", "brinquedo", "enredo"],
  ["barriga", "formiga", "amiga", "cantiga", "figa"],
  ["menino", "sino", "destino", "hino"],
  ["coração", "canção", "feijão", "colchão", "violão"],
  ["cavalo", "galo", "intervalo", "abalo"],
  ["peixe", "deixe", "feixe"],
  ["macaco", "buraco", "saco", "fraco"],
  ["bonito", "palito", "grito", "escrito"],
  ["chuva", "uva", "luva"],
  ["cadeira", "bananeira", "figueira", "poeira", "madeira"],
];

/** Pares de versos: o 2º verso termina na palavra que rima. */
const VERSINHOS: readonly { verso: string; certa: string; erradas: readonly string[] }[] = [
  { verso: "O sapo não lava o pé,<br>não lava porque não ___", certa: "quer", erradas: ["quis", "gosta", "pode"] },
  { verso: "A bola caiu no chão,<br>o cachorro pegou o ___", certa: "balão", erradas: ["brinquedo", "osso", "doce"] },
  { verso: "Na janela da escola<br>tem um vaso e uma ___", certa: "sacola", erradas: ["planta", "cadeira", "flor"] },
  { verso: "O gato dorme no mato,<br>calçando um velho ___", certa: "sapato", erradas: ["chinelo", "tênis", "casaco"] },
  { verso: "Minha avó tem uma flor<br>que perfuma com ___", certa: "amor", erradas: ["carinho", "cheiro", "beleza"] },
  { verso: "Lá no alto da figueira<br>voa a última ___", certa: "poeira", erradas: ["folha", "abelha", "borboleta"] },
  { verso: "Vou comer pão com feijão<br>e depois tocar ___", certa: "violão", erradas: ["pandeiro", "flauta", "tambor"] },
  { verso: "A formiga carregou<br>uma folha e uma ___", certa: "figa", erradas: ["pedra", "semente", "casca"] },
  { verso: "Meu caderno de dever<br>tem tudo o que eu quis ___", certa: "escrever", erradas: ["anotar", "desenhar", "guardar"] },
  { verso: "O peixinho no aquário<br>nada sem pressa e sem ___", certa: "horário", erradas: ["destino", "rumo", "medo"] },
  { verso: "Na varanda da vovó<br>o gatinho dorme ___", certa: "só", erradas: ["sozinho", "quietinho", "à toa"] },
  { verso: "O menino pegou a mala<br>e saiu correndo da ___", certa: "sala", erradas: ["casa", "escola", "cozinha"] },
];

function rimas(_s: Serie, nivel: Nivel): Questao {
  if (nivel === "retomada") {
    const familia = pick(RIMAS);
    const [alvo, certa] = alguns(familia, 2) as [string, string];
    const erradas = alguns(
      RIMAS.filter((f) => f !== familia).flatMap((f) => [...f]),
      3,
    );
    return montar(
      `Qual palavra RIMA com ${alvo.toUpperCase()}?`,
      certa,
      erradas,
      `${maiuscula(alvo)} e ${certa} terminam com o mesmo som: por isso rimam.`,
    );
  }
  if (nivel === "pratica") {
    const familia = pick(RIMAS);
    const tres = alguns(familia, 3);
    const intruso = pick(RIMAS.filter((f) => f !== familia).flatMap((f) => [...f]));
    const lista = embaralhar([...tres, intruso]);
    return montar(
      `Leia as palavras: ${lista.map((p) => p.toUpperCase()).join(" · ")}. Qual delas NÃO rima com as outras?`,
      intruso,
      tres,
      `${tres.join(", ")} terminam com o mesmo som. ${maiuscula(intruso)} termina diferente.`,
    );
  }
  const v = pick(VERSINHOS);
  return montar(
    `Complete o versinho para que ele RIME:<br><br><em>${v.verso}</em>`,
    v.certa,
    v.erradas,
    `Só “${v.certa}” termina com o mesmo som do verso de cima — é isso que faz a rima.`,
  );
}

// ─── 2. sílabas ──────────────────────────────────────────────────────────────

/** Palavras já separadas em sílabas. */
const SILABAS: readonly (readonly string[])[] = [
  ["bo", "la"],
  ["ca", "sa"],
  ["ga", "to"],
  ["pa", "to"],
  ["de", "do"],
  ["mão"],
  ["pão"],
  ["flor"],
  ["sol"],
  ["mar"],
  ["ja", "ne", "la"],
  ["ca", "der", "no"],
  ["bo", "ne", "ca"],
  ["ca", "va", "lo"],
  ["me", "ni", "na"],
  ["sa", "pa", "to"],
  ["es", "co", "la"],
  ["pro", "fes", "so", "ra"],
  ["bor", "bo", "le", "ta"],
  ["bi", "ci", "cle", "ta"],
  ["cho", "co", "la", "te"],
  ["te", "le", "fo", "ne"],
  ["me", "lan", "cia"],
  ["a", "ba", "ca", "xi"],
  ["ge", "la", "dei", "ra"],
  ["com", "pu", "ta", "dor"],
  ["re", "fri", "ge", "ran", "te"],
  ["ca", "chor", "ri", "nho"],
];

const junta = (s: readonly string[]) => s.join("");
const CONTA_NOMES = ["uma", "duas", "três", "quatro", "cinco", "seis"];

function silabas(_s: Serie, nivel: Nivel): Questao {
  if (nivel === "retomada") {
    const p = pick(SILABAS.filter((x) => x.length <= 3));
    const n = p.length;
    const erradas = [n + 1, n - 1, n + 2, n - 2].filter((x) => x >= 1 && x <= 6).map((x) => String(x));
    return montar(
      `Bata palmas e conte: quantas SÍLABAS tem a palavra ${junta(p).toUpperCase()}?`,
      String(n),
      erradas,
      `${junta(p).toUpperCase()} = ${p.join(" - ")}: são ${CONTA_NOMES[n - 1]} sílabas.`,
    );
  }
  if (nivel === "pratica") {
    const p = pick(SILABAS.filter((x) => x.length >= 3));
    const certa = p.join(" - ");
    const erradas = [
      [p[0]! + p[1]!, ...p.slice(2)].join(" - "),
      [...p.slice(0, -2), p[p.length - 2]! + p[p.length - 1]!].join(" - "),
      junta(p).split("").join(" - "),
    ];
    return montar(
      `Qual é a separação CERTA das sílabas de ${junta(p).toUpperCase()}?`,
      certa,
      erradas,
      `Cada sílaba é um “bloco” que sai numa palma só: ${certa}.`,
    );
  }
  const quatro = alguns(SILABAS, 4);
  const maior = [...quatro].sort((a, b) => b.length - a.length)[0]!;
  const empate = quatro.filter((p) => p.length === maior.length).length > 1;
  if (empate) return silabas(_s, "pratica");
  return montar(
    "Qual destas palavras tem MAIS sílabas?",
    junta(maior).toUpperCase(),
    quatro.filter((p) => p !== maior).map((p) => junta(p).toUpperCase()),
    `${junta(maior).toUpperCase()} = ${maior.join(" - ")}: ${CONTA_NOMES[maior.length - 1]} sílabas, mais que as outras.`,
  );
}

// ─── 3. pontuação ────────────────────────────────────────────────────────────

const FRASES_PONTO: readonly { frase: string; sinal: string; por: string }[] = [
  { frase: "Você quer brincar comigo", sinal: "?", por: "é uma pergunta" },
  { frase: "Que susto eu levei", sinal: "!", por: "mostra emoção (susto)" },
  { frase: "Hoje a aula começa às sete horas", sinal: ".", por: "só informa uma coisa" },
  { frase: "Onde você guardou meu caderno", sinal: "?", por: "é uma pergunta" },
  { frase: "Cuidado com o degrau", sinal: "!", por: "é um aviso forte" },
  { frase: "A biblioteca fica no segundo andar", sinal: ".", por: "só informa uma coisa" },
  { frase: "Que bolo delicioso", sinal: "!", por: "mostra alegria" },
  { frase: "Quantos anos você tem", sinal: "?", por: "é uma pergunta" },
  { frase: "Minha irmã chegou de viagem ontem", sinal: ".", por: "só informa uma coisa" },
  { frase: "Socorro, o gato subiu no telhado", sinal: "!", por: "é um pedido de socorro, cheio de emoção" },
];

const NOMES_SINAL: Record<string, string> = {
  ".": "ponto final (.)",
  "?": "ponto de interrogação (?)",
  "!": "ponto de exclamação (!)",
};

const USOS_PONTO: readonly { frase: string; destaque: string; uso: string; erradas: readonly string[] }[] = [
  {
    frase: "Comprei arroz, feijão, ovos e farinha.",
    destaque: "as vírgulas",
    uso: "separar os itens de uma lista",
    erradas: ["fazer uma pergunta", "mostrar espanto", "terminar o texto"],
  },
  {
    frase: "A professora avisou: amanhã tem prova.",
    destaque: "os dois-pontos",
    uso: "anunciar o que vem a seguir",
    erradas: ["separar uma lista", "mostrar alegria", "indicar dúvida"],
  },
  {
    frase: "— Bom dia, dona Maria! — disse o menino.",
    destaque: "o travessão (—)",
    uso: "marcar a fala de um personagem",
    erradas: ["separar uma lista", "fazer uma pergunta", "terminar a história"],
  },
  {
    frase: "Eu ia contar, mas agora não sei...",
    destaque: "as reticências (...)",
    uso: "mostrar que a ideia ficou no ar",
    erradas: ["fazer uma pergunta", "separar uma lista", "marcar uma fala"],
  },
  {
    frase: "Vamos comer, crianças!",
    destaque: "a vírgula",
    uso: "separar o nome de quem está sendo chamado",
    erradas: ["mostrar o que vai ser comido", "fazer uma pergunta", "indicar uma pausa longa"],
  },
  {
    frase: "O quê?! Você pintou o cachorro de azul?",
    destaque: "a interrogação com exclamação (?!)",
    uso: "mostrar pergunta com espanto",
    erradas: ["encerrar uma lista", "marcar uma fala", "indicar uma explicação"],
  },
  {
    frase: "Meu tio, que mora em Salvador, chegou hoje.",
    destaque: "as vírgulas do meio",
    uso: "isolar uma explicação dentro da frase",
    erradas: ["separar uma lista", "marcar uma fala", "mostrar emoção"],
  },
  {
    frase: "Ela perguntou se eu iria à festa.",
    destaque: "o ponto final",
    uso: "encerrar uma frase que apenas informa",
    erradas: ["mostrar uma pergunta direta", "marcar uma fala", "separar uma lista"],
  },
  {
    frase: "Atenção, alunos: a saída será pelo portão dos fundos.",
    destaque: "a vírgula e os dois-pontos",
    uso: "chamar quem ouve e depois anunciar o aviso",
    erradas: ["fazer duas perguntas", "separar uma lista de nomes", "mostrar espanto"],
  },
  {
    frase: "Meu pai disse que chegaria “logo, logo”.",
    destaque: "as aspas",
    uso: "marcar as palavras exatas de outra pessoa",
    erradas: ["separar uma lista", "fazer uma pergunta", "encerrar o texto"],
  },
];

function pontuacao(_s: Serie, nivel: Nivel): Questao {
  if (nivel === "retomada") {
    const f = pick(FRASES_PONTO);
    return montar(
      `Qual sinal completa a frase?<br><br><em>${f.frase} ___</em>`,
      NOMES_SINAL[f.sinal]!,
      Object.values(NOMES_SINAL).filter((s) => s !== NOMES_SINAL[f.sinal]),
      `A frase ${f.por}: por isso termina com ${NOMES_SINAL[f.sinal]}.`,
    );
  }
  if (nivel === "pratica") {
    const f = pick(FRASES_PONTO);
    const tipo = f.sinal === "?" ? "faz uma pergunta" : f.sinal === "!" ? "mostra emoção" : "dá uma informação";
    return montar(
      `Leia: <em>“${f.frase}${f.sinal}”</em><br>Essa frase:`,
      tipo,
      ["faz uma pergunta", "mostra emoção", "dá uma informação", "apresenta uma lista"].filter((t) => t !== tipo),
      `Pelo sinal ${NOMES_SINAL[f.sinal]}, dá para saber: a frase ${f.por}.`,
    );
  }
  const u = pick(USOS_PONTO);
  return montar(
    `Leia: <em>“${u.frase}”</em><br>Na frase, ${u.destaque} serve(m) para:`,
    u.uso,
    u.erradas,
    `Aqui, ${u.destaque} serve(m) para ${u.uso}.`,
  );
}

// ─── 4. alfabeto e ordem alfabética ──────────────────────────────────────────

const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const PALAVRAS_AZ = [
  "abacaxi", "bola", "casa", "dado", "escola", "faca", "gato", "história", "igreja", "janela",
  "lápis", "mesa", "navio", "ovo", "peixe", "queijo", "rato", "sapato", "tatu", "uva", "vaca", "zebra",
  "amigo", "barco", "chuva", "dedo", "estrela", "flor", "girafa", "ilha", "jacaré", "leite",
  "macaco", "nuvem", "onça", "porta", "relógio", "sol", "tucano", "urso", "vela",
];

function alfabetica(_s: Serie, nivel: Nivel): Questao {
  if (nivel === "retomada") {
    const i = Math.floor(Math.random() * 24);
    const letra = ALFABETO[i]!;
    const certa = ALFABETO[i + 1]!;
    return montar(
      `No alfabeto, qual letra vem LOGO DEPOIS do ${letra}?`,
      certa,
      [ALFABETO[i + 2]!, ALFABETO[i - 1] ?? ALFABETO[i + 3]!, ALFABETO[i + 4] ?? "A"],
      `A ordem é: ... ${ALFABETO[i - 1] ?? ""} ${letra} ${certa} ${ALFABETO[i + 2] ?? ""} ...`,
    );
  }
  if (nivel === "pratica") {
    const quatro: string[] = [];
    const usadas = new Set<string>();
    for (const p of embaralhar(PALAVRAS_AZ)) {
      const l = p[0]!;
      if (usadas.has(l)) continue;
      usadas.add(l);
      quatro.push(p);
      if (quatro.length === 4) break;
    }
    const certa = [...quatro].sort((a, b) => a.localeCompare(b, "pt-BR"))[0]!;
    return montar(
      `Qual destas palavras vem PRIMEIRO no dicionário?<br><br>${quatro.map((p) => p.toUpperCase()).join(" · ")}`,
      certa.toUpperCase(),
      quatro.filter((p) => p !== certa).map((p) => p.toUpperCase()),
      `No dicionário vale a ordem do alfabeto: ${certa.toUpperCase()} começa com a letra mais próxima do A.`,
    );
  }
  // Desafio: duas palavras com a mesma inicial — decide a segunda letra.
  const grupos: Record<string, string[]> = {};
  for (const p of PALAVRAS_AZ) (grupos[p[0]!] ??= []).push(p);
  const g = pick(Object.values(grupos).filter((x) => x.length >= 2));
  const dois = alguns(g, 2);
  const outros = alguns(
    PALAVRAS_AZ.filter((p) => p[0] !== dois[0]![0]),
    2,
  );
  const lista = [...dois, ...outros];
  const certa = [...lista].sort((a, b) => a.localeCompare(b, "pt-BR"))[0]!;
  return montar(
    `Coloque em ordem alfabética. Qual vem PRIMEIRO?<br><br>${embaralhar(lista)
      .map((p) => p.toUpperCase())
      .join(" · ")}`,
    certa.toUpperCase(),
    lista.filter((p) => p !== certa).map((p) => p.toUpperCase()),
    "Quando duas palavras começam com a mesma letra, olhamos a segunda letra — e assim por diante.",
  );
}

// ─── 5. plural e concordância ────────────────────────────────────────────────

const PLURAIS: readonly { s: string; p: string; regra: string; errados: readonly string[] }[] = [
  { s: "casa", p: "casas", regra: "termina em vogal: é só acrescentar S", errados: ["casaes", "casases", "case"] },
  { s: "flor", p: "flores", regra: "termina em R: acrescenta ES", errados: ["flors", "florens", "floris"] },
  { s: "mesa", p: "mesas", regra: "termina em vogal: é só acrescentar S", errados: ["mesaes", "mesases", "mese"] },
  { s: "livro", p: "livros", regra: "termina em vogal: é só acrescentar S", errados: ["livroes", "livris", "livries"] },
  { s: "escola", p: "escolas", regra: "termina em vogal: é só acrescentar S", errados: ["escolaes", "escolases", "escole"] },
  { s: "mulher", p: "mulheres", regra: "termina em R: acrescenta ES", errados: ["mulhers", "mulheris", "mulherens"] },
  { s: "mar", p: "mares", regra: "termina em R: acrescenta ES", errados: ["mars", "maris", "marens"] },
  { s: "cor", p: "cores", regra: "termina em R: acrescenta ES", errados: ["cors", "coris", "corens"] },
  { s: "animal", p: "animais", regra: "termina em AL: troca o L por IS", errados: ["animales", "animals", "animaies"] },
  { s: "papel", p: "papéis", regra: "termina em EL: troca o L por IS (com acento)", errados: ["papeles", "papels", "papelis"] },
  { s: "funil", p: "funis", regra: "termina em IL: troca o L por S", errados: ["funiles", "funils", "funies"] },
  { s: "pão", p: "pães", regra: "é um dos terminados em ÃO que faz ÃES", errados: ["pãos", "pões", "pãoes"] },
  { s: "coração", p: "corações", regra: "a maioria dos terminados em ÃO faz ÕES", errados: ["coraçãos", "coraçães", "coraçõis"] },
  { s: "mão", p: "mãos", regra: "é um dos terminados em ÃO que só ganha S", errados: ["mães", "mões", "manos"] },
  { s: "jardim", p: "jardins", regra: "termina em M: troca o M por NS", errados: ["jardims", "jardimes", "jardines"] },
  { s: "lápis", p: "lápis", regra: "é paroxítona terminada em S: não muda no plural", errados: ["lápises", "lápiss", "lapises"] },
  { s: "cão", p: "cães", regra: "é um plural em ÃES", errados: ["cãos", "cões", "canis"] },
  { s: "professor", p: "professores", regra: "termina em R: acrescenta ES", errados: ["professors", "professoris", "professes"] },
  { s: "árvore", p: "árvores", regra: "termina em vogal: é só acrescentar S", errados: ["árvoreis", "árvoris", "árvorees"] },
  { s: "canal", p: "canais", regra: "termina em AL: troca o L por IS", errados: ["canales", "canals", "canaies"] },
];

const CONCORDA: readonly { frase: string; certa: string; erradas: readonly string[]; por: string }[] = [
  { frase: "Os meninos ___ no pátio.", certa: "brincam", erradas: ["brinca", "brincava", "brincais"], por: "“Os meninos” é plural: o verbo também vai para o plural." },
  { frase: "A professora ___ a história para a turma.", certa: "contou", erradas: ["contaram", "contamos", "contavam"], por: "“A professora” é uma só: verbo no singular." },
  { frase: "Minhas ___ favoritas são azuis.", certa: "camisetas", erradas: ["camiseta", "camisetos", "camisete"], por: "“Minhas” e “favoritas” estão no plural: o substantivo também." },
  { frase: "Nós ___ cedo todos os dias.", certa: "acordamos", erradas: ["acorda", "acordam", "acordais"], por: "Com NÓS, o verbo termina em -MOS." },
  { frase: "As crianças ___ o lanche na mochila.", certa: "guardaram", erradas: ["guardou", "guardara", "guardava"], por: "“As crianças” é plural: verbo no plural." },
  { frase: "Aquele ___ velho ainda funciona.", certa: "relógio", erradas: ["relógios", "relógia", "relógies"], por: "“Aquele” é singular e masculino: combina com relógio." },
  { frase: "O pássaro ___ sobre o telhado.", certa: "voa", erradas: ["voam", "voamos", "voais"], por: "“O pássaro” é um só: verbo no singular." },
  { frase: "Eu e meu irmão ___ a mesma escola.", certa: "estudamos na", erradas: ["estuda na", "estudam na", "estudais na"], por: "“Eu e meu irmão” equivale a NÓS: verbo em -MOS." },
];

function concordancia(_s: Serie, nivel: Nivel): Questao {
  if (nivel === "retomada") {
    const w = pick(PLURAIS.filter((x) => x.regra.includes("vogal") || x.regra.includes("em R")));
    return montar(`Qual é o PLURAL de ${w.s.toUpperCase()}?`, w.p, w.errados, `${maiuscula(w.s)} ${w.regra} → ${w.p}.`);
  }
  if (nivel === "pratica") {
    const c = pick(CONCORDA);
    return montar(`Complete a frase:<br><br><em>${c.frase}</em>`, c.certa, c.erradas, c.por);
  }
  const w = pick(PLURAIS.filter((x) => !x.regra.includes("vogal") && !x.regra.includes("em R")));
  return montar(`Qual é o PLURAL de ${w.s.toUpperCase()}?`, w.p, w.errados, `${maiuscula(w.s)} ${w.regra} → ${w.p}.`);
}

// ─── 6. sinônimos, antônimos e sentido ───────────────────────────────────────

const SINONIMOS: readonly { p: string; igual: string; erradas: readonly string[] }[] = [
  { p: "bonito", igual: "belo", erradas: ["feio", "grande", "rápido"] },
  { p: "alegre", igual: "feliz", erradas: ["triste", "velho", "frio"] },
  { p: "rápido", igual: "veloz", erradas: ["lento", "pesado", "quieto"] },
  { p: "casa", igual: "moradia", erradas: ["escola", "rua", "cidade"] },
  { p: "começar", igual: "iniciar", erradas: ["terminar", "correr", "guardar"] },
  { p: "assustado", igual: "amedrontado", erradas: ["corajoso", "cansado", "animado"] },
  { p: "esperto", igual: "inteligente", erradas: ["preguiçoso", "distraído", "calado"] },
  { p: "enorme", igual: "gigantesco", erradas: ["minúsculo", "estreito", "curto"] },
  { p: "silencioso", igual: "quieto", erradas: ["barulhento", "colorido", "molhado"] },
  { p: "estrada", igual: "rodovia", erradas: ["ponte", "prédio", "praça"] },
];

const ANTONIMOS: readonly { p: string; oposto: string; erradas: readonly string[] }[] = [
  { p: "claro", oposto: "escuro", erradas: ["limpo", "leve", "macio"] },
  { p: "cheio", oposto: "vazio", erradas: ["pesado", "grande", "novo"] },
  { p: "subir", oposto: "descer", erradas: ["correr", "parar", "pular"] },
  { p: "lembrar", oposto: "esquecer", erradas: ["pensar", "estudar", "falar"] },
  { p: "perto", oposto: "longe", erradas: ["alto", "dentro", "depois"] },
  { p: "barato", oposto: "caro", erradas: ["bonito", "novo", "pequeno"] },
  { p: "áspero", oposto: "liso", erradas: ["quente", "seco", "duro"] },
  { p: "coragem", oposto: "medo", erradas: ["alegria", "pressa", "força"] },
  { p: "antes", oposto: "depois", erradas: ["agora", "sempre", "nunca"] },
  { p: "acordar", oposto: "dormir", erradas: ["levantar", "sonhar", "cansar"] },
];

const EXPRESSOES: readonly { frase: string; alvo: string; sentido: string; erradas: readonly string[] }[] = [
  { frase: "Depois da prova, Lia ficou com a PULGA ATRÁS DA ORELHA.", alvo: "pulga atrás da orelha", sentido: "desconfiada", erradas: ["com coceira", "com sono", "com raiva"] },
  { frase: "O menino ENGOLIU O CHORO e continuou o jogo.", alvo: "engoliu o choro", sentido: "segurou a vontade de chorar", erradas: ["bebeu água", "chorou muito", "gritou alto"] },
  { frase: "Meu avô é DURO NA QUEDA: nada o derruba.", alvo: "duro na queda", sentido: "resistente, não desiste", erradas: ["pesado", "desastrado", "bravo"] },
  { frase: "Ela ficou com o CORAÇÃO NA MÃO esperando o resultado.", alvo: "coração na mão", sentido: "muito aflita", erradas: ["muito calma", "com dor no peito", "apaixonada"] },
  { frase: "O time jogou de CORPO E ALMA na final.", alvo: "corpo e alma", sentido: "com toda a dedicação", erradas: ["sem camisa", "com medo", "com pressa"] },
  { frase: "Ele chegou EM CIMA DA HORA e quase perdeu o ônibus.", alvo: "em cima da hora", sentido: "no último minuto", erradas: ["bem cedo", "de bicicleta", "acompanhado"] },
  { frase: "Quando contei a novidade, ela ficou de QUEIXO CAÍDO.", alvo: "queixo caído", sentido: "muito surpresa", erradas: ["com dor no rosto", "muito triste", "com sono"] },
  { frase: "Depois da bronca, o menino ficou de ORELHA EM PÉ.", alvo: "orelha em pé", sentido: "atento e desconfiado", erradas: ["com dor de ouvido", "muito alegre", "com sono"] },
  { frase: "Estudar fração foi PÃO COMIDO para a Bia.", alvo: "pão comido", sentido: "muito fácil", erradas: ["muito difícil", "delicioso", "demorado"] },
  { frase: "Ele MATOU A AULA e foi jogar bola.", alvo: "matou a aula", sentido: "faltou à aula de propósito", erradas: ["estudou muito", "brigou na aula", "chegou cedo"] },
  { frase: "Meu irmão PAGOU O PATO pela bagunça que eu fiz.", alvo: "pagou o pato", sentido: "levou a culpa por outra pessoa", erradas: ["comprou um pato", "ficou com fome", "pediu desculpa"] },
];

function vocabulario(_s: Serie, nivel: Nivel): Questao {
  if (nivel === "retomada") {
    const w = pick(SINONIMOS);
    return montar(
      `Qual palavra quer dizer QUASE A MESMA COISA que ${w.p.toUpperCase()}?`,
      w.igual,
      w.erradas,
      `${maiuscula(w.p)} e ${w.igual} são sinônimos: têm sentido parecido.`,
    );
  }
  if (nivel === "pratica") {
    const w = pick(ANTONIMOS);
    return montar(
      `Qual palavra é o CONTRÁRIO de ${w.p.toUpperCase()}?`,
      w.oposto,
      w.erradas,
      `${maiuscula(w.p)} e ${w.oposto} são antônimos: têm sentidos opostos.`,
    );
  }
  const e = pick(EXPRESSOES);
  return montar(
    `Leia: <em>“${e.frase}”</em><br>Nessa frase, “${e.alvo}” quer dizer:`,
    e.sentido,
    e.erradas,
    `A expressão não vale ao pé da letra: aqui, “${e.alvo}” significa ${e.sentido}.`,
  );
}

// ─── 7. conectivos ───────────────────────────────────────────────────────────

const LACUNAS: readonly { frase: string; certa: string; por: string }[] = [
  { frase: "Levei o guarda-chuva ___ ia chover.", certa: "porque", por: "a chuva é o MOTIVO de levar o guarda-chuva" },
  { frase: "Estudei bastante, ___ esqueci uma resposta.", certa: "mas", por: "a segunda ideia contraria a primeira" },
  { frase: "Choveu muito, ___ o jogo foi cancelado.", certa: "então", por: "o cancelamento é o RESULTADO da chuva" },
  { frase: "Fiquei com sono ___ dormi tarde.", certa: "porque", por: "dormir tarde é o MOTIVO do sono" },
  { frase: "Gosto de matemática, ___ acho difícil.", certa: "mas", por: "gostar e achar difícil são ideias que se opõem" },
  { frase: "Acabou a luz, ___ acendemos velas.", certa: "então", por: "acender velas é a CONSEQUÊNCIA da falta de luz" },
  { frase: "O ônibus quebrou, ___ chegamos atrasados.", certa: "então", por: "o atraso é o RESULTADO do ônibus quebrado" },
  { frase: "Ela treina todo dia ___ quer ser atleta.", certa: "porque", por: "querer ser atleta é o MOTIVO do treino" },
];

const SENTIDOS: readonly { frase: string; alvo: string; sentido: string; erradas: readonly string[] }[] = [
  { frase: "Regamos as plantas, MAS elas murcharam.", alvo: "MAS", sentido: "uma ideia contrária ao que se esperava", erradas: ["o motivo de algo", "o lugar onde aconteceu", "o tempo da ação"] },
  { frase: "Faltou água, POR ISSO a aula terminou mais cedo.", alvo: "POR ISSO", sentido: "uma consequência", erradas: ["uma dúvida", "uma comparação", "um lugar"] },
  { frase: "COMO estava atrasado, corri até a escola.", alvo: "COMO", sentido: "o motivo (porque)", erradas: ["uma comparação", "uma pergunta", "uma oposição"] },
  { frase: "EMBORA fosse pequeno, o time venceu.", alvo: "EMBORA", sentido: "uma oposição que não impediu o resultado", erradas: ["o motivo da vitória", "o lugar do jogo", "o tempo do jogo"] },
  { frase: "Treinamos muito; ALÉM DISSO, estudamos as jogadas.", alvo: "ALÉM DISSO", sentido: "mais uma informação somada", erradas: ["uma oposição", "uma conclusão", "uma dúvida"] },
  { frase: "Chovia forte; PORTANTO, ficamos em casa.", alvo: "PORTANTO", sentido: "uma conclusão", erradas: ["uma causa", "uma comparação", "uma pergunta"] },
  { frase: "QUANDO o sinal tocou, todos entraram.", alvo: "QUANDO", sentido: "o tempo em que algo aconteceu", erradas: ["o motivo", "o lugar", "uma oposição"] },
  { frase: "Traga o caderno E a régua.", alvo: "E", sentido: "a soma de duas coisas", erradas: ["uma escolha entre duas", "uma oposição", "uma conclusão"] },
];

const TROCAS: readonly { p: string; igual: string; erradas: readonly string[] }[] = [
  { p: "mas", igual: "porém", erradas: ["porque", "então", "quando"] },
  { p: "porque", igual: "pois", erradas: ["porém", "contudo", "além disso"] },
  { p: "então", igual: "por isso", erradas: ["mas", "embora", "apesar de"] },
  { p: "embora", igual: "apesar de", erradas: ["por isso", "porque", "além disso"] },
  { p: "além disso", igual: "também", erradas: ["mas", "portanto", "embora"] },
  { p: "portanto", igual: "logo", erradas: ["porque", "mas", "quando"] },
  { p: "mesmo assim", igual: "ainda assim", erradas: ["por causa disso", "além disso", "por exemplo"] },
  { p: "por isso", igual: "consequentemente", erradas: ["porque", "embora", "enquanto"] },
  { p: "contudo", igual: "no entanto", erradas: ["portanto", "porque", "além disso"] },
  { p: "assim que", igual: "logo que", erradas: ["porque", "mas", "portanto"] },
];

function conectivos(_s: Serie, nivel: Nivel): Questao {
  if (nivel === "retomada") {
    const l = pick(LACUNAS);
    return montar(
      `Complete a frase:<br><br><em>${l.frase}</em>`,
      l.certa,
      ["porque", "mas", "então"].filter((c) => c !== l.certa),
      `Usamos “${l.certa}” porque ${l.por}.`,
    );
  }
  if (nivel === "pratica") {
    const s = pick(SENTIDOS);
    return montar(
      `Leia: <em>“${s.frase}”</em><br>Na frase, ${s.alvo} indica:`,
      s.sentido,
      s.erradas,
      `${s.alvo} liga as ideias mostrando ${s.sentido}.`,
    );
  }
  const t = pick(TROCAS);
  return montar(
    `Qual palavra pode substituir “${t.p}” SEM mudar o sentido da frase?`,
    t.igual,
    t.erradas,
    `“${t.p}” e “${t.igual}” ligam as ideias do mesmo jeito.`,
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// CIÊNCIAS
// ═════════════════════════════════════════════════════════════════════════════

// ─── 8. animais ──────────────────────────────────────────────────────────────

type Grupo = "mamífero" | "ave" | "réptil" | "anfíbio" | "peixe" | "inseto";
type Dieta = "herbívoro" | "carnívoro" | "onívoro";

interface Animal {
  nome: string;
  emoji: string;
  grupo: Grupo;
  dieta: Dieta;
  corpo: string;
  nasce: string;
}

const ANIMAIS: readonly Animal[] = [
  { nome: "cachorro", emoji: "🐶", grupo: "mamífero", dieta: "onívoro", corpo: "pelos", nasce: "do ventre da mãe" },
  { nome: "vaca", emoji: "🐄", grupo: "mamífero", dieta: "herbívoro", corpo: "pelos", nasce: "do ventre da mãe" },
  { nome: "onça", emoji: "🐆", grupo: "mamífero", dieta: "carnívoro", corpo: "pelos", nasce: "do ventre da mãe" },
  { nome: "morcego", emoji: "🦇", grupo: "mamífero", dieta: "onívoro", corpo: "pelos", nasce: "do ventre da mãe" },
  { nome: "baleia", emoji: "🐋", grupo: "mamífero", dieta: "carnívoro", corpo: "pele lisa", nasce: "do ventre da mãe" },
  { nome: "galinha", emoji: "🐔", grupo: "ave", dieta: "onívoro", corpo: "penas", nasce: "de ovo" },
  { nome: "tucano", emoji: "🦜", grupo: "ave", dieta: "herbívoro", corpo: "penas", nasce: "de ovo" },
  { nome: "coruja", emoji: "🦉", grupo: "ave", dieta: "carnívoro", corpo: "penas", nasce: "de ovo" },
  { nome: "pinguim", emoji: "🐧", grupo: "ave", dieta: "carnívoro", corpo: "penas", nasce: "de ovo" },
  { nome: "jacaré", emoji: "🐊", grupo: "réptil", dieta: "carnívoro", corpo: "escamas duras", nasce: "de ovo" },
  { nome: "cobra", emoji: "🐍", grupo: "réptil", dieta: "carnívoro", corpo: "escamas", nasce: "de ovo" },
  { nome: "tartaruga", emoji: "🐢", grupo: "réptil", dieta: "herbívoro", corpo: "casco", nasce: "de ovo" },
  { nome: "lagarto", emoji: "🦎", grupo: "réptil", dieta: "carnívoro", corpo: "escamas", nasce: "de ovo" },
  { nome: "sapo", emoji: "🐸", grupo: "anfíbio", dieta: "carnívoro", corpo: "pele úmida", nasce: "de ovo" },
  { nome: "salamandra", emoji: "🦎", grupo: "anfíbio", dieta: "carnívoro", corpo: "pele úmida", nasce: "de ovo" },
  { nome: "tilápia", emoji: "🐟", grupo: "peixe", dieta: "onívoro", corpo: "escamas", nasce: "de ovo" },
  { nome: "tubarão", emoji: "🦈", grupo: "peixe", dieta: "carnívoro", corpo: "pele áspera", nasce: "de ovo" },
  { nome: "abelha", emoji: "🐝", grupo: "inseto", dieta: "herbívoro", corpo: "carapaça e pelinhos", nasce: "de ovo" },
  { nome: "formiga", emoji: "🐜", grupo: "inseto", dieta: "onívoro", corpo: "carapaça", nasce: "de ovo" },
  { nome: "borboleta", emoji: "🦋", grupo: "inseto", dieta: "herbívoro", corpo: "asas com escamas", nasce: "de ovo" },
];

const GRUPOS: Grupo[] = ["mamífero", "ave", "réptil", "anfíbio", "peixe", "inseto"];
const DIETAS: Dieta[] = ["herbívoro", "carnívoro", "onívoro"];
const EXPLICA_DIETA: Record<Dieta, string> = {
  herbívoro: "come plantas",
  carnívoro: "come outros animais",
  onívoro: "come plantas e animais",
};

function animais(_s: Serie, nivel: Nivel): Questao {
  if (nivel === "retomada") {
    const a = pick(ANIMAIS);
    return montar(
      `${a.emoji} A que GRUPO pertence o(a) ${a.nome}?`,
      a.grupo,
      embaralhar(GRUPOS.filter((g) => g !== a.grupo)),
      `O(a) ${a.nome} tem ${a.corpo} e nasce ${a.nasce}: é ${a.grupo}.`,
    );
  }
  if (nivel === "pratica") {
    const a = pick(ANIMAIS);
    if (Math.random() < 0.5) {
      return montar(
        `${a.emoji} Qual é o hábito alimentar do(a) ${a.nome}?`,
        a.dieta,
        DIETAS.filter((d) => d !== a.dieta),
        `${maiuscula(a.dieta)} ${EXPLICA_DIETA[a.dieta]} — é o caso do(a) ${a.nome}.`,
      );
    }
    return montar(
      `${a.emoji} O corpo do(a) ${a.nome} é coberto por:`,
      a.corpo,
      embaralhar(ANIMAIS.filter((x) => x.corpo !== a.corpo).map((x) => x.corpo)),
      `A cobertura do corpo ajuda a identificar o grupo: o(a) ${a.nome} tem ${a.corpo}.`,
    );
  }
  // Desafio: achar o intruso do grupo.
  const grupo = pick(GRUPOS.filter((g) => ANIMAIS.filter((a) => a.grupo === g).length >= 3));
  const tres = alguns(
    ANIMAIS.filter((a) => a.grupo === grupo),
    3,
  );
  const intruso = pick(ANIMAIS.filter((a) => a.grupo !== grupo));
  const lista = embaralhar([...tres, intruso]);
  return montar(
    `Qual destes animais NÃO é ${grupo}?<br><br>${lista.map((a) => `${a.emoji} ${a.nome}`).join(" · ")}`,
    `${intruso.emoji} ${intruso.nome}`,
    tres.map((a) => `${a.emoji} ${a.nome}`),
    `${maiuscula(intruso.nome)} é ${intruso.grupo}: tem ${intruso.corpo}. Os outros três são do grupo ${grupo}.`,
  );
}

// ─── 9. estados e ciclo da água ──────────────────────────────────────────────

const ESTADOS: readonly { cena: string; estado: string; por: string }[] = [
  { cena: "o gelo dentro do copo", estado: "sólido", por: "o gelo tem forma própria e é duro" },
  { cena: "a água da torneira", estado: "líquido", por: "escorre e toma a forma do recipiente" },
  { cena: "o vapor que sai da panela quente", estado: "gasoso", por: "o vapor se espalha pelo ar" },
  { cena: "a neve na montanha", estado: "sólido", por: "é água congelada" },
  { cena: "a chuva caindo", estado: "líquido", por: "escorre e molha" },
  { cena: "a água do rio", estado: "líquido", por: "escorre e toma a forma do leito" },
  { cena: "o picolé no congelador", estado: "sólido", por: "está congelado, com forma própria" },
  { cena: "a fumacinha do banho quente", estado: "gasoso", por: "é vapor de água espalhado no ar" },
];

const MUDANCAS: readonly { cena: string; nome: string; erradas: readonly string[]; por: string }[] = [
  { cena: "O sol esquenta a água do mar e ela sobe para o céu como vapor.", nome: "evaporação", erradas: ["condensação", "solidificação", "precipitação"], por: "líquido virando gás é evaporação" },
  { cena: "O vapor esfria lá no alto e forma gotinhas nas nuvens.", nome: "condensação", erradas: ["evaporação", "fusão", "infiltração"], por: "gás virando líquido é condensação" },
  { cena: "As gotinhas ficam pesadas e caem como chuva.", nome: "precipitação", erradas: ["evaporação", "condensação", "fusão"], por: "a água que cai da nuvem é precipitação" },
  { cena: "A chuva entra no solo e chega à água subterrânea.", nome: "infiltração", erradas: ["evaporação", "condensação", "precipitação"], por: "a água que penetra no solo está se infiltrando" },
  { cena: "O gelo fica fora do congelador e vira água.", nome: "fusão (derretimento)", erradas: ["evaporação", "condensação", "solidificação"], por: "sólido virando líquido é fusão" },
  { cena: "A água na forminha vira gelo no congelador.", nome: "solidificação", erradas: ["fusão (derretimento)", "evaporação", "condensação"], por: "líquido virando sólido é solidificação" },
  { cena: "Aparecem gotas do lado de fora do copo de suco gelado.", nome: "condensação", erradas: ["evaporação", "precipitação", "infiltração"], por: "o vapor do ar esfria no copo e vira gotinhas" },
  { cena: "A roupa no varal seca ao sol.", nome: "evaporação", erradas: ["condensação", "precipitação", "solidificação"], por: "a água da roupa vira vapor" },
];

const CICLO = ["evaporação", "condensação", "precipitação", "infiltração"] as const;

const AGUA_DESAFIO: readonly { p: string; certa: string; erradas: readonly string[]; por: string }[] = [
  { p: "A água do planeta acaba quando a usamos?", certa: "não: ela circula pelo ciclo da água e volta", erradas: ["sim, some para sempre", "sim, vira terra", "só acaba no verão"], por: "O ciclo faz a mesma água ir e voltar entre o mar, o ar e o solo." },
  { p: "Por que o vapor vira gotinha lá no alto do céu?", certa: "porque no alto faz mais frio", erradas: ["porque no alto faz mais calor", "porque o vento empurra", "porque o sol some"], por: "O ar frio faz o vapor condensar." },
  { p: "Onde vai a chuva que cai sobre a calçada de concreto?", certa: "escorre para o bueiro, porque não consegue se infiltrar", erradas: ["infiltra no concreto", "evapora na hora", "vira gelo"], por: "Chão impermeável impede a infiltração — por isso a cidade alaga." },
  { p: "Por que a água do mar é salgada e a da chuva não?", certa: "porque na evaporação só a água sobe, o sal fica no mar", erradas: ["porque a chuva é mais limpa", "porque a nuvem lava o sal", "porque o sal evapora antes"], por: "O sal não evapora: fica para trás." },
  { p: "A geladeira cheia de gelo e o rio correndo têm em comum:", certa: "são a mesma substância, a água, em estados diferentes", erradas: ["são substâncias diferentes", "os dois estão no estado líquido", "os dois estão no estado sólido"], por: "Sólido, líquido e gasoso são estados da MESMA água." },
  { p: "Por que a poça do pátio some depois de um dia de sol?", certa: "a água evaporou e foi para o ar", erradas: ["a água virou terra", "a água congelou", "a água sumiu para sempre"], por: "O calor do sol transforma a água líquida em vapor." },
];

function agua(_s: Serie, nivel: Nivel): Questao {
  if (nivel === "retomada") {
    const e = pick(ESTADOS);
    return montar(
      `Em que ESTADO está a água em: ${e.cena}?`,
      e.estado,
      ["sólido", "líquido", "gasoso"].filter((x) => x !== e.estado),
      `Está no estado ${e.estado} porque ${e.por}.`,
    );
  }
  if (nivel === "pratica") {
    const m = pick(MUDANCAS);
    return montar(`Como se chama o que acontece?<br><br><em>${m.cena}</em>`, m.nome, m.erradas, `Chama-se ${m.nome}: ${m.por}.`);
  }
  if (Math.random() < 0.4) {
    const i = Math.floor(Math.random() * CICLO.length);
    const atual = CICLO[i]!;
    const certa = CICLO[(i + 1) % CICLO.length]!;
    return montar(
      `No ciclo da água, depois da ${atual} vem:`,
      certa,
      CICLO.filter((c) => c !== certa && c !== atual),
      `O ciclo segue a ordem: ${CICLO.join(" → ")} → (e recomeça).`,
    );
  }
  const d = pick(AGUA_DESAFIO);
  return montar(d.p, d.certa, d.erradas, d.por);
}

// ─── 10. lixo e reciclagem ───────────────────────────────────────────────────

interface Residuo {
  item: string;
  emoji: string;
  tipo: "reciclável" | "orgânico" | "rejeito";
  material?: "papel" | "plástico" | "vidro" | "metal";
}

const LIXEIRA: Record<string, string> = {
  papel: "azul",
  plástico: "vermelha",
  vidro: "verde",
  metal: "amarela",
};

const RESIDUOS: readonly Residuo[] = [
  { item: "caixa de papelão", emoji: "📦", tipo: "reciclável", material: "papel" },
  { item: "jornal velho", emoji: "📰", tipo: "reciclável", material: "papel" },
  { item: "caderno sem uso", emoji: "📓", tipo: "reciclável", material: "papel" },
  { item: "garrafa PET", emoji: "🧴", tipo: "reciclável", material: "plástico" },
  { item: "potinho de iogurte", emoji: "🥛", tipo: "reciclável", material: "plástico" },
  { item: "sacola plástica", emoji: "🛍️", tipo: "reciclável", material: "plástico" },
  { item: "garrafa de vidro", emoji: "🍾", tipo: "reciclável", material: "vidro" },
  { item: "pote de geleia de vidro", emoji: "🫙", tipo: "reciclável", material: "vidro" },
  { item: "lata de refrigerante", emoji: "🥫", tipo: "reciclável", material: "metal" },
  { item: "tampa de panela de alumínio", emoji: "🍳", tipo: "reciclável", material: "metal" },
  { item: "casca de banana", emoji: "🍌", tipo: "orgânico" },
  { item: "resto de arroz", emoji: "🍚", tipo: "orgânico" },
  { item: "casca de ovo", emoji: "🥚", tipo: "orgânico" },
  { item: "folhas secas do quintal", emoji: "🍂", tipo: "orgânico" },
  { item: "borra de café", emoji: "☕", tipo: "orgânico" },
  { item: "papel higiênico usado", emoji: "🧻", tipo: "rejeito" },
  { item: "espelho quebrado", emoji: "🪞", tipo: "rejeito" },
  { item: "fralda descartável", emoji: "🧷", tipo: "rejeito" },
  { item: "esponja de louça velha", emoji: "🧽", tipo: "rejeito" },
];

function lixo(_s: Serie, nivel: Nivel): Questao {
  if (nivel === "retomada") {
    const r = pick(RESIDUOS.filter((x) => x.tipo !== "rejeito"));
    const certa = r.tipo === "orgânico" ? "lixo orgânico (restos que apodrecem)" : "lixo reciclável";
    return montar(
      `${r.emoji} Onde vai ${r.item}?`,
      certa,
      ["lixo orgânico (restos que apodrecem)", "lixo reciclável", "não pode ser jogado fora"].filter((x) => x !== certa),
      r.tipo === "orgânico"
        ? "Restos de comida e de plantas são orgânicos: viram adubo na compostagem."
        : `${maiuscula(r.item)} é de ${r.material} e pode virar um produto novo.`,
    );
  }
  if (nivel === "pratica") {
    const r = pick(RESIDUOS.filter((x) => x.material));
    const cor = LIXEIRA[r.material!]!;
    return montar(
      `${r.emoji} Em que lixeira colorida vai ${r.item}?`,
      `${cor} (${r.material})`,
      embaralhar(
        Object.entries(LIXEIRA)
          .filter(([m]) => m !== r.material)
          .map(([m, c]) => `${c} (${m})`),
      ),
      `${maiuscula(r.item)} é de ${r.material}: vai na lixeira ${cor}.`,
    );
  }
  const tres = alguns(
    RESIDUOS.filter((x) => x.tipo === "reciclável"),
    3,
  );
  const fora = pick(RESIDUOS.filter((x) => x.tipo === "rejeito"));
  const lista = embaralhar([...tres, fora]);
  return montar(
    `Qual destes itens NÃO deve ir para a coleta seletiva?<br><br>${lista.map((r) => `${r.emoji} ${r.item}`).join(" · ")}`,
    `${fora.emoji} ${fora.item}`,
    tres.map((r) => `${r.emoji} ${r.item}`),
    `${maiuscula(fora.item)} é rejeito: sujo ou perigoso demais para reciclar. Vai no lixo comum — o espelho, bem embrulhado.`,
  );
}

// ─── 11. seres vivos e não vivos ─────────────────────────────────────────────

const VIVOS: readonly { nome: string; emoji: string }[] = [
  { nome: "árvore", emoji: "🌳" },
  { nome: "gato", emoji: "🐱" },
  { nome: "minhoca", emoji: "🪱" },
  { nome: "peixe", emoji: "🐟" },
  { nome: "flor", emoji: "🌻" },
  { nome: "criança", emoji: "🧒" },
  { nome: "passarinho", emoji: "🐦" },
  { nome: "capim", emoji: "🌿" },
  { nome: "abelha", emoji: "🐝" },
  { nome: "cogumelo", emoji: "🍄" },
];

const NAO_VIVOS: readonly { nome: string; emoji: string }[] = [
  { nome: "pedra", emoji: "🪨" },
  { nome: "água do rio", emoji: "💧" },
  { nome: "ar", emoji: "💨" },
  { nome: "areia", emoji: "🏖️" },
  { nome: "luz do sol", emoji: "☀️" },
  { nome: "cadeira", emoji: "🪑" },
  { nome: "nuvem", emoji: "☁️" },
  { nome: "bola de plástico", emoji: "⚽" },
  { nome: "prego", emoji: "🔩" },
];

const CARACTERISTICAS: readonly { p: string; certa: string; erradas: readonly string[] }[] = [
  { p: "O que TODO ser vivo faz?", certa: "nasce, cresce, se alimenta e morre", erradas: ["voa", "fala", "usa energia elétrica"] },
  { p: "Uma pedra não é um ser vivo porque:", certa: "não nasce, não cresce nem se alimenta", erradas: ["é muito dura", "não tem cor", "fica parada"] },
  { p: "O que mostra que uma planta é um ser vivo?", certa: "ela cresce, se alimenta e produz sementes", erradas: ["ela é verde", "ela fica parada", "ela tem folhas"] },
  { p: "No ambiente, o que é componente NÃO VIVO?", certa: "a luz do sol, o ar, a água e o solo", erradas: ["as árvores", "os insetos", "os peixes"] },
  { p: "Por que o cogumelo é um ser vivo?", certa: "porque nasce, cresce, se alimenta e se reproduz", erradas: ["porque é mole", "porque nasce na terra", "porque é pequeno"] },
  { p: "A nuvem se move no céu. Isso faz dela um ser vivo?", certa: "não, porque mover-se não basta: ela não nasce nem se alimenta", erradas: ["sim, porque se move", "sim, porque tem água", "sim, porque muda de forma"] },
  { p: "O que os seres vivos precisam obter do ambiente?", certa: "alimento, água e ar", erradas: ["apenas luz", "apenas calor", "apenas barulho"] },
  { p: "Um carro anda, gasta combustível e para de funcionar. Ele é ser vivo?", certa: "não, porque foi fabricado: não nasce nem se reproduz", erradas: ["sim, porque anda", "sim, porque gasta combustível", "sim, porque pode quebrar"] },
  { p: "Numa lagoa, quais são os componentes VIVOS?", certa: "os peixes, as plantas aquáticas e os insetos", erradas: ["a água e as pedras", "a luz do sol e o ar", "a areia do fundo"] },
  { p: "Por que dizemos que o ser vivo se REPRODUZ?", certa: "porque gera outros seres da mesma espécie", erradas: ["porque cresce de tamanho", "porque se movimenta", "porque muda de cor"] },
];

function seresVivos(_s: Serie, nivel: Nivel): Questao {
  if (nivel === "retomada") {
    const vivo = Math.random() < 0.5;
    const x = vivo ? pick(VIVOS) : pick(NAO_VIVOS);
    return montar(
      `${x.emoji} ${maiuscula(x.nome)} é um ser VIVO ou NÃO VIVO?`,
      vivo ? "ser vivo" : "não vivo",
      [vivo ? "não vivo" : "ser vivo"],
      vivo
        ? `${maiuscula(x.nome)} nasce, cresce, se alimenta e morre: é ser vivo.`
        : `${maiuscula(x.nome)} não nasce nem se alimenta: é componente não vivo do ambiente.`,
    );
  }
  if (nivel === "pratica") {
    const tres = alguns(VIVOS, 3);
    const fora = pick(NAO_VIVOS);
    const lista = embaralhar([...tres, fora]);
    return montar(
      `Qual destes NÃO é um ser vivo?<br><br>${lista.map((x) => `${x.emoji} ${x.nome}`).join(" · ")}`,
      `${fora.emoji} ${fora.nome}`,
      tres.map((x) => `${x.emoji} ${x.nome}`),
      `${maiuscula(fora.nome)} não nasce, não cresce e não se alimenta. Os outros três são seres vivos.`,
    );
  }
  const c = pick(CARACTERISTICAS);
  return montar(c.p, c.certa, c.erradas, "Ser vivo nasce, cresce, se alimenta, se reproduz e morre — é isso que decide.");
}

// ─── 12. plantas ─────────────────────────────────────────────────────────────

const PARTES: readonly { parte: string; emoji: string; funcao: string; onde: string }[] = [
  { parte: "raiz", emoji: "🌱", funcao: "prender a planta no solo e absorver água e nutrientes", onde: "embaixo da terra" },
  { parte: "caule", emoji: "🌿", funcao: "sustentar a planta e levar a água até as folhas", onde: "no meio, ligando a raiz às folhas" },
  { parte: "folha", emoji: "🍃", funcao: "fazer a fotossíntese, usando a luz do sol", onde: "presa aos galhos, virada para a luz" },
  { parte: "flor", emoji: "🌸", funcao: "atrair polinizadores e dar origem ao fruto", onde: "na ponta dos galhos, colorida e perfumada" },
  { parte: "fruto", emoji: "🍎", funcao: "proteger as sementes e ajudar a espalhá-las", onde: "onde antes havia uma flor" },
  { parte: "semente", emoji: "🌰", funcao: "dar origem a uma planta nova", onde: "guardada dentro do fruto" },
];

const PLANTA_DESAFIO: readonly { p: string; certa: string; erradas: readonly string[]; por: string }[] = [
  { p: "De que a planta precisa para fazer a fotossíntese?", certa: "luz do sol, água e gás carbônico", erradas: ["luz de lâmpada e sal", "apenas água", "terra e vento"], por: "Na folha, a luz do sol junta a água da raiz ao gás carbônico do ar." },
  { p: "O que a planta LIBERA quando faz a fotossíntese?", certa: "oxigênio", erradas: ["gás carbônico", "fumaça", "água salgada"], por: "A planta libera o oxigênio que respiramos." },
  { p: "Uma planta ficou 15 dias num armário escuro. O que acontece?", certa: "fica amarelada e fraca, porque sem luz não faz fotossíntese", erradas: ["cresce mais rápido", "fica mais verde", "não muda nada"], por: "Sem luz, a planta não consegue produzir seu alimento." },
  { p: "Por que regar demais também faz mal à planta?", certa: "a raiz fica encharcada, sem ar, e apodrece", erradas: ["a folha fica pesada", "a planta engorda", "o sol não chega"], por: "A raiz precisa de água E de ar no solo." },
  { p: "A abelha pousa na flor e leva pólen para outra. Ela está ajudando na:", certa: "polinização", erradas: ["fotossíntese", "germinação", "evaporação"], por: "Levar pólen de uma flor a outra é polinizar." },
  { p: "A semente na terra úmida começa a brotar. Isso se chama:", certa: "germinação", erradas: ["polinização", "fotossíntese", "decomposição"], por: "Germinação é o começo da vida da planta nova." },
  { p: "Por que muitas plantas do sertão têm folhas pequenas ou espinhos?", certa: "para perder menos água", erradas: ["para pegar mais chuva", "para crescer mais rápido", "para atrair abelhas"], por: "Folha pequena evapora menos água — é uma adaptação à seca." },
  { p: "O fruto doce e colorido serve para:", certa: "atrair animais, que espalham as sementes", erradas: ["fazer fotossíntese", "prender a planta no solo", "absorver água"], por: "O animal come o fruto e as sementes caem longe da planta-mãe." },
  { p: "Sem as plantas, o que faltaria no ar para os animais?", certa: "oxigênio", erradas: ["gás carbônico", "poeira", "vapor de água"], por: "As plantas produzem o oxigênio da fotossíntese." },
  { p: "A planta também respira. Na respiração, ela:", certa: "usa oxigênio e libera gás carbônico, dia e noite", erradas: ["só libera oxigênio", "não troca nada com o ar", "só respira à noite"], por: "Fotossíntese e respiração são coisas diferentes: a planta faz as duas." },
];

function plantas(_s: Serie, nivel: Nivel): Questao {
  if (nivel === "retomada") {
    const p = pick(PARTES);
    const outras = embaralhar(PARTES.filter((x) => x.parte !== p.parte).map((x) => x.parte));
    if (Math.random() < 0.5) {
      return montar(
        `${p.emoji} Qual parte da planta serve para ${p.funcao}?`,
        p.parte,
        outras,
        `É a ${p.parte}: sua função é ${p.funcao}.`,
      );
    }
    return montar(
      `${p.emoji} Que parte da planta fica ${p.onde}?`,
      p.parte,
      outras,
      `A ${p.parte} fica ${p.onde} e serve para ${p.funcao}.`,
    );
  }
  if (nivel === "pratica") {
    const p = pick(PARTES);
    if (Math.random() < 0.5) {
      return montar(
        `${p.emoji} Qual é a função da ${p.parte.toUpperCase()}?`,
        p.funcao,
        embaralhar(PARTES.filter((x) => x.parte !== p.parte).map((x) => x.funcao)),
        `A ${p.parte} serve para ${p.funcao}.`,
      );
    }
    return montar(
      `${p.emoji} Se a ${p.parte.toUpperCase()} de uma planta for destruída, o que ela deixa de conseguir fazer?`,
      p.funcao,
      embaralhar(PARTES.filter((x) => x.parte !== p.parte).map((x) => x.funcao)),
      `Sem a ${p.parte}, a planta não consegue ${p.funcao}.`,
    );
  }
  const d = pick(PLANTA_DESAFIO);
  return montar(d.p, d.certa, d.erradas, d.por);
}

// ─── 13. saúde e higiene ─────────────────────────────────────────────────────

const QUANDO_LAVAR: readonly string[] = [
  "Você vai começar a comer o lanche.",
  "Você acabou de usar o banheiro.",
  "Você chegou da rua e vai ajudar a preparar a comida.",
  "Você terminou de brincar com o cachorro.",
  "Você espirrou na mão.",
  "Você mexeu na terra da horta da escola.",
  "Você vai trocar o curativo de um machucado.",
  "Você assoou o nariz no lenço.",
  "Você acabou de brincar no parquinho e vai lanchar.",
  "Você segurou no corrimão do ônibus e chegou em casa.",
];

const HABITOS: readonly { tema: string; bom: string; ruins: readonly string[]; por: string }[] = [
  { tema: "os dentes", bom: "escovar os dentes depois das refeições", ruins: ["comer doce antes de dormir sem escovar", "beber refrigerante no lugar da água", "passar o dia sem escovar"], por: "a escovação tira os restos de comida que causam cárie" },
  { tema: "o sono", bom: "dormir cerca de 9 horas por noite", ruins: ["ficar no celular até de madrugada", "dormir só depois da meia-noite todo dia", "trocar o sono por TV"], por: "o corpo e o cérebro se recuperam durante o sono" },
  { tema: "a alimentação", bom: "comer frutas e verduras todos os dias", ruins: ["comer salgadinho no lugar do almoço", "só comer frituras", "pular o café da manhã sempre"], por: "frutas e verduras trazem vitaminas e fibras" },
  { tema: "a hidratação", bom: "beber água ao longo do dia", ruins: ["só beber suco de caixinha", "esperar ter muita sede", "trocar água por refrigerante"], por: "a água mantém o corpo funcionando bem" },
  { tema: "o corpo em movimento", bom: "brincar e se movimentar todos os dias", ruins: ["passar a tarde inteira sentado", "só assistir a vídeos", "evitar a educação física"], por: "o movimento fortalece músculos, ossos e coração" },
  { tema: "o banho e a roupa", bom: "tomar banho e trocar de roupa depois de suar", ruins: ["ficar com a roupa suada", "passar perfume em vez de tomar banho", "usar a mesma meia a semana toda"], por: "a higiene evita fungos e mau cheiro" },
  { tema: "a tosse e o espirro", bom: "cobrir a boca com o braço ao tossir", ruins: ["tossir na mão e cumprimentar alguém", "tossir sem cobrir", "cuspir no chão"], por: "assim as gotinhas com micróbios não se espalham" },
  { tema: "as unhas", bom: "manter as unhas curtas e limpas", ruins: ["roer as unhas", "deixar sujeira embaixo da unha", "cutucar o nariz com a unha"], por: "sujeira e ovos de vermes se acumulam embaixo da unha" },
  { tema: "o lanche da escola", bom: "levar fruta e sanduíche natural", ruins: ["levar só salgadinho e refrigerante", "levar só bala e chiclete", "não levar nada e trocar por doce"], por: "o lanche precisa dar energia e nutrientes até o fim da aula" },
  { tema: "os olhos", bom: "fazer pausas quando fica muito tempo na tela", ruins: ["ficar horas no celular sem parar", "assistir na tela bem perto do rosto", "usar o celular no escuro"], por: "os olhos cansam e podem ficar irritados com o excesso de tela" },
];

const PREVENCAO: readonly { p: string; certa: string; erradas: readonly string[]; por: string }[] = [
  { p: "Lavar bem as mãos ajuda a evitar principalmente:", certa: "verminoses e diarreia", erradas: ["cárie", "miopia", "fratura de osso"], por: "muitos micróbios e ovos de vermes chegam à boca levados pelas mãos" },
  { p: "Escovar os dentes e usar fio dental evita:", certa: "cárie e problemas na gengiva", erradas: ["gripe", "dor de barriga", "picada de mosquito"], por: "a escovação remove a placa que causa a cárie" },
  { p: "Não deixar água parada no quintal evita:", certa: "dengue, zika e chikungunya", erradas: ["cárie", "gripe", "verminose"], por: "o mosquito Aedes aegypti põe ovos na água parada" },
  { p: "Beber só água tratada ou fervida evita:", certa: "doenças como diarreia e cólera", erradas: ["cárie", "obesidade", "miopia"], por: "a água contaminada carrega micróbios" },
  { p: "Comer muito doce e ultraprocessado com frequência pode causar:", certa: "obesidade e cárie", erradas: ["gripe", "dengue", "verminose"], por: "o excesso de açúcar e gordura desequilibra a alimentação" },
  { p: "Andar descalço em terra contaminada pode causar:", certa: "verminose (como o amarelão)", erradas: ["gripe", "cárie", "dengue"], por: "algumas larvas entram pela pele do pé" },
  { p: "Lavar frutas e verduras antes de comer serve para:", certa: "tirar terra, micróbios e restos de agrotóxico", erradas: ["deixar mais doce", "deixar mais colorido", "conservar por mais tempo"], por: "a lavagem remove o que pode fazer mal" },
  { p: "Tomar as vacinas do calendário serve para:", certa: "ensinar o corpo a se defender de doenças", erradas: ["curar qualquer dor", "substituir a alimentação", "evitar acidentes"], por: "a vacina treina as defesas do corpo antes de a doença chegar" },
  { p: "Cobrir o nariz e a boca ao espirrar ajuda a evitar:", certa: "a transmissão de gripe e resfriado", erradas: ["cárie", "verminose", "dengue"], por: "as gotinhas do espirro carregam vírus pelo ar" },
  { p: "Dormir mal por muitos dias seguidos costuma causar:", certa: "cansaço, irritação e dificuldade de aprender", erradas: ["cárie", "dengue", "verminose"], por: "o corpo e o cérebro se recuperam durante o sono" },
  { p: "Guardar a comida na geladeira serve para:", certa: "retardar a multiplicação dos micróbios", erradas: ["deixar mais gostosa", "aumentar as vitaminas", "deixar mais colorida"], por: "no frio os micróbios se multiplicam muito mais devagar" },
];

function saude(_s: Serie, nivel: Nivel): Questao {
  if (nivel === "retomada") {
    return montar(
      `O que fazer nesta hora?<br><br><em>${pick(QUANDO_LAVAR)}</em>`,
      "lavar as mãos com água e sabão",
      ["passar a mão na roupa", "soprar as mãos", "só enxaguar com água, sem sabão"],
      "Água e sabão por uns 20 segundos tiram os micróbios das mãos.",
    );
  }
  if (nivel === "pratica") {
    const h = pick(HABITOS);
    return montar(
      `Pensando em ${h.tema}: qual destes é um hábito SAUDÁVEL?`,
      h.bom,
      h.ruins,
      `${maiuscula(h.bom)} é saudável porque ${h.por}.`,
    );
  }
  const p = pick(PREVENCAO);
  return montar(p.p, p.certa, p.erradas, `${maiuscula(p.por)}.`);
}

// ─── 14. materiais, luz e misturas ───────────────────────────────────────────

const OBJETOS: readonly { obj: string; emoji: string; material: string }[] = [
  { obj: "a janela", emoji: "🪟", material: "vidro" },
  { obj: "o prego", emoji: "🔩", material: "metal" },
  { obj: "a cadeira de balanço antiga", emoji: "🪑", material: "madeira" },
  { obj: "a garrafa PET", emoji: "🧴", material: "plástico" },
  { obj: "a camiseta", emoji: "👕", material: "tecido (algodão)" },
  { obj: "o caderno", emoji: "📓", material: "papel" },
  { obj: "a panela", emoji: "🍳", material: "metal" },
  { obj: "o copo de suco da vovó", emoji: "🥤", material: "vidro" },
  { obj: "o pneu", emoji: "🛞", material: "borracha" },
  { obj: "o tijolo", emoji: "🧱", material: "cerâmica (argila)" },
];

const LUZ: readonly { obj: string; tipo: string; por: string }[] = [
  { obj: "o vidro limpo da janela", tipo: "transparente", por: "dá para ver nitidamente através dele" },
  { obj: "o vidro fosco do box do banheiro", tipo: "translúcido", por: "a luz passa, mas a imagem fica borrada" },
  { obj: "a parede de tijolos", tipo: "opaco", por: "a luz não passa" },
  { obj: "o papel-manteiga", tipo: "translúcido", por: "a luz passa, mas não dá para enxergar direito" },
  { obj: "a porta de madeira", tipo: "opaco", por: "bloqueia a luz e faz sombra" },
  { obj: "a água limpa do copo", tipo: "transparente", por: "a luz atravessa e a imagem fica nítida" },
  { obj: "o plástico leitoso do pote", tipo: "translúcido", por: "deixa passar só parte da luz" },
  { obj: "o livro fechado", tipo: "opaco", por: "não deixa a luz passar" },
];

const MISTURAS: readonly { m: string; jeito: string; erradas: readonly string[]; por: string }[] = [
  { m: "água com areia", jeito: "filtração (coar com filtro de papel)", erradas: ["evaporação", "imã", "catação"], por: "a areia fica no filtro e a água passa" },
  { m: "água com sal", jeito: "evaporação (deixar a água secar)", erradas: ["filtração", "imã", "peneiração"], por: "a água evapora e o sal fica no fundo" },
  { m: "arroz com feijão cru", jeito: "catação (separar com a mão)", erradas: ["imã", "evaporação", "filtração"], por: "os grãos são grandes e dá para separar um a um" },
  { m: "areia com pregos", jeito: "imã (atrai só o metal)", erradas: ["filtração", "evaporação", "catação"], por: "o imã puxa o ferro e deixa a areia" },
  { m: "areia com pedras grandes", jeito: "peneiração (passar na peneira)", erradas: ["imã", "evaporação", "decantação"], por: "a areia fina passa pela peneira e as pedras ficam" },
  { m: "água com barro", jeito: "decantação (deixar descansar até o barro assentar)", erradas: ["imã", "peneiração", "catação"], por: "o barro afunda e a água limpa fica por cima" },
  { m: "água com óleo", jeito: "decantação (o óleo fica por cima e é retirado)", erradas: ["imã", "evaporação", "peneiração"], por: "o óleo não se mistura à água e boia" },
  { m: "água com serragem que boia", jeito: "filtração (coar a serragem)", erradas: ["imã", "evaporação", "catação"], por: "a serragem fica retida no coador e a água passa" },
  { m: "clipes de metal misturados com botões de plástico", jeito: "imã (atrai só o metal)", erradas: ["evaporação", "filtração", "decantação"], por: "o imã puxa os clipes e deixa os botões" },
  { m: "farinha com grãos de milho", jeito: "peneiração (passar na peneira)", erradas: ["imã", "evaporação", "decantação"], por: "a farinha fina passa e o milho fica na peneira" },
];

function materiais(_s: Serie, nivel: Nivel): Questao {
  if (nivel === "retomada") {
    const o = pick(OBJETOS);
    return montar(
      `${o.emoji} De que MATERIAL é feito(a) ${o.obj}?`,
      o.material,
      embaralhar(OBJETOS.filter((x) => x.material !== o.material).map((x) => x.material)),
      `${maiuscula(o.obj)} é de ${o.material}.`,
    );
  }
  if (nivel === "pratica") {
    const l = pick(LUZ);
    return montar(
      `Quanto à passagem da luz, ${l.obj} é:`,
      l.tipo,
      ["transparente", "translúcido", "opaco"].filter((t) => t !== l.tipo),
      `É ${l.tipo}: ${l.por}.`,
    );
  }
  const m = pick(MISTURAS);
  return montar(
    `Como separar a mistura de ${m.m}?`,
    m.jeito,
    m.erradas,
    `Usa-se ${m.jeito.split(" (")[0]}: ${m.por}.`,
  );
}

// ─── lista ───────────────────────────────────────────────────────────────────

export const GERADORES_LP: Gerador[] = [
  {
    id: "g-rimas",
    disc: "LP",
    titulo: "Rimas: palavras que terminam igual",
    emoji: "🎵",
    conteudo: "Consciência fonológica",
    habilidades: ["Identificar rimas", "Comparar palavras (sons de silabas iniciais, mediais e finais)"],
    descritores: { 1: [], 2: [], 3: [] },
    gerar: rimas,
  },
  {
    id: "g-silabas",
    disc: "LP",
    titulo: "Sílabas: contar e separar",
    emoji: "👏",
    conteudo: "Consciência fonológica",
    habilidades: ["Reconhecer a segmentacao de palavras na escrita", "Ler palavras"],
    descritores: { 1: [], 2: [], 3: [] },
    gerar: silabas,
  },
  {
    id: "g-pontuacao",
    disc: "LP",
    titulo: "Pontuação: qual sinal usar",
    emoji: "❗",
    conteudo: "Pontuação e efeitos de sentido",
    habilidades: [
      "Efeitos de sentido da pontuacao e outras notacoes",
      "Uso do ponto final, interrogacao e exclamacao (efeitos de sentido)",
    ],
    descritores: { 2: [], 3: [], 4: [], 5: [] },
    gerar: pontuacao,
  },
  {
    id: "g-alfabetica",
    disc: "LP",
    titulo: "Alfabeto e ordem alfabética",
    emoji: "🔤",
    conteudo: "Alfabeto e escrita",
    habilidades: ["Distinguir letras do alfabeto de outros sinais graficos", "Ler palavras"],
    descritores: { 1: [], 2: [], 3: [] },
    gerar: alfabetica,
  },
  {
    id: "g-concordancia",
    disc: "LP",
    titulo: "Plural e concordância",
    emoji: "👥",
    conteudo: "Gramática na frase",
    habilidades: ["Ler frases"],
    descritores: { 2: [], 3: [], 4: [] },
    gerar: concordancia,
  },
  {
    id: "g-vocabulario",
    disc: "LP",
    titulo: "Sinônimos, contrários e expressões",
    emoji: "💬",
    conteudo: "Vocabulário e sentido",
    habilidades: ["Inferir o sentido de palavras ou expressoes", "Inferir o sentido de uma palavra ou expressao"],
    descritores: { 3: [], 4: [], 5: [] },
    gerar: vocabulario,
  },
  {
    id: "g-conectivos",
    disc: "LP",
    titulo: "Palavras que ligam ideias",
    emoji: "🔗",
    conteudo: "Coesão e conectivos",
    habilidades: [
      "Relacoes logico-discursivas (conjuncoes, adverbios)",
      "Relacao de causa e consequencia entre partes do texto",
    ],
    descritores: { 4: [], 5: [] },
    gerar: conectivos,
  },
];

export const GERADORES_CN: Gerador[] = [
  {
    id: "g-animais",
    disc: "CN",
    titulo: "Classificar animais",
    emoji: "🐾",
    conteudo: "Seres vivos",
    habilidades: [
      "Comparar e organizar animais por caracteristicas externas",
      "Grupos de animais (alimentacao, ambiente, reproducao)",
      "Habito alimentar dos animais (herbivoro, carnivoro, onivoro)",
    ],
    descritores: { 1: [], 2: [], 3: [] },
    gerar: animais,
  },
  {
    id: "g-agua",
    disc: "CN",
    titulo: "Estados e ciclo da água",
    emoji: "💧",
    conteudo: "Matéria e energia",
    habilidades: [
      "Estados fisicos da agua e sua importancia",
      "Mudancas de estado fisico da agua e ciclo hidrologico",
      "Ciclo da agua (evaporacao, condensacao, precipitacao, infiltracao)",
    ],
    descritores: { 3: [], 4: [], 5: [] },
    gerar: agua,
  },
  {
    id: "g-lixo",
    disc: "CN",
    titulo: "Lixo: reciclar e descartar",
    emoji: "♻️",
    conteudo: "Ambiente e sustentabilidade",
    habilidades: [
      "Classificar residuos organicos e inorganicos",
      "Reciclagem e descarte correto do lixo",
      "Transformacao e descarte consciente de materiais (reciclagem, compostagem)",
    ],
    descritores: { 2: [], 3: [], 4: [], 5: [] },
    gerar: lixo,
  },
  {
    id: "g-seres-vivos",
    disc: "CN",
    titulo: "Vivo ou não vivo?",
    emoji: "🌱",
    conteudo: "Seres vivos e ambiente",
    habilidades: [
      "Componentes vivos e nao vivos do meio ambiente",
      "Meio ambiente: componentes vivos e nao vivos",
      "Caracterizar seres vivos (aspectos externos e ciclos de vida)",
    ],
    descritores: { 1: [], 2: [] },
    gerar: seresVivos,
  },
  {
    id: "g-plantas",
    disc: "CN",
    titulo: "Partes da planta e suas funções",
    emoji: "🌻",
    conteudo: "Seres vivos",
    habilidades: ["Partes da planta e suas funcoes", "Importancia da agua para plantas e animais"],
    descritores: { 2: [], 3: [], 4: [] },
    gerar: plantas,
  },
  {
    id: "g-saude",
    disc: "CN",
    titulo: "Higiene, alimentação e saúde",
    emoji: "🧼",
    conteudo: "Vida e evolução",
    habilidades: [
      "Habitos de saude pessoal e coletiva (higiene) e sua importancia",
      "Habitos saudaveis (higiene, alimentacao, sono, exercicio)",
      "Higiene e alimentacao para promocao da saude",
    ],
    descritores: { 1: [], 2: [], 3: [] },
    gerar: saude,
  },
  {
    id: "g-materiais",
    disc: "CN",
    titulo: "Materiais, luz e misturas",
    emoji: "🔬",
    conteudo: "Matéria e energia",
    habilidades: [
      "Propriedades fisicas dos materiais (elasticidade, dureza, condutibilidade)",
      "Misturas na vida diaria (propriedades fisicas, separacao de fases)",
      "Passagem da luz: objetos transparentes, translucidos e opacos",
    ],
    descritores: { 4: [], 5: [] },
    gerar: materiais,
  },
];
