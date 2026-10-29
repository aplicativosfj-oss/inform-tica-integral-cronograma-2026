import { ArrowRight, GraduationCap, Pause, Users2 } from "lucide-react";

import { AvisoMinutosFinais, RelogioAula } from "@/components/school/laboratorio/relogio-aula";
import { BotaoTelaCheia, useTelaCheiaAula } from "@/components/school/laboratorio/tela-cheia-aula";
import { useAppStore } from "@/lib/app-store";
import {
  agruparSessoes,
  estadoDaSessao,
  hojeNaEscola,
  horaNaEscola,
  instanteEfetivo,
  nomeExibido,
  useAgora,
  type GrupoLab,
  type SessaoLab,
} from "@/lib/laboratorio";
import { cn } from "@/lib/utils";

/**
 * Cartão de vidro do topo da página inicial. Com aula acontecendo, vira o
 * destaque da tela: relógio grande da aula, a turma, o professor regente e
 * quem está nos computadores. Sem aula, mostra a próxima marcada (ou que o
 * laboratório está livre). Tem relógio próprio, de segundo em segundo, para
 * a contagem não pular.
 */
export function CartaoAoVivoHome({
  sessoes,
  ausencias = [],
  logado,
}: {
  sessoes: SessaoLab[];
  /** Faltas, impedimentos e recusas, para a ficha do aluno na tela cheia. */
  ausencias?: SessaoLab[];
  logado: boolean;
}) {
  const { turmas } = useAppStore();
  const agora = useAgora(1000);
  const grupos = agruparSessoes(sessoes.filter((s) => s.data === hojeNaEscola()));
  const telaCheia = useTelaCheiaAula(grupos, logado, [...sessoes, ...ausencias]);
  const aoVivo = grupos.filter((g) => estadoDaSessao(g, agora) === "ao-vivo");
  const proximo = grupos
    .filter((g) => estadoDaSessao(g, agora) === "agendada")
    .sort((a, b) => a.inicio.localeCompare(b.inicio))[0];

  const principal = aoVivo[0];
  const outros = aoVivo.slice(1);

  if (!principal) {
    return (
      <div className="hidden rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-md lg:block">
        {telaCheia.tela}
        <Cabeca agora={agora} vivo={false} />
        <div className="mt-4 rounded-2xl bg-white/10 p-4">
          <p className="font-heading text-xl font-bold">Laboratório livre por enquanto</p>
          <p className="mt-1 text-sm text-white/70">
            {proximo
              ? `Daqui a pouco: ${rotulo(proximo)}, às ${horaNaEscola(proximo.inicio)}`
              : "Ninguém marcado para agora."}
          </p>
        </div>
        <VerTodos />
      </div>
    );
  }

  const pausada = principal.pausadoEm !== null;
  const professor =
    principal.turmaId === "mista"
      ? [...new Set(principal.alunos.map((a) => a.turmaRotulo))].join(" · ")
      : turmas.find((t) => t.id === principal.turmaId)?.professorRegente;
  const presentes = principal.alunos.filter((a) => a.ausencia === null && !a.semMarcacao);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-300/30 bg-ink/60 p-5 shadow-[0_24px_80px_-24px_rgb(16_185_129/0.45)] backdrop-blur-xl sm:p-6">
      {/* brilho que respira atrás do relógio */}
      <div
        aria-hidden
        className={cn(
          "relogio-respira absolute -right-16 -top-16 size-64 rounded-full blur-3xl",
          pausada ? "bg-sun/40" : "bg-emerald-400/40",
        )}
      />
      <Cabeca agora={agora} vivo={!pausada} pausada={pausada} />

      <div className="relative mt-4 flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <div className="shrink-0">
          <RelogioAula
            inicioMs={new Date(principal.inicio).getTime()}
            fimMs={new Date(principal.fim).getTime()}
            agoraMs={instanteEfetivo(principal, agora)}
            pausada={pausada}
            tamanho={168}
          />
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">
            Turma no laboratório
          </p>
          <p className="font-heading text-[clamp(2.2rem,5vw,3rem)] font-extrabold leading-none tracking-tight">
            {rotulo(principal)}
          </p>
          {professor ? (
            <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-white/75 sm:justify-start">
              <GraduationCap className="size-4 shrink-0 text-sun" aria-hidden />
              <span className="truncate">{professor}</span>
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs sm:justify-start">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 font-semibold">
              <Users2 className="size-3.5" aria-hidden /> {presentes.length} aluno
              {presentes.length === 1 ? "" : "s"}
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 font-semibold tabular-nums">
              {horaNaEscola(principal.inicio)}–{horaNaEscola(principal.fim)}
            </span>
          </div>
        </div>
      </div>

      {pausada ? null : (
        <AvisoMinutosFinais
          restanteMs={new Date(principal.fim).getTime() - instanteEfetivo(principal, agora)}
          className="relative mt-4"
        />
      )}

      {/* quem está nos computadores */}
      <ul className="relative mt-5 flex flex-wrap gap-1.5">
        {presentes.slice(0, 8).map((a, i) => (
          <li
            key={a.sessaoId}
            style={{ animationDelay: `${i * 60}ms` }}
            className="lab-aluno flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 py-0.5 pl-0.5 pr-2.5 text-xs"
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 text-[10px] font-bold text-white">
              {a.nome.trim().charAt(0).toUpperCase()}
            </span>
            {nomeExibido(a.nome, logado).split(" ")[0]}
          </li>
        ))}
        {presentes.length > 8 ? (
          <li className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold">
            +{presentes.length - 8}
          </li>
        ) : null}
      </ul>

      {outros.length > 0 ? (
        <ul className="relative mt-4 space-y-2 border-t border-white/10 pt-4">
          {outros.map((g) => (
            <li key={g.grupoId} className="flex items-center justify-between gap-2 text-sm">
              <span className="font-bold">{rotulo(g)}</span>
              <span className="text-white/70">
                {g.alunos.length} alunos · até {horaNaEscola(g.fim)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-2">
        <BotaoTelaCheia
          onClick={() => telaCheia.abrir(principal)}
          className="flex-1 sm:flex-none"
        />
        <VerTodos className="" />
      </div>
      {telaCheia.tela}
    </div>
  );
}

const rotulo = (g: GrupoLab) => (g.turmaId === "mista" ? "Aula mista" : g.turmaRotulo);

function Cabeca({
  agora,
  vivo,
  pausada = false,
}: {
  agora: number;
  vivo: boolean;
  pausada?: boolean;
}) {
  return (
    <div className="relative flex items-center justify-between gap-3">
      <p
        className={cn(
          "flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em]",
          pausada ? "text-sun" : vivo ? "text-emerald-300" : "text-sun",
        )}
      >
        {pausada ? (
          <Pause className="size-4" aria-hidden />
        ) : (
          <span className="relative flex size-2.5">
            <span
              className={cn(
                "absolute inline-flex size-full rounded-full opacity-60",
                vivo ? "animate-ping bg-emerald-400" : "bg-white/40",
              )}
            />
            <span
              className={cn(
                "relative inline-flex size-2.5 rounded-full",
                vivo ? "bg-emerald-400" : "bg-white/50",
              )}
            />
          </span>
        )}
        {pausada ? "Aula pausada" : vivo ? "Aula ao vivo" : "Agora"}
      </p>
      <span className="text-sm tabular-nums text-white/70">{horaNaEscola(agora)}</span>
    </div>
  );
}

function VerTodos({ className = "mt-4" }: { className?: string }) {
  return (
    <a
      href="#laboratorio-agora"
      className={cn(
        "relative inline-flex items-center gap-1.5 text-sm font-semibold text-sun underline-offset-4 hover:underline",
        className,
      )}
    >
      Ver todo mundo <ArrowRight className="size-4" aria-hidden />
    </a>
  );
}
