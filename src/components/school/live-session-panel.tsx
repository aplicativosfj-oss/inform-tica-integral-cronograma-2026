import { Clock3, MonitorPlay, Timer, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/app-store";
import { buildWeeklySchedule, findSessaoAtual, formatCountdown } from "@/lib/schedule-engine";

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

export function LiveSessionPanel() {
  const { turmas, config } = useAppStore();
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
        </CardContent>
      </Card>
    );
  }

  const { assignment, subBloco, segundosRestantes } = sessao;

  return (
    <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MonitorPlay className="size-5 text-primary" />
          Aula em andamento
        </CardTitle>
        <Badge className="bg-primary text-primary-foreground">AO VIVO</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div>
          <p className="text-2xl font-semibold text-foreground">
            {assignment.turma.serie} "{assignment.turma.letra}"
          </p>
          <p className="text-sm text-muted-foreground">
            Prof(a). regente: {assignment.turma.professorRegente} · Informática:{" "}
            {config.professorInformatica}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/60 bg-background/60 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Horário</p>
            <p className="text-sm font-medium text-foreground">
              {subBloco.inicio} – {subBloco.fim}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/60 p-3">
            <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              <Users className="size-3" /> Grupo na sala
            </p>
            <p className="text-sm font-medium text-foreground">
              Grupo {subBloco.grupo.indice + 1} ({subBloco.grupo.alunos.length} alunos)
            </p>
          </div>
          <div className="col-span-2 rounded-lg border border-primary/30 bg-primary/5 p-3 sm:col-span-1">
            <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              <Timer className="size-3" /> Termina em
            </p>
            <p className="font-mono text-2xl font-bold tabular-nums text-primary">
              {formatCountdown(segundosRestantes)}
            </p>
          </div>
        </div>

        {subBloco.grupo.alunos.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Alunos nesta rodada</p>
            <div className="flex flex-wrap gap-2">
              {subBloco.grupo.alunos.map((aluno) => (
                <span
                  key={aluno.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs text-foreground"
                >
                  <span className="flex size-5 items-center justify-center overflow-hidden rounded-full bg-secondary text-[10px] font-semibold text-secondary-foreground">
                    {aluno.foto ? (
                      <img src={aluno.foto} alt="" className="size-full object-cover" />
                    ) : (
                      aluno.nome.charAt(0)
                    )}
                  </span>
                  {aluno.nome}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Esta turma ainda não tem alunos cadastrados.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
