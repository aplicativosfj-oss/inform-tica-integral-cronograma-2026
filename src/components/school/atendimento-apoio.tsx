import { HeartHandshake, Pencil, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/app-store";
import { alunosComAtendimento, alunosDoApoio } from "@/lib/profissional-acesso";
import type { Turma } from "@/lib/types";

/**
 * Quem cada mediador/cuidador acompanha.
 *
 * A lista de chamada da escola diz quais criancas têm atendimento
 * especializado e quais profissionais atuam em cada turma — mas não liga um
 * ao outro. Na falta dessa ligação o sistema reparte as criancas em rodízio,
 * o que é só um arranjo plausível. Aqui a coordenação registra a divisão de
 * verdade, e o espaço do profissional passa a refletir o combinado da
 * escola.
 */
export function AtendimentoApoio({ turma }: { turma: Turma }) {
  const { updateTurma } = useAppStore();
  const [editando, setEditando] = useState<number | null>(null);
  const [selecao, setSelecao] = useState<string[]>([]);

  const apoios = turma.apoioEspecial ?? [];
  const atendidos = alunosComAtendimento(turma);

  if (apoios.length === 0) return null;

  function abrir(indice: number) {
    const apoio = apoios[indice];
    // Sem divisão registrada, a janela já abre com o palpite do rodízio
    // marcado: a coordenação corrige o que estiver errado em vez de começar
    // do zero.
    setSelecao(
      apoio?.alunosIds?.length ? apoio.alunosIds : alunosDoApoio(turma, indice).map((a) => a.id),
    );
    setEditando(indice);
  }

  function salvar() {
    if (editando === null) return;
    const novos = apoios.map((apoio, i) =>
      i === editando ? { ...apoio, alunosIds: selecao } : apoio,
    );
    updateTurma(turma.id, { apoioEspecial: novos });
    toast.success(`Atendimento de ${apoios[editando]?.nome} atualizado.`);
    setEditando(null);
  }

  function voltarAoAutomatico(indice: number) {
    const novos = apoios.map((apoio, i) =>
      i === indice ? { ...apoio, alunosIds: undefined } : apoio,
    );
    updateTurma(turma.id, { apoioEspecial: novos });
    toast.success("Divisão automática restaurada para este profissional.");
    setEditando(null);
  }

  return (
    <Card className="mb-6">
      <CardContent className="flex flex-col gap-3 py-4">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <HeartHandshake className="size-4 text-primary" /> Quem cada profissional acompanha
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {atendidos.length} criança(s) desta turma com atendimento especializado. Sem uma divisão
            registrada, o sistema reparte em rodízio — o que é só um palpite. Defina aqui a divisão
            real e ela passa a valer no espaço de cada profissional.
          </p>
        </div>

        {atendidos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma criança desta turma está marcada com atendimento especializado.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border/60">
            {apoios.map((apoio, indice) => {
              const definido = (apoio.alunosIds?.length ?? 0) > 0;
              const criancas = alunosDoApoio(turma, indice);
              return (
                <div
                  key={indice}
                  className="flex flex-wrap items-start justify-between gap-2 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                      {apoio.nome}
                      <Badge variant="secondary" className="font-normal">
                        {apoio.funcao}
                      </Badge>
                      {definido ? null : (
                        <Badge
                          variant="outline"
                          className="gap-1 font-normal text-muted-foreground"
                        >
                          <Wand2 className="size-3" /> divisão automática
                        </Badge>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {criancas.length === 0
                        ? "Nenhuma criança atribuída."
                        : criancas.map((c) => c.nome).join(", ")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => abrir(indice)}
                  >
                    <Pencil className="size-3.5" /> Definir
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog
        open={editando !== null}
        onOpenChange={(estado) => (estado ? null : setEditando(null))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando !== null ? apoios[editando]?.nome : ""}</DialogTitle>
            <DialogDescription>
              Marque as criancas que este profissional acompanha nas aulas de informática.
            </DialogDescription>
          </DialogHeader>

          <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
            {atendidos.map((aluno) => (
              <label
                key={aluno.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-muted"
              >
                <Checkbox
                  checked={selecao.includes(aluno.id)}
                  onCheckedChange={(marcado) =>
                    setSelecao((atual) =>
                      marcado === true
                        ? [...atual, aluno.id]
                        : atual.filter((id) => id !== aluno.id),
                    )
                  }
                />
                <Label className="cursor-pointer font-normal">{aluno.nome}</Label>
              </label>
            ))}
          </div>

          <div className="flex flex-wrap justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => editando !== null && voltarAoAutomatico(editando)}
            >
              <Wand2 className="size-3.5" /> Voltar ao automático
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setEditando(null)}>
                Cancelar
              </Button>
              <Button onClick={salvar}>Salvar ({selecao.length})</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
