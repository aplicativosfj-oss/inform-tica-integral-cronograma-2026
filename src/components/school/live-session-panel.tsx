import { useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  Clock3,
  HeartHandshake,
  Lock,
  MonitorPlay,
  Square,
  UserX,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimerRing } from "@/components/school/timer-ring";
import { TrocaGrupoOverlay } from "@/components/school/troca-grupo-overlay";
import { unlockAlertSound } from "@/lib/alert-sound";
import { useAppStore } from "@/lib/app-store";
import { useAuth } from "@/lib/auth-store";
import {
  fetchPresencasDoDia,
  fetchUltimaParticipacao,
  marcarFalta,
  registrarPresencasIniciais,
} from "@/lib/presencas";
import {
  buildSubBlocosComGrupos,
  buildWeeklySchedule,
  currentWeekdayLabel,
  escolherSubstituto,
  findSessaoAtual,
  selecionarAlunosDoDia,
  toDateKey,
  type GrupoRevezamento,
  type SubBloco,
} from "@/lib/schedule-engine";
import type { Aluno, Presenca, ScheduleConfig, Turma } from "@/lib/types";

/**
 * Aviso de troca de grupo: overlay visual em tela cheia sempre, mais os
 * bipes quando o professor liga o som (o navegador exige um clique antes de
 * permitir áudio). Componente filho para que seus hooks nunca fiquem atrás
 * de um early return do painel.
 */
function AlertaTroca({ chave, proximoGrupo }: { chave: string; proximoGrupo?: number }) {
  const [ativo, setAtivo] = useState(false);

  return (
    <>
      <TrocaGrupoOverlay chave={chave} proximoGrupo={proximoGrupo} comSom={ativo} />
      <Button
        type="button"
        size="sm"
        variant={ativo ? "secondary" : "outline"}
        onClick={async () => {
          if (ativo) {
            setAtivo(false);
            return;
          }
          const ok = await unlockAlertSound();
          setAtivo(ok);
          if (!ok) toast.error("Não foi possível ativar o som neste navegador.");
        }}
      >
        {ativo ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
        {ativo ? "Aviso sonoro ativo" : "Ativar aviso sonoro"}
      </Button>
    </>
  );
}

function useNow(enabled: boolean) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    if (!enabled) return;
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [enabled]);
  return now;
}

/** "08:30" -> 30600 seconds since midnight. */
function hhmmToSeconds(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  return (Number(h ?? 0) * 60 + Number(m ?? 0)) * 60;
}

function gruposFromPresencas(turma: Turma, presencas: Presenca[]): GrupoRevezamento[] {
  const porGrupo = new Map<number, Aluno[]>();
  for (const p of presencas) {
    if (p.status === "faltou") continue;
    const aluno: Aluno = turma.alunos.find((a) => a.id === p.alunoId) ?? {
      id: p.alunoId,
      nome: p.alunoNome,
    };
    const lista = porGrupo.get(p.grupoIndice) ?? [];
    lista.push(aluno);
    porGrupo.set(p.grupoIndice, lista);
  }
  return [...porGrupo.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([indice, alunos]) => ({ indice, alunos }));
}

/**
 * The "mark absent" control shown next to every student in the live roster.
 * Visible to everyone (so the school's public schedule is transparent about
 * who's up next), but only a logged-in professor/admin can actually confirm
 * it — an anonymous click is redirected to the login page instead.
 */
