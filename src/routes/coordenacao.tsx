import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ClipboardList, GraduationCap, UserCheck, UserX, Users2 } from "lucide-react";
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
import { DiarioAulas } from "@/components/school/diario-aulas";
import { NavBar } from "@/components/school/nav-bar";
import { Paginacao } from "@/components/school/paginacao";
import { paginar } from "@/lib/paginar";
import { PageBackground } from "@/components/school/page-background";
import { SiteImage } from "@/components/school/site-image";
import { SiteFooter } from "@/components/school/site-footer";
import { useAppStore } from "@/lib/app-store";
import { fetchPresencasRange } from "@/lib/presencas";
import { toDateKey, agoraNaEscola } from "@/lib/schedule-engine";
import type { Presenca } from "@/lib/types";
import coordenacaoHeroImg from "@/assets/alunos-hero.jpg";

export const Route = createFileRoute("/coordenacao")({
  component: CoordenacaoPage,
  head: () => ({
    meta: [
      { title: "Coordenação · Frequência das aulas de informática" },
      {
        name: "description",
        content:
          "Painel aberto da coordenação: participação e faltas por turma e grupo nas aulas de informática.",
      },
      // A página fala de frequência de crianças. Mesmo sem nomes, ela não
      // tem por que aparecer em busca — some do índice junto com as demais
      // áreas internas do site.
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function mesAtual(): string {
  const hoje = agoraNaEscola();
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
  const [paginaFaltas, setPaginaFaltas] = useState(1);
  useEffect(() => setPaginaFaltas(1), [mes]);

  useEffect(() => {
    let cancelado = false;
    const { inicio, fim } = intervaloDoMes(mes);
    setRegistros(null);
    setErro(null);

    // Se o Supabase demorar demais ou nunca responder (rede indisponível,
    // bloqueio, etc.), evita deixar as tabelas presas em "Carregando..."
    // para sempre — mostra uma lista vazia com o aviso do erro.
    const timeout = new Promise<Presenca[]>((_, reject) =>
      setTimeout(() => reject(new Error("Tempo esgotado ao buscar dados de frequência.")), 6000),
    );

    Promise.race([fetchPresencasRange(inicio, fim), timeout])
      .then((dados) => {
        if (cancelado) return;
        // Mesmo corte do painel administrativo: o que foi registrado antes do
        // início oficial de uso são testes da configuração do sistema. Sem
        // isso, esta página e a Frequência do painel mostravam contagens
        // diferentes para o mesmo mês.
        const corte = config.dataInicioOperacao;
        setRegistros(corte ? dados.filter((r) => r.data >= corte) : dados);
      })
      .catch((err: Error) => {
        if (!cancelado) {
          setErro(err.message);
          setRegistros([]);
        }
      });
    return () => {
      cancelado = true;
    };
  }, [mes, config.dataInicioOperacao]);

  const nomeTurma = (id: string) => {
    const t = turmas.find((turma) => turma.id === id);
    return t ? `${t.serie} "${t.letra}"` : id;
  };

  const porTurmaGrupo = useMemo(() => {
    const mapa = new Map<
      string,
      { turmaId: string; grupo: number; presentes: number; faltas: number }
    >();
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

  /** Faltas somadas por dia e turma — sem identificar a criança. */
  const faltasPorDia = useMemo(() => {
    const mapa = new Map<string, { data: string; turmaId: string; faltas: number }>();
    for (const registro of faltas) {
      const chave = `${registro.data}|${registro.turmaId}`;
      const atual = mapa.get(chave) ?? {
        data: registro.data,
        turmaId: registro.turmaId,
        faltas: 0,
      };
      atual.faltas += 1;
      mapa.set(chave, atual);
    }
    return [...mapa.values()].sort((a, b) => b.data.localeCompare(a.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registros]);
  const participacoes = (registros ?? []).length - faltas.length;
  const pagFaltas = paginar(faltasPorDia, paginaFaltas, 10);

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_-10%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_55%),radial-gradient(circle_at_100%_15%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_50%)]"
          />
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-10">
            <div className="flex flex-col gap-4">
              <h1 className="text-2xl font-semibold text-foreground">Coordenação</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Diário das aulas (dadas, suspensas e reprogramadas), participação por turma e grupo
                e histórico de faltas. Acesso aberto, somente leitura.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-3 shadow-sm dark:border-white/15 dark:bg-card/60 dark:backdrop-blur-xl">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    <Users2 className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">Total de Turmas</p>
                    <p className="text-sm font-semibold text-foreground">{turmas.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-3 shadow-sm dark:border-white/15 dark:bg-card/60 dark:backdrop-blur-xl">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <GraduationCap className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">Alunos Cadastrados</p>
                    <p className="text-sm font-semibold text-foreground">
                      {turmas.reduce((sum, t) => sum + t.alunos.length, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <SiteImage
              src={coordenacaoHeroImg}
              alt="Sala de aula com tecnologia educacional para coordenação de aulas e gestão escolar"
              width={1200}
              height={750}
              className="aspect-[16/10] max-h-56 w-full rounded-2xl border border-border bg-card shadow-md dark:border-white/10 dark:bg-card/60 dark:shadow-xl dark:backdrop-blur-lg sm:max-h-64"
              loading="eager"
              decoding="async"
            />
          </div>
        </section>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          {/* O cronograma da semana mora na Agenda, que navega entre as
            semanas e abre a lista de alunos de cada turma. Aqui fica só o
            atalho — manter uma segunda cópia, mais pobre, só criava duas
            versões da mesma informação. */}
          <Link
            to="/agenda"
            className="group mb-4 flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/40"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarDays className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground group-hover:text-primary">
                Calendário das aulas
              </span>
              <span className="block text-xs text-muted-foreground">
                Semana a semana, com os alunos previstos em cada turma.
              </span>
            </span>
            <span className="hidden shrink-0 text-sm font-medium text-primary group-hover:underline sm:block">
              Abrir a Agenda →
            </span>
          </Link>

          <div className="mb-4 flex flex-wrap items-end gap-3">
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
            <p className="mb-4 text-sm text-destructive">
              Não foi possível carregar a frequência agora: {erro}
            </p>
          ) : null}

          <DiarioAulas registros={registros} mes={mes} />

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <Card>
              <CardHeader className="p-4 pb-1.5">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <UserCheck className="size-4 text-primary" />✅ Sessões com Participação
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-semibold text-foreground">{participacoes}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  número de registros de presença
                </p>
                <p className="text-xs text-primary/70 mt-2 font-medium">
                  (Soma de todos os alunos que compareceram)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-4 pb-1.5">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <UserX className="size-4 text-destructive" />❌ Registros de Ausência
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-semibold text-foreground">{faltas.length}</p>
                <p className="text-xs text-muted-foreground mt-1">número de registros de falta</p>
                <p className="text-xs text-destructive/70 mt-2 font-medium">
                  (Soma de todos os alunos que faltaram)
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-4">
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
              <CardTitle className="text-base">Faltas por dia ({faltas.length} no mês)</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Antes esta tabela trazia o nome de cada criança e o motivo da
                falta ("não quis participar") numa página aberta e indexável.
                A coordenação precisa enxergar o tamanho do problema, não
                expor a criança: aqui ficam as contagens por dia e turma, e o
                caso a caso continua no painel, atrás do login. */}
              <p className="mb-3 text-xs text-muted-foreground">
                Contagem por dia e turma. O detalhe por aluno fica no painel da escola, com login.
              </p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">Data</TableHead>
                      <TableHead>Turma</TableHead>
                      <TableHead className="text-right">Faltas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {faltasPorDia.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                          {registros === null
                            ? "Carregando..."
                            : "Nenhuma falta registrada no mês."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagFaltas.itens.map((linha) => (
                        <TableRow key={`${linha.data}-${linha.turmaId}`}>
                          <TableCell className="font-mono text-sm">
                            {new Date(`${linha.data}T00:00:00`).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-sm">{nomeTurma(linha.turmaId)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="destructive">{linha.faltas}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <Paginacao
                atual={pagFaltas.atual}
                totalPaginas={pagFaltas.totalPaginas}
                onChange={setPaginaFaltas}
              />
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
