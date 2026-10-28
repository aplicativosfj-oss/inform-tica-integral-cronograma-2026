import {
  Ban,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  IdCard,
  Search,
  UserX,
  Users2,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { FichaAluno, rotuloTurma } from "@/components/school/laboratorio/ficha-aluno";
import type { DadosLab } from "@/components/school/laboratorio/painel-agora";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/app-store";
import { fimDaSemana, hojeNaEscola, inicioDaSemana, inicioDoMes } from "@/lib/laboratorio";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";
import { cn } from "@/lib/utils";

type Periodo = "semana" | "mes" | "mesAnterior";
type Situacao = "foi" | "faltou" | "impedido" | "pendente";
type Filtro = "todos" | Situacao;

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];
const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

/** Cores de cada situação, iguais às da escolha de alunos. */
const COR: Record<
  Situacao,
  { rotulo: string; chip: string; barra: string; quadro: string; texto: string }
> = {
  foi: {
    rotulo: "Foi",
    chip: "border-emerald-500/40 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
    barra: "bg-emerald-500",
    quadro: "bg-emerald-500",
    texto: "text-emerald-700 dark:text-emerald-300",
  },
  faltou: {
    rotulo: "Faltou",
    chip: "border-rose-500/40 bg-rose-500/12 text-rose-700 dark:text-rose-300",
    barra: "bg-rose-500",
    quadro: "bg-rose-500",
    texto: "text-rose-700 dark:text-rose-300",
  },
  impedido: {
    rotulo: "Impedido",
    chip: "border-amber-500/50 bg-amber-400/15 text-amber-700 dark:text-amber-300",
    barra: "bg-amber-500",
    quadro: "bg-amber-500",
    texto: "text-amber-700 dark:text-amber-300",
  },
  pendente: {
    rotulo: "Ainda não foi",
    chip: "border-border bg-muted text-muted-foreground",
    barra: "bg-muted-foreground/25",
    quadro: "bg-muted-foreground/15",
    texto: "text-muted-foreground",
  },
};

/* ───────────────────────── datas (chaves YYYY-MM-DD) ───────────────────────── */

const paraUTC = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!));
};
const paraChave = (d: Date) => d.toISOString().slice(0, 10);

function somarDias(k: string, n: number) {
  const d = paraUTC(k);
  d.setUTCDate(d.getUTCDate() + n);
  return paraChave(d);
}

function fimDoMes(k: string) {
  const d = paraUTC(inicioDoMes(k));
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(0);
  return paraChave(d);
}

/** Dias de aula (segunda a sexta) do intervalo, sem passar de hoje. */
function diasLetivos(de: string, ate: string, hoje: string) {
  const fim = ate < hoje ? ate : hoje;
  const dias: string[] = [];
  for (let k = de; k <= fim; k = somarDias(k, 1)) {
    const dia = paraUTC(k).getUTCDay();
    if (dia !== 0 && dia !== 6) dias.push(k);
  }
  return dias;
}

const dataCurta = (k: string) => `${k.slice(8, 10)}/${k.slice(5, 7)}`;
const iniciais = (nome: string) =>
  nome
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("") || nome.slice(0, 2).toUpperCase();

/* ───────────────────────── cálculo ───────────────────────── */

interface LinhaAluno {
  chave: string;
  turmaId: string;
  alunoId: string;
  nome: string;
  idas: number;
  faltas: number;
  impedimentos: number;
  idasSemana: number;
  idasMes: number;
  ultimaIda: string | null;
  situacao: Situacao;
  /** Situação em cada dia letivo do período. */
  dias: (Situacao | null)[];
}

/**
 * Frequência no laboratório: por turma e por aluno, quem foi, quem faltou,
 * quem foi impedido e quem ainda não foi, na semana, no mês ou no mês
 * anterior, com a quantidade de idas de cada um.
 */
