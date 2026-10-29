import { CalendarDays, ChevronDown, Radio } from "lucide-react";
import { useMemo, useState } from "react";

import fotoLaboratorio from "@/assets/laboratorio-informatica-turma.jpg";
import {
  agruparSessoes,
  dataNaEscola,
  estadoDaSessao,
  hojeNaEscola,
  horaNaEscola,
  inicioDaSemana,
  nomeExibido,
  type SessaoLab,
} from "@/lib/laboratorio";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";
import { cn } from "@/lib/utils";

const NOMES = ["Seg", "Ter", "Qua", "Qui", "Sex"];

function somarDias(chave: string, n: number) {
  const [y, m, d] = chave.split("-").map(Number);
  const data = new Date(Date.UTC(y!, m! - 1, d!));
  data.setUTCDate(data.getUTCDate() + n);
  return data.toISOString().slice(0, 10);
}

const dataCurta = (k: string) => `${k.slice(8, 10)}/${k.slice(5, 7)}`;

function Turma({ rotulo, pequena = false }: { rotulo: string; pequena?: boolean }) {
  const cor =
    rotulo === "Aula mista"
      ? { bg: "bg-white/20", text: "text-white" }
      : serieClasses(serieIndexPorNumero(rotulo));
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-extrabold",
        pequena ? "px-1 py-px text-[10px]" : "px-2 py-0.5 text-xs",
        cor.bg,
        cor.text,
      )}
    >
      {rotulo === "Aula mista" ? "Mista" : rotulo}
    </span>
  );
}

/**
 * A semana no laboratório, de segunda a sexta: um quadro compacto com as
 * turmas que foram em cada dia e, ao tocar num dia, as aulas com horário,
 * turma e quem participou. Recomeça sozinho toda segunda-feira.
 */
