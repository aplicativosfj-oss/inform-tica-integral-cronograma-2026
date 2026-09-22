import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { criarAtividade } from "@/lib/aluno-area";
import { agoraNaEscola } from "@/lib/schedule-engine";

function hojeISO(): string {
  const hoje = agoraNaEscola();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(
    hoje.getDate(),
  ).padStart(2, "0")}`;
}

/**
 * Cria uma atividade para a turma inteira. Ela aparece na área de cada aluno,
 * que marca como concluída — e é sobre ela que o professor põe o selo depois.
 */
export function NovaAtividadeDialog({
  turmaId,
  aoCriar,
}: {
  turmaId: string;
  aoCriar?: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [url, setUrl] = useState("");
  const [data, setData] = useState(hojeISO);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!titulo.trim()) {
      toast.error("Dê um título à atividade.");
      return;
    }
    setSalvando(true);
    try {
      await criarAtividade({
        turmaId,
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        url: url.trim() || undefined,
        data,
      });
      toast.success("Atividade criada — já aparece na área dos alunos.");
      setTitulo("");
      setDescricao("");
      setUrl("");
      setAberto(false);
      aoCriar?.();
    } catch (err) {
      toast.error(`Não foi possível criar: ${(err as Error).message}`);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" /> Nova atividade
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova atividade para a turma</DialogTitle>
          <DialogDescription>
            Ela aparece na área de cada aluno, que marca quando terminar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="titulo-atividade">Título</Label>
            <Input
              id="titulo-atividade"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Escrever um texto sobre o folclore do Acre"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descricao-atividade">O que fazer (opcional)</Label>
            <Textarea
              id="descricao-atividade"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: use o editor de texto, mínimo 10 linhas, e entregue para o professor."
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="url-atividade">Link (opcional)</Label>
            <Input
              id="url-atividade"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="data-atividade">Dia</Label>
            <Input
              id="data-atividade"
              type="date"
              className="w-44"
              value={data}
              onChange={(e) => setData(e.target.value || hojeISO())}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setAberto(false)}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando} className="gap-1.5">
            {salvando ? <Loader2 className="size-4 animate-spin" /> : null} Criar atividade
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
