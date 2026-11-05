import { useMemo, useState } from "react";
import { BookOpenText, FileText, Search, Users2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProvaII } from "@/lib/diagnostica/tipos";
import { NOME_DISC } from "@/lib/diagnostica/tipos";

type RespostaHabilidade = {
  turma: string;
  ano: number;
  nome: string;
  habilidade: string;
  questao: number;
  correta: boolean;
};
type AlunoLeituraEscrita = {
  chave: string;
  nome: string;
  turma: string;
  ano: number;
  leitura: RespostaHabilidade[];
  escrita?: string;
};

const limpar = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function habilidadeDeLeitura(texto: string) {
  return /\b(ler|leitura|texto|informacao|finalidade|interpret|infer|localizar|ideia|genero|silaba|palavra|frase|sonor|fonema|rima|alfabet|compreens)/i.test(limpar(texto));
}

function linhasDosAlunos(provas: ProvaII[]): AlunoLeituraEscrita[] {
  const alunos = new Map<string, AlunoLeituraEscrita>();
  for (const prova of provas) {
    if (prova.disc !== "LP") continue;
    const questoes = Object.keys(prova.hab).map(Number).sort((a, b) => a - b);
    for (const aluno of prova.alunos) {
      const chave = `${prova.ano}|${prova.turma}|${aluno.nome.trim().toLocaleLowerCase("pt-BR")}`;
      const item = alunos.get(chave) ?? {
        chave,
        nome: aluno.nome,
        turma: prova.turma,
        ano: prova.ano,
        leitura: [],
      };
      if (aluno.esc) item.escrita = aluno.esc;
      questoes.forEach((questao, indice) => {
        const habilidade = prova.hab[String(questao)] ?? `Questão ${questao}`;
        if (!habilidadeDeLeitura(habilidade)) return;
        const resposta = [...(aluno.r ?? "")][indice];
        if (resposta == null || resposta === "-") return;
        item.leitura.push({
          turma: prova.turma,
          ano: prova.ano,
          nome: aluno.nome,
          habilidade,
          questao,
          correta: resposta === "C",
        });
      });
      alunos.set(chave, item);
    }
  }
  return [...alunos.values()].sort((a, b) =>
    a.ano - b.ano || a.turma.localeCompare(b.turma) || a.nome.localeCompare(b.nome),
  );
}

function faixaEscrita(ano: number, nivel?: string) {
  if (!nivel) return "Sem classificação registrada";
  if (ano <= 2 && (nivel === "A" || nivel === "B")) return "Escrita alfabética (A/B)";
  if (ano >= 3 && (nivel === "A" || nivel === "B")) return "Até quatro erros ortográficos (A/B)";
  return `Faixa ${nivel}`;
}

