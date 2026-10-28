import { createFileRoute, Link } from "@tanstack/react-router";
import { imagemCompartilhar } from "@/lib/compartilhar";
import {
  BarChart3,
  BookOpen,
  Compass,
  Dices,
  ExternalLink,
  GraduationCap,
  Mail,
  MonitorSmartphone,
  Puzzle,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { AvisoDireitosImagem, SiteImage } from "@/components/school/site-image";
import { SiteFooter } from "@/components/school/site-footer";
import { useAppStore } from "@/lib/app-store";
import laboratorioTurmaImg from "@/assets/laboratorio-informatica-turma.jpg";
import bannerEscolaImg from "@/assets/image1.png";
import gcomprisColagemImg from "@/assets/image4.png";
import cartazAulasImg from "@/assets/image0.png";

export const Route = createFileRoute("/sobre")({
  component: SobrePage,
  head: () => ({
    meta: [
      ...imagemCompartilhar("/og/secao-sobre.jpg", "Sobre o laboratório de informática"),
      { title: "A gente e o laboratório · Informática Dr. Eiraldo" },
      {
        name: "description",
        content:
          "Conheça o laboratório de informática da Escola Dr. Eiraldo Carneiro de França: como funciona, quem está por trás e por que tudo isso existe.",
      },
      { property: "og:title", content: "A gente e o laboratório · Informática Dr. Eiraldo" },
      {
        property: "og:description",
        content:
          "Como funciona o laboratório de informática da Escola Dr. Eiraldo, em Feijó, e quem faz isso acontecer.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
});

function SobrePage() {
  const { config } = useAppStore();

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_-10%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_55%),radial-gradient(circle_at_100%_15%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_50%)]"
          />
          <div className="mx-auto max-w-4xl px-4 py-10 text-center sm:px-6 lg:py-12">
            <Badge className="mb-3 gap-1.5 rounded-full border-blue-400/30 bg-blue-500/10 px-3 py-1.5 text-sm text-blue-700 shadow-sm backdrop-blur-md dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-200">
              <Sparkles className="size-4" /> Prazer, a gente
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Informática com cara de escola
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
              Isso começou como um jeito de organizar, com justiça, quem usa os computadores da{" "}
              {config.nomeEscola}. Hoje também mostra o que a escola aprendeu e devolve isso em
              atividade para a criança treinar.
            </p>
            <div className="mx-auto mt-6 max-w-3xl overflow-hidden rounded-2xl border border-border/60 shadow-xl">
              <SiteImage
                src={bannerEscolaImg}
                alt={`Turma da ${config.nomeEscola} no laboratório de informática, com a mensagem "Informática é porta para o futuro"`}
                width={1280}
                height={720}
                className="aspect-[16/9] max-h-64 w-full"
                loading="eager"
                decoding="async"
              />
            </div>
            <AvisoDireitosImagem className="mt-2" />
          </div>
        </section>

        {/* Para que serve */}
        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <div className="mb-5 text-center">
            <h2 className="text-2xl font-semibold text-foreground">Por que isso existe</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
              O laboratório tem poucos computadores e muita criança querendo usar. Aqui você vê como
              a escola resolve isso de um jeito justo, que todo mundo consegue acompanhar.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400/40 hover:shadow-md">
              <CardHeader className="p-4 pb-1.5">
                <span className="mb-1.5 flex size-9 items-center justify-center rounded-full border border-blue-400/25 bg-blue-500/10 text-blue-600 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
                  <MonitorSmartphone className="size-4" />
                </span>
                <CardTitle className="text-base">Escolha do dia</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  A cada dia, o professor escolhe quem vai. Ele marca os alunos da turma e diz por
                  quanto tempo cada grupo fica.
                </p>
              </CardContent>
            </Card>
            <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-400/40 hover:shadow-md">
              <CardHeader className="p-4 pb-1.5">
                <span className="mb-1.5 flex size-9 items-center justify-center rounded-full border border-violet-400/25 bg-violet-500/10 text-violet-600 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300">
                  <RefreshCcw className="size-4" />
                </span>
                <CardTitle className="text-base">Revezamento justo</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  O sistema lembra quantas vezes cada criança já foi na semana e no mês, e avisa
                  quando alguém está repetindo. Assim ninguém fica de fora.
                </p>
              </CardContent>
            </Card>
            <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400/40 hover:shadow-md">
              <CardHeader className="p-4 pb-1.5">
                <span className="mb-1.5 flex size-9 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                  <ShieldCheck className="size-4" />
                </span>
                <CardTitle className="text-base">Tudo à vista</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  Pais, professores e coordenação veem tudo no site, ao vivo: quem está no
                  laboratório e até que horas.
                </p>
              </CardContent>
            </Card>
            <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400/40 hover:shadow-md">
              <CardHeader className="p-4 pb-1.5">
                <span className="mb-1.5 flex size-9 items-center justify-center rounded-full border border-amber-400/25 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
                  <GraduationCap className="size-4" />
                </span>
                <CardTitle className="text-base">Acompanhamento</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  Cada ida ao laboratório fica registrada. A coordenação enxerga o uso por turma e
                  por aluno, semana a semana.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Aprendizagem — o que a plataforma passou a fazer além da agenda.
          Esta parte nasceu depois: a agenda continua sendo o começo, mas
          quem chega hoje precisa saber que o site também publica o
          resultado da avaliação e transforma esse resultado em atividade. */}
        <section className="border-t border-border/60 bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
            <div className="mb-5 text-center">
              <Badge className="mb-3 gap-1.5 rounded-full border-indigo-400/30 bg-indigo-500/10 px-3 py-1.5 text-sm text-indigo-700 shadow-sm backdrop-blur-md dark:border-indigo-400/25 dark:bg-indigo-400/10 dark:text-indigo-200">
                <Target className="size-4" /> Novidade
              </Badge>
              <h2 className="text-2xl font-semibold text-foreground">
                Da prova para a sala de aula
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
                Duas vezes por ano, todos os alunos do 1º ao 5º ano fazem a mesma prova da
                Secretaria de Educação. Agora o site mostra esse resultado em linguagem simples e, a
                partir dele, oferece atividades para treinar o que ainda não ficou firme.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400/40 hover:shadow-md">
                <CardHeader className="p-4 pb-1.5">
                  <span className="mb-1.5 flex size-9 items-center justify-center rounded-full border border-blue-400/25 bg-blue-500/10 text-blue-600 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
                    <BarChart3 className="size-4" />
                  </span>
                  <CardTitle className="text-base">O resultado da escola, para todos</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground">
                    Quanto cada turma acertou na 1ª e na 2ª avaliação, o que melhorou e onde ainda
                    precisa de atenção. Sem jargão e sem login. Quem quiser mergulhar fundo tem um
                    observatório com o detalhe por turma, questão e habilidade.
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-400/40 hover:shadow-md">
                <CardHeader className="p-4 pb-1.5">
                  <span className="mb-1.5 flex size-9 items-center justify-center rounded-full border border-indigo-400/25 bg-indigo-500/10 text-indigo-600 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300">
                    <Compass className="size-4" />
                  </span>
                  <CardTitle className="text-base">Guia de habilidades</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground">
                    As 120 habilidades cobradas na avaliação, explicadas uma a uma: o que se espera
                    de quem já aprendeu, como perceber isso na prática e o que fazer com quem ainda
                    está a caminho. Ajuda o professor e também quem acompanha em casa.
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-400/40 hover:shadow-md">
                <CardHeader className="p-4 pb-1.5">
                  <span className="mb-1.5 flex size-9 items-center justify-center rounded-full border border-rose-400/25 bg-rose-500/10 text-rose-600 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300">
                    <Target className="size-4" />
                  </span>
                  <CardTitle className="text-base">Atividades para reforçar</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground">
                    O que a escola mais errou vem primeiro. Cada atividade tem três níveis, o nível
                    certo já vem sugerido pelo resultado, e um mini-teste mostra se a criança
                    avançou. Dá para imprimir em folha, para quem prefere papel.
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400/40 hover:shadow-md">
                <CardHeader className="p-4 pb-1.5">
                  <span className="mb-1.5 flex size-9 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                    <Dices className="size-4" />
                  </span>
                  <CardTitle className="text-base">Sala de Jogos</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground">
                    Damas, dominó, jogo da velha, memória e quebra-cabeça, contra o computador ou
                    contra um colega. Cada partida ganha vale estrelas no ranking da escola.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button asChild className="gap-1.5">
                <Link to="/avaliacao">
                  <BarChart3 className="size-4" /> Ver o resultado da escola
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-1.5">
                <Link to="/avaliacao" search={{ aba: "descritores" as const }}>
                  <Compass className="size-4" /> Abrir o guia de habilidades
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-1.5">
                <Link
                  to="/ferramentas/$ferramenta"
                  params={{ ferramenta: "atividades-por-habilidade" }}
                >
                  <Target className="size-4" /> Treinar com as atividades
                </Link>
              </Button>
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Os percentuais mostram quantas questões os alunos acertaram a cada 100. Não são nota
              de boletim. O raio-X de cada turma mostra os nomes dos alunos só para o trabalho
              interno da escola.
            </p>
          </div>
        </section>

        {/* Foto real do laboratório */}
        <section className="mx-auto max-w-4xl px-4 pb-4 sm:px-6">
          <div className="overflow-hidden rounded-2xl border border-border/60 shadow-lg">
            <SiteImage
              src={laboratorioTurmaImg}
              alt="Alunos usando os computadores do laboratório de informática durante a aula"
              legenda={`O laboratório de informática da ${config.nomeEscola} em plena aula.`}
              width={1672}
              height={941}
              className="aspect-video w-full"
              loading="lazy"
              decoding="async"
            />
          </div>
          <AvisoDireitosImagem className="mt-2" />
        </section>

        {/* GCompris */}
        <section className="border-t border-border/60 bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
              <div>
                <Badge className="mb-3 gap-1.5 rounded-full border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-sm text-violet-700 shadow-sm backdrop-blur-md dark:border-violet-400/25 dark:bg-violet-400/10 dark:text-violet-200">
                  <BookOpen className="size-4" /> Nossa ferramenta
                </Badge>
                <h2 className="text-xl font-semibold text-foreground">
                  O GCompris está nas nossas aulas
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Nas aulas, a criançada usa o <strong className="text-foreground">GCompris</strong>
                  , um pacote educacional livre e gratuito com dezenas de atividades de matemática,
                  leitura, ciências, lógica, arte e muito mais, pensado para crianças a partir dos 2
                  anos. É usado em escolas de vários países e transforma o tempo no laboratório em
                  aprendizado de verdade, com leveza.
                </p>
                <Button asChild variant="outline" className="mt-4 gap-1.5">
                  <a
                    href="https://www.gcompris.net/index-pt_BR.html"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Conhecer o GCompris <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              </div>
              <div>
                <div className="overflow-hidden rounded-2xl border border-border/60 shadow-lg">
                  <SiteImage
                    src={gcomprisColagemImg}
                    alt="Alunos usando atividades do GCompris no laboratório: teclado infantil, editor de texto e jogos educativos"
                    width={1280}
                    height={720}
                    className="aspect-[16/9] w-full"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <AvisoDireitosImagem className="mt-2" />
              </div>
            </div>
          </div>
        </section>

        {/* Infoteca */}
        <section className="border-t border-border/60 bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
            <div className="mb-4 text-center">
              <Badge className="mb-3 gap-1.5 rounded-full border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-800 shadow-sm backdrop-blur-md dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300">
                <Puzzle className="size-4" /> Novidade
              </Badge>
              <h2 className="text-2xl font-semibold text-foreground">Dê uma volta pela Infoteca</h2>
            </div>
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Além do laboratório, o site tem a{" "}
                  <strong className="text-foreground">Infoteca</strong>: uma seleção de jogos e
                  ferramentas educativas gratuitas, separadas por assunto (alfabetização,
                  matemática, digitação, raciocínio lógico e mais). Foi pensada para alunos,
                  professores, famílias e também para crianças com necessidades especiais.
                </p>
                <Button asChild className="mt-4 gap-1.5">
                  <Link to="/infoteca">
                    <Puzzle className="size-4" /> Explorar a Infoteca
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Professor */}
        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <div className="mb-4 text-center">
            <Badge className="mb-3 gap-1.5 rounded-full border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-sm text-cyan-800 shadow-sm backdrop-blur-md dark:border-cyan-400/25 dark:bg-cyan-400/10 dark:text-cyan-200">
              <UserRound className="size-4" /> Quem está por trás
            </Badge>
            <h2 className="text-2xl font-semibold text-foreground">
              Professor {config.professorInformatica}
            </h2>
          </div>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                O professor <strong className="text-foreground">Franc D&apos;nis</strong> faz parte
                do quadro efetivo da {config.nomeEscola} desde{" "}
                <strong className="text-foreground">2018</strong>, dando aulas de informática. É
                formado em <strong className="text-foreground">Pedagogia</strong> e pós-graduado
                pela faculdade <strong className="text-foreground">ProMinas</strong> em{" "}
                <strong className="text-foreground">
                  Informática e suas Tecnologias na Educação
                </strong>
                . Foi essa mistura de olhar pedagógico com tecnologia que fez nascer este site, para
                deixar a rotina do laboratório mais organizada, justa e transparente para toda a
                comunidade escolar.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Cartaz oficial */}
        <section className="mx-auto max-w-4xl px-4 pb-8 sm:px-6">
          <div className="mx-auto max-w-sm">
            <div className="group overflow-hidden rounded-2xl border border-border/60 shadow-md transition-shadow hover:shadow-lg">
              <SiteImage
                src={cartazAulasImg}
                alt={`Cartaz oficial das aulas de informática da ${config.nomeEscola}, com o professor ${config.professorInformatica}`}
                legenda={`Cartaz oficial das aulas de informática da ${config.nomeEscola}, com o professor ${config.professorInformatica}.`}
                width={1280}
                height={720}
                className="aspect-[16/9] w-full transition-transform duration-300 group-hover:scale-[1.02]"
                loading="lazy"
                decoding="async"
              />
            </div>
            <AvisoDireitosImagem className="mt-2" />
          </div>
        </section>

        {/* Contato */}
        <section className="border-t border-border/60 bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 py-8 text-center sm:px-6">
            <Badge className="mb-3 gap-1.5 rounded-full border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-700 shadow-sm backdrop-blur-md dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-300">
              <Mail className="size-4" /> Contato
            </Badge>
            <h2 className="text-2xl font-semibold text-foreground">Fale com a gente</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Tem uma dúvida, uma sugestão ou uma história para contar? Escreva para nós por e-mail.
            </p>
            <Button asChild className="mt-5 gap-1.5">
              <a href="mailto:aplicativosfj@gmail.com">
                <Mail className="size-4" /> aplicativosfj@gmail.com
              </a>
            </Button>
          </div>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
