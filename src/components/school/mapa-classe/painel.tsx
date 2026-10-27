import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  Info,
  PenLine,
  Users2,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MAPA_CLASSE_3_BIM } from "@/lib/mapa-classe/dados-3bim";
import { instrumento, textoAplicacao } from "@/lib/resultados/referencia";
import { LEITURA, ZONAS, escritaDoAno, type NivelInfo, type Zona } from "@/lib/mapa-classe/niveis";
import type { EvolucaoLeitura, TurmaMapa } from "@/lib/mapa-classe/tipos";

const pct = (parte: number, total: number) => (total ? Math.round((parte / total) * 100) : 0);

const nomeTurma = (t: { ano: number; turma: string }) => `${t.ano}º ${t.turma}`;

function somaZona<T extends string>(
  niveis: NivelInfo<T>[],
  valores: Partial<Record<string, number>>,
  zona: Zona,
) {
  return niveis.filter((n) => n.zona === zona).reduce((s, n) => s + (valores[n.id] ?? 0), 0);
}

/** Barra empilhada: do nível mais baixo (esquerda) ao mais alto (direita). */
function BarraNiveis<T extends string>({
  niveis,
  valores,
  rotulo,
}: {
  niveis: NivelInfo<T>[];
  valores: Partial<Record<string, number>>;
  rotulo: string;
}) {
  const total = niveis.reduce((s, n) => s + (valores[n.id] ?? 0), 0);
  if (!total) return <p className="text-xs text-muted-foreground">Sem alunos avaliados.</p>;
  return (
    <div
      className="flex h-6 w-full overflow-hidden rounded-md bg-muted"
      role="img"
      aria-label={`${rotulo}: ${niveis.map((n) => `${n.nome} ${valores[n.id] ?? 0}`).join(", ")}`}
    >
      {niveis.map((n) => {
        const q = valores[n.id] ?? 0;
        if (!q) return null;
        return (
          <div
            key={n.id}
            className={`${n.cor} flex items-center justify-center text-[11px] font-semibold text-black/80`}
            style={{ width: `${(q / total) * 100}%` }}
            title={`${n.nome}: ${q} (${pct(q, total)}%)`}
          >
            {q}
          </div>
        );
      })}
    </div>
  );
}

