import { CalendarClock, CalendarX2, Check, Info } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/app-store";
import { encontrarHorariosParaReprogramar, toDateKey } from "@/lib/schedule-engine";
import type { Assignment } from "@/lib/types";
import { cn } from "@/lib/utils";

const MOTIVOS = [
  "Atividade de revisão com o(a) professor(a) regente",
  "Evento da escola",
  "Passeio / atividade externa",
  "Avaliação em sala",
  "Falta de energia / internet",
  "Professor(a) ausente",
];

function formatarData(data: Date): string {
  return data.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

/**
 * Registra que a turma não pode ter a aula programada e já reprograma a
 * turma inteira para o próximo horário possível (sugerido pelo sistema; o
 * professor pode escolher outro da lista ou só suspender).
 */
export function SuspenderAulaDialog({
  assignment,
  data,
  children,
  onConcluido,
}: {
  assignment: Assignment;
  /** Data da ocorrência que não vai acontecer. */
  data: Date;
  children: ReactNode;
  /** Chamado depois de salvar (ex.: para fechar uma lista). */
  onConcluido?: (() => void) | undefined;
}) {
  const { turmas, config, reprogramarAula, setSessaoSuspensa } = useAppStore();
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [escolha, setEscolha] = useState<number | "nenhum">(0);

  const turma = assignment.turma;
  const dataKey = toDateKey(data);

  const opcoes = useMemo(() => {
    if (!open) return [];
    // A busca começa depois do fim desta aula — ou de agora, se a aula já
    // passou (registro feito depois do horário) — para nunca sugerir o passado.
    const [h, m] = assignment.slot.fim.split(":").map(Number);
    const fimDaAula = new Date(data.getFullYear(), data.getMonth(), data.getDate(), h ?? 0, m ?? 0);
    const agora = new Date();
    const desde = fimDaAula > agora ? fimDaAula : agora;
    return encontrarHorariosParaReprogramar(turmas, config, turma.id, desde);
  }, [open, turmas, config, turma.id, data, assignment.slot.fim]);

  function confirmar() {
    const motivoFinal = motivo.trim() || undefined;
    const opcao = escolha === "nenhum" ? undefined : opcoes[escolha];
    if (!opcao) {
      setSessaoSuspensa(dataKey, assignment.dia, assignment.slot.inicio, true);
      toast.success(`Aula de ${turma.serie} "${turma.letra}" suspensa em ${formatarData(data)}.`);
    } else {
      reprogramarAula({
        turmaId: turma.id,
        dataOriginal: dataKey,
        diaOriginal: assignment.dia,
        inicioOriginal: assignment.slot.inicio,
        fimOriginal: assignment.slot.fim,
        dataNova: opcao.dataKey,
        inicio: opcao.slot.inicio,
        fim: opcao.slot.fim,
        conteudo: assignment.conteudo,
        motivo: motivoFinal,
        slotDeslocado: opcao.turmaDeslocada
          ? {
              data: opcao.dataKey,
              dia: opcao.dia,
              inicio: opcao.slot.inicio,
              turmaId: opcao.turmaDeslocada.id,
            }
          : undefined,
      });
      toast.success(
        `${turma.serie} "${turma.letra}" reprogramada para ${formatarData(opcao.data)}, ${opcao.slot.inicio}–${opcao.slot.fim}.`,
      );
    }
    setOpen(false);
    onConcluido?.();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) {
          setMotivo("");
          setEscolha(0);
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarX2 className="size-5 text-amber-500" />
            Turma não pode ter esta aula
          </DialogTitle>
          <DialogDescription>
            {turma.serie} &ldquo;{turma.letra}&rdquo; · {formatarData(data)},{" "}
            {assignment.slot.inicio}–{assignment.slot.fim}. A aula é suspensa e a turma inteira vai
            para o horário escolhido abaixo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="motivo-suspensao">Motivo</Label>
          <div className="flex flex-wrap gap-1.5">
            {MOTIVOS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMotivo(m)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs transition-colors",
                  motivo === m
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border/70 text-muted-foreground hover:bg-muted",
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <Input
            id="motivo-suspensao"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ou descreva o motivo"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Novo horário</Label>
          <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto pr-1">
            {opcoes.map((o, i) => (
              <button
                key={`${o.dataKey}-${o.slot.inicio}`}
                type="button"
                onClick={() => setEscolha(i)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  escolha === i
                    ? "border-primary bg-primary/10"
                    : "border-border/60 hover:bg-muted/60",
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <CalendarClock className="size-4 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block font-medium capitalize text-foreground">
                      {formatarData(o.data)} · {o.slot.inicio}–{o.slot.fim}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {o.tipo === "livre"
                        ? "Laboratório livre neste horário"
                        : `Usa a aula extra de ${o.turmaDeslocada?.serie} "${o.turmaDeslocada?.letra}" (ela mantém a aula principal)`}
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {i === 0 ? (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      Sugerido
                    </span>
                  ) : null}
                  {escolha === i ? <Check className="size-4 text-primary" /> : null}
                </span>
              </button>
            ))}
            {opcoes.length === 0 ? (
              <p className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-3 text-xs text-muted-foreground">
                <Info className="size-4 shrink-0" /> Nenhum horário disponível nas próximas 3
                semanas. A aula pode ser só suspensa.
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => setEscolha("nenhum")}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                escolha === "nenhum"
                  ? "border-primary bg-primary/10"
                  : "border-border/60 text-muted-foreground hover:bg-muted/60",
              )}
            >
              Só suspender, sem reprogramar
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={confirmar}>
            {escolha === "nenhum" || opcoes.length === 0
              ? "Suspender aula"
              : "Suspender e reprogramar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
