import { createFileRoute } from "@tanstack/react-router";
import {
  Copy,
  Eye,
  EyeOff,
  HandHeart,
  KeyRound,
  Loader2,
  Presentation,
  RefreshCw,
  Users2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardShell } from "@/components/school/dashboard-shell";
import { useAppStore } from "@/lib/app-store";
import { obterOuCriarPin, redefinirPin } from "@/lib/aluno-area";
import { senhaApoio, senhaProfessor } from "@/lib/profissional-acesso";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";
import type { Turma } from "@/lib/types";

export const Route = createFileRoute("/dashboard/acessos")({
  component: AcessosPage,
  head: () => ({
    meta: [
      { title: "Senhas de acesso · Agenda de Informática" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

async function copiar(texto: string, aviso: string) {
  try {
    await navigator.clipboard.writeText(texto);
    toast.success(aviso);
  } catch {
    toast.error("O navegador não deixou copiar. Selecione o número na tela.");
  }
}

/** Número numa caixinha monoespaçada, do jeito que se lê e se copia. */
function Senha({ valor }: { valor: string }) {
  return (
    <span className="rounded-md bg-muted px-2 py-1 font-mono text-sm tracking-[0.3em] text-foreground">
      {valor}
    </span>
  );
}

function BotaoCopiar({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7"
      title={`Copiar a senha de ${rotulo}`}
      onClick={() => copiar(valor, `Senha de ${rotulo} copiada.`)}
    >
      <Copy className="size-3.5" />
    </Button>
  );
}

function ProfissionaisDaTurma({ turma }: { turma: Turma }) {
  const apoios = turma.apoioEspecial ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Presentation className="size-4 text-primary" /> Professor e apoio especializado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-muted-foreground">
          Estas senhas são geradas a partir do nome e da turma, então são sempre as mesmas e não
          podem ser trocadas aqui — se alguém trocar de turma, a senha acompanha o novo cadastro.
        </p>

        <div className="flex flex-col divide-y divide-border/60">
          <div className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                Prof(a). {turma.professorRegente}
              </p>
              <p className="text-xs text-muted-foreground">Professor(a) regente · /professor</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Senha valor={senhaProfessor(turma)} />
              <BotaoCopiar valor={senhaProfessor(turma)} rotulo={turma.professorRegente} />
            </div>
          </div>

          {apoios.length === 0 ? (
            <p className="py-3 text-sm text-muted-foreground">
              Nenhum mediador ou cuidador cadastrado nesta turma.
            </p>
          ) : (
            apoios.map((apoio, indice) => (
              <div key={indice} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{apoio.nome}</p>
                  <p className="text-xs text-muted-foreground">{apoio.funcao} · /mediador</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Senha valor={senhaApoio(turma, indice)} />
                  <BotaoCopiar valor={senhaApoio(turma, indice)} rotulo={apoio.nome} />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PinsDosAlunos({ turma }: { turma: Turma }) {
  const [pins, setPins] = useState<Record<string, string>>({});
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);
  const [carregandoTodos, setCarregandoTodos] = useState(false);

  async function verPin(alunoId: string) {
    if (pins[alunoId]) {
      setPins((atual) => {
        const novo = { ...atual };
        delete novo[alunoId];
        return novo;
      });
      return;
    }
    setOcupadoId(alunoId);
    try {
      const pin = await obterOuCriarPin(alunoId, turma.id);
      setPins((atual) => ({ ...atual, [alunoId]: pin }));
    } catch (err) {
      toast.error(`Não foi possível obter o PIN: ${(err as Error).message}`);
    } finally {
      setOcupadoId(null);
    }
  }

  async function sortearNovoPin(alunoId: string, nome: string) {
    setOcupadoId(alunoId);
    try {
      const pin = await redefinirPin(alunoId, turma.id);
      setPins((atual) => ({ ...atual, [alunoId]: pin }));
      toast.success(`Novo PIN de ${nome}: ${pin}. O anterior deixou de valer.`);
    } catch (err) {
      toast.error(`Não foi possível trocar o PIN: ${(err as Error).message}`);
    } finally {
      setOcupadoId(null);
    }
  }

  /** Busca (ou cria) o PIN de todos de uma vez, para entregar a lista à turma. */
  async function verTodos() {
    setCarregandoTodos(true);
    try {
      const obtidos = await Promise.all(
        turma.alunos.map(async (aluno) => [aluno.id, await obterOuCriarPin(aluno.id, turma.id)]),
      );
      setPins(Object.fromEntries(obtidos));
    } catch (err) {
      toast.error(`Não foi possível carregar todos os PINs: ${(err as Error).message}`);
    } finally {
      setCarregandoTodos(false);
    }
  }

  function esconderTodos() {
    setPins({});
  }

  /** Lista em texto para colar num aviso ou imprimir. */
  async function copiarLista() {
    const linhas = turma.alunos
      .map((aluno) => `${aluno.nome}: ${pins[aluno.id] ?? "—"}`)
      .join("\n");
    await copiar(
      `PINs · ${turma.serie} "${turma.letra}"\n\n${linhas}`,
      "Lista copiada. Cole onde precisar.",
    );
  }

  const todosVisiveis = turma.alunos.length > 0 && turma.alunos.every((a) => pins[a.id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users2 className="size-4 text-primary" /> PINs dos alunos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-muted-foreground">
          Diferente das senhas dos profissionais, o PIN do aluno é sorteado e fica guardado no banco
          — por isso ele precisa ser buscado, e pode ser trocado a qualquer momento.
        </p>

        <div className="mb-3 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={todosVisiveis ? esconderTodos : verTodos}
            disabled={carregandoTodos || turma.alunos.length === 0}
          >
            {carregandoTodos ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : todosVisiveis ? (
              <EyeOff className="size-3.5" />
            ) : (
              <Eye className="size-3.5" />
            )}
            {todosVisiveis ? "Esconder todos" : "Ver todos"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={copiarLista}
            disabled={Object.keys(pins).length === 0}
          >
            <Copy className="size-3.5" /> Copiar lista
          </Button>
        </div>

        {turma.alunos.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">Nenhum aluno cadastrado nesta turma.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border/60">
            {turma.alunos.map((aluno) => {
              const pin = pins[aluno.id];
              const ocupado = ocupadoId === aluno.id;
              return (
                <li key={aluno.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate text-sm text-foreground">{aluno.nome}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    {pin ? <Senha valor={pin} /> : null}
                    {pin ? <BotaoCopiar valor={pin} rotulo={aluno.nome} /> : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 px-2"
                      onClick={() => verPin(aluno.id)}
                      disabled={ocupado}
                    >
                      {ocupado ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : pin ? (
                        <EyeOff className="size-3.5" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                      {pin ? "Esconder" : "Ver"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      title="Sortear um PIN novo (o atual deixa de valer)"
                      onClick={() => sortearNovoPin(aluno.id, aluno.nome)}
                      disabled={ocupado}
                    >
                      <RefreshCw className="size-3.5" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function AcessosPage() {
  const { turmas } = useAppStore();
  const [turmaId, setTurmaId] = useState<string>(turmas[0]?.id ?? "");
  const turma = turmas.find((t) => t.id === turmaId) ?? turmas[0];

  if (!turma) {
    return (
      <DashboardShell>
        <h1 className="text-2xl font-semibold text-foreground">Senhas de acesso</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cadastre uma turma para gerar as senhas de acesso.
        </p>
      </DashboardShell>
    );
  }

  const cor = serieClasses(serieIndexPorNumero(turma.serie));

  return (
    <DashboardShell>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <KeyRound className="size-5 text-primary" /> Senhas de acesso
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Tudo o que dá entrada nas áreas do site, turma por turma: a senha do professor regente,
            a de cada mediador/cuidador e o PIN de cada aluno.
          </p>
        </div>
        <Select value={turma.id} onValueChange={setTurmaId}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {turmas.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.serie} &quot;{item.letra}&quot; · Prof(a). {item.professorRegente}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span
          className={`flex size-9 items-center justify-center rounded-lg text-sm font-bold ${cor.bg} ${cor.text}`}
        >
          {turma.letra}
        </span>
        <Badge variant="secondary" className="font-normal">
          {turma.alunos.length} alunos
        </Badge>
        <Badge variant="secondary" className="gap-1 font-normal">
          <HandHeart className="size-3" /> {turma.apoioEspecial?.length ?? 0} de apoio
        </Badge>
      </div>

      <div className="flex flex-col gap-4">
        <ProfissionaisDaTurma turma={turma} />
        <PinsDosAlunos key={turma.id} turma={turma} />
      </div>

      <p className="mt-5 text-xs text-muted-foreground">
        Estas senhas separam as áreas de trabalho do site — elas não são o login do painel
        administrativo, que é o que de fato protege o cadastro da escola. Entregue cada número
        apenas à pessoa dele.
      </p>
    </DashboardShell>
  );
}
