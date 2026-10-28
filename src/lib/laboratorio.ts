import { useCallback, useEffect, useState } from "react";

import { NOMES_NA_HOME } from "@/lib/recursos";
import { FUSO_ESCOLA, agoraNaEscola, toDateKey } from "@/lib/schedule-engine";
import { supabase } from "@/lib/supabase-client";

/**
 * Controle do laboratório: o professor marca os alunos que vão, diz por
 * quanto tempo (ou o horário de início e fim) e o sistema guarda, mostra na
 * home quem está lá agora e conta quantas vezes cada aluno já foi na semana
 * e no mês. Tabela: supabase/laboratorio.sql.
 */

export interface SessaoLab {
  id: string;
  /** Dia letivo, YYYY-MM-DD, no horário de Rio Branco. */
  data: string;
  grupoId: string;
  turmaId: string;
  turmaRotulo: string;
  alunoId: string;
  alunoNome: string;
  /** Instantes em ISO (UTC). */
  inicio: string;
  fim: string;
  criadoEm: string;
  /** Quando a aula foi pausada (null = rodando). Enquanto pausada, o relógio fica parado. */
  pausadoEm: string | null;
  /** Soma, em segundos, das pausas já encerradas. */
  pausaSegundos: number;
  /** Justificativa de quem parou a aula antes da hora. */
  motivoParada: string | null;
}

interface Linha {
  id: string;
  data: string;
  grupo_id: string;
  turma_id: string;
  turma_rotulo: string;
  aluno_id: string;
  aluno_nome: string;
  inicio: string;
  fim: string;
  criado_em: string;
  pausado_em?: string | null;
  pausa_segundos?: number | null;
  motivo_parada?: string | null;
}

const deLinha = (l: Linha): SessaoLab => ({
  id: l.id,
  data: l.data,
  grupoId: l.grupo_id,
  turmaId: l.turma_id,
  turmaRotulo: l.turma_rotulo,
  alunoId: l.aluno_id,
  alunoNome: l.aluno_nome,
  inicio: l.inicio,
  fim: l.fim,
  criadoEm: l.criado_em,
  pausadoEm: l.pausado_em ?? null,
  pausaSegundos: l.pausa_segundos ?? 0,
  motivoParada: l.motivo_parada ?? null,
});

/* ───────────────────────── datas e horas ───────────────────────── */

/** Rio Branco é UTC−5 o ano todo (sem horário de verão). */
const DESLOCAMENTO_HORAS = 5;

/** Dia letivo (YYYY-MM-DD) em que um instante cai, no horário da escola. */
export function dataNaEscola(instante: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_ESCOLA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instante);
}

export const hojeNaEscola = () => toDateKey(agoraNaEscola());

/** Instante real de um "HH:MM" digitado, num dia letivo, no horário da escola. */
export function instanteNaEscola(dia: string, hhmm: string): Date {
  const [y, m, d] = dia.split("-").map(Number);
  const [h, min] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!, (h ?? 0) + DESLOCAMENTO_HORAS, min ?? 0));
}

export function horaNaEscola(instante: string | number | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO_ESCOLA,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(instante));
}

/** "HH:MM" do horário atual da escola, para preencher campos de hora. */
export const horaAgoraNaEscola = () => horaNaEscola(Date.now());

export function somarMinutos(base: Date, minutos: number): Date {
  return new Date(base.getTime() + minutos * 60_000);
}

function chaveParaData(chave: string): Date {
  const [y, m, d] = chave.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

/** Segunda-feira da semana que contém o dia (semana letiva: segunda a domingo). */
export function inicioDaSemana(chave: string): string {
  const d = chaveParaData(chave);
  const atras = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - atras);
  return toDateKey(d);
}

export function fimDaSemana(chave: string): string {
  const d = chaveParaData(inicioDaSemana(chave));
  d.setDate(d.getDate() + 6);
  return toDateKey(d);
}

export const inicioDoMes = (chave: string) => `${chave.slice(0, 7)}-01`;

