import { Link } from "@tanstack/react-router";
import { CalendarX2, ChevronRight, Clock3, MonitorPlay, X } from "lucide-react";

import { useAulaAgora, type EstadoLaboratorio } from "@/lib/use-aula-agora";
import { usePersistentState } from "@/lib/use-persistent-state";
import { cn } from "@/lib/utils";

const ESTILO: Record<EstadoLaboratorio, { fundo: string; rotulo: string }> = {
  "em-aula": {
    fundo: "bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700",
    rotulo: "Em aula agora",
  },
  encerrando: {
    fundo: "bg-gradient-to-r from-amber-800 via-amber-700 to-orange-700",
    rotulo: "Encerrando",
  },
  suspensa: {
    fundo: "bg-gradient-to-r from-rose-800 via-rose-700 to-pink-700",
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
 *
 * O "x" fecha o aviso, e o que fica guardado é **qual** aviso foi fechado,
 * não um simples "escondido". Assim a faixa some enquanto durar aquele
 * anúncio (uma aula suspensa que ocupa a tarde inteira, por exemplo) e volta
 * sozinha quando muda a turma, o horário ou a situação do laboratório — sem
 * que ninguém precise lembrar de reabrir nada.
 */
export function FaixaAulaAgora() {
  const aula = useAulaAgora();
  const [ocultada, setOcultada] = usePersistentState<string | null>("faixa-aula-oculta", null);
  if (!aula) return null;
  const identidade = [
    aula.estado,
    aula.turma ?? "",
    aula.inicio ?? "",
    aula.grupo ?? "",
    aula.rodadaSuspensa ? "rodada" : "",
  ].join("|");
  if (ocultada === identidade) return null;
  const estilo = ESTILO[aula.estado];
  const aoVivo = aula.estado === "em-aula" || aula.estado === "encerrando";
  const Icone =
    aula.estado === "suspensa" ? CalendarX2 : aula.estado === "livre" ? Clock3 : MonitorPlay;

  return (
    <div className={cn("relative text-white shadow-inner", estilo.fundo)}>
      <Link
        to="/"
        hash="aula-ao-vivo"
        className="group block transition-[filter] hover:brightness-110"
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
          {/* Espaço reservado para o "x", que fica fora do link. */}
          <span className="w-5 shrink-0" aria-hidden />
        </div>
      </Link>

      <button
        type="button"
        onClick={() => setOcultada(identidade)}
        aria-label="Ocultar este aviso"
        title="Ocultar este aviso"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white/80 transition hover:bg-black/25 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-3"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
