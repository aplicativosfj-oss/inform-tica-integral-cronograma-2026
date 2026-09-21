import { useEffect, useState } from "react";

import { useAppStore } from "@/lib/app-store";
import {
  aplicarExcecoesDeData,
  buildWeeklySchedule,
  currentWeekdayLabel,
  findSessaoAtual,
  getWeekIndex,
  nextAssignmentsForDay,
  reprogramacoesParaData,
  suspensaoKey,
  toDateKey,
} from "@/lib/schedule-engine";

export type EstadoLaboratorio = "em-aula" | "encerrando" | "suspensa" | "livre";

export interface AulaAgora {
  estado: EstadoLaboratorio;
  /** Ex.: `1º Ano "B"` — ou as turmas de um horário misto. */
  turma?: string;
  /** Rodada (1ª, 2ª, 3ª…) dentro do horário da turma. */
  grupo?: number;
  totalGrupos?: number;
  inicio?: string;
  fim?: string;
  /** Minutos até o fim da aula da turma. */
  minutosRestantes?: number;
  proxima?: { turma: string; inicio: string } | undefined;
}

function minutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * Situação do laboratório agora, para indicadores públicos. Devolve `null`
 * fora do horário escolar (fim de semana, antes da primeira e depois da
 * última aula) — aí não há o que anunciar. Atualiza a cada 15 segundos.
 */
export function useAulaAgora(): AulaAgora | null {
  const { turmas, config, isReady } = useAppStore();
  const [agora, setAgora] = useState<Date | null>(null);

  useEffect(() => {
    setAgora(new Date());
    const id = window.setInterval(() => setAgora(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  if (!agora || !isReady) return null;
  const dia = currentWeekdayLabel(agora);
  if (!config.diasSemana.includes(dia)) return null;
  const agoraMin = agora.getHours() * 60 + agora.getMinutes();
  if (agoraMin < minutos(config.horaInicio) || agoraMin >= minutos(config.horaFim)) return null;

  const dataKey = toDateKey(agora);
  const semana = aplicarExcecoesDeData(
    buildWeeklySchedule(turmas, config, getWeekIndex(agora)),
    config,
    turmas,
    dataKey,
  );
  const reposicoes = reprogramacoesParaData(turmas, config, agora);
  const nomeDe = (a: (typeof semana)[number]) =>
    a.misto
      ? a.misto.map((m) => `${m.turma.serie} "${m.turma.letra}"`).join(" + ")
      : `${a.turma.serie} "${a.turma.letra}"`;

  const proximaAula = nextAssignmentsForDay([...reposicoes, ...semana], dia).find(
    (a) =>
      minutos(a.slot.inicio) > agoraMin &&
      !config.suspensoes?.[suspensaoKey(dataKey, a.dia, a.slot.inicio)],
  );
  const proxima = proximaAula
    ? { turma: nomeDe(proximaAula), inicio: proximaAula.slot.inicio }
    : undefined;

  const sessao = findSessaoAtual(semana, config, agora, reposicoes);
  if (!sessao) return { estado: "livre", proxima };

  const { assignment, subBloco } = sessao;
  const base = {
    turma: subBloco.turma
      ? `${subBloco.turma.serie} "${subBloco.turma.letra}"`
      : nomeDe(assignment),
    inicio: assignment.slot.inicio,
    fim: assignment.slot.fim,
    proxima,
  };
  if (sessao.suspensa) return { estado: "suspensa", ...base };

  const restantes = minutos(assignment.slot.fim) - agoraMin;
  const passo = Math.max(1, config.duracaoGrupoMinutos);
  return {
    estado: restantes <= 5 ? "encerrando" : "em-aula",
    ...base,
    grupo: subBloco.indice + 1,
    totalGrupos: Math.max(
      1,
      Math.round((minutos(assignment.slot.fim) - minutos(assignment.slot.inicio)) / passo),
    ),
    minutosRestantes: restantes,
  };
}
