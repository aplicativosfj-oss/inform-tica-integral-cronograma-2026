import {
  AlertTriangle,
  BedDouble,
  CalendarDays,
  Clapperboard,
  Clock,
  Dices,
  FileDown,
  HandHeart,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { CompartilharRedes } from "@/components/school/pausa/compartilhar-redes";
import { IlustracaoEspaco } from "@/components/school/pausa/ilustracoes";
import {
  DIAS,
  ESCOLA,
  ESPACOS,
  HORARIO,
  JOGOS_POR_ANO,
  TOTAL_MONITORES,
  TURMAS_PAUSA,
  diaUtilDeHoje,
  espacosDoDia,
  juntarNomes,
  turmasNoDia,
  type DiaUtil,
  type Espaco,
} from "@/lib/mapa-da-pausa";
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
    texto: "text-indigo-300",
    fundo: "from-indigo-500/25",
    impresso: "#e0e7ff",
  },
  filme: {
    Icone: Clapperboard,
    etiqueta: "bg-rose-500 text-white",
    borda: "border-rose-400/50",
    texto: "text-rose-300",
    fundo: "from-rose-500/25",
    impresso: "#ffe4e6",
  },
  jogos: {
    Icone: Dices,
    etiqueta: "bg-emerald-500 text-white",
    borda: "border-emerald-400/50",
    texto: "text-emerald-300",
    fundo: "from-emerald-500/25",
    impresso: "#d1fae5",
  },
};

const ORDEM: Espaco[] = ["aula", "filme", "jogos"];
const CAMINHO = "/mapa-da-pausa";
const TEXTO_COMPARTILHAR =
  "Mapa da Pausa: onde cada turma da Escola Dr. Eiraldo fica no intervalo das 11h às 13h e quem cuida dela.";

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

/** Dia útil de hoje, só no navegador (no servidor o "hoje" pode ser outro). */
function useHoje() {
  const [hoje, setHoje] = useState<DiaUtil | null>(null);
  useEffect(() => setHoje(diaUtilDeHoje()), []);
  return hoje;
}

/** Choques entre a escala da sala de jogos e a do cronograma (dia com dois espaços). */
const CHOQUES = TURMAS_PAUSA.flatMap((t) =>
  DIAS.filter((d) => espacosDoDia(t, d.dia).length > 1).map((d) => ({
    turma: t.turma,
    dia: d.nome,
  })),
);

/**
 * Página pública "Mapa da Pausa": o intervalo das 11h às 13h explicado para
 * famílias, equipe e comunidade. Abre com os três espaços desenhados, mostra
 * onde cada turma está no dia escolhido (hoje, por padrão), o quadro da
 * semana inteira e quem acompanha cada turma. O PDF sai de uma versão
 * própria para impressão, em uma folha A4 deitada.
 */
