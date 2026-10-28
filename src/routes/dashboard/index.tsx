import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarCheck2,
  GraduationCap,
  MonitorSmartphone,
  UserX,
  Users2,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";

import { DashboardShell } from "@/components/school/dashboard-shell";
import { rotuloTurma } from "@/components/school/laboratorio/ficha-aluno";
import { PainelLaboratorioAgora } from "@/components/school/laboratorio/painel-agora";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function saudacao() {
  const h = Number(
    new Intl.DateTimeFormat("pt-BR", { hour: "numeric", timeZone: "America/Rio_Branco" }).format(
      new Date(),
    ),
  );
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

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

  const dataExtenso = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Rio_Branco",
  }).format(new Date());

  return (
    <DashboardShell>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary first-letter:uppercase">
            {dataExtenso}
          </p>
          <h1>
            {saudacao()}
            {email ? `, ${email.split("@")[0]}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            Tudo o que acontece na informática, num lugar só.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/dashboard/laboratorio">
            <MonitorSmartphone /> Marcar alunos no laboratório
          </Link>
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador Icone={Users2} rotulo="Turmas" valor={turmas.length} />
        <Indicador Icone={GraduationCap} rotulo="Alunos cadastrados" valor={totalAlunos} />
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

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="self-start">
          <PainelLaboratorioAgora dados={lab} logado />
        </div>

        <Card className="self-start">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck2 className="size-4 text-primary" aria-hidden /> Laboratório nesta
              semana
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {foramNaSemana} de {totalAlunos} alunos já foram
            </p>
          </CardHeader>
          <CardContent className="space-y-2.5">
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
                  <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {foram}/{total}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <section aria-label="Áreas do painel" className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Áreas do painel
        </h2>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {GRUPOS_VISIVEIS.filter((g) => g.label).map((grupo) => (
            <Card key={grupo.label} className="bg-card/80">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm">{grupo.label}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-0.5 pb-3">
                {grupo.items.map(({ to, label, desc, icon: Icone }) => (
                  <Link
                    key={to}
                    to={to}
                    className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/70"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icone className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{label}</span>
                      {desc ? (
                        <span className="block truncate text-xs text-muted-foreground">{desc}</span>
                      ) : null}
                    </span>
                    <ArrowRight
                      className="size-4 shrink-0 text-muted-foreground/50 transition group-hover:translate-x-0.5 group-hover:text-primary"
                      aria-hidden
                    />
                  </Link>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
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
      <CardContent className="flex items-center gap-3 p-4">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            destaque === "verde"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : destaque === "vermelho"
                ? "bg-red-500/15 text-red-600 dark:text-red-400"
                : "bg-primary/10 text-primary",
          )}
        >
          <Icone className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-bold leading-none tabular-nums">{valor}</p>
          <p className="mt-1 text-xs leading-tight text-muted-foreground">{rotulo}</p>
        </div>
      </CardContent>
    </Card>
  );
}
