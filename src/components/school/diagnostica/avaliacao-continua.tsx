import { useEffect, useMemo, useState } from "react";
import { BookOpenText, CalendarDays, CheckCircle2, ClipboardPenLine, FileText, Save, Search, Users2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/app-store";
import { supabase } from "@/lib/supabase-client";

const LEITURA = [
  ["precisao", "Precisão e reconhecimento de palavras"],
  ["fluencia", "Fluência e ritmo de leitura"],
  ["prosodia", "Entonação e pontuação na leitura"],
  ["compreensao_literal", "Compreensão literal"],
  ["compreensao_inferencial", "Compreensão inferencial"],
  ["ideia_principal", "Identificação da ideia principal"],
  ["vocabulario", "Vocabulário e compreensão de palavras"],
] as const;

const ESCRITA = [
  ["ortografia", "Ortografia"],
  ["pontuacao", "Pontuação"],
  ["coerencia", "Coerência textual"],
  ["coesao", "Coesão e articulação de ideias"],
  ["estrutura", "Estrutura e organização do texto"],
  ["frases", "Construção de frases"],
] as const;

type Criterios = { leitura: Record<string, number>; escrita: Record<string, number> };
type Registro = {
  id: string;
  turma_id: string;
  aluno_id: string;
  aluno_nome: string;
  ano: number;
  bimestre: number;
  data_avaliacao: string;
  titulo: string;
  criterios: Criterios;
  observacoes: string | null;
  evidencia: string | null;
  created_at: string;
  updated_at: string;
};

const NIVEL: Record<number, string> = {
  1: "Ainda não demonstra",
  2: "Em desenvolvimento",
  3: "Adequado",
  4: "Consolidado",
};
const CRITERIOS_VAZIOS: Criterios = { leitura: {}, escrita: {} };
const PONTOS_FRAGEIS = 2;

function media(valores: number[]) {
  return valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null;
}
function percentual(n: number | null) {
  return n == null ? "—" : `${Math.round((n / 4) * 100)}%`;
}

export function AvaliacaoContinuaLeituraEscrita() {
  const { turmas } = useAppStore();
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [turmaId, setTurmaId] = useState("");
  const [alunoId, setAlunoId] = useState("");
  const [bimestre, setBimestre] = useState("");
  const [data, setData] = useState("");
  const [titulo, setTitulo] = useState("");
  const [criterios, setCriterios] = useState<Criterios>(CRITERIOS_VAZIOS);
  const [observacoes, setObservacoes] = useState("");
  const [evidencia, setEvidencia] = useState("");
  const [edicaoId, setEdicaoId] = useState<string | null>(null);
  const [filtroBimestre, setFiltroBimestre] = useState("todos");
  const [filtroTurma, setFiltroTurma] = useState("todas");
  const [busca, setBusca] = useState("");

  const turmasAtivas = turmas.filter((t) => t.alunos.length > 0);
  const turmaAtual = turmas.find((t) => t.id === turmaId);
  const alunosAtivos = (turmaAtual?.alunos ?? []).filter((a) => a.situacao !== "transferido" && a.situacao !== "desistente");

  async function carregar() {
    setCarregando(true);
    const { data: rows, error } = await supabase
      .from("avaliacoes_leitura_escrita")
      .select("*")
      .order("data_avaliacao", { ascending: false });
    if (error) {
      if (/avaliacoes_leitura_escrita|does not exist|schema cache|42P01|PGRST205/i.test(error.message)) {
        toast.error("A tabela de avaliação contínua ainda não foi instalada no Supabase. Consulte o arquivo SQL do projeto.");
      } else {
        toast.error("Não foi possível carregar as avaliações: " + error.message);
      }
      setRegistros([]);
    } else {
      setRegistros((rows ?? []) as Registro[]);
    }
    setCarregando(false);
  }

  useEffect(() => { void carregar(); }, []);

  const registrosDoRecorte = useMemo(() => registros.filter((r) =>
    (filtroTurma === "todas" || r.turma_id === filtroTurma) &&
    (!busca || r.aluno_nome.toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR"))),
  ), [registros, filtroTurma, busca]);
  const filtrados = registrosDoRecorte.filter((r) =>
    filtroBimestre === "todos" || String(r.bimestre) === filtroBimestre,
  );

  const resumo = useMemo(() => {
    const notasLeitura = filtrados.flatMap((r) => Object.values(r.criterios?.leitura ?? {}));
    const notasEscrita = filtrados.flatMap((r) => Object.values(r.criterios?.escrita ?? {}));
    const dificuldades = new Map<string, { total: number; soma: number; alunos: Set<string> }>();
    for (const r of filtrados) {
      for (const [area, lista] of [["Leitura", LEITURA], ["Escrita", ESCRITA]] as const) {
        const valores = area === "Leitura" ? r.criterios?.leitura ?? {} : r.criterios?.escrita ?? {};
        for (const [chave, nome] of lista) {
          const nota = valores[chave];
          if (!nota) continue;
          const item = dificuldades.get(`${area} · ${nome}`) ?? { total: 0, soma: 0, alunos: new Set<string>() };
          item.total += 1;
          item.soma += nota;
          if (nota <= PONTOS_FRAGEIS) item.alunos.add(r.aluno_nome);
          dificuldades.set(`${area} · ${nome}`, item);
        }
      }
    }
    return {
      leitura: media(notasLeitura),
      escrita: media(notasEscrita),
      habilidades: [...dificuldades.entries()].map(([nome, v]) => ({ nome, media: v.soma / v.total, alunos: [...v.alunos].sort() }))
        .sort((a, b) => a.media - b.media),
    };
  }, [filtrados]);

  function limparFormulario() {
    setAlunoId(""); setBimestre(""); setData(""); setTitulo("");
    setCriterios(CRITERIOS_VAZIOS); setObservacoes(""); setEvidencia(""); setEdicaoId(null);
  }

  function editar(r: Registro) {
    setTurmaId(r.turma_id); setAlunoId(r.aluno_id); setBimestre(String(r.bimestre));
    setData(r.data_avaliacao); setTitulo(r.titulo); setCriterios(r.criterios ?? CRITERIOS_VAZIOS);
    setObservacoes(r.observacoes ?? ""); setEvidencia(r.evidencia ?? ""); setEdicaoId(r.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setNota(area: "leitura" | "escrita", chave: string, valor: string) {
    setCriterios((atual) => {
      const proximo = { ...atual, [area]: { ...atual[area] } };
      if (valor) proximo[area][chave] = Number(valor);
      else delete proximo[area][chave];
      return proximo;
    });
  }

  async function salvar() {
    if (!turmaId || !alunoId || !bimestre || !data || !titulo.trim()) {
      toast.error("Informe turma, aluno, bimestre, data real da avaliação e título.");
      return;
    }
    if (!Object.keys(criterios.leitura).length && !Object.keys(criterios.escrita).length) {
      toast.error("Registre pelo menos um critério de leitura ou escrita.");
      return;
    }
    const aluno = turmaAtual?.alunos.find((a) => a.id === alunoId);
    if (!aluno || !turmaAtual) {
      toast.error("Selecione novamente a turma e o aluno.");
      return;
    }
    setSalvando(true);
    const payload = {
      turma_id: turmaId, aluno_id: alunoId, aluno_nome: aluno.nome,
      ano: Number(turmaAtual.serie.match(/\d+/)?.[0] ?? 0),
      bimestre: Number(bimestre), data_avaliacao: data, titulo: titulo.trim(),
      criterios, observacoes: observacoes.trim() || null, evidencia: evidencia.trim() || null,
      updated_at: new Date().toISOString(),
    };
    let error: { message: string } | null = null;
    if (edicaoId) {
      const result = await supabase.from("avaliacoes_leitura_escrita").update(payload).eq("id", edicaoId);
      error = result.error;
    } else {
      const result = await supabase.from("avaliacoes_leitura_escrita").insert(payload);
      error = result.error;
    }
    if (error) toast.error("Não foi possível salvar: " + error.message);
    else {
      toast.success(edicaoId ? "Avaliação atualizada." : "Avaliação registrada.");
      limparFormulario();
      await carregar();
    }
    setSalvando(false);
  }

  const alunosUnicos = new Set(filtrados.map((r) => r.aluno_id)).size;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary"><ClipboardPenLine className="size-4" /> Avaliação contínua</div>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Acompanhamento de leitura e escrita</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Registre evidências pedagógicas por aluno, acompanhe os quatro bimestres e identifique habilidades que precisam de intervenção.</p>
      </section>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="size-4 text-primary" /> {edicaoId ? "Editar avaliação" : "Registrar nova avaliação"}</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs font-semibold text-muted-foreground">TURMA
              <select value={turmaId} onChange={(e) => { setTurmaId(e.target.value); setAlunoId(""); }} className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground">
                <option value="">Selecione</option>
                {turmasAtivas.map((t) => <option key={t.id} value={t.id}>{t.serie} {t.letra}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-muted-foreground">ALUNO
              <select value={alunoId} onChange={(e) => setAlunoId(e.target.value)} disabled={!turmaId} className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground">
                <option value="">Selecione o aluno</option>
                {alunosAtivos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-muted-foreground">BIMESTRE
              <select value={bimestre} onChange={(e) => setBimestre(e.target.value)} className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground">
                <option value="">Selecione o bimestre</option>
                {[1,2,3,4].map((n) => <option key={n} value={n}>{n}º bimestre</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-muted-foreground">DATA REAL DA AVALIAÇÃO
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground" />
            </label>
            <label className="text-xs font-semibold text-muted-foreground sm:col-span-2">TÍTULO / ATIVIDADE AVALIADA
              <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: leitura de conto e produção de reconto" className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground" />
            </label>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Rubrica titulo="Leitura" descricao="Avalie apenas o que foi observado nesta atividade." itens={LEITURA} valores={criterios.leitura} aoMudar={(k,v) => setNota("leitura",k,v)} />
            <Rubrica titulo="Produção escrita" descricao="Considere o texto produzido pelo estudante." itens={ESCRITA} valores={criterios.escrita} aoMudar={(k,v) => setNota("escrita",k,v)} />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <label className="text-xs font-semibold text-muted-foreground">OBSERVAÇÕES PEDAGÓGICAS
              <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} placeholder="Registre estratégias usadas, avanços observados e pontos de atenção..." className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground" />
            </label>
            <label className="text-xs font-semibold text-muted-foreground">EVIDÊNCIA / TRECHO DO TEXTO / REGISTRO DE LEITURA
              <textarea value={evidencia} onChange={(e) => setEvidencia(e.target.value)} rows={3} placeholder="Ex.: leu um parágrafo, omitiu pontuação, escreveu frases sem conectivos..." className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground" />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void salvar()} disabled={salvando}><Save className="mr-2 size-4" />{salvando ? "Salvando..." : edicaoId ? "Atualizar avaliação" : "Salvar avaliação"}</Button>
            {edicaoId && <Button variant="outline" onClick={limparFormulario}>Cancelar edição</Button>}
          </div>
          <p className="text-xs text-muted-foreground">Escala: 1 · Ainda não demonstra; 2 · Em desenvolvimento; 3 · Adequado; 4 · Consolidado. Critérios não observados ficam sem nota — não são tratados como zero.</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador titulo="Registros no recorte" valor={filtrados.length} detalhe="avaliações salvas" />
        <Indicador titulo="Alunos acompanhados" valor={alunosUnicos} detalhe="identificados por matrícula interna" />
        <Indicador titulo="Média de leitura" valor={percentual(resumo.leitura)} detalhe="dos critérios avaliados" />
        <Indicador titulo="Média de escrita" valor={percentual(resumo.escrita)} detalhe="dos critérios avaliados" />
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Search className="size-4 text-primary" /> Relatórios e mapa de dificuldades</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <select value={filtroBimestre} onChange={(e) => setFiltroBimestre(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm"><option value="todos">Todos os bimestres</option>{[1,2,3,4].map(n => <option key={n} value={n}>{n}º bimestre</option>)}</select>
            <select value={filtroTurma} onChange={(e) => setFiltroTurma(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm"><option value="todas">Todas as turmas</option>{turmas.map(t => <option key={t.id} value={t.id}>{t.serie} {t.letra}</option>)}</select>
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar aluno..." className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm" />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-bold">Habilidades que exigem atenção</h3>
              {resumo.habilidades.length ? resumo.habilidades.map((h) => (
                <div key={h.nome} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{h.nome}</span><b className="text-sm tabular-nums">{percentual(h.media)}</b></div>
                  <div className="mt-2 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${h.media / 4 * 100}%` }} /></div>
                  <p className="mt-1 text-xs text-muted-foreground">Alunos com nível 1 ou 2: {h.alunos.length ? h.alunos.join(", ") : "nenhum identificado neste recorte"}</p>
                </div>
              )) : <p className="text-sm text-muted-foreground">Ainda não há critérios avaliados no filtro selecionado.</p>}
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold">Avaliações registradas</h3>
              {carregando ? <p className="text-sm text-muted-foreground">Carregando registros...</p> : filtrados.length ? filtrados.map((r) => (
                <button key={r.id} type="button" onClick={() => editar(r)} className="w-full rounded-xl border border-border p-3 text-left transition hover:border-primary/50 hover:bg-muted/40">
                  <span className="flex flex-wrap items-center justify-between gap-2"><b className="text-sm">{r.aluno_nome}</b><span className="text-xs text-muted-foreground">{r.bimestre}º bim. · {new Date(`${r.data_avaliacao}T12:00:00`).toLocaleDateString("pt-BR")}</span></span>
                  <span className="mt-1 block text-xs text-muted-foreground">{r.titulo} · {r.ano}º ano</span>
                  <span className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary"><FileText className="size-3" /> Abrir e editar registro</span>
                </button>
              )) : <p className="text-sm text-muted-foreground">Nenhuma avaliação encontrada. Registre a primeira avaliação acima.</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="size-4 text-primary" /> Evolução bimestral do estudante</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">A linha do tempo mostra somente os bimestres com avaliações reais. Bimestres sem registro aparecem como “Sem avaliação”, sem estimativas.</p>
          {registrosDoRecorte.length ? [...new Set(registrosDoRecorte.map(r => r.aluno_id))].sort().map(id => {
            const hist = registrosDoRecorte.filter(r => r.aluno_id === id).sort((a,b) => a.bimestre-b.bimestre || a.data_avaliacao.localeCompare(b.data_avaliacao));
            const nome = hist[0]?.aluno_nome ?? "Aluno";
            const detalhar = (area: "leitura" | "escrita", itens: readonly (readonly [string, string])[]) =>
              itens.map(([chave, rotulo]) => ({
                rotulo,
                nota: media(hist.flatMap(r => {
                  const valor = r.criterios?.[area]?.[chave];
                  return valor == null ? [] : [valor];
                })),
              })).filter(item => item.nota != null);
            const detalhesLeitura = detalhar("leitura", LEITURA);
            const detalhesEscrita = detalhar("escrita", ESCRITA);
            return <div key={id} className="rounded-xl border border-border p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold"><Users2 className="size-4 text-primary" />{nome}</div>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {[1,2,3,4].map(b => {
                  const doBimestre = hist.filter(r => r.bimestre === b);
                  const leitura = media(doBimestre.flatMap(r => Object.values(r.criterios?.leitura ?? {})));
                  const escrita = media(doBimestre.flatMap(r => Object.values(r.criterios?.escrita ?? {})));
                  return <div key={b} className="rounded-lg bg-muted/40 p-2">
                    <p className="text-xs font-bold">{b}º bimestre</p>
                    {doBimestre.length ? <><p className="mt-1 text-xs">Leitura: <b>{percentual(leitura)}</b></p><p className="text-xs">Escrita: <b>{percentual(escrita)}</b></p><p className="text-[10px] text-muted-foreground">{doBimestre.length} registro(s)</p></> : <p className="mt-1 text-xs text-muted-foreground">Sem avaliação</p>}
                  </div>;
                })}
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {[["Leitura", detalhesLeitura], ["Escrita", detalhesEscrita]].map(([area, itens]) => (
                  <section key={String(area)} className="rounded-lg border border-border/70 p-3">
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{area}</h4>
                    {(itens as { rotulo: string; nota: number | null }[]).length ? (itens as { rotulo: string; nota: number | null }[]).map(item => (
                      <div key={item.rotulo} className="flex items-center justify-between gap-2 border-b border-border/50 py-1.5 last:border-0">
                        <span className="text-xs">{item.rotulo}</span>
                        <span className={item.nota != null && item.nota <= 2 ? "text-xs font-bold text-rose-600" : "text-xs font-semibold"}>{item.nota == null ? "—" : `${item.nota.toFixed(1)}/4 · ${NIVEL[Math.round(item.nota)]}`}</span>
                      </div>
                    )) : <p className="text-xs text-muted-foreground">Sem critérios avaliados.</p>}
                  </section>
                ))}
              </div>
            </div>;
          }) : <p className="text-sm text-muted-foreground">O histórico será preenchido conforme os professores registrarem as avaliações.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function Rubrica({ titulo, descricao, itens, valores, aoMudar }: {
  titulo: string; descricao: string; itens: readonly (readonly [string, string])[];
  valores: Record<string, number>; aoMudar: (chave: string, valor: string) => void;
}) {
  return <section className="rounded-2xl border border-border p-4">
    <h3 className="font-bold">{titulo}</h3><p className="mb-3 text-xs text-muted-foreground">{descricao}</p>
    <div className="space-y-3">{itens.map(([chave,nome]) => <label key={chave} className="grid items-center gap-2 sm:grid-cols-[1fr_190px]">
      <span className="text-sm">{nome}</span>
      <select value={valores[chave] ?? ""} onChange={e => aoMudar(chave,e.target.value)} className="rounded-lg border border-input bg-background px-2.5 py-2 text-xs">
        <option value="">Não avaliado</option>{[1,2,3,4].map(n => <option key={n} value={n}>{n} · {NIVEL[n]}</option>)}
      </select>
    </label>)}</div>
  </section>;
}

function Indicador({ titulo, valor, detalhe }: { titulo: string; valor: string | number; detalhe: string }) {
  return <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{titulo}</p><p className="mt-1 text-2xl font-extrabold tabular-nums">{valor}</p><p className="mt-1 text-[11px] text-muted-foreground">{detalhe}</p></CardContent></Card>;
}
