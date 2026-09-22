import { Minus, Plus } from "lucide-react";
import { useId, type ReactNode } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * Campos das ferramentas, num lugar só.
 *
 * O `<input type="number">` do navegador traz aquelas setinhas minúsculas
 * coladas na borda: some no celular, muda de desenho a cada navegador e é
 * alvo pequeno demais para dedo de criança. Aqui elas são desligadas e, no
 * lugar, entram botões − e + de verdade. O mesmo vale para o `<select>`
 * cinza do sistema, trocado pelo seletor do próprio site.
 */

/** Esconde o spinner nativo em todos os navegadores. */
const SEM_SPINNER =
  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0";

export function CampoNumero({
  valor,
  aoMudar,
  min = 0,
  max = 9999,
  rotulo,
  sufixo,
  largura = "w-20",
  tamanho = "md",
  comBotoes = true,
  placeholder,
  aoTeclarEnter,
}: {
  valor: number | "";
  aoMudar: (v: number) => void;
  min?: number;
  max?: number;
  /** Lido por leitor de tela; não aparece na tela. */
  rotulo: string;
  sufixo?: ReactNode;
  largura?: string;
  tamanho?: "sm" | "md" | "lg";
  comBotoes?: boolean;
  placeholder?: string;
  aoTeclarEnter?: () => void;
}) {
  const alturas = { sm: "h-7 text-sm", md: "h-9 text-base", lg: "h-11 text-xl" };
  const botoes = { sm: "size-7", md: "size-9", lg: "size-11" };
  const icones = { sm: "size-3", md: "size-4", lg: "size-5" };
  const num = typeof valor === "number" ? valor : NaN;

  function limitar(v: number) {
    aoMudar(Math.min(max, Math.max(min, v)));
  }

  return (
    <div className="inline-flex items-center gap-1">
      {comBotoes && (
        <button
          type="button"
          aria-label={`Diminuir ${rotulo}`}
          disabled={!Number.isNaN(num) && num <= min}
          onClick={() => limitar((Number.isNaN(num) ? min : num) - 1)}
          className={cn(
            "flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40",
            botoes[tamanho],
          )}
        >
          <Minus className={icones[tamanho]} />
        </button>
      )}
      <input
        type="number"
        inputMode="numeric"
        aria-label={rotulo}
        value={valor}
        min={min}
        max={max}
        placeholder={placeholder}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") return aoMudar(NaN);
          const n = Number(v);
          if (Number.isFinite(n)) limitar(Math.round(n));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") aoTeclarEnter?.();
        }}
        className={cn(
          "rounded-lg border border-border bg-background text-center font-bold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20",
          SEM_SPINNER,
          alturas[tamanho],
          largura,
        )}
      />
      {sufixo && <span className="text-sm text-muted-foreground">{sufixo}</span>}
      {comBotoes && (
        <button
          type="button"
          aria-label={`Aumentar ${rotulo}`}
          disabled={!Number.isNaN(num) && num >= max}
          onClick={() => limitar((Number.isNaN(num) ? min : num) + 1)}
          className={cn(
            "flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40",
            botoes[tamanho],
          )}
        >
          <Plus className={icones[tamanho]} />
        </button>
      )}
    </div>
  );
}

/** Campo de resposta livre: sem setinha e com foco bem visível. */
export function CampoResposta({
  valor,
  aoMudar,
  rotulo,
  placeholder,
  aoTeclarEnter,
  largura = "w-32",
}: {
  valor: string;
  aoMudar: (v: string) => void;
  rotulo: string;
  placeholder?: string;
  aoTeclarEnter?: () => void;
  largura?: string;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      aria-label={rotulo}
      value={valor}
      placeholder={placeholder}
      onChange={(e) => aoMudar(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") aoTeclarEnter?.();
      }}
      className={cn(
        "h-10 rounded-lg border border-border bg-background px-3 text-center text-base font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20",
        SEM_SPINNER,
        largura,
      )}
    />
  );
}

export interface Opcao {
  valor: string;
  rotulo: string;
}

/** Seletor do site, no lugar do `<select>` cinza do sistema. */
export function Seletor({
  valor,
  aoMudar,
  opcoes,
  rotulo,
  largura = "w-auto min-w-[5rem]",
  tamanho = "md",
}: {
  valor: string;
  aoMudar: (v: string) => void;
  opcoes: Opcao[];
  rotulo: string;
  largura?: string;
  tamanho?: "sm" | "md";
}) {
  const id = useId();
  return (
    <Select value={valor} onValueChange={aoMudar}>
      <SelectTrigger
        id={id}
        aria-label={rotulo}
        className={cn(
          "cursor-pointer font-semibold",
          tamanho === "sm" ? "h-8 text-xs" : "h-9 text-sm",
          largura,
        )}
      >
        <SelectValue placeholder={rotulo} />
      </SelectTrigger>
      <SelectContent>
        {opcoes.map((o) => (
          <SelectItem key={o.valor} value={o.valor} className="cursor-pointer">
            {o.rotulo}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
