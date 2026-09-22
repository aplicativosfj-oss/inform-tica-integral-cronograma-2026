import { ArrowLeft, Check, RefreshCw, Volume2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  ALFABETO,
  CATEGORIAS,
  ehVogal,
  LETRAS_COM_PALAVRA,
  PALAVRAS,
  palavrasComLetra,
  palavrasDaCategoria,
  semAcento,
  type Categoria,
  type Palavra,
} from "@/components/school/ferramentas/alfabeto-dados";
import { Figura } from "@/components/school/ferramentas/figuras-alfabeto";
import { falar, nomeDaLetra, prepararVoz } from "@/lib/voz";
import { cn } from "@/lib/utils";

/**
 * Parque das Letras: seis jogos de alfabetização, feitos com três regras que
 * valem para todos.
 *
 * Tudo grande. Letra em tamanho de cartaz, botão do tamanho da mão da
 * criança, figura de traço grosso. Serve para quem está aprendendo a ler e
 * serve para quem enxerga pouco ou tem dificuldade motora — que é a mesma
 * necessidade, atendida do mesmo jeito.
 *
 * Tudo fala. Toda letra, sílaba e palavra pode ser ouvida, porque a criança
 * que ainda não lê precisa do som para conferir sozinha se acertou.
 *
 * Ninguém perde. Não há tempo, não há vida, não há placar que zera: erro
 * mostra a resposta certa, fala em voz alta e deixa tentar de novo.
 */

type Jogo = "menu" | "alfabeto" | "primeira" | "vogal" | "dupla" | "silabas" | "montar";

const JOGOS: { id: Jogo; nome: string; emoji: string; descricao: string }[] = [
  {
    id: "alfabeto",
    nome: "Conhecer as letras",
    emoji: "🔤",
    descricao: "Veja e ouça todas as letras",
  },
  {
    id: "primeira",
    nome: "Com que letra começa?",
    emoji: "🔍",
    descricao: "Ache a primeira letra da figura",
  },
  {
    id: "vogal",
    nome: "Vogal ou consoante?",
    emoji: "🅰️",
    descricao: "Separe as vogais das consoantes",
  },
  {
    id: "dupla",
    nome: "Maiúscula e minúscula",
    emoji: "Aa",
    descricao: "Ache o par de cada letra",
  },
  {
    id: "silabas",
    nome: "Bater as sílabas",
    emoji: "👏",
    descricao: "Conte as sílabas da palavra",
  },
  {
    id: "montar",
    nome: "Montar a palavra",
    emoji: "🧩",
    descricao: "Junte as sílabas na ordem certa",
  },
];

function sortear<T>(l: T[]): T {
  return l[Math.floor(Math.random() * l.length)]!;
}

function embaralhar<T>(l: T[]): T[] {
  const c = [...l];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j]!, c[i]!];
  }
  return c;
}

/** Botão de ouvir — aparece em todos os jogos, sempre no mesmo lugar. */
function Ouvir({ texto, devagar = false }: { texto: string; devagar?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => falar(texto, devagar)}
      aria-label={`Ouvir ${texto}`}
      className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-primary/40 bg-primary/10 text-primary transition-colors hover:bg-primary/20"
    >
      <Volume2 className="size-5" />
    </button>
  );
}

/** A faixa de acertos: só cresce, nunca pune. */
function Placar({ acertos, total }: { acertos: number; total: number }) {
  return (
    <p className="text-center text-sm font-semibold text-muted-foreground">
      {acertos} {acertos === 1 ? "acerto" : "acertos"}
      {total > 0 && ` em ${total}`}
    </p>
  );
}

function Resultado({ certo, mensagem }: { certo: boolean; mensagem: string }) {
  return (
    <p
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl p-2.5 text-base font-bold",
        certo
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
          : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
      )}
    >
      {certo ? <Check className="size-5" /> : <X className="size-5" />}
      {mensagem}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Conhecer as letras                                               */
/* ------------------------------------------------------------------ */

