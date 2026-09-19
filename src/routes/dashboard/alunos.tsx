import { createFileRoute, Link } from "@tanstack/react-router";
import { Ban, HeartHandshake, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
      { title: "Buscar aluno · Agenda de Informática" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AlunosPage() {
  const { turmas } = useAppStore();
  const [busca, setBusca] = useState("");
  const [filtroTurma, setFiltroTurma] = useState<string>("todas");

  const linhas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return turmas
      .filter((t) => filtroTurma === "todas" || t.id === filtroTurma)
      .flatMap((turma) => turma.alunos.map((aluno) => ({ turma, aluno })))
      .filter(({ aluno }) => !termo || aluno.nome.toLowerCase().includes(termo))
      .sort((a, b) => a.aluno.nome.localeCompare(b.aluno.nome, "pt-BR"));
  }, [turmas, filtroTurma, busca]);

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Buscar aluno</h1>
        <p className="text-sm text-muted-foreground">
          Encontre rapidamente um aluno e veja em qual turma e grupo ele está. Para cadastrar,
          editar ou remover um aluno, abra a turma dele em{" "}
          <Link to="/dashboard/turmas" className="font-medium text-primary underline">
            Turmas e alunos
          </Link>
          .
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <CardTitle className="text-base">Alunos cadastrados ({linhas.length})</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome..."
                className="pl-8 sm:w-56"
                aria-label="Buscar aluno por nome"
              />
            </div>
            <Select value={filtroTurma} onValueChange={setFiltroTurma}>
              <SelectTrigger className="sm:w-52">
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                      {busca.trim()
                        ? `Nenhum aluno encontrado para "${busca.trim()}".`
                        : "Nenhum aluno cadastrado."}
                    </TableCell>
                  </TableRow>
                ) : (
                  linhas.map(({ turma, aluno }) => {
                    const grupo = turma.grupos?.find((g) => g.id === aluno.grupoId);
                    return (
                      <TableRow key={aluno.id}>
                        <TableCell>
                          <Link
                            to="/dashboard/turmas/$turmaId"
                            params={{ turmaId: turma.id }}
                            className="font-medium text-foreground hover:text-primary hover:underline"
                          >
                            {aluno.nome}
                          </Link>
                          {aluno.necessidadeEspecial ? (
                            <span className="ml-2 inline-flex items-center gap-1 text-xs text-primary">
                              <HeartHandshake className="size-3" /> Atendimento especializado
                            </span>
                          ) : null}
                          {aluno.impedido ? (
                            <span className="ml-2 inline-flex items-center gap-1 text-xs text-amber-600">
                              <Ban className="size-3" /> Impedido
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <Link
                            to="/dashboard/turmas/$turmaId"
                            params={{ turmaId: turma.id }}
                            className="hover:text-primary hover:underline"
                          >
                            {turma.serie} "{turma.letra}"
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {grupo ? grupo.nome : "Sem grupo"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
