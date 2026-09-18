import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarClock,
  CalendarDays,
  ChevronRight,
  Clock3,
  Gamepad2,
  GraduationCap,
  LayoutDashboard,
  MonitorSmartphone,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  Timer,
  Users2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveSessionPanel } from "@/components/school/live-session-panel";
import { NavBar } from "@/components/school/nav-bar";
import { PreviaAlunosDialog } from "@/components/school/previa-alunos-dialog";
import { SiteFooter } from "@/components/school/site-footer";
import { WeeklyScheduleGraphic } from "@/components/school/weekly-schedule-graphic";
import { useAppStore } from "@/lib/app-store";
import {
  aplicarExcecoesDeData,
  buildWeeklySchedule,
  currentWeekdayLabel,
  nextAssignmentsForDay,
  proximaDataDoDia,
  proximoDiaLetivo,
  suspensaoKey,
  toDateKey,
} from "@/lib/schedule-engine";
import type { Assignment } from "@/lib/types";
import heroImg from "@/assets/hero-pro.jpg";
import backgroundImg from "@/assets/page-bg.jpg";
import logoFull from "@/assets/logo-full-transparent.png";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      {
        title: "Agenda de Informática · Dr. Eiraldo Carneiro de França",
      },
      {
        name: "description",
        content:
          "Agenda profissional das aulas de informática: cronograma automático, revezamento por grupos e cronômetro ao vivo.",
      },
      { property: "og:title", content: "Agenda de Informática · Dr. Eiraldo Carneiro de França" },
      {
        property: "og:description",
        content:
          "Agenda profissional das aulas de informática: cronograma automático, revezamento por grupos e cronômetro ao vivo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: "Escola Municipal em Tempo Integral Dr. Eiraldo Carneiro de França",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Rua Ernane Moreira Braga, 108, Cohab",
            addressCountry: "BR",
          },
        }),
      },
    ],
  }),
});

