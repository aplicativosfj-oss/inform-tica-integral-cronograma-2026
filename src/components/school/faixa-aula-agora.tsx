import { Link } from "@tanstack/react-router";
import { CalendarX2, ChevronRight, Clock3, MonitorPlay } from "lucide-react";

import { useAulaAgora, type EstadoLaboratorio } from "@/lib/use-aula-agora";
import { cn } from "@/lib/utils";

const ESTILO: Record<EstadoLaboratorio, { fundo: string; rotulo: string }> = {
  "em-aula": {
    fundo: "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500",
    rotulo: "Em aula agora",
  },
  encerrando: {
    fundo: "bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500",
    rotulo: "Encerrando",
  },
  suspensa: {
    fundo: "bg-gradient-to-r from-rose-700 via-rose-600 to-pink-600",
    rotulo: "Aula suspensa",
  },
  livre: {
    fundo: "bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700",
    rotulo: "Laboratório livre",
  },
};

/**
 * Faixa colorida logo abaixo do menu, em todas as páginas públicas: diz a
 * qualquer visitante qual turma está no laboratório neste momento. Verde =
 * em aula, âmbar = últimos 5 minutos, vermelho = suspensa, cinza = livre.
 * Some fora do horário escolar.
 */
export function FaixaAulaAgora() {
  const aula = useAulaAgora();
  if (!aula) return null;
  const estilo = ESTILO[aula.estado];
  const aoVivo = aula.estado === "em-aula" || aula.estado === "encerrando";
  const Icone =
    aula.estado === "suspensa" ? CalendarX2 : aula.estado === "livre" ? Clock3 : MonitorPlay;

  return (
    <Link
      to="/"
      hash="aula-ao-vivo"
      className={cn(
        "group block text-white shadow-inner transition-[filter] hover:brightness-110",
        estilo.fundo,
      )}
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-[90rem] items-center gap-2.5 px-3 py-1.5 text-[13px] sm:gap-3 sm:px-6">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-black/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider">
          {aoVivo ? (
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-white" />
            </span>
          ) : (
            <Icone className="size-3.5" />
          )}
          {aula.rodadaSuspensa ? "Rodada suspensa" : estilo.rotulo}
        </span>

        <span className="min-w-0 flex-1 truncate">
          {aula.estado === "livre" ? (
            aula.proxima ? (
              <>
                Próxima turma: <strong>{aula.proxima.turma}</strong> às{" "}
                <strong className="font-mono">{aula.proxima.inicio}</strong>
              </>
            ) : (
              "Sem mais aulas de informática hoje"
            )
          ) : (
            <>
              <strong className="text-sm">{aula.turma}</strong>
              <span className="opacity-90">
                {" "}
                · {aula.inicio}–{aula.fim}
                {aula.grupo ? ` · ${aula.grupo}ª rodada de ${aula.totalGrupos}` : ""}
                {aoVivo && aula.minutosRestantes !== undefined
                  ? ` · termina em ${aula.minutosRestantes} min`
                  : ""}
              </span>
            </>
          )}
        </span>

        <span className="hidden shrink-0 items-center gap-0.5 text-xs font-semibold opacity-90 group-hover:opacity-100 sm:inline-flex">
          {aoVivo ? "Acompanhar ao vivo" : "Ver agenda"} <ChevronRight className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}
