import { AlertTriangle, UserMinus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/app-store";
import { hojeNaEscola } from "@/lib/laboratorio";
import type { SituacaoMatricula } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Tira um aluno da turma por transferência ou desistência, de dentro da
 * própria tela de marcar alunos — que é onde o professor descobre a saída,
 * ao procurar por uma criança que não aparece mais na sala.
 *
 * A gravação é em dois passos de propósito. Marcar saída não é um detalhe:
 * o aluno some do rodízio, dos totais da turma e das listas de frequência.
 * O primeiro passo pergunta o quê (transferido ou desistente), quando e por
 * quê; o segundo repete em voz alta o que vai acontecer e exige um clique
 * separado. Desfazer existe, mas fica na ficha do aluno, no cadastro.
 */
export function BotaoSaida({
  turmaId,
  aluno,
  aoMudar,
  className,
}: {
  turmaId: string;
  aluno: { id: string; nome: string };
  aoMudar?: () => void;
  className?: string;
}) {
  const { updateAluno } = useAppStore();
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<Exclude<SituacaoMatricula, "ativo">>("transferido");
  const [quando, setQuando] = useState(hojeNaEscola());
  const [obs, setObs] = useState("");
  const [confirmando, setConfirmando] = useState(false);

  const rotulo = tipo === "transferido" ? "transferido(a)" : "desistente";

  function fechar() {
    setAberto(false);
    setConfirmando(false);
    setObs("");
    setTipo("transferido");
    setQuando(hojeNaEscola());
  }

  function gravar() {
    updateAluno(turmaId, aluno.id, {
      situacao: tipo,
      situacaoEm: quando || hojeNaEscola(),
      situacaoObs: obs.trim() || undefined,
    });
    fechar();
    aoMudar?.();
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Marcar ${aluno.nome} como transferido ou desistente`}
        title="Transferido(a) ou desistente"
        onClick={() => setAberto(true)}
        className={cn(
          "rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-slate-700 dark:hover:text-slate-200",
          className,
        )}
      >
        <UserMinus className="size-4" aria-hidden />
      </button>

      <Dialog open={aberto} onOpenChange={(v) => (v ? setAberto(true) : fechar())}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmando ? "Confirmar a saída" : "Aluno saiu da turma?"}</DialogTitle>
            <DialogDescription>
              {confirmando
                ? "Confira antes de gravar."
                : `Registre a saída de ${aluno.nome} do cadastro da turma.`}
            </DialogDescription>
          </DialogHeader>

          {confirmando ? (
            <div className="space-y-3 text-sm">
              <div className="flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
                <div className="space-y-1.5">
                  <p>
                    <b>{aluno.nome}</b> vai constar como <b>{rotulo}</b>
                    {quando ? ` em ${quando.split("-").reverse().join("/")}` : ""}.
                  </p>
                  <p className="text-muted-foreground">
                    A partir daí ele sai do rodízio do laboratório, dos totais da turma e das listas
                    de frequência. O histórico do que já participou continua guardado.
                  </p>
                  {obs.trim() ? (
                    <p className="text-muted-foreground">Observação: {obs.trim()}</p>
                  ) : null}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Para desfazer depois, abra a ficha do aluno em Turmas e alunos.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: "transferido", nome: "Transferido(a)", ajuda: "Foi para outra escola" },
                    { id: "desistente", nome: "Desistente", ajuda: "Deixou de frequentar" },
                  ] as const
                ).map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={tipo === o.id}
                    onClick={() => setTipo(o.id)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition",
                      tipo === o.id
                        ? "border-slate-600 bg-slate-600 text-white shadow"
                        : "hover:border-slate-400 hover:bg-muted",
                    )}
                  >
                    <span className="block text-sm font-bold">{o.nome}</span>
                    <span
                      className={cn(
                        "block text-xs",
                        tipo === o.id ? "text-white/80" : "text-muted-foreground",
                      )}
                    >
                      {o.ajuda}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="saida-quando">Desde quando</Label>
                <Input
                  id="saida-quando"
                  type="date"
                  value={quando}
                  onChange={(e) => setQuando(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="saida-obs">Observação (opcional)</Label>
                <Textarea
                  id="saida-obs"
                  rows={2}
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  placeholder="Para onde foi, quem informou…"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={confirmando ? () => setConfirmando(false) : fechar}>
              {confirmando ? "Voltar" : "Cancelar"}
            </Button>
            {confirmando ? (
              <Button className="bg-slate-700 hover:bg-slate-800" onClick={gravar}>
                Confirmar saída
              </Button>
            ) : (
              <Button onClick={() => setConfirmando(true)}>Continuar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
