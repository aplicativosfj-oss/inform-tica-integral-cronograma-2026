import { ArrowLeft, BookOpenCheck, CheckCircle2, RefreshCw, Search, XCircle } from "lucide-react";
import { useState } from "react";

import {
  GENEROS_TEXTO,
  generosDoGrupo,
  GRUPOS,
  type Agrupamento,
  type GeneroTexto,
} from "@/components/school/ferramentas/generos-exemplos";
import { MolduraExemplo } from "@/components/school/ferramentas/generos-molduras";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Museu dos gêneros textuais, com duas portas:
 *
 * - a galeria, onde a criança folheia 30 textos de verdade, cada um no seu
 *   suporte, com as marcas que o denunciam;
 * - o jogo do detetive, que mostra o exemplo sem dizer o nome e pede que ela
 *   descubra qual é — que é exatamente a prova de que aprendeu a reconhecer.
 *
 * Reconhecer vem antes de escrever: quem nunca viu uma bula não escreve uma
 * bula, por mais que lhe expliquem a estrutura.
 *
 * A identidade visual é toda em tipografia e tokens do tema — nada de
 * banner ilustrado: dentro da janela da ferramenta a imagem grande só
 * disputava espaço com o conteúdo.
 */

function embaralhar<T>(l: T[]): T[] {
  const c = [...l];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j]!, c[i]!];
  }
  return c;
}

/* ---------------------------- ficha ------------------------------- */