function Index() {
  const { turmas, config } = useAppStore();
  const totalAlunos = turmas.reduce((sum, t) => sum + t.alunos.length, 0);

  return (
    <div className="relative min-h-screen bg-background">
      {/*
        Imagem de fundo em toda a página, fixa e bem discreta — opacidade baixa
        (0.12) mais um véu na cor do fundo por cima, para nunca competir com o
        hero, o cronômetro ao vivo ou a grade da agenda semanal.
      */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center opacity-[0.12]"
        style={{ backgroundImage: `url(${backgroundImg})` }}
      />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-background/70" />
      <div className="relative z-10">
        <NavBar />

        <section className="relative overflow-hidden border-b border-border/60">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_-10%,color-mix(in_oklch,var(--primary)_22%,transparent),transparent_55%),radial-gradient(circle_at_100%_15%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_50%),linear-gradient(180deg,transparent_70%,var(--background)_100%)]"
          />
          {/* Yellow accent stripe, echoing the school's brand colors from the printed materials. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 -z-10 size-56 rotate-45 bg-amber-400/25"
          />
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-14">
            <div>
              <Badge variant="secondary" className="mb-4 gap-1.5">
                <MonitorSmartphone className="size-3.5" /> Agenda online
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Informática na <span className="text-primary">Escola</span>
              </h1>
              <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
                Cronograma automático por turma, revezamento justo entre alunos nos{" "}
                {config.numeroComputadores} computadores e cronômetro ao vivo — com o professor{" "}
                {config.professorInformatica}.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/agenda">
                    <CalendarClock /> Ver agenda da semana
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/dashboard">
                    <LayoutDashboard /> Painel de gestão
                  </Link>
                </Button>
              </div>

              <dl className="mt-8 grid grid-cols-2 gap-3 rounded-2xl border border-white/40 bg-white/30 p-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-muted-foreground">Turmas</dt>
                  <dd className="text-2xl font-semibold text-foreground">{turmas.length}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Alunos cadastrados</dt>
                  <dd className="text-2xl font-semibold text-foreground">{totalAlunos}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Computadores</dt>
                  <dd className="text-2xl font-semibold text-foreground">
                    {config.numeroComputadores}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Horário das aulas</dt>
                  <dd className="text-2xl font-semibold text-foreground">
                    {config.horaInicio}–{config.horaFim}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-primary/10 blur-2xl" aria-hidden />
              {/* Logo flutuante, sem ocupar espaço no fluxo — não empurra nada da hero. */}
              <img
                src={logoFull}
                alt="Agenda de Informática .Online"
                className="absolute -left-3 -top-3 z-10 h-auto w-28 rounded-xl border border-white/40 bg-white/80 p-2 shadow-lg backdrop-blur-md sm:w-32"
              />
              <img
                src={heroImg}
                alt="Tela do sistema de agenda de informática com cronograma, cronômetro e grupos de alunos"
                width={1600}
                height={912}
                className="relative rounded-2xl border border-border/60 bg-card shadow-2xl"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
          <NovoCronogramaBanner />
          <LiveSessionPanel />
          <ProximasTurmasPanel />
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="mb-6 max-w-2xl">
            <h2 className="text-2xl font-semibold text-foreground">Como a agenda organiza tudo</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Grupos de {config.numeroComputadores} alunos revezam a cada{" "}
              {config.duracaoGrupoMinutos} minutos, dentro de janelas de {config.duracaoSlotMinutos}{" "}
              minutos por turma, de {config.horaInicio} às {config.horaFim}.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Gamepad2 className="size-5" />}
              iconClassName="bg-blue-500/10 text-blue-600"
              title="Aprendizado digital"
              description="Tecnologia que estimula o raciocínio e a criatividade."
            />
            <FeatureCard
              icon={<CalendarClock className="size-5" />}
              iconClassName="bg-violet-500/10 text-violet-600"
              title="Rodízio automático"
              description="O sistema distribui e gira os grupos sozinho, sem favorecer ninguém."
            />
            <FeatureCard
              icon={<Timer className="size-5" />}
              iconClassName="bg-amber-500/10 text-amber-600"
              title="Cronômetro ao vivo"
              description="Contagem regressiva em tempo real de quando o grupo troca."
            />
            <FeatureCard
              icon={<ShieldCheck className="size-5" />}
              iconClassName="bg-emerald-500/10 text-emerald-600"
              title="Painel de gestão"
              description="Turmas, professores, fotos e alunos com acesso restrito por login."
            />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="mb-5 max-w-2xl">
            <Badge variant="secondary" className="mb-3 gap-1.5">
              <CalendarDays className="size-3.5" /> Grade completa
            </Badge>
            <h2 className="text-2xl font-semibold text-foreground">
              A semana inteira, num só olhar
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Cada cor representa uma série (do 1º ao 5º ano) — quanto mais escura, mais adiantada a
              turma. Gerado automaticamente a partir da agenda cadastrada no sistema.
            </p>
          </div>
          <div className="relative">
            <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-6">
              <div className="min-w-[720px]">
                <WeeklyScheduleGraphic />
              </div>
            </div>
            {/* Pista visual de que dá para arrastar o dedo para o lado — a grade
              é mais larga que a tela em celulares, mas nada nela indicava
              isso, então parecia "cortada" em vez de rolável. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-4 right-4 w-10 rounded-r-2xl bg-gradient-to-l from-card to-transparent sm:hidden"
            />
            <p className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground sm:hidden">
              <ChevronRight className="size-3.5" /> Deslize para o lado para ver a semana inteira
            </p>
          </div>
        </section>

        <ProgramacaoSemanalDestaque />

        <section className="border-t border-border/60 bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-8 text-center sm:px-6">
            <GraduationCap className="mx-auto size-8 text-primary" />
            <h2 className="mt-3 text-xl font-semibold text-foreground">{config.nomeEscola}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              INEP {config.inep} · {config.endereco}
            </p>
          </div>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}

/**
 * Announces the new schedule (bigger 90-min blocks, more seats per turma)
 * starting fresh on the next Monday — today's sessions were suspended so the
 * old and new schedules never mix mid-week. Only shows up until that Monday
 * arrives, then disappears on its own.
 */
function NovoCronogramaBanner() {
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  const proximaSegunda = useMemo(() => proximaDataDoDia("Segunda", new Date()), []);
  const dataFormatada = proximaSegunda.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  if (!montado) return null;
  const hoje = toDateKey(new Date());
  const segundaKey = toDateKey(proximaSegunda);
  if (hoje >= segundaKey) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-white/5 sm:items-center">
      <PartyPopper className="mt-0.5 size-5 shrink-0 text-primary sm:mt-0" />
      <p className="text-sm text-foreground">
        <span className="font-semibold">Cronograma novo a partir de {dataFormatada}:</span> aulas
        mais longas (90 min), com mais alunos participando por turma toda semana. As aulas de hoje
        foram pausadas para a transição — a agenda nova já está pronta e visível abaixo.
      </p>
    </div>
  );
}

