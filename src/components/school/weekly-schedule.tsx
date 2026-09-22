import { CalendarClock, Check, ChevronLeft, ChevronRight, RotateCcw, Users2 } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PreviaAlunosDialog } from "@/components/school/previa-alunos-dialog";
import { useAppStore } from "@/lib/app-store";
import { useAuth } from "@/lib/auth-store";
import { useConfirmar } from "@/lib/confirm-store";
import { fetchPresencasRange } from "@/lib/presencas";
import {
  aplicarExcecoesDeData,
  buildDailySlots,
  buildSubBlocos,
  buildWeeklySchedule,
  currentWeekdayLabel,
  getWeekIndex,
  reprogramacoesParaData,
  suspensaoKey,
  toDateKey,
  agoraNaEscola,
} from "@/lib/schedule-engine";
import { serieClasses } from "@/lib/serie-colors";
import type { Assignment, ScheduleConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Situação de uma célula da grade numa data real da semana. */
type EstadoCelula = "normal" | "agora" | "realizada" | "suspensa" | "reposicao";

interface Celula {
  assignment: Assignment;
  estado: EstadoCelula;
  data: Date;
  /** Texto para o público: motivo da suspensão, origem da reposição etc. */
  detalhe?: string | undefined;
  /** Alguma rodada da aula foi suspensa (a aula em si aconteceu). */
  rodadaSuspensa?: boolean;
}

function segundaDaSemana(base: Date, semanas: number): Date {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + semanas * 7);
  const dia = d.getDay();
  d.setDate(d.getDate() + (dia === 0 ? -6 : 1 - dia));
  return d;
}

