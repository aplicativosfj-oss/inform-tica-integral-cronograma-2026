import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Gauge, Info, Loader2, Minus } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import { DashboardShell } from "@/components/school/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/lib/app-store";
import { supabase } from "@/lib/supabase-client";
import type { Turma } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/indicadores")({
  component: Indicadores,
  head: () => ({
    meta: [
      { title: "Indicadores das turmas · Painel de gestão" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

interface TurmaAval {
  ano: number;
  turma: string;
  disc: string;
  alunos: { nome: string; r: string }[];
}

/**
 * Faixas de desenvolvimento da turma. A linguagem é de percurso (onde a
 * turma está e qual o próximo passo), nunca de disputa entre turmas.
 */
const FAIXAS = [
  { min: 8.5, nome: "Consolidado", cor: "stroke-emerald-700 dark:stroke-emerald-400", fundo: "bg-emerald-50 dark:bg-emerald-500/10", texto: "text-emerald-900 dark:text-emerald-100", frase: "A turma domina a maior parte do que foi avaliado. Hora de aprofundar e manter o ritmo." },
  { min: 7, nome: "Consolidando", cor: "stroke-teal-700 dark:stroke-teal-400", fundo: "bg-teal-50 dark:bg-teal-500/10", texto: "text-teal-900 dark:text-teal-100", frase: "Bom caminho. Poucas habilidades pedem retomada; vale focar nelas." },
  { min: 5, nome: "Em desenvolvimento", cor: "stroke-blue-700 dark:stroke-blue-400", fundo: "bg-blue-50 dark:bg-blue-500/10", texto: "text-blue-900 dark:text-blue-100", frase: "A turma avança. Trilhas e grupos de apoio fazem diferença agora." },
  { min: 0, nome: "Em construção", cor: "stroke-violet-700 dark:stroke-violet-400", fundo: "bg-violet-50 dark:bg-violet-500/10", texto: "text-violet-900 dark:text-violet-100", frase: "Momento de apoio intensivo: retomada com material concreto e acompanhamento próximo." },
] as const;
const faixaDe = (n: number) => FAIXAS.find((f) => n >= f.min) ?? FAIXAS[3];

const pctDe = (r: string) => (100 * [...r].filter((c) => c === "C").length) / r.length;

/** Medidor semicircular em SVG (0 a 10). */
function Medidor({ nota, cor }: { nota: number; cor: string }) {
  const f = Math.max(0, Math.min(1, nota / 10));
  const R = 42,
    comp = Math.PI * R;
  return (
    <svg viewBox="0 0 100 60" className="w-32" role="img" aria-label={`Nota ${nota.toFixed(1)} de 10`}>
      <path d="M8 54 A42 42 0 0 1 92 54" fill="none" className="stroke-muted" strokeWidth="9" strokeLinecap="round" />
      <path d="M8 54 A42 42 0 0 1 92 54" fill="none" className={cor} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${comp * f} ${comp}`} />
      <text x="50" y="50" textAnchor="middle" className="fill-foreground" style={{ font: "800 20px ui-sans-serif, system-ui" }}>
        {nota.toFixed(1)}
      </text>
    </svg>
  );
}

function Barra({ rotulo, valor, peso, ajuda }: { rotulo: string; valor: number; peso: string; ajuda: string }) {
  return (
    <div className="flex flex-col gap-1" title={ajuda}>
      <div className="flex justify-between text-xs">
        <span className="font-medium text-foreground">
          {rotulo} <span className="text-muted-foreground">({peso})</span>
        </span>
        <b className="tabular-nums text-foreground">{Math.round(valor)}%</b>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, valor))}%` }} />
      </div>
    </div>
  );
}

function Indicadores() {
  const { turmas } = useAppStore();
  const [aval, setAval] = useState<TurmaAval[] | null>(null);
  const [progresso, setProgresso] = useState<{ aluno_id: string; estrelas: number }[] | null>(null);
  const [sims, setSims] = useState<{ id: string; turma_id: string; encerrado_em: string | null; titulo: string }[] | null>(null);
  const [resp, setResp] = useState<{ simulado_id: string; aluno_id: string; acertos: number; total: number }[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [a, p, s] = await Promise.all([
        supabase.from("avaliacao_diagnostica").select("dados").eq("id", "2026-II").maybeSingle(),
        supabase.from("recomposicao_progresso").select("aluno_id, estrelas"),
        supabase.from("simulados").select("id, turma_id, encerrado_em, titulo").eq("status", "encerrado"),
      ]);
      const falha = a.error ?? p.error ?? s.error;
      if (falha) {
        setErro(falha.message);
        return;
      }
      setAval((a.data?.dados as TurmaAval[] | undefined) ?? []);
      setProgresso((p.data ?? []) as { aluno_id: string; estrelas: number }[]);
      const lista = (s.data ?? []) as { id: string; turma_id: string; encerrado_em: string | null; titulo: string }[];
      setSims(lista);
      const r = lista.length
        ? await supabase.from("simulado_respostas").select("simulado_id, aluno_id, acertos, total").in("simulado_id", lista.map((x) => x.id))
        : { data: [], error: null };
      if (r.error) setErro(r.error.message);
      else setResp((r.data ?? []) as { simulado_id: string; aluno_id: string; acertos: number; total: number }[]);
    })();
  }, []);

  const cartoes = useMemo(() => {
    if (!aval || !progresso || !sims || !resp) return null;
    return turmas
      .filter((t) => {
        const n = Number.parseInt(t.serie, 10);
        return n >= 1 && n <= 5;
      })
      .sort((a, b) => `${a.serie}${a.letra}`.localeCompare(`${b.serie}${b.letra}`))
      .map((t) => calcular(t, aval, progresso, sims, resp));
  }, [turmas, aval, progresso, sims, resp]);

  return (
    <DashboardShell>
      <div className="mb-5">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
          <Gauge className="size-6 text-primary" /> Indicadores das turmas
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Uma nota de 0 a 10 para acompanhar o desenvolvimento de cada turma e decidir onde intervir. Cada turma é
          comparada com ela mesma, desde a II Avaliação Diagnóstica. Não há ranking entre turmas.
        </p>
      </div>

      <Card className="mb-5 border-primary/20">
        <CardContent className="flex gap-3 p-4 text-sm text-foreground">
          <Info className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="flex flex-col gap-1">
            <p>
              <b>Como a nota é calculada:</b> Aprendizagem (60%) é a média de acertos nos simulados encerrados; enquanto
              não houver simulado, vale a II Avaliação Diagnóstica. Participação (20%) é a parte da turma que já usou a
              trilha ou fez simulado. Conclusão (20%) usa a meta de 2 atividades concluídas por aluno.
            </p>
            <p className="text-muted-foreground">
              Faixas: Em construção (abaixo de 5) · Em desenvolvimento (5 a 6,9) · Consolidando (7 a 8,4) · Consolidado
              (8,5 ou mais).
            </p>
          </div>
        </CardContent>
      </Card>

      {erro ? <p className="text-sm text-destructive">Não foi possível carregar: {erro}</p> : null}
      {!cartoes && !erro ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {cartoes?.map((c) => {
          const f = faixaDe(c.nota);
          return (
            <Card key={c.turma.id} className="overflow-hidden">
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-foreground">
                      {Number.parseInt(c.turma.serie, 10)}º {c.turma.letra}
                    </p>
                    <p className="text-xs text-muted-foreground">{c.turma.professorRegente}</p>
                    <span className={cn("mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold", f.fundo, f.texto)}>{f.nome}</span>
                  </div>
                  <Medidor nota={c.nota} cor={f.cor} />
                </div>

                <p className={cn("rounded-lg px-3 py-2 text-sm", f.fundo, f.texto)}>{f.frase}</p>

                <div className="flex flex-col gap-2.5">
                  <Barra rotulo="Aprendizagem" peso="60%" valor={c.aprendizagem} ajuda={c.fonteAprendizagem} />
                  <Barra rotulo="Participação" peso="20%" valor={c.participacao} ajuda="Alunos que já usaram a trilha ou fizeram simulado" />
                  <Barra rotulo="Conclusão" peso="20%" valor={c.conclusao} ajuda="Meta: 2 atividades concluídas por aluno" />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <Mini rotulo="Diagnóstica" valor={c.diagnostica == null ? "—" : `${Math.round(c.diagnostica)}%`} />
                  <Mini rotulo="Simulados" valor={c.nSimulados ? `${c.nSimulados} · ${Math.round(c.mediaSimulados!)}%` : "nenhum"} />
                  <Mini
                    rotulo="Evolução"
                    valor={
                      c.evolucao == null ? (
                        "—"
                      ) : (
                        <span className="inline-flex items-center gap-0.5">
                          {c.evolucao > 1 ? <ArrowUpRight className="size-3.5" /> : c.evolucao < -1 ? <ArrowDownRight className="size-3.5" /> : <Minus className="size-3.5" />}
                          {c.evolucao > 0 ? "+" : ""}
                          {Math.round(c.evolucao)} pts
                        </span>
                      )
                    }
                  />
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Próximo passo</p>
                  <p className="text-sm text-foreground">{c.proximo}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardShell>
  );
}

function Mini({ rotulo, valor }: { rotulo: string; valor: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-2 py-2">
      <p className="text-muted-foreground">{rotulo}</p>
      <p className="font-bold tabular-nums text-foreground">{valor}</p>
    </div>
  );
}

function calcular(
  t: Turma,
  aval: TurmaAval[],
  progresso: { aluno_id: string; estrelas: number }[],
  sims: { id: string; turma_id: string; encerrado_em: string | null }[],
  resp: { simulado_id: string; aluno_id: string; acertos: number; total: number }[],
) {
  const serie = Number.parseInt(t.serie, 10);
  const ids = new Set(t.alunos.map((a) => a.id));
  const n = Math.max(1, t.alunos.length);

  // Diagnóstica: média dos alunos que fizeram a prova, nas três disciplinas.
  const notas = aval
    .filter((x) => x.ano === serie && x.turma.toUpperCase() === t.letra.toUpperCase())
    .flatMap((x) => x.alunos.filter((a) => !a.r.includes("-") && !a.nome.startsWith("Linha")).map((a) => pctDe(a.r)));
  const diagnostica = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null;

  // Simulados encerrados da turma (os 3 mais recentes).
  const meus = sims
    .filter((s) => s.turma_id === t.id)
    .sort((a, b) => (a.encerrado_em ?? "").localeCompare(b.encerrado_em ?? ""))
    .slice(-3);
  const medias = meus
    .map((s) => {
      const rs = resp.filter((r) => r.simulado_id === s.id && r.total > 0);
      return rs.length ? rs.reduce((a, r) => a + (100 * r.acertos) / r.total, 0) / rs.length : null;
    })
    .filter((x): x is number => x != null);
  const mediaSimulados = medias.length ? medias.reduce((a, b) => a + b, 0) / medias.length : null;

  const aprendizagem = mediaSimulados ?? diagnostica ?? 0;
  const fonteAprendizagem = mediaSimulados != null ? "Média dos simulados encerrados" : "II Avaliação Diagnóstica (ainda sem simulados)";

  const prog = progresso.filter((p) => ids.has(p.aluno_id));
  const ativos = new Set([...prog.map((p) => p.aluno_id), ...resp.filter((r) => ids.has(r.aluno_id)).map((r) => r.aluno_id)]);
  const participacao = (100 * ativos.size) / n;
  const concluidas = prog.filter((p) => p.estrelas >= 2).length;
  const conclusao = Math.min(100, (100 * concluidas) / (2 * n));

  const nota = (0.6 * aprendizagem + 0.2 * participacao + 0.2 * conclusao) / 10;
  const evolucao = mediaSimulados != null && diagnostica != null ? mediaSimulados - diagnostica : null;

  const fracos = [
    { k: "aprendizagem", v: aprendizagem, txt: "Priorizar as habilidades com menos acertos no último simulado (veja “O que retomar” em Simulados) e formar grupos de apoio pelo Plano de ação." },
    { k: "participacao", v: participacao, txt: "Levar a turma ao laboratório para começar a “Minha trilha”: cada aluno entra com o PIN e já recebe as atividades dele." },
    { k: "conclusao", v: conclusao, txt: "Reservar alguns minutos da aula de informática para os alunos concluírem as atividades da trilha e ganharem estrelas." },
  ].sort((a, b) => a.v - b.v);
  const proximo =
    mediaSimulados == null && aprendizagem < 85
      ? "Aplicar um simulado curto para medir o avanço desde a II Avaliação Diagnóstica. " + fracos[0]!.txt
      : fracos[0]!.txt;

  return {
    turma: t,
    nota,
    aprendizagem,
    fonteAprendizagem,
    participacao,
    conclusao,
    diagnostica,
    mediaSimulados,
    nSimulados: medias.length,
    evolucao,
    proximo,
  };
}
