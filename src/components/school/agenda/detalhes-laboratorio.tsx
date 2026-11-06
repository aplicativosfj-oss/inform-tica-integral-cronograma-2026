import {
  CalendarDays,
  ChevronDown,
  Clock3,
  History,
  Loader2,
  MonitorSmartphone,
  Search,
  Timer,
  UserCheck,
  UserX,
  Users2,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { rotuloTurma } from "@/components/school/laboratorio/ficha-aluno";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAppStore } from "@/lib/app-store";
import {
  ROTULO_AUSENCIA,
  agruparSessoes,
  carregarHistoricoAluno,
  carregarOcorrenciasAluno,
  estadoDaSessao,
  horaNaEscola,
  nomeExibido,
  textoRestante,
  type GrupoLab,
  type SessaoLab,
  type TipoAusencia,
} from "@/lib/laboratorio";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";
import { cn } from "@/lib/utils";

export type AbaDetalhe = "agora" | "alunos" | "faltas" | "aulas" | "tempo";

const ABAS: { id: AbaDetalhe; rotulo: string; Icone: LucideIcon }[] = [
  { id: "agora", rotulo: "Agora", Icone: MonitorSmartphone },
  { id: "alunos", rotulo: "Alunos", Icone: UserCheck },
  { id: "faltas", rotulo: "Faltas", Icone: UserX },
  { id: "aulas", rotulo: "Aulas", Icone: Users2 },
  { id: "tempo", rotulo: "Tempo", Icone: Timer },
];

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export const chaveAluno = (turmaId: string, alunoId: string) => `${turmaId}:${alunoId}`;

export const minutosDe = (s: { inicio: string; fim: string }, agora?: number) => {
  const ini = new Date(s.inicio).getTime();
  const fim = Math.min(new Date(s.fim).getTime(), agora ?? Infinity);
  return Math.max(0, Math.round((fim - ini) / 60_000));
};

