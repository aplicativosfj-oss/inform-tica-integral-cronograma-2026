import { createFileRoute } from "@tanstack/react-router";
import { Layers, Plus, Trash2, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmedInlineInput } from "@/components/school/confirmed-inline-input";
import { DashboardShell } from "@/components/school/dashboard-shell";
import { useAppStore } from "@/lib/app-store";
import { useConfirmar } from "@/lib/confirm-store";
import type { Turma } from "@/lib/types";

export const Route = createFileRoute("/dashboard/grupos")({
  component: GruposPage,
  head: () => ({
    meta: [
      { title: "Turmas e grupos · Agenda de Informática" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function GruposPage() {
  const { turmas, config, addGrupo, updateGrupo, removeGrupo } = useAppStore();

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Turmas e grupos</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre os grupos de revezamento de cada turma. O nome e o conteúdo do grupo aparecem no
          cronômetro enquanto o grupo estiver no laboratório.
        </p>
      </div>

      {turmas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Cadastre uma turma primeiro na tela "Turmas e alunos".
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {turmas.map((turma) => (
            <TurmaGruposCard
              key={turma.id}
              turma={turma}
              numeroComputadores={config.numeroComputadores}
              onAdd={(nome, conteudo) => addGrupo(turma.id, { nome, conteudo })}
              onUpdate={(grupoId, patch) => updateGrupo(turma.id, grupoId, patch)}
              onRemove={(grupoId) => removeGrupo(turma.id, grupoId)}
            />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

function TurmaGruposCard({
  turma,
  numeroComputadores,
  onAdd,
  onUpdate,
  onRemove,
}: {
  turma: Turma;
  numeroComputadores: number;
  onAdd: (nome: string, conteudo: string) => void;
  onUpdate: (grupoId: string, patch: { nome?: string; conteudo?: string }) => void;
  onRemove: (grupoId: string) => void;
}) {
  const [novoNome, setNovoNome] = useState("");
  const grupos = turma.grupos ?? [];
  const confirmar = useConfirmar();

  async function criarAutomaticamente() {
    const quantidade = Math.max(
      1,
      Math.ceil(turma.alunos.length / Math.max(1, numeroComputadores)),
    );
    const faltam = quantidade - grupos.length;
    if (faltam <= 0) {
      toast.info("Esta turma já tem grupos suficientes.");
      return;
    }
    const ok = await confirmar({
      titulo: "Criar grupos automaticamente?",
      descricao: `${faltam} ${faltam === 1 ? "novo grupo" : "novos grupos"} serão criados para ${turma.serie} "${turma.letra}".`,
    });
    if (!ok) return;
    for (let i = grupos.length; i < quantidade; i += 1) {
      onAdd(`Grupo ${i + 1}`, "");
    }
    toast.success("Grupos criados. Distribua os alunos na tela de Alunos.");
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="size-4" /> {turma.serie} "{turma.letra}"
          </CardTitle>
          <CardDescription>
            {turma.alunos.length} alunos · {grupos.length} grupos cadastrados
          </CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={criarAutomaticamente}>
          <Wand2 className="size-3.5" /> Criar grupos automaticamente
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {grupos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum grupo cadastrado nesta turma.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {grupos.map((grupo) => {
              const totalAlunos = turma.alunos.filter((a) => a.grupoId === grupo.id).length;
              return (
                <div
                  key={grupo.id}
                  className="grid gap-3 rounded-lg border border-border/60 p-3 sm:grid-cols-[1fr_2fr_auto]"
                >
                  <div className="flex flex-col gap-1.5">
                    <Label>Nome do grupo</Label>
                    <ConfirmedInlineInput
                      valor={grupo.nome}
                      titulo="Salvar novo nome do grupo?"
                      descricao="O cronômetro ao vivo passa a mostrar esse nome imediatamente."
                      onSalvar={(novoValor) => onUpdate(grupo.id, { nome: novoValor })}
                    />
                    <span className="text-xs text-muted-foreground">{totalAlunos} alunos</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Conteúdo do grupo</Label>
                    <ConfirmedInlineInput
                      valor={grupo.conteudo ?? ""}
                      placeholder="Ex.: Digitação e edição de texto"
                      titulo="Salvar novo conteúdo do grupo?"
                      descricao="O cronômetro ao vivo passa a mostrar esse conteúdo imediatamente."
                      onSalvar={(novoValor) => onUpdate(grupo.id, { conteudo: novoValor })}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={async () => {
                        const ok = await confirmar({
                          titulo: "Excluir este grupo?",
                          descricao: `Os alunos do grupo "${grupo.nome}" ficam sem grupo definido.`,
                          textoConfirmar: "Excluir",
                          destrutivo: true,
                        });
                        if (!ok) return;
                        onRemove(grupo.id);
                        toast.success("Grupo removido.");
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const nome = novoNome.trim() || `Grupo ${grupos.length + 1}`;
            const ok = await confirmar({
              titulo: "Adicionar novo grupo?",
              descricao: `"${nome}" será adicionado a ${turma.serie} "${turma.letra}".`,
            });
            if (!ok) return;
            onAdd(nome, "");
            setNovoNome("");
            toast.success("Grupo adicionado.");
          }}
        >
          <div className="flex min-w-48 flex-1 flex-col gap-1.5">
            <Label>Novo grupo</Label>
            <Input
              placeholder={`Grupo ${grupos.length + 1}`}
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
            />
          </div>
          <Button type="submit" size="sm">
            <Plus className="size-3.5" /> Adicionar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
