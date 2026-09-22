import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Brain,
  Calculator,
  Compass,
  Download,
  ExternalLink,
  Gamepad2,
  HeartHandshake,
  Keyboard,
  Layers,
  Puzzle,
  Sparkles,
  Target,
  Users2,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarraFerramentas, CLASSES_BARRA_FERRAMENTAS } from "@/components/school/barra-ferramentas";
import { CategoriaHero, type CorCategoria } from "@/components/school/categoria-hero";
import { CalculadoraFlutuante } from "@/components/school/ferramentas/calculadora-flutuante";
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
    cor: "text-emerald-700 dark:text-emerald-300",
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
    cor: "text-amber-700 dark:text-amber-300",
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

/** Cor de identidade de cada categoria externa, para o banner (CategoriaHero). */
const COR_CATEGORIA_EXTERNA: Record<string, CorCategoria> = {
  digitacao: "blue",
  alfabetizacao: "violet",
  plataformas: "emerald",
  raciocinio: "amber",
  diversao: "pink",
  professores: "cyan",
};

function faviconUrl(url: string) {
  const dominio = new URL(url).hostname;
  return `https://www.google.com/s2/favicons?sz=64&domain=${dominio}`;
}

/**
 * A ordem em que as ferramentas da escola aparecem na Infoteca. Alfabetização
 * primeiro porque é o que a criança mais usa sozinha; recomposição por último
 * porque é trabalho dirigido pelo professor.
 */
