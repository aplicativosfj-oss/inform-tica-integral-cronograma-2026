import {
  AlertTriangle,
  ArrowRight,
  BedDouble,
  CalendarDays,
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
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { CompartilharRedes } from "@/components/school/pausa/compartilhar-redes";
import { IlustracaoEspaco } from "@/components/school/pausa/ilustracoes";
import { AvisoDiaEncerrado, SeloIntervalo } from "@/components/school/pausa/status-intervalo";
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
  "Entre Turnos: onde cada turma da Escola Dr. Eiraldo fica no intervalo das 11h às 13h e quem cuida dela.";

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

/** Os quatro passos da explicação "Como funciona". */
const PASSOS: {
  desenho: Espaco | "repouso";
  titulo: string;
  frequencia: string;
  texto: string;
  quem: string;
  cor: string;
}[] = [
  {
    desenho: "aula",
    titulo: "Descanso na sala",
    frequencia: "3 dias por semana",
    texto: "A turma descansa na própria sala, num ambiente calmo.",
    quem: "Monitores da turma",
    cor: "text-indigo-700 dark:text-indigo-300",
  },
  {
    desenho: "filme",
    titulo: "Sala de filme",
    frequencia: "1 dia por semana",
    texto: "A turma assiste a um filme ou desenho.",
    quem: "Monitores da turma",
    cor: "text-rose-700 dark:text-rose-300",
  },
  {
    desenho: "jogos",
    titulo: "Sala de jogos",
    frequencia: "1 dia por semana",
    texto: "Cada ano escolar tem o seu dia: jogos de regras, raciocínio e convívio.",
    quem: ESPACOS.jogos.responsavel ?? "",
    cor: "text-emerald-700 dark:text-emerald-300",
  },
  {
    desenho: "repouso",
    titulo: SALA_REPOUSO.nome,
    frequencia: "Opcional, todo dia",
    texto: "Para quem realmente quer dormir. Não faz parte da escala.",
    quem: SALA_REPOUSO.grupos
      .map((g) => `${g.responsavel} (${g.publico.toLowerCase()})`)
      .join(" · "),
    cor: "text-sky-700 dark:text-sky-300",
  },
];

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
  const [modo, setModo] = useState<Modo>("dia");
  const [dia, setDia] = useState<DiaUtil>(1);
  const [turma, setTurma] = useState<string>(TURMAS_PAUSA[0]!.turma);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);
  // Leva a consulta para hoje e, depois das 13h, para o próximo dia letivo.
  const foco = m?.diaEmFoco;
  useEffect(() => {
    if (foco) setDia(foco);
  }, [foco]);
  const encerrado = !!m && (m.fase === "encerrado" || m.fase === "fim-de-semana");

  function abrir(novo: { modo: Modo; dia?: DiaUtil; turma?: string }) {
    setModo(novo.modo);
    if (novo.dia) setDia(novo.dia);
    if (novo.turma) setTurma(novo.turma);
    document.getElementById("consulta")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
        <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-10 pt-10 sm:px-6 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center">
          <div className="hero-subir">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-sun">
                <Clock className="size-3.5" aria-hidden /> {HORARIO.inicio} às {HORARIO.fim} ·
                depois do almoço
              </span>
              {m ? <SeloIntervalo m={m} /> : null}
            </div>
            <h1 className="mt-4 text-balance text-[clamp(2.4rem,6vw,4rem)] font-extrabold leading-[1.02] tracking-tight">
              Entre <span className="text-sun">Turnos</span>
            </h1>
            <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-white/80 sm:text-lg">
              Entre a aula da manhã e a da tarde, as crianças têm duas horas de intervalo. Aqui você
              descobre <strong className="text-white">onde cada turma fica</strong> em cada dia e{" "}
              <strong className="text-white">quem cuida dela</strong>.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <a
                href="#consulta"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-sun px-5 text-sm font-bold text-sun-foreground shadow-lg shadow-sun/20 transition-transform hover:-translate-y-0.5"
              >
                <Search className="size-4" aria-hidden /> Consultar por dia ou por turma
              </a>
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

      {/* ------------------------------------------------------- como funciona */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-sun">
          Como funciona
        </p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Cada turma passa por três lugares na semana
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Três dias de descanso na própria sala, um dia de filme e um dia de jogos. Quem quiser
          dormir pode ir à sala de repouso em qualquer dia.
        </p>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PASSOS.map((p, i) => (
            <li
              key={p.titulo}
              className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card"
            >
              <IlustracaoEspaco espaco={p.desenho} className="aspect-[16/9] w-full" />
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="grid size-7 place-items-center rounded-full bg-muted text-xs font-extrabold">
                    {i + 1}
                  </span>
                  <span className={cn("text-xs font-bold", p.cor)}>{p.frequencia}</span>
                </div>
                <h3 className="mt-3 text-lg font-extrabold">{p.titulo}</h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {p.texto}
                </p>
                <p className="mt-3 flex items-start gap-2 border-t border-border pt-3 text-sm">
                  <HandHeart className={cn("mt-0.5 size-4 shrink-0", p.cor)} aria-hidden />
                  <span className="font-semibold">{p.quem}</span>
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------------------------------------ consulta */}
      <section id="consulta" className="scroll-mt-20 border-y border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          {encerrado && m ? (
            <div className="mb-8">
              <AvisoDiaEncerrado m={m} />
            </div>
          ) : null}

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-sun">
                Consulte
              </p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                {modo === "dia" ? "O que acontece em cada dia" : "A semana de cada turma"}
              </h2>
            </div>
            <div
              role="tablist"
              aria-label="Forma de consulta"
              className="grid grid-cols-2 rounded-2xl bg-muted p-1 text-sm font-bold"
            >
              {(
                [
                  ["dia", CalendarDays, "Por dia"],
                  ["turma", Users, "Por turma"],
                ] as const
              ).map(([v, Icone, rotulo]) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={modo === v}
                  onClick={() => setModo(v)}
                  className={cn(
                    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 transition-colors",
                    modo === v
                      ? "bg-sun text-sun-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icone className="size-4" aria-hidden /> {rotulo}
                </button>
              ))}
            </div>
          </div>

          {modo === "dia" ? (
            <ConsultaPorDia
              dia={dia}
              hoje={hoje}
              rotuloProximo={
                encerrado && m && dia === m.proximo
                  ? m.proximoEhAmanha
                    ? "amanhã"
                    : "próximo dia de aula"
                  : null
              }
              onDia={setDia}
              onTurma={(t) => abrir({ modo: "turma", turma: t })}
            />
          ) : (
            <ConsultaPorTurma
              turma={turma}
              hoje={hoje}
              onTurma={setTurma}
              onDia={(d) => abrir({ modo: "dia", dia: d })}
            />
          )}
        </div>
      </section>

      {/* -------------------------------------------------- quadro da semana */}
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
            Atenção: {CHOQUES.map((c) => `${c.turma} na ${c.dia.toLowerCase()}`).join("; ")} aparece
            em dois espaços ao mesmo tempo. A coordenação vai confirmar.
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
                <tr key={t.turma} className={cn("border-t border-border", i % 2 && "bg-muted/30")}>
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
                      <span className="text-[10px] font-bold text-muted-foreground">{d.curto}</span>
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

      {/* -------------------------------------------------------------- equipe */}
      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-sun">
            Equipe
          </p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Quem cuida das crianças
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Cada turma tem os seus monitores. A sala de jogos e a sala de repouso têm responsáveis
            próprios. Em caso de dúvida, procure a coordenação da escola.
          </p>

          <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Espaços com responsável próprio
          </h3>
          <ul className="mt-3 grid gap-3 md:grid-cols-3">
            {[
              {
                desenho: "jogos" as const,
                rotulo: "Sala de jogos",
                detalhe: "um ano escolar por dia",
                nome: ESPACOS.jogos.responsavel,
                cor: "border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
              },
              ...SALA_REPOUSO.grupos.map((g) => ({
                desenho: "repouso" as const,
                rotulo: `Repouso · ${g.publico.toLowerCase()}`,
                detalhe: g.local.toLowerCase(),
                nome: g.responsavel,
                cor: "border-sky-400/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
              })),
            ].map((c) => (
              <li
                key={c.rotulo}
                className={cn("flex items-center gap-3 rounded-2xl border p-4", c.cor)}
              >
                <IlustracaoEspaco espaco={c.desenho} className="h-12 w-16 shrink-0 rounded-lg" />
                <span>
                  <span className="block text-xs font-bold uppercase tracking-wider">
                    {c.rotulo}
                  </span>
                  <span className="block text-base font-extrabold text-foreground">{c.nome}</span>
                  <span className="block text-xs text-muted-foreground">{c.detalhe}</span>
                </span>
              </li>
            ))}
          </ul>

          <h3 className="mt-8 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Monitores de cada turma
          </h3>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {TURMAS_PAUSA.map((t) => (
              <li key={t.turma}>
                <button
                  type="button"
                  onClick={() => abrir({ modo: "turma", turma: t.turma })}
                  className="h-full w-full cursor-pointer rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-sun/50"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-sun">
                    {t.turma}
                  </span>
                  <span className="mt-1.5 block space-y-0.5 text-sm font-semibold">
                    {t.monitores.map((n) => (
                      <span key={n} className="block">
                        {n}
                      </span>
                    ))}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-xs text-muted-foreground">
            Fonte: Cronograma de Atendimento às turmas no período de repouso após o almoço e escala
            da sala de jogos · {ESCOLA}.
          </p>
        </div>
      </section>

      {montado ? createPortal(<VersaoImpressa />, document.body) : null}
    </div>
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

/** Um dia: quem vai para cada espaço e quem é responsável. */
function ConsultaPorDia({
  dia,
  hoje,
  rotuloProximo,
  onDia,
  onTurma,
}: {
  dia: DiaUtil;
  hoje: DiaUtil | null;
  rotuloProximo: string | null;
  onDia: (d: DiaUtil) => void;
  onTurma: (t: string) => void;
}) {
  const doDia = turmasNoDia(dia);
  const jogosAno = Object.entries(JOGOS_POR_ANO).find(([, d]) => d === dia)?.[0];
  return (
    <div className="mt-6">
      <SeletorDia dia={dia} hoje={hoje} onDia={onDia} />
      <p className="mt-5 text-sm text-muted-foreground">
        <strong className="text-foreground">
          {nomeDoDia(dia)}
          {hoje === dia ? " (hoje)" : rotuloProximo ? ` (${rotuloProximo})` : ""}
        </strong>
        , das {HORARIO.inicio} às {HORARIO.fim}
        {jogosAno ? ` · dia do ${jogosAno}º ano na sala de jogos` : ""}. Toque numa turma para ver a
        semana dela.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {ORDEM.map((e) => {
          const v = VISUAL[e];
          const lista = doDia[e];
          const proprio = ESPACOS[e].responsavel;
          return (
            <div
              key={e}
              className={cn(
                "flex flex-col rounded-3xl border bg-gradient-to-b to-transparent p-4",
                v.borda,
                v.fundo,
              )}
            >
              <div className="flex items-center gap-3">
                <IlustracaoEspaco espaco={e} className="h-14 w-20 shrink-0 rounded-xl" />
                <div className="min-w-0">
                  <h3 className="font-extrabold">{ESPACOS[e].nome}</h3>
                  <p className="text-xs text-muted-foreground">
                    {lista.length} {lista.length === 1 ? "turma" : "turmas"}
                  </p>
                </div>
              </div>
              {proprio && lista.length ? (
                <p className="mt-4 flex items-center gap-2 rounded-2xl bg-muted px-3 py-2.5 text-sm">
                  <HandHeart className={cn("size-4 shrink-0", v.texto)} aria-hidden />
                  <span>
                    Responsável: <strong>{proprio}</strong>
                  </span>
                </p>
              ) : null}
              <ul className={cn("space-y-2", proprio ? "mt-2" : "mt-4")}>
                {lista.map((t) => (
                  <li key={t.turma}>
                    <button
                      type="button"
                      onClick={() => onTurma(t.turma)}
                      className="group flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-card px-3 py-2.5 text-left ring-1 ring-border transition hover:ring-primary/40"
                    >
                      <span
                        className={cn(
                          "grid size-10 shrink-0 place-items-center rounded-xl text-sm font-extrabold",
                          v.etiqueta,
                        )}
                      >
                        {t.turma}
                      </span>
                      <span className="min-w-0 flex-1 text-sm">
                        <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">
                          {proprio ? `${t.ano}º ano` : "Monitores"}
                        </span>
                        <span className="block truncate font-semibold">
                          {proprio ? `Turma ${t.turma.slice(-1)}` : juntarNomes(t.monitores)}
                        </span>
                      </span>
                      <ArrowRight
                        className="size-4 shrink-0 text-muted-foreground/60 transition group-hover:translate-x-0.5 group-hover:text-foreground"
                        aria-hidden
                      />
                    </button>
                  </li>
                ))}
                {lista.length === 0 ? (
                  <li className="rounded-2xl border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
                    Nenhuma turma neste dia
                  </li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </div>

      <FaixaRepouso />
    </div>
  );
}

/** Sala de repouso: aberta todos os dias, fora da escala. */
function FaixaRepouso() {
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-3xl border border-sky-400/30 bg-sky-500/10 p-4 sm:flex-row sm:items-center">
      <IlustracaoEspaco espaco="repouso" className="h-14 w-20 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-extrabold">
          <Moon className="size-4 text-sky-700 dark:text-sky-300" aria-hidden /> {SALA_REPOUSO.nome}
          <span className="rounded-full bg-sky-400/20 px-2 py-0.5 text-[11px] font-bold text-sky-700 dark:text-sky-200">
            opcional · todo dia
          </span>
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Para o aluno de qualquer turma que realmente queira dormir.
        </p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {SALA_REPOUSO.grupos.map((g) => (
          <li key={g.publico} className="rounded-2xl bg-card px-3 py-2 text-sm ring-1 ring-border">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
              {g.publico} · {g.local}
            </span>
            <span className="font-semibold">{g.responsavel}</span>
          </li>
        ))}
      </ul>
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