export function SemanaNoLaboratorio({
  sessoes,
  agora,
  logado,
}: {
  sessoes: SessaoLab[];
  agora: number;
  logado: boolean;
}) {
  const hoje = hojeNaEscola();
  const segunda = inicioDaSemana(hoje);
  const dias = NOMES.map((nome, i) => ({ nome, chave: somarDias(segunda, i) }));

  const porDia = useMemo(() => {
    const daSemana = sessoes.filter((s) => s.data >= segunda && s.data <= somarDias(segunda, 4));
    const mapa = new Map<string, ReturnType<typeof agruparSessoes>>();
    for (const g of agruparSessoes(daSemana)) {
      const d = dataNaEscola(new Date(g.inicio));
      mapa.set(d, [...(mapa.get(d) ?? []), g]);
    }
    for (const gs of mapa.values()) gs.sort((a, b) => a.inicio.localeCompare(b.inicio));
    return mapa;
  }, [sessoes, segunda]);

  const comAula = dias.filter((d) => (porDia.get(d.chave)?.length ?? 0) > 0);
  const padrao = porDia.get(hoje)?.length ? hoje : (comAula.at(-1)?.chave ?? hoje);
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const dia = escolhido ?? padrao;
  const [aberto, setAberto] = useState<string | null>(null);

  const totalAulas = [...porDia.values()].reduce((n, gs) => n + gs.length, 0);
  const totalAlunos = new Set(
    sessoes
      .filter((s) => s.data >= segunda && s.data <= somarDias(segunda, 4))
      .map((s) => `${s.turmaId}|${s.alunoId}`),
  ).size;
  const aulasDoDia = porDia.get(dia) ?? [];

  return (
    // Sempre escuro: foto do laboratório ao fundo e o quadro em vidro fosco.
    <section
      className="dark relative isolate flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/15 p-3 text-white sm:p-4"
      aria-label="A semana no laboratório"
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
        className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-950/80 via-ink/85 to-ink/95"
      />

      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-bold">
          <span className="flex size-8 items-center justify-center rounded-xl border border-white/20 bg-white/15 backdrop-blur-xl">
            <CalendarDays className="size-4 text-sun" aria-hidden />
          </span>
          <span>
            A semana no laboratório
            <span className="block text-xs font-medium text-white/65">
              {dataCurta(segunda)} a {dataCurta(somarDias(segunda, 4))} · recomeça toda segunda
            </span>
          </span>
        </h3>
        <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold tabular-nums backdrop-blur-xl">
          {totalAulas} aula{totalAulas === 1 ? "" : "s"} · {totalAlunos} aluno
          {totalAlunos === 1 ? "" : "s"}
        </span>
      </header>

      {/* segunda a sexta, lado a lado */}
      <div className="grid grid-cols-5 gap-1.5" role="tablist" aria-label="Dias da semana">
        {dias.map(({ nome, chave }) => {
          const gs = porDia.get(chave) ?? [];
          const turmas = [...new Set(gs.map((g) => g.turmaRotulo))];
          const ehHoje = chave === hoje;
          const futuro = chave > hoje;
          const ativo = chave === dia;
          return (
            <button
              key={chave}
              type="button"
              role="tab"
              aria-selected={ativo}
              onClick={() => {
                setEscolhido(chave);
                setAberto(null);
              }}
              className={cn(
                "flex min-h-[5.5rem] flex-col items-center gap-1 rounded-xl border px-1 py-2 text-center backdrop-blur-xl transition",
                ativo
                  ? "border-sun/70 bg-white/20 shadow-[inset_0_1px_0_rgb(255_255_255/0.25)]"
                  : futuro
                    ? "border-dashed border-white/15 bg-white/[0.04] text-white/55"
                    : "border-white/10 bg-white/[0.08] hover:bg-white/[0.14]",
              )}
            >
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  ehHoje ? "text-sun" : "text-white/65",
                )}
              >
                {ehHoje ? "Hoje" : nome}
              </span>
              <span className="text-lg font-extrabold leading-none tabular-nums">
                {chave.slice(8, 10)}
              </span>
              {turmas.length ? (
                <span className="flex flex-wrap justify-center gap-0.5">
                  {turmas.slice(0, 2).map((r) => (
                    <Turma key={r} rotulo={r} pequena />
                  ))}
                  {turmas.length > 2 ? (
                    <span className="text-[10px] font-bold text-white/75">
                      +{turmas.length - 2}
                    </span>
                  ) : null}
                </span>
              ) : (
                <span className="text-[10px] text-white/40">—</span>
              )}
            </button>
          );
        })}
      </div>

      {/* aulas do dia escolhido */}
      <div className="rounded-xl border border-white/15 bg-white/10 p-2.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.2)] backdrop-blur-xl backdrop-saturate-150">
        <p className="mb-2 px-1 text-xs font-semibold text-white/70">
          {dia === hoje ? "Hoje" : NOMES[dias.findIndex((d) => d.chave === dia)]}, {dataCurta(dia)}
        </p>
        {aulasDoDia.length === 0 ? (
          <p className="px-1 pb-1 text-sm text-white/60">
            {dia > hoje ? "Ainda sem aula marcada." : "Nenhuma aula neste dia."}
          </p>
        ) : (
          <ul className="space-y-1">
            {aulasDoDia.map((g) => {
              const presentes = g.alunos.filter((a) => a.ausencia === null && !a.semMarcacao);
              const aoVivo = estadoDaSessao(g, agora) === "ao-vivo";
              const abertoAqui = aberto === g.grupoId;
              return (
                <li key={g.grupoId}>
                  <button
                    type="button"
                    aria-expanded={abertoAqui}
                    onClick={() => setAberto(abertoAqui ? null : g.grupoId)}
                    className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-white/[0.12]"
                  >
                    <Turma rotulo={g.turmaRotulo} />
                    <span className="whitespace-nowrap tabular-nums text-white/80">
                      {horaNaEscola(g.inicio)}–{horaNaEscola(g.fim)}
                    </span>
                    {aoVivo ? (
                      <span className="flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-emerald-300">
                        <Radio className="size-3.5" aria-hidden />
                        <span className="max-sm:sr-only">ao vivo</span>
                      </span>
                    ) : null}
                    <span className="ml-auto whitespace-nowrap text-xs text-white/70">
                      {presentes.length} aluno{presentes.length === 1 ? "" : "s"}
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-white/60 transition-transform",
                        abertoAqui && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </button>
                  {abertoAqui ? (
                    <p className="px-2.5 pb-1 pt-1.5 text-xs leading-relaxed text-white/75">
                      {presentes.map((a) => nomeExibido(a.nome, logado)).join(", ") ||
                        "Ninguém registrado."}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
