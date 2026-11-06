import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Gamepad2,
  Keyboard,
  Lightbulb,
  Lock,
  Medal,
  MonitorSmartphone,
  Mouse,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Timer,
  Trophy,
  UserCheck,
  UserPlus,
  UserX,
  Users2,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import labFotoImg from "@/assets/laboratorio-informatica-turma.jpg";
import { AvisoFeriado } from "@/components/school/aviso-feriado";
import { feriadoNacionalEm } from "@/lib/calendario-escolar";
import { rotuloTurma } from "@/components/school/laboratorio/ficha-aluno";
import { ControleLaboratorio } from "@/components/school/laboratorio/controle";
import { PainelLaboratorioAgora } from "@/components/school/laboratorio/painel-agora";
import {
  DetalhesLaboratorio,
  chaveAluno,
  type AbaDetalhe,
} from "@/components/school/agenda/detalhes-laboratorio";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WeatherWidget } from "@/components/school/weather-widget";
import { useAppStore } from "@/lib/app-store";
import {
  agruparSessoes,
  estadoDaSessao,
  fimDaSemana,
  hojeNaEscola,
  horaNaEscola,
  inicioDaSemana,
  nomeExibido,
  useAgora,
  useSessoesLab,
  type GrupoLab,
} from "@/lib/laboratorio";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";
import { cn } from "@/lib/utils";

const FUSO = "America/Rio_Branco";
const DIAS_CURTOS = ["Seg", "Ter", "Qua", "Qui", "Sex"];

