/**
 * Material dourado em SVG: o cubinho (unidade), a barrinha de 10 (dezena), a
 * placa de 100 (centena) e o cubão de 1000 (milhar) — as mesmas peças de
 * madeira da caixa da escola.
 *
 * O desenho respeita a proporção real: a barra é dez cubinhos enfileirados e
 * a placa é dez barras. É isso que faz a criança enxergar, sem ninguém
 * explicar, que uma centena é cem unidades.
 */

export type Ordem = "unidade" | "dezena" | "centena" | "milhar";

export const ORDENS: { id: Ordem; nome: string; plural: string; valor: number; cor: string }[] = [
  { id: "milhar", nome: "Milhar", plural: "milhares", valor: 1000, cor: "#7c3aed" },
  { id: "centena", nome: "Centena", plural: "centenas", valor: 100, cor: "#0891b2" },
  { id: "dezena", nome: "Dezena", plural: "dezenas", valor: 10, cor: "#16a34a" },
  { id: "unidade", nome: "Unidade", plural: "unidades", valor: 1, cor: "#ea580c" },
];

export function corDa(ordem: Ordem): string {
  return ORDENS.find((o) => o.id === ordem)!.cor;
}

const LADO = 7;

/** Grade de cubinhos: 1×1 (unidade), 1×10 (dezena) ou 10×10 (centena). */
function grade(colunas: number, linhas: number, cor: string) {
  return Array.from({ length: colunas * linhas }, (_, i) => (
    <rect
      key={i}
      x={(i % colunas) * LADO}
      y={Math.floor(i / colunas) * LADO}
      width={LADO - 1}
      height={LADO - 1}
      rx={1}
      fill={cor}
      stroke="#00000033"
      strokeWidth={0.5}
    />
  ));
}

/**
 * Todas as peças são medidas pelo lado do cubinho (`cubo`, em pixels): a
 * barra tem dez cubinhos de altura e a placa, dez por dez. Passar um tamanho
 * único por peça quebrava essa proporção, e é justamente a proporção que
 * ensina que uma centena são cem unidades.
 */
export function Peca({ ordem, cubo = 8 }: { ordem: Ordem; cubo?: number }) {
  const cor = corDa(ordem);

  if (ordem === "unidade") {
    return (
      <svg viewBox="0 0 7 7" width={cubo} height={cubo} role="img" aria-label="1 unidade">
        {grade(1, 1, cor)}
      </svg>
    );
  }

  if (ordem === "dezena") {
    return (
      <svg
        viewBox="0 0 7 70"
        width={cubo}
        height={cubo * 10}
        role="img"
        aria-label="1 dezena, que são 10 unidades"
      >
        {grade(1, 10, cor)}
      </svg>
    );
  }

  if (ordem === "centena") {
    return (
      <svg
        viewBox="0 0 70 70"
        width={cubo * 10}
        height={cubo * 10}
        role="img"
        aria-label="1 centena, que são 100 unidades"
      >
        {grade(10, 10, cor)}
      </svg>
    );
  }

  // O milhar é a placa vista de lado, com profundidade: é um cubo de mil.
  return (
    <svg
      viewBox="0 0 88 88"
      width={cubo * 11}
      height={cubo * 11}
      role="img"
      aria-label="1 milhar, que são 1000 unidades"
    >
      <g transform="translate(0 18)">
        {/* topo e lateral dão o volume do cubão */}
        <path d="M0 0 L18 -18 L88 -18 L70 0 Z" fill={cor} opacity={0.55} />
        <path d="M70 0 L88 -18 L88 52 L70 70 Z" fill={cor} opacity={0.75} />
        <g>{grade(10, 10, cor)}</g>
        <path
          d="M0 0 L18 -18 L88 -18 L88 52 L70 70 L0 70 Z"
          fill="none"
          stroke="#00000044"
          strokeWidth={1}
        />
      </g>
    </svg>
  );
}

/** Uma pilha de peças da mesma ordem — o que fica numa coluna do quadro. */
export function Pilha({
  ordem,
  quantidade,
  cubo = 8,
}: {
  ordem: Ordem;
  quantidade: number;
  cubo?: number;
}) {
  return (
    <div className="flex flex-wrap items-end justify-center gap-[2px]">
      {Array.from({ length: quantidade }, (_, i) => (
        <Peca key={i} ordem={ordem} cubo={cubo} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Número por extenso                                                  */
/* ------------------------------------------------------------------ */

const UNIDADES = [
  "zero",
  "um",
  "dois",
  "três",
  "quatro",
  "cinco",
  "seis",
  "sete",
  "oito",
  "nove",
  "dez",
  "onze",
  "doze",
  "treze",
  "catorze",
  "quinze",
  "dezesseis",
  "dezessete",
  "dezoito",
  "dezenove",
];

const DEZENAS = [
  "",
  "",
  "vinte",
  "trinta",
  "quarenta",
  "cinquenta",
  "sessenta",
  "setenta",
  "oitenta",
  "noventa",
];

const CENTENAS = [
  "",
  "cento",
  "duzentos",
  "trezentos",
  "quatrocentos",
  "quinhentos",
  "seiscentos",
  "setecentos",
  "oitocentos",
  "novecentos",
];

/** Escreve por extenso de 0 a 9999 — a faixa que o Fundamental I usa. */
export function porExtenso(n: number): string {
  if (n < 0 || n > 9999) return String(n);
  if (n < 20) return UNIDADES[n]!;
  if (n < 100) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    return u ? `${DEZENAS[d]} e ${UNIDADES[u]}` : DEZENAS[d]!;
  }
  if (n === 100) return "cem";
  if (n < 1000) {
    const c = Math.floor(n / 100);
    const resto = n % 100;
    return resto ? `${CENTENAS[c]} e ${porExtenso(resto)}` : CENTENAS[c]!;
  }
  const m = Math.floor(n / 1000);
  const resto = n % 1000;
  const parteMil = m === 1 ? "mil" : `${UNIDADES[m]} mil`;
  if (!resto) return parteMil;
  // "mil e quarenta", mas "mil duzentos e trinta": o "e" só entra quando o
  // resto é menor que 100 ou é uma centena redonda.
  const junta = resto < 100 || resto % 100 === 0 ? " e " : " ";
  return parteMil + junta + porExtenso(resto);
}