const GRUPOS_ESCOLA: {
  id: string;
  categoria: string;
  titulo: string;
  descricao: string;
  icon: LucideIcon;
  cor: CorCategoria;
}[] = [
  {
    id: "ler-escrever",
    categoria: "Alfabetização e Leitura",
    titulo: "Ler e escrever",
    descricao: "Alfabeto, sílabas, gêneros e produção de texto — para praticar leitura e escrita.",
    icon: BookOpen,
    cor: "rose",
  },
  {
    id: "matematica-escola",
    categoria: "Matemática",
    titulo: "Matemática",
    descricao: "Números, frações, medidas e desafios de cálculo, num jeito visual e sem pressa.",
    icon: Calculator,
    cor: "blue",
  },
  {
    id: "ferramentas-dia-a-dia",
    categoria: "Ferramentas",
    titulo: "Ferramentas do dia a dia",
    descricao:
      "Calculadora, formas geométricas e jogos de mesa — utilidades rápidas para qualquer aula.",
    icon: Wrench,
    cor: "teal",
  },
  {
    id: "recomposicao",
    categoria: "Recomposição",
    titulo: "Recomposição da aprendizagem",
    descricao:
      "Atividades geradas a partir do que a Avaliação Diagnóstica mostrou que cada série precisa treinar.",
    icon: Target,
    cor: "amber",
  },
];

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
                    <a href="#da-escola">Ver as ferramentas</a>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Chips com o resumo do que tem aqui embaixo. Separa o que é da
            escola do que é link de fora: são coisas diferentes e a criança
            precisa saber onde vai parar ao clicar. */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm backdrop-blur-md dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-200">
              <Sparkles className="mr-1 inline size-3.5" />
              <strong>{publicas.length}</strong> ferramentas da escola
            </span>
            <span className="rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
              <strong className="text-foreground">{TOTAL_FERRAMENTAS}</strong> sites selecionados
            </span>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur-md dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300">
              <HeartHandshake className="mr-1 inline size-3.5" /> Com opções acessíveis
            </span>
          </div>
        </section>

        {/* O que a escola mantém vem primeiro e com mais destaque: funciona
          sem login, sem instalar e sem sair do site. A faixa-anúncio que
          ficava aqui repetia a contagem que já aparece nos cards logo
          abaixo — virou um cabeçalho de seção comum. */}
        <section id="da-escola" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-4 sm:px-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Sparkles className="size-5 text-primary" /> Ferramentas da escola
              </h2>
              <p className="text-sm text-muted-foreground">
                Feitas aqui, para alunos e professores. Abrem no navegador, sem login e sem instalar
                nada.
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link to="/ferramentas">Ver todas as {publicas.length} →</Link>
            </Button>
          </div>

          {GRUPOS_ESCOLA.map((grupo) => {
            const itens = publicas.filter((f) => f.categoria === grupo.categoria);
            if (!itens.length) return null;
            return (
              <div key={grupo.categoria} className="mb-6">
                <CategoriaHero
                  id={grupo.id}
                  icon={grupo.icon}
                  cor={grupo.cor}
                  titulo={grupo.titulo}
                  descricao={grupo.descricao}
                  className="mb-3"
                  extra={
                    <span className="text-xs font-medium text-muted-foreground">
                      {itens.length} {itens.length === 1 ? "ferramenta" : "ferramentas"}
                    </span>
                  }
                />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {itens.map((ferramenta) => (
                    <Link
                      key={ferramenta.slug}
                      to="/ferramentas/$ferramenta"
                      params={{ ferramenta: ferramenta.slug }}
                      className="group flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                    >
                      <span
                        className={`flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-black/5 dark:ring-white/10 ${ferramenta.cor}`}
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
              </div>
            );
          })}

          {/* Vizinho temático da Recomposição: explica o que cada habilidade
            cobrada na avaliação espera da criança. */}
          <Link
            to="/descritores"
            className="group mb-2 flex items-center gap-3 rounded-2xl border border-indigo-400/25 bg-gradient-to-r from-indigo-500/10 via-indigo-500/[0.03] to-transparent p-4 transition-colors hover:border-indigo-400/50 dark:border-indigo-400/15"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-indigo-400/25 bg-indigo-500/10 text-indigo-600 shadow-sm dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300">
              <Compass className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground group-hover:text-primary sm:text-base">
                O que cada habilidade da avaliação espera da criança
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Guia por série, disciplina e nível: o que se espera, como avaliar e estratégias de
                apoio — e as atividades do site ligadas a cada uma.
              </p>
            </div>
            <ExternalLink className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        </section>

        {/* A partir daqui é material de fora. A divisão é explícita para
          ninguém clicar achando que continua na escola. */}
        <section id="ferramentas" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-6 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                <ExternalLink className="size-5 text-muted-foreground" /> Sites e plataformas de
                fora
              </h2>
              <p className="text-sm text-muted-foreground">
                {TOTAL_FERRAMENTAS} endereços escolhidos pela escola, em {CATEGORIAS.length}{" "}
                categorias. Abrem em outro site, numa aba nova.
              </p>
            </div>
          </div>
        </section>

        {/* Navegação rápida — agora com as duas metades da página (escola e
          de fora) na mesma lista de âncoras, pra ficar fácil pular pra
          qualquer área direto. */}
        <nav
          aria-label="Ir direto para uma área"
          className="sticky top-16 z-30 mt-3 border-y border-border/60 bg-background/85 py-2.5 backdrop-blur-lg sm:top-14"
        >
          <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 sm:px-6 [&::-webkit-scrollbar]:hidden">
            {GRUPOS_ESCOLA.map((grupo) => (
              <a
                key={grupo.id}
                href={`#${grupo.id}`}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <grupo.icon className="size-3.5" />
                {grupo.titulo}
              </a>
            ))}
            <span className="mx-0.5 h-4 w-px shrink-0 self-center bg-border" aria-hidden />
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

        {/* GCompris + Acessibilidade, lado a lado */}
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <div
              id="gcompris"
              className="scroll-mt-32 flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 sm:flex-row sm:items-center"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-inset ring-primary/20">
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
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:text-emerald-400">
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
        <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
          <div className="flex flex-col gap-10">
            {CATEGORIAS.map((categoria) => (
              <div key={categoria.id} className="scroll-mt-32">
                <CategoriaHero
                  id={categoria.id}
                  icon={categoria.icon}
                  cor={COR_CATEGORIA_EXTERNA[categoria.id] ?? "blue"}
                  titulo={categoria.titulo}
                  descricao={categoria.descricao}
                  className="mb-4"
                  extra={
                    <span className="text-xs font-medium text-muted-foreground">
                      {categoria.ferramentas.length}{" "}
                      {categoria.ferramentas.length === 1 ? "site" : "sites"}
                    </span>
                  }
                />
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
        {/* Fica fechada quando a página abre: só um botão discreto no canto. */}
        <CalculadoraFlutuante />
      </div>
    </div>
  );
}
