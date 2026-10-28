import { AlertTriangle, CheckCircle2, Clock3, IdCard, Play, Shuffle, Users2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { FichaAluno, rotuloTurma } from "@/components/school/laboratorio/ficha-aluno";
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
const MISTA = "mista";

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
  const [busca, setBusca] = useState("");
  const [ficha, setFicha] = useState<{ turmaId: string; alunoId: string } | null>(null);

  const hoje = hojeNaEscola();
  const mista = turmaId === MISTA;
  const turma = turmas.find((t) => t.id === turmaId) ?? null;
  /** Quem pode ser escolhido: a turma toda ou, na aula mista, alunos de todas as turmas. */
  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (mista ? turmas : turma ? [turma] : [])
      .flatMap((t) => t.alunos.map((a) => ({ a, t })))
      .filter(({ a }) => !mista || !termo || a.nome.toLowerCase().includes(termo))
      .sort((x, y) => (mista ? x.a.nome.localeCompare(y.a.nome, "pt-BR") : 0));
  }, [mista, turma, turmas, busca]);
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
    setBusca("");
    // Na aula mista a escolha atravessa turmas, então só zera ao sair dela ou entrar nela.
    if (id !== MISTA || turmaId !== MISTA) setEscolhidos(new Set());
  }

  function levantarAvisos(): Aviso[] {
    return lista
      .filter(({ a }) => escolhidos.has(a.id))
      .map(({ a }) => {
        const uso = usoDoAluno(dados.sessoes, a.id, hoje);
        // A ida de hoje é a mesma visita, não uma repetição.
        const semana = uso.semana - (uso.hoje ? 1 : 0);
        const mes = uso.mes - (uso.hoje ? 1 : 0);
        return { nome: a.nome, semana, mes, hoje: uso.hoje };
      })
      .filter((x) => x.semana >= LIMITE_IDAS_SEMANA || x.mes >= LIMITE_IDAS_MES || x.hoje);
  }

  async function gravar() {
    if (!turmaId || typeof janela === "string") return;
    setSalvando(true);
    try {
      await marcarGrupo({
        alunos: lista
          .filter(({ a }) => escolhidos.has(a.id))
          .map(({ a, t }) => ({
            id: a.id,
            nome: a.nome,
            turma: { id: t.id, rotulo: rotuloTurma(t.serie, t.letra) },
          })),
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
        <h3 className="text-sm font-semibold text-muted-foreground">1. De qual turma?</h3>
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
                  ativa
                    ? "scale-105 shadow-md ring-2 ring-foreground"
                    : "opacity-60 hover:opacity-100",
                )}
              >
                {t.serie.replace(/\D+/g, "")}º {t.letra}
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={mista}
            onClick={() => trocarTurma(MISTA)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border-2 border-dashed border-primary px-3 py-2 text-sm font-bold ring-offset-2 transition",
              mista
                ? "bg-primary text-primary-foreground ring-2 ring-foreground"
                : "hover:bg-primary/5",
            )}
          >
            <Shuffle className="size-4" aria-hidden /> Aula mista
          </button>
        </div>
        {mista ? (
          <p className="text-xs text-muted-foreground">
            Monte um grupo com alunos de qualquer turma. Busque pelo nome; a escolha fica guardada
            enquanto você procura.
          </p>
        ) : null}
      </section>

      {turmaId ? (
        <section aria-label="Escolher os alunos" className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              2. Quem vai? Toque nos nomes ({escolhidos.size} de {lista.length})
            </h3>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={mista}
                onClick={() =>
                  setEscolhidos(
                    new Set(
                      lista
                        .filter(({ a }) => !a.impedido && !noLabAgora.has(a.id))
                        .map(({ a }) => a.id),
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
          {mista ? (
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar aluno pelo nome…"
              aria-label="Buscar aluno"
              className="max-w-sm"
            />
          ) : null}
          {lista.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Esta turma ainda não tem alunos cadastrados.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {lista.map(({ a, t }) => {
                const uso = usoDoAluno(dados.sessoes, a.id, hoje);
                const semana = uso.semana - (uso.hoje ? 1 : 0);
                const mes = uso.mes - (uso.hoje ? 1 : 0);
                const marcado = escolhidos.has(a.id);
                const ocupado = noLabAgora.has(a.id);
                const bloqueado = Boolean(a.impedido) || ocupado;
                return (
                  <li key={a.id} className="relative">
                    <button
                      type="button"
                      aria-pressed={marcado}
                      disabled={bloqueado}
                      onClick={() => alternar(a.id)}
                      className={cn(
                        "flex w-full flex-col gap-1.5 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50",
                        marcado
                          ? "border-primary bg-primary/25 font-semibold ring-2 ring-primary"
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
                        {mista ? (
                          <Badge variant="secondary">{rotuloTurma(t.serie, t.letra)}</Badge>
                        ) : null}
                        {a.impedido ? <Badge variant="outline">suspenso(a)</Badge> : null}
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
                    <button
                      type="button"
                      aria-label={`Abrir a ficha de ${a.nome}`}
                      title="Abrir a ficha do aluno"
                      onClick={() => setFicha({ turmaId: t.id, alunoId: a.id })}
                      className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md border bg-background/80 px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-primary"
                    >
                      <IdCard className="size-3.5" aria-hidden /> ficha
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {turmaId && escolhidos.size > 0 ? (
        <section aria-label="Definir o tempo" className="space-y-3 rounded-xl border p-4">
          <h3 className="text-sm font-semibold text-muted-foreground">3. Por quanto tempo?</h3>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={modo === "duracao" ? "default" : "outline"}
              onClick={() => setModo("duracao")}
            >
              Por minutos
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
              Escolher o horário
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
                    Entrar só quando o grupo de agora sair ({horaNaEscola(fimDoGrupoAtual)})
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
            <Play /> Mandar {escolhidos.size} aluno{escolhidos.size === 1 ? "" : "s"} para o
            laboratório
          </Button>
        </section>
      ) : turmaId ? null : (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users2 className="size-4" aria-hidden /> Escolha uma turma e os alunos aparecem aqui.
        </p>
      )}

      {ficha ? <FichaAluno {...ficha} aberto aoFechar={() => setFicha(null)} /> : null}

      <AlertDialog
        open={avisos !== null}
        onOpenChange={(aberto) => (aberto ? null : setAvisos(null))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" aria-hidden /> Opa, esse pessoal já
              foi
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>Dê uma olhadinha antes de marcar de novo:</p>
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
            <AlertDialogCancel>Voltar e trocar alguém</AlertDialogCancel>
            <AlertDialogAction onClick={() => void gravar()}>Marcar mesmo assim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