/** Desde quando buscar: cobre a semana e o mês do dia, o que vier primeiro. */
export function buscarDesde(hoje: string): string {
  const s = inicioDaSemana(hoje);
  const m = inicioDoMes(hoje);
  const d = chaveParaData(hoje);
  d.setDate(d.getDate() - 1);
  const ontem = toDateKey(d);
  return [s, m, ontem].sort()[0]!;
}

/** Aulas encerradas nas últimas 24 horas, agrupadas por dia (a mais recente primeiro). */
export function historico24h(
  sessoes: SessaoLab[],
  agora: number,
): { data: string; grupos: GrupoLab[] }[] {
  const corte = agora - 24 * 3_600_000;
  const recentes = sessoes.filter(
    (s) => estadoDaSessao(s, agora) === "encerrada" && new Date(s.fim).getTime() >= corte,
  );
  const porDia = new Map<string, SessaoLab[]>();
  for (const s of recentes) porDia.set(s.data, [...(porDia.get(s.data) ?? []), s]);
  return [...porDia.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([data, lista]) => ({ data, grupos: agruparSessoes(lista) }));
}

export function textoRestante(ms: number): string {
  if (ms <= 0) return "encerrando";
  const min = Math.ceil(ms / 60_000);
  if (ms < 60_000) return `${Math.ceil(ms / 1000)} s`;
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")} min`;
}

/* ───────────────────────── regras ───────────────────────── */

export type EstadoSessao = "agendada" | "ao-vivo" | "encerrada";

type ComPausa = Pick<SessaoLab, "inicio" | "fim"> & { pausadoEm?: string | null | undefined };

/** Instante que vale para a contagem: parado no momento da pausa enquanto a aula está pausada. */
export function instanteEfetivo(s: ComPausa, agora: number): number {
  return s.pausadoEm ? Math.min(agora, new Date(s.pausadoEm).getTime()) : agora;
}

export function estadoDaSessao(s: ComPausa, agora: number): EstadoSessao {
  const t = instanteEfetivo(s, agora);
  if (new Date(s.fim).getTime() <= t) return "encerrada";
  if (new Date(s.inicio).getTime() > t) return "agendada";
  return "ao-vivo";
}

export interface GrupoLab {
  grupoId: string;
  turmaId: string;
  turmaRotulo: string;
  inicio: string;
  fim: string;
  pausadoEm: string | null;
  motivoParada: string | null;
  alunos: { id: string; nome: string; turmaId: string; turmaRotulo: string }[];
}

/** Junta as linhas de um mesmo clique ("grupo") em um cartão só. */
export function agruparSessoes(sessoes: SessaoLab[]): GrupoLab[] {
  const mapa = new Map<string, GrupoLab>();
  for (const s of sessoes) {
    const g = mapa.get(s.grupoId);
    if (g) {
      g.alunos.push({
        id: s.alunoId,
        nome: s.alunoNome,
        turmaId: s.turmaId,
        turmaRotulo: s.turmaRotulo,
      });
      // Alunos de turmas diferentes no mesmo grupo = aula mista.
      if (g.turmaId !== s.turmaId) {
        g.turmaId = "mista";
        g.turmaRotulo = "Aula mista";
      }
    } else
      mapa.set(s.grupoId, {
        grupoId: s.grupoId,
        turmaId: s.turmaId,
        turmaRotulo: s.turmaRotulo,
        inicio: s.inicio,
        fim: s.fim,
        pausadoEm: s.pausadoEm,
        motivoParada: s.motivoParada,
        alunos: [
          { id: s.alunoId, nome: s.alunoNome, turmaId: s.turmaId, turmaRotulo: s.turmaRotulo },
        ],
      });
  }
  return [...mapa.values()].sort((a, b) => a.inicio.localeCompare(b.inicio));
}

export interface UsoAluno {
  /** Dias diferentes em que o aluno foi ao laboratório nesta semana. */
  semana: number;
  /** Dias diferentes em que foi neste mês. */
  mes: number;
  /** Já tem marcação hoje (agendada, ao vivo ou encerrada). */
  hoje: boolean;
}

