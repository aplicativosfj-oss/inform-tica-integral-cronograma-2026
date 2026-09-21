import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/app-store";
import { suspensaoKey, toDateKey } from "@/lib/schedule-engine";
import type { Assignment } from "@/lib/types";

/**
 * Observação do professor sobre uma aula específica (o que mudou no
 * decorrer dela). Fica pública no Diário das aulas, na Coordenação — por
 * isso o aviso para não escrever nome de aluno.
 */
export function ObservacaoAulaDialog({
  assignment,
  data,
  children,
}: {
  assignment: Assignment;
  data: Date;
  children: ReactNode;
}) {
  const { config, setObservacaoAula } = useAppStore();
  const dataKey = toDateKey(data);
  const atual =
    config.observacoesAula?.[suspensaoKey(dataKey, assignment.dia, assignment.slot.inicio)] ?? "";
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState(atual);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setTexto(atual);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Observação da aula</DialogTitle>
          <DialogDescription>
            {assignment.turma.serie} &ldquo;{assignment.turma.letra}&rdquo; ·{" "}
            {data.toLocaleDateString("pt-BR", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
            })}
            , {assignment.slot.inicio}–{assignment.slot.fim}. Aparece no Diário das aulas, aberto ao
            público — não escreva nomes de alunos.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={4}
          placeholder="Ex.: o grupo 2 saiu 15 min antes para o ensaio da festa; a internet caiu às 10:00."
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              setObservacaoAula(dataKey, assignment.dia, assignment.slot.inicio, texto);
              toast.success(texto.trim() ? "Observação registrada." : "Observação removida.");
              setOpen(false);
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