/**
 * Shows which turmas are scheduled for the next school day, so professors
 * can plan ahead — displayed right below the live session on the homepage.
 * Each row is clickable and opens the same "alunos previstos" preview used
 * everywhere else in the app, for a consistent experience.
 */
function ProximasTurmasPanel() {
  const { turmas, config } = useAppStore();
  const [assignmentSelecionado, setAssignmentSelecionado] = useState<Assignment | null>(null);

  // A data atual difere entre servidor e navegador; só renderizamos após montar
  // para evitar erro de hidratação.
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  const proximo = useMemo(
    () => (montado ? proximoDiaLetivo(config, new Date()) : null),
    [config, montado],
  );
  const assignmentsDoProximoDia = useMemo(() => {
    if (!proximo) return [];
    const dataKey = toDateKey(proximo.data);
    const assignments = aplicarExcecoesDeData(
      buildWeeklySchedule(turmas, config),
      config,
      turmas,
      dataKey,
    );
    return nextAssignmentsForDay(assignments, proximo.dia).filter(
      (a) => !config.suspensoes?.[suspensaoKey(dataKey, a.dia, a.slot.inicio)],
    );
  }, [turmas, config, proximo]);

  if (!montado || !proximo || assignmentsDoProximoDia.length === 0) return null;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="size-4 text-primary" />
          Próximas turmas ·{" "}
          {proximo.data.toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          })}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Toque numa turma para ver os alunos previstos.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col divide-y divide-border/60">
          {assignmentsDoProximoDia.map((assignment) => (
            <button
              key={`${assignment.dia}-${assignment.slot.inicio}`}
              type="button"
              onClick={() => setAssignmentSelecionado(assignment)}
              className="group flex items-center justify-between gap-3 py-2.5 text-left transition-colors hover:text-primary"
            >
              <div className="flex items-center gap-3">
                {assignment.turma.imagem ? (
                  <img
                    src={assignment.turma.imagem}
                    alt=""
                    className="size-9 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-xs font-semibold text-secondary-foreground">
                    {assignment.turma.letra}
                  </span>
                )}
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-primary">
                    {assignment.turma.serie} &quot;{assignment.turma.letra}&quot;
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Prof(a). {assignment.turma.professorRegente} · {assignment.turma.alunos.length}{" "}
                    alunos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="font-mono">
                  {assignment.slot.inicio} – {assignment.slot.fim}
                </Badge>
                <ChevronRight className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </button>
          ))}
        </div>
      </CardContent>

      <PreviaAlunosDialog
        assignment={assignmentSelecionado}
        data={proximo.data}
        onOpenChange={(open) => {
          if (!open) setAssignmentSelecionado(null);
        }}
      />
    </Card>
  );
}

/**
 * A prominent, glassmorphism-styled weekly schedule so anyone on the
 * homepage can see at a glance which turma uses the lab on any given day —
 * with today visually called out.
 */
