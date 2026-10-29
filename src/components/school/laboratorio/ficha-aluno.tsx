import {
  ArrowLeft,
  Ban,
  Cake,
  CalendarDays,
  Clock3,
  MessageSquarePlus,
  Search,
  Trash2,
  UserMinus,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ImageUploadField } from "@/components/school/image-upload-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/app-store";
import { useAuth } from "@/lib/auth-store";
import {
  ROTULO_AUSENCIA,
  carregarHistoricoAluno,
  carregarOcorrenciasAluno,
  carregarPresencasAluno,
  type PresencaAntiga,
  hojeNaEscola,
  horaNaEscola,
  TABELA_AUSENTE,
  type SessaoLab,
} from "@/lib/laboratorio";
import {
  SeloAniversario,
  AniversariantesHoje,
} from "@/components/school/laboratorio/aniversariantes";
import { defasagemIdadeSerie, infoAniversario, textoIdade } from "@/lib/aniversario";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";
import { imagemDaSerie } from "@/lib/serie-imagens";
import type { AnotacaoAluno, SituacaoMatricula } from "@/lib/types";

export const rotuloTurma = (serie: string, letra: string) =>
  `${serie.replace(/\D+/g, "")}º ${letra}`;

const dataBR = (chave: string) => chave.split("-").reverse().join("/");
const minutosDe = (s: SessaoLab) =>
  Math.max(
    0,
    Math.round(
      (new Date(s.fim).getTime() - new Date(s.inicio).getTime()) / 60_000 - s.pausaSegundos / 60,
    ),
  );
