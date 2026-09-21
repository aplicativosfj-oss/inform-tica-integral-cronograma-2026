import { LogOut, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

function iniciais(nome: string): string {
  return nome
    .replace(/^(prof(a)?\.?|profa\.?)\s+/i, "")
    .split(/\s+/)
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

/**
 * Barra de sessão ativa: deixa claro, em qualquer área protegida, com qual
 * conta a pessoa está conectada — e desde quando — com o botão de sair à mão.
 */
export function SessaoAtiva({
  nome,
  papel,
  detalhe,
  desde,
  aviso,
  onSair,
}: {
  nome: string;
  papel: string;
  detalhe?: string | undefined;
  /** ISO da hora de entrada. */
  desde?: string | undefined;
  /** Observação em destaque (ex.: acesso pela senha mestra). */
  aviso?: string | undefined;
  onSair?: (() => void) | undefined;
}) {
  const hora = desde
    ? new Date(desde).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div
      role="status"
      className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-card to-card px-4 py-3 shadow-sm"
    >
      <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white ring-2 ring-emerald-500/30">
        {iniciais(nome) || "?"}
        <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card bg-emerald-400" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="size-3.5" /> Sessão ativa · você está conectado(a) como
        </p>
        <p className="truncate text-sm text-foreground">
          <strong className="text-base">{nome}</strong>
          <span className="text-muted-foreground">
            {" "}
            · {papel}
            {detalhe ? ` · ${detalhe}` : ""}
            {hora ? ` · desde ${hora}` : ""}
          </span>
        </p>
        {aviso ? (
          <p className="mt-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">{aviso}</p>
        ) : null}
      </div>
      {onSair ? (
        <Button size="sm" variant="outline" className="shrink-0 gap-1.5" onClick={onSair}>
          <LogOut className="size-3.5" /> Sair
        </Button>
      ) : null}
    </div>
  );
}