function ProgramacaoSemanalDestaque() {
  const { turmas, config } = useAppStore();
  // A data só é lida depois da montagem: o dia da semana do servidor pode
  // diferir do navegador (fuso), o que quebraria a hidratação.
  const [todayLabel, setTodayLabel] = useState("");
  const [diaSelecionado, setDiaSelecionado] = useState(config.diasSemana[0] ?? "");
  useEffect(() => {
    const label = currentWeekdayLabel(new Date());
    setTodayLabel(label);
    if (config.diasSemana.includes(label)) setDiaSelecionado(label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [assignmentSelecionado, setAssignmentSelecionado] = useState<Assignment | null>(null);

  const dataDoDia = useMemo(() => proximaDataDoDia(diaSelecionado, new Date()), [diaSelecionado]);
  const assignments = useMemo(
    () =>
      aplicarExcecoesDeData(
        buildWeeklySchedule(turmas, config),
        config,
        turmas,
        toDateKey(dataDoDia),
      ),
    [turmas, config, dataDoDia],
  );
  const assignmentsDoDia = useMemo(
    () =>
      nextAssignmentsForDay(assignments, diaSelecionado).filter(
        (a) => !config.suspensoes?.[suspensaoKey(toDateKey(dataDoDia), a.dia, a.slot.inicio)],
      ),
    [assignments, diaSelecionado, config.suspensoes, dataDoDia],
  );
  const dataFormatada = useMemo(() => {
    if (!todayLabel) return "";
    return dataDoDia.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
    });
  }, [dataDoDia, todayLabel]);

  if (turmas.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-blue-800 to-indigo-950 py-10 sm:py-12">
      {/* Soft glowing orbs behind the glass panels, for depth. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-blue-400/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-0 size-96 rounded-full bg-amber-400/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 max-w-2xl">
          <Badge className="mb-4 gap-1.5 border-white/20 bg-white/10 text-white backdrop-blur">
            <Sparkles className="size-3.5" /> Programação da semana
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Veja quem usa o laboratório em cada dia
          </h2>
          <p className="mt-2 text-sm text-blue-100/80">
            Clique num dia para ver as turmas, e num card para ver os alunos previstos.
          </p>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {config.diasSemana.map((dia) => {
            const ativo = dia === diaSelecionado;
            const hoje = dia === todayLabel;
            return (
              <button
                key={dia}
                type="button"
                onClick={() => setDiaSelecionado(dia)}
                className={`relative rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-md transition-all ${
                  ativo
                    ? "border-white bg-white text-primary shadow-lg"
                    : "border-white/25 bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {dia}
                {hoje ? (
                  <span
                    className={`ml-1.5 inline-block size-1.5 rounded-full ${ativo ? "bg-primary" : "bg-amber-300"}`}
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        <p className="mb-6 flex items-center gap-1.5 text-sm text-blue-100/80">
          <CalendarDays className="size-4" />
          {diaSelecionado}, {dataFormatada}
          {diaSelecionado === todayLabel ? (
            <span className="ml-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-medium text-amber-200">
              hoje
            </span>
          ) : null}
        </p>

        {assignmentsDoDia.length === 0 ? (
          <div className="rounded-2xl border border-white/20 bg-white/10 p-8 text-center backdrop-blur-md">
            <p className="text-sm text-blue-100/80">
              Nenhuma turma programada para {diaSelecionado}.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assignmentsDoDia.map((assignment) => (
              <button
                key={`${assignment.dia}-${assignment.slot.inicio}`}
                type="button"
                onClick={() => setAssignmentSelecionado(assignment)}
                className="group rounded-2xl border border-white/20 bg-white/10 p-4 text-left shadow-xl backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/15"
              >
                <div className="flex items-center gap-3">
                  {assignment.turma.imagem ? (
                    <img
                      src={assignment.turma.imagem}
                      alt=""
                      className="size-11 rounded-xl object-cover ring-2 ring-white/30"
                    />
                  ) : (
                    <span className="flex size-11 items-center justify-center rounded-xl bg-white/20 text-sm font-bold text-white ring-2 ring-white/30">
                      {assignment.turma.letra}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {assignment.turma.serie} &quot;{assignment.turma.letra}&quot;
                    </p>
                    <p className="truncate text-xs text-blue-100/70">
                      Prof(a). {assignment.turma.professorRegente}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/15 pt-3">
                  <span className="flex items-center gap-1.5 font-mono text-sm font-medium text-white">
                    <Clock3 className="size-3.5 text-amber-300" />
                    {assignment.slot.inicio} – {assignment.slot.fim}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-blue-100/70">
                    <Users2 className="size-3.5" />
                    {assignment.turma.alunos.length}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-blue-100/60 opacity-0 transition-opacity group-hover:opacity-100">
                  Clique para ver os alunos previstos →
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <PreviaAlunosDialog
        assignment={assignmentSelecionado}
        data={proximaDataDoDia(diaSelecionado, new Date())}
        onOpenChange={(open) => {
          if (!open) setAssignmentSelecionado(null);
        }}
      />
    </section>
  );
}

function FeatureCard({
  icon,
  iconClassName,
  title,
  description,
}: {
  icon: ReactNode;
  iconClassName?: string;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <span
          className={`mb-2 flex size-10 items-center justify-center rounded-lg ${iconClassName ?? "bg-primary/10 text-primary"}`}
        >
          {icon}
        </span>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
