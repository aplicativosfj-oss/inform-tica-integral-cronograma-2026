import { useLocation } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { useAppStore } from "@/lib/app-store";
import { lerAlunoSessao } from "@/lib/aluno-session";
import {
  agoraNaEscola,
  aplicarExcecoesDeData,
  buildWeeklySchedule,
  currentWeekdayLabel,
  getWeekIndex,
  reprogramacoesParaData,
  suspensaoKey,
  toDateKey,
} from "@/lib/schedule-engine";
import type { Assignment } from "@/lib/types";
import { cn } from "@/lib/utils";

const ANTECEDENCIA_SEGUNDOS = 120;

type TipoAviso = "inicio" | "fim";

interface Aviso {
  chave: string;
  tipo: TipoAviso;
  turmaId: string | null;
  turmaNome: string;
  horario: string;
  segundos: number;
}

function paraSegundos(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  return (Number(h ?? 0) * 60 + Number(m ?? 0)) * 60;
}

function nomeDaAula(a: Assignment): string {
  return a.misto ? "Horário misto" : `${a.turma.serie} "${a.turma.letra}"`;
}

/** Selo em SVG: sino no início da aula, ampulheta no fim. */
function Selo({ tipo }: { tipo: TipoAviso }) {
  const id = `selo-${tipo}`;
  const inicio = tipo === "inicio";
  return (
    <svg viewBox="0 0 64 64" className="size-14 shrink-0" role="img" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={inicio ? "#34d399" : "#fbbf24"} />
          <stop offset="1" stopColor={inicio ? "#0d9488" : "#f97316"} />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill={`url(#${id})`} />
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="none"
        stroke="white"
        strokeOpacity=".35"
        strokeWidth="2"
      />
      {inicio ? (
        <g
          fill="none"
          stroke="white"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="M20 40h24c-3-3-4-6-4-11 0-5-3-9-8-9s-8 4-8 9c0 5-1 8-4 11z"
            fill="white"
            fillOpacity=".25"
          />
          <path d="M28 44a4 4 0 0 0 8 0" />
          <path d="M32 16v4" />
        </g>
      ) : (
        <g
          fill="none"
          stroke="white"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 16h20M22 48h20" />
          <path
            d="M24 16c0 9 8 10 8 16s-8 7-8 16M40 16c0 9-8 10-8 16s8 7 8 16"
            fill="white"
            fillOpacity=".2"
          />
        </g>
      )}
    </svg>
  );
}

/**
 * Aviso discreto (canto da tela, não bloqueia nada) 2 minutos antes de uma
 * aula começar e 2 minutos antes de terminar. Aluno com a Área do Aluno
 * aberta é chamado pelo nome e só recebe o aviso da própria turma — os
 * demais não são incomodados.
 */
export function AvisoAulaEmBreve() {
  const { turmas, config, isReady } = useAppStore();
  const { pathname } = useLocation();
  const [agora, setAgora] = useState<Date | null>(null);
  const [dispensados, setDispensados] = useState<Set<string>>(new Set());

  useEffect(() => {
    setAgora(agoraNaEscola());
    const id = window.setInterval(() => setAgora(agoraNaEscola()), 5000);
    return () => window.clearInterval(id);
  }, []);

  if (!agora || !isReady || pathname.startsWith("/dashboard") || pathname.startsWith("/tv")) {
    return null;
  }

  const dateKey = toDateKey(agora);
  const dia = currentWeekdayLabel(agora);
  const agoraSeg = agora.getHours() * 3600 + agora.getMinutes() * 60 + agora.getSeconds();
  const reprogramadas = reprogramacoesParaData(turmas, config, agora);
  const aulas = [
    ...reprogramadas,
    ...aplicarExcecoesDeData(
      buildWeeklySchedule(turmas, config, getWeekIndex(agora)),
      config,
      turmas,
      dateKey,
    ),
  ].filter(
    (a) =>
      a.dia === dia &&
      (reprogramadas.includes(a) ||
        !config.suspensoes?.[suspensaoKey(dateKey, a.dia, a.slot.inicio)]),
  );

  let aviso: Aviso | null = null;
  for (const a of aulas) {
    const faltaInicio = paraSegundos(a.slot.inicio) - agoraSeg;
    const faltaFim = paraSegundos(a.slot.fim) - agoraSeg;
    const turmaId = a.misto ? null : a.turma.id;
    if (faltaInicio > 0 && faltaInicio <= ANTECEDENCIA_SEGUNDOS) {
      aviso = {
        chave: `${dateKey}|inicio|${a.slot.inicio}|${a.turma.id}`,
        tipo: "inicio",
        turmaId,
        turmaNome: nomeDaAula(a),
        horario: a.slot.inicio,
        segundos: faltaInicio,
      };
      break;
    }
    if (faltaFim > 0 && faltaFim <= ANTECEDENCIA_SEGUNDOS && faltaInicio <= 0) {
      aviso = {
        chave: `${dateKey}|fim|${a.slot.fim}|${a.turma.id}`,
        tipo: "fim",
        turmaId,
        turmaNome: nomeDaAula(a),
        horario: a.slot.fim,
        segundos: faltaFim,
      };
      break;
    }
  }
  if (!aviso || dispensados.has(aviso.chave)) return null;

  const aluno = lerAlunoSessao();
  if (aluno && aluno.turmaId !== aviso.turmaId) return null;
  const primeiroNome = aluno ? aluno.nome.trim().split(/\s+/)[0] : null;

  const inicio = aviso.tipo === "inicio";
  const minutos = Math.max(1, Math.ceil(aviso.segundos / 60));
  const quando = `em ${minutos} ${minutos === 1 ? "minuto" : "minutos"}`;
  const titulo = primeiroNome
    ? inicio
      ? `${primeiroNome}, sua aula de informática começa ${quando}`
      : `${primeiroNome}, sua aula termina ${quando}`
    : inicio
      ? `Aula de informática começa ${quando}`
      : `Aula de informática termina ${quando}`;
  const texto = primeiroNome
    ? inicio
      ? "Prepare-se e dirija-se ao laboratório com calma."
      : "Vá salvando seu trabalho e organize seu lugar."
    : inicio
      ? `${aviso.turmaNome} entra no laboratório às ${aviso.horario}.`
      : `${aviso.turmaNome} encerra a aula às ${aviso.horario}.`;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 bottom-3 z-50 flex justify-center sm:inset-x-auto sm:right-4 sm:justify-end"
    >
      <div
        className={cn(
          "pointer-events-auto relative flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-2xl border bg-card/95 p-3.5 pr-9 shadow-2xl backdrop-blur",
          inicio
            ? "border-emerald-500/40 shadow-emerald-900/20"
            : "border-amber-500/40 shadow-amber-900/20",
        )}
      >
        <div
          aria-hidden
          className={cn(
            "absolute inset-y-0 left-0 w-1",
            inicio
              ? "bg-gradient-to-b from-emerald-400 to-teal-600"
              : "bg-gradient-to-b from-amber-400 to-orange-500",
          )}
        />
        <Selo tipo={aviso.tipo} />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {inicio ? "Aviso de início" : "Aviso de encerramento"}
            {primeiroNome ? ` · ${aviso.turmaNome}` : ""}
          </p>
          <p className="text-sm font-bold leading-snug text-foreground">{titulo}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{texto}</p>
        </div>
        <button
          type="button"
          aria-label="Dispensar aviso"
          onClick={() => setDispensados((prev) => new Set(prev).add(aviso.chave))}
          className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