function Legenda<T extends string>({ niveis }: { niveis: NivelInfo<T>[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {niveis.map((n) => (
        <li key={n.id} className="flex items-center gap-1.5">
          <span className={`inline-block size-3 rounded-sm ${n.cor}`} aria-hidden />
          <span>
            <strong className="text-foreground">{n.id}</strong> · {n.nome}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Indicador({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe: string }) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{rotulo}</p>
        <p className="text-2xl font-bold">{valor}</p>
        <p className="text-xs text-muted-foreground">{detalhe}</p>
      </CardContent>
    </Card>
  );
}

function leitoresAB(e: EvolucaoLeitura) {
  return pct(e.A + e.B, e.A + e.B + e.C + e.D + e.E);
}
function semLeituraDE(e: EvolucaoLeitura) {
  return pct(e.D + e.E, e.A + e.B + e.C + e.D + e.E);
}

function Seta({ de, para, bomQuandoSobe }: { de: number; para: number; bomQuandoSobe: boolean }) {
  const diff = para - de;
  if (diff === 0)
    return <ArrowRight className="size-4 text-muted-foreground" aria-label="sem mudança" />;
  const melhorou = bomQuandoSobe ? diff > 0 : diff < 0;
  const Icone = diff > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${melhorou ? "text-emerald-600" : "text-red-600"}`}
    >
      <Icone className="size-4" aria-hidden />
      {diff > 0 ? "+" : ""}
      {diff} p.p.
    </span>
  );
}

export function PainelMapaClasse({
  mostrarProfessor = true,
  semCabecalho = false,
}: {
  /** Na página pública o nome do professor não aparece ao lado dos resultados da turma. */
  mostrarProfessor?: boolean;
  /** A página que hospeda o painel já tem o título dela. */
  semCabecalho?: boolean;
} = {}) {
  const { turmas, evolucaoLeitura, bimestre } = MAPA_CLASSE_3_BIM;
  const [foco, setFoco] = useState<"leitura" | "escrita">("leitura");

  const geral = useMemo(() => {
    const leitura = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    for (const t of turmas)
      for (const k of Object.keys(leitura) as (keyof typeof leitura)[]) leitura[k] += t.leitura[k];
    const avaliadosLeitura = Object.values(leitura).reduce((a, b) => a + b, 0);
    const escritaPrioridade = turmas.reduce(
      (s, t) => s + somaZona(escritaDoAno(t.ano), t.escrita, "prioridade"),
      0,
    );
    const avaliadosEscrita = turmas.reduce((s, t) => s + t.avaliadosEscrita, 0);
    const primeiro = Object.values(evolucaoLeitura).map((l) => l.find((e) => e.bim === 1)!);
    const ultimo = Object.values(evolucaoLeitura).map((l) => l.find((e) => e.bim === 3)!);
    const soma = (lista: EvolucaoLeitura[]) =>
      lista.reduce(
        (a, e) => ({
          A: a.A + e.A,
          B: a.B + e.B,
          C: a.C + e.C,
          D: a.D + e.D,
          E: a.E + e.E,
          avaliados: 0,
          bim: 0,
        }),
        { A: 0, B: 0, C: 0, D: 0, E: 0, avaliados: 0, bim: 0 } as EvolucaoLeitura,
      );
    return {
      leitura,
      avaliadosLeitura,
      escritaPrioridade,
      avaliadosEscrita,
      ab1: leitoresAB(soma(primeiro)),
      ab3: leitoresAB(soma(ultimo)),
      de1: semLeituraDE(soma(primeiro)),
      de3: semLeituraDE(soma(ultimo)),
    };
  }, [turmas, evolucaoLeitura]);

  const prioridades = turmas
    .map((t) => ({
      t,
      leitura: t.leitura.D + t.leitura.E,
      escrita: somaZona(escritaDoAno(t.ano), t.escrita, "prioridade"),
    }))
    .sort((a, b) => b.leitura + b.escrita - (a.leitura + a.escrita));

  const divergencias = turmas.filter(
    (t) =>
      t.avaliadosLeitura !== t.avaliadosAbaLeitura ||
      Object.keys(t.escrita).some(
        (k) =>
          (t.escrita as Record<string, number>)[k] !==
          (t.totaisPlanilhaEscrita as Record<string, number>)[k],
      ),
  );

  return (
    <div className="space-y-6">
      <div>
        {semCabecalho ? null : (
          <h1 className="text-2xl font-bold">Mapa de classe · Escrita e leitura</h1>
        )}
        <p className="text-sm text-muted-foreground">
          {bimestre}º bimestre de 2026 · {instrumento("mapa").nome} (aplicação:{" "}
          {textoAplicacao(instrumento("mapa"))}) · modelo da Secretaria de Educação. Mostra quantos
          alunos estão em cada nível, por turma. Nenhum nome de aluno aparece nesta tela.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador
          rotulo="Leem com fluência ou pausadamente"
          valor={`${geral.ab3}%`}
          detalhe={`eram ${geral.ab1}% no 1º bimestre · ${geral.avaliadosLeitura} alunos avaliados`}
        />
        <Indicador
          rotulo="Só leem sílabas ou não leem"
          valor={`${pct(geral.leitura.D + geral.leitura.E, geral.avaliadosLeitura)}%`}
          detalhe={`eram ${geral.de1}% no 1º bimestre · ${geral.leitura.D + geral.leitura.E} alunos`}
        />
        <Indicador
          rotulo="Escrita em nível de prioridade"
          valor={`${pct(geral.escritaPrioridade, geral.avaliadosEscrita)}%`}
          detalhe={`${geral.escritaPrioridade} de ${geral.avaliadosEscrita} alunos avaliados`}
        />
        <Indicador
          rotulo="Turmas mapeadas"
          valor={`${turmas.length}`}
          detalhe="1º ao 5º ano, turmas A e B"
        />
      </div>

      <div className="flex gap-2" role="tablist" aria-label="Escolher o mapa">
        {(
          [
            ["leitura", "Leitura", BookOpenText],
            ["escrita", "Escrita", PenLine],
          ] as const
        ).map(([id, nome, Icone]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={foco === id}
            onClick={() => setFoco(id)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              foco === id
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card hover:bg-muted"
            }`}
          >
            <Icone className="size-4" aria-hidden />
            {nome}
          </button>
        ))}
      </div>

      {foco === "leitura" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mapa de leitura por turma</CardTitle>
            <Legenda niveis={LEITURA} />
          </CardHeader>
          <CardContent className="space-y-3">
            {turmas.map((t) => (
              <div
                key={`${t.ano}${t.turma}`}
                className="grid items-center gap-2 sm:grid-cols-[5rem_1fr_8rem]"
              >
                <span className="text-sm font-semibold">{nomeTurma(t)}</span>
                <BarraNiveis
                  niveis={LEITURA}
                  valores={t.leitura}
                  rotulo={`Leitura ${nomeTurma(t)}`}
                />
                <span className="text-xs text-muted-foreground">
                  {t.avaliadosLeitura} avaliados
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mapa de escrita por turma</CardTitle>
            <p className="text-xs text-muted-foreground">
              No 1º e 2º ano a escala mostra a hipótese de escrita; do 3º ao 5º, a quantidade de
              erros ortográficos.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              {
                titulo: "1º e 2º anos · hipótese de escrita",
                lista: turmas.filter((t) => t.ano <= 2),
              },
              {
                titulo: "3º ao 5º ano · erros ortográficos",
                lista: turmas.filter((t) => t.ano >= 3),
              },
            ].map((grupo) => {
              const niveis = escritaDoAno(grupo.lista[0]?.ano ?? 1);
              return (
                <div key={grupo.titulo} className="space-y-2">
                  <h3 className="text-sm font-semibold">{grupo.titulo}</h3>
                  <Legenda niveis={niveis} />
                  {grupo.lista.map((t) => (
                    <div
                      key={`${t.ano}${t.turma}`}
                      className="grid items-center gap-2 sm:grid-cols-[5rem_1fr_8rem]"
                    >
                      <span className="text-sm font-semibold">{nomeTurma(t)}</span>
                      <BarraNiveis
                        niveis={niveis}
                        valores={t.escrita}
                        rotulo={`Escrita ${nomeTurma(t)}`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {t.avaliadosEscrita} avaliados
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução da leitura: 1º, 2º e 3º bimestres</CardTitle>
          <p className="text-xs text-muted-foreground">
            Porcentagem de alunos que leem com fluência ou pausadamente (níveis A e B). O número de
            alunos avaliados mudou entre os bimestres, então compare as porcentagens, não as
            quantidades.
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3">Turma</th>
                <th className="pr-3">1º bim.</th>
                <th className="pr-3">2º bim.</th>
                <th className="pr-3">3º bim.</th>
                <th className="pr-3">Variação</th>
                <th>Alunos em D ou E (3º bim.)</th>
              </tr>
            </thead>
            <tbody>
              {turmas.map((t) => {
                const lista = evolucaoLeitura[`${t.ano}${t.turma}`] ?? [];
                const b = (n: number) => lista.find((e) => e.bim === n);
                const b1 = b(1);
                const b2 = b(2);
                const b3 = b(3);
                if (!b1 || !b2 || !b3) return null;
                return (
                  <tr key={`${t.ano}${t.turma}`} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">{nomeTurma(t)}</td>
                    <td className="pr-3">{leitoresAB(b1)}%</td>
                    <td className="pr-3">{leitoresAB(b2)}%</td>
                    <td className="pr-3 font-semibold">{leitoresAB(b3)}%</td>
                    <td className="pr-3">
                      <Seta de={leitoresAB(b1)} para={leitoresAB(b3)} bomQuandoSobe />
                    </td>
                    <td>
                      {b3.D + b3.E} ({semLeituraDE(b3)}%)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users2 className="size-4" aria-hidden /> Onde agir primeiro
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Turmas ordenadas pelo total de alunos em nível de prioridade: na leitura, os que só leem
            sílabas ou não leem; na escrita, os que estão nos níveis de prioridade de cada ano.
          </p>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            {prioridades.map(({ t, leitura, escrita }, i) => (
              <li
                key={`${t.ano}${t.turma}`}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1"
              >
                <span className="w-5 text-right font-semibold text-muted-foreground">{i + 1}.</span>
                <strong>{nomeTurma(t)}</strong>
                <span>
                  leitura: <strong>{leitura}</strong> aluno{leitura === 1 ? "" : "s"}
                </span>
                <span>
                  escrita: <strong>{escrita}</strong> aluno{escrita === 1 ? "" : "s"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {mostrarProfessor ? `Prof(a). ${t.professor}` : ""}
                  {mostrarProfessor && t.semRegistro > 0 ? " · " : ""}
                  {t.semRegistro > 0 ? `${t.semRegistro} sem registro` : ""}
                </span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Guia dos níveis e ações em sala</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { titulo: "Leitura", niveis: LEITURA },
            { titulo: "Escrita · 1º e 2º anos", niveis: escritaDoAno(1) },
            { titulo: "Escrita · 3º ao 5º ano", niveis: escritaDoAno(3) },
          ].map((g) => (
            <details key={g.titulo} className="rounded-lg border p-3">
              <summary className="cursor-pointer text-sm font-semibold">{g.titulo}</summary>
              <ul className="mt-3 space-y-3 text-sm">
                {[...g.niveis].reverse().map((n) => (
                  <li key={n.id} className="grid gap-1 sm:grid-cols-[11rem_1fr]">
                    <span className="flex items-center gap-2 font-medium">
                      <span className={`inline-block size-3 rounded-sm ${n.cor}`} aria-hidden />
                      {n.id} · {n.nome}
                    </span>
                    <span className="text-muted-foreground">
                      <em>{ZONAS[n.zona].nome}.</em> {n.significa}{" "}
                      <strong className="text-foreground">Ação:</strong> {n.acao}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="size-4" aria-hidden /> Sobre os dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Estes são os números do {bimestre}º bimestre. A evolução usa os quadros do 1º e do 2º
            bimestres da própria planilha, sempre rotulados. As folhas de cada turma não trazem o
            bimestre escrito; o que confirma que são do 3º é a conferência da leitura de cada turma
            com o quadro do 3º bimestre, que bate em 9 das 10 turmas (no 1º A há 1 aluno de
            diferença).
          </p>
          <p>
            As quantidades foram recontadas a partir das marcações de cada aluno na planilha do mapa
            de classe.
            {divergencias.length > 0
              ? ` Em ${divergencias.map(nomeTurma).join(", ")} a linha "Total" da planilha não bate com as marcações; vale a contagem das marcações.`
              : ""}
          </p>
          <p>
            O mapa de matemática (hipóteses de escrita numérica) está em branco na planilha, por
            isso não aparece aqui.
          </p>
          <p>
            Alunos sem nenhuma marcação aparecem como "sem registro" e não entram nos percentuais.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
