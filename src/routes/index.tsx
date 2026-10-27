import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  BookOpen,
  CalendarClock,
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
  Timer,
  Users2,
  Youtube,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCountUp } from "@/hooks/use-count-up";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { MarcarAlunosCartao } from "@/components/school/laboratorio/marcar-dialog";
import { PainelLaboratorioAgora } from "@/components/school/laboratorio/painel-agora";
import { WeatherWidget } from "@/components/school/weather-widget";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { AvisoDireitosImagem, SiteImage } from "@/components/school/site-image";
import { SiteFooter } from "@/components/school/site-footer";
import { useAppStore } from "@/lib/app-store";
import { useAuth } from "@/lib/auth-store";
import { useSessoesLab } from "@/lib/laboratorio";
import { cn } from "@/lib/utils";
import escolaInformaticaHeroImg from "@/assets/escola-informatica-hero.jpg";
import alunosImg1 from "@/assets/alunos-1.jpg";
import alunosImg2 from "@/assets/alunos-2.jpg";
import alunosImg3 from "@/assets/alunos-3.jpg";
import laboratorioTurmaFotoImg from "@/assets/image3.png";
import alunoJogoImg from "@/assets/image2.jpeg";
import alunoSorridenteImg from "@/assets/image10.jpeg";
import homePageBgImg from "@/assets/homepage-bg.svg";
import heroTechBgImg from "@/assets/feature-tools.jpg";
import featureKidsBgImg from "@/assets/feature-kids-learning.jpg";

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
          "Laboratório de informática da Escola Dr. Eiraldo: veja quais alunos estão no laboratório agora, até que horas, e como a escola organiza o revezamento.",
      },
      { property: "og:title", content: "Agenda de Informática · Dr. Eiraldo Carneiro de França" },
      {
        property: "og:description",
        content:
          "Laboratório de informática da Escola Dr. Eiraldo: veja quais alunos estão no laboratório agora, até que horas, e como a escola organiza o revezamento.",
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
  const { isAuthenticated } = useAuth();
  const lab = useSessoesLab();
  const totalAlunos = turmas.reduce((sum, t) => sum + t.alunos.length, 0);

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        <section className="relative overflow-hidden border-b border-border/60">
          {/* Foto de ambiente (laptop + ícones de produtividade) bem desfocada e
              apagada — dá cor e textura ao hero sem competir com o texto; os
              véus abaixo garantem contraste por cima dela. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-20 scale-110 bg-cover bg-right opacity-[0.14] blur-2xl dark:opacity-[0.22]"
            style={{ backgroundImage: `url("${heroTechBgImg}")` }}
          />
          {/* O padrão de marca é a camada mais baixa. No celular a seção fica
              alta e estreita, então o bg-cover amplia muito o SVG — por isso
              ele entra bem apagado aqui e só ganha presença a partir do sm. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center opacity-30 sm:opacity-60"
            style={{ backgroundImage: `url("${homePageBgImg}")` }}
          />
          {/* Véu que define a luz do hero: claro e arejado no modo claro,
              azul-noite um tom acima do fundo da página no modo escuro. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-sky-50/85 via-white/55 to-background dark:from-muted/35 dark:via-background/60 dark:to-background"
          />
          {/* Dois respiros radiais de cor por cima do véu — a "tira" âmbar
              decorativa que existia aqui antes saiu por não somar nada. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_-10%,rgba(56,130,246,0.16),transparent_55%),radial-gradient(circle_at_100%_8%,rgba(14,165,233,0.13),transparent_50%)]"
          />
          <div className="mx-auto grid max-w-6xl gap-5 px-4 py-6 sm:gap-6 sm:px-6 sm:py-8 lg:grid-cols-2 lg:items-center lg:py-10">
            <div>
              <Badge className="mb-3 gap-1.5 rounded-full border-blue-400/30 bg-blue-500/10 px-3 py-1.5 text-sm text-blue-700 shadow-sm backdrop-blur-md dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-200">
                <MonitorSmartphone className="size-4" /> Laboratório de informática
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
                O professor {config.professorInformatica} escolhe os alunos de cada turma que vão ao
                laboratório, define o tempo de cada grupo e o painel abaixo mostra, ao vivo, quem
                está lá e até que horas.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <a href="#laboratorio-agora">
                    <MonitorSmartphone /> Ver quem está no laboratório
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/dashboard">
                    <LayoutDashboard /> Painel de gestão
                  </Link>
                </Button>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-2.5 rounded-2xl border border-white/40 bg-white/30 p-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 sm:grid-cols-4 sm:gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-violet-400/25 bg-violet-500/10 text-violet-600 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300">
                    <BookOpen className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[13px] leading-none text-muted-foreground">Turmas</dt>
                    {isReady ? (
                      <StatCounter valor={turmas.length} />
                    ) : (
                      <div className="mt-1.5 h-6 w-8 animate-pulse rounded bg-muted-foreground/20" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-blue-400/25 bg-blue-500/10 text-blue-600 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
                    <Users2 className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[13px] leading-none text-muted-foreground">Alunos</dt>
                    {isReady ? (
                      <StatCounter valor={totalAlunos} />
                    ) : (
                      <div className="mt-1.5 h-6 w-10 animate-pulse rounded bg-muted-foreground/20" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                    <MonitorSmartphone className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[13px] leading-none text-muted-foreground">Máquinas</dt>
                    {isReady ? (
                      <StatCounter valor={config.numeroComputadores} />
                    ) : (
                      <div className="mt-1.5 h-6 w-8 animate-pulse rounded bg-muted-foreground/20" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-amber-400/25 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
                    <Clock3 className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[13px] leading-none text-muted-foreground">Horário</dt>
                    <dd className="text-lg font-semibold leading-tight text-foreground">
                      {config.horaInicio}–{config.horaFim}
                    </dd>
                  </div>
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
                <div aria-hidden className="absolute inset-0 hidden bg-slate-900/25 lg:block" />
                <SiteImage
                  src={escolaInformaticaHeroImg}
                  alt="Escola Municipal Dr. Eiraldo Carneiro - Informática é porta para o futuro com alunos no laboratório"
                  width={854}
                  height={302}
                  className="relative -mx-4 aspect-[854/302] w-auto overflow-hidden border-y border-border bg-card shadow-lg dark:border-white/10 dark:bg-card/60 dark:shadow-2xl dark:backdrop-blur-xl sm:mx-0 sm:w-full sm:rounded-2xl sm:border lg:w-full lg:rounded-2xl"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
            <PainelLaboratorioAgora dados={lab} logado={isAuthenticated} />
            <div className="space-y-4">
              {isAuthenticated ? <MarcarAlunosCartao dados={lab} /> : null}
              <WeatherWidget />
            </div>
          </div>
        </section>

        <RevealSection className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <MonitorSmartphone className="size-3.5 text-primary" /> Nosso laboratório
          </p>
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

        <RevealSection className="relative mx-auto max-w-6xl overflow-hidden px-4 py-6 sm:px-6">
          {/* Foto de ambiente infantil/educacional, bem apagada — só um toque de
              cor atrás dos cards, coerente com o tema "aprendizado digital". */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center opacity-[0.1] blur-md dark:opacity-[0.14]"
            style={{ backgroundImage: `url("${featureKidsBgImg}")` }}
          />
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold text-foreground">
                Como funciona o laboratório
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                O professor de informática escolhe os alunos do dia, define o tempo de cada grupo e
                o painel mostra quem está no laboratório e até que horas. O sistema também conta
                quantas vezes cada aluno já foi na semana e no mês, para o revezamento ser justo.
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
                    className="size-16 rounded-xl border border-border/60 shadow-sm sm:size-20"
                  />
                ),
              )}
            </div>
          </div>
          <AvisoDireitosImagem className="mt-2 sm:justify-end" />

          {/* Duas colunas já no celular: em coluna única os quatro cards viravam
              uma fila vertical longa demais, empurrando a grade da semana pra
              fora da tela. */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
            <FeatureCard
              icon={<Gamepad2 className="size-5" />}
              iconClassName="border-blue-400/25 bg-blue-500/10 text-blue-600 dark:border-blue-400/20 dark:bg-blue-500/20 dark:text-blue-300"
              title="Aprendizado digital"
              description="Tecnologia que estimula o raciocínio e a criatividade."
            />
            <FeatureCard
              icon={<CalendarClock className="size-5" />}
              iconClassName="border-violet-400/25 bg-violet-500/10 text-violet-600 dark:border-violet-400/20 dark:bg-violet-500/20 dark:text-violet-300"
              title="Escolha do dia"
              description="O professor marca os alunos de cada turma que vão ao laboratório."
            />
            <FeatureCard
              icon={<Timer className="size-5" />}
              iconClassName="border-amber-400/25 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/20 dark:text-amber-300"
              title="Tempo de cada grupo"
              description="Início e fim definidos pelo professor, com contagem regressiva ao vivo."
            />
            <FeatureCard
              icon={<ShieldCheck className="size-5" />}
              iconClassName="border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/20 dark:text-emerald-300"
              title="Revezamento justo"
              description="Aviso quando um aluno já foi ao laboratório na semana ou no mês."
            />
          </div>
        </RevealSection>

        <CanalYoutubeSection />

        <section className="border-t border-border/60 bg-gradient-to-b from-muted/50 to-background">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-5 text-center sm:px-6">
            <span className="flex size-9 items-center justify-center rounded-full border border-blue-400/25 bg-blue-500/10 text-blue-600 shadow-sm dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
              <GraduationCap className="size-5" />
            </span>
            <h2 className="text-base font-semibold text-foreground">{config.nomeEscola}</h2>
            <p className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">INEP {config.inep}</span>
              <span aria-hidden className="text-border">
                ·
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5 shrink-0" /> {config.endereco}
              </span>
            </p>
          </div>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}

