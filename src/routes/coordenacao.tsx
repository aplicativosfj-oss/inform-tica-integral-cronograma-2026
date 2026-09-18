import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, ClipboardList, UserCheck, UserX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NavBar } from "@/components/school/nav-bar";
import { useAppStore } from "@/lib/app-store";
import { fetchPresencasRange } from "@/lib/presencas";
import { buildWeeklySchedule, toDateKey } from "@/lib/schedule-engine";
import type { Presenca } from "@/lib/types";

export const Route = createFileRoute("/coordenacao")({
  component: CoordenacaoPage,
  head: () => ({
    meta: [
      { title: "Coordenação · Calendário de aulas e frequência de informática" },
      {
        name: "description",
        content:
          "Painel aberto da coordenação: calendário semanal das aulas de informática, participação por turma e grupo e histórico de faltas do mês.",
      },
      { property: "og:title", content: "Coordenação · Aulas e frequência de informática" },
      {
        property: "og:description",
        content: "Calendário das aulas, presença por turma e grupo e histórico de faltas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function mesAtual(): string {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

function intervaloDoMes(mes: string): { inicio: string; fim: string } {
  const [ano, m] = mes.split("-").map(Number);
  const primeiro = new Date(ano ?? 2026, (m ?? 1) - 1, 1);
  const ultimo = new Date(ano ?? 2026, m ?? 1, 0);
  return { inicio: toDateKey(primeiro), fim: toDateKey(ultimo) };
}

/**
 * Painel aberto (sem login) para a coordenação acompanhar o laboratório:
 * calendário das aulas da semana, participação por turma e grupo no mês e
 * o histórico de faltas. Somente leitura — nada aqui altera a agenda.
 */
function CoordenacaoPage() {
  const { turmas, config } = useAppStore();
  const [mes, setMes] = useState(mesAtual);
  const [registros, setRegistros] = useState<Presenca[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const assignments = useMemo(() => buildWeeklySchedule(turmas, config), [turmas, config]);

  useEffect(() => {
    let cancelado = false;
    const { inicio, fim } = intervaloDoMes(mes);
    setRegistros(null);
    setErro(null);
    fetchPresencasRange(inicio, fim)
      .then((dados) => {
        if (!cancelado) setRegistros(dados);
      })
      .catch((err: Error) => {
        if (!cancelado) setErro(err.message);
      });
    return () => {
      cancelado = true;
    };
  }, [mes]);

  const nomeTurma = (id: string) => {
    const t = turmas.find((turma) => turma.id === id);
    return t ? `${t.serie} "${t.letra}"` : id;
  };

  const porTurmaGrupo = useMemo(() => {
    const mapa = new Map<string, { turmaId: string; grupo: number; presentes: number; faltas: number }>();
    for (const r of registros ?? []) {
      const chave = `${r.turmaId}|${r.grupoIndice}`;
      const atual = mapa.get(chave) ?? {
        turmaId: r.turmaId,
        grupo: r.grupoIndice,
        presentes: 0,
        faltas: 0,
      };
      if (r.status === "faltou") atual.faltas += 1;
      else atual.presentes += 1;
      mapa.set(chave, atual);
    }
    return [...mapa.values()].sort(
      (a, b) => nomeTurma(a.turmaId).localeCompare(nomeTurma(b.turmaId)) || a.grupo - b.grupo,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registros, turmas]);

  const faltas = (registros ?? []).filter((r) => r.status === "faltou");
  const participacoes = (registros ?? []).length - faltas.length;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Coordenação</h1>
          <p className="text-sm text-muted-foreground">
            Calendário das aulas de informática, participação por turma e grupo e histórico de
            faltas. Acesso aberto, somente leitura.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4" /> Calendário da semana
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {config.diasSemana.map((dia) => {
              const doDia = assignments
                .filter((a) => a.dia === dia)
                .sort((a, b) => a.slot.inicio.localeCompare(b.slot.inicio));
              return (
                <div key={dia} className="rounded-lg border border-border/60 bg-card p-3">
                  <p className="mb-2 text-sm font-semibold text-foreground">{dia}</p>
                  {doDia.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sem aulas programadas.</p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {doDia.map((a) => (
                        <li
                          key={`${a.dia}-${a.slot.inicio}`}
                          className="flex flex-col text-xs text-muted-foreground"
                        >
                          <span className="font-mono text-foreground">
                            {a.slot.inicio} – {a.slot.fim}
                          </span>
                          <span>
                            {a.turma.serie} "{a.turma.letra}"
                            {a.conteudo ? ` · ${a.conteudo}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="mb-6 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mes">Mês</Label>
            <Input
              id="mes"
              type="month"
              className="w-44"
              value={mes}
              onChange={(e) => setMes(e.target.value || mesAtual())}
            />
          </div>
        </div>

        {erro ? (
          <p className="mb-6 text-sm text-destructive">
            Não foi possível carregar a frequência agora: {erro}
          </p>
        ) : null}

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <UserCheck className="size-4 text-primary" />
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Participações no mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">{participacoes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <UserX className="size-4 text-destructive" />
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Faltas no mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">{faltas.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="size-4" /> Presença por turma e grupo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Turma</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead className="text-right">Participações</TableHead>
                    <TableHead className="text-right">Faltas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {porTurmaGrupo.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        {registros === null ? "Carregando..." : "Nenhum registro neste mês."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    porTurmaGrupo.map((linha) => (
                      <TableRow key={`${linha.turmaId}-${linha.grupo}`}>
                        <TableCell className="text-sm font-medium text-foreground">
                          {nomeTurma(linha.turmaId)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          Grupo {linha.grupo + 1}
                        </TableCell>
                        <TableCell className="text-right text-sm">{linha.presentes}</TableCell>
                        <TableCell className="text-right text-sm">{linha.faltas}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Histórico de faltas ({faltas.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Data</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead className="text-right">Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faltas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        {registros === null ? "Carregando..." : "Nenhuma falta registrada no mês."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    faltas.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-mono text-sm">
                          {new Date(`${f.data}T00:00:00`).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-sm">{nomeTurma(f.turmaId)}</TableCell>
                        <TableCell className="text-sm text-foreground">{f.alunoNome}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          Grupo {f.grupoIndice + 1}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="destructive">
                            {f.motivo === "nao_quis_participar" ? "Não quis participar" : "Ausente"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
