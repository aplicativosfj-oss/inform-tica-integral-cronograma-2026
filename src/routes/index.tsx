import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BookOpen,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  Clock3,
  ExternalLink,
  Gamepad2,
  GraduationCap,
  LayoutDashboard,
  MonitorSmartphone,
  Play,
  ShieldCheck,
  Sparkles,
  Timer,
  Users2,
  Youtube,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCountUp } from "@/hooks/use-count-up";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { LiveSessionPanel } from "@/components/school/live-session-panel";
import { WeatherWidget } from "@/components/school/weather-widget";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { PreviaAlunosDialog } from "@/components/school/previa-alunos-dialog";
import { AvisoDireitosImagem, SiteImage } from "@/components/school/site-image";
import { SiteFooter } from "@/components/school/site-footer";
import { WeeklySchedule } from "@/components/school/weekly-schedule";
import { useAppStore } from "@/lib/app-store";
import {
  aplicarExcecoesDeData,
  buildWeeklySchedule,
  currentWeekdayLabel,
  getWeekIndex,
  nextAssignmentsForDay,
  proximaDataDoDia,
  proximoDiaLetivo,
  suspensaoKey,
  toDateKey,
} from "@/lib/schedule-engine";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";
import type { Assignment } from "@/lib/types";
import { cn } from "@/lib/utils";
import escolaInformaticaHeroImg from "@/assets/escola-informatica-hero.jpg";
import alunosImg1 from "@/assets/alunos-1.jpg";
import alunosImg2 from "@/assets/alunos-2.jpg";
import alunosImg3 from "@/assets/alunos-3.jpg";
import laboratorioTurmaFotoImg from "@/assets/image3.png";
import alunoJogoImg from "@/assets/image2.jpeg";
import alunoSorridenteImg from "@/assets/image10.jpeg";
import programacaoBgImg from "@/assets/image9.png";
import homePageBgImg from "@/assets/homepage-bg.svg";

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
      // twitter:card e og:image vêm do __root — um lugar só para o formato
      // do card, senão a home volta a divergir do resto do site.
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
  const { turmas, config, isReady } = useAppStore();
  const totalAlunos = turmas.reduce((sum, t) => sum + t.alunos.length, 0);

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        <section className="relative overflow-hidden border-b border-border/60">
          {/* O padrão de marca é a camada mais baixa. No celular a seção fica
              alta e estreita, então o bg-cover amplia muito o SVG — por isso
              ele entra bem apagado aqui e só ganha presença a partir do sm. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center opacity-30 sm:opacity-60"
            style={{ backgroundImage: `url(${homePageBgImg})` }}
          />
          {/* Véu que define a luz do hero: claro e arejado no modo claro,
              azul-noite um tom acima do fundo da página no modo escuro. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-sky-50/85 via-white/55 to-background dark:from-slate-800/70 dark:via-slate-900/60 dark:to-background"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_-10%,rgba(56,130,246,0.16),transparent_55%),radial-gradient(circle_at_100%_8%,rgba(14,165,233,0.13),transparent_50%)]"
          />
          {/* Yellow accent stripe, echoing the school's brand colors from the printed materials. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 -z-10 size-32 rotate-45 bg-amber-400/20 sm:-right-16 sm:-top-16 sm:size-56 sm:bg-amber-400/25"
          />
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-10">
            <div>
              <Badge variant="secondary" className="mb-3 gap-1.5">
                <MonitorSmartphone className="size-3.5" /> Agenda online
              </Badge>
              <h1 className="text-[2rem] font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Informática na <span className="text-primary">Escola</span>
              </h1>
              {/* Quem abre a home precisa saber de qual escola é a agenda sem
                  ter que rolar até o rodapé. O degradê no lugar de uma cor
                  chapada dá direção à luz — é o que faz o vidro parecer vidro,
                  e não um retângulo translúcido. */}
              <p className="mt-3 inline-flex max-w-xl items-start gap-2 rounded-xl border border-sky-200/80 bg-gradient-to-br from-white/70 to-sky-100/40 px-3.5 py-2 text-[15px] font-semibold text-primary shadow-md shadow-slate-900/5 backdrop-blur-md dark:border-white/15 dark:from-white/12 dark:to-white/5 dark:shadow-black/20 sm:text-base">
                <GraduationCap className="mt-0.5 size-4 shrink-0 opacity-80" aria-hidden />
                {config.nomeEscola}
              </p>
              <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-muted-foreground sm:text-lg">
                Cronograma automático por turma, revezamento justo entre alunos nos{" "}
                {config.numeroComputadores} computadores e cronômetro ao vivo — com o professor{" "}
                {config.professorInformatica}.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
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

              <dl className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-white/40 bg-white/30 p-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 sm:grid-cols-4">
                <div>
                  <dt className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      <BookOpen className="size-3" />
                    </span>
                    <span>
                      Total de
                      <br />
                      Turmas
                    </span>
                  </dt>
                  {isReady ? (
                    <StatCounter valor={turmas.length} />
                  ) : (
                    <div className="mt-1 h-7 w-8 animate-pulse rounded bg-muted-foreground/20" />
                  )}
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Users2 className="size-3" />
                    </span>
                    <span>
                      Total de
                      <br />
                      Alunos
                    </span>
                  </dt>
                  {isReady ? (
                    <StatCounter valor={totalAlunos} />
                  ) : (
                    <div className="mt-1 h-7 w-10 animate-pulse rounded bg-muted-foreground/20" />
                  )}
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <MonitorSmartphone className="size-3" />
                    </span>
                    <span>
                      Máquinas
                      <br />
                      Disponíveis
                    </span>
                  </dt>
                  {isReady ? (
                    <StatCounter valor={config.numeroComputadores} />
                  ) : (
                    <div className="mt-1 h-7 w-8 animate-pulse rounded bg-muted-foreground/20" />
                  )}
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Clock3 className="size-3" />
                    </span>
                    Horário das aulas
                  </dt>
                  <dd className="text-2xl font-semibold text-foreground">
                    {config.horaInicio}–{config.horaFim}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="relative order-first lg:order-none">
              <div className="absolute -inset-4 rounded-3xl bg-primary/10 blur-2xl" aria-hidden />
              {/* Elementos decorativos flutuantes — sutis, só para dar vida ao
                  hero sem distrair do conteúdo real. */}
              <span
                aria-hidden
                className="absolute -right-3 top-8 z-10 hidden size-3 rounded-full bg-amber-400/70 animate-float-slow sm:block"
              />
              <span
                aria-hidden
                className="absolute -right-6 top-1/2 z-10 hidden size-2 rounded-full bg-primary/60 animate-float-slower sm:block"
              />
              <span
                aria-hidden
                className="absolute -bottom-4 left-10 z-10 hidden size-2.5 rounded-full bg-emerald-400/60 animate-float-slow sm:block"
              />
              {/* A proporção acompanha a do arquivo (854x302) para o banner
                  aparecer inteiro — cortar em 13/4 comia a lâmpada e o globo
                  das pontas. Isso faz da imagem um retângulo bem mais baixo
                  que a coluna de texto ao lado no desktop; a partir do lg,
                  uma moldura com uma cópia borrada e ampliada da própria
                  imagem preenche o espaço vazio ao redor dela, em vez de
                  deixar só o fundo escuro por trás.

                  No celular ele sangra até a borda da tela (-mx-4, anulando o
                  padding do container). Como a proporção é fixa e não pode ser
                  cortada, ocupar os 32px do padding é o único jeito de crescer:
                  rende ~10% de altura. A seção tem overflow-hidden, então o
                  transbordo não vira rolagem lateral. */}
              <div className="lg:relative lg:flex lg:min-h-[260px] lg:items-center lg:justify-center lg:overflow-hidden lg:rounded-2xl lg:border lg:border-white/30 lg:shadow-2xl dark:lg:border-white/10 xl:min-h-[300px]">
                <div
                  aria-hidden
                  className="absolute inset-0 hidden scale-110 bg-cover bg-center opacity-60 blur-2xl lg:block"
                  style={{ backgroundImage: `url(${escolaInformaticaHeroImg})` }}
                />
                <div aria-hidden className="absolute inset-0 hidden bg-slate-900/35 lg:block" />
                <SiteImage
                  src={escolaInformaticaHeroImg}
                  alt="Escola Municipal Dr. Eiraldo Carneiro - Informática é porta para o futuro com alunos no laboratório"
                  width={854}
                  height={302}
                  className="relative -mx-4 aspect-[854/302] w-auto overflow-hidden border-y border-white/30 bg-white/70 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40 sm:mx-0 sm:w-full sm:rounded-2xl sm:border lg:w-full lg:rounded-2xl"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
              </div>
            </div>
          </div>
        </section>

        <RevealSection className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
          <div className="group overflow-hidden rounded-2xl border border-border/60 shadow-lg transition-shadow hover:shadow-xl">
            <SiteImage
              src={laboratorioTurmaFotoImg}
              alt={`Turma completa da ${config.nomeEscola} durante a aula de informática, cada aluno em seu computador`}
              legenda={`O laboratório de informática da ${config.nomeEscola} em plena aula — turma completa, cada aluno em seu computador.`}
              width={1280}
              height={720}
              className="aspect-[21/9] max-h-52 w-full transition-transform duration-300 group-hover:scale-[1.02] sm:max-h-60"
              loading="lazy"
              decoding="async"
            />
          </div>
          <AvisoDireitosImagem className="mt-1.5" />
        </RevealSection>

        <section className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6">
          <div className="grid gap-3 lg:grid-cols-[1fr_1.6fr] lg:items-start">
            <WeatherWidget />
            <LiveSessionPanel />
          </div>
          <ProximasTurmasPanel />
        </section>

        <RevealSection className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold text-foreground">
                Como a agenda organiza tudo
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Grupos de {config.numeroComputadores} alunos revezam a cada{" "}
                {config.duracaoGrupoMinutos} minutos, dentro de janelas de{" "}
                {config.duracaoSlotMinutos} minutos por turma, de {config.horaInicio} às{" "}
                {config.horaFim}.
              </p>
            </div>
            {/* Fotos reais dos alunos usando o laboratório — discreto, sem virar mosaico. */}
            <div className="flex shrink-0 items-center gap-2">
              {[alunosImg1, alunosImg2, alunosImg3, alunoJogoImg, alunoSorridenteImg].map(
                (src, i) => (
                  <SiteImage
                    key={i}
                    src={src}
                    alt="Aluno usando um computador do laboratório de informática"
                    legenda="Aluno usando um computador do laboratório de informática da escola."
                    loading="lazy"
                    width={64}
                    height={64}
                    className="size-14 rounded-xl border border-border/60 shadow-sm sm:size-16"
                  />
                ),
              )}
            </div>
          </div>
          <AvisoDireitosImagem className="mt-2 sm:justify-end" />

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
        </RevealSection>

        <RevealSection className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="mb-4 max-w-2xl">
            <Badge variant="secondary" className="mb-2 gap-1.5">
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
          <WeeklySchedule />
        </RevealSection>

        <ProgramacaoSemanalDestaque />

        <CanalYoutubeSection />

        <section className="border-t border-border/60 bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-6 text-center sm:px-6">
            <GraduationCap className="mx-auto size-7 text-primary" />
            <h2 className="mt-2 text-xl font-semibold text-foreground">{config.nomeEscola}</h2>
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
      buildWeeklySchedule(turmas, config, getWeekIndex(proximo.data)),
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
          {assignmentsDoProximoDia.map((assignment) =>
            assignment.misto ? (
              <div
                key={`${assignment.dia}-${assignment.slot.inicio}`}
                className="flex flex-col gap-1.5 py-2.5"
              >
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-xs">
                    horário misto
                  </Badge>
                  <Badge variant="secondary" className="font-mono">
                    {assignment.slot.inicio} – {assignment.slot.fim}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Grupo que sobrou de cada turma, 30 min cada:{" "}
                  {assignment.misto.map((m) => `${m.turma.serie} "${m.turma.letra}"`).join(", ")}
                </p>
              </div>
            ) : (
              <button
                key={`${assignment.dia}-${assignment.slot.inicio}`}
                type="button"
                onClick={() => setAssignmentSelecionado(assignment)}
                className="group cursor-pointer flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-300 ease-out hover:bg-primary/5 hover:shadow-md hover:scale-105"
              >
                <div className="flex items-center gap-3">
                  {assignment.turma.imagem ? (
                    <img
                      src={assignment.turma.imagem}
                      alt={`Foto da turma ${assignment.turma.serie} "${assignment.turma.letra}"`}
                      className="size-9 rounded-lg object-cover"
                    />
                  ) : (
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg text-xs font-semibold",
                        serieClasses(serieIndexPorNumero(assignment.turma.serie)).bg,
                        serieClasses(serieIndexPorNumero(assignment.turma.serie)).text,
                      )}
                    >
                      {assignment.turma.letra}
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground group-hover:text-primary">
                      {assignment.turma.serie} &quot;{assignment.turma.letra}&quot;
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Prof(a). {assignment.turma.professorRegente} ·{" "}
                      {assignment.turma.alunos.length} alunos
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="font-mono">
                    {assignment.slot.inicio} – {assignment.slot.fim}
                  </Badge>
                  <ChevronRight className="size-4 text-muted-foreground/50 transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </button>
            ),
          )}
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
        buildWeeklySchedule(turmas, config, getWeekIndex(dataDoDia)),
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
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 sm:py-10">
      {/* Ilustração de fundo, visível mas discreta — textura com bom contraste. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.08]"
        style={{ backgroundImage: `url(${programacaoBgImg})` }}
      />
      {/* Soft glowing orbs behind the glass panels, for depth. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-slate-700/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-0 size-96 rounded-full bg-amber-400/15 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-5 max-w-2xl">
          <Badge className="mb-3 gap-1.5 border-white/20 bg-white/10 text-white backdrop-blur">
            <Sparkles className="size-3.5" /> Programação da semana
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Veja quem usa o laboratório em cada dia
          </h2>
          <p className="mt-2 text-sm text-white/90">
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
                className={`relative cursor-pointer rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-md transition-all duration-300 ease-out ${
                  ativo
                    ? "border-white bg-white text-slate-900 shadow-lg scale-105"
                    : "border-white/25 bg-white/10 text-white [@media(hover:hover)]:hover:bg-white/20 [@media(hover:hover)]:hover:border-white/50 [@media(hover:hover)]:hover:shadow-lg"
                }`}
              >
                {dia}
                {hoje ? (
                  <span
                    className={`ml-1.5 inline-block size-1.5 rounded-full ${ativo ? "bg-slate-900" : "bg-amber-300"}`}
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        <p className="mb-4 flex items-center gap-1.5 text-sm text-white/90">
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
            <p className="text-sm text-white/90">
              Nenhuma turma programada para {diaSelecionado}.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assignmentsDoDia.map((assignment) =>
              assignment.misto ? (
                <div
                  key={`${assignment.dia}-${assignment.slot.inicio}`}
                  className="rounded-2xl border border-white/20 bg-white/10 p-4 text-left shadow-xl backdrop-blur-md"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full border border-white/30 px-2 py-0.5 text-xs font-medium text-white">
                      horário misto
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-sm font-medium text-white">
                      <Clock3 className="size-3.5 text-amber-300" />
                      {assignment.slot.inicio} – {assignment.slot.fim}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-blue-100/70">
                    Grupo que sobrou de cada turma, 30 min cada:{" "}
                    {assignment.misto.map((m) => `${m.turma.serie} "${m.turma.letra}"`).join(", ")}
                  </p>
                </div>
              ) : (
                <button
                  key={`${assignment.dia}-${assignment.slot.inicio}`}
                  type="button"
                  onClick={() => setAssignmentSelecionado(assignment)}
                  className="group cursor-pointer rounded-2xl border border-white/20 bg-white/10 p-4 text-left shadow-xl backdrop-blur-md transition-all duration-300 ease-out [@media(hover:hover)]:hover:scale-105 [@media(hover:hover)]:hover:border-white/40 [@media(hover:hover)]:hover:bg-white/20 [@media(hover:hover)]:hover:shadow-2xl [@media(hover:hover)]:hover:shadow-white/10"
                >
                  <div className="flex items-center gap-3">
                    {assignment.turma.imagem ? (
                      <img
                        src={assignment.turma.imagem}
                        alt={`Foto da turma ${assignment.turma.serie} "${assignment.turma.letra}"`}
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
                      <p className="truncate text-xs text-white/80">
                        Prof(a). {assignment.turma.professorRegente}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-white/15 pt-3">
                    <span className="flex items-center gap-1.5 font-mono text-sm font-medium text-white">
                      <Clock3 className="size-3.5 text-amber-300" />
                      {assignment.slot.inicio} – {assignment.slot.fim}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-white/80">
                      <Users2 className="size-3.5" />
                      {assignment.turma.alunos.length}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-white/70 opacity-0 transition-all duration-300 ease-out group-hover:opacity-100">
                    Clique para ver os alunos previstos
                  </p>
                </button>
              ),
            )}
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

const CANAL_YOUTUBE_URL = "https://www.youtube.com/@DrEiraldoIntegral";

const VIDEOS_DESTAQUE = [
  { id: "3zxaoWcPAtg", titulo: "Primeiros passos na informática" },
  { id: "U6r_g4UWB9g", titulo: "Aula de informática" },
  { id: "URKMI30t744", titulo: "Visita da Defensoria Pública na escola" },
];

/**
 * Divulgação discreta do canal oficial da escola no YouTube — miniaturas
 * reais (sem incorporar o player, mais leve) que abrem o vídeo em uma nova
 * aba. Fica perto do rodapé, como um convite a mais, não como destaque.
 */
function CanalYoutubeSection() {
  return (
    <RevealSection className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <Badge variant="secondary" className="mb-2 gap-1.5">
            <Youtube className="size-3.5" /> Canal da escola
          </Badge>
          <h2 className="text-xl font-semibold text-foreground">Acompanhe no YouTube</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bastidores das aulas de informática e da rotina da escola, em vídeo.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="w-fit shrink-0">
          <a href={CANAL_YOUTUBE_URL} target="_blank" rel="noopener noreferrer">
            Ver canal completo <ExternalLink className="size-3.5" />
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:max-w-xl">
        {VIDEOS_DESTAQUE.map((video) => (
          <VideoThumb key={video.id} video={video} />
        ))}
      </div>
    </RevealSection>
  );
}

/**
 * Miniatura de um vídeo do canal. Redes de escola costumam bloquear o
 * domínio do YouTube (inclusive o CDN de miniaturas `i.ytimg.com`) — quando a
 * imagem falha ao carregar, mostramos um cartão simples no lugar de um ícone
 * de imagem quebrada, sem afetar o resto da página.
 */
function VideoThumb({ video }: { video: { id: string; titulo: string } }) {
  const [imagemFalhou, setImagemFalhou] = useState(false);

  return (
    <a
      href={`https://www.youtube.com/shorts/${video.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block aspect-video overflow-hidden rounded-xl border border-border/60 bg-muted shadow-sm transition-shadow hover:shadow-md"
    >
      {imagemFalhou ? (
        <div className="flex size-full flex-col items-center justify-center gap-1 bg-secondary p-1.5 text-center">
          <Youtube className="size-4 text-muted-foreground" />
          <span className="line-clamp-2 text-[10px] font-medium leading-tight text-muted-foreground">
            {video.titulo}
          </span>
        </div>
      ) : (
        <>
          <img
            src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
            alt={video.titulo}
            loading="lazy"
            width={480}
            height={360}
            onError={() => setImagemFalhou(true)}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/30">
            <Play
              className="size-6 text-white opacity-90 drop-shadow transition-transform group-hover:scale-110"
              fill="currentColor"
            />
          </span>
          <span className="absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-black/75 to-transparent p-1.5 text-[11px] font-medium leading-tight text-white">
            {video.titulo}
          </span>
        </>
      )}
    </a>
  );
}

/** Envolve uma seção da home para revelar suavemente ao rolar até ela. */
function RevealSection({ className, children }: { className?: string; children: ReactNode }) {
  const { ref, className: revealClassName } = useScrollReveal<HTMLElement>();
  return (
    <section ref={ref} className={`${className ?? ""} ${revealClassName}`.trim()}>
      {children}
    </section>
  );
}

/** Número de destaque do hero que conta de 0 até o valor real ao entrar na tela. */
function StatCounter({ valor }: { valor: number }) {
  const { ref, exibido } = useCountUp(valor);
  return (
    <dd ref={ref} className="text-2xl font-semibold text-foreground">
      {exibido}
    </dd>
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
    <Card className="group">
      <CardHeader className="pb-2">
        <span
          className={`group-hover-hop mb-2 flex size-10 items-center justify-center rounded-lg ${iconClassName ?? "bg-primary/10 text-primary"}`}
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
