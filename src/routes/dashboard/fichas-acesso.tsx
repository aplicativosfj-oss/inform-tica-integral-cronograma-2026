import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Protected } from "@/components/school/protected";
import { useAppStore } from "@/lib/app-store";
import { obterOuCriarPin } from "@/lib/aluno-area";
import { alunosDoApoio, senhaApoio, senhaProfessor } from "@/lib/profissional-acesso";
import { supabase } from "@/lib/supabase-client";
import type { Aluno, Turma } from "@/lib/types";

export const Route = createFileRoute("/dashboard/fichas-acesso")({
  validateSearch: (search: Record<string, unknown>): { turma?: string } =>
    typeof search["turma"] === "string" ? { turma: search["turma"] } : {},
  component: AcessosPage,
  head: () => ({
    meta: [
      { title: "Fichas de acesso · Agenda de Informática" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

/** Uma folha impressa: um profissional, sua senha e as senhas dos seus alunos. */
interface Ficha {
  chave: string;
  turma: Turma;
  nome: string;
  funcao: string;
  area: string;
  caminho: string;
  senha: string;
  alunos: Aluno[];
}

function montarFichas(turmas: Turma[]): Ficha[] {
  return turmas.flatMap((turma) => {
    const ordenados = [...turma.alunos].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    const professor: Ficha = {
      chave: `${turma.id}-prof`,
      turma,
      nome: turma.professorRegente,
      funcao: "Professor(a) regente",
      area: "Espaço do Professor",
      caminho: "/professor",
      senha: senhaProfessor(turma),
      alunos: ordenados,
    };
    const apoios: Ficha[] = (turma.apoioEspecial ?? []).map((apoio, indice) => ({
      chave: `${turma.id}-apoio-${indice}`,
      turma,
      nome: apoio.nome,
      funcao: apoio.funcao,
      area: "Espaço do Mediador",
      caminho: "/mediador",
      senha: senhaApoio(turma, indice),
      alunos: alunosDoApoio(turma, indice),
    }));
    return [professor, ...apoios];
  });
}

/**
 * PINs dos alunos: lê de uma vez os que já existem e só cria (como o resto
 * do sistema faz) os que faltam. Roda na sessão de quem está logado no
 * painel — a tabela de PINs não é legível sem login.
 */
async function carregarPins(turmas: Turma[]): Promise<Map<string, string>> {
  const ids = turmas.map((t) => t.id);
  const { data, error } = await supabase
    .from("aluno_pins")
    .select("aluno_id, pin")
    .in("turma_id", ids);
  if (error) throw error;
  const pins = new Map<string, string>(
    ((data ?? []) as { aluno_id: string; pin: string }[]).map((r) => [r.aluno_id, r.pin]),
  );
  for (const turma of turmas) {
    for (const aluno of turma.alunos) {
      if (!pins.has(aluno.id)) pins.set(aluno.id, await obterOuCriarPin(aluno.id, turma.id));
    }
  }
  return pins;
}

function AcessosPage() {
  const { turma: turmaId } = Route.useSearch();
  const { turmas, config, isReady } = useAppStore();
  const [pins, setPins] = useState<Map<string, string> | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const selecionadas = useMemo(
    () => (turmaId ? turmas.filter((t) => t.id === turmaId) : turmas),
    [turmas, turmaId],
  );
  const fichas = useMemo(() => montarFichas(selecionadas), [selecionadas]);
  const site = typeof window === "undefined" ? "" : window.location.origin;

  useEffect(() => {
    if (!isReady || selecionadas.length === 0) return;
    let cancelado = false;
    setPins(null);
    carregarPins(selecionadas)
      .then((p) => !cancelado && setPins(p))
      .catch((e: Error) => !cancelado && setErro(e.message));
    return () => {
      cancelado = true;
    };
  }, [isReady, selecionadas]);

  const titulo =
    turmaId && selecionadas[0]
      ? `${selecionadas[0].serie} "${selecionadas[0].letra}"`
      : "todas as turmas";

  return (
    <Protected>
      <div className="min-h-screen bg-muted/40 print:bg-white">
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur print:hidden sm:px-6">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard/turmas">
                <ArrowLeft className="size-4" /> Turmas
              </Link>
            </Button>
            <div>
              <p className="font-semibold">Fichas de acesso · {titulo}</p>
              <p className="text-xs text-muted-foreground">
                {fichas.length} {fichas.length === 1 ? "ficha" : "fichas"} — uma página por
                profissional. Para PDF, escolha “Salvar como PDF” na janela de impressão.
              </p>
            </div>
          </div>
          <Button onClick={() => window.print()} disabled={!pins}>
            <Printer className="size-4" /> Imprimir / salvar PDF
          </Button>
        </div>

        {erro ? (
          <p className="p-6 text-sm text-destructive">Não foi possível carregar os PINs: {erro}</p>
        ) : !pins ? (
          <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Preparando as fichas…
          </p>
        ) : (
          <div className="mx-auto flex max-w-[210mm] flex-col gap-6 py-6 print:block print:max-w-none print:gap-0 print:py-0">
            {fichas.map((f) => (
              <article
                key={f.chave}
                className="break-after-page bg-white p-[14mm] text-slate-900 shadow-md print:shadow-none"
                style={{ minHeight: "297mm" }}
              >
                <header className="flex items-start justify-between gap-4 border-b-2 border-blue-700 pb-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
                      Agenda de Informática
                    </p>
                    <p className="text-sm font-medium">{config.nomeEscola}</p>
                  </div>
                  <p className="rounded border border-rose-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-700">
                    Confidencial · uso pessoal
                  </p>
                </header>

                <section className="mt-6">
                  <p className="text-sm text-slate-500">
                    {f.funcao} · {f.turma.serie} &ldquo;{f.turma.letra}&rdquo;
                  </p>
                  <h1 className="text-2xl font-bold">{f.nome}</h1>
                </section>

                <section className="mt-5 grid grid-cols-[1fr_auto] items-center gap-6 rounded-lg border border-slate-300 bg-slate-50 p-5">
                  <div className="text-sm leading-relaxed">
                    <p className="font-semibold">Como acessar o {f.area}</p>
                    <ol className="mt-1 list-decimal pl-5 text-slate-700">
                      <li>
                        Abra{" "}
                        <span className="font-mono font-semibold">
                          {site}
                          {f.caminho}
                        </span>
                      </li>
                      <li>
                        Escolha a turma {f.turma.serie} &ldquo;{f.turma.letra}&rdquo;
                        {f.caminho === "/mediador" ? " e o seu nome" : ""}.
                      </li>
                      <li>Digite a sua senha de 4 dígitos.</li>
                    </ol>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Sua senha
                    </p>
                    <p className="font-mono text-4xl font-bold tracking-[0.3em] text-blue-800">
                      {f.senha}
                    </p>
                  </div>
                </section>

                <section className="mt-6">
                  <h2 className="text-base font-semibold">
                    {f.caminho === "/mediador" ? "Alunos que você acompanha" : "Alunos da turma"}{" "}
                    <span className="font-normal text-slate-500">
                      — PIN da Área do Aluno ({site}/aluno)
                    </span>
                  </h2>
                  {f.alunos.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">
                      Nenhum aluno vinculado. Fale com a coordenação.
                    </p>
                  ) : (
                    <table className="mt-2 w-full border-collapse text-[12.5px]">
                      <thead>
                        <tr className="bg-slate-100 text-left">
                          <th className="w-8 border border-slate-300 px-2 py-1">#</th>
                          <th className="border border-slate-300 px-2 py-1">Aluno(a)</th>
                          <th className="w-20 border border-slate-300 px-2 py-1 text-center">
                            PIN
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {f.alunos.map((a, i) => (
                          <tr key={a.id} className="break-inside-avoid">
                            <td className="border border-slate-300 px-2 py-[3px] text-slate-500">
                              {i + 1}
                            </td>
                            <td className="border border-slate-300 px-2 py-[3px]">{a.nome}</td>
                            <td className="border border-slate-300 px-2 py-[3px] text-center font-mono font-semibold tracking-widest">
                              {pins.get(a.id) ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </section>

                <footer className="mt-6 border-t border-slate-200 pt-2 text-[10.5px] leading-snug text-slate-500">
                  Não compartilhe estas senhas. Entregue a cada aluno apenas o próprio PIN. Se um
                  PIN vazar ou for esquecido, a coordenação gera outro no painel. Emitido em{" "}
                  {new Date().toLocaleDateString("pt-BR")}.
                </footer>
              </article>
            ))}
          </div>
        )}
      </div>
    </Protected>
  );
}