function somarDias(chave: string, n: number) {
  const [y, m, d] = chave.split("-").map(Number);
  const dt = new Date(y!, m! - 1, d! + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

const minutosDoGrupo = (g: GrupoLab) =>
  Math.max(0, Math.round((new Date(g.fim).getTime() - new Date(g.inicio).getTime()) / 60_000));

const corDaTurma = (rotulo: string) => serieClasses(serieIndexPorNumero(rotulo));

/**
 * Agenda pública do laboratório, ocupando a janela inteira: relógio e situação
 * do momento no topo, números da semana, o painel ao vivo, o placar das
 * turmas, a dica do dia e o quadro da semana, de segunda a sexta.
 */
export function PainelAgenda({ logado }: { logado: boolean }) {
  const dadosOriginais = useSessoesLab();
  const { turmas } = useAppStore();
  // Registros históricos da EJA não entram no painel público nem nas estatísticas.
  const idsPermitidos = new Set(turmas.map((t) => t.id));
  const dados = {
    ...dadosOriginais,
    sessoes: dadosOriginais.sessoes.filter((s) => idsPermitidos.has(s.turmaId)),
    ausencias: dadosOriginais.ausencias?.filter((s) => idsPermitidos.has(s.turmaId)),
  };
  const agora = useAgora(1000);
  const hoje = hojeNaEscola();
  const feriadoHoje = feriadoNacionalEm(hoje);
  const s0 = inicioDaSemana(hoje);
  const s1 = fimDaSemana(hoje);

  const daSemana = useMemo(
    () => dados.sessoes.filter((s) => s.data >= s0 && s.data <= s1),
    [dados.sessoes, s0, s1],
  );
  const gruposSemana = useMemo(() => agruparSessoes(daSemana), [daSemana]);
  const dataDoGrupo = useMemo(() => {
    const m = new Map(daSemana.map((s) => [s.grupoId, s.data]));
    return (g: GrupoLab) => m.get(g.grupoId) ?? "";
  }, [daSemana]);
  const gruposHoje = gruposSemana.filter((g) => dataDoGrupo(g) === hoje);
  const aoVivo = feriadoHoje
    ? []
    : gruposHoje.filter((g) => estadoDaSessao(g, agora) === "ao-vivo");
  const proximo = gruposHoje
    .filter((g) => estadoDaSessao(g, agora) === "agendada")
    .sort((a, b) => a.inicio.localeCompare(b.inicio))[0];

  const ativos = useMemo(
    () => new Set(turmas.flatMap((t) => t.alunos.map((a) => chaveAluno(t.id, a.id)))),
    [turmas],
  );
  const totalAtivos = ativos.size;
  /** Faltas da semana de quem ainda está na escola (transferidos e desistentes ficam de fora). */
  const faltasSemana = useMemo(
    () =>
      (dados.ausencias ?? []).filter(
        (s) => s.data >= s0 && s.data <= s1 && ativos.has(chaveAluno(s.turmaId, s.alunoId)),
      ),
    [dados.ausencias, s0, s1, ativos],
  );
  const faltaram = new Set(
    faltasSemana
      .filter((s) => s.ausencia === "faltou")
      .map((s) => chaveAluno(s.turmaId, s.alunoId)),
  ).size;
  const outrasAusencias = new Set(
    faltasSemana
      .filter((s) => s.ausencia !== "faltou")
      .map((s) => chaveAluno(s.turmaId, s.alunoId)),
  ).size;

  const [detalhe, setDetalhe] = useState<{
    aba: AbaDetalhe;
    turma?: string | null | undefined;
  } | null>(null);
  const [controle, setControle] = useState<null | "inserir" | "agendar">(null);
  const abrir = (aba: AbaDetalhe, turma?: string | null) => setDetalhe({ aba, turma });

  const numeros = {
    agora: new Set(aoVivo.flatMap((g) => g.alunos.map((a) => `${a.turmaId}:${a.id}`))).size,
    semana: new Set(daSemana.map((s) => `${s.turmaId}:${s.alunoId}`)).size,
    aulas: gruposSemana.length,
    minutos: gruposSemana
      .filter((g) => estadoDaSessao(g, agora) !== "agendada")
      .reduce((s, g) => s + minutosDoGrupo(g), 0),
  };

  const placar = useMemo(() => {
    const foram = new Set(daSemana.map((s) => `${s.turmaId}:${s.alunoId}`));
    return turmas
      .map((t) => {
        const n = t.alunos.filter((a) => foram.has(`${t.id}:${a.id}`)).length;
        return {
          id: t.id,
          rotulo: rotuloTurma(t.serie, t.letra),
          serie: t.serie,
          foram: n,
          total: t.alunos.length,
          parte: t.alunos.length ? n / t.alunos.length : 0,
        };
      })
      .sort((a, b) => b.parte - a.parte || b.foram - a.foram);
  }, [daSemana, turmas]);

  return (
    <div className="pb-12">
      <Cabecalho
        agora={agora}
        aoVivo={aoVivo.length}
        proximo={proximo}
        gruposHoje={feriadoHoje ? [] : gruposHoje}
        logado={logado}
        podeMarcar={!feriadoHoje}
        aoInserir={() => setControle("inserir")}
        aoAgendar={() => setControle("agendar")}
      />

      <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 sm:px-6 lg:px-8">
        {feriadoHoje ? (
          <AvisoFeriado dataISO={hoje} className="relative z-10 -mt-10 max-w-none" />
        ) : null}
        <div className="relative z-10 -mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5 [&>*:first-child]:col-span-2 sm:[&>*:first-child]:col-span-1">
          <Numero
            Icone={MonitorSmartphone}
            rotulo="No laboratório agora"
            detalhe={
              aoVivo.length
                ? "aula acontecendo"
                : proximo
                  ? `próxima às ${horaNaEscola(proximo.inicio)}`
                  : "laboratório livre"
            }
            valor={numeros.agora}
            cor="emerald"
            vivo={numeros.agora > 0}
            onClick={() => abrir("agora")}
          />
          <Numero
            Icone={UserCheck}
            rotulo="Alunos que foram nesta semana"
            detalhe={
              totalAtivos
                ? `${Math.round((numeros.semana / totalAtivos) * 100)}% de ${totalAtivos} alunos`
                : undefined
            }
            valor={numeros.semana}
            cor="sky"
            onClick={() => abrir("alunos")}
          />
          <Numero
            Icone={UserX}
            rotulo="Alunos que faltaram na semana"
            detalhe={
              outrasAusencias
                ? `+${outrasAusencias} impedido${outrasAusencias === 1 ? "" : "s"} ou recusa${outrasAusencias === 1 ? "" : "s"}`
                : "sem transferidos e desistentes"
            }
            valor={faltaram}
            cor="rose"
            onClick={() => abrir("faltas")}
          />
          <Numero
            Icone={Users2}
            rotulo="Aulas no laboratório na semana"
            detalhe={`${gruposHoje.length} hoje`}
            valor={numeros.aulas}
            cor="violet"
            onClick={() => abrir("aulas")}
          />
          <Numero
            Icone={Timer}
            rotulo="Minutos de computador na semana"
            detalhe={`${(numeros.minutos / 60).toFixed(1).replace(".", ",")} h de aula`}
            valor={numeros.minutos}
            cor="amber"
            onClick={() => abrir("tempo")}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8">
            {feriadoHoje ? (
              <div className="grid min-h-72 place-items-center rounded-3xl border border-border bg-card p-5">
                <AvisoFeriado dataISO={hoje} className="w-full max-w-lg" />
              </div>
            ) : (
              <PainelLaboratorioAgora dados={dados} logado={logado} />
            )}
          </div>
          <div className="grid gap-6 sm:grid-cols-2 xl:col-span-4 xl:grid-cols-1 xl:content-start">
            <Placar linhas={placar} aoAbrir={(id) => abrir("alunos", id)} />
            <div className="space-y-6">
              <DicaDoDia />
              <WeatherWidget />
            </div>
          </div>
        </div>

        <QuadroDaSemana
          s0={s0}
          hoje={hoje}
          agora={agora}
          grupos={gruposSemana}
          dataDoGrupo={dataDoGrupo}
          logado={logado}
        />

        <ComoFunciona />
      </div>

      <DetalhesLaboratorio
        aba={detalhe?.aba ?? null}
        turmaInicial={detalhe?.turma ?? null}
        aoFechar={() => setDetalhe(null)}
        sessoes={dados.sessoes}
        ausencias={dados.ausencias ?? []}
        agora={agora}
        s0={s0}
        s1={s1}
        hoje={hoje}
        logado={logado}
      />

      {logado ? (
        <Dialog open={controle !== null} onOpenChange={(v) => (v ? null : setControle(null))}>
          <DialogContent className="flex h-[min(86dvh,820px)] w-[calc(100vw-1rem)] min-w-0 max-w-5xl flex-col gap-2 overflow-hidden rounded-2xl p-3 sm:gap-3 sm:p-5">
            <DialogHeader className="shrink-0 pr-8">
              <DialogTitle>
                {controle === "agendar" ? "Agendar aula no laboratório" : "Inserir alunos na aula"}
              </DialogTitle>
              <DialogDescription>
                {controle === "agendar"
                  ? "Escolha a turma e os alunos e defina a hora de início e de fim."
                  : "Escolha a turma e os alunos. Se já houver aula em andamento, eles entram nela."}
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-width:thin]">
              {controle ? (
                <ControleLaboratorio
                  key={controle}
                  dados={dados}
                  modoInicial={controle === "agendar" ? "horario" : "duracao"}
                  aoMarcar={() => {
                    setControle(null);
                    void dados.recarregar();
                  }}
                />
              ) : null}
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}

/* ───────────────────────── topo ───────────────────────── */

function Cabecalho({
  agora,
  aoVivo,
  proximo,
  gruposHoje,
  logado,
  podeMarcar,
  aoInserir,
  aoAgendar,
}: {
  agora: number;
  aoVivo: number;
  proximo: GrupoLab | undefined;
  gruposHoje: GrupoLab[];
  logado: boolean;
  podeMarcar: boolean;
  aoInserir: () => void;
  aoAgendar: () => void;
}) {
  const data = new Date(agora);
  const [h, m, s] = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: FUSO,
  })
    .format(data)
    .split(":");
  const dataExtenso = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: FUSO,
  }).format(data);

  const feriadoHoje = feriadoNacionalEm(hojeNaEscola());
  const status = feriadoHoje
    ? { texto: "Feriado nacional · Dia de Finados", cor: "bg-amber-400", pulsa: false }
    : aoVivo > 0
      ? {
          texto: aoVivo === 1 ? "Aula acontecendo agora" : `${aoVivo} aulas acontecendo agora`,
          cor: "bg-emerald-400",
          pulsa: true,
        }
      : proximo
        ? {
            texto: `Próxima aula: ${proximo.turmaRotulo} às ${horaNaEscola(proximo.inicio)}`,
            cor: "bg-sun",
            pulsa: false,
          }
        : { texto: "Laboratório livre no momento", cor: "bg-white/60", pulsa: false };

  const flutuantes: { Icone: LucideIcon; classe: string }[] = [
    { Icone: Mouse, classe: "left-[38%] top-[58%] size-9 text-sky-300/40 [animation-delay:0s]" },
    { Icone: Keyboard, classe: "left-[58%] top-[10%] size-10 text-sun/40 [animation-delay:1.2s]" },
    {
      Icone: Gamepad2,
      classe: "right-[30%] bottom-[22%] size-9 text-pink-300/40 [animation-delay:2.1s]",
    },
    {
      Icone: Sparkles,
      classe: "right-[6%] top-[14%] size-8 text-emerald-300/40 [animation-delay:0.6s]",
    },
    {
      Icone: Lightbulb,
      classe: "left-[50%] bottom-[30%] size-8 text-amber-300/40 [animation-delay:1.7s]",
    },
  ];

  return (
    <section className="dark relative isolate overflow-hidden text-white">
      <img
        src={labFotoImg}
        alt=""
        aria-hidden
        className="hero-zoom absolute inset-0 -z-30 size-full object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-gradient-to-br from-ink via-indigo-950/90 to-violet-900/70"
      />
      <div aria-hidden className="fundo-pixel absolute inset-0 -z-10 opacity-25" />
      {flutuantes.map(({ Icone, classe }, i) => (
        <Icone
          key={i}
          aria-hidden
          className={cn("agenda-flutua absolute -z-10 hidden sm:block", classe)}
        />
      ))}

      <div className="mx-auto grid w-full max-w-[1600px] gap-8 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-8 lg:pt-14">
        <div className="hero-subir">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-sun backdrop-blur">
            <MonitorSmartphone className="size-3.5" aria-hidden /> Agenda do laboratório
          </p>
          <h1 className="mt-4 text-balance text-[clamp(2.1rem,5vw,3.8rem)] font-extrabold leading-[1.02] tracking-tight">
            Quem está no{" "}
            <span className="bg-gradient-to-r from-sun via-amber-300 to-pink-300 bg-clip-text text-transparent">
              laboratório
            </span>{" "}
            hoje?
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-white/75">
            Todo dia o professor escolhe quem vai aos computadores. Aqui você acompanha a aula ao
            vivo, vê quem já foi na semana e qual turma está na frente no placar.
          </p>
          <p className="mt-5 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
            <span className="relative flex size-2.5">
              {status.pulsa ? (
                <span className={cn("absolute inset-0 animate-ping rounded-full", status.cor)} />
              ) : null}
              <span className={cn("relative size-2.5 rounded-full", status.cor)} />
            </span>
            {status.texto}
          </p>

          {/* ações do professor */}
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            {logado && podeMarcar ? (
              <>
                <Button
                  size="lg"
                  onClick={aoInserir}
                  className="h-11 rounded-full bg-sun px-5 font-bold text-ink shadow-lg shadow-amber-500/20 hover:bg-amber-300"
                >
                  <UserPlus className="size-4" /> Inserir alunos na aula
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={aoAgendar}
                  className="h-11 rounded-full border-white/25 bg-white/10 px-5 font-bold text-white backdrop-blur hover:bg-white/20 hover:text-white"
                >
                  <CalendarClock className="size-4" /> Agendar aula
                </Button>
              </>
            ) : !logado ? (
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-full border-white/25 bg-white/10 px-4 text-white backdrop-blur hover:bg-white/20 hover:text-white"
              >
                <Link to="/login">
                  Professor(a)? Entre para agendar <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            ) : null}
          </div>

          {gruposHoje.length > 0 ? (
            <ol aria-label="Aulas de hoje" className="mt-5 flex flex-wrap gap-2">
              {gruposHoje.map((g) => {
                const estado = estadoDaSessao(g, agora);
                return (
                  <li
                    key={g.grupoId}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold backdrop-blur",
                      estado === "ao-vivo"
                        ? "border-emerald-300/50 bg-emerald-400/20 text-white"
                        : estado === "encerrada"
                          ? "border-white/10 bg-white/5 text-white/55"
                          : "border-white/20 bg-white/10 text-white/90",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        estado === "ao-vivo"
                          ? "animate-pulse bg-emerald-300"
                          : estado === "encerrada"
                            ? "bg-white/40"
                            : "bg-sun",
                      )}
                    />
                    <span className="tabular-nums">{horaNaEscola(g.inicio)}</span>
                    <span className="font-extrabold">{g.turmaRotulo}</span>
                    <span className="text-white/60">· {g.alunos.length}</span>
                  </li>
                );
              })}
            </ol>
          ) : null}
        </div>

        {/* relógio grande */}
        <div className="hero-subir flex flex-col items-center rounded-3xl border border-white/15 bg-white/[0.07] px-8 py-6 shadow-2xl backdrop-blur-xl [animation-delay:150ms]">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
            <Clock3 className="size-3.5" aria-hidden /> Hora da escola
          </span>
          <p
            className="mt-2 font-mono text-[clamp(3rem,7vw,5.2rem)] font-bold leading-none tabular-nums"
            aria-live="off"
          >
            {h}
            <span className="agenda-pisca text-sun">:</span>
            {m}
            <span className="ml-2 align-top text-[0.35em] text-white/50">{s}</span>
          </p>
          <p className="mt-2 text-sm text-white/70 first-letter:uppercase">{dataExtenso}</p>
        </div>
      </div>
    </section>
  );
}