const textoMinutos = (m: number) =>
  m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} min`;
const nomeDoMes = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(y!, m! - 1, 1));
};

/**
 * Ficha do aluno: dados pessoais (foto, nascimento, INEP, endereço), anotações
 * do professor de informática, suspensão das aulas e o histórico de idas ao
 * laboratório por ano e mês. Só aparece para quem está logado.
 */
export function FichaAluno({
  turmaId,
  alunoId,
  aberto,
  aoFechar,
}: {
  turmaId: string;
  alunoId: string;
  aberto: boolean;
  aoFechar: () => void;
}) {
  const { todasTurmas: turmas, updateAluno, config } = useAppStore();
  const { email } = useAuth();
  const turma = turmas.find((t) => t.id === turmaId);
  const aluno = turma?.alunos.find((a) => a.id === alunoId);

  const [rascunho, setRascunho] = useState({
    foto: undefined as string | undefined,
    nascimento: "",
    inep: "",
    endereco: "",
    especialidade: "",
    observacoesNecessidade: "",
    necessidadeEspecial: false,
  });
  const [presencas, setPresencas] = useState<PresencaAntiga[] | null>(null);
  const [nota, setNota] = useState("");
  const [saida, setSaida] = useState({ em: "", obs: "" });
  const [motivo, setMotivo] = useState("");
  const [historico, setHistorico] = useState<SessaoLab[] | null>(null);
  const [erroHistorico, setErroHistorico] = useState<string | null>(null);
  const [ocorrencias, setOcorrencias] = useState<SessaoLab[] | null>(null);

  useEffect(() => {
    if (!aberto || !aluno) return;
    setRascunho({
      foto: aluno.foto,
      nascimento: aluno.nascimento ?? "",
      inep: aluno.inep ?? "",
      endereco: aluno.endereco ?? "",
      especialidade: aluno.especialidade ?? "",
      observacoesNecessidade: aluno.observacoesNecessidade ?? "",
      necessidadeEspecial: aluno.necessidadeEspecial ?? false,
    });
    setMotivo(aluno.motivoImpedimento ?? "");
    setSaida({ em: aluno.situacaoEm ?? "", obs: aluno.situacaoObs ?? "" });
    setNota("");
    setHistorico(null);
    setErroHistorico(null);
    setPresencas(null);
    carregarPresencasAluno(alunoId)
      .then(setPresencas)
      .catch(() => setPresencas([]));
    carregarHistoricoAluno(alunoId)
      .then(setHistorico)
      .catch((e: Error) => setErroHistorico(e.message));
    setOcorrencias(null);
    carregarOcorrenciasAluno(turmaId, alunoId)
      .then(setOcorrencias)
      .catch(() => setOcorrencias([]));
    // Recarrega só ao abrir ou trocar de aluno, não a cada gravação.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, alunoId]);

  const porAnoMes = useMemo(() => {
    const anos = new Map<string, Map<string, SessaoLab[]>>();
    for (const s of historico ?? []) {
      const ano = s.data.slice(0, 4);
      const meses = anos.get(ano) ?? new Map<string, SessaoLab[]>();
      const ym = s.data.slice(0, 7);
      meses.set(ym, [...(meses.get(ym) ?? []), s]);
      anos.set(ano, meses);
    }
    return [...anos.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [historico]);

  if (!turma || !aluno) return null;
  const aniv = infoAniversario(aluno.nascimento, hojeNaEscola());
  const antigas = (presencas ?? []).filter(
    (p) => !config.dataInicioOperacao || p.data >= config.dataInicioOperacao,
  );
  const dias = new Set((historico ?? []).map((s) => s.data)).size;
  const totalMin = (historico ?? []).reduce((soma, s) => soma + minutosDe(s), 0);

  function salvarDados() {
    updateAluno(turmaId, alunoId, {
      foto: rascunho.foto,
      nascimento: rascunho.nascimento || undefined,
      inep: rascunho.inep.trim() || undefined,
      endereco: rascunho.endereco.trim() || undefined,
      especialidade: rascunho.especialidade.trim() || undefined,
      observacoesNecessidade: rascunho.observacoesNecessidade.trim() || undefined,
      necessidadeEspecial: rascunho.necessidadeEspecial,
    });
    toast.success("Dados do aluno salvos.");
  }

  function registrarSituacao(nova: SituacaoMatricula) {
    const saiu = nova !== "ativo";
    updateAluno(turmaId, alunoId, {
      situacao: saiu ? nova : undefined,
      situacaoEm: saiu ? saida.em || new Date().toISOString().slice(0, 10) : undefined,
      situacaoObs: saiu ? saida.obs.trim() || undefined : undefined,
    });
    toast.success(
      nova === "ativo"
        ? "Aluno voltou a contar na turma."
        : `Registrado como ${nova === "transferido" ? "transferido" : "desistente"}. Ele não conta mais na turma.`,
    );
  }

  function alternarSuspensao(valor: boolean) {
    updateAluno(turmaId, alunoId, {
      impedido: valor,
      motivoImpedimento: valor ? motivo.trim() || undefined : undefined,
    });
    toast.success(valor ? "Aluno suspenso das aulas de informática." : "Suspensão retirada.");
  }

  function guardarNota() {
    if (!nota.trim()) return;
    const nova: AnotacaoAluno = {
      id: crypto.randomUUID(),
      texto: nota.trim(),
      em: new Date().toISOString(),
      autor: email ?? undefined,
    };
    updateAluno(turmaId, alunoId, { anotacoes: [nova, ...(aluno?.anotacoes ?? [])] });
    setNota("");
  }

  function apagarNota(id: string) {
    updateAluno(turmaId, alunoId, {
      anotacoes: (aluno?.anotacoes ?? []).filter((n) => n.id !== id),
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={(v) => (v ? null : aoFechar())}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
              {aluno.foto ? (
                <img src={aluno.foto} alt="" className="size-full object-cover" />
              ) : (
                <UserRound className="size-6 text-muted-foreground" aria-hidden />
              )}
            </span>
            <span>
              {aluno.nome}
              <span className="block text-sm font-normal text-muted-foreground">
                {rotuloTurma(turma.serie, turma.letra)}
                {aniv ? ` · ${textoIdade(aniv)}` : ""}
                {aluno.nascimento ? ` · nasceu em ${dataBR(aluno.nascimento)}` : ""}
              </span>
            </span>
          </DialogTitle>
          <DialogDescription className="flex flex-wrap gap-1.5">
            {aluno.situacao === "transferido" || aluno.situacao === "desistente" ? (
              <Badge className="bg-slate-600 text-white hover:bg-slate-600">
                {aluno.situacao === "transferido" ? "transferido(a)" : "desistente"}
                {aluno.situacaoEm ? ` em ${dataBR(aluno.situacaoEm)}` : ""}
              </Badge>
            ) : null}
            {aluno.impedido ? <Badge variant="destructive">suspenso das aulas</Badge> : null}
            {aluno.necessidadeEspecial ? (
              <Badge variant="secondary">atendimento especializado</Badge>
            ) : null}
            <Badge variant="outline">
              {dias} {dias === 1 ? "dia" : "dias"} no laboratório
            </Badge>
            <Badge variant="outline">{textoMinutos(totalMin)} no total</Badge>
          </DialogDescription>
        </DialogHeader>

        {aniv ? (
          aniv.hoje ? (
            <div
              role="status"
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-600 via-rose-500 to-amber-400 p-4 text-white shadow-lg"
            >
              <span
                aria-hidden
                className="lab-varredura absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />
              <div className="relative flex items-center gap-3">
                <span className="lab-brilho flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/25 text-white">
                  <Cake className="size-7" aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                    Hoje é aniversário!
                  </p>
                  <p className="font-heading text-lg font-extrabold leading-tight">
                    {aluno.nome.split(" ")[0]} está fazendo {aniv.anos}{" "}
                    {aniv.anos === 1 ? "ano" : "anos"} hoje
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2 text-sm">
              <Cake className="size-4 text-muted-foreground" aria-hidden />
              <span>
                Aniversário: <strong>{aniv.diaMes}</strong>
              </span>
              <span className="text-muted-foreground">· hoje tem {textoIdade(aniv)}</span>
            </p>
          )
        ) : null}

        <section className="space-y-3 rounded-xl border p-4">
          <h3 className="text-sm font-semibold">Dados do aluno</h3>
          <ImageUploadField
            value={rascunho.foto}
            onChange={(foto) => setRascunho((r) => ({ ...r, foto }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="f-nasc">Data de nascimento</Label>
              <Input
                id="f-nasc"
                type="date"
                value={rascunho.nascimento}
                onChange={(e) => setRascunho((r) => ({ ...r, nascimento: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="f-inep">INEP do aluno</Label>
              <Input
                id="f-inep"
                inputMode="numeric"
                value={rascunho.inep}
                onChange={(e) => setRascunho((r) => ({ ...r, inep: e.target.value }))}
                placeholder="se tiver"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="f-end">Endereço</Label>
              <Input
                id="f-end"
                value={rascunho.endereco}
                onChange={(e) => setRascunho((r) => ({ ...r, endereco: e.target.value }))}
                placeholder="se tiver"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="f-especialidade">Especialidade / laudo</Label>
              <Input
                id="f-especialidade"
                value={rascunho.especialidade}
                onChange={(e) => setRascunho((r) => ({ ...r, especialidade: e.target.value }))}
                placeholder="Ex.: TEA, deficiência auditiva"
              />
            </div>
            <div className="flex items-center gap-3 self-end pb-2">
              <Switch
                id="f-aee"
                checked={rascunho.necessidadeEspecial}
                onCheckedChange={(v) => setRascunho((r) => ({ ...r, necessidadeEspecial: v }))}
              />
              <Label htmlFor="f-aee">Atendimento especializado (mediador/cuidador)</Label>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="f-esp">Informações específicas (laudo, cuidados, adaptações)</Label>
              <Textarea
                id="f-esp"
                rows={2}
                value={rascunho.observacoesNecessidade}
                onChange={(e) =>
                  setRascunho((r) => ({ ...r, observacoesNecessidade: e.target.value }))
                }
                placeholder="se houver"
              />
            </div>
          </div>
          <Button type="button" onClick={salvarDados}>
            Salvar dados
          </Button>
        </section>

        <section className="space-y-3 rounded-xl border p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Ban className="size-4 text-destructive" aria-hidden /> Suspensão das aulas de
            informática
          </h3>
          <div className="flex items-center gap-3">
            <Switch
              id="f-susp"
              checked={Boolean(aluno.impedido)}
              onCheckedChange={alternarSuspensao}
            />
            <Label htmlFor="f-susp">
              {aluno.impedido
                ? "Suspenso: não aparece para ser marcado no laboratório"
                : "Participando normalmente"}
            </Label>
          </div>
          <div className="space-y-1">
            <Label htmlFor="f-motivo" className="text-xs text-muted-foreground">
              Motivo (vale ao suspender)
            </Label>
            <Input
              id="f-motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              onBlur={() =>
                aluno.impedido &&
                updateAluno(turmaId, alunoId, { motivoImpedimento: motivo.trim() || undefined })
              }
              placeholder="Ex.: não cumpriu as tarefas em sala"
            />
          </div>
        </section>

        <section className="space-y-3 rounded-xl border p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <UserMinus className="size-4 text-slate-500" aria-hidden /> Situação na escola
          </h3>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Situação da matrícula">
            {(
              [
                ["ativo", "Estudando"],
                ["transferido", "Foi transferido"],
                ["desistente", "Desistiu"],
              ] as const
            ).map(([valor, rotulo]) => {
              const atual = aluno.situacao ?? "ativo";
              return (
                <Button
                  key={valor}
                  type="button"
                  size="sm"
                  variant={atual === valor ? "default" : "outline"}
                  aria-pressed={atual === valor}
                  onClick={() => registrarSituacao(valor)}
                >
                  {rotulo}
                </Button>
              );
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
            <div className="space-y-1">
              <Label htmlFor="f-sai-em" className="text-xs text-muted-foreground">
                Data da saída
              </Label>
              <Input
                id="f-sai-em"
                type="date"
                value={saida.em}
                onChange={(e) => setSaida((x) => ({ ...x, em: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="f-sai-obs" className="text-xs text-muted-foreground">
                Observação (para onde foi, motivo…)
              </Label>
              <Input
                id="f-sai-obs"
                value={saida.obs}
                onChange={(e) => setSaida((x) => ({ ...x, obs: e.target.value }))}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Preencha a data e a observação e depois toque em &quot;Foi transferido&quot; ou
            &quot;Desistiu&quot;. Quem saiu deixa de contar nos totais, no rodízio e no laboratório,
            mas a ficha e o histórico continuam guardados. Para desfazer, toque em
            &quot;Estudando&quot;.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border p-4">
          <h3 className="text-sm font-semibold">Anotações do professor de informática</h3>
          <div className="flex gap-2">
            <Textarea
              rows={2}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Escreva uma observação sobre o aluno…"
            />
            <Button
              type="button"
              size="icon"
              aria-label="Guardar anotação"
              disabled={!nota.trim()}
              onClick={guardarNota}
            >
              <MessageSquarePlus />
            </Button>
          </div>
          {(aluno.anotacoes ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma anotação ainda.</p>
          ) : (
            <ul className="space-y-2">
              {(aluno.anotacoes ?? []).map((n) => (
                <li
                  key={n.id}
                  className="flex items-start justify-between gap-2 rounded-lg bg-muted/50 p-3 text-sm"
                >
                  <div>
                    <p className="whitespace-pre-wrap">{n.texto}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {dataBR(n.em.slice(0, 10))} às {horaNaEscola(n.em)}
                      {n.autor ? ` · ${n.autor}` : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Apagar anotação"
                    onClick={() => apagarNota(n.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3 rounded-xl border p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Ban className="size-4 text-red-600" aria-hidden /> Faltas, impedimentos e recusas
            {ocorrencias && ocorrencias.length > 0 ? (
              <Badge variant="secondary">{ocorrencias.length}</Badge>
            ) : null}
          </h3>
          {ocorrencias === null ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : ocorrencias.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma falta, impedimento ou recusa registrada.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {ocorrencias.map((o) => (
                <li key={o.id} className="flex flex-wrap items-start gap-x-3 gap-y-1 p-2.5 text-sm">
                  <span className="w-20 shrink-0 tabular-nums text-muted-foreground">
                    {dataBR(o.data)}
                  </span>
                  <span
                    className={
                      o.ausencia === "nao_autorizado"
                        ? "rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300"
                        : o.ausencia === "recusou"
                          ? "rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-semibold text-violet-700 dark:text-violet-300"
                          : "rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-700 dark:text-red-300"
                    }
                  >
                    {o.ausencia ? ROTULO_AUSENCIA[o.ausencia] : ""}
                  </span>
                  <span className="min-w-0 flex-1 text-muted-foreground">
                    {o.ausenciaMotivo || "Sem anotação"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3 rounded-xl border p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <CalendarDays className="size-4 text-primary" aria-hidden /> Histórico no laboratório
          </h3>
          {erroHistorico ? (
            <p className="text-sm text-destructive">
              {erroHistorico === TABELA_AUSENTE
                ? "O banco ainda não tem a tabela do laboratório (supabase/laboratorio.sql)."
                : erroHistorico}
            </p>
          ) : historico === null ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : porAnoMes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda não foi ao laboratório.</p>
          ) : (
            porAnoMes.map(([ano, meses]) => (
              <div key={ano} className="space-y-2">
                <h4 className="font-heading text-base font-bold">{ano}</h4>
                {[...meses.entries()].map(([ym, lista]) => (
                  <div key={ym} className="rounded-lg border">
                    <p className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-3 py-1.5 text-sm font-semibold capitalize">
                      {nomeDoMes(ym)}
                      <span className="text-xs font-normal normal-case text-muted-foreground">
                        {new Set(lista.map((s) => s.data)).size} dia(s) ·{" "}
                        {textoMinutos(lista.reduce((t, s) => t + minutosDe(s), 0))}
                      </span>
                    </p>
                    <ul className="divide-y text-sm">
                      {lista.map((s) => (
                        <li
                          key={s.id}
                          className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5"
                        >
                          <span>{dataBR(s.data)}</span>
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock3 className="size-3.5" aria-hidden /> {horaNaEscola(s.inicio)}–
                            {horaNaEscola(s.fim)} · {textoMinutos(minutosDe(s))}
                            <Badge variant="outline">{s.turmaRotulo}</Badge>
                            {s.motivoParada ? (
                              <span className="italic" title="Justificativa de quem parou a aula">
                                parada: {s.motivoParada}
                              </span>
                            ) : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))
          )}
        </section>

        <section className="space-y-3 rounded-xl border p-4">
          <h3 className="text-sm font-semibold">Frequência no sistema anterior</h3>
          {presencas === null ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : antigas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem registros de frequência.</p>
          ) : (
            <>
              <p className="flex flex-wrap gap-1.5 text-sm">
                <Badge variant="outline">
                  {antigas.filter((p) => p.status === "presente").length} presenças
                </Badge>
                <Badge variant="outline">
                  {antigas.filter((p) => p.status === "faltou").length} faltas
                </Badge>
                {antigas.some((p) => p.status === "substituido") ? (
                  <Badge variant="outline">
                    {antigas.filter((p) => p.status === "substituido").length} substituído(s)
                  </Badge>
                ) : null}
              </p>
              <details>
                <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
                  Ver dia a dia
                </summary>
                <ul className="mt-2 divide-y rounded-lg border text-sm">
                  {antigas.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5"
                    >
                      <span>{dataBR(p.data)}</span>
                      <span className="flex items-center gap-1.5">
                        <Badge variant={p.status === "faltou" ? "destructive" : "secondary"}>
                          {p.status === "presente"
                            ? "presente"
                            : p.status === "faltou"
                              ? "faltou"
                              : "substituído"}
                        </Badge>
                        {p.motivo ? (
                          <span className="text-xs italic text-muted-foreground">{p.motivo}</span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            </>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Fichas por turma: primeiro se escolhe a turma, depois o aluno. A busca por
 * nome funciona nos dois passos (na tela das turmas, procura na escola toda).
 */
export function BuscaAlunos() {
  const { todasTurmas: turmas } = useAppStore();
  const [turmaId, setTurmaId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<"az" | "velhos" | "novos">("az");
  const [faixa, setFaixa] = useState<number | "distorcao" | null>(null);
  const [aberto, setAberto] = useState<{ turmaId: string; alunoId: string } | null>(null);
  const termo = busca.trim().toLowerCase();
  const turma = turmas.find((t) => t.id === turmaId) ?? null;
  const hoje = hojeNaEscola();

  const estaAtivo = (a: { situacao?: string | undefined }) => !a.situacao || a.situacao === "ativo";

  /** Todos os alunos do escopo (turma ou escola), com idade e defasagem já calculadas. */
  const base = useMemo(
    () =>
      (turma ? [turma] : turmas).flatMap((t) =>
        t.alunos.map((a) => ({
          t,
          a,
          info: infoAniversario(a.nascimento, hoje),
          defas: defasagemIdadeSerie(a.nascimento, t.serie, hoje),
        })),
      ),
    [turma, turmas, hoje],
  );

  /** Quem é o mais velho e o mais novo da escola (só quem está estudando). */
  const extremos = useMemo(() => {
    const comData = turmas
      .flatMap((t) => t.alunos.filter((a) => estaAtivo(a) && a.nascimento).map((a) => ({ t, a })))
      .sort((x, y) => x.a.nascimento!.localeCompare(y.a.nascimento!));
    if (comData.length === 0) return null;
    const velho = comData[0]!;
    const novo = comData[comData.length - 1]!;
    return { velho, novo };
  }, [turmas]);

  const idadesPresentes = useMemo(() => {
    const m = new Map<number, number>();
    for (const x of base)
      if (estaAtivo(x.a) && x.info) m.set(x.info.anos, (m.get(x.info.anos) ?? 0) + 1);
    return [...m.entries()].sort((p, q) => p[0] - q[0]);
  }, [base]);
  const nDistorcao = base.filter((x) => estaAtivo(x.a) && (x.defas ?? 0) >= 2).length;

  const lista = base
    .filter(({ a }) => !termo || a.nome.toLowerCase().includes(termo))
    .filter(({ info, defas }) =>
      faixa === null ? true : faixa === "distorcao" ? (defas ?? 0) >= 2 : info?.anos === faixa,
    )
    .sort((x, y) => {
      const sai = Number(!estaAtivo(x.a)) - Number(!estaAtivo(y.a));
      if (sai) return sai;
      if (ordem !== "az") {
        const nx = x.a.nascimento ?? (ordem === "velhos" ? "9999" : "0000");
        const ny = y.a.nascimento ?? (ordem === "velhos" ? "9999" : "0000");
        const c = ordem === "velhos" ? nx.localeCompare(ny) : ny.localeCompare(nx);
        if (c) return c;
      }
      return x.a.nome.localeCompare(y.a.nome, "pt-BR");
    });
  const filtrando = ordem !== "az" || faixa !== null;
  const mostrarAlunos = turma !== null || termo !== "" || filtrando;

  return (
    <div className="space-y-4">
      <AniversariantesHoje />
      {extremos ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["Mais velho(a) da escola", extremos.velho],
              ["Mais novo(a) da escola", extremos.novo],
            ] as const
          ).map(([rotulo, { t, a }]) => (
            <button
              key={rotulo}
              type="button"
              onClick={() => setAberto({ turmaId: t.id, alunoId: a.id })}
              className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2 text-left transition hover:border-indigo-500"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-extrabold text-white">
                {rotulo.startsWith("Mais velho") ? "↑" : "↓"}
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {rotulo}
                </span>
                <span className="block truncate text-sm font-semibold">{a.nome}</span>
                <span className="text-xs text-muted-foreground">
                  {rotuloTurma(t.serie, t.letra)} ·{" "}
                  {textoIdade(infoAniversario(a.nascimento, hoje)!)}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {turma ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setTurmaId(null)}>
            <ArrowLeft /> Todas as turmas
          </Button>
        ) : null}
        <div className="relative w-full max-w-sm">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={turma ? "Buscar nesta turma…" : "Buscar aluno em toda a escola…"}
            className="pl-8"
            aria-label="Buscar aluno"
          />
        </div>
        <div
          className="flex gap-1 rounded-lg border bg-card/60 p-1 text-xs font-semibold"
          role="group"
          aria-label="Ordenar"
        >
          {(
            [
              ["az", "A–Z"],
              ["velhos", "Mais velhos"],
              ["novos", "Mais novos"],
            ] as const
          ).map(([id, rotulo]) => (
            <button
              key={id}
              type="button"
              aria-pressed={ordem === id}
              onClick={() => setOrdem(id)}
              className={`rounded-md px-3 py-1.5 transition ${ordem === id ? "bg-indigo-600 text-white" : "hover:bg-muted"}`}
            >
              {rotulo}
            </button>
          ))}
        </div>
      </div>

      <div
        className="flex flex-wrap items-center gap-1.5"
        role="group"
        aria-label="Filtrar por idade"
      >
        <button
          type="button"
          aria-pressed={faixa === null}
          onClick={() => setFaixa(null)}
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${faixa === null ? "border-indigo-600 bg-indigo-600 text-white" : "bg-card/60 hover:bg-muted"}`}
        >
          Todas as idades
        </button>
        {idadesPresentes.map(([anos, n]) => (
          <button
            key={anos}
            type="button"
            aria-pressed={faixa === anos}
            onClick={() => setFaixa(faixa === anos ? null : anos)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${faixa === anos ? "border-indigo-600 bg-indigo-600 text-white" : "bg-card/60 hover:bg-muted"}`}
          >
            {anos} anos{" "}
            <span className="rounded-full bg-black/15 px-1.5 tabular-nums dark:bg-white/15">
              {n}
            </span>
          </button>
        ))}
        <button
          type="button"
          aria-pressed={faixa === "distorcao"}
          onClick={() => setFaixa(faixa === "distorcao" ? null : "distorcao")}
          title="Alunos com 2 anos ou mais acima da idade esperada para a série (idade em 31 de março)"
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${faixa === "distorcao" ? "border-amber-600 bg-amber-600 text-white" : "border-amber-500/60 bg-card/60 text-amber-700 hover:bg-muted dark:text-amber-300"}`}
        >
          Distorção idade-série{" "}
          <span className="rounded-full bg-black/15 px-1.5 tabular-nums dark:bg-white/15">
            {nDistorcao}
          </span>
        </button>
      </div>

      {!mostrarAlunos ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {turmas.map((t) => {
            const cor = serieClasses(serieIndexPorNumero(t.serie));
            const ativos = t.alunos.filter((a) => !a.situacao || a.situacao === "ativo");
            const sairam = t.alunos.length - ativos.length;
            const suspensos = ativos.filter((a) => a.impedido).length;
            const aniversariantes = ativos.filter(
              (a) => infoAniversario(a.nascimento, hoje)?.hoje,
            ).length;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setTurmaId(t.id)}
                  className="group relative isolate flex min-h-28 w-full flex-col justify-end overflow-hidden rounded-2xl border text-left text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <img
                    src={t.imagem ?? imagemDaSerie(t.serie)}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/95 via-ink/60 to-ink/20"
                  />
                  <span className="flex items-end justify-between gap-2 p-3">
                    <span>
                      <span
                        className={`rounded-lg px-2 py-0.5 text-sm font-extrabold ${cor.bg} ${cor.text}`}
                      >
                        {rotuloTurma(t.serie, t.letra)}
                      </span>
                      <span className="mt-1.5 block text-xs text-white/80">
                        {t.professorRegente || "sem professor(a) cadastrado(a)"}
                      </span>
                    </span>
                    <span className="text-right text-xs">
                      <strong className="block font-heading text-xl">{ativos.length}</strong>
                      aluno{ativos.length === 1 ? "" : "s"}
                      {sairam > 0 ? (
                        <span className="block text-white/70">{sairam} transf./desist.</span>
                      ) : null}
                      {aniversariantes > 0 ? (
                        <span className="flex items-center justify-end gap-1 font-semibold text-fuchsia-300">
                          <Cake className="size-3" aria-hidden /> {aniversariantes} aniversariante
                          {aniversariantes === 1 ? "" : "s"}
                        </span>
                      ) : null}
                      {suspensos > 0 ? (
                        <span className="block text-amber-300">{suspensos} suspenso(s)</span>
                      ) : null}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <>
          <h3 className="text-sm font-semibold text-muted-foreground">
            {turma
              ? `${rotuloTurma(turma.serie, turma.letra)} · ${turma.professorRegente} · ${lista.length} aluno${lista.length === 1 ? "" : "s"}`
              : `${lista.length} aluno${lista.length === 1 ? "" : "s"} na escola toda${ordem === "velhos" ? " · do mais velho ao mais novo" : ordem === "novos" ? " · do mais novo ao mais velho" : ""}`}
          </h3>
          {lista.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum aluno encontrado.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {lista.map(({ t, a, info }) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setAberto({ turmaId: t.id, alunoId: a.id })}
                    className={`flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left transition hover:border-primary hover:bg-muted/50 ${a.situacao && a.situacao !== "ativo" ? "border-dashed opacity-60" : ""}`}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                      {a.foto ? (
                        <img src={a.foto} alt="" className="size-full object-cover" />
                      ) : (
                        <UserRound className="size-5 text-muted-foreground" aria-hidden />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                        {a.nome}
                        <SeloAniversario nascimento={a.nascimento} />
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {turma ? "" : `${rotuloTurma(t.serie, t.letra)} · `}
                        {info ? textoIdade(info) : "sem data de nascimento"}
                        {a.situacao === "transferido" ? " · transferido(a)" : ""}
                        {a.situacao === "desistente" ? " · desistente" : ""}
                        {a.impedido ? " · suspenso" : ""}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {aberto ? <FichaAluno {...aberto} aberto aoFechar={() => setAberto(null)} /> : null}
    </div>
  );
}
