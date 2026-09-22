import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  GraduationCap,
  Loader2,
  Minus,
  Printer,
  Target,
  TrendingUp,
  Users2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/school/dashboard-shell";
import {
  BarrasHabilidades,
  FaixasEmpilhadas,
  Haltere,
  LegendaAplicacoes,
  ReguaRede,
  corDoAcerto,
} from "@/components/school/diagnostica/graficos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  comoIntervir,
  desempenhoI,
  desempenhoII,
  evolucaoPorTurma,
  gruposDeIntervencao,
  maisFortes,
  maisFrageis,
  pct,
  perfisDosAlunos,
  prioridadeDeAtendimento,
} from "@/lib/diagnostica/analise";
import { DADOS_I } from "@/lib/diagnostica/dados-i";
import { NOME_DISC, type ProvaII } from "@/lib/diagnostica/tipos";
import { supabase } from "@/lib/supabase-client";

export const Route = createFileRoute("/dashboard/evolucao")({
  component: EvolucaoPage,
  head: () => ({
    meta: [
      { title: "Evolução diagnóstica · Painel de gestão" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const nomeTurma = (ano: number, turma: string) => `${ano}º ${turma}`;

function EvolucaoPage() {
  const [provas, setProvas] = useState<ProvaII[] | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase
      .from("avaliacao_diagnostica")
      .select("dados")
      .eq("id", "2026-II")
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast.error("Não foi possível carregar a II Avaliação: " + error.message);
        if (data?.dados) setProvas(data.dados as ProvaII[]);
        setCarregando(false);
      });
  }, []);

  const analise = useMemo(() => {
    const i = desempenhoI();
    const ii = provas ? desempenhoII(provas) : [];
    return {
      i,
      ii,
      evolucao: provas ? evolucaoPorTurma(provas) : [],
      frageisII: maisFrageis(ii, 12),
      fortesII: maisFortes(ii, 8),
      frageisI: maisFrageis(i, 12),
      perfis: provas ? perfisDosAlunos(provas) : [],
      grupos: provas ? gruposDeIntervencao(provas) : [],
    };
  }, [provas]);

  if (carregando) {
    return (
      <DashboardShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <TrendingUp className="size-6 text-primary" /> Evolução diagnóstica
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            I e II Avaliação Diagnóstica 2026 (SEME) lado a lado: o que avançou, onde a escola ainda
            trava e quais alunos precisam de apoio agora.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" /> Imprimir
        </Button>
      </div>

      <Tabs defaultValue="geral">
        <TabsList className="print:hidden">
          <TabsTrigger value="geral">Visão geral</TabsTrigger>
          <TabsTrigger value="turmas">Turmas</TabsTrigger>
          <TabsTrigger value="habilidades">Habilidades</TabsTrigger>
          <TabsTrigger value="alunos">Alunos</TabsTrigger>
          <TabsTrigger value="intervencao">Intervenção</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4">
          <VisaoGeral analise={analise} />
        </TabsContent>
        <TabsContent value="turmas" className="space-y-4">
          <Turmas />
        </TabsContent>
        <TabsContent value="habilidades" className="space-y-4">
          <Habilidades analise={analise} />
        </TabsContent>
        <TabsContent value="alunos" className="space-y-4">
          <Alunos perfis={analise.perfis} />
        </TabsContent>
        <TabsContent value="intervencao" className="space-y-4">
          <Intervencao grupos={analise.grupos} perfis={analise.perfis} />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

interface Analise {
  i: ReturnType<typeof desempenhoI>;
  ii: ReturnType<typeof desempenhoII>;
  evolucao: ReturnType<typeof evolucaoPorTurma>;
  frageisI: ReturnType<typeof maisFrageis>;
  frageisII: ReturnType<typeof maisFrageis>;
  fortesII: ReturnType<typeof maisFortes>;
  perfis: ReturnType<typeof perfisDosAlunos>;
  grupos: ReturnType<typeof gruposDeIntervencao>;
}

function VisaoGeral({ analise }: { analise: Analise }) {
  const evolucao = analise.evolucao;
  const comparaveis = evolucao.filter((e) => e.delta != null);
  const mediaDelta =
    comparaveis.length > 0
      ? comparaveis.reduce((s, e) => s + (e.delta ?? 0), 0) / comparaveis.length
      : null;
  const subiram = comparaveis.filter((e) => (e.delta ?? 0) > 0).length;
  const desceram = comparaveis.filter((e) => (e.delta ?? 0) < 0).length;
  const mediaI =
    analise.i.length > 0 ? analise.i.reduce((s, d) => s + d.acerto, 0) / analise.i.length : 0;
  const mediaII =
    analise.ii.length > 0 ? analise.ii.reduce((s, d) => s + d.acerto, 0) / analise.ii.length : 0;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador titulo="Acerto médio · I Avaliação" valor={pct(mediaI)} />
        <Indicador
          titulo="Acerto médio · II Avaliação"
          valor={pct(mediaII)}
          cor={corDoAcerto(mediaII)}
        />
        <Indicador
          titulo="Evolução média das turmas"
          valor={
            mediaDelta == null
              ? "—"
              : `${mediaDelta >= 0 ? "+" : ""}${Math.round(mediaDelta * 100)} p.p.`
          }
          cor={mediaDelta != null && mediaDelta >= 0 ? "#10b981" : "#e11d48"}
        />
        <Indicador
          titulo="Turmas que subiram"
          valor={`${subiram} de ${comparaveis.length}`}
          detalhe={`${desceram} caíram`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Da I para a II Avaliação, turma por turma</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Haltere
            itens={evolucao.map((e) => ({
              rotulo: `${nomeTurma(e.ano, e.turma)} ${e.disc}`,
              i: e.i,
              ii: e.ii,
            }))}
          />
          <LegendaAplicacoes />
          <p className="text-xs text-muted-foreground">
            As duas aplicações são comparadas pelo <b>percentual de acerto nas questões</b>, que
            existe igual nas duas. A &ldquo;média global&rdquo; da I usa pesos próprios da SEME e
            aparece só na aba Turmas.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-emerald-600">
              Pontos fortes (II Avaliação)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarrasHabilidades
              itens={analise.fortesII.map((h) => ({
                rotulo: h.texto,
                valor: h.acerto,
                detalhe: `${nomeTurma(h.ano, h.turma)} · ${NOME_DISC[h.disc]}`,
              }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-rose-600">Pontos frágeis (II Avaliação)</CardTitle>
          </CardHeader>
          <CardContent>
            <BarrasHabilidades
              itens={analise.frageisII.map((h) => ({
                rotulo: h.texto,
                valor: h.acerto,
                detalhe: `${nomeTurma(h.ano, h.turma)} · ${NOME_DISC[h.disc]} · ${h.erraram} alunos erraram`,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Turmas() {
  const doIntegral = DADOS_I.turmas.filter((t) => t.turno === "INTEGRAL");
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {doIntegral.map((t) => {
        const ref = DADOS_I.referencias[`${t.disc}-${t.ano}`];
        const escrita = Object.entries(t.escrita).filter(([, v]) => v != null && v > 0);
        return (
          <Card key={`${t.ano}${t.turma}-${t.disc}`}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span>
                  {nomeTurma(t.ano, t.turma)} · {NOME_DISC[t.disc]}
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  {t.participantes} fizeram · {t.faltosos} faltaram
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-4">
                <Dado
                  rotulo="Média global (0–100)"
                  valor={t.media == null ? "—" : t.media.toFixed(1)}
                />
                <Dado rotulo="Notas azuis (≥50%)" valor={pct(t.azuis)} />
                {t.alfabeticos != null && <Dado rotulo="Alfabéticos" valor={pct(t.alfabeticos)} />}
              </div>
              <FaixasEmpilhadas
                faixas={[
                  { rotulo: "Insuficiente", valor: t.faixas.insuficiente, cor: "#e11d48" },
                  { rotulo: "Regular", valor: t.faixas.regular, cor: "#f59e0b" },
                  { rotulo: "Bom", valor: t.faixas.bom, cor: "#0ea5e9" },
                  { rotulo: "Ótimo", valor: t.faixas.otimo, cor: "#10b981" },
                ]}
              />
              {escrita.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Níveis de escrita
                  </p>
                  <FaixasEmpilhadas
                    faixas={escrita.map(([k, v], idx) => ({
                      rotulo: k,
                      valor: v,
                      cor:
                        [
                          "#10b981",
                          "#22c55e",
                          "#84cc16",
                          "#eab308",
                          "#f97316",
                          "#e11d48",
                          "#6b7280",
                        ][idx] ?? "#6b7280",
                    }))}
                  />
                </div>
              )}
              {ref && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Média global comparada
                  </p>
                  <ReguaRede escola={t.media} feijo={ref.feijo.media} acre={ref.acre.media} />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function Habilidades({ analise }: { analise: Analise }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mais frágeis na I Avaliação</CardTitle>
        </CardHeader>
        <CardContent>
          <BarrasHabilidades
            itens={analise.frageisI.map((h) => ({
              rotulo: h.texto,
              valor: h.acerto,
              detalhe: `${nomeTurma(h.ano, h.turma)} · ${NOME_DISC[h.disc]}`,
            }))}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mais frágeis na II Avaliação</CardTitle>
        </CardHeader>
        <CardContent>
          <BarrasHabilidades
            itens={analise.frageisII.map((h) => ({
              rotulo: h.texto,
              valor: h.acerto,
              detalhe: `${nomeTurma(h.ano, h.turma)} · ${NOME_DISC[h.disc]} · ${h.erraram} alunos erraram`,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Alunos({ perfis }: { perfis: ReturnType<typeof perfisDosAlunos> }) {
  const [busca, setBusca] = useState("");
  const prioridade = prioridadeDeAtendimento(perfis, 15);
  const filtrados = busca
    ? perfis.filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()))
    : perfis;

  if (perfis.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          A análise individual depende das respostas da II Avaliação. Importe o arquivo em Avaliação
          diagnóstica para liberar esta aba.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="size-4 text-rose-500" /> Quem precisa de apoio primeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Os 15 alunos com menor acerto na II Avaliação, somando todas as provas que fizeram.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {prioridade.map((p) => (
              <div
                key={`${p.ano}${p.turma}-${p.nome}`}
                className="rounded-lg border border-border p-3"
              >
                <p className="font-semibold leading-tight">{p.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {nomeTurma(p.ano, p.turma)} · {p.lacunas.length} habilidades a retomar
                </p>
                <p
                  className="mt-1 text-lg font-bold tabular-nums"
                  style={{ color: corDoAcerto(p.acerto) }}
                >
                  {pct(p.acerto)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="size-4 text-primary" /> Ficha de cada aluno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar aluno pelo nome"
            className="mb-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {filtrados.map((p) => (
              <details
                key={`${p.ano}${p.turma}-${p.nome}`}
                className="rounded-lg border border-border p-3"
              >
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-semibold">
                    {p.nome}{" "}
                    <span className="font-normal text-muted-foreground">
                      · {nomeTurma(p.ano, p.turma)}
                    </span>
                  </span>
                  <span className="font-bold tabular-nums" style={{ color: corDoAcerto(p.acerto) }}>
                    {pct(p.acerto)}
                  </span>
                </summary>
                <div className="mt-3 space-y-3 text-sm">
                  <div className="flex flex-wrap gap-3">
                    {p.porDisciplina.map((d) => (
                      <Dado
                        key={d.disc}
                        rotulo={NOME_DISC[d.disc] ?? d.disc}
                        valor={`${d.acertos}/${d.total} · ${pct(d.acerto)}`}
                      />
                    ))}
                    {p.escrita && <Dado rotulo="Nível de escrita" valor={p.escrita} />}
                  </div>
                  <div>
                    <p className="mb-1 font-semibold text-rose-600">
                      Precisa retomar ({p.lacunas.length})
                    </p>
                    <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">
                      {p.lacunas.map((l) => (
                        <li key={`${l.disc}${l.q}`}>
                          <span className="font-medium text-foreground">{NOME_DISC[l.disc]}:</span>{" "}
                          {l.texto}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1 font-semibold text-emerald-600">
                      Já domina ({p.dominios.length})
                    </p>
                    <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">
                      {p.dominios.slice(0, 6).map((l) => (
                        <li key={`${l.disc}${l.q}`}>{l.texto}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function Intervencao({
  grupos,
  perfis,
}: {
  grupos: ReturnType<typeof gruposDeIntervencao>;
  perfis: ReturnType<typeof perfisDosAlunos>;
}) {
  const [turma, setTurma] = useState<string>("todas");
  const turmas = [...new Set(grupos.map((g) => `${g.ano}${g.turma}`))].sort();
  const visiveis = (
    turma === "todas" ? grupos : grupos.filter((g) => `${g.ano}${g.turma}` === turma)
  ).slice(0, 24);

  if (perfis.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Os grupos de intervenção são montados a partir das respostas da II Avaliação.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="print:hidden">
        <CardContent className="flex flex-wrap items-center gap-2 py-4">
          <span className="text-sm text-muted-foreground">Turma:</span>
          <Button
            size="sm"
            variant={turma === "todas" ? "default" : "outline"}
            onClick={() => setTurma("todas")}
          >
            Todas
          </Button>
          {turmas.map((t) => (
            <Button
              key={t}
              size="sm"
              variant={turma === t ? "default" : "outline"}
              onClick={() => setTurma(t)}
            >
              {t.replace(/^(\d)/, "$1º ")}
            </Button>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {visiveis.map((g) => {
          const como = comoIntervir(g.proporcao);
          return (
            <Card key={`${g.ano}${g.turma}${g.disc}${g.habilidade}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base leading-snug">{g.habilidade}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {nomeTurma(g.ano, g.turma)} · {NOME_DISC[g.disc]} · {pct(g.proporcao)} da turma
                  errou
                </p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-md bg-muted/60 p-3">
                  <p className="font-semibold">{como.rotulo}</p>
                  <p className="text-muted-foreground">{como.texto}</p>
                </div>
                <div>
                  <p className="mb-1 flex items-center gap-1.5 font-semibold text-rose-600">
                    <Users2 className="size-4" /> Precisam retomar ({g.precisam.length})
                  </p>
                  <p className="text-muted-foreground">{g.precisam.join(", ")}</p>
                </div>
                {g.tutores.length > 0 && (
                  <div>
                    <p className="mb-1 font-semibold text-emerald-600">
                      Podem ajudar ({g.tutores.length})
                    </p>
                    <p className="text-muted-foreground">{g.tutores.slice(0, 8).join(", ")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function Indicador({
  titulo,
  valor,
  detalhe,
  cor,
}: {
  titulo: string;
  valor: string;
  detalhe?: string;
  cor?: string;
}) {
  const seta = valor.startsWith("+")
    ? ArrowUpRight
    : valor.startsWith("-")
      ? ArrowDownRight
      : Minus;
  const Icone = seta;
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {titulo}
        </p>
        <p
          className="flex items-center gap-1 text-2xl font-bold tabular-nums"
          style={cor ? { color: cor } : undefined}
        >
          {(valor.startsWith("+") || valor.startsWith("-")) && <Icone className="size-5" />}
          {valor}
        </p>
        {detalhe && <p className="text-xs text-muted-foreground">{detalhe}</p>}
      </CardContent>
    </Card>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className="font-bold tabular-nums">{valor}</p>
    </div>
  );
}
