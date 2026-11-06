import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode, type RefObject } from "react";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  Gamepad2,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  MonitorSmartphone,
  Play,
  ShieldCheck,
  Sparkles,
  Users2,
  Youtube,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { MarcaLogo } from "@/components/school/marca";
import { MarcarAlunosCartao } from "@/components/school/laboratorio/marcar-dialog";
import { CartaoAoVivoHome } from "@/components/school/laboratorio/cartao-ao-vivo-home";
import { ConstelacaoNomes } from "@/components/school/laboratorio/constelacao-nomes";
import { PainelLaboratorioAgora } from "@/components/school/laboratorio/painel-agora";
import { ClimaCompacto } from "@/components/school/weather-widget";
import { NavBar } from "@/components/school/nav-bar";
import { AvisoFeriado } from "@/components/school/aviso-feriado";
import { BannerEntreTurnos } from "@/components/school/pausa/banner-home";
import { PageBackground } from "@/components/school/page-background";
import { AvisoDireitosImagem } from "@/components/school/site-image";
import { SiteFooter } from "@/components/school/site-footer";
import { useCountUp } from "@/hooks/use-count-up";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { useAppStore } from "@/lib/app-store";
import { feriadoNacionalEm } from "@/lib/calendario-escolar";
import { hojeNaEscola } from "@/lib/laboratorio";
import { useAuth } from "@/lib/auth-store";
import { useSessoesLab } from "@/lib/laboratorio";
import escolaInformaticaHeroImg from "@/assets/escola-informatica-hero.jpg";
import labFotoImg from "@/assets/laboratorio-informatica-turma.jpg";
import heroTechBgImg from "@/assets/feature-tools.jpg";
import "@/styles/homepage-premium.css";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Informática Dr. Eiraldo | Aprender, criar e evoluir" },
      {
        name: "description",
        content:
          "Agenda das aulas de informática, laboratório ao vivo, atividades, infoteca e resultados de aprendizagem da Escola Dr. Eiraldo Carneiro de França, Feijó (AC).",
      },
      { property: "og:title", content: "Informática Dr. Eiraldo — Escola em movimento" },
      {
        property: "og:description",
        content:
          "Acompanhe o laboratório, encontre atividades educativas e descubra o que acontece na escola.",
      },
      { property: "og:type", content: "website" },
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
            addressLocality: "Feijó",
            addressRegion: "AC",
            addressCountry: "BR",
          },
        }),
      },
    ],
  }),
});

const ACESSOS = [
  {
    to: "/agenda",
    imagem: "/images/hero-lab-photo-768w.webp",
    numero: "01",
    rotulo: "Organização",
    titulo: "Agenda do laboratório",
    descricao: "Aulas, horários e turmas em um só lugar. Tudo organizado para a semana.",
    chamada: "Ver programação",
    Icone: CalendarDays,
    estilo: "home-access-ink",
    destaque: true,
  },
  {
    to: "/aluno",
    imagem: "/images/alunos-hero-768w.webp",
    numero: "02",
    rotulo: "Para os estudantes",
    titulo: "Meu espaço de aprender",
    descricao: "Trilhas, desafios e atividades para avançar no seu ritmo.",
    chamada: "Área do aluno",
    Icone: GraduationCap,
    estilo: "home-access-lilac",
    destaque: false,
  },
  {
    to: "/infoteca",
    imagem: "/images/feature-tools-768w.webp",
    numero: "03",
    rotulo: "Conhecimento",
    titulo: "Infoteca digital",
    descricao: "Materiais e descobertas para ampliar o aprendizado.",
    chamada: "Explorar acervo",
    Icone: BookOpen,
    estilo: "home-access-mint",
    destaque: false,
  },
  {
    to: "/sala-de-jogos",
    imagem: "/images/feature-kids-learning-768w.webp",
    numero: "04",
    rotulo: "Aprender brincando",
    titulo: "Jogos educativos",
    descricao: "Raciocínio, criatividade e muita prática em cada desafio.",
    chamada: "Abrir jogos",
    Icone: Gamepad2,
    estilo: "home-access-sun",
    destaque: false,
  },
  {
    to: "/resultados",
    imagem: "/images/feature-classroom-tech-768w.webp",
    numero: "05",
    rotulo: "Transparência",
    titulo: "Resultados da escola",
    descricao: "Um olhar sobre a aprendizagem e a evolução das turmas.",
    chamada: "Acompanhar",
    Icone: LayoutDashboard,
    estilo: "home-access-ice",
    destaque: false,
  },
  {
    to: "/avaliacao",
    imagem: "/images/alunos-2-480w.webp",
    numero: "06",
    rotulo: "Acompanhamento",
    titulo: "Avaliações",
    descricao: "Instrumentos e indicadores que ajudam a orientar o ensino.",
    chamada: "Ver avaliações",
    Icone: CheckCircle2,
    estilo: "home-access-paper",
    destaque: false,
  },
] as const;

