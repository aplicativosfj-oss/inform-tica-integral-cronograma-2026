import { CalendarClock, Clock3, HeartHandshake, Users2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppStore } from "@/lib/app-store";
import { fetchPresencasDoDia, fetchUltimaParticipacao } from "@/lib/presencas";
import {
  gruposFromPresencas,
  gruposPorVisita,
  proximasDatasDoDia,
  selecionarAlunosDoDia,
  toDateKey,
} from "@/lib/schedule-engine";
import type { Assignment } from "@/lib/types";
import alunosImg1 from "@/assets/alunos-1.jpg";
import alunosImg2 from "@/assets/alunos-2.jpg";
import alunosImg3 from "@/assets/alunos-3.jpg";
import alunosHeroImg from "@/assets/alunos-hero.jpg";
import alunoJogoImg from "@/assets/image2.jpeg";
import laboratorioTurmaFotoImg from "@/assets/image3.png";
import agendaHeroImg from "@/assets/image6.jpeg";
import coordenacaoHeroImg from "@/assets/image7.jpeg";
import alunoSorridenteImg from "@/assets/image10.jpeg";
import laboratorioGenericoImg from "@/assets/laboratorio-informatica-turma.jpg";

function toMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  return Number(h ?? 0) * 60 + Number(m ?? 0);
}

