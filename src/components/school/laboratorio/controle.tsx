import {
  AlarmClock,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Flame,
  IdCard,
  Lock,
  Play,
  Search,
  Shuffle,
  Users2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { FichaAluno, rotuloTurma } from "@/components/school/laboratorio/ficha-aluno";
import type { DadosLab } from "@/components/school/laboratorio/painel-agora";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/lib/app-store";
import { useAuth } from "@/lib/auth-store";
import {
  JANELA_HISTORICO_DIAS,
  TABELA_AUSENTE,
  estadoDaSessao,
  horaAgoraNaEscola,
  horaNaEscola,
  hojeNaEscola,
  instanteNaEscola,
  marcarGrupo,
  mediaIdasNoMes,
  situacaoDoAluno,
  somarMinutos,
} from "@/lib/laboratorio";
import { LIMITE_ALUNOS_LAB, LIMITE_IDAS_MES, LIMITE_IDAS_SEMANA } from "@/lib/recursos";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";
import { cn } from "@/lib/utils";

const DURACOES = [15, 20, 25, 30, 40, 50];
const MISTA = "mista";

interface Aviso {
  nome: string;
  semana: number;
  mes: number;
  hoje: boolean;
  acima: boolean;
}

type Filtro = "todos" | "prioridade" | "nunca" | "naoSemana" | "naSemana" | "repetiu" | "acima";

const FILTROS: { id: Filtro; rotulo: string }[] = [
  { id: "todos", rotulo: "Todos" },
  { id: "prioridade", rotulo: "Prioridade" },
  { id: "naoSemana", rotulo: "Não foram na semana" },
  { id: "naSemana", rotulo: "Já foram na semana" },
  { id: "repetiu", rotulo: "Foram 2× ou mais" },
  { id: "nunca", rotulo: "Sem ir no mês" },
  { id: "acima", rotulo: "Acima da média" },
];

const iniciais = (nome: string) => {
  const p = nome
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? (p[p.length - 1]?.[0] ?? "") : "")).toUpperCase();
};

const dataCurta = (c: string) => c.slice(5).split("-").reverse().join("/");

/**
 * Onde o professor marca quem vai ao laboratório, tudo numa janela só: à
 * esquerda as turmas e os alunos (os que estão há mais tempo sem ir vêm na
 * frente; os que já foram esta semana ficam desativados), à direita as vagas,
 * quem foi escolhido e o tempo. Cabe até 10 alunos por vez.
 */
