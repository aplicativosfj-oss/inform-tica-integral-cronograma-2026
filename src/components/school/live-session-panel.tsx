import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Ban,
  BookOpen,
  CalendarX2,
  Clock3,
  HeartHandshake,
  Lock,
  MonitorPlay,
  MessageSquareText,
  MoreHorizontal,
  Repeat2,
  Square,
  Tv,
  UserX,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ObservacaoAulaDialog } from "@/components/school/observacao-aula-dialog";
import { SuspenderAulaDialog } from "@/components/school/suspender-aula-dialog";
import { TimerAula } from "@/components/school/timer-aula";
import { TrocaGrupoOverlay } from "@/components/school/troca-grupo-overlay";
import { unlockAlertSound } from "@/lib/alert-sound";
import { useAppStore } from "@/lib/app-store";
import { useAuth } from "@/lib/auth-store";
import { useConfirmar } from "@/lib/confirm-store";
import {
  fetchPresencasDoDia,
  fetchUltimaParticipacao,
  marcarFalta,
  registrarPresencasIniciais,
} from "@/lib/presencas";
import {
  aplicarExcecoesDeData,
  buildSubBlocosComGrupos,
  buildWeeklySchedule,
  currentWeekdayLabel,
  escolherSubstituto,
  findSessaoAtual,
  getWeekIndex,
  gruposFromPresencas,
  gruposPorVisita,
  nextAssignmentsForDay,
  reprogramacoesParaData,
  selecionarAlunosDoDia,
  suspensaoKey,
  toDateKey,
  type SubBloco,
} from "@/lib/schedule-engine";
import type { Aluno, Presenca, ScheduleConfig, Turma } from "@/lib/types";
import { cn } from "@/lib/utils";

type MotivoFalta = "ausente" | "nao_quis_participar" | "limitacao";

const ROTULO_MOTIVO: Record<MotivoFalta, string> = {
  ausente: "Ausente",
  nao_quis_participar: "Não quis participar",
  limitacao: "Impedido(a)",
};

/**
 * Aviso de troca de grupo: overlay visual em tela cheia sempre, mais os
 * bipes quando o professor liga o som (o navegador exige um clique antes de
 * permitir áudio). Componente filho para que seus hooks nunca fiquem atrás
 * de um early return do painel.
 */
