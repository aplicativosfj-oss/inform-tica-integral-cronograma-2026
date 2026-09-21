import { CheckCircle2, Clock3, Lock, RotateCcw, Trophy, XCircle } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

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

/** Segundos de leitura obrigatória antes de poder responder — impede clicar sem ler. */
const TEMPO_LEITURA_SEGUNDOS = 4;
/** Depois de errar essa quantidade de vezes, a resposta certa é revelada — ajuda em vez de travar de vez. */
const MAX_TENTATIVAS = 3;

/**
 * Motor genérico de exercício de múltipla escolha, pensado para que a
 * criança precise realmente ler e acertar para avançar (não dá pra "só
 * marcar qualquer coisa" e passar direto):
 *
 * - As opções ficam bloqueadas por alguns segundos (tempo de leitura).
 * - Errar não libera a próxima pergunta: a opção errada é descartada e é
 *   preciso tentar de novo, com a explicação já visível para ajudar.
 * - Depois de algumas tentativas erradas seguidas, a resposta certa é
 *   revelada — o objetivo é ensinar, não deixar a criança presa e
 *   frustrada numa pergunta só.
 *
 * Reaproveitado por praticamente toda atividade de "conteúdo" (história,
 * geografia, gêneros textuais, frações, geometria...) — só muda o banco de
 * perguntas passado em `questoes`.
 */
export function Quiz({
  questoes,
  corBotao = "",
  onConcluir,
}: {
  questoes: Questao[];
  corBotao?: string;
  /** Chamado ao terminar a rodada, com os acertos de primeira e o total. */
  /**
   * Chamado ao terminar a rodada, com os acertos de primeira, o total e,
   * questão a questão, se acertou de primeira (usado no mini-teste).
   */
  onConcluir?: (acertosDeUmaVez: number, total: number, deUmaVez: boolean[]) => void;
}) {
  const [indice, setIndice] = useState(0);
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [descartadas, setDescartadas] = useState<Set<number>>(new Set());
  const [tentativas, setTentativas] = useState(0);
  const [acertouAgora, setAcertouAgora] = useState(false);
  const [revelada, setRevelada] = useState(false);
  const [acertosDeUmaVez, setAcertosDeUmaVez] = useState(0);
  const [deUmaVez, setDeUmaVez] = useState<boolean[]>([]);
  const [concluidas, setConcluidas] = useState(0);
  const [finalizado, setFinalizado] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(TEMPO_LEITURA_SEGUNDOS);

  const questao = questoes[indice];
  const liberada = segundosRestantes <= 0;
  const resolvida = acertouAgora || revelada;

  useEffect(() => {
    setSegundosRestantes(TEMPO_LEITURA_SEGUNDOS);
    const inicio = Date.now();
    const timer = window.setInterval(() => {
      const passado = Math.floor((Date.now() - inicio) / 1000);
      setSegundosRestantes(Math.max(0, TEMPO_LEITURA_SEGUNDOS - passado));
    }, 250);
    return () => window.clearInterval(timer);
  }, [indice]);

  function confirmar() {
    if (selecionada === null || !liberada || resolvida) return;
    if (selecionada === questao?.respostaCorreta) {
      setAcertouAgora(true);
      if (tentativas === 0) setAcertosDeUmaVez((a) => a + 1);
      setDeUmaVez((lista) => {
        const nova = [...lista];
        nova[indice] = tentativas === 0;
        return nova;
      });
      return;
    }
    const novasTentativas = tentativas + 1;
    setTentativas(novasTentativas);
    setDescartadas((atual) => new Set(atual).add(selecionada));
    setSelecionada(null);
    if (novasTentativas >= MAX_TENTATIVAS) setRevelada(true);
  }

  function proxima() {
    setConcluidas((c) => c + 1);
    if (indice + 1 >= questoes.length) {
      setFinalizado(true);
      onConcluir?.(
        acertosDeUmaVez,
        questoes.length,
        questoes.map((_, i) => deUmaVez[i] === true),
      );
      return;
    }
    setIndice((i) => i + 1);
    setSelecionada(null);
    setDescartadas(new Set());
    setTentativas(0);
    setAcertouAgora(false);
    setRevelada(false);
  }

  function reiniciar() {
    setIndice(0);
    setSelecionada(null);
    setDescartadas(new Set());
    setTentativas(0);
    setAcertouAgora(false);
    setRevelada(false);
    setAcertosDeUmaVez(0);
    setDeUmaVez([]);
    setConcluidas(0);
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
    const percentual = Math.round((acertosDeUmaVez / questoes.length) * 100);
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400">
            <Trophy className="size-7" />
          </span>
          <p className="text-lg font-semibold text-foreground">Atividade concluída!</p>
          <p className="text-sm text-muted-foreground">
            Você acertou {acertosDeUmaVez} de {questoes.length} de primeira.
            {percentual >= 80
              ? " Mandou muito bem! 🎉"
              : percentual >= 50
                ? " Muito bom, continue praticando!"
                : " O importante é que você chegou até o fim — vale revisar de novo."}
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
            style={{ width: `${(concluidas / questoes.length) * 100}%` }}
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
              const descartada = descartadas.has(i);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!liberada || resolvida || descartada}
                  onClick={() => setSelecionada(i)}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-lg border p-3 text-left text-sm transition-colors",
                    !liberada && "cursor-not-allowed opacity-50",
                    liberada && !resolvida && !descartada && "cursor-pointer",
                    liberada && !resolvida && marcada && "border-primary bg-primary/5",
                    liberada &&
                      !resolvida &&
                      !marcada &&
                      !descartada &&
                      "border-border/60 hover:bg-muted",
                    descartada &&
                      !resolvida &&
                      "cursor-not-allowed border-destructive/40 bg-destructive/5 opacity-60 line-through",
                    resolvida && correta && "border-emerald-500 bg-emerald-500/10",
                    resolvida && !correta && "cursor-default border-border/60 opacity-60",
                  )}
                >
                  {opcao}
                  {resolvida && correta ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
                  ) : descartada ? (
                    <XCircle className="size-4 shrink-0 text-destructive" />
                  ) : null}
                </button>
              );
            })}
          </div>

          {!liberada ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock3 className="size-3.5" /> Leia com calma... você pode responder em{" "}
              {segundosRestantes}s.
            </p>
          ) : !resolvida && tentativas > 0 ? (
            <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
              <Lock className="size-3.5" /> Essa não era — tente outra opção.
            </p>
          ) : null}

          {resolvida && questao.explicacao ? (
            <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              {revelada && !acertouAgora ? "Resposta certa: " : ""}
              {questao.explicacao}
            </p>
          ) : revelada && !acertouAgora ? (
            <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              A resposta certa era: {questao.opcoes[questao.respostaCorreta]}.
            </p>
          ) : null}

          <div className="flex justify-end">
            {!resolvida ? (
              <Button onClick={confirmar} disabled={selecionada === null || !liberada}>
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