const CANAL_YOUTUBE_URL = "https://www.youtube.com/@DrEiraldoIntegral";

const VIDEOS_DESTAQUE = [
  { id: "3zxaoWcPAtg", titulo: "Primeiros passos na informática" },
  { id: "U6r_g4UWB9g", titulo: "Aula de informática" },
  { id: "URKMI30t744", titulo: "Visita da Defensoria Pública na escola" },
];

/**
 * Divulgação discreta do canal oficial da escola no YouTube: miniaturas reais
 * (sem incorporar o player, mais leve) que abrem o vídeo em uma nova aba.
 */
function CanalYoutubeSection() {
  return (
    <RevealSection className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-red-400/20 bg-gradient-to-br from-red-500/[0.06] via-transparent to-transparent p-4 dark:border-red-400/15 dark:from-red-400/[0.05] sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:items-center">
          <div>
            <Badge className="mb-2 gap-1.5 rounded-full border-red-400/30 bg-red-500/10 px-3 py-1.5 text-sm text-red-700 shadow-sm backdrop-blur-md dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-300">
              <Youtube className="size-4" /> Canal da escola
            </Badge>
            <h2 className="text-xl font-semibold text-foreground">Acompanhe no YouTube</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Bastidores das aulas de informática e da rotina da escola, em vídeo.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4 w-fit text-sm">
              <a href={CANAL_YOUTUBE_URL} target="_blank" rel="noopener noreferrer">
                Ver canal completo <ExternalLink className="size-4" />
              </a>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {VIDEOS_DESTAQUE.map((video) => (
              <VideoThumb key={video.id} video={video} />
            ))}
          </div>
        </div>
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
        <div className="flex size-full flex-col items-center justify-center gap-1 bg-red-500/10 p-1.5 text-center dark:bg-red-500/15">
          <Youtube className="size-4 text-red-600 dark:text-red-400" />
          <span className="line-clamp-2 text-xs font-medium leading-tight text-muted-foreground">
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
          <span className="absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-black/75 to-transparent p-1.5 text-[13px] font-medium leading-tight text-white">
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
    <Card className="group flex h-full flex-col transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <CardHeader className="p-3.5 pb-1.5 sm:p-6 sm:pb-2">
        <span
          className={`group-hover-hop mb-2 flex size-9 items-center justify-center rounded-full border sm:size-11 ${iconClassName ?? "border-primary/20 bg-primary/10 text-primary"}`}
        >
          {icon}
        </span>
        <CardTitle className="text-sm leading-snug text-balance sm:text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3.5 pt-0 sm:p-6 sm:pt-0">
        <p className="text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
