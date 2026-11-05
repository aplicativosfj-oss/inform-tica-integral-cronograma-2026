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
  Users2,
  Wifi,
  X,
} from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { PainelAlunoAula } from "@/components/school/laboratorio/painel-aluno-aula";
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

/** Quanto tempo cada aluno fica no holofote, e quanto dura a troca. */
const TEMPO_DESTAQUE = 5200;

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
 * Holofote da aula: um aluno de cada vez, em letras grandes, trocando sozinho.
 *
 * Na tela cheia antiga o nome flutuava procurando um buraco entre os blocos.
 * Agora que a janela inteira é aproveitada não sobra buraco nenhum, então o
 * holofote virou um lugar fixo do layout — mesma ideia, sem risco de o nome
 * cair por cima do relógio ou sair da tela.
 */
function Holofote({
  alunos,
  logado,
  className,
}: {
  alunos: { sessaoId: string; nome: string; turmaRotulo: string }[];
  logado: boolean;
  className?: string;
}) {
  const [i, setI] = useState(0);
  const [visivel, setVisivel] = useState(true);
  const total = alunos.length;

  useEffect(() => {
    if (total <= 1) return;
    const some = window.setTimeout(() => setVisivel(false), TEMPO_DESTAQUE - 600);
    const troca = window.setTimeout(() => {
      setI((x) => (x + 1) % total);
      setVisivel(true);
    }, TEMPO_DESTAQUE);
    return () => {
      window.clearTimeout(some);
      window.clearTimeout(troca);
    };
  }, [i, total]);

  const atual = alunos[i % Math.max(1, total)];
  if (!atual) return null;
  const cor = serieClasses(serieIndexPorNumero(atual.turmaRotulo));
  return (
    <div className={cn("min-w-0", className)} aria-hidden>
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
        <span className="size-1.5 rounded-full bg-emerald-400" />
        No computador agora
      </p>
      <p
        className={cn(
          "mt-1.5 font-heading text-[clamp(1.15rem,2.1vw,2rem)] font-extrabold leading-[1.08] transition-all duration-500 [overflow-wrap:anywhere]",
          visivel ? "translate-y-0 opacity-100 blur-0" : "translate-y-2 opacity-0 blur-[3px]",
        )}
      >
        {nomeExibido(atual.nome, logado)}
      </p>
      <span
        className={cn(
          "mt-2 w-fit self-start rounded-full px-2.5 py-0.5 text-xs font-extrabold transition-opacity duration-500",
          cor.bg,
          cor.text,
          visivel ? "opacity-100" : "opacity-0",
        )}
      >
        {atual.turmaRotulo}
      </span>
    </div>
  );
}

/**
 * Modo tela cheia da aula de informática.
 *
 * A janela é dividida em três faixas que ocupam toda a tela: à esquerda a
 * identidade da aula (turma, professores, holofote dos alunos), ao centro o
 * relógio da contagem no maior tamanho que couber, e à direita as estações de
 * computador, uma por aluno. Em cima, a barra da escola com o relógio do dia;
 * embaixo, a linha do tempo da aula e o terminal de dicas, de ponta a ponta.
 * No celular em pé tudo se empilha na mesma ordem. Mantém a tela acesa
 * enquanto estiver aberto, quando o aparelho permite.
 */