export function FrequenciaLab({ dados }: { dados: DadosLab }) {
  const { turmas } = useAppStore();
  const hoje = hojeNaEscola();
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const [turmaSel, setTurmaSel] = useState<string>("todas");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");
  const [ficha, setFicha] = useState<{ turmaId: string; alunoId: string } | null>(null);

  const intervalo = useMemo(() => {
    if (periodo === "semana") {
      const de = inicioDaSemana(hoje);
      return { de, ate: fimDaSemana(hoje), rotulo: `Semana de ${dataCurta(de)}` };
    }
    const base = periodo === "mes" ? hoje : somarDias(inicioDoMes(hoje), -1);
    const mes = MESES[Number(base.slice(5, 7)) - 1]!;
    return { de: inicioDoMes(base), ate: fimDoMes(base), rotulo: `Mês de ${mes}` };
  }, [periodo, hoje]);

  const dias = useMemo(() => diasLetivos(intervalo.de, intervalo.ate, hoje), [intervalo, hoje]);

  const porTurma = useMemo(() => {
    const idas = new Map<string, Set<string>>();
    const faltas = new Map<string, Set<string>>();
    const impedidos = new Map<string, Set<string>>();
    const ultima = new Map<string, string>();
    const anotar = (m: Map<string, Set<string>>, k: string, d: string) => {
      const s = m.get(k) ?? new Set<string>();
      s.add(d);
      m.set(k, s);
    };
    for (const s of dados.sessoes) {
      const k = `${s.turmaId}|${s.alunoId}`;
      anotar(idas, k, s.data);
      if (s.data <= hoje && (ultima.get(k) ?? "") < s.data) ultima.set(k, s.data);
    }
    for (const s of dados.ausencias ?? []) {
      const k = `${s.turmaId}|${s.alunoId}`;
      anotar(s.ausencia === "faltou" ? faltas : impedidos, k, s.data);
    }

    const s0 = inicioDaSemana(hoje);
    const s1 = fimDaSemana(hoje);
    const mesAtual = hoje.slice(0, 7);
    const dentro = (d: string) => d >= intervalo.de && d <= intervalo.ate;

    return turmas.map((t) => {
      const alunos: LinhaAluno[] = t.alunos.map((a) => {
        const k = `${t.id}|${a.id}`;
        const di = [...(idas.get(k) ?? [])];
        const df = [...(faltas.get(k) ?? [])];
        const dm = [...(impedidos.get(k) ?? [])];
        const nIdas = di.filter(dentro).length;
        const nFaltas = df.filter(dentro).length;
        const nImped = dm.filter(dentro).length;
        const situacao: Situacao =
          nIdas > 0 ? "foi" : nImped > 0 ? "impedido" : nFaltas > 0 ? "faltou" : "pendente";
        return {
          chave: k,
          turmaId: t.id,
          alunoId: a.id,
          nome: a.nome,
          idas: nIdas,
          faltas: nFaltas,
          impedimentos: nImped,
          idasSemana: di.filter((d) => d >= s0 && d <= s1).length,
          idasMes: di.filter((d) => d.slice(0, 7) === mesAtual).length,
          ultimaIda: ultima.get(k) ?? null,
          situacao,
          dias: dias.map((d) =>
            di.includes(d) ? "foi" : dm.includes(d) ? "impedido" : df.includes(d) ? "faltou" : null,
          ),
        };
      });
      const conta = (s: Situacao) => alunos.filter((a) => a.situacao === s).length;
      return {
        id: t.id,
        rotulo: rotuloTurma(t.serie, t.letra),
        cor: serieClasses(serieIndexPorNumero(t.serie)),
        professor: t.professorRegente,
        alunos,
        foi: conta("foi"),
        faltou: conta("faltou"),
        impedido: conta("impedido"),
        pendente: conta("pendente"),
        idas: alunos.reduce((n, a) => n + a.idas, 0),
      };
    });
  }, [turmas, dados.sessoes, dados.ausencias, hoje, intervalo, dias]);

  const total = useMemo(() => {
    const t = { alunos: 0, foi: 0, faltou: 0, impedido: 0, pendente: 0, idas: 0 };
    for (const x of porTurma) {
      t.alunos += x.alunos.length;
      t.foi += x.foi;
      t.faltou += x.faltou;
      t.impedido += x.impedido;
      t.pendente += x.pendente;
      t.idas += x.idas;
    }
    return t;
  }, [porTurma]);

  const escolhidas = turmaSel === "todas" ? porTurma : porTurma.filter((t) => t.id === turmaSel);
  const todosAlunos = escolhidas.flatMap((t) => t.alunos.map((a) => ({ ...a, turma: t })));
  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  const visiveis = todosAlunos
    .filter((a) => filtro === "todos" || a.situacao === filtro)
    .filter((a) => !termo || a.nome.toLocaleLowerCase("pt-BR").includes(termo))
    .sort(
      (p, q) =>
        ORDEM[p.situacao] - ORDEM[q.situacao] ||
        q.idas - p.idas ||
        p.nome.localeCompare(q.nome, "pt-BR"),
    );
  const contaFiltro = (f: Filtro) =>
    f === "todos" ? todosAlunos.length : todosAlunos.filter((a) => a.situacao === f).length;

  if (dados.carregando) {
    return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;
  }

  return (
    <div className="space-y-5">
      {/* período */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl border bg-card p-1 text-sm font-semibold shadow-sm">
          {(
            [
              ["semana", "Esta semana"],
              ["mes", "Este mês"],
              ["mesAnterior", "Mês anterior"],
            ] as const
          ).map(([id, rotulo]) => (
            <button
              key={id}
              type="button"
              aria-pressed={periodo === id}
              onClick={() => setPeriodo(id)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 transition",
                periodo === id ? "bg-indigo-600 text-white shadow" : "hover:bg-muted",
              )}
            >
              {rotulo}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {intervalo.rotulo} · {dias.length} dia{dias.length === 1 ? "" : "s"} de aula até agora
        </p>
      </div>

      {/* números da escola */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Indicador
          Icone={Users2}
          rotulo="Alunos que foram"
          valor={`${total.foi}`}
          detalhe={`de ${total.alunos} · ${total.alunos ? Math.round((total.foi / total.alunos) * 100) : 0}%`}
          tom="emerald"
        />
        <Indicador
          Icone={CalendarCheck2}
          rotulo="Idas ao laboratório"
          valor={`${total.idas}`}
          detalhe="cada dia conta uma ida"
          tom="indigo"
        />
        <Indicador
          Icone={Clock3}
          rotulo="Ainda não foram"
          valor={`${total.pendente}`}
          detalhe="sem ida, falta ou impedimento"
          tom="slate"
        />
        <Indicador
          Icone={UserX}
          rotulo="Faltaram"
          valor={`${total.faltou}`}
          detalhe="e não foram no período"
          tom="rose"
        />
        <Indicador
          Icone={Ban}
          rotulo="Impedidos"
          valor={`${total.impedido}`}
          detalhe="e não foram no período"
          tom="amber"
        />
      </div>

      {/* turmas */}
      <section aria-label="Turmas">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Turmas
          </h3>
          <Legenda />
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          <button
            type="button"
            aria-pressed={turmaSel === "todas"}
            onClick={() => setTurmaSel("todas")}
            className={cn(
              "flex flex-col justify-between gap-2 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md",
              turmaSel === "todas"
                ? "border-indigo-600 bg-indigo-600 text-white shadow-lg"
                : "bg-card",
            )}
          >
            <span className="text-sm font-extrabold">Todas as turmas</span>
            <span
              className={cn(
                "text-xs",
                turmaSel === "todas" ? "text-white/80" : "text-muted-foreground",
              )}
            >
              {total.foi} de {total.alunos} alunos foram
            </span>
          </button>
          {porTurma.map((t) => {
            const n = t.alunos.length || 1;
            const ativa = turmaSel === t.id;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={ativa}
                onClick={() => setTurmaSel(t.id)}
                className={cn(
                  "flex flex-col gap-2 rounded-2xl border bg-card p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md",
                  ativa && "border-indigo-600 ring-2 ring-indigo-600/40",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "rounded-lg px-2 py-0.5 text-sm font-extrabold",
                      t.cor.bg,
                      t.cor.text,
                    )}
                  >
                    {t.rotulo}
                  </span>
                  <span className="text-xs font-bold tabular-nums">
                    {Math.round((t.foi / n) * 100)}%
                  </span>
                </span>
                <span className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                  {(["foi", "impedido", "faltou"] as const).map((s) =>
                    t[s] ? (
                      <span
                        key={s}
                        className={cn("h-full", COR[s].barra)}
                        style={{ width: `${(t[s] / n) * 100}%` }}
                      />
                    ) : null,
                  )}
                </span>
                <span className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] tabular-nums text-muted-foreground">
                  <span className={COR.foi.texto}>{t.foi} foram</span>
                  {t.impedido ? (
                    <span className={COR.impedido.texto}>{t.impedido} imp.</span>
                  ) : null}
                  {t.faltou ? <span className={COR.faltou.texto}>{t.faltou} falt.</span> : null}
                  <span>{t.pendente} faltam ir</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* alunos */}
      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm" aria-label="Alunos">
        <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 p-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por situação">
            {(["todos", "foi", "pendente", "faltou", "impedido"] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filtro === f}
                onClick={() => setFiltro(f)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition",
                  filtro === f
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "bg-card hover:bg-muted",
                )}
              >
                {f === "todos" ? null : (
                  <span className={cn("size-2 rounded-full", COR[f].quadro)} aria-hidden />
                )}
                {f === "todos" ? "Todos" : f === "foi" ? "Foram" : COR[f].rotulo}
                <span className="tabular-nums opacity-75">{contaFiltro(f)}</span>
              </button>
            ))}
          </div>
          <div className="relative ml-auto w-full sm:w-56">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar aluno"
              className="h-9 pl-8"
              aria-label="Buscar aluno"
            />
          </div>
        </div>

        {visiveis.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Nenhum aluno nesta situação.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm">
              <thead>
                <tr className="border-b text-left text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">Aluno</th>
                  <th className="px-2 py-2">Situação</th>
                  <th className="px-2 py-2">Dia a dia</th>
                  <th className="px-2 py-2 text-center">Semana</th>
                  <th className="px-2 py-2 text-center">Mês</th>
                  <th className="px-2 py-2 text-center">Faltas</th>
                  <th className="px-2 py-2">Última ida</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {visiveis.map((a) => (
                  <tr
                    key={a.chave}
                    className="border-b transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ring-2",
                            a.turma.cor.bg,
                            a.turma.cor.text,
                            a.situacao === "foi"
                              ? "ring-emerald-500"
                              : a.situacao === "faltou"
                                ? "ring-rose-500"
                                : a.situacao === "impedido"
                                  ? "ring-amber-500"
                                  : "ring-transparent",
                          )}
                        >
                          {iniciais(a.nome)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{a.nome}</span>
                          {turmaSel === "todas" ? (
                            <span className="text-xs text-muted-foreground">{a.turma.rotulo}</span>
                          ) : null}
                        </span>
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold",
                          COR[a.situacao].chip,
                        )}
                      >
                        {a.situacao === "foi" ? (
                          <>
                            <CheckCircle2 className="size-3.5" aria-hidden /> Foi {a.idas}×
                          </>
                        ) : (
                          COR[a.situacao].rotulo
                        )}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <span className="flex flex-wrap gap-0.5">
                        {a.dias.map((s, i) => (
                          <span
                            key={dias[i]}
                            title={`${DIAS_SEMANA[paraUTC(dias[i]!).getUTCDay()]} ${dataCurta(dias[i]!)}: ${s ? COR[s].rotulo : "sem registro"}`}
                            className={cn(
                              "rounded-[3px]",
                              periodo === "semana" ? "h-5 w-5" : "h-4 w-2",
                              s ? COR[s].quadro : COR.pendente.quadro,
                            )}
                          />
                        ))}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center font-bold tabular-nums">{a.idasSemana}</td>
                    <td className="px-2 py-2 text-center font-bold tabular-nums">{a.idasMes}</td>
                    <td
                      className={cn(
                        "px-2 py-2 text-center tabular-nums",
                        a.faltas
                          ? "font-bold text-rose-600 dark:text-rose-400"
                          : "text-muted-foreground",
                      )}
                    >
                      {a.faltas}
                      {a.impedimentos ? (
                        <span className="ml-1 text-amber-600 dark:text-amber-400">
                          +{a.impedimentos}i
                        </span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-muted-foreground">
                      {a.ultimaIda ? dataCurta(a.ultimaIda) : "—"}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => setFicha({ turmaId: a.turmaId, alunoId: a.alunoId })}
                        className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-indigo-600"
                        aria-label={`Abrir a ficha de ${a.nome}`}
                        title="Abrir a ficha do aluno"
                      >
                        <IdCard className="size-4" aria-hidden />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {ficha ? <FichaAluno {...ficha} aberto aoFechar={() => setFicha(null)} /> : null}
    </div>
  );
}

const ORDEM: Record<Situacao, number> = { pendente: 0, faltou: 1, impedido: 2, foi: 3 };

const TONS = {
  emerald: "from-emerald-500/20 text-emerald-600 dark:text-emerald-300",
  indigo: "from-indigo-500/20 text-indigo-600 dark:text-indigo-300",
  slate: "from-slate-500/20 text-slate-600 dark:text-slate-300",
  rose: "from-rose-500/20 text-rose-600 dark:text-rose-300",
  amber: "from-amber-500/25 text-amber-600 dark:text-amber-300",
} as const;

function Indicador({
  Icone,
  rotulo,
  valor,
  detalhe,
  tom,
}: {
  Icone: LucideIcon;
  rotulo: string;
  valor: string;
  detalhe: string;
  tom: keyof typeof TONS;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border bg-card p-3.5 shadow-sm">
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br to-transparent",
          TONS[tom],
        )}
      >
        <Icone className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-2xl font-extrabold leading-none tabular-nums">{valor}</span>
        <span className="mt-1 block text-xs font-semibold">{rotulo}</span>
        <span className="hidden text-[11px] text-muted-foreground sm:block">{detalhe}</span>
      </span>
    </div>
  );
}

function Legenda() {
  return (
    <span className="hidden flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground sm:flex">
      {(["foi", "impedido", "faltou", "pendente"] as const).map((s) => (
        <span key={s} className="flex items-center gap-1">
          <span className={cn("size-2.5 rounded-[3px]", COR[s].quadro)} aria-hidden />
          {s === "pendente" ? "Sem registro" : COR[s].rotulo}
        </span>
      ))}
    </span>
  );
}
