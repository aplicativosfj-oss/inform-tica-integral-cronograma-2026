import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookHeart,
  Check,
  FileDown,
  FileText,
  Lightbulb,
  PencilLine,
  Plus,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NavBar } from "@/components/school/nav-bar";
import { SiteFooter } from "@/components/school/site-footer";
import { useAppStore } from "@/lib/app-store";
import { ESPECIALIDADES, especialidadeDoCadastro, type Especialidade } from "@/lib/especialidades";
import { alunosDoApoio, idadeEmAnos } from "@/lib/profissional-acesso";
import { temSessaoDeApoio } from "@/lib/profissional-session";
import type { Aluno } from "@/lib/types";
import { cn } from "@/lib/utils";
import fundoInclusaoImg from "@/assets/feature-kids-learning.jpg";
import { agoraNaEscola } from "@/lib/schedule-engine";

export const Route = createFileRoute("/mediador/$turmaId/$apoioIndex/relatorio")({
  validateSearch: (search: Record<string, unknown>): { aluno?: string } =>
    typeof search["aluno"] === "string" ? { aluno: search["aluno"] } : {},
  component: RelatorioPage,
  head: () => ({
    meta: [
      { title: "Relatório de acompanhamento · Espaço do Mediador" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const NIVEIS = ["Precisa de muito apoio", "Com apoio", "Com pouco apoio", "Com autonomia"];
const INDICADORES = [
  "Atenção e concentração",
  "Comunicação",
  "Interação com colegas e adultos",
  "Autonomia nas tarefas",
  "Uso do computador (mouse e teclado)",
] as const;

type CampoTexto =
  | "contexto"
  | "potencialidades"
  | "desafios"
  | "comunicacao"
  | "estrategias"
  | "evolucao"
  | "recomendacoes"
  | "olhar";

const CAMPOS: { id: CampoTexto; titulo: string; ajuda: string }[] = [
  {
    id: "contexto",
    titulo: "Apresentação da criança",
    ajuda: "Quem é a criança, como chega à escola, do que gosta, como se relaciona com a rotina.",
  },
  {
    id: "potencialidades",
    titulo: "Potencialidades",
    ajuda: "O que a criança faz bem, interesses, conquistas — comece sempre pelo que ela já sabe.",
  },
  {
    id: "desafios",
    titulo: "Desafios observados",
    ajuda: "Descreva situações concretas (o quê, quando, como), sem rótulos ou julgamentos.",
  },
  {
    id: "comunicacao",
    titulo: "Comunicação, interação e comportamento",
    ajuda: "Como se expressa, como pede ajuda, como reage a mudanças e aos colegas.",
  },
  {
    id: "estrategias",
    titulo: "Estratégias e adaptações utilizadas",
    ajuda: "O que você fez para apoiar e o que funcionou (ou não).",
  },
  {
    id: "evolucao",
    titulo: "Evolução no período",
    ajuda: "O que mudou desde o início do acompanhamento.",
  },
  {
    id: "recomendacoes",
    titulo: "Recomendações e próximos passos",
    ajuda: "Sugestões para a escola, o professor regente e a família.",
  },
  {
    id: "olhar",
    titulo: "O olhar do profissional",
    ajuda:
      "Sua percepção cuidadosa e afetiva sobre a criança — o que só quem acompanha de perto vê.",
  },
];

interface Relatorio {
  periodo: string;
  especialidadeId: string;
  indicadores: Record<string, number>;
  textos: Record<CampoTexto, string>;
}

function relatorioVazio(aluno: Aluno | undefined): Relatorio {
  const hoje = agoraNaEscola();
  return {
    periodo: `${hoje.toLocaleDateString("pt-BR", { month: "long" })} de ${hoje.getFullYear()}`,
    especialidadeId: especialidadeDoCadastro(aluno?.especialidade)?.id ?? "",
    indicadores: {},
    textos: {
      contexto: "",
      potencialidades: "",
      desafios: "",
      comunicacao: "",
      estrategias: "",
      evolucao: "",
      recomendacoes: "",
      olhar: "",
    },
  };
}

/** O rascunho fica só neste aparelho: é dado sensível de criança, não vai para o banco. */
function chaveRascunho(turmaId: string, alunoId: string) {
  return `relatorio-apoio:${turmaId}:${alunoId}`;
}

function lerRascunho(chave: string): Relatorio | null {
  try {
    const bruto = window.localStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as Relatorio) : null;
  } catch {
    return null;
  }
}

function RelatorioPage() {
  const { turmaId, apoioIndex } = Route.useParams();
  const { aluno: alunoParam } = Route.useSearch();
  const indice = Number(apoioIndex);
  const navigate = useNavigate();
  const { turmas, config } = useAppStore();

  const turma = turmas.find((t) => t.id === turmaId);
  const apoio = turma?.apoioEspecial?.[indice];
  const criancas = useMemo(() => (turma ? alunosDoApoio(turma, indice) : []), [turma, indice]);
  const [alunoId, setAlunoId] = useState<string | undefined>(alunoParam);
  const aluno = criancas.find((c) => c.id === alunoId) ?? criancas[0];

  const [rel, setRel] = useState<Relatorio>(() => relatorioVazio(aluno));
  const [aba, setAba] = useState<"editar" | "documento">("editar");
  const [salvoEm, setSalvoEm] = useState<Date | null>(null);

  useEffect(() => {
    if (!temSessaoDeApoio(turmaId, indice)) navigate({ to: "/mediador" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaId, indice]);

  // Troca de criança: carrega o rascunho dela (ou um relatório novo).
  useEffect(() => {
    if (!aluno) return;
    setRel(lerRascunho(chaveRascunho(turmaId, aluno.id)) ?? relatorioVazio(aluno));
    setSalvoEm(null);
  }, [aluno?.id, turmaId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Salvamento automático do rascunho.
  useEffect(() => {
    if (!aluno) return;
    const id = window.setTimeout(() => {
      try {
        window.localStorage.setItem(chaveRascunho(turmaId, aluno.id), JSON.stringify(rel));
        setSalvoEm(new Date());
      } catch {
        /* armazenamento indisponível: segue sem rascunho */
      }
    }, 600);
    return () => window.clearTimeout(id);
  }, [rel, aluno, turmaId]);

  const especialidade = ESPECIALIDADES.find((e) => e.id === rel.especialidadeId);

  function setTexto(campo: CampoTexto, valor: string) {
    setRel((r) => ({ ...r, textos: { ...r.textos, [campo]: valor } }));
  }
  function inserir(campo: CampoTexto, frase: string) {
    setRel((r) => {
      const atual = r.textos[campo].trim();
      return { ...r, textos: { ...r.textos, [campo]: atual ? `${atual}\n${frase}` : frase } };
    });
    toast.success("Sugestão inserida — ajuste com as suas palavras.");
  }

  function exportarPdf() {
    setAba("documento");
    // Espera o documento aparecer antes de abrir a impressão.
    window.setTimeout(() => window.print(), 150);
  }

  async function compartilhar() {
    if (!aluno || !turma || !apoio) return;
    const texto = montarTexto(
      rel,
      aluno,
      turma.serie,
      turma.letra,
      apoio.nome,
      apoio.funcao,
      especialidade,
    );
    const titulo = `Relatório de acompanhamento — ${aluno.nome}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: titulo, text: texto });
        return;
      }
      await navigator.clipboard.writeText(texto);
      toast.success("Relatório copiado. Cole no e-mail ou na mensagem para a coordenação.");
    } catch (err) {
      if ((err as Error).name !== "AbortError") toast.error("Não foi possível compartilhar.");
    }
  }

  if (!turma || !apoio) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <p className="p-10 text-center text-sm text-muted-foreground">
          Profissional não encontrado.
        </p>
      </div>
    );
  }

  const idade = idadeEmAnos(aluno?.nascimento);

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <div className="print:hidden">
        <NavBar />
      </div>

      {/* Destaque com imagem de fundo */}
      <section className="relative overflow-hidden print:hidden">
        <img
          src={fundoInclusaoImg}
          alt=""
          aria-hidden
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-violet-950/95 via-fuchsia-900/80 to-rose-800/40" />
        <div className="relative mx-auto max-w-6xl px-4 py-8 text-white sm:px-6 sm:py-10">
          <Link
            to="/mediador/$turmaId/$apoioIndex"
            params={{ turmaId, apoioIndex }}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white"
          >
            <ArrowLeft className="size-4" /> Voltar para minha área
          </Link>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-fuchsia-200">
            <BookHeart className="size-4" /> Atendimento educacional especializado
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            Relatório de acompanhamento
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
            Um documento profissional sobre a criança que você acompanha: especialidade, desafios,
            potencialidades e o seu olhar cuidadoso. Com guia de especialidades, exportação em PDF e
            compartilhamento.
          </p>

          {criancas.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {criancas.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setAlunoId(c.id)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium ring-1 transition-colors",
                    c.id === aluno?.id
                      ? "bg-white text-violet-900 ring-white"
                      : "bg-white/10 text-white ring-white/30 hover:bg-white/20",
                  )}
                >
                  {c.nome}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {!aluno ? (
        <p className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground sm:px-6">
          Nenhuma criança vinculada a você nesta turma. Fale com a coordenação.
        </p>
      ) : (
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 print:max-w-none print:p-0">
          {/* Barra de ações */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="inline-flex rounded-lg border border-border bg-card p-1">
              {(
                [
                  ["editar", "Escrever", PencilLine],
                  ["documento", "Ver documento", FileText],
                ] as const
              ).map(([id, rotulo, Icone]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAba(id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    aba === id ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  <Icone className="size-4" /> {rotulo}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {salvoEm ? (
                  <span className="flex items-center gap-1">
                    <Check className="size-3.5 text-emerald-500" /> Rascunho salvo neste aparelho
                  </span>
                ) : null}
              </span>
              <Button variant="outline" onClick={compartilhar}>
                <Share2 className="size-4" /> Compartilhar
              </Button>
              <Button
                onClick={exportarPdf}
                className="bg-violet-700 text-white hover:bg-violet-800"
              >
                <FileDown className="size-4" /> Exportar PDF
              </Button>
            </div>
          </div>

          {aba === "editar" ? (
            <div className="grid gap-6 print:hidden lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="flex flex-col gap-4">
                {/* Identificação */}
                <section className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-card to-card p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                    Identificação
                  </p>
                  <p className="mt-1 text-xl font-bold text-foreground">{aluno.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {turma.serie} &ldquo;{turma.letra}&rdquo; ·{" "}
                    {idade !== null ? `${idade} anos` : "idade não informada"} · Prof(a). regente{" "}
                    {turma.professorRegente}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="periodo">Período do relatório</Label>
                      <Input
                        id="periodo"
                        value={rel.periodo}
                        onChange={(e) => setRel((r) => ({ ...r, periodo: e.target.value }))}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="especialidade">Especialidade</Label>
                      <select
                        id="especialidade"
                        value={rel.especialidadeId}
                        onChange={(e) => setRel((r) => ({ ...r, especialidadeId: e.target.value }))}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">Selecione…</option>
                        {ESPECIALIDADES.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.sigla ? `${e.sigla} — ` : ""}
                            {e.nome}
                          </option>
                        ))}
                      </select>
                      {aluno.especialidade ? (
                        <p className="text-xs text-muted-foreground">
                          No cadastro da escola: {aluno.especialidade}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </section>

                {/* Indicadores */}
                <section className="rounded-2xl border border-border/60 bg-card p-5">
                  <p className="text-sm font-semibold text-foreground">
                    Indicadores de desenvolvimento
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Marque o nível de apoio que a criança precisa hoje em cada área.
                  </p>
                  <div className="mt-3 flex flex-col gap-3">
                    {INDICADORES.map((ind) => (
                      <div key={ind}>
                        <p className="mb-1.5 text-sm text-foreground">{ind}</p>
                        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                          {NIVEIS.map((nivel, i) => (
                            <button
                              key={nivel}
                              type="button"
                              onClick={() =>
                                setRel((r) => ({
                                  ...r,
                                  indicadores: { ...r.indicadores, [ind]: i },
                                }))
                              }
                              className={cn(
                                "rounded-lg border px-2 py-1.5 text-xs transition-colors",
                                rel.indicadores[ind] === i
                                  ? "border-violet-500 bg-violet-500/15 font-semibold text-violet-700 dark:text-violet-200"
                                  : "border-border/70 text-muted-foreground hover:bg-muted",
                              )}
                            >
                              {nivel}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {CAMPOS.map((campo) => (
                  <section
                    key={campo.id}
                    className={cn(
                      "rounded-2xl border bg-card p-5",
                      campo.id === "olhar"
                        ? "border-rose-500/40 bg-gradient-to-br from-rose-500/10 via-card to-card"
                        : "border-border/60",
                    )}
                  >
                    <Label htmlFor={campo.id} className="text-sm font-semibold">
                      {campo.titulo}
                    </Label>
                    <p className="mb-2 text-xs text-muted-foreground">{campo.ajuda}</p>
                    <Textarea
                      id={campo.id}
                      rows={campo.id === "olhar" ? 6 : 4}
                      value={rel.textos[campo.id]}
                      onChange={(e) => setTexto(campo.id, e.target.value)}
                    />
                  </section>
                ))}
              </div>

              {/* Guia da especialidade */}
              <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
                <GuiaEspecialidade especialidade={especialidade} onInserir={inserir} />
                <div className="flex gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-muted-foreground">
                  <ShieldCheck className="size-4 shrink-0 text-emerald-500" />
                  <p>
                    O rascunho fica guardado só neste aparelho. Dados de saúde da criança são
                    sigilosos: compartilhe o documento apenas com a coordenação, o professor regente
                    e a família.
                  </p>
                </div>
              </aside>
            </div>
          ) : null}

          {/* Documento (visível na aba "Ver documento" e sempre na impressão) */}
          <div className={cn(aba === "documento" ? "block" : "hidden print:block")}>
            <Documento
              rel={rel}
              aluno={aluno}
              turmaNome={`${turma.serie} "${turma.letra}"`}
              regente={turma.professorRegente}
              escola={config.nomeEscola}
              profissional={apoio.nome}
              funcao={apoio.funcao}
              especialidade={especialidade}
              idade={idade}
            />
          </div>
        </main>
      )}

      <div className="print:hidden">
        <SiteFooter />
      </div>
    </div>
  );
}

function GuiaEspecialidade({
  especialidade,
  onInserir,
}: {
  especialidade: Especialidade | undefined;
  onInserir: (campo: CampoTexto, frase: string) => void;
}) {
  if (!especialidade) {
    return (
      <div className="rounded-2xl border border-dashed border-violet-500/40 bg-violet-500/5 p-5 text-sm text-muted-foreground">
        <p className="flex items-center gap-2 font-semibold text-foreground">
          <Lightbulb className="size-4 text-amber-400" /> Guia de especialidades
        </p>
        <p className="mt-1">
          Escolha a especialidade para ver características, estratégias e sugestões de texto.
        </p>
      </div>
    );
  }
  const blocos: [string, string[]][] = [
    ["Características frequentes", especialidade.caracteristicas],
    ["Estratégias em sala", especialidade.estrategias],
    ["No laboratório de informática", especialidade.noLaboratorio],
  ];
  const sugestoes: [CampoTexto, string, string[]][] = [
    ["potencialidades", "Potencialidades", especialidade.sugestoes.potencialidades],
    ["desafios", "Desafios", especialidade.sugestoes.desafios],
    ["recomendacoes", "Recomendações", especialidade.sugestoes.recomendacoes],
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-violet-500/30 bg-card">
      <div className="bg-gradient-to-r from-violet-700 to-fuchsia-700 px-5 py-3 text-white">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/80">
          <Lightbulb className="size-4" /> Guia da especialidade
        </p>
        <p className="font-bold">
          {especialidade.sigla ? `${especialidade.sigla} · ` : ""}
          {especialidade.nome}
        </p>
      </div>
      <div className="flex flex-col gap-3 p-5 text-sm">
        <p className="text-muted-foreground">{especialidade.resumo}</p>
        {blocos.map(([titulo, itens]) => (
          <div key={titulo}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground">
              {titulo}
            </p>
            <ul className="list-disc space-y-0.5 pl-4 text-muted-foreground">
              {itens.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        ))}
        {sugestoes.some(([, , f]) => f.length > 0) ? (
          <div className="border-t border-border/60 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground">
              Sugestões de texto
            </p>
            <div className="flex flex-col gap-2">
              {sugestoes.flatMap(([campo, rotulo, frases]) =>
                frases.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => onInserir(campo, f)}
                    className="flex items-start gap-2 rounded-lg border border-border/60 p-2 text-left text-xs text-muted-foreground transition-colors hover:border-violet-500/50 hover:bg-violet-500/5"
                  >
                    <Plus className="mt-0.5 size-3.5 shrink-0 text-violet-700 dark:text-violet-300" />
                    <span>
                      <strong className="text-foreground">{rotulo}:</strong> {f}
                    </span>
                  </button>
                )),
              )}
            </div>
          </div>
        ) : null}
        <p className="text-[11px] text-muted-foreground/80">
          Material de orientação pedagógica. Não substitui laudo nem avaliação clínica.
        </p>
      </div>
    </div>
  );
}

function Documento({
  rel,
  aluno,
  turmaNome,
  regente,
  escola,
  profissional,
  funcao,
  especialidade,
  idade,
}: {
  rel: Relatorio;
  aluno: Aluno;
  turmaNome: string;
  regente: string;
  escola: string;
  profissional: string;
  funcao: string;
  especialidade: Especialidade | undefined;
  idade: number | null;
}) {
  const preenchidos = CAMPOS.filter((c) => rel.textos[c.id].trim());
  return (
    <article className="mx-auto max-w-[210mm] bg-white p-[16mm] text-[13px] leading-relaxed text-slate-900 shadow-xl print:max-w-none print:p-0 print:shadow-none">
      <header className="border-b-2 border-violet-700 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-700">
          Relatório de acompanhamento · Atendimento educacional especializado
        </p>
        <p className="text-sm font-medium">{escola}</p>
      </header>

      <table className="mt-4 w-full border-collapse text-[12.5px]">
        <tbody>
          {[
            ["Criança", aluno.nome],
            ["Turma", `${turmaNome} · Prof(a). regente ${regente}`],
            ["Idade", idade !== null ? `${idade} anos` : "Não informada"],
            [
              "Especialidade",
              especialidade
                ? `${especialidade.sigla ? `${especialidade.sigla} — ` : ""}${especialidade.nome}`
                : (aluno.especialidade ?? "Não informada"),
            ],
            ["Profissional", `${profissional} (${funcao})`],
            ["Período", rel.periodo],
          ].map(([k, v]) => (
            <tr key={k}>
              <th className="w-36 border border-slate-300 bg-slate-100 px-2 py-1 text-left font-semibold">
                {k}
              </th>
              <td className="border border-slate-300 px-2 py-1">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {Object.keys(rel.indicadores).length > 0 ? (
        <section className="mt-5 break-inside-avoid">
          <h2 className="mb-1.5 text-sm font-bold text-violet-800">
            Indicadores de desenvolvimento
          </h2>
          <table className="w-full border-collapse text-[12px]">
            <tbody>
              {INDICADORES.filter((i) => rel.indicadores[i] !== undefined).map((ind) => {
                const n = rel.indicadores[ind] ?? 0;
                return (
                  <tr key={ind}>
                    <td className="w-1/2 border border-slate-300 px-2 py-1">{ind}</td>
                    <td className="border border-slate-300 px-2 py-1">
                      <span className="mr-2 inline-flex gap-0.5 align-middle">
                        {NIVEIS.map((_, i) => (
                          <span
                            key={i}
                            className={cn(
                              "inline-block h-2 w-5 rounded-sm",
                              i <= n ? "bg-violet-600" : "bg-slate-200",
                            )}
                          />
                        ))}
                      </span>
                      {NIVEIS[n]}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : null}

      {preenchidos.length === 0 ? (
        <p className="mt-6 text-slate-500">
          Ainda não há texto no relatório. Volte à aba “Escrever” para preenchê-lo.
        </p>
      ) : (
        preenchidos.map((c) => (
          <section key={c.id} className="mt-5 break-inside-avoid">
            <h2 className="mb-1 text-sm font-bold text-violet-800">{c.titulo}</h2>
            <p className="whitespace-pre-line text-justify">{rel.textos[c.id]}</p>
          </section>
        ))
      )}

      <footer className="mt-12 grid grid-cols-2 gap-10 text-center text-[12px]">
        <div className="border-t border-slate-400 pt-1">
          {profissional}
          <br />
          <span className="text-slate-500">{funcao}</span>
        </div>
        <div className="border-t border-slate-400 pt-1">
          Coordenação pedagógica
          <br />
          <span className="text-slate-500">{agoraNaEscola().toLocaleDateString("pt-BR")}</span>
        </div>
      </footer>
      <p className="mt-6 text-center text-[10px] text-slate-500">
        Documento de uso interno e sigiloso. Contém informações sobre a saúde e o desenvolvimento de
        uma criança — compartilhe apenas com a equipe escolar e a família.
      </p>
    </article>
  );
}

/** Versão em texto, para compartilhar por mensagem ou e-mail. */
function montarTexto(
  rel: Relatorio,
  aluno: Aluno,
  serie: string,
  letra: string,
  profissional: string,
  funcao: string,
  especialidade: Especialidade | undefined,
): string {
  const linhas = [
    `RELATÓRIO DE ACOMPANHAMENTO`,
    `Criança: ${aluno.nome} · ${serie} "${letra}"`,
    `Especialidade: ${especialidade?.nome ?? aluno.especialidade ?? "não informada"}`,
    `Profissional: ${profissional} (${funcao})`,
    `Período: ${rel.periodo}`,
    "",
  ];
  const ind = INDICADORES.filter((i) => rel.indicadores[i] !== undefined);
  if (ind.length) {
    linhas.push("INDICADORES");
    for (const i of ind) linhas.push(`- ${i}: ${NIVEIS[rel.indicadores[i] ?? 0]}`);
    linhas.push("");
  }
  for (const c of CAMPOS) {
    const t = rel.textos[c.id].trim();
    if (t) linhas.push(c.titulo.toUpperCase(), t, "");
  }
  return linhas.join("\n");
}