export function RelatorioLeituraEscrita({ provas }: { provas: ProvaII[] }) {
  const [turmaSelecionada, setTurmaSelecionada] = useState("todas");
  const [busca, setBusca] = useState("");
  const [alunoSelecionado, setAlunoSelecionado] = useState<string | null>(null);

  const alunos = useMemo(() => linhasDosAlunos(provas), [provas]);
  const turmas = useMemo(
    () => [...new Set(alunos.map((a) => `${a.ano}|${a.turma}`))].sort(),
    [alunos],
  );
  const filtrados = alunos.filter((a) =>
    (turmaSelecionada === "todas" || `${a.ano}|${a.turma}` === turmaSelecionada) &&
    (!busca || a.nome.toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR"))),
  );
  const respostas = filtrados.flatMap((a) => a.leitura);
  const acertos = respostas.filter((r) => r.correta).length;
  const erros = respostas.length - acertos;
  const comEscrita = filtrados.filter((a) => !!a.escrita);
  const alfabéticos = comEscrita.filter((a) =>
    a.ano <= 2 ? a.escrita === "A" || a.escrita === "B" : a.escrita === "A" || a.escrita === "B",
  ).length;

  const habilidades = useMemo(() => {
    const mapa = new Map<string, { texto: string; total: number; erros: number; alunos: Set<string> }>();
    for (const resposta of respostas) {
      const chave = limpar(resposta.habilidade).replace(/\s+/g, " ").trim();
      const item = mapa.get(chave) ?? {
        texto: resposta.habilidade,
        total: 0,
        erros: 0,
        alunos: new Set<string>(),
      };
      item.total += 1;
      if (!resposta.correta) {
        item.erros += 1;
        item.alunos.add(resposta.nome);
      }
      mapa.set(chave, item);
    }
    return [...mapa.values()].sort((a, b) =>
      b.erros / Math.max(1, b.total) - a.erros / Math.max(1, a.total),
    );
  }, [respostas]);

  const escritaPorFaixa = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const aluno of comEscrita) {
      const nivel = aluno.escrita ?? "Sem classificação";
      mapa.set(nivel, (mapa.get(nivel) ?? 0) + 1);
    }
    return [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [comEscrita]);

  const alunoAtivo = filtrados.find((a) => a.chave === alunoSelecionado) ?? null;

  if (alunos.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Ainda não há respostas individuais de Língua Portuguesa. Importe os dados da avaliação diagnóstica para gerar este relatório.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
              <BookOpenText className="size-4" /> Observatório pedagógico
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Leitura e escrita</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Identifique as habilidades de leitura com maior incidência de erros e consulte o registro de escrita de cada estudante.
            </p>
          </div>
          <label className="min-w-[190px] text-xs font-semibold text-muted-foreground">
            TURMA
            <select
              value={turmaSelecionada}
              onChange={(e) => { setTurmaSelecionada(e.target.value); setAlunoSelecionado(null); }}
              className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground"
            >
              <option value="todas">Todas as turmas</option>
              {turmas.map((t) => {
                const [ano, letra] = t.split("|");
                return <option key={t} value={t}>{ano}º ano {letra}</option>;
              })}
            </select>
          </label>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { nome: "Alunos no recorte", valor: filtrados.length, apoio: "com ou sem resposta" },
          { nome: "Respostas de leitura", valor: respostas.length, apoio: "questões respondidas" },
          { nome: "Acertos", valor: respostas.length ? `${Math.round(acertos / respostas.length * 100)}%` : "—", apoio: `${acertos} respostas corretas` },
          { nome: "Erros", valor: erros, apoio: "respostas que precisam ser retomadas" },
        ].map((k) => (
          <Card key={k.nome}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">{k.nome}</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums">{k.valor}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{k.apoio}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_.95fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpenText className="size-4 text-primary" /> Mapa de dificuldades de leitura
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Habilidades ordenadas pela proporção de erros. Selecione uma habilidade para localizar os estudantes.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {habilidades.length ? habilidades.map((h) => (
              <details key={limpar(h.texto)} className="group rounded-xl border border-border/70 p-3">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold leading-snug">{h.texto}</span>
                    <span className="shrink-0 text-sm font-extrabold tabular-nums text-rose-600">
                      {Math.round(h.erros / Math.max(1, h.total) * 100)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-rose-500" style={{ width: `${h.erros / Math.max(1, h.total) * 100}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{h.erros} erros em {h.total} respostas · {h.alunos.size} estudantes</p>
                </summary>
                <div className="mt-3 border-t border-border pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Alunos que erraram esta habilidade</p>
                  <p className="mt-1 text-sm leading-relaxed">{[...h.alunos].sort().join(", ") || "Nenhum erro registrado neste recorte."}</p>
                </div>
              </details>
            )) : <p className="text-sm text-muted-foreground">Nenhuma habilidade de leitura foi identificada nos dados disponíveis.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-primary" /> Panorama da escrita
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Distribuição dos níveis registrados na avaliação de Língua Portuguesa.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Com nível registrado</p>
                <p className="text-2xl font-bold">{comEscrita.length}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">A/B na escala</p>
                <p className="text-2xl font-bold">{comEscrita.length ? Math.round(alfabéticos / comEscrita.length * 100) : 0}%</p>
              </div>
            </div>
            <div className="space-y-2">
              {escritaPorFaixa.map(([nivel, n]) => (
                <div key={nivel}>
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="font-semibold">Nível {nivel}</span><b>{n} alunos</b>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${n / Math.max(1, comEscrita.length) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="rounded-xl border border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
              {filtrados.some((a) => a.ano <= 2)
                ? "No 1º e 2º ano, A/B representam escrita alfabética na escala de alfabetização."
                : "Do 3º ao 5º ano, A/B representam até quatro erros ortográficos. Consulte a rubrica da avaliação para interpretar as demais faixas."}
              {" "}A classificação disponível não substitui a análise da produção textual original.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><Users2 className="size-4 text-primary" /> Diagnóstico individual</CardTitle>
              <p className="text-xs text-muted-foreground">Abra um aluno para localizar acertos, lacunas de leitura e nível de escrita.</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar aluno..." className="w-full rounded-xl border border-input bg-background py-2 pl-9 pr-3 text-sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtrados.map((a) => {
            const taxa = a.leitura.length ? a.leitura.filter((r) => r.correta).length / a.leitura.length : null;
            const aberto = alunoAtivo?.chave === a.chave;
            return (
              <div key={a.chave} className="rounded-xl border border-border/70">
                <button type="button" onClick={() => setAlunoSelecionado(aberto ? null : a.chave)} aria-expanded={aberto} className="flex w-full flex-wrap items-center justify-between gap-3 p-3 text-left transition hover:bg-muted/40">
                  <span className="min-w-0"><b className="block truncate text-sm">{a.nome}</b><span className="text-xs text-muted-foreground">{a.ano}º ano {a.turma} · {a.leitura.length} questões de leitura respondidas</span></span>
                  <span className="text-right"><b className="text-sm tabular-nums">{taxa == null ? "Sem dado" : `${Math.round(taxa * 100)}% leitura`}</b><span className="block text-xs text-muted-foreground">{a.escrita ? `Escrita: ${a.escrita}` : "Escrita sem classificação"}</span></span>
                </button>
                {aberto && (
                  <div className="space-y-3 border-t border-border p-4">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      <div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Acertos leitura</p><b className="text-xl">{a.leitura.filter((r) => r.correta).length}</b></div>
                      <div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Erros leitura</p><b className="text-xl">{a.leitura.filter((r) => !r.correta).length}</b></div>
                      <div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Nível de escrita</p><b className="text-xl">{a.escrita ?? "—"}</b></div>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Habilidades que precisam ser retomadas</p>
                    {a.leitura.filter((r) => !r.correta).length ? (
                      <ul className="list-disc space-y-1 pl-5 text-sm">
                        {a.leitura.filter((r) => !r.correta).map((r) => <li key={r.questao}>{r.habilidade}</li>)}
                      </ul>
                    ) : <p className="text-sm text-emerald-700 dark:text-emerald-300">Nenhum erro de leitura registrado nas questões respondidas.</p>}
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Interpretação do registro de escrita</p>
                      <p className="mt-1 text-sm">{faixaEscrita(a.ano, a.escrita)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Para identificar problemas de coesão, coerência, estrutura, pontuação e construção de frases, é necessário registrar e avaliar o texto produzido pelo aluno com uma rubrica específica.</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtrados.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nenhum aluno encontrado com esse filtro.</p>}
        </CardContent>
      </Card>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Fonte: respostas individuais da II Avaliação Diagnóstica 2026 (Português). A I Avaliação possui resultados agregados por turma, não respostas individuais. O relatório não inventa diagnósticos para questões não respondidas; para evolução bimestral real, cada nova aplicação deverá ser registrada com seu bimestre e data.
      </p>
    </div>
  );
}