function AusenciaButton({
  nome,
  autenticado,
  onExigirLogin,
  onConfirmar,
}: {
  nome: string;
  autenticado: boolean;
  onExigirLogin: () => void;
  onConfirmar: (motivo: "ausente" | "nao_quis_participar") => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [enviando, setEnviando] = useState(false);

  if (!autenticado) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="shrink-0 gap-1.5 border-border/60 text-muted-foreground"
        onClick={onExigirLogin}
      >
        <Lock className="size-3.5" /> Ausente
      </Button>
    );
  }

  async function confirmar(motivo: "ausente" | "nao_quis_participar") {
    setEnviando(true);
    try {
      await onConfirmar(motivo);
      setOpen(false);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <UserX className="size-3.5" /> Ausente
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Registrar ausência de {nome}?</AlertDialogTitle>
          <AlertDialogDescription>
            Escolha o motivo abaixo. O sistema chama automaticamente, no lugar dele(a), o aluno que
            está há mais tempo sem participar — sem repetir e sem pular ninguém.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel disabled={enviando}>Cancelar</AlertDialogCancel>
          <Button
            type="button"
            variant="outline"
            disabled={enviando}
            onClick={() => confirmar("nao_quis_participar")}
          >
            Não quis participar
          </Button>
          <AlertDialogAction disabled={enviando} onClick={() => confirmar("ausente")}>
            Confirmar ausência
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Ensures today's roll call exists for the turma currently live (auto-picking
 * the fairest 14 students on first load of the day) and exposes a way to
 * mark a student absent, which immediately substitutes the fairest
 * available replacement and logs both to the `presencas` table.
 */
function useChamadaDoDia(
  turma: Turma | undefined,
  config: ScheduleConfig,
  dateKey: string,
  ativo: boolean,
  podeRegistrar: boolean,
) {
  const [presencas, setPresencas] = useState<Presenca[] | null>(null);
  const [ultimaParticipacao, setUltimaParticipacao] = useState<Map<string, string> | null>(null);

  const turmaId = turma?.id;

  useEffect(() => {
    if (!ativo || !turma || !dateKey) {
      setPresencas(null);
      setUltimaParticipacao(null);
      return;
    }
    let cancelled = false;
    async function ensure() {
      if (!turma) return;
      try {
        let registradas = await fetchPresencasDoDia(turma.id, dateKey);
        // Only an authenticated session may create today's roll call — an
        // anonymous visitor on the public homepage just reads whatever the
        // admin/professor has already registered.
        if (registradas.length === 0 && podeRegistrar) {
          const ultima = await fetchUltimaParticipacao(turma.id);
          const selecao = selecionarAlunosDoDia(turma, ultima, config.numeroComputadores);
          await registrarPresencasIniciais(turma.id, dateKey, selecao.grupos);
          registradas = await fetchPresencasDoDia(turma.id, dateKey);
        }
        const ultimaAtualizada = await fetchUltimaParticipacao(turma.id);
        if (!cancelled) {
          setPresencas(registradas);
          setUltimaParticipacao(ultimaAtualizada);
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(`Não foi possível carregar a chamada de hoje: ${(err as Error).message}`);
        }
      }
    }
    ensure();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo, turmaId, dateKey, config.numeroComputadores, podeRegistrar]);

  async function marcarFaltaDoAluno(
    aluno: Aluno,
    grupoIndice: number,
    motivo: "ausente" | "nao_quis_participar",
  ) {
    if (!turma || !presencas || !ultimaParticipacao) return;
    const jaChamadosHojeIds = new Set(
      presencas.filter((p) => p.status !== "faltou").map((p) => p.alunoId),
    );
    const substituto = escolherSubstituto(turma, ultimaParticipacao, jaChamadosHojeIds);
    await marcarFalta(
      turma.id,
      dateKey,
      { id: aluno.id, nome: aluno.nome },
      grupoIndice,
      substituto ? { id: substituto.id, nome: substituto.nome } : null,
      motivo,
    );
    const atualizadas = await fetchPresencasDoDia(turma.id, dateKey);
    setPresencas(atualizadas);
    return substituto;
  }

  return { presencas, marcarFaltaDoAluno };
}

export function LiveSessionPanel({ editable = false }: { editable?: boolean }) {
  const { turmas, config, setSessaoSuspensa, isReady } = useAppStore();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const now = useNow(true);

  const diaAtual = now ? currentWeekdayLabel(now) : "";
  const conteudoDoDia = config.conteudoPorDia?.[diaAtual] ?? "";
  const assignments = now ? buildWeeklySchedule(turmas, config) : [];
  const sessao = now ? findSessaoAtual(assignments, config, now) : null;
  const dateKey = now ? toDateKey(now) : "";

  const chamada = useChamadaDoDia(
    sessao?.assignment.turma,
    config,
    dateKey,
    isReady && Boolean(sessao) && !sessao?.suspensa,
    isAuthenticated,
  );

  if (!now) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Carregando relógio da aula...
        </CardContent>
      </Card>
    );
  }

  if (!sessao) {
    return (
      <Card className="border-dashed bg-muted/30">
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <Clock3 className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Nenhuma aula de informática agora</p>
          <p className="text-xs text-muted-foreground">
            {now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            {" · "}
            {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
          {conteudoDoDia ? (
            <p className="mt-2 max-w-md text-xs text-muted-foreground">
              Conteúdo previsto para hoje: {conteudoDoDia}
            </p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const { assignment, segundosRestantes, suspensa } = sessao;
  const dateKeySessao = dateKey;

  if (suspensa) {
    return (
      <Card className="border-dashed bg-muted/30">
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <Square className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Aula de {assignment.turma.serie} "{assignment.turma.letra}" parada pelo(a)
            administrador(a)
          </p>
          <p className="text-xs text-muted-foreground">
            {now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            {" · "}
            {assignment.slot.inicio} – {assignment.slot.fim}
          </p>
          {editable ? (
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => {
                setSessaoSuspensa(dateKeySessao, assignment.dia, assignment.slot.inicio, false);
                toast.success("Aula retomada.");
              }}
            >
              Retomar aula
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const gruposChamada =
    chamada.presencas && chamada.presencas.length > 0
      ? gruposFromPresencas(assignment.turma, chamada.presencas)
      : null;
  const subBlocosEfetivos: SubBloco[] | null = gruposChamada
    ? buildSubBlocosComGrupos(assignment, config, gruposChamada)
    : null;
  const subBloco = subBlocosEfetivos?.[sessao.subBloco.indice] ?? sessao.subBloco;
  const proximoSubBloco = subBlocosEfetivos?.[sessao.subBloco.indice + 1] ?? sessao.proximoSubBloco;

  const totalSegundos = Math.max(1, hhmmToSeconds(subBloco.fim) - hhmmToSeconds(subBloco.inicio));
  const decorridos = totalSegundos - segundosRestantes;

  return (
    <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MonitorPlay className="size-5 text-primary" />
          Aula em andamento
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary text-primary-foreground">AO VIVO</Badge>
          {editable ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="text-destructive">
                  <Square className="size-3.5" /> Parar aula
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Parar a aula em andamento?</AlertDialogTitle>
                  <AlertDialogDescription>
                    A aula de {assignment.turma.serie} "{assignment.turma.letra}" de hoje será
                    interrompida. A programação das próximas semanas não é afetada.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setSessaoSuspensa(
                        dateKeySessao,
                        assignment.dia,
                        assignment.slot.inicio,
                        true,
                      );
                      toast.success("Aula parada.");
                    }}
                  >
                    Parar aula
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex flex-col items-center gap-2 self-center lg:self-start">
          <TimerRing decorridos={decorridos} total={totalSegundos} />
          <p className="text-xs text-muted-foreground">
            Grupo {subBloco.grupo.indice + 1} · {subBloco.inicio} – {subBloco.fim}
          </p>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div>
            <p className="text-2xl font-semibold text-foreground">
              {assignment.turma.serie} "{assignment.turma.letra}"
            </p>
            <p className="text-sm text-muted-foreground">
              Prof(a). regente: {assignment.turma.professorRegente} · Informática:{" "}
              {config.professorInformatica}
            </p>
          </div>

          <div className="rounded-lg border border-border/60 bg-background/60 p-3">
            <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              <BookOpen className="size-3" /> Conteúdo de hoje ({diaAtual})
            </p>
            <p className="mt-1 text-sm text-foreground">
              {conteudoDoDia || "Nenhum conteúdo cadastrado para hoje."}
            </p>
          </div>

          {subBloco.grupo.alunos.length > 0 ? (
            <div>
              <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Users className="size-3" /> Alunos nesta rodada ({subBloco.grupo.alunos.length})
                {gruposChamada ? (
                  <span className="font-normal normal-case text-muted-foreground/70">
                    · chamada de hoje
                  </span>
                ) : null}
              </p>
              <div className="flex flex-col divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60 bg-background/60">
                {subBloco.grupo.alunos.map((aluno) => {
                  const destacar = editable && aluno.necessidadeEspecial;
                  return (
                    <div
                      key={aluno.id}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <div
                        className="flex min-w-0 items-center gap-2.5"
                        title={destacar ? aluno.observacoesNecessidade : undefined}
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                          {aluno.foto ? (
                            <img src={aluno.foto} alt="" className="size-full object-cover" />
                          ) : (
                            aluno.nome.charAt(0)
                          )}
                        </span>
                        <span className="truncate text-sm font-medium text-foreground">
                          {aluno.nome}
                        </span>
                        {destacar ? (
                          <HeartHandshake className="size-3.5 shrink-0 text-primary" />
                        ) : null}
                      </div>
                      {gruposChamada ? (
                        <AusenciaButton
                          nome={aluno.nome}
                          autenticado={isAuthenticated}
                          onExigirLogin={() => {
                            toast.info("Faça login para registrar a ausência de um aluno.");
                            navigate({ to: "/login" });
                          }}
                          onConfirmar={async (motivo) => {
                            const substituto = await chamada.marcarFaltaDoAluno(
                              aluno,
                              subBloco.grupo.indice,
                              motivo,
                            );
                            toast.success(
                              substituto
                                ? `${aluno.nome} registrado(a) como ${motivo === "ausente" ? "ausente" : "sem participar"}. ${substituto.nome} foi chamado(a) no lugar.`
                                : `${aluno.nome} registrado(a) como ${motivo === "ausente" ? "ausente" : "sem participar"}.`,
                            );
                          }}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
              {editable && subBloco.grupo.alunos.some((a) => a.necessidadeEspecial) ? (
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <HeartHandshake className="size-3 text-primary" /> Alunos destacados precisam de
                  atendimento especializado — passe o mouse sobre o nome para ver as orientações.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Esta turma ainda não tem alunos cadastrados.
            </p>
          )}

          {proximoSubBloco ? (
            <p className="text-xs text-muted-foreground">
              A seguir: grupo {proximoSubBloco.grupo.indice + 1} às {proximoSubBloco.inicio} (
              {proximoSubBloco.grupo.alunos.length} alunos)
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
