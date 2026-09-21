import type { ReactNode } from "react";

import type { Questao } from "@/components/school/ferramentas/quiz";

/**
 * Geradores de exercícios de Matemática para a recomposição das
 * aprendizagens. Cada gerador monta questões novas a cada chamada, no nível
 * pedido, para a série pedida — assim o aluno pode treinar quantas vezes
 * quiser sem decorar as respostas.
 *
 * Níveis:
 * - retomada: números pequenos, apoio visual, um passo só;
 * - pratica: o que a série deve dominar, sem pegadinha;
 * - desafio: números maiores, dois passos ou aplicação.
 */

export type Serie = 1 | 2 | 3 | 4 | 5;
export type Nivel = "retomada" | "pratica" | "desafio";

// ─── utilitários ─────────────────────────────────────────────────────────────

/** Inteiro aleatório entre min e max (inclusive); limites fracionários são ajustados para dentro. */
const rnd = (min: number, max: number) => {
  const lo = Math.ceil(min),
    hi = Math.max(lo, Math.floor(max));
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
};
const pick = <T,>(lista: readonly T[]): T => lista[Math.floor(Math.random() * lista.length)]!;
const embaralhar = <T,>(lista: T[]): T[] => {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j]!, copia[i]!];
  }
  return copia;
};
const fmt = (n: number) => n.toLocaleString("pt-BR");
const reais = (centavos: number) =>
  (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

let contador = 0;
/** Monta a questão com opções únicas e embaralhadas; a correta é sempre `certa`. */
function montar(
  enunciado: string,
  certa: string | number,
  distratores: (string | number)[],
  explicacao: string,
  ilustracao?: ReactNode,
): Questao {
  const c = typeof certa === "number" ? fmt(certa) : certa;
  const outras: string[] = [];
  for (const d of distratores) {
    const s = typeof d === "number" ? fmt(d) : d;
    if (s !== c && !outras.includes(s) && !(typeof d === "number" && d < 0)) outras.push(s);
    if (outras.length === 3) break;
  }
  const opcoes = embaralhar([c, ...outras]);
  contador += 1;
  return {
    id: `g${contador}`,
    enunciado,
    opcoes,
    respostaCorreta: opcoes.indexOf(c),
    explicacao,
    ...(ilustracao ? { ilustracao } : {}),
  };
}

/** Números perto do certo, para as opções erradas parecerem possíveis. */
const vizinhos = (n: number, passo = 1) => [n + passo, n - passo, n + 2 * passo, n - 2 * passo, n + 10];

const NOMES = ["Ana", "Davi", "Lia", "Caio", "Maria", "João", "Bia", "Enzo", "Sofia", "Théo", "Yara", "Kauã"];
const COISAS = [
  { e: "🍎", s: "maçã", p: "maçãs" },
  { e: "⚽", s: "bola", p: "bolas" },
  { e: "✏️", s: "lápis", p: "lápis" },
  { e: "🐟", s: "peixe", p: "peixes" },
  { e: "🌸", s: "flor", p: "flores" },
  { e: "🧁", s: "bolinho", p: "bolinhos" },
  { e: "🐔", s: "galinha", p: "galinhas" },
  { e: "📘", s: "livro", p: "livros" },
] as const;

/** Grade de figuras (ex.: 🍎🍎🍎), em linhas de `porLinha`. */
function Figuras({ emoji, n, porLinha = 5 }: { emoji: string; n: number; porLinha?: number }) {
  const linhas: number[] = [];
  for (let i = 0; i < n; i += porLinha) linhas.push(Math.min(porLinha, n - i));
  return (
    <div className="flex flex-col items-center gap-1 text-2xl leading-none sm:text-3xl" aria-hidden>
      {linhas.map((q, i) => (
        <div key={i} className="flex gap-1.5">
          {Array.from({ length: q }, (_, j) => (
            <span key={j}>{emoji}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

function Caixa({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-center text-lg font-semibold">
      {children}
    </div>
  );
}

// ─── 1. contagem ─────────────────────────────────────────────────────────────

function contagem(_s: Serie, nivel: Nivel): Questao {
  const c = pick(COISAS);
  if (nivel === "desafio") {
    const dezenas = rnd(2, 4),
      soltas = rnd(1, 9),
      total = dezenas * 10 + soltas;
    return montar(
      `Cada caixa tem 10 ${c.p}. Quantos(as) ${c.p} há ao todo?`,
      total,
      vizinhos(total, 1).concat([dezenas + soltas, total + 10]),
      `${dezenas} caixas de 10 são ${dezenas * 10}, mais ${soltas} soltas: ${total}.`,
      <div className="flex flex-wrap items-center justify-center gap-2 text-lg">
        {Array.from({ length: dezenas }, (_, i) => (
          <span key={i} className="rounded-lg border-2 border-primary/50 px-2 py-1 font-bold">
            📦 10
          </span>
        ))}
        <span className="text-2xl">{c.e.repeat(soltas)}</span>
      </div>,
    );
  }
  const n = nivel === "retomada" ? rnd(3, 9) : rnd(10, 20);
  return montar(
    `Conte com o dedo: quantos(as) ${c.p} há na figura?`,
    n,
    vizinhos(n),
    `Contando um por um, de 5 em 5 por linha, chegamos a ${n}.`,
    <Figuras emoji={c.e} n={n} />,
  );
}

// ─── 2. comparar e ordenar ───────────────────────────────────────────────────

const LIMITE: Record<Serie, number> = { 1: 20, 2: 100, 3: 999, 4: 9999, 5: 99999 };

function comparar(s: Serie, nivel: Nivel): Questao {
  if (s === 1 && nivel === "retomada") {
    const c = pick(COISAS),
      a = rnd(2, 7);
    let b = rnd(2, 7);
    if (b === a) b = a + 2;
    return montar(
      "Qual grupo tem MAIS?",
      a > b ? "O grupo de cima" : "O grupo de baixo",
      ["O grupo de cima", "O grupo de baixo", "Os dois têm a mesma quantidade"],
      `Em cima há ${a} e embaixo há ${b}.`,
      <div className="flex flex-col items-center gap-3">
        <Figuras emoji={c.e} n={a} porLinha={10} />
        <hr className="w-full border-border" />
        <Figuras emoji={c.e} n={b} porLinha={10} />
      </div>,
    );
  }
  const max = nivel === "retomada" ? Math.max(20, LIMITE[s] / 10) : LIMITE[s];
  const perto = nivel === "desafio";
  const base = rnd(Math.floor(max / 4), max);
  const nums = new Set<number>([base]);
  while (nums.size < 4) {
    const delta = perto ? pick([1, 10, 100, 9, 90]) * pick([1, -1]) : rnd(-max / 3, max / 3);
    const v = Math.round(base + delta);
    if (v > 0 && v <= max) nums.add(v);
  }
  const lista = [...nums];
  const tipo = nivel === "retomada" ? 0 : rnd(0, 2);
  if (tipo === 0) {
    const maior = Math.max(...lista);
    return montar(
      `Qual é o MAIOR número?`,
      maior,
      lista,
      "Compare primeiro quantos algarismos cada número tem; depois compare da esquerda para a direita.",
    );
  }
  if (tipo === 1) {
    const menor = Math.min(...lista);
    return montar(
      `Qual é o MENOR número?`,
      menor,
      lista,
      "O menor número é o que tem menos algarismos ou, com a mesma quantidade, o menor algarismo na primeira casa que muda.",
    );
  }
  const cresc = [...lista].sort((a, b) => a - b).map(fmt).join(" < ");
  const errado1 = [...lista].sort((a, b) => b - a).map(fmt).join(" < ");
  const errado2 = embaralhar(lista).map(fmt).join(" < ");
  const errado3 = [lista[1]!, lista[0]!, ...lista.slice(2)].map(fmt).join(" < ");
  return montar(
    "Qual opção está em ORDEM CRESCENTE (do menor para o maior)?",
    cresc,
    [errado1, errado2, errado3],
    `Do menor para o maior: ${cresc}.`,
  );
}

// ─── 3. valor posicional ─────────────────────────────────────────────────────

function valorPosicional(s: Serie, nivel: Nivel): Questao {
  if (nivel === "retomada") {
    const d = rnd(1, 9),
      u = rnd(0, 9),
      n = d * 10 + u;
    return montar(
      `${d} dezenas e ${u} unidades formam qual número?`,
      n,
      [u * 10 + d, d + u, n + 10, n - 1],
      `${d} dezenas = ${d * 10}. ${d * 10} + ${u} = ${n}.`,
    );
  }
  if (nivel === "pratica" || s === 3) {
    const c = rnd(1, 9),
      d = rnd(0, 9),
      u = rnd(0, 9),
      n = c * 100 + d * 10 + u;
    return montar(
      `${c} centenas, ${d} dezenas e ${u} unidades formam:`,
      n,
      [c * 100 + u * 10 + d, c + d + u, n + 100, n - 10],
      `${c * 100} + ${d * 10} + ${u} = ${n}.`,
    );
  }
  const n = s === 5 ? rnd(10000, 99999) : rnd(1000, 9999);
  const casas = String(n).split("");
  const i = rnd(0, casas.length - 2);
  const alg = Number(casas[i]);
  // Algarismo zero ou repetido deixaria a pergunta ambígua: sorteia de novo.
  if (alg === 0 || casas.filter((x) => x === casas[i]).length > 1) return valorPosicional(s, nivel);
  const potencia = casas.length - 1 - i;
  const valor = alg * 10 ** potencia;
  const casa = ["unidades", "dezenas", "centenas", "unidades de milhar", "dezenas de milhar"][potencia];
  return montar(
    `No número ${fmt(n)}, quanto VALE o algarismo ${alg}?`,
    valor,
    [alg, valor * 10, valor / 10, alg * 10],
    `O ${alg} está na casa das ${casa}: vale ${fmt(valor)}.`,
  );
}

// ─── 4. adição e subtração em problemas ──────────────────────────────────────

function adicaoSubtracao(s: Serie, nivel: Nivel): Questao {
  const c = pick(COISAS),
    nome = pick(NOMES);
  const lim = nivel === "retomada" ? 10 : ({ 1: 20, 2: 50, 3: 500, 4: 1000, 5: 5000 } as const)[s];
  if (nivel === "desafio") {
    const a = rnd(lim / 3, lim),
      b = rnd(lim / 10, lim / 3),
      g = rnd(lim / 10, lim / 4);
    const r = a + b - g;
    return montar(
      `${nome} tinha ${fmt(a)} ${c.p}. Ganhou mais ${fmt(b)} e depois deu ${fmt(g)} para a irmã. Com quantos(as) ficou?`,
      r,
      [a + b, a - g, a + b + g, r + 10, r - 10],
      `Primeiro junta: ${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}. Depois tira: ${fmt(a + b)} − ${fmt(g)} = ${fmt(r)}.`,
    );
  }
  const somar = s === 1 ? Math.random() < 0.4 : Math.random() < 0.5;
  const a = rnd(Math.ceil(lim / 3), lim),
    b = rnd(1, Math.max(1, Math.floor(a / 2)));
  const ilus = nivel === "retomada" ? <Figuras emoji={c.e} n={somar ? a + b : a} /> : undefined;
  if (somar) {
    return montar(
      `${nome} tinha ${fmt(a)} ${c.p} e ganhou mais ${fmt(b)}. Quantos(as) tem agora?`,
      a + b,
      [a - b, a + b + 1, a + b - 1, a + b + 10],
      `Ganhar é juntar: ${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}.`,
      ilus,
    );
  }
  return montar(
    `${nome} tinha ${fmt(a)} ${c.p} e perdeu ${fmt(b)}. Quantos(as) sobraram?`,
    a - b,
    [a + b, a - b + 1, a - b - 1, a - b + 10],
    `Perder é tirar: ${fmt(a)} − ${fmt(b)} = ${fmt(a - b)}.`,
    ilus,
  );
}

// ─── 5. multiplicação e divisão ──────────────────────────────────────────────

function multiplicacao(s: Serie, nivel: Nivel): Questao {
  const c = pick(COISAS);
  if (nivel === "retomada") {
    const g = rnd(2, 4),
      n = rnd(2, 5);
    return montar(
      `Há ${g} pratos com ${n} ${c.p} em cada um. Quantos(as) ${c.p} ao todo?`,
      g * n,
      [g + n, g * n + 1, g * n - 1, g * (n + 1)],
      `${g} vezes ${n}: ${Array(g).fill(n).join(" + ")} = ${g * n}.`,
      <div className="flex flex-wrap justify-center gap-3">
        {Array.from({ length: g }, (_, i) => (
          <div key={i} className="rounded-full border-2 border-border px-3 py-2 text-xl">
            {c.e.repeat(n)}
          </div>
        ))}
      </div>,
    );
  }
  const max = s === 5 ? 12 : s === 4 ? 10 : 9;
  const a = rnd(2, max),
    b = rnd(2, s === 3 ? 6 : 9);
  if (nivel === "desafio" && Math.random() < 0.5) {
    const a = rnd(3, max),
      b = rnd(4, 9),
      total = a * b;
    return montar(
      `A professora dividiu ${total} ${c.p} igualmente entre ${a} grupos. Quantos(as) cada grupo recebeu?`,
      b,
      [a, total - a, b + 1, b - 1],
      `Dividir igualmente: ${total} ÷ ${a} = ${b}, porque ${a} × ${b} = ${total}.`,
    );
  }
  const fator = nivel === "desafio" ? rnd(11, s === 5 ? 99 : 30) : a;
  return montar(
    `Uma caixa tem ${fator} ${c.p}. Quantos(as) há em ${b} caixas iguais?`,
    fator * b,
    [fator + b, fator * (b - 1), fator * b + 10, fator * (b + 1)],
    `${b} caixas × ${fator} = ${fmt(fator * b)}.`,
  );
}

// ─── 6. dinheiro ─────────────────────────────────────────────────────────────

const VALORES = [5, 10, 25, 50, 100, 200, 500, 1000, 2000]; // em centavos
function Dinheiro({ itens }: { itens: number[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {itens.map((v, i) =>
        v < 200 ? (
          <span
            key={i}
            className="flex size-12 items-center justify-center rounded-full border-2 border-amber-500 bg-amber-400/25 text-xs font-bold"
          >
            {v < 100 ? `${v}¢` : "R$1"}
          </span>
        ) : (
          <span
            key={i}
            className="flex h-10 w-20 items-center justify-center rounded-md border-2 border-emerald-600 bg-emerald-500/20 text-sm font-bold"
          >
            R$ {v / 100}
          </span>
        ),
      )}
    </div>
  );
}

function dinheiro(s: Serie, nivel: Nivel): Questao {
  if (nivel === "desafio") {
    const preco = rnd(3, 18) * 100 + pick([0, 50, 25, 75]);
    const pago = preco < 1000 ? 1000 : 2000;
    const troco = pago - preco;
    return montar(
      `Um lanche custa ${reais(preco)}. Paguei com uma nota de ${reais(pago)}. Qual é o troco?`,
      reais(troco),
      [reais(troco + 100), reais(troco - 50), reais(preco), reais(troco + 50)],
      `Troco = ${reais(pago)} − ${reais(preco)} = ${reais(troco)}.`,
    );
  }
  const pool = nivel === "retomada" ? [100, 200, 500, 1000] : VALORES.filter((v) => v <= (s <= 2 ? 1000 : 2000));
  const itens = Array.from({ length: nivel === "retomada" ? rnd(2, 3) : rnd(3, 5) }, () => pick(pool)).sort(
    (a, b) => b - a,
  );
  const total = itens.reduce((a, b) => a + b, 0);
  return montar(
    "Quanto dinheiro há ao todo?",
    reais(total),
    [reais(total + 100), reais(total - 50), reais(total + 50), reais(total * 2)],
    `Somando nota por nota e moeda por moeda: ${itens.map(reais).join(" + ")} = ${reais(total)}.`,
    <Dinheiro itens={itens} />,
  );
}

// ─── 7. tempo e calendário ───────────────────────────────────────────────────

const DIAS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function tempo(s: Serie, nivel: Nivel): Questao {
  if (nivel === "retomada") {
    const i = rnd(0, 6);
    return montar(
      `Hoje é ${DIAS[i]}. Que dia será AMANHÃ?`,
      DIAS[(i + 1) % 7]!,
      [DIAS[(i + 6) % 7]!, DIAS[(i + 2) % 7]!, DIAS[i]!],
      `Depois de ${DIAS[i]} vem ${DIAS[(i + 1) % 7]}.`,
    );
  }
  if (nivel === "pratica" || s <= 2) {
    const i = rnd(0, 11),
      k = rnd(1, 3);
    return montar(
      `Estamos em ${MESES[i]}. Que mês será daqui a ${k} ${k === 1 ? "mês" : "meses"}?`,
      MESES[(i + k) % 12]!,
      [MESES[(i + k + 1) % 12]!, MESES[(i + 12 - k) % 12]!, MESES[(i + k + 11) % 12]!],
      `Contando ${k} ${k === 1 ? "mês" : "meses"} depois de ${MESES[i]}: ${MESES[(i + k) % 12]}.`,
    );
  }
  const q = pick([
    ["Quantos meses tem um BIMESTRE?", 2, [3, 6, 4], "Bi = dois: bimestre são 2 meses."],
    ["Quantos meses tem um SEMESTRE?", 6, [4, 3, 12], "Semestre são 6 meses, metade do ano."],
    ["Quantos meses tem um TRIMESTRE?", 3, [2, 4, 6], "Tri = três: trimestre são 3 meses."],
    ["Quantos dias há em 3 semanas?", 21, [18, 14, 24], "Cada semana tem 7 dias: 3 × 7 = 21."],
    ["Quantos meses há em 2 anos?", 24, [12, 20, 36], "Cada ano tem 12 meses: 2 × 12 = 24."],
    ["Quantas horas tem um dia inteiro?", 24, [12, 60, 20], "Um dia tem 24 horas."],
  ] as const);
  return montar(q[0], q[1], [...q[2]], q[3]);
}

// ─── 8. sequências ───────────────────────────────────────────────────────────

function sequencias(s: Serie, nivel: Nivel): Questao {
  if (s === 1 || nivel === "retomada") {
    const par = embaralhar(["🔴", "🔵", "🟡", "🟢", "⭐", "🌙"]).slice(0, nivel === "retomada" ? 2 : 3);
    const seq = Array.from({ length: 7 }, (_, i) => par[i % par.length]!);
    const falta = par[7 % par.length]!;
    return montar(
      "Qual figura vem depois na sequência?",
      falta,
      par.concat(["🟣"]),
      `A sequência se repete: ${par.join(" ")}.`,
      <Caixa>{seq.join(" ")} ❓</Caixa>,
    );
  }
  const passo = nivel === "desafio" ? pick([4, 5, 6, 25, 50, 100]) : pick([2, 3, 5, 10]);
  const desce = nivel === "desafio" && Math.random() < 0.4;
  const inicio = desce ? rnd(passo * 8, passo * 20) : rnd(0, 50);
  const termos = Array.from({ length: 6 }, (_, i) => inicio + (desce ? -1 : 1) * passo * i);
  const pos = rnd(2, 5);
  const certo = termos[pos]!;
  const mostra = termos.map((t, i) => (i === pos ? "___" : fmt(t))).join(", ");
  return montar(
    `Complete a sequência: ${mostra}`,
    certo,
    [certo + passo, certo - passo, certo + 1, certo + 10],
    `A regra é ${desce ? "tirar" : "somar"} ${passo} a cada número.`,
  );
}

// ─── 9. tabelas e gráficos ───────────────────────────────────────────────────

const TEMAS = [
  { t: "Fruta preferida da turma", itens: ["Banana", "Maçã", "Açaí", "Manga"] },
  { t: "Brincadeira preferida", itens: ["Pega-pega", "Futebol", "Amarelinha", "Pipa"] },
  { t: "Animal de estimação", itens: ["Cachorro", "Gato", "Peixe", "Pássaro"] },
] as const;

function Grafico({ dados }: { dados: { n: string; v: number }[] }) {
  const max = Math.max(...dados.map((d) => d.v));
  return (
    <div className="flex h-44 w-full max-w-sm items-end justify-around gap-2 border-b-2 border-l-2 border-border px-2 pb-1">
      {dados.map((d) => (
        <div key={d.n} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-xs font-bold">{d.v}</span>
          <div className="w-full rounded-t-md bg-primary/70" style={{ height: `${(d.v / max) * 120}px` }} />
          <span className="text-[11px] font-semibold">{d.n}</span>
        </div>
      ))}
    </div>
  );
}
function Tabela({ cab, linhas }: { cab: string[]; linhas: (string | number)[][] }) {
  return (
    <table className="border-collapse text-sm">
      <thead>
        <tr>
          {cab.map((c) => (
            <th key={c} className="border border-border bg-muted px-3 py-1.5">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {linhas.map((l, i) => (
          <tr key={i}>
            {l.map((c, j) => (
              <td key={j} className="border border-border px-3 py-1.5 text-center">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function tabelasGraficos(s: Serie, nivel: Nivel): Questao {
  const tema = pick(TEMAS);
  if (nivel === "desafio" && s >= 3) {
    const turmas = ["Turma A", "Turma B"];
    const vals = turmas.map(() => [rnd(5, 15), rnd(5, 15)] as const);
    const i = rnd(0, 1);
    const alvo = pick(["meninos", "meninas", "total"] as const);
    const v = vals[i]!;
    const certo = alvo === "meninos" ? v[0] : alvo === "meninas" ? v[1] : v[0] + v[1];
    return montar(
      `Quantos(as) ${alvo === "total" ? "alunos no total" : alvo} há na ${turmas[i]}?`,
      certo,
      [v[0], v[1], v[0] + v[1], vals[1 - i]![0], certo + 1],
      alvo === "total"
        ? `Some as duas colunas da ${turmas[i]}: ${v[0]} + ${v[1]} = ${v[0] + v[1]}.`
        : `Procure a linha da ${turmas[i]} e a coluna “${alvo}”.`,
      <Tabela cab={["", "Meninos", "Meninas"]} linhas={turmas.map((t, k) => [t, vals[k]![0], vals[k]![1]])} />,
    );
  }
  const valores = embaralhar([rnd(2, 5), rnd(6, 9), rnd(10, 13), rnd(14, 17)]);
  const dados = tema.itens.map((n, i) => ({ n, v: valores[i]! }));
  const usaGrafico = s === 2 ? Math.random() < 0.5 : rnd(0, 1) === 1;
  const ilus = usaGrafico ? (
    <div className="grid justify-items-center gap-1">
      <span className="text-xs font-semibold text-muted-foreground">{tema.t}</span>
      <Grafico dados={dados} />
    </div>
  ) : (
    <div className="grid justify-items-center gap-1">
      <span className="text-xs font-semibold text-muted-foreground">{tema.t}</span>
      <Tabela cab={["Opção", "Votos"]} linhas={dados.map((d) => [d.n, d.v])} />
    </div>
  );
  const mais = dados.reduce((a, b) => (b.v > a.v ? b : a));
  if (nivel === "retomada") {
    return montar("Qual opção recebeu MAIS votos?", mais.n, tema.itens.slice(), `${mais.n} teve ${mais.v} votos, o maior número.`, ilus);
  }
  const [x, y] = embaralhar(dados).slice(0, 2) as [typeof mais, typeof mais];
  if (nivel === "pratica") {
    return montar(`Quantos votos teve ${x.n}?`, x.v, dados.map((d) => d.v), `Procure ${x.n} e leia o número: ${x.v}.`, ilus);
  }
  const dif = Math.abs(x.v - y.v);
  return montar(
    `Quantos votos ${x.v > y.v ? x.n : y.n} teve A MAIS que ${x.v > y.v ? y.n : x.n}?`,
    dif,
    [x.v + y.v, x.v, y.v, dif + 1],
    `${Math.max(x.v, y.v)} − ${Math.min(x.v, y.v)} = ${dif}.`,
    ilus,
  );
}

// ─── 10. localização ─────────────────────────────────────────────────────────

function localizacao(s: Serie, nivel: Nivel): Questao {
  if (s <= 2 || nivel === "retomada") {
    const bichos = embaralhar(["🐶", "🐱", "🐰", "🐸", "🐵"]).slice(0, 3);
    const lado = pick(["direita", "esquerda"] as const);
    const i = lado === "direita" ? rnd(0, 1) : rnd(1, 2);
    const certo = bichos[lado === "direita" ? i + 1 : i - 1]!;
    return montar(
      `Olhando a fila, quem está à ${lado.toUpperCase()} do ${bichos[i]}?`,
      certo,
      bichos.filter((b) => b !== certo).concat(["🐮"]),
      `Direita é o lado da mão que a maioria usa para escrever. À ${lado} do ${bichos[i]} está o ${certo}.`,
      <div className="grid justify-items-center gap-1">
        <Caixa>
          <span className="text-4xl tracking-[0.4em]">{bichos.join("")}</span>
        </Caixa>
        <span className="text-xs text-muted-foreground">⬅️ esquerda · direita ➡️</span>
      </div>,
    );
  }
  const cols = ["A", "B", "C", "D", "E"];
  const r = rnd(1, 5),
    c = rnd(0, 4);
  const alvo = pick(["⭐", "🏠", "🌳", "🎈"]);
  const grade = (
    <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: "24px repeat(5, 36px)" }}>
      <span />
      {cols.map((l) => (
        <span key={l} className="text-center text-xs font-bold">
          {l}
        </span>
      ))}
      {[5, 4, 3, 2, 1].map((lin) => [
        <span key={`r${lin}`} className="self-center text-xs font-bold">
          {lin}
        </span>,
        ...cols.map((l, ci) => (
          <span key={`${lin}${l}`} className="flex size-9 items-center justify-center border border-border text-lg">
            {lin === r && ci === c ? alvo : ""}
          </span>
        )),
      ])}
    </div>
  );
  const certo = `${cols[c]}${r}`;
  if (nivel === "desafio") {
    const dx = rnd(1, 2) * pick([1, -1]),
      dy = rnd(1, 2) * pick([1, -1]);
    const nc = c + dx,
      nr = r + dy;
    if (nc < 0 || nc > 4 || nr < 1 || nr > 5) return localizacao(s, nivel);
    const fim = `${cols[nc]}${nr}`;
    return montar(
      `O ${alvo} anda ${Math.abs(dx)} casa(s) para a ${dx > 0 ? "direita" : "esquerda"} e ${Math.abs(dy)} para ${dy > 0 ? "cima" : "baixo"}. Em que casa ele para?`,
      fim,
      [certo, `${cols[c]}${nr}`, `${cols[nc]}${r}`, `${cols[(nc + 1) % 5]}${nr}`],
      `Saindo de ${certo}: coluna ${cols[nc]}, linha ${nr}.`,
      grade,
    );
  }
  return montar(
    `Em que casa está o ${alvo}? (primeiro a letra da coluna, depois o número da linha)`,
    certo,
    [`${cols[(c + 1) % 5]}${r}`, `${cols[c]}${(r % 5) + 1}`, `${cols[(c + 4) % 5]}${((r + 3) % 5) + 1}`],
    `Coluna ${cols[c]} (em cima) e linha ${r} (ao lado): ${certo}.`,
    grade,
  );
}

// ─── 11. figuras e sólidos ───────────────────────────────────────────────────

function Forma({ tipo }: { tipo: string }) {
  const cls = "fill-primary/25 stroke-primary";
  return (
    <svg width="110" height="90" viewBox="0 0 110 90" aria-hidden>
      {tipo === "círculo" && <circle cx="55" cy="45" r="38" className={cls} strokeWidth="3" />}
      {tipo === "quadrado" && <rect x="17" y="7" width="76" height="76" className={cls} strokeWidth="3" />}
      {tipo === "retângulo" && <rect x="5" y="20" width="100" height="50" className={cls} strokeWidth="3" />}
      {tipo === "triângulo" && <polygon points="55,6 104,84 6,84" className={cls} strokeWidth="3" />}
    </svg>
  );
}
const SOLIDOS = [
  { o: "🎲 um dado", n: "cubo", plan: "6 quadrados iguais" },
  { o: "⚽ uma bola", n: "esfera", plan: "não tem planificação (é toda arredondada)" },
  { o: "🥫 uma lata de milho", n: "cilindro", plan: "2 círculos e 1 retângulo" },
  { o: "🍦 a casquinha de sorvete", n: "cone", plan: "1 círculo e uma parte curva em forma de leque" },
  { o: "📦 uma caixa de sapato", n: "bloco retangular", plan: "6 retângulos (em pares iguais)" },
  { o: "⛺ uma barraca de acampar", n: "pirâmide", plan: "1 quadrado e 4 triângulos" },
] as const;

function figuras(s: Serie, nivel: Nivel): Questao {
  if (s === 2 || (s <= 2 && nivel !== "desafio")) {
    const t = pick(["círculo", "quadrado", "retângulo", "triângulo"]);
    return montar(
      "Qual é o nome desta figura?",
      t,
      ["círculo", "quadrado", "retângulo", "triângulo"],
      {
        círculo: "O círculo é redondo e não tem lados.",
        quadrado: "O quadrado tem 4 lados do mesmo tamanho.",
        retângulo: "O retângulo tem 4 lados: 2 compridos e 2 curtos.",
        triângulo: "O triângulo tem 3 lados.",
      }[t]!,
      <Forma tipo={t} />,
    );
  }
  const so = pick(SOLIDOS);
  if (nivel === "desafio" && so.n !== "esfera") {
    return montar(
      `Qual sólido geométrico é formado ao montar esta planificação: ${so.plan}?`,
      so.n,
      SOLIDOS.map((x) => x.n),
      `Com ${so.plan} montamos um(a) ${so.n}.`,
    );
  }
  return montar(
    `${so.o} lembra qual sólido geométrico?`,
    so.n,
    SOLIDOS.map((x) => x.n),
    `${so.o} tem a forma de um(a) ${so.n}.`,
  );
}

// ─── 12. medidas ─────────────────────────────────────────────────────────────

function medidas(s: Serie, nivel: Nivel): Questao {
  if (nivel === "retomada") {
    const q = pick([
      ["Para medir o comprimento da mesa, usamos:", "a régua ou a fita métrica", ["a balança", "o relógio", "o copo medidor"], "Comprimento se mede com régua, trena ou fita métrica."],
      ["Para saber quanto pesa uma melancia, usamos:", "a balança", ["a régua", "o relógio", "o termômetro"], "Massa (peso) se mede com a balança."],
      ["Para saber quanto tempo dura o recreio, usamos:", "o relógio", ["a balança", "a régua", "a fita métrica"], "Tempo se mede com relógio ou cronômetro."],
      ["Para medir quanto suco cabe numa jarra, usamos:", "o copo medidor (litros)", ["a régua", "a balança", "o relógio"], "Capacidade se mede em litros e mililitros."],
    ] as const);
    return montar(q[0], q[1], [...q[2]], q[3]);
  }
  if (nivel === "pratica") {
    const m = rnd(1, 9);
    const q = pick([
      [`Quantos centímetros há em ${m} metro(s)?`, m * 100, [m * 10, m * 1000, m], `1 metro = 100 centímetros. ${m} × 100 = ${m * 100} cm.`],
      [`Quantos metros há em ${m} quilômetro(s)?`, m * 1000, [m * 100, m * 10, m], `1 quilômetro = 1.000 metros. ${m} × 1.000 = ${fmt(m * 1000)} m.`],
      [`Quantos gramas há em ${m} quilo(s)?`, m * 1000, [m * 100, m * 10, m], `1 quilo = 1.000 gramas.`],
      [`Quantos mililitros há em ${m} litro(s)?`, m * 1000, [m * 100, m * 10, m], `1 litro = 1.000 mililitros.`],
    ] as const);
    return montar(q[0], q[1], [...q[2]], q[3]);
  }
  const a = rnd(2, 9) * 100,
    b = rnd(1, 9) * 10;
  const nome = pick(NOMES);
  return montar(
    `${nome} caminhou ${a} metros até a escola e mais ${b} metros até a biblioteca. Quantos metros andou? E quanto falta para completar 1 quilômetro?`,
    `${a + b} m; faltam ${1000 - a - b} m`,
    [`${a + b} m; faltam ${1000 - a} m`, `${a - b} m; faltam ${1000 - a + b} m`, `${a + b} m; faltam ${a + b} m`],
    `${a} + ${b} = ${a + b} m. 1 km = 1.000 m, então faltam 1.000 − ${a + b} = ${1000 - a - b} m.`,
  );
}

// ─── registro dos geradores ──────────────────────────────────────────────────

export interface Gerador {
  id: string;
  titulo: string;
  emoji: string;
  conteudo: string;
  /** Séries atendidas e os descritores (códigos da prova) de cada uma. */
  descritores: Partial<Record<Serie, string[]>>;
  gerar: (serie: Serie, nivel: Nivel) => Questao;
}

export const GERADORES: Gerador[] = [
  { id: "contagem", titulo: "Contar e agrupar", emoji: "🔢", conteudo: "Números", descritores: { 1: ["1N2.4"], 2: ["2N2.4"] }, gerar: contagem },
  { id: "comparar", titulo: "Comparar e ordenar números", emoji: "⚖️", conteudo: "Números", descritores: { 1: ["1N1.4"], 2: ["2N1.4"], 3: ["3N1.5"], 4: ["4N1.3"], 5: ["5N1.1", "5N1.2"] }, gerar: comparar },
  { id: "valor-posicional", titulo: "Unidades, dezenas e centenas", emoji: "🧮", conteudo: "Números", descritores: { 3: ["3N1.8"], 4: ["4N1.4"], 5: ["5N1.4"] }, gerar: valorPosicional },
  { id: "adicao-subtracao", titulo: "Problemas de juntar e tirar", emoji: "➕", conteudo: "Operações", descritores: { 1: ["1N2.1"], 2: ["2N2.1"], 3: ["3N2.1"], 4: ["4N2.1"], 5: ["5N2.1"] }, gerar: adicaoSubtracao },
  { id: "multiplicacao", titulo: "Multiplicar e dividir em problemas", emoji: "✖️", conteudo: "Operações", descritores: { 3: ["3N2.2"], 4: ["4N2.2"], 5: ["5N2.2"] }, gerar: multiplicacao },
  { id: "dinheiro", titulo: "Dinheiro: moedas, cédulas e troco", emoji: "💰", conteudo: "Grandezas e medidas", descritores: { 2: ["2M1.7"], 3: ["3M1.7"], 4: ["4M1.6"] }, gerar: dinheiro },
  { id: "tempo", titulo: "Dias, meses e calendário", emoji: "📅", conteudo: "Grandezas e medidas", descritores: { 1: ["1M1.6"], 4: ["4M1.6"] }, gerar: tempo },
  { id: "sequencias", titulo: "Sequências e padrões", emoji: "🔁", conteudo: "Álgebra", descritores: { 1: ["1A1.4"], 3: ["3A1.3"], 4: ["4A1.2"] }, gerar: sequencias },
  { id: "tabelas-graficos", titulo: "Ler tabelas e gráficos", emoji: "📊", conteudo: "Estatística", descritores: { 2: ["2E1.2", "2E1.3"], 3: ["3E1.2", "3E1.3"], 4: ["4E1.2", "4E1.3"], 5: ["5E1.2", "5E1.3"] }, gerar: tabelasGraficos },
  { id: "localizacao", titulo: "Direita, esquerda e malha quadriculada", emoji: "🧭", conteudo: "Geometria", descritores: { 1: ["1G2.1"], 2: ["2G2.1"], 4: ["4G2.1"], 5: ["5G2.1"] }, gerar: localizacao },
  { id: "figuras", titulo: "Figuras planas e sólidos", emoji: "🔷", conteudo: "Geometria", descritores: { 2: ["2G1.3"], 3: ["3G1.2"], 4: ["4G1.4"], 5: ["5G1.3", "5G1.5"] }, gerar: figuras },
  { id: "medidas", titulo: "Medidas: comprimento, massa e capacidade", emoji: "📏", conteudo: "Grandezas e medidas", descritores: { 3: ["3M1.4"], 4: ["4M1.2"], 5: ["5M1.2", "5M2.2"] }, gerar: medidas },
];

/** Monta uma rodada de `n` questões novas. */
export function gerarRodada(g: Gerador, serie: Serie, nivel: Nivel, n = 8): Questao[] {
  const lista: Questao[] = [];
  const vistas = new Set<string>();
  let tentativas = 0;
  while (lista.length < n && tentativas < n * 6) {
    tentativas += 1;
    const q = g.gerar(serie, nivel);
    if (vistas.has(q.enunciado) || q.respostaCorreta < 0 || q.opcoes.length < 2) continue;
    vistas.add(q.enunciado);
    lista.push(q);
  }
  return lista;
}
