import {
  AlertTriangle,
  ArrowRight,
  BedDouble,
  CalendarDays,
  ChevronDown,
  Clapperboard,
  Clock,
  Dices,
  FileDown,
  HandHeart,
  Moon,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { CompartilharRedes } from "@/components/school/pausa/compartilhar-redes";
import { IlustracaoEspaco } from "@/components/school/pausa/ilustracoes";
import { SeloIntervalo } from "@/components/school/pausa/status-intervalo";
import {
  DIAS,
  ESCOLA,
  ESPACOS,
  HORARIO,
  JOGOS_POR_ANO,
  SALA_REPOUSO,
  TURMAS_PAUSA,
  espacosDoDia,
  juntarNomes,
  turmasNoDia,
  type DiaUtil,
  type Espaco,
  type MomentoIntervalo,
  type TurmaPausa,
} from "@/lib/entre-turnos";
import { useMomentoIntervalo } from "@/lib/use-momento-intervalo";
import { cn } from "@/lib/utils";

/** Cor e ícone de cada espaço: os mesmos no desenho, nas etiquetas e no PDF. */
const VISUAL: Record<
  Espaco,
  {
    Icone: LucideIcon;
    etiqueta: string;
    borda: string;
    texto: string;
    fundo: string;
    impresso: string;
  }
> = {
  aula: {
    Icone: BedDouble,
    etiqueta: "bg-indigo-500 text-white",
    borda: "border-indigo-400/50",
    texto: "text-indigo-700 dark:text-indigo-300",
    fundo: "from-indigo-500/25",
    impresso: "#e0e7ff",
  },
  filme: {
    Icone: Clapperboard,
    etiqueta: "bg-rose-500 text-white",
    borda: "border-rose-400/50",
    texto: "text-rose-700 dark:text-rose-300",
    fundo: "from-rose-500/25",
    impresso: "#ffe4e6",
  },
  jogos: {
    Icone: Dices,
    etiqueta: "bg-emerald-500 text-white",
    borda: "border-emerald-400/50",
    texto: "text-emerald-700 dark:text-emerald-300",
    fundo: "from-emerald-500/25",
    impresso: "#d1fae5",
  },
};

const ORDEM: Espaco[] = ["aula", "filme", "jogos"];
const CAMINHO = "/entre-turnos";
const TEXTO_COMPARTILHAR =
  "🍽️ Entre Turnos · 11h às 13h\n🛏️ Sala de aula · 🎬 Filme · 🎲 Jogos\n👩‍🏫 Veja onde cada turma fica e quem cuida dela:";

/** Etiqueta curta de um espaço: ícone + nome. */
function Etiqueta({ espaco, curta = false }: { espaco: Espaco; curta?: boolean }) {
  const { Icone, etiqueta } = VISUAL[espaco];
  const nome = curta
    ? { aula: "Sala", filme: "Filme", jogos: "Jogos" }[espaco]
    : ESPACOS[espaco].nome;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold",
        etiqueta,
      )}
    >
      <Icone className="size-3.5" aria-hidden /> {nome}
    </span>
  );
}

/** Quem cuida da turma naquele espaço. */
function responsavel(t: TurmaPausa, e: Espaco) {
  return ESPACOS[e].responsavel ?? juntarNomes(t.monitores);
}

const nomeDoDia = (d: DiaUtil) => DIAS.find((x) => x.dia === d)!.nome;

/** Choques entre a escala da sala de jogos e a do cronograma (dia com dois espaços). */
const CHOQUES = TURMAS_PAUSA.flatMap((t) =>
  DIAS.filter((d) => espacosDoDia(t, d.dia).length > 1).map((d) => ({
    turma: t.turma,
    dia: d.nome,
  })),
);

type Modo = "dia" | "turma";

/**
 * Página pública "Entre Turnos": o intervalo das 11h às 13h explicado para
 * famílias, equipe e comunidade. Abre com uma explicação em quatro passos;
 * depois vem a consulta, por dia (o que acontece e quem é responsável) ou
 * por turma (a semana inteira dela), o quadro da semana e a equipe. O PDF
 * sai de uma versão própria para impressão, em uma folha A4 deitada.
 */