/** Conta as idas do aluno por dia: dois grupos no mesmo dia contam uma ida. */
export function usoDoAluno(sessoes: SessaoLab[], alunoId: string, hoje: string): UsoAluno {
  const s0 = inicioDaSemana(hoje);
  const s1 = fimDaSemana(hoje);
  const m0 = inicioDoMes(hoje);
  const dias = new Set(sessoes.filter((s) => s.alunoId === alunoId).map((s) => s.data));
  let semana = 0;
  let mes = 0;
  for (const d of dias) {
    if (d >= s0 && d <= s1) semana++;
    if (d.slice(0, 7) === m0.slice(0, 7)) mes++;
  }
  return { semana, mes, hoje: dias.has(hoje) };
}

/** Nome como aparece na tela: o painel logado vê inteiro; o público, conforme a escolha da escola. */
export function nomeExibido(nome: string, logado: boolean): string {
  if (logado || NOMES_NA_HOME === "completo") return nome;
  const partes = nome
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/);
  if (NOMES_NA_HOME === "oculto") return "Aluno(a)";
  const primeiro = partes[0] ?? nome;
  const ultimo = partes.length > 1 ? partes[partes.length - 1]! : "";
  return ultimo ? `${primeiro} ${ultimo.charAt(0).toUpperCase()}.` : primeiro;
}

/* ───────────────────────── banco ───────────────────────── */

export const TABELA_AUSENTE = "tabela-ausente";

function eTabelaAusente(erro: { code?: string; message?: string }): boolean {
  return (
    erro.code === "42P01" ||
    erro.code === "PGRST205" ||
    (erro.message ?? "").includes("laboratorio_sessoes")
  );
}

const PAGINA = 1000;

export async function carregarSessoes(desde: string): Promise<SessaoLab[]> {
  const todas: SessaoLab[] = [];
  for (let inicio = 0; ; inicio += PAGINA) {
    const { data, error } = await supabase
      .from("laboratorio_sessoes")
      .select("*")
      .gte("data", desde)
      .order("inicio")
      .order("id")
      .range(inicio, inicio + PAGINA - 1);
    if (error) throw new Error(eTabelaAusente(error) ? TABELA_AUSENTE : error.message);
    todas.push(...((data ?? []) as Linha[]).map(deLinha));
    if (!data || data.length < PAGINA) break;
  }
  return todas;
}

/** Todas as marcações de um mês ("YYYY-MM"), para a coordenação. */
export async function carregarSessoesDoMes(mes: string): Promise<SessaoLab[]> {
  const [y, m] = mes.split("-").map(Number);
  const ultimo = new Date(y!, m!, 0).getDate();
  const todas: SessaoLab[] = [];
  for (let inicio = 0; ; inicio += PAGINA) {
    const { data, error } = await supabase
      .from("laboratorio_sessoes")
      .select("*")
      .gte("data", `${mes}-01`)
      .lte("data", `${mes}-${String(ultimo).padStart(2, "0")}`)
      .order("inicio")
      .order("id")
      .range(inicio, inicio + PAGINA - 1);
    if (error) throw new Error(eTabelaAusente(error) ? TABELA_AUSENTE : error.message);
    todas.push(...((data ?? []) as Linha[]).map(deLinha));
    if (!data || data.length < PAGINA) break;
  }
  return todas;
}

/** Todas as idas de um aluno ao laboratório, da mais recente para a mais antiga. */
export async function carregarHistoricoAluno(alunoId: string): Promise<SessaoLab[]> {
  const { data, error } = await supabase
    .from("laboratorio_sessoes")
    .select("*")
    .eq("aluno_id", alunoId)
    .order("inicio", { ascending: false })
    .limit(1000);
  if (error) throw new Error(eTabelaAusente(error) ? TABELA_AUSENTE : error.message);
  return ((data ?? []) as Linha[]).map(deLinha);
}

export interface PresencaAntiga {
  id: string;
  data: string;
  status: "presente" | "faltou" | "substituido";
  motivo: string | null;
  turmaId: string;
}

