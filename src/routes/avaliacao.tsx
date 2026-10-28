import { createFileRoute } from "@tanstack/react-router";
import { metaCompartilhar } from "@/lib/compartilhar";
import {
  BarChart3,
  BookOpenText,
  CalendarDays,
  Compass,
  ListChecks,
  Loader2,
  TrendingUp,
  Users2,
} from "lucide-react";
import { useMemo } from "react";

import alunos2 from "@/assets/alunos-2.jpg";
import cadernoImg from "@/assets/caderno-mesa.webp";
import heroFoto from "@/assets/hero-lab-photo.jpg";

import { NavBar } from "@/components/school/nav-bar";
import { GuiaDescritores } from "@/components/school/diagnostica/guia-descritores";
import { MapaDaTurma } from "@/components/school/diagnostica/mapa-turma";
import { PainelAvaliacoes } from "@/components/school/diagnostica/painel-avaliacoes";
import { ObservatorioFrame } from "@/components/school/observatorio-frame";
import { HeroResultados } from "@/components/school/resultados/hero";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  alfabetizacao,
  desempenhoI,
  desempenhoII,
  evolucaoPorTurma,
} from "@/lib/diagnostica/analise";
import type { ProvaII } from "@/lib/diagnostica/tipos";
import { useProvasII } from "@/lib/diagnostica/use-provas";
import { cn } from "@/lib/utils";

const ABAS = ["resumo", "mapa", "detalhes", "descritores"] as const;
type AbaAvaliacao = (typeof ABAS)[number];

function abaValida(v: unknown): v is AbaAvaliacao {
  return typeof v === "string" && (ABAS as readonly string[]).includes(v);
}

export const Route = createFileRoute("/avaliacao")({
  validateSearch: (search: Record<string, unknown>): { aba?: AbaAvaliacao } =>
    abaValida(search["aba"]) ? { aba: search["aba"] } : {},
  component: AvaliacaoPublica,
  head: () => ({
    meta: metaCompartilhar({
      titulo: "Avaliações Diagnósticas · Escola Dr. Eiraldo",
      descricao:
        "I e II Avaliação Diagnóstica 2026 da Escola Dr. Eiraldo Carneiro de França: quanto cada turma avançou, o que já foi aprendido e o que precisa ser retomado.",
      imagem: "/og/secao-avaliacao.jpg",
      alt: "Avaliações Diagnósticas 2026",
    }),
  }),
});

/**
 * Área pública das avaliações diagnósticas, com as duas aplicações no mesmo
 * lugar. A aba "Resumo" é a leitura para qualquer pessoa — famílias,
 * professores regentes, conselho — e a aba "Detalhes" guarda o observatório
 * completo da II, para quem quiser destrinchar turma, questão e habilidade.
 * A aba "Guia de habilidades" fecha o conjunto: o que cada descritor cobrado
 * espera da criança, como avaliar e o que fazer com quem ainda não chegou lá.
 */
const ABAS_VISIVEIS: {
  id: AbaAvaliacao;
  nome: string;
  legenda: string;
  Icone: typeof BarChart3;
}[] = [
  { id: "resumo", nome: "Resumo", legenda: "1ª e 2ª lado a lado", Icone: BarChart3 },
  { id: "mapa", nome: "Mapa da turma", legenda: "cada aluno por habilidade", Icone: Users2 },
  { id: "detalhes", nome: "Detalhes da 2ª", legenda: "questão por questão", Icone: ListChecks },
  {
    id: "descritores",
    nome: "Guia de habilidades",
    legenda: "o que cada uma espera",
    Icone: Compass,
  },
];

const porcento = (v: number | null | undefined) => (v == null ? "—" : `${Math.round(v * 100)}%`);
const mediaDe = (v: number[]) => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : null);

