import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DADOS_I } from "@/lib/diagnostica/dados-i";
import { RENDIMENTO_3_BIMESTRE } from "@/lib/rendimento/dados-3bim";
import { instrumento, textoAplicacao } from "@/lib/resultados/referencia";
import { percentuais, type RendimentoDisciplina } from "@/lib/rendimento/tipos";

const pct = (v: number) => `${Math.round(v * 100)}%`;

function Barra({ d }: { d: RendimentoDisciplina }) {
  const p = percentuais(d);
  return (
    <div
      className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
      role="img"
      aria-label={`${d.nome}: ${d.padrao} alunos de 7 a 10, ${d.classificatoria} de 5 a 6,9 e ${d.inferior} de 0 a 4,9`}
    >
      <div className="bg-emerald-500" style={{ width: `${p.padrao * 100}%` }} />
      <div className="bg-amber-400" style={{ width: `${p.classificatoria * 100}%` }} />
      <div className="bg-red-500" style={{ width: `${p.inferior * 100}%` }} />
    </div>
  );
}

/** Média da diagnóstica (I) da mesma turma, para comparar com as notas do bimestre. */
function diagnostica(ano: number, turma: string, disc: "LP" | "MAT") {
  return DADOS_I.turmas.find((t) => t.ano === ano && t.turma === turma && t.disc === disc);
}

export function PainelRendimento({
  mostrarProfessor = true,
  semCabecalho = false,
}: {
  /** Na página pública o nome do professor não aparece ao lado das notas da turma. */
  mostrarProfessor?: boolean;
  /** A página que hospeda o painel já tem o título dela. */
  semCabecalho?: boolean;
} = {}) {
  const { turmas, titulo } = RENDIMENTO_3_BIMESTRE;

  const alertas = turmas.flatMap((t) =>
    t.disciplinas.filter((d) => d.padrao < d.total).map((d) => ({ t, d, p: percentuais(d) })),
  );

  return (
    <div className="space-y-6">
      <div>
        {semCabecalho ? null : <h1 className="text-2xl font-bold">{titulo}</h1>}
        <p className="text-sm text-muted-foreground">
          Alunos por faixa de nota: <span className="font-medium text-emerald-600">7,0 a 10,0</span>{" "}
          · <span className="font-medium text-amber-600">5,0 a 6,9</span> ·{" "}
          <span className="font-medium text-red-600">0 a 4,9</span>. Os percentuais são calculados a
          partir das quantidades.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Onde ainda há alunos abaixo de 7,0</CardTitle>
        </CardHeader>
        <CardContent>
          {alertas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma turma com alunos abaixo de 7,0.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {alertas.map(({ t, d, p }) => (
                <li key={`${t.ano}${t.turma}${d.id}`}>
                  <strong>
                    {t.ano}º {t.turma}
                  </strong>{" "}
                  · {d.nome}: {d.classificatoria + d.inferior} de {d.total} alunos (
                  {pct(p.classificatoria + p.inferior)}) abaixo de 7,0
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notas do bimestre × I Avaliação Diagnóstica</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3">Turma</th>
                <th className="pr-3">Disciplina</th>
                <th className="pr-3">Alunos de 7 a 10 (bimestre)</th>
                <th className="pr-3">Média na diagnóstica (0–100)</th>
                <th>Acima de 50% na diagnóstica</th>
              </tr>
            </thead>
            <tbody>
              {turmas.flatMap((t) =>
                (["LP", "MAT"] as const).map((id) => {
                  const d = t.disciplinas.find((x) => x.id === id);
                  const dg = diagnostica(t.ano, t.turma, id);
                  if (!d) return null;
                  return (
                    <tr key={`${t.ano}${t.turma}${id}`} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">
                        {t.ano}º {t.turma}
                      </td>
                      <td className="pr-3">{d.nome}</td>
                      <td className="pr-3">{pct(percentuais(d).padrao)}</td>
                      <td className="pr-3">{dg?.media != null ? dg.media.toFixed(1) : "—"}</td>
                      <td>{dg?.azuis != null ? pct(dg.azuis) : "—"}</td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted-foreground">
            <strong>Atenção: são momentos diferentes do ano.</strong> As notas são do{" "}
            {instrumento("rendimento").periodo} ({textoAplicacao(instrumento("rendimento"))}); a
            diagnóstica foi aplicada no {instrumento("diagnostica").periodo} (
            {textoAplicacao(instrumento("diagnostica"))}). Os dois resultados medem coisas
            distintas, então a comparação serve para levantar perguntas, não para concluir que um
            está certo e o outro errado.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {turmas.map((t) => (
          <Card key={`${t.ano}${t.turma}`}>
            <CardHeader>
              <CardTitle className="text-base">
                {t.ano}º ano {t.turma}
              </CardTitle>
              {mostrarProfessor && t.professor ? (
                <p className="text-xs text-muted-foreground">Professor(a): {t.professor}</p>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3">
              {t.disciplinas.map((d) => {
                const p = percentuais(d);
                return (
                  <div key={d.id} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span>{d.nome}</span>
                      <span className="text-xs text-muted-foreground">
                        {d.padrao}/{d.total} de 7 a 10 · {pct(p.padrao)}
                      </span>
                    </div>
                    <Barra d={d} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
