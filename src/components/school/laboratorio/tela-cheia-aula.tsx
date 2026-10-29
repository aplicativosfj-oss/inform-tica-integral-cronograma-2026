import {
  Code2,
  Cpu,
  Expand,
  GraduationCap,
  Keyboard,
  Laptop,
  Minimize2,
  Monitor,
  MonitorSmartphone,
  Mouse,
  Pause,
  PartyPopper,
  Save,
  Shuffle,
  Wifi,
  X,
} from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { FichaTelaCheia } from "@/components/school/laboratorio/ficha-tela-cheia";
import { AvisoMinutosFinais, RelogioAula } from "@/components/school/laboratorio/relogio-aula";
import { MarcaLogo } from "@/components/school/marca";
import { useAppStore } from "@/lib/app-store";
import {
  horaNaEscola,
  instanteEfetivo,
  nomeExibido,
  useAgora,
  type GrupoLab,
  type SessaoLab,
} from "@/lib/laboratorio";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";
import { cn } from "@/lib/utils";

/** Dicas que o "terminal" digita no rodapé, uma de cada vez. */
const DICAS = [
  "Sente com a coluna reta e a tela na altura dos olhos.",
  "Salve o trabalho de vez em quando: Ctrl + S.",
  "Senha é segredo: não conte para ninguém.",
  "Mouse e teclado com carinho, o computador é de todos.",
  "Na internet, pergunte ao professor antes de clicar.",
  "Pisque os olhos e descanse a vista de vez em quando.",
];
const DICAS_FINAIS = [
  "Salve o trabalho agora: Ctrl + S.",
  "Feche os programas com calma.",
  "Deixe o mouse e o teclado arrumados.",
];

const ICONES = [Monitor, Keyboard, Mouse, Cpu, Wifi, Code2, Laptop, Save];

function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

function horaComSegundos(ms: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Rio_Branco",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(ms);
}

