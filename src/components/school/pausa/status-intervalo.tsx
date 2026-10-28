import { CalendarCheck, CheckCircle2, Clock, Radio } from "lucide-react";

import { DIAS, HORARIO, quandoEhProximo, type MomentoIntervalo } from "@/lib/entre-turnos";
import { cn } from "@/lib/utils";

/** Selo curto com a fase do intervalo: começa às 11h, acontecendo agora, encerrado. */
export function SeloIntervalo({ m, className }: { m: MomentoIntervalo; className?: string }) {
  const { texto, cor, Icone, pulsa } = {
    antes: {
      texto: `Começa às ${HORARIO.inicio}`,
      cor: "bg-white/10 text-white",
      Icone: Clock,
      pulsa: false,
    },
    agora: {
      texto: `Acontecendo agora · até as ${HORARIO.fim}`,
      cor: "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/40",
      Icone: Radio,
      pulsa: true,
    },
    encerrado: {
      texto: `Encerrado hoje · ${quandoEhProximo(m)} já está programado`,
      cor: "bg-sky-400/15 text-sky-100 ring-1 ring-sky-400/40",
      Icone: CheckCircle2,
      pulsa: false,
    },
    "fim-de-semana": {
      texto: `Fim de semana · ${quandoEhProximo(m)} já está programado`,
      cor: "bg-sky-400/15 text-sky-100 ring-1 ring-sky-400/40",
      Icone: CalendarCheck,
      pulsa: false,
    },
  }[m.fase];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold",
        cor,
        className,
      )}
    >
      {pulsa ? (
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
        </span>
      ) : (
        <Icone className="size-3.5" aria-hidden />
      )}
      {texto}
    </span>
  );
}

/**
 * Destaque mostrado depois das 13h (e no fim de semana): o intervalo de hoje
 * acabou e o próximo já está programado logo abaixo.
 */
export function AvisoDiaEncerrado({ m }: { m: MomentoIntervalo }) {
  const fimDeSemana = m.fase === "fim-de-semana";
  const proximoNome = DIAS.find((d) => d.dia === m.proximo)!.nome;
  return (
    <div className="relative isolate overflow-hidden rounded-3xl border border-sky-400/30 bg-gradient-to-r from-sky-500/20 via-indigo-500/10 to-transparent p-5 sm:p-6">
      <div
        aria-hidden
        className="absolute -left-10 -top-10 -z-10 size-40 rounded-full bg-sky-400/20 blur-3xl"
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-sky-400/20 ring-1 ring-sky-300/40">
          {fimDeSemana ? (
            <CalendarCheck className="size-7 text-sky-700 dark:text-sky-200" aria-hidden />
          ) : (
            <CheckCircle2 className="size-7 text-sky-700 dark:text-sky-200" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-200">
            {fimDeSemana ? "Bom fim de semana" : "Encerrado por hoje"}
          </p>
          <p className="mt-1 text-lg font-extrabold leading-snug sm:text-xl">
            {fimDeSemana
              ? "Sem intervalo no fim de semana."
              : "O Entre Turnos de hoje terminou e as turmas voltaram para as aulas da tarde."}{" "}
            <span className="text-amber-600 dark:text-sun">
              {m.proximoEhAmanha ? "Amanhã" : `Na ${proximoNome.toLowerCase()}`} já está tudo
              programado.
            </span>
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-2xl bg-muted px-4 py-2 text-sm font-bold sm:self-center">
          <CalendarCheck className="size-4 text-amber-600 dark:text-sun" aria-hidden />
          {proximoNome} · {HORARIO.inicio} às {HORARIO.fim}
        </span>
      </div>
    </div>
  );
}
