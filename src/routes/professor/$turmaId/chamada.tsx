import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CalendarCheck2, Check, Loader2, UserX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HeroProfissional } from "@/components/school/hero-profissional";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { SiteFooter } from "@/components/school/site-footer";
import { useAppStore } from "@/lib/app-store";
import { fetchPresencasRange, marcarFalta, registrarPresencasIniciais } from "@/lib/presencas";
import { temSessaoDeProfessor } from "@/lib/profissional-session";
import { buildGrupos, agoraNaEscola } from "@/lib/schedule-engine";
import type { Presenca } from "@/lib/types";

export const Route = createFileRoute("/professor/$turmaId/chamada")({
  component: ChamadaProfessor,
  head: () => ({
    meta: [
      { title: "Chamada · Espaço do Professor" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function hojeISO(): string {
  const hoje = agoraNaEscola();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(
    hoje.getDate(),
  ).padStart(2, "0")}`;
}

function ChamadaProfessor() {
  const { turmaId } = Route.useParams();
  const { turmas, config } = useAppStore();
  const navigate = useNavigate();
  const turma = turmas.find((t) => t.id === turmaId);

  const [data, setData] = useState(hojeISO);
  const [grupoIndice, setGrupoIndice] = useState("0");
  const [registros, setRegistros] = useState<Presenca[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);

  useEffect(() => {
    if (!temSessaoDeProfessor(turmaId)) navigate({ to: "/professor" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaId]);

  async function carregar() {
    setCarregando(true);
    try {
      setRegistros(await fetchPresencasRange(data, data, turmaId));
    } catch {
      setRegistros([]);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, turmaId]);

  const grupos = useMemo(() => (turma ? buildGrupos(turma, config) : []), [turma, config]);
  const grupo = grupos[Number(grupoIndice)];

  /** O que já está gravado para cada aluno neste dia. */
  const statusPorAluno = useMemo(() => {
    const mapa = new Map<string, Presenca>();
    for (const r of registros) mapa.set(r.alunoId, r);
    return mapa;
  }, [registros]);

  async function abrirChamada() {
    if (!grupo) return;
    setSalvandoId("grupo");
    try {
      await registrarPresencasIniciais(turmaId, data, [
        {
          indice: grupo.indice,
          alunos: grupo.alunos.map((a) => ({ id: a.id, nome: a.nome })),
        },
      ]);
      toast.success("Chamada aberta: todos marcados como presentes.");
      await carregar();
    } catch (err) {
      toast.error(`Não foi possível abrir a chamada: ${(err as Error).message}`);
    } finally {
      setSalvandoId(null);
    }
  }

  async function registrarFalta(
    aluno: { id: string; nome: string },
    motivo: "ausente" | "nao_quis_participar",
  ) {
    if (!grupo) return;
    setSalvandoId(aluno.id);
    try {
      await marcarFalta(turmaId, data, aluno, grupo.indice, null, motivo);
      toast.success(`${aluno.nome.split(" ")[0]} marcado(a) como falta.`);
      await carregar();
    } catch (err) {
      toast.error(`Não foi possível registrar: ${(err as Error).message}`);
    } finally {
      setSalvandoId(null);
    }
  }

  if (!turma) {
    return (
      <div className="relative min-h-screen bg-background">
        <PageBackground />
        <div className="relative z-10">
          <NavBar />
          <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
            <p className="text-sm text-muted-foreground">Turma não encontrada.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/professor">Voltar</Link>
            </Button>
          </div>
          <SiteFooter />
        </div>
      </div>
    );
  }

  const presentes = registros.filter((r) => r.status !== "faltou").length;
  const faltas = registros.filter((r) => r.status === "faltou").length;

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <Link
            to="/professor/$turmaId"
            params={{ turmaId }}
            className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Voltar para minha turma
          </Link>

          <HeroProfissional
            etiqueta="Chamada"
            EtiquetaIcon={CalendarCheck2}
            titulo={`Frequência · ${turma.serie} "${turma.letra}"`}
            subtitulo="Abra a chamada do grupo que está no laboratório e marque quem faltou. O registro vale para a frequência da escola inteira."
            indicadores={[
              { rotulo: "Presenças no dia", valor: carregando ? "..." : presentes, icon: Check },
              { rotulo: "Faltas no dia", valor: carregando ? "..." : faltas, icon: UserX },
            ]}
          />

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="data">Dia</Label>
              <Input
                id="data"
                type="date"
                className="w-44"
                value={data}
                onChange={(e) => setData(e.target.value || hojeISO())}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="grupo">Grupo</Label>
              <Select value={grupoIndice} onValueChange={setGrupoIndice}>
                <SelectTrigger id="grupo" className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {grupos.map((g) => (
                    <SelectItem key={g.indice} value={String(g.indice)}>
                      {g.nome ?? `Grupo ${g.indice + 1}`} · {g.alunos.length} alunos
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={abrirChamada}
              disabled={!grupo || salvandoId === "grupo"}
              className="gap-1.5"
            >
              {salvandoId === "grupo" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Abrir chamada do grupo
            </Button>
          </div>

          <p className="mb-4 mt-2 text-xs text-muted-foreground">
            &quot;Abrir chamada&quot; marca todos do grupo como presentes — depois é só registrar
            quem faltou. Fazer de novo não duplica nada.
          </p>

          {!grupo ? (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                Esta turma ainda não tem grupos montados.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col divide-y divide-border/60 py-2">
                {grupo.alunos.map((aluno) => {
                  const registro = statusPorAluno.get(aluno.id);
                  const faltou = registro?.status === "faltou";
                  return (
                    <div
                      key={aluno.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{aluno.nome}</p>
                        {registro ? (
                          <Badge
                            variant={faltou ? "destructive" : "secondary"}
                            className="mt-1 font-normal"
                          >
                            {faltou
                              ? registro.motivo === "nao_quis_participar"
                                ? "Faltou — não quis participar"
                                : "Faltou"
                              : "Presente"}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem registro no dia</span>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={salvandoId === aluno.id || faltou}
                          onClick={() => registrarFalta(aluno, "ausente")}
                        >
                          {salvandoId === aluno.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : null}
                          Faltou
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground"
                          disabled={salvandoId === aluno.id || faltou}
                          onClick={() => registrarFalta(aluno, "nao_quis_participar")}
                        >
                          Não quis participar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
