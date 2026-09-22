import { Minus, Plus, Shuffle, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  ORDENS,
  Pilha,
  porExtenso,
  type Ordem,
} from "@/components/school/ferramentas/material-dourado";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Quadro de valor posicional com material dourado: a criança põe e tira
 * peças e vê o número se formar sozinho.
 *
 * A parte que mais ensina é o botão de trocar: juntou 10 unidades, aparece
 * "trocar 10 unidades por 1 dezena". É exatamente o "vai um" da conta armada,
 * só que com as peças na mão antes de virar regra decorada.
 */

type Quadro = Record<Ordem, number>;

const VAZIO: Quadro = { milhar: 0, centena: 0, dezena: 0, unidade: 0 };

/** A ordem imediatamente maior — para onde vão as 10 peças trocadas. */
const ACIMA: Partial<Record<Ordem, Ordem>> = {
  unidade: "dezena",
  dezena: "centena",
  centena: "milhar",
};

function valorDe(q: Quadro): number {
  return q.milhar * 1000 + q.centena * 100 + q.dezena * 10 + q.unidade;
}

export function ValorPosicional() {
  const [q, setQ] = useState<Quadro>({ ...VAZIO, centena: 2, dezena: 4, unidade: 3 });

  const numero = valorDe(q);
  // Só uma troca por vez, começando pela ordem menor: é assim que se faz no papel.
  const podeTrocar = (["unidade", "dezena", "centena"] as Ordem[]).find((o) => q[o] >= 10);

  function mexer(o: Ordem, d: number) {
    setQ((v) => ({ ...v, [o]: Math.max(0, Math.min(20, v[o] + d)) }));
  }

  function trocar(o: Ordem) {
    const alvo = ACIMA[o]!;
    setQ((v) => ({ ...v, [o]: v[o] - 10, [alvo]: v[alvo] + 1 }));
  }

  function sortear() {
    const n = Math.floor(Math.random() * 9000) + 100;
    setQ({
      milhar: Math.floor(n / 1000),
      centena: Math.floor((n % 1000) / 100),
      dezena: Math.floor((n % 100) / 10),
      unidade: n % 10,
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* O número formado */}
      <div className="rounded-xl bg-primary/10 p-2.5 text-center">
        <p className="text-3xl font-bold tracking-tight text-primary">
          {numero.toLocaleString("pt-BR")}
        </p>
        <p className="text-xs text-muted-foreground first-letter:uppercase">{porExtenso(numero)}</p>
      </div>

      {/* O quadro */}
      <div className="grid grid-cols-4 gap-1.5">
        {ORDENS.map((o) => (
          <div
            key={o.id}
            className="flex flex-col items-center gap-1 rounded-xl border p-1.5"
            style={{
              borderColor: `color-mix(in srgb, ${o.cor} 40%, transparent)`,
              background: `color-mix(in srgb, ${o.cor} 8%, transparent)`,
            }}
          >
            <span className="text-[10px] font-bold uppercase" style={{ color: o.cor }}>
              {o.nome}
            </span>
            <span className="text-2xl font-bold text-foreground">{q[o.id]}</span>
            <div className="flex h-[84px] w-full items-end justify-center overflow-hidden">
              <Pilha
                ordem={o.id}
                quantidade={Math.min(q[o.id], 10)}
                cubo={o.id === "milhar" ? 7 : 8}
              />
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                aria-label={`Tirar uma ${o.nome}`}
                onClick={() => mexer(o.id, -1)}
                disabled={q[o.id] === 0}
                className="flex size-6 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-muted-foreground disabled:opacity-40"
              >
                <Minus className="size-3" />
              </button>
              <button
                type="button"
                aria-label={`Pôr uma ${o.nome}`}
                onClick={() => mexer(o.id, 1)}
                className="flex size-6 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-foreground"
              >
                <Plus className="size-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* A troca: o "vai um" com as peças na mão */}
      {podeTrocar ? (
        <button
          type="button"
          onClick={() => trocar(podeTrocar)}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-amber-500 bg-amber-500/15 p-2.5 text-xs font-semibold text-amber-700 dark:text-amber-300"
        >
          {/* Sem peças aqui: em tamanho de botão o cubinho vira um ponto. */}
          Trocar 10 {podeTrocar === "unidade" ? "unidades" : `${podeTrocar}s`} por 1{" "}
          {ACIMA[podeTrocar]}
        </button>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-2 text-center text-[11px] text-muted-foreground">
          Junte 10 peças de uma coluna para poder trocar por 1 da coluna do lado.
        </p>
      )}

      {/* Decomposição */}
      <div className="rounded-xl border border-border bg-background p-2.5">
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Decompondo
        </p>
        <p className="text-sm text-foreground">
          {ORDENS.filter((o) => q[o.id] > 0).length === 0 ? (
            <span className="text-muted-foreground">Quadro vazio.</span>
          ) : (
            ORDENS.filter((o) => q[o.id] > 0).map((o, i, arr) => (
              <span key={o.id}>
                <b style={{ color: o.cor }}>{(q[o.id] * o.valor).toLocaleString("pt-BR")}</b>
                {i < arr.length - 1 ? " + " : ""}
              </span>
            ))
          )}
          {numero > 0 && (
            <span className="text-muted-foreground"> = {numero.toLocaleString("pt-BR")}</span>
          )}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {ORDENS.filter((o) => q[o.id] > 0)
            .map((o) => `${q[o.id]} ${q[o.id] === 1 ? o.nome.toLowerCase() : o.plural}`)
            .join(", ") || "—"}
        </p>
      </div>

      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 cursor-pointer text-xs"
          onClick={sortear}
        >
          <Shuffle className="size-3.5" /> Sortear um número
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-8 cursor-pointer text-xs text-muted-foreground")}
          onClick={() => setQ({ ...VAZIO })}
        >
          <Trash2 className="size-3.5" /> Limpar
        </Button>
      </div>
    </div>
  );
}
