import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardShell } from "@/components/school/dashboard-shell";
import { ImageUploadField } from "@/components/school/image-upload-field";
import { useAppStore } from "@/lib/app-store";
import { buildGrupos } from "@/lib/schedule-engine";
import type { Aluno } from "@/lib/types";

export const Route = createFileRoute("/dashboard/turmas/$turmaId")({
  component: TurmaAlunosPage,
});

interface AlunoFormValues {
  nome: string;
  foto?: string | undefined;
}

function AlunoFormDialog({
  aluno,
  onSubmit,
  trigger,
}: {
  aluno?: Aluno;
  onSubmit: (values: AlunoFormValues) => void;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<AlunoFormValues>(
    aluno ? { nome: aluno.nome, foto: aluno.foto } : { nome: "", foto: undefined },
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setValues(aluno ? { nome: aluno.nome, foto: aluno.foto } : { nome: "" });
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{aluno ? "Editar aluno" : "Novo aluno"}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!values.nome.trim()) {
              toast.error("Informe o nome do aluno.");
              return;
            }
            onSubmit(values);
            setOpen(false);
          }}
        >
          <div className="flex justify-center">
            <ImageUploadField
              value={values.foto}
              onChange={(foto) => setValues((v) => ({ ...v, foto }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome do aluno</Label>
            <Input
              id="nome"
              value={values.nome}
              onChange={(e) => setValues((v) => ({ ...v, nome: e.target.value }))}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="submit">{aluno ? "Salvar alterações" : "Cadastrar aluno"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TurmaAlunosPage() {
  const { turmaId } = Route.useParams();
  const { turmas, config, addAluno, updateAluno, removeAluno } = useAppStore();
  const navigate = useNavigate();
  const turma = turmas.find((t) => t.id === turmaId);

  if (!turma) {
    return (
      <DashboardShell>
        <p className="text-sm text-muted-foreground">Turma não encontrada.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate({ to: "/dashboard/turmas" })}
        >
          <ArrowLeft /> Voltar para turmas
        </Button>
      </DashboardShell>
    );
  }

  const grupos = buildGrupos(turma, config);

  return (
    <DashboardShell>
      <Button asChild variant="ghost" size="sm" className="mb-3 w-fit px-0 text-muted-foreground">
        <Link to="/dashboard/turmas">
          <ArrowLeft className="size-3.5" /> Todas as turmas
        </Link>
      </Button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {turma.serie} "{turma.letra}"
          </h1>
          <p className="text-sm text-muted-foreground">
            Prof(a). regente: {turma.professorRegente} · {turma.alunos.length} alunos em{" "}
            {grupos.length} {grupos.length === 1 ? "grupo" : "grupos"} de até{" "}
            {config.numeroComputadores} alunos
          </p>
        </div>
        <AlunoFormDialog
          onSubmit={(values) => {
            addAluno(turma.id, values);
            toast.success("Aluno cadastrado.");
          }}
          trigger={
            <Button>
              <Plus /> Novo aluno
            </Button>
          }
        />
      </div>

      <div className="flex flex-col gap-3">
        {grupos.map((grupo) => (
          <Card key={grupo.indice}>
            <CardContent className="py-4">
              <Badge variant="secondary" className="mb-3">
                Grupo {grupo.indice + 1}
              </Badge>
              {grupo.alunos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum aluno cadastrado ainda.</p>
              ) : (
                <div className="flex flex-col divide-y divide-border/60">
                  {grupo.alunos.map((aluno) => (
                    <div key={aluno.id} className="flex items-center justify-between gap-3 py-2">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                          {aluno.foto ? (
                            <img src={aluno.foto} alt="" className="size-full object-cover" />
                          ) : (
                            aluno.nome.charAt(0)
                          )}
                        </span>
                        <span className="text-sm font-medium text-foreground">{aluno.nome}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <AlunoFormDialog
                          aluno={aluno}
                          onSubmit={(values) => {
                            updateAluno(turma.id, aluno.id, values);
                            toast.success("Aluno atualizado.");
                          }}
                          trigger={
                            <Button size="sm" variant="ghost">
                              <Pencil className="size-3.5" />
                            </Button>
                          }
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive">
                              <Trash2 className="size-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover {aluno.nome}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação remove o aluno da turma e da agenda de revezamento.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  removeAluno(turma.id, aluno.id);
                                  toast.success("Aluno removido.");
                                }}
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
