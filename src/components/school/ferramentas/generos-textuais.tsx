import { ArrowLeft, CheckCircle2, RefreshCw, Search, XCircle } from "lucide-react";
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
import bannerMuseu from "@/assets/generos/museu-banner.webp";
import figBilhete from "@/assets/generos/bilhete.webp";
import figCarta from "@/assets/generos/carta.webp";
import figConvite from "@/assets/generos/convite.webp";
import figDiario from "@/assets/generos/diario.webp";
import figEmail from "@/assets/generos/email.webp";
import figLista from "@/assets/generos/lista.webp";
import figMensagem from "@/assets/generos/mensagem.webp";
import figRecado from "@/assets/generos/recado.webp";
import figSms from "@/assets/generos/sms.webp";

/**
 * Ilustração de cada gênero. Por enquanto só os nove do "dia a dia" têm
 * quadro próprio — os outros 24 seguem com o emoji, que continua sendo a
 * identidade deles na ficha e no jogo. Quando chegarem as ilustrações dos
 * demais, é só acrescentar a chave aqui: a galeria já cai no quadro quando
 * existe e no emoji quando não existe.
 */
const FIGURA: Record<string, string> = {
  bilhete: figBilhete,
  recado: figRecado,
  carta: figCarta,
  mensagem: figMensagem,
  sms: figSms,
  email: figEmail,
  lista: figLista,
  convite: figConvite,
  diario: figDiario,
};

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
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={aoVoltar}
        className="flex cursor-pointer items-center gap-1 self-start text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> todos os gêneros
      </button>

      {FIGURA[genero.id] ? (
        <img
          src={FIGURA[genero.id]}
          alt=""
          width={320}
          height={185}
          className="w-full rounded-xl border border-border object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : null}

      <div>
        <p className="text-sm font-bold text-foreground">
          {/* Com o quadro logo acima, o emoji só repetiria o assunto. */}
          {FIGURA[genero.id] ? null : <span aria-hidden>{genero.emoji} </span>}
          {genero.nome}
        </p>
        <p className="text-[11px] leading-tight text-muted-foreground">
          {genero.paraQue} <b>Onde aparece:</b> {genero.ondeAparece}
        </p>
      </div>

      <div className="max-h-[260px] overflow-auto rounded-xl bg-muted/30 p-2">
        <MolduraExemplo exemplo={genero.exemplo} />
      </div>

      <div className="rounded-xl border border-border bg-background p-2">
        <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-foreground">
          <Search className="size-3.5 text-primary" /> Como reconhecer
        </p>
        <ul className="space-y-0.5">
          {genero.comoReconhecer.map((m) => (
            <li key={m} className="flex gap-1.5 text-[11px] leading-tight text-muted-foreground">
              <span className="text-primary">✓</span>
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
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        Leia o texto e descubra que gênero é. Olhe o formato, o tamanho e o jeito de falar.
      </p>

      <div className="max-h-[210px] overflow-auto rounded-xl bg-muted/30 p-2">
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
                "cursor-pointer rounded-lg border-2 px-2 py-1.5 text-xs font-medium transition-colors",
                !escolha
                  ? "border-border bg-background text-foreground hover:border-primary hover:bg-primary/5"
                  : certa
                    ? "border-emerald-600 bg-emerald-600/15 text-emerald-700 dark:text-emerald-300"
                    : o.id === escolha
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : "border-border bg-background text-muted-foreground opacity-60",
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
            "flex items-start gap-1.5 rounded-lg p-2 text-[11px] leading-tight",
            certou
              ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300"
              : "bg-destructive/10 text-destructive",
          )}
        >
          {certou ? (
            <CheckCircle2 className="mt-px size-3.5 shrink-0" />
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
    <div className="flex flex-col gap-2">
      {/* A fachada do museu abre a ferramenta: é o que diz, sem texto, que
        ali dentro tem uma coleção para folhear. */}
      <img
        src={bannerMuseu}
        alt=""
        width={720}
        height={290}
        className="w-full rounded-xl border border-border object-cover"
        loading="eager"
        decoding="async"
      />
      <div className="flex gap-1 rounded-lg bg-muted/60 p-1">
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
              "flex-1 cursor-pointer rounded-md px-2 py-1 text-xs font-medium transition-colors",
              modo === id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {modo === "detetive" ? (
        <Detetive />
      ) : (
        <>
          <div className="flex flex-wrap gap-1">
            {GRUPOS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGrupo(g.id)}
                className={cn(
                  "cursor-pointer rounded-full border px-2 py-0.5 text-[11px] transition-colors",
                  grupo === g.id
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {g.nome}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {GRUPOS.find((g) => g.id === grupo)?.descricao}. Toque num gênero para ver um exemplo de
            verdade.
          </p>

          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {generosDoGrupo(grupo).map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setAberto(g)}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-background text-left transition-colors hover:border-primary/60 hover:bg-primary/5"
              >
                {FIGURA[g.id] ? (
                  <img
                    src={FIGURA[g.id]}
                    alt=""
                    width={320}
                    height={185}
                    className="w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : null}
                <span className="flex flex-col gap-0.5 p-2">
                  <span className="text-xs font-semibold text-foreground">
                    {FIGURA[g.id] ? null : <span aria-hidden>{g.emoji} </span>}
                    {g.nome}
                  </span>
                  <span className="text-[10px] leading-tight text-muted-foreground">
                    {g.paraQue}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