/** Frequência do sistema anterior (tabela `presencas`), da mais recente para a mais antiga. */
export async function carregarPresencasAluno(alunoId: string): Promise<PresencaAntiga[]> {
  const { data, error } = await supabase
    .from("presencas")
    .select("id, data, status, motivo, turma_id")
    .eq("aluno_id", alunoId)
    .order("data", { ascending: false });
  if (error) throw new Error(error.message);
  return (
    (data ?? []) as {
      id: string;
      data: string;
      status: PresencaAntiga["status"];
      motivo: string | null;
      turma_id: string;
    }[]
  ).map((p) => ({
    id: p.id,
    data: p.data,
    status: p.status,
    motivo: p.motivo,
    turmaId: p.turma_id,
  }));
}

/** Cada aluno leva a própria turma: numa aula mista os grupos misturam turmas. */
export async function marcarGrupo(entrada: {
  alunos: { id: string; nome: string; turma: { id: string; rotulo: string } }[];
  inicio: Date;
  fim: Date;
  criadoPor: string | null;
}): Promise<void> {
  if (entrada.alunos.length === 0)
    throw new Error("Escolha pelo menos um aluno para mandar ao laboratório.");
  if (entrada.fim <= entrada.inicio)
    throw new Error("O horário de fim tem que vir depois do início.");
  const grupoId = crypto.randomUUID();
  const linhas = entrada.alunos.map((a) => ({
    data: dataNaEscola(entrada.inicio),
    grupo_id: grupoId,
    turma_id: a.turma.id,
    turma_rotulo: a.turma.rotulo,
    aluno_id: a.id,
    aluno_nome: a.nome,
    inicio: entrada.inicio.toISOString(),
    fim: entrada.fim.toISOString(),
    criado_por: entrada.criadoPor,
  }));
  const { error } = await supabase.from("laboratorio_sessoes").insert(linhas);
  if (error) throw new Error(eTabelaAusente(error) ? TABELA_AUSENTE : error.message);
}

const COLUNA_AUSENTE =
  "Falta rodar o SQL novo do laboratório no Supabase (arquivo supabase/laboratorio.sql).";

function erroDeColuna(erro: { message?: string; code?: string }): Error {
  const m = erro.message ?? "";
  return new Error(
    /pausado_em|pausa_segundos|motivo_parada/.test(m) || erro.code === "42703"
      ? COLUNA_AUSENTE
      : m || "Não foi possível concluir.",
  );
}

/** Congela a contagem do grupo no instante do clique. */
export async function pausarGrupo(grupoId: string): Promise<void> {
  const { error } = await supabase
    .from("laboratorio_sessoes")
    .update({ pausado_em: new Date().toISOString() })
    .eq("grupo_id", grupoId)
    .is("pausado_em", null);
  if (error) throw erroDeColuna(error);
}

/** Retoma: o fim anda para frente pelo tempo parado, e a contagem segue de onde estava. */
export async function retomarGrupo(grupoId: string): Promise<void> {
  const lidas = await supabase
    .from("laboratorio_sessoes")
    .select("id, fim, pausado_em, pausa_segundos")
    .eq("grupo_id", grupoId)
    .not("pausado_em", "is", null);
  if (lidas.error) throw erroDeColuna(lidas.error);
  const agora = Date.now();
  for (const l of (lidas.data ?? []) as {
    id: string;
    fim: string;
    pausado_em: string;
    pausa_segundos: number | null;
  }[]) {
    const parado = Math.max(0, agora - new Date(l.pausado_em).getTime());
    const { error } = await supabase
      .from("laboratorio_sessoes")
      .update({
        fim: new Date(new Date(l.fim).getTime() + parado).toISOString(),
        pausado_em: null,
        pausa_segundos: (l.pausa_segundos ?? 0) + Math.round(parado / 1000),
      })
      .eq("id", l.id);
    if (error) throw erroDeColuna(error);
  }
}

