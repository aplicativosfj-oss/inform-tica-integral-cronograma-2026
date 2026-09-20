import { CheckCircle2, RotateCcw, Trophy, XCircle } from "lucide-react";
import { useState } from "react";

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

type Dificuldade = "facil" | "medio" | "dificil";
type Categoria = "soma" | "subtracao" | "multiplicacao" | "divisao" | "dia-a-dia";

interface Problema {
  enunciado: string;
  resposta: number;
}

const NOMES = [
  "Ana",
  "Pedro",
  "Maria",
  "João",
  "Sofia",
  "Lucas",
  "Laura",
  "Davi",
  "Isabela",
  "Enzo",
];
const ITENS = ["figurinhas", "bolinhas de gude", "lápis", "balas", "livros", "brinquedos", "reais"];

function aleatorio(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function escolher<T>(lista: T[]): T {
  return lista[aleatorio(0, lista.length - 1)]!;
}

function faixa(dificuldade: Dificuldade): [number, number] {
  if (dificuldade === "facil") return [2, 20];
  if (dificuldade === "medio") return [10, 100];
  return [50, 500];
}

function gerarProblema(categoria: Categoria, dificuldade: Dificuldade): Problema {
  const [min, max] = faixa(dificuldade);
  const nome = escolher(NOMES);
  const nome2 = escolher(NOMES.filter((n) => n !== nome));
  const item = escolher(ITENS);

  switch (categoria) {
    case "soma": {
      const a = aleatorio(min, max);
      const b = aleatorio(min, max);
      return {
        enunciado: `${nome} tinha ${a} ${item} e ganhou mais ${b}. Com quantos ${item} ${nome} ficou?`,
        resposta: a + b,
      };
    }
    case "subtracao": {
      const a = aleatorio(min, max);
      const b = aleatorio(0, a);
      return {
        enunciado: `${nome} tinha ${a} ${item} e deu ${b} para ${nome2}. Com quantos ${item} ${nome} ficou?`,
        resposta: a - b,
      };
    }
    case "multiplicacao": {
      const grupos = aleatorio(2, dificuldade === "facil" ? 5 : dificuldade === "medio" ? 9 : 12);
      const porGrupo = aleatorio(2, dificuldade === "facil" ? 5 : dificuldade === "medio" ? 9 : 12);
      return {
        enunciado: `${nome} organizou ${grupos} pacotes com ${porGrupo} ${item} em cada um. Quantos ${item} há ao todo?`,
        resposta: grupos * porGrupo,
      };
    }
    case "divisao": {
      const porGrupo = aleatorio(2, dificuldade === "facil" ? 5 : 10);
      const grupos = aleatorio(2, dificuldade === "facil" ? 5 : 10);
      const total = porGrupo * grupos;
      return {
        enunciado: `${nome} tem ${total} ${item} e quer dividir igualmente entre ${grupos} amigos. Quantos ${item} cada um vai receber?`,
        resposta: porGrupo,
      };
    }
    case "dia-a-dia": {
      const tipo = aleatorio(0, 2);
      if (tipo === 0) {
        const preco = aleatorio(2, 20);
        const quantidade = aleatorio(2, 10);
        return {
          enunciado: `Cada ${item.slice(0, -1)} custa R$ ${preco}. Quanto ${nome} vai pagar por ${quantidade} ${item}?`,
          resposta: preco * quantidade,
        };
      }
      if (tipo === 1) {
        const preco = aleatorio(10, 100);
        const pagou = preco + aleatorio(5, 50);
        return {
          enunciado: `${nome} comprou algo que custava R$ ${preco} e pagou com uma nota de R$ ${pagou}. Quanto de troco ${nome} recebeu?`,
          resposta: pagou - preco,
        };
      }
      const minutosPorDia = aleatorio(10, 60);
      const dias = aleatorio(2, 7);
      return {
        enunciado: `${nome} estuda ${minutosPorDia} minutos por dia. Quantos minutos ${nome} estuda em ${dias} dias?`,
        resposta: minutosPorDia * dias,
      };
    }
  }
}

const CATEGORIAS: { valor: Categoria; label: string }[] = [
  { valor: "soma", label: "Adição" },
  { valor: "subtracao", label: "Subtração" },
  { valor: "multiplicacao", label: "Multiplicação" },
  { valor: "divisao", label: "Divisão" },
  { valor: "dia-a-dia", label: "Situações do dia a dia" },
];

const TOTAL = 8;

export function ProblemasMatematica() {
  const [categoria, setCategoria] = useState<Categoria>("soma");
  const [dificuldade, setDificuldade] = useState<Dificuldade>("facil");
  const [problemas, setProblemas] = useState<Problema[]>(() =>
    Array.from({ length: TOTAL }, () => gerarProblema("soma", "facil")),
  );
  const [indice, setIndice] = useState(0);
  const [resposta, setResposta] = useState("");
  const [respondida, setRespondida] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [finalizado, setFinalizado] = useState(false);

  function iniciar(novaCategoria: Categoria, novaDificuldade: Dificuldade) {
    setCategoria(novaCategoria);
    setDificuldade(novaDificuldade);
    setProblemas(
      Array.from({ length: TOTAL }, () => gerarProblema(novaCategoria, novaDificuldade)),
    );
    setIndice(0);
    setResposta("");
    setRespondida(false);
    setAcertos(0);
    setFinalizado(false);
  }

  const problema = problemas[indice];
  const acertou = Number(resposta) === problema?.resposta;

  function confirmar() {
    if (!resposta) return;
    setRespondida(true);
    if (acertou) setAcertos((a) => a + 1);
  }

  function proxima() {
    if (indice + 1 >= problemas.length) {
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
        <Select value={categoria} onValueChange={(v) => iniciar(v as Categoria, dificuldade)}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIAS.map((c) => (
              <SelectItem key={c.valor} value={c.valor}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dificuldade} onValueChange={(v) => iniciar(categoria, v as Dificuldade)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="facil">Fácil</SelectItem>
            <SelectItem value="medio">Médio</SelectItem>
            <SelectItem value="dificil">Difícil</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {finalizado ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Trophy className="size-7" />
            </span>
            <p className="text-lg font-semibold text-foreground">
              Você acertou {acertos} de {problemas.length}!
            </p>
            <Button onClick={() => iniciar(categoria, dificuldade)} className="mt-2 gap-1.5">
              <RotateCcw className="size-4" /> Novos problemas
            </Button>
          </CardContent>
        </Card>
      ) : problema ? (
        <>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${((indice + (respondida ? 1 : 0)) / problemas.length) * 100}%` }}
            />
          </div>
          <Card>
            <CardContent className="flex flex-col gap-4 p-5">
              <p className="text-base font-medium text-foreground">{problema.enunciado}</p>
              <Input
                type="number"
                inputMode="numeric"
                value={resposta}
                disabled={respondida}
                onChange={(e) => setResposta(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !respondida && confirmar()}
                placeholder="Sua resposta"
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
                      <CheckCircle2 className="size-4" /> Certinho!
                    </>
                  ) : (
                    <>
                      <XCircle className="size-4" /> A resposta certa era {problema.resposta}.
                    </>
                  )}
                </p>
              ) : null}
              <div className="flex justify-end">
                <Button
                  onClick={respondida ? proxima : confirmar}
                  disabled={!respondida && !resposta}
                >
                  {respondida
                    ? indice + 1 >= problemas.length
                      ? "Ver resultado"
                      : "Próximo"
                    : "Confirmar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
