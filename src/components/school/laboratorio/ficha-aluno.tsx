import {
  Ban,
  CalendarDays,
  Clock3,
  MessageSquarePlus,
  Search,
  Trash2,
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
  carregarHistoricoAluno,
  horaNaEscola,
  TABELA_AUSENTE,
  type SessaoLab,
} from "@/lib/laboratorio";
import { idadeEmAnos } from "@/lib/profissional-acesso";
import type { AnotacaoAluno } from "@/lib/types";

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
  const { turmas, updateAluno } = useAppStore();
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
  });
  const [nota, setNota] = useState("");
  const [motivo, setMotivo] = useState("");
  const [historico, setHistorico] = useState<SessaoLab[] | null>(null);
  const [erroHistorico, setErroHistorico] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto || !aluno) return;
    setRascunho({
      foto: aluno.foto,
      nascimento: aluno.nascimento ?? "",
      inep: aluno.inep ?? "",
      endereco: aluno.endereco ?? "",
      especialidade: aluno.especialidade ?? "",
      observacoesNecessidade: aluno.observacoesNecessidade ?? "",
    });
    setMotivo(aluno.motivoImpedimento ?? "");
    setNota("");
    setHistorico(null);
    setErroHistorico(null);
    carregarHistoricoAluno(alunoId)
      .then(setHistorico)
      .catch((e: Error) => setErroHistorico(e.message));
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
  const idade = idadeEmAnos(aluno.nascimento);
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
    });
    toast.success("Dados do aluno salvos.");
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
                {idade !== null ? ` · ${idade} anos` : ""}
                {aluno.nascimento ? ` · nasceu em ${dataBR(aluno.nascimento)}` : ""}
              </span>
            </span>
          </DialogTitle>
          <DialogDescription className="flex flex-wrap gap-1.5">
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
      </DialogContent>
    </Dialog>
  );
}

/** Lista de todos os alunos com busca; tocar no nome abre a ficha. */
export function BuscaAlunos() {
  const { turmas } = useAppStore();
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState<{ turmaId: string; alunoId: string } | null>(null);
  const termo = busca.trim().toLowerCase();
  const lista = turmas
    .flatMap((t) => t.alunos.map((a) => ({ t, a })))
    .filter(({ a }) => !termo || a.nome.toLowerCase().includes(termo))
    .sort((x, y) => x.a.nome.localeCompare(y.a.nome, "pt-BR"));
  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar aluno pelo nome…"
          className="pl-8"
          aria-label="Buscar aluno"
        />
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {lista.map(({ t, a }) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => setAberto({ turmaId: t.id, alunoId: a.id })}
              className="flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left transition hover:bg-muted/50"
            >
              <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                {a.foto ? (
                  <img src={a.foto} alt="" className="size-full object-cover" />
                ) : (
                  <UserRound className="size-5 text-muted-foreground" aria-hidden />
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{a.nome}</span>
                <span className="text-xs text-muted-foreground">
                  {rotuloTurma(t.serie, t.letra)}
                  {a.impedido ? " · suspenso" : ""}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {aberto ? <FichaAluno {...aberto} aberto aoFechar={() => setAberto(null)} /> : null}
    </div>
  );
}
