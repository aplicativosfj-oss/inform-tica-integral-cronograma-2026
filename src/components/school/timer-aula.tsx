import { useEffect, useRef } from "react";

import { playFimDeAula } from "@/lib/alert-sound";
import { imagemDaSerie } from "@/lib/serie-imagens";
import { cn } from "@/lib/utils";

export interface TimerAulaProps {
  /** Segundos já decorridos do grupo da vez. */
  decorridosGrupo: number;
  /** Duração total do grupo da vez, em segundos. */
  totalGrupo: number;
  /** Segundos já decorridos da turma inteira. */
  decorridosTurma: number;
  /** Duração total da turma, em segundos. */
  totalTurma: number;
  grupoAtual: number;
  totalGrupos: number;
  serie: string;
  letra: string;
  conteudo?: string;
  /** Início e fim da turma, em HH:MM, para as marcas da régua. */
  inicioTurma: string;
  fimTurma: string;
  /** Toca o sinal de encerramento. O professor precisa ter liberado o áudio. */
  comSom?: boolean;
  className?: string;
}

function relogio(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Faixa de âmbar nos últimos 5 minutos, vermelha no último. */
function estadoDaTurma(restanteTurma: number): "normal" | "atencao" | "critico" {
  if (restanteTurma <= 60) return "critico";
  if (restanteTurma <= 300) return "atencao";
  return "normal";
}

/**
 * Relógio da aula ao vivo. Mostra a hora inteira da turma numa régua, com a
 * posição atual, o revezamento dos grupos e a turma seguinte — em vez de só
 * "quanto falta", que não diz se o fim é do grupo ou da aula.
 *
 * A régua tem um degradê fixo (verde → âmbar → vermelho) revelado pela
 * largura do preenchimento. Assim a cor da ponta é a própria posição no
 * tempo: no começo só aparece verde, perto do fim o vermelho entra sozinho.
 * Colorir o preenchimento inteiro de uma cor só perderia isso.
 */
export function TimerAula({
  decorridosGrupo,
  totalGrupo,
  decorridosTurma,
  totalTurma,
  grupoAtual,
  totalGrupos,
  serie,
  letra,
  conteudo,
  inicioTurma,
  fimTurma,
  comSom = false,
  className,
}: TimerAulaProps) {
  const restanteGrupo = Math.max(0, totalGrupo - decorridosGrupo);
  const restanteTurma = Math.max(0, totalTurma - decorridosTurma);
  const estado = estadoDaTurma(restanteTurma);
  const progresso = Math.min(100, Math.max(0, (decorridosTurma / Math.max(1, totalTurma)) * 100));
  const jaTocou = useRef(false);

  useEffect(() => {
    if (!comSom || restanteTurma > 0 || jaTocou.current) return;
    jaTocou.current = true;
    playFimDeAula();
  }, [comSom, restanteTurma]);

  // Uma aula nova rearma o sinal, senão só tocaria na primeira do dia.
  useEffect(() => {
    jaTocou.current = false;
  }, [inicioTurma, serie, letra]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card transition-colors duration-500",
        estado === "normal" && "border-border/60",
        estado === "atencao" && "border-amber-500",
        estado === "critico" && "border-rose-600 dark:border-rose-400",
        className,
      )}
    >
      <div className="relative h-36 sm:h-44">
        <img
          src={imagemDaSerie(serie)}
          alt={`Alunos do ${serie} no laboratório de informática`}
          className="size-full object-cover"
          loading="lazy"
          decoding="async"
        />
        {/* Escurece forte à esquerda e quase nada à direita: o texto fica
            legível sem apagar o rosto das crianças na foto. */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/20" />
        <div className="absolute inset-0 flex flex-col justify-center px-5">
          <span
            className={cn(
              "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              estado === "normal" && "bg-teal-100 text-teal-900",
              estado === "atencao" && "bg-amber-100 text-amber-900",
              estado === "critico" && "bg-rose-100 text-rose-900",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full bg-current",
                estado !== "normal" && "animate-pulse",
              )}
            />
            {estado === "critico"
              ? "Encerrando"
              : estado === "atencao"
                ? "Faltam 5 min"
                : "Em aula"}
          </span>
          <p className="mt-2 text-lg font-semibold text-white sm:text-xl">
            {serie} &ldquo;{letra}&rdquo;
          </p>
          {conteudo ? (
            <p className="truncate text-xs text-white/80 sm:text-sm">{conteudo}</p>
          ) : null}
        </div>
      </div>

      <div className="p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-foreground sm:text-5xl">
              {relogio(restanteGrupo)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              restam no grupo {grupoAtual}
            </p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p className="text-lg font-semibold text-foreground">
              {grupoAtual} de {totalGrupos}
            </p>
            <p>grupos no revezamento</p>
          </div>
        </div>

        <div className="relative mt-5 h-4 overflow-hidden rounded-md border border-border/60 bg-muted">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-600 transition-[width] duration-1000 ease-out"
            style={{ width: `${progresso}%`, backgroundSize: `${(100 / Math.max(progresso, 1)) * 100}% 100%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
          <span>{inicioTurma}</span>
          <span>turma termina em {relogio(restanteTurma)}</span>
          <span>{fimTurma}</span>
        </div>
      </div>
    </div>
  );
}
