import {
  Ban,
  CalendarDays,
  GraduationCap,
  Hand,
  Lock,
  MonitorSmartphone,
  UserX,
  X,
} from "lucide-react";
import { useMemo } from "react";

import { useAppStore } from "@/lib/app-store";
import {
  foiAoLab,
  hojeNaEscola,
  inicioDaSemana,
  nomeExibido,
  type GrupoLab,
  type SessaoLab,
} from "@/lib/laboratorio";
import { idadeEmAnos } from "@/lib/profissional-acesso";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";
import { cn } from "@/lib/utils";

type AlunoDoGrupo = GrupoLab["alunos"][number];

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex"];

function somarDias(chave: string, n: number) {
  const [y, m, d] = chave.split("-").map(Number);
  const data = new Date(Date.UTC(y!, m! - 1, d!));
  data.setUTCDate(data.getUTCDate() + n);
  return data.toISOString().slice(0, 10);
}

const dataCurta = (k: string) => `${k.slice(8, 10)}/${k.slice(5, 7)}`;

/**
 * Ficha rápida do aluno, aberta ao tocar no nome dele na tela cheia da aula.
 * Para o público mostra só o primeiro nome, a turma e quantas vezes foi ao
 * laboratório. Com login de professor aparecem também o nome completo, a
 * foto, a idade e as faltas, impedimentos e recusas: são dados de criança,
 * então ficam fora da TV quando ninguém da escola está conectado.
 */