function AlertaTroca({
  chave,
  proximoGrupo,
  ativo,
  setAtivo,
}: {
  chave: string;
  proximoGrupo?: number;
  /** Mora no painel: o relógio precisa do mesmo estado para o sinal de fim. */
  ativo: boolean;
  setAtivo: (v: boolean) => void;
}) {
  return (
    <>
      <TrocaGrupoOverlay chave={chave} proximoGrupo={proximoGrupo} comSom={ativo} />
      <Button
        type="button"
        size="sm"
        variant={ativo ? "secondary" : "outline"}
        aria-label={ativo ? "Desativar aviso sonoro" : "Ativar aviso sonoro"}
        title={ativo ? "Aviso sonoro ativo" : "Ativar aviso sonoro"}
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
        <span className="hidden sm:inline">{ativo ? "Som ativo" : "Ativar som"}</span>
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

/** Tira o ponto final para o motivo caber no meio de uma frase. */
function semPontoFinal(texto: string): string {
  return texto.replace(/[.s]+$/, "");
}

/** "08:30" -> 30600 seconds since midnight. */
function hhmmToSeconds(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  return (Number(h ?? 0) * 60 + Number(m ?? 0)) * 60;
}

/**
 * Ensures today's roll call exists for the turma currently live (auto-picking
 * the fairest students on first load of the day) and exposes a way to mark a
 * student absent — replaced either by the fairest available student or by
 * one the professor picks by hand — logging both to the `presencas` table.
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
          const selecao = selecionarAlunosDoDia(
            turma,
            ultima,
            config.numeroComputadores,
            gruposPorVisita(config),
          );
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

  /** Alunos que podem entrar no lugar de alguém, do que está há mais tempo sem vir ao primeiro. */
  function candidatosASubstituto(): Aluno[] {
    if (!turma || !presencas) return [];
    const chamados = new Set(presencas.map((p) => p.alunoId));
    const ultima = ultimaParticipacao ?? new Map<string, string>();
    return turma.alunos
      .filter((a) => !chamados.has(a.id) && !a.impedido)
      .sort((a, b) => (ultima.get(a.id) ?? "").localeCompare(ultima.get(b.id) ?? ""));
  }

  async function marcarFaltaDoAluno(
    aluno: Aluno,
    grupoIndice: number,
    motivo: MotivoFalta,
    substitutoEscolhido?: Aluno | null,
  ) {
    if (!turma || !presencas || !ultimaParticipacao) return null;
    const jaChamadosHojeIds = new Set(
      presencas.filter((p) => p.status !== "faltou").map((p) => p.alunoId),
    );
    const substituto =
      substitutoEscolhido !== undefined
        ? substitutoEscolhido
        : escolherSubstituto(turma, ultimaParticipacao, jaChamadosHojeIds);
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

  return { presencas, marcarFaltaDoAluno, candidatosASubstituto };
}

type Chamada = ReturnType<typeof useChamadaDoDia>;

/**
 * Troca manual: o professor escolhe quem entra no lugar do aluno que não
 * pode participar. A lista vem ordenada por justiça (quem está há mais tempo
 * sem vir primeiro) e o primeiro já vem marcado como sugestão.
 */
function SubstituirDialog({
  aluno,
  candidatos,
  open,
  onOpenChange,
  onConfirmar,
}: {
  aluno: Aluno;
  candidatos: Aluno[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirmar: (substituto: Aluno | null, motivo: MotivoFalta) => Promise<void>;
}) {
  const [escolhidoId, setEscolhidoId] = useState<string | null>(null);
  const [motivo, setMotivo] = useState<MotivoFalta>("ausente");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (open) {
      setEscolhidoId(candidatos[0]?.id ?? null);
      setMotivo("ausente");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function confirmar() {
    setEnviando(true);
    try {
      await onConfirmar(candidatos.find((c) => c.id === escolhidoId) ?? null, motivo);
      onOpenChange(false);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Substituir {aluno.nome}</DialogTitle>
          <DialogDescription>
            Escolha quem entra no lugar. {aluno.nome} mantém a prioridade e volta a ser chamado(a)
            primeiro na próxima aula.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label>Motivo</Label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(ROTULO_MOTIVO) as MotivoFalta[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMotivo(m)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs transition-colors",
                  motivo === m
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border/70 text-muted-foreground hover:bg-muted",
                )}
              >
                {ROTULO_MOTIVO[m]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Entra no lugar</Label>
          {candidatos.length > 0 ? (
            <div className="flex max-h-64 flex-col gap-1 overflow-y-auto pr-1">
              {candidatos.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setEscolhidoId(c.id)}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    escolhidoId === c.id
                      ? "border-primary bg-primary/10"
                      : "border-border/60 hover:bg-muted/60",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Avatar aluno={c} />
                    <span className="truncate font-medium">{c.nome}</span>
                  </span>
                  {i === 0 ? (
                    <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      Na vez
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed px-3 py-3 text-xs text-muted-foreground">
              Todos os alunos disponíveis da turma já foram chamados hoje. A falta será registrada
              sem substituto.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={enviando} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={enviando} onClick={confirmar}>
            {candidatos.length > 0 ? "Confirmar troca" : "Registrar falta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImpedirDialog({
  aluno,
  open,
  onOpenChange,
  onConfirmar,
}: {
  aluno: Aluno;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirmar: (motivo: string) => Promise<void>;
}) {
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setMotivo("");
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Impedir {aluno.nome} de participar?</DialogTitle>
          <DialogDescription>
            Use quando o(a) professor(a) regente indicar que o aluno não pode participar (ex.: não
            cumpriu as tarefas). O próximo da fila entra no lugar, e {aluno.nome} fica fora do
            rodízio até ser liberado(a) na página da turma.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="motivo-impedimento" className="text-xs font-normal text-muted-foreground">
            Motivo (opcional)
          </Label>
          <Textarea
            id="motivo-impedimento"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex: não entregou as tarefas da semana."
            rows={2}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={enviando} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={enviando}
            onClick={async () => {
              setEnviando(true);
              try {
                await onConfirmar(motivo.trim());
                setMotivo("");
                onOpenChange(false);
              } finally {
                setEnviando(false);
              }
            }}
          >
            Confirmar impedimento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Avatar({ aluno, className }: { aluno: Aluno; className?: string | undefined }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-xs font-semibold text-primary",
        className,
      )}
    >
      {aluno.foto ? (
        <img src={aluno.foto} alt="" className="size-full object-cover" />
      ) : (
        aluno.nome
          .split(" ")
          .slice(0, 2)
          .map((p) => p.charAt(0))
          .join("")
          .toUpperCase()
      )}
    </span>
  );
}

/**
 * Menu de ações de um aluno da chamada. Todas as opções ficam num único botão
 * "⋯" — assim o nome do aluno tem a linha inteira e nunca fica escondido.
 */
function AcoesAluno({
  aluno,
  grupoIndice,
  turma,
  chamada,
}: {
  aluno: Aluno;
  grupoIndice: number;
  turma: Turma;
  chamada: Chamada;
}) {
  const { updateAluno } = useAppStore();
  const confirmar = useConfirmar();
  const [substituirAberto, setSubstituirAberto] = useState(false);
  const [impedirAberto, setImpedirAberto] = useState(false);

  async function registrar(motivo: MotivoFalta, substituto?: Aluno | null) {
    const quem = await chamada.marcarFaltaDoAluno(aluno, grupoIndice, motivo, substituto);
    const rotulo = ROTULO_MOTIVO[motivo].toLowerCase();
    toast.success(
      quem
        ? `${aluno.nome}: ${rotulo}. ${quem.nome} entra no lugar.`
        : `${aluno.nome}: ${rotulo}. Não há mais alunos disponíveis hoje.`,
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 shrink-0 text-muted-foreground"
            aria-label={`Ações para ${aluno.nome}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="truncate">{aluno.nome}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={async () => {
              const ok = await confirmar({
                titulo: `Registrar ausência de ${aluno.nome}?`,
                descricao: "O aluno que está há mais tempo sem participar entra no lugar.",
              });
              if (ok) await registrar("ausente");
            }}
          >
            <UserX className="size-4" /> Ausente (troca automática)
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setSubstituirAberto(true)}>
            <Repeat2 className="size-4" /> Substituir por outro aluno…
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={async () => {
              const ok = await confirmar({
                titulo: `${aluno.nome} não quis participar?`,
                descricao: "O próximo da fila entra no lugar.",
              });
              if (ok) await registrar("nao_quis_participar");
            }}
          >
            <Users className="size-4" /> Não quis participar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-amber-600 focus:text-amber-600"
            onSelect={() => setImpedirAberto(true)}
          >
            <Ban className="size-4" /> Impedir de participar…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SubstituirDialog
        aluno={aluno}
        candidatos={substituirAberto ? chamada.candidatosASubstituto() : []}
        open={substituirAberto}
        onOpenChange={setSubstituirAberto}
        onConfirmar={(substituto, motivo) => registrar(motivo, substituto)}
      />
      <ImpedirDialog
        aluno={aluno}
        open={impedirAberto}
        onOpenChange={setImpedirAberto}
        onConfirmar={async (motivo) => {
          updateAluno(turma.id, aluno.id, {
            impedido: true,
            motivoImpedimento: motivo || undefined,
          });
          await registrar("limitacao");
        }}
      />
    </>
  );
}

function ListaAlunos({
  alunos,
  grupoIndice,
  turma,
  chamada,
  podeGerenciar,
  destacarNecessidades,
  compacta = false,
}: {
  alunos: Aluno[];
  grupoIndice: number;
  turma: Turma;
  chamada: Chamada | null;
  podeGerenciar: boolean;
  destacarNecessidades: boolean;
  compacta?: boolean;
}) {
  if (alunos.length === 0) {
    return <p className="px-3 py-3 text-xs text-muted-foreground">Nenhum aluno neste grupo.</p>;
  }
  return (
    <ul className="flex flex-col divide-y divide-border/50">
      {alunos.map((aluno) => {
        const destacar = destacarNecessidades && aluno.necessidadeEspecial;
        return (
          <li
            key={aluno.id}
            className={cn("flex items-center gap-2.5 px-3", compacta ? "py-1.5" : "py-2")}
            title={destacar ? aluno.observacoesNecessidade : undefined}
          >
            <Avatar aluno={aluno} className={compacta ? "size-7" : undefined} />
            <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-foreground">
              {aluno.nome}
            </span>
            {destacar ? <HeartHandshake className="size-3.5 shrink-0 text-primary" /> : null}
            {aluno.impedido ? (
              <Ban className="size-3.5 shrink-0 text-amber-600" aria-label="Impedido" />
            ) : null}
            {podeGerenciar && chamada ? (
              <AcoesAluno aluno={aluno} grupoIndice={grupoIndice} turma={turma} chamada={chamada} />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Chamada completa do dia (painel administrativo): todos os grupos, quem
 * faltou riscado com o motivo, e os substitutos identificados.
 */
function ChamadaDoDiaCard({ turma, chamada }: { turma: Turma; chamada: Chamada }) {
  const presencas = chamada.presencas ?? [];
  const grupos = [...new Set(presencas.map((p) => p.grupoIndice))].sort((a, b) => a - b);
  const faltas = presencas.filter((p) => p.status === "faltou").length;

  return (
    <div className="rounded-xl border border-border/60 bg-background/40">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5">
        <p className="text-sm font-semibold text-foreground">Chamada completa de hoje</p>
        <Badge variant={faltas > 0 ? "destructive" : "secondary"}>
          {faltas} {faltas === 1 ? "ausência" : "ausências"}
        </Badge>
      </div>
      <div className="grid gap-px bg-border/50 sm:grid-cols-2">
        {grupos.map((indice) => (
          <div key={indice} className="bg-card">
            <p className="px-3 pt-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Grupo {indice + 1}
            </p>
            <ul className="flex flex-col">
              {presencas
                .filter((p) => p.grupoIndice === indice)
                .map((p) => {
                  const ausente = p.status === "faltou";
                  const aluno: Aluno = turma.alunos.find((a) => a.id === p.alunoId) ?? {
                    id: p.alunoId,
                    nome: p.alunoNome,
                  };
                  return (
                    <li key={p.id} className="flex items-center gap-2.5 px-3 py-1.5">
                      <span
                        className={cn(
                          "min-w-0 flex-1 text-sm",
                          ausente ? "text-muted-foreground line-through" : "font-medium",
                        )}
                      >
                        {p.alunoNome}
                        {p.status === "substituido" ? (
                          <span className="ml-1.5 text-xs font-normal text-primary">
                            substituto(a)
                          </span>
                        ) : null}
                      </span>
                      {ausente ? (
                        <Badge variant="outline" className="shrink-0 text-destructive">
                          {ROTULO_MOTIVO[(p.motivo as MotivoFalta) ?? "ausente"] ?? "Ausente"}
                        </Badge>
                      ) : (
                        <AcoesAluno
                          aluno={aluno}
                          grupoIndice={indice}
                          turma={turma}
                          chamada={chamada}
                        />
                      )}
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LiveSessionPanel({ editable = false }: { editable?: boolean }) {
  const { turmas, config, setSessaoSuspensa, isReady } = useAppStore();
  const confirmar = useConfirmar();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const now = useNow(true);
  // Antes dos early returns abaixo: hook não pode ficar atrás de um return.
  const [somAtivo, setSomAtivo] = useState(false);

  const diaAtual = now ? currentWeekdayLabel(now) : "";
  const conteudoDoDia = config.conteudoPorDia?.[diaAtual] ?? "";
  const dateKey = now ? toDateKey(now) : "";
  const assignments = now
    ? aplicarExcecoesDeData(
        buildWeeklySchedule(turmas, config, getWeekIndex(now)),
        config,
        turmas,
        dateKey,
      )
    : [];
  const reprogramadasHoje = now ? reprogramacoesParaData(turmas, config, now) : [];
  const sessao = now ? findSessaoAtual(assignments, config, now, reprogramadasHoje) : null;

  const chamada = useChamadaDoDia(
    sessao?.assignment.turma,
    config,
    dateKey,
    isReady && Boolean(sessao) && !sessao?.suspensa,
    isAuthenticated,
  );

  if (!now) {
    return (
      <Card className="border-dashed" role="status" aria-label="Carregando relógio da aula">
        <CardContent className="flex flex-col items-center gap-2 py-6">
          <div className="size-8 animate-pulse rounded-full bg-muted-foreground/15" />
          <div className="h-4 w-40 animate-pulse rounded bg-muted-foreground/15" />
        </CardContent>
      </Card>
    );
  }

  // Próxima aula do dia (depois da atual, ou a partir de agora se não há aula).
  const nowHHMM = now.toTimeString().slice(0, 5);
  const proximaAula = nextAssignmentsForDay([...reprogramadasHoje, ...assignments], diaAtual).find(
    (a) =>
      a.slot.inicio >= (sessao ? sessao.assignment.slot.fim : nowHHMM) &&
      !config.suspensoes?.[suspensaoKey(dateKey, a.dia, a.slot.inicio)],
  );
  const nomeProxima = proximaAula
    ? proximaAula.misto
      ? "Horário misto"
      : `${proximaAula.turma.serie} "${proximaAula.turma.letra}"`
    : null;

  // Avisos públicos do dia: aulas de hoje que não aconteceram, com o motivo
  // e a nova data — o que a escola precisa saber sem entrar no painel.
  const avisosDoDia = (config.reprogramacoes ?? []).filter((r) => r.dataOriginal === dateKey);
  const nomeDaTurma = (id: string) => {
    const t = turmas.find((x) => x.id === id);
    return t ? `${t.serie} "${t.letra}"` : "Turma";
  };
  const dataCurta = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
    });

  if (!sessao) {
    return (
      <section
        aria-label="Situação do laboratório agora"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-900/30 ring-1 ring-white/15"
      >
        {/* Brilhos decorativos */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-10 -top-16 size-48 rounded-full bg-cyan-400/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 right-10 size-56 rounded-full bg-fuchsia-500/30 blur-3xl"
        />

        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
            <Clock3 className="size-7" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
              Laboratório de informática
            </p>
            <p className="text-xl font-bold tracking-tight sm:text-2xl">
              Nenhuma aula de informática agora
            </p>
            <p className="mt-0.5 text-sm text-white/80 first-letter:uppercase">
              {now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
              {" · "}
              {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
            {conteudoDoDia ? (
              <p className="mt-1 text-sm text-white/85">Conteúdo de hoje: {conteudoDoDia}</p>
            ) : null}
          </div>
          <div className="shrink-0 rounded-xl bg-white/15 px-4 py-3 ring-1 ring-white/25 backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
              Próxima aula
            </p>
            {proximaAula && nomeProxima ? (
              <p className="text-lg font-bold">
                {nomeProxima}{" "}
                <span className="font-mono text-base font-semibold text-cyan-200">
                  {proximaAula.slot.inicio}
                </span>
              </p>
            ) : (
              <p className="text-sm font-medium text-white/85">Sem mais aulas hoje</p>
            )}
          </div>
        </div>

        {avisosDoDia.length > 0 ? (
          <ul className="relative flex flex-col gap-2 border-t border-white/15 bg-black/15 px-5 py-3 sm:px-6">
            {avisosDoDia.map((r) => (
              <li key={r.id} className="flex items-start gap-2.5 text-sm">
                <CalendarX2 className="mt-0.5 size-4 shrink-0 text-amber-300" />
                <span className="text-white/90">
                  <strong className="font-semibold text-white">{nomeDaTurma(r.turmaId)}</strong> não
                  teve a aula das {r.inicioOriginal}
                  {r.motivo ? <> — {semPontoFinal(r.motivo)}</> : null}. Reposição:{" "}
                  <strong className="font-semibold text-cyan-200">
                    {dataCurta(r.dataNova)}, {r.inicio}–{r.fim}
                  </strong>
                  .
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    );
  }

  const { assignment, segundosRestantes, suspensa } = sessao;

  if (suspensa) {
    return (
      <Card className="border-dashed border-amber-500/40 bg-amber-500/5">
        <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
          <CalendarX2 className="size-8 text-amber-500" />
          <p className="font-semibold text-foreground">
            Aula de {assignment.turma.serie} &ldquo;{assignment.turma.letra}&rdquo; suspensa hoje
          </p>
          <p className="text-sm text-muted-foreground">
            {assignment.slot.inicio} – {assignment.slot.fim}
            {nomeProxima && proximaAula
              ? ` · Próxima: ${nomeProxima} às ${proximaAula.slot.inicio}`
              : ""}
          </p>
          {avisosDoDia
            .filter(
              (r) =>
                r.turmaId === assignment.turma.id && r.inicioOriginal === assignment.slot.inicio,
            )
            .map((r) => (
              <p key={r.id} className="max-w-lg text-sm text-foreground">
                {r.motivo ? <>Motivo: {semPontoFinal(r.motivo)}. </> : null}
                Reposição em{" "}
                <strong className="text-primary">
                  {dataCurta(r.dataNova)}, {r.inicio}–{r.fim}
                </strong>
                .
              </p>
            ))}
          {editable ? (
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={async () => {
                const ok = await confirmar({
                  titulo: "Retomar esta aula?",
                  descricao: `A aula de ${assignment.turma.serie} "${assignment.turma.letra}" volta a valer para hoje.`,
                });
                if (!ok) return;
                setSessaoSuspensa(dateKey, assignment.dia, assignment.slot.inicio, false);
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

  // Horário misto: cada sub-bloco já é de uma turma diferente e definitiva
  // (calculado em buildSubBlocos), sem rodízio por presença — a lista de
  // chamada do dia só cobre a primeira turma do grupo, então não se aplica.
  const gruposChamada =
    !assignment.misto && chamada.presencas && chamada.presencas.length > 0
      ? gruposFromPresencas(assignment.turma, chamada.presencas)
      : null;
  const subBlocosEfetivos: SubBloco[] | null = gruposChamada
    ? buildSubBlocosComGrupos(assignment, config, gruposChamada)
    : null;
  const subBloco = subBlocosEfetivos?.[sessao.subBloco.indice] ?? sessao.subBloco;
  const proximoSubBloco = subBlocosEfetivos?.[sessao.subBloco.indice + 1] ?? sessao.proximoSubBloco;
  const turmaAtual = subBloco.turma ?? assignment.turma;
  const turmaProxima = proximoSubBloco?.turma ?? assignment.turma;
  const podeGerenciar = isAuthenticated && Boolean(gruposChamada);

  const totalSegundos = Math.max(1, hhmmToSeconds(subBloco.fim) - hhmmToSeconds(subBloco.inicio));
  const decorridos = totalSegundos - segundosRestantes;

  // A turma inteira, não só o grupo da vez: é o que diz se o fim que se
  // aproxima é do revezamento ou da aula.
  const totalTurma = Math.max(
    1,
    hhmmToSeconds(assignment.slot.fim) - hhmmToSeconds(assignment.slot.inicio),
  );
  const decorridosTurma = Math.min(
    totalTurma,
    hhmmToSeconds(subBloco.inicio) - hhmmToSeconds(assignment.slot.inicio) + decorridos,
  );
  const totalGrupos = Math.max(1, Math.round(totalTurma / totalSegundos));
  const conteudo =
    subBloco.grupo.conteudo ||
    assignment.conteudo ||
    conteudoDoDia ||
    "Nenhum conteúdo cadastrado.";

  return (
    <Card className="overflow-hidden border-emerald-500/40 bg-card/90 shadow-xl shadow-emerald-950/20 ring-1 ring-emerald-500/20">
      {/* Cabeçalho verde "ao vivo": o público identifica de longe que há aula
          agora e qual turma está no laboratório. */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-4 py-3 text-white sm:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-white" />
            </span>
            Ao vivo
          </span>
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <MonitorPlay className="size-5" /> {turmaAtual.serie} &ldquo;{turmaAtual.letra}&rdquo;
            está no laboratório
          </h2>
          {assignment.misto ? (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">horário misto</span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <AlertaTroca
            chave={`${dateKey}|${subBloco.inicio}`}
            proximoGrupo={subBloco.grupo.indice + 1}
            ativo={somAtivo}
            setAtivo={setSomAtivo}
          />
          <Button size="sm" variant="outline" onClick={() => navigate({ to: "/tv" })}>
            <Tv className="size-3.5" /> <span className="hidden sm:inline">Modo TV</span>
          </Button>
          {isAuthenticated && !assignment.misto ? (
            <ObservacaoAulaDialog assignment={assignment} data={now}>
              <Button size="sm" variant="outline">
                <MessageSquareText className="size-3.5" />{" "}
                <span className="hidden sm:inline">Observação</span>
              </Button>
            </ObservacaoAulaDialog>
          ) : null}
          {isAuthenticated && !assignment.misto ? (
            <SuspenderAulaDialog assignment={assignment} data={now}>
              <Button size="sm" variant="outline" className="text-amber-600 dark:text-amber-400">
                <Square className="size-3.5" /> Suspender
              </Button>
            </SuspenderAulaDialog>
          ) : null}
        </div>
      </div>

      <CardContent className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <TimerAula
          className="w-full"
          decorridosGrupo={decorridos}
          totalGrupo={totalSegundos}
          decorridosTurma={decorridosTurma}
          totalTurma={totalTurma}
          grupoAtual={subBloco.grupo.indice + 1}
          totalGrupos={totalGrupos}
          serie={turmaAtual.serie}
          letra={turmaAtual.letra}
          conteudo={subBloco.grupo.conteudo || conteudoDoDia}
          inicioTurma={assignment.slot.inicio}
          fimTurma={assignment.slot.fim}
          comSom={somAtivo}
        />

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {turmaAtual.serie} &ldquo;{turmaAtual.letra}&rdquo;
              </p>
              <p className="text-sm text-muted-foreground">
                Regente: {turmaAtual.professorRegente} · Informática: {config.professorInformatica}
              </p>
            </div>
            <Badge variant="secondary" className="font-mono">
              {assignment.slot.inicio}–{assignment.slot.fim}
            </Badge>
          </div>

          <div className="flex gap-3 rounded-xl border border-border/60 bg-background/40 px-4 py-3">
            <BookOpen className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Conteúdo de hoje
              </p>
              <p className="text-sm text-foreground">{conteudo}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {/* Grupo da vez */}
            <section className="overflow-hidden rounded-xl border border-primary/30 bg-primary/5">
              <header className="flex items-center justify-between gap-2 border-b border-primary/20 px-3 py-2">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Users className="size-4 text-primary" /> Agora · Grupo{" "}
                  {subBloco.grupo.indice + 1}
                </p>
                <span className="font-mono text-xs text-muted-foreground">
                  {subBloco.inicio}–{subBloco.fim}
                </span>
              </header>
              <ListaAlunos
                alunos={subBloco.grupo.alunos}
                grupoIndice={subBloco.grupo.indice}
                turma={turmaAtual}
                chamada={gruposChamada ? chamada : null}
                podeGerenciar={podeGerenciar}
                destacarNecessidades={editable || isAuthenticated}
              />
            </section>

            {/* Próximo grupo — ou a próxima turma, se este é o último grupo */}
            <section className="overflow-hidden rounded-xl border border-border/60 bg-background/40">
              <header className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <ArrowRight className="size-4 text-muted-foreground" />
                  {proximoSubBloco
                    ? `A seguir · Grupo ${proximoSubBloco.grupo.indice + 1}`
                    : "A seguir"}
                </p>
                {proximoSubBloco ? (
                  <span className="font-mono text-xs text-muted-foreground">
                    {proximoSubBloco.inicio}–{proximoSubBloco.fim}
                  </span>
                ) : null}
              </header>
              {proximoSubBloco ? (
                <>
                  {proximoSubBloco.turma ? (
                    <p className="px-3 pt-2 text-xs text-muted-foreground">
                      {turmaProxima.serie} &ldquo;{turmaProxima.letra}&rdquo;
                    </p>
                  ) : null}
                  <ListaAlunos
                    alunos={proximoSubBloco.grupo.alunos}
                    grupoIndice={proximoSubBloco.grupo.indice}
                    turma={turmaProxima}
                    chamada={gruposChamada && !proximoSubBloco.turma ? chamada : null}
                    podeGerenciar={podeGerenciar && !proximoSubBloco.turma}
                    destacarNecessidades={editable || isAuthenticated}
                    compacta
                  />
                </>
              ) : proximaAula && nomeProxima ? (
                <div className="px-3 py-4">
                  <p className="text-sm text-muted-foreground">Fim desta turma. Próxima aula:</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{nomeProxima}</p>
                  <p className="font-mono text-sm text-muted-foreground">
                    {proximaAula.slot.inicio}–{proximaAula.slot.fim}
                  </p>
                </div>
              ) : (
                <p className="px-3 py-4 text-sm text-muted-foreground">
                  Última aula de informática do dia.
                </p>
              )}
            </section>
          </div>

          {!isAuthenticated && gruposChamada ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3" /> Professor(a):{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                entre
              </Link>{" "}
              para registrar ausências e substituir alunos.
            </p>
          ) : null}

          {editable && !assignment.misto && chamada.presencas && chamada.presencas.length > 0 ? (
            <ChamadaDoDiaCard turma={assignment.turma} chamada={chamada} />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
