import { createFileRoute, Link } from "@tanstack/react-router";
import { imagemCompartilhar } from "@/lib/compartilhar";
import {
  BookOpen,
  Brain,
  Calculator,
  Compass,
  Dices,
  Download,
  ExternalLink,
  Gamepad2,
  HeartHandshake,
  Keyboard,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowRight,
  Target,
  Users2,
  WifiOff,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CORES_CATEGORIA, type CorCategoria } from "@/components/school/categoria-hero";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { SiteImage } from "@/components/school/site-image";
import { SiteFooter } from "@/components/school/site-footer";
import { listarFerramentasPublicas } from "@/lib/ferramentas-publicas";
import { useOnline } from "@/lib/use-online";
import infotecaHeroImg from "@/assets/feature-kids-learning.jpg";

export const Route = createFileRoute("/infoteca")({
  component: InfotecaPage,
  head: () => ({
    meta: [
      ...imagemCompartilhar("/og/secao-infoteca.jpg", "Infoteca: jogos e ferramentas educativas"),
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

const SALA_JOGOS = [
  "Damas",
  "Dominó",
  "Jogo da velha",
  "Jogo da Onça",
  "Memória",
  "Quebra-cabeça",
  "Matemática em Ação",
  "Digitação",
  "Corrida",
];

/** Cabeçalho de seção (nível 1): numeração + título + descrição, com filete. */
function CabecalhoSecao({
  numero,
  titulo,
  descricao,
  acao,
}: {
  numero: string;
  titulo: string;
  descricao: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          {numero}
        </p>
        <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {titulo}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {descricao}
        </p>
      </div>
      {acao}
    </div>
  );
}

/** Bloco de grupo: título fixo à esquerda (desktop) e conteúdo à direita. */
function Grupo({
  id,
  icon: Icon,
  cor,
  titulo,
  descricao,
  contagem,
  children,
}: {
  id: string;
  icon: LucideIcon;
  cor: CorCategoria;
  titulo: string;
  descricao: string;
  contagem: string;
  children: React.ReactNode;
}) {
  const c = CORES_CATEGORIA[cor];
  return (
    <div id={id} className="grid scroll-mt-32 gap-5 py-8 lg:grid-cols-[17rem_1fr] lg:gap-10">
      <div className="lg:sticky lg:top-32 lg:self-start">
        <span
          className={`flex size-10 items-center justify-center rounded-xl border ${c.chip}`}
        >
          <Icon className="size-5" />
        </span>
        <h3 className="mt-3 text-lg font-bold tracking-tight text-foreground">{titulo}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{descricao}</p>
        <p className="mt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground/80">
          {contagem}
        </p>
      </div>
      <div>{children}</div>
    </div>
  );
}

function InfotecaPage() {
  const publicas = listarFerramentasPublicas();
  const online = useOnline();

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        {!online && (
          <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
            <p className="flex items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs text-sky-800 dark:text-sky-200">
              <WifiOff className="size-4 shrink-0" />
              Sem internet: as ferramentas da escola (como a Sala de Jogos) continuam funcionando.
              Os sites externos abaixo só abrem quando a conexão voltar.
            </p>
          </div>
        )}

        {/* Hero editorial: texto à esquerda, imagem limpa à direita. */}
        <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14">
          <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                <span className="h-px w-8 bg-primary" aria-hidden />
                Acervo digital de aprendizagem
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Infoteca
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Ferramentas, jogos e plataformas educativas selecionadas para alunos, professores,
                famílias e comunidade — com atenção especial a alunos com necessidades especiais.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg" className="gap-2">
                  <a href="#da-escola">
                    Explorar o acervo <ArrowRight className="size-4" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="gap-2">
                  <a href="#gcompris">
                    <Download className="size-4" /> Baixar o GCompris
                  </a>
                </Button>
              </div>

              <dl className="mt-9 grid max-w-md grid-cols-3 divide-x divide-border border-y border-border py-4">
                <div className="pr-4">
                  <dt className="text-xs text-muted-foreground">Da escola</dt>
                  <dd className="mt-0.5 text-2xl font-bold tabular-nums text-foreground">
                    {publicas.length}
                  </dd>
                </div>
                <div className="px-4">
                  <dt className="text-xs text-muted-foreground">Sites externos</dt>
                  <dd className="mt-0.5 text-2xl font-bold tabular-nums text-foreground">
                    {TOTAL_FERRAMENTAS}
                  </dd>
                </div>
                <div className="pl-4">
                  <dt className="text-xs text-muted-foreground">Categorias</dt>
                  <dd className="mt-0.5 text-2xl font-bold tabular-nums text-foreground">
                    {GRUPOS_ESCOLA.length + CATEGORIAS.length}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-3xl border border-border shadow-xl">
                <SiteImage
                  src={infotecaHeroImg}
                  alt="Criança sorrindo em frente a um computador com ícones coloridos de aprendizagem — teclado, mouse, alfabeto, números e jogos educativos"
                  width={1600}
                  height={1200}
                  className="aspect-[4/3] w-full object-cover"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
              </div>
              <div className="absolute -bottom-4 left-4 flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground shadow-lg sm:left-6">
                <HeartHandshake className="size-4 text-emerald-600 dark:text-emerald-400" />
                Com opções acessíveis
              </div>
            </div>
          </div>
        </section>

        {/* Navegação rápida. `top-14` casa com a altura fixa (56px) da barra
          mínima que o NavBar usa fora da home — um valor errado aqui deixa uma
          fresta por onde o conteúdo aparece por trás ao rolar. */}
        <nav
          aria-label="Ir direto para uma área"
          className="sticky top-14 z-30 mt-12 border-y border-border/60 bg-background/90 py-2.5 backdrop-blur-lg"
        >
          <div className="mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-4 sm:px-6 [&::-webkit-scrollbar]:hidden">
            {GRUPOS_ESCOLA.map((grupo) => (
              <a
                key={grupo.id}
                href={`#${grupo.id}`}
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <grupo.icon className="size-3.5" />
                {grupo.titulo}
              </a>
            ))}
            <span className="mx-1 h-4 w-px shrink-0 self-center bg-border" aria-hidden />
            {CATEGORIAS.map((categoria) => (
              <a
                key={categoria.id}
                href={`#${categoria.id}`}
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <categoria.icon className="size-3.5" />
                {categoria.titulo}
              </a>
            ))}
          </div>
        </nav>

        {/* 01 — Ferramentas da escola: sem login, sem instalar. */}
        <section id="da-escola" className="mx-auto max-w-6xl scroll-mt-28 px-4 pt-14 sm:px-6">
          <CabecalhoSecao
            numero="01 · Feito pela escola"
            titulo="Ferramentas da escola"
            descricao="Criadas aqui, para alunos e professores. Abrem no navegador, sem login e sem instalar nada."
            acao={
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link to="/ferramentas">
                  Ver todas as {publicas.length} <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            }
          />

          {/* Destaque: a Sala de Jogos é o que as crianças mais procuram. */}
          <Link
            to="/ferramentas/$ferramenta"
            params={{ ferramenta: "sala-de-jogos" }}
            className="group relative mt-8 flex flex-col gap-6 overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-lg transition-shadow duration-200 hover:shadow-xl sm:p-8 lg:flex-row lg:items-center lg:gap-10"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-emerald-500/25 blur-3xl"
            />
            <span className="relative flex size-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/30 sm:size-20">
              <Dices className="size-8 sm:size-10" />
            </span>
            <div className="relative min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">
                Destaque da Infoteca
              </p>
              <h3 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
                Sala de Jogos
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Nove jogos de mesa, matemática, digitação e corrida — inclusive o Jogo da Onça,
                tradicional indígena —, contra o computador ou um colega da turma. Cada partida
                ganha vale estrelas no ranking da escola.
              </p>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {SALA_JOGOS.map((jogo) => (
                  <li
                    key={jogo}
                    className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-200"
                  >
                    {jogo}
                  </li>
                ))}
              </ul>
            </div>
            <span className="relative inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-colors group-hover:bg-emerald-300">
              Abrir a sala <ArrowRight className="size-4" />
            </span>
          </Link>

          <div className="mt-4 divide-y divide-border">
            {GRUPOS_ESCOLA.map((grupo) => {
              const itens = publicas.filter(
                (f) => f.categoria === grupo.categoria && f.slug !== "sala-de-jogos",
              );
              if (!itens.length) return null;
              return (
                <Grupo
                  key={grupo.categoria}
                  id={grupo.id}
                  icon={grupo.icon}
                  cor={grupo.cor}
                  titulo={grupo.titulo}
                  descricao={grupo.descricao}
                  contagem={`${itens.length} ${itens.length === 1 ? "ferramenta" : "ferramentas"}`}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    {itens.map((ferramenta) => (
                      <Link
                        key={ferramenta.slug}
                        to="/ferramentas/$ferramenta"
                        params={{ ferramenta: ferramenta.slug }}
                        className="group flex items-start gap-3.5 rounded-xl border border-border bg-card p-4 transition-all duration-200 ease-out hover:border-primary/40 hover:shadow-md"
                      >
                        <span
                          className={`flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted ${ferramenta.cor}`}
                        >
                          <ferramenta.icon className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                            {ferramenta.titulo}
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                            {ferramenta.descricao}
                          </p>
                        </div>
                        <ArrowRight className="mt-1 size-4 shrink-0 -translate-x-1 text-primary opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                      </Link>
                    ))}
                  </div>
                </Grupo>
              );
            })}
          </div>

          {/* Vizinho temático da Recomposição. */}
          <Link
            to="/avaliacao"
            search={{ aba: "descritores" as const }}
            className="group mt-2 flex items-center gap-4 rounded-2xl border border-border bg-muted/40 p-5 transition-colors hover:border-primary/40 hover:bg-muted/70"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
              <Compass className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground group-hover:text-primary sm:text-base">
                O que cada habilidade da avaliação espera da criança
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                Guia por série, disciplina e nível: o que se espera, como avaliar e estratégias de
                apoio — e as atividades do site ligadas a cada uma.
              </p>
            </div>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        </section>

        {/* 02 — Material de fora. A divisão é explícita para ninguém clicar
          achando que continua na escola. */}
        <section id="ferramentas" className="mx-auto max-w-6xl scroll-mt-28 px-4 pt-20 sm:px-6">
          <CabecalhoSecao
            numero="02 · Curadoria externa"
            titulo="Sites e plataformas de fora"
            descricao={`${TOTAL_FERRAMENTAS} endereços escolhidos pela escola, em ${CATEGORIAS.length} categorias. Abrem em outro site, numa aba nova.`}
          />

          {/* GCompris + acessibilidade */}
          <div id="gcompris" className="mt-8 grid scroll-mt-32 gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="flex flex-col justify-between gap-5 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center">
              <div className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Download className="size-5" />
                </span>
                <div>
                  <p className="text-base font-bold text-foreground">
                    GCompris — pacote educacional gratuito
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Dezenas de atividades de matemática, leitura, ciências, lógica e arte para
                    crianças a partir dos 2 anos. Funciona offline, sem anúncios e sem internet na
                    hora da aula.
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

            <div className="flex items-start gap-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-6">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                <HeartHandshake className="size-5" />
              </span>
              <div>
                <p className="text-base font-bold text-foreground">
                  Alunos com necessidades especiais
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Priorizamos ferramentas simples, visuais e com pouco texto. O GCompris é o ponto
                  de partida mais indicado — mas cada criança é diferente, vale testar junto.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 divide-y divide-border pb-16">
            {CATEGORIAS.map((categoria) => (
              <Grupo
                key={categoria.id}
                id={categoria.id}
                icon={categoria.icon}
                cor={COR_CATEGORIA_EXTERNA[categoria.id] ?? "blue"}
                titulo={categoria.titulo}
                descricao={categoria.descricao}
                contagem={`${categoria.ferramentas.length} ${categoria.ferramentas.length === 1 ? "site" : "sites"}`}
              >
                <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                  {categoria.ferramentas.map((ferramenta) => (
                    <li key={ferramenta.url}>
                      <a
                        href={ferramenta.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-disabled={!online}
                        tabIndex={online ? undefined : -1}
                        className={`group flex items-center gap-4 p-4 transition-colors hover:bg-muted/50 ${online ? "" : "pointer-events-none opacity-50"}`}
                      >
                        <img
                          src={faviconUrl(ferramenta.url)}
                          alt=""
                          aria-hidden
                          width={36}
                          height={36}
                          loading="lazy"
                          className="size-9 shrink-0 rounded-lg border border-border/60 bg-white object-contain p-1.5"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                            {ferramenta.nome}
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                            {ferramenta.descricao}
                          </p>
                        </div>
                        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                      </a>
                    </li>
                  ))}
                </ul>
              </Grupo>
            ))}
          </div>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
