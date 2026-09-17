import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarClock,
  CalendarDays,
  Clock3,
  Gamepad2,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  MonitorSmartphone,
  ShieldCheck,
  Sparkles,
  Timer,
  Users2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LiveSessionPanel } from "@/components/school/live-session-panel";
import { NavBar } from "@/components/school/nav-bar";
import { useAppStore } from "@/lib/app-store";
import { fetchUltimaParticipacao } from "@/lib/presencas";
import {
  buildWeeklySchedule,
  currentWeekdayLabel,
  nextAssignmentsForDay,
  proximaDataDoDia,
  proximoDiaLetivo,
  selecionarAlunosDoDia,
  suspensaoKey,
  toDateKey,
} from "@/lib/schedule-engine";
import type { Assignment } from "@/lib/types";
import heroImg from "@/assets/hero-lab-photo.jpg";
import backgroundImg from "@/assets/feature-classroom-tech.jpg";
import scheduleImg from "@/assets/feature-classroom-tech.jpg";
import networkImg from "@/assets/feature-tools.jpg";
import workspaceImg from "@/assets/feature-kids-learning.jpg";

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
  }),
});

function Index() {
  const { turmas, config } = useAppStore();
  const totalAlunos = turmas.reduce((sum, t) => sum + t.alunos.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <section className="relative overflow-hidden border-b border-border/60">
        {/* Sophisticated backdrop: a dimmed photo of the lab behind the content, for depth without hurting legibility. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-20 bg-cover bg-center opacity-[0.06]"
          style={{ backgroundImage: `url(${backgroundImg})` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_-10%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_55%),radial-gradient(circle_at_100%_10%,color-mix(in_oklch,var(--primary)_10%,transparent),transparent_50%)]"
        />
        {/* Yellow accent stripe, echoing the school's brand colors from the printed materials. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 -z-10 size-56 rotate-45 bg-amber-400/25"
        />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <Badge variant="secondary" className="mb-4 gap-1.5">
              <MonitorSmartphone className="size-3.5" /> Agenda online
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Informática na <span className="text-primary">Escola</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Agende seus horários de forma rápida, simples e prática! Cronograma automático por
              turma, revezamento entre alunos nos {config.numeroComputadores} computadores e
              cronômetro ao vivo, com o professor {config.professorInformatica}.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/agenda">
                  <CalendarClock /> Acessar Agenda Online
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/dashboard">
                  <LayoutDashboard /> Painel de gestão
                </Link>
              </Button>
            </div>

            <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-border/60 pt-6">
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
            </dl>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-primary/5 blur-2xl" aria-hidden />
            <img
              src={heroImg}
              alt="Alunos usando os computadores do laboratório de informática da escola"
              width={1600}
              height={900}
              className="relative rounded-2xl border border-border/60 bg-card shadow-2xl"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
        <LiveSessionPanel />
        <ProximasTurmasPanel />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl font-semibold text-foreground">Como a agenda organiza tudo</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            O sistema aplica a mesma lógica de revezamento usada em sala: grupos de{" "}
            {config.numeroComputadores} alunos por vez, trocando automaticamente a cada{" "}
            {config.duracaoGrupoMinutos} minutos, dentro de janelas de {config.duracaoSlotMinutos}{" "}
            minutos por turma, de {config.horaInicio} às {config.horaFim}.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={<Gamepad2 className="size-5" />}
            iconClassName="bg-blue-500/10 text-blue-600"
            title="Aprendizado Digital"
            description="Tecnologia que estimula o raciocínio e a criatividade."
          />
          <FeatureCard
            icon={<Users2 className="size-5" />}
            iconClassName="bg-emerald-500/10 text-emerald-600"
            title="Mais Oportunidades"
            description="A informática amplia horizontes e prepara para o futuro."
          />
          <FeatureCard
            icon={<CalendarClock className="size-5" />}
            iconClassName="bg-violet-500/10 text-violet-600"
            title="Agende seu Horário"
            description="Escolha o melhor dia e horário para utilizar o laboratório."
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FeatureCard
            icon={<Timer className="size-5" />}
            title="Cronômetro ao vivo"
            description="Um contador regressivo mostra em tempo real quanto falta para trocar de grupo."
          />
          <FeatureCard
            icon={<ShieldCheck className="size-5" />}
            title="Painel de gestão"
            description="Cadastre turmas, professores, fotos e alunos com acesso restrito por login."
          />
        </div>
      </section>

      <ProgramacaoSemanalDestaque />

      <section className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-2xl font-semibold text-foreground">
              Tecnologia a serviço da rotina escolar
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Uma experiência visual clara e moderna para organizar horários, acompanhar o tempo e
              conectar alunos ao laboratório de informática.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <VisualCard
              image={scheduleImg}
              title="Organização semanal"
              description="Visualize de imediato quais turmas usam o laboratório em cada dia e horário."
            />
            <VisualCard
              image={networkImg}
              title="Conexão e colaboração"
              description="Cada aluno tem seu momento no computador, de forma justa e previsível."
            />
            <VisualCard
              image={workspaceImg}
              title="Ambiente preparado"
              description="A agenda ajuda o professor a chegar com tudo planejado para a aula de informática."
            />
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
          <GraduationCap className="mx-auto size-8 text-primary" />
          <h2 className="mt-3 text-xl font-semibold text-foreground">{config.nomeEscola}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            INEP {config.inep} · {config.endereco}
          </p>
        </div>
      </section>
    </div>
  );
}

/**
 * Shows which turmas are scheduled for the next school day, so professors
 * can plan ahead — displayed right below the live session on the homepage.
 */
function ProximasTurmasPanel() {
  const { turmas, config } = useAppStore();

  const proximo = useMemo(() => proximoDiaLetivo(config, new Date()), [config]);
  const assignmentsDoProximoDia = useMemo(() => {
    if (!proximo) return [];
    const assignments = buildWeeklySchedule(turmas, config);
    const dataKey = toDateKey(proximo.data);
    return nextAssignmentsForDay(assignments, proximo.dia).filter(
      (a) => !config.suspensoes?.[suspensaoKey(dataKey, a.dia, a.slot.inicio)],
    );
  }, [turmas, config, proximo]);

  if (!proximo || assignmentsDoProximoDia.length === 0) return null;

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
          Para os(as) professores(as) se programarem com antecedência.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col divide-y divide-border/60">
          {assignmentsDoProximoDia.map((assignment) => (
            <div
              key={`${assignment.dia}-${assignment.slot.inicio}`}
              className="flex items-center justify-between gap-3 py-2.5"
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
                  <p className="text-sm font-medium text-foreground">
                    {assignment.turma.serie} "{assignment.turma.letra}"
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Prof(a). {assignment.turma.professorRegente} · {assignment.turma.alunos.length}{" "}
                    alunos
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="font-mono">
                {assignment.slot.inicio} – {assignment.slot.fim}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
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
  const todayLabel = useMemo(() => currentWeekdayLabel(new Date()), []);
  const [diaSelecionado, setDiaSelecionado] = useState(
    config.diasSemana.includes(todayLabel) ? todayLabel : (config.diasSemana[0] ?? ""),
  );
  const [assignmentSelecionado, setAssignmentSelecionado] = useState<Assignment | null>(null);

  const assignments = useMemo(() => buildWeeklySchedule(turmas, config), [turmas, config]);
  const assignmentsDoDia = useMemo(
    () => nextAssignmentsForDay(assignments, diaSelecionado),
    [assignments, diaSelecionado],
  );
  const dataDoDia = useMemo(() => proximaDataDoDia(diaSelecionado, new Date()), [diaSelecionado]);
  const dataFormatada = dataDoDia.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });

  if (turmas.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-blue-800 to-indigo-950 py-16 sm:py-20">
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
        <div className="mb-10 max-w-2xl">
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
                      {assignment.turma.serie} "{assignment.turma.letra}"
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
        data={dataDoDia}
        onOpenChange={(open) => {
          if (!open) setAssignmentSelecionado(null);
        }}
      />
    </section>
  );
}

/**
 * Preview of which students are expected on a given (usually future) date —
 * computed live from the same fairness queue used for the real daily roll
 * call, but not written anywhere. It's a forecast, not a commitment: the
 * actual list on the day can shift with absences or schedule changes.
 */
function PreviaAlunosDialog({
  assignment,
  data,
  onOpenChange,
}: {
  assignment: Assignment | null;
  data: Date;
  onOpenChange: (open: boolean) => void;
}) {
  const { config } = useAppStore();
  const [grupos, setGrupos] = useState<ReturnType<typeof selecionarAlunosDoDia>["grupos"] | null>(
    null,
  );
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!assignment) {
      setGrupos(null);
      return;
    }
    let cancelled = false;
    setCarregando(true);
    fetchUltimaParticipacao(assignment.turma.id)
      .then((ultima) => {
        if (cancelled) return;
        const selecao = selecionarAlunosDoDia(assignment.turma, ultima, config.numeroComputadores);
        setGrupos(selecao.grupos);
      })
      .catch(() => {
        if (!cancelled) setGrupos(null);
      })
      .finally(() => {
        if (!cancelled) setCarregando(false);
      });
    return () => {
      cancelled = true;
    };
  }, [assignment, config.numeroComputadores]);

  return (
    <Dialog open={assignment !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {assignment
              ? `${assignment.turma.serie} "${assignment.turma.letra}" · ${data.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}`
              : ""}
          </DialogTitle>
        </DialogHeader>
        {assignment ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Horário: {assignment.slot.inicio} – {assignment.slot.fim} · Prof(a).{" "}
              {assignment.turma.professorRegente}
            </p>
            {carregando ? (
              <p className="text-sm text-muted-foreground">Calculando quem vai participar...</p>
            ) : grupos && grupos.some((g) => g.alunos.length > 0) ? (
              <div className="flex flex-col gap-3">
                {grupos.map((grupo) => (
                  <div key={grupo.indice}>
                    <Badge variant="secondary" className="mb-1.5">
                      Grupo {grupo.indice + 1}
                    </Badge>
                    <div className="flex flex-wrap gap-1.5">
                      {grupo.alunos.map((aluno) => (
                        <span
                          key={aluno.id}
                          className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs text-foreground"
                        >
                          {aluno.nome}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <HeartHandshake className="mt-0.5 size-3.5 shrink-0" />
                  Prévia calculada pela fila de prioridade atual — pode mudar até o dia se houver
                  faltas ou ajustes na programação.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Esta turma ainda não tem alunos cadastrados.
              </p>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
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

function VisualCard({
  image,
  title,
  description,
}: {
  image: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="aspect-[16/10] overflow-hidden">
        <img
          src={image}
          alt={title}
          width={1344}
          height={768}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="p-5">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
