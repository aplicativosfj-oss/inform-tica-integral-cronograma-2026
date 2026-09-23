import { Lightbulb } from "lucide-react";
import { useState } from "react";

import { CampoNumero } from "@/components/school/ferramentas/controles";
import {
  AREAS_DIA_A_DIA,
  type ExemploDiaADia,
} from "@/components/school/ferramentas/dia-a-dia-dados";
import { cn } from "@/lib/utils";

function valoresPadrao(ex: ExemploDiaADia): Record<string, number> {
  return Object.fromEntries(ex.campos.map((c) => [c.id, c.padrao]));
}

/**
 * Matemática no dia a dia: situações reais (troco, receita, desconto, bateria
 * do celular, piso da sala…) em que a criança troca os números e vê a conta
 * explicada passo a passo. Organizada por área do conteúdo.
 */
export function DiaADia() {
  const [areaId, setAreaId] = useState(AREAS_DIA_A_DIA[0]!.id);
  const area = AREAS_DIA_A_DIA.find((a) => a.id === areaId) ?? AREAS_DIA_A_DIA[0]!;
  const [exemploId, setExemploId] = useState(area.exemplos[0]!.id);
  const exemplo = area.exemplos.find((e) => e.id === exemploId) ?? area.exemplos[0]!;
  const [valores, setValores] = useState<Record<string, number>>(valoresPadrao(exemplo));
  const [corA, corB] = area.cores;

  function escolherArea(id: string) {
    const nova = AREAS_DIA_A_DIA.find((a) => a.id === id)!;
    setAreaId(id);
    setExemploId(nova.exemplos[0]!.id);
    setValores(valoresPadrao(nova.exemplos[0]!));
  }

  function escolherExemplo(ex: ExemploDiaADia) {
    setExemploId(ex.id);
    setValores(valoresPadrao(ex));
  }

  const resultado = exemplo.resolver(valores);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Áreas">
        {AREAS_DIA_A_DIA.map((a) => {
          const ativa = a.id === area.id;
          return (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={ativa}
              onClick={() => escolherArea(a.id)}
              style={
                ativa
                  ? { backgroundImage: `linear-gradient(135deg, ${a.cores[0]}, ${a.cores[1]})` }
                  : { borderColor: a.cores[0] }
              }
              className={cn(
                "cursor-pointer rounded-full border-2 px-4 py-2 text-sm font-semibold transition-transform hover:scale-105",
                ativa ? "border-transparent text-white shadow-md" : "text-foreground",
              )}
            >
              <span aria-hidden>{a.emoji}</span> {a.nome}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {area.exemplos.map((ex) => {
          const ativo = ex.id === exemplo.id;
          return (
            <button
              key={ex.id}
              type="button"
              aria-pressed={ativo}
              onClick={() => escolherExemplo(ex)}
              style={ativo ? undefined : { borderColor: corA }}
              className={cn(
                "cursor-pointer rounded-full border-2 px-3 py-1.5 text-sm transition-colors",
                ativo ? "text-white" : "text-foreground",
              )}
            >
              <span aria-hidden>{ex.emoji}</span> {ex.titulo}
            </button>
          );
        })}
      </div>

      <section
        className="flex flex-col gap-4 rounded-2xl border-2 bg-background/80 p-5"
        style={{ borderColor: corA }}
      >
        <p className="text-base font-semibold text-foreground">
          <span aria-hidden className="mr-1 text-2xl">
            {exemplo.emoji}
          </span>
          {exemplo.pergunta}
        </p>

        <div className="flex flex-wrap items-end gap-4">
          {exemplo.campos.map((c) => (
            <label key={c.id} className="flex flex-col gap-1 text-sm text-muted-foreground">
              {c.rotulo}
              <span className="flex items-center gap-2">
                <CampoNumero
                  valor={valores[c.id] ?? c.padrao}
                  aoMudar={(v) => setValores((p) => ({ ...p, [c.id]: Number.isNaN(v) ? 0 : v }))}
                  min={c.min ?? 0}
                  max={c.max ?? 100000}
                  rotulo={c.rotulo}
                  tamanho="md"
                  largura="w-24"
                  comBotoes={false}
                />
                {c.sufixo ? <span>{c.sufixo}</span> : null}
              </span>
            </label>
          ))}
        </div>

        <div
          className="rounded-xl p-4 text-white shadow-md"
          style={{ backgroundImage: `linear-gradient(135deg, ${corA}, ${corB})` }}
        >
          <p className="text-2xl font-bold leading-tight">{resultado.destaque}</p>
        </div>

        <ol className="flex flex-col gap-1.5 text-base text-foreground">
          {resultado.passos.map((p, i) => (
            <li key={i} className="flex gap-2">
              <span
                aria-hidden
                className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: corB }}
              >
                {i + 1}
              </span>
              <span>{p}</span>
            </li>
          ))}
        </ol>

        {resultado.dica ? (
          <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-foreground">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
            {resultado.dica}
          </p>
        ) : null}
      </section>
    </div>
  );
}
