import { ArrowLeft, HeartHandshake, Printer, School, Volume2 } from "lucide-react";
import { useMemo, useState } from "react";

import {
  ATIVIDADES_LP,
  SERIES,
  type AtividadeLP,
  type Serie,
} from "@/components/school/ferramentas/atividades-lp-dados";
import { Quiz, type Questao } from "@/components/school/ferramentas/quiz";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { falar } from "@/lib/voz";
import { cn } from "@/lib/utils";

/** Embaralha as opções mantendo a resposta certa — no banco ela fica sempre na 1ª posição. */
function embaralhar(questoes: Questao[]): Questao[] {
  return questoes.map((questao) => {
    const ordem = questao.opcoes.map((_, i) => i).sort(() => Math.random() - 0.5);
    return {
      ...questao,
      opcoes: ordem.map((i) => questao.opcoes[i]!),
      respostaCorreta: ordem.indexOf(questao.respostaCorreta),
    };
  });
}

// A leitura usa a mesma escolha de voz do resto da alfabetização (ver
// lib/voz.ts): sem isso, esta tela caía na voz padrão do sistema — em geral
// a mais robótica das instaladas — em vez da voz mais natural disponível.
function ouvir(linhas: string[]) {
  falar(linhas.join(" "));
}

function Secao({
  titulo,
  itens,
  icone,
}: {
  titulo: string;
  itens: string[];
  icone: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
          {icone} {titulo}
        </h3>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted-foreground">
          {itens.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function DetalheAtividade({ atividade, voltar }: { atividade: AtividadeLP; voltar: () => void }) {
  const [inclusiva, setInclusiva] = useState(false);
  const questoes = useMemo(
    () => embaralhar(inclusiva ? atividade.adaptada.questoes : atividade.questoes),
    [atividade, inclusiva],
  );
  const linhas = inclusiva
    ? (atividade.adaptada.textoCurto ?? atividade.texto?.paragrafos)
    : atividade.texto?.paragrafos;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={voltar}
        >
          <ArrowLeft className="size-4" /> Voltar às atividades
        </Button>
        <div className="flex gap-2">
          <Button
            variant={inclusiva ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            aria-pressed={inclusiva}
            onClick={() => setInclusiva((v) => !v)}
          >
            <HeartHandshake className="size-3.5" />
            {inclusiva ? "Versão adaptada (ativa)" : "Versão adaptada"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="size-3.5" /> Imprimir
          </Button>
        </div>
      </div>

      <div>
        <Badge variant="secondary" className="mb-2">
          {SERIES.find((s) => s.serie === atividade.serie)?.nome} · Língua Portuguesa
        </Badge>
        <h2 className="text-xl font-bold text-foreground">
          {atividade.emoji} {atividade.titulo}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          <strong>Objetivo:</strong> {atividade.objetivo}
        </p>
        <p className="text-xs text-muted-foreground">Inspirada no acervo: {atividade.origem}</p>
      </div>

      {linhas && linhas.length > 0 ? (
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-semibold text-foreground">
                {inclusiva ? "Texto curtinho" : atividade.texto?.titulo}
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 print:hidden"
                onClick={() => ouvir(linhas)}
              >
                <Volume2 className="size-3.5" /> Ouvir
              </Button>
            </div>
            <div
              className={cn(
                "flex flex-col gap-2",
                inclusiva ? "text-2xl leading-snug" : "text-base leading-relaxed",
              )}
            >
              {linhas.map((p, i) => (
                <p key={i} className="text-foreground">
                  {p}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className={cn("print:hidden", inclusiva && "text-lg")}>
        <Quiz key={`${atividade.id}-${inclusiva}`} questoes={questoes} />
      </div>

      {inclusiva ? (
        <Secao
          titulo="Dicas para o mediador / cuidador"
          icone={<HeartHandshake className="size-4 text-rose-500" />}
          itens={atividade.adaptada.dicasMediador}
        />
      ) : null}
      <Secao
        titulo="Para fazer em sala (fora da tela)"
        icone={<School className="size-4 text-primary" />}
        itens={atividade.emSala}
      />
    </div>
  );
}

/**
 * Atividades de Língua Portuguesa do 1º ao 5º ano, adaptadas do acervo do
 * grupo de professores de LP (Drive). Cada atividade tem versão comum e
 * versão adaptada para crianças com deficiência / NEE.
 */
export function AtividadesLP() {
  const [serie, setSerie] = useState<Serie>(1);
  const [aberta, setAberta] = useState<AtividadeLP | null>(null);

  if (aberta) return <DetalheAtividade atividade={aberta} voltar={() => setAberta(null)} />;

  const info = SERIES.find((s) => s.serie === serie)!;
  const lista = ATIVIDADES_LP.filter((a) => a.serie === serie);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Série">
        {SERIES.map((s) => (
          <Button
            key={s.serie}
            role="tab"
            aria-selected={serie === s.serie}
            variant={serie === s.serie ? "default" : "outline"}
            size="sm"
            onClick={() => setSerie(s.serie)}
          >
            {s.nome}
          </Button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        <strong className="text-foreground">{info.nome}:</strong> {info.foco}. Toda atividade tem
        uma <strong>versão adaptada</strong> para crianças com deficiência ou necessidades
        especiais.
      </p>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {lista.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAberta(a)}
            className="group flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-card p-3.5 text-left shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xl">
              {a.emoji}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                {a.titulo}
              </p>
              <p className="text-xs text-muted-foreground">{a.objetivo}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