function JogoAlfabeto() {
  const [letra, setLetra] = useState("A");
  const palavras = palavrasComLetra(letra);
  const palavra = palavras[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap justify-center gap-1">
        {ALFABETO.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => {
              setLetra(l);
              falar(nomeDaLetra(l), true);
            }}
            className={cn(
              "size-8 cursor-pointer rounded-lg text-base font-bold transition-colors",
              letra === l
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground hover:bg-primary/20",
            )}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 rounded-2xl border-2 border-primary/30 bg-primary/5 p-3">
        <div className="text-center">
          <p className="font-bold leading-none text-primary" style={{ fontSize: 64 }}>
            {letra}
            <span className="text-foreground">{letra.toLowerCase()}</span>
          </p>
          <p
            className="mt-1 text-2xl text-muted-foreground"
            style={{ fontFamily: '"Segoe Script","Bradley Hand","Snell Roundhand",cursive' }}
          >
            {letra}
            {letra.toLowerCase()}
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">de mão</p>
        </div>
        <Ouvir texto={nomeDaLetra(letra)} devagar />
      </div>

      {palavra ? (
        <button
          type="button"
          onClick={() => falar(palavra.texto)}
          className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-border bg-background p-2 transition-colors hover:border-primary/50"
        >
          <Figura nome={palavra.figura} tamanho={74} titulo={palavra.texto} />
          <span className="text-left">
            <span className="block text-2xl font-bold text-foreground">
              <span className="text-primary">{palavra.texto[0]}</span>
              {palavra.texto.slice(1)}
            </span>
            <span className="block text-xs text-muted-foreground">toque para ouvir</span>
          </span>
        </button>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-3 text-center text-sm text-muted-foreground">
          Esta letra é rara no começo das palavras. Procure ela dentro de outras: no meio do
          <b> táxi</b>, do <b>show</b>.
        </p>
      )}

      {palavras.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2">
          {palavras.slice(1, 4).map((p) => (
            <button
              key={p.texto}
              type="button"
              onClick={() => falar(p.texto)}
              className="flex cursor-pointer flex-col items-center rounded-xl border border-border bg-background p-1.5 transition-colors hover:border-primary/50"
            >
              <Figura nome={p.figura} tamanho={46} titulo={p.texto} />
              <span className="text-xs font-semibold text-foreground">{p.texto}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Com que letra começa?                                            */
/* ------------------------------------------------------------------ */

function JogoPrimeiraLetra({ filtro }: { filtro: Categoria | "todas" }) {
  const pool = filtro === "todas" ? PALAVRAS : palavrasDaCategoria(filtro);

  const nova = () => {
    const p = sortear(pool);
    const certa = semAcento(p.texto)[0]!.toUpperCase();
    const outras = embaralhar(ALFABETO.filter((l) => l !== certa)).slice(0, 2);
    return { p, opcoes: embaralhar([certa, ...outras]), certa };
  };

  const [rodada, setRodada] = useState(nova);
  const [escolha, setEscolha] = useState<string | null>(null);
  const [acertos, setAcertos] = useState(0);
  const [total, setTotal] = useState(0);

  function responder(l: string) {
    if (escolha) return;
    setEscolha(l);
    setTotal((t) => t + 1);
    const certo = l === rodada.certa;
    if (certo) setAcertos((a) => a + 1);
    falar(
      certo
        ? `Isso! ${rodada.p.texto}`
        : `${rodada.p.texto} começa com ${nomeDaLetra(rodada.certa)}`,
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-center gap-3">
        <Figura nome={rodada.p.figura} tamanho={96} titulo={rodada.p.texto} />
        <Ouvir texto={rodada.p.texto} />
      </div>
      <p className="text-center text-base font-semibold text-foreground">
        Com que letra começa <b className="text-primary">{rodada.p.texto}</b>?
      </p>

      <div className="grid grid-cols-3 gap-2">
        {rodada.opcoes.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => responder(l)}
            disabled={!!escolha}
            className={cn(
              "h-16 cursor-pointer rounded-2xl border-4 text-4xl font-bold transition-colors",
              !escolha
                ? "border-border bg-background text-foreground hover:border-primary hover:bg-primary/10"
                : l === rodada.certa
                  ? "border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                  : l === escolha
                    ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                    : "border-border bg-background text-muted-foreground opacity-50",
            )}
          >
            {l}
            <span className="text-2xl text-muted-foreground">{l.toLowerCase()}</span>
          </button>
        ))}
      </div>

      {escolha && (
        <Resultado
          certo={escolha === rodada.certa}
          mensagem={
            escolha === rodada.certa
              ? "Isso mesmo!"
              : `${rodada.p.texto} começa com ${rodada.certa}`
          }
        />
      )}

      <div className="flex items-center justify-between">
        <Placar acertos={acertos} total={total} />
        <button
          type="button"
          onClick={() => {
            setRodada(nova());
            setEscolha(null);
          }}
          className="flex h-11 cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
        >
          <RefreshCw className="size-4" /> Outra figura
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Vogal ou consoante                                               */
/* ------------------------------------------------------------------ */

function JogoVogal() {
  const [letra, setLetra] = useState(() => sortear(ALFABETO));
  const [escolha, setEscolha] = useState<"vogal" | "consoante" | null>(null);
  const [acertos, setAcertos] = useState(0);
  const [total, setTotal] = useState(0);

  function responder(r: "vogal" | "consoante") {
    if (escolha) return;
    setEscolha(r);
    setTotal((t) => t + 1);
    const certo = (r === "vogal") === ehVogal(letra);
    if (certo) setAcertos((a) => a + 1);
    falar(certo ? "Isso!" : ehVogal(letra) ? "É vogal" : "É consoante");
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-sm text-muted-foreground">
        As vogais são cinco: <b className="text-foreground">A E I O U</b>. Todas as outras letras
        são consoantes.
      </p>

      <div className="flex items-center justify-center gap-3 rounded-2xl border-2 border-primary/30 bg-primary/5 py-3">
        <p className="font-bold leading-none text-primary" style={{ fontSize: 72 }}>
          {letra}
        </p>
        <Ouvir texto={nomeDaLetra(letra)} devagar />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(["vogal", "consoante"] as const).map((r) => {
          const certa = (r === "vogal") === ehVogal(letra);
          return (
            <button
              key={r}
              type="button"
              onClick={() => responder(r)}
              disabled={!!escolha}
              className={cn(
                "h-16 cursor-pointer rounded-2xl border-4 text-xl font-bold capitalize transition-colors",
                !escolha
                  ? "border-border bg-background text-foreground hover:border-primary hover:bg-primary/10"
                  : certa
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                    : r === escolha
                      ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      : "border-border bg-background text-muted-foreground opacity-50",
              )}
            >
              {r}
            </button>
          );
        })}
      </div>

      {escolha && (
        <Resultado
          certo={(escolha === "vogal") === ehVogal(letra)}
          mensagem={`${letra} é ${ehVogal(letra) ? "vogal" : "consoante"}`}
        />
      )}

      <div className="flex items-center justify-between">
        <Placar acertos={acertos} total={total} />
        <button
          type="button"
          onClick={() => {
            setLetra(sortear(ALFABETO));
            setEscolha(null);
          }}
          className="flex h-11 cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
        >
          <RefreshCw className="size-4" /> Outra letra
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Maiúscula e minúscula                                            */
/* ------------------------------------------------------------------ */

function JogoDupla() {
  const nova = () => {
    const certa = sortear(ALFABETO);
    const outras = embaralhar(ALFABETO.filter((l) => l !== certa)).slice(0, 3);
    return { certa, opcoes: embaralhar([certa, ...outras]) };
  };
  const [rodada, setRodada] = useState(nova);
  const [escolha, setEscolha] = useState<string | null>(null);
  const [acertos, setAcertos] = useState(0);
  const [total, setTotal] = useState(0);

  function responder(l: string) {
    if (escolha) return;
    setEscolha(l);
    setTotal((t) => t + 1);
    const certo = l === rodada.certa;
    if (certo) setAcertos((a) => a + 1);
    falar(certo ? "Isso!" : `A minúscula do ${nomeDaLetra(rodada.certa)} é essa`, true);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-sm text-muted-foreground">
        Ache a letra pequena que é par desta letra grande.
      </p>

      <div className="flex items-center justify-center gap-3 rounded-2xl border-2 border-primary/30 bg-primary/5 py-2">
        <p className="font-bold leading-none text-primary" style={{ fontSize: 68 }}>
          {rodada.certa}
        </p>
        <Ouvir texto={nomeDaLetra(rodada.certa)} devagar />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {rodada.opcoes.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => responder(l)}
            disabled={!!escolha}
            className={cn(
              "h-16 cursor-pointer rounded-2xl border-4 text-4xl font-bold transition-colors",
              !escolha
                ? "border-border bg-background text-foreground hover:border-primary hover:bg-primary/10"
                : l === rodada.certa
                  ? "border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                  : l === escolha
                    ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                    : "border-border bg-background text-muted-foreground opacity-50",
            )}
          >
            {l.toLowerCase()}
          </button>
        ))}
      </div>

      {escolha && (
        <Resultado
          certo={escolha === rodada.certa}
          mensagem={`${rodada.certa} e ${rodada.certa.toLowerCase()} são a mesma letra`}
        />
      )}

      <div className="flex items-center justify-between">
        <Placar acertos={acertos} total={total} />
        <button
          type="button"
          onClick={() => {
            setRodada(nova());
            setEscolha(null);
          }}
          className="flex h-11 cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
        >
          <RefreshCw className="size-4" /> Outra letra
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Bater as sílabas                                                 */
/* ------------------------------------------------------------------ */

function JogoSilabas({ filtro }: { filtro: Categoria | "todas" }) {
  const pool = filtro === "todas" ? PALAVRAS : palavrasDaCategoria(filtro);
  const [palavra, setPalavra] = useState<Palavra>(() => sortear(pool));
  const [escolha, setEscolha] = useState<number | null>(null);
  const [acertos, setAcertos] = useState(0);
  const [total, setTotal] = useState(0);

  const certo = palavra.silabas.length;

  function responder(n: number) {
    if (escolha) return;
    setEscolha(n);
    setTotal((t) => t + 1);
    if (n === certo) setAcertos((a) => a + 1);
    falar(palavra.silabas.join(" ... "), true);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-center gap-3">
        <Figura nome={palavra.figura} tamanho={80} titulo={palavra.texto} />
        <div>
          <p className="text-3xl font-bold text-foreground">{palavra.texto}</p>
          <button
            type="button"
            onClick={() => falar(palavra.silabas.join(" ... "), true)}
            className="mt-1 flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
          >
            <Volume2 className="size-3.5" /> ouvir devagar
          </button>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Bata palma em cada pedaço. Quantos pedaços tem?
      </p>

      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => responder(n)}
            disabled={escolha !== null}
            className={cn(
              "h-14 cursor-pointer rounded-2xl border-4 text-2xl font-bold transition-colors",
              escolha === null
                ? "border-border bg-background text-foreground hover:border-primary hover:bg-primary/10"
                : n === certo
                  ? "border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                  : n === escolha
                    ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                    : "border-border bg-background text-muted-foreground opacity-50",
            )}
          >
            {n}
          </button>
        ))}
      </div>

      {escolha !== null && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {palavra.silabas.map((s, i) => (
            <span
              key={`${s}-${i}`}
              className="rounded-xl bg-primary/15 px-3 py-1.5 text-xl font-bold text-primary"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Placar acertos={acertos} total={total} />
        <button
          type="button"
          onClick={() => {
            setPalavra(sortear(pool));
            setEscolha(null);
          }}
          className="flex h-11 cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
        >
          <RefreshCw className="size-4" /> Outra palavra
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Montar a palavra                                                 */
/* ------------------------------------------------------------------ */

function JogoMontar({ filtro }: { filtro: Categoria | "todas" }) {
  const pool = (filtro === "todas" ? PALAVRAS : palavrasDaCategoria(filtro)).filter(
    (p) => p.silabas.length > 1,
  );
  const nova = () => {
    const p = sortear(pool);
    return { p, soltas: embaralhar(p.silabas.map((s, i) => ({ s, i }))) };
  };
  const [rodada, setRodada] = useState(nova);
  const [montado, setMontado] = useState<{ s: string; i: number }[]>([]);
  const [acertos, setAcertos] = useState(0);

  const completo = montado.length === rodada.p.silabas.length;
  const certo = completo && montado.map((m) => m.s).join("") === rodada.p.silabas.join("");

  useEffect(() => {
    if (!completo) return;
    if (certo) {
      setAcertos((a) => a + 1);
      falar(`Muito bem! ${rodada.p.texto}`);
    } else {
      falar("Quase! Tente de novo", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completo]);

  function limpar() {
    setMontado([]);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-center gap-3">
        <Figura nome={rodada.p.figura} tamanho={80} titulo={rodada.p.texto} />
        <Ouvir texto={rodada.p.texto} />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Toque nas sílabas na ordem certa para formar a palavra.
      </p>

      {/* a palavra que vai sendo montada */}
      <div
        className={cn(
          "flex min-h-[56px] flex-wrap items-center justify-center gap-1.5 rounded-2xl border-4 border-dashed p-2",
          completo
            ? certo
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-amber-500 bg-amber-500/10"
            : "border-border bg-muted/30",
        )}
      >
        {montado.length === 0 ? (
          <span className="text-sm text-muted-foreground">toque nas sílabas abaixo</span>
        ) : (
          montado.map((m, i) => (
            <button
              key={`${m.i}-${i}`}
              type="button"
              onClick={() => setMontado((v) => v.filter((_, j) => j !== i))}
              className="cursor-pointer rounded-xl bg-primary px-3 py-1.5 text-2xl font-bold text-primary-foreground"
            >
              {m.s}
            </button>
          ))
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {rodada.soltas
          .filter((s) => !montado.some((m) => m.i === s.i))
          .map((s) => (
            <button
              key={s.i}
              type="button"
              onClick={() => {
                falar(s.s, true);
                setMontado((v) => [...v, s]);
              }}
              className="h-14 min-w-[64px] cursor-pointer rounded-2xl border-4 border-border bg-background px-3 text-2xl font-bold text-foreground transition-colors hover:border-primary hover:bg-primary/10"
            >
              {s.s}
            </button>
          ))}
      </div>

      {completo && (
        <Resultado
          certo={certo}
          mensagem={certo ? `Muito bem! ${rodada.p.texto}` : "Quase! Tire uma sílaba e tente"}
        />
      )}

      <div className="flex items-center justify-between gap-2">
        <Placar acertos={acertos} total={0} />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={limpar}
            className="h-11 cursor-pointer rounded-xl border-2 border-border px-3 text-sm font-semibold text-muted-foreground"
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={() => {
              setRodada(nova());
              setMontado([]);
            }}
            className="flex h-11 cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
          >
            <RefreshCw className="size-4" /> Outra
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function ParqueLetras() {
  const [jogo, setJogo] = useState<Jogo>("menu");
  const [filtro, setFiltro] = useState<Categoria | "todas">("todas");

  useEffect(() => {
    prepararVoz();
  }, []);

  const precisaFiltro = useMemo(
    () => jogo === "primeira" || jogo === "silabas" || jogo === "montar",
    [jogo],
  );

  if (jogo === "menu") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Escolha uma brincadeira. Todas falam em voz alta — é só tocar no alto-falante.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {JOGOS.map((j) => (
            <button
              key={j.id}
              type="button"
              onClick={() => setJogo(j.id)}
              className="flex min-h-[74px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-border bg-background p-2 text-center transition-colors hover:border-primary hover:bg-primary/5"
            >
              <span className="text-2xl" aria-hidden>
                {j.emoji}
              </span>
              <span className="text-sm font-bold leading-tight text-foreground">{j.nome}</span>
              <span className="text-[10px] leading-tight text-muted-foreground">{j.descricao}</span>
            </button>
          ))}
        </div>
        <p className="text-center text-[11px] text-muted-foreground">
          {PALAVRAS.length} palavras com figura · {LETRAS_COM_PALAVRA.length} letras do alfabeto
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setJogo("menu")}
          className="flex h-9 cursor-pointer items-center gap-1 rounded-lg px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> brincadeiras
        </button>
        <span className="text-xs font-bold text-foreground">
          {JOGOS.find((j) => j.id === jogo)?.nome}
        </span>
      </div>

      {precisaFiltro && (
        <div className="flex flex-wrap justify-center gap-1">
          {([{ id: "todas", nome: "Tudo", emoji: "✨" }, ...CATEGORIAS] as const).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFiltro(c.id as Categoria | "todas")}
              className={cn(
                "cursor-pointer rounded-full border px-2 py-0.5 text-[11px] transition-colors",
                filtro === c.id
                  ? "border-primary bg-primary/10 font-semibold text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <span aria-hidden>{c.emoji}</span> {c.nome}
            </button>
          ))}
        </div>
      )}

      {jogo === "alfabeto" && <JogoAlfabeto />}
      {jogo === "primeira" && <JogoPrimeiraLetra key={filtro} filtro={filtro} />}
      {jogo === "vogal" && <JogoVogal />}
      {jogo === "dupla" && <JogoDupla />}
      {jogo === "silabas" && <JogoSilabas key={filtro} filtro={filtro} />}
      {jogo === "montar" && <JogoMontar key={filtro} filtro={filtro} />}
    </div>
  );
}
