import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  ChevronRight,
  Clock,
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

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCountUp } from "@/hooks/use-count-up";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { MarcaLogo } from "@/components/school/marca";
import { MarcarAlunosCartao } from "@/components/school/laboratorio/marcar-dialog";
import { CartaoAoVivoHome } from "@/components/school/laboratorio/cartao-ao-vivo-home";
import { PainelLaboratorioAgora } from "@/components/school/laboratorio/painel-agora";
import { WeatherWidget } from "@/components/school/weather-widget";
import { NavBar } from "@/components/school/nav-bar";
import { BannerEntreTurnos } from "@/components/school/pausa/banner-home";
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
import labFotoImg from "@/assets/laboratorio-informatica-turma.jpg";
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
        title: "Informática · Escola Dr. Eiraldo Carneiro de França",
      },
      {
        name: "description",
        content:
          "Veja quem está no laboratório de informática da Escola Dr. Eiraldo agora, até que horas, e como a escola faz para todo aluno ter a sua vez.",
      },
      { property: "og:title", content: "Informática · Escola Dr. Eiraldo Carneiro de França" },
      {
        property: "og:description",
        content:
          "Veja quem está no laboratório de informática da Escola Dr. Eiraldo agora, até que horas, e como a escola faz para todo aluno ter a sua vez.",
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

        {/* ───────── Hero: foto do laboratório de fundo ───────── */}
        <section className="secao-janela relative isolate overflow-hidden border-b border-border/60 text-white">
          <div
            aria-hidden
            className="absolute inset-0 -z-30 bg-cover bg-[position:62%_35%]"
            style={{ backgroundImage: `url("${labFotoImg}")` }}
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-20 bg-gradient-to-r from-ink/95 via-ink/80 to-ink/35"
          />
          <div
            aria-hidden
            className="fundo-pixel absolute inset-0 -z-10 opacity-40 [mask-image:linear-gradient(to_right,black,transparent_75%)]"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 -z-10 hidden h-24 bg-gradient-to-t from-background to-transparent dark:block"
          />

          <div className="mx-auto grid w-full max-w-6xl items-center gap-6 px-4 py-[clamp(1.25rem,5svh,4rem)] sm:px-6 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-10">
            <div>
              <p className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white/90 backdrop-blur sm:inline-flex [@media(max-height:640px)]:!hidden">
                <GraduationCap className="size-4 text-sun" aria-hidden />
                Escola Dr. Eiraldo Carneiro de França · Feijó, Acre
              </p>
              <h1 className="mt-[clamp(0.75rem,2.5svh,1.25rem)] text-[clamp(2rem,min(7.4vw,8svh),4.1rem)] font-bold leading-[1.18] tracking-[-0.035em] text-white [text-shadow:0_2px_28px_rgb(0_0_0/0.45)]">
                Todo dia tem criança <span className="text-sun">descobrindo o mundo</span> aqui
                <span
                  aria-hidden
                  className="ml-1.5 inline-block h-[0.78em] w-[0.1em] translate-y-[0.08em] animate-pulse rounded-sm bg-sun"
                />
              </h1>
              <p className="mt-[clamp(0.75rem,2.5svh,1.25rem)] max-w-xl rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 text-[clamp(1rem,2.4svh,1.125rem)] leading-relaxed text-white/85 backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_8px_32px_-12px_rgb(0_0_0/0.5)] sm:px-5 sm:py-4">
                Este é o cantinho da informática da nossa escola. O professor{" "}
                {config.professorInformatica} escolhe quem vai, marca quanto tempo cada grupo fica e
                você acompanha tudo daqui, em tempo real.
              </p>

              <div className="mt-[clamp(1rem,3svh,1.75rem)] flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-sun px-6 text-sun-foreground hover:bg-sun/90"
                >
                  <a href="#laboratorio-agora">
                    <MonitorSmartphone /> Quem está lá agora?
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/25 bg-white/10 px-6 text-white backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_8px_32px_-12px_rgb(0_0_0/0.5)] hover:bg-white/20 hover:text-white"
                >
                  <Link to="/resultados">
                    Como foi o bimestre <ArrowRight />
                  </Link>
                </Button>
              </div>

              {/* Atalho para o Entre Turnos, o intervalo das 11h às 13h. */}
              <Link
                to="/entre-turnos"
                className="group mt-[clamp(0.75rem,2.5svh,1.25rem)] flex max-w-xl items-center gap-3 rounded-2xl border border-sun/35 bg-white/[0.08] p-2.5 pr-4 backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_8px_32px_-12px_rgb(0_0_0/0.5)] transition-colors hover:border-sun hover:bg-white/[0.14]"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sun text-sun-foreground">
                  <Clock className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-sm leading-snug">
                  <span className="block font-bold text-white">
                    Entre Turnos <span className="font-semibold text-sun">· 11h às 13h</span>
                  </span>
                  <span className="block truncate text-white/70">
                    Onde cada turma descansa, vê filme ou brinca depois do almoço
                  </span>
                </span>
                <ArrowRight
                  className="size-4 shrink-0 text-sun transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </Link>

              <dl className="mt-[clamp(1rem,3.5svh,2rem)] grid max-w-xl grid-cols-4 divide-x divide-white/15 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_8px_32px_-12px_rgb(0_0_0/0.5)] [@media(max-height:640px)]:hidden">
                {[
                  { rotulo: "Turmas", valor: turmas.length },
                  { rotulo: "Alunos", valor: totalAlunos },
                  { rotulo: "Máquinas", valor: config.numeroComputadores },
                ].map((d) => (
                  <div key={d.rotulo} className="px-2 py-2 sm:px-4 sm:py-3">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-white/65">
                      {d.rotulo}
                    </dt>
                    {isReady ? (
                      <StatCounter valor={d.valor} />
                    ) : (
                      <div className="mt-1.5 h-7 w-10 animate-pulse rounded bg-white/20" />
                    )}
                  </div>
                ))}
                <div className="px-4 py-3">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-white/65">
                    Horário
                  </dt>
                  <dd className="font-heading text-sm font-bold leading-tight sm:text-xl">
                    {config.horaInicio}–{config.horaFim}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Cartão de vidro: o laboratório agora. Com aula, vira o destaque com o relógio. */}
            <CartaoAoVivoHome sessoes={lab.sessoes} logado={isAuthenticated} />
          </div>
          <AvisoDireitosImagem className="mx-auto max-w-6xl px-4 pb-3 text-white/60 sm:px-6 [@media(max-height:800px)]:hidden" />
        </section>

        {/* ───────── Entre Turnos: o intervalo das 11h às 13h ───────── */}
        <BannerEntreTurnos />

        {/* ───────── Laboratório ao vivo ───────── */}
        <section className="secao-janela">
          {" "}
          <div className="mx-auto w-full max-w-7xl px-4 py-[clamp(1rem,4svh,2.5rem)] sm:px-6">
            {" "}
            <div className="mb-5 max-w-2xl">
              {" "}
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Ao vivo</p>
              <h2 className="mt-1 text-3xl font-extrabold sm:text-4xl">
                Quem está no laboratório neste minuto
              </h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
              <PainelLaboratorioAgora dados={lab} logado={isAuthenticated} rolar />
              <div className="space-y-4">
                {isAuthenticated ? <MarcarAlunosCartao dados={lab} /> : null}
                <WeatherWidget />{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </section>

        {/* ───────── Como funciona ───────── */}
        <RevealSection className="secao-janela">
          {" "}
          <div className="mx-auto w-full max-w-6xl px-4 py-[clamp(1rem,4svh,2.5rem)] sm:px-6">
            {" "}
            <div className="mb-6 max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
                Nos bastidores{" "}
              </p>
              <h2 className="mt-1 text-3xl font-extrabold sm:text-4xl">
                Sem fila, sem confusão, sem ninguém esquecido
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {[
                {
                  n: "01",
                  Icone: Users2,
                  titulo: "Quem vai hoje",
                  texto: "O professor escolhe, turma por turma, quem vai ao laboratório no dia.",
                  cor: "bg-primary text-primary-foreground",
                },
                {
                  n: "02",
                  Icone: Timer,
                  titulo: "Relógio na mão",
                  texto:
                    "Cada grupo tem hora para entrar e para sair, e a contagem regressiva aparece ao vivo.",
                  cor: "bg-sun text-sun-foreground",
                },
                {
                  n: "03",
                  Icone: ShieldCheck,
                  titulo: "A vez de todo mundo",
                  texto:
                    "Se um aluno já foi nesta semana ou neste mês, o professor recebe um aviso.",
                  cor: "bg-mint text-ink",
                },
                {
                  n: "04",
                  Icone: Gamepad2,
                  titulo: "Brincar também ensina",
                  texto: "Jogos, trilhas e atividades para praticar na escola ou em casa.",
                  cor: "bg-ink text-white dark:bg-secondary",
                },
              ].map(({ n, Icone, titulo, texto, cor }) => (
                <div
                  key={n}
                  className="group relative overflow-hidden rounded-3xl border border-border bg-card p-3.5 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-5"
                >
                  <span className="absolute right-4 top-3 font-heading text-5xl font-extrabold text-foreground/[0.06]">
                    {n}
                  </span>
                  <span className={`flex size-11 items-center justify-center rounded-2xl ${cor}`}>
                    <Icone className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{titulo}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{texto}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 hidden items-center gap-2 sm:flex [@media(max-height:700px)]:!hidden">
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
                    className="size-14 rounded-2xl border-2 border-card shadow-sm sm:size-16"
                  />
                ),
              )}
            </div>
          </div>
        </RevealSection>

        {/* ───────── Resultados ───────── */}
        <RevealSection className="secao-janela">
          {" "}
          <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-[clamp(1rem,4svh,2.5rem)] sm:px-6 lg:grid-cols-2">
            {" "}
            <div className="relative flex flex-col justify-center overflow-hidden rounded-[2rem] bg-ink p-6 text-white sm:p-10 dark:bg-card">
              <div
                aria-hidden
                className="fundo-pixel absolute inset-0 opacity-30 [mask-image:linear-gradient(to_left,black,transparent_70%)]"
              />
              <div
                aria-hidden
                className="absolute -right-16 -top-16 size-64 rounded-full bg-sun/30 blur-3xl"
              />
              <div className="relative max-w-2xl">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-sun">
                  Prestando contas{" "}
                </p>
                <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">
                  Como a turma está lendo, escrevendo e aprendendo
                </h2>
                <p className="mt-3 text-white/75">
                  Os números do 3º bimestre, turma por turma, e o que cada resultado pede da escola.
                  Nenhuma criança é identificada.
                </p>
                <Button
                  asChild
                  size="lg"
                  className="mt-6 rounded-full bg-sun px-6 text-sun-foreground hover:bg-sun/90"
                >
                  <Link to="/resultados">
                    Abrir os resultados <ArrowRight />
                  </Link>
                </Button>
              </div>
            </div>{" "}
            <CanalYoutubeCard />{" "}
          </div>{" "}
        </RevealSection>

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
 * Vitrine do canal oficial da escola no YouTube: três vídeos em pé, grandes,
 * no formato dos Shorts. São só miniaturas (sem incorporar o player, mais
 * leve) que abrem o vídeo em uma nova aba.
 */
function CanalYoutubeCard() {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-ink p-5 text-white sm:p-7 dark:bg-card">
      <div
        aria-hidden
        className="absolute -left-20 -top-24 size-72 rounded-full bg-red-600/35 blur-3xl"
      />
      <div
        aria-hidden
        className="fundo-pixel absolute inset-0 opacity-20 [mask-image:linear-gradient(to_bottom,black,transparent_60%)]"
      />

      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-red-400">
            <span className="flex size-7 items-center justify-center rounded-lg bg-red-600 text-white shadow-lg shadow-red-600/40">
              <Youtube className="size-4" aria-hidden />
            </span>
            Canal da escola
          </p>
          <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">
            A escola também está no YouTube
          </h2>
          <p className="mt-1.5 text-sm text-white/70">
            Aulas, visitas e o dia a dia da escola, em vídeo.
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="rounded-full bg-red-600 px-5 text-white shadow-lg shadow-red-600/30 hover:bg-red-500"
        >
          <a href={CANAL_YOUTUBE_URL} target="_blank" rel="noopener noreferrer">
            Inscreva-se <ExternalLink className="size-4" />
          </a>
        </Button>
      </div>

      <div className="relative mt-6 grid flex-1 grid-cols-3 gap-2.5 sm:gap-3.5">
        {VIDEOS_DESTAQUE.map((video) => (
          <VideoThumb key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}

/**
 * Miniatura de um vídeo do canal, em pé (9:16). A miniatura dos Shorts vem
 * com faixas pretas dos lados; o corte "cover" nesse formato tira as faixas.
 * Redes de escola costumam bloquear o domínio do YouTube (inclusive o CDN de
 * miniaturas `i.ytimg.com`) — quando a imagem falha, mostramos um cartão
 * simples no lugar de um ícone de imagem quebrada.
 */
function VideoThumb({ video }: { video: { id: string; titulo: string } }) {
  const [imagemFalhou, setImagemFalhou] = useState(false);

  return (
    <a
      href={`https://www.youtube.com/shorts/${video.id}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Assistir: ${video.titulo}`}
      className="group relative block aspect-[9/16] overflow-hidden rounded-2xl bg-white/5 shadow-xl ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:ring-red-500/70"
    >
      {imagemFalhou ? (
        <div className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-red-600/30 to-transparent p-3 text-center">
          <Youtube className="size-8 text-red-400" aria-hidden />
          <span className="line-clamp-3 text-sm font-semibold leading-tight text-white/85">
            {video.titulo}
          </span>
        </div>
      ) : (
        <>
          <img
            src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            width={480}
            height={360}
            onError={() => setImagemFalhou(true)}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/20" />
          <span className="absolute left-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur">
            Shorts
          </span>
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-red-600/90 shadow-lg shadow-black/40 transition-transform duration-300 group-hover:scale-110 sm:size-14">
              <Play className="ml-0.5 size-5 text-white sm:size-6" fill="currentColor" />
            </span>
          </span>
          <span className="absolute inset-x-0 bottom-0 line-clamp-3 p-2.5 text-xs font-semibold leading-snug text-white sm:p-3 sm:text-sm">
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
    <dd ref={ref} className="text-2xl font-semibold text-white">
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
