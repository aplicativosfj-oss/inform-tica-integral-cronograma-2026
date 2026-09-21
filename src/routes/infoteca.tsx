import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Brain,
  Download,
  ExternalLink,
  Gamepad2,
  HeartHandshake,
  Keyboard,
  Layers,
  Puzzle,
  Sparkles,
  Users2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarraFerramentas, CLASSES_BARRA_FERRAMENTAS } from "@/components/school/barra-ferramentas";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { SiteImage } from "@/components/school/site-image";
import { SiteFooter } from "@/components/school/site-footer";
import { listarFerramentasPublicas } from "@/lib/ferramentas-publicas";
import infotecaHeroImg from "@/assets/feature-kids-learning.jpg";

export const Route = createFileRoute("/infoteca")({
  component: InfotecaPage,
  head: () => ({
    meta: [
      { title: "Infoteca · Agenda de Informática" },
      {
        name: "description",
        content:
          "Infoteca: espaço lúdico e de apoio pedagógico digital com ferramentas, jogos e plataformas educativas selecionadas para alunos, professores, pais e comunidade — incluindo opções para alunos com necessidades especiais.",
      },
      { property: "og:title", content: "Infoteca · Agenda de Informática" },
      {
        property: "og:description",
        content: "Jogos e ferramentas educativas selecionadas, organizadas por área de ensino.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
});

interface Ferramenta {
  nome: string;
  url: string;
  descricao: string;
}

interface Categoria {
  id: string;
  titulo: string;
  descricao: string;
  icon: LucideIcon;
  cor: string;
  faixa: string;
  ferramentas: Ferramenta[];
}

/**
 * Curadoria verificada por busca na web (setembro/2026) — só entram links com
 * site oficial confirmado. Descartamos nomes sugeridos sem site oficial
 * localizável (ex.: "DesafioMente", "Classeem", "Aprenda Jogando") para não
 * apontar o visitante para um endereço adivinhado ou incorreto.
 */
const CATEGORIAS: Categoria[] = [
  {
    id: "digitacao",
    titulo: "Digitação",
    descricao: "Para aprender a digitar com as duas mãos, sem olhar pro teclado.",
    icon: Keyboard,
    cor: "text-blue-600 dark:text-blue-300",
    faixa: "from-blue-500/15 to-blue-500/0",
    ferramentas: [
      {
        nome: "EdClub — Biblioteca de digitação",
        url: "https://www.edclub.com/pt-BR/library",
        descricao: "Cursos completos de digitação, em português, do básico ao avançado.",
      },
      {
        nome: "EdClub — Jogo de digitação",
        url: "https://www.edclub.com/sportal/program-135.game",
        descricao: "Pratica digitação em formato de jogo, ótimo para os primeiros passos.",
      },
    ],
  },
  {
    id: "alfabetizacao",
    titulo: "Alfabetização e leitura",
    descricao: "Letras, sílabas, primeiras palavras e histórias interativas.",
    icon: Sparkles,
    cor: "text-violet-600 dark:text-violet-300",
    faixa: "from-violet-500/15 to-violet-500/0",
    ferramentas: [
      {
        nome: "GraphoGame Brasil (MEC)",
        url: "https://alfabetizacao.mec.gov.br/grapho-game",
        descricao:
          "Programa oficial do Ministério da Educação para apoiar a alfabetização — funciona offline e sem anúncios.",
      },
      {
        nome: "Nuvito",
        url: "https://nuvito.com.br/",
        descricao:
          "Mais de 24 jogos leves de português, matemática e raciocínio, direto no navegador.",
      },
      {
        nome: "Smart Tales",
        url: "https://smarttales.app/",
        descricao:
          "Histórias animadas e jogos de leitura e matemática para crianças de 2 a 11 anos.",
      },
    ],
  },
  {
    id: "plataformas",
    titulo: "Plataformas completas",
    descricao: "Reúnem várias disciplinas num só lugar, organizadas por ano escolar.",
    icon: Layers,
    cor: "text-emerald-600 dark:text-emerald-300",
    faixa: "from-emerald-500/15 to-emerald-500/0",
    ferramentas: [
      {
        nome: "Escola Games",
        url: "https://www.escolagames.com.br/",
        descricao:
          "Referência brasileira: português, matemática, ciências, história e geografia por ano.",
      },
      {
        nome: "ANTON",
        url: "https://anton.app/pt/",
        descricao:
          "Plataforma gratuita e sem anúncios, da Educação Infantil ao Ensino Fundamental.",
      },
      {
        nome: "Educa Jogos",
        url: "https://educajogos.com.br/",
        descricao: "Jogos simples e diretos de alfabetização, matemática e inglês.",
      },
    ],
  },
  {
    id: "raciocinio",
    titulo: "Raciocínio lógico",
    descricao: "Quebra-cabeças, estratégia e lógica para exercitar o pensamento.",
    icon: Brain,
    cor: "text-amber-600 dark:text-amber-300",
    faixa: "from-amber-500/15 to-amber-500/0",
    ferramentas: [
      {
        nome: "LogicLike",
        url: "https://logiclike.com/pt-br",
        descricao: "Charadas e desafios de lógica organizados por nível de dificuldade.",
      },
    ],
  },
  {
    id: "diversao",
    titulo: "Diversão educativa",
    descricao: "Portais de jogos variados para os momentos mais livres e recreativos.",
    icon: Gamepad2,
    cor: "text-pink-600 dark:text-pink-300",
    faixa: "from-pink-500/15 to-pink-500/0",
    ferramentas: [
      {
        nome: "Coquinhos",
        url: "https://www.coquinhos.com/",
        descricao: "Jogos educativos gratuitos para crianças pequenas.",
      },
      {
        nome: "O Jogos — Jogos de crianças",
        url: "https://www.ojogos.com.br/jogos/jogos-de-criancas",
        descricao: "Coleção de jogos infantis direto no navegador.",
      },
      {
        nome: "ClickJogos infantil",
        url: "https://www.clickjogos.com.br/jogos-infantis",
        descricao: "Jogos infantis variados, sem precisar instalar nada.",
      },
      {
        nome: "CrazyGames Brasil",
        url: "https://www.crazygames.com/br/",
        descricao: "Portal grande de jogos online, com filtro de jogos educativos.",
      },
    ],
  },
  {
    id: "professores",
    titulo: "Curadoria para professores",
    descricao: "Catálogos organizados para quem está planejando a aula.",
    icon: Users2,
    cor: "text-cyan-600 dark:text-cyan-300",
    faixa: "from-cyan-500/15 to-cyan-500/0",
    ferramentas: [
      {
        nome: "Escola Digital (Governo do Paraná)",
        url: "https://aluno.escoladigital.pr.gov.br/games",
        descricao:
          "Catálogo público de jogos educativos por área — lógica, idiomas, ciências e mais.",
      },
    ],
  },
];

const TOTAL_FERRAMENTAS = CATEGORIAS.reduce((soma, c) => soma + c.ferramentas.length, 0);

function faviconUrl(url: string) {
  const dominio = new URL(url).hostname;
  return `https://www.google.com/s2/favicons?sz=64&domain=${dominio}`;
}

function InfotecaPage() {
  const publicas = listarFerramentasPublicas();

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        {/* Hero — banner mais baixo, com painel glassmorphism sobre a imagem em
            vez de um véu escuro cobrindo tudo (deixa a foto respirar). */}
        <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
          <div className="relative overflow-hidden rounded-3xl border border-border/60 shadow-xl">
            <SiteImage
              src={infotecaHeroImg}
              alt="Criança sorrindo em frente a um computador com ícones coloridos de aprendizagem — teclado, mouse, alfabeto, números e jogos educativos"
              width={1600}
              height={600}
              className="h-[300px] w-full sm:h-[280px] lg:aspect-[21/8] lg:h-auto"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
            {/* Sombra suave só embaixo, pra imagem continuar viva mas a faixa
                de chips abaixo do hero não colar direto na foto. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent"
            />
            <div className="absolute inset-0 flex items-center p-4 sm:p-6 lg:p-8">
              <div className="flex max-w-lg flex-col gap-2.5 rounded-2xl border border-white/25 bg-white/10 p-4 shadow-2xl backdrop-blur-xl sm:gap-3 sm:p-6">
                <Badge className="w-fit gap-1.5 border-white/25 bg-white/15 text-white backdrop-blur">
                  <Puzzle className="size-3.5" /> Espaço de aprendizagem digital
                </Badge>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                  Infoteca
                </h1>
                <p className="text-balance text-xs text-white/90 sm:text-sm">
                  Um espaço lúdico, criativo e de apoio pedagógico digital — ferramentas e jogos
                  educativos para alunos, professores, pais e comunidade, com atenção especial a
                  alunos com necessidades especiais.
                </p>
                <div className="mt-1 flex flex-wrap gap-2.5">
                  <Button
                    asChild
                    size="sm"
                    className="gap-1.5 bg-white text-slate-900 hover:bg-white/90"
                  >
                    <a href="#gcompris">
                      <Download className="size-4" /> Baixar o GCompris
                    </a>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20"
                  >
                    <a href="#ferramentas">Ver ferramentas</a>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Chips com o resumo do que tem aqui embaixo */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <strong className="text-foreground">{TOTAL_FERRAMENTAS}</strong> ferramentas
            </span>
            <span className="rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <strong className="text-foreground">{CATEGORIAS.length}</strong> categorias
            </span>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <HeartHandshake className="mr-1 inline size-3.5" /> Com opções acessíveis
            </span>
          </div>
        </section>

        {/* Navegação rápida por categoria */}
        <nav
          aria-label="Ir direto para uma categoria"
          className="sticky top-16 z-30 border-b border-border/60 bg-background/85 py-2.5 backdrop-blur-lg sm:top-14"
        >
          <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 sm:px-6 [&::-webkit-scrollbar]:hidden">
            {CATEGORIAS.map((categoria) => (
              <a
                key={categoria.id}
                href={`#${categoria.id}`}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <categoria.icon className={`size-3.5 ${categoria.cor}`} />
                {categoria.titulo}
              </a>
            ))}
          </div>
        </nav>

        {/* Ferramentas da própria escola, abertas a qualquer visitante.
          Vêm antes dos links externos de propósito: são as que a escola
          mantém, funcionam sem login e sem instalar nada. */}
        <section className="mx-auto max-w-6xl px-4 pt-2 sm:px-6">
          <Link to="/ferramentas" className={CLASSES_BARRA_FERRAMENTAS}>
            <BarraFerramentas
              titulo="Ferramentas abertas da escola"
              descricao={`${publicas.length === 1 ? "Comece pela calculadora" : `${publicas.length} ferramentas`} — sem login, sem instalar, direto no navegador.`}
              acao="Abrir →"
            />
          </Link>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {publicas.map((ferramenta) => (
              <Link
                key={ferramenta.slug}
                to="/ferramentas/$ferramenta"
                params={{ ferramenta: ferramenta.slug }}
                className="group flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${ferramenta.cor}`}
                >
                  <ferramenta.icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                    {ferramenta.titulo}
                  </p>
                  <p className="text-xs text-muted-foreground">{ferramenta.descricao}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* GCompris + Acessibilidade, lado a lado */}
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <div
              id="gcompris"
              className="scroll-mt-32 flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 sm:flex-row sm:items-center"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Download className="size-5" />
                </span>
                <div>
                  <p className="text-base font-semibold text-foreground">
                    GCompris — pacote educacional gratuito
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Dezenas de atividades de matemática, leitura, ciências, lógica e arte para
                    crianças a partir dos 2 anos. Funciona offline, sem anúncios e sem precisar de
                    internet na hora da aula.
                  </p>
                </div>
              </div>
              <Button asChild className="w-full shrink-0 gap-1.5 sm:w-auto">
                <a
                  href="https://gcompris.net/downloads-en.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Baixar <ExternalLink className="size-3.5" />
                </a>
              </Button>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <HeartHandshake className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Alunos com necessidades especiais
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Priorizamos ferramentas simples, visuais e com pouco texto. O GCompris ao lado é o
                  ponto de partida mais indicado — mas cada criança é diferente, vale testar junto.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Categorias */}
        <section id="ferramentas" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-14 sm:px-6">
          <div className="flex flex-col gap-10">
            {CATEGORIAS.map((categoria) => (
              <div key={categoria.id} id={categoria.id} className="scroll-mt-32">
                <div
                  className={`mb-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r ${categoria.faixa} px-4 py-3`}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card shadow-sm">
                    <categoria.icon className={`size-5 ${categoria.cor}`} />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{categoria.titulo}</h2>
                    <p className="text-xs text-muted-foreground">{categoria.descricao}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {categoria.ferramentas.map((ferramenta) => (
                    <a
                      key={ferramenta.url}
                      href={ferramenta.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                    >
                      <img
                        src={faviconUrl(ferramenta.url)}
                        alt=""
                        aria-hidden
                        width={32}
                        height={32}
                        loading="lazy"
                        className="mt-0.5 size-8 shrink-0 rounded-lg border border-border/40 bg-white object-contain p-1.5"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1 text-sm font-semibold text-foreground group-hover:text-primary">
                          <span className="truncate">{ferramenta.nome}</span>
                          <ExternalLink className="size-3 shrink-0 opacity-60" />
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {ferramenta.descricao}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