function AvaliacaoPublica() {
  const { aba: abaUrl } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { provas, erro } = useProvasII();
  const aba: AbaAvaliacao = abaUrl ?? "resumo";

  /** A aba fica na URL para poder ser linkada de fora (Infoteca, cards do
   *  Resumo) e sobreviver a um refresh. */
  function setAba(proxima: AbaAvaliacao) {
    void navigate({ search: proxima === "resumo" ? {} : { aba: proxima }, replace: true });
  }

  /** Manda o Resumo abrir os Detalhes já numa sub-aba específica (o
   *  observatório lê essa chave sozinho ao montar). */
  function abrirDetalhes(subAba?: string) {
    if (subAba) {
      try {
        sessionStorage.setItem("obs.tab", subAba);
      } catch {
        /* sessionStorage pode falhar em aba anônima — segue sem deep-link */
      }
    }
    setAba("detalhes");
  }

  return (
    <div className="min-h-dvh bg-background">
      <NavBar />
      <HeroDasAvaliacoes provas={provas} />
      {erro ? (
        <p className="mx-auto max-w-7xl p-6 text-muted-foreground">{erro}</p>
      ) : provas ? (
        <Tabs
          value={aba}
          onValueChange={(v) => setAba(v as AbaAvaliacao)}
          className="mx-auto max-w-7xl px-4 pb-10 sm:px-6"
        >
          <TabsList className="relative z-10 -mt-6 mb-8 grid h-auto w-full grid-cols-2 gap-1.5 rounded-2xl border border-border/70 bg-card/95 p-1.5 shadow-xl backdrop-blur-xl lg:grid-cols-4">
            {ABAS_VISIVEIS.map(({ id, nome, legenda, Icone }) => (
              <TabsTrigger
                key={id}
                value={id}
                className={cn(
                  "h-auto justify-start gap-3 rounded-xl px-3 py-2.5 text-left text-muted-foreground",
                  "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md",
                )}
              >
                <Icone className="size-5 shrink-0" aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{nome}</span>
                  <span className="hidden truncate text-[11px] font-normal opacity-75 sm:block">
                    {legenda}
                  </span>
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="resumo">
            <PainelAvaliacoes
              provas={provas}
              comAlunos
              semAbertura
              aoAbrirDetalhes={abrirDetalhes}
            />
          </TabsContent>
          <TabsContent value="detalhes">
            <ObservatorioFrame
              dados={provas}
              className="h-[calc(100dvh-12rem)] min-h-[520px] w-full rounded-xl border border-border bg-background"
            />
          </TabsContent>
          <TabsContent value="mapa">
            <MapaDaTurma provas={provas} />
          </TabsContent>
          <TabsContent value="descritores">
            <GuiaDescritores />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

/** Abertura com os números das duas aplicações, calculados na hora. */
function HeroDasAvaliacoes({ provas }: { provas: ProvaII[] | null }) {
  const n = useMemo(() => {
    const i = desempenhoI();
    const ii = provas ? desempenhoII(provas) : [];
    const daDisc = (lista: typeof i, disc: string) =>
      mediaDe(lista.filter((d) => d.disc === disc).map((d) => d.acerto));
    const evol = provas ? evolucaoPorTurma(provas).filter((e) => e.delta != null) : [];
    const alfab = provas ? alfabetizacao(provas) : [];
    return {
      lpI: daDisc(i, "LP"),
      lpII: provas ? daDisc(ii, "LP") : null,
      matI: daDisc(i, "MAT"),
      matII: provas ? daDisc(ii, "MAT") : null,
      geralI: mediaDe(i.map((d) => d.acerto)),
      geralII: provas ? mediaDe(ii.filter((d) => d.disc !== "CN").map((d) => d.acerto)) : null,
      subiram: evol.filter((e) => (e.delta ?? 0) > 0).length,
      comparaveis: evol.length,
      alfabI: mediaDe(alfab.flatMap((a) => (a.i == null ? [] : [a.i]))),
      alfabII: mediaDe(alfab.flatMap((a) => (a.ii == null ? [] : [a.ii]))),
      avaliados: ii.reduce((s, d) => (d.disc === "LP" ? s + d.participantes : s), 0),
    };
  }, [provas]);

  const pts = (a: number | null, b: number | null) =>
    a == null || b == null ? null : Math.round((b - a) * 100);
  const dGeral = pts(n.geralI, n.geralII);
  const dAlfab = pts(n.alfabI, n.alfabII);
  const sinal = (d: number) => `${d >= 0 ? "+" : ""}${d} pts`;

  return (
    <HeroResultados
      acento="sky"
      selo={
        <>
          <CalendarDays className="size-3.5" aria-hidden /> Avaliações diagnósticas 2026
        </>
      }
      titulo={
        <>
          O que já foi aprendido e <span className="text-sky-300">o que precisa ser retomado</span>
        </>
      }
      texto="Duas vezes por ano, todos os alunos do 1º ao 5º ano fazem a mesma prova da Secretaria de Educação. Aqui a 1ª e a 2ª aplicação aparecem lado a lado, turma por turma e habilidade por habilidade."
      foto={heroFoto}
      mosaico={[alunos2, cadernoImg]}
      barras={[
        { rotulo: "Port. 1ª", valor: n.lpI ?? 0 },
        { rotulo: "Port. 2ª", valor: n.lpII ?? 0, destaque: true },
        { rotulo: "Mat. 1ª", valor: n.matI ?? 0 },
        { rotulo: "Mat. 2ª", valor: n.matII ?? 0, destaque: true },
      ]}
      indicadores={[
        {
          Icone: BarChart3,
          rotulo: "Acerto na 2ª",
          valor: porcento(n.geralII),
          detalhe:
            dGeral == null
              ? `1ª avaliação: ${porcento(n.geralI)}`
              : `${sinal(dGeral)} sobre a 1ª (${porcento(n.geralI)})`,
          tom: dGeral == null ? "neutro" : dGeral >= 0 ? "sobe" : "desce",
        },
        {
          Icone: TrendingUp,
          rotulo: "Provas que melhoraram",
          valor: provas ? `${n.subiram}/${n.comparaveis}` : "—",
          detalhe: "turma e disciplina com resultado nas duas",
          tom: "neutro",
        },
        {
          Icone: BookOpenText,
          rotulo: "Alfabéticos (1º e 2º)",
          valor: porcento(n.alfabII),
          detalhe:
            dAlfab == null
              ? `1ª avaliação: ${porcento(n.alfabI)}`
              : `${sinal(dAlfab)} sobre a 1ª (${porcento(n.alfabI)})`,
          tom: dAlfab == null ? "neutro" : dAlfab >= 0 ? "sobe" : "desce",
        },
        {
          Icone: Users2,
          rotulo: "Alunos avaliados",
          valor: provas ? String(n.avaliados) : "—",
          detalhe: "fizeram a prova de Português na 2ª",
          tom: "neutro",
        },
      ]}
    />
  );
}
