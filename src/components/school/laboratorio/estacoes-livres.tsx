import { CalendarClock, CheckCircle2, Monitor, Users2 } from "lucide-react";

import { useAppStore } from "@/lib/app-store";
import {
  estadoDaSessao,
  hojeNaEscola,
  horaNaEscola,
  instanteNaEscola,
  type GrupoLab,
} from "@/lib/laboratorio";
import { cn } from "@/lib/utils";

const rotulo = (g: GrupoLab) => (g.turmaId === "mista" ? "Aula mista" : g.turmaRotulo);

/**
 * As estações do laboratório vistas de cima, numeradas, cada uma dizendo que
 * está livre. Superfícies lisas, sem brilho nem animação.
 */
export function MapaEstacoes({
  escuro = false,
  compacto = false,
}: {
  /** Sobre fundo escuro (abertura da página inicial). */
  escuro?: boolean;
  compacto?: boolean;
}) {
  const { config } = useAppStore();
  const n = Math.min(12, Math.max(1, config.numeroComputadores || 7));
  return (
    <ul
      aria-label={`${n} estações livres`}
      className="grid gap-1.5 sm:gap-2"
      style={{ gridTemplateColumns: `repeat(${Math.min(n, compacto ? 7 : 12)}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: n }, (_, i) => (
        <li
          key={i}
          className={cn(
            "flex flex-col items-center gap-1 rounded-xl border text-center",
            compacto ? "px-1 py-1.5" : "px-1 py-2.5",
            escuro ? "border-white/12 bg-white/[0.06]" : "border-border bg-muted/40",
          )}
        >
          <span className="relative">
            <Monitor
              className={cn(
                compacto ? "size-4" : "size-5",
                escuro ? "text-white/80" : "text-foreground/70",
              )}
              aria-hidden
            />
            <span
              className={cn(
                "absolute -right-1 -top-0.5 size-1.5 rounded-full bg-emerald-500 ring-2",
                escuro ? "ring-ink" : "ring-card",
              )}
            />
          </span>
          <span
            className={cn(
              "font-mono text-[10px] font-bold tabular-nums leading-none",
              escuro ? "text-white/70" : "text-muted-foreground",
            )}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Linha do dia: o horário da escola de ponta a ponta, as aulas que já
 * passaram e as que vêm, e um marcador de "agora".
 */
export function LinhaDoDia({
  grupos,
  agora,
  escuro = false,
}: {
  grupos: GrupoLab[];
  agora: number;
  escuro?: boolean;
}) {
  const { config } = useAppStore();
  const hoje = hojeNaEscola();
  const ini = instanteNaEscola(hoje, config.horaInicio || "07:30").getTime();
  const fim = instanteNaEscola(hoje, config.horaFim || "14:30").getTime();
  const total = Math.max(1, fim - ini);
  const pos = (t: number) => Math.min(100, Math.max(0, ((t - ini) / total) * 100));
  const horas: number[] = [];
  for (let t = Math.ceil(ini / 3_600_000) * 3_600_000; t <= fim; t += 3_600_000) horas.push(t);
  const agoraPct = agora >= ini && agora <= fim ? pos(agora) : null;

  return (
    <div>
      <div
        className={cn(
          "relative h-3 overflow-hidden rounded-full",
          escuro ? "bg-white/10" : "bg-muted",
        )}
      >
        {grupos.map((g) => {
          const e = estadoDaSessao(g, agora);
          const a = pos(new Date(g.inicio).getTime());
          const b = pos(new Date(g.fim).getTime());
          return (
            <span
              key={g.grupoId}
              title={`${rotulo(g)} · ${horaNaEscola(g.inicio)}–${horaNaEscola(g.fim)}`}
              className={cn(
                "absolute inset-y-0 rounded-full",
                e === "encerrada"
                  ? "bg-primary/70"
                  : e === "ao-vivo"
                    ? "bg-emerald-500"
                    : "bg-amber-400",
              )}
              style={{ left: `${a}%`, width: `${Math.max(1.2, b - a)}%` }}
            />
          );
        })}
      </div>
      <div className="relative mt-1 h-4">
        {agoraPct !== null ? (
          <span
            className="absolute -top-[1.1rem] flex -translate-x-1/2 flex-col items-center"
            style={{ left: `${agoraPct}%` }}
            aria-hidden
          >
            <span className={cn("h-5 w-0.5 rounded-full", escuro ? "bg-white" : "bg-foreground")} />
          </span>
        ) : null}
        {horas.map((t) => (
          <span
            key={t}
            className={cn(
              "absolute top-0.5 -translate-x-1/2 font-mono text-[10px] tabular-nums",
              escuro ? "text-white/50" : "text-muted-foreground",
            )}
            style={{ left: `${pos(t)}%` }}
          >
            {horaNaEscola(t).slice(0, 2)}h
          </span>
        ))}
      </div>
      <div
        className={cn(
          "mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px]",
          escuro ? "text-white/60" : "text-muted-foreground",
        )}
      >
        <Legenda cor="bg-primary/70">já passaram</Legenda>
        <Legenda cor="bg-amber-400">marcadas</Legenda>
        <Legenda cor={escuro ? "bg-white" : "bg-foreground"} fina>
          agora
        </Legenda>
      </div>
    </div>
  );
}

function Legenda({
  cor,
  fina = false,
  children,
}: {
  cor: string;
  fina?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("rounded-full", fina ? "h-3 w-0.5" : "h-2 w-3.5", cor)} />
      {children}
    </span>
  );
}

/**
 * Cartão de "laboratório livre" do painel: estado, próxima aula, as estações
 * prontas e a linha do dia. Substitui a arte antiga com fundo de grade e
 * faixa de luz.
 */
export function CartaoLaboratorioLivre({
  grupos,
  agora,
  alunosHoje,
  compacto = false,
  cheio = false,
}: {
  /** Aulas de hoje (todas). */
  grupos: GrupoLab[];
  agora: number;
  alunosHoje: number;
  compacto?: boolean;
  cheio?: boolean;
}) {
  const { config } = useAppStore();
  const n = Math.min(12, Math.max(1, config.numeroComputadores || 7));
  const proximo = grupos.find((g) => estadoDaSessao(g, agora) === "agendada") ?? null;
  const encerradas = grupos.filter((g) => estadoDaSessao(g, agora) === "encerrada").length;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card",
        compacto ? "p-3.5 sm:p-4" : "p-4 sm:p-5",
        cheio && "lg:flex lg:h-full lg:flex-col",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-3.5" aria-hidden /> Laboratório livre
          </span>
          <p
            className={cn(
              "mt-2 font-heading font-extrabold leading-tight tracking-tight",
              compacto ? "text-lg" : "text-xl sm:text-2xl",
            )}
          >
            {n} estações prontas para a próxima turma
          </p>
        </div>
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-xl border px-3 py-2",
            proximo ? "border-amber-500/30 bg-amber-500/10" : "border-border bg-muted/40",
          )}
        >
          <CalendarClock
            className={cn("size-5 shrink-0", proximo ? "text-amber-500" : "text-muted-foreground")}
            aria-hidden
          />
          <div className="leading-tight">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Próxima aula
            </p>
            <p className="text-sm font-bold">
              {proximo ? `${rotulo(proximo)} · ${horaNaEscola(proximo.inicio)}` : "Nenhuma marcada"}
            </p>
          </div>
        </div>
      </div>

      <div className={cn(compacto ? "mt-3" : "mt-4", cheio && "lg:flex-1")}>
        <MapaEstacoes compacto={compacto} />
      </div>

      <div className={cn("border-t border-border/70", compacto ? "mt-3 pt-3" : "mt-4 pt-4")}>
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Hoje no laboratório
          </p>
          <div className="flex gap-1.5 text-xs font-semibold">
            <span className="rounded-full bg-muted px-2.5 py-0.5">
              {encerradas} aula{encerradas === 1 ? "" : "s"} concluída{encerradas === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5">
              <Users2 className="size-3" aria-hidden /> {alunosHoje} aluno
              {alunosHoje === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <LinhaDoDia grupos={grupos} agora={agora} />
      </div>
    </div>
  );
}
