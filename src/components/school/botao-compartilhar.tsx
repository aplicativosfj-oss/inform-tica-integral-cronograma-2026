import { Check, Share2 } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Botão "Compartilhar": abre o menu de compartilhamento do aparelho (WhatsApp,
 * Telegram…) quando existe e, no computador, copia o link. O link é sempre o
 * da página daquele jogo ou ferramenta, para o cartão mostrar a imagem certa.
 */
export function BotaoCompartilhar({
  caminho,
  titulo,
  texto,
  className,
}: {
  /** Endereço relativo, como "/jogos/corrida". */
  caminho: string;
  titulo: string;
  texto?: string;
  className?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  const compartilhar = async () => {
    const url = `${window.location.origin}${caminho}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: titulo, text: texto ?? titulo, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2200);
    } catch {
      // Cancelou o compartilhamento ou o navegador negou a cópia: nada a fazer.
    }
  };

  return (
    <button
      type="button"
      onClick={() => void compartilhar()}
      className={cn(
        "flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors",
        className,
      )}
    >
      {copiado ? <Check className="size-4 text-emerald-400" /> : <Share2 className="size-4" />}
      {copiado ? "Link copiado!" : "Compartilhar"}
    </button>
  );
}