/** Tamanho da janela, para o relógio crescer até onde a tela deixar. */
function useJanela() {
  const [j, setJ] = useState({ w: 390, h: 844 });
  useEffect(() => {
    const medir = () => setJ({ w: window.innerWidth, h: window.innerHeight });
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);
  return j;
}

/** Texto que vai aparecendo letra por letra, como num terminal. */
function useDigitando(frases: string[], porFrase = 6500) {
  const [i, setI] = useState(0);
  const [n, setN] = useState(0);
  const frase = frases[i % frases.length] ?? "";
  useEffect(() => {
    setN(0);
    const letra = window.setInterval(() => setN((x) => x + 1), 45);
    const proxima = window.setTimeout(() => setI((x) => x + 1), porFrase);
    return () => {
      window.clearInterval(letra);
      window.clearTimeout(proxima);
    };
  }, [i, porFrase, frases]);
  return frase.slice(0, n);
}

/**
 * Modo tela cheia da aula de informática: o relógio da contagem ocupa o
 * centro da tela, com a turma (ou a aula mista e as turmas que vieram), os
 * alunos em "estações" de computador e um fundo animado com código binário,
 * trilhas de circuito e peças de computador flutuando. Funciona no
 * computador, na TV e no celular (em pé ou deitado). Mantém a tela acesa
 * enquanto estiver aberto, quando o aparelho permite.
 */
export function TelaCheiaAula({
  g,
  logado,
  historico = [],
  aoFechar,
}: {
  g: GrupoLab;
  logado: boolean;
  /** Idas, faltas e recusas dos últimos dias, para a ficha de cada aluno. */
  historico?: SessaoLab[];
  aoFechar: () => void;
}) {
  const { turmas, config } = useAppStore();
  const [ficha, setFicha] = useState<GrupoLab["alunos"][number] | null>(null);
  const fichaAberta = useRef(false);
  fichaAberta.current = ficha !== null;
  const agora = useAgora(1000);
  const { w, h } = useJanela();
  const [nativa, setNativa] = useState(false);
  const [parado, setParado] = useState(false);
  const [toque, setToque] = useState<string | null>(null);

  const ini = new Date(g.inicio).getTime();
  const fim = new Date(g.fim).getTime();
  const efetivo = instanteEfetivo(g, agora);
  const pausada = g.pausadoEm !== null;
  const restante = Math.max(0, fim - efetivo);
  const acabou = restante <= 0;
  const finais = !pausada && restante > 0 && restante <= 5 * 60_000;
  const progresso = Math.min(1, Math.max(0, (efetivo - ini) / Math.max(1, fim - ini)));

  const presentes = g.alunos.filter((a) => a.ausencia === null && !a.semMarcacao);
  const participantes = useMemo(() => {
    const mapa = new Map<string, { id: string; rotulo: string; qtd: number }>();
    for (const a of presentes) {
      const x = mapa.get(a.turmaId) ?? { id: a.turmaId, rotulo: a.turmaRotulo, qtd: 0 };
      x.qtd++;
      mapa.set(a.turmaId, x);
    }
    return [...mapa.values()];
  }, [presentes]);
  const mista = g.turmaId === "mista";
  const professor = mista ? null : turmas.find((t) => t.id === g.turmaId)?.professorRegente;
  const cor = serieClasses(serieIndexPorNumero(g.turmaRotulo));

  const deitado = w > h;
  /** Celular deitado ou janela baixa: menos enfeites em volta, mais relógio. */
  const baixo = h < 560;
  // Tudo tem de caber numa janela só: se a lista de alunos não couber, o
  // relógio encolhe um pouco de cada vez (e, deitado, a lista ganha largura).
  const [fator, setFator] = useState(1);
  const lista = useRef<HTMLUListElement>(null);
  useEffect(() => setFator(1), [w, h, presentes.length, mista]);
  useLayoutEffect(() => {
    const ul = lista.current;
    if (ul && ul.scrollHeight > ul.clientHeight + 2 && fator > 0.72)
      setFator((f) => Math.round((f - 0.06) * 100) / 100);
  });
  const tamanho = Math.round(
    fator *
      (deitado
        ? Math.min(h * (baixo ? 0.62 : 0.6), w * 0.4, 560)
        : Math.min(w * 0.72, h * (mista ? 0.3 : 0.34), 520)),
  );
  const dica = useDigitando(finais ? DICAS_FINAIS : DICAS);

  // Trava a rolagem da página, tenta a tela cheia do navegador e mantém a
  // tela acesa. O que o aparelho não suportar é ignorado: a camada já cobre
  // a janela inteira.
  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    void document.documentElement.requestFullscreen?.().catch(() => {});
    let trava: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & {
      wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> };
    };
    void nav.wakeLock
      ?.request("screen")
      .then((t) => (trava = t))
      .catch(() => {});
    const mudou = () => setNativa(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", mudou);
    return () => {
      document.body.style.overflow = anterior;
      document.removeEventListener("fullscreenchange", mudou);
      void trava?.release().catch(() => {});
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    };
  }, []);

  // Esc fecha; F liga e desliga a tela cheia do navegador.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) {
        if (fichaAberta.current) setFicha(null);
        else aoFechar();
      }
      if (e.key === "f" || e.key === "F") alternarNativa();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [aoFechar]);

  // Os botões somem quando ninguém mexe, para a tela ficar limpa na TV.
  useEffect(() => {
    let id = window.setTimeout(() => setParado(true), 4000);
    const mexeu = () => {
      setParado(false);
      window.clearTimeout(id);
      id = window.setTimeout(() => setParado(true), 4000);
    };
    window.addEventListener("pointermove", mexeu);
    window.addEventListener("pointerdown", mexeu);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("pointermove", mexeu);
      window.removeEventListener("pointerdown", mexeu);
    };
  }, []);

  function alternarNativa() {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  }

  // Colunas de código binário e peças flutuando: sorteadas uma vez só.
  const colunas = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        texto: Array.from({ length: 40 }, (_, j) => ((i * 7 + j * 13) % 3 === 0 ? "1" : "0")).join(
          "\n",
        ),
        esquerda: (i / 18) * 100 + ((i * 37) % 5),
        duracao: 14 + ((i * 11) % 12),
        atraso: -((i * 23) % 20),
      })),
    [],
  );
  const pecas = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        Icone: ICONES[i % ICONES.length]!,
        esquerda: (i * 83) % 96,
        duracao: 18 + ((i * 7) % 14),
        atraso: -((i * 5) % 24),
        tamanho: 22 + ((i * 13) % 26),
      })),
    [],
  );

  const conteudo = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Aula de informática em tela cheia: ${mista ? "aula mista" : g.turmaRotulo}`}
      className={cn(
        "fixed inset-0 z-[9999] isolate flex flex-col overflow-hidden bg-[#050b1a] text-white",
        parado && "cursor-none",
      )}
    >
      {/* ── Fundo: brilhos, grade de circuito, código binário e peças ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className={cn(
            "tc-brilho absolute -left-1/4 -top-1/4 size-[70vmax] rounded-full blur-3xl",
            finais ? "bg-red-600/25" : pausada ? "bg-amber-500/20" : "bg-emerald-500/20",
          )}
        />
        <div className="tc-brilho absolute -bottom-1/3 -right-1/4 size-[70vmax] rounded-full bg-indigo-600/25 blur-3xl [animation-delay:-6s]" />
        <div className="tc-grade absolute inset-0 opacity-60" />
        {colunas.map((c, i) => (
          <pre
            key={i}
            className="tc-binario absolute top-0 m-0 font-mono text-[11px] leading-[1.35] text-emerald-300/[0.13] sm:text-xs"
            style={{
              left: `${c.esquerda}%`,
              animationDuration: `${c.duracao}s`,
              animationDelay: `${c.atraso}s`,
            }}
          >
            {c.texto}
          </pre>
        ))}
        {pecas.map(({ Icone, esquerda, duracao, atraso, tamanho: t }, i) => (
          <Icone
            key={i}
            className="tc-peca absolute bottom-0 text-sky-200/[0.13]"
            style={{
              left: `${esquerda}%`,
              width: t,
              height: t,
              animationDuration: `${duracao}s`,
              animationDelay: `${atraso}s`,
            }}
          />
        ))}
        <div className="tc-scan absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-emerald-300/[0.06] to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgb(0_0_0/0.55))]" />
      </div>

      {/* ── Barra de cima ── */}
      <header
        className={cn(
          "flex items-center justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-8",
          baixo ? "sm:pt-3" : "sm:pt-6",
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <MarcaLogo
            tamanho={w >= 640 ? 46 : 38}
            className="rounded-xl shadow-lg ring-1 ring-white/20"
          />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300 sm:text-xs">
              <span className="relative flex size-2">
                <span
                  className={cn(
                    "absolute inline-flex size-full rounded-full opacity-70",
                    pausada
                      ? "bg-amber-400"
                      : acabou
                        ? "bg-white/50"
                        : "animate-ping bg-emerald-400",
                  )}
                />
                <span
                  className={cn(
                    "relative inline-flex size-2 rounded-full",
                    pausada ? "bg-amber-400" : acabou ? "bg-white/60" : "bg-emerald-400",
                  )}
                />
              </span>
              {acabou ? "Encerrada" : pausada ? "Pausada" : "Ao vivo"}
            </p>
            <p className="line-clamp-2 text-xs font-bold leading-tight text-white sm:text-base">
              {config.nomeEscola || "Laboratório de Informática"}
            </p>
            <p className="hidden truncate text-xs text-white/60 sm:block">
              Laboratório de Informática
            </p>
          </div>
        </div>
        <p
          className={cn(
            "hidden font-mono text-2xl font-bold tabular-nums text-white/80 lg:text-3xl",
            !baixo && "md:block",
          )}
        >
          {horaComSegundos(agora)}
        </p>
        <div
          className={cn(
            "flex items-center gap-2 transition-opacity duration-500",
            parado && "opacity-0",
          )}
        >
          {typeof document !== "undefined" && document.fullscreenEnabled ? (
            <button
              type="button"
              onClick={alternarNativa}
              aria-label={nativa ? "Sair da tela cheia do navegador" : "Tela cheia do navegador"}
              className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur-xl transition hover:bg-white/20"
            >
              {nativa ? <Minimize2 className="size-5" /> : <Expand className="size-5" />}
            </button>
          ) : null}
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar a tela cheia"
            className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur-xl transition hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
        </div>
      </header>

      {/* ── Centro: relógio e turma ── */}
      <main
        className={cn(
          "flex min-h-0 flex-1 items-center gap-4 px-4 sm:gap-10 sm:px-8",
          deitado ? "flex-row justify-center" : "flex-col pt-3",
        )}
      >
        <div className="relative flex shrink-0 flex-col items-center gap-3">
          {/* anel de dados girando em volta do relógio */}
          <svg
            viewBox="0 0 200 200"
            aria-hidden
            className="tc-orbita pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
            style={{
              width: tamanho * 1.16,
              height: tamanho * 1.16,
              marginTop: -tamanho * 0.08,
            }}
          >
            <circle
              cx="100"
              cy="100"
              r="98"
              fill="none"
              stroke="rgb(110 231 183 / 0.35)"
              strokeWidth="0.6"
              strokeDasharray="1 5 12 5"
            />
            <circle cx="100" cy="2" r="2.2" fill="rgb(110 231 183)" />
            <circle cx="198" cy="100" r="1.4" fill="rgb(125 211 252)" />
          </svg>
          <RelogioAula
            inicioMs={ini}
            fimMs={fim}
            agoraMs={efetivo}
            pausada={pausada}
            tamanho={tamanho}
          />
          {pausada ? (
            <p className="flex items-center gap-2 rounded-full bg-amber-400 px-4 py-1.5 text-sm font-bold text-amber-950">
              <Pause className="size-4" aria-hidden />
              Aula pausada{g.motivoParada ? `: ${g.motivoParada}` : ""}
            </p>
          ) : null}
        </div>

        <section
          className={cn(
            "flex min-h-0 min-w-0 flex-col gap-3 sm:gap-4",
            deitado
              ? cn(
                  "max-h-full flex-1 items-start justify-center text-left",
                  fator < 1 ? "max-w-3xl" : "max-w-xl",
                )
              : "w-full flex-1 items-center text-center",
          )}
        >
          <div className={cn("flex flex-col gap-1", deitado ? "items-start" : "items-center")}>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/55 sm:text-sm">
              {mista ? "Turmas juntas no laboratório" : "Turma no laboratório"}
            </p>
            {mista ? (
              <h2 className="tc-titulo flex items-center gap-3 bg-gradient-to-r from-violet-300 via-sky-300 to-emerald-300 bg-clip-text font-heading text-[clamp(2.4rem,8vmin,6rem)] font-extrabold leading-none tracking-tight text-transparent">
                <Shuffle className="size-[0.7em] shrink-0 text-violet-300" aria-hidden />
                Aula mista
              </h2>
            ) : (
              <h2
                className={cn(
                  "tc-titulo rounded-3xl px-[0.35em] py-[0.08em] font-heading text-[clamp(3rem,12vmin,8.5rem)] font-extrabold leading-none tracking-tight shadow-2xl",
                  cor.bg,
                  cor.text,
                )}
              >
                {g.turmaRotulo}
              </h2>
            )}
            <div
              className={cn(
                "mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/85 sm:text-lg",
                deitado ? "justify-start" : "justify-center",
              )}
            >
              {config.professorInformatica ? (
                <p className="flex items-center gap-2">
                  <MonitorSmartphone className="size-5 text-emerald-300" aria-hidden />
                  <span>
                    <span className="text-white/60">Informática:</span>{" "}
                    <strong className="font-bold text-white">
                      Prof. {config.professorInformatica}
                    </strong>
                  </span>
                </p>
              ) : null}
              {professor ? (
                <p className="flex items-center gap-2">
                  <GraduationCap className="size-5 text-amber-300" aria-hidden />
                  <span>
                    <span className="text-white/60">Regente:</span> {professor}
                  </span>
                </p>
              ) : null}
            </div>
            {mista ? (
              <ul
                className={cn(
                  "mt-2 flex flex-wrap gap-2",
                  deitado ? "justify-start" : "justify-center",
                )}
              >
                {participantes.map((p) => {
                  const c = serieClasses(serieIndexPorNumero(p.rotulo));
                  return (
                    <li
                      key={p.id}
                      className={cn(
                        "flex items-center gap-2 rounded-full border border-white/15 bg-white/10 pl-1 backdrop-blur-xl",
                        deitado ? "py-1 pr-3 text-sm" : "py-0.5 pr-2.5 text-xs",
                      )}
                    >
                      <span
                        className={cn("rounded-full px-2.5 py-0.5 font-extrabold", c.bg, c.text)}
                      >
                        {p.rotulo}
                      </span>
                      {p.qtd} aluno{p.qtd === 1 ? "" : "s"}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>

          {/* Estações: um computador por aluno, com a tela piscando. */}
          <ul
            ref={lista}
            aria-label="Alunos nos computadores"
            className={cn(
              "grid min-h-0 w-full content-start overflow-y-auto [scrollbar-width:none]",
              deitado
                ? "gap-2 grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))]"
                : "gap-1.5 grid-cols-[repeat(auto-fill,minmax(6.75rem,1fr))]",
            )}
          >
            {presentes.map((a, i) => {
              const c = serieClasses(serieIndexPorNumero(a.turmaRotulo));
              return (
                <li
                  key={a.sessaoId}
                  style={{ animationDelay: `${Math.min(i, 14) * 70}ms` }}
                  className="lab-aluno"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setToque(a.sessaoId);
                      setFicha(a);
                    }}
                    aria-label={`Ver a ficha de ${primeiroNome(nomeExibido(a.nome, logado))}`}
                    onAnimationEnd={() => setToque(null)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-2 text-left backdrop-blur-xl transition hover:bg-white/[0.14]",
                      deitado && !baixo ? "py-1.5" : "py-1",
                      toque === a.sessaoId && "tc-pulo",
                    )}
                  >
                    <span
                      className={cn(
                        "relative flex shrink-0 items-center justify-center rounded-md border border-white/20 bg-slate-900",
                        deitado && !baixo ? "h-8 w-10" : "h-6 w-8",
                      )}
                    >
                      <span
                        className="tc-tela absolute inset-0.5 rounded-sm bg-gradient-to-br from-emerald-400/50 to-sky-500/40"
                        style={{ animationDelay: `${(i * 0.37) % 3}s` }}
                      />
                      <span
                        className={cn(
                          "relative rounded px-1 text-[9px] font-extrabold",
                          c.bg,
                          c.text,
                        )}
                      >
                        {a.nome.trim().charAt(0).toUpperCase()}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block truncate font-bold sm:text-lg",
                          deitado ? "text-base" : "text-sm",
                        )}
                      >
                        {primeiroNome(nomeExibido(a.nome, logado))}
                      </span>
                      {/* No celular em pé, a cor da letra já mostra a turma. */}
                      {mista && deitado && !baixo ? (
                        <span className="block text-[10px] text-white/55">{a.turmaRotulo}</span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </main>

      {/* ── Rodapé: aviso final, linha do tempo e terminal de dicas ── */}
      <footer className="space-y-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-8 sm:pb-6">
        {!pausada ? (
          <AvisoMinutosFinais restanteMs={restante} className="mx-auto max-w-2xl" />
        ) : null}
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between text-xs font-semibold tabular-nums text-white/70 sm:text-sm">
            <span>Início {horaNaEscola(g.inicio)}</span>
            <span className="md:hidden">{horaComSegundos(agora)}</span>
            <span>Fim {horaNaEscola(g.fim)}</span>
          </div>
          <div className="relative mt-1.5 h-2.5 rounded-full bg-white/10">
            <div
              className={cn(
                "h-full rounded-full bg-gradient-to-r",
                finais ? "from-amber-400 to-red-500" : "from-emerald-400 to-sky-400",
              )}
              style={{ width: `${progresso * 100}%`, transition: "width 1s linear" }}
            />
            <span
              aria-hidden
              className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-emerald-400 shadow-[0_0_14px_rgb(52_211_153)]"
              style={{ left: `${progresso * 100}%`, transition: "left 1s linear" }}
            />
          </div>
          <p
            className={cn(
              "mt-3 truncate rounded-xl border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-emerald-300 backdrop-blur-xl sm:text-sm",
              (baixo || finais) && "hidden",
            )}
          >
            <span className="text-sky-300">lab@escola</span>
            <span className="text-white/50">:~$ </span>
            {dica}
            <span className="tc-cursor ml-0.5 inline-block h-[1em] w-[0.55em] translate-y-[0.15em] bg-emerald-300" />
          </p>
        </div>
      </footer>

      {ficha ? (
        <FichaTelaCheia
          aluno={ficha}
          historico={historico}
          logado={logado}
          aoFechar={() => setFicha(null)}
        />
      ) : null}

      {/* ── Fim da aula ── */}
      {acabou ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#050b1a]/85 p-6 text-center backdrop-blur-md">
          <PartyPopper className="tc-pulo size-16 text-amber-300 sm:size-24" aria-hidden />
          <p className="font-heading text-[clamp(2.2rem,8vmin,5rem)] font-extrabold leading-none">
            Aula concluída!
          </p>
          <p className="max-w-md text-base text-white/75 sm:text-lg">
            Parabéns, {mista ? "turmas" : g.turmaRotulo}! Hora de desligar os computadores e deixar
            tudo arrumado.
          </p>
          <button
            type="button"
            onClick={aoFechar}
            className="mt-2 rounded-full bg-white px-6 py-2.5 font-bold text-slate-900 transition hover:bg-white/90"
          >
            Fechar
          </button>
        </div>
      ) : null}
    </div>
  );

  return typeof document === "undefined" ? null : createPortal(conteudo, document.body);
}

/**
 * Guarda qual aula está em tela cheia. Usa a versão mais nova do grupo
 * (pausas, alunos que entraram) e, quando a aula acaba e some da lista de
 * "ao vivo", continua com a última cópia para mostrar "Aula concluída".
 */
export function useTelaCheiaAula(grupos: GrupoLab[], logado: boolean, historico?: SessaoLab[]) {
  const [aberto, setAberto] = useState<GrupoLab | null>(null);
  const atual = aberto ? (grupos.find((x) => x.grupoId === aberto.grupoId) ?? aberto) : null;
  return {
    abrir: (g: GrupoLab) => setAberto(g),
    tela: atual ? (
      <TelaCheiaAula
        g={atual}
        logado={logado}
        historico={historico ?? []}
        aoFechar={() => setAberto(null)}
      />
    ) : null,
  };
}

/** Botão que abre a tela cheia da aula. */
export function BotaoTelaCheia({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur-xl transition hover:bg-white/20 active:scale-95",
        className,
      )}
    >
      <Expand className="size-4 transition-transform group-hover:scale-110" aria-hidden />
      Tela cheia
    </button>
  );
}