function toHHMM(totalMinutos: number): string {
  const h = Math.floor(totalMinutos / 60);
  const m = totalMinutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Janela de horário de um grupo dentro da visita da turma — ex.: grupo 2 de uma visita 07:30–09:00 em rodadas de 30min é 08:00–08:30. */
function horarioDoGrupo(indice: number, assignment: Assignment, duracaoGrupoMinutos: number) {
  const inicioVisita = toMinutos(assignment.slot.inicio);
  const fimVisita = toMinutos(assignment.slot.fim);
  const inicio = inicioVisita + indice * duracaoGrupoMinutos;
  const fim = Math.min(fimVisita, inicio + duracaoGrupoMinutos);
  return { inicio: toHHMM(inicio), fim: toHHMM(fim) };
}

// Fotos reais da escola (não stock) — sem turma cadastrada ainda tem foto
// própria, então cada uma pega uma imagem diferente deste acervo, sempre a
// mesma pra ela (hash estável do id), em vez de todas caindo na mesma.
const FOTOS_TURMA = [
  alunosHeroImg,
  laboratorioTurmaFotoImg,
  alunosImg1,
  agendaHeroImg,
  alunosImg2,
  coordenacaoHeroImg,
  alunoJogoImg,
  alunosImg3,
  alunoSorridenteImg,
  laboratorioGenericoImg,
];

function fotoDaTurma(turmaId: string, imagemPropria: string | undefined): string {
  if (imagemPropria) return imagemPropria;
  let hash = 0;
  for (let i = 0; i < turmaId.length; i += 1) hash = (hash * 31 + turmaId.charCodeAt(i)) >>> 0;
  return FOTOS_TURMA[hash % FOTOS_TURMA.length]!;
}

// Cada rodada ganha uma cor própria — não é só um número, é uma faixa de
// cor que o pai/professor reconhece de relance, igual uma linha de metrô.
const CORES_GRUPO = [
  { faixa: "bg-sky-600", badge: "bg-sky-600/15 text-sky-700 dark:text-sky-300" },
  { faixa: "bg-amber-600", badge: "bg-amber-600/15 text-amber-700 dark:text-amber-300" },
  { faixa: "bg-emerald-600", badge: "bg-emerald-600/15 text-emerald-700 dark:text-emerald-300" },
  { faixa: "bg-violet-600", badge: "bg-violet-600/15 text-violet-700 dark:text-violet-300" },
  { faixa: "bg-rose-600", badge: "bg-rose-600/15 text-rose-700 dark:text-rose-300" },
];

interface PreviaCalculada {
  grupos: ReturnType<typeof selecionarAlunosDoDia>["grupos"];
  semDadosDeFrequencia: boolean;
}

// Cache em memória, só desta aba/sessão: depois de calculada uma vez, a
// prévia de uma turma+data fica travada nesse resultado pelo resto da
// sessão — sem isso, reabrir o mesmo diálogo buscava tudo de novo e, numa
// rede lenta (o cálculo tem um limite de 6s antes de desistir do histórico
// de presença), podia mostrar uma ordem diferente na segunda vez. Isso não
// muda o cronograma real (turma/horário/grupo misto já são 100% fixos por
// semana) — só evita que essa prévia pareça "mudar sozinha".
const previaCache = new Map<string, PreviaCalculada>();

/**
 * Preview of which students are expected on a given (usually future) date —
 * computed live from the same fairness queue used for the real daily roll
 * call, but not written anywhere. It's a forecast, not a commitment: the
 * actual list on the day can shift with absences or schedule changes.
 *
 * Shared between the homepage and the public agenda page so both offer the
 * same "click a card to see who's coming" experience.
 */
export function PreviaAlunosDialog({
  assignment,
  data,
  onOpenChange,
}: {
  assignment: Assignment | null;
  data: Date;
  onOpenChange: (open: boolean) => void;
}) {
  const { config } = useAppStore();
  const [grupos, setGrupos] = useState<ReturnType<typeof selecionarAlunosDoDia>["grupos"] | null>(
    null,
  );
  const [carregando, setCarregando] = useState(false);
  const [semDadosDeFrequencia, setSemDadosDeFrequencia] = useState(false);

  // Próximas datas reais (não só o nome do dia da semana) em que esta turma
  // volta a ter aula neste mesmo horário, para o público saber exatamente
  // quando — não só "toda Segunda", mas "dia 22/09, 29/09...".
  const proximasDatas = useMemo(() => {
    if (!assignment) return [];
    const depoisDesta = new Date(data);
    depoisDesta.setDate(depoisDesta.getDate() + 1);
    return proximasDatasDoDia(assignment.dia, depoisDesta, 4);
  }, [assignment, data]);

  useEffect(() => {
    if (!assignment) {
      setGrupos(null);
      setSemDadosDeFrequencia(false);
      return;
    }
    const dateKey = toDateKey(data);
    const chaveCache = `${assignment.turma.id}|${dateKey}`;

    // Já calculamos essa turma+data nesta sessão: usa o mesmo resultado em
    // vez de buscar de novo, pra prévia nunca parecer mudar sozinha entre
    // uma abertura e outra do diálogo.
    const emCache = previaCache.get(chaveCache);
    if (emCache) {
      setGrupos(emCache.grupos);
      setSemDadosDeFrequencia(emCache.semDadosDeFrequencia);
      setCarregando(false);
      return;
    }

    let cancelled = false;
    setCarregando(true);
    setSemDadosDeFrequencia(false);

    // Se o Supabase demorar demais ou falhar (rede indisponível, bloqueio,
    // etc.), ainda mostramos uma prévia — só sem levar em conta o histórico
    // de frequência — em vez de deixar o diálogo girando para sempre.
    const timeout = new Promise<Map<string, string>>((resolve) =>
      setTimeout(() => resolve(new Map()), 6000),
    );

    fetchPresencasDoDia(assignment.turma.id, dateKey)
      .catch(() => [])
      .then((registradas) => {
        if (cancelled) return;
        // Já existe chamada real registrada para essa turma/data (ex: uma
        // aula excepcional com número diferente de alunos): usa ela em vez
        // de recalcular pela fila de prioridade.
        if (registradas.length > 0) {
          const gruposReais = gruposFromPresencas(assignment.turma, registradas);
          previaCache.set(chaveCache, { grupos: gruposReais, semDadosDeFrequencia: false });
          setGrupos(gruposReais);
          return;
        }
        return Promise.race([fetchUltimaParticipacao(assignment.turma.id), timeout])
          .catch(() => new Map<string, string>())
          .then((ultima) => {
            if (cancelled) return;
            const semDados = ultima.size === 0;
            setSemDadosDeFrequencia(semDados);
            const selecao = selecionarAlunosDoDia(
              assignment.turma,
              ultima,
              config.numeroComputadores,
              gruposPorVisita(config),
            );
            previaCache.set(chaveCache, {
              grupos: selecao.grupos,
              semDadosDeFrequencia: semDados,
            });
            setGrupos(selecao.grupos);
          });
      })
      .finally(() => {
        if (!cancelled) setCarregando(false);
      });
    return () => {
      cancelled = true;
    };
  }, [assignment, data, config]);

  return (
    <Dialog open={assignment !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl [&>button]:z-10 [&>button]:rounded-full [&>button]:bg-black/35 [&>button]:text-white [&>button]:opacity-100 [&>button]:backdrop-blur-sm [&>button]:hover:bg-black/50">
        {assignment ? (
          <>
            {/* Hero: foto da turma (ou uma genérica do laboratório), nome e data
                sobrepostos num degradê — dá contexto visual sem inflar a janela:
                altura fixa e curta, o resto do conteúdo rola por baixo dela. O X
                de fechar padrão fica branco sobre um círculo escuro (acima),
                pra continuar legível em cima da foto. */}
            <div className="relative h-28 shrink-0 overflow-hidden sm:h-32">
              <img
                src={fotoDaTurma(assignment.turma.id, assignment.turma.imagem)}
                alt=""
                aria-hidden
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
                <DialogHeader className="items-start gap-0.5 text-left">
                  <DialogTitle className="text-lg font-semibold text-white drop-shadow-sm">
                    {assignment.turma.serie} &quot;{assignment.turma.letra}&quot;
                  </DialogTitle>
                  <p className="text-xs text-white/85 drop-shadow-sm first-letter:uppercase">
                    {data.toLocaleDateString("pt-BR", {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                    })}
                  </p>
                </DialogHeader>
                <span className="mb-0.5 flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 font-mono text-xs font-medium text-white backdrop-blur-sm">
                  <Clock3 className="size-3.5" />
                  {assignment.slot.inicio}–{assignment.slot.fim}
                </span>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
              <p className="text-sm text-muted-foreground">
                Prof(a). regente{" "}
                <span className="text-foreground">{assignment.turma.professorRegente}</span>
              </p>

              {proximasDatas.length > 0 ? (
                <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarClock className="size-3.5 shrink-0 text-primary" />
                  Próximas datas desta turma nesse horário:{" "}
                  {proximasDatas
                    .map((d) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }))
                    .join(", ")}
                </p>
              ) : null}

              {carregando ? (
                <p className="text-sm text-muted-foreground">Calculando quem vai participar...</p>
              ) : grupos && grupos.some((g) => g.alunos.length > 0) ? (
                <div className="flex flex-col gap-3">
                  {grupos.map((grupo) => {
                    const horario = horarioDoGrupo(
                      grupo.indice,
                      assignment,
                      config.duracaoGrupoMinutos,
                    );
                    const cor = CORES_GRUPO[grupo.indice % CORES_GRUPO.length]!;
                    return (
                      <div
                        key={grupo.indice}
                        className="flex overflow-hidden rounded-xl border border-border/60"
                      >
                        {/* Faixa de cor própria por grupo — reconhecível de relance,
                            sem precisar ler o número. */}
                        <div className={`w-1.5 shrink-0 ${cor.faixa}`} aria-hidden />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 px-3 py-2">
                            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                              <span
                                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${cor.faixa}`}
                              >
                                {grupo.indice + 1}
                              </span>
                              Grupo {grupo.indice + 1}
                            </span>
                            <span
                              className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-mono text-xs font-bold ${cor.badge}`}
                            >
                              <Clock3 className="size-3.5 shrink-0" />
                              {horario.inicio} – {horario.fim}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 gap-1 px-3 pb-2.5 sm:grid-cols-2">
                            {grupo.alunos.map((aluno, indiceAluno) => (
                              <div
                                key={aluno.id}
                                className="flex min-w-0 items-center gap-2 rounded-lg bg-muted/40 px-2 py-1.5"
                              >
                                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-background text-[10px] font-semibold text-muted-foreground ring-1 ring-border/60">
                                  {indiceAluno + 1}
                                </span>
                                <span className="truncate text-xs text-foreground">
                                  {aluno.nome}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <HeartHandshake className="mt-0.5 size-3.5 shrink-0" />
                    {semDadosDeFrequencia
                      ? "Prévia em ordem simples (ainda sem histórico de frequência) — pode mudar até o dia."
                      : "Prévia calculada pela fila de prioridade atual — pode mudar até o dia se houver faltas ou ajustes na programação."}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Esta turma ainda não tem alunos cadastrados.
                </p>
              )}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
