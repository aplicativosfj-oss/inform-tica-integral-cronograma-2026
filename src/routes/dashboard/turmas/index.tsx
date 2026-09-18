import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Pencil, Plus, Trash2, Users2 } from "lucide-react";
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
import { useConfirmar } from "@/lib/confirm-store";
import { useAppStore } from "@/lib/app-store";
import type { Turma } from "@/lib/types";

export const Route = createFileRoute("/dashboard/turmas/")({
  component: TurmasPage,
  head: () => ({
    meta: [
      { title: "Turmas e alunos · Agenda de Informática" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

interface TurmaFormValues {
  serie: string;
  letra: string;
  professorRegente: string;
  imagem?: string | undefined;
}

const EMPTY_FORM: TurmaFormValues = {
  serie: "",
  letra: "",
  professorRegente: "",
  imagem: undefined,
};

function TurmaFormDialog({
  turma,
  onSubmit,
  trigger,
}: {
  turma?: Turma;
  onSubmit: (values: TurmaFormValues) => void;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<TurmaFormValues>(
    turma
      ? {
          serie: turma.serie,
          letra: turma.letra,
          professorRegente: turma.professorRegente,
          imagem: turma.imagem,
        }
      : EMPTY_FORM,
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setValues(
            turma
              ? {
                  serie: turma.serie,
                  letra: turma.letra,
                  professorRegente: turma.professorRegente,
                  imagem: turma.imagem,
                }
              : EMPTY_FORM,
          );
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{turma ? "Editar turma" : "Nova turma"}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!values.serie.trim() || !values.letra.trim() || !values.professorRegente.trim()) {
              toast.error("Preencha série, turma e professor(a) regente.");
              return;
            }
            onSubmit(values);
            setOpen(false);
          }}
        >
          <div className="flex justify-center">
            <ImageUploadField
              shape="square"
              value={values.imagem}
              onChange={(imagem) => setValues((v) => ({ ...v, imagem }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="serie">Série / Ano</Label>
              <Input
                id="serie"
                placeholder="Ex: 1º Ano"
                value={values.serie}
                onChange={(e) => setValues((v) => ({ ...v, serie: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="letra">Turma</Label>
              <Input
                id="letra"
                placeholder="Ex: A"
                value={values.letra}
                onChange={(e) => setValues((v) => ({ ...v, letra: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="professor">Professor(a) regente</Label>
            <Input
              id="professor"
              value={values.professorRegente}
              onChange={(e) => setValues((v) => ({ ...v, professorRegente: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="submit">{turma ? "Salvar alterações" : "Cadastrar turma"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TurmasPage() {
  const { turmas, addTurma, updateTurma, removeTurma } = useAppStore();
  const confirmar = useConfirmar();

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Turmas e alunos</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre a foto, a série e o(a) professor(a) regente de cada turma.
          </p>
        </div>
        <TurmaFormDialog
          onSubmit={async (values) => {
            const ok = await confirmar({
              titulo: "Cadastrar nova turma?",
              descricao: `${values.serie} "${values.letra}" será adicionada à agenda.`,
            });
            if (!ok) return;
            addTurma(values);
            toast.success("Turma cadastrada.");
          }}
          trigger={
            <Button>
              <Plus /> Nova turma
            </Button>
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {turmas.map((turma) => (
          <Card key={turma.id} className="overflow-hidden">
            <div className="flex h-28 items-center justify-center bg-muted">
              {turma.imagem ? (
                <img src={turma.imagem} alt="" className="size-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-muted-foreground/60">
                  {turma.serie.charAt(0)}
                  {turma.letra}
                </span>
              )}
            </div>
            <CardContent className="flex flex-col gap-3 pt-4">
              <div>
                <p className="font-semibold text-foreground">
                  {turma.serie} "{turma.letra}"
                </p>
                <p className="text-sm text-muted-foreground">Prof(a). {turma.professorRegente}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Users2 className="size-3.5" /> {turma.alunos.length} alunos
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="secondary" className="flex-1">
                  <Link to="/dashboard/turmas/$turmaId" params={{ turmaId: turma.id }}>
                    Alunos <ChevronRight className="size-3.5" />
                  </Link>
                </Button>
                <TurmaFormDialog
                  turma={turma}
                  onSubmit={async (values) => {
                    const ok = await confirmar({
                      titulo: "Salvar alterações da turma?",
                      descricao: `Isso atualiza os dados de ${turma.serie} "${turma.letra}" imediatamente.`,
                    });
                    if (!ok) return;
                    updateTurma(turma.id, values);
                    toast.success("Turma atualizada.");
                  }}
                  trigger={
                    <Button size="sm" variant="outline">
                      <Pencil className="size-3.5" />
                    </Button>
                  }
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-destructive">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir turma?</AlertDialogTitle>
                      <AlertDialogDescription>
                        A turma {turma.serie} "{turma.letra}" e seus {turma.alunos.length} alunos
                        serão removidos permanentemente da agenda.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          removeTurma(turma.id);
                          toast.success("Turma removida.");
                        }}
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
