import { GraduationCap, MonitorSmartphone, Shuffle, Square, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/app-store";
import {
  encerrarGrupo,
  horaNaEscola,
  nomeExibido,
  removerGrupo,
  textoRestante,
  type GrupoLab,
} from "@/lib/laboratorio";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";

const RAIO = 34;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

function iniciais(nome: string) {
  const p = nome
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? (p[p.length - 1]?.[0] ?? "") : "")).toUpperCase();
}

/**
 * Palco de um grupo que está no laboratório agora: anel com a contagem
 * regressiva, turma(s) e professor(a), e um cartão por aluno. Se os alunos vêm
 * de turmas diferentes, mostra cada turma participante. Foto de aluno só
 * aparece para quem está logado; o público vê as iniciais.
 */
export function PalcoGrupo({
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
  const { turmas } = useAppStore();
  const ini = new Date(g.inicio).getTime();
  const fim = new Date(g.fim).getTime();
  const passado = Math.min(1, Math.max(0, (agora - ini) / (fim - ini)));
  const mista = g.turmaId === "mista";

  /** Turmas presentes no grupo, com professor e quantos alunos cada uma trouxe. */
  const participantes = useMemo(() => {
    const mapa = new Map<string, { id: string; rotulo: string; qtd: number }>();
    for (const a of g.alunos) {
      const x = mapa.get(a.turmaId) ?? { id: a.turmaId, rotulo: a.turmaRotulo, qtd: 0 };
      x.qtd++;
      mapa.set(a.turmaId, x);
    }
    return [...mapa.values()].map((x) => ({
      ...x,
      professor: turmas.find((t) => t.id === x.id)?.professorRegente ?? "",
    }));
  }, [g.alunos, turmas]);

  const fotoDe = (alunoId: string, turmaId: string) =>
    logado
      ? turmas.find((t) => t.id === turmaId)?.alunos.find((a) => a.id === alunoId)?.foto
      : undefined;

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
    <article className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-ink via-ink to-primary/50 p-4 text-white shadow-xl sm:p-5">
      <div aria-hidden className="fundo-pixel absolute inset-0 -z-10 opacity-20" />
      <div
        aria-hidden
        className="lab-brilho absolute -right-16 -top-16 -z-10 size-56 rounded-full bg-primary/50 blur-3xl"
      />

      <header className="flex flex-wrap items-center gap-4">
        <div className="relative size-[84px] shrink-0">
          <svg viewBox="0 0 84 84" className="size-full -rotate-90" aria-hidden>
            <circle
              cx="42"
              cy="42"
              r={RAIO}
              fill="none"
              strokeWidth="6"
              className="stroke-white/15"
            />
            <circle
              cx="42"
              cy="42"
              r={RAIO}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              className="stroke-mint transition-[stroke-dashoffset] duration-1000"
              strokeDasharray={CIRCUNFERENCIA}
              strokeDashoffset={CIRCUNFERENCIA * passado}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
            <span className="font-heading text-sm font-bold tabular-nums">
              {textoRestante(fim - agora)}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-white/60">restam</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-mint">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
            </span>
            Ao vivo · {horaNaEscola(g.inicio)} às {horaNaEscola(g.fim)}
          </p>
          <h3 className="mt-1 flex flex-wrap items-center gap-2 font-heading text-2xl font-extrabold sm:text-3xl">
            {mista ? <Shuffle className="size-6 text-sun" aria-hidden /> : null}
            {mista ? "Aula mista" : g.turmaRotulo}
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-sm font-semibold">
              {g.alunos.length} aluno{g.alunos.length === 1 ? "" : "s"}
            </span>
          </h3>
          {!mista && participantes[0]?.professor ? (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-white/75">
              <GraduationCap className="size-4 text-sun" aria-hidden /> Professor(a){" "}
              {participantes[0].professor}
            </p>
          ) : null}
        </div>

        {logado ? (
          <span className="flex gap-1">
            <Button size="sm" variant="secondary" onClick={() => void agir("encerrar")}>
              <Square className="size-3.5" /> Encerrar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
              aria-label="Remover marcação"
              onClick={() => void agir("remover")}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </span>
        ) : null}
      </header>

      {mista ? (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Turmas participando">
          {participantes.map((p) => {
            const cor = serieClasses(serieIndexPorNumero(p.rotulo));
            return (
              <li
                key={p.id}
                className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 py-1 pl-1 pr-3 text-sm backdrop-blur"
              >
                <span
                  className={`rounded-xl px-2 py-0.5 text-xs font-extrabold ${cor.bg} ${cor.text}`}
                >
                  {p.rotulo}
                </span>
                <span className="text-white/85">
                  {p.qtd} aluno{p.qtd === 1 ? "" : "s"}
                  {p.professor ? ` · ${p.professor}` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {g.alunos.map((a, i) => {
          const cor = serieClasses(serieIndexPorNumero(a.turmaRotulo));
          const foto = fotoDe(a.id, a.turmaId);
          return (
            <li
              key={a.id}
              style={{ animationDelay: `${Math.min(i, 14) * 70}ms` }}
              className="lab-aluno group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] p-2.5 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/15"
            >
              <span
                aria-hidden
                className="lab-varredura pointer-events-none absolute inset-y-0 left-0 w-1/4 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100"
              />
              <span
                className={`relative flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ring-2 ring-white/30 transition duration-300 group-hover:scale-110 group-hover:ring-mint ${cor.bg} ${cor.text}`}
              >
                {foto ? (
                  <img src={foto} alt="" className="size-full rounded-full object-cover" />
                ) : (
                  iniciais(a.nome)
                )}
                <MonitorSmartphone
                  className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-ink p-0.5 text-mint"
                  aria-hidden
                />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {nomeExibido(a.nome, logado)}
                </span>
                <span className="block text-xs text-white/60">
                  {mista ? a.turmaRotulo : "no computador"}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