const ETAPAS: { numero: string; titulo: string; descricao: string; Icone: LucideIcon }[] = [
  {
    numero: "01",
    titulo: "Cada turma tem seu momento",
    descricao: "A programação organiza o uso dos computadores entre os grupos da escola.",
    Icone: CalendarDays,
  },
  {
    numero: "02",
    titulo: "Tudo acontece em tempo real",
    descricao: "O painel mostra quando uma aula começa, quanto tempo resta e o próximo grupo.",
    Icone: Clock3,
  },
  {
    numero: "03",
    titulo: "A participação é acompanhada",
    descricao: "Os registros ajudam a distribuir oportunidades e planejar as próximas aulas.",
    Icone: Users2,
  },
  {
    numero: "04",
    titulo: "Aprender vai além do laboratório",
    descricao:
      "Atividades, jogos e materiais digitais estendem as descobertas para outros momentos.",
    Icone: Sparkles,
  },
];

const CANAL_YOUTUBE_URL = "https://www.youtube.com/@DrEiraldoIntegral";

const VIDEOS_DESTAQUE = [
  { id: "3zxaoWcPAtg", titulo: "Primeiros passos na informática" },
  { id: "U6r_g4UWB9g", titulo: "Aula de informática" },
  { id: "URKMI30t744", titulo: "Visita da Defensoria Pública na escola" },
];