/** Encerra o grupo agora: quem já começou termina neste instante; quem ainda não começou é desmarcado. */
export async function encerrarGrupo(grupoId: string, motivo?: string): Promise<void> {
  const agora = new Date().toISOString();
  if (motivo) {
    // Grupo pausado: a aula termina no instante congelado, não agora.
    const pausados = await supabase
      .from("laboratorio_sessoes")
      .select("id, pausado_em")
      .eq("grupo_id", grupoId)
      .not("pausado_em", "is", null);
    if (pausados.error) throw erroDeColuna(pausados.error);
    for (const l of (pausados.data ?? []) as { id: string; pausado_em: string }[]) {
      const r = await supabase
        .from("laboratorio_sessoes")
        .update({ fim: l.pausado_em, pausado_em: null, motivo_parada: motivo.trim() })
        .eq("id", l.id);
      if (r.error) throw erroDeColuna(r.error);
    }
  }
  const a = await supabase
    .from("laboratorio_sessoes")
    .update(
      motivo ? { fim: agora, pausado_em: null, motivo_parada: motivo.trim() } : { fim: agora },
    )
    .eq("grupo_id", grupoId)
    .lte("inicio", agora)
    .gt("fim", agora);
  if (a.error) throw erroDeColuna(a.error);
  const b = await supabase
    .from("laboratorio_sessoes")
    .delete()
    .eq("grupo_id", grupoId)
    .gt("inicio", agora);
  if (b.error) throw new Error(b.error.message);
}

/** Remove a marcação inteira (erro de marcação): some do painel e deixa de contar. */
export async function removerGrupo(grupoId: string): Promise<void> {
  const { error } = await supabase.from("laboratorio_sessoes").delete().eq("grupo_id", grupoId);
  if (error) throw new Error(error.message);
}

/** Tira só um aluno de um grupo. */
export async function removerAlunoDoGrupo(sessaoId: string): Promise<void> {
  const { error } = await supabase.from("laboratorio_sessoes").delete().eq("id", sessaoId);
  if (error) throw new Error(error.message);
}

/* ───────────────────────── hooks ───────────────────────── */

/** Relógio que bate a cada `ms`, para a contagem regressiva andar sozinha. */
export function useAgora(ms = 1000): number {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setAgora(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return agora;
}

const RELER_A_CADA_MS = 15_000;

/**
 * Sessões da semana e do mês, relidas a cada 15 s e quando a aba volta ao
 * foco. `erro` vale `TABELA_AUSENTE` até o script SQL ser rodado no Supabase.
 */
export function useSessoesLab() {
  const [sessoes, setSessoes] = useState<SessaoLab[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    try {
      setSessoes(await carregarSessoes(buscarDesde(hojeNaEscola())));
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar o laboratório.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void recarregar();
    const id = window.setInterval(() => void recarregar(), RELER_A_CADA_MS);
    const aoVoltar = () => {
      if (document.visibilityState === "visible") void recarregar();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [recarregar]);

  return { sessoes, erro, carregando, recarregar };
}

/* ───────────────────────── situação de cada aluno ───────────────────────── */

export interface SituacaoAluno {
  /** Ainda não foi ao laboratório neste mês. */
  nunca: boolean;
  /** Já foi em outro dia desta semana (a marcação de hoje não conta). */
  naSemana: boolean;
  /** Foi mais vezes no mês do que a maioria dos colegas. */
  acima: boolean;
  semana: number;
  mes: number;
  hoje: boolean;
}

/** Média de idas no mês (dias distintos por aluno) entre todos os alunos cadastrados. */
export function mediaIdasNoMes(sessoes: SessaoLab[], totalAlunos: number, hoje: string): number {
  if (totalAlunos === 0) return 0;
  const mes = hoje.slice(0, 7);
  const pares = new Set(
    sessoes.filter((s) => s.data.slice(0, 7) === mes).map((s) => `${s.alunoId}|${s.data}`),
  );
  return pares.size / totalAlunos;
}

/** "Acima": pelo menos 2 idas e mais que a média arredondada para cima. */
export function situacaoDoAluno(
  sessoes: SessaoLab[],
  alunoId: string,
  hoje: string,
  media: number,
): SituacaoAluno {
  const uso = usoDoAluno(sessoes, alunoId, hoje);
  const semana = uso.semana - (uso.hoje ? 1 : 0);
  return {
    nunca: uso.mes === 0,
    naSemana: semana >= 1,
    acima: uso.mes >= Math.max(2, Math.ceil(media) + 1),
    semana,
    mes: uso.mes - (uso.hoje ? 1 : 0),
    hoje: uso.hoje,
  };
}
