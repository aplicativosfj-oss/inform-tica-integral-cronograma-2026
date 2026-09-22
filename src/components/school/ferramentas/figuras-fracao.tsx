/**
 * Os três jeitos de "ver" uma fração nestas ferramentas: a pizza (partes de
 * um círculo), a barra de chocolate (partes de um retângulo) e a jarra de
 * litros (partes de uma altura). São desenhos em SVG feitos para lembrar o
 * objeto de verdade — massa, borda e calabresa na pizza; sulcos e brilho no
 * chocolate; marcas de medida e reflexo na jarra — porque a criança entende
 * "três quartos" muito antes pela pizza do que pelo número.
 *
 * Todas as figuras recebem `total` (em quantas partes o inteiro foi dividido)
 * e `pintadas` (quantas estão preenchidas). Quando recebem `aoClicar`, cada
 * parte vira um botão: clicar pinta ou despinta, que é a parte "manipular".
 */

export type Representacao = "pizza" | "chocolate" | "litros";

export const REPRESENTACOES: { id: Representacao; nome: string; emoji: string }[] = [
  { id: "pizza", nome: "Pizza", emoji: "🍕" },
  { id: "chocolate", nome: "Chocolate", emoji: "🍫" },
  { id: "litros", nome: "Litros", emoji: "🧃" },
];

interface FiguraProps {
  total: number;
  pintadas: number;
  /** Recebe quantas partes devem ficar pintadas depois do clique. */
  aoClicar?: (novasPintadas: number) => void;
  /** Cor do preenchimento; o padrão é a cor "de verdade" de cada figura. */
  cor?: string;
  tamanho?: number;
}