function Index() {
  const { turmas, config, isReady } = useAppStore();
  const { isAuthenticated } = useAuth();
  const lab = useSessoesLab();
  const totalAlunos = turmas.reduce((soma, turma) => soma + turma.alunos.length, 0);
  const idsDoFundamental = new Set(turmas.map((turma) => turma.id));
  const sessoes = lab.sessoes.filter((s) => idsDoFundamental.has(s.turmaId));
  const ausencias = lab.ausencias?.filter((s) => idsDoFundamental.has(s.turmaId));
  const dadosLab = { ...lab, sessoes, ausencias };
  const feriadoHoje = feriadoNacionalEm(hojeNaEscola());

  return (
    <div className="home-premium relative min-h-screen overflow-x-clip bg-background text-foreground">
      <PageBackground />
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-background focus:px-5 focus:py-3 focus:font-bold focus:text-foreground focus:shadow-xl"
      >
        Pular para o conteúdo
      </a>
      <div className="relative z-10">
        <NavBar />
        <main id="conteudo-principal">
          <section
            aria-labelledby="home-titulo"
            className="home-hero home-window-hero relative isolate overflow-hidden text-white"
          >
            <img
              src={labFotoImg}
              alt=""
              aria-hidden="true"
              className="home-hero-photo absolute inset-0 -z-30 size-full object-cover"
              loading="eager"
              fetchPriority="high"
            />
            <div aria-hidden="true" className="home-hero-shade absolute inset-0 -z-20" />
            <div aria-hidden="true" className="home-hero-grid absolute inset-0 -z-10" />
            <div
              aria-hidden="true"
              className="home-hero-orb absolute -right-20 top-20 -z-10 size-80 rounded-full bg-sun/15 blur-3xl"
            />
            {feriadoHoje ? null : (
              <ConstelacaoNomes sessoes={sessoes} logado={isAuthenticated} className="-z-10" />
            )}

            <div className="mx-auto max-w-[86rem] px-4 pb-7 pt-9 sm:px-8 sm:pb-10 sm:pt-12 lg:px-10 lg:pt-16">
              {/* Assinatura da escola: no celular cabe numa linha só, com o
                  nome cortado antes de virar um parágrafo em caixa alta. */}
              <div
                data-constelacao-evitar
                className="mb-6 flex items-center justify-between gap-3 border-b border-white/15 pb-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70 sm:mb-9 sm:pb-4 sm:text-xs sm:tracking-[0.18em]"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-white/20 bg-white/10 sm:size-8 sm:rounded-xl">
                    <MarcaLogo tamanho={20} />
                  </span>
                  <span className="truncate">
                    <span className="sm:hidden">E. M. Dr. Eiraldo C. de França</span>
                    <span className="hidden sm:inline">
                      Escola Municipal Dr. Eiraldo Carneiro de França
                    </span>
                  </span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1.5">
                  <MapPin className="size-3.5 text-sun" aria-hidden="true" />
                  <span className="sm:hidden">Feijó · AC</span>
                  <span className="hidden sm:inline">Feijó, Acre · Ano letivo 2026</span>
                </span>
              </div>

              {feriadoHoje ? (
                <AvisoFeriado dataISO={hojeNaEscola()} variante="sobre-imagem" className="mb-8" />
              ) : null}

              <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(21rem,0.88fr)] xl:gap-16">
                {/* O bloco inteiro é obstáculo para os nomes que flutuam ao
                    fundo: antes um nome podia cair em cima do selo ou do
                    título se a medição acontecesse antes do layout assentar. */}
                <div data-constelacao-evitar className="max-w-3xl">
                  <div className="home-hero-entrance inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-xl sm:text-xs">
                    <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.8)]" />
                    Educação integral & tecnologia
                  </div>
                  <h1
                    id="home-titulo"
                    className="home-hero-entrance mt-5 max-w-[12.7ch] font-heading text-[clamp(2.3rem,5.8vw,5.7rem)] font-extrabold leading-[1.03] tracking-[-0.05em] text-white sm:mt-6"
                  >
                    Um universo de
                    <span className="home-headline-accent mt-1 block text-sun">descobertas.</span>
                    Todos os dias.
                  </h1>
                  <p className="home-hero-entrance mt-5 max-w-[34rem] text-[15px] leading-relaxed text-white/80 sm:mt-6 sm:text-lg">
                    O laboratório de informática aproxima nossos estudantes da tecnologia, da
                    criatividade e de novas formas de aprender. Acompanhe o que acontece na escola e
                    explore cada espaço.
                  </p>
                  {/* No celular os dois botões dividem a linha: a abertura
                      inteira cabe numa tela, sem empurrar o painel ao vivo
                      para baixo da dobra. */}
                  <div className="home-hero-entrance mt-6 flex flex-wrap gap-2.5 sm:mt-8 sm:gap-3">
                    <Button
                      asChild
                      size="lg"
                      className="home-cta-primary h-12 min-w-0 flex-1 rounded-full bg-sun px-4 font-bold text-sun-foreground shadow-xl shadow-black/20 hover:bg-sun/90 sm:h-13 sm:flex-none sm:px-6"
                    >
                      <Link to="/agenda">
                        <CalendarDays className="size-5 shrink-0" aria-hidden="true" />
                        <span className="truncate">Explorar agenda</span>
                        <ArrowRight
                          className="hidden size-4 shrink-0 sm:block"
                          aria-hidden="true"
                        />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="h-12 min-w-0 flex-1 rounded-full border-white/30 bg-white/10 px-4 font-bold text-white backdrop-blur-xl hover:border-white/50 hover:bg-white/20 hover:text-white sm:h-13 sm:flex-none sm:px-6"
                    >
                      <a href="#laboratorio-agora">
                        <MonitorSmartphone className="size-5 shrink-0" aria-hidden="true" />
                        <span className="truncate">
                          <span className="sm:hidden">Ao vivo</span>
                          <span className="hidden sm:inline">Laboratório ao vivo</span>
                        </span>
                        <ArrowDown className="hidden size-4 shrink-0 sm:block" aria-hidden="true" />
                      </a>
                    </Button>
                  </div>
                  <p
                    data-constelacao-evitar
                    className="mt-5 flex items-center gap-2 text-xs font-medium text-white/60 sm:mt-6 sm:text-sm"
                  >
                    <ShieldCheck className="size-4 shrink-0 text-emerald-300" aria-hidden="true" />
                    Uma plataforma de aprendizagem e acompanhamento escolar
                  </p>
                </div>

                <div className="home-live-frame min-w-0">
                  <div className="mb-3 flex items-center justify-between gap-3 px-1">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                      <span className="size-2 animate-pulse rounded-full bg-emerald-300" />
                      Painel do laboratório
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/70 backdrop-blur">
                      Horário de Feijó
                    </span>
                  </div>
                  <CartaoAoVivoHome
                    sessoes={sessoes}
                    ausencias={ausencias}
                    logado={isAuthenticated}
                  />
                  <div className="mt-3 flex items-center justify-between gap-3 px-1 text-xs text-white/70">
                    <span>O que está acontecendo, em um só olhar.</span>
                    <Link
                      to="/agenda"
                      className="inline-flex shrink-0 items-center gap-1 font-bold text-sun hover:underline"
                    >
                      Ver detalhes <ChevronRight className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="home-hero-stats mt-5 grid grid-cols-2 overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/[0.09] backdrop-blur-xl sm:grid-cols-4 lg:mt-14">
                <HeroStat
                  rotulo="Turmas atendidas"
                  curto="Turmas"
                  detalhe="1º ao 5º ano"
                  valor={turmas.length}
                  isReady={isReady}
                  Icone={GraduationCap}
                />
                <HeroStat
                  rotulo="Alunos ativos"
                  curto="Alunos"
                  detalhe="Matrículas vigentes"
                  valor={totalAlunos}
                  isReady={isReady}
                  Icone={Users2}
                />
                <HeroStat
                  rotulo="Computadores"
                  curto="Computadores"
                  detalhe="Estações de uso"
                  valor={config.numeroComputadores}
                  isReady={isReady}
                  Icone={MonitorSmartphone}
                />
                <div className="home-stat-cell px-4 py-5 sm:px-6">
                  <div className="flex items-center gap-2 text-white/60">
                    <Clock3 className="size-4 text-sun" aria-hidden="true" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em]">
                      Funcionamento
                    </span>
                  </div>
                  <span className="mt-2 block font-heading text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                    {config.horaInicio}–{config.horaFim}
                  </span>
                  <span className="mt-0.5 block text-xs text-white/60">Horário da escola</span>
                </div>
              </div>
            </div>
            <AvisoDireitosImagem className="mx-auto max-w-[86rem] px-4 pb-4 text-white/45 sm:px-8" />
          </section>

          <section
            aria-labelledby="home-acessos-titulo"
            className="home-section home-window-section mx-auto max-w-[86rem] px-4 py-10 sm:px-8 sm:py-14 lg:px-10"
          >
            <RevealSection>
              <SectionIntro
                etiqueta="Explore a plataforma"
                titulo="Tudo o que você precisa, em um só lugar."
                descricao="Um espaço para cada momento da jornada escolar. Escolha por onde começar."
                id="home-acessos-titulo"
              />
            </RevealSection>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {ACESSOS.map(
                ({
                  to,
                  numero,
                  rotulo,
                  titulo,
                  descricao,
                  chamada,
                  Icone,
                  estilo,
                  destaque,
                  imagem,
                }) => (
                  <Link
                    key={to}
                    to={to}
                    className={
                      "home-access-card group relative flex min-h-[12rem] flex-col overflow-hidden rounded-[1.5rem] border p-4 sm:p-5 " +
                      estilo +
                      (destaque ? " lg:min-h-[12rem]" : "")
                    }
                  >
                    <img
                      src={imagem}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      decoding="async"
                      width={768}
                      height={512}
                      className="home-access-photo pointer-events-none absolute inset-0 size-full object-cover"
                    />
                    <span
                      aria-hidden="true"
                      className="home-access-overlay pointer-events-none absolute inset-0"
                    />
                    <div className="relative z-10 flex items-start justify-between gap-3">
                      <span className="home-access-icon grid size-12 place-items-center rounded-2xl border border-current/15 bg-current/[0.08]">
                        <Icone className="size-6" aria-hidden="true" />
                      </span>
                      <span className="font-heading text-sm font-bold opacity-40">
                        {numero} / 06
                      </span>
                    </div>
                    <div className="relative z-10 mt-auto pt-12">
                      <span className="text-[11px] font-bold uppercase tracking-[0.17em] opacity-70">
                        {rotulo}
                      </span>
                      <h3 className="mt-2 max-w-[18ch] font-heading text-[clamp(1.45rem,2vw,2.15rem)] font-extrabold leading-[1.13] tracking-tight">
                        {titulo}
                      </h3>
                      <p className="mt-3 max-w-sm text-sm leading-relaxed opacity-80">
                        {descricao}
                      </p>
                      <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold">
                        {chamada}
                        <span className="home-access-arrow grid size-8 place-items-center rounded-full border border-current/20">
                          <ArrowRight className="size-4" aria-hidden="true" />
                        </span>
                      </span>
                    </div>
                    {destaque ? (
                      <span
                        aria-hidden="true"
                        className="home-access-decor absolute -right-12 top-20 hidden size-52 rounded-full border-[26px] border-white/10 lg:block"
                      />
                    ) : null}
                  </Link>
                ),
              )}
            </div>
          </section>

          <section
            id="laboratorio-agora"
            aria-labelledby="home-lab-titulo"
            className="home-live-section home-window-section scroll-mt-24 border-y border-border/60 bg-card/70 py-10 sm:py-14"
          >
            <div className="mx-auto max-w-[86rem] px-4 sm:px-8 lg:px-10">
              <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <SectionIntro
                  etiqueta="Acompanhe em tempo real"
                  titulo="O laboratório está vivo."
                  descricao="Turmas, horários e a próxima atividade, com as informações que o professor registra durante o dia."
                  id="home-lab-titulo"
                />
                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  <ClimaCompacto />
                  {isAuthenticated && !feriadoHoje ? (
                    <MarcarAlunosCartao dados={dadosLab} compacto />
                  ) : null}
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-full border-border bg-background"
                  >
                    <Link to="/agenda">
                      Agenda completa <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="home-live-panel min-h-[20rem] overflow-hidden rounded-[1.5rem] border border-border bg-background p-2 shadow-xl shadow-ink/5 sm:p-3">
                {feriadoHoje ? (
                  <div className="grid min-h-[24rem] place-items-center rounded-2xl bg-muted/40 px-5 py-10">
                    <AvisoFeriado dataISO={hojeNaEscola()} variante="painel" />
                  </div>
                ) : (
                  <PainelLaboratorioAgora dados={dadosLab} logado={isAuthenticated} />
                )}
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
                Informações atualizadas conforme os registros do laboratório.
              </div>
            </div>
          </section>

          <div className="home-between py-5 sm:py-7">
            <BannerEntreTurnos />
          </div>

          <section
            aria-labelledby="home-metodo-titulo"
            className="home-section mx-auto max-w-[86rem] px-4 py-12 sm:px-8 sm:py-16 lg:px-10"
          >
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-14">
              <RevealSection>
                <SectionIntro
                  etiqueta="Educação com propósito"
                  titulo="Tecnologia a serviço de cada descoberta."
                  descricao="Uma rotina planejada, acolhedora e cheia de possibilidades. O digital faz parte do aprendizado, sem perder o olhar humano."
                  id="home-metodo-titulo"
                />
                <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-border bg-card p-2 shadow-lg shadow-ink/5">
                  <img
                    src={heroTechBgImg}
                    alt="Ambiente de tecnologia e recursos de informática"
                    loading="lazy"
                    decoding="async"
                    className="home-method-image aspect-[16/10] w-full rounded-[1.3rem] object-cover"
                  />
                  <div className="flex items-center gap-2 px-3 pb-2 pt-4 text-xs font-semibold text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                    Aprendizagem, criatividade e colaboração
                  </div>
                </div>
              </RevealSection>
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                {ETAPAS.map(({ numero, titulo, descricao, Icone }) => (
                  <div
                    key={numero}
                    className="home-step-card rounded-[1.5rem] border border-border bg-card p-6 shadow-sm sm:p-7"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <Icone className="size-5" aria-hidden="true" />
                      </span>
                      <span className="font-heading text-sm font-extrabold text-muted-foreground/50">
                        {numero}
                      </span>
                    </div>
                    <h3 className="mt-8 font-heading text-xl font-extrabold leading-tight tracking-tight">
                      {titulo}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {descricao}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            aria-labelledby="home-comunidade-titulo"
            className="home-section home-window-section border-t border-border/60 bg-card/65 py-10 sm:py-14"
          >
            <div className="mx-auto max-w-[86rem] px-4 sm:px-8 lg:px-10">
              <SectionIntro
                etiqueta="Nossa comunidade escolar"
                titulo="Aprender também é compartilhar."
                descricao="Resultados, experiências e momentos que fazem parte da vida escolar."
                id="home-comunidade-titulo"
              />
              <div className="mt-8 grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
                <div className="home-results-card relative isolate flex min-h-[24rem] flex-col overflow-hidden rounded-[1.9rem] bg-ink p-7 text-white sm:p-9">
                  <img
                    src={escolaInformaticaHeroImg}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="absolute inset-0 -z-30 size-full object-cover opacity-30"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 -z-20 bg-gradient-to-br from-ink/95 via-ink/85 to-primary/50"
                  />
                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-sun">
                    <CheckCircle2 className="size-4" aria-hidden="true" /> Acompanhamento
                  </span>
                  <div className="mt-auto pt-16">
                    <h3 className="max-w-[15ch] font-heading text-[clamp(2rem,3vw,3rem)] font-extrabold leading-[1.08] tracking-tight">
                      Resultados que orientam o próximo passo.
                    </h3>
                    <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
                      Indicadores por turma ajudam a compreender o desenvolvimento dos estudantes,
                      sem identificar crianças publicamente.
                    </p>
                    <Button
                      asChild
                      size="lg"
                      className="mt-7 rounded-full bg-sun px-6 font-bold text-sun-foreground hover:bg-sun/90"
                    >
                      <Link to="/resultados">
                        Ver resultados <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </div>
                <CanalYoutubeCard />
              </div>
            </div>
          </section>

          <section
            aria-label="Acesso da equipe"
            className="home-last-cta px-4 py-7 sm:px-8 sm:py-9 lg:px-10"
          >
            <div className="mx-auto flex max-w-[86rem] flex-col gap-5 rounded-[1.8rem] border border-border bg-card px-6 py-7 shadow-sm sm:px-9 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldCheck className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-heading text-xl font-extrabold tracking-tight">
                    Um espaço também para a equipe.
                  </h2>
                  <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    Professores e responsáveis autorizados podem acessar os recursos de gestão e
                    acompanhamento.
                  </p>
                </div>
              </div>
              <Button asChild size="lg" className="shrink-0 rounded-full px-6 font-bold">
                {isAuthenticated ? (
                  <Link to="/dashboard">
                    Abrir painel <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                ) : (
                  <Link to="/login">
                    Acesso da equipe <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                )}
              </Button>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}

function HeroStat({
  rotulo,
  curto,
  detalhe,
  valor,
  isReady,
  Icone,
}: {
  rotulo: string;
  /** Versão curta para o celular, onde o rótulo inteiro quebraria em duas linhas. */
  curto: string;
  detalhe: string;
  valor: number;
  isReady: boolean;
  Icone: LucideIcon;
}) {
  return (
    <div className="home-stat-cell px-4 py-5 sm:px-6">
      <div className="flex items-center gap-2 text-white/60">
        <Icone className="size-4 shrink-0 text-sun" aria-hidden="true" />
        <span className="text-[11px] font-bold uppercase tracking-[0.12em]">
          <span className="sm:hidden">{curto}</span>
          <span className="hidden sm:inline">{rotulo}</span>
        </span>
      </div>
      {isReady ? (
        <StatCounter valor={valor} />
      ) : (
        <div
          className="mt-3 h-8 w-16 animate-pulse rounded-lg bg-white/20"
          aria-label="Carregando"
        />
      )}
      <span className="mt-0.5 block text-xs text-white/60">{detalhe}</span>
    </div>
  );
}

function StatCounter({ valor }: { valor: number }) {
  const { ref, exibido } = useCountUp(valor);
  return (
    <div
      ref={ref as RefObject<HTMLDivElement | null>}
      className="mt-1 font-heading text-[1.85rem] font-extrabold leading-none tracking-tight tabular-nums text-white sm:text-[2.1rem]"
    >
      {exibido}
    </div>
  );
}

function RevealSection({ className, children }: { className?: string; children: ReactNode }) {
  const { ref, className: revealClassName } = useScrollReveal<HTMLElement>();
  return (
    <section ref={ref} className={(className || "") + " " + revealClassName}>
      {children}
    </section>
  );
}

function SectionIntro({
  etiqueta,
  titulo,
  descricao,
  id,
}: {
  etiqueta: string;
  titulo: string;
  descricao: string;
  id: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.17em] text-primary">
        <span className="h-px w-7 bg-primary" aria-hidden="true" />
        {etiqueta}
      </p>
      <h2
        id={id}
        className="mt-3 max-w-[19ch] font-heading text-[clamp(2rem,3.5vw,3.5rem)] font-extrabold leading-[1.06] tracking-[-0.045em] text-foreground"
      >
        {titulo}
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
        {descricao}
      </p>
    </div>
  );
}

function CanalYoutubeCard() {
  return (
    <div className="home-videos-card flex h-full min-h-[24rem] flex-col overflow-hidden rounded-[1.9rem] border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-red-600 dark:text-red-400">
            <span className="grid size-8 place-items-center rounded-xl bg-red-600 text-white">
              <Youtube className="size-5" aria-hidden="true" />
            </span>
            A escola em vídeo
          </p>
          <h3 className="mt-4 max-w-[18ch] font-heading text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
            Histórias que merecem ser vistas.
          </h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Registros de atividades, experiências e momentos da nossa escola.
          </p>
        </div>
        <a
          href={CANAL_YOUTUBE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-bold transition-colors hover:border-primary/50 hover:text-primary"
        >
          Ver canal <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      </div>
      <div className="mt-7 grid flex-1 grid-cols-3 gap-2.5 sm:gap-4">
        {VIDEOS_DESTAQUE.map((video) => (
          <VideoThumb key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}

function VideoThumb({ video }: { video: { id: string; titulo: string } }) {
  const [falhou, setFalhou] = useState(false);
  return (
    <a
      href={"https://www.youtube.com/shorts/" + video.id}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={"Assistir: " + video.titulo}
      className="home-video-thumb group relative block aspect-[9/15] overflow-hidden rounded-[1.1rem] bg-ink text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
    >
      {!falhou ? (
        <img
          src={"https://i.ytimg.com/vi/" + video.id + "/hqdefault.jpg"}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFalhou(true)}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <span className="grid size-full place-items-center bg-gradient-to-b from-ink to-red-950">
          <Youtube className="size-9 text-red-400" aria-hidden="true" />
        </span>
      )}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20"
      />
      <span className="absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-red-600 shadow-lg transition-transform duration-300 group-hover:scale-110 sm:size-12">
        <Play className="ml-0.5 size-5 fill-current" aria-hidden="true" />
      </span>
      <span className="absolute inset-x-0 bottom-0 line-clamp-3 px-2 pb-3 text-[11px] font-bold leading-snug text-white sm:p-3 sm:text-xs">
        {video.titulo}
      </span>
    </a>
  );
}
