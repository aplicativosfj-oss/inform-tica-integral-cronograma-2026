import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  Info,
  PenLine,
  Users2,
  ChevronRight,
  Loader2,
  FileText,
  ArrowLeft,
  Printer,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase-client";
import { MAPA_CLASSE_3_BIM } from "@/lib/mapa-classe/dados-3bim";
import { LEITURA, ZONAS, escritaDoAno, type NivelInfo, type Zona } from "@/lib/mapa-classe/niveis";
import type { EvolucaoLeitura, TurmaMapa } from "@/lib/mapa-classe/tipos";

type AreaMapa = "leitura" | "escrita";
type RegistroMapaAluno = {
  id: string;
  aluno_id: string;
  aluno_nome: string;
  ano: number;
  turma: string;
  bimestre: number;
  area: AreaMapa;
  nivel: string;
  data_avaliacao: string | null;
  observacoes: string | null;
  evidencia: string | null;
};

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
  interativa = false,
  aoSelecionar,
}: {
  niveis: NivelInfo<T>[];
  valores: Partial<Record<string, number>>;
  rotulo: string;
  interativa?: boolean;
  aoSelecionar?: (nivel: NivelInfo<T>) => void;
}) {
  const total = niveis.reduce((s, n) => s + (valores[n.id] ?? 0), 0);
  if (!total) return <p className="text-xs text-muted-foreground">Sem alunos avaliados.</p>;
  return (
    <div
      className="flex h-6 w-full overflow-hidden rounded-md bg-muted"
      role={interativa ? "group" : "img"}
      aria-label={`${rotulo}: ${niveis.map((n) => `${n.nome} ${valores[n.id] ?? 0}`).join(", ")}`}
    >
      {niveis.map((n) => {
        const q = valores[n.id] ?? 0;
        if (!q) return null;
        return interativa ? (
            <button
              key={n.id}
              type="button"
              onClick={() => aoSelecionar?.(n)}
              className={`${n.cor} flex min-w-0 items-center justify-center text-[11px] font-semibold text-black/80 transition hover:brightness-90 focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground`}
              style={{ width: `${(q / total) * 100}%` }}
              title={`Abrir ${n.nome}: ${q} alunos (${pct(q, total)}%)`}
              aria-label={`Abrir ${q} alunos no nível ${n.id} — ${n.nome}`}
            >
              {q}
            </button>
          ) : (
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
  permitirDetalhesIndividuais = false,
}: {
  /** Na página pública o nome do professor não aparece ao lado dos resultados da turma. */
  mostrarProfessor?: boolean;
  /** A página que hospeda o painel já tem o título dela. */
  semCabecalho?: boolean;
  /** Libera consulta de dados identificáveis somente no painel autenticado. */
  permitirDetalhesIndividuais?: boolean;
} = {}) {
  const { turmas, evolucaoLeitura } = MAPA_CLASSE_3_BIM;
  const [bimestreSelecionado, setBimestreSelecionado] = useState<1 | 2 | 3>(3);
  const [compararDe, setCompararDe] = useState<1 | 2 | 3>(1);
  const [compararPara, setCompararPara] = useState<1 | 2 | 3>(3);
  const [foco, setFoco] = useState<"leitura" | "escrita">("leitura");
  const escritaDisponivel = bimestreSelecionado === 3;
  const turmasDoBimestre = useMemo(() => turmas.map((t) => {
    const historico = evolucaoLeitura[`${t.ano}${t.turma}`]?.find((e) => e.bim === bimestreSelecionado);
    if (!historico) return { ...t, leitura: { A: 0, B: 0, C: 0, D: 0, E: 0 }, avaliadosLeitura: 0, avaliadosAbaLeitura: 0 };
    return { ...t, leitura: { A: historico.A, B: historico.B, C: historico.C, D: historico.D, E: historico.E }, avaliadosLeitura: historico.avaliados, avaliadosAbaLeitura: historico.avaliados };
  }), [turmas, evolucaoLeitura, bimestreSelecionado]);
  const [faixaSelecionada, setFaixaSelecionada] = useState<{
    ano: number; turma: string; area: AreaMapa; nivel: string; nomeNivel: string; acao: string; total: number;
  } | null>(null);
  const [alunosDaFaixa, setAlunosDaFaixa] = useState<RegistroMapaAluno[]>([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<RegistroMapaAluno | null>(null);
  const [historicoAluno, setHistoricoAluno] = useState<RegistroMapaAluno[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

  useEffect(() => {
    if (!faixaSelecionada || !permitirDetalhesIndividuais) return;
    let ativo = true;
    setCarregandoAlunos(true);
    setAlunoSelecionado(null);
    setAlunosDaFaixa([]);
    supabase.from("mapa_classe_avaliacoes_individuais").select("*")
      .eq("ano", faixaSelecionada.ano).eq("turma", faixaSelecionada.turma)
      .eq("bimestre", bimestreSelecionado).eq("area", faixaSelecionada.area)
      .eq("nivel", faixaSelecionada.nivel).order("aluno_nome", { ascending: true })
      .then(({ data, error }) => {
        if (!ativo) return;
        if (error) {
          toast.error(/mapa_classe_avaliacoes_individuais|does not exist|schema cache|42P01|PGRST205/i.test(error.message)
            ? "Execute o SQL de registros individuais do Mapa de Classe no Supabase."
            : "Não foi possível carregar os alunos: " + error.message);
        } else setAlunosDaFaixa((data ?? []) as RegistroMapaAluno[]);
        setCarregandoAlunos(false);
      });
    return () => { ativo = false; };
  }, [faixaSelecionada, bimestreSelecionado, permitirDetalhesIndividuais]);

  useEffect(() => {
    if (!alunoSelecionado) return;
    let ativo = true;
    setCarregandoHistorico(true);
    supabase.from("mapa_classe_avaliacoes_individuais").select("*")
      .eq("aluno_id", alunoSelecionado.aluno_id).order("bimestre", { ascending: true })
      .then(({ data, error }) => {
        if (!ativo) return;
        if (error) toast.error("Não foi possível carregar o histórico individual: " + error.message);
        else setHistoricoAluno((data ?? []) as RegistroMapaAluno[]);
        setCarregandoHistorico(false);
      });
    return () => { ativo = false; };
  }, [alunoSelecionado]);

  const geral = useMemo(() => {
    const leitura = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    for (const t of turmasDoBimestre)
      for (const k of Object.keys(leitura) as (keyof typeof leitura)[]) leitura[k] += t.leitura[k];
    const avaliadosLeitura = Object.values(leitura).reduce((a, b) => a + b, 0);
    const escritaPrioridade = escritaDisponivel ? turmas.reduce((s, t) => s + somaZona(escritaDoAno(t.ano), t.escrita, "prioridade"), 0) : 0;
    const avaliadosEscrita = escritaDisponivel ? turmas.reduce((s, t) => s + t.avaliadosEscrita, 0) : 0;
    const soma = (lista: EvolucaoLeitura[]) => lista.reduce((a, e) => ({ A: a.A + e.A, B: a.B + e.B, C: a.C + e.C, D: a.D + e.D, E: a.E + e.E, avaliados: a.avaliados + e.avaliados, bim: bimestreSelecionado }), { A: 0, B: 0, C: 0, D: 0, E: 0, avaliados: 0, bim: bimestreSelecionado } as EvolucaoLeitura);
    const selecionados = Object.values(evolucaoLeitura).map((lista) => lista.find((e) => e.bim === bimestreSelecionado)).filter((e): e is EvolucaoLeitura => Boolean(e));
    const agregado = soma(selecionados);
    return { leitura, avaliadosLeitura, escritaPrioridade, avaliadosEscrita, ab: leitoresAB(agregado) };
  }, [turmas, turmasDoBimestre, evolucaoLeitura, bimestreSelecionado, escritaDisponivel]);

  const prioridades = turmasDoBimestre.map((t) => ({
    t,
    leitura: t.leitura.D + t.leitura.E,
    escrita: escritaDisponivel ? somaZona(escritaDoAno(t.ano), t.escrita, "prioridade") : null,
  })).sort((a, b) => b.leitura + (b.escrita ?? 0) - (a.leitura + (a.escrita ?? 0)));

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
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Mapa de classe de 2026 · dados agregados por turma. Nenhum nome de aluno aparece nesta tela.
            {escritaDisponivel ? " Escrita e leitura disponíveis para o 3º bimestre." : " Para este bimestre, há histórico de leitura; os dados de escrita ainda não foram disponibilizados."}
          </p>
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span>BIMESTRE</span>
            <select value={bimestreSelecionado} onChange={(e) => setBimestreSelecionado(Number(e.target.value) as 1 | 2 | 3)} className="rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold text-foreground">
              <option value={1}>1º bimestre</option><option value={2}>2º bimestre</option><option value={3}>3º bimestre</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador
          rotulo="Leem com fluência ou pausadamente"
          valor={`${geral.ab}%`}
          detalhe={`${bimestreSelecionado}º bimestre · ${geral.avaliadosLeitura} alunos avaliados`}
        />
        <Indicador
          rotulo="Só leem sílabas ou não leem"
          valor={`${pct(geral.leitura.D + geral.leitura.E, geral.avaliadosLeitura)}%`}
          detalhe={`${geral.leitura.D + geral.leitura.E} alunos · ${bimestreSelecionado}º bimestre`}
        />
        <Indicador
          rotulo="Escrita em nível de prioridade"
          valor={escritaDisponivel ? `${pct(geral.escritaPrioridade, geral.avaliadosEscrita)}%` : "—"}
          detalhe={escritaDisponivel ? `${geral.escritaPrioridade} de ${geral.avaliadosEscrita} alunos avaliados` : "Sem dados históricos de escrita para este bimestre"}
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
            {turmasDoBimestre.map((t) => (
              <div
                key={`${t.ano}${t.turma}`}
                className="grid items-center gap-2 sm:grid-cols-[5rem_1fr_8rem]"
              >
                <span className="text-sm font-semibold">{nomeTurma(t)}</span>
                <BarraNiveis
                  niveis={LEITURA}
                  valores={t.leitura}
                  rotulo={`Leitura ${nomeTurma(t)}`}
                  interativa={permitirDetalhesIndividuais}
                  aoSelecionar={(nivel) => setFaixaSelecionada({
                    ano: t.ano, turma: t.turma, area: "leitura", nivel: nivel.id,
                    nomeNivel: nivel.nome, acao: nivel.acao, total: t.leitura[nivel.id] ?? 0,
                  })}
                />
                <span className="text-xs text-muted-foreground">
                  {t.avaliadosLeitura} avaliados
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : !escritaDisponivel ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <Info className="size-7 text-muted-foreground" />
            <h3 className="font-semibold">Dados de escrita ainda não disponíveis</h3>
            <p className="max-w-xl text-sm text-muted-foreground">
              O histórico disponível contém a distribuição de leitura dos 1º e 2º bimestres, mas a planilha de escrita corresponde somente ao 3º bimestre. Selecione o 3º bimestre para consultar essa métrica. Não exibimos dados de outro período como se fossem atuais.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mapa de escrita por turma · 3º bimestre</CardTitle>
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
                        interativa={permitirDetalhesIndividuais}
                        aoSelecionar={(nivel) => setFaixaSelecionada({
                          ano: t.ano, turma: t.turma, area: "escrita", nivel: nivel.id,
                          nomeNivel: nivel.nome, acao: nivel.acao, total: t.escrita[nivel.id] ?? 0,
                        })}
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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <CardTitle className="text-base">Comparação entre bimestres</CardTitle>
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold transition hover:bg-muted print:hidden"><Printer className="size-4" /> Exportar relatório PDF</button>
          </div>
          <p className="text-xs text-muted-foreground">Compare a evolução da leitura entre dois períodos. A variação considera a proporção de alunos nos níveis A e B; aumento indica avanço nessa dimensão.</p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><span>DE</span>
              <select value={compararDe} onChange={(e) => setCompararDe(Number(e.target.value) as 1 | 2 | 3)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"><option value={1}>1º bimestre</option><option value={2}>2º bimestre</option><option value={3}>3º bimestre</option></select>
            </label><span className="text-xs text-muted-foreground">→</span>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><span>PARA</span>
              <select value={compararPara} onChange={(e) => setCompararPara(Number(e.target.value) as 1 | 2 | 3)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"><option value={1}>1º bimestre</option><option value={2}>2º bimestre</option><option value={3}>3º bimestre</option></select>
            </label>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(() => {
            const somar = (bim: number) => Object.values(evolucaoLeitura).reduce((acc, lista) => {
              const e = lista.find((item) => item.bim === bim);
              if (!e) return acc;
              return { A: acc.A + e.A, B: acc.B + e.B, C: acc.C + e.C, D: acc.D + e.D, E: acc.E + e.E, avaliados: acc.avaliados + e.avaliados };
            }, { A: 0, B: 0, C: 0, D: 0, E: 0, avaliados: 0 });
            const inicio = somar(compararDe);
            const fim = somar(compararPara);
            const percentualInicio = pct(inicio.A + inicio.B, inicio.avaliados);
            const percentualFim = pct(fim.A + fim.B, fim.avaliados);
            const variacao = percentualFim - percentualInicio;
            return (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">{compararDe}º bimestre · níveis A e B</p><p className="mt-1 text-2xl font-bold">{percentualInicio}%</p><p className="text-xs text-muted-foreground">{inicio.avaliados} avaliados</p></div>
                  <div className="rounded-xl border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">{compararPara}º bimestre · níveis A e B</p><p className="mt-1 text-2xl font-bold">{percentualFim}%</p><p className="text-xs text-muted-foreground">{fim.avaliados} avaliados</p></div>
                  <div className="rounded-xl border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Variação no período</p><p className={`mt-1 text-2xl font-bold ${variacao > 0 ? "text-emerald-600" : variacao < 0 ? "text-red-600" : "text-foreground"}`}>{variacao > 0 ? "+" : ""}{variacao} p.p.</p><p className="text-xs text-muted-foreground">{variacao > 0 ? "Avanço na proporção de leitores A/B" : variacao < 0 ? "Queda na proporção de leitores A/B" : "Sem alteração percentual"}</p></div>
                </div>
                <div className="overflow-x-auto"><table className="w-full min-w-[34rem] text-sm">
                  <thead><tr className="border-b text-left text-muted-foreground"><th className="py-2 pr-3">Turma</th><th className="pr-3">{compararDe}º bim.</th><th className="pr-3">{compararPara}º bim.</th><th className="pr-3">Variação</th><th>Situação</th></tr></thead>
                  <tbody>
                    {turmas.map((t) => {
                      const lista = evolucaoLeitura[String(t.ano) + t.turma] ?? [];
                      const a = lista.find((e) => e.bim === compararDe);
                      const b = lista.find((e) => e.bim === compararPara);
                      if (!a || !b) return null;
                      const pa = leitoresAB(a); const pb = leitoresAB(b); const delta = pb - pa;
                      return <tr key={String(t.ano) + t.turma} className="border-b last:border-0"><td className="py-2 pr-3 font-semibold">{nomeTurma(t)}</td><td className="pr-3">{pa}% <span className="text-xs text-muted-foreground">({a.avaliados})</span></td><td className="pr-3 font-semibold">{pb}% <span className="text-xs font-normal text-muted-foreground">({b.avaliados})</span></td><td className="pr-3"><Seta de={pa} para={pb} bomQuandoSobe /></td><td><span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${delta > 0 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : delta < 0 ? "bg-red-500/10 text-red-700 dark:text-red-300" : "bg-muted text-muted-foreground"}`}>{delta > 0 ? "Avanço" : delta < 0 ? "Regressão" : "Estável"}</span></td></tr>;
                    })}
                  </tbody>
                </table></div>
                <p className="text-xs text-muted-foreground">Os números entre parênteses indicam a quantidade de alunos avaliados em cada período. Como esse total pode mudar, a comparação usa percentuais e não apenas quantidades absolutas.</p>
              </>
            );
          })()}
        </CardContent>
      </Card>
      <section className="mapa-print-root hidden print:block">
        <div className="border-b-2 border-slate-800 pb-4"><p className="text-xs font-bold uppercase tracking-widest text-slate-600">Relatório pedagógico · leitura</p><h1 className="mt-2 text-2xl font-bold text-slate-950">Comparativo de desempenho por bimestre</h1><p className="mt-1 text-sm text-slate-600">Período: {compararDe}º para {compararPara}º bimestre · Ano letivo 2026</p><p className="mt-1 text-xs text-slate-500">Indicador: proporção de estudantes nos níveis A e B. Os totais avaliados podem variar entre aplicações.</p></div>
        {(() => {
          const somar = (bim: number) => Object.values(evolucaoLeitura).reduce((acc, lista) => { const e = lista.find((item) => item.bim === bim); if (!e) return acc; return { A: acc.A + e.A, B: acc.B + e.B, C: acc.C + e.C, D: acc.D + e.D, E: acc.E + e.E, avaliados: acc.avaliados + e.avaliados }; }, { A: 0, B: 0, C: 0, D: 0, E: 0, avaliados: 0 });
          const inicio = somar(compararDe); const fim = somar(compararPara); const pa = pct(inicio.A + inicio.B, inicio.avaliados); const pb = pct(fim.A + fim.B, fim.avaliados);
          return <div className="mt-5 grid grid-cols-3 gap-3 text-slate-900"><div className="rounded-lg border p-3"><p className="text-xs text-slate-500">{compararDe}º bimestre</p><p className="text-2xl font-bold">{pa}%</p><p className="text-xs text-slate-500">{inicio.avaliados} avaliados</p></div><div className="rounded-lg border p-3"><p className="text-xs text-slate-500">{compararPara}º bimestre</p><p className="text-2xl font-bold">{pb}%</p><p className="text-xs text-slate-500">{fim.avaliados} avaliados</p></div><div className="rounded-lg border p-3"><p className="text-xs text-slate-500">Variação</p><p className="text-2xl font-bold">{pb > pa ? "+" : ""}{pb - pa} p.p.</p><p className="text-xs text-slate-500">{pb > pa ? "Avanço" : pb < pa ? "Regressão" : "Estável"}</p></div></div>;
        })()}
        <h2 className="mb-2 mt-6 text-base font-bold text-slate-900">Resultado por turma</h2>
        <table className="w-full border-collapse text-sm text-slate-900"><thead><tr className="border-b-2 border-slate-700 text-left"><th className="p-2">Turma</th><th className="p-2">{compararDe}º bim.</th><th className="p-2">{compararPara}º bim.</th><th className="p-2">Variação</th><th className="p-2">Situação</th></tr></thead>
          <tbody>{turmas.map((t) => { const lista = evolucaoLeitura[String(t.ano) + t.turma] ?? []; const a = lista.find((e) => e.bim === compararDe); const b = lista.find((e) => e.bim === compararPara); if (!a || !b) return null; const pa = leitoresAB(a); const pb = leitoresAB(b); const d = pb - pa; return <tr key={String(t.ano) + t.turma} className="border-b"><td className="p-2 font-semibold">{nomeTurma(t)}</td><td className="p-2">{pa}% · {a.avaliados}</td><td className="p-2">{pb}% · {b.avaliados}</td><td className="p-2">{d > 0 ? "+" : ""}{d} p.p.</td><td className="p-2">{d > 0 ? "Avanço" : d < 0 ? "Regressão" : "Estável"}</td></tr>; })}</tbody></table>
        <div className="mt-5 rounded-lg border p-3 text-xs leading-relaxed text-slate-600"><strong className="text-slate-800">Como interpretar:</strong> variação positiva indica aumento da proporção de alunos nos níveis A e B; variação negativa indica redução. Os números após o percentual representam estudantes avaliados em cada bimestre. Este relatório usa dados agregados por turma e não identifica estudantes.</div>
        <p className="mt-6 text-[10px] text-slate-400">Relatório gerado a partir dos dados disponíveis no Mapa de Classe · 2026</p>
      </section>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users2 className="size-4" aria-hidden /> Por onde começar
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Turmas ordenadas pela quantidade de alunos em prioridade na leitura do bimestre selecionado.
            {escritaDisponivel ? " A escrita considera os dados disponíveis do 3º bimestre." : " A escrita não entra na ordenação porque não há dados históricos para este bimestre."}
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
                  escrita: <strong>{escrita == null ? "sem dados" : escrita}</strong>{escrita == null ? "" : ` aluno${escrita === 1 ? "" : "s"}`}
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
          <CardTitle className="text-base">
            O que cada nível significa e o que fazer em sala
          </CardTitle>
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
            <Info className="size-4" aria-hidden /> De onde vêm esses números
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            A leitura exibida corresponde ao {bimestreSelecionado}º bimestre, selecionado acima. A série histórica permite consultar separadamente os três períodos. Os dados de escrita e as contagens detalhadas de escrita são do 3º bimestre.
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
            Alunos sem nenhuma marcação aparecem como "sem registro" e ficam de fora dos
            percentuais.
          </p>
        </CardContent>
      </Card>
      {permitirDetalhesIndividuais && (
        <>
          <Dialog open={!!faixaSelecionada} onOpenChange={(v) => { if (!v) { setFaixaSelecionada(null); setAlunoSelecionado(null); } }}>
            <DialogContent className="max-h-[88dvh] max-w-2xl overflow-y-auto">
              <DialogHeader><DialogTitle>{faixaSelecionada ? `${nomeTurma(faixaSelecionada)} · ${faixaSelecionada.area === "leitura" ? "Leitura" : "Escrita"}` : "Alunos"}</DialogTitle>
                <DialogDescription>{faixaSelecionada ? `Nível ${faixaSelecionada.nivel} · ${faixaSelecionada.nomeNivel} · ${faixaSelecionada.total} aluno(s)` : ""}</DialogDescription></DialogHeader>
              {faixaSelecionada && <div className="rounded-xl bg-muted/50 p-3"><p className="text-sm font-semibold">O que este nível significa</p><p className="mt-1 text-sm text-muted-foreground">{faixaSelecionada.acao}</p></div>}
              {carregandoAlunos ? <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Buscando alunos...</div>
                : alunosDaFaixa.length ? <div className="space-y-2"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Selecione um aluno para abrir o relatório individual</p>
                  {alunosDaFaixa.map((aluno) => <button key={aluno.id} type="button" onClick={() => setAlunoSelecionado(aluno)} className="flex w-full items-center justify-between rounded-xl border border-border p-3 text-left transition hover:border-primary/50 hover:bg-muted/40"><span><b className="block text-sm">{aluno.aluno_nome}</b><span className="text-xs text-muted-foreground">{aluno.ano}º {aluno.turma} · Nível {aluno.nivel} · {aluno.area === "leitura" ? "Leitura" : "Escrita"}</span></span><ChevronRight className="size-4 text-muted-foreground" /></button>)}
                </div> : <div className="rounded-xl border border-dashed border-border p-5 text-center"><Users2 className="mx-auto size-7 text-muted-foreground" /><p className="mt-2 text-sm font-semibold">Os dados atuais mostram apenas totais por turma.</p><p className="mt-1 text-xs text-muted-foreground">Ainda não há registros individuais importados para esta faixa. Importe ou cadastre os níveis individuais no banco privado; os nomes não serão inferidos.</p></div>}
            </DialogContent>
          </Dialog>
          <Dialog open={!!alunoSelecionado} onOpenChange={(v) => { if (!v) setAlunoSelecionado(null); }}>
            <DialogContent className="max-h-[88dvh] max-w-2xl overflow-y-auto">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="size-5 text-primary" /> Relatório individual</DialogTitle><DialogDescription>{alunoSelecionado?.aluno_nome} · {alunoSelecionado?.ano}º {alunoSelecionado?.turma}</DialogDescription></DialogHeader>
              {alunoSelecionado && <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Área</p><p className="mt-1 font-bold">{alunoSelecionado.area === "leitura" ? "Leitura" : "Escrita"}</p></div><div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Nível atual</p><p className="mt-1 font-bold">{alunoSelecionado.nivel}</p></div></div>
                <div className="rounded-xl border p-3"><p className="text-sm font-semibold">Observações do professor</p><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{alunoSelecionado.observacoes || "Nenhuma observação registrada."}</p></div>
                <div className="rounded-xl border p-3"><p className="text-sm font-semibold">Evidências</p><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{alunoSelecionado.evidencia || "Nenhuma evidência registrada."}</p></div>
                <section><h3 className="mb-2 text-sm font-bold">Histórico bimestral de leitura e escrita</h3>{carregandoHistorico ? <p className="text-sm text-muted-foreground">Carregando histórico...</p> : historicoAluno.length ? <div className="space-y-2">{historicoAluno.map((r) => <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border p-3"><div><p className="text-sm font-semibold">{r.bimestre}º bimestre · {r.area === "leitura" ? "Leitura" : "Escrita"}</p><p className="text-xs text-muted-foreground">{r.data_avaliacao ? new Date(r.data_avaliacao + "T12:00:00").toLocaleDateString("pt-BR") : "Data não informada"}</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold">Nível {r.nivel}</span></div>)}</div> : <p className="text-sm text-muted-foreground">Sem histórico adicional.</p>}</section>
                <div className="flex flex-wrap gap-2 print:hidden">
                  <button type="button" onClick={() => { const limpar = () => { document.body.classList.remove("print-aluno-mapa"); window.removeEventListener("afterprint", limpar); }; document.body.classList.add("print-aluno-mapa"); window.addEventListener("afterprint", limpar); window.print(); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"><Printer className="size-4" /> Exportar ficha individual PDF</button>
                  <button type="button" onClick={() => setAlunoSelecionado(null)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><ArrowLeft className="size-4" /> Voltar à lista</button>
                </div>
              </div>}
            </DialogContent>
          </Dialog>
          {alunoSelecionado && <section className="mapa-aluno-print hidden">
            <header className="border-b-2 border-slate-800 pb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-600">Acompanhamento pedagógico · documento individual</p>
              <h1 className="mt-2 text-2xl font-bold text-slate-950">{alunoSelecionado.aluno_nome}</h1>
              <p className="mt-1 text-sm text-slate-600">{alunoSelecionado.ano}º ano · Turma {alunoSelecionado.turma} · Ano letivo 2026</p>
            </header>
            <div className="mt-5 grid grid-cols-2 gap-3 text-slate-900">
              <div className="rounded-lg border p-3"><p className="text-xs text-slate-500">Área avaliada</p><p className="mt-1 font-bold">{alunoSelecionado.area === "leitura" ? "Leitura" : "Escrita"}</p></div>
              <div className="rounded-lg border p-3"><p className="text-xs text-slate-500">Nível do registro selecionado</p><p className="mt-1 font-bold">{alunoSelecionado.nivel}</p></div>
              <div className="rounded-lg border p-3"><p className="text-xs text-slate-500">Bimestre do registro</p><p className="mt-1 font-bold">{alunoSelecionado.bimestre}º bimestre</p></div>
              <div className="rounded-lg border p-3"><p className="text-xs text-slate-500">Data da avaliação</p><p className="mt-1 font-bold">{alunoSelecionado.data_avaliacao ? new Date(alunoSelecionado.data_avaliacao + "T12:00:00").toLocaleDateString("pt-BR") : "Não informada"}</p></div>
            </div>
            <section className="mt-6"><h2 className="mb-2 text-base font-bold text-slate-900">Histórico bimestral</h2>
              {historicoAluno.length ? <table className="w-full border-collapse text-sm text-slate-900"><thead><tr className="border-b-2 text-left"><th className="p-2">Bimestre</th><th className="p-2">Área</th><th className="p-2">Nível</th><th className="p-2">Data</th></tr></thead><tbody>{historicoAluno.map((r) => <tr key={r.id} className="border-b"><td className="p-2">{r.bimestre}º</td><td className="p-2">{r.area === "leitura" ? "Leitura" : "Escrita"}</td><td className="p-2 font-semibold">{r.nivel}</td><td className="p-2">{r.data_avaliacao ? new Date(r.data_avaliacao + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</td></tr>)}</tbody></table> : <p className="text-sm text-slate-600">Não há outros registros históricos disponíveis.</p>}
            </section>
            <section className="mt-6"><h2 className="text-base font-bold text-slate-900">Observações do professor</h2><p className="mt-2 whitespace-pre-wrap rounded-lg border p-3 text-sm text-slate-700">{alunoSelecionado.observacoes || "Nenhuma observação registrada."}</p></section>
            <section className="mt-4"><h2 className="text-base font-bold text-slate-900">Evidências registradas</h2><p className="mt-2 whitespace-pre-wrap rounded-lg border p-3 text-sm text-slate-700">{alunoSelecionado.evidencia || "Nenhuma evidência registrada."}</p></section>
            <p className="mt-8 border-t pt-3 text-xs text-slate-500">Documento confidencial para acompanhamento pedagógico. Elaborado exclusivamente com os registros existentes no sistema; campos sem informação não foram presumidos.</p>
          </section>}
        </>
<style>{'@media print { @page { size: A4 portrait; margin: 16mm; } body * { visibility: hidden !important; } .mapa-print-root, .mapa-print-root *, .mapa-aluno-print, .mapa-aluno-print * { visibility: visible !important; } .mapa-print-root { display: block !important; position: absolute; inset: 0 auto auto 0; width: 100%; background: white !important; color: #0f172a !important; } .mapa-aluno-print { display: none !important; } body.print-aluno-mapa .mapa-print-root { display: none !important; } body.print-aluno-mapa .mapa-aluno-print { display: block !important; position: absolute; inset: 0 auto auto 0; width: 100%; background: white !important; color: #0f172a !important; } .mapa-print-root tr, .mapa-aluno-print tr { page-break-inside: avoid; } }'}</style>

    </div>
  );
}
