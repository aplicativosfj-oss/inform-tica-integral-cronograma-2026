import {
  BookOpen,
  Clock3,
  HeartHandshake,
  MonitorPlay,
  Square,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimerRing } from "@/components/school/timer-ring";
import { playAlertaTroca, unlockAlertSound } from "@/lib/alert-sound";
import { useAppStore } from "@/lib/app-store";
import {
  buildWeeklySchedule,
  currentWeekdayLabel,
  findSessaoAtual,
  toDateKey,
} from "@/lib/schedule-engine";
import { cn } from "@/lib/utils";

/**
 * Plays the rotation alert whenever the active turn (`chave`) changes.
 * Kept as a child component so its hooks never sit behind an early return.
 */
function AlertaSonoro({ chave }: { chave: string }) {
  const [ativo, setAtivo] = useState(false);
  const chaveAnterior = useRef<string | null>(null);

  useEffect(() => {
    if (chaveAnterior.current !== null && chaveAnterior.current !== chave && ativo) {
      playAlertaTroca();
      toast.info("Tempo esgotado: hora de trocar o grupo no laboratório.");
    }
    chaveAnterior.current = chave;
  }, [chave, ativo]);

  return (
    <Button
      type="button"
      size="sm"
      variant={ativo ? "secondary" : "outline"}
      onClick={async () => {
        if (ativo) {
          setAtivo(false);
          return;
        }
        const ok = await unlockAlertSound();
        setAtivo(ok);
        if (!ok) toast.error("Não foi possível ativar o som neste navegador.");
      }}
    >
      {ativo ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
      {ativo ? "Aviso sonoro ativo" : "Ativar aviso sonoro"}
    </Button>
  );
}

function useNow(enabled: boolean) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    if (!enabled) return;
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [enabled]);
  return now;
}

/** "08:30" -> 30600 seconds since midnight. */
function hhmmToSeconds(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  return (Number(h ?? 0) * 60 + Number(m ?? 0)) * 60;
}

export function LiveSessionPanel({ editable = false }: { editable?: boolean }) {
  const { turmas, config, setSessaoSuspensa } = useAppStore();
  const now = useNow(true);

  if (!now) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Carregando relógio da aula...
        </CardContent>
      </Card>
    );
  }

  const diaAtual = currentWeekdayLabel(now);
  const conteudoDoDia = config.conteudoPorDia?.[diaAtual] ?? "";
  const assignments = buildWeeklySchedule(turmas, config);
  const sessao = findSessaoAtual(assignments, config, now);

  if (!sessao) {
    return (
      <Card className="border-dashed bg-muted/30">
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <Clock3 className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Nenhuma aula de informática agora</p>
          <p className="text-xs text-muted-foreground">
            {now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            {" · "}
            {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
          {conteudoDoDia ? (
            <p className="mt-2 max-w-md text-xs text-muted-foreground">
              Conteúdo previsto para hoje: {conteudoDoDia}
            </p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const { assignment, subBloco, segundosRestantes, proximoSubBloco, suspensa } = sessao;
  const totalSegundos = Math.max(1, hhmmToSeconds(subBloco.fim) - hhmmToSeconds(subBloco.inicio));
  const decorridos = totalSegundos - segundosRestantes;
  const dateKey = toDateKey(now);

  if (suspensa) {
    return (
      <Card className="border-dashed bg-muted/30">
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <Square className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Aula de {assignment.turma.serie} "{assignment.turma.letra}" parada pelo(a)
            administrador(a)
          </p>
          <p className="text-xs text-muted-foreground">
            {now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            {" · "}
            {assignment.slot.inicio} – {assignment.slot.fim}
          </p>
          {editable ? (
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => {
                setSessaoSuspensa(dateKey, assignment.dia, assignment.slot.inicio, false);
                toast.success("Aula retomada.");
              }}
            >
              Retomar aula
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MonitorPlay className="size-5 text-primary" />
          Aula em andamento
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary text-primary-foreground">AO VIVO</Badge>
          {editable ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="text-destructive">
                  <Square className="size-3.5" /> Parar aula
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Parar a aula em andamento?</AlertDialogTitle>
                  <AlertDialogDescription>
                    A aula de {assignment.turma.serie} "{assignment.turma.letra}" de hoje será
                    interrompida. A programação das próximas semanas não é afetada.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setSessaoSuspensa(dateKey, assignment.dia, assignment.slot.inicio, true);
                      toast.success("Aula parada.");
                    }}
                  >
                    Parar aula
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex flex-col items-center gap-2 self-center lg:self-start">
          <TimerRing decorridos={decorridos} total={totalSegundos} />
          <p className="text-xs text-muted-foreground">
            Grupo {subBloco.grupo.indice + 1} · {subBloco.inicio} – {subBloco.fim}
          </p>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div>
            <p className="text-2xl font-semibold text-foreground">
              {assignment.turma.serie} "{assignment.turma.letra}"
            </p>
            <p className="text-sm text-muted-foreground">
              Prof(a). regente: {assignment.turma.professorRegente} · Informática:{" "}
              {config.professorInformatica}
            </p>
          </div>

          <div className="rounded-lg border border-border/60 bg-background/60 p-3">
            <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              <BookOpen className="size-3" /> Conteúdo de hoje ({diaAtual})
            </p>
            <p className="mt-1 text-sm text-foreground">
              {conteudoDoDia || "Nenhum conteúdo cadastrado para hoje."}
            </p>
          </div>

          {subBloco.grupo.alunos.length > 0 ? (
            <div>
              <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Users className="size-3" /> Alunos nesta rodada ({subBloco.grupo.alunos.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {subBloco.grupo.alunos.map((aluno) => {
                  const destacar = editable && aluno.necessidadeEspecial;
                  return (
                    <span
                      key={aluno.id}
                      title={destacar ? aluno.observacoesNecessidade : undefined}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-foreground",
                        destacar
                          ? "border-primary/50 bg-primary/10"
                          : "border-border/60 bg-background",
                      )}
                    >
                      <span className="flex size-5 items-center justify-center overflow-hidden rounded-full bg-secondary text-[10px] font-semibold text-secondary-foreground">
                        {aluno.foto ? (
                          <img src={aluno.foto} alt="" className="size-full object-cover" />
                        ) : (
                          aluno.nome.charAt(0)
                        )}
                      </span>
                      {aluno.nome}
                      {destacar ? <HeartHandshake className="size-3 text-primary" /> : null}
                    </span>
                  );
                })}
              </div>
              {editable && subBloco.grupo.alunos.some((a) => a.necessidadeEspecial) ? (
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <HeartHandshake className="size-3 text-primary" /> Alunos destacados precisam de
                  atendimento especializado — passe o mouse sobre o nome para ver as orientações.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Esta turma ainda não tem alunos cadastrados.
            </p>
          )}

          {proximoSubBloco ? (
            <p className="text-xs text-muted-foreground">
              A seguir: grupo {proximoSubBloco.grupo.indice + 1} às {proximoSubBloco.inicio} (
              {proximoSubBloco.grupo.alunos.length} alunos)
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
