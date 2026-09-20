import { CheckCircle2, RotateCcw, Trophy, XCircle } from "lucide-react";
import { type ReactNode, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface Questao {
  id: string;
  enunciado: string;
  /** Ilustração opcional (SVG, imagem) mostrada acima do enunciado. */
  ilustracao?: ReactNode;
  opcoes: string[];
  /** Índice (em `opcoes`) da resposta certa. */
  respostaCorreta: number;
  /** Mostrada depois de responder, explicando o porquê da resposta certa. */
  explicacao?: string;
}

/**
 * Motor genérico de exercício de múltipla escolha: uma pergunta por vez,
 * feedback imediato, barra de progresso e nota final com opção de refazer.
 * Reaproveitado por praticamente toda atividade de "conteúdo" (história,
 * geografia, gêneros textuais, frações, geometria...) — só muda o banco de
 * perguntas passado em `questoes`.
 */
export function Quiz({ questoes, corBotao = "" }: { questoes: Questao[]; corBotao?: string }) {
  const [indice, setIndice] = useState(0);
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [respondida, setRespondida] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [finalizado, setFinalizado] = useState(false);

  const questao = questoes[indice];

  function confirmar() {
    if (selecionada === null) return;
    setRespondida(true);
    if (selecionada === questao?.respostaCorreta) setAcertos((a) => a + 1);
  }

  function proxima() {
    if (indice + 1 >= questoes.length) {
      setFinalizado(true);
      return;
    }
    setIndice((i) => i + 1);
    setSelecionada(null);
    setRespondida(false);
  }

  function reiniciar() {
    setIndice(0);
    setSelecionada(null);
    setRespondida(false);
    setAcertos(0);
    setFinalizado(false);
  }

  if (questoes.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Nenhuma pergunta cadastrada ainda.
      </p>
    );
  }

  if (finalizado) {
    const percentual = Math.round((acertos / questoes.length) * 100);
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Trophy className="size-7" />
          </span>
          <p className="text-lg font-semibold text-foreground">
            Você acertou {acertos} de {questoes.length}!
          </p>
          <p className="text-sm text-muted-foreground">
            {percentual >= 80
              ? "Mandou muito bem! 🎉"
              : percentual >= 50
                ? "Muito bom, continue praticando!"
                : "Vale a pena revisar e tentar de novo."}
          </p>
          <Button onClick={reiniciar} className="mt-2 gap-1.5">
            <RotateCcw className="size-4" /> Refazer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!questao) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full bg-primary transition-all", corBotao)}
            style={{ width: `${((indice + (respondida ? 1 : 0)) / questoes.length) * 100}%` }}
          />
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {indice + 1}/{questoes.length}
        </span>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          {questao.ilustracao ? (
            <div className="flex justify-center">{questao.ilustracao}</div>
          ) : null}
          <p className="text-base font-medium text-foreground">{questao.enunciado}</p>
          <div className="flex flex-col gap-2">
            {questao.opcoes.map((opcao, i) => {
              const correta = i === questao.respostaCorreta;
              const marcada = i === selecionada;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={respondida}
                  onClick={() => setSelecionada(i)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 rounded-lg border p-3 text-left text-sm transition-colors disabled:cursor-default",
                    !respondida && marcada && "border-primary bg-primary/5",
                    !respondida && !marcada && "border-border/60 hover:bg-muted",
                    respondida && correta && "border-emerald-500 bg-emerald-500/10",
                    respondida && marcada && !correta && "border-destructive bg-destructive/10",
                    respondida && !marcada && !correta && "border-border/60 opacity-60",
                  )}
                >
                  {opcao}
                  {respondida && correta ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : respondida && marcada && !correta ? (
                    <XCircle className="size-4 shrink-0 text-destructive" />
                  ) : null}
                </button>
              );
            })}
          </div>
          {respondida && questao.explicacao ? (
            <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              {questao.explicacao}
            </p>
          ) : null}
          <div className="flex justify-end">
            {!respondida ? (
              <Button onClick={confirmar} disabled={selecionada === null}>
                Confirmar
              </Button>
            ) : (
              <Button onClick={proxima}>
                {indice + 1 >= questoes.length ? "Ver resultado" : "Próxima"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
