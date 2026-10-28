import { Clock3, History, MonitorSmartphone, Square, Trash2, Users2 } from "lucide-react";
import { toast } from "sonner";

import fotoLaboratorio from "@/assets/laboratorio-informatica-turma.jpg";
import { PalcoGrupo } from "@/components/school/laboratorio/palco-grupo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TABELA_AUSENTE,
  agruparSessoes,
  encerrarGrupo,
  estadoDaSessao,
  historico24h,
  hojeNaEscola,
  horaNaEscola,
  nomeExibido,
  removerGrupo,
  textoRestante,
  useAgora,
  type GrupoLab,
  type SessaoLab,
} from "@/lib/laboratorio";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";

export interface DadosLab {
  sessoes: SessaoLab[];
  /** Faltas e impedimentos registrados (não contam como ida). */
  ausencias?: SessaoLab[];
  erro: string | null;
  carregando: boolean;
  recarregar: () => Promise<void>;
}

function Etiqueta({ rotulo }: { rotulo: string }) {
  const cor = serieClasses(serieIndexPorNumero(rotulo));
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${cor.bg} ${cor.text}`}
    >
      {rotulo}
    </span>
  );
}

function CartaoGrupo({
  g,
  agora,
  logado,
  aoMudar,
}: {
  g: GrupoLab;
  agora: number;
  logado: boolean;
  aoMudar: () => void;
}) {
  const ini = new Date(g.inicio).getTime();
  const fim = new Date(g.fim).getTime();
  const aoVivo = ini <= agora;
  const pctPassado = aoVivo ? Math.min(100, Math.max(0, ((agora - ini) / (fim - ini)) * 100)) : 0;

  async function agir(acao: "encerrar" | "remover") {
    try {
      if (acao === "encerrar") await encerrarGrupo(g.grupoId);
      else await removerGrupo(g.grupoId);
      toast.success(acao === "encerrar" ? "Grupo encerrado." : "Marcação removida.");
      aoMudar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível concluir.");
    }
  }

  return (
    <div
      className={`rounded-xl border p-3 ${aoVivo ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-muted/30"}`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Etiqueta rotulo={g.turmaRotulo} />
        <span className="flex items-center gap-1 text-sm font-semibold">
          <Clock3 className="size-3.5" aria-hidden />
          {horaNaEscola(g.inicio)} – {horaNaEscola(g.fim)}
        </span>
        {aoVivo ? (
          <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600">
            <span className="size-1.5 animate-pulse rounded-full bg-white" aria-hidden />
            faltam {textoRestante(fim - agora)}
          </Badge>
        ) : (
          <Badge variant="secondary">entra em {textoRestante(ini - agora)}</Badge>
        )}
        {logado ? (
          <span className="ml-auto flex gap-1">
            <Button size="sm" variant="outline" onClick={() => void agir("encerrar")}>
              <Square className="size-3.5" /> {aoVivo ? "Encerrar agora" : "Cancelar"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Remover marcação"
              onClick={() => void agir("remover")}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </span>
        ) : null}
      </div>
      {aoVivo ? (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
          <div
            className="h-full bg-emerald-500 transition-[width] duration-1000"
            style={{ width: `${pctPassado}%` }}
          />
        </div>
      ) : null}
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {g.alunos.map((a) => (
          <li key={a.id} className="rounded-full border bg-background px-2.5 py-1 text-sm">
            {nomeExibido(a.nome, logado)}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Painel ao vivo: quem está no laboratório agora, quem vem em seguida e quem
 * já passou hoje. Público; só quem está logado vê os botões de encerrar.
 */
export function PainelLaboratorioAgora({
  dados,
  logado,
  rolar = false,
}: {
  dados: DadosLab;
  logado: boolean;
  /** Limita a altura à janela e rola por dentro, para a seção caber numa tela. */
  rolar?: boolean;
}) {
  const agora = useAgora(1000);
  const hoje = hojeNaEscola();
  const doDia = dados.sessoes.filter((s) => s.data === hoje);
  const grupos = agruparSessoes(doDia);
  const estado = (g: GrupoLab) => estadoDaSessao(g, agora);
  const aoVivo = grupos.filter((g) => estado(g) === "ao-vivo");
  const proximos = grupos.filter((g) => estado(g) === "agendada");
  const historico = historico24h(dados.sessoes, agora);
  const alunosAgora = new Set(aoVivo.flatMap((g) => g.alunos.map((a) => a.id))).size;

  return (
    <Card id="laboratorio-agora" className="scroll-mt-28">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <MonitorSmartphone className="size-5 text-primary" aria-hidden /> No laboratório agora
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <Users2 className="size-3.5" aria-hidden /> {alunosAgora} aluno
              {alunosAgora === 1 ? "" : "s"}
            </Badge>
            <span className="text-sm tabular-nums text-muted-foreground">
              {horaNaEscola(agora)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent
        className={`space-y-4 ${rolar ? "lg:max-h-[calc(100svh-16rem)] lg:min-h-32 lg:overflow-y-auto" : ""}`}
      >
        {dados.erro === TABELA_AUSENTE ? (
          logado ? (
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              O controle do laboratório ainda não foi ligado ao banco. Abra o Supabase, vá em{" "}
              <strong>SQL Editor</strong>, cole o arquivo <code>supabase/laboratorio.sql</code> e
              clique em <strong>RUN</strong>. Depois é só atualizar esta página.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Estamos preparando o painel do laboratório. Volte daqui a pouquinho!
            </p>
          )
        ) : dados.erro ? (
          <p className="text-sm text-muted-foreground">
            Não deu para atualizar agora, mas já já a gente tenta de novo.
          </p>
        ) : dados.carregando ? (
          <div className="h-16 animate-pulse rounded-xl bg-muted" />
        ) : (
          <>
            {aoVivo.length === 0 ? (
              <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                Ninguém no laboratório agora. A próxima turma já pode chegar!
              </p>
            ) : (
              <div className="space-y-3">
                {aoVivo.map((g) => (
                  <PalcoGrupo
                    key={g.grupoId}
                    g={g}
                    agora={agora}
                    logado={logado}
                    aoMudar={() => void dados.recarregar()}
                  />
                ))}
              </div>
            )}

            {proximos.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Logo mais</h3>
                {proximos.map((g) => (
                  <CartaoGrupo
                    key={g.grupoId}
                    g={g}
                    agora={agora}
                    logado={logado}
                    aoMudar={() => void dados.recarregar()}
                  />
                ))}
              </div>
            ) : null}

            {historico.length > 0 ? (
              // Sempre escuro: foto do laboratório ao fundo e os dias em painéis de vidro.
              <section
                className="dark relative isolate flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/15 p-3 text-white sm:p-4"
                aria-label="Aulas das últimas 24 horas"
              >
                <img
                  src={fotoLaboratorio}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  className="absolute inset-0 -z-20 size-full object-cover"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-950/70 via-ink/75 to-ink/90"
                />
                <h3 className="flex items-center gap-2 text-base font-bold">
                  <span className="flex size-8 items-center justify-center rounded-xl border border-white/20 bg-white/15 backdrop-blur-xl">
                    <History className="size-4 text-sun" aria-hidden />
                  </span>
                  Aulas das últimas 24 horas
                </h3>
                {historico.map(({ data, grupos: gs }) => {
                  const turmasDoDia = new Map<string, string>();
                  for (const g of gs)
                    for (const a of g.alunos) turmasDoDia.set(a.turmaId, a.turmaRotulo);
                  return (
                    <div
                      key={data}
                      className="rounded-xl border border-white/15 bg-white/10 p-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.2)] backdrop-blur-xl backdrop-saturate-150"
                    >
                      <p className="flex flex-wrap items-center gap-2 text-sm">
                        <strong>{data === hoje ? "Hoje" : "Ontem"}</strong>
                        <span className="text-white/70">{data.split("-").reverse().join("/")}</span>
                        <span className="text-white/70">· turmas que participaram:</span>
                        {[...turmasDoDia.values()].map((r) => (
                          <Etiqueta key={r} rotulo={r} />
                        ))}
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {gs.map((g) => (
                          <li
                            key={g.grupoId}
                            className="rounded-lg border border-white/10 bg-white/[0.08] px-2.5 py-2 text-sm backdrop-blur-md transition-colors hover:bg-white/[0.14]"
                          >
                            <details>
                              <summary className="cursor-pointer">
                                <strong>
                                  {g.turmaId === "mista" ? "Aula mista" : g.turmaRotulo}
                                </strong>{" "}
                                · {horaNaEscola(g.inicio)}–{horaNaEscola(g.fim)} · {g.alunos.length}{" "}
                                aluno
                                {g.alunos.length === 1 ? "" : "s"}
                                {g.motivoParada ? (
                                  <span className="ml-1 text-xs italic text-amber-700 dark:text-amber-300">
                                    · parada: {g.motivoParada}
                                  </span>
                                ) : null}
                              </summary>
                              <p className="mt-1.5 text-xs text-white/75">
                                {g.alunos.map((a) => nomeExibido(a.nome, logado)).join(", ")}
                              </p>
                            </details>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </section>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