export function FichaTelaCheia({
  aluno,
  historico,
  logado,
  aoFechar,
}: {
  aluno: AlunoDoGrupo;
  historico: SessaoLab[];
  logado: boolean;
  aoFechar: () => void;
}) {
  const { turmas, config } = useAppStore();
  const turma = turmas.find((t) => t.id === aluno.turmaId);
  const cadastro = turma?.alunos.find((a) => a.id === aluno.id);
  const cor = serieClasses(serieIndexPorNumero(aluno.turmaRotulo));
  const idade = logado ? idadeEmAnos(cadastro?.nascimento) : null;
  const foto = logado ? cadastro?.foto : undefined;

  const dados = useMemo(() => {
    const hoje = hojeNaEscola();
    const segunda = inicioDaSemana(hoje);
    const mes = hoje.slice(0, 7);
    const doAluno = historico.filter(
      (s) => s.turmaId === aluno.turmaId && s.alunoId === aluno.id && !s.semMarcacao,
    );
    const idas = doAluno.filter(foiAoLab);
    const diasComIda = new Set(idas.map((s) => s.data));
    const doMes = doAluno.filter((s) => s.data.startsWith(mes));
    const ultima = idas
      .map((s) => s.data)
      .filter((d) => d < hoje)
      .sort()
      .at(-1);
    return {
      semana: new Set(idas.filter((s) => s.data >= segunda).map((s) => s.data)).size,
      mes: new Set(idas.filter((s) => s.data.startsWith(mes)).map((s) => s.data)).size,
      faltas: doMes.filter((s) => s.ausencia === "faltou").length,
      impedido: doMes.filter((s) => s.ausencia === "nao_autorizado").length,
      recusou: doMes.filter((s) => s.ausencia === "recusou").length,
      ultima,
      semanaDias: DIAS.map((nome, i) => {
        const chave = somarDias(segunda, i);
        return { nome, chave, foi: diasComIda.has(chave), futuro: chave > hoje };
      }),
    };
  }, [historico, aluno.id, aluno.turmaId]);

  const iniciais = aluno.nome
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .filter((_, i, l) => i === 0 || i === l.length - 1)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-[#050b1a]/70 p-4 backdrop-blur-md"
      onClick={aoFechar}
      role="presentation"
    >
      <article
        role="dialog"
        aria-modal="true"
        aria-label={`Ficha de ${nomeExibido(aluno.nome, logado)}`}
        onClick={(e) => e.stopPropagation()}
        className="tc-ficha relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-5 text-white shadow-2xl backdrop-blur-2xl sm:p-6"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-emerald-400/25 blur-3xl"
        />
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar a ficha"
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/10 transition hover:bg-white/20"
        >
          <X className="size-4" />
        </button>

        <header className="relative flex items-center gap-4 pr-8">
          <span
            className={cn(
              "flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-2xl font-extrabold ring-2 ring-white/30 sm:size-24",
              cor.bg,
              cor.text,
            )}
          >
            {foto ? <img src={foto} alt="" className="size-full object-cover" /> : iniciais}
          </span>
          <div className="min-w-0">
            <p className="font-heading text-xl font-extrabold leading-tight sm:text-2xl">
              {logado ? aluno.nome : nomeExibido(aluno.nome, false)}
            </p>
            <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm">
              <span className={cn("rounded-md px-2 py-0.5 font-extrabold", cor.bg, cor.text)}>
                {aluno.turmaRotulo}
              </span>
              {idade !== null ? (
                <span className="rounded-md bg-white/15 px-2 py-0.5 font-semibold">
                  {idade} anos
                </span>
              ) : null}
            </p>
          </div>
        </header>

        <dl className="relative mt-4 space-y-1.5 text-sm">
          {turma?.professorRegente ? (
            <div className="flex items-center gap-2 text-white/85">
              <GraduationCap className="size-4 shrink-0 text-amber-300" aria-hidden />
              <dt className="sr-only">Professor(a) regente</dt>
              <dd>Regente: {turma.professorRegente}</dd>
            </div>
          ) : null}
          {config.professorInformatica ? (
            <div className="flex items-center gap-2 text-white/85">
              <MonitorSmartphone className="size-4 shrink-0 text-emerald-300" aria-hidden />
              <dt className="sr-only">Professor de informática</dt>
              <dd>Informática: Prof. {config.professorInformatica}</dd>
            </div>
          ) : null}
        </dl>

        {/* Idas ao laboratório: números grandes e a semana em quadrinhos. */}
        <div className="relative mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="font-heading text-3xl font-extrabold tabular-nums text-emerald-300">
              {dados.semana}
            </p>
            <p className="text-xs text-white/70">
              {dados.semana === 1 ? "ida" : "idas"} nesta semana
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="font-heading text-3xl font-extrabold tabular-nums text-sky-300">
              {dados.mes}
            </p>
            <p className="text-xs text-white/70">{dados.mes === 1 ? "ida" : "idas"} neste mês</p>
          </div>
        </div>
        <ul className="relative mt-2 grid grid-cols-5 gap-1.5" aria-label="Semana no laboratório">
          {dados.semanaDias.map((d) => (
            <li
              key={d.chave}
              className={cn(
                "flex flex-col items-center rounded-xl border py-1.5 text-[11px] font-semibold",
                d.foi
                  ? "border-emerald-300/60 bg-emerald-400/25 text-emerald-100"
                  : d.futuro
                    ? "border-dashed border-white/15 text-white/40"
                    : "border-white/10 bg-white/5 text-white/60",
              )}
            >
              {d.nome}
              <span className="text-[10px] font-normal">{d.foi ? "foi" : d.futuro ? "" : "—"}</span>
            </li>
          ))}
        </ul>
        {dados.ultima ? (
          <p className="relative mt-2 flex items-center gap-1.5 text-xs text-white/65">
            <CalendarDays className="size-3.5" aria-hidden /> Última ida antes de hoje:{" "}
            {dataCurta(dados.ultima)}
          </p>
        ) : null}

        {logado ? (
          <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
            {(
              [
                [UserX, dados.faltas, "faltas", "text-red-300"],
                [Ban, dados.impedido, "impedido", "text-amber-300"],
                [Hand, dados.recusou, "não quis ir", "text-violet-300"],
              ] as const
            ).map(([Icone, n, rotulo, cls]) => (
              <div
                key={rotulo}
                className="rounded-2xl border border-white/10 bg-black/20 px-2 py-2.5"
              >
                <Icone className={cn("mx-auto size-4", cls)} aria-hidden />
                <p className="mt-1 font-heading text-xl font-extrabold tabular-nums">{n}</p>
                <p className="text-[11px] leading-tight text-white/65">{rotulo} no mês</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="relative mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-white/70">
            <Lock className="size-4 shrink-0" aria-hidden />
            Foto, idade e faltas aparecem só para professores conectados.
          </p>
        )}
      </article>
    </div>
  );
}
