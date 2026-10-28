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
  registrarAusenciaSemMarcacao,
  removerAusenciaSemMarcacao,
  type TipoAusencia,
} from "@/lib/laboratorio";
import { cn } from "@/lib/utils";

const MOTIVOS_IMPEDIMENTO = [
  "Não cumpriu regra da sala de aula",
  "Comportamento na sala de informática",
  "Comportamento em sala de aula",
  "Atividade não entregue",
];

/**
 * Botão "Falta" de um aluno: registra que ele faltou ou que está impedido
 * (o professor não autorizou a ida naquele dia, com o motivo). Num aluno já
 * marcado, a marcação fica guardada mas deixa de contar como ida; num aluno
 * ainda não marcado (`novo`), a falta é registrada antes, e o painel não
 * deixa escolhê-lo no dia. Se já tem falta, permite desfazer.
 */
export function BotaoAusencia({
  sessaoId,
  semMarcacao = false,
  novo,
  nome,
  ausencia,
  ausenciaMotivo,
  aoMudar,
  soIcone = false,
  modo = "falta",
  className,
}: {
  /** A linha que já tem (ou vai ter) a falta. Sem ela, `novo` cria a falta. */
  sessaoId?: string | undefined;
  semMarcacao?: boolean;
  novo?: {
    aluno: { id: string; nome: string };
    turma: { id: string; rotulo: string };
    criadoPor: string | null;
  };
  nome: string;
  ausencia: TipoAusencia | null;
  ausenciaMotivo: string | null;
  aoMudar: () => void;
  /** Sem falta registrada, mostra só o ícone (para listas apertadas). */
  soIcone?: boolean;
  /**
   * "impedido": botão discreto só com ícone, que já abre no "Impedido" com
   * motivos rápidos (regra da sala, comportamento). A anotação é opcional.
   */
  modo?: "falta" | "impedido";
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<TipoAusencia>("faltou");
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [razao, setRazao] = useState<string | null>(null);

  function abrir() {
    setTipo(ausencia ?? (modo === "impedido" ? "nao_autorizado" : "faltou"));
    setMotivo(ausenciaMotivo ?? "");
    setRazao(null);
    setAberto(true);
  }

  async function salvar() {
    setSalvando(true);
    try {
      // Motivo rápido + anotação livre, os dois opcionais.
      const motivoFinal =
        tipo === "nao_autorizado"
          ? [razao, motivo.trim()].filter(Boolean).join(" — ") || null
          : null;
      if (sessaoId) await marcarAusencia(sessaoId, tipo, motivoFinal);
      else if (novo) await registrarAusenciaSemMarcacao({ ...novo, tipo, motivo: motivoFinal });
      else return;
      toast.success(
        sessaoId
          ? `${ROTULO_AUSENCIA[tipo]}: ${nome}. Não conta como ida ao laboratório.`
          : `${ROTULO_AUSENCIA[tipo]}: ${nome}. Não poderá ser escolhido(a) hoje.`,
      );
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
      if (!sessaoId) return;
      if (semMarcacao) {
        await removerAusenciaSemMarcacao(sessaoId);
        toast.success(`Falta desfeita: ${nome} pode ser escolhido(a) de novo.`);
      } else {
        await desfazerAusencia(sessaoId);
        toast.success(`Falta desfeita: ${nome} volta a contar como ida.`);
      }
      setAberto(false);
      aoMudar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setSalvando(false);
    }
  }

  // Com falta já registrada, quem mostra (e desfaz) é o botão "Falta" ao lado.
  if (modo === "impedido" && ausencia) return null;

  return (
    <>
      {modo === "impedido" ? (
        <button
          type="button"
          onClick={abrir}
          title="Marcar como impedido (regra da sala ou comportamento)"
          aria-label={`Marcar ${nome} como impedido`}
          className={cn(
            "flex items-center justify-center rounded-full border border-current/30 p-1 opacity-60 transition hover:opacity-100",
            className,
          )}
        >
          <Ban className="size-3.5" aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          onClick={abrir}
          title={ausencia ? "Ver ou desfazer a falta" : "Registrar falta ou impedimento"}
          className={cn(
            "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition",
            ausencia
              ? "border-red-500/60 bg-red-500/15 text-red-700 dark:text-red-300"
              : "border-current/30 opacity-80 hover:opacity-100",
            className,
          )}
        >
          {ausencia === "nao_autorizado" ? (
            <Ban className="size-3.5" aria-hidden />
          ) : (
            <UserX className="size-3.5" aria-hidden />
          )}
          {ausencia ? (
            ROTULO_AUSENCIA[ausencia]
          ) : soIcone ? (
            <span className="sr-only">Falta</span>
          ) : (
            "Falta"
          )}
        </button>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {tipo === "nao_autorizado" ? (
                <Ban className="size-5 text-amber-600" aria-hidden />
              ) : (
                <UserX className="size-5 text-red-600" aria-hidden />
              )}{" "}
              {nome}
            </DialogTitle>
            <DialogDescription>
              {sessaoId && !semMarcacao
                ? "O aluno continua na lista do dia, mas não conta como ida ao laboratório."
                : "Fica registrado no dia de hoje, e o aluno não pode ser escolhido por engano."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["faltou", UserX, "Não veio à aula"],
                ["nao_autorizado", Ban, "Não cumpriu uma regra ou por comportamento"],
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
            <div className="space-y-3">
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Motivo (opcional)</p>
                <div className="flex flex-wrap gap-1.5">
                  {MOTIVOS_IMPEDIMENTO.map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={razao === m}
                      onClick={() => setRazao(razao === m ? null : m)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition",
                        razao === m ? "border-amber-600 bg-amber-600 text-white" : "hover:bg-muted",
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`aus-motivo-${sessaoId ?? novo?.aluno.id}`}>
                  Anotação (opcional)
                </Label>
                <Textarea
                  id={`aus-motivo-${sessaoId ?? novo?.aluno.id}`}
                  rows={3}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Se quiser, descreva o que aconteceu. Fica no relatório do aluno."
                />
              </div>
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
              disabled={salvando}
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
