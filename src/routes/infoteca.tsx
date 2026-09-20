import { createFileRoute } from "@tanstack/react-router";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { SiteFooter } from "@/components/school/site-footer";
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
  titulo: string;
  descricao: string;
  icon: LucideIcon;
  cor: string;
  ferramentas: Ferramenta[];
}

/**
 * Curadoria verificada por busca na web (setembro/2026) — só entram links com
 * site oficial confirmado. Descartamos nomes sugeridos sem site oficial
 * localizável (ex.: "DesafioMente", "Classeem") para não apontar o visitante
 * para um endereço adivinhado ou incorreto.
 */
const CATEGORIAS: Categoria[] = [
  {
    titulo: "Digitação",
    descricao: "Para aprender a digitar com as duas mãos, sem olhar pro teclado.",
    icon: Keyboard,
    cor: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300",
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
    titulo: "Alfabetização e leitura",
    descricao: "Letras, sílabas, primeiras palavras e histórias interativas.",
    icon: Sparkles,
    cor: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
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
        descricao: "Mais de 24 jogos leves de português, matemática e raciocínio, direto no navegador.",
      },
      {
        nome: "Smart Tales",
        url: "https://smarttales.app/",
        descricao: "Histórias animadas e jogos de leitura e matemática para crianças de 2 a 11 anos.",
      },
    ],
  },
  {
    titulo: "Plataformas completas",
    descricao: "Reúnem várias disciplinas num só lugar, organizadas por ano escolar.",
    icon: Layers,
    cor: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
    ferramentas: [
      {
        nome: "Escola Games",
        url: "https://www.escolagames.com.br/",
        descricao: "Referência brasileira: português, matemática, ciências, história e geografia por ano.",
      },
      {
        nome: "ANTON",
        url: "https://anton.app/pt/",
        descricao: "Plataforma gratuita e sem anúncios, da Educação Infantil ao Ensino Fundamental.",
      },
      {
        nome: "Educa Jogos",
        url: "https://educajogos.com.br/",
        descricao: "Jogos simples e diretos de alfabetização, matemática e inglês.",
      },
    ],
  },
  {
    titulo: "Raciocínio lógico",
    descricao: "Quebra-cabeças, estratégia e lógica para exercitar o pensamento.",
    icon: Brain,
    cor: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
    ferramentas: [
      {
        nome: "LogicLike",
        url: "https://logiclike.com/pt-br",
        descricao: "Charadas e desafios de lógica organizados por nível de dificuldade.",
      },
    ],
  },
  {
    titulo: "Diversão educativa",
    descricao: "Portais de jogos variados para os momentos mais livres e recreativos.",
    icon: Gamepad2,
    cor: "bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-300",
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
    titulo: "Curadoria para professores",
    descricao: "Catálogos organizados para quem está planejando a aula.",
    icon: Users2,
    cor: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-300",
    ferramentas: [
      {
        nome: "Escola Digital (Governo do Paraná)",
        url: "https://aluno.escoladigital.pr.gov.br/games",
        descricao: "Catálogo público de jogos educativos por área — lógica, idiomas, ciências e mais.",
      },
    ],
  },
];

function faviconUrl(url: string) {
  const dominio = new URL(url).hostname;
  return `https://www.google.com/s2/favicons?sz=64&domain=${dominio}`;
}

function InfotecaPage() {
  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center opacity-[0.16] blur-[2px] dark:opacity-[0.24]"
            style={{ backgroundImage: `url("${infotecaHeroImg}")` }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-sky-50/85 via-white/70 to-background dark:from-muted/40 dark:via-background/70 dark:to-background"
          />
          <div className="mx-auto max-w-4xl px-4 py-10 text-center sm:px-6 lg:py-14">
            <Badge variant="secondary" className="mb-3 gap-1.5">
              <Puzzle className="size-3.5" /> Espaço de aprendizagem digital
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Infoteca
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
              Um espaço lúdico, criativo e de apoio pedagógico digital, com ferramentas e jogos
              educativos selecionados para alunos, professores, pais e toda a comunidade escolar —
              pensado também para alunos com necessidades especiais.
            </p>
          </div>
        </section>

        {/* Acessibilidade */}
        <section className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <HeartHandshake className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Pensado também para alunos com necessidades especiais
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Priorizamos aqui ferramentas com interface simples, visual e pouco texto — mais
                  fáceis de usar para quem tem alguma limitação motora, sensorial ou de
                  aprendizagem. O <strong className="text-foreground">GCompris</strong> (abaixo) é
                  especialmente indicado por funcionar offline, sem anúncios e com atividades
                  bem graduais. Ainda assim, cada criança é diferente — vale testar junto e
                  observar o que funciona melhor.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* GCompris em destaque */}
        <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
            <CardContent className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Download className="size-6" />
              </span>
              <div className="flex-1">
                <p className="text-base font-semibold text-foreground">
                  GCompris — pacote educacional gratuito
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Dezenas de atividades de matemática, leitura, ciências, lógica e arte para
                  crianças a partir dos 2 anos. Funciona offline, sem anúncios e sem precisar de
                  internet na hora da aula.
                </p>
              </div>
              <Button asChild className="w-full shrink-0 gap-1.5 sm:w-auto">
                <a href="https://gcompris.net/downloads-en.html" target="_blank" rel="noopener noreferrer">
                  Baixar o GCompris <ExternalLink className="size-3.5" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Categorias */}
        <section className="mx-auto max-w-4xl px-4 pb-10 sm:px-6">
          <div className="flex flex-col gap-6">
            {CATEGORIAS.map((categoria) => (
              <div key={categoria.titulo}>
                <div className="mb-3 flex items-center gap-2.5">
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${categoria.cor}`}
                  >
                    <categoria.icon className="size-4.5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{categoria.titulo}</h2>
                    <p className="text-xs text-muted-foreground">{categoria.descricao}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {categoria.ferramentas.map((ferramenta) => (
                    <a
                      key={ferramenta.url}
                      href={ferramenta.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card p-3.5 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                    >
                      <img
                        src={faviconUrl(ferramenta.url)}
                        alt=""
                        aria-hidden
                        width={28}
                        height={28}
                        loading="lazy"
                        className="mt-0.5 size-7 shrink-0 rounded-md border border-border/40 bg-white object-contain p-1"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1 text-sm font-semibold text-foreground group-hover:text-primary">
                          <span className="truncate">{ferramenta.nome}</span>
                          <ExternalLink className="size-3 shrink-0 opacity-60" />
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{ferramenta.descricao}</p>
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
