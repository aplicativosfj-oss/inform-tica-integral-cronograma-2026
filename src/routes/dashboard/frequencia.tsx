import { createFileRoute } from "@tanstack/react-router";
import { CalendarSearch, FileDown, UserCheck, UserX, Users2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import { DashboardShell } from "@/components/school/dashboard-shell";
import { useAppStore } from "@/lib/app-store";
import { fetchPresencasRange } from "@/lib/presencas";
import { exportarFrequenciaPdf } from "@/lib/relatorio-frequencia";
import { toDateKey } from "@/lib/schedule-engine";
import type { Presenca } from "@/lib/types";

export const Route = createFileRoute("/dashboard/frequencia")({
  component: FrequenciaPage,
  head: () => ({
    meta: [
      { title: "Frequência · Agenda de Informática" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const STATUS_LABEL: Record<Presenca["status"], string> = {
  presente: "Presente",
  faltou: "Faltou",
  substituido: "Substituiu",
};

function defaultRange() {
  const hoje = new Date();
  const inicio = new Date(hoje);
  inicio.setDate(inicio.getDate() - 6);
  return { inicio: toDateKey(inicio), fim: toDateKey(hoje) };
}

function FrequenciaPage() {
  const { turmas, config } = useAppStore();
  const [{ inicio, fim }, setRange] = useState(defaultRange);
  const [turmaId, setTurmaId] = useState<string>("todas");
  const [registros, setRegistros] = useState<Presenca[] | null>(null);
  const [ocultosPorCorte, setOcultosPorCorte] = useState(0);
  const [carregando, setCarregando] = useState(false);

  async function consultar() {
    setCarregando(true);
    try {
      const dados = await fetchPresencasRange(
        inicio,
        fim,
        turmaId === "todas" ? undefined : turmaId,
      );
      const corte = config.dataInicioOperacao;
      const filtrados = corte ? dados.filter((r) => r.data >= corte) : dados;
      setOcultosPorCorte(dados.length - filtrados.length);
      setRegistros(filtrados);
    } catch (err) {
      toast.error(`Não foi possível carregar o histórico: ${(err as Error).message}`);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    consultar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exportarPdf() {
    if (!registros) return;
    const turmaSelecionada = turmas.find((t) => t.id === turmaId);
    const ok = exportarFrequenciaPdf({
      titulo: turmaSelecionada
        ? `Frequência · ${turmaSelecionada.serie} "${turmaSelecionada.letra}"`
        : "Frequência das aulas de informática",
      periodo: `${new Date(`${inicio}T00:00:00`).toLocaleDateString("pt-BR")} a ${new Date(
        `${fim}T00:00:00`,
      ).toLocaleDateString("pt-BR")}`,
      registros,
      nomeTurma: (id: string) => {
        const t = turmas.find((turma) => turma.id === id);
        return t ? `${t.serie} "${t.letra}"` : id;
      },
      professorInformatica: config.professorInformatica,
    });
    if (!ok) {
      toast.error("O navegador bloqueou a janela de impressão. Permita pop-ups e tente de novo.");
    }
  }

  const totalPresentes = registros?.filter((r) => r.status !== "faltou").length ?? 0;
  const totalFaltas = registros?.filter((r) => r.status === "faltou").length ?? 0;

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Frequência</h1>
        <p className="text-sm text-muted-foreground">
          Consulte quem participou ou faltou nas aulas de informática por período.
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-end gap-3 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mes">Mês</Label>
            <Input
              id="mes"
              type="month"
              className="w-44"
              onChange={(e) => {
                const valor = e.target.value;
                if (!valor) return;
                const [ano, mes] = valor.split("-").map(Number);
                if (!ano || !mes) return;
                const primeiro = new Date(ano, mes - 1, 1);
                const ultimo = new Date(ano, mes, 0);
                setRange({ inicio: toDateKey(primeiro), fim: toDateKey(ultimo) });
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inicio">De</Label>
            <Input
              id="inicio"
              type="date"
              value={inicio}
              onChange={(e) => setRange((r) => ({ ...r, inicio: e.target.value }))}
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fim">Até</Label>
            <Input
              id="fim"
              type="date"
              value={fim}
              onChange={(e) => setRange((r) => ({ ...r, fim: e.target.value }))}
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="turma">Turma</Label>
            <Select value={turmaId} onValueChange={setTurmaId}>
              <SelectTrigger id="turma" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as turmas</SelectItem>
                {turmas.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.serie} "{t.letra}"
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={consultar} disabled={carregando}>
            <CalendarSearch className="size-4" /> {carregando ? "Consultando..." : "Consultar"}
          </Button>
          <Button variant="outline" onClick={exportarPdf} disabled={!registros}>
            <FileDown className="size-4" /> Exportar PDF
          </Button>
        </CardContent>
      </Card>

      {ocultosPorCorte > 0 ? (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
          {ocultosPorCorte === 1
            ? "1 registro"
            : `${ocultosPorCorte} registros`}{" "}
          anterior{ocultosPorCorte === 1 ? "" : "es"} a{" "}
          {new Date(`${config.dataInicioOperacao}T00:00:00`).toLocaleDateString("pt-BR")}{" "}
          {ocultosPorCorte === 1 ? "foi ocultado" : "foram ocultados"} por serem testes feitos
          durante a configuração do sistema, antes do início oficial de uso.
        </p>
      ) : null}

      {registros ? (
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <UserCheck className="size-4 text-emerald-600" />
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Participações no período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">{totalPresentes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <UserX className="size-4 text-destructive" />
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Faltas no período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">{totalFaltas}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardContent className="py-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Data</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!registros || registros.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      <Users2 className="mx-auto mb-2 size-6" />
                      {carregando ? "Consultando..." : "Nenhum registro de frequência no período."}
                    </TableCell>
                  </TableRow>
                ) : (
                  registros.map((registro) => {
                    const turma = turmas.find((t) => t.id === registro.turmaId);
                    return (
                      <TableRow key={registro.id}>
                        <TableCell className="font-mono text-sm">
                          {new Date(`${registro.data}T00:00:00`).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-sm text-foreground">
                          {turma ? `${turma.serie} "${turma.letra}"` : registro.turmaId}
                        </TableCell>
                        <TableCell className="text-sm text-foreground">
                          {registro.alunoNome}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          Grupo {registro.grupoIndice + 1}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={registro.status === "faltou" ? "destructive" : "secondary"}
                          >
                            {STATUS_LABEL[registro.status]}
                          </Badge>
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
