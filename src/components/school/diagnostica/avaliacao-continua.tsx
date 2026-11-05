import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardCheck, ClipboardPenLine, FileText, Printer, Save, Search, Target, Users2, CheckCircle2 } from "lucide-react";
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
type PlanoSalvo = {
  id: string;
  avaliacao_id: string;
  turma_id: string;
  aluno_id: string;
  aluno_nome: string;
  area: "leitura" | "escrita";
  habilidade_key: string;
  habilidade: string;
  nivel_base: number;
  objetivo: string;
  atividade_sugerida: string;
  rotina_sugerida: string;
  evidencia_esperada: string;
  status: "planejado" | "em_andamento" | "concluido" | "reavaliar";
  data_inicio: string | null;
  data_revisao: string | null;
  atividades: { data: string; descricao: string; evidencia: string; resultado: string; registrado_em: string }[];
  criado_em: string;
};
type Intervencao = {
  area: "Leitura" | "Escrita";
  chave: string;
  avaliacaoId: string;
  habilidade: string;
  nivel: number;
  objetivo: string;
  atividade: string;
  rotina: string;
  evidencia: string;
};

const ESTRATEGIAS: Record<string, Omit<Intervencao, "area" | "habilidade" | "nivel">> = {
  precisao: {
    objetivo: "Reconhecer palavras com maior precisão, reduzindo trocas, omissões e hesitações.",
    atividade: "Leitura guiada de listas graduadas, jogos de correspondência palavra-imagem e leitura repetida de pequenos trechos.",
    rotina: "2 a 3 sessões semanais de 10 a 15 minutos, com palavras e textos adequados ao nível de leitura.",
    evidencia: "Registrar palavras lidas corretamente, tipos de troca e necessidade de ajuda.",
  },
  fluencia: {
    objetivo: "Ganhar continuidade, ritmo e segurança sem sacrificar a compreensão.",
    atividade: "Leitura eco, leitura em duplas e releitura de um mesmo texto curto com acompanhamento do professor.",
    rotina: "3 sessões semanais de 10 minutos; comparar uma leitura inicial e outra após a prática.",
    evidencia: "Anotar interrupções, autocorreções, continuidade e compreensão do trecho.",
  },
  prosodia: {
    objetivo: "Usar pausas, entonação e sinais de pontuação para construir sentido.",
    atividade: "Leitura dramatizada de diálogos, marcação de pausas no texto e leitura-modelo seguida de imitação.",
    rotina: "2 sessões semanais de 15 minutos, com textos curtos e variados.",
    evidencia: "Observar pausas adequadas, entonação e respeito à pontuação.",
  },
  compreensao_literal: {
    objetivo: "Localizar informações explícitas e recuperar fatos essenciais do texto.",
    atividade: "Leitura compartilhada com perguntas quem, onde, quando e o que aconteceu; localizar no texto a pista da resposta.",
    rotina: "2 a 3 textos curtos por semana, aumentando gradualmente a extensão.",
    evidencia: "Guardar respostas e indicar se o aluno localiza a informação no texto.",
  },
  compreensao_inferencial: {
    objetivo: "Construir inferências simples usando pistas do texto e conhecimentos prévios.",
    atividade: "Paradas durante a leitura para perguntar o que pode acontecer, por que o personagem agiu assim e quais pistas sustentam a resposta.",
    rotina: "2 sessões semanais de 15 minutos com conversa orientada.",
    evidencia: "Registrar a inferência e a pista textual usada para justificá-la.",
  },
  ideia_principal: {
    objetivo: "Identificar o assunto e distinguir a ideia principal de detalhes secundários.",
    atividade: "Dar título a parágrafos, selecionar a frase que melhor resume o texto e produzir resumo oral em uma ou duas frases.",
    rotina: "2 textos por semana, com retirada gradual de pistas do professor.",
    evidencia: "Comparar título, resumo e seleção da informação central.",
  },
  vocabulario: {
    objetivo: "Ampliar o repertório lexical e compreender palavras pelo contexto.",
    atividade: "Diário de palavras, exploração de sinônimos e antônimos, famílias de palavras e dedução de significado pelo contexto.",
    rotina: "Selecionar 3 a 5 palavras por semana e reutilizá-las em falas e pequenos textos.",
    evidencia: "Verificar se explica o significado e utiliza a palavra em novo contexto.",
  },
  ortografia: {
    objetivo: "Perceber regularidades ortográficas e revisar a escrita de palavras frequentes.",
    atividade: "Ditado reflexivo, classificação de palavras por regularidade, consulta a repertório visual e revisão orientada.",
    rotina: "2 a 3 sessões semanais de 10 a 15 minutos focadas nos padrões observados nos textos do aluno.",
    evidencia: "Manter amostras de escrita e contabilizar os padrões de erro que diminuem ou persistem.",
  },
  pontuacao: {
    objetivo: "Empregar sinais de pontuação para organizar frases e favorecer a leitura.",
    atividade: "Reescrever pequenos textos sem pontuação, comparar sentidos e revisar frases com ponto final, interrogação e exclamação.",
    rotina: "2 sessões semanais de 15 minutos, sempre a partir de textos produzidos pelo estudante.",
    evidencia: "Comparar uso adequado dos sinais em duas produções sucessivas.",
  },
  coerencia: {
    objetivo: "Produzir textos com ideias relacionadas ao tema e sequência compreensível.",
    atividade: "Planejar começo, desenvolvimento e fechamento com imagens, sequência de cenas e reconto antes da escrita.",
    rotina: "Uma produção curta por semana, com planejamento oral e revisão do sentido global.",
    evidencia: "Verificar manutenção do tema, sequência lógica e ausência de contradições.",
  },
  coesao: {
    objetivo: "Conectar frases e partes do texto usando recursos de articulação adequados.",
    atividade: "Ordenar frases, completar textos com conectivos e substituir repetições por pronomes ou expressões equivalentes.",
    rotina: "2 atividades semanais de reconstrução e ampliação de pequenos parágrafos.",
    evidencia: "Observar variedade e adequação dos conectivos e continuidade entre frases.",
  },
  estrutura: {
    objetivo: "Organizar o texto de acordo com sua finalidade e gênero.",
    atividade: "Analisar modelos curtos, planejar as partes do gênero trabalhado e produzir texto com roteiro visual.",
    rotina: "Uma sequência de produção por semana, alternando gêneros já trabalhados em sala.",
    evidencia: "Usar lista de verificação das partes esperadas para o gênero.",
  },
  frases: {
    objetivo: "Construir frases completas, compreensíveis e progressivamente mais elaboradas.",
    atividade: "Ampliar frases simples com quem, fez o quê, onde e quando; combinar frases e revisar concordância e ordem das palavras.",
    rotina: "2 a 3 sessões semanais de 10 minutos integradas à produção textual.",
    evidencia: "Guardar exemplos de frases iniciais e revisadas para comparar a evolução.",
  },
};


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
  const [planosSalvos, setPlanosSalvos] = useState<PlanoSalvo[]>([]);
  const [carregandoPlanos, setCarregandoPlanos] = useState(false);
  const [salvandoPlano, setSalvandoPlano] = useState<string | null>(null);
  const [rascunhosAtividade, setRascunhosAtividade] = useState<Record<string, { descricao: string; evidencia: string; resultado: string }>>({});
  const [salvandoAtividade, setSalvandoAtividade] = useState<string | null>(null);

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
  useEffect(() => {
    let ativo = true;
    setCarregandoPlanos(true);
    supabase.from("planos_intervencao_leitura_escrita").select("*").order("criado_em", { ascending: false })
      .then(({ data, error }) => {
        if (!ativo) return;
        if (error) {
          if (/planos_intervencao_leitura_escrita|does not exist|schema cache|42P01|PGRST205/i.test(error.message)) {
            toast.info("Para salvar e acompanhar intervenções, execute o SQL planos-intervencao-leitura-escrita.sql.");
          } else {
            toast.error("Não foi possível carregar os planos: " + error.message);
          }
        } else setPlanosSalvos((data ?? []) as PlanoSalvo[]);
        setCarregandoPlanos(false);
      });
    return () => { ativo = false; };
  }, []);

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


  const planosIntervencao = useMemo(() => {
    const porAluno = new Map<string, Registro[]>();
    for (const registro of registrosDoRecorte) {
      const lista = porAluno.get(registro.aluno_id) ?? [];
      lista.push(registro);
      porAluno.set(registro.aluno_id, lista);
    }
    return [...porAluno.entries()].map(([alunoId, historico]) => {
      const ordenado = [...historico].sort((a, b) =>
        b.data_avaliacao.localeCompare(a.data_avaliacao) || b.updated_at.localeCompare(a.updated_at),
      );
      const maisRecente = ordenado[0]!;
      const habilidades: Intervencao[] = [];
      for (const [area, lista] of [["Leitura", LEITURA], ["Escrita", ESCRITA]] as const) {
        for (const [chave, nome] of lista) {
          const avaliacao = ordenado.find((r) => {
            const valores = area === "Leitura" ? r.criterios?.leitura : r.criterios?.escrita;
            return valores?.[chave] != null;
          });
          const valores = area === "Leitura" ? avaliacao?.criterios?.leitura : avaliacao?.criterios?.escrita;
          const nota = valores?.[chave];
          if (nota == null || nota > PONTOS_FRAGEIS) continue;
          const estrategia = ESTRATEGIAS[chave];
          if (estrategia) habilidades.push({
            area, chave, avaliacaoId: avaliacao!.id, habilidade: nome, nivel: nota, ...estrategia,
          });
        }
      }
      habilidades.sort((a, b) => a.nivel - b.nivel);
      const turma = turmas.find((t) => t.id === maisRecente.turma_id);
      return {
        alunoId,
        nome: maisRecente.aluno_nome,
        turmaId: maisRecente.turma_id,
        turmaNome: turma ? turma.serie + " " + turma.letra : "Turma não identificada",
        dataBase: maisRecente.data_avaliacao,
        bimestreBase: maisRecente.bimestre,
        habilidades,
        prioridade: habilidades.some((h) => h.nivel === 1) || habilidades.length >= 3 ? "Prioritária" : "Acompanhar",
      };
    }).filter((plano) => plano.habilidades.length > 0)
      .sort((a, b) => (a.prioridade === b.prioridade ? a.nome.localeCompare(b.nome, "pt-BR") : a.prioridade === "Prioritária" ? -1 : 1));
  }, [registrosDoRecorte, turmas]);


  async function salvarPlanoIndividual(plano: (typeof planosIntervencao)[number]) {
    setSalvandoPlano(plano.alunoId);
    const dataInicio = new Date().toISOString().slice(0, 10);
    const dataRevisao = new Date(Date.now() + 28 * 86400000).toISOString().slice(0, 10);
    const payloads = plano.habilidades.map((h) => ({
      avaliacao_id: h.avaliacaoId,
      turma_id: plano.turmaId,
      aluno_id: plano.alunoId,
      aluno_nome: plano.nome,
      area: h.area === "Leitura" ? "leitura" : "escrita",
      habilidade_key: h.chave,
      habilidade: h.habilidade,
      nivel_base: h.nivel,
      objetivo: h.objetivo,
      atividade_sugerida: h.atividade,
      rotina_sugerida: h.rotina,
      evidencia_esperada: h.evidencia,
      status: "planejado",
      data_inicio: dataInicio,
      data_revisao: dataRevisao,
      atualizado_em: new Date().toISOString(),
    }));
    for (const payload of payloads) {
      const { error } = await supabase.from("planos_intervencao_leitura_escrita")
        .upsert(payload, { onConflict: "avaliacao_id,area,habilidade_key" });
      if (error) {
        toast.error("Não foi possível salvar o plano: " + error.message);
        setSalvandoPlano(null);
        return;
      }
    }
    const { data, error } = await supabase.from("planos_intervencao_leitura_escrita")
      .select("*").eq("aluno_id", plano.alunoId).order("criado_em", { ascending: false });
    if (error) toast.error("Plano salvo, mas não foi possível atualizar a lista: " + error.message);
    else {
      setPlanosSalvos((atual) => {
        const outros = atual.filter((item) => item.aluno_id !== plano.alunoId);
        return [...outros, ...((data ?? []) as PlanoSalvo[])];
      });
      toast.success("Plano individual salvo. Agora registre as atividades realizadas.");
    }
    setSalvandoPlano(null);
  }

  async function atualizarStatusPlano(plano: PlanoSalvo, status: PlanoSalvo["status"]) {
    const { error } = await supabase.from("planos_intervencao_leitura_escrita")
      .update({ status, atualizado_em: new Date().toISOString() }).eq("id", plano.id);
    if (error) toast.error("Não foi possível atualizar o status: " + error.message);
    else {
      setPlanosSalvos((atual) => atual.map((item) => item.id === plano.id ? { ...item, status } : item));
      toast.success("Status do plano atualizado.");
    }
  }

  async function registrarAtividade(plano: PlanoSalvo) {
    const rascunho = rascunhosAtividade[plano.id];
    if (!rascunho?.descricao.trim()) {
      toast.error("Descreva a atividade realizada.");
      return;
    }
    setSalvandoAtividade(plano.id);
    const atividades = [
      ...(plano.atividades ?? []),
      {
        data: new Date().toISOString().slice(0, 10),
        descricao: rascunho.descricao.trim(),
        evidencia: rascunho.evidencia.trim(),
        resultado: rascunho.resultado,
        registrado_em: new Date().toISOString(),
      },
    ];
    const { error } = await supabase.from("planos_intervencao_leitura_escrita")
      .update({
        atividades,
        status: plano.status === "planejado" ? "em_andamento" : plano.status,
        atualizado_em: new Date().toISOString(),
      }).eq("id", plano.id);
    if (error) toast.error("Não foi possível registrar a atividade: " + error.message);
    else {
      setPlanosSalvos((atual) => atual.map((item) => item.id === plano.id
        ? { ...item, atividades, status: item.status === "planejado" ? "em_andamento" : item.status }
        : item));
      setRascunhosAtividade((atual) => ({ ...atual, [plano.id]: { descricao: "", evidencia: "", resultado: "em_progresso" } }));
      toast.success("Atividade registrada no histórico do aluno.");
    }
    setSalvandoAtividade(null);
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
        <Indicador titulo="Alunos acompanhados" valor={alunosUnicos} detalhe="identificados por código interno do cadastro" />
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
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><Target className="size-4 text-primary" /> Plano de intervenção pedagógica</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Sugestões geradas a partir do resultado mais recente de cada habilidade, sem transformar ausência de avaliação em dificuldade.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="mr-2 size-4" /> Imprimir planos</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Indicador titulo="Alunos com plano sugerido" valor={planosIntervencao.length} detalhe="com pelo menos uma habilidade em nível 1 ou 2" />
            <Indicador titulo="Prioridade pedagógica" valor={planosIntervencao.filter(p => p.prioridade === "Prioritária").length} detalhe="nível 1 ou três ou mais habilidades frágeis" />
            <Indicador titulo="Habilidades a trabalhar" valor={planosIntervencao.reduce((s,p) => s + p.habilidades.length, 0)} detalhe="com base na avaliação mais recente" />
          </div>
          {planosIntervencao.length ? planosIntervencao.map((plano) => (
            <section key={plano.alunoId} className="break-inside-avoid rounded-2xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="flex items-center gap-2 font-bold"><ClipboardCheck className="size-4 text-primary" />{plano.nome}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{plano.turmaNome} · Base: {plano.bimestreBase}º bimestre · {new Date(plano.dataBase + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                </div>
                <span className={plano.prioridade === "Prioritária" ? "rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-300" : "rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300"}>{plano.prioridade}</span>
                <Button size="sm" onClick={() => void salvarPlanoIndividual(plano)} disabled={salvandoPlano === plano.alunoId}>
                  <Save className="mr-2 size-4" />{salvandoPlano === plano.alunoId ? "Salvando..." : "Criar / atualizar plano"}
                </Button>
              </div>
              <div className="mt-3 space-y-3">
                {plano.habilidades.map((h) => (
                  <div key={h.habilidade} className="rounded-xl bg-muted/35 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-primary">{h.area} · {h.habilidade}</span>
                      <span className="text-xs font-semibold">Nível {h.nivel} · {NIVEL[h.nivel]}</span>
                    </div>
                    <p className="mt-2 text-sm"><b>Objetivo:</b> {h.objetivo}</p>
                    <p className="mt-1 text-sm"><b>Atividade sugerida:</b> {h.atividade}</p>
                    <p className="mt-1 text-sm"><b>Rotina:</b> {h.rotina}</p>
                    <p className="mt-1 text-sm"><b>Como acompanhar:</b> {h.evidencia}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 rounded-lg border border-dashed border-border p-2 text-xs text-muted-foreground">Revisão sugerida: após 4 semanas de atividades. Reavalie os mesmos critérios e compare com esta linha de base. O professor valida e adapta as propostas à realidade da turma.</p>
            </section>
          )) : <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <CheckCircle2 className="mx-auto size-7 text-emerald-600" />
            <p className="mt-2 text-sm font-semibold">Nenhum plano sugerido neste recorte.</p>
            <p className="mt-1 text-xs text-muted-foreground">Registros insuficientes ou habilidades avaliadas mais recentemente acima do nível 2.</p>
          </div>}
          <p className="text-xs text-muted-foreground">Este é um apoio à decisão pedagógica, não um diagnóstico clínico ou rótulo do estudante. O professor deve validar as estratégias, considerar o contexto e registrar novas evidências na próxima avaliação.</p>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="size-4 text-primary" /> Acompanhamento das intervenções registradas</CardTitle>
          <p className="text-xs text-muted-foreground">Atualize a situação do plano e registre cada atividade com evidências e resultado observado.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {carregandoPlanos ? <p className="text-sm text-muted-foreground">Carregando planos salvos...</p>
            : planosSalvos.length ? planosSalvos.map((plano) => (
              <section key={plano.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">{plano.aluno_nome}</h3>
                    <p className="text-xs text-muted-foreground">{plano.area === "leitura" ? "Leitura" : "Escrita"} · {plano.habilidade} · Nível inicial {plano.nivel_base}/4</p>
                    <p className="mt-1 text-xs text-muted-foreground">Revisão prevista: {plano.data_revisao ? new Date(plano.data_revisao + "T12:00:00").toLocaleDateString("pt-BR") : "não definida"}</p>
                  </div>
                  <select value={plano.status} onChange={(e) => void atualizarStatusPlano(plano, e.target.value as PlanoSalvo["status"])} className="rounded-lg border border-input bg-background px-3 py-2 text-xs">
                    <option value="planejado">Planejado</option>
                    <option value="em_andamento">Em andamento</option>
                    <option value="concluido">Concluído</option>
                    <option value="reavaliar">Aguardando reavaliação</option>
                  </select>
                </div>
                <div className="mt-3 rounded-lg bg-muted/40 p-3 text-sm">
                  <p><b>Objetivo:</b> {plano.objetivo}</p>
                  <p className="mt-1"><b>Atividade:</b> {plano.atividade_sugerida}</p>
                  <p className="mt-1"><b>Rotina:</b> {plano.rotina_sugerida}</p>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <input value={rascunhosAtividade[plano.id]?.descricao ?? ""} onChange={(e) => setRascunhosAtividade((atual) => ({ ...atual, [plano.id]: { descricao: e.target.value, evidencia: atual[plano.id]?.evidencia ?? "", resultado: atual[plano.id]?.resultado ?? "em_progresso" } }))} placeholder="Atividade realizada (obrigatório)" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  <input value={rascunhosAtividade[plano.id]?.evidencia ?? ""} onChange={(e) => setRascunhosAtividade((atual) => ({ ...atual, [plano.id]: { descricao: atual[plano.id]?.descricao ?? "", evidencia: e.target.value, resultado: atual[plano.id]?.resultado ?? "em_progresso" } }))} placeholder="Evidência observada (opcional)" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  <select value={rascunhosAtividade[plano.id]?.resultado ?? "em_progresso"} onChange={(e) => setRascunhosAtividade((atual) => ({ ...atual, [plano.id]: { descricao: atual[plano.id]?.descricao ?? "", evidencia: atual[plano.id]?.evidencia ?? "", resultado: e.target.value } }))} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    <option value="em_progresso">Em desenvolvimento</option>
                    <option value="avanco_observado">Avanço observado</option>
                    <option value="sem_avanco">Sem avanço observado</option>
                    <option value="dificuldade_persistente">Dificuldade persistente</option>
                  </select>
                  <Button size="sm" onClick={() => void registrarAtividade(plano)} disabled={salvandoAtividade === plano.id}>
                    <Save className="mr-2 size-4" />{salvandoAtividade === plano.id ? "Registrando..." : "Registrar atividade"}
                  </Button>
                </div>
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Histórico de atividades ({plano.atividades?.length ?? 0})</p>
                  {(plano.atividades ?? []).length ? [...plano.atividades].reverse().map((atividade, index) => (
                    <div key={atividade.registrado_em + index} className="rounded-lg border border-border/70 p-2 text-xs">
                      <div className="flex flex-wrap justify-between gap-2"><b>{new Date(atividade.data + "T12:00:00").toLocaleDateString("pt-BR")}</b><span>{atividade.resultado.replaceAll("_", " ")}</span></div>
                      <p className="mt-1">{atividade.descricao}</p>
                      {atividade.evidencia && <p className="mt-1 text-muted-foreground">Evidência: {atividade.evidencia}</p>}
                    </div>
                  )) : <p className="text-xs text-muted-foreground">Nenhuma atividade registrada ainda.</p>}
                </div>
              </section>
            )) : <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">Nenhum plano salvo. Gere um plano na seção acima para iniciar o acompanhamento.</p>}
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
