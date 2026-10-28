import { useMemo, useState } from "react";

import type { DadosLab } from "@/components/school/laboratorio/painel-agora";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/app-store";
import { hojeNaEscola, inicioDaSemana, usoDoAluno } from "@/lib/laboratorio";
import { LIMITE_IDAS_MES, LIMITE_IDAS_SEMANA } from "@/lib/recursos";

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function dataCurta(chave: string) {
  const [, m, d] = chave.split("-");
  return `${d}/${m}`;
}

/**
 * Quantas vezes cada aluno foi ao laboratório nesta semana e neste mês, com
 * destaque para quem repetiu e a lista de quem ainda não foi no mês — para o
 * revezamento ser justo sem o professor precisar anotar nada.
 */
export function RelatorioUso({ dados }: { dados: DadosLab }) {
  const { turmas } = useAppStore();
  const hoje = hojeNaEscola();
  const [soRepetidos, setSoRepetidos] = useState(false);
  const mes = MESES[Number(hoje.slice(5, 7)) - 1];

  const linhas = useMemo(
    () =>
      turmas.map((t) => {
        const alunos = t.alunos.map((a) => {
          const uso = usoDoAluno(dados.sessoes, a.id, hoje);
          const dias = dados.sessoes.filter((s) => s.alunoId === a.id).map((s) => s.data);
          const ultima = dias.length ? dias.sort().at(-1)! : null;
          return { id: a.id, nome: a.nome, semana: uso.semana, mes: uso.mes, ultima };
        });
        return { turma: t, alunos };
      }),
    [turmas, dados.sessoes, hoje],
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Semana de {dataCurta(inicioDaSemana(hoje))} em diante · mês de {mes}. Cada dia vale uma ida,
        mesmo que o aluno tenha ido em dois grupos. Destaque em âmbar: mais de {LIMITE_IDAS_SEMANA}{" "}
        ida na semana ou mais de {LIMITE_IDAS_MES} no mês.
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={soRepetidos ? "outline" : "default"}
          onClick={() => setSoRepetidos(false)}
        >
          Todos os alunos
        </Button>
        <Button
          size="sm"
          variant={soRepetidos ? "default" : "outline"}
          onClick={() => setSoRepetidos(true)}
        >
          Só quem repetiu
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {linhas.map(({ turma, alunos }) => {
          const visiveis = soRepetidos
            ? alunos.filter((a) => a.semana > LIMITE_IDAS_SEMANA || a.mes > LIMITE_IDAS_MES)
            : alunos;
          const semIr = alunos.filter((a) => a.mes === 0).length;
          if (soRepetidos && visiveis.length === 0) return null;
          return (
            <Card key={turma.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                  {turma.serie.replace(/\D+/g, "")}º {turma.letra}
                  <Badge variant="secondary" className="font-normal">
                    {alunos.length - semIr} de {alunos.length} já foram em {mes}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {visiveis.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum aluno cadastrado.</p>
                ) : (
                  <table className="w-full min-w-[20rem] text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="py-1 pr-2">Aluno</th>
                        <th className="pr-2">Semana</th>
                        <th className="pr-2">Mês</th>
                        <th>Última ida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visiveis.map((a) => {
                        const repetiuSemana = a.semana > LIMITE_IDAS_SEMANA;
                        const repetiuMes = a.mes > LIMITE_IDAS_MES;
                        return (
                          <tr key={a.id} className="border-b last:border-0">
                            <td className="py-1.5 pr-2">{a.nome}</td>
                            <td
                              className={`pr-2 ${repetiuSemana ? "font-semibold text-amber-600" : ""}`}
                            >
                              {a.semana}×
                            </td>
                            <td
                              className={`pr-2 ${repetiuMes ? "font-semibold text-amber-600" : ""}`}
                            >
                              {a.mes}×
                            </td>
                            <td className="text-muted-foreground">
                              {a.ultima ? dataCurta(a.ultima) : "ainda não foi"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
