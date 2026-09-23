import { Gauge, Play, RotateCcw, Star, Target, Trophy } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  base,
  COR_DEDO,
  dedoDe,
  FILEIRAS,
  NIVEIS_DIGITACAO,
} from "@/components/school/jogos/digitacao-dados";
import { registrarPartida, type Adversario } from "@/lib/estrelas";
import { cn } from "@/lib/utils";

/**
 * Jogo de digitação: você contra um robô que digita num ritmo fixo.
 *
 * O teclado da tela mostra a próxima tecla e, pela cor, qual dedo usa —
 * é a maneira mais rápida de a criança criar o hábito certo. Acento e
 * maiúscula não são cobrados (o "ç" aceita "c"): o foco é achar a tecla,
 * não decorar combinações de tecla morta.
 *
 * Vale por partida, não por tecla: o robô só é comparado no fim, então a
 * criança nunca é interrompida no meio de uma frase.
 */

const RODADAS = [4, 3, 3];
const PASSOS_TEMPO = 200;

function embaralhar<T>(l: T[]): T[] {
  const c = [...l];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j]!, c[i]!];
  }
  return c;
}

function relogio(s: number): string {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

/** Tecla que a próxima letra pede (o "ç" tem tecla própria). */
function teclaDe(c: string | undefined): string | null {
  if (!c) return null;
  if (c === " ") return " ";
  if (c.toLowerCase() === "ç") return "ç";
  return base(c);
}

function Estrela({ cheia, className }: { cheia: boolean; className?: string }) {
  return (
    <Star
      className={cn(
        "size-5 drop-shadow",
        cheia ? "fill-amber-400 text-amber-300" : "fill-white/10 text-white/30",
        className,
      )}
      aria-hidden
    />
  );
}

function Tecla({ rotulo, alvo, erro }: { rotulo: string; alvo: boolean; erro: boolean }) {
  const cor = COR_DEDO[dedoDe(rotulo)]!;
  return (
    <span
      className={cn(
        "flex h-7 w-[8.6%] items-center justify-center rounded-md border text-[11px] font-bold uppercase transition-all sm:h-9 sm:text-sm",
        alvo
          ? "scale-110 border-white text-white shadow-lg"
          : erro
            ? "border-red-400 bg-red-500/60 text-white"
            : "border-white/15 bg-slate-800/80 text-slate-300",
      )}
      style={alvo ? { background: cor, boxShadow: `0 0 14px ${cor}` } : undefined}
    >
      {rotulo}
    </span>
  );
}

interface Resultado {
  segundos: number;
  ppm: number;
  precisao: number;
  pontos: number;
  ganhou: boolean;
  estrelas: number;
}

export function Digitacao({ adversario, nivel }: { adversario: Adversario; nivel: number }) {
  const cfg = NIVEIS_DIGITACAO[Math.min(Math.max(nivel, 1), 3) - 1]!;
  const [fase, setFase] = useState<"inicio" | "jogando" | "fim">("inicio");
  const [textos, setTextos] = useState<string[]>([]);
  const [cenario, setCenario] = useState(cfg.cenarios[0]!);
  const [idx, setIdx] = useState(0);
  const [pos, setPos] = useState(0);
  const [erros, setErros] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [erroTecla, setErroTecla] = useState<string | null>(null);
  const [decorrido, setDecorrido] = useState(0);
  const [final, setFinal] = useState<Resultado | null>(null);
  const inicio = useRef(0);
  // O andamento fica num ref para que várias letras chegando no mesmo evento
  // (teclado de celular, colagem) sejam contadas uma a uma, sem ler estado velho.
  const andamento = useRef({
    idx: 0,
    pos: 0,
    acertos: 0,
    erros: 0,
    textos: [] as string[],
    fim: false,
  });
  const entrada = useRef<HTMLInputElement>(null);

  const totalChars = useMemo(() => textos.reduce((s, t) => s + t.length, 0), [textos]);
  const atual = textos[idx] ?? "";

  const comecar = useCallback(() => {
    const n = RODADAS[cfg.id - 1]!;
    const sorteados = embaralhar(cfg.textos).slice(0, n);
    andamento.current = { idx: 0, pos: 0, acertos: 0, erros: 0, textos: sorteados, fim: false };
    setTextos(sorteados);
    setCenario(cfg.cenarios[Math.floor(Math.random() * cfg.cenarios.length)]!);
    setIdx(0);
    setPos(0);
    setErros(0);
    setAcertos(0);
    setDecorrido(0);
    setFinal(null);
    inicio.current = Date.now();
    setFase("jogando");
  }, [cfg]);

  // Relógio da partida.
  useEffect(() => {
    if (fase !== "jogando") return;
    const t = window.setInterval(
      () => setDecorrido((Date.now() - inicio.current) / 1000),
      PASSOS_TEMPO,
    );
    return () => window.clearInterval(t);
  }, [fase]);

  useEffect(() => {
    if (fase === "jogando") entrada.current?.focus();
  }, [fase, idx]);

  const encerrar = useCallback(
    (errosFinais: number, acertosFinais: number) => {
      const segundos = Math.max(1, (Date.now() - inicio.current) / 1000);
      const ppm = Math.round(acertosFinais / 5 / (segundos / 60));
      const digitadas = acertosFinais + errosFinais;
      const precisao = digitadas ? Math.round((acertosFinais / digitadas) * 100) : 100;
      const tempoRobo = totalChars / ((cfg.robo * 5) / 60);
      const ganhou = segundos <= tempoRobo && precisao >= 80;
      const estrelas = ganhou
        ? precisao >= 97
          ? 3
          : precisao >= 90
            ? 2
            : 1
        : precisao >= 90
          ? 1
          : 0;
      setFinal({
        segundos,
        ppm,
        precisao,
        pontos: Math.max(0, acertosFinais * 10 - errosFinais * 5),
        ganhou,
        estrelas,
      });
      setFase("fim");
      void registrarPartida({
        jogo: "digitacao",
        titulo: "Jogo de digitação",
        resultado: ganhou ? "vitoria" : "derrota",
        adversario,
        nivel,
        segundos: Math.round(segundos),
      });
    },
    [adversario, cfg.robo, nivel, totalChars],
  );

  const tecla = useCallback(
    (c: string) => {
      const a = andamento.current;
      const esperado = a.textos[a.idx]?.[a.pos];
      if (esperado === undefined || a.fim) return;
      const ok =
        base(c) === base(esperado) ||
        (esperado.toLowerCase() === "ç" && base(c) === "c") ||
        c === esperado;
      if (!ok) {
        a.erros += 1;
        setErros(a.erros);
        setErroTecla(teclaDe(esperado));
        window.setTimeout(() => setErroTecla(null), 220);
        return;
      }
      a.acertos += 1;
      setAcertos(a.acertos);
      if (a.pos + 1 >= a.textos[a.idx]!.length) {
        if (a.idx + 1 >= a.textos.length) {
          a.fim = true;
          encerrar(a.erros, a.acertos);
          return;
        }
        a.idx += 1;
        a.pos = 0;
      } else {
        a.pos += 1;
      }
      setIdx(a.idx);
      setPos(a.pos);
    },
    [encerrar],
  );

  const aoDigitar = (valor: string) => {
    if (entrada.current) entrada.current.value = "";
    if (fase !== "jogando") return;
    for (const c of valor) tecla(c);
  };

  const feitos = textos.slice(0, idx).reduce((s, t) => s + t.length, 0) + pos;
  const progresso = totalChars ? feitos / totalChars : 0;
  const progressoRobo = totalChars
    ? Math.min(1, (decorrido * ((cfg.robo * 5) / 60)) / totalChars)
    : 0;
  const proxima = teclaDe(atual[pos]);
  const pontosAgora = Math.max(0, acertos * 10 - erros * 5);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-white"
      onClick={() => entrada.current?.focus()}
    >
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40 transition-opacity"
        style={{
          backgroundImage: `url(/images/jogos/${fase === "inicio" ? "digitacao-capa" : cenario}.jpg)`,
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/70 to-slate-950/95" />

      <div className="relative flex flex-col gap-3 p-3 sm:p-4">
        {fase === "inicio" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <h3 className="text-3xl font-black uppercase italic leading-none tracking-tight sm:text-4xl">
              <span className="block text-base font-bold not-italic text-sky-300">Jogo de</span>
              <span className="bg-gradient-to-b from-white to-sky-300 bg-clip-text text-transparent">
                Digitação
              </span>
            </h3>
            <p className="text-sm text-slate-300">Digite, aprenda, evolua!</p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
              <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 font-semibold">
                {cfg.nome}
              </span>
              <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1">
                Robô: {cfg.robo} palavras por minuto
              </span>
              <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1">
                {RODADAS[cfg.id - 1]} frases
              </span>
            </div>
            <p className="max-w-sm text-xs text-slate-400">
              Acompanhe a tecla que acende: a cor mostra o dedo certo. Acentos e letras maiúsculas
              não precisam ser digitados. Chegue antes do robô, com pelo menos 80% de acerto.
            </p>
            <button
              type="button"
              onClick={comecar}
              className="flex h-12 cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 px-6 text-base font-bold text-white shadow-lg shadow-emerald-900/50 transition-transform hover:scale-105 active:scale-95"
            >
              <Play className="size-5 fill-current" /> Começar
            </button>
          </div>
        )}

        {fase !== "inicio" && (
          <>
            {/* Barras de progresso: você (em cima) e o robô */}
            <div className="flex flex-col gap-1">
              <div className="relative h-3 overflow-hidden rounded-full bg-slate-900/80 ring-1 ring-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 transition-[width] duration-150"
                  style={{ width: `${progresso * 100}%` }}
                />
              </div>
              <div className="relative h-1.5 overflow-hidden rounded-full bg-slate-900/80 ring-1 ring-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400 transition-[width] duration-200"
                  style={{ width: `${progressoRobo * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                <span className="text-sky-300">Você</span>
                <span className="text-orange-300">Robô</span>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-2 sm:gap-3">
              <div className="flex min-h-[7rem] flex-col justify-center rounded-xl border border-sky-400/40 bg-slate-900/80 p-3 shadow-inner shadow-sky-500/10 sm:min-h-[8rem] sm:p-4">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-sky-300/80">
                  Frase {Math.min(idx + 1, textos.length)} de {textos.length}
                </p>
                <p
                  className="whitespace-pre-wrap break-words text-lg font-medium leading-relaxed sm:text-2xl"
                  aria-label={atual}
                >
                  {[...atual].map((c, i) => (
                    <span
                      key={i}
                      className={cn(
                        i < pos && "text-emerald-300",
                        i === pos &&
                          "rounded bg-sky-400/30 text-white underline decoration-sky-300 decoration-2 underline-offset-4",
                        i > pos && "text-slate-400",
                        i === pos && erroTecla !== null && "bg-red-500/50",
                      )}
                    >
                      {c}
                    </span>
                  ))}
                </p>
              </div>

              <div className="grid w-24 grid-rows-3 gap-1.5 sm:w-28">
                {[
                  ["Tempo", relogio(decorrido)],
                  ["Erros", String(erros)],
                  ["Pontos", String(pontosAgora)],
                ].map(([r, v]) => (
                  <div
                    key={r}
                    className="flex flex-col items-center justify-center rounded-lg border border-sky-400/40 bg-slate-900/80 px-1"
                  >
                    <span className="text-[10px] text-slate-400">{r}</span>
                    <span className="text-base font-bold tabular-nums sm:text-lg">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="flex flex-col gap-1 rounded-xl border border-white/10 bg-slate-900/70 p-2 sm:gap-1.5 sm:p-3"
              aria-hidden
            >
              {FILEIRAS.map((f, i) => (
                <div
                  key={i}
                  className="flex justify-center gap-1 sm:gap-1.5"
                  style={{ paddingLeft: `${i * 3}%`, paddingRight: `${(2 - i) * 3}%` }}
                >
                  {f.map((k) => (
                    <Tecla key={k} rotulo={k} alvo={proxima === k} erro={erroTecla === k} />
                  ))}
                </div>
              ))}
              <div className="flex justify-center">
                <span
                  className={cn(
                    "flex h-7 w-3/5 items-center justify-center rounded-md border text-[10px] font-bold uppercase tracking-widest transition-all sm:h-9",
                    proxima === " "
                      ? "border-white bg-sky-500 text-white shadow-lg shadow-sky-500/60"
                      : erroTecla === " "
                        ? "border-red-400 bg-red-500/60"
                        : "border-white/15 bg-slate-800/80 text-slate-400",
                  )}
                >
                  espaço
                </span>
              </div>
            </div>

            {/* Campo invisível que recebe o teclado (inclusive o do celular) */}
            <input
              ref={entrada}
              type="text"
              inputMode="text"
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              aria-label="Digite aqui a frase mostrada"
              className="absolute left-0 top-0 h-px w-px opacity-0"
              onChange={(e) => aoDigitar(e.target.value)}
              disabled={fase !== "jogando"}
            />
          </>
        )}

        {fase === "fim" && final && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
            <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-white/15 bg-slate-900 p-5 text-center shadow-2xl">
              <Trophy
                className={cn("size-14", final.ganhou ? "text-amber-400" : "text-slate-500")}
                aria-hidden
              />
              <h4 className="text-xl font-black">
                {final.ganhou ? "Você venceu o robô!" : "O robô foi mais rápido"}
              </h4>
              <div className="flex gap-1" aria-label={`${final.estrelas} de 3 estrelas`}>
                {[1, 2, 3].map((n) => (
                  <Estrela key={n} cheia={n <= final.estrelas} className="size-8" />
                ))}
              </div>
              <div className="grid w-full grid-cols-3 gap-2 text-xs">
                <span className="rounded-lg bg-white/5 p-2">
                  <Gauge className="mx-auto mb-0.5 size-4 text-sky-300" aria-hidden />
                  <b className="block text-base">{final.ppm}</b>palavras/min
                </span>
                <span className="rounded-lg bg-white/5 p-2">
                  <Target className="mx-auto mb-0.5 size-4 text-emerald-300" aria-hidden />
                  <b className="block text-base">{final.precisao}%</b>precisão
                </span>
                <span className="rounded-lg bg-white/5 p-2">
                  <Star className="mx-auto mb-0.5 size-4 text-amber-300" aria-hidden />
                  <b className="block text-base">{final.pontos}</b>pontos
                </span>
              </div>
              {!final.ganhou && (
                <p className="text-xs text-slate-400">
                  Para vencer, termine antes do robô com pelo menos 80% de acerto.
                </p>
              )}
              <button
                type="button"
                onClick={comecar}
                className="flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-b from-sky-400 to-blue-600 px-5 font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <RotateCcw className="size-4" /> Jogar de novo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
