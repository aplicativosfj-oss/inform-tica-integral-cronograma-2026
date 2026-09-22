import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle, Eye, EyeOff, KeyRound, Plus, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { DashboardShell } from "@/components/school/dashboard-shell";
import { useAppStore } from "@/lib/app-store";
import {
  criarAtividade,
  fetchAtividadesDaTurma,
  fetchStatusDaAtividade,
  obterOuCriarPin,
  removerAtividade,
} from "@/lib/aluno-area";
import { useConfirmar } from "@/lib/confirm-store";
import { toDateKey, agoraNaEscola } from "@/lib/schedule-engine";
import type { Atividade, AtividadeStatus } from "@/lib/types";

export const Route = createFileRoute("/dashboard/atividades")({
  component: AtividadesPage,
  head: () => ({
    meta: [
      { title: "Área do Aluno · Agenda de Informática" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AtividadesPage() {
  const { turmas } = useAppStore();
  const [turmaId, setTurmaId] = useState(turmas[0]?.id ?? "");
  const turma = turmas.find((t) => t.id === turmaId);

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Área do Aluno</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre atividades remotas por turma, acompanhe quem concluiu e veja o PIN de acesso de
          cada aluno.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-1.5">
        <Label htmlFor="turma-atividades">Turma</Label>
        <Select value={turmaId} onValueChange={setTurmaId}>
          <SelectTrigger id="turma-atividades" className="w-64">
            <SelectValue placeholder="Selecione uma turma" />
          </SelectTrigger>
          <SelectContent>
            {turmas.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.serie} &quot;{t.letra}&quot;
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {turma ? (
        <div className="flex flex-col gap-8">
          <AtividadesDaTurma turma={turma} />
          <PinsDaTurma turma={turma} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Cadastre uma turma primeiro.</p>
      )}
    </DashboardShell>
  );
}

function AtividadesDaTurma({ turma }: { turma: ReturnType<typeof useAppStore>["turmas"][number] }) {
  const confirmar = useConfirmar();
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [url, setUrl] = useState("");
  const [data, setData] = useState(toDateKey(agoraNaEscola()));
  const [salvando, setSalvando] = useState(false);
  const [statusAberto, setStatusAberto] = useState<string | null>(null);
  const [statusPorAtividade, setStatusPorAtividade] = useState<Record<string, AtividadeStatus[]>>(
    {},
  );

  async function carregar() {
    setCarregando(true);
    try {
      const dados = await fetchAtividadesDaTurma(turma.id);
      setAtividades(dados);
    } catch (err) {
      toast.error(`Não foi possível carregar as atividades: ${(err as Error).message}`);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    setStatusAberto(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turma.id]);

  async function salvar() {
    if (!titulo.trim()) {
      toast.error("Dê um título para a atividade.");
      return;
    }
    setSalvando(true);
    try {
      await criarAtividade({
        turmaId: turma.id,
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        url: url.trim() || undefined,
        data,
      });
      toast.success("Atividade cadastrada.");
      setTitulo("");
      setDescricao("");
      setUrl("");
      await carregar();
    } catch (err) {
      toast.error(`Não foi possível cadastrar: ${(err as Error).message}`);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(atividadeId: string) {
    const ok = await confirmar({
      titulo: "Excluir esta atividade?",
      descricao: "O progresso dos alunos nessa atividade também será perdido.",
    });
    if (!ok) return;
    try {
      await removerAtividade(atividadeId);
      toast.success("Atividade excluída.");
      await carregar();
    } catch (err) {
      toast.error(`Não foi possível excluir: ${(err as Error).message}`);
    }
  }

  async function verProgresso(atividadeId: string) {
    if (statusAberto === atividadeId) {
      setStatusAberto(null);
      return;
    }
    setStatusAberto(atividadeId);
    if (!statusPorAtividade[atividadeId]) {
      try {
        const status = await fetchStatusDaAtividade(atividadeId);
        setStatusPorAtividade((atual) => ({ ...atual, [atividadeId]: status }));
      } catch (err) {
        toast.error(`Não foi possível carregar o progresso: ${(err as Error).message}`);
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Atividades de {turma.serie} &quot;{turma.letra}&quot;
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid gap-3 rounded-lg border border-dashed border-border/60 p-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="titulo-atividade">Título</Label>
            <Input
              id="titulo-atividade"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Pratique digitação no EdClub"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="descricao-atividade">Descrição (opcional)</Label>
            <Textarea
              id="descricao-atividade"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              placeholder="O que o aluno deve fazer"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="url-atividade">Link (opcional)</Label>
            <Input
              id="url-atividade"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="data-atividade">Data</Label>
            <Input
              id="data-atividade"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>
          <Button onClick={salvar} disabled={salvando} className="w-fit gap-1.5 sm:col-span-2">
            <Plus className="size-4" /> Cadastrar atividade
          </Button>
        </div>

        {carregando ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : atividades.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhuma atividade cadastrada para essa turma ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {atividades.map((atividade) => {
              const status = statusPorAtividade[atividade.id];
              const concluidos = status?.filter((s) => s.status === "concluida").length ?? null;
              return (
                <div key={atividade.id} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{atividade.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(`${atividade.data}T00:00:00`).toLocaleDateString("pt-BR")}
                        {atividade.descricao ? ` · ${atividade.descricao}` : ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-destructive hover:bg-destructive/10"
                      onClick={() => excluir(atividade.id)}
                      aria-label="Excluir atividade"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-1 h-auto p-0 text-xs"
                    onClick={() => verProgresso(atividade.id)}
                  >
                    {statusAberto === atividade.id
                      ? "Ocultar progresso"
                      : concluidos !== null
                        ? `${concluidos}/${turma.alunos.length} concluíram — ver detalhes`
                        : "Ver progresso"}
                  </Button>
                  {statusAberto === atividade.id ? (
                    <ul className="mt-2 flex flex-col gap-1 border-t border-border/60 pt-2">
                      {turma.alunos.map((aluno) => {
                        const concluiu = status?.find(
                          (s) => s.alunoId === aluno.id && s.status === "concluida",
                        );
                        return (
                          <li
                            key={aluno.id}
                            className="flex items-center gap-2 text-xs text-muted-foreground"
                          >
                            {concluiu ? (
                              <CheckCircle2 className="size-3.5 text-emerald-700 dark:text-emerald-400" />
                            ) : (
                              <Circle className="size-3.5" />
                            )}
                            {aluno.nome}
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PinsDaTurma({ turma }: { turma: ReturnType<typeof useAppStore>["turmas"][number] }) {
  const [pinsVisiveis, setPinsVisiveis] = useState<Record<string, string>>({});
  const [carregandoId, setCarregandoId] = useState<string | null>(null);

  async function alternarPin(alunoId: string) {
    if (pinsVisiveis[alunoId]) {
      setPinsVisiveis((atual) => {
        const novo = { ...atual };
        delete novo[alunoId];
        return novo;
      });
      return;
    }
    setCarregandoId(alunoId);
    try {
      const pin = await obterOuCriarPin(alunoId, turma.id);
      setPinsVisiveis((atual) => ({ ...atual, [alunoId]: pin }));
    } catch (err) {
      toast.error(`Não foi possível obter o PIN: ${(err as Error).message}`);
    } finally {
      setCarregandoId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="size-4 text-primary" /> PINs de acesso — {turma.serie} &quot;
          {turma.letra}&quot;
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-muted-foreground">
          Cada aluno usa o próprio nome + PIN para entrar na Área do Aluno. O PIN é gerado
          automaticamente na primeira vez que você clicar em "Ver".
        </p>
        <ul className="flex flex-col divide-y divide-border/60">
          {turma.alunos.map((aluno) => (
            <li key={aluno.id} className="flex items-center justify-between gap-3 py-2">
              <span className="text-sm text-foreground">{aluno.nome}</span>
              <div className="flex items-center gap-2">
                {pinsVisiveis[aluno.id] ? (
                  <Badge variant="secondary" className="font-mono text-sm">
                    {pinsVisiveis[aluno.id]}
                  </Badge>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={carregandoId === aluno.id}
                  onClick={() => alternarPin(aluno.id)}
                >
                  {pinsVisiveis[aluno.id] ? (
                    <>
                      <EyeOff className="size-3.5" /> Ocultar
                    </>
                  ) : (
                    <>
                      <Eye className="size-3.5" /> Ver
                    </>
                  )}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