export function dataCurta(chave: string) {
  const [y, m, d] = chave.split("-").map(Number);
  const dia = DIAS[new Date(y!, m! - 1, d!).getDay()]!;
  return `${dia.slice(0, 3)}, ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

const COR_AUSENCIA: Record<TipoAusencia, string> = {
  faltou: "bg-rose-500/15 text-rose-700 ring-rose-500/30 dark:text-rose-300",
  nao_autorizado: "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300",
  recusou: "bg-slate-500/15 text-slate-700 ring-slate-500/30 dark:text-slate-300",
};

function Etiqueta({ rotulo, className }: { rotulo: string; className?: string }) {
  const cor = serieClasses(serieIndexPorNumero(rotulo));
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg px-2 py-0.5 text-xs font-extrabold",
        cor.bg,
        cor.text,
        className,
      )}
    >
      {rotulo}
    </span>
  );
}

interface AlunoRef {
  turmaId: string;
  alunoId: string;
  nome: string;
}

/**
 * Painel lateral com os números do laboratório abertos em detalhe: quem está
 * lá agora, quem já foi e quem falta ir na semana, as faltas (sem contar
 * transferidos e desistentes), as aulas e o tempo de computador. Tocar num
 * aluno abre o histórico completo dele.
 */
export function DetalhesLaboratorio({
  aba,
  turmaInicial,
  aoFechar,
  sessoes,
  ausencias,
  agora,
  s0,
  s1,
  hoje,
  logado,
}: {
  /** null = fechado. */
  aba: AbaDetalhe | null;
  turmaInicial?: string | null;
  aoFechar: () => void;
  /** Idas registradas (janela de ~60 dias). */
  sessoes: SessaoLab[];
  /** Faltas, impedimentos e recusas (mesma janela). */
  ausencias: SessaoLab[];
  agora: number;
  s0: string;
  s1: string;
  hoje: string;
  logado: boolean;
}) {
  const { turmas, todasTurmas } = useAppStore();
  const [abaAtual, setAbaAtual] = useState<AbaDetalhe>("agora");
  const [turmaSel, setTurmaSel] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [alunoAberto, setAlunoAberto] = useState<string | null>(null);

  useEffect(() => {
    if (aba) {
      setAbaAtual(aba);
      setTurmaSel(turmaInicial ?? null);
      setBusca("");
      setAlunoAberto(null);
    }
  }, [aba, turmaInicial]);

  /** Alunos que ainda estão na escola (sem transferidos e desistentes). */
  const ativos = useMemo(
    () => new Set(turmas.flatMap((t) => t.alunos.map((a) => chaveAluno(t.id, a.id)))),
    [turmas],
  );
  const situacao = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of todasTurmas)
      for (const a of t.alunos)
        if (a.situacao && a.situacao !== "ativo") m.set(chaveAluno(t.id, a.id), a.situacao);
    return m;
  }, [todasTurmas]);

  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  const passaFiltro = (turmaId: string, nome: string) =>
    (!turmaSel || turmaSel === turmaId) &&
    (!termo || nome.toLocaleLowerCase("pt-BR").includes(termo));

  const daSemana = useMemo(
    () => sessoes.filter((s) => s.data >= s0 && s.data <= s1),
    [sessoes, s0, s1],
  );
  const faltasSemana = useMemo(
    () =>
      ausencias.filter(
        (s) => s.data >= s0 && s.data <= s1 && ativos.has(chaveAluno(s.turmaId, s.alunoId)),
      ),
    [ausencias, s0, s1, ativos],
  );

  const props = {
    turmas,
    situacao,
    passaFiltro,
    logado,
    agora,
    hoje,
    sessoes,
    ausencias,
    alunoAberto,
    setAlunoAberto,
  };

  return (
    <Sheet open={aba !== null} onOpenChange={(v) => (v ? null : aoFechar())}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden border-l border-border/70 bg-background/95 p-0 backdrop-blur-xl sm:max-w-2xl"
      >
        <SheetHeader className="space-y-1 border-b border-border/70 bg-gradient-to-br from-primary/10 via-transparent to-transparent px-5 pb-4 pt-5 text-left">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            Laboratório · semana de {dataCurta(s0).slice(5)} a {dataCurta(s1).slice(5)}
          </p>
          <SheetTitle className="text-2xl font-extrabold tracking-tight">
            Detalhes do laboratório
          </SheetTitle>
          <SheetDescription>
            Toque num aluno para ver todo o histórico dele. Transferidos e desistentes não entram
            nas faltas.
          </SheetDescription>

          <nav
            aria-label="Assunto"
            className="!mt-4 grid grid-cols-5 gap-1 rounded-2xl border border-border/70 bg-muted/50 p-1"
          >
            {ABAS.map(({ id, rotulo, Icone }) => (
              <button
                key={id}
                type="button"
                aria-pressed={abaAtual === id}
                onClick={() => {
                  setAbaAtual(id);
                  setAlunoAberto(null);
                }}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[11px] font-bold transition sm:flex-row sm:justify-center sm:gap-1.5 sm:text-xs",
                  abaAtual === id
                    ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icone className="size-4" aria-hidden />
                {rotulo}
              </button>
            ))}
          </nav>

          {abaAtual !== "agora" && abaAtual !== "tempo" ? (
            <div className="!mt-3 space-y-2">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Procurar aluno pelo nome"
                  className="h-10 rounded-xl pl-9"
                />
              </div>
              <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
                <Chip ativo={!turmaSel} onClick={() => setTurmaSel(null)}>
                  Todas
                </Chip>
                {turmas.map((t) => (
                  <Chip key={t.id} ativo={turmaSel === t.id} onClick={() => setTurmaSel(t.id)}>
                    {rotuloTurma(t.serie, t.letra)}
                  </Chip>
                ))}
              </div>
            </div>
          ) : null}
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 [scrollbar-width:thin]">
          {abaAtual === "agora" ? (
            <AbaAgora {...props} />
          ) : abaAtual === "alunos" ? (
            <AbaAlunos {...props} daSemana={daSemana} />
          ) : abaAtual === "faltas" ? (
            <AbaFaltas {...props} faltas={faltasSemana} />
          ) : abaAtual === "aulas" ? (
            <AbaAulas {...props} daSemana={daSemana} faltas={faltasSemana} />
          ) : (
            <AbaTempo {...props} daSemana={daSemana} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Chip({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1 text-xs font-bold transition",
        ativo
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

interface PropsAba {
  turmas: ReturnType<typeof useAppStore>["turmas"];
  situacao: Map<string, string>;
  passaFiltro: (turmaId: string, nome: string) => boolean;
  logado: boolean;
  agora: number;
  hoje: string;
  sessoes: SessaoLab[];
  ausencias: SessaoLab[];
  alunoAberto: string | null;
  setAlunoAberto: (k: string | null) => void;
}

function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

function Resumo({ itens }: { itens: { rotulo: string; valor: string | number; cor?: string }[] }) {
  return (
    <div className="mb-5 grid grid-cols-3 gap-2">
      {itens.map((i) => (
        <div key={i.rotulo} className="rounded-2xl border border-border/70 bg-card px-3 py-2.5">
          <p className={cn("text-2xl font-extrabold tabular-nums leading-none", i.cor)}>
            {i.valor}
          </p>
          <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{i.rotulo}</p>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── agora ───────────────────────── */

function AbaAgora(p: PropsAba) {
  const doDia = agruparSessoes(p.sessoes.filter((s) => s.data === p.hoje));
  const aoVivo = doDia.filter((g) => estadoDaSessao(g, p.agora) === "ao-vivo");
  const proximas = doDia.filter((g) => estadoDaSessao(g, p.agora) === "agendada");
  const encerradas = doDia.filter((g) => estadoDaSessao(g, p.agora) === "encerrada");
  return (
    <div className="space-y-6">
      <Resumo
        itens={[
          {
            rotulo: "no laboratório agora",
            valor: aoVivo.reduce((n, g) => n + g.alunos.length, 0),
            cor: "text-emerald-600 dark:text-emerald-400",
          },
          { rotulo: "aulas ainda hoje", valor: proximas.length },
          { rotulo: "aulas já encerradas hoje", valor: encerradas.length },
        ]}
      />
      <Bloco titulo="Ao vivo">
        {aoVivo.length === 0 ? (
          <Vazio>Laboratório livre no momento.</Vazio>
        ) : (
          aoVivo.map((g) => <CartaoAula key={g.grupoId} g={g} {...p} />)
        )}
      </Bloco>
      {proximas.length ? (
        <Bloco titulo="Logo mais">
          {proximas.map((g) => (
            <CartaoAula key={g.grupoId} g={g} {...p} />
          ))}
        </Bloco>
      ) : null}
      {encerradas.length ? (
        <Bloco titulo="Já passaram hoje">
          {encerradas.map((g) => (
            <CartaoAula key={g.grupoId} g={g} {...p} />
          ))}
        </Bloco>
      ) : null}
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
        {titulo}
      </h3>
      {children}
    </section>
  );
}

function CartaoAula({
  g,
  faltasDoGrupo = [],
  ...p
}: PropsAba & { g: GrupoLab; faltasDoGrupo?: SessaoLab[] | undefined }) {
  const estado = estadoDaSessao(g, p.agora);
  const fim = new Date(g.fim).getTime();
  const ini = new Date(g.inicio).getTime();
  return (
    <article
      className={cn(
        "rounded-2xl border p-3.5",
        estado === "ao-vivo"
          ? "border-emerald-500/50 bg-emerald-500/[0.06]"
          : "border-border/70 bg-card",
      )}
    >
      <header className="flex flex-wrap items-center gap-2">
        <Etiqueta rotulo={g.turmaRotulo} />
        <span className="flex items-center gap-1 text-sm font-semibold tabular-nums">
          <Clock3 className="size-3.5 text-muted-foreground" aria-hidden />
          {horaNaEscola(g.inicio)}–{horaNaEscola(g.fim)}
        </span>
        <span className="ml-auto text-xs font-semibold text-muted-foreground">
          {estado === "ao-vivo" ? (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
              faltam {textoRestante(fim - p.agora)}
            </span>
          ) : estado === "agendada" ? (
            `começa em ${textoRestante(ini - p.agora)}`
          ) : (
            `${minutosDe(g)} min`
          )}
        </span>
      </header>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {g.alunos.map((a) => (
          <li key={a.sessaoId}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs font-semibold">
              {g.turmaId === "mista" ? (
                <span className="text-[10px] text-muted-foreground">{a.turmaRotulo}</span>
              ) : null}
              {nomeExibido(a.nome, p.logado)}
            </span>
          </li>
        ))}
        {faltasDoGrupo.map((a) => (
          <li key={a.id}>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
                COR_AUSENCIA[a.ausencia!],
              )}
              title={ROTULO_AUSENCIA[a.ausencia!]}
            >
              <UserX className="size-3" aria-hidden />
              {nomeExibido(a.alunoNome, p.logado)}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

/* ───────────────────────── alunos ───────────────────────── */

function AbaAlunos(p: PropsAba & { daSemana: SessaoLab[] }) {
  const diasPorAluno = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const s of p.daSemana) {
      const k = chaveAluno(s.turmaId, s.alunoId);
      m.set(k, (m.get(k) ?? new Set()).add(s.data));
    }
    return m;
  }, [p.daSemana]);

  const linhas = p.turmas
    .map((t) => {
      const alunos = t.alunos
        .filter((a) => p.passaFiltro(t.id, a.nome))
        .map((a) => ({
          turmaId: t.id,
          alunoId: a.id,
          nome: a.nome,
          dias: [...(diasPorAluno.get(chaveAluno(t.id, a.id)) ?? [])].sort(),
        }));
      return {
        t,
        rotulo: rotuloTurma(t.serie, t.letra),
        foram: alunos.filter((a) => a.dias.length > 0),
        faltam: alunos.filter((a) => a.dias.length === 0),
        totalTurma: t.alunos.length,
        foramTurma: t.alunos.filter((a) => diasPorAluno.has(chaveAluno(t.id, a.id))).length,
      };
    })
    .filter((l) => l.foram.length + l.faltam.length > 0);

  const totalForam = linhas.reduce((n, l) => n + l.foram.length, 0);
  const totalFaltam = linhas.reduce((n, l) => n + l.faltam.length, 0);
  const total = totalForam + totalFaltam;

  return (
    <div>
      <Resumo
        itens={[
          {
            rotulo: "já foram nesta semana",
            valor: totalForam,
            cor: "text-sky-600 dark:text-sky-400",
          },
          { rotulo: "ainda não foram", valor: totalFaltam },
          {
            rotulo: "do total já passou",
            valor: `${total ? Math.round((totalForam / total) * 100) : 0}%`,
          },
        ]}
      />
      {linhas.length === 0 ? (
        <Vazio>Nenhum aluno encontrado com esse filtro.</Vazio>
      ) : (
        <div className="space-y-4">
          {linhas.map((l) => (
            <section
              key={l.t.id}
              className="overflow-hidden rounded-2xl border border-border/70 bg-card"
            >
              <header className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
                <Etiqueta rotulo={l.rotulo} className="text-sm" />
                <div className="min-w-0 flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 via-violet-500 to-pink-500"
                      style={{
                        width: `${l.totalTurma ? (l.foramTurma / l.totalTurma) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-xs font-bold tabular-nums text-muted-foreground">
                  {l.foramTurma}/{l.totalTurma}
                </span>
              </header>
              <div className="space-y-3 p-3">
                {l.foram.length ? (
                  <ListaAlunos
                    titulo="Já foram"
                    alunos={l.foram}
                    detalhe={(a) =>
                      a.dias.length === 1
                        ? dataCurta(a.dias[0]!)
                        : `${a.dias.length} dias · ${a.dias.map((d) => dataCurta(d).slice(0, 3)).join(", ")}`
                    }
                    {...p}
                  />
                ) : null}
                {l.faltam.length ? (
                  <ListaAlunos
                    titulo="Ainda não foram"
                    apagado
                    alunos={l.faltam}
                    detalhe={() => "esta semana, não"}
                    {...p}
                  />
                ) : null}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ListaAlunos<T extends AlunoRef>({
  titulo,
  alunos,
  detalhe,
  apagado = false,
  ...p
}: PropsAba & {
  titulo: string;
  alunos: T[];
  detalhe: (a: T) => React.ReactNode;
  apagado?: boolean;
}) {
  return (
    <div>
      <p className="mb-1.5 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {titulo} · {alunos.length}
      </p>
      <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60">
        {alunos.map((a) => (
          <LinhaAluno
            key={chaveAluno(a.turmaId, a.alunoId)}
            aluno={a}
            detalhe={detalhe(a)}
            apagado={apagado}
            {...p}
          />
        ))}
      </ul>
    </div>
  );
}

function LinhaAluno({
  aluno,
  detalhe,
  apagado = false,
  ...p
}: PropsAba & { aluno: AlunoRef; detalhe: React.ReactNode; apagado?: boolean }) {
  const k = chaveAluno(aluno.turmaId, aluno.alunoId);
  const aberto = p.alunoAberto === k;
  const saiu = p.situacao.get(k);
  return (
    <li className={cn("bg-background/60", aberto && "bg-primary/[0.04]")}>
      <button
        type="button"
        onClick={() => p.setAlunoAberto(aberto ? null : k)}
        aria-expanded={aberto}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-muted/50"
      >
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
            apagado || saiu
              ? "bg-muted-foreground/40"
              : "bg-gradient-to-br from-sky-400 to-violet-500",
          )}
        >
          {aluno.nome.trim().charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-sm font-semibold",
              (apagado || saiu) && "text-muted-foreground",
            )}
          >
            {nomeExibido(aluno.nome, p.logado)}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {saiu ? (saiu === "transferido" ? "Transferido(a)" : "Desistente") : detalhe}
          </span>
        </span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition", aberto && "rotate-180")}
          aria-hidden
        />
      </button>
      {aberto ? <HistoricoAluno aluno={aluno} {...p} /> : null}
    </li>
  );
}

