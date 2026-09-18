import { createFileRoute } from "@tanstack/react-router";
import { CalendarPlus, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { DashboardShell } from "@/components/school/dashboard-shell";
import { useAppStore } from "@/lib/app-store";
import { useConfirmar } from "@/lib/confirm-store";

export const Route = createFileRoute("/dashboard/aulas")({
  component: AulasPage,
  head: () => ({
    meta: [
      { title: "Aulas · Agenda de Informática" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const TODOS_OS_GRUPOS = "todos";

/**
 * Cadastro único de aulas: turma, grupo, conteúdo e horário em um só lugar.
 * O que é salvo aqui tem prioridade sobre o rodízio automático e é lido
 * imediatamente pelo cronômetro ao vivo e pelo modo TV.
 */
function AulasPage() {
  const { turmas, config, addAula, updateAula, removeAula } = useAppStore();
  const confirmar = useConfirmar();
  const aulas = [...(config.aulas ?? [])].sort(
    (a, b) =>
      config.diasSemana.indexOf(a.dia) - config.diasSemana.indexOf(b.dia) ||
      a.inicio.localeCompare(b.inicio),
  );

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [dia, setDia] = useState(config.diasSemana[0] ?? "Segunda");
  const [turmaId, setTurmaId] = useState(turmas[0]?.id ?? "");
  const [grupoId, setGrupoId] = useState(TODOS_OS_GRUPOS);
  const [inicio, setInicio] = useState(config.horaInicio);
  const [fim, setFim] = useState("");
  const [conteudo, setConteudo] = useState("");

  const turmaSelecionada = turmas.find((t) => t.id === turmaId);

  function limparFormulario() {
    setEditandoId(null);
    setDia(config.diasSemana[0] ?? "Segunda");
    setTurmaId(turmas[0]?.id ?? "");
    setGrupoId(TODOS_OS_GRUPOS);
    setInicio(config.horaInicio);
    setFim("");
    setConteudo("");
  }

  function editar(aulaId: string) {
    const aula = (config.aulas ?? []).find((a) => a.id === aulaId);
    if (!aula) return;
    setEditandoId(aula.id);
    setDia(aula.dia);
    setTurmaId(aula.turmaId);
    setGrupoId(aula.grupoId ?? TODOS_OS_GRUPOS);
    setInicio(aula.inicio);
    setFim(aula.fim);
    setConteudo(aula.conteudo ?? "");
  }

  async function salvar() {
    if (!turmaId) {
      toast.error("Cadastre uma turma antes de criar a aula.");
      return;
    }
    if (!inicio || !fim || fim <= inicio) {
      toast.error("Informe um horário de início e de fim válidos.");
      return;
    }
    const dados = {
      dia,
      turmaId,
      inicio,
      fim,
      grupoId: grupoId === TODOS_OS_GRUPOS ? undefined : grupoId,
      conteudo: conteudo.trim() || undefined,
    };
    const ok = await confirmar({
      titulo: editandoId ? "Salvar alterações desta aula?" : "Cadastrar esta aula?",
      descricao: "O cronômetro ao vivo e a agenda pública são atualizados imediatamente.",
    });
    if (!ok) return;
    if (editandoId) {
      updateAula(editandoId, dados);
      toast.success("Aula atualizada. O cronômetro já está atualizado.");
    } else {
      addAula(dados);
      toast.success("Aula cadastrada. O cronômetro já está atualizado.");
    }
    limparFormulario();
  }

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Aulas</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre cada aula com turma, grupo, conteúdo e horário. O cronômetro ao vivo e o modo TV
          se atualizam sozinhos.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarPlus className="size-4" /> {editandoId ? "Editar aula" : "Nova aula"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dia">Dia da semana</Label>
            <Select value={dia} onValueChange={setDia}>
              <SelectTrigger id="dia">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {config.diasSemana.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="turma">Turma</Label>
            <Select
              value={turmaId}
              onValueChange={(valor) => {
                setTurmaId(valor);
                setGrupoId(TODOS_OS_GRUPOS);
              }}
            >
              <SelectTrigger id="turma">
                <SelectValue placeholder="Escolha a turma" />
              </SelectTrigger>
              <SelectContent>
                {turmas.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.serie} "{t.letra}"
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="grupo">Grupo</Label>
            <Select value={grupoId} onValueChange={setGrupoId}>
              <SelectTrigger id="grupo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS_OS_GRUPOS}>Revezar todos os grupos</SelectItem>
                {(turmaSelecionada?.grupos ?? []).map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inicio">Início</Label>
            <Input
              id="inicio"
              type="time"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fim">Fim</Label>
            <Input id="fim" type="time" value={fim} onChange={(e) => setFim(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
            <Label htmlFor="conteudo">Conteúdo da aula</Label>
            <Textarea
              id="conteudo"
              rows={2}
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Ex.: Digitação no editor de texto"
            />
          </div>

          <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
            <Button onClick={salvar}>
              <CalendarPlus className="size-4" /> {editandoId ? "Salvar alterações" : "Cadastrar aula"}
            </Button>
            {editandoId ? (
              <Button variant="outline" onClick={limparFormulario}>
                <X className="size-4" /> Cancelar edição
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Aulas cadastradas ({aulas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dia</TableHead>
                  <TableHead className="w-32">Horário</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Conteúdo</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {aulas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Nenhuma aula cadastrada - o rodízio automático continua valendo.
                    </TableCell>
                  </TableRow>
                ) : (
                  aulas.map((aula) => {
                    const turma = turmas.find((t) => t.id === aula.turmaId);
                    const grupo = turma?.grupos?.find((g) => g.id === aula.grupoId);
                    return (
                      <TableRow key={aula.id}>
                        <TableCell className="text-sm">{aula.dia}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {aula.inicio} - {aula.fim}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-foreground">
                          {turma ? `${turma.serie} "${turma.letra}"` : "Turma removida"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {grupo?.nome ?? "Todos (revezamento)"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {aula.conteudo || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Editar aula"
                              onClick={() => editar(aula.id)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Excluir aula"
                              onClick={async () => {
                                const ok = await confirmar({
                                  titulo: "Excluir esta aula?",
                                  descricao: "O horário volta a valer o rodízio automático.",
                                  textoConfirmar: "Excluir",
                                  destrutivo: true,
                                });
                                if (!ok) return;
                                removeAula(aula.id);
                                if (editandoId === aula.id) limparFormulario();
                                toast.success("Aula excluída.");
                              }}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
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