export function TelaCheiaAula({
  g,
  logado,
  historico = [],
  aoFechar,
  aoMudar,
}: {
  g: GrupoLab;
  logado: boolean;
  /** Idas, faltas e recusas dos últimos dias, para a ficha de cada aluno. */
  historico?: SessaoLab[];
  aoFechar: () => void;
  /** Avisa a página de origem quando o professor mexe no registro do aluno. */
  aoMudar?: () => void;
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
  const minutosTotal = Math.max(1, Math.round((fim - ini) / 60_000));

  const deitado = w > h;
  /** Celular deitado ou janela baixa: menos enfeites em volta, mais relógio. */
  const baixo = h < 560;
  // Tudo tem de caber numa janela só. O relógio vem da altura da janela; se a
  // grade de estações ainda transbordar, são as estações que encolhem — o
  // relógio é o que precisa ser visto do fundo da sala.
  const [fator, setFator] = useState(1);
  const lista = useRef<HTMLUListElement>(null);
  useEffect(() => setFator(1), [w, h, presentes.length, mista]);
  useLayoutEffect(() => {
    const ul = lista.current;
    if (ul && ul.scrollHeight > ul.clientHeight + 2 && fator > 0.62)
      setFator((f) => Math.round((f - 0.07) * 100) / 100);
  });
  const tamanho = Math.round(
    deitado
      ? Math.min(h * (baixo ? 0.66 : 0.58), w * 0.33, 640)
      : Math.min(w * 0.74, h * (mista ? 0.27 : 0.3), 440),
  );
  /** Largura mínima de cada estação: encolhe até tudo caber sem rolar. */
  const estacao = (deitado ? 10.5 : 7.25) * fator;
  const dica = useDigitando(finais ? DICAS_FINAIS : DICAS);

  // Trava a rolagem da página, tenta a tela cheia do navegador e mantém a
  // tela acesa. O que o aparelho não suportar é ignorado: a camada já cobre
  // a janela inteira.
  useEffect(() => {
    // Se outra janela já tinha travado a rolagem, não guardamos esse "hidden"
    // para devolver depois: a página ficaria presa sem rolar ao fechar.
    const anterior = document.body.style.overflow === "hidden" ? "" : document.body.style.overflow;
    const anteriorRaiz =
      document.documentElement.style.overflow === "hidden"
        ? ""
        : document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
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
      document.documentElement.style.overflow = anteriorRaiz;
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

  /** Caixa de vidro das faixas laterais — a mesma em toda a tela cheia. */
  // Translúcido, mas sem `backdrop-filter`: o fundo da tela cheia é animado
  // (chuva binária, halos, varredura) e o Chrome chegava a não desenhar as
  // faixas de vidro durante a rolagem — a tela aparecia vazia.
  const vidro =
    "relative min-h-0 rounded-[1.75rem] border border-white/12 bg-[#0b1226]/70 shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_24px_70px_-40px_rgb(0_0_0/0.9)]";

  const painelTurma = (
    <section
      className={cn(
        vidro,
        "flex flex-col gap-3 overflow-hidden p-4",
        deitado ? "xl:p-5" : "shrink-0 gap-2 p-3",
      )}
      aria-label="Turma no laboratório"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/45 sm:text-[11px]">
        {mista ? "Turmas juntas" : "Turma no laboratório"}
      </p>
      {mista ? (
        <h2 className="tc-titulo flex items-center gap-2 bg-gradient-to-r from-violet-300 via-sky-300 to-emerald-300 bg-clip-text font-heading text-[clamp(1.8rem,4.4vw,3.6rem)] font-extrabold leading-none tracking-tight text-transparent">
          <Shuffle className="size-[0.62em] shrink-0 text-violet-300" aria-hidden />
          Aula mista
        </h2>
      ) : (
        <h2
          className={cn(
            "tc-titulo w-fit rounded-2xl px-[0.3em] py-[0.06em] font-heading text-[clamp(2.4rem,6vw,5.5rem)] font-extrabold leading-none tracking-tight shadow-2xl",
            cor.bg,
            cor.text,
          )}
        >
          {g.turmaRotulo}
        </h2>
      )}

      <dl className="grid grid-cols-2 gap-2 text-left">
        <div className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2">
          <dt className="text-[10px] uppercase tracking-wider text-white/45">Alunos</dt>
          <dd className="font-heading text-xl font-extrabold tabular-nums leading-none">
            {presentes.length}
          </dd>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2">
          <dt className="text-[10px] uppercase tracking-wider text-white/45">Duração</dt>
          <dd className="font-heading text-xl font-extrabold tabular-nums leading-none">
            {minutosTotal}
            <span className="ml-0.5 text-xs font-bold text-white/60">min</span>
          </dd>
        </div>
      </dl>

      {(config.professorInformatica || professor) && !baixo ? (
        <div className="space-y-1.5 text-sm">
          {config.professorInformatica ? (
            <p className="flex items-center gap-2">
              <MonitorSmartphone className="size-4 shrink-0 text-emerald-300" aria-hidden />
              <span className="min-w-0 truncate">
                <span className="text-white/55">Informática:</span>{" "}
                <strong className="font-bold">Prof. {config.professorInformatica}</strong>
              </span>
            </p>
          ) : null}
          {professor ? (
            <p className="flex items-center gap-2">
              <GraduationCap className="size-4 shrink-0 text-amber-300" aria-hidden />
              <span className="min-w-0 truncate">
                <span className="text-white/55">Regente:</span> {professor}
              </span>
            </p>
          ) : null}
        </div>
      ) : null}

      {mista ? (
        <ul className="flex flex-wrap gap-1.5">
          {participantes.map((p) => {
            const c = serieClasses(serieIndexPorNumero(p.rotulo));
            return (
              <li
                key={p.id}
                className="flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.07] py-0.5 pl-0.5 pr-2.5 text-xs"
              >
                <span className={cn("rounded-full px-2 py-0.5 font-extrabold", c.bg, c.text)}>
                  {p.rotulo}
                </span>
                <span className="text-white/75">{p.qtd}</span>
              </li>
            );
          })}
        </ul>
      ) : null}

      {deitado && !baixo ? (
        <Holofote
          alunos={presentes}
          logado={logado}
          className="mt-2 flex min-h-0 flex-1 flex-col justify-center border-t border-white/10 pt-3"
        />
      ) : null}
    </section>
  );

  const painelEstacoes = (
    <section
      className={cn(vidro, "flex min-w-0 flex-col overflow-hidden p-3 sm:p-4")}
      aria-label="Alunos nos computadores"
    >
      <p className="mb-2 flex shrink-0 items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/45 sm:text-[11px]">
        <span className="flex items-center gap-2">
          <Users2 className="size-3.5" aria-hidden /> Nos computadores
        </span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 tabular-nums text-white/70">
          {presentes.length}
        </span>
      </p>
      {/* Mapa das estações: cada linha divide igualmente a altura que sobra,
          então a bancada preenche o painel em vez de ficar amontoada em cima.
          A linha nunca fica menor que 3,2 rem — abaixo disso a grade volta a
          rolar e o `fator` diminui as colunas. */}
      <ul
        ref={lista}
        className="grid min-h-0 flex-1 gap-2 overflow-y-auto [scrollbar-width:none]"
        style={{
          gridTemplateColumns: `repeat(auto-fill,minmax(${estacao}rem,1fr))`,
          gridAutoRows: "minmax(3.2rem,1fr)",
        }}
      >
        {presentes.map((a, i) => {
          const c = serieClasses(serieIndexPorNumero(a.turmaRotulo));
          return (
            <li
              key={a.sessaoId}
              style={{ animationDelay: `${Math.min(i, 14) * 70}ms` }}
              className="lab-aluno min-h-0"
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
                  "flex size-full flex-col items-center justify-center gap-[5%] rounded-2xl border border-white/10 bg-white/[0.06] p-2 text-center transition hover:border-white/25 hover:bg-white/[0.13]",
                  toque === a.sessaoId && "tc-pulo",
                )}
              >
                <span className="relative flex aspect-[4/3] h-[clamp(1.5rem,42%,5rem)] items-center justify-center rounded-lg border border-white/20 bg-slate-900/80">
                  <span
                    className="tc-tela absolute inset-[6%] rounded-[4px] bg-gradient-to-br from-emerald-400/55 to-sky-500/40"
                    style={{ animationDelay: `${(i * 0.37) % 3}s` }}
                  />
                  <span
                    className={cn(
                      "relative rounded px-1 text-[clamp(0.6rem,0.9vw,1.1rem)] font-extrabold leading-none",
                      c.bg,
                      c.text,
                    )}
                  >
                    {a.nome.trim().charAt(0).toUpperCase()}
                  </span>
                </span>
                <span className="w-full min-w-0">
                  <span className="block truncate font-bold leading-tight text-[clamp(0.8rem,1.05vw,1.45rem)]">
                    {primeiroNome(nomeExibido(a.nome, logado))}
                  </span>
                  <span className="block truncate text-[clamp(0.6rem,0.72vw,0.85rem)] leading-tight text-white/50">
                    {a.turmaRotulo} · estação {i + 1}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );

  const conteudo = (
    <div
      role="dialog"
      aria-modal="true"
      data-tela-cheia=""
      aria-label={`Aula de informática em tela cheia: ${mista ? "aula mista" : g.turmaRotulo}`}
      className={cn(
        "fixed inset-0 z-[9999] isolate grid grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-[#050b1a] text-white",
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
          "flex items-center justify-between gap-3 px-4 pb-2.5 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6",
          baixo ? "sm:pt-3" : "sm:pt-5",
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

      {/* ── Corpo: identidade da aula · relógio · estações ── */}
      <main
        className={cn(
          "min-h-0 px-3 sm:px-6",
          deitado
            ? "grid items-stretch gap-3 xl:gap-4 grid-cols-[minmax(11rem,0.78fr)_auto_minmax(0,1.3fr)]"
            : "flex flex-col gap-2.5",
        )}
      >
        {painelTurma}

        <div className="relative flex min-w-0 flex-col items-center justify-center gap-2">
          {/* anel de dados girando em volta do relógio */}
          <svg
            viewBox="0 0 200 200"
            aria-hidden
            className="tc-orbita pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ width: tamanho * 1.18, height: tamanho * 1.18 }}
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
            ateHora={horaNaEscola(g.fim)}
          />
          {pausada ? (
            <p className="relative flex max-w-full items-center gap-2 rounded-full bg-amber-400 px-4 py-1.5 text-center text-sm font-bold text-amber-950">
              <Pause className="size-4 shrink-0" aria-hidden />
              <span className="truncate">
                Aula pausada{g.motivoParada ? `: ${g.motivoParada}` : ""}
              </span>
            </p>
          ) : null}
        </div>

        {painelEstacoes}
      </main>

      {/* ── Rodapé: aviso final, linha do tempo e terminal de dicas ── */}
      <footer
        className={cn(
          "px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 sm:px-6 sm:pb-5",
          deitado ? "flex items-center gap-4" : "space-y-2",
        )}
      >
        {!pausada && finais ? (
          <AvisoMinutosFinais
            restanteMs={restante}
            className={deitado ? "max-w-sm shrink-0" : "mx-auto max-w-2xl"}
          />
        ) : null}
        <div className="min-w-0 flex-1">
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
        </div>
        <p
          className={cn(
            "truncate rounded-xl border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-emerald-300 backdrop-blur-xl sm:text-sm",
            deitado ? "w-[34%] min-w-0 shrink-0" : "",
            (baixo || finais) && "hidden",
          )}
        >
          <span className="text-sky-300">lab@escola</span>
          <span className="text-white/50">:~$ </span>
          {dica}
          <span className="tc-cursor ml-0.5 inline-block h-[1em] w-[0.55em] translate-y-[0.15em] bg-emerald-300" />
        </p>
      </footer>

      {ficha ? (
        <PainelAlunoAula
          aluno={ficha}
          historico={historico}
          logado={logado}
          estacao={presentes.findIndex((a) => a.sessaoId === ficha.sessaoId) + 1}
          aoFechar={() => setFicha(null)}
          aoMudar={aoMudar}
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
export function useTelaCheiaAula(
  grupos: GrupoLab[],
  logado: boolean,
  historico?: SessaoLab[],
  aoMudar?: () => void,
) {
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
        {...(aoMudar ? { aoMudar } : {})}
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