function dataCurta(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function toMinutes(hhmm: string): number {
  const parts = hhmm.split(":");
  return Number(parts[0] ?? 0) * 60 + Number(parts[1] ?? 0);
}

/**
 * The whole week's lab schedule at a glance, built live from the store (not
 * a static image) so it never goes stale when turmas, hours or breaks
 * change in Configurações. A real HTML table — sticky time column, gentle
 * horizontal scroll with the next day peeking at the edge — instead of a
 * fixed-size SVG poster that ignored dark mode and needed a "swipe" hint to
 * be usable on a phone.
 */
export function WeeklySchedule() {
  const { turmas, config, setSlotOverride } = useAppStore();
  const { isAuthenticated } = useAuth();
  const confirmar = useConfirmar();
  const [editando, setEditando] = useState<Assignment | null>(null);
  const [previsto, setPrevisto] = useState<Assignment | null>(null);
  const [mistoSelecionado, setMistoSelecionado] = useState<Assignment | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null);

  // "Hoje" and the week's rotation offset depend on the client's clock,
  // which can differ from the server render — only applied after mount to
  // avoid a hydration mismatch (both start at their week-0/no-highlight
  // state, matching the server-rendered markup, then correct themselves).
  const [agora, setAgora] = useState<Date | null>(null);
  const [semanaOffset, setSemanaOffset] = useState(0);
  useEffect(() => {
    setAgora(agoraNaEscola());
    const id = window.setInterval(() => setAgora(agoraNaEscola()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // A grade mostra uma semana real (com datas), e não um modelo fixo: assim
  // acompanha o rodízio de horários, as suspensões e as reposições.
  const segunda = useMemo(
    () => (agora ? segundaDaSemana(agora, semanaOffset) : null),
    [agora, semanaOffset],
  );
  const weekIndex = segunda ? getWeekIndex(segunda) : 0;
  const hojeKey = agora ? toDateKey(agora) : "";
  const datasDosDias = useMemo(() => {
    const mapa = new Map<string, Date>();
    if (!segunda) return mapa;
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(segunda.getFullYear(), segunda.getMonth(), segunda.getDate() + i);
      mapa.set(currentWeekdayLabel(d), d);
    }
    return mapa;
  }, [segunda]);
  const todayLabel = agora && semanaOffset === 0 ? currentWeekdayLabel(agora) : "";

  // Aulas com chamada registrada na semana (para marcar como realizadas).
  const [realizadas, setRealizadas] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!segunda) return;
    const fim = new Date(segunda.getFullYear(), segunda.getMonth(), segunda.getDate() + 6);
    let cancelado = false;
    fetchPresencasRange(toDateKey(segunda), toDateKey(fim))
      .then((rows) => {
        if (cancelado) return;
        setRealizadas(
          new Set(rows.filter((r) => r.status !== "faltou").map((r) => `${r.turmaId}|${r.data}`)),
        );
      })
      .catch(() => !cancelado && setRealizadas(new Set()));
    return () => {
      cancelado = true;
    };
  }, [segunda]);

  const { linhas, colunas, series, pausas, lookup, temMisto } = useMemo(() => {
    const dailySlots = buildDailySlots(config);
    const assignments = buildWeeklySchedule(turmas, config, weekIndex);
    const byDayAndSlot = new Map<string, Celula>();
    const nome = (id: string) => {
      const t = turmas.find((x) => x.id === id);
      return t ? `${t.serie} "${t.letra}"` : "outra turma";
    };
    const agoraHHMM = agora ? agora.toTimeString().slice(0, 5) : "";
    for (const dia of config.diasSemana) {
      const data = datasDosDias.get(dia);
      if (!data) continue;
      const dataKey = toDateKey(data);
      const doDia = aplicarExcecoesDeData(
        assignments.filter((a) => a.dia === dia),
        config,
        turmas,
        dataKey,
      );
      const reposicoes = reprogramacoesParaData(turmas, config, data);
      for (const a of doDia) {
        const chave = suspensaoKey(dataKey, dia, a.slot.inicio);
        const reposicaoAqui = reposicoes.find((r) => r.slot.inicio === a.slot.inicio);
        if (reposicaoAqui) continue; // a reposição ocupa a célula (abaixo)
        let estado: EstadoCelula = "normal";
        let detalhe: string | undefined;
        if (config.suspensoes?.[chave]) {
          estado = "suspensa";
          const saiu = (config.reprogramacoes ?? []).find(
            (r) =>
              r.dataOriginal === dataKey &&
              r.turmaId === a.turma.id &&
              r.inicioOriginal === a.slot.inicio,
          );
          detalhe = saiu
            ? `Não participou${saiu.motivo ? `: ${saiu.motivo}` : ""}. Reposição em ${dataCurta(new Date(`${saiu.dataNova}T12:00:00`))}, ${saiu.inicio}.`
            : (config.motivosSuspensao?.[chave] ?? "Aula suspensa neste dia.");
        } else if (dataKey === hojeKey && a.slot.inicio <= agoraHHMM && agoraHHMM < a.slot.fim) {
          estado = "agora";
        } else if (!a.misto && realizadas.has(`${a.turma.id}|${dataKey}`)) {
          estado = "realizada";
        }
        byDayAndSlot.set(`${dia}|${a.slot.inicio}`, {
          assignment: a,
          estado,
          data,
          detalhe,
          rodadaSuspensa: Boolean(config.rodadasSuspensas?.[chave]?.rodadas.length),
        });
      }
      for (const r of reposicoes) {
        const origem = (config.reprogramacoes ?? []).find(
          (x) => x.dataNova === dataKey && x.turmaId === r.turma.id && x.inicio === r.slot.inicio,
        );
        const cedeu = origem?.slotDeslocado ? nome(origem.slotDeslocado.turmaId) : null;
        const emAula = dataKey === hojeKey && r.slot.inicio <= agoraHHMM && agoraHHMM < r.slot.fim;
        byDayAndSlot.set(`${dia}|${r.slot.inicio}`, {
          assignment: r,
          estado: emAula ? "agora" : "reposicao",
          data,
          detalhe: origem
            ? `Reposição da aula de ${dataCurta(new Date(`${origem.dataOriginal}T12:00:00`))}${cedeu ? ` (horário cedido por ${cedeu})` : ""}.`
            : "Reposição.",
        });
      }
    }

    const seriesUnicas: string[] = [];
    for (const t of turmas) if (!seriesUnicas.includes(t.serie)) seriesUnicas.push(t.serie);

    // Real configured break windows (not the gap between adjacent slots), so
    // a few idle leftover minutes never get mislabeled as part of the break.
    const breaksReais = [
      { inicio: config.intervaloInicio, fim: config.intervaloFim, label: "Almoço" },
      ...(config.recreioInicio && config.recreioFim
        ? [{ inicio: config.recreioInicio, fim: config.recreioFim, label: "Recreio" }]
        : []),
    ];
    const gaps: { apos: number; label: string; horario: string }[] = [];
    for (const pausa of breaksReais) {
      const inicioMin = toMinutes(pausa.inicio);
      let apos = -1;
      dailySlots.forEach((slot, index) => {
        if (toMinutes(slot.fim) <= inicioMin) apos = index;
      });
      if (apos === -1 || apos === dailySlots.length - 1) continue;
      gaps.push({ apos, label: pausa.label, horario: `${pausa.inicio}–${pausa.fim}` });
    }
    gaps.sort((a, b) => a.apos - b.apos);

    return {
      linhas: dailySlots,
      colunas: config.diasSemana,
      series: seriesUnicas,
      pausas: gaps,
      lookup: byDayAndSlot,
      temMisto: assignments.some((a) => a.misto),
    };
  }, [turmas, config, weekIndex, datasDosDias, realizadas, hojeKey, agora]);

  if (turmas.length === 0 || linhas.length === 0) return null;

  const sexta = segunda
    ? new Date(segunda.getFullYear(), segunda.getMonth(), segunda.getDate() + 4)
    : null;

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm dark:border-white/10 dark:bg-card/70 dark:shadow-lg dark:backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5 sm:px-4">
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              aria-label="Semana anterior"
              onClick={() => setSemanaOffset((o) => o - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <p className="min-w-[10rem] text-center text-sm font-semibold text-foreground">
              {segunda && sexta ? `${dataCurta(segunda)} a ${dataCurta(sexta)}` : "Semana"}
              <span className="block text-[11px] font-normal text-muted-foreground">
                {semanaOffset === 0
                  ? "Esta semana"
                  : semanaOffset === 1
                    ? "Próxima semana"
                    : semanaOffset === -1
                      ? "Semana passada"
                      : semanaOffset > 0
                        ? `Daqui a ${semanaOffset} semanas`
                        : `Há ${-semanaOffset} semanas`}
              </span>
            </p>
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              aria-label="Próxima semana"
              onClick={() => setSemanaOffset((o) => o + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          {semanaOffset !== 0 ? (
            <Button size="sm" variant="outline" onClick={() => setSemanaOffset(0)}>
              Voltar para esta semana
            </Button>
          ) : null}
        </div>
        {/* No celular a tabela virava rolagem horizontal com buracos; aqui ela
            vira uma lista por dia, compacta e sem células vazias. */}
        <div className="divide-y divide-border/60 sm:hidden">
          {colunas.map((dia) => {
            const hoje = dia === todayLabel;
            const doDia = linhas
              .map((slot) => ({ slot, celula: lookup.get(`${dia}|${slot.inicio}`) }))
              .filter((item) => item.celula);
            return (
              <section key={dia} className={hoje ? "bg-primary/[0.04]" : ""}>
                <h3
                  className={`flex items-center gap-1.5 px-4 pt-3 pb-2 text-[13px] font-semibold ${hoje ? "text-primary" : "text-foreground"}`}
                >
                  {dia}
                  <span className="font-normal text-muted-foreground">
                    {datasDosDias.get(dia) ? dataCurta(datasDosDias.get(dia)!) : ""}
                  </span>
                  {hoje ? (
                    <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      hoje
                    </span>
                  ) : null}
                </h3>
                {doDia.length === 0 ? (
                  <p className="px-4 pb-3 text-xs text-muted-foreground">Sem aulas neste dia.</p>
                ) : (
                  <ul className="space-y-1.5 px-3 pb-3">
                    {doDia.map(({ slot, celula }) => {
                      const assignment = celula!.assignment;
                      const overridden = Boolean(config.slotOverrides?.[`${dia}|${slot.inicio}`]);
                      return (
                        <li key={slot.inicio} className="flex items-stretch gap-2">
                          <span className="flex w-[56px] shrink-0 flex-col justify-center rounded-lg bg-slate-100/90 px-1.5 py-1 text-center font-mono text-[11px] leading-tight font-semibold text-slate-700 dark:bg-muted/60 dark:text-slate-200">
                            {slot.inicio}
                            <span className="font-normal text-slate-500 dark:text-slate-400">
                              {slot.fim}
                            </span>
                          </span>
                          <div className="min-w-0 flex-1">
                            <CelulaAula
                              celula={celula!}
                              config={config}
                              series={series}
                              weekIndex={weekIndex}
                              editado={overridden}
                              onMisto={() => setMistoSelecionado(assignment)}
                              onClick={() => {
                                setDataSelecionada(celula!.data);
                                if (isAuthenticated && celula!.estado !== "reposicao") {
                                  setEditando(assignment);
                                } else {
                                  setPrevisto(assignment);
                                }
                              }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
        <div className="hidden overflow-x-auto scroll-smooth sm:block [scrollbar-width:thin]">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 w-[68px] shrink-0 border-r border-b border-border/60 bg-slate-100/90 p-2 backdrop-blur sm:w-24 sm:p-3 dark:bg-muted/60" />
                {colunas.map((dia) => {
                  const hoje = dia === todayLabel;
                  return (
                    <th
                      key={dia}
                      scope="col"
                      className={`min-w-[140px] border-b border-border/60 p-2.5 text-center sm:min-w-[152px] sm:p-3 ${hoje ? "bg-primary/5" : ""}`}
                    >
                      <span
                        className={`inline-flex items-center gap-1.5 text-[13px] font-semibold sm:text-sm ${hoje ? "text-primary" : "text-foreground"}`}
                      >
                        {dia}
                        {hoje ? (
                          <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                        ) : null}
                      </span>
                      <span className="block text-[11px] font-normal text-muted-foreground">
                        {datasDosDias.get(dia) ? dataCurta(datasDosDias.get(dia)!) : ""}
                        {hoje ? " · hoje" : ""}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {linhas.map((slot, rowIndex) => {
                const pausaApos = pausas.find((p) => p.apos === rowIndex);
                return (
                  <Fragment key={slot.inicio}>
                    <tr className="group/row">
                      <td className="sticky left-0 z-10 w-[68px] shrink-0 border-r border-b border-border/60 bg-slate-100/90 px-2 py-2.5 text-center align-middle whitespace-nowrap backdrop-blur sm:w-24 sm:px-3 sm:py-3 dark:bg-muted/60">
                        <span className="block font-mono text-[11px] font-bold text-slate-700 sm:text-xs dark:text-slate-200">
                          {slot.inicio}
                        </span>
                        <span className="block font-mono text-[11px] text-slate-500 sm:text-xs dark:text-slate-400">
                          {slot.fim}
                        </span>
                      </td>
                      {colunas.map((dia) => {
                        const celula = lookup.get(`${dia}|${slot.inicio}`);
                        const assignment = celula?.assignment;
                        const hoje = dia === todayLabel;
                        const overridden = Boolean(config.slotOverrides?.[`${dia}|${slot.inicio}`]);
                        return (
                          <td
                            key={dia}
                            className={`border-b border-border/40 p-1.5 align-top ${hoje ? "bg-primary/[0.03]" : ""}`}
                          >
                            {celula && assignment ? (
                              <CelulaAula
                                celula={celula}
                                config={config}
                                series={series}
                                weekIndex={weekIndex}
                                editado={overridden}
                                onMisto={() => setMistoSelecionado(assignment)}
                                onClick={() => {
                                  setDataSelecionada(celula.data);
                                  if (isAuthenticated && celula.estado !== "reposicao") {
                                    setEditando(assignment);
                                  } else {
                                    setPrevisto(assignment);
                                  }
                                }}
                              />
                            ) : (
                              <div className="h-14 rounded-xl border border-dashed border-border/30" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    {pausaApos ? (
                      <tr>
                        <td
                          colSpan={colunas.length + 1}
                          className="border-b border-border/40 bg-muted/50 p-0"
                        >
                          {/* O rótulo da pausa acompanha a rolagem horizontal
                              para continuar legível no celular. */}
                          <span className="sticky left-0 flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            <span
                              aria-hidden
                              className="h-px w-4 shrink-0 rounded bg-border sm:w-8"
                            />
                            {pausaApos.label} · {pausaApos.horario}
                          </span>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legenda da situação de cada aula na semana. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="rounded-full bg-emerald-700 px-1.5 py-px text-[10px] font-bold text-white">
              AGORA
            </span>
            em aula
          </span>
          <span className="flex items-center gap-1.5">
            <span className="flex size-4 items-center justify-center rounded-full bg-emerald-700 text-white">
              <Check className="size-3" />
            </span>
            aula realizada
          </span>
          <span className="flex items-center gap-1.5">
            <span className="rounded-full bg-rose-700 px-1.5 py-px text-[10px] font-bold text-white">
              NÃO PARTICIPOU
            </span>
            turma não teve a aula
          </span>
          <span className="flex items-center gap-1.5">
            <span className="rounded-full bg-sky-700 px-1.5 py-px text-[10px] font-bold text-white">
              REPOSIÇÃO
            </span>
            aula reposta neste horário
          </span>
        </div>

        {/* Legenda: um selo por série, na mesma rampa ordinal das células. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 px-4 py-3">
          {series.map((serie, index) => {
            const { bg } = serieClasses(index);
            return (
              <span key={serie} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`size-2.5 rounded-full ${bg}`} aria-hidden />
                {serie}
              </span>
            );
          })}
        </div>
        {temMisto ? (
          <p className="border-t border-border/60 px-4 py-2 text-[11px] text-muted-foreground">
            Células listradas (várias faixas) = horário misto: o grupo que sobrou de cada turma
            grande usa 30 min, uma turma depois da outra, já que só há {config.numeroComputadores}{" "}
            computadores.
          </p>
        ) : null}
      </div>

      <ScheduleEditDialog
        assignment={editando}
        overridden={
          editando
            ? Boolean(config.slotOverrides?.[`${editando.dia}|${editando.slot.inicio}`])
            : false
        }
        onOpenChange={(open) => {
          if (!open) setEditando(null);
        }}
        onSelect={async (turmaId) => {
          if (!editando) return;
          const novaTurma = turmas.find((t) => t.id === turmaId);
          const ok = await confirmar({
            titulo: turmaId ? "Trocar a turma deste horário?" : "Restaurar o rodízio automático?",
            descricao: turmaId
              ? `${editando.dia} ${editando.slot.inicio}–${editando.slot.fim} passa a ser de ${novaTurma?.serie} "${novaTurma?.letra}" toda semana.`
              : `${editando.dia} ${editando.slot.inicio}–${editando.slot.fim} volta a seguir o rodízio automático.`,
          });
          if (!ok) return;
          setSlotOverride(editando.dia, editando.slot.inicio, turmaId);
          toast.success(
            turmaId ? "Horário atualizado." : "Horário restaurado ao rodízio automático.",
          );
          setEditando(null);
        }}
      />

      <PreviaAlunosDialog
        assignment={previsto}
        data={dataSelecionada ?? agoraNaEscola()}
        onOpenChange={(open) => {
          if (!open) setPrevisto(null);
        }}
      />

      <MistoDetalhesDialog
        assignment={mistoSelecionado}
        config={config}
        series={series}
        weekIndex={weekIndex}
        onOpenChange={(open) => {
          if (!open) setMistoSelecionado(null);
        }}
      />
    </>
  );
}

/** Célula da grade: a pílula da turma com o selo da situação daquela data. */
function CelulaAula({
  celula,
  config,
  series,
  weekIndex,
  editado,
  onClick,
  onMisto,
}: {
  celula: Celula;
  config: ScheduleConfig;
  series: string[];
  weekIndex: number;
  editado: boolean;
  onClick: () => void;
  onMisto: () => void;
}) {
  const { assignment, estado, detalhe } = celula;
  const selo =
    estado === "agora"
      ? { texto: "AGORA", classe: "bg-emerald-700 animate-pulse" }
      : estado === "suspensa"
        ? { texto: "NÃO PARTICIPOU", classe: "bg-rose-700" }
        : estado === "reposicao"
          ? { texto: "REPOSIÇÃO", classe: "bg-sky-700" }
          : null;
  return (
    <div
      className={cn(
        "relative rounded-xl",
        estado === "agora" && "ring-2 ring-emerald-500 ring-offset-2 ring-offset-card",
        estado === "reposicao" && "ring-2 ring-sky-500 ring-offset-2 ring-offset-card",
      )}
      title={detalhe}
    >
      <div
        className={cn(
          estado === "suspensa" && "opacity-45 grayscale-[60%] [&_p:first-child]:line-through",
        )}
      >
        {assignment.misto ? (
          <MixedPill
            assignment={assignment}
            config={config}
            series={series}
            weekIndex={weekIndex}
            onClick={onMisto}
          />
        ) : (
          <SchedulePill
            assignment={assignment}
            serieIndex={series.indexOf(assignment.turma.serie)}
            editado={editado}
            onClick={onClick}
          />
        )}
      </div>
      {selo ? (
        <span
          className={cn(
            "pointer-events-none absolute -top-2 right-1.5 rounded-full px-1.5 py-px text-[9px] font-bold tracking-wide text-white shadow",
            selo.classe,
          )}
        >
          {selo.texto}
        </span>
      ) : null}
      {estado === "realizada" ? (
        <span
          className="pointer-events-none absolute -top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-emerald-700 text-white shadow"
          title="Aula realizada"
        >
          <Check className="size-3" />
        </span>
      ) : null}
      {celula.rodadaSuspensa && estado !== "suspensa" ? (
        <span className="pointer-events-none absolute -bottom-1.5 right-1.5 rounded-full bg-amber-700 px-1.5 py-px text-[9px] font-bold text-white shadow">
          rodada suspensa
        </span>
      ) : null}
      {estado === "suspensa" && detalhe ? (
        <p className="mt-1 line-clamp-2 px-0.5 text-[10px] leading-tight text-rose-700 dark:text-rose-300">
          {detalhe}
        </p>
      ) : null}
    </div>
  );
}

function SchedulePill({
  assignment,
  serieIndex,
  editado,
  onClick,
}: {
  assignment: Assignment;
  serieIndex: number;
  editado?: boolean;
  onClick: () => void;
}) {
  const { bg, text, ring } = serieClasses(Math.max(0, serieIndex));
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ver detalhes: ${assignment.turma.serie} "${assignment.turma.letra}", ${assignment.dia} ${assignment.slot.inicio}–${assignment.slot.fim}`}
      className={`relative h-14 w-full cursor-pointer rounded-xl px-3 py-1.5 text-left shadow-sm ring-1 transition-all duration-300 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 [@media(hover:hover)]:hover:scale-105 [@media(hover:hover)]:hover:shadow-lg [@media(hover:hover)]:hover:ring-2 ${bg} ${text} ${ring}`}
    >
      <p className="truncate text-[13px] leading-tight font-semibold">
        {assignment.turma.serie} &quot;{assignment.turma.letra}&quot;
      </p>
      <p className="mt-0.5 truncate text-[11px] leading-tight opacity-80">
        Prof(a). {assignment.turma.professorRegente}
      </p>
      {editado ? (
        <span
          className="absolute top-1 right-1 size-1.5 rounded-full bg-white/90 ring-1 ring-black/10"
          aria-hidden
        />
      ) : null}
    </button>
  );
}

/**
 * Um horário "misto" reúne o grupo que sobrou da sessão principal de até
 * `roundsPorVisita` turmas diferentes (só 7 computadores não dão pra uma
 * turma de 20+ alunos inteira de uma vez) — 30 min cada, uma atrás da
 * outra, em vez de uma turma só ocupando o horário inteiro. Clicável, como
 * as células normais, mas abre um resumo em vez do diálogo de troca (editar
 * um horário misto não é suportado pelo diálogo simples de turma única).
 */
function MixedPill({
  assignment,
  config,
  series,
  weekIndex,
  onClick,
}: {
  assignment: Assignment;
  config: ScheduleConfig;
  series: string[];
  weekIndex: number;
  onClick: () => void;
}) {
  const subBlocos = buildSubBlocos(assignment, config, weekIndex);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ver detalhes do horário misto: ${assignment.dia} ${assignment.slot.inicio}–${assignment.slot.fim}`}
      className="flex h-14 w-full cursor-pointer flex-col gap-0.5 overflow-hidden rounded-xl text-left ring-1 ring-border/60 transition-all duration-300 ease-out [@media(hover:hover)]:hover:scale-105 [@media(hover:hover)]:hover:shadow-lg [@media(hover:hover)]:hover:ring-2"
    >
      {subBlocos.map((sub, i) => {
        const turma = sub.turma ?? assignment.turma;
        const { bg, text } = serieClasses(Math.max(0, series.indexOf(turma.serie)));
        return (
          <span
            key={i}
            className={`flex flex-1 items-center justify-between gap-1 px-2 ${bg} ${text}`}
          >
            <span className="truncate text-xs leading-none font-semibold">
              {turma.serie} &quot;{turma.letra}&quot;
            </span>
            <span className="shrink-0 text-xs leading-none opacity-80">{sub.inicio}</span>
          </span>
        );
      })}
    </button>
  );
}

function ScheduleEditDialog({
  assignment,
  overridden,
  onOpenChange,
  onSelect,
}: {
  assignment: Assignment | null;
  overridden: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (turmaId: string | null) => void;
}) {
  const { turmas } = useAppStore();

  return (
    <Dialog open={assignment !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {assignment
              ? `${assignment.dia} · ${assignment.slot.inicio} – ${assignment.slot.fim}`
              : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          {turmas.map((turma) => (
            <button
              key={turma.id}
              type="button"
              onClick={() => onSelect(turma.id)}
              className={cn(
                "flex items-center gap-3 rounded-md border border-border/60 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                assignment?.turma.id === turma.id && "border-primary bg-primary/5",
              )}
            >
              {turma.imagem ? (
                <img src={turma.imagem} alt="" className="size-8 rounded-md object-cover" />
              ) : (
                <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-secondary-foreground">
                  {turma.letra}
                </span>
              )}
              <span>
                <span className="font-medium text-foreground">
                  {turma.serie} &quot;{turma.letra}&quot;
                </span>
                <span className="block text-xs text-muted-foreground">
                  Prof(a). {turma.professorRegente}
                </span>
              </span>
            </button>
          ))}
        </div>
        <DialogFooter>
          {overridden ? (
            <Button variant="outline" onClick={() => onSelect(null)}>
              <RotateCcw className="size-3.5" /> Restaurar rodízio automático
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Explica, em linguagem simples, o que é um horário misto: quais turmas
 * dividem aquele período, o horário exato de cada uma e — o mais importante
 * pro público — exatamente quais alunos formam o grupo que ficou de fora da
 * sessão principal da turma. Esse grupo não é fixo pra sempre: como o
 * rodízio semanal muda qual grupo "sobra" a cada semana (ver
 * `buildWeeklySchedule`), ao longo de várias semanas todo aluno passa por
 * aqui, não sempre os mesmos.
 */
function MistoDetalhesDialog({
  assignment,
  config,
  series,
  weekIndex,
  onOpenChange,
}: {
  assignment: Assignment | null;
  config: ScheduleConfig;
  series: string[];
  weekIndex: number;
  onOpenChange: (open: boolean) => void;
}) {
  const subBlocos = assignment ? buildSubBlocos(assignment, config, weekIndex) : [];

  return (
    <Dialog open={assignment !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-4 overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users2 className="size-4 text-primary" />
            {assignment
              ? `Horário misto · ${assignment.dia} ${assignment.slot.inicio}–${assignment.slot.fim}`
              : ""}
          </DialogTitle>
        </DialogHeader>
        {assignment ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
            <p className="text-sm text-muted-foreground">
              A escola só tem {config.numeroComputadores} computadores, então uma turma de mais de{" "}
              {config.numeroComputadores} alunos não cabe inteira numa única visita. O grupo que
              sobra de cada turma grande usa este horário — e esse grupo roda: nas próximas semanas,
              outros alunos da turma é que ficam de fora e vêm pra cá, não sempre os mesmos.
            </p>
            <div className="flex flex-col gap-3">
              {subBlocos.map((sub, i) => {
                const turma = sub.turma ?? assignment.turma;
                const { bg, text } = serieClasses(Math.max(0, series.indexOf(turma.serie)));
                return (
                  <div key={i} className="overflow-hidden rounded-xl border border-border/60">
                    <div className={`flex items-center gap-3 px-3 py-2 ${bg} ${text}`}>
                      {turma.imagem ? (
                        <img
                          src={turma.imagem}
                          alt=""
                          className="size-8 shrink-0 rounded-lg object-cover ring-2 ring-white/40"
                        />
                      ) : (
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/20 text-xs font-bold">
                          {turma.letra}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {turma.serie} &quot;{turma.letra}&quot;
                        </p>
                        <p className="truncate text-[11px] opacity-80">
                          Prof(a). {turma.professorRegente}
                        </p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-2 py-1 font-mono text-xs font-bold">
                        <CalendarClock className="size-3.5" />
                        {sub.inicio}–{sub.fim}
                      </span>
                    </div>
                    {sub.grupo.alunos.length > 0 ? (
                      <div className="grid grid-cols-1 gap-1 p-2.5 sm:grid-cols-2">
                        {sub.grupo.alunos.map((aluno, indiceAluno) => (
                          <div
                            key={aluno.id}
                            className="flex min-w-0 items-center gap-2 rounded-lg bg-muted/40 px-2 py-1.5"
                          >
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-background text-xs font-semibold text-foreground ring-1 ring-border/60">
                              {indiceAluno + 1}
                            </span>
                            <span className="truncate text-xs text-foreground">{aluno.nome}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="px-3 py-2 text-xs text-muted-foreground">
                        Nenhum aluno neste grupo ainda.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
