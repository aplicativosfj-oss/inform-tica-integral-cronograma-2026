import { useState } from "react";
import { PainelAlunoAula } from "@/components/school/laboratorio/painel-aluno-aula";
import { Clock3, MonitorSmartphone, Square, Trash2, Users2 } from "lucide-react";
import { toast } from "sonner";

import { CartaoLaboratorioLivre } from "@/components/school/laboratorio/estacoes-livres";
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
import { cn } from "@/lib/utils";

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
  const [selecionado, setSelecionado] = useState<(typeof g.alunos)[number] | null>(null);
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
            <button
              type="button"
              onClick={() => setSelecionado(a)}
              className="font-semibold underline-offset-2 hover:text-primary hover:underline"
              aria-label={`Abrir a ficha de ${nomeExibido(a.nome, logado)}`}
            >
              {nomeExibido(a.nome, logado)}
            </button>
          </li>
        ))}
      </ul>
      {selecionado ? (
        <PainelAlunoAula
          aluno={selecionado}
          logado={logado}
          aoFechar={() => setSelecionado(null)}
          aoMudar={aoMudar}
        />
      ) : null}
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
  compacto = false,
  className,
}: {
  dados: DadosLab;
  logado: boolean;
  /**
   * Cabe na altura de quem o contém (a seção da home tem a altura da janela):
   * no computador vira duas colunas, o destaque à esquerda e a agenda à
   * direita, cada uma rolando por dentro.
   */
  rolar?: boolean;
  compacto?: boolean;
  className?: string;
}) {
  const agora = useAgora(1000);
  const hoje = hojeNaEscola();
  const doDia = dados.sessoes.filter((s) => s.data === hoje);
  const grupos = agruparSessoes(doDia);
  const estado = (g: GrupoLab) => estadoDaSessao(g, agora);
  const aoVivo = grupos.filter((g) => estado(g) === "ao-vivo");
  const proximos = grupos.filter((g) => estado(g) === "agendada");
  const alunosAgora = new Set(aoVivo.flatMap((g) => g.alunos.map((a) => a.id))).size;
  const telaCheia = useTelaCheiaAula(grupos, logado, [
    ...dados.sessoes,
    ...(dados.ausencias ?? []),
  ]);

  return (
    <Card
      id="laboratorio-agora"
      className={cn("scroll-mt-28 border-0 shadow-none", rolar && "lg:flex lg:flex-col", className)}
    >
      {telaCheia.tela}
      <CardHeader
        className={cn("px-3 pb-2 pt-3 sm:px-4", compacto && "pb-1 pt-2", rolar && "lg:shrink-0")}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
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
        className={cn(
          "space-y-3 px-3 pb-3 sm:px-4",
          compacto && "space-y-2 pb-2",
          rolar &&
            "lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(16rem,1fr)] lg:items-start lg:gap-4 lg:space-y-0",
        )}
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
            <div className={cn("space-y-3", rolar && "lg:min-w-0")}>
              {aoVivo.length === 0 ? (
                <CartaoLaboratorioLivre
                  cheio={rolar}
                  compacto={compacto}
                  grupos={grupos}
                  agora={agora}
                  alunosHoje={
                    new Set(
                      doDia.filter((s) => s.ausencia === null).map((s) => s.turmaId + s.alunoId),
                    ).size
                  }
                />
              ) : (
                <div className={cn("space-y-3", rolar && aoVivo.length === 1 && "lg:h-full")}>
                  {aoVivo.map((g) => (
                    <PalcoGrupo
                      key={g.grupoId}
                      g={g}
                      agora={agora}
                      logado={logado}
                      aoMudar={() => void dados.recarregar()}
                      aoTelaCheia={() => telaCheia.abrir(g)}
                      cheio={rolar && aoVivo.length === 1}
                    />
                  ))}
                </div>
              )}
            </div>

            <div
              className={cn(
                "space-y-4",
                rolar && "lg:flex lg:min-w-0 lg:flex-col lg:gap-3 lg:space-y-0",
              )}
            >
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

              {compacto ? (
                <details className="group rounded-xl border border-border bg-muted/20 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-foreground marker:text-primary">
                    A semana no laboratório · ver programação
                  </summary>
                  <div className="mt-3">
                    <SemanaNoLaboratorio sessoes={dados.sessoes} agora={agora} logado={logado} />
                  </div>
                </details>
              ) : (
                <SemanaNoLaboratorio
                  sessoes={dados.sessoes}
                  agora={agora}
                  logado={logado}
                  className={cn(rolar && "lg:flex-1")}
                />
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
