import {
  CalendarCheck2,
  CalendarClock,
  CalendarX2,
  CircleDashed,
  MonitorPlay,
  MessageSquareText,
  NotebookPen,
  Repeat2,
  Undo2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/app-store";
import {
  aplicarExcecoesDeData,
  buildWeeklySchedule,
  currentWeekdayLabel,
  getWeekIndex,
  nextAssignmentsForDay,
  reprogramacoesParaData,
  suspensaoKey,
  toDateKey,
} from "@/lib/schedule-engine";
import type { Assignment, Presenca, ScheduleConfig, Turma } from "@/lib/types";
import { Paginacao } from "@/components/school/paginacao";
import { paginar } from "@/lib/paginar";
import { cn } from "@/lib/utils";

type Situacao =
  | "andamento"
  | "realizada"
  | "reposicao"
  | "reprogramada"
  | "cedida"
  | "suspensa"
  | "prevista"
  | "sem-registro";

const SITUACOES: Record<
  Situacao,
  { rotulo: string; classe: string; icone: typeof CalendarCheck2 }
> = {
  andamento: {
    rotulo: "Em andamento agora",
    classe:
      "bg-emerald-500 text-white ring-emerald-400 animate-pulse shadow-sm shadow-emerald-500/40",
    icone: MonitorPlay,
  },
  realizada: {
    rotulo: "Realizada",
    classe: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30",
    icone: CalendarCheck2,
  },
  reposicao: {
    rotulo: "Reposição",
    classe: "bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-sky-500/30",
    icone: Undo2,
  },
  reprogramada: {
    rotulo: "Reprogramada",
    classe: "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/30",
    icone: CalendarClock,
  },
  cedida: {
    rotulo: "Horário cedido",
    classe: "bg-violet-500/15 text-violet-700 dark:text-violet-300 ring-violet-500/30",
    icone: Repeat2,
  },
  suspensa: {
    rotulo: "Suspensa",
    classe: "bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-rose-500/30",
    icone: CalendarX2,
  },
  prevista: {
    rotulo: "Prevista",
    classe: "bg-muted text-muted-foreground ring-border",
    icone: CircleDashed,
  },
  "sem-registro": {
    rotulo: "Sem chamada registrada",
    classe: "bg-muted text-muted-foreground ring-border",
    icone: CircleDashed,
  },
};

interface Registro {
  chave: string;
  inicio: string;
  fim: string;
  turmaNome: string;
  situacao: Situacao;
  detalhes: string[];
  observacao?: string | undefined;
  presentes: number;
  faltas: number;
  substituicoes: number;
}

interface Dia {
  dataKey: string;
  data: Date;
  registros: Registro[];
}

/** Dias de aula por página do diário. */
const DIAS_POR_PAGINA = 5;

function nome(t: Turma | undefined): string {
  return t ? `${t.serie} "${t.letra}"` : "Turma";
}

function dataCurta(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

/**
 * Monta, dia a dia, o que aconteceu com cada aula prevista: se foi dada,
 * suspensa, reprogramada, cedida para reposição de outra turma, e quantos
 * alunos participaram, faltaram ou foram substituídos. Só contagens — o
 * detalhe por aluno fica no painel, com login.
 */
function montarDiario(
  turmas: Turma[],
  config: ScheduleConfig,
  registros: Presenca[],
  mes: string,
  agora: Date,
): Dia[] {
  const [ano, m] = mes.split("-").map(Number);
  const ultimoDia = new Date(ano ?? 2026, m ?? 1, 0).getDate();
  const turmasPorId = new Map(turmas.map((t) => [t.id, t]));
  const reprogramacoes = config.reprogramacoes ?? [];
  const hojeKey = toDateKey(agora);
  const agoraHHMM = agora.toTimeString().slice(0, 5);
  const dias: Dia[] = [];

  for (let d = 1; d <= ultimoDia; d += 1) {
    const data = new Date(ano ?? 2026, (m ?? 1) - 1, d);
    const dataKey = toDateKey(data);
    if (dataKey > hojeKey) break;
    if (config.dataInicioOperacao && dataKey < config.dataInicioOperacao) continue;
    const dia = currentWeekdayLabel(data);
    if (!config.diasSemana.includes(dia)) continue;

    const reposicoes = reprogramacoesParaData(turmas, config, data);
    const semana = aplicarExcecoesDeData(
      buildWeeklySchedule(turmas, config, getWeekIndex(data)),
      config,
      turmas,
      dataKey,
    );
    const aulas: Assignment[] = nextAssignmentsForDay([...reposicoes, ...semana], dia);

    const doDia: Registro[] = aulas.map((a) => {
      const chave = suspensaoKey(dataKey, a.dia, a.slot.inicio);
      const ehReposicao = reposicoes.includes(a);
      const turmaNome = a.misto
        ? `Horário misto (${a.misto.map((x) => nome(x.turma)).join(", ")})`
        : nome(a.turma);
      const presencas = a.misto
        ? []
        : registros.filter((r) => r.turmaId === a.turma.id && r.data === dataKey);
      const faltas = presencas.filter((p) => p.status === "faltou").length;
      const substituicoes = presencas.filter((p) => p.status === "substituido").length;
      const presentes = presencas.length - faltas;
      const detalhes: string[] = [];
      let situacao: Situacao;

      const saiu = reprogramacoes.find(
        (r) =>
          r.dataOriginal === dataKey &&
          r.turmaId === a.turma.id &&
          r.inicioOriginal === a.slot.inicio,
      );
      const cedeu = reprogramacoes.find(
        (r) =>
          r.slotDeslocado?.data === dataKey &&
          r.slotDeslocado.inicio === a.slot.inicio &&
          r.slotDeslocado.turmaId === a.turma.id,
      );

      if (ehReposicao) {
        situacao = "reposicao";
        const origem = reprogramacoes.find(
          (r) => r.dataNova === dataKey && r.turmaId === a.turma.id && r.inicio === a.slot.inicio,
        );
        if (origem) {
          detalhes.push(
            `Reposição da aula de ${dataCurta(origem.dataOriginal)}, ${origem.inicioOriginal}.`,
          );
          if (origem.motivo) detalhes.push(`Motivo: ${origem.motivo}`);
        }
      } else if (config.suspensoes?.[chave]) {
        if (saiu) {
          situacao = "reprogramada";
          if (saiu.motivo) detalhes.push(`Motivo: ${saiu.motivo}`);
          detalhes.push(`Reposição: ${dataCurta(saiu.dataNova)}, ${saiu.inicio}–${saiu.fim}.`);
        } else if (cedeu) {
          situacao = "cedida";
          detalhes.push(
            `Horário usado para a reposição de ${nome(turmasPorId.get(cedeu.turmaId))}. A turma mantém a sua aula principal da semana.`,
          );
        } else {
          situacao = "suspensa";
          const motivo = config.motivosSuspensao?.[chave];
          detalhes.push(motivo ? `Motivo: ${motivo}` : "Aula suspensa pela coordenação.");
        }
      } else if (dataKey === hojeKey && a.slot.inicio <= agoraHHMM && agoraHHMM < a.slot.fim) {
        situacao = "andamento";
      } else if (presencas.length > 0) {
        situacao = "realizada";
      } else if (dataKey === hojeKey && a.slot.fim > agoraHHMM) {
        situacao = "prevista";
      } else {
        situacao = "sem-registro";
      }

      const rodadas = config.rodadasSuspensas?.[chave];
      if (rodadas && rodadas.rodadas.length > 0) {
        detalhes.push(
          `${rodadas.rodadas.map((r) => `${r}ª`).join(" e ")} rodada suspensa${rodadas.motivo ? `: ${rodadas.motivo}` : "."}`,
        );
      }

      return {
        chave,
        inicio: a.slot.inicio,
        fim: a.slot.fim,
        turmaNome,
        situacao,
        detalhes,
        observacao: config.observacoesAula?.[chave],
        presentes,
        faltas,
        substituicoes,
      };
    });

    if (doDia.length > 0) dias.push({ dataKey, data, registros: doDia });
  }
  return dias.reverse();
}

/**
 * Diário das aulas, aberto ao público: registro de cada aula prevista no
 * mês — dada, suspensa, reprogramada, reposta — com as contagens de
 * participação e as observações do professor.
 */
export function DiarioAulas({ registros, mes }: { registros: Presenca[] | null; mes: string }) {
  const { turmas, config } = useAppStore();
  const [filtro, setFiltro] = useState("");
  const [pagina, setPagina] = useState(1);
  // Trocar de mês ou de turma volta para a primeira página.
  useEffect(() => setPagina(1), [filtro, mes]);

  const dias = useMemo(
    () => (registros ? montarDiario(turmas, config, registros, mes, new Date()) : null),
    [turmas, config, registros, mes],
  );

  const visiveis = useMemo(() => {
    if (!dias) return null;
    if (!filtro) return dias;
    const alvo = turmas.find((t) => t.id === filtro);
    const rotulo = nome(alvo);
    return dias
      .map((d) => ({ ...d, registros: d.registros.filter((r) => r.turmaNome.includes(rotulo)) }))
      .filter((d) => d.registros.length > 0);
  }, [dias, filtro, turmas]);

  const pag = visiveis ? paginar(visiveis, pagina, DIAS_POR_PAGINA) : null;

  const resumo = useMemo(() => {
    const todos = (dias ?? []).flatMap((d) => d.registros);
    const conta = (s: Situacao) => todos.filter((r) => r.situacao === s).length;
    return {
      realizadas: conta("realizada") + conta("reposicao"),
      suspensas: conta("suspensa") + conta("reprogramada") + conta("cedida"),
      semRegistro: conta("sem-registro"),
    };
  }, [dias]);

  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader className="gap-3 border-b border-border/60 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <NotebookPen className="size-4 text-primary" /> Diário das aulas
            </CardTitle>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
              O que aconteceu em cada aula do mês: se foi dada, suspensa ou reprogramada, a
              participação da turma e as observações do professor.
            </p>
          </div>
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            aria-label="Filtrar por turma"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Todas as turmas</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {nome(t)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 font-medium text-emerald-700 dark:text-emerald-300">
            {resumo.realizadas} realizadas
          </span>
          <span className="rounded-full bg-rose-500/15 px-2.5 py-1 font-medium text-rose-700 dark:text-rose-300">
            {resumo.suspensas} suspensas / reprogramadas
          </span>
          <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">
            {resumo.semRegistro} sem chamada registrada
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {visiveis === null ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
        ) : visiveis.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma aula registrada neste mês.
          </p>
        ) : (
          <>
            <ol className="divide-y divide-border/60">
              {(pag?.itens ?? []).map((d) => (
                <li key={d.dataKey}>
                  <p className="bg-muted/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur first-letter:uppercase">
                    {d.data.toLocaleDateString("pt-BR", {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                    })}
                  </p>
                  <ul className="divide-y divide-border/40">
                    {d.registros.map((r) => {
                      const s = SITUACOES[r.situacao];
                      const Icone = s.icone;
                      return (
                        <li
                          key={r.chave}
                          className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:gap-4"
                        >
                          <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground sm:pt-0.5">
                            {r.inicio}–{r.fim}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">
                                {r.turmaNome}
                              </span>
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
                                  s.classe,
                                )}
                              >
                                <Icone className="size-3" /> {s.rotulo}
                              </span>
                            </div>
                            {r.situacao === "realizada" ||
                            (r.situacao === "andamento" && r.presentes + r.faltas > 0) ||
                            (r.situacao === "reposicao" && r.presentes + r.faltas > 0) ? (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {r.presentes}{" "}
                                {r.presentes === 1 ? "aluno participou" : "alunos participaram"}
                                {r.faltas > 0
                                  ? ` · ${r.faltas} ${r.faltas === 1 ? "falta" : "faltas"}`
                                  : " · sem faltas"}
                                {r.substituicoes > 0
                                  ? ` · ${r.substituicoes} ${r.substituicoes === 1 ? "substituição" : "substituições"}`
                                  : ""}
                              </p>
                            ) : null}
                            {r.detalhes.map((t) => (
                              <p key={t} className="mt-0.5 text-xs text-muted-foreground">
                                {t}
                              </p>
                            ))}
                            {r.observacao ? (
                              <p className="mt-1 flex items-start gap-1.5 rounded-md bg-primary/5 px-2 py-1 text-xs text-foreground">
                                <MessageSquareText className="mt-0.5 size-3.5 shrink-0 text-primary" />
                                <span>{r.observacao}</span>
                              </p>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
            {pag ? (
              <Paginacao atual={pag.atual} totalPaginas={pag.totalPaginas} onChange={setPagina} />
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
