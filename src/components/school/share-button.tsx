import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/**
 * Compartilha o endereço da página atual. No celular abre a folha nativa do
 * sistema (WhatsApp, e-mail, etc.); onde ela não existe, copia o link e
 * confirma — em vez de não fazer nada.
 */
export function ShareButton() {
  const [copiado, setCopiado] = useState(false);

  async function compartilhar() {
    const url = window.location.href;
    const dados = {
      title: "Agenda de Informática · Escola Dr. Eiraldo Carneiro",
      text: "Cronograma das aulas de informática por turma, dia e horário.",
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(dados);
        return;
      } catch (erro) {
        // Fechar a folha de compartilhamento cancela a promessa. Isso é uma
        // escolha do usuário, não uma falha — não vale avisar nada.
        if (erro instanceof Error && erro.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      toast.success("Link copiado para a área de transferência.");
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("Não foi possível compartilhar neste navegador.");
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={compartilhar}
      aria-label="Compartilhar esta página"
      title="Compartilhar"
      className="text-slate-600 transition-all duration-300 hover:scale-110 hover:bg-blue-500/15 hover:text-blue-700 dark:text-white/70 dark:hover:bg-cyan-300/20 dark:hover:text-cyan-300"
    >
      {copiado ? <Check className="size-4" /> : <Share2 className="size-4" />}
    </Button>
  );
}
