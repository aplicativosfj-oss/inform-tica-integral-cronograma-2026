import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Ban,
  HeartHandshake,
  Loader2,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { DashboardShell } from "@/components/school/dashboard-shell";
import { ImageUploadField } from "@/components/school/image-upload-field";
import { useAppStore } from "@/lib/app-store";
import { buildGrupos } from "@/lib/schedule-engine";
import type { Aluno } from "@/lib/types";

export const Route = createFileRoute("/dashboard/turmas/$turmaId")({
  component: TurmaAlunosPage,
  head: () => ({
    meta: [
      { title: "Alunos da turma · Agenda de Informática" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

interface AlunoFormValues {
  nome: string;
  foto?: string | undefined;
  necessidadeEspecial?: boolean | undefined;
  observacoesNecessidade?: string | undefined;
  impedido?: boolean | undefined;
  motivoImpedimento?: string | undefined;
}

function AlunoFormDialog({
  aluno,
  onSubmit,
  trigger,
}: {
  aluno?: Aluno;
  onSubmit: (values: AlunoFormValues) => void | Promise<void>;
  trigger: ReactNode;
}) {
  const emptyValues: AlunoFormValues = aluno
    ? {
        nome: aluno.nome,
        foto: aluno.foto,
        necessidadeEspecial: aluno.necessidadeEspecial ?? false,
        observacoesNecessidade: aluno.observacoesNecessidade ?? "",
        impedido: aluno.impedido ?? false,
        motivoImpedimento: aluno.motivoImpedimento ?? "",
      }
    : {
        nome: "",
        foto: undefined,
        necessidadeEspecial: false,
        observacoesNecessidade: "",
        impedido: false,
        motivoImpedimento: "",
      };

  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<AlunoFormValues>(emptyValues);
  const [enviando, setEnviando] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setValues(emptyValues);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{aluno ? "Editar aluno" : "Novo aluno"}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!values.nome.trim()) {
              toast.error("Informe o nome do aluno.");
              return;
            }
            setEnviando(true);
            try {
              await onSubmit(values);
              setOpen(false);
            } finally {
              setEnviando(false);
            }
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
          <div className="flex items-center gap-2">
            <Checkbox
              id="necessidadeEspecial"
              checked={values.necessidadeEspecial ?? false}
              onCheckedChange={(checked) =>
                setValues((v) => ({ ...v, necessidadeEspecial: checked === true }))
              }
            />
            <Label htmlFor="necessidadeEspecial" className="font-normal">
              Necessita de atendimento especializado (mediador/cuidador)
            </Label>
          </div>
          {values.necessidadeEspecial ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="observacoes">Orientações para atividades de informática</Label>
              <Textarea
                id="observacoes"
                placeholder="Ex: TEA nível 1 — prefere atividades com menos estímulo visual e sonoro."
                value={values.observacoesNecessidade ?? ""}
                onChange={(e) =>
                  setValues((v) => ({ ...v, observacoesNecessidade: e.target.value }))
                }
              />
            </div>
          ) : null}
          <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5">
            <Checkbox
              id="impedido"
              checked={values.impedido ?? false}
              onCheckedChange={(checked) =>
                setValues((v) => ({ ...v, impedido: checked === true }))
              }
            />
            <Label htmlFor="impedido" className="font-normal">
              Impedido de participar do rodízio (ex.: não fez as tarefas em sala)
            </Label>
          </div>
          {values.impedido ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="motivoImpedimento">Motivo do impedimento</Label>
              <Textarea
                id="motivoImpedimento"
                placeholder="Ex: não entregou as tarefas da semana passada."
                value={values.motivoImpedimento ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, motivoImpedimento: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Enquanto marcado, a chamada pula este aluno e chama automaticamente o próximo da
                fila.
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={enviando}>
              {enviando ? <Loader2 className="animate-spin" /> : null}
              {aluno ? "Salvar alterações" : "Cadastrar aluno"}
            </Button>
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

      {turma.apoioEspecial && turma.apoioEspecial.length > 0 ? (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-2 py-4">
            <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <HeartHandshake className="size-4 text-primary" /> Apoio especializado desta turma
            </p>
            <div className="flex flex-wrap gap-2">
              {turma.apoioEspecial.map((apoio, index) => (
                <Badge key={index} variant="outline" className="font-normal">
                  {apoio.funcao} {apoio.nome}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Marque abaixo o(s) aluno(s) atendido(s) para orientar as atividades de informática.
            </p>
          </CardContent>
        </Card>
      ) : null}

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
                        <div>
                          <span className="text-sm font-medium text-foreground">{aluno.nome}</span>
                          {aluno.necessidadeEspecial ? (
                            <span className="flex items-center gap-1 text-xs text-primary">
                              <HeartHandshake className="size-3" /> Atendimento especializado
                              {aluno.observacoesNecessidade
                                ? ` — ${aluno.observacoesNecessidade}`
                                : ""}
                            </span>
                          ) : null}
                          {aluno.impedido ? (
                            <span className="flex items-center gap-1 text-xs text-amber-600">
                              <Ban className="size-3" /> Impedido de participar
                              {aluno.motivoImpedimento ? ` — ${aluno.motivoImpedimento}` : ""}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        {aluno.impedido ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-emerald-600 hover:text-emerald-600"
                            aria-label={`Liberar participação de ${aluno.nome}`}
                            onClick={() => {
                              updateAluno(turma.id, aluno.id, {
                                impedido: false,
                                motivoImpedimento: undefined,
                              });
                              toast.success(`${aluno.nome} liberado(a) para voltar ao rodízio.`);
                            }}
                          >
                            <ShieldCheck className="size-3.5" /> Liberar
                          </Button>
                        ) : null}
                        <AlunoFormDialog
                          aluno={aluno}
                          onSubmit={(values) => {
                            updateAluno(turma.id, aluno.id, values);
                            toast.success("Aluno atualizado.");
                          }}
                          trigger={
                            <Button size="sm" variant="ghost" aria-label={`Editar ${aluno.nome}`}>
                              <Pencil className="size-3.5" />
                            </Button>
                          }
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              aria-label={`Remover ${aluno.nome}`}
                            >
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