export function ControleLaboratorio({
  dados,
  aoMarcar,
  className,
}: {
  dados: DadosLab;
  aoMarcar?: () => void;
  className?: string;
}) {
  const { turmas } = useAppStore();
  const { email } = useAuth();
  const [turmaSel, setTurmaSel] = useState<string | null>(null);
  const [escolhidos, setEscolhidos] = useState<Set<string>>(new Set());
  const [modo, setModo] = useState<"duracao" | "horario">("duracao");
  const [minutos, setMinutos] = useState(30);
  const [inicioManual, setInicioManual] = useState(horaAgoraNaEscola());
  const [fimManual, setFimManual] = useState("");
  const [aposAtual, setAposAtual] = useState(false);
  const [avisos, setAvisos] = useState<Aviso[] | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [ordem, setOrdem] = useState<"prioridade" | "az">("prioridade");
  const [liberar, setLiberar] = useState(false);
  const [ficha, setFicha] = useState<{ turmaId: string; alunoId: string } | null>(null);

  const hoje = hojeNaEscola();
  const agora = Date.now();
  const mista = turmaSel === MISTA;
  /** Na aula mista, a turma que se está folheando; fora dela, a turma escolhida (a 1ª por padrão). */
  const [navMista, setNavMista] = useState<string | null>(null);
  const idAtual = mista ? (navMista ?? turmas[0]?.id ?? null) : (turmaSel ?? turmas[0]?.id ?? null);
  const turma = turmas.find((t) => t.id === idAtual) ?? null;

  const totalAlunos = useMemo(() => turmas.reduce((n, t) => n + t.alunos.length, 0), [turmas]);
  const media = useMemo(
    () => mediaIdasNoMes(dados.sessoes, totalAlunos, hoje),
    [dados.sessoes, totalAlunos, hoje],
  );
  const situacoes = useMemo(
    () =>
      new Map(
        turmas.flatMap((t) =>
          t.alunos.map((a) => [a.id, situacaoDoAluno(dados.sessoes, a.id, hoje, media)] as const),
        ),
      ),
    [turmas, dados.sessoes, hoje, media],
  );

  /** Quem aparece: a turma atual ou, se há busca na aula mista, alunos de qualquer turma. */
  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const fonte = mista && termo ? turmas : turma ? [turma] : [];
    return fonte
      .flatMap((t) => t.alunos.map((a) => ({ a, t })))
      .filter(({ a }) => !termo || a.nome.toLowerCase().includes(termo));
  }, [mista, turma, turmas, busca]);

  const selecionados = useMemo(
    () =>
      turmas.flatMap((t) => t.alunos.filter((a) => escolhidos.has(a.id)).map((a) => ({ a, t }))),
    [turmas, escolhidos],
  );

  const noLabAgora = useMemo(
    () =>
      new Set(
        dados.sessoes
          .filter((s) => s.data === hoje && estadoDaSessao(s, agora) !== "encerrada")
          .map((s) => s.alunoId),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dados.sessoes, hoje],
  );

  const contagem = useMemo(() => {
    const c: Record<Filtro, number> = {
      todos: lista.length,
      prioridade: 0,
      nunca: 0,
      naoSemana: 0,
      naSemana: 0,
      repetiu: 0,
      acima: 0,
    };
    for (const { a } of lista) {
      const x = situacoes.get(a.id)!;
      if (x.prioridade) c.prioridade++;
      if (x.nunca) c.nunca++;
      if (x.naSemana) c.naSemana++;
      else c.naoSemana++;
      if (x.repetiuSemana) c.repetiu++;
      if (x.acima) c.acima++;
    }
    return c;
  }, [lista, situacoes]);

  /** Pontuação de fila: quanto maior, mais na frente. Quem já foi na semana afunda. */
  const pontos = (id: string) => {
    const x = situacoes.get(id)!;
    let p = x.diasSemIr === null ? JANELA_HISTORICO_DIAS + 100 : x.diasSemIr;
    if (x.naSemana || x.hoje) p -= 1000;
    if (x.repetiuSemana) p -= 500;
    if (x.acima) p -= 50;
    return p;
  };

  const visiveis = useMemo(() => {
    const ok = lista.filter(({ a }) => {
      const x = situacoes.get(a.id)!;
      return (
        filtro === "todos" ||
        (filtro === "prioridade" && x.prioridade) ||
        (filtro === "nunca" && x.nunca) ||
        (filtro === "naSemana" && x.naSemana) ||
        (filtro === "naoSemana" && !x.naSemana) ||
        (filtro === "repetiu" && x.repetiuSemana) ||
        (filtro === "acima" && x.acima)
      );
    });
    return [...ok].sort((p, q) =>
      ordem === "az"
        ? p.a.nome.localeCompare(q.a.nome, "pt-BR")
        : pontos(q.a.id) - pontos(p.a.id) || p.a.nome.localeCompare(q.a.nome, "pt-BR"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista, situacoes, filtro, ordem]);

  /** Posição na fila de prioridade (1, 2, 3…) para quem está na frente. */
  const posicaoFila = useMemo(() => {
    const m = new Map<string, number>();
    let n = 0;
    for (const { a } of [...lista].sort((p, q) => pontos(q.a.id) - pontos(p.a.id))) {
      if (situacoes.get(a.id)!.prioridade) m.set(a.id, ++n);
    }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista, situacoes]);

  const fimDoGrupoAtual = useMemo(() => {
    const fins = dados.sessoes
      .filter((s) => s.data === hoje && estadoDaSessao(s, agora) !== "encerrada")
      .map((s) => new Date(s.fim).getTime());
    return fins.length ? new Date(Math.max(...fins)) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados.sessoes, hoje]);

  /** Início e fim que serão gravados, conforme o modo escolhido. */
  function calcularJanela(): { inicio: Date; fim: Date } | string {
    if (modo === "horario") {
      if (!inicioManual || !fimManual) return "Preencha a hora de início e a de fim.";
      const inicio = instanteNaEscola(hoje, inicioManual);
      const fim = instanteNaEscola(hoje, fimManual);
      if (fim <= inicio) return "A hora de fim precisa ser depois da hora de início.";
      return { inicio, fim };
    }
    if (!Number.isFinite(minutos) || minutos < 1 || minutos > 240)
      return "Informe de 1 a 240 minutos.";
    const base =
      aposAtual && fimDoGrupoAtual && fimDoGrupoAtual.getTime() > Date.now()
        ? fimDoGrupoAtual
        : new Date();
    return { inicio: base, fim: somarMinutos(base, minutos) };
  }

  const janela = calcularJanela();

  /** Alunos que já estarão no laboratório durante a janela escolhida (ao vivo, pausados ou agendados). */
  const ocupadosNaJanela = (() => {
    const ini = typeof janela === "string" ? agora : janela.inicio.getTime();
    const fimJ = typeof janela === "string" ? ini + 30 * 60_000 : janela.fim.getTime();
    return new Set(
      dados.sessoes
        .filter(
          (s) =>
            estadoDaSessao(s, agora) !== "encerrada" &&
            new Date(s.inicio).getTime() < fimJ &&
            (s.pausadoEm ? Infinity : new Date(s.fim).getTime()) > ini,
        )
        .map((s) => s.alunoId),
    ).size;
  })();
  const vagas = Math.max(0, LIMITE_ALUNOS_LAB - ocupadosNaJanela);
  const noLimite = escolhidos.size >= vagas;
  const passouDoLimite = escolhidos.size > vagas;

  function alternar(id: string) {
    setEscolhidos((anterior) => {
      const novo = new Set(anterior);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function escolherTurma(id: string) {
    if (mista) {
      setNavMista(id);
      setBusca("");
      return;
    }
    setTurmaSel(id);
    setBusca("");
    setEscolhidos(new Set());
  }

  function alternarMista() {
    setBusca("");
    setEscolhidos(new Set());
    if (mista) {
      setTurmaSel(null);
      setNavMista(null);
    } else {
      setTurmaSel(MISTA);
      setNavMista(idAtual);
    }
  }

  function marcarFiltrados() {
    const livres = visiveis
      .filter(
        ({ a }) =>
          !a.impedido && !noLabAgora.has(a.id) && (liberar || !situacoes.get(a.id)!.naSemana),
      )
      .map(({ a }) => a.id);
    const base = new Set(escolhidos);
    for (const id of livres) {
      if (base.size >= vagas) break;
      base.add(id);
    }
    setEscolhidos(base);
    if (livres.some((id) => !base.has(id)))
      toast.info(`Marquei só até o limite de ${LIMITE_ALUNOS_LAB} alunos.`);
  }

  function levantarAvisos(): Aviso[] {
    return selecionados
      .map(({ a }) => {
        // A ida de hoje é a mesma visita, não uma repetição (situacaoDoAluno já desconta).
        const x = situacoes.get(a.id)!;
        return { nome: a.nome, semana: x.semana, mes: x.mes, hoje: x.hoje, acima: x.acima };
      })
      .filter(
        (x) => x.semana >= LIMITE_IDAS_SEMANA || x.mes >= LIMITE_IDAS_MES || x.hoje || x.acima,
      );
  }

  async function gravar() {
    if (selecionados.length === 0 || typeof janela === "string") return;
    if (passouDoLimite) {
      toast.error(`O laboratório comporta ${LIMITE_ALUNOS_LAB} alunos por vez.`);
      return;
    }
    setSalvando(true);
    try {
      await marcarGrupo({
        alunos: selecionados.map(({ a, t }) => ({
          id: a.id,
          nome: a.nome,
          turma: { id: t.id, rotulo: rotuloTurma(t.serie, t.letra) },
        })),
        inicio: janela.inicio,
        fim: janela.fim,
        criadoPor: email,
      });
      toast.success(
        `${escolhidos.size} aluno${escolhidos.size === 1 ? "" : "s"} no laboratório das ${horaNaEscola(janela.inicio)} às ${horaNaEscola(janela.fim)}.`,
      );
      setEscolhidos(new Set());
      setAvisos(null);
      await dados.recarregar();
      aoMarcar?.();
    } catch (e) {
      toast.error(
        e instanceof Error && e.message === TABELA_AUSENTE
          ? "O banco ainda não tem a tabela do laboratório. Rode o arquivo supabase/laboratorio.sql no Supabase."
          : e instanceof Error
            ? e.message
            : "Não foi possível marcar.",
      );
    } finally {
      setSalvando(false);
    }
  }

  function confirmar() {
    if (typeof janela === "string") {
      toast.error(janela);
      return;
    }
    const lista = levantarAvisos();
    if (lista.length > 0) setAvisos(lista);
    else void gravar();
  }

  const doTurmaFila = turma
    ? turma.alunos.filter((a) => situacoes.get(a.id)!.prioridade).length
    : 0;
  const doTurmaSemana = turma
    ? turma.alunos.filter((a) => situacoes.get(a.id)!.naSemana).length
    : 0;

  return (
    <div className={cn("grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]", className)}>
      {/* ─────────── Coluna da esquerda: turmas e alunos ─────────── */}
      <section aria-label="Turmas e alunos" className="flex min-h-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Turmas">
          {turmas.map((t) => {
            const cor = serieClasses(serieIndexPorNumero(t.serie));
            const ativa = t.id === idAtual;
            const nEsc = t.alunos.filter((a) => escolhidos.has(a.id)).length;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={ativa}
                onClick={() => escolherTurma(t.id)}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold transition",
                  cor.bg,
                  cor.text,
                  ativa
                    ? "scale-105 shadow-lg ring-2 ring-foreground ring-offset-2 ring-offset-background"
                    : "opacity-55 hover:opacity-100",
                  nEsc > 0 && !ativa && "opacity-100 ring-2 ring-emerald-500",
                )}
              >
                {rotuloTurma(t.serie, t.letra)}
                <span className="rounded-md bg-black/20 px-1.5 text-[11px] font-semibold tabular-nums">
                  {t.alunos.length}
                </span>
                {nEsc > 0 ? (
                  <span className="absolute -right-1.5 -top-1.5 flex items-center gap-0.5 rounded-full bg-emerald-600 px-1.5 text-[10px] font-extrabold text-white shadow">
                    <CheckCircle2 className="size-3" aria-hidden /> {nEsc}
                  </span>
                ) : null}
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={mista}
            onClick={alternarMista}
            className={cn(
              "group relative ml-1 flex items-center gap-2 overflow-hidden rounded-full px-4 py-1.5 text-sm font-bold text-white shadow-md transition hover:scale-[1.03] active:scale-95",
              "bg-gradient-to-r from-violet-600 via-primary to-emerald-500",
              mista && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
            )}
          >
            <span
              aria-hidden
              className="lab-varredura pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
            <Shuffle
              className={cn(
                "relative size-4 transition-transform duration-500",
                mista && "rotate-180",
              )}
              aria-hidden
            />
            <span className="relative">{mista ? "Aula mista · sair" : "Aula mista"}</span>
          </button>
        </div>

        {/* resumo da turma que está na tela */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border bg-card/60 px-3 py-2 text-sm">
          {busca.trim() ? (
            <strong>{lista.length} resultado(s) na escola toda</strong>
          ) : turma ? (
            <>
              <strong className="font-heading text-base">
                {rotuloTurma(turma.serie, turma.letra)}
              </strong>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users2 className="size-4" aria-hidden />
                <strong className="text-foreground">{turma.alunos.length}</strong> alunos
              </span>
              <span className="text-muted-foreground">
                <strong className="text-amber-600 dark:text-amber-400">{doTurmaSemana}</strong> já
                foram na semana
              </span>
              <span className="text-muted-foreground">
                <strong className="text-rose-600 dark:text-rose-400">{doTurmaFila}</strong> na fila
                de prioridade
              </span>
              <span className="text-xs text-muted-foreground">· {turma.professorRegente}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Nenhuma turma cadastrada.</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-44 flex-1 sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={mista ? "Buscar em qualquer turma…" : "Buscar nesta turma…"}
              aria-label="Buscar aluno"
              className="h-9 pl-8"
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-card/60 px-2.5 py-1.5">
            <Switch id="lab-liberar" checked={liberar} onCheckedChange={setLiberar} />
            <Label htmlFor="lab-liberar" className="text-xs">
              Liberar quem já foi na semana
            </Label>
          </div>
          <div className="ml-auto flex gap-1 rounded-lg border bg-card/60 p-0.5 text-xs font-semibold">
            {(
              [
                ["prioridade", "Fila de prioridade"],
                ["az", "A–Z"],
              ] as const
            ).map(([id, rotulo]) => (
              <button
                key={id}
                type="button"
                aria-pressed={ordem === id}
                onClick={() => setOrdem(id)}
                className={cn(
                  "rounded-md px-2.5 py-1 transition",
                  ordem === id ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                {rotulo}
              </button>
            ))}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={marcarFiltrados}
            disabled={mista && filtro === "todos" && !busca.trim()}
          >
            {filtro === "todos" ? "Marcar todos" : "Marcar os filtrados"}
          </Button>
        </div>

        <div
          className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
          role="group"
          aria-label="Filtros rápidos"
        >
          {FILTROS.map(({ id, rotulo }) => (
            <button
              key={id}
              type="button"
              aria-pressed={filtro === id}
              onClick={() => setFiltro(id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold transition",
                filtro === id
                  ? "border-primary bg-primary text-primary-foreground shadow"
                  : "bg-card/60 hover:bg-muted",
              )}
            >
              {id === "prioridade" ? <AlarmClock className="size-3.5" aria-hidden /> : null}
              {id === "repetiu" ? <Flame className="size-3.5" aria-hidden /> : null}
              {rotulo}
              <span className="rounded-full bg-black/15 px-1.5 tabular-nums dark:bg-white/15">
                {contagem[id]}
              </span>
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl pr-1 max-lg:max-h-[55svh]">
          {visiveis.length === 0 ? (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              {lista.length === 0
                ? "Esta turma ainda não tem alunos cadastrados."
                : "Ninguém se encaixa neste filtro."}
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {visiveis.map(({ a, t }) => {
                const sit = situacoes.get(a.id)!;
                const marcado = escolhidos.has(a.id);
                const ocupado = noLabAgora.has(a.id);
                const travadoSemana = sit.naSemana && !liberar;
                const noTeto = !marcado && noLimite;
                const bloqueado = Boolean(a.impedido) || ocupado || travadoSemana || noTeto;
                const fila = posicaoFila.get(a.id);
                const ring = sit.repetiuSemana
                  ? "ring-red-500"
                  : sit.naSemana
                    ? "ring-amber-500"
                    : sit.prioridade
                      ? "ring-rose-400"
                      : "ring-emerald-500/60";
                return (
                  <li key={a.id} className="relative">
                    <button
                      type="button"
                      aria-pressed={marcado}
                      disabled={bloqueado}
                      onClick={() => alternar(a.id)}
                      title={
                        travadoSemana
                          ? "Já foi esta semana — ligue “Liberar quem já foi na semana” para escolher"
                          : noTeto
                            ? `Limite de ${LIMITE_ALUNOS_LAB} alunos por vez`
                            : undefined
                      }
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-2.5 pr-9 text-left transition",
                        marcado
                          ? "border-primary bg-primary text-primary-foreground shadow-md"
                          : "bg-card hover:-translate-y-0.5 hover:shadow-md",
                        !marcado &&
                          sit.prioridade &&
                          "border-rose-400/60 bg-gradient-to-r from-rose-500/10 to-transparent",
                        travadoSemana &&
                          "cursor-not-allowed border-dashed opacity-50 grayscale [background-image:repeating-linear-gradient(135deg,transparent_0_7px,rgb(120_120_120/0.12)_7px_14px)]",
                        bloqueado && !travadoSemana && "cursor-not-allowed opacity-45",
                      )}
                    >
                      <span
                        className={cn(
                          "relative flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-extrabold text-foreground ring-2",
                          marcado ? "bg-white/25 text-primary-foreground ring-white/60" : ring,
                        )}
                      >
                        {marcado ? (
                          <CheckCircle2 className="size-5" aria-hidden />
                        ) : travadoSemana ? (
                          <Lock className="size-4" aria-hidden />
                        ) : (
                          iniciais(a.nome)
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-semibold">{a.nome}</span>
                          {fila && fila <= 10 && !marcado ? (
                            <span
                              className="shrink-0 rounded-md bg-rose-600 px-1 text-[10px] font-extrabold text-white"
                              title={`${fila}º na fila de prioridade`}
                            >
                              {fila}º
                            </span>
                          ) : null}
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px]",
                            marcado ? "text-primary-foreground/85" : "text-muted-foreground",
                          )}
                        >
                          {mista || busca.trim() ? (
                            <strong>{rotuloTurma(t.serie, t.letra)}</strong>
                          ) : null}
                          {a.impedido ? (
                            <span>suspenso(a)</span>
                          ) : ocupado ? (
                            <span className="font-semibold text-emerald-500">
                              no laboratório agora
                            </span>
                          ) : sit.hoje ? (
                            <span>marcado para hoje</span>
                          ) : sit.repetiuSemana ? (
                            <span className="font-semibold text-red-500">
                              foi {sit.idasSemana}× na semana
                            </span>
                          ) : sit.naSemana ? (
                            <span className="font-semibold text-amber-600 dark:text-amber-400">
                              foi na semana
                              {sit.ultimaIda ? ` (${dataCurta(sit.ultimaIda)})` : ""}
                            </span>
                          ) : sit.diasSemIr === null ? (
                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                              não vai há mais de {JANELA_HISTORICO_DIAS} dias
                            </span>
                          ) : (
                            <span
                              className={cn(
                                sit.prioridade && "font-semibold text-rose-600 dark:text-rose-400",
                              )}
                            >
                              {sit.diasSemIr === 0 ? "foi hoje" : `há ${sit.diasSemIr} dias sem ir`}
                            </span>
                          )}
                          <span>· mês {sit.mes}×</span>
                          {sit.acima ? (
                            <span className="font-semibold text-red-500">· acima da média</span>
                          ) : null}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Abrir a ficha de ${a.nome}`}
                      title="Abrir a ficha do aluno"
                      onClick={() => setFicha({ turmaId: t.id, alunoId: a.id })}
                      className="absolute right-1.5 top-1.5 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-primary"
                    >
                      <IdCard className="size-4" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* ─────────── Coluna da direita: vagas, escolhidos, tempo ─────────── */}
      <aside
        aria-label="Resumo da marcação"
        className="flex min-h-0 flex-col gap-3 overflow-y-auto rounded-2xl border bg-gradient-to-b from-card to-muted/30 p-4 shadow-sm"
      >
        <div>
          <p className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Vagas no laboratório
            <span className="tabular-nums text-foreground">
              {Math.min(escolhidos.size, vagas) + ocupadosNaJanela}/{LIMITE_ALUNOS_LAB}
            </span>
          </p>
          <div className="mt-2 grid grid-cols-10 gap-1" aria-hidden>
            {Array.from({ length: LIMITE_ALUNOS_LAB }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "h-2.5 rounded-full transition-colors duration-300",
                  i < ocupadosNaJanela
                    ? "bg-slate-500"
                    : i < ocupadosNaJanela + escolhidos.size
                      ? passouDoLimite
                        ? "bg-red-500"
                        : "bg-primary"
                      : "bg-muted",
                )}
              />
            ))}
          </div>
          <p
            className={cn(
              "mt-1.5 text-[11px] transition-colors",
              noLimite ? "font-medium text-amber-600 dark:text-amber-400" : "text-muted-foreground",
            )}
            role={noLimite ? "status" : undefined}
          >
            {ocupadosNaJanela > 0 ? `${ocupadosNaJanela} já no laboratório nesse horário · ` : ""}
            {noLimite
              ? `limite de ${LIMITE_ALUNOS_LAB} por vez atingido; as demais escolhas ficam desativadas.`
              : `${vagas - escolhidos.size} vaga(s) livre(s).`}
          </p>
        </div>

        <div className="min-h-24 flex-1 overflow-y-auto">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Escolhidos ({escolhidos.size})
          </p>
          {selecionados.length === 0 ? (
            <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
              Toque nos alunos ao lado. Quem está há mais tempo sem ir aparece primeiro.
            </p>
          ) : (
            <ul className="space-y-1">
              {selecionados.map(({ a, t }) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-2 rounded-lg border bg-background/70 py-1 pl-2 pr-1 text-xs"
                >
                  <span className="truncate">
                    <strong>{rotuloTurma(t.serie, t.letra)}</strong> {a.nome}
                  </span>
                  <button
                    type="button"
                    aria-label={`Tirar ${a.nome}`}
                    onClick={() => alternar(a.id)}
                    className="rounded-md p-1 hover:bg-muted"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {selecionados.length > 0 ? (
            <button
              type="button"
              onClick={() => setEscolhidos(new Set())}
              className="mt-1.5 text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Limpar tudo
            </button>
          ) : null}
        </div>

        <div className="space-y-2.5 border-t pt-3">
          <div className="grid grid-cols-2 gap-1 rounded-lg border bg-card/60 p-0.5 text-xs font-semibold">
            <button
              type="button"
              aria-pressed={modo === "duracao"}
              onClick={() => setModo("duracao")}
              className={cn(
                "rounded-md py-1.5 transition",
                modo === "duracao" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              Por minutos
            </button>
            <button
              type="button"
              aria-pressed={modo === "horario"}
              onClick={() => {
                setModo("horario");
                setInicioManual(horaAgoraNaEscola());
                setFimManual(horaNaEscola(somarMinutos(new Date(), minutos)));
              }}
              className={cn(
                "rounded-md py-1.5 transition",
                modo === "horario" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              Escolher horário
            </button>
          </div>

          {modo === "duracao" ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {DURACOES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={minutos === d}
                    onClick={() => setMinutos(d)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums transition",
                      minutos === d
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-card hover:bg-muted",
                    )}
                  >
                    {d} min
                  </button>
                ))}
                <Input
                  aria-label="Outra duração em minutos"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={240}
                  value={minutos}
                  onChange={(e) => setMinutos(Number(e.target.value))}
                  className="h-7 w-16 px-2 text-xs"
                />
              </div>
              {fimDoGrupoAtual && fimDoGrupoAtual.getTime() > Date.now() ? (
                <div className="flex items-center gap-2">
                  <Switch id="lab-apos" checked={aposAtual} onCheckedChange={setAposAtual} />
                  <Label htmlFor="lab-apos" className="text-xs">
                    Entrar só quando o grupo de agora sair ({horaNaEscola(fimDoGrupoAtual)})
                  </Label>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label htmlFor="lab-ini" className="text-[11px] text-muted-foreground">
                  Início
                </Label>
                <Input
                  id="lab-ini"
                  type="time"
                  value={inicioManual}
                  onChange={(e) => setInicioManual(e.target.value)}
                  className="h-8 w-28"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lab-fim" className="text-[11px] text-muted-foreground">
                  Fim
                </Label>
                <Input
                  id="lab-fim"
                  type="time"
                  value={fimManual}
                  onChange={(e) => setFimManual(e.target.value)}
                  className="h-8 w-28"
                />
              </div>
            </div>
          )}

          <p className="flex items-center gap-2 text-xs">
            <Clock3 className="size-4 shrink-0 text-primary" aria-hidden />
            {typeof janela === "string" ? (
              <span className="text-muted-foreground">{janela}</span>
            ) : (
              <span>
                Das <strong>{horaNaEscola(janela.inicio)}</strong> às{" "}
                <strong>{horaNaEscola(janela.fim)}</strong>
              </span>
            )}
          </p>

          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={
              salvando || escolhidos.size === 0 || typeof janela === "string" || passouDoLimite
            }
            onClick={confirmar}
          >
            <Play /> Mandar {escolhidos.size} aluno{escolhidos.size === 1 ? "" : "s"}
          </Button>
        </div>
      </aside>

      {ficha ? <FichaAluno {...ficha} aberto aoFechar={() => setFicha(null)} /> : null}

      <AlertDialog
        open={avisos !== null}
        onOpenChange={(aberto) => (aberto ? null : setAvisos(null))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" aria-hidden /> Opa, esse pessoal já
              foi
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>Dê uma olhadinha antes de marcar de novo:</p>
                <ul className="space-y-1">
                  {avisos?.map((x) => (
                    <li key={x.nome} className="rounded-md border p-2">
                      <strong className="text-foreground">{x.nome}</strong>
                      <br />
                      {x.hoje ? "já está marcado hoje · " : ""}
                      {x.semana >= LIMITE_IDAS_SEMANA ? `${x.semana}× nesta semana · ` : ""}
                      {x.mes >= LIMITE_IDAS_MES ? `${x.mes}× neste mês` : ""}
                      {x.acima ? " · foi mais que a maioria da escola" : ""}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar e trocar alguém</AlertDialogCancel>
            <AlertDialogAction onClick={() => void gravar()}>Marcar mesmo assim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
