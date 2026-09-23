import { ArrowLeft, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  base,
  dedoDe,
  NOME_DEDO,
  teclaDe,
  type Prompt,
} from "@/components/school/jogos/digitacao-dados";
import {
  estrelasPorPrecisao,
  type ResultadoFase,
} from "@/components/school/jogos/digitacao-progresso";
import { Maos, Teclado, TutorFala } from "@/components/school/jogos/digitacao-visual";
import { Figura } from "@/components/school/ferramentas/figuras-alfabeto";
import { cn } from "@/lib/utils";

/**
 * O motor de exercício do jogo de digitação — usado pelo tutor, pelas fases e
 * pelo desafio contra o robô. Muda só o que se digita: uma letra, uma sílaba,
 * uma palavra com figura ou uma frase corrida.
 *
 * O que ensina, além de cobrar: o teclado mostra a próxima tecla na cor do
 * dedo, as mãos desenhadas acendem esse dedo e o tutor explica em palavras
 * ("use o anelar esquerdo"). Errar não pune — só conta na precisão.
 */

const ELOGIOS = ["Muito bem!", "Isso mesmo!", "Perfeito!", "Boa!", "Você está craque!"];

interface Props {
  titulo: string;
  prompts: Prompt[];
  modo: "alvo" | "texto";
  /** Teclas em foco (lições do tutor). */
  foco?: string;
  /** Palavras por minuto do robô adversário; sem valor, não há robô. */
  robo?: number;
  /** Texto do tutor na tela de abertura. */
  abertura?: string;
  cenario?: string;
  aoConcluir: (r: ResultadoFase) => void;
  aoSair: () => void;
}

function tamanhoAlvo(t: string): string {
  if (t.length <= 3) return "text-6xl sm:text-7xl";
  if (t.length <= 8) return "text-5xl sm:text-6xl";
  if (t.length <= 14) return "text-3xl sm:text-4xl";
  return "text-xl sm:text-2xl";
}

