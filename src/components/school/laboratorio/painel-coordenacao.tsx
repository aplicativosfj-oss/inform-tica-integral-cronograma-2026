import { Clock3, GraduationCap, Layers, Users2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/app-store";
import { useAuth } from "@/lib/auth-store";
import {
  TABELA_AUSENTE,
  agruparSessoes,
  carregarSessoesDoMes,
  hojeNaEscola,
  nomeExibido,
  type SessaoLab,
} from "@/lib/laboratorio";
import { LIMITE_IDAS_MES } from "@/lib/recursos";

const horas = (ms: number) =>
  (ms / 3_600_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 });

function Indicador({
  Icone,
  rotulo,
  valor,
}: {
  Icone: typeof Users2;
  rotulo: string;
  valor: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icone className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{rotulo}</p>
          <p className="font-heading text-xl font-bold">{valor}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Coordenação: como o laboratório foi usado no mês, por turma e por aluno.
 * Acesso aberto, somente leitura. Substitui o diário das aulas programadas.
 */
export function PainelCoordenacaoLab() {
  const { turmas } = useAppStore();
  const { isAuthenticated } = useAuth();
  const [mes, setMes] = useState(() => hojeNaEscola().slice(0, 7));
  const [sessoes, setSessoes] = useState<SessaoLab[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    setSessoes(null);
    setErro(null);
    carregarSessoesDoMes(mes)
      .then((s) => vivo && setSessoes(s))
      .catch((e: Error) => {
        if (!vivo) return;
        setErro(e.message);
        setSessoes([]);
      });
    return () => {
      vivo = false;
    };
  }, [mes]);

  const resumo = useMemo(() => {
    const lista = sessoes ?? [];
    const grupos = agruparSessoes(lista);
    const msTotal = lista.reduce(
      (n, s) => n + (new Date(s.fim).getTime() - new Date(s.inicio).getTime()),
      0,
    );
    const diasPorAluno = new Map<string, Set<string>>();
    for (const s of lista) {
      const set = diasPorAluno.get(s.alunoId) ?? new Set<string>();
      set.add(s.data);
      diasPorAluno.set(s.alunoId, set);
    }
    const porTurma = turmas.map((t) => {
      const doGrupo = lista.filter((s) => s.turmaId === t.id);
      const alunos = new Set(doGrupo.map((s) => s.alunoId));
      const idas = [...alunos].reduce((n, id) => n + (diasPorAluno.get(id)?.size ?? 0), 0);
      return {
        turma: t,
        foram: alunos.size,
        total: t.alunos.length,
        idas,
        grupos: agruparSessoes(doGrupo).length,
        ms: doGrupo.reduce(
          (n, s) => n + (new Date(s.fim).getTime() - new Date(s.inicio).getTime()),
          0,
        ),
      };
    });
    const nomes = new Map(
      lista.map((s) => [s.alunoId, { nome: s.alunoNome, turma: s.turmaRotulo }]),
    );
    const ranking = [...diasPorAluno.entries()]
      .map(([id, dias]) => ({ id, dias: dias.size, ...nomes.get(id)! }))
      .filter((r) => r.dias > LIMITE_IDAS_MES)
      .sort((a, b) => b.dias - a.dias)
      .slice(0, 10);
    return { lista, grupos: grupos.length, msTotal, alunos: diasPorAluno.size, porTurma, ranking };
  }, [sessoes, turmas]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Coordenação</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Como o laboratório de informática foi usado no mês, turma por turma e aluno por aluno.
            Qualquer pessoa pode olhar; ninguém pode alterar.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mes-coord">Mês</Label>
          <Input
            id="mes-coord"
            type="month"
            className="w-44"
            value={mes}
            onChange={(e) => setMes(e.target.value || hojeNaEscola().slice(0, 7))}
          />
        </div>
      </div>

      {erro === TABELA_AUSENTE ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          O controle do laboratório ainda está sendo ligado. Volte daqui a pouco.
        </p>
      ) : erro ? (
        <p className="text-sm text-destructive">Não consegui carregar o mês agora: {erro}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador
          Icone={Users2}
          rotulo="Alunos que foram"
          valor={sessoes ? String(resumo.alunos) : "…"}
        />
        <Indicador
          Icone={Layers}
          rotulo="Grupos no laboratório"
          valor={sessoes ? String(resumo.grupos) : "…"}
        />
        <Indicador
          Icone={Clock3}
          rotulo="Horas de uso"
          valor={sessoes ? horas(resumo.msTotal) : "…"}
        />
        <Indicador
          Icone={GraduationCap}
          rotulo="Alunos cadastrados"
          valor={String(turmas.reduce((n, t) => n + t.alunos.length, 0))}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Uso por turma</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[30rem] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3">Turma</th>
                <th className="pr-3">Alunos que foram</th>
                <th className="pr-3">Idas</th>
                <th className="pr-3">Grupos</th>
                <th>Horas</th>
              </tr>
            </thead>
            <tbody>
              {resumo.porTurma.map(({ turma, foram, total, idas, grupos, ms }) => (
                <tr key={turma.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium">
                    {turma.serie.replace(/\D+/g, "")}º {turma.letra}
                  </td>
                  <td className="pr-3">
                    {foram} de {total}
                  </td>
                  <td className="pr-3">{idas}</td>
                  <td className="pr-3">{grupos}</td>
                  <td>{horas(ms)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quem foi mais de uma vez no mês</CardTitle>
        </CardHeader>
        <CardContent>
          {resumo.ranking.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ninguém repetiu neste mês. Que bom!</p>
          ) : (
            <ol className="space-y-1.5 text-sm">
              {resumo.ranking.map((r, i) => (
                <li key={r.id} className="flex flex-wrap items-baseline gap-x-3">
                  <span className="w-5 text-right font-semibold text-muted-foreground">
                    {i + 1}.
                  </span>
                  <strong>{nomeExibido(r.nome, isAuthenticated)}</strong>
                  <span className="text-muted-foreground">
                    {r.turma} · {r.dias} idas
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
