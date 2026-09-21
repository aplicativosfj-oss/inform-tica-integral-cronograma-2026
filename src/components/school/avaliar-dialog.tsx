import { Loader2, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SELOS, salvarAvaliacao, selo, type Avaliacao, type SeloValor } from "@/lib/avaliacoes";

/** Selo já dado, mostrado na lista de trabalhos. */
export function SeloAvaliacao({ avaliacao }: { avaliacao: Avaliacao | undefined }) {
  const info = selo(avaliacao?.selo);
  if (!avaliacao || !info) {
    return (
      <Badge variant="outline" className="font-normal text-muted-foreground">
        sem avaliação
      </Badge>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <Badge className={`font-normal hover:bg-inherit ${info.cor}`}>{info.rotulo}</Badge>
      {avaliacao.nota !== undefined ? (
        <Badge variant="secondary" className="font-normal">
          nota {avaliacao.nota}
        </Badge>
      ) : null}
    </span>
  );
}

interface AvaliarDialogProps {
  aberto: boolean;
  aoFechar: () => void;
  /** O que está sendo avaliado, para a pessoa conferir. */
  titulo: string;
  turmaId: string;
  alunoId: string;
  tipo: "atividade" | "entrega";
  referenciaId: string;
  avaliadoPor: string;
  atual?: Avaliacao | undefined;
  aoSalvar: () => void;
}

/**
 * Janela de avaliação: o selo é obrigatório, a nota é opcional e o comentário
 * é o que a criança mais lê. Avaliar de novo substitui a avaliação anterior.
 */
export function AvaliarDialog({
  aberto,
  aoFechar,
  titulo,
  turmaId,
  alunoId,
  tipo,
  referenciaId,
  avaliadoPor,
  atual,
  aoSalvar,
}: AvaliarDialogProps) {
  const [escolhido, setEscolhido] = useState<SeloValor | null>(null);
  const [nota, setNota] = useState("");
  const [comentario, setComentario] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setEscolhido(atual?.selo ?? null);
    setNota(atual?.nota !== undefined ? String(atual.nota) : "");
    setComentario(atual?.comentario ?? "");
  }, [aberto, atual]);

  async function salvar() {
    if (!escolhido) {
      toast.error("Escolha um selo.");
      return;
    }
    const valorNota = nota.trim() === "" ? undefined : Number(nota.replace(",", "."));
    if (valorNota !== undefined && (Number.isNaN(valorNota) || valorNota < 0 || valorNota > 10)) {
      toast.error("A nota precisa ser um número de 0 a 10.");
      return;
    }
    setSalvando(true);
    try {
      await salvarAvaliacao({
        turmaId,
        alunoId,
        tipo,
        referenciaId,
        selo: escolhido,
        nota: valorNota,
        comentario: comentario.trim() || undefined,
        avaliadoPor,
      });
      toast.success("Avaliação registrada. O aluno já vê na área dele.");
      aoSalvar();
      aoFechar();
    } catch (err) {
      toast.error(`Não foi possível salvar: ${(err as Error).message}`);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(estado) => (estado ? null : aoFechar())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="size-4 text-primary" /> Avaliar trabalho
          </DialogTitle>
          <DialogDescription>{titulo}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Selo</Label>
            <div className="flex flex-col gap-1.5">
              {SELOS.map((item) => (
                <button
                  key={item.valor}
                  type="button"
                  onClick={() => setEscolhido(item.valor)}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-2.5 text-left transition-colors ${
                    escolhido === item.valor
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">{item.rotulo}</span>
                    <span className="block text-xs text-muted-foreground">{item.descricao}</span>
                  </span>
                  <span className={`shrink-0 rounded-md px-2 py-1 text-xs ${item.cor}`}>selo</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nota">Nota de 0 a 10 (opcional)</Label>
            <Input
              id="nota"
              inputMode="decimal"
              className="w-28"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="ex: 8,5"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comentario">Comentário para o aluno (opcional)</Label>
            <Textarea
              id="comentario"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Ex: o texto ficou bem organizado; na próxima, capriche na pontuação."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando || !escolhido} className="gap-1.5">
            {salvando ? <Loader2 className="size-4 animate-spin" /> : null} Salvar avaliação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
