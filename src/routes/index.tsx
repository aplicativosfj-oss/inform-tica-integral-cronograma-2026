import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Gamepad2,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Maximize2,
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
import { FaixaNomesHome } from "@/components/school/laboratorio/faixa-nomes-home";
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
import { hojeNaEscola, useSessoesLab } from "@/lib/laboratorio";
import { useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import escolaInformaticaHeroImg from "@/assets/escola-informatica-hero.jpg";
import labFotoImg from "@/assets/laboratorio-informatica-turma.jpg";
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

/**
 * Mosaico de acessos: a agenda ocupa o bloco grande, a área do aluno a faixa
 * larga ao lado, e os demais espaços se encaixam em volta, sem buracos.
 */
const ACESSOS: {
  to: "/agenda" | "/aluno" | "/infoteca" | "/sala-de-jogos" | "/resultados" | "/avaliacao";
  imagem: string;
  rotulo: string;
  titulo: string;
  descricao: string;
  chamada: string;
  Icone: LucideIcon;
  /** Posição no mosaico do computador. */
  tamanho: "grande" | "largo" | "normal";
  cor: string;
}[] = [
  {
    to: "/agenda",
    imagem: "/images/image10-1024w.webp",
    rotulo: "Organização",
    titulo: "Agenda do laboratório",
    descricao: "Aulas, horários e turmas da semana, com o laboratório ao vivo.",
    chamada: "Ver programação",
    Icone: CalendarDays,
    tamanho: "grande",
    cor: "oklch(0.83 0.165 85)",
  },
  {
    to: "/aluno",
    imagem: "/images/image1-1024w.webp",
    rotulo: "Para os estudantes",
    titulo: "Meu espaço de aprender",
    descricao: "Trilhas, desafios e atividades para avançar no seu ritmo.",
    chamada: "Área do aluno",
    Icone: GraduationCap,
    tamanho: "largo",
    cor: "oklch(0.75 0.15 290)",
  },
  {
    to: "/infoteca",
    imagem: "/images/image2-768w.webp",
    rotulo: "Conhecimento",
    titulo: "Infoteca digital",
    descricao: "Materiais e descobertas para ampliar o aprendizado.",
    chamada: "Explorar acervo",
    Icone: BookOpen,
    tamanho: "normal",
    cor: "oklch(0.8 0.13 175)",
  },
  {
    to: "/sala-de-jogos",
    imagem: "/images/image3-768w.webp",
    rotulo: "Aprender brincando",
    titulo: "Jogos educativos",
    descricao: "Raciocínio, criatividade e prática em cada desafio.",
    chamada: "Abrir jogos",
    Icone: Gamepad2,
    tamanho: "normal",
    cor: "oklch(0.78 0.15 340)",
  },
  {
    to: "/resultados",
    imagem: "/images/image4-1024w.webp",
    rotulo: "Transparência",
    titulo: "Resultados da escola",
    descricao: "Um olhar sobre a aprendizagem e a evolução das turmas.",
    chamada: "Acompanhar",
    Icone: LayoutDashboard,
    tamanho: "largo",
    cor: "oklch(0.78 0.12 240)",
  },
  {
    to: "/avaliacao",
    imagem: "/images/image6-1024w.webp",
    rotulo: "Acompanhamento",
    titulo: "Avaliações",
    descricao: "Instrumentos e indicadores que ajudam a orientar o ensino.",
    chamada: "Ver avaliações",
    Icone: CheckCircle2,
    tamanho: "largo",
    cor: "oklch(0.8 0.14 150)",
  },
];

const ETAPAS: { titulo: string; descricao: string; Icone: LucideIcon }[] = [
  {
    titulo: "Cada turma tem seu momento",
    descricao: "A programação distribui os computadores entre os grupos da escola.",
    Icone: CalendarDays,
  },
  {
    titulo: "Tudo em tempo real",
    descricao: "O painel mostra quando a aula começa, quanto falta e quem vem depois.",
    Icone: Clock3,
  },
  {
    titulo: "Participação acompanhada",
    descricao: "Os registros garantem que todos tenham a sua vez no laboratório.",
    Icone: Users2,
  },
  {
    titulo: "Além do laboratório",
    descricao: "Jogos, trilhas e materiais levam as descobertas para outros momentos.",
    Icone: Sparkles,
  },
];

const CANAL_YOUTUBE_URL = "https://www.youtube.com/@DrEiraldoIntegral";

const VIDEOS_DESTAQUE = [
  { id: "3zxaoWcPAtg", titulo: "Primeiros passos na informática" },
  { id: "U6r_g4UWB9g", titulo: "Aula de informática" },
  { id: "URKMI30t744", titulo: "Visita da Defensoria Pública na escola" },
];

/** Guarda a posição do ponteiro no cartão para o brilho que segue o mouse. */
function seguirPonteiro(e: PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

function Index() {
  const { turmas, config, isReady } = useAppStore();
  const { isAuthenticated } = useAuth();
  const lab = useSessoesLab();
  const totalAlunos = turmas.reduce((soma, turma) => soma + turma.alunos.length, 0);
  const idsDoFundamental = new Set(turmas.map((turma) => turma.id));
  const sessoes = lab.sessoes.filter((s) => idsDoFundamental.has(s.turmaId));
  const ausencias = lab.ausencias?.filter((s) => idsDoFundamental.has(s.turmaId));
  const dadosLab = { ...lab, sessoes, ausencias };
  const hoje = hojeNaEscola();
  const feriadoHoje = feriadoNacionalEm(hoje);
  const alternarTelaGrande = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // O navegador pode exigir gesto explícito para permitir tela cheia.
    }
  };

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
          {/* ───────────── abertura ───────────── */}
          <section
            aria-labelledby="home-titulo"
            className="home-hero relative isolate overflow-hidden text-white"
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
            <div aria-hidden="true" className="home-hero-aurora absolute inset-0 -z-20" />
            <div aria-hidden="true" className="home-hero-grid absolute inset-0 -z-10" />

            <div className="mx-auto max-w-[84rem] px-4 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-7 lg:px-10">
              {/* Assinatura da escola e o botão de tela grande numa linha só. */}
              <div
                data-constelacao-evitar
                className="home-signature flex items-center justify-between gap-3 pb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70 sm:text-[11px] sm:tracking-[0.2em]"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-white/15 bg-white/10">
                    <MarcaLogo tamanho={18} />
                  </span>
                  <span className="truncate">
                    <span className="sm:hidden">E. M. Dr. Eiraldo C. de França</span>
                    <span className="hidden sm:inline">
                      Escola Municipal Dr. Eiraldo Carneiro de França
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="hidden items-center gap-1.5 md:inline-flex">
                    <MapPin className="size-3.5 text-sun" aria-hidden="true" />
                    Feijó, Acre · 2026
                  </span>
                  <button
                    type="button"
                    onClick={alternarTelaGrande}
                    aria-label="Ativar ou sair da tela grande"
                    title="Tela grande"
                    className="grid size-8 place-items-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                  >
                    <Maximize2 className="size-3.5" aria-hidden="true" />
                  </button>
                </span>
              </div>

              {feriadoHoje ? (
                <AvisoFeriado dataISO={hoje} variante="sobre-imagem" className="mt-5" />
              ) : null}

              <div className="mt-6 grid items-center gap-6 sm:mt-8 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.95fr)] lg:gap-12">
                <div data-constelacao-evitar className="max-w-2xl">
                  <p className="home-hero-entrance inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] py-1.5 pl-2 pr-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white/90 backdrop-blur-xl">
                    <span className="relative flex size-2">
                      <span className="absolute inset-0 animate-ping rounded-full bg-emerald-300/70" />
                      <span className="relative size-2 rounded-full bg-emerald-300" />
                    </span>
                    Educação integral & tecnologia
                  </p>
                  <h1
                    id="home-titulo"
                    className="home-hero-entrance mt-4 font-heading text-[clamp(2.1rem,4.6vw,4rem)] font-extrabold leading-[1.02] tracking-[-0.045em]"
                  >
                    Um universo de <span className="home-headline-accent">descobertas</span>,
                    <br className="hidden sm:block" /> todos os dias.
                  </h1>
                  <p className="home-hero-entrance mt-4 max-w-[34rem] text-pretty text-sm leading-relaxed text-white/75 sm:text-[1.05rem]">
                    O laboratório de informática aproxima nossos estudantes da tecnologia, da
                    criatividade e de novas formas de aprender. Acompanhe a escola em tempo real.
                  </p>
                  <div className="home-hero-entrance mt-6 flex flex-wrap gap-2.5">
                    <Button
                      asChild
                      size="lg"
                      className="home-cta-primary h-12 min-w-0 flex-1 rounded-full bg-sun px-5 font-bold text-sun-foreground hover:bg-sun sm:flex-none sm:px-6"
                    >
                      <Link to="/agenda">
                        <CalendarDays className="size-5 shrink-0" aria-hidden="true" />
                        <span className="truncate">
                          <span className="sm:hidden">Agenda</span>
                          <span className="hidden sm:inline">Explorar agenda</span>
                        </span>
                        <ArrowRight className="home-cta-arrow size-4 shrink-0" aria-hidden="true" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="h-12 min-w-0 flex-1 rounded-full border-white/20 bg-white/[0.07] px-5 font-bold text-white backdrop-blur-xl hover:border-white/40 hover:bg-white/15 hover:text-white sm:flex-none sm:px-6"
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
                </div>

                <div className="home-live-frame min-w-0">
                  <div className="home-live-glow rounded-[1.5rem] p-px">
                    <CartaoAoVivoHome
                      sessoes={sessoes}
                      ausencias={ausencias}
                      logado={isAuthenticated}
                    />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between gap-3 px-1 text-xs text-white/60">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="size-3.5" aria-hidden="true" /> Horário de Feijó
                    </span>
                    <Link
                      to="/agenda"
                      className="group inline-flex shrink-0 items-center gap-1 font-bold text-sun"
                    >
                      Ver detalhes
                      <ArrowUpRight
                        className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </div>
              </div>

              {feriadoHoje ? null : <FaixaNomesHome sessoes={sessoes} logado={isAuthenticated} />}

              <div className="home-hero-stats mt-6 grid grid-cols-2 gap-2 sm:mt-8 sm:grid-cols-4 sm:gap-3">
                <HeroStat
                  to="/agenda"
                  rotulo="Turmas atendidas"
                  detalhe="1º ao 5º ano"
                  valor={turmas.length}
                  isReady={isReady}
                  Icone={GraduationCap}
                />
                <HeroStat
                  to="/agenda"
                  rotulo="Alunos ativos"
                  detalhe="Matrículas vigentes"
                  valor={totalAlunos}
                  isReady={isReady}
                  Icone={Users2}
                />
                <HeroStat
                  href="#laboratorio-agora"
                  rotulo="Computadores"
                  detalhe="Estações de uso"
                  valor={config.numeroComputadores}
                  isReady={isReady}
                  Icone={MonitorSmartphone}
                />
                <HeroStat
                  href="#laboratorio-agora"
                  rotulo="Funcionamento"
                  detalhe="Horário da escola"
                  texto={`${config.horaInicio}–${config.horaFim}`}
                  isReady={isReady}
                  Icone={Clock3}
                />
              </div>
            </div>
            <AvisoDireitosImagem className="mx-auto max-w-[84rem] px-4 pb-3 text-white/40 sm:px-8" />
          </section>

          {/* ───────────── acessos ───────────── */}
          <section
            aria-labelledby="home-acessos-titulo"
            className="home-section mx-auto max-w-[84rem] px-4 py-10 sm:px-8 sm:py-14 lg:px-10"
          >
            <Reveal>
              <SectionIntro
                etiqueta="Explore a plataforma"
                titulo="Tudo o que você precisa, em um só lugar."
                descricao="Um espaço para cada momento da jornada escolar."
                id="home-acessos-titulo"
                acao={
                  <Link
                    to="/sobre"
                    className="group inline-flex items-center gap-1.5 text-sm font-bold text-primary"
                  >
                    Conheça o projeto
                    <ArrowRight
                      className="size-4 transition group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                }
              />
            </Reveal>
            <Reveal className="home-bento mt-6 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
              {ACESSOS.map((a) => (
                <CartaoAcesso key={a.to} {...a} />
              ))}
            </Reveal>
          </section>

          {/* ───────────── laboratório ao vivo ───────────── */}
          <section
            id="laboratorio-agora"
            aria-labelledby="home-lab-titulo"
            className="home-live-section scroll-mt-24 border-y border-border/60 py-10 sm:py-14"
          >
            <div className="mx-auto max-w-[84rem] px-4 sm:px-8 lg:px-10">
              <Reveal>
                <SectionIntro
                  etiqueta="Acompanhe em tempo real"
                  titulo="O laboratório está vivo."
                  descricao="Turmas, horários e a próxima atividade, como o professor registra durante o dia."
                  id="home-lab-titulo"
                  acao={
                    <div className="flex flex-wrap items-center gap-2">
                      <ClimaCompacto />
                      {isAuthenticated && !feriadoHoje ? (
                        <MarcarAlunosCartao dados={dadosLab} compacto rotulo="Marcar alunos" />
                      ) : null}
                      {isAuthenticated ? (
                        <Button asChild size="sm" variant="outline" className="h-9 rounded-full">
                          <Link to="/dashboard">
                            Painel <ArrowRight className="size-4" />
                          </Link>
                        </Button>
                      ) : null}
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-9 rounded-full border-border bg-background"
                      >
                        <Link to="/agenda">
                          Agenda completa <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                      </Button>
                    </div>
                  }
                />
              </Reveal>
              <div className="home-live-panel mt-5 min-w-0 overflow-hidden rounded-[1.4rem] border border-border bg-background p-1.5 sm:p-2">
                {feriadoHoje ? (
                  <div className="grid min-h-[20rem] place-items-center rounded-2xl bg-muted/40 px-5 py-10">
                    <AvisoFeriado dataISO={hoje} variante="painel" />
                  </div>
                ) : (
                  <PainelLaboratorioAgora dados={dadosLab} logado={isAuthenticated} compacto />
                )}
              </div>
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="relative flex size-2" aria-hidden="true">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/60" />
                  <span className="relative size-2 rounded-full bg-emerald-500" />
                </span>
                Atualizado automaticamente com os registros do laboratório.
              </p>
            </div>
          </section>

          <div className="home-between py-4 sm:py-6">
            <BannerEntreTurnos />
          </div>

          {/* ───────────── como funciona ───────────── */}
          <section
            aria-labelledby="home-metodo-titulo"
            className="home-section mx-auto max-w-[84rem] px-4 py-10 sm:px-8 sm:py-14 lg:px-10"
          >
            <Reveal>
              <SectionIntro
                etiqueta="Educação com propósito"
                titulo="Tecnologia a serviço de cada descoberta."
                descricao="Uma rotina planejada e acolhedora, em que o digital faz parte do aprendizado sem perder o olhar humano."
                id="home-metodo-titulo"
              />
            </Reveal>
            <Reveal className="home-steps relative mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
              {ETAPAS.map(({ titulo, descricao, Icone }, i) => (
                <article
                  key={titulo}
                  onPointerMove={seguirPonteiro}
                  className="home-step-card group relative overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="home-step-node relative grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                      <Icone className="size-5" aria-hidden="true" />
                    </span>
                    <span className="font-heading text-xs font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
                      Passo {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 font-heading text-base font-extrabold leading-tight tracking-tight sm:text-lg">
                    {titulo}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {descricao}
                  </p>
                </article>
              ))}
            </Reveal>
          </section>

          {/* ───────────── comunidade ───────────── */}
          <section
            aria-labelledby="home-comunidade-titulo"
            className="home-community border-t border-border/60 py-10 sm:py-14"
          >
            <div className="mx-auto max-w-[84rem] px-4 sm:px-8 lg:px-10">
              <Reveal>
                <SectionIntro
                  etiqueta="Nossa comunidade escolar"
                  titulo="Aprender também é compartilhar."
                  descricao="Resultados, experiências e momentos que fazem parte da vida escolar."
                  id="home-comunidade-titulo"
                />
              </Reveal>
              <Reveal className="mt-6 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
                <Link
                  to="/resultados"
                  onPointerMove={seguirPonteiro}
                  className="home-results-card group relative isolate flex min-h-[16rem] flex-col overflow-hidden rounded-[1.4rem] bg-ink p-5 text-white sm:p-7"
                >
                  <img
                    src={escolaInformaticaHeroImg}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="home-results-photo absolute inset-0 -z-30 size-full object-cover opacity-35"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 -z-20 bg-gradient-to-br from-ink via-ink/85 to-primary/60"
                  />
                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-sun backdrop-blur">
                    <CheckCircle2 className="size-4" aria-hidden="true" /> Acompanhamento
                  </span>
                  <div className="mt-auto pt-8">
                    <h3 className="max-w-[20ch] font-heading text-[clamp(1.4rem,2.3vw,2.1rem)] font-extrabold leading-[1.06] tracking-tight">
                      Resultados que orientam o próximo passo.
                    </h3>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
                      Indicadores por turma mostram o desenvolvimento dos estudantes, sem
                      identificar crianças publicamente.
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-sun px-5 py-2.5 text-sm font-bold text-sun-foreground transition group-hover:gap-3">
                      Ver resultados <ArrowRight className="size-4" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
                <CanalYoutubeCard />
              </Reveal>
            </div>
          </section>

          {/* ───────────── equipe ───────────── */}
          <section aria-label="Acesso da equipe" className="px-4 pb-10 sm:px-8 lg:px-10">
            <Reveal className="home-team-cta mx-auto flex max-w-[84rem] flex-col gap-5 rounded-[1.6rem] p-px md:flex-row">
              <div className="flex w-full flex-col gap-5 rounded-[calc(1.6rem-1px)] bg-card px-6 py-6 sm:px-8 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <ShieldCheck className="size-6" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="font-heading text-xl font-extrabold tracking-tight">
                      Um espaço também para a equipe.
                    </h2>
                    <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                      Professores e responsáveis autorizados acessam os recursos de gestão e
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
            </Reveal>
          </section>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}

function CartaoAcesso({
  to,
  imagem,
  rotulo,
  titulo,
  descricao,
  chamada,
  Icone,
  tamanho,
  cor,
}: (typeof ACESSOS)[number]) {
  return (
    <Link
      to={to}
      onPointerMove={seguirPonteiro}
      style={{ "--acento": cor } as CSSProperties}
      className={cn(
        "home-access-card group relative isolate flex flex-col overflow-hidden rounded-[1.25rem] p-3.5 text-white sm:p-5",
        tamanho === "grande" && "col-span-2 lg:row-span-2",
        tamanho === "largo" && "lg:col-span-2",
        // O último cartão fecha a grade de duas colunas no celular.
        to === "/avaliacao" && "col-span-2",
      )}
    >
      <img
        src={imagem}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="home-access-photo pointer-events-none absolute inset-0 -z-20 size-full object-cover"
      />
      <span
        aria-hidden="true"
        className="home-access-overlay pointer-events-none absolute inset-0 -z-10"
      />
      <span aria-hidden="true" className="home-spotlight pointer-events-none absolute inset-0" />
      <div className="flex items-start justify-between gap-3">
        <span className="home-access-icon grid size-9 place-items-center rounded-xl sm:size-10">
          <Icone className="size-[1.1rem] sm:size-5" aria-hidden="true" />
        </span>
        <span className="home-access-go grid size-8 place-items-center rounded-full sm:size-9">
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-auto pt-10">
        <span className="home-access-label hidden text-[10px] font-bold uppercase tracking-[0.2em] sm:block">
          {rotulo}
        </span>
        <h3
          className={cn(
            "mt-1 font-heading font-extrabold leading-[1.08] tracking-tight",
            tamanho === "grande"
              ? "text-[clamp(1.25rem,2.6vw,2.4rem)]"
              : "text-[clamp(1rem,1.6vw,1.35rem)]",
          )}
        >
          {titulo}
        </h3>
        <p
          className={cn(
            "mt-1.5 hidden max-w-md text-sm leading-snug text-white/75 sm:block",
            tamanho === "normal" && "lg:line-clamp-2",
          )}
        >
          {descricao}
        </p>
        <span className="home-access-cta mt-3 hidden items-center gap-1.5 text-xs font-bold sm:inline-flex">
          {chamada} <ArrowRight className="size-3.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

function HeroStat({
  rotulo,
  detalhe,
  valor,
  texto,
  isReady,
  Icone,
  to,
  href,
}: {
  rotulo: string;
  detalhe: string;
  valor?: number;
  texto?: string;
  isReady: boolean;
  Icone: LucideIcon;
  to?: "/agenda";
  href?: string;
}) {
  const corpo = (
    <>
      <span className="flex items-center justify-between">
        <span className="grid size-8 place-items-center rounded-xl bg-white/10 text-sun ring-1 ring-white/10">
          <Icone className="size-4" aria-hidden="true" />
        </span>
        <ArrowUpRight
          className="size-4 text-white/30 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-sun"
          aria-hidden="true"
        />
      </span>
      {!isReady ? (
        <span
          className="mt-3 block h-7 w-16 animate-pulse rounded-lg bg-white/15"
          aria-label="Carregando"
        />
      ) : texto ? (
        <span className="mt-2.5 block font-heading text-xl font-extrabold leading-none tracking-tight tabular-nums sm:text-[1.6rem]">
          {texto}
        </span>
      ) : (
        <StatCounter valor={valor ?? 0} />
      )}
      <span className="mt-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-white/80">
        {rotulo}
      </span>
      <span className="hidden text-[11px] text-white/50 sm:block">{detalhe}</span>
    </>
  );
  const classe =
    "home-stat-cell group relative block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 text-white backdrop-blur-xl transition sm:p-4";
  return to ? (
    <Link to={to} className={classe} onPointerMove={seguirPonteiro}>
      <span aria-hidden="true" className="home-spotlight pointer-events-none absolute inset-0" />
      {corpo}
    </Link>
  ) : (
    <a href={href} className={classe} onPointerMove={seguirPonteiro}>
      <span aria-hidden="true" className="home-spotlight pointer-events-none absolute inset-0" />
      {corpo}
    </a>
  );
}

function StatCounter({ valor }: { valor: number }) {
  const { ref, exibido } = useCountUp(valor);
  return (
    <span
      ref={ref as RefObject<HTMLSpanElement | null>}
      className="mt-2.5 block font-heading text-[1.75rem] font-extrabold leading-none tracking-tight tabular-nums sm:text-[2rem]"
    >
      {exibido}
    </span>
  );
}

/** Revela o bloco ao rolar; os filhos entram um depois do outro. */
function Reveal({ className, children }: { className?: string; children: ReactNode }) {
  const { ref, className: revelado } = useScrollReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn("home-reveal", revelado === "opacity-0" ? "" : "is-in", className)}
    >
      {children}
    </div>
  );
}

function SectionIntro({
  etiqueta,
  titulo,
  descricao,
  id,
  acao,
}: {
  etiqueta: string;
  titulo: string;
  descricao: string;
  id: string;
  acao?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary">
          <span
            className="h-px w-6 bg-gradient-to-r from-primary to-transparent"
            aria-hidden="true"
          />
          {etiqueta}
        </p>
        <h2
          id={id}
          className="mt-2.5 font-heading text-[clamp(1.6rem,3vw,2.6rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-foreground"
        >
          {titulo}
        </h2>
        <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {descricao}
        </p>
      </div>
      {acao ? <div className="shrink-0">{acao}</div> : null}
    </div>
  );
}

function CanalYoutubeCard() {
  return (
    <div className="home-videos-card flex h-full min-h-[16rem] flex-col overflow-hidden rounded-[1.4rem] border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-red-600 dark:text-red-400">
            <span className="grid size-7 place-items-center rounded-lg bg-red-600 text-white">
              <Youtube className="size-4" aria-hidden="true" />
            </span>
            A escola em vídeo
          </p>
          <h3 className="mt-3 font-heading text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">
            Histórias que merecem ser vistas.
          </h3>
        </div>
        <a
          href={CANAL_YOUTUBE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-bold transition-colors hover:border-red-500/50 hover:text-red-600"
        >
          Ver canal <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      </div>
      <div className="mt-4 grid flex-1 grid-cols-3 gap-2 sm:gap-3">
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
      className="home-video-thumb group relative block aspect-[4/5] max-h-60 overflow-hidden rounded-xl bg-ink text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
    >
      {!falhou ? (
        <img
          src={"https://i.ytimg.com/vi/" + video.id + "/hqdefault.jpg"}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFalhou(true)}
          className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      ) : (
        <span className="grid size-full place-items-center bg-gradient-to-b from-ink to-red-950">
          <Youtube className="size-9 text-red-400" aria-hidden="true" />
        </span>
      )}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent"
      />
      <span className="absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-red-600 shadow-lg backdrop-blur transition duration-300 group-hover:scale-110 group-hover:bg-white">
        <Play className="ml-0.5 size-5 fill-current" aria-hidden="true" />
      </span>
      <span className="absolute inset-x-0 bottom-0 line-clamp-3 px-2 pb-2.5 text-[11px] font-bold leading-snug sm:p-3 sm:text-xs">
        {video.titulo}
      </span>
    </a>
  );
}
