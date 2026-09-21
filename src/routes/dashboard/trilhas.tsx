import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Star, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DashboardShell } from "@/components/school/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/lib/app-store";
import { CATALOGO, NIVEIS, NOME_DISC, type Nivel } from "@/lib/recomposicao/catalogo";
import { supabase } from "@/lib/supabase-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/trilhas")({
  component: ProgressoTrilhas,
  head: () => ({
    meta: [
      { title: "Progresso das trilhas · Painel de gestão" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

interface Linha {
  aluno_id: string;
  atividade_id: string;
  nivel: Nivel;
  estrelas: number;
  acertos: number;
  total: number;
  tentativas: number;
  atualizado_em: string;
}

const TITULO = new Map(CATALOGO.map((e) => [e.id, e]));

/**
 * Acompanhamento da “Minha trilha”: estrelas e atividades de cada aluno da
 * turma. Fica no painel de gestão porque só quem entra com login lê a
 * tabela de progresso (os alunos acessam o próprio progresso pelo PIN).
 */
function ProgressoTrilhas() {
  const { turmas } = useAppStore();
  const ordenadas = useMemo(
    () => [...turmas].sort((a, b) => `${a.serie}${a.letra}`.localeCompare(`${b.serie}${b.letra}`)),
    [turmas],
  );
  const [turmaId, setTurmaId] = useState<string>("");
  const turma = ordenadas.find((t) => t.id === turmaId) ?? ordenadas[0];
  const [linhas, setLinhas] = useState<Linha[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!turma) return;
    setLinhas(null);
    supabase
      .from("recomposicao_progresso")
      .select("*")
      .in(
        "aluno_id",
        turma.alunos.map((a) => a.id),
      )
      .then(({ data, error }) => {
        if (error) setErro(error.message);
        else setLinhas((data ?? []) as Linha[]);
      });
  }, [turma]);

  const porAluno = useMemo(() => {
    const m = new Map<string, Linha[]>();
    for (const l of linhas ?? []) m.set(l.aluno_id, [...(m.get(l.aluno_id) ?? []), l]);
    return m;
  }, [linhas]);

  const ativos = turma ? turma.alunos.filter((a) => porAluno.has(a.id)).length : 0;
  const estrelasTurma = (linhas ?? []).reduce((s, l) => s + l.estrelas, 0);

  return (
    <DashboardShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Target className="size-6 text-primary" /> Progresso das trilhas
          </h1>
          <p className="text-sm text-muted-foreground">
            Estrelas que cada aluno ganhou na “Minha trilha” (atividades de recomposição).
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          Turma
          <select
            id="turma-trilhas"
            className="rounded-md border border-border bg-background px-3 py-2"
            value={turma?.id ?? ""}
            onChange={(e) => setTurmaId(e.target.value)}
          >
            {ordenadas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.serie} {t.letra}
              </option>
            ))}
          </select>
        </label>
      </div>

      {erro ? <p className="text-sm text-destructive">Não foi possível carregar: {erro}</p> : null}

      {!turma || linhas === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold">
                  {ativos} <span className="text-base font-normal text-muted-foreground">de {turma.alunos.length}</span>
                </p>
                <p className="text-xs text-muted-foreground">alunos já começaram a trilha</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold">{estrelasTurma}</p>
                <p className="text-xs text-muted-foreground">estrelas ganhas pela turma</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold">{linhas.filter((l) => l.estrelas >= 2).length}</p>
                <p className="text-xs text-muted-foreground">atividades concluídas (2 estrelas ou mais)</p>
              </CardContent>
            </Card>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Aluno</th>
                  <th className="px-3 py-2 text-right">Estrelas</th>
                  <th className="px-3 py-2">Atividades feitas</th>
                  <th className="px-3 py-2">Última vez</th>
                </tr>
              </thead>
              <tbody>
                {[...turma.alunos]
                  .sort((a, b) => a.nome.localeCompare(b.nome))
                  .map((a) => {
                    const ls = (porAluno.get(a.id) ?? []).sort((x, y) => (x.atualizado_em < y.atualizado_em ? 1 : -1));
                    const est = ls.reduce((s, l) => s + l.estrelas, 0);
                    return (
                      <tr key={a.id} className="border-t border-border align-top">
                        <td className="px-3 py-2 font-medium">{a.nome}</td>
                        <td className="px-3 py-2 text-right">
                          <span className="inline-flex items-center gap-1 font-semibold">
                            {est} <Star className="size-3.5 fill-amber-400 text-amber-500" />
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {ls.length ? (
                            <div className="flex flex-wrap gap-1.5">
                              {ls.map((l) => {
                                const e = TITULO.get(l.atividade_id);
                                const n = NIVEIS.find((x) => x.id === l.nivel);
                                return (
                                  <span
                                    key={`${l.atividade_id}-${l.nivel}`}
                                    title={`${e ? NOME_DISC[e.disc] : ""} · ${n?.nome ?? l.nivel} · ${l.acertos}/${l.total} · ${l.tentativas} tentativa(s)`}
                                    className={cn(
                                      "rounded-full px-2 py-0.5 text-xs",
                                      l.estrelas >= 2
                                        ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                                        : "bg-amber-500/15 text-amber-800 dark:text-amber-300",
                                    )}
                                  >
                                    {e?.emoji} {e?.titulo ?? l.atividade_id} {n?.emoji} {"★".repeat(l.estrelas)}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">ainda não começou</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {ls[0] ? new Date(ls[0].atualizado_em).toLocaleDateString("pt-BR") : "—"}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
