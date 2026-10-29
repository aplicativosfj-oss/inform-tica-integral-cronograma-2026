import { GraduationCap, MonitorSmartphone, Shuffle, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import labFotoImg from "@/assets/laboratorio-informatica-turma.jpg";
import { BotaoAusencia } from "@/components/school/laboratorio/ausencia";
import { ControleAula } from "@/components/school/laboratorio/controle-aula";
import { AvisoMinutosFinais, RelogioAula } from "@/components/school/laboratorio/relogio-aula";
import { BotaoTelaCheia } from "@/components/school/laboratorio/tela-cheia-aula";
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

/** Tela estreita (celular): o palco fica compacto, como num aplicativo. */
function useCelular() {
  const [celular, setCelular] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const mudou = () => setCelular(mq.matches);
    mudou();
    mq.addEventListener("change", mudou);
    return () => mq.removeEventListener("change", mudou);
  }, []);
  return celular;
}

/** Tela de computador (lg para cima): o palco cheio da home ganha relógio maior. */
function useTelaGrande() {
  const [grande, setGrande] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const mudou = () => setGrande(mq.matches);
    mudou();
    mq.addEventListener("change", mudou);
    return () => mq.removeEventListener("change", mudou);
  }, []);
  return grande;
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
  aoTelaCheia,
  cheio = false,
}: {
  /** Ocupa a altura toda de quem o contém (home no computador): relógio e nomes maiores. */
  cheio?: boolean;
  g: GrupoLab;
  agora: number;
  logado: boolean;
  aoMudar: () => void;
  /** Abre a aula em tela cheia (o painel guarda qual está aberta). */
  aoTelaCheia: () => void;
}) {
  const { turmas } = useAppStore();
  const celular = useCelular();
  const grande = useTelaGrande();
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
    <article
      className={cn(
        "relative isolate overflow-hidden rounded-3xl border border-white/10 bg-ink text-white shadow-xl",
        cheio && "lg:flex lg:h-full lg:flex-col",
      )}
    >
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

      <div
        className={cn(
          "grid md:grid-cols-[17rem_minmax(0,1fr)]",
          cheio && "lg:min-h-0 lg:flex-1 xl:grid-cols-[19rem_minmax(0,1fr)]",
        )}
      >
        {/* Coluna do relógio: tempo, horário e controles da aula. */}
        <aside
          className={cn(
            "flex flex-col gap-3 border-b border-white/10 p-4 md:items-center md:gap-4 md:border-b-0 md:border-r md:p-5 md:text-center",
            cheio && "lg:justify-center",
          )}
        >
          {/* No celular, relógio e dados lado a lado, como num aplicativo. */}
          <div className="flex items-center gap-4 md:flex-col">
            <RelogioAula
              inicioMs={ini}
              fimMs={fim}
              agoraMs={efetivo}
              pausada={pausada}
              tamanho={celular ? 128 : cheio && grande ? 228 : 196}
            />
            <div className="min-w-0 flex-1 space-y-2 md:w-full md:flex-none">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-mint md:justify-center">
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
              <dl className="grid gap-1.5 text-left text-xs md:grid-cols-2 md:gap-2">
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 md:py-2">
                  <dt className="text-white/55">Horário</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums">
                    {horaNaEscola(g.inicio)}–{horaNaEscola(g.fim)}
                  </dd>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 md:py-2">
                  <dt className="text-white/55">Andamento</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums">
                    {minutosPassados} de {minutosTotal} min
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          {pausada ? null : <AvisoMinutosFinais restanteMs={fim - efetivo} />}
          <div className="flex flex-wrap items-center gap-2 md:w-full md:flex-col">
            <ControleAula g={g} aoMudar={aoMudar} compacto className="justify-center" />
            <BotaoTelaCheia
              onClick={aoTelaCheia}
              className="flex-1 px-3 py-1.5 md:w-full md:flex-none md:py-2"
            />
          </div>
        </aside>

        {/* Coluna da turma e dos alunos. */}
        <section className={cn("min-w-0 p-4 md:p-5", cheio && "lg:overflow-y-auto lg:p-6")}>
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="flex flex-wrap items-center gap-2 font-heading text-xl font-extrabold md:text-2xl">
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

          <ul
            className={cn(
              "mt-3 grid grid-cols-2 gap-1.5 md:mt-4",
              cheio &&
                "lg:mt-5 lg:gap-2.5 [&_.lab-aluno]:lg:py-3 [&_.lab-aluno_.block.text-xs]:lg:text-base",
            )}
            aria-label="Alunos no laboratório"
          >
            {g.alunos.map((a, i) => {
              const cor = serieClasses(serieIndexPorNumero(a.turmaRotulo));
              const foto = fotoDe(a.id, a.turmaId);
              return (
                <li
                  key={a.sessaoId}
                  style={{ animationDelay: `${Math.min(i, 14) * 60}ms` }}
                  className="lab-aluno flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-2 py-1.5 transition-colors hover:bg-white/[0.11] md:gap-3 md:px-3 md:py-2"
                >
                  <span
                    className={`relative flex size-8 shrink-0 md:size-9 items-center justify-center rounded-full text-xs font-extrabold ring-1 ring-white/25 ${cor.bg} ${cor.text}`}
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
                    <span className="block text-xs font-semibold md:text-sm leading-snug [overflow-wrap:anywhere]">
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
