import { BookOpenText, ClipboardCheck, LineChart, PenLine, Sparkles } from "lucide-react";
import { useMemo } from "react";

import { PainelMapaClasse } from "@/components/school/mapa-classe/painel";
import { PainelRendimento } from "@/components/school/rendimento/painel";
import { QuadroReferencia } from "@/components/school/resultados/quadro-referencia";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { gerarDestaques, type Destaque } from "@/lib/resultados/destaques";
import { REFERENCIA } from "@/lib/resultados/referencia";

const TOM: Record<Destaque["tom"], string> = {
  positivo: "border-emerald-500/40 bg-emerald-500/5",
  atencao: "border-amber-500/40 bg-amber-500/5",
  neutro: "border-border bg-muted/30",
};

function Destaques() {
  const lista = useMemo(() => gerarDestaques(), []);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {lista.map((d) => (
        <Card key={d.id} className={TOM[d.tom]}>
          <CardContent className="space-y-1 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4 text-primary" aria-hidden />
              {d.titulo}
            </h3>
            <p className="text-sm text-muted-foreground">{d.texto}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const ABAS = [
  { id: "resumo", nome: "Resumo", Icone: LineChart },
  { id: "mapa", nome: "Leitura e escrita", Icone: BookOpenText },
  { id: "notas", nome: "Notas do bimestre", Icone: ClipboardCheck },
] as const;

/** Página pública dos resultados do bimestre: resumo, mapa de classe e notas. */
export function PainelPublico() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resultados do {REFERENCIA.bimestre}</h1>
        <p className="mt-1 text-muted-foreground">
          {REFERENCIA.escola} · {REFERENCIA.municipio}. Quantos alunos estão em cada nível de
          leitura e de escrita, como foram as notas e o que isso pede de cada turma. Os números são
          por turma: nenhum aluno é identificado.
        </p>
      </div>

      <QuadroReferencia />

      <Tabs defaultValue="resumo" className="space-y-4">
        <TabsList className="h-auto flex-wrap gap-1.5 rounded-full border border-border/60 bg-muted/40 p-1.5">
          {ABAS.map(({ id, nome, Icone }) => (
            <TabsTrigger
              key={id}
              value={id}
              className="gap-1.5 rounded-full px-4 py-2 text-sm font-semibold"
            >
              <Icone className="size-4" aria-hidden /> {nome}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="resumo" className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <PenLine className="size-5" aria-hidden /> O que os números dizem
          </h2>
          <Destaques />
          <p className="text-xs text-muted-foreground">
            Estes textos são gerados a partir dos mesmos números das abas ao lado e se atualizam
            quando os dados mudam.
          </p>
        </TabsContent>

        <TabsContent value="mapa">
          <PainelMapaClasse mostrarProfessor={false} semCabecalho />
        </TabsContent>

        <TabsContent value="notas">
          <PainelRendimento mostrarProfessor={false} semCabecalho />
        </TabsContent>
      </Tabs>
    </div>
  );
}
