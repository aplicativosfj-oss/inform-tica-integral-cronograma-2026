import { Clock3, MonitorSmartphone, Square, Trash2, Users2 } from "lucide-react";
import { toast } from "sonner";

import fundoLabLivre from "@/assets/laboratorio-fundo-digital.svg";
import { PalcoGrupo } from "@/components/school/laboratorio/palco-grupo";
import { useTelaCheiaAula } from "@/components/school/laboratorio/tela-cheia-aula";
import { SemanaNoLaboratorio } from "@/components/school/laboratorio/semana-laboratorio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TABELA_AUSENTE,
  agruparSessoes,
  encerrarGrupo,
  estadoDaSessao,
  hojeNaEscola,
  horaNaEscola,
  nomeExibido,
  removerGrupo,
  textoRestante,
  useAgora,
  type GrupoLab,
  type SessaoLab,
} from "@/lib/laboratorio";
import { useAppStore } from "@/lib/app-store";
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
 * Destaque de quando não há turma no laboratório: foto do laboratório ao
 * fundo e um painel de vidro dizendo que os computadores estão livres, qual
 * é a próxima turma marcada e quanto o laboratório já foi usado hoje.
 */
function LaboratorioLivre({
  proximo,
  aulasHoje,
  alunosHoje,
}: {
  proximo: GrupoLab | null;
  aulasHoje: number;
  alunosHoje: number;
}) {
  return (
    <div className="dark relative isolate overflow-hidden rounded-2xl border border-white/15 text-white shadow-lg">
      <img
        src={fundoLabLivre}
        alt=""
        aria-hidden
        className="absolute inset-0 -z-20 size-full object-cover object-bottom"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent"
      />
      <div className="flex min-h-56 flex-col justify-end gap-3 p-4 sm:p-5">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-400/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-200 backdrop-blur-xl">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          Laboratório livre
        </span>
        <BancadaEmDescanso />
        <div className="rounded-2xl border border-white/20 bg-white/[0.12] p-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_8px_32px_-12px_rgb(0_0_0/0.5)] backdrop-blur-xl backdrop-saturate-150">
          <p className="font-heading text-xl font-extrabold leading-tight sm:text-2xl">
            Computadores prontos para a próxima turma
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/85">
            <Clock3 className="size-4 shrink-0 text-sun" aria-hidden />
            {proximo
              ? `Próxima: ${proximo.turmaId === "mista" ? "aula mista" : proximo.turmaRotulo}, às ${horaNaEscola(proximo.inicio)}`
              : "Nenhuma turma marcada para agora."}
          </p>
          {aulasHoje > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-white/15 pt-3 text-xs font-semibold">
              <span className="rounded-full bg-white/15 px-2.5 py-1">
                {aulasHoje} aula{aulasHoje === 1 ? "" : "s"} hoje
              </span>
              <span className="rounded-full bg-white/15 px-2.5 py-1">
                {alunosHoje} aluno{alunosHoje === 1 ? "" : "s"} já usaram
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Os computadores do laboratório em descanso: as telas acendem em onda, uma
 * de cada vez, e um feixe de luz varre a bancada, como um protetor de tela.
 */
function BancadaEmDescanso() {
  const { config } = useAppStore();
  const n = Math.min(12, Math.max(1, config.numeroComputadores || 7));
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] px-3 pb-2.5 pt-3 backdrop-blur-md"
      aria-label={`${n} computadores em espera`}
      role="img"
    >
      <span
        aria-hidden
        className="tela-feixe absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-emerald-300/15 to-transparent"
      />
      <div className="relative flex items-end justify-between gap-1.5">
        {Array.from({ length: n }, (_, i) => (
          <span key={i} className="flex flex-1 flex-col items-center">
            <span
              className="tela-descanso relative block aspect-[4/3] w-full max-w-11 rounded-[5px] border border-white/30 bg-gradient-to-br from-emerald-400/50 via-sky-500/30 to-indigo-600/40"
              style={{ animationDelay: `${i * 0.28}s` }}
            >
              <span className="absolute bottom-0.5 right-0.5 size-1 rounded-full bg-emerald-300" />
            </span>
            <span className="h-1.5 w-0.5 bg-white/30" />
            <span className="h-0.5 w-3 rounded-full bg-white/30" />
          </span>
        ))}
      </div>
      <p className="relative mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65">
        {n} computadores em espera
      </p>
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
  const alunosAgora = new Set(aoVivo.flatMap((g) => g.alunos.map((a) => a.id))).size;
  const telaCheia = useTelaCheiaAula(grupos, logado);

  return (
    <Card id="laboratorio-agora" className="scroll-mt-28">
      {telaCheia.tela}
      <CardHeader className="px-3 pb-3 sm:px-6">
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
        className={`space-y-4 px-3 sm:px-6 ${rolar ? "lg:max-h-[calc(100svh-16rem)] lg:min-h-32 lg:overflow-y-auto" : ""}`}
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
              <LaboratorioLivre
                proximo={proximos[0] ?? null}
                aulasHoje={grupos.filter((g) => estado(g) === "encerrada").length}
                alunosHoje={
                  new Set(
                    doDia.filter((s) => s.ausencia === null).map((s) => s.turmaId + s.alunoId),
                  ).size
                }
              />
            ) : (
              <div className="space-y-3">
                {aoVivo.map((g) => (
                  <PalcoGrupo
                    key={g.grupoId}
                    g={g}
                    agora={agora}
                    logado={logado}
                    aoMudar={() => void dados.recarregar()}
                    aoTelaCheia={() => telaCheia.abrir(g)}
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

            <SemanaNoLaboratorio sessoes={dados.sessoes} agora={agora} logado={logado} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