export function EntreTurnos() {
  const m = useMomentoIntervalo();
  const hoje = m?.hoje ?? null;
  const [dia, setDia] = useState<DiaUtil>(1);
  const [turma, setTurma] = useState<string>(TURMAS_PAUSA[0]!.turma);
  const [montado, setMontado] = useState(false);
  const [aberto, setAberto] = useState({ espacos: false, quadro: false });

  useEffect(() => {
    setMontado(true);
    // Em tela larga, tudo já vem aberto; no celular, o que é explicação fica recolhido.
    if (window.matchMedia("(min-width: 768px)").matches) setAberto({ espacos: true, quadro: true });
  }, []);
  // Leva a consulta para hoje e, depois das 13h, para o próximo dia letivo.
  const foco = m?.diaEmFoco;
  useEffect(() => {
    if (foco) setDia(foco);
  }, [foco]);

  function verLugares() {
    setAberto((a) => ({ ...a, espacos: true }));
    window.setTimeout(
      () =>
        document.getElementById("espacos")?.scrollIntoView({ behavior: "smooth", block: "start" }),
      50,
    );
  }

  function abrir(novo: { modo: Modo; dia?: DiaUtil; turma?: string }) {
    if (novo.dia) setDia(novo.dia);
    if (novo.turma) setTurma(novo.turma);
    document
      .getElementById(novo.modo === "dia" ? "agora" : "consulta")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="text-foreground">
      {/* ------------------------------------------------------------ abertura */}
      <section className="dark relative isolate overflow-hidden border-b border-white/10 bg-ink text-white">
        <div aria-hidden className="fundo-pixel absolute inset-0 -z-10 opacity-20" />
        <div
          aria-hidden
          className="absolute -right-40 -top-40 -z-10 size-[32rem] rounded-full bg-sun/20 blur-3xl"
        />
        <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-6 pt-6 sm:gap-8 sm:px-6 sm:pb-10 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center">
          <div className="hero-subir">
            <div className="flex flex-wrap items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-sun">
                <Clock className="size-3.5" aria-hidden /> {HORARIO.inicio} às {HORARIO.fim} ·
                depois do almoço
              </span>
              {m ? <SeloIntervalo m={m} /> : null}
            </div>
            <h1 className="mt-3 text-balance text-[clamp(2.1rem,6vw,4rem)] font-extrabold leading-[1.02] tracking-tight sm:mt-4">
              Entre <span className="text-sun">Turnos</span>
            </h1>
            <p className="mt-3 hidden max-w-xl text-pretty text-base leading-relaxed text-white/80 sm:mt-4 sm:block sm:text-lg">
              Das 11h às 13h, depois do almoço, as crianças ficam em{" "}
              <strong className="text-white">quatro lugares</strong> da escola. Veja abaixo, de
              forma simples, <strong className="text-white">quais turmas</strong> vão para cada
              lugar e <strong className="text-white">quem cuida</strong> delas.
            </p>
            <p className="mt-2 text-base text-white/80 sm:hidden">
              Onde cada turma fica e quem cuida dela, das 11h às 13h.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2.5 sm:mt-6">
              <button
                type="button"
                onClick={verLugares}
                className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-sun px-4 text-sm font-bold text-sun-foreground shadow-lg shadow-sun/20 transition-transform hover:-translate-y-0.5 sm:h-11 sm:px-5"
              >
                <Search className="max-sm:hidden size-4" aria-hidden /> Entender cada lugar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/20"
              >
                <FileDown className="size-4" aria-hidden /> Baixar PDF
              </button>
              <CompartilharRedes
                caminho={CAMINHO}
                texto={TEXTO_COMPARTILHAR}
                className="text-white/60 hover:bg-white/10 hover:text-white"
              />
            </div>
          </div>

          {/* três desenhos em leque */}
          <div aria-hidden className="relative mx-auto hidden h-80 w-full max-w-[24rem] sm:block">
            {(
              [
                ["aula", "left-0 top-0 rotate-[-6deg]"],
                ["filme", "right-0 top-12 rotate-[5deg]"],
                ["jogos", "bottom-0 left-8 rotate-[-2deg]"],
              ] as const
            ).map(([e, pos]) => (
              <IlustracaoEspaco
                key={e}
                espaco={e}
                className={cn(
                  "absolute aspect-[16/10] w-56 rounded-2xl border-4 border-white/90 shadow-2xl",
                  pos,
                )}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------- agora / o que vem a seguir */}
      <AgoraEProximo
        m={m}
        dia={dia}
        hoje={hoje}
        onDia={setDia}
        onTurma={(t) => abrir({ modo: "turma", turma: t })}
      />

      {/* ------------------------------------------------------------ consulta */}
      <section id="consulta" className="mt-6 scroll-mt-20 border-y border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-sun">
            Consulte por turma
          </p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Veja a semana da sua turma
          </h2>
          <ConsultaPorTurma
            turma={turma}
            hoje={hoje}
            onTurma={setTurma}
            onDia={(d) => abrir({ modo: "dia", dia: d })}
          />
        </div>
      </section>

      {/* --------------------------------------------------------- os espaços */}
      <Recolhivel
        titulo="Entenda cada lugar"
        legenda="Sala de aula, sala de filme, sala de jogos e sala de repouso"
        aberto={aberto.espacos}
        onAbrir={(v) => setAberto((a) => ({ ...a, espacos: v }))}
      >
        <OsEspacos />
      </Recolhivel>

      {/* -------------------------------------------------- quadro da semana */}
      <Recolhivel
        titulo="Quadro da semana"
        legenda="Todas as turmas, dia por dia"
        aberto={aberto.quadro}
        onAbrir={(v) => setAberto((a) => ({ ...a, quadro: v }))}
      >
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-sun">
            Visão geral
          </p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Quadro da semana
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Toque no nome de uma turma para ver a semana dela, ou num dia para ver quem está onde.
          </p>

          {CHOQUES.length ? (
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              Atenção: {CHOQUES.map((c) => `${c.turma} na ${c.dia.toLowerCase()}`).join("; ")}{" "}
              aparece em dois espaços ao mesmo tempo. A coordenação vai confirmar.
            </p>
          ) : null}

          {/* computador: tabela */}
          <div className="mt-5 hidden overflow-hidden rounded-3xl border border-border md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/70 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-bold">Turma</th>
                  {DIAS.map((d) => (
                    <th
                      key={d.dia}
                      className={cn("px-1 py-2 text-center", hoje === d.dia && "bg-sun/15")}
                    >
                      <button
                        type="button"
                        onClick={() => abrir({ modo: "dia", dia: d.dia })}
                        className={cn(
                          "cursor-pointer rounded-lg px-2 py-1 font-bold uppercase hover:bg-muted",
                          hoje === d.dia ? "text-amber-600 dark:text-sun" : "hover:text-foreground",
                        )}
                      >
                        {d.curto}
                        {hoje === d.dia ? " · hoje" : ""}
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3 font-bold">Monitores</th>
                </tr>
              </thead>
              <tbody>
                {TURMAS_PAUSA.map((t, i) => (
                  <tr
                    key={t.turma}
                    className={cn("border-t border-border", i % 2 && "bg-muted/30")}
                  >
                    <th scope="row" className="px-2 py-1.5 text-left">
                      <button
                        type="button"
                        onClick={() => abrir({ modo: "turma", turma: t.turma })}
                        className="cursor-pointer rounded-lg px-2 py-1 text-base font-extrabold hover:bg-muted hover:text-amber-600 dark:hover:text-sun"
                      >
                        {t.turma}
                      </button>
                    </th>
                    {DIAS.map((d) => (
                      <td
                        key={d.dia}
                        className={cn("px-2 py-2.5 text-center", hoje === d.dia && "bg-sun/[0.07]")}
                      >
                        <span className="inline-flex flex-col items-center gap-1">
                          {espacosDoDia(t, d.dia).map((e) => (
                            <Etiqueta key={e} espaco={e} curta />
                          ))}
                        </span>
                      </td>
                    ))}
                    <td className="px-4 py-2.5 font-medium text-foreground/85">
                      {juntarNomes(t.monitores)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* celular: um cartão por turma */}
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 md:hidden">
            {TURMAS_PAUSA.map((t) => (
              <li key={t.turma}>
                <button
                  type="button"
                  onClick={() => abrir({ modo: "turma", turma: t.turma })}
                  className="w-full cursor-pointer rounded-2xl border border-border bg-card p-3.5 text-left transition-colors hover:border-sun/50"
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-lg font-extrabold">{t.turma}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {juntarNomes(t.monitores)}
                    </span>
                  </span>
                  <span className="mt-2.5 grid grid-cols-5 gap-1">
                    {DIAS.map((d) => (
                      <span
                        key={d.dia}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-lg py-1.5",
                          hoje === d.dia ? "bg-sun/15 ring-1 ring-sun/50" : "bg-muted/60",
                        )}
                      >
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {d.curto}
                        </span>
                        {espacosDoDia(t, d.dia).map((e) => {
                          const I = VISUAL[e].Icone;
                          return (
                            <span
                              key={e}
                              title={ESPACOS[e].nome}
                              className={cn(
                                "grid size-7 place-items-center rounded-full",
                                VISUAL[e].etiqueta,
                              )}
                            >
                              <I className="size-3.5" aria-label={ESPACOS[e].nome} />
                            </span>
                          );
                        })}
                      </span>
                    ))}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            {ORDEM.map((e) => (
              <Etiqueta key={e} espaco={e} />
            ))}
          </div>
        </section>
      </Recolhivel>

      <p className="mx-auto max-w-6xl px-4 pb-10 text-xs text-muted-foreground sm:px-6">
        Fonte: Cronograma de Atendimento às turmas no período de repouso após o almoço e escala da
        sala de jogos · {ESCOLA}.
      </p>

      {montado ? createPortal(<VersaoImpressa />, document.body) : null}
    </div>
  );
}

/**
 * Primeira coisa que o público vê: o que está acontecendo no intervalo agora
 * ou, fora do horário, o que já está programado para o próximo dia, lugar por
 * lugar, com o desenho de cada espaço e as turmas que vão para ele.
 */
function AgoraEProximo({
  m,
  dia,
  hoje,
  onDia,
  onTurma,
}: {
  m: MomentoIntervalo | null;
  dia: DiaUtil;
  hoje: DiaUtil | null;
  onDia: (d: DiaUtil) => void;
  onTurma: (t: string) => void;
}) {
  if (!m) return <div aria-busy className="mx-auto h-72 max-w-6xl animate-pulse px-4 sm:px-6" />;
  const doDia = turmasNoDia(dia);
  const emFoco = dia === m.diaEmFoco;
  const agora = emFoco && m.fase === "agora";
  const programado = !agora && (!emFoco || m.fase === "encerrado" || m.fase === "fim-de-semana");
  const quando =
    dia === m.proximo && m.fase !== "antes" && m.fase !== "agora"
      ? m.proximoEhAmanha
        ? "amanhã"
        : "o próximo dia de aula"
      : nomeDoDia(dia).toLowerCase();
  const titulo = agora
    ? "Acontecendo agora"
    : emFoco && m.fase === "antes"
      ? "Hoje, a partir das 11h"
      : `Programado para ${quando}`;
  return (
    <section
      id="agora"
      aria-label={titulo}
      className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-5 sm:px-6 sm:pt-8"
    >
      <div
        className={cn(
          "overflow-hidden rounded-3xl border shadow-xl",
          agora
            ? "border-emerald-400/50"
            : programado
              ? "border-indigo-400/50"
              : "border-amber-400/50",
        )}
      >
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-white sm:px-5",
            agora
              ? "bg-gradient-to-r from-emerald-600 to-emerald-500"
              : programado
                ? "bg-gradient-to-r from-indigo-700 to-indigo-500"
                : "bg-gradient-to-r from-amber-600 to-amber-500",
          )}
        >
          <div>
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-white/85">
              {agora ? (
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-70" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-white" />
                </span>
              ) : (
                <CalendarDays className="size-3.5" aria-hidden />
              )}
              {titulo}
            </p>
            <h2 className="font-heading text-2xl font-extrabold leading-tight">{nomeDoDia(dia)}</h2>
          </div>
          <p className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm font-bold">
            <Clock className="size-4" aria-hidden /> {HORARIO.inicio} às {HORARIO.fim}
          </p>
        </div>

        <div className="border-b bg-card px-3 pb-3 pt-5 sm:px-4">
          <SeletorDia dia={dia} hoje={hoje} onDia={onDia} />
        </div>

        <ul className="divide-y divide-border bg-card">
          {ORDEM.map((e) => {
            const v = VISUAL[e];
            const lista = doDia[e];
            const proprio = ESPACOS[e].responsavel;
            return (
              <li key={e} className="flex gap-3 p-3 sm:gap-4 sm:p-4">
                <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-2xl sm:h-28 sm:w-40">
                  <IlustracaoEspaco espaco={e} className="size-full" />
                  <span
                    className={cn(
                      "absolute left-1.5 top-1.5 grid size-7 place-items-center rounded-full shadow",
                      v.etiqueta,
                    )}
                  >
                    <v.Icone className="size-4" aria-hidden />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-base font-extrabold leading-tight sm:text-lg">
                    {ESPACOS[e].nome}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {proprio ? `Responsável: ${proprio}` : "Com os monitores da própria turma"}
                  </p>
                  {lista.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">Nenhuma turma neste dia.</p>
                  ) : (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {lista.map((t) => (
                        <li key={t.turma}>
                          <button
                            type="button"
                            onClick={() => onTurma(t.turma)}
                            className={cn(
                              "rounded-lg px-2.5 py-1 text-sm font-extrabold transition hover:scale-105",
                              v.etiqueta,
                            )}
                          >
                            {t.turma}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="flex items-center gap-2 border-t bg-sky-500/10 px-4 py-2.5 text-xs text-sky-800 dark:text-sky-200">
          <Moon className="size-3.5 shrink-0" aria-hidden />
          Sala de repouso aberta todos os dias, para quem quiser dormir (meninas: sala de
          informática · meninos: biblioteca).
        </p>
      </div>
    </section>
  );
}

/** Seção que no celular fica recolhida: um cartão com título que abre e fecha. */
function Recolhivel({
  titulo,
  legenda,
  aberto,
  onAbrir,
  children,
}: {
  titulo: string;
  legenda: string;
  aberto: boolean;
  onAbrir: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <details
      open={aberto}
      onToggle={(e) => onAbrir((e.currentTarget as HTMLDetailsElement).open)}
      className="group mx-auto mt-2 max-w-6xl px-4 sm:px-6"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3.5 shadow-sm">
        <span>
          <span className="block font-heading text-base font-extrabold">{titulo}</span>
          <span className="block text-xs text-muted-foreground">{legenda}</span>
        </span>
        <ChevronDown
          className="size-5 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="-mx-4 sm:-mx-6">{children}</div>
    </details>
  );
}

/** Turmas de cada dia num espaço da escala, ex.: "Segunda-feira: 5º A e 5º B". */
function turmasPorDia(e: Espaco) {
  return DIAS.map((d) => ({
    dia: d.nome,
    turmas: juntarNomes(turmasNoDia(d.dia)[e].map((t) => t.turma)),
  })).filter((x) => x.turmas);
}

function ListaDias({ e }: { e: Espaco }) {
  return (
    <ul className="space-y-1">
      {turmasPorDia(e).map((x) => (
        <li
          key={x.dia}
          className="flex justify-between gap-3 border-b border-border/60 pb-1 last:border-0"
        >
          <span className="text-muted-foreground">{x.dia}</span>
          <strong>{x.turmas}</strong>
        </li>
      ))}
    </ul>
  );
}

/** Um lugar do intervalo: quando funciona, quais turmas atende e quem cuida. */
function CartaoEspaco({
  numero,
  desenho,
  nome,
  resumo,
  cor,
  quando,
  turmas,
  responsavel,
}: {
  numero: number;
  desenho: Espaco | "repouso";
  nome: string;
  resumo: string;
  cor: string;
  quando: ReactNode;
  turmas: ReactNode;
  responsavel: ReactNode;
}) {
  return (
    <article className="grid overflow-hidden rounded-3xl border border-border bg-card shadow-sm md:grid-cols-[15rem_minmax(0,1fr)]">
      <IlustracaoEspaco
        espaco={desenho}
        className="aspect-[16/8] w-full md:aspect-auto md:h-full"
      />
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-xl text-base font-extrabold",
              cor,
            )}
          >
            {numero}
          </span>
          <div>
            <h3 className="text-xl font-extrabold leading-tight">{nome}</h3>
            <p className="text-sm text-muted-foreground">{resumo}</p>
          </div>
        </div>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
          {(
            [
              [Clock, "Quando", quando],
              [Users, "Turmas atendidas", turmas],
              [HandHeart, "Quem é responsável", responsavel],
            ] as const
          ).map(([Icone, rotulo, valor]) => (
            <div key={rotulo} className="rounded-2xl bg-muted/50 p-3.5">
              <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <Icone className="size-3.5" aria-hidden /> {rotulo}
              </dt>
              <dd className="mt-1.5 leading-relaxed">{valor}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}

/** Os quatro lugares do intervalo, cada um com a mesma estrutura simples. */
function OsEspacos() {
  return (
    <section id="espacos" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-sun">
        Os quatro lugares
      </p>
      <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
        Onde as crianças ficam e quem cuida delas
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        Cada turma passa 3 dias da semana na própria sala, 1 dia na sala de filme e 1 dia na sala de
        jogos. A sala de repouso é para quem quer dormir.
      </p>
      <div className="mt-6 space-y-4">
        <CartaoEspaco
          numero={1}
          desenho="aula"
          nome="Sala de aula"
          resumo="A turma descansa na própria sala."
          cor="bg-indigo-500 text-white"
          quando={<>3 dias por semana</>}
          turmas={<>Todas as turmas, do 1º ao 5º ano</>}
          responsavel={
            <ul className="space-y-1">
              {TURMAS_PAUSA.map((t) => (
                <li key={t.turma}>
                  <strong>{t.turma}:</strong> {juntarNomes(t.monitores)}
                </li>
              ))}
            </ul>
          }
        />
        <CartaoEspaco
          numero={2}
          desenho="filme"
          nome="Sala de filme"
          resumo="A turma assiste a um filme ou desenho."
          cor="bg-rose-500 text-white"
          quando={<>1 dia por semana para cada turma</>}
          turmas={<ListaDias e="filme" />}
          responsavel={<>Os monitores da própria turma (os mesmos da sala de aula)</>}
        />
        <CartaoEspaco
          numero={3}
          desenho="jogos"
          nome="Sala de jogos"
          resumo="Jogos de tabuleiro e brincadeiras com regras."
          cor="bg-emerald-500 text-white"
          quando={<>Todos os dias, um ano escolar por dia</>}
          turmas={<ListaDias e="jogos" />}
          responsavel={<strong className="text-base">{ESPACOS.jogos.responsavel}</strong>}
        />
        <CartaoEspaco
          numero={4}
          desenho="repouso"
          nome={SALA_REPOUSO.nome}
          resumo="Para o aluno que quer dormir. É opcional."
          cor="bg-sky-500 text-white"
          quando={<>Todos os dias, só para quem quiser</>}
          turmas={<>Alunos de qualquer turma</>}
          responsavel={
            <ul className="space-y-1.5">
              {SALA_REPOUSO.grupos.map((g) => (
                <li key={g.publico}>
                  <strong className="text-base">{g.responsavel}</strong>
                  <span className="block text-muted-foreground">
                    {g.publico}, na {g.local.toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          }
        />
      </div>
    </section>
  );
}

/** Seletor de dia da semana, com "hoje" marcado. */
function SeletorDia({
  dia,
  hoje,
  onDia,
}: {
  dia: DiaUtil;
  hoje: DiaUtil | null;
  onDia: (d: DiaUtil) => void;
}) {
  return (
    <div role="tablist" aria-label="Dia da semana" className="grid grid-cols-5 gap-1.5 sm:gap-2">
      {DIAS.map((d) => (
        <button
          key={d.dia}
          type="button"
          role="tab"
          aria-selected={dia === d.dia}
          onClick={() => onDia(d.dia)}
          className={cn(
            "relative cursor-pointer rounded-2xl border px-1 py-2.5 text-center transition-colors",
            dia === d.dia
              ? "border-sun bg-sun text-sun-foreground"
              : "border-border bg-card text-muted-foreground hover:border-primary/40",
          )}
        >
          <span className="block text-sm font-extrabold sm:hidden">{d.curto}</span>
          <span className="hidden text-sm font-extrabold sm:block">{d.nome}</span>
          {hoje === d.dia ? (
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-emerald-400 px-1.5 text-[9px] font-extrabold uppercase leading-4 text-emerald-950">
              hoje
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

/** Uma turma: os cinco dias da semana, com espaço e responsável. */
function ConsultaPorTurma({
  turma,
  hoje,
  onTurma,
  onDia,
}: {
  turma: string;
  hoje: DiaUtil | null;
  onTurma: (t: string) => void;
  onDia: (d: DiaUtil) => void;
}) {
  const t = TURMAS_PAUSA.find((x) => x.turma === turma) ?? TURMAS_PAUSA[0]!;
  const jogos = DIAS.find((d) => d.dia === JOGOS_POR_ANO[t.ano])!;
  const filme = DIAS.find((d) => d.dia === t.filme)!;
  return (
    <div className="mt-6">
      <div role="tablist" aria-label="Turma" className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {TURMAS_PAUSA.map((x) => (
          <button
            key={x.turma}
            type="button"
            role="tab"
            aria-selected={x.turma === t.turma}
            onClick={() => onTurma(x.turma)}
            className={cn(
              "cursor-pointer rounded-2xl border py-2.5 text-sm font-extrabold transition-colors",
              x.turma === t.turma
                ? "border-sun bg-sun text-sun-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40",
            )}
          >
            {x.turma}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-3xl font-extrabold">{t.turma}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sala de aula em 3 dias · filme na {filme.nome.toLowerCase()} · jogos na{" "}
            {jogos.nome.toLowerCase()}
          </p>
        </div>
        <p className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 ring-1 ring-border">
          <HandHeart className="size-5 shrink-0 text-amber-600 dark:text-sun" aria-hidden />
          <span>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Monitores da turma
            </span>
            <span className="font-extrabold">{juntarNomes(t.monitores)}</span>
          </span>
        </p>
      </div>

      <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {DIAS.map((d) => {
          const es = espacosDoDia(t, d.dia);
          return (
            <li key={d.dia}>
              <button
                type="button"
                onClick={() => onDia(d.dia)}
                className={cn(
                  "flex h-full w-full cursor-pointer overflow-hidden rounded-3xl border text-left transition hover:-translate-y-0.5 sm:flex-col",
                  hoje === d.dia ? "border-sun ring-2 ring-sun/40" : "border-border",
                  es[0] ? VISUAL[es[0]].fundo : "",
                  "bg-gradient-to-b to-transparent",
                )}
              >
                {es[0] ? (
                  <IlustracaoEspaco
                    espaco={es[0]}
                    className="w-28 shrink-0 self-stretch sm:aspect-[16/9] sm:w-full sm:self-auto"
                  />
                ) : null}
                <span className="flex flex-1 flex-col gap-2 p-4">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-extrabold">{d.nome}</span>
                    {hoje === d.dia ? (
                      <span className="rounded-full bg-emerald-400 px-1.5 text-[9px] font-extrabold uppercase leading-4 text-emerald-950">
                        hoje
                      </span>
                    ) : null}
                  </span>
                  <span className="flex flex-wrap gap-1">
                    {es.map((e) => (
                      <Etiqueta key={e} espaco={e} />
                    ))}
                  </span>
                  <span className="mt-auto text-xs text-muted-foreground">
                    {es.map((e) => (
                      <span key={e} className="block">
                        Com <strong className="text-foreground">{responsavel(t, e)}</strong>
                      </span>
                    ))}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
        <Moon className="mt-0.5 size-4 shrink-0 text-sky-700 dark:text-sky-300" aria-hidden />
        <span>
          Em qualquer dia, quem quiser dormir pode ir à {SALA_REPOUSO.nome.toLowerCase()}:{" "}
          {SALA_REPOUSO.grupos
            .map(
              (g) => `${g.publico.toLowerCase()} na ${g.local.toLowerCase()} com ${g.responsavel}`,
            )
            .join("; ")}
          .
        </span>
      </p>
    </div>
  );
}

/**
 * Versão para o PDF: uma folha A4 deitada, fundo branco, com o quadro da
 * semana e os monitores. Fica escondida na tela; na impressão, só ela aparece.
 */
function VersaoImpressa() {
  return (
    <div id="entre-turnos-impressao" className="hidden bg-white text-slate-900 print:block">
      <style>{`
        @page { size: A4 landscape; margin: 10mm; }
        @media print {
          body > *:not(#entre-turnos-impressao) { display: none !important; }
          body { background: #fff !important; }
          #entre-turnos-impressao { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <header className="flex items-end justify-between border-b-2 border-slate-900 pb-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            {ESCOLA}
          </p>
          <h1 className="text-3xl font-extrabold leading-tight">Entre Turnos</h1>
          <p className="text-xs text-slate-600">
            Onde cada turma fica no intervalo das {HORARIO.inicio} às {HORARIO.fim}, depois do
            almoço, e quem acompanha cada uma.
          </p>
        </div>
        <div className="flex gap-2">
          {ORDEM.map((e) => (
            <div key={e} className="w-28 overflow-hidden rounded-lg border border-slate-300">
              <IlustracaoEspaco espaco={e} className="aspect-[16/10] w-full" />
              <p className="px-1.5 py-0.5 text-center text-[10px] font-bold">{ESPACOS[e].nome}</p>
            </div>
          ))}
        </div>
      </header>

      <table className="mt-3 w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-slate-900 text-white">
            <th className="border border-slate-400 px-2 py-1.5 text-left">Turma</th>
            {DIAS.map((d) => (
              <th key={d.dia} className="border border-slate-400 px-2 py-1.5">
                {d.nome}
              </th>
            ))}
            <th className="border border-slate-400 px-2 py-1.5 text-left">Monitores</th>
          </tr>
        </thead>
        <tbody>
          {TURMAS_PAUSA.map((t) => (
            <tr key={t.turma}>
              <th className="border border-slate-400 px-2 py-1 text-left text-sm">{t.turma}</th>
              {DIAS.map((d) => {
                const es = espacosDoDia(t, d.dia);
                return (
                  <td
                    key={d.dia}
                    className="border border-slate-400 px-2 py-1 text-center font-semibold"
                    style={{
                      background:
                        es.length === 1
                          ? VISUAL[es[0]!].impresso
                          : es.length
                            ? "#fef3c7"
                            : undefined,
                    }}
                  >
                    {es.map((e) => ESPACOS[e].nome).join(" + ")}
                  </td>
                );
              })}
              <td className="border border-slate-400 px-2 py-1">{juntarNomes(t.monitores)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 grid grid-cols-3 gap-3 text-[10px] leading-snug">
        {ORDEM.map((e) => (
          <div key={e} className="rounded-md p-2" style={{ background: VISUAL[e].impresso }}>
            <p className="text-[11px] font-extrabold">
              {ESPACOS[e].nome} · {ESPACOS[e].dias}
            </p>
            <p>{ESPACOS[e].texto}</p>
            {ESPACOS[e].responsavel ? (
              <p className="mt-1 font-bold">Responsável: {ESPACOS[e].responsavel}</p>
            ) : null}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[9px] text-slate-500">
        Sala de jogos ({ESPACOS.jogos.responsavel}): segunda 1º ano, terça 2º, quarta 3º, quinta 4º
        e sexta 5º ano. Nos outros dias, a turma fica com os seus monitores. {SALA_REPOUSO.nome}{" "}
        (opcional, todos os dias, para quem quer dormir):{" "}
        {SALA_REPOUSO.grupos
          .map((g) => `${g.publico.toLowerCase()} na ${g.local.toLowerCase()} com ${g.responsavel}`)
          .join("; ")}
        .
        {CHOQUES.length
          ? ` Dias com dois espaços (a confirmar): ${CHOQUES.map((c) => `${c.turma} ${c.dia}`).join("; ")}.`
          : ""}
      </p>
    </div>
  );
}
