import { CheckCircle2, Minus, Plus, RefreshCw, XCircle } from "lucide-react";
import { useState } from "react";

import {
  ORDENS,
  Pilha,
  porExtenso,
  type Ordem,
} from "@/components/school/ferramentas/material-dourado";
import { CampoResposta } from "@/components/school/ferramentas/controles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Dois jogos sobre a mesma ideia, em direções opostas:
 *
 * - "Monte o número": vê o número escrito e monta com as peças;
 * - "Que número é este?": vê as peças e escreve o número.
 *
 * Fazer os dois caminhos é o que garante que a criança entendeu o valor
 * posicional, e não só decorou um lado da tradução.
 */

type Modo = "montar" | "ler";

const NIVEIS = [
  { id: 1, nome: "Até 99", min: 10, max: 99, ordens: ["dezena", "unidade"] as Ordem[] },
  {
    id: 2,
    nome: "Até 999",
    min: 100,
    max: 999,
    ordens: ["centena", "dezena", "unidade"] as Ordem[],
  },
  {
    id: 3,
    nome: "Até 9999",
    min: 1000,
    max: 9999,
    ordens: ["milhar", "centena", "dezena", "unidade"] as Ordem[],
  },
];

type Quadro = Record<Ordem, number>;
const VAZIO: Quadro = { milhar: 0, centena: 0, dezena: 0, unidade: 0 };

function decompor(n: number): Quadro {
  return {
    milhar: Math.floor(n / 1000),
    centena: Math.floor((n % 1000) / 100),
    dezena: Math.floor((n % 100) / 10),
    unidade: n % 10,
  };
}

function valorDe(q: Quadro): number {
  return q.milhar * 1000 + q.centena * 100 + q.dezena * 10 + q.unidade;
}

function sortear(nivel: (typeof NIVEIS)[number]): number {
  return Math.floor(Math.random() * (nivel.max - nivel.min + 1)) + nivel.min;
}

export function JogoNumeros() {
  const [modo, setModo] = useState<Modo>("montar");
  const [nivel, setNivel] = useState(NIVEIS[1]!);
  const [alvo, setAlvo] = useState(() => sortear(NIVEIS[1]!));
  const [montado, setMontado] = useState<Quadro>({ ...VAZIO });
  const [digitado, setDigitado] = useState("");
  const [conferido, setConferido] = useState<null | boolean>(null);
  const [acertos, setAcertos] = useState(0);
  const [rodadas, setRodadas] = useState(0);

  function nova(n = nivel, m = modo) {
    setAlvo(sortear(n));
    setMontado({ ...VAZIO });
    setDigitado("");
    setConferido(null);
    setModo(m);
  }

  function conferir() {
    if (conferido === true) return;
    const certo = modo === "montar" ? valorDe(montado) === alvo : Number(digitado) === alvo;
    setConferido(certo);
    if (conferido === null) {
      setRodadas((r) => r + 1);
      if (certo) setAcertos((a) => a + 1);
    }
  }

  function mexer(o: Ordem, d: number) {
    if (conferido === true) return;
    setMontado((v) => ({ ...v, [o]: Math.max(0, Math.min(9, v[o] + d)) }));
    setConferido(null);
  }

  const pecasAlvo = decompor(alvo);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 rounded-lg bg-muted/60 p-1">
        {(
          [
            ["montar", "Monte o número"],
            ["ler", "Que número é este?"],
          ] as const
        ).map(([id, rotulo]) => (
          <button
            key={id}
            type="button"
            onClick={() => nova(nivel, id)}
            className={cn(
              "flex-1 cursor-pointer rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              modo === id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {rotulo}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {NIVEIS.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => {
              setNivel(n);
              nova(n);
            }}
            className={cn(
              "cursor-pointer rounded-full border px-2.5 py-1 text-xs transition-colors",
              nivel.id === n.id
                ? "border-primary bg-primary/10 font-medium text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {n.nome}
          </button>
        ))}
      </div>

      {modo === "montar" ? (
        <>
          <div className="rounded-xl bg-primary/10 p-2 text-center">
            <p className="text-[11px] text-muted-foreground">Monte este número com as peças:</p>
            <p className="text-3xl font-bold text-primary">{alvo.toLocaleString("pt-BR")}</p>
          </div>
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${nivel.ordens.length}, minmax(0,1fr))` }}
          >
            {ORDENS.filter((o) => nivel.ordens.includes(o.id)).map((o) => (
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
                <span className="text-xl font-bold text-foreground">{montado[o.id]}</span>
                <div className="flex h-[64px] w-full items-end justify-center overflow-hidden">
                  <Pilha ordem={o.id} quantidade={montado[o.id]} cubo={o.id === "milhar" ? 5 : 6} />
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label={`Tirar ${o.nome}`}
                    onClick={() => mexer(o.id, -1)}
                    className="flex size-6 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-muted-foreground"
                  >
                    <Minus className="size-3" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Pôr ${o.nome}`}
                    onClick={() => mexer(o.id, 1)}
                    className="flex size-6 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-foreground"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="text-center text-[11px] text-muted-foreground">
            Olhe as peças e escreva que número elas formam:
          </p>
          <div className="flex flex-wrap items-end justify-center gap-3 rounded-xl border border-border bg-background p-2.5">
            {ORDENS.filter((o) => pecasAlvo[o.id] > 0).map((o) => (
              <div key={o.id} className="flex flex-col items-center gap-1">
                <Pilha ordem={o.id} quantidade={pecasAlvo[o.id]} cubo={o.id === "milhar" ? 5 : 6} />
                <span className="text-[10px] text-muted-foreground">{o.plural}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <CampoResposta
              valor={digitado}
              aoMudar={(v) => {
                setDigitado(v);
                if (conferido === false) setConferido(null);
              }}
              aoTeclarEnter={conferir}
              rotulo="Escreva o número"
              placeholder="Escreva o número"
              largura="w-40"
            />
          </div>
        </>
      )}

      {conferido !== null && (
        <p
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl p-2 text-xs font-medium",
            conferido
              ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300"
              : "bg-destructive/10 text-destructive",
          )}
        >
          {conferido ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
          {conferido ? (
            <span className="first-letter:uppercase">{porExtenso(alvo)}</span>
          ) : modo === "montar" ? (
            <>Você montou {valorDe(montado).toLocaleString("pt-BR")}. Falta ajustar.</>
          ) : (
            <>Ainda não. Conte as peças coluna por coluna.</>
          )}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {acertos} de {rodadas}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="cursor-pointer"
            onClick={conferir}
            disabled={modo === "ler" && !digitado.trim()}
          >
            Conferir
          </Button>
          <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => nova()}>
            <RefreshCw className="size-3.5" /> Outro
          </Button>
        </div>
      </div>
    </div>
  );
}
