import { HeartHandshake } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppStore } from "@/lib/app-store";
import { fetchUltimaParticipacao } from "@/lib/presencas";
import { selecionarAlunosDoDia } from "@/lib/schedule-engine";
import type { Assignment } from "@/lib/types";

/**
 * Preview of which students are expected on a given (usually future) date —
 * computed live from the same fairness queue used for the real daily roll
 * call, but not written anywhere. It's a forecast, not a commitment: the
 * actual list on the day can shift with absences or schedule changes.
 *
 * Shared between the homepage and the public agenda page so both offer the
 * same "click a card to see who's coming" experience.
 */
export function PreviaAlunosDialog({
  assignment,
  data,
  onOpenChange,
}: {
  assignment: Assignment | null;
  data: Date;
  onOpenChange: (open: boolean) => void;
}) {
  const { config } = useAppStore();
  const [grupos, setGrupos] = useState<ReturnType<typeof selecionarAlunosDoDia>["grupos"] | null>(
    null,
  );
  const [carregando, setCarregando] = useState(false);
  const [semDadosDeFrequencia, setSemDadosDeFrequencia] = useState(false);

  useEffect(() => {
    if (!assignment) {
      setGrupos(null);
      setSemDadosDeFrequencia(false);
      return;
    }
    let cancelled = false;
    setCarregando(true);
    setSemDadosDeFrequencia(false);

    // Se o Supabase demorar demais ou falhar (rede indisponível, bloqueio,
    // etc.), ainda mostramos uma prévia — só sem levar em conta o histórico
    // de frequência — em vez de deixar o diálogo girando para sempre.
    const timeout = new Promise<Map<string, string>>((resolve) =>
      setTimeout(() => resolve(new Map()), 6000),
    );

    Promise.race([fetchUltimaParticipacao(assignment.turma.id), timeout])
      .catch(() => new Map<string, string>())
      .then((ultima) => {
        if (cancelled) return;
        if (ultima.size === 0) setSemDadosDeFrequencia(true);
        const selecao = selecionarAlunosDoDia(assignment.turma, ultima, config.numeroComputadores);
        setGrupos(selecao.grupos);
      })
      .finally(() => {
        if (!cancelled) setCarregando(false);
      });
    return () => {
      cancelled = true;
    };
  }, [assignment, config.numeroComputadores]);

  return (
    <Dialog open={assignment !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {assignment
              ? `${assignment.turma.serie} "${assignment.turma.letra}" · ${data.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}`
              : ""}
          </DialogTitle>
        </DialogHeader>
        {assignment ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Horário: {assignment.slot.inicio} – {assignment.slot.fim} · Prof(a).{" "}
              {assignment.turma.professorRegente}
            </p>
            {carregando ? (
              <p className="text-sm text-muted-foreground">Calculando quem vai participar...</p>
            ) : grupos && grupos.some((g) => g.alunos.length > 0) ? (
              <div className="flex flex-col gap-3">
                {grupos.map((grupo) => (
                  <div key={grupo.indice}>
                    <Badge variant="secondary" className="mb-1.5">
                      Grupo {grupo.indice + 1}
                    </Badge>
                    <div className="flex flex-wrap gap-1.5">
                      {grupo.alunos.map((aluno) => (
                        <span
                          key={aluno.id}
                          className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs text-foreground"
                        >
                          {aluno.nome}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <HeartHandshake className="mt-0.5 size-3.5 shrink-0" />
                  {semDadosDeFrequencia
                    ? "Prévia em ordem simples (ainda sem histórico de frequência) — pode mudar até o dia."
                    : "Prévia calculada pela fila de prioridade atual — pode mudar até o dia se houver faltas ou ajustes na programação."}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Esta turma ainda não tem alunos cadastrados.
              </p>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
