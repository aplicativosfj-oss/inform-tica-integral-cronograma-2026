import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Activity, ArrowRight, BookOpenText, ClipboardCheck, ClipboardList, Target, TrendingUp, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MAPA_CLASSE_3_BIM } from "@/lib/mapa-classe/dados-3bim";
import { LEITURA, ZONAS, escritaDoAno } from "@/lib/mapa-classe/niveis";
import type { EvolucaoLeitura, TurmaMapa } from "@/lib/mapa-classe/tipos";

const pct = (n: number, d: number) => d ? Math.round(n / d * 100) : 0;
const nome = (t: TurmaMapa) => `${t.ano}º ano ${t.turma}`;
const prioridadeLeitura = LEITURA.filter(n => n.zona === "prioridade");
const dificuldadeLeituraNiveis = LEITURA.filter(n => n.zona !== "consolidado");
const quantidade = (valores: Record<string, number>, niveis: {id:string}[]) =>
  niveis.reduce((s,n) => s + (valores[n.id] ?? 0), 0);

type TurmaGestao = {
  turma: TurmaMapa;
  intervencaoLeitura: number;
  intervencaoEscrita: number;
  dificuldadeLeitura: number;
  dificuldadeEscrita: number;
  saldoEvolucao: number | null;
  variacaoPontos: number | null;
  habilidades: { area: string; nivel: string; nome: string; alunos: number; acao: string }[];
};

function evolucaoDaTurma(t: TurmaMapa, historico: Record<string, EvolucaoLeitura[]>) {
  const lista = historico[`${t.ano}${t.turma}`] ?? [];
  const b1 = lista.find(e => e.bim === 1);
  const b3 = lista.find(e => e.bim === 3);
  if (!b1 || !b3) return { saldo: null, pontos: null };
  const ab1 = b1.A + b1.B;
  const ab3 = b3.A + b3.B;
  return { saldo: ab3 - ab1, pontos: pct(ab3, b3.avaliados) - pct(ab1, b1.avaliados) };
}

function construir(t: TurmaMapa, historico: Record<string, EvolucaoLeitura[]>): TurmaGestao {
  const niveisEscrita = escritaDoAno(t.ano);
  const intervencaoLeitura = quantidade(t.leitura, prioridadeLeitura);
  const intervencaoEscrita = quantidade(t.escrita as Record<string, number>, niveisEscrita.filter(n => n.zona === "prioridade"));
  const dificuldadeLeitura = quantidade(t.leitura, dificuldadeLeituraNiveis);
  const dificuldadeEscrita = quantidade(t.escrita as Record<string, number>, niveisEscrita.filter(n => n.zona !== "consolidado"));
  const habilidades = [
    ...prioridadeLeitura.map(n => ({ area: "Leitura", nivel: n.id, nome: n.nome, alunos: t.leitura[n.id], acao: n.acao })),
    ...niveisEscrita.filter(n => n.zona === "prioridade").map(n => ({ area: "Escrita", nivel: n.id, nome: n.nome, alunos: t.escrita[n.id] ?? 0, acao: n.acao })),
  ].filter(h => h.alunos > 0).sort((a,b) => b.alunos-a.alunos);
  const evolucao = evolucaoDaTurma(t, historico);
  return { turma:t, intervencaoLeitura, intervencaoEscrita, dificuldadeLeitura, dificuldadeEscrita, saldoEvolucao:evolucao.saldo, variacaoPontos:evolucao.pontos, habilidades };
}

function Indicador({ titulo, valor, detalhe, icon: Icon, onClick }: {
  titulo:string; valor:string; detalhe:string; icon: typeof Users; onClick:()=>void;
}) {
  return <button type="button" onClick={onClick} className="group text-left">
    <Card className="h-full border-border/80 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg">
      <CardContent className="flex h-full items-start gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5"/></span>
        <span className="min-w-0 flex-1"><span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</span><strong className="mt-1 block text-2xl tabular-nums">{valor}</strong><span className="mt-1 block text-xs text-muted-foreground">{detalhe}</span></span>
        <ArrowRight className="mt-1 size-4 text-muted-foreground transition group-hover:translate-x-1"/>
      </CardContent>
    </Card>
  </button>;
}

