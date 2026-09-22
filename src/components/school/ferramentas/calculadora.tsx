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

export function Calculadora({
  compacta = false,
  moldura = true,
}: {
  compacta?: boolean;
  /** Desligue quando quem chama já desenha a caixa (ex.: a janela flutuante). */
  moldura?: boolean;
} = {}) {
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
    <div
      className={cn(
        "mx-auto flex flex-col",
        // A versão compacta é usada onde o espaço é curto (a janela
        // flutuante): ocupa bem menos altura sem perder o toque.
        compacta ? "max-w-[15rem] gap-2" : "max-w-xs gap-3",
        moldura
          ? cn("rounded-2xl border border-border/60 bg-card shadow-sm", compacta ? "p-2.5" : "p-4")
          : null,
      )}
    >
      <div
        className={cn(
          "rounded-xl bg-muted/60 text-right",
          compacta ? "px-3 py-[clamp(0.25rem,1.2vh,0.625rem)]" : "px-4 py-6",
        )}
      >
        <p
          className={cn(
            "truncate font-mono font-semibold text-foreground",
            compacta ? "text-[clamp(1rem,2.6vh,1.25rem)]" : "text-3xl",
          )}
        >
          {visor}
        </p>
        {/* A linha do operador ocupa espaço mesmo vazia: sem isso a caixa
          mudava de altura a cada operação e a borda de baixo ficava pulando. */}
        <p
          className={cn("mt-1 truncate text-xs text-muted-foreground", !operador && "invisible")}
          aria-hidden={!operador}
        >
          {operador ? `${formatar(acumulado ?? 0)} ${operador}` : " "}
        </p>
      </div>
      <div className={cn("grid grid-cols-4", compacta ? "gap-1.5" : "gap-2")}>
        {TECLAS.flat().map((tecla, i) => (
          <button
            key={`${tecla}-${i}`}
            type="button"
            onClick={() => pressionar(tecla)}
            className={cn(
              "flex cursor-pointer items-center justify-center rounded-xl font-medium transition-colors active:scale-95",
              // Na versão compacta as teclas encolhem junto com a altura da
              // tela, para a calculadora caber inteira em telas baixas sem
              // precisar de barra de rolagem.
              compacta ? "h-[clamp(1.75rem,4vh,2.25rem)] text-[clamp(0.75rem,1.9vh,0.875rem)]" : "h-14 text-lg",
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
