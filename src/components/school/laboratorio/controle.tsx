import { AlertTriangle, CheckCircle2, Clock3, Play, Users2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { DadosLab } from "@/components/school/laboratorio/painel-agora";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/lib/app-store";
import { useAuth } from "@/lib/auth-store";
import {
  TABELA_AUSENTE,
  estadoDaSessao,
  horaAgoraNaEscola,
  horaNaEscola,
  hojeNaEscola,
  instanteNaEscola,
  marcarGrupo,
  nomeExibido,
  somarMinutos,
  usoDoAluno,
} from "@/lib/laboratorio";
import { LIMITE_IDAS_MES, LIMITE_IDAS_SEMANA } from "@/lib/recursos";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";
import { cn } from "@/lib/utils";

const DURACOES = [15, 20, 25, 30, 40, 50];

interface Aviso {
  nome: string;
  semana: number;
  mes: number;
  hoje: boolean;
}

/**
 * Onde o professor marca os alunos: escolhe a turma, toca nos nomes, define
 * por quanto tempo (ou o horário de início e fim) e confirma. Se algum aluno
 * já foi ao laboratório na semana ou no mês, o sistema avisa antes de marcar.
 */
export function ControleLaboratorio({
  dados,
  aoMarcar,
}: {
  dados: DadosLab;
  aoMarcar?: () => void;
}) {
  const { turmas } = useAppStore();
  const { email } = useAuth();
  const [turmaId, setTurmaId] = useState<string | null>(null);
  const [escolhidos, setEscolhidos] = useState<Set<string>>(new Set());
  const [modo, setModo] = useState<"duracao" | "horario">("duracao");
  const [minutos, setMinutos] = useState(30);
  const [inicioManual, setInicioManual] = useState(horaAgoraNaEscola());
  const [fimManual, setFimManual] = useState("");
  const [aposAtual, setAposAtual] = useState(false);
  const [avisos, setAvisos] = useState<Aviso[] | null>(null);
  const [salvando, setSalvando] = useState(false);

  const hoje = hojeNaEscola();
  const turma = turmas.find((t) => t.id === turmaId) ?? null;
  const agora = Date.now();

  const noLabAgora = useMemo(
    () =>
      new Set(
        dados.sessoes
          .filter((s) => s.data === hoje && estadoDaSessao(s, agora) !== "encerrada")
          .map((s) => s.alunoId),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dados.sessoes, hoje],
  );

  /** Fim mais tardio entre quem está (ou vai estar) no laboratório hoje: é quando o próximo grupo pode entrar. */
  const fimDoGrupoAtual = useMemo(() => {
    const fins = dados.sessoes
      .filter((s) => s.data === hoje && estadoDaSessao(s, agora) !== "encerrada")
      .map((s) => new Date(s.fim).getTime());
    return fins.length ? new Date(Math.max(...fins)) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados.sessoes, hoje]);

  /** Início e fim que serão gravados, conforme o modo escolhido. */
  function calcularJanela(): { inicio: Date; fim: Date } | string {
    if (modo === "horario") {
      if (!inicioManual || !fimManual) return "Preencha a hora de início e a de fim.";
      const inicio = instanteNaEscola(hoje, inicioManual);
      const fim = instanteNaEscola(hoje, fimManual);
      if (fim <= inicio) return "A hora de fim precisa ser depois da hora de início.";
      return { inicio, fim };
    }
    if (!Number.isFinite(minutos) || minutos < 1 || minutos > 240)
      return "Informe de 1 a 240 minutos.";
    const base =
      aposAtual && fimDoGrupoAtual && fimDoGrupoAtual.getTime() > Date.now()
        ? fimDoGrupoAtual
        : new Date();
    return { inicio: base, fim: somarMinutos(base, minutos) };
  }

  const janela = calcularJanela();

  function alternar(id: string) {
    setEscolhidos((anterior) => {
      const novo = new Set(anterior);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function trocarTurma(id: string) {
    setTurmaId(id);
    setEscolhidos(new Set());
  }

  function levantarAvisos(): Aviso[] {
    if (!turma) return [];
    return turma.alunos
      .filter((a) => escolhidos.has(a.id))
      .map((a) => {
        const uso = usoDoAluno(dados.sessoes, a.id, hoje);
        // A ida de hoje é a mesma visita, não uma repetição.
        const semana = uso.semana - (uso.hoje ? 1 : 0);
        const mes = uso.mes - (uso.hoje ? 1 : 0);
        return { nome: a.nome, semana, mes, hoje: uso.hoje };
      })
      .filter((x) => x.semana >= LIMITE_IDAS_SEMANA || x.mes >= LIMITE_IDAS_MES || x.hoje);
  }

  async function gravar() {
    if (!turma || typeof janela === "string") return;
    setSalvando(true);
    try {
      await marcarGrupo({
        turma: { id: turma.id, rotulo: `${turma.serie.replace(/\D+/g, "")}º ${turma.letra}` },
        alunos: turma.alunos
          .filter((a) => escolhidos.has(a.id))
          .map((a) => ({ id: a.id, nome: a.nome })),
        inicio: janela.inicio,
        fim: janela.fim,
        criadoPor: email,
      });
      toast.success(
        `${escolhidos.size} aluno${escolhidos.size === 1 ? "" : "s"} no laboratório das ${horaNaEscola(janela.inicio)} às ${horaNaEscola(janela.fim)}.`,
      );
      setEscolhidos(new Set());
      setAvisos(null);
      await dados.recarregar();
      aoMarcar?.();
    } catch (e) {
      toast.error(
        e instanceof Error && e.message === TABELA_AUSENTE
          ? "O banco ainda não tem a tabela do laboratório. Rode o arquivo supabase/laboratorio.sql no Supabase."
          : e instanceof Error
            ? e.message
            : "Não foi possível marcar.",
      );
    } finally {
      setSalvando(false);
    }
  }

  function confirmar() {
    if (typeof janela === "string") {
      toast.error(janela);
      return;
    }
    const lista = levantarAvisos();
    if (lista.length > 0) setAvisos(lista);
    else void gravar();
  }

  return (
    <div className="space-y-5">
      <section aria-label="Escolher a turma" className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">1. Escolha a turma</h3>
        <div className="flex flex-wrap gap-2">
          {turmas.map((t) => {
            const cor = serieClasses(serieIndexPorNumero(t.serie));
            const ativa = t.id === turmaId;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={ativa}
                onClick={() => trocarTurma(t.id)}
                className={cn(
                  "min-w-16 rounded-lg px-3 py-2 text-sm font-bold ring-offset-2 transition",
                  cor.bg,
                  cor.text,
                  ativa ? "ring-2 ring-foreground" : "opacity-80 hover:opacity-100",
                )}
              >
                {t.serie.replace(/\D+/g, "")}º {t.letra}
              </button>
            );
          })}
        </div>
      </section>

      {turma ? (
        <section aria-label="Escolher os alunos" className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              2. Toque nos alunos que vão ({escolhidos.size} de {turma.alunos.length})
            </h3>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  setEscolhidos(
                    new Set(
                      turma.alunos
                        .filter((a) => !a.impedido && !noLabAgora.has(a.id))
                        .map((a) => a.id),
                    ),
                  )
                }
              >
                Todos
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setEscolhidos(new Set())}
              >
                Limpar
              </Button>
            </div>
          </div>
          {turma.alunos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Esta turma ainda não tem alunos cadastrados.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {turma.alunos.map((a) => {
                const uso = usoDoAluno(dados.sessoes, a.id, hoje);
                const semana = uso.semana - (uso.hoje ? 1 : 0);
                const mes = uso.mes - (uso.hoje ? 1 : 0);
                const marcado = escolhidos.has(a.id);
                const ocupado = noLabAgora.has(a.id);
                const bloqueado = Boolean(a.impedido) || ocupado;
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      aria-pressed={marcado}
                      disabled={bloqueado}
                      onClick={() => alternar(a.id)}
                      className={cn(
                        "flex w-full flex-col gap-1.5 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50",
                        marcado
                          ? "border-primary bg-primary/10 ring-1 ring-primary"
                          : "bg-card hover:bg-muted/50",
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {marcado ? (
                          <CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden />
                        ) : null}
                        <span className="truncate">{nomeExibido(a.nome, true)}</span>
                      </span>
                      <span className="flex flex-wrap gap-1 text-[11px]">
                        {a.impedido ? <Badge variant="outline">impedido(a)</Badge> : null}
                        {ocupado ? (
                          <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                            no laboratório
                          </Badge>
                        ) : null}
                        {!ocupado && uso.hoje ? (
                          <Badge variant="secondary">já marcado hoje</Badge>
                        ) : null}
                        <Badge
                          variant="outline"
                          className={
                            semana >= LIMITE_IDAS_SEMANA
                              ? "border-amber-500 text-amber-700 dark:text-amber-300"
                              : ""
                          }
                        >
                          semana: {semana}×
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            mes >= LIMITE_IDAS_MES
                              ? "border-amber-500 text-amber-700 dark:text-amber-300"
                              : ""
                          }
                        >
                          mês: {mes}×
                        </Badge>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {turma && escolhidos.size > 0 ? (
        <section aria-label="Definir o tempo" className="space-y-3 rounded-xl border p-4">
          <h3 className="text-sm font-semibold text-muted-foreground">3. Defina o tempo</h3>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={modo === "duracao" ? "default" : "outline"}
              onClick={() => setModo("duracao")}
            >
              Por duração
            </Button>
            <Button
              type="button"
              size="sm"
              variant={modo === "horario" ? "default" : "outline"}
              onClick={() => {
                setModo("horario");
                setInicioManual(horaAgoraNaEscola());
                setFimManual(horaNaEscola(somarMinutos(new Date(), minutos)));
              }}
            >
              Hora de início e fim
            </Button>
          </div>

          {modo === "duracao" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {DURACOES.map((d) => (
                  <Button
                    key={d}
                    type="button"
                    size="sm"
                    variant={minutos === d ? "default" : "outline"}
                    onClick={() => setMinutos(d)}
                  >
                    {d} min
                  </Button>
                ))}
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="lab-min" className="text-xs text-muted-foreground">
                    outro:
                  </Label>
                  <Input
                    id="lab-min"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={240}
                    value={minutos}
                    onChange={(e) => setMinutos(Number(e.target.value))}
                    className="h-8 w-20"
                  />
                  <span className="text-xs text-muted-foreground">min</span>
                </div>
              </div>
              {fimDoGrupoAtual && fimDoGrupoAtual.getTime() > Date.now() ? (
                <div className="flex items-center gap-2">
                  <Switch id="lab-apos" checked={aposAtual} onCheckedChange={setAposAtual} />
                  <Label htmlFor="lab-apos" className="text-sm">
                    Começar quando o grupo atual terminar ({horaNaEscola(fimDoGrupoAtual)})
                  </Label>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label htmlFor="lab-ini" className="text-xs text-muted-foreground">
                  Início
                </Label>
                <Input
                  id="lab-ini"
                  type="time"
                  value={inicioManual}
                  onChange={(e) => setInicioManual(e.target.value)}
                  className="w-32"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lab-fim" className="text-xs text-muted-foreground">
                  Fim
                </Label>
                <Input
                  id="lab-fim"
                  type="time"
                  value={fimManual}
                  onChange={(e) => setFimManual(e.target.value)}
                  className="w-32"
                />
              </div>
            </div>
          )}

          <p className="flex items-center gap-2 text-sm">
            <Clock3 className="size-4 text-primary" aria-hidden />
            {typeof janela === "string" ? (
              <span className="text-muted-foreground">{janela}</span>
            ) : (
              <span>
                Começa às <strong>{horaNaEscola(janela.inicio)}</strong> e termina às{" "}
                <strong>{horaNaEscola(janela.fim)}</strong>
              </span>
            )}
          </p>

          <Button
            type="button"
            size="lg"
            disabled={salvando || typeof janela === "string"}
            onClick={confirmar}
          >
            <Play /> Colocar {escolhidos.size} aluno{escolhidos.size === 1 ? "" : "s"} no
            laboratório
          </Button>
        </section>
      ) : turma ? null : (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users2 className="size-4" aria-hidden /> Escolha uma turma para ver os alunos.
        </p>
      )}

      <AlertDialog
        open={avisos !== null}
        onOpenChange={(aberto) => (aberto ? null : setAvisos(null))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" aria-hidden /> Atenção: alunos que já
              foram
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>Estes alunos já foram ao laboratório. Confira antes de marcar de novo:</p>
                <ul className="space-y-1">
                  {avisos?.map((x) => (
                    <li key={x.nome} className="rounded-md border p-2">
                      <strong className="text-foreground">{x.nome}</strong>
                      <br />
                      {x.hoje ? "já está marcado hoje · " : ""}
                      {x.semana >= LIMITE_IDAS_SEMANA ? `${x.semana}× nesta semana · ` : ""}
                      {x.mes >= LIMITE_IDAS_MES ? `${x.mes}× neste mês` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar e trocar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void gravar()}>Marcar mesmo assim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
