import { HelpCircle, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useConfirmar } from "@/lib/confirm-store";

const COLUNAS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const LINHAS = 15;
// `sessionStorage`, não `localStorage`: num computador compartilhado do
// laboratório, a planilha de um aluno não pode continuar visível pro
// próximo que abrir a ferramenta sem estar logado — sessão de cada um dura
// só enquanto a aba dele estiver aberta.
const CHAVE = "informatica:planilha";

type Celulas = Record<string, string>;

function idCelula(col: string, linha: number): string {
  return `${col}${linha}`;
}

/** Parser aritmético simples (tokeniza + descida recursiva) — evita usar eval/Function em texto digitado pelo usuário. */
function avaliarExpressao(expr: string): number {
  let pos = 0;
  function espacos() {
    while (expr[pos] === " ") pos++;
  }
  function numero(): number {
    espacos();
    if (expr[pos] === "(") {
      pos++;
      const valor = expressao();
      espacos();
      if (expr[pos] === ")") pos++;
      return valor;
    }
    const inicio = pos;
    if (expr[pos] === "-") pos++;
    while (pos < expr.length && /[0-9.]/.test(expr[pos]!)) pos++;
    const trecho = expr.slice(inicio, pos);
    const valor = Number(trecho);
    if (trecho === "" || Number.isNaN(valor)) throw new Error("expressão inválida");
    return valor;
  }
  function termo(): number {
    let valor = numero();
    espacos();
    while (expr[pos] === "*" || expr[pos] === "/") {
      const op = expr[pos];
      pos++;
      const direita = numero();
      valor = op === "*" ? valor * direita : valor / direita;
      espacos();
    }
    return valor;
  }
  function expressao(): number {
    let valor = termo();
    espacos();
    while (expr[pos] === "+" || expr[pos] === "-") {
      const op = expr[pos];
      pos++;
      const direita = termo();
      valor = op === "+" ? valor + direita : valor - direita;
      espacos();
    }
    return valor;
  }
  const resultado = expressao();
  espacos();
  if (pos !== expr.length) throw new Error("expressão inválida");
  return resultado;
}

function expandirIntervalo(intervalo: string): string[] {
  const [inicioRef, fimRef] = intervalo.split(":");
  const m1 = inicioRef?.match(/^([A-H])(\d+)$/);
  const m2 = fimRef?.match(/^([A-H])(\d+)$/);
  if (!m1 || !m2) return [];
  const colIni = COLUNAS.indexOf(m1[1]!);
  const colFim = COLUNAS.indexOf(m2[1]!);
  const linIni = Number(m1[2]);
  const linFim = Number(m2[2]);
  const ids: string[] = [];
  for (let c = Math.min(colIni, colFim); c <= Math.max(colIni, colFim); c++) {
    for (let l = Math.min(linIni, linFim); l <= Math.max(linIni, linFim); l++) {
      ids.push(idCelula(COLUNAS[c]!, l));
    }
  }
  return ids;
}

function valorNumerico(celulas: Celulas, id: string, visitados: Set<string>): number {
  if (visitados.has(id)) return 0;
  visitados.add(id);
  const bruto = calcularCelula(celulas, id, visitados);
  const n = Number(bruto.replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
}

function calcularCelula(celulas: Celulas, id: string, visitados: Set<string> = new Set()): string {
  const bruto = celulas[id];
  if (!bruto) return "";
  if (!bruto.startsWith("=")) return bruto;

  const formula = bruto.slice(1).trim();
  const somaMatch = formula.match(/^SOMA\(([^)]+)\)$/i);
  if (somaMatch) {
    const total = expandirIntervalo(somaMatch[1]!).reduce(
      (acc, ref) => acc + valorNumerico(celulas, ref, new Set(visitados)),
      0,
    );
    return String(total);
  }
  const mediaMatch = formula.match(/^MEDIA\(([^)]+)\)$/i);
  if (mediaMatch) {
    const refs = expandirIntervalo(mediaMatch[1]!);
    if (refs.length === 0) return "0";
    const total = refs.reduce(
      (acc, ref) => acc + valorNumerico(celulas, ref, new Set(visitados)),
      0,
    );
    return String(total / refs.length);
  }

  try {
    const substituida = formula.replace(/[A-H]\d+/gi, (ref) =>
      String(valorNumerico(celulas, ref.toUpperCase(), new Set(visitados))),
    );
    return String(avaliarExpressao(substituida));
  } catch {
    return "#ERRO";
  }
}

export function Planilha() {
  const confirmar = useConfirmar();
  const [celulas, setCelulas] = useState<Celulas>(() => {
    try {
      const salvo = sessionStorage.getItem(CHAVE);
      return salvo ? (JSON.parse(salvo) as Celulas) : {};
    } catch {
      return {};
    }
  });
  const [editando, setEditando] = useState<string | null>(null);
  const [valorEditando, setValorEditando] = useState("");

  function salvar(novas: Celulas) {
    setCelulas(novas);
    sessionStorage.setItem(CHAVE, JSON.stringify(novas));
  }

  function iniciarEdicao(id: string) {
    setEditando(id);
    setValorEditando(celulas[id] ?? "");
  }

  function confirmarEdicao() {
    if (!editando) return;
    const novas = { ...celulas };
    if (valorEditando.trim() === "") delete novas[editando];
    else novas[editando] = valorEditando;
    salvar(novas);
    setEditando(null);
  }

  async function limparTudo() {
    const ok = await confirmar({
      titulo: "Limpar toda a planilha?",
      descricao: "Isso não pode ser desfeito.",
    });
    if (!ok) return;
    salvar({});
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/40 p-2.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <HelpCircle className="size-3.5 shrink-0" />
          Dica: digite números direto, ou fórmulas como <code className="font-mono">
            =A1+B1
          </code>, <code className="font-mono">=SOMA(A1:A5)</code> ou{" "}
          <code className="font-mono">=MEDIA(A1:A5)</code>.
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-destructive hover:bg-destructive/10"
          onClick={limparTudo}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-10 border-b border-r border-border/60 bg-muted/60" />
              {COLUNAS.map((col) => (
                <th
                  key={col}
                  className="min-w-24 border-b border-r border-border/60 bg-muted/60 px-2 py-1.5 text-xs font-semibold text-muted-foreground"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: LINHAS }, (_, i) => i + 1).map((linha) => (
              <tr key={linha}>
                <td className="border-b border-r border-border/60 bg-muted/60 px-2 py-1 text-center text-xs font-semibold text-muted-foreground">
                  {linha}
                </td>
                {COLUNAS.map((col) => {
                  const id = idCelula(col, linha);
                  const emEdicao = editando === id;
                  return (
                    <td key={id} className="border-b border-r border-border/60 p-0">
                      {emEdicao ? (
                        <input
                          autoFocus
                          value={valorEditando}
                          onChange={(e) => setValorEditando(e.target.value)}
                          onBlur={confirmarEdicao}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") confirmarEdicao();
                            if (e.key === "Escape") setEditando(null);
                          }}
                          className="w-full min-w-24 bg-background px-2 py-1 font-mono text-xs outline-none ring-1 ring-ring"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => iniciarEdicao(id)}
                          className="block w-full min-w-24 cursor-cell px-2 py-1 text-left text-xs text-foreground hover:bg-muted/40"
                        >
                          {calcularCelula(celulas, id) || " "}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">Salvo automaticamente neste computador.</p>
    </div>
  );
}