export function MapaDaPausa() {
  const hoje = useHoje();
  const [dia, setDia] = useState<DiaUtil>(1);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);
  useEffect(() => {
    if (hoje) setDia(hoje);
  }, [hoje]);

  const doDia = turmasNoDia(dia);
  const nomeDia = DIAS.find((d) => d.dia === dia)!.nome;

  return (
    <div className="dark bg-ink text-white">
      {/* ------------------------------------------------------------ abertura */}
      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="fundo-pixel absolute inset-0 -z-10 opacity-20" />
        <div
          aria-hidden
          className="absolute -right-40 -top-40 -z-10 size-[32rem] rounded-full bg-sun/20 blur-3xl"
        />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-10 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-center">
          <div className="hero-subir">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-sun backdrop-blur">
              <Clock className="size-3.5" aria-hidden /> Das {HORARIO.inicio} às {HORARIO.fim} ·
              depois do almoço
            </div>
            <h1 className="mt-4 text-balance text-[clamp(2.4rem,6vw,4rem)] font-extrabold leading-[1.02] tracking-tight">
              Mapa da <span className="text-sun">Pausa</span>
            </h1>
            <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-white/80 sm:text-lg">
              Onde cada turma descansa, vai ao cinema ou brinca no intervalo do almoço, e quem cuida
              dela em cada dia. Um guia para famílias, professores, mediadores, cuidadores, gestão e
              comunidade.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <a
                href="#hoje"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-sun px-4 text-sm font-bold text-sun-foreground shadow-lg shadow-sun/20 transition-transform hover:-translate-y-0.5"
              >
                <CalendarDays className="size-4" aria-hidden /> Ver onde cada turma está hoje
              </a>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                <FileDown className="size-4" aria-hidden /> Baixar PDF
              </button>
              <CompartilharRedes
                caminho={CAMINHO}
                texto={TEXTO_COMPARTILHAR}
                className="text-white/60 hover:bg-white/10 hover:text-white"
              />
            </div>
            <dl className="mt-8 grid max-w-lg grid-cols-3 gap-2.5">
              {[
                { Icone: Users, valor: TURMAS_PAUSA.length, rotulo: "turmas" },
                { Icone: CalendarDays, valor: 3, rotulo: "espaços" },
                { Icone: HandHeart, valor: TOTAL_MONITORES, rotulo: "monitores" },
              ].map(({ Icone, valor, rotulo }) => (
                <div
                  key={rotulo}
                  className="rounded-2xl border border-white/15 bg-white/[0.06] px-3 py-2.5 backdrop-blur"
                >
                  <Icone className="size-4 text-sun" aria-hidden />
                  <dd className="mt-1 text-2xl font-extrabold tabular-nums">{valor}</dd>
                  <dt className="text-xs text-white/60">{rotulo}</dt>
                </div>
              ))}
            </dl>
          </div>

          {/* três desenhos em leque */}
          <div
            aria-hidden
            className="relative mx-auto hidden h-[26rem] w-full max-w-[26rem] sm:block"
          >
            {(
              [
                ["aula", "left-0 top-0 rotate-[-6deg]"],
                ["filme", "right-0 top-16 rotate-[5deg]"],
                ["jogos", "bottom-0 left-6 rotate-[-2deg]"],
              ] as const
            ).map(([e, pos]) => (
              <figure
                key={e}
                className={cn(
                  "absolute w-60 overflow-hidden rounded-2xl border-4 border-white/90 bg-white shadow-2xl transition-transform hover:z-10 hover:rotate-0 hover:scale-105",
                  pos,
                )}
              >
                <IlustracaoEspaco espaco={e} className="aspect-[16/10] w-full" />
                <figcaption className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800">
                  {(() => {
                    const I = VISUAL[e].Icone;
                    return <I className="size-3.5" />;
                  })()}
                  {ESPACOS[e].nome}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- como funciona a semana */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Como funciona a semana
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
          Toda turma passa o intervalo em três lugares diferentes ao longo da semana. Assim o
          descanso não fica cansativo, e cada espaço recebe poucas turmas por vez.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          {(["aula", "aula", "aula", "filme", "jogos"] as Espaco[]).map((e, i) => (
            <Etiqueta key={i} espaco={e} />
          ))}
          <span className="ml-1 text-sm text-white/70">
            = <strong className="text-white">3 dias</strong> de repouso na sala,{" "}
            <strong className="text-white">1</strong> de filme e{" "}
            <strong className="text-white">1</strong> de jogos
          </span>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {ORDEM.map((e) => {
            const v = VISUAL[e];
            return (
              <article
                key={e}
                className={cn(
                  "overflow-hidden rounded-3xl border bg-gradient-to-b to-transparent",
                  v.borda,
                  v.fundo,
                )}
              >
                <IlustracaoEspaco espaco={e} className="aspect-[16/10] w-full" />
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <Etiqueta espaco={e} />
                    <span className="text-xs font-semibold text-white/60">{ESPACOS[e].dias}</span>
                  </div>
                  <h3 className="mt-3 text-xl font-extrabold">{ESPACOS[e].chamada}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/75">{ESPACOS[e].texto}</p>
                  {e === "jogos" ? (
                    <ul className="mt-3 grid grid-cols-5 gap-1 text-center text-[11px]">
                      {DIAS.map((d) => (
                        <li key={d.dia} className="rounded-lg bg-white/[0.07] px-1 py-1.5">
                          <span className="block font-bold text-emerald-300">{d.curto}</span>
                          {Object.entries(JOGOS_POR_ANO)
                            .filter(([, dj]) => dj === d.dia)
                            .map(([ano]) => `${ano}º ano`)
                            .join(", ")}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------- o dia */}
      <section id="hoje" className="scroll-mt-20 border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Onde está cada turma{hoje === dia ? " hoje" : ""}
              </h2>
              <p className="mt-1 text-sm text-white/70">
                {nomeDia}, das {HORARIO.inicio} às {HORARIO.fim}. Toque em outro dia para ver a
                escala.
              </p>
            </div>
            <div
              role="tablist"
              aria-label="Dia da semana"
              className="flex gap-1 rounded-full bg-white/10 p-1"
            >
              {DIAS.map((d) => (
                <button
                  key={d.dia}
                  type="button"
                  role="tab"
                  aria-selected={dia === d.dia}
                  onClick={() => setDia(d.dia)}
                  className={cn(
                    "relative cursor-pointer rounded-full px-3 py-1.5 text-sm font-bold transition-colors sm:px-4",
                    dia === d.dia ? "bg-sun text-sun-foreground" : "text-white/70 hover:text-white",
                  )}
                >
                  {d.curto}
                  {hoje === d.dia ? (
                    <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-400 px-1.5 text-[9px] font-extrabold uppercase leading-4 text-emerald-950">
                      hoje
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {ORDEM.map((e) => {
              const v = VISUAL[e];
              const lista = doDia[e];
              return (
                <div
                  key={e}
                  className={cn(
                    "rounded-3xl border bg-gradient-to-b to-transparent p-4",
                    v.borda,
                    v.fundo,
                  )}
                >
                  <div className="flex items-center gap-3">
                    <IlustracaoEspaco espaco={e} className="h-14 w-20 shrink-0 rounded-xl" />
                    <div>
                      <h3 className="font-extrabold">{ESPACOS[e].nome}</h3>
                      <p className="text-xs text-white/60">
                        {lista.length} {lista.length === 1 ? "turma" : "turmas"}
                      </p>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {lista.map((t) => (
                      <li
                        key={t.turma}
                        className="flex items-center gap-3 rounded-2xl bg-ink/60 px-3 py-2.5 ring-1 ring-white/10"
                      >
                        <span
                          className={cn(
                            "grid size-10 shrink-0 place-items-center rounded-xl text-sm font-extrabold",
                            v.etiqueta,
                          )}
                        >
                          {t.turma}
                        </span>
                        <span className="min-w-0 text-sm">
                          <span className="block text-[11px] uppercase tracking-wider text-white/50">
                            Monitores
                          </span>
                          <span className="font-semibold">{juntarNomes(t.monitores)}</span>
                        </span>
                      </li>
                    ))}
                    {lista.length === 0 ? (
                      <li className="rounded-2xl border border-dashed border-white/15 px-3 py-4 text-center text-sm text-white/50">
                        Nenhuma turma neste dia
                      </li>
                    ) : null}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- quadro da semana */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Quadro da semana</h2>
        <p className="mt-1 text-sm text-white/70">
          Cada linha é uma turma; cada coluna, um dia. Os monitores acompanham a sua turma.
        </p>

        {CHOQUES.length ? (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            Atenção: {CHOQUES.map((c) => `${c.turma} na ${c.dia.toLowerCase()}`).join("; ")} aparece
            em dois espaços ao mesmo tempo. A coordenação vai confirmar.
          </p>
        ) : null}

        {/* computador: tabela */}
        <div className="mt-5 hidden overflow-hidden rounded-3xl border border-white/10 md:block">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.06] text-left text-xs uppercase tracking-wider text-white/60">
              <tr>
                <th className="px-4 py-3 font-bold">Turma</th>
                {DIAS.map((d) => (
                  <th
                    key={d.dia}
                    className={cn(
                      "px-2 py-3 text-center font-bold",
                      hoje === d.dia && "bg-sun/15 text-sun",
                    )}
                  >
                    {d.curto}
                    {hoje === d.dia ? " · hoje" : ""}
                  </th>
                ))}
                <th className="px-4 py-3 font-bold">Monitores</th>
              </tr>
            </thead>
            <tbody>
              {TURMAS_PAUSA.map((t, i) => (
                <tr
                  key={t.turma}
                  className={cn("border-t border-white/10", i % 2 && "bg-white/[0.02]")}
                >
                  <th scope="row" className="px-4 py-2.5 text-left text-base font-extrabold">
                    {t.turma}
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
                  <td className="px-4 py-2.5 font-medium text-white/85">
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
            <li key={t.turma} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-lg font-extrabold">{t.turma}</span>
                <span className="truncate text-xs text-white/60">{juntarNomes(t.monitores)}</span>
              </div>
              <div className="mt-2.5 grid grid-cols-5 gap-1">
                {DIAS.map((d) => (
                  <div
                    key={d.dia}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg py-1.5",
                      hoje === d.dia ? "bg-sun/15 ring-1 ring-sun/50" : "bg-white/[0.05]",
                    )}
                  >
                    <span className="text-[10px] font-bold text-white/60">{d.curto}</span>
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
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap gap-2">
          {ORDEM.map((e) => (
            <Etiqueta key={e} espaco={e} />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------ quem cuida */}
      <section className="border-t border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Quem cuida de cada turma
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-white/70">
            Os monitores ficam com a sua turma durante as duas horas do intervalo. Em caso de
            dúvida, procure a coordenação da escola.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {TURMAS_PAUSA.map((t) => (
              <li key={t.turma} className="rounded-2xl border border-white/10 bg-ink/60 p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-sun">
                  {t.turma}
                </span>
                <ul className="mt-2 space-y-1.5">
                  {t.monitores.map((m) => (
                    <li key={m} className="flex items-center gap-2 text-sm font-semibold">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-extrabold">
                        {m[0]}
                      </span>
                      {m}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-xs text-white/45">
            Fonte: Cronograma de Atendimento às turmas no período de repouso após o almoço e escala
            da sala de jogos · {ESCOLA}.
          </p>
        </div>
      </section>

      {montado ? createPortal(<VersaoImpressa />, document.body) : null}
    </div>
  );
}

/**
 * Versão para o PDF: uma folha A4 deitada, fundo branco, com o quadro da
 * semana e os monitores. Fica escondida na tela; na impressão, só ela aparece.
 */
function VersaoImpressa() {
  return (
    <div id="mapa-pausa-impressao" className="hidden bg-white text-slate-900 print:block">
      <style>{`
        @page { size: A4 landscape; margin: 10mm; }
        @media print {
          body > *:not(#mapa-pausa-impressao) { display: none !important; }
          body { background: #fff !important; }
          #mapa-pausa-impressao { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <header className="flex items-end justify-between border-b-2 border-slate-900 pb-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            {ESCOLA}
          </p>
          <h1 className="text-3xl font-extrabold leading-tight">Mapa da Pausa</h1>
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
          </div>
        ))}
      </div>
      <p className="mt-2 text-[9px] text-slate-500">
        Sala de jogos: segunda 1º ano, terça 2º, quarta 3º, quinta 4º e sexta 5º ano.
        {CHOQUES.length
          ? ` Dias com dois espaços (a confirmar): ${CHOQUES.map((c) => `${c.turma} ${c.dia}`).join("; ")}.`
          : ""}
      </p>
    </div>
  );
}
