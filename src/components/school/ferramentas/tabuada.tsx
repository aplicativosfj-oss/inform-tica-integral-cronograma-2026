import { CheckCircle2, RotateCcw, Trophy, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TOTAL_PERGUNTAS = 10;
const TODAS = "todas";

function gerarPerguntas(tabuadaEscolhida: string): { a: number; b: number }[] {
  const fixo = tabuadaEscolhida === TODAS ? null : Number(tabuadaEscolhida);
  const perguntas: { a: number; b: number }[] = [];
  for (let i = 0; i < TOTAL_PERGUNTAS; i++) {
    const a = fixo ?? Math.floor(Math.random() * 9) + 2;
    const b = Math.floor(Math.random() * 9) + 2;
    perguntas.push({ a, b });
  }
  return perguntas;
}

export function TabuadaJogo() {
  const [tabuadaEscolhida, setTabuadaEscolhida] = useState(TODAS);
  const [perguntas, setPerguntas] = useState(() => gerarPerguntas(TODAS));
  const [indice, setIndice] = useState(0);
  const [resposta, setResposta] = useState("");
  const [respondida, setRespondida] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [finalizado, setFinalizado] = useState(false);

  const pergunta = perguntas[indice];
  const respostaCerta = useMemo(() => (pergunta ? pergunta.a * pergunta.b : 0), [pergunta]);
  const acertou = Number(resposta) === respostaCerta;

  function iniciar(tabuada: string) {
    setTabuadaEscolhida(tabuada);
    setPerguntas(gerarPerguntas(tabuada));
    setIndice(0);
    setResposta("");
    setRespondida(false);
    setAcertos(0);
    setFinalizado(false);
  }

  function confirmar() {
    if (!resposta) return;
    setRespondida(true);
    if (acertou) setAcertos((a) => a + 1);
  }

  function proxima() {
    if (indice + 1 >= perguntas.length) {
      setFinalizado(true);
      return;
    }
    setIndice((i) => i + 1);
    setResposta("");
    setRespondida(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={tabuadaEscolhida} onValueChange={iniciar}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todas as tabuadas</SelectItem>
            {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => (
              <SelectItem key={n} value={String(n)}>
                Tabuada do {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {TOTAL_PERGUNTAS} perguntas por rodada
        </span>
      </div>

      {finalizado ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Trophy className="size-7" />
            </span>
            <p className="text-lg font-semibold text-foreground">
              Você acertou {acertos} de {perguntas.length}!
            </p>
            <Button onClick={() => iniciar(tabuadaEscolhida)} className="mt-2 gap-1.5">
              <RotateCcw className="size-4" /> Jogar de novo
            </Button>
          </CardContent>
        </Card>
      ) : pergunta ? (
        <>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${((indice + (respondida ? 1 : 0)) / perguntas.length) * 100}%` }}
            />
          </div>
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <p className="text-4xl font-bold tracking-tight text-foreground">
                {pergunta.a} × {pergunta.b} = ?
              </p>
              <Input
                type="number"
                inputMode="numeric"
                value={resposta}
                disabled={respondida}
                onChange={(e) => setResposta(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !respondida && confirmar()}
                className="w-32 text-center text-xl font-semibold"
                autoFocus
              />
              {respondida ? (
                <p
                  className={`flex items-center gap-1.5 text-sm font-medium ${
                    acertou ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                  }`}
                >
                  {acertou ? (
                    <>
                      <CheckCircle2 className="size-4" /> Isso aí!
                    </>
                  ) : (
                    <>
                      <XCircle className="size-4" /> A resposta certa era {respostaCerta}.
                    </>
                  )}
                </p>
              ) : null}
              <Button
                onClick={respondida ? proxima : confirmar}
                disabled={!respondida && !resposta}
              >
                {respondida
                  ? indice + 1 >= perguntas.length
                    ? "Ver resultado"
                    : "Próxima"
                  : "Confirmar"}
              </Button>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