function relogio(s: number): string {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export function PraticaDigitacao({
  titulo,
  prompts,
  modo,
  foco,
  robo,
  abertura,
  cenario,
  aoConcluir,
  aoSair,
}: Props) {
  const [fase, setFase] = useState<"pronto" | "jogando">("pronto");
  const [idx, setIdx] = useState(0);
  const [pos, setPos] = useState(0);
  const [erros, setErros] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [erroTecla, setErroTecla] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{
    texto: string;
    humor: "feliz" | "animado" | "triste";
  } | null>(null);
  const [decorrido, setDecorrido] = useState(0);
  const inicio = useRef(0);
  const entrada = useRef<HTMLInputElement>(null);
  const timerAviso = useRef<number | undefined>(undefined);
  const andamento = useRef({ idx: 0, pos: 0, acertos: 0, erros: 0, fim: false });

  const total = prompts.reduce((s, p) => s + p.alvo.length, 0);
  const atual = prompts[idx];
  const alvoAtual = atual?.alvo ?? "";

  const mostrarAviso = useCallback(
    (texto: string, humor: "feliz" | "animado" | "triste", ms: number) => {
      setAviso({ texto, humor });
      window.clearTimeout(timerAviso.current);
      timerAviso.current = window.setTimeout(() => setAviso(null), ms);
    },
    [],
  );

  useEffect(() => () => window.clearTimeout(timerAviso.current), []);

  const comecar = () => {
    andamento.current = { idx: 0, pos: 0, acertos: 0, erros: 0, fim: false };
    setIdx(0);
    setPos(0);
    setErros(0);
    setAcertos(0);
    setDecorrido(0);
    inicio.current = Date.now();
    setFase("jogando");
  };

  useEffect(() => {
    if (fase !== "jogando") return;
    const t = window.setInterval(() => setDecorrido((Date.now() - inicio.current) / 1000), 200);
    return () => window.clearInterval(t);
  }, [fase]);

  useEffect(() => {
    if (fase === "jogando") entrada.current?.focus();
  }, [fase, idx]);

  const tecla = useCallback(
    (c: string) => {
      const a = andamento.current;
      const esperado = prompts[a.idx]?.alvo[a.pos];
      if (esperado === undefined || a.fim) return;
      const ok =
        base(c) === base(esperado) ||
        (esperado.toLowerCase() === "ç" && base(c) === "c") ||
        c === esperado;
      if (!ok) {
        a.erros += 1;
        setErros(a.erros);
        const alvoTecla = teclaDe(esperado);
        setErroTecla(alvoTecla);
        window.setTimeout(() => setErroTecla(null), 240);
        if (alvoTecla && alvoTecla !== " ") {
          mostrarAviso(
            `Quase! Era a tecla ${alvoTecla.toUpperCase()}, com o dedo ${NOME_DEDO[dedoDe(alvoTecla)]}.`,
            "triste",
            2200,
          );
        } else {
          mostrarAviso("Quase! Aqui é o espaço, com o polegar.", "triste", 2200);
        }
        return;
      }
      a.acertos += 1;
      setAcertos(a.acertos);
      const alvo = prompts[a.idx]!.alvo;
      if (a.pos + 1 >= alvo.length) {
        if (a.idx + 1 >= prompts.length) {
          a.fim = true;
          const segundos = Math.max(1, (Date.now() - inicio.current) / 1000);
          const digitadas = a.acertos + a.erros;
          const precisao = Math.round((a.acertos / digitadas) * 100);
          aoConcluir({
            estrelas: estrelasPorPrecisao(precisao),
            ppm: Math.round(a.acertos / 5 / (segundos / 60)),
            precisao,
            pontos: Math.max(0, a.acertos * 10 - a.erros * 5),
            segundos: Math.round(segundos),
            acertos: a.acertos,
            erros: a.erros,
          });
          return;
        }
        a.idx += 1;
        a.pos = 0;
        if (a.idx % 3 === 0) {
          mostrarAviso(ELOGIOS[Math.floor(Math.random() * ELOGIOS.length)]!, "animado", 1100);
        }
      } else {
        a.pos += 1;
      }
      setIdx(a.idx);
      setPos(a.pos);
    },
    [aoConcluir, mostrarAviso, prompts],
  );

  const aoDigitar = (valor: string) => {
    if (entrada.current) entrada.current.value = "";
    if (fase !== "jogando") return;
    for (const c of valor) tecla(c);
  };

  const proximo = teclaDe(alvoAtual[pos]);
  const dedo = proximo ? dedoDe(proximo) : null;
  const feitos = prompts.slice(0, idx).reduce((s, p) => s + p.alvo.length, 0) + pos;
  const progresso = total ? feitos / total : 0;
  const progressoRobo = robo && total ? Math.min(1, (decorrido * ((robo * 5) / 60)) / total) : 0;

  const dicaPadrao =
    proximo && proximo !== " " && foco !== undefined
      ? `Tecla ${proximo.toUpperCase()}: use o dedo ${NOME_DEDO[dedo ?? 0]}.`
      : proximo === " "
        ? "Aperte o espaço com o polegar."
        : "Olhe para a tela, não para o teclado. Os dedos já sabem o caminho!";
  const fala = aviso ?? { texto: dicaPadrao, humor: "feliz" as const };

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-white"
      onClick={() => entrada.current?.focus()}
    >
      {cenario && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(/images/jogos/${cenario}.jpg)` }}
          aria-hidden
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/75 to-slate-950/95" />

      <div className="relative flex flex-col gap-3 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={aoSair}
            className="flex h-8 cursor-pointer items-center gap-1 rounded-lg px-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="size-4" /> voltar
          </button>
          <span className="truncate text-xs font-bold uppercase tracking-wide text-sky-300">
            {titulo}
          </span>
        </div>

        {fase === "pronto" && (
          <div className="flex flex-col items-center gap-3 py-2">
            <TutorFala
              texto={
                abertura ??
                "Olá! Eu sou o Teco. Vou acender a tecla certa e mostrar qual dedo usar. É só seguir a cor!"
              }
              humor="animado"
            />
            <Maos ativos={[]} className="max-w-xs" />
            <p className="text-xs text-slate-400">
              {prompts.length} {prompts.length === 1 ? "item" : "itens"} para digitar
              {robo ? ` · robô: ${robo} palavras por minuto` : ""}
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

        {fase === "jogando" && atual && (
          <>
            {/* progresso */}
            <div className="flex flex-col gap-1">
              <div className="h-3 overflow-hidden rounded-full bg-slate-900/80 ring-1 ring-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 transition-[width] duration-150"
                  style={{ width: `${progresso * 100}%` }}
                />
              </div>
              {robo ? (
                <>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-900/80 ring-1 ring-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400 transition-[width] duration-200"
                      style={{ width: `${progressoRobo * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wide">
                    <span className="text-sky-300">Você</span>
                    <span className="text-orange-300">Robô</span>
                  </div>
                </>
              ) : null}
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-2 sm:gap-3">
              {/* o que digitar */}
              <div className="flex min-h-[8.5rem] flex-col items-center justify-center gap-1 rounded-xl border border-sky-400/40 bg-slate-900/80 p-3 text-center shadow-inner shadow-sky-500/10">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-300/80">
                  {idx + 1} de {prompts.length}
                </p>
                {atual.figura && (
                  <div className="rounded-xl bg-white/90 p-1">
                    <Figura nome={atual.figura} tamanho={72} />
                  </div>
                )}
                <p
                  className={cn(
                    "max-w-full whitespace-pre-wrap break-words font-bold leading-tight",
                    modo === "alvo"
                      ? tamanhoAlvo(alvoAtual)
                      : "text-lg font-medium leading-relaxed sm:text-2xl",
                    modo === "alvo" && "tracking-wider",
                  )}
                  aria-label={alvoAtual}
                >
                  {[...alvoAtual].map((c, i) => (
                    <span
                      key={i}
                      className={cn(
                        i < pos && "text-emerald-300",
                        i === pos &&
                          "rounded bg-sky-400/30 text-white underline decoration-sky-300 decoration-4 underline-offset-8",
                        i > pos && "text-slate-400",
                        i === pos && erroTecla !== null && "bg-red-500/50",
                      )}
                    >
                      {c === " " ? " " : c}
                    </span>
                  ))}
                </p>
                {atual.legenda && <p className="text-xs text-slate-400">{atual.legenda}</p>}
              </div>

              <div className="grid w-20 grid-rows-3 gap-1.5 sm:w-24">
                {[
                  ["Tempo", relogio(decorrido)],
                  ["Erros", String(erros)],
                  ["Acertos", String(acertos)],
                ].map(([r, v]) => (
                  <div
                    key={r}
                    className="flex flex-col items-center justify-center rounded-lg border border-sky-400/40 bg-slate-900/80 px-1"
                  >
                    <span className="text-[10px] text-slate-400">{r}</span>
                    <span className="text-base font-bold tabular-nums">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <TutorFala texto={fala.texto} humor={fala.humor} />

            <Teclado alvo={proximo} erro={erroTecla} {...(foco !== undefined ? { foco } : {})} />
            <Maos ativos={dedo === null ? [] : [dedo]} className="mx-auto max-w-sm" />

            <input
              ref={entrada}
              type="text"
              inputMode="text"
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              aria-label="Digite aqui o que aparece na tela"
              className="absolute left-0 top-0 h-px w-px opacity-0"
              onChange={(e) => aoDigitar(e.target.value)}
            />
          </>
        )}
      </div>
    </div>
  );
}
