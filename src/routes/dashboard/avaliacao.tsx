import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Loader2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/school/dashboard-shell";
import { supabase } from "@/lib/supabase-client";
import template from "@/lib/observatorio-template.html?raw";

export const Route = createFileRoute("/dashboard/avaliacao")({
  component: AvaliacaoPage,
  head: () => ({
    meta: [
      { title: "Avaliação diagnóstica · Painel de gestão" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

// Mesmo id usado na importação: cada aplicação da SEME vira uma linha.
const AVALIACAO_ID = "2026-II";

interface Turma {
  ano: number;
  turma: string;
  disc: string;
  hab: Record<string, string>;
  alunos: { nome: string; r: string; esc?: string }[];
}

function validar(dados: unknown): dados is Turma[] {
  return (
    Array.isArray(dados) &&
    dados.length > 0 &&
    dados.every(
      (t) =>
        typeof t?.ano === "number" &&
        typeof t?.turma === "string" &&
        ["LP", "MAT", "CN"].includes(t?.disc) &&
        Array.isArray(t?.alunos),
    )
  );
}

function AvaliacaoPage() {
  const [dados, setDados] = useState<Turma[] | null>(null);
  const [atualizado, setAtualizado] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase
      .from("avaliacao_diagnostica")
      .select("dados, atualizado_em")
      .eq("id", AVALIACAO_ID)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast.error("Não foi possível carregar a avaliação: " + error.message);
        if (data) {
          setDados(data.dados as Turma[]);
          setAtualizado(data.atualizado_em as string);
        }
        setCarregando(false);
      });
  }, []);

  async function importar(file: File) {
    setEnviando(true);
    try {
      const json: unknown = JSON.parse(await file.text());
      if (!validar(json)) {
        toast.error("Arquivo inválido. Escolha o dados.json gerado a partir das planilhas da SEME.");
        return;
      }
      const { error } = await supabase.from("avaliacao_diagnostica").upsert({
        id: AVALIACAO_ID,
        titulo: "II Avaliação Diagnóstica 2026",
        dados: json,
        atualizado_em: new Date().toISOString(),
      });
      if (error) {
        toast.error("Não foi possível salvar: " + error.message);
        return;
      }
      setDados(json);
      setAtualizado(new Date().toISOString());
      toast.success(`Importado: ${json.length} provas.`);
    } catch {
      toast.error("Não foi possível ler o arquivo. Ele precisa ser um JSON.");
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const srcDoc = useMemo(() => {
    if (!dados) return "";
    const json = JSON.stringify(dados).replace(/</g, "\\u003c");
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0">${template.replace("/*DATA*/", json)}</body></html>`;
  }, [dados]);

  const botaoImportar = (
    <>
      <input
        ref={inputRef}
        id="importar-avaliacao"
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void importar(f);
        }}
      />
      <Button
        variant={dados ? "outline" : "default"}
        disabled={enviando}
        onClick={() => inputRef.current?.click()}
      >
        {enviando ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        {dados ? "Substituir dados" : "Importar dados"}
      </Button>
    </>
  );

  return (
    <DashboardShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <BarChart3 className="size-6 text-primary" /> Avaliação diagnóstica
          </h1>
          <p className="text-sm text-muted-foreground">
            II Avaliação Diagnóstica 2026 (SEME), do 1º ao 5º ano.
            {atualizado &&
              ` Dados atualizados em ${new Date(atualizado).toLocaleString("pt-BR")}.`}
          </p>
        </div>
        {botaoImportar}
      </div>

      {carregando ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : dados ? (
        <iframe
          title="Observatório pedagógico"
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-modals"
          className="h-[calc(100vh-11rem)] min-h-[600px] w-full rounded-xl border border-border bg-background"
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum dado importado ainda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Clique em <b>Importar dados</b> e escolha o arquivo <code>dados.json</code> da pasta{" "}
              <code>avaliacao-diagnostica</code> no computador da coordenação. Ele reúne as 30
              planilhas de tabulação da II Avaliação Diagnóstica.
            </p>
            <p>
              Os dados ficam no banco do site e só aparecem para quem está logado na conta de
              gestão.
            </p>
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  );
}
