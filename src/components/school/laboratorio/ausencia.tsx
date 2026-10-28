import { Ban, UserX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ROTULO_AUSENCIA,
  desfazerAusencia,
  marcarAusencia,
  type TipoAusencia,
} from "@/lib/laboratorio";
import { cn } from "@/lib/utils";

/**
 * Botão "Falta" de um aluno marcado: registra que ele faltou ou que o
 * professor não autorizou a ida naquele dia (com o motivo). A marcação fica
 * guardada, mas deixa de contar como ida. Se já tem falta, permite desfazer.
 */
export function BotaoAusencia({
  sessaoId,
  nome,
  ausencia,
  ausenciaMotivo,
  aoMudar,
  className,
}: {
  sessaoId: string;
  nome: string;
  ausencia: TipoAusencia | null;
  ausenciaMotivo: string | null;
  aoMudar: () => void;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<TipoAusencia>("faltou");
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const faltaMotivo = tipo === "nao_autorizado" && motivo.trim().length < 3;

  function abrir() {
    setTipo(ausencia ?? "faltou");
    setMotivo(ausenciaMotivo ?? "");
    setAberto(true);
  }

  async function salvar() {
    if (faltaMotivo) return;
    setSalvando(true);
    try {
      await marcarAusencia(sessaoId, tipo, tipo === "nao_autorizado" ? motivo : null);
      toast.success(`${ROTULO_AUSENCIA[tipo]}: ${nome}. Não conta como ida ao laboratório.`);
      setAberto(false);
      aoMudar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setSalvando(false);
    }
  }

  async function desfazer() {
    setSalvando(true);
    try {
      await desfazerAusencia(sessaoId);
      toast.success(`Falta desfeita: ${nome} volta a contar como ida.`);
      setAberto(false);
      aoMudar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        title={ausencia ? "Ver ou desfazer a falta" : "Registrar falta ou não autorização"}
        className={cn(
          "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition",
          ausencia
            ? "border-red-500/60 bg-red-500/15 text-red-700 dark:text-red-300"
            : "border-current/30 opacity-80 hover:opacity-100",
          className,
        )}
      >
        <UserX className="size-3.5" aria-hidden />
        {ausencia ? ROTULO_AUSENCIA[ausencia] : "Falta"}
      </button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="size-5 text-red-600" aria-hidden /> {nome}
            </DialogTitle>
            <DialogDescription>
              O aluno continua na lista do dia, mas não conta como ida ao laboratório.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["faltou", UserX, "Não veio à aula"],
                ["nao_autorizado", Ban, "Não foi liberado neste dia"],
              ] as const
            ).map(([t, Icone, dica]) => (
              <button
                key={t}
                type="button"
                aria-pressed={tipo === t}
                onClick={() => setTipo(t)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-xl border p-3 text-left text-sm transition",
                  tipo === t ? "border-red-600 bg-red-600 text-white" : "hover:bg-muted",
                )}
              >
                <span className="flex items-center gap-1.5 font-semibold">
                  <Icone className="size-4" aria-hidden /> {ROTULO_AUSENCIA[t]}
                </span>
                <span
                  className={cn("text-xs", tipo === t ? "text-white/85" : "text-muted-foreground")}
                >
                  {dica}
                </span>
              </button>
            ))}
          </div>

          {tipo === "nao_autorizado" ? (
            <div className="space-y-1.5">
              <Label htmlFor={`aus-motivo-${sessaoId}`}>Motivo (obrigatório)</Label>
              <Textarea
                id={`aus-motivo-${sessaoId}`}
                rows={3}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex.: comportamento, atividade atrasada, pedido da coordenação…"
              />
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            {ausencia ? (
              <Button
                type="button"
                variant="outline"
                disabled={salvando}
                onClick={() => void desfazer()}
              >
                Desfazer falta
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => setAberto(false)}>
                Voltar
              </Button>
            )}
            <Button
              type="button"
              variant="destructive"
              disabled={salvando || faltaMotivo}
              onClick={() => void salvar()}
            >
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
