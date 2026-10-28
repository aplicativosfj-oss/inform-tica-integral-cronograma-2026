import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
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
import { MarcaLogo } from "@/components/school/marca";
import { MarcarAlunosCartao } from "@/components/school/laboratorio/marcar-dialog";
import { PainelLaboratorioAgora } from "@/components/school/laboratorio/painel-agora";
import { WeatherWidget } from "@/components/school/weather-widget";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { AvisoDireitosImagem, SiteImage } from "@/components/school/site-image";
import { SiteFooter } from "@/components/school/site-footer";
import { useAppStore } from "@/lib/app-store";
import { useAuth } from "@/lib/auth-store";
import {
  agruparSessoes,
  estadoDaSessao,
  hojeNaEscola,
  horaNaEscola,
  textoRestante,
  useAgora,
  useSessoesLab,
} from "@/lib/laboratorio";
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
  const agora = useAgora(30_000);
  const totalAlunos = turmas.reduce((sum, t) => sum + t.alunos.length, 0);
  useEffect(() => {
    document.documentElement.classList.add("home-snap");
    return () => document.documentElement.classList.remove("home-snap");
  }, []);
  const noLabAgora = new Set(
    lab.sessoes.filter((x) => estadoDaSessao(x, agora) === "ao-vivo").map((x) => x.alunoId),
  ).size;
  const grupos = agruparSessoes(lab.sessoes.filter((x) => x.data === hojeNaEscola()));
  const gruposAoVivo = grupos.filter((g) => estadoDaSessao(g, agora) === "ao-vivo");
  const proximoGrupo = grupos.find((g) => estadoDaSessao(g, agora) === "agendada");

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
            className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-background to-transparent"
          />

          <div className="mx-auto grid w-full max-w-6xl items-center gap-6 px-4 py-[clamp(1.25rem,5svh,4rem)] sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10">
            <div>
              <p className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white/90 backdrop-blur sm:inline-flex [@media(max-height:640px)]:!hidden">
                <GraduationCap className="size-4 text-sun" aria-hidden />
                Escola Dr. Eiraldo Carneiro de França · Feijó, Acre
              </p>
              <h1 className="mt-[clamp(0.75rem,2.5svh,1.25rem)] text-[clamp(2rem,min(7.4vw,8svh),4.1rem)] font-bold leading-[1.18] tracking-[-0.035em] text-white [text-shadow:0_2px_28px_rgb(0_0_0/0.45)]">
                Todo dia tem criança{" "}
                <span className="text-sun">
                  descobrindo o mundo
                </span>{" "}
                aqui
                <span
                  aria-hidden
                  className="ml-1.5 inline-block h-[0.78em] w-[0.1em] translate-y-[0.08em] animate-pulse rounded-sm bg-sun"
                />
              </h1>
              <p className="mt-[clamp(0.75rem,2.5svh,1.25rem)] max-w-xl text-[clamp(1rem,2.4svh,1.125rem)] leading-relaxed text-white/80">
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
                  className="rounded-full border-white/30 bg-white/10 px-6 text-white backdrop-blur hover:bg-white/20 hover:text-white"
                >
                  <Link to="/resultados">
                    Como foi o bimestre <ArrowRight />
                  </Link>
                </Button>
              </div>

              <dl className="mt-[clamp(1rem,3.5svh,2rem)] grid max-w-xl grid-cols-4 divide-x divide-white/15 overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur [@media(max-height:640px)]:hidden">
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

            {/* Cartão de vidro: o laboratório agora, em uma olhada. */}
            <div className="hidden rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-md lg:block">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-sun">
                  <span className="relative flex size-2.5">
                    <span
                      className={`absolute inline-flex size-full rounded-full opacity-60 ${noLabAgora > 0 ? "animate-ping bg-emerald-400" : "bg-white/40"}`}
                    />
                    <span
                      className={`relative inline-flex size-2.5 rounded-full ${noLabAgora > 0 ? "bg-emerald-400" : "bg-white/50"}`}
                    />
                  </span>
                  Agora
                </p>
                <span className="text-sm tabular-nums text-white/70">{horaNaEscola(agora)}</span>
              </div>
              {gruposAoVivo.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {gruposAoVivo.slice(0, 3).map((g) => (
                    <li key={g.grupoId} className="rounded-2xl bg-white/10 p-3">
                      <p className="flex items-baseline justify-between gap-2">
                        <span className="font-heading text-xl font-bold">{g.turmaRotulo}</span>
                        <span className="text-sm text-white/75">até {horaNaEscola(g.fim)}</span>
                      </p>
                      <p className="mt-0.5 text-sm text-white/70">
                        {g.alunos.length} aluno{g.alunos.length === 1 ? "" : "s"} · faltam{" "}
                        {textoRestante(new Date(g.fim).getTime() - agora)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-4 rounded-2xl bg-white/10 p-4">
                  <p className="font-heading text-xl font-bold">Laboratório livre por enquanto</p>
                  <p className="mt-1 text-sm text-white/70">
                    {proximoGrupo
                      ? `Daqui a pouco: ${proximoGrupo.turmaRotulo}, às ${horaNaEscola(proximoGrupo.inicio)}`
                      : "Ninguém marcado para agora."}
                  </p>
                </div>
              )}
              <a
                href="#laboratorio-agora"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sun underline-offset-4 hover:underline"
              >
                Ver todo mundo <ArrowRight className="size-4" aria-hidden />
              </a>
            </div>
          </div>
          <AvisoDireitosImagem className="mx-auto max-w-6xl px-4 pb-3 text-white/60 sm:px-6 [@media(max-height:800px)]:hidden" />
        </section>

        {/* ───────── Laboratório ao vivo ───────── */}
        <section className="secao-janela">
          {" "}
          <div className="mx-auto w-full max-w-6xl px-4 py-[clamp(1rem,4svh,2.5rem)] sm:px-6">
            {" "}
            <div className="mb-5 max-w-2xl">
              {" "}
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Ao vivo</p>
              <h2 className="mt-1 text-3xl font-extrabold sm:text-4xl">
                Quem está no laboratório neste minuto
              </h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
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
 * Divulgação discreta do canal oficial da escola no YouTube: miniaturas reais
 * (sem incorporar o player, mais leve) que abrem o vídeo em uma nova aba.
 */
function CanalYoutubeCard() {
  return (
    <div className="h-full">
      {" "}
      <div className="h-full overflow-hidden rounded-[2rem] border border-red-400/20 bg-gradient-to-br from-red-500/[0.06] via-transparent to-transparent p-4 dark:border-red-400/15 dark:from-red-400/[0.05] sm:p-6">
        <div className="grid gap-4">
          <div>
            <Badge className="mb-2 gap-1.5 rounded-full border-red-400/30 bg-red-500/10 px-3 py-1.5 text-sm text-red-700 shadow-sm backdrop-blur-md dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-300">
              <Youtube className="size-4" /> Canal da escola
            </Badge>
            <h2 className="text-xl font-semibold text-foreground">
              A escola também está no YouTube
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Aulas, visitas e o dia a dia da escola, em vídeo. Vem ver!
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4 w-fit text-sm">
              <a href={CANAL_YOUTUBE_URL} target="_blank" rel="noopener noreferrer">
                Abrir o canal <ExternalLink className="size-4" />
              </a>
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {VIDEOS_DESTAQUE.map((video) => (
              <VideoThumb key={video.id} video={video} />
            ))}
          </div>
        </div>{" "}
      </div>{" "}
    </div>
  );
} /** * Miniatura de um vídeo do canal. Redes de escola costumam bloquear o
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
