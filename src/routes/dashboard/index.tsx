import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CalendarCheck2,
  GraduationCap,
  MonitorSmartphone,
  UserX,
  Users2,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";

import { DashboardShell } from "@/components/school/dashboard-shell";
import { OcorrenciasAdministrativas } from "@/components/school/ocorrencias-administrativas";
import { rotuloTurma } from "@/components/school/laboratorio/ficha-aluno";
import { PainelLaboratorioAgora } from "@/components/school/laboratorio/painel-agora";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/lib/app-store";
import { useAuth } from "@/lib/auth-store";
import {
  estadoDaSessao,
  fimDaSemana,
  hojeNaEscola,
  inicioDaSemana,
  useAgora,
  useSessoesLab,
} from "@/lib/laboratorio";
import { GRUPOS_VISIVEIS } from "@/lib/painel-secoes";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
  head: () => ({
    meta: [
      { title: "Painel de gestão · Informática Dr. Eiraldo" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

/**
 * Visão geral do painel, pensada para caber numa tela só.
 *
 * No computador a página não rola: ela ocupa a altura da janela e quem rola
 * é cada cartão por dentro. É o que transforma a home em um quadro de
 * acompanhamento — o professor bate o olho e vê a aula ao vivo, a semana e
 * os atalhos sem perder nada abaixo da dobra. No celular a mesma estrutura
 * se empilha e volta a rolar normalmente, que é o gesto natural ali.
 */
function DashboardHome() {
  const { turmas } = useAppStore();
  const lab = useSessoesLab();
  const { email } = useAuth();
  const agora = useAgora(15_000);
  const hoje = hojeNaEscola();
  const [s0, s1] = [inicioDaSemana(hoje), fimDaSemana(hoje)];

  const totalAlunos = turmas.reduce((n, t) => n + t.alunos.length, 0);
  const noLabAgora = new Set(
    lab.sessoes
      .filter((s) => estadoDaSessao(s, agora) === "ao-vivo")
      .map((s) => `${s.turmaId}:${s.alunoId}`),
  ).size;
  const faltasHoje = (lab.ausencias ?? []).filter((s) => s.data === hoje).length;

  /** Por turma: quantos alunos já foram ao laboratório nesta semana. */
  const semana = useMemo(() => {
    const foram = new Set(
      lab.sessoes
        .filter((s) => s.data >= s0 && s.data <= s1)
        .map((s) => `${s.turmaId}:${s.alunoId}`),
    );
    return turmas.map((t) => {
      const n = t.alunos.filter((a) => foram.has(`${t.id}:${a.id}`)).length;
      return { turma: t, foram: n, total: t.alunos.length };
    });
  }, [lab.sessoes, turmas, s0, s1]);
  const foramNaSemana = semana.reduce((n, x) => n + x.foram, 0);
  const pctSemana = totalAlunos ? Math.round((foramNaSemana / totalAlunos) * 100) : 0;

  const dataExtenso = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Rio_Branco",
  }).format(new Date());

  return (
    <DashboardShell>
      <div className="flex flex-col gap-3.5 lg:h-[calc(100dvh-12.5rem)] lg:min-h-[34rem]">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary first-letter:uppercase">
              {dataExtenso}
            </p>
            <h1 className="truncate text-xl font-bold leading-tight sm:text-2xl">
              {saudacao()}
              {email ? `, ${email.split("@")[0]}` : ""}
            </h1>
          </div>
          <Button asChild size="sm" className="gap-2">
            <Link to="/dashboard/laboratorio">
              <MonitorSmartphone className="size-4" /> Marcar alunos no laboratório
            </Link>
          </Button>
        </header>

        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <Indicador Icone={Users2} rotulo="Turmas" valor={turmas.length} />
          <Indicador Icone={GraduationCap} rotulo="Alunos" valor={totalAlunos} />
          <Indicador
            Icone={MonitorSmartphone}
            rotulo="No laboratório agora"
            valor={noLabAgora}
            destaque={noLabAgora > 0 ? "verde" : undefined}
          />
          <Indicador
            Icone={UserX}
            rotulo="Faltas e impedidos hoje"
            valor={faltasHoje}
            destaque={faltasHoje > 0 ? "vermelho" : undefined}
          />
        </div>

        <div className="grid min-h-0 flex-1 gap-3.5 lg:grid-cols-2 xl:grid-cols-12">
          {/* A aula ao vivo é o que mais se olha: fica na coluna maior e
              rola por dentro, para nunca empurrar o resto da tela. */}
          <section className="flex min-h-0 flex-col lg:col-span-1 xl:col-span-5">
            <PainelLaboratorioAgora dados={lab} logado rolar className="min-h-0 flex-1" />
          </section>

          <div className="flex min-h-0 flex-col gap-3.5 lg:col-span-1 xl:col-span-3">
            <Card className="flex min-h-0 flex-1 flex-col bg-card/80">
              <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
                <p className="flex items-center gap-2 text-sm font-bold">
                  <CalendarCheck2 className="size-4 text-primary" aria-hidden /> Semana no
                  laboratório
                </p>
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold tabular-nums text-primary">
                  {pctSemana}%
                </span>
              </div>
              <CardContent className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-4">
                <p className="text-xs text-muted-foreground">
                  {foramNaSemana} de {totalAlunos} alunos já foram
                </p>
                {semana.map(({ turma, foram, total }) => {
                  const cor = serieClasses(serieIndexPorNumero(turma.serie));
                  const pct = total ? Math.round((foram / total) * 100) : 0;
                  return (
                    <div key={turma.id} className="flex items-center gap-2.5 text-sm">
                      <span
                        className={cn(
                          "w-10 shrink-0 rounded-md py-0.5 text-center text-xs font-bold",
                          cor.bg,
                          cor.text,
                        )}
                      >
                        {rotuloTurma(turma.serie, turma.letra)}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-[width] duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-11 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                        {foram}/{total}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <OcorrenciasAdministrativas className="max-h-[14rem] shrink-0 overflow-y-auto" />
          </div>

          {/* Atalhos: todo o painel numa grade pequena, em vez da lista
              comprida que antes ficava abaixo da dobra. */}
          <section className="flex min-h-0 flex-col lg:col-span-2 xl:col-span-4">
            <Card className="flex min-h-0 flex-1 flex-col bg-card/80">
              <div className="border-b border-border/60 px-4 py-3">
                <p className="text-sm font-bold">Áreas do painel</p>
                <p className="text-xs text-muted-foreground">Tudo o que o sistema faz, à mão</p>
              </div>
              <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                {GRUPOS_VISIVEIS.filter((g) => g.label).map((grupo) => (
                  <div key={grupo.label}>
                    <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                      {grupo.label}
                    </p>
                    <div className="grid gap-1">
                      {grupo.items.map(({ to, label, desc, icon: Icone }) => (
                        <Link
                          key={to}
                          to={to}
                          title={desc ?? label}
                          className={cn(
                            "group flex items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-2 transition-colors",
                            "hover:border-primary/25 hover:bg-primary/[0.06]",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                              COR_DO_GRUPO[grupo.label ?? ""] ?? "bg-primary/10 text-primary",
                            )}
                          >
                            <Icone className="size-4" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-semibold leading-tight">
                              {label}
                            </span>
                            {desc ? (
                              <span className="block truncate text-[11px] leading-tight text-muted-foreground">
                                {desc}
                              </span>
                            ) : null}
                          </span>
                          <ArrowUpRight
                            className="size-3.5 shrink-0 text-muted-foreground/40 transition group-hover:translate-x-0.5 group-hover:text-primary"
                            aria-hidden
                          />
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}

/** Cada grupo tem a própria cor: o olho acha a seção antes de ler o nome. */
const COR_DO_GRUPO: Record<string, string> = {
  Cadastro: "bg-sky-500/12 text-sky-600 dark:text-sky-400",
  Rotina: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
  Pedagógico: "bg-violet-500/12 text-violet-600 dark:text-violet-400",
  Sistema: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
};

function saudacao() {
  const h = Number(
    new Intl.DateTimeFormat("pt-BR", { hour: "numeric", timeZone: "America/Rio_Branco" }).format(
      new Date(),
    ),
  );
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

function Indicador({
  Icone,
  rotulo,
  valor,
  destaque,
}: {
  Icone: LucideIcon;
  rotulo: string;
  valor: number;
  destaque?: "verde" | "vermelho" | undefined;
}) {
  return (
    <Card
      className={cn(
        "bg-card/80",
        destaque === "verde" && "border-emerald-500/40",
        destaque === "vermelho" && "border-red-500/40",
      )}
    >
      <CardContent className="flex items-center gap-2.5 p-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            destaque === "verde"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : destaque === "vermelho"
                ? "bg-red-500/15 text-red-600 dark:text-red-400"
                : "bg-primary/10 text-primary",
          )}
        >
          <Icone className="size-[18px]" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-xl font-bold leading-none tabular-nums">{valor}</p>
          <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{rotulo}</p>
        </div>
      </CardContent>
    </Card>
  );
}