const CORES_NUMERO = {
  emerald: "from-emerald-500/20 text-emerald-600 dark:text-emerald-300",
  sky: "from-sky-500/20 text-sky-600 dark:text-sky-300",
  violet: "from-violet-500/20 text-violet-600 dark:text-violet-300",
  amber: "from-amber-500/25 text-amber-600 dark:text-amber-300",
  rose: "from-rose-500/20 text-rose-600 dark:text-rose-300",
} as const;

const BARRA_NUMERO = {
  emerald: "from-emerald-400 to-teal-400",
  sky: "from-sky-400 to-cyan-400",
  violet: "from-violet-500 to-fuchsia-400",
  amber: "from-amber-400 to-orange-400",
  rose: "from-rose-500 to-pink-400",
} as const;

function Numero({
  Icone,
  rotulo,
  detalhe,
  valor,
  cor,
  vivo = false,
  onClick,
}: {
  Icone: LucideIcon;
  rotulo: string;
  detalhe?: string | undefined;
  valor: number;
  cor: keyof typeof CORES_NUMERO;
  vivo?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${rotulo}: ${valor}. Ver detalhes`}
      className="hero-subir group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-border/70 bg-card/95 p-4 text-left shadow-lg backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-80",
          BARRA_NUMERO[cor],
        )}
      />
      <span className="flex w-full items-center justify-between">
        <span
          className={cn(
            "relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br to-transparent",
            CORES_NUMERO[cor],
          )}
        >
          <Icone className="size-5" aria-hidden />
          {vivo ? (
            <span className="absolute -right-0.5 -top-0.5 size-3 animate-pulse rounded-full bg-emerald-500 ring-2 ring-card" />
          ) : null}
        </span>
        <span className="flex items-center gap-0.5 text-[11px] font-bold text-muted-foreground opacity-70 transition group-hover:text-primary group-hover:opacity-100">
          Detalhes{" "}
          <ArrowUpRight
            className="size-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </span>
      <span className="min-w-0">
        {/* a chave faz o número "subir" de novo sempre que muda ao vivo */}
        <span
          key={valor}
          className="hero-subir block text-3xl font-extrabold leading-none tabular-nums sm:text-[2.1rem]"
        >
          {valor}
        </span>
        <span className="mt-1.5 block text-xs font-semibold leading-tight text-foreground/80">
          {rotulo}
        </span>
        {detalhe ? (
          <span className="mt-0.5 block text-[11px] leading-tight text-muted-foreground">
            {detalhe}
          </span>
        ) : null}
      </span>
    </button>
  );
}

/* ───────────────────────── placar ───────────────────────── */

const MEDALHAS = ["text-amber-400", "text-slate-400", "text-orange-500"];

function Placar({
  linhas,
  aoAbrir,
}: {
  aoAbrir: (turmaId: string) => void;
  linhas: {
    id: string;
    rotulo: string;
    serie: string;
    foram: number;
    total: number;
    parte: number;
  }[];
}) {
  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card">
      <header className="flex items-center gap-3 bg-gradient-to-r from-amber-400/20 via-amber-300/10 to-transparent px-5 py-4">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-400 text-amber-950 shadow">
          <Trophy className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="font-extrabold">Placar da semana</h2>
          <p className="text-xs text-muted-foreground">
            Toque numa turma para ver quem já foi e quem falta
          </p>
        </div>
      </header>
      <ol className="space-y-2.5 p-5">
        {linhas.length === 0 ? (
          <li className="text-sm text-muted-foreground">
            As turmas aparecem aqui assim que carregarem.
          </li>
        ) : (
          linhas.map((l, i) => {
            const cor = serieClasses(serieIndexPorNumero(l.serie));
            return (
              <li key={l.id} className="lab-aluno" style={{ animationDelay: `${i * 50}ms` }}>
                <button
                  type="button"
                  onClick={() => aoAbrir(l.id)}
                  className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-1 text-left transition hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`${l.rotulo}: ${l.foram} de ${l.total}. Ver detalhes`}
                >
                  <span className="flex w-6 shrink-0 justify-center">
                    {i < 3 && l.foram > 0 ? (
                      <Medal className={cn("size-5", MEDALHAS[i])} aria-label={`${i + 1}º lugar`} />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">{i + 1}º</span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "w-11 shrink-0 rounded-lg py-0.5 text-center text-xs font-extrabold",
                      cor.bg,
                      cor.text,
                    )}
                  >
                    {l.rotulo}
                  </span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 via-violet-500 to-pink-500 transition-[width] duration-700"
                      style={{ width: `${Math.max(l.foram ? 4 : 0, l.parte * 100)}%` }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right text-xs font-semibold tabular-nums text-muted-foreground">
                    {l.foram}/{l.total}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ol>
    </article>
  );
}

/* ───────────────────────── dica do dia ───────────────────────── */

const DICAS: { Icone: LucideIcon; titulo: string; texto: string }[] = [
  {
    Icone: Lock,
    titulo: "Senha é segredo",
    texto: "Senha não se conta nem para o melhor amigo. Só para o pai, a mãe ou o professor.",
  },
  {
    Icone: Keyboard,
    titulo: "Atalho mágico",
    texto: "Ctrl + Z desfaz o último passo. Errou? Volta com dois dedos!",
  },
  {
    Icone: ShieldCheck,
    titulo: "Na dúvida, pergunte",
    texto: "Apareceu uma mensagem estranha ou um prêmio na tela? Chame um adulto antes de clicar.",
  },
  {
    Icone: Mouse,
    titulo: "Clique duplo",
    texto: "Para abrir um programa, clique duas vezes rapidinho no ícone, sem mexer o mouse.",
  },
  {
    Icone: Keyboard,
    titulo: "Letra maiúscula",
    texto: "Segure Shift e aperte a letra. Caps Lock deixa tudo maiúsculo até apertar de novo.",
  },
  {
    Icone: Users2,
    titulo: "Gentileza também é online",
    texto: "Na internet, escreva para os outros do jeito que você gostaria de ler.",
  },
  {
    Icone: Timer,
    titulo: "Pausa para os olhos",
    texto: "A cada 20 minutos de tela, olhe para longe por 20 segundos. Os olhos agradecem.",
  },
  {
    Icone: Sparkles,
    titulo: "Copiar e colar",
    texto: "Ctrl + C copia, Ctrl + V cola. Dá para levar um texto de um lugar para outro.",
  },
  {
    Icone: Gamepad2,
    titulo: "Jogar também ensina",
    texto: "Os jogos da Sala de Jogos treinam leitura, tabuada e raciocínio. Experimente em casa!",
  },
  {
    Icone: Lightbulb,
    titulo: "Salve sempre",
    texto: "Ctrl + S salva o trabalho. Salvar várias vezes evita perder tudo se a luz cair.",
  },
];

function DicaDoDia() {
  const inicio = useMemo(() => {
    const d = new Date();
    const doAno = Math.floor(
      (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000,
    );
    return doAno % DICAS.length;
  }, []);
  const [i, setI] = useState(inicio);
  const dica = DICAS[i]!;
  const mudar = (passo: number) => setI((v) => (v + passo + DICAS.length) % DICAS.length);

  return (
    <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-500 p-5 text-white shadow-lg">
      <Sparkles
        aria-hidden
        className="agenda-flutua absolute -right-3 -top-3 size-20 text-white/15"
      />
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">Dica do dia</p>
      <div key={i} className="hero-subir mt-3 flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/20">
          <dica.Icone className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-extrabold leading-tight">{dica.titulo}</h2>
          <p className="mt-1 text-sm leading-relaxed text-white/85">{dica.texto}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-1" aria-hidden>
          {DICAS.map((_, j) => (
            <span
              key={j}
              className={cn(
                "h-1.5 rounded-full transition-all",
                j === i ? "w-5 bg-white" : "w-1.5 bg-white/40",
              )}
            />
          ))}
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => mudar(-1)}
            aria-label="Dica anterior"
            className="flex size-8 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/30"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => mudar(1)}
            aria-label="Próxima dica"
            className="flex size-8 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/30"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

/* ───────────────────────── semana ───────────────────────── */

function QuadroDaSemana({
  s0,
  hoje,
  agora,
  grupos,
  dataDoGrupo,
  logado,
}: {
  s0: string;
  hoje: string;
  agora: number;
  grupos: GrupoLab[];
  dataDoGrupo: (g: GrupoLab) => string;
  logado: boolean;
}) {
  const dias = DIAS_CURTOS.map((nome, i) => ({ nome, chave: somarDias(s0, i) }));
  const [aberto, setAberto] = useState<string | null>(null);

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Segunda a sexta
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            A semana no laboratório
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">Toque numa aula para ver quem foi.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {dias.map(({ nome, chave }) => {
          const doDia = grupos
            .filter((g) => dataDoGrupo(g) === chave)
            .sort((a, b) => a.inicio.localeCompare(b.inicio));
          const ehHoje = chave === hoje;
          const feriado = feriadoNacionalEm(chave);
          const futuro = chave > hoje;
          const [, mes, dia] = chave.split("-");
          return (
            <article
              key={chave}
              className={cn(
                "flex min-h-28 flex-col rounded-3xl border p-4 transition lg:min-h-48",
                ehHoje
                  ? "border-primary bg-gradient-to-b from-primary/15 to-card shadow-lg ring-2 ring-primary/30"
                  : futuro
                    ? "border-dashed border-border bg-card/50"
                    : "border-border bg-card",
              )}
            >
              <header className="mb-3 flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tabular-nums leading-none">{dia}</span>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {nome} · {mes}
                  </span>
                </div>
                {ehHoje ? (
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold uppercase text-primary-foreground">
                    Hoje
                  </span>
                ) : null}
              </header>
              {feriado ? (
                <p className="m-auto rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-3 text-center text-sm font-bold text-amber-800 dark:text-amber-200">
                  Dia de Finados · Sem aulas regulares
                </p>
              ) : doDia.length === 0 ? (
                <p className="m-auto text-center text-sm text-muted-foreground">
                  {futuro
                    ? "Ainda sem aula marcada"
                    : ehHoje
                      ? "Nenhuma aula por enquanto"
                      : "Sem laboratório neste dia"}
                </p>
              ) : (
                <ul className="space-y-2">
                  {doDia.map((g) => {
                    const estado = estadoDaSessao(g, agora);
                    const cor = corDaTurma(g.turmaRotulo);
                    const presentes = g.alunos.filter((a) => a.ausencia === null && !a.semMarcacao);
                    const abertoAqui = aberto === g.grupoId;
                    return (
                      <li key={g.grupoId}>
                        <button
                          type="button"
                          onClick={() => setAberto(abertoAqui ? null : g.grupoId)}
                          aria-expanded={abertoAqui}
                          className={cn(
                            "w-full rounded-2xl border p-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-md",
                            estado === "ao-vivo"
                              ? "border-emerald-500/60 bg-emerald-500/10"
                              : "border-border/70 bg-background/60",
                          )}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                "rounded-lg px-2 py-0.5 text-xs font-extrabold",
                                cor.bg,
                                cor.text,
                              )}
                            >
                              {g.turmaRotulo}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-semibold tabular-nums text-muted-foreground">
                              {estado === "ao-vivo" ? (
                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />{" "}
                                  ao vivo
                                </span>
                              ) : (
                                <>
                                  {horaNaEscola(g.inicio)}–{horaNaEscola(g.fim)}
                                </>
                              )}
                            </span>
                          </span>
                          <span className="mt-2 flex items-center gap-2">
                            <span className="flex -space-x-1.5">
                              {presentes.slice(0, 5).map((a) => (
                                <span
                                  key={a.sessaoId}
                                  className="flex size-6 items-center justify-center rounded-full border-2 border-card bg-gradient-to-br from-sky-400 to-violet-500 text-[10px] font-bold text-white"
                                >
                                  {a.nome.trim().charAt(0).toUpperCase()}
                                </span>
                              ))}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {presentes.length} {presentes.length === 1 ? "aluno" : "alunos"}
                            </span>
                          </span>
                          {abertoAqui ? (
                            <span className="mt-2 block border-t border-border/70 pt-2 text-xs leading-relaxed text-muted-foreground">
                              {presentes.map((a) => nomeExibido(a.nome, logado)).join(", ") ||
                                "Ninguém registrado"}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ───────────────────────── como funciona ───────────────────────── */

function ComoFunciona() {
  const passos: { Icone: LucideIcon; titulo: string; texto: string; cor: string }[] = [
    {
      Icone: UserCheck,
      titulo: "O professor escolhe",
      texto: "A cada dia, um grupo da turma vai ao laboratório.",
      cor: "from-sky-500 to-cyan-400",
    },
    {
      Icone: Timer,
      titulo: "Aula com relógio",
      texto: "Cada grupo tem um tempo certo nos computadores, contado ao vivo aqui.",
      cor: "from-violet-500 to-fuchsia-400",
    },
    {
      Icone: RefreshCw,
      titulo: "Todo mundo passa",
      texto: "Quem já foi na semana espera a vez dos colegas. Ninguém fica de fora.",
      cor: "from-amber-500 to-orange-400",
    },
  ];
  return (
    <section className="grid gap-3 rounded-3xl border border-border bg-card/70 p-5 sm:grid-cols-3 sm:p-6">
      {passos.map(({ Icone, titulo, texto, cor }, i) => (
        <div key={titulo} className="flex items-start gap-3">
          <span
            className={cn(
              "relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow",
              cor,
            )}
          >
            <Icone className="size-6" aria-hidden />
            <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
              {i + 1}
            </span>
          </span>
          <div>
            <h3 className="font-bold">{titulo}</h3>
            <p className="text-sm text-muted-foreground">{texto}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
