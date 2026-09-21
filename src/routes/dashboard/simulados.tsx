import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, Eye, Loader2, Lock, Play, Plus, Printer, RefreshCw, Square, Trash2 } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Cronometro, formatarTempo, useSegundosDesde } from "@/components/school/cronometro";
import { DashboardShell } from "@/components/school/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/app-store";
import { NIVEIS, type Nivel, type Serie } from "@/lib/recomposicao/catalogo";
import { imprimirFolha } from "@/lib/recomposicao/imprimir";
import {
  AREAS,
  areaDe,
  criarSimulado,
  encerrarSimulado,
  entradasPara,
  excluirSimulado,
  habilidadeDe,
  iniciarSimulado,
  listarSimulados,
  montarQuestoes,
  respostasDoSimulado,
  rotuloArea,
  selo,
  type Area,
  type QuestaoSimulado,
  type RespostaSimulado,
  type Simulado,
} from "@/lib/simulados";
import type { Turma } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/simulados")({
  component: SimuladosPage,
  head: () => ({
    meta: [
      { title: "Simulados · Painel de gestão" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const serieDe = (t: Turma) => Number.parseInt(t.serie, 10) as Serie;
const nomeTurma = (t: Turma | undefined) => (t ? `${serieDe(t)}º ${t.letra}` : "—");

const STATUS: Record<Simulado["status"], { txt: string; cls: string }> = {
  pronto: { txt: "Pronto para iniciar", cls: "bg-sky-100 text-sky-900 dark:bg-sky-500/20 dark:text-sky-100" },
  ativo: { txt: "Em andamento", cls: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-100" },
  encerrado: { txt: "Encerrado", cls: "bg-slate-200 text-slate-800 dark:bg-slate-500/25 dark:text-slate-100" },
};

function SimuladosPage() {
  const { turmas } = useAppStore();
  const turmasOk = useMemo(
    () =>
      turmas
        .filter((t) => serieDe(t) >= 1 && serieDe(t) <= 5)
        .sort((a, b) => `${a.serie}${a.letra}`.localeCompare(`${b.serie}${b.letra}`)),
    [turmas],
  );
  const [lista, setLista] = useState<Simulado[] | null>(null);
  const [criando, setCriando] = useState(false);
  const [aberto, setAberto] = useState<string | null>(null);
  const [filtroTurma, setFiltroTurma] = useState("");

  const recarregar = useCallback(async () => {
    try {
      setLista(await listarSimulados());
    } catch (e) {
      toast.error(`Não foi possível carregar os simulados: ${(e as Error).message}`);
      setLista([]);
    }
  }, []);
  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const visiveis = (lista ?? []).filter((s) => !filtroTurma || s.turma_id === filtroTurma);
  const selecionado = lista?.find((s) => s.id === aberto) ?? null;

  return (
    <DashboardShell>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <ClipboardList className="size-6 text-primary" /> Simulados
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Monte provas por área, assunto e habilidade, aplique para a turma com tempo marcado e acompanhe ao
            vivo. Tudo fica guardado para o acompanhamento da turma.
          </p>
        </div>
        <Button onClick={() => setCriando((c) => !c)} className="gap-1.5">
          <Plus className="size-4" /> {criando ? "Fechar" : "Novo simulado"}
        </Button>
      </div>

      {criando ? (
        <NovoSimulado
          turmas={turmasOk}
          aoCriar={async (id) => {
            setCriando(false);
            await recarregar();
            setAberto(id);
          }}
        />
      ) : null}

      {selecionado ? (
        <Acompanhar
          s={selecionado}
          turma={turmasOk.find((t) => t.id === selecionado.turma_id)}
          fechar={() => setAberto(null)}
          mudou={recarregar}
        />
      ) : null}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-lg">Simulados criados</CardTitle>
          <label className="flex items-center gap-2 text-sm text-foreground">
            Turma
            <select
              id="filtro-turma-simulados"
              value={filtroTurma}
              onChange={(e) => setFiltroTurma(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground"
            >
              <option value="">Todas</option>
              {turmasOk.map((t) => (
                <option key={t.id} value={t.id}>
                  {nomeTurma(t)}
                </option>
              ))}
            </select>
          </label>
        </CardHeader>
        <CardContent>
          {lista === null ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : visiveis.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum simulado ainda. Clique em “Novo simulado” para montar o primeiro.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {visiveis.map((s) => {
                const t = turmasOk.find((x) => x.id === s.turma_id);
                const st = STATUS[s.status];
                return (
                  <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{s.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {nomeTurma(t)} · {s.questoes.length} questões · {s.duracao_min} min ·{" "}
                        {s.config.areas.map(rotuloArea).join(", ")} · criado em{" "}
                        {new Date(s.criado_em).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", st.cls)}>{st.txt}</span>
                    <Button size="sm" variant={aberto === s.id ? "default" : "outline"} onClick={() => setAberto(s.id)} className="gap-1.5">
                      <Eye className="size-4" /> {s.status === "encerrado" ? "Resultados" : s.status === "ativo" ? "Acompanhar" : "Abrir"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

// ─── montar um simulado ──────────────────────────────────────────────────────

function NovoSimulado({ turmas, aoCriar }: { turmas: Turma[]; aoCriar: (id: string) => void }) {
  const [turmaId, setTurmaId] = useState(turmas[0]?.id ?? "");
  const turma = turmas.find((t) => t.id === turmaId);
  const serie = turma ? serieDe(turma) : (1 as Serie);
  const [areas, setAreas] = useState<Area[]>(["MAT"]);
  const [conteudos, setConteudos] = useState<string[]>([]);
  const [entradas, setEntradas] = useState<string[]>([]);
  const [nivel, setNivel] = useState<Nivel | "misto">("pratica");
  const [quantidade, setQuantidade] = useState(10);
  const [duracao, setDuracao] = useState(30);
  const [titulo, setTitulo] = useState("");
  const [frase, setFrase] = useState("");
  const [previa, setPrevia] = useState<QuestaoSimulado[] | null>(null);
  const [salvando, setSalvando] = useState(false);

  const disponiveis = useMemo(() => entradasPara(serie, areas), [serie, areas]);
  const assuntos = useMemo(() => [...new Set(disponiveis.map((e) => e.conteudo))].sort(), [disponiveis]);
  const habilidades = useMemo(
    () => disponiveis.filter((e) => !conteudos.length || conteudos.includes(e.conteudo)),
    [disponiveis, conteudos],
  );

  const tituloPadrao = `Simulado de ${areas.map(rotuloArea).join(" e ")} · ${nomeTurma(turma)}`;
  const frasePadrao = `ENCERRAR SIMULADO ${turma ? `${serieDe(turma)}${turma.letra}` : ""}`.trim();
  const alternar = <T,>(lista: T[], v: T) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);

  useEffect(() => {
    setConteudos([]);
    setEntradas([]);
    setPrevia(null);
  }, [turmaId, areas]);

  function gerar() {
    if (!areas.length) {
      toast.error("Escolha pelo menos uma área.");
      return;
    }
    const q = montarQuestoes(serie, { areas, conteudos, entradas, nivel, quantidade });
    if (!q.length) {
      toast.error("Não há atividades com esses filtros para esta série.");
      return;
    }
    setPrevia(q);
    if (q.length < quantidade) toast.message(`Foram encontradas ${q.length} questões diferentes com esses filtros.`);
  }

  async function salvar() {
    if (!turma || !previa?.length) return;
    setSalvando(true);
    try {
      const s = await criarSimulado({
        turma_id: turma.id,
        serie,
        titulo: titulo.trim() || tituloPadrao,
        config: { areas, conteudos, entradas, nivel, quantidade: previa.length },
        questoes: previa,
        duracao_min: duracao,
        frase_confirmacao: (frase.trim() || frasePadrao).toUpperCase(),
      });
      toast.success("Simulado salvo. Ele só começa quando você clicar em “Iniciar”.");
      aoCriar(s.id);
    } catch (e) {
      toast.error(`Não foi possível salvar: ${(e as Error).message}`);
    } finally {
      setSalvando(false);
    }
  }

  const chip = (ativo: boolean) =>
    cn(
      "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      ativo
        ? "border-primary bg-primary text-primary-foreground"
        : "border-input bg-background text-foreground hover:bg-muted",
    );

  return (
    <Card className="mb-5 border-primary/30">
      <CardHeader>
        <CardTitle className="text-lg">Novo simulado</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sim-turma">Turma</Label>
            <select
              id="sim-turma"
              value={turmaId}
              onChange={(e) => setTurmaId(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            >
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {nomeTurma(t)} · {t.professorRegente}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sim-qtd">Número de questões</Label>
            <Input id="sim-qtd" type="number" min={5} max={30} value={quantidade} onChange={(e) => setQuantidade(Math.min(30, Math.max(5, Number(e.target.value) || 5)))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sim-tempo">Tempo (minutos)</Label>
            <Input id="sim-tempo" type="number" min={5} max={180} value={duracao} onChange={(e) => setDuracao(Math.min(180, Math.max(5, Number(e.target.value) || 5)))} />
          </div>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-foreground">Áreas</legend>
          <div className="flex flex-wrap gap-2">
            {AREAS.map((a) => (
              <button key={a.id} type="button" aria-pressed={areas.includes(a.id)} onClick={() => setAreas((l) => alternar(l, a.id))} className={chip(areas.includes(a.id))} title={a.descricao}>
                {a.nome}
              </button>
            ))}
          </div>
        </fieldset>

        {assuntos.length ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-foreground">
              Assuntos <span className="font-normal text-muted-foreground">(opcional; sem marcar, entram todos)</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {assuntos.map((c) => (
                <button key={c} type="button" aria-pressed={conteudos.includes(c)} onClick={() => { setConteudos((l) => alternar(l, c)); setEntradas([]); }} className={chip(conteudos.includes(c))}>
                  {c}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        {habilidades.length ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-foreground">
              Habilidades e descritores <span className="font-normal text-muted-foreground">(opcional)</span>
            </legend>
            <div className="grid max-h-64 gap-1.5 overflow-y-auto rounded-lg border border-border p-2 sm:grid-cols-2">
              {habilidades.map((e) => (
                <label key={e.id} className="flex cursor-pointer items-start gap-2 rounded-md p-1.5 text-sm text-foreground hover:bg-muted">
                  <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" checked={entradas.includes(e.id)} onChange={() => setEntradas((l) => alternar(l, e.id))} />
                  <span>
                    <b className="font-semibold">{e.emoji} {e.titulo}</b>
                    <span className="block text-xs text-muted-foreground">
                      {rotuloArea(areaDe(e))} · {e.descritores.length ? `${e.descritores.join(", ")} · ` : ""}
                      {habilidadeDe(e)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-foreground">Nível das questões</legend>
          <div className="flex flex-wrap gap-2">
            {[...NIVEIS.map((n) => ({ id: n.id as Nivel | "misto", nome: `${n.emoji} ${n.nome}` })), { id: "misto" as const, nome: "Misto (os três)" }].map((n) => (
              <button key={n.id} type="button" aria-pressed={nivel === n.id} onClick={() => setNivel(n.id)} className={chip(nivel === n.id)}>
                {n.nome}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sim-titulo">Título</Label>
            <Input id="sim-titulo" placeholder={tituloPadrao} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sim-frase">Frase para encerrar</Label>
            <Input id="sim-frase" placeholder={frasePadrao} value={frase} onChange={(e) => setFrase(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Depois de iniciado, o simulado só para quando alguém digitar exatamente esta frase.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={gerar} className="gap-1.5">
            <RefreshCw className="size-4" /> {previa ? "Sortear outras questões" : "Gerar prévia"}
          </Button>
          <Button onClick={salvar} disabled={!previa?.length || salvando} className="gap-1.5">
            {salvando ? <Loader2 className="size-4 animate-spin" /> : null} Salvar simulado
          </Button>
        </div>

        {previa ? (
          <div className="rounded-lg border border-border">
            <p className="border-b border-border bg-muted/50 px-3 py-2 text-sm font-medium text-foreground">
              Prévia · {previa.length} questões
            </p>
            <ol className="max-h-80 divide-y divide-border overflow-y-auto">
              {previa.map((q, i) => (
                <li key={i} className="flex gap-3 px-3 py-2 text-sm">
                  <b className="w-6 shrink-0 tabular-nums text-muted-foreground">{i + 1}.</b>
                  <div className="min-w-0">
                    <p className="text-foreground">{q.enunciado}</p>
                    <p className="text-xs text-muted-foreground">
                      {rotuloArea(q.area)} · {q.habilidade} · resposta: {"ABCDE"[q.correta ?? 0]}
                      {q.texto ? " · com texto de apoio" : ""}
                      {q.ilustracaoHtml ? " · com figura" : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ─── acompanhar / resultados ─────────────────────────────────────────────────

function Acompanhar({
  s,
  turma,
  fechar,
  mudou,
}: {
  s: Simulado;
  turma: Turma | undefined;
  fechar: () => void;
  mudou: () => Promise<void>;
}) {
  const [respostas, setRespostas] = useState<RespostaSimulado[]>([]);
  const [confirmarInicio, setConfirmarInicio] = useState(false);
  const [confirmarFim, setConfirmarFim] = useState(false);
  const [fraseDigitada, setFraseDigitada] = useState("");
  const [ordem, setOrdem] = useState<"nome" | "desempenho">("nome");
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setRespostas(await respostasDoSimulado([s.id]));
    } catch {
      /* mantém o que já está na tela */
    }
  }, [s.id]);

  // Ao vivo: atualiza a cada 5 segundos enquanto o simulado está em andamento.
  useEffect(() => {
    void carregar();
    if (s.status !== "ativo") return;
    const t = window.setInterval(() => void carregar(), 5000);
    return () => window.clearInterval(t);
  }, [carregar, s.status]);

  const inicio = s.iniciado_em ? Date.parse(s.iniciado_em) : null;
  const passado = useSegundosDesde(inicio, s.status !== "ativo");
  const limite = s.duracao_min * 60;
  const alunos = turma?.alunos ?? [];
  const porAluno = new Map(respostas.map((r) => [r.aluno_id, r]));
  const iniciaram = respostas.length;
  const finalizaram = respostas.filter((r) => r.status === "finalizado").length;
  const media = respostas.length ? respostas.reduce((a, r) => a + (100 * r.acertos) / r.total, 0) / respostas.length : null;

  const linhas = alunos
    .map((a) => ({ a, r: porAluno.get(a.id) }))
    .sort((x, y) =>
      ordem === "nome"
        ? x.a.nome.localeCompare(y.a.nome)
        : (y.r?.acertos ?? -1) - (x.r?.acertos ?? -1) ||
          tempoDe(x.r) - tempoDe(y.r) ||
          x.a.nome.localeCompare(y.a.nome),
    );

  // Acerto por questão e por habilidade (o que retomar com a turma).
  const porQuestao = s.questoes.map((q, i) => {
    const feitas = respostas.filter((r) => r.respostas[String(i)] !== undefined);
    const certas = feitas.filter((r) => r.respostas[String(i)] === q.correta).length;
    return { q, i, n: feitas.length, p: feitas.length ? (100 * certas) / feitas.length : null };
  });
  const porHabilidade = [...new Set(s.questoes.map((q) => q.habilidade))]
    .map((h) => {
      const qs = porQuestao.filter((x) => x.q.habilidade === h && x.p != null);
      return { h, area: s.questoes.find((q) => q.habilidade === h)!.area, p: qs.length ? qs.reduce((a, x) => a + x.p!, 0) / qs.length : null };
    })
    .sort((a, b) => (a.p ?? 101) - (b.p ?? 101));

  async function iniciar() {
    setOcupado(true);
    try {
      await iniciarSimulado(s.id);
      toast.success("Simulado iniciado. Os alunos já podem entrar pela área deles.");
      setConfirmarInicio(false);
      await mudou();
    } catch (e) {
      toast.error(`Não foi possível iniciar: ${(e as Error).message}`);
    } finally {
      setOcupado(false);
    }
  }

  async function encerrar() {
    setOcupado(true);
    try {
      const ok = await encerrarSimulado(s.id, fraseDigitada);
      if (!ok) {
        toast.error("A frase não confere. Digite exatamente a frase de confirmação.");
        return;
      }
      toast.success("Simulado encerrado. Os resultados estão guardados.");
      setConfirmarFim(false);
      setFraseDigitada("");
      await mudou();
      await carregar();
    } catch (e) {
      toast.error(`Não foi possível encerrar: ${(e as Error).message}`);
    } finally {
      setOcupado(false);
    }
  }

  const fraseOk =
    fraseDigitada.trim().replace(/\s+/g, " ").toUpperCase() === s.frase_confirmacao.trim().replace(/\s+/g, " ").toUpperCase();

  return (
    <Card className="mb-5 border-primary/30">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{nomeTurma(turma)}</p>
          <CardTitle className="text-xl">{s.titulo}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {s.questoes.length} questões · {s.duracao_min} min · {s.config.areas.map(rotuloArea).join(", ")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {s.status === "ativo" ? <Cronometro segundos={passado} limite={limite} tamanho={70} rotulo="restante" /> : null}
          {s.status === "pronto" ? (
            <>
              <Button onClick={() => setConfirmarInicio(true)} className="gap-1.5">
                <Play className="size-4" /> Iniciar
              </Button>
              <Button
                variant="ghost"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={async () => {
                  if (!window.confirm("Excluir este simulado? Ele ainda não foi aplicado.")) return;
                  await excluirSimulado(s.id);
                  fechar();
                  await mudou();
                }}
              >
                <Trash2 className="size-4" /> Excluir
              </Button>
            </>
          ) : null}
          {s.status === "ativo" ? (
            <Button variant="destructive" onClick={() => setConfirmarFim(true)} className="gap-1.5">
              <Square className="size-4" /> Encerrar
            </Button>
          ) : null}
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => {
              const ok = imprimirFolha(
                `${s.titulo} · ${nomeTurma(turma)}`,
                [
                  {
                    titulo: "Questões",
                    questoes: s.questoes.map((q, i) => ({
                      id: String(i),
                      enunciado: q.texto ? `${q.texto.titulo ? `${q.texto.titulo}: ` : ""}${q.texto.paragrafos.join(" ")} — ${q.enunciado}` : q.enunciado,
                      opcoes: q.opcoes,
                      respostaCorreta: q.correta ?? 0,
                      ...(q.ilustracaoHtml ? { ilustracao: <span dangerouslySetInnerHTML={{ __html: q.ilustracaoHtml }} /> } : {}),
                    })),
                  },
                ],
                `Tempo: ${s.duracao_min} minutos`,
              );
              if (!ok) window.alert("Libere as janelas pop-up do navegador para imprimir.");
            }}
          >
            <Printer className="size-4" /> Imprimir prova
          </Button>
          <Button variant="ghost" onClick={fechar}>
            Fechar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {s.status === "ativo" && passado >= limite ? (
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
            O tempo acabou: os alunos não conseguem mais responder. Encerre com a frase de confirmação para
            fechar oficialmente.
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-4">
          <Indicador rotulo="Começaram" valor={`${iniciaram} de ${alunos.length}`} />
          <Indicador rotulo="Terminaram" valor={String(finalizaram)} />
          <Indicador rotulo="Média de acertos" valor={media == null ? "—" : `${Math.round(media)}%`} />
          <Indicador rotulo="Frase para encerrar" valor={s.frase_confirmacao} pequeno icone={<Lock className="size-3.5" />} />
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-foreground">Alunos</h3>
            <div className="flex gap-1 rounded-lg bg-muted p-1" role="group" aria-label="Ordenar">
              {(["nome", "desempenho"] as const).map((o) => (
                <button
                  key={o}
                  type="button"
                  aria-pressed={ordem === o}
                  onClick={() => setOrdem(o)}
                  className={cn(
                    "rounded-md px-3 py-1 text-sm font-medium",
                    ordem === o ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {o === "nome" ? "Por nome" : "Por desempenho"}
                </button>
              ))}
            </div>
          </div>
          {ordem === "desempenho" ? (
            <p className="mb-2 text-xs text-muted-foreground">
              Ordem de desempenho para uso da equipe: ajuda a formar grupos de apoio. Os alunos veem só o próprio
              resultado, sem posição.
            </p>
          ) : null}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {ordem === "desempenho" ? <th className="px-3 py-2">#</th> : null}
                  <th className="px-3 py-2">Aluno</th>
                  <th className="px-3 py-2">Situação</th>
                  <th className="px-3 py-2 text-right">Acertos</th>
                  <th className="px-3 py-2 text-right">Tempo</th>
                  <th className="px-3 py-2">Selo</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map(({ a, r }, i) => {
                  const p = r ? (100 * r.acertos) / r.total : null;
                  const sl = p != null && r?.status === "finalizado" ? selo(p) : null;
                  return (
                    <tr key={a.id} className="border-t border-border">
                      {ordem === "desempenho" ? <td className="px-3 py-2 tabular-nums text-muted-foreground">{r ? i + 1 : "—"}</td> : null}
                      <td className="px-3 py-2 font-medium text-foreground">{a.nome}</td>
                      <td className="px-3 py-2">
                        {!r ? (
                          <span className="text-muted-foreground">Não começou</span>
                        ) : r.status === "fazendo" ? (
                          <span className="font-medium text-sky-800 dark:text-sky-200">
                            Fazendo · {r.respondidas}/{r.total}
                          </span>
                        ) : (
                          <span className="font-medium text-emerald-800 dark:text-emerald-200">Terminou</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-foreground">
                        {r ? `${r.acertos}/${r.total}` : "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-foreground">{r ? formatarTempo(tempoDe(r)) : "—"}</td>
                      <td className="px-3 py-2">
                        {sl ? <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", sl.cls)}>{sl.nome}</span> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {respostas.length ? (
          <div>
            <h3 className="mb-1 font-semibold text-foreground">O que retomar com a turma</h3>
            <p className="mb-2 text-xs text-muted-foreground">Acerto por habilidade, da mais difícil para a mais fácil.</p>
            <ul className="flex flex-col gap-2">
              {porHabilidade.map((h) => (
                <li key={h.h} className="grid grid-cols-[1fr_auto] items-center gap-3 sm:grid-cols-[2fr_1fr_auto]">
                  <span className="text-sm text-foreground">
                    <span className="text-xs text-muted-foreground">{rotuloArea(h.area)} · </span>
                    {h.h}
                  </span>
                  <div className="hidden h-2.5 overflow-hidden rounded-full bg-muted sm:block" aria-hidden>
                    <div
                      className={cn(
                        "h-full rounded-full",
                        h.p == null ? "" : h.p >= 70 ? "bg-emerald-600" : h.p >= 50 ? "bg-sky-600" : "bg-amber-600",
                      )}
                      style={{ width: `${h.p ?? 0}%` }}
                    />
                  </div>
                  <b className="w-12 text-right tabular-nums text-foreground">{h.p == null ? "—" : `${Math.round(h.p)}%`}</b>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>

      <Dialog open={confirmarInicio} onOpenChange={setConfirmarInicio}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar o simulado agora?</DialogTitle>
            <DialogDescription>
              O relógio de {s.duracao_min} minutos começa já, e o simulado aparece na área dos alunos da turma{" "}
              {nomeTurma(turma)}. Depois de iniciado, ele só pode ser encerrado digitando a frase de confirmação.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmarInicio(false)}>
              Cancelar
            </Button>
            <Button onClick={iniciar} disabled={ocupado} className="gap-1.5">
              <Play className="size-4" /> Iniciar agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmarFim} onOpenChange={(o) => { setConfirmarFim(o); if (!o) setFraseDigitada(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encerrar o simulado</DialogTitle>
            <DialogDescription>
              Quem ainda estiver respondendo terá a prova finalizada com o que já respondeu. Para confirmar, digite a
              frase abaixo exatamente como está.
            </DialogDescription>
          </DialogHeader>
          <p className="select-all rounded-md border border-border bg-muted px-3 py-2 text-center font-mono text-sm font-semibold text-foreground">
            {s.frase_confirmacao}
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="frase-encerrar">Frase de confirmação</Label>
            <Input id="frase-encerrar" value={fraseDigitada} onChange={(e) => setFraseDigitada(e.target.value)} autoComplete="off" onPaste={(e) => e.preventDefault()} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmarFim(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={encerrar} disabled={!fraseOk || ocupado}>
              Encerrar simulado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function tempoDe(r: RespostaSimulado | undefined): number {
  if (!r) return Number.POSITIVE_INFINITY;
  const fim = r.finalizado_em ? Date.parse(r.finalizado_em) : Date.parse(r.atualizado_em);
  return Math.max(0, (fim - Date.parse(r.iniciado_em)) / 1000);
}

function Indicador({ rotulo, valor, pequeno, icone }: { rotulo: string; valor: string; pequeno?: boolean; icone?: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        {icone}
        {rotulo}
      </p>
      <p className={cn("font-bold tabular-nums text-foreground", pequeno ? "break-words font-mono text-sm" : "text-xl")}>{valor}</p>
    </div>
  );
}
