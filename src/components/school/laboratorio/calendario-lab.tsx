import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Download,
  Flame,
  Shuffle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { FichaAluno, rotuloTurma } from "@/components/school/laboratorio/ficha-aluno";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/app-store";
import {
  TABELA_AUSENTE,
  agruparSessoes,
  carregarSessoes,
  fimDaSemana,
  horaNaEscola,
  hojeNaEscola,
  inicioDaSemana,
  type SessaoLab,
} from "@/lib/laboratorio";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";
import { cn } from "@/lib/utils";

const DIAS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

const chave = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dataBR = (c: string) => c.split("-").reverse().join("/");
const dataCurta = (c: string) => c.slice(5).split("-").reverse().join("/");
const minutosDe = (s: SessaoLab) =>
  Math.max(
    0,
    Math.round(
      (new Date(s.fim).getTime() - new Date(s.inicio).getTime()) / 60_000 - s.pausaSegundos / 60,
    ),
  );
const textoMin = (m: number) =>
  m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} min`;

function nomeDoMes(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
    new Date(y!, m! - 1, 1),
  );
}

function mudarMes(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  return chave(new Date(y!, m! - 1 + delta, 1)).slice(0, 7);
}

/** Dias da grade do mês, começando na segunda-feira da primeira semana. */
function diasDaGrade(ym: string): string[] {
  const [y, m] = ym.split("-").map(Number);
  const ultimo = chave(new Date(y!, m!, 0));
  const dias: string[] = [];
  let atual = inicioDaSemana(`${ym}-01`);
  while (dias.length < 42) {
    dias.push(atual);
    const [ay, am, ad] = atual.split("-").map(Number);
    atual = chave(new Date(ay!, am! - 1, ad! + 1));
    if (dias.length % 7 === 0 && dias[dias.length - 1]! >= ultimo) break;
  }
  return dias;
}

function Etiqueta({ rotulo, className }: { rotulo: string; className?: string }) {
  const cor = serieClasses(serieIndexPorNumero(rotulo));
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-px text-[10px] font-extrabold leading-tight",
        cor.bg,
        cor.text,
        className,
      )}
    >
      {rotulo}
    </span>
  );
}

/**
 * Calendário do laboratório: que turmas foram em cada dia, quem foi e quem
 * ainda não foi na semana ou no mês, e o relatório detalhado para baixar.
 */
export function CalendarioLab() {
  const { turmas } = useAppStore();
  const hoje = hojeNaEscola();
  const [mes, setMes] = useState(hoje.slice(0, 7));
  const [dia, setDia] = useState(hoje);
  const [periodo, setPeriodo] = useState<"mes" | "semana">("mes");
  const [sessoes, setSessoes] = useState<SessaoLab[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ficha, setFicha] = useState<{ turmaId: string; alunoId: string } | null>(null);

  useEffect(() => {
    let vivo = true;
    setSessoes(null);
    setErro(null);
    // Carrega desde a segunda-feira da primeira semana da grade, para a semana não ficar cortada.
    carregarSessoes(inicioDaSemana(`${mes}-01`))
      .then((s) => vivo && setSessoes(s))
      .catch((e: Error) => {
        if (!vivo) return;
        setErro(e.message);
        setSessoes([]);
      });
    return () => {
      vivo = false;
    };
  }, [mes]);

  const grade = useMemo(() => diasDaGrade(mes), [mes]);
  const porDia = useMemo(() => {
    const m = new Map<string, SessaoLab[]>();
    for (const s of sessoes ?? []) m.set(s.data, [...(m.get(s.data) ?? []), s]);
    return m;
  }, [sessoes]);

  const [de, ate] = useMemo(() => {
    if (periodo === "semana") return [inicioDaSemana(dia), fimDaSemana(dia)];
    const [y, m] = mes.split("-").map(Number);
    return [`${mes}-01`, chave(new Date(y!, m!, 0))];
  }, [periodo, dia, mes]);

  /** Por turma: quem foi (com dias e tempo) e quem não foi, dentro do período escolhido. */
  const cobertura = useMemo(() => {
    const doPeriodo = (sessoes ?? []).filter((s) => s.data >= de && s.data <= ate);
    return turmas.map((t) => {
      const alunos = t.alunos
        .map((a) => {
          const minhas = doPeriodo.filter((s) => s.alunoId === a.id);
          const datas = [...new Set(minhas.map((s) => s.data))].sort();
          return {
            id: a.id,
            nome: a.nome,
            dias: datas.length,
            minutos: minhas.reduce((n, s) => n + minutosDe(s), 0),
            ultima: datas.at(-1) ?? null,
          };
        })
        .sort((x, y) => x.nome.localeCompare(y.nome, "pt-BR"));
      const media = alunos.length ? alunos.reduce((n, a) => n + a.dias, 0) / alunos.length : 0;
      return {
        turma: t,
        alunos,
        foram: alunos.filter((a) => a.dias > 0),
        faltam: alunos.filter((a) => a.dias === 0),
        media,
      };
    });
  }, [sessoes, turmas, de, ate]);

  const sessoesDoDia = porDia.get(dia) ?? [];
  const gruposDoDia = agruparSessoes(sessoesDoDia);

  function baixarCsv() {
    const linhas = [["Turma", "Aluno", "Dias no laboratório", "Minutos", "Última ida", "Situação"]];
    for (const c of cobertura)
      for (const a of c.alunos)
        linhas.push([
          rotuloTurma(c.turma.serie, c.turma.letra),
          a.nome,
          String(a.dias),
          String(a.minutos),
          a.ultima ? dataBR(a.ultima) : "",
          a.dias === 0
            ? "não foi"
            : a.dias > Math.max(1, Math.ceil(c.media))
              ? "acima da turma"
              : "foi",
        ]);
    const csv =
      "﻿" + linhas.map((l) => l.map((x) => `"${x.replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `laboratorio-${de}-a-${ate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalFoi = cobertura.reduce((n, c) => n + c.foram.length, 0);
  const totalAlunos = cobertura.reduce((n, c) => n + c.alunos.length, 0);

  return (
    <div className="space-y-5">
      {erro ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          {erro === TABELA_AUSENTE
            ? "O banco ainda não tem a tabela do laboratório (supabase/laboratorio.sql)."
            : `Não consegui carregar agora: ${erro}`}
        </p>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base capitalize">
              <CalendarDays className="size-5 text-primary" aria-hidden /> {nomeDoMes(mes)}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="outline"
                aria-label="Mês anterior"
                onClick={() => setMes(mudarMes(mes, -1))}
              >
                <ChevronLeft />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setMes(hoje.slice(0, 7));
                  setDia(hoje);
                }}
              >
                Hoje
              </Button>
              <Button
                size="icon"
                variant="outline"
                aria-label="Próximo mês"
                onClick={() => setMes(mudarMes(mes, 1))}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-muted-foreground">
            {DIAS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grade.map((d) => {
              const lista = porDia.get(d) ?? [];
              const turmasDoDia = new Map<string, string>();
              for (const s of lista) turmasDoDia.set(s.turmaId, s.turmaRotulo);
              const alunosDoDia = new Set(lista.map((s) => s.alunoId)).size;
              const foraDoMes = d.slice(0, 7) !== mes;
              const selecionado = d === dia;
              const noPeriodo = d >= de && d <= ate;
              const fimDeSemana = [0, 6].includes(new Date(`${d}T12:00:00`).getDay());
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDia(d)}
                  aria-pressed={selecionado}
                  aria-label={`${dataBR(d)}: ${alunosDoDia} aluno(s)`}
                  className={cn(
                    "flex min-h-16 flex-col gap-1 rounded-lg border p-1 text-left transition sm:min-h-24 sm:p-1.5",
                    foraDoMes && "opacity-40",
                    fimDeSemana && "bg-muted/40",
                    noPeriodo && "border-primary/40",
                    selecionado ? "ring-2 ring-primary" : "hover:bg-muted/60",
                    d === hoje && "bg-primary/10",
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-semibold tabular-nums",
                      d === hoje && "text-primary",
                    )}
                  >
                    {Number(d.slice(8))}
                  </span>
                  <span className="flex flex-wrap gap-0.5">
                    {[...turmasDoDia.values()].slice(0, 4).map((r) => (
                      <Etiqueta key={r} rotulo={r} />
                    ))}
                  </span>
                  {alunosDoDia > 0 ? (
                    <span className="mt-auto text-[10px] text-muted-foreground">
                      {alunosDoDia} aluno{alunosDoDia === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border bg-muted/30 p-3">
            <h3 className="text-sm font-semibold">{dataBR(dia)}</h3>
            {gruposDoDia.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Ninguém foi ao laboratório neste dia.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {gruposDoDia.map((g) => (
                  <li key={g.grupoId} className="rounded-lg border bg-card p-2.5 text-sm">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      {g.turmaId === "mista" ? (
                        <span className="flex items-center gap-1">
                          <Shuffle className="size-4 text-primary" aria-hidden /> Aula mista
                        </span>
                      ) : (
                        <Etiqueta rotulo={g.turmaRotulo} className="text-xs" />
                      )}
                      <span className="font-normal text-muted-foreground">
                        {horaNaEscola(g.inicio)}–{horaNaEscola(g.fim)} · {g.alunos.length} aluno
                        {g.alunos.length === 1 ? "" : "s"}
                      </span>
                    </p>
                    <ul className="mt-1.5 flex flex-wrap gap-1.5">
                      {g.alunos.map((a) => (
                        <li key={a.id}>
                          <button
                            type="button"
                            onClick={() => setFicha({ turmaId: a.turmaId, alunoId: a.id })}
                            className="rounded-full border bg-background px-2.5 py-0.5 text-xs hover:border-primary hover:text-primary"
                          >
                            {a.nome}
                            {g.turmaId === "mista" ? ` · ${a.turmaRotulo}` : ""}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">
              Quem foi e quem não foi · {dataCurta(de)} a {dataCurta(ate)}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                size="sm"
                variant={periodo === "mes" ? "default" : "outline"}
                onClick={() => setPeriodo("mes")}
              >
                Mês inteiro
              </Button>
              <Button
                size="sm"
                variant={periodo === "semana" ? "default" : "outline"}
                onClick={() => setPeriodo("semana")}
              >
                Semana do dia escolhido
              </Button>
              <Button size="sm" variant="outline" onClick={baixarCsv} disabled={!sessoes}>
                <Download /> Baixar relatório (CSV)
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {totalFoi} de {totalAlunos} alunos já foram ao laboratório neste período.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2">
          {sessoes === null ? (
            <div className="h-24 animate-pulse rounded-xl bg-muted lg:col-span-2" />
          ) : (
            cobertura.map(({ turma, foram, faltam, alunos, media }) => {
              const pct = alunos.length ? Math.round((foram.length / alunos.length) * 100) : 0;
              const rotulo = rotuloTurma(turma.serie, turma.letra);
              return (
                <section key={turma.id} className="space-y-2 rounded-xl border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 font-heading text-lg font-bold">
                      <Etiqueta rotulo={rotulo} className="text-sm" />
                      <span className="text-xs font-normal text-muted-foreground">
                        {turma.professorRegente}
                      </span>
                    </h3>
                    <Badge variant={foram.length === 0 ? "destructive" : "secondary"}>
                      {foram.length === 0
                        ? "turma ainda não foi"
                        : `${foram.length} de ${alunos.length}`}
                    </Badge>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${rotulo}: ${pct}% dos alunos já foram`}
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-700",
                        pct === 100 ? "bg-emerald-500" : pct > 0 ? "bg-primary" : "bg-red-500/60",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {faltam.length > 0 ? (
                    <div>
                      <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                        <CircleDashed className="size-3.5" aria-hidden /> Ainda não foram (
                        {faltam.length})
                      </p>
                      <ul className="flex flex-wrap gap-1">
                        {faltam.map((a) => (
                          <li key={a.id}>
                            <button
                              type="button"
                              onClick={() => setFicha({ turmaId: turma.id, alunoId: a.id })}
                              className="rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-xs hover:bg-amber-500/25"
                            >
                              {a.nome}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Todos já foram. 🎉
                    </p>
                  )}
                  {foram.length > 0 ? (
                    <details>
                      <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
                        Já foram ({foram.length}) · detalhes
                      </summary>
                      <table className="mt-1.5 w-full text-xs">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="py-1">Aluno</th>
                            <th>Dias</th>
                            <th>Tempo</th>
                            <th>Última</th>
                          </tr>
                        </thead>
                        <tbody>
                          {foram.map((a) => (
                            <tr key={a.id} className="border-b last:border-0">
                              <td className="py-1 pr-2">
                                <button
                                  type="button"
                                  className="text-left hover:text-primary hover:underline"
                                  onClick={() => setFicha({ turmaId: turma.id, alunoId: a.id })}
                                >
                                  {a.nome}
                                </button>
                                {a.dias > Math.max(1, Math.ceil(media)) ? (
                                  <Flame
                                    className="ml-1 inline size-3 text-red-500"
                                    aria-label="foi mais que a turma"
                                  />
                                ) : null}
                              </td>
                              <td className="pr-2 tabular-nums">{a.dias}×</td>
                              <td className="pr-2 tabular-nums">{textoMin(a.minutos)}</td>
                              <td className="tabular-nums text-muted-foreground">
                                {a.ultima ? dataCurta(a.ultima) : ""}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </details>
                  ) : null}
                </section>
              );
            })
          )}
        </CardContent>
      </Card>

      {ficha ? <FichaAluno {...ficha} aberto aoFechar={() => setFicha(null)} /> : null}
    </div>
  );
}