export function PainelGestaoPedagogica() {
  const { turmas, evolucaoLeitura } = MAPA_CLASSE_3_BIM;
  const [selecionada, setSelecionada] = useState<TurmaGestao | null>(null);
  const dados = useMemo(() => turmas.map(t => construir(t, evolucaoLeitura)), [turmas, evolucaoLeitura]);
  const totais = useMemo(() => ({
    leitura: dados.reduce((s,d) => s+d.intervencaoLeitura,0),
    escrita: dados.reduce((s,d) => s+d.intervencaoEscrita,0),
    saldo: dados.reduce((s,d) => s+(d.saldoEvolucao ?? 0),0),
    turmas: dados.length,
  }), [dados]);
  const habilidades = useMemo(() => dados.flatMap(d => d.habilidades.map(h => ({...h, turma:nome(d.turma)}))).sort((a,b)=>b.alunos-a.alunos).slice(0,8), [dados]);

  return <section className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Gestão pedagógica · {MAPA_CLASSE_3_BIM.bimestre}º bimestre</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight">Intervenção e evolução por turma</h2><p className="mt-1 max-w-3xl text-sm text-muted-foreground">Acompanhe os níveis que exigem apoio, a variação da leitura ao longo do ano e as habilidades prioritárias. Selecione qualquer indicador ou turma para abrir os detalhes.</p></div>
      <span className="rounded-full border bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground">{totais.turmas} turmas · 1º ao 5º ano</span>
    </header>

    <Link to="/dashboard/intervencoes" className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-card to-card p-4 transition hover:border-primary/50 hover:shadow-md">
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ClipboardCheck className="size-5" /></span>
        <span className="min-w-0"><b className="block text-sm">Acompanhar intervenções individuais</b><span className="mt-0.5 block text-xs text-muted-foreground">Registrar avaliações, criar planos, documentar atividades e comparar a evolução de cada aluno</span></span>
      </span>
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">Abrir acompanhamento <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
    </Link>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Indicador titulo="Intervenção em leitura" valor={String(totais.leitura)} detalhe="alunos nos níveis prioritários D ou E" icon={Target} onClick={() => setSelecionada(dados.slice().sort((a,b)=>b.intervencaoLeitura-a.intervencaoLeitura)[0] ?? null)}/>
      <Indicador titulo="Intervenção em escrita" valor={String(totais.escrita)} detalhe="alunos nos níveis prioritários de escrita" icon={ClipboardList} onClick={() => setSelecionada(dados.slice().sort((a,b)=>b.intervencaoEscrita-a.intervencaoEscrita)[0] ?? null)}/>
      <Indicador titulo="Saldo de evolução" valor={totais.saldo > 0 ? `+${totais.saldo}` : String(totais.saldo)} detalhe="variação líquida em A/B na leitura (1º → 3º bim.)" icon={TrendingUp} onClick={() => setSelecionada(dados.slice().sort((a,b)=>(b.saldoEvolucao ?? -999)-(a.saldoEvolucao ?? -999))[0] ?? null)}/>
      <Indicador titulo="Habilidades prioritárias" valor={String(habilidades.length)} detalhe="frentes com maior concentração de alunos" icon={BookOpenText} onClick={() => setSelecionada(dados.slice().sort((a,b)=>(b.habilidades[0]?.alunos ?? 0)-(a.habilidades[0]?.alunos ?? 0))[0] ?? null)}/>
    </div>

    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users className="size-4"/> Acompanhamento turma por turma</CardTitle><p className="text-xs text-muted-foreground">Os números de leitura e escrita são apresentados separadamente: um mesmo aluno pode aparecer nas duas áreas. O saldo de evolução é uma variação agregada dos níveis A/B, não uma contagem individual de crianças que avançaram.</p></CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {dados.map(d => <button key={`${d.turma.ano}${d.turma.turma}`} type="button" onClick={()=>setSelecionada(d)} className="group rounded-2xl border border-border p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
          <span className="flex items-center justify-between gap-2"><strong>{nome(d.turma)}</strong><ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-1"/></span>
          <span className="mt-3 grid grid-cols-2 gap-2">
            <span className="rounded-xl bg-rose-500/10 p-2"><span className="block text-[10px] font-semibold uppercase text-muted-foreground">Intervenção leitura</span><b className="text-xl tabular-nums">{d.intervencaoLeitura}</b></span>
            <span className="rounded-xl bg-amber-500/10 p-2"><span className="block text-[10px] font-semibold uppercase text-muted-foreground">Intervenção escrita</span><b className="text-xl tabular-nums">{d.intervencaoEscrita}</b></span>
            <span className="rounded-xl bg-orange-500/10 p-2"><span className="block text-[10px] font-semibold uppercase text-muted-foreground">Dificuldade leitura</span><b className="text-xl tabular-nums">{d.dificuldadeLeitura}</b></span>
            <span className="rounded-xl bg-orange-500/10 p-2"><span className="block text-[10px] font-semibold uppercase text-muted-foreground">Dificuldade escrita</span><b className="text-xl tabular-nums">{d.dificuldadeEscrita}</b></span>
          </span>
          <span className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span>Leitura A/B: {d.variacaoPontos == null ? "sem histórico" : `${d.variacaoPontos >= 0 ? "+" : ""}${d.variacaoPontos} p.p.`}</span><span>{d.saldoEvolucao == null ? "—" : `${d.saldoEvolucao >= 0 ? "+" : ""}${d.saldoEvolucao} saldo`}</span></span>
          <span className="mt-2 block text-xs font-semibold text-primary">Abrir análise da turma</span>
        </button>)}
      </CardContent>
    </Card>

    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Activity className="size-4"/> Habilidades que mais precisam de atenção</CardTitle><p className="text-xs text-muted-foreground">Prioridades calculadas pelos níveis atuais do mapa de classe, com recomendação pedagógica associada.</p></CardHeader>
      <CardContent className="space-y-2">
        {habilidades.map((h,i)=><button key={`${h.turma}-${h.area}-${h.nivel}`} type="button" onClick={()=>setSelecionada(dados.find(d=>nome(d.turma)===h.turma) ?? null)} className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition hover:border-primary/40 hover:bg-muted/30">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-xs font-extrabold">{i+1}</span><span className="min-w-0 flex-1"><b className="block text-sm">{h.nome}</b><span className="text-xs text-muted-foreground">{h.area} · {h.turma} · nível {h.nivel}</span></span><span className="text-right"><b className="block tabular-nums">{h.alunos}</b><span className="text-[10px] text-muted-foreground">alunos</span></span><ArrowRight className="size-4 text-muted-foreground"/>
        </button>)}
      </CardContent>
    </Card>

    <Dialog open={!!selecionada} onOpenChange={v=>{if(!v)setSelecionada(null);}}>
      <DialogContent className="max-h-[88dvh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{selecionada ? `Análise pedagógica · ${nome(selecionada.turma)}` : "Análise da turma"}</DialogTitle><DialogDescription>Resumo do {MAPA_CLASSE_3_BIM.bimestre}º bimestre e evolução de leitura disponível.</DialogDescription></DialogHeader>
        {selecionada && <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-rose-500/10 p-3"><span className="text-xs text-muted-foreground">Intervenção em leitura</span><b className="mt-1 block text-2xl">{selecionada.intervencaoLeitura}</b></div><div className="rounded-xl bg-amber-500/10 p-3"><span className="text-xs text-muted-foreground">Intervenção em escrita</span><b className="mt-1 block text-2xl">{selecionada.intervencaoEscrita}</b></div><div className="rounded-xl bg-orange-500/10 p-3"><span className="text-xs text-muted-foreground">Dificuldades em leitura</span><b className="mt-1 block text-2xl">{selecionada.dificuldadeLeitura}</b></div><div className="rounded-xl bg-orange-500/10 p-3"><span className="text-xs text-muted-foreground">Dificuldades em escrita</span><b className="mt-1 block text-2xl">{selecionada.dificuldadeEscrita}</b></div><div className="rounded-xl bg-emerald-500/10 p-3"><span className="text-xs text-muted-foreground">Saldo A/B na leitura</span><b className="mt-1 block text-2xl">{selecionada.saldoEvolucao == null ? "—" : `${selecionada.saldoEvolucao > 0 ? "+" : ""}${selecionada.saldoEvolucao}`}</b></div><div className="rounded-xl bg-muted p-3"><span className="text-xs text-muted-foreground">Variação A/B</span><b className="mt-1 block text-2xl">{selecionada.variacaoPontos == null ? "—" : `${selecionada.variacaoPontos > 0 ? "+" : ""}${selecionada.variacaoPontos} p.p.`}</b></div></div>
          <section><h3 className="mb-2 font-bold">Leitura e escrita que exigem apoio</h3><div className="space-y-2">{selecionada.habilidades.length ? selecionada.habilidades.map(h=><div key={`${h.area}-${h.nivel}`} className="rounded-xl border p-3"><div className="flex items-center justify-between gap-2"><b className="text-sm">{h.area} · nível {h.nivel}</b><span className="text-sm font-bold tabular-nums">{h.alunos} aluno(s)</span></div><p className="mt-1 text-sm text-muted-foreground">{h.nome}</p><p className="mt-2 text-xs"><b>Intervenção sugerida:</b> {h.acao}</p></div>) : <p className="text-sm text-muted-foreground">Não há alunos nos níveis prioritários desta turma.</p>}</div></section>
          <p className="text-xs text-muted-foreground">“Intervenção” indica alunos atualmente classificados em níveis prioritários no mapa agregado. “Evolução” é a diferença entre os totais de leitura A/B do 1º e do 3º bimestre; os dados agregados não permitem identificar a trajetória de cada aluno.</p>
        </div>}
      </DialogContent>
    </Dialog>
  </section>;
}
