import { ArrowLeft, Play, Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  base,
  COR_DEDO,
  dedoDe,
  NOME_DEDO,
  teclaDe,
  type Prompt,
} from "@/components/school/jogos/digitacao-dados";
import {
  estrelasPorPrecisao,
  type ResultadoFase,
} from "@/components/school/jogos/digitacao-progresso";
import { Teclado, TutorFala } from "@/components/school/jogos/digitacao-visual";
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

/** Posição percentual de cada ponta de dedo na ilustração profissional. */
const PONTA_DEDO: Record<number, { x: number; y: number }> = {
  0: { x: 23, y: 27 },
  1: { x: 31, y: 24 },
  2: { x: 38, y: 23 },
  3: { x: 44, y: 27 },
  4: { x: 47, y: 54 },
  5: { x: 53, y: 54 },
  6: { x: 57, y: 27 },
  7: { x: 64, y: 23 },
  8: { x: 72, y: 24 },
  9: { x: 79, y: 28 },
};

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
  /** Narra letras, sílabas e palavras em português. */
  voz?: boolean;
  aoConcluir: (r: ResultadoFase) => void;
  aoSair: () => void;
}

function tamanhoAlvo(t: string): string {
  if (t.length <= 3) return "text-5xl sm:text-6xl";
  if (t.length <= 8) return "text-4xl sm:text-5xl";
  if (t.length <= 14) return "text-2xl sm:text-3xl";
  return "text-lg sm:text-xl";
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
  voz,
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

  const falar = useCallback((texto: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = "pt-BR";
    fala.rate = 0.82;
    fala.pitch = 1.04;
    const brasileira = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.toLowerCase().startsWith("pt-br"));
    if (brasileira) fala.voice = brasileira;
    window.speechSynthesis.speak(fala);
  }, []);

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

  useEffect(() => {
    if (fase !== "jogando" || !voz || !atual) return;
    falar(atual.fala ?? `Digite ${atual.alvo}`);
  }, [atual, fase, falar, idx, voz]);

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
      className="relative min-h-full overflow-hidden border border-white/10 bg-slate-950 text-white sm:rounded-xl"
      onClick={() => entrada.current?.focus()}
    >
      {cenario && (
        <div
          className="absolute inset-0 scale-[1.02] bg-cover bg-center opacity-80"
          style={{ backgroundImage: `url(/images/jogos/${cenario}.webp)` }}
          aria-hidden
        />
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,transparent_0%,rgba(2,6,23,.12)_50%,rgba(2,6,23,.78)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/15 via-slate-950/35 to-slate-950/80" />

      <div className="relative mx-auto flex min-h-full max-w-6xl flex-col gap-2 p-2 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={aoSair}
            className="flex h-7 cursor-pointer items-center gap-1 rounded-lg px-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="size-3.5" /> voltar
          </button>
          <span className="truncate text-[11px] font-bold uppercase tracking-wide text-sky-300">
            {titulo}
          </span>
        </div>

        {fase === "pronto" && (
          <div className="flex flex-col items-center gap-2 py-1">
            <TutorFala
              compacto
              texto={
                abertura ??
                "Olá! Eu sou o Teco. Vou acender a tecla certa e mostrar qual dedo usar. É só seguir a cor!"
              }
              humor="animado"
            />
            <img
              src="/images/jogos/digitacao-maos-guia-pro.webp"
              alt="Mãos posicionadas corretamente sobre o teclado"
              className="aspect-video w-full max-w-sm rounded-xl border border-sky-300/30 object-cover shadow-2xl shadow-sky-950/60"
            />
            <p className="text-[11px] text-slate-400">
              {prompts.length} {prompts.length === 1 ? "item" : "itens"} para digitar
              {robo ? ` · robô: ${robo} palavras por minuto` : ""}
            </p>
            <button
              type="button"
              onClick={comecar}
              className="flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-900/50 transition-transform hover:scale-105 active:scale-95"
            >
              <Play className="size-4 fill-current" /> Começar
            </button>
          </div>
        )}

        {fase === "jogando" && atual && (
          <>
            <div className="flex flex-col gap-0.5">
              <div className="h-2 overflow-hidden rounded-full bg-slate-900/80 ring-1 ring-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 transition-[width] duration-150"
                  style={{ width: `${progresso * 100}%` }}
                />
              </div>
              {robo ? (
                <div className="h-1 overflow-hidden rounded-full bg-slate-900/80 ring-1 ring-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400 transition-[width] duration-200"
                    style={{ width: `${progressoRobo * 100}%` }}
                  />
                </div>
              ) : null}
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <div className="flex min-h-[5.5rem] flex-col items-center justify-center gap-1 rounded-xl border border-sky-400/40 bg-slate-900/80 px-3 py-2 text-center shadow-inner shadow-sky-500/10">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-300/80">
                  {idx + 1} de {prompts.length}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {atual.figura && (
                    <div className="rounded-lg bg-white/90 p-0.5">
                      <Figura nome={atual.figura} tamanho={52} />
                    </div>
                  )}
                  <p
                    className={cn(
                      "max-w-full whitespace-pre-wrap break-words font-bold leading-tight",
                      modo === "alvo"
                        ? tamanhoAlvo(alvoAtual)
                        : "text-base font-medium leading-relaxed sm:text-xl",
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
                            "rounded bg-sky-400/30 text-white underline decoration-sky-300 decoration-[3px] underline-offset-4",
                          i > pos && "text-slate-400",
                          i === pos && erroTecla !== null && "bg-red-500/50",
                        )}
                      >
                        {c === " " ? "\u00a0" : c}
                      </span>
                    ))}
                  </p>
                </div>
                {atual.legenda && <p className="text-[11px] text-slate-400">{atual.legenda}</p>}
              </div>

              <div className="grid grid-cols-3 gap-1.5 sm:w-24 sm:grid-cols-1">
                {[
                  ["Tempo", relogio(decorrido)],
                  ["Erros", String(erros)],
                  ["Acertos", String(acertos)],
                ].map(([r, val]) => (
                  <div
                    key={r}
                    className="flex items-center justify-between gap-1 rounded-lg border border-sky-400/40 bg-slate-900/80 px-2 py-1"
                  >
                    <span className="text-[10px] text-slate-400">{r}</span>
                    <span className="text-sm font-bold tabular-nums">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <TutorFala compacto texto={fala.texto} humor={fala.humor} />

            {voz && atual && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  falar(atual.fala ?? `Digite ${atual.alvo}`);
                  entrada.current?.focus();
                }}
                className="mx-auto flex h-10 items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/15 px-4 text-xs font-bold text-cyan-100 shadow-lg shadow-cyan-950/40 hover:bg-cyan-400/25"
              >
                <Volume2 className="size-4" /> Ouvir novamente
              </button>
            )}

            <div className="grid items-center gap-2 sm:grid-cols-[1fr_200px]">
              <Teclado alvo={proximo} erro={erroTecla} {...(foco !== undefined ? { foco } : {})} />
              <div className="overflow-hidden rounded-xl border border-sky-300/20 bg-slate-950/85 text-center shadow-xl shadow-slate-950/60">
                <p className="border-b border-white/10 bg-slate-900/90 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-200">
                  {dedo === null
                    ? "Mãos na posição inicial"
                    : `${dedo <= 4 ? "Mão esquerda" : "Mão direita"} · ${NOME_DEDO[dedo]}`}
                </p>
                <div className="relative">
                  <img
                    src="/images/jogos/digitacao-maos-didaticas-pro.webp"
                    alt="Duas mãos posicionadas corretamente para digitação"
                    className="aspect-video w-full object-cover"
                  />
                  {dedo !== null && PONTA_DEDO[dedo] && (
                    <span
                      className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_18px_currentColor]"
                      style={{
                        left: `${PONTA_DEDO[dedo].x}%`,
                        top: `${PONTA_DEDO[dedo].y}%`,
                        color: COR_DEDO[dedo],
                        background: `${COR_DEDO[dedo]}cc`,
                      }}
                      aria-hidden
                    >
                      <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-60" />
                      <span className="absolute inset-[5px] rounded-full bg-white" />
                    </span>
                  )}
                </div>
              </div>
            </div>

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
