import { GraduationCap, MonitorSmartphone, Shuffle, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

import labFotoImg from "@/assets/laboratorio-informatica-turma.jpg";
import { BotaoAusencia } from "@/components/school/laboratorio/ausencia";
import { ControleAula } from "@/components/school/laboratorio/controle-aula";
import { RelogioAula } from "@/components/school/laboratorio/relogio-aula";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/app-store";
import {
  horaNaEscola,
  instanteEfetivo,
  nomeExibido,
  removerGrupo,
  type GrupoLab,
} from "@/lib/laboratorio";
import { cn } from "@/lib/utils";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";
import { imagemDaSerie } from "@/lib/serie-imagens";

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
  const efetivo = instanteEfetivo(g, agora);
  const pausada = g.pausadoEm !== null;
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

  async function remover() {
    try {
      await removerGrupo(g.grupoId);
      toast.success("Marcação removida.");
      aoMudar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível concluir.");
    }
  }

  const serieDaImagem = mista ? null : turmas.find((t) => t.id === g.turmaId)?.serie;
  const foto = serieDaImagem ? imagemDaSerie(serieDaImagem) : labFotoImg;

  const minutosTotal = Math.round((fim - ini) / 60_000);
  const minutosPassados = Math.min(minutosTotal, Math.max(0, Math.floor((efetivo - ini) / 60_000)));

  return (
    <article className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-ink text-white shadow-xl">
      <img
        src={foto}
        alt=""
        aria-hidden
        loading="lazy"
        className="absolute inset-0 -z-20 size-full object-cover opacity-25"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-br from-ink/95 via-ink/90 to-primary/55"
      />
      <div
        aria-hidden
        className="lab-brilho absolute -left-20 -top-20 -z-10 size-64 rounded-full bg-primary/40 blur-3xl"
      />

      <div className="grid md:grid-cols-[17rem_minmax(0,1fr)]">
        {/* Coluna do relógio: tempo, horário e controles da aula. */}
        <aside className="flex flex-col items-center gap-4 border-b border-white/10 p-5 text-center md:border-b-0 md:border-r">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-mint">
            <span className="relative flex size-2.5">
              <span
                className={cn(
                  "absolute inline-flex size-full rounded-full opacity-70",
                  pausada ? "bg-sun" : "animate-ping bg-emerald-400",
                )}
              />
              <span
                className={cn(
                  "relative inline-flex size-2.5 rounded-full",
                  pausada ? "bg-sun" : "bg-emerald-400",
                )}
              />
            </span>
            {pausada ? "Pausada" : "Ao vivo"}
          </p>
          <RelogioAula
            inicioMs={ini}
            fimMs={fim}
            agoraMs={efetivo}
            pausada={pausada}
            tamanho={196}
          />
          <dl className="grid w-full grid-cols-2 gap-2 text-left text-xs">
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <dt className="text-white/55">Horário</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">
                {horaNaEscola(g.inicio)}–{horaNaEscola(g.fim)}
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <dt className="text-white/55">Andamento</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">
                {minutosPassados} de {minutosTotal} min
              </dd>
            </div>
          </dl>
          <ControleAula g={g} aoMudar={aoMudar} compacto className="justify-center" />
        </aside>

        {/* Coluna da turma e dos alunos. */}
        <section className="min-w-0 p-5">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="flex flex-wrap items-center gap-2 font-heading text-2xl font-extrabold">
                {mista ? <Shuffle className="size-5 text-sun" aria-hidden /> : null}
                {mista ? "Aula mista" : g.turmaRotulo}
                <span className="rounded-full bg-white/12 px-2.5 py-0.5 text-xs font-semibold text-white/85">
                  {g.alunos.length} aluno{g.alunos.length === 1 ? "" : "s"}
                </span>
              </h3>
              {!mista && participantes[0]?.professor ? (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-white/70">
                  <GraduationCap className="size-4 text-sun" aria-hidden /> Professor(a){" "}
                  {participantes[0].professor}
                </p>
              ) : null}
            </div>
            {logado ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-white/60 hover:bg-white/10 hover:text-white"
                aria-label="Remover marcação"
                onClick={() => void remover()}
              >
                <Trash2 className="size-3.5" /> Remover
              </Button>
            ) : null}
          </header>

          {mista ? (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Turmas participando">
              {participantes.map((p) => {
                const cor = serieClasses(serieIndexPorNumero(p.rotulo));
                return (
                  <li
                    key={p.id}
                    className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-0.5 pl-0.5 pr-3 text-xs"
                  >
                    <span
                      className={`rounded-full px-2 py-0.5 font-extrabold ${cor.bg} ${cor.text}`}
                    >
                      {p.rotulo}
                    </span>
                    <span className="text-white/80">
                      {p.qtd} aluno{p.qtd === 1 ? "" : "s"}
                      {p.professor ? ` · ${p.professor}` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <ul className="mt-4 grid gap-1.5 sm:grid-cols-2" aria-label="Alunos no laboratório">
            {g.alunos.map((a, i) => {
              const cor = serieClasses(serieIndexPorNumero(a.turmaRotulo));
              const foto = fotoDe(a.id, a.turmaId);
              return (
                <li
                  key={a.sessaoId}
                  style={{ animationDelay: `${Math.min(i, 14) * 60}ms` }}
                  className="lab-aluno flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 transition-colors hover:bg-white/[0.11]"
                >
                  <span
                    className={`relative flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ring-1 ring-white/25 ${cor.bg} ${cor.text}`}
                  >
                    {foto ? (
                      <img src={foto} alt="" className="size-full rounded-full object-cover" />
                    ) : (
                      iniciais(a.nome)
                    )}
                    <MonitorSmartphone
                      className="absolute -bottom-1 -right-1 size-4 rounded-full bg-ink p-0.5 text-mint"
                      aria-hidden
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    {/* Nome inteiro, quebrando linha se precisar: nada de reticências. */}
                    <span className="block text-sm font-semibold leading-snug [overflow-wrap:anywhere]">
                      {nomeExibido(a.nome, logado)}
                    </span>
                    {mista ? (
                      <span className="block text-[11px] text-white/55">{a.turmaRotulo}</span>
                    ) : null}
                  </span>
                  {logado ? (
                    <BotaoAusencia
                      sessaoId={a.sessaoId}
                      nome={a.nome}
                      ausencia={a.ausencia}
                      ausenciaMotivo={a.ausenciaMotivo}
                      aoMudar={aoMudar}
                      soIcone
                      className="shrink-0 border-white/20 p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </article>
  );
}
