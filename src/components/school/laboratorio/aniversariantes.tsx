import { Cake } from "lucide-react";

import { infoAniversario } from "@/lib/aniversario";
import { useAppStore } from "@/lib/app-store";
import { hojeNaEscola } from "@/lib/laboratorio";

const rotuloTurma = (serie: string, letra: string) => `${serie.replace(/\D+/g, "")}º ${letra}`;

/** Selo "aniversariante" para pôr ao lado do nome do aluno que faz aniversário hoje. */
export function SeloAniversario({ nascimento }: { nascimento: string | undefined }) {
  if (!infoAniversario(nascimento, hojeNaEscola())?.hoje) return null;
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-600 to-amber-400 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm"
      title="Hoje é aniversário!"
    >
      <Cake className="size-3" aria-hidden /> aniversariante
    </span>
  );
}

/** Aniversariantes de hoje em todas as turmas (só no painel de gestão). */
export function AniversariantesHoje() {
  const { turmas } = useAppStore();
  const hoje = hojeNaEscola();
  const lista = turmas.flatMap((t) =>
    t.alunos
      .map((a) => ({ a, t, info: infoAniversario(a.nascimento, hoje) }))
      .filter((x) => x.info?.hoje),
  );
  if (lista.length === 0) return null;
  return (
    <section
      aria-label="Aniversariantes de hoje"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-600 via-rose-500 to-amber-400 p-4 text-white shadow-lg"
    >
      <span
        aria-hidden
        className="lab-varredura absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/30 to-transparent"
      />
      <div className="relative flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="flex items-center gap-2 font-heading text-base font-extrabold">
          <Cake className="lab-brilho size-6" aria-hidden />
          {lista.length === 1 ? "Aniversariante do dia" : `${lista.length} aniversariantes do dia`}
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {lista.map(({ a, t, info }) => (
            <li
              key={a.id}
              className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur"
            >
              {a.nome} · {rotuloTurma(t.serie, t.letra)} · {info!.anos}{" "}
              {info!.anos === 1 ? "ano" : "anos"}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
