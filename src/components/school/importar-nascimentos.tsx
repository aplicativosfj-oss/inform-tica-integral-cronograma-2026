import { CalendarPlus, Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/app-store";

interface EntradaImportacao {
  nome: string;
  nascimento: string;
  /** Opcional, só para desempatar nomes iguais em turmas diferentes. */
  turma?: string;
}

/**
 * Compara nomes ignorando acento, caixa, pontuação e apostos como
 * "(Especial)" ou "obs: ...", que aparecem na lista de chamada da escola mas
 * não no cadastro do sistema.
 */
function normalizar(nome: string): string {
  return nome
    .replace(/\(.*?\)/g, " ")
    .replace(/\bobs\.?:.*/gi, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Importação em massa das datas de nascimento, a partir da lista de chamada
 * da secretaria. Digitar 233 datas à mão no cadastro de aluno seria um dia
 * inteiro de trabalho; aqui a lista entra de uma vez, com conferência antes
 * de gravar.
 */
export function ImportarNascimentos() {
  const { turmas, importarAlunos } = useAppStore();
  const [texto, setTexto] = useState("");
  const [previa, setPrevia] = useState<{
    encontrados: { turmaId: string; alunoId: string; nascimento: string }[];
    ausentes: string[];
  } | null>(null);
  const [salvando, setSalvando] = useState(false);

  function conferir() {
    let entradas: EntradaImportacao[];
    try {
      const bruto: unknown = JSON.parse(texto);
      if (!Array.isArray(bruto)) throw new Error("O conteúdo precisa ser uma lista.");
      entradas = bruto as EntradaImportacao[];
    } catch (err) {
      toast.error(`Não consegui ler a lista: ${(err as Error).message}`);
      return;
    }

    const encontrados: { turmaId: string; alunoId: string; nascimento: string }[] = [];
    const ausentes: string[] = [];

    for (const entrada of entradas) {
      if (!entrada?.nome || !/^\d{4}-\d{2}-\d{2}$/.test(entrada.nascimento ?? "")) {
        ausentes.push(`${entrada?.nome ?? "(sem nome)"} — data ausente ou fora do formato`);
        continue;
      }
      const alvo = normalizar(entrada.nome);
      let achou = false;
      for (const turma of turmas) {
        if (entrada.turma && !`${turma.serie} ${turma.letra}`.includes(entrada.turma)) continue;
        const aluno = turma.alunos.find((a) => normalizar(a.nome) === alvo);
        if (aluno) {
          encontrados.push({
            turmaId: turma.id,
            alunoId: aluno.id,
            nascimento: entrada.nascimento,
          });
          achou = true;
          break;
        }
      }
      if (!achou) ausentes.push(entrada.nome);
    }

    setPrevia({ encontrados, ausentes });
  }

  function aplicar() {
    if (!previa || previa.encontrados.length === 0) return;
    setSalvando(true);
    try {
      importarAlunos(
        previa.encontrados.map((item) => ({
          turmaId: item.turmaId,
          alunoId: item.alunoId,
          patch: { nascimento: item.nascimento },
        })),
      );
      toast.success(`${previa.encontrados.length} datas de nascimento gravadas.`);
      setPrevia(null);
      setTexto("");
    } finally {
      setSalvando(false);
    }
  }

  const totalComData = turmas.reduce(
    (soma, turma) => soma + turma.alunos.filter((a) => a.nascimento).length,
    0,
  );
  const totalAlunos = turmas.reduce((soma, turma) => soma + turma.alunos.length, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarPlus className="size-4 text-primary" /> Importar datas de nascimento
        </CardTitle>
        <CardDescription>
          Cole a lista no formato{" "}
          <code className="rounded bg-muted px-1">
            [{"{"}&quot;nome&quot;: &quot;...&quot;, &quot;nascimento&quot;:
            &quot;2019-09-17&quot;{"}"}]
          </code>
          . Os nomes casam com o cadastro ignorando acento, caixa e apostos como
          &quot;(Especial)&quot;. Hoje {totalComData} de {totalAlunos} alunos têm a data preenchida.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Textarea
          rows={6}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setPrevia(null);
          }}
          placeholder='[{"nome": "Anna Lís Bastos dos Santos", "nascimento": "2020-01-05"}]'
          className="font-mono text-xs"
        />

        {previa ? (
          <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
            <p className="text-foreground">
              <strong>{previa.encontrados.length}</strong> aluno(s) encontrados no cadastro.
            </p>
            {previa.ausentes.length > 0 ? (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-muted-foreground">
                  {previa.ausentes.length} nome(s) sem correspondência — clique para ver
                </summary>
                <ul className="mt-1.5 flex max-h-40 flex-col gap-0.5 overflow-y-auto text-xs text-muted-foreground">
                  {previa.ausentes.map((nome) => (
                    <li key={nome}>{nome}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={conferir} disabled={!texto.trim()}>
            Conferir
          </Button>
          <Button
            onClick={aplicar}
            disabled={!previa || previa.encontrados.length === 0 || salvando}
            className="gap-1.5"
          >
            {salvando ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Gravar {previa ? previa.encontrados.length : ""} datas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