/** Ponto na borda do círculo, com 0° no topo e girando no sentido do relógio. */
function ponto(cx: number, cy: number, r: number, grau: number) {
  const rad = ((grau - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function fatia(cx: number, cy: number, r: number, de: number, ate: number): string {
  const a = ponto(cx, cy, r, de);
  const b = ponto(cx, cy, r, ate);
  const arcoGrande = ate - de > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${a.x} ${a.y} A ${r} ${r} 0 ${arcoGrande} 1 ${b.x} ${b.y} Z`;
}

const MASSA = "#e8b96a";
const BORDA = "#c98c3c";
const MOLHO = "#c0392b";
const QUEIJO_PADRAO = "#f2c14e";

export function Pizza({ total, pintadas, aoClicar, cor, tamanho = 180 }: FiguraProps) {
  const c = tamanho / 2;
  const rBorda = c - 2;
  const rMassa = rBorda - tamanho * 0.055;
  const queijo = cor ?? QUEIJO_PADRAO;
  const passo = 360 / total;

  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox={`0 0 ${tamanho} ${tamanho}`}
      role="img"
      aria-label={`Pizza dividida em ${total} pedaços, ${pintadas} com recheio`}
    >
      <circle cx={c} cy={c} r={rBorda} fill={BORDA} />
      <circle cx={c} cy={c} r={rMassa} fill={MASSA} />
      {Array.from({ length: total }, (_, i) => {
        const cheia = i < pintadas;
        const meio = ponto(c, c, rMassa * 0.58, i * passo + passo / 2);
        return (
          <g
            key={i}
            onClick={aoClicar ? () => aoClicar(cheia ? i : i + 1) : undefined}
            className={aoClicar ? "cursor-pointer" : undefined}
          >
            <path
              d={total === 1 ? "" : fatia(c, c, rMassa, i * passo, (i + 1) * passo)}
              fill={cheia ? MOLHO : "transparent"}
              stroke={BORDA}
              strokeWidth={1.5}
            />
            {total === 1 && (
              <circle
                cx={c}
                cy={c}
                r={rMassa}
                fill={cheia ? MOLHO : "transparent"}
                stroke={BORDA}
                strokeWidth={1.5}
              />
            )}
            {cheia && (
              <>
                <circle cx={meio.x} cy={meio.y} r={rMassa * 0.13} fill={queijo} opacity={0.9} />
                <circle
                  cx={meio.x - rMassa * 0.16}
                  cy={meio.y + rMassa * 0.12}
                  r={rMassa * 0.07}
                  fill="#8e2a20"
                />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

const CACAU = "#5b3a24";
const CACAU_CLARO = "#7a4f31";

export function BarraChocolate({ total, pintadas, aoClicar, cor, tamanho = 260 }: FiguraProps) {
  // Até 6 pedaços numa fila só; acima disso vira tabuete de duas fileiras,
  // que é como a barra de verdade é quebrada.
  const filas = total > 6 ? 2 : 1;
  const colunas = Math.ceil(total / filas);
  const largura = tamanho;
  const altura = Math.round(tamanho * (filas === 1 ? 0.34 : 0.5));
  const pad = 5;
  const lp = (largura - pad * 2) / colunas;
  const ap = (altura - pad * 2) / filas;
  const recheio = cor ?? CACAU;

  return (
    <svg
      width={largura}
      height={altura}
      viewBox={`0 0 ${largura} ${altura}`}
      role="img"
      aria-label={`Barra de chocolate com ${total} pedaços, ${pintadas} escolhidos`}
    >
      <rect
        x={1}
        y={1}
        width={largura - 2}
        height={altura - 2}
        rx={10}
        fill={CACAU_CLARO}
        opacity={0.35}
      />
      {Array.from({ length: total }, (_, i) => {
        const cheia = i < pintadas;
        const cx = pad + (i % colunas) * lp;
        const cy = pad + Math.floor(i / colunas) * ap;
        return (
          <g
            key={i}
            onClick={aoClicar ? () => aoClicar(cheia ? i : i + 1) : undefined}
            className={aoClicar ? "cursor-pointer" : undefined}
          >
            <rect
              x={cx + 1.5}
              y={cy + 1.5}
              width={lp - 3}
              height={ap - 3}
              rx={4}
              fill={cheia ? recheio : "var(--color-muted)"}
              stroke={cheia ? CACAU_CLARO : "var(--color-border)"}
              strokeWidth={2}
            />
            {/* Brilho do alto do pedaço: é o que dá o ar de chocolate. */}
            {cheia && (
              <rect
                x={cx + 4}
                y={cy + 4}
                width={lp - 8}
                height={(ap - 6) * 0.3}
                rx={3}
                fill="#ffffff"
                opacity={0.16}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

const SUCO = "#f39c12";

export function Jarra({ total, pintadas, aoClicar, cor, tamanho = 150 }: FiguraProps) {
  const largura = tamanho;
  const altura = Math.round(tamanho * 1.35);
  const x0 = largura * 0.16;
  const x1 = largura * 0.78;
  const y0 = altura * 0.1;
  const y1 = altura * 0.94;
  const dentro = y1 - y0;
  const liquido = cor ?? SUCO;
  const alturaCheia = (dentro * pintadas) / total;

  return (
    <svg
      width={largura}
      height={altura}
      viewBox={`0 0 ${largura} ${altura}`}
      role="img"
      aria-label={`Jarra com ${total} marcas, cheia até a marca ${pintadas}`}
    >
      {/* Alça da jarra, atrás do corpo. */}
      <path
        d={`M ${x1} ${y0 + dentro * 0.22} q ${largura * 0.2} ${dentro * 0.1} 0 ${dentro * 0.3}`}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth={7}
        strokeLinecap="round"
      />
      <clipPath id={`jarra-${total}-${pintadas}-${tamanho}`}>
        <rect x={x0} y={y0} width={x1 - x0} height={dentro} rx={8} />
      </clipPath>
      <rect x={x0} y={y0} width={x1 - x0} height={dentro} rx={8} fill="var(--color-muted)" />
      <g clipPath={`url(#jarra-${total}-${pintadas}-${tamanho})`}>
        <rect x={x0} y={y1 - alturaCheia} width={x1 - x0} height={alturaCheia} fill={liquido} />
        {alturaCheia > 0 && (
          <ellipse
            cx={(x0 + x1) / 2}
            cy={y1 - alturaCheia}
            rx={(x1 - x0) / 2}
            ry={5}
            fill="#ffffff"
            opacity={0.25}
          />
        )}
      </g>
      {/* Marcas de medida: cada uma é um degrau clicável. */}
      {Array.from({ length: total }, (_, i) => {
        const nivel = total - i; // de cima para baixo
        const y = y0 + (dentro * i) / total;
        return (
          <g
            key={i}
            onClick={aoClicar ? () => aoClicar(pintadas === nivel ? nivel - 1 : nivel) : undefined}
            className={aoClicar ? "cursor-pointer" : undefined}
          >
            <rect x={x0} y={y} width={x1 - x0} height={dentro / total} fill="transparent" />
            <line
              x1={x0}
              y1={y + dentro / total}
              x2={x0 + (x1 - x0) * 0.32}
              y2={y + dentro / total}
              stroke="var(--color-foreground)"
              strokeWidth={1.5}
              opacity={0.45}
            />
          </g>
        );
      })}
      <rect
        x={x0}
        y={y0}
        width={x1 - x0}
        height={dentro}
        rx={8}
        fill="none"
        stroke="var(--color-foreground)"
        strokeWidth={2.5}
        opacity={0.55}
      />
      {/* Reflexo do vidro. */}
      <rect
        x={x0 + 6}
        y={y0 + 8}
        width={6}
        height={dentro * 0.45}
        rx={3}
        fill="#ffffff"
        opacity={0.3}
      />
    </svg>
  );
}

export function Figura({ tipo, ...props }: FiguraProps & { tipo: Representacao }) {
  if (tipo === "pizza") return <Pizza {...props} />;
  if (tipo === "chocolate") return <BarraChocolate {...props} />;
  return <Jarra {...props} />;
}