function Ficha({ genero, aoVoltar }: { genero: GeneroTexto; aoVoltar: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={aoVoltar}
        className="flex cursor-pointer items-center gap-1.5 self-start rounded-md text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Todos os gêneros
      </button>

      <div className="rounded-xl border border-border bg-card p-3">
        <p className="text-sm font-bold text-foreground">
          <span aria-hidden>{genero.emoji} </span>
          {genero.nome}
        </p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
          {genero.paraQue} <b className="text-foreground">Onde aparece:</b> {genero.ondeAparece}
        </p>
      </div>

      <div className="max-h-[240px] overflow-auto rounded-xl border border-border/60 bg-muted/30 p-2">
        <MolduraExemplo exemplo={genero.exemplo} />
      </div>

      <div className="rounded-xl border border-border bg-card p-3">
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Search className="size-3.5 text-primary" /> Como reconhecer
        </p>
        <ul className="space-y-1">
          {genero.comoReconhecer.map((m) => (
            <li key={m} className="flex gap-2 text-xs leading-snug text-muted-foreground">
              <CheckCircle2 className="mt-px size-3.5 shrink-0 text-primary" />
              {m}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* --------------------------- detetive ----------------------------- */

interface Rodada {
  certo: GeneroTexto;
  opcoes: GeneroTexto[];
}

function montarRodada(): Rodada {
  const certo = GENEROS_TEXTO[Math.floor(Math.random() * GENEROS_TEXTO.length)]!;
  // Os distratores saem do mesmo grupo quando dá: confundir bilhete com
  // recado é uma dúvida de verdade; com bula, não.
  const irmaos = GENEROS_TEXTO.filter((g) => g.id !== certo.id && g.grupo === certo.grupo);
  const outros = GENEROS_TEXTO.filter((g) => g.id !== certo.id && g.grupo !== certo.grupo);
  const erradas = [...embaralhar(irmaos).slice(0, 2), ...embaralhar(outros)].slice(0, 3);
  return { certo, opcoes: embaralhar([certo, ...erradas]) };
}

function Detetive() {
  const [rodada, setRodada] = useState<Rodada>(montarRodada);
  const [escolha, setEscolha] = useState<string | null>(null);
  const [acertos, setAcertos] = useState(0);
  const [total, setTotal] = useState(0);

  function responder(id: string) {
    if (escolha) return;
    setEscolha(id);
    setTotal((t) => t + 1);
    if (id === rodada.certo.id) setAcertos((a) => a + 1);
  }

  const certou = escolha === rodada.certo.id;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-snug text-muted-foreground">
        Leia o texto e descubra que gênero é. Olhe o formato, o tamanho e o jeito de falar.
      </p>

      <div className="max-h-[220px] overflow-auto rounded-xl border border-border/60 bg-muted/30 p-2">
        <MolduraExemplo exemplo={rodada.certo.exemplo} />
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {rodada.opcoes.map((o) => {
          const certa = o.id === rodada.certo.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => responder(o.id)}
              disabled={!!escolha}
              className={cn(
                "cursor-pointer rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors",
                !escolha
                  ? "border-border bg-card text-foreground hover:border-primary hover:bg-primary/5"
                  : certa
                    ? "border-primary bg-primary/10 text-primary"
                    : o.id === escolha
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : "border-border bg-card text-muted-foreground opacity-60",
              )}
            >
              <span aria-hidden>{o.emoji}</span> {o.nome}
            </button>
          );
        })}
      </div>

      {escolha && (
        <p
          className={cn(
            "flex items-start gap-1.5 rounded-lg border p-2 text-xs leading-snug",
            certou
              ? "border-primary/30 bg-primary/5 text-foreground"
              : "border-destructive/30 bg-destructive/5 text-destructive",
          )}
        >
          {certou ? (
            <CheckCircle2 className="mt-px size-3.5 shrink-0 text-primary" />
          ) : (
            <XCircle className="mt-px size-3.5 shrink-0" />
          )}
          <span>
            {rodada.certo.artigo === "as" ? "São" : "É"} {rodada.certo.artigo}{" "}
            <b>{rodada.certo.nome.toLowerCase()}</b>:{" "}
            {rodada.certo.comoReconhecer[0]!.toLowerCase()}.
          </span>
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {acertos} de {total} {total === 1 ? "certa" : "certas"}
        </span>
        <Button
          size="sm"
          className="h-8 cursor-pointer text-xs"
          onClick={() => {
            setRodada(montarRodada());
            setEscolha(null);
          }}
        >
          <RefreshCw className="size-3.5" /> Próximo texto
        </Button>
      </div>
    </div>
  );
}

/* ---------------------------- galeria ----------------------------- */

export function GenerosTextuais() {
  const [modo, setModo] = useState<"galeria" | "detetive">("galeria");
  const [grupo, setGrupo] = useState<Agrupamento>("dia a dia");
  const [aberto, setAberto] = useState<GeneroTexto | null>(null);

  if (aberto) return <Ficha genero={aberto} aoVoltar={() => setAberto(null)} />;

  return (
    <div className="flex flex-col gap-3">
      {/* Cabeçalho enxuto: diz o que é e para que serve, sem disputar
        espaço com o conteúdo. */}
      <div className="flex items-start gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BookOpenCheck className="size-4.5" />
        </span>
        <div>
          <p className="text-sm font-bold leading-tight text-foreground">Museu dos gêneros</p>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
            {GENEROS_TEXTO.length} textos de verdade para folhear — cada um no seu suporte, com as
            marcas que o denunciam.
          </p>
        </div>
      </div>

      {/* Navegação: modo (galeria/detetive) e, na galeria, o grupo. */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
        {(
          [
            ["galeria", `Ver os ${GENEROS_TEXTO.length} gêneros`],
            ["detetive", "Jogo do detetive"],
          ] as const
        ).map(([id, rotulo]) => (
          <button
            key={id}
            type="button"
            onClick={() => setModo(id)}
            className={cn(
              "flex-1 cursor-pointer rounded-md px-2 py-1.5 text-xs font-semibold transition-colors",
              modo === id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {modo === "galeria" && (
        <div className="flex flex-wrap gap-1">
          {GRUPOS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGrupo(g.id)}
              className={cn(
                "cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                grupo === g.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {g.nome}
            </button>
          ))}
        </div>
      )}

      {modo === "detetive" ? (
        <Detetive />
      ) : (
        <>
          <p className="text-xs leading-snug text-muted-foreground">
            {GRUPOS.find((g) => g.id === grupo)?.descricao}. Toque num gênero para ver um exemplo
            de verdade.
          </p>

          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {generosDoGrupo(grupo).map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setAberto(g)}
                className="group flex cursor-pointer flex-col gap-0.5 rounded-xl border border-border bg-card p-2.5 text-left transition-colors hover:border-primary/60 hover:bg-primary/5"
              >
                <span className="text-xs font-semibold text-foreground">
                  <span aria-hidden>{g.emoji} </span>
                  {g.nome}
                </span>
                <span className="text-[11px] leading-snug text-muted-foreground">{g.paraQue}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
