import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { FiguraObjeto } from "@/components/school/ferramentas/figuras-medidas";
import {
  FAMILIAS,
  REFERENCIAS,
  type Familia,
  type Referencia,
} from "@/components/school/ferramentas/medidas";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * "Quanto mede isso?" — a parte que o conversor não ensina. Saber que 1 km
 * são 1000 m não adianta se a criança não faz ideia de quanto é um metro.
 * Aqui cada unidade ganha um objeto do mundo dela: a moeda, a porta, o balde,
 * o pacote de arroz.
 *
 * Duas telas: a galeria, para consultar, e o jogo, para ver se pegou.
 */

/** Coisa comprida se mede, recipiente leva, coisa pesada pesa. */
const VERBO: Record<Familia, string> = {
  comprimento: "mede",
  capacidade: "leva",
  massa: "pesa",
};

function embaralhar<T>(l: T[]): T[] {
  const c = [...l];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j]!, c[i]!];
  }
  return c;
}

function Galeria({ fam }: { fam: Familia }) {
  const itens = REFERENCIAS.filter((r) => r.familia === fam);
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {itens.map((r) => (
        <figure
          key={r.objeto}
          className="flex flex-col items-center gap-1 rounded-xl border border-border bg-background p-2"
        >
          <FiguraObjeto objeto={r.objeto} tamanho={72} />
          <figcaption className="text-center">
            <span className="block text-[11px] leading-tight text-muted-foreground">{r.nome}</span>
            <span className="block text-sm font-bold text-primary">{r.comoSeFala}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

interface Rodada {
  ref: Referencia;
  opcoes: string[];
}

function montarRodada(fam: Familia | "todas"): Rodada {
  const pool = fam === "todas" ? REFERENCIAS : REFERENCIAS.filter((r) => r.familia === fam);
  const ref = pool[Math.floor(Math.random() * pool.length)]!;
  return { ref, opcoes: embaralhar([ref.unidadeCerta, ...ref.opcoesErradas]) };
}

function Jogo({ fam }: { fam: Familia | "todas" }) {
  const [rodada, setRodada] = useState<Rodada>(() => montarRodada(fam));
  const [escolha, setEscolha] = useState<string | null>(null);
  const [acertos, setAcertos] = useState(0);
  const [total, setTotal] = useState(0);

  // Trocar de família no meio do jogo troca a pergunta também.
  const chave = useMemo(() => fam, [fam]);
  const [ultimaFam, setUltimaFam] = useState(chave);
  if (ultimaFam !== chave) {
    setUltimaFam(chave);
    setRodada(montarRodada(chave));
    setEscolha(null);
  }

  function responder(u: string) {
    if (escolha) return;
    setEscolha(u);
    setTotal((t) => t + 1);
    if (u === rodada.ref.unidadeCerta) setAcertos((a) => a + 1);
  }

  function proxima() {
    setRodada(montarRodada(fam));
    setEscolha(null);
  }

  const certou = escolha === rodada.ref.unidadeCerta;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
        <FiguraObjeto objeto={rodada.ref.objeto} tamanho={80} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{rodada.ref.nome}</p>
          <p className="text-xs text-muted-foreground">Que unidade a gente usa para medir isso?</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {rodada.opcoes.map((u) => {
          const certa = u === rodada.ref.unidadeCerta;
          return (
            <button
              key={u}
              type="button"
              onClick={() => responder(u)}
              disabled={!!escolha}
              className={cn(
                "h-12 cursor-pointer rounded-xl border-2 text-lg font-bold transition-colors",
                !escolha
                  ? "border-border bg-background text-foreground hover:border-primary hover:bg-primary/5"
                  : certa
                    ? "border-emerald-600 bg-emerald-600/15 text-emerald-700 dark:text-emerald-300"
                    : u === escolha
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : "border-border bg-background text-muted-foreground opacity-60",
              )}
            >
              {u}
            </button>
          );
        })}
      </div>

      {escolha && (
        <p
          className={cn(
            "flex items-center gap-2 rounded-xl p-2.5 text-xs font-medium",
            certou
              ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300"
              : "bg-destructive/10 text-destructive",
          )}
        >
          {certou ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
          {rodada.ref.nome} {VERBO[rodada.ref.familia]} cerca de <b>{rodada.ref.comoSeFala}</b>.
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {acertos} de {total} {total === 1 ? "certa" : "certas"}
        </span>
        <Button size="sm" className="cursor-pointer" onClick={proxima}>
          <RefreshCw className="size-3.5" /> Próximo
        </Button>
      </div>
    </div>
  );
}

export function MedidasMundo() {
  const [fam, setFam] = useState<Familia>("comprimento");
  const [modo, setModo] = useState<"galeria" | "jogo">("galeria");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 rounded-lg bg-muted/60 p-1">
        {(
          [
            ["galeria", "Quanto mede?"],
            ["jogo", "Jogo das unidades"],
          ] as const
        ).map(([id, rotulo]) => (
          <button
            key={id}
            type="button"
            onClick={() => setModo(id)}
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
        {FAMILIAS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFam(f.id)}
            className={cn(
              "cursor-pointer rounded-full border px-2.5 py-1 text-xs transition-colors",
              fam === f.id
                ? "border-primary bg-primary/10 font-medium text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {f.nome}
          </button>
        ))}
      </div>

      {modo === "galeria" ? <Galeria fam={fam} /> : <Jogo fam={fam} />}
    </div>
  );
}
