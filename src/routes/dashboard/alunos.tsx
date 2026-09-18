import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardShell } from "@/components/school/dashboard-shell";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/dashboard/alunos")({
  component: AlunosPage,
  head: () => ({
    meta: [
      { title: "Alunos · Agenda de Informática" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const SEM_GRUPO = "sem-grupo";

function AlunosPage() {
  const { turmas, addAluno, updateAluno, removeAluno } = useAppStore();
  const [nome, setNome] = useState("");
  const [turmaId, setTurmaId] = useState<string>(turmas[0]?.id ?? "");
  const [grupoId, setGrupoId] = useState<string>(SEM_GRUPO);
  const [filtroTurma, setFiltroTurma] = useState<string>("todas");

  const turmaSelecionada = turmas.find((t) => t.id === turmaId);

  const linhas = useMemo(
    () =>
      turmas
        .filter((t) => filtroTurma === "todas" || t.id === filtroTurma)
        .flatMap((turma) => turma.alunos.map((aluno) => ({ turma, aluno }))),
    [turmas, filtroTurma],
  );

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Alunos</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre cada aluno com sua turma e seu grupo. Os nomes reais aparecem no cronômetro
          durante a aula.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="size-4" /> Novo aluno
          </CardTitle>
          <CardDescription>Escolha a turma e o grupo de revezamento do aluno.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              if (!nome.trim()) {
                toast.error("Informe o nome do aluno.");
                return;
              }
              if (!turmaId) {
                toast.error("Cadastre uma turma antes de adicionar alunos.");
                return;
              }
              addAluno(turmaId, {
                nome: nome.trim(),
                grupoId: grupoId === SEM_GRUPO ? undefined : grupoId,
              });
              setNome("");
              toast.success("Aluno cadastrado.");
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nome-aluno">Nome do aluno</Label>
              <Input id="nome-aluno" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Turma</Label>
              <Select
                value={turmaId}
                onValueChange={(value) => {
                  setTurmaId(value);
                  setGrupoId(SEM_GRUPO);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {turmas.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.serie} "{turma.letra}"
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Grupo</Label>
              <Select value={grupoId} onValueChange={setGrupoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sem grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEM_GRUPO}>Sem grupo</SelectItem>
                  {(turmaSelecionada?.grupos ?? []).map((grupo) => (
                    <SelectItem key={grupo.id} value={grupo.id}>
                      {grupo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">
              <Plus /> Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Alunos cadastrados ({linhas.length})</CardTitle>
          <div className="w-52">
            <Select value={filtroTurma} onValueChange={setFiltroTurma}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as turmas</SelectItem>
                {turmas.map((turma) => (
                  <SelectItem key={turma.id} value={turma.id}>
                    {turma.serie} "{turma.letra}"
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead className="w-40">Turma</TableHead>
                  <TableHead className="w-52">Grupo</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      Nenhum aluno cadastrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  linhas.map(({ turma, aluno }) => (
                    <TableRow key={aluno.id}>
                      <TableCell>
                        <Input
                          value={aluno.nome}
                          onChange={(e) =>
                            updateAluno(turma.id, aluno.id, { nome: e.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {turma.serie} "{turma.letra}"
                      </TableCell>
                      <TableCell>
                        <Select
                          value={aluno.grupoId ?? SEM_GRUPO}
                          onValueChange={(value) =>
                            updateAluno(turma.id, aluno.id, {
                              grupoId: value === SEM_GRUPO ? undefined : value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sem grupo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={SEM_GRUPO}>Sem grupo</SelectItem>
                            {(turma.grupos ?? []).map((grupo) => (
                              <SelectItem key={grupo.id} value={grupo.id}>
                                {grupo.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => {
                            removeAluno(turma.id, aluno.id);
                            toast.success("Aluno removido.");
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
