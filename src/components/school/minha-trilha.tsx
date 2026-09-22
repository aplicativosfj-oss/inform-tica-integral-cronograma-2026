import { Activity, CalendarCheck, Loader2, Target } from "lucide-react";
import { useEffect, useState } from "react";

import {
  aproveitamento,
  diasAtivos,
  fetchTrilha,
  resumirPorFerramenta,
  type Passo,
} from "@/lib/trilha-aluno";
import { agoraNaEscola } from "@/lib/schedule-engine";

/**
 * "Minha trilha": o que a criança já fez, mostrado para ela mesma.
 *
 * Não é boletim. Não tem nota, não tem vermelho, não compara com colega
 * nenhum. Mostra três coisas que dão orgulho e ajudam a continuar: em quantos
 * dias ela apareceu, quantas atividades abriu e como foi nas que pontuam.
 *
 * O professor vê a mesma trilha no relatório da turma, com outro olhar.
 */

function quando(iso: string): string {
  const d = new Date(iso);
  const hoje = agoraNaEscola();
  const dias = Math.floor((hoje.getTime() - d.getTime()) / 86400000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function MinhaTrilha({ alunoId, pin }: { alunoId: string; pin: string }) {
  const [passos, setPassos] = useState<Passo[] | null>(null);
  const [somenteLocal, setSomenteLocal] = useState(false);

  useEffect(() => {
    let vivo = true;
    void fetchTrilha(alunoId, pin).then((t) => {
      if (!vivo) return;
      setPassos(t.passos);
      setSomenteLocal(t.somenteLocal);
    });
    return () => {
      vivo = false;
    };
  }, [alunoId, pin]);

  if (passos === null) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Carregando sua trilha…
      </p>
    );
  }

  if (!passos.length) {
    return (
      <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        Sua trilha começa na primeira atividade que você abrir. Escolha uma ali em cima!
      </p>
    );
  }

  const resumo = resumirPorFerramenta(passos);
  const dias = diasAtivos(passos);
  const media = aproveitamento(passos);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <CalendarCheck className="mx-auto mb-1 size-4 text-primary" />
          <p className="text-2xl font-bold text-foreground">{dias}</p>
          <p className="text-[11px] leading-tight text-muted-foreground">
            {dias === 1 ? "dia de estudo" : "dias de estudo"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <Activity className="mx-auto mb-1 size-4 text-primary" />
          <p className="text-2xl font-bold text-foreground">{passos.length}</p>
          <p className="text-[11px] leading-tight text-muted-foreground">atividades feitas</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <Target className="mx-auto mb-1 size-4 text-primary" />
          <p className="text-2xl font-bold text-foreground">{media === null ? "—" : `${media}%`}</p>
          <p className="text-[11px] leading-tight text-muted-foreground">de acertos</p>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          O que você mais usou
        </p>
        <ul className="flex flex-col gap-1">
          {resumo.slice(0, 6).map((r) => (
            <li
              key={r.ferramenta}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs"
            >
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                {r.titulo}
              </span>
              {r.total > 0 && (
                <span className="shrink-0 text-muted-foreground">
                  {r.acertos}/{r.total}
                </span>
              )}
              <span className="shrink-0 text-muted-foreground">
                {r.vezes}× · {quando(r.ultimoUso)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {somenteLocal && (
        <p className="text-[11px] text-muted-foreground">
          Mostrando o que foi feito neste computador: a trilha ainda não está ligada ao banco de
          dados da escola.
        </p>
      )}
    </div>
  );
}