/**
 * Histórico completo do aluno: busca no banco todas as idas e todas as
 * faltas dele (filtrando pela turma, porque o id pode se repetir entre
 * turmas). Sem conexão, mostra o que já está carregado na página.
 */
function HistoricoAluno({ aluno, ...p }: PropsAba & { aluno: AlunoRef }) {
  const daTurma = (s: SessaoLab) => s.turmaId === aluno.turmaId && s.alunoId === aluno.alunoId;
  const [itens, setItens] = useState<SessaoLab[] | null>(null);
  const [parcial, setParcial] = useState(false);

  useEffect(() => {
    let vivo = true;
    Promise.all([
      carregarHistoricoAluno(aluno.alunoId),
      carregarOcorrenciasAluno(aluno.turmaId, aluno.alunoId),
    ])
      .then(([idas, faltas]) => {
        if (vivo) setItens([...idas.filter(daTurma), ...faltas]);
      })
      .catch(() => {
        if (!vivo) return;
        setParcial(true);
        setItens([...p.sessoes.filter(daTurma), ...p.ausencias.filter(daTurma)]);
      });
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aluno.turmaId, aluno.alunoId]);

  if (!itens)
    return (
      <div className="flex items-center gap-2 px-4 pb-4 pt-1 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" aria-hidden /> Carregando o histórico…
      </div>
    );

  const ordenados = [...itens].sort((a, b) => b.inicio.localeCompare(a.inicio));
  const idas = ordenados.filter(
    (s) => s.ausencia === null && estadoDaSessao(s, p.agora) !== "agendada",
  );
  const faltas = ordenados.filter((s) => s.ausencia !== null);
  const dias = new Set(idas.map((s) => s.data));
  const minutos = idas.reduce((n, s) => n + minutosDe(s, p.agora), 0);

  return (
    <div className="space-y-3 px-3 pb-4 pt-1">
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { r: "idas", v: dias.size },
          { r: "minutos", v: minutos },
          { r: "faltas", v: faltas.length },
          { r: "última ida", v: idas[0] ? dataCurta(idas[0].data).slice(5) : "—" },
        ].map((i) => (
          <div key={i.r} className="rounded-xl bg-muted/60 px-2 py-2 text-center">
            <p className="text-base font-extrabold tabular-nums leading-none">{i.v}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{i.r}</p>
          </div>
        ))}
      </div>
      {ordenados.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum registro no laboratório ainda.</p>
      ) : (
        <ol className="relative space-y-1.5 border-l-2 border-border/70 pl-4">
          {ordenados.map((s) => {
            const falta = s.ausencia;
            const futura = !falta && estadoDaSessao(s, p.agora) === "agendada";
            return (
              <li key={s.id} className="relative text-xs">
                <span
                  className={cn(
                    "absolute -left-[1.4rem] top-1 size-2.5 rounded-full ring-2 ring-background",
                    falta ? "bg-rose-500" : futura ? "bg-amber-400" : "bg-emerald-500",
                  )}
                  aria-hidden
                />
                <span className="font-semibold">{dataCurta(s.data)}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {horaNaEscola(s.inicio)}–{horaNaEscola(s.fim)}
                </span>
                {falta ? (
                  <span
                    className={cn(
                      "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ring-1",
                      COR_AUSENCIA[falta],
                    )}
                  >
                    {ROTULO_AUSENCIA[falta]}
                  </span>
                ) : futura ? (
                  <span className="ml-1.5 text-[10px] font-bold text-amber-600">agendada</span>
                ) : (
                  <span className="text-muted-foreground"> · {minutosDe(s, p.agora)} min</span>
                )}
                {falta && p.logado && s.ausenciaMotivo ? (
                  <span className="block text-[11px] text-muted-foreground">
                    “{s.ausenciaMotivo}”
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
      {parcial ? (
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <History className="size-3" aria-hidden /> Mostrando os últimos 60 dias (sem conexão com o
          histórico completo).
        </p>
      ) : null}
    </div>
  );
}

/* ───────────────────────── faltas ───────────────────────── */

function AbaFaltas(p: PropsAba & { faltas: SessaoLab[] }) {
  const filtradas = p.faltas.filter((s) => p.passaFiltro(s.turmaId, s.alunoNome));
  const porTipo = (t: TipoAusencia) =>
    new Set(filtradas.filter((s) => s.ausencia === t).map((s) => chaveAluno(s.turmaId, s.alunoId)))
      .size;

  const porTurma = p.turmas
    .map((t) => {
      const doGrupo = filtradas.filter((s) => s.turmaId === t.id);
      const porAluno = new Map<string, SessaoLab[]>();
      for (const s of doGrupo) {
        const k = s.alunoId;
        porAluno.set(k, [...(porAluno.get(k) ?? []), s]);
      }
      return {
        t,
        rotulo: rotuloTurma(t.serie, t.letra),
        alunos: [...porAluno.entries()]
          .map(([alunoId, lista]) => ({
            turmaId: t.id,
            alunoId,
            nome: t.alunos.find((a) => a.id === alunoId)?.nome ?? lista[0]!.alunoNome,
            lista: lista.sort((a, b) => b.data.localeCompare(a.data)),
          }))
          .sort((a, b) => b.lista.length - a.lista.length || a.nome.localeCompare(b.nome)),
      };
    })
    .filter((l) => l.alunos.length > 0);

  return (
    <div>
      <Resumo
        itens={[
          { rotulo: "faltaram", valor: porTipo("faltou"), cor: "text-rose-600 dark:text-rose-400" },
          {
            rotulo: "impedidos",
            valor: porTipo("nao_autorizado"),
            cor: "text-amber-600 dark:text-amber-400",
          },
          { rotulo: "recusaram", valor: porTipo("recusou") },
        ]}
      />
      {porTurma.length === 0 ? (
        <Vazio>Nenhuma falta nesta semana. 🎉</Vazio>
      ) : (
        <div className="space-y-4">
          {porTurma.map((l) => (
            <section
              key={l.t.id}
              className="overflow-hidden rounded-2xl border border-border/70 bg-card"
            >
              <header className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
                <Etiqueta rotulo={l.rotulo} className="text-sm" />
                <span className="text-sm font-semibold">
                  {l.alunos.length} {l.alunos.length === 1 ? "aluno" : "alunos"}
                </span>
              </header>
              <ul className="divide-y divide-border/60">
                {l.alunos.map((a) => (
                  <LinhaAluno
                    key={a.alunoId}
                    aluno={a}
                    detalhe={
                      <span className="flex flex-wrap gap-1">
                        {a.lista.map((s) => (
                          <span
                            key={s.id}
                            className={cn(
                              "rounded-full px-1.5 text-[10px] font-bold ring-1",
                              COR_AUSENCIA[s.ausencia!],
                            )}
                          >
                            {ROTULO_AUSENCIA[s.ausencia!]} · {dataCurta(s.data).slice(0, 3)}
                          </span>
                        ))}
                      </span>
                    }
                    {...p}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── aulas ───────────────────────── */

function AbaAulas(p: PropsAba & { daSemana: SessaoLab[]; faltas: SessaoLab[] }) {
  const grupos = agruparSessoes(p.daSemana).filter((g) =>
    g.alunos.some((a) => p.passaFiltro(a.turmaId, a.nome)),
  );
  const faltasPorGrupo = new Map<string, SessaoLab[]>();
  for (const f of p.faltas)
    if (!f.semMarcacao)
      faltasPorGrupo.set(f.grupoId, [...(faltasPorGrupo.get(f.grupoId) ?? []), f]);

  const dias = [...new Set(p.daSemana.map((s) => s.data))].sort().reverse();
  const dataDoGrupo = new Map(p.daSemana.map((s) => [s.grupoId, s.data]));

  return (
    <div>
      <Resumo
        itens={[
          {
            rotulo: "aulas na semana",
            valor: grupos.length,
            cor: "text-violet-600 dark:text-violet-400",
          },
          {
            rotulo: "dias com aula",
            valor: new Set(grupos.map((g) => dataDoGrupo.get(g.grupoId))).size,
          },
          {
            rotulo: "alunos por aula (média)",
            valor: grupos.length
              ? Math.round(grupos.reduce((n, g) => n + g.alunos.length, 0) / grupos.length)
              : 0,
          },
        ]}
      />
      {grupos.length === 0 ? (
        <Vazio>Nenhuma aula encontrada com esse filtro.</Vazio>
      ) : (
        <div className="space-y-6">
          {dias.map((d) => {
            const doDia = grupos.filter((g) => dataDoGrupo.get(g.grupoId) === d);
            if (!doDia.length) return null;
            return (
              <Bloco
                key={d}
                titulo={`${dataCurta(d)} · ${doDia.length} aula${doDia.length === 1 ? "" : "s"}`}
              >
                {doDia.map((g) => (
                  <CartaoAula
                    key={g.grupoId}
                    g={g}
                    faltasDoGrupo={faltasPorGrupo.get(g.grupoId)}
                    {...p}
                  />
                ))}
              </Bloco>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── tempo ───────────────────────── */

function AbaTempo(p: PropsAba & { daSemana: SessaoLab[] }) {
  const grupos = agruparSessoes(p.daSemana).filter(
    (g) => estadoDaSessao(g, p.agora) !== "agendada",
  );
  const dataDoGrupo = new Map(p.daSemana.map((s) => [s.grupoId, s.data]));
  const total = grupos.reduce((n, g) => n + minutosDe(g, p.agora), 0);

  // Minutos de computador por turma: cada aluno conta o tempo da aula dele.
  const porTurma = p.turmas
    .map((t) => {
      const minutos = p.daSemana
        .filter((s) => s.turmaId === t.id && estadoDaSessao(s, p.agora) !== "agendada")
        .reduce((n, s) => n + minutosDe(s, p.agora), 0);
      return { id: t.id, rotulo: rotuloTurma(t.serie, t.letra), minutos };
    })
    .sort((a, b) => b.minutos - a.minutos);
  const maxTurma = Math.max(1, ...porTurma.map((t) => t.minutos));

  const dias = [...new Set(grupos.map((g) => dataDoGrupo.get(g.grupoId)!))].sort();
  const porDia = dias.map((d) => ({
    d,
    minutos: grupos
      .filter((g) => dataDoGrupo.get(g.grupoId) === d)
      .reduce((n, g) => n + minutosDe(g, p.agora), 0),
  }));
  const maxDia = Math.max(1, ...porDia.map((d) => d.minutos));
  const alunoMinutos = porTurma.reduce((n, t) => n + t.minutos, 0);

  return (
    <div className="space-y-6">
      <Resumo
        itens={[
          {
            rotulo: "minutos de laboratório aberto",
            valor: total,
            cor: "text-amber-600 dark:text-amber-400",
          },
          { rotulo: "horas de aula", valor: (total / 60).toFixed(1).replace(".", ",") },
          { rotulo: "minutos somando cada aluno", valor: alunoMinutos },
        ]}
      />
      <Bloco titulo="Por dia">
        {porDia.length === 0 ? (
          <Vazio>Nenhuma aula concluída nesta semana ainda.</Vazio>
        ) : (
          <div className="flex h-40 items-end gap-3 rounded-2xl border border-border/70 bg-card p-4">
            {porDia.map(({ d, minutos }) => (
              <div key={d} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className="text-xs font-bold tabular-nums">{minutos}</span>
                <div
                  className="w-full max-w-12 rounded-t-lg bg-gradient-to-t from-amber-500 to-orange-300"
                  style={{ height: `${(minutos / maxDia) * 100}%` }}
                />
                <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                  <CalendarDays className="size-3" aria-hidden />
                  {dataCurta(d).slice(0, 3)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Bloco>
      <Bloco titulo="Minutos de computador por turma">
        <ul className="space-y-2 rounded-2xl border border-border/70 bg-card p-4">
          {porTurma.map((t) => (
            <li key={t.id} className="flex items-center gap-3">
              <Etiqueta rotulo={t.rotulo} className="w-12" />
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400"
                  style={{ width: `${(t.minutos / maxTurma) * 100}%` }}
                />
              </div>
              <span className="w-16 text-right text-xs font-semibold tabular-nums text-muted-foreground">
                {t.minutos} min
              </span>
            </li>
          ))}
        </ul>
      </Bloco>
    </div>
  );
}
