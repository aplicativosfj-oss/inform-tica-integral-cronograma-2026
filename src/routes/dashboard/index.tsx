import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CalendarCheck2,
  ClipboardCheck,
  Search,
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
import { MarcarAlunosCartao } from "@/components/school/laboratorio/marcar-dialog";
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
 * Visão geral do painel.
 *
 * Organizada em três andares, do mais urgente ao mais consultado:
 * 1. cabeçalho com a saudação, os atalhos e os números do dia numa faixa só;
 * 2. o laboratório agora (aula ao vivo, próxima turma e a semana), que leva
 *    a maior parte da largura;
 * 3. à direita, o andamento da semana por turma e as ocorrências.
 * Nada tem altura fixa: cada cartão mostra tudo o que tem, sem cortar.
 * As seções do sistema ficam na lateral (e no "Mais" do celular).
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
      <div className="flex flex-col gap-4">
        <header className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur-xl sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary first-letter:uppercase">
                {dataExtenso}
              </p>
              <h1 className="mt-1 truncate text-xl font-extrabold leading-tight sm:text-2xl">
                {saudacao()}
                {email ? `, ${email.split("@")[0]}` : ""}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Gestão do laboratório · visão geral do dia
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <MarcarAlunosCartao dados={lab} compacto rotulo="Programar aula" />
              <Atalho to="/dashboard/laboratorio" Icone={MonitorSmartphone} rotulo="Laboratório" />
              <Atalho to="/dashboard/turmas" Icone={Users2} rotulo="Turmas" />
              <Atalho to="/dashboard/alunos" Icone={Search} rotulo="Buscar aluno" />
              <Atalho to="/dashboard/frequencia" Icone={ClipboardCheck} rotulo="Frequência" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 border-t border-border/60 pt-4 sm:grid-cols-3 xl:grid-cols-5">
            <Indicador Icone={Users2} rotulo="Turmas" valor={turmas.length} />
            <Indicador Icone={GraduationCap} rotulo="Alunos ativos" valor={totalAlunos} />
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
            <Indicador
              Icone={CalendarCheck2}
              rotulo={`Foram nesta semana · ${foramNaSemana} de ${totalAlunos}`}
              valor={`${pctSemana}%`}
              className="col-span-2 sm:col-span-1"
            />
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_25rem]">
          <section className="min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-sm backdrop-blur-xl">
            <PainelLaboratorioAgora dados={lab} logado className="bg-transparent" />
          </section>

          <aside className="flex min-w-0 flex-col gap-4">
            <Card className="bg-card/80 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
                <p className="flex items-center gap-2 text-sm font-bold">
                  <CalendarCheck2 className="size-4 text-primary" aria-hidden /> Semana por turma
                </p>
                <Link
                  to="/dashboard/laboratorio"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Ver tudo
                </Link>
              </div>
              <CardContent className="grid gap-2.5 p-4 sm:grid-cols-2 xl:grid-cols-1">
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
                          className={cn(
                            "h-full rounded-full transition-[width] duration-700",
                            pct >= 100 ? "bg-emerald-500" : "bg-primary",
                          )}
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

            <OcorrenciasAdministrativas className="bg-card/80 backdrop-blur-xl" />
          </aside>
        </div>

        {/* No celular e no tablet não há lateral: as seções aparecem aqui. */}
        <Card className="bg-card/80 lg:hidden">
          <div className="border-b border-border/60 px-4 py-3">
            <p className="text-sm font-bold">Áreas do painel</p>
            <p className="text-xs text-muted-foreground">Tudo o que o sistema faz, à mão</p>
          </div>
          <CardContent className="space-y-3 p-3">
            {GRUPOS_VISIVEIS.filter((g) => g.label).map((grupo) => (
              <div key={grupo.label}>
                <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                  {grupo.label}
                </p>
                <div className="grid gap-1 sm:grid-cols-2">
                  {grupo.items.map(({ to, label, desc, icon: Icone }) => (
                    <Link
                      key={to}
                      to={to}
                      title={desc ?? label}
                      className="group flex items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-2 transition-colors hover:border-primary/25 hover:bg-primary/[0.06]"
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg",
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
      </div>
    </DashboardShell>
  );
}

function Atalho({ to, Icone, rotulo }: { to: string; Icone: LucideIcon; rotulo: string }) {
  return (
    <Button asChild size="sm" variant="outline" className="h-9 rounded-full px-3">
      <Link to={to}>
        <Icone className="size-4" /> {rotulo}
      </Link>
    </Button>
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
  className,
}: {
  Icone: LucideIcon;
  rotulo: string;
  valor: number | string;
  destaque?: "verde" | "vermelho" | undefined;
  className?: string | undefined;
}) {
  return (
    <Card
      className={cn(
        "bg-background/40 shadow-none",
        className,
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
          <p className="mt-1 truncate text-[11px] leading-tight text-muted-foreground">{rotulo}</p>
        </div>
      </CardContent>
    </Card>
  );
}
