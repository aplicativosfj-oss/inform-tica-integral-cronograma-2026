import { createFileRoute, Link } from "@tanstack/react-router";
import { imagemCompartilhar } from "@/lib/compartilhar";
import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { TimerRing } from "@/components/school/timer-ring";
import { TrocaGrupoOverlay } from "@/components/school/troca-grupo-overlay";
import { unlockAlertSound } from "@/lib/alert-sound";
import { useAppStore } from "@/lib/app-store";
import {
  aplicarExcecoesDeData,
  buildWeeklySchedule,
  currentWeekdayLabel,
  findSessaoAtual,
  getWeekIndex,
  toDateKey,
  agoraNaEscola,
} from "@/lib/schedule-engine";

export const Route = createFileRoute("/tv")({
  component: TvPage,
  head: () => ({
    meta: [
      ...imagemCompartilhar("/og/secao-tv.jpg", "Painel da TV do laboratório"),
      { title: "Modo TV · Cronômetro do laboratório de informática" },
      {
        name: "description",
        content:
          "Tela cheia para o laboratório: cronômetro em tempo real, turma da vez, grupo e conteúdo do dia.",
      },
      { property: "og:title", content: "Modo TV · Laboratório de informática" },
      {
        property: "og:description",
        content: "Cronômetro em tela cheia com turma, grupo e conteúdo do dia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

/** "08:30" -> segundos desde a meia-noite. */
function hhmmToSeconds(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  return (Number(h ?? 0) * 60 + Number(m ?? 0)) * 60;
}

function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(agoraNaEscola());
    const id = window.setInterval(() => setNow(agoraNaEscola()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

/**
 * Tela cheia do laboratório: sem menus, sem navegação, apenas cronômetro,
 * turma, grupo, alunos da vez e conteúdo do dia — pensada para ficar
 * projetada na TV durante a aula.
 */
function TvPage() {
  const { turmas, config } = useAppStore();
  const [somAtivo, setSomAtivo] = useState(false);
  const now = useNow();

  const diaAtual = now ? currentWeekdayLabel(now) : "";
  const conteudoDoDia = config.conteudoPorDia?.[diaAtual] ?? "";
  const sessao = now
    ? findSessaoAtual(
        aplicarExcecoesDeData(
          buildWeeklySchedule(turmas, config, getWeekIndex(now)),
          config,
          turmas,
          toDateKey(now),
        ),
        config,
        now,
      )
    : null;
  const dateKey = now ? toDateKey(now) : "";

  return (
    <main className="relative flex min-h-screen flex-col bg-background p-6 text-foreground sm:p-10">
      <div className="absolute right-4 top-4 flex items-center gap-2 opacity-40 transition hover:opacity-100">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={async () => {
            if (somAtivo) {
              setSomAtivo(false);
              return;
            }
            setSomAtivo(await unlockAlertSound());
          }}
        >
          {somAtivo ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          {somAtivo ? "Som ligado" : "Ligar som"}
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link to="/">
            <ArrowLeft className="size-4" /> Sair
          </Link>
        </Button>
      </div>

      {/* Fica fora do bloco da sessão para não ser desmontado justamente na troca. */}
      <TrocaGrupoOverlay
        chave={sessao && !sessao.suspensa ? `${dateKey}|${sessao.subBloco.inicio}` : ""}
        proximoGrupo={sessao ? sessao.subBloco.grupo.indice + 1 : undefined}
        comSom={somAtivo}
      />

      {!now ? (
        <div className="flex flex-1 items-center justify-center text-2xl text-muted-foreground">
          Carregando cronômetro...
        </div>
      ) : !sessao || sessao.suspensa ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-5xl font-bold">Nenhuma aula de informática agora</p>
          <p className="text-2xl text-muted-foreground">
            {now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })} ·{" "}
            {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
          {conteudoDoDia ? (
            <p className="max-w-3xl text-xl text-muted-foreground">
              Conteúdo previsto para hoje: {conteudoDoDia}
            </p>
          ) : null}
        </div>
      ) : (
        <TvSessao conteudoDoDia={conteudoDoDia} sessao={sessao} />
      )}
    </main>
  );
}

type Sessao = NonNullable<ReturnType<typeof findSessaoAtual>>;

function TvSessao({ conteudoDoDia, sessao }: { conteudoDoDia: string; sessao: Sessao }) {
  const { assignment, subBloco, segundosRestantes, proximoSubBloco } = sessao;
  const turmaAtual = subBloco.turma ?? assignment.turma;
  const total = Math.max(1, hhmmToSeconds(subBloco.fim) - hhmmToSeconds(subBloco.inicio));
  const decorridos = total - segundosRestantes;
  const conteudoGrupo = subBloco.grupo.conteudo || assignment.conteudo || conteudoDoDia;

  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center gap-10 lg:flex-row lg:gap-16">
        <TimerRing decorridos={decorridos} total={total} size={380} />

        <div className="flex min-w-0 max-w-2xl flex-col gap-6 text-center lg:text-left">
          <div>
            <p className="text-6xl font-black tracking-tight text-foreground">
              {turmaAtual.serie} "{turmaAtual.letra}"
            </p>
            <p className="mt-2 text-2xl text-muted-foreground">
              {subBloco.grupo.nome || `Grupo ${subBloco.grupo.indice + 1}`} · {subBloco.inicio} –{" "}
              {subBloco.fim}
            </p>
          </div>

          {conteudoGrupo ? (
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <p className="text-sm uppercase tracking-wide text-muted-foreground">
                Conteúdo do dia
              </p>
              <p className="mt-1 text-3xl font-semibold text-foreground">{conteudoGrupo}</p>
            </div>
          ) : null}

          {subBloco.grupo.alunos.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
              {subBloco.grupo.alunos.map((aluno) => (
                <span
                  key={aluno.id}
                  className="rounded-full bg-secondary px-4 py-2 text-xl font-medium text-secondary-foreground"
                >
                  {aluno.nome}
                </span>
              ))}
            </div>
          ) : null}

          {proximoSubBloco ? (
            <p className="text-xl text-muted-foreground">
              A seguir: grupo {proximoSubBloco.grupo.indice + 1} às {proximoSubBloco.inicio}
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}
