import { ArrowRight } from "lucide-react";
import { useState } from "react";

import {
  converter,
  degraus,
  FAMILIAS,
  familia,
  formatar,
  type Familia,
  type Unidade,
} from "@/components/school/ferramentas/medidas";
import { CampoNumero, Seletor } from "@/components/school/ferramentas/controles";
import { cn } from "@/lib/utils";

/**
 * Conversor de medidas com a escadinha — o desenho que a escola usa há
 * décadas porque funciona: descer um degrau multiplica por 10, subir divide
 * por 10. Aqui a escada é viva: ela mostra o caminho entre a unidade de
 * origem e a de destino e diz quantas casas a vírgula andou.
 *
 * As três famílias (comprimento, capacidade e massa) usam a mesma escada de
 * propósito — é o mesmo mecanismo com nomes diferentes.
 */

/** A escadinha: sete degraus do maior para o menor, com o caminho destacado. */
function Escada({
  unidades,
  iDe,
  iPara,
  aoEscolher,
}: {
  unidades: Unidade[];
  iDe: number;
  iPara: number;
  aoEscolher: (i: number) => void;
}) {
  const L = 420;
  const A = 156;
  const larg = L / unidades.length;
  const alt = 17;
  const topo = (i: number) => 22 + i * alt;
  const menor = Math.min(iDe, iPara);
  const maior = Math.max(iDe, iPara);

  return (
    <svg viewBox={`0 0 ${L} ${A}`} className="w-full" role="img" aria-label="Escada das unidades">
      {unidades.map((u, i) => {
        const x = i * larg;
        const y = topo(i);
        const noCaminho = i >= menor && i <= maior;
        const ponta = i === iDe || i === iPara;
        return (
          <g key={u.simbolo} onClick={() => aoEscolher(i)} className="cursor-pointer">
            {/* O degrau: cada um começa mais embaixo que o anterior. */}
            <rect
              x={x + 1.5}
              y={y}
              width={larg - 3}
              height={A - y - 4}
              rx={4}
              fill={
                ponta
                  ? "var(--color-primary)"
                  : noCaminho
                    ? "color-mix(in srgb, var(--color-primary) 22%, transparent)"
                    : "var(--color-muted)"
              }
              stroke="var(--color-border)"
            />
            <text
              x={x + larg / 2}
              y={y + 14}
              textAnchor="middle"
              className={cn("text-[13px] font-bold", ponta ? "fill-white" : "fill-foreground")}
            >
              {u.simbolo}
            </text>
            {ponta && (
              <text
                x={x + larg / 2}
                y={y + 25}
                textAnchor="middle"
                className="fill-white text-[8.5px] font-semibold"
              >
                {i === iDe ? "daqui" : "para cá"}
              </text>
            )}
          </g>
        );
      })}
      {/* As setas ×10 / ÷10 moram no vão livre acima do degrau mais baixo de
        cada par: em cima do degrau alto elas ficariam ilegíveis. */}
      {unidades.map((_, i) => {
        if (i >= maior || i < menor) return null;
        const descendo = iPara > iDe;
        const y = topo(i + 1) - 5;
        const x1 = (i + 1) * larg + 4;
        const x2 = (i + 1) * larg + larg - 7;
        return (
          <g key={`seta-${i}`}>
            <path
              d={descendo ? `M ${x1} ${y} L ${x2} ${y}` : `M ${x2} ${y} L ${x1} ${y}`}
              stroke="var(--color-primary)"
              strokeWidth={1.8}
              markerEnd="url(#pontaSeta)"
            />
            <text
              x={(x1 + x2) / 2}
              y={y - 4}
              textAnchor="middle"
              className="fill-primary text-[9px] font-bold"
            >
              {descendo ? "×10" : "÷10"}
            </text>
          </g>
        );
      })}
      <defs>
        <marker id="pontaSeta" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--color-primary)" />
        </marker>
      </defs>
    </svg>
  );
}

export function ConversorMedidas() {
  const [fam, setFam] = useState<Familia>("comprimento");
  const [valor, setValor] = useState(1);
  const [iDe, setIDe] = useState(0);
  const [iPara, setIPara] = useState(3);

  const info = familia(fam);
  const de = info.unidades[iDe]!;
  const para = info.unidades[iPara]!;
  const resultado = converter(valor, de, para);
  const casas = degraus(de, para);

  function trocarFamilia(f: Familia) {
    setFam(f);
    // Os índices valem para qualquer família: a escada tem o mesmo formato.
    setIDe(0);
    setIPara(3);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 rounded-lg bg-muted/60 p-1">
        {FAMILIAS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => trocarFamilia(f.id)}
            className={cn(
              "flex-1 cursor-pointer rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              fam === f.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f.nome}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{info.pergunta}</p>

      {/* A conta */}
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-border bg-background p-3">
        <CampoNumero
          valor={Number.isNaN(valor) ? "" : valor}
          aoMudar={(v) => setValor(Number.isNaN(v) ? 0 : v)}
          min={0}
          max={100000}
          rotulo="Valor a converter"
          largura="w-16"
          comBotoes={false}
        />
        <Seletor
          valor={String(iDe)}
          aoMudar={(v) => setIDe(Number(v))}
          rotulo="Unidade de origem"
          largura="w-[5.5rem]"
          opcoes={info.unidades.map((u, i) => ({ valor: String(i), rotulo: u.simbolo }))}
        />
        <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-[70px] text-center text-lg font-bold text-primary">
          {formatar(resultado)}
        </span>
        <Seletor
          valor={String(iPara)}
          aoMudar={(v) => setIPara(Number(v))}
          rotulo="Unidade de destino"
          largura="w-[5.5rem]"
          opcoes={info.unidades.map((u, i) => ({ valor: String(i), rotulo: u.simbolo }))}
        />
      </div>

      <Escada
        unidades={info.unidades}
        iDe={iDe}
        iPara={iPara}
        aoEscolher={(i) => {
          // Clicar na escada troca o destino: é o gesto mais natural depois
          // de escolher de onde se está saindo.
          setIPara(i);
        }}
      />

      <p className="rounded-xl bg-primary/10 p-2.5 text-center text-xs text-foreground">
        {casas === 0 ? (
          <>
            {de.simbolo} e {para.simbolo} são a mesma unidade: o número não muda.
          </>
        ) : (
          <>
            De <b>{de.nome}</b> para <b>{para.nome}</b> são{" "}
            <b>
              {Math.abs(casas)} {Math.abs(casas) === 1 ? "degrau" : "degraus"}
            </b>{" "}
            {casas > 0 ? "descendo" : "subindo"}: {casas > 0 ? "multiplique" : "divida"} por{" "}
            <b>{formatar(10 ** Math.abs(casas))}</b> — ou ande {Math.abs(casas)}{" "}
            {Math.abs(casas) === 1 ? "casa" : "casas"} com a vírgula para a{" "}
            {casas > 0 ? "direita" : "esquerda"}.
          </>
        )}
      </p>

      <p className="text-center text-[11px] text-muted-foreground">
        Toque num degrau para escolher para onde converter.
      </p>
    </div>
  );
}
