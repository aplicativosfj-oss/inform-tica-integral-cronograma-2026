import {
  Ban,
  CalendarDays,
  CheckCircle2,
  CalendarOff,
  ClipboardList,
  Flag,
  GraduationCap,
  Hand,
  Loader2,
  Lock,
  LogOut,
  MonitorSmartphone,
  NotebookPen,
  ShieldAlert,
  Trash2,
  UserX,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import { useAppStore } from "@/lib/app-store";
import {
  ROTULO_AUSENCIA,
  carregarHistoricoAluno,
  carregarOcorrenciasAluno,
  desfazerAusencia,
  foiAoLab,
  hojeNaEscola,
  horaNaEscola,
  inicioDaSemana,
  marcarAusencia,
  nomeExibido,
  removerAlunoDoGrupo,
  type GrupoLab,
  type SessaoLab,
  type TipoAusencia,
} from "@/lib/laboratorio";
import { ROTULO_MARCA, TIPOS_MARCA } from "@/lib/marcas-aluno";
import { idadeEmAnos } from "@/lib/profissional-acesso";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";
import { supabase } from "@/lib/supabase-client";
import { cn } from "@/lib/utils";

type AlunoDoGrupo = GrupoLab["alunos"][number];

interface Nota {
  id: string;
  tipo: string;
  descricao: string;
  criado_em: string;
}

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex"];

const TIPOS_NOTA: { id: string; rotulo: string; ajuda: string; cor: string }[] = [
  {
    id: "observacao",
    rotulo: "Observação pedagógica",
    ajuda: "Como o aluno trabalhou na aula",
    cor: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  },
  {
    id: "elogio",
    rotulo: "Comportamento positivo",
    ajuda: "Algo que merece ser registrado",
    cor: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  {
    id: "comportamento",
    rotulo: "Comportamento inadequado",
    ajuda: "Fato ocorrido durante a aula",
    cor: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
];

const ROTULO_TIPO_NOTA: Record<string, string> = {
  observacao: "Observação",
  elogio: "Comportamento positivo",
  comportamento: "Comportamento inadequado",
  impedimento: "Impedimento",
};

function somarDias(chave: string, n: number) {
  const [y, m, d] = chave.split("-").map(Number);
  const data = new Date(Date.UTC(y!, m! - 1, d!));
  data.setUTCDate(data.getUTCDate() + n);
  return data.toISOString().slice(0, 10);
}

const dataCurta = (k: string) => `${k.slice(8, 10)}/${k.slice(5, 7)}`;
const mesCurto = (k: string) =>
  new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" })
    .format(new Date(`${k}-01T12:00:00Z`))
    .replace(".", "");

function iniciaisDe(nome: string) {
  return nome
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .filter((_, i, l) => i === 0 || i === l.length - 1)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

type Aba = "resumo" | "relatorio" | "anotacoes" | "acoes";

/**
 * Tela do aluno durante a aula.
 *
 * Abre ao tocar no cartão de um aluno — na bancada da tela cheia, no palco da
 * aula ao vivo ou no cartão da página inicial — e é a mesma tela nos três
 * lugares, para o professor não precisar aprender dois caminhos.
 *
 * Quem não está conectado vê só o que já é público: primeiro nome, turma e
 * quantas vezes foi ao laboratório. **Nada se edita sem login**: anotações,
 * impedimento, falta e o cancelamento da aula do aluno só existem para quem
 * entrou com a conta da escola — e, mesmo que alguém force a interface, o
 * banco recusa a escrita de visitante.
 */
export function PainelAlunoAula({
  aluno,
  historico = [],
  logado,
  estacao,
  aoFechar,
  aoMudar,
}: {
  aluno: AlunoDoGrupo;
  /** Sessões já carregadas pela página, para o resumo aparecer na hora. */
  historico?: SessaoLab[];
  logado: boolean;
  /** Número da estação na bancada, quando a tela de origem sabe qual é. */
  estacao?: number;
  aoFechar: () => void;
  aoMudar?: (() => void) | undefined;
}) {
  const { turmas, config } = useAppStore();
  const [aba, setAba] = useState<Aba>("resumo");
  const [registros, setRegistros] = useState<SessaoLab[] | null>(null);
  const [notas, setNotas] = useState<Nota[] | null>(null);
  const [erroNotas, setErroNotas] = useState<string | null>(null);

  /** Lembrete mais recente deste aluno (saiu antes, comportamento, impedimento). */
  const lembrete = useMemo(() => {
    const doTipo = (notas ?? []).filter((n) => (TIPOS_MARCA as readonly string[]).includes(n.tipo));
    const ultima = doTipo[0];
    return ultima ? { n: doTipo.length, tipo: ultima.tipo, descricao: ultima.descricao } : null;
  }, [notas]);

  const turma = turmas.find((t) => t.id === aluno.turmaId);
  const cadastro = turma?.alunos.find((a) => a.id === aluno.id);
  const cor = serieClasses(serieIndexPorNumero(aluno.turmaRotulo));
  const idade = logado ? idadeEmAnos(cadastro?.nascimento) : null;
  const foto = logado ? cadastro?.foto : undefined;

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        aoFechar();
      }
    };
    window.addEventListener("keydown", tecla, true);
    return () => window.removeEventListener("keydown", tecla, true);
  }, [aoFechar]);

  /** Ficha completa do aluno: idas e ausências de todo o período guardado. */
  useEffect(() => {
    let vivo = true;
    void (async () => {
      const [idas, ausencias] = await Promise.allSettled([
        carregarHistoricoAluno(aluno.id),
        carregarOcorrenciasAluno(aluno.turmaId, aluno.id),
      ]);
      if (!vivo) return;
      const lista = [
        ...(idas.status === "fulfilled"
          ? idas.value.filter((s) => s.turmaId === aluno.turmaId)
          : []),
        ...(ausencias.status === "fulfilled" ? ausencias.value : []),
      ].filter((s) => !s.semMarcacao || !foiAoLab(s));
      setRegistros(
        lista.sort((a, b) => b.data.localeCompare(a.data) || b.inicio.localeCompare(a.inicio)),
      );
    })();
    return () => {
      vivo = false;
    };
  }, [aluno.id, aluno.turmaId]);

  const recarregarNotas = useMemo(
    () => async () => {
      const { data, error } = await supabase
        .from("anotacoes_aluno_laboratorio")
        .select("id,tipo,descricao,criado_em")
        .eq("aluno_id", aluno.id)
        .eq("turma_id", aluno.turmaId)
        .order("criado_em", { ascending: false })
        .limit(100);
      if (error) {
        // Tabela que ainda não existe e falta de permissão dão erros bem
        // diferentes — e a saída para cada um também é.
        const faltaTabela =
          error.code === "42P01" || /does not exist|schema cache/i.test(error.message ?? "");
        setErroNotas(
          faltaTabela
            ? "As anotações ainda não estão ligadas ao banco. Rode supabase/anotacoes-aluno-laboratorio.sql no Supabase."
            : `Não foi possível carregar as anotações: ${error.message}`,
        );
        setNotas([]);
        return;
      }
      setErroNotas(null);
      setNotas((data ?? []) as Nota[]);
    },
    [aluno.id, aluno.turmaId],
  );

  useEffect(() => {
    if (!logado) return;
    void recarregarNotas();
  }, [logado, recarregarNotas]);

  /** Base do resumo: o que a página já tinha em mãos até a ficha chegar. */
  const base =
    registros ?? historico.filter((s) => s.turmaId === aluno.turmaId && s.alunoId === aluno.id);

  const resumo = useMemo(() => {
    const hoje = hojeNaEscola();
    const segunda = inicioDaSemana(hoje);
    const mes = hoje.slice(0, 7);
    const doAluno = base.filter((s) => s.turmaId === aluno.turmaId && s.alunoId === aluno.id);
    const idas = doAluno.filter(foiAoLab);
    const diasComIda = new Set(idas.map((s) => s.data));
    const doMes = doAluno.filter((s) => s.data.startsWith(mes));
    return {
      semana: new Set(idas.filter((s) => s.data >= segunda).map((s) => s.data)).size,
      mes: new Set(idas.filter((s) => s.data.startsWith(mes)).map((s) => s.data)).size,
      total: diasComIda.size,
      ultima: idas
        .map((s) => s.data)
        .filter((d) => d < hoje)
        .sort()
        .at(-1),
      faltas: doMes.filter((s) => s.ausencia === "faltou").length,
      impedido: doMes.filter((s) => s.ausencia === "nao_autorizado").length,
      recusou: doMes.filter((s) => s.ausencia === "recusou").length,
      semanaDias: DIAS.map((nome, i) => {
        const chave = somarDias(segunda, i);
        return { nome, chave, foi: diasComIda.has(chave), futuro: chave > hoje };
      }),
      porMes: (() => {
        const mapa = new Map<string, number>();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(`${hoje}T12:00:00Z`);
          d.setUTCMonth(d.getUTCMonth() - i);
          mapa.set(d.toISOString().slice(0, 7), 0);
        }
        for (const dia of diasComIda) {
          const m = dia.slice(0, 7);
          if (mapa.has(m)) mapa.set(m, (mapa.get(m) ?? 0) + 1);
        }
        return [...mapa.entries()].map(([m, n]) => ({ mes: m, n }));
      })(),
    };
  }, [base, aluno.id, aluno.turmaId]);

  const abas: { id: Aba; rotulo: string; Icone: LucideIcon }[] = [
    { id: "resumo", rotulo: "Resumo", Icone: MonitorSmartphone },
    { id: "relatorio", rotulo: "Relatório", Icone: ClipboardList },
    ...(logado
      ? ([
          { id: "anotacoes", rotulo: "Anotações", Icone: NotebookPen },
          { id: "acoes", rotulo: "Ações da aula", Icone: ShieldAlert },
        ] as const)
      : []),
  ];

  const conteudo = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Ficha de ${nomeExibido(aluno.nome, logado)}`}
      className="fixed inset-0 z-[10001] flex flex-col bg-[#070c1c] text-white"
    >
      <header className="shrink-0 border-b border-white/10 bg-white/[0.03] px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-3 sm:gap-4">
          <span
            className={cn(
              "flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-lg font-extrabold ring-2 ring-white/25 sm:size-16 sm:text-xl",
              cor.bg,
              cor.text,
            )}
          >
            {foto ? (
              <img src={foto} alt="" className="size-full object-cover" />
            ) : (
              iniciaisDe(aluno.nome)
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
              Ficha do aluno · Laboratório
            </p>
            <h2 className="truncate font-heading text-xl font-extrabold leading-tight sm:text-2xl">
              {nomeExibido(aluno.nome, logado)}
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
              <span className={cn("rounded-md px-2 py-0.5 font-extrabold", cor.bg, cor.text)}>
                {aluno.turmaRotulo}
              </span>
              {idade !== null ? (
                <span className="rounded-md bg-white/10 px-2 py-0.5 font-semibold">
                  {idade} anos
                </span>
              ) : null}
              {estacao ? (
                <span className="rounded-md bg-white/10 px-2 py-0.5 font-semibold">
                  estação {estacao}
                </span>
              ) : null}
              {aluno.ausencia ? (
                <span className="rounded-md bg-amber-500/25 px-2 py-0.5 font-bold text-amber-200">
                  {ROTULO_AUSENCIA[aluno.ausencia]}
                </span>
              ) : null}
              {/* O lembrete acompanha o aluno em todas as abas: é o que o
                  professor precisa ter em mente antes de decidir qualquer
                  coisa sobre a aula de hoje. */}
              {lembrete ? (
                <span
                  className="flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 font-bold text-amber-200"
                  title={lembrete.descricao}
                >
                  <Flag className="size-3" aria-hidden />
                  {ROTULO_MARCA[lembrete.tipo] ?? lembrete.tipo}
                  {lembrete.n > 1 ? ` ${lembrete.n}×` : ""}
                </span>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar a ficha"
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 transition hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-4 sm:px-6 sm:py-6 md:grid-cols-[13rem_minmax(0,1fr)]">
          {/* Navegação: coluna no computador, faixa de botões no celular. */}
          <nav
            aria-label="Seções da ficha"
            className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-1 md:content-start"
          >
            {abas.map(({ id, rotulo, Icone }) => (
              <button
                key={id}
                type="button"
                aria-current={aba === id}
                onClick={() => setAba(id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-bold transition",
                  aba === id
                    ? "border-white/25 bg-white/15"
                    : "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/10",
                )}
              >
                <Icone className="size-4 shrink-0" aria-hidden />
                <span className="min-w-0 truncate">{rotulo}</span>
              </button>
            ))}
            {!logado ? (
              <p className="col-span-2 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-[11px] leading-snug text-white/60 sm:col-span-4 md:col-span-1">
                <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                Anotações, impedimento e cancelamento da aula só aparecem para a equipe conectada.
              </p>
            ) : null}
          </nav>

          <div className="min-w-0">
            {aba === "resumo" ? (
              <Resumo resumo={resumo} logado={logado} turma={turma} config={config} />
            ) : null}
            {aba === "relatorio" ? (
              <Relatorio registros={registros} resumo={resumo} logado={logado} />
            ) : null}
            {aba === "anotacoes" && logado ? (
              <Anotacoes aluno={aluno} notas={notas} erro={erroNotas} aoSalvar={recarregarNotas} />
            ) : null}
            {aba === "acoes" && logado ? (
              <Acoes
                aluno={aluno}
                aoMudar={() => {
                  aoMudar?.();
                  void recarregarNotas();
                }}
                aoFechar={aoFechar}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document === "undefined" ? null : createPortal(conteudo, document.body);
}

/** O que o resumo calcula uma vez e as seções abaixo só exibem. */
interface Resumido {
  semana: number;
  mes: number;
  total: number;
  ultima: string | undefined;
  faltas: number;
  impedido: number;
  recusou: number;
  semanaDias: { nome: string; chave: string; foi: boolean; futuro: boolean }[];
  porMes: { mes: string; n: number }[];
}

function Caixa({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={cn("rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5", className)}
    >
      {children}
    </section>
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
      {children}
    </h3>
  );
}

function Resumo({
  resumo,
  logado,
  turma,
  config,
}: {
  resumo: Resumido;
  logado: boolean;
  turma: { professorRegente?: string } | undefined;
  config: { professorInformatica?: string };
}) {
  return (
    <div className="space-y-4">
      <Caixa>
        <Titulo>Idas ao laboratório</Titulo>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Numero valor={resumo.semana} rotulo="nesta semana" cor="text-emerald-300" />
          <Numero valor={resumo.mes} rotulo="neste mês" cor="text-sky-300" />
          <Numero valor={resumo.total} rotulo="no total" cor="text-violet-300" />
          <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
            <p className="font-heading text-xl font-extrabold tabular-nums text-amber-300">
              {resumo.ultima ? dataCurta(resumo.ultima) : "—"}
            </p>
            <p className="mt-0.5 text-xs leading-tight text-white/60">última ida antes de hoje</p>
          </div>
        </div>
        <ul className="mt-3 grid grid-cols-5 gap-1.5" aria-label="Semana no laboratório">
          {resumo.semanaDias.map((d) => (
            <li
              key={d.chave}
              className={cn(
                "flex flex-col items-center rounded-xl border py-1.5 text-[11px] font-semibold",
                d.foi
                  ? "border-emerald-300/60 bg-emerald-400/25 text-emerald-100"
                  : d.futuro
                    ? "border-dashed border-white/15 text-white/40"
                    : "border-white/10 bg-white/5 text-white/60",
              )}
            >
              {d.nome}
              <span className="text-[10px] font-normal">{d.foi ? "foi" : d.futuro ? "" : "—"}</span>
            </li>
          ))}
        </ul>
      </Caixa>

      {logado ? (
        <Caixa>
          <Titulo>No mês</Titulo>
          <div className="grid grid-cols-3 gap-2.5">
            <Numero valor={resumo.faltas} rotulo="faltas" cor="text-red-300" Icone={UserX} />
            <Numero
              valor={resumo.impedido}
              rotulo="impedimentos"
              cor="text-amber-300"
              Icone={Ban}
            />
            <Numero
              valor={resumo.recusou}
              rotulo="não quis ir"
              cor="text-violet-300"
              Icone={Hand}
            />
          </div>
        </Caixa>
      ) : null}

      {turma?.professorRegente || config.professorInformatica ? (
        <Caixa>
          <Titulo>Quem acompanha</Titulo>
          <dl className="space-y-1.5 text-sm">
            {turma?.professorRegente ? (
              <div className="flex items-center gap-2 text-white/85">
                <GraduationCap className="size-4 shrink-0 text-amber-300" aria-hidden />
                <dt className="sr-only">Professor(a) regente</dt>
                <dd>Regente: {turma.professorRegente}</dd>
              </div>
            ) : null}
            {config.professorInformatica ? (
              <div className="flex items-center gap-2 text-white/85">
                <MonitorSmartphone className="size-4 shrink-0 text-emerald-300" aria-hidden />
                <dt className="sr-only">Professor de informática</dt>
                <dd>Informática: Prof. {config.professorInformatica}</dd>
              </div>
            ) : null}
          </dl>
        </Caixa>
      ) : null}
    </div>
  );
}

function Numero({
  valor,
  rotulo,
  cor,
  Icone,
}: {
  valor: number;
  rotulo: string;
  cor: string;
  Icone?: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
      {Icone ? <Icone className={cn("mb-1 size-4", cor)} aria-hidden /> : null}
      <p className={cn("font-heading text-2xl font-extrabold tabular-nums", cor)}>{valor}</p>
      <p className="mt-0.5 text-xs leading-tight text-white/60">{rotulo}</p>
    </div>
  );
}

/** Situação de um registro, com a cor que já é usada no resto do sistema. */
function Situacao({ s }: { s: SessaoLab }) {
  if (foiAoLab(s))
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-200">
        <CheckCircle2 className="size-3" aria-hidden /> Participou
      </span>
    );
  const estilo: Record<TipoAusencia, string> = {
    faltou: "bg-red-500/20 text-red-200",
    nao_autorizado: "bg-amber-500/20 text-amber-200",
    recusou: "bg-violet-500/20 text-violet-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold",
        estilo[s.ausencia!],
      )}
    >
      {ROTULO_AUSENCIA[s.ausencia!]}
    </span>
  );
}

function Relatorio({
  registros,
  resumo,
  logado,
}: {
  registros: SessaoLab[] | null;
  resumo: Resumido;
  logado: boolean;
}) {
  const maior = Math.max(1, ...resumo.porMes.map((m) => m.n));
  return (
    <div className="space-y-4">
      <Caixa>
        <Titulo>Idas por mês (últimos 6 meses)</Titulo>
        <div className="flex items-end gap-2">
          {resumo.porMes.map(({ mes, n }) => (
            <div key={mes} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <span className="text-xs font-bold tabular-nums text-white/80">{n}</span>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-sky-500/50 to-emerald-400/80 transition-[height] duration-500"
                style={{ height: Math.max(4, Math.round((n / maior) * 96)) }}
              />
              <span className="truncate text-[10px] uppercase text-white/45">{mesCurto(mes)}</span>
            </div>
          ))}
        </div>
      </Caixa>

      <Caixa>
        <Titulo>Registros do laboratório</Titulo>
        {registros === null ? (
          <p className="flex items-center gap-2 py-6 text-sm text-white/60">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Carregando a ficha…
          </p>
        ) : registros.length === 0 ? (
          <p className="py-6 text-sm text-white/60">Nenhum registro no período guardado.</p>
        ) : (
          <ol className="divide-y divide-white/10">
            {registros.slice(0, 40).map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="w-14 shrink-0 font-bold tabular-nums text-white/80">
                  {dataCurta(s.data)}
                </span>
                <span className="w-16 shrink-0 text-xs tabular-nums text-white/45">
                  {horaNaEscola(s.inicio)}
                </span>
                <span className="min-w-0 flex-1">
                  <Situacao s={s} />
                  {logado && s.ausenciaMotivo ? (
                    <span className="mt-0.5 block truncate text-[11px] text-white/50">
                      {s.ausenciaMotivo}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
        )}
        {registros && registros.length > 40 ? (
          <p className="mt-3 text-[11px] text-white/45">
            Mostrando os 40 registros mais recentes de {registros.length}.
          </p>
        ) : null}
      </Caixa>
    </div>
  );
}

function Anotacoes({
  aluno,
  notas,
  erro,
  aoSalvar,
}: {
  aluno: AlunoDoGrupo;
  notas: Nota[] | null;
  erro: string | null;
  aoSalvar: () => Promise<void>;
}) {
  const [tipo, setTipo] = useState(TIPOS_NOTA[0]!.id);
  const [texto, setTexto] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (texto.trim().length < 10) {
      toast.error("Descreva o ocorrido com pelo menos 10 caracteres.");
      return;
    }
    setSalvando(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("É necessário entrar com uma conta da escola.");
      const { error } = await supabase.from("anotacoes_aluno_laboratorio").insert({
        aluno_id: aluno.id,
        aluno_nome: aluno.nome,
        turma_id: aluno.turmaId,
        turma_rotulo: aluno.turmaRotulo,
        sessao_id: aluno.sessaoId,
        tipo,
        descricao: texto.trim(),
        registrado_por: user.id,
      });
      if (error) throw error;
      toast.success("Anotação salva.");
      setTexto("");
      await aoSalvar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-4">
      <Caixa>
        <Titulo>Nova anotação</Titulo>
        <div className="grid gap-2 sm:grid-cols-3">
          {TIPOS_NOTA.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={tipo === t.id}
              onClick={() => setTipo(t.id)}
              className={cn(
                "rounded-xl border p-3 text-left transition",
                tipo === t.id
                  ? "border-white/35 bg-white/15"
                  : "border-white/10 bg-white/[0.04] hover:bg-white/10",
              )}
            >
              <span className="block text-sm font-bold leading-tight">{t.rotulo}</span>
              <span className="mt-0.5 block text-[11px] leading-tight text-white/55">
                {t.ajuda}
              </span>
            </button>
          ))}
        </div>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={4}
          placeholder="Descreva objetivamente o que aconteceu, sem julgamentos pessoais."
          className="mt-3 w-full rounded-xl border border-white/15 bg-black/30 p-3 text-sm outline-none placeholder:text-white/35 focus-visible:border-white/40"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-[11px] text-white/45">
            Fica no histórico do aluno, com a data e quem registrou.
          </span>
          <button
            type="button"
            disabled={salvando}
            onClick={() => void salvar()}
            className="rounded-full bg-white px-5 py-2 text-sm font-bold text-slate-900 transition hover:bg-white/90 disabled:opacity-50"
          >
            {salvando ? "Salvando…" : "Salvar anotação"}
          </button>
        </div>
      </Caixa>

      <Caixa>
        <Titulo>Histórico de anotações</Titulo>
        {erro ? (
          <p className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-100">
            {erro}
          </p>
        ) : notas === null ? (
          <p className="flex items-center gap-2 py-4 text-sm text-white/60">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Carregando…
          </p>
        ) : notas.length === 0 ? (
          <p className="py-4 text-sm text-white/60">Nenhuma anotação registrada ainda.</p>
        ) : (
          <ul className="space-y-2">
            {notas.map((n) => (
              <li key={n.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
                <p className="flex flex-wrap items-center gap-2 text-[11px] text-white/50">
                  <span className="rounded-full bg-white/10 px-2 py-0.5 font-bold text-white/80">
                    {ROTULO_TIPO_NOTA[n.tipo] ?? n.tipo}
                  </span>
                  {new Date(n.criado_em).toLocaleString("pt-BR", {
                    timeZone: "America/Rio_Branco",
                  })}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{n.descricao}</p>
              </li>
            ))}
          </ul>
        )}
      </Caixa>
    </div>
  );
}

/**
 * O que o professor pode fazer com a aula deste aluno enquanto ela acontece.
 * Impedir e cancelar mexem no registro do dia, então pedem justificativa e
 * uma confirmação separada — a mesma regra da saída da turma.
 */
type AcaoAula = TipoAusencia | "cancelar" | "saiu_antes" | "suspender" | "liberar";

function Acoes({
  aluno,
  aoMudar,
  aoFechar,
}: {
  aluno: AlunoDoGrupo;
  aoMudar: () => void;
  aoFechar: () => void;
}) {
  const { turmas, updateAluno } = useAppStore();
  const cadastro = turmas
    .find((t) => t.id === aluno.turmaId)
    ?.alunos.find((a) => a.id === aluno.id);
  const suspenso = Boolean(cadastro?.impedido);
  const [motivo, setMotivo] = useState("");
  const [confirmando, setConfirmando] = useState<AcaoAula | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function aplicar(acao: AcaoAula) {
    const precisaMotivo =
      acao === "nao_autorizado" ||
      acao === "cancelar" ||
      acao === "saiu_antes" ||
      acao === "suspender";
    if (precisaMotivo && motivo.trim().length < 10) {
      toast.error("Escreva a justificativa com pelo menos 10 caracteres.");
      return;
    }
    if (confirmando !== acao) {
      setConfirmando(acao);
      return;
    }
    setOcupado(true);
    try {
      if (acao === "cancelar") {
        await registrarNota(aluno, "impedimento", `Aula cancelada: ${motivo.trim()}`);
        await removerAlunoDoGrupo(aluno.sessaoId);
        toast.success("A aula deste aluno foi cancelada.");
        aoMudar();
        aoFechar();
        return;
      }
      // Saiu antes do fim: a aula dele aconteceu, então nada muda no registro
      // de hoje. O que fica é o lembrete, que reaparece na tela de escolher.
      if (acao === "saiu_antes") {
        await registrarNota(aluno, "saiu_antes", motivo.trim());
        toast.success("Lembrete guardado. O aluno aparece marcado na hora de escolher.");
        setMotivo("");
        setConfirmando(null);
        aoMudar();
        return;
      }
      // Suspender vale para as **próximas** aulas: enquanto estiver marcado, a
      // seleção do dia pula o aluno e chama o próximo da vez.
      if (acao === "suspender" || acao === "liberar") {
        const ligar = acao === "suspender";
        updateAluno(aluno.turmaId, aluno.id, {
          impedido: ligar,
          motivoImpedimento: ligar ? motivo.trim() : undefined,
        });
        if (ligar)
          await registrarNota(
            aluno,
            "impedimento",
            `Suspenso das próximas aulas: ${motivo.trim()}`,
          ).catch(() => {});
        toast.success(
          ligar
            ? "Suspenso das próximas aulas. O rodízio vai pular este aluno."
            : "Suspensão retirada. O aluno volta ao rodízio.",
        );
        setMotivo("");
        setConfirmando(null);
        aoMudar();
        return;
      }
      if (acao === "nao_autorizado")
        await registrarNota(aluno, "impedimento", motivo.trim()).catch(() => {});
      await marcarAusencia(aluno.sessaoId, acao, precisaMotivo ? motivo.trim() : null);
      toast.success(`Registrado: ${ROTULO_AUSENCIA[acao].toLowerCase()}.`);
      setMotivo("");
      setConfirmando(null);
      aoMudar();
    } catch (e) {
      toast.error(mensagemDeErro(e));
    } finally {
      setOcupado(false);
    }
  }

  async function desfazer() {
    setOcupado(true);
    try {
      await desfazerAusencia(aluno.sessaoId);
      toast.success("Marcação desfeita. O aluno volta a contar como presente.");
      aoMudar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setOcupado(false);
    }
  }

  const acoes: {
    id: AcaoAula;
    rotulo: string;
    ajuda: string;
    Icone: LucideIcon;
    perigo?: boolean;
  }[] = [
    {
      id: "saiu_antes",
      rotulo: "Saiu antes do fim",
      ajuda: "Pediu para sair e deixou o colega de fora. Vira lembrete na hora de escolher.",
      Icone: LogOut,
    },
    {
      id: suspenso ? "liberar" : "suspender",
      rotulo: suspenso ? "Liberar para as próximas aulas" : "Suspender das próximas aulas",
      ajuda: suspenso
        ? "Tira a suspensão: o aluno volta ao rodízio."
        : "O rodízio pula este aluno até você liberar. Vale para as próximas, não para hoje.",
      Icone: CalendarOff,
    },
    {
      id: "faltou",
      rotulo: "Marcar falta",
      ajuda: "Estava marcado, mas não veio ao laboratório.",
      Icone: UserX,
    },
    {
      id: "recusou",
      rotulo: "Não quis participar",
      ajuda: "Veio, mas recusou-se a usar o computador.",
      Icone: Hand,
    },
    {
      id: "nao_autorizado",
      rotulo: "Impedir o aluno hoje",
      ajuda: "Não autorizado a participar nesta aula. Exige justificativa.",
      Icone: Ban,
    },
    {
      id: "cancelar",
      rotulo: "Cancelar a aula deste aluno",
      ajuda: "Tira o aluno da aula em andamento e apaga a marcação de hoje.",
      Icone: Trash2,
      perigo: true,
    },
  ];

  return (
    <div className="space-y-4">
      {suspenso ? (
        <Caixa className="border-amber-400/40 bg-amber-500/10">
          <p className="flex items-start gap-2 text-sm">
            <CalendarOff className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden />
            <span>
              Está <b>suspenso(a) das próximas aulas</b>
              {cadastro?.motivoImpedimento ? `: ${cadastro.motivoImpedimento}` : "."} O rodízio pula
              este aluno até alguém liberar.
            </span>
          </p>
        </Caixa>
      ) : null}

      {aluno.ausencia ? (
        <Caixa className="border-amber-400/40 bg-amber-500/10">
          <p className="text-sm">
            Hoje este aluno está como <b>{ROTULO_AUSENCIA[aluno.ausencia].toLowerCase()}</b>
            {aluno.ausenciaMotivo ? `: ${aluno.ausenciaMotivo}` : "."}
          </p>
          <button
            type="button"
            disabled={ocupado}
            onClick={() => void desfazer()}
            className="mt-3 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold transition hover:bg-white/20 disabled:opacity-50"
          >
            Desfazer e contar como presente
          </button>
        </Caixa>
      ) : null}

      <Caixa>
        <Titulo>Justificativa</Titulo>
        <textarea
          value={motivo}
          onChange={(e) => {
            setMotivo(e.target.value);
            setConfirmando(null);
          }}
          rows={3}
          placeholder="Relate o fato e a providência adotada. Obrigatória para impedir ou cancelar."
          className="w-full rounded-xl border border-white/15 bg-black/30 p-3 text-sm outline-none placeholder:text-white/35 focus-visible:border-white/40"
        />
      </Caixa>

      <Caixa>
        <Titulo>O que fazer com a aula de hoje</Titulo>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {acoes.map(({ id, rotulo, ajuda, Icone, perigo }) => (
            <div
              key={id}
              className={cn(
                "rounded-2xl border p-3.5",
                perigo ? "border-red-400/40 bg-red-500/10" : "border-white/10 bg-black/25",
              )}
            >
              <p className="flex items-center gap-2 text-sm font-bold">
                <Icone className={cn("size-4", perigo && "text-red-300")} aria-hidden /> {rotulo}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-white/55">{ajuda}</p>
              {confirmando === id ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-white/85">
                    {id === "cancelar"
                      ? `${aluno.nome} sai da aula em andamento e a marcação de hoje é apagada. Confirma?`
                      : id === "saiu_antes"
                        ? `Guardar que ${aluno.nome} saiu antes do fim? Vai aparecer marcada nas próximas escolhas.`
                        : id === "suspender"
                          ? `${aluno.nome} fica fora do rodízio até você liberar. Confirma?`
                          : id === "liberar"
                            ? `${aluno.nome} volta ao rodízio. Confirma?`
                            : `Confirma registrar “${ROTULO_AUSENCIA[id as TipoAusencia]}” para ${aluno.nome}?`}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => void aplicar(id)}
                      className={cn(
                        "rounded-full px-4 py-1.5 text-xs font-bold transition disabled:opacity-50",
                        perigo
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-white text-slate-900 hover:bg-white/90",
                      )}
                    >
                      {ocupado ? "Registrando…" : "Sim, confirmar"}
                    </button>
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => setConfirmando(null)}
                      className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-bold transition hover:bg-white/10"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => void aplicar(id)}
                  className={cn(
                    "mt-3 w-full rounded-full border px-4 py-2 text-xs font-bold transition disabled:opacity-50",
                    perigo
                      ? "border-red-400/50 hover:bg-red-500/20"
                      : "border-white/20 hover:bg-white/10",
                  )}
                >
                  {rotulo}
                </button>
              )}
            </div>
          ))}
        </div>
      </Caixa>
    </div>
  );
}

/**
 * O banco recusa um tipo de anotação que ainda não conhece. Em vez do texto
 * cru do Postgres, diz qual arquivo falta rodar — o mesmo caminho que o
 * sistema já usa para o "Recusou-se".
 */
function mensagemDeErro(e: unknown): string {
  const texto = e instanceof Error ? e.message : "";
  if (/anotacoes_aluno_laboratorio_tipo_check|violates check constraint/i.test(texto))
    return "O banco ainda não aceita este tipo de lembrete. Rode supabase/marcas-aluno.sql no Supabase e tente de novo.";
  return texto || "Não foi possível concluir.";
}

/** Guarda a justificativa junto das anotações do aluno, quando a tabela existe. */
async function registrarNota(aluno: AlunoDoGrupo, tipo: string, descricao: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("É necessário entrar com uma conta da escola.");
  await supabase.from("anotacoes_aluno_laboratorio").insert({
    aluno_id: aluno.id,
    aluno_nome: aluno.nome,
    turma_id: aluno.turmaId,
    turma_rotulo: aluno.turmaRotulo,
    sessao_id: aluno.sessaoId,
    tipo,
    descricao,
    registrado_por: user.id,
  });
}
