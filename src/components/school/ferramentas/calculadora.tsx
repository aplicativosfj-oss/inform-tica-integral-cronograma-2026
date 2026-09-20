import { useState } from "react";

import { cn } from "@/lib/utils";

const TECLAS = [
  ["C", "±", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["0", ",", "="],
] as const;

function calcular(a: number, op: string, b: number): number {
  switch (op) {
    case "+":
      return a + b;
    case "−":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? NaN : a / b;
    default:
      return b;
  }
}

function formatar(valor: number): string {
  if (Number.isNaN(valor)) return "Erro";
  const arredondado = Math.round(valor * 1e10) / 1e10;
  return arredondado.toLocaleString("pt-BR", { maximumFractionDigits: 10 });
}

export function Calculadora() {
  const [visor, setVisor] = useState("0");
  const [acumulado, setAcumulado] = useState<number | null>(null);
  const [operador, setOperador] = useState<string | null>(null);
  const [aguardandoNovo, setAguardandoNovo] = useState(false);

  function digitar(digito: string) {
    if (aguardandoNovo || visor === "0") {
      setVisor(digito === "," ? "0," : digito);
      setAguardandoNovo(false);
      return;
    }
    if (digito === "," && visor.includes(",")) return;
    setVisor((v) => v + digito);
  }

  function escolherOperador(op: string) {
    const atual = Number(visor.replace(",", "."));
    if (acumulado !== null && operador && !aguardandoNovo) {
      const resultado = calcular(acumulado, operador, atual);
      setAcumulado(resultado);
      setVisor(formatar(resultado));
    } else {
      setAcumulado(atual);
    }
    setOperador(op);
    setAguardandoNovo(true);
  }

  function igual() {
    if (acumulado === null || operador === null) return;
    const atual = Number(visor.replace(",", "."));
    const resultado = calcular(acumulado, operador, atual);
    setVisor(formatar(resultado));
    setAcumulado(null);
    setOperador(null);
    setAguardandoNovo(true);
  }

  function limpar() {
    setVisor("0");
    setAcumulado(null);
    setOperador(null);
    setAguardandoNovo(false);
  }

  function inverterSinal() {
    setVisor((v) => (v.startsWith("-") ? v.slice(1) : v === "0" ? v : `-${v}`));
  }

  function porcentagem() {
    const atual = Number(visor.replace(",", "."));
    setVisor(formatar(atual / 100));
  }

  function pressionar(tecla: string) {
    if (tecla === "C") return limpar();
    if (tecla === "±") return inverterSinal();
    if (tecla === "%") return porcentagem();
    if (tecla === "=") return igual();
    if (["+", "−", "×", "÷"].includes(tecla)) return escolherOperador(tecla);
    digitar(tecla);
  }

  return (
    <div className="mx-auto flex max-w-xs flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="rounded-xl bg-muted/60 px-4 py-6 text-right">
        <p className="truncate font-mono text-3xl font-semibold text-foreground">{visor}</p>
        {operador ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {formatar(acumulado ?? 0)} {operador}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {TECLAS.flat().map((tecla, i) => (
          <button
            key={`${tecla}-${i}`}
            type="button"
            onClick={() => pressionar(tecla)}
            className={cn(
              "flex h-14 cursor-pointer items-center justify-center rounded-xl text-lg font-medium transition-colors active:scale-95",
              tecla === "="
                ? "col-span-2 bg-primary text-primary-foreground hover:bg-primary/90"
                : ["+", "−", "×", "÷"].includes(tecla)
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : tecla === "C"
                    ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                    : "bg-muted text-foreground hover:bg-muted/70",
            )}
          >
            {tecla}
          </button>
        ))}
      </div>
    </div>
  );
}
